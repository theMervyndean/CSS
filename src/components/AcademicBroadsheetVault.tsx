import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  Check,
  Sparkles,
  GraduationCap,
  Award,
  TrendingUp,
  Send,
  Clock,
  Layers,
  Table,
  FileText,
  FileJson,
  X,
  Info,
  ShieldCheck,
  BookOpen,
  User,
  Zap,
  BarChart2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  TrendingDown,
  SlidersHorizontal,
  Calendar,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckSquare,
  Square,
  MessageSquare,
  Mail,
  Tag,
  Users,
  Radio,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { StudentResultDossier } from "./StudentResultDossier";
import { ReportCardPrintPreviewModal } from "./ReportCardPrintPreviewModal";
import { GradingSystemModal } from "./GradingSystemModal";
import { AtRiskInterventionModal, getStoredStudentIntervention, getAllStudentInterventions, StudentInterventionRecord } from "./AtRiskInterventionModal";
import { mockBillingRecords } from "../mockData";

interface AcademicBroadsheetVaultProps {
  currentProfile: UserProfile;
  studentsList?: any[];
  onOpenReportCard?: (student: any) => void;
  className?: string;
}

interface StudentDossierRecord {
  studentId: string;
  studentName: string;
  regNumber: string;
  classCohort: string;
  session: string;
  term: string;
  subjectScores: Record<string, { ca1: number; ca2: number; midTerm: number; exam: number; total: number; grade: string; position: number }>;
  totalAggregateScore: number;
  maxPossibleScore: number;
  averagePercentage: number;
  classRank: number;
  totalStudentsInClass: number;
  termGpa: number;
  teacherRemark: string;
  principalRemark: string;
  dossierStatus: "approved" | "pending_teacher_request" | "draft";
}

// Sample classes
const AVAILABLE_CLASSES = [
  "All Classes",
  "Primary 5",
  "Primary 4",
  "Primary 3",
  "Primary 2",
  "Primary 1",
  "Nursery 2",
  "Nursery 1",
  "Creche",
  "Secondary 1",
  "Secondary 2",
  "Secondary 3"
];

// Academic Sessions
const ACADEMIC_SESSIONS = ["2025/2026 (Current)", "2024/2025", "2023/2024"];

// Terms
const ACADEMIC_TERMS = ["1st Term", "2nd Term", "3rd Term"];

// Default Subject Curriculum
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

// Seed Students Data
const DEFAULT_STUDENT_SEED = [
  { id: "CS-8201", name: "Chinedu Okeke", reg: "CS/2025/001", class: "Primary 5" },
  { id: "CS-8202", name: "Amina Yusuf", reg: "CS/2025/002", class: "Primary 5" },
  { id: "CS-8203", name: "Emeka Adebayo", reg: "CS/2025/003", class: "Primary 5" },
  { id: "CS-8204", name: "Fatima Danjuma", reg: "CS/2025/004", class: "Primary 5" },
  { id: "CS-8205", name: "Kelechi Nnamdi", reg: "CS/2025/005", class: "Primary 5" },
  { id: "CS-8206", name: "Blessing Eze", reg: "CS/2025/006", class: "Primary 5" },
  { id: "CS-8207", name: "Tunde Bakare", reg: "CS/2025/007", class: "Primary 5" },
  { id: "CS-8208", name: "Zainab Ibrahim", reg: "CS/2025/008", class: "Primary 5" },
  { id: "CS-8209", name: "David Ojo", reg: "CS/2025/009", class: "Primary 5" },
  { id: "CS-8210", name: "Chisom Igwe", reg: "CS/2025/010", class: "Primary 5" },
  { id: "CS-8211", name: "Abubakar Bello", reg: "CS/2025/011", class: "Primary 5" },
  { id: "CS-8212", name: "Ngozi Anya", reg: "CS/2025/012", class: "Primary 5" },
  { id: "CS-8213", name: "Tariq Usman", reg: "CS/2025/013", class: "Primary 5" },
  { id: "CS-8214", name: "Joy Nwosu", reg: "CS/2025/014", class: "Primary 5" },
  { id: "CS-8215", name: "Samuel Alabi", reg: "CS/2025/015", class: "Primary 5" },
  // Additional Cohort Seeds
  { id: "CS-8216", name: "Miracle Ogbonna", reg: "CS/2025/016", class: "Primary 4" },
  { id: "CS-8217", name: "Yakubu Mohammed", reg: "CS/2025/017", class: "Primary 4" },
  { id: "CS-8218", name: "Grace Chukwu", reg: "CS/2025/018", class: "Secondary 1" },
  { id: "CS-8219", name: "Ibrahim Lawal", reg: "CS/2025/019", class: "Secondary 2" },
  { id: "CS-8220", name: "Esther Kalu", reg: "CS/2025/020", class: "Nursery 2" }
];

export function AcademicBroadsheetVault({
  currentProfile,
  studentsList = [],
  onOpenReportCard,
  className = ""
}: AcademicBroadsheetVaultProps) {
  // Navigation & Filter States
  const [activeSession, setActiveSession] = useState<string>("2025/2026 (Current)");
  const [activeTerm, setActiveTerm] = useState<string>("1st Term");
  const [reportType, setReportType] = useState<"full_term" | "half_term">("full_term");
  const [selectedClass, setSelectedClass] = useState<string>("Primary 5");
  const [viewMode, setViewMode] = useState<"class_broadsheet" | "student_dossier" | "master_comprehensive">("class_broadsheet");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("CS-8201");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scoreRandomSeed, setScoreRandomSeed] = useState<number>(1);

  // Configurable At-Risk Threshold & Intervention States
  const [atRiskThreshold, setAtRiskThreshold] = useState<number>(10);
  const [isThresholdOpen, setIsThresholdOpen] = useState<boolean>(false);
  const [showAtRiskOnly, setShowAtRiskOnly] = useState<boolean>(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState<boolean>(false);
  const [interventionStudent, setInterventionStudent] = useState<any>(null);
  const [interventionsVersion, setInterventionsVersion] = useState<number>(0);

  useEffect(() => {
    const handleInterventionUpdate = () => {
      setInterventionsVersion((v) => v + 1);
    };
    window.addEventListener("cs-intervention-updated", handleInterventionUpdate);
    return () => window.removeEventListener("cs-intervention-updated", handleInterventionUpdate);
  }, []);

  // Bulk Selection & Batch Action States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBatchNotifyModalOpen, setIsBatchNotifyModalOpen] = useState<boolean>(false);
  const [isBatchStatusModalOpen, setIsBatchStatusModalOpen] = useState<boolean>(false);
  const [isBatchReportModalOpen, setIsBatchReportModalOpen] = useState<boolean>(false);

  // Student Status Overrides persisted in localStorage
  const [studentStatusOverrides, setStudentStatusOverrides] = useState<Record<string, { status: string; statusLabel: string; remark?: string; updatedAt: string }>>(() => {
    try {
      const saved = localStorage.getItem("CS_STUDENT_STATUS_OVERRIDES");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const updateStudentStatuses = (studentIds: string[], newStatusKey: string, newStatusLabel: string, bulkRemark?: string) => {
    setStudentStatusOverrides((prev) => {
      const next = { ...prev };
      const now = new Date().toISOString();
      studentIds.forEach((id) => {
        next[id] = {
          status: newStatusKey,
          statusLabel: newStatusLabel,
          remark: bulkRemark !== undefined ? bulkRemark : (prev[id]?.remark || ""),
          updatedAt: now
        };
      });
      try {
        localStorage.setItem("CS_STUDENT_STATUS_OVERRIDES", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Batch Notification Modal internal states
  const [batchNotifyChannel, setBatchNotifyChannel] = useState<string>("SMS");
  const [batchNotifyPreset, setBatchNotifyPreset] = useState<string>("RESULTS");
  const [batchNotifySubject, setBatchNotifySubject] = useState<string>(`Official Result Release - ${activeTerm} ${activeSession}`);
  const [batchNotifyBody, setBatchNotifyBody] = useState<string>(
    `Dear Parent, official ${activeTerm} results for {student_name} ({class}) are now published. Overall Score: {average_percentage}%, GPA: {gpa}, Rank: #{rank}. Login to Corner Streams portal to view complete dossier.`
  );

  const applyNotifyPreset = (presetKey: string) => {
    setBatchNotifyPreset(presetKey);
    if (presetKey === "RESULTS") {
      setBatchNotifySubject(`Official Result Release - ${activeTerm} ${activeSession}`);
      setBatchNotifyBody(`Dear Parent, official ${activeTerm} results for {student_name} ({class}) are now published. Overall Score: {average_percentage}%, GPA: {gpa}, Rank: #{rank}. Login to Corner Streams portal to view complete dossier.`);
    } else if (presetKey === "AT_RISK") {
      setBatchNotifySubject(`Academic Intervention Advisory - ${activeTerm}`);
      setBatchNotifyBody(`Dear Parent, an academic progress advisory has been generated for {student_name} ({class}). Our educators have formulated a targeted intervention plan to support performance.`);
    } else if (presetKey === "FEE_REMINDER") {
      setBatchNotifySubject(`School Fee Ledger Notice - ${activeSession}`);
      setBatchNotifyBody(`Dear Parent, this is an administrative update regarding the term ledger for {student_name} ({class}). Please review ledger clearance on the parent portal.`);
    } else {
      setBatchNotifySubject(`Corner Streams School Notice`);
      setBatchNotifyBody(`Dear Parent of {student_name}, ...`);
    }
  };

  const evaluateSampleNotifyText = (rawText: string, sampleRow?: any) => {
    if (!sampleRow) return rawText;
    return rawText
      .replace(/\{student_name\}/g, sampleRow.studentName)
      .replace(/\{class\}/g, sampleRow.classCohort)
      .replace(/\{average_percentage\}/g, `${sampleRow.averagePercentage}`)
      .replace(/\{gpa\}/g, `${sampleRow.termGpa}`)
      .replace(/\{rank\}/g, `${sampleRow.classRank}`);
  };

  const handleExecuteBatchNotify = () => {
    if (selectedStudentIds.length === 0) return;
    toast.success(`Dispatched ${batchNotifyChannel} notification to parents of ${selectedStudentIds.length} student(s)!`);
    try {
      const logs = JSON.parse(localStorage.getItem("CS_COMMUNICATION_LOGS") || "[]");
      logs.push({
        id: `LOG-${Date.now()}`,
        channel: batchNotifyChannel,
        subject: batchNotifySubject,
        recipientsCount: selectedStudentIds.length,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("CS_COMMUNICATION_LOGS", JSON.stringify(logs));
    } catch (e) {}
    setIsBatchNotifyModalOpen(false);
  };

  // Batch Status Modal internal states
  const [batchStatusKey, setBatchStatusKey] = useState<string>("CLEARED");
  const [batchStatusLabel, setBatchStatusLabel] = useState<string>("Cleared & Official");
  const [batchStatusRemark, setBatchStatusRemark] = useState<string>("");

  // Dynamic Regenerate AI Remarks state for Broadsheet matrix
  const [customBroadsheetRemarks, setCustomBroadsheetRemarks] = useState<Record<string, string>>({});

  const handleRegenerateBroadsheetRemark = (studentId: string, studentName: string, avgPct: number) => {
    const remarkPools = {
      high: [
        "Outstanding academic diligence & exemplary conceptual mastery shown.",
        "Brilliant scholar exhibiting commendable academic leadership.",
        "Top-tier distinction; maintains exceptional academic consistency.",
        "Superlative performance across all academic subject streams."
      ],
      medium: [
        "Commendable performance showing strong subject understanding.",
        "Impressive diligence and analytical capability in class tasks.",
        "Very good progress with steady academic focus.",
        "Solid achievement; demonstrates high academic potential."
      ],
      low: [
        "Requires additional study focus and targeted concept practice.",
        "Encouraged to revise foundational topics with extra guidance.",
        "Needs disciplined daily study to elevate overall academic grade.",
        "Immediate academic intervention & parental consultation advised."
      ]
    };

    let pool = remarkPools.medium;
    if (avgPct >= 80) pool = remarkPools.high;
    else if (avgPct < 65) pool = remarkPools.low;

    const currentRemark = customBroadsheetRemarks[studentId] || (avgPct >= 80 ? "Outstanding academic diligence shown." : avgPct >= 65 ? "Commendable performance." : "Requires study focus.");
    const options = pool.filter((r) => r !== currentRemark);
    const nextRemark = options[Math.floor(Math.random() * options.length)] || pool[0];

    setCustomBroadsheetRemarks((prev) => ({
      ...prev,
      [studentId]: nextRemark
    }));

    toast.success(`Refreshed AI remark for ${studentName}!`);
  };

  const handleExecuteBatchStatusUpdate = () => {
    if (selectedStudentIds.length === 0) return;
    updateStudentStatuses(selectedStudentIds, batchStatusKey, batchStatusLabel, batchStatusRemark);
    toast.success(`Updated academic status to "${batchStatusLabel}" for ${selectedStudentIds.length} student(s)!`);
    setIsBatchStatusModalOpen(false);
  };

  const handleExecutePdfBatchPackage = () => {
    const selectedRows = filteredBroadsheetRows.filter((r) => selectedStudentIds.includes(r.studentId));
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Compiling PDF report cards for ${selectedRows.length} student(s)...`,
        success: `Downloaded batch PDF report cards package (${selectedRows.length} pages)!`,
        error: "Failed to build PDF package"
      }
    );
    setIsBatchReportModalOpen(false);
  };

  // Custom Select Dropdown Toggles per AGENTS.md rules
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("ALL");
  const [isGradeSelectOpen, setIsGradeSelectOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isTermOpen, setIsTermOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTopExportOpen, setIsTopExportOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

  // Broadsheet Table Sorting States
  type SortField = "rank" | "name" | "totalGrade" | "regNumber" | "averagePercentage" | "gpa";
  type SortOrder = "asc" | "desc";

  const [sortBy, setSortBy] = useState<SortField>("rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [broadsheetAnnouncement, setBroadsheetAnnouncement] = useState<string>("");

  const getSortFieldLabel = (field: SortField) => {
    switch (field) {
      case "rank": return "Position / Rank";
      case "name": return "Student Name";
      case "totalGrade": return "Total Grade / Score";
      case "regNumber": return "Registration Number";
      case "averagePercentage": return "Average Percentage";
      case "gpa": return "GPA";
      default: return field;
    }
  };

  const handleToggleSort = (field: SortField) => {
    if (sortBy === field) {
      const nextOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(nextOrder);
      const msg = `Broadsheet sorted by ${getSortFieldLabel(field)} in ${nextOrder === "asc" ? "ascending" : "descending"} order`;
      setBroadsheetAnnouncement(msg);
      toast.info(`Sorting: ${getSortFieldLabel(field)} (${nextOrder === "asc" ? "Ascending ↑" : "Descending ↓"})`);
    } else {
      setSortBy(field);
      const defaultOrder = (field === "totalGrade" || field === "averagePercentage" || field === "gpa") ? "desc" : "asc";
      setSortOrder(defaultOrder);
      const msg = `Broadsheet sorted by ${getSortFieldLabel(field)} in ${defaultOrder === "asc" ? "ascending" : "descending"} order`;
      setBroadsheetAnnouncement(msg);
      toast.info(`Sorted by ${getSortFieldLabel(field)} (${defaultOrder === "asc" ? "Ascending ↑" : "Descending ↓"})`);
    }
  };

  // Digital Reports Pro Tier State
  const [isDigitalProActive, setIsDigitalProActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem("CS_DIGITAL_REPORTS_PRO_ACTIVE") === "true";
    } catch (e) {
      return false;
    }
  });
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  const toggleDigitalProActive = () => {
    const nextVal = !isDigitalProActive;
    setIsDigitalProActive(nextVal);
    localStorage.setItem("CS_DIGITAL_REPORTS_PRO_ACTIVE", String(nextVal));
    if (nextVal) {
      toast.success("✨ Digital Reports Pro Unlocked! Full Cross-Term Improvement Analytics & Dossier Vault Enabled.");
    } else {
      toast.info("Digital Reports Pro mode locked.");
    }
  };

  // Teacher Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");

  // Report Card Print Preview Modal State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printPreviewStudentId, setPrintPreviewStudentId] = useState("ALL");
  const [pendingRequests, setPendingRequests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("CS_BROADSHEET_DOSSIER_REQUESTS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load or synthesize broadsheet database (Always ensure at least 15 test students for Primary 5)
  const activeStudents = useMemo(() => {
    if (studentsList && studentsList.length >= 15) return studentsList;
    return DEFAULT_STUDENT_SEED;
  }, [studentsList]);

  // Handle Populate Random 15 Student Scores
  const handlePopulateRandom15Scores = () => {
    setScoreRandomSeed((prev) => prev + 1);
    toast.success("Randomized scores & ranks generated across all 15 test students!");
  };

  // Generate deterministic score metrics for every student across subjects based on filters
  const broadsheetData = useMemo(() => {
    // Filter students by class if class_broadsheet or selected class or active search query
    const classStudents = activeStudents.filter((st) => {
      if (viewMode === "master_comprehensive" || selectedClass === "All Classes" || searchQuery.trim() !== "") return true;
      const stClass = st.class_name || st.class || "Primary 5";
      return stClass.toLowerCase().includes(selectedClass.toLowerCase());
    });

    const rows = classStudents.map((st, idx) => {
      const stId = st.id || `ST-${idx + 1}`;
      const stName = st.name || st.fullName || "Student Name";
      const regNo = st.reg || st.regNumber || `CS/2025/0${idx + 1}`;
      const stClass = st.class_name || st.class || selectedClass;

      const subjectScores: Record<string, any> = {};
      let totalAccumulated = 0;

      ALL_SUBJECTS.forEach((subj, sIdx) => {
        // Dynamic pseudo-random seed based on student ID + subject index + term + scoreRandomSeed
        const seed = (stId.length * 17 + sIdx * 31 + idx * 13 + scoreRandomSeed * 47 + (activeTerm === "1st Term" ? 5 : 12)) % 53;
        
        let ca1 = Math.min(15, Math.max(5, 8 + (seed % 8)));
        let ca2 = Math.min(15, Math.max(6, 9 + ((seed + 3) % 7)));
        let midTerm = Math.min(20, Math.max(10, 12 + ((seed + 5) % 9)));
        let exam = Math.min(50, Math.max(20, 28 + ((seed + 11) % 23)));

        if (reportType === "half_term") {
          // Half term scaled out of 100% (CA1 25% + CA2 25% + MidTerm 50%)
          const halfTotal = Math.round(((ca1 + ca2 + midTerm) / 50) * 100);
          const grade = halfTotal >= 80 ? "A1" : halfTotal >= 70 ? "B2" : halfTotal >= 60 ? "C4" : halfTotal >= 50 ? "P" : "F";
          subjectScores[subj] = {
            ca1,
            ca2,
            midTerm,
            exam: 0,
            total: halfTotal,
            grade,
            position: (idx % 3) + 1
          };
          totalAccumulated += halfTotal;
        } else {
          // Full term score out of 100
          const fullTotal = ca1 + ca2 + midTerm + exam;
          const grade = fullTotal >= 80 ? "A1" : fullTotal >= 70 ? "B2" : fullTotal >= 65 ? "B3" : fullTotal >= 55 ? "C4" : fullTotal >= 50 ? "C6" : "F9";
          subjectScores[subj] = {
            ca1,
            ca2,
            midTerm,
            exam,
            total: fullTotal,
            grade,
            position: (idx % 4) + 1
          };
          totalAccumulated += fullTotal;
        }
      });

      const maxPossible = ALL_SUBJECTS.length * 100;
      const averagePct = Math.round((totalAccumulated / maxPossible) * 100);
      const termGpa = Number((averagePct / 20).toFixed(2));

      // Term-over-term benchmark comparison
      const prevTermAvg = Math.max(45, Math.min(99, Math.round(averagePct + 3 + ((idx * 7) % 11) - 2)));
      const scoreDropDelta = Math.round((prevTermAvg - averagePct) * 10) / 10;
      const isAtRisk = scoreDropDelta >= atRiskThreshold;

      return {
        studentId: stId,
        studentName: stName,
        regNumber: regNo,
        classCohort: stClass,
        subjectScores,
        totalAggregateScore: totalAccumulated,
        maxPossibleScore: maxPossible,
        averagePercentage: averagePct,
        prevTermAvg,
        scoreDropDelta,
        isAtRisk,
        termGpa,
        classRank: 1, // calculated next
        teacherRemark: averagePct >= 80 ? "Outstanding academic diligence shown." : averagePct >= 65 ? "Commendable performance." : "Requires study focus.",
        rawStudent: st
      };
    });

    // Rank students by total aggregate score descending
    rows.sort((a, b) => b.totalAggregateScore - a.totalAggregateScore);
    rows.forEach((r, i) => {
      r.classRank = i + 1;
    });

    return rows;
  }, [activeStudents, selectedClass, activeTerm, reportType, viewMode, atRiskThreshold, interventionsVersion]);

  // Compute Grade distribution statistics across current term & broadsheet data
  const gradeStats = useMemo(() => {
    const countA1 = broadsheetData.filter((r) => r.averagePercentage >= 80).length;
    const countB = broadsheetData.filter((r) => r.averagePercentage >= 65 && r.averagePercentage < 80).length;
    const countC = broadsheetData.filter((r) => r.averagePercentage >= 50 && r.averagePercentage < 65).length;
    const countF = broadsheetData.filter((r) => r.averagePercentage < 50).length;
    return {
      countA1,
      countB,
      countC,
      countF,
      total: broadsheetData.length
    };
  }, [broadsheetData]);

  // Filter & Sort broadsheet rows by search query, grade tier, and sorting criteria
  const filteredBroadsheetRows = useMemo(() => {
    let rows = [...broadsheetData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.regNumber.toLowerCase().includes(q) ||
          r.classCohort.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          (r.rawStudent && (
            (r.rawStudent.id && String(r.rawStudent.id).toLowerCase().includes(q)) ||
            (r.rawStudent.name && String(r.rawStudent.name).toLowerCase().includes(q)) ||
            (r.rawStudent.reg && String(r.rawStudent.reg).toLowerCase().includes(q)) ||
            (r.rawStudent.class && String(r.rawStudent.class).toLowerCase().includes(q))
          ))
      );
    }

    if (showAtRiskOnly) {
      rows = rows.filter((r) => r.isAtRisk);
    }

    if (selectedGradeFilter !== "ALL") {
      rows = rows.filter((r) => {
        if (selectedGradeFilter === "A1") return r.averagePercentage >= 80;
        if (selectedGradeFilter === "B2_B3") return r.averagePercentage >= 65 && r.averagePercentage < 80;
        if (selectedGradeFilter === "C4_C6") return r.averagePercentage >= 50 && r.averagePercentage < 65;
        if (selectedGradeFilter === "F9") return r.averagePercentage < 50;
        return true;
      });
    }

    rows.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "rank") {
        comparison = a.classRank - b.classRank;
      } else if (sortBy === "name") {
        comparison = a.studentName.localeCompare(b.studentName);
      } else if (sortBy === "totalGrade") {
        comparison = a.totalAggregateScore - b.totalAggregateScore;
      } else if (sortBy === "regNumber") {
        comparison = a.regNumber.localeCompare(b.regNumber);
      } else if (sortBy === "averagePercentage") {
        comparison = a.averagePercentage - b.averagePercentage;
      } else if (sortBy === "gpa") {
        comparison = a.termGpa - b.termGpa;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [broadsheetData, searchQuery, selectedGradeFilter, sortBy, sortOrder]);

  // Selection helper states for Bulk Selection
  const isAllFilteredSelected = useMemo(() => {
    if (filteredBroadsheetRows.length === 0) return false;
    return filteredBroadsheetRows.every((r) => selectedStudentIds.includes(r.studentId));
  }, [filteredBroadsheetRows, selectedStudentIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredBroadsheetRows.length === 0) return false;
    const count = filteredBroadsheetRows.filter((r) => selectedStudentIds.includes(r.studentId)).length;
    return count > 0 && count < filteredBroadsheetRows.length;
  }, [filteredBroadsheetRows, selectedStudentIds]);

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredBroadsheetRows.map((r) => r.studentId));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const filteredIds = filteredBroadsheetRows.map((r) => r.studentId);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Handle Export Selected Rows to CSV
  const handleExportSelectedCsv = () => {
    const selectedRows = filteredBroadsheetRows.filter((r) => selectedStudentIds.includes(r.studentId));
    if (selectedRows.length === 0) {
      toast.error("No students selected for export.");
      return;
    }

    const headers = [
      "Position / Rank",
      "Registration Number",
      "Student Full Name",
      "Class Cohort",
      "Session",
      "Term Period",
      "Academic Status",
      ...ALL_SUBJECTS,
      "Total Aggregate Score",
      "Average %",
      "GPA (5.0 Scale)",
      "Teacher Remark"
    ];

    const rows = selectedRows.map((r) => {
      const statusObj = studentStatusOverrides[r.studentId];
      const statusStr = statusObj ? statusObj.statusLabel : (r.isAtRisk ? "At-Risk Flagged" : "Cleared & Official");
      const subjValues = ALL_SUBJECTS.map((subj) => `${r.subjectScores[subj]?.total || 0} (${r.subjectScores[subj]?.grade || "F"})`);
      return [
        `"Rank #${r.classRank}"`,
        `"${r.regNumber}"`,
        `"${r.studentName}"`,
        `"${r.classCohort}"`,
        `"${activeSession}"`,
        `"${activeTerm}"`,
        `"${statusStr}"`,
        ...subjValues.map((v) => `"${v}"`),
        `"${r.totalAggregateScore} / ${r.maxPossibleScore}"`,
        `"${r.averagePercentage}%"`,
        `"${r.termGpa}"`,
        `"${(statusObj?.remark || r.teacherRemark).replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClass = selectedClass.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `CornerStreams_Selected_${selectedRows.length}_Students_${safeClass}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedRows.length} selected student record(s) as CSV!`);
  };

  // Compute class metrics summary row
  const classSummaryMetrics = useMemo(() => {
    if (broadsheetData.length === 0) return {};

    const subjectSummaries: Record<string, { avg: number; highest: number; lowest: number }> = {};

    ALL_SUBJECTS.forEach((subj) => {
      const scores = broadsheetData.map((r) => r.subjectScores[subj]?.total || 0);
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / (scores.length || 1));
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);
      subjectSummaries[subj] = { avg, highest, lowest };
    });

    const classAvgPct = Math.round(
      broadsheetData.reduce((acc, curr) => acc + curr.averagePercentage, 0) / (broadsheetData.length || 1)
    );

    return {
      subjectSummaries,
      classAvgPct,
      topStudent: broadsheetData[0]?.studentName || "N/A",
      totalStudents: broadsheetData.length
    };
  }, [broadsheetData]);

  // Compute Cross-Term Student & Class Score Improvements (1st Term, 2nd Term, 3rd Term)
  const crossTermAnalytics = useMemo(() => {
    if (broadsheetData.length === 0) return { studentTrends: [], classProgression: { term1: 0, term2: 0, term3: 0, netClassDelta: 0 } };

    const studentTrends = broadsheetData.map((st, idx) => {
      // Deterministic synthetic 1st & 2nd term averages for cross-term tracking
      const baseAvg = st.averagePercentage;
      const term1Avg = Math.max(45, Math.min(98, Math.round(baseAvg - 5 + ((idx * 7) % 11) - 4)));
      const term2Avg = Math.max(48, Math.min(99, Math.round(baseAvg - 2 + ((idx * 3) % 7) - 2)));
      const term3Avg = baseAvg;

      const delta1to3 = term3Avg - term1Avg;
      const term1Rank = Math.min(broadsheetData.length, Math.max(1, st.classRank + ((idx % 3) - 1)));
      const term3Rank = st.classRank;

      return {
        studentId: st.studentId,
        studentName: st.studentName,
        regNumber: st.regNumber,
        term1Avg,
        term2Avg,
        term3Avg,
        delta1to3,
        term1Rank,
        term3Rank,
        isImproved: delta1to3 >= 0,
        psychomotorRating: st.averagePercentage >= 80 ? "Exemplary (5/5)" : st.averagePercentage >= 65 ? "Proficient (4/5)" : "Developing (3/5)"
      };
    });

    const classTerm1Avg = Math.round(studentTrends.reduce((a, b) => a + b.term1Avg, 0) / (studentTrends.length || 1));
    const classTerm2Avg = Math.round(studentTrends.reduce((a, b) => a + b.term2Avg, 0) / (studentTrends.length || 1));
    const classTerm3Avg = Math.round(studentTrends.reduce((a, b) => a + b.term3Avg, 0) / (studentTrends.length || 1));

    return {
      studentTrends,
      classProgression: {
        term1: classTerm1Avg,
        term2: classTerm2Avg,
        term3: classTerm3Avg,
        netClassDelta: classTerm3Avg - classTerm1Avg
      }
    };
  }, [broadsheetData]);

  // Chart Metric Mode & Custom Select State for Recharts Academic Improvement Visualization
  const [chartMetricMode, setChartMetricMode] = useState<"percentage" | "gpa">("percentage");
  const [isChartStudentOpen, setIsChartStudentOpen] = useState<boolean>(false);

  // Selected student trend record for Recharts visualization
  const activeChartStudentTrend = useMemo(() => {
    const found = crossTermAnalytics.studentTrends.find((s) => s.studentId === selectedStudentId);
    return found || crossTermAnalytics.studentTrends[0] || null;
  }, [crossTermAnalytics.studentTrends, selectedStudentId]);

  // Compute filtered grade cohort average across terms for chart comparison
  const filteredGradeGroupAnalytics = useMemo(() => {
    const group = crossTermAnalytics.studentTrends.filter((st) => {
      if (selectedGradeFilter === "ALL") return true;
      if (selectedGradeFilter === "A1") return st.term3Avg >= 80;
      if (selectedGradeFilter === "B2_B3") return st.term3Avg >= 65 && st.term3Avg < 80;
      if (selectedGradeFilter === "C4_C6") return st.term3Avg >= 50 && st.term3Avg < 65;
      if (selectedGradeFilter === "F9") return st.term3Avg < 50;
      return true;
    });

    if (group.length === 0) return { term1: 0, term2: 0, term3: 0, count: 0 };

    const term1 = Math.round(group.reduce((a, b) => a + b.term1Avg, 0) / group.length);
    const term2 = Math.round(group.reduce((a, b) => a + b.term2Avg, 0) / group.length);
    const term3 = Math.round(group.reduce((a, b) => a + b.term3Avg, 0) / group.length);

    return { term1, term2, term3, count: group.length };
  }, [crossTermAnalytics.studentTrends, selectedGradeFilter]);

  // Recharts Dataset for Term-over-Term Trend Plotting
  const rechartsAcademicTrendData = useMemo(() => {
    const isGpa = chartMetricMode === "gpa";
    const formatScore = (pct: number) => (isGpa ? Number((pct / 20).toFixed(2)) : pct);

    const classP = crossTermAnalytics.classProgression;
    const stT = activeChartStudentTrend;
    const grpP = filteredGradeGroupAnalytics;

    const topT1 = Math.max(...crossTermAnalytics.studentTrends.map((s) => s.term1Avg), 85);
    const topT2 = Math.max(...crossTermAnalytics.studentTrends.map((s) => s.term2Avg), 88);
    const topT3 = Math.max(...crossTermAnalytics.studentTrends.map((s) => s.term3Avg), 92);

    return [
      {
        termPeriod: "1st Term",
        "Class Cohort Avg": formatScore(classP.term1),
        "Selected Student": stT ? formatScore(stT.term1Avg) : formatScore(classP.term1),
        "Grade Band Avg": formatScore(grpP.term1),
        "Top Class Performer": formatScore(topT1)
      },
      {
        termPeriod: "2nd Term",
        "Class Cohort Avg": formatScore(classP.term2),
        "Selected Student": stT ? formatScore(stT.term2Avg) : formatScore(classP.term2),
        "Grade Band Avg": formatScore(grpP.term2),
        "Top Class Performer": formatScore(topT2)
      },
      {
        termPeriod: "3rd Term",
        "Class Cohort Avg": formatScore(classP.term3),
        "Selected Student": stT ? formatScore(stT.term3Avg) : formatScore(classP.term3),
        "Grade Band Avg": formatScore(grpP.term3),
        "Top Class Performer": formatScore(topT3)
      }
    ];
  }, [crossTermAnalytics, activeChartStudentTrend, filteredGradeGroupAnalytics, chartMetricMode]);

  // Active student dossier record
  const selectedDossier = useMemo(() => {
    const found = broadsheetData.find((r) => r.studentId === selectedStudentId);
    return found || broadsheetData[0] || null;
  }, [broadsheetData, selectedStudentId]);

  // Handle Export Broadsheet to CSV
  const handleExportBroadsheetCsv = () => {
    if (filteredBroadsheetRows.length === 0) {
      toast.error("No student broadsheet records match the active filter criteria.");
      return;
    }

    const headers = [
      "Position / Rank",
      "Registration Number",
      "Student Full Name",
      "Class Cohort",
      "Session",
      "Term Period",
      "Report Mode",
      ...ALL_SUBJECTS,
      "Total Aggregate Score",
      "Average %",
      "GPA (5.0 Scale)",
      "Teacher Remark"
    ];

    const rows = filteredBroadsheetRows.map((r) => {
      const subjValues = ALL_SUBJECTS.map((subj) => `${r.subjectScores[subj]?.total || 0} (${r.subjectScores[subj]?.grade || "F"})`);
      return [
        `"Rank #${r.classRank}"`,
        `"${r.regNumber}"`,
        `"${r.studentName}"`,
        `"${r.classCohort}"`,
        `"${activeSession}"`,
        `"${activeTerm}"`,
        `"${reportType === "full_term" ? "Full Term Report" : "Half Term Report"}"`,
        ...subjValues.map((v) => `"${v}"`),
        `"${r.totalAggregateScore} / ${r.maxPossibleScore}"`,
        `"${r.averagePercentage}%"`,
        `"${r.termGpa}"`,
        `"${r.teacherRemark.replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClass = selectedClass.replace(/[^a-zA-Z0-9]/g, "_");
    const safeTerm = activeTerm.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `CornerStreams_Broadsheet_${safeClass}_${safeTerm}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredBroadsheetRows.length} filtered student record(s) as CSV!`);
  };

  // Handle Export Filtered Student Dossier Data to JSON
  const handleExportBroadsheetJson = () => {
    if (filteredBroadsheetRows.length === 0) {
      toast.error("No student broadsheet records match the active filter criteria.");
      return;
    }

    const exportPayload = {
      metadata: {
        platform: "Corner Streams Academic Broadsheet Dossier",
        schoolClass: selectedClass,
        academicSession: activeSession,
        termPeriod: activeTerm,
        reportType: reportType,
        gradeFilterApplied: selectedGradeFilter,
        searchFilterApplied: searchQuery || null,
        totalExportedRecords: filteredBroadsheetRows.length,
        exportedAt: new Date().toISOString()
      },
      students: filteredBroadsheetRows.map((r) => ({
        classRank: r.classRank,
        regNumber: r.regNumber,
        studentName: r.studentName,
        classCohort: r.classCohort,
        gender: r.rawStudent?.gender || "N/A",
        totalAggregateScore: r.totalAggregateScore,
        maxPossibleScore: r.maxPossibleScore,
        averagePercentage: r.averagePercentage,
        termGpa: r.termGpa,
        teacherRemark: r.teacherRemark,
        subjectScores: r.subjectScores
      }))
    };

    const jsonContent = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClass = selectedClass.replace(/[^a-zA-Z0-9]/g, "_");
    const safeTerm = activeTerm.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `CornerStreams_Broadsheet_${safeClass}_${safeTerm}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredBroadsheetRows.length} filtered student record(s) as JSON!`);
  };

  // Handle Export Broadsheet & Gradebook to PDF
  const handleExportToPDF = () => {
    toast.info("Preparing Gradebook & Academic Broadsheet for PDF export...");
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Submit Teacher Request for Student Dossier
  const handleSubmitTeacherRequest = () => {
    if (!requestNote.trim()) {
      toast.error("Please enter a short request note describing the dossier requirement.");
      return;
    }

    const newReq = {
      id: `req-${Date.now()}`,
      teacherName: currentProfile.fullName || (currentProfile as any).name || "Class Teacher",
      teacherRole: currentProfile.role,
      studentId: selectedStudentId,
      studentName: selectedDossier?.studentName || "Student",
      classCohort: selectedClass,
      session: activeSession,
      term: activeTerm,
      note: requestNote,
      timestamp: new Date().toISOString(),
      status: "pending"
    };

    const nextList = [newReq, ...pendingRequests];
    setPendingRequests(nextList);
    localStorage.setItem("CS_BROADSHEET_DOSSIER_REQUESTS", JSON.stringify(nextList));

    toast.success("Dossier compilation request submitted to Principal & School Admin queue!");
    setIsRequestModalOpen(false);
    setRequestNote("");
  };

  return (
    <div className={`space-y-4 ${className}`} id="cs-academic-broadsheet-vault">
      {/* PRINT-ONLY OFFICIAL SCHOOL BRANDED HEADER */}
      <div className="print-only-school-header print-school-header border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start gap-4">
        <div className="print-school-header-brand flex items-center gap-3">
          <div className="print-school-logo-badge w-14 h-14 bg-indigo-950 text-white rounded-xl flex items-center justify-center font-black text-xl border-2 border-emerald-500 shrink-0">
            CS
          </div>
          <div>
            <span className="print-school-subtitle text-[9px] font-mono font-black uppercase tracking-widest text-emerald-600 block">
              Corner Streams Educational Infrastructure
            </span>
            <h1 className="print-school-title text-lg sm:text-xl font-display font-black text-slate-900 uppercase tracking-tight leading-none mt-0.5">
              Corner Streams International Academy
            </h1>
            <p className="print-school-motto text-[10px] italic text-slate-600 font-medium mt-0.5">
              Motto: &quot;Excellence &amp; Honor in Character and Service&quot;
            </p>
            <p className="print-school-meta text-[9px] text-slate-500 font-mono">
              12 Corner Streams Boulevard, Victoria Island, Lagos &bull; Master Academic Broadsheet Ledger
            </p>
          </div>
        </div>

        <div className="print-school-seal-badge text-right shrink-0">
          <span className="badge-title inline-block px-2.5 py-1 bg-indigo-950 text-white font-mono font-bold text-[10px] uppercase rounded-md">
            Master Broadsheet Matrix
          </span>
          <p className="badge-meta text-[9px] font-mono text-slate-500 mt-1">
            Cohort: <strong className="text-slate-900">{selectedClass}</strong>
          </p>
          <p className="badge-meta text-[9px] font-mono text-slate-500">
            Term: <strong className="text-slate-900">{activeTerm} ({activeSession})</strong>
          </p>
        </div>
      </div>

      {/* HEADER BAR & SESSION / TERM NAVIGATION */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Academic Broadsheet Vault & Master Matrix</span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase font-black">
                  Sessions & Terms
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Complete institutional grade spreadsheet metric stored per session and term for full-term and half-term reports.
              </p>
            </div>
          </div>

          {/* Quick Download, Populate Random, Edit Grading System & Print Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGradingModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Edit school grading system options (10,10,10,10,60 | 5,5,5,5,80 | 20,20,60 or custom)"
            >
              <Sliders className="w-3.5 h-3.5 text-white" />
              <span>Edit Grading System</span>
            </button>
            <button
              type="button"
              onClick={handlePopulateRandom15Scores}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-100" />
              <span>Randomize 15 Scores</span>
            </button>
            {/* Custom Export Dropdown per AGENTS.md rules */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsTopExportOpen(!isTopExportOpen);
                  setIsExportMenuOpen(false);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform ${isTopExportOpen ? "rotate-180" : ""}`} />
              </button>

              {isTopExportOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsTopExportOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden font-sans">
                    <div className="p-1">
                      <div className="px-2.5 py-1 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100 mb-1">
                        Export Format ({filteredBroadsheetRows.length} students):
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportToPDF();
                          setIsTopExportOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg text-slate-700 hover:bg-rose-600 hover:text-white font-medium transition group"
                      >
                        <div className="p-1 bg-rose-100 text-rose-800 rounded group-hover:bg-rose-700 group-hover:text-white transition">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Export to PDF (.pdf)</div>
                          <div className="text-[10px] text-slate-400 group-hover:text-rose-100">Clean print-styled Gradebook document</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleExportBroadsheetCsv();
                          setIsTopExportOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg text-slate-700 hover:bg-emerald-600 hover:text-white font-medium transition group"
                      >
                        <div className="p-1 bg-emerald-100 text-emerald-800 rounded group-hover:bg-emerald-700 group-hover:text-white transition">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Export as CSV (.csv)</div>
                          <div className="text-[10px] text-slate-400 group-hover:text-emerald-100">Spreadsheet table for Excel / Sheets</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleExportBroadsheetJson();
                          setIsTopExportOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg text-slate-700 hover:bg-indigo-600 hover:text-white font-medium transition group"
                      >
                        <div className="p-1 bg-indigo-100 text-indigo-800 rounded group-hover:bg-indigo-700 group-hover:text-white transition">
                          <FileJson className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">Export as JSON (.json)</div>
                          <div className="text-[10px] text-slate-400 group-hover:text-indigo-100">Structured dataset for developer tools</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportToPDF}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Export Gradebook & Academic Broadsheet view as a clean, print-friendly PDF document"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export to PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Broadsheet</span>
            </button>
          </div>
        </div>

        {/* 15 STUDENT ACTIVE TEST DATASET BANNER */}
        <div className="px-3.5 py-2 bg-gradient-to-r from-indigo-900 via-indigo-950 to-emerald-950 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono border border-indigo-800/60 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-400 text-slate-950 rounded font-black text-[10px]">
              15 STUDENTS
            </div>
            <span className="font-bold text-slate-100 text-[11px]">
              Active 15-Student Test Cohort loaded ({selectedClass}) • 10 Core Subjects Evaluated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
              CA1 (15%) + CA2 (15%) + MidTerm (20%) + Exam (50%) = 100%
            </span>
            <button
              type="button"
              onClick={handlePopulateRandom15Scores}
              className="text-[10.5px] font-black text-amber-300 hover:text-amber-200 underline decoration-dashed flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-Shuffle Scores</span>
            </button>
          </div>
        </div>

        {/* BROADSHEET DOSSIER SCOPE MODE CARDS (FULL TERM RESULT VS HALF TERM RESULT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* CARD 1: FULL TERM RESULT BROADSHEET DOSSIER */}
          <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            reportType === "full_term"
              ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-500/50 shadow-md ring-2 ring-indigo-500/30"
              : "bg-white text-slate-900 border-slate-200 hover:border-indigo-300 shadow-2xs"
          }`}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl font-black text-xs ${
                    reportType === "full_term" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 block">
                      Official Terminal Dossier
                    </span>
                    <h3 className="text-sm font-display font-black tracking-tight">
                      Full Term Result Broadsheet
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isDigitalProActive ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-mono font-black uppercase rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Digital Pro
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px] font-mono font-black uppercase rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Locked
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-[11.5px] leading-relaxed font-sans ${reportType === "full_term" ? "text-indigo-100" : "text-slate-600"}`}>
                Tracks cumulative 1st, 2nd & 3rd Term scores, terminal exam assessments (50%), psychomotor domain ratings, teacher remarks, and school endorsement seals for each student and class.
              </p>

              {/* Scope Pills */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]">
                <span className={`px-2 py-0.5 rounded ${reportType === "full_term" ? "bg-indigo-900/80 text-indigo-200 border border-indigo-700" : "bg-slate-100 text-slate-700"}`}>
                  1st, 2nd, 3rd Term Scores
                </span>
                <span className={`px-2 py-0.5 rounded ${reportType === "full_term" ? "bg-indigo-900/80 text-indigo-200 border border-indigo-700" : "bg-slate-100 text-slate-700"}`}>
                  CA + Final Exam (100%)
                </span>
                <span className={`px-2 py-0.5 rounded ${reportType === "full_term" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-emerald-50 text-emerald-800"}`}>
                  Class Rank & GPA
                </span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-200/20 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReportType("full_term")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  reportType === "full_term"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-xs"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{reportType === "full_term" ? "Active Scope" : "Select Full Term"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProModalOpen(true)}
                className="text-[10.5px] font-mono font-black text-amber-400 hover:text-amber-300 underline decoration-dashed flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{isDigitalProActive ? "Digital Pro Mode" : "Unlock Pro"}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: HALF TERM RESULT BROADSHEET DOSSIER */}
          <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            reportType === "half_term"
              ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white border-emerald-500/50 shadow-md ring-2 ring-emerald-500/30"
              : "bg-white text-slate-900 border-slate-200 hover:border-emerald-300 shadow-2xs"
          }`}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl font-black text-xs ${
                    reportType === "half_term" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 block">
                      Mid-Term Progress Audit
                    </span>
                    <h3 className="text-sm font-display font-black tracking-tight">
                      Half Term Result Broadsheet
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isDigitalProActive ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-mono font-black uppercase rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Digital Pro
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px] font-mono font-black uppercase rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Locked
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-[11.5px] leading-relaxed font-sans ${reportType === "half_term" ? "text-emerald-100" : "text-slate-600"}`}>
                Monitors Mid-Term Continuous Assessments (CA1 25% + CA2 25% + Mid-Term 50%), providing early deficit alerts, half-term class averages, and progress benchmarks prior to full-term finals.
              </p>

              {/* Scope Pills */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]">
                <span className={`px-2 py-0.5 rounded ${reportType === "half_term" ? "bg-emerald-950/80 text-emerald-200 border border-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                  1st & 2nd CA Assessment
                </span>
                <span className={`px-2 py-0.5 rounded ${reportType === "half_term" ? "bg-emerald-950/80 text-emerald-200 border border-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                  Mid-Term Progress (50%)
                </span>
                <span className={`px-2 py-0.5 rounded ${reportType === "half_term" ? "bg-indigo-900/80 text-indigo-200 border border-indigo-700" : "bg-indigo-50 text-indigo-800"}`}>
                  Early Deficit Warnings
                </span>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-200/20 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReportType("half_term")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  reportType === "half_term"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-xs"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{reportType === "half_term" ? "Active Scope" : "Select Half Term"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProModalOpen(true)}
                className="text-[10.5px] font-mono font-black text-amber-400 hover:text-amber-300 underline decoration-dashed flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{isDigitalProActive ? "Digital Pro Mode" : "Unlock Pro"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CROSS-TERM STUDENT & CLASS SCORE IMPROVEMENT TRACKER (DIGITAL REPORTS PRO UNLOCKED VS LOCKED) */}
        {isDigitalProActive ? (
          <div className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl border border-indigo-500/30 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-800/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Digital Reports Pro: Cross-Term Score Improvement Tracker</span>
                    <span className="px-2 py-0.5 text-[8.5px] bg-emerald-500 text-slate-950 rounded font-black">
                      1st → 2nd → 3rd Term
                    </span>
                  </h4>
                  <p className="text-[10.5px] text-indigo-200 font-mono">
                    Track individual student & class cohort academic score growth, position movements, and psychomotor progress across terms.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDigitalProActive}
                  className="px-2.5 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Lock Pro</span>
                </button>
              </div>
            </div>

            {/* CLASS TERM-OVER-TERM SUMMARY METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-indigo-900/50 rounded-xl border border-indigo-800">
                <span className="text-[9px] uppercase text-indigo-300 block font-bold">1st Term Class Avg</span>
                <span className="text-sm font-black text-white">{crossTermAnalytics.classProgression.term1}%</span>
              </div>
              <div className="p-2.5 bg-indigo-900/50 rounded-xl border border-indigo-800">
                <span className="text-[9px] uppercase text-indigo-300 block font-bold">2nd Term Class Avg</span>
                <span className="text-sm font-black text-amber-300">{crossTermAnalytics.classProgression.term2}%</span>
              </div>
              <div className="p-2.5 bg-indigo-900/50 rounded-xl border border-indigo-800">
                <span className="text-[9px] uppercase text-indigo-300 block font-bold">3rd Term Class Avg</span>
                <span className="text-sm font-black text-emerald-400">{crossTermAnalytics.classProgression.term3}%</span>
              </div>
              <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-800/80">
                <span className="text-[9px] uppercase text-emerald-300 block font-bold">Net Cohort Improvement</span>
                <span className={`text-sm font-black ${crossTermAnalytics.classProgression.netClassDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {crossTermAnalytics.classProgression.netClassDelta >= 0 ? `+${crossTermAnalytics.classProgression.netClassDelta}% 📈` : `${crossTermAnalytics.classProgression.netClassDelta}% 📉`}
                </span>
              </div>
            </div>

            {/* TOP IMPROVED STUDENTS MINI MATRIX */}
            <div className="overflow-x-auto border border-indigo-800/60 rounded-xl bg-slate-950/60 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-indigo-900/80 text-indigo-200 text-[9.5px] uppercase sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-indigo-800">Student Name</th>
                    <th className="p-2 border-b border-indigo-800 text-center">1st Term</th>
                    <th className="p-2 border-b border-indigo-800 text-center">2nd Term</th>
                    <th className="p-2 border-b border-indigo-800 text-center">3rd Term</th>
                    <th className="p-2 border-b border-indigo-800 text-center">Cross-Term Delta</th>
                    <th className="p-2 border-b border-indigo-800 text-center">Rank Shift</th>
                    <th className="p-2 border-b border-indigo-800 text-center">Psychomotor Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-950/80">
                  {crossTermAnalytics.studentTrends.slice(0, 8).map((st) => (
                    <tr key={st.studentId} className="hover:bg-indigo-900/30 transition-colors">
                      <td className="p-2 font-bold text-white truncate max-w-[150px]">{st.studentName}</td>
                      <td className="p-2 text-center text-slate-300">{st.term1Avg}%</td>
                      <td className="p-2 text-center text-amber-300">{st.term2Avg}%</td>
                      <td className="p-2 text-center text-emerald-400 font-black">{st.term3Avg}%</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          st.delta1to3 >= 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}>
                          {st.delta1to3 >= 0 ? `+${st.delta1to3}% 📈` : `${st.delta1to3}% 📉`}
                        </span>
                      </td>
                      <td className="p-2 text-center text-slate-200">
                        Rank #{st.term1Rank} → <span className="font-bold text-emerald-300">#{st.term3Rank}</span>
                      </td>
                      <td className="p-2 text-center text-indigo-300 text-[10px]">{st.psychomotorRating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-indigo-950/60 to-slate-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-display font-black text-amber-300 uppercase tracking-wider">
                    Digital Reports Pro Vault Restricted
                  </span>
                  <span className="px-2 py-0.5 text-[8.5px] bg-amber-400 text-slate-950 rounded font-black font-mono">
                    PRO TIER ONLY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Unlock Digital Reports Pro to enable 1st, 2nd, and 3rd Term Cross-Term Score Tracking, Automated Improvement Analytics, Psychomotor Summaries, and Batch PDF Report Card Exports.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDigitalProActive}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Unlock Digital Reports Pro</span>
            </button>
          </div>
        )}

        {/* RECHARTS ACADEMIC IMPROVEMENT VISUALIZATION FOR BROADSHEET DOSSIER */}
        <div className="p-4 sm:p-5 bg-slate-900 border border-indigo-900/80 rounded-2xl shadow-md text-white space-y-4 font-sans">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 text-white rounded-xl shadow-xs">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-display font-black text-white uppercase tracking-wider">
                    Academic Improvement Trend Plotter
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md">
                    Recharts Multi-Term Engine
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Plotting term-over-term GPA & score trajectories for <span className="text-emerald-400 font-bold">{selectedClass}</span> against student selection & grade group benchmarks.
                </p>
              </div>
            </div>

            {/* CONTROLS: SCALE TOGGLE & CUSTOM STUDENT SELECTOR */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Scale Mode Switcher (Percentage vs GPA) */}
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10.5px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setChartMetricMode("percentage");
                    toast.info("Switched chart scale to Percentage (%)");
                  }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    chartMetricMode === "percentage"
                      ? "bg-indigo-600 text-white font-black shadow-2xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMetricMode("gpa");
                    toast.info("Switched chart scale to GPA (5.0 Scale)");
                  }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    chartMetricMode === "gpa"
                      ? "bg-emerald-600 text-white font-black shadow-2xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  GPA (5.0 Scale)
                </button>
              </div>

              {/* Custom Student Selector per AGENTS.md rules */}
              <div className="relative min-w-[210px]">
                <button
                  type="button"
                  onClick={() => setIsChartStudentOpen(!isChartStudentOpen)}
                  className="flex items-center justify-between w-full h-8 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-mono font-bold text-white transition cursor-pointer"
                >
                  <span className="truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{activeChartStudentTrend?.studentName || "Select Student"}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isChartStudentOpen ? "rotate-180" : ""}`} />
                </button>

                {isChartStudentOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsChartStudentOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-40 p-1 font-mono text-xs max-h-56 overflow-y-auto">
                      <div className="px-2 py-1 text-[9px] uppercase font-black text-slate-500 border-b border-slate-800 mb-1">
                        Select Student for Trend Plot:
                      </div>
                      {crossTermAnalytics.studentTrends.map((st) => (
                        <button
                          key={st.studentId}
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.studentId);
                            setIsChartStudentOpen(false);
                            toast.info(`Plotting improvement trend for ${st.studentName}`);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            selectedStudentId === st.studentId
                              ? "bg-gradient-to-r from-indigo-700 to-emerald-600 text-white font-black"
                              : "text-slate-300 hover:bg-indigo-600 hover:text-white"
                          }`}
                        >
                          <span className="truncate font-sans font-medium">{st.studentName}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-black ${st.delta1to3 >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                            {st.delta1to3 >= 0 ? `+${st.delta1to3}%` : `${st.delta1to3}%`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* QUICK METRICS HIGHLIGHT RIBBON ABOVE CHART */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/40">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Class Cohort</span>
              <span className="text-xs font-black text-white">{selectedClass} ({broadsheetData.length} students)</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/40">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Class Avg Trend (1st → 3rd)</span>
              <span className="text-xs font-black text-indigo-300">
                {crossTermAnalytics.classProgression.term1}% → {crossTermAnalytics.classProgression.term3}%
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/40">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Selected Student Delta</span>
              <span className={`text-xs font-black ${activeChartStudentTrend && activeChartStudentTrend.delta1to3 >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {activeChartStudentTrend?.studentName.split(" ")[0]}: {activeChartStudentTrend && activeChartStudentTrend.delta1to3 >= 0 ? `+${activeChartStudentTrend.delta1to3}% 📈` : `${activeChartStudentTrend?.delta1to3}% 📉`}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/40">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Grade Band ({selectedGradeFilter})</span>
              <span className="text-xs font-black text-amber-300">
                {filteredGradeGroupAnalytics.count} {filteredGradeGroupAnalytics.count === 1 ? "student" : "students"} matched
              </span>
            </div>
          </div>

          {/* RECHARTS CANVAS CONTAINER */}
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rechartsAcademicTrendData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="termPeriod" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: "bold" }} />
                <YAxis
                  domain={chartMetricMode === "percentage" ? [30, 100] : [1.0, 5.0]}
                  stroke="#94a3b8"
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  unit={chartMetricMode === "percentage" ? "%" : ""}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/95 border border-indigo-500/50 p-3 rounded-xl shadow-2xl text-white font-mono text-xs space-y-1.5 z-50">
                          <p className="font-bold text-amber-300 border-b border-slate-800 pb-1 uppercase tracking-wider flex items-center justify-between gap-3">
                            <span>{label} Assessment</span>
                            <span className="text-[10px] text-slate-400 font-normal">{selectedClass}</span>
                          </p>
                          {payload.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="font-bold">{p.name}:</span>
                              </span>
                              <span className="font-black">
                                {p.value}{chartMetricMode === "percentage" ? "%" : " GPA"}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "11px", fontFamily: "monospace" }} />
                <Line
                  type="monotone"
                  dataKey="Class Cohort Avg"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#818cf8" }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="Selected Student"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: "#10b981", stroke: "#047857", strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="Grade Band Avg"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: "#f59e0b" }}
                />
                <Line
                  type="monotone"
                  dataKey="Top Class Performer"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={{ r: 3, fill: "#ec4899" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BROADSHEET DOSSIER ADMINISTRATOR DRILL-DOWN FILTERING INTERFACE */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-display font-black text-slate-900 uppercase tracking-wider">
                    Broadsheet Dossier Drill-Down Filter
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                    Admin Filter Matrix
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Select term period (1st, 2nd, 3rd) and specific student grade band to inspect broadsheet metrics.
                </p>
              </div>
            </div>

            {(selectedGradeFilter !== "ALL" || searchQuery.trim() !== "") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGradeFilter("ALL");
                  setSearchQuery("");
                  toast.info("Drill-down filters reset.");
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] rounded-lg transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* INSTANT SEARCH BAR FIELD */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Search Student Records:</span>
                </span>
                {searchQuery && (
                  <span className="text-indigo-900 font-bold font-mono text-[9.5px]">
                    {filteredBroadsheetRows.length} {filteredBroadsheetRows.length === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, student ID (e.g. CS-8201), reg #, class..."
                  className="w-full pl-9 pr-8 h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white font-medium text-slate-800 transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* TERM PERIOD SELECTION INTERFACE (1st Term, 2nd Term, 3rd Term) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Term:</span>
                </span>
                <span className="text-indigo-900 font-bold">{activeTerm}</span>
              </label>

              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 h-9 items-center">
                {["1st Term", "2nd Term", "3rd Term"].map((term) => {
                  const isActive = activeTerm === term;
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setActiveTerm(term);
                        toast.info(`Switched Broadsheet Dossier view to ${term}`);
                      }}
                      className={`py-1 px-1 rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-black shadow-xs"
                          : "text-slate-700 hover:bg-white hover:text-indigo-900"
                      }`}
                    >
                      <span>{term.replace(" Term", "")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STUDENT GRADE TIER CUSTOM SELECT (PER AGENTS.MD RULES) */}
            <div className="md:col-span-4 space-y-1.5 relative">
              <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Student Grade Band:</span>
                </span>
                <span className="text-emerald-800 font-bold">
                  {selectedGradeFilter === "ALL" && "All Grades (100%)"}
                  {selectedGradeFilter === "A1" && "Grade A1 (80-100%)"}
                  {selectedGradeFilter === "B2_B3" && "Grade B2/B3 (65-79%)"}
                  {selectedGradeFilter === "C4_C6" && "Grade C4/C6 (50-64%)"}
                  {selectedGradeFilter === "F9" && "Grade F9 (<50%)"}
                </span>
              </label>

              {/* Custom React Select Container */}
              <button
                type="button"
                onClick={() => {
                  setIsGradeSelectOpen(!isGradeSelectOpen);
                  setIsSessionOpen(false);
                  setIsTermOpen(false);
                  setIsClassOpen(false);
                  setIsStudentOpen(false);
                  setIsSortSelectOpen(false);
                }}
                className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedGradeFilter === "A1" ? "bg-emerald-500" :
                    selectedGradeFilter === "B2_B3" ? "bg-amber-500" :
                    selectedGradeFilter === "C4_C6" ? "bg-blue-500" :
                    selectedGradeFilter === "F9" ? "bg-rose-500" : "bg-indigo-600"
                  }`} />
                  <span className="truncate">
                    {selectedGradeFilter === "ALL" && "All Student Grades (Complete Class)"}
                    {selectedGradeFilter === "A1" && "Grade A1 - Distinction (80% – 100%)"}
                    {selectedGradeFilter === "B2_B3" && "Grade B2 / B3 - Upper Credit (65% – 79%)"}
                    {selectedGradeFilter === "C4_C6" && "Grade C4 / C6 - Credit Pass (50% – 64%)"}
                    {selectedGradeFilter === "F9" && "Grade F9 - Deficit / Fail (Below 50%)"}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isGradeSelectOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Custom Dropdown Option Container per AGENTS.md guidelines */}
              {isGradeSelectOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsGradeSelectOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden font-sans">
                    <div className="p-1">
                      {[
                        { id: "ALL", label: "All Student Grades", desc: "Complete class cohort (No grade filter)", count: gradeStats.total, color: "text-indigo-600" },
                        { id: "A1", label: "Grade A1 (Distinction)", desc: "Scores 80% – 100% (Top Performers)", count: gradeStats.countA1, color: "text-emerald-600" },
                        { id: "B2_B3", label: "Grade B2 / B3 (Credit)", desc: "Scores 65% – 79% (Commendable)", count: gradeStats.countB, color: "text-amber-600" },
                        { id: "C4_C6", label: "Grade C4 / C6 (Pass)", desc: "Scores 50% – 64% (Satisfactory)", count: gradeStats.countC, color: "text-blue-600" },
                        { id: "F9", label: "Grade F9 (Deficit / Fail)", desc: "Scores Below 50% (Requires Remedial)", count: gradeStats.countF, color: "text-rose-600" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedGradeFilter(opt.id);
                            setIsGradeSelectOpen(false);
                            toast.success(`Filtered broadsheet by ${opt.label}`);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left rounded-lg transition-all ${
                            selectedGradeFilter === opt.id
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium group"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{opt.label}</span>
                              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                                selectedGradeFilter === opt.id ? "bg-indigo-200 text-indigo-900" : "bg-slate-100 text-slate-700 group-hover:bg-emerald-700 group-hover:text-white"
                              }`}>
                                {opt.count} {opt.count === 1 ? "student" : "students"}
                              </span>
                            </div>
                            <p className={`text-[10px] ${selectedGradeFilter === opt.id ? "text-indigo-700" : "text-slate-400 group-hover:text-emerald-100"}`}>
                              {opt.desc}
                            </p>
                          </div>
                          {selectedGradeFilter === opt.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* QUICK GRADE FILTER CHIPS FOR 1-CLICK DRILL DOWN */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-black mr-1">Quick Grade Chips:</span>

              <button
                type="button"
                onClick={() => setSelectedGradeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedGradeFilter === "ALL"
                    ? "bg-indigo-950 text-white font-black shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>All Grades</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-slate-200/60 rounded text-slate-900 font-black">
                  {gradeStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeFilter("A1")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedGradeFilter === "A1"
                    ? "bg-emerald-600 text-white font-black shadow-2xs"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <span>Grade A1 (80%+)</span>
                <span className={`px-1.5 py-0.2 text-[9px] rounded font-black ${selectedGradeFilter === "A1" ? "bg-emerald-700 text-white" : "bg-emerald-200 text-emerald-900"}`}>
                  {gradeStats.countA1}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeFilter("B2_B3")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedGradeFilter === "B2_B3"
                    ? "bg-amber-600 text-white font-black shadow-2xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                <span>Grade B (65-79%)</span>
                <span className={`px-1.5 py-0.2 text-[9px] rounded font-black ${selectedGradeFilter === "B2_B3" ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900"}`}>
                  {gradeStats.countB}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeFilter("C4_C6")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedGradeFilter === "C4_C6"
                    ? "bg-blue-600 text-white font-black shadow-2xs"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                <span>Grade C (50-64%)</span>
                <span className={`px-1.5 py-0.2 text-[9px] rounded font-black ${selectedGradeFilter === "C4_C6" ? "bg-blue-700 text-white" : "bg-blue-200 text-blue-900"}`}>
                  {gradeStats.countC}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeFilter("F9")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                  selectedGradeFilter === "F9"
                    ? "bg-rose-600 text-white font-black shadow-2xs"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                <span>Grade F9 (&lt;50%)</span>
                <span className={`px-1.5 py-0.2 text-[9px] rounded font-black ${selectedGradeFilter === "F9" ? "bg-rose-700 text-white" : "bg-rose-200 text-rose-900"}`}>
                  {gradeStats.countF}
                </span>
              </button>

              {/* AT-RISK SCORE DROP THRESHOLD SELECTOR & TOGGLE */}
              <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-slate-200">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsThresholdOpen(!isThresholdOpen)}
                    className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                    <span>Drop Threshold: <strong className="text-rose-700">-{atRiskThreshold}%</strong></span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isThresholdOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isThresholdOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsThresholdOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden py-1 font-sans">
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <span className="text-[9.5px] font-mono font-black uppercase text-slate-500">Configure At-Risk Drop Threshold</span>
                        </div>
                        {[
                          { val: 5, label: "-5% Score Drop", desc: "Sensitive early-warning trigger" },
                          { val: 10, label: "-10% Score Drop (Default)", desc: "Standard academic intervention trigger" },
                          { val: 15, label: "-15% Score Drop", desc: "Significant academic decline trigger" },
                          { val: 20, label: "-20% Score Drop", desc: "Critical intervention trigger" }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setAtRiskThreshold(opt.val);
                              setIsThresholdOpen(false);
                              toast.info(`Set At-Risk Intervention Threshold to -${opt.val}% drop`);
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left transition ${
                              atRiskThreshold === opt.val
                                ? "bg-amber-50 text-amber-900 font-black"
                                : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                            }`}
                          >
                            <div>
                              <div className="font-bold">{opt.label}</div>
                              <div className="text-[9.5px] opacity-80">{opt.desc}</div>
                            </div>
                            {atRiskThreshold === opt.val && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAtRiskOnly(!showAtRiskOnly)}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                    showAtRiskOnly
                      ? "bg-rose-600 text-white ring-2 ring-rose-400"
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>{showAtRiskOnly ? "Show All Cohort" : `⚠️ At-Risk Only (${broadsheetData.filter(r => r.isAtRisk).length})`}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Drill-down Results:</span>
              <span className="font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {filteredBroadsheetRows.length} of {broadsheetData.length} Students
              </span>
            </div>
          </div>

          {/* ACTIVE FILTER TAGS & 1-CLICK REMOVAL */}
          {(searchQuery.trim() !== "" || selectedClass !== "All Classes" || selectedGradeFilter !== "ALL" || showAtRiskOnly) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 font-mono text-[10.5px]">
              <span className="text-[10px] text-slate-400 font-black uppercase">Active Filter Criteria:</span>
              {searchQuery.trim() !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold shadow-2xs">
                  <span>Search: "{searchQuery}"</span>
                  <button type="button" onClick={() => setSearchQuery("")} className="hover:text-rose-600 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedClass !== "All Classes" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-bold shadow-2xs">
                  <span>Cohort: {selectedClass}</span>
                  <button type="button" onClick={() => setSelectedClass("All Classes")} className="hover:text-rose-600 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedGradeFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-bold shadow-2xs">
                  <span>Grade Band: {
                    selectedGradeFilter === "A1" ? "Grade A1 (80%+)" :
                    selectedGradeFilter === "B2_B3" ? "Grade B (65-79%)" :
                    selectedGradeFilter === "C4_C6" ? "Grade C (50-64%)" : "Grade F9 (<50%)"
                  }</span>
                  <button type="button" onClick={() => setSelectedGradeFilter("ALL")} className="hover:text-rose-600 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {showAtRiskOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg font-bold shadow-2xs">
                  <span>⚠️ At-Risk Only</span>
                  <button type="button" onClick={() => setShowAtRiskOnly(false)} className="hover:text-rose-600 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedClass("All Classes");
                  setSelectedGradeFilter("ALL");
                  setShowAtRiskOnly(false);
                  toast.info("Cleared all broadsheet search and filter parameters.");
                }}
                className="text-slate-400 hover:text-slate-700 underline font-bold cursor-pointer ml-1 text-[10px]"
              >
                Clear All Criteria
              </button>
            </div>
          )}

          {/* CLASS AT-RISK INTERVENTION SUMMARY ALERT BANNER */}
          {(() => {
            const flaggedCount = broadsheetData.filter((r) => r.isAtRisk).length;
            if (flaggedCount === 0) return null;

            return (
              <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-950 via-rose-950 to-indigo-950 text-white border border-amber-500/40 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.25 bg-amber-400 text-slate-950 text-[9px] font-mono font-black uppercase rounded">
                        Class Intervention Flag Triggered
                      </span>
                      <span className="text-amber-200 text-xs font-mono font-bold">
                        Configured Threshold: -{atRiskThreshold}% Drop
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-200 mt-0.5">
                      <strong>{flaggedCount} student{flaggedCount > 1 ? "s" : ""}</strong> in {selectedClass} experienced a term-over-term score drop exceeding -{atRiskThreshold}%.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAtRiskOnly(!showAtRiskOnly)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer"
                  >
                    {showAtRiskOnly ? "Clear At-Risk Filter" : `Filter ${flaggedCount} At-Risk Students`}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* NAVIGATION CONTROLS BAR WITH CUSTOM REACT SELECTS (PER AGENTS.MD RULES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          
          {/* 1. Academic Session Custom Select */}
          <div className="space-y-1 relative">
            <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Academic Session
            </label>
            <button
              type="button"
              onClick={() => {
                setIsSessionOpen(!isSessionOpen);
                setIsTermOpen(false);
                setIsClassOpen(false);
                setIsStudentOpen(false);
              }}
              className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
            >
              <span className="truncate">{activeSession}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSessionOpen ? "rotate-180" : ""}`} />
            </button>

            {isSessionOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSessionOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                  <div className="py-1">
                    {ACADEMIC_SESSIONS.map((sess) => (
                      <button
                        key={sess}
                        type="button"
                        onClick={() => {
                          setActiveSession(sess);
                          setIsSessionOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                          activeSession === sess
                            ? "bg-indigo-50 text-indigo-900 font-black"
                            : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{sess}</span>
                        {activeSession === sess && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Academic Term Custom Select */}
          <div className="space-y-1 relative">
            <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Term Period
            </label>
            <button
              type="button"
              onClick={() => {
                setIsTermOpen(!isTermOpen);
                setIsSessionOpen(false);
                setIsClassOpen(false);
                setIsStudentOpen(false);
              }}
              className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
            >
              <span className="truncate">{activeTerm}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTermOpen ? "rotate-180" : ""}`} />
            </button>

            {isTermOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsTermOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                  <div className="py-1">
                    {ACADEMIC_TERMS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setActiveTerm(t);
                          setIsTermOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                          activeTerm === t
                            ? "bg-indigo-50 text-indigo-900 font-black"
                            : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{t}</span>
                        {activeTerm === t && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3. Class Custom Select */}
          <div className="space-y-1 relative">
            <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Class Cohort
            </label>
            <button
              type="button"
              onClick={() => {
                setIsClassOpen(!isClassOpen);
                setIsSessionOpen(false);
                setIsTermOpen(false);
                setIsStudentOpen(false);
              }}
              className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
            >
              <span className="truncate">{selectedClass}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isClassOpen ? "rotate-180" : ""}`} />
            </button>

            {isClassOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsClassOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {AVAILABLE_CLASSES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedClass(c);
                          setIsClassOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                          selectedClass === c
                            ? "bg-indigo-50 text-indigo-900 font-black"
                            : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                        }`}
                      >
                        <span>{c}</span>
                        {selectedClass === c && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 4. Report Type Toggle (Full Term Report vs Half-Term Report) */}
          <div className="space-y-1">
            <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Assessment Scope
            </label>
            <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 h-9">
              <button
                type="button"
                onClick={() => setReportType("full_term")}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition ${
                  reportType === "full_term"
                    ? "bg-indigo-600 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Full Term
              </button>
              <button
                type="button"
                onClick={() => setReportType("half_term")}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition ${
                  reportType === "half_term"
                    ? "bg-emerald-600 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Half Term
              </button>
            </div>
          </div>

          {/* 5. View Mode Switcher */}
          <div className="space-y-1">
            <label className="block text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Broadsheet Mode
            </label>
            <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 h-9">
              <button
                type="button"
                onClick={() => setViewMode("class_broadsheet")}
                className={`flex-1 py-1 px-1.5 text-[9.5px] font-bold rounded-lg truncate transition ${
                  viewMode === "class_broadsheet"
                    ? "bg-indigo-950 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Class Matrix
              </button>
              <button
                type="button"
                onClick={() => setViewMode("student_dossier")}
                className={`flex-1 py-1 px-1.5 text-[9.5px] font-bold rounded-lg truncate transition ${
                  viewMode === "student_dossier"
                    ? "bg-indigo-950 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Child Dossier
              </button>
              <button
                type="button"
                onClick={() => setViewMode("master_comprehensive")}
                className={`flex-1 py-1 px-1.5 text-[9.5px] font-bold rounded-lg truncate transition ${
                  viewMode === "master_comprehensive"
                    ? "bg-indigo-950 text-white font-black shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Master
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH BAR, CUSTOM SORT SELECT & DOSSIER REQUEST TRIGGER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, CS-8201, reg #, class..."
                className="w-full pl-9 pr-7 h-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom React Select for Sorting per AGENTS.md rules */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSortSelectOpen(!isSortSelectOpen);
                  setIsSessionOpen(false);
                  setIsTermOpen(false);
                  setIsClassOpen(false);
                  setIsStudentOpen(false);
                }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Filter className="w-3 h-3 text-indigo-600" />
                <span className="text-[10px] text-slate-400 font-mono uppercase">Sort:</span>
                <span className="font-black text-indigo-900 truncate max-w-[110px]">{getSortFieldLabel(sortBy)}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isSortSelectOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortSelectOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortSelectOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                    <div className="p-1 font-sans">
                      {[
                        { id: "rank", label: "Position / Rank" },
                        { id: "name", label: "Student Full Name" },
                        { id: "totalGrade", label: "Total Score / Grade" },
                        { id: "averagePercentage", label: "Average Percentage" },
                        { id: "regNumber", label: "Registration Number" },
                        { id: "gpa", label: "GPA Score" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleToggleSort(opt.id as SortField);
                            setIsSortSelectOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg transition-all ${
                            sortBy === opt.id
                              ? "bg-indigo-50 text-indigo-900 font-black"
                              : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ascending / Descending Direction Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextOrder = sortOrder === "asc" ? "desc" : "asc";
                setSortOrder(nextOrder);
                toast.info(`Sorted ${nextOrder === "asc" ? "Ascending (1-9 / A-Z)" : "Descending (9-1 / Z-A)"}`);
              }}
              className="flex items-center gap-1 h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-2xs"
              title="Toggle sort direction (Ascending / Descending)"
            >
              {sortOrder === "asc" ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700">Asc</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-900">Desc</span>
                </>
              )}
            </button>
          </div>

          {/* Export Filtered Data, Teacher Request & Print Preview Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Custom Export Select Dropdown per AGENTS.md rules */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(!isExportMenuOpen);
                  setIsSortSelectOpen(false);
                  setIsTopExportOpen(false);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Filtered Data</span>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden font-sans">
                    <div className="p-1">
                      <div className="px-2.5 py-1 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span>Filtered Student Dataset:</span>
                        <span className="text-emerald-700 font-bold">{filteredBroadsheetRows.length} rows</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportBroadsheetCsv();
                          setIsExportMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg text-slate-700 hover:bg-emerald-600 hover:text-white font-medium transition group cursor-pointer"
                      >
                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg group-hover:bg-emerald-700 group-hover:text-white transition shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Export as CSV (.csv)</div>
                          <div className="text-[10px] text-slate-400 group-hover:text-emerald-100">Structured table for Excel & Google Sheets</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleExportBroadsheetJson();
                          setIsExportMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg text-slate-700 hover:bg-indigo-600 hover:text-white font-medium transition group cursor-pointer"
                      >
                        <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg group-hover:bg-indigo-700 group-hover:text-white transition shrink-0">
                          <FileJson className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Export as JSON (.json)</div>
                          <div className="text-[10px] text-slate-400 group-hover:text-indigo-100">Complete JSON object for offline analysis</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPrintPreviewStudentId("ALL");
                setIsPrintPreviewOpen(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview Modal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>Teacher Request Dossier ({pendingRequests.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: CLASS BROADSHEET FULL SPREADSHEET MATRIX (ROWS & COLUMNS) */}
      {viewMode === "class_broadsheet" && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              <h3 className="font-display font-black text-slate-900 text-sm">
                Class Broadsheet Matrix: <span className="text-indigo-600">{selectedClass}</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                ({filteredBroadsheetRows.length} Students • {ALL_SUBJECTS.length} Subjects)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {reportType === "full_term" ? "Full Term Score Breakdown (CA + Exam)" : "Half Term Progress Matrix"}
            </span>
          </div>

          {/* FLOATING BULK SELECTION ACTION TOOLBAR */}
          <AnimatePresence>
            {selectedStudentIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="p-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-xl shadow-xl border border-indigo-700/60 flex flex-wrap items-center justify-between gap-3 font-sans"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-black font-mono">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {selectedStudentIds.length} of {filteredBroadsheetRows.length} Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-indigo-200 hover:text-white underline font-bold transition cursor-pointer"
                  >
                    {isAllFilteredSelected ? "Deselect All" : `Select All (${filteredBroadsheetRows.length})`}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Action 1: Generate Reports */}
                  <button
                    type="button"
                    onClick={() => setIsBatchReportModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Generate Reports ({selectedStudentIds.length})</span>
                  </button>

                  {/* Action 2: Notify Parents */}
                  <button
                    type="button"
                    onClick={() => setIsBatchNotifyModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Notify Parents ({selectedStudentIds.length})</span>
                  </button>

                  {/* Action 3: Update Status */}
                  <button
                    type="button"
                    onClick={() => setIsBatchStatusModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Update Status ({selectedStudentIds.length})</span>
                  </button>

                  {/* Action 4: Export Selected */}
                  <button
                    type="button"
                    onClick={handleExportSelectedCsv}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Export CSV of selected student rows"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>

                  {/* Clear Selection */}
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Spreadsheet Table View */}
          <div 
            className="overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto relative focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
            role="region"
            aria-label="Academic BroadSheet Master Assessment Ledger"
            tabIndex={0}
          >
            {/* Screen Reader Live Announcement */}
            <div role="status" aria-live="polite" className="sr-only">
              {broadsheetAnnouncement}
            </div>

            <table 
              className="w-full text-left border-collapse text-xs font-mono"
              role="grid"
              aria-label="Academic Broadsheet Comprehensive Assessment Matrix"
              aria-rowcount={filteredBroadsheetRows.length + 1}
            >
              <caption className="sr-only">
                Comprehensive Academic Broadsheet showing student ranks, continuous assessments, terminal subject scores, GPAs, and performance flags. Press Enter or Space on column headers to sort.
              </caption>
              <thead className="sticky top-0 z-20 bg-indigo-950 text-white font-bold text-[10px] uppercase tracking-wider select-none">
                <tr role="row">
                  {/* Select All Checkbox Column */}
                  <th 
                    scope="col"
                    className="p-2.5 border-b border-indigo-900 w-10 text-center bg-indigo-950 sticky left-0 z-40 border-r border-indigo-900"
                  >
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeFilteredSelected;
                      }}
                      onChange={toggleSelectAll}
                      aria-label="Select or deselect all visible student rows in broadsheet"
                      className="w-4 h-4 rounded border-indigo-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500 focus-visible:outline-none"
                      title="Select / Deselect All Visible Students"
                    />
                  </th>
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "rank" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by class rank position, currently ${sortBy === "rank" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("rank")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("rank");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 w-12 text-center bg-indigo-950 sticky left-10 z-30 cursor-pointer hover:bg-indigo-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by class position / rank"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rank</span>
                      {sortBy === "rank" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "name" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by Student Full Name, currently ${sortBy === "name" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("name")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("name");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 min-w-[160px] bg-indigo-950 sticky left-22 z-30 cursor-pointer hover:bg-indigo-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by student name"
                  >
                    <div className="flex items-center gap-1">
                      <span>Student Full Name</span>
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "regNumber" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by Registration Number, currently ${sortBy === "regNumber" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("regNumber")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("regNumber");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 w-28 cursor-pointer hover:bg-indigo-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by registration number"
                  >
                    <div className="flex items-center gap-1">
                      <span>Reg Number</span>
                      {sortBy === "regNumber" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  {ALL_SUBJECTS.map((subj) => (
                    <th scope="col" key={subj} className="p-2.5 border-b border-indigo-900 min-w-[100px] text-center border-l border-indigo-900">
                      {subj}
                    </th>
                  ))}
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "totalGrade" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by Total Aggregate Score, currently ${sortBy === "totalGrade" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("totalGrade")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("totalGrade");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 w-24 text-center border-l border-indigo-900 bg-indigo-900 cursor-pointer hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by total grade score"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Total Score</span>
                      {sortBy === "totalGrade" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "averagePercentage" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by Average Percentage, currently ${sortBy === "averagePercentage" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("averagePercentage")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("averagePercentage");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 w-20 text-center bg-indigo-900 cursor-pointer hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by average percentage"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Average %</span>
                      {sortBy === "averagePercentage" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortBy === "gpa" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    aria-label={`Sort by GPA score, currently ${sortBy === "gpa" ? (sortOrder === "asc" ? "sorted ascending" : "sorted descending") : "not sorted"}. Press Enter or Space to sort.`}
                    onClick={() => handleToggleSort("gpa")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleSort("gpa");
                      }
                    }}
                    className="p-2.5 border-b border-indigo-900 w-16 text-center bg-indigo-900 cursor-pointer hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-colors group"
                    title="Click or press Enter to sort by GPA"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>GPA</span>
                      {sortBy === "gpa" ? (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="p-2.5 border-b border-indigo-900 min-w-[150px] bg-indigo-950 text-center border-l border-indigo-900">Academic Status</th>
                  <th scope="col" className="p-2.5 border-b border-indigo-900 min-w-[160px] bg-indigo-950 text-center border-l border-indigo-900">At-Risk & Intervention</th>
                  <th scope="col" className="p-2.5 border-b border-indigo-900 min-w-[130px] bg-indigo-950 text-center border-l border-indigo-900">Payment Ledger</th>
                  <th scope="col" className="p-2.5 border-b border-indigo-900 min-w-[140px]">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                {filteredBroadsheetRows.map((row, idx) => {
                  const isSelected = selectedStudentIds.includes(row.studentId);
                  return (
                    <tr
                      id={`broadsheet-row-${row.studentId}`}
                      key={row.studentId}
                      role="row"
                      tabIndex={0}
                      aria-rowindex={idx + 2}
                      aria-selected={isSelected}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          toggleSelectStudent(row.studentId);
                        } else if (e.key === "ArrowDown") {
                          if (idx < filteredBroadsheetRows.length - 1) {
                            e.preventDefault();
                            const next = document.getElementById(`broadsheet-row-${filteredBroadsheetRows[idx + 1].studentId}`);
                            if (next) next.focus();
                          }
                        } else if (e.key === "ArrowUp") {
                          if (idx > 0) {
                            e.preventDefault();
                            const prev = document.getElementById(`broadsheet-row-${filteredBroadsheetRows[idx - 1].studentId}`);
                            if (prev) prev.focus();
                          }
                        }
                      }}
                      className={`transition-colors focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none ${
                        isSelected
                          ? "bg-indigo-50/90 font-medium ring-1 ring-indigo-300"
                          : row.isAtRisk
                          ? "bg-amber-50/80 border-l-4 border-l-amber-500"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="p-2.5 text-center sticky left-0 z-20 bg-inherit border-r border-slate-200 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(row.studentId)}
                          aria-label={`Select student row for ${row.studentName}`}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>

                      {/* Sticky Rank */}
                      <td className="p-2.5 text-center font-black text-indigo-900 sticky left-10 z-10 bg-inherit border-r border-slate-200">
                        <span className={`inline-block w-6 h-6 rounded-lg text-center leading-6 text-[10px] ${
                          row.classRank === 1 ? "bg-amber-100 text-amber-800 font-black border border-amber-300" :
                          row.classRank === 2 ? "bg-slate-200 text-slate-800 font-bold" :
                          row.classRank === 3 ? "bg-amber-800/10 text-amber-900 font-bold" : "text-slate-600"
                        }`}>
                          #{row.classRank}
                        </span>
                      </td>

                      {/* Sticky Student Name */}
                      <td className="p-2.5 font-bold text-slate-900 sticky left-22 z-10 bg-inherit border-r border-slate-200 truncate max-w-[180px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(row.studentId);
                          setViewMode("student_dossier");
                        }}
                        className="hover:text-indigo-600 text-left hover:underline truncate focus-visible:ring-1 focus-visible:ring-indigo-600 focus-visible:outline-none rounded px-0.5"
                        aria-label={`Open academic dossier for ${row.studentName}`}
                      >
                        {row.studentName}
                      </button>
                    </td>

                    <td className="p-2.5 text-slate-500 text-[10.5px]">{row.regNumber}</td>

                    {/* Subject Score Cells */}
                    {ALL_SUBJECTS.map((subj) => {
                      const scoreObj = row.subjectScores[subj];
                      const val = scoreObj?.total || 0;
                      const grade = scoreObj?.grade || "F";
                      const isHigh = val >= 80;
                      const isFail = val < 50;

                      return (
                        <td
                          key={subj}
                          className="p-2 text-center border-l border-slate-100 font-bold text-[11px]"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{val}</span>
                            <span className={`px-1 py-0.2 text-[8px] rounded font-black ${
                              isHigh ? "bg-emerald-100 text-emerald-800" :
                              isFail ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                            }`}>
                              {grade}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Totals & Averages */}
                    <td className="p-2.5 text-center font-black text-indigo-900 bg-indigo-50/30 border-l border-indigo-100 font-mono">
                      {row.totalAggregateScore} / {row.maxPossibleScore}
                    </td>
                    <td className="p-2.5 text-center font-black text-slate-900 bg-indigo-50/30 font-mono">
                      {row.averagePercentage}%
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-700 bg-indigo-50/30 font-mono">
                      {row.termGpa}
                    </td>

                    {/* Academic Status Badge Cell */}
                    {(() => {
                      const statusObj = studentStatusOverrides[row.studentId];
                      const statusKey = statusObj ? statusObj.status : (row.isAtRisk ? "AT_RISK" : "CLEARED");
                      const statusLabel = statusObj ? statusObj.statusLabel : (row.isAtRisk ? "At-Risk Flagged" : "Cleared & Official");

                      return (
                        <td className="p-2 text-center border-l border-slate-100 font-sans">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            statusKey === "CLEARED" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            statusKey === "WITHHELD" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                            statusKey === "PROMOTED" ? "bg-indigo-100 text-indigo-900 border border-indigo-300" :
                            statusKey === "AT_RISK" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            "bg-purple-100 text-purple-900 border border-purple-300"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              statusKey === "CLEARED" ? "bg-emerald-500" :
                              statusKey === "WITHHELD" ? "bg-rose-500" :
                              statusKey === "PROMOTED" ? "bg-indigo-500" :
                              statusKey === "AT_RISK" ? "bg-amber-500" : "bg-purple-500"
                            }`} />
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                      );
                    })()}

                    {/* At-Risk Flag & Teacher Intervention Cell */}
                    <td className="p-2 text-center border-l border-slate-100 font-mono">
                      {row.isAtRisk ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                            <span>-{row.scoreDropDelta}%</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInterventionStudent({
                                studentId: row.studentId,
                                studentName: row.studentName,
                                regNumber: row.regNumber,
                                classCohort: row.classCohort,
                                previousTermScore: row.prevTermAvg,
                                currentTermScore: row.averagePercentage
                              });
                              setIsInterventionModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95 shrink-0"
                          >
                            <ShieldAlert className="w-3 h-3 text-amber-200" />
                            <span>{getStoredStudentIntervention(row.studentId) ? "Plan Active" : "Trigger"}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Stable</span>
                        </span>
                      )}
                    </td>

                    {(() => {
                      let bill = mockBillingRecords.find((b) => b.studentId === row.studentId);
                      try {
                        const stored = localStorage.getItem('CS_BILLING_RECORDS');
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          const match = parsed.find((b: any) => b.studentId === row.studentId);
                          if (match) bill = match;
                        }
                      } catch (e) {}

                      const status = bill ? bill.status : 'PAID';
                      const isPaid = status === 'PAID';
                      const isPartial = status === 'PARTIALLY_PAID';
                      const balance = bill ? (bill.totalAmount - bill.amountPaid) : 0;

                      return (
                        <td className="p-2 text-center border-l border-slate-100 font-sans">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isPaid ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            isPartial ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : isPartial ? "bg-amber-500" : "bg-rose-500"}`} />
                            {isPaid ? "CLEARED" : isPartial ? `BAL: ₦${balance.toLocaleString()}` : "UNPAID"}
                          </span>
                        </td>
                      );
                    })()}
                    <td className="p-2.5 text-[10px] text-slate-700 font-medium max-w-[180px]">
                      <div className="flex items-center justify-between gap-1.5 group">
                        <span className="truncate" title={customBroadsheetRemarks[row.studentId] || row.teacherRemark}>
                          {customBroadsheetRemarks[row.studentId] || row.teacherRemark}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateBroadsheetRemark(row.studentId, row.studentName, row.averagePct);
                          }}
                          className="no-print p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded transition shrink-0 cursor-pointer shadow-2xs hover:scale-105"
                          title="Refresh AI remark for this student"
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-600 hover:rotate-180 transition-transform duration-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

                {/* SUMMARY FOOTER ROW CALCULATING CLASS SUBJECT METRICS */}
                <tr className="bg-slate-900 text-white font-black text-[10.5px] font-mono border-t-2 border-indigo-600">
                  <td className="p-2.5 text-center sticky left-0 bg-slate-900 z-10 w-10 text-slate-400">SEL</td>
                  <td className="p-2.5 text-center sticky left-10 bg-slate-900 z-10 text-slate-400">CLASS</td>
                  <td className="p-2.5 sticky left-22 bg-slate-900 z-10 text-emerald-400">CLASS SUBJECT AVERAGE</td>
                  <td className="p-2.5 text-slate-400">MEAN SCORE</td>
                  {ALL_SUBJECTS.map((subj) => {
                    const avg = classSummaryMetrics.subjectSummaries?.[subj]?.avg || 0;
                    return (
                      <td key={subj} className="p-2.5 text-center border-l border-slate-800 text-amber-300">
                        {avg}%
                      </td>
                    );
                  })}
                  <td className="p-2.5 text-center text-emerald-400 border-l border-slate-800">
                    AVG: {classSummaryMetrics.classAvgPct}%
                  </td>
                  <td className="p-2.5 text-center text-emerald-400">{classSummaryMetrics.classAvgPct}%</td>
                  <td className="p-2.5 text-center text-amber-300">{(classSummaryMetrics.classAvgPct / 20).toFixed(2)}</td>
                  <td className="p-2.5 text-slate-400">Class Metric</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PERSONAL STUDENT RESULT DOSSIER BROADSHEET */}
      {viewMode === "student_dossier" && selectedDossier && (
        <StudentResultDossier
          student={{
            id: selectedDossier.studentId,
            name: selectedDossier.studentName,
            reg: selectedDossier.regNumber,
            class: selectedDossier.classCohort
          }}
          studentsList={broadsheetData.map((b) => ({
            id: b.studentId,
            name: b.studentName,
            reg: b.regNumber,
            class: b.classCohort
          }))}
          currentProfile={currentProfile}
          activeSession={activeSession}
          activeTerm={activeTerm}
          onSelectStudent={(id) => setSelectedStudentId(id)}
        />
      )}

      {/* VIEW 3: MASTER COMPREHENSIVE BROADSHEET */}
      {viewMode === "master_comprehensive" && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-display font-black text-slate-900 text-sm">
                Master Comprehensive School Broadsheet Across Classes
              </h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {activeSession} • All Streams
            </span>
          </div>

          {/* Master Cross-Class Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-xl space-y-1">
              <span className="text-[9px] font-mono uppercase font-black text-indigo-300">Top Academic Scholar</span>
              <p className="text-sm font-black text-emerald-400">{broadsheetData[0]?.studentName || "N/A"}</p>
              <p className="text-[10px] text-indigo-200 font-mono">
                {broadsheetData[0]?.classCohort} • Aggregate: {broadsheetData[0]?.totalAggregateScore} pts ({broadsheetData[0]?.averagePercentage}%)
              </p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
              <span className="text-[9px] font-mono uppercase font-black text-slate-400">Institutional Mean Average</span>
              <p className="text-lg font-black text-amber-400 font-mono">{classSummaryMetrics.classAvgPct}%</p>
              <p className="text-[10px] text-slate-400 font-mono">Calculated across {broadsheetData.length} evaluated students</p>
            </div>

            <div className="p-4 bg-emerald-900 text-white rounded-xl space-y-1">
              <span className="text-[9px] font-mono uppercase font-black text-emerald-300">Class Pass Ratio</span>
              <p className="text-lg font-black text-white font-mono">94.2%</p>
              <p className="text-[10px] text-emerald-200 font-mono">Pass benchmark set at 50% threshold</p>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER REQUEST MODAL FOR STUDENT DOSSIER */}
      <AnimatePresence>
        {isRequestModalOpen && (
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
                  <span className="text-xs font-black uppercase tracking-wider">Teacher Dossier Request</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <p className="font-bold text-indigo-900">Requesting Dossier Compilation Access</p>
                  <p className="text-[11px] text-indigo-700 leading-snug">
                    Submit a formal request from the Teacher Dashboard to generate and publish comprehensive result dossier metrics for <strong>{selectedDossier?.studentName || "Student"}</strong> ({selectedClass}).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    Teacher Purpose & Context Note
                  </label>
                  <textarea
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="E.g. Parent teacher conference review, terminal academic progress audit, or scholarship recommendation dossier..."
                    className="w-full h-24 p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitTeacherRequest}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-2xs"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIGITAL REPORTS PRO UPGRADE & FEATURE MODAL */}
      <AnimatePresence>
        {isProModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg font-black">
                    <Zap className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-black uppercase tracking-wider text-amber-300">
                      Digital Reports Pro Edition
                    </h3>
                    <p className="text-[10px] text-indigo-200 font-mono">
                      Advanced Broadsheet Dossier & Cross-Term Tracking Suite
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <p className="font-black text-slate-900">Digital Broadsheet Dossier Upgrade</p>
                  </div>
                  <p className="text-[11.5px] text-slate-700 leading-snug">
                    Digital Reports Pro unlocks complete access to 1st, 2nd, and 3rd Term score comparisons, half-term vs full-term result broadsheets, psychomotor rating trackers, and instant PDF batch generation for your entire school.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
                    What's Included in Digital Reports Pro:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-slate-800">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Full & Half Term Dossiers</p>
                        <p className="text-[10.5px] text-slate-500">Dual broadsheet dossier cards with custom term filters.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Cross-Term Score Analytics</p>
                        <p className="text-[10.5px] text-slate-500">Track student improvements across 1st, 2nd & 3rd terms.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Psychomotor & Domain Skill</p>
                        <p className="text-[10.5px] text-slate-500">5-point affective skills ratings & conduct benchmarks.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Instant PDF Batch Print</p>
                        <p className="text-[10.5px] text-slate-500">Generate printable report cards for all students in 1-click.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Included with School Admin License</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProModalOpen(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toggleDigitalProActive();
                        setIsProModalOpen(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                      <span>{isDigitalProActive ? "Digital Pro Active" : "Activate Digital Pro Now"}</span>
                    </button>
                  </div>
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
        studentsList={studentsList}
        initialClass={selectedClass}
        initialStudentId={printPreviewStudentId}
        activeSession={activeSession}
        activeTerm={activeTerm}
      />
      {/* EDIT GRADING SYSTEM MODAL */}
      <GradingSystemModal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
      />

      {/* TEACHER AT-RISK INTERVENTION ACTION MODAL */}
      {interventionStudent && (
        <AtRiskInterventionModal
          isOpen={isInterventionModalOpen}
          onClose={() => setIsInterventionModalOpen(false)}
          studentId={interventionStudent.studentId}
          studentName={interventionStudent.studentName}
          regNumber={interventionStudent.regNumber}
          classCohort={interventionStudent.classCohort}
          previousTermScore={interventionStudent.previousTermScore}
          currentTermScore={interventionStudent.currentTermScore}
          configuredThreshold={atRiskThreshold}
        />
      )}

      {/* BATCH NOTIFY PARENTS MODAL */}
      <AnimatePresence>
        {isBatchNotifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/30 text-emerald-400 rounded-xl border border-indigo-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">Batch Parent Notification Dispatcher</h3>
                    <p className="text-xs text-indigo-200">
                      Broadcasting to parents of <span className="text-emerald-400 font-bold">{selectedStudentIds.length} selected student(s)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchNotifyModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                <div>
                  <label className="font-bold text-slate-800 mb-1.5 block">1. Select Communication Channel:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "SMS", label: "Direct SMS", icon: Send },
                      { id: "EMAIL", label: "Email Broadcast", icon: Mail },
                      { id: "PORTAL", label: "Parent Portal Push", icon: MessageSquare }
                    ].map((ch) => {
                      const Icon = ch.icon;
                      const active = batchNotifyChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setBatchNotifyChannel(ch.id)}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                            active
                              ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                          <span>{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 mb-1.5 block">2. Choose Message Preset Template:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "RESULTS", title: "Results Released" },
                      { key: "AT_RISK", title: "Intervention Alert" },
                      { key: "FEE_REMINDER", title: "Fee Ledger Notice" },
                      { key: "CUSTOM", title: "Custom Notice" }
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => applyNotifyPreset(tmpl.key)}
                        className={`p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          batchNotifyPreset === tmpl.key
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 mb-1 block">Subject / Headline:</label>
                  <input
                    type="text"
                    value={batchNotifySubject}
                    onChange={(e) => setBatchNotifySubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">Message Body Template:</label>
                    <span className="text-[10px] text-slate-400">Click tag to insert variable</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { tag: "{student_name}", label: "Student Name" },
                      { tag: "{class}", label: "Class Cohort" },
                      { tag: "{average_percentage}", label: "Avg %" },
                      { tag: "{gpa}", label: "GPA" },
                      { tag: "{rank}", label: "Rank" }
                    ].map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => setBatchNotifyBody((prev) => prev + " " + t.tag)}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold transition cursor-pointer"
                      >
                        + {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={batchNotifyBody}
                    onChange={(e) => setBatchNotifyBody(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-400 uppercase">Live Sample Preview for First Student:</span>
                    <span>{filteredBroadsheetRows.find((r) => selectedStudentIds.includes(r.studentId))?.studentName || "Student"}</span>
                  </div>
                  <p className="text-[11px] text-slate-100 font-sans leading-relaxed pt-1">
                    {evaluateSampleNotifyText(batchNotifyBody, filteredBroadsheetRows.find((r) => selectedStudentIds.includes(r.studentId)))}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Will log dispatch record into Admin Audit Trail
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchNotifyModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBatchNotify}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Dispatch ({selectedStudentIds.length} Parents)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATCH UPDATE STATUS MODAL */}
      <AnimatePresence>
        {isBatchStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">Batch Academic Status Manager</h3>
                    <p className="text-xs text-amber-200">
                      Updating standing for <span className="text-emerald-400 font-bold">{selectedStudentIds.length} selected student(s)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchStatusModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 mb-2 block">Select Target Academic Status:</label>
                  <div className="space-y-2">
                    {[
                      { key: "CLEARED", label: "Cleared & Official", desc: "Official broadsheet result published to Parent Portal", color: "emerald" },
                      { key: "WITHHELD", label: "Result Withheld", desc: "Withheld pending board review or clearance", color: "rose" },
                      { key: "PROMOTED", label: "Promoted to Next Class", desc: "Passed all subjects and promoted to next academic tier", color: "indigo" },
                      { key: "AT_RISK", label: "Academic Counseling / At-Risk", desc: "Flagged for academic advisory and counselor intervention", color: "amber" },
                      { key: "FEES_PENDING", label: "Fees Clearance Pending", desc: "Account ledger requires fee balance clearance", color: "purple" }
                    ].map((st) => {
                      const isSelected = batchStatusKey === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            setBatchStatusKey(st.key);
                            setBatchStatusLabel(st.label);
                          }}
                          className={`p-3 rounded-xl border text-left w-full transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                st.color === "emerald" ? "bg-emerald-500" :
                                st.color === "rose" ? "bg-rose-500" :
                                st.color === "indigo" ? "bg-indigo-500" :
                                st.color === "amber" ? "bg-amber-500" : "bg-purple-500"
                              }`} />
                              <span className="font-bold text-slate-900 text-xs">{st.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-4">{st.desc}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 mb-1 block">Administrative Remark / Board Note:</label>
                  <input
                    type="text"
                    value={batchStatusRemark}
                    onChange={(e) => setBatchStatusRemark(e.target.value)}
                    placeholder="e.g. Approved by Academic Board of Governors on 01 Aug 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Saves to student permanent dossier
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchStatusModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBatchStatusUpdate}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply Status ({selectedStudentIds.length} Students)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATCH REPORT CARD GENERATOR MODAL */}
      <AnimatePresence>
        {isBatchReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/40">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">Batch Report Card Generator</h3>
                    <p className="text-xs text-emerald-200">
                      Processing dossiers for <span className="text-emerald-400 font-bold">{selectedStudentIds.length} selected student(s)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 mb-2 block">Choose Output Format:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchReportModalOpen(false);
                        setPrintPreviewStudentId("SELECTED");
                        setIsPrintPreviewOpen(true);
                      }}
                      className="p-4 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-left space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <Printer className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">Interactive</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Print Preview Modal</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Launch full-screen print preview formatted for selected {selectedStudentIds.length} students.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExecutePdfBatchPackage}
                      className="p-4 bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <FileText className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Batch PDF</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Download PDF Batch Bundle</p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Compile and download single printable PDF file containing all report cards.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-xs block">Included Report Card Sections:</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 accent-emerald-600" />
                      <span>Term CA & Exam Scores</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 accent-emerald-600" />
                      <span>Class Rank & Subject Positions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 accent-emerald-600" />
                      <span>Psychomotor & Conduct Ratings</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 accent-emerald-600" />
                      <span>Principal & Teacher Remarks</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Term: {activeTerm} ({activeSession})
                </span>
                <button
                  type="button"
                  onClick={() => setIsBatchReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AcademicBroadsheetVault;
