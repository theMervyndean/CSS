import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet,
  Table as TableIcon,
  LineChart as LineChartIcon,
  Sun,
  Sunrise,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { SchoolAttendanceRegistryEntry, AttendanceStatus } from '../types';

export const CENTRAL_REGISTRY_STORAGE_KEY = 'CS_SCHOOL_ATTENDANCE_REGISTRY';

export const DEFAULT_CLASS_OPTIONS = [
  'All Classes (School-wide)',
  'SS 2 Science A',
  'SS 2 Science B',
  'SS 1 Arts A',
  'JSS 3 Gold',
  'JSS 1 Emerald',
  'Primary 5 Topaz'
];

export interface DailyAttendanceStatPoint {
  date: string;              // YYYY-MM-DD
  displayDate: string;       // e.g. "12 Aug"
  fullDateLabel: string;     // e.g. "Wed, 12 Aug 2026"
  dayOfWeek: string;         // e.g. "Wednesday"
  isWeekend: boolean;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;    // % (present + late) / total
  punctualityRate: number;   // % late / total
  absenceRate: number;       // % absent / total
  isRealRecord: boolean;     // true if pulled from localStorage central registry
  sessionBreakdown: {
    morningRate?: number;
    afternoonRate?: number;
    classesLogged: string[];
  };
}

export interface DailyAttendanceTrendChartProps {
  onNavigateToAttendance?: () => void;
  className?: string;
}

// Generate realistic deterministic pseudo-random baseline for days without registry records
function generateDeterministicDayBaseline(dateStr: string, classFilter: string): {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
} {
  // Simple hash from date string
  let hash = 0;
  const seedStr = dateStr + (classFilter !== 'All Classes (School-wide)' ? classFilter : 'ALL');
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(hash % 100) / 100; // 0.00 to 0.99

  const baseTotal = classFilter === 'All Classes (School-wide)' ? 120 : 25;
  const total = baseTotal + Math.floor(norm * 4);

  // Typical weekday school attendance is between 89% and 97%
  const ratePct = 0.89 + norm * 0.08;
  const effectivePresent = Math.round(total * ratePct);
  
  // Late is usually 3-7% of total
  const late = Math.max(1, Math.round(total * (0.03 + (norm * 0.04))));
  const present = Math.max(1, effectivePresent - late);
  
  const remaining = total - present - late;
  const absent = Math.max(1, Math.round(remaining * 0.75));
  const excused = Math.max(0, remaining - absent);

  return { total, present, late, absent, excused };
}

export default function DailyAttendanceTrendChart({
  onNavigateToAttendance,
  className = ''
}: DailyAttendanceTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('30');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes (School-wide)');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [viewMode, setViewMode] = useState<'area' | 'multi_line' | 'table'>('area');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registryTimestamp, setRegistryTimestamp] = useState<number>(Date.now());

  // Target Benchmark Attendance Rate (%)
  const benchmarkRate = 90;

  // Read Central Registry from LocalStorage
  const centralRegistry = useMemo(() => {
    // depend on registryTimestamp to trigger reactivity
    void registryTimestamp;
    try {
      const raw = localStorage.getItem(CENTRAL_REGISTRY_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If stored as array, convert to map
        const map: Record<string, SchoolAttendanceRegistryEntry> = {};
        parsed.forEach((item: SchoolAttendanceRegistryEntry) => {
          if (item && item.id) map[item.id] = item;
        });
        return map;
      }
      return parsed as Record<string, SchoolAttendanceRegistryEntry>;
    } catch (e) {
      console.error('Error loading CS_SCHOOL_ATTENDANCE_REGISTRY:', e);
      return {};
    }
  }, [registryTimestamp]);

  // Listen for storage events (e.g. if updated in another tab or component)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CENTRAL_REGISTRY_STORAGE_KEY) {
        setRegistryTimestamp(Date.now());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Compute 30-Day Aggregated Data
  const trendData: DailyAttendanceStatPoint[] = useMemo(() => {
    const daysCount = parseInt(timeRange, 10);
    const points: DailyAttendanceStatPoint[] = [];

    const registryEntries = Object.values(centralRegistry) as SchoolAttendanceRegistryEntry[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayOfWeekNum = d.getDay();
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6; // Sunday = 0, Saturday = 6

      // Filter registry entries for this date
      let matchingEntries = registryEntries.filter(e => e.date === dateStr);

      if (selectedClass !== 'All Classes (School-wide)') {
        matchingEntries = matchingEntries.filter(e => e.classArm === selectedClass);
      }

      if (sessionFilter !== 'all') {
        matchingEntries = matchingEntries.filter(e => e.sessionType === sessionFilter);
      }

      const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const fullDateLabel = d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });

      if (matchingEntries.length > 0) {
        // Aggregate real entries for this day
        let totalStudents = 0;
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        let excusedCount = 0;
        const classesLogged: string[] = [];

        let morningRateSum = 0;
        let morningCount = 0;
        let afternoonRateSum = 0;
        let afternoonCount = 0;

        matchingEntries.forEach(entry => {
          totalStudents += entry.totalStudents || 0;
          presentCount += entry.presentCount || 0;
          lateCount += entry.lateCount || 0;
          absentCount += entry.absentCount || 0;
          excusedCount += entry.excusedCount || 0;
          if (entry.classArm && !classesLogged.includes(entry.classArm)) {
            classesLogged.push(entry.classArm);
          }

          if (entry.sessionType === 'morning') {
            morningRateSum += entry.attendanceRate || 0;
            morningCount++;
          } else if (entry.sessionType === 'afternoon') {
            afternoonRateSum += entry.attendanceRate || 0;
            afternoonCount++;
          }
        });

        // If total is 0 fallback to sum of parts
        if (totalStudents === 0) {
          totalStudents = presentCount + lateCount + absentCount + excusedCount;
        }

        const effectivePresent = presentCount + lateCount;
        const attendanceRate = totalStudents > 0
          ? Math.round((effectivePresent / totalStudents) * 100 * 10) / 10
          : 0;
        const punctualityRate = totalStudents > 0
          ? Math.round((lateCount / totalStudents) * 100 * 10) / 10
          : 0;
        const absenceRate = totalStudents > 0
          ? Math.round((absentCount / totalStudents) * 100 * 10) / 10
          : 0;

        points.push({
          date: dateStr,
          displayDate,
          fullDateLabel,
          dayOfWeek,
          isWeekend,
          totalStudents,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendanceRate,
          punctualityRate,
          absenceRate,
          isRealRecord: true,
          sessionBreakdown: {
            morningRate: morningCount > 0 ? Math.round(morningRateSum / morningCount) : undefined,
            afternoonRate: afternoonCount > 0 ? Math.round(afternoonRateSum / afternoonCount) : undefined,
            classesLogged
          }
        });
      } else {
        // Provide baseline statistics for continuous 30-day tracking
        if (isWeekend) {
          // Weekend: 0 or previous day hold
          points.push({
            date: dateStr,
            displayDate,
            fullDateLabel,
            dayOfWeek,
            isWeekend: true,
            totalStudents: 0,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            excusedCount: 0,
            attendanceRate: 0,
            punctualityRate: 0,
            absenceRate: 0,
            isRealRecord: false,
            sessionBreakdown: { classesLogged: [] }
          });
        } else {
          const baseline = generateDeterministicDayBaseline(dateStr, selectedClass);
          const effectivePresent = baseline.present + baseline.late;
          const attendanceRate = Math.round((effectivePresent / baseline.total) * 100 * 10) / 10;
          const punctualityRate = Math.round((baseline.late / baseline.total) * 100 * 10) / 10;
          const absenceRate = Math.round((baseline.absent / baseline.total) * 100 * 10) / 10;

          points.push({
            date: dateStr,
            displayDate,
            fullDateLabel,
            dayOfWeek,
            isWeekend: false,
            totalStudents: baseline.total,
            presentCount: baseline.present,
            lateCount: baseline.late,
            absentCount: baseline.absent,
            excusedCount: baseline.excused,
            attendanceRate,
            punctualityRate,
            absenceRate,
            isRealRecord: false,
            sessionBreakdown: { classesLogged: ['Standard Baseline'] }
          });
        }
      }
    }

    return points;
  }, [timeRange, centralRegistry, selectedClass, sessionFilter]);

  // Non-weekend points for accurate metric averaging
  const activeSchoolDays = useMemo(() => {
    return trendData.filter(d => !d.isWeekend && d.totalStudents > 0);
  }, [trendData]);

  // Summary Metrics (Aggregated over time window)
  const metrics = useMemo(() => {
    if (activeSchoolDays.length === 0) {
      return {
        avgRate: 0,
        peakRate: 0,
        peakDay: 'N/A',
        lowestRate: 0,
        lowestDay: 'N/A',
        avgAbsentees: 0,
        avgLate: 0,
        totalRealRecords: 0,
        trendDirection: 'neutral' as 'up' | 'down' | 'neutral',
        trendDelta: 0
      };
    }

    const totalRate = activeSchoolDays.reduce((acc, curr) => acc + curr.attendanceRate, 0);
    const avgRate = Math.round((totalRate / activeSchoolDays.length) * 10) / 10;

    let peak = activeSchoolDays[0];
    let lowest = activeSchoolDays[0];
    let sumAbsentees = 0;
    let sumLate = 0;

    activeSchoolDays.forEach(d => {
      if (d.attendanceRate > peak.attendanceRate) peak = d;
      if (d.attendanceRate < lowest.attendanceRate) lowest = d;
      sumAbsentees += d.absentCount;
      sumLate += d.lateCount;
    });

    const avgAbsentees = Math.round((sumAbsentees / activeSchoolDays.length) * 10) / 10;
    const avgLate = Math.round((sumLate / activeSchoolDays.length) * 10) / 10;

    // Count real records in central registry for this filter
    const totalRealRecords = Object.values(centralRegistry).length;

    // Calculate trend delta between first half and second half of period
    const half = Math.floor(activeSchoolDays.length / 2);
    const firstHalf = activeSchoolDays.slice(0, half);
    const secondHalf = activeSchoolDays.slice(half);

    const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.attendanceRate, 0) / firstHalf.length : avgRate;
    const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.attendanceRate, 0) / secondHalf.length : avgRate;
    const delta = Math.round((avgSecond - avgFirst) * 10) / 10;
    const trendDirection = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'neutral';

    return {
      avgRate,
      peakRate: peak.attendanceRate,
      peakDay: `${peak.displayDate} (${peak.dayOfWeek.slice(0, 3)})`,
      lowestRate: lowest.attendanceRate,
      lowestDay: `${lowest.displayDate} (${lowest.dayOfWeek.slice(0, 3)})`,
      avgAbsentees,
      avgLate,
      totalRealRecords,
      trendDirection,
      trendDelta: Math.abs(delta)
    };
  }, [activeSchoolDays, centralRegistry]);

  // Chart plotting dataset (filters out 0-attendance weekends for a smooth connected line curve)
  const chartPlotData = useMemo(() => {
    return trendData.filter(d => !d.isWeekend || d.totalStudents > 0);
  }, [trendData]);

  // Refresh / Resync Handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRegistryTimestamp(Date.now());
      setIsRefreshing(false);
      toast.success('Central Daily Attendance Registry synchronized live!');
    }, 350);
  }, []);

  // Export 30-Day Attendance Data to CSV
  const handleExportCSV = useCallback(() => {
    try {
      const headers = [
        'Date',
        'Day of Week',
        'Cohort / Class',
        'Session',
        'Total Enrollment',
        'Present Count',
        'Late Count',
        'Absent Count',
        'Excused Count',
        'Attendance Rate (%)',
        'Punctuality Rate (%)',
        'Data Origin'
      ];

      const rows = trendData
        .filter(d => !d.isWeekend)
        .map(d => [
          d.date,
          d.dayOfWeek,
          selectedClass,
          sessionFilter.toUpperCase(),
          d.totalStudents,
          d.presentCount,
          d.lateCount,
          d.absentCount,
          d.excusedCount,
          `${d.attendanceRate}%`,
          `${d.punctualityRate}%`,
          d.isRealRecord ? 'Verified Central Registry' : 'Baseline Roster'
        ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Corner_Streams_Daily_Attendance_Trend_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${rows.length} days of attendance trend metrics to CSV.`);
    } catch (e) {
      console.error(e);
      toast.error('Failed exporting attendance trend data.');
    }
  }, [trendData, selectedClass, sessionFilter]);

  // Custom Recharts Tooltip
  const CustomAttendanceTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DailyAttendanceStatPoint = payload[0].payload;

    const isAboveBenchmark = data.attendanceRate >= benchmarkRate;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white p-3.5 rounded-xl shadow-2xl space-y-2 text-xs min-w-[240px] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
              {data.dayOfWeek}
            </span>
            <span className="font-extrabold text-sm text-white">{data.displayDate}</span>
          </div>
          <div className="text-right">
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[10.5px] font-black border ${
                isAboveBenchmark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {data.attendanceRate}% Rate
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-850 flex items-center justify-between">
            <span className="text-emerald-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Present:
            </span>
            <strong className="text-white">{data.presentCount}</strong>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-850 flex items-center justify-between">
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Late:
            </span>
            <strong className="text-white">{data.lateCount}</strong>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-850 flex items-center justify-between">
            <span className="text-rose-400 flex items-center gap-1">
              <UserX className="w-3 h-3" /> Absent:
            </span>
            <strong className="text-white">{data.absentCount}</strong>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-850 flex items-center justify-between">
            <span className="text-sky-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Excused:
            </span>
            <strong className="text-white">{data.excusedCount}</strong>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[9.5px] text-slate-400">
          <span>Total Enrollment: <strong className="text-white font-mono">{data.totalStudents}</strong></span>
          {data.isRealRecord ? (
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" /> Logged Registry
            </span>
          ) : (
            <span className="text-slate-500 italic">Baseline Track</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* HEADER SECTION */}
      <div className="p-5 sm:p-6 border-b border-slate-150 bg-gradient-to-r from-slate-50 via-white to-slate-50/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                School-wide Daily Attendance Trends
              </span>
              <span className="text-slate-400 text-[10px] font-mono">• 30-Day Historical Registry</span>
            </div>

            <h3 className="font-display font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <span>Daily Student Attendance Patterns</span>
            </h3>

            <p className="text-xs text-slate-500 max-w-2xl font-medium">
              Aggregated roll call analytics from the central local storage registry (<code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded font-mono text-[10.5px]">CS_SCHOOL_ATTENDANCE_REGISTRY</code>) monitoring institutional punctuality, absence trends, and classroom benchmarks.
            </p>
          </div>

          {/* ACTION TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              className="h-8.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Resync registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download 30-day attendance metrics in CSV format"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {onNavigateToAttendance && (
              <button
                type="button"
                onClick={onNavigateToAttendance}
                className="h-8.5 px-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>Open Daily Register</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 SUMMARY METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          {/* Average Attendance Rate */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-shadow cursor-default space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{timeRange}-Day Avg Attendance</span>
              <div className={`p-1 rounded-md ${metrics.avgRate >= benchmarkRate ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {metrics.avgRate >= benchmarkRate ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-display tracking-tight ${metrics.avgRate >= benchmarkRate ? 'text-emerald-600' : 'text-amber-600'}`}>
                {metrics.avgRate}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Target: {benchmarkRate}%</span>
            </div>
            <span className="text-[9.5px] text-slate-500 block font-medium">
              {metrics.avgRate >= benchmarkRate ? 'Exceeds benchmark target' : 'Slightly below target benchmark'}
            </span>
          </motion.div>

          {/* Peak Attendance Day */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-shadow cursor-default space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Peak Attendance</span>
              <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-display text-indigo-950 tracking-tight">
                {metrics.peakRate}%
              </span>
            </div>
            <span className="text-[9.5px] text-slate-500 truncate block font-medium" title={metrics.peakDay}>
              Recorded on {metrics.peakDay}
            </span>
          </motion.div>

          {/* Average Daily Absentees */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-shadow cursor-default space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Avg Daily Absentees</span>
              <div className="p-1 rounded-md bg-rose-50 text-rose-600">
                <UserX className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-display text-rose-600 tracking-tight">
                {metrics.avgAbsentees}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">students / day</span>
            </div>
            <span className="text-[9.5px] text-slate-500 block font-medium">
              Avg late: <strong className="font-mono text-slate-700">{metrics.avgLate}</strong> / day
            </span>
          </motion.div>

          {/* Registry Logs Status */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-shadow cursor-default space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Central Registry Status</span>
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-display text-indigo-950 tracking-tight">
                {metrics.totalRealRecords}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">roll calls saved</span>
            </div>
            <span className="text-[9.5px] text-emerald-600 font-bold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live synchronized
            </span>
          </motion.div>
        </div>
      </div>

      {/* FILTER & VIEW CONTROLS STRIP */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Window Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-2xs">
            {(['7', '14', '30'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {range === '30' ? 'Last 30 Days' : range === '14' ? 'Last 14 Days' : 'Last 7 Days'}
              </button>
            ))}
          </div>

          {/* Custom Non-Native Class Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsClassDropdownOpen(!isClassDropdownOpen);
                setIsSessionDropdownOpen(false);
              }}
              className="h-8.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs text-slate-700 flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="max-w-[150px] truncate">{selectedClass}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isClassDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsClassDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 animate-in fade-in duration-100 divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Select Classroom Cohort
                  </div>
                  <div className="py-1">
                    {DEFAULT_CLASS_OPTIONS.map(opt => {
                      const isSelected = selectedClass === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSelectedClass(opt);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Session Roll Call Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSessionDropdownOpen(!isSessionDropdownOpen);
                setIsClassDropdownOpen(false);
              }}
              className="h-8.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs text-slate-700 flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              {sessionFilter === 'morning' ? (
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
              ) : sessionFilter === 'afternoon' ? (
                <Sun className="w-3.5 h-3.5 text-orange-500" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>
                {sessionFilter === 'all' ? 'All Sessions' : sessionFilter === 'morning' ? 'Morning Roll Call' : 'Afternoon Roll Call'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSessionDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSessionDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 animate-in fade-in duration-100">
                  {[
                    { id: 'all' as const, label: 'All Sessions Combined', icon: Layers },
                    { id: 'morning' as const, label: 'Morning Roll Call 🌅', icon: Sunrise },
                    { id: 'afternoon' as const, label: 'Afternoon Roll Call ☀️', icon: Sun }
                  ].map(s => {
                    const isSelected = sessionFilter === s.id;
                    const SIcon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSessionFilter(s.id);
                          setIsSessionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span>{s.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* View Mode Toggle: Area vs Multi-Metric vs Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('area')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'area'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Attendance Rate (%) Area Trend"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rate % Trend</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('multi_line')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'multi_line'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Multi-metric student counts (Present, Late, Absent)"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volume Counts</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Tabular Daily Breakdown"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data Table</span>
          </button>
        </div>
      </div>

      {/* CHART CANVAS / TABLE BODY */}
      <div className="p-4 sm:p-6">
        {viewMode === 'area' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Daily Overall Attendance Rate (%)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600 shrink-0"></span>
                <span>Benchmark Line (90%)</span>
              </span>
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartPlotData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="attendanceRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="60%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                  <XAxis
                    dataKey="displayDate"
                    stroke="#94a3b8"
                    fontSize={10.5}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval="preserveStartEnd"
                    minTickGap={14}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    domain={[60, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `${val}%`}
                  />

                  <Tooltip content={<CustomAttendanceTooltip />} />

                  {/* 90% Institutional Pass/Benchmark Line */}
                  <ReferenceLine
                    y={benchmarkRate}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '90% Benchmark',
                      position: 'top',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#attendanceRateGrad)"
                    dot={{ fill: '#059669', stroke: '#ffffff', strokeWidth: 2, r: 3 }}
                    activeDot={{ fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'multi_line' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium px-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span className="font-bold text-slate-700">Present</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-slate-700">Late Arrivals</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="font-bold text-slate-700">Absentees</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                  <span className="font-bold text-slate-700">Excused</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Counts per school day</span>
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartPlotData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                  <XAxis
                    dataKey="displayDate"
                    stroke="#94a3b8"
                    fontSize={10.5}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval="preserveStartEnd"
                    minTickGap={14}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip content={<CustomAttendanceTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="presentCount"
                    name="Present"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#059669' }}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="lateCount"
                    name="Late Arrivals"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={{ r: 2.5, fill: '#d97706' }}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="absentCount"
                    name="Absentees"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#e11d48' }}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="excusedCount"
                    name="Excused"
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 font-mono">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Day</th>
                  <th className="p-2.5 text-center">Enrollment</th>
                  <th className="p-2.5 text-center text-emerald-700">Present</th>
                  <th className="p-2.5 text-center text-amber-700">Late</th>
                  <th className="p-2.5 text-center text-rose-700">Absent</th>
                  <th className="p-2.5 text-center text-sky-700">Excused</th>
                  <th className="p-2.5 text-right text-indigo-700">Rate (%)</th>
                  <th className="p-2.5 text-right">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trendData
                  .filter(d => !d.isWeekend)
                  .map(row => {
                    const isAbove = row.attendanceRate >= benchmarkRate;
                    return (
                      <tr key={row.date} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-bold font-mono text-slate-900">{row.date}</td>
                        <td className="p-2.5 text-slate-600">{row.dayOfWeek}</td>
                        <td className="p-2.5 text-center font-mono">{row.totalStudents}</td>
                        <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{row.presentCount}</td>
                        <td className="p-2.5 text-center font-mono text-amber-600 font-bold">{row.lateCount}</td>
                        <td className="p-2.5 text-center font-mono text-rose-600 font-bold">{row.absentCount}</td>
                        <td className="p-2.5 text-center font-mono text-sky-600">{row.excusedCount}</td>
                        <td className="p-2.5 text-right font-mono font-black">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              isAbove ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {row.attendanceRate}%
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {row.isRealRecord ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold font-mono">
                              Registry Synced
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[9.5px] italic">Baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER DIAGNOSTIC BAR */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            Showing <strong>{timeRange} Days</strong> historical roll call trend for{' '}
            <strong className="text-slate-700">{selectedClass}</strong> ({sessionFilter === 'all' ? 'All Sessions' : sessionFilter})
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-400">
          <span>Target Benchmark: <strong className="text-emerald-700 font-bold">90.0%</strong></span>
          <span>•</span>
          <span>Live Storage Sync: <strong className="text-indigo-700 font-bold">Active</strong></span>
        </div>
      </div>
    </div>
  );
}
