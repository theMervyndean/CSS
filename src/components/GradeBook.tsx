/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { GradeRecord, UserProfile, SchoolArmType, CaFrequencyType } from '../types';
import { defaultGradeRecords, mockUsers } from '../mockData';
import { Plus, Check, Trash2, ShieldAlert, Award, FileSpreadsheet, Image as ImageIcon, Camera, Upload, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface GradeBookProps {
  currentProfile: UserProfile;
  grades: GradeRecord[];
  onUpdateGrades: (updated: GradeRecord[]) => void;
  studentsProfileList: UserProfile[];
  onUpdateStudents: (updated: UserProfile[]) => void;
}

export default function GradeBook({
  currentProfile,
  grades,
  onUpdateGrades,
  studentsProfileList,
  onUpdateStudents,
}: GradeBookProps) {
  const [caConfiguration, setCaConfiguration] = useState<CaFrequencyType>('4_CA');
  const [activeStudentId, setActiveStudentId] = useState<string>('usr-stu-1');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollTable = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };

  const isClassTeacher = currentProfile.role === 'Class_Teacher';
  const isSuperAdmin = currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin';
  // Has write privileges
  const hasWriteAccess = isClassTeacher || isSuperAdmin;

  // Grade compilation calculation logic
  const calculateResult = (scores: { ca1: number; ca2: number; ca3?: number; ca4?: number; exam: number }, caType: CaFrequencyType) => {
    let total = 0;
    if (caType === '4_CA') {
      const ca1 = Math.min(10, Math.max(0, scores.ca1 || 0));
      const ca2 = Math.min(10, Math.max(0, scores.ca2 || 0));
      const ca3 = Math.min(10, Math.max(0, (scores.ca3 !== undefined ? scores.ca3 : 0)));
      const ca4 = Math.min(10, Math.max(0, (scores.ca4 !== undefined ? scores.ca4 : 0)));
      const exam = Math.min(60, Math.max(0, scores.exam || 0));
      total = ca1 + ca2 + ca3 + ca4 + exam;
    } else {
      // 2_CA mode (CAs are max 20 each)
      const ca1 = Math.min(20, Math.max(0, scores.ca1 || 0));
      const ca2 = Math.min(20, Math.max(0, scores.ca2 || 0));
      const exam = Math.min(60, Math.max(0, scores.exam || 0));
      total = ca1 + ca2 + exam;
    }

    let gradeLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
    let remark = '';

    if (total >= 80) {
      gradeLetter = 'A';
      remark = 'EXCELLENT OUTSTANDING ACHIEVEMENT';
    } else if (total >= 70) {
      gradeLetter = 'B';
      remark = 'VERY GOOD EFFORT. KEEP THE TEMPO UP';
    } else if (total >= 50) {
      gradeLetter = 'C';
      remark = 'GOOD CREDIT. DESERVES ENCOURAGEMENT';
    } else if (total >= 40) {
      gradeLetter = 'D';
      remark = 'PASSABLE WORK. CONCENTRATION NEEDED';
    } else if (total >= 30) {
      gradeLetter = 'E';
      remark = 'WEAK PERFORMANCE. RE-SITTING ADVISED';
    } else {
      gradeLetter = 'F';
      remark = 'FAIL. URGENT ACADEMIC INTERVENTION REQUIRED';
    }

    return { totalScore: total, gradeLetter, remark };
  };

  const handleScoreChange = (recordId: string, field: 'ca1' | 'ca2' | 'ca3' | 'ca4' | 'exam', valStr: string) => {
    if (!hasWriteAccess) return;

    const val = parseInt(valStr) || 0;
    const updated = grades.map((g) => {
      if (g.id === recordId) {
        const scores = { ...g.scores };
        scores[field] = val;
        
        const { totalScore, gradeLetter, remark } = calculateResult(scores, caConfiguration);
        return {
          ...g,
          scores,
          totalScore,
          gradeLetter,
          remark,
          caType: caConfiguration
        };
      }
      return g;
    });

    onUpdateGrades(updated);
  };

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'B':
        return 'bg-teal-500 text-white border-teal-600';
      case 'C':
        return 'bg-amber-500 text-white border-amber-600';
      case 'D':
        return 'bg-orange-500 text-white border-orange-600';
      case 'E':
        return 'bg-rose-500 text-white border-rose-600';
      case 'F':
        return 'bg-red-600 text-white border-red-700';
      default:
        return 'bg-slate-400 text-white border-slate-500';
    }
  };

  const selectedStudent = studentsProfileList.find(s => s.id === activeStudentId) || studentsProfileList[0];
  const studentGradeRecord = grades.find(g => g.studentId === activeStudentId);

  // File drag & drop / manual select passport management
  const handlePassportFile = (file: File) => {
    if (!hasWriteAccess) return;
    
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Please upload an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        // Update both user listing and active selection
        const updatedUsers = studentsProfileList.map(usr => {
          if (usr.id === activeStudentId) {
            return { ...usr, photoUrl: base64Url };
          }
          return usr;
        });
        onUpdateStudents(updatedUsers);
        setSuccessMsg(`Successfully uploaded new physical passport for ${selectedStudent.fullName}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePassportFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePassportFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT COMPILER PANEL: EXCEL-STYLE GRID */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* Header toolbar */}
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Secondary Grade Registry Core ({currentProfile.classCohort || 'SS 2A'})
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Input Term marks. Auto-calculated with alphabetic scale and remarks mapping.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* Toggle CA configuration */}
            <div className="bg-slate-100 p-0.5 rounded flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setCaConfiguration('2_CA')}
                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition ${
                  caConfiguration === '2_CA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                2 CAs (Max 20/20)
              </button>
              <button
                type="button"
                onClick={() => setCaConfiguration('4_CA')}
                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition ${
                  caConfiguration === '4_CA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                4 CAs (Max 10x4)
              </button>
            </div>

            {/* Smooth Table Horizontal Scroller */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => handleScrollTable('left')}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition cursor-pointer"
                title="Scroll left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[8px] font-black tracking-widest text-slate-400 px-1 uppercase">SLIDE</span>
              <button
                type="button"
                onClick={() => handleScrollTable('right')}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition cursor-pointer"
                title="Scroll right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              AUTO-SAVE
            </div>
          </div>
        </div>

        {/* Security blockade warning */}
        {!hasWriteAccess && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">
              <strong>🔒 ROBUST SECURITY BARRIER ENGAGED:</strong> As a {currentProfile.role.replace(/_/g, ' ')}, you are in read-only mode and do not hold grading scope authorizations for this classroom cohort.
            </span>
          </div>
        )}

        {/* Grid and grades table */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto scroll-smooth">
          <table className="w-full border-collapse min-w-[750px]">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider"></th>
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">Student ID</th>
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Name</th>
                
                {caConfiguration === '4_CA' ? (
                  <>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 1 (10)</th>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 2 (10)</th>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 3 (10)</th>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 4 (10)</th>
                  </>
                ) : (
                  <>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 1 (20)</th>
                    <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase bg-blue-50/50">CA 2 (20)</th>
                  </>
                )}
                
                <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase">Exam (60)</th>
                <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase font-mono">Total (100)</th>
                <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase">Grd</th>
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase hidden lg:table-cell">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {grades.map((g) => {
                const sProfile = studentsProfileList.find(s => s.id === g.studentId) || { photoUrl: '' };
                const isActive = activeStudentId === g.studentId;
                const scores = g.scores;

                return (
                  <tr
                    key={g.id}
                    onClick={() => setActiveStudentId(g.studentId)}
                    className={`hover:bg-slate-50 cursor-pointer transition ${
                      isActive ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                        {sProfile.photoUrl ? (
                          <img src={sProfile.photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 font-bold text-indigo-600">{g.studentId === 'usr-stu-1' ? 'CS-SEC-0042' : g.studentId === 'usr-stu-2' ? 'CS-SEC-0043' : g.studentId === 'usr-stu-3' ? 'CS-SEC-0044' : 'CS-SEC-0045'}</td>
                    <td className="p-2.5 font-sans font-bold text-slate-700 uppercase">{g.studentName}</td>
                    
                    {/* Inputs based on config */}
                    {caConfiguration === '4_CA' ? (
                      <>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca1}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={10}
                            onChange={(e) => handleScoreChange(g.id, 'ca1', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca2}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={10}
                            onChange={(e) => handleScoreChange(g.id, 'ca2', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca3 !== undefined ? scores.ca3 : 0}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={10}
                            onChange={(e) => handleScoreChange(g.id, 'ca3', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca4 !== undefined ? scores.ca4 : 0}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={10}
                            onChange={(e) => handleScoreChange(g.id, 'ca4', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca1}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={20}
                            onChange={(e) => handleScoreChange(g.id, 'ca1', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                        <td className="p-1 bg-blue-50/10 text-center">
                          <input
                            type="number"
                            value={scores.ca2}
                            disabled={!hasWriteAccess}
                            min={0}
                            max={20}
                            onChange={(e) => handleScoreChange(g.id, 'ca2', e.target.value)}
                            className="w-11 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                          />
                        </td>
                      </>
                    )}

                    <td className="p-1 text-center">
                      <input
                        type="number"
                        value={scores.exam}
                        disabled={!hasWriteAccess}
                        min={0}
                        max={60}
                        onChange={(e) => handleScoreChange(g.id, 'exam', e.target.value)}
                        className="w-13 text-center bg-white border border-slate-200 rounded py-0.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:border-transparent font-bold"
                      />
                    </td>

                    <td className="p-2.5 text-center font-black text-slate-900 text-sm">
                      {g.totalScore}
                    </td>

                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getGradeBadgeStyle(g.gradeLetter)}`}>
                        {g.gradeLetter}
                      </span>
                    </td>

                    <td className="p-2.5 font-sans font-bold text-[9px] text-slate-400 hidden lg:table-cell max-w-[200px] truncate uppercase">
                      {g.remark}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT WORKSPACE: REGULATION DIGITAL PASSPORT MANAGEMENT */}
      <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col shrink-0 overflow-y-auto">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Passport Management
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Zero-Paper regulatory requirement: manage official identity passport images.
          </p>
        </div>

        {/* Selected student status */}
        <div className="flex flex-col items-center text-center space-y-3">
          
          <div className="relative group">
            <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-indigo-600 shadow-md bg-slate-100 flex items-center justify-center">
              {selectedStudent.photoUrl ? (
                <img src={selectedStudent.photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-300" />
              )}
            </div>

            {hasWriteAccess && (
              <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white cursor-pointer shadow hover:bg-indigo-700 transition">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase">
              {selectedStudent.username === 'usr-stu-1' ? 'CS-SEC-0042' : selectedStudent.username === 'usr-stu-2' ? 'CS-SEC-0043' : selectedStudent.username === 'usr-stu-3' ? 'CS-SEC-0044' : 'CS-SEC-0045'}
            </span>
            <h4 className="text-sm font-bold text-slate-800 uppercase mt-1 leading-none">{selectedStudent.fullName}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{selectedStudent.gradeLevel} • {selectedStudent.classCohort}</p>
          </div>

          <div className="w-full border-t border-slate-100 pt-3 flex flex-col items-start text-left space-y-1.5 font-mono text-[10px]">
            <div className="flex justify-between w-full">
              <span className="text-slate-400">TERM WORK</span>
              <span className="font-bold text-slate-700">{studentGradeRecord ? studentGradeRecord.totalScore : 0} / 100</span>
            </div>
            <div className="flex justify-between w-full">
              <span className="text-slate-400">LETTER GRADE</span>
              <span className="font-black text-indigo-600">{studentGradeRecord ? studentGradeRecord.gradeLetter : '--'}</span>
            </div>
          </div>
        </div>

        {/* Drag and Drop Box - active only for class teacher/admins */}
        {hasWriteAccess ? (
          <div className="mt-5 space-y-3">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40'
              }`}
            >
              <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-indigo-600 uppercase">
                Drag passport image
              </p>
              <p className="text-[9px] text-slate-400 mt-1">
                or click camera icon above to locate JPG/PNG
              </p>
            </div>

            {successMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-mono flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 bg-slate-50 border border-slate-100 rounded p-3 text-[10px] text-slate-500 font-mono leading-relaxed">
            <span className="font-bold">PASSPORT RESTRICTION:</span>
            <p className="mt-0.5">
              Only authorized Class Teachers and System Admins may perform biometric passport overrides. Physical registers are retired.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
