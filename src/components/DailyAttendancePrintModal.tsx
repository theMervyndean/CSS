import React, { useState } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, XCircle, Clock, 
  UserMinus, ShieldCheck, Download, Calendar, Users, 
  Sliders, Check, Sparkles, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader, SchoolInfoData } from './PrintOnlySchoolHeader';
import { StudentAttendanceRecord, AttendanceStatus } from '../types';
import { formatDateDisplay, getRelativeDateLabel } from './DailyAttendance';

export interface DailyAttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StudentAttendanceRecord[];
  selectedClass: string;
  selectedDate: string;
  sessionType: 'morning' | 'afternoon';
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: SchoolInfoData;
  currentProfile?: any;
}

export function DailyAttendancePrintModal({
  isOpen,
  onClose,
  records,
  selectedClass,
  selectedDate,
  sessionType,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo = {
    name: 'Corner Streams International Academy',
    motto: 'Excellence & Honor in Character and Service',
    logo_url: '',
    address: '12 Corner Streams Boulevard, Victoria Island, Lagos',
    phone: '+234 (0) 803 123 4567',
    email: 'info@cornerstreams.edu.ng',
    website: 'www.cornerstreams.edu.ng',
    principalName: 'Dr. Mrs. Folasade Adebayo'
  },
  currentProfile
}: DailyAttendancePrintModalProps) {
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [includeTimestamp, setIncludeTimestamp] = useState<boolean>(true);

  if (!isOpen) return null;

  // Compute roll-call statistics
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const effectivePresent = present + late;
  const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

  const registryCode = `REG-ATT-${selectedClass.replace(/\s+/g, '_')}-${selectedDate}-${sessionType.toUpperCase()}`;
  const formattedDate = formatDateDisplay(selectedDate);
  const relLabel = getRelativeDateLabel(selectedDate);
  const teacherName = currentProfile?.fullName || currentProfile?.name || 'Class Teacher of Record';
  const principalName = schoolInfo?.principalName || 'Dr. Mrs. Folasade Adebayo';

  const handlePrint = () => {
    toast.info('Preparing official PDF printable document...');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div 
      id="daily-attendance-print-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 print:p-0 print:static print:bg-white print:overflow-visible"
    >
      {/* TOP ACTION TOOLBAR (Hidden in Print) */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-2 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Official Daily Attendance Registry Report
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                A4 PDF Ready
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {selectedClass} • {formattedDate} ({sessionType.toUpperCase()} ROLL CALL)
            </p>
          </div>
        </div>

        {/* PRINT OPTIONS & TRIGGER BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* OPTIONS DROPDOWN / TOGGLES */}
          <div className="hidden md:flex items-center gap-3 text-xs border-r border-slate-200 pr-3 mr-1 text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={includeNotes} 
                onChange={(e) => setIncludeNotes(e.target.checked)} 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Remarks</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={includeSignatures} 
                onChange={(e) => setIncludeSignatures(e.target.checked)} 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Sign-off Boxes</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            title="Trigger browser print or Save to PDF dialog"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>Print / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Styled for high-fidelity A4 page rendering) */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-10 text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none">
        
        {/* 1. OFFICIAL SCHOOL BRANDING HEADER */}
        <PrintOnlySchoolHeader
          schoolInfo={schoolInfo}
          session={activeSession}
          term={activeTerm}
          documentTitle="OFFICIAL DAILY ATTENDANCE REGISTER"
          className="!flex"
        />

        {/* 2. REGISTRY METADATA BAR */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 my-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Class Cohort</span>
            <strong className="text-slate-900 font-bold text-sm">{selectedClass}</strong>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Date of Record</span>
            <strong className="text-slate-900 font-bold">{formattedDate}</strong>
            <span className="text-[10px] text-slate-500 font-mono block">({selectedDate} • {relLabel})</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Roll Call Session</span>
            <span className="inline-block px-2 py-0.5 bg-indigo-950 text-white rounded font-mono font-bold text-[10px] uppercase mt-0.5">
              {sessionType === 'morning' ? '🌅 Morning Roll Call' : '☀️ Afternoon Roll Call'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Registry Reference Code</span>
            <span className="font-mono text-[10px] text-indigo-900 font-bold block truncate" title={registryCode}>
              {registryCode}
            </span>
          </div>
        </div>

        {/* 3. EXECUTIVE ATTENDANCE METRICS MATRIX */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-4">
          <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-white shadow-xs">
            <span className="text-[9px] font-black uppercase text-slate-400 block">Total Enrolled</span>
            <strong className="text-lg font-black text-slate-900 font-mono">{total}</strong>
            <span className="text-[9px] text-slate-400 block">Students</span>
          </div>

          <div className="border border-emerald-200 rounded-xl p-2.5 text-center bg-emerald-50/50 shadow-xs">
            <span className="text-[9px] font-black uppercase text-emerald-700 block">Present</span>
            <strong className="text-lg font-black text-emerald-800 font-mono">{present}</strong>
            <span className="text-[9px] text-emerald-600 block">
              {total > 0 ? Math.round((present / total) * 100) : 0}%
            </span>
          </div>

          <div className="border border-amber-200 rounded-xl p-2.5 text-center bg-amber-50/50 shadow-xs">
            <span className="text-[9px] font-black uppercase text-amber-700 block">Late</span>
            <strong className="text-lg font-black text-amber-800 font-mono">{late}</strong>
            <span className="text-[9px] text-amber-600 block">
              {total > 0 ? Math.round((late / total) * 100) : 0}%
            </span>
          </div>

          <div className="border border-rose-200 rounded-xl p-2.5 text-center bg-rose-50/50 shadow-xs">
            <span className="text-[9px] font-black uppercase text-rose-700 block">Absent</span>
            <strong className="text-lg font-black text-rose-800 font-mono">{absent}</strong>
            <span className="text-[9px] text-rose-600 block">
              {total > 0 ? Math.round((absent / total) * 100) : 0}%
            </span>
          </div>

          <div className="border border-indigo-200 rounded-xl p-2.5 text-center bg-indigo-50/50 shadow-xs">
            <span className="text-[9px] font-black uppercase text-indigo-700 block">Excused</span>
            <strong className="text-lg font-black text-indigo-800 font-mono">{excused}</strong>
            <span className="text-[9px] text-indigo-600 block">Official</span>
          </div>

          <div className="border border-slate-300 rounded-xl p-2.5 text-center bg-slate-900 text-white shadow-xs">
            <span className="text-[9px] font-black uppercase text-slate-300 block">Attendance Rate</span>
            <strong className="text-lg font-black text-emerald-400 font-mono">{rate}%</strong>
            <span className="text-[9px] text-slate-300 block font-mono">
              {rate >= 90 ? '✓ Target Met' : '⚠ Below 90%'}
            </span>
          </div>
        </div>

        {/* 4. STUDENT ROLL CALL LEDGER TABLE */}
        <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-28">Admission No</th>
                <th className="py-2.5 px-3">Student Full Name</th>
                <th className="py-2.5 px-3 w-16 text-center">Gender</th>
                <th className="py-2.5 px-3 w-28 text-center">Roll Call Status</th>
                <th className="py-2.5 px-3 w-24 text-center">Time In</th>
                {includeNotes && <th className="py-2.5 px-3">Official Remarks / Absence Excuse</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={includeNotes ? 7 : 6} className="py-8 text-center text-slate-400 italic">
                    No student records registered for this session.
                  </td>
                </tr>
              ) : (
                records.map((st, idx) => {
                  let statusBadge = null;
                  if (st.status === 'present') {
                    statusBadge = (
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                        PRESENT [P]
                      </span>
                    );
                  } else if (st.status === 'late') {
                    statusBadge = (
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                        LATE [L]
                      </span>
                    );
                  } else if (st.status === 'absent') {
                    statusBadge = (
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300 uppercase">
                        ABSENT [A]
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase">
                        EXCUSED [E]
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={st.id} 
                      className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                    >
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-700">{st.admissionNo}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{st.fullName}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{st.gender}</td>
                      <td className="py-2 px-3 text-center">{statusBadge}</td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                        {st.timeIn || '—'}
                      </td>
                      {includeNotes && (
                        <td className="py-2 px-3 text-slate-600 text-[11px] italic">
                          {st.note || (st.status === 'absent' ? 'Unexcused absence' : '—')}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. INSTITUTIONAL CERTIFICATION & ENDORSEMENT SIGN-OFF */}
        {includeSignatures && (
          <div className="border-t-2 border-slate-200 pt-4 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            {/* CLASS TEACHER CERTIFICATION */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Class Teacher Certification
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                I hereby certify that this attendance roll call accurately reflects the attendance, punctuality, and absence excuses of students enrolled in <strong>{selectedClass}</strong> for the stated date.
              </p>
              <div className="pt-6 border-b border-dashed border-slate-400 flex justify-between items-end pb-1 font-mono text-[11px]">
                <span className="text-slate-500">Teacher Signature: __________________</span>
                <span className="font-bold text-slate-900">{teacherName}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Date Certified: {new Date().toISOString().split('T')[0]}</span>
                <span>ID: {currentProfile?.id || 'TCH-001'}</span>
              </div>
            </div>

            {/* PRINCIPAL / ADMINISTRATIVE ENDORSEMENT & OFFICIAL STAMP */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Principal Endorsement & School Seal
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Verified and logged into the Central School Archives in accordance with institutional attendance and statutory regulatory standards.
              </p>
              <div className="pt-6 border-b border-dashed border-slate-400 flex justify-between items-end pb-1 font-mono text-[11px]">
                <span className="text-slate-500">Principal Signature: __________________</span>
                <span className="font-bold text-slate-900">{principalName}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Official School Seal / Stamp Area</span>
                <span>Status: VERIFIED</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. COMPLIANCE & SYSTEM AUDIT FOOTNOTE */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Corner Streams Educational Network • Certified Electronic Record System</span>
          <span>Printed / Generated: {new Date().toLocaleString()}</span>
          <span>© 2026 Corner Streams. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

export default DailyAttendancePrintModal;
