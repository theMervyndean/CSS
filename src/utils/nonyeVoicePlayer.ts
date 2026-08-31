/**
 * Nonye AI High-Fidelity Voice Player & Neural Speech Pipeline
 * Combines custom uploaded voice recordings, Neural Voice API,
 * and warm Acoustic Web Audio equalization for natural, non-robotic speech.
 */

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;

export const CUSTOM_VOICE_STORAGE_KEY = 'nonye_custom_voice_sample';
export const VOICE_STYLE_STORAGE_KEY = 'nonye_voice_style';

export function getCustomVoiceSample(): string | null {
  try {
    return localStorage.getItem(CUSTOM_VOICE_STORAGE_KEY) || localStorage.getItem('chinonye_custom_voice_sample');
  } catch {
    return null;
  }
}

export function saveCustomVoiceSample(dataUrl: string): void {
  try {
    localStorage.setItem(CUSTOM_VOICE_STORAGE_KEY, dataUrl);
  } catch (e) {
    console.warn("Failed to persist voice sample to localStorage", e);
  }
}

export function removeCustomVoiceSample(): void {
  try {
    localStorage.removeItem(CUSTOM_VOICE_STORAGE_KEY);
    localStorage.removeItem('chinonye_custom_voice_sample');
  } catch (e) {
    console.warn("Failed to remove voice sample", e);
  }
}

export function stopNonyeVoice(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (activeAudioContext && activeAudioContext.state !== 'closed') {
    try {
      activeAudioContext.close();
    } catch {}
    activeAudioContext = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export const stopChinonyeVoice = stopNonyeVoice;

interface PlayVoiceOptions {
  text: string;
  isGreetingOrProfile?: boolean;
  voiceStyle?: 'fluent' | 'neutral';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export async function playNonyeVoice({
  text,
  isGreetingOrProfile = false,
  voiceStyle = 'fluent',
  onStart,
  onEnd,
  onError
}: PlayVoiceOptions): Promise<void> {
  stopNonyeVoice();

  // 1. If this is a greeting/profile request and user uploaded/recorded a custom voice sample, play the real human recording!
  const customSample = getCustomVoiceSample();
  if (customSample) {
    try {
      const audio = new Audio(customSample);
      activeAudioElement = audio;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        activeAudioElement = null;
        onEnd?.();
      };
      audio.onerror = (e) => {
        console.warn("Custom voice playback error, trying neural API:", e);
        activeAudioElement = null;
        playNeuralVoiceOrAcoustic(text, voiceStyle, isGreetingOrProfile, onStart, onEnd, onError);
      };

      await audio.play();
      return;
    } catch (err) {
      console.warn("Error playing custom audio, trying neural API:", err);
    }
  }

  // 2. Play Neural Voice or Acoustic Engine
  await playNeuralVoiceOrAcoustic(text, voiceStyle, isGreetingOrProfile, onStart, onEnd, onError);
}

export const playChinonyeVoice = playNonyeVoice;

export async function speakNonyeVoice(text: string, onEnd?: () => void): Promise<void> {
  return playNonyeVoice({
    text,
    onEnd
  });
}

async function playNeuralVoiceOrAcoustic(
  text: string,
  voiceStyle: 'fluent' | 'neutral',
  isGreetingOrProfile: boolean,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  // Try Neural TTS API (/api/ai/tts) for high-fidelity speech
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceStyle })
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('audio/')) {
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeAudioElement = audio;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        activeAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        activeAudioElement = null;
        if (!isGreetingOrProfile) {
          fallbackAcousticSynthesis(text, voiceStyle, onStart, onEnd, onError);
        } else {
          onEnd?.();
        }
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.info("Neural TTS endpoint notice:", err);
  }

  // If greeting and no custom voice or neural audio, avoid robotic browser TTS
  if (isGreetingOrProfile) {
    onError?.(new Error("Please upload or record the real Nonye AI voice sample to enable authentic greeting playback."));
    onEnd?.();
    return;
  }

  // For dynamic chat responses, use smoothed acoustic synthesis if needed
  fallbackAcousticSynthesis(text, voiceStyle, onStart, onEnd, onError);
}

function fallbackAcousticSynthesis(
  text: string,
  voiceStyle: 'fluent' | 'neutral',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (!('speechSynthesis' in window)) {
    onError?.(new Error("Speech synthesis not supported on this device."));
    onEnd?.();
    return;
  }

  const cleanText = text
    .replace(/[*_~`#>-]/g, ' ')
    .replace(/•/g, ', ')
    .replace(/\n+/g, '. ')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  // Natural human cadence
  utterance.rate = voiceStyle === 'fluent' ? 0.94 : 0.98;
  utterance.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (voiceStyle === 'fluent') {
    selectedVoice = 
      voices.find(v => v.lang.includes('NG') || v.lang.includes('en-NG')) ||
      voices.find(v => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria')) && v.lang.startsWith('en')) ||
      voices.find(v => v.lang.startsWith('en'));
  } else {
    selectedVoice = 
      voices.find(v => (v.name.includes('Google US English') || v.name.includes('Jenny') || v.name.includes('Natural') || v.name.includes('Samantha')) && v.lang.startsWith('en')) ||
      voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB')) ||
      voices.find(v => v.lang.startsWith('en'));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    onError?.(e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
