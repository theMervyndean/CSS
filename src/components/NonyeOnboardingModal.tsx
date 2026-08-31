import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Bot, X, CheckCircle2, ArrowRight, ArrowLeft,
  Volume2, Pause, Zap, Brain, Globe, FileText, 
  GraduationCap, Shield, HelpCircle, Eye, Sliders, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { playNonyeVoice, stopNonyeVoice } from '../utils/nonyeVoicePlayer';
import { UserProfile } from '../types';
import nonyeAvatar from '../assets/images/chinonye_portrait.jpg';

interface NonyeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  schoolName?: string;
  subscriptionTier?: string;
  onOpenAssistant?: (initialPrompt?: string) => void;
}

export const NonyeOnboardingModal: React.FC<NonyeOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  schoolName = 'Corner Streams School',
  subscriptionTier = 'unified_enterprise',
  onOpenAssistant
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<'fluent' | 'neutral'>(() => {
    const saved = localStorage.getItem('nonye_voice_style') || localStorage.getItem('chinonye_voice_style');
    return (saved === 'neutral' || saved === 'fluent') ? saved : 'fluent';
  });
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const isTeacher = currentUserProfile.role === 'Class_Teacher' || 
                    currentUserProfile.role === 'Non_Class_Teacher' || 
                    currentUserProfile.role === 'Teacher' || 
                    currentUserProfile.role === 'Subject_Teacher';
  const isAdmin = currentUserProfile.role === 'School_Admin' || 
                  currentUserProfile.role === 'Super_Admin' || 
                  currentUserProfile.role === 'Admin' || 
                  currentUserProfile.role === 'Principal';
  const isStudent = currentUserProfile.role === 'Student';
  const isParent = currentUserProfile.role === 'Parent';

  // Stop voice when modal unmounts or closes
  useEffect(() => {
    if (!isOpen) {
      stopNonyeVoice();
      setIsPlayingVoice(false);
    }
  }, [isOpen]);

  const handleVoiceToggle = () => {
    if (isPlayingVoice) {
      stopNonyeVoice();
      setIsPlayingVoice(false);
      return;
    }

    const greetingText = `Hello ${currentUserProfile.fullName}! I am Nonye AI, your school operations and academic co-pilot from Ngwa, Abia State, Nigeria. I am right here on Corner Streams to help you with grading, examination creation, classroom management, and school intelligence. Welcome aboard!`;

    playNonyeVoice({
      text: greetingText,
      isGreetingOrProfile: true,
      voiceStyle,
      onStart: () => setIsPlayingVoice(true),
      onEnd: () => setIsPlayingVoice(false),
      onError: (err) => {
        setIsPlayingVoice(false);
        toast.info(err?.message || "Nonye voice sample ready");
      }
    });

    toast.info("🔊 Playing Nonye AI introduction...", { duration: 3000 });
  };

  const handleVoiceStyleChange = (style: 'fluent' | 'neutral') => {
    setVoiceStyle(style);
    localStorage.setItem('nonye_voice_style', style);
    stopNonyeVoice();
    setIsPlayingVoice(false);
    toast.success(
      style === 'fluent'
        ? "🇳🇬 Voice set to: Nonye's Fluid Accent (Ngwa, Abia State)"
        : "🌐 Voice set to: Standard Professional Voice"
    );
  };

  const handleFinishOnboarding = (launchPrompt?: string) => {
    stopNonyeVoice();
    if (dontShowAgain) {
      localStorage.setItem(`nonye_onboarded_${currentUserProfile.id}`, 'true');
      localStorage.setItem('nonye_onboarded_global', 'true');
    }
    onClose();
    if (launchPrompt && onOpenAssistant) {
      onOpenAssistant(launchPrompt);
    }
  };

  if (!isOpen) return null;

  // Role-specific superpowers
  const getRoleCapabilities = () => {
    if (isTeacher) {
      return [
        {
          icon: FileText,
          title: "Text-to-CBT Exam Architect",
          desc: "Paste any reading passage or scheme of work note to instantly generate 5 to 20 CBT exam questions with verified answer keys.",
          tag: "Teacher Power"
        },
        {
          icon: Sparkles,
          title: "Report Card Narrative Synthesizer",
          desc: "Draft individualized terminal report comments, behavioral praise, and actionable student recommendations in seconds.",
          tag: "Grading Assistant"
        },
        {
          icon: GraduationCap,
          title: "Socratic Lesson & Homework Helper",
          desc: "Break down complex STEM proofs and English grammar rules step-by-step for classroom instruction.",
          tag: "Academic"
        },
        {
          icon: Eye,
          title: "Live Screen Context Awareness",
          desc: "Nonye AI reads your current classroom gradebook and student list so you never have to retype data into chat prompts.",
          tag: "J.A.R.V.I.S. Vision"
        }
      ];
    }

    if (isAdmin) {
      return [
        {
          icon: Shield,
          title: "360° Institutional Operational Audit",
          desc: "Instant executive briefings on school enrollment, teacher subject coverage, and terminal broadsheet verification status.",
          tag: "Executive"
        },
        {
          icon: Zap,
          title: "Campus Bursary & Ledger Compliance",
          desc: "Analyze tuition fee compliance rates, outstanding student debtor lists, and generate official parent payment notices.",
          tag: "Financial"
        },
        {
          icon: Globe,
          title: "Real-Time Google Search Grounding",
          desc: "Retrieve live WAEC, NECO, and JAMB curriculum updates, NERDC regulations, and educational policy standards.",
          tag: "Gemini 3.5 Flash"
        },
        {
          icon: Brain,
          title: "Deep Multi-Step Strategic Reasoning",
          desc: "Engage high-thinking mode (Gemini 3.1 Pro) for complex campus timetable scheduling and staffing allocations.",
          tag: "Gemini 3.1 Pro"
        }
      ];
    }

    if (isStudent) {
      return [
        {
          icon: GraduationCap,
          title: "Nonye Scholar AI Homework Tutor",
          desc: "Get step-by-step Socratic explanations for tricky math, physics, biology, and grammar questions without cheating.",
          tag: "24/7 Mentor"
        },
        {
          icon: Zap,
          title: "Instant CBT Practice Drills",
          desc: "Practice quick 3-question quizzes on any topic to prepare for your terminal school exams and CBT trials.",
          tag: "Exam Prep"
        },
        {
          icon: Volume2,
          title: "Live Voice Spoken Co-Pilot",
          desc: "Talk to Nonye AI aloud through your microphone and receive natural spoken explanations in real-time.",
          tag: "Voice AI"
        },
        {
          icon: Sparkles,
          title: "Exam Result & Performance Advisory",
          desc: "Receive constructive feedback on your completed CBT exam scores to help boost your term average.",
          tag: "Self-Paced"
        }
      ];
    }

    // Default / Parent
    return [
      {
        icon: GraduationCap,
        title: "Child Academic Progress Insights",
        desc: "Understand your child's terminal report card performance, attendance consistency, and subject strengths.",
        tag: "Parent Desk"
      },
      {
        icon: Shield,
        title: "Tuition & Bursary Verification",
        desc: "Review school fees breakdown and verify digital receipts issued by Corner Streams bursary.",
        tag: "Financial"
      },
      {
        icon: Volume2,
        title: "Spoken Voice Consultation",
        desc: "Ask questions naturally using Nonye AI's warm voice engine.",
        tag: "Voice AI"
      },
      {
        icon: Sparkles,
        title: "Direct School Advisory",
        desc: "Receive clear guidance on school calendars, term dates, and examination schedules.",
        tag: "Communication"
      }
    ];
  };

  const roleCaps = getRoleCapabilities();

  // Quick Starter Prompts for Step 4
  const getQuickStarters = () => {
    if (isTeacher) {
      return [
        "Generate 5 CBT multiple-choice questions for SS 2 Chemistry with answer keys",
        "Draft professional terminal report card comments for my top-performing students",
        "Scan my active classroom page and summarize student attendance gaps"
      ];
    }
    if (isAdmin) {
      return [
        "Synthesize a 360° institutional operational audit of Corner Streams School",
        "What is our current tuition fee collection percentage and outstanding balance?",
        "Check 2026 WAEC and JAMB syllabus updates for Senior Secondary Science"
      ];
    }
    if (isStudent) {
      return [
        "Explain how to solve quadratic equations by completing the square",
        "Give me a 3-question quick practice drill on Photosynthesis in Biology",
        "What are the best study techniques for my upcoming terminal CBT exams?"
      ];
    }
    return [
      "How do I track my child's terminal report card grades and CBT scores?",
      "Explain the breakdown of our term tuition fees and digital receipt",
      "What are the upcoming school term dates and academic deadlines?"
    ];
  };

  const quickStarters = getQuickStarters();

  return (
    <AnimatePresence>
      <div id="nonye-onboarding-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md select-none font-sans overflow-y-auto">
        <motion.div
          id="nonye-onboarding-modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* HEADER STRIP - DEEP INDIGO GRADIENT */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-800/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={nonyeAvatar} 
                  alt="Nonye AI" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wide text-white font-display">
                    Welcome to Nonye AI
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    School Co-Pilot
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Corner Streams Intelligent Operations &amp; Academic Assistant
                </p>
              </div>
            </div>

            <button
              id="nonye-onboarding-close-btn"
              type="button"
              onClick={() => handleFinishOnboarding()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close Onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP PROGRESS INDICATOR */}
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((stepIdx) => (
                <button
                  key={stepIdx}
                  type="button"
                  onClick={() => setCurrentStep(stepIdx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    currentStep === stepIdx
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : currentStep > stepIdx
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span>{stepIdx + 1}</span>
                  <span className="hidden sm:inline">
                    {stepIdx === 0 && 'Meet Nonye'}
                    {stepIdx === 1 && 'Superpowers'}
                    {stepIdx === 2 && 'Screen Vision'}
                    {stepIdx === 3 && 'Get Started'}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              Step {currentStep + 1} of 4
            </span>
          </div>

          {/* MODAL BODY (SCROLLABLE) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50">
            
            {/* STEP 0: IDENTITY & AUDIO INTRODUCTION */}
            {currentStep === 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl">
                      <img 
                        src={nonyeAvatar} 
                        alt="Nonye AI Portrait" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full shadow border border-emerald-300 uppercase tracking-wider">
                      Ngwa • Abia
                    </span>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h3 className="text-lg font-black tracking-tight text-white font-display">
                        Hello, {currentUserProfile.fullName}!
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-mono font-bold rounded">
                        {currentUserProfile.role.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      I am <strong>Nonye AI</strong>, your dedicated operations and academic AI co-pilot for <strong>{schoolName}</strong>. Born and rooted in <strong>Ngwa, Abia State, Nigeria</strong> (165cm tall), I speak articulate, fluent English with a warm, natural accent.
                    </p>

                    <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                      <button
                        type="button"
                        onClick={handleVoiceToggle}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer border ${
                          isPlayingVoice 
                            ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' 
                            : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white border-emerald-500/40'
                        }`}
                      >
                        {isPlayingVoice ? (
                          <>
                            <Pause className="w-4 h-4 text-white" />
                            <span>Stop Voice Greeting</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-white" />
                            <span>🔊 Listen to Nonye's Spoken Greeting</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Voice Tone Selector */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Choose Nonye's Voice Accent Cadence:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Neural Speech Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceStyleChange('fluent')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        voiceStyle === 'fluent'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span>🇳🇬</span>
                          <span>Fluid Natural Accent</span>
                        </span>
                        {voiceStyle === 'fluent' && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Articulate English cadence modeled after authentic speech from Abia State.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoiceStyleChange('neutral')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        voiceStyle === 'neutral'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span>🌐</span>
                          <span>Standard Professional</span>
                        </span>
                        {voiceStyle === 'neutral' && (
                          <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Neutral international broadcast cadence for global clarity.
                      </p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: ROLE-SPECIFIC SUPERPOWERS */}
            {currentStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-display">
                      Superpowers Tailored for {currentUserProfile.role.replace(/_/g, ' ')}s
                    </h3>
                    <p className="text-xs text-slate-500">
                      Nonye AI configures her intelligence engine specifically for your duties at {schoolName}.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg">
                    {subscriptionTier.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roleCaps.map((cap, idx) => {
                    const Icon = cap.icon;
                    return (
                      <div 
                        key={idx}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {cap.tag}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{cap.title}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{cap.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: SCREEN VISION TELEMETRY */}
            {currentStep === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 shadow-md space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white font-display">
                        J.A.R.V.I.S. Screen Vision Telemetry
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        Zero tedious prompt typing — Nonye AI is always aware of your active screen.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">1. Active View</span>
                      <p className="text-[11px] text-slate-300">Tracks whether you are viewing gradebooks, CBT exams, or bursary records.</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">2. Table Telemetry</span>
                      <p className="text-[11px] text-slate-300">Reads visible student names, scores, and fee totals automatically.</p>
                    </div>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">3. One-Click Context</span>
                      <p className="text-[11px] text-slate-300">Click "Refresh Context" inside the widget anytime for instant diagnosis.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-xs">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">How to summon Nonye AI anytime:</h4>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Click the floating <strong>Nonye AI button</strong> at the bottom right corner of your screen on any page. You can type questions, talk with live voice, or click suggested prompt chips tailored to your screen.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GET STARTED & SAMPLE PROMPTS */}
            {currentStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 font-display">
                    Ready to Stream with Nonye AI!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pick a starter command below to launch Nonye AI directly, or enter your workspace:
                  </p>
                </div>

                <div className="space-y-2">
                  {quickStarters.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFinishOnboarding(starter)}
                      className="w-full p-3 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-400 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 group-hover:rotate-12 transition-transform shrink-0" />
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-950">
                          {starter}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Do not show this onboarding tour on future logins</span>
                  </label>
                </div>
              </motion.div>
            )}

          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinishOnboarding()}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
              >
                Skip Introduction
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Launch Workspace</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NonyeOnboardingModal;
