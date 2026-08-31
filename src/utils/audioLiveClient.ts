/**
 * Audio processing utilities for Gemini 3.1 Flash Live API (Voice Conversations)
 * Input: 16kHz 16-bit Linear PCM Little-Endian
 * Output: 24kHz 16-bit Linear PCM Little-Endian
 */

export function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToPcm16AudioBuffer(
  audioCtx: AudioContext,
  base64Data: string,
  sampleRate: number = 24000
): AudioBuffer {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const numSamples = Math.floor(bytes.length / 2);
  const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < numSamples; i++) {
    const int16 = view.getInt16(i * 2, true);
    channelData[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return audioBuffer;
}

export class LiveVoiceSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error', error?: string) => void;
  private onVolumeChange?: (volume: number) => void;

  constructor(
    onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error', error?: string) => void,
    onVolumeChange?: (volume: number) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onVolumeChange = onVolumeChange;
  }

  public async start(): Promise<void> {
    try {
      this.onStatusChange?.('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      this.ws.onopen = async () => {
        console.log("Live Voice WebSocket connected");
        await this.startMicrophone();
        this.onStatusChange?.('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ready) {
            this.onStatusChange?.('listening');
          }
          if (msg.interrupted) {
            this.stopPlayback();
            this.onStatusChange?.('listening');
          }
          if (msg.audio) {
            this.onStatusChange?.('speaking');
            this.playAudio(msg.audio);
          }
          if (msg.error) {
            console.error("Live session error:", msg.error);
            this.onStatusChange?.('error', msg.error);
          }
        } catch (e) {
          console.error("Failed to parse live message:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        this.onStatusChange?.('error', 'Connection to Gemini Live API failed.');
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        this.cleanup();
        this.onStatusChange?.('disconnected');
      };

    } catch (err: any) {
      console.error("Error starting live voice session:", err);
      this.cleanup();
      this.onStatusChange?.('error', err.message || 'Microphone access denied or audio initialization failed.');
    }
  }

  private async startMicrophone(): Promise<void> {
    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });

    this.source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
    this.processor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const channelData = e.inputBuffer.getChannelData(0);
      
      // Calculate instant RMS volume for visualizer
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      this.onVolumeChange?.(Math.min(1, rms * 4));

      const base64Pcm = float32ToPcm16Base64(channelData);
      this.ws.send(JSON.stringify({ audio: base64Pcm }));
    };
  }

  private playAudio(base64Audio: string): void {
    if (!this.outputAudioCtx) return;

    try {
      const buffer = base64ToPcm16AudioBuffer(this.outputAudioCtx, base64Audio, 24000);
      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05; // 50ms jitter buffer
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;

      this.activeSources.push(sourceNode);
      sourceNode.onended = () => {
        const index = this.activeSources.indexOf(sourceNode);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        if (this.activeSources.length === 0 && this.outputAudioCtx && this.outputAudioCtx.currentTime >= this.nextStartTime - 0.1) {
          this.onStatusChange?.('listening');
        }
      };
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  private stopPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch (e) {
        // ignore
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  public sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public stop(): void {
    this.cleanup();
    this.onStatusChange?.('disconnected');
  }

  private cleanup(): void {
    this.stopPlayback();

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
