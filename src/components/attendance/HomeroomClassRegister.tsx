import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Users, CheckCircle2, XCircle, Clock, AlertCircle, 
  Search, Download, Printer, Save, RefreshCw, FileText, Filter, 
  Check, Sparkles, UserCheck, UserX, UserMinus, ShieldCheck,
  ChevronLeft, ChevronRight, PenTool, Edit3, Send, BellRing, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader } from '../PrintOnlySchoolHeader';
import { AttendanceStatus, StudentAttendanceRecord } from '../../types';

export const DEFAULT_CLASSES = [
  'SS 2 Science A',
  'SS 2 Science B',
  'SS 1 Arts A',
  'JSS 3 Gold',
  'JSS 1 Emerald',
  'Primary 5 Topaz'
];

export const INITIAL_STUDENTS_MOCK: Record<string, StudentAttendanceRecord[]> = {
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
  ]
};

export interface HomeroomClassRegisterProps {
  currentProfile?: any;
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: {
    name?: string;
    logo_url?: string;
  };
}

export default function HomeroomClassRegister({
  currentProfile,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo
}: HomeroomClassRegisterProps) {
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (currentProfile?.gradeLevel) {
      const match = DEFAULT_CLASSES.find(c => c.toLowerCase().includes(currentProfile.gradeLevel.toLowerCase()));
      if (match) return match;
    }
    return 'SS 2 Science A';
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [sessionType, setSessionType] = useState<'morning' | 'afternoon'>('morning');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [ariaLiveAnnouncement, setAriaLiveAnnouncement] = useState<string>('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const storageKey = `cs_attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`;

  // Load records from local storage or fallback to mock
  const [records, setRecords] = useState<StudentAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed loading attendance:', e);
    }
    return INITIAL_STUDENTS_MOCK['SS 2 Science A'] || [];
  });

  // Reload when class, date or session changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setRecords(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const baseList = INITIAL_STUDENTS_MOCK[selectedClass] || [
      { id: 'STU-101', admissionNo: 'CS/2024/101', fullName: 'Agbo Samuel', gender: 'M', status: 'present', timeIn: '07:45 AM' },
      { id: 'STU-102', admissionNo: 'CS/2024/102', fullName: 'Bello Fatimah', gender: 'F', status: 'present', timeIn: '07:50 AM' },
      { id: 'STU-103', admissionNo: 'CS/2024/103', fullName: 'Eke Clement', gender: 'M', status: 'absent', note: 'Sickness' },
      { id: 'STU-104', admissionNo: 'CS/2024/104', fullName: 'Nwosu Mercy', gender: 'F', status: 'late', note: 'Bus delay', timeIn: '08:10 AM' },
      { id: 'STU-105', admissionNo: 'CS/2024/105', fullName: 'Okanlawon Segun', gender: 'M', status: 'present', timeIn: '07:40 AM' },
    ];
    setRecords(baseList);
  }, [selectedClass, selectedDate, sessionType]);

  // Save register handler
  const handleSaveRegister = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
      
      // Save to global audit register key
      const auditPayload = {
        id: `att_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`,
        classArm: selectedClass,
        sessionType,
        date: selectedDate,
        recordedByTeacherName: currentProfile?.fullName || 'Class Teacher',
        recordedByTeacherId: currentProfile?.id || 'TCH-001',
        records,
        summary: stats,
        savedAt: new Date().toISOString()
      };
      const masterList = JSON.parse(localStorage.getItem('CS_HOMEROOM_ATTENDANCE_SESSIONS') || '{}');
      masterList[auditPayload.id] = auditPayload;
      localStorage.setItem('CS_HOMEROOM_ATTENDANCE_SESSIONS', JSON.stringify(masterList));

      // Also sync to central school-wide registry
      const centralMaster = JSON.parse(localStorage.getItem('CS_SCHOOL_ATTENDANCE_REGISTRY') || '{}');
      const centralEntryId = `ATT_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${sessionType}`.toUpperCase();
      centralMaster[centralEntryId] = {
        id: centralEntryId,
        schoolId: currentProfile?.school_id || 'CS-CENTRAL-01',
        classArm: selectedClass,
        sessionType,
        academicSession: activeSession,
        academicTerm: activeTerm,
        date: selectedDate,
        recordedByTeacherId: currentProfile?.id || 'TCH-001',
        recordedByTeacherName: currentProfile?.fullName || 'Class Teacher',
        totalStudents: stats.total,
        presentCount: stats.present,
        absentCount: stats.absent,
        lateCount: stats.late,
        excusedCount: stats.excused,
        attendanceRate: stats.rate,
        records,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('CS_SCHOOL_ATTENDANCE_REGISTRY', JSON.stringify(centralMaster));

      setTimeout(() => {
        setIsSaving(false);
        toast.success(`Homeroom register committed & synced for ${selectedClass} (${selectedDate})!`);
      }, 400);
    } catch (e) {
      setIsSaving(false);
      toast.error('Failed to save attendance register.');
    }
  };

  // Status toggle handler
  const handleSetStatus = (id: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        const timeIn = status === 'present' || status === 'late' ? (rec.timeIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : undefined;
        setAriaLiveAnnouncement(`${rec.fullName} marked as ${status}`);
        return { ...rec, status, timeIn };
      }
      return rec;
    }));
  };

  // Row Keyboard Navigation Handler (ArrowUp, ArrowDown, and Direct P/A/L/E keys)
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, student: StudentAttendanceRecord) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(filteredRecords.length - 1, index + 1);
      setFocusedRowIndex(nextIndex);
      const nextRow = document.getElementById(`homeroom-row-${nextIndex}`);
      if (nextRow) nextRow.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(0, index - 1);
      setFocusedRowIndex(prevIndex);
      const prevRow = document.getElementById(`homeroom-row-${prevIndex}`);
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
  };

  // Batch action handlers
  const handleBatchMark = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(rec => ({
      ...rec,
      status,
      timeIn: status === 'present' || status === 'late' ? (rec.timeIn || '08:00 AM') : undefined
    })));
    toast.info(`Marked all students as ${status.toUpperCase()} for this register.`);
  };

  // Date Shift Helper
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Notify Absent Parents
  const handleNotifyAbsentParents = () => {
    const absentees = records.filter(r => r.status === 'absent');
    if (absentees.length === 0) {
      toast.info('No students marked absent today.');
      return;
    }
    toast.success(`Dispatched automated absentee alert notices to ${absentees.length} parents via SMS & Portal!`);
  };

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

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filterStatus]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = 'Admission No,Student Name,Gender,Status,Time In,Notes/Excuses\n';
    const rows = records.map(r => 
      `"${r.admissionNo}","${r.fullName}","${r.gender}","${r.status.toUpperCase()}","${r.timeIn || '-'}","${(r.note || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Homeroom_Register_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported attendance register to CSV sheet!');
  };

  // Trigger print
  const handlePrintRegister = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

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
                Homeroom Class Daily Register
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Form Teacher Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mark morning and afternoon student attendance roll calls. Records auto-sync to broadsheets & terminal report cards.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBatchMark('present')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Quickly mark all students present"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={handleNotifyAbsentParents}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Send notice to parents of absent students"
            >
              <BellRing className="w-4 h-4 text-amber-600" />
              <span>Notify Absentees ({stats.absent})</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrintRegister}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>

            <button
              onClick={handleSaveRegister}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Syncing...' : 'Save & Sync'}</span>
            </button>
          </div>
        </div>

        {/* CONTROLS ROW: CLASS PICKER, DATE PICKER, SESSION TYPE */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 items-center">
          
          {/* CUSTOM CLASS SELECTOR (Rule-compliant: No native select) */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Select Class Arm
            </label>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer"
            >
              <span className="truncate">{selectedClass}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isClassDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsClassDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {DEFAULT_CLASSES.map(cls => (
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

          {/* DATE SELECTOR */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Attendance Date
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="h-10 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="h-10 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
                <span>🌅 Morning Roll</span>
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
              Find Student
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name / admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Class Roll</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Enrolled Students</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-emerald-700">Present</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-800">{stats.present}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">On-time in class</p>
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
            subtitle={`Class: ${selectedClass} | Date: ${selectedDate} | Session: ${sessionType.toUpperCase()} | Term: ${activeTerm} (${activeSession})`}
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
                      id={`homeroom-row-${idx}`}
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

                        {/* PRINT ONLY TEXT BADGE */}
                        <span className="hidden print:inline-block font-mono font-bold uppercase text-[11px]">
                          {st.status}
                        </span>
                      </td>

                      {/* TIME IN */}
                      <td role="gridcell" className="py-3 px-4 text-center font-mono font-semibold text-slate-600">
                        {st.timeIn || '-'}
                      </td>

                      {/* NOTES / REASON */}
                      <td role="gridcell" className="py-3 px-4">
                        <input
                          type="text"
                          value={st.note || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateNote(st.id, e.target.value)}
                          aria-label={`Teacher note for ${st.fullName}`}
                          placeholder="Add reason/medical note..."
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-xs text-slate-700 outline-none transition placeholder:text-slate-300 print:bg-transparent print:border-none print:p-0"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
