import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Brain,
  RefreshCw,
  Copy,
  Lightbulb,
  Award,
  Zap,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export interface AiTutorWidgetProps {
  className?: string;
}

export function AiTutorWidget({ className = "" }: AiTutorWidgetProps) {
  const [subject, setSubject] = useState<string>("Mathematics");
  const [promptInput, setPromptInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversation, setConversation] = useState<
    Array<{ role: "user" | "tutor"; text: string; topic?: string; timestamp: string }>
  >([
    {
      role: "tutor",
      text: "Hello! I am Nonye Scholar AI — your CornerStreams Socratic Homework & CBT Exam Mentor from Ngwa, Abia State. Ask me any question from your homework, past CBT questions, or request an instant practice drill!",
      topic: "General Guidance",
      timestamp: "Just now"
    }
  ]);

  const SUBJECTS = [
    "Mathematics",
    "English Language",
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "CBT Computer Studies"
  ];

  const SAMPLE_DRILLS = [
    "Explain how to solve quadratic equations using completing the square method.",
    "Break down the difference between passive and active voice in English grammar.",
    "Explain Newton's Second Law of Motion with real-world examples.",
    "How does photosynthesis convert light energy into chemical energy in plants?"
  ];

  const handleAskTutor = async (customText?: string) => {
    const query = customText || promptInput.trim();
    if (!query) {
      toast.error("Please enter a question or topic for the AI Tutor.");
      return;
    }

    const userMessage = {
      role: "user" as const,
      text: query,
      topic: subject,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversation((prev) => [...prev, userMessage]);
    setPromptInput("");
    setIsLoading(true);

    try {
      let tutorAnswer = "";
      try {
        const res = await fetch("/api/ai/scholar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, subject, gradeLevel: "SS 2 / Senior Secondary" })
        });
        if (res.ok) {
          const data = await res.json();
          tutorAnswer = data.explanation;
        } else {
          throw new Error("API call returned error status");
        }
      } catch (e) {
        // Fallback offline synthesizer
        if (query.toLowerCase().includes("quadratic")) {
          tutorAnswer = `### 📐 Step-by-Step Solution: Quadratic Equations (Completing the Square)\n\n**Equation Standard Form:** $ax^2 + bx + c = 0$\n\n1. **Move Constant Term:** Shift $c$ to the right-hand side ($ax^2 + bx = -c$).\n2. **Divide by $a$:** Make the leading coefficient equal to 1 ($x^2 + \\frac{b}{a}x = -\\frac{c}{a}$).\n3. **Add $(b/2a)^2$ to both sides:** This turns the left expression into a perfect square trinomial!\n4. **Factor & Take Square Root:** Simplify $(x + \\frac{b}{2a})^2 = D$ and solve for $x$.\n\n💡 **Practice Drill Question:** Try solving $x^2 + 6x - 7 = 0$! Answer: $x = 1$ or $x = -7$.`;
        } else if (query.toLowerCase().includes("photosynthesis")) {
          tutorAnswer = `### 🌿 Light & Dark Reactions of Photosynthesis\n\n**Chemical Formula:** $6CO_2 + 6H_2O + \\text{Light} \\rightarrow C_6H_{12}O_6 + 6O_2$\n\n- **Stage 1 (Light-Dependent Reaction):** Takes place inside the thylakoid membranes of chloroplasts. Sunlight splits water molecules ($H_2O$) releasing Oxygen ($O_2$) and producing ATP & NADPH.\n- **Stage 2 (Calvin Cycle / Dark Reaction):** Occurs in the stroma. Carbon Dioxide ($CO_2$) is fixed into glucose using the energy stored in ATP.\n\n💡 **CBT Quick Drill:** Which organelle is responsible for photosynthesis? **Answer:** Chloroplast.`;
        } else {
          tutorAnswer = `### 💡 Nonye Scholar AI Guidance for ${subject}\n\nHere is your step-by-step breakdown:\n\n1. **Core Concept:** ${query}\n2. **Key Rule:** Always double-check definitions and formulas before writing your final answer.\n3. **Exam Tip:** In terminal exams, clearly state your formula and intermediate steps to earn full step-marks!\n\nWould you like me to generate a 3-question CBT practice drill on this topic?`;
        }
      }

      const tutorResponse = {
        role: "tutor" as const,
        text: tutorAnswer,
        topic: subject,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setConversation((prev) => [...prev, tutorResponse]);
      setIsLoading(false);
      toast.success("Nonye Scholar AI explanation ready!");
    } catch (err) {
      setIsLoading(false);
      toast.error("Failed to fetch response from Nonye Scholar AI.");
    }
  };

  return (
    <div className={`cs-card p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl text-white space-y-5 ${className}`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Nonye Scholar AI &amp; Homework Mentor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Nonye AI &bull; Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Get instant step-by-step explanations, homework solutions, and practice CBT drills.
            </p>
          </div>
        </div>

        {/* SUBJECT SELECTOR */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CHAT FEED CONTAINER */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 font-sans">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "tutor" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl max-w-[85%] space-y-1.5 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none font-semibold"
                  : "bg-slate-850 border border-slate-750 text-slate-200 rounded-tl-none whitespace-pre-wrap leading-relaxed font-sans"
              }`}
            >
              <div className="flex items-center justify-between gap-4 text-[9.5px] font-mono text-slate-400 border-b border-slate-700/50 pb-1">
                <span>{msg.role === "user" ? "You" : "AI Tutor"}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="text-xs">{msg.text}</p>
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 p-3 bg-slate-900 border border-slate-800 rounded-xl animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Nonye Scholar AI is synthesizing solution steps...</span>
          </div>
        )}
      </div>

      {/* QUICK DRILL PROMPTS */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" /> Suggested Practice Questions
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DRILLS.map((drill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskTutor(drill)}
              className="text-[10.5px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition cursor-pointer text-left truncate max-w-xs"
            >
              {drill}
            </button>
          ))}
        </div>
      </div>

      {/* PROMPT INPUT FORM */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAskTutor()}
          placeholder={`Ask AI Tutor a question in ${subject}...`}
          className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-sans placeholder-slate-500"
        />
        <button
          type="button"
          onClick={() => handleAskTutor()}
          disabled={isLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default AiTutorWidget;
