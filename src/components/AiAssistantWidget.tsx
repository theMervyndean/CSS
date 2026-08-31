import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Bot, X, Send, Trash2, Copy, Check, 
  Minimize2, MessageSquare, Lightbulb, RefreshCw, 
  User, Shield, GraduationCap, AlertCircle,
  FileText, CheckCircle2, ArrowRight,
  Brain, Zap, Globe, Mic, MicOff, Volume2, VolumeX, Radio, ExternalLink,
  Search, PhoneCall, PhoneOff, Wand2,
  Heart, MapPin, Award, UserCheck, Pause, Sliders,
  Upload, Play, Square, Headphones, Music
} from 'lucide-react';
import { toast } from 'sonner';
import { getNazieePermissions } from '../lib/nazieePermissions';
import { LiveVoiceSession } from '../utils/audioLiveClient';
import { 
  playNonyeVoice, 
  stopNonyeVoice, 
  getCustomVoiceSample, 
  saveCustomVoiceSample, 
  removeCustomVoiceSample 
} from '../utils/nonyeVoicePlayer';
import { useScreenVision, ScreenVisionSnapshot } from '../hooks/useScreenVision';
import nonyeAvatar from '../assets/images/chinonye_portrait.jpg';

export interface AiAssistantContext {
  currentView?: string;
  activeTab?: string;
  userRole?: string;
  userName?: string;
  schoolName?: string;
  subscriptionTier?: string;
  additionalInfo?: Record<string, any>;
  screenSnapshot?: ScreenVisionSnapshot;
}

/**
 * Strict Role Whitelist for accessing Nonye AI Assistant
 */
export const AUTHORIZED_NONYE_ROLES: readonly string[] = [
  'Super_Admin',
  'Super Admin',
  'School_Admin',
  'Admin',
  'Principal',
  'Class_Teacher',
  'Non_Class_Teacher',
  'Teacher',
  'Subject_Teacher',
  'Bursar',
  'Student',
  'Parent'
] as const;

export function isRoleAuthorizedForNonye(role?: string): boolean {
  if (!role || typeof role !== 'string') return false;
  const clean = role.trim().toLowerCase();
  return AUTHORIZED_NONYE_ROLES.some((allowed) => allowed.toLowerCase() === clean);
}

// Backward compatibility alias
export const isRoleAuthorizedForChinonye = isRoleAuthorizedForNonye;

export function isSuperAdminRole(role?: string): boolean {
  if (!role || typeof role !== 'string') return false;
  const clean = role.trim().toLowerCase();
  return clean === 'super_admin' || clean === 'super admin';
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface GeneratedQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks: number;
}

interface SearchSource {
  title: string;
  url: string;
}

interface AiAssistantWidgetProps {
  context: AiAssistantContext;
  isOpenControlled?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerPrompt?: string | null;
  onResetTriggerPrompt?: () => void;
}

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({ 
  context,
  isOpenControlled,
  onOpenChange,
  triggerPrompt,
  onResetTriggerPrompt
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  
  const setIsOpen = (open: boolean) => {
    setInternalIsOpen(open);
    onOpenChange?.(open);
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'origin' | 'search_grounding' | 'voice_live' | 'fast_tasks' | 'text_to_questions' | 'deep_reasoning'>('chat');
  const [highThinkingEnabled, setHighThinkingEnabled] = useState(true);
  const [isPlayingVoiceIntro, setIsPlayingVoiceIntro] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceStyle, setVoiceStyle] = useState<'fluent' | 'neutral'>(() => {
    const saved = localStorage.getItem('nonye_voice_style') || localStorage.getItem('chinonye_voice_style');
    return (saved === 'neutral' || saved === 'fluent') ? saved : 'fluent';
  });
  
  // Custom Voice Model Studio State
  const [customVoiceData, setCustomVoiceData] = useState<string | null>(() => getCustomVoiceSample());
  const [customVoiceName, setCustomVoiceName] = useState<string>(() => localStorage.getItem('nonye_voice_filename') || localStorage.getItem('chinonye_voice_filename') || 'Real Nonye AI Voice Model');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testVoiceText, setTestVoiceText] = useState("Hello! I am Nonye AI, your school operations co-pilot from Ngwa, Abia State. I am speaking with my authentic, real voice.");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const hasAutoGreetedRef = useRef(false);

  // Switch voice style and persist
  const handleToggleVoiceStyle = (newStyle: 'fluent' | 'neutral') => {
    setVoiceStyle(newStyle);
    localStorage.setItem('nonye_voice_style', newStyle);
    stopNonyeVoice();
    setIsPlayingVoiceIntro(false);
    setSpeakingMessageId(null);

    toast.success(
      newStyle === 'fluent' 
        ? "🇳🇬 Voice set to: Nonye's Fluid Accent (Ngwa, Abia State)" 
        : "🌐 Voice set to: Standard Professional Voice",
      { duration: 2500 }
    );
  };

  // Upload Custom Voice Audio Sample (.mp3, .wav, .m4a)
  const handleUploadVoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav') && !file.name.endsWith('.m4a') && !file.name.endsWith('.ogg')) {
      toast.error('Please upload an audio file (.mp3, .wav, .m4a, or .ogg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        saveCustomVoiceSample(result);
        setCustomVoiceData(result);
        setCustomVoiceName(file.name);
        localStorage.setItem('nonye_voice_filename', file.name);
        toast.success(`✨ Real new Nonye AI voice loaded: "${file.name}"!`, { duration: 4000 });
        
        // Play an immediate real preview
        playNonyeVoice({
          text: 'Hello! I am Nonye AI. Your real custom voice is now active.',
          isGreetingOrProfile: true,
          voiceStyle,
          onStart: () => setIsPlayingVoiceIntro(true),
          onEnd: () => setIsPlayingVoiceIntro(false),
          onError: () => setIsPlayingVoiceIntro(false)
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Live Microphone Voice Recording
  const handleStartRecordingVoice = async () => {
    try {
      stopNonyeVoice();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          saveCustomVoiceSample(base64data);
          setCustomVoiceData(base64data);
          const recordingName = `Live Nonye Recording (${new Date().toLocaleTimeString()})`;
          setCustomVoiceName(recordingName);
          localStorage.setItem('nonye_voice_filename', recordingName);
          toast.success("✨ Real Nonye AI voice recorded and set as primary voice model!");

          // Immediate preview of recorded sample
          playNonyeVoice({
            text: "Hello! I am Nonye AI.",
            isGreetingOrProfile: true,
            voiceStyle,
            onStart: () => setIsPlayingVoiceIntro(true),
            onEnd: () => setIsPlayingVoiceIntro(false),
            onError: () => setIsPlayingVoiceIntro(false)
          });
        };
      };

      recorder.start(200);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      toast.info("🎙️ Speak into your mic to record Nonye's real voice. Click 'Save Recording' when done!");
    } catch (err: any) {
      toast.error(`Microphone permission denied: ${err.message || 'Check browser permissions'}`);
    }
  };

  // Stop Microphone Voice Recording
  const handleStopRecordingVoice = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    setIsRecordingVoice(false);
  };

  // Remove custom voice sample and revert to neutral neural model
  const handleRemoveCustomVoice = () => {
    removeCustomVoiceSample();
    setCustomVoiceData(null);
    setCustomVoiceName('Default Neural Model');
    localStorage.removeItem('nonye_voice_filename');
    localStorage.removeItem('chinonye_voice_filename');
    stopNonyeVoice();
    setIsPlayingVoiceIntro(false);
    toast.info("Reverted Nonye voice to standard neural voice engine.");
  };

  // Real-time voice test synthesizer
  const handleTestVoiceSpeech = async () => {
    if (isTestingVoice) {
      stopNonyeVoice();
      setIsTestingVoice(false);
      return;
    }

    setIsTestingVoice(true);
    toast.info("🔊 Synthesizing Nonye AI speech test...");

    await playNonyeVoice({
      text: testVoiceText,
      isGreetingOrProfile: false,
      voiceStyle,
      onStart: () => setIsTestingVoice(true),
      onEnd: () => setIsTestingVoice(false),
      onError: (err) => {
        setIsTestingVoice(false);
        toast.error(err?.message || "Speech synthesis notice");
      }
    });
  };
  
  const [messages, setMessages] = useState<Message[]>(() => {
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: `Hello ${context.userName || 'there'}! 👋 I am **Nonye AI**, your school operations and academic AI co-pilot for **${context.schoolName || 'your school'}**.\n\nHow can I assist you with your grading, assessments, attendance, or school administrative tasks today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hook: J.A.R.V.I.S. Screen Vision Telemetry
  const { screenVision, isScanning: isVisionScanning, scanNow } = useScreenVision(context, isOpen);
  const [isScanningScreen, setIsScanningScreen] = useState(false);

  // J.A.R.V.I.S Screen Scan Handler
  const handleScanScreen = async (autoQuery = true) => {
    setIsScanningScreen(true);
    toast.info("⚡ Screen Vision: Scanning active viewport & table data...", {
      duration: 2000,
      icon: <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
    });

    const refreshedVision = scanNow();
    setIsScanningScreen(false);

    if (autoQuery) {
      const scanPrompt = `⚡ **Screen Diagnosis**: I am currently on the **${refreshedVision.pageTitle}** screen. Please scan what is visible on my screen, point out any missing data or errors, and direct me on what steps to take next.`;
      handleSendMessage(scanPrompt);
    }
  };

  // Friendly audio greeting from Nonye using the real voice
  const playShortGreeting = (isAutoTrigger = false) => {
    if (isPlayingVoiceIntro && !isAutoTrigger) {
      stopNonyeVoice();
      setIsPlayingVoiceIntro(false);
      return;
    }

    stopNonyeVoice();
    setSpeakingMessageId(null);

    if (!customVoiceData && !isAutoTrigger) {
      if (context.userRole === 'Super_Admin' || context.userRole === 'Super Admin') {
        setActiveMode('origin');
        toast.info("🎙️ Super Admin: Upload or record Nonye's real voice sample in the Studio below!");
      } else {
        toast.info("🔊 Nonye AI audio co-pilot is ready to assist you.");
      }
      return;
    }

    const shortGreeting = `Hello! I am Nonye AI, your school operations and academic AI co-pilot. How can I assist you today?`;

    playNonyeVoice({
      text: shortGreeting,
      isGreetingOrProfile: true,
      voiceStyle,
      onStart: () => setIsPlayingVoiceIntro(true),
      onEnd: () => setIsPlayingVoiceIntro(false),
      onError: (err) => {
        setIsPlayingVoiceIntro(false);
        if (!isAutoTrigger) {
          toast.info(err?.message || "Upload real Nonye AI voice sample in Profile tab.");
        }
      }
    });

    if (!isAutoTrigger) {
      toast.info(`🔊 Nonye AI: "Hello! I am Nonye AI, your school operations and academic AI co-pilot..."`, {
        duration: 3000,
        icon: <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
      });
    }
  };

  // Full origin & profile audio intro
  const handlePlayDeepOriginVoice = () => {
    if (isPlayingVoiceIntro) {
      stopNonyeVoice();
      setIsPlayingVoiceIntro(false);
      return;
    }

    stopNonyeVoice();
    setSpeakingMessageId(null);

    const deepSpeech = `Hello and welcome to Corner Streams. I am Nonye AI, your school operations and academic AI co-pilot from Ngwa in Abia State, Nigeria. Standing 165 centimeters tall and speaking fluent English with fluid precision, I am dedicated to assisting your teachers, students, and administrators with grading, examinations, attendance, and school intelligence. How may I assist you today?`;

    playNonyeVoice({
      text: deepSpeech,
      isGreetingOrProfile: true,
      voiceStyle,
      onStart: () => setIsPlayingVoiceIntro(true),
      onEnd: () => setIsPlayingVoiceIntro(false),
      onError: (err) => {
        setIsPlayingVoiceIntro(false);
        toast.info(err?.message || "Upload or record real Nonye voice in Profile.");
      }
    });

    toast.success(`🔊 Playing Nonye's profile voice introduction!`);
  };

  // Read any assistant message aloud in real voice
  const handleSpeakMessage = (id: string, text: string) => {
    if (speakingMessageId === id) {
      stopNonyeVoice();
      setSpeakingMessageId(null);
      return;
    }

    stopNonyeVoice();
    setIsPlayingVoiceIntro(false);

    playNonyeVoice({
      text,
      isGreetingOrProfile: false,
      voiceStyle,
      onStart: () => setSpeakingMessageId(id),
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null)
    });
  };

  // Handler when opening the widget
  const handleOpenWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);

    if (!hasAutoGreetedRef.current && customVoiceData) {
      hasAutoGreetedRef.current = true;
      playShortGreeting(true);
    }
  };

  // 1. Deep Reasoning state (Gemini 3.1 Pro)
  const [deepTopic, setDeepTopic] = useState('');
  const [deepResult, setDeepResult] = useState('');
  const [isDeepThinking, setIsDeepThinking] = useState(false);

  // 2. Google Search Grounding state (Gemini 3.5 Flash)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('Curriculum & Examination');
  const [searchResult, setSearchResult] = useState('');
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
  const [searchQueriesList, setSearchQueriesList] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 3. Live Voice Conversation state (Gemini 3.1 Flash Live Preview)
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'>('disconnected');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState(0);
  const liveSessionRef = useRef<LiveVoiceSession | null>(null);

  // 4. Fast Tasks state (Gemini 3.1 Flash Lite)
  const [fastMode, setFastMode] = useState<'polish' | 'sms' | 'summarize' | 'quiz'>('polish');
  const [fastInput, setFastInput] = useState('');
  const [fastResult, setFastResult] = useState('');
  const [fastQuizQuestions, setFastQuizQuestions] = useState<any[]>([]);
  const [isFastProcessing, setIsFastProcessing] = useState(false);
  const [fastLatency, setFastLatency] = useState<number | null>(null);

  // 5. Text-to-Question Generator State (for Teachers)
  const [passageText, setPassageText] = useState('');
  const [questionSubject, setQuestionSubject] = useState('English Literature / General');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isBuildingQuestions, setIsBuildingQuestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const permissions = getNazieePermissions(context.userRole, context.subscriptionTier);
  const isAuthorized = isRoleAuthorizedForNonye(context.userRole);
  const isSuperAdmin = isSuperAdminRole(context.userRole);
  const isTeacher = context.userRole === 'Class_Teacher' || context.userRole === 'Non_Class_Teacher' || context.userRole === 'Teacher' || context.userRole === 'Subject_Teacher';
  const isAdmin = context.userRole === 'School_Admin' || isSuperAdmin || context.userRole === 'Admin' || context.userRole === 'Principal';

  // Strict role security: do not render widget if user role is not whitelisted
  if (!isAuthorized) {
    return null;
  }

  // Guard against non-superadmin navigating to origin/profile tab
  useEffect(() => {
    if (!isSuperAdmin && activeMode === 'origin') {
      setActiveMode('chat');
    }
  }, [isSuperAdmin, activeMode]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && activeMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading, activeMode]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized && activeMode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, activeMode]);

  // Clean up Live Voice session on unmount or tab switch
  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
    };
  }, []);

  // Suggestions derived dynamically from real-time Screen Vision
  const getSuggestions = () => {
    if (screenVision.suggestedDirectives && screenVision.suggestedDirectives.length > 0) {
      return screenVision.suggestedDirectives;
    }

    const base = isSuperAdmin ? [
      "Tell me about your profile & origin"
    ] : [];

    if (isTeacher) {
      return [
        ...base,
        "📝 Generate 5 CBT questions from my lesson passage",
        "✨ Draft personalized report card comments for my class"
      ];
    }

    if (isAdmin) {
      return [
        ...base,
        "👁️ Synthesize 360° Institutional Operational Audit",
        "📊 What is our overall pass rate and Bursary clearance rate?"
      ];
    }

    return [
      ...base,
      "🎓 Ask Nonye AI for Socratic homework guidance",
      "📝 How do I prepare for my upcoming CBT exams?"
    ];
  };

  // Chat message sending with multi-turn history & Screen Vision payload
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    // Refresh live screen telemetry immediately before sending
    const currentVision = scanNow();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          enableHighThinking: highThinkingEnabled,
          context: {
            userRole: context.userRole,
            userName: context.userName,
            activeTab: context.activeTab,
            currentView: context.currentView,
            schoolName: context.schoolName,
            subscriptionTier: context.subscriptionTier || 'unified_enterprise',
            additionalInfo: context.additionalInfo,
            screenSnapshot: currentVision
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "Nonye AI could not complete the request. Please try again.";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Nonye AI Fetch Error:', err);
      toast.error(err.message || 'Failed to connect to Nonye AI.');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Nonye AI Connection Notice**: ${err.message || 'Unable to reach Nonye AI'}. Please check your network connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle external triggerPrompt from Onboarding modal or workspace actions
  useEffect(() => {
    if (triggerPrompt && triggerPrompt.trim()) {
      setIsOpen(true);
      setIsMinimized(false);
      setActiveMode('chat');
      const promptToRun = triggerPrompt.trim();
      onResetTriggerPrompt?.();
      handleSendMessage(promptToRun);
    }
  }, [triggerPrompt]);

  // Google Search Grounding Execution with Gemini 3.5 Flash
  const handleSearchGrounding = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a query or research topic to search.');
      return;
    }

    setIsSearching(true);
    setSearchResult('');
    setSearchSources([]);
    setSearchQueriesList([]);
    toast.info('🌐 Searching live web knowledge via Google Search Grounding...');

    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          category: searchCategory
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Google Search Grounding failed.');
      }

      const data = await res.json();
      setSearchResult(data.result || 'No response returned.');
      setSearchSources(data.sources || []);
      setSearchQueriesList(data.webSearchQueries || []);
      toast.success('✨ Verified grounded web intelligence received!');
    } catch (e: any) {
      toast.error(e.message || 'Error executing Google Search Grounding.');
    } finally {
      setIsSearching(false);
    }
  };

  // Live Voice Conversation (Gemini 3.1 Flash Live Preview)
  const handleStartLiveVoice = async () => {
    setLiveError(null);
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }

    const session = new LiveVoiceSession(
      (status, err) => {
        setLiveStatus(status);
        if (err) {
          setLiveError(err);
          toast.error(`Live Voice: ${err}`);
        }
      },
      (vol) => {
        setLiveVolume(vol);
      }
    );

    liveSessionRef.current = session;
    await session.start();
  };

  const handleStopLiveVoice = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    setLiveStatus('disconnected');
    setLiveVolume(0);
    toast.info('Nonye AI Live Voice session ended.');
  };

  // Fast Tasks with Gemini 3.1 Flash Lite
  const handleFastTask = async () => {
    if (fastMode === 'quiz') {
      const topic = fastInput.trim() || 'Senior Secondary Mathematics & Physics';
      setIsFastProcessing(true);
      const startTime = performance.now();
      try {
        const res = await fetch('/api/ai/fast-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, count: 3 })
        });
        const data = await res.json();
        setFastQuizQuestions(data.questions || []);
        setFastLatency(Math.round(performance.now() - startTime));
        toast.success('⚡ Rapid quiz generated in under a second!');
      } catch (err: any) {
        toast.error(err.message || 'Fast quiz failed.');
      } finally {
        setIsFastProcessing(false);
      }
      return;
    }

    if (!fastInput.trim()) {
      toast.error('Please enter text to process.');
      return;
    }

    setIsFastProcessing(true);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/ai/fast-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fastInput.trim(),
          mode: fastMode,
          instruction: fastMode === 'sms' 
            ? 'Convert to a concise 160-character official school SMS notice' 
            : fastMode === 'summarize' 
            ? 'Generate 3 instant bullet point takeaways' 
            : 'Fix all grammar, spelling, and polish professional tone'
        })
      });

      if (!res.ok) {
        throw new Error('Fast edit service error.');
      }

      const data = await res.json();
      setFastResult(data.result || '');
      setFastLatency(Math.round(performance.now() - startTime));
      toast.success('⚡ Instant refinement complete!');
    } catch (err: any) {
      toast.error(err.message || 'Fast action failed.');
    } finally {
      setIsFastProcessing(false);
    }
  };

  // Deep Reasoning Execution with Gemini 3.1 Pro (ThinkingLevel.HIGH)
  const handleDeepReasoning = async () => {
    if (!deepTopic.trim()) {
      toast.error('Please enter a complex problem or institutional inquiry to synthesize.');
      return;
    }

    setIsDeepThinking(true);
    toast.info('🧠 Nonye AI is engaging Gemini 3.1 Pro with High Thinking Level...');

    try {
      const currentVision = scanNow();
      const res = await fetch('/api/ai/deep-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: deepTopic.trim(),
          contextData: {
            schoolName: context.schoolName,
            userRole: context.userRole,
            subscriptionTier: context.subscriptionTier,
            activeTab: context.activeTab,
            currentView: context.currentView,
            screenSnapshot: currentVision
          }
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Deep reasoning failed.');
      }

      const data = await res.json();
      setDeepResult(data.result || 'Reasoning complete.');
      toast.success('✨ High Thinking deep synthesis successfully generated!');
    } catch (e: any) {
      toast.error(e.message || 'Error during deep reasoning analysis.');
    } finally {
      setIsDeepThinking(false);
    }
  };

  // Teacher Text-to-Question Builder
  const handleBuildQuestionsFromText = async () => {
    if (!passageText.trim()) {
      toast.error('Please paste or type a passage or lesson note.');
      return;
    }

    setIsBuildingQuestions(true);
    toast.info(`Nonye AI is building ${numQuestions} CBT questions from your text...`);

    try {
      const res = await fetch('/api/cbt/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageText: passageText.trim(),
          numQuestions,
          subject: questionSubject,
          subscriptionTier: context.subscriptionTier || 'unified_enterprise'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate questions from text.');
      }

      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        toast.success(`✨ Nonye AI built ${data.questions.length} CBT questions with answer keys!`);
      } else {
        throw new Error('Invalid question schema returned from Nonye AI.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Nonye AI question generation failed.');
    } finally {
      setIsBuildingQuestions(false);
    }
  };

  const handleCopyGeneratedQuestions = () => {
    if (generatedQuestions.length === 0) return;
    const formatted = generatedQuestions.map((q, i) => `
Q${i + 1}: ${q.text}
A) ${q.options[0]}
B) ${q.options[1]}
C) ${q.options[2]}
D) ${q.options[3]}
Correct Option: Option ${['A', 'B', 'C', 'D'][q.correctOptionIndex]}
Explanation: ${q.explanation || 'N/A'}
Marks: ${q.marks}
`).join('\n---\n');

    navigator.clipboard.writeText(formatted);
    toast.success('Nonye AI generated questions copied to clipboard!');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        sender: 'assistant',
        text: `Chat session reset. Hello! I am **Nonye AI**, your AI co-pilot. How may I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.info('Chat history reset');
  };

  return (
    <div id="nonye-assistant-widget" className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 print:hidden font-sans select-none pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end">
        <AnimatePresence mode="wait">
          {/* FLOATING LAUNCHER BUTTON - CLEAN, MINIMALIST */}
          {(!isOpen || isMinimized) && (
            <motion.button
              key="nonye-launcher-button"
              id="nonye-launcher-button"
              type="button"
              onClick={handleOpenWidget}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 350 }}
              className="group relative flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 hover:from-indigo-900 hover:to-emerald-900 text-white rounded-full shadow-2xl border border-indigo-400/40 cursor-pointer"
              title="Open Nonye AI Co-Pilot"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <img 
                  src={nonyeAvatar} 
                  alt="Nonye AI" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400 shadow-md group-hover:rotate-3 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>

              <span className="text-xs font-black tracking-wide text-white flex items-center gap-1 font-display pr-1">
                Nonye AI
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
            </motion.button>
          )}

          {/* FLOATING NONYE AI CHAT WINDOW */}
          {isOpen && !isMinimized && (
            <motion.div
              key="nonye-chat-modal"
              id="nonye-chat-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="w-[calc(100vw-1.5rem)] sm:w-[460px] md:w-[480px] max-w-[480px] h-[82vh] sm:h-[630px] max-h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* HEADER BAR - CLEAN & UNCLUTTERED */}
              <div className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between border-b border-indigo-800/60 shrink-0 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img 
                      src={nonyeAvatar} 
                      alt="Nonye AI" 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black tracking-wide text-white font-display truncate">
                      Nonye AI
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  </div>
                </div>

                {/* Action controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => playShortGreeting(false)}
                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 border ${
                      isPlayingVoiceIntro 
                        ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' 
                        : 'bg-indigo-900/60 border-indigo-700/60 text-emerald-300 hover:bg-indigo-800'
                    }`}
                    title="Play Nonye AI's Voice Greeting"
                  >
                    {isPlayingVoiceIntro ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Clear chat session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-lg transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SMART SCREEN AWARENESS BAR */}
              <div className="bg-slate-900 px-2.5 sm:px-3 py-1.5 flex items-center justify-between text-[10.5px] sm:text-[11px] text-slate-300 border-b border-slate-800 shrink-0 min-w-0">
                <div className="flex items-center gap-1.5 overflow-hidden min-w-0 pr-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[8.5px] sm:text-[9px] shrink-0 font-sans">
                    Active View:
                  </span>
                  <span className="truncate text-slate-200 text-[10px] sm:text-[10.5px] font-medium" title={screenVision.pageTitle}>
                    {screenVision.pageTitle || 'Dashboard View'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => handleScanScreen(true)}
                  disabled={isLoading || isScanningScreen}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800/80 text-emerald-300 text-[9.5px] sm:text-[10px] font-bold transition shrink-0 cursor-pointer border border-emerald-500/40 shadow-xs disabled:opacity-50 active:scale-95"
                  title="Refresh screen context for Nonye AI"
                >
                  <Sparkles className={`w-3 h-3 text-amber-400 ${isScanningScreen ? 'animate-spin' : ''}`} />
                  <span>{isScanningScreen ? 'Refreshing...' : 'Refresh Context'}</span>
                </button>
              </div>

              {/* MULTI-FEATURE NAVIGATION TABS */}
              <div className="flex bg-slate-100 p-1 border-b border-slate-200 text-[10px] sm:text-[10.5px] font-bold text-slate-600 overflow-x-auto gap-1 scrollbar-none shrink-0">
                <button
                  onClick={() => setActiveMode('chat')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    activeMode === 'chat' ? 'bg-white text-indigo-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 text-indigo-600" />
                  <span>Chat</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => setActiveMode('origin')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                      activeMode === 'origin' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm font-extrabold' : 'text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Profile & Architecture</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveMode('voice_live')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    activeMode === 'voice_live' ? 'bg-white text-rose-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <Mic className="w-3 h-3 text-rose-600 animate-pulse" />
                  <span>Live Voice</span>
                </button>

                <button
                  onClick={() => setActiveMode('search_grounding')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    activeMode === 'search_grounding' ? 'bg-white text-blue-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3 h-3 text-blue-600" />
                  <span>Web Search</span>
                </button>

                <button
                  onClick={() => setActiveMode('fast_tasks')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    activeMode === 'fast_tasks' ? 'bg-white text-amber-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Fast Actions</span>
                </button>

                <button
                  onClick={() => setActiveMode('deep_reasoning')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    activeMode === 'deep_reasoning' ? 'bg-white text-purple-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <Brain className="w-3 h-3 text-purple-600" />
                  <span>Reasoning</span>
                </button>

                {permissions.canAccessTextToQuestions && (
                  <button
                    onClick={() => setActiveMode('text_to_questions')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                      activeMode === 'text_to_questions' ? 'bg-white text-emerald-900 shadow-sm font-extrabold' : 'hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>Text→Q</span>
                  </button>
                )}
              </div>

              {/* MODE 1: STANDARD MULTI-TURN CHAT */}
              {activeMode === 'chat' && (
                <>
                  <div className="flex-1 p-3 sm:p-3.5 overflow-y-auto space-y-3 bg-slate-50">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 mb-1 px-1">
                          {msg.sender === 'assistant' ? (
                            <span className="text-[10px] font-sans font-bold text-indigo-900 flex items-center gap-1.5">
                              <img src={nonyeAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-emerald-400" />
                              Nonye AI {highThinkingEnabled ? '• Pro Intelligence' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] font-sans font-medium text-slate-600 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {context.userName || 'You'}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-sans">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl text-xs max-w-[92%] sm:max-w-[88%] break-words leading-relaxed relative group ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white rounded-tr-none shadow-md'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-sans">
                            {msg.text}
                          </div>

                          {msg.sender === 'assistant' && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleSpeakMessage(msg.id, msg.text)}
                                className={`p-1 rounded-lg transition cursor-pointer ${
                                  speakingMessageId === msg.id 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-100/90 hover:bg-slate-200 text-slate-600'
                                }`}
                                title={speakingMessageId === msg.id ? "Stop Speaking" : "Read Aloud"}
                              >
                                {speakingMessageId === msg.id ? (
                                  <VolumeX className="w-3 h-3 text-white animate-pulse" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-indigo-600" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="p-1 bg-slate-100/90 hover:bg-slate-200 text-slate-500 rounded-lg transition cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex flex-col items-start space-y-1.5 animate-in fade-in duration-300">
                        <span className="text-[10px] font-sans font-bold text-indigo-900 flex items-center gap-1.5">
                          <img src={nonyeAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-emerald-400 animate-pulse" />
                          Nonye AI is thinking...
                        </span>
                        <div className="p-3 bg-white border border-emerald-200/80 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2.5 text-xs text-slate-600">
                          <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                          <span className="font-sans text-[11px] text-slate-600">
                            {highThinkingEnabled ? 'Reviewing institutional insights and class records...' : 'Preparing helpful answer...'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggestions Chips */}
                  <div className="p-2 bg-slate-100/90 border-t border-slate-200 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {getSuggestions().map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(sug.replace(/^[^\w]+/, ''))}
                        disabled={isLoading}
                        className="text-[9.5px] sm:text-[10px] px-2 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200/80 rounded-lg transition-colors truncate max-w-full cursor-pointer disabled:opacity-50 text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-2 sm:p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 sm:gap-2"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      placeholder="Ask Nonye AI anything..."
                      disabled={isLoading}
                      className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputPrompt.trim()}
                      className="p-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl shadow hover:opacity-95 transition disabled:opacity-50 cursor-pointer shrink-0"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}

          {/* MODE: NONYE AI PROFILE & HERITAGE (SUPER ADMIN ONLY) */}
          {activeMode === 'origin' && isSuperAdmin && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900 text-slate-100 font-sans">
              {/* HERO PORTRAIT & TITLE */}
              <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-4 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl relative group">
                    <img 
                      src={nonyeAvatar} 
                      alt="Nonye AI Portrait" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full shadow border border-emerald-300 uppercase tracking-wider">
                    Ngwa • Abia
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <h3 className="text-base font-black tracking-wider text-white font-display">
                      Nonye AI
                    </h3>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] font-mono font-bold rounded">
                      AI CO-PILOT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Intelligent school operations and academic co-pilot from <strong>Ngwa, Abia State, Nigeria</strong> (165cm tall). Speaking fluent English with a fluid, natural accent.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePlayDeepOriginVoice}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      {isPlayingVoiceIntro ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span>Stop Voice Intro</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                          <span>🔊 Listen to Voice Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* BIOGRAPHICAL SPECIFICATIONS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Origin & Roots
                  </span>
                  <p className="text-xs font-bold text-white">Ngwa, Abia State</p>
                  <p className="text-[9.5px] text-slate-400">Nigeria</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Height Specification
                  </span>
                  <p className="text-xs font-bold text-white">165 cm</p>
                  <p className="text-[9.5px] text-slate-400">Physical Profile Dimension</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Speech Model
                  </span>
                  <p className="text-xs font-bold text-white">Fluent English</p>
                  <p className="text-[9.5px] text-slate-400">Fluid Natural Accent</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    Intelligence Scope
                  </span>
                  <p className="text-xs font-bold text-white">School Operations</p>
                  <p className="text-[9.5px] text-slate-400">CBT, Grades & Bursary</p>
                </div>
              </div>

              {/* VOICE STYLE SWITCHER */}
              <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Speech Cadence & Accent Setting
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[8px] font-mono rounded border border-slate-700">
                    Neural Voice Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceStyle('fluent')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      voiceStyle === 'fluent'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span>🇳🇬</span>
                        <span>Fluid Natural Accent</span>
                      </span>
                      {voiceStyle === 'fluent' ? (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[8px] font-mono font-bold rounded">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono">Select</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      Fluent, articulate English speech model with fluid natural cadence.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVoiceStyle('neutral')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      voiceStyle === 'neutral'
                        ? 'bg-indigo-950/90 border-indigo-400 text-indigo-100 shadow-md ring-1 ring-indigo-400/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span>🌐</span>
                        <span>Standard Professional</span>
                      </span>
                      {voiceStyle === 'neutral' ? (
                        <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[8px] font-mono font-bold rounded">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono">Select</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      Standard neutral international pronunciation.
                    </p>
                  </button>
                </div>
              </div>

              {/* NONYE CUSTOM VOICE MODEL STUDIO */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-black uppercase text-white tracking-wider">
                      Real Nonye Voice Studio
                    </span>
                  </div>
                  {customVoiceData ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px] font-mono font-bold rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      REAL VOICE ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[8px] font-mono font-bold rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      UPLOAD/RECORD REAL VOICE
                    </span>
                  )}
                </div>

                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  {customVoiceData ? (
                    <>
                      Using real voice asset: <strong className="text-emerald-300 font-mono">{customVoiceName}</strong>. All greetings, introductions, and spoken replies use this authentic voice.
                    </>
                  ) : (
                    <>
                      Record or upload the real Nonye voice sample below so all greetings and spoken messages sound 100% natural, warm, and authentic.
                    </>
                  )}
                </p>

                {/* Microphone Recording State Banner */}
                {isRecordingVoice && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-bold text-rose-200">
                        Recording Real Voice... ({recordingSeconds}s)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStopRecordingVoice}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center gap-1"
                    >
                      <Square className="w-3 h-3 fill-white text-white" />
                      <span>Save Recording</span>
                    </button>
                  </div>
                )}

                {/* Upload & Management Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadVoiceFile}
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    className="hidden"
                  />
                  
                  {/* Record with Mic */}
                  {!isRecordingVoice ? (
                    <button
                      type="button"
                      onClick={handleStartRecordingVoice}
                      className="px-3 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Record Real Voice (Mic)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecordingVoice}
                      className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Stop & Set Voice</span>
                    </button>
                  )}

                  {/* Upload Audio File */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customVoiceData ? 'Upload New Audio File' : 'Upload Audio (.mp3/.wav)'}</span>
                  </button>

                  {/* Play Greeting Sample */}
                  <button
                    type="button"
                    onClick={() => playShortGreeting(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Play Real Greeting</span>
                  </button>

                  {/* Delete Old / Reset Custom Voice */}
                  {customVoiceData && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomVoice}
                      className="px-2.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
                      title="Delete current voice sample and record/upload a new one"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Voice</span>
                    </button>
                  )}
                </div>

                {/* Dynamic Speech Synthesis Tester */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                      <Music className="w-3 h-3 text-emerald-400" />
                      Live Speech Synthesis Tester:
                    </label>
                    <span className="text-[9px] text-slate-500">Authentic Neural Audio Engine</span>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={testVoiceText}
                      onChange={(e) => setTestVoiceText(e.target.value)}
                      placeholder="Type text to hear Nonye AI speak in real-time..."
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleTestVoiceSpeech}
                      disabled={!testVoiceText.trim()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    >
                      {isTestingVoice ? (
                        <>
                          <Square className="w-3 h-3 text-white fill-white" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-white fill-white" />
                          <span>Speak Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* MISSION PILLARS */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  Nonye AI's Core Capabilities:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">Classroom & Exam Creation</h5>
                      <p className="text-[10px] text-slate-400">Generates curriculum-aligned CBT questions with WAEC/JAMB standards.</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">High-Thinking Analytics</h5>
                      <p className="text-[10px] text-slate-400">Analyzes student learning gaps and formulates personalized interventions.</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2">
                    <Mic className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">Real-Time Spoken Co-Pilot</h5>
                      <p className="text-[10px] text-slate-400">Speak live with Nonye AI using native low-latency voice intelligence.</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">School 360° Operations</h5>
                      <p className="text-[10px] text-slate-400">Helps principals manage fees, attendance, rosters, and staff broadcasts.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK CALL TO ACTION BUTTONS */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveMode('chat')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Nonye AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('voice_live')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Start Voice Call</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: GOOGLE SEARCH GROUNDING */}
          {activeMode === 'search_grounding' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900 text-slate-100">
              <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-3 rounded-2xl border border-blue-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
                      Google Search Grounding Engine
                    </h3>
                  </div>
                  <span className="text-[8.5px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/40 px-1.5 py-0.5 rounded font-bold">
                    GEMINI 3.5 FLASH
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  Grounds responses with real-time Google Search data, retrieving up-to-date curriculum regulations, WAEC/JAMB exam standards, and verified web citations.
                </p>
              </div>

              {/* Sample Grounding Queries */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-blue-300 tracking-wider">
                  Quick Research Topics:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    "2026 WAEC Syllabus updates for Mathematics & English",
                    "National Educational Research & Development Council guidelines",
                    "Latest JAMB CBT grading standards & subject combinations",
                    "Cambridge IGCSE STEM assessment grading rubric"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSearchQuery(p)}
                      className="text-left text-[9.5px] px-2 py-1 bg-slate-800 hover:bg-blue-950/80 text-blue-200 border border-blue-800/60 rounded-lg transition cursor-pointer"
                    >
                      🔍 {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter real-world query or institutional topic to ground with Google Search..."
                  className="w-full p-2.5 bg-slate-950 border border-blue-900/60 focus:border-blue-400 text-xs text-white rounded-xl outline-none font-sans placeholder:text-slate-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSearchGrounding}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-blue-200 animate-spin" />
                    <span>Searching Web with Gemini 3.5 Flash...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-blue-200" />
                    <span>Search Google & Synthesize Grounded Answer</span>
                  </>
                )}
              </button>

              {searchResult && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-800/60 space-y-2.5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[9.5px] font-mono text-blue-300 font-bold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-400" />
                      Grounded Answer with Google Search Data
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(searchResult);
                        toast.success('Copied search synthesis to clipboard!');
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto pr-1 font-sans">
                    {searchResult}
                  </div>

                  {searchSources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">
                        Verified Sources & Web Citations ({searchSources.length}):
                      </span>
                      <div className="flex flex-col gap-1">
                        {searchSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-300 hover:text-blue-100 flex items-center gap-1.5 p-1.5 bg-blue-950/40 border border-blue-800/40 rounded-lg hover:border-blue-500 transition truncate"
                          >
                            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate">{source.title || source.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: LIVE VOICE CONVERSATION */}
          {activeMode === 'voice_live' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950 text-slate-100 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Voice Visualizer Stage */}
                <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div 
                      className={`absolute rounded-full transition-all duration-150 ${
                        liveStatus === 'speaking'
                          ? 'w-28 h-28 bg-emerald-500/20 animate-ping'
                          : liveStatus === 'listening'
                          ? 'w-24 h-24 bg-rose-500/20 animate-pulse'
                          : 'w-20 h-20 bg-slate-800'
                      }`}
                      style={{
                        transform: `scale(${1 + liveVolume * 1.5})`
                      }}
                    />
                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-2 transition-colors duration-300 ${
                      liveStatus === 'speaking'
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white'
                        : liveStatus === 'listening'
                        ? 'bg-gradient-to-br from-rose-600 to-indigo-700 border-rose-400 text-white'
                        : liveStatus === 'connecting'
                        ? 'bg-amber-600 border-amber-400 text-white animate-spin'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {liveStatus === 'speaking' ? (
                        <Volume2 className="w-8 h-8 animate-bounce" />
                      ) : liveStatus === 'listening' ? (
                        <Mic className="w-8 h-8 animate-pulse" />
                      ) : liveStatus === 'connecting' ? (
                        <RefreshCw className="w-8 h-8" />
                      ) : (
                        <MicOff className="w-8 h-8" />
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        liveStatus === 'speaking' 
                          ? 'bg-emerald-400 animate-ping' 
                          : liveStatus === 'listening'
                          ? 'bg-rose-400 animate-pulse'
                          : liveStatus === 'connecting'
                          ? 'bg-amber-400 animate-spin'
                          : 'bg-slate-600'
                      }`} />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                        {liveStatus === 'speaking' && 'Nonye AI is Speaking...'}
                        {liveStatus === 'listening' && 'Listening to your voice...'}
                        {liveStatus === 'connecting' && 'Connecting to Live API...'}
                        {liveStatus === 'connected' && 'Session Active & Ready'}
                        {liveStatus === 'disconnected' && 'Live Voice Session Idle'}
                        {liveStatus === 'error' && 'Voice Session Error'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans">
                      {liveStatus === 'listening' 
                        ? 'Speak naturally into your microphone. Nonye AI will reply in real-time!'
                        : liveStatus === 'speaking'
                        ? 'Nonye AI is responding with natural speech. You can interrupt anytime by speaking.'
                        : 'Click Start Voice Call to begin talking with Nonye AI.'}
                    </p>
                  </div>
                </div>

                {liveError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{liveError}</span>
                  </div>
                )}
              </div>

              {/* Call Controls Button */}
              <div className="pt-2">
                {liveStatus === 'disconnected' || liveStatus === 'error' ? (
                  <button
                    type="button"
                    onClick={handleStartLiveVoice}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Start Real-Time Voice Conversation</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopLiveVoice}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Voice Call</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 4: FAST TASKS */}
          {activeMode === 'fast_tasks' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900 text-slate-100">
              <div className="bg-gradient-to-r from-amber-950 via-indigo-950 to-slate-900 p-3 rounded-2xl border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
                      Ultra-Fast Action Engine
                    </h3>
                  </div>
                  <span className="text-[8.5px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-bold">
                    GEMINI 3.1 FLASH LITE
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  Sub-second high-speed text edits, grammar polishing, instant SMS broadcast drafting, and rapid 3-question quizzes.
                </p>
              </div>

              {/* Fast Action Selector */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'polish', label: 'Polish Text', icon: Wand2 },
                  { id: 'sms', label: '160c SMS', icon: Send },
                  { id: 'summarize', label: 'Summary', icon: FileText },
                  { id: 'quiz', label: 'Fast Quiz', icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFastMode(item.id as any);
                        setFastResult('');
                        setFastQuizQuestions([]);
                      }}
                      className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        fastMode === item.id 
                          ? 'bg-amber-950 border-amber-500 text-amber-200 shadow'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <textarea
                  value={fastInput}
                  onChange={(e) => setFastInput(e.target.value)}
                  placeholder={
                    fastMode === 'quiz'
                      ? 'Enter quiz subject or topic (e.g. Photosynthesis, Quadratic Equations)...'
                      : fastMode === 'sms'
                      ? 'Paste notice or message to condense to 160 characters...'
                      : 'Paste draft remark, feedback, or lesson snippet to polish...'
                  }
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-amber-900/60 focus:border-amber-400 text-xs text-white rounded-xl outline-none font-sans placeholder:text-slate-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleFastTask}
                disabled={isFastProcessing || (!fastInput.trim() && fastMode !== 'quiz')}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isFastProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing with Gemini Flash Lite...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Execute Fast {fastMode.toUpperCase()}</span>
                  </>
                )}
              </button>

              {fastLatency && (
                <div className="text-right text-[9px] font-mono text-emerald-400">
                  ⚡ Response time: {fastLatency}ms
                </div>
              )}

              {fastResult && (
                <div className="bg-slate-950 p-3 rounded-xl border border-amber-800/60 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-[9.5px] font-mono text-amber-300 font-bold">
                      Refined Output
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(fastResult);
                        toast.success('Copied output to clipboard!');
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1 font-sans">
                    {fastResult}
                  </div>
                </div>
              )}

              {fastQuizQuestions.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {fastQuizQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-amber-800/60 space-y-1 text-xs">
                      <p className="font-bold text-white">Q{idx + 1}. {q.text}</p>
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        {q.options.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`p-1.5 rounded text-[11px] ${
                              i === q.correctOptionIndex
                                ? 'bg-emerald-950 border border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {['A', 'B', 'C', 'D'][i]}) {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE 5: DEEP REASONING */}
          {activeMode === 'deep_reasoning' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900 text-slate-100">
              <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-3.5 rounded-2xl border border-purple-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
                      Deep Academic Reasoning
                    </h3>
                  </div>
                  <span className="text-[8.5px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/40 px-1.5 py-0.5 rounded font-bold">
                    GEMINI 3.1 PRO
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                  Uses deep multi-step thinking for complex STEM proofs, diagnostic academic remediation, and strategic school operations modeling.
                </p>
              </div>

              <div>
                <textarea
                  value={deepTopic}
                  onChange={(e) => setDeepTopic(e.target.value)}
                  placeholder="Enter complex STEM problem, strategic inquiry, or institutional scenario..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-purple-900/60 focus:border-purple-400 text-xs text-white rounded-xl outline-none font-sans placeholder:text-slate-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleDeepReasoning}
                disabled={isDeepThinking || !deepTopic.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeepThinking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Engaging Gemini 3.1 Pro Thinking Mode...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5" />
                    <span>Execute High-Thinking Synthesis</span>
                  </>
                )}
              </button>

              {deepResult && (
                <div className="bg-slate-950 p-3 rounded-xl border border-purple-800/60 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[9.5px] font-mono text-purple-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Gemini 3.1 Pro Synthesis Output
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deepResult);
                        toast.success('Copied deep reasoning synthesis to clipboard!');
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto pr-1 font-sans">
                    {deepResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 6: TEACHER TEXT TO QUESTIONS */}
          {activeMode === 'text_to_questions' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
              <div className="bg-gradient-to-r from-emerald-950 to-indigo-950 text-white p-3 rounded-xl border border-emerald-800/60 space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Text-to-CBT Question Architect
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Paste any reading passage, scheme of work text, or textbook snippet. Nonye AI generates standard multiple-choice CBT questions with answer keys.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Subject / Examination Topic
                </label>
                <input
                  type="text"
                  value={questionSubject}
                  onChange={(e) => setQuestionSubject(e.target.value)}
                  placeholder="e.g. English Comprehension, SS 2 Chemistry"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Source Passage or Lesson Note Snippet
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">
                    Batch Limit: {permissions.maxQuestionsPerBatch} Questions
                  </span>
                </div>
                <textarea
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  placeholder="Paste or type text passage here (e.g. chapter reading, literature paragraph, history chronology)..."
                  rows={4}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-sans resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs font-bold text-slate-700">
                  <span>Questions Count:</span>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono outline-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    {permissions.maxQuestionsPerBatch >= 10 && <option value={10}>10 Questions</option>}
                    {permissions.maxQuestionsPerBatch >= 20 && <option value={20}>20 Questions</option>}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleBuildQuestionsFromText}
                  disabled={isBuildingQuestions || !passageText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isBuildingQuestions ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Build CBT Exam Questions</span>
                    </>
                  )}
                </button>
              </div>

              {generatedQuestions.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                      Generated CBT Questions ({generatedQuestions.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyGeneratedQuestions}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy All Questions</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800">Q{idx + 1}. {q.text}</span>
                          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                            {q.marks} pts
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-1">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-1.5 rounded-lg text-[11px] border ${
                                i === q.correctOptionIndex
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                              }`}
                            >
                              <strong>{['A', 'B', 'C', 'D'][i]})</strong> {opt}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100 mt-1">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiAssistantWidget;
