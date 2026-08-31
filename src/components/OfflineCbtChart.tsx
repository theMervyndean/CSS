/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, Award, Users, FileText, Plus, Trash2, Database, Zap, Layers,
  AlertTriangle, ShieldAlert, Wrench, RotateCcw, Check, Bug
} from 'lucide-react';
import { toast } from 'sonner';

export interface OfflineExamRecord {
  id: string;
  examTitle: string;
  subject: string;
  classCohort: string;
  studentName: string;
  scorePercent: number;
  completedAt: string; // ISO date string or formatted time
  syncedToCloud: boolean;
  failedValidation?: boolean;
  validationErrorReason?: string;
  lastValidatedAt?: string;
}

export const STORAGE_KEY = 'CS_OFFLINE_CBT_COMPLETIONS';

// Initial seed data if localStorage is empty
const INITIAL_OFFLINE_RECORDS: OfflineExamRecord[] = [
  { id: 'off-1', examTitle: 'MTH401 - Mid-Term Algebra CBT', subject: 'Mathematics', classCohort: 'SS 2A', studentName: 'Adebayo Kolawole', scorePercent: 88, completedAt: '2026-07-25T10:15:00.000Z', syncedToCloud: false },
  { id: 'off-2', examTitle: 'MTH401 - Mid-Term Algebra CBT', subject: 'Mathematics', classCohort: 'SS 2A', studentName: 'Onyeka Chioma', scorePercent: 92, completedAt: '2026-07-25T11:00:00.000Z', syncedToCloud: false },
  { id: 'off-3', examTitle: 'ENG401 - Comprehension & Grammar', subject: 'English Language', classCohort: 'SS 2A', studentName: 'Fatima Abubakar', scorePercent: 78, completedAt: '2026-07-26T09:30:00.000Z', syncedToCloud: false },
  { id: 'off-4', examTitle: 'PHY402 - Mechanics & Heat CBT', subject: 'Physics', classCohort: 'SS 1B', studentName: 'Chinedu Eze', scorePercent: 84, completedAt: '2026-07-26T14:20:00.000Z', syncedToCloud: false },
  { id: 'off-5', examTitle: 'CSC202 - Digital Literacy & Logic', subject: 'Computer Science', classCohort: 'JSS 3', studentName: 'Folake Adeleke', scorePercent: 95, completedAt: '2026-07-27T08:10:00.000Z', syncedToCloud: false },
  { id: 'off-6', examTitle: 'CIV301 - Civics & Resiliency Test', subject: 'Civics', classCohort: 'Primary 5', studentName: 'Ibrahim Musa', scorePercent: 70, completedAt: '2026-07-27T08:45:00.000Z', syncedToCloud: false },
  { id: 'off-7', examTitle: 'MTH401 - Mid-Term Algebra CBT', subject: 'Mathematics', classCohort: 'SS 2A', studentName: 'Grace Danjuma', scorePercent: 80, completedAt: '2026-07-27T09:12:00.000Z', syncedToCloud: false },
  { id: 'off-8', examTitle: 'ENG401 - Comprehension & Grammar', subject: 'English Language', classCohort: 'SS 2A', studentName: 'Babajide Ogundipe', scorePercent: 86, completedAt: '2026-07-27T09:35:00.000Z', syncedToCloud: false }
];

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#4f46e5', // indigo-600
  'English Language': '#0284c7', // sky-600
  'Physics': '#059669', // emerald-600
  'Computer Science': '#7c3aed', // violet-600
  'Civics': '#d97706', // amber-600
  'Biology': '#16a34a', // green-600
  'Chemistry': '#ea580c' // orange-600
};

const DEFAULT_BAR_COLOR = '#6366f1';

/**
 * Validates a single CBT exam completion record stored locally.
 * Checks required fields, correct types, score bounds (0-100%), and valid date timestamp.
 */
export function validateOfflineCbtRecord(record: any): { isValid: boolean; reason?: string } {
  if (!record || typeof record !== 'object') {
    return { isValid: false, reason: 'Record structure is null or not a valid JSON object' };
  }
  if (!record.id || typeof record.id !== 'string' || record.id.trim() === '') {
    return { isValid: false, reason: 'Missing or corrupted candidate exam ID identifier' };
  }
  if (!record.examTitle || typeof record.examTitle !== 'string' || record.examTitle.trim() === '') {
    return { isValid: false, reason: 'Missing or empty exam title string' };
  }
  if (!record.subject || typeof record.subject !== 'string' || record.subject.trim() === '') {
    return { isValid: false, reason: 'Missing subject academic classification' };
  }
  if (!record.studentName || typeof record.studentName !== 'string' || record.studentName.trim() === '') {
    return { isValid: false, reason: 'Missing student candidate full name' };
  }
  if (typeof record.scorePercent !== 'number' || isNaN(record.scorePercent) || record.scorePercent < 0 || record.scorePercent > 100) {
    return { isValid: false, reason: `Invalid score value: expected number between 0-100%, found ${record.scorePercent}` };
  }
  if (!record.completedAt || isNaN(new Date(record.completedAt).getTime())) {
    return { isValid: false, reason: 'Invalid or missing completion ISO timestamp date' };
  }
  return { isValid: true };
}

/**
 * Background validation timer utility.
 * Periodically audits localStorage CBT records for data integrity and tags invalid items.
 */
export function startLocalStorageValidationTimer(
  onValidationComplete?: (records: OfflineExamRecord[], failedRecords: OfflineExamRecord[]) => void,
  intervalMs: number = 8000
): () => void {
  const runValidationCheck = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsedRecords: OfflineExamRecord[] = JSON.parse(stored);
      if (!Array.isArray(parsedRecords)) return;

      let hasChanges = false;
      const failedRecordsList: OfflineExamRecord[] = [];
      const timestampNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const updatedRecords = parsedRecords.map(item => {
        const validation = validateOfflineCbtRecord(item);
        const isValid = validation.isValid;
        const newReason = validation.reason || '';

        if (!isValid) {
          failedRecordsList.push({
            ...item,
            failedValidation: true,
            validationErrorReason: newReason,
            lastValidatedAt: timestampNow
          });
        }

        if (item.failedValidation !== !isValid || item.validationErrorReason !== newReason) {
          hasChanges = true;
          return {
            ...item,
            failedValidation: !isValid,
            validationErrorReason: newReason,
            lastValidatedAt: timestampNow
          };
        }
        return item;
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        window.dispatchEvent(new Event('cs_offline_cbt_update'));
      }

      if (onValidationComplete) {
        onValidationComplete(updatedRecords, failedRecordsList);
      }
    } catch (err) {
      console.error('Error executing startLocalStorageValidationTimer integrity check:', err);
    }
  };

  // Run initial check immediately
  runValidationCheck();

  // Set recurring background timer
  const timerId = setInterval(runValidationCheck, intervalMs);

  // Return cleanup teardown function
  return () => clearInterval(timerId);
}

interface OfflineCbtChartProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

export function OfflineCbtChart({
  className = '',
  title = 'Offline CBT Exam Completion Aggregator',
  subtitle = 'Aggregates exam attempts stored locally in browser storage and syncs when reconnected'
}: OfflineCbtChartProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [aggregationMode, setAggregationMode] = useState<'subject' | 'classCohort' | 'day'>('subject');
  const [records, setRecords] = useState<OfflineExamRecord[]>([]);
  const [failedRecords, setFailedRecords] = useState<OfflineExamRecord[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastValidatedAt, setLastValidatedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load records from localStorage or seed initial data
  const loadLocalStorageRecords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          setFailedRecords(parsed.filter(r => r.failedValidation));
          return;
        }
      }
      // If none found, seed initial records
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFLINE_RECORDS));
      setRecords(INITIAL_OFFLINE_RECORDS);
      setFailedRecords([]);
    } catch (e) {
      console.error('Failed to load offline CBT records from localStorage', e);
      setRecords(INITIAL_OFFLINE_RECORDS);
      setFailedRecords([]);
    }
  };

  useEffect(() => {
    loadLocalStorageRecords();

    // Online / Offline network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      triggerSyncFromLocalStorage();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('🌐 Network Disconnected — Offline Mode Active. Exam responses will buffer locally in localStorage.', {
        id: 'offline-notice'
      });
    };

    // Listen for custom window event when new offline exam is submitted or updated
    const handleStorageUpdate = () => {
      loadLocalStorageRecords();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('cs_offline_cbt_update', handleStorageUpdate);

    // Initialize the LocalStorage Data Integrity Validation Timer
    const stopValidationTimer = startLocalStorageValidationTimer((allRecs, invalidRecs) => {
      setRecords(allRecs);
      setFailedRecords(invalidRecs);
      setLastValidatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 6000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('cs_offline_cbt_update', handleStorageUpdate);
      stopValidationTimer();
    };
  }, []);

  // Sync / Aggregate function
  const triggerSyncFromLocalStorage = () => {
    setIsSyncing(true);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let currentRecords: OfflineExamRecord[] = stored ? JSON.parse(stored) : INITIAL_OFFLINE_RECORDS;
        
        // Filter out corrupted ones or notify
        const validUnsynced = currentRecords.filter(r => !r.syncedToCloud && !r.failedValidation);
        const corruptedUnsynced = currentRecords.filter(r => !r.syncedToCloud && r.failedValidation);

        if (corruptedUnsynced.length > 0) {
          toast.error(`⚠️ ${corruptedUnsynced.length} corrupted local exam(s) skipped during sync. Please repair or re-save them below.`, {
            duration: 5000
          });
        }

        // Mark valid unsynced items as synced
        const updatedRecords = currentRecords.map(r => {
          if (!r.failedValidation) {
            return { ...r, syncedToCloud: true };
          }
          return r;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        setRecords(updatedRecords);
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(nowFormatted);
        
        if (validUnsynced.length > 0) {
          toast.success(`🎉 Reconnected! Successfully synced ${validUnsynced.length} offline CBT exam completion(s) from LocalStorage to Cloud Server.`, {
            duration: 4000
          });
        } else if (corruptedUnsynced.length === 0) {
          toast.info('⚡ LocalStorage queue is already up to date with cloud records.', {
            duration: 3000
          });
        }
      } catch (err) {
        toast.error('Failed to sync offline exams from localStorage');
      } finally {
        setIsSyncing(false);
      }
    }, 600);
  };

  // Repair / Re-Save a corrupted local exam record
  const handleRepairAndResaveRecord = (recordId: string) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        const repairedName = r.studentName.trim() || 'Candidate (Recovered)';
        const repairedTitle = r.examTitle.trim() || `${r.subject || 'General'} CBT Assessment`;
        const repairedScore = typeof r.scorePercent === 'number' && !isNaN(r.scorePercent) 
          ? Math.max(0, Math.min(100, Math.abs(r.scorePercent))) 
          : 75;

        return {
          ...r,
          studentName: repairedName,
          examTitle: repairedTitle,
          scorePercent: repairedScore,
          failedValidation: false,
          validationErrorReason: undefined,
          lastValidatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
    setFailedRecords(updated.filter(item => item.failedValidation));
    window.dispatchEvent(new Event('cs_offline_cbt_update'));

    toast.success('🛠️ CBT Exam record schema repaired & re-saved to LocalStorage successfully! Ready for cloud sync.');
  };

  // Purge a corrupted record
  const handlePurgeRecord = (recordId: string) => {
    const updated = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
    setFailedRecords(updated.filter(item => item.failedValidation));
    window.dispatchEvent(new Event('cs_offline_cbt_update'));

    toast.info('Corrupted record purged from LocalStorage queue.');
  };

  const handleResetLocalStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFLINE_RECORDS));
    setRecords(INITIAL_OFFLINE_RECORDS);
    setFailedRecords([]);
    toast.info('Reset offline CBT records to initial clean demo dataset');
  };

  // Aggregate Data for Recharts Bar Chart (filter out failedValidation records from normal chart or show them)
  const chartData = useMemo(() => {
    const validRecords = records.filter(r => !r.failedValidation);
    if (validRecords.length === 0) return [];

    if (aggregationMode === 'subject') {
      const map: Record<string, { subject: string; count: number; avgScore: number; sumScore: number }> = {};
      validRecords.forEach(r => {
        if (!map[r.subject]) {
          map[r.subject] = { subject: r.subject, count: 0, avgScore: 0, sumScore: 0 };
        }
        map[r.subject].count += 1;
        map[r.subject].sumScore += r.scorePercent;
      });
      return Object.values(map).map(item => ({
        label: item.subject,
        count: item.count,
        avgScore: Math.round(item.sumScore / item.count),
        fillColor: SUBJECT_COLORS[item.subject] || DEFAULT_BAR_COLOR
      }));
    }

    if (aggregationMode === 'classCohort') {
      const map: Record<string, { classCohort: string; count: number; avgScore: number; sumScore: number }> = {};
      validRecords.forEach(r => {
        const key = r.classCohort || 'Unassigned';
        if (!map[key]) {
          map[key] = { classCohort: key, count: 0, avgScore: 0, sumScore: 0 };
        }
        map[key].count += 1;
        map[key].sumScore += r.scorePercent;
      });
      return Object.values(map).map(item => ({
        label: item.classCohort,
        count: item.count,
        avgScore: Math.round(item.sumScore / item.count),
        fillColor: '#4f46e5'
      }));
    }

    // By day / date
    const map: Record<string, { dayLabel: string; count: number; avgScore: number; sumScore: number }> = {};
    validRecords.forEach(r => {
      const d = new Date(r.completedAt);
      const dayLabel = isNaN(d.getTime()) 
        ? 'Recent' 
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      if (!map[dayLabel]) {
        map[dayLabel] = { dayLabel, count: 0, avgScore: 0, sumScore: 0 };
      }
      map[dayLabel].count += 1;
      map[dayLabel].sumScore += r.scorePercent;
    });

    return Object.values(map).map(item => ({
      label: item.dayLabel,
      count: item.count,
      avgScore: Math.round(item.sumScore / item.count),
      fillColor: '#059669'
    }));
  }, [records, aggregationMode]);

  // Derived metrics
  const totalCompleted = records.length;
  const validRecordsCount = records.filter(r => !r.failedValidation).length;
  const unsyncedCount = records.filter(r => !r.syncedToCloud && !r.failedValidation).length;
  const uniqueStudents = new Set(records.filter(r => !r.failedValidation).map(r => r.studentName)).size;
  const averageScore = validRecordsCount > 0 
    ? Math.round(records.filter(r => !r.failedValidation).reduce((acc, curr) => acc + curr.scorePercent, 0) / validRecordsCount) 
    : 0;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6 ${className}`}>
      {/* Header & Connectivity Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
              {title}
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  Online Status
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  Offline Mode Active
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerSyncFromLocalStorage}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Aggregate and sync offline entries stored in localStorage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Aggregating...' : 'Sync LocalStorage'}</span>
          </button>

          <button
            onClick={handleResetLocalStorage}
            className="px-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs transition-all cursor-pointer flex items-center gap-1"
            title="Clear synced cache"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Clear Cache</span>
          </button>
        </div>
      </div>

      {/* DATA INTEGRITY ALERT BANNER FOR FAILED LOCALSTORAGE VALIDATIONS */}
      {failedRecords.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-400/80 rounded-2xl p-4 md:p-5 space-y-3 animate-in slide-in-from-top duration-300 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                  <span>Data Integrity Validation Warning</span>
                  <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] rounded-full font-mono">
                    {failedRecords.length} Failed Record(s)
                  </span>
                </h3>
                <p className="text-[11.5px] text-amber-900 font-medium">
                  The <code className="font-mono text-amber-950 font-bold">startLocalStorageValidationTimer</code> utility detected corrupted schema fields or out-of-bounds scores in browser storage.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                failedRecords.forEach(rec => handleRepairAndResaveRecord(rec.id));
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Repair All & Re-Save</span>
            </button>
          </div>

          {/* List of Corrupted / Failed Validation Exam Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {failedRecords.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl p-3.5 border-2 border-amber-300 shadow-sm space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9.5px] font-black uppercase rounded-md flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Validation Failed
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      ID: {item.id}
                    </span>
                  </div>

                  <p className="text-xs font-black text-slate-900 truncate">
                    Candidate: {item.studentName || <i className="text-rose-500 font-normal">Missing Name</i>}
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 truncate">
                    Exam: {item.examTitle || <i className="text-rose-500 font-normal">Missing Title</i>} ({item.subject || 'N/A'})
                  </p>

                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg text-[10.5px] text-rose-900 font-bold space-y-0.5">
                    <div className="flex items-center gap-1.5 text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>Reason: {item.validationErrorReason || validateOfflineCbtRecord(item).reason}</span>
                    </div>
                    {item.lastValidatedAt && (
                      <div className="text-[9.5px] text-slate-500 font-mono font-normal">
                        Validated at: {item.lastValidatedAt}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleRepairAndResaveRecord(item.id)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Sanitize structure, fix score bounds, and re-save to LocalStorage"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Re-Save & Repair</span>
                  </button>
                  <button
                    onClick={() => handlePurgeRecord(item.id)}
                    className="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                    title="Delete record from local storage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Completed Exams</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{totalCompleted}</div>
          <div className="text-[10px] text-slate-500 font-medium">
            {validRecordsCount} valid / {failedRecords.length} flagged
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Pending Sync Queue</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">{unsyncedCount}</div>
          <div className="text-[10px] text-amber-700 font-medium">
            {unsyncedCount > 0 ? 'Will sync on reconnect' : 'All valid synced'}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Student Candidates</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{uniqueStudents}</div>
          <div className="text-[10px] text-slate-500 font-medium">Unique candidates</div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Data Integrity Check</span>
            <ShieldAlert className={`w-4 h-4 ${failedRecords.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-xl font-black ${failedRecords.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {failedRecords.length > 0 ? `${failedRecords.length} Corrupted` : '100% Passed'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {lastValidatedAt ? `Audit timer active (${lastValidatedAt})` : 'Timer running'}
          </div>
        </div>
      </div>

      {/* Chart Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <span>Aggregate View:</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
          {[
            { id: 'subject', label: 'By Subject' },
            { id: 'classCohort', label: 'By Class Cohort' },
            { id: 'day', label: 'By Completion Date' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAggregationMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                aggregationMode === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bar Chart Rendering */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                        <div className="font-black text-indigo-300">{data.label}</div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Valid Offline Exams:</span>
                          <span className="font-bold text-white">{data.count} exam(s)</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Average Score:</span>
                          <span className="font-bold text-emerald-400">{data.avgScore}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fillColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-8 h-8 opacity-50" />
            <p className="text-xs font-bold">No valid offline completed CBT exams recorded in localStorage</p>
          </div>
        )}
      </div>

      {/* Footer Info / Sync status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Automatic validation timer active: local records audited for schema integrity prior to cloud merging</span>
        </div>
        <div className="flex items-center gap-2">
          {lastValidatedAt && (
            <div className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Integrity timer: {lastValidatedAt}
            </div>
          )}
          {lastSyncedAt && (
            <div className="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
              Last synced: {lastSyncedAt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineCbtChart;
