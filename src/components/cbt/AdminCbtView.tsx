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
  Printer, FileText, CheckCircle2, ShieldAlert, Plus, X, Download, Upload
} from 'lucide-react';
import { toast } from 'sonner';

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
  onAddStudent
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
  const subjectsList = [
    { code: "MTH401", name: "Mathematics", duration: 10, tutor: "Mrs. Folasade Adebayo" },
    { code: "ENG401", name: "English Language", duration: 15, tutor: "Dr. Emeka Nwosu" },
    { code: "PHY402", name: "Physics", duration: 12, tutor: "Mrs. Folasade Adebayo" },
    { code: "CSC202", name: "Computer Science", duration: 10, tutor: "Dr. Emeka Nwosu" },
    { code: "CIV301", name: "Civics & Resiliency", duration: 8, tutor: "Mrs. Folasade Adebayo" }
  ];

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
                    <button
                      onClick={() => setIsAddClassOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Class</span>
                    </button>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                          <button
                            onClick={() => setSelectedClass(clsName)}
                            className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0 shadow-sm"
                          >
                            <span>Inspect Class Register</span>
                          </button>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
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
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 h-10"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
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
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">Curriculum Subjects Directory</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active syllabus items and assessment parameters synced with our digital CBT templates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectsList.map((subject) => {
                  const subjectExams = exams.filter(e => e.subject.toLowerCase() === subject.name.toLowerCase());
                  const subjectCompleted = sessions.filter(s => {
                    const ex = exams.find(e => e.id === s.examId);
                    return ex?.subject.toLowerCase() === subject.name.toLowerCase() && s.isCompleted;
                  });

                  return (
                    <div key={subject.code} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            {subject.code}
                          </span>
                          <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">
                            {subjectExams.length} Exams Created
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{subject.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Primary Tutor: {subject.tutor}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                          <div>
                            <span className="block font-bold text-slate-400 uppercase tracking-wide">Total Submissions</span>
                            <span className="text-xs font-mono font-black text-slate-800 block mt-0.5">{subjectCompleted.length} Exam Sheets</span>
                          </div>
                          <div>
                            <span className="block font-bold text-slate-400 uppercase tracking-wide">Exam Duration</span>
                            <span className="text-xs font-mono font-black text-emerald-600 block mt-0.5">{subject.duration} Minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">3. Uploaded Examination Papers</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Manage teacher-authored exam templates, toggle grade release status, or remove old entries.
                  </p>
                </div>
                <FolderCheck className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-3">Subject / Exam Title</th>
                      <th className="p-3">Uploaded MCQs</th>
                      <th className="p-3">Exam Duration</th>
                      <th className="p-3">Grade Release Filter</th>
                      <th className="p-3 text-right">Supervisory Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{exam.title}</p>
                          <p className="text-[9.5px] font-bold text-indigo-650 uppercase tracking-wider mt-0.5">{exam.subject}</p>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{exam.questions.length} MCQs</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{exam.durationMinutes} Minutes</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              const updated = { ...exam, published: !exam.published };
                              onUpdateExam(updated);
                              toast.success(`Exam release status updated successfully.`);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
                              exam.published 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100" 
                                : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {exam.published ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Released</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Blocked</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Are you absolutely sure you want to delete this exam paper? This cannot be undone.`)) {
                                onDeleteExam(exam.id);
                                toast.success("Exam paper template deleted successfully.");
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Delete Assessment Template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {exams.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-10 text-slate-400 italic">
                          No examination templates exist in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.filter(e => e.published).map((exam) => {
                    const examAttempts = sessions.filter(s => s.examId === exam.id).length;
                    return (
                      <div key={exam.id} className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
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

                <div className="flex justify-end pt-4 border-t border-slate-150">
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
    </div>
  );
}
