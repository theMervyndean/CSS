import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Bot,
  User,
  CheckCircle2,
  ChevronDown,
  Check,
  Award,
  BookOpen,
  Send,
  Copy,
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export interface PsychomotorRatingItem {
  trait: string;
  rating: string;
}

export interface SubjectScoreItem {
  subject: string;
  total: number;
  grade: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
}

export interface AutoCommentResult {
  firstName: string;
  teacherComment: string;
  principalRemark: string;
  keyStrengths: string[];
  focusAreas: string[];
}

export interface AutoCommentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classCohort?: string;
  session?: string;
  term?: string;
  subjectScores?: SubjectScoreItem[];
  initialPsychomotorRatings?: PsychomotorRatingItem[];
  onApplyComment?: (
    studentId: string,
    data: {
      teacherComment: string;
      principalRemark: string;
      psychomotorRatings: PsychomotorRatingItem[];
      keyStrengths?: string[];
      focusAreas?: string[];
    }
  ) => void;
}

const DEFAULT_PSYCHOMOTOR_TRAITS: PsychomotorRatingItem[] = [
  { trait: "Punctuality & Attendance", rating: "5/5 - Outstanding" },
  { trait: "Neatness & Uniform Assembly", rating: "4/5 - Very Good" },
  { trait: "Class Participation & Quiz Effort", rating: "5/5 - Exemplary" },
  { trait: "Peer Leadership & Collaboration", rating: "5/5 - Exemplary" },
  { trait: "Emotional Stability & Self-Control", rating: "4/5 - Very Good" },
  { trait: "Sports & Athletic Engagement", rating: "4/5 - Very Good" }
];

const RATING_OPTIONS = [
  "5/5 - Outstanding",
  "4/5 - Very Good",
  "3/5 - Satisfactory",
  "2/5 - Needs Improvement",
  "1/5 - Unsatisfactory"
];

const TONE_OPTIONS = [
  { id: "Encouraging & Constructive", label: "Encouraging & Constructive (Recommended)", desc: "Warmly recognizes progress while offering supportive coaching goals." },
  { id: "Warm & Praise-Focused", label: "Warm & Praise-Focused", desc: "Celebrates high achievements, character, and exceptional effort." },
  { id: "High Academic Rigor & Distinction", label: "High Academic Rigor & Distinction", desc: "Formal, academic phrasing highlighting subject mastery and standards." },
  { id: "Balanced & Goal-Oriented", label: "Balanced & Goal-Oriented", desc: "Direct and objective with clear targets for parent/student review." }
];

// Helper to get stored custom comments from localStorage
export function getStoredStudentCustomComment(studentId: string) {
  try {
    const raw = localStorage.getItem("CS_STUDENT_CUSTOM_COMMENTS");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[studentId] || null;
  } catch {
    return null;
  }
}

// Helper to save custom comment to localStorage
export function saveStoredStudentCustomComment(
  studentId: string,
  data: {
    teacherComment: string;
    principalRemark: string;
    psychomotorRatings?: PsychomotorRatingItem[];
    keyStrengths?: string[];
    focusAreas?: string[];
    generatedAt?: string;
  }
) {
  try {
    const raw = localStorage.getItem("CS_STUDENT_CUSTOM_COMMENTS");
    const map = raw ? JSON.parse(raw) : {};
    map[studentId] = {
      ...map[studentId],
      ...data,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem("CS_STUDENT_CUSTOM_COMMENTS", JSON.stringify(map));
    window.dispatchEvent(new Event("cs-auto-comment-updated"));
  } catch (err) {
    console.error("Error saving custom comment:", err);
  }
}

export function AutoCommentGeneratorModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  classCohort = "SS 2 Science",
  session = "2025/2026",
  term = "1st Term",
  subjectScores = [],
  initialPsychomotorRatings = DEFAULT_PSYCHOMOTOR_TRAITS,
  onApplyComment
}: AutoCommentGeneratorModalProps) {
  // Extract student's first name
  const nameParts = (studentName || "Student").trim().split(/\s+/);
  const firstName = nameParts[0] || "Student";

  // States
  const [selectedTone, setSelectedTone] = useState<string>("Encouraging & Constructive");
  const [isToneOpen, setIsToneOpen] = useState<boolean>(false);
  const [psychomotorTraits, setPsychomotorTraits] = useState<PsychomotorRatingItem[]>(initialPsychomotorRatings);
  const [activeRatingDropdownIdx, setActiveRatingDropdownIdx] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<AutoCommentResult | null>(null);

  // Editable comment drafts
  const [editableTeacherComment, setEditableTeacherComment] = useState<string>("");
  const [editablePrincipalRemark, setEditablePrincipalRemark] = useState<string>("");

  // Populate from stored comment if exists
  useEffect(() => {
    if (studentId) {
      const stored = getStoredStudentCustomComment(studentId);
      if (stored) {
        setEditableTeacherComment(stored.teacherComment || "");
        setEditablePrincipalRemark(stored.principalRemark || "");
        if (stored.psychomotorRatings) {
          setPsychomotorTraits(stored.psychomotorRatings);
        }
      }
    }
  }, [studentId, isOpen]);

  if (!isOpen) return null;

  // Handle rating change for a trait
  const handleTraitRatingChange = (idx: number, newRating: string) => {
    const next = [...psychomotorTraits];
    next[idx] = { ...next[idx], rating: newRating };
    setPsychomotorTraits(next);
    setActiveRatingDropdownIdx(null);
  };

  // Default subject scores fallback if none passed
  const activeSubjectScores: SubjectScoreItem[] = subjectScores.length > 0
    ? subjectScores
    : [
        { subject: "Mathematics", total: 88, grade: "A1" },
        { subject: "English Language", total: 78, grade: "B2" },
        { subject: "Physics", total: 82, grade: "A1" },
        { subject: "Chemistry", total: 74, grade: "B2" },
        { subject: "Biology", total: 85, grade: "A1" },
        { subject: "Civic Education", total: 90, grade: "A1" },
        { subject: "Computer Studies", total: 92, grade: "A1" }
      ];

  // Call Gemini API to generate personalized comment
  const handleGenerateComment = async () => {
    setIsLoading(true);
    setGeneratedResult(null);

    try {
      const response = await fetch("/api/reportcard/generate-auto-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          subjectScores: activeSubjectScores,
          psychomotorRatings: psychomotorTraits,
          tone: selectedTone,
          session,
          term,
          classCohort
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate AI auto-comment.");
      }

      if (data.autoComment) {
        const res: AutoCommentResult = data.autoComment;
        setGeneratedResult(res);
        setEditableTeacherComment(res.teacherComment);
        setEditablePrincipalRemark(res.principalRemark);
        toast.success(`Personalized feedback generated for ${firstName}!`);
      }
    } catch (err: any) {
      console.error("AI Auto-Comment Generation error:", err);
      toast.error(err.message || "Failed to contact AI Assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply comment to report card
  const handleApplyToReportCard = () => {
    if (!editableTeacherComment.trim()) {
      toast.error("Teacher comment field cannot be empty.");
      return;
    }

    const payload = {
      teacherComment: editableTeacherComment,
      principalRemark: editablePrincipalRemark,
      psychomotorRatings: psychomotorTraits,
      keyStrengths: generatedResult?.keyStrengths || [],
      focusAreas: generatedResult?.focusAreas || []
    };

    // Save to localStorage
    saveStoredStudentCustomComment(studentId, payload);

    if (onApplyComment) {
      onApplyComment(studentId, payload);
    }

    toast.success(`Personalized AI Report Card comments applied for ${firstName}!`);
    onClose();
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    const text = `STUDENT: ${studentName}\nFIRST NAME: ${firstName}\nCLASS TEACHER COMMENT:\n"${editableTeacherComment}"\n\nPRINCIPAL'S REMARK:\n"${editablePrincipalRemark}"`;
    navigator.clipboard.writeText(text);
    toast.success("Comment text copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  Chinonye Narrative Synthesizer
                </span>
                <span className="text-[9px] font-mono font-black text-indigo-300 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-md">
                  Digital Report Card Module
                </span>
              </div>
              <h3 className="text-base font-display font-black text-white tracking-tight mt-0.5">
                Auto-Comment Generator
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs font-sans flex-1">
          {/* STUDENT IDENTIFIER & FIRST NAME CARD */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-2xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase text-indigo-300">
                    Candidate Profile
                  </span>
                  <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded-md">
                    First Name: &quot;{firstName}&quot;
                  </span>
                </div>
                <h4 className="text-lg font-display font-extrabold text-white tracking-tight mt-0.5">
                  {studentName}
                </h4>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                  Class: <strong className="text-white">{classCohort}</strong> • Session: <strong className="text-white">{session}</strong> • Term: <strong className="text-white">{term}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-indigo-800/60 text-right shrink-0">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Total Subjects</span>
              <span className="text-sm font-mono font-black text-emerald-400">{activeSubjectScores.length} Examined</span>
            </div>
          </div>

          {/* INPUT & PARAMETERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT COLUMN: PSYCHOMOTOR & AFFECTIVE TRAIT RATINGS */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Affective & Psychomotor Ratings
                  </h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Personal Input</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {psychomotorTraits.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[150px]">
                      {item.trait}
                    </span>

                    {/* CUSTOM REACT DROPDOWN FOR RATINGS (AGENTS.MD COMPLIANT) */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveRatingDropdownIdx(activeRatingDropdownIdx === idx ? null : idx)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>{item.rating}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {activeRatingDropdownIdx === idx && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setActiveRatingDropdownIdx(null)} />
                          <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-1 space-y-0.5">
                            {RATING_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleTraitRatingChange(idx, opt)}
                                className={`w-full px-2.5 py-1 text-left rounded-lg text-[10.5px] font-mono transition-all flex items-center justify-between ${
                                  item.rating === opt
                                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                <span>{opt}</span>
                                {item.rating === opt && <Check className="w-3 h-3 text-emerald-600" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: TONE SELECTOR & SUBJECT OVERVIEW */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Feedback Tone & Objectives
                    </h4>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase">AI Persona</span>
                </div>

                {/* CUSTOM SELECT DROPDOWN FOR TONE (AGENTS.MD COMPLIANT) */}
                <div className="relative">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Select Teacher Comment Tone
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsToneOpen(!isToneOpen)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition cursor-pointer shadow-2xs"
                  >
                    <span className="truncate">{selectedTone}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isToneOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isToneOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsToneOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-1.5 space-y-1">
                        {TONE_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTone(t.id);
                              setIsToneOpen(false);
                            }}
                            className={`w-full p-2 text-left rounded-lg text-xs transition-all ${
                              selectedTone === t.id
                                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black border border-indigo-200 dark:border-indigo-800"
                                : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            <span className="block font-bold">{t.label}</span>
                            <span className="block text-[10px] opacity-80 font-normal">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* SUBJECT PREVIEW SUMMARY */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">
                    Examined Subject Marks Context
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {activeSubjectScores.map((s) => (
                      <span
                        key={s.subject}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[10px] border border-slate-200 dark:border-slate-700"
                      >
                        {s.subject}: <strong className="text-indigo-600 dark:text-indigo-400">{s.total} ({s.grade})</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* GENERATE ACTION BUTTON */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGenerateComment}
                className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Chinonye AI Synthesizing Comment for {firstName}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Draft Personalized Feedback with AI ({firstName})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GENERATED COMMENT OUTPUT CARD */}
          {(generatedResult || editableTeacherComment) && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 dark:border-emerald-800/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    AI-Drafted Report Card Feedback ({firstName})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <span className="text-[9px] font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-md">
                    Personalized with &quot;{firstName}&quot;
                  </span>
                </div>
              </div>

              {/* CLASS TEACHER COMMENT TEXTAREA */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <span>Class Teacher Report Card Comment</span>
                  <span className="text-slate-400 font-normal">(Editable)</span>
                </label>
                <textarea
                  rows={3}
                  value={editableTeacherComment}
                  onChange={(e) => setEditableTeacherComment(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-2xs"
                  placeholder={`Class teacher comment for ${firstName}...`}
                />
              </div>

              {/* PRINCIPAL REMARK INPUT */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <span>Principal&apos;s Endorsement Remark</span>
                  <span className="text-slate-400 font-normal">(Editable)</span>
                </label>
                <input
                  type="text"
                  value={editablePrincipalRemark}
                  onChange={(e) => setEditablePrincipalRemark(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  placeholder={`Principal verdict for ${firstName}...`}
                />
              </div>

              {/* STRENGTHS & FOCUS AREAS PILLS */}
              {generatedResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {generatedResult.keyStrengths?.length > 0 && (
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[9px] font-mono font-black uppercase text-emerald-700 dark:text-emerald-400 block">
                        ✨ Observed Strengths
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {generatedResult.keyStrengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedResult.focusAreas?.length > 0 && (
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <span className="text-[9px] font-mono font-black uppercase text-amber-700 dark:text-amber-400 block">
                        🎯 Recommended Focus Goals
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {generatedResult.focusAreas.map((foc, i) => (
                          <li key={i}>{foc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* BOTTOM APPLY BUTTON */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyToReportCard}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Apply Comments to {firstName}&apos;s Report Card</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 font-mono shrink-0">
          © 2026 Corner Streams. All rights reserved. • AI Auto-Comment Generator for Digital Report Cards
        </div>
      </motion.div>
    </div>
  );
}
