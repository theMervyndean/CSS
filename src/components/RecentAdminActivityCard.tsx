import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, Key, Lock, Unlock, Radio, HardDrive, 
  Sliders, UserCheck, Clock, Eye, Download, Search, Filter, 
  AlertTriangle, RefreshCw, Sparkles, X, ChevronRight, FileText, CheckCircle2
} from 'lucide-react';
import { 
  AdminActivityLog, 
  getRecentAdminActivities, 
  getAllAdminActivities,
  resetAdminActivitiesToDefault,
  AdminActionSeverity,
  AdminActionType
} from '../utils/adminAuditLogger';
import { toast } from 'sonner';

interface RecentAdminActivityCardProps {
  onNavigateToSettings?: () => void;
  className?: string;
}

export const RecentAdminActivityCard: React.FC<RecentAdminActivityCardProps> = ({
  onNavigateToSettings,
  className = ''
}) => {
  const [activities, setActivities] = useState<AdminActivityLog[]>(() => getRecentAdminActivities(5));
  const [selectedActivity, setSelectedActivity] = useState<AdminActivityLog | null>(null);
  const [isFullLogModalOpen, setIsFullLogModalOpen] = useState<boolean>(false);
  const [allLogs, setAllLogs] = useState<AdminActivityLog[]>(() => getAllAdminActivities());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');

  // Listen to storage events and custom activity events to update dynamically in real time
  useEffect(() => {
    const refreshData = () => {
      setActivities(getRecentAdminActivities(5));
      setAllLogs(getAllAdminActivities());
    };

    window.addEventListener('storage', refreshData);
    window.addEventListener('cs_admin_activity_logged', refreshData);

    return () => {
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('cs_admin_activity_logged', refreshData);
    };
  }, []);

  const isFiltering = Boolean(cardSearchQuery.trim() || selectedActionFilter !== 'all');
  const sourceList = isFiltering ? allLogs : activities;

  const displayedActivities = sourceList.filter(activity => {
    const query = cardSearchQuery.trim().toLowerCase();
    
    const matchesSearch = !query || 
      activity.performedBy.name.toLowerCase().includes(query) ||
      (activity.performedBy.email && activity.performedBy.email.toLowerCase().includes(query)) ||
      activity.performedBy.role.toLowerCase().includes(query) ||
      activity.actionType.toLowerCase().includes(query) ||
      activity.actionTitle.toLowerCase().includes(query) ||
      activity.targetResource.toLowerCase().includes(query) ||
      activity.details.toLowerCase().includes(query);

    const matchesType = selectedActionFilter === 'all' || activity.actionType === selectedActionFilter;

    return matchesSearch && matchesType;
  }).slice(0, isFiltering ? 10 : 5);

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const getActionTypeIcon = (type: AdminActionType, severity: AdminActionSeverity) => {
    switch (type) {
      case 'kill_switch':
        return {
          icon: Radio,
          color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
          badgeText: 'KILL-SWITCH'
        };
      case 'publish_results':
        return {
          icon: Unlock,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
          badgeText: 'RESULTS LIVE'
        };
      case 'lock_results':
        return {
          icon: Lock,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
          badgeText: 'RESULTS LOCKED'
        };
      case 'purge_cache':
        return {
          icon: HardDrive,
          color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-800',
          badgeText: 'CACHE PURGE'
        };
      case 'tier_change':
        return {
          icon: Sparkles,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
          badgeText: 'LICENSE UPGRADE'
        };
      case 'security_override':
        return {
          icon: Key,
          color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
          badgeText: 'SECURITY ACCESS'
        };
      case 'rbac_update':
        return {
          icon: UserCheck,
          color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
          badgeText: 'RBAC MODIFIED'
        };
      default:
        return {
          icon: ShieldAlert,
          color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          badgeText: 'ADMIN ACTION'
        };
    }
  };

  const getSeverityBadge = (severity: AdminActionSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'high':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'warning':
        return 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const exportAuditLogCSV = () => {
    const logs = getAllAdminActivities();
    if (!logs.length) {
      toast.error('No administrative logs available to export.');
      return;
    }

    const headers = ['Activity ID', 'Timestamp', 'Action Title', 'Action Type', 'Severity', 'Admin Name', 'Admin Role', 'Admin Email', 'Target Resource', 'Auth Method', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.actionTitle.replace(/"/g, '""')}"`,
      `"${l.actionType}"`,
      `"${l.severity}"`,
      `"${l.performedBy.name}"`,
      `"${l.performedBy.role}"`,
      `"${l.performedBy.email || ''}"`,
      `"${l.targetResource.replace(/"/g, '""')}"`,
      `"${l.authMethod}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || 'Internal'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `corner-streams-admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('🛡️ Administrative Activity Audit Log exported successfully!');
  };

  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = 
      log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverityFilter === 'all' || log.severity === selectedSeverityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Top Header Card Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Recent Administrative Activity
              </h3>
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Live 2FA Audit
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Showing the last 5 high-risk operations, security gatekeeper unlocks, and database updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setAllLogs(getAllAdminActivities());
              setIsFullLogModalOpen(true);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Audit Ledger ({allLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={exportAuditLogCSV}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download CSV Audit Record"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Small Search Bar & Action Type Filter Controls */}
      <div className="p-3 sm:px-5 sm:py-2.5 bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={cardSearchQuery}
            onChange={(e) => setCardSearchQuery(e.target.value)}
            placeholder="Search by administrator username, email, or action type (e.g. Adeyemi, kill_switch, publish_results)..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-2xs"
          />
          {cardSearchQuery && (
            <button
              type="button"
              onClick={() => setCardSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Action Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hidden md:inline mr-0.5">Filter:</span>
          {[
            { key: 'all', label: 'All' },
            { key: 'kill_switch', label: 'Kill Switch' },
            { key: 'publish_results', label: 'Results' },
            { key: 'purge_cache', label: 'Purge' },
            { key: 'tier_change', label: 'Tier' },
            { key: 'rbac_update', label: 'RBAC' }
          ].map((typeItem) => (
            <button
              key={typeItem.key}
              type="button"
              onClick={() => setSelectedActionFilter(selectedActionFilter === typeItem.key ? 'all' : typeItem.key)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition whitespace-nowrap cursor-pointer ${
                selectedActionFilter === typeItem.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {typeItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Items List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            {isFiltering ? (
              <>
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  No administrative activity logs match "{cardSearchQuery || selectedActionFilter}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCardSearchQuery('');
                    setSelectedActionFilter('all');
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Clear Search &amp; Filters
                </button>
              </>
            ) : (
              <>
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No recent high-risk actions recorded in this session.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetAdminActivitiesToDefault();
                    setActivities(getRecentAdminActivities(5));
                    setAllLogs(getAllAdminActivities());
                    toast.success('Loaded benchmark administrative audit events.');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Load Benchmark Audit Trail
                </button>
              </>
            )}
          </div>
        ) : (
          displayedActivities.map((activity, idx) => {
            const { icon: ActionIcon, color, badgeText } = getActionTypeIcon(activity.actionType, activity.severity);
            const isCritical = activity.severity === 'critical';

            return (
              <motion.div
                key={activity.id || idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                onClick={() => setSelectedActivity(activity)}
              >
                {/* Left: Icon & Action Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <ActionIcon className="w-4.5 h-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getSeverityBadge(activity.severity)}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">
                        {activity.actionTitle}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-1 leading-snug">
                      {activity.details}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {activity.performedBy.name}
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded font-mono">
                          {activity.performedBy.role.replace('_', ' ')}
                        </span>
                      </span>

                      <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

                      <span className="truncate max-w-[220px] font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {activity.targetResource}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Auth Verification Badge & Timestamp */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {activity.authMethod === 'password_reauth' ? 'Passkey Verified' :
                       activity.authMethod === '2fa_certified' ? '2-Step Certified' : 'Role Authorized'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono" title={new Date(activity.timestamp).toLocaleString()}>
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Insight Ribbon */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-indigo-500" />
          <span>All high-risk triggers require mandatory passkey verification &amp; statutory certification.</span>
        </div>
        {onNavigateToSettings && (
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>Configure Security Matrix</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* DETAILED AUDIT EVENT MODAL */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                      Audit Record Details
                    </span>
                    <h4 className="text-base font-black text-white font-display">
                      {selectedActivity.actionTitle}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-400 block">
                    Action Summary &amp; Impact
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                    {selectedActivity.details}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block">Performed By</span>
                    <span className="font-black text-slate-900 dark:text-white block mt-0.5">
                      {selectedActivity.performedBy.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {selectedActivity.performedBy.role} {selectedActivity.performedBy.email && `• ${selectedActivity.performedBy.email}`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block">Timestamp</span>
                    <span className="font-black text-slate-900 dark:text-white block mt-0.5">
                      {formatRelativeTime(selectedActivity.timestamp)}
                    </span>
                    <span className="text-[9.5px] text-slate-500 block font-mono">
                      {new Date(selectedActivity.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block">Auth Verification</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide text-[10.5px]">
                        {selectedActivity.authMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block">IP / Device Origin</span>
                    <span className="font-mono text-[10.5px] text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                      {selectedActivity.ipAddress || 'Internal Network'}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {selectedActivity.deviceInfo || 'Standard Admin Console'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block">Target Resource Scope</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold block mt-0.5">
                    {selectedActivity.targetResource}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Close Audit Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL AUDIT TRAIL LEDGER MODAL */}
      <AnimatePresence>
        {isFullLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              {/* Ledger Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                        Institutional Governance
                      </span>
                      <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                        Immutable Security Ledger
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white font-display mt-0.5">
                      Comprehensive Administrative Audit Trail
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportAuditLogCSV}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullLogModalOpen(false)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by action title, administrator name, or impacted resource..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedSeverityFilter}
                    onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="all">All Severities ({allLogs.length})</option>
                    <option value="critical">Critical Severities</option>
                    <option value="high">High Risk</option>
                    <option value="warning">Warning / Standard</option>
                  </select>
                </div>
              </div>

              {/* Log Table / List */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <p>No audit events match your search filters.</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getSeverityBadge(log.severity)}`}>
                            {log.severity}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.actionTitle}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11.5px] leading-snug">
                          {log.details}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.performedBy.name} ({log.performedBy.role})</span>
                          <span>•</span>
                          <span>Scope: {log.targetResource}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                          {log.authMethod.replace('_', ' ')}
                        </span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <span>Showing {filteredLogs.length} of {allLogs.length} audit records</span>
                <button
                  type="button"
                  onClick={() => setIsFullLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition"
                >
                  Close Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecentAdminActivityCard;
