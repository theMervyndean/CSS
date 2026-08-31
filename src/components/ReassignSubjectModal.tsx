import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  AlertTriangle, 
  ShieldAlert, 
  User, 
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export interface TeacherSubjectLoad {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  assignedClasses: string[];
  subjectPeriods: Record<string, number>;
  specialization: string;
}

const DEFAULT_ALL_SUBJECTS = [
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

interface ReassignSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  teacherEmail?: string;
  teacherId?: string;
  onSaved?: () => void;
}

export const ReassignSubjectModal: React.FC<ReassignSubjectModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  teacherEmail,
  teacherId,
  onSaved
}) => {
  const [subjectLoads, setSubjectLoads] = useState<Record<string, number>>({});
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [currentTeacherObj, setCurrentTeacherObj] = useState<TeacherSubjectLoad | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isLoadedRef = React.useRef(false);

  useEffect(() => {
    if (!isOpen) {
      isLoadedRef.current = false;
      setAutoSaveState('idle');
      return;
    }

    try {
      const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
      const matrix: TeacherSubjectLoad[] = saved ? JSON.parse(saved) : INITIAL_FACULTY_LOADS;

      // Find matching teacher by name or email or id
      let match = matrix.find(t => 
        (teacherId && t.id === teacherId) ||
        (teacherEmail && t.email.toLowerCase() === teacherEmail.toLowerCase()) ||
        t.name.toLowerCase().includes(teacherName.toLowerCase()) ||
        teacherName.toLowerCase().includes(t.name.toLowerCase())
      );

      if (!match) {
        // Create new profile record entry for teacher
        match = {
          id: teacherId || `u-${Date.now()}`,
          name: teacherName,
          email: teacherEmail || `${teacherName.toLowerCase().replace(/[^a-z]/g, '')}@cornerstreams.edu`,
          role: "Subject Instructor",
          photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120",
          assignedClasses: ["SS 1 Gold", "SS 2 Science"],
          subjectPeriods: { "Mathematics": 6, "English Language": 6 },
          specialization: "Academic Faculty"
        };
      }

      setCurrentTeacherObj(match);
      setSubjectLoads({ ...match.subjectPeriods });
      setAssignedClasses([...match.assignedClasses]);
      
      // Delay enabling auto-save to ignore initial state setting
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 100);
    } catch (e) {
      console.error(e);
    }
  }, [isOpen, teacherName, teacherEmail, teacherId]);

  // Debounced auto-save mechanism
  useEffect(() => {
    if (!isOpen || !isLoadedRef.current) return;

    setAutoSaveState('saving');
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
        let matrix: TeacherSubjectLoad[] = saved ? JSON.parse(saved) : INITIAL_FACULTY_LOADS;

        let found = false;
        matrix = matrix.map(t => {
          if (
            (teacherId && t.id === teacherId) ||
            (teacherEmail && t.email.toLowerCase() === teacherEmail.toLowerCase()) ||
            t.name.toLowerCase().includes(teacherName.toLowerCase()) ||
            teacherName.toLowerCase().includes(t.name.toLowerCase())
          ) {
            found = true;
            return {
              ...t,
              subjectPeriods: subjectLoads,
              assignedClasses: assignedClasses
            };
          }
          return t;
        });

        if (!found && currentTeacherObj) {
          matrix.push({
            ...currentTeacherObj,
            subjectPeriods: subjectLoads,
            assignedClasses: assignedClasses
          });
        }

        localStorage.setItem("CS_TEACHER_WORKLOAD_MATRIX", JSON.stringify(matrix));
        window.dispatchEvent(new Event("teacher_workload_updated"));
        window.dispatchEvent(new Event("storage"));
        setAutoSaveState('saved');
      } catch (e) {
        console.error("Auto-save error:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [subjectLoads, assignedClasses, isOpen, teacherId, teacherEmail, teacherName, currentTeacherObj]);

  if (!isOpen) return null;

  const totalPeriods = Object.values(subjectLoads).reduce((a: number, b: number) => a + Number(b || 0), 0);

  const getRiskStatus = (total: number) => {
    if (total >= 26) return { label: "CRITICAL BURNOUT RISK", color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200" };
    if (total >= 21) return { label: "HEAVY WORKLOAD", color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200" };
    if (total >= 12) return { label: "BALANCED / OPTIMAL", color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200" };
    return { label: "LIGHT WORKLOAD", color: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200" };
  };

  const risk = getRiskStatus(Number(totalPeriods));

  const handlePeriodChange = (sub: string, delta: number) => {
    const current = subjectLoads[sub] || 0;
    const updated = Math.max(0, current + delta);
    if (updated === 0) {
      const copy = { ...subjectLoads };
      delete copy[sub];
      setSubjectLoads(copy);
    } else {
      setSubjectLoads({ ...subjectLoads, [sub]: updated });
    }
  };

  const handleSetExactPeriod = (sub: string, val: number) => {
    const num = Math.max(0, val);
    if (num === 0) {
      const copy = { ...subjectLoads };
      delete copy[sub];
      setSubjectLoads(copy);
    } else {
      setSubjectLoads({ ...subjectLoads, [sub]: num });
    }
  };

  const handleSave = () => {
    try {
      const saved = localStorage.getItem("CS_TEACHER_WORKLOAD_MATRIX");
      let matrix: TeacherSubjectLoad[] = saved ? JSON.parse(saved) : INITIAL_FACULTY_LOADS;

      let found = false;
      matrix = matrix.map(t => {
        if (
          (teacherId && t.id === teacherId) ||
          (teacherEmail && t.email.toLowerCase() === teacherEmail.toLowerCase()) ||
          t.name.toLowerCase().includes(teacherName.toLowerCase()) ||
          teacherName.toLowerCase().includes(t.name.toLowerCase())
        ) {
          found = true;
          return {
            ...t,
            subjectPeriods: subjectLoads,
            assignedClasses: assignedClasses
          };
        }
        return t;
      });

      if (!found && currentTeacherObj) {
        matrix.push({
          ...currentTeacherObj,
          subjectPeriods: subjectLoads,
          assignedClasses: assignedClasses
        });
      }

      localStorage.setItem("CS_TEACHER_WORKLOAD_MATRIX", JSON.stringify(matrix));
      
      // Dispatch event to refresh heatmap immediately across all components
      window.dispatchEvent(new Event("teacher_workload_updated"));
      window.dispatchEvent(new Event("storage"));

      toast.success(`⚡ Subject load for ${teacherName} updated successfully!`, {
        description: `Total load set to ${totalPeriods} hrs/wk (${risk.label}). Workload Heatmap updated.`
      });

      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save subject load changes.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
              <img 
                src={currentTeacherObj?.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120"} 
                alt={teacherName}
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                  Reassign Subject Workload
                </h3>
                {autoSaveState === 'saving' && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Auto-saving...
                  </span>
                )}
                {autoSaveState === 'saved' && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Auto-saved
                  </span>
                )}
                {autoSaveState === 'idle' && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Quick Action
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instructor: <strong>{teacherName}</strong> ({currentTeacherObj?.role || "Faculty Member"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CURRENT LOAD COUNTER DISPLAY */}
        <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Weekly Load Allocation
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {totalPeriods} <span className="text-xs font-sans font-bold text-slate-500">hrs / week</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${risk.color}`}>
              {risk.label}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Target Max: 22 hrs/wk
            </span>
          </div>
        </div>

        {/* SUBJECT PERIOD ALLOCATION GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Subject Period Assignments</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Adjust weekly hours per subject
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {DEFAULT_ALL_SUBJECTS.map((sub) => {
              const periods = subjectLoads[sub] || 0;
              const hasHours = periods > 0;

              return (
                <div key={sub} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-bold block truncate ${hasHours ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {sub}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {hasHours ? `${periods} period ${periods === 1 ? 'hour' : 'hours'} allocated` : 'Unassigned'}
                    </span>
                  </div>

                  {/* Increment / Decrement Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePeriodChange(sub, -2)}
                      disabled={periods === 0}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-30 transition cursor-pointer"
                      title="Decrease by 2 hours"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={periods}
                      onChange={(e) => handleSetExactPeriod(sub, parseInt(e.target.value) || 0)}
                      className="w-12 h-7 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    <button
                      type="button"
                      onClick={() => handlePeriodChange(sub, 2)}
                      className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                      title="Increase by 2 hours"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSubjectLoads({})}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 rounded-xl shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Workload</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReassignSubjectModal;
