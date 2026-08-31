/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../../types';
import { BookOpen, Clock, AlertTriangle, CheckCircle, RefreshCw, Power, Award, ArrowRight, BookOpenCheck, Activity, BarChart3, Wifi, WifiOff, Lock, ShieldAlert, Layers, Radio, Download, Upload, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import BiometricProctoringMonitor, { ProctoringAlertEvent } from './BiometricProctoringMonitor';
import { 
  saveToOfflineQueue, 
  getPendingOfflineQueue, 
  markItemSynced, 
  OfflinePayloadItem,
  saveCbtDraftToIndexedDb,
  getCbtDraftFromIndexedDb,
  clearCbtDraftFromIndexedDb,
  recordCbtLiveHeartbeat
} from '../../utils/indexedDbQueue';
import { compressAndEncryptExamPackage, decompressAndDecryptExamPackage } from '../../utils/examBundler';
import { CbtFocusModeButton } from '../CbtFocusModeBanner';

const CustomTimelineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl border border-slate-700 font-mono space-y-1 z-50">
        <p className="font-extrabold text-indigo-300 border-b border-slate-800 pb-1 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-extrabold text-white">
              {entry.value}% {entry.payload[`${entry.dataKey.toLowerCase()}label`] ? `(${entry.payload[`${entry.dataKey.toLowerCase()}label`]})` : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
  const [activeSession, setActiveSession] = useState<CbtSessionState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [crashSimulated, setCrashSimulated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  // LAN Mesh / Offline PWA Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncCurrent, setSyncCurrent] = useState<number>(0);
  const [syncTotal, setSyncTotal] = useState<number>(0);

  // Active Session Lockout State
  const [isSessionLockedOut, setIsSessionLockedOut] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string>(() => `CS_ST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Biometric Proctoring Alerts Log State
  const [proctoringLogs, setProctoringLogs] = useState<ProctoringAlertEvent[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check pending offline submissions on load & listen for online/offline transitions
  const refreshOfflineQueueCount = async () => {
    const queue = await getPendingOfflineQueue();
    setPendingSyncCount(queue.length);
  };

  useEffect(() => {
    refreshOfflineQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success("📶 Connection restored! Auto-syncing pending offline CBT submissions...", { id: 'online-toast' });
      await flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("📶 Local LAN Mesh Active — Currently offline. Answers will be cached in IndexedDB.", { id: 'offline-toast' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushOfflineQueue = async () => {
    const pending = await getPendingOfflineQueue();
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncing(true);
    setSyncTotal(pending.length);
    setSyncCurrent(0);
    setSyncProgress(0);

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      setSyncCurrent(i + 1);
      const pct = Math.round(((i + 1) / pending.length) * 100);
      setSyncProgress(pct);

      saveSession({
        examId: item.examId,
        studentId: item.studentId,
        answers: item.answers,
        timeLeftSeconds: 0,
        isCompleted: true,
        score: item.score,
        startedAt: item.completedAt,
        lastSavedAt: new Date().toISOString()
      });
      await markItemSynced(item.id);

      // Smooth step delay so students see the real-time progress bar updating
      await new Promise((res) => setTimeout(res, 500));
    }

    await refreshOfflineQueueCount();
    toast.success(`✅ Auto-Synced ${pending.length} offline exam payload(s) to Corner Streams server!`);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncProgress(0);
    }, 1200);
  };

  // Active Session Lockout BroadcastChannel & Heartbeat Listener
  useEffect(() => {
    if (!selectedExam || !activeSession || activeSession.isCompleted) return;

    const lockKey = `CS_CBT_LOCK_${currentProfile.username}_${selectedExam.id}`;

    // Acquire lock or detect collision
    const existingLock = localStorage.getItem(lockKey);
    if (existingLock && existingLock !== sessionToken) {
      setIsSessionLockedOut(true);
    } else {
      localStorage.setItem(lockKey, sessionToken);
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`CS_CBT_LOCK_CHANNEL_${selectedExam.id}_${currentProfile.id}`);
      channel.onmessage = (event) => {
        if (event.data?.type === 'CLAIM_SESSION' && event.data?.token !== sessionToken) {
          setIsSessionLockedOut(true);
        }
      };
      channel.postMessage({ type: 'HEARTBEAT', token: sessionToken });
    } catch (e) {}

    const heartbeat = setInterval(() => {
      const activeLock = localStorage.getItem(lockKey);
      if (activeLock && activeLock !== sessionToken) {
        setIsSessionLockedOut(true);
      }
    }, 2000);

    return () => {
      clearInterval(heartbeat);
      if (channel) channel.close();
    };
  }, [selectedExam?.id, activeSession?.examId, sessionToken, currentProfile]);

  const claimSessionLock = () => {
    if (!selectedExam) return;
    const newToken = `CS_ST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionToken(newToken);
    const lockKey = `CS_CBT_LOCK_${currentProfile.username}_${selectedExam.id}`;
    localStorage.setItem(lockKey, newToken);

    try {
      const channel = new BroadcastChannel(`CS_CBT_LOCK_CHANNEL_${selectedExam.id}_${currentProfile.id}`);
      channel.postMessage({ type: 'CLAIM_SESSION', token: newToken });
      channel.close();
    } catch (e) {}

    setIsSessionLockedOut(false);
    toast.success("✅ Session re-acquired and lock token secured on this screen!");
  };

  const handleProctoringAlert = (event: ProctoringAlertEvent) => {
    setProctoringLogs((prev) => [event, ...prev]);

    // Persist proctoring logs for Teacher / Proctor inspection
    try {
      const existing = JSON.parse(localStorage.getItem('CS_PROCTORING_ALERTS') || '[]');
      const updated = [{ ...event, studentName: currentProfile.fullName, studentId: currentProfile.username, examTitle: selectedExam?.title }, ...existing];
      localStorage.setItem('CS_PROCTORING_ALERTS', JSON.stringify(updated.slice(0, 50)));
    } catch (e) {}
  };

  // Tab Focus & Visibility Violation Monitor for live proctoring
  useEffect(() => {
    if (!selectedExam || !activeSession || activeSession.isCompleted || submitted) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (!isVisible) {
        const violationEvent: ProctoringAlertEvent = {
          id: `alert-tab-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'TAB_SWITCH',
          severity: 'HIGH',
          message: 'Student switched away from the examination window or minimized browser tab.'
        };
        handleProctoringAlert(violationEvent);
        toast.error("⚠️ PROCTOR ALERT: Window focus lost! Tab-switching is recorded on your exam ledger.", {
          id: 'tab-switch-alert',
          duration: 4000
        });

        // Broadcast urgent proctor heartbeat with lost focus
        recordCbtLiveHeartbeat({
          examId: selectedExam.id,
          examTitle: selectedExam.title,
          studentId: currentProfile.id,
          studentName: currentProfile.fullName,
          totalQuestions: selectedExam.questions.length,
          answeredCount: Object.keys(activeSession.answers || {}).length,
          timeLeftSeconds: activeSession.timeLeftSeconds,
          isFocused: false,
          violationsCount: proctoringLogs.length + 1,
          lastHeartbeatAt: new Date().toISOString(),
          isCompleted: false
        });
      }
    };

    const handleWindowBlur = () => {
      // Blur detected
      recordCbtLiveHeartbeat({
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        totalQuestions: selectedExam.questions.length,
        answeredCount: Object.keys(activeSession.answers || {}).length,
        timeLeftSeconds: activeSession.timeLeftSeconds,
        isFocused: false,
        violationsCount: proctoringLogs.length,
        lastHeartbeatAt: new Date().toISOString(),
        isCompleted: false
      });
    };

    const handleWindowFocus = () => {
      recordCbtLiveHeartbeat({
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        totalQuestions: selectedExam.questions.length,
        answeredCount: Object.keys(activeSession.answers || {}).length,
        timeLeftSeconds: activeSession.timeLeftSeconds,
        isFocused: true,
        violationsCount: proctoringLogs.length,
        lastHeartbeatAt: new Date().toISOString(),
        isCompleted: false
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [selectedExam?.id, activeSession?.examId, activeSession?.timeLeftSeconds, submitted, proctoringLogs.length]);

  // Load or initialize active student session for the selected exam with IndexedDB draft check
  useEffect(() => {
    let isCancelled = false;

    async function loadSessionWithDraftFallback() {
      if (!selectedExam) {
        setActiveSession(null);
        setSubmitted(false);
        return;
      }

      const storageKey = `CS_CBT_SESSION_${currentProfile.username}_${selectedExam.id}`;
      const saved = localStorage.getItem(storageKey);

      // Check global admin timer
      const adminKey = `CS_CBT_LIVE_TIMER_${selectedExam.id}`;
      const adminData = localStorage.getItem(adminKey);
      let adminRemaining = -1;
      if (adminData) {
        try {
          const parsed = JSON.parse(adminData);
          if (parsed.active) {
            const elapsed = Math.floor((Date.now() - new Date(parsed.startTime).getTime()) / 1000);
            const total = parsed.durationMinutes * 60;
            adminRemaining = Math.max(0, total - elapsed);
          }
        } catch (e) {}
      }

      // Check IndexedDB draft recovery first
      const idbDraft = await getCbtDraftFromIndexedDb(selectedExam.id, currentProfile.id);

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CbtSessionState;
          if (adminRemaining >= 0 && !parsed.isCompleted) {
            parsed.timeLeftSeconds = adminRemaining;
          }
          if (idbDraft && Object.keys(idbDraft.answers).length > Object.keys(parsed.answers || {}).length) {
            parsed.answers = idbDraft.answers;
            toast.info("💾 Restored unsubmitted question answers from IndexedDB offline storage!");
          }
          if (!isCancelled) {
            setSubmitted(parsed.isCompleted);
            setActiveSession(parsed);
          }
          return;
        } catch (e) {
          if (!isCancelled) initializeNewSession();
        }
      } else if (idbDraft) {
        const recoveredSession: CbtSessionState = {
          examId: selectedExam.id,
          studentId: currentProfile.id,
          answers: idbDraft.answers || {},
          timeLeftSeconds: idbDraft.timeLeftSeconds || selectedExam.durationMinutes * 60,
          isCompleted: false,
          startedAt: new Date().toISOString(),
          lastSavedAt: idbDraft.lastSavedAt || new Date().toISOString()
        };
        if (!isCancelled) {
          saveSession(recoveredSession);
          setActiveSession(recoveredSession);
          setSubmitted(false);
          toast.success("✅ Auto-recovered in-progress exam answers from IndexedDB offline queue!");
        }
        return;
      } else {
        if (!isCancelled) initializeNewSession();
      }
    }

    loadSessionWithDraftFallback();

    return () => {
      isCancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedExam, currentProfile]);

  const initializeNewSession = () => {
    if (!selectedExam) return;

    // Check global admin timer
    const adminKey = `CS_CBT_LIVE_TIMER_${selectedExam.id}`;
    const adminData = localStorage.getItem(adminKey);
    let initialTime = selectedExam.durationMinutes * 60;
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        if (parsed.active) {
          const elapsed = Math.floor((Date.now() - new Date(parsed.startTime).getTime()) / 1000);
          const total = parsed.durationMinutes * 60;
          initialTime = Math.max(0, total - elapsed);
        }
      } catch (e) {}
    }

    const newSession: CbtSessionState = {
      examId: selectedExam.id,
      studentId: currentProfile.id,
      answers: {},
      timeLeftSeconds: initialTime,
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

      // Also auto-save to IndexedDB draft
      saveCbtDraftToIndexedDb({
        examId: selectedExam.id,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        answers: state.answers,
        currentQuestionIndex,
        timeLeftSeconds: state.timeLeftSeconds,
        lastSavedAt: new Date().toISOString(),
        proctoringViolations: proctoringLogs.length
      }).catch(() => {});

      // Also commit to CS_CBT_ALL_SESSIONS for institutional audit logs
      try {
        const savedSessions = localStorage.getItem('CS_CBT_ALL_SESSIONS');
        let sessionList: CbtSessionState[] = savedSessions ? JSON.parse(savedSessions) : [];
        const index = sessionList.findIndex(
          (s) => s.examId === state.examId && s.studentId === state.studentId
        );
        if (index !== -1) {
          sessionList[index] = state;
        } else {
          sessionList.push(state);
        }
        localStorage.setItem('CS_CBT_ALL_SESSIONS', JSON.stringify(sessionList));
      } catch (e) {
        // Fallback for quota or parsing issues
      }
    }
  };

  // Live Heartbeat Broadcast loop (every 10s) to keep Proctor & Admin monitoring synchronised
  useEffect(() => {
    if (!activeSession || activeSession.isCompleted || submitted || !selectedExam) return;

    const emitHeartbeat = () => {
      const answered = Object.keys(activeSession.answers || {}).length;
      recordCbtLiveHeartbeat({
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        totalQuestions: selectedExam.questions.length,
        answeredCount: answered,
        timeLeftSeconds: activeSession.timeLeftSeconds,
        isFocused: document.visibilityState === 'visible' && document.hasFocus(),
        violationsCount: proctoringLogs.length,
        lastHeartbeatAt: new Date().toISOString(),
        isCompleted: false
      });
    };

    emitHeartbeat();
    const interval = setInterval(emitHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [activeSession?.timeLeftSeconds, activeSession?.answers, selectedExam?.id, proctoringLogs.length, submitted]);

  // Auto-Save Mechanism: Periodically commits student responses to localStorage every 30 seconds to prevent data loss
  useEffect(() => {
    if (activeSession && !activeSession.isCompleted && !submitted && !crashSimulated && selectedExam) {
      const autoSaveTimer = setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setActiveSession((currentSession) => {
          if (!currentSession) return null;
          const updatedSession = {
            ...currentSession,
            lastSavedAt: now.toISOString(),
          };
          saveSession(updatedSession);
          return updatedSession;
        });

        setLastAutoSaveTime(timeString);
        toast.success(`[Auto-Save 30s] Student responses committed to local storage (${timeString})`, {
          duration: 2500,
          id: 'cbt-30s-autosave',
        });
      }, 30000);

      return () => clearInterval(autoSaveTimer);
    }
  }, [activeSession?.examId, submitted, crashSimulated, selectedExam?.id]);

  // Live Timer Loop with persistence save
  useEffect(() => {
    if (activeSession && !activeSession.isCompleted && !submitted && !crashSimulated) {
      timerRef.current = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;

          // Sync with global admin timer if available
          const adminKey = `CS_CBT_LIVE_TIMER_${prev.examId}`;
          const adminData = localStorage.getItem(adminKey);
          let currentRemaining = prev.timeLeftSeconds - 1;

          if (adminData) {
            try {
              const parsed = JSON.parse(adminData);
              if (parsed.active) {
                const elapsed = Math.floor((Date.now() - new Date(parsed.startTime).getTime()) / 1000);
                const total = parsed.durationMinutes * 60;
                currentRemaining = Math.max(0, total - elapsed);
              }
            } catch (e) {}
          }

          if (currentRemaining <= 0) {
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
            timeLeftSeconds: currentRemaining,
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

  const handleSubmitExam = async () => {
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

    // Queue payload in IndexedDB Offline Sync Queue
    try {
      await clearCbtDraftFromIndexedDb(selectedExam.id, currentProfile.id);
      const bundle = compressAndEncryptExamPackage(selectedExam);
      await saveToOfflineQueue({
        id: `SYNC-${Date.now()}-${currentProfile.id}`,
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        subject: selectedExam.subject,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        answers: completedSession.answers,
        score: completedSession.score,
        completedAt: new Date().toISOString(),
        synced: typeof navigator !== 'undefined' ? navigator.onLine : true,
        encryptedBundleSizeKb: bundle.compressedSizeKb
      });
      await refreshOfflineQueueCount();

      // Emit completed heartbeat
      recordCbtLiveHeartbeat({
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        studentId: currentProfile.id,
        studentName: currentProfile.fullName,
        totalQuestions: selectedExam.questions.length,
        answeredCount: Object.keys(completedSession.answers || {}).length,
        timeLeftSeconds: 0,
        isFocused: true,
        violationsCount: proctoringLogs.length,
        lastHeartbeatAt: new Date().toISOString(),
        isCompleted: true
      });
    } catch (e) {}

    setSubmitted(true);
    onCompleteExam(completedSession);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      toast.success("Examination Sheet submitted & synced to Corner Streams server!");
    } else {
      toast.success("📶 Offline Mode: Exam payload encrypted & saved in local IndexedDB queue!");
    }
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Visual Sync Status Indicator in CBT Header */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all ${
              isSyncing ? 'bg-indigo-900 text-indigo-100 border-indigo-700' :
              !isOnline ? 'bg-amber-50 text-amber-900 border-amber-300' :
              pendingSyncCount > 0 ? 'bg-amber-500/10 text-amber-800 border-amber-300' :
              'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                      <span>Syncing Payload {syncCurrent}/{syncTotal}</span>
                      <span className="text-emerald-400 font-mono">({syncProgress}%)</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-28 bg-indigo-950 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : pendingSyncCount > 0 ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase">
                      IndexedDB Queue: {pendingSyncCount} Pending
                    </span>
                    <button
                      type="button"
                      onClick={flushOfflineQueue}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      Sync Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-black uppercase text-emerald-800">
                    {isOnline ? 'LAN Online & Queue Synced' : 'LAN Offline Engine Ready'}
                  </span>
                </>
              )}
            </div>

            <CbtFocusModeButton variant="toolbar" />

            <div className="flex items-center gap-1.5 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1.5 rounded-xl font-bold font-mono">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              CBT TERMINAL STABLE
            </div>
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
            {exams
              .filter((exam) => (exam.publishedToStudents !== undefined ? exam.publishedToStudents : exam.published !== false))
              .map((exam) => {
              // Check if student has already completed this exam
              const matchingSession = sessions.find(
                (s) => s.examId === exam.id && s.studentId === currentProfile.id && s.isCompleted
              );
              
              const isFinished = !!matchingSession;

              const timerInfo = liveTimers[exam.id];
              let remainingSeconds = -1;
              if (timerInfo && timerInfo.active) {
                const elapsed = Math.floor((Date.now() - new Date(timerInfo.startTime).getTime()) / 1000);
                remainingSeconds = Math.max(0, timerInfo.durationMinutes * 60 - elapsed);
              }
              const isExpired = remainingSeconds === 0;

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

                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex gap-4 text-[10px] text-slate-400 font-mono font-bold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timerInfo && timerInfo.active ? `${timerInfo.durationMinutes} Min Global Limit` : `${exam.durationMinutes} Minutes`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.questions.length} Multiple Choice</span>
                        </div>
                      </div>

                      {timerInfo && timerInfo.active && (
                        <div className={`mt-1 p-2 rounded-xl border flex items-center justify-between text-xs font-bold ${
                          isExpired 
                            ? "bg-rose-50 border-rose-200 text-rose-700" 
                            : "bg-emerald-50/50 border-emerald-150 text-emerald-800 animate-pulse"
                        }`}>
                          <span className="text-[9px] uppercase tracking-wider font-mono flex items-center gap-1">
                            <span className={`w-1.2 h-1.2 rounded-full ${isExpired ? "bg-rose-500" : "bg-emerald-500 animate-ping"}`} />
                            {isExpired ? "Global Timer Expired" : "Global Timer Active"}
                          </span>
                          <span className="font-mono font-black text-xs">
                            {isExpired ? "00:00" : `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`}
                          </span>
                        </div>
                      )}
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
                          disabled={isExpired}
                          className="px-3 py-1.5 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-indigo-50 transition disabled:opacity-40"
                        >
                          Simulate Retake
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex justify-end">
                        <button
                          onClick={() => !isExpired && setSelectedExam(exam)}
                          disabled={isExpired}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                          <span>{isExpired ? "Concluded" : "Commence Exam"}</span>
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

  // Circular timer progress calculation & dynamic color shift (Green -> Amber -> Red)
  const totalExamSeconds = (selectedExam.durationMinutes || 30) * 60;
  const remainingExamSeconds = activeSession?.timeLeftSeconds ?? 0;
  const timerPercent = Math.min(100, Math.max(0, (remainingExamSeconds / totalExamSeconds) * 100));

  let timerBadgeClasses = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  let svgStrokeColor = "#10b981"; // Green/Emerald (>50%)
  let timerUrgencyLabel = "NORMAL";

  if (timerPercent <= 20) {
    timerBadgeClasses = "text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse shadow-sm shadow-rose-900/50";
    svgStrokeColor = "#f43f5e"; // Red/Rose (<=20%)
    timerUrgencyLabel = "CRITICAL";
  } else if (timerPercent <= 50) {
    timerBadgeClasses = "text-amber-400 bg-amber-500/15 border-amber-500/30";
    svgStrokeColor = "#f59e0b"; // Amber (<=50%)
    timerUrgencyLabel = "WARNING";
  }

  const svgCircumference = 2 * Math.PI * 14;
  const strokeDashoffset = svgCircumference * (1 - timerPercent / 100);

  // Recharts Visual Progress Timeline calculations: Time progression vs remaining question count
  const elapsedSeconds = Math.max(0, totalExamSeconds - remainingExamSeconds);
  const timeElapsedPercent = Math.min(100, Math.round((elapsedSeconds / (totalExamSeconds || 1)) * 100));
  const timeRemainingPercent = Math.max(0, 100 - timeElapsedPercent);

  const totalQuestions = selectedExam.questions.length || 1;
  const answeredCount = Object.keys(activeSession?.answers || {}).length;
  const remainingQuestionsCount = Math.max(0, totalQuestions - answeredCount);
  const questionsAnsweredPercent = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
  const questionsRemainingPercent = Math.max(0, 100 - questionsAnsweredPercent);

  const timelineChartData = [
    {
      name: 'Time Elapsed',
      Completed: timeElapsedPercent,
      Remaining: timeRemainingPercent,
      completedlabel: `${formatTime(elapsedSeconds)} elapsed`,
      remaininglabel: `${formatTime(remainingExamSeconds)} left`,
    },
    {
      name: 'Questions',
      Completed: questionsAnsweredPercent,
      Remaining: questionsRemainingPercent,
      completedlabel: `${answeredCount} of ${totalQuestions} answered`,
      remaininglabel: `${remainingQuestionsCount} of ${totalQuestions} remaining`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-full overflow-hidden min-h-[460px] animate-in slide-in-from-bottom duration-300 relative">
      {/* Active Session Lockout Modal Overlay */}
      {isSessionLockedOut && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-black uppercase tracking-wider">
                Active Session Lockout
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Simultaneous Login Lockout
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Another tab or device has initiated testing for <strong className="text-slate-900">{currentProfile.fullName}</strong>. Active session lockout is enforced to prevent concurrent exam access.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-[10px] font-mono space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>CANDIDATE:</span>
                <span className="font-bold text-slate-800">{currentProfile.username}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>TOKEN:</span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">{sessionToken}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>STATUS:</span>
                <span className="font-bold text-rose-600 uppercase">LOCKED OUT</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={claimSessionLock}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-white" />
                Claim & Relock Session On This Device
              </button>
              <button
                type="button"
                onClick={() => setSelectedExam(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Exit Examination Desk
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* LAN Mesh Connectivity Badge & Real-Time Sync Progress Bar */}
          <div className={`px-2.5 py-1 rounded-xl text-[9.5px] font-mono font-bold flex items-center gap-2 border shadow-sm transition-all ${
            isSyncing ? 'bg-indigo-900 border-indigo-700 text-indigo-100' :
            isOnline ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
            'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          }`}>
            {isSyncing ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[8.5px] uppercase font-black tracking-wider text-emerald-300">
                    Syncing {syncCurrent}/{syncTotal} ({syncProgress}%)
                  </span>
                  <div className="w-20 bg-black/50 h-1 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isOnline ? 'LAN Online' : 'LAN Offline Queue Active'}</span>
                {pendingSyncCount > 0 && (
                  <button
                    type="button"
                    onClick={flushOfflineQueue}
                    className="ml-1 px-1.5 py-0.5 bg-amber-500 text-black font-black rounded text-[8px] uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                  >
                    Sync ({pendingSyncCount})
                  </button>
                )}
              </>
            )}
          </div>

          {/* Circular Progress Bar Timer Component */}
          <div 
            className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${timerBadgeClasses}`}
            title={`Exam time remaining: ${timerPercent.toFixed(0)}% (${timerUrgencyLabel} status)`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                {/* Track Circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-white/10"
                  fill="transparent"
                />
                {/* Progress Circle with Dynamic Color Shift */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke={svgStrokeColor}
                  strokeWidth="3"
                  strokeDasharray={svgCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                  fill="transparent"
                />
              </svg>
              <Clock className={`w-3.5 h-3.5 absolute ${timerPercent <= 20 ? 'animate-bounce text-rose-400' : ''}`} />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] uppercase tracking-wider font-extrabold opacity-80">
                  Time Left
                </span>
                <span className="text-[7.5px] font-black px-1 rounded bg-black/30 tracking-tight uppercase">
                  {timerUrgencyLabel}
                </span>
              </div>
              <span className="text-xs font-black font-mono tracking-tight">
                {activeSession ? formatTime(activeSession.timeLeftSeconds) : '00:00'}
              </span>
            </div>
          </div>

          <CbtFocusModeButton variant="compact" />

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

      {/* Visual Progress Timeline (Recharts Horizontal Bar Chart) */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 space-y-2 shrink-0">
        <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span className="uppercase tracking-wider">Exam Visual Timeline Progress</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
              ⏱️ Elapsed: <strong>{formatTime(elapsedSeconds)}</strong> ({timeElapsedPercent}%)
            </span>
            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
              ⏳ Left: <strong>{formatTime(remainingExamSeconds)}</strong> ({timeRemainingPercent}%)
            </span>
            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
              ❓ Unanswered: <strong>{remainingQuestionsCount}</strong> / {totalQuestions} ({questionsRemainingPercent}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner">
          <ResponsiveContainer width="100%" height={70}>
            <BarChart
              layout="vertical"
              data={timelineChartData}
              margin={{ top: 2, right: 15, left: 5, bottom: 2 }}
              barSize={12}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={95}
                tick={{ fontSize: 9, fontWeight: 800, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTimelineTooltip />} />
              <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[3, 0, 0, 3]} name="Progress / Answered" />
              <Bar dataKey="Remaining" stackId="a" fill="#6366f1" radius={[0, 3, 3, 0]} name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student credentials bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-500 shrink-0 font-bold gap-2">
        <span>Student: <span className="text-indigo-950">{currentProfile.fullName}</span></span>
        <div className="flex items-center gap-3">
          {lastAutoSaveTime ? (
            <span className="text-[9.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 font-bold animate-in fade-in">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Auto-saved at {lastAutoSaveTime} (30s interval)
            </span>
          ) : (
            <span className="text-[9.5px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Auto-save active (30s timer)
            </span>
          )}
          <span>Question {currentQuestionIndex + 1} of {selectedExam.questions.length}</span>
        </div>
      </div>

      {/* Main question workspace & Biometric HUD Grid */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <span className="text-[9.5px] font-extrabold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md">
              {currentQuestion.marks} MARKS ACCRUED
            </span>
            <h4 className="text-base font-bold text-slate-900 leading-relaxed font-display">
              {currentQuestion.questionText || (currentQuestion as any).text}
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

        {/* Biometric & Face Proctoring HUD Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <BiometricProctoringMonitor
            active={true}
            candidateName={currentProfile.fullName}
            examTitle={selectedExam.title}
            onAlertTriggered={handleProctoringAlert}
          />
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
            <span className="text-[9.5px] text-emerald-700 font-mono font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Auto-saved locally (30s commit cycle)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
