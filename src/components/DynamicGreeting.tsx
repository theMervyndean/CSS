import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, Moon, Sunrise, Sunset, Sparkles, Clock, Calendar, 
  GraduationCap, Shield, User, Landmark, BookOpen, CheckCircle2,
  Bell, ArrowRight, Zap, Trophy, Award, HeartHandshake, Eye
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

export interface DynamicGreetingProps {
  userProfile: UserProfile;
  schoolName?: string;
  subscriptionTier?: string;
  activeTab?: string;
  onNavigateTab?: (tabKey: string) => void;
  className?: string;
}

interface TimePeriodInfo {
  greeting: string;
  subtext: string;
  periodLabel: string;
  icon: React.ElementType;
  gradientBg: string;
  textColor: string;
  accentBadge: string;
  borderTone: string;
  moodEmoji: string;
}

export const DynamicGreeting: React.FC<DynamicGreetingProps> = ({
  userProfile,
  schoolName = "Corner Streams Private School",
  subscriptionTier = "unified_enterprise",
  activeTab = "overview",
  onNavigateTab,
  className = ""
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(`CS_GREETING_COLLAPSED_${userProfile.id || 'default'}`);
      if (saved !== null) return saved === 'true';
      // Default to compact on mobile & tablet for maximum screen efficiency
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Keep clock updated every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const handleToggleCollapse = () => {
    const next = !isDismissed;
    setIsDismissed(next);
    try {
      sessionStorage.setItem(`CS_GREETING_COLLAPSED_${userProfile.id || 'default'}`, String(next));
    } catch {
      // ignore
    }
  };

  // Determine period of the day & customized greetings
  const timeInfo: TimePeriodInfo = useMemo(() => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtext: "Welcome to today's academic session. Ready to empower learning?",
        periodLabel: "Morning Session",
        icon: Sunrise,
        gradientBg: "from-indigo-950 via-indigo-900 to-slate-900",
        textColor: "text-amber-300",
        accentBadge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
        borderTone: "border-amber-500/20",
        moodEmoji: "☀️"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        subtext: "Mid-day classes in progress. Keeping institutional operations in peak sync.",
        periodLabel: "Afternoon Session",
        icon: Sun,
        gradientBg: "from-indigo-950 via-slate-900 to-emerald-950",
        textColor: "text-emerald-300",
        accentBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
        borderTone: "border-emerald-500/20",
        moodEmoji: "🌤️"
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Good Evening",
        subtext: "Wrapping up today's academic milestones, grading records & parent communiqués.",
        periodLabel: "Evening Review",
        icon: Sunset,
        gradientBg: "from-slate-950 via-indigo-950 to-purple-950",
        textColor: "text-purple-300",
        accentBadge: "bg-purple-500/20 text-purple-300 border-purple-400/30",
        borderTone: "border-purple-500/20",
        moodEmoji: "🌆"
      };
    } else {
      return {
        greeting: "Good Evening",
        subtext: "Working late? Your changes and grading broadsheets are continuously auto-saved.",
        periodLabel: "Night Owl Study",
        icon: Moon,
        gradientBg: "from-slate-950 via-slate-900 to-indigo-950",
        textColor: "text-indigo-300",
        accentBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
        borderTone: "border-indigo-500/20",
        moodEmoji: "🌙"
      };
    }
  }, [currentTime]);

  // Extract polite personalized name (Honorific + First Name or Full Name)
  const formattedDisplayName = useMemo(() => {
    const raw = (userProfile.fullName || "User").trim();
    
    // Check for honorific prefixes like Chief, Dr., Mrs., Mr., Prof., Engr., Pastor, Barr.
    const honorificMatch = raw.match(/^(Chief|Dr\.|Dr|Mrs\.|Mrs|Mr\.|Mr|Ms\.|Ms|Prof\.|Prof|Engr\.|Engr|Barr\.|Barr|Pastor|Deacon)\s+([A-Za-z]+)/i);
    if (honorificMatch) {
      return `${honorificMatch[1]} ${honorificMatch[2]}`;
    }

    // Default: first two words if longer
    const parts = raw.split(/\s+/);
    if (parts.length > 1) {
      return parts.slice(0, 2).join(' ');
    }
    return raw;
  }, [userProfile.fullName]);

  // Role details & custom quick highlights
  const roleMetadata = useMemo(() => {
    switch (userProfile.role) {
      case 'Super_Admin':
        return {
          title: "Global Platform Director",
          badge: "Super Administrator",
          icon: Shield,
          badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/40",
          quickFact: "14 Verified School Clusters Online",
          statusPill: "All Cloud Services Operational",
          primaryAction: { label: "Campus Directory", tab: "schools" }
        };
      case 'School_Admin':
        return {
          title: "Principal / Executive Administrator",
          badge: "School Administrator",
          icon: Landmark,
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
          quickFact: "1,248 Enrolled Students • 7 Active Classrooms",
          statusPill: "Bursary Ledger Active",
          primaryAction: { label: "Executive Desk", tab: "overview" }
        };
      case 'Class_Teacher':
      case 'Non_Class_Teacher':
        return {
          title: "Faculty Instructor & Class Teacher",
          badge: "Class Teacher",
          icon: BookOpen,
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
          quickFact: "Class Scoring Matrix & CBT Review Ready",
          statusPill: "Gradebook Synced",
          primaryAction: { label: "Scoring Grid", tab: "scores" }
        };
      case 'Student':
        return {
          title: "Student Scholar",
          badge: "Student Portal",
          icon: GraduationCap,
          badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/40",
          quickFact: "Term 1 CBT Examination Portal Active",
          statusPill: "CBT Ready",
          primaryAction: { label: "Live CBT Exams", tab: "live" }
        };
      case 'Parent':
        return {
          title: "Parent / Legal Guardian",
          badge: "Parent Guardian",
          icon: HeartHandshake,
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
          quickFact: "2 Wards Linked • Official Terminal Reports Available",
          statusPill: "Tuition Cleared",
          primaryAction: { label: "Children Performance", tab: "overview" }
        };
      default:
        return {
          title: "Institutional User",
          badge: "Member",
          icon: User,
          badgeColor: "bg-slate-500/20 text-slate-300 border-slate-400/40",
          quickFact: "Corner Streams School OS",
          statusPill: "Active",
          primaryAction: { label: "Dashboard", tab: "overview" }
        };
    }
  }, [userProfile.role]);

  const IconComponent = timeInfo.icon;
  const RoleIcon = roleMetadata.icon;

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [currentTime]);

  const formattedClock = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, [currentTime]);

  return (
    <div 
      id="dashboard-dynamic-greeting-banner"
      className={`relative w-full mb-3 rounded-2xl overflow-hidden shadow-md border ${timeInfo.borderTone} transition-all duration-300 ${className}`}
    >
      {/* BACKGROUND GRADIENT */}
      <div className={`bg-gradient-to-r ${timeInfo.gradientBg} ${isDismissed ? 'p-2.5 sm:p-3.5' : 'p-3 sm:p-4 md:p-5'} text-white relative transition-all duration-200`}>
        
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-6 w-40 h-40 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4">
          
          {/* LEFT: AVATAR & GREETING */}
          <div className="flex items-center sm:items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            
            {/* AVATAR */}
            <div className="relative shrink-0">
              <div className={`${isDismissed ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13'} rounded-xl sm:rounded-2xl overflow-hidden border border-white/25 shadow-sm bg-indigo-950 flex items-center justify-center transition-all duration-200`}>
                {userProfile.photoUrl ? (
                  <img 
                    src={userProfile.photoUrl} 
                    alt={userProfile.fullName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <RoleIcon className="w-5 h-5 text-emerald-300" />
                )}
              </div>
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-indigo-900 border border-indigo-950 flex items-center justify-center shadow-xs"
                title={timeInfo.periodLabel}
              >
                <IconComponent className={`w-2.5 h-2.5 ${timeInfo.textColor}`} />
              </div>
            </div>

            {/* GREETING & STATUS BADGES */}
            <div className="flex-1 min-w-0">
              {/* Badges Row - Hidden or Simplified when dismissed on tiny screens */}
              {!isDismissed && (
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5 sm:mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-sans font-semibold border ${timeInfo.accentBadge}`}>
                    <IconComponent className="w-3 h-3" />
                    <span>{timeInfo.periodLabel}</span>
                  </span>
                  
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-sans font-semibold border ${roleMetadata.badgeColor}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleMetadata.badge}</span>
                  </span>

                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-white/10 text-slate-200 border border-white/15">
                    <span>{schoolName}</span>
                  </span>
                </div>
              )}

              {/* Headline */}
              <h1 className={`${isDismissed ? 'text-sm sm:text-base md:text-lg' : 'text-sm sm:text-lg md:text-xl lg:text-2xl'} font-extrabold tracking-tight text-white flex items-center gap-1.5 font-display transition-all`}>
                <span className="truncate">
                  {timeInfo.greeting}, <span className={`${timeInfo.textColor} underline decoration-emerald-400/40 underline-offset-2`}>{formattedDisplayName}</span>
                </span>
                <span className="text-base sm:text-lg shrink-0">{timeInfo.moodEmoji}</span>
              </h1>

              {/* Subtext description (hidden when dismissed, or concise on small screens) */}
              {!isDismissed && (
                <p className="hidden sm:block text-xs text-slate-200 font-sans mt-0.5 leading-relaxed max-w-2xl">
                  {timeInfo.subtext}
                </p>
              )}
            </div>

            {/* Mobile-only toggle button inside top row when collapsed */}
            {isDismissed && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="md:hidden text-[11px] font-semibold text-emerald-300 hover:text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition cursor-pointer shrink-0"
                title="Expand greeting details"
              >
                ▼ Details
              </button>
            )}
          </div>

          {/* RIGHT: LIVE CLOCK & COMPACT TOGGLE */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-1.5 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
            
            {/* Live Clock & Calendar (Streamlined on mobile & tablet) */}
            <div className="flex items-center gap-2 bg-black/35 backdrop-blur-xs px-2.5 sm:px-3 py-1 rounded-xl border border-white/10 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-200 text-[11px] sm:text-xs font-medium">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[110px] sm:max-w-none">{formattedDate}</span>
              </div>
              <span className="text-slate-500 text-[10px]">•</span>
              <div className="flex items-center gap-1 text-emerald-300 text-[11px] sm:text-xs font-bold shrink-0">
                <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{formattedClock}</span>
              </div>
            </div>

            {/* Quick Fact / Expand-Collapse Toggle */}
            <div className="flex items-center gap-2">
              {!isDismissed && (
                <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] font-medium text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{roleMetadata.quickFact}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleCollapse}
                className="hidden md:inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title={isDismissed ? "Expand greeting details" : "Collapse greeting details"}
              >
                {isDismissed ? "▼ Show Details" : "▲ Compact"}
              </button>
              
              {!isDismissed && (
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  className="md:hidden text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10 transition cursor-pointer"
                  title="Collapse greeting details"
                >
                  ▲ Compact
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* SUB-BAR WITH QUICK ACTIONS (WHEN NOT DISMISSED) */}
      {!isDismissed && (
        <div className="bg-slate-900/95 px-3 sm:px-4 py-2 text-slate-300 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Session: <strong className="text-white">2025/2026 Term 1</strong></span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Status: <strong className="text-emerald-400">Online & Ready</strong></span>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab(roleMetadata.primaryAction.tab)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                <span>Go to {roleMetadata.primaryAction.label}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicGreeting;
