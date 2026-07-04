/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeRecord, UserProfile } from '../types';
import { ShieldAlert, BookOpen, ToggleLeft, ToggleRight, Printer, AlertCircle, CheckSquare, Sparkles } from 'lucide-react';

interface ResultCheckerProps {
  currentProfile: UserProfile;
  grades: GradeRecord[];
  isPublished: boolean;
  studentsProfileList: UserProfile[];
}

export default function ResultChecker({
  currentProfile,
  grades,
  isPublished,
  studentsProfileList,
}: ResultCheckerProps) {
  const [activeChildId, setActiveChildId] = useState<string>('');
  const [reportMode, setReportMode] = useState<'half_term' | 'full_term'>('full_term');
  const [backendReport, setBackendReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isParent = currentProfile.role === 'Parent';
  const isStudent = currentProfile.role === 'Student';
  const isAdmin = currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin';

  // Set default child if parent
  React.useEffect(() => {
    if (isParent && currentProfile.studentIds && currentProfile.studentIds.length > 0) {
      setActiveChildId(currentProfile.studentIds[0]);
    } else if (isStudent) {
      setActiveChildId(currentProfile.id);
    } else {
      // Admins can search or view anyone, set default to student 1
      setActiveChildId('usr-stu-1');
    }
  }, [currentProfile, isParent, isStudent]);

  // Call official backend API parameter filter on mode/student changes
  React.useEffect(() => {
    if (!activeChildId) return;
    setLoading(true);
    const fetchUrl = `/api/reports/${activeChildId}?term=1st Term${reportMode === 'half_term' ? '&report_type=midterm' : ''}`;
    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error('API server offline or unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data && !data.debt_locked) {
          setBackendReport(data);
        } else {
          setBackendReport(null);
        }
      })
      .catch(() => {
        // Safe offline fallback
        setBackendReport(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeChildId, reportMode]);

  // Block students completely
  if (isStudent) {
    return (
      <div id="student-lockout-panel" className="p-6 bg-white rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">🔒 CORE PRIVACY BLOCKADE ACTIVE</h3>
        <p className="text-xs text-rose-700 font-bold max-w-sm">
          SECURITY PROTOCOL SEC-402: Student Access Restricted
        </p>
        <p className="text-[11px] text-slate-500 max-w-md mt-4 leading-relaxed">
          To eliminate standard grade leaks, cheat profiles, and promote academic data privacy, students face a strict security blockade on their personal dashboard. They cannot view active grade breakdowns, continuous assessments, or final report sheets.
        </p>
        <div className="mt-5 bg-slate-50 border border-slate-200 p-3 rounded text-[10px] text-left max-w-md font-mono text-slate-500">
          <span className="font-bold text-slate-700">PARENTAL CLEARANCE MANDATE:</span>
          <p className="mt-1">
            Official terminal results and CAs are restricted exclusively to verified **Parent Accounts** or school-issued physical transcript keys. Please select a Parent profile (e.g., Dr. Amira Adekunle) in the simulation bar to safely bypass.
          </p>
        </div>
      </div>
    );
  }

  // If not published for parents
  if (isParent && !isPublished) {
    return (
      <div id="unpublished-lockout-panel" className="p-6 bg-white rounded-xl border border-amber-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">🔒 UNPUBLISHED STATE ACTIVELY LOCK GATED</h3>
        <p className="text-xs text-amber-700 font-bold max-w-sm">
          Awaiting Institutional Administrator Release Sign-Off
        </p>
        <p className="text-[11px] text-slate-500 max-w-md mt-4 leading-relaxed">
          The terminal grade sheets have been compiled by class teachers, but the Super Master Admin has not declared the global "Publish Results" clearance tag. No marks leak to the parent portal until clearance has been finalized.
        </p>
        <div className="mt-5 bg-slate-50 border border-slate-200 p-3 rounded text-[10px] text-left max-w-md font-mono text-slate-500">
          <span className="font-bold text-slate-700">DEMO INSTRUCTIONS:</span>
          <p className="mt-1">
            Switch simulation role back to **Super Admin (Chief David K. Macaulay)** using the top bar, and click the global **"Blockade Active"** button to toggle the publish state to "Live"! Then return to this Parent portal.
          </p>
        </div>
      </div>
    );
  }

  // Find target student details
  const targetStudent = studentsProfileList.find((s) => s.id === activeChildId) || studentsProfileList[0];
  const studentGrades = grades.filter((g) => g.studentId === activeChildId);

  // Parent Multi-Child Selector
  const childrenList = isParent
    ? studentsProfileList.filter((s) => (currentProfile.studentIds || []).includes(s.id))
    : studentsProfileList;

  // Half Term Scaling Calculation
  const getHalfTermScale = (g: GradeRecord) => {
    if (g.caType === '4_CA') {
      // 4_CA: ca1 and ca2 are out of 10.
      // Scaling Formula: (Test 1 + Test 2) * 4 to map to 40 max points.
      const ca1 = g.scores.ca1 || 0;
      const ca2 = g.scores.ca2 || 0;
      const scaled = (ca1 + ca2) * 4;
      const pct = (scaled / 40) * 100;
      return { rawSum: ca1 + ca2, scaled, pct, basis: 40 };
    } else {
      // 2_CA: ca1 and ca2 are out of 20. Total is 40. No scaling needed.
      const ca1 = g.scores.ca1 || 0;
      const ca2 = g.scores.ca2 || 0;
      const scaled = ca1 + ca2;
      const pct = (scaled / 40) * 100;
      return { rawSum: ca1 + ca2, scaled, pct, basis: 40 };
    }
  };

  const getGradeForPercent = (pct: number) => {
    if (pct >= 75) return 'A';
    if (pct >= 65) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 45) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
  };

  const getRemarksForGrade = (gLetter: string) => {
    switch (gLetter.toUpperCase()) {
      case 'A': return 'Excellent';
      case 'B': return 'Very Good';
      case 'C': return 'Good';
      case 'D': return 'Fair';
      case 'E': return 'Pass';
      default: return 'Fail';
    }
  };

  const calculateOverallAverages = () => {
    if (studentGrades.length === 0) return { avg: 0, gradeLetter: 'F' };
    
    let totalPct = 0;
    studentGrades.forEach((g) => {
      if (reportMode === 'half_term') {
        const hScale = getHalfTermScale(g);
        totalPct += hScale.pct;
      } else {
        // Full Term: out of 100
        totalPct += g.totalScore;
      }
    });

    const average = Math.round(totalPct / studentGrades.length);
    const grade = getGradeForPercent(average);

    return { avg: average, gradeLetter: grade };
  };

  const summaryStats = backendReport && reportMode === 'half_term'
    ? { avg: backendReport.overall_average_percentage, gradeLetter: getGradeForPercent(backendReport.overall_average_percentage) }
    : calculateOverallAverages();

  return (
    <div className="flex-grow flex-shrink flex gap-4 h-full overflow-hidden flex-col">
      {/* TOOLBAR CONTROLS */}
      <div id="results-checker-toolbar" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Multi-child selector */}
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
            {isParent ? 'Affiliated Children:' : 'Student Roster Catalog:'}
          </span>
          <select
            id="student-filter-selector"
            value={activeChildId}
            onChange={(e) => setActiveChildId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 outline-none font-bold"
          >
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.fullName} ({child.username})
              </option>
            ))}
          </select>
        </div>

        {/* Report Mode Dual-Switch */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Report Mode Scope:</span>
          <div id="report-mode-toggle-group" className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200">
            <button
              id="half-term-toggle-btn"
              onClick={() => setReportMode('half_term')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded tracking-wider transition ${
                reportMode === 'half_term' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Half-Term (40 Marks scaled)
            </button>
            <button
              id="full-term-toggle-btn"
              onClick={() => setReportMode('full_term')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded tracking-wider transition ${
                reportMode === 'full_term' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Full-Term (100 Marks cumulative)
            </button>
          </div>

          <button
            id="print-slip-button"
            onClick={() => window.print()}
            className="ml-3 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3 h-3" />
            Print Slip
          </button>
        </div>
      </div>

      {/* RENDER REPORT DOCKET */}
      <div id="report-docket-container" className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-auto font-sans text-slate-800 flex flex-col justify-between min-h-[400px] border-t-8 border-t-indigo-900 print:border-none print:shadow-none">
        
        {/* Printable docket logo and header */}
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-900 rounded font-bold text-white flex items-center justify-center text-sm">CS</div>
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">CORNER STREAMS INTERNATIONAL</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase">
                Paperless school governance, grading matrix & verified transcripts
              </p>
            </div>
            <div className="text-right">
              <span id="active-report-badge" className="px-2.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full font-bold uppercase animate-pulse">
                {reportMode === 'half_term' ? 'Half-Term Report Card' : 'Terminal Cumulative Sheet'}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: SEC-{targetStudent.username}</p>
            </div>
          </div>

          {/* Student passport and details row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 p-4 rounded-xl items-center relative">
            <div className="md:col-span-2">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shadow bg-white flex items-center justify-center">
                {targetStudent.photoUrl ? (
                  <img src={targetStudent.photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="font-bold text-slate-400">CS</div>
                )}
              </div>
            </div>
            <div className="md:col-span-6 grid grid-cols-2 gap-y-2 text-xs font-mono">
              <div>
                <p className="text-[9px] text-slate-400 uppercase leading-none">Full Name of Student</p>
                <p className="font-bold text-slate-800 uppercase mt-1 font-sans text-sm">{targetStudent.fullName}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase leading-none">Student ID Sequence</p>
                <p className="font-bold text-indigo-700 mt-1">{targetStudent.username}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase leading-none">Academic Term & Session</p>
                <p className="font-bold text-slate-800 uppercase mt-1">First Term (2025/2026)</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase leading-none">Class Cohort Placement</p>
                <p className="font-bold text-slate-800 uppercase mt-1">{targetStudent.gradeLevel} • {targetStudent.classCohort}</p>
              </div>
            </div>
            <div className="md:col-span-4 bg-white border border-slate-200/60 rounded-lg p-3 text-center self-stretch flex flex-col justify-center">
              <p className="text-[9px] text-indigo-500 uppercase font-bold tracking-wider leading-none mb-1">AGGREGATE PERCENTAGE</p>
              <h3 className="text-2xl font-black text-indigo-950 font-mono leading-none">{summaryStats.avg}%</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase font-mono">Letter Grade: {summaryStats.gradeLetter}</p>
            </div>
          </div>

          {/* Narrative Grading Block */}
          {reportMode === 'half_term' && (
            <div id="narrative-grading-block" className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-xs space-y-2 text-indigo-950">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Narrative Grading Notice - 40-Mark Weight Transformation</span>
              </div>
              <p className="leading-relaxed">
                This half-term report displays continuous assessment achievements scaled dynamically to a strict <strong>40-Mark Maximum Benchmark</strong>.
                For courses utilizing 4 sequential assessments, the mathematical conversion scales the first two assessments: 
                <code className="mx-1 px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-950 font-mono font-bold font-black">Scaled Mid-Term Score = (Test 1 + Test 2) × 4</code>.
                For courses on a 2-continuous-assessment model, values are displayed as-is (cumulative max 40). Overall percentages and letters are measured against this scaled midterm progress metric.
              </p>
            </div>
          )}

          {/* Marks display sheet */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 border-b border-indigo-900 pb-1.5">
              Current Academic Performance Docket
            </h3>

            {studentGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No grading scores compiled under this pupil reference code.</p>
            ) : (
              <div className="overflow-x-auto">
                <table id="academic-grades-table" className="w-full font-mono text-xs border border-slate-200 rounded">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-left">
                      <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider text-center w-12">S/N</th>
                      {reportMode === 'half_term' ? (
                        <>
                          <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider font-sans">Subject</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">Test 1</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">Test 2</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider bg-indigo-50 text-indigo-950 font-bold">Score (Out of 40)</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">Grade</th>
                          <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider font-sans">Remarks</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider">Subject Code</th>
                          <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider font-sans">Subject Title</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">CAs (40)</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">Terminal Exam (60)</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider bg-indigo-50 text-indigo-950 font-bold">Grand Total (100)</th>
                          <th className="p-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">Grade</th>
                          <th className="p-2 text-[10px] text-slate-500 uppercase tracking-wider font-sans">Official Comment</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentGrades.map((g, idx) => {
                      const hScale = getHalfTermScale(g);
                      const displayGrade = reportMode === 'half_term' ? getGradeForPercent(hScale.pct) : g.gradeLetter;
                      const displayRemark = reportMode === 'half_term' ? getRemarksForGrade(displayGrade) : g.remark;

                      if (reportMode === 'half_term') {
                        return (
                          <tr key={g.id} className="hover:bg-slate-50/55 transition">
                            <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2 font-sans font-bold text-slate-700">{g.subjectName}</td>
                            <td className="p-2 text-center bg-blue-50/15">{g.scores.ca1}</td>
                            <td className="p-2 text-center bg-blue-50/15">{g.scores.ca2}</td>
                            <td className="p-2 text-center bg-indigo-50 font-black text-indigo-700">
                              {hScale.scaled} <span className="text-[9px] text-slate-400 font-normal">({hScale.pct}%)</span>
                            </td>
                            <td className="p-2 text-center">
                              <span className="bg-indigo-150 border border-indigo-200 px-1.5 py-0.2 rounded font-black text-[10px] text-indigo-900">
                                {displayGrade}
                              </span>
                            </td>
                            <td className="p-2 font-sans font-semibold text-[10px] uppercase text-indigo-800">
                              {displayRemark}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/55 transition">
                          <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold text-indigo-900">{g.subjectCode}</td>
                          <td className="p-2 font-sans font-bold text-slate-700 leading-snug">{g.subjectName}</td>
                          <td className="p-2 text-center">
                            {g.caType === '4_CA'
                              ? (g.scores.ca1 + g.scores.ca2 + (g.scores.ca3 || 0) + (g.scores.ca4 || 0))
                              : (g.scores.ca1 + g.scores.ca2)}
                          </td>
                          <td className="p-2 text-center">{g.scores.exam}</td>
                          <td className="p-2 text-center bg-indigo-50 font-black text-indigo-900 text-sm">
                            {g.totalScore}
                          </td>
                          <td className="p-2 text-center">
                            <span className="bg-slate-100 border px-1.5 py-0.2 rounded font-black text-[10px]">
                              {g.gradeLetter}
                            </span>
                          </td>
                          <td className="p-2 font-sans font-medium text-[9px] uppercase text-slate-500 max-w-[200px] truncate">
                            {g.remark}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Metrics Footer Row */}
          <div id="summary-metrics-footer" className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200 sm:border-none">
              <span className="font-sans text-slate-500 font-bold uppercase text-[9px] tracking-wider">Compiled Total Marks</span>
              <span className="text-sm font-black text-slate-800">
                {reportMode === 'half_term' ? (
                  <>
                    {studentGrades.reduce((sum, g) => sum + getHalfTermScale(g).scaled, 0)} <span className="text-slate-400 font-normal">/ {studentGrades.length * 40} Marks</span>
                  </>
                ) : (
                  <>
                    {studentGrades.reduce((sum, g) => sum + g.totalScore, 0)} <span className="text-slate-400 font-normal">/ {studentGrades.length * 100} Marks</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 font-sans">
              <span className="text-indigo-600 font-bold uppercase text-[9px] tracking-wider">Overall Average Percentage</span>
              <span className="text-sm font-bold text-indigo-950 font-mono font-black">
                {summaryStats.avg.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Docket regulatory signatures and QR code verification */}
        <div className="border-t border-slate-200 pt-5 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold text-slate-400 font-mono uppercase">
          <div className="space-y-1">
            <p className="leading-none text-slate-700 font-sans text-xs">Mrs. Folasade Adebayo</p>
            <p className="text-slate-400">Classroom Cohort Registrar Signature</p>
            <div className="border-b border-dashed border-slate-300 w-40 pt-4"></div>
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-1 border-l border-r border-slate-100 px-4">
            {backendReport?.qr_code ? (
              <img src={backendReport.qr_code} alt="QR Verification" className="w-16 h-16 border border-slate-250 p-1 rounded bg-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 border border-slate-200/60 p-1.5 rounded bg-slate-50 flex items-center justify-center font-bold text-[9px] text-slate-400 text-center uppercase tracking-widest leading-none">
                Offline Verified
              </div>
            )}
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center mt-1">
              {backendReport?.qr_payload ? "Scan to Authenticate Transcript File" : "Local Mock Sign-Off Validated"}
            </span>
          </div>

          <div className="text-right space-y-1 flex flex-col items-end">
            <p className="leading-none text-slate-700 font-sans text-xs flex items-center gap-1">
              <span>{backendReport?.principal_signature || "Chief David K. Macaulay"}</span>
              <span className="w-2 h-2 rounded-full bg-indigo-650"></span>
            </p>
            <p className="text-slate-400">Master Super Admin seal</p>
            <div className="border-b border-dashed border-slate-300 w-40 pt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
