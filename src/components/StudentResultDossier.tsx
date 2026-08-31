import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  Check,
  ShieldCheck,
  Award,
  TrendingUp,
  FileText,
  Sparkles,
  Printer,
  Download,
  X,
  UserCheck,
  BookOpen,
  Zap,
  Info,
  Calendar,
  Layers,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  Search,
  LineChart as LineChartIcon,
  BarChart2,
  Users
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from "recharts";
import { toast } from "sonner";
import { UserProfile } from "../types";
import { ReportCardPrintPreviewModal } from "./ReportCardPrintPreviewModal";
import { PrintOnlySchoolHeader } from "./PrintOnlySchoolHeader";
import { AutoCommentGeneratorModal, getStoredStudentCustomComment } from "./AutoCommentGeneratorModal";
import { AtRiskInterventionModal, getStoredStudentIntervention, StudentInterventionRecord } from "./AtRiskInterventionModal";
import { StudentGradeTrendD3Chart } from "./StudentGradeTrendD3Chart";

export interface StudentResultDossierProps {
  student?: {
    id: string;
    name: string;
    reg: string;
    class: string;
    passportUrl?: string;
    gender?: string;
  };
  studentsList?: any[];
  currentProfile?: UserProfile;
  activeSession?: string;
  activeTerm?: string;
  onSelectStudent?: (studentId: string) => void;
  className?: string;
}

const ALL_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Social Studies",
  "Agricultural Science",
  "Civic Education",
  "Computer Studies / ICT",
  "Creative Arts",
  "French",
  "Physical Education"
];

const HISTORICAL_TERMS = [
  { term: "1st Term 2025/2026", aggregate: 842, max: 1000, avg: "84.2%", gpa: "4.21", rank: "#1", status: "Approved & Published" },
  { term: "3rd Term 2024/2025", aggregate: 818, max: 1000, avg: "81.8%", gpa: "4.09", rank: "#2", status: "Archived Record" },
  { term: "2nd Term 2024/2025", aggregate: 795, max: 1000, avg: "79.5%", gpa: "3.98", rank: "#3", status: "Archived Record" },
  { term: "1st Term 2024/2025", aggregate: 805, max: 1000, avg: "80.5%", gpa: "4.03", rank: "#2", status: "Archived Record" }
];

const AFFECTIVE_DOMAINS = [
  { trait: "Punctuality & Attendance", rating: "5/5 (Excellent)" },
  { trait: "Class Participation & Inquisitiveness", rating: "5/5 (Outstanding)" },
  { trait: "Neatness & Uniform Assembly", rating: "4/5 (Very Good)" },
  { trait: "Peer Collaboration & Leadership", rating: "5/5 (Exemplary)" },
  { trait: "Emotional Stability & Self-Control", rating: "4/5 (Good)" }
];

// Framer Motion Staggered Entrance Animation Variants
const dossierContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03
    }
  }
};

const dossierCardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22
    }
  }
};

const metricItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export function StudentResultDossier({
  student = { id: "CS-8201", name: "Chinedu Okeke", reg: "CS/2025/001", class: "Primary 5" },
  studentsList = [],
  currentProfile,
  activeSession = "2025/2026 (Current)",
  activeTerm = "1st Term",
  onSelectStudent,
  className = ""
}: StudentResultDossierProps) {
  // Dropdown state for student selector per AGENTS.md rules
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
  const [dossierSearchQuery, setDossierSearchQuery] = useState("");
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Filter students list in dossier selector by name, class, reg, or student ID
  const filteredDossierStudents = useMemo(() => {
    if (!dossierSearchQuery.trim()) return studentsList;
    const q = dossierSearchQuery.toLowerCase().trim();
    return studentsList.filter((st) => {
      const name = (st.name || st.studentName || "").toLowerCase();
      const cls = (st.class || st.classCohort || "").toLowerCase();
      const id = (st.id || st.studentId || "").toLowerCase();
      const reg = (st.reg || st.regNumber || "").toLowerCase();
      return name.includes(q) || cls.includes(q) || id.includes(q) || reg.includes(q);
    });
  }, [studentsList, dossierSearchQuery]);
  const [isAutoCommentModalOpen, setIsAutoCommentModalOpen] = useState(false);
  const [commentsVersion, setCommentsVersion] = useState(0);

  // Configurable At-Risk Threshold & Intervention Modal State
  const [atRiskThreshold, setAtRiskThreshold] = useState<number>(10);
  const [isInterventionOpen, setIsInterventionOpen] = useState<boolean>(false);
  const [interventionRecord, setInterventionRecord] = useState<StudentInterventionRecord | null>(null);

  React.useEffect(() => {
    setInterventionRecord(getStoredStudentIntervention(student.id));
    const handleInterventionUpdate = () => {
      setInterventionRecord(getStoredStudentIntervention(student.id));
    };
    window.addEventListener("cs-intervention-updated", handleInterventionUpdate);
    return () => window.removeEventListener("cs-intervention-updated", handleInterventionUpdate);
  }, [student.id]);

  React.useEffect(() => {
    const handleUpdate = () => {
      setCommentsVersion((v) => v + 1);
    };
    window.addEventListener("cs-auto-comment-updated", handleUpdate);
    return () => window.removeEventListener("cs-auto-comment-updated", handleUpdate);
  }, []);

  // Push Performance Summary Modal state
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushSummaryNote, setPushSummaryNote] = useState("");
  const [pushedSummaries, setPushedSummaries] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("CS_PUSHED_PERFORMANCE_SUMMARIES");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Result Lock / Unlock state for Class Teachers
  const [resultLockMap, setResultLockMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("CS_STUDENT_RESULT_LOCKS");
      return saved ? JSON.parse(saved) : { "st-2": true };
    } catch (e) {
      return { "st-2": true };
    }
  });

  const [isClassWideLocked, setIsClassWideLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("CS_CLASS_WIDE_RESULT_LOCK") === "true";
    } catch (e) {
      return false;
    }
  });

  const [isLockMatrixOpen, setIsLockMatrixOpen] = useState(false);

  const isCurrentStudentLocked = isClassWideLocked || !!resultLockMap[student.id];

  const handleToggleStudentLock = (stId: string, stName: string) => {
    const isCurrentlyLocked = !!resultLockMap[stId];
    const nextState = !isCurrentlyLocked;
    const updatedMap = { ...resultLockMap, [stId]: nextState };
    setResultLockMap(updatedMap);
    localStorage.setItem("CS_STUDENT_RESULT_LOCKS", JSON.stringify(updatedMap));

    if (nextState) {
      toast.warning(`Result access for ${stName} is now LOCKED in Student/Parent portals.`);
    } else {
      toast.success(`Result access for ${stName} is now UNLOCKED for Student/Parent portals.`);
    }
  };

  const handleToggleClassWideLock = () => {
    const nextState = !isClassWideLocked;
    setIsClassWideLocked(nextState);
    localStorage.setItem("CS_CLASS_WIDE_RESULT_LOCK", String(nextState));

    if (nextState) {
      toast.warning("CLASS-WIDE RESULT LOCK ENABLED: All student report cards in this class are now locked for Student/Parent portals.");
    } else {
      toast.success("CLASS-WIDE RESULT LOCK REMOVED: Student report card access restored.");
    }
  };

  // Calculate deterministic current scores for this student across subjects
  const currentSubjectBreakdown = useMemo(() => {
    const stId = student.id || "CS-8201";

    let totalAccumulated = 0;
    const scores = ALL_SUBJECTS.map((subj, idx) => {
      const seed = (stId.length * 19 + idx * 29 + (activeTerm === "1st Term" ? 7 : 13)) % 43;
      const ca1 = Math.min(15, Math.max(9, 11 + (seed % 5)));
      const ca2 = Math.min(15, Math.max(10, 11 + (seed % 5)));
      const midTerm = Math.min(20, Math.max(13, 15 + (seed % 6)));
      const exam = Math.min(50, Math.max(28, 36 + (seed % 15)));
      const total = ca1 + ca2 + midTerm + exam;
      const grade = total >= 80 ? "A1" : total >= 70 ? "B2" : total >= 65 ? "B3" : total >= 55 ? "C4" : "C6";
      totalAccumulated += total;

      return {
        subject: subj,
        ca1,
        ca2,
        midTerm,
        exam,
        total,
        grade,
        position: (idx % 3) + 1
      };
    });

    const maxPossible = ALL_SUBJECTS.length * 100;
    const avgPct = Math.round((totalAccumulated / maxPossible) * 100);
    const termGpa = Number((avgPct / 20).toFixed(2));

    return {
      scores,
      totalAccumulated,
      maxPossible,
      avgPct,
      termGpa,
      rank: "#1"
    };
  }, [student, activeTerm]);

  // Chart Metric state: "score" (%) or "gpa" (5.0 scale)
  const [chartMetric, setChartMetric] = useState<"score" | "gpa">("score");

  // Dynamic multi-term grade progression data for Recharts line chart
  const studentProgressionData = useMemo(() => {
    const baseAvg = currentSubjectBreakdown.avgPct;
    const stId = student.id || "CS-8201";
    let seed = 0;
    for (let i = 0; i < stId.length; i++) {
      seed += stId.charCodeAt(i);
    }

    const t1 = Math.min(98, Math.max(62, baseAvg - 6 + (seed % 5)));
    const t2 = Math.min(98, Math.max(60, baseAvg - 3 + ((seed + 2) % 6)));
    const t3 = Math.min(98, Math.max(65, baseAvg - 1 + ((seed + 1) % 4)));
    const t4 = baseAvg;

    return [
      {
        termLabel: "1st Term 24/25",
        fullTerm: "1st Term 2024/2025",
        studentAvg: t1,
        classAvg: 68.0,
        gpa: Number((t1 / 20).toFixed(2)),
        classGpa: 3.40,
        rank: t1 >= 85 ? "#1" : t1 >= 75 ? "#2" : "#4"
      },
      {
        termLabel: "2nd Term 24/25",
        fullTerm: "2nd Term 2024/2025",
        studentAvg: t2,
        classAvg: 68.5,
        gpa: Number((t2 / 20).toFixed(2)),
        classGpa: 3.43,
        rank: t2 >= 85 ? "#1" : t2 >= 75 ? "#2" : "#3"
      },
      {
        termLabel: "3rd Term 24/25",
        fullTerm: "3rd Term 2024/2025",
        studentAvg: t3,
        classAvg: 69.2,
        gpa: Number((t3 / 20).toFixed(2)),
        classGpa: 3.46,
        rank: t3 >= 85 ? "#1" : t3 >= 75 ? "#2" : "#3"
      },
      {
        termLabel: "1st Term 25/26",
        fullTerm: "1st Term 2025/2026 (Current)",
        studentAvg: t4,
        classAvg: 70.1,
        gpa: Number((t4 / 20).toFixed(2)),
        classGpa: 3.51,
        rank: t4 >= 85 ? "#1" : t4 >= 75 ? "#2" : "#3"
      }
    ];
  }, [student, currentSubjectBreakdown.avgPct]);

  // Check if current performance summary has been pushed by teacher
  const existingPushRecord = useMemo(() => {
    return pushedSummaries.find(
      (p) => p.studentId === student.id && p.session === activeSession && p.term === activeTerm
    );
  }, [pushedSummaries, student, activeSession, activeTerm]);

  // Handle Push Performance Summary submit
  const handlePushPerformanceSummary = () => {
    if (!pushSummaryNote.trim()) {
      toast.error("Please provide a short teacher recommendation / summary note.");
      return;
    }

    const newPush = {
      id: `push-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      regNumber: student.reg,
      classCohort: student.class,
      session: activeSession,
      term: activeTerm,
      pushedBy: currentProfile?.fullName || (currentProfile as any)?.name || "Class Teacher",
      pushedRole: currentProfile?.role || "teacher",
      teacherNote: pushSummaryNote,
      aggregateScore: `${currentSubjectBreakdown.totalAccumulated} / ${currentSubjectBreakdown.maxPossible}`,
      averagePercentage: `${currentSubjectBreakdown.avgPct}%`,
      gpa: currentSubjectBreakdown.termGpa,
      pushedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
      status: "Pushed to Admin & Parent Portal"
    };

    const nextList = [newPush, ...pushedSummaries];
    setPushedSummaries(nextList);
    localStorage.setItem("CS_PUSHED_PERFORMANCE_SUMMARIES", JSON.stringify(nextList));

    toast.success(`Performance summary for ${student.name} pushed to School Admin & Parent Notification Queue!`);
    setIsPushModalOpen(false);
    setPushSummaryNote("");
  };

  return (
    <motion.div
      key={`${student.id}_${activeTerm}_${activeSession}`}
      variants={dossierContainerVariants}
      initial="hidden"
      animate="show"
      className={`space-y-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 ${className}`}
      id="student-result-dossier"
    >
      {/* PRINT-ONLY OFFICIAL SCHOOL BRANDED HEADER */}
      <PrintOnlySchoolHeader
        session={activeSession}
        term={activeTerm}
        documentTitle="Academic Dossier"
      />

      {/* DOSSIER TOP HEADER CARD WITH STUDENT PASSPORT PHOTO */}
      <motion.div variants={dossierCardVariants} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            {/* STUDENT PASSPORT PHOTO BOX */}
            <div className="relative shrink-0">
              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-100 border-2 border-indigo-950 rounded-xl overflow-hidden shadow-sm flex flex-col items-center justify-center relative">
                <img
                  src={
                    student.passportUrl ||
                    (student.gender === "Female"
                      ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
                      : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80")
                  }
                  alt={`${student.name} Passport`}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-indigo-950/90 text-white text-[6.5px] font-mono font-black uppercase text-center py-0.5 tracking-tighter">
                  PASSPORT
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Student Result Dossier & History
                </span>
                {existingPushRecord && (
                  <span className="text-[9px] font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Pushed to Admin & Parents
                  </span>
                )}
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isCurrentStudentLocked
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {isCurrentStudentLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
                  {isCurrentStudentLocked ? "Portal Access: Locked" : "Portal Access: Unlocked"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight mt-1">
                {student.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Reg Number: <strong className="text-slate-800">{student.reg}</strong> • Class: <strong className="text-slate-800">{student.class}</strong> • Session: <strong className="text-slate-800">{activeSession}</strong>
              </p>
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS: TEACHER PUSH SUMMARY, LOCK TOGGLE & PRINT */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleStudentLock(student.id, student.name)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer ${
                resultLockMap[student.id]
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
              title="Class Teacher toggle controlling student and parent portal access"
            >
              {resultLockMap[student.id] ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Result</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Result</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPushModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer ${
                existingPushRecord
                  ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                  : "bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{existingPushRecord ? "Update Pushed Summary" : "Push Performance Summary"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview Modal</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            {/* CUSTOM STUDENT SELECTOR DROPDOWN (AGENTS.MD COMPLIANT) */}
            {studentsList.length > 0 && (
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setIsStudentSelectOpen(!isStudentSelectOpen)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 hover:bg-slate-50 shadow-2xs transition"
                >
                  <span className="truncate max-w-[130px]">{student.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStudentSelectOpen ? "rotate-180" : ""}`} />
                </button>

                {isStudentSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsStudentSelectOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden font-sans">
                      <div className="p-2.5 border-b border-slate-100 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-black uppercase text-slate-500">Select Child Dossier</span>
                          <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            {filteredDossierStudents.length} {filteredDossierStudents.length === 1 ? 'student' : 'students'}
                          </span>
                        </div>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={dossierSearchQuery}
                            onChange={(e) => setDossierSearchQuery(e.target.value)}
                            placeholder="Search name, class, ID..."
                            className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                          />
                          {dossierSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setDossierSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="py-1 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredDossierStudents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-mono">
                            No student matches "{dossierSearchQuery}"
                          </div>
                        ) : (
                          filteredDossierStudents.map((st) => {
                            const stIdVal = st.id || st.studentId;
                            const isSelected = student.id === stIdVal;
                            const stName = st.name || st.studentName || "Student Name";
                            const stReg = st.reg || st.regNumber || stIdVal;
                            const stClass = st.class || st.classCohort || "Primary 5";

                            return (
                              <button
                                key={stIdVal}
                                type="button"
                                onClick={() => {
                                  if (onSelectStudent) onSelectStudent(stIdVal);
                                  setIsStudentSelectOpen(false);
                                  setDossierSearchQuery("");
                                }}
                                className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left transition-all group ${
                                  isSelected
                                    ? "bg-indigo-50 text-indigo-900 font-bold"
                                    : "text-slate-700 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold truncate text-xs">{stName}</div>
                                  <div className={`text-[10px] font-mono transition-colors ${
                                    isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-emerald-100"
                                  }`}>
                                    {stClass} • {stReg}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CLASS TEACHER RESULT LOCK & RELEASE CONTROL PANEL */}
        <motion.div variants={dossierCardVariants} className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/80 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-indigo-800/60">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isCurrentStudentLocked ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                {isCurrentStudentLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase text-indigo-300 tracking-wider">
                    Class Teacher Portal Result Lock / Release Hub
                  </span>
                  <span className={`text-[8.5px] font-mono font-bold px-2 py-0.25 rounded-md ${
                    isCurrentStudentLocked
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}>
                    {isCurrentStudentLocked ? "🔒 ACCESS LOCKED IN PORTALS" : "🟢 ACCESS UNLOCKED IN PORTALS"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-0.5">
                  Report Card Release Control for <span className="text-emerald-400 font-extrabold">{student.name}</span>
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Single Student Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleStudentLock(student.id, student.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                  resultLockMap[student.id]
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                {resultLockMap[student.id] ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock {student.name}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock {student.name}</span>
                  </>
                )}
              </button>

              {/* Class-wide Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleClassWideLock}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  isClassWideLocked
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{isClassWideLocked ? "Class-Wide Lock: ACTIVE" : "Lock Entire Class"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLockMatrixOpen(!isLockMatrixOpen)}
                className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Class Roster ({studentsList.length || 1})</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLockMatrixOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-indigo-200/90 leading-relaxed">
            As class teacher, toggling this lock directly controls whether students and parents can view or download this term's report card in the Student/Parent portals. Lock results for students with pending clearance or academic holds.
          </p>

          {/* CLASS ROSTER LOCK MATRIX DRAWER */}
          {isLockMatrixOpen && (
            <div className="pt-2 border-t border-indigo-800/60 animate-in fade-in duration-200 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300 font-bold uppercase">
                <span>Class Roster Result Access Control Matrix</span>
                <span>Toggle individual student report card access</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(studentsList.length > 0 ? studentsList : [{ id: student.id, name: student.name, class: student.class }]).map((st) => {
                  const stId = st.id || st.studentId;
                  const stName = st.name || st.studentName;
                  const isLocked = isClassWideLocked || !!resultLockMap[stId];

                  return (
                    <div key={stId} className="bg-slate-900/90 border border-indigo-800/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{stName}</span>
                        <span className="text-[9px] font-mono text-indigo-300 block">{st.reg || stId}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStudentLock(stId, stName)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition shrink-0 cursor-pointer ${
                          isLocked
                            ? "bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:bg-rose-500/40"
                            : "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40"
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>LOCKED</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span>UNLOCKED</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* TERM-OVER-TERM AT-RISK SCORE DROP INTERVENTION BANNER */}
        {(() => {
          const previousTermScore = 84.2;
          const currentTermScore = currentSubjectBreakdown.avgPct;
          const termScoreDropDelta = Math.round((previousTermScore - currentTermScore) * 10) / 10;
          const isStudentAtRisk = termScoreDropDelta >= atRiskThreshold;

          if (!isStudentAtRisk && !interventionRecord) return null;

          return (
            <motion.div variants={dossierCardVariants} className="p-4 bg-gradient-to-r from-amber-950 via-rose-950 to-indigo-950 text-white border border-amber-500/50 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-mono text-[9.5px] font-black uppercase rounded shadow-2xs">
                        ⚠️ Term-over-Term At-Risk Flag
                      </span>
                      <span className="text-rose-300 font-mono text-xs font-bold">
                        Score Drop: -{termScoreDropDelta}% (Exceeds -{atRiskThreshold}% Threshold)
                      </span>
                    </div>
                    <h4 className="text-sm font-display font-black text-white mt-1">
                      Academic Performance Decline Alert for {student.name}
                    </h4>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Previous Term Score: <span className="text-emerald-400 font-bold">{previousTermScore}%</span> → Current Term Score: <span className="text-rose-400 font-bold">{currentTermScore}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {interventionRecord && (
                    <div className="text-right font-mono">
                      <span className="block text-[9px] uppercase text-emerald-300 font-bold">
                        Status: {interventionRecord.status}
                      </span>
                      <span className="text-xs font-black text-white truncate max-w-[140px] block">
                        {interventionRecord.interventionCategory}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsInterventionOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                    <span>{interventionRecord ? "View Intervention Plan" : "Trigger Intervention Plan"}</span>
                  </button>
                </div>
              </div>

              {interventionRecord && (
                <div className="p-3 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl font-mono text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between text-slate-300 text-[10px] gap-2">
                    <span>Assigned Lead: <strong className="text-white">{interventionRecord.assignedTeacher}</strong></span>
                    <span>Target Recovery: <strong className="text-amber-300">{interventionRecord.targetScoreGoal}% Goal</strong></span>
                    <span>Priority: <strong className="text-rose-300">{interventionRecord.priorityLevel}</strong></span>
                  </div>
                  <p className="italic text-slate-200 font-sans text-xs mt-1">
                    &quot;{interventionRecord.interventionNotes}&quot;
                  </p>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* METRICS OVERVIEW CARDS GRID */}
        <motion.div variants={dossierCardVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Grade in Percent */}
          <motion.div
            variants={metricItemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="p-3.5 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 rounded-xl space-y-1 shadow-2xs hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between text-[9px] font-mono font-black text-indigo-700 uppercase tracking-wider">
              <span>Grade in Percent</span>
              <Award className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-black text-indigo-950">
                {currentSubjectBreakdown.avgPct >= 80 ? "A1" : currentSubjectBreakdown.avgPct >= 70 ? "B2" : "C4"}
              </span>
              <span className="text-xs text-indigo-700 font-extrabold">({currentSubjectBreakdown.avgPct}%)</span>
            </div>
            <span className="text-[8px] text-slate-500 font-sans block">Overall Grade Distinction</span>
          </motion.div>

          {/* Card 2: Total No. of Scores */}
          <motion.div
            variants={metricItemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="p-3.5 bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200 rounded-xl space-y-1 shadow-2xs hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between text-[9px] font-mono font-black text-emerald-800 uppercase tracking-wider">
              <span>Total No. of Scores</span>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-black text-emerald-950">{currentSubjectBreakdown.totalAccumulated}</span>
              <span className="text-xs text-emerald-700 font-bold">/ {currentSubjectBreakdown.maxPossible}</span>
            </div>
            <span className="text-[8px] text-slate-500 font-sans block">Total Scores Accumulated</span>
          </motion.div>

          {/* Card 3: Class Average Score */}
          <motion.div
            variants={metricItemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="p-3.5 bg-gradient-to-br from-amber-50 to-slate-50 border border-amber-200 rounded-xl space-y-1 shadow-2xs hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between text-[9px] font-mono font-black text-amber-800 uppercase tracking-wider">
              <span>Class Average</span>
              <Users className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="block text-xl font-black text-amber-950 font-mono">
              68.5%
            </span>
            <span className="text-[8px] text-slate-500 font-sans block">Class Cohort Benchmark</span>
          </motion.div>

          {/* Card 4: Student's Average Score */}
          <motion.div
            variants={metricItemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="p-3.5 bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200 rounded-xl space-y-1 shadow-2xs hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between text-[9px] font-mono font-black text-purple-800 uppercase tracking-wider">
              <span>Student&apos;s Avg Score</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="block text-xl font-black text-purple-950 font-mono">
              {currentSubjectBreakdown.avgPct}%
            </span>
            <span className="text-[8px] text-slate-500 font-sans block">Student Average Percentage</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* SECTION 1: AGGREGATED SUBJECT BREAKDOWN (READ-ONLY CORE RESULT DOSSIER) */}
      <motion.div variants={dossierCardVariants} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-display font-black text-slate-900">
              Aggregated Subject Performance Breakdown ({activeTerm})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            VERIFIED INSTITUTIONAL GRADE RECORD
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-b">Subject Name</th>
                <th className="p-2.5 border-b text-center">CA 1 (15%)</th>
                <th className="p-2.5 border-b text-center">CA 2 (15%)</th>
                <th className="p-2.5 border-b text-center">Mid-Term (20%)</th>
                <th className="p-2.5 border-b text-center">Exam (50%)</th>
                <th className="p-2.5 border-b text-center">Total Score</th>
                <th className="p-2.5 border-b text-center">Grade</th>
                <th className="p-2.5 border-b text-center">Subject Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {currentSubjectBreakdown.scores.map((row) => (
                <tr key={row.subject} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-slate-900">{row.subject}</td>
                  <td className="p-2.5 text-center text-slate-600">{row.ca1}</td>
                  <td className="p-2.5 text-center text-slate-600">{row.ca2}</td>
                  <td className="p-2.5 text-center text-slate-600">{row.midTerm}</td>
                  <td className="p-2.5 text-center text-slate-600">{row.exam}</td>
                  <td className="p-2.5 text-center font-black text-indigo-950">{row.total}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                      row.total >= 80 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                      row.total >= 65 ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-rose-100 text-rose-700"
                    }`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-500">#{row.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* D3 INTERACTIVE BAR CHART: SESSION GRADE TRENDS & BENCHMARKS */}
      <motion.div variants={dossierCardVariants}>
        <StudentGradeTrendD3Chart
          studentName={student.name}
          className={student.class}
          academicSession="2025/2026 Academic Session"
          data={currentSubjectBreakdown.scores.map((s) => ({
            subject: s.subject,
            ca1: s.ca1,
            ca2: s.ca2,
            exam: s.exam,
            total: s.total,
            previousTermTotal: Math.max(40, Math.min(100, Math.round(s.total * (0.92 + (Math.sin(s.total) * 0.08))))),
            grade: s.grade
          }))}
        />
      </motion.div>

      {/* SECTION 2: READ-ONLY CUMULATIVE ACADEMIC HISTORY TIMELINE & RECHARTS LINE CHART */}
      <motion.div variants={dossierCardVariants} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-display font-black text-slate-900">
                Student Grade Progression & Multi-Term Growth Trajectory
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Visualizing <span className="font-bold text-slate-800">{student.name}</span>&apos;s academic performance evolution across terms vs class cohort benchmark
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* TOGGLE SCORE VS GPA */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setChartMetric("score")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartMetric === "score"
                    ? "bg-indigo-950 text-emerald-400 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Score %
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("gpa")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartMetric === "gpa"
                    ? "bg-indigo-950 text-emerald-400 font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                GPA (5.0)
              </button>
            </div>

            <span className="text-[10px] font-mono text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold uppercase flex items-center gap-1">
              <LineChartIcon className="w-3 h-3 text-indigo-600" />
              <span>Multi-Term Recharts</span>
            </span>
          </div>
        </div>

        {/* RECHARTS LINE CHART CONTAINER */}
        <div className="bg-slate-50/80 p-4 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold px-1">
            <div className="flex items-center gap-4 text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                <span>{student.name}&apos;s {chartMetric === "score" ? "Avg Score (%)" : "GPA (5.0)"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-dashed border-emerald-800" />
                <span>Class Cohort Average</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-black">
                Latest Score: {currentSubjectBreakdown.avgPct}% ({currentSubjectBreakdown.termGpa} GPA)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={studentProgressionData}
                margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="termLabel"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={chartMetric === "score" ? [50, 100] : [2.5, 5.0]}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit={chartMetric === "score" ? "%" : ""}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const valKey = chartMetric === "score" ? "studentAvg" : "gpa";
                      const classKey = chartMetric === "score" ? "classAvg" : "classGpa";
                      const diff = Number((data[valKey] - data[classKey]).toFixed(1));

                      return (
                        <div className="bg-indigo-950 text-white border border-indigo-800 p-3 rounded-xl shadow-xl font-sans text-xs space-y-1.5 min-w-[190px]">
                          <div className="font-mono font-black text-amber-300 border-b border-indigo-800 pb-1 flex justify-between">
                            <span>{data.fullTerm}</span>
                            <span className="text-emerald-400">{data.rank}</span>
                          </div>
                          <div className="space-y-1 font-mono">
                            <div className="flex justify-between items-center text-indigo-100">
                              <span>Student Metric:</span>
                              <strong className="text-white text-sm font-black">
                                {data[valKey]}{chartMetric === "score" ? "%" : ""}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>Class Cohort Avg:</span>
                              <span className="text-slate-200">
                                {data[classKey]}{chartMetric === "score" ? "%" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-indigo-900">
                              <span>Cohort Lead:</span>
                              <span className={`font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {diff >= 0 ? `+${diff}` : diff}{chartMetric === "score" ? "%" : " pts"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={chartMetric === "score" ? 70 : 3.5}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: chartMetric === "score" ? 'Credit Mark (70%)' : 'Honor Roll (3.5)', fill: '#d97706', fontSize: 10, fontWeight: 700, position: 'insideTopLeft' }}
                />
                <Line
                  type="monotone"
                  dataKey={chartMetric === "score" ? "studentAvg" : "gpa"}
                  name="Student Performance"
                  stroke="#4f46e5"
                  strokeWidth={3.5}
                  dot={{ r: 6, fill: '#312e81', stroke: '#10b981', strokeWidth: 2.5 }}
                  activeDot={{ r: 8, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey={chartMetric === "score" ? "classAvg" : "classGpa"}
                  name="Class Cohort Avg"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HISTORICAL TERM SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {studentProgressionData.map((pt, idx) => (
            <motion.div
              key={pt.fullTerm}
              variants={metricItemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              className={`p-3.5 rounded-xl border transition ${
                idx === studentProgressionData.length - 1
                  ? "bg-indigo-950 text-white border-indigo-900 shadow-xs"
                  : "bg-slate-50 text-slate-800 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9.5px] font-mono font-black uppercase ${idx === studentProgressionData.length - 1 ? "text-indigo-300" : "text-slate-400"}`}>
                  {pt.termLabel}
                </span>
                <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  idx === studentProgressionData.length - 1 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-200 text-slate-700"
                }`}>
                  {idx === studentProgressionData.length - 1 ? "Current Term" : "Archived Record"}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between font-mono">
                <span className="text-lg font-black">{pt.studentAvg}%</span>
                <span className={`text-xs font-bold ${idx === studentProgressionData.length - 1 ? "text-amber-300" : "text-amber-700"}`}>
                  GPA {pt.gpa} ({pt.rank})
                </span>
              </div>
              <p className={`text-[10px] font-mono mt-1 ${idx === studentProgressionData.length - 1 ? "text-indigo-200" : "text-slate-500"}`}>
                Class Cohort Avg: {pt.classAvg}%
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SECTION 3: AFFECTIVE DOMAIN & OFFICIAL REMARKS */}
      {(() => {
        const storedComment = getStoredStudentCustomComment(student.id);
        const studentFirstName = (student.name || "Student").trim().split(/\s+/)[0];
        const teacherCommentText = storedComment?.teacherComment || `${student.name} has demonstrated exemplary academic consistency and attentiveness throughout ${activeTerm}. Recommended for continuous advanced enrichment projects.`;
        const principalRemarkText = storedComment?.principalRemark || `Approved for Next Academic Term. Keep sustaining this high level of academic performance, ${studentFirstName}.`;
        const activeTraits = storedComment?.psychomotorRatings || AFFECTIVE_DOMAINS;

        return (
          <motion.div variants={dossierCardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Affective Behavior & Trait Ratings */}
            <motion.div variants={metricItemVariants} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Affective Traits & Behavioral Domain
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                {activeTraits.map((ad) => (
                  <div key={ad.trait} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded-lg">
                    <span className="text-slate-700 font-medium">{ad.trait}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10.5px]">
                      {ad.rating}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Institutional Teacher & Principal Remarks */}
            <motion.div variants={metricItemVariants} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Official Institutional Remarks & Validation
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAutoCommentModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>AI Auto-Comment ({studentFirstName})</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] font-mono font-black uppercase text-indigo-500">
                      Class Teacher Summary Remark
                    </span>
                    {storedComment && (
                      <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                        ✨ AI Drafted for {studentFirstName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 italic font-medium leading-relaxed">
                    &quot;{teacherCommentText}&quot;
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                  <span className="block text-[9px] font-mono font-black uppercase text-emerald-600">
                    Principal Signature & Endorsement
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-700 font-bold italic">&quot;{principalRemarkText}&quot;</span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-black shrink-0 ml-2">
                      SEALED & SIGNED
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}

      {/* PUSH PERFORMANCE SUMMARY MODAL FOR TEACHERS */}
      <AnimatePresence>
        {isPushModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-4 bg-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Push Performance Summary to Admin & Parents
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPushModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <p className="font-bold text-indigo-900">
                    Pushing Result Performance Summary for {student.name}
                  </p>
                  <p className="text-[11px] text-indigo-700 leading-snug">
                    This action will package the aggregated subject scores ({currentSubjectBreakdown.totalAccumulated} pts • {currentSubjectBreakdown.avgPct}%) and broadcast the summary directly to the School Admin desk and Parent Portal.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    Teacher Recommendation / Summary Note
                  </label>
                  <textarea
                    rows={3}
                    value={pushSummaryNote}
                    onChange={(e) => setPushSummaryNote(e.target.value)}
                    placeholder="Enter teacher notes on student growth, academic strengths, or recommended focus areas..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPushModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePushPerformanceSummary}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push Summary Now</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEDICATED REPORT CARD PRINT PREVIEW MODAL */}
      <ReportCardPrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        studentsList={studentsList.length > 0 ? studentsList : [{ id: student.id, name: student.name, reg: student.reg, class_name: student.class }]}
        initialClass={student.class}
        initialStudentId={student.id}
        activeSession={activeSession}
        activeTerm={activeTerm}
      />

      {/* AUTO-COMMENT GENERATOR MODAL */}
      <AutoCommentGeneratorModal
        isOpen={isAutoCommentModalOpen}
        onClose={() => setIsAutoCommentModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
        classCohort={student.class}
        session={activeSession}
        term={activeTerm}
        subjectScores={currentSubjectBreakdown.scores.map((s) => ({
          subject: s.subject,
          total: s.total,
          grade: s.grade,
          ca1: s.ca1,
          ca2: s.ca2,
          exam: s.exam
        }))}
      />

      {/* TEACHER AT-RISK INTERVENTION ACTION MODAL */}
      <AtRiskInterventionModal
        isOpen={isInterventionOpen}
        onClose={() => setIsInterventionOpen(false)}
        studentId={student.id}
        studentName={student.name}
        regNumber={student.reg}
        classCohort={student.class}
        previousTermScore={84.2}
        currentTermScore={currentSubjectBreakdown.avgPct}
        configuredThreshold={atRiskThreshold}
      />
    </motion.div>
  );
}
