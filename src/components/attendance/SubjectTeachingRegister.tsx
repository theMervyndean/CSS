import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, 
  Search, Save, RefreshCw, Printer, Download, Plus, Filter, 
  Check, ChevronDown, UserCheck, Sparkles, FileSpreadsheet,
  Layers, Award, AlertCircle, History, FileText, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader } from '../PrintOnlySchoolHeader';
import { 
  SubjectLessonTeachingLog, 
  SubjectStudentAttendance, 
  StudentAttendanceRecord 
} from '../../types';
import { DEFAULT_CLASSES, INITIAL_STUDENTS_MOCK } from './HomeroomClassRegister';

const SUBJECTS_LIST = [
  'Mathematics',
  'English Language',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Civic Education',
  'Computer Studies / ICT',
  'Further Mathematics',
  'Agricultural Science',
  'Government',
  'Literature in English'
];

const PERIOD_SLOTS = [
  { period: 1, time: '08:00 AM - 08:45 AM', label: 'Period 1 (08:00 - 08:45)' },
  { period: 2, time: '08:45 AM - 09:30 AM', label: 'Period 2 (08:45 - 09:30)' },
  { period: 3, time: '09:45 AM - 10:30 AM', label: 'Period 3 (09:45 - 10:30)' },
  { period: 4, time: '10:30 AM - 11:15 AM', label: 'Period 4 (10:30 - 11:15)' },
  { period: 5, time: '11:30 AM - 12:15 PM', label: 'Period 5 (11:30 - 12:15)' },
  { period: 6, time: '12:15 PM - 01:00 PM', label: 'Period 6 (12:15 - 01:00)' },
  { period: 7, time: '01:30 PM - 02:15 PM', label: 'Period 7 (01:30 - 02:15)' },
  { period: 8, time: '02:15 PM - 03:00 PM', label: 'Period 8 (02:15 - 03:00)' }
];

export interface SubjectTeachingRegisterProps {
  currentProfile?: any;
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: {
    name?: string;
    logo_url?: string;
  };
}

export default function SubjectTeachingRegister({
  currentProfile,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo
}: SubjectTeachingRegisterProps) {
  const [selectedClass, setSelectedClass] = useState<string>('SS 2 Science A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(2);
  
  // Lesson Diary details
  const [topicTaught, setTopicTaught] = useState<string>('Quadratic Equations: Factorisation & Completing Square');
  const [subTopic, setSubTopic] = useState<string>('Deriving roots of ax² + bx + c = 0');
  const [classDiarySummary, setClassDiarySummary] = useState<string>(
    'Introduced standard quadratic forms. Solved 4 worked examples on factor method. Engaged students with interactive whiteboard exercises.'
  );
  const [homeworkAssigned, setHomeworkAssigned] = useState<string>('New General Mathematics SS2, Page 112, Ex 6B Q1 - Q12');
  const [lessonStatus, setLessonStatus] = useState<'COMPLETED' | 'SUBSTITUTE_TAUGHT' | 'POSTPONED' | 'PRACTICAL_SESSION'>('COMPLETED');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [viewPastLogs, setViewPastLogs] = useState(false);

  // Dropdown states for custom UI controls (Rule: No native selects)
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // Storage key for current period teaching log
  const currentPeriodTime = PERIOD_SLOTS.find(p => p.period === selectedPeriod)?.time || '08:45 AM - 09:30 AM';
  const logKey = `cs_subject_log_${selectedClass.replace(/\s+/g, '_')}_${selectedSubject.replace(/\s+/g, '_')}_${selectedDate}_p${selectedPeriod}`;

  // Get morning homeroom attendance to detect school truancy / period bunking!
  const homeroomStorageKey = `cs_attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_morning`;
  const homeroomRecords: StudentAttendanceRecord[] = useMemo(() => {
    try {
      const saved = localStorage.getItem(homeroomStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STUDENTS_MOCK[selectedClass] || [];
  }, [homeroomStorageKey, selectedClass]);

  // Students attendance list for this subject period
  const [studentsAttendance, setStudentsAttendance] = useState<SubjectStudentAttendance[]>([]);

  // Initialize or load students for this subject session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(logKey);
      if (saved) {
        const parsed: SubjectLessonTeachingLog = JSON.parse(saved);
        setTopicTaught(parsed.topicTaught || '');
        setSubTopic(parsed.subTopic || '');
        setClassDiarySummary(parsed.classDiarySummary || '');
        setHomeworkAssigned(parsed.homeworkAssigned || '');
        setLessonStatus(parsed.lessonStatus || 'COMPLETED');
        if (parsed.attendance && parsed.attendance.length > 0) {
          setStudentsAttendance(parsed.attendance);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading subject log:', e);
    }

    // Generate fresh from homeroom roster
    const baseRoster = homeroomRecords.length > 0 
      ? homeroomRecords 
      : (INITIAL_STUDENTS_MOCK[selectedClass] || []);

    const initialRoster: SubjectStudentAttendance[] = baseRoster.map(s => {
      // If student was marked absent from homeroom morning roll, default to absent
      const isHomeroomAbsent = s.status === 'absent';
      return {
        studentId: s.id,
        admissionNo: s.admissionNo,
        studentName: s.fullName,
        gender: s.gender,
        status: isHomeroomAbsent ? 'absent' : 'present',
        participationGrade: 'A',
        note: isHomeroomAbsent ? 'Absent from morning roll call' : ''
      };
    });

    setStudentsAttendance(initialRoster);
  }, [logKey, selectedClass, selectedSubject, selectedDate, selectedPeriod, homeroomRecords]);

  // Set individual student subject status
  const handleSetStudentStatus = (studentId: string, status: 'present' | 'absent' | 'truant_bunked' | 'late' | 'excused') => {
    setStudentsAttendance(prev => prev.map(s => {
      if (s.studentId === studentId) {
        // Check if student was present in morning roll call but now marked absent
        const morningRecord = homeroomRecords.find(h => h.id === studentId);
        const wasMorningPresent = morningRecord && morningRecord.status === 'present';
        
        let newStatus = status;
        let note = s.note;
        if (status === 'absent' && wasMorningPresent) {
          newStatus = 'truant_bunked';
          note = '⚠️ Flagged: In school this morning but absent during subject period!';
          toast.error(`${s.studentName} flagged as TRUANT / BUNKING period!`, {
            description: 'Present in morning homeroom roll call, but missing from subject class.'
          });
        }
        return { ...s, status: newStatus, note };
      }
      return s;
    }));
  };

  // Set student participation grade
  const handleSetParticipation = (studentId: string, grade: 'A' | 'B' | 'C' | 'D') => {
    setStudentsAttendance(prev => prev.map(s => s.studentId === studentId ? { ...s, participationGrade: grade } : s));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setStudentsAttendance(prev => prev.map(s => ({ ...s, status: 'present' })));
    toast.info('Marked all students present for this subject lesson.');
  };

  // Save Subject Teaching Log & Register
  const handleSaveTeachingLog = () => {
    if (!topicTaught.trim()) {
      toast.error('Please enter the Lesson Topic taught before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const logRecord: SubjectLessonTeachingLog = {
        id: `subj_log_${selectedClass.replace(/\s+/g, '_')}_${selectedSubject.replace(/\s+/g, '_')}_${selectedDate}_p${selectedPeriod}`,
        schoolId: 'CS-SCHOOL-01',
        classArm: selectedClass,
        subjectName: selectedSubject,
        teacherId: currentProfile?.id || 'TCH-002',
        teacherName: currentProfile?.fullName || 'Subject Instructor',
        periodNumber: selectedPeriod,
        periodTime: currentPeriodTime,
        date: selectedDate,
        topicTaught,
        subTopic,
        classDiarySummary,
        homeworkAssigned,
        attendance: studentsAttendance,
        lessonStatus,
        recordedAt: new Date().toISOString()
      };

      // Save to active period key
      localStorage.setItem(logKey, JSON.stringify(logRecord));

      // Append to master subject teaching archive
      const masterLogs: Record<string, SubjectLessonTeachingLog> = JSON.parse(localStorage.getItem('CS_MASTER_SUBJECT_TEACHING_LOGS') || '{}');
      masterLogs[logRecord.id] = logRecord;
      localStorage.setItem('CS_MASTER_SUBJECT_TEACHING_LOGS', JSON.stringify(masterLogs));

      setTimeout(() => {
        setIsSaving(false);
        toast.success(`Subject Teaching Register & Lesson Diary saved for ${selectedSubject} (Period ${selectedPeriod})!`);
      }, 450);
    } catch (err) {
      setIsSaving(false);
      toast.error('Failed to save subject teaching register.');
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    const total = studentsAttendance.length;
    const present = studentsAttendance.filter(s => s.status === 'present').length;
    const late = studentsAttendance.filter(s => s.status === 'late').length;
    const absent = studentsAttendance.filter(s => s.status === 'absent').length;
    const truant = studentsAttendance.filter(s => s.status === 'truant_bunked').length;
    const excused = studentsAttendance.filter(s => s.status === 'excused').length;
    const effectivePresent = present + late;
    const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

    return { total, present, late, absent, truant, excused, rate };
  }, [studentsAttendance]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsAttendance.filter(s => 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentsAttendance, searchTerm]);

  // Load past logs from local storage
  const pastTeachingLogs: SubjectLessonTeachingLog[] = useMemo(() => {
    try {
      const logsMap: Record<string, SubjectLessonTeachingLog> = JSON.parse(localStorage.getItem('CS_MASTER_SUBJECT_TEACHING_LOGS') || '{}');
      return Object.values(logsMap).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    } catch (e) {
      return [];
    }
  }, [isSaving]);

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Subject Teaching Register & Lesson Diary
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Subject Teacher Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Record subject lesson period delivery, syllabus topics covered, classroom diary, and live period attendance with automated truancy detection.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewPastLogs(!viewPastLogs)}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                viewPastLogs
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{viewPastLogs ? 'Hide History' : `Teaching Logs (${pastTeachingLogs.length})`}</span>
            </button>

            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={() => {
                setIsPrintMode(true);
                setTimeout(() => window.print(), 300);
              }}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleSaveTeachingLog}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:opacity-95 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Recording...' : 'Commit Teaching Log'}</span>
            </button>
          </div>
        </div>

        {/* SELECTORS ROW: SUBJECT, CLASS, PERIOD, DATE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* SUBJECT SELECTOR */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Select Subject
            </label>
            <button
              type="button"
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer"
            >
              <span className="truncate">{selectedSubject}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSubjectDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsSubjectDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 max-h-60 overflow-y-auto">
                  {SUBJECTS_LIST.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub);
                        setIsSubjectDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        selectedSubject === sub
                          ? 'bg-gradient-to-r from-emerald-600 to-indigo-700 text-white'
                          : 'hover:bg-emerald-600 hover:text-white text-slate-700'
                      }`}
                    >
                      <span>{sub}</span>
                      {selectedSubject === sub && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* CLASS ARM SELECTOR */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Target Class Arm
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
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5">
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
                          ? 'bg-gradient-to-r from-emerald-600 to-indigo-700 text-white'
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

          {/* PERIOD SLOT SELECTOR */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Teaching Period Slot
            </label>
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100/80 transition cursor-pointer"
            >
              <span className="truncate">Period {selectedPeriod} ({currentPeriodTime})</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPeriodDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPeriodDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-0.5 max-h-60 overflow-y-auto">
                  {PERIOD_SLOTS.map(ps => (
                    <button
                      key={ps.period}
                      type="button"
                      onClick={() => {
                        setSelectedPeriod(ps.period);
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        selectedPeriod === ps.period
                          ? 'bg-gradient-to-r from-emerald-600 to-indigo-700 text-white'
                          : 'hover:bg-emerald-600 hover:text-white text-slate-700'
                      }`}
                    >
                      <span>{ps.label}</span>
                      {selectedPeriod === ps.period && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DATE SELECTOR */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Lesson Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* PAST TEACHING LOGS MODAL / EXPANDED SECTION */}
      {viewPastLogs && (
        <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 print:hidden">
          <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-sm tracking-tight text-white">
                Archived Subject Teaching Delivery Logs
              </h3>
            </div>
            <span className="text-xs text-indigo-300 font-mono">
              Total Recorded: {pastTeachingLogs.length}
            </span>
          </div>

          {pastTeachingLogs.length === 0 ? (
            <p className="text-xs text-indigo-300 py-4 text-center">
              No historical teaching logs recorded yet. Save your first lesson delivery above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {pastTeachingLogs.map((log) => (
                <div key={log.id} className="bg-indigo-900/60 border border-indigo-700/60 rounded-xl p-3 space-y-2 hover:bg-indigo-900 transition">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-400">{log.subjectName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-800 text-[10px] font-mono text-indigo-200">
                      P{log.periodNumber} • {log.date}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">{log.topicTaught}</p>
                  {log.subTopic && <p className="text-[11px] text-indigo-300 line-clamp-1">{log.subTopic}</p>}
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-800/80 text-[10.5px] text-indigo-300">
                    <span>{log.classArm}</span>
                    <span className="text-emerald-300 font-bold">{log.attendance?.filter(a => a.status === 'present').length || 0} Present</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LESSON DIARY & CURRICULUM SYLLABUS FORM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-black text-sm text-slate-900">
              Classroom Teaching Diary & Syllabus Delivery
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase">Lesson Status:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['COMPLETED', 'PRACTICAL_SESSION', 'SUBSTITUTE_TAUGHT', 'POSTPONED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLessonStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                    lessonStatus === st 
                      ? 'bg-white text-emerald-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'COMPLETED' ? '✅ Completed' : st === 'PRACTICAL_SESSION' ? '🔬 Lab/Practical' : st === 'SUBSTITUTE_TAUGHT' ? '🔄 Substitute' : '⏳ Postponed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10.5px] font-black uppercase text-slate-500 mb-1">
              Lesson Topic Taught <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topicTaught}
              onChange={(e) => setTopicTaught(e.target.value)}
              placeholder="e.g. Newton's Laws of Motion..."
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-black uppercase text-slate-500 mb-1">
              Sub-Topic / Specific Objective
            </label>
            <input
              type="text"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              placeholder="e.g. Calculation of friction force & momentum..."
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-black uppercase text-slate-500 mb-1">
              Class Diary Summary / Delivery Remarks
            </label>
            <textarea
              rows={2}
              value={classDiarySummary}
              onChange={(e) => setClassDiarySummary(e.target.value)}
              placeholder="Summary of classroom engagement, teaching methodology, or concept mastery..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-black uppercase text-slate-500 mb-1">
              Homework / Assignment Given
            </label>
            <textarea
              rows={2}
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              placeholder="e.g. Textbook Page 54, Exercise 3B Questions 1 - 8..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* STATS & TRUANCY SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Class Roll</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-mono font-bold text-slate-500">P{selectedPeriod}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Expected in period</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-emerald-700">Present In Class</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-800">{stats.present}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Attended lesson</p>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-rose-700">Truant / Bunked</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-800">{stats.truant}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <p className="text-[10px] text-rose-600 mt-1">In school but skipped!</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-500">General Absent</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-800">{stats.absent}</span>
            <XCircle className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Absent from school</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-700">Late to Class</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-800">{stats.late}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Late entry to period</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400">Lesson Rate</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900">{stats.rate}%</span>
            <div className={`w-2.5 h-2.5 rounded-full ${stats.rate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${stats.rate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${stats.rate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* STUDENT SUBJECT ATTENDANCE ROSTER TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <PrintOnlySchoolHeader
            schoolName={schoolInfo?.name || "Corner Streams International Academy"}
            schoolLogoUrl={schoolInfo?.logo_url}
            title={`SUBJECT TEACHING REGISTER: ${selectedSubject.toUpperCase()}`}
            subtitle={`Class: ${selectedClass} | Period: ${selectedPeriod} (${currentPeriodTime}) | Topic: ${topicTaught} | Date: ${selectedDate}`}
          />
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xs text-slate-900">Student Attendance for Period {selectedPeriod}</h4>
            {stats.truant > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {stats.truant} TRUANT / BUNKING DETECTED
              </span>
            )}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500 font-mono">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Homeroom Status</th>
                <th className="py-3 px-4 text-center">Subject Attendance</th>
                <th className="py-3 px-4 text-center">Engagement Grade</th>
                <th className="py-3 px-4">Teacher Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.map((st, idx) => {
                const morningStatus = homeroomRecords.find(h => h.id === st.studentId)?.status || 'present';
                const isTruant = st.status === 'truant_bunked';

                return (
                  <tr 
                    key={st.studentId} 
                    className={`transition ${isTruant ? 'bg-rose-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{st.admissionNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span>{st.studentName}</span>
                      {isTruant && (
                        <span className="block text-[10px] text-rose-600 font-extrabold uppercase mt-0.5">
                          ⚠️ Bunking period (Was in morning roll call)
                        </span>
                      )}
                    </td>

                    {/* HOMEROOM CONTEXT BADGE */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        morningStatus === 'present' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : morningStatus === 'late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {morningStatus}
                      </span>
                    </td>

                    {/* SUBJECT ATTENDANCE BUTTONS */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(st.studentId, 'present')}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                            st.status === 'present' 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(st.studentId, 'late')}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                            st.status === 'late' 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(st.studentId, 'absent')}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                            st.status === 'absent' || isTruant
                              ? 'bg-rose-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          {isTruant ? 'Truant' : 'Absent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(st.studentId, 'excused')}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                            st.status === 'excused' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-indigo-700'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>

                    {/* ENGAGEMENT / PARTICIPATION GRADE */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        {(['A', 'B', 'C', 'D'] as const).map(grade => (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => handleSetParticipation(st.studentId, grade)}
                            className={`w-6 h-6 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                              st.participationGrade === grade
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={`Participation Grade ${grade}`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* NOTE */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={st.note || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentsAttendance(prev => prev.map(item => item.studentId === st.studentId ? { ...item, note: val } : item));
                        }}
                        placeholder="Observation / practical note..."
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg text-xs text-slate-700 outline-none transition"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
