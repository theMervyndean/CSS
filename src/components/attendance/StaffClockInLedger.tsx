import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, CheckCircle2, AlertTriangle, UserCheck, UserX, 
  Calendar, ShieldCheck, Search, Printer, Download, Plus, 
  RefreshCw, Save, LogIn, LogOut, Award, Briefcase, 
  Fingerprint, Sparkles, Filter, Check, ChevronDown, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader } from '../PrintOnlySchoolHeader';
import { StaffDailyClockInRecord, StaffAttendanceStatus } from '../../types';

const INITIAL_STAFF_MOCK: StaffDailyClockInRecord[] = [
  {
    id: 'STAFF-REC-001',
    staffId: 'CS/STF/2021/01',
    teacherId: 'TCH-001',
    teacherName: 'Mrs. Folasade Adebayo',
    role: 'HOD Science / Senior Biology Teacher',
    department: 'Science Department',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '07:38 AM',
    status: 'ON_TIME',
    dutyRole: 'Teacher on Duty (TOD)',
    loginMethod: 'PORTAL_AUTO_CHECKIN',
    recordedAt: '2026-08-16T07:38:00.000Z'
  },
  {
    id: 'STAFF-REC-002',
    staffId: 'CS/STF/2022/04',
    teacherId: 'TCH-002',
    teacherName: 'Mr. Emmanuel Okonkwo',
    role: 'Mathematics & Further Math Instructor',
    department: 'Mathematics Department',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '07:45 AM',
    status: 'ON_TIME',
    dutyRole: 'Morning Assembly Proctor',
    loginMethod: 'PORTAL_AUTO_CHECKIN',
    recordedAt: '2026-08-16T07:45:00.000Z'
  },
  {
    id: 'STAFF-REC-003',
    staffId: 'CS/STF/2023/09',
    teacherId: 'TCH-003',
    teacherName: 'Dr. Chinedu Eze',
    role: 'Physics & STEM Coordinator',
    department: 'Science Department',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '08:18 AM',
    status: 'LATE',
    lateMinutes: 18,
    dutyRole: 'Laboratory Prep',
    loginMethod: 'PORTAL_AUTO_CHECKIN',
    note: 'Traffic delay on 3rd Mainland route',
    recordedAt: '2026-08-16T08:18:00.000Z'
  },
  {
    id: 'STAFF-REC-004',
    staffId: 'CS/STF/2020/02',
    teacherId: 'TCH-004',
    teacherName: 'Mrs. Abigail Danladi',
    role: 'English Literature Teacher',
    department: 'Arts & Humanities',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '07:50 AM',
    status: 'ON_TIME',
    dutyRole: 'Classroom Instruction',
    loginMethod: 'PORTAL_AUTO_CHECKIN',
    recordedAt: '2026-08-16T07:50:00.000Z'
  },
  {
    id: 'STAFF-REC-005',
    staffId: 'CS/STF/2024/11',
    teacherId: 'TCH-005',
    teacherName: 'Mr. Babatunde Lawal',
    role: 'Economics & Commerce Master',
    department: 'Commercial Department',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '-',
    status: 'ON_LEAVE',
    dutyRole: 'Medical Leave',
    loginMethod: 'ADMIN_MANUAL',
    note: 'Approved sick leave by Principal',
    recordedAt: '2026-08-16T06:00:00.000Z'
  },
  {
    id: 'STAFF-REC-006',
    staffId: 'CS/STF/2023/15',
    teacherId: 'TCH-006',
    teacherName: 'Miss Zainab Ibrahim',
    role: 'ICT & Computer Studies Instructor',
    department: 'ICT & Vocational',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '07:42 AM',
    status: 'ON_TIME',
    dutyRole: 'CBT Lab Proctor',
    loginMethod: 'BIOMETRIC_SIM',
    recordedAt: '2026-08-16T07:42:00.000Z'
  }
];

const DUTY_ROLES = [
  'Classroom Instruction',
  'Teacher on Duty (TOD)',
  'Morning Assembly Proctor',
  'Laboratory Prep / Practical',
  'CBT Lab Proctor',
  'Sports / Health Coordinator',
  'Library & Research Desk'
];

export interface StaffClockInLedgerProps {
  currentProfile?: any;
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: {
    name?: string;
    logo_url?: string;
  };
}

export default function StaffClockInLedger({
  currentProfile,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo
}: StaffClockInLedgerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [selectedDuty, setSelectedDuty] = useState<string>('Classroom Instruction');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isDutyDropdownOpen, setIsDutyDropdownOpen] = useState(false);

  // Storage key
  const storageKey = `cs_staff_attendance_${selectedDate}`;

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Staff records state
  const [staffRecords, setStaffRecords] = useState<StaffDailyClockInRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF_MOCK;
  });

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(staffRecords));
    } catch (e) {
      console.error(e);
    }
  }, [staffRecords, storageKey]);

  // Current user's clock in record
  const currentStaffId = currentProfile?.id || 'TCH-001';
  const myRecord = staffRecords.find(r => r.teacherId === currentStaffId || r.teacherName === currentProfile?.fullName);
  const isMyClockedIn = !!myRecord && myRecord.clockInTime !== '-';
  const isMyClockedOut = !!myRecord && !!myRecord.clockOutTime;

  // Teacher Self Clock-In Action
  const handleTeacherClockIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check punctuality: Threshold is 08:00 AM
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0);
    const lateMinutes = isLate ? (now.getHours() - 8) * 60 + now.getMinutes() : 0;
    const status: StaffAttendanceStatus = isLate ? 'LATE' : 'ON_TIME';

    const newRecord: StaffDailyClockInRecord = {
      id: `STAFF-REC-${Date.now()}`,
      staffId: currentProfile?.username || 'CS/STF/2026/01',
      teacherId: currentProfile?.id || 'TCH-001',
      teacherName: currentProfile?.fullName || 'Academic Staff',
      role: currentProfile?.role === 'School_Admin' ? 'School Administrator' : 'Subject Instructor / Class Master',
      department: currentProfile?.arm ? `${currentProfile.arm} Arm` : 'Academic Faculty',
      date: selectedDate,
      clockInTime: timeStr,
      status,
      lateMinutes: isLate ? lateMinutes : undefined,
      dutyRole: selectedDuty,
      loginMethod: 'PORTAL_AUTO_CHECKIN',
      recordedAt: now.toISOString()
    };

    setStaffRecords(prev => {
      const exists = prev.some(r => r.teacherId === newRecord.teacherId || r.teacherName === newRecord.teacherName);
      if (exists) {
        return prev.map(r => (r.teacherId === newRecord.teacherId || r.teacherName === newRecord.teacherName) ? newRecord : r);
      }
      return [newRecord, ...prev];
    });

    if (isLate) {
      toast.warning(`Clocked In at ${timeStr} (Late: +${lateMinutes} mins). Have a productive school day!`);
    } else {
      toast.success(`Clocked In ON TIME at ${timeStr}! Welcome to Corner Streams School Session.`);
    }
  };

  // Teacher Self Clock-Out Action
  const handleTeacherClockOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setStaffRecords(prev => prev.map(r => {
      if (r.teacherId === currentStaffId || r.teacherName === currentProfile?.fullName) {
        return { ...r, clockOutTime: timeStr };
      }
      return r;
    }));

    toast.success(`Clocked Out at ${timeStr}. Enjoy your evening!`);
  };

  // Admin Manual Clock-in / Status change
  const handleAdminStatusChange = (recId: string, status: StaffAttendanceStatus) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStaffRecords(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status,
          clockInTime: status === 'ABSENT' || status === 'ON_LEAVE' ? '-' : (r.clockInTime === '-' ? timeStr : r.clockInTime)
        };
      }
      return r;
    }));
    toast.info(`Updated staff attendance status to ${status}.`);
  };

  // Stats
  const stats = useMemo(() => {
    const total = staffRecords.length;
    const present = staffRecords.filter(r => r.status === 'ON_TIME' || r.status === 'LATE' || r.status === 'OFFICIAL_DUTY').length;
    const onTime = staffRecords.filter(r => r.status === 'ON_TIME').length;
    const late = staffRecords.filter(r => r.status === 'LATE').length;
    const onLeave = staffRecords.filter(r => r.status === 'ON_LEAVE').length;
    const absent = staffRecords.filter(r => r.status === 'ABSENT').length;
    const punctualityRate = present > 0 ? Math.round((onTime / present) * 100) : 0;

    return { total, present, onTime, late, onLeave, absent, punctualityRate };
  }, [staffRecords]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffRecords.filter(r => {
      const matchSearch = r.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [staffRecords, searchTerm, filterStatus]);

  // Export staff attendance to CSV
  const handleExportCSV = () => {
    const headers = 'Staff ID,Staff Name,Role,Department,Clock In,Clock Out,Status,Late (Min),Duty Role\n';
    const rows = staffRecords.map(r => 
      `"${r.staffId}","${r.teacherName}","${r.role}","${r.department}","${r.clockInTime}","${r.clockOutTime || '-'}","${r.status}","${r.lateMinutes || 0}","${r.dutyRole}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Staff_Attendance_Ledger_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported staff attendance roster to CSV!');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER & TEACHER SELF CLOCK-IN WIDGET */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white border border-indigo-800/80 shadow-xl space-y-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                <Fingerprint className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Staff & Teacher Daily Clock-In Desk
                </h2>
                <p className="text-xs text-indigo-200">
                  Electronic attendance clock-in, duty assignment logging & punctuality ledger.
                </p>
              </div>
            </div>
          </div>

          {/* LIVE DIGITAL SCHOOL CLOCK */}
          <div className="bg-indigo-900/60 border border-indigo-700/80 rounded-2xl px-5 py-3 flex items-center gap-4">
            <Clock className="w-8 h-8 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">Official School Time</p>
              <p className="text-xl font-mono font-black text-white tracking-wider">{currentTime}</p>
            </div>
            <div className="text-right border-l border-indigo-800 pl-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Punctuality Standard</p>
              <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Gate Lock: 08:00 AM
              </span>
            </div>
          </div>
        </div>

        {/* SELF CLOCK-IN INTERACTION CARD */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-900 border-2 border-emerald-400 shrink-0">
              <img 
                src={currentProfile?.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Logged In Faculty</p>
              <h4 className="text-sm font-black text-white truncate">{currentProfile?.fullName || 'Faculty Member'}</h4>
              <p className="text-[11px] text-emerald-300 font-mono">{currentProfile?.role || 'Teacher'} • {myRecord ? `Clocked in at ${myRecord.clockInTime}` : 'Not clocked in yet today'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DUTY SELECTOR (Custom, rule-compliant) */}
            <div className="relative min-w-[200px]">
              <button
                type="button"
                onClick={() => setIsDutyDropdownOpen(!isDutyDropdownOpen)}
                className="w-full h-10 px-3 bg-indigo-950/80 border border-indigo-700/80 rounded-xl text-left font-bold text-xs text-white flex items-center justify-between hover:bg-indigo-900 transition cursor-pointer"
              >
                <span className="truncate">{selectedDuty}</span>
                <ChevronDown className={`w-4 h-4 text-indigo-300 transition-transform ${isDutyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDutyDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsDutyDropdownOpen(false)} />
                  <div className="absolute left-0 bottom-full mb-1 w-full bg-slate-900 border border-indigo-700 rounded-xl shadow-2xl z-30 p-1 space-y-0.5">
                    {DUTY_ROLES.map(duty => (
                      <button
                        key={duty}
                        type="button"
                        onClick={() => {
                          setSelectedDuty(duty);
                          setIsDutyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          selectedDuty === duty
                            ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white'
                            : 'hover:bg-emerald-600 hover:text-white text-slate-200'
                        }`}
                      >
                        <span>{duty}</span>
                        {selectedDuty === duty && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CLOCK IN BUTTON */}
            {!isMyClockedIn ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTeacherClockIn}
                className="h-10 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In for Today</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-10 px-3 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-xl font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Clocked In ({myRecord?.clockInTime})</span>
                </span>

                {!isMyClockedOut ? (
                  <button
                    onClick={handleTeacherClockOut}
                    className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Clock Out</span>
                  </button>
                ) : (
                  <span className="h-10 px-3 bg-indigo-900/80 text-indigo-200 border border-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5">
                    <span>Clocked Out ({myRecord?.clockOutTime})</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Total Faculty</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Teaching staff roll</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-emerald-700">Present Today</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-800">{stats.present}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Clocked in / on duty</p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-indigo-700">On Time (≤ 8AM)</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-indigo-800">{stats.onTime}</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[10px] text-indigo-600 mt-1">Prompt arrival</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-700">Late Arrivals</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-800">{stats.late}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-600 mt-1">After 08:00 AM</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-500">Approved Leave</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-800">{stats.onLeave}</span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Medical / Official</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Punctuality Score</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.punctualityRate}%</span>
            <div className={`w-2.5 h-2.5 rounded-full ${stats.punctualityRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${stats.punctualityRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${stats.punctualityRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* FILTER & ROSTER TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
        
        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <PrintOnlySchoolHeader
            schoolName={schoolInfo?.name || "Corner Streams International Academy"}
            schoolLogoUrl={schoolInfo?.logo_url}
            title="STAFF & TEACHERS DAILY ATTENDANCE & PUNCTUALITY LEDGER"
            subtitle={`Date: ${selectedDate} | Total Staff: ${stats.total} | Present: ${stats.present} | Punctuality: ${stats.punctualityRate}%`}
          />
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase">Filter Status:</span>
            {(['ALL', 'ON_TIME', 'LATE', 'ON_LEAVE', 'ABSENT'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Staff' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 transition w-56"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="h-8 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setIsPrintMode(true);
                setTimeout(() => window.print(), 300);
              }}
              className="h-8 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500 font-mono">
              <tr>
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Staff / Teacher Name</th>
                <th className="py-3 px-4">Designation & Department</th>
                <th className="py-3 px-4 text-center">Clock In</th>
                <th className="py-3 px-4 text-center">Clock Out</th>
                <th className="py-3 px-4 text-center">Punctuality Status</th>
                <th className="py-3 px-4">Assigned Duty Role</th>
                <th className="py-3 px-4 text-center print:hidden">Admin Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStaff.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{st.staffId}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{st.teacherName}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{st.role}</p>
                    <p className="text-[10px] text-slate-400">{st.department}</p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    {st.clockInTime}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                    {st.clockOutTime || '-'}
                  </td>
                  
                  {/* STATUS BADGE */}
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase border ${
                      st.status === 'ON_TIME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : st.status === 'LATE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : st.status === 'ON_LEAVE'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {st.status === 'LATE' ? `Late (+${st.lateMinutes || 15}m)` : st.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* DUTY ROLE */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                      {st.dutyRole}
                    </span>
                    {st.note && <p className="text-[10px] text-slate-400 mt-0.5">{st.note}</p>}
                  </td>

                  {/* ADMIN ACTION TOGGLES */}
                  <td className="py-3 px-4 text-center print:hidden">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdminStatusChange(st.id, 'ON_TIME')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-[10px] font-bold transition cursor-pointer"
                        title="Mark On Time"
                      >
                        On-Time
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminStatusChange(st.id, 'LATE')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-[10px] font-bold transition cursor-pointer"
                        title="Mark Late"
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminStatusChange(st.id, 'ON_LEAVE')}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-[10px] font-bold transition cursor-pointer"
                        title="Mark On Leave"
                      >
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
