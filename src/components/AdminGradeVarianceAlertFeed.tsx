import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  X, 
  FileText, 
  RefreshCw,
  Bell,
  Check,
  User,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export interface GradeVarianceAlert {
  id: string;
  teacherName: string;
  teacherPhoto?: string;
  subject: string;
  className: string;
  anomalyType: string;
  severity: 'critical' | 'warning' | 'info';
  stdDev: number; // Standard deviation %
  classAverage: number;
  classSize: number;
  gradeSpread: string;
  description: string;
  recommendation: string;
  status: 'pending' | 'under_review' | 'resolved';
  timestamp: string;
  scoreDistribution: { label: string; count: number; color: string }[];
}

const INITIAL_VARIANCE_ALERTS: GradeVarianceAlert[] = [
  {
    id: "al-101",
    teacherName: "Mr. Chidi Okafor",
    teacherPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    subject: "Mathematics",
    className: "SS 1 Gold",
    anomalyType: "Extreme Grade Variance (Bimodal Distribution)",
    severity: "critical",
    stdDev: 28.6,
    classAverage: 52.4,
    classSize: 34,
    gradeSpread: "12% - 98%",
    description: "Bimodal score clustering detected in 1st Term CA. 12 students scored >90% while 18 students scored <30%, indicating a severe gap in foundational algebra concepts or ambiguous test keys.",
    recommendation: "Conduct item discrimination analysis on Question Nos. 4-12 and verify scoring rubric consistency with subject head.",
    status: "pending",
    timestamp: "Today, 08:15 AM",
    scoreDistribution: [
      { label: "0-39% (Fail)", count: 12, color: "bg-rose-500" },
      { label: "40-59% (Pass)", count: 3, color: "bg-amber-400" },
      { label: "60-79% (Credit)", count: 5, color: "bg-teal-400" },
      { label: "80-100% (Distinction)", count: 14, color: "bg-indigo-600" }
    ]
  },
  {
    id: "al-102",
    teacherName: "Mrs. Grace Danjuma",
    teacherPhoto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
    subject: "English Language",
    className: "SS 3 Arts",
    anomalyType: "Compressed Subjective Grading (Low Variance)",
    severity: "warning",
    stdDev: 6.2,
    classAverage: 44.8,
    classSize: 28,
    gradeSpread: "38% - 51%",
    description: "94% of essay marks are tightly clustered between 42% and 48%. Low variance suggests non-differentiating essay scoring rubrics or template marking.",
    recommendation: "Review essay marking guidelines and audit 5 random essay scripts against WAEC/NECO marking schemes.",
    status: "pending",
    timestamp: "Yesterday, 04:30 PM",
    scoreDistribution: [
      { label: "0-39% (Fail)", count: 2, color: "bg-rose-500" },
      { label: "40-59% (Pass)", count: 25, color: "bg-amber-400" },
      { label: "60-79% (Credit)", count: 1, color: "bg-teal-400" },
      { label: "80-100% (Distinction)", count: 0, color: "bg-indigo-600" }
    ]
  },
  {
    id: "al-103",
    teacherName: "Dr. Emeka Nwosu",
    teacherPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    subject: "Chemistry",
    className: "SS 2 Science",
    anomalyType: "Grade Inflation Anomaly (+34% Jump)",
    severity: "warning",
    stdDev: 22.1,
    classAverage: 86.5,
    classSize: 31,
    gradeSpread: "62% - 100%",
    description: "Class term average surged to 86.5% (+34% vs prior term baseline) without matching improvement in proctored CBT diagnostic tests.",
    recommendation: "Cross-examine Continuous Assessment paper marks against anti-cheat CBT logs to eliminate unverified mark additions.",
    status: "under_review",
    timestamp: "2 days ago",
    scoreDistribution: [
      { label: "0-39% (Fail)", count: 0, color: "bg-rose-500" },
      { label: "40-59% (Pass)", count: 2, color: "bg-amber-400" },
      { label: "60-79% (Credit)", count: 7, color: "bg-teal-400" },
      { label: "80-100% (Distinction)", count: 22, color: "bg-indigo-600" }
    ]
  },
  {
    id: "al-104",
    teacherName: "Mr. Samuel Balogun",
    teacherPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120",
    subject: "ICT / Computer",
    className: "JSS 3 Alpha",
    anomalyType: "Practical vs Theory Disparity Variance",
    severity: "info",
    stdDev: 25.8,
    classAverage: 61.2,
    classSize: 40,
    gradeSpread: "24% - 94%",
    description: "Wide split between practical lab exam scores (88% avg) and paper theory CA submissions (32% avg). Students excel in hands-on tasks but struggle in theory.",
    recommendation: "Request curriculum alignment focus on theoretical computer terminology and revision exercises.",
    status: "resolved",
    timestamp: "3 days ago",
    scoreDistribution: [
      { label: "0-39% (Fail)", count: 8, color: "bg-rose-500" },
      { label: "40-59% (Pass)", count: 12, color: "bg-amber-400" },
      { label: "60-79% (Credit)", count: 11, color: "bg-teal-400" },
      { label: "80-100% (Distinction)", count: 9, color: "bg-indigo-600" }
    ]
  }
];

export const AdminGradeVarianceAlertFeed: React.FC = () => {
  const [alerts, setAlerts] = useState<GradeVarianceAlert[]>(() => {
    try {
      const saved = localStorage.getItem("CS_ADMIN_GRADE_VARIANCE_ALERTS");
      return saved ? JSON.parse(saved) : INITIAL_VARIANCE_ALERTS;
    } catch {
      return INITIAL_VARIANCE_ALERTS;
    }
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'critical' | 'warning' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<GradeVarianceAlert | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [reviewNoteAutoSave, setReviewNoteAutoSave] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Load draft review note when selectedAlert changes
  React.useEffect(() => {
    if (!selectedAlert) {
      setReviewNote('');
      setReviewNoteAutoSave('idle');
      return;
    }
    try {
      const drafts = JSON.parse(localStorage.getItem("CS_VARIANCE_REVIEW_DRAFTS") || "{}");
      if (drafts[selectedAlert.id]) {
        setReviewNote(drafts[selectedAlert.id]);
      } else {
        setReviewNote('');
      }
    } catch (e) {
      setReviewNote('');
    }
  }, [selectedAlert]);

  // Debounced auto-save for reviewNote
  React.useEffect(() => {
    if (!selectedAlert || !reviewNote.trim()) {
      setReviewNoteAutoSave('idle');
      return;
    }

    setReviewNoteAutoSave('saving');
    const timer = setTimeout(() => {
      try {
        const drafts = JSON.parse(localStorage.getItem("CS_VARIANCE_REVIEW_DRAFTS") || "{}");
        drafts[selectedAlert.id] = reviewNote;
        localStorage.setItem("CS_VARIANCE_REVIEW_DRAFTS", JSON.stringify(drafts));
        setReviewNoteAutoSave('saved');
      } catch (e) {
        console.error("Auto-save review note error:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [reviewNote, selectedAlert]);

  const saveAlerts = (newAlerts: GradeVarianceAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("CS_ADMIN_GRADE_VARIANCE_ALERTS", JSON.stringify(newAlerts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunStatisticalAudit = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success("⚡ Live Grade Variance Scan Completed!", {
        description: "Scanned 12 classes & 450+ student records. 4 active variance flags logged."
      });
    }, 900);
  };

  const handleUpdateStatus = (alertId: string, newStatus: 'pending' | 'under_review' | 'resolved') => {
    const updated = alerts.map(a => a.id === alertId ? { ...a, status: newStatus } : a);
    saveAlerts(updated);

    const targetAlert = alerts.find(a => a.id === alertId);
    if (newStatus === 'resolved') {
      toast.success(`✅ Class audit for ${targetAlert?.teacherName} (${targetAlert?.subject}) marked as Resolved!`, {
        description: "Audit entry logged into school compliance register."
      });
    } else if (newStatus === 'under_review') {
      toast.info(`🔎 Manual review initiated for ${targetAlert?.teacherName} (${targetAlert?.className})`, {
        description: "Notification sent to teacher's portal."
      });
    }
    if (selectedAlert?.id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    }
  };

  const handleSendAuditDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    if (!reviewNote.trim()) {
      toast.error("Please enter review feedback or instructions for the teacher.");
      return;
    }

    toast.success(`📩 Review Directive dispatched to ${selectedAlert.teacherName}`, {
      description: `Instruction: "${reviewNote}"`
    });

    handleUpdateStatus(selectedAlert.id, 'under_review');
    try {
      const drafts = JSON.parse(localStorage.getItem("CS_VARIANCE_REVIEW_DRAFTS") || "{}");
      delete drafts[selectedAlert.id];
      localStorage.setItem("CS_VARIANCE_REVIEW_DRAFTS", JSON.stringify(drafts));
    } catch (e) {}
    setReviewNote('');
  };

  // Filter logic
  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.anomalyType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return a.status === 'pending';
    if (activeFilter === 'resolved') return a.status === 'resolved';
    if (activeFilter === 'critical') return a.severity === 'critical';
    if (activeFilter === 'warning') return a.severity === 'warning';
    return true;
  });

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base tracking-tight">
              Admin Alert Feed: Assessment Grade Variance Monitor
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black tracking-wider uppercase animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Automated statistical anomaly detection flagging high grade variance, standard deviation skews, and subjective marking inconsistencies across subject teachers.
          </p>
        </div>

        {/* SCAN BUTTON */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunStatisticalAudit}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? "Scanning Gradebook..." : "Run Variance Scan"}</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teacher, class, or anomaly..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Flags', count: alerts.length },
            { id: 'pending', label: 'Pending Action', count: pendingCount, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300' },
            { id: 'critical', label: 'Critical Skew', count: criticalCount, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300' },
            { id: 'resolved', label: 'Resolved', count: alerts.filter(a => a.status === 'resolved').length }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-black ${
                activeFilter === f.id ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ALERTS FEED LIST */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Variance Alerts Flagged</h4>
            <p className="text-xs text-slate-500 mt-0.5">All class assessment score distributions fall within normal standard deviation limits.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isResolved = alert.status === 'resolved';

            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  isResolved
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : isCritical 
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Teacher & Anomaly Overview */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Teacher Avatar & Name */}
                      <div className="flex items-center gap-2">
                        <img 
                          src={alert.teacherPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} 
                          alt={alert.teacherName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        />
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {alert.teacherName}
                        </span>
                      </div>

                      <span className="text-slate-300 dark:text-slate-600">•</span>

                      {/* Subject & Class */}
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10.5px]">
                        {alert.subject} ({alert.className})
                      </span>

                      {/* Severity Pill */}
                      <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${
                        isResolved 
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400' 
                          : isCritical 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' 
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                      }`}>
                        {isResolved ? 'RESOLVED' : alert.severity.toUpperCase()}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono ml-auto lg:ml-0">
                        {alert.timestamp}
                      </span>
                    </div>

                    {/* Anomaly Heading & Description */}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-600' : 'text-amber-500'}`} />
                        <span>{alert.anomalyType}</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>

                    {/* Statistical Metrics Strip */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10.5px] font-mono">
                      <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Std Dev: <strong className="text-rose-600 dark:text-rose-400">σ = {alert.stdDev}%</strong>
                      </div>
                      <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Class Avg: <strong>{alert.classAverage}%</strong>
                      </div>
                      <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Spread Range: <strong>{alert.gradeSpread}</strong>
                      </div>
                      <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Cohort Size: <strong>{alert.classSize} Students</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedAlert(alert)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Class Breakdown</span>
                    </button>

                    {alert.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(alert.id, 'under_review')}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                      >
                        <span>Request Teacher Audit</span>
                      </button>
                    )}

                    {alert.status === 'under_review' && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                        ⏳ Teacher Audit Pending
                      </span>
                    )}

                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge & Clear</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAILED CLASS BREAKDOWN MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <BarChart2 className="w-4 h-4" />
                  </span>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                    Detailed Grade Variance Analysis
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class Assessment Audit for <strong>{selectedAlert.teacherName}</strong> — {selectedAlert.subject} ({selectedAlert.className})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Distribution Visual Bar */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Class Grade Distribution Breakdown ({selectedAlert.classSize} Learners)
              </span>

              {/* Progress bar stack */}
              <div className="h-4 w-full rounded-lg overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                {selectedAlert.scoreDistribution.map((dist, idx) => {
                  const pct = Math.round((dist.count / selectedAlert.classSize) * 100);
                  return (
                    <div 
                      key={idx} 
                      className={`${dist.color} h-full transition-all duration-300`} 
                      style={{ width: `${pct}%` }}
                      title={`${dist.label}: ${dist.count} students (${pct}%)`}
                    />
                  );
                })}
              </div>

              {/* Legend row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10.5px]">
                {selectedAlert.scoreDistribution.map((dist, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded ${dist.color} shrink-0`} />
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {dist.label}: <strong>{dist.count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                System Recommendation
              </span>
              <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
                {selectedAlert.recommendation}
              </p>
            </div>

            {/* Send Directive Form */}
            <form onSubmit={handleSendAuditDirective} className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dispatch Admin Instruction / Audit Directive to Teacher:
                </label>
                {reviewNoteAutoSave === 'saving' && (
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 animate-pulse font-bold">
                    Auto-saving draft...
                  </span>
                )}
                {reviewNoteAutoSave === 'saved' && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    Draft auto-saved
                  </span>
                )}
              </div>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="e.g. Please re-check question weights for Question 4-10 or submit CA answer key for HOD verification by Friday."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Directive to Teacher</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminGradeVarianceAlertFeed;
