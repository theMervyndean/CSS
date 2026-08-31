import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, CalendarDays, Users, CheckCircle2, XCircle, Clock, AlertCircle, 
  Search, Download, Printer, Save, RefreshCw, FileText, Filter, 
  Check, Sparkles, UserCheck, UserX, UserMinus, ShieldCheck,
  ChevronLeft, ChevronRight, PenTool, Edit3, Send, BellRing, 
  ChevronDown, Database, Eye, History, Trash2, ArrowRight, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader } from './PrintOnlySchoolHeader';
import { DailyAttendancePrintModal } from './DailyAttendancePrintModal';
import { 
  AttendanceStatus, 
  StudentAttendanceRecord, 
  SchoolAttendanceRegistryEntry 
} from '../types';

export const DEFAULT_CLASS_ARMS = [
  'SS 2 Science A',
  'SS 2 Science B',
  'SS 1 Arts A',
  'JSS 3 Gold',
  'JSS 1 Emerald',
  'Primary 5 Topaz'
];

export const INITIAL_STUDENT_ROSTERS: Record<string, StudentAttendanceRecord[]> = {
  'SS 2 Science A': [
    { id: 'STU-001', admissionNo: 'CS/2024/001', fullName: 'Adeboye Chukwuemeka', gender: 'M', status: 'present', timeIn: '07:45 AM' },
    { id: 'STU-002', admissionNo: 'CS/2024/002', fullName: 'Babalola Amina', gender: 'F', status: 'present', timeIn: '07:50 AM' },
    { id: 'STU-003', admissionNo: 'CS/2024/003', fullName: 'Chioma Precious Nnamdi', gender: 'F', status: 'late', note: 'School bus delay', timeIn: '08:15 AM' },
    { id: 'STU-004', admissionNo: 'CS/2024/004', fullName: 'Danladi Usman Garba', gender: 'M', status: 'present', timeIn: '07:40 AM' },
    { id: 'STU-005', admissionNo: 'CS/2024/005', fullName: 'Ezeifedi David Ikechukwu', gender: 'M', status: 'absent', note: 'Parent called: Fever' },
    { id: 'STU-006', admissionNo: 'CS/2024/006', fullName: 'Fagbemi Folake Sarah', gender: 'F', status: 'present', timeIn: '07:52 AM' },
    { id: 'STU-007', admissionNo: 'CS/2024/007', fullName: 'Ibrahim Farouk Aliyu', gender: 'M', status: 'excused', note: 'Inter-school debate tournament' },
    { id: 'STU-008', admissionNo: 'CS/2024/008', fullName: 'John Blessing Olamide', gender: 'F', status: 'present', timeIn: '07:35 AM' },
    { id: 'STU-009', admissionNo: 'CS/2024/009', fullName: 'Kalu Emmanuel Chidi', gender: 'M', status: 'present', timeIn: '07:48 AM' },
    { id: 'STU-010', admissionNo: 'CS/2024/010', fullName: 'Lawal Temitope Zainab', gender: 'F', status: 'late', note: 'Traffic congestion', timeIn: '08:20 AM' },
  ],
  'SS 2 Science B': [
    { id: 'STU-011', admissionNo: 'CS/2024/011', fullName: 'Mustapha Kabir', gender: 'M', status: 'present', timeIn: '07:42 AM' },
    { id: 'STU-012', admissionNo: 'CS/2024/012', fullName: 'Nwokolo Grace', gender: 'F', status: 'present', timeIn: '07:50 AM' },
    { id: 'STU-013', admissionNo: 'CS/2024/013', fullName: 'Okafor Chinedu', gender: 'M', status: 'present', timeIn: '07:38 AM' },
    { id: 'STU-014', admissionNo: 'CS/2024/014', fullName: 'Peters Anita', gender: 'F', status: 'absent', note: 'Medical appointment' },
    { id: 'STU-015', admissionNo: 'CS/2024/015', fullName: 'Suleiman Yusuf', gender: 'M', status: 'present', timeIn: '07:55 AM' }
  ],
  'SS 1 Arts A': [
    { id: 'STU-021', admissionNo: 'CS/2024/021', fullName: 'Abubakar Aisha', gender: 'F', status: 'present', timeIn: '07:40 AM' },
    { id: 'STU-022', admissionNo: 'CS/2024/022', fullName: 'Chukwuma Donald', gender: 'M', status: 'present', timeIn: '07:44 AM' },
    { id: 'STU-023', admissionNo: 'CS/2024/023', fullName: 'Disu Daniel', gender: 'M', status: 'late', note: 'Flat tire', timeIn: '08:12 AM' },
    { id: 'STU-024', admissionNo: 'CS/2024/024', fullName: 'Eniola Kehinde', gender: 'F', status: 'present', timeIn: '07:49 AM' }
  ],
  'JSS 3 Gold': [
    { id: 'STU-031', admissionNo: 'CS/2024/031', fullName: 'Garba Halima', gender: 'F', status: 'present', timeIn: '07:35 AM' },
    { id: 'STU-032', admissionNo: 'CS/2024/032', fullName: 'Haruna Joseph', gender: 'M', status: 'present', timeIn: '07:42 AM' },
    { id: 'STU-033', admissionNo: 'CS/2024/033', fullName: 'Idowu Samuel', gender: 'M', status: 'present', timeIn: '07:45 AM' },
    { id: 'STU-034', admissionNo: 'CS/2024/034', fullName: 'Jatau Mary', gender: 'F', status: 'absent', note: 'Family travel' }
  ],
  'JSS 1 Emerald': [
    { id: 'STU-041', admissionNo: 'CS/2024/041', fullName: 'Kazeem Oladipo', gender: 'M', status: 'present', timeIn: '07:38 AM' },
    { id: 'STU-042', admissionNo: 'CS/2024/042', fullName: 'Luka Grace', gender: 'F', status: 'present', timeIn: '07:46 AM' },
    { id: 'STU-043', admissionNo: 'CS/2024/043', fullName: 'Mohammed Sadiq', gender: 'M', status: 'present', timeIn: '07:50 AM' }
  ],
  'Primary 5 Topaz': [
    { id: 'STU-051', admissionNo: 'CS/2024/051', fullName: 'Nnamdi Chisom', gender: 'F', status: 'present', timeIn: '07:40 AM' },
    { id: 'STU-052', admissionNo: 'CS/2024/052', fullName: 'Oluwaseun David', gender: 'M', status: 'present', timeIn: '07:45 AM' },
    { id: 'STU-053', admissionNo: 'CS/2024/053', fullName: 'Pamela Godwin', gender: 'F', status: 'present', timeIn: '07:52 AM' }
  ]
};

export const CENTRAL_REGISTRY_STORAGE_KEY = 'CS_SCHOOL_ATTENDANCE_REGISTRY';

// Helper: Format Date String to Display Name
export function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Helper: Relative Date Label (Today, Yesterday, N days ago)
export function getRelativeDateLabel(dateStr: string): string {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === -2) return '2 days ago';
    if (diffDays === -3) return '3 days ago';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  } catch {
    return '';
  }
}

// Helper: Check if date string is in the past
export function isDateInPast(dateStr: string): boolean {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    target.setHours(0, 0, 0, 0);
    return target.getTime() < today.getTime();
  } catch {
    return false;
  }
}

export interface DailyAttendanceProps {
  currentProfile?: any;
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: {
    name?: string;
    logo_url?: string;
  };
}

export function DailyAttendance({
  currentProfile,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo
}: DailyAttendanceProps) {
  // Assigned class arm for the teacher
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (currentProfile?.gradeLevel) {
      const match = DEFAULT_CLASS_ARMS.find(c => c.toLowerCase().includes(currentProfile.gradeLevel.toLowerCase()));
      if (match) return match;
    }
    if (currentProfile?.arm) {
      const match = DEFAULT_CLASS_ARMS.find(c => c.toLowerCase().includes(currentProfile.arm.toLowerCase()));
      if (match) return match;
    }
    return 'SS 2 Science A';
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [sessionType, setSessionType] = useState<'morning' | 'afternoon'>('morning');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [ariaLiveAnnouncement, setAriaLiveAnnouncement] = useState<string>('');
  
  // Custom dropdown & date picker states
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRegistryViewOpen, setIsRegistryViewOpen] = useState(false);
  const [registryFilterClass, setRegistryFilterClass] = useState<string>('ALL');

  // Calendar View month & year for interactive date picker
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date(selectedDate + 'T00:00:00'));

  // Keep calendar view month in sync when selectedDate changes externally
  useEffect(() => {
    try {
      setCalendarViewDate(new Date(selectedDate + 'T00:00:00'));
    } catch (e) {
      console.error(e);
    }
  }, [selectedDate]);

  // Key for local classroom session
  const currentSessionKey = `cs_attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`;

  // Load students records
  const [records, setRecords] = useState<StudentAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(currentSessionKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed loading daily attendance records:', e);
    }
    return INITIAL_STUDENT_ROSTERS['SS 2 Science A'] || [];
  });

  // Track if current register is in sync with central registry
  const [isRegistrySynced, setIsRegistrySynced] = useState<boolean>(false);

  // Central Registry state for inspection
  const [centralRegistry, setCentralRegistry] = useState<Record<string, SchoolAttendanceRegistryEntry>>(() => {
    try {
      const saved = localStorage.getItem(CENTRAL_REGISTRY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed loading central school attendance registry:', e);
    }
    return {};
  });

  // Check if current entry is saved in central registry
  const checkCentralRegistryStatus = () => {
    try {
      const central = JSON.parse(localStorage.getItem(CENTRAL_REGISTRY_STORAGE_KEY) || '{}');
      const entryId = `ATT_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`.toUpperCase();
      setIsRegistrySynced(!!central[entryId]);
      setCentralRegistry(central);
    } catch (e) {
      console.error(e);
    }
  };

  // Reload records when class, date or session changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(currentSessionKey);
      if (saved) {
        setRecords(JSON.parse(saved));
        checkCentralRegistryStatus();
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const baseList = INITIAL_STUDENT_ROSTERS[selectedClass] || [
      { id: 'STU-101', admissionNo: 'CS/2024/101', fullName: 'Agbo Samuel', gender: 'M', status: 'present', timeIn: '07:45 AM' },
      { id: 'STU-102', admissionNo: 'CS/2024/102', fullName: 'Bello Fatimah', gender: 'F', status: 'present', timeIn: '07:50 AM' },
      { id: 'STU-103', admissionNo: 'CS/2024/103', fullName: 'Eke Clement', gender: 'M', status: 'absent', note: 'Sickness' },
      { id: 'STU-104', admissionNo: 'CS/2024/104', fullName: 'Nwosu Mercy', gender: 'F', status: 'late', note: 'Bus delay', timeIn: '08:10 AM' },
      { id: 'STU-105', admissionNo: 'CS/2024/105', fullName: 'Okanlawon Segun', gender: 'M', status: 'present', timeIn: '07:40 AM' },
    ];
    setRecords(baseList);
    checkCentralRegistryStatus();
  }, [selectedClass, selectedDate, sessionType, currentSessionKey]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const effectivePresent = present + late;
    const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

    return { total, present, late, absent, excused, rate };
  }, [records]);

  // Central Registry list array
  const registryEntriesList: SchoolAttendanceRegistryEntry[] = useMemo(() => {
    const list = Object.values(centralRegistry) as SchoolAttendanceRegistryEntry[];
    return list.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }, [centralRegistry]);

  // Dates with recorded attendance in Central Registry for this class arm
  const pastRegisteredDatesForCurrentClass = useMemo(() => {
    const datesMap = new Map<string, SchoolAttendanceRegistryEntry>();
    registryEntriesList.forEach(entry => {
      if (entry.classArm === selectedClass) {
        if (!datesMap.has(entry.date) || entry.sessionType === sessionType) {
          datesMap.set(entry.date, entry);
        }
      }
    });
    return Array.from(datesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [registryEntriesList, selectedClass, sessionType]);

  // Set of all recorded dates across the school for calendar indicator dots
  const datesWithSavedAttendance = useMemo(() => {
    const classDates = new Set<string>();
    const allSchoolDates = new Set<string>();
    registryEntriesList.forEach(entry => {
      allSchoolDates.add(entry.date);
      if (entry.classArm === selectedClass) {
        classDates.add(entry.date);
      }
    });
    return { classDates, allSchoolDates };
  }, [registryEntriesList, selectedClass]);

  // Save Attendance to Local Storage & Central School-wide Registry
  const handleSaveToCentralRegistry = () => {
    setIsSaving(true);
    try {
      // 1. Save to classroom session key
      localStorage.setItem(currentSessionKey, JSON.stringify(records));

      // 2. Format Central School-wide Registry Entry
      const entryId = `ATT_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`.toUpperCase();
      const registryEntry: SchoolAttendanceRegistryEntry = {
        id: entryId,
        schoolId: currentProfile?.school_id || 'CS-CENTRAL-01',
        classArm: selectedClass,
        sessionType,
        academicSession: activeSession,
        academicTerm: activeTerm,
        date: selectedDate,
        recordedByTeacherId: currentProfile?.id || 'TCH-001',
        recordedByTeacherName: currentProfile?.fullName || 'Assigned Class Teacher',
        totalStudents: stats.total,
        presentCount: stats.present,
        absentCount: stats.absent,
        lateCount: stats.late,
        excusedCount: stats.excused,
        attendanceRate: stats.rate,
        records: records,
        savedAt: new Date().toISOString()
      };

      // 3. Commit to Central School-Wide Registry in localStorage
      const existingCentral: Record<string, SchoolAttendanceRegistryEntry> = JSON.parse(
        localStorage.getItem(CENTRAL_REGISTRY_STORAGE_KEY) || '{}'
      );
      existingCentral[entryId] = registryEntry;
      localStorage.setItem(CENTRAL_REGISTRY_STORAGE_KEY, JSON.stringify(existingCentral));
      
      // Update state
      setCentralRegistry(existingCentral);
      setIsRegistrySynced(true);

      setTimeout(() => {
        setIsSaving(false);
        const relLabel = getRelativeDateLabel(selectedDate);
        toast.success(
          `Attendance registered for ${selectedClass} on ${formatDateDisplay(selectedDate)} (${relLabel}) [${sessionType.toUpperCase()}]!`
        );
      }, 400);
    } catch (e) {
      setIsSaving(false);
      toast.error('Failed to commit attendance to Central School Registry.');
      console.error(e);
    }
  };

  // Status toggle handler
  const handleSetStatus = (id: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        const timeIn = status === 'present' || status === 'late' 
          ? (rec.timeIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) 
          : undefined;
        setAriaLiveAnnouncement(`${rec.fullName} marked as ${status}`);
        return { ...rec, status, timeIn };
      }
      return rec;
    }));
    setIsRegistrySynced(false);
  };

  // Row Keyboard Navigation Handler (ArrowUp, ArrowDown, P, A, L, E)
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, student: StudentAttendanceRecord) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(filteredRecords.length - 1, index + 1);
      setFocusedRowIndex(nextIndex);
      const nextRow = document.getElementById(`daily-att-row-${nextIndex}`);
      if (nextRow) nextRow.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(0, index - 1);
      setFocusedRowIndex(prevIndex);
      const prevRow = document.getElementById(`daily-att-row-${prevIndex}`);
      if (prevRow) prevRow.focus();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      handleSetStatus(student.id, 'present');
      toast.success(`${student.fullName} -> PRESENT (Key P)`);
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      handleSetStatus(student.id, 'absent');
      toast.error(`${student.fullName} -> ABSENT (Key A)`);
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      handleSetStatus(student.id, 'late');
      toast.warning(`${student.fullName} -> LATE (Key L)`);
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      handleSetStatus(student.id, 'excused');
      toast.info(`${student.fullName} -> EXCUSED (Key E)`);
    }
  };

  // Update note handler
  const handleUpdateNote = (id: string, note: string) => {
    setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, note } : rec));
    setIsRegistrySynced(false);
  };

  // Batch action handlers
  const handleBatchMark = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => ({
      ...rec,
      status,
      timeIn: status === 'present' || status === 'late' ? (rec.timeIn || '08:00 AM') : undefined
    })));
    setIsRegistrySynced(false);
    toast.info(`Marked all assigned students as ${status.toUpperCase()}.`);
  };

  // Date Shift Helper
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Calendar Navigation Helpers
  const handleCalendarShiftMonth = (months: number) => {
    const next = new Date(calendarViewDate);
    next.setMonth(next.getMonth() + months);
    setCalendarViewDate(next);
  };

  // Generate Calendar Days for Current Month View
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    // First day of month and total days
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Days from previous month to fill grid
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
      hasCurrentClassRecord: boolean;
      hasOtherSchoolRecord: boolean;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: isDateInPast(dateStr),
        hasCurrentClassRecord: datesWithSavedAttendance.classDates.has(dateStr),
        hasOtherSchoolRecord: datesWithSavedAttendance.allSchoolDates.has(dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: isDateInPast(dateStr),
        hasCurrentClassRecord: datesWithSavedAttendance.classDates.has(dateStr),
        hasOtherSchoolRecord: datesWithSavedAttendance.allSchoolDates.has(dateStr)
      });
    }

    // Next month padding to fill grid
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: isDateInPast(dateStr),
        hasCurrentClassRecord: datesWithSavedAttendance.classDates.has(dateStr),
        hasOtherSchoolRecord: datesWithSavedAttendance.allSchoolDates.has(dateStr)
      });
    }

    return days;
  }, [calendarViewDate, selectedDate, todayStr, datesWithSavedAttendance]);

  // Quick past date presets
  const pastDatePresets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getFormatted = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    // Find last Friday / school day
    const getFridayOrLastSchoolDay = () => {
      const d = new Date(today);
      const day = d.getDay();
      if (day === 1) d.setDate(d.getDate() - 3);
      else if (day === 0) d.setDate(d.getDate() - 2);
      else if (day === 6) d.setDate(d.getDate() - 1);
      else d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    };

    return [
      { label: 'Today', date: todayStr, description: 'Current Day' },
      { label: 'Yesterday', date: getFormatted(1), description: '1 day ago' },
      { label: '2 Days Ago', date: getFormatted(2), description: '2 days ago' },
      { label: '3 Days Ago', date: getFormatted(3), description: '3 days ago' },
      { label: 'Last Friday', date: getFridayOrLastSchoolDay(), description: 'Previous school week end' },
      { label: '1 Week Ago', date: getFormatted(7), description: '7 days ago' },
    ];
  }, [todayStr]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filterStatus]);

  // Filtered central registry entries
  const filteredRegistryEntries = useMemo(() => {
    if (registryFilterClass === 'ALL') return registryEntriesList;
    return registryEntriesList.filter(e => e.classArm === registryFilterClass);
  }, [registryEntriesList, registryFilterClass]);

  // Load a record from Central Registry back into active register
  const handleLoadFromRegistry = (entry: SchoolAttendanceRegistryEntry) => {
    setSelectedClass(entry.classArm);
    setSelectedDate(entry.date);
    setSessionType(entry.sessionType);
    setRecords(entry.records);
    setIsRegistrySynced(true);
    setIsRegistryViewOpen(false);
    toast.success(`Loaded attendance roll call for ${entry.classArm} (${formatDateDisplay(entry.date)}) from Central Registry!`);
  };

  // Delete an entry from central registry
  const handleDeleteRegistryEntry = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = { ...centralRegistry };
      delete updated[entryId];
      localStorage.setItem(CENTRAL_REGISTRY_STORAGE_KEY, JSON.stringify(updated));
      setCentralRegistry(updated);
      checkCentralRegistryStatus();
      toast.info('Removed session record from Central School Registry.');
    } catch (err) {
      toast.error('Failed to delete registry record.');
    }
  };

  // Export current class attendance to CSV
  const handleExportCSV = () => {
    const headers = 'Admission No,Student Name,Gender,Class,Date,Session,Status,Time In,Remarks\n';
    const rows = records.map(r => 
      `"${r.admissionNo}","${r.fullName}","${r.gender}","${selectedClass}","${selectedDate}","${sessionType}","${r.status.toUpperCase()}","${r.timeIn || '-'}","${(r.note || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported attendance record to CSV!');
  };

  // Export central registry to CSV
  const handleExportCentralRegistryCSV = () => {
    if (registryEntriesList.length === 0) {
      toast.error('No registry records to export.');
      return;
    }
    const headers = 'Registry ID,Class Arm,Date,Session,Term,Academic Session,Recorded By,Total,Present,Absent,Late,Excused,Rate %,Committed At\n';
    const rows = registryEntriesList.map(e => 
      `"${e.id}","${e.classArm}","${e.date}","${e.sessionType.toUpperCase()}","${e.academicTerm}","${e.academicSession}","${e.recordedByTeacherName}","${e.totalStudents}","${e.presentCount}","${e.absentCount}","${e.lateCount}","${e.excusedCount}","${e.attendanceRate}%","${e.savedAt}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `School_Wide_Attendance_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported Central School Attendance Registry to CSV!');
  };

  const isPast = isDateInPast(selectedDate);
  const relativeDateLabel = getRelativeDateLabel(selectedDate);
  const formattedDateTitle = formatDateDisplay(selectedDate);

  return (
    <div className="space-y-6 font-sans">
      {/* PRINT-ONLY CSS OVERLAY */}
      {isPrintMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 px-4 py-2 font-bold text-xs flex items-center justify-between shadow-lg print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 animate-bounce" />
            <span>Clean A4 Printable Register Mode Active</span>
          </div>
          <button
            onClick={() => setIsPrintMode(false)}
            className="px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-black transition cursor-pointer text-xs"
          >
            Exit Print Mode
          </button>
        </div>
      )}

      {/* HEADER BAR & CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Class Teacher Daily Attendance Register
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Central Registry Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mark and audit morning or afternoon roll calls for current or past dates. All entries save directly to the central school registry.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsRegistryViewOpen(!isRegistryViewOpen)}
              className={`px-3 py-2 border rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                isRegistryViewOpen 
                  ? 'bg-indigo-950 text-white border-indigo-900' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
              title="Inspect Central School Registry in localStorage"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Central Registry ({registryEntriesList.length})</span>
            </button>

            <button
              onClick={() => handleBatchMark('present')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Quickly mark all students present"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              id="btn-print-official-registry"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Generate printable official A4 report with school branding and certification"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Print Official Registry</span>
            </button>

            <button
              id="btn-save-central-registry"
              onClick={handleSaveToCentralRegistry}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Registering...' : 'Save to Central Registry'}</span>
            </button>
          </div>
        </div>

        {/* SYNC STATUS NOTIFICATION BANNER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRegistrySynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold text-slate-700">
              {isRegistrySynced ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Synced in Central Registry ({selectedClass} • {formattedDateTitle})
                </span>
              ) : (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Unsaved changes for {formattedDateTitle} — Click "Save to Central Registry" to commit.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            {isPast ? (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md flex items-center gap-1">
                <History className="w-3 h-3 text-amber-600" />
                Past Date Register ({relativeDateLabel})
              </span>
            ) : selectedDate === todayStr ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Today's Register
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-md">
                Future Date
              </span>
            )}
          </div>
        </div>

        {/* CONTROLS ROW: CLASS PICKER, DEDICATED DATE PICKER, SESSION TYPE, SEARCH */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 items-start">
          
          {/* CUSTOM CLASS SELECTOR (Rule-compliant: No native select) */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Assigned Class Arm
            </label>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer shadow-xs"
            >
              <span className="truncate">{selectedClass}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isClassDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsClassDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {DEFAULT_CLASS_ARMS.map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setIsClassDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        selectedClass === cls
                          ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white'
                          : 'hover:bg-emerald-600 hover:text-white text-slate-700'
                      }`}
                    >
                      <span>{cls}</span>
                      {selectedClass === cls && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DEDICATED INTERACTIVE DATE PICKER (With Calendar & Past Date Management) */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center justify-between">
              <span>Attendance Date Picker</span>
              <span className="text-indigo-600 font-bold lowercase">{relativeDateLabel}</span>
            </label>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="h-10 w-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-pointer transition shrink-0"
                title="Previous Day (Shift backward)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-open-date-picker"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex-1 h-10 px-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 flex items-center justify-between gap-1.5 transition cursor-pointer shadow-xs"
                title="Open calendar to view and select past or current dates"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{formattedDateTitle}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="h-10 w-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-pointer transition shrink-0"
                title="Next Day (Shift forward)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* INTERACTIVE CALENDAR & DATE SELECTOR POPOVER */}
            {isDatePickerOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsDatePickerOpen(false)} />
                <div className="absolute left-0 sm:-left-6 top-full mt-1.5 w-[330px] sm:w-[360px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* CALENDAR HEADER (Month & Year Navigator) */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCalendarShiftMonth(-1)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setCalendarViewDate(today);
                          setSelectedDate(todayStr);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-[10.5px] font-bold text-slate-700 rounded-md transition cursor-pointer"
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCalendarShiftMonth(1)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* QUICK PAST DATE PRESETS BAR */}
                  <div>
                    <span className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                      Quick Past Date Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {pastDatePresets.map(preset => {
                        const isPresetActive = selectedDate === preset.date;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setSelectedDate(preset.date);
                              setCalendarViewDate(new Date(preset.date + 'T00:00:00'));
                              setIsDatePickerOpen(false);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition text-left cursor-pointer flex flex-col ${
                              isPresetActive
                                ? 'bg-indigo-950 text-white shadow-xs'
                                : 'bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200/60'
                            }`}
                          >
                            <span>{preset.label}</span>
                            <span className={`text-[9px] font-normal font-mono ${isPresetActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-emerald-100'}`}>
                              {preset.date.slice(5)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CALENDAR DAYS OF THE WEEK */}
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-black uppercase text-slate-400 border-t border-slate-100 pt-2">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* CALENDAR DAYS GRID */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      return (
                        <button
                          key={`${day.dateStr}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.dateStr);
                            setIsDatePickerOpen(false);
                          }}
                          className={`relative h-9 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                            day.isSelected
                              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md z-10'
                              : day.isToday
                              ? 'bg-indigo-50 text-indigo-900 border border-indigo-300 font-black'
                              : !day.isCurrentMonth
                              ? 'text-slate-300 hover:bg-slate-50'
                              : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                          }`}
                          title={`${day.dateStr} ${day.hasCurrentClassRecord ? '(Has Saved Register)' : ''}`}
                        >
                          <span>{day.dayNumber}</span>
                          
                          {/* DOT INDICATOR FOR SAVED ATTENDANCE IN CENTRAL REGISTRY */}
                          {day.hasCurrentClassRecord ? (
                            <span 
                              className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                day.isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                              }`} 
                            />
                          ) : day.hasOtherSchoolRecord ? (
                            <span 
                              className={`absolute bottom-1 w-1 h-1 rounded-full ${
                                day.isSelected ? 'bg-indigo-200' : 'bg-indigo-400'
                              }`} 
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* CALENDAR LEGEND & DIRECT DATE INPUT */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Saved ({selectedClass.split(' ')[0]})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-50 border border-indigo-300 inline-block" />
                        <span>Today</span>
                      </span>
                    </div>

                    {/* DIRECT DATE INPUT FALLBACK */}
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(e.target.value);
                          setCalendarViewDate(new Date(e.target.value + 'T00:00:00'));
                        }
                      }}
                      className="text-[11px] font-mono font-bold text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 outline-none cursor-pointer"
                      title="Direct Date Selector"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SESSION TYPE TOGGLE (Morning / Afternoon) */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Roll Call Session
            </label>
            <div className="h-10 p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSessionType('morning')}
                className={`flex-1 h-full rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sessionType === 'morning'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🌅 Morning</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('afternoon')}
                className={`flex-1 h-full rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sessionType === 'afternoon'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>☀️ Afternoon</span>
              </button>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name / admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* QUICK PAST-REGISTER CHIPS FOR ACTIVE CLASS ARM */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 shrink-0">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Past Registers ({selectedClass}):</span>
          </div>

          {pastRegisteredDatesForCurrentClass.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">
              No previous dates committed in central registry for {selectedClass} yet. Pick any past date above to create a register.
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {pastRegisteredDatesForCurrentClass.map(entry => {
                const isCurrentActiveDate = entry.date === selectedDate;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setSelectedDate(entry.date);
                      setSessionType(entry.sessionType);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isCurrentActiveDate
                        ? 'bg-indigo-950 text-white shadow-xs'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/70'
                    }`}
                  >
                    <span>📅 {formatDateDisplay(entry.date)}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[10px] font-mono">
                      {entry.attendanceRate}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HISTORICAL PAST-DATE NOTICE BANNER */}
      {isPast && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs print:hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-xs text-amber-900 uppercase tracking-wide">
                Managing Historical Attendance Register • {formattedDateTitle} ({relativeDateLabel})
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {isRegistrySynced
                  ? `Viewing saved register for ${selectedClass} (${sessionType.toUpperCase()}). You can update student statuses, times, or remarks and re-commit to the central school registry.`
                  : `Creating or auditing a past attendance record for ${selectedClass}. Make your updates and click "Save to Central Registry" to finalize.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayStr);
                setCalendarViewDate(new Date());
              }}
              className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Today</span>
            </button>
          </div>
        </div>
      )}

      {/* CENTRAL SCHOOL-WIDE REGISTRY INSPECTION DRAWER / MODAL */}
      {isRegistryViewOpen && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-3 duration-200 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                  Central School-Wide Attendance Registry
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    (localStorage: {CENTRAL_REGISTRY_STORAGE_KEY})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  School-wide master archive aggregating all class attendance submissions across all grade arms and past dates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCentralRegistryCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Master CSV</span>
              </button>

              <button
                onClick={() => setIsRegistryViewOpen(false)}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>

          {/* FILTER CLASS ARMS IN REGISTRY */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Class:</span>
            <button
              onClick={() => setRegistryFilterClass('ALL')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                registryFilterClass === 'ALL'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Classes ({registryEntriesList.length})
            </button>
            {DEFAULT_CLASS_ARMS.map(cls => {
              const count = registryEntriesList.filter(e => e.classArm === cls).length;
              return (
                <button
                  key={cls}
                  onClick={() => setRegistryFilterClass(cls)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                    registryFilterClass === cls
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cls} ({count})
                </button>
              );
            })}
          </div>

          {/* REGISTRY ENTRIES GRID */}
          {filteredRegistryEntries.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              No attendance records recorded in the central registry for this filter yet.
              <p className="text-slate-600 text-[11px] mt-1">Mark your class register and click "Save to Central Registry".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredRegistryEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleLoadFromRegistry(entry)}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-3.5 space-y-2.5 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white group-hover:text-emerald-400 transition">
                      {entry.classArm}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 border border-slate-700">
                      {entry.sessionType.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>📅 {formatDateDisplay(entry.date)}</span>
                    <span className="text-emerald-400 font-bold">{entry.attendanceRate}% Rate</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-700/60 text-center text-[10.5px]">
                    <div className="bg-slate-900/60 rounded p-1">
                      <span className="text-slate-400 block text-[9px]">Total</span>
                      <b className="text-white font-mono">{entry.totalStudents}</b>
                    </div>
                    <div className="bg-emerald-950/40 rounded p-1 text-emerald-300">
                      <span className="block text-[9px]">Present</span>
                      <b className="font-mono">{entry.presentCount}</b>
                    </div>
                    <div className="bg-rose-950/40 rounded p-1 text-rose-300">
                      <span className="block text-[9px]">Absent</span>
                      <b className="font-mono">{entry.absentCount}</b>
                    </div>
                    <div className="bg-amber-950/40 rounded p-1 text-amber-300">
                      <span className="block text-[9px]">Late</span>
                      <b className="font-mono">{entry.lateCount}</b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                    <span className="truncate">By: {entry.recordedByTeacherName}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRegistryEntry(entry.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Delete from registry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        Load <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Class Roll</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Assigned Students</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-emerald-700">Present</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-800">{stats.present}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Marked present</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-700">Late Arrivals</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-800">{stats.late}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Arrived with delay</p>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-rose-700">Absent</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-800">{stats.absent}</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-[10px] text-rose-600 mt-1">Unexcused absence</p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-indigo-700">Excused</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-indigo-800">{stats.excused}</span>
            <UserMinus className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[10px] text-indigo-600 mt-1">Medical / Official</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Attendance Rate</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.rate}%</span>
            <div className={`w-2.5 h-2.5 rounded-full ${stats.rate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${stats.rate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${stats.rate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS HINT & ARIA LIVE */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2 text-[11px] text-indigo-900 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-extrabold uppercase tracking-wide bg-indigo-200/80 px-1.5 py-0.5 rounded text-[10px]">Keyboard Shortcuts</span>
          <span className="text-slate-600">Navigate rows with <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">↓</kbd> | Press <kbd className="px-1 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-mono font-bold">P</kbd> Present, <kbd className="px-1 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded font-mono font-bold">A</kbd> Absent, <kbd className="px-1 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded font-mono font-bold">L</kbd> Late, <kbd className="px-1 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-800 rounded font-mono font-bold">E</kbd> Excused</span>
        </div>
        <div role="status" aria-live="polite" className="sr-only">
          {ariaLiveAnnouncement}
        </div>
      </div>

      {/* MAIN ATTENDANCE REGISTER TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <PrintOnlySchoolHeader
            schoolName={schoolInfo?.name || "Corner Streams International Academy"}
            schoolLogoUrl={schoolInfo?.logo_url}
            title="DAILY CLASS ATTENDANCE REGISTER"
            subtitle={`Class: ${selectedClass} | Date: ${formattedDateTitle} (${selectedDate}) | Session: ${sessionType.toUpperCase()} | Term: ${activeTerm} (${activeSession})`}
          />
          <div className="grid grid-cols-4 gap-4 mt-4 text-xs font-mono">
            <div>Total Enrolled: <b>{stats.total}</b></div>
            <div>Present: <b>{stats.present}</b></div>
            <div>Absent: <b>{stats.absent}</b></div>
            <div>Attendance Rate: <b>{stats.rate}%</b></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table 
            role="grid"
            aria-label="Daily Student Attendance Register Grid"
            aria-rowcount={filteredRecords.length}
            aria-colcount={7}
            className="w-full text-left border-collapse"
          >
            <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500 tracking-wider font-mono">
              <tr role="row">
                <th role="columnheader" className="py-3 px-4">#</th>
                <th role="columnheader" className="py-3 px-4">Admission No</th>
                <th role="columnheader" className="py-3 px-4">Student Name</th>
                <th role="columnheader" className="py-3 px-4 text-center">Gender</th>
                <th role="columnheader" className="py-3 px-4 text-center">Attendance Status</th>
                <th role="columnheader" className="py-3 px-4 text-center">Time In</th>
                <th role="columnheader" className="py-3 px-4">Reason / Teacher Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr role="row">
                  <td colSpan={7} role="gridcell" className="py-12 text-center text-slate-400 font-medium">
                    No student attendance records match the search filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((st, idx) => {
                  const isFocused = focusedRowIndex === idx;
                  return (
                    <tr 
                      key={st.id}
                      id={`daily-att-row-${idx}`}
                      role="row"
                      aria-rowindex={idx + 1}
                      aria-selected={isFocused}
                      tabIndex={0}
                      onFocus={() => setFocusedRowIndex(idx)}
                      onKeyDown={(e) => handleRowKeyDown(e, idx, st)}
                      className={`transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-indigo-50/40 ${
                        isFocused ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td role="gridcell" className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td role="gridcell" className="py-3 px-4 font-mono font-bold text-slate-600">{st.admissionNo}</td>
                      <td role="gridcell" className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                      <td role="gridcell" className="py-3 px-4 text-center font-mono font-bold text-slate-500">{st.gender}</td>
                      
                      {/* STATUS TOGGLE BUTTONS */}
                      <td role="gridcell" className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 print:hidden">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(st.id, 'present'); }}
                            aria-label={`Mark ${st.fullName} as Present`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                              st.status === 'present' 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            <span>P</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(st.id, 'late'); }}
                            aria-label={`Mark ${st.fullName} as Late`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                              st.status === 'late' 
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            <span>L</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(st.id, 'absent'); }}
                            aria-label={`Mark ${st.fullName} as Absent`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                              st.status === 'absent' 
                                ? 'bg-rose-500 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            <span>A</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSetStatus(st.id, 'excused'); }}
                            aria-label={`Mark ${st.fullName} as Excused`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                              st.status === 'excused' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-indigo-700'
                            }`}
                          >
                            <span>E</span>
                          </button>
                        </div>

                        {/* PRINT ONLY TEXT STATUS */}
                        <div className="hidden print:block font-bold uppercase font-mono">
                          {st.status}
                        </div>
                      </td>

                      {/* TIME IN */}
                      <td role="gridcell" className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                        {st.timeIn || '—'}
                      </td>

                      {/* TEACHER NOTE */}
                      <td role="gridcell" className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add remark..."
                            value={st.note || ''}
                            onChange={(e) => handleUpdateNote(st.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent hover:bg-slate-100/60 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none transition print:border-none print:p-0"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT OFFICIAL REGISTRY MODAL PREVIEW */}
      <DailyAttendancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={filteredRecords}
        selectedClass={selectedClass}
        selectedDate={selectedDate}
        sessionType={sessionType}
        activeSession="2025/2026"
        activeTerm="1st Term"
        currentProfile={currentProfile}
      />
    </div>
  );
}

export default DailyAttendance;
