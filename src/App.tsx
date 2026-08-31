/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, GradeRecord, BillingRecord, UserRole } from './types';
import { mockUsers, defaultGradeRecords, mockBillingRecords } from './mockData';
import CbtExamEngine from './components/CbtExamEngine';
import GradeBook from './components/GradeBook';
import FinancialStatements from './components/FinancialStatements';
import ResultChecker from './components/ResultChecker';
import IdentityRegistry from './components/IdentityRegistry';
import CommunicationHub from './components/CommunicationHub';
import SettingsPanel from './components/SettingsPanel';
import { SidebarSyncIndicator } from './components/SidebarSyncIndicator';
import { BrandLogo, BrandLogoIcon } from './components/BrandLogo';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { NotificationCenter, DEFAULT_NOTIFICATIONS } from './components/NotificationCenter';
import AiAssistantWidget from './components/AiAssistantWidget';
import DynamicGreeting from './components/DynamicGreeting';
import NonyeOnboardingModal from './components/NonyeOnboardingModal';
import { Notification } from './types';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { startLocalStorageValidationTimer } from './utils/schemaValidator';
import { auth, logOutFromFirebase, syncUserProfileToFirestore, syncSchoolToFirestore, syncGradesToFirestore } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Unified layouts
import PendingVerification from './pages/PendingVerification';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentPortal from './pages/ParentPortal';
import StudentDashboard from './pages/StudentDashboard';
import WelcomePack from './pages/WelcomePack';
import { Button } from './components/ui/button';
import { useFocusMode } from './utils/focusMode';
import { CbtFloatingFocusBar } from './components/CbtFocusModeBanner';
import {
  LayoutDashboard,
  BookOpen,
  TableProperties,
  Landmark,
  Layers,
  Users,
  Database,
  Lock,
  Compass,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Shield,
  Activity,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Settings,
  Upload,
  Camera,
  Image,
  GraduationCap,
  Receipt,
  Sparkles,
  FileText,
  Play,
  CheckCircle2,
  Award,
  FileCheck,
  Calendar,
  Brain
} from 'lucide-react';


export default function App() {
  // Theme state: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple'>(() => {
    const saved = localStorage.getItem('CS_THEME');
    return (saved as 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple') || 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('CS_THEME');
    if (saved === 'dark') return 'dark';
    if (saved === 'light' || saved === 'emerald' || saved === 'amber' || saved === 'purple') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Main view router state definition
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string>('unified_enterprise');
  const [selectedPlanDuration, setSelectedPlanDuration] = useState<string>('full_session');

  // Font family state: 'montserrat' | 'poppins' | 'inter' | 'mono' | 'serif'
  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('CS_FONT') || 'montserrat';
  });

  // CBT Focus Mode (hides sidebar & navigation header during tests/testing sessions)
  const { isFocusMode, disableFocusMode } = useFocusMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        disableFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, disableFocusMode]);

  useEffect(() => {
    const handleOffline = () => {
      toast.info("Offline Mode Active — Service worker asset caching enabled. Cached report cards & local CBT exam storage remain active.", {
        duration: 5000,
        id: "cs-offline-status"
      });
    };

    const handleOnline = () => {
      toast.success("Online connection restored — Corner Streams fully connected.", {
        duration: 3000,
        id: "cs-offline-status"
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Periodically validate core localStorage item schemas
    const cleanupValidation = startLocalStorageValidationTimer(15000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      cleanupValidation();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      'font-opt-poppins',
      'font-opt-montserrat',
      'font-opt-inter',
      'font-opt-mono',
      'font-opt-jetbrains',
      'font-opt-serif',
      'font-opt-playfair',
      'font-opt-space'
    );
    const targetFont = activeFont || 'montserrat';
    root.classList.add(`font-opt-${targetFont}`);
    localStorage.setItem('CS_FONT', targetFont);
  }, [activeFont]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (currentView !== 'app') {
        root.classList.remove('dark');
        root.classList.remove('theme-emerald', 'theme-amber', 'theme-purple');
        setResolvedTheme('light');
        return;
      }

      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light' || theme === 'emerald' || theme === 'amber' || theme === 'purple') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }

      // Apply three custom color theme classes
      root.classList.remove('theme-emerald', 'theme-amber', 'theme-purple');
      if (theme === 'emerald') {
        root.classList.add('theme-emerald');
      } else if (theme === 'amber') {
        root.classList.add('theme-amber');
      } else if (theme === 'purple') {
        root.classList.add('theme-purple');
      }
    };

    applyTheme();
    localStorage.setItem('CS_THEME', theme);

    // Listen to OS system theme changes
    const listener = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme, currentView]);

  // Authentication state
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(mockUsers[0]); // Default to Super Admin David Macaulay
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    return localStorage.getItem('CS_RESULTS_PUBLISHED') === 'true';
  }); // Admin global publish state block
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('CS_RESULTS_PUBLISHED', String(isPublished));
  }, [isPublished]);

  // Nonye AI Onboarding Modal & Assistant trigger state
  const [isNonyeOnboardingOpen, setIsNonyeOnboardingOpen] = useState<boolean>(false);
  const [nonyeTriggerPrompt, setNonyeTriggerPrompt] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Trigger Nonye AI Onboarding on first login or profile load
  useEffect(() => {
    if (currentView === 'app') {
      const userKey = `nonye_onboarded_${currentUserProfile.id}`;
      const hasOnboarded = localStorage.getItem(userKey) === 'true';
      if (!hasOnboarded) {
        const timer = setTimeout(() => {
          setIsNonyeOnboardingOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView, currentUserProfile.id]);

  // Shared Notifications State
  const [notifications, setNotifications] = useState<Notification[]>(() => {
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('CS_NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  // Compute unreadCount at root level
  const unreadCount = notifications.filter(notif => {
    const matchesRole = 
      !notif.targetRole || 
      notif.targetRole === 'all' || 
      notif.targetRole === currentUserProfile.role ||
      (currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'School_Admin');
    const matchesUser = !notif.targetUserId || notif.targetUserId === currentUserProfile.id;
    return !notif.isRead && matchesRole && matchesUser;
  }).length;

  // School core state representing Corner Streams Private School
  const [schoolState, setSchoolState] = useState<any>(() => {
    const saved = localStorage.getItem('CS_SCHOOL');
    if (saved) return JSON.parse(saved);
    const defaultSchool = {
      id: "sch-0042",
      name: "Corner Streams Private School",
      principal_name: "Chief Folasade Adebayo",
      email: "bursar@cornerstreams.edu.ng",
      phone: "+234 814 188 0550",
      subscription_tier: "unified_enterprise",
      verification_status: "pending_verification", // Starts as pending_verification
      welcome_complete: false,
      kill_switch: false,
      benchmark: 50,
      classes: ["Primary 1", "Primary 2", "JSS 1", "JSS 2", "SS 1", "SS 2", "SS 3"]
    };
    localStorage.setItem('CS_SCHOOL', JSON.stringify(defaultSchool));
    return defaultSchool;
  });

  // Sync schoolState to CSS custom variables for dynamic print stylesheets & letterheads
  useEffect(() => {
    if (!schoolState) return;
    const root = document.documentElement;
    const schoolName = schoolState.name || "Corner Streams Private School";
    const schoolMotto = schoolState.motto || "Excellence & Honor in Character and Service";
    const schoolLogo = schoolState.logo_url || "";
    const schoolAddress = schoolState.address || "12 Corner Streams Boulevard, Victoria Island, Lagos";
    const schoolPhone = schoolState.phone || "+234 814 188 0550";
    const schoolEmail = schoolState.email || "bursar@cornerstreams.edu.ng";
    const schoolWebsite = schoolState.website || "www.cornerstreams.edu.ng";
    const schoolPrincipal = schoolState.principal_name || "Chief Folasade Adebayo";

    root.style.setProperty('--school-name', `"${schoolName}"`);
    root.style.setProperty('--school-name-raw', schoolName);
    root.style.setProperty('--school-motto', `"${schoolMotto}"`);
    root.style.setProperty('--school-address', `"${schoolAddress}"`);
    root.style.setProperty('--school-phone', `"${schoolPhone}"`);
    root.style.setProperty('--school-email', `"${schoolEmail}"`);
    root.style.setProperty('--school-website', `"${schoolWebsite}"`);
    root.style.setProperty('--school-principal', `"${schoolPrincipal}"`);
    if (schoolLogo) {
      root.style.setProperty('--school-logo-url', `url("${schoolLogo}")`);
      root.style.setProperty('--school-logo-raw', schoolLogo);
    } else {
      root.style.setProperty('--school-logo-url', 'none');
      root.style.setProperty('--school-logo-raw', '');
    }
  }, [schoolState]);

  // Keep schoolState updated with local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const sch = localStorage.getItem('CS_SCHOOL');
      if (sch) setSchoolState(JSON.parse(sch));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cs_school_updated', handleStorageChange);
    const poll = setInterval(() => {
      const sch = localStorage.getItem('CS_SCHOOL');
      if (sch) {
        try {
          const parsed = JSON.parse(sch);
          setSchoolState((prev: any) => {
            if (JSON.stringify(parsed) !== JSON.stringify(prev)) {
              return parsed;
            }
            return prev;
          });
        } catch (e) {}
      }
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cs_school_updated', handleStorageChange);
      clearInterval(poll);
    };
  }, []);

  const isNavUnlocked = (k: string) => {
    const tier = schoolState?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (k === "overview" || k === "rosters" || k === "classrooms" || k === "messages" || k === "settings" || k === "announcements") return true;
    if (k === "cbt" || k === "cbt_review" || k === "live") {
      return tier === "cbt_essentials" || tier === "cbt_plus_results";
    }
    if (k === "report_cards" || k === "broadsheet_vault" || k === "result_dossiers" || k === "scores" || k === "broadsheets" || k === "completed") {
      return tier === "cbt_plus_results" || tier === "digital_reports";
    }
    if (k === "fees" || k === "receipt" || k === "receipts" || k === "billing" || k === "staff_payment" || k === "staffs_payment") {
      return tier === "financial_ledger";
    }
    return true;
  };

  //Mutable core database states
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const saved = localStorage.getItem('CS_GRADES');
    return saved ? JSON.parse(saved) : defaultGradeRecords;
  });

  const [studentsProfileList, setStudentsProfileList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('CS_STUDENT_PROFILES');
    return saved ? JSON.parse(saved) : mockUsers;
  });

  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>(() => {
    const saved = localStorage.getItem('CS_BILLING_LEDGER');
    return saved ? JSON.parse(saved) : mockBillingRecords;
  });

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<string>('classes');

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth User connected:", firebaseUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save changes to localStorage and sync with Firestore
  useEffect(() => {
    localStorage.setItem('CS_GRADES', JSON.stringify(grades));
    syncGradesToFirestore(grades);
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('CS_STUDENT_PROFILES', JSON.stringify(studentsProfileList));
  }, [studentsProfileList]);

  useEffect(() => {
    localStorage.setItem('CS_BILLING_LEDGER', JSON.stringify(billingRecords));
  }, [billingRecords]);

  useEffect(() => {
    if (currentUserProfile) {
      syncUserProfileToFirestore(currentUserProfile);
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (schoolState) {
      syncSchoolToFirestore(schoolState);
    }
  }, [schoolState]);

  // Photo upload and preset updates
  const handleSignOut = async () => {
    try {
      await logOutFromFirebase();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setCurrentView('landing');
    setMobileMenuOpen(false);
    toast.success("Signed out successfully.");
  };

  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  ];

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    const updatedProfile = { ...currentUserProfile, photoUrl: newPhotoUrl };
    setCurrentUserProfile(updatedProfile);
    
    const updatedList = studentsProfileList.map(u => u.id === currentUserProfile.id ? updatedProfile : u);
    setStudentsProfileList(updatedList);
    toast.success("Profile picture updated successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handlePhotoUpdate(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Determine if a module is visible
  const isTabVisible = (_tabKey: string) => {
    return true;
  };

  // Redirect to default tab for role when profile changes
  useEffect(() => {
    if (currentUserProfile) {
      if (currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin') {
        setActiveTab('overview');
      } else if (currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') {
        setActiveTab('overview');
      } else if (currentUserProfile.role === 'Student') {
        setActiveTab('live');
      } else if (currentUserProfile.role === 'Parent') {
        setActiveTab('overview');
      }
    }
  }, [currentUserProfile]);

  // Switch tab safely depending on roles
  const selectTab = (tab: string) => {
    setActiveTab(tab);
  };

  // Calculations for institutional stats cards
  const totalEnrollment = 1248;
  const activeExamsCount = currentUserProfile.role === 'Student' ? 1 : 14;
  
  // Outstanding billing aggregates
  const rawTuitionOutstanding = billingRecords.reduce((acc, current) => {
    return acc + (current.totalAmount - current.amountPaid);
  }, 0);

  const getTuitionCollectionPercentage = () => {
    const grossCharge = billingRecords.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalCollected = billingRecords.reduce((acc, curr) => acc + curr.amountPaid, 0);
    return Math.round((totalCollected / grossCharge) * 100);
  };

  // Render the proper workspace block of content
  const renderWorkspaceContent = () => {
    if (currentUserProfile.role === 'Super_Admin') {
      if (activeTab === 'settings') {
        return (
          <SettingsPanel
            currentUserProfile={currentUserProfile}
            theme={theme}
            setTheme={setTheme}
            activeFont={activeFont}
            setActiveFont={setActiveFont}
          />
        );
      }
      return (
        <SuperAdminDashboard 
          currentProfile={currentUserProfile} 
          onImpersonate={(profile: any) => {
            setCurrentUserProfile(profile);
            toast.success(`Support access mode: Impersonating ${profile.fullName} (${profile.role.replace(/_/g, ' ')})`);
          }} 
          onLogout={() => setCurrentView('landing')}
          theme={theme}
          setTheme={setTheme}
          activeFont={activeFont}
          setActiveFont={setActiveFont}
          isMobileMenuOpen={mobileMenuOpen}
          setIsMobileMenuOpen={setMobileMenuOpen}
        />
      );
    }
    if (currentUserProfile.role === 'School_Admin') {
      return (
        <SchoolAdminDashboard 
          currentProfile={currentUserProfile} 
          theme={theme} 
          setTheme={setTheme}
          activeFont={activeFont}
          setActiveFont={setActiveFont}
          activeTab={activeTab}
          onTabChange={(tabKey: string) => selectTab(tabKey)}
          grades={grades}
          isPublished={isPublished}
          onTogglePublished={(newVal: boolean) => setIsPublished(newVal)}
        />
      );
    }
    if (currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') {
      return (
        <TeacherDashboard 
          currentProfile={currentUserProfile}
          theme={theme}
          setTheme={setTheme}
          activeFont={activeFont}
          setActiveFont={setActiveFont}
          activeTab={activeTab}
          grades={grades}
        />
      );
    }
    if (currentUserProfile.role === 'Parent') {
      return (
        <ParentPortal 
          currentProfile={currentUserProfile}
          theme={theme}
          setTheme={setTheme}
          activeFont={activeFont}
          setActiveFont={setActiveFont}
          activeTabProp={activeTab}
        />
      );
    }
    if (currentUserProfile.role === 'Student') {
      return (
        <StudentDashboard 
          currentProfile={currentUserProfile}
          theme={theme}
          setTheme={setTheme}
          activeFont={activeFont}
          setActiveFont={setActiveFont}
          activeTab={activeTab}
        />
      );
    }
    return null;
  };

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme} />
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="page-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen w-full"
          >
            <LandingPage 
              onChangeView={setCurrentView} 
              onSetSelectedPlan={(plan, dur) => {
                setSelectedPlan(plan);
                setSelectedPlanDuration(dur);
              }}
            />
          </motion.div>
        )}

        {currentView === 'login' && (
          <motion.div
            key="page-login"
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen w-full"
          >
            <LoginPage 
              onLoginSuccess={(profile) => {
                setCurrentUserProfile(profile);
                setCurrentView('app');
              }}
              onChangeView={setCurrentView}
            />
          </motion.div>
        )}

        {currentView === 'register' && (
          <motion.div
            key="page-register"
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen w-full"
          >
            <RegisterPage 
              selectedPlan={selectedPlan}
              selectedPlanDuration={selectedPlanDuration}
              onRegisterSuccess={(profile) => {
                setCurrentUserProfile(profile);
                setCurrentView('app');
              }}
              onChangeView={setCurrentView}
            />
          </motion.div>
        )}

        {currentView === 'app' && (
          <motion.div
            key="page-app"
            initial={{ opacity: 0, scale: 0.995, filter: 'blur(2px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.995, filter: 'blur(2px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="h-screen w-full flex flex-col overflow-hidden"
          >
            {schoolState.kill_switch === true && currentUserProfile.role !== 'Super_Admin' ? (
              <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 text-center select-none">
                <div className="max-w-md bg-slate-900 border border-rose-500/30 p-8 rounded-2xl shadow-2xl space-y-5">
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">Domain Lock Activated</h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your institutional cluster <strong>{schoolState.name}</strong> has been frozen by global platform administrator David K. Macaulay. Access to grading ledgers and CBT engines is disabled.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-550 font-mono">
                    Error Code: CS_CORE_BLOCK_SAFETY_KILL
                  </p>
                  <Button variant="outline" className="w-full text-slate-300 border-slate-700 bg-transparent hover:bg-slate-850" onClick={() => setCurrentView('landing')}>
                    Sign Out Session
                  </Button>
                </div>
              </div>
            ) : currentUserProfile.role === 'School_Admin' && (
              schoolState.verification_status === 'pending_verification' || 
              schoolState.verification_status === 'pending_review' ||
              schoolState.verification_status === 'paid_pending_verification'
            ) ? (
              <PendingVerification currentProfile={currentUserProfile} onLogout={() => setCurrentView('landing')} />
            ) : currentUserProfile.role === 'School_Admin' && schoolState.verification_status === 'active' && !schoolState.welcome_complete ? (
              <WelcomePack currentProfile={currentUserProfile} onCompleteWelcome={() => {
                const sch = JSON.parse(localStorage.getItem('CS_SCHOOL') || '{}');
                sch.welcome_complete = true;
                localStorage.setItem('CS_SCHOOL', JSON.stringify(sch));
                setSchoolState(sch);
              }} onLogout={() => setCurrentView('landing')} />
            ) : (
              <>
                <CbtFloatingFocusBar />
                <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden select-none">
                  {/* UNIFIED DESIGN MASTER HEADER */}
      {!isFocusMode && (
        <>
          {/* Tier 1: Mobile-only Top Bar: Logo & Bell separated */}
          <div className="lg:hidden h-14 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between px-4 shrink-0 border-b border-slate-200 dark:border-slate-800 shadow-sm relative z-25">
        <BrandLogo darkTheme={resolvedTheme === 'dark'} size={28} hideTagline={true} className="transition-transform duration-300" />
        
        {/* Mobile Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors duration-150 flex items-center justify-center focus:outline-none"
          aria-label="Notification Center"
          id="bell-trigger-mobile-top"
        >
          <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Tier 2: Mobile-only Sub-Bar: Navigation Toggle and Profile picture far apart */}
      <div className="lg:hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-900 shrink-0 relative z-20">
        {/* Left Section: Mobile Navigation Toggle Menu */}
        <div>
          {currentUserProfile.role === 'Super_Admin' ? (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-white hover:bg-slate-150 dark:hover:bg-indigo-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-white hover:bg-slate-150 dark:hover:bg-indigo-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Right Section: Mobile Profile and Simulated Selection Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-indigo-950/45 hover:bg-slate-200 dark:hover:bg-indigo-950/80 rounded-full border border-slate-250 dark:border-indigo-800 cursor-pointer pr-3 shadow-sm min-w-0 transition-all duration-150"
            >
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500 bg-slate-200 dark:bg-indigo-950 shrink-0">
                <img src={currentUserProfile.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-slate-100 dark:border-indigo-950 shadow-sm" />
            </div>
            
            <div className="text-left font-bold min-w-0 pr-0.5">
              <p className="text-[10px] text-slate-700 dark:text-white leading-none font-black truncate max-w-[95px]">
                {currentUserProfile.fullName}
              </p>
              <p className="text-[7.5px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest mt-0.5 leading-none truncate max-w-[95px]">
                {currentUserProfile.role.replace(/Class_Teacher|Non_Class_Teacher/g, 'Teacher').replace(/_/g, ' ')}
              </p>
            </div>
            <ChevronRight className={`w-3 h-3 text-slate-500 dark:text-emerald-400 transition-transform duration-200 shrink-0 ${userDropdownOpen ? 'rotate-90' : ''}`} />
          </motion.button>

          {/* Unified Mobile Dropdown */}
          <AnimatePresence>
            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] z-40 pointer-events-auto" onClick={() => setUserDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="fixed bottom-4 left-4 right-4 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 max-h-[75vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <span className="text-[10px] text-indigo-950 font-black uppercase tracking-widest leading-none">
                      Profile Settings
                    </span>
                    <button onClick={() => setUserDropdownOpen(false)} className="text-[10px] uppercase font-black text-rose-500 hover:text-rose-600 cursor-pointer">
                      Close
                    </button>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center gap-3 p-2.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl mb-3 shadow-inner">
                    <div className="relative shrink-0">
                      <img src={currentUserProfile.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-indigo-950 truncate leading-tight">{currentUserProfile.fullName}</h4>
                      <p className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-wide mt-0.5">{currentUserProfile.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {/* Photo Management Actions */}
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                      Manage Profile Photo
                    </span>
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <button
                        onClick={() => document.getElementById('profile-upload-mobile')?.click()}
                        className="flex items-center justify-center gap-1.5 p-2 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-bold text-indigo-950 transition-all cursor-pointer active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Upload picture</span>
                      </button>
                      <input
                        type="file"
                        id="profile-upload-mobile"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />

                      <button
                        onClick={() => toast.info("Select one of the preset avatars below to change your picture instantly!")}
                        className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] font-bold text-emerald-950 transition-all cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Change picture</span>
                      </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="bg-slate-50/80 border border-slate-150 p-2 rounded-xl">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Image className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                          Choose from preset avatars:
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePhotoUpdate(url)}
                            className={`relative shrink-0 rounded-full border-2 overflow-hidden cursor-pointer transition-all duration-150 active:scale-90 ${
                              currentUserProfile.photoUrl === url ? 'border-emerald-500 scale-105 shadow-sm' : 'border-transparent hover:border-indigo-600'
                            }`}
                          >
                            <img src={url} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Account & Institution Information */}
                  <div className="border-b border-slate-100 pb-3 mb-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Institution</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">{schoolState?.name || "Corner Streams Academy"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Email</span>
                      <span className="font-semibold text-indigo-600 text-[11px] truncate max-w-[170px]">{currentUserProfile.email || "admin@cornerstreams.edu"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">License Tier</span>
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {schoolState?.subscription_tier === 'cbt_essentials' ? 'CBT Starter' : schoolState?.subscription_tier === 'cbt_plus_results' ? 'CBT Pro' : 'Enterprise Suite'}
                      </span>
                    </div>
                  </div>

                  {/* Nonye AI Tour Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setIsNonyeOnboardingOpen(true);
                    }}
                    className="w-full mb-2 py-2 px-3 bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 text-indigo-950 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Nonye AI Capabilities Tour</span>
                  </button>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Sign Out Account</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
      {/* Desktop-only Navigation Header */}
      <nav className="hidden lg:flex h-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-white items-center justify-between px-6 shrink-0 border-b border-slate-200 dark:border-slate-800 shadow-md relative z-20">
        
        {/* Left Section: Company Brand Logos & Bell */}
        <div className="flex items-center gap-3 min-w-[48px]">
          <div className="hidden lg:block">
            <BrandLogo darkTheme={resolvedTheme === 'dark'} size={32} hideTagline={true} className="transition-transform duration-300 hover:scale-[1.01]" />
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-indigo-900/60 hidden lg:block" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="hidden lg:flex relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors duration-150 items-center justify-center focus:outline-none"
            aria-label="Notification Center"
            id="bell-trigger-desktop-top"
          >
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Center Spacer */}
        <div className="flex-1" />

        {/* Right Section: Desktop Active Simulated Persona Display */}
        <div className="flex items-center gap-3 relative min-w-[48px] justify-end">
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 bg-indigo-900/40 hover:bg-indigo-900/80 rounded-full border border-indigo-800 cursor-pointer pr-3.5 shadow-sm min-w-0 transition-all duration-150"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-400/50 bg-indigo-950 shrink-0">
                  <img src={currentUserProfile.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-indigo-950 shadow-sm" />
              </div>
              
              <div className="text-left font-bold min-w-0 pr-0.5">
                <p className="text-xs text-white leading-none font-black truncate max-w-[120px] md:max-w-[180px]">
                  {currentUserProfile.fullName}
                </p>
                <p className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest mt-1 leading-none truncate max-w-[120px]">
                  {currentUserProfile.role.replace(/Class_Teacher|Non_Class_Teacher/g, 'Teacher').replace(/_/g, ' ')}
                </p>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 shrink-0 ${userDropdownOpen ? 'rotate-90' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] z-40 pointer-events-auto" onClick={() => setUserDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute top-full right-0 mt-2 w-[300px] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 max-h-[75vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                      <span className="text-[10px] text-indigo-950 font-black uppercase tracking-widest leading-none">
                        Profile Settings
                      </span>
                      <button onClick={() => setUserDropdownOpen(false)} className="text-[10px] uppercase font-black text-rose-500 hover:text-rose-600 cursor-pointer">
                        Close
                      </button>
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-center gap-3 p-2.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl mb-3 shadow-inner">
                      <div className="relative shrink-0">
                        <img src={currentUserProfile.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-indigo-950 truncate leading-tight">{currentUserProfile.fullName}</h4>
                        <p className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-wide mt-0.5">{currentUserProfile.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>

                    {/* Photo Management Actions */}
                    <div className="border-b border-slate-100 pb-3 mb-3">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                        Manage Profile Photo
                      </span>
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <button
                          onClick={() => document.getElementById('profile-upload-desktop')?.click()}
                          className="flex items-center justify-center gap-1.5 p-2 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-bold text-indigo-950 transition-all cursor-pointer active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Upload picture</span>
                        </button>
                        <input
                          type="file"
                          id="profile-upload-desktop"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />

                        <button
                          onClick={() => toast.info("Select one of the preset avatars below to change your picture instantly!")}
                          className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] font-bold text-emerald-950 transition-all cursor-pointer active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Change picture</span>
                        </button>
                      </div>

                      {/* Presets Grid */}
                      <div className="bg-slate-50/80 border border-slate-150 p-2 rounded-xl">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Image className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                            Choose from preset avatars:
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                          {PRESET_AVATARS.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePhotoUpdate(url)}
                              className={`relative shrink-0 rounded-full border-2 overflow-hidden cursor-pointer transition-all duration-150 active:scale-90 ${
                                currentUserProfile.photoUrl === url ? 'border-emerald-500 scale-105 shadow-sm' : 'border-transparent hover:border-indigo-600'
                              }`}
                            >
                              <img src={url} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Account & Institution Details */}
                    <div className="border-b border-slate-100 pb-3 mb-3 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Institution</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">{schoolState?.name || "Corner Streams Academy"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Email</span>
                        <span className="font-semibold text-indigo-600 text-[11px] truncate max-w-[170px]">{currentUserProfile.email || "admin@cornerstreams.edu"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">License Tier</span>
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {schoolState?.subscription_tier === 'cbt_essentials' ? 'CBT Starter' : schoolState?.subscription_tier === 'cbt_plus_results' ? 'CBT Pro' : 'Enterprise Suite'}
                        </span>
                      </div>
                    </div>

                    {/* Nonye AI Tour Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsNonyeOnboardingOpen(true);
                      }}
                      className="w-full mb-2 py-2 px-3 bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 text-indigo-950 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Nonye AI Capabilities Tour</span>
                    </button>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>Sign Out Account</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
      </>
      )}

      {/* WORKFLOW CONTAINER */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* SIDEBAR NAVIGATION (TABLET & DESKTOP DISPLAY) */}
        {!isFocusMode && currentUserProfile.role !== 'Super_Admin' && (
          <aside className="hidden md:flex w-16 lg:w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 select-none transition-all duration-200">
            <div className="p-4 flex justify-center lg:justify-start shrink-0 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:inline">CORNER STREAMS OS</span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest lg:hidden">CS OS</span>
            </div>
            <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1.5 overflow-y-auto">
              {/* Role-tailored navigation items */}
              {currentUserProfile.role === 'School_Admin' && (
                <>
                  {(schoolState?.subscription_tier === 'cbt_essentials' || schoolState?.subscription_tier === 'cbt_plus_results') ? (
                    <>
                      <div className="px-3 py-1 text-[9px] font-black uppercase text-indigo-600 tracking-wider hidden lg:block">
                        CBT EXAM PORTAL
                      </div>
                      {[
                        { k: 'teachers', label: 'Teachers', icon: Users },
                        { k: 'broadsheets', label: 'Broadsheets', icon: TableProperties },
                        { k: 'receipt', label: 'Receipt', icon: Receipt },
                        { k: 'uploaded', label: 'Uploaded Exams', icon: FileText },
                        { k: 'live', label: 'Live Exams', icon: Play },
                        { k: 'completed', label: 'Completed Exams', icon: CheckCircle2 },
                        { k: 'settings', label: 'System Settings', icon: Settings }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.k ||
                          (item.k === 'uploaded' && (activeTab === 'cbt' || activeTab === 'cbt_portal')) ||
                          (item.k === 'teachers' && activeTab === 'rosters') ||
                          (item.k === 'broadsheets' && activeTab === 'broadsheet_vault') ||
                          (item.k === 'receipt' && activeTab === 'fees');
                        return (
                          <motion.button
                            key={item.k}
                            whileHover={{ scale: 1.02, x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectTab(item.k)}
                            className={`w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                            title={item.label}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                              <span className="hidden lg:inline">{item.label}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider hidden lg:block">
                        SCHOOL ADMIN DESK
                      </div>
                      {[
                        { k: 'overview', label: 'Executive Desk', icon: LayoutDashboard },
                        { k: 'rosters', label: 'Enrollment & Registries', icon: Users },
                        { k: 'classrooms', label: 'Academic Classrooms', icon: BookOpen },
                        { k: 'fees', label: 'Campus Bursary Desk', icon: Receipt },
                        { k: 'staff_payment', label: 'Staffs Payment', icon: Landmark },
                        { k: 'report_cards', label: 'Report Cards & Signatures', icon: FileCheck },
                        { k: 'broadsheet_vault', label: 'Broadsheet Vault & Matrix', icon: TableProperties },
                        { k: 'daily_attendance', label: 'Daily Attendance Registers', icon: Calendar },
                        { k: 'cbt', label: 'CBT Exam Portal (Starter/Pro)', icon: FileText },
                        { k: 'cbt_review', label: 'CBT Review & Publish', icon: Sparkles },
                        { k: 'result_dossiers', label: 'Student Result Dossiers', icon: Award },
                        { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                        { k: 'settings', label: 'System Settings', icon: Settings }
                      ].filter((item) => isNavUnlocked(item.k)).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.k || 
                          (item.k === 'overview' && activeTab === 'dashboard') ||
                          (item.k === 'classrooms' && (activeTab === 'classes' || activeTab === 'subjects')) ||
                          (item.k === 'rosters' && activeTab === 'teachers') ||
                          (item.k === 'fees' && activeTab === 'receipt') ||
                          (item.k === 'report_cards' && activeTab === 'completed') ||
                          (item.k === 'broadsheet_vault' && activeTab === 'broadsheets') ||
                          (item.k === 'cbt' && (activeTab === 'cbt' || activeTab === 'cbt_portal')) ||
                          (item.k === 'cbt_review' && (activeTab === 'cbt_review' || activeTab === 'uploaded' || activeTab === 'live'));
                        return (
                          <motion.button
                            key={item.k}
                            whileHover={{ scale: 1.02, x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectTab(item.k)}
                            className={`w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                            title={item.label}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                              <span className="hidden lg:inline">{item.label}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              {(currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') && (
                <>
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider hidden lg:block">
                    Faculty Workspace
                  </div>
                  {[
                    { k: 'overview', label: 'My Desk', icon: LayoutDashboard },
                    { k: 'scores', label: 'Scoring Grid', icon: BookOpen },
                    { k: 'attendance', label: 'Daily Attendance', icon: Calendar },
                    { k: 'broadsheets', label: 'Broadsheet Vault', icon: TableProperties },
                    { k: 'result_dossiers', label: 'Result Dossiers', icon: Award },
                    { k: 'cbt', label: 'CBT Exam Builder', icon: FileText },
                    { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                    { k: 'receipts', label: 'Academic Receipts', icon: Receipt },
                    { k: 'settings', label: 'System Settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.k ||
                      (item.k === 'cbt' && (activeTab === 'uploaded' || activeTab === 'live')) ||
                      (item.k === 'broadsheets' && activeTab === 'broadsheet_vault');
                    const isUnlocked = isNavUnlocked(item.k);
                    return (
                      <motion.button
                        key={item.k}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectTab(item.k)}
                        className={`w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                          <span className="hidden lg:inline">{item.label}</span>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[10px] hidden lg:inline" title="Upgrade Required">🔒</span>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              )}

              {currentUserProfile.role === 'Parent' && (
                <>
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider hidden lg:block">
                    Parent Portal
                  </div>
                  {[
                    { k: 'overview', label: 'Children Performance', icon: LayoutDashboard },
                    { k: 'receipt', label: 'Tuition Ledger & Receipts', icon: Receipt },
                    { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                    { k: 'settings', label: 'System Settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.k || (item.k === 'receipt' && activeTab === 'fees');
                    const isUnlocked = isNavUnlocked(item.k);
                    return (
                      <motion.button
                        key={item.k}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectTab(item.k)}
                        className={`w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                          <span className="hidden lg:inline">{item.label}</span>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[10px] hidden lg:inline" title="Upgrade Required">🔒</span>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              )}

              {currentUserProfile.role === 'Student' && (
                <>
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider hidden lg:block">
                    Student Portal
                  </div>
                  {[
                    { k: 'live', label: 'Live CBT Examinations', icon: Play },
                    { k: 'completed', label: 'Completed Exam History', icon: CheckCircle2 },
                    { k: 'settings', label: 'System Settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.k;
                    const isUnlocked = isNavUnlocked(item.k);
                    return (
                      <motion.button
                        key={item.k}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectTab(item.k)}
                        className={`w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span className="hidden lg:inline">{item.label}</span>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[10px] hidden lg:inline" title="Upgrade Required">🔒</span>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              )}

              {/* Common Sign Out Button */}
              <motion.button
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 mt-4 rounded-lg font-black text-xs text-rose-600 hover:bg-rose-50 select-none cursor-pointer transition-all duration-150 border border-transparent hover:border-rose-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="hidden lg:inline">Sign Out</span>
              </motion.button>
            </nav>

            {/* System status & visual sync indicator sidebar attachment */}
            <div className="mt-auto p-2 lg:p-4 border-t border-slate-100 shrink-0">
              <SidebarSyncIndicator />
            </div>
          </aside>
        )}

        {/* MOBILE TABLET SLIDE-OUT DRAWER */}
        {!isFocusMode && currentUserProfile.role !== 'Super_Admin' && (
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black z-40 md:hidden"
                />
                {/* Drawer Container */}
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl flex flex-col select-none md:hidden border-r border-slate-200"
                >
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-indigo-900 flex items-center justify-between bg-white dark:bg-indigo-950 text-slate-800 dark:text-white shrink-0">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo darkTheme={resolvedTheme === 'dark'} size={26} hideTagline={true} />
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-indigo-900 text-slate-600 dark:text-slate-200 transition cursor-pointer"
                    >
                      <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                  </div>

                  {/* Drawer Body - Impersonation */}
                  <div className="p-4 shrink-0 border-b border-slate-100 bg-slate-50/70">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Simulate Security Clearance</span>
                    <div className="mt-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {studentsProfileList.map((user) => {
                        const isSelected = currentUserProfile.id === user.id;
                        return (
                          <motion.button
                            key={user.id}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setCurrentUserProfile(user);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg text-left transition-all text-[11px] cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <img src={user.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-100" referrerPolicy="no-referrer" />
                            <div className="min-w-0 flex-1">
                              <p className={`leading-none truncate ${isSelected ? 'text-white font-bold' : 'text-slate-800 font-bold'}`}>
                                {user.fullName}
                              </p>
                              <p className={`text-[8.5px] uppercase tracking-wide leading-none mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {user.role.replace(/Class_Teacher|Non_Class_Teacher/g, 'Teacher').replace(/_/g, ' ')}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic menu items inside Mobile Drawer */}
                  <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    {currentUserProfile.role === 'School_Admin' && (
                      <>
                        {(schoolState?.subscription_tier === 'cbt_essentials' || schoolState?.subscription_tier === 'cbt_plus_results') ? (
                          <>
                            <div className="px-3 py-1 text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                              CBT EXAM PORTAL
                            </div>
                            {[
                              { k: 'teachers', label: 'Teachers', icon: Users },
                              { k: 'broadsheets', label: 'Broadsheets', icon: TableProperties },
                              { k: 'receipt', label: 'Receipt', icon: Receipt },
                              { k: 'uploaded', label: 'Uploaded Exams', icon: FileText },
                              { k: 'live', label: 'Live Exams', icon: Play },
                              { k: 'completed', label: 'Completed Exams', icon: CheckCircle2 },
                              { k: 'settings', label: 'System Settings', icon: Settings }
                            ].map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.k ||
                                (item.k === 'uploaded' && (activeTab === 'cbt' || activeTab === 'cbt_portal')) ||
                                (item.k === 'teachers' && activeTab === 'rosters') ||
                                (item.k === 'broadsheets' && activeTab === 'broadsheet_vault') ||
                                (item.k === 'receipt' && activeTab === 'fees');
                              return (
                                <motion.button
                                  key={item.k}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => { selectTab(item.k); setMobileMenuOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                                    isActive
                                      ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                                    {item.label}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </>
                        ) : (
                          <>
                            <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              School Admin Desk
                            </div>
                            {[
                              { k: 'overview', label: 'Executive Desk', icon: LayoutDashboard },
                              { k: 'rosters', label: 'Enrollment & Registries', icon: Users },
                              { k: 'classrooms', label: 'Academic Classrooms', icon: BookOpen },
                              { k: 'fees', label: 'Campus Bursary Desk', icon: Receipt },
                              { k: 'staff_payment', label: 'Staffs Payment', icon: Landmark },
                              { k: 'report_cards', label: 'Report Cards & Signatures', icon: FileCheck },
                              { k: 'broadsheet_vault', label: 'Broadsheet Vault & Matrix', icon: TableProperties },
                              { k: 'cbt', label: 'CBT Exam Portal (Starter/Pro)', icon: FileText },
                              { k: 'cbt_review', label: 'CBT Review & Publish Desk', icon: Sparkles },
                              { k: 'result_dossiers', label: 'Student Result Dossiers', icon: Award },
                              { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                              { k: 'settings', label: 'System Settings', icon: Settings }
                            ].filter((item) => isNavUnlocked(item.k)).map((item) => {
                              const Icon = item.icon;
                              const isActive = activeTab === item.k || 
                                (item.k === 'overview' && activeTab === 'dashboard') ||
                                (item.k === 'classrooms' && (activeTab === 'classes' || activeTab === 'subjects')) ||
                                (item.k === 'rosters' && activeTab === 'teachers') ||
                                (item.k === 'fees' && activeTab === 'receipt') ||
                                (item.k === 'report_cards' && activeTab === 'completed') ||
                                (item.k === 'broadsheet_vault' && activeTab === 'broadsheets') ||
                                (item.k === 'cbt' && (activeTab === 'cbt' || activeTab === 'cbt_portal')) ||
                                (item.k === 'cbt_review' && (activeTab === 'cbt_review' || activeTab === 'uploaded' || activeTab === 'live'));
                              const isUnlocked = isNavUnlocked(item.k);
                              return (
                                <motion.button
                                  key={item.k}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => { selectTab(item.k); setMobileMenuOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                                    isActive
                                      ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                                    {item.label}
                                  </div>
                                  {!isUnlocked && (
                                    <span className="text-[10px]" title="Upgrade Required">🔒</span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </>
                        )}
                      </>
                    )}

                    {(currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') && (
                      <>
                        <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Faculty Workspace
                        </div>
                        {[
                          { k: 'overview', label: 'My Desk', icon: LayoutDashboard },
                          { k: 'scores', label: 'Scoring Grid', icon: BookOpen },
                          { k: 'broadsheets', label: 'Broadsheet Vault', icon: TableProperties },
                          { k: 'result_dossiers', label: 'Result Dossiers', icon: Award },
                          { k: 'cbt', label: 'CBT Exam Builder', icon: FileText },
                          { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                          { k: 'receipts', label: 'Academic Receipts', icon: Receipt },
                          { k: 'settings', label: 'System Settings', icon: Settings }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.k ||
                            (item.k === 'cbt' && (activeTab === 'uploaded' || activeTab === 'live')) ||
                            (item.k === 'broadsheets' && activeTab === 'broadsheet_vault');
                          return (
                            <motion.button
                              key={item.k}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => { selectTab(item.k); setMobileMenuOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                              {item.label}
                            </motion.button>
                          );
                        })}
                      </>
                    )}

                    {currentUserProfile.role === 'Parent' && (
                      <>
                        <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Parent Portal
                        </div>
                        {[
                          { k: 'overview', label: 'Children Performance', icon: LayoutDashboard },
                          { k: 'receipt', label: 'Tuition Ledger & Receipts', icon: Receipt },
                          { k: 'messages', label: 'Messages & Broadcasts', icon: MessageSquare },
                          { k: 'settings', label: 'System Settings', icon: Settings }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.k || (item.k === 'receipt' && activeTab === 'fees');
                          return (
                            <motion.button
                              key={item.k}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => { selectTab(item.k); setMobileMenuOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                              {item.label}
                            </motion.button>
                          );
                        })}
                      </>
                    )}

                    {currentUserProfile.role === 'Student' && (
                      <>
                        <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Student Portal
                        </div>
                        {[
                          { k: 'live', label: 'Live CBT Examinations', icon: Play },
                          { k: 'completed', label: 'Completed Exam History', icon: CheckCircle2 },
                          { k: 'settings', label: 'System Settings', icon: Settings }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.k;
                          return (
                            <motion.button
                              key={item.k}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => { selectTab(item.k); setMobileMenuOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0 text-emerald-500" />
                              {item.label}
                            </motion.button>
                          );
                        })}
                      </>
                    )}

                    {/* 7. Sign Out */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 mt-4 rounded-lg font-black text-xs text-rose-600 hover:bg-rose-50 select-none cursor-pointer transition-all duration-150 border border-transparent shadow-sm"
                    >
                      <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                      Sign Out
                    </motion.button>
                  </nav>

                  <div className="p-4 border-t border-slate-100 shrink-0">
                    <SidebarSyncIndicator />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        )}

        {/* WORKSPACE & VIEWPORTS */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f4f6f8] overflow-y-auto scroll-smooth">
          
          {/* ACTIVE WORKSPACE RENDER BOX WITH DELUXE TRANSITION ASSISTANCE */}
          <div className={`flex-1 overflow-y-auto flex flex-col relative ${currentUserProfile.role === 'Super_Admin' || isFocusMode ? 'p-0' : 'p-2 sm:p-3.5 md:p-4'} scroll-smooth`}>
            {!isFocusMode && currentUserProfile.role !== 'Super_Admin' && (
              <DynamicGreeting 
                userProfile={currentUserProfile}
                schoolName={schoolState?.name || "Corner Streams Private School"}
                subscriptionTier={schoolState?.subscription_tier || "unified_enterprise"}
                activeTab={activeTab}
                onNavigateTab={(targetTab) => selectTab(targetTab)}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex-1 flex flex-col overflow-y-auto min-h-0 scroll-smooth"
              >
                {renderWorkspaceContent()}
              </motion.div>
            </AnimatePresence>
          </div>

        </main>
      </div>

      {/* REFINED SYSTEM FOOTER */}
      {!isFocusMode && (
        <footer className="h-8 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 shrink-0 uppercase font-bold select-none font-mono">
          <div className="flex gap-6">
            <span className="hidden sm:inline">Session: TERM 1 PREP</span>
            <span className="hidden sm:inline">DB Latency: <span className="text-indigo-600 font-bold">14ms</span></span>
            <span>Node: Nigeria-West-01</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span>Copyright ©️ 2026 cornerstreams@gmail.com</span>
          </div>
        </footer>
      )}

      {/* Slide-over Alert Notification Center */}
      <NotificationCenter 
        currentUserRole={currentUserProfile.role}
        currentUserId={currentUserProfile.id}
        onTabChange={(tab) => {
          let mappedTab = tab;
          
          if (tab === 'cbt_exam_engine') {
            if (currentUserProfile.role === 'Student') {
              mappedTab = 'live';
            } else if (currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') {
              mappedTab = 'uploaded';
            } else {
              mappedTab = 'uploaded';
            }
          } else if (tab === 'bursar_console') {
            mappedTab = 'receipt';
          } else if (tab === 'result_checker') {
            mappedTab = 'completed';
          } else if (tab === 'dashboard') {
            if (currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin') {
              mappedTab = 'classes';
            } else if (currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') {
              mappedTab = 'uploaded';
            } else if (currentUserProfile.role === 'Student') {
              mappedTab = 'live';
            } else if (currentUserProfile.role === 'Parent') {
              mappedTab = 'receipt';
            }
          }

          if (isTabVisible(mappedTab)) {
            setActiveTab(mappedTab);
            toast.info(`Navigated to ${mappedTab.replace(/_/g, ' ').toUpperCase()}`);
          } else {
            toast.error("Your current institutional license does not include this module.");
          }
        }}
        isMobile={false}
        notifications={notifications}
        setNotifications={setNotifications}
        isOpen={isNotificationOpen}
        setIsOpen={setIsNotificationOpen}
        hideTrigger={true}
      />

      {/* Floating Nonye AI Assistant Widget */}
      {currentView === 'app' && (
        <AiAssistantWidget 
          context={{
            currentView,
            activeTab,
            userRole: currentUserProfile.role,
            userName: currentUserProfile.fullName,
            schoolName: schoolState.name,
            subscriptionTier: schoolState.subscription_tier || 'unified_enterprise'
          }}
          isOpenControlled={isAssistantOpen}
          onOpenChange={setIsAssistantOpen}
          triggerPrompt={nonyeTriggerPrompt}
          onResetTriggerPrompt={() => setNonyeTriggerPrompt(null)}
        />
      )}

      {/* Nonye AI First-Login Capabilities Onboarding Modal */}
      {currentView === 'app' && (
        <NonyeOnboardingModal
          isOpen={isNonyeOnboardingOpen}
          onClose={() => setIsNonyeOnboardingOpen(false)}
          currentUserProfile={currentUserProfile}
          schoolName={schoolState.name}
          subscriptionTier={schoolState.subscription_tier || 'unified_enterprise'}
          onOpenAssistant={(prompt) => {
            setIsAssistantOpen(true);
            setNonyeTriggerPrompt(prompt || null);
          }}
        />
      )}

                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
