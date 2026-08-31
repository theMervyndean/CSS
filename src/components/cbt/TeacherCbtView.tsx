/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CbtExam, CbtSessionState, UserProfile, CbtAuditLogEntry, CbtAuditActionType } from '../../types';
import { 
  BookOpen, Plus, Trash2, Check, ChevronDown, Award, Users, BarChart3, 
  HelpCircle, Eye, EyeOff, Save, X, Calendar, ClipboardCheck, Percent,
  Calculator, TrendingUp, Activity, Sparkles, Sliders, ShieldAlert, ArrowUpRight,
  FileText, Printer, ArrowUpDown, ChevronUp, AlertCircle, Download, Upload, Clock,
  Send, FileSpreadsheet, Layers, CheckCircle2, Search, FolderCheck, History, ShieldCheck, Filter, Shield, Tag, Zap, Camera, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import { compressAndEncryptExamPackage } from '../../utils/examBundler';
import CbtExamPrintPreviewModal from '../CbtExamPrintPreviewModal';

interface TeacherCbtViewProps {
  currentProfile: UserProfile;
  exams: CbtExam[];
  sessions: CbtSessionState[];
  students: UserProfile[];
  onAddExam: (exam: CbtExam) => void;
  onUpdateExam: (exam: CbtExam) => void;
  onDeleteExam: (examId: string) => void;
  passBenchmark: number;
  activeNavOverride?: string;
}

export default function TeacherCbtView({
  currentProfile,
  exams,
  sessions,
  students,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  passBenchmark,
  activeNavOverride
}: TeacherCbtViewProps) {
  const [activeTab, setActiveTab] = useState<'uploaded_exams' | 'exams' | 'submissions' | 'analytics' | 'subject_breakdown'>('uploaded_exams');
  const [printPreviewExam, setPrintPreviewExam] = useState<any | null>(null);

  // CBT Audit Trail Sub-View state inside 'Uploaded Exams'
  const [uploadedExamsSubView, setUploadedExamsSubView] = useState<'PAPERS' | 'AUDIT_TRAIL'>('PAPERS');

  // CBT Audit Logs persistent state
  const [cbtAuditLogs, setCbtAuditLogs] = useState<CbtAuditLogEntry[]>(() => {
    const saved = localStorage.getItem("CS_CBT_EXAM_AUDIT_TRAIL");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse CS_CBT_EXAM_AUDIT_TRAIL", e);
      }
    }
    const teacherId = currentProfile?.id || currentProfile?.username || "CS-TCH-001";
    const teacherName = currentProfile?.fullName || "Mrs. Folasade Adebayo";
    const teacherRole = currentProfile?.role || "Subject Instructor";

    const initialLogs: CbtAuditLogEntry[] = [
      {
        id: "cbt-log-101",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        userId: teacherId,
        userName: teacherName,
        userRole: teacherRole,
        actionType: "EXAM_PUBLISH",
        examId: "cbt-exam-101",
        examTitle: "SS 2 Physics Term 2 Mid-Term Assessment",
        subject: "Physics",
        details: "Published examination paper to student dashboards for SS 2A cohort.",
        ipAddress: "197.210.22.41"
      },
      {
        id: "cbt-log-102",
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        userId: "CS-STU-8821",
        userName: "Chidi Anthony Okonkwo",
        userRole: "Student",
        actionType: "GRADE_SUBMIT",
        examId: "cbt-exam-101",
        examTitle: "SS 2 Physics Term 2 Mid-Term Assessment",
        subject: "Physics",
        targetStudentId: "CS-STU-8821",
        targetStudentName: "Chidi Anthony Okonkwo",
        scoreSubmitted: 85,
        details: "Auto-graded completed CBT examination session. Recorded score 85% (17/20 MCQs) with submission verification hash #8821-PHYS.",
        ipAddress: "197.210.22.18"
      },
      {
        id: "cbt-log-103",
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        userId: teacherId,
        userName: teacherName,
        userRole: teacherRole,
        actionType: "GRADE_UPDATE",
        examId: "cbt-exam-102",
        examTitle: "Chemistry Quantitative Analysis Quiz",
        subject: "Chemistry",
        targetStudentId: "CS-STU-3312",
        targetStudentName: "Aminat Yusuf",
        scoreSubmitted: 90,
        details: "Manual teacher review adjustment for question #4 calculation steps. Updated student score from 80% to 90% in broadsheet.",
        ipAddress: "197.210.22.41"
      },
      {
        id: "cbt-log-104",
        timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        userId: teacherId,
        userName: teacherName,
        userRole: teacherRole,
        actionType: "EXAM_UPLOAD",
        examId: "cbt-exam-103",
        examTitle: "Mathematics Geometry & Trigonometry Mock Exam",
        subject: "Mathematics",
        details: "Uploaded new 30-MCQ examination paper template with 45 minutes specified duration for SS 2A.",
        ipAddress: "197.210.22.41"
      },
      {
        id: "cbt-log-105",
        timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
        userId: teacherId,
        userName: teacherName,
        userRole: teacherRole,
        actionType: "EXAM_UNPUBLISH",
        examId: "cbt-exam-104",
        examTitle: "English Language Vocabulary Diagnostic Test",
        subject: "English Language",
        details: "Revoked student publication state for revision of comprehension passage option keys.",
        ipAddress: "197.210.22.18"
      }
    ];
    localStorage.setItem("CS_CBT_EXAM_AUDIT_TRAIL", JSON.stringify(initialLogs));
    return initialLogs;
  });

  // CBT Audit Trail Filter States
  const [cbtAuditSearchQuery, setCbtAuditSearchQuery] = useState('');
  const [cbtAuditActionFilter, setCbtAuditActionFilter] = useState<'ALL' | CbtAuditActionType>('ALL');
  const [cbtAuditSubjectFilter, setCbtAuditSubjectFilter] = useState('ALL');
  const [isCbtActionDropdownOpen, setIsCbtActionDropdownOpen] = useState(false);
  const [isCbtSubjectFilterDropdownOpen, setIsCbtSubjectFilterDropdownOpen] = useState(false);

  // Custom Audit Note Modal States
  const [isAddCbtNoteModalOpen, setIsAddCbtNoteModalOpen] = useState(false);
  const [noteActionType, setNoteActionType] = useState<CbtAuditActionType>('GRADE_SUBMIT');
  const [noteExamTitle, setNoteExamTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Physics');
  const [noteStudentName, setNoteStudentName] = useState('');
  const [noteStudentId, setNoteStudentId] = useState('');
  const [noteScore, setNoteScore] = useState('');
  const [noteDetails, setNoteDetails] = useState('');

  // Helper function to append to audit log
  const logCbtAuditEvent = (
    actionType: CbtAuditActionType,
    examId: string,
    examTitle: string,
    subject: string,
    details: string,
    targetStudentId?: string,
    targetStudentName?: string,
    scoreSubmitted?: number
  ) => {
    const newEntry: CbtAuditLogEntry = {
      id: `cbt-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentProfile?.username || currentProfile?.id || "CS-TCH-001",
      userName: currentProfile?.fullName || "Mrs. Folasade Adebayo",
      userRole: currentProfile?.role || "Subject Instructor",
      actionType,
      examId,
      examTitle,
      subject,
      targetStudentId,
      targetStudentName,
      scoreSubmitted,
      details,
      ipAddress: "197.210.22.41"
    };

    setCbtAuditLogs(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem("CS_CBT_EXAM_AUDIT_TRAIL", JSON.stringify(updated));
      return updated;
    });
  };

  // Filtered CBT Audit Logs
  const filteredCbtAuditLogs = React.useMemo(() => {
    return cbtAuditLogs.filter(log => {
      if (cbtAuditActionFilter !== 'ALL' && log.actionType !== cbtAuditActionFilter) {
        return false;
      }
      if (cbtAuditSubjectFilter !== 'ALL' && log.subject !== cbtAuditSubjectFilter) {
        return false;
      }
      if (cbtAuditSearchQuery.trim()) {
        const q = cbtAuditSearchQuery.toLowerCase();
        const matchUser = log.userId.toLowerCase().includes(q) || log.userName.toLowerCase().includes(q);
        const matchExam = log.examTitle.toLowerCase().includes(q) || log.subject.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchStudent = (log.targetStudentId && log.targetStudentId.toLowerCase().includes(q)) ||
                             (log.targetStudentName && log.targetStudentName.toLowerCase().includes(q));
        if (!matchUser && !matchExam && !matchDetails && !matchStudent) {
          return false;
        }
      }
      return true;
    });
  }, [cbtAuditLogs, cbtAuditActionFilter, cbtAuditSubjectFilter, cbtAuditSearchQuery]);

  // Handle Export CSV
  const handleExportAuditCsv = () => {
    const headers = [
      "Audit Log ID",
      "Exact Timestamp (ISO)",
      "User ID",
      "Teacher / Actor Name",
      "User Role",
      "Action Type",
      "Exam ID",
      "Exam Title",
      "Subject",
      "Target Student ID",
      "Target Student Name",
      "Score Submitted (%)",
      "Event Details",
      "IP Address"
    ];

    const rows = filteredCbtAuditLogs.map(log => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.userId}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.actionType}"`,
      `"${log.examId}"`,
      `"${log.examTitle.replace(/"/g, '""')}"`,
      `"${log.subject}"`,
      `"${log.targetStudentId || ''}"`,
      `"${log.targetStudentName || ''}"`,
      `"${log.scoreSubmitted ?? ''}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.ipAddress || '197.210.22.41'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CornerStreams_CBT_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredCbtAuditLogs.length} CBT audit log entries to CSV!`);
  };

  // Handle Add Custom Note
  const handleAddCustomCbtNote = () => {
    if (!noteDetails.trim()) {
      toast.error("Please enter event details for the audit log note.");
      return;
    }
    const examName = noteExamTitle.trim() || `${noteSubject} Assessment`;
    logCbtAuditEvent(
      noteActionType,
      `custom-${Date.now()}`,
      examName,
      noteSubject,
      noteDetails.trim(),
      noteStudentId.trim() || undefined,
      noteStudentName.trim() || undefined,
      noteScore ? parseFloat(noteScore) : undefined
    );
    toast.success("Saved new audit event entry to immutable CBT ledger!");
    setIsAddCbtNoteModalOpen(false);
    setNoteExamTitle('');
    setNoteStudentName('');
    setNoteStudentId('');
    setNoteScore('');
    setNoteDetails('');
  };

  // Subject Statistical Breakdown States & Calculations
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<any | null>(null);
  const [subjectSortOption, setSubjectSortOption] = useState<'subject_asc' | 'mean_desc' | 'mean_asc' | 'sd_desc' | 'subs_desc'>('subject_asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const allSubjectNames = React.useMemo(() => {
    const defaultList = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics'];
    const examSubjects = exams.map(e => e.subject).filter(Boolean);
    const set = new Set([...defaultList, ...examSubjects]);
    return Array.from(set);
  }, [exams]);

  const subjectBreakdownData = React.useMemo(() => {
    return allSubjectNames.map((subjectName) => {
      // Find all exams belonging to this subject
      const subjectExams = exams.filter(e => e.subject === subjectName);
      // Pick the latest assessment (last element in array)
      const latestExam = subjectExams.length > 0 ? subjectExams[subjectExams.length - 1] : null;

      if (!latestExam) {
        return {
          subject: subjectName,
          latestExam: null,
          submissionCount: 0,
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          passRate: 0,
          scores: [] as number[],
          sessions: [] as CbtSessionState[]
        };
      }

      // Filter completed sessions for this exam
      const examSessions = sessions.filter(
        s => s.examId === latestExam.id && s.isCompleted && typeof s.score === 'number'
      );
      const scores = examSessions.map(s => s.score as number);

      if (scores.length === 0) {
        return {
          subject: subjectName,
          latestExam,
          submissionCount: 0,
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          passRate: 0,
          scores: [],
          sessions: examSessions
        };
      }

      // 1. Mean (mu)
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      const mean = Math.round((sum / scores.length) * 10) / 10;

      // 2. Median (M)
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;

      // 3. Standard Deviation (sigma)
      const variance = scores.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / scores.length;
      const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const passes = scores.filter(s => s >= passBenchmark).length;
      const passRate = Math.round((passes / scores.length) * 100);

      return {
        subject: subjectName,
        latestExam,
        submissionCount: scores.length,
        mean,
        median,
        stdDev,
        min,
        max,
        passRate,
        scores,
        sessions: examSessions
      };
    });
  }, [allSubjectNames, exams, sessions, passBenchmark]);

  // Sorted Subject Breakdown List
  const sortedSubjectBreakdown = React.useMemo(() => {
    const list = [...subjectBreakdownData];
    switch (subjectSortOption) {
      case 'mean_desc':
        return list.sort((a, b) => b.mean - a.mean);
      case 'mean_asc':
        return list.sort((a, b) => a.mean - b.mean);
      case 'sd_desc':
        return list.sort((a, b) => b.stdDev - a.stdDev);
      case 'subs_desc':
        return list.sort((a, b) => b.submissionCount - a.submissionCount);
      case 'subject_asc':
      default:
        return list.sort((a, b) => a.subject.localeCompare(b.subject));
    }
  }, [subjectBreakdownData, subjectSortOption]);

  const macroStats = React.useMemo(() => {
    const activeSubjects = subjectBreakdownData.filter(s => s.submissionCount > 0);
    if (activeSubjects.length === 0) {
      return { totalSubjects: subjectBreakdownData.length, activeSubjectsCount: 0, macroMean: 0, macroMedian: 0, macroStdDev: 0 };
    }
    const sumMean = activeSubjects.reduce((acc, s) => acc + s.mean, 0);
    const macroMean = Math.round((sumMean / activeSubjects.length) * 10) / 10;

    const meansList = activeSubjects.map(s => s.mean).sort((a, b) => a - b);
    const mid = Math.floor(meansList.length / 2);
    const macroMedian = meansList.length % 2 !== 0 ? meansList[mid] : Math.round(((meansList[mid - 1] + meansList[mid]) / 2) * 10) / 10;

    const sumStdDev = activeSubjects.reduce((acc, s) => acc + s.stdDev, 0);
    const macroStdDev = Math.round((sumStdDev / activeSubjects.length) * 10) / 10;

    return {
      totalSubjects: subjectBreakdownData.length,
      activeSubjectsCount: activeSubjects.length,
      macroMean,
      macroMedian,
      macroStdDev
    };
  }, [subjectBreakdownData]);

  useEffect(() => {
    if (activeNavOverride) {
      if (activeNavOverride === 'uploaded') {
        setActiveTab('uploaded_exams');
      } else if (activeNavOverride === 'completed') {
        setActiveTab('submissions');
      } else if (activeNavOverride === 'live') {
        setActiveTab('analytics');
      }
    }
  }, [activeNavOverride]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Custom Select states (No Native Dropdowns)
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isCorrectDropdownOpen, setIsCorrectDropdownOpen] = useState<Record<number, boolean>>({});

  // Gemini AI generation state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isAiNumDropdownOpen, setIsAiNumDropdownOpen] = useState(false);

  const handleGenerateWithGemini = async () => {
    const trimmedTopic = aiTopic.trim();
    if (!trimmedTopic) {
      toast.error("Please enter a topic or syllabus concept.");
      return;
    }

    setIsGeneratingQuestions(true);
    const toastId = toast.loading(`Generating ${aiNumQuestions} AI-crafted questions for "${trimmedTopic}"...`);

    try {
      const response = await fetch("/api/cbt/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: trimmedTopic,
          numQuestions: aiNumQuestions,
          subject: subject,
          gradeLevel: "Grade 11 / SS 2",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate questions from server.");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response schema returned from the AI server.");
      }

      // Map generated questions to CBT Question structure
      const parsed = data.questions.map((q: any, index: number) => ({
        id: `q-temp-ai-${Date.now()}-${index}`,
        text: q.text || "",
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options.map((opt: any) => String(opt)) 
          : ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: typeof q.correctOptionIndex === "number" && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4 
          ? q.correctOptionIndex 
          : 0,
        marks: typeof q.marks === "number" ? q.marks : 10
      }));

      // Decide whether to replace or append
      // If the only question is empty, just replace it
      if (questions.length === 1 && !questions[0].text.trim()) {
        setQuestions(parsed);
        toast.success(`Successfully drafted ${parsed.length} questions for "${trimmedTopic}"!`, { id: toastId });
      } else {
        // Append them to existing
        setQuestions([...questions, ...parsed]);
        toast.success(`Appended ${parsed.length} AI questions to your template!`, { id: toastId });
      }

      setIsAiPanelOpen(false);
      setAiTopic('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during question generation.", { id: toastId });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Form states for creating a new exam
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetClass, setTargetClass] = useState('SS 2A');
  const [isTargetClassDropdownOpen, setIsTargetClassDropdownOpen] = useState(false);
  const [selectedSubjectDetailCard, setSelectedSubjectDetailCard] = useState<CbtExam | null>(null);
  const [uploadedExamSearchQuery, setUploadedExamSearchQuery] = useState('');

  const [questions, setQuestions] = useState<Array<{
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    marks: number;
  }>>([
    {
      id: 'q-temp-1',
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      marks: 10
    }
  ]);

  // Download Excel/CSV template helper
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
    toast.success("Excel / CSV Question Template downloaded! Fill questions using Excel or Google Sheets.");
  };

  // Upload Excel / CSV File parser helper
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        toast.error("Uploaded file is empty or missing data rows.");
        return;
      }

      const parsed: Array<{
        id: string;
        text: string;
        options: string[];
        correctOptionIndex: number;
        marks: number;
      }> = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cells = matches.map(m => m.replace(/^"|"$/g, '').trim());

        if (cells.length >= 7) {
          const qText = cells[1] || `Question ${i}`;
          const optA = cells[2] || 'Option A';
          const optB = cells[3] || 'Option B';
          const optC = cells[4] || 'Option C';
          const optD = cells[5] || 'Option D';
          const correctVal = (cells[6] || 'A').toUpperCase();
          const marksVal = parseInt(cells[7]) || 10;

          let correctIdx = 0;
          if (correctVal === 'B' || correctVal === '2' || correctVal === 'OPTION B') correctIdx = 1;
          else if (correctVal === 'C' || correctVal === '3' || correctVal === 'OPTION C') correctIdx = 2;
          else if (correctVal === 'D' || correctVal === '4' || correctVal === 'OPTION D') correctIdx = 3;

          parsed.push({
            id: `q-excel-${Date.now()}-${i}`,
            text: qText,
            options: [optA, optB, optC, optD],
            correctOptionIndex: correctIdx,
            marks: marksVal
          });
        }
      }

      if (parsed.length > 0) {
        setQuestions(parsed);
        toast.success(`Successfully parsed ${parsed.length} questions from "${file.name}"!`);
      } else {
        toast.error("Could not parse question rows. Ensure your CSV matches the template format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Selected exam to inspect submissions for
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<CbtExam | null>(
    exams.length > 0 ? exams[0] : null
  );

  // Available subjects for selection (using custom select)
  const SUBJECTS = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics'];
  const CLASSES = ['SS 2A', 'SS 1B', 'JSS 3', 'Primary 5', 'Primary 2'];

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      {
        id: `q-temp-${Date.now()}-${questions.length}`,
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 10
      }
    ]);
  };

  const handleRemoveQuestionField = (index: number) => {
    if (questions.length === 1) {
      toast.error("You must include at least one question in your examination template.");
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...questions];
    updated[index].text = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = val;
    setQuestions(updated);
  };

  const handleCorrectIndexChange = (qIndex: number, correctIdx: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = correctIdx;
    setQuestions(updated);
    setIsCorrectDropdownOpen(prev => ({ ...prev, [qIndex]: false }));
  };

  const handleMarksChange = (qIndex: number, val: number) => {
    const updated = [...questions];
    updated[qIndex].marks = Math.max(1, val);
    setQuestions(updated);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a valid title for this examination.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1} is empty. Please enter your question.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].trim()) {
          toast.error(`Option ${String.fromCharCode(65 + j)} for Question ${i + 1} is empty.`);
          return;
        }
      }
    }

    const newExam: CbtExam = {
      id: `ex-${Date.now()}`,
      title: title.trim(),
      subject,
      durationMinutes: Number(durationMinutes),
      questions: questions.map((q, idx) => ({
        ...q,
        id: `q-real-${idx + 1}-${Date.now()}`
      })),
      published: true, // Default to published on creation
      publishedToStudents: true,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentProfile.fullName || 'Mrs. Folasade Adebayo',
      targetClass: targetClass || 'SS 2A',
      uploadSource: 'excel'
    };

    onAddExam(newExam);
    logCbtAuditEvent(
      'EXAM_UPLOAD',
      newExam.id,
      newExam.title,
      newExam.subject,
      `Uploaded and created examination paper template containing ${newExam.questions.length} questions (${newExam.durationMinutes} mins) for ${newExam.targetClass}.`
    );
    toast.success(`Exam "${newExam.title}" saved, uploaded, and published for ${newExam.targetClass}!`);
    setIsCreating(false);
    
    // Reset fields
    setTitle('');
    setSubject('Mathematics');
    setDurationMinutes(30);
    setTargetClass('SS 2A');
    setQuestions([{ id: 'q-temp-1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 10 }]);
    setSelectedExamForSubmissions(newExam);
  };

  // Filter sessions for selected exam
  const examSubmissions = sessions.filter(s => s.examId === (selectedExamForSubmissions?.id ?? ''));

  // Calculate high-level analytics for the selected exam
  const getSelectedExamAnalytics = () => {
    if (examSubmissions.length === 0) return { avg: 0, max: 0, min: 0, passRate: 0 };
    const scores = examSubmissions.map(s => s.score ?? 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passes = examSubmissions.filter(s => (s.score ?? 0) >= passBenchmark).length;
    const passRate = Math.round((passes / examSubmissions.length) * 100);
    return { avg, max, min, passRate };
  };

  const stats = getSelectedExamAnalytics();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black uppercase text-indigo-950 font-display tracking-tight">Teacher CBT Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Define exam papers, inspect class test scores, and analyze academic weaknesses.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Exam Template
          </button>
        )}
      </div>

      {isCreating ? (
        // 1. Exam creation layout Form
        <form onSubmit={handleSaveExam} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Configure New CBT Template</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Title */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Algebra Quiz"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Subject (Custom Dropdown) */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Stream</label>
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 text-left cursor-pointer"
              >
                <span>{subject}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isSubjectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSubjectDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {SUBJECTS.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSubject(sub);
                          setIsSubjectDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                      >
                        <span>{sub}</span>
                        {subject === sub && <Check className="w-3.5 h-3.5 text-indigo-600 hover:text-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Target Class (Custom Dropdown) */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Student Class</label>
              <button
                type="button"
                onClick={() => setIsTargetClassDropdownOpen(!isTargetClassDropdownOpen)}
                className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 text-left cursor-pointer"
              >
                <span>{targetClass}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isTargetClassDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTargetClassDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {CLASSES.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => {
                          setTargetClass(cls);
                          setIsTargetClassDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                      >
                        <span>{cls}</span>
                        {targetClass === cls && <Check className="w-3.5 h-3.5 text-indigo-600 hover:text-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* EXCEL FILE UPLOAD & TEMPLATE DOWNLOAD CARD */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Excel / CSV Batch Question Upload</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload exam questions directly as an Excel file with specific number of questions following the designed template.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-indigo-950 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download Template</span>
              </button>

              <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Upload Excel File</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Question Matrix ({questions.length})</span>
              <button
                type="button"
                onClick={handleAddQuestionField}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-100 transition border border-indigo-150 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Question Field
              </button>
            </div>

            {/* Gemini AI Spark Banner/Panel */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-emerald-950 text-white rounded-xl p-5 border border-indigo-500/20 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-lg pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-sans">Chinonye Exam Architect AI</h4>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Generate standard curriculum-aligned test questions instantly with Chinonye Intelligence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isAiPanelOpen ? "Close Assistant" : "Draft with AI"}
                </button>
              </div>

              {isAiPanelOpen && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-white/5 relative z-10 animate-in fade-in duration-200">
                  {/* Topic Input */}
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-300 tracking-wider">Enter Topic or Syllabus Concept</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Quadratic equations, cell division, or simple past tense"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  </div>

                  {/* Quantity (Custom Select) */}
                  <div className="md:col-span-3 space-y-1 relative">
                    <label className="text-[9px] font-bold uppercase text-slate-300 tracking-wider block">Quantity</label>
                    <button
                      type="button"
                      onClick={() => setIsAiNumDropdownOpen(!isAiNumDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white cursor-pointer"
                    >
                      <span>{aiNumQuestions} Questions</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    {isAiNumDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsAiNumDropdownOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-full bg-indigo-950 border border-white/15 rounded-lg shadow-2xl z-50 py-1 text-xs">
                          {[3, 5, 10, 15].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setAiNumQuestions(num);
                                setIsAiNumDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 font-bold hover:bg-emerald-600 text-slate-100 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span>{num} Questions</span>
                              {aiNumQuestions === num && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-3 flex items-end">
                    <button
                      type="button"
                      disabled={isGeneratingQuestions || !aiTopic.trim()}
                      onClick={handleGenerateWithGemini}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 h-9"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Structuring AI...</span>
                        </>
                      ) : (
                        <>
                          <span>Spark Questions</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider font-mono">Question #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Question Statement</label>
                    <textarea
                      value={q.text}
                      onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                      placeholder="e.g. Solve the equation x² - 9 = 0."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Options Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option, optIdx) => (
                      <div key={optIdx} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Option {String.fromCharCode(65 + optIdx)}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                          placeholder={`Enter option value for ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Marks & Correct Option (No Native Select) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Correct Index Select Container */}
                    <div className="space-y-1 relative">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Correct Key Option</label>
                      <button
                        type="button"
                        onClick={() => setIsCorrectDropdownOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full flex justify-between items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <span>Option {String.fromCharCode(65 + q.correctOptionIndex)}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      {isCorrectDropdownOpen[idx] && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCorrectDropdownOpen(prev => ({ ...prev, [idx]: false }))} />
                          <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 w-full">
                            {[0, 1, 2, 3].map((optIndex) => (
                              <button
                                key={optIndex}
                                type="button"
                                onClick={() => handleCorrectIndexChange(idx, optIndex)}
                                className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                              >
                                <span>Option {String.fromCharCode(65 + optIndex)}</span>
                                {q.correctOptionIndex === optIndex && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Marks weight */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Marks Weight</label>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => handleMarksChange(idx, Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-250 text-slate-600 text-xs font-bold uppercase rounded-lg hover:bg-slate-50 transition"
            >
              Cancel Builder
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-white" />
              Save Examination Template
            </button>
          </div>
        </form>
      ) : (
        // 2. Normal Dashboard Tabbed workspace
        <div className="space-y-4">
          {/* Tabs header */}
          <div className="border-b border-slate-200 flex gap-4 text-xs font-bold shrink-0 uppercase select-none overflow-x-auto">
            <button
              onClick={() => setActiveTab('uploaded_exams')}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'uploaded_exams' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FolderCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Uploaded Exams</span>
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-mono font-bold">
                {exams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'exams' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Assessment Directory</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('submissions');
                if (exams.length > 0 && !selectedExamForSubmissions) {
                  setSelectedExamForSubmissions(exams[0]);
                }
              }}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'submissions' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Attempts & Submissions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                if (exams.length > 0 && !selectedExamForSubmissions) {
                  setSelectedExamForSubmissions(exams[0]);
                }
              }}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'analytics' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Class Performance Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('subject_breakdown')}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'subject_breakdown' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Subject Statistical Breakdown</span>
            </button>
          </div>

          {/* ACTIVE TAB CONTENTS */}
          {/* 1. UPLOADED EXAMS TAB CONTENT */}
          {activeTab === 'uploaded_exams' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Sub-View Navigation Switcher */}
              <div className="bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-xs">
                <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setUploadedExamsSubView('PAPERS')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      uploadedExamsSubView === 'PAPERS'
                        ? "bg-indigo-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-indigo-950 hover:bg-slate-100"
                    }`}
                  >
                    <FolderCheck className="w-4 h-4 text-emerald-400" />
                    <span>Uploaded Examination Papers ({exams.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadedExamsSubView('AUDIT_TRAIL')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      uploadedExamsSubView === 'AUDIT_TRAIL'
                        ? "bg-indigo-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-indigo-950 hover:bg-slate-100"
                    }`}
                  >
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Immutable Audit Trail ({cbtAuditLogs.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCbtNoteModalOpen(true)}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Log Audit Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAuditCsv}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Export Audit CSV</span>
                  </button>
                </div>
              </div>

              {/* SUB-VIEW 1: UPLOADED EXAMINATION PAPERS GRID */}
              {uploadedExamsSubView === 'PAPERS' && (
                <>
                  {/* Top Action Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2">
                        <FolderCheck className="w-4 h-4 text-emerald-600" />
                        <span>Uploaded Examination Papers</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        View uploaded subjects, inspect duration in minutes, review upload timestamps, and publish exams directly to students.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={uploadedExamSearchQuery}
                          onChange={(e) => setUploadedExamSearchQuery(e.target.value)}
                          placeholder="Filter by subject or title..."
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadExcelTemplate}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Download Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>Upload New Exam</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exams
                      .filter(exam => 
                        !uploadedExamSearchQuery || 
                        exam.title.toLowerCase().includes(uploadedExamSearchQuery.toLowerCase()) ||
                        exam.subject.toLowerCase().includes(uploadedExamSearchQuery.toLowerCase())
                      )
                      .map((exam) => {
                        const isPublishedToStudents = exam.publishedToStudents ?? exam.published;
                        const formattedUploadTime = exam.uploadedAt 
                          ? new Date(exam.uploadedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '24 Jul 2026, 01:30 AM';
                        
                        return (
                          <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden group">
                            {/* Top decorative gradient bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500" />

                            <div className="space-y-3">
                              {/* Subject Header & Badges */}
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

                              {/* Exam Title */}
                              <h4 className="text-sm font-black text-indigo-950 uppercase font-display leading-snug group-hover:text-indigo-600 transition-colors">
                                {exam.title}
                              </h4>

                              {/* Subject Details Metadata Cards */}
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

                            {/* Card Actions Footer */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubjectDetailCard(exam)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const bundle = compressAndEncryptExamPackage(exam);
                                    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `${exam.title.replace(/[^a-z0-9]/gi, '_')}_UltraLight.cs-exam`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success(`📦 Encrypted Exam Bundle generated! (${bundle.compressedSizeKb} KB - ${bundle.compressionRatioPct}% Data Savings)`);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                  title="Export ultra-lightweight sub-500KB encrypted bundle for zero-data LAN offline mesh sitting"
                                >
                                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Bundle (.cs-exam)</span>
                                </button>
                              </div>

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
                                  logCbtAuditEvent(
                                    nextState ? 'EXAM_PUBLISH' : 'EXAM_UNPUBLISH',
                                    exam.id,
                                    exam.title,
                                    exam.subject,
                                    nextState
                                      ? `Published examination paper "${exam.title}" to student dashboards for ${exam.targetClass || 'SS 2A'} cohort.`
                                      : `Revoked publication state for examination paper "${exam.title}".`
                                  );
                                  if (nextState) {
                                    toast.success(`🎉 Published "${exam.title}" to student dashboards!`);
                                  } else {
                                    toast.info(`Revoked publication for "${exam.title}".`);
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
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {/* SUB-VIEW 2: IMMUTABLE AUDIT TRAIL LEDGER */}
              {uploadedExamsSubView === 'AUDIT_TRAIL' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Top Header Ledger Banner */}
                  <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Cryptographically Verified Ledger
                          </span>
                          <span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[9.5px] font-mono">
                            User ID: {currentProfile?.username || currentProfile?.id || 'CS-TCH-001'}
                          </span>
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-white font-display">
                          Teacher CBT Examination & Grade Audit Trail
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Immutable record of every exam publication state change, paper template upload, and student grade submission or score adjustment with exact timestamps and teacher user IDs.
                        </p>
                      </div>

                      <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddCbtNoteModalOpen(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record Audit Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportAuditCsv}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Export CSV Report</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail Metrics Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        Total Audit Events
                      </span>
                      <div className="text-xl font-black text-indigo-950 font-mono">{cbtAuditLogs.length}</div>
                      <p className="text-[10.5px] text-slate-400 font-medium">Logged in ledger</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        Grade Submissions
                      </span>
                      <div className="text-xl font-black text-emerald-700 font-mono">
                        {cbtAuditLogs.filter(l => l.actionType === 'GRADE_SUBMIT' || l.actionType === 'GRADE_UPDATE').length}
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-medium">Recorded score entries</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        Publication Events
                      </span>
                      <div className="text-xl font-black text-indigo-900 font-mono">
                        {cbtAuditLogs.filter(l => l.actionType === 'EXAM_PUBLISH' || l.actionType === 'EXAM_UNPUBLISH').length}
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-medium">Published / Revoked</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        Active Teacher ID
                      </span>
                      <div className="text-sm font-black text-slate-800 font-mono truncate">
                        {currentProfile?.username || currentProfile?.id || 'CS-TCH-001'}
                      </div>
                      <p className="text-[10.5px] text-emerald-700 font-bold truncate">
                        {currentProfile?.fullName || 'Mrs. Folasade Adebayo'}
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cbtAuditSearchQuery}
                        onChange={(e) => setCbtAuditSearchQuery(e.target.value)}
                        placeholder="Search audit trail by User ID, Teacher Name, Exam Title, Student ID, or Details..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Custom Action Filter Dropdown (No Native Selects) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCbtActionDropdownOpen(!isCbtActionDropdownOpen)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-xs min-w-[170px] justify-between"
                        >
                          <span className="truncate">
                            {cbtAuditActionFilter === 'ALL' ? 'All Actions' :
                             cbtAuditActionFilter === 'EXAM_PUBLISH' ? 'Exam Published' :
                             cbtAuditActionFilter === 'EXAM_UNPUBLISH' ? 'Publication Revoked' :
                             cbtAuditActionFilter === 'GRADE_SUBMIT' ? 'Grade Submitted' :
                             cbtAuditActionFilter === 'GRADE_UPDATE' ? 'Grade Adjusted' :
                             cbtAuditActionFilter === 'EXAM_UPLOAD' ? 'Exam Uploaded' : 'Exam Deleted'}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>

                        {isCbtActionDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCbtActionDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                              {[
                                { id: 'ALL', label: 'All Action Types' },
                                { id: 'GRADE_SUBMIT', label: 'Grade Submitted' },
                                { id: 'GRADE_UPDATE', label: 'Grade Adjusted' },
                                { id: 'EXAM_PUBLISH', label: 'Exam Published' },
                                { id: 'EXAM_UNPUBLISH', label: 'Publication Revoked' },
                                { id: 'EXAM_UPLOAD', label: 'Exam Uploaded' },
                                { id: 'EXAM_DELETE', label: 'Exam Deleted' }
                              ].map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setCbtAuditActionFilter(item.id as any);
                                    setIsCbtActionDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                                >
                                  <span>{item.label}</span>
                                  {cbtAuditActionFilter === item.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Custom Subject Filter Dropdown (No Native Selects) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCbtSubjectFilterDropdownOpen(!isCbtSubjectFilterDropdownOpen)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-xs min-w-[150px] justify-between"
                        >
                          <span className="truncate">{cbtAuditSubjectFilter === 'ALL' ? 'All Subjects' : cbtAuditSubjectFilter}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>

                        {isCbtSubjectFilterDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCbtSubjectFilterDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setCbtAuditSubjectFilter('ALL');
                                  setIsCbtSubjectFilterDropdownOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                              >
                                <span>All Subjects</span>
                                {cbtAuditSubjectFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              </button>
                              {allSubjectNames.map(subj => (
                                <button
                                  key={subj}
                                  type="button"
                                  onClick={() => {
                                    setCbtAuditSubjectFilter(subj);
                                    setIsCbtSubjectFilterDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                                >
                                  <span>{subj}</span>
                                  {cbtAuditSubjectFilter === subj && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audit Ledger List Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                            <th className="p-3.5">Exact Timestamp</th>
                            <th className="p-3.5">User ID & Actor Credentials</th>
                            <th className="p-3.5">Action Type</th>
                            <th className="p-3.5">Target Assessment & Subject</th>
                            <th className="p-3.5">Grade / Target Student & Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {filteredCbtAuditLogs.map((log) => {
                            const exactTimeFormatted = new Date(log.timestamp).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });

                            return (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Exact Timestamp */}
                                <td className="p-3.5 font-mono text-[11px] text-slate-800 align-top space-y-0.5">
                                  <div className="font-bold text-indigo-950 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span>{exactTimeFormatted}</span>
                                  </div>
                                  <div className="text-[9.5px] text-slate-400 font-mono tracking-tight">
                                    {log.timestamp}
                                  </div>
                                </td>

                                {/* User ID & Actor */}
                                <td className="p-3.5 align-top space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded text-[10px] font-mono font-bold">
                                      {log.userId}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                                      {log.userRole}
                                    </span>
                                  </div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {log.userName}
                                  </div>
                                </td>

                                {/* Action Badge */}
                                <td className="p-3.5 align-top">
                                  {log.actionType === 'EXAM_PUBLISH' && (
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <Send className="w-3 h-3 text-emerald-600" />
                                      Exam Published
                                    </span>
                                  )}
                                  {log.actionType === 'EXAM_UNPUBLISH' && (
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <EyeOff className="w-3 h-3 text-amber-600" />
                                      Publication Revoked
                                    </span>
                                  )}
                                  {log.actionType === 'GRADE_SUBMIT' && (
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <Award className="w-3 h-3 text-indigo-600" />
                                      Grade Submission
                                    </span>
                                  )}
                                  {log.actionType === 'GRADE_UPDATE' && (
                                    <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <Calculator className="w-3 h-3 text-purple-600" />
                                      Grade Adjusted
                                    </span>
                                  )}
                                  {log.actionType === 'EXAM_UPLOAD' && (
                                    <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <Upload className="w-3 h-3 text-sky-600" />
                                      Exam Uploaded
                                    </span>
                                  )}
                                  {log.actionType === 'EXAM_DELETE' && (
                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max shadow-2xs">
                                      <Trash2 className="w-3 h-3 text-rose-600" />
                                      Exam Deleted
                                    </span>
                                  )}
                                </td>

                                {/* Target Assessment & Subject */}
                                <td className="p-3.5 align-top space-y-1">
                                  <div className="font-bold text-slate-900 text-xs">
                                    {log.examTitle}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-slate-100 text-indigo-900 border border-slate-200 rounded text-[9.5px] font-bold uppercase">
                                      {log.subject}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">ID: {log.examId}</span>
                                  </div>
                                </td>

                                {/* Details & Student/Grade */}
                                <td className="p-3.5 align-top space-y-1.5 max-w-xs md:max-w-md">
                                  {log.targetStudentName && (
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <span className="font-bold text-slate-800 text-[11px] truncate">{log.targetStudentName}</span>
                                      {log.targetStudentId && (
                                        <span className="font-mono text-[9.5px] text-slate-500 font-bold">({log.targetStudentId})</span>
                                      )}
                                      {typeof log.scoreSubmitted === 'number' && (
                                        <span className="ml-auto font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                          {log.scoreSubmitted}%
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                    {log.details}
                                  </p>
                                  <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-400 pt-0.5">
                                    <span>IP: {log.ipAddress || '197.210.22.41'}</span>
                                    <span>•</span>
                                    <span>Hash: #{log.id}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {filteredCbtAuditLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center p-10 text-slate-400 text-xs italic">
                                No audit log entries matched your filter query. Change search keywords or clear filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT DETAIL MODAL CARD */}
              {selectedSubjectDetailCard && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                          {selectedSubjectDetailCard.subject} • {selectedSubjectDetailCard.targetClass || 'SS 2A'}
                        </span>
                        <h3 className="text-base font-black uppercase tracking-tight">{selectedSubjectDetailCard.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectDetailCard(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Metadata Header */}
                    <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono font-bold text-slate-700">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Specified Duration</span>
                        <span className="text-emerald-600 font-black">{selectedSubjectDetailCard.durationMinutes} Minutes</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Questions Count</span>
                        <span>{selectedSubjectDetailCard.questions.length} Questions</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Author / Examiner</span>
                        <span className="text-slate-900 font-sans">{selectedSubjectDetailCard.uploadedBy || 'Mrs. Folasade Adebayo'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-sans block">Upload Timestamp</span>
                        <span className="text-[10px]">{selectedSubjectDetailCard.uploadedAt ? new Date(selectedSubjectDetailCard.uploadedAt).toLocaleDateString() : '24 Jul 2026'}</span>
                      </div>
                    </div>

                    {/* Questions Detail List */}
                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Question Breakdown & Answer Keys</h4>
                      {selectedSubjectDetailCard.questions.map((q, idx) => (
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

                    {/* Modal Actions Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectDetailCard(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Close Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !selectedSubjectDetailCard.publishedToStudents;
                          const updated = { 
                            ...selectedSubjectDetailCard, 
                            publishedToStudents: nextState,
                            published: nextState 
                          };
                          onUpdateExam(updated);
                          setSelectedSubjectDetailCard(updated);
                          logCbtAuditEvent(
                            nextState ? 'EXAM_PUBLISH' : 'EXAM_UNPUBLISH',
                            selectedSubjectDetailCard.id,
                            selectedSubjectDetailCard.title,
                            selectedSubjectDetailCard.subject,
                            nextState
                              ? `Published examination paper "${selectedSubjectDetailCard.title}" to student dashboards.`
                              : `Revoked publication for examination paper "${selectedSubjectDetailCard.title}".`
                          );
                          toast.success(`Exam status updated to ${nextState ? 'PUBLISHED' : 'DRAFT'}`);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                      >
                        {selectedSubjectDetailCard.publishedToStudents ? "Unpublish Exam" : "Publish Exam to Students"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOM AUDIT NOTE MODAL */}
              {isAddCbtNoteModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">
                          Teacher Ledger Entry
                        </span>
                        <h3 className="text-base font-black uppercase tracking-tight mt-1">Record CBT Audit Event Note</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddCbtNoteModalOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Action Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'GRADE_SUBMIT', label: 'Grade Submission' },
                            { id: 'GRADE_UPDATE', label: 'Grade Adjusted' },
                            { id: 'EXAM_PUBLISH', label: 'Exam Published' },
                            { id: 'EXAM_UNPUBLISH', label: 'Publication Revoked' },
                            { id: 'EXAM_UPLOAD', label: 'Exam Uploaded' },
                            { id: 'EXAM_DELETE', label: 'Exam Deleted' }
                          ].map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setNoteActionType(item.id as any)}
                              className={`p-2 rounded-xl text-xs font-bold uppercase transition-all text-left flex items-center justify-between cursor-pointer border ${
                                noteActionType === item.id
                                  ? "bg-indigo-950 text-white border-indigo-950 shadow-sm"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{item.label}</span>
                              {noteActionType === item.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Exam Title / Assessment</label>
                          <input
                            type="text"
                            value={noteExamTitle}
                            onChange={(e) => setNoteExamTitle(e.target.value)}
                            placeholder="e.g. Physics Mid-Term CBT"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Subject</label>
                          <input
                            type="text"
                            value={noteSubject}
                            onChange={(e) => setNoteSubject(e.target.value)}
                            placeholder="e.g. Physics"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Student Name (Optional)</label>
                          <input
                            type="text"
                            value={noteStudentName}
                            onChange={(e) => setNoteStudentName(e.target.value)}
                            placeholder="e.g. Aminat Yusuf"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Student ID (Optional)</label>
                          <input
                            type="text"
                            value={noteStudentId}
                            onChange={(e) => setNoteStudentId(e.target.value)}
                            placeholder="e.g. CS-STU-3312"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Score % (Optional)</label>
                          <input
                            type="number"
                            value={noteScore}
                            onChange={(e) => setNoteScore(e.target.value)}
                            placeholder="e.g. 85"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Audit Event Details *</label>
                        <textarea
                          rows={3}
                          value={noteDetails}
                          onChange={(e) => setNoteDetails(e.target.value)}
                          placeholder="Provide clear reasons, grade verification hash, or publication state details..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddCbtNoteModalOpen(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomCbtNote}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer"
                      >
                        Record Audit Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {exams.map((exam) => {
                const totalAttempts = sessions.filter(s => s.examId === exam.id && s.isCompleted).length;
                return (
                  <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-bold text-indigo-700 uppercase">
                          {exam.subject}
                        </span>
                        <div className="flex gap-1.5">
                          {exam.published ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[8.5px] font-bold uppercase flex items-center gap-1">
                              <Eye className="w-3 h-3 text-emerald-600" />
                              RESULTS RELEASED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-150 rounded text-[8.5px] font-bold uppercase flex items-center gap-1">
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              REVIEWS BUFFERED
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 uppercase font-display leading-snug">
                        {exam.title}
                      </h4>

                      <div className="flex gap-4 text-[10px] text-slate-400 font-mono font-bold">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{exam.durationMinutes} Mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{exam.questions.length} MCQs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{totalAttempts} Attempts</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setPrintPreviewExam(exam)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Print A4 Question Paper or Answer Key"
                        >
                          <Printer className="w-3 h-3 text-indigo-600" />
                          <span>Print Paper</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExamForSubmissions(exam);
                            setActiveTab('submissions');
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg hover:bg-slate-50 transition"
                        >
                          View Submissions
                        </button>

                        <button
                          onClick={() => {
                            const updated = { ...exam, published: !exam.published };
                            onUpdateExam(updated);
                            toast.success(
                              `Exam results publication ${updated.published ? 'RELEASED' : 'REVOKED'} for ${exam.title.toUpperCase()}`
                            );
                          }}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                            exam.published
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {exam.published ? (
                            <>
                              <EyeOff className="w-3 h-3 text-white" />
                              <span>Revoke Scores</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-white" />
                              <span>Release Scores</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {exams.length === 0 && (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400 space-y-2">
                  <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-bold uppercase">No examinations built yet</p>
                  <p className="text-[11px]">Click the "Create Exam Template" button above to get started with creating assessments.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Exam Grading sheets</h3>
                  <p className="text-[11.5px] text-slate-400">Select an assessment paper to inspect registered candidate sheet score entries.</p>
                </div>

                {/* Custom Exam selector dropdown (NO Native Dropdowns) */}
                {exams.length > 0 && (
                  <div className="relative w-full sm:w-auto min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="truncate">{selectedExamForSubmissions?.title ?? "Select Examination"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isExamDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExamDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                          {exams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedExamForSubmissions(exam);
                                setIsExamDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span className="truncate mr-3">{exam.title}</span>
                              {selectedExamForSubmissions?.id === exam.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submissions Table */}
              {selectedExamForSubmissions ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-3">Candidate Name</th>
                        <th className="p-3">Candidate Code</th>
                        <th className="p-3">Score Marks</th>
                        <th className="p-3">Outcome</th>
                        <th className="p-3">Time Spent</th>
                        <th className="p-3">Submission Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {examSubmissions.map((sub, idx) => {
                        const studentObj = students.find(s => s.id === sub.studentId);
                        const isPassed = (sub.score ?? 0) >= passBenchmark;
                        
                        // Calculate duration spent
                        const durationSpentSec = selectedExamForSubmissions.durationMinutes * 60 - sub.timeLeftSeconds;
                        const minSpent = Math.floor(durationSpentSec / 60);
                        const secSpent = durationSpentSec % 60;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900">{studentObj?.fullName ?? "Unknown Student"}</td>
                            <td className="p-3 font-mono font-bold text-indigo-600">{studentObj?.username ?? sub.studentId}</td>
                            <td className="p-3 font-mono text-sm font-black">{sub.score}%</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isPassed 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                  : "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {isPassed ? "PASSED" : "FAILED"}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{minSpent}m {secSpent}s</td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(sub.lastSavedAt || "").toLocaleString()}</td>
                          </tr>
                        );
                      })}

                      {examSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400 text-xs italic">
                            No student candidate sheets has been submitted yet for this examination.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs italic">
                  Create an examination template to inspect submissions.
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 bg-white rounded-t-2xl p-5 border border-slate-200">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">CBT Analytics Dashboard</h3>
                  <p className="text-[11.5px] text-slate-400">Statistical summaries, pass indices, and cohort performance graphs.</p>
                </div>

                {/* Custom select dropdown */}
                {exams.length > 0 && (
                  <div className="relative w-full sm:w-auto min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                    >
                      <span className="truncate">{selectedExamForSubmissions?.title ?? "Select Examination"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isExamDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExamDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                          {exams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedExamForSubmissions(exam);
                                setIsExamDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span className="truncate mr-3">{exam.title}</span>
                              {selectedExamForSubmissions?.id === exam.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {selectedExamForSubmissions ? (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Candidate Count</p>
                        <p className="text-lg font-black text-slate-900 leading-none mt-1">{examSubmissions.length} Submitted</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Percent className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Score</p>
                        <p className="text-lg font-black text-emerald-600 leading-none mt-1">{stats.avg}% Marks</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Rate Indice</p>
                        <p className="text-lg font-black text-purple-600 leading-none mt-1">{stats.passRate}%</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <BarChart3 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score Bounds</p>
                        <p className="text-sm font-black text-slate-900 leading-none mt-1.5 font-mono">
                          Min: <span className="text-rose-500 font-bold">{stats.min}%</span> / Max: <span className="text-emerald-500 font-bold">{stats.max}%</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question breakdown list */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Question Accuracy & Analytics</span>
                    </div>

                    <div className="space-y-4">
                      {selectedExamForSubmissions.questions.map((q, idx) => {
                        // Calculate percentage of students who got this right
                        const totalAnswering = examSubmissions.length;
                        const correctCount = examSubmissions.filter(s => s.answers[q.id] === q.correctOptionIndex).length;
                        const accuracy = totalAnswering > 0 ? Math.round((correctCount / totalAnswering) * 100) : 100;

                        return (
                          <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <span className="text-[10.5px] font-black uppercase text-indigo-950 font-mono">Question #{idx + 1} ({q.marks}M)</span>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0">Accuracy Index:</span>
                                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      accuracy >= 70 ? "bg-emerald-500" : accuracy >= 40 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${accuracy}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-black font-mono shrink-0 ${
                                  accuracy >= 70 ? "text-emerald-600" : accuracy >= 40 ? "text-amber-600" : "text-rose-600"
                                }`}>
                                  {accuracy}%
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-slate-850">{q.text}</p>
                            
                            {/* Options with correctness breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctOptionIndex === optIdx;
                                const choices = examSubmissions.filter(s => s.answers[q.id] === optIdx).length;
                                const percentage = totalAnswering > 0 ? Math.round((choices / totalAnswering) * 100) : 0;

                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`p-2 border rounded-lg flex justify-between items-center ${
                                      isCorrect 
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold" 
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                        isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="truncate">{opt}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono ml-2 shrink-0">{percentage}% ({choices})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs italic">
                  Build and upload examination templates first to view metrics.
                </div>
              )}
            </div>
          )}

          {/* 4. SUBJECT STATISTICAL BREAKDOWN TAB */}
          {activeTab === 'subject_breakdown' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white font-display">
                        Subject Assessment Statistical Ledger
                      </h3>
                    </div>
                    <p className="text-xs text-indigo-200">
                      Calculated Mean (μ), Median (M), and Standard Deviation (σ) metrics across each subject's latest assessment paper.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pass Target: {passBenchmark}%</span>
                  </div>
                </div>

                {/* Macro summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10 relative z-10 font-mono">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[9px] uppercase text-indigo-300 block font-bold">Total Subjects Monitored</span>
                    <span className="text-lg font-black text-white">{macroStats.totalSubjects} Streams</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[9px] uppercase text-emerald-300 block font-bold">Overall Cohort Mean (μ)</span>
                    <span className="text-lg font-black text-emerald-400">{macroStats.macroMean}%</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[9px] uppercase text-indigo-300 block font-bold">Overall Cohort Median (M)</span>
                    <span className="text-lg font-black text-indigo-200">{macroStats.macroMedian}%</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[9px] uppercase text-amber-300 block font-bold">Avg Standard Deviation (σ)</span>
                    <span className="text-lg font-black text-amber-300">±{macroStats.macroStdDev}</span>
                  </div>
                </div>
              </div>

              {/* Controls / Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black uppercase text-indigo-950 font-display">
                    Subject Statistical Directory ({sortedSubjectBreakdown.length})
                  </span>
                </div>

                {/* Custom Sort Select Dropdown (NO Native Select) */}
                <div className="relative w-full sm:w-auto min-w-[260px]">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="w-full flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {subjectSortOption === 'subject_asc' && 'Sort: Subject Name (A-Z)'}
                        {subjectSortOption === 'mean_desc' && 'Sort: Mean Score (Highest)'}
                        {subjectSortOption === 'mean_asc' && 'Sort: Mean Score (Lowest)'}
                        {subjectSortOption === 'sd_desc' && 'Sort: Std Deviation (Spread)'}
                        {subjectSortOption === 'subs_desc' && 'Sort: Submissions Count'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isSortDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSortDropdownOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs">
                        {[
                          { key: 'subject_asc', label: 'Subject Name (A-Z)' },
                          { key: 'mean_desc', label: 'Mean Score (Highest)' },
                          { key: 'mean_asc', label: 'Mean Score (Lowest)' },
                          { key: 'sd_desc', label: 'Std Deviation (Spread)' },
                          { key: 'subs_desc', label: 'Submissions Count' }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setSubjectSortOption(opt.key as any);
                              setIsSortDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition flex items-center justify-between"
                          >
                            <span>{opt.label}</span>
                            {subjectSortOption === opt.key && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Subject Breakdown List / Cards */}
              <div className="grid grid-cols-1 gap-4">
                {sortedSubjectBreakdown.map((item) => {
                  const hasSubmissions = item.submissionCount > 0;
                  const isMeanPass = item.mean >= passBenchmark;

                  return (
                    <div 
                      key={item.subject} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition duration-150"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-900 rounded-md text-[10px] font-black uppercase tracking-wider font-mono">
                              {item.subject}
                            </span>
                            {item.latestExam ? (
                              <span className="text-xs font-bold text-slate-700 font-sans">
                                {item.latestExam.title}
                              </span>
                            ) : (
                              <span className="text-xs italic text-slate-400">
                                No assessment created yet
                              </span>
                            )}
                          </div>
                          {item.latestExam && (
                            <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                              {item.latestExam.questions.length} MCQs | Duration: {item.latestExam.durationMinutes} Mins
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {hasSubmissions ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold rounded-lg uppercase">
                              {item.submissionCount} Submissions Analyzed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-mono font-bold rounded-lg uppercase">
                              Awaiting Candidate Attempts
                            </span>
                          )}
                          {hasSubmissions && (
                            <button
                              type="button"
                              onClick={() => setSelectedSubjectModal(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Activity className="w-3.5 h-3.5 text-white" />
                              <span>Inspect Breakdown</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {hasSubmissions ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
                          {/* MEAN (mu) */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Mean Score (μ)</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-lg font-black ${isMeanPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {item.mean}%
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${isMeanPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {isMeanPass ? 'Above Target' : 'Below Target'}
                              </span>
                            </div>
                            <span className="text-[8.5px] text-slate-400 block font-sans">Formula: Σ scores / N</span>
                          </div>

                          {/* MEDIAN (M) */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Median Score (M)</span>
                            <span className="text-lg font-black text-indigo-950 block">
                              {item.median}%
                            </span>
                            <span className="text-[8.5px] text-slate-400 block font-sans">50th percentile mark</span>
                          </div>

                          {/* STANDARD DEVIATION (sigma) */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Standard Dev (σ)</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-amber-600">
                                ±{item.stdDev}
                              </span>
                            </div>
                            <span className={`text-[8.5px] font-bold block ${item.stdDev <= 8 ? 'text-emerald-600' : item.stdDev <= 15 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {item.stdDev <= 8 ? 'Consistent Cohort' : item.stdDev <= 15 ? 'Moderate Spread' : 'High Dispersion'}
                            </span>
                          </div>

                          {/* RANGE (MIN - MAX) */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Score Bounds (Min/Max)</span>
                            <span className="text-sm font-black text-slate-800 block">
                              {item.min}% — {item.max}%
                            </span>
                            <span className="text-[8.5px] text-slate-400 block font-sans">Spread Delta: {item.max - item.min}%</span>
                          </div>

                          {/* PASS RATE */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 col-span-2 md:col-span-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pass Rate (≥{passBenchmark}%)</span>
                            <span className="text-lg font-black text-purple-600 block">
                              {item.passRate}%
                            </span>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-600 rounded-full" 
                                style={{ width: `${item.passRate}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          No student submission entries recorded for {item.subject}'s latest assessment yet.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DETAILED SUBJECT STATISTICAL INSPECTION MODAL                 */}
      {/* ------------------------------------------------------------- */}
      {selectedSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-700 to-emerald-600 text-white rounded-2xl shadow-md">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-indigo-950 font-display">
                    {selectedSubjectModal.subject} — Statistical Analysis
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exam Paper: <strong className="text-slate-800">{selectedSubjectModal.latestExam?.title}</strong> | Submissions: <strong className="text-indigo-900">{selectedSubjectModal.submissionCount} Candidates</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-black text-indigo-900 block">Mean (μ)</span>
                <span className="text-2xl font-black text-indigo-950 block">{selectedSubjectModal.mean}%</span>
                <p className="text-[10px] text-slate-500 font-sans">Formula: sum(scores) / N = {selectedSubjectModal.mean}</p>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-900 block">Median (M)</span>
                <span className="text-2xl font-black text-emerald-950 block">{selectedSubjectModal.median}%</span>
                <p className="text-[10px] text-slate-500 font-sans">Middle value of candidate scores list</p>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-black text-amber-900 block">Std Dev (σ)</span>
                <span className="text-2xl font-black text-amber-950 block">±{selectedSubjectModal.stdDev}</span>
                <p className="text-[10px] text-slate-500 font-sans">sqrt(variance across mean)</p>
              </div>
            </div>

            {/* Individual Candidate Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 font-display">
                <Users className="w-4 h-4 text-emerald-600" />
                Candidate Score Deviations
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Score Marks</th>
                      <th className="p-3">Deviation from Mean (x - μ)</th>
                      <th className="p-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedSubjectModal.sessions?.map((sub: CbtSessionState, idx: number) => {
                      const studentObj = students.find(s => s.id === sub.studentId);
                      const sc = sub.score ?? 0;
                      const dev = Math.round((sc - selectedSubjectModal.mean) * 10) / 10;
                      const isPassed = sc >= passBenchmark;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{studentObj?.fullName ?? "Unknown Student"}</span>
                            <span className="text-[10px] font-mono text-indigo-600">{studentObj?.username ?? sub.studentId}</span>
                          </td>
                          <td className="p-3 font-mono font-black text-slate-900">{sc}%</td>
                          <td className="p-3 font-mono font-bold">
                            <span className={dev >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {dev >= 0 ? `+${dev}` : dev}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              isPassed ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                            }`}>
                              {isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubjectModal(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CBT EXAM PRINT PREVIEW MODAL */}
      <CbtExamPrintPreviewModal
        isOpen={!!printPreviewExam}
        onClose={() => setPrintPreviewExam(null)}
        exam={printPreviewExam}
      />
    </div>
  );
}
