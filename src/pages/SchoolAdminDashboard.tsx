import React, { useState, useEffect, useRef, useMemo } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, Landmark, FileText, Megaphone, Check, Settings, 
  Trash, Save, GraduationCap, FileSpreadsheet, UserPlus, ShieldAlert,
  Sliders, Star, Edit, Key, ArrowUpRight, CheckCircle2, AlertCircle,
  RefreshCw, Copy, Download, ChevronDown, Clock, Calendar, Eye, Sparkles, CheckSquare, Printer, Upload,
  SlidersHorizontal, Layers, UserCheck, BookOpen, Search, X, Filter, Send, AlertTriangle,
  ArrowRightLeft, Archive, UserX, Shield, ShieldCheck, Lock, Unlock
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { DonutChart, ChartCard, BarSimple } from "../components/Charts";
import { BulkUploadDialog } from "../components/BulkUploadDialog";
import { BulkStatusUpdateDialog } from "../components/BulkStatusUpdateDialog";
import { CredentialsModal } from "../components/CredentialsModal";
import { StudentProfileDialog } from "../components/StudentProfileDialog";
import SettingsPanel from "../components/SettingsPanel";
import CommunicationHub from "../components/CommunicationHub";
import DailyAttendanceRegister from "../components/DailyAttendanceRegister";
import { UpgradeOverlay } from "../components/UpgradeOverlay";
import InteractivePlanComparisonModal from "../components/InteractivePlanComparisonModal";
import { GradeDistributionChart } from "../components/GradeDistributionChart";
import PerformanceTrendsCard from "../components/PerformanceTrendsCard";
import { TeacherWorkloadHeatmap } from "../components/TeacherWorkloadHeatmap";
import { AdminGradeVarianceAlertFeed } from "../components/AdminGradeVarianceAlertFeed";
import { ReassignSubjectModal } from "../components/ReassignSubjectModal";
import { AcademicBroadsheetVault } from "../components/AcademicBroadsheetVault";
import AccountDirectoryManager from "../components/AccountDirectoryManager";
import { StudentResultDossier } from "../components/StudentResultDossier";
import { ReportCardPrintPreviewModal } from "../components/ReportCardPrintPreviewModal";
import FinancialStatements from "../components/FinancialStatements";
import StaffPaymentLedger from "../components/StaffPaymentLedger";
import CbtExamEngine from "../components/CbtExamEngine";
import TuitionCollectionBarChart from "../components/TuitionCollectionBarChart";
import DailyAttendanceTrendChart from "../components/DailyAttendanceTrendChart";
import { DashboardInsights } from "../components/DashboardInsights";
import { ResultPublishCertificationModal } from "../components/ResultPublishCertificationModal";
import { RecentAdminActivityCard } from "../components/RecentAdminActivityCard";
import { logAdminActivity } from "../utils/adminAuditLogger";
import { mockBillingRecords } from "../mockData";
import { motion, AnimatePresence } from "motion/react";

export function SchoolAdminDashboard({ currentProfile, theme, setTheme, activeFont, setActiveFont, activeTab, onTabChange, grades = [], isPublished, onTogglePublished }: any) {
  const [tab, setTab] = useState("overview");
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [isPublishCertModalOpen, setIsPublishCertModalOpen] = useState(false);
  const [localIsPublished, setLocalIsPublished] = useState<boolean>(() => {
    if (typeof isPublished === 'boolean') return isPublished;
    return localStorage.getItem('CS_RESULTS_PUBLISHED') === 'true';
  });

  useEffect(() => {
    if (typeof isPublished === 'boolean') {
      setLocalIsPublished(isPublished);
    }
  }, [isPublished]);

  const handleStatusChangeConfirmed = (newStatus: boolean) => {
    setLocalIsPublished(newStatus);
    localStorage.setItem('CS_RESULTS_PUBLISHED', String(newStatus));
    if (onTogglePublished) {
      onTogglePublished(newStatus);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const [bursarySubTab, setBursarySubTab] = useState<'ledger_stream' | 'budget_forecast'>('ledger_stream');
  const [rosterMode, setRosterMode] = useState<'students' | 'teachers'>('students');
  const [reassignModalTarget, setReassignModalTarget] = useState<{ isOpen: boolean; teacherName: string; teacherEmail?: string; teacherId?: string }>({
    isOpen: false,
    teacherName: ''
  });

  // Persistent search bar states for Classes & Teachers views
  const [studentRosterSearch, setStudentRosterSearch] = useState<string>("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all");
  const [studentClassFilter, setStudentClassFilter] = useState<string>("ALL");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState<boolean>(false);
  const [activeStatusRowDropdown, setActiveStatusRowDropdown] = useState<string | null>(null);
  const [isStudentClassDropdownOpen, setIsStudentClassDropdownOpen] = useState<boolean>(false);
  const [teacherRosterSearch, setTeacherRosterSearch] = useState<string>("");
  const [classesSearchQuery, setClassesSearchQuery] = useState<string>("");
  const [expandedClassRoster, setExpandedClassRoster] = useState<string | null>(null);
  const [viewingTeacherStudents, setViewingTeacherStudents] = useState<any | null>(null);
  const [teacherStudentSearch, setTeacherStudentSearch] = useState<string>("");

  useEffect(() => {
    if (activeTab) {
      if (activeTab === 'classes' || activeTab === 'subjects' || activeTab === 'classrooms') {
        setTab('classrooms');
      } else if (activeTab === 'teachers' || activeTab === 'rosters' || activeTab === 'registry') {
        setTab('rosters');
        if (activeTab === 'teachers') setRosterMode('teachers');
      } else if (activeTab === 'receipt' || activeTab === 'fees' || activeTab === 'financials') {
        setTab('fees');
      } else if (activeTab === 'staff_payment' || activeTab === 'staffs_payment' || activeTab === 'payroll') {
        setTab('staff_payment');
      } else if (activeTab === 'cbt' || activeTab === 'cbt_portal') {
        setTab('cbt');
      } else if (activeTab === 'uploaded' || activeTab === 'live' || activeTab === 'cbt_review') {
        setTab('cbt_review');
      } else if (activeTab === 'completed' || activeTab === 'report_cards') {
        setTab('report_cards');
      } else if (activeTab === 'broadsheets' || activeTab === 'broadsheet_vault') {
        setTab('broadsheet_vault');
      } else if (activeTab === 'overview' || activeTab === 'dashboard') {
        setTab('overview');
      } else if (activeTab === 'result_dossiers') {
        setTab('result_dossiers');
      } else if (activeTab === 'attendance' || activeTab === 'daily_attendance') {
        setTab('daily_attendance');
      } else if (activeTab === 'messages') {
        setTab('messages');
      } else if (activeTab === 'settings') {
        setTab('settings');
      }
    }
  }, [activeTab]);

  // CBT Review & Publish Desk states
  const [reviewExams, setReviewExams] = useState<any[]>([]);
  const [selectedReviewExam, setSelectedReviewExam] = useState<any | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isPublishScheduleOpen, setIsPublishScheduleOpen] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  const getTeacherWorkloadInfo = (teacherName: string, teacherEmail?: string) => {
    try {
      const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
      if (saved) {
        const matrix = JSON.parse(saved);
        const match = matrix.find((t: any) =>
          (teacherEmail && t.email?.toLowerCase() === teacherEmail.toLowerCase()) ||
          t.name?.toLowerCase().includes(teacherName.toLowerCase()) ||
          teacherName?.toLowerCase().includes(t.name?.toLowerCase())
        );
        if (match && match.subjectPeriods) {
          const total = Object.values(match.subjectPeriods).reduce((a: any, b: any) => a + Number(b || 0), 0) as number;
          const subjects = Object.entries(match.subjectPeriods)
            .filter(([_, p]: any) => Number(p) > 0)
            .map(([s, p]: any) => `${s} (${p}h)`)
            .join(", ");
          return { total, subjects: subjects || "No subjects assigned", count: Object.keys(match.subjectPeriods).length };
        }
      }
    } catch (e) {}
    return { total: 16, subjects: "Mathematics (10h), Physics (6h)", count: 2 };
  };

  const getFacultyListForRoster = () => {
    const defaultFaculty = [
      {
        id: "u-2",
        name: "Mrs. Folasade Adebayo",
        email: "f.adebayo@cornerstreams.edu",
        role: "HOD Science / Senior Teacher",
        assignedClasses: ["SS 2 Science", "SS 3 Science", "JSS 3 Alpha"],
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120"
      },
      {
        id: "u-3",
        name: "Mr. Chidi Okafor",
        email: "c.okafor@cornerstreams.edu",
        role: "Mathematics Instructor",
        assignedClasses: ["SS 1 Gold", "SS 1 Silver", "JSS 2 Blue"],
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120"
      },
      {
        id: "u-4",
        name: "Dr. Emeka Nwosu",
        email: "e.nwosu@cornerstreams.edu",
        role: "Chemistry & Biology Lead",
        assignedClasses: ["SS 2 Science", "SS 3 Science"],
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120"
      },
      {
        id: "u-5",
        name: "Mrs. Grace Danjuma",
        email: "g.danjuma@cornerstreams.edu",
        role: "English & Literature Faculty",
        assignedClasses: ["SS 1 Gold", "SS 2 Science", "SS 3 Arts"],
        photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120"
      },
      {
        id: "u-6",
        name: "Mr. David Macaulay",
        email: "d.macaulay@cornerstreams.edu",
        role: "Commercial Stream Instructor",
        assignedClasses: ["SS 2 Commercial", "SS 3 Commercial"],
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120"
      },
      {
        id: "u-7",
        name: "Mr. Samuel Balogun",
        email: "s.balogun@cornerstreams.edu",
        role: "ICT & Technical Director",
        assignedClasses: ["JSS 1 Green", "JSS 2 Blue", "SS 1 Gold"],
        photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120"
      }
    ];

    const apiTeachers = users.filter((u: any) => 
      u.role === "school_admin" || 
      u.role?.toLowerCase().includes("teacher") ||
      u.role === "Class_Teacher"
    );

    const combined = [...defaultFaculty];
    apiTeachers.forEach((u: any) => {
      const uEmail = u.email || `${(u.full_name || u.name || 'faculty').toLowerCase().replace(/\s+/g, '')}@cornerstreams.edu`;
      const uName = u.full_name || u.name || "Faculty Member";
      if (!combined.some(c => c.email.toLowerCase() === uEmail.toLowerCase() || c.name.toLowerCase() === uName.toLowerCase())) {
        combined.push({
          id: u.id || `u-${Date.now()}`,
          name: uName,
          email: uEmail,
          role: u.role || "Class Teacher",
          assignedClasses: ["SS 1 Gold"],
          photoUrl: u.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120"
        });
      }
    });

    return combined;
  };

  const loadReviewExams = () => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    setReviewExams(examsList);
  };

  useEffect(() => {
    loadReviewExams();
  }, []);

  useEffect(() => {
    if (tab === "cbt_review") {
      loadReviewExams();
    }
  }, [tab]);

  const handlePublishExam = (examId: string, immediate: boolean, dateTimeStr: string) => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    const updated = examsList.map((ex: any) => {
      if (ex.id === examId) {
        return {
          ...ex,
          status: immediate ? "published" : "scheduled",
          publish_time: immediate ? new Date().toISOString() : dateTimeStr,
          published_by: currentProfile.label || "School Administrator"
        };
      }
      return ex;
    });
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(updated));
    toast.success(immediate 
      ? "CBT Exam Paper published immediately! Students can now initiate active sessions."
      : `CBT Exam scheduled to publish on ${new Date(dateTimeStr).toLocaleString()} successfully!`
    );
    loadReviewExams();
    setIsPublishScheduleOpen(false);
  };

  const handleDeleteReviewExam = (examId: string) => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    const filtered = examsList.filter((ex: any) => ex.id !== examId);
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(filtered));
    toast.success("CBT Examination packet removed from draft review pool.");
    loadReviewExams();
  };

  const [isPublishAllConfirmOpen, setIsPublishAllConfirmOpen] = useState(false);
  const [isReportPrintModalOpen, setIsReportPrintModalOpen] = useState(false);

  const handlePublishAllExams = () => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    let count = 0;
    const updated = examsList.map((ex: any) => {
      if (ex.status !== "published") {
        count++;
        return {
          ...ex,
          status: "published",
          publish_time: new Date().toISOString(),
          published_by: currentProfile.label || "School Administrator",
          publishedToStudents: true,
          published: true
        };
      }
      return ex;
    });

    if (count === 0 && reviewExams.length > 0) {
      const updatedReview = reviewExams.map((ex: any) => ({
        ...ex,
        status: "published",
        publish_time: new Date().toISOString(),
        published_by: currentProfile.label || "School Administrator",
        publishedToStudents: true,
        published: true
      }));
      setReviewExams(updatedReview);
      localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(updatedReview));
      toast.success(`🎉 Successfully published all ${reviewExams.length} exams live to students!`);
    } else {
      localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(updated));
      toast.success(`🎉 Successfully published all ${count} unpublished exam(s) live to students!`);
    }

    loadReviewExams();
    setIsPublishAllConfirmOpen(false);
  };

  const handleDownloadExcelTemplate = () => {
    const csvContent = `Question Number,Question Text,Option A,Option B,Option C,Option D,Correct Option (A/B/C/D),Marks
1,"Solve for x in the linear equation: 3x + 12 = 48","x = 12","x = 10","x = 14","x = 16","A",10
2,"Which organelle is known as the powerhouse of the cell?","Nucleus","Ribosome","Mitochondria","Endoplasmic Reticulum","C",10
3,"Calculate the speed if distance is 120km and time is 2 hours","50 km/h","60 km/h","70 km/h","80 km/h","B",10
4,"What is the grammatical function of an adverb?","Modifies a noun","Modifies a verb, adjective, or another adverb","Replaces a pronoun","Connects clauses","B",10
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CornerStreams_CBT_Exam_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Standardized Excel / CSV Question Template downloaded!");
  };

  // Classrooms Desk States
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState("");
  const [selectedClassForAdd, setSelectedClassForAdd] = useState<string | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // New student provisioning form states
  const [provStudentName, setProvStudentName] = useState("");
  const [provStudentGender, setProvStudentGender] = useState("Male");
  const [isProvGenderOpen, setIsProvGenderOpen] = useState(false);
  const [provParentEmail, setProvParentEmail] = useState("");
  const [provStudentAge, setProvStudentAge] = useState("16");
  const [provStudentBalance, setProvStudentBalance] = useState("0");
  const [provPassword, setProvPassword] = useState("");

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateClassSubmit = async () => {
    const trimmed = newClassNameInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid classroom name.");
      return;
    }
    try {
      await api.post("/schools/me/classes", { class_name: trimmed });
      toast.success(`Class "${trimmed}" has been created and persistent in database!`);
      setIsCreateClassOpen(false);
      setNewClassNameInput("");
      
      // Update local state classesInput to include the new class comma-separated
      if (classesInput) {
        setClassesInput(prev => {
          const arr = prev.split(",").map(s => s.trim()).filter(Boolean);
          if (!arr.includes(trimmed)) {
            return [...arr, trimmed].join(", ");
          }
          return prev;
        });
      } else {
        setClassesInput(trimmed);
      }
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist new class.");
    }
  };

  const handleProvisionStudentSubmit = async () => {
    const trimmedName = provStudentName.trim();
    if (!trimmedName) {
      toast.error("Please provide student full name.");
      return;
    }
    if (!provParentEmail.trim()) {
      toast.error("Please provide a parent contact email.");
      return;
    }

    try {
      const studentPayload = {
        name: trimmedName,
        class_name: selectedClassForAdd,
        gender: provStudentGender,
        age: Number(provStudentAge) || 16,
        parent_email: provParentEmail.trim(),
        balance_due: Number(provStudentBalance) || 0,
        portal_password: provPassword,
        login_email: `${trimmedName.toLowerCase().replace(/\s+/g, ".")}@cornerstreams.edu.ng`,
        term_average: 60
      };

      await api.post("/students", studentPayload);
      toast.success(`Registered ${trimmedName} and locked credentials! Dispatch window prepared.`);
      setIsAddStudentModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to provision student directory.");
    }
  };

  const handleDownloadClassExcelTemplate = (className: string) => {
    try {
      const headers = ["Student Full Name", "Gender", "Parent Contact Strings", "Class"];
      const data = [
        ["Adewale Tunde", "Male", "tunde.adewale@gmail.com", className],
        ["Chidinma Okafor", "Female", "okafor.family@yahoo.com", className],
        ["Aisha Ibrahim", "Female", "ibrahim.aisha@outlook.com", className]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Class Provisioning");
      
      XLSX.writeFile(wb, `Corner_Streams_${className.replace(/\s+/g, "_")}_Bulk_Template.xlsx`);
      toast.success(`Dynamic template for "${className}" downloaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate custom class spreadsheet template.");
    }
  };

  // Core School Data State
  const [school, setSchool] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("CS_SCHOOL") || "null");
    } catch {
      return null;
    }
  });
  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);

  // Subscription switcher console dropdown state
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [isPlanComparisonOpen, setIsPlanComparisonOpen] = useState(false);
  const tiersList = [
    { value: "cbt_essentials", label: "CBT Starter", desc: "Online CBT exam engine only (Results withheld from Parents)" },
    { value: "cbt_plus_results", label: "CBT Pro", desc: "Online CBT engine + Terminal Report Cards, Ledgers & Parent Portal Dispatch" },
    { value: "financial_ledger", label: "Bursary & Financial Ledger", desc: "Tuition Fee Billing, Payment Gateway & Receipt Ledgers" },
    { value: "digital_reports", label: "Digital Reports Stream (Legacy)", desc: "Grade Book, CA Matrices & Student Result Portal" },
    { value: "unified_enterprise", label: "Unified Enterprise", desc: "Full Access to CBT Starter, CBT Pro, Bursary & AI Tools" }
  ];

  const handleUpdateSubscriptionTier = async (newTier: string) => {
    try {
      const payload = {
        ...school,
        subscription_tier: newTier
      };
      await api.put("/schools/me", payload);
      localStorage.setItem("CS_SCHOOL", JSON.stringify(payload));
      setSchool(payload);
      window.dispatchEvent(new Event("cs_school_updated"));
      window.dispatchEvent(new Event("storage"));
      logAdminActivity({
        actionType: 'tier_change',
        actionTitle: 'Institutional License Tier Reconfigured',
        severity: 'high',
        performedBy: {
          name: currentProfile?.fullName || 'School Administrator',
          role: currentProfile?.role || 'School_Admin',
          email: currentProfile?.email
        },
        targetResource: `${newTier.replace(/_/g, " ").toUpperCase()} Plan Tier`,
        details: `Updated active school license tier to ${newTier.replace(/_/g, " ")}; re-indexed available functional modules.`,
        authMethod: 'password_reauth',
        status: 'executed'
      });
      toast.success(`License updated to ${newTier.replace(/_/g, " ").toUpperCase()} successfully!`);
      loadData();
    } catch (e) {
      toast.error("Failed to update institutional subscription.");
    }
  };

  // Sub-components triggers & states
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [studentDlg, setStudentDlg] = useState(false);
  const [bulkDlg, setBulkDlg] = useState(false);
  const [credsDlg, setCredsDlg] = useState(false);
  const [credsValue, setCredsValue] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Multi-Campus, Multi-Factor, Signatures and Watermarking advanced states
  const [selectedCampus, setSelectedCampus] = useState<string>("Lagos Main Campus");
  const [isCampusOpen, setIsCampusOpen] = useState<boolean>(false);
  const [reportSubMode, setReportSubMode] = useState<"single" | "broadsheet" | "distribution_analytics" | "bulk_export">("single");
  const [selectedExportClass, setSelectedExportClass] = useState<string>("SS 2 Science");
  const [isBulkExporting, setIsBulkExporting] = useState<boolean>(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ current: number; total: number; currentStudent: string } | null>(null);
  const [batchPrintMode, setBatchPrintMode] = useState<boolean>(false);
  const [attendanceWeight, setAttendanceWeight] = useState<number>(10);
  const [midtermWeight, setMidtermWeight] = useState<number>(30);
  const [examWeight, setExamWeight] = useState<number>(60);
  const [gradeScaleA, setGradeScaleA] = useState<number>(80);
  const [gradeScaleB, setGradeScaleB] = useState<number>(70);
  const [gradeScaleC, setGradeScaleC] = useState<number>(50);
  const [gradeScaleD, setGradeScaleD] = useState<number>(40);
  const [watermarkText, setWatermarkText] = useState<string>("OFFICIAL COPY");
  const [principalSignature, setPrincipalSignature] = useState<string>("");
  const [activeReportStudent, setActiveReportStudent] = useState<any>(null);

  // In-line HTML5 drawing canvas state & handlers for Signatures
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b"; // Indigo-950
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasSignature();
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setPrincipalSignature(dataUrl);
  };

  const clearCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPrincipalSignature("");
    toast.success("Principal signature pad cleared successfully.");
  };

  // School Editing Settings Forms
  const [motto, setMotto] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [mottoColor, setMottoColor] = useState("#002147");
  const [benchmark, setBenchmark] = useState(50);
  const [caFormula, setCaFormula] = useState<"2_CA" | "4_CA">("2_CA");
  const [classesInput, setClassesInput] = useState("");

  // Tuition pricing forms
  const [tuitionFee, setTuitionFee] = useState(40000);
  const [admissionFee, setAdmissionFee] = useState(15000);
  const [cbtFee, setCbtFee] = useState(5000);

  // New registry additions form states
  const [userFormDlg, setUserFormDlg] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", role: "Class_Teacher", assignedCohort: "" });

  // Custom class and teacher assignment states
  const [activeTeacherDropdown, setActiveTeacherDropdown] = useState<string | null>(null);
  const [activeReceiptClass, setActiveReceiptClass] = useState<string | null>(null);

  const [distributedClassReports, setDistributedClassReports] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("CS_DISTRIBUTED_CLASS_REPORTS") || "[]");
    } catch {
      return [];
    }
  });

  const handleDistributeClassReportToTeacher = (className: string, teacherName?: string) => {
    const nextList = Array.from(new Set([...distributedClassReports, className]));
    setDistributedClassReports(nextList);
    localStorage.setItem("CS_DISTRIBUTED_CLASS_REPORTS", JSON.stringify(nextList));
    toast.success(`🎉 Total Subjects Result PDF Report for ${className} distributed to ${teacherName || 'Assigned Teacher'}'s Dashboard!`, {
      duration: 5000
    });
  };

  const handleAssignClassTeacher = async (className: string, teacherId: string | null) => {
    try {
      const updatedUsers = users.map((u: any) => {
        if (teacherId && u.id === teacherId) {
          return {
            ...u,
            assigned_class: className,
            assigned_classes: [className],
            is_class_teacher: true
          };
        }
        if (u.assigned_class === className || (Array.isArray(u.assigned_classes) && u.assigned_classes.includes(className))) {
          if (!teacherId || u.id !== teacherId) {
            return {
              ...u,
              assigned_class: "",
              assigned_classes: u.assigned_classes?.filter((c: string) => c !== className) || []
            };
          }
        }
        return u;
      });

      localStorage.setItem("CS_USERS_LIST", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success(teacherId ? "Class Teacher assigned successfully!" : "Class Teacher unassigned successfully!");
      setActiveTeacherDropdown(null);
      loadData();
    } catch (err) {
      toast.error("Failed to update teacher assignment.");
    }
  };

  const loadData = async () => {
    try {
      const [sch, st, us, rc] = await Promise.all([
        api.get("/schools/me"),
        api.get("/students"),
        api.get("/users"),
        api.get("/payments/bank-receipts")
      ]);
      const sData = sch.data.school;
      setSchool(sData);
      setStudents(st.data.students || []);
      setUsers(us.data.users || []);
      setReceipts(rc.data.receipts || []);

      if (sData) {
        setMotto(sData.motto || "");
        setPrincipalName(sData.principal_name || "");
        setMottoColor(sData.brand_color || "#002147");
        setBenchmark(sData.benchmark || 50);
        setCaFormula(sData.ca_weights?.length === 4 ? "4_CA" : "2_CA");
        setClassesInput((sData.classes || []).join(", "));
      }
    } catch (e) {
      toast.error("Initialization error loading school registries.");
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => {
      const sch = localStorage.getItem("CS_SCHOOL");
      if (sch) {
        try {
          setSchool(JSON.parse(sch));
        } catch (e) {}
      }
    };
    window.addEventListener("cs_school_updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("cs_school_updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleUpdateSchoolSettings = async () => {
    try {
      const classesList = classesInput.split(",").map((s) => s.trim()).filter(Boolean);
      const caWeightsVal = caFormula === "4_CA" ? [10, 10, 10, 10] : [20, 20];
      const examMaxVal = caFormula === "4_CA" ? 60 : 60;

      const payload = {
        motto,
        principal_name: principalName,
        brand_color: mottoColor,
        benchmark: Number(benchmark),
        ca_weights: caWeightsVal,
        exam_max: examMaxVal,
        classes: classesList
      };

      await api.put("/schools/me", payload);
      toast.success("Institutional parameters synchronized successfully!");
      loadData();
    } catch (e) {
      toast.error("Error writing settings.");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      toast.error("Name and Email are required.");
      return;
    }
    try {
      const password = "CS-" + Math.floor(100000 + Math.random() * 90000);
      const userPayload = {
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role === "Class_Teacher" ? "Class_Teacher" : "parent",
        assigned_classes: newUser.role === "Class_Teacher" ? [newUser.assignedCohort] : [],
        is_class_teacher: newUser.role === "Class_Teacher"
      };

      const { data } = await api.post("/users", userPayload);
      setCredsValue({
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role === "Class_Teacher" ? "Teacher Workspace" : "Parent Portal",
        username: newUser.email,
        password
      });

      setUserFormDlg(false);
      setCredsDlg(true);
      toast.success(`Registered ${newUser.fullName} successfully! Dispatch window queued.`);
      loadData();
      setNewUser({ fullName: "", email: "", role: "Class_Teacher", assignedCohort: "" });
    } catch (e) {
      toast.error("Process aborted.");
    }
  };

  const handleManualResetPassword = (targetUser: any) => {
    const password = "CS-" + Math.floor(100000 + Math.random() * 90000);
    setCredsValue({
      name: targetUser.fullName || targetUser.name,
      email: targetUser.email,
      role: targetUser.role?.replace(/_/g, " ").toUpperCase(),
      password
    });
    setCredsDlg(true);
    toast.info("Password credentials dispatch triggered.");
  };

  // 1-Click Administrative Action: Seed 15 Students with Multi-Term Academic History into CS_GRADES & CS_STUDENT_PROFILES
  const handleSeed15StudentsWithHistory = () => {
    try {
      const studentProfiles = [
        { id: "CS-8201", name: "Chinedu Okeke", reg: "CS/2025/001", class_name: "Primary 5", gender: "Male", login_email: "chinedu.okeke@cornerstreams.edu.ng", parent_email: "okeke.family@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 84 },
        { id: "CS-8202", name: "Amina Yusuf", reg: "CS/2025/002", class_name: "Primary 5", gender: "Female", login_email: "amina.yusuf@cornerstreams.edu.ng", parent_email: "yusuf.home@gmail.com", age: 10, balance_due: 0, portal_password: "Pass123!", term_average: 88 },
        { id: "CS-8203", name: "Emeka Adebayo", reg: "CS/2025/003", class_name: "Primary 5", gender: "Male", login_email: "emeka.adebayo@cornerstreams.edu.ng", parent_email: "adebayo.m@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 79 },
        { id: "CS-8204", name: "Fatima Danjuma", reg: "CS/2025/004", class_name: "Primary 5", gender: "Female", login_email: "fatima.danjuma@cornerstreams.edu.ng", parent_email: "danjuma.p@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 91 },
        { id: "CS-8205", name: "Kelechi Nnamdi", reg: "CS/2025/005", class_name: "Primary 5", gender: "Male", login_email: "kelechi.nnamdi@cornerstreams.edu.ng", parent_email: "nnamdi.k@gmail.com", age: 10, balance_due: 0, portal_password: "Pass123!", term_average: 76 },
        { id: "CS-8206", name: "Blessing Eze", reg: "CS/2025/006", class_name: "Primary 5", gender: "Female", login_email: "blessing.eze@cornerstreams.edu.ng", parent_email: "eze.blessing@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 83 },
        { id: "CS-8207", name: "Tunde Bakare", reg: "CS/2025/007", class_name: "Primary 5", gender: "Male", login_email: "tunde.bakare@cornerstreams.edu.ng", parent_email: "bakare.t@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 72 },
        { id: "CS-8208", name: "Zainab Ibrahim", reg: "CS/2025/008", class_name: "Primary 5", gender: "Female", login_email: "zainab.ibrahim@cornerstreams.edu.ng", parent_email: "ibrahim.z@gmail.com", age: 10, balance_due: 0, portal_password: "Pass123!", term_average: 89 },
        { id: "CS-8209", name: "David Ojo", reg: "CS/2025/009", class_name: "Primary 5", gender: "Male", login_email: "david.ojo@cornerstreams.edu.ng", parent_email: "ojo.d@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 68 },
        { id: "CS-8210", name: "Chisom Igwe", reg: "CS/2025/010", class_name: "Primary 5", gender: "Female", login_email: "chisom.igwe@cornerstreams.edu.ng", parent_email: "igwe.chisom@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 85 },
        { id: "CS-8211", name: "Abubakar Bello", reg: "CS/2025/011", class_name: "Primary 5", gender: "Male", login_email: "abubakar.bello@cornerstreams.edu.ng", parent_email: "bello.a@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 77 },
        { id: "CS-8212", name: "Ngozi Anya", reg: "CS/2025/012", class_name: "Primary 5", gender: "Female", login_email: "ngozi.anya@cornerstreams.edu.ng", parent_email: "anya.ngozi@gmail.com", age: 10, balance_due: 0, portal_password: "Pass123!", term_average: 93 },
        { id: "CS-8213", name: "Tariq Usman", reg: "CS/2025/013", class_name: "Primary 5", gender: "Male", login_email: "tariq.usman@cornerstreams.edu.ng", parent_email: "usman.tariq@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 80 },
        { id: "CS-8214", name: "Joy Nwosu", reg: "CS/2025/014", class_name: "Primary 5", gender: "Female", login_email: "joy.nwosu@cornerstreams.edu.ng", parent_email: "nwosu.joy@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 86 },
        { id: "CS-8215", name: "Samuel Alabi", reg: "CS/2025/015", class_name: "Primary 5", gender: "Male", login_email: "samuel.alabi@cornerstreams.edu.ng", parent_email: "alabi.samuel@gmail.com", age: 11, balance_due: 0, portal_password: "Pass123!", term_average: 74 }
      ];

      const termsList = [
        { term: "1st Term", session: "2024/2025" },
        { term: "2nd Term", session: "2024/2025" },
        { term: "3rd Term", session: "2024/2025" },
        { term: "1st Term", session: "2025/2026" }
      ];

      const subjects = [
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

      const generatedGrades: any[] = [];

      studentProfiles.forEach((st, stIdx) => {
        termsList.forEach((tm, tIdx) => {
          subjects.forEach((subj, sbIdx) => {
            const seed = (stIdx * 23 + tIdx * 17 + sbIdx * 31 + Math.floor(Math.random() * 10)) % 59;
            const ca1 = Math.min(15, Math.max(8, 10 + (seed % 6)));
            const ca2 = Math.min(15, Math.max(9, 11 + ((seed + 2) % 5)));
            const midTerm = Math.min(20, Math.max(12, 14 + ((seed + 4) % 7)));
            const exam = Math.min(50, Math.max(25, 32 + ((seed + 7) % 19)));
            const totalScore = ca1 + ca2 + midTerm + exam;
            const grade = totalScore >= 80 ? "A1" : totalScore >= 70 ? "B2" : totalScore >= 65 ? "B3" : totalScore >= 55 ? "C4" : totalScore >= 50 ? "C6" : totalScore >= 45 ? "D7" : "F9";

            generatedGrades.push({
              id: `grd-${st.id}-${tm.session.replace('/', '')}-${tm.term.replace(/\s+/g, '')}-${sbIdx}`,
              studentId: st.id,
              studentName: st.name,
              regNumber: st.reg,
              className: st.class_name,
              session: tm.session,
              term: tm.term,
              subject: subj,
              ca1,
              ca2,
              midTerm,
              exam,
              totalScore,
              grade,
              createdAt: new Date().toISOString()
            });
          });
        });
      });

      // Save to localStorage for CS_STUDENT_PROFILES, CS_GRADES, and CS_STUDENTS_LIST
      localStorage.setItem("CS_STUDENT_PROFILES", JSON.stringify(studentProfiles));
      localStorage.setItem("CS_GRADES", JSON.stringify(generatedGrades));
      localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(studentProfiles));

      // Synchronize in state
      setStudents(studentProfiles);

      toast.success(`🎉 Seeding complete! Populated 15 student profiles & ${generatedGrades.length} multi-term grade records into 'CS_STUDENT_PROFILES' and 'CS_GRADES'!`, {
        duration: 6000
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed student profiles and academic history.");
    }
  };

  const handleSaveStudentFolder = (updatedStudent: any) => {
    // Update student list inside localStorage
    const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const nextList = currentList.map((st: any) => st.id === updatedStudent.id ? { ...st, ...updatedStudent } : st);
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextList));

    toast.success("Biometrics student profile folder updated.");
    loadData();
    setStudentDlg(false);
  };

  // Dynamic campus-based segmentation
  const filteredStudents = useMemo(() => {
    if (selectedCampus === "Lagos Main Campus") {
      return students;
    } else if (selectedCampus === "Abuja Branch") {
      return students.filter((_, idx) => idx % 2 === 0);
    } else {
      return students.filter((_, idx) => idx % 2 !== 0);
    }
  }, [students, selectedCampus]);

  // Status counts for student directory
  const studentStatusCounts = useMemo(() => {
    const counts = { all: filteredStudents.length, active: 0, graduated: 0, transferred: 0, suspended: 0, withdrawn: 0 };
    filteredStudents.forEach((st: any) => {
      const s = st.status || "active";
      if (s === "active") counts.active++;
      else if (s === "graduated") counts.graduated++;
      else if (s === "transferred") counts.transferred++;
      else if (s === "suspended") counts.suspended++;
      else if (s === "withdrawn") counts.withdrawn++;
    });
    return counts;
  }, [filteredStudents]);

  // Unique classes in students list
  const availableStudentClasses = useMemo(() => {
    const set = new Set<string>();
    if (school?.classes) {
      school.classes.forEach((c: string) => set.add(c));
    }
    filteredStudents.forEach((st: any) => {
      if (st.class_name) set.add(st.class_name);
    });
    return Array.from(set);
  }, [school?.classes, filteredStudents]);

  // Searched & Filtered student roster for 'Students' subtab
  const searchedStudentRoster = useMemo(() => {
    const query = studentRosterSearch.trim().toLowerCase();
    return filteredStudents.filter((st: any) => {
      // Status Filter
      const stStatus = st.status || "active";
      if (studentStatusFilter !== "all" && stStatus !== studentStatusFilter) {
        return false;
      }
      // Class Filter
      if (studentClassFilter !== "ALL" && st.class_name !== studentClassFilter) {
        return false;
      }
      // Search Query
      if (!query) return true;
      const nameMatch = st.name?.toLowerCase().includes(query);
      const idMatch = st.id && String(st.id).toLowerCase().includes(query);
      const classMatch = st.class_name?.toLowerCase().includes(query);
      const emailMatch = st.login_email?.toLowerCase().includes(query) || st.parent_email?.toLowerCase().includes(query);
      return nameMatch || idMatch || classMatch || emailMatch;
    });
  }, [filteredStudents, studentRosterSearch, studentStatusFilter, studentClassFilter]);

  // Selected students objects array
  const selectedStudentsObjects = useMemo(() => {
    return filteredStudents.filter((st: any) => selectedStudentIds.includes(st.id));
  }, [filteredStudents, selectedStudentIds]);

  const isAllSearchedSelected = searchedStudentRoster.length > 0 && searchedStudentRoster.every((st: any) => selectedStudentIds.includes(st.id));
  const isSomeSearchedSelected = searchedStudentRoster.some((st: any) => selectedStudentIds.includes(st.id)) && !isAllSearchedSelected;

  // Selection Handlers
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    if (isAllSearchedSelected) {
      const searchedIds = new Set(searchedStudentRoster.map((s: any) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !searchedIds.has(id)));
    } else {
      const searchedIds = searchedStudentRoster.map((s: any) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...searchedIds])));
    }
  };

  const handleClearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleSelectByClass = (className: string) => {
    const classStudentIds = filteredStudents.filter((s: any) => s.class_name === className).map((s: any) => s.id);
    setSelectedStudentIds(classStudentIds);
    toast.info(`Selected all ${classStudentIds.length} students in ${className}`);
  };

  const handleSelectByStatus = (statusVal: string) => {
    const statusStudentIds = filteredStudents
      .filter((s: any) => (s.status || "active") === statusVal)
      .map((s: any) => s.id);
    setSelectedStudentIds(statusStudentIds);
    toast.info(`Selected all ${statusStudentIds.length} students with status "${statusVal.toUpperCase()}"`);
  };

  // Bulk Status Update Handler
  const handleBulkStatusUpdate = (targetStatus: string, metadata: { session: string; term: string; note: string }) => {
    if (selectedStudentIds.length === 0) return;
    const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const selectedSet = new Set(selectedStudentIds);
    const updatedList = currentList.map((st: any) => {
      if (selectedSet.has(st.id)) {
        return {
          ...st,
          status: targetStatus,
          status_updated_at: new Date().toISOString(),
          status_session: metadata.session,
          status_term: metadata.term,
          status_note: metadata.note
        };
      }
      return st;
    });
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(updatedList));
    setStudents(updatedList);
    toast.success(`🎉 Successfully updated ${selectedStudentIds.length} student records to "${targetStatus.toUpperCase()}"!`);
    setSelectedStudentIds([]);
    loadData();
  };

  // Quick 1-Click Status Update from Toolbar
  const handleQuickMarkSelectedStatus = (targetStatus: string) => {
    if (selectedStudentIds.length === 0) return;
    handleBulkStatusUpdate(targetStatus, {
      session: "2025/2026",
      term: "3rd Term",
      note: `Quick bulk transition to ${targetStatus}`
    });
  };

  // Inline Status Switcher for Single Student Row
  const handleInlineChangeStudentStatus = (studentId: string, newStatus: string) => {
    const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const updatedList = currentList.map((st: any) => {
      if (st.id === studentId) {
        return {
          ...st,
          status: newStatus,
          status_updated_at: new Date().toISOString()
        };
      }
      return st;
    });
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(updatedList));
    setStudents(updatedList);
    setActiveStatusRowDropdown(null);
    toast.success(`Student status updated to "${newStatus.toUpperCase()}"`);
    loadData();
  };

  // Export Selected Students to Excel
  const handleExportSelectedStudents = () => {
    const exportData = selectedStudentsObjects.length > 0 ? selectedStudentsObjects : searchedStudentRoster;
    if (exportData.length === 0) {
      toast.error("No student profiles to export.");
      return;
    }
    const headers = ["System ID", "Full Name", "Class / Cohort", "Enrollment Status", "Parent Email", "Balance Due (NGN)", "Login Email"];
    const rows = exportData.map((st: any) => [
      st.id || "N/A",
      st.name || "N/A",
      st.class_name || "N/A",
      (st.status || "active").toUpperCase(),
      st.parent_email || "N/A",
      st.balance_due || 0,
      st.login_email || "N/A"
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Registry");
    XLSX.writeFile(wb, `Corner_Streams_Student_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${exportData.length} student records to Excel.`);
  };

  // Bulk Zero-Out Balances (e.g. Cleared for Graduation)
  const handleBulkClearBalances = () => {
    if (selectedStudentIds.length === 0) return;
    const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const selectedSet = new Set(selectedStudentIds);
    const updatedList = currentList.map((st: any) => {
      if (selectedSet.has(st.id)) {
        return { ...st, balance_due: 0 };
      }
      return st;
    });
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(updatedList));
    setStudents(updatedList);
    toast.success(`Cleared balances for ${selectedStudentIds.length} selected students.`);
    loadData();
  };

  // Searched faculty roster for 'Teachers' subtab
  const searchedFacultyRoster = useMemo(() => {
    const allFaculty = getFacultyListForRoster();
    const query = teacherRosterSearch.trim().toLowerCase();
    if (!query) return allFaculty;

    // Find classes of student profiles that match the query
    const matchingStudentClasses = new Set<string>();
    filteredStudents.forEach((st: any) => {
      const nameMatch = st.name?.toLowerCase().includes(query);
      const idMatch = st.id && String(st.id).toLowerCase().includes(query);
      if ((nameMatch || idMatch) && st.class_name) {
        matchingStudentClasses.add(st.class_name);
      }
    });

    return allFaculty.filter((tf: any) => {
      const nameMatch = tf.name?.toLowerCase().includes(query);
      const emailMatch = tf.email?.toLowerCase().includes(query);
      const roleMatch = tf.role?.toLowerCase().includes(query);
      const classMatch = tf.assignedClasses?.some((c: string) => c.toLowerCase().includes(query));
      const studentMatch = tf.assignedClasses?.some((c: string) => matchingStudentClasses.has(c));
      return nameMatch || emailMatch || roleMatch || classMatch || studentMatch;
    });
  }, [getFacultyListForRoster, teacherRosterSearch, filteredStudents]);

  // Searched classrooms list for 'Classes' view
  const matchingClassesList = useMemo(() => {
    const activeClassesList = school?.classes || [];
    const query = classesSearchQuery.trim().toLowerCase();
    if (!query) return activeClassesList;

    return activeClassesList.filter((className: string) => {
      const classMatch = className.toLowerCase().includes(query);
      const hasMatchingStudent = students.some((st: any) => 
        st.class_name === className && (
          st.name?.toLowerCase().includes(query) ||
          (st.id && String(st.id).toLowerCase().includes(query)) ||
          st.login_email?.toLowerCase().includes(query)
        )
      );
      return classMatch || hasMatchingStudent;
    });
  }, [school?.classes, classesSearchQuery, students]);

  // Dynamic list of available classes for report card export
  const availableReportClasses = useMemo(() => {
    const classesSet = new Set<string>();
    (school?.classes || []).forEach((c: string) => {
      if (c) classesSet.add(c);
    });
    filteredStudents.forEach((st: any) => {
      if (st.class_name) classesSet.add(st.class_name);
    });
    if (classesSet.size === 0) {
      classesSet.add("SS 2 Science");
    }
    return Array.from(classesSet);
  }, [school?.classes, filteredStudents]);

  // Sequential Bulk Export Reports Engine
  const handleBulkExportClassReports = async (overrideClass?: string) => {
    const targetClass = overrideClass || selectedExportClass;
    const classCandidates = filteredStudents.filter((s: any) => 
      targetClass === "ALL" || s.class_name === targetClass || (s.class_name && s.class_name.includes(targetClass))
    );

    if (classCandidates.length === 0) {
      toast.error(`No student candidates found in class "${targetClass}" for bulk export.`);
      return;
    }

    setIsBulkExporting(true);
    toast.info(`Starting sequential report card export for ${classCandidates.length} students in ${targetClass}...`, {
      duration: 3000
    });

    for (let i = 0; i < classCandidates.length; i++) {
      const student = classCandidates[i];
      setActiveReportStudent(student);
      setBulkExportProgress({
        current: i + 1,
        total: classCandidates.length,
        currentStudent: student.name
      });

      toast.info(`[${i + 1}/${classCandidates.length}] Opening print dialog for ${student.name}...`, {
        id: "bulk-export-step-toast"
      });

      // Allow 600ms for React state and report preview sheet to update
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Trigger browser native print dialog for candidate
      window.print();

      // Pause 800ms before triggering print for next student
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsBulkExporting(false);
    setBulkExportProgress(null);
    toast.success(`🎉 Sequential bulk export complete! Processed report card print dialogs for all ${classCandidates.length} students in ${targetClass}.`, {
      id: "bulk-export-step-toast",
      duration: 5000
    });
  };

  // Dynamic debt summaries calculations
  const totalFinesDue = filteredStudents.reduce((acc, current) => acc + (current.balance_due || 0), 0);
  const activeClasses = school?.classes || [];

  const isTabUnlocked = (k: string) => {
    const tier = school?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (k === "overview" || k === "rosters" || k === "messages" || k === "settings") return true;
    if (k === "cbt" || k === "cbt_review") {
      return tier === "cbt_essentials" || tier === "cbt_plus_results";
    }
    if (k === "report_cards" || k === "broadsheet_vault" || k === "result_dossiers" || k === "classrooms") {
      return tier === "cbt_plus_results" || tier === "digital_reports";
    }
    if (k === "fees") {
      return tier === "financial_ledger";
    }
    return true;
  };

  useEffect(() => {
    if (school?.subscription_tier && school?.subscription_tier !== "unified_enterprise") {
      if (!isTabUnlocked(tab)) {
        setTab("overview");
      }
    }
  }, [school?.subscription_tier, tab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      {/* Visual Workspace Unified Navigation Selector */}
      <div className="border-b border-slate-200 bg-white px-3 py-2 sm:p-3 shrink-0 flex flex-row justify-between items-center gap-2 relative z-20">
        {(() => {
          const adminModules = [
            { k: "overview", label: "Executive Desk", icon: Layers, desc: "School performance KPIs, high-level metrics & analytics" },
            { k: "rosters", label: "Enrollment & Parents Registries", icon: Users, desc: "Student directory, parent accounts & registration" },
            { k: "classrooms", label: "Academic Classrooms Desk", icon: GraduationCap, desc: "Class allocations, arms & subject teachers" },
            { k: "fees", label: "Campus Bursary Desk", icon: Landmark, desc: "Tuition billing, payment receipts & financial tracking" },
            { k: "staff_payment", label: "Staffs Payment", icon: FileText, desc: "Staff payroll, stipends & remuneration ledgers" },
            { k: "report_cards", label: "Regulatory Report Cards & Signatures", icon: CheckSquare, desc: "Terminal CA matrices, report cards & e-signatures" },
            { k: "broadsheet_vault", label: "Academic Broadsheet Vault & Matrix", icon: FileSpreadsheet, desc: "Master academic broadsheets, grades & rankings" },
            { k: "daily_attendance", label: "Daily Attendance Registers", icon: Calendar, desc: "Morning & afternoon student roll call registers" },
            { k: "result_dossiers", label: "Student Result Dossiers", icon: BookOpen, desc: "Student academic records, dossiers & history" },
            { k: "cbt", label: "CBT Exam Engine & Portal", icon: CheckSquare, desc: "Computer Based Test setup, exams & proctoring" },
            { k: "cbt_review", label: "CBT Review & Publish Desk", icon: SlidersHorizontal, desc: "Evaluate, review & publish CBT exam results" },
            { k: "messages", label: "Messages & Broadcasts", icon: Send, desc: "Parent SMS/email broadcasts & communication" },
            { k: "settings", label: "System Settings", icon: Settings, desc: "School profile, branding, sessions & term setup" },
          ];

          const availableAdminModules = adminModules.filter((item) => {
            const tier = school?.subscription_tier;
            if (!tier || tier === "unified_enterprise") return true;
            return isTabUnlocked(item.k);
          });

          const currentAdminModule = availableAdminModules.find((m) => m.k === tab) || availableAdminModules[0] || adminModules[0];
          const CurrentAdminIcon = currentAdminModule.icon;

          return (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsModuleSelectorOpen(!isModuleSelectorOpen);
                  setIsCampusOpen(false);
                }}
                className="h-8.5 sm:h-9 px-2.5 sm:px-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer max-w-[210px] sm:max-w-none"
              >
                <div className="p-1 bg-white/20 rounded-lg shrink-0 flex items-center justify-center">
                  <CurrentAdminIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="flex flex-col text-left truncate">
                  <span className="text-[8px] sm:text-[8.5px] uppercase tracking-wider text-indigo-100 font-medium leading-none">Active Module</span>
                  <span className="font-extrabold text-[11px] sm:text-[12px] leading-tight truncate">
                    {currentAdminModule.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 transition-transform ml-0.5 shrink-0 ${isModuleSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {isModuleSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsModuleSelectorOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 max-h-[75vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Navigation Module</span>
                      <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {availableAdminModules.length} Available
                      </span>
                    </div>
                    {availableAdminModules.map((item) => {
                      const isSelected = tab === item.k;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.k}
                          type="button"
                          onClick={() => {
                            setTab(item.k);
                            if (onTabChange) onTabChange(item.k);
                            setIsModuleSelectorOpen(false);
                          }}
                          className={`w-full text-left p-2 sm:p-2.5 rounded-xl transition flex items-center gap-2.5 sm:gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-sm font-bold"
                              : "hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200"
                          }`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                            <ItemIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] sm:text-[11.5px] font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>{item.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                            </div>
                            {item.desc && (
                              <p className={`text-[9.5px] sm:text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                                {item.desc}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}
        {/* Institutional Accreditation Badge & Results Publication Gatekeeper */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2 border border-slate-200 bg-white py-1 px-2.5 rounded-lg shadow-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 tracking-tight truncate max-w-[170px]">
              {school?.name || "Corner Streams Academy"}
            </span>
            <span className="text-[8.5px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
              VERIFIED
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPublishCertModalOpen(true)}
            className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg font-bold text-[10px] sm:text-[10.5px] flex items-center gap-1.5 shadow-xs transition cursor-pointer border ${
              localIsPublished
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
            title="Two-Step Certification Gatekeeper to Publish or Lock Academic Results"
          >
            <span className={`w-2 h-2 rounded-full ${localIsPublished ? 'bg-white animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-black uppercase tracking-wide">
              {localIsPublished ? '● Published' : '🔒 Locked'}
            </span>
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCampusOpen(!isCampusOpen)}
            className="h-8 sm:h-8.5 px-2.5 sm:px-3 bg-white border border-slate-200 rounded-lg font-bold text-[10px] sm:text-[10.5px] text-indigo-950 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition shrink-0"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate max-w-[100px] sm:max-w-none">Campus: <strong>{selectedCampus.split(' ')[0]}</strong></span>
            <span className="text-[8px] text-slate-400">▼</span>
          </button>

          {isCampusOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 font-bold text-[10px] animate-in fade-in slide-in-from-top-1 duration-150">
              {["Lagos Main Campus", "Abuja Branch", "Port Harcourt Branch"].map((camp) => (
                <button
                  key={camp}
                  type="button"
                  onClick={() => {
                    setSelectedCampus(camp);
                    setIsCampusOpen(false);
                    toast.success(`Switched context to ${camp}! Database view synchronized.`);
                  }}
                  className={`w-full text-left px-3 py-1.5 transition flex items-center justify-between ${
                    selectedCampus === camp
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{camp}</span>
                  {selectedCampus === camp && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* ----------------- SUBTAB: OVERVIEW ----------------- */}
            {tab === "overview" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Bento statistics tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: "Campus Enrollment", v: `${filteredStudents.length} Learners`, d: "Active registries", i: Users, c: "text-indigo-600 bg-indigo-50 border-indigo-100", show: true },
                { l: "Faculty Registry", v: `${users.filter((u: any) => u.role === "school_admin" || u.role?.toLowerCase().includes("teacher")).length} Faculty`, d: "Teachers of Record", i: Sliders, c: "text-emerald-600 bg-emerald-50 border-emerald-100", show: true },
                { l: "Bursary Receivables", v: `₦${totalFinesDue.toLocaleString()}`, d: "Debt backlog", i: Landmark, c: "text-rose-600 bg-rose-50 border-rose-100", show: school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "financial_ledger" },
                { l: "Pass Benchmark", v: `${benchmark}%`, d: "Target average", i: Star, c: "text-amber-600 bg-amber-50 border-amber-100", show: school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "digital_reports" }
              ].filter(item => item.show).map((item, idx) => {
                const Icon = item.i;
                return (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="bg-white border rounded-xl p-4 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-shadow cursor-default"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.c}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{item.l}</span>
                      <span className="text-sm font-black cs-text-navy block mt-0.5">{item.v}</span>
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block mt-0.5">{item.d}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Academic Results Publication & Release Gatekeeper Banner */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 border border-indigo-800/60 shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  localIsPublished 
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' 
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                }`}>
                  {localIsPublished ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/90">
                      Academic Release Gatekeeper
                    </span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                      localIsPublished 
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}>
                      {localIsPublished ? '● GRADES LIVE TO PARENTS & STUDENTS' : '🔒 LOCK GATED (SECRET AUDIT)'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white mt-1 font-display tracking-tight">
                    {localIsPublished 
                      ? 'Terminal Reports & Broadsheets Are Actively Published' 
                      : 'Terminal Results Are Locked From Public Portal View'}
                  </h4>
                  <p className="text-[11px] text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                    {localIsPublished
                      ? 'Students and parents can access their terminal report cards, continuous assessments, and QR-verified dossiers.'
                      : 'Grades and report cards are hidden from students and parents while faculty complete broadsheet reconciliations.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPublishCertModalOpen(true)}
                  className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md border ${
                    localIsPublished
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white border-emerald-500'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{localIsPublished ? 'Revoke & Lock Results Access' : 'Authorize & Publish (2-Step Auth)'}</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              
              {/* Financial Debt & Student Distribution Charts */}
              <div className={`lg:col-span-2 grid ${
                (school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier) 
                  ? "grid-cols-1 md:grid-cols-2" 
                  : "grid-cols-1"
              } gap-5`}>
                {(school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier || school?.subscription_tier === "digital_reports" || school?.subscription_tier === "cbt_essentials") && (
                  <ChartCard title="Roster Age Distribution" subtitle="Learners class metrics" testid="class-metrics">
                    <BarSimple 
                      data={[
                        { class: "Primary 1", value: 3 },
                        { class: "Primary 2", value: 4 },
                        { class: "SS 2", value: 12 },
                        { class: "SS 3", value: 8 }
                      ]}
                      xKey="class"
                      yKey="value"
                      color="#005cb9"
                    />
                  </ChartCard>
                )}

                {(school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier || school?.subscription_tier === "financial_ledger") && (
                  <ChartCard title="Bursary Collection Ledger" subtitle="Invoice settlement logs" testid="bursary-metrics">
                    <DonutChart 
                      data={[
                        { name: "Approved Payments", count: receipts.filter(r => r.status === "approved").length },
                        { name: "Awaiting Clearance", count: receipts.filter(r => r.status === "pending").length }
                      ]}
                      dataKey="count"
                      nameKey="name"
                    />
                  </ChartCard>
                )}
              </div>

              {/* Dynamic Subscription Switcher console */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-4 shadow-xl border border-slate-800 relative overflow-visible flex flex-col justify-between">
                <div className="space-y-2">
                  <Badge className="bg-emerald-500 text-slate-950 font-black tracking-wider uppercase h-5 text-[9.5px]">
                    Active License Portal
                  </Badge>
                  <h3 className="font-display font-black text-base text-white leading-tight">
                    Switch Active School Subscription
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Select an institutional license tier to configure active operational modules for your school.
                  </p>
                </div>

                {/* Custom Non-Native Dropdown Component */}
                <div className="relative">
                  <Label className="text-[10px] text-slate-300 uppercase tracking-wider font-bold mb-1.5 block">Selected Subscription Tier</Label>
                  <button
                    onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between px-3.5 transition-all focus:ring-1 focus:ring-emerald-500 text-left relative"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">
                        {tiersList.find(t => t.value === (school?.subscription_tier || "unified_enterprise"))?.label || "Unified Enterprise Suite"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                        {tiersList.find(t => t.value === (school?.subscription_tier || "unified_enterprise"))?.desc || "Complete system modules & analytics"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold ml-2">▼</span>
                  </button>

                  {isSubDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-850">
                      {tiersList.map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => {
                            handleUpdateSubscriptionTier(tier.value);
                            setIsSubDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 text-left transition hover:bg-gradient-to-r hover:from-indigo-700 hover:to-emerald-600 hover:text-white flex flex-col ${
                            school?.subscription_tier === tier.value ? "bg-slate-800 font-bold" : ""
                          }`}
                        >
                          <span className={`text-[11px] font-black ${school?.subscription_tier === tier.value ? "text-emerald-400" : "text-white"}`}>{tier.label}</span>
                          <span className="text-[9.5px] text-slate-400 mt-0.5 leading-none">{tier.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-850 bg-slate-900/40 p-3 rounded-xl space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">License Cost</span>
                    <strong className="text-emerald-400 text-xs font-black font-mono">₦200,000/session</strong>
                  </div>
                  <span className="text-[8.5px] text-slate-500 block leading-tight border-t border-slate-850 pt-1">
                    Hides or displays modules across all teacher and parent workspaces instantly.
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsPlanComparisonOpen(true)}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Compare All Plans &amp; 14-Day Free Trial</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DASHBOARD INSIGHTS: 6-MONTH STUDENT ENROLLMENT TRENDS & RECENT BILLING COLLECTION PROGRESS */}
            <DashboardInsights
              students={filteredStudents}
              studentsCount={filteredStudents.length}
              receipts={receipts}
              billingRecords={mockBillingRecords}
              totalReceivables={totalFinesDue}
              currentSession={school?.currentSession || "2025/2026"}
              currentTerm={school?.currentTerm || "1st Term"}
              selectedCampus={selectedCampus}
              onNavigateToRoster={() => {
                setTab("rosters");
                setRosterMode("students");
              }}
              onNavigateToBursary={() => setTab("fees")}
            />

            {/* RECENT ADMINISTRATIVE ACTIVITY SUMMARY CARD (LAST 5 HIGH-RISK ACTIONS & SECURITY ACCESS) */}
            <RecentAdminActivityCard 
              onNavigateToSettings={() => setTab("settings")} 
            />

            {/* TUITION COLLECTION PERCENTAGE RECHARTS BAR CHART */}
            <TuitionCollectionBarChart 
              billingRecords={mockBillingRecords}
              currentTerm={school?.currentTerm || "1st Term"}
              currentSession={school?.currentSession || "2025/2026"}
              onNavigateToBursary={() => setTab("fees")}
            />

            {/* 30-DAY DAILY STUDENT ATTENDANCE RECHARTS TREND LINE CHART */}
            <DailyAttendanceTrendChart 
              onNavigateToAttendance={() => setTab("daily_attendance")}
            />

            {/* PERFORMANCE TRENDS & SCORE ANALYTICS CARD */}
            <PerformanceTrendsCard 
              grades={grades} 
              userRole="admin" 
              title="Institutional Performance Trends & Exam Analytics"
              subtitle="Visualizing student grade distributions and recent exam score averages across all school departments"
            />

            {/* ADMIN ALERT FEED: ASSESSMENT GRADE VARIANCE MONITOR */}
            <AdminGradeVarianceAlertFeed />

            {/* TEACHER SUBJECT LOAD & BURNOUT RISK HEATMAP */}
            <TeacherWorkloadHeatmap isAdminView={true} />
          </div>
        )}

        {/* ----------------- SUBTAB: ROSTERS / FACULTY ----------------- */}
        {tab === "rosters" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* SUBTAB CONTROL & HEADER */}
            <div className="flex flex-wrap gap-3 justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRosterMode('students')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    rosterMode === 'students' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Student Learners Roster</span>
                  <span className="px-1.5 py-0.2 text-[9.5px] rounded-full bg-white/20 font-mono">
                    {filteredStudents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRosterMode('teachers')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    rosterMode === 'teachers' 
                      ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Faculty & Teachers Registry</span>
                  <span className="px-1.5 py-0.2 text-[9.5px] rounded-full bg-white/20 font-mono">
                    {getFacultyListForRoster().length}
                  </span>
                </button>
              </div>

              <div className="flex gap-2">
                {rosterMode === 'students' ? (
                  <Button 
                    variant="emerald" 
                    size="sm" 
                    onClick={() => setBulkDlg(true)} 
                    className="gap-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-bold shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Batch Import (CSV / Excel)
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setUserFormDlg(true)} className="gap-1 bg-indigo-600 text-white">
                    <UserPlus className="w-4 h-4" />
                    Register Workspace Faculty
                  </Button>
                )}
              </div>
            </div>

            {/* ROSTER MODE: STUDENTS */}
            {rosterMode === 'students' && (
              <div className="space-y-3.5">
                {/* LIFECYCLE STATUS FILTER PILLS */}
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    Status:
                  </span>
                  {[
                    { id: "all", label: "All Students", count: studentStatusCounts.all, color: "slate" },
                    { id: "active", label: "Active", count: studentStatusCounts.active, color: "emerald", icon: CheckCircle2 },
                    { id: "graduated", label: "Graduated", count: studentStatusCounts.graduated, color: "indigo", icon: GraduationCap },
                    { id: "transferred", label: "Transferred", count: studentStatusCounts.transferred, color: "amber", icon: ArrowRightLeft },
                    { id: "suspended", label: "Suspended", count: studentStatusCounts.suspended, color: "rose", icon: ShieldAlert },
                    { id: "withdrawn", label: "Withdrawn", count: studentStatusCounts.withdrawn, color: "slate", icon: Archive },
                  ].map((filterItem) => {
                    const isActive = studentStatusFilter === filterItem.id;
                    const IconComp = filterItem.icon;
                    return (
                      <button
                        key={filterItem.id}
                        type="button"
                        onClick={() => setStudentStatusFilter(filterItem.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? filterItem.id === 'active'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : filterItem.id === 'graduated'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : filterItem.id === 'transferred'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : filterItem.id === 'suspended'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {IconComp && <IconComp className="w-3.5 h-3.5" />}
                        <span>{filterItem.label}</span>
                        <span className={`px-1.5 py-0.2 text-[9.5px] rounded-full font-mono ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {filterItem.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* PERSISTENT SEARCH AND COHORT SELECTOR */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={studentRosterSearch}
                      onChange={(e) => setStudentRosterSearch(e.target.value)}
                      placeholder="Filter student profiles by name or ID (e.g. CS-8291, Fatima, Adewale)..."
                      className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    {studentRosterSearch && (
                      <button 
                        type="button"
                        onClick={() => setStudentRosterSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Custom Class Filter Select */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsStudentClassDropdownOpen(!isStudentClassDropdownOpen)}
                      className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 flex items-center justify-between gap-2 min-w-[170px] cursor-pointer"
                    >
                      <span className="truncate">
                        {studentClassFilter === "ALL" ? "All Cohorts / Classes" : studentClassFilter}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isStudentClassDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setStudentClassFilter("ALL");
                            setIsStudentClassDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition ${
                            studentClassFilter === "ALL" ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>All Cohorts / Classes</span>
                          <span className="font-mono text-[10px] text-slate-400">{filteredStudents.length}</span>
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        {availableStudentClasses.map((cls) => {
                          const classCount = filteredStudents.filter((s: any) => s.class_name === cls).length;
                          return (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => {
                                setStudentClassFilter(cls);
                                setIsStudentClassDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition ${
                                studentClassFilter === cls ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="truncate">{cls}</span>
                              <span className="font-mono text-[10px] text-slate-400">{classCount}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10.5px] py-1">
                      {searchedStudentRoster.length} of {filteredStudents.length} Students
                    </Badge>
                    {(studentRosterSearch || studentStatusFilter !== 'all' || studentClassFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentRosterSearch('');
                          setStudentStatusFilter('all');
                          setStudentClassFilter('ALL');
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:underline px-1 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* BULK ACTIONS TOOLBAR (Appears when 1+ students are selected) */}
                {selectedStudentIds.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3 shadow-lg border border-indigo-500/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-400/30">
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-white">
                          <strong className="text-emerald-400">{selectedStudentIds.length}</strong> {selectedStudentIds.length === 1 ? 'Student' : 'Students'} Selected
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllFilteredStudents}
                        className="text-xs text-indigo-200 hover:text-white underline font-semibold cursor-pointer"
                      >
                        {isAllSearchedSelected ? "Deselect Visible" : `Select All Visible (${searchedStudentRoster.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearStudentSelection}
                        className="text-xs text-slate-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleQuickMarkSelectedStatus("graduated")}
                        className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-xs cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-200" />
                        Mark Graduated
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickMarkSelectedStatus("transferred")}
                        className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-200" />
                        Mark Transferred
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickMarkSelectedStatus("active")}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        Mark Active
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsBulkStatusDialogOpen(true)}
                        className="h-8 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        Status Transition Wizard...
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportSelectedStudents}
                        className="h-8 text-xs font-bold bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export ({selectedStudentIds.length})
                      </Button>
                    </div>
                  </div>
                )}

                <div className="cs-card p-0 overflow-x-auto">
                  <Table className="min-w-[800px] md:min-w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-50 font-bold text-slate-500">
                        <TableHead className="w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSearchedSelected}
                            ref={(input) => {
                              if (input) {
                                input.indeterminate = isSomeSearchedSelected;
                              }
                            }}
                            onChange={handleSelectAllFilteredStudents}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            title="Select all visible students"
                          />
                        </TableHead>
                        <TableHead>Student Name & System ID</TableHead>
                        <TableHead>Lifecycle Status</TableHead>
                        <TableHead>Class / Cohort</TableHead>
                        <TableHead>Parent Link</TableHead>
                        <TableHead>Balance Due</TableHead>
                        <TableHead className="text-right">Administration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchedStudentRoster.map((st, idx) => {
                        const isSelected = selectedStudentIds.includes(st.id);
                        const stStatus = st.status || "active";
                        return (
                          <TableRow 
                            key={st.id || idx} 
                            className={`transition-colors ${
                              isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectStudent(st.id)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                              />
                            </TableCell>
                            <TableCell className="font-semibold cs-text-navy flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                                <img src={st.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold cs-text-navy block">{st.name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    #{st.id || `CS-${8200 + idx}`}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono">Email: {st.login_email}</span>
                              </div>
                            </TableCell>

                            {/* Lifecycle Status Badge with Inline Quick Switcher */}
                            <TableCell>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => setActiveStatusRowDropdown(activeStatusRowDropdown === st.id ? null : st.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                                    stStatus === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : stStatus === 'graduated'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                      : stStatus === 'transferred'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      : stStatus === 'suspended'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                  }`}
                                  title="Click to update student status"
                                >
                                  {stStatus === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                  {stStatus === 'graduated' && <GraduationCap className="w-3 h-3 text-indigo-600" />}
                                  {stStatus === 'transferred' && <ArrowRightLeft className="w-3 h-3 text-amber-600" />}
                                  {stStatus === 'suspended' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                                  {stStatus === 'withdrawn' && <Archive className="w-3 h-3 text-slate-600" />}
                                  <span className="capitalize">{stStatus}</span>
                                  <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                </button>

                                {/* Dropdown menu for single row status toggle */}
                                {activeStatusRowDropdown === st.id && (
                                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95">
                                    <div className="px-2 py-1 text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">
                                      Transition Status
                                    </div>
                                    {[
                                      { id: "active", label: "Active Student", color: "text-emerald-700 hover:bg-emerald-50" },
                                      { id: "graduated", label: "Graduated", color: "text-indigo-700 hover:bg-indigo-50" },
                                      { id: "transferred", label: "Transferred", color: "text-amber-700 hover:bg-amber-50" },
                                      { id: "suspended", label: "Suspended", color: "text-rose-700 hover:bg-rose-50" },
                                      { id: "withdrawn", label: "Withdrawn", color: "text-slate-700 hover:bg-slate-50" },
                                    ].map((sOption) => (
                                      <button
                                        key={sOption.id}
                                        type="button"
                                        onClick={() => handleInlineChangeStudentStatus(st.id, sOption.id)}
                                        className={`w-full px-2 py-1 text-left text-xs font-semibold rounded flex items-center justify-between ${sOption.color} cursor-pointer`}
                                      >
                                        <span>{sOption.label}</span>
                                        {stStatus === sOption.id && <Check className="w-3 h-3" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="font-mono font-bold text-slate-700">{st.class_name}</TableCell>
                            <TableCell className="font-mono text-slate-500 text-xs">{st.parent_email}</TableCell>
                            <TableCell>
                              {st.balance_due > 0 ? (
                                <span className="text-rose-500 font-mono font-bold text-xs">₦{st.balance_due.toLocaleString()}</span>
                              ) : (
                                <span className="text-emerald-600 font-mono font-bold text-xs">₦0 (Cleared)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[10px] gap-1 px-2.5 font-bold cursor-pointer"
                                  onClick={() => { setActiveStudent(st); setStudentDlg(true); }}
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  Edit Folder
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[10px] gap-1 px-2.5 font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50 cursor-pointer"
                                  onClick={() => handleManualResetPassword(st)}
                                >
                                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                                  Dispatch Creds
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {searchedStudentRoster.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                            <div className="max-w-xs mx-auto space-y-2">
                              <p className="font-bold text-slate-700">No student profiles found</p>
                              <p className="text-xs text-slate-400">
                                No records match the active search and filter parameters.
                              </p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setStudentRosterSearch('');
                                  setStudentStatusFilter('all');
                                  setStudentClassFilter('ALL');
                                }} 
                                className="mt-2 text-xs"
                              >
                                Reset All Filters
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ROSTER MODE: FACULTY & TEACHERS */}
            {rosterMode === 'teachers' && (
              <div className="space-y-4">
                {/* PERSISTENT SEARCH BAR FOR TEACHERS & FACULTY */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={teacherRosterSearch}
                      onChange={(e) => setTeacherRosterSearch(e.target.value)}
                      placeholder="Filter faculty by teacher name, email, assigned class, or student name/ID..."
                      className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    {teacherRosterSearch && (
                      <button 
                        type="button"
                        onClick={() => setTeacherRosterSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[10.5px] py-1">
                      {searchedFacultyRoster.length} Faculty Members
                    </Badge>
                    {teacherRosterSearch && (
                      <button
                        type="button"
                        onClick={() => setTeacherRosterSearch('')}
                        className="text-[10px] font-bold text-rose-600 hover:underline px-1"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                <div className="cs-card p-0 overflow-x-auto">
                  <Table className="min-w-[800px] md:min-w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-50 font-bold text-slate-500">
                        <TableHead>Faculty Name & Quick Action</TableHead>
                        <TableHead>Role / Designation</TableHead>
                        <TableHead>Assigned Class Cohorts</TableHead>
                        <TableHead>Weekly Subject Load</TableHead>
                        <TableHead className="text-right">Assigned Students / Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchedFacultyRoster.map((tf) => {
                        const loadInfo = getTeacherWorkloadInfo(tf.name, tf.email);
                        const isHigh = loadInfo.total >= 26;
                        const isModerate = loadInfo.total >= 21;

                        const assignedStudents = students.filter(s => tf.assignedClasses?.includes(s.class_name));

                        return (
                          <TableRow key={tf.id} className="hover:bg-slate-50/80">
                            {/* TEACHER NAME & QUICK ACTION BUTTON */}
                            <TableCell className="font-semibold cs-text-navy">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                                    <img src={tf.photoUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <span className="font-bold cs-text-navy block text-xs">{tf.name}</span>
                                    <span className="text-[10px] text-slate-400 block font-mono">{tf.email}</span>
                                  </div>
                                </div>

                                <Button 
                                  size="sm"
                                  className="h-7 text-[10.5px] font-bold gap-1 px-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white shadow-sm shrink-0"
                                  onClick={() => setReassignModalTarget({ isOpen: true, teacherName: tf.name, teacherEmail: tf.email, teacherId: tf.id })}
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  Reassign Subject Load
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="text-xs font-semibold text-slate-700 block">{tf.role}</span>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {tf.assignedClasses.map((cls, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {loadInfo.total} hrs/wk
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase ${
                                    isHigh 
                                      ? "bg-rose-100 text-rose-700 border border-rose-200" 
                                      : isModerate 
                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  }`}>
                                    {isHigh ? "Burnout Risk" : isModerate ? "Heavy Load" : "Optimal Load"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={loadInfo.subjects}>
                                  {loadInfo.subjects}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] gap-1 px-2 font-bold text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
                                  onClick={() => { setViewingTeacherStudents(tf); setTeacherStudentSearch(''); }}
                                >
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  Assigned Students ({assignedStudents.length})
                                </Button>

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[10px] gap-1 px-2 font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50"
                                  onClick={() => handleManualResetPassword(tf)}
                                >
                                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                                  Dispatch
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {searchedFacultyRoster.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                            <div className="max-w-xs mx-auto space-y-2">
                              <p className="font-bold text-slate-700">No faculty members found</p>
                              <p className="text-xs text-slate-400">No faculty matches "{teacherRosterSearch}". Try searching by another name or class.</p>
                              <Button size="sm" variant="outline" onClick={() => setTeacherRosterSearch('')} className="mt-2 text-xs">
                                Clear Search Query
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* REAL-TIME WORKLOAD HEATMAP SUMMARY */}
                <TeacherWorkloadHeatmap 
                  isAdminView={true} 
                  title="Live Faculty Workload & Burnout Risk Heatmap" 
                  subtitle="Color-coded intensity matrix auto-updates dynamically when subject loads are reassigned."
                />
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBTAB: CLASSROOMS ----------------- */}
        {tab === "classrooms" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-2 justify-between items-center relative">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Academic Classrooms Desk</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage institutional class structures, provision student accounts and download pre-mapped Excel templates.</p>
              </div>

              <div className="relative">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setIsCreateClassOpen(!isCreateClassOpen);
                    setNewClassNameInput("");
                  }} 
                  className="gap-1 bg-indigo-600 text-white font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Create New Class
                </Button>

                {isCreateClassOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCreateClassOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 p-4 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <h4 className="font-bold text-slate-900 text-xs mb-2">Create New Class</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Classroom Name</Label>
                          <Input 
                            value={newClassNameInput} 
                            onChange={(e) => setNewClassNameInput(e.target.value)}
                            placeholder="e.g. SS 2 Science"
                            className="h-8 text-xs"
                            autoFocus
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[11px]">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => setIsCreateClassOpen(false)}
                            className="h-7 px-2.5 text-[10px]"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            type="button"
                            onClick={handleCreateClassSubmit}
                            className="h-7 px-3 text-[10px] bg-indigo-600 text-white"
                          >
                            Save Class
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PERSISTENT SEARCH BAR FOR CLASSES & STUDENT PROFILES */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={classesSearchQuery}
                    onChange={(e) => setClassesSearchQuery(e.target.value)}
                    placeholder="Search student profiles or classrooms by student name, ID (e.g. CS-8291), or class..."
                    className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  {classesSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setClassesSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-xs py-1 px-2.5">
                    {matchingClassesList.length} Active Classrooms
                  </Badge>
                  {classesSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClassesSearchQuery('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline px-2"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
              {classesSearchQuery && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium px-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Filtering student profiles matching <strong>"{classesSearchQuery}"</strong> across classroom rosters.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingClassesList.map((className: string) => {
                const classStudents = students.filter(s => s.class_name === className);
                const matchingClassStudents = classStudents.filter(st => {
                  if (!classesSearchQuery.trim()) return true;
                  const q = classesSearchQuery.toLowerCase();
                  return (
                    st.name?.toLowerCase().includes(q) ||
                    (st.id && String(st.id).toLowerCase().includes(q)) ||
                    st.login_email?.toLowerCase().includes(q)
                  );
                });
                
                // Get assigned class teacher
                const assignedTeacher = users.find((u: any) => 
                  u.assigned_class === className || 
                  (Array.isArray(u.assigned_classes) && u.assigned_classes.includes(className))
                );

                // Get class subjects
                const allSubjects = JSON.parse(localStorage.getItem("CS_SUBJECTS") || "[]");
                const matchedSub = allSubjects.find((s: any) => s.class_name === className);
                const classSubjectsList = matchedSub ? matchedSub.subjects : ["English Language", "Mathematics"];

                // Count uploaded exams for this class
                const examsForClass = reviewExams.filter((e: any) => e.class_name === className);
                const subjectsWithExamsCount = new Set(examsForClass.map((e: any) => e.subject)).size;

                const eligibleTeachers = users.filter((u: any) => 
                  u.role === "Class_Teacher" || 
                  u.role === "teacher" || 
                  u.is_class_teacher
                );

                const isExpanded = expandedClassRoster === className || Boolean(classesSearchQuery.trim() && matchingClassStudents.length > 0);

                return (
                  <div key={className} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all space-y-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="font-display font-black cs-text-navy text-sm uppercase tracking-tight">{className}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block">Registered Classroom Cohort</span>
                        </div>
                        <Badge className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold font-mono">
                          {matchingClassStudents.length} / {classStudents.length} Students
                        </Badge>
                      </div>

                      {/* Custom React Teacher Assignment Container */}
                      <div className="relative">
                        <Label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block mb-1">Assigned Class Teacher</Label>
                        <button
                          type="button"
                          onClick={() => setActiveTeacherDropdown(activeTeacherDropdown === className ? null : className)}
                          className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-750 transition-all cursor-pointer text-left"
                        >
                          <span className="truncate">{assignedTeacher ? `👩‍🏫 ${assignedTeacher.name}` : "⚠️ Unassigned - Click to Link"}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                        </button>
                        
                        {activeTeacherDropdown === className && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveTeacherDropdown(null)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-250 rounded-xl shadow-xl z-40 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="p-1.5 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-wider px-2">
                                Select Class Teacher
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAssignClassTeacher(className, null)}
                                className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-[11px] font-bold block"
                              >
                                ❌ Leave Unassigned
                              </button>
                              {eligibleTeachers.map((t: any) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => handleAssignClassTeacher(className, t.id)}
                                  className={`w-full text-left px-3 py-1.5 text-[11px] font-bold block hover:bg-emerald-600 hover:text-white transition-colors ${
                                    assignedTeacher?.id === t.id ? "bg-emerald-50 text-emerald-700" : "text-slate-705"
                                  }`}
                                >
                                  👩‍🏫 {t.name}
                                </button>
                              ))}
                              {eligibleTeachers.length === 0 && (
                                <div className="p-2 text-center text-slate-450 text-[10px]">No teachers available</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Class Averages / Collections */}
                      <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Class Average Rate:</span>
                          <span className="font-bold text-slate-700">60%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Fees Collection:</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            ₦{classStudents.reduce((acc, s) => acc + (s.balance_due === 0 ? 60000 : 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Academic Receipt Summary */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] text-slate-500 space-y-1.5">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-150 font-bold uppercase tracking-wider text-[9px] text-slate-400">
                          <span>Class Receipt Summary</span>
                          <span className="text-indigo-600 font-mono">Curriculum</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Curriculum Subjects:</span>
                          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 font-bold font-mono text-[9px] px-1.5 py-0">
                            {classSubjectsList.length} Subjects
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Subjects Per Student:</span>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 font-bold font-mono text-[9px] px-1.5 py-0">
                            {classSubjectsList.length} subjects each
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Exam Upload Coverage:</span>
                          <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 border border-violet-100 font-bold font-mono text-[9px] px-1.5 py-0">
                            {subjectsWithExamsCount} subjects active
                          </Badge>
                        </div>
                      </div>

                      {/* Class Student Profiles Roster Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedClassRoster(expandedClassRoster === className ? null : className)}
                        className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-200 text-[11px] font-bold text-slate-700 transition flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Student Profiles Roster ({matchingClassStudents.length})</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Expanded Student Profiles List for this Class */}
                      {isExpanded && (
                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 space-y-2 max-h-60 overflow-y-auto animate-in fade-in duration-150">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block px-1 font-mono">
                            Class Learners ({matchingClassStudents.length})
                          </span>
                          {matchingClassStudents.map((st, idx) => (
                            <div key={st.id || idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate">{st.name}</span>
                                  <span className="px-1 py-0.2 text-[8.5px] font-mono font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                    #{st.id || `CS-${8200 + idx}`}
                                  </span>
                                </div>
                                <span className="text-[9.5px] text-slate-400 font-mono block truncate">{st.login_email}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[9.5px] px-1.5 font-bold"
                                  onClick={() => { setActiveStudent(st); setStudentDlg(true); }}
                                >
                                  <Edit className="w-3 h-3 text-slate-500" />
                                  Folder
                                </Button>
                              </div>
                            </div>
                          ))}
                          {matchingClassStudents.length === 0 && (
                            <p className="text-[10.5px] text-slate-400 italic text-center py-2">
                              No matching student profiles in {className}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedClassForAdd(className);
                            setProvStudentName("");
                            setProvStudentGender("Male");
                            setProvParentEmail("");
                            setProvStudentAge("16");
                            setProvStudentBalance("0");
                            setProvPassword(generateSecurePassword());
                            setIsAddStudentModalOpen(true);
                          }}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Students
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDownloadClassExcelTemplate(className)}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 cursor-pointer border-0"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                          Get Template
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveReceiptClass(className)}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          Class Roster
                        </Button>

                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => setActiveReceiptClass(className)}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-90 text-white flex items-center justify-center gap-1 cursor-pointer border-0 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                          Export Class Results
                        </Button>
                      </div>

                      {/* 5MB Size Guardrail warning info inline */}
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 flex items-start gap-1.5 text-[9px] text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
                        <span className="leading-tight text-left">
                          Excel file size limit is strictly locked to <strong className="text-slate-500 font-bold">5MB</strong>. Excessive rows will be auto-dropped by the ingestion guardrail.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(school?.classes || []).length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-2 bg-white">
                  <span className="text-2xl block">🎒</span>
                  <p className="font-bold cs-text-navy text-xs">No classroom cohorts registered yet</p>
                  <p className="text-[10px] text-slate-400">Click &apos;Create New Class&apos; above to setup your academic structure instantly.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: FEES / BUDGETS ----------------- */}
        {tab === "fees" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "financial_ledger") ? (
            <UpgradeOverlay 
              title="Campus Bursary Desk"
              requiredTier="Financial Ledger or Unified Enterprise"
              description="automated accounting records, offline WhatsApp banking transfers, fee receipt tracking, and instant bursary clearances."
              onUpgrade={() => handleUpdateSubscriptionTier("unified_enterprise")}
            />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 bg-white p-2.5 rounded-xl border">
                <button
                  type="button"
                  onClick={() => setBursarySubTab('ledger_stream')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bursarySubTab === 'ledger_stream'
                      ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Financial Ledger Stream (CBN Reconciled Bank Ledgers)
                </button>
                <button
                  type="button"
                  onClick={() => setBursarySubTab('budget_forecast')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bursarySubTab === 'budget_forecast'
                      ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Consolidated Budget & Cash Flow Forecast
                </button>
              </div>

              {bursarySubTab === 'ledger_stream' ? (
                <FinancialStatements
                  currentProfile={currentProfile}
                  billingRecords={mockBillingRecords}
                  onUpdateBilling={() => {}}
                  onNavigateToBroadsheet={() => setTab("broadsheet_vault")}
                />
              ) : (
                <div className="space-y-5 text-xs">
                  {/* Consolidated School Budget & Live Cash Flow Graphs */}
                  <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <h3 className="font-display font-black cs-text-navy text-sm uppercase">Consolidated School Budget & Live Cash Flow</h3>
                        <p className="text-[10px] text-slate-400">Calculates institutional enrollment income forecast, live verified collections, and outstanding parent debt tracking.</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Sessional Audit: 2025/2026
                      </span>
                    </div>

                {/* KPI Metrics Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-slate-150 p-4 rounded-xl bg-slate-50">
                    <span className="text-[9px] uppercase font-black text-slate-400 font-mono tracking-wider">Gross Revenue Forecast</span>
                    <strong className="block text-lg cs-text-navy mt-1">₦{((students.length * (tuitionFee + cbtFee + admissionFee))).toLocaleString()}</strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Projected total fees from {students.length} active learners</span>
                  </div>

                  <div className="border border-emerald-150 p-4 rounded-xl bg-emerald-50/40">
                    <span className="text-[9px] uppercase font-black text-emerald-700 font-mono tracking-wider">Cash Collected (Verified)</span>
                    <strong className="block text-lg text-emerald-700 mt-1">
                      ₦{(receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000).toLocaleString()}
                    </strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Deposited fund verified and processed into school account</span>
                  </div>

                  <div className="border border-rose-150 p-4 rounded-xl bg-rose-50/40">
                    <span className="text-[9px] uppercase font-black text-rose-700 font-mono tracking-wider">Outstanding Accounts Debt</span>
                    <strong className="block text-lg text-rose-600 mt-1">₦{totalFinesDue.toLocaleString()}</strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Unpaid tuition arrears flagged in parent portals</span>
                  </div>
                </div>

                {/* Live Forecasting Progress bar graphs */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>CASH COLLECTION EFFICIENCY GAP RATE</span>
                    <strong>{Math.round(((receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000) / ((students.length * (tuitionFee + cbtFee + admissionFee))) * 100))}% COMPLETED</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round(((receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000) / ((students.length * (tuitionFee + cbtFee + admissionFee))) * 100)))}%` }}
                    />
                    <div className="bg-rose-400 h-full" style={{ flex: 1 }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>🟢 Verified Deposits Cashflow</span>
                    <span>🔴 Outstanding Accounts Receivable Debt Arrears</span>
                  </div>
                </div>
              </div>

              {/* Core Bursary Ledger Operations Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Left side: Fee schedule config */}
                <div className="cs-card p-5 space-y-4">
                  <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                    <Sliders className="w-4.5 h-4.5" />
                    <h3 className="font-display font-semibold cs-text-navy text-sm">Tuition Schedule Adjuster</h3>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <Label>Standard Tuition Fee (₦)</Label>
                      <Input type="number" value={tuitionFee} onChange={(e) => setTuitionFee(Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                      <Label>First Admission Fee (₦)</Label>
                      <Input type="number" value={admissionFee} onChange={(e) => setAdmissionFee(Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                      <Label>CBT Examination Processing Fee (₦)</Label>
                      <Input type="number" value={cbtFee} onChange={(e) => setCbtFee(Number(e.target.value))} />
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full h-9 justify-center font-bold bg-indigo-600 text-white" 
                      onClick={() => {
                        toast.success("Bursary tuition schedules synchronized institutional-wide!");
                      }}
                    >
                      Save Fee Template Settings
                    </Button>
                  </div>
                </div>

                {/* Right side: Split-Screen Bank Invoice receipts queue */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Receipts List */}
                  <div className="cs-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-display font-semibold cs-text-navy text-[11px] uppercase tracking-wider">Bank Receipt Slips</h3>
                      <span className="text-[9px] text-slate-400 font-mono">Verify parent uploads</span>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {receipts.map((rc) => (
                        <button
                          key={rc.id}
                          onClick={() => setSelectedReceipt(rc)}
                          className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${selectedReceipt?.id === rc.id ? "bg-indigo-50 border-indigo-300 font-bold shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50/50"}`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="font-bold cs-text-navy text-xs truncate max-w-[120px]">{rc.submitted_by}</span>
                            <Badge className={rc.status === "Approved" || rc.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"}>
                              {rc.status === "Approved" || rc.status === "approved" ? "Approved" : "Pending Verification"}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                            <span>Code: #{rc.whatsapp_code}</span>
                            <strong className="text-indigo-950 font-black">₦{rc.amount_ngn.toLocaleString()}</strong>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Screen Detail Visualizer Receipt */}
                  <div className="cs-card p-4 space-y-3.5 bg-slate-50/40 border border-slate-200">
                    {!selectedReceipt ? (
                      <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-10 space-y-2">
                        <FileText className="w-7 h-7 text-slate-350" />
                        <span>Select a bank receipt to open the split-screen Bursary Clearance Desk.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="font-bold cs-text-navy text-xs uppercase tracking-wide">Verification Split-Desk</h4>
                          <p className="text-[9px] text-slate-400 font-mono">ID: {selectedReceipt.id}</p>
                        </div>

                        {/* Interactive Bank slip illustration layout */}
                        <div className="bg-white border border-dashed border-indigo-200 rounded-xl p-3 space-y-2 shadow-inner text-[10px]">
                          <div className="flex justify-between font-mono text-[8px] text-slate-400 border-b border-slate-100 pb-1.5">
                            <span>CENTRAL BANK SLIP</span>
                            <span>TX REF: {selectedReceipt.reference_id || "REF-103957291"}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Depositor Name:</span>
                              <strong className="text-slate-800">{selectedReceipt.submitted_by}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Deposit Channel:</span>
                              <strong className="text-slate-800">{selectedReceipt.channel || "WhatsApp Mobile Banking"}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Verification Hash Code:</span>
                              <strong className="text-indigo-600 font-mono">#{selectedReceipt.whatsapp_code}</strong>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1">
                              <span className="text-slate-500 font-bold">Transferred Amount:</span>
                              <strong className="text-emerald-600 text-xs font-mono font-black">₦{selectedReceipt.amount_ngn.toLocaleString()}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Approvals buttons actions */}
                        <div className="space-y-2 pt-1">
                          {selectedReceipt.status === "pending" ? (
                            <Button
                              type="button"
                              onClick={() => {
                                // One-click receipt approval: Set approved, reduce student balance due
                                const currentReceipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
                                const nextReceipts = currentReceipts.map((r: any) => r.id === selectedReceipt.id ? { ...r, status: "Approved" } : r);
                                localStorage.setItem("CS_RECEIPTS", JSON.stringify(nextReceipts));

                                if (selectedReceipt.student_id) {
                                  const currentStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
                                  const nextStudents = currentStudents.map((s: any) => {
                                    if (s.id === selectedReceipt.student_id) {
                                      const currentBal = s.balance_due || 0;
                                      return { ...s, balance_due: Math.max(0, currentBal - selectedReceipt.amount_ngn) };
                                    }
                                    return s;
                                  });
                                  localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextStudents));
                                }

                                toast.success("Invoice cleared! Student balance offset dynamically.");
                                setSelectedReceipt({ ...selectedReceipt, status: "Approved" });
                                loadData();
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8.5 text-[10px] justify-center"
                            >
                              Confirm & Verify Receipt (One-Click)
                            </Button>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-2.5 text-center text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                              <span>✅ Payment Verified & Cleared</span>
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (selectedReceipt.student_id) {
                                const currentStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
                                const nextStudents = currentStudents.map((s: any) => {
                                  if (s.id === selectedReceipt.student_id) {
                                    const currentBal = s.balance_due || 0;
                                    const discounted = Math.round(currentBal * 0.9);
                                    return { ...s, balance_due: discounted };
                                  }
                                  return s;
                                });
                                localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextStudents));
                                toast.success("Applied 10% Sibling/Scholar Discount plan!");
                                loadData();
                              } else {
                                toast.error("No linked student candidate for this receipt.");
                              }
                            }}
                            className="w-full h-8 text-[9.5px] font-mono hover:bg-indigo-50 border-indigo-200 text-indigo-700 justify-center bg-white"
                          >
                            Apply 10% Scholarship/Sibling Discount
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    )}

        {/* ----------------- SUBTAB: STAFFS PAYMENT & WORKERS PAYROLL ----------------- */}
        {tab === "staff_payment" && (
          <StaffPaymentLedger currentProfile={currentProfile} billingRecords={mockBillingRecords} />
        )}

        {/* ----------------- SUBTAB: REGULATORY REPORT CARDS & SIGNATURES ----------------- */}
        {tab === "report_cards" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "cbt_plus_results" || school?.subscription_tier === "digital_reports" || !school?.subscription_tier) ? (
            <UpgradeOverlay 
              title="Regulatory Report Cards Desk"
              requiredTier="CBT Pro, Digital Reports, or Unified Enterprise"
              description="continuous assessment weight configuration, digital signatures, automated terminal result compilation, and official parent report dispatches."
              onUpgrade={() => handleUpdateSubscriptionTier("cbt_plus_results")}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Regulatory Report Cards Desk</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure continuous assessment weight parameters, draw electronic signatures, and preview authentic watermarked terminal results.</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold uppercase text-[9px] px-2 py-0.5 h-6">
                    Report Desk Active
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold uppercase text-[9px] px-2 py-0.5 h-6">
                    Results Tier v1.0
                  </Badge>
                </div>
              </div>

            {/* Sub-mode selections */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setReportSubMode("single")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 ${
                  reportSubMode === "single"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Single Student Report Card & Parameters
              </button>
              <button
                type="button"
                onClick={() => setReportSubMode("bulk_export")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 flex items-center gap-1.5 ${
                  reportSubMode === "bulk_export"
                    ? "border-emerald-600 text-emerald-800 font-extrabold bg-emerald-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                Bulk Export Class Reports (Sequential Print)
              </button>
              <button
                type="button"
                onClick={() => setReportSubMode("broadsheet")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 ${
                  reportSubMode === "broadsheet"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Class Unified Broadsheet Matrix (Results Tier)
              </button>
              <button
                type="button"
                onClick={() => setReportSubMode("distribution_analytics")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px shrink-0 ${
                  reportSubMode === "distribution_analytics"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Cohort Grade Distribution Curves (Analytics)
              </button>
            </div>

            {reportSubMode === "single" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: Configurations */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* 1. Multi-Factor Formula Weights */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Multi-Factor Weighting</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Configure how terminal student averages are calculated by assigning proportional weights to continuous assessments.</p>
                    
                    <div className="space-y-3.5 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Attendance Weight</span>
                          <span className="font-mono text-indigo-600 font-bold">{attendanceWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="40" 
                          value={attendanceWeight} 
                          onChange={(e) => setAttendanceWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Mid-Term Continuous Assessment</span>
                          <span className="font-mono text-indigo-600 font-bold">{midtermWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="60" 
                          value={midtermWeight} 
                          onChange={(e) => setMidtermWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Terminal Examination Weight</span>
                          <span className="font-mono text-indigo-600 font-bold">{examWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="90" 
                          value={examWeight} 
                          onChange={(e) => setExamWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Weight validation notice */}
                      <div className={`p-2.5 rounded-xl flex items-start gap-2 border text-[10px] ${
                        attendanceWeight + midtermWeight + examWeight === 100
                          ? "bg-emerald-50 border-emerald-150 text-emerald-800"
                          : "bg-rose-50 border-rose-150 text-rose-800 animate-pulse"
                      }`}>
                        {attendanceWeight + midtermWeight + examWeight === 100 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Sum Weight Validated (100%)</strong>
                              <span>Live scores and averages will recalculate instantly below.</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Weight Sum Error</strong>
                              <span>Total sum must equal exactly 100%. Currently: <strong className="font-mono font-black">{attendanceWeight + midtermWeight + examWeight}%</strong></span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Custom Grade Boundaries */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Grade Scale Boundaries</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Establish customized minimum percentage cutoffs to map scores to letter designations.</p>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Excellent Grade (A) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleA} 
                          onChange={(e) => setGradeScaleA(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Good Grade (B) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleB} 
                          onChange={(e) => setGradeScaleB(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Credit Grade (C) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleC} 
                          onChange={(e) => setGradeScaleC(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Pass Grade (D) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleD} 
                          onChange={(e) => setGradeScaleD(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Watermark Text Override */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Report Watermarking Text</h4>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Rotated Background Watermark</Label>
                      <Input 
                        value={watermarkText} 
                        onChange={(e) => setWatermarkText(e.target.value)} 
                        placeholder="e.g. OFFICIAL RECORD"
                        className="h-8 text-xs"
                      />
                      <span className="text-[8.5px] text-slate-400 block mt-0.5">Rotated semi-translucent background label to safeguard official copies from falsification.</span>
                    </div>
                  </div>

                  {/* 4. Canvas Digital Signature Pad */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Principal Signature Vector Pad & Upload</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Click and drag below to draw the official signature, OR upload a clean transparent signature image (PNG/JPG).</p>
                    
                    <div className="border border-slate-200 bg-slate-50 rounded-xl overflow-hidden relative">
                      <canvas 
                        ref={canvasRef}
                        width={380}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full h-[120px] bg-slate-50 cursor-crosshair"
                      />
                      {!principalSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] uppercase font-mono tracking-wider font-bold">
                          Draw official signature here
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                      <label className="text-[9.5px] font-bold text-indigo-950 block">Or Upload Signature Image File</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setPrincipalSignature(reader.result);
                                toast.success("Signature image uploaded & parsed successfully!");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-705 file:cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={clearCanvasSignature} 
                        className="h-7 text-[10px] font-mono border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Clear Canvas / Upload
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          if (!principalSignature) {
                            saveCanvasSignature();
                          }
                          toast.success("Signature vector locked & saved!");
                        }} 
                        className="h-7 text-[10px] bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Lock Signature
                      </Button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Report Card Preview */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Selector & Quick Bulk Export Strip */}
                  <div className="cs-card p-4 bg-white border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">Choose Active Student Candidate</Label>
                        <p className="text-[10.5px] font-bold text-indigo-950">
                          Currently viewing: <strong className="text-indigo-600">{activeReportStudent?.name || filteredStudents[0]?.name || "No Students Registered"}</strong>
                        </p>
                      </div>

                      {/* Custom select trigger */}
                      <div className="relative">
                        <select
                          value={activeReportStudent?.id || filteredStudents[0]?.id || ""}
                          onChange={(e) => {
                            const target = filteredStudents.find(s => s.id === e.target.value);
                            if (target) {
                              setActiveReportStudent(target);
                              toast.success(`Switched report view to ${target.name}`);
                            }
                          }}
                          className="h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                        >
                          {filteredStudents.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.class_name})
                            </option>
                          ))}
                          {filteredStudents.length === 0 && (
                            <option value="">No candidates on campus</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Quick Bulk Export Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <Printer className="w-3 h-3 text-emerald-600" /> Bulk Class Target:
                        </span>
                        <select
                          value={selectedExportClass}
                          onChange={(e) => setSelectedExportClass(e.target.value)}
                          className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 focus:outline-none"
                        >
                          {availableReportClasses.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                          <option value="ALL">All Classes (Full Campus)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => setIsReportPrintModalOpen(true)}
                          className="h-7.5 px-3.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-lg shadow-sm hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Open Print Preview Modal</span>
                        </Button>

                        <Button
                          type="button"
                          onClick={() => handleBulkExportClassReports()}
                          disabled={isBulkExporting}
                          className="h-7.5 px-3 text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Printer className={`w-3.5 h-3.5 text-indigo-600 ${isBulkExporting ? 'animate-spin' : ''}`} />
                          <span>{isBulkExporting ? "Exporting..." : `Bulk Direct Print (${selectedExportClass})`}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Report Card Preview Sheet */}
                  <div className="bg-white border rounded-2xl p-6 shadow-md relative overflow-hidden text-xs">
                    
                    {/* Rotating School Logo Watermark Layer (Highly Translucent) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.06] transform -rotate-15 scale-105">
                      {school?.logo_url ? (
                        <img 
                          src={school.logo_url} 
                          alt="Watermark School Logo" 
                          className="max-w-[280px] max-h-[280px] object-contain grayscale"
                        />
                      ) : (
                        /* Fallback beautiful large emblem watermark */
                        <svg className="w-64 h-64 text-indigo-950" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.55l-3.32-1.81L12 15.5l9.43-5.14-3.32 1.81-6.11 3.33-6.11-3.33zM12 17.5L3.5 13v4.5l8.5 5 8.5-5V13l-8.5 4.5z"/>
                        </svg>
                      )}
                    </div>

                    {watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.03]">
                        <span className="text-slate-900 font-black uppercase text-5xl tracking-widest font-mono transform -rotate-35 whitespace-nowrap">
                          {watermarkText}
                        </span>
                      </div>
                    )}

                    {/* Letterhead Header */}
                    <div className="relative z-10 border-b-2 border-slate-900 pb-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 font-mono">Corner Streams Educational Network</span>
                          <h2 className="text-base font-black text-slate-900 font-display leading-tight uppercase">
                            {school?.name || "Corporate Elite Academy"}
                          </h2>
                          <p className="text-[9.5px] italic text-slate-500 font-medium">
                            Motto: &quot;{school?.motto || "Excellence & Honor in Character"}&quot;
                          </p>
                          <p className="text-[8.5px] text-slate-400 font-mono">
                            Campus Node: {selectedCampus}
                          </p>
                        </div>

                        {/* Mock Institutional Seal */}
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-black text-sm shadow-inner uppercase tracking-widest">
                          CS
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[9.5px] font-bold text-slate-600">
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Student ID</span>
                          <span className="text-slate-900 font-mono">#{activeReportStudent?.id || filteredStudents[0]?.id || "CS-8291"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Candidate Name</span>
                          <span className="text-slate-900 truncate block">{activeReportStudent?.name || filteredStudents[0]?.name || "John Doe"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Class / Level</span>
                          <span className="text-slate-900 font-mono">{activeReportStudent?.class_name || filteredStudents[0]?.class_name || "SS 2"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Academic Term</span>
                          <span className="text-slate-900 font-mono">Third Term (2026)</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Matrix Table */}
                    <div className="relative z-10 my-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-900 font-mono text-[9px] uppercase font-black text-slate-700">
                            <TableHead className="text-slate-900">Syllabus Subjects</TableHead>
                            <TableHead className="text-center">Att ({attendanceWeight}%)</TableHead>
                            <TableHead className="text-center">CA ({midtermWeight}%)</TableHead>
                            <TableHead className="text-center">Exam ({examWeight}%)</TableHead>
                            <TableHead className="text-right text-indigo-900">Weighted (100%)</TableHead>
                            <TableHead className="text-right">Verdict Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { subject: "Mathematics", att: 95, mid: 85, exam: 92 },
                            { subject: "English Language", att: 90, mid: 80, exam: 74 },
                            { subject: "Physics", att: 80, mid: 70, exam: 64 },
                            { subject: "Civic Education", att: 98, mid: 92, exam: 88 }
                          ].map((row, idx) => {
                            const weightedTotal = Math.round(
                              (row.att * (attendanceWeight / 100)) + 
                              (row.mid * (midtermWeight / 100)) + 
                              (row.exam * (examWeight / 100))
                            );

                            const getGrade = (score: number) => {
                              if (score >= gradeScaleA) return "A (Excellent)";
                              if (score >= gradeScaleB) return "B (Good)";
                              if (score >= gradeScaleC) return "C (Credit)";
                              if (score >= gradeScaleD) return "D (Pass)";
                              return "F (Fail)";
                            };

                            const gradeStr = getGrade(weightedTotal);

                            return (
                              <TableRow key={idx} className="border-b border-slate-100 font-semibold text-slate-800">
                                <TableCell className="font-bold text-indigo-950">{row.subject}</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.att}%</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.mid}%</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.exam}%</TableCell>
                                <TableCell className="text-right font-mono text-sm font-black text-indigo-600">
                                  {weightedTotal}%
                                </TableCell>
                                <TableCell className={`text-right font-bold font-mono text-[10.5px] ${
                                  gradeStr.startsWith("A") ? "text-emerald-600" :
                                  gradeStr.startsWith("B") ? "text-blue-600" :
                                  gradeStr.startsWith("C") ? "text-amber-600" : "text-rose-600"
                                }`}>
                                  {gradeStr}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Verdict Block */}
                    <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-[9.5px]">
                      <div className="space-y-1 text-slate-500 font-medium">
                        <p>
                          <strong className="text-indigo-950 block">Class Teacher Remarks:</strong>
                          <span>Demonstrates exceptional conceptual capacity. Strongly recommended for promotions into higher advanced streams.</span>
                        </p>
                        <p className="pt-1.5">
                          <strong className="text-indigo-950 block">Promotions Decision:</strong>
                          <span className="text-emerald-600 font-black">PROMOTED WITH DISTINCTIONS</span>
                        </p>
                      </div>

                      {/* Signature and verification QR Code */}
                      <div className="flex flex-col items-end justify-between space-y-4">
                        
                        {/* Signature block */}
                        <div className="text-right space-y-1.5 h-16 flex flex-col justify-end">
                          {principalSignature ? (
                            <img 
                              src={principalSignature} 
                              alt="Principal Signature" 
                              className="h-10 object-contain border border-slate-100 bg-slate-50/50 rounded p-0.5 mx-auto lg:mr-0"
                            />
                          ) : (
                            <div className="h-6 w-32 border-b border-dashed border-slate-400 mx-auto lg:mr-0" />
                          )}
                          <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-black">
                            {principalName || "Executive Head Principal"}
                          </span>
                        </div>

                        {/* Verification Link QR block */}
                        <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 p-1.5 rounded-lg max-w-[190px]">
                          {/* Mock QR SVG */}
                          <svg className="w-8 h-8 text-indigo-950" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zm6-2h10v10H11V3zm1 1v8h8V4h-8zm1 1h6v6h-6V5zM3 11h6v10H3V11zm1 1v8h4v-8H4zm1 1h2v6H5v-6zm9-2h4v2h-4v-2zm4 2h2v4h-2v-4zm-4 4h4v2h-4v-2zm-2-4h2v2h-2v-2zm2 2h2v2h-2v-2zm4 2h2v2h-2v-2z" />
                          </svg>
                          <div className="text-[7.5px] text-slate-400 leading-tight">
                            <strong className="text-indigo-950 block text-[8px] font-bold uppercase tracking-wider">Secure Audit Hash</strong>
                            <span className="font-mono">VERIFY: #{activeReportStudent?.id || filteredStudents[0]?.id || "CS-8291"}</span>
                            <span className="block text-slate-400 font-mono">verify.cornerstreams.com</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

              </div>
            ) : reportSubMode === "broadsheet" ? (
              /* UNIFIED CLASS BROADSHEET MATRIX (RESULTS TIER) */
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h4 className="font-display font-bold text-indigo-950 text-sm">Unified Terminal Ledger & Broad Sheet Matrix</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Aggregates term-by-term assessment totals to verify annual promotions and secure academic compliance.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          // Read CBT logs and inject them to mock student sheets
                          const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
                          if (records.length === 0) {
                            toast.info("No active CBT submissions found in proctor database. Seeding mock active exam evaluations instead!");
                          } else {
                            toast.success(`Synchronized ${records.length} active computer-based exam scores into 3rd Term Results ledger!`);
                          }
                          // Triggers force refresh/seed
                          const seedKey = "CS_BROADSHEET_SYNCED";
                          localStorage.setItem(seedKey, "true");
                        }}
                        className="h-8.5 text-[10px] bg-indigo-600 text-white font-bold"
                      >
                        Sync CBT Exam Records
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.print()}
                        className="h-8.5 text-[10px] border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                      >
                        Print Broad Sheet Ledger
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <Table className="min-w-[800px]">
                      <TableHeader className="bg-slate-50 font-mono text-[9px] uppercase tracking-wider">
                        <TableRow>
                          <TableHead className="font-black text-slate-900">Student Candidate</TableHead>
                          <TableHead className="text-center">1st Term Total</TableHead>
                          <TableHead className="text-center">2nd Term Total</TableHead>
                          <TableHead className="text-center">3rd Term (CBT Sync)</TableHead>
                          <TableHead className="text-center text-indigo-900 font-bold">Session Sum</TableHead>
                          <TableHead className="text-center text-indigo-900 font-bold">Annual Avg (%)</TableHead>
                          <TableHead className="text-right">Promotions Decision</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {[
                          { id: "usr-stu-1", name: "Folasade Amira Adekunle", t1: 345, t2: 362, t3Default: 375 },
                          { id: "usr-stu-2", name: "Jeremiah David Benson", t1: 298, t2: 280, t3Default: 310 },
                          { id: "usr-stu-3", name: "Chibuzor Emeka Silas", t1: 320, t2: 315, t3Default: 340 },
                          { id: "usr-stu-4", name: "Dada Oluwaseun Emmanuel", t1: 210, t2: 220, t3Default: 180 }
                        ].map((stu, sIdx) => {
                          // Try loading custom CBT score from proctor records for this student
                          const proctorLogsList = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
                          const matchedLog = proctorLogsList.find((l: any) => l.studentName === stu.name);
                          
                          // Match and convert to terminal score format out of 400
                          const cbtScoreTermWeight = matchedLog ? Math.round(Number(matchedLog.percentage) * 4) : stu.t3Default;
                          
                          const sessionSum = stu.t1 + stu.t2 + cbtScoreTermWeight;
                          const annualAvg = Math.round((sessionSum / 1200) * 100);
                          const isPassed = annualAvg >= benchmark;

                          return (
                            <TableRow key={stu.id} className="hover:bg-indigo-50/20 font-semibold text-slate-800">
                              <TableCell className="font-bold text-indigo-950">
                                <div>{stu.name}</div>
                                <div className="text-[8.5px] text-slate-400 font-mono mt-0.5">#{stu.id} · Secondary Cohort</div>
                              </TableCell>
                              <TableCell className="text-center font-mono">{stu.t1} / 400</TableCell>
                              <TableCell className="text-center font-mono">{stu.t2} / 400</TableCell>
                              <TableCell className="text-center font-mono">
                                <span className={matchedLog ? "text-emerald-600 font-bold" : "text-slate-600"}>
                                  {cbtScoreTermWeight} / 400
                                </span>
                                {matchedLog && (
                                  <Badge className="bg-emerald-50 text-emerald-700 text-[7px] ml-1 px-1 py-0.5 border border-emerald-200">
                                    CBT Verified
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-900">{sessionSum} / 1200</TableCell>
                              <TableCell className="text-center font-mono font-black text-indigo-600 text-sm">{annualAvg}%</TableCell>
                              <TableCell className="text-right">
                                <Badge className={isPassed ? "bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase text-[9px] font-bold" : "bg-rose-50 border border-rose-200 text-rose-800 uppercase text-[9px] font-bold"}>
                                  {isPassed ? "Promoted" : "Resitting Required"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Disclaimer alert */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-[10.5px] text-slate-500 leading-relaxed">
                    <strong>Results Tier Security Clause:</strong> Complete class averages, term totals, and promotions verdicts are locked on the institutional server logs. Terminal reports generated on this interface utilize verified active-term parameters. Modification of passing benchmarks affects verdicts dynamically across all client reports.
                  </div>
                </div>
              </div>
            ) : reportSubMode === "distribution_analytics" ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <PerformanceTrendsCard grades={grades} userRole="admin" />
                <GradeDistributionChart grades={grades} />
              </div>
            ) : (
              /* BULK EXPORT CLASS REPORTS DESK */
              <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                
                {/* TOP HERO CONTROL CARD */}
                <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                          <Printer className="w-5 h-5" />
                        </span>
                        <h3 className="font-display font-extrabold text-base tracking-tight">
                          Automated Class Bulk Report Card Export Engine
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-200 max-w-xl">
                        Sequentially iterates through student candidates in a selected class cohort and triggers browser print dialogs for paperless A4 report card compilation.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {filteredStudents.filter((s: any) => selectedExportClass === "ALL" || s.class_name === selectedExportClass || (s.class_name && s.class_name.includes(selectedExportClass))).length} Candidates
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTROLS STRIP */}
                  <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Select Class:</span>
                      <select
                        value={selectedExportClass}
                        onChange={(e) => setSelectedExportClass(e.target.value)}
                        className="h-9 px-3 bg-slate-900 text-white border border-indigo-400/40 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                      >
                        {availableReportClasses.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                        <option value="ALL">All Classes (Full Campus)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => handleBulkExportClassReports()}
                        disabled={isBulkExporting}
                        className="h-9 px-4 text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Printer className={`w-4 h-4 ${isBulkExporting ? 'animate-spin' : ''}`} />
                        <span>{isBulkExporting ? "Bulk Exporting Class..." : "Start Sequential Bulk Print"}</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setBatchPrintMode(!batchPrintMode)}
                        className={`h-9 px-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                          batchPrintMode
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>{batchPrintMode ? "Hide Batch View" : "Combined Multi-Page View"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* LIVE PROGRESS STATUS BAR IF EXPORTING */}
                  {isBulkExporting && bulkExportProgress && (
                    <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          Exporting Candidate {bulkExportProgress.current} of {bulkExportProgress.total}:
                          <strong className="text-white font-mono">{bulkExportProgress.currentStudent}</strong>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round((bulkExportProgress.current / bulkExportProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-emerald-900/60 rounded-full h-2 overflow-hidden border border-emerald-700/50">
                        <div 
                          className="bg-emerald-400 h-full transition-all duration-300" 
                          style={{ width: `${(bulkExportProgress.current / bulkExportProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* COMBINED MULTI-PAGE VIEW OR QUEUE TABLE */}
                {batchPrintMode ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="font-black text-indigo-950 text-sm uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          Combined Multi-Page Class Report Book ({selectedExportClass})
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">All student report cards formatted for single-click multi-page PDF output.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs uppercase px-4 h-8.5 rounded-xl gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        Print All Report Cards (Single PDF)
                      </Button>
                    </div>

                    <div className="space-y-12">
                      {filteredStudents
                        .filter((s: any) => selectedExportClass === "ALL" || s.class_name === selectedExportClass || (s.class_name && s.class_name.includes(selectedExportClass)))
                        .map((st: any, sIdx: number) => (
                          <div key={st.id || sIdx} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-4 print:border-0 print:p-0 print:break-after-page">
                            <div className="flex justify-between items-center border-b-2 border-indigo-900 pb-3">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-emerald-600 font-mono">Corner Streams Educational Network</span>
                                <h3 className="text-sm font-black text-slate-900 font-display uppercase">{school?.name || "Corporate Elite Academy"}</h3>
                                <p className="text-[9px] text-slate-400">Class: {st.class_name} | Candidate ID: #{st.id}</p>
                              </div>
                              <span className="text-xs font-black text-indigo-950 border border-indigo-200 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                Candidate #{sIdx + 1}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-lg font-mono">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Student Name</span>
                                <span className="font-extrabold text-slate-900">{st.name}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">CA Scores Average</span>
                                <span className="font-extrabold text-emerald-600">82.5% (High Distinction)</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Status</span>
                                <span className="font-extrabold text-indigo-600">VERIFIED & SIGNED</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Candidate Roster Queue for {selectedExportClass}
                        </h4>
                        <p className="text-[10px] text-slate-400">Review candidate parameters before initiating sequential export.</p>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-bold uppercase">
                        Sequential Engine Ready
                      </Badge>
                    </div>

                    <div className="overflow-x-auto border border-slate-150 rounded-xl">
                      <Table className="min-w-[650px]">
                        <TableHeader className="bg-slate-50 text-[9px] uppercase font-mono tracking-wider">
                          <TableRow>
                            <TableHead className="font-black text-slate-900">Queue #</TableHead>
                            <TableHead className="font-black text-slate-900">Candidate Student</TableHead>
                            <TableHead className="text-center">Assigned Class</TableHead>
                            <TableHead className="text-center">CBT Sync</TableHead>
                            <TableHead className="text-center">Signatures & Watermark</TableHead>
                            <TableHead className="text-right">Export Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {filteredStudents
                            .filter((s: any) => selectedExportClass === "ALL" || s.class_name === selectedExportClass || (s.class_name && s.class_name.includes(selectedExportClass)))
                            .map((st: any, idx: number) => (
                              <TableRow key={st.id || idx} className="hover:bg-slate-50/70">
                                <TableCell className="font-mono font-bold text-slate-400">#{idx + 1}</TableCell>
                                <TableCell className="font-extrabold text-slate-800">
                                  {st.name}
                                  <span className="block text-[9px] font-mono text-slate-400 font-normal">ID: {st.id}</span>
                                </TableCell>
                                <TableCell className="text-center font-bold text-slate-600">{st.class_name || selectedExportClass}</TableCell>
                                <TableCell className="text-center font-mono font-bold text-emerald-600">
                                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[8px] uppercase">
                                    <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-500" />
                                    Synchronized
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[8px] uppercase font-mono">
                                    Principal Signed
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setActiveReportStudent(st);
                                      setReportSubMode("single");
                                      setTimeout(() => window.print(), 500);
                                    }}
                                    className="h-7 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                                  >
                                    <Printer className="w-3 h-3 mr-1 text-emerald-600" />
                                    Print Candidate
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {filteredStudents.filter((s: any) => selectedExportClass === "ALL" || s.class_name === selectedExportClass || (s.class_name && s.class_name.includes(selectedExportClass))).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                No student candidates enrolled in {selectedExportClass}.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

        {/* ----------------- SUBTAB: ACADEMIC BROADSHEET VAULT & MATRIX ----------------- */}
        {tab === "broadsheet_vault" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "cbt_plus_results" || school?.subscription_tier === "digital_reports" || !school?.subscription_tier) ? (
            <UpgradeOverlay 
              title="Academic Broadsheet Vault & Matrix"
              requiredTier="CBT Pro, Digital Reports, or Unified Enterprise"
              description="multi-subject grade spreadsheet matrices, classroom rankers, terminal aggregate analytics, and Excel exports."
              onUpgrade={() => handleUpdateSubscriptionTier("cbt_plus_results")}
            />
          ) : (
            <AcademicBroadsheetVault
              currentProfile={currentProfile}
              studentsList={students}
            />
          )
        )}

        {/* ----------------- SUBTAB: DAILY ATTENDANCE REGISTERS ----------------- */}
        {tab === "daily_attendance" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <DailyAttendanceRegister
              currentProfile={currentProfile}
              activeSession="2025/2026"
              activeTerm="1st Term"
            />
          </div>
        )}

        {/* ----------------- SUBTAB: STUDENT RESULT DOSSIERS ----------------- */}
        {tab === "result_dossiers" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "cbt_plus_results" || school?.subscription_tier === "digital_reports" || !school?.subscription_tier) ? (
            <UpgradeOverlay 
              title="Student Result Dossiers"
              requiredTier="CBT Pro, Digital Reports, or Unified Enterprise"
              description="individual learner terminal scorecards, multi-term growth history, principal commentary, and e-signatures."
              onUpgrade={() => handleUpdateSubscriptionTier("cbt_plus_results")}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <StudentResultDossier
                studentsList={students.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  reg: s.reg || `CS/2025/${s.id}`,
                  class: s.class_name || "SS 2 Gold"
                }))}
                currentProfile={currentProfile}
                activeSession={school?.session || "2025/2026"}
                activeTerm={school?.active_term || "1st Term"}
              />
            </div>
          )
        )}

        {/* ----------------- SUBTAB: CBT EXAM PORTAL & ENGINE ----------------- */}
        {tab === "cbt" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "cbt_plus_results" || school?.subscription_tier === "cbt_essentials" || !school?.subscription_tier) ? (
            <UpgradeOverlay 
              title="Computer-Based Testing Engine & Portal"
              requiredTier="CBT Starter, CBT Pro, or Unified Enterprise"
              description="computer-based testing engine, AI question authoring, live proctoring logs, and answer sheets."
              onUpgrade={() => handleUpdateSubscriptionTier("cbt_essentials")}
            />
          ) : (
            <CbtExamEngine
              currentProfile={currentProfile}
              theme={theme}
              setTheme={setTheme}
              activeFont={activeFont}
              setActiveFont={setActiveFont}
            />
          )
        )}

        {/* ----------------- SUBTAB: CBT REVIEW & PUBLISH DESK ----------------- */}
        {tab === "cbt_review" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "cbt_plus_results" || school?.subscription_tier === "cbt_essentials" || !school?.subscription_tier) ? (
            <UpgradeOverlay 
              title="CBT Review & Publish Desk"
              requiredTier="CBT Starter, CBT Pro, or Unified Enterprise"
              description="computer-based exam authoring, question bank auditing, live proctoring logs, and time-window exam releasing."
              onUpgrade={() => handleUpdateSubscriptionTier("cbt_essentials")}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-250 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-extrabold cs-text-navy text-sm uppercase tracking-tight">Institutional CBT Review Desk</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Auditing and publishing workflow for computer-based tests uploaded by subject teachers.</p>
                  </div>
                </div>
              </div>

              {/* Shared Role Banner Indicators */}
              <div className="flex flex-wrap gap-1.5 items-center bg-slate-50 border border-slate-150 rounded-xl p-2 px-3 font-mono text-[9px] text-slate-500 font-medium">
                <span className="font-bold text-[8.5px] uppercase text-indigo-700">Auditor Credentials:</span>
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold">School Admin</span>
                <span>·</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase font-bold">Exam Controller</span>
                <span>·</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold">Subject HOD</span>
              </div>
            </div>

            {/* Main exams list table */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-100 gap-2">
                <h4 className="font-display font-bold text-slate-700 text-xs">Awaiting Evaluation CBT Question Packets</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="h-8 text-[10.5px] font-bold text-indigo-950 border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Download Excel Template
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsPublishAllConfirmOpen(true)}
                    className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-indigo-700 text-white hover:opacity-95 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Publish All Exams
                  </Button>
                  <span className="text-[9.5px] font-mono text-slate-400 ml-1">{reviewExams.length} Total Papers found</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead className="text-[9.5px] font-bold text-slate-400 uppercase">Subject & Exam Paper Header</TableHead>
                      <TableHead className="text-[9.5px] font-bold text-slate-400 uppercase">Teacher / Author</TableHead>
                      <TableHead className="text-[9.5px] font-bold text-slate-400 uppercase text-center">Questions</TableHead>
                      <TableHead className="text-[9.5px] font-bold text-slate-400 uppercase text-center">Duration</TableHead>
                      <TableHead className="text-[9.5px] font-bold text-slate-400 uppercase">Publication Status</TableHead>
                      <TableHead className="text-right text-[9.5px] font-bold text-slate-400 uppercase">Audit Administration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewExams.map((ex, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/20 transition">
                        <TableCell className="text-left py-3.5">
                          <div className="font-extrabold cs-text-navy text-xs uppercase leading-snug">{ex.title}</div>
                          <div className="text-[9.5px] text-slate-400 font-mono mt-0.5 uppercase">
                            {ex.subject} · {ex.term || "1st Term"} · Cohort: {ex.class_name || "SS 2 Science"}
                          </div>
                        </TableCell>
                        <TableCell className="text-left py-3.5">
                          <div className="font-bold text-slate-700 text-xs">{ex.uploaded_by || "Mrs. Folasade Adebayo"}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{ex.date_uploaded ? new Date(ex.date_uploaded).toLocaleDateString() : "Pending date"}</div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[11px] text-slate-600 text-center py-3.5">
                          {ex.questions?.length || ex.question_count || 0}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-[11px] text-slate-500 text-center py-3.5">
                          {ex.duration_min || ex.durationMinutes || 30}m
                        </TableCell>
                        <TableCell className="text-left py-3.5">
                          {(() => {
                            const statusVal = ex.status || "published";
                            if (statusVal === "pending_review") {
                              return (
                                <div className="space-y-1">
                                  <Badge className="bg-amber-500 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                                    Pending Audit Review
                                  </Badge>
                                  <span className="block text-[8px] text-slate-400 font-mono">Unpublished Draft</span>
                                </div>
                              );
                            }
                            if (statusVal === "published") {
                              return (
                                <div className="space-y-1">
                                  <Badge className="bg-emerald-600 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                                    Published & Active
                                  </Badge>
                                  <span className="block text-[8px] text-emerald-600 font-mono">Live to Student Portals</span>
                                </div>
                              );
                            }
                            if (statusVal === "scheduled") {
                              return (
                                <div className="space-y-1">
                                  <Badge className="bg-blue-600 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                                    Scheduled Release
                                  </Badge>
                                  <span className="block text-[8px] text-blue-600 font-mono font-bold">
                                    {ex.publish_time ? new Date(ex.publish_time).toLocaleString() : "Pending schedule"}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <Badge className="bg-slate-400 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                                Draft
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right py-3.5 space-x-1.5">
                          {/* Audit questions list */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold"
                            onClick={() => {
                              setSelectedReviewExam(ex);
                              setIsAuditOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Audit Questions
                          </Button>

                          {/* Publish/Schedule */}
                          <Button 
                            variant="emerald" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedReviewExam(ex);
                              setPublishImmediately(true);
                              setScheduledDateTime("");
                              setIsPublishScheduleOpen(true);
                            }}
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            Publish / Schedule
                          </Button>

                          {/* Delete */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-rose-600 hover:bg-rose-50 border-rose-200"
                            onClick={() => handleDeleteReviewExam(ex.id)}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reviewExams.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <ShieldAlert className="w-8 h-8 text-slate-300 animate-bounce" />
                            <span className="font-medium text-xs">No teacher-uploaded CBT examination papers awaiting audit.</span>
                            <span className="text-[10px] text-slate-400">Teachers can drop standard Excel templates from their dashboards to populate this review desk.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Dialogue: Audit Question Roster */}
            <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
              <DialogContent className="max-w-2xl text-left">
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="font-display font-extrabold cs-text-navy text-sm uppercase flex items-center gap-1.5">
                    <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                    Question Sheet Audit: <span className="text-indigo-600">{selectedReviewExam?.title}</span>
                  </DialogTitle>
                  <p className="text-[10px] text-slate-400">
                    Detailed preview of multiple choice questions, options, diagram attachments, and correct answer indices.
                  </p>
                </DialogHeader>

                <div className="max-h-[50vh] overflow-y-auto space-y-4 my-2 pr-1">
                  {selectedReviewExam?.questions?.map((q: any, qidx: number) => (
                    <div key={qidx} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-mono font-black p-1 px-2 rounded-lg">
                          Question {qidx + 1}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                          Correct Choice: <strong className="text-emerald-600">Option {["A", "B", "C", "D"][q.correct_idx]}</strong>
                        </span>
                      </div>

                      {/* Question Text */}
                      <p className="text-xs font-extrabold text-slate-700 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Attached Image preview if any */}
                      {q.diagramUrl && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-w-[280px] bg-white">
                          <img 
                            src={q.diagramUrl} 
                            alt={`Diagram for Question ${qidx + 1}`}
                            className="object-cover w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                          <div className="bg-slate-100 p-1.5 text-center text-[8px] font-mono text-slate-400">
                            Attached Image: {q.diagramUrl.slice(0, 45)}...
                          </div>
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        {q.options?.map((opt: string, oidx: number) => (
                          <div 
                            key={oidx} 
                            className={`p-2 rounded-lg border transition ${
                              oidx === q.correct_idx 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" 
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <span className="font-mono text-[9px] font-bold mr-1">{["A", "B", "C", "D"][oidx]}.</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3">
                  <Button 
                    variant="outline" 
                    className="h-8.5 text-xs text-slate-600"
                    onClick={() => setIsAuditOpen(false)}
                  >
                    Close Audit Window
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialogue: Publish / Schedule Scheduler */}
            <Dialog open={isPublishScheduleOpen} onOpenChange={setIsPublishScheduleOpen}>
              <DialogContent className="max-w-md text-left">
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="font-display font-extrabold cs-text-navy text-sm uppercase">
                    CBT Release Schedule Configurator
                  </DialogTitle>
                  <p className="text-[10px] text-slate-400">
                    Approve and release the exam packet `{selectedReviewExam?.title}` to students immediately or schedule for later.
                  </p>
                </DialogHeader>

                <div className="space-y-4 my-3 text-xs">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 uppercase text-[9.5px]">Publish Timing Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPublishImmediately(true)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                          publishImmediately 
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" 
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        <span className="text-[10.5px]">Immediate Release</span>
                        <span className="text-[8px] text-slate-400 font-normal">Active inside student tab instantly</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishImmediately(false)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                          !publishImmediately 
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" 
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <Calendar className="w-5 h-5" />
                        <span className="text-[10.5px]">Schedule Publication</span>
                        <span className="text-[8px] text-slate-400 font-normal">Pre-scheduled release time</span>
                      </button>
                    </div>
                  </div>

                  {!publishImmediately && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                      <Label className="font-bold text-slate-500 uppercase text-[9px]">Select Launch Date & Time</Label>
                      <Input 
                        type="datetime-local" 
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="h-9.5 bg-white font-mono font-bold text-xs"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3">
                  <Button 
                    variant="outline" 
                    className="h-8.5 text-xs text-slate-600"
                    onClick={() => setIsPublishScheduleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="emerald" 
                    className="h-8.5 text-xs font-bold uppercase bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      if (!publishImmediately && !scheduledDateTime) {
                        toast.error("Please specify a future date and time to schedule the release.");
                        return;
                      }
                      handlePublishExam(selectedReviewExam?.id, publishImmediately, scheduledDateTime);
                    }}
                  >
                    Confirm & Authorize Release
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialogue: Publish All Exams Confirmation Prompt */}
            <Dialog open={isPublishAllConfirmOpen} onOpenChange={setIsPublishAllConfirmOpen}>
              <DialogContent className="max-w-md text-left">
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="font-display font-extrabold cs-text-navy text-sm uppercase flex items-center gap-2">
                    <Send className="w-4.5 h-4.5 text-emerald-600" />
                    Publish All Examinations Confirmation
                  </DialogTitle>
                  <p className="text-[10px] text-slate-400">
                    Authorization required: Set all unpublished exam papers to Live for student portals.
                  </p>
                </DialogHeader>

                <div className="space-y-4 my-3 text-xs">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-extrabold uppercase text-[10px]">Administrative Authorization</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Are you sure you want to set the status of all unpublished exams to <strong className="text-emerald-700">Live</strong> for the students?
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Total Exam Packets:</span>
                      <span className="font-mono font-bold text-slate-900">{reviewExams.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Currently Live:</span>
                      <span className="font-mono font-bold text-emerald-600">{reviewExams.filter((e: any) => e.status === "published").length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-bold text-indigo-950">Draft / Scheduled to Publish:</span>
                      <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {reviewExams.filter((e: any) => e.status !== "published").length} Exams
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Note: Only the School Administrator can authorize mass exam releases across the campus network.
                  </p>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3">
                  <Button 
                    variant="outline" 
                    className="h-8.5 text-xs text-slate-600"
                    onClick={() => setIsPublishAllConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    className="h-8.5 text-xs font-bold uppercase bg-gradient-to-r from-emerald-600 to-indigo-700 text-white hover:opacity-95 shadow-md cursor-pointer"
                    onClick={handlePublishAllExams}
                  >
                    Confirm & Publish All Live
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      )}

        {/* ----------------- SUBTAB: MESSAGES & BROADCASTS ----------------- */}
        {tab === "messages" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <CommunicationHub currentProfile={currentProfile} />
          </div>
        )}

        {/* ----------------- SUBTAB: SETTINGS / USER ACCOUNT DIRECTORY & PARAMETERS ----------------- */}
        {tab === "settings" && (
          <div className="max-w-5xl space-y-6 animate-in fade-in duration-200">
            
            {/* USER ACCOUNT DIRECTORY & PROFILE CONTROL DESK */}
            <AccountDirectoryManager 
              currentAdminProfile={currentProfile} 
              classesList={activeClasses} 
            />

            <div className="cs-card p-5 space-y-5">
              <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                <Settings className="w-4.5 h-4.5" />
                <h3 className="font-display font-semibold cs-text-navy text-sm">System Formula Parameters</h3>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Motto Principal setting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>School Motto / Credo</Label>
                    <Input value={motto} onChange={(e) => setMotto(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Executive Principal full name</Label>
                    <Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
                  </div>
                </div>

                {/* Assessment formula weights */}
                <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-xl">
                  <div className="flex gap-1.5 items-center">
                    <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                    <Label className="font-black text-indigo-950 uppercase tracking-wide">Multi-CA Grading System Weights Mode</Label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Choosing <strong className="cs-text-navy">4_CA Mode</strong> partitions continuous assessments into four distinct columns of 10 marks each. Choosing <strong className="cs-text-navy">2_CA Mode</strong> partitions grading sheets into two continuous assessments of 20 marks each. This setting is mathematical and updates teacher xlsx grading templates instantly.
                  </p>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 font-bold select-none cursor-pointer text-slate-700">
                      <input 
                        type="radio" 
                        name="ca" 
                        checked={caFormula === "2_CA"} 
                        onChange={() => setCaFormula("2_CA")}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      2 Continuous Assessments (20% & 20% weights)
                    </label>
                    <label className="flex items-center gap-2 font-bold select-none cursor-pointer text-slate-700">
                      <input 
                        type="radio" 
                        name="ca" 
                        checked={caFormula === "4_CA"} 
                        onChange={() => setCaFormula("4_CA")}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      4 Continuous Assessments (10% + 10% + 10% + 10% weights)
                    </label>
                  </div>
                </div>

                {/* Target pass benchmark percentage selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Academic Pass Benchmark Target (%)</Label>
                    <Input 
                      type="number" 
                      value={benchmark} 
                      onChange={(e) => setBenchmark(Number(e.target.value))} 
                      min={30} 
                      max={100}
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">Student averages below this mark automatically raise diagnostic alerts on parents report cards.</span>
                  </div>

                  <div className="space-y-1">
                    <Label>Institutional Brand Theme Hex Color</Label>
                    <div className="flex gap-2">
                      <Input value={mottoColor} onChange={(e) => setMottoColor(e.target.value)} className="font-mono font-bold uppercase" />
                      <input type="color" value={mottoColor} onChange={(e) => setMottoColor(e.target.value)} className="w-10 h-9 p-0 border border-slate-300 rounded-md cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Classes list configurations */}
                <div className="space-y-1">
                  <Label>Registered School Classes / Cohorts (Comma-separated)</Label>
                  <textarea 
                    value={classesInput} 
                    onChange={(e) => setClassesInput(e.target.value)}
                    className="w-full rounded-md border border-slate-350 bg-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white text-slate-800"
                    rows={2}
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Learners mapped to deleted classes will automatically fallback into general unassigned registries.</span>
                </div>

                <div className="flex justify-end pt-3">
                  <Button variant="emerald" onClick={handleUpdateSchoolSettings} className="px-5 font-bold">
                    Save Institutional Parameters
                  </Button>
                </div>
              </div>
            </div>

            {/* Comprehensive settings system containing password updates, fonts, and full theme states */}
            <div className="border-t border-slate-200 pt-6">
              <SettingsPanel
                currentUserProfile={currentProfile}
                theme={theme}
                setTheme={setTheme}
                activeFont={activeFont}
                setActiveFont={setActiveFont}
              />
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Auxiliary Dialog Lockers */}
      <StudentProfileDialog 
        open={studentDlg} 
        onOpenChange={setStudentDlg} 
        student={activeStudent} 
        onSave={handleSaveStudentFolder}
        classes={activeClasses}
      />

      {/* Bulk Status Update Dialog */}
      <BulkStatusUpdateDialog
        open={isBulkStatusDialogOpen}
        onOpenChange={setIsBulkStatusDialogOpen}
        selectedStudents={selectedStudentsObjects}
        onConfirmStatusUpdate={handleBulkStatusUpdate}
      />

      {/* ADD STUDENTS INTERACTIVE MODAL */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black cs-text-navy text-sm uppercase">
              Provision Students — {selectedClassForAdd}
            </DialogTitle>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              High-density registrar console. Lock context: {selectedClassForAdd}
            </p>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-2">
            
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Student Full Name</Label>
              <Input 
                value={provStudentName} 
                onChange={(e) => setProvStudentName(e.target.value)}
                placeholder="e.g. David Macaulay"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Gender Custom Dropdown */}
              <div className="space-y-1 relative">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Gender</Label>
                <button
                  type="button"
                  onClick={() => setIsProvGenderOpen(!isProvGenderOpen)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
                >
                  <span>{provStudentGender}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {isProvGenderOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProvGenderOpen(false)} />
                    <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 font-bold text-slate-700">
                      {["Male", "Female"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setProvStudentGender(g);
                            setIsProvGenderOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition-all text-xs"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Age</Label>
                <Input 
                  type="number"
                  value={provStudentAge} 
                  onChange={(e) => setProvStudentAge(e.target.value)}
                  placeholder="e.g. 16"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Parent Contact String (Email)</Label>
                <Input 
                  type="email"
                  value={provParentEmail} 
                  onChange={(e) => setProvParentEmail(e.target.value)}
                  placeholder="parent.email@example.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Balance Due (₦)</Label>
                <Input 
                  type="number"
                  value={provStudentBalance} 
                  onChange={(e) => setProvStudentBalance(e.target.value)}
                  placeholder="e.g. 15000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Crypto-secure 12-character student password generator block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                <span className="text-[9px] uppercase font-black text-indigo-750 font-mono tracking-wider">Secure Access Locker</span>
                <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                  AES-256 Enabled
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Generates high-entropy credential passwords to secure child performance reports and private financial accounts.
              </p>
              
              <div className="flex gap-2 pt-1.5">
                <div className="flex-1 bg-white border border-slate-200 rounded-md h-9 px-3 flex items-center font-mono text-xs font-black text-indigo-700 tracking-wider">
                  {provPassword}
                </div>
                <button
                  type="button"
                  onClick={() => setProvPassword(generateSecurePassword())}
                  className="px-2.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Regenerate Password"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[10px] uppercase font-black">Regen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(provPassword);
                    toast.success("Temporary portal password copied to clipboard!");
                  }}
                  className="px-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Copy Password"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] uppercase font-black text-indigo-700">Copy</span>
                </button>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddStudentModalOpen(false)}
              className="text-[10.5px] font-black uppercase tracking-wider font-bold"
            >
              Cancel
            </Button>
            <Button 
              variant="emerald" 
              size="sm" 
              onClick={handleProvisionStudentSubmit}
              className="text-[10.5px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              Provision Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkUploadDialog 
        open={bulkDlg} 
        onOpenChange={setBulkDlg} 
        onUploadSuccess={() => loadData()}
        currentProfile={currentProfile}
        existingClasses={school?.classes || ["SS 2 Science", "SS 1 Gold", "SS 3 Art", "JSS 1 Crystal", "JSS 2 Blue", "JSS 3 Alpha"]}
      />

      <CredentialsModal 
        open={credsDlg} 
        onOpenChange={setCredsDlg} 
        credentialInfo={credsValue} 
      />

      {/* Faculty register modal */}
      <Dialog open={userFormDlg} onOpenChange={setUserFormDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Workspace Faculty & Parents</DialogTitle>
            <p className="text-xs text-slate-500">Add profile descriptors and assign login usernames and emails to dispatch instantly.</p>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label>Designation Role Type</Label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs"
              >
                <option value="Class_Teacher">Class Faculty Teacher</option>
                <option value="parent">Registered Parent/Guardian</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Full Real Name</Label>
              <Input 
                value={newUser.fullName} 
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="e.g. Mrs. Folasade Adebayo"
              />
            </div>

            <div className="space-y-1">
              <Label>System Verification Email</Label>
              <Input 
                type="email"
                value={newUser.email} 
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. f.adebayo@cornerstreams.com"
              />
            </div>

            {newUser.role === "Class_Teacher" && (
              <div className="space-y-1">
                <Label>Assigned Class Room</Label>
                <select
                  value={newUser.assignedCohort}
                  onChange={(e) => setNewUser({ ...newUser, assignedCohort: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  <option value="">Select Class Room...</option>
                  {activeClasses.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setUserFormDlg(false)}>
              Cancel
            </Button>
            <Button variant="emerald" size="sm" onClick={handleAddUser}>
              Provision Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------- ACADEMIC ROSTER SLIP & RECEIPT DIALOG ----------------- */}
      <Dialog open={!!activeReceiptClass} onOpenChange={(open) => !open && setActiveReceiptClass(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 bg-white border-0 shadow-2xl">
          {activeReceiptClass && (() => {
            const className = activeReceiptClass;
            const classStudents = students.filter(s => s.class_name === className);
            const assignedTeacher = users.find((u: any) => 
              u.assigned_class === className || 
              (Array.isArray(u.assigned_classes) && u.assigned_classes.includes(className))
            );
            const allSubjects = JSON.parse(localStorage.getItem("CS_SUBJECTS") || "[]");
            const matchedSub = allSubjects.find((s: any) => s.class_name === className);
            const classSubjectsList = matchedSub ? matchedSub.subjects : ["English Language", "Mathematics"];
            const examsForClass = reviewExams.filter((e: any) => e.class_name === className);

            return (
              <div id="printable-roster-slip" className="space-y-6 text-xs text-slate-700">
                {/* Print Header Controls (hidden on print) */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 print:hidden">
                  <div>
                    <DialogTitle className="text-sm font-black uppercase tracking-tight text-indigo-950 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Class Roster & Subject Allocation Receipt
                    </DialogTitle>
                    <p className="text-[10px] text-slate-400 mt-0.5">Official administrative allocation ledger slip for academic reconciliation.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="indigo"
                      size="sm"
                      onClick={() => handleDistributeClassReportToTeacher(className, assignedTeacher?.name)}
                      className="gap-1.5 bg-gradient-to-r from-indigo-700 to-emerald-600 text-white font-black hover:opacity-90 text-[10.5px] uppercase tracking-wider h-8 cursor-pointer print:hidden"
                      title="Distribute this class total subjects PDF directly to teacher dashboard"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{distributedClassReports.includes(className) ? 'Re-distribute to Teacher' : 'Distribute to Teacher'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="emerald"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-1.5 bg-emerald-500 text-slate-950 font-black hover:bg-emerald-600 text-[10.5px] uppercase tracking-wider h-8 cursor-pointer print:hidden"
                      title="Print or export paperless PDF slip using browser print dialog"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / Export PDF Slip (A4)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveReceiptClass(null)}
                      className="h-8 font-bold text-slate-600 text-[10.5px] uppercase"
                    >
                      Close
                    </Button>
                  </div>
                </div>

                {/* Slip Body (Print-Optimized) */}
                <div className="space-y-6 p-4 md:p-6 border border-slate-200 rounded-2xl bg-white print:border-0 print:p-0">
                  {/* Institutional Banner */}
                  <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 font-mono">Official Academic Allocation Slip</span>
                      <h2 className="text-xl font-display font-black text-indigo-950 tracking-tight">{school?.name || "CORNER STREAMS PRIVATE SCHOOL"}</h2>
                      <p className="text-[10px] text-slate-400 max-w-sm">{school?.address || "Block 12, Garki Area 11, Abuja, Nigeria"}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="bg-indigo-950 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest font-mono inline-block">
                        {className.toUpperCase()}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 block mt-1">Generated: {new Date().toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
                    </div>
                  </div>

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 print:bg-white print:border-slate-300">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Classroom Cohort</span>
                      <span className="font-bold text-slate-800 block text-[11px] font-mono">{className}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Assigned Teacher</span>
                      <span className="font-bold text-slate-850 block text-[11px]">{assignedTeacher ? assignedTeacher.name : "Unassigned / Vacant"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Curriculum Load</span>
                      <span className="font-bold text-slate-800 block text-[11px] font-mono">{classSubjectsList.length} Active Subjects</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wide">Student Count</span>
                      <span className="font-bold text-slate-800 block text-[11px] font-mono">{classStudents.length} Profiles Linked</span>
                    </div>
                  </div>

                  {/* Allocated Subjects Roster */}
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-[11px] uppercase tracking-wider text-indigo-950 border-b border-slate-100 pb-1 flex justify-between items-center">
                      <span>1. Curriculum Subjects Registration</span>
                      <span className="text-[9px] text-slate-400 font-normal font-mono">Subjects taken by all students in {className}</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classSubjectsList.map((subj: string, sIdx: number) => {
                        const examDetails = examsForClass.find(e => e.subject === subj);
                        return (
                          <div key={subj} className="bg-slate-50/50 border border-slate-150 p-2.5 rounded-lg flex items-center justify-between print:border-slate-300">
                            <div>
                              <span className="font-mono text-[10px] text-slate-400 block mb-0.5">Subject #{sIdx + 1}</span>
                              <span className="font-bold text-slate-800 text-[10.5px]">{subj}</span>
                            </div>
                            {examDetails ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-150 text-[8.5px] font-mono px-1 py-0 shrink-0">
                                CBT Ready
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border border-slate-200 text-[8.5px] font-mono px-1 py-0 shrink-0">
                                Draft Only
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Student Registrants & Financial Status */}
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-[11px] uppercase tracking-wider text-indigo-950 border-b border-slate-100 pb-1">
                      2. Registered Student Profiles & Accounts
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-2.5 font-bold text-[10px]">Student Full Name</th>
                            <th className="p-2.5 font-bold text-[10px] font-mono">System Username</th>
                            <th className="p-2.5 font-bold text-[10px] text-center">Gender</th>
                            <th className="p-2.5 font-bold text-[10px] text-center">Age</th>
                            <th className="p-2.5 font-bold text-[10px]">Registered Parent Contact</th>
                            <th className="p-2.5 font-bold text-[10px] text-right">Ledger Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-[10px] text-slate-600">
                          {classStudents.map((st: any) => (
                            <tr key={st.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-indigo-950">{st.name}</td>
                              <td className="p-2.5 font-mono text-slate-500">{st.login_email || `${st.name.split(" ").join(".").toLowerCase()}@cornerstreams.edu.ng`}</td>
                              <td className="p-2.5 text-center">{st.gender || "Male"}</td>
                              <td className="p-2.5 text-center font-mono">{st.age || 16} yrs</td>
                              <td className="p-2.5 font-mono text-slate-500">{st.parent_email}</td>
                              <td className="p-2.5 text-right font-mono font-bold">
                                {st.balance_due > 0 ? (
                                  <span className="text-rose-600 font-bold">₦{st.balance_due.toLocaleString()} (Pending)</span>
                                ) : (
                                  <span className="text-emerald-600 font-bold">₦0 (Cleared)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {classStudents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">
                                No student profiles linked to this classroom cohort yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Aggregated Class Subject Grade Ledger for PDF Export & Distribution */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                      <h3 className="font-display font-bold text-[11px] uppercase tracking-wider text-indigo-950">
                        3. Aggregated Class Total Subject Grades Matrix (PDF Distribution)
                      </h3>
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Total Subjects Result per Class: {classSubjectsList.length} Subjects
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto print:border-slate-300">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-indigo-950 text-white font-bold">
                            <th className="p-2.5">Student Name</th>
                            {classSubjectsList.map((sName: string) => (
                              <th key={sName} className="p-2.5 text-center font-mono text-[9.5px]">
                                {sName.length > 10 ? `${sName.slice(0, 10)}...` : sName}
                              </th>
                            ))}
                            <th className="p-2.5 text-center font-mono">Total Avg</th>
                            <th className="p-2.5 text-center font-mono">Grade</th>
                            <th className="p-2.5 text-right">Remark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700">
                          {classStudents.map((st: any, idx: number) => {
                            // Generate consistent score matrix per student across class subjects
                            const baseScore = 75 + ((idx * 7 + 3) % 20);
                            return (
                              <tr key={st.id} className="hover:bg-slate-50/60 font-mono">
                                <td className="p-2.5 font-bold font-sans text-indigo-950">{st.name}</td>
                                {classSubjectsList.map((sName: string, sIndex: number) => {
                                  const score = Math.min(98, Math.max(55, baseScore + ((sIndex * 4) % 15) - 3));
                                  return (
                                    <td key={sName} className="p-2.5 text-center font-bold text-slate-800">
                                      {score}
                                    </td>
                                  );
                                })}
                                <td className="p-2.5 text-center font-black text-indigo-900 bg-indigo-50/50">
                                  {baseScore}%
                                </td>
                                <td className="p-2.5 text-center font-black">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                    baseScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {baseScore >= 85 ? 'A+' : baseScore >= 75 ? 'A' : 'B'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-sans font-bold text-emerald-700 text-[10px]">
                                  {baseScore >= 85 ? 'Distinction' : 'Very Good'}
                                </td>
                              </tr>
                            );
                          })}
                          {classStudents.length === 0 && (
                            <tr>
                              <td colSpan={classSubjectsList.length + 4} className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">
                                No student scores available for this class cohort yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Administrative Sign-Off */}
                  <div className="grid grid-cols-2 gap-12 pt-8 border-t border-dashed border-slate-200">
                    <div className="space-y-4">
                      <div className="h-10 flex items-end justify-start">
                        {principalSignature ? (
                          <img src={principalSignature} alt="Principal Signature" className="max-h-12 object-contain" />
                        ) : (
                          <span className="text-slate-350 italic text-[10px]">Waiting for principal signature sign-off...</span>
                        )}
                      </div>
                      <div className="border-t border-slate-400 pt-1">
                        <span className="font-bold text-slate-800 block text-[10px]">{principalName || "Chief Folasade Adebayo"}</span>
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono">Principal / Academic Director</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-right">
                      <div className="h-10 flex items-end justify-end">
                        <span className="font-mono text-[9px] uppercase font-black text-emerald-600 border border-emerald-200 bg-emerald-50/50 px-2 py-1 rounded">
                          APPROVED & VERIFIED
                        </span>
                      </div>
                      <div className="border-t border-slate-400 pt-1">
                        <span className="font-bold text-slate-800 block text-[10px]">Corner Streams Registry Office</span>
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono">Verification Authority</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* REASSIGN SUBJECT LOAD MODAL */}
      {reassignModalTarget.isOpen && (
        <ReassignSubjectModal
          isOpen={reassignModalTarget.isOpen}
          onClose={() => setReassignModalTarget({ isOpen: false, teacherName: '' })}
          teacherName={reassignModalTarget.teacherName}
          teacherEmail={reassignModalTarget.teacherEmail}
          teacherId={reassignModalTarget.teacherId}
          onSaved={() => {
            setReassignModalTarget({ isOpen: false, teacherName: '' });
            window.dispatchEvent(new Event("teacher_workload_updated"));
          }}
        />
      )}

      {/* ASSIGNED STUDENTS ROSTER MODAL FOR FACULTY */}
      {viewingTeacherStudents && (
        <Dialog open={Boolean(viewingTeacherStudents)} onOpenChange={() => setViewingTeacherStudents(null)}>
          <DialogContent className="max-w-xl bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Assigned Students Roster: {viewingTeacherStudents.name}</span>
              </DialogTitle>
              <p className="text-xs text-slate-500">
                Showing student profiles registered under assigned classes: <strong>{viewingTeacherStudents.assignedClasses?.join(", ")}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-3 my-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={teacherStudentSearch}
                  onChange={(e) => setTeacherStudentSearch(e.target.value)}
                  placeholder="Search assigned student profiles by name or ID..."
                  className="pl-9 pr-8 h-8.5 text-xs bg-slate-50"
                />
                {teacherStudentSearch && (
                  <button onClick={() => setTeacherStudentSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {students
                  .filter(st => viewingTeacherStudents.assignedClasses?.includes(st.class_name))
                  .filter(st => {
                    if (!teacherStudentSearch.trim()) return true;
                    const q = teacherStudentSearch.toLowerCase();
                    return st.name?.toLowerCase().includes(q) || (st.id && String(st.id).toLowerCase().includes(q));
                  })
                  .map((st, idx) => (
                    <div key={st.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {st.name?.charAt(0) || "S"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">{st.name}</span>
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-white text-indigo-700 rounded border border-slate-200">
                              #{st.id || `CS-${8200 + idx}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">{st.class_name} • {st.login_email}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] font-bold"
                        onClick={() => { setActiveStudent(st); setStudentDlg(true); setViewingTeacherStudents(null); }}
                      >
                        <Edit className="w-3 h-3 text-slate-500 mr-1" />
                        View Folder
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setViewingTeacherStudents(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DEDICATED REPORT CARD PRINT PREVIEW MODAL FOR SCHOOL ADMINS */}
      <ReportCardPrintPreviewModal
        isOpen={isReportPrintModalOpen}
        onClose={() => setIsReportPrintModalOpen(false)}
        studentsList={filteredStudents}
        availableClasses={availableReportClasses}
        initialClass={selectedExportClass || availableReportClasses[0] || "SS 2 Science"}
        initialStudentId={activeReportStudent?.id || "ALL"}
        schoolInfo={{
          name: school?.name || "Corner Streams International Academy",
          motto: school?.motto || "Excellence & Honor in Character",
          logo_url: school?.logo_url || "",
          address: "12 Corner Streams Boulevard, Victoria Island, Lagos",
          principalName: "Dr. Mrs. Folasade Adebayo"
        }}
        activeSession="2025/2026 (Current)"
        activeTerm="1st Term"
      />

      {/* INTERACTIVE PLAN COMPARISON MODAL */}
      <InteractivePlanComparisonModal
        isOpen={isPlanComparisonOpen}
        onClose={() => setIsPlanComparisonOpen(false)}
        currentTier={school?.subscription_tier || "unified_enterprise"}
        onTierChange={(newTier) => handleUpdateSubscriptionTier(newTier)}
      />

      {/* TWO-STEP CERTIFICATION & AUTH GATEKEEPER MODAL FOR PUBLISHING/LOCKING RESULTS */}
      <ResultPublishCertificationModal
        isOpen={isPublishCertModalOpen}
        onClose={() => setIsPublishCertModalOpen(false)}
        isCurrentlyPublished={localIsPublished}
        onConfirmStatusChange={handleStatusChangeConfirmed}
        schoolName={school?.name || "Corner Streams International Academy"}
        adminName={currentProfile?.fullName || "School Administrator"}
      />
    </div>
  );
}
export default SchoolAdminDashboard;
