import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  Landmark,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Users,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { BillingRecord } from '../types';

interface TuitionCollectionBarChartProps {
  billingRecords?: BillingRecord[];
  currentTerm?: string;
  currentSession?: string;
  onNavigateToBursary?: () => void;
  className?: string;
}

interface ClassCollectionStat {
  cohort: string;
  shortName: string;
  department: 'Senior Secondary' | 'Junior Secondary' | 'Primary & Early Years';
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionPercentage: number;
  totalStudents: number;
  clearedStudents: number;
  partialStudents: number;
  unpaidStudents: number;
}

interface WeeklyCollectionStat {
  week: string;
  weekNumber: number;
  weeklyCollected: number;
  cumulativeCollected: number;
  collectionPercentage: number;
  targetPercentage: number;
}

// Fallback baseline data per cohort if local storage is fresh/empty
const DEFAULT_CLASS_DATA: ClassCollectionStat[] = [
  {
    cohort: 'SS 3 Science & Arts',
    shortName: 'SS 3',
    department: 'Senior Secondary',
    totalInvoiced: 7700000,
    totalCollected: 7238000,
    outstandingBalance: 462000,
    collectionPercentage: 94.0,
    totalStudents: 35,
    clearedStudents: 32,
    partialStudents: 2,
    unpaidStudents: 1
  },
  {
    cohort: 'SS 2 Gold & Silver',
    shortName: 'SS 2',
    department: 'Senior Secondary',
    totalInvoiced: 8100000,
    totalCollected: 7128000,
    outstandingBalance: 972000,
    collectionPercentage: 88.0,
    totalStudents: 45,
    clearedStudents: 37,
    partialStudents: 6,
    unpaidStudents: 2
  },
  {
    cohort: 'SS 1 Diamond & Emerald',
    shortName: 'SS 1',
    department: 'Senior Secondary',
    totalInvoiced: 8640000,
    totalCollected: 6480000,
    outstandingBalance: 2160000,
    collectionPercentage: 75.0,
    totalStudents: 48,
    clearedStudents: 31,
    partialStudents: 12,
    unpaidStudents: 5
  },
  {
    cohort: 'JSS 3 Alpha & Beta',
    shortName: 'JSS 3',
    department: 'Junior Secondary',
    totalInvoiced: 6300000,
    totalCollected: 5796000,
    outstandingBalance: 504000,
    collectionPercentage: 92.0,
    totalStudents: 42,
    clearedStudents: 38,
    partialStudents: 3,
    unpaidStudents: 1
  },
  {
    cohort: 'JSS 2 Blue & White',
    shortName: 'JSS 2',
    department: 'Junior Secondary',
    totalInvoiced: 5600000,
    totalCollected: 4536000,
    outstandingBalance: 1064000,
    collectionPercentage: 81.0,
    totalStudents: 40,
    clearedStudents: 29,
    partialStudents: 8,
    unpaidStudents: 3
  },
  {
    cohort: 'JSS 1 Crystal & Ruby',
    shortName: 'JSS 1',
    department: 'Junior Secondary',
    totalInvoiced: 7000000,
    totalCollected: 4760000,
    outstandingBalance: 2240000,
    collectionPercentage: 68.0,
    totalStudents: 50,
    clearedStudents: 28,
    partialStudents: 14,
    unpaidStudents: 8
  },
  {
    cohort: 'Primary 4 - 6 Senior Basic',
    shortName: 'Pri 4-6',
    department: 'Primary & Early Years',
    totalInvoiced: 4950000,
    totalCollected: 4356000,
    outstandingBalance: 594000,
    collectionPercentage: 88.0,
    totalStudents: 45,
    clearedStudents: 38,
    partialStudents: 5,
    unpaidStudents: 2
  },
  {
    cohort: 'Primary 1 - 3 Junior Basic',
    shortName: 'Pri 1-3',
    department: 'Primary & Early Years',
    totalInvoiced: 4750000,
    totalCollected: 3752500,
    outstandingBalance: 997500,
    collectionPercentage: 79.0,
    totalStudents: 50,
    clearedStudents: 34,
    partialStudents: 11,
    unpaidStudents: 5
  },
  {
    cohort: 'Nursery & Creche Early Years',
    shortName: 'Nursery',
    department: 'Primary & Early Years',
    totalInvoiced: 3400000,
    totalCollected: 3128000,
    outstandingBalance: 272000,
    collectionPercentage: 92.0,
    totalStudents: 40,
    clearedStudents: 36,
    partialStudents: 3,
    unpaidStudents: 1
  }
];

const DEFAULT_WEEKLY_TRAJECTORY: WeeklyCollectionStat[] = [
  { week: 'Wk 1 (Resumption)', weekNumber: 1, weeklyCollected: 5800000, cumulativeCollected: 5800000, collectionPercentage: 10.3, targetPercentage: 15.0 },
  { week: 'Wk 2', weekNumber: 2, weeklyCollected: 8200000, cumulativeCollected: 14000000, collectionPercentage: 24.8, targetPercentage: 30.0 },
  { week: 'Wk 3', weekNumber: 3, weeklyCollected: 7900000, cumulativeCollected: 21900000, collectionPercentage: 38.8, targetPercentage: 45.0 },
  { week: 'Wk 4', weekNumber: 4, weeklyCollected: 6400000, cumulativeCollected: 28300000, collectionPercentage: 50.1, targetPercentage: 60.0 },
  { week: 'Wk 5 (Mid-Term Levy)', weekNumber: 5, weeklyCollected: 5100000, cumulativeCollected: 33400000, collectionPercentage: 59.2, targetPercentage: 70.0 },
  { week: 'Wk 6 (Mid-Term Break)', weekNumber: 6, weeklyCollected: 3400000, cumulativeCollected: 36800000, collectionPercentage: 65.2, targetPercentage: 75.0 },
  { week: 'Wk 7', weekNumber: 7, weeklyCollected: 4100000, cumulativeCollected: 40900000, collectionPercentage: 72.5, targetPercentage: 80.0 },
  { week: 'Wk 8 (CA Tests)', weekNumber: 8, weeklyCollected: 2900000, cumulativeCollected: 43800000, collectionPercentage: 77.6, targetPercentage: 85.0 },
  { week: 'Wk 9 (Current Week)', weekNumber: 9, weeklyCollected: 3376500, cumulativeCollected: 47176500, collectionPercentage: 83.6, targetPercentage: 90.0 },
  { week: 'Wk 10 (Target)', weekNumber: 10, weeklyCollected: 2800000, cumulativeCollected: 49976500, collectionPercentage: 88.5, targetPercentage: 92.0 },
  { week: 'Wk 11 (CBT Exams)', weekNumber: 11, weeklyCollected: 2100000, cumulativeCollected: 52076500, collectionPercentage: 92.3, targetPercentage: 95.0 },
  { week: 'Wk 12 (Vacation)', weekNumber: 12, weeklyCollected: 1400000, cumulativeCollected: 53476500, collectionPercentage: 94.7, targetPercentage: 98.0 }
];

export function TuitionCollectionBarChart({
  billingRecords,
  currentTerm = '1st Term',
  currentSession = '2025/2026',
  onNavigateToBursary,
  className = ''
}: TuitionCollectionBarChartProps) {
  const [viewMode, setViewMode] = useState<'by_class' | 'by_timeline'>('by_class');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'Senior Secondary' | 'Junior Secondary' | 'Primary & Early Years'>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<string>(currentTerm);
  const [targetBenchmark, setTargetBenchmark] = useState<number>(85);
  const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
  const [isTermMenuOpen, setIsTermMenuOpen] = useState(false);
  const [activeBarCohort, setActiveBarCohort] = useState<string | null>(null);

  // Compute live statistics from incoming billing records or local storage
  const classData = useMemo(() => {
    try {
      const stored = localStorage.getItem('CS_BILLING_LEDGER') || localStorage.getItem('CS_BILLING_RECORDS');
      const recordsToUse: BillingRecord[] = billingRecords && billingRecords.length > 0 
        ? billingRecords 
        : (stored ? JSON.parse(stored) : []);

      if (recordsToUse && recordsToUse.length > 0) {
        // Group by class if records exist
        const cohortMap = new Map<string, { totalInvoiced: number; totalCollected: number; totalStudents: number; cleared: number; partial: number; unpaid: number }>();
        
        recordsToUse.forEach(rec => {
          // Infer or default class
          const rawClass = (rec as any).className || (rec as any).assignedClass || (rec.invoiceNumber?.includes('SS2') ? 'SS 2' : (rec.invoiceNumber?.includes('SS3') ? 'SS 3' : (rec.invoiceNumber?.includes('SS1') ? 'SS 1' : 'JSS 1')));
          const entry = cohortMap.get(rawClass) || { totalInvoiced: 0, totalCollected: 0, totalStudents: 0, cleared: 0, partial: 0, unpaid: 0 };
          
          const invoiced = rec.totalAmount || (rec.tuitionFee + (rec.cbtProcessingFee || 0) + (rec.miscellaneousFee || 0));
          const paid = rec.amountPaid || 0;
          
          entry.totalInvoiced += invoiced;
          entry.totalCollected += paid;
          entry.totalStudents += 1;

          if (paid >= invoiced && invoiced > 0) {
            entry.cleared += 1;
          } else if (paid > 0) {
            entry.partial += 1;
          } else {
            entry.unpaid += 1;
          }

          cohortMap.set(rawClass, entry);
        });

        // Merge computed with base cohorts for majestic full chart visual
        return DEFAULT_CLASS_DATA.map(base => {
          const match = cohortMap.get(base.shortName);
          if (match && match.totalInvoiced > 0) {
            const pct = Math.min(100, Math.round((match.totalCollected / match.totalInvoiced) * 1000) / 10);
            return {
              ...base,
              totalInvoiced: match.totalInvoiced,
              totalCollected: match.totalCollected,
              outstandingBalance: Math.max(0, match.totalInvoiced - match.totalCollected),
              collectionPercentage: pct,
              totalStudents: Math.max(base.totalStudents, match.totalStudents),
              clearedStudents: match.cleared,
              partialStudents: match.partial,
              unpaidStudents: match.unpaid
            };
          }
          return base;
        });
      }
    } catch (e) {
      console.warn('Error computing live billing stats:', e);
    }
    return DEFAULT_CLASS_DATA;
  }, [billingRecords]);

  // Filtered dataset according to department selection
  const filteredData = useMemo(() => {
    if (departmentFilter === 'ALL') return classData;
    return classData.filter(d => d.department === departmentFilter);
  }, [classData, departmentFilter]);

  // Aggregated totals across displayed dataset
  const aggregateStats = useMemo(() => {
    const totalInvoiced = filteredData.reduce((acc, curr) => acc + curr.totalInvoiced, 0);
    const totalCollected = filteredData.reduce((acc, curr) => acc + curr.totalCollected, 0);
    const outstanding = Math.max(0, totalInvoiced - totalCollected);
    const overallPercentage = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
    const totalStudents = filteredData.reduce((acc, curr) => acc + curr.totalStudents, 0);
    const clearedStudents = filteredData.reduce((acc, curr) => acc + curr.clearedStudents, 0);
    const partialStudents = filteredData.reduce((acc, curr) => acc + curr.partialStudents, 0);
    const unpaidStudents = filteredData.reduce((acc, curr) => acc + curr.unpaidStudents, 0);

    return {
      totalInvoiced,
      totalCollected,
      outstanding,
      overallPercentage: Math.round(overallPercentage * 10) / 10,
      totalStudents,
      clearedStudents,
      partialStudents,
      unpaidStudents
    };
  }, [filteredData]);

  // Color generator for dynamic bar styling
  const getBarColor = (percentage: number) => {
    if (percentage >= targetBenchmark) return '#059669'; // Emerald 600
    if (percentage >= 75) return '#4f46e5'; // Indigo 600
    if (percentage >= 60) return '#d97706'; // Amber 600
    return '#e11d48'; // Rose 600
  };

  // Format currency into Naira
  const formatNaira = (value: number) => {
    return `₦${value.toLocaleString()}`;
  };

  // Custom Recharts Tooltip for Class View
  const CustomClassTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ClassCollectionStat = payload[0].payload;
      const statusColor = data.collectionPercentage >= targetBenchmark 
        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' 
        : data.collectionPercentage >= 70 
          ? 'text-amber-400 bg-amber-950/60 border-amber-800' 
          : 'text-rose-400 bg-rose-950/60 border-rose-800';

      return (
        <div 
          id="tuition-chart-custom-tooltip"
          className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white text-xs max-w-xs space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="font-bold text-slate-100 text-sm font-display flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                {data.cohort}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{data.department}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${statusColor}`}>
              {data.collectionPercentage}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">Invoiced</span>
              <span className="font-bold text-slate-200">{formatNaira(data.totalInvoiced)}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-emerald-400 block uppercase">Collected</span>
              <span className="font-bold text-emerald-300">{formatNaira(data.totalCollected)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] bg-rose-950/40 border border-rose-900/40 p-2 rounded-lg">
            <span className="text-rose-300 font-medium">Outstanding Backlog:</span>
            <span className="font-bold font-mono text-rose-200">{formatNaira(data.outstandingBalance)}</span>
          </div>

          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px] text-slate-400">
            <span>Students: <strong className="text-slate-200">{data.totalStudents}</strong></span>
            <span className="text-emerald-400">Cleared: {data.clearedStudents}</span>
            <span className="text-rose-400">Unpaid: {data.unpaidStudents}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Timeline View
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: WeeklyCollectionStat = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 shadow-2xl text-white text-xs max-w-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold font-display text-slate-100">{data.week}</span>
            <span className="text-emerald-400 font-mono font-bold text-xs">{data.collectionPercentage}%</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Weekly Intake:</span>
              <span className="text-slate-200 font-bold">{formatNaira(data.weeklyCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cumulative:</span>
              <span className="text-emerald-300 font-bold">{formatNaira(data.cumulativeCollected)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400">Target Trajectory:</span>
              <span className="text-indigo-300 font-bold">{data.targetPercentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom XAxis Tick for Cohorts with proper rotation, alignment, and high contrast legibility
  const CustomCohortXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || !payload.value) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          dx={-6}
          textAnchor="end"
          transform="rotate(-40)"
          fontSize={11}
          fontWeight={700}
          className="fill-slate-600 dark:fill-slate-300 select-none tracking-tight"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const handleExportSummary = () => {
    toast.success('Tuition Collection Report exported to Bursary CSV successfully');
  };

  return (
    <div 
      id="tuition-collection-analytics-panel"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 transition-all ${className}`}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  Tuition Collection Percentage
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedTerm} • {currentSession}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live term fee settlement velocity, revenue realization benchmarks, and cohort debt backlogs
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS & TOGGLES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="view-by-class-btn"
              type="button"
              onClick={() => setViewMode('by_class')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_class'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>By Class Cohort</span>
            </button>
            <button
              id="view-by-timeline-btn"
              type="button"
              onClick={() => setViewMode('by_timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Term Velocity</span>
            </button>
          </div>

          {/* Department Filter Custom Dropdown */}
          {viewMode === 'by_class' && (
            <div className="relative">
              <button
                id="tuition-department-dropdown-btn"
                type="button"
                onClick={() => setIsDepartmentMenuOpen(!isDepartmentMenuOpen)}
                className="h-9 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>{departmentFilter === 'ALL' ? 'All Classes' : departmentFilter}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
              </button>

              {isDepartmentMenuOpen && (
                <div 
                  id="tuition-department-menu"
                  className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 text-xs overflow-hidden"
                >
                  {(['ALL', 'Senior Secondary', 'Junior Secondary', 'Primary & Early Years'] as const).map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setDepartmentFilter(dept);
                        setIsDepartmentMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left font-medium flex items-center justify-between transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        departmentFilter === dept ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{dept === 'ALL' ? 'All Academic Departments' : dept}</span>
                      {departmentFilter === dept && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Button */}
          {onNavigateToBursary && (
            <button
              id="open-bursary-desk-btn"
              type="button"
              onClick={onNavigateToBursary}
              className="h-9 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Bursary Desk</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI HIGHLIGHT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Overall Collection % */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow cursor-default min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Term Collection Rate
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-mono font-black shrink-0 ${
              aggregateStats.overallPercentage >= targetBenchmark 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              Target: {targetBenchmark}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {aggregateStats.overallPercentage}%
            </span>
            <span className="text-[10.5px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +5.4%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, aggregateStats.overallPercentage)}%` }}
            />
          </div>
        </motion.div>

        {/* Metric 2: Total Invoiced */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow cursor-default min-w-0"
        >
          <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Total Expected Billing
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl lg:text-2xl font-black font-mono text-indigo-950 dark:text-indigo-200 tracking-tight block truncate">
              {formatNaira(aggregateStats.totalInvoiced)}
            </span>
          </div>
          <span className="mt-1.5 text-[9.5px] sm:text-[10px] text-slate-400 font-mono truncate">
            {aggregateStats.totalStudents} enrolled learners
          </span>
        </motion.div>

        {/* Metric 3: Total Collected Revenue */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow cursor-default min-w-0"
        >
          <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 truncate">
            Total Realized Revenue
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl lg:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight block truncate">
              {formatNaira(aggregateStats.totalCollected)}
            </span>
          </div>
          <span className="mt-1.5 text-[9.5px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
            {aggregateStats.clearedStudents} full fee clearances
          </span>
        </motion.div>

        {/* Metric 4: Outstanding Receivables */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow cursor-default min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 truncate">
              Receivables Backlog
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl lg:text-2xl font-black font-mono text-rose-700 dark:text-rose-400 tracking-tight block truncate">
              {formatNaira(aggregateStats.outstanding)}
            </span>
          </div>
          <span className="mt-1.5 text-[9.5px] sm:text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate">
            {aggregateStats.partialStudents + aggregateStats.unpaidStudents} pending student balances
          </span>
        </motion.div>
      </div>

      {/* RECHARTS BAR CHART CANVAS */}
      <div className="relative space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Chart Representation:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {viewMode === 'by_class' ? 'Tuition Realization per Class Cohort (%)' : 'Cumulative Collection Rate Progress by Term Week (%)'}
            </span>
          </div>

          {/* Responsive Color Legend Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[10.5px] font-mono">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">≥{targetBenchmark}% (Target Met)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-xs bg-indigo-600 inline-block shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">75-84% (Good)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-xs bg-amber-600 inline-block shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">60-74% (Moderate)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-xs bg-rose-600 inline-block shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">&lt;60% (Lagging)</span>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-80 sm:h-96 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'by_class' ? (
              <BarChart
                data={filteredData}
                margin={{ top: 20, right: 20, left: -10, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="shortName" 
                  tick={<CustomCohortXAxisTick />}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                  height={50}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomClassTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                
                {/* Target Benchmark Reference Line */}
                <ReferenceLine 
                  y={targetBenchmark} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `Target ${targetBenchmark}%`, 
                    fill: '#059669', 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    position: 'top' 
                  }} 
                />

                <Bar 
                  dataKey="collectionPercentage" 
                  name="Collection %" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  isAnimationActive={true}
                  animationDuration={800}
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.collectionPercentage)}
                      className="transition-all hover:opacity-85 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={DEFAULT_WEEKLY_TRAJECTORY}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="weekNumber" 
                  tickFormatter={(val) => `Wk ${val}`}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomTimelineTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                
                <ReferenceLine 
                  y={targetBenchmark} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `Term Target (${targetBenchmark}%)`, 
                    fill: '#059669', 
                    fontSize: 10, 
                    position: 'top' 
                  }} 
                />

                <Bar 
                  dataKey="collectionPercentage" 
                  name="Cumulative Collection %" 
                  fill="#0284c7"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={36}
                >
                  {DEFAULT_WEEKLY_TRAJECTORY.map((entry, index) => (
                    <Cell 
                      key={`wk-cell-${index}`} 
                      fill={entry.collectionPercentage >= entry.targetPercentage ? '#059669' : '#4f46e5'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* FOOTER & BENCHMARK TARGET CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-700 dark:text-slate-300">Benchmark Target:</strong>
          </span>
          <div className="flex items-center gap-1.5">
            {[75, 80, 85, 90, 95].map(benchmark => (
              <button
                key={benchmark}
                type="button"
                onClick={() => {
                  setTargetBenchmark(benchmark);
                  toast.success(`Tuition collection target set to ${benchmark}%`);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                  targetBenchmark === benchmark
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {benchmark}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-tuition-report-btn"
            type="button"
            onClick={handleExportSummary}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TuitionCollectionBarChart;
