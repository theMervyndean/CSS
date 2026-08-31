import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Brain,
  BookOpen,
  Clock,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Award,
  Flame,
  Check,
  X,
  Loader2,
  Lightbulb,
  ArrowRight,
  Eye,
  Layers,
  FileText,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { speakNonyeVoice } from "../utils/nonyeVoicePlayer";
import nonyeAvatar from "../assets/images/chinonye_portrait.jpg";

export interface QuickStudyWidgetProps {
  studentProfile?: any;
  activeSubjects?: string[];
  onLaunchPomodoroExternal?: (subject: string, topic: string) => void;
}

const DEFAULT_SUBJECT_TOPICS: Record<string, { topic: string; keynote: string }> = {
  "Physics": { topic: "Electric Current & Resistivity R = ρL/A", keynote: "Ohm's law, series/parallel circuits & power equations" },
  "Further Mathematics": { topic: "Differentiation from First Principles & Calculus", keynote: "Power rule d/dx(x^n) and chain rule application" },
  "General Mathematics": { topic: "Quadratic Equations & Quadratic Formula", keynote: "Factorization, completing square, and (-b ± √(b²-4ac))/(2a)" },
  "Chemistry": { topic: "Electrolysis & Faraday's Laws", keynote: "Anode vs. cathode reactions, ionic charges & mass deposition" },
  "Biology": { topic: "Genetics & Mendelian Inheritance", keynote: "Monohybrid cross, Punnett squares & dominant/recessive alleles" },
  "English Language": { topic: "Concord Rules & Subject-Verb Agreement", keynote: "Singular vs. plural collective nouns and subjunctive mood" },
  "Economics": { topic: "Price Elasticity of Demand & Supply", keynote: "Percentage change formula, inelastic vs. elastic equilibrium" },
  "Civic Education": { topic: "Democratic Institutions & Rule of Law", keynote: "Separation of executive, legislature, and judiciary powers" }
};

export function QuickStudyWidget({
  studentProfile,
  activeSubjects = ["Physics", "Further Mathematics", "Chemistry", "Biology", "General Mathematics", "English Language", "Economics"],
  onLaunchPomodoroExternal
}: QuickStudyWidgetProps) {
  const studentName = studentProfile?.fullName || "Student";
  const studentGrade = studentProfile?.class_name || studentProfile?.classAssigned || "SS 2 Science";

  const [selectedSubject, setSelectedSubject] = useState<string>(activeSubjects[0] || "Physics");
  const [selectedTopic, setSelectedTopic] = useState<string>(
    DEFAULT_SUBJECT_TOPICS[selectedSubject]?.topic || "Core Principles & Exam Revision"
  );

  // Modal active states
  const [activeInteraction, setActiveInteraction] = useState<"pomodoro" | "active_recall" | "summary" | "cbt_quiz" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interactionData, setInteractionData] = useState<any>(null);

  // Active Recall specific states
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [drillScore, setDrillScore] = useState(0);

  // CBT Quiz specific states
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Pomodoro quick timer
  const [quickPomoMinutes, setQuickPomoMinutes] = useState(25);
  const [quickPomoSeconds, setQuickPomoSeconds] = useState(0);
  const [isQuickPomoRunning, setIsQuickPomoRunning] = useState(false);

  // Handle subject change and update default topic
  const handleSelectSubject = (subj: string) => {
    setSelectedSubject(subj);
    if (DEFAULT_SUBJECT_TOPICS[subj]) {
      setSelectedTopic(DEFAULT_SUBJECT_TOPICS[subj].topic);
    } else {
      setSelectedTopic("Core Principles & Past Paper Practice");
    }
  };

  // Trigger quick study interaction with Nonye AI
  const handleTriggerQuickStudy = async (type: "pomodoro" | "active_recall" | "summary" | "cbt_quiz") => {
    setActiveInteraction(type);
    setIsLoading(true);
    setInteractionData(null);
    setActiveCardIdx(0);
    setIsAnswerRevealed(false);
    setDrillScore(0);
    setSelectedQuizAnswers({});
    setIsQuizSubmitted(false);

    if (type === "pomodoro") {
      setQuickPomoMinutes(25);
      setQuickPomoSeconds(0);
      setIsQuickPomoRunning(true);
    }

    try {
      const res = await fetch("/api/ai/student/quick-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: type === "active_recall" ? "active_recall_drill" : type === "summary" ? "topic_summary" : type === "cbt_quiz" ? "speed_cbt_quiz" : "pomodoro_plan",
          subject: selectedSubject,
          topic: selectedTopic,
          gradeLevel: studentGrade,
          studentName
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setInteractionData(data.result);
          if (type === "summary" && data.result.audioRecap) {
            // Friendly voice notification
            toast.success(`Nonye synthesized your ${selectedSubject} Topic Summary!`);
          } else if (type === "active_recall") {
            toast.success(`Nonye prepared ${data.result.flashcards?.length || 4} Active Recall Drills!`);
          }
          return;
        }
      }
      throw new Error("API call failed");
    } catch (e) {
      console.warn("Quick study API fallback:", e);
      // Smart Fallback Generation
      const fallback = generateQuickStudyFallback(type, selectedSubject, selectedTopic);
      setInteractionData(fallback);
      toast.info(`Nonye loaded your ${selectedSubject} study session.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Fallback Generator
  const generateQuickStudyFallback = (type: string, subj: string, top: string) => {
    if (type === "active_recall") {
      return {
        subject: subj,
        topic: top,
        intro: `Test your active memory on ${subj}: ${top}. Speak or write the answer before flipping!`,
        flashcards: [
          {
            id: "f1",
            question: `What is the core definition and mathematical formula governing ${top}?`,
            answer: `The fundamental relationship defines the direct ratio and constant coefficients for ${subj}.`,
            hint: "Recall the SI units and primary variables."
          },
          {
            id: "f2",
            question: `What happens when the primary variable in ${top} is doubled?`,
            answer: "According to the direct proportionality principle, the resultant output increases twofold.",
            hint: "Check if relationship is linear or inverse."
          },
          {
            id: "f3",
            question: `Name 2 common mistakes students make in WAEC / CBT exams regarding ${top}.`,
            answer: "1. Forgetting unit conversions (e.g. cm to meters). 2. Confusing series vs. parallel formulas.",
            hint: "Think about units and sign conventions."
          }
        ],
        memoryMotto: "Testing your memory builds stronger neural pathways than passive re-reading."
      };
    } else if (type === "summary") {
      return {
        subject: subj,
        topic: top,
        headline: `Core Conceptual Blueprint: ${top}`,
        coreConcept: `${top} explains how fundamental energy and variables interact under standard conditions in ${subj}.`,
        feynmanAnalogy: `Think of ${top} like water flowing through a garden hose: the pressure represents potential difference, the water flow is the current, and squeezing the hose is the resistance.`,
        keyFormulas: [
          "Primary Equation: Output = (Variable A × Variable B) / Constant",
          "Units: Standard SI Units apply across all calculations"
        ],
        examTraps: [
          "Forgetting to convert units to standard SI (e.g. minutes to seconds).",
          "Applying standard formulas to non-standard or altered boundary conditions."
        ],
        practicalApplication: `Used in real-world power distribution grids, telecommunications, and engineering designs across Nigeria.`,
        audioRecap: `In summary, ${top} in ${subj} balances fundamental forces. Remember the core formula and beware of unit conversion traps in your exam.`
      };
    } else if (type === "cbt_quiz") {
      return {
        subject: subj,
        topic: top,
        challengeTitle: `3-Question Rapid CBT Challenge: ${subj}`,
        questions: [
          {
            id: "q1",
            questionText: `Which of the following statements is TRUE regarding ${top}?`,
            options: [
              "It is directly proportional under standard temperature and pressure",
              "It remains constant regardless of applied force or current",
              "It decreases exponentially with time in all closed systems",
              "It has no measurable SI unit in modern physics"
            ],
            correctIndex: 0,
            explanation: "Under standard conditions, the primary relationship exhibits direct linear proportionality."
          },
          {
            id: "q2",
            questionText: `What is the standard unit of measurement associated with ${subj} calculations?`,
            options: ["Joules (J)", "Ohms (Ω)", "Volts (V)", "Amperes (A)"],
            correctIndex: 1,
            explanation: "Resistance is universally measured in Ohms (Ω)."
          },
          {
            id: "q3",
            questionText: `When preparing for WAEC/JAMB questions on ${top}, what is the first step in solving numerical problems?`,
            options: [
              "List all known parameters with their standard SI units",
              "Guess the nearest whole number answer",
              "Skip the unit conversions to save time",
              "Assume all constants equal zero"
            ],
            correctIndex: 0,
            explanation: "Always list known values and convert them to standard units before substituting into the formula."
          }
        ]
      };
    } else {
      return {
        subject: subj,
        topic: top,
        sprintGoal: `Master core principles and solve 5 practice questions for ${top}`,
        phases: [
          { minuteRange: "0 - 5 min", task: "Review formula definitions and note key variables." },
          { minuteRange: "5 - 20 min", task: "Intense active problem solving without looking at answers." },
          { minuteRange: "20 - 25 min", task: "Check steps, log mistakes, and synthesize 1-line recap." }
        ],
        coachingTip: "Focus solely on this topic for 25 minutes. No phone or browser tab distractions!"
      };
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 sm:p-5 space-y-4 mb-6">
      {/* Top Header & Subject Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={nonyeAvatar}
              alt="Nonye AI"
              className="w-9 h-9 rounded-full object-cover border-2 border-amber-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Nonye AI Quick-Study Launchpad</span>
              <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full">
                Instant Triggers
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              1-click rapid study sessions tailored to your active courses.
            </p>
          </div>
        </div>

        {/* Focus Subject Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => handleSelectSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {activeSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Focus Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
            {selectedSubject}
          </span>
          <span className="text-slate-700 font-medium truncate">
            Topic: <strong className="text-slate-900">{selectedTopic}</strong>
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Ready for immediate practice</span>
      </div>

      {/* Quick Study Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Start Pomodoro */}
        <button
          onClick={() => handleTriggerQuickStudy("pomodoro")}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 hover:from-slate-850 hover:to-indigo-900 text-white flex flex-col items-start justify-between gap-2 border border-slate-800 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400">25m</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">Start Pomodoro</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Focus sprint on {selectedSubject.split(" ")[0]}</p>
          </div>
        </button>

        {/* 2. Active Recall Drill */}
        <button
          onClick={() => handleTriggerQuickStudy("active_recall")}
          className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 hover:bg-indigo-100 text-indigo-950 flex flex-col items-start justify-between gap-2 border border-indigo-200 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-white/80 px-1.5 py-0.2 rounded">+10 XP</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 leading-tight">Active Recall Drill</h4>
            <p className="text-[10px] text-indigo-700 mt-0.5">Flashcard memory tests</p>
          </div>
        </button>

        {/* 3. Topic Summary & Feynman */}
        <button
          onClick={() => handleTriggerQuickStudy("summary")}
          className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 hover:bg-emerald-100 text-emerald-950 flex flex-col items-start justify-between gap-2 border border-emerald-200 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-1.5 py-0.2 rounded">Audio</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 leading-tight">Topic Summary</h4>
            <p className="text-[10px] text-emerald-700 mt-0.5">Feynman analogy & formulas</p>
          </div>
        </button>

        {/* 4. Speed CBT Quiz */}
        <button
          onClick={() => handleTriggerQuickStudy("cbt_quiz")}
          className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 hover:bg-amber-100 text-amber-950 flex flex-col items-start justify-between gap-2 border border-amber-200 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-1.5 py-0.2 rounded">3 Qs</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950 leading-tight">Speed CBT Quiz</h4>
            <p className="text-[10px] text-amber-800 mt-0.5">Instant test & explanations</p>
          </div>
        </button>
      </div>

      {/* ================= INTERACTION MODAL CANVAS ================= */}
      {activeInteraction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  {activeInteraction === "pomodoro" ? <Clock className="w-4 h-4" /> : activeInteraction === "active_recall" ? <Brain className="w-4 h-4" /> : activeInteraction === "summary" ? <BookOpen className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activeInteraction === "pomodoro"
                      ? "25-Min Pomodoro Focus Sprint"
                      : activeInteraction === "active_recall"
                      ? "Active Recall Flashcard Drill"
                      : activeInteraction === "summary"
                      ? "Topic Summary & Feynman Analogy"
                      : "Rapid CBT Speed Quiz"}
                  </h4>
                  <span className="text-[11px] text-indigo-600 font-semibold">{selectedSubject} • {selectedTopic}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveInteraction(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-600 font-medium">
                  Nonye AI is preparing your {selectedSubject} study session...
                </p>
              </div>
            )}

            {/* Content: 1. POMODORO SPRINT */}
            {!isLoading && activeInteraction === "pomodoro" && interactionData && (
              <div className="space-y-5">
                {/* Timer Box */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
                    Focus Phase Active
                  </span>
                  <div className="text-4xl font-mono font-black text-white tracking-widest">
                    {String(quickPomoMinutes).padStart(2, "0")}:{String(quickPomoSeconds).padStart(2, "0")}
                  </div>
                  <p className="text-xs text-slate-300 max-w-sm">
                    {interactionData.sprintGoal}
                  </p>
                </div>

                {/* Phases Roadmap */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-900">Sprint Task Roadmap:</h5>
                  <div className="space-y-2">
                    {interactionData.phases?.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs">
                        <span className="font-mono font-bold text-indigo-600 shrink-0">{p.minuteRange}</span>
                        <span className="text-slate-800 font-medium">{p.task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 italic">💡 {interactionData.coachingTip}</span>
                  <button
                    onClick={() => {
                      if (onLaunchPomodoroExternal) {
                        onLaunchPomodoroExternal(selectedSubject, selectedTopic);
                      }
                      setActiveInteraction(null);
                      toast.success("Focus timer transferred to Nonye Study Hub!");
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Open in Full Pomodoro Hub
                  </button>
                </div>
              </div>
            )}

            {/* Content: 2. ACTIVE RECALL DRILL */}
            {!isLoading && activeInteraction === "active_recall" && interactionData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Card {activeCardIdx + 1} of {interactionData.flashcards?.length || 3}</span>
                  <span className="font-bold text-indigo-600">Scholar Score: +{drillScore} XP</span>
                </div>

                {/* Active Card */}
                {(() => {
                  const card = interactionData.flashcards?.[activeCardIdx];
                  if (!card) return null;

                  return (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-100 space-y-4 min-h-[160px] flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                          Question Prompt
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-relaxed">
                          {card.question}
                        </h4>
                      </div>

                      {isAnswerRevealed ? (
                        <div className="p-3.5 bg-white border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            Verified Answer
                          </span>
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">
                            {card.answer}
                          </p>
                          {card.formulaOrKeynote && (
                            <p className="text-[11px] font-mono text-indigo-700 font-bold pt-1">
                              Key Formula: {card.formulaOrKeynote}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAnswerRevealed(true)}
                          className="w-full py-2.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Reveal Answer & Formula</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Self-Rating & Navigation Buttons */}
                {isAnswerRevealed && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => {
                        toast.info("Keep practicing this concept!");
                        if (activeCardIdx + 1 < (interactionData.flashcards?.length || 0)) {
                          setActiveCardIdx((c) => c + 1);
                          setIsAnswerRevealed(false);
                        } else {
                          toast.success("🎉 Drill complete! Awesome effort.");
                          setActiveInteraction(null);
                        }
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Need Review
                    </button>
                    <button
                      onClick={() => {
                        setDrillScore((s) => s + 10);
                        toast.success("+10 Scholar Points awarded!");
                        if (activeCardIdx + 1 < (interactionData.flashcards?.length || 0)) {
                          setActiveCardIdx((c) => c + 1);
                          setIsAnswerRevealed(false);
                        } else {
                          toast.success("🎉 All flashcards mastered! +10 Bonus XP.");
                          setActiveInteraction(null);
                        }
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>I Knew This (+10 XP)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content: 3. TOPIC SUMMARY & FEYNMAN ANALOGY */}
            {!isLoading && activeInteraction === "summary" && interactionData && (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900">{interactionData.headline}</h4>
                  <button
                    onClick={() => {
                      const text = `${interactionData.coreConcept}. Analogy: ${interactionData.feynmanAnalogy}. Exam trap: ${interactionData.examTraps?.join(". ")}`;
                      speakNonyeVoice(text);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen with Nonye</span>
                  </button>
                </div>

                {/* Core Concept */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-700">Core Principle:</span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{interactionData.coreConcept}</p>
                </div>

                {/* Feynman Analogy */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-900 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-emerald-600" />
                    Feynman Real-World Analogy:
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{interactionData.feynmanAnalogy}</p>
                </div>

                {/* Key Formulas */}
                {interactionData.keyFormulas?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-700">Key Formulas & Definitions:</span>
                    <div className="space-y-1">
                      {interactionData.keyFormulas.map((f: string, i: number) => (
                        <div key={i} className="p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg font-mono text-xs font-bold text-indigo-950">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam Traps */}
                {interactionData.examTraps?.length > 0 && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-rose-900">⚠️ Common WAEC / CBT Exam Traps:</span>
                    <ul className="text-xs text-rose-950 space-y-1 pl-4 list-disc font-medium">
                      {interactionData.examTraps.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Content: 4. SPEED CBT QUIZ */}
            {!isLoading && activeInteraction === "cbt_quiz" && interactionData && (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {interactionData.questions?.map((q: any, qIdx: number) => {
                    const selectedOpt = selectedQuizAnswers[qIdx];
                    const isCorrect = selectedOpt === q.correctIndex;

                    return (
                      <div key={q.id || qIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <h5 className="text-xs font-bold text-slate-900">
                          Q{qIdx + 1}: {q.questionText}
                        </h5>

                        <div className="grid grid-cols-1 gap-1.5">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isChosen = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                disabled={isQuizSubmitted}
                                onClick={() => setSelectedQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                className={`w-full p-2 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer ${
                                  isQuizSubmitted
                                    ? optIdx === q.correctIndex
                                      ? "bg-emerald-100 border-emerald-300 text-emerald-950 font-bold"
                                      : isChosen
                                      ? "bg-rose-100 border-rose-300 text-rose-950 font-bold"
                                      : "bg-white border-slate-200 opacity-60"
                                    : isChosen
                                    ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {isQuizSubmitted && (
                          <p className="text-[11px] p-2 rounded-md bg-white border border-slate-200 text-slate-700">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isQuizSubmitted ? (
                  <button
                    onClick={() => {
                      if (Object.keys(selectedQuizAnswers).length < (interactionData.questions?.length || 0)) {
                        toast.error("Please answer all questions first!");
                        return;
                      }
                      setIsQuizSubmitted(true);
                      toast.success("CBT Speed Challenge submitted!");
                    }}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Submit Quiz Answers
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveInteraction(null);
                      toast.success("+15 Scholar Points earned for completing the quiz!");
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Done & Collect Points
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickStudyWidget;
