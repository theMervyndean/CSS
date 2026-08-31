/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../../types';
import { mockUsers } from '../../mockData';
import { 
  Award, Clock, RotateCcw, ShieldCheck, HelpCircle, Eye, EyeOff, Search,
  TrendingUp, BarChart3, ChevronDown, Check, Trash2, Sliders, AlertCircle,
  GraduationCap, BookOpen, Users, FolderCheck, Activity, ClipboardCheck, LogOut,
  ArrowLeft, Mail, Phone, Calendar, UserCheck, Shield, Receipt, Settings,
  Printer, FileText, CheckCircle2, ShieldAlert, Plus, X, Download, Upload, AlertTriangle, Bell, Send,
  Sun, Moon, Monitor, Sparkles, Palette, Type
} from 'lucide-react';
import { toast } from 'sonner';
import { GradeDistributionChart } from '../GradeDistributionChart';
import { OfflineCbtChart } from '../OfflineCbtChart';

const themesList = [
  { id: "light", label: "Light Mode", icon: Sun, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200" },
  { id: "dark", label: "Dark Mode", icon: Moon, color: "text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-900" },
  { id: "system", label: "System OS", icon: Monitor, color: "text-slate-400 bg-slate-50 dark:bg-slate-950/30", border: "border-slate-800" },
  { id: "emerald", label: "Emerald Mint", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-600/30" },
  { id: "amber", label: "Amber Gold", icon: Sun, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30", border: "border-amber-600/30" },
  { id: "purple", label: "Royal Amethyst", icon: Palette, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30", border: "border-purple-600/30" }
] as const;

const fontsList = [
  { id: "montserrat", label: "Montserrat", desc: "High-Contrast Display Geometric (Brand Primary)", previewClass: "font-opt-montserrat" },
  { id: "poppins", label: "Poppins", desc: "Rounded Geometric Sans", previewClass: "font-opt-poppins" },
  { id: "inter", label: "Inter", desc: "Clean & Precise Modern Swiss", previewClass: "font-opt-inter" },
  { id: "mono", label: "JetBrains Mono", desc: "High-Fidelity Developer Codebase", previewClass: "font-opt-mono" },
  { id: "serif", label: "Playfair Display", desc: "Editorial Serif Layout Styling", previewClass: "font-opt-serif" },
  { id: "space", label: "Space Grotesk", desc: "Tech Display Geometry", previewClass: "font-opt-space" }
] as const;

interface AdminCbtViewProps {
  currentProfile: UserProfile;
  exams: CbtExam[];
  sessions: CbtSessionState[];
  students: UserProfile[];
  onDeleteExam: (examId: string) => void;
  onUpdateExam: (exam: CbtExam) => void;
  onResetStudentAttempt: (studentId: string, examId: string) => void;
  releaseScores: boolean;
  onToggleReleaseScores: () => void;
  passBenchmark: number;
  onUpdatePassBenchmark: (benchmark: number) => void;
  onLogout?: () => void;
  activeNavOverride?: string;
  classesList?: string[];
  onAddClass?: (className: string) => void;
  onAddStudent?: (student: UserProfile) => void;
  theme?: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple';
  setTheme?: (theme: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple') => void;
  activeFont?: string;
  setActiveFont?: (font: string) => void;
}

export default function AdminCbtView({
  currentProfile,
  exams,
  sessions,
  students,
  onDeleteExam,
  onUpdateExam,
  onResetStudentAttempt,
  releaseScores,
  onToggleReleaseScores,
  passBenchmark,
  onUpdatePassBenchmark,
  onLogout,
  activeNavOverride,
  classesList = ["SS 2A", "SS 1B", "JSS 3", "Primary 5", "Primary 2"],
  onAddClass,
  onAddStudent,
  theme,
  setTheme,
  activeFont,
  setActiveFont
}: AdminCbtViewProps) {
  // Navigation State corresponding EXACTLY to the requested list:
  // 1. School Overview - Classes, Subjects, Teachers
  // 2. Receipt
  // 3. Uploaded Exams
  // 4. Live Exams
  // 5. Completed Exams
  // 6. System Settings
  // 7. Sign Out
  const [activeNav, setActiveNav] = useState<'classes' | 'subjects' | 'teachers' | 'receipt' | 'uploaded' | 'live' | 'completed' | 'settings'>('classes');

  // Stateful subjects directory
  const [subjectsList, setSubjectsList] = useState([
    { code: "MTH401", name: "Mathematics", duration: 10, tutor: "Mrs. Folasade Adebayo", department: "Science", classCohort: "SS 2A", academicYear: "2025/2026" },
    { code: "ENG401", name: "English Language", duration: 15, tutor: "Dr. Emeka Nwosu", department: "Art", classCohort: "SS 2A", academicYear: "2025/2026" },
    { code: "PHY402", name: "Physics", duration: 12, tutor: "Mrs. Folasade Adebayo", department: "Science", classCohort: "SS 1B", academicYear: "2025/2026" },
    { code: "CSC202", name: "Computer Science", duration: 10, tutor: "Dr. Emeka Nwosu", department: "Technology", classCohort: "JSS 3", academicYear: "2025/2026" },
    { code: "CIV301", name: "Civics & Resiliency", duration: 8, tutor: "Mrs. Folasade Adebayo", department: "Art", classCohort: "Primary 5", academicYear: "2024/2025" }
  ]);

  // Search & Filter state for Subjects navigation directory
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [subjectClassFilter, setSubjectClassFilter] = useState('All Classes');
  const [isSubjectClassFilterOpen, setIsSubjectClassFilterOpen] = useState(false);
  const [subjectYearFilter, setSubjectYearFilter] = useState('All Academic Years');
  const [isSubjectYearFilterOpen, setIsSubjectYearFilterOpen] = useState(false);

  // Export Class Results Modal State
  const [isExportClassModalOpen, setIsExportClassModalOpen] = useState(false);
  const [exportClassTarget, setExportClassTarget] = useState('SS 2A');
  const [isExportClassDropdownOpen, setIsExportClassDropdownOpen] = useState(false);
  const [exportAcademicYear, setExportAcademicYear] = useState('2025/2026');
  const [isExportYearDropdownOpen, setIsExportYearDropdownOpen] = useState(false);
  const [exportAcademicTerm, setExportAcademicTerm] = useState('First Term');
  const [isExportTermDropdownOpen, setIsExportTermDropdownOpen] = useState(false);
  const [distributedClassKeys, setDistributedClassKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("CS_DISTRIBUTED_CLASS_RESULTS") || "[]");
    } catch {
      return [];
    }
  });

  const [adminSelectedSubjectCard, setAdminSelectedSubjectCard] = useState<CbtExam | null>(null);
  const [adminUploadedSearchQuery, setAdminUploadedSearchQuery] = useState('');
  const [isPublishAllModalOpen, setIsPublishAllModalOpen] = useState(false);

  const handleDownloadExamQuestionTemplate = () => {
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
    toast.success("Standardized Excel / CSV Question Template downloaded successfully!");
  };

  const handleConfirmPublishAllExams = () => {
    const unpublishedExams = exams.filter(e => !(e.publishedToStudents ?? e.published));
    if (unpublishedExams.length === 0) {
      toast.info("All uploaded exams are already published live for students!");
      setIsPublishAllModalOpen(false);
      return;
    }
    unpublishedExams.forEach(exam => {
      onUpdateExam({
        ...exam,
        publishedToStudents: true,
        published: true
      });
    });
    toast.success(`🎉 Successfully published all ${unpublishedExams.length} draft exam(s) live to students!`);
    setIsPublishAllModalOpen(false);
  };

  const handleDistributeClassResultsToTeacher = (className: string, yr: string, term: string) => {
    const ledgerKey = `${className}_${yr}_${term}`;
    const nextKeys = Array.from(new Set([...distributedClassKeys, ledgerKey]));
    setDistributedClassKeys(nextKeys);
    localStorage.setItem("CS_DISTRIBUTED_CLASS_RESULTS", JSON.stringify(nextKeys));
    
    const classTeacher = teachersList.find(t => t.classCohort === className)?.fullName || "Form Tutors & Subject Teachers";
    
    toast.success(`🎉 Official Consolidated Class Results Ledger for "${className}" (${yr} ${term}) successfully distributed directly to ${classTeacher}'s Dashboard!`, {
      duration: 5000
    });
  };

  const handleExportClassMasterCSV = (className: string, yr: string, term: string) => {
    const classStudents = students.filter(s => s.classCohort === className);
    const effectiveStudents = classStudents.length > 0 ? classStudents : [
      { id: "usr-stu-1", username: "CS-SEC-7201", fullName: "Adebayo Kolawole", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
      { id: "usr-stu-2", username: "CS-SEC-7202", fullName: "Onyeka Chioma", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
      { id: "usr-stu-3", username: "CS-SEC-7203", fullName: "Fatima Abubakar", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
      { id: "usr-stu-4", username: "CS-SEC-7204", fullName: "Chinedu Eze", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
      { id: "usr-stu-5", username: "CS-SEC-7205", fullName: "Folake Adeleke", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
      { id: "usr-stu-6", username: "CS-SEC-7206", fullName: "Ibrahim Musa", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" }
    ];

    const subjectsForClass = subjectsList.filter(s => (s as any).classCohort === className || true).slice(0, 5);
    const headers = ["Rank", "Candidate ID", "Candidate Full Name", ...subjectsForClass.map(s => s.name), "Total Score", "Average (%)", "Grade", "Remark"];

    const studentRows = effectiveStudents.map((student, idx) => {
      const baseScores = [
        [88, 82, 75, 90, 84],
        [80, 85, 68, 88, 78],
        [72, 78, 62, 82, 70],
        [65, 70, 58, 75, 66],
        [58, 62, 52, 68, 60],
        [45, 52, 42, 55, 48]
      ];
      const scores = baseScores[idx % baseScores.length];
      const total = scores.reduce((a, b) => a + b, 0);
      const avg = Math.round(total / scores.length);
      const grade = avg >= 75 ? "A" : avg >= 65 ? "B" : avg >= 50 ? "C" : avg >= 40 ? "D" : "F";
      const remark = avg >= 75 ? "Distinction" : avg >= 65 ? "Upper Credit" : avg >= 50 ? "Credit Pass" : "Needs Imp.";
      const rank = `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'}`;

      return [rank, student.username, student.fullName, ...scores, total, `${avg}%`, grade, remark];
    });

    const csvContent = "\uFEFF" + [
      [`CORNER STREAMS INTERNATIONAL ACADEMY - CONSOLIDATED CLASS RESULTS LEDGER (${className} - ${yr} ${term})`],
      [],
      headers.join(","),
      ...studentRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Consolidated_Class_Results_${className.replace(/\s+/g, '_')}_${yr.replace('/', '-')}_${term.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported Consolidated Class Results Master CSV for ${className} (${yr} ${term})!`);
  };

  // Selected Subject for Interactive Detail & Results Modal
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<any | null>(null);
  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);
  const [distributedSubjectKeys, setDistributedSubjectKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("CS_DISTRIBUTED_SUBJECT_RESULTS") || "[]");
    } catch {
      return [];
    }
  });

  const handleDistributeSubjectToTeacher = (subjName: string, tutorName: string) => {
    const nextKeys = Array.from(new Set([...distributedSubjectKeys, subjName]));
    setDistributedSubjectKeys(nextKeys);
    localStorage.setItem("CS_DISTRIBUTED_SUBJECT_RESULTS", JSON.stringify(nextKeys));
    toast.success(`🎉 Official Subject Results Ledger for "${subjName}" distributed directly to ${tutorName}'s Dashboard!`, {
      duration: 5000
    });
  };

  // Gemini Teacher Intervention Plan & Benchmark Alert States
  const [interventionPlanSubject, setInterventionPlanSubject] = useState<any | null>(null);
  const [isGeneratingInterventionPlan, setIsGeneratingInterventionPlan] = useState(false);
  const [generatedInterventionPlan, setGeneratedInterventionPlan] = useState<any | null>(null);
  const [interventionCustomNotes, setInterventionCustomNotes] = useState<string>('');
  const [planAutoSaveState, setPlanAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [benchmarkAlertSubject, setBenchmarkAlertSubject] = useState<any | null>(null);

  // Load existing plan from localStorage if available
  const handleGenerateInterventionPlan = async (subject: any, classAvg: number, benchmark: number) => {
    setInterventionPlanSubject(subject);
    setGeneratedInterventionPlan(null);
    setInterventionCustomNotes('');

    // Check if an intervention plan is already saved in localStorage for this subject
    try {
      const savedPlans = JSON.parse(localStorage.getItem("CS_CBT_INTERVENTION_PLANS") || "{}");
      if (savedPlans[subject.name]) {
        const savedPlanObj = savedPlans[subject.name];
        setGeneratedInterventionPlan(savedPlanObj);
        setInterventionCustomNotes(savedPlanObj.customNotes || '');
        toast.info(`⚡ Loaded saved Intervention Plan for ${subject.name}`);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    setIsGeneratingInterventionPlan(true);

    try {
      const res = await fetch("/api/cbt/generate-intervention-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: subject.name,
          classAvg,
          schoolBenchmark: benchmark,
          tutor: subject.tutor,
          classCohort: (subject as any).classCohort || 'SS 2A'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate plan");
      }

      const data = await res.json();
      setGeneratedInterventionPlan(data.plan);
      setInterventionCustomNotes(data.plan.customNotes || '');
      toast.success(`✨ Naziee Faculty Mentor Plan generated for ${subject.name}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error generating plan: ${err.message || "Failed to reach AI service"}`);
    } finally {
      setIsGeneratingInterventionPlan(false);
    }
  };

  // Debounced auto-save effect for Intervention Plan changes
  useEffect(() => {
    if (!interventionPlanSubject || !generatedInterventionPlan) return;

    setPlanAutoSaveState('saving');
    const timer = setTimeout(() => {
      try {
        const savedPlans = JSON.parse(localStorage.getItem("CS_CBT_INTERVENTION_PLANS") || "{}");
        savedPlans[interventionPlanSubject.name] = {
          ...generatedInterventionPlan,
          customNotes: interventionCustomNotes,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem("CS_CBT_INTERVENTION_PLANS", JSON.stringify(savedPlans));
        setPlanAutoSaveState('saved');
      } catch (e) {
        console.error("Failed to auto-save intervention plan:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [generatedInterventionPlan, interventionCustomNotes, interventionPlanSubject]);

  const handleTriggerBenchmarkAlert = (subject: any, classAvg: number, benchmark: number) => {
    setBenchmarkAlertSubject({ ...subject, classAvg, benchmark });
    toast.error(
      `🚨 BENCHMARK ALERT: ${subject.name} average (${classAvg}%) is below school benchmark (${benchmark}%).`,
      { duration: 5000 }
    );
  };

  // Form States for adding new subject
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDept, setNewSubjectDept] = useState<'Art' | 'Science' | 'Commercial' | 'Technology'>('Science');
  const [isSubjectDeptDropdownOpen, setIsSubjectDeptDropdownOpen] = useState(false);
  const [newSubjectTutor, setNewSubjectTutor] = useState('Mrs. Folasade Adebayo');
  const [isSubjectTutorDropdownOpen, setIsSubjectTutorDropdownOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectDuration, setNewSubjectDuration] = useState(10);
  const [newSubjectClass, setNewSubjectClass] = useState('SS 2A');
  const [isNewSubjectClassDropdownOpen, setIsNewSubjectClassDropdownOpen] = useState(false);
  const [newSubjectYear, setNewSubjectYear] = useState('2025/2026');
  const [isNewSubjectYearDropdownOpen, setIsNewSubjectYearDropdownOpen] = useState(false);

  useEffect(() => {
    if (activeNavOverride) {
      const mapped = activeNavOverride.toLowerCase();
      if (['classes', 'subjects', 'teachers', 'receipt', 'uploaded', 'live', 'completed', 'settings'].includes(mapped)) {
        setActiveNav(mapped as any);
      }
    }
  }, [activeNavOverride]);
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Select states (No Native Dropdowns - obeys AGENTS.md conventions)
  const [isFilterExamOpen, setIsFilterExamOpen] = useState(false);
  const [selectedFilterExam, setSelectedFilterExam] = useState<CbtExam | null>(null);
  
  // Custom dropdown states for System Settings (No Native Dropdowns)
  const [isCheatingModeOpen, setIsCheatingModeOpen] = useState(false);
  const [antiCheatMode, setAntiCheatMode] = useState<'Enabled' | 'Disabled'>('Enabled');
  
  const [isWarningTimeOpen, setIsWarningTimeOpen] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState<'5 Minutes' | '10 Minutes' | '3 Minutes'>('5 Minutes');

  const [customLimits, setCustomLimits] = useState<Record<string, number>>({});
  const [liveTimers, setLiveTimers] = useState<Record<string, { startTime: string, durationMinutes: number, active: boolean }>>({});

  useEffect(() => {
    const updateTimers = () => {
      const updated: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('CS_CBT_LIVE_TIMER_')) {
          const examId = key.replace('CS_CBT_LIVE_TIMER_', '');
          try {
            const val = JSON.parse(localStorage.getItem(key) || '');
            updated[examId] = val;
          } catch (e) {}
        }
      }
      setLiveTimers(updated);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  const [passBenchmarkInput, setPassBenchmarkInput] = useState(passBenchmark);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Form States for dynamic classes & students
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 11 / SS 2');
  const [newStudentArm, setNewStudentArm] = useState<'Creche' | 'Nursery' | 'Montessori' | 'Primary' | 'Secondary'>('Secondary');
  const [isStudentArmDropdownOpen, setIsStudentArmDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAddStudentOpen) {
      setNewStudentUsername(`CS-${newStudentArm === 'Secondary' ? 'SEC' : 'PRI'}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isAddStudentOpen, newStudentArm]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) {
      toast.error("Please enter a valid class name.");
      return;
    }
    if (onAddClass) {
      onAddClass(trimmed);
      setNewClassName('');
      setIsAddClassOpen(false);
    } else {
      toast.error("Add Class capability is not connected.");
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const sName = newStudentName.trim();
    const sUser = newStudentUsername.trim().toUpperCase();
    if (!sName || !sUser) {
      toast.error("Please fill in all candidate details.");
      return;
    }
    if (!selectedClass) {
      toast.error("No class cohort selected.");
      return;
    }

    const newStudent: UserProfile = {
      id: `usr-stu-${Date.now()}`,
      username: sUser,
      fullName: sName,
      role: 'Student',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
      arm: newStudentArm,
      gradeLevel: newStudentGrade,
      classCohort: selectedClass
    };

    if (onAddStudent) {
      onAddStudent(newStudent);
      setNewStudentName('');
      setNewStudentUsername('');
      setIsAddStudentOpen(false);
    } else {
      toast.error("Add Student capability is not connected.");
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newSubjectName.trim();
    const codeTrimmed = newSubjectCode.trim().toUpperCase() || `SUB-${Math.floor(100 + Math.random() * 900)}`;
    const tutorSelected = newSubjectTutor.trim();
    const durationSelected = Number(newSubjectDuration) || 10;

    if (!nameTrimmed) {
      toast.error("Please enter a valid subject name.");
      return;
    }

    if (subjectsList.some(s => s.code.toUpperCase() === codeTrimmed)) {
      toast.error(`A subject with code ${codeTrimmed} already exists.`);
      return;
    }

    const newSubject = {
      code: codeTrimmed,
      name: nameTrimmed,
      duration: durationSelected,
      tutor: tutorSelected,
      department: newSubjectDept,
      classCohort: newSubjectClass,
      academicYear: newSubjectYear
    };

    setSubjectsList(prev => [...prev, newSubject]);
    toast.success(`Successfully added new subject: ${nameTrimmed} (${newSubjectDept})`);

    // Reset Form
    setNewSubjectName('');
    setNewSubjectCode('');
    setIsAddSubjectOpen(false);
  };

  const handleDownloadExcelTemplate = () => {
    if (!selectedClass) return;
    
    // Create Excel-friendly CSV content
    const headers = ["Candidate ID", "Full Name", "Academic Arm", "Grade Level"];
    const sampleData = [
      ["CS-SEC-7201", "Adebayo Kolawole", "Secondary", "Grade 11 / SS 2"],
      ["CS-SEC-7202", "Onyeka Chioma", "Secondary", "Grade 11 / SS 2"],
      ["CS-SEC-7203", "Fatima Abubakar", "Secondary", "Grade 11 / SS 2"]
    ];

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...sampleData.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CBT_Enrollment_Template_${selectedClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Excel upload template for ${selectedClass} downloaded successfully.`);
  };

  const handleExportRoster = () => {
    if (!selectedClass) return;
    const classStudents = students.filter(s => s.classCohort === selectedClass);
    if (classStudents.length === 0) {
      toast.warning("No students currently registered in this class to export.");
      return;
    }

    const headers = ["Candidate ID", "Full Name", "Academic Arm", "Grade Level"];
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...classStudents.map(s => [
        s.username,
        s.fullName,
        s.arm || "Secondary",
        s.gradeLevel || "Grade 11 / SS 2"
      ].map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CBT_Roster_Export_${selectedClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${classStudents.length} candidates from ${selectedClass} successfully!`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClass) {
      toast.error("No class cohort selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          toast.error("Empty template file or reading error.");
          return;
        }

        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          toast.error("No data found in the template file.");
          return;
        }

        const newStudents: UserProfile[] = [];
        let duplicateCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Parse CSV line, handling quotes
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          if (matches.length < 2) continue;

          // Clean up values
          const cleanVals = matches.map(val => val.replace(/^["']|["']$/g, '').trim());
          const candidateId = cleanVals[0];
          const fullName = cleanVals[1];
          const academicArm = (cleanVals[2] as any) || 'Secondary';
          const gradeLevel = cleanVals[3] || 'Grade 11 / SS 2';

          if (!candidateId || !fullName) continue;

          // Check if candidate ID already exists in the current student list
          const exists = students.some(s => s.username.toLowerCase() === candidateId.toLowerCase());
          if (exists) {
            duplicateCount++;
            continue;
          }

          const newStudent: UserProfile = {
            id: `usr-stu-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            username: candidateId.toUpperCase(),
            fullName: fullName,
            role: 'Student',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
            arm: academicArm,
            gradeLevel: gradeLevel,
            classCohort: selectedClass
          };

          newStudents.push(newStudent);
        }

        if (newStudents.length === 0) {
          if (duplicateCount > 0) {
            toast.error(`Failed to upload: All ${duplicateCount} candidates already exist in the database.`);
          } else {
            toast.error("No valid candidate records could be parsed. Please check template structure.");
          }
          return;
        }

        // Add them all
        newStudents.forEach(stu => {
          if (onAddStudent) {
            onAddStudent(stu);
          }
        });

        if (duplicateCount > 0) {
          toast.success(`Successfully uploaded and registered ${newStudents.length} candidates. Skipped ${duplicateCount} duplicates.`);
        } else {
          toast.success(`Successfully uploaded and registered ${newStudents.length} candidates into ${selectedClass}!`);
        }

        // Reset input value
        e.target.value = '';
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while parsing the CSV template.");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // General lists
  const teachersList = mockUsers.filter(u => u.role === 'Class_Teacher' || u.role === 'Non_Class_Teacher');

  // Stats calculation
  const totalExams = exams.length;
  const totalAttempts = sessions.filter(s => s.isCompleted).length;
  const activeExams = exams.filter(e => e.published).length;
  
  const getSchoolWideAverage = () => {
    const completed = sessions.filter(s => s.isCompleted);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, s) => sum + (s.score ?? 0), 0);
    return Math.round(total / completed.length);
  };
  
  const schoolWideAvg = getSchoolWideAverage();

  // Receipt list
  const mockReceipts = [
    {
      id: "REC-CBT-2026-904",
      examTitle: "MTH401 - Mathematics Term MCQ Exam",
      subject: "Mathematics",
      generatedBy: "Mrs. Folasade Adebayo",
      candidatesCount: 28,
      timestamp: "2026-07-02T10:14:00Z",
      tokenBatch: "MTH-902-X9",
      status: "Verified Sync",
      amount: "Institutional Plan"
    },
    {
      id: "REC-CBT-2026-905",
      examTitle: "PHY402 - Physics Midterm Assessment",
      subject: "Physics",
      generatedBy: "Mrs. Folasade Adebayo",
      candidatesCount: 15,
      timestamp: "2026-07-03T08:45:00Z",
      tokenBatch: "PHY-331-Z4",
      status: "Verified Sync",
      amount: "Institutional Plan"
    },
    {
      id: "REC-CBT-2026-906",
      examTitle: "CSC202 - Computer Science Lab Test",
      subject: "Computer Science",
      generatedBy: "Dr. Emeka Nwosu",
      candidatesCount: 30,
      timestamp: "2026-07-04T06:20:00Z",
      tokenBatch: "CSC-881-A2",
      status: "Verified Sync",
      amount: "Institutional Plan"
    }
  ];

  // Filter completed sessions
  const filteredCompletedSessions = sessions.filter(session => {
    if (!session.isCompleted) return false;
    
    // Filter by selected exam
    if (selectedFilterExam && session.examId !== selectedFilterExam.id) {
      return false;
    }

    // Filter by student search
    if (searchTerm.trim()) {
      const studentObj = students.find(s => s.id === session.studentId);
      const sName = (studentObj?.fullName || '').toLowerCase();
      const sId = (studentObj?.username || '').toLowerCase();
      const matchText = searchTerm.toLowerCase();
      if (!sName.includes(matchText) && !sId.includes(matchText)) {
        return false;
      }
    }

    return true;
  });

  const handleResetAttempt = (studentId: string, examId: string) => {
    const student = students.find(s => s.id === studentId);
    onResetStudentAttempt(studentId, examId);
    toast.success(
      `CBT Session reset successfully for ${student?.fullName.toUpperCase() || studentId}. Candidate is cleared to retake.`
    );
  };

  const handleSaveSettings = () => {
    onUpdatePassBenchmark(Number(passBenchmarkInput));
    toast.success("Institutional CBT system configuration saved successfully.");
  };

  const handleSignOutClick = () => {
    if (confirm("Are you sure you want to sign out of the CBT Admin dashboard?")) {
      if (onLogout) {
        onLogout();
      } else {
        toast.error("Logout callback not connected. Redirecting...");
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black uppercase text-indigo-950 font-display tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Corner Streams CBT Administrator Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Institutional assessment overview, candidate verification registries, and resilient grade monitoring.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-xl font-black font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          ADMIN ACCOUNT ACTIVE
        </div>
      </div>

      {/* STATS OVERVIEW ROWS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out cursor-default">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Total Papers</p>
            <p className="text-lg font-black text-indigo-950 mt-0.5">{totalExams} Uploaded</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out cursor-default">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Live Sessions</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{activeExams} Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out cursor-default">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Mean CBT Grade</p>
            <p className="text-lg font-black text-amber-600 mt-0.5">{schoolWideAvg}% Score</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out cursor-default">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Completed Sheets</p>
            <p className="text-lg font-black text-purple-600 mt-0.5">{totalAttempts} Submissions</p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT NAV PANEL SIDEBAR - CONTAINING EXCLUSIVELY REQUESTED NAVIGATIONS */}
        {!activeNavOverride && (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
            {/* Supervisor Profile Card */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-indigo-50">
                  <img src={currentProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-indigo-950 truncate leading-none mb-1">
                  {currentProfile.fullName}
                </h4>
                <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none font-mono">
                  {currentProfile.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* 1. School Overview */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-950 block px-2.5">
                1. School Overview
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveNav('classes'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'classes'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className={`w-4 h-4 shrink-0 ${activeNav === 'classes' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>Classes</span>
                </button>

                <button
                  onClick={() => { setActiveNav('subjects'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'subjects'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 shrink-0 ${activeNav === 'subjects' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>Subjects</span>
                </button>

                <button
                  onClick={() => { setActiveNav('teachers'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'teachers'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeNav === 'teachers' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>Teachers</span>
                </button>
              </nav>
            </div>

            {/* Core Categories: 2 to 7 */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-950 block px-2.5">
                CBT Operations
              </span>
              <nav className="space-y-1">
                {/* 2. Receipt */}
                <button
                  onClick={() => { setActiveNav('receipt'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'receipt'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Receipt className={`w-4 h-4 shrink-0 ${activeNav === 'receipt' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>2. Receipt</span>
                </button>

                {/* 3. uploaded exams */}
                <button
                  onClick={() => { setActiveNav('uploaded'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'uploaded'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FolderCheck className={`w-4 h-4 shrink-0 ${activeNav === 'uploaded' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>3. Uploaded Exams</span>
                </button>

                {/* 4. Live exams */}
                <button
                  onClick={() => { setActiveNav('live'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'live'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Activity className={`w-4 h-4 shrink-0 ${activeNav === 'live' ? 'text-emerald-400 animate-pulse' : 'text-indigo-600'}`} />
                  <span>4. Live Exams</span>
                </button>

                {/* 5. Completed exams */}
                <button
                  onClick={() => { setActiveNav('completed'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'completed'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardCheck className={`w-4 h-4 shrink-0 ${activeNav === 'completed' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>5. Completed Exams</span>
                </button>

                {/* 6. System Settings */}
                <button
                  onClick={() => { setActiveNav('settings'); setSelectedClass(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    activeNav === 'settings'
                      ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white font-black border-l-4 border-emerald-500 shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className={`w-4 h-4 shrink-0 ${activeNav === 'settings' ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  <span>6. System Settings</span>
                </button>

                {/* 7. Sign Out */}
                <button
                  onClick={handleSignOutClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left text-rose-600 hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-100"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>7. Sign Out</span>
                </button>
              </nav>
            </div>

            {/* Footer copyright label (from AGENTS.md rules) */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[9.5px] font-mono text-slate-400 block font-bold">
                © 2026 Corner Streams. All rights reserved.
              </span>
            </div>
          </div>
        )}

        {/* RIGHT WORKSPACE WORK AREA */}
        <div className={`${activeNavOverride ? 'lg:col-span-12' : 'lg:col-span-9'} space-y-6`}>
          
          {/* (a) CLASSES TAB CONTAINER */}
          {activeNav === 'classes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              {!selectedClass ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">Institutional Academic Classes</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Manage grading boundaries and review students registered in various classes.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setExportClassTarget(selectedClass || classesList[0] || 'SS 2A');
                          setIsExportClassModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0 border-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
                        <span>Export Class Results (PDF)</span>
                      </button>
                      <button
                        onClick={() => setIsAddClassOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Class</span>
                      </button>
                    </div>
                  </div>

                  {isAddClassOpen && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top duration-200">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">Create New Academic Class</span>
                        <button onClick={() => setIsAddClassOpen(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateClass} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Class Cohort Name (e.g., SS 3B, JSS 1C)</label>
                          <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="Enter class cohort identifier..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full sm:w-auto"
                        >
                          Save Class Name
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {classesList.map((clsName) => {
                      const classStudentsCount = students.filter(s => s.classCohort === clsName).length;
                      const tutorObj = teachersList.find(t => t.classCohort === clsName);
                      
                      // Calculate average CBT scores for students in this class
                      const classStudentsIds = students.filter(s => s.classCohort === clsName).map(s => s.id);
                      const classSessions = sessions.filter(s => classStudentsIds.includes(s.studentId) && s.isCompleted);
                      const classAvg = classSessions.length > 0
                        ? Math.round(classSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / classSessions.length)
                        : "N/A";

                      return (
                        <div key={clsName} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-900 font-mono">
                                {clsName}
                              </div>
                              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">
                                {classStudentsCount} Registered
                              </span>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Form Tutor</p>
                              <p className="text-xs font-bold text-slate-800">{tutorObj?.fullName || "No Tutor Configured"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                              <div>
                                <span className="block font-bold text-slate-400 uppercase tracking-wide">Avg Score</span>
                                <span className="text-xs font-mono font-black text-indigo-900 mt-0.5 block">{classAvg === "N/A" ? classAvg : `${classAvg}%`}</span>
                              </div>
                              <div>
                                <span className="block font-bold text-slate-400 uppercase tracking-wide">Attempts</span>
                                <span className="text-xs font-mono font-black text-emerald-600 mt-0.5 block">{classSessions.length} Sheets</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                              onClick={() => setSelectedClass(clsName)}
                              className="py-2 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0 shadow-sm"
                            >
                              <span>Inspect Register</span>
                            </button>
                            <button
                              onClick={() => {
                                setExportClassTarget(clsName);
                                setIsExportClassModalOpen(true);
                              }}
                              className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Export PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      onClick={() => setSelectedClass(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wide border border-indigo-200 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Classes</span>
                    </button>
                    <div className="text-right">
                      <h3 className="text-xs font-mono font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                        Register: {selectedClass}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Cohort Enrollment & Register Tools</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Download spreadsheet template for bulk upload, or register individual candidates.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5 w-full lg:w-auto shrink-0">
                      <button
                        onClick={() => {
                          setExportClassTarget(selectedClass);
                          setIsExportClassModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 h-10"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
                        <span>Export Class Results (PDF)</span>
                      </button>
                      <button
                        onClick={handleDownloadExcelTemplate}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 h-10"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>Download Template</span>
                      </button>
                      <label className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 h-10">
                        <Upload className="w-3.5 h-3.5 text-white" />
                        <span>Upload Student CSV</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleImportCSV}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => setIsAddStudentOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer h-10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Student</span>
                      </button>
                      <button
                        onClick={handleExportRoster}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-800 to-slate-800 hover:from-indigo-900 hover:to-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 h-10"
                      >
                        <Users className="w-3.5 h-3.5 text-white" />
                        <span>Export Roster</span>
                      </button>
                    </div>
                  </div>

                  {isAddStudentOpen && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top duration-200">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                        <span className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">Register Student into {selectedClass}</span>
                        <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Student's Full Name</label>
                          <input
                            type="text"
                            required
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="e.g. Babatunde John"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1.5">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Candidate ID (Unique)</label>
                          <input
                            type="text"
                            required
                            value={newStudentUsername}
                            onChange={(e) => setNewStudentUsername(e.target.value)}
                            placeholder="e.g. CS-SEC-4029"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono uppercase"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1.5 relative">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Academic Arm</label>
                          
                          {/* Custom select as per AGENTS.md rule */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsStudentArmDropdownOpen(!isStudentArmDropdownOpen)}
                              className="w-full flex justify-between items-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white cursor-pointer select-none"
                            >
                              <span>{newStudentArm}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </button>
                            {isStudentArmDropdownOpen && (
                              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs py-1 animate-in fade-in duration-100">
                                {(['Creche', 'Nursery', 'Montessori', 'Primary', 'Secondary'] as const).map((arm) => (
                                  <div
                                    key={arm}
                                    onClick={() => {
                                      setNewStudentArm(arm);
                                      setIsStudentArmDropdownOpen(false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer font-bold transition-colors select-none ${
                                      newStudentArm === arm
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                  >
                                    {arm}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Grade Level</label>
                          <input
                            type="text"
                            required
                            value={newStudentGrade}
                            onChange={(e) => setNewStudentGrade(e.target.value)}
                            placeholder="e.g. Grade 11 / SS 2"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>

                        <div className="md:col-span-12 flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => setIsAddStudentOpen(false)}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Add Candidate
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="p-3">Candidate ID</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Academic Arm</th>
                          <th className="p-3">Grade Level</th>
                          <th className="p-3">Compliance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {students.filter(s => s.classCohort === selectedClass).map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-mono font-bold text-indigo-600 uppercase">{student.username}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img src={student.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                <span className="font-bold text-slate-800">{student.fullName}</span>
                              </div>
                            </td>
                            <td className="p-3">{student.arm || "Secondary"}</td>
                            <td className="p-3 font-mono font-bold text-slate-500">{student.gradeLevel}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ACTIVE SYNC
                              </span>
                            </td>
                          </tr>
                        ))}

                        {students.filter(s => s.classCohort === selectedClass).length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center p-8 text-slate-400 italic">
                              No candidates currently enrolled in this cohort.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* (b) SUBJECTS TAB CONTAINER */}
          {activeNav === 'subjects' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">Curriculum Subjects Directory</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Active syllabus items and assessment parameters synced with our digital CBT templates.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewSubjectName('');
                    setNewSubjectDept('Science');
                    setNewSubjectTutor(teachersList[0]?.fullName || 'Mrs. Folasade Adebayo');
                    setNewSubjectDuration(10);
                    setNewSubjectCode(`SUB-${Math.floor(100 + Math.random() * 900)}`);
                    setIsAddSubjectOpen(!isAddSubjectOpen);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              {isAddSubjectOpen && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">Configure New Curriculum Subject</span>
                    <button onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubject} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Name of Subject */}
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Subject Name (e.g. Chemistry, Geography)</label>
                        <input
                          type="text"
                          required
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Enter subject name..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>

                      {/* Subject Code */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Subject Code</label>
                        <input
                          type="text"
                          required
                          value={newSubjectCode}
                          onChange={(e) => setNewSubjectCode(e.target.value)}
                          placeholder="e.g. PHY402"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono uppercase"
                        />
                      </div>

                      {/* Department Select (No Native Dropdowns) */}
                      <div className="md:col-span-3 space-y-1.5 relative">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Department</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSubjectDeptDropdownOpen(!isSubjectDeptDropdownOpen);
                              setIsSubjectTutorDropdownOpen(false);
                              setIsNewSubjectClassDropdownOpen(false);
                              setIsNewSubjectYearDropdownOpen(false);
                            }}
                            className="w-full flex justify-between items-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white cursor-pointer select-none"
                          >
                            <span>{newSubjectDept}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                          {isSubjectDeptDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs py-1 animate-in fade-in duration-100">
                              {(['Art', 'Science', 'Commercial', 'Technology'] as const).map((dept) => (
                                <div
                                  key={dept}
                                  onClick={() => {
                                    setNewSubjectDept(dept);
                                    setIsSubjectDeptDropdownOpen(false);
                                  }}
                                  className={`px-3 py-2 cursor-pointer font-bold transition-colors select-none ${
                                    newSubjectDept === dept
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                                  }`}
                                >
                                  {dept}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tutor Assigned (No Native Dropdowns) */}
                      <div className="md:col-span-3 space-y-1.5 relative">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Assigned Teacher</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSubjectTutorDropdownOpen(!isSubjectTutorDropdownOpen);
                              setIsSubjectDeptDropdownOpen(false);
                              setIsNewSubjectClassDropdownOpen(false);
                              setIsNewSubjectYearDropdownOpen(false);
                            }}
                            className="w-full flex justify-between items-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white cursor-pointer select-none text-left"
                          >
                            <span className="truncate">{newSubjectTutor}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                          {isSubjectTutorDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-y-auto max-h-48 text-xs py-1 animate-in fade-in duration-100">
                              {teachersList.length > 0 ? (
                                teachersList.map((teacher) => (
                                  <div
                                    key={teacher.id}
                                    onClick={() => {
                                      setNewSubjectTutor(teacher.fullName);
                                      setIsSubjectTutorDropdownOpen(false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer font-bold transition-colors select-none ${
                                      newSubjectTutor === teacher.fullName
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                  >
                                    {teacher.fullName}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-slate-400 italic">No teachers found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class Cohort Select */}
                      <div className="md:col-span-4 space-y-1.5 relative">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Target Class / Cohort</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewSubjectClassDropdownOpen(!isNewSubjectClassDropdownOpen);
                              setIsSubjectDeptDropdownOpen(false);
                              setIsSubjectTutorDropdownOpen(false);
                              setIsNewSubjectYearDropdownOpen(false);
                            }}
                            className="w-full flex justify-between items-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white cursor-pointer select-none"
                          >
                            <span className="truncate">{newSubjectClass}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                          {isNewSubjectClassDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-y-auto max-h-48 text-xs py-1 animate-in fade-in duration-100">
                              {Array.from(new Set([...classesList, "SS 2A", "SS 1B", "JSS 3", "Primary 5"])).map((cls) => (
                                <div
                                  key={cls}
                                  onClick={() => {
                                    setNewSubjectClass(cls);
                                    setIsNewSubjectClassDropdownOpen(false);
                                  }}
                                  className={`px-3 py-2 cursor-pointer font-bold transition-colors select-none ${
                                    newSubjectClass === cls
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                                  }`}
                                >
                                  {cls}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Academic Year Select */}
                      <div className="md:col-span-4 space-y-1.5 relative">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Academic Session</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewSubjectYearDropdownOpen(!isNewSubjectYearDropdownOpen);
                              setIsSubjectDeptDropdownOpen(false);
                              setIsSubjectTutorDropdownOpen(false);
                              setIsNewSubjectClassDropdownOpen(false);
                            }}
                            className="w-full flex justify-between items-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white cursor-pointer select-none"
                          >
                            <span>{newSubjectYear}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                          {isNewSubjectYearDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-y-auto max-h-48 text-xs py-1 animate-in fade-in duration-100">
                              {["2025/2026", "2024/2025", "2023/2024"].map((yr) => (
                                <div
                                  key={yr}
                                  onClick={() => {
                                    setNewSubjectYear(yr);
                                    setIsNewSubjectYearDropdownOpen(false);
                                  }}
                                  className={`px-3 py-2 cursor-pointer font-bold transition-colors select-none ${
                                    newSubjectYear === yr
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                                  }`}
                                >
                                  {yr}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Duration (Minutes)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="180"
                          value={newSubjectDuration}
                          onChange={(e) => setNewSubjectDuration(Number(e.target.value) || 10)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Save Subject
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SEARCH & FILTERS TOOLBAR */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Search Input Bar */}
                  <div className="md:col-span-5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      placeholder="Search by subject name, code, teacher, or department..."
                      className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                    />
                    {subjectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSubjectSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Class Cohort Custom Select Dropdown */}
                  <div className="md:col-span-3 relative">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubjectClassFilterOpen(!isSubjectClassFilterOpen);
                          setIsSubjectYearFilterOpen(false);
                        }}
                        className="w-full flex justify-between items-center px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer select-none shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate">{subjectClassFilter}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>

                      {isSubjectClassFilterOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs py-1 animate-in fade-in duration-100 max-h-56 overflow-y-auto">
                          {["All Classes", ...Array.from(new Set([...classesList, "SS 2A", "SS 1B", "JSS 3", "Primary 5"]))].map((cls) => (
                            <div
                              key={cls}
                              onClick={() => {
                                setSubjectClassFilter(cls);
                                setIsSubjectClassFilterOpen(false);
                              }}
                              className={`px-3.5 py-2 cursor-pointer font-bold transition-colors select-none flex items-center justify-between ${
                                subjectClassFilter === cls
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              <span>{cls}</span>
                              {subjectClassFilter === cls && <Check className="w-3.5 h-3.5" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Academic Year Custom Select Dropdown */}
                  <div className="md:col-span-4 relative">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubjectYearFilterOpen(!isSubjectYearFilterOpen);
                          setIsSubjectClassFilterOpen(false);
                        }}
                        className="w-full flex justify-between items-center px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer select-none shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{subjectYearFilter}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>

                      {isSubjectYearFilterOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs py-1 animate-in fade-in duration-100">
                          {["All Academic Years", "2025/2026", "2024/2025", "2023/2024"].map((yr) => (
                            <div
                              key={yr}
                              onClick={() => {
                                setSubjectYearFilter(yr);
                                setIsSubjectYearFilterOpen(false);
                              }}
                              className={`px-3.5 py-2 cursor-pointer font-bold transition-colors select-none flex items-center justify-between ${
                                subjectYearFilter === yr
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-700 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              <span>{yr}</span>
                              {subjectYearFilter === yr && <Check className="w-3.5 h-3.5" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Filter Status & Reset Action Bar */}
                {(() => {
                  const query = subjectSearchQuery.trim().toLowerCase();
                  const filteredCount = subjectsList.filter((subject) => {
                    const matchesQuery = !query || 
                      subject.name.toLowerCase().includes(query) ||
                      subject.code.toLowerCase().includes(query) ||
                      subject.tutor.toLowerCase().includes(query) ||
                      (subject.department && subject.department.toLowerCase().includes(query));

                    const subjClass = (subject as any).classCohort || 'SS 2A';
                    const matchesClass = subjectClassFilter === 'All Classes' || subjClass === subjectClassFilter;

                    const subjYear = (subject as any).academicYear || '2025/2026';
                    const matchesYear = subjectYearFilter === 'All Academic Years' || subjYear === subjectYearFilter;

                    return matchesQuery && matchesClass && matchesYear;
                  }).length;

                  const isFiltered = subjectSearchQuery || subjectClassFilter !== 'All Classes' || subjectYearFilter !== 'All Academic Years';

                  return (
                    <div className="flex flex-wrap justify-between items-center pt-1 text-[11px] font-semibold text-slate-500 gap-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 uppercase text-[9px] font-bold">Showing:</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {filteredCount} of {subjectsList.length} Subjects
                        </span>
                        {isFiltered && (
                          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Filtered Directory Active
                          </span>
                        )}
                      </div>

                      {isFiltered && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectSearchQuery('');
                            setSubjectClassFilter('All Classes');
                            setSubjectYearFilter('All Academic Years');
                          }}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SCHOOL BENCHMARK THRESHOLD SUMMARY BAR */}
              {(() => {
                const SEEDED_SUBJECT_AVERAGES: Record<string, number> = {
                  "Mathematics": 78,
                  "English Language": 82,
                  "Physics": 44,
                  "Computer Science": 68,
                  "Civics & Resiliency": 48
                };
                const currentBenchmark = passBenchmark || 50;

                const belowBenchmarkSubjects = subjectsList.filter(s => {
                  const completed = sessions.filter(sess => {
                    const ex = exams.find(e => e.id === sess.examId);
                    return ex?.subject.toLowerCase() === s.name.toLowerCase() && sess.isCompleted;
                  });
                  const avg = completed.length > 0
                    ? Math.round(completed.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed.length)
                    : (s.average ?? SEEDED_SUBJECT_AVERAGES[s.name] ?? 72);
                  return avg < currentBenchmark;
                });

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                        School Pass Benchmark Target:
                      </span>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 font-mono font-black text-xs rounded-lg">
                        {currentBenchmark}% Minimum
                      </span>
                    </div>

                    <div>
                      {belowBenchmarkSubjects.length > 0 ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-[11px] font-extrabold animate-in fade-in">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
                          <span>
                            {belowBenchmarkSubjects.length} {belowBenchmarkSubjects.length === 1 ? 'Subject' : 'Subjects'} Below Benchmark ({belowBenchmarkSubjects.map(s => s.name).join(', ')}) — Immediate Intervention Required
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>All {subjectsList.length} Subjects Meeting Benchmark Target (≥{currentBenchmark}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* RENDER FILTERED SUBJECTS */}
              {(() => {
                const query = subjectSearchQuery.trim().toLowerCase();
                const filteredSubjects = subjectsList.filter((subject) => {
                  const matchesQuery = !query || 
                    subject.name.toLowerCase().includes(query) ||
                    subject.code.toLowerCase().includes(query) ||
                    subject.tutor.toLowerCase().includes(query) ||
                    (subject.department && subject.department.toLowerCase().includes(query));

                  const subjClass = (subject as any).classCohort || 'SS 2A';
                  const matchesClass = subjectClassFilter === 'All Classes' || subjClass === subjectClassFilter;

                  const subjYear = (subject as any).academicYear || '2025/2026';
                  const matchesYear = subjectYearFilter === 'All Academic Years' || subjYear === subjectYearFilter;

                  return matchesQuery && matchesClass && matchesYear;
                });

                if (filteredSubjects.length === 0) {
                  return (
                    <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">No Matching Subjects Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No subject records matched your query "{subjectSearchQuery}" for the selected class ({subjectClassFilter}) and academic year ({subjectYearFilter}).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubjectSearchQuery('');
                          setSubjectClassFilter('All Classes');
                          setSubjectYearFilter('All Academic Years');
                        }}
                        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Clear Search & Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredSubjects.map((subject) => {
                      const subjectExams = exams.filter(e => e.subject.toLowerCase() === subject.name.toLowerCase());
                      const subjectCompleted = sessions.filter(s => {
                        const ex = exams.find(e => e.id === s.examId);
                        return ex?.subject.toLowerCase() === subject.name.toLowerCase() && s.isCompleted;
                      });
                      const isDistributed = distributedSubjectKeys.includes(subject.name);

                      const SEEDED_SUBJECT_AVERAGES: Record<string, number> = {
                        "Mathematics": 78,
                        "English Language": 82,
                        "Physics": 44,
                        "Computer Science": 68,
                        "Civics & Resiliency": 48
                      };
                      const currentBenchmark = passBenchmark || 50;
                      const classAvg = subjectCompleted.length > 0
                        ? Math.round(subjectCompleted.reduce((acc, curr) => acc + (curr.score || 0), 0) / subjectCompleted.length)
                        : (subject.average ?? SEEDED_SUBJECT_AVERAGES[subject.name] ?? 72);

                      const isBelowBenchmark = classAvg < currentBenchmark;

                      return (
                        <div 
                          key={subject.code} 
                          onClick={() => setSelectedSubjectDetail(subject)}
                          className={`bg-white border ${
                            isBelowBenchmark 
                              ? 'border-rose-400 bg-rose-50/20 shadow-sm shadow-rose-100 hover:border-rose-600' 
                              : 'border-slate-200 hover:border-emerald-500'
                          } rounded-2xl p-5 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer group relative overflow-hidden`}
                        >
                          <div className="space-y-3">
                            {/* Threshold Indicator Alert Banner / Notification Badge */}
                            {isBelowBenchmark ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTriggerBenchmarkAlert(subject, classAvg, currentBenchmark);
                                }}
                                className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9.5px] font-black font-mono uppercase tracking-tight shadow-2xs cursor-pointer transition border border-rose-400 group/badge"
                                title="Click to trigger Benchmark Alert notification"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Bell className="w-3.5 h-3.5 text-white shrink-0 animate-bounce" />
                                  <span className="truncate">ALERT: BELOW BENCHMARK</span>
                                </div>
                                <span className="font-black text-rose-900 bg-white px-2 py-0.5 rounded-md shrink-0 font-mono text-[9px] shadow-2xs">
                                  {classAvg}% (&lt;{currentBenchmark}%)
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[9.5px] font-black font-mono uppercase tracking-tight">
                                <div className="flex items-center gap-1 truncate">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">On Track Target</span>
                                </div>
                                <span className="font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 font-mono text-[9px]">
                                  {classAvg}% Avg
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg shrink-0">
                                {subject.code}
                              </span>
                              {subject.department && (
                                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                  {subject.department}
                                </span>
                              )}
                              <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider ml-auto">
                                {subjectExams.length} Exams
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{subject.name}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Primary Tutor: {subject.tutor}</p>

                              {/* Class Cohort & Academic Session Badges */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                <span className="px-2 py-0.5 bg-indigo-50/80 border border-indigo-100 text-indigo-800 text-[9px] font-mono font-bold rounded-md flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" />
                                  {(subject as any).classCohort || 'SS 2A'}
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-50/80 border border-emerald-100 text-emerald-800 text-[9px] font-mono font-bold rounded-md flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                  {(subject as any).academicYear || '2025/2026'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                              <div>
                                <span className="block font-bold text-slate-400 uppercase tracking-wide text-[8.5px]">Sheets</span>
                                <span className="text-xs font-mono font-black text-slate-800 block mt-0.5">{subjectCompleted.length}</span>
                              </div>
                              <div>
                                <span className="block font-bold text-slate-400 uppercase tracking-wide text-[8.5px]">Class Avg</span>
                                <span className={`text-xs font-mono font-black block mt-0.5 ${isBelowBenchmark ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}`}>
                                  {classAvg}%
                                </span>
                              </div>
                              <div>
                                <span className="block font-bold text-slate-400 uppercase tracking-wide text-[8.5px]">Duration</span>
                                <span className="text-xs font-mono font-black text-indigo-600 block mt-0.5">{subject.duration}m</span>
                              </div>
                            </div>

                            {/* Quick Action Button: Generate Teacher Intervention Plan */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateInterventionPlan(subject, classAvg, currentBenchmark);
                                }}
                                className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                                  isBelowBenchmark
                                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-90 text-white border-rose-300 shadow-rose-200/50 ring-2 ring-rose-300/40'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:text-indigo-900'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
                                <span>Generate Teacher Intervention Plan</span>
                              </button>

                              <div className="flex justify-between items-center text-[9.5px] font-bold px-0.5 pt-0.5">
                                <span className="text-indigo-600 group-hover:underline flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" /> View Results & Ledger
                                </span>
                                {isDistributed ? (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[8.5px] font-mono">
                                    ✓ Distributed
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[8.5px]">
                                    Unsent
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* INTERACTIVE SUBJECT DETAIL, AI SUMMARY, HISTOGRAM & DISTRIBUTION MODAL */}
              {selectedSubjectDetail && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-800">
                    
                    {/* MODAL HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-black text-xs rounded-lg uppercase">
                            {selectedSubjectDetail.code}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[10px] rounded-lg uppercase">
                            {selectedSubjectDetail.department}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-indigo-950 uppercase tracking-tight font-display mt-1">
                          {selectedSubjectDetail.name} — Performance Analytics & Results Ledger
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Assigned Lead Tutor: <strong className="text-slate-700">{selectedSubjectDetail.tutor}</strong> | Syllabus Duration: {selectedSubjectDetail.duration} Mins
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsPreviewPdfOpen(true)}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-indigo-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Preview PDF Layout</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Print Subject PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSubjectDetail(null)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* AI SUBJECT PERFORMANCE SUMMARY & DISTRIBUTION ACTION STRIP */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* AI Performance Summary Card */}
                      <div className="md:col-span-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider font-mono">AI Subject Performance Summary</h4>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed">
                          Overall student performance in <strong className="text-white">{selectedSubjectDetail.name}</strong> is performing <span className="text-emerald-400 font-bold">14.2% above institutional benchmark</span> with an average cumulative score of <strong className="text-white">78.4%</strong>.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                            <span className="text-slate-400 block text-[9px]">Class Pass Rate</span>
                            <span className="text-emerald-400 font-bold text-xs">92.5% Passed</span>
                          </div>
                          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                            <span className="text-slate-400 block text-[9px]">Top Performer</span>
                            <span className="text-white font-bold text-xs truncate block">Folasade Amira (94%)</span>
                          </div>
                          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                            <span className="text-slate-400 block text-[9px]">Learning Gap</span>
                            <span className="text-amber-300 font-bold text-[9.5px]">Reaction Mechanisms</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Distribution Card */}
                      <div className="md:col-span-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-black uppercase text-slate-400 font-mono tracking-wider block">Admin Distribution</span>
                          <h5 className="text-xs font-bold text-indigo-950">Dispatch to Teacher Dashboard</h5>
                          <p className="text-[10px] text-slate-500">Distribute official subject result ledger to lead tutor <strong className="text-slate-700">{selectedSubjectDetail.tutor}</strong>.</p>
                        </div>

                        {distributedSubjectKeys.includes(selectedSubjectDetail.name) ? (
                          <div className="space-y-2">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Distributed to {selectedSubjectDetail.tutor}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDistributeSubjectToTeacher(selectedSubjectDetail.name, selectedSubjectDetail.tutor)}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                            >
                              Re-distribute Updated Ledger
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDistributeSubjectToTeacher(selectedSubjectDetail.name, selectedSubjectDetail.tutor)}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-90 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Distribute to Teacher</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CLASS SCORE DISTRIBUTION HISTOGRAM */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-emerald-600" />
                          Class Score Distribution Histogram ({selectedSubjectDetail.name})
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">Continuous Assessment + CBT Final Exam</span>
                      </div>
                      <GradeDistributionChart key={selectedSubjectDetail.name} initialSubject={selectedSubjectDetail.name} className="p-0 border-0 shadow-none bg-transparent" />
                    </div>

                    {/* HISTORY OF COMPLETED SUBJECT UPLOADS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <FolderCheck className="w-4 h-4 text-indigo-600" />
                          History of Completed Subject Uploads
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">4 Records Verified</span>
                      </div>

                      <div className="overflow-x-auto border border-slate-150 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] uppercase font-mono text-slate-400 border-b border-slate-150">
                              <th className="p-2.5 font-bold">Upload Type</th>
                              <th className="p-2.5 font-bold">Uploaded File Name</th>
                              <th className="p-2.5 font-bold text-center">Date & Time</th>
                              <th className="p-2.5 font-bold text-center">Status</th>
                              <th className="p-2.5 font-bold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-bold text-slate-800">CBT Final Exam Paper</td>
                              <td className="p-2.5 font-mono text-[11px] text-indigo-600">MTH401_Term3_CBT_Final.xml</td>
                              <td className="p-2.5 text-center font-mono text-slate-500">July 18, 2026</td>
                              <td className="p-2.5 text-center">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-bold px-2 py-0.5 rounded uppercase">
                                  Synchronized
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button onClick={() => toast.info("Downloading file...")} className="text-indigo-600 hover:underline font-bold text-[10px] cursor-pointer">
                                  Download
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-bold text-slate-800">CA 2 Midterm Sheet</td>
                              <td className="p-2.5 font-mono text-[11px] text-indigo-600">CA2_ContinuousAssessment_Sheet.csv</td>
                              <td className="p-2.5 text-center font-mono text-slate-500">June 24, 2026</td>
                              <td className="p-2.5 text-center">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-bold px-2 py-0.5 rounded uppercase">
                                  Validated
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button onClick={() => toast.info("Downloading file...")} className="text-indigo-600 hover:underline font-bold text-[10px] cursor-pointer">
                                  Download
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-bold text-slate-800">CA 1 Quiz Assessment</td>
                              <td className="p-2.5 font-mono text-[11px] text-indigo-600">CA1_ContinuousAssessment_Sheet.xlsx</td>
                              <td className="p-2.5 text-center font-mono text-slate-500">May 12, 2026</td>
                              <td className="p-2.5 text-center">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-bold px-2 py-0.5 rounded uppercase">
                                  Validated
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button onClick={() => toast.info("Downloading file...")} className="text-indigo-600 hover:underline font-bold text-[10px] cursor-pointer">
                                  Download
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* DYNAMIC TOP 10 AND BOTTOM 10 STUDENTS CALCULATION */}
                    {(() => {
                      // Base list of enrolled students derived dynamically
                      const baseStudentsRoster = [
                        { id: "usr-stu-1", name: "Folasade Amira Adekunle", classCohort: "SS 2A", baseCa1: 19, baseCa2: 18, baseExam: 57 },
                        { id: "usr-stu-2", name: "Aisha Mohammed Abubakar", classCohort: "SS 2A", baseCa1: 18, baseCa2: 17, baseExam: 52 },
                        { id: "usr-stu-3", name: "Olamide Chukwuma Ojo", classCohort: "SS 2A", baseCa1: 18, baseCa2: 16, baseExam: 51 },
                        { id: "usr-stu-4", name: "Jeremiah David Benson", classCohort: "SS 2A", baseCa1: 16, baseCa2: 15, baseExam: 48 },
                        { id: "usr-stu-5", name: "Fatima Zainab Bello", classCohort: "SS 2A", baseCa1: 15, baseCa2: 16, baseExam: 45 },
                        { id: "usr-stu-6", name: "Chibuzor Emeka Silas", classCohort: "SS 2A", baseCa1: 14, baseCa2: 14, baseExam: 42 },
                        { id: "usr-stu-7", name: "Dada Oluwaseun Emmanuel", classCohort: "SS 2A", baseCa1: 12, baseCa2: 13, baseExam: 38 },
                        { id: "usr-stu-8", name: "Kolawole Ibrahim Musa", classCohort: "SS 2A", baseCa1: 11, baseCa2: 12, baseExam: 35 },
                        { id: "usr-stu-9", name: "Nkechi Vivian Okafor", classCohort: "SS 2A", baseCa1: 10, baseCa2: 11, baseExam: 32 },
                        { id: "usr-stu-10", name: "Tunde Babatunde Raji", classCohort: "SS 2A", baseCa1: 9, baseCa2: 10, baseExam: 30 },
                        { id: "usr-stu-11", name: "Blessing Onyinye Eze", classCohort: "SS 2A", baseCa1: 8, baseCa2: 9, baseExam: 28 },
                        { id: "usr-stu-12", name: "Suleiman Usman Garba", classCohort: "SS 2A", baseCa1: 7, baseCa2: 8, baseExam: 25 },
                        { id: "usr-stu-13", name: "Chioma Stephanie Nnamdi", classCohort: "SS 2A", baseCa1: 6, baseCa2: 7, baseExam: 22 },
                        { id: "usr-stu-14", name: "Goodluck Victor Danjuma", classCohort: "SS 2A", baseCa1: 5, baseCa2: 6, baseExam: 20 },
                        { id: "usr-stu-15", name: "Precious Anulika Nwosu", classCohort: "SS 2A", baseCa1: 4, baseCa2: 5, baseExam: 18 }
                      ];

                      const matchingExams = exams.filter(e => e.subject.toLowerCase() === selectedSubjectDetail.name.toLowerCase());

                      const computedGrades = baseStudentsRoster.map((st, idx) => {
                        const studentSession = sessions.find(s =>
                          s.studentId === st.id &&
                          matchingExams.some(e => e.id === s.examId) &&
                          s.isCompleted
                        );

                        let ca1 = st.baseCa1;
                        let ca2 = st.baseCa2;
                        let examScore = st.baseExam;

                        if (studentSession && typeof studentSession.score === 'number') {
                          examScore = Math.round((studentSession.score / 100) * 60);
                        } else {
                          const subjOffset = (selectedSubjectDetail.name.length * 5 + idx * 11) % 13 - 6;
                          examScore = Math.max(12, Math.min(60, st.baseExam + subjOffset));
                          ca1 = Math.max(2, Math.min(20, st.baseCa1 + Math.floor(subjOffset / 3)));
                          ca2 = Math.max(2, Math.min(20, st.baseCa2 + Math.floor(subjOffset / 4)));
                        }

                        const total = ca1 + ca2 + examScore;
                        const grade = total >= 75 ? "A" : total >= 65 ? "B" : total >= 50 ? "C" : total >= 40 ? "D" : "F";
                        const remark = total >= 85 ? "High Distinction" :
                                       total >= 75 ? "Distinction" :
                                       total >= 65 ? "Very Good" :
                                       total >= 50 ? "Credit Pass" :
                                       total >= 40 ? "Pass" : "Needs Intervention";

                        return {
                          id: st.id,
                          name: st.name,
                          classCohort: st.classCohort,
                          ca1,
                          ca2,
                          examScore,
                          total,
                          grade,
                          remark
                        };
                      });

                      const top10 = [...computedGrades].sort((a, b) => b.total - a.total).slice(0, 10);
                      const bottom10 = [...computedGrades].sort((a, b) => a.total - b.total).slice(0, 10);

                      return (
                        <>
                          {/* TOP 10 STUDENTS SECTION */}
                          <div className="bg-gradient-to-br from-emerald-950/5 via-white to-indigo-950/5 border border-emerald-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                                    <Award className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider font-display">
                                    Top 10 High-Achieving Students ({selectedSubjectDetail.name})
                                  </h4>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-black rounded-md">
                                    Dynamic Academic Honors
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Highest performing students in {selectedSubjectDetail.name} calculated dynamically from current CA and CBT exam grades.
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-black rounded-xl">
                                  🏆 {top10.filter(s => s.grade === 'A').length} High Distinctions
                                </span>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-emerald-100 rounded-xl bg-white shadow-2xs">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-emerald-900 text-white font-mono uppercase text-[9px] tracking-wider">
                                    <th className="p-2.5 text-center">Rank</th>
                                    <th className="p-2.5">Candidate Student Name</th>
                                    <th className="p-2.5 text-center">Cohort</th>
                                    <th className="p-2.5 text-center">CA 1 (20)</th>
                                    <th className="p-2.5 text-center">CA 2 (20)</th>
                                    <th className="p-2.5 text-center">Exam (60)</th>
                                    <th className="p-2.5 text-center font-black text-emerald-300">Total Score</th>
                                    <th className="p-2.5 text-center">Grade</th>
                                    <th className="p-2.5 text-right">Academic Recognition</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {top10.map((st, idx) => {
                                    const rankBadge = idx === 0 ? "🥇 1st Rank" : idx === 1 ? "🥈 2nd Rank" : idx === 2 ? "🥉 3rd Rank" : `${idx + 1}th Rank`;
                                    return (
                                      <tr key={st.id} className={idx < 3 ? "bg-emerald-50/40 font-mono text-[11px]" : "hover:bg-slate-50/70 font-mono text-[11px]"}>
                                        <td className="p-2.5 text-center font-extrabold">
                                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                                            idx === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" :
                                            idx === 1 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                                            idx === 2 ? "bg-amber-700/20 text-amber-900 border border-amber-500/40" :
                                            "bg-slate-100 text-slate-700"
                                          }`}>
                                            {rankBadge}
                                          </span>
                                        </td>
                                        <td className="p-2.5 font-bold font-sans text-slate-900">{st.name}</td>
                                        <td className="p-2.5 text-center font-bold text-slate-600">{st.classCohort}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.ca1}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.ca2}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.examScore}</td>
                                        <td className="p-2.5 text-center font-black text-emerald-800 bg-emerald-50/50">
                                          {st.total}%
                                        </td>
                                        <td className="p-2.5 text-center font-extrabold">
                                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                                            st.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                          }`}>
                                            {st.grade}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-right font-sans font-bold text-emerald-700 text-[10.5px]">
                                          {st.remark}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* BOTTOM 10 STUDENTS SECTION (INTERVENTION RADAR) */}
                          <div className="bg-gradient-to-br from-rose-950/5 via-white to-amber-950/5 border border-rose-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-rose-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-rose-600 text-white rounded-lg shadow-xs animate-pulse">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider font-display">
                                    Bottom 10 Students — Early Intervention Radar ({selectedSubjectDetail.name})
                                  </h4>
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-mono font-black rounded-md">
                                    Targeted Remediation List
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Lowest performing students requiring immediate academic response, teacher counselling, and extra tutorials.
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.success(`🎉 Remedial Action Plan for Bottom 10 Students dispatched directly to ${selectedSubjectDetail.tutor} & School Counselors!`, {
                                      duration: 5000
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1 border-0"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                                  <span>Notify Teacher & Initiate Remediation</span>
                                </button>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-rose-100 rounded-xl bg-white shadow-2xs">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-rose-900 text-white font-mono uppercase text-[9px] tracking-wider">
                                    <th className="p-2.5 text-center">Intervention Rank</th>
                                    <th className="p-2.5">Candidate Student Name</th>
                                    <th className="p-2.5 text-center">Cohort</th>
                                    <th className="p-2.5 text-center">CA 1 (20)</th>
                                    <th className="p-2.5 text-center">CA 2 (20)</th>
                                    <th className="p-2.5 text-center">Exam (60)</th>
                                    <th className="p-2.5 text-center font-black text-rose-200">Total Score</th>
                                    <th className="p-2.5 text-center">Grade</th>
                                    <th className="p-2.5 text-center">Status</th>
                                    <th className="p-2.5 text-right">Quick Response Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {bottom10.map((st, idx) => {
                                    const isCritical = st.total < (passBenchmark || 50);
                                    return (
                                      <tr key={st.id} className={isCritical ? "bg-rose-50/50 font-mono text-[11px]" : "hover:bg-slate-50/70 font-mono text-[11px]"}>
                                        <td className="p-2.5 text-center font-bold text-slate-500">
                                          #{idx + 1} Lowest
                                        </td>
                                        <td className="p-2.5 font-bold font-sans text-slate-900">{st.name}</td>
                                        <td className="p-2.5 text-center font-bold text-slate-600">{st.classCohort}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.ca1}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.ca2}</td>
                                        <td className="p-2.5 text-center text-slate-700">{st.examScore}</td>
                                        <td className="p-2.5 text-center font-black text-rose-700 bg-rose-50/60">
                                          {st.total}%
                                        </td>
                                        <td className="p-2.5 text-center font-extrabold">
                                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                                            st.grade === 'F' ? 'bg-rose-100 text-rose-800 font-black' :
                                            st.grade === 'D' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                                          }`}>
                                            {st.grade}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-center font-sans font-bold text-[10px]">
                                          <span className={isCritical ? "text-rose-600 font-black" : "text-amber-600"}>
                                            {isCritical ? "Below Benchmark" : "At Risk"}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-right font-sans">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              toast.info(`Remedial tutorial invitation & parent alert sent for ${st.name}!`);
                                            }}
                                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[9.5px] font-extrabold rounded-lg transition cursor-pointer"
                                          >
                                            Flag for Remediation
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* RECEIPT OF ALL STUDENTS GRADE RESULTS PER SUBJECT */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                              <div>
                                <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-emerald-600" />
                                  Official Receipt of Students' Grade Results ({selectedSubjectDetail.name})
                                </h4>
                                <p className="text-[10px] text-slate-400">Consolidated score roster across all registered candidates taking this subject.</p>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setIsPreviewPdfOpen(true)}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition shrink-0 border border-indigo-200"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Preview PDF Layout</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition shrink-0"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Export Class Results</span>
                                </button>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[9px] uppercase font-mono text-slate-500 border-b border-slate-200">
                                    <th className="p-2.5 font-black">Student Name</th>
                                    <th className="p-2.5 font-black text-center">Class</th>
                                    <th className="p-2.5 font-black text-center">CA 1 (20)</th>
                                    <th className="p-2.5 font-black text-center">CA 2 (20)</th>
                                    <th className="p-2.5 font-black text-center">Exam (60)</th>
                                    <th className="p-2.5 font-black text-center">Total Score</th>
                                    <th className="p-2.5 font-black text-center">Grade</th>
                                    <th className="p-2.5 font-black text-right">Remark</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {computedGrades.map((st, idx) => (
                                    <tr key={st.id || idx} className="hover:bg-slate-50/70 font-mono text-[11px]">
                                      <td className="p-2.5 font-bold font-sans text-slate-900">{st.name}</td>
                                      <td className="p-2.5 text-center font-bold text-slate-600">{st.classCohort}</td>
                                      <td className="p-2.5 text-center text-slate-700">{st.ca1}</td>
                                      <td className="p-2.5 text-center text-slate-700">{st.ca2}</td>
                                      <td className="p-2.5 text-center text-slate-700">{st.examScore}</td>
                                      <td className="p-2.5 text-center font-extrabold text-indigo-950">{st.total}%</td>
                                      <td className="p-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                          st.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                          st.grade === 'B' ? 'bg-indigo-100 text-indigo-800' :
                                          st.grade === 'C' ? 'bg-sky-100 text-sky-800' :
                                          st.grade === 'D' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {st.grade}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-right font-sans font-bold text-slate-600">{st.remark}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* DEDICATED PREVIEW PDF MODAL FOR SUBJECT CLASS RESULTS SUMMARY */}
                    {isPreviewPdfOpen && (
                      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
                        
                        {/* PREVIEW MODAL TOP ACTION BAR */}
                        <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white shadow-2xl shrink-0 print:hidden">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black uppercase tracking-wider text-white">PDF Print Document Preview</h3>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                  Standard A4 Format (210 x 297mm)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Review the official printable layout for <strong className="text-white">{selectedSubjectDetail.name}</strong> before exporting or distributing.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleDistributeSubjectToTeacher(selectedSubjectDetail.name, selectedSubjectDetail.tutor)}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{distributedSubjectKeys.includes(selectedSubjectDetail.name) ? 'Re-distribute' : 'Distribute to Teacher'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Export Class Results</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsPreviewPdfOpen(false)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl cursor-pointer transition"
                              title="Close Preview"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* AUTHENTIC A4 PDF SHEET DISPLAY CANVAS */}
                        <div className="max-w-3xl w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-8 sm:p-12 space-y-8 font-sans my-auto relative overflow-hidden">
                          
                          {/* DOCUMENT WATERMARK / CORNER ACCENT */}
                          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 right-0 p-8 opacity-5 font-black text-6xl text-slate-900 pointer-events-none select-none font-mono">
                            CORNER STREAMS
                          </div>

                          {/* LETTERHEAD HEADER */}
                          <div className="border-b-2 border-indigo-950 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-indigo-950 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md tracking-tighter">
                                CS
                              </div>
                              <div>
                                <h1 className="text-xl font-black text-indigo-950 uppercase tracking-tight font-display">
                                  CORNER STREAMS ACADEMY
                                </h1>
                                <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                                  Office of the Registrar & Academic Assessment Board
                                </p>
                              </div>
                            </div>

                            <div className="text-right font-mono text-[10px] text-slate-600">
                              <p className="font-bold text-indigo-950">DOC REF: CS-PDF-{selectedSubjectDetail.code}-2026</p>
                              <p>Date Generated: July 21, 2026</p>
                              <p>Term 3 Final Examinations</p>
                            </div>
                          </div>

                          {/* DOCUMENT TITLE BANNER */}
                          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold tracking-widest block">
                                OFFICIAL SUBJECT CLASS RESULTS LEDGER
                              </span>
                              <h2 className="text-base font-black text-white uppercase tracking-tight">
                                {selectedSubjectDetail.name} ({selectedSubjectDetail.code})
                              </h2>
                            </div>

                            <div className="text-right font-mono text-[10px] sm:text-xs">
                              <span className="text-slate-400 block text-[9px]">DEPT & TUTOR</span>
                              <strong className="text-emerald-300 font-bold">{selectedSubjectDetail.department} Dept | {selectedSubjectDetail.tutor}</strong>
                            </div>
                          </div>

                          {/* KEY PERFORMANCE INDICATORS GRID */}
                          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-mono text-xs">
                            <div className="border-r border-slate-200 pr-2">
                              <span className="text-[9px] text-slate-400 font-sans block font-bold uppercase">Enrolled</span>
                              <strong className="text-slate-900 font-black text-sm">5 Students</strong>
                            </div>
                            <div className="border-r border-slate-200 pr-2">
                              <span className="text-[9px] text-slate-400 font-sans block font-bold uppercase">Class Average</span>
                              <strong className="text-indigo-900 font-black text-sm">78.6%</strong>
                            </div>
                            <div className="border-r border-slate-200 pr-2">
                              <span className="text-[9px] text-slate-400 font-sans block font-bold uppercase">Highest Score</span>
                              <strong className="text-emerald-700 font-black text-sm">94.0%</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-sans block font-bold uppercase">Pass Rate</span>
                              <strong className="text-emerald-700 font-black text-sm">100%</strong>
                            </div>
                          </div>

                          {/* OFFICIAL STUDENT ROSTER TABLE */}
                          <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1.5 font-mono">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              Class Grade Roster Breakdown
                            </h3>

                            <div className="border border-slate-300 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 text-[9.5px] uppercase font-mono text-slate-700 border-b border-slate-300">
                                    <th className="p-3 font-black">Student Name</th>
                                    <th className="p-3 font-black text-center">Class</th>
                                    <th className="p-3 font-black text-center">CA 1 (20)</th>
                                    <th className="p-3 font-black text-center">CA 2 (20)</th>
                                    <th className="p-3 font-black text-center">Exam (60)</th>
                                    <th className="p-3 font-black text-center">Total Score</th>
                                    <th className="p-3 font-black text-center">Grade</th>
                                    <th className="p-3 font-black text-right">Remark</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                                  {[
                                    { name: "Folasade Amira Adekunle", class: "SS 2 Science", ca1: 19, ca2: 18, exam: 57, total: 94, grade: "A", remark: "High Distinction" },
                                    { name: "Jeremiah David Benson", class: "SS 2 Science", ca1: 16, ca2: 15, exam: 48, total: 79, grade: "A", remark: "Distinction" },
                                    { name: "Chibuzor Emeka Silas", class: "SS 2 Science", ca1: 14, ca2: 14, exam: 42, total: 70, grade: "B", remark: "Very Good" },
                                    { name: "Dada Oluwaseun Emmanuel", class: "SS 2 Science", ca1: 12, ca2: 13, exam: 38, total: 63, grade: "B", remark: "Credit" },
                                    { name: "Aisha Mohammed Abubakar", class: "SS 3 Art", ca1: 18, ca2: 17, exam: 52, total: 87, grade: "A", remark: "High Distinction" }
                                  ].map((st, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="p-3 font-bold font-sans text-slate-900">{st.name}</td>
                                      <td className="p-3 text-center font-bold text-slate-600">{st.class}</td>
                                      <td className="p-3 text-center text-slate-700">{st.ca1}</td>
                                      <td className="p-3 text-center text-slate-700">{st.ca2}</td>
                                      <td className="p-3 text-center text-slate-700">{st.exam}</td>
                                      <td className="p-3 text-center font-black text-indigo-950">{st.total} / 100</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                          st.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                        }`}>
                                          {st.grade}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-sans font-bold text-slate-700">{st.remark}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* GRADING SCALE KEY & COMPLIANCE STAMP */}
                          <div className="grid grid-cols-2 gap-4 pt-2 text-[10px] text-slate-600 font-mono">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-800 block uppercase mb-1">Standard Grading Key</span>
                              <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                                <span>70 - 100%: <strong>Grade A (Distinction)</strong></span>
                                <span>60 - 69%: <strong>Grade B (Credit)</strong></span>
                                <span>50 - 59%: <strong>Grade C (Pass)</strong></span>
                                <span>0 - 49%: <strong>Grade F (Fail)</strong></span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                              <div>
                                <span className="font-bold text-slate-800 block uppercase mb-0.5">Verification Integrity</span>
                                <p className="text-[9px] text-slate-500">Digitally validated and locked by Corner Streams Academic Registrar.</p>
                              </div>
                              <span className="text-emerald-700 font-bold text-[9px] flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cryptographically Verified Record
                              </span>
                            </div>
                          </div>

                          {/* SIGNATURE BLOCK */}
                          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-300">
                            <div className="space-y-3">
                              <div className="h-10 border-b border-dashed border-slate-400 flex items-end pb-1 font-serif italic text-xs text-indigo-950 font-bold">
                                {selectedSubjectDetail.tutor}
                              </div>
                              <p className="text-[10px] font-bold text-slate-700 uppercase font-mono">
                                Lead Subject Tutor Signature
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="h-10 border-b border-dashed border-slate-400 flex items-end pb-1 font-serif italic text-xs text-indigo-950 font-bold">
                                Dr. Adeleke O. Vance (Registrar)
                              </div>
                              <p className="text-[10px] font-bold text-slate-700 uppercase font-mono">
                                School Administrator / Principal
                              </p>
                            </div>
                          </div>

                          {/* FOOTER */}
                          <div className="text-center pt-4 border-t border-slate-200 text-[9px] font-mono text-slate-400 flex justify-between items-center">
                            <span>© 2026 Corner Streams. All rights reserved.</span>
                            <span>Page 1 of 1</span>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}

          {/* (c) TEACHERS TAB CONTAINER */}
          {activeNav === 'teachers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">CBT Instructional Supervisor Directory</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Teaching staff authorized to design, upload, and publish computer-based exam papers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teachersList.map((teacher) => (
                  <div key={teacher.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={teacher.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">{teacher.fullName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">
                            {teacher.role.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{teacher.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cohort Class Assignment</span>
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded font-mono text-[9px] font-bold">
                            {teacher.classCohort || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          CBT Examiner Authorized
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. RECEIPT TAB CONTAINER */}
          {activeNav === 'receipt' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">2. CBT Token & Generation Receipts</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Verified cryptographic receipts generated upon paper authoring and student enrollment loops.
                  </p>
                </div>
                <Receipt className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Receipts list table */}
                <div className="md:col-span-2 space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full border-collapse text-left text-xs text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-200 text-[10px]">
                          <th className="p-3">Receipt ID</th>
                          <th className="p-3">Assessment Paper</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {mockReceipts.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <p className="font-mono font-bold text-indigo-950">{rec.id}</p>
                              <span className="text-[9px] text-slate-400 font-semibold">{new Date(rec.timestamp).toLocaleDateString()}</span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{rec.examTitle}</p>
                              <p className="text-[9.5px] text-emerald-600 font-bold uppercase mt-0.5">{rec.subject} • {rec.candidatesCount} Candidates</p>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedReceipt(rec)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                              >
                                View Slip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase">Cryptographic Clearance</h4>
                      <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                        Each token batch is permanently synchronized with the school's digital registry database. Candidates use these slips to bypass system security checks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Slip Detail Box (Visual Thermal Paper Receipt) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedReceipt ? (
                    <div className="space-y-4 animate-in zoom-in duration-150">
                      {/* Thermal Paper Card */}
                      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-md font-mono text-xs text-slate-700 space-y-4 relative overflow-hidden">
                        {/* Cut jagged edge effects */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        
                        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200">
                          <h4 className="font-black text-sm uppercase text-indigo-950 font-display tracking-tight">CORNER STREAMS</h4>
                          <p className="text-[9px] text-slate-400">Digital Assessment Receipt</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{selectedReceipt.id}</p>
                        </div>

                        <div className="space-y-2 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">EXAM:</span>
                            <span className="font-bold text-right text-slate-900 max-w-[120px] truncate">{selectedReceipt.examTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SUBJECT:</span>
                            <span className="font-bold text-slate-900">{selectedReceipt.subject}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SUPERVISOR:</span>
                            <span className="font-bold text-slate-900">{selectedReceipt.generatedBy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">CANDIDATES:</span>
                            <span className="font-bold text-slate-900">{selectedReceipt.candidatesCount} Registered</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">TOKEN BATCH:</span>
                            <span className="font-black text-emerald-600 bg-emerald-50 px-1 border border-emerald-100 rounded">{selectedReceipt.tokenBatch}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-900">
                            <span>TOTAL COST:</span>
                            <span>{selectedReceipt.amount}</span>
                          </div>
                        </div>

                        {/* Barcode mockup */}
                        <div className="pt-2 text-center">
                          <div className="bg-slate-950 h-8 w-full mx-auto opacity-80 flex items-center justify-between px-2 text-[6px] text-white tracking-widest font-sans">
                            <span>||||| | | |||| ||| | || |||| | | ||||</span>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-1">ONLINE VERIFIED SYNC OK</p>
                        </div>

                        <div className="text-center text-[9px] text-slate-400 pt-3 border-t border-dashed border-slate-200">
                          <span>Issued July 2026</span>
                        </div>
                      </div>

                      {/* Mock print triggers */}
                      <button
                        onClick={() => {
                          toast.success("Sending print job to linked institutional hardware... Slip printed.");
                        }}
                        className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Hardcopy Slip</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-xs text-slate-700">No Slip Selected</p>
                      <p className="text-[10.5px]">Click "View Slip" next to any receipt row to render the physical thermal slip card layout.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. UPLOADED EXAMS TAB CONTAINER */}
          {activeNav === 'uploaded' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                    <FolderCheck className="w-5 h-5 text-indigo-600" />
                    <span>Uploaded Examination Papers Directory</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Manage teacher-authored exam templates, view subject card details, review time of upload, specified duration in minutes, and publish to students.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminUploadedSearchQuery}
                      onChange={(e) => setAdminUploadedSearchQuery(e.target.value)}
                      placeholder="Search by subject or paper title..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadExamQuestionTemplate}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Excel Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublishAllModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Publish All Exams</span>
                  </button>
                </div>
              </div>

              {/* Subject Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams
                  .filter(exam => 
                    !adminUploadedSearchQuery ||
                    exam.title.toLowerCase().includes(adminUploadedSearchQuery.toLowerCase()) ||
                    exam.subject.toLowerCase().includes(adminUploadedSearchQuery.toLowerCase())
                  )
                  .map((exam) => {
                    const isPublishedToStudents = exam.publishedToStudents ?? exam.published;
                    const formattedUploadTime = exam.uploadedAt 
                      ? new Date(exam.uploadedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '24 Jul 2026, 01:30 AM';

                    return (
                      <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden group">
                        {/* Gradient header line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600" />

                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2 pt-1">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {exam.subject}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold uppercase font-mono">
                                {exam.targetClass || 'SS 2A'}
                              </span>
                              {isPublishedToStudents ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Published
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Draft
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-indigo-950 uppercase font-display leading-snug group-hover:text-indigo-600 transition-colors">
                            {exam.title}
                          </h4>

                          {/* Details Metadata Card */}
                          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-150 space-y-2 text-[11px] font-semibold text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                Time of Upload
                              </span>
                              <span className="font-mono text-[10px] text-slate-700 font-bold">{formattedUploadTime}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-indigo-500" />
                                Subject Uploaded
                              </span>
                              <span className="font-bold text-slate-900">{exam.subject}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <Activity className="w-3 h-3 text-emerald-600" />
                                Specified Duration
                              </span>
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {exam.durationMinutes} Minutes
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                                <HelpCircle className="w-3 h-3 text-indigo-500" />
                                Total Questions
                              </span>
                              <span className="font-mono font-bold text-slate-800">{exam.questions.length} MCQs</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setAdminSelectedSubjectCard(exam)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Details</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !isPublishedToStudents;
                                const updated = { 
                                  ...exam, 
                                  publishedToStudents: nextState,
                                  published: nextState 
                                };
                                onUpdateExam(updated);
                                if (nextState) {
                                  toast.success(`🎉 Exam "${exam.title}" published to student portal!`);
                                } else {
                                  toast.info(`Revoked student access for "${exam.title}".`);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer transition-all ${
                                isPublishedToStudents
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isPublishedToStudents ? "Unpublish" : "Publish to Students"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you absolutely sure you want to delete "${exam.title}"?`)) {
                                  onDeleteExam(exam.id);
                                  toast.success("Exam paper template removed.");
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition cursor-pointer"
                              title="Delete Exam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* ADMIN SUBJECT DETAIL MODAL CARD */}
              {adminSelectedSubjectCard && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                          {adminSelectedSubjectCard.subject} • {adminSelectedSubjectCard.targetClass || 'SS 2A'}
                        </span>
                        <h3 className="text-base font-black uppercase tracking-tight">{adminSelectedSubjectCard.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminSelectedSubjectCard(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono font-bold text-slate-700">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Specified Duration</span>
                        <span className="text-emerald-600 font-black">{adminSelectedSubjectCard.durationMinutes} Minutes</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Questions Count</span>
                        <span>{adminSelectedSubjectCard.questions.length} MCQs</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Author / Supervisor</span>
                        <span className="text-slate-900 font-sans">{adminSelectedSubjectCard.uploadedBy || 'Mrs. Folasade Adebayo'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Upload Timestamp</span>
                        <span className="text-[10px]">{adminSelectedSubjectCard.uploadedAt ? new Date(adminSelectedSubjectCard.uploadedAt).toLocaleDateString() : '24 Jul 2026'}</span>
                      </div>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Question Breakdown & Answer Keys</h4>
                      {adminSelectedSubjectCard.questions.map((q, idx) => (
                        <div key={q.id || idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded text-[10px] font-mono font-bold">Q{idx + 1}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.marks || 10} Marks</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed">{q.text}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, optIdx) => (
                              <div 
                                key={optIdx} 
                                className={`p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between ${
                                  optIdx === q.correctOptionIndex 
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" 
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {optIdx === q.correctOptionIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setAdminSelectedSubjectCard(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Close Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !adminSelectedSubjectCard.publishedToStudents;
                          const updated = { 
                            ...adminSelectedSubjectCard, 
                            publishedToStudents: nextState,
                            published: nextState 
                          };
                          onUpdateExam(updated);
                          setAdminSelectedSubjectCard(updated);
                          toast.success(`Exam status updated to ${nextState ? 'PUBLISHED' : 'DRAFT'}`);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                      >
                        {adminSelectedSubjectCard.publishedToStudents ? "Unpublish Exam" : "Publish Exam to Students"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PUBLISH ALL EXAMS CONFIRMATION MODAL */}
              {isPublishAllModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                    <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                          <Send className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight">Publish All Examinations</h3>
                          <span className="text-[10px] text-emerald-300 font-mono">School Admin Authorization</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPublishAllModalOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-extrabold uppercase">Confirmation Prompt</p>
                          <p className="text-amber-800 leading-relaxed">
                            Are you sure you want to set the status of all unpublished exams to <strong className="text-emerald-700">Live</strong> for students?
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2 text-xs font-medium text-slate-600">
                        <div className="flex justify-between items-center">
                          <span>Total Exam Papers:</span>
                          <span className="font-bold text-slate-900">{exams.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Currently Published:</span>
                          <span className="font-bold text-emerald-600">{exams.filter(e => (e.publishedToStudents ?? e.published)).length}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="font-bold text-indigo-950">Pending Drafts to Publish:</span>
                          <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {exams.filter(e => !(e.publishedToStudents ?? e.published)).length} Exams
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 italic">
                        Only verified School Administrators can batch-publish examination papers to all student portals.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPublishAllModalOpen(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmPublishAllExams}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-700 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>Confirm & Publish All Live</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. LIVE EXAMS TAB CONTAINER */}
          {activeNav === 'live' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">4. Currently Active & Published Examinations</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Review which testing links are currently visible to candidates on their personal dashboards.
                  </p>
                </div>
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Active list display */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {exams.filter(e => e.published).map((exam) => {
                    const examAttempts = sessions.filter(s => s.examId === exam.id).length;
                    const timerInfo = liveTimers[exam.id];
                    let remainingSeconds = 0;
                    if (timerInfo && timerInfo.active) {
                      const elapsed = Math.floor((Date.now() - new Date(timerInfo.startTime).getTime()) / 1000);
                      remainingSeconds = Math.max(0, timerInfo.durationMinutes * 60 - elapsed);
                    }

                    return (
                      <div key={exam.id} className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="text-sm font-black text-slate-900 truncate max-w-[240px]">{exam.title}</h5>
                              <p className="text-[9.5px] font-bold text-emerald-600 mt-1 uppercase font-mono">{exam.subject} • {exam.durationMinutes} Minutes</p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[8.5px] uppercase font-mono flex items-center gap-1.5 shrink-0">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              Live
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-emerald-100/40 text-[10px] font-bold text-slate-500">
                            <div>
                              <span className="text-slate-400 block font-mono uppercase tracking-widest text-[8px]">Active Attempts</span>
                              <span className="text-xs font-black text-indigo-950 font-mono mt-0.5 block">{examAttempts} Sheets Submitted</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-mono uppercase tracking-widest text-[8px]">Pass Mark</span>
                              <span className="text-xs font-black text-indigo-950 font-mono mt-0.5 block">{passBenchmark}% Benchmark</span>
                            </div>
                          </div>
                        </div>

                        {/* Global Countdown Timer & Sync Limit Controls */}
                        <div className="mt-4 pt-4 border-t border-emerald-100/40 space-y-3">
                          <span className="text-slate-400 block font-mono uppercase tracking-widest text-[8px]">Global Timer Controls</span>
                          {timerInfo && timerInfo.active ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                                <span className="text-[9px] font-bold text-indigo-700 flex items-center gap-1 uppercase font-mono">
                                  <span className={`w-1.5 h-1.5 rounded-full ${remainingSeconds > 0 ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
                                  {remainingSeconds > 0 ? "Running" : "Expired"}
                                </span>
                                <span className="font-mono font-black text-indigo-950 text-xs tracking-wider">
                                  {remainingSeconds > 0 ? (
                                    <>
                                      {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
                                    </>
                                  ) : "00m 00s"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.removeItem(`CS_CBT_LIVE_TIMER_${exam.id}`);
                                  toast.success(`Global timer for "${exam.title}" stopped.`);
                                }}
                                className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9.5px] font-black rounded-lg border border-rose-200 transition uppercase tracking-wider cursor-pointer"
                              >
                                Stop & Clear Timer
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-18">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="300"
                                    value={customLimits[exam.id] ?? exam.durationMinutes}
                                    onChange={(e) => setCustomLimits({ ...customLimits, [exam.id]: Math.max(1, Number(e.target.value)) })}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-xs focus:outline-none focus:border-indigo-500 text-indigo-950"
                                    title="Set limit in minutes"
                                  />
                                  <span className="absolute -top-2 left-1.5 bg-white px-1 text-[7px] font-bold text-slate-400 uppercase">Limit (M)</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const limit = customLimits[exam.id] ?? exam.durationMinutes;
                                  const timerState = {
                                    startTime: new Date().toISOString(),
                                    durationMinutes: limit,
                                    active: true
                                  };
                                  localStorage.setItem(`CS_CBT_LIVE_TIMER_${exam.id}`, JSON.stringify(timerState));
                                  toast.success(`Global timer of ${limit} mins started for "${exam.title}"!`);
                                }}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black rounded-lg transition uppercase tracking-wider cursor-pointer text-center"
                              >
                                Start Timer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {exams.filter(e => e.published).length === 0 && (
                    <div className="col-span-2 text-center p-12 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs italic">
                      No examinations are currently active/released. Change publication states in the Uploaded Exams tab or System Settings.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. COMPLETED EXAMS TAB CONTAINER */}
          {activeNav === 'completed' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* OFFLINE CBT EXAMS BAR CHART AGGREGATOR */}
              <OfflineCbtChart />

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">5. Completed Student CBT Attempt Monitor</h3>
                    <p className="text-[11.5px] text-slate-400 font-medium">Verify submissions, audit timers, and reset candidate locks to allow student re-takes.</p>
                  </div>

                {/* Custom Filters (No Native Dropdowns) */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search candidate..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Custom Exam Filter Dropdown */}
                  <div className="relative w-full sm:w-52">
                    <button
                      type="button"
                      onClick={() => setIsFilterExamOpen(!isFilterExamOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                    >
                      <span className="truncate">{selectedFilterExam ? selectedFilterExam.title : "Filter Assessment"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isFilterExamOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterExamOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFilterExam(null);
                              setIsFilterExamOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-900 hover:text-white transition-all flex items-center justify-between border-b border-slate-100"
                          >
                            <span>All Assessments</span>
                            {!selectedFilterExam && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                          {exams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedFilterExam(exam);
                                setIsFilterExamOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-900 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span className="truncate mr-3">{exam.title}</span>
                              {selectedFilterExam?.id === exam.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-in zoom-in" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Examination Paper</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Score Marks</th>
                      <th className="p-3">Compliance Status</th>
                      <th className="p-3 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCompletedSessions.map((sub, idx) => {
                      const studentObj = students.find(s => s.id === sub.studentId);
                      const examObj = exams.find(e => e.id === sub.examId);
                      const isPassed = (sub.score ?? 0) >= passBenchmark;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{studentObj?.fullName || "Deleted Student"}</p>
                            <p className="text-[10px] font-mono text-indigo-600 font-bold uppercase mt-0.5">{studentObj?.username || sub.studentId}</p>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 max-w-xs truncate">{examObj?.title || sub.examId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                              {examObj?.subject || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="font-mono text-sm font-black text-slate-900">{sub.score}%</p>
                            <p className={`text-[9px] font-extrabold uppercase ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                              {isPassed ? "PASSED" : "FAILED"}
                            </p>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[8.5px] font-bold uppercase flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              VERIFIED SYNC
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Are you absolutely sure you want to reset this candidate's attempt? This will permanently delete their current submission and clear their lock so they can retake.`)) {
                                  handleResetAttempt(sub.studentId, sub.examId);
                                }
                              }}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reset Attempt
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredCompletedSessions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center p-12 text-slate-400 text-xs italic space-y-1">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold">No verified assessment records found</p>
                          <p className="text-[11px] text-slate-400">Refine your search parameters or check back once testing begins.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* 6. SYSTEM SETTINGS TAB CONTAINER */}
          {activeNav === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">6. CBT Institutional System Settings</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Configure institutional parameters, security compliance metrics, and anti-cheat thresholds.
                  </p>
                </div>
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="space-y-6 max-w-2xl">
                {/* Benchmark score */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Global Pass Benchmark (%)</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={passBenchmarkInput}
                      onChange={(e) => setPassBenchmarkInput(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-400 self-center font-semibold">Scores equal to or exceeding this mark are graded as "PASSED".</span>
                  </div>
                </div>

                {/* Release scores instantly toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Immediate Grade Release to Candidates</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      If enabled, students see their final grades instantly upon exam submission. If blocked, results remain hidden until manually released.
                    </p>
                  </div>
                  
                  {/* Custom toggle with no native selects */}
                  <button
                    type="button"
                    onClick={onToggleReleaseScores}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-250 shrink-0 cursor-pointer ${
                      releaseScores ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transition-transform duration-250 ${
                      releaseScores ? "translate-x-5.5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Anti-cheat tab compliance lock (Custom dropdown - No Native Dropdowns) */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Anti-Cheat Tab Switching Lock</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Automatically flag or lock candidates out of the assessment window if they navigate away from the CBT screen.
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCheatingModeOpen(!isCheatingModeOpen)}
                      className="w-32 flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                    >
                      <span>{antiCheatMode}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isCheatingModeOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCheatingModeOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAntiCheatMode('Enabled');
                              setIsCheatingModeOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-900 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span>Enabled</span>
                            {antiCheatMode === 'Enabled' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAntiCheatMode('Disabled');
                              setIsCheatingModeOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-900 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span>Disabled</span>
                            {antiCheatMode === 'Disabled' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Warning threshold timer (Custom dropdown - No Native Dropdowns) */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Session Warning Warning Alarm</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Begin flashing warning alerts to the student when their remaining exam session timer drops below this duration.
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsWarningTimeOpen(!isWarningTimeOpen)}
                      className="w-36 flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                    >
                      <span>{warningThreshold}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isWarningTimeOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsWarningTimeOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                          {(['5 Minutes', '10 Minutes', '3 Minutes'] as const).map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                setWarningThreshold(time);
                                setIsWarningTimeOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-900 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span>{time}</span>
                              {warningThreshold === time && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Visual Appearance & Theme (New Theme selector) */}
                {theme && setTheme && (
                  <div className="pt-5 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950 dark:text-white tracking-wider">Appearance Mode & Theme</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Customize your layout palette and appearance mode across the CBT platform.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {themesList.map((t) => {
                        const Icon = t.icon;
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40 text-indigo-900 dark:text-white"
                                : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg ${t.color} mb-2 border border-transparent`}>
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <span className="text-[10.5px] font-bold leading-none block">{t.label}</span>
                            <span className="text-[7.5px] text-slate-400 uppercase tracking-widest block mt-1 font-mono">
                              {t.id === "system" ? "Syncs OS" : `${t.id} mode`}
                            </span>

                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5">
                                <Check className="w-2 h-2" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Typography Selection (New Font selector) */}
                {activeFont && setActiveFont && (
                  <div className="pt-5 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950 dark:text-white tracking-wider">Typography Settings</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Select a typeface scale that feels comfortable to read and navigate on your workstation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fontsList.map((f) => {
                        const isSelected = activeFont === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setActiveFont(f.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40 text-indigo-950 dark:text-white"
                                : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className={`text-xs font-bold leading-tight ${f.previewClass}`}>
                                {f.label}
                              </p>
                              <span className="text-[8.5px] text-slate-400 font-mono tracking-tight block mt-0.5">
                                {f.desc}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[8.5px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                                isSelected 
                                  ? "bg-indigo-600 text-white border-transparent" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}>
                                {f.id === "poppins" ? "Default" : "AaBb"}
                              </span>
                              {isSelected && (
                                <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                  <Check className="w-2 h-2" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-5 border-t border-slate-150">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-indigo-650 hover:bg-indigo-750 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    Save Settings Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT CLASS RESULTS PDF MODAL */}
      {isExportClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Consolidated Class Results Export Tool</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono font-bold">
                      PDF & Dashboard Ledger
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Aggregating all subject grades for {exportClassTarget} into a unified report for official archive & teacher dashboards.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportClassModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toolbar (No Native Dropdowns) & Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                {/* Custom Select: Target Class Cohort */}
                <div className="relative">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Target Class Cohort</label>
                  <button
                    type="button"
                    onClick={() => setIsExportClassDropdownOpen(!isExportClassDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
                  >
                    <span>{exportClassTarget}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isExportClassDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsExportClassDropdownOpen(false)} />
                      <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                        {classesList.map(cls => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              setExportClassTarget(cls);
                              setIsExportClassDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span>{cls}</span>
                            {exportClassTarget === cls && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom Select: Academic Session */}
                <div className="relative">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Academic Session</label>
                  <button
                    type="button"
                    onClick={() => setIsExportYearDropdownOpen(!isExportYearDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
                  >
                    <span>{exportAcademicYear}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isExportYearDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsExportYearDropdownOpen(false)} />
                      <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                        {['2025/2026', '2024/2025', '2023/2024'].map(yr => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setExportAcademicYear(yr);
                              setIsExportYearDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span>{yr}</span>
                            {exportAcademicYear === yr && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom Select: Academic Term */}
                <div className="relative">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Academic Term</label>
                  <button
                    type="button"
                    onClick={() => setIsExportTermDropdownOpen(!isExportTermDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
                  >
                    <span>{exportAcademicTerm}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isExportTermDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsExportTermDropdownOpen(false)} />
                      <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                        {['First Term', 'Second Term', 'Third Term'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setExportAcademicTerm(t);
                              setIsExportTermDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span>{t}</span>
                            {exportAcademicTerm === t && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <button
                  onClick={() => handleDistributeClassResultsToTeacher(exportClassTarget, exportAcademicYear, exportAcademicTerm)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                    distributedClassKeys.includes(`${exportClassTarget}_${exportAcademicYear}_${exportAcademicTerm}`)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {distributedClassKeys.includes(`${exportClassTarget}_${exportAcademicYear}_${exportAcademicTerm}`)
                      ? "Synced to Dashboards"
                      : "Distribute to Teachers"}
                  </span>
                </button>

                <button
                  onClick={() => handleExportClassMasterCSV(exportClassTarget, exportAcademicYear, exportAcademicTerm)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all cursor-pointer border-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Class Results Document View */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-100 font-sans" id="printable-class-results-ledger">
              
              {/* Document Paper Container */}
              <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-md space-y-6 max-w-4xl mx-auto">
                
                {/* Official Branding & Seal Header */}
                <div className="print-school-header flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-indigo-900">
                  <div className="print-school-header-brand flex items-center gap-4">
                    <div className="print-school-logo-badge w-14 h-14 rounded-2xl bg-indigo-900 flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-emerald-500 shrink-0">
                      CS
                    </div>
                    <div>
                      <span className="print-school-subtitle text-[9px] font-mono font-black uppercase tracking-widest text-emerald-600 block">
                        Directorate of Academic Standards &amp; Computer Based Testing
                      </span>
                      <h2 className="print-school-title text-base sm:text-lg font-black uppercase text-indigo-950 tracking-tight font-display">
                        Corner Streams International Academy
                      </h2>
                      <p className="print-school-motto text-[10px] italic text-slate-600 font-medium mt-0.5">
                        Motto: &quot;Excellence &amp; Honor in Character and Service&quot;
                      </p>
                      <p className="print-school-meta text-[10px] font-mono text-slate-500 mt-0.5">
                        Ref Code: CS-LEDGER-{exportClassTarget.replace(/\s+/g, '')}-{exportAcademicYear.replace('/', '')} | License: CS-GOV-9042
                      </p>
                    </div>
                  </div>

                  <div className="print-school-seal-badge text-right shrink-0">
                    <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                      <span className="badge-title text-[9px] font-black uppercase tracking-widest text-indigo-600 block">Status</span>
                      <span className="badge-meta text-xs font-mono font-black text-indigo-950">AUTHENTICATED LEDGER</span>
                    </div>
                  </div>
                </div>

                {/* Report Title */}
                <div className="text-center bg-indigo-950 text-white p-4 rounded-2xl space-y-1 shadow-inner">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400">
                    OFFICIAL CONSOLIDATED CLASS RESULTS LEDGER
                  </h3>
                  <p className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                    Comprehensive Academic Performance & Master Grade Breakdown
                  </p>
                </div>

                {/* Metadata Grid */}
                {(() => {
                  const classStudents = students.filter(s => s.classCohort === exportClassTarget);
                  const effectiveStudents = classStudents.length > 0 ? classStudents : [
                    { id: "usr-stu-1", username: "CS-SEC-7201", fullName: "Adebayo Kolawole", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-2", username: "CS-SEC-7202", fullName: "Onyeka Chioma", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-3", username: "CS-SEC-7203", fullName: "Fatima Abubakar", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-4", username: "CS-SEC-7204", fullName: "Chinedu Eze", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-5", username: "CS-SEC-7205", fullName: "Folake Adeleke", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-6", username: "CS-SEC-7206", fullName: "Ibrahim Musa", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-7", username: "CS-SEC-7207", fullName: "Grace Okafor", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" },
                    { id: "usr-stu-8", username: "CS-SEC-7208", fullName: "Samuel Ojo", arm: "Secondary", gradeLevel: "Grade 11 / SS 2" }
                  ];

                  const formTutor = teachersList.find(t => t.classCohort === exportClassTarget)?.fullName || "Mrs. Folasade Adebayo";
                  const isDistributed = distributedClassKeys.includes(`${exportClassTarget}_${exportAcademicYear}_${exportAcademicTerm}`);

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Class Cohort</span>
                          <span className="font-mono font-black text-indigo-950 text-sm block mt-0.5">{exportClassTarget}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Session & Term</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{exportAcademicYear} — {exportAcademicTerm}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Form Tutor</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{formTutor}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Evaluated Candidates</span>
                          <span className="font-mono font-black text-emerald-600 block mt-0.5">{effectiveStudents.length} Students</span>
                        </div>
                      </div>

                      {/* Subject Syllabus Performance Overview */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                            1. Subject Syllabus Performance Breakdown
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">5 Core Academic Papers</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            { name: "Mathematics", code: "MTH401", avg: 69, tutor: "Mrs. Folasade Adebayo" },
                            { name: "English Language", code: "ENG401", avg: 72, tutor: "Mr. Chukwuma Obi" },
                            { name: "Physics", code: "PHY402", avg: 61, tutor: "Dr. Alabi Kazeem" },
                            { name: "Computer Science", code: "CSC202", avg: 76, tutor: "Engr. Nnamdi Kanu" },
                            { name: "Civics & Resiliency", code: "CIV301", avg: 68, tutor: "Mrs. Blessing James" }
                          ].map((sb, sIdx) => (
                            <div key={sIdx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono font-black text-indigo-600">{sb.code}</span>
                                <span className="text-[10px] font-mono font-black text-slate-900">{sb.avg}%</span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 truncate">{sb.name}</p>
                              <p className="text-[8.5px] text-slate-400 truncate">{sb.tutor}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Candidate Master Grade Table */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                            2. Consolidated Candidate Master Grade Ledger
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Benchmark: ≥{passBenchmark}%
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-900 text-white font-bold uppercase text-[9px] tracking-wider font-mono">
                                <th className="p-2.5">Rank</th>
                                <th className="p-2.5">Candidate ID</th>
                                <th className="p-2.5">Student Full Name</th>
                                <th className="p-2.5 text-center">Math</th>
                                <th className="p-2.5 text-center">Eng</th>
                                <th className="p-2.5 text-center">Phys</th>
                                <th className="p-2.5 text-center">Comp</th>
                                <th className="p-2.5 text-center">Civics</th>
                                <th className="p-2.5 text-center font-black text-emerald-400">Total</th>
                                <th className="p-2.5 text-center font-black text-emerald-400">Average</th>
                                <th className="p-2.5 text-center">Grade</th>
                                <th className="p-2.5 text-center">Remark</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              {effectiveStudents.map((student, idx) => {
                                const baseScores = [
                                  [88, 82, 75, 90, 84],
                                  [80, 85, 68, 88, 78],
                                  [72, 78, 62, 82, 70],
                                  [65, 70, 58, 75, 66],
                                  [58, 62, 52, 68, 60],
                                  [52, 58, 48, 62, 55],
                                  [48, 54, 44, 58, 50],
                                  [42, 48, 38, 52, 45]
                                ];
                                const scores = baseScores[idx % baseScores.length];
                                const total = scores.reduce((a, b) => a + b, 0);
                                const avg = Math.round(total / scores.length);
                                const grade = avg >= 75 ? "A" : avg >= 65 ? "B" : avg >= 50 ? "C" : avg >= 40 ? "D" : "F";
                                const remark = avg >= 75 ? "Distinction" : avg >= 65 ? "Upper Credit" : avg >= 50 ? "Credit Pass" : "Needs Imp.";
                                const rank = `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'}`;

                                return (
                                  <tr key={student.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                                    <td className="p-2.5 font-mono font-black text-indigo-900">{rank}</td>
                                    <td className="p-2.5 font-mono font-bold text-slate-500 uppercase">{student.username}</td>
                                    <td className="p-2.5 font-bold text-slate-900">{student.fullName}</td>
                                    {scores.map((sc, sKey) => (
                                      <td key={sKey} className="p-2.5 text-center font-mono font-semibold text-slate-800">
                                        {sc}%
                                      </td>
                                    ))}
                                    <td className="p-2.5 text-center font-mono font-black text-indigo-950 bg-indigo-50/50">
                                      {total}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-black text-emerald-700 bg-emerald-50/50">
                                      {avg}%
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                        grade === 'A' ? "bg-emerald-100 text-emerald-800" :
                                        grade === 'B' ? "bg-indigo-100 text-indigo-800" :
                                        grade === 'C' ? "bg-sky-100 text-sky-800" :
                                        grade === 'D' ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                      }`}>
                                        {grade}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center font-extrabold text-[10px]">
                                      <span className={avg >= 75 ? "text-emerald-600" : avg >= 50 ? "text-indigo-600" : "text-amber-600"}>
                                        {remark}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary Grade Distribution Footer Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block">Distinction (A)</span>
                          <span className="text-sm font-mono font-black text-emerald-900 block mt-0.5">2 Candidates</span>
                          <span className="text-[8px] text-emerald-600 font-bold block mt-0.5">25% of Cohort</span>
                        </div>
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-indigo-800 tracking-wider block">Upper Credit (B)</span>
                          <span className="text-sm font-mono font-black text-indigo-900 block mt-0.5">2 Candidates</span>
                          <span className="text-[8px] text-indigo-600 font-bold block mt-0.5">25% of Cohort</span>
                        </div>
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-sky-800 tracking-wider block">Credit Pass (C)</span>
                          <span className="text-sm font-mono font-black text-sky-900 block mt-0.5">3 Candidates</span>
                          <span className="text-[8px] text-sky-600 font-bold block mt-0.5">37.5% of Cohort</span>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">Pass (D)</span>
                          <span className="text-sm font-mono font-black text-amber-900 block mt-0.5">1 Candidate</span>
                          <span className="text-[8px] text-amber-600 font-bold block mt-0.5">12.5% of Cohort</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Intervention (F)</span>
                          <span className="text-sm font-mono font-black text-slate-800 block mt-0.5">0 Candidates</span>
                          <span className="text-[8px] text-emerald-600 font-bold block mt-0.5">0% Failure</span>
                        </div>
                      </div>

                      {/* Signatures & Authentication Footer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-200 text-xs">
                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Class Form Tutor Endorsement</span>
                            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-serif italic text-indigo-900 font-bold text-sm">
                              {formTutor}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 block">Date & Signature</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Vice Principal Academic Stamp</span>
                            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-serif italic text-emerald-900 font-bold text-sm">
                              Dr. Emeka Nwosu (VP Academics)
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 block font-mono">
                              Verification Token: CS-VERIFY-LEDGER-2026-9042
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Copyright Label (from AGENTS.md rules) */}
                      <div className="pt-4 border-t border-slate-100 text-center">
                        <span className="text-[9.5px] font-mono text-slate-400 block font-bold">
                          © 2026 Corner Streams. All rights reserved.
                        </span>
                      </div>
                    </>
                  );
                })()}

              </div>
            </div>

          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* 1. INSTITUTIONAL BENCHMARK ALERT MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {benchmarkAlertSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-300 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-rose-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md animate-bounce">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 font-display">
                    School Benchmark Alert Triggered
                  </h3>
                  <p className="text-xs text-rose-600 font-bold font-mono">
                    Academic Deficit Detected — Immediate Action Required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBenchmarkAlertSubject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3 font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Subject Name:</span>
                <span className="font-extrabold text-slate-900 font-mono">{benchmarkAlertSubject.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Lead Tutor:</span>
                <span className="font-extrabold text-indigo-900">{benchmarkAlertSubject.tutor}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Class Cohort:</span>
                <span className="font-extrabold text-slate-800">{benchmarkAlertSubject.classCohort || 'SS 2A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/60 font-mono text-center">
                <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Class Average</span>
                  <span className="text-lg font-black text-rose-600 block">{benchmarkAlertSubject.classAvg}%</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">School Target Benchmark</span>
                  <span className="text-lg font-black text-slate-800 block">{benchmarkAlertSubject.benchmark}%</span>
                </div>
              </div>
              <p className="text-xs text-rose-900 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-200/80">
                ⚠️ <strong>Notice:</strong> The class average in <strong>{benchmarkAlertSubject.name}</strong> is currently <strong>{benchmarkAlertSubject.benchmark - benchmarkAlertSubject.classAvg} percentage points</strong> below the school benchmark target.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const subj = benchmarkAlertSubject;
                  const avg = benchmarkAlertSubject.classAvg;
                  const bench = benchmarkAlertSubject.benchmark;
                  setBenchmarkAlertSubject(null);
                  handleGenerateInterventionPlan(subj, avg, bench);
                }}
                className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Generate Faculty Intervention Plan via Naziee AI</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Formal Benchmark Deficit notification dispatched directly to ${benchmarkAlertSubject.tutor}!`);
                    setBenchmarkAlertSubject(null);
                  }}
                  className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Notify Lead Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBenchmarkAlertSubject(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Dismiss Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. GEMINI AI TEACHER INTERVENTION PLAN MODAL                  */}
      {/* ------------------------------------------------------------- */}
      {interventionPlanSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-emerald-600 text-white rounded-2xl shadow-md">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase text-indigo-950 font-display">
                      Naziee Faculty Mentor &amp; Intervention AI™
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-black rounded-md uppercase">
                      ASTRA v3.6
                    </span>
                    {planAutoSaveState === 'saving' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-mono font-black rounded-md uppercase animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Auto-saving...
                      </span>
                    )}
                    {planAutoSaveState === 'saved' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-black rounded-md uppercase flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Auto-saved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Subject: <strong className="text-slate-800">{interventionPlanSubject.name}</strong> | Lead Tutor: <strong className="text-indigo-900">{interventionPlanSubject.tutor}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInterventionPlanSubject(null);
                  setGeneratedInterventionPlan(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGeneratingInterventionPlan ? (
              <div className="py-16 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-25"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg animate-spin">
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-indigo-950 uppercase tracking-tight">Generating Tailored Remediation Strategy...</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Analyzing test performance for {interventionPlanSubject.name}, evaluating academic gaps, and building a 4-week pedagogic roadmap via Gemini API.
                  </p>
                </div>
              </div>
            ) : generatedInterventionPlan ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Executive Overview Banner */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-4.5 rounded-2xl shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                      Intervention Strategy Diagnosis
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[9.5px] font-mono font-bold rounded-md">
                      -{generatedInterventionPlan.gapPoints || 6}% Below Target
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed font-sans">
                    {generatedInterventionPlan.diagnosis}
                  </p>
                </div>

                {/* 4-Week Actionable Roadmap */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 font-display">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    4-Week Pedagogic Remediation Roadmap
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {generatedInterventionPlan.weeklyRoadmap?.map((week: any) => (
                      <div key={week.weekNumber} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 hover:border-indigo-300 transition shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono font-black text-[9.5px] rounded-md uppercase">
                            Week {week.weekNumber}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-950 font-sans truncate ml-2">
                            {week.title}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Focus Area</span>
                          <p className="text-xs font-bold text-slate-800">{week.focusArea}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Classroom Activities</span>
                          <p className="text-[11px] text-slate-600">{week.classroomActivities}</p>
                        </div>
                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Assessment Method</span>
                          <p className="text-[10.5px] font-medium text-emerald-700">{week.assessmentMethod}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pedagogic Strategies */}
                {generatedInterventionPlan.pedagogicStrategies?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 font-display">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Targeted Pedagogic Interventions
                    </h4>
                    <div className="space-y-2">
                      {generatedInterventionPlan.pedagogicStrategies.map((strat: any, idx: number) => (
                        <div key={idx} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xs text-indigo-950">{strat.strategyName}</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-mono font-bold rounded">
                              Target: {strat.targetGroup}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{strat.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Evaluation KPIs */}
                {generatedInterventionPlan.evaluationMetrics?.length > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Key Monitoring Evaluation KPIs
                    </h4>
                    <ul className="space-y-1">
                      {generatedInterventionPlan.evaluationMetrics.map((kpi: string, idx: number) => (
                        <li key={idx} className="text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                          <span>{kpi}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom Administrative Directives & Intervention Notes */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 font-display">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Custom Admin Directives & Progress Notes
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto-saves as you type
                    </span>
                  </div>
                  <textarea
                    value={interventionCustomNotes}
                    onChange={(e) => setInterventionCustomNotes(e.target.value)}
                    placeholder="Add custom notes, specific student remediation targets, or weekly feedback for the tutor here..."
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[70px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(`🎉 Teacher Intervention Plan dispatched directly to ${interventionPlanSubject.tutor}'s portal!`);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Send Plan to Teacher ({interventionPlanSubject.tutor})</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInterventionPlanSubject(null);
                        setGeneratedInterventionPlan(null);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Unable to display intervention plan. Please try again.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
