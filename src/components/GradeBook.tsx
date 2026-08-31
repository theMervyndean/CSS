/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { GradeRecord, UserProfile, SchoolArmType, CaFrequencyType } from '../types';
import { defaultGradeRecords, mockUsers } from '../mockData';
import { Plus, Check, Trash2, ShieldAlert, Award, FileSpreadsheet, Image as ImageIcon, Camera, Upload, CheckCircle, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Lightbulb, AlertTriangle, RefreshCw, Download, Printer, Sliders, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { GradingSystemModal, getStoredGradingScheme, GradingSchemeConfig } from './GradingSystemModal';

interface GradeBookProps {
  currentProfile: UserProfile;
  grades: GradeRecord[];
  onUpdateGrades: (updated: GradeRecord[]) => void;
  studentsProfileList: UserProfile[];
  onUpdateStudents: (updated: UserProfile[]) => void;
}

type GradeSortColumn = 'index' | 'studentId' | 'studentName' | 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam' | 'totalScore' | 'gradeLetter' | null;
type SortOrder = 'asc' | 'desc';

export default function GradeBook({
  currentProfile,
  grades,
  onUpdateGrades,
  studentsProfileList,
  onUpdateStudents,
}: GradeBookProps) {
  const [caConfiguration, setCaConfiguration] = useState<CaFrequencyType>('4_CA');
  const [isGradingModalOpen, setIsGradingModalOpen] = useState<boolean>(false);
  const [activeGradingScheme, setActiveGradingScheme] = useState<GradingSchemeConfig>(() => getStoredGradingScheme());

  useEffect(() => {
    const handleSchemeUpdate = () => {
      const updated = getStoredGradingScheme();
      setActiveGradingScheme(updated);
      if (updated.caCount === 2) {
        setCaConfiguration('2_CA');
      } else {
        setCaConfiguration('4_CA');
      }
    };
    window.addEventListener('cs-grading-scheme-updated', handleSchemeUpdate);
    return () => window.removeEventListener('cs-grading-scheme-updated', handleSchemeUpdate);
  }, []);
  const [activeStudentId, setActiveStudentId] = useState<string>('usr-stu-1');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Accessible Sorting & Table Navigation State
  const [sortColumn, setSortColumn] = useState<GradeSortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortOrder>('asc');
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  const getColumnLabel = (col: GradeSortColumn): string => {
    switch (col) {
      case 'index': return 'Index Number';
      case 'studentId': return 'Student ID';
      case 'studentName': return 'Full Name';
      case 'ca1': return 'Continuous Assessment 1';
      case 'ca2': return 'Continuous Assessment 2';
      case 'ca3': return 'Continuous Assessment 3';
      case 'ca4': return 'Continuous Assessment 4';
      case 'exam': return 'Terminal Examination';
      case 'totalScore': return 'Total Score';
      case 'gradeLetter': return 'Letter Grade';
      default: return '';
    }
  };

  const handleHeaderSort = (column: GradeSortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
        const msg = `Table sorted by ${getColumnLabel(column)} descending`;
        setSrAnnouncement(msg);
        toast.info(`Sorted by ${getColumnLabel(column)} (Descending ↓)`);
      } else {
        setSortColumn(null);
        setSortDirection('asc');
        const msg = `Table sort cleared, returned to default order`;
        setSrAnnouncement(msg);
        toast.info(`Reset to default class order`);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
      const msg = `Table sorted by ${getColumnLabel(column)} ascending`;
      setSrAnnouncement(msg);
      toast.info(`Sorted by ${getColumnLabel(column)} (Ascending ↑)`);
    }
  };

  // Sortable grade matrix list
  const sortedGrades = useMemo(() => {
    if (!sortColumn) return grades;
    return [...grades].sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;

      switch (sortColumn) {
        case 'index':
          aVal = grades.indexOf(a);
          bVal = grades.indexOf(b);
          break;
        case 'studentId': {
          const sA = studentsProfileList.find(s => s.id === a.studentId)?.username || a.studentId;
          const sB = studentsProfileList.find(s => s.id === b.studentId)?.username || b.studentId;
          aVal = sA.toLowerCase();
          bVal = sB.toLowerCase();
          break;
        }
        case 'studentName':
          aVal = (a.studentName || '').toLowerCase();
          bVal = (b.studentName || '').toLowerCase();
          break;
        case 'ca1':
          aVal = a.scores?.ca1 ?? 0;
          bVal = b.scores?.ca1 ?? 0;
          break;
        case 'ca2':
          aVal = a.scores?.ca2 ?? 0;
          bVal = b.scores?.ca2 ?? 0;
          break;
        case 'ca3':
          aVal = a.scores?.ca3 ?? 0;
          bVal = b.scores?.ca3 ?? 0;
          break;
        case 'ca4':
          aVal = a.scores?.ca4 ?? 0;
          bVal = b.scores?.ca4 ?? 0;
          break;
        case 'exam':
          aVal = a.scores?.exam ?? 0;
          bVal = b.scores?.exam ?? 0;
          break;
        case 'totalScore':
          aVal = a.totalScore ?? 0;
          bVal = b.totalScore ?? 0;
          break;
        case 'gradeLetter': {
          const order: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 };
          aVal = order[a.gradeLetter || 'F'] ?? 99;
          bVal = order[b.gradeLetter || 'F'] ?? 99;
          break;
        }
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [grades, sortColumn, sortDirection, studentsProfileList]);

  // Active score columns for 2D spreadsheet keyboard navigation
  const scoreColumns = useMemo(() => {
    return caConfiguration === '4_CA' || activeGradingScheme.caCount === 4
      ? ['ca1', 'ca2', 'ca3', 'ca4', 'exam']
      : ['ca1', 'ca2', 'exam'];
  }, [caConfiguration, activeGradingScheme]);

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colKey: string
  ) => {
    const currentColIdx = scoreColumns.indexOf(colKey);

    if (e.key === 'ArrowUp') {
      if (rowIdx > 0) {
        e.preventDefault();
        const prevStudent = sortedGrades[rowIdx - 1];
        const targetId = `grade-input-${prevStudent.id}-${colKey}`;
        const el = document.getElementById(targetId);
        if (el) (el as HTMLInputElement).focus();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      if (rowIdx < sortedGrades.length - 1) {
        e.preventDefault();
        const nextStudent = sortedGrades[rowIdx + 1];
        const targetId = `grade-input-${nextStudent.id}-${colKey}`;
        const el = document.getElementById(targetId);
        if (el) (el as HTMLInputElement).focus();
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0 && currentColIdx > 0) {
        e.preventDefault();
        const prevColKey = scoreColumns[currentColIdx - 1];
        const currStudent = sortedGrades[rowIdx];
        const targetId = `grade-input-${currStudent.id}-${prevColKey}`;
        const el = document.getElementById(targetId);
        if (el) (el as HTMLInputElement).focus();
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length && currentColIdx < scoreColumns.length - 1) {
        e.preventDefault();
        const nextColKey = scoreColumns[currentColIdx + 1];
        const currStudent = sortedGrades[rowIdx];
        const targetId = `grade-input-${currStudent.id}-${nextColKey}`;
        const el = document.getElementById(targetId);
        if (el) (el as HTMLInputElement).focus();
      }
    }
  };

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    rowIdx: number,
    studentId: string
  ) => {
    if (e.target !== e.currentTarget) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveStudentId(studentId);
      const st = sortedGrades.find(g => g.studentId === studentId);
      setSrAnnouncement(`Selected ${st?.studentName || 'student'} in preview inspector.`);
    } else if (e.key === 'ArrowDown') {
      if (rowIdx < sortedGrades.length - 1) {
        e.preventDefault();
        const nextRow = document.getElementById(`grade-row-${sortedGrades[rowIdx + 1].id}`);
        if (nextRow) nextRow.focus();
      }
    } else if (e.key === 'ArrowUp') {
      if (rowIdx > 0) {
        e.preventDefault();
        const prevRow = document.getElementById(`grade-row-${sortedGrades[rowIdx - 1].id}`);
        if (prevRow) prevRow.focus();
      }
    }
  };

  const [rightTab, setRightTab] = useState<'passport' | 'ai_analysis'>('passport');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`CS_GRADE_ANALYSIS_${currentProfile.classCohort || 'SS_2A'}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleAnalyzeGrades = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/gradebook/analyze-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grades }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server responded with an error');
      }
      const data = await response.json();
      setAnalysisData(data.analysis);
      localStorage.setItem(`CS_GRADE_ANALYSIS_${currentProfile.classCohort || 'SS_2A'}`, JSON.stringify(data.analysis));
      toast.success('Successfully generated AI student academic performance insights.');
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'An unexpected error occurred during analysis.');
      toast.error(err.message || 'AI analysis compilation failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCsv = () => {
    if (!grades || grades.length === 0) {
      toast.error('No grade records available in the gradebook to export.');
      return;
    }

    // Convert grade records (JSON) to structured rows for CSV export
    const exportRows = grades.map((record) => {
      const studentProfile = studentsProfileList.find((s) => s.id === record.studentId);
      const formattedStudentId = studentProfile?.username || record.studentId;
      const studentClass = studentProfile?.classCohort || currentProfile.classCohort || 'SS 2A';
      const subjectName = record.subjectName || (record as any).subject || 'General Academic';

      return {
        'Record ID': record.id,
        'Student ID': formattedStudentId,
        'Full Name': record.studentName,
        'Class Cohort': studentClass,
        'Subject': subjectName,
        'CA 1 Score': record.scores?.ca1 ?? 0,
        'CA 2 Score': record.scores?.ca2 ?? 0,
        'CA 3 Score': record.scores?.ca3 ?? 0,
        'CA 4 Score': record.scores?.ca4 ?? 0,
        'Exam Score': record.scores?.exam ?? 0,
        'Total Score': record.totalScore ?? 0,
        'Grade Letter': record.gradeLetter || 'F',
        'Remark': record.remark || ''
      };
    });

    const headers = Object.keys(exportRows[0]);
    const csvLines = [
      headers.join(','),
      ...exportRows.map((row) =>
        headers
          .map((header) => {
            const rawVal = (row as any)[header] ?? '';
            const escaped = String(rawVal).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cohortSanitized = (currentProfile.classCohort || 'SS_2A').replace(/\s+/g, '_');
    link.setAttribute('download', `Gradebook_Records_${cohortSanitized}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${exportRows.length} grade records to CSV format successfully.`);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollTable = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };

  const isClassTeacher = currentProfile.role === 'Class_Teacher';
  const isSuperAdmin = currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin';
  // Has write privileges
  const hasWriteAccess = isClassTeacher || isSuperAdmin;

  // Grade compilation calculation logic
  const calculateResult = (scores: { ca1: number; ca2: number; ca3?: number; ca4?: number; exam: number }, caType: CaFrequencyType) => {
    const w = activeGradingScheme.weights;
    const gs = activeGradingScheme.gradeScale || { aMin: 80, bMin: 70, cMin: 50, dMin: 40, eMin: 30 };

    let total = 0;
    if (caType === '4_CA' || activeGradingScheme.caCount === 4) {
      const ca1 = Math.min(w.ca1, Math.max(0, scores.ca1 || 0));
      const ca2 = Math.min(w.ca2, Math.max(0, scores.ca2 || 0));
      const ca3 = Math.min(w.ca3, Math.max(0, (scores.ca3 !== undefined ? scores.ca3 : 0)));
      const ca4 = Math.min(w.ca4, Math.max(0, (scores.ca4 !== undefined ? scores.ca4 : 0)));
      const exam = Math.min(w.exam, Math.max(0, scores.exam || 0));
      total = ca1 + ca2 + ca3 + ca4 + exam;
    } else {
      const ca1 = Math.min(w.ca1, Math.max(0, scores.ca1 || 0));
      const ca2 = Math.min(w.ca2, Math.max(0, scores.ca2 || 0));
      const exam = Math.min(w.exam, Math.max(0, scores.exam || 0));
      total = ca1 + ca2 + exam;
    }

    let gradeLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
    let remark = '';

    if (total >= gs.aMin) {
      gradeLetter = 'A';
      remark = 'EXCELLENT OUTSTANDING ACHIEVEMENT';
    } else if (total >= gs.bMin) {
      gradeLetter = 'B';
      remark = 'VERY GOOD EFFORT. KEEP THE TEMPO UP';
    } else if (total >= gs.cMin) {
      gradeLetter = 'C';
      remark = 'GOOD CREDIT. DESERVES ENCOURAGEMENT';
    } else if (total >= gs.dMin) {
      gradeLetter = 'D';
      remark = 'PASSABLE WORK. CONCENTRATION NEEDED';
    } else if (total >= gs.eMin) {
      gradeLetter = 'E';
      remark = 'WEAK PERFORMANCE. RE-SITTING ADVISED';
    } else {
      gradeLetter = 'F';
      remark = 'FAIL. URGENT ACADEMIC INTERVENTION REQUIRED';
    }

    return { totalScore: total, gradeLetter, remark };
  };

  const handleRegenerateRemark = (recordId: string) => {
    const remarkPools = {
      A: [
        "EXEMPLARY MASTERY & BRILLIANT PROBLEM SOLVING",
        "OUTSTANDING DILIGENCE & INTELLECTUAL LEADERSHIP",
        "TOP-TIER ACADEMIC DISTINCTION. KEEP IT UP",
        "STELLAR PERFORMANCE; EXCEPTIONAL CONCEPTUAL CLARITY"
      ],
      B: [
        "COMMENDABLE DILIGENCE & HIGH QUALITY COURSEWORK",
        "VERY GOOD ANALYTICAL CAPACITY & STEADY EFFORT",
        "STRONG SUBJECT MASTERY WITH LAUDABLE FOCUS",
        "IMPRESSIVE ACADEMIC PROGRESS ACROSS TOPICS"
      ],
      C: [
        "GOOD STEADY EFFORT; CONSISTENT PROGRESS",
        "SATISFACTORY MASTERY; CONTINUED REVISION ADVISED",
        "ENCOURAGING PERFORMANCE WITH STEADY POTENTIAL",
        "FAIRLY CONSISTENT WORK; KEEP IMPROVING"
      ],
      D: [
        "PASSABLE WORK; EXTRA CONCENTRATION NEEDED",
        "REQUIRES CLOSER REVISION IN FOUNDATIONAL CONCEPTS",
        "STEADY PRACTICE RECOMMENDED TO BOOST MARKS",
        "NEEDS DISCIPLINED STUDY HABITS IN WEAK AREAS"
      ],
      E: [
        "WEAK PERFORMANCE; RE-SITTING ADVISED",
        "EXTRA TUTORIAL GUIDANCE STRONGLY RECOMMENDED",
        "NEEDS IMMEDIATE ACADEMIC REMEDIATION & REVISION",
        "DISCIPLINED DAILY STUDY HABITS REQUIRED"
      ],
      F: [
        "FAIL. URGENT ACADEMIC INTERVENTION REQUIRED",
        "CRITICAL SUPPORT NEEDED IN BASIC CONCEPTS",
        "RECOMMENDED FOR COMPREHENSIVE ACADEMIC REVIEW",
        "RE-TAKE MANDATORY; IMMEDIATE PARENTAL CONSULTATION"
      ]
    };

    const updated = grades.map((g) => {
      if (g.id === recordId) {
        const gradeKey = (g.gradeLetter || 'C') as keyof typeof remarkPools;
        const pool = remarkPools[gradeKey] || remarkPools.C;
        const currentRemark = g.remark || '';
        const options = pool.filter((r) => r !== currentRemark);
        const newRemark = options[Math.floor(Math.random() * options.length)] || pool[0];

        return {
          ...g,
          remark: newRemark
        };
      }
      return g;
    });

    onUpdateGrades(updated);
    const target = grades.find((g) => g.id === recordId);
    toast.success(`Regenerated AI remark for ${target?.studentName || "student"}!`);
  };

  const handleScoreChange = (recordId: string, field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam', valStr: string) => {
    if (!hasWriteAccess) return;

    const val = parseInt(valStr) || 0;
    const updated = grades.map((g) => {
      if (g.id === recordId) {
        const scores = { ...g.scores };
        scores[field] = val;
        
        const { totalScore, gradeLetter, remark } = calculateResult(scores, caConfiguration);
        return {
          ...g,
          scores,
          totalScore,
          gradeLetter,
          remark,
          caType: caConfiguration
        };
      }
      return g;
    });

    onUpdateGrades(updated);
  };

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'B':
        return 'bg-teal-500 text-white border-teal-600';
      case 'C':
        return 'bg-amber-500 text-white border-amber-600';
      case 'D':
        return 'bg-orange-500 text-white border-orange-600';
      case 'E':
        return 'bg-rose-500 text-white border-rose-600';
      case 'F':
        return 'bg-red-600 text-white border-red-700';
      default:
        return 'bg-slate-400 text-white border-slate-500';
    }
  };

  const selectedStudent = studentsProfileList.find(s => s.id === activeStudentId) || studentsProfileList[0];
  const studentGradeRecord = grades.find(g => g.studentId === activeStudentId);

  // File drag & drop / manual select passport management
  const handlePassportFile = (file: File) => {
    if (!hasWriteAccess) return;
    
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Please upload an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        // Update both user listing and active selection
        const updatedUsers = studentsProfileList.map(usr => {
          if (usr.id === activeStudentId) {
            return { ...usr, photoUrl: base64Url };
          }
          return usr;
        });
        onUpdateStudents(updatedUsers);
        setSuccessMsg(`Successfully uploaded new physical passport for ${selectedStudent.fullName}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePassportFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePassportFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-3 h-full">
      {/* PRINT MODE ACTION BANNER */}
      {isPrintMode && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg flex flex-wrap justify-between items-center gap-3 shrink-0 print:hidden border border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Printer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                🖨️ Clean A4 Print Mode Active
              </p>
              <p className="text-[10.5px] text-slate-300">
                UI navigation and sidebars are hidden. Grade inputs formatted as static typography for clean A4 printing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-trigger-browser-print"
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              id="btn-exit-print-mode"
              onClick={() => setIsPrintMode(false)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10.5px] font-bold uppercase rounded-lg transition cursor-pointer border border-white/20"
            >
              Exit Print Mode
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 h-full">
        {/* LEFT COMPILER PANEL: EXCEL-STYLE GRID */}
        <div className={`flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${
          isPrintMode ? 'max-w-[210mm] mx-auto border-2 border-slate-300 p-2 print:border-none print:p-0 print:shadow-none' : ''
        }`}>
          
          {/* Header toolbar */}
          {isPrintMode ? (
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-900 rounded font-bold text-white flex items-center justify-center text-xs">CS</div>
                  <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">CORNER STREAMS INTERNATIONAL</h1>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  OFFICIAL ACADEMIC CLASSROOM GRADEBOOK • COHORT: {currentProfile.classCohort || 'SS 2A'} • TERM 1
                </p>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">A4 Verified Grade Sheet</span>
                <p className="mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                    Secondary Grade Registry Core ({currentProfile.classCohort || 'SS 2A'})
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Input Term marks. Auto-calculated with alphabetic scale and remarks mapping.
                </p>
              </div>

              <div className="flex gap-2.5 items-center flex-wrap">
                {/* Print Mode Toggle Button */}
                <button
                  type="button"
                  id="btn-toggle-gradebook-print-mode"
                  onClick={() => setIsPrintMode(!isPrintMode)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  title="Toggle clean print mode and format grade tables for A4 printing"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Mode</span>
                </button>

                {/* Edit Grading System Modal Trigger Button */}
                <button
                  type="button"
                  id="btn-open-grading-system-modal"
                  onClick={() => setIsGradingModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  title="Configure assessment weights (10,10,10,10,60 | 5,5,5,5,80 | 20,20,60 or custom)"
                >
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>Edit Grading System</span>
                </button>

                {/* JSON-to-CSV Gradebook Export Button */}
                <button
                  type="button"
                  id="btn-export-gradebook-csv"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  title="Download JSON grade records for the teacher's class as a CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Export CSV</span>
                </button>

                {/* Toggle CA configuration */}
                <div className="bg-slate-100 p-0.5 rounded flex items-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCaConfiguration('2_CA')}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition ${
                      caConfiguration === '2_CA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    2 CAs (Max 20/20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaConfiguration('4_CA')}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition ${
                      caConfiguration === '4_CA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    4 CAs (Max 10x4)
                  </button>
                </div>

                {/* Smooth Table Horizontal Scroller */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleScrollTable('left')}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition cursor-pointer"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[8px] font-black tracking-widest text-slate-400 px-1 uppercase">SLIDE</span>
                  <button
                    type="button"
                    onClick={() => handleScrollTable('right')}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition cursor-pointer"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  AUTO-SAVE
                </div>
              </div>
            </div>
          )}

          {/* Security blockade warning */}
          {!hasWriteAccess && !isPrintMode && (
            <div className="p-3 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs flex items-center gap-2 shrink-0">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">
                <strong>🔒 ROBUST SECURITY BARRIER ENGAGED:</strong> As a {currentProfile.role.replace(/_/g, ' ')}, you are in read-only mode and do not hold grading scope authorizations for this classroom cohort.
              </span>
            </div>
          )}

          {/* Grid and grades table */}
          <div 
            ref={scrollContainerRef} 
            className="flex-1 overflow-auto scroll-smooth p-1"
            role="region"
            aria-label="Gradebook Assessment Spreadsheet Matrix"
            tabIndex={0}
          >
            {/* Screen Reader Live Region for Accessibility Feedback */}
            <div role="status" aria-live="polite" className="sr-only">
              {srAnnouncement}
            </div>

            <table 
              className="w-full border-collapse min-w-[700px] border border-slate-200 text-xs"
              role="grid"
              aria-label="Student Grade Assessment Table"
              aria-rowcount={sortedGrades.length + 1}
            >
              <caption className="sr-only">
                Classroom Academic Assessment Matrix with Continuous Assessments (CA) and Examination Scores. Use arrow keys to navigate spreadsheet cells.
              </caption>
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-slate-700 select-none">
                <tr role="row">
                  {/* # Index Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'index' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by row index, currently ${sortColumn === 'index' ? (sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending') : 'not sorted'}. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('index')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleHeaderSort('index');
                      }
                    }}
                    className="p-2 text-center text-[9px] font-black text-slate-500 uppercase tracking-wider w-10 cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {sortColumn === 'index' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Student ID Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'studentId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by Student ID, currently ${sortColumn === 'studentId' ? (sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending') : 'not sorted'}. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('studentId')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleHeaderSort('studentId');
                      }
                    }}
                    className="p-2 text-left text-[9px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                  >
                    <div className="flex items-center gap-1">
                      <span>Student ID</span>
                      {sortColumn === 'studentId' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Full Name Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'studentName' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by Student Full Name, currently ${sortColumn === 'studentName' ? (sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending') : 'not sorted'}. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('studentName')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleHeaderSort('studentName');
                      }
                    }}
                    className="p-2 text-left text-[9px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group min-w-[140px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Name</span>
                      {sortColumn === 'studentName' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  
                  {/* CA Columns */}
                  {caConfiguration === '4_CA' || activeGradingScheme.caCount === 4 ? (
                    <>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca1' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 1, max ${activeGradingScheme.weights.ca1} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca1')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca1'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 1 ({activeGradingScheme.weights.ca1})</span>
                          {sortColumn === 'ca1' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca2' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 2, max ${activeGradingScheme.weights.ca2} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca2')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca2'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 2 ({activeGradingScheme.weights.ca2})</span>
                          {sortColumn === 'ca2' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca3' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 3, max ${activeGradingScheme.weights.ca3} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca3')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca3'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 3 ({activeGradingScheme.weights.ca3})</span>
                          {sortColumn === 'ca3' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca4' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 4, max ${activeGradingScheme.weights.ca4} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca4')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca4'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 4 ({activeGradingScheme.weights.ca4})</span>
                          {sortColumn === 'ca4' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca1' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 1, max ${activeGradingScheme.weights.ca1} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca1')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca1'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 1 ({activeGradingScheme.weights.ca1})</span>
                          {sortColumn === 'ca1' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                      <th 
                        scope="col"
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortColumn === 'ca2' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        aria-label={`Sort by Continuous Assessment 2, max ${activeGradingScheme.weights.ca2} marks. Press Enter or Space to sort.`}
                        onClick={() => handleHeaderSort('ca2')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('ca2'); } }}
                        className="p-2 text-center text-[9px] font-black text-slate-600 uppercase bg-blue-50/50 cursor-pointer hover:bg-blue-100/70 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>CA 2 ({activeGradingScheme.weights.ca2})</span>
                          {sortColumn === 'ca2' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                        </div>
                      </th>
                    </>
                  )}
                  
                  {/* Exam Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'exam' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by Terminal Examination score, max ${activeGradingScheme.weights.exam} marks. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('exam')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('exam'); } }}
                    className="p-2 text-center text-[9px] font-black text-slate-600 uppercase cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Exam ({activeGradingScheme.weights.exam})</span>
                      {sortColumn === 'exam' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                    </div>
                  </th>

                  {/* Total Score Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'totalScore' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by Total Score out of 100 points. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('totalScore')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('totalScore'); } }}
                    className="p-2 text-center text-[9px] font-black text-slate-700 uppercase font-mono bg-indigo-50 cursor-pointer hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Total (100)</span>
                      {sortColumn === 'totalScore' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Grade Column */}
                  <th 
                    scope="col"
                    role="columnheader"
                    tabIndex={0}
                    aria-sort={sortColumn === 'gradeLetter' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`Sort by Letter Grade. Press Enter or Space to sort.`}
                    onClick={() => handleHeaderSort('gradeLetter')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleHeaderSort('gradeLetter'); } }}
                    className="p-2 text-center text-[9px] font-black text-slate-600 uppercase cursor-pointer hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none transition group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Grd</span>
                      {sortColumn === 'gradeLetter' && (sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-indigo-600" /> : <ArrowDown className="w-2.5 h-2.5 text-indigo-600" />)}
                    </div>
                  </th>

                  {/* Remark Column */}
                  <th scope="col" className="p-2 text-left text-[9px] font-black text-slate-600 uppercase">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs bg-white">
                {sortedGrades.map((g, idx) => {
                  const sProfile = studentsProfileList.find(s => s.id === g.studentId) || { photoUrl: '' };
                  const isActive = activeStudentId === g.studentId;
                  const scores = g.scores;
                  const caMax = caConfiguration === '4_CA' ? 10 : 20;
                  const examMax = activeGradingScheme.weights.exam;

                  return (
                    <tr
                      id={`grade-row-${g.id}`}
                      key={g.id}
                      role="row"
                      tabIndex={0}
                      aria-rowindex={idx + 2}
                      aria-selected={isActive}
                      onClick={() => !isPrintMode && setActiveStudentId(g.studentId)}
                      onKeyDown={(e) => handleRowKeyDown(e, idx, g.studentId)}
                      className={`transition cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none ${
                        !isPrintMode && isActive ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2 font-bold text-indigo-700">{g.studentId === 'usr-stu-1' ? 'CS-SEC-0042' : g.studentId === 'usr-stu-2' ? 'CS-SEC-0043' : g.studentId === 'usr-stu-3' ? 'CS-SEC-0044' : 'CS-SEC-0045'}</td>
                      <td className="p-2 font-sans font-bold text-slate-800 uppercase">{g.studentName}</td>
                      
                      {/* Inputs or Printable Static Text based on config */}
                      {caConfiguration === '4_CA' ? (
                        <>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? scores.ca1 : (
                              <input
                                id={`grade-input-${g.id}-ca1`}
                                type="number"
                                value={scores.ca1}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={10}
                                aria-label={`CA 1 score for ${g.studentName}, maximum 10 marks`}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={scores.ca1}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca1')}
                                onChange={(e) => handleScoreChange(g.id, 'ca1', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? scores.ca2 : (
                              <input
                                id={`grade-input-${g.id}-ca2`}
                                type="number"
                                value={scores.ca2}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={10}
                                aria-label={`CA 2 score for ${g.studentName}, maximum 10 marks`}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={scores.ca2}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca2')}
                                onChange={(e) => handleScoreChange(g.id, 'ca2', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? (scores.ca3 !== undefined ? scores.ca3 : 0) : (
                              <input
                                id={`grade-input-${g.id}-ca3`}
                                type="number"
                                value={scores.ca3 !== undefined ? scores.ca3 : 0}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={10}
                                aria-label={`CA 3 score for ${g.studentName}, maximum 10 marks`}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={scores.ca3 !== undefined ? scores.ca3 : 0}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca3')}
                                onChange={(e) => handleScoreChange(g.id, 'ca3', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? (scores.ca4 !== undefined ? scores.ca4 : 0) : (
                              <input
                                id={`grade-input-${g.id}-ca4`}
                                type="number"
                                value={scores.ca4 !== undefined ? scores.ca4 : 0}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={10}
                                aria-label={`CA 4 score for ${g.studentName}, maximum 10 marks`}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={scores.ca4 !== undefined ? scores.ca4 : 0}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca4')}
                                onChange={(e) => handleScoreChange(g.id, 'ca4', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? scores.ca1 : (
                              <input
                                id={`grade-input-${g.id}-ca1`}
                                type="number"
                                value={scores.ca1}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={20}
                                aria-label={`CA 1 score for ${g.studentName}, maximum 20 marks`}
                                aria-valuemin={0}
                                aria-valuemax={20}
                                aria-valuenow={scores.ca1}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca1')}
                                onChange={(e) => handleScoreChange(g.id, 'ca1', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                          <td className="p-1.5 bg-blue-50/10 text-center font-bold text-slate-800">
                            {isPrintMode ? scores.ca2 : (
                              <input
                                id={`grade-input-${g.id}-ca2`}
                                type="number"
                                value={scores.ca2}
                                disabled={!hasWriteAccess}
                                min={0}
                                max={20}
                                aria-label={`CA 2 score for ${g.studentName}, maximum 20 marks`}
                                aria-valuemin={0}
                                aria-valuemax={20}
                                aria-valuenow={scores.ca2}
                                onKeyDown={(e) => handleCellKeyDown(e, idx, 'ca2')}
                                onChange={(e) => handleScoreChange(g.id, 'ca2', e.target.value)}
                                className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                              />
                            )}
                          </td>
                        </>
                      )}

                      {/* Exam Input */}
                      <td className="p-1.5 text-center font-bold text-slate-800">
                        {isPrintMode ? scores.exam : (
                          <input
                            id={`grade-input-${g.id}-exam`}
                            type="number"
                            value={scores.exam}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={examMax}
                            aria-label={`Exam score for ${g.studentName}, maximum ${examMax} marks`}
                            aria-valuemin={0}
                            aria-valuemax={examMax}
                            aria-valuenow={scores.exam}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 'exam')}
                            onChange={(e) => handleScoreChange(g.id, 'exam', e.target.value)}
                            className="w-13 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition"
                          />
                        )}
                      </td>

                      {/* Total Score */}
                      <td className="p-2 text-center font-black text-slate-900 text-sm bg-indigo-50/70">
                        {g.totalScore}
                      </td>

                      {/* Grade Badge */}
                      <td className="p-2 text-center">
                        <span 
                          className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeBadgeStyle(g.gradeLetter)}`}
                          aria-label={`Grade ${g.gradeLetter}`}
                        >
                          {g.gradeLetter}
                        </span>
                      </td>

                      {/* AI Remark */}
                      <td className="p-2 font-sans font-bold text-[9px] text-slate-600 max-w-[220px] uppercase">
                        <div className="flex items-center justify-between gap-1.5 group">
                          <span className="truncate" title={g.remark}>{g.remark}</span>
                          {!isPrintMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegenerateRemark(g.id);
                              }}
                              className="no-print p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded transition shrink-0 cursor-pointer shadow-2xs hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
                              aria-label={`Regenerate AI academic remark for ${g.studentName}`}
                              title="Regenerate AI remark for this student"
                            >
                              <RefreshCw className="w-3 h-3 text-indigo-600 hover:rotate-180 transition-transform duration-300" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Official Signatures Footer in Print Mode */}
            {isPrintMode && (
              <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-[10px] font-bold text-slate-500 font-mono uppercase">
                <div>
                  <p className="text-slate-800 font-sans text-xs">Mrs. Folasade Adebayo</p>
                  <p className="text-slate-400">Classroom Cohort Registrar</p>
                  <div className="border-b border-dashed border-slate-400 w-36 pt-4"></div>
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-sans text-xs">Corner Streams Governance</p>
                  <p className="text-slate-400">Official Stamp & Seal</p>
                  <div className="border border-slate-300 rounded p-1 w-24 mx-auto mt-2 text-[8px] font-black text-indigo-900 bg-slate-50">
                    VERIFIED A4 DOCKET
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-800 font-sans text-xs">Chief David K. Macaulay</p>
                  <p className="text-slate-400">Principal Administrator Signature</p>
                  <div className="border-b border-dashed border-slate-400 w-36 pt-4 ml-auto"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT WORKSPACE: REGULATION DIGITAL PASSPORT / AI PERFORMANCE TRENDS (Hidden in Print Mode) */}
        {!isPrintMode && (
          <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col shrink-0 overflow-y-auto print:hidden">
            {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setRightTab('passport')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
              rightTab === 'passport' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Biometrics
          </button>
          <button
            type="button"
            onClick={() => setRightTab('ai_analysis')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
              rightTab === 'ai_analysis' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI Insights
          </button>
        </div>

        {rightTab === 'passport' ? (
          <>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Passport Management
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Zero-Paper regulatory requirement: manage official identity passport images.
              </p>
            </div>

            {/* Selected student status */}
            <div className="flex flex-col items-center text-center space-y-3">
              
              <div className="relative group">
                <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-indigo-600 shadow-md bg-slate-100 flex items-center justify-center">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                </div>

                {hasWriteAccess && (
                  <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white cursor-pointer shadow hover:bg-indigo-700 transition">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase">
                  {selectedStudent.username === 'usr-stu-1' ? 'CS-SEC-0042' : selectedStudent.username === 'usr-stu-2' ? 'CS-SEC-0043' : selectedStudent.username === 'usr-stu-3' ? 'CS-SEC-0044' : 'CS-SEC-0045'}
                </span>
                <h4 className="text-sm font-bold text-slate-800 uppercase mt-1 leading-none">{selectedStudent.fullName}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1">{selectedStudent.gradeLevel} • {selectedStudent.classCohort}</p>
              </div>

              <div className="w-full border-t border-slate-100 pt-3 flex flex-col items-start text-left space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between w-full">
                  <span className="text-slate-400">TERM WORK</span>
                  <span className="font-bold text-slate-700">{studentGradeRecord ? studentGradeRecord.totalScore : 0} / 100</span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="text-slate-400">LETTER GRADE</span>
                  <span className="font-black text-indigo-600">{studentGradeRecord ? studentGradeRecord.gradeLetter : '--'}</span>
                </div>
              </div>
            </div>

            {/* Drag and Drop Box - active only for class teacher/admins */}
            {hasWriteAccess ? (
              <div className="mt-5 space-y-3">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                    dragActive
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40'
                  }`}
                >
                  <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">
                    Drag passport image
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">
                    or click camera icon above to locate JPG/PNG
                  </p>
                </div>

                {successMsg && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-mono flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 bg-slate-50 border border-slate-100 rounded p-3 text-[10px] text-slate-500 font-mono leading-relaxed">
                <span className="font-bold">PASSPORT RESTRICTION:</span>
                <p className="mt-0.5">
                  Only authorized Class Teachers and System Admins may perform biometric passport overrides. Physical registers are retired.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-3 mb-4 shrink-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                AI Grade Analyst
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Deep semantic audit of class term results with Chinonye Trajectory &amp; Performance Advisory.
              </p>
            </div>

            {/* Analysis State Logic */}
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 animate-pulse">Analyzing Registry...</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Synthesizing Continuous Assessment (CA) and terminal examination scores to map learning curves.</p>
                </div>
              </div>
            ) : analysisError ? (
              <div className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-800">Analysis Failed</h4>
                  <p className="text-[10px] text-rose-600 font-mono">{analysisError}</p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeGrades}
                  className="px-3 py-1.5 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Analysis
                </button>
              </div>
            ) : !analysisData ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-3 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Audit Student Trends</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Compute overall class performance averages, pass ratios, learning friction markers, and personalized remedial checklists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeGrades}
                  className="w-full py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-90 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Audit Grade Records
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-left">
                    <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider">Class Avg</span>
                    <p className="text-base font-black text-indigo-950 mt-0.5">{analysisData.metrics.classAverage}%</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-left">
                    <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider">Pass Ratio</span>
                    <p className="text-base font-black text-emerald-600 mt-0.5">{analysisData.metrics.passRate}%</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl col-span-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider">High Achiever</span>
                      <span className="text-[9px] font-mono font-black text-indigo-600 uppercase">{analysisData.metrics.highestScore}/100</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 truncate uppercase mt-0.5">{analysisData.metrics.highestScoringStudent}</p>
                  </div>
                </div>

                {/* Summary text */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-left text-[10.5px] leading-relaxed text-slate-600 italic">
                  "{analysisData.summary}"
                </div>

                {/* Performance Cohorts */}
                <div className="space-y-2.5 text-left flex-1 overflow-y-auto pr-1">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono mb-1.5">Learning Cohorts</h4>
                    <div className="space-y-2">
                      {analysisData.performanceCohorts.map((cohort: any, idx: number) => {
                        const isHigh = cohort.categoryName.toLowerCase().includes('outstanding') || cohort.categoryName.toLowerCase().includes('high') || cohort.categoryName.includes('A');
                        const isLow = cohort.categoryName.toLowerCase().includes('urgent') || cohort.categoryName.toLowerCase().includes('intervention') || cohort.categoryName.includes('E/F');
                        
                        return (
                          <div key={idx} className="p-2 border border-slate-100 rounded-xl bg-white space-y-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono border ${
                              isHigh 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : isLow 
                                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                              {cohort.categoryName}
                            </span>
                            <p className="text-[9px] font-bold text-slate-700 font-sans uppercase">
                              {cohort.studentNames.join(', ')}
                            </p>
                            <p className="text-[9.5px] text-slate-400 font-sans leading-normal">
                              {cohort.insight}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Learning Bottlenecks */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono mb-1.5">Learning Friction Gaps</h4>
                    <div className="space-y-1.5">
                      {analysisData.learningGaps.map((gap: any, idx: number) => {
                        const isHigh = gap.impactLevel.toLowerCase() === 'high';
                        return (
                          <div key={idx} className="p-2 border border-slate-100 rounded-xl bg-white flex items-start gap-2">
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHigh ? 'text-rose-500' : 'text-amber-500'}`} />
                            <div className="space-y-0.5">
                              <p className="text-[9.5px] text-slate-600 font-medium leading-relaxed">{gap.gapDescription}</p>
                              <span className={`inline-block text-[7.5px] font-black uppercase font-mono ${isHigh ? 'text-rose-600' : 'text-amber-600'}`}>
                                Impact: {gap.impactLevel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono mb-1.5">Actionable Recommendations</h4>
                    <div className="space-y-2">
                      {analysisData.actionableRecommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1 text-left">
                          <div className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[8px] font-black uppercase tracking-wider font-mono text-indigo-700">
                              {rec.target}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-600 font-medium leading-relaxed">
                            {rec.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Regenerate Trigger */}
                <button
                  type="button"
                  onClick={handleAnalyzeGrades}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-widest rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {/* EDIT GRADING SYSTEM MODAL */}
    <GradingSystemModal
      isOpen={isGradingModalOpen}
      onClose={() => setIsGradingModalOpen(false)}
    />
  </div>
</div>
);
}
