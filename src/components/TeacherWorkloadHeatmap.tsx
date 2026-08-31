import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Clock, 
  BookOpen, 
  SlidersHorizontal, 
  RefreshCw, 
  Download, 
  Info,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Sparkles,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { ReassignSubjectModal } from './ReassignSubjectModal';

interface TeacherSubjectLoad {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  assignedClasses: string[];
  // Mapping subject name -> weekly period hours
  subjectPeriods: Record<string, number>;
  specialization: string;
}

const DEFAULT_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "ICT / Computer",
  "Further Math",
  "Financial Acc.",
  "Civic Ed."
];

const INITIAL_FACULTY_LOADS: TeacherSubjectLoad[] = [
  {
    id: "u-2",
    name: "Mrs. Folasade Adebayo",
    email: "f.adebayo@cornerstreams.edu",
    role: "HOD Science / Senior Teacher",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["SS 2 Science", "SS 3 Science", "JSS 3 Alpha"],
    subjectPeriods: {
      "Mathematics": 10,
      "Physics": 8,
      "Further Math": 6,
      "ICT / Computer": 2
    },
    specialization: "Physical Sciences"
  },
  {
    id: "u-3",
    name: "Mr. Chidi Okafor",
    email: "c.okafor@cornerstreams.edu",
    role: "Mathematics Instructor",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["SS 1 Gold", "SS 1 Silver", "JSS 2 Blue", "JSS 1 Green"],
    subjectPeriods: {
      "Mathematics": 14,
      "Further Math": 8,
      "Economics": 4
    },
    specialization: "Mathematics & Stats"
  },
  {
    id: "u-4",
    name: "Dr. Emeka Nwosu",
    email: "e.nwosu@cornerstreams.edu",
    role: "Chemistry & Biology Lead",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["SS 2 Science", "SS 3 Science"],
    subjectPeriods: {
      "Chemistry": 8,
      "Biology": 6
    },
    specialization: "Chemical & Biological Sciences"
  },
  {
    id: "u-5",
    name: "Mrs. Grace Danjuma",
    email: "g.danjuma@cornerstreams.edu",
    role: "English & Literature Faculty",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["SS 1 Gold", "SS 2 Science", "SS 3 Arts", "JSS 3 Alpha"],
    subjectPeriods: {
      "English Language": 16,
      "Civic Ed.": 6,
      "Economics": 4
    },
    specialization: "Humanities & Arts"
  },
  {
    id: "u-6",
    name: "Mr. David Macaulay",
    email: "d.macaulay@cornerstreams.edu",
    role: "Commercial Stream Instructor",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["SS 2 Commercial", "SS 3 Commercial"],
    subjectPeriods: {
      "Economics": 8,
      "Financial Acc.": 8,
      "Civic Ed.": 2
    },
    specialization: "Business & Commerce"
  },
  {
    id: "u-7",
    name: "Mr. Samuel Balogun",
    email: "s.balogun@cornerstreams.edu",
    role: "ICT & Technical Director",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120",
    assignedClasses: ["JSS 1 Green", "JSS 2 Blue", "JSS 3 Alpha", "SS 1 Gold"],
    subjectPeriods: {
      "ICT / Computer": 12,
      "Mathematics": 2
    },
    specialization: "Computer Science"
  }
];

export interface TeacherWorkloadHeatmapProps {
  highlightTeacherName?: string;
  isAdminView?: boolean;
  title?: string;
  subtitle?: string;
}

export const TeacherWorkloadHeatmap: React.FC<TeacherWorkloadHeatmapProps> = ({
  highlightTeacherName,
  isAdminView = true,
  title = "Faculty Subject Load & Burnout Risk Heatmap",
  subtitle = "Color-coded intensity matrix tracking subject periods assigned per teacher to identify distribution imbalances."
}) => {
  const [faculty, setFaculty] = useState<TeacherSubjectLoad[]>(() => {
    try {
      const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
      return saved ? JSON.parse(saved) : INITIAL_FACULTY_LOADS;
    } catch {
      return INITIAL_FACULTY_LOADS;
    }
  });

  const [filterRisk, setFilterRisk] = useState<'all' | 'optimal' | 'moderate' | 'high' | 'burnout'>('all');
  const [metricMode, setMetricMode] = useState<'periods' | 'cohorts'>('periods');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSubjectLoad | null>(null);
  const [reassignTargetTeacher, setReassignTargetTeacher] = useState<TeacherSubjectLoad | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
        if (saved) setFaculty(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("teacher_workload_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("teacher_workload_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Helper calculation for total load
  const getTeacherTotalPeriods = (teacher: TeacherSubjectLoad): number => {
    return Object.values(teacher.subjectPeriods).reduce((a, b) => a + b, 0);
  };

  const getTeacherCohortCount = (teacher: TeacherSubjectLoad): number => {
    return teacher.assignedClasses.length;
  };

  // Risk categorization
  const getRiskCategory = (totalPeriods: number) => {
    if (totalPeriods >= 26) return { key: 'burnout', label: 'CRITICAL BURNOUT RISK', color: 'text-rose-700 bg-rose-100 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' };
    if (totalPeriods >= 21) return { key: 'high', label: 'HEAVY WORKLOAD', color: 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' };
    if (totalPeriods >= 14) return { key: 'moderate', label: 'MODERATE / BALANCED', color: 'text-indigo-700 bg-indigo-100 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' };
    return { key: 'optimal', label: 'OPTIMAL / LIGHT', color: 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' };
  };

  // Heatmap cell intensity color generator
  const getCellIntensityClass = (periods: number, isHighlighted: boolean) => {
    if (!periods || periods === 0) {
      return "bg-slate-50/70 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700 hover:bg-slate-100/80";
    }
    
    let base = "";
    if (periods <= 3) {
      base = "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60 font-semibold";
    } else if (periods <= 6) {
      base = "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-800 font-bold";
    } else if (periods <= 10) {
      base = "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold";
    } else {
      base = "bg-rose-200 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-400 dark:border-rose-600 font-black shadow-sm animate-pulse-subtle";
    }

    if (isHighlighted) {
      return `${base} ring-2 ring-indigo-500 ring-offset-1`;
    }
    return base;
  };

  // Filtering faculty
  const filteredFaculty = faculty.filter(t => {
    const total = getTeacherTotalPeriods(t);
    const risk = getRiskCategory(total).key;
    if (filterRisk === 'all') return true;
    return risk === filterRisk;
  });

  // Global KPI calculations
  const totalFacultyCount = faculty.length;
  const avgPeriods = Math.round(faculty.reduce((acc, t) => acc + getTeacherTotalPeriods(t), 0) / (totalFacultyCount || 1));
  const burnoutRiskCount = faculty.filter(t => getTeacherTotalPeriods(t) >= 26).length;
  const heavyLoadCount = faculty.filter(t => getTeacherTotalPeriods(t) >= 21 && getTeacherTotalPeriods(t) < 26).length;
  const optimalCount = faculty.filter(t => getTeacherTotalPeriods(t) < 21).length;

  const handleExportMatrix = () => {
    toast.success("📊 Faculty Subject Load Heatmap exported as CSV / Audit Sheet!", {
      description: "Summary generated with period loads, assigned cohorts & burnout indices."
    });
  };

  const handleQuickRebalance = () => {
    // Rebalance algorithm: transfer 2 periods from heaviest teacher to lighter teacher
    const sorted = [...faculty].sort((a, b) => getTeacherTotalPeriods(b) - getTeacherTotalPeriods(a));
    if (sorted.length >= 2) {
      const heaviest = sorted[0];
      const lightest = sorted[sorted.length - 1];

      // find heaviest subject for heaviest teacher
      const entries = Object.entries(heaviest.subjectPeriods) as [string, number][];
      entries.sort((a, b) => b[1] - a[1]);
      const heaviestSub = entries[0];
      if (heaviestSub && heaviestSub[1] > 2) {
        const subName = heaviestSub[0];
        const updated = faculty.map(f => {
          if (f.id === heaviest.id) {
            return {
              ...f,
              subjectPeriods: { ...f.subjectPeriods, [subName]: f.subjectPeriods[subName] - 2 }
            };
          }
          if (f.id === lightest.id) {
            return {
              ...f,
              subjectPeriods: { ...f.subjectPeriods, [subName]: (f.subjectPeriods[subName] || 0) + 2 }
            };
          }
          return f;
        });
        setFaculty(updated);
        localStorage.setItem("CS_TEACHER_WORKLOAD_MATRIX", JSON.stringify(updated));
        toast.success(`⚡ Rebalanced 2 periods of ${subName} from ${heaviest.name} to ${lightest.name}!`, {
          description: "Subject workload updated across active schedules."
        });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base tracking-tight">
              {title}
            </h3>
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
              Live Heatmap
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            {subtitle}
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleQuickRebalance}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            title="Auto-rebalance workload from overloaded instructors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Auto-Balance</span>
          </button>

          <button
            type="button"
            onClick={handleExportMatrix}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Audit</span>
          </button>
        </div>
      </div>

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Faculty Tracked</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{totalFacultyCount} Instructors</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-lg shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Campus Avg Load</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{avgPeriods} Periods / Wk</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Optimal Workload</span>
            <span className="text-sm font-black text-emerald-900 dark:text-emerald-200 font-mono">{optimalCount} Teachers</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-3 ${
          burnoutRiskCount > 0 
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/80" 
            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
        }`}>
          <div className={`p-2 rounded-lg shrink-0 ${
            burnoutRiskCount > 0 ? "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200" : "bg-slate-200 text-slate-600"
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[9.5px] font-bold uppercase tracking-wider block ${
              burnoutRiskCount > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-400"
            }`}>
              Burnout Overload Risk
            </span>
            <span className={`text-sm font-black font-mono ${
              burnoutRiskCount > 0 ? "text-rose-800 dark:text-rose-200" : "text-slate-800 dark:text-slate-200"
            }`}>
              {burnoutRiskCount} {burnoutRiskCount === 1 ? "Instructor" : "Instructors"}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & MODE CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Filter Risk:</span>
          {[
            { id: 'all', label: 'All Faculty' },
            { id: 'burnout', label: 'Critical Risk (26+ hrs)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
            { id: 'high', label: 'Heavy Load (21-25 hrs)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
            { id: 'optimal', label: 'Optimal (< 21 hrs)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterRisk(f.id as any)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                filterRisk === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMetricMode('periods')}
            className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
              metricMode === 'periods' 
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly Periods (hrs)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('cohorts')}
            className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
              metricMode === 'cohorts' 
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Class Cohort Count
          </button>
        </div>
      </div>

      {/* HEATMAP INTENSITY GRID TABLE */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold">
              <th className="py-3 px-3 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">
                Faculty Instructor
              </th>
              {DEFAULT_SUBJECTS.map((sub, idx) => (
                <th key={idx} className="py-3 px-2 text-center min-w-[75px]">
                  <span className="truncate block max-w-[85px]" title={sub}>
                    {sub.length > 9 ? `${sub.slice(0, 8)}…` : sub}
                  </span>
                </th>
              ))}
              <th className="py-3 px-3 text-center min-w-[100px] border-l border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50">
                Total Load
              </th>
              <th className="py-3 px-3 text-center min-w-[140px]">
                Burnout Risk Index
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredFaculty.map((teacher) => {
              const totalPeriods = getTeacherTotalPeriods(teacher);
              const risk = getRiskCategory(totalPeriods);
              const isHighlight = highlightTeacherName && teacher.name.toLowerCase().includes(highlightTeacherName.toLowerCase());

              return (
                <tr 
                  key={teacher.id} 
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    isHighlight ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  {/* Instructor Name & Info */}
                  <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100">
                        <img 
                          src={teacher.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} 
                          alt={teacher.name}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white truncate block text-[12px]">
                            {teacher.name}
                          </span>
                          {isHighlight && (
                            <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-black rounded uppercase tracking-wider">
                              You
                            </span>
                          )}
                          {isAdminView && (
                            <button
                              type="button"
                              onClick={() => setReassignTargetTeacher(teacher)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded transition cursor-pointer shrink-0"
                              title="Reassign subject load"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                          {teacher.assignedClasses.join(", ") || "No Cohorts"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Subject Heatmap Cells */}
                  {DEFAULT_SUBJECTS.map((sub, sIdx) => {
                    const periods = teacher.subjectPeriods[sub] || 0;
                    const cellClass = getCellIntensityClass(periods, isHighlight || false);

                    return (
                      <td key={sIdx} className="p-1 text-center align-middle">
                        <div 
                          className={`w-full py-2 px-1 rounded-lg text-center font-mono transition-all duration-150 ${cellClass}`}
                          title={`${teacher.name} - ${sub}: ${periods} weekly periods`}
                        >
                          {periods > 0 ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-[11px] leading-none font-bold">{periods}h</span>
                              <span className="text-[8px] opacity-70 uppercase font-sans tracking-tight">/wk</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Total Load Cell */}
                  <td className="py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {metricMode === 'periods' ? `${totalPeriods} hrs` : `${teacher.assignedClasses.length} Cohorts`}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 block font-sans">
                      {Object.keys(teacher.subjectPeriods).length} Subjects
                    </span>
                  </td>

                  {/* Risk Badge Cell */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${risk.color}`}>
                      {risk.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* HEATMAP LEGEND & FOOTER GUIDANCE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800 text-slate-500">
        
        {/* Heatmap Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Intensity Legend:</span>
          
          <div className="flex items-center gap-1.5 text-[10.5px]">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block" />
            <span>0h (Unassigned)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px]">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 inline-block" />
            <span>1-3h (Light)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px]">
            <span className="w-3.5 h-3.5 rounded bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-800 inline-block" />
            <span>4-6h (Optimal)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px]">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 inline-block" />
            <span>7-10h (Heavy)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px]">
            <span className="w-3.5 h-3.5 rounded bg-rose-200 dark:bg-rose-900 border border-rose-400 dark:border-rose-600 inline-block" />
            <span>11h+ (Critical Load)</span>
          </div>
        </div>

        {/* Burnout Prevention Note */}
        <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Recommended max faculty load: <strong>22 periods/week</strong>.</span>
        </div>

      </div>

      {/* REASSIGN SUBJECT LOAD MODAL */}
      {reassignTargetTeacher && (
        <ReassignSubjectModal
          isOpen={!!reassignTargetTeacher}
          onClose={() => setReassignTargetTeacher(null)}
          teacherName={reassignTargetTeacher.name}
          teacherEmail={reassignTargetTeacher.email}
          teacherId={reassignTargetTeacher.id}
          onSaved={() => {
            setReassignTargetTeacher(null);
          }}
        />
      )}

    </div>
  );
};

export default TeacherWorkloadHeatmap;
