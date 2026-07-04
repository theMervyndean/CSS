/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../../types';
import { BookOpen, Clock, AlertTriangle, CheckCircle, RefreshCw, Power, Award, ArrowRight, BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';

interface StudentCbtViewProps {
  currentProfile: UserProfile;
  exams: CbtExam[];
  sessions: CbtSessionState[];
  onCompleteExam: (session: CbtSessionState) => void;
  onRestartSession: (examId: string) => void;
  releaseScores: boolean;
  passBenchmark: number;
  activeNavOverride?: string;
}

export default function StudentCbtView({
  currentProfile,
  exams,
  sessions,
  onCompleteExam,
  onRestartSession,
  releaseScores,
  passBenchmark,
  activeNavOverride
}: StudentCbtViewProps) {
  const [selectedExam, setSelectedExam] = useState<CbtExam | null>(null);
  const [activeSession, setActiveSession] = useState<CbtSessionState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [crashSimulated, setCrashSimulated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load or initialize active student session for the selected exam
  useEffect(() => {
    if (selectedExam) {
      const storageKey = `CS_CBT_SESSION_${currentProfile.username}_${selectedExam.id}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CbtSessionState;
          if (parsed.isCompleted) {
            setSubmitted(true);
          } else {
            setSubmitted(false);
          }
          setActiveSession(parsed);
        } catch (e) {
          initializeNewSession();
        }
      } else {
        initializeNewSession();
      }
    } else {
      setActiveSession(null);
      setSubmitted(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedExam, currentProfile]);

  const initializeNewSession = () => {
    if (!selectedExam) return;
    const newSession: CbtSessionState = {
      examId: selectedExam.id,
      studentId: currentProfile.id,
      answers: {},
      timeLeftSeconds: selectedExam.durationMinutes * 60,
      isCompleted: false,
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    };
    saveSession(newSession);
    setActiveSession(newSession);
    setSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const saveSession = (state: CbtSessionState) => {
    if (selectedExam) {
      const storageKey = `CS_CBT_SESSION_${currentProfile.username}_${selectedExam.id}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  };

  // Live Timer Loop with persistence save
  useEffect(() => {
    if (activeSession && !activeSession.isCompleted && !submitted && !crashSimulated) {
      timerRef.current = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          if (prev.timeLeftSeconds <= 1) {
            clearInterval(timerRef.current!);
            const finalSession = {
              ...prev,
              timeLeftSeconds: 0,
              isCompleted: true,
              lastSavedAt: new Date().toISOString(),
            };
            saveSession(finalSession);
            setSubmitted(true);
            
            // Calculate and submit score
            const calculatedScore = calculateScore(finalSession);
            onCompleteExam({ ...finalSession, score: calculatedScore });
            return finalSession;
          }

          const updated = {
            ...prev,
            timeLeftSeconds: prev.timeLeftSeconds - 1,
            lastSavedAt: new Date().toISOString(),
          };
          
          saveSession(updated);
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession, submitted, crashSimulated]);

  const calculateScore = (sessionState: CbtSessionState): number => {
    if (!selectedExam) return 0;
    let totalMarksEarned = 0;
    let totalMarksPossible = 0;
    
    selectedExam.questions.forEach((q) => {
      totalMarksPossible += q.marks;
      if (sessionState.answers[q.id] === q.correctOptionIndex) {
        totalMarksEarned += q.marks;
      }
    });

    return Math.round((totalMarksEarned / totalMarksPossible) * 100);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (!activeSession || submitted || !selectedExam) return;

    const updatedAnswers = {
      ...activeSession.answers,
      [selectedExam.questions[currentQuestionIndex].id]: optionIndex,
    };

    const updatedSession = {
      ...activeSession,
      answers: updatedAnswers,
      lastSavedAt: new Date().toISOString(),
    };

    setActiveSession(updatedSession);
    saveSession(updatedSession);
  };

  const handleSubmitExam = () => {
    if (!activeSession || !selectedExam) return;
    
    const score = calculateScore(activeSession);
    const completedSession = {
      ...activeSession,
      isCompleted: true,
      score,
      lastSavedAt: new Date().toISOString(),
    };

    setActiveSession(completedSession);
    saveSession(completedSession);
    setSubmitted(true);
    onCompleteExam(completedSession);
    toast.success("Examination Sheet submitted successfully!");
  };

  const simulateBrowserCrash = () => {
    setCrashSimulated(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const recoverFromCrash = () => {
    setCrashSimulated(false);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // 1. Dashboard Exam Selection View
  if (!selectedExam) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-black uppercase text-indigo-950 font-display tracking-tight">Computer Based Testing Center</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select an examination, run diagnostics, and commence verified testing.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1 rounded-lg font-bold font-mono">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            CBT TERMINAL STABLE
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-950 rounded-2xl p-5 text-white border border-indigo-900 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-900/30 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500 text-indigo-950 font-black tracking-widest uppercase">Resiliency v1.0.4 Active</span>
              <h3 className="text-sm font-bold uppercase tracking-tight">Zero-Paper Assessment Resiliency Protocol</h3>
              <p className="text-[11px] text-indigo-200 leading-relaxed">
                If your browser refreshes, device loses power, or your internet disconnects, **do not panic**. The assessment engine records your selections and timer coordinates securely to local caches. Re-opening this tab recovers your state exactly where you left off.
              </p>
            </div>
            <div className="bg-indigo-900/60 border border-indigo-800 rounded-xl p-3 text-center shrink-0">
              <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">Your Candidate Code</p>
              <p className="text-base font-black font-mono tracking-widest text-emerald-400 mt-1">{currentProfile.username}</p>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Active Campus Assessments</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              // Check if student has already completed this exam
              const matchingSession = sessions.find(
                (s) => s.examId === exam.id && s.studentId === currentProfile.id && s.isCompleted
              );
              
              const isFinished = !!matchingSession;

              return (
                <div 
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold uppercase">
                        {exam.subject}
                      </span>
                      {isFinished ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          ACTIVE EXAM
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight leading-snug">
                      {exam.title}
                    </h4>

                    <div className="flex gap-4 text-[10px] text-slate-400 font-mono font-bold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.questions.length} Multiple Choice</span>
                      </div>
                    </div>
                  </div>

                  {/* Action / Outcome footer */}
                  <div className="border-t border-slate-100 mt-4 pt-3.5 flex items-center justify-between">
                    {isFinished ? (
                      <div className="w-full flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono font-bold">Grading Outcome</span>
                          {releaseScores ? (
                            <p className="text-xs font-black text-slate-900 font-mono">
                              SCORE: <span className={matchingSession.score && matchingSession.score >= passBenchmark ? "text-emerald-600" : "text-rose-600"}>
                                {matchingSession.score}%
                              </span> 
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({matchingSession.score && matchingSession.score >= passBenchmark ? "PASSED" : "FAILED"})
                              </span>
                            </p>
                          ) : (
                            <p className="text-[10.5px] font-bold text-rose-500 flex items-center gap-1">
                              🔒 RELEASE BLOCKED BY ADMIN
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            onRestartSession(exam.id);
                            setSelectedExam(exam);
                          }}
                          className="px-3 py-1.5 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-indigo-50 transition"
                        >
                          Simulate Retake
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex justify-end">
                        <button
                          onClick={() => setSelectedExam(exam)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          <span>Commence Exam</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {exams.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold uppercase tracking-wider">No active examinations registered</p>
                <p className="text-[11px] text-slate-400">Class subject experts have not uploaded testing templates for this class yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Browser Crash View
  if (crashSimulated) {
    return (
      <div className="p-8 bg-zinc-950 text-emerald-400 font-mono rounded-2xl border border-zinc-800 flex flex-col justify-between h-full min-h-[460px] animate-in fade-in duration-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-500 border-b border-zinc-800 pb-3">
            <Power className="w-8 h-8 animate-pulse text-rose-500" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-500">CRITICAL SYSTEM SHUTDOWN SIMULATED</h3>
              <p className="text-[10px] text-zinc-500">Browser Crash / Power Outage / Device De-authentication</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-zinc-300">
            [SYS_LOG] System power cut-off at {new Date().toLocaleTimeString()}...
            <br />
            [SYS_LOG] Flushing active memory registers to persistent Storage Cache...
            <br />
            [SYS_LOG] Sandbox serial state: 
            <span className="text-emerald-300 font-bold ml-1">
              {JSON.stringify(activeSession?.answers || {})}
            </span>
            <br />
            [SYS_LOG] Freeze timer slice remaining: 
            <span className="text-emerald-300 font-bold ml-1">
              {activeSession ? formatTime(activeSession.timeLeftSeconds) : 'N/A'}
            </span>
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
            <span className="font-bold text-white uppercase tracking-wider">RECOVERY ASSURANCE:</span>
            <p className="mt-1">
              Because of our **Zero-Paper Network Resiliency protocol**, the student did not lose a single answer coordinate or tick, nor any time. When the device powers back on, their workspace restores perfectly.
            </p>
          </div>
        </div>
        <button
          onClick={recoverFromCrash}
          className="mt-6 w-full py-2 bg-emerald-500 text-black text-[11px] font-black uppercase rounded tracking-widest hover:bg-emerald-400 transition"
        >
          Power System Back On & Restore Exam state
        </button>
      </div>
    );
  }

  // 3. Submitted / Assessment Finished View
  if (submitted || activeSession?.isCompleted) {
    const finalScore = activeSession?.score ?? 0;
    const isPassed = finalScore >= passBenchmark;

    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[460px] animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">CBT ASSESSMENT SHEET SUBMITTED</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Excellent effort, <span className="font-bold text-indigo-600">{currentProfile.fullName}</span>! Your exam paper has been securely sync-locked to the server database.
        </p>
        
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-[11px] text-left max-w-md w-full space-y-2.5 shadow-inner">
          <div className="flex justify-between border-b border-slate-250 pb-1.5">
            <span className="text-slate-400 text-[10px]">STUDENT ID</span>
            <span className="font-bold text-slate-700 font-mono">{currentProfile.username}</span>
          </div>
          <div className="flex justify-between border-b border-slate-250 pb-1.5">
            <span className="text-slate-400 text-[10px]">SUBJECT NAME</span>
            <span className="font-bold text-slate-700">{selectedExam.subject}</span>
          </div>
          <div className="flex justify-between border-b border-slate-250 pb-1.5">
            <span className="text-slate-400 text-[10px]">ASSESSMENT TITLE</span>
            <span className="font-bold text-slate-700 max-w-[240px] truncate">{selectedExam.title}</span>
          </div>
          <div className="flex justify-between border-b border-slate-250 pb-1.5">
            <span className="text-slate-400 text-[10px]">TIME SPENT</span>
            <span className="font-bold text-slate-700 font-mono">
              {formatTime(selectedExam.durationMinutes * 60 - (activeSession?.timeLeftSeconds || 0))}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400 text-[10px]">RELEASE GRADE STATUS</span>
            {releaseScores ? (
              <div className="text-right">
                <span className={`font-black font-mono text-sm ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                  {finalScore}% ({isPassed ? "PASSED" : "FAILED"})
                </span>
              </div>
            ) : (
              <span className="text-rose-500 font-bold uppercase animate-pulse text-[10px]">🔒 LOCKADE ENFORCED BY ADMIN</span>
            )}
          </div>
        </div>

        {!releaseScores && (
          <p className="text-[10px] italic text-slate-400 mt-4 max-w-xs">
            Academic security is active. Your grade total has been saved but remains locked from student views until global compilation publish.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setSelectedExam(null)}
            className="text-[10px] font-black uppercase text-slate-500 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition-all"
          >
            Go Back to CBT Desk
          </button>
          <button
            onClick={initializeNewSession}
            className="text-[10px] font-black uppercase text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all"
          >
            Reset Demo Attempt
          </button>
        </div>
      </div>
    );
  }

  // 4. In-Assessment Test Engine View
  const currentQuestion = selectedExam.questions[currentQuestionIndex];
  const selectedOption = activeSession?.answers[currentQuestion?.id] ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-full overflow-hidden min-h-[460px] animate-in slide-in-from-bottom duration-300">
      {/* Top Session Status Bar */}
      <div className="p-3.5 bg-indigo-950 text-white flex justify-between items-center shrink-0 border-b border-indigo-900">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded text-[8.5px] bg-emerald-500 text-indigo-950 font-black tracking-widest uppercase">
            ASSESSMENT LIVE
          </span>
          <span className="text-xs font-bold text-indigo-200 truncate max-w-[180px] sm:max-w-[320px]">
            {selectedExam.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20 text-xs font-bold font-mono text-rose-400">
            <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="font-bold">{activeSession ? formatTime(activeSession.timeLeftSeconds) : '00:00'}</span>
          </div>
          <button
            onClick={simulateBrowserCrash}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[9.5px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer"
            title="Simulate a browser crash to test zero-loss resiliency"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Crash Test
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-1 bg-slate-100 shrink-0">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / selectedExam.questions.length) * 100}%` }}
        />
      </div>

      {/* Student credentials bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0 font-bold">
        <span>Student: <span className="text-indigo-950">{currentProfile.fullName}</span></span>
        <span>Question {currentQuestionIndex + 1} of {selectedExam.questions.length}</span>
      </div>

      {/* Main question workspace */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        <div className="space-y-2">
          <span className="text-[9.5px] font-extrabold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md">
            {currentQuestion.marks} MARKS ACCRUED
          </span>
          <h4 className="text-base font-bold text-slate-900 leading-relaxed font-display">
            {currentQuestion.text}
          </h4>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full p-4 text-left text-xs rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 font-bold text-emerald-950 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[10.5px] transition-all duration-150 ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium text-slate-850">{option}</span>
                </div>
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentQuestionIndex((p) => Math.min(selectedExam.questions.length - 1, p + 1))}
            disabled={currentQuestionIndex === selectedExam.questions.length - 1}
            className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 transition cursor-pointer"
          >
            Next
          </button>
        </div>

        <div>
          {currentQuestionIndex === selectedExam.questions.length - 1 ? (
            <button
              onClick={handleSubmitExam}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer hover:shadow"
            >
              Submit Answer Sheet
            </button>
          ) : (
            <span className="text-[9px] text-slate-400 font-mono italic font-bold">
              * Auto-saved locally.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
