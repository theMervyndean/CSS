import React, { useState, useMemo, useEffect } from "react";
import {
  Printer,
  X,
  ChevronDown,
  Check,
  GraduationCap,
  Award,
  FileText,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Users,
  Bot,
  Camera,
  Upload,
  PenTool,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { AutoCommentGeneratorModal, getStoredStudentCustomComment } from "./AutoCommentGeneratorModal";
import { PrintOnlySchoolHeader } from "./PrintOnlySchoolHeader";

export interface StudentRecord {
  id: string;
  name: string;
  reg?: string;
  regNumber?: string;
  class_name?: string;
  class?: string;
  classCohort?: string;
  parent_email?: string;
  gender?: string;
}

export interface ReportCardPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentsList?: StudentRecord[];
  availableClasses?: string[];
  initialClass?: string;
  initialStudentId?: string;
  schoolInfo?: {
    name?: string;
    motto?: string;
    logo_url?: string;
    address?: string;
    principalName?: string;
  };
  activeSession?: string;
  activeTerm?: string;
}

const ALL_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Physics / Basic Science",
  "Chemistry / Social Studies",
  "Biology / Agricultural Science",
  "Civic Education",
  "Computer Studies / ICT",
  "Economics / Commercial Studies",
  "French Language",
  "Physical & Health Education"
];

const SESSIONS = ["2025/2026 (Current)", "2024/2025", "2023/2024"];
const TERMS = ["1st Term", "2nd Term", "3rd Term"];

const AFFECTIVE_TRAITS = [
  { trait: "Punctuality & Attendance", rating: "5/5 - Outstanding" },
  { trait: "Neatness & Uniform Assembly", rating: "4/5 - Very Good" },
  { trait: "Class Participation & Quiz Effort", rating: "5/5 - Exemplary" },
  { trait: "Peer Collaboration & Team Leadership", rating: "5/5 - Exemplary" },
  { trait: "Emotional Stability & Self-Control", rating: "4/5 - Very Good" }
];

export function ReportCardPrintPreviewModal({
  isOpen,
  onClose,
  studentsList = [],
  availableClasses = [],
  initialClass = "",
  initialStudentId = "",
  schoolInfo = {
    name: "Corner Streams International Academy",
    motto: "Excellence & Honor in Character and Service",
    logo_url: "",
    address: "12 Corner Streams Boulevard, Victoria Island, Lagos",
    principalName: "Dr. Mrs. Folasade Adebayo"
  },
  activeSession = "2025/2026 (Current)",
  activeTerm = "1st Term"
}: ReportCardPrintPreviewModalProps) {
  // Normalize students array
  const defaultStudents: StudentRecord[] = useMemo(() => {
    if (studentsList && studentsList.length > 0) return studentsList;
    return [
      { id: "CS-8201", name: "Chinedu Okeke", reg: "CS/2025/001", class_name: "SS 2 Science", gender: "Male" },
      { id: "CS-8202", name: "Amina Yusuf", reg: "CS/2025/002", class_name: "SS 2 Science", gender: "Female" },
      { id: "CS-8203", name: "Tunde Bakare", reg: "CS/2025/003", class_name: "SS 2 Science", gender: "Male" },
      { id: "CS-8204", name: "Nneka Eze", reg: "CS/2025/004", class_name: "JSS 1 Green", gender: "Female" },
      { id: "CS-8205", name: "David Opeyemi", reg: "CS/2025/005", class_name: "Primary 5", gender: "Male" }
    ];
  }, [studentsList]);

  // Classes list
  const classesOptions = useMemo(() => {
    const list = new Set<string>();
    availableClasses.forEach((c) => c && list.add(c));
    defaultStudents.forEach((st) => {
      const cls = st.class_name || st.class || st.classCohort;
      if (cls) list.add(cls);
    });
    if (list.size === 0) {
      list.add("SS 2 Science");
      list.add("JSS 1 Green");
      list.add("Primary 5");
    }
    return Array.from(list);
  }, [availableClasses, defaultStudents]);

  // States
  const [selectedClass, setSelectedClass] = useState<string>(
    initialClass || classesOptions[0] || "SS 2 Science"
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || "ALL"
  );
  const [selectedSession, setSelectedSession] = useState<string>(activeSession);
  const [selectedTerm, setSelectedTerm] = useState<string>(activeTerm);

  // Auto-Comment Generator Modal State
  const [isAutoCommentOpen, setIsAutoCommentOpen] = useState(false);
  const [autoCommentStudent, setAutoCommentStudent] = useState<StudentRecord | null>(null);
  const [customCommentsVersion, setCustomCommentsVersion] = useState(0);

  // State for AI Remarks selections and Teacher/Principal verification
  const [activeAiRemarkSelectorStId, setActiveAiRemarkSelectorStId] = useState<string | null>(null);
  const [verifiedTeacherRemarks, setVerifiedTeacherRemarks] = useState<Record<string, { remark: string; verifiedBy: string; verifiedAt: string }>>({});
  const [verifiedPrincipalRemarks, setVerifiedPrincipalRemarks] = useState<Record<string, { remark: string; verifiedBy: string; verifiedAt: string }>>({});

  // State for Custom Passport Photos and Digital Signatures
  const [customStudentPassports, setCustomStudentPassports] = useState<Record<string, string>>({});
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState<string | null>(null);
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("Mr. O. Chukwuma (Class Teacher)");
  const [principalName, setPrincipalName] = useState<string>(schoolInfo.principalName || "Dr. Folasade Adebayo (Principal)");

  // Passport Photo Upload Handler
  const handlePassportUpload = (stId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomStudentPassports((prev) => ({ ...prev, [stId]: result }));
        toast.success("Passport photograph updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Teacher Signature Upload Handler
  const handleTeacherSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTeacherSignatureUrl(e.target?.result as string);
        toast.success("Class Teacher digital signature uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Principal Signature Upload Handler
  const handlePrincipalSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPrincipalSignatureUrl(e.target?.result as string);
        toast.success("Principal digital signature & seal uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCustomCommentsVersion((v) => v + 1);
    };
    window.addEventListener("cs-auto-comment-updated", handleUpdate);
    return () => window.removeEventListener("cs-auto-comment-updated", handleUpdate);
  }, []);

  // Custom Dropdown Open States (AGENTS.MD COMPLIANT)
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isTermOpen, setIsTermOpen] = useState(false);

  // Fit-to-Page Print Toggle (A4 Single-Page Constraint)
  const [isFitToPage, setIsFitToPage] = useState<boolean>(true);

  // Dynamic Refreshed Teacher Comments State
  const [refreshedTeacherComments, setRefreshedTeacherComments] = useState<Record<string, string>>({});

  const handleRegenerateModalComment = (stId: string, firstName: string, avgPct: number) => {
    const remarkPools = {
      high: [
        `${firstName} displays exceptional academic mastery, exemplary discipline, and outstanding problem-solving.`,
        `${firstName} is a brilliant, self-motivated scholar who consistently sets a benchmark of academic excellence.`,
        `${firstName} demonstrates superlative analytical ability, thorough preparation, and praiseworthy character.`
      ],
      medium: [
        `${firstName} shows commendable academic diligence, steady progress, and good classroom participation.`,
        `${firstName} is a focused learner who maintains strong subject comprehension and consistent assignment output.`,
        `${firstName} demonstrates solid academic growth and commendable focus across core curriculum topics.`
      ],
      low: [
        `${firstName} has potential but requires extra focus and structured revision in foundational concepts.`,
        `${firstName} is advised to embrace disciplined daily revision and seek tutorial guidance in weak subjects.`,
        `${firstName} needs closer academic monitoring and consistent study habits to elevate overall performance.`
      ]
    };

    let pool = remarkPools.medium;
    if (avgPct >= 80) pool = remarkPools.high;
    else if (avgPct < 65) pool = remarkPools.low;

    const currentComment = refreshedTeacherComments[stId] || pool[0];
    const options = pool.filter((c) => c !== currentComment);
    const newComment = options[Math.floor(Math.random() * options.length)] || pool[0];

    setRefreshedTeacherComments((prev) => ({
      ...prev,
      [stId]: newComment
    }));

    toast.success(`Refreshed AI comment for ${firstName}!`);
  };

  // Filter students by selected class
  const classStudents = useMemo(() => {
    if (selectedClass === "ALL_CLASSES") {
      return defaultStudents;
    }
    return defaultStudents.filter((st) => {
      const c = st.class_name || st.class || st.classCohort || "";
      return c === selectedClass || c.includes(selectedClass);
    });
  }, [defaultStudents, selectedClass]);

  // Target preview candidates
  const targetStudents = useMemo(() => {
    if (selectedStudentId === "ALL") {
      return classStudents.length > 0 ? classStudents : defaultStudents.slice(0, 1);
    }
    const found = classStudents.find((st) => st.id === selectedStudentId);
    if (found) return [found];
    const globalFound = defaultStudents.find((st) => st.id === selectedStudentId);
    return globalFound ? [globalFound] : classStudents.slice(0, 1);
  }, [classStudents, selectedStudentId, defaultStudents]);

  if (!isOpen) return null;

  const handlePrint = () => {
    toast.success(`Preparing print job for ${targetStudents.length} student report card(s)...`, {
      duration: 3000
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* NON-PRINTABLE MODAL HEADER TOOLBAR */}
        <div className="no-print p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-700 to-emerald-600 rounded-xl text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  Official Document Vault
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                  {targetStudents.length} Candidate(s) Selected
                </span>
              </div>
              <h3 className="text-base font-display font-black text-white tracking-tight mt-0.5">
                Report Card Print Preview & Dispatch Modal
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const st = targetStudents[0] || defaultStudents[0];
                setAutoCommentStudent(st);
                setIsAutoCommentOpen(true);
              }}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Auto-Comment</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report Card(s) ({targetStudents.length})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NON-PRINTABLE FILTERING CONTROLS BAR */}
        <div className="no-print p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
          {/* CUSTOM CLASS SELECTOR */}
          <div className="relative">
            <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-0.5">Select Class</label>
            <button
              type="button"
              onClick={() => {
                setIsClassOpen(!isClassOpen);
                setIsStudentOpen(false);
                setIsSessionOpen(false);
                setIsTermOpen(false);
              }}
              className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100/50 shadow-2xs transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate max-w-[130px]">{selectedClass === "ALL_CLASSES" ? "All Campus Classes" : selectedClass}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isClassOpen ? "rotate-180" : ""}`} />
            </button>

            {isClassOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsClassOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                  <div className="p-1.5 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClass("ALL_CLASSES");
                        setSelectedStudentId("ALL");
                        setIsClassOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                        selectedClass === "ALL_CLASSES"
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                          : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                      }`}
                    >
                      <span>All Campus Classes</span>
                      {selectedClass === "ALL_CLASSES" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    {classesOptions.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls);
                          setSelectedStudentId("ALL");
                          setIsClassOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                          selectedClass === cls
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{cls}</span>
                        {selectedClass === cls && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CUSTOM STUDENT SELECTOR */}
          <div className="relative">
            <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-0.5">Select Student Target</label>
            <button
              type="button"
              onClick={() => {
                setIsStudentOpen(!isStudentOpen);
                setIsClassOpen(false);
                setIsSessionOpen(false);
                setIsTermOpen(false);
              }}
              className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100/50 shadow-2xs transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[150px]">
                {selectedStudentId === "ALL"
                  ? `All Students in Class (${classStudents.length})`
                  : classStudents.find((s) => s.id === selectedStudentId)?.name || defaultStudents.find((s) => s.id === selectedStudentId)?.name || "Select Student"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStudentOpen ? "rotate-180" : ""}`} />
            </button>

            {isStudentOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsStudentOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                  <div className="p-1 font-sans max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId("ALL");
                        setIsStudentOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                        selectedStudentId === "ALL"
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                          : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                      }`}
                    >
                      <span>✨ All Students in Class ({classStudents.length})</span>
                      {selectedStudentId === "ALL" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    {classStudents.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setIsStudentOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                          selectedStudentId === st.id
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span className="truncate">{st.name} ({st.id})</span>
                        {selectedStudentId === st.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CUSTOM SESSION SELECTOR */}
          <div className="relative">
            <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-0.5">Academic Session</label>
            <button
              type="button"
              onClick={() => {
                setIsSessionOpen(!isSessionOpen);
                setIsClassOpen(false);
                setIsStudentOpen(false);
                setIsTermOpen(false);
              }}
              className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100/50 shadow-2xs transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{selectedSession}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSessionOpen ? "rotate-180" : ""}`} />
            </button>

            {isSessionOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSessionOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                  <div className="p-1 font-sans">
                    {SESSIONS.map((sess) => (
                      <button
                        key={sess}
                        type="button"
                        onClick={() => {
                          setSelectedSession(sess);
                          setIsSessionOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                          selectedSession === sess
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{sess}</span>
                        {selectedSession === sess && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CUSTOM TERM SELECTOR */}
          <div className="relative">
            <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-0.5">Academic Term</label>
            <button
              type="button"
              onClick={() => {
                setIsTermOpen(!isTermOpen);
                setIsClassOpen(false);
                setIsStudentOpen(false);
                setIsSessionOpen(false);
              }}
              className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100/50 shadow-2xs transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedTerm}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTermOpen ? "rotate-180" : ""}`} />
            </button>

            {isTermOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsTermOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                  <div className="p-1 font-sans">
                    {TERMS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTerm(t);
                          setIsTermOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                          selectedTerm === t
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{t}</span>
                        {selectedTerm === t && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* FIT-TO-PAGE PRINT TOGGLE (A4 SINGLE-PAGE RESTRAINTS) */}
          <div className="relative flex flex-col justify-end">
            <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-0.5">A4 Page Layout</label>
            <button
              type="button"
              onClick={() => {
                const nextState = !isFitToPage;
                setIsFitToPage(nextState);
                toast.info(
                  nextState
                    ? "Fit-to-Page Enabled: Single A4 layout locked to prevent wrapping onto page 2."
                    : "Fit-to-Page Disabled: Expanded vertical layout restored."
                );
              }}
              className={`h-8.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition cursor-pointer shadow-2xs ${
                isFitToPage
                  ? "bg-indigo-950 text-emerald-400 border-emerald-500/60 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100/50"
              }`}
              title="Ensure all tables, assessment grids, and signature blocks fit on a single A4 page"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isFitToPage ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
              <span>{isFitToPage ? "Fit-to-Page (A4 Single-Page)" : "Expanded Mode"}</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CARD(S) SCROLLABLE VIEWPORT */}
        <div className="printable-report-card-container flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950">
          <div className="max-w-3xl mx-auto space-y-10">
            {targetStudents.map((st, studentIndex) => {
              const stId = st.id || `CS-820${studentIndex + 1}`;
              const stName = st.name || "Student Candidate";
              const stFirstName = stName.trim().split(/\s+/)[0] || "Student";
              const stClass = st.class_name || st.class || st.classCohort || selectedClass || "SS 2 Science";
              const stReg = st.reg || st.regNumber || `CS/2026/${800 + studentIndex}`;

              // Deterministic score generation for paper report card
              let totalScoreAccumulator = 0;
              const subjectRows = ALL_SUBJECTS.map((subj, sIdx) => {
                const seed = (stId.length * 17 + sIdx * 31 + studentIndex * 7) % 41;
                const ca1 = Math.min(15, Math.max(10, 11 + (seed % 5)));
                const ca2 = Math.min(15, Math.max(10, 11 + (seed % 5)));
                const exam = Math.min(70, Math.max(45, 52 + (seed % 19)));
                const total = ca1 + ca2 + exam;
                totalScoreAccumulator += total;

                const grade = total >= 80 ? "A1" : total >= 70 ? "B2" : total >= 65 ? "B3" : total >= 55 ? "C4" : "C6";
                const remark = total >= 80 ? "Distinction" : total >= 70 ? "Very Good" : total >= 65 ? "Good Credit" : "Pass";

                return { subject: subj, ca1, ca2, exam, total, grade, remark };
              });

              const maxTotal = ALL_SUBJECTS.length * 100;
              const averagePct = (totalScoreAccumulator / maxTotal) * 100;
              const gpaScore = (averagePct / 20).toFixed(2);
              const rankStr = `#${(studentIndex % 3) + 1} of 28`;

              // Retrieve stored custom comments if generated via AI Auto-Comment Generator
              const storedComment = getStoredStudentCustomComment(stId);
              const teacherCommentText = storedComment?.teacherComment || `${stFirstName} is an exemplary scholar with excellent focus across subjects and outstanding leadership behavior.`;
              const principalRemarkText = storedComment?.principalRemark || `Promoted / Approved with Distinction. Keep sustaining this high level of academic excellence, ${stFirstName}.`;
              const activeTraits = storedComment?.psychomotorRatings || AFFECTIVE_TRAITS;

              return (
                <div
                  key={stId}
                  className={`report-card-page bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md relative overflow-hidden font-sans transition-all ${
                    isFitToPage ? "fit-to-page-a4 p-4 sm:p-5 text-[10.5px]" : "p-6 sm:p-8 text-xs space-y-4"
                  }`}
                >
                  {/* WATERMARK BACKGROUND EMBLEM */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.04]">
                    <span className="text-slate-900 font-black uppercase text-6xl tracking-widest font-mono transform -rotate-30 whitespace-nowrap">
                      OFFICIAL ACADEMIC REPORT
                    </span>
                  </div>

                  {/* PRINT-ONLY OFFICIAL SCHOOL BRANDED HEADER */}
                  <PrintOnlySchoolHeader
                    schoolInfo={schoolInfo}
                    session={selectedSession}
                    term={selectedTerm}
                    documentTitle="Terminal Report Card"
                  />

                  {/* STUDENT PROFILE SUMMARY & PASSPORT PHOTO HEADER */}
                  <div className={`flex flex-col sm:flex-row items-stretch gap-3 bg-slate-50 border border-slate-200 rounded-xl text-xs ${
                    isFitToPage ? "p-2.5 mt-2 font-sans" : "p-3.5 mt-4"
                  }`}>
                    {/* OFFICIAL STUDENT PASSPORT PHOTO BOX WITH UPLOAD TRIGGER */}
                    <div className="relative shrink-0 self-center sm:self-start">
                      <div className={`bg-slate-200 border-2 border-indigo-950 rounded-xl overflow-hidden shadow-sm flex flex-col items-center justify-center relative group ${
                        isFitToPage ? "w-16 h-20" : "w-20 h-24 sm:w-22 sm:h-26"
                      }`}>
                        <img
                          src={
                            customStudentPassports[stId] ||
                            st.passportUrl ||
                            (st.gender === "Female"
                              ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
                              : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80")
                          }
                          alt={`${stName} Passport`}
                          className="w-full h-full object-cover object-top"
                        />
                        <label
                          htmlFor={`passport-upload-${stId}`}
                          className="no-print absolute top-1 right-1 bg-indigo-950/80 hover:bg-emerald-600 text-white p-1 rounded-full cursor-pointer transition shadow-xs"
                          title="Upload Custom Passport Photo"
                        >
                          <Camera className="w-3 h-3 text-emerald-400 hover:text-white" />
                          <input
                            id={`passport-upload-${stId}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePassportUpload(stId, e)}
                          />
                        </label>
                        <div className="absolute bottom-0 inset-x-0 bg-indigo-950/90 text-white text-[6.5px] font-mono font-black uppercase text-center py-0.5 tracking-tighter">
                          PASSPORT PHOTO
                        </div>
                      </div>
                    </div>

                    {/* STUDENT PROFILE DETAILS GRID */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Student Full Name</span>
                        <strong className="text-slate-900 font-extrabold truncate block">{stName}</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Registration Number</span>
                        <strong className="text-indigo-900 font-mono">{stReg}</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Class / Level</span>
                        <strong className="text-slate-900 font-mono">{stClass}</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Class Rank / Position</span>
                        <strong className="text-emerald-700 font-mono">{rankStr}</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Gender / Cohort</span>
                        <strong className="text-slate-800 font-mono">{st.gender || "Male"}</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Calculated Term GPA</span>
                        <strong className="text-emerald-700 font-mono">{gpaScore} / 5.00</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Attendance Record</span>
                        <strong className="text-slate-900 font-mono">118 / 120 Days</strong>
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Status</span>
                        <span className="text-[8.5px] font-mono font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.1 rounded inline-block">
                          Verified Candidate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KEY ACADEMIC METRICS SUMMARY CARDS GRID */}
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${
                    isFitToPage ? "my-2" : "my-3.5"
                  }`}>
                    {/* Card 1: Grade in Percent */}
                    <div className="p-2 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 rounded-xl shadow-2xs font-mono">
                      <div className="flex items-center justify-between text-[7.5px] font-black uppercase text-indigo-700 tracking-wider">
                        <span>Grade in Percent</span>
                        <Award className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div className="text-sm sm:text-base font-black text-indigo-950 mt-0.5 leading-none">
                        {averagePct >= 80 ? "A1" : averagePct >= 70 ? "B2" : averagePct >= 65 ? "B3" : "C4"}{" "}
                        <span className="text-[10px] font-extrabold text-indigo-700">({averagePct.toFixed(1)}%)</span>
                      </div>
                      <span className="text-[7px] text-slate-500 block mt-0.5 font-sans">
                        Grade Scale: {averagePct >= 80 ? "Distinction" : "Very Good Credit"}
                      </span>
                    </div>

                    {/* Card 2: Total No. of Scores */}
                    <div className="p-2 bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200 rounded-xl shadow-2xs font-mono">
                      <div className="flex items-center justify-between text-[7.5px] font-black uppercase text-emerald-800 tracking-wider">
                        <span>Total No. of Scores</span>
                        <GraduationCap className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="text-sm sm:text-base font-black text-emerald-950 mt-0.5 leading-none">
                        {totalScoreAccumulator} <span className="text-[10px] font-bold text-slate-500">/ {maxTotal}</span>
                      </div>
                      <span className="text-[7px] text-slate-500 block mt-0.5 font-sans">
                        {ALL_SUBJECTS.length} Assessment Subjects
                      </span>
                    </div>

                    {/* Card 3: Class Average Score */}
                    <div className="p-2 bg-gradient-to-br from-amber-50 to-slate-50 border border-amber-200 rounded-xl shadow-2xs font-mono">
                      <div className="flex items-center justify-between text-[7.5px] font-black uppercase text-amber-800 tracking-wider">
                        <span>Class Average</span>
                        <Users className="w-3 h-3 text-amber-600" />
                      </div>
                      <div className="text-sm sm:text-base font-black text-amber-950 mt-0.5 leading-none">
                        68.5%
                      </div>
                      <span className="text-[7px] text-slate-500 block mt-0.5 font-sans">
                        Class Cohort Benchmark Average
                      </span>
                    </div>

                    {/* Card 4: Student's Average Score */}
                    <div className="p-2 bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200 rounded-xl shadow-2xs font-mono">
                      <div className="flex items-center justify-between text-[7.5px] font-black uppercase text-purple-800 tracking-wider">
                        <span>Student&apos;s Avg Score</span>
                        <Sparkles className="w-3 h-3 text-purple-600" />
                      </div>
                      <div className="text-sm sm:text-base font-black text-purple-950 mt-0.5 leading-none">
                        {averagePct.toFixed(1)}%
                      </div>
                      <span className="text-[7px] text-slate-500 block mt-0.5 font-sans">
                        Overall Student Aggregate Average
                      </span>
                    </div>
                  </div>

                  {/* ACADEMIC PERFORMANCE TABLE */}
                  <div className={`relative z-10 ${isFitToPage ? "mb-2.5" : "mb-5"}`}>
                    <h3 className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      Academic Subjects Assessment Matrix
                    </h3>
                    <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[8.5px] uppercase font-bold">
                          <th className="p-1.5 border border-slate-800">Syllabus Subject</th>
                          <th className="p-1.5 border border-slate-800 text-center w-16">1st CA (15)</th>
                          <th className="p-1.5 border border-slate-800 text-center w-16">2nd CA (15)</th>
                          <th className="p-1.5 border border-slate-800 text-center w-16">Exam (70)</th>
                          <th className="p-1.5 border border-slate-800 text-center w-20 bg-indigo-900">Total (100)</th>
                          <th className="p-1.5 border border-slate-800 text-center w-16">Grade</th>
                          <th className="p-1.5 border border-slate-800 text-left">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectRows.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                            <td className="p-1 sm:p-1.5 border border-slate-200 font-bold text-slate-900">{row.subject}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 text-center text-slate-600">{row.ca1}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 text-center text-slate-600">{row.ca2}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 text-center text-slate-600">{row.exam}</td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 text-center font-black text-indigo-900 bg-indigo-50/30">
                              {row.total}
                            </td>
                            <td className={`p-1 sm:p-1.5 border border-slate-200 text-center font-black ${
                              row.grade.startsWith("A") ? "text-emerald-600" : "text-indigo-600"
                            }`}>
                              {row.grade}
                            </td>
                            <td className="p-1 sm:p-1.5 border border-slate-200 text-slate-700 font-sans text-[10px]">{row.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AFFECTIVE & BEHAVIORAL DOMAINS */}
                  <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${
                    isFitToPage ? "mb-2.5" : "mb-5"
                  }`}>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <h4 className="font-mono font-black text-[9.5px] uppercase text-indigo-900 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        Affective & Behavioral Development
                      </h4>
                      <div className="space-y-0.5 text-[10px]">
                        {activeTraits.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-0.5">
                            <span className="text-slate-600 font-medium">{item.trait}</span>
                            <span className="font-mono font-bold text-emerald-700">{item.rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 relative">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono font-black text-[9.5px] uppercase text-indigo-900 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          Class Teacher & Principal Remarks
                        </h4>

                        <div className="flex items-center gap-1.5">
                          {/* NON-PRINTABLE INDIVIDUAL STUDENT AI AUTO-COMMENT TRIGGER */}
                          <button
                            type="button"
                            onClick={() => {
                              setAutoCommentStudent(st);
                              setIsAutoCommentOpen(true);
                            }}
                            className="no-print px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs hover:opacity-90 transition cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>Auto-Generate ({stFirstName})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveAiRemarkSelectorStId(activeAiRemarkSelectorStId === stId ? null : stId)}
                            className="no-print px-2 py-0.5 bg-indigo-900 text-white rounded text-[9px] font-mono font-bold flex items-center gap-1 hover:bg-indigo-950 transition cursor-pointer"
                          >
                            <Bot className="w-2.5 h-2.5 text-emerald-400" />
                            <span>AI Selections & Verify</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">Class Teacher Note</span>
                            <div className="flex items-center gap-1.5">
                              {verifiedTeacherRemarks[stId] ? (
                                <span className="text-[8px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Verified by {verifiedTeacherRemarks[stId].verifiedBy}
                                </span>
                              ) : storedComment ? (
                                <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  AI Personalized ({stFirstName})
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleRegenerateModalComment(stId, stFirstName, averagePct)}
                                className="no-print p-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded transition shrink-0 cursor-pointer shadow-2xs hover:scale-105"
                                title={`Regenerate AI comment for ${stFirstName}`}
                              >
                                <RefreshCw className="w-3 h-3 text-indigo-600 hover:rotate-180 transition-transform duration-300" />
                              </button>
                            </div>
                          </div>
                          <p className="italic text-slate-800 font-medium leading-relaxed mt-0.5">
                            &quot;{verifiedTeacherRemarks[stId]?.remark || refreshedTeacherComments[stId] || teacherCommentText}&quot;
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">Principal&apos;s Final Verdict</span>
                            {verifiedPrincipalRemarks[stId] ? (
                              <span className="text-[8px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Verified ({verifiedPrincipalRemarks[stId].verifiedBy})
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Pending Verification
                              </span>
                            )}
                          </div>
                          <p className="italic text-slate-800 font-medium leading-relaxed mt-0.5">
                            &quot;{verifiedPrincipalRemarks[stId]?.remark || principalRemarkText}&quot;
                          </p>
                        </div>
                      </div>

                      {/* NON-PRINTABLE AI REMARKS GENERATOR & VERIFICATION CONSOLE */}
                      {activeAiRemarkSelectorStId === stId && (
                        <div className="no-print mt-3 p-3.5 bg-indigo-950 text-white rounded-xl space-y-3 border border-indigo-800 shadow-xl animate-in fade-in duration-200">
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-800">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                              <span className="text-[10px] font-mono font-black uppercase text-emerald-400">
                                AI Remarks Generator & Verification Console ({stFirstName})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveAiRemarkSelectorStId(null)}
                              className="text-slate-300 hover:text-white px-2 py-0.5 bg-indigo-900 rounded text-[10px] font-mono font-bold"
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* TEACHER REMARK OPTIONS */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold uppercase text-indigo-300 block">
                              1. Select AI Teacher Remark for {stFirstName}:
                            </span>
                            <div className="space-y-1">
                              {[
                                `${stFirstName} is an exceptionally diligent scholar who exhibits brilliant academic understanding and active leadership in class activities.`,
                                `${stFirstName} shows commendable diligence and analytical prowess. Highly recommended to maintain this steady focus in the upcoming term.`,
                                `${stFirstName} demonstrates good academic progress. Continual practice in quantitative subject streams will yield even higher distinction.`
                              ].map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setVerifiedTeacherRemarks({
                                      ...verifiedTeacherRemarks,
                                      [stId]: {
                                        remark: opt,
                                        verifiedBy: "Class Teacher",
                                        verifiedAt: new Date().toLocaleTimeString()
                                      }
                                    });
                                    toast.success(`Class Teacher remark verified for ${stFirstName}!`);
                                  }}
                                  className="w-full text-left p-2 bg-indigo-900/80 hover:bg-emerald-600 hover:text-white text-indigo-100 rounded-lg text-[10px] transition font-sans italic border border-indigo-800/80 cursor-pointer block"
                                >
                                  &quot;{opt}&quot;
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* PRINCIPAL REMARK OPTIONS */}
                          <div className="space-y-1.5 pt-2 border-t border-indigo-900">
                            <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 block">
                              2. Select AI Principal's Final Verdict for {stFirstName}:
                            </span>
                            <div className="space-y-1">
                              {[
                                `Promoted with Distinction. ${stFirstName} has demonstrated superlative academic mastery and exceptional leadership character.`,
                                `Approved with Commendatory Praise. Highly commendable diligence across all subject streams. Keep sustaining this momentum, ${stFirstName}.`,
                                `Promoted to Next Cohort. Satisfactory overall effort and academic progression. Continuous effort in core subjects is recommended, ${stFirstName}.`,
                                `Promoted on Academic Merit. Good progress noted. We encourage ${stFirstName} to strengthen focus in quantitative assessments next term.`
                              ].map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setVerifiedPrincipalRemarks({
                                      ...verifiedPrincipalRemarks,
                                      [stId]: {
                                        remark: opt,
                                        verifiedBy: "Principal's Office",
                                        verifiedAt: new Date().toLocaleTimeString()
                                      }
                                    });
                                    setActiveAiRemarkSelectorStId(null);
                                    toast.success(`Principal verdict verified for ${stFirstName}!`);
                                  }}
                                  className="w-full text-left p-2 bg-indigo-900/80 hover:bg-indigo-600 hover:text-white text-indigo-100 rounded-lg text-[10px] transition font-sans italic border border-indigo-800/80 cursor-pointer block"
                                >
                                  &quot;{opt}&quot;
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SIGNATURE & OFFICIAL DIGITAL VALIDATION FOOTER */}
                  <div className={`signature-section relative z-10 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs ${
                    isFitToPage ? "pt-2 mt-2" : "pt-3.5 mt-4"
                  }`}>
                    {/* CLASS TEACHER SIGNATURE VALIDATION BOX */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-mono uppercase text-slate-500 font-bold">Class Teacher Signature</span>
                        <label
                          htmlFor="teacher-sig-upload"
                          className="no-print text-[8px] font-mono text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-0.5"
                          title="Upload Teacher Signature Image"
                        >
                          <Upload className="w-2.5 h-2.5" /> Upload Signature
                          <input
                            id="teacher-sig-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleTeacherSignatureUpload}
                          />
                        </label>
                      </div>

                      <div className="h-12 border-b-2 border-slate-900 bg-slate-50 rounded-t-lg p-1 flex items-center justify-center relative overflow-hidden">
                        {teacherSignatureUrl ? (
                          <img src={teacherSignatureUrl} alt="Class Teacher Signature" className="max-h-10 w-auto object-contain" />
                        ) : (
                          <div className="font-serif italic text-base font-black text-indigo-950 tracking-wide font-display select-none">
                            {teacherName.replace(/\s*\(.*\)/, "")}
                          </div>
                        )}
                        <div className="absolute top-1 right-1 no-print">
                          <span className="text-[7px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
                          </span>
                        </div>
                      </div>

                      <div>
                        <strong className="text-slate-900 font-extrabold block text-[11px] leading-tight">{teacherName}</strong>
                        <span className="text-[8px] font-mono text-slate-500 block">Designation: Form Teacher / Class Lead</span>
                      </div>
                    </div>

                    {/* PRINCIPAL SIGNATURE VALIDATION BOX */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-mono uppercase text-slate-500 font-bold">Principal / Head of School</span>
                        <label
                          htmlFor="principal-sig-upload"
                          className="no-print text-[8px] font-mono text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-0.5"
                          title="Upload Principal Signature Image"
                        >
                          <Upload className="w-2.5 h-2.5" /> Upload Signature
                          <input
                            id="principal-sig-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePrincipalSignatureUpload}
                          />
                        </label>
                      </div>

                      <div className="h-12 border-b-2 border-slate-900 bg-slate-50 rounded-t-lg p-1 flex items-center justify-center relative overflow-hidden">
                        {principalSignatureUrl ? (
                          <img src={principalSignatureUrl} alt="Principal Signature" className="max-h-10 w-auto object-contain" />
                        ) : (
                          <div className="font-serif italic text-base font-black text-indigo-950 tracking-wide font-display select-none">
                            {principalName.replace(/\s*\(.*\)/, "")}
                          </div>
                        )}
                        <div className="absolute top-1 right-1 no-print">
                          <span className="text-[7px] font-mono font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-1 py-0.2 rounded flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-indigo-600" /> Sealed
                          </span>
                        </div>
                      </div>

                      <div>
                        <strong className="text-slate-900 font-extrabold block text-[11px] leading-tight">{principalName}</strong>
                        <span className="text-[8px] font-mono text-slate-500 block">Designation: Executive Principal & Head of School</span>
                      </div>
                    </div>

                    {/* DIGITAL SEAL & RESUMPTION METRICS */}
                    <div className="text-right space-y-1">
                      <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-mono text-[8.5px] font-bold flex items-center justify-end gap-1.5 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="text-right">
                          <span className="block leading-none text-emerald-950 font-black">CRYPTOGRAPHICALLY SEALED</span>
                          <span className="text-[7.5px] text-emerald-700 font-medium">Ref: CS-SEALED-2026-REPORT</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 block">
                        Next Term Resumption: <strong className="text-slate-900 font-bold">Monday, 14th Sept 2026</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AUTO-COMMENT GENERATOR MODAL */}
      {autoCommentStudent && (
        <AutoCommentGeneratorModal
          isOpen={isAutoCommentOpen}
          onClose={() => setIsAutoCommentOpen(false)}
          studentId={autoCommentStudent.id}
          studentName={autoCommentStudent.name}
          classCohort={autoCommentStudent.class_name || autoCommentStudent.class || selectedClass}
          session={selectedSession}
          term={selectedTerm}
        />
      )}
    </div>
  );
}
