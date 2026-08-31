/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../types';
import { mockExams, mockUsers } from '../mockData';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Layers, Send } from 'lucide-react';

// Import our specialized modular views
import StudentCbtView from './cbt/StudentCbtView';
import TeacherCbtView from './cbt/TeacherCbtView';
import AdminCbtView from './cbt/AdminCbtView';
import ParentCbtView from './cbt/ParentCbtView';
import InteractivePlanComparisonModal from './InteractivePlanComparisonModal';
import { CbtFocusModeButton } from './CbtFocusModeBanner';

interface CbtExamEngineProps {
  currentProfile: UserProfile;
  onLogout?: () => void;
  activeTabOverride?: string;
  theme?: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple';
  setTheme?: (theme: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple') => void;
  activeFont?: string;
  setActiveFont?: (font: string) => void;
}

export default function CbtExamEngine({ 
  currentProfile, 
  onLogout, 
  activeTabOverride,
  theme,
  setTheme,
  activeFont,
  setActiveFont
}: CbtExamEngineProps) {
  const [exams, setExams] = useState<CbtExam[]>([]);
  const [sessions, setSessions] = useState<CbtSessionState[]>([]);
  const [releaseScores, setReleaseScores] = useState<boolean>(false);
  const [passBenchmark, setPassBenchmark] = useState<number>(50);

  // CBT Stream Tier State (Starter vs Pro)
  const [isPlanComparisonOpen, setIsPlanComparisonOpen] = useState<boolean>(false);
  const [cbtTier, setCbtTier] = useState<'starter' | 'pro'>(() => {
    const saved = localStorage.getItem('CS_CBT_STREAM_TIER');
    return (saved as 'starter' | 'pro') || 'pro';
  });

  const handleToggleCbtTier = (tier: 'starter' | 'pro') => {
    setCbtTier(tier);
    localStorage.setItem('CS_CBT_STREAM_TIER', tier);
    toast.success(`CBT Stream switched to ${tier === 'starter' ? 'CBT STARTER (Taking & Sending Results to Teachers)' : 'CBT PRO (Digital Question Creation & Results Modifications)'}`);
  };

  // Dynamic students list state with localStorage persistence
  const [students, setStudents] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('CS_CBT_STUDENTS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return mockUsers.filter((u) => u.role === 'Student');
  });

  // Dynamic classesList state with localStorage persistence
  const [classesList, setClassesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('CS_CBT_CLASSES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return ["SS 2A", "SS 1B", "JSS 3", "Primary 5", "Primary 2"];
  });

  const handleAddClass = (className: string) => {
    const trimmed = className.trim();
    if (!trimmed) return;
    if (classesList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Class "${trimmed}" already exists.`);
      return;
    }
    const updated = [...classesList, trimmed];
    setClassesList(updated);
    localStorage.setItem('CS_CBT_CLASSES', JSON.stringify(updated));
    toast.success(`Successfully created class: ${trimmed}`);
  };

  const handleAddStudent = (newStudent: UserProfile) => {
    // Check for duplicate username
    if (students.some(s => s.username.toLowerCase() === newStudent.username.toLowerCase())) {
      toast.error(`A student with Candidate ID "${newStudent.username}" already exists.`);
      return;
    }
    const updated = [...students, newStudent];
    setStudents(updated);
    localStorage.setItem('CS_CBT_STUDENTS', JSON.stringify(updated));
    toast.success(`Successfully registered candidate: ${newStudent.fullName}`);
  };

  // Initialize DB data from localStorage or mock values on startup
  useEffect(() => {
    // 1. Initialize Exams
    const savedExams = localStorage.getItem('CS_CBT_EXAMS');
    let loadedExams: CbtExam[] = [];
    if (savedExams) {
      try {
        loadedExams = JSON.parse(savedExams);
      } catch (e) {
        loadedExams = mockExams;
      }
    } else {
      loadedExams = mockExams;
      localStorage.setItem('CS_CBT_EXAMS', JSON.stringify(mockExams));
    }
    setExams(loadedExams);

    // 2. Initialize Policy Settings
    const savedRelease = localStorage.getItem('CS_CBT_RELEASE_SCORES');
    if (savedRelease) {
      setReleaseScores(savedRelease === 'true');
    } else {
      localStorage.setItem('CS_CBT_RELEASE_SCORES', 'false');
    }

    const savedBenchmark = localStorage.getItem('CS_CBT_PASS_BENCHMARK');
    if (savedBenchmark) {
      setPassBenchmark(Number(savedBenchmark));
    } else {
      localStorage.setItem('CS_CBT_PASS_BENCHMARK', '50');
    }

    // 3. Initialize Student Sessions
    const savedSessions = localStorage.getItem('CS_CBT_ALL_SESSIONS');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        initializeDefaultSessions();
      }
    } else {
      initializeDefaultSessions();
    }
  }, []);

  const initializeDefaultSessions = () => {
    // Pre-populate completed sessions for Jeremiah, Chibuzor, and Dada
    const defaultSessions: CbtSessionState[] = [
      {
        examId: 'ex-01',
        studentId: 'usr-stu-2', // Jeremiah David Benson
        answers: {
          q1: 0, // correct
          q2: 2, // correct
          q3: 0, // correct
          q4: 1  // wrong (correct is 2)
        },
        timeLeftSeconds: 240,
        isCompleted: true,
        score: 75,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastSavedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 360000).toISOString()
      },
      {
        examId: 'ex-01',
        studentId: 'usr-stu-3', // Chibuzor Emeka Silas
        answers: {
          q1: 1, // wrong
          q2: 2, // correct
          q3: 1, // wrong
          q4: 2  // correct
        },
        timeLeftSeconds: 120,
        isCompleted: true,
        score: 50,
        startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastSavedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 480000).toISOString()
      },
      {
        examId: 'ex-01',
        studentId: 'usr-stu-4', // Dada Oluwaseun Emmanuel
        answers: {
          q1: 0, // correct
          q2: 2, // correct
          q3: 0, // correct
          q4: 2  // correct
        },
        timeLeftSeconds: 380,
        isCompleted: true,
        score: 100,
        startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        lastSavedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 220000).toISOString()
      }
    ];

    localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(defaultSessions));
    setSessions(defaultSessions);

    // Also set specific student local keys to match persistence flow
    defaultSessions.forEach((s) => {
      const studentProfile = mockUsers.find((u) => u.id === s.studentId);
      if (studentProfile) {
        const key = `CS_CBT_SESSION_${studentProfile.username}_${s.examId}`;
        localStorage.setItem(key, JSON.stringify(s));
      }
    });
  };

  // State update helpers
  const handleAddExam = (newExam: CbtExam) => {
    const updated = [...exams, newExam];
    setExams(updated);
    localStorage.setItem('CS_CBT_EXAMS', JSON.stringify(updated));
  };

  const handleUpdateExam = (updatedExam: CbtExam) => {
    const updated = exams.map((e) => (e.id === updatedExam.id ? updatedExam : e));
    setExams(updated);
    localStorage.setItem('CS_CBT_EXAMS', JSON.stringify(updated));
  };

  const handleDeleteExam = (examId: string) => {
    const updatedExams = exams.filter((e) => e.id !== examId);
    setExams(updatedExams);
    localStorage.setItem('CS_CBT_EXAMS', JSON.stringify(updatedExams));

    // Clean up attempts for deleted exam
    const updatedSessions = sessions.filter((s) => s.examId !== examId);
    setSessions(updatedSessions);
    localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(updatedSessions));
  };

  const handleCompleteExam = (completedSession: CbtSessionState) => {
    // Check if entry already exists in global log, replace or add
    let updatedSessions = [...sessions];
    const existingIndex = sessions.findIndex(
      (s) => s.examId === completedSession.examId && s.studentId === completedSession.studentId
    );

    if (existingIndex !== -1) {
      updatedSessions[existingIndex] = completedSession;
    } else {
      updatedSessions.push(completedSession);
    }

    setSessions(updatedSessions);
    localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(updatedSessions));
  };

  const handleRestartSession = (examId: string) => {
    // Clear student's specific session key
    const key = `CS_CBT_SESSION_${currentProfile.username}_${examId}`;
    localStorage.removeItem(key);

    // Filter out of global log
    const updated = sessions.filter(
      (s) => !(s.examId === examId && s.studentId === currentProfile.id)
    );
    setSessions(updated);
    localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(updated));
  };

  const handleResetStudentAttempt = (studentId: string, examId: string) => {
    // Clear student's specific session key (find username first)
    const studentObj = mockUsers.find((u) => u.id === studentId);
    if (studentObj) {
      const key = `CS_CBT_SESSION_${studentObj.username}_${examId}`;
      localStorage.removeItem(key);
    }

    // Filter out of global log
    const updated = sessions.filter(
      (s) => !(s.examId === examId && s.studentId === studentId)
    );
    setSessions(updated);
    localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(updated));
  };

  const handleToggleReleaseScores = () => {
    const nextVal = !releaseScores;
    setReleaseScores(nextVal);
    localStorage.setItem('CS_CBT_RELEASE_SCORES', String(nextVal));
  };

  const handleUpdatePassBenchmark = (benchmark: number) => {
    setPassBenchmark(benchmark);
    localStorage.setItem('CS_CBT_PASS_BENCHMARK', String(benchmark));
  };

  // RENDER BASED ON USER ROLE
  const renderDashboardByRole = () => {
    switch (currentProfile.role) {
      case 'Student':
        return (
          <StudentCbtView
            currentProfile={currentProfile}
            exams={exams}
            sessions={sessions}
            onCompleteExam={handleCompleteExam}
            onRestartSession={handleRestartSession}
            releaseScores={releaseScores}
            passBenchmark={passBenchmark}
            activeNavOverride={activeTabOverride}
          />
        );

      case 'Class_Teacher':
      case 'Non_Class_Teacher':
        return (
          <TeacherCbtView
            currentProfile={currentProfile}
            exams={exams}
            sessions={sessions}
            students={students}
            onAddExam={handleAddExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
            passBenchmark={passBenchmark}
            activeNavOverride={activeTabOverride}
          />
        );

      case 'School_Admin':
      case 'Super_Admin':
        return (
          <AdminCbtView
            currentProfile={currentProfile}
            exams={exams}
            sessions={sessions}
            students={students}
            onDeleteExam={handleDeleteExam}
            onUpdateExam={handleUpdateExam}
            onResetStudentAttempt={handleResetStudentAttempt}
            releaseScores={releaseScores}
            onToggleReleaseScores={handleToggleReleaseScores}
            passBenchmark={passBenchmark}
            onUpdatePassBenchmark={handleUpdatePassBenchmark}
            onLogout={onLogout}
            activeNavOverride={activeTabOverride}
            classesList={classesList}
            onAddClass={handleAddClass}
            onAddStudent={handleAddStudent}
            theme={theme}
            setTheme={setTheme}
            activeFont={activeFont}
            setActiveFont={setActiveFont}
          />
        );

      case 'Parent':
        return (
          <ParentCbtView
            currentProfile={currentProfile}
            exams={exams}
            sessions={sessions}
            students={students}
            releaseScores={releaseScores}
            passBenchmark={passBenchmark}
            activeNavOverride={activeTabOverride}
          />
        );

      default:
        return (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            Unrecognized role. No CBT access controls mapped for this persona.
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-0 sm:p-2 space-y-6">
      {/* CBT Stream Tier Banner & Version Control Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${cbtTier === 'pro' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
            {cbtTier === 'pro' ? <Zap className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                CBT Stream {cbtTier === 'pro' ? 'PRO' : 'STARTER'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                cbtTier === 'pro'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {cbtTier === 'pro' ? 'Full Digital Engine' : 'Taking & Direct Submissions'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {cbtTier === 'starter'
                ? 'Starter Version: Students take exams and send digital results directly to subject teachers.'
                : 'Pro Version: Includes digital question authoring, score overrides, result modifications, and broadsheet vault sync.'}
            </p>
          </div>
        </div>

        {/* Focus Mode & Tier Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
          <CbtFocusModeButton />
          
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleToggleCbtTier('starter')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cbtTier === 'starter'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CBT Starter
            </button>
            <button
              onClick={() => handleToggleCbtTier('pro')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cbtTier === 'pro'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CBT Pro
            </button>
          </div>
        </div>
      </div>

      {/* CBT CONCURRENT SEAT USAGE SOFT NUDGE BANNER FOR STARTER TIER */}
      {cbtTier === 'starter' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  CBT Concurrent Test Sessions Cap
                </span>
                <span className="text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 rounded">
                  Starter Cap: 50 Sessions
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                42 / 50 active concurrent test seats filled <strong className="text-amber-300">(84% seat capacity)</strong>. Upgrade to Professional Tier for unlimited concurrent student test sessions &amp; live biometric proctoring.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPlanComparisonOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:opacity-95 text-slate-950 font-mono font-black text-[10.5px] uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Unlock Unlimited Seats</span>
          </button>
        </div>
      )}

      {/* PLAN COMPARISON MODAL */}
      <InteractivePlanComparisonModal
        isOpen={isPlanComparisonOpen}
        onClose={() => setIsPlanComparisonOpen(false)}
      />

      {renderDashboardByRole()}
    </div>
  );
}
