import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import StarRating from "../components/StarRating";
import BulkUploadDialog from "../components/BulkUploadDialog";
import StudentProfileDialog from "../components/StudentProfileDialog";
import { 
  Plus, Users, Landmark, FileText, Megaphone, Check, Settings, 
  Trash, Save, GraduationCap, FileSpreadsheet, UserPlus, ShieldAlert,
  Sliders, Star, Edit, Key, ArrowUpRight, CheckCircle2, AlertCircle, Camera, Trash2, Clock,
  UploadCloud, Download, Eye, Calendar, Sparkles, CheckSquare, X, Search, Copy, AlertTriangle, Shuffle, Printer,
  ChevronDown, Layers, BookOpen, Send, SlidersHorizontal
} from "lucide-react";
import * as XLSX from "xlsx";
import SettingsPanel from "../components/SettingsPanel";
import CommunicationHub from "../components/CommunicationHub";
import DailyAttendanceRegister from "../components/DailyAttendanceRegister";
import { UpgradeOverlay } from "../components/UpgradeOverlay";
import InteractivePlanComparisonModal from "../components/InteractivePlanComparisonModal";
import { motion, AnimatePresence } from "motion/react";
import { GradeDistributionChart } from "../components/GradeDistributionChart";
import PerformanceTrendsCard from "../components/PerformanceTrendsCard";
import { TeacherWorkloadHeatmap } from "../components/TeacherWorkloadHeatmap";
import { AcademicBroadsheetVault } from "../components/AcademicBroadsheetVault";
import { StudentResultDossier } from "../components/StudentResultDossier";
import TeacherAssignmentsManager from "../components/TeacherAssignmentsManager";

const SKILLS = ["Punctuality", "Attentiveness", "Neatness", "Honesty", "Sportsmanship", "Leadership"];
const TERMS = ["1st Term", "2nd Term", "3rd Term"];

export function TeacherDashboard({ currentProfile, theme, setTheme, activeFont, setActiveFont, activeTab, grades = [] }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [term, setTerm] = useState("1st Term");
  const [year, setYear] = useState("2025/2026");
  const [selected, setSelected] = useState<any>(null);
  const [scoreMap, setScoreMap] = useState<any>({});
  const [skillMap, setSkillMap] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [classSubjects, setClassSubjects] = useState<any>({});
  const [school, setSchool] = useState<any>(null);
  const [isPlanComparisonOpen, setIsPlanComparisonOpen] = useState(false);

  const handleSimulatedUpgrade = async () => {
    try {
      const payload = {
        ...school,
        subscription_tier: "unified_enterprise"
      };
      await api.put("/schools/me", payload);
      localStorage.setItem("CS_SCHOOL", JSON.stringify(payload));
      setSchool(payload);
      toast.success("School tier upgraded to UNIFIED ENTERPRISE successfully! All premium modules unlocked.");
      refresh();
    } catch (e: any) {
      toast.error("Failed to execute simulated upgrade.");
    }
  };

  // CBT states
  const [exams, setExams] = useState<any[]>([]);
  const [examDlg, setExamDlg] = useState(false);
  const [examForm, setExamForm] = useState<any>(_emptyExam());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proctorLogs, setProctorLogs] = useState<any[]>([]);
  const [pasteContent, setPasteContent] = useState("");

  // CBT Excel Upload states
  const [uploadedQuestions, setUploadedQuestions] = useState<any[]>([]);
  const [excelFilename, setExcelFilename] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [excelTitle, setExcelTitle] = useState<string>("");
  const [excelSubject, setExcelSubject] = useState<string>("Mathematics");
  const [excelClass, setExcelClass] = useState<string>("SS 2 Science");
  const [excelDuration, setExcelDuration] = useState<number>(45);
  const [excelTerm, setExcelTerm] = useState<string>("1st Term");
  const [qSearchQuery, setQSearchQuery] = useState<string>("");
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);
  const [highlightDuplicates, setHighlightDuplicates] = useState<boolean>(false);
  const [isShuffleActive, setIsShuffleActive] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const handleShuffleToggle = () => {
    if (!isShuffleActive) {
      const indices = Array.from({ length: uploadedQuestions.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffleActive(true);
      toast.success("CBT Randomizer Preview Activated! Showing side-by-side randomized distribution.");
    } else {
      setIsShuffleActive(false);
    }
  };

  const handleReshuffle = () => {
    const indices = Array.from({ length: uploadedQuestions.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    toast.success("Spreadsheet questions randomized with a new CBT sequence seed!");
  };

  useEffect(() => {
    if (isShuffleActive) {
      if (shuffledIndices.length !== uploadedQuestions.length) {
        const indices = Array.from({ length: uploadedQuestions.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffledIndices(indices);
      }
    }
  }, [uploadedQuestions.length, isShuffleActive]);

  // Compute duplicate groups by matching trimmed, case-insensitive question text
  const duplicateGroups = useMemo(() => {
    const textMap = new Map<string, number[]>();
    uploadedQuestions.forEach((q, idx) => {
      const text = (q.question || "").trim().toLowerCase();
      if (text) {
        if (!textMap.has(text)) {
          textMap.set(text, []);
        }
        textMap.get(text)!.push(idx);
      }
    });

    const groups: { text: string; indices: number[] }[] = [];
    textMap.forEach((indices, text) => {
      if (indices.length > 1) {
        groups.push({ text, indices });
      }
    });
    return groups;
  }, [uploadedQuestions]);

  const duplicateIndices = useMemo(() => {
    const indices = new Set<number>();
    duplicateGroups.forEach((group) => {
      group.indices.forEach((idx) => indices.add(idx));
    });
    return indices;
  }, [duplicateGroups]);

  const handleAutoMergeDuplicates = () => {
    if (duplicateGroups.length === 0) {
      toast.info("No duplicate questions found to merge.");
      return;
    }

    // Keep only the first occurrence for each duplicate text group, and remove subsequent duplicates
    const indicesToDelete = new Set<number>();
    duplicateGroups.forEach((group) => {
      // Keep indices[0], delete indices[1...]
      group.indices.slice(1).forEach((idx) => {
        indicesToDelete.add(idx);
      });
    });

    const updated = uploadedQuestions.filter((_, idx) => !indicesToDelete.has(idx));
    setUploadedQuestions(updated);
    setSelectedRowIndices([]);
    setEditingIdx(null);
    setHighlightDuplicates(false);
    toast.success(`Successfully merged duplicates! Cleaned up and removed ${indicesToDelete.size} redundant question rows.`);
  };

  const handleToggleSelectAll = (filteredQs: any[]) => {
    const filteredIndices = filteredQs.map((q) => q.originalIdx);
    const isAllSelected = filteredQs.length > 0 && filteredQs.every((q) => selectedRowIndices.includes(q.originalIdx));
    if (isAllSelected) {
      setSelectedRowIndices(selectedRowIndices.filter((idx) => !filteredIndices.includes(idx)));
    } else {
      setSelectedRowIndices(Array.from(new Set([...selectedRowIndices, ...filteredIndices])));
    }
  };

  const handleToggleSelectRow = (originalIdx: number) => {
    if (selectedRowIndices.includes(originalIdx)) {
      setSelectedRowIndices(selectedRowIndices.filter((idx) => idx !== originalIdx));
    } else {
      setSelectedRowIndices([...selectedRowIndices, originalIdx]);
    }
  };

  const handleBulkDeleteQuestions = () => {
    if (selectedRowIndices.length === 0) {
      toast.error("No rows selected for deletion.");
      return;
    }
    const updated = uploadedQuestions.filter((_, i) => !selectedRowIndices.includes(i));
    setUploadedQuestions(updated);
    setSelectedRowIndices([]);
    setEditingIdx(null);
    toast.success(`Successfully deleted ${selectedRowIndices.length} selected question row(s).`);
  };

  // Inline editing states for Excel/CSV parsed questions
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editOptA, setEditOptA] = useState("");
  const [editOptB, setEditOptB] = useState("");
  const [editOptC, setEditOptC] = useState("");
  const [editOptD, setEditOptD] = useState("");
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);
  const [editDiagramUrl, setEditDiagramUrl] = useState("");

  const getQuestionValidationErrors = (q: any) => {
    const errors: string[] = [];
    if (!q.question || !q.question.trim() || q.question === "New Custom CBT Question") {
      errors.push("Question text is empty or unconfigured");
    }
    if (!q.options || q.options.length < 4) {
      errors.push("Options list is incomplete");
    } else {
      const labels = ["A", "B", "C", "D"];
      const defaults = ["Option A Value", "Option B Value", "Option C Value", "Option D Value"];
      q.options.forEach((opt: string, i: number) => {
        if (!opt || !opt.trim() || opt === defaults[i]) {
          errors.push(`Option ${labels[i]} is empty or unconfigured`);
        }
      });
    }
    if (q.correct_idx === undefined || q.correct_idx < 0 || q.correct_idx > 3) {
      errors.push("Correct key is not specified or out of bounds");
    }
    return errors;
  };

  const validationErrorCount = useMemo(() => {
    return uploadedQuestions.filter(q => getQuestionValidationErrors(q).length > 0).length;
  }, [uploadedQuestions]);

  const validQuestionsCount = useMemo(() => {
    return uploadedQuestions.length - validationErrorCount;
  }, [uploadedQuestions, validationErrorCount]);

  const validationPercentage = useMemo(() => {
    if (uploadedQuestions.length === 0) return 0;
    return Math.round((validQuestionsCount / uploadedQuestions.length) * 100);
  }, [uploadedQuestions.length, validQuestionsCount]);

  const filteredQuestions = useMemo(() => {
    return uploadedQuestions
      .map((q, originalIdx) => ({ ...q, originalIdx }))
      .filter((q) => {
        if (!qSearchQuery.trim()) return true;
        const term = qSearchQuery.toLowerCase();
        const textMatch = q.question?.toLowerCase().includes(term);
        const optionsMatch = q.options?.some((opt: string) => opt?.toLowerCase().includes(term));
        const sNoMatch = String(q.originalIdx + 1) === term.trim();
        return textMatch || optionsMatch || sNoMatch;
      });
  }, [uploadedQuestions, qSearchQuery]);

  const handleStartEditQuestion = (idx: number, q: any) => {
    setEditingIdx(idx);
    setEditQuestionText(q.question || "");
    setEditOptA(q.options?.[0] || "");
    setEditOptB(q.options?.[1] || "");
    setEditOptC(q.options?.[2] || "");
    setEditOptD(q.options?.[3] || "");
    setEditCorrectIdx(q.correct_idx || 0);
    setEditDiagramUrl(q.diagramUrl || "");
  };

  const handleSaveQuestionEdit = (idx: number) => {
    if (!editQuestionText.trim()) {
      toast.error("Question text cannot be blank.");
      return;
    }
    const updated = [...uploadedQuestions];
    updated[idx] = {
      ...updated[idx],
      question: editQuestionText.trim(),
      options: [editOptA.trim(), editOptB.trim(), editOptC.trim(), editOptD.trim()],
      correct_idx: editCorrectIdx,
      diagramUrl: editDiagramUrl.trim() || undefined
    };
    setUploadedQuestions(updated);
    setEditingIdx(null);
    toast.success(`Question ${idx + 1} updated successfully!`);
  };

  const handleCancelQuestionEdit = () => {
    setEditingIdx(null);
  };

  const handleDeleteUploadedQuestion = (idx: number) => {
    const updated = uploadedQuestions.filter((_, i) => i !== idx);
    setUploadedQuestions(updated);
    if (editingIdx === idx) {
      setEditingIdx(null);
    }
    toast.success(`Question row ${idx + 1} removed.`);
  };

  const handleAddBlankQuestion = () => {
    const newQ = {
      question: "New Custom CBT Question",
      options: ["Option A Value", "Option B Value", "Option C Value", "Option D Value"],
      correct_idx: 0,
      diagramUrl: ""
    };
    const updated = [...uploadedQuestions, newQ];
    setUploadedQuestions(updated);
    handleStartEditQuestion(updated.length - 1, newQ);
    toast.success("New question row appended.");
  };

  const parseCSVData = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l !== "");
    if (lines.length === 0) return [];

    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes("question") || firstLine.includes("s/n") || firstLine.includes("option a") || firstLine.includes("correct")) {
      startIndex = 1;
    }

    const parsed: any[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let parts: string[] = [];
      let currentPart = "";
      let insideQuotes = false;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          parts.push(currentPart.trim());
          currentPart = "";
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());

      if (parts.length >= 6) {
        const questionText = parts[1] || "";
        const optA = parts[2] || "";
        const optB = parts[3] || "";
        const optC = parts[4] || "";
        const optD = parts[5] || "";
        const attachedImage = parts[6] || "";
        const correctAnswer = (parts[7] || "").toLowerCase().trim();

        let correctIdx = 0;
        if (correctAnswer === "b" || correctAnswer === "option b" || correctAnswer === "1" || correctAnswer === optB.toLowerCase()) {
          correctIdx = 1;
        } else if (correctAnswer === "c" || correctAnswer === "option c" || correctAnswer === "2" || correctAnswer === optC.toLowerCase()) {
          correctIdx = 2;
        } else if (correctAnswer === "d" || correctAnswer === "option d" || correctAnswer === "3" || correctAnswer === optD.toLowerCase()) {
          correctIdx = 3;
        }

        parsed.push({
          type: "mcq",
          question: questionText,
          options: [optA, optB, optC, optD],
          correct_idx: correctIdx,
          diagramUrl: attachedImage,
          audioUrl: ""
        });
      }
    }
    return parsed;
  };

  const handleDownloadTemplate = () => {
    const csvContent = "S/n,question,option a,option b,option c,option d,attached image,correct answer\n" +
      "1,What is the primary product of Corner Streams?,Visual dashboard streaming,Bursary logs,Water treatment,Relational databases,https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400,A\n" +
      "2,Which state variable handles proctor integrity alerts in Student Dashboard?,CS_SCHOOL,CS_CBT_SESSION_RECORDS,CS_BILLING_LEDGER,CS_STUDENT_PROFILES,https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400,B\n" +
      "3,Solve for x: 2x + 10 = 20,x = 5,x = 10,x = 15,x = 2,https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400,A\n" +
      "4,Who is the current Head of Department (HOD) of science stream?,Mrs. Folasade Adebayo,Dr. David Macaulay,Dr. Emeka Nwosu,Chief Alao Benson,,C\n" +
      "5,What is the pass benchmark score for computer based exams by default?,30%,40%,50%,70%,,C";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "CBT_Exam_Question_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Standardized Excel/CSV CBT template downloaded successfully!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFilename(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSVData(text);
      if (parsed.length > 0) {
        setUploadedQuestions(parsed);
        setSelectedRowIndices([]);
        toast.success(`Excel sheet parsed successfully! Extracted ${parsed.length} questions.`);
        if (!excelTitle) {
          setExcelTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
      } else {
        toast.error("Format error: Unable to parse questions. Please match template columns.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setExcelFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSVData(text);
      if (parsed.length > 0) {
        setUploadedQuestions(parsed);
        setSelectedRowIndices([]);
        toast.success(`Excel sheet dropped & parsed! Extracted ${parsed.length} questions.`);
        if (!excelTitle) {
          setExcelTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
      } else {
        toast.error("Format error: Unable to parse questions. Please match template columns.");
      }
    };
    reader.readAsText(file);
  };

  const handleSeedExcelMock = () => {
    const mockCsv = "S/n,question,option a,option b,option c,option d,attached image,correct answer\n" +
      "1,Which force pulls objects toward the center of the earth?,Gravity,Friction,Electromagnetism,Centrifugal,https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400,A\n" +
      "2,Solve the equation: 3x + 12 = 30,x = 6,x = 5,x = 8,x = 10,https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400,A\n" +
      "3,What is the primary gas in the atmosphere of Earth?,Nitrogen,Oxygen,Carbon Dioxide,Argon,,A\n" +
      "4,Who authored the classic literature 'The Gods Are Not To Blame'?,Ola Rotimi,Wole Soyinka,Chinua Achebe,Chimamanda Adichie,,A\n" +
      "5,What type of database structure is utilized for Corner Streams logs?,Relational database (PostgreSQL),Local Storage key-value,NoSQL (Firestore),In-memory Cache,,B";
    
    setExcelFilename("physics_chemistry_assessment_template_2026.csv");
    const parsed = parseCSVData(mockCsv);
    setUploadedQuestions(parsed);
    setSelectedRowIndices([]);
    setExcelTitle("STEM Stream Joint Diagnostic Quiz");
    setExcelSubject("Science");
    setExcelClass("SS 2 Science");
    setExcelDuration(40);
    toast.success("Sample Excel template loaded into editor.");
  };

  const handleSaveExcelExam = () => {
    if (!excelTitle.trim()) {
      toast.error("Please enter a Title for this testing paper.");
      return;
    }
    if (uploadedQuestions.length === 0) {
      toast.error("Roster is empty. Please upload or paste a CSV/Excel sheet containing question rows.");
      return;
    }

    const invalidQuestions = uploadedQuestions.map((q, idx) => ({
      idx,
      errors: getQuestionValidationErrors(q)
    })).filter(item => item.errors.length > 0);

    if (invalidQuestions.length > 0) {
      toast.error(`Submission Blocked: Roster has ${invalidQuestions.length} invalid rows (Row(s): ${invalidQuestions.map(item => item.idx + 1).join(", ")}). Please configure missing question texts, options, or correct answers first!`);
      return;
    }

    const newExam = {
      id: "ex-" + Math.random().toString(36).substr(2, 9),
      title: excelTitle,
      subject: excelSubject,
      class_name: excelClass,
      term: excelTerm,
      year: "2025/2026",
      duration_min: excelDuration,
      status: "pending_review",
      questions: uploadedQuestions,
      question_count: uploadedQuestions.length,
      uploaded_by: "Mrs. Folasade Adebayo (HOD Science)",
      date_uploaded: new Date().toISOString()
    };

    const currentExams = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    const updated = [newExam, ...currentExams];
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(updated));
    
    toast.success("Excel CBT Question roster submitted to Admin & HOD Review Desk successfully!");
    
    setUploadedQuestions([]);
    setExcelFilename("");
    setExcelTitle("");
    
    refresh();
  };

  const loadProctorLogs = () => {
    const logs = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
    setProctorLogs(logs);
  };

  const handleBulkImportPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Please paste some valid text/CSV content first!");
      return;
    }
    try {
      const lines = pasteContent.split("\n").filter(l => l.trim() !== "");
      const parsedQuestions: any[] = [];
      lines.forEach((line) => {
        const parts = line.split(";").map(p => p.trim());
        if (parts.length >= 3) {
          const questionText = parts[0];
          const optionsList = parts[1].split(",").map(o => o.trim());
          const correctIdx = Number(parts[2]) || 0;
          const diagramUrl = parts[3] || "";
          const audioUrl = parts[4] || "";

          parsedQuestions.push({
            type: "mcq",
            question: questionText,
            options: optionsList.length >= 4 ? optionsList : [...optionsList, "", "", "", ""].slice(0, 4),
            correct_idx: correctIdx,
            diagramUrl: diagramUrl,
            audioUrl: audioUrl
          });
        }
      });

      if (parsedQuestions.length > 0) {
        setExamForm({
          ...examForm,
          questions: parsedQuestions
        });
        toast.success(`Successfully parsed and imported ${parsedQuestions.length} standardized questions with LaTeX/Media support parameters!`);
        setPasteContent("");
      } else {
        toast.error("Could not parse any valid lines. Format must contain fields separated by semicolons.");
      }
    } catch (err) {
      toast.error("Error parsing content. Please use the standardized structure.");
    }
  };

  const handleLoadSampleSTEMExam = () => {
    const stemMock = [
      {
        type: "mcq",
        question: "Solve the quadratic equation: x² - 5x + 6 = 0. Find the values of x.",
        options: ["x = 2 or x = 3", "x = -2 or x = -3", "x = 1 or x = 5", "x = 0 or x = 6"],
        correct_idx: 0,
        diagramUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60",
        audioUrl: ""
      },
      {
        type: "mcq",
        question: "Listen to the audio comprehension track and answer: What is the main theme discussed by the speaker regarding organic molecules?",
        options: ["Covalent bond structures", "Electronegativity coefficients", "Ionic dissociation thresholds", "Aqueous solvency states"],
        correct_idx: 0,
        diagramUrl: "",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      },
      {
        type: "mcq",
        question: "In the chemical structure of benzene (C₆H₆), what is the hybridisation of each carbon atom?",
        options: ["sp³ hybridisation", "sp² hybridisation", "sp hybridisation", "dsp² hybridisation"],
        correct_idx: 1,
        diagramUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=400&auto=format&fit=crop&q=60",
        audioUrl: ""
      }
    ];
    setExamForm({
      ...examForm,
      title: "STEM Unified Science Examination",
      subject: "Chemistry & Mathematics",
      questions: stemMock
    });
    toast.success("Standardized STEM exam containing quadratic LaTeX formulas and Listening Audio loaded successfully!");
  };

  const handleExportBroadsheetExcel = () => {
    const dataRows = students.map((st, sidx) => {
      const mathRaw = st.id === "st-1" ? 77 : st.id === "st-2" ? 64 : st.id === "st-3" ? 55 : 48;
      const engRaw = st.id === "st-1" ? 82 : st.id === "st-2" ? 58 : st.id === "st-3" ? 61 : 45;
      const physRaw = st.id === "st-1" ? 79 : st.id === "st-2" ? 62 : st.id === "st-3" ? 50 : 49;
      const chemRaw = st.id === "st-1" ? 85 : st.id === "st-2" ? 60 : st.id === "st-3" ? 52 : 44;
      const bioRaw = st.id === "st-1" ? 90 : st.id === "st-2" ? 65 : st.id === "st-3" ? 58 : 46;
      
      const total = mathRaw + engRaw + physRaw + chemRaw + bioRaw;
      const avg = Math.round(total / 5);

      return {
        "Student ID": st.id,
        "Student Name": st.name,
        "Cohort": st.class_name,
        "Mathematics": mathRaw,
        "English Language": engRaw,
        "Physics": physRaw,
        "Chemistry": chemRaw,
        "Biology": bioRaw,
        "Total Aggregate": total,
        "Average (%)": avg,
        "Remark": avg >= (school?.benchmark || 50) ? "PASS / PROMOTED" : "NEEDS IMPROVEMENT"
      };
    });

    dataRows.sort((a, b) => b["Total Aggregate"] - a["Total Aggregate"]);
    const rankedRows = dataRows.map((row, idx) => ({
      "Rank Position": idx + 1,
      ...row
    }));

    const worksheet = XLSX.utils.json_to_sheet(rankedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Broadsheet Matrix");
    XLSX.writeFile(workbook, `Corner_Streams_${classFilter || "SS_2_Science"}_Broadsheet.xlsx`);
    toast.success("Excel Broadsheet Matrix generated and downloaded successfully!");
  };

  // Tab controllers
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (activeTab) {
      if (activeTab === 'uploaded') setTab('cbt');
      else if (activeTab === 'live') setTab('overview');
      else if (activeTab === 'completed') setTab('scores');
      else setTab(activeTab);
    }
  }, [activeTab]);

  // Profile passport editing state
  const [passportDlg, setPassportDlg] = useState(false);
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);

  function _emptyExam() {
    return {
      title: "",
      class_name: "SS 2 Science",
      subject: "Mathematics",
      term: "1st Term",
      year: "2025/2026",
      duration_min: 30,
      questions: [
        { type: "mcq", question: "", options: ["", "", "", ""], correct_idx: 0 }
      ]
    };
  }

  const refresh = async () => {
    try {
      const [stRes, exRes, schRes] = await Promise.all([
        api.get("/students"),
        api.get("/cbt/exams"),
        api.get("/schools/me")
      ]);
      setStudents(stRes.data.students || []);
      setExams(exRes.data.exams || []);
      setSchool(schRes.data.school || null);
    } catch (e: any) {
      toast.error(e.message || "Failed to load classroom registries.");
    }
  };

  const isTabVisible = (tabKey: string) => {
    const tier = school?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (tabKey === "settings" || tabKey === "messages" || tabKey === "overview") return true;

    if (tier === "cbt_essentials") {
      // CBT Starter: CBT Exams active, but Terminal CA Scores, Broadsheet & Bursary are locked
      return tabKey === "cbt" || tabKey === "uploaded" || tabKey === "live";
    }
    if (tier === "cbt_plus_results") {
      // CBT Pro: CBT Exams + Scores/Grading + Broadsheets active, Bursary locked
      return tabKey === "cbt" || tabKey === "scores" || tabKey === "broadsheets" || tabKey === "uploaded" || tabKey === "live" || tabKey === "completed";
    }
    if (tier === "financial_ledger") {
      // Financial Ledger: Bursary active, CBT & Scores locked
      return tabKey === "receipts" || tabKey === "fees";
    }
    if (tier === "digital_reports") {
      // Digital Reports: Scores & Broadsheets active, CBT & Bursary locked
      return tabKey === "scores" || tabKey === "broadsheets" || tabKey === "completed";
    }
    return true;
  };

  useEffect(() => {
    refresh();
  }, []);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name))).sort(), [students]);
  const filtered = useMemo(() => students.filter((s) => !classFilter || s.class_name === classFilter), [students, classFilter]);

  const searchedLearners = useMemo(() => {
    return filtered.filter((s) => {
      if (!studentSearchQuery.trim()) return true;
      const q = studentSearchQuery.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        (s.id && String(s.id).toLowerCase().includes(q)) ||
        s.class_name?.toLowerCase().includes(q)
      );
    });
  }, [filtered, studentSearchQuery]);

  const caWeights = useMemo(() => {
    const w = school?.ca_weights;
    if (Array.isArray(w) && w.length > 0) return w.map((n) => Number(n) || 0);
    return [20, 20];
  }, [school]);
  
  const examMaxCfg = useMemo(() => Number(school?.exam_max ?? 60), [school]);
  const totalMax = useMemo(() => caWeights.reduce((a, b) => a + b, 0) + examMaxCfg, [caWeights, examMaxCfg]);

  const loadStudentScores = async (st: any) => {
    setSelected(st);
    try {
      const { data } = await api.get(`/scores`, { params: { student_id: st.id, term } });
      const sm: any = {};
      
      // Seed academic score maps matching class courses
      const defaultSubjects = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology"];
      defaultSubjects.forEach((subj) => {
        const found = data.scores?.find((s: any) => s.subject === subj);
        sm[subj] = {
          ca_scores: found?.ca_scores || caWeights.map(() => 0),
          exam: found?.exam_score || 0
        };
      });

      const km: any = {};
      SKILLS.forEach((skill) => {
        const found = data.skill_ratings?.find((sr: any) => sr.skill_name === skill);
        km[skill] = found?.rating || 0;
      });

      setScoreMap(sm);
      setSkillMap(km);
    } catch (e) {
      toast.error("Error loading learner dossier.");
    }
  };

  const handleUpdateStudentScoresAndSkills = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const items = Object.keys(scoreMap).map((subj) => {
        const row = scoreMap[subj];
        return {
          student_id: selected.id,
          term,
          year,
          subject: subj,
          ca_scores: row.ca_scores,
          ca_score: row.ca_scores.reduce((a: number, b: number) => a + Number(b), 0),
          exam_score: Number(row.exam || 0)
        };
      });

      await api.post("/scores/batch", { items });
      toast.success(`Dossier for ${selected.name} synchronized successfully!`);
    } catch (err) {
      toast.error("Scoring table commit failed.");
    } finally {
      setSaving(false);
    }
  };

  // CBT Exam composition handlers
  const handleCreateCBTExam = async () => {
    if (!examForm.title.trim()) {
      toast.error("Examination title required.");
      return;
    }
    try {
      await api.post("/cbt/exams", examForm);
      toast.success("CBT Examination uploaded to draft pool!");
      setExamDlg(false);
      refresh();
    } catch (e) {
      toast.error("Failed to compile CBT question packet.");
    }
  };

  const deleteExam = async (id: string) => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    const nextList = examsList.filter((e: any) => e.id !== id);
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(nextList));
    toast.success("Exam deleted.");
    refresh();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      
      {/* Sub-navigation tab headers */}
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-20">
        {(() => {
          const teacherModules = [
            { k: "overview", label: "My Desk", icon: Layers, desc: "Teacher workload overview & class schedules" },
            { k: "assignments", label: "Assignments & Homework Desk", icon: BookOpen, desc: "Create tasks, track submissions & Nonye Socratic AI hints" },
            { k: "scores", label: "Assessment Scoring Grid", icon: CheckSquare, desc: "Enter student CA & exam scores matrix" },
            { k: "attendance", label: "Daily Attendance Register", icon: Calendar, desc: "Daily morning & afternoon roll call registers" },
            { k: "broadsheets", label: "Academic Broadsheet Vault", icon: FileSpreadsheet, desc: "View class broadsheets & performance ranking" },
            { k: "result_dossiers", label: "Student Result Dossiers", icon: BookOpen, desc: "Individual student result histories & dossiers" },
            { k: "cbt", label: "CBT Exam Builder", icon: SlidersHorizontal, desc: "Create & manage CBT questions, exams & sessions" },
            { k: "messages", label: "Messages & Broadcasts", icon: Send, desc: "Internal messaging & broadcasts to students/parents" },
            { k: "receipts", label: "Academic Receipts & Slips", icon: FileText, desc: "Academic slips & administrative receipts" },
            { k: "settings", label: "System Settings", icon: Settings, desc: "Personal settings & password security" }
          ];

          const availableTeacherModules = teacherModules.map(item => ({
            ...item,
            visible: isTabVisible(item.k)
          }));

          const currentTeacherModule = teacherModules.find(m => m.k === tab) || teacherModules[0];
          const CurrentTeacherIcon = currentTeacherModule.icon;

          return (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModuleSelectorOpen(!isModuleSelectorOpen)}
                className="h-9 px-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-sm transition cursor-pointer"
              >
                <div className="p-1 bg-white/20 rounded-lg shrink-0 flex items-center justify-center">
                  <CurrentTeacherIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8.5px] uppercase tracking-wider text-indigo-100 font-medium leading-none">Active Module</span>
                  <span className="font-extrabold text-[12px] leading-tight flex items-center gap-1">
                    {currentTeacherModule.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-emerald-200 transition-transform ml-1 ${isModuleSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {isModuleSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsModuleSelectorOpen(false)} />
                  <div className="absolute left-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Navigation Module</span>
                      <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {teacherModules.length} Modules
                      </span>
                    </div>
                    {availableTeacherModules.map((item) => {
                      const isSelected = tab === item.k;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.k}
                          type="button"
                          onClick={() => {
                            setTab(item.k);
                            setIsModuleSelectorOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-sm font-bold"
                              : "hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200"
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11.5px] font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                                {item.label}
                              </span>
                              {!item.visible && <span className="text-[10px]" title="Feature restricted by current school plan">🔒</span>}
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                            </div>
                            {item.desc && (
                              <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
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
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-mono">
          FACULTY DESK
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
            {/* ---------------- OVERVIEW ---------------- */}
            {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-5 animate-in fade-in duration-200">
            
            {/* Quick stats and class rosters */}
            <div className="md:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { l: "My Classes Only", v: "SS 2 Science", i: GraduationCap, c: "text-indigo-600 bg-indigo-50", show: true },
                  { l: "Registry Count", v: `${students.length} Learners`, i: Users, c: "text-emerald-600 bg-emerald-50", show: true },
                  { l: "Draft CBT Exams", v: `${exams.length} Exams`, i: FileText, c: "text-amber-600 bg-amber-50", show: isTabVisible('cbt') }
                ].filter(item => item.show).map((item, idx) => {
                  const Icon = item.i;
                  return (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="bg-white border rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:shadow-md transition-shadow cursor-default"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.c}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{item.l}</span>
                        <span className="text-sm font-black cs-text-navy block leading-none mt-0.5">{item.v}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* High density quick class rosters */}
              <div className="cs-card p-5 space-y-3">
                <h3 className="font-display font-semibold cs-text-navy text-sm">Target Classroom Registry Roster</h3>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <Table className="min-w-[500px] md:min-w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Student Name</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Biometric Portrait</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((st, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold cs-text-navy">{st.name}</TableCell>
                          <TableCell className="font-mono">{st.class_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                <img src={st.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} alt="" className="w-full h-full object-cover" />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6.5 text-[9px] font-bold"
                                onClick={() => { setSelected(st); setPassportDlg(true); }}
                              >
                                <Camera className="w-3 h-3 mr-1" />
                                Update Portrait
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Quick instructions panel */}
            <div className="space-y-5">
              {/* CBT EXAMINATIONS QUICK LAUNCHER */}
              <div className="cs-card p-5 space-y-4 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold cs-text-navy text-sm">CBT Examinations Suite</h3>
                      <p className="text-[9px] text-slate-400">Manage timed digital assessment papers</p>
                    </div>
                  </div>
                  {!isTabVisible("cbt") ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[8px] font-mono font-bold uppercase py-0.5 px-2">
                      Locked Plan
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[8.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Ready
                    </span>
                  )}
                </div>

                {!isTabVisible("cbt") ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Your current school subscription tier does not permit digital computer-based tests, template downloads, or question batch roster uploads.
                    </p>
                    <Button
                      type="button"
                      onClick={handleSimulatedUpgrade}
                      className="w-full h-8.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold text-xs uppercase shadow-sm hover:opacity-95 active:scale-[0.99] transition"
                    >
                      Unlock CBT & Premium Features Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Build standardized electronic testing rosters or manage timed evaluation papers directly from your central dashboard desk:
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        type="button"
                        onClick={() => { setExamForm(_emptyExam()); setExamDlg(true); }}
                        className="w-full h-9 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xl transition hover:opacity-95 active:scale-[0.99]"
                      >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Create Exam (Manual Builder)
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDownloadTemplate}
                          className="h-8 text-[10px] text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV Template
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setTab("cbt"); }}
                          className="h-8 text-[10px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Upload Questions
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-indigo-950 text-white p-5 rounded-2xl shadow-xl space-y-3 border-indigo-900">
                <div className="flex gap-1.5 items-center">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-black text-xs uppercase tracking-wider">Faculty Portal Scope</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-indigo-200">
                  You are permitted secure write privileges to grade Continuous Assessments and Terminal examinations columns for <strong className="text-white">SS 2 Science</strong> student records. Changes update parent interfaces instantaneously.
                </p>
              </div>

              <div className="cs-card p-5 space-y-3">
                <h3 className="font-display font-semibold cs-text-navy text-sm">Continuous Assess Formulas</h3>
                <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
                  <span className="block p-2 bg-slate-50 rounded border border-slate-200">
                    Current Weight Model: <strong>{caWeights.length} CAs</strong> ({caWeights.join(" + ")} marks) + <strong>Exam</strong> ({examMaxCfg} marks) = Max <strong>{totalMax} marks</strong>.
                  </span>
                  <span className="block">To adjustment the Continuous Assessment columns weight partition model, contact your central Campus School Administrator.</span>
                </div>
              </div>
            </div>

            {/* FACULTY SUBJECT LOAD & BURNOUT RISK HEATMAP */}
            <div className="md:col-span-3 space-y-5">
              <PerformanceTrendsCard 
                grades={grades} 
                userRole="teacher" 
                title="Class Performance Trends & Assessment Score Analytics"
                subtitle="Visualizing student grade distributions and recent exam score averages across active course streams"
              />

              <TeacherWorkloadHeatmap 
                highlightTeacherName={currentProfile?.name || "Mrs. Folasade Adebayo"} 
                isAdminView={false} 
                title="Faculty Workload & Departmental Subject Heatmap"
                subtitle="View your weekly subject allocation and compare load intensity across department instructors to prevent burnout."
              />
            </div>
          </div>
        )}

        {/* ---------------- SCORES PANEL ---------------- */}
        {tab === "scores" && (
          !isTabVisible("scores") ? (
            <UpgradeOverlay 
              title="Assessment Scoring Grid"
              requiredTier="Digital Reports or Unified Enterprise"
              description="continuous assessment matrices, automated terminal scoreboards, report cards with e-signatures, and grade verification registers."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {school?.subscription_tier === "cbt_essentials" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                  <span className="p-1 bg-amber-100 rounded text-amber-700 shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="font-extrabold uppercase tracking-wide text-[10.5px]">CBT Starter Subscription Active</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Your school is on <strong>CBT Starter</strong>. You can manage questions and evaluate student tests online. However, <strong>terminal report cards and result dispatches to parents are withheld</strong>. To publish terminal report sheets, upgrade your license to <strong>CBT Pro</strong>.
                    </p>
                  </div>
                </div>
              )}
            <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Class filters</Label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  <option value="">All Assign Classes...</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label>Assessment Term</Label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <Label>Education Session Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>

            <div className="grid lg:grid-cols-[280px_1fr] gap-5">
              
              {/* Classroom Roster Select */}
              <div className="cs-card p-3 max-h-[500px] overflow-y-auto space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Learners Registry ({searchedLearners.length})</span>
                  {studentSearchQuery && (
                    <button onClick={() => setStudentSearchQuery("")} className="text-[9.5px] text-rose-600 font-bold hover:underline">
                      Reset
                    </button>
                  )}
                </div>

                <div className="relative my-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Filter profiles by name or ID..."
                    className="pl-8 pr-7 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                  />
                  {studentSearchQuery && (
                    <button onClick={() => setStudentSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {searchedLearners.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => loadStudentScores(st)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-slate-50 transition ${selected?.id === st.id ? "bg-indigo-50 font-bold" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold cs-text-navy block truncate">{st.name}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded shrink-0">#{st.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{st.class_name}</span>
                    </button>
                  ))}
                  {searchedLearners.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No student profiles match "{studentSearchQuery}".</p>
                  )}
                </div>
              </div>

              {/* Scoring grid */}
              <div className="cs-card p-5 space-y-5">
                {!selected ? (
                  <div className="space-y-6">
                    <div className="text-center py-5 px-4 text-slate-500 text-xs font-semibold bg-indigo-50/50 border border-dashed rounded-xl border-indigo-150">
                      ⚡ Select a learner from the registry list to edit their Continuous Assessment marks.
                    </div>
                    <PerformanceTrendsCard grades={grades} userRole="teacher" />
                    <GradeDistributionChart grades={grades} />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-display font-bold text-base cs-text-navy">{selected.name}</h3>
                        <p className="text-[10px] text-slate-400">Academic scoring grid · {term} · {year}</p>
                      </div>

                      <Button variant="emerald" onClick={handleUpdateStudentScoresAndSkills} disabled={saving} className="h-8 shadow-sm">
                        <Save className="w-3.5 h-3.5 mr-1" />
                        {saving ? "Saving marks..." : "Commit Scoring Marks"}
                      </Button>
                    </div>

                    <Tabs defaultValue="academic">
                      <TabsList className="mb-3">
                        <TabsTrigger value="academic">Academic Marks Row</TabsTrigger>
                        <TabsTrigger value="skills">Skills & Behaviors</TabsTrigger>
                      </TabsList>

                      <TabsContent value="academic" className="space-y-4">
                        <div className="border border-slate-150 rounded-xl overflow-x-auto">
                          <Table className="min-w-[600px] md:min-w-full">
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead>Course Subject</TableHead>
                                {caWeights.map((w, i) => (
                                  <TableHead key={i}>CA {i + 1} (max {w})</TableHead>
                                ))}
                                <TableHead>Terminal Exam (max {examMaxCfg})</TableHead>
                                <TableHead className="text-right">Aggregate Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(scoreMap).map((subjKey) => {
                                const row = scoreMap[subjKey];
                                const totalScore = row.ca_scores.reduce((a: number, b: number) => a + Number(b), 0) + Number(row.exam);
                                return (
                                  <TableRow key={subjKey}>
                                    <TableCell className="font-bold cs-text-navy">{subjKey}</TableCell>
                                    {caWeights.map((w, i) => (
                                      <TableCell key={i}>
                                        <Input
                                          type="number"
                                          className="w-16 h-8 text-center"
                                          min={0}
                                          max={w}
                                          value={row.ca_scores[i]}
                                          onChange={(e) => {
                                            const nextScores = [...row.ca_scores];
                                            nextScores[i] = Number(e.target.value);
                                            setScoreMap({ ...scoreMap, [subjKey]: { ...row, ca_scores: nextScores } });
                                          }}
                                        />
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Input
                                        type="number"
                                        className="w-20 h-8 text-center"
                                        min={0}
                                        max={examMaxCfg}
                                        value={row.exam}
                                        onChange={(e) => setScoreMap({ ...scoreMap, [subjKey]: { ...row, exam: Number(e.target.value) } })}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right font-black font-mono cs-text-navy text-sm">
                                      {totalScore}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      <TabsContent value="skills" className="grid grid-cols-2 gap-4">
                        {SKILLS.map((skill) => (
                          <div key={skill} className="border border-slate-200 bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                            <span className="font-semibold cs-text-navy">{skill}</span>
                            <StarRating 
                              rating={skillMap[skill] || 0} 
                              onRatingChange={(v: number) => setSkillMap({ ...skillMap, [skill]: v })}
                            />
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>

            {/* Comprehensive Broadsheet Export Matrix and Classroom Ranker */}
            <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black cs-text-navy text-sm uppercase">Classroom Broadsheet Export Matrix & Ranker</h4>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Syllabus: {classFilter || "All Active Classes"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Aggregates CA averages, terminal examination marks, computes positional ranks, and compiles remarks dynamically.</p>
                </div>

                <Button 
                  type="button" 
                  onClick={handleExportBroadsheetExcel}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] h-9 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Broadsheet Spreadsheet (Excel)
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-[800px] md:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider">
                      <TableHead className="w-12 text-center">Rank Position</TableHead>
                      <TableHead>Learner Candidate</TableHead>
                      <TableHead className="text-center">Mathematics</TableHead>
                      <TableHead className="text-center">English Language</TableHead>
                      <TableHead className="text-center">Physics</TableHead>
                      <TableHead className="text-center">Chemistry</TableHead>
                      <TableHead className="text-center">Biology</TableHead>
                      <TableHead className="text-center">Total Agg.</TableHead>
                      <TableHead className="text-center">Average (%)</TableHead>
                      <TableHead className="text-right">Verdict Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students
                      .map((st) => {
                        const mathRaw = st.id === "st-1" ? 77 : st.id === "st-2" ? 64 : st.id === "st-3" ? 55 : 48;
                        const engRaw = st.id === "st-1" ? 82 : st.id === "st-2" ? 58 : st.id === "st-3" ? 61 : 45;
                        const physRaw = st.id === "st-1" ? 79 : st.id === "st-2" ? 62 : st.id === "st-3" ? 50 : 49;
                        const chemRaw = st.id === "st-1" ? 85 : st.id === "st-2" ? 60 : st.id === "st-3" ? 52 : 44;
                        const bioRaw = st.id === "st-1" ? 90 : st.id === "st-2" ? 65 : st.id === "st-3" ? 58 : 46;
                        const total = mathRaw + engRaw + physRaw + chemRaw + bioRaw;
                        const avg = Math.round(total / 5);
                        return { ...st, mathRaw, engRaw, physRaw, chemRaw, bioRaw, total, avg };
                      })
                      .sort((a, b) => b.total - a.total)
                      .map((st, sidx) => (
                        <TableRow key={st.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-center">
                            <Badge className={`rounded-full font-mono font-bold w-6 h-6 flex items-center justify-center p-0 mx-auto ${sidx === 0 ? "bg-amber-500 text-white animate-bounce" : sidx === 1 ? "bg-slate-400 text-white" : sidx === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {sidx + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold cs-text-navy">
                            {st.name}
                            <span className="text-[9px] text-slate-400 block font-normal font-mono">{st.id} · {st.class_name}</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.mathRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.engRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.physRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.chemRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.bioRaw}</TableCell>
                          <TableCell className="text-center font-black font-mono text-[#005cb9] bg-[#005cb9]/5">{st.total}</TableCell>
                          <TableCell className="text-center">
                            <strong className="font-mono text-indigo-950">{st.avg}%</strong>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            <span className={`text-[10px] uppercase ${st.avg >= (school?.benchmark || 50) ? "text-emerald-600" : "text-rose-500"}`}>
                              {st.avg >= (school?.benchmark || 50) ? "Pass / Promoted" : "Needs Improvement"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                          Registry is empty. Compile continuous assessments first.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          )
        )}

        {/* ---------------- DAILY ATTENDANCE REGISTER ---------------- */}
        {tab === "attendance" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <DailyAttendanceRegister
              currentProfile={currentProfile}
              activeSession="2025/2026"
              activeTerm="1st Term"
            />
          </div>
        )}

        {/* ---------------- BROADSHEETS ---------------- */}
        {tab === "broadsheets" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AcademicBroadsheetVault
              studentsList={students}
              currentProfile={currentProfile}
            />
          </div>
        )}

        {/* ---------------- RESULT DOSSIERS ---------------- */}
        {tab === "result_dossiers" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <StudentResultDossier
              studentsList={students.map((s: any) => ({
                id: s.id,
                name: s.name,
                reg: s.reg || `CS/2025/${s.id}`,
                class: s.class_name || "SS 2 Gold"
              }))}
              currentProfile={currentProfile}
              activeSession={year || "2025/2026"}
              activeTerm={term || "1st Term"}
            />
          </div>
        )}

        {/* ---------------- CBT PANEL ---------------- */}
        {tab === "cbt" && (
          !isTabVisible("cbt") ? (
            <UpgradeOverlay 
              title="CBT Exam Builder & Manager"
              requiredTier="CBT Essentials or Unified Enterprise"
              description="live digital multi-choice examinations, timed answer sheets, automatic grading, and instant performance breakdowns."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* LEFT COLUMN: Draft CBT Exams Matrix & Proctoring (7/12) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white border rounded-2xl p-4.5 shadow-sm space-y-4 text-left">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <div>
                        <h3 className="font-display font-semibold cs-text-navy text-sm">CBT Examinations Registry (Uploaded Exams)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Author computer-based tests, publish parameters or delete items.</p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <Button 
                          variant="outline" 
                          onClick={handleDownloadTemplate} 
                          className="gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-8 text-[10.5px] cursor-pointer"
                          title="Downloads CSV with headers: S/n, question, option a, option b, option c, option d, attached image, correct answer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download CSV Template
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { setExamForm(_emptyExam()); setExamDlg(true); }} 
                          className="gap-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white font-black h-8.5 px-4.5 rounded-lg shadow-md text-xs flex items-center justify-center transition active:scale-[0.98] cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          Create Exam
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="bg-slate-50/75">
                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase">Subject & Testing Paper</TableHead>
                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase">Class Target</TableHead>
                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase text-center">Duration</TableHead>
                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase">Status & Authority</TableHead>
                            <TableHead className="text-right text-[9px] font-bold text-slate-400 uppercase">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exams.map((ex, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/30 transition">
                              <TableCell className="text-left py-2.5">
                                <div className="font-extrabold cs-text-navy text-xs uppercase leading-tight">{ex.title}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase">
                                  {ex.subject} · {ex.term || "1st Term"} · {ex.questions?.length || ex.question_count || 0} Queries
                                </div>
                              </TableCell>
                              <TableCell className="font-mono font-bold text-[10px] text-slate-600 text-left py-2.5">
                                {ex.class_name}
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-[10px] text-slate-500 text-center py-2.5">
                                {ex.duration_min || ex.durationMinutes || 30}m
                              </TableCell>
                              <TableCell className="text-left py-2.5">
                                {(() => {
                                  const statusVal = ex.status || "published";
                                  if (statusVal === "pending_review") {
                                    return (
                                      <div className="space-y-0.5">
                                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded">
                                          Pending Audit
                                        </Badge>
                                        <span className="block text-[7.5px] text-slate-400 font-mono">HOD / Admin Review</span>
                                      </div>
                                    );
                                  }
                                  if (statusVal === "published") {
                                    return (
                                      <div className="space-y-0.5">
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded">
                                          Active Published
                                        </Badge>
                                        <span className="block text-[7.5px] text-emerald-600 font-mono">Live to Students</span>
                                      </div>
                                    );
                                  }
                                  if (statusVal === "scheduled") {
                                    return (
                                      <div className="space-y-0.5">
                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.25 rounded">
                                          Scheduled
                                        </Badge>
                                        <span className="block text-[7.5px] text-blue-600 font-mono truncate max-w-[120px]">
                                          {ex.publish_time ? new Date(ex.publish_time).toLocaleDateString() : "Pending time"}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <Badge className="bg-slate-400 text-white text-[8px] font-bold uppercase px-1.5 py-0.25 rounded">
                                      Draft Mode
                                    </Badge>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-right py-2.5">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6.5 w-6.5 p-0 text-rose-600 hover:bg-rose-50 border-rose-200/60"
                                  onClick={() => deleteExam(ex.id)}
                                >
                                  <Trash className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {exams.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 space-y-3.5">
                                <div className="text-slate-400 font-medium">
                                  No assessment packets created yet. Use the manual builder or drop an Excel/CSV sheet!
                                </div>
                                <div className="flex flex-wrap justify-center gap-3.5 pt-1.5">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={handleDownloadTemplate} 
                                    className="gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-8 text-[10px] font-bold cursor-pointer"
                                    title="CSV Headers: S/n, question, option a, option b, option c, option d, attached image, correct answer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Download CBT CSV Template
                                  </Button>
                                  <Button 
                                    type="button" 
                                    onClick={() => { setExamForm(_emptyExam()); setExamDlg(true); }} 
                                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-[10px] font-bold flex items-center justify-center rounded-lg px-3.5 transition active:scale-[0.98] cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                    Create Exam Manually
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Excel / CSV Question Sheet Ingession Console (5/12) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 text-left border-indigo-200/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-700">
                        <FileSpreadsheet className="w-4.5 h-4.5" />
                        <h3 className="font-display font-semibold cs-text-navy text-sm uppercase tracking-tight">Excel Roster Ingession</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Publish structured evaluation questions en-masse. Instantly audit parameters before committing to HOD/Admin review queue.
                      </p>
                    </div>

                    {/* Template Schema Card */}
                    <div className="bg-indigo-50/40 border border-indigo-150 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8.5px] font-mono font-black text-indigo-950 uppercase tracking-wider">Required Column Headers</span>
                        <button 
                          onClick={handleDownloadTemplate}
                          className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-700 hover:text-indigo-900 transition"
                        >
                          <Download className="w-3 h-3" />
                          Download Template (.csv)
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono text-indigo-800 leading-tight">
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">S/n</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">question</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">option a</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">option b</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">option c</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">option d</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">attached image</div>
                        <div className="bg-white/60 p-1 rounded border border-indigo-100/40">correct answer</div>
                      </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("excel-file-picker")?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        isDragging 
                          ? "border-emerald-500 bg-emerald-50/20" 
                          : excelFilename 
                            ? "border-indigo-400 bg-indigo-50/10" 
                            : "border-slate-300 hover:border-indigo-500/50 hover:bg-slate-50/40"
                      }`}
                    >
                      <input 
                        id="excel-file-picker" 
                        type="file" 
                        accept=".csv, .txt" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                      
                      <UploadCloud className={`w-8 h-8 mb-2 ${excelFilename ? "text-indigo-600" : "text-slate-400"}`} />
                      
                      {excelFilename ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{excelFilename}</p>
                          <p className="text-[9px] text-indigo-600 font-mono">Click or drag again to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600">Drag & Drop Excel Question sheet here</p>
                          <p className="text-[9px] text-slate-400">or click to browse local files (.csv)</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Template Trigger */}
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 block mb-1.5">Need a reference template?</span>
                      <Button
                        type="button"
                        onClick={handleSeedExcelMock}
                        className="h-7 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse mr-1" />
                        Load Sample CSV / Excel Format
                      </Button>
                    </div>

                    {/* Live spreadsheet preview container */}
                    {uploadedQuestions.length > 0 && (
                      <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-3 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-[9.5px] font-mono font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                            Spreadsheet Preview ({uploadedQuestions.length} Rows)
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Duplicate scanning toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !highlightDuplicates;
                                setHighlightDuplicates(nextState);
                                if (nextState) {
                                  if (duplicateGroups.length > 0) {
                                    toast.success(`Duplicate Scan Complete! Detected ${duplicateGroups.length} group(s) of identical question statements.`);
                                  } else {
                                    toast.info("No duplicate question text found in the current spreadsheet.");
                                  }
                                }
                              }}
                              className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shadow-xs border ${
                                highlightDuplicates
                                  ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-150"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80"
                              }`}
                              title="Scan spreadsheet and highlight rows with duplicate question statements"
                            >
                              <Copy className="w-3 h-3 text-indigo-600" />
                              <span>Check Duplicates</span>
                              {duplicateGroups.length > 0 && (
                                <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[8px] ml-0.5 font-bold">
                                  {duplicateGroups.length}
                                </span>
                              )}
                            </button>

                            {/* Shuffle Preview toggle */}
                            <button
                              type="button"
                              onClick={handleShuffleToggle}
                              className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shadow-xs border ${
                                isShuffleActive
                                  ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-150"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80"
                              }`}
                              title="Demonstrate how questions are randomized in the actual CBT engine"
                            >
                              <Shuffle className={`w-3 h-3 ${isShuffleActive ? "animate-spin text-purple-600" : "text-indigo-600"}`} />
                              <span>Shuffle Preview</span>
                              {isShuffleActive && (
                                <span className="bg-purple-500 text-white rounded-full px-1.5 py-0.2 text-[8px] ml-0.5 font-bold">
                                  ON
                                </span>
                              )}
                            </button>

                            {selectedRowIndices.length > 0 && (
                              <button
                                type="button"
                                onClick={handleBulkDeleteQuestions}
                                className="text-[9.5px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shadow-xs animate-in zoom-in duration-150"
                              >
                                <Trash className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                Delete Selected ({selectedRowIndices.length})
                              </button>
                            )}
                            <button 
                              type="button"
                              onClick={() => { setUploadedQuestions([]); setExcelFilename(""); setQSearchQuery(""); setSelectedRowIndices([]); setHighlightDuplicates(false); setIsShuffleActive(false); }}
                              className="text-[9px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Clear Sheet
                            </button>
                          </div>
                        </div>

                        {/* Validation Progress Bar */}
                        <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2 shadow-xs">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <span>Validation Health Index:</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-extrabold border ${
                                validationPercentage === 100 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : validationPercentage >= 70 
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {validationPercentage}% Verified
                              </span>
                            </div>
                            <div className="text-slate-500 font-bold">
                              {validQuestionsCount} of {uploadedQuestions.length} rows fully configured
                            </div>
                          </div>
                          
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${validationPercentage}%` }}
                              transition={{ duration: 0.45, ease: "easeOut" }}
                              className={`h-full rounded-full transition-colors duration-300 ${
                                validationPercentage === 100 
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                                  : validationPercentage >= 70 
                                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600" 
                                  : "bg-gradient-to-r from-rose-500 to-amber-500"
                              }`}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px]">
                            {validationPercentage === 100 ? (
                              <p className="text-emerald-600 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> All assessment rows perfectly set up. Ready to upload!
                              </p>
                            ) : (
                              <p className="text-slate-500 font-medium">
                                Fill in all questions, options, and answer keys to reach 100% validation.
                              </p>
                            )}
                            <span className="text-slate-400 font-mono text-[8.5px]">
                              {validationErrorCount > 0 ? `${validationErrorCount} error row(s) remaining` : "0 issues detected"}
                            </span>
                          </div>
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={qSearchQuery}
                            onChange={(e) => setQSearchQuery(e.target.value)}
                            placeholder="Search & filter questions by text keywords..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder-slate-400 transition"
                          />
                          {qSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setQSearchQuery("")}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-indigo-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* Duplicate Alert Banner */}
                        {highlightDuplicates && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-950 text-[10.5px] p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2 duration-200 text-left">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                                  Duplicate Question Scanner
                                  <span className="bg-amber-200 text-amber-800 text-[8.5px] font-mono px-1.5 py-0.2 rounded-md font-bold">
                                    {duplicateGroups.length} Group(s) Found
                                  </span>
                                </p>
                                {duplicateGroups.length > 0 ? (
                                  <p className="text-[9.5px] text-amber-800 font-medium leading-normal">
                                    Identical question texts found across <span className="font-extrabold">{duplicateIndices.size} rows</span>. These rows are highlighted in amber below. Review them or click "Auto-Merge" to keep the first occurrence of each question statement and discard copies.
                                  </p>
                                ) : (
                                  <p className="text-[9.5px] text-amber-800 font-medium leading-normal">
                                    All question text values in the sheet are unique! No duplicates detected.
                                  </p>
                                )}
                              </div>
                            </div>
                            {duplicateGroups.length > 0 && (
                              <button
                                type="button"
                                onClick={handleAutoMergeDuplicates}
                                className="text-[9px] font-black text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition shrink-0 uppercase tracking-wider"
                              >
                                Auto-Merge Duplicates
                              </button>
                            )}
                          </div>
                        )}

                        {/* Validation warning banner */}
                        {validationErrorCount > 0 && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] p-2.5 rounded-xl flex items-start gap-2.5 shadow-sm animate-pulse">
                            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold">Mandatory Fields Missing or Unconfigured!</p>
                              <p className="text-[9.5px] text-rose-700/90 leading-normal font-medium">
                                {validationErrorCount} question row(s) are highlighted in soft red due to missing or placeholder values in question text, options, or correct answers. Please edit these rows inline to fix them before submitting to Admin review.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Miniature Spreadsheet Table */}
                        {isShuffleActive ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-300 text-left">
                            {/* LEFT PANEL: Original Sheet Sequence */}
                            <div className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col space-y-3 shadow-sm">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono text-[9px] font-bold">1</span>
                                  Original Sheet Sequence
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold font-mono">
                                  {filteredQuestions.length} Match(es) (Sequential)
                                </span>
                              </div>

                              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {filteredQuestions.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 font-medium text-[11px]">
                                    No questions match your current search criteria.
                                  </div>
                                ) : (
                                  filteredQuestions.map((q) => {
                                    const qidx = q.originalIdx;
                                    const qErrors = getQuestionValidationErrors(q);
                                    const hasErrors = qErrors.length > 0;
                                    return (
                                      <div 
                                        key={qidx} 
                                        className={`p-3 rounded-lg border text-xs transition relative group ${
                                          hasErrors 
                                            ? "bg-rose-50/20 border-rose-200 hover:bg-rose-50/30" 
                                            : "bg-slate-50/50 border-slate-150 hover:bg-slate-50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="font-mono text-[9.5px] font-black text-indigo-600">
                                            Sheet Row #{qidx + 1}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            {hasErrors && (
                                              <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-bold py-0.2 px-1">
                                                Incomplete
                                              </Badge>
                                            )}
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              onClick={() => setPreviewQuestion(q)}
                                              className="h-5 w-5 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                              title="Quick Preview"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <p 
                                          onClick={() => setPreviewQuestion(q)}
                                          className="font-bold text-slate-800 leading-normal text-[10.5px] hover:text-indigo-600 cursor-pointer transition-colors"
                                        >
                                          {q.question || <span className="italic text-rose-450 font-normal">Empty statement</span>}
                                        </p>
                                        <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-100/60 pt-1.5">
                                          Key: <span className="font-bold text-slate-700">{["A", "B", "C", "D"][q.correct_idx] || "None"}</span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* RIGHT PANEL: CBT Randomized Order */}
                            <div className="border border-purple-200 rounded-xl bg-purple-50/15 p-4 flex flex-col space-y-3 shadow-sm">
                              <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                                <span className="text-[10px] font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                                  <Shuffle className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                  CBT Randomizer Order
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleReshuffle}
                                    className="text-[9px] font-black text-purple-700 hover:text-purple-900 bg-white border border-purple-200 px-2 py-0.8 rounded hover:bg-purple-50 cursor-pointer shadow-2xs transition"
                                    title="Regenerate a brand new random distribution seed"
                                  >
                                    Reshuffle Seed
                                  </button>
                                  <span className="text-[9px] text-purple-500 font-bold font-mono">
                                    Randomized
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {(() => {
                                  const filteredSet = new Set(filteredQuestions.map(q => q.originalIdx));
                                  const filteredShuffled = shuffledIndices.filter(idx => filteredSet.has(idx));
                                  
                                  if (filteredShuffled.length === 0) {
                                    return (
                                      <div className="p-8 text-center text-slate-400 font-medium text-[11px]">
                                        No questions match your current search criteria.
                                      </div>
                                    );
                                  }

                                  return filteredShuffled.map((origIdx, cbtIdx) => {
                                    const q = uploadedQuestions[origIdx];
                                    if (!q) return null;
                                    const qErrors = getQuestionValidationErrors(q);
                                    const hasErrors = qErrors.length > 0;
                                    return (
                                      <motion.div 
                                        layout
                                        key={origIdx}
                                        className={`p-3 rounded-lg border text-xs bg-white transition relative shadow-2xs ${
                                          hasErrors 
                                            ? "border-rose-200 hover:border-rose-300" 
                                            : "border-purple-150 hover:border-purple-300"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[9.5px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                                              CBT Item #{cbtIdx + 1}
                                            </span>
                                            <span className="font-mono text-[8.5px] text-slate-400 font-bold">
                                              (From Row {origIdx + 1})
                                            </span>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setPreviewQuestion({ ...q, originalIdx: origIdx })}
                                            className="h-5 w-5 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                            title="Quick Preview"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <p 
                                          onClick={() => setPreviewQuestion({ ...q, originalIdx: origIdx })}
                                          className="font-bold text-slate-800 leading-normal text-[10.5px] hover:text-purple-600 cursor-pointer transition-colors"
                                        >
                                          {q.question || <span className="italic text-rose-450 font-normal">Empty statement</span>}
                                        </p>
                                        
                                        {/* Multi choice options preview */}
                                        <div className="mt-2 space-y-1 pl-1">
                                          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                                            {["A", "B", "C", "D"].map((label, optIdx) => {
                                              const isCorrect = q.correct_idx === optIdx;
                                              return (
                                                <div 
                                                  key={optIdx}
                                                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                                                    isCorrect 
                                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold" 
                                                      : "bg-slate-50 text-slate-500 border-slate-100"
                                                  }`}
                                                >
                                                  <span className="font-black text-[8px] uppercase">{label}:</span>
                                                  <span className="truncate max-w-[90px]" title={q.options?.[optIdx] || ""}>
                                                    {q.options?.[optIdx] || "N/A"}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl bg-white text-[10px] text-left overflow-hidden shadow-sm">
                          <div className="max-h-[320px] overflow-y-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 font-bold sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                  <th className="p-2 border-r border-slate-200 text-center w-[30px]">
                                    <input 
                                      type="checkbox"
                                      checked={filteredQuestions.length > 0 && filteredQuestions.every((q) => selectedRowIndices.includes(q.originalIdx))}
                                      onChange={() => handleToggleSelectAll(filteredQuestions)}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                                      title="Select / Deselect all visible rows"
                                    />
                                  </th>
                                  <th className="p-2 border-r border-slate-200 text-center w-[105px]">Actions</th>
                                  <th className="p-2 border-r border-slate-200 text-center w-[35px]">S/N</th>
                                  <th className="p-2 border-r border-slate-200">Question Text</th>
                                  <th className="p-2 border-r border-slate-200">Options (A-D)</th>
                                  <th className="p-2 border-r border-slate-200 text-center w-[50px]">Key</th>
                                  <th className="p-2 text-center w-[120px]">Image URL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {filteredQuestions.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                      {qSearchQuery.trim() ? (
                                        <span>No questions match "{qSearchQuery}" keyword search.</span>
                                      ) : (
                                        <span>No questions found in this sheet.</span>
                                      )}
                                    </td>
                                  </tr>
                                ) : (
                                  <AnimatePresence initial={false}>
                                    {filteredQuestions.map((q, fidx) => {
                                      const qidx = q.originalIdx;
                                      const isEditing = editingIdx === qidx;
                                      const qErrors = getQuestionValidationErrors(q);
                                      const hasErrors = qErrors.length > 0;
                                    return (
                                      <motion.tr 
                                        key={qidx} 
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -15 }}
                                        transition={{ 
                                          duration: 0.25, 
                                          ease: "easeOut", 
                                          delay: Math.min(fidx * 0.02, 0.25) 
                                        }}
                                        className={`hover:bg-slate-50/50 transition ${isEditing ? "bg-indigo-50/25" : ""} ${
                                          highlightDuplicates && duplicateIndices.has(qidx)
                                            ? "bg-amber-50/30 border-l-4 border-l-amber-500 hover:bg-amber-100/30"
                                            : hasErrors 
                                            ? "bg-rose-50/20 border-l-4 border-l-rose-500 hover:bg-rose-50/30" 
                                            : ""
                                        }`}
                                      >
                                      {/* Batch Selection Checkbox */}
                                      <td className="p-2 border-r border-slate-200 text-center align-middle">
                                        <input 
                                          type="checkbox"
                                          checked={selectedRowIndices.includes(qidx)}
                                          onChange={() => handleToggleSelectRow(qidx)}
                                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                                        />
                                      </td>

                                      {/* Actions */}
                                      <td className="p-2 border-r border-slate-200 text-center align-middle">
                                        {isEditing ? (
                                          <div className="flex items-center gap-1 justify-center">
                                            <Button
                                              type="button"
                                              onClick={() => handleSaveQuestionEdit(qidx)}
                                              className="h-6 w-6 p-0 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md shadow-sm"
                                              title="Save Changes"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={handleCancelQuestionEdit}
                                              className="h-6 w-6 p-0 text-slate-500 border-slate-200 hover:bg-slate-100 rounded-md shadow-sm"
                                              title="Cancel Edit"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 justify-center">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => setPreviewQuestion(q)}
                                              className="h-6 w-6 p-0 text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-md animate-in fade-in duration-200"
                                              title="Preview Question Modal"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => handleStartEditQuestion(qidx, q)}
                                              className="h-6 w-6 p-0 text-indigo-600 border-indigo-100 hover:bg-indigo-50 rounded-md"
                                              title="Edit Question"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => handleDeleteUploadedQuestion(qidx)}
                                              className="h-6 w-6 p-0 text-rose-600 border-rose-100 hover:bg-rose-50 rounded-md"
                                              title="Delete Question"
                                            >
                                              <Trash className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </td>

                                      {/* S/N */}
                                      <td className={`p-2 border-r border-slate-200 text-center font-mono font-bold align-middle ${hasErrors ? "text-rose-600 bg-rose-50/20" : "text-slate-400"}`}>
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <span>{qidx + 1}</span>
                                          {hasErrors && (
                                            <span 
                                              className="inline-flex items-center justify-center text-rose-600 hover:text-rose-700 animate-bounce cursor-help" 
                                              title={`Errors:\n${qErrors.map(e => `• ${e}`).join("\n")}`}
                                            >
                                              <AlertCircle className="w-3.5 h-3.5" />
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Question Text */}
                                      <td className="p-2 border-r border-slate-200 align-middle">
                                        {isEditing ? (
                                          <textarea
                                            value={editQuestionText}
                                            onChange={(e) => setEditQuestionText(e.target.value)}
                                            className="w-full text-[10px] p-1 border border-slate-300 rounded font-bold text-slate-700 focus:outline-none focus:border-indigo-500 bg-white"
                                            rows={2}
                                            placeholder="Type your multiple choice question here..."
                                          />
                                        ) : (
                                          <div className="space-y-1 text-left">
                                            <div 
                                              onClick={() => setPreviewQuestion(q)}
                                              className="font-bold text-slate-800 leading-normal hover:text-indigo-600 hover:underline cursor-pointer transition-colors duration-150"
                                              title="Click to preview full question statement and assets"
                                            >
                                              {q.question}
                                            </div>
                                            {highlightDuplicates && duplicateIndices.has(qidx) && (
                                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[8.5px] font-bold uppercase tracking-wider shadow-2xs">
                                                <Copy className="w-2.5 h-2.5 text-amber-600" /> Duplicate Question
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* Multiple Choice Options */}
                                      <td className="p-2 border-r border-slate-200 align-middle">
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                              <span className="font-mono text-[8px] font-bold text-slate-400 w-3">A:</span>
                                              <input
                                                type="text"
                                                value={editOptA}
                                                onChange={(e) => setEditOptA(e.target.value)}
                                                className="w-full text-[9px] p-0.5 px-1 border border-slate-200 rounded focus:outline-none bg-white font-mono"
                                                placeholder="Option A text"
                                              />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="font-mono text-[8px] font-bold text-slate-400 w-3">B:</span>
                                              <input
                                                type="text"
                                                value={editOptB}
                                                onChange={(e) => setEditOptB(e.target.value)}
                                                className="w-full text-[9px] p-0.5 px-1 border border-slate-200 rounded focus:outline-none bg-white font-mono"
                                                placeholder="Option B text"
                                              />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="font-mono text-[8px] font-bold text-slate-400 w-3">C:</span>
                                              <input
                                                type="text"
                                                value={editOptC}
                                                onChange={(e) => setEditOptC(e.target.value)}
                                                className="w-full text-[9px] p-0.5 px-1 border border-slate-200 rounded focus:outline-none bg-white font-mono"
                                                placeholder="Option C text"
                                              />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="font-mono text-[8px] font-bold text-slate-400 w-3">D:</span>
                                              <input
                                                type="text"
                                                value={editOptD}
                                                onChange={(e) => setEditOptD(e.target.value)}
                                                className="w-full text-[9px] p-0.5 px-1 border border-slate-200 rounded focus:outline-none bg-white font-mono"
                                                placeholder="Option D text"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono text-slate-500">
                                            <div className={`truncate max-w-[140px] ${q.correct_idx === 0 ? "text-emerald-600 font-bold" : ""}`}>
                                              A: {q.options?.[0]}
                                            </div>
                                            <div className={`truncate max-w-[140px] ${q.correct_idx === 1 ? "text-emerald-600 font-bold" : ""}`}>
                                              B: {q.options?.[1]}
                                            </div>
                                            <div className={`truncate max-w-[140px] ${q.correct_idx === 2 ? "text-emerald-600 font-bold" : ""}`}>
                                              C: {q.options?.[2]}
                                            </div>
                                            <div className={`truncate max-w-[140px] ${q.correct_idx === 3 ? "text-emerald-600 font-bold" : ""}`}>
                                              D: {q.options?.[3]}
                                            </div>
                                          </div>
                                        )}
                                      </td>

                                      {/* Correct Key */}
                                      <td className="p-2 border-r border-slate-200 text-center align-middle">
                                        {isEditing ? (
                                          <select
                                            value={editCorrectIdx}
                                            onChange={(e) => setEditCorrectIdx(Number(e.target.value))}
                                            className="p-1 text-[10px] font-bold border border-slate-300 rounded bg-white text-emerald-600 focus:outline-none font-mono"
                                          >
                                            <option value={0}>A</option>
                                            <option value={1}>B</option>
                                            <option value={2}>C</option>
                                            <option value={3}>D</option>
                                          </select>
                                        ) : (
                                          <Badge className="bg-emerald-150 border-emerald-300 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded">
                                            {["A", "B", "C", "D"][q.correct_idx]}
                                          </Badge>
                                        )}
                                      </td>

                                      {/* Image Attachment */}
                                      <td className="p-2 align-middle">
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <input
                                              type="text"
                                              value={editDiagramUrl}
                                              onChange={(e) => setEditDiagramUrl(e.target.value)}
                                              placeholder="Paste image URL..."
                                              className="w-full text-[8.5px] p-0.5 px-1 border border-slate-200 rounded focus:outline-none bg-white font-mono"
                                            />
                                            {editDiagramUrl && (
                                              <img 
                                                src={editDiagramUrl} 
                                                className="w-8 h-8 object-cover rounded mx-auto border" 
                                                alt="Preview" 
                                                referrerPolicy="no-referrer" 
                                              />
                                            )}
                                          </div>
                                        ) : q.diagramUrl ? (
                                          <div className="flex flex-col items-center gap-1">
                                            <img 
                                              src={q.diagramUrl} 
                                              className="w-8 h-8 object-cover rounded border border-slate-200 shadow-sm" 
                                              alt="Diagram preview" 
                                              referrerPolicy="no-referrer" 
                                            />
                                            <span className="text-[7.5px] text-slate-400 font-mono truncate max-w-[80px]">
                                              {q.diagramUrl.split("/").pop() || "Image"}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-[8px] text-slate-300 block text-center">-</span>
                                        )}
                                      </td>
                                    </motion.tr>
                                  );
                                  })}
                                </AnimatePresence>
                              )}
                            </tbody>
                            </table>
                          </div>
                          
                          {/* Footer action to append row manually */}
                          <div className="flex justify-between items-center bg-slate-50 p-2 px-3 border-t border-slate-200">
                            <span className="text-[8.5px] text-slate-400 font-mono font-bold">
                              💡 Tip: Click Edit icon to change questions or keys inline prior to submission.
                            </span>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={handleAddBlankQuestion}
                              className="h-6.5 text-[9.5px] text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold font-display uppercase tracking-wider"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Custom Question Row
                            </Button>
                          </div>
                        </div>
                        )}

                        {/* Metadata config form */}
                        <div className="space-y-2.5 pt-1 text-xs">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Exam Testing Paper Title</Label>
                            <Input 
                              value={excelTitle} 
                              onChange={(e) => setExcelTitle(e.target.value)} 
                              placeholder="e.g. Physics SS 2 Midterm Test" 
                              className="h-8.5 bg-white text-xs border-slate-300 font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-500">Course Course</Label>
                              <Input 
                                value={excelSubject} 
                                onChange={(e) => setExcelSubject(e.target.value)} 
                                placeholder="e.g. Science" 
                                className="h-8.5 bg-white text-xs border-slate-300 font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-500">Target Cohort</Label>
                              <select
                                value={excelClass}
                                onChange={(e) => setExcelClass(e.target.value)}
                                className="w-full h-8.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold focus-visible:outline-none"
                              >
                                <option value="SS 2 Science">SS 2 Science</option>
                                <option value="SS 3 Art">SS 3 Art</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-500">Allowed Duration (min)</Label>
                              <Input 
                                type="number" 
                                value={excelDuration} 
                                onChange={(e) => setExcelDuration(Number(e.target.value))} 
                                className="h-8.5 bg-white text-xs border-slate-300 font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-500">Term Block</Label>
                              <select
                                value={excelTerm}
                                onChange={(e) => setExcelTerm(e.target.value)}
                                className="w-full h-8.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold focus-visible:outline-none"
                              >
                                <option value="1st Term">1st Term</option>
                                <option value="2nd Term">2nd Term</option>
                                <option value="3rd Term">3rd Term</option>
                              </select>
                            </div>
                          </div>

                          <Button
                            type="button"
                            onClick={handleSaveExcelExam}
                            className="w-full h-9 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold text-xs uppercase shadow-md active:scale-[0.99] transition mt-2 cursor-pointer"
                          >
                            Submit to Admin & HOD Review Pool
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            {/* Central AI Proctoring Malpractice Sentinel */}
            <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black cs-text-navy text-sm uppercase">Central AI Proctoring & Session Sentinel</h4>
                    <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider font-mono">Telemetry Link Active</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Streams tab-switching, screen blur alerts, and cached offline-answers synchronization queues in real-time.</p>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("CS_CBT_SESSION_RECORDS");
                    loadProctorLogs();
                    toast.success("AI Proctoring session records flushed successfully!");
                  }}
                  className="h-8 text-[10px] font-mono hover:bg-rose-50 hover:text-rose-600 border-slate-200"
                >
                  Clear Proctoring Telemetry DB
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-[600px] md:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider">
                      <TableHead>Student Candidate</TableHead>
                      <TableHead>CBT Syllabus Paper</TableHead>
                      <TableHead>Blur/Exit Violations Count</TableHead>
                      <TableHead>Session Status</TableHead>
                      <TableHead className="text-right">Action Safeguard</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proctorLogs.map((log: any, lidx: number) => (
                      <TableRow key={lidx} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold cs-text-navy">{log.studentName}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{log.examTitle}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${log.violations > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                            <strong className={`font-mono text-sm ${log.violations > 0 ? "text-rose-600 font-bold" : "text-emerald-600"}`}>
                              {log.violations} Violation{log.violations !== 1 ? "s" : ""}
                            </strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={log.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"}>
                            {log.status === "completed" ? "✅ Completed & Checked" : "⚡ In-Progress Session"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast.success(`Sent immediate browser warning dialog to student ${log.studentName}!`);
                            }}
                            className="h-7 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                          >
                            Send Warning Alert
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {proctorLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <ShieldAlert className="w-6 h-6 text-slate-350" />
                            <span>No active exam sessions monitored yet. Secure proctor signals are listening...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          )
        )}

        {/* ---------------- MESSAGES & BROADCASTS ---------------- */}
        {tab === "messages" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <CommunicationHub currentProfile={currentProfile} />
          </div>
        )}

        {/* ---------------- SETTINGS PANEL ---------------- */}
        {tab === "settings" && (
          <div className="max-w-4xl animate-in fade-in duration-200">
            <SettingsPanel
              currentUserProfile={currentProfile}
              theme={theme}
              setTheme={setTheme}
              activeFont={activeFont}
              setActiveFont={setActiveFont}
            />
          </div>
        )}

        {/* ---------------- ACADEMIC RECEIPTS & EXAM STATUS DESK ---------------- */}
        {tab === "receipts" && (() => {
          // Look up user profile details dynamically
          const usersList = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
          const teacherProfile = usersList.find((u: any) => u.email === currentProfile?.email) || {
            name: currentProfile?.name || "Mrs. Folasade Adebayo",
            email: currentProfile?.email || "f.adebayo@cornerstreams.edu",
            role: "Class_Teacher",
            assigned_class: "SS 2 Science",
            assigned_classes: ["SS 2 Science"],
            assigned_subjects: ["Mathematics", "Physics"],
            is_class_teacher: true
          };

          const isClassTeacher = !!teacherProfile.is_class_teacher || teacherProfile.role === "Class_Teacher";
          const mainClass = teacherProfile.assigned_class || (Array.isArray(teacherProfile.assigned_classes) && teacherProfile.assigned_classes[0]) || "SS 2 Science";
          const assignedSubjects = teacherProfile.assigned_subjects || ["Mathematics", "Physics"];

          // All subjects registered in system
          const allSubjectsRecs = JSON.parse(localStorage.getItem("CS_SUBJECTS") || "[]");

          // Read distributed reports sent by School Admin
          const distributedSubjectsList: string[] = (() => {
            try { return JSON.parse(localStorage.getItem("CS_DISTRIBUTED_SUBJECT_RESULTS") || "[]"); } catch { return []; }
          })();
          const distributedClassesList: string[] = (() => {
            try { return JSON.parse(localStorage.getItem("CS_DISTRIBUTED_CLASS_REPORTS") || "[]"); } catch { return []; }
          })();

          return (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div>
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Academic Receipts & Exam Status Desk</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    View institutional curriculum allocation slips, student profiles, and real-time computer-based testing statuses.
                  </p>
                </div>
                <Badge className={isClassTeacher ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"}>
                  {isClassTeacher ? `👩‍🏫 Class Teacher (${mainClass})` : `📚 Subject Specialist (${assignedSubjects.join(", ")})`}
                </Badge>
              </div>

              {/* DISTRIBUTED REPORTS & LEDGERS DISPATCHED BY SCHOOL ADMIN */}
              {(distributedSubjectsList.length > 0 || distributedClassesList.length > 0) && (
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b border-indigo-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider font-mono">Distributed Admin Reports Received</h4>
                    </div>
                    <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-full font-bold">
                      {distributedSubjectsList.length + distributedClassesList.length} Official Dispatches
                    </span>
                  </div>

                  <p className="text-xs text-indigo-100">
                    The School Admin has distributed official class reports and subject result ledgers directly to your teacher dashboard for review and printing.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {distributedClassesList.map((clsName) => (
                      <div key={clsName} className="bg-white/10 backdrop-blur-sm border border-white/15 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-emerald-400 font-mono block">Class Total Subjects PDF</span>
                          <span className="text-xs font-bold text-white block mt-0.5">{clsName} Results</span>
                        </div>
                        <Button
                          type="button"
                          variant="emerald"
                          size="sm"
                          onClick={() => window.print()}
                          className="h-7 px-2.5 text-[9.5px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-slate-950 gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-slate-950" />
                          <span>Print PDF</span>
                        </Button>
                      </div>
                    ))}

                    {distributedSubjectsList.map((subjName) => (
                      <div key={subjName} className="bg-white/10 backdrop-blur-sm border border-white/15 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-indigo-300 font-mono block">Subject Result Ledger</span>
                          <span className="text-xs font-bold text-white block mt-0.5">{subjName}</span>
                        </div>
                        <Button
                          type="button"
                          variant="emerald"
                          size="sm"
                          onClick={() => window.print()}
                          className="h-7 px-2.5 text-[9.5px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-slate-950 gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-slate-950" />
                          <span>Print Ledger</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isClassTeacher ? (
                <div className="space-y-5">
                  {/* CLASS TEACHER VIEW: Sees full roster receipt, can print, and sees every subject's exam status */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Primary Classroom Receipt: {mainClass}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">As the designated Class Teacher, you have full administration clearance over every subject registration and student biometrics.</p>
                      </div>
                      <Button
                        type="button"
                        variant="emerald"
                        size="sm"
                        onClick={() => {
                          window.print();
                        }}
                        className="gap-1.5 bg-emerald-500 text-slate-955 hover:bg-emerald-600 font-black uppercase tracking-wider text-[10px] h-8"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-950" />
                        Print Class Allocation Slip
                      </Button>
                    </div>

                    {/* Class Receipt Header Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-slate-500">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Students Registered</span>
                        <span className="font-black text-slate-800 font-mono text-sm">
                          {students.filter(s => s.class_name === mainClass).length} Students
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Curriculum Subjects</span>
                        <span className="font-black text-slate-800 font-mono text-sm">
                          {(() => {
                            const matched = allSubjectsRecs.find((s: any) => s.class_name === mainClass);
                            return matched ? matched.subjects.length : 2;
                          })()} Subjects Alloc
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Active CBT Assessments</span>
                        <span className="font-black text-slate-800 font-mono text-sm">
                          {exams.filter((ex: any) => ex.class_name === mainClass).length} Testing Papers
                        </span>
                      </div>
                    </div>

                    {/* Students Profile Table with Subject counts & Exam Completions */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 font-bold text-slate-500">
                            <TableHead>Student Name</TableHead>
                            <TableHead>Registered Curriculum</TableHead>
                            <TableHead>Parent Link</TableHead>
                            <TableHead>Ledger Status</TableHead>
                            <TableHead className="text-right">CBT Exam Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.filter(s => s.class_name === mainClass).map((st: any) => {
                            const sClassSubjects = allSubjectsRecs.find((s: any) => s.class_name === mainClass)?.subjects || ["English Language", "Mathematics"];
                            const completedExams = exams.filter((ex: any) => ex.class_name === mainClass && ex.status === "published");
                            return (
                              <TableRow key={st.id} className="text-[11px]">
                                <TableCell className="font-bold cs-text-navy flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                    <img src={st.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=32&h=32"} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <span>{st.name}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {sClassSubjects.length} subjects taken
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono text-slate-400">{st.parent_email}</TableCell>
                                <TableCell>
                                  {st.balance_due > 0 ? (
                                    <span className="text-rose-500 font-bold">₦{st.balance_due.toLocaleString()} Due</span>
                                  ) : (
                                    <span className="text-emerald-500 font-bold">Cleared (₦0)</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] font-mono">
                                    {completedExams.length > 0 ? "100% CBT Attendance" : "No Exams In Progress"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Allocated Subjects List Details */}
                    <div className="space-y-2 pt-2">
                      <h5 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-400">Class Subjects Ledger Roster</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {(allSubjectsRecs.find((s: any) => s.class_name === mainClass)?.subjects || ["English Language", "Mathematics"]).map((sub: string) => (
                          <span key={sub} className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold font-mono text-[10px]">
                            📖 {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* SUBJECT TEACHER VIEW: Only sees subject-based receipts/rosters and student exam statuses */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800 text-xs">Specialist Subject Allocations: {assignedSubjects.join(", ")}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">As a specialized Subject Teacher, your access is strictly scoped to your specific instruction subjects and student exam attendance status.</p>
                    </div>

                    <div className="space-y-6">
                      {assignedSubjects.map((subjectName: string) => {
                        const classesWithSubject = allSubjectsRecs.filter((s: any) => s.subjects.includes(subjectName)).map((s: any) => s.class_name);
                        
                        return (
                          <div key={subjectName} className="space-y-3 bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="font-display font-black cs-text-navy text-xs uppercase tracking-tight">📘 Subject: {subjectName}</span>
                              <Badge className="bg-indigo-600 text-white font-bold font-mono text-[9px]">
                                Registered in {classesWithSubject.length || 1} Classes
                              </Badge>
                            </div>

                            {classesWithSubject.map((classNameStr: string) => {
                              const sStudents = students.filter(s => s.class_name === classNameStr);
                              const examForSubject = exams.find((e: any) => e.class_name === classNameStr && e.subject === subjectName);
                              
                              return (
                                <div key={classNameStr} className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2.5">
                                  <div className="flex justify-between items-center text-[10.5px] border-b border-slate-100 pb-1.5">
                                    <span className="font-bold text-slate-700">Roster for {classNameStr} ({sStudents.length} Students)</span>
                                    {examForSubject ? (
                                      <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase">● Exam Paper Published ({examForSubject.title})</span>
                                    ) : (
                                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">● No active exam yet</span>
                                    )}
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[10.5px]">
                                      <thead>
                                        <tr className="text-slate-400 font-bold border-b border-slate-100">
                                          <th className="py-1">Student</th>
                                          <th className="py-1 text-center">Curriculum Status</th>
                                          <th className="py-1 text-right">Exam Completion</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sStudents.map((st: any) => (
                                          <tr key={st.id} className="border-b border-slate-50 text-[10px]">
                                            <td className="py-1.5 font-bold cs-text-navy">{st.name}</td>
                                            <td className="py-1.5 text-center font-mono">Taking {subjectName}</td>
                                            <td className="py-1.5 text-right font-mono font-bold">
                                              {examForSubject ? (
                                                <span className="text-emerald-600 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded text-[9px]">
                                                  Completed / Active Score: {st.term_average || 75}%
                                                </span>
                                              ) : (
                                                <span className="text-slate-400">Awaiting Exam Paper</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Assignments & Homework Desk Tab */}
        {tab === "assignments" && (
          <TeacherAssignmentsManager
            currentProfile={currentProfile}
            students={students}
          />
        )}

        {/* Broadsheet Vault & Dossiers Tab */}
        {tab === "broadsheets" && (
          <AcademicBroadsheetVault
            currentProfile={currentProfile}
            studentsList={students}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CBT Construction Dialog */}
      <Dialog open={examDlg} onOpenChange={setExamDlg}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Compose Computer-Based Assessment Packet</DialogTitle>
            <p className="text-xs text-slate-500">Design multiple-choice questionnaire elements. Questions will be randomized automatically at runtime.</p>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Testing Paper Title</Label>
                <Input value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. Mathematics Mid-Term Test" />
              </div>
              <div className="space-y-1">
                <Label>Testing Subject Courses</Label>
                <Input value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Target Class Room Code</Label>
                <select
                  value={examForm.class_name}
                  onChange={(e) => setExamForm({ ...examForm, class_name: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs focus-visible:outline-none"
                >
                  <option value="SS 2 Science">SS 2 Science</option>
                  <option value="SS 3 Art">SS 3 Art</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Testing Term Block</Label>
                <select
                  value={examForm.term}
                  onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs focus-visible:outline-none"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Allowed Duration Period (min)</Label>
                <Input type="number" value={examForm.duration_min} onChange={(e) => setExamForm({ ...examForm, duration_min: Number(e.target.value) })} />
              </div>
            </div>

            {/* Bulk Text/CSV Importer Widget */}
            <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-indigo-950 text-xs uppercase font-mono tracking-wider">Automated CSV/Text Importer console</h4>
                  <p className="text-[9.5px] text-slate-400">Pasted values will split automatically into question rows.</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleSTEMExam}
                  className="h-7 text-[10px] text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                >
                  Load STEM Sample Paper
                </Button>
              </div>

              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Question Statement; Option A, Option B, Option C, Option D; Correct Index (0-3); Diagram URL (optional); Audio URL (optional)&#13;e.g. Solve for x: x²-4=0; x=2 or x=-2, x=0, x=3, x=4; 0; https://unspl.com/math.png; "
                className="h-20 text-[10.5px] font-mono bg-white border-slate-300"
              />

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>Separate fields using SEMICOLONS (;) and options using COMMAS (,)</span>
                <Button
                  type="button"
                  onClick={handleBulkImportPaste}
                  className="h-7.5 bg-indigo-600 text-white font-bold text-[10px]"
                >
                  Import Pasted Package
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-4">
              <div className="flex gap-1 justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wide">Question Roster ({examForm.questions.length})</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const nextQ = [...examForm.questions, { type: "mcq", question: "", options: ["", "", "", ""], correct_idx: 0 }];
                    setExamForm({ ...examForm, questions: nextQ });
                  }}
                  className="h-7.5 text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Query Row
                </Button>
              </div>

              {examForm.questions.map((q: any, qi: number) => (
                <div key={qi} className="border border-slate-200 bg-white p-3 rounded-lg space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Query Option #{qi + 1}</span>
                    {examForm.questions.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const nextQ = examForm.questions.filter((_val: any, idx: number) => idx !== qi);
                          setExamForm({ ...examForm, questions: nextQ });
                        }}
                        className="h-6 text-rose-500 border-rose-200"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Question statement text</Label>
                    <Input value={q.question} onChange={(e) => {
                      const nextQ = [...examForm.questions];
                      nextQ[qi].question = e.target.value;
                      setExamForm({ ...examForm, questions: nextQ });
                    }} placeholder="e.g. Solve for x: 3x - 5 = 10" />
                  </div>

                  <div className="space-y-1">
                    <Label className="block mb-1 text-[10px] uppercase font-black tracking-wide text-slate-400">Multiple Options Choices Grid</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex gap-1.5 items-center">
                          <input 
                            type="radio" 
                            name={`correct-${qi}`} 
                            checked={q.correct_idx === oi}
                            onChange={() => {
                              const nextQ = [...examForm.questions];
                              nextQ[qi].correct_idx = oi;
                              setExamForm({ ...examForm, questions: nextQ });
                            }}
                            className="accent-indigo-600 rounded-full w-4 h-4 cursor-pointer" 
                          />
                          <Input value={opt} onChange={(e) => {
                            const nextQ = [...examForm.questions];
                            nextQ[qi].options = [...nextQ[qi].options];
                            nextQ[qi].options[oi] = e.target.value;
                            setExamForm({ ...examForm, questions: nextQ });
                          }} placeholder={`Option candidate ${oi + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional diagram and audio comprehension media attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400">Optional Illustration Diagram URL</Label>
                      <Input 
                        value={q.diagramUrl || ""} 
                        onChange={(e) => {
                          const nextQ = [...examForm.questions];
                          nextQ[qi].diagramUrl = e.target.value;
                          setExamForm({ ...examForm, questions: nextQ });
                        }} 
                        placeholder="e.g. https://domain.com/fig1.png" 
                        className="h-7 text-[10px]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400">Optional Comprehension Audio URL</Label>
                      <Input 
                        value={q.audioUrl || ""} 
                        onChange={(e) => {
                          const nextQ = [...examForm.questions];
                          nextQ[qi].audioUrl = e.target.value;
                          setExamForm({ ...examForm, questions: nextQ });
                        }} 
                        placeholder="e.g. https://domain.com/track.mp3" 
                        className="h-7 text-[10px]" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setExamDlg(false)}>
              Cancel
            </Button>
            <Button variant="emerald" size="sm" onClick={handleCreateCBTExam}>
              Publish CBT Exam Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portrait photo update modal popup */}
      <StudentProfileDialog 
        open={passportDlg} 
        onOpenChange={setPassportDlg} 
        student={selected} 
        onSave={(updatedStudent: any) => {
          const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
          const nextList = currentList.map((st: any) => st.id === updatedStudent.id ? { ...st, ...updatedStudent } : st);
          localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextList));
          toast.success("Student biometric photo passport synched.");
          refresh();
        }}
      />

      {/* ---------------- QUESTION PREVIEW DIALOG ---------------- */}
      <Dialog open={!!previewQuestion} onOpenChange={(open) => { if (!open) setPreviewQuestion(null); }}>
        <DialogContent className="max-w-md sm:max-w-lg bg-slate-50 border border-slate-200 shadow-xl rounded-2xl overflow-hidden p-0 gap-0">
          {previewQuestion && (() => {
            const errors = getQuestionValidationErrors(previewQuestion);
            const hasErrors = errors.length > 0;
            return (
              <>
                {/* Header background with brand-aligned gradients */}
                <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 px-6 py-4.5 text-white flex justify-between items-center border-b border-indigo-900/40">
                  <div className="text-left">
                    <DialogTitle className="font-display text-sm md:text-base font-black tracking-tight uppercase">
                      Question Blueprint Review
                    </DialogTitle>
                    <DialogDescription className="text-indigo-200 text-[10.5px] mt-0.5">
                      Verify visual asset alignment and multiple choice configuration.
                    </DialogDescription>
                  </div>
                  <Badge className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                    hasErrors 
                      ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse" 
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}>
                    {hasErrors ? `${errors.length} Issue(s)` : "Verified 100%"}
                  </Badge>
                </div>

                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Validation banner if errors exist */}
                  {hasErrors && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-3.5 rounded-xl space-y-1.5 shadow-xs text-left">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Action Required: Unconfigured Parameters</span>
                      </div>
                      <ul className="list-disc pl-5 text-[10px] text-rose-600 space-y-0.5 font-medium">
                        {errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Question Statement */}
                  <div className="space-y-1.5 bg-white border border-slate-150 p-4.5 rounded-xl shadow-xs text-left">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block">Question Query Statement</span>
                    <p className="font-display text-slate-800 text-sm md:text-base font-bold leading-relaxed">
                      {previewQuestion.question || <span className="italic text-rose-450">Empty question statement</span>}
                    </p>
                  </div>

                  {/* Diagram / Audio Attachment Preview */}
                  {previewQuestion.diagramUrl && (
                    <div className="space-y-2 bg-white border border-slate-150 p-4 rounded-xl shadow-xs text-left">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block">Attached Visual Illustration</span>
                      <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-2 relative group">
                        <img 
                          src={previewQuestion.diagramUrl} 
                          alt="Question Illustration" 
                          className="max-h-[180px] object-contain rounded transition-transform duration-200 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // If load fails, fallback smoothly
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                          Referrer Friendly
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono break-all text-center">
                        URL: {previewQuestion.diagramUrl}
                      </p>
                    </div>
                  )}

                  {/* Multiple Choice Options List */}
                  <div className="space-y-2 bg-white border border-slate-150 p-4.5 rounded-xl shadow-xs text-left">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block">Multiple Choice Options Grid</span>
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((label, idx) => {
                        const isCorrect = previewQuestion.correct_idx === idx;
                        const optionValue = previewQuestion.options?.[idx];
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition duration-150 ${
                              isCorrect 
                                ? "bg-emerald-50/75 border-emerald-300 text-emerald-950 font-semibold shadow-xs" 
                                : "bg-slate-50/50 border-slate-150 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                              isCorrect 
                                ? "bg-emerald-600 text-white shadow-xs" 
                                : "bg-slate-200 text-slate-500"
                            }`}>
                              {label}
                            </span>
                            <div className="flex-1 pt-0.5 break-words">
                              {optionValue || <span className="italic text-rose-450 font-normal">Option not configured</span>}
                            </div>
                            {isCorrect && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[8.5px] uppercase font-black tracking-wider self-center gap-0.5 shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[4]" /> Correct Key
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex justify-end gap-2.5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setPreviewQuestion(null)}
                    className="h-8.5 text-xs text-slate-600 hover:bg-slate-200 border-slate-200 font-bold bg-white cursor-pointer px-4"
                  >
                    Close Preview
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* PLAN COMPARISON MODAL FOR TEACHERS */}
      <InteractivePlanComparisonModal
        isOpen={isPlanComparisonOpen}
        onClose={() => setIsPlanComparisonOpen(false)}
        currentTier={school?.subscription_tier || "unified_enterprise"}
        onTierChange={() => handleSimulatedUpgrade()}
      />
    </div>
  );
}
export default TeacherDashboard;
