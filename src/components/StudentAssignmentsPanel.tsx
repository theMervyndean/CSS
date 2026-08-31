import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Send,
  Volume2,
  VolumeX,
  Square,
  Play,
  Headphones,
  HelpCircle,
  FileText,
  Check,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  FileCheck,
  UploadCloud,
  MessageSquare,
  BadgeCheck,
  Layers,
  BrainCircuit,
  Filter,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { playNonyeVoice, stopNonyeVoice, speakNonyeVoice } from "../utils/nonyeVoicePlayer";
import { Assignment, AssignmentSubmission, SocraticMessage } from "../types";
import nonyeAvatar from "../assets/images/chinonye_portrait.jpg";

export interface StudentAssignmentsPanelProps {
  currentProfile: any;
}

// Initial realistic seed assignments for Nigerian Curriculum
const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    title: "Ohm's Law & Circuit Calculations",
    subject: "Physics",
    topic: "Electric Current, Resistance & Series/Parallel Circuits",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-1",
    assignedByTeacherName: "Mrs. Folasade Adebayo",
    assignedDate: "2026-08-16",
    dueDate: "2026-08-22",
    dueTime: "11:59 PM",
    description: "Solve the 4 circuit analysis problems. Compute total equivalent resistance, current draw, and potential difference across each branch. Show all formula substitutions.",
    instructions: [
      "1. State Ohm's Law and its mathematical expression.",
      "2. Calculate equivalent resistance for three resistors: R1 = 4Ω, R2 = 6Ω in parallel, connected in series with R3 = 5Ω.",
      "3. If connected to a 24V DC battery with 1Ω internal resistance, find total circuit current.",
      "4. Calculate the voltage drop across the parallel combination."
    ],
    maxMarks: 20,
    socraticContext: "Help students remember 1/R_p = 1/R1 + 1/R2. Prompt them to simplify parallel branches before adding series branch.",
    status: "active"
  },
  {
    id: "asg-2",
    title: "Calculus: Differentiation from First Principles",
    subject: "Further Mathematics",
    topic: "Limits and Differential Coefficients",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-1",
    assignedByTeacherName: "Mrs. Folasade Adebayo",
    assignedDate: "2026-08-17",
    dueDate: "2026-08-24",
    dueTime: "11:59 PM",
    description: "Differentiate f(x) = 3x² - 5x + 2 from first principles using the definition f'(x) = lim(h->0) [f(x+h) - f(x)] / h.",
    instructions: [
      "1. Expand f(x+h) step by step with careful algebraic simplification.",
      "2. Factor out h from the numerator before taking the limit as h approaches 0.",
      "3. Verify your result using the standard power rule d/dx(x^n) = n*x^(n-1)."
    ],
    maxMarks: 15,
    socraticContext: "Ensure student expands (x+h)^2 = x^2 + 2xh + h^2 correctly and does not divide by zero before canceling h.",
    status: "active"
  },
  {
    id: "asg-3",
    title: "Essay: The Impact of Monetary Policy on Inflation in Nigeria",
    subject: "Economics",
    topic: "Macroeconomics, Central Banking & Inflation Control",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-2",
    assignedByTeacherName: "Dr. Emeka Nwosu",
    assignedDate: "2026-08-14",
    dueDate: "2026-08-20",
    dueTime: "05:00 PM",
    description: "Write a 400-word analytical essay on how the Central Bank of Nigeria uses Cash Reserve Ratios (CRR) and Monetary Policy Rates (MPR) to stabilize price levels.",
    instructions: [
      "1. Define inflation and identify demand-pull vs cost-push inflation in Nigeria.",
      "2. Explain how raising the MPR affects commercial bank lending rates.",
      "3. Evaluate the trade-off between fighting inflation and economic growth."
    ],
    maxMarks: 25,
    socraticContext: "Guide student on the transmission mechanism of interest rates to consumer spending.",
    status: "active"
  }
];

export function StudentAssignmentsPanel({ currentProfile }: StudentAssignmentsPanelProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // Solution Submission Form
  const [solutionText, setSolutionText] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in_progress" | "submitted" | "graded">("all");

  // Student progress state for each assignment
  const [studentProgress, setStudentProgress] = useState<Record<string, "pending" | "in_progress" | "submitted">>({});

  // Nonye Socratic Chat states
  const [socraticMessages, setSocraticMessages] = useState<Record<string, SocraticMessage[]>>({});
  const [socraticInput, setSocraticInput] = useState("");
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);
  const [isSocraticOpen, setIsSocraticOpen] = useState(false);

  // Nonye Voice Synthesis states for Socratic 'Mentor Me' Chat
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("CS_SOCRATIC_AUTO_SPEAK") === "true";
    } catch {
      return false;
    }
  });

  // Stop active voice playback on unmount
  useEffect(() => {
    return () => {
      stopNonyeVoice();
    };
  }, []);

  // Load from local storage with initial seeds
  useEffect(() => {
    const savedAsg = localStorage.getItem("CS_ASSIGNMENTS");
    if (savedAsg) {
      try {
        setAssignments(JSON.parse(savedAsg));
      } catch (e) {
        setAssignments(DEFAULT_ASSIGNMENTS);
      }
    } else {
      setAssignments(DEFAULT_ASSIGNMENTS);
      localStorage.setItem("CS_ASSIGNMENTS", JSON.stringify(DEFAULT_ASSIGNMENTS));
    }

    let loadedSubs: Record<string, AssignmentSubmission> = {};
    const savedSubs = localStorage.getItem("CS_ASSIGNMENT_SUBMISSIONS");
    if (savedSubs) {
      try {
        loadedSubs = JSON.parse(savedSubs);
        setSubmissions(loadedSubs);
      } catch (e) {}
    }

    const savedProg = localStorage.getItem("CS_STUDENT_ASSIGNMENT_PROGRESS");
    if (savedProg) {
      try {
        setStudentProgress(JSON.parse(savedProg));
      } catch (e) {}
    } else {
      // Derive initial progress from submissions
      const initProg: Record<string, "pending" | "in_progress" | "submitted"> = {};
      DEFAULT_ASSIGNMENTS.forEach((a) => {
        if (loadedSubs[a.id]?.status === "graded" || loadedSubs[a.id]?.status === "pending_review") {
          initProg[a.id] = "submitted";
        } else if (loadedSubs[a.id]?.status === "in_progress" || a.id === "asg-1") {
          initProg[a.id] = "in_progress";
        } else {
          initProg[a.id] = "pending";
        }
      });
      setStudentProgress(initProg);
      localStorage.setItem("CS_STUDENT_ASSIGNMENT_PROGRESS", JSON.stringify(initProg));
    }

    const savedChats = localStorage.getItem("CS_ASSIGNMENT_SOCRATIC_CHATS");
    if (savedChats) {
      try {
        setSocraticMessages(JSON.parse(savedChats));
      } catch (e) {}
    }
  }, []);

  // Helper to get progress
  const getTaskProgress = (asgId: string): "pending" | "in_progress" | "submitted" => {
    if (submissions[asgId]?.status === "graded" || submissions[asgId]?.status === "pending_review") {
      return "submitted";
    }
    return studentProgress[asgId] || "pending";
  };

  // Toggle student progress status
  const handleToggleProgress = (asgId: string, newStatus: "pending" | "in_progress" | "submitted") => {
    const updatedProg = { ...studentProgress, [asgId]: newStatus };
    setStudentProgress(updatedProg);
    localStorage.setItem("CS_STUDENT_ASSIGNMENT_PROGRESS", JSON.stringify(updatedProg));

    // Also sync with submissions record for teacher visibility
    const existingSub = submissions[asgId];
    const currentNotes = selectedAssignment?.id === asgId ? studentNotes : (existingSub?.studentNotes || "");

    if (newStatus === "in_progress") {
      const inProgSub: AssignmentSubmission = existingSub
        ? {
            ...existingSub,
            status: "in_progress" as any,
            progressStatus: "in_progress" as any,
            studentNotes: currentNotes,
            updatedAt: new Date().toISOString()
          }
        : {
            id: `sub-${currentProfile.id}-${asgId}`,
            assignmentId: asgId,
            studentId: currentProfile.id,
            studentName: currentProfile.fullName || "Student",
            classCohort: currentProfile.classCohort || "SS 2 Science",
            status: "in_progress",
            progressStatus: "in_progress",
            solutionText: solutionText || "",
            studentNotes: currentNotes,
            socraticDialogueCount: (socraticMessages[asgId] || []).length,
            updatedAt: new Date().toISOString()
          };
      const updatedSubs = { ...submissions, [asgId]: inProgSub };
      setSubmissions(updatedSubs);
      localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updatedSubs));
      toast.info(`Task marked as "In Progress". Context notes updated!`);
    } else if (newStatus === "pending") {
      if (existingSub && existingSub.status !== "graded") {
        const pendingSub = {
          ...existingSub,
          status: "not_submitted" as any,
          progressStatus: "pending" as any,
          studentNotes: currentNotes,
          updatedAt: new Date().toISOString()
        };
        const updatedSubs = { ...submissions, [asgId]: pendingSub };
        setSubmissions(updatedSubs);
        localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updatedSubs));
      }
      toast.info(`Task status set to "Pending".`);
    } else if (newStatus === "submitted") {
      if (!existingSub || existingSub.status === "in_progress" || existingSub.status === "not_submitted") {
        const subId = existingSub?.id || `sub-${currentProfile.id}-${asgId}`;
        const newSubmission: AssignmentSubmission = {
          id: subId,
          assignmentId: asgId,
          studentId: currentProfile.id,
          studentName: currentProfile.fullName || "Student",
          classCohort: currentProfile.classCohort || "SS 2 Science",
          submittedAt: existingSub?.submittedAt || new Date().toISOString(),
          status: "pending_review",
          progressStatus: "submitted",
          solutionText: solutionText || existingSub?.solutionText || "Task marked completed by student.",
          studentNotes: currentNotes,
          socraticDialogueCount: (socraticMessages[asgId] || []).length,
          updatedAt: new Date().toISOString()
        };
        const updatedSubs = { ...submissions, [asgId]: newSubmission };
        setSubmissions(updatedSubs);
        localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updatedSubs));
        toast.success(`Task marked as "Submitted" for teacher review!`);
      }
    }
  };

  // Dedicated helper to persist student notes for teacher review in real time
  const handleSaveStudentNotes = (asgId: string, notes: string) => {
    const existingSub = submissions[asgId];
    const currentProg = getTaskProgress(asgId);

    const subToSave: AssignmentSubmission = existingSub
      ? {
          ...existingSub,
          studentNotes: notes,
          updatedAt: new Date().toISOString()
        }
      : {
          id: `sub-${currentProfile.id}-${asgId}`,
          assignmentId: asgId,
          studentId: currentProfile.id,
          studentName: currentProfile.fullName || "Student",
          classCohort: currentProfile.classCohort || "SS 2 Science",
          status: currentProg === "submitted" ? "pending_review" : (currentProg as any),
          progressStatus: currentProg,
          solutionText: solutionText || "",
          studentNotes: notes,
          socraticDialogueCount: (socraticMessages[asgId] || []).length,
          submittedAt: currentProg === "submitted" ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };

    const updatedSubs = { ...submissions, [asgId]: subToSave };
    setSubmissions(updatedSubs);
    localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updatedSubs));
  };

  // Save submission
  const handleSubmitSolution = (asg: Assignment) => {
    if (!solutionText.trim()) {
      toast.error("Please enter your homework solution or working steps.");
      return;
    }

    setIsSubmitting(true);
    const subId = submissions[asg.id]?.id || `sub-${currentProfile.id}-${asg.id}`;
    const newSubmission: AssignmentSubmission = {
      id: subId,
      assignmentId: asg.id,
      studentId: currentProfile.id,
      studentName: currentProfile.fullName || "Student",
      classCohort: currentProfile.classCohort || "SS 2 Science",
      submittedAt: new Date().toISOString(),
      status: "pending_review",
      progressStatus: "submitted",
      solutionText: solutionText,
      studentNotes: studentNotes,
      socraticDialogueCount: (socraticMessages[asg.id] || []).length,
      updatedAt: new Date().toISOString()
    };

    const updatedSubs = { ...submissions, [asg.id]: newSubmission };
    setSubmissions(updatedSubs);
    localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updatedSubs));

    const updatedProg = { ...studentProgress, [asg.id]: "submitted" as const };
    setStudentProgress(updatedProg);
    localStorage.setItem("CS_STUDENT_ASSIGNMENT_PROGRESS", JSON.stringify(updatedProg));

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`🎉 Homework for "${asg.title}" submitted to ${asg.assignedByTeacherName} successfully!`);
    }, 500);
  };

  // Speak or stop speaking a specific Socratic message using Nonye AI's configured ElevenLabs voice
  const handleSpeakSocraticMessage = (msg: SocraticMessage) => {
    if (playingMessageId === msg.id) {
      stopNonyeVoice();
      setPlayingMessageId(null);
      return;
    }

    stopNonyeVoice();
    setPlayingMessageId(msg.id);

    const speechParts = [msg.text];
    if (msg.guidingQuestion) {
      speechParts.push(`Think about this: ${msg.guidingQuestion}`);
    }
    if (msg.formulaHint) {
      speechParts.push(`Formula clue: ${msg.formulaHint}`);
    }

    const fullSpeechText = speechParts.join(". ");

    playNonyeVoice({
      text: fullSpeechText,
      voiceStyle: "fluent",
      onStart: () => {
        setPlayingMessageId(msg.id);
      },
      onEnd: () => {
        setPlayingMessageId(null);
      },
      onError: (err) => {
        console.warn("Nonye voice synthesis error:", err);
        setPlayingMessageId(null);
      }
    });
  };

  // Toggle auto-read aloud for incoming Socratic guidance
  const handleToggleAutoSpeak = () => {
    const nextVal = !isAutoSpeakEnabled;
    setIsAutoSpeakEnabled(nextVal);
    try {
      localStorage.setItem("CS_SOCRATIC_AUTO_SPEAK", String(nextVal));
    } catch {}
    if (nextVal) {
      toast.success("✨ Nonye AI Voice Auto-Read enabled for Socratic mentor guidance!");
    } else {
      toast.info("Auto-Read turned off. You can still click the speaker button on any message.");
    }
  };

  // Trigger Socratic dialogue with Nonye AI
  const handleSendSocraticQuery = async (queryText?: string) => {
    if (!selectedAssignment) return;
    const textToSend = queryText || socraticInput;
    if (!textToSend.trim()) return;

    const asgId = selectedAssignment.id;
    const currentList = socraticMessages[asgId] || [];

    const userMsg: SocraticMessage = {
      id: `msg-${Date.now()}`,
      sender: "student",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextList = [...currentList, userMsg];
    const updatedChats = { ...socraticMessages, [asgId]: nextList };
    setSocraticMessages(updatedChats);
    localStorage.setItem("CS_ASSIGNMENT_SOCRATIC_CHATS", JSON.stringify(updatedChats));
    setSocraticInput("");
    setIsSocraticLoading(true);

    try {
      const res = await fetch("/api/ai/assignment/socratic-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle: selectedAssignment.title,
          subject: selectedAssignment.subject,
          topic: selectedAssignment.topic,
          instructions: selectedAssignment.instructions,
          studentQuestion: textToSend,
          conversationHistory: nextList,
          studentName: currentProfile.fullName || "Student"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const aiMsg: SocraticMessage = {
            id: `ai-${Date.now()}`,
            sender: "nonye",
            text: data.result.socraticResponse,
            guidingQuestion: data.result.guidingQuestion,
            formulaHint: data.result.formulaHint,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          const finalList = [...nextList, aiMsg];
          const finalChats = { ...socraticMessages, [asgId]: finalList };
          setSocraticMessages(finalChats);
          localStorage.setItem("CS_ASSIGNMENT_SOCRATIC_CHATS", JSON.stringify(finalChats));

          if (isAutoSpeakEnabled) {
            handleSpeakSocraticMessage(aiMsg);
          }
          return;
        }
      }
      throw new Error("Failed AI response");
    } catch (err) {
      // Fallback Socratic guidance
      const fallbackAiMsg: SocraticMessage = {
        id: `ai-${Date.now()}`,
        sender: "nonye",
        text: `Great thought on ${selectedAssignment.subject}! Before calculating, what are the known values given in the problem statement?`,
        guidingQuestion: `Which fundamental formula links your known variables to the required unknown value?`,
        formulaHint: selectedAssignment.subject === "Physics" ? "Recall: V = I × R and 1/R_p = 1/R1 + 1/R2" : "Recall standard algebraic definitions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const finalList = [...nextList, fallbackAiMsg];
      const finalChats = { ...socraticMessages, [asgId]: finalList };
      setSocraticMessages(finalChats);
      localStorage.setItem("CS_ASSIGNMENT_SOCRATIC_CHATS", JSON.stringify(finalChats));

      if (isAutoSpeakEnabled) {
        handleSpeakSocraticMessage(fallbackAiMsg);
      }
    } finally {
      setIsSocraticLoading(false);
    }
  };

  // Dedicated Socratic Mentoring initiator
  const handleStartMentorSession = (asg: Assignment) => {
    setSelectedAssignment(asg);
    const sub = submissions[asg.id];
    if (sub) {
      setSolutionText(sub.solutionText || "");
      setStudentNotes(sub.studentNotes || "");
    } else {
      setSolutionText("");
      setStudentNotes("");
    }

    // If no dialogue exists yet, generate initial contextual greeting
    const existingMessages = socraticMessages[asg.id] || [];
    if (existingMessages.length === 0) {
      const welcomeAiMsg: SocraticMessage = {
        id: `ai-welcome-${Date.now()}`,
        sender: "nonye",
        text: `Hello ${currentProfile.fullName?.split(" ")[0] || "Scholar"}! I'm Nonye, your Socratic mentor for "${asg.title}". Let's examine this ${asg.subject} problem together step by step!`,
        guidingQuestion: `What is the key question or problem requirement you want to explore first?`,
        formulaHint: asg.subject === "Mathematics" || asg.subject === "Physics" || asg.subject === "Chemistry" ? "Tip: Identify all given data variables before applying equations." : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const updatedChats = { ...socraticMessages, [asg.id]: [welcomeAiMsg] };
      setSocraticMessages(updatedChats);
      localStorage.setItem("CS_ASSIGNMENT_SOCRATIC_CHATS", JSON.stringify(updatedChats));
    }

    setTimeout(() => {
      const chatEl = document.getElementById("socratic-mentor-workspace");
      if (chatEl) {
        chatEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
    toast.success(`Nonye Socratic Mentor active for "${asg.title}"`);
  };

  // Filtered assignments list
  const subjectsList = Array.from(new Set(assignments.map((a) => a.subject)));
  const filteredAssignments = assignments.filter((asg) => {
    if (filterSubject !== "All" && asg.subject !== filterSubject) return false;
    const progress = getTaskProgress(asg.id);
    const sub = submissions[asg.id];
    if (filterStatus === "pending" && progress !== "pending") return false;
    if (filterStatus === "in_progress" && progress !== "in_progress") return false;
    if (filterStatus === "submitted" && (progress !== "submitted" || sub?.status === "graded")) return false;
    if (filterStatus === "graded" && sub?.status !== "graded") return false;
    return true;
  });

  const totalTasks = assignments.length;
  const pendingCount = assignments.filter((a) => getTaskProgress(a.id) === "pending").length;
  const inProgressCount = assignments.filter((a) => getTaskProgress(a.id) === "in_progress").length;
  const submittedCount = assignments.filter((a) => getTaskProgress(a.id) === "submitted" && submissions[a.id]?.status !== "graded").length;
  const gradedCount = assignments.filter((a) => submissions[a.id]?.status === "graded").length;
  const completionPercent = totalTasks > 0 ? Math.round(((submittedCount + gradedCount + (inProgressCount * 0.5)) / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-300 font-black tracking-widest uppercase bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Academic Task Hub
            </span>
            <span className="text-[10px] text-indigo-200 font-mono">
              Cohort: {currentProfile.classCohort || "SS 2 Science"}
            </span>
          </div>
          <h1 className="font-display text-xl md:text-2xl font-black text-white">
            Course Homework & Assignments
          </h1>
          <p className="text-xs text-indigo-100 max-w-xl">
            Track your homework progress from <strong className="text-amber-300">Pending</strong> to <strong className="text-indigo-300">In Progress</strong> and <strong className="text-emerald-300">Submitted</strong>. Initiate Socratic mentorship with Nonye AI at any step!
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-2.5 text-center min-w-[75px]">
            <span className="text-[8.5px] uppercase font-bold text-amber-300 block">Pending</span>
            <span className="text-lg font-black text-white">{pendingCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-2.5 text-center min-w-[75px]">
            <span className="text-[8.5px] uppercase font-bold text-indigo-200 block">In Progress</span>
            <span className="text-lg font-black text-white">{inProgressCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-2.5 text-center min-w-[75px]">
            <span className="text-[8.5px] uppercase font-bold text-emerald-300 block">Submitted</span>
            <span className="text-lg font-black text-white">{submittedCount + gradedCount}</span>
          </div>
        </div>
      </div>

      {/* Student Progress Overview Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              {completionPercent}%
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Personal Homework Progress Meter</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({submittedCount + gradedCount} of {totalTasks} tasks finalized)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Keep your assignments moving forward to maintain good continuous assessment standing!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              {pendingCount} Pending
            </span>
            <span className="flex items-center gap-1 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              {inProgressCount} In Progress
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              {submittedCount + gradedCount} Submitted
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 border border-slate-200">
          <div
            style={{ width: `${totalTasks > 0 ? ((submittedCount + gradedCount) / totalTasks) * 100 : 0}%` }}
            className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
            title={`Submitted: ${submittedCount + gradedCount}`}
          />
          <div
            style={{ width: `${totalTasks > 0 ? (inProgressCount / totalTasks) * 100 : 0}%` }}
            className="bg-indigo-500 h-full transition-all duration-500"
            title={`In Progress: ${inProgressCount}`}
          />
          <div
            style={{ width: `${totalTasks > 0 ? (pendingCount / totalTasks) * 100 : 0}%` }}
            className="bg-amber-400 h-full rounded-r-full transition-all duration-500"
            title={`Pending: ${pendingCount}`}
          />
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Subject:
          </span>
          <button
            onClick={() => setFilterSubject("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterSubject === "All"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            All Subjects
          </button>
          {subjectsList.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterSubject === s
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({totalTasks})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              filterStatus === "pending" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus("in_progress")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              filterStatus === "in_progress" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Edit className="w-3 h-3 text-indigo-500" />
            <span>In Progress ({inProgressCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus("submitted")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              filterStatus === "submitted" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Submitted ({submittedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus("graded")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              filterStatus === "graded" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BadgeCheck className="w-3 h-3 text-indigo-600" />
            <span>Graded ({gradedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Assignment Cards + Detail / Submission & Socratic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Assignments Roster */}
        <div className={`${selectedAssignment ? "lg:col-span-5" : "lg:col-span-12"} space-y-3`}>
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No assignments match your current filter. Keep up the great work or start exploring with Nonye AI!
              </p>
            </div>
          ) : (
            filteredAssignments.map((asg) => {
              const isSelected = selectedAssignment?.id === asg.id;
              const sub = submissions[asg.id];
              const taskProg = getTaskProgress(asg.id);
              const isGraded = sub?.status === "graded";

              return (
                <div
                  key={asg.id}
                  onClick={() => {
                    setSelectedAssignment(asg);
                    if (sub) {
                      setSolutionText(sub.solutionText || "");
                      setStudentNotes(sub.studentNotes || "");
                    } else {
                      setSolutionText("");
                      setStudentNotes("");
                    }
                  }}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer space-y-3.5 ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {asg.subject}
                        </span>
                        {isGraded ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                            <BadgeCheck className="w-3 h-3 text-emerald-600" /> Graded: {sub.gradeScore}/{asg.maxMarks}
                          </span>
                        ) : taskProg === "submitted" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
                          </span>
                        ) : taskProg === "in_progress" ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-200">
                            <Edit className="w-3 h-3 text-indigo-600" /> In Progress
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {asg.title}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                      {asg.maxMarks} Marks
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {asg.description}
                  </p>

                  {/* Interactive Progress Tracking Switcher on Card */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                        Update Progress:
                      </span>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleProgress(asg.id, "pending")}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            taskProg === "pending"
                              ? "bg-white text-amber-800 shadow-2xs ring-1 ring-amber-300"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProgress(asg.id, "in_progress")}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            taskProg === "in_progress"
                              ? "bg-white text-indigo-700 shadow-2xs ring-1 ring-indigo-300"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Edit className="w-2.5 h-2.5" />
                          <span>In Progress</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProgress(asg.id, "submitted")}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                            taskProg === "submitted"
                              ? "bg-white text-emerald-700 shadow-2xs ring-1 ring-emerald-300"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Submitted</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartMentorSession(asg);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                        title={`Start Socratic mentor session with Nonye AI for ${asg.title}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                        <span>Mentor Me</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Assignment Workspace & Nonye Socratic Mentor */}
        {selectedAssignment && (
          <div className="lg:col-span-7 space-y-5">
            {/* Task Card Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedAssignment.subject}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Topic: <strong className="text-slate-800">{selectedAssignment.topic}</strong>
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedAssignment.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assigned by: <strong>{selectedAssignment.assignedByTeacherName}</strong> • Due: <strong>{selectedAssignment.dueDate}</strong> ({selectedAssignment.dueTime || "11:59 PM"})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStartMentorSession(selectedAssignment)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                    <span>Mentor Me</span>
                  </button>

                  <button
                    onClick={() => {
                      const fullText = `${selectedAssignment.title}. Topic: ${selectedAssignment.topic}. Instructions: ${selectedAssignment.instructions.join(". ")}`;
                      speakNonyeVoice(fullText);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Listen to assignment instructions"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
              </div>

              {/* Interactive Progress Tracking Switcher in Detail Workspace */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      My Current Status on this Assignment:
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {getTaskProgress(selectedAssignment.id) === "submitted"
                        ? "Submitted & Queued for Evaluation"
                        : getTaskProgress(selectedAssignment.id) === "in_progress"
                        ? "Currently In Progress / Working on Solutions"
                        : "Pending / Not Yet Started"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleToggleProgress(selectedAssignment.id, "pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        getTaskProgress(selectedAssignment.id) === "pending"
                          ? "bg-amber-50 text-amber-800 ring-2 ring-amber-400 font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProgress(selectedAssignment.id, "in_progress")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        getTaskProgress(selectedAssignment.id) === "in_progress"
                          ? "bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500 font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>In Progress</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProgress(selectedAssignment.id, "submitted")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        getTaskProgress(selectedAssignment.id) === "submitted"
                          ? "bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500 font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Submitted</span>
                    </button>
                  </div>
                </div>

                {/* Additional Notes Text Area beneath status toggle */}
                <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Additional Notes / Status Context:</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Provides context for your class teacher
                    </span>
                  </div>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudentNotes(val);
                      handleSaveStudentNotes(selectedAssignment.id, val);
                    }}
                    placeholder="Provide context for 'Submitted' or 'In Progress' states (e.g., 'Currently on step 3', 'Completed and verified in exercise notebook', 'Struggled slightly with question 2 equation')..."
                    rows={2}
                    disabled={submissions[selectedAssignment.id]?.status === "graded"}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-y"
                  />
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500">
                      {studentNotes ? "✓ Notes saved & visible in teacher's submission summary table." : "Add context so your teacher knows your exact progress on this task."}
                    </span>
                    {studentNotes && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Task Instructions & Questions:</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  {selectedAssignment.instructions.map((inst, i) => (
                    <div key={i} className="text-xs text-slate-800 font-medium flex items-start gap-2">
                      <span className="text-indigo-600 font-bold shrink-0">•</span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Grading Feedback Banner (if graded) */}
              {submissions[selectedAssignment.id]?.status === "graded" && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      Teacher Grade Evaluation
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-700">
                      Score: {submissions[selectedAssignment.id].gradeScore} / {selectedAssignment.maxMarks}
                    </span>
                  </div>
                  {submissions[selectedAssignment.id].teacherFeedback && (
                    <p className="text-xs text-emerald-800 font-medium italic">
                      "{submissions[selectedAssignment.id].teacherFeedback}"
                    </p>
                  )}
                </div>
              )}

              {/* Submission Workspace Form */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Your Working & Solution:</h4>
                  {submissions[selectedAssignment.id] && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Submitted on {new Date(submissions[selectedAssignment.id].submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Type your complete solution steps, mathematical equations, or essay draft here..."
                  rows={5}
                  disabled={submissions[selectedAssignment.id]?.status === "graded"}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
                />

                <input
                  type="text"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Optional notes for teacher (e.g. 'Struggled slightly with question 3 calculation')..."
                  disabled={submissions[selectedAssignment.id]?.status === "graded"}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {submissions[selectedAssignment.id]?.status !== "graded" && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      {submissions[selectedAssignment.id] ? "You can re-submit before the due date." : "Your class teacher will review and grade your solution."}
                    </span>
                    <button
                      onClick={() => handleSubmitSolution(selectedAssignment)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{submissions[selectedAssignment.id] ? "Update Submission" : "Submit Homework Solution"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ================= NONYE SOCRATIC HOMEWORK MENTOR PANEL ================= */}
            <div id="socratic-mentor-workspace" className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-900 shadow-xl p-5 space-y-4 scroll-mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={nonyeAvatar}
                      alt="Nonye AI"
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Nonye Socratic Mentor</span>
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                        Inquiry Co-Pilot
                      </span>
                    </h3>
                    <p className="text-[10.5px] text-indigo-200">
                      Step-by-step Socratic guidance with ElevenLabs voice synthesis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Auto-Speak Guidance Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAutoSpeak}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
                      isAutoSpeakEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-900/30"
                        : "bg-white/5 hover:bg-white/10 text-indigo-200 border-white/10"
                    }`}
                    title={
                      isAutoSpeakEnabled
                        ? "Auto-Speak is ON: Nonye will automatically speak each Socratic reply"
                        : "Turn on Auto-Speak to hear Nonye read aloud every Socratic response automatically"
                    }
                  >
                    <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Speak: {isAutoSpeakEnabled ? "ON" : "OFF"}</span>
                  </button>

                  {/* Active Voice Stop Trigger */}
                  {playingMessageId && (
                    <button
                      type="button"
                      onClick={() => {
                        stopNonyeVoice();
                        setPlayingMessageId(null);
                      }}
                      className="px-2.5 py-1.5 bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 border border-rose-400/50 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer animate-pulse transition"
                      title="Stop speaking"
                    >
                      <Square className="w-3 h-3 fill-rose-400" />
                      <span>Stop Voice</span>
                    </button>
                  )}

                  <span className="text-[10px] font-mono text-indigo-300 hidden md:inline">
                    {(socraticMessages[selectedAssignment.id] || []).length} Interactions
                  </span>
                </div>
              </div>

              {/* Socratic Quick-Inquiry Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Where do I start with question 1?",
                  "What formula applies here?",
                  "Give me a hint for the hardest step",
                  "Explain this with a real-life analogy",
                  "How do I avoid common WAEC traps?"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendSocraticQuery(chip)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[11px] font-medium text-indigo-100 transition cursor-pointer text-left"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>

              {/* Dialogue History Container */}
              <div className="bg-slate-900/90 border border-indigo-900/60 rounded-xl p-4 min-h-[160px] max-h-[340px] overflow-y-auto space-y-3">
                {(!socraticMessages[selectedAssignment.id] || socraticMessages[selectedAssignment.id].length === 0) ? (
                  <div className="text-center py-6 space-y-2 text-indigo-300">
                    <img
                      src={nonyeAvatar}
                      alt="Nonye AI"
                      className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-emerald-400/60 opacity-90 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-xs">
                      Ask Nonye any question about <strong className="text-white">{selectedAssignment.title}</strong> to start your Socratic inquiry.
                    </p>
                  </div>
                ) : (
                  socraticMessages[selectedAssignment.id].map((msg) => {
                    const isNonye = msg.sender === "nonye";
                    const isCurrentlyPlaying = playingMessageId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.sender === "student" ? "justify-end" : "justify-start"}`}
                      >
                        {isNonye && (
                          <button
                            type="button"
                            onClick={() => handleSpeakSocraticMessage(msg)}
                            className="shrink-0 group relative cursor-pointer"
                            title={isCurrentlyPlaying ? "Stop speaking" : "Listen to Nonye read aloud"}
                          >
                            <img
                              src={nonyeAvatar}
                              alt="Nonye AI"
                              className={`w-7 h-7 rounded-full object-cover border mt-1 transition-all ${
                                isCurrentlyPlaying
                                  ? "border-emerald-300 ring-2 ring-emerald-400 shadow-md scale-110"
                                  : "border-emerald-400/80 group-hover:scale-105"
                              }`}
                              referrerPolicy="no-referrer"
                            />
                            {isCurrentlyPlaying && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                              </span>
                            )}
                          </button>
                        )}

                        <div
                          className={`flex flex-col ${msg.sender === "student" ? "items-end" : "items-start"} max-w-[85%]`}
                        >
                          <div
                            className={`rounded-xl p-3 text-xs leading-relaxed ${
                              msg.sender === "student"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-indigo-50 border border-indigo-800/80 space-y-2"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {msg.guidingQuestion && (
                              <div className="p-2 bg-indigo-950/80 border border-indigo-700/60 rounded-lg text-emerald-300 font-medium">
                                🎯 <strong>Think about this:</strong> {msg.guidingQuestion}
                              </div>
                            )}

                            {msg.formulaHint && (
                              <div className="p-1.5 bg-slate-900 border border-slate-700 rounded-md font-mono text-[10.5px] text-amber-300 font-bold">
                                📐 Formula Clue: {msg.formulaHint}
                              </div>
                            )}

                            {/* Voice Synthesis Trigger Bar for Nonye AI's guidance */}
                            {isNonye && (
                              <div className="flex items-center justify-between pt-1.5 border-t border-indigo-700/50 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSpeakSocraticMessage(msg)}
                                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isCurrentlyPlaying
                                      ? "bg-rose-500/25 text-rose-200 border border-rose-400/60 shadow-xs"
                                      : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                                  }`}
                                  title={
                                    isCurrentlyPlaying
                                      ? "Stop reading aloud"
                                      : "Listen to Nonye read this guidance aloud using configured ElevenLabs voice"
                                  }
                                >
                                  {isCurrentlyPlaying ? (
                                    <>
                                      <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                                      <span>Stop Voice</span>
                                      <span className="flex gap-0.5 items-end h-2.5 ml-1">
                                        <span className="w-0.5 h-2 bg-rose-400 animate-bounce" />
                                        <span className="w-0.5 h-3 bg-rose-400 animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-0.5 h-1.5 bg-rose-400 animate-bounce [animation-delay:0.3s]" />
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Listen to Nonye</span>
                                    </>
                                  )}
                                </button>

                                <span className="text-[9px] text-indigo-300/80 font-mono">
                                  ElevenLabs Voice
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">{msg.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {isSocraticLoading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 p-2">
                    <img
                      src={nonyeAvatar}
                      alt="Nonye AI"
                      className="w-5 h-5 rounded-full object-cover border border-emerald-400 shrink-0 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Nonye is formulating your Socratic question...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={socraticInput}
                  onChange={(e) => setSocraticInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendSocraticQuery()}
                  placeholder="Ask a question or explain where you are stuck..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-indigo-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={() => handleSendSocraticQuery()}
                  disabled={isSocraticLoading || !socraticInput.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAssignmentsPanel;
