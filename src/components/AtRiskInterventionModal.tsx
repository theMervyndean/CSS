import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  X,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Check,
  TrendingDown,
  Sparkles,
  FileText,
  Clock,
  Target,
  Send,
  User,
  SlidersHorizontal,
  BookmarkPlus
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export interface StudentInterventionRecord {
  studentId: string;
  studentName: string;
  regNumber?: string;
  classCohort?: string;
  previousTermScore: number;
  currentTermScore: number;
  scoreDropDelta: number; // e.g. 12 representing -12%
  thresholdConfigured: number;
  interventionCategory: string;
  targetScoreGoal: number;
  interventionNotes: string;
  assignedTeacher: string;
  priorityLevel: "Urgent" | "High" | "Moderate";
  status: "Active Intervention" | "Under Review" | "Resolved";
  createdAt: string;
  updatedAt: string;
}

const INTERVENTION_CATEGORIES = [
  "Remedial Coaching / Tutoring",
  "Subject-Specific Focus (STEM/Languages)",
  "Parent-Teacher Conference & Home Study Plan",
  "Behavioral & Concentration Counseling",
  "Curriculum & Time-Management Accommodations"
];

const TEACHER_ROSTER = [
  "Dr. Samuel Adeyemi (Class Form Master)",
  "Mrs. Florence Chike (Academic Guidance Counselor)",
  "Mr. Kenneth Nwosu (Head of STEM Department)",
  "Ms. Victoria Mensah (VP Academics)"
];

const STORAGE_KEY = "CS_STUDENT_INTERVENTIONS";

export function getStoredStudentIntervention(studentId: string): StudentInterventionRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[studentId] || null;
  } catch (e) {
    return null;
  }
}

export function getAllStudentInterventions(): Record<string, StudentInterventionRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveStudentIntervention(record: StudentInterventionRecord): void {
  try {
    const current = getAllStudentInterventions();
    current[record.studentId] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("cs-intervention-updated", { detail: record }));
  } catch (e) {
    console.error("Failed to store intervention record", e);
  }
}

export interface AtRiskInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  regNumber?: string;
  classCohort?: string;
  previousTermScore: number;
  currentTermScore: number;
  configuredThreshold: number;
  onInterventionSaved?: (record: StudentInterventionRecord) => void;
}

export function AtRiskInterventionModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  regNumber = "CS/2026/000",
  classCohort = "Primary 5",
  previousTermScore,
  currentTermScore,
  configuredThreshold,
  onInterventionSaved
}: AtRiskInterventionModalProps) {
  const scoreDropDelta = Math.round((previousTermScore - currentTermScore) * 10) / 10;
  const isDropExceeded = scoreDropDelta >= configuredThreshold;

  // Form State
  const [category, setCategory] = useState<string>(INTERVENTION_CATEGORIES[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [assignedTeacher, setAssignedTeacher] = useState<string>(TEACHER_ROSTER[0]);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);

  const [priorityLevel, setPriorityLevel] = useState<"Urgent" | "High" | "Moderate">(
    scoreDropDelta >= 15 ? "Urgent" : scoreDropDelta >= 10 ? "High" : "Moderate"
  );
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const [status, setStatus] = useState<"Active Intervention" | "Under Review" | "Resolved">("Active Intervention");
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [targetScoreGoal, setTargetScoreGoal] = useState<number>(
    Math.min(100, Math.round(previousTermScore))
  );

  const [notes, setNotes] = useState<string>("");

  // Load existing intervention if present
  useEffect(() => {
    if (isOpen && studentId) {
      const existing = getStoredStudentIntervention(studentId);
      if (existing) {
        setCategory(existing.interventionCategory || INTERVENTION_CATEGORIES[0]);
        setAssignedTeacher(existing.assignedTeacher || TEACHER_ROSTER[0]);
        setPriorityLevel(existing.priorityLevel || "High");
        setStatus(existing.status || "Active Intervention");
        setTargetScoreGoal(existing.targetScoreGoal || Math.round(previousTermScore));
        setNotes(existing.interventionNotes || "");
      } else {
        // Default draft note template
        const studentFirstName = studentName.trim().split(/\s+/)[0];
        setNotes(
          `${studentFirstName} experienced a ${scoreDropDelta}% term-over-term score decline (dropped from ${previousTermScore}% to ${currentTermScore}%). Recommended action: enroll in 3x weekly remedial tutoring, schedule parent academic review, and set targeted score goal of ${Math.round(previousTermScore)}%.`
        );
      }
    }
  }, [isOpen, studentId, previousTermScore, currentTermScore, scoreDropDelta, studentName]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error("Please enter intervention notes and strategy.");
      return;
    }

    const record: StudentInterventionRecord = {
      studentId,
      studentName,
      regNumber,
      classCohort,
      previousTermScore,
      currentTermScore,
      scoreDropDelta,
      thresholdConfigured: configuredThreshold,
      interventionCategory: category,
      targetScoreGoal,
      interventionNotes: notes,
      assignedTeacher,
      priorityLevel,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveStudentIntervention(record);
    if (onInterventionSaved) {
      onInterventionSaved(record);
    }

    toast.success(`Intervention Plan saved for ${studentName}! Flag active in Dossier.`);
    onClose();
  };

  const studentFirstName = studentName.trim().split(/\s+/)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-6"
        >
          {/* MODAL HEADER WITH AT-RISK HIGHLIGHT */}
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 p-5 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-amber-300 shadow-inner">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-mono font-black uppercase rounded-md shadow-2xs">
                    At-Risk Flag Triggered
                  </span>
                  <span className="text-amber-200 text-xs font-mono">
                    Threshold Set: -{configuredThreshold}%
                  </span>
                </div>
                <h3 className="text-lg font-display font-black tracking-tight mt-1">
                  Teacher Intervention Action Plan: {studentName}
                </h3>
              </div>
            </div>

            {/* PERFORMANCE METRICS COMPARISON BAND */}
            <div className="mt-4 p-3 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/15 grid grid-cols-3 gap-2 font-mono text-center">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-bold">
                  Previous Term
                </span>
                <span className="text-sm font-black text-emerald-300">{previousTermScore}%</span>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-bold">
                  Current Term
                </span>
                <span className="text-sm font-black text-rose-300">{currentTermScore}%</span>
              </div>

              <div className="bg-rose-500/20 rounded-xl border border-rose-400/30 py-0.5">
                <span className="text-[9px] uppercase tracking-wider text-rose-200 block font-bold">
                  Term Drop Delta
                </span>
                <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  -{scoreDropDelta}%
                </span>
              </div>
            </div>
          </div>

          {/* FORM BODY */}
          <form onSubmit={handleSave} className="p-6 space-y-4 font-sans text-xs">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Intervention Trigger Reason: </span>
                {studentFirstName}&apos;s current term score ({currentTermScore}%) dropped by{" "}
                <span className="font-black text-rose-700">-{scoreDropDelta}%</span> compared to previous term ({previousTermScore}%), exceeding the configured threshold of -{configuredThreshold}%.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. INTERVENTION CATEGORY CUSTOM SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-500 flex items-center gap-1">
                  <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Intervention Category</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsTeacherOpen(false);
                    setIsPriorityOpen(false);
                    setIsStatusOpen(false);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold flex items-center justify-between text-left hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  <span className="truncate">{category}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsCategoryOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-full rounded-2xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden py-1">
                      {INTERVENTION_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setIsCategoryOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition ${
                            category === cat
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                          }`}
                        >
                          <span>{cat}</span>
                          {category === cat && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 2. ASSIGNED TEACHER CUSTOM SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-500 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assigned Teacher / Specialist</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsTeacherOpen(!isTeacherOpen);
                    setIsCategoryOpen(false);
                    setIsPriorityOpen(false);
                    setIsStatusOpen(false);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold flex items-center justify-between text-left hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  <span className="truncate">{assignedTeacher}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTeacherOpen ? "rotate-180" : ""}`} />
                </button>

                {isTeacherOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsTeacherOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-full rounded-2xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden py-1">
                      {TEACHER_ROSTER.map((tch) => (
                        <button
                          key={tch}
                          type="button"
                          onClick={() => {
                            setAssignedTeacher(tch);
                            setIsTeacherOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition ${
                            assignedTeacher === tch
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                          }`}
                        >
                          <span>{tch}</span>
                          {assignedTeacher === tch && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* PRIORITY LEVEL CUSTOM SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-500">
                  Priority Level
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsPriorityOpen(!isPriorityOpen);
                    setIsCategoryOpen(false);
                    setIsTeacherOpen(false);
                    setIsStatusOpen(false);
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold flex items-center justify-between text-left hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  <span className={`font-black ${
                    priorityLevel === "Urgent" ? "text-rose-600" : priorityLevel === "High" ? "text-amber-600" : "text-indigo-600"
                  }`}>{priorityLevel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPriorityOpen ? "rotate-180" : ""}`} />
                </button>

                {isPriorityOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsPriorityOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden py-1">
                      {(["Urgent", "High", "Moderate"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setPriorityLevel(p);
                            setIsPriorityOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition ${
                            priorityLevel === p
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                          }`}
                        >
                          <span>{p} Priority</span>
                          {priorityLevel === p && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* TARGET RECOVERY SCORE */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-500 flex items-center justify-between">
                  <span>Target Recovery Goal</span>
                  <span className="font-bold text-emerald-700">{targetScoreGoal}%</span>
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={targetScoreGoal}
                  onChange={(e) => setTargetScoreGoal(Number(e.target.value) || 75)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* STATUS CUSTOM SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-mono font-black uppercase text-slate-500">
                  Intervention Status
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusOpen(!isStatusOpen);
                    setIsCategoryOpen(false);
                    setIsTeacherOpen(false);
                    setIsPriorityOpen(false);
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold flex items-center justify-between text-left hover:bg-white transition cursor-pointer shadow-2xs"
                >
                  <span className={`font-black ${
                    status === "Active Intervention" ? "text-amber-600" : status === "Under Review" ? "text-indigo-600" : "text-emerald-600"
                  }`}>{status}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                </button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden py-1">
                      {(["Active Intervention", "Under Review", "Resolved"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setStatus(s);
                            setIsStatusOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition ${
                            status === s
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                          }`}
                        >
                          <span>{s}</span>
                          {status === s && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* INTERVENTION NOTES & STRATEGY */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-black uppercase text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Intervention Strategy & Remedial Action Notes</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe specific academic support steps, subject review schedules, or parent consultation milestones..."
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs"
              />
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Save Intervention Plan</span>
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
