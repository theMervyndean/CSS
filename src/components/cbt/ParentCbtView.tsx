/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../../types';
import { 
  Award, Clock, Calendar, CheckCircle2, XCircle, ChevronDown, Check,
  BookOpen, HelpCircle, ArrowRight, UserCheck, Heart, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ParentCbtViewProps {
  currentProfile: UserProfile;
  exams: CbtExam[];
  sessions: CbtSessionState[];
  students: UserProfile[];
  releaseScores: boolean;
  passBenchmark: number;
  activeNavOverride?: string;
}

export default function ParentCbtView({
  currentProfile,
  exams,
  sessions,
  students,
  releaseScores,
  passBenchmark,
  activeNavOverride
}: ParentCbtViewProps) {
  // Find students linked to this parent
  const parentStudents = students.filter(s => s.parentId === currentProfile.id || (currentProfile.studentIds && currentProfile.studentIds.includes(s.id)));
  
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(
    parentStudents.length > 0 ? parentStudents[0] : null
  );
  
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [inspectedSession, setInspectedSession] = useState<CbtSessionState | null>(null);

  // Filter completed sessions for selected student
  const studentSessions = sessions.filter(
    (s) => s.studentId === (selectedStudent?.id ?? '') && s.isCompleted
  );

  // Stats
  const completedCount = studentSessions.length;
  
  const getAverageScore = () => {
    if (completedCount === 0) return 0;
    const total = studentSessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
    return Math.round(total / completedCount);
  };
  
  const avgScore = getAverageScore();

  // Learning support tips based on question subject
  const getLearningTip = (subject: string, wasCorrect: boolean) => {
    if (wasCorrect) {
      return "Fantastic mastery! Praise your child's effort to promote a growth mindset. Keep encouraging them to tackle advanced challenges.";
    }

    switch (subject.toLowerCase()) {
      case 'mathematics':
        return "Supportive Tip: Review basic formulas together. Try sketching visual representations of quadratic vectors or practice algebraic rearrangements in 5-minute sessions.";
      case 'english language':
        return "Supportive Tip: Read a short story together or discuss articles. Encourage them to explain difficult words and construct sentences out loud.";
      case 'physics':
      case 'chemistry':
      case 'biology':
        return "Supportive Tip: Relate concepts to everyday life. Use kitchen science or nature walks to discuss vectors, state transfers, or biological processes.";
      default:
        return "Supportive Tip: Go through the incorrect options together and work out the right method step-by-step. Praise progress, not just perfect outcomes.";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black uppercase text-indigo-950 font-display tracking-tight">Parent CBT Observation Desk</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track your children's CBT assessment progress, inspect grading logs, and access support tips.</p>
        </div>

        {/* Custom child selector dropdown (NO Native Dropdowns) */}
        {parentStudents.length > 1 && (
          <div className="relative w-full sm:w-auto min-w-[200px] shrink-0">
            <button
              type="button"
              onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
              className="w-full flex justify-between items-center px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selectedStudent?.fullName ?? "Select Child"}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isStudentDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStudentDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                  {parentStudents.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(child);
                        setInspectedSession(null);
                        setIsStudentDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span>{child.fullName}</span>
                      {selectedStudent?.id === child.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectedStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Active Exams list */}
          <div className="lg:col-span-1 space-y-6">
            {/* Child Card summary */}
            <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-2xl p-5 border border-indigo-900 shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.fullName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">{selectedStudent.fullName}</h3>
                  <p className="text-[10.5px] text-indigo-200 font-mono font-bold uppercase">{selectedStudent.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="bg-indigo-900/50 border border-indigo-850 p-2.5 rounded-xl">
                  <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">CBT Average</p>
                  <p className="text-base font-black font-mono text-emerald-400 mt-0.5">{avgScore}%</p>
                </div>
                <div className="bg-indigo-900/50 border border-indigo-850 p-2.5 rounded-xl">
                  <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Tests Completed</p>
                  <p className="text-base font-black font-mono text-emerald-400 mt-0.5">{completedCount}</p>
                </div>
              </div>
            </div>

            {/* Assessment History list */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">CBT Sheet log</h3>
              
              <div className="space-y-3">
                {studentSessions.map((sub, idx) => {
                  const examObj = exams.find((e) => e.id === sub.examId);
                  if (!examObj) return null;

                  const isPassed = (sub.score ?? 0) >= passBenchmark;
                  const isInspected = inspectedSession?.examId === sub.examId;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInspectedSession(sub)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isInspected 
                          ? "bg-indigo-50 border-indigo-400 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase">
                          {examObj.subject}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          {new Date(sub.lastSavedAt || "").toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 uppercase mt-2 leading-snug">
                        {examObj.title}
                      </h4>

                      <div className="border-t border-slate-100/50 mt-3 pt-2.5 flex items-center justify-between w-full">
                        {releaseScores ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Graded Score:</span>
                            <span className={`text-[11px] font-black font-mono ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                              {sub.score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9.5px] font-bold text-rose-500 animate-pulse uppercase tracking-tight">🔒 LOCK ENFORCED</span>
                        )}

                        <span className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-0.5">
                          Inspect Sheet
                          <ArrowRight className="w-3 h-3 text-indigo-600" />
                        </span>
                      </div>
                    </button>
                  );
                })}

                {studentSessions.length === 0 && (
                  <div className="text-center p-6 text-slate-400 text-xs italic">
                    {selectedStudent.fullName} has not completed any computer-based assessments yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Inspector sheet */}
          <div className="lg:col-span-2">
            {inspectedSession ? (
              (() => {
                const examObj = exams.find((e) => e.id === inspectedSession.examId);
                if (!examObj) return null;

                const isPassed = (inspectedSession.score ?? 0) >= passBenchmark;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in slide-in-from-right duration-200">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded">
                          Candidate Audit Sheet
                        </span>
                        <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight mt-1">{examObj.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Review question selections and view diagnostic home support tips.</p>
                      </div>
                      <div className="text-right shrink-0">
                        {releaseScores ? (
                          <div>
                            <p className="text-xl font-black font-mono text-indigo-950">{inspectedSession.score}%</p>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                              isPassed 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                : "bg-rose-50 text-rose-800 border border-rose-100"
                            }`}>
                              {isPassed ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold uppercase animate-pulse">🔒 SCORES MASKED BY SCHOOL</span>
                        )}
                      </div>
                    </div>

                    {/* Question details list */}
                    <div className="space-y-5">
                      {examObj.questions.map((q, idx) => {
                        const selectedOpt = inspectedSession.answers[q.id];
                        const isCorrect = selectedOpt === q.correctOptionIndex;

                        return (
                          <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                              <span className="text-[10px] font-black text-slate-700 font-mono">QUESTION #{idx + 1} ({q.marks}M)</span>
                              {isCorrect ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  CORRECT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  INCORRECT
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-slate-850 leading-relaxed">{q.text}</p>

                            {/* Options with selection indicator */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium">
                              {q.options.map((opt, optIdx) => {
                                const optKey = String.fromCharCode(65 + optIdx);
                                const isUserSelected = selectedOpt === optIdx;
                                const isCorrectKey = q.correctOptionIndex === optIdx;

                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                                      isCorrectKey
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                        : isUserSelected
                                        ? "bg-rose-50 border-rose-300 text-rose-950 font-bold"
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5.5 h-5.5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                        isCorrectKey 
                                          ? "bg-emerald-600 text-white" 
                                          : isUserSelected 
                                          ? "bg-rose-600 text-white" 
                                          : "bg-slate-100 text-slate-500"
                                      }`}>
                                        {optKey}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    
                                    {isCorrectKey && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                    {!isCorrectKey && isUserSelected && (
                                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Learning support diagnostic card */}
                            <div className={`p-3.5 rounded-xl border flex gap-2.5 text-[11px] leading-relaxed ${
                              isCorrect 
                                ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" 
                                : "bg-indigo-50/40 border-indigo-100 text-indigo-900"
                            }`}>
                              {isCorrect ? (
                                <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Heart className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold uppercase text-[9.5px] block mb-0.5">
                                  {isCorrect ? "Encourage Mastery" : "Educational Support Guide"}
                                </span>
                                <p className="font-medium text-[10.5px]">
                                  {getLearningTip(examObj.subject, isCorrect)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center h-full min-h-[300px] flex flex-col justify-center items-center text-slate-400 text-xs italic space-y-2">
                <BookOpen className="w-12 h-12 text-slate-300" />
                <p className="font-bold uppercase">No assessment sheets selected</p>
                <p className="text-[11px] text-slate-400">Click on any graded assessment session in the left-hand log to audit answers and view learning advice.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400">
          No child links mapped to this user profile.
        </div>
      )}
    </div>
  );
}
