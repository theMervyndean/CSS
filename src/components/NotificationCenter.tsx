import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Award, 
  Calendar, 
  CreditCard, 
  Info, 
  Sparkles,
  ChevronRight,
  Plus,
  Mail,
  UserPlus,
  Receipt,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { Notification, NotificationCategory, UserRole } from '../types';

export interface NotificationCenterProps {
  currentUserRole: UserRole;
  currentUserId: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  notifications?: Notification[];
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  hideTrigger?: boolean;
}

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'SS 2 First Term Biology Continuous Assessment Published',
    message: 'The biology continuous assessment grades for SS 2 have been compiled and published. You can now view your raw CA score matrix.',
    category: 'grade_publication',
    createdAt: '2026-06-30T10:00:00.000Z',
    isRead: false,
    targetRole: 'all',
    actionTab: 'result_checker'
  },
  {
    id: 'notif-2',
    title: 'Upcoming CBT Mock Exam Scheduled',
    message: 'The unified secondary mock computer-based examination is scheduled for July 5, 2026. Review your questions schedule in the CBT module.',
    category: 'upcoming_exam',
    createdAt: '2026-06-29T14:30:00.000Z',
    isRead: false,
    targetRole: 'Student',
    actionTab: 'cbt_exam_engine'
  },
  {
    id: 'notif-3',
    title: 'Bursar Alert: Termly Payment Ledger Clearance',
    message: 'All outstanding school fees for the First Term 2025/2026 academic session must be cleared. Please upload your transfer receipt to avoid portal holds.',
    category: 'payment_deadline',
    createdAt: '2026-06-28T09:15:00.000Z',
    isRead: false,
    targetRole: 'Parent',
    actionTab: 'bursar_console'
  },
  {
    id: 'notif-4',
    title: 'System Handshake Complete: Version 1.0.4 Active',
    message: 'Corner Streams OS v1.0.4 secure system environment successfully updated. Active school records ledger is online.',
    category: 'system',
    createdAt: '2026-06-30T08:00:00.000Z',
    isRead: true,
    targetRole: 'all',
    actionTab: 'dashboard'
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUserRole,
  currentUserId,
  onTabChange,
  isMobile = false,
  isOpen: propsIsOpen,
  setIsOpen: propsSetIsOpen,
  notifications: propsNotifications,
  setNotifications: propsSetNotifications,
  hideTrigger = false
}) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('CS_NOTIFICATIONS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const notifications = propsNotifications !== undefined ? propsNotifications : localNotifications;
  const setNotifications = propsSetNotifications !== undefined ? propsSetNotifications : setLocalNotifications;

  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : localIsOpen;
  const setIsOpen = propsSetIsOpen !== undefined ? propsSetIsOpen : setLocalIsOpen;
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationCategory>('all');

  // Listen for real-time notification events
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('CS_NOTIFICATIONS');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLocalNotifications(parsed);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cs_notification_created', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cs_notification_created', handleSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('CS_NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  // Filter notifications based on role, userId, and tab filters
  const filteredNotifications = notifications.filter(notif => {
    // 1. Role Filter
    const matchesRole = 
      !notif.targetRole || 
      notif.targetRole === 'all' || 
      notif.targetRole === currentUserRole ||
      (currentUserRole === 'Super_Admin' || currentUserRole === 'School_Admin'); // Admins see all alerts

    // 2. Specific User Filter
    const matchesUser = !notif.targetUserId || notif.targetUserId === currentUserId;

    if (!matchesRole || !matchesUser) return false;

    // 3. Tab filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notif.isRead;
    return notif.category === activeFilter;
  });

  const unreadCount = notifications.filter(notif => {
    const matchesRole = 
      !notif.targetRole || 
      notif.targetRole === 'all' || 
      notif.targetRole === currentUserRole ||
      (currentUserRole === 'Super_Admin' || currentUserRole === 'School_Admin');
    const matchesUser = !notif.targetUserId || notif.targetUserId === currentUserId;
    return !notif.isRead && matchesRole && matchesUser;
  }).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => {
      const matchesRole = 
        !n.targetRole || 
        n.targetRole === 'all' || 
        n.targetRole === currentUserRole ||
        (currentUserRole === 'Super_Admin' || currentUserRole === 'School_Admin');
      const matchesUser = !n.targetUserId || n.targetUserId === currentUserId;
      if (matchesRole && matchesUser) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    
    if (notif.actionTab) {
      // Direct user to appropriate tab depending on roles
      if (currentUserRole === 'Student' && notif.actionTab === 'bursar_console') {
        // Students don't have direct financial edit ledger but parents do
        onTabChange('dashboard');
      } else if (currentUserRole === 'Parent' && notif.actionTab === 'result_checker') {
        onTabChange('result_checker');
      } else {
        onTabChange(notif.actionTab);
      }
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'grade_publication':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'upcoming_exam':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'payment_deadline':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'lead_alert':
        return <Mail className="w-4 h-4 text-purple-500" />;
      case 'registration':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'receipt':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getCategoryStyles = (category: NotificationCategory) => {
    switch (category) {
      case 'grade_publication':
        return 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/30';
      case 'upcoming_exam':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30';
      case 'payment_deadline':
        return 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/30';
      case 'lead_alert':
        return 'bg-purple-50 text-purple-800 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/30';
      case 'registration':
        return 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30';
      case 'receipt':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/30';
      default:
        return 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/30';
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 6000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${Math.floor(diffMins / 60)}h ago`;
      
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className={hideTrigger ? "" : "relative"}>
      {/* Trigger Bell Icon Button */}
      {!hideTrigger && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors duration-150 flex items-center justify-center focus:outline-none"
          aria-label="Notification Center"
          id={`bell-trigger-${isMobile ? 'mobile' : 'desktop'}`}
        >
          <Bell className="w-5 h-5 text-slate-100" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-indigo-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Popover / Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for clickout */}
            <div 
              className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/15 backdrop-blur-[1px]" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={hideTrigger ? { opacity: 0, x: 50 } : { opacity: 0, y: isMobile ? 20 : 10, scale: 0.95 }}
              animate={hideTrigger ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={hideTrigger ? { opacity: 0, x: 50 } : { opacity: 0, y: isMobile ? 20 : 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed z-50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden ${
                hideTrigger
                  ? 'top-20 bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] max-h-[calc(100vh-100px)]'
                  : isMobile 
                    ? 'bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] max-h-[80vh]' 
                    : 'absolute top-full right-0 mt-3.5 w-[380px] max-h-[80vh]'
              }`}
            >
              {/* Header */}
              <div className="bg-indigo-950 text-white p-3.5 flex items-center justify-between shrink-0 border-b border-indigo-900">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-900 p-1.5 rounded-lg border border-indigo-800">
                    <Bell className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">Alert Center</h3>
                    <p className="text-[9px] text-slate-300 font-medium">
                      {unreadCount} pending system alerts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      markAllAsRead();
                      toast.success("All notifications marked as read! They will remain in the history list.", {
                        id: 'mark-all-read-toast'
                      });
                    }} 
                    disabled={unreadCount === 0}
                    className={`text-[9.5px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      unreadCount > 0
                        ? 'bg-indigo-900 hover:bg-indigo-850 text-emerald-400 border border-indigo-800 hover:border-indigo-700'
                        : 'bg-indigo-950/40 text-slate-500 border border-indigo-900/40 cursor-not-allowed opacity-60'
                    }`}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mark All as Read</span>
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1 rounded hover:bg-indigo-900 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filtering Sub-Bar */}
              <div className="bg-slate-50 dark:bg-slate-950/50 px-3 py-2 flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`text-[9.5px] px-2.5 py-0.8 rounded-full font-bold uppercase transition-all duration-150 shrink-0 border cursor-pointer ${
                    activeFilter === 'all' 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`text-[9.5px] px-2.5 py-0.8 rounded-full font-bold uppercase transition-all duration-150 shrink-0 border cursor-pointer ${
                    activeFilter === 'unread' 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveFilter('grade_publication')}
                  className={`text-[9.5px] px-2.5 py-0.8 rounded-full font-bold uppercase transition-all duration-150 shrink-0 border cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'grade_publication' 
                      ? 'bg-amber-600 border-amber-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-2.5 h-2.5" /> Grades
                </button>
                <button
                  onClick={() => setActiveFilter('upcoming_exam')}
                  className={`text-[9.5px] px-2.5 py-0.8 rounded-full font-bold uppercase transition-all duration-150 shrink-0 border cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'upcoming_exam' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-2.5 h-2.5" /> Exams
                </button>
                <button
                  onClick={() => setActiveFilter('payment_deadline')}
                  className={`text-[9.5px] px-2.5 py-0.8 rounded-full font-bold uppercase transition-all duration-150 shrink-0 border cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'payment_deadline' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-2.5 h-2.5" /> Payments
                </button>
              </div>

              {/* Notification List Panel */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 min-h-[180px] bg-slate-50/30 dark:bg-slate-900/40">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No matching system alerts
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      You are completely clear of alerts in this workspace filter.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredNotifications.map(notif => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 text-left transition-colors duration-150 relative group cursor-pointer border-l-4 ${
                          notif.isRead 
                            ? 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30' 
                            : 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20'
                        }`}
                      >
                        {/* Title and Category Tag */}
                        <div className="flex items-start justify-between gap-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border shrink-0 ${getCategoryStyles(notif.category)}`}>
                            {notif.category.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>

                        {/* Title Text */}
                        <h4 className={`text-xs mt-1.5 leading-tight tracking-tight ${
                          notif.isRead 
                            ? 'font-medium text-slate-700 dark:text-slate-300' 
                            : 'font-black text-indigo-950 dark:text-white'
                        }`}>
                          {notif.title}
                        </h4>

                        {/* Message Description */}
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {notif.message}
                        </p>

                        {/* Actions Overlay Row */}
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                          {notif.actionTab ? (
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wide flex items-center gap-0.5 group-hover:underline">
                              Go to dashboard module <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          ) : (
                            <span />
                          )}

                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
