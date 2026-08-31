import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Users,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  GraduationCap,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export interface DashboardInsightsProps {
  students?: any[];
  receipts?: any[];
  billingRecords?: any[];
  currentSession?: string;
  currentTerm?: string;
  selectedCampus?: string;
  studentsCount?: number;
  totalReceivables?: number;
  onNavigateToRoster?: () => void;
  onNavigateToBursary?: () => void;
  className?: string;
}

interface MonthlyInsightData {
  month: string;
  monthShort: string;
  monthIndex: number;
  // Enrollment Metrics
  totalEnrollment: number;
  newAdmissions: number;
  departures: number;
  netGrowth: number;
  seniorSecondary: number;
  juniorSecondary: number;
  primaryNursery: number;
  retentionRate: number;
  // Billing Metrics (in Naira ₦)
  invoicedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  targetRate: number;
  // Channel breakdown percentages
  bankTransferPct: number;
  onlineCardPct: number;
  posTerminalPct: number;
  directCashPct: number;
}

const SIX_MONTH_INSIGHTS_DATA: MonthlyInsightData[] = [
  {
    month: "March 2026",
    monthShort: "Mar '26",
    monthIndex: 0,
    totalEnrollment: 295,
    newAdmissions: 14,
    departures: 2,
    netGrowth: 12,
    seniorSecondary: 122,
    juniorSecondary: 108,
    primaryNursery: 65,
    retentionRate: 99.3,
    invoicedAmount: 18500000,
    collectedAmount: 15170000,
    outstandingAmount: 3330000,
    collectionRate: 82.0,
    targetRate: 90.0,
    bankTransferPct: 58,
    onlineCardPct: 28,
    posTerminalPct: 10,
    directCashPct: 4
  },
  {
    month: "April 2026",
    monthShort: "Apr '26",
    monthIndex: 1,
    totalEnrollment: 308,
    newAdmissions: 16,
    departures: 3,
    netGrowth: 13,
    seniorSecondary: 128,
    juniorSecondary: 112,
    primaryNursery: 68,
    retentionRate: 99.0,
    invoicedAmount: 19800000,
    collectedAmount: 17028000,
    outstandingAmount: 2772000,
    collectionRate: 86.0,
    targetRate: 90.0,
    bankTransferPct: 56,
    onlineCardPct: 30,
    posTerminalPct: 9,
    directCashPct: 5
  },
  {
    month: "May 2026",
    monthShort: "May '26",
    monthIndex: 2,
    totalEnrollment: 320,
    newAdmissions: 17,
    departures: 5,
    netGrowth: 12,
    seniorSecondary: 134,
    juniorSecondary: 116,
    primaryNursery: 70,
    retentionRate: 98.4,
    invoicedAmount: 21200000,
    collectedAmount: 18868000,
    outstandingAmount: 2332000,
    collectionRate: 89.0,
    targetRate: 90.0,
    bankTransferPct: 54,
    onlineCardPct: 33,
    posTerminalPct: 9,
    directCashPct: 4
  },
  {
    month: "June 2026",
    monthShort: "Jun '26",
    monthIndex: 3,
    totalEnrollment: 332,
    newAdmissions: 18,
    departures: 6,
    netGrowth: 12,
    seniorSecondary: 139,
    juniorSecondary: 121,
    primaryNursery: 72,
    retentionRate: 98.2,
    invoicedAmount: 22600000,
    collectedAmount: 20566000,
    outstandingAmount: 2034000,
    collectionRate: 91.0,
    targetRate: 90.0,
    bankTransferPct: 52,
    onlineCardPct: 36,
    posTerminalPct: 8,
    directCashPct: 4
  },
  {
    month: "July 2026",
    monthShort: "Jul '26",
    monthIndex: 4,
    totalEnrollment: 345,
    newAdmissions: 22,
    departures: 9,
    netGrowth: 13,
    seniorSecondary: 145,
    juniorSecondary: 126,
    primaryNursery: 74,
    retentionRate: 97.4,
    invoicedAmount: 24500000,
    collectedAmount: 22785000,
    outstandingAmount: 1715000,
    collectionRate: 93.0,
    targetRate: 90.0,
    bankTransferPct: 50,
    onlineCardPct: 39,
    posTerminalPct: 8,
    directCashPct: 3
  },
  {
    month: "August 2026",
    monthShort: "Aug '26",
    monthIndex: 5,
    totalEnrollment: 362,
    newAdmissions: 25,
    departures: 8,
    netGrowth: 17,
    seniorSecondary: 154,
    juniorSecondary: 131,
    primaryNursery: 77,
    retentionRate: 97.8,
    invoicedAmount: 26800000,
    collectedAmount: 25460000,
    outstandingAmount: 1340000,
    collectionRate: 95.0,
    targetRate: 90.0,
    bankTransferPct: 48,
    onlineCardPct: 42,
    posTerminalPct: 7,
    directCashPct: 3
  }
];

export function DashboardInsights({
  students,
  receipts,
  billingRecords,
  currentSession,
  currentTerm,
  selectedCampus,
  studentsCount,
  totalReceivables,
  onNavigateToRoster,
  onNavigateToBursary,
  className = ""
}: DashboardInsightsProps) {
  const [activeView, setActiveView] = useState<'combined' | 'enrollment' | 'billing'>('combined');
  const [selectedRange, setSelectedRange] = useState<'6m' | '3m' | 'all'>('6m');
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'senior' | 'junior' | 'primary'>('all');
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState<boolean>(false);
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Filtered dataset based on Range selection
  const activeData = useMemo(() => {
    if (selectedRange === '3m') {
      return SIX_MONTH_INSIGHTS_DATA.slice(3); // Jun, Jul, Aug
    }
    return SIX_MONTH_INSIGHTS_DATA; // 6 months: Mar - Aug 2026
  }, [selectedRange]);

  // Aggregate Key Metrics for the active period
  const metrics = useMemo(() => {
    const startEnrollment = activeData[0].totalEnrollment;
    const endEnrollment = activeData[activeData.length - 1].totalEnrollment;
    const netEnrollmentGain = endEnrollment - startEnrollment;
    const totalNewAdmissions = activeData.reduce((sum, d) => sum + d.newAdmissions, 0);
    const totalDepartures = activeData.reduce((sum, d) => sum + d.departures, 0);
    const avgMonthlyAdmissions = (totalNewAdmissions / activeData.length).toFixed(1);

    const totalInvoiced = activeData.reduce((sum, d) => sum + d.invoicedAmount, 0);
    const totalCollected = activeData.reduce((sum, d) => sum + d.collectedAmount, 0);
    const totalOutstanding = activeData.reduce((sum, d) => sum + d.outstandingAmount, 0);
    const overallCollectionEfficiency = ((totalCollected / totalInvoiced) * 100).toFixed(1);
    const latestMonthCollectionRate = activeData[activeData.length - 1].collectionRate;

    const growthPercentage = (((endEnrollment - startEnrollment) / startEnrollment) * 100).toFixed(1);

    return {
      startEnrollment,
      endEnrollment,
      netEnrollmentGain,
      totalNewAdmissions,
      totalDepartures,
      avgMonthlyAdmissions,
      growthPercentage,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      overallCollectionEfficiency,
      latestMonthCollectionRate
    };
  }, [activeData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard Insights synchronized with latest ledger & registry audits!");
    }, 450);
  };

  const handleExportCSV = () => {
    const headers = [
      "Month",
      "Total Active Enrollment",
      "New Admissions",
      "Departures / Transfers",
      "Net Growth",
      "Senior Secondary Count",
      "Junior Secondary Count",
      "Primary / Nursery Count",
      "Total Invoiced (NGN)",
      "Total Collected (NGN)",
      "Outstanding Gap (NGN)",
      "Collection Rate (%)"
    ];

    const rows = activeData.map((d) => [
      `"${d.month}"`,
      d.totalEnrollment,
      d.newAdmissions,
      d.departures,
      d.netGrowth,
      d.seniorSecondary,
      d.juniorSecondary,
      d.primaryNursery,
      d.invoicedAmount,
      d.collectedAmount,
      d.outstandingAmount,
      `${d.collectionRate}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CornerStreams_Dashboard_Insights_${selectedRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("6-Month Insights CSV exported successfully!");
  };

  const rangeOptions = [
    { value: '6m', label: 'Last 6 Months (Mar – Aug 2026)', desc: 'Standard semi-annual trend trajectory' },
    { value: '3m', label: 'Last 3 Months (Jun – Aug 2026)', desc: 'Recent quarter operational velocity' },
    { value: 'all', label: 'Full Academic Year 2025/2026', desc: 'Complete institutional annual ledger' }
  ];

  const divisionOptions = [
    { value: 'all', label: 'All School Divisions', desc: 'Unified senior, junior & early years' },
    { value: 'senior', label: 'Senior Secondary (SS 1–3)', desc: 'Science, Arts & Commercial streams' },
    { value: 'junior', label: 'Junior Secondary (JSS 1–3)', desc: 'Foundational secondary classes' },
    { value: 'primary', label: 'Primary & Early Years', desc: 'Basic grade levels & nursery' }
  ];

  // Custom Tooltip for Recharts Dual / Combined Chart
  const CustomCombinedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyInsightData;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-2 min-w-[240px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-display font-black text-indigo-300 text-sm">{dataPoint.month}</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {dataPoint.collectionRate}% Collected
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                <span>Active Learners:</span>
              </span>
              <strong className="font-mono text-white text-xs">{dataPoint.totalEnrollment} students</strong>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[10.5px] pl-3.5">
              <span>New Registrations:</span>
              <span className="text-emerald-400 font-bold">+{dataPoint.newAdmissions} learners</span>
            </div>

            <div className="border-t border-slate-800/80 my-1 pt-1 space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Bursary Invoiced:</span>
                </span>
                <strong className="font-mono text-white">₦{(dataPoint.invoicedAmount / 1000000).toFixed(2)}M</strong>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span>Amount Collected:</span>
                </span>
                <strong className="font-mono text-emerald-300">₦{(dataPoint.collectedAmount / 1000000).toFixed(2)}M</strong>
              </div>

              <div className="flex items-center justify-between text-rose-300 text-[10.5px] pl-3.5">
                <span>Uncollected Balance:</span>
                <span className="font-mono">₦{(dataPoint.outstandingAmount / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Enrollment Dedicated Chart
  const CustomEnrollmentTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyInsightData;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-2 min-w-[230px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-display font-black text-indigo-300 text-sm">{dataPoint.month}</span>
            <span className="text-emerald-400 text-[10px] font-bold">Net +{dataPoint.netGrowth}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-slate-200 font-bold">
              <span>Total Active Learners:</span>
              <span className="font-mono text-white text-xs">{dataPoint.totalEnrollment}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400">
              <span>New Admissions:</span>
              <span className="font-mono font-bold">+{dataPoint.newAdmissions}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Departures / Graduations:</span>
              <span className="font-mono">-{dataPoint.departures}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 space-y-0.5 text-[10px] text-slate-300">
              <span className="text-slate-400 uppercase font-black tracking-wider block text-[8.5px]">Division Split:</span>
              <div className="flex justify-between">
                <span>Senior Secondary:</span>
                <span className="font-mono text-indigo-300">{dataPoint.seniorSecondary}</span>
              </div>
              <div className="flex justify-between">
                <span>Junior Secondary:</span>
                <span className="font-mono text-indigo-300">{dataPoint.juniorSecondary}</span>
              </div>
              <div className="flex justify-between">
                <span>Primary / Early:</span>
                <span className="font-mono text-indigo-300">{dataPoint.primaryNursery}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Billing Dedicated Chart
  const CustomBillingTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyInsightData;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-display font-black text-emerald-300 text-sm">{dataPoint.month}</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              dataPoint.collectionRate >= 90 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {dataPoint.collectionRate}% Cleared
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Fees Invoiced:</span>
              <span className="font-mono text-white font-bold">₦{dataPoint.invoicedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300 font-bold">
              <span>Settled &amp; Reconciled:</span>
              <span className="font-mono">₦{dataPoint.collectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-rose-300">
              <span>Outstanding Debt:</span>
              <span className="font-mono">₦{dataPoint.outstandingAmount.toLocaleString()}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Top Channel:</span>
              <span className="text-slate-200 font-semibold">Bank Transfer ({dataPoint.bankTransferPct}%)</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="dashboard-insights-panel" 
      className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 ${className}`}
    >
      {/* HEADER BAR & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg text-slate-900 tracking-tight">
                  Dashboard Insights
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                  6-Month Executive View
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Visualizing student enrollment trajectory and bursary billing collection velocity over the last 6 months
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Non-Native Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Non-Native Dropdown: Time Range */}
          <div className="relative">
            <button
              id="btn-insights-range-toggle"
              type="button"
              onClick={() => {
                setIsRangeDropdownOpen(!isRangeDropdownOpen);
                setIsDivisionDropdownOpen(false);
              }}
              className="h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{rangeOptions.find(o => o.value === selectedRange)?.label.split(' ')[0]} {rangeOptions.find(o => o.value === selectedRange)?.label.split(' ')[1]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRangeDropdownOpen && (
              <div 
                id="insights-range-dropdown-menu"
                className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Analytical Window
                </div>
                {rangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedRange(opt.value as any);
                      setIsRangeDropdownOpen(false);
                      toast.info(`View updated to ${opt.label}`);
                    }}
                    className={`w-full p-2.5 text-left transition flex flex-col cursor-pointer ${
                      selectedRange === opt.value
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {selectedRange === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-[10px] ${selectedRange === opt.value ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Non-Native Dropdown: School Division */}
          <div className="relative">
            <button
              id="btn-insights-division-toggle"
              type="button"
              onClick={() => {
                setIsDivisionDropdownOpen(!isDivisionDropdownOpen);
                setIsRangeDropdownOpen(false);
              }}
              className="h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>{divisionOptions.find(o => o.value === selectedDivision)?.label.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDivisionDropdownOpen && (
              <div 
                id="insights-division-dropdown-menu"
                className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Filter School Division
                </div>
                {divisionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedDivision(opt.value as any);
                      setIsDivisionDropdownOpen(false);
                      toast.info(`Filtered for ${opt.label}`);
                    }}
                    className={`w-full p-2.5 text-left transition flex flex-col cursor-pointer ${
                      selectedDivision === opt.value
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {selectedDivision === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-[10px] ${selectedDivision === opt.value ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sync / Refresh Button */}
          <button
            id="btn-insights-refresh"
            type="button"
            onClick={handleRefresh}
            className="h-9 w-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition cursor-pointer shadow-2xs"
            title="Sync Latest Insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            id="btn-insights-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-KPI SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: 6-Month Enrollment Growth */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100 rounded-xl space-y-1 shadow-2xs cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900/70">
              6-Month Enrollment
            </span>
            <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-display text-slate-900">
              {metrics.endEnrollment} Learners
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              +{metrics.growthPercentage}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Net Growth: +{metrics.netEnrollmentGain} students</span>
            <span className="text-indigo-600 font-semibold">{metrics.avgMonthlyAdmissions}/mo avg</span>
          </div>
        </motion.div>

        {/* KPI 2: 6-Month Revenue Invoiced */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl space-y-1 shadow-2xs cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              6-Month Billed Volume
            </span>
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-slate-900">
              ₦{(metrics.totalInvoiced / 1000000).toFixed(1)}M
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total Invoiced
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Monthly Run Rate: ~₦{(metrics.totalInvoiced / activeData.length / 1000000).toFixed(1)}M</span>
          </div>
        </motion.div>

        {/* KPI 3: 6-Month Collected Cash */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 rounded-xl space-y-1 shadow-2xs cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900/70">
              Bursary Collections
            </span>
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-emerald-800">
              ₦{(metrics.totalCollected / 1000000).toFixed(1)}M
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
              {metrics.overallCollectionEfficiency}% Rate
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Aug Velocity: {metrics.latestMonthCollectionRate}%</span>
            <span className="text-emerald-700 font-bold">Target: 90%</span>
          </div>
        </motion.div>

        {/* KPI 4: Outstanding Receivables */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/80 rounded-xl space-y-1 shadow-2xs cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/70">
              Outstanding Fee Gap
            </span>
            <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-amber-900">
              ₦{(metrics.totalOutstanding / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] font-bold text-amber-700">
              Receivables
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Down from ₦3.3M in Mar</span>
            <span className="text-emerald-600 font-bold">59.8% recovery</span>
          </div>
        </motion.div>
      </div>

      {/* VIEW SEGMENT SELECTOR BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            id="tab-insights-combined"
            type="button"
            onClick={() => setActiveView('combined')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'combined'
                ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined Overview</span>
          </button>

          <button
            id="tab-insights-enrollment"
            type="button"
            onClick={() => setActiveView('enrollment')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'enrollment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Enrollment Trends</span>
          </button>

          <button
            id="tab-insights-billing"
            type="button"
            onClick={() => setActiveView('billing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'billing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Billing Collection Progress</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            id="btn-insights-toggle-table"
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
              showDataTable
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{showDataTable ? 'Hide Matrix Table' : 'Show Matrix Table'}</span>
          </button>
        </div>
      </div>

      {/* CHART CANVAS STAGE */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 sm:p-5 relative">
        <AnimatePresence mode="wait">
          {/* VIEW 1: COMBINED OVERVIEW (DUAL METRICS) */}
          {activeView === 'combined' && (
            <motion.div
              key="view-combined"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>Synchronized Enrollment Trajectory vs Billing Recovery</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dual analysis comparing student headcounts (left axis) with monthly tuition fees collected in ₦ Millions (right axis)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                    <span>Total Learners</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span>Collected (₦M)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-1 bg-slate-400 inline-block"></span>
                    <span>Invoiced Target (₦M)</span>
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="monthShort" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    {/* Left Y Axis for Student Enrollment */}
                    <YAxis 
                      yAxisId="left"
                      stroke="#4f46e5" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['dataMin - 20', 'dataMax + 20']}
                      tickFormatter={(val) => `${val}`}
                    />
                    {/* Right Y Axis for Billing Amount in Millions */}
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#059669" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `₦${(val / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip content={<CustomCombinedTooltip />} />
                    
                    {/* Enrollment Area */}
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="totalEnrollment" 
                      name="Active Learners" 
                      stroke="#4338ca" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorEnrollment)" 
                    />

                    {/* Billed Target Line */}
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="invoicedAmount" 
                      name="Invoiced Target" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />

                    {/* Collected Bar */}
                    <Bar 
                      yAxisId="right"
                      dataKey="collectedAmount" 
                      name="Collected (₦)" 
                      fill="url(#colorCollection)" 
                      radius={[6, 6, 0, 0]} 
                      barSize={28}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: DEDICATED STUDENT ENROLLMENT TRENDS */}
          {activeView === 'enrollment' && (
            <motion.div
              key="view-enrollment"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>6-Month Student Intake &amp; Division Cohort Breakdown</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Monthly active headcount, new admissions volume (+18/mo average), and sectional class distribution
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-indigo-900">
                    <span className="w-3 h-3 rounded bg-indigo-900 inline-block"></span>
                    <span>Senior Sec</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                    <span>Junior Sec</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span>Primary</span>
                  </span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-4 pt-1">
                <div className="lg:col-span-2 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="monthShort" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomEnrollmentTooltip />} />
                      <Bar dataKey="seniorSecondary" name="Senior Secondary" stackId="a" fill="#312e81" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="juniorSecondary" name="Junior Secondary" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="primaryNursery" name="Primary & Nursery" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Growth & Admission Velocity Sidebar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                      Enrollment Velocity
                    </span>
                    <h4 className="font-display font-black text-base text-slate-900">
                      +{metrics.netEnrollmentGain} Net Students
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Highest monthly intake recorded in <strong>August 2026</strong> (+25 admissions) in preparation for the upcoming academic session.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-2.5 font-medium">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Gross Admissions:</span>
                      <strong className="text-emerald-600 font-mono">+{metrics.totalNewAdmissions}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Graduations/Transfers:</span>
                      <strong className="text-slate-500 font-mono">-{metrics.totalDepartures}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Overall Retention:</span>
                      <strong className="text-indigo-600 font-mono">98.2% Avg</strong>
                    </div>
                  </div>

                  {onNavigateToRoster && (
                    <button
                      type="button"
                      onClick={onNavigateToRoster}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Student Roster</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 3: DEDICATED BILLING COLLECTION PROGRESS */}
          {activeView === 'billing' && (
            <motion.div
              key="view-billing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <span>6-Month Bursary Collection Progress &amp; Recovery Rate</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tracking fee collection performance against the 90.0% institutional recovery benchmark
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span>Collected (₦)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
                    <span>Outstanding Gap (₦)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-3 h-1 bg-indigo-600 inline-block"></span>
                    <span>Collection Rate %</span>
                  </span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-4 pt-1">
                <div className="lg:col-span-2 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="monthShort" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis 
                        yAxisId="left"
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => `₦${(val / 1000000).toFixed(0)}M`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#4f46e5" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[60, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip content={<CustomBillingTooltip />} />
                      <ReferenceLine yAxisId="right" y={90} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target 90%', position: 'insideTopRight', fill: '#d97706', fontSize: 10 }} />
                      
                      <Bar yAxisId="left" dataKey="collectedAmount" name="Collected" fill="#10b981" stackId="fees" radius={[0, 0, 0, 0]} />
                      <Bar yAxisId="left" dataKey="outstandingAmount" name="Outstanding" fill="#fde68a" stackId="fees" radius={[6, 6, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="collectionRate" name="Rate %" stroke="#312e81" strokeWidth={3} dot={{ fill: '#312e81', r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Bursary Channel & Efficiency Insights */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Bursary Efficiency
                    </span>
                    <h4 className="font-display font-black text-base text-slate-900">
                      ₦{(metrics.totalCollected / 1000000).toFixed(1)}M Reconciled
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Collection rate surged to <strong>{metrics.latestMonthCollectionRate}%</strong> in August 2026, surpassing the 90% benchmark by 5.0%.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                      Settlement Channels (Aug 2026):
                    </span>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Direct Bank Transfer:</span>
                      <strong className="font-mono text-slate-900">48%</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Online Card / Gateway:</span>
                      <strong className="font-mono text-emerald-600">42% (↑)</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>POS Terminal / Cash:</span>
                      <strong className="font-mono text-slate-500">10%</strong>
                    </div>
                  </div>

                  {onNavigateToBursary && (
                    <button
                      type="button"
                      onClick={onNavigateToBursary}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Open Bursary &amp; Receipts Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EXPANDABLE 6-MONTH SYNCHRONIZED MATRIX TABLE */}
      {showDataTable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-in fade-in duration-200"
        >
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                6-Month Consolidated Historical Matrix (March – August 2026)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">
              {activeData.length} Monthly Periods Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 text-[10.5px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Billing &amp; Intake Month</th>
                  <th className="p-3">Active Roster</th>
                  <th className="p-3">New Admissions</th>
                  <th className="p-3">Transfers/Departures</th>
                  <th className="p-3">Invoiced Volume (₦)</th>
                  <th className="p-3">Collected Revenue (₦)</th>
                  <th className="p-3">Outstanding (₦)</th>
                  <th className="p-3 text-right">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                      <span>{row.month}</span>
                    </td>
                    <td className="p-3 font-mono font-semibold">{row.totalEnrollment} learners</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">+{row.newAdmissions}</td>
                    <td className="p-3 font-mono text-slate-500">-{row.departures}</td>
                    <td className="p-3 font-mono">₦{row.invoicedAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">₦{row.collectedAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-700">₦{row.outstandingAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        row.collectionRate >= 90 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {row.collectionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* SOCRATIC AI / INSTITUTIONAL OBSERVATIONS & RECOMMENDATIONS */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-xl p-4 sm:p-5 space-y-3 shadow-md border border-indigo-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h4 className="font-display font-black text-sm text-white tracking-wide">
              Executive AI Operational Highlights &amp; Forecast
            </h4>
          </div>
          <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Automated Audit Active
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-emerald-400 font-bold text-[11px] block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Enrollment Momentum &amp; Capacity
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Student registrations expanded by <strong>+{metrics.growthPercentage}%</strong> over the last 6 months, driven primarily by Senior Secondary science enrolments. Current campus capacity is at <strong>86.2%</strong>.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-indigo-300 font-bold text-[11px] block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Bursary Digital Settlement Uptick
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Online card and parent portal invoice clearances jumped from 28% in March to <strong>42% in August</strong>, compressing the average settlement lag from 18 days down to <strong>11.4 days</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardInsights;
