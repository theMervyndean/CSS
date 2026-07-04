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
import { BrandLogo, BrandLogoIcon } from './components/BrandLogo';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { NotificationCenter, DEFAULT_NOTIFICATIONS } from './components/NotificationCenter';
import { Notification } from './types';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Unified layouts
import PendingVerification from './pages/PendingVerification';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentPortal from './pages/ParentPortal';
import StudentDashboard from './pages/StudentDashboard';
import WelcomePack from './pages/WelcomePack';
import { Button } from './components/ui/button';
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
  FileText,
  Play,
  CheckCircle2
} from 'lucide-react';


export default function App() {
  // Theme state: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple'>(() => {
    const saved = localStorage.getItem('CS_THEME');
    return (saved as 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple') || 'system';
  });

  // Font family state: 'montserrat' | 'poppins' | 'inter' | 'mono' | 'serif'
  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('CS_FONT') || 'poppins';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-opt-montserrat', 'font-opt-poppins', 'font-opt-inter', 'font-opt-mono', 'font-opt-serif');
    root.classList.add(`font-opt-${activeFont}`);
    localStorage.setItem('CS_FONT', activeFont);
  }, [activeFont]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
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
      } else {
        root.classList.remove('dark');
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
  }, [theme]);

  // Main view router state definition
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string>('unified_enterprise');
  const [selectedPlanDuration, setSelectedPlanDuration] = useState<string>('full_session');

  // Authentication & impersonation state
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(mockUsers[0]); // Default to Super Admin David Macaulay
  const [isPublished, setIsPublished] = useState<boolean>(false); // Admin global publish state block
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [subSimDropdownOpen, setSubSimDropdownOpen] = useState<boolean>(false);

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

  // Keep schoolState updated with local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const sch = localStorage.getItem('CS_SCHOOL');
      if (sch) setSchoolState(JSON.parse(sch));
    };
    window.addEventListener('storage', handleStorageChange);
    // Also poll slightly to detect Super Admin overrides immediately
    const poll = setInterval(() => {
      const sch = localStorage.getItem('CS_SCHOOL');
      if (sch) {
        const parsed = JSON.parse(sch);
        if (JSON.stringify(parsed) !== JSON.stringify(schoolState)) {
          setSchoolState(parsed);
        }
      }
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(poll);
    };
  }, [schoolState]);

  // Mutable core database states
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

  // Save changes to localStorage for local persistence
  useEffect(() => {
    localStorage.setItem('CS_GRADES', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('CS_STUDENT_PROFILES', JSON.stringify(studentsProfileList));
  }, [studentsProfileList]);

  useEffect(() => {
    localStorage.setItem('CS_BILLING_LEDGER', JSON.stringify(billingRecords));
  }, [billingRecords]);

  // Photo upload and preset updates
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

  // Determine if a module is visible based on active subscription tier
  const isTabVisible = (tabKey: string) => {
    return ['classes', 'subjects', 'teachers', 'receipt', 'uploaded', 'live', 'completed', 'settings'].includes(tabKey);
  };

  // Redirect to first visible tab for role when profile changes
  useEffect(() => {
    if (currentUserProfile) {
      if (currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin') {
        setActiveTab('classes');
      } else if (currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') {
        setActiveTab('uploaded');
      } else if (currentUserProfile.role === 'Student') {
        setActiveTab('live');
      } else if (currentUserProfile.role === 'Parent') {
        setActiveTab('receipt');
      }
    }
  }, [currentUserProfile]);

  // Switch tab safely depending on roles
  const selectTab = (tab: string) => {
    if (isTabVisible(tab)) {
      setActiveTab(tab);
    } else {
      toast.error("Your current institutional license does not include this module.");
    }
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
    return (
      <CbtExamEngine
        currentProfile={currentUserProfile}
        activeTabOverride={activeTab}
        onLogout={() => setCurrentView('landing')}
      />
    );
    switch (activeTab) {
      case 'dashboard':
        if (currentUserProfile.role === 'Super_Admin') {
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
            />
          );
        }
        return (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            
            {/* INTEGRATED EXECUTIVE BENTO STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm border-l-4 border-l-indigo-600 transition hover:shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Enrollment</p>
                <p className="text-2xl font-black text-indigo-950 tracking-tight leading-none">{totalEnrollment.toLocaleString()}</p>
                <div className="flex gap-1.5 mt-2.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-50 text-indigo-700 font-bold tracking-wider uppercase">PRIMARY</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-700 font-bold tracking-wider uppercase">SECONDARY</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500 transition hover:shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">CBT Active Exams</p>
                <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none">
                  {activeExamsCount} <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Sessions</span>
                </p>
                <p className="text-[9px] text-emerald-700/80 mt-2.5 font-mono font-bold uppercase tracking-wide bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block">Resiliency Sync: ACTIVE</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm border-l-4 border-l-indigo-600 transition hover:shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tuition Collection</p>
                <p className="text-2xl font-black text-indigo-950 tracking-tight leading-none">
                  ₦{billingRecords.reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()} <span className="text-slate-400 text-xs font-medium">({getTuitionCollectionPercentage()}%)</span>
                </p>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${getTuitionCollectionPercentage()}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between transition hover:shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Grade Publication Release</p>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`w-full py-1.5 text-[9px] font-black uppercase rounded tracking-widest transition-all duration-300 ${
                    isPublished 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
                  }`}
                >
                  {isPublished ? 'Grades Published (Live)' : 'Unpublished (LOCKED)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto pb-4">
              {/* PRIMARY FEED: CONSTITUTIONAL PLATFORM OVERVIEW */}
              <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BrandLogoIcon size={28} />
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                        Zero-Paper Institutional Manifesto
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Welcome back, {currentUserProfile.fullName}. Your secure access layer is live.
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    By implementing the <strong>Corner Streams OS v1.0.4</strong> architecture, we seek to completely eliminate physical registers, paper test scripts, manual report compilations, and payment bottlenecks from schools. All resources are unified, synchronized, and secure.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
                      <h4 className="text-[10px] font-bold text-indigo-700 uppercase">Resilient CBT Engine</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Never suffer from network failures again. Exams can survive device reboots and crashes by saving answers and countdown times locally.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
                      <h4 className="text-[10px] font-bold text-indigo-700 uppercase">Dual-Mode Reports</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Toggle instantly between Half-Term scaled results (Test 1 & Test 2 scaled out of 40) and Full Cumulative Term Sheets.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 rounded-lg p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-[9px] font-bold tracking-widest text-indigo-300 uppercase">ACTIVE ROLE PRIVILEGE STATUS</p>
                    <h5 className="text-xs font-bold uppercase">{currentUserProfile.role.replace(/_/g, ' ')} PANEL</h5>
                    <p className="text-[11px] text-indigo-200 leading-relaxed">
                      {currentUserProfile.role === 'Super_Admin' && "Complete clearance: create examinations, publish terminal grades, bypass locks, update financial templates."}
                      {currentUserProfile.role === 'School_Admin' && "Admin clearance: edit grades, update biometric students passports, view payment histories."}
                      {currentUserProfile.role === 'Class_Teacher' && "Class teacher privilege: authorized to update raw student marks and add student biometric passports. Barrier blocks other classes."}
                      {currentUserProfile.role === 'Non_Class_Teacher' && "Subject expert privilege: strictly blocked from class-grading registry tables. Limited to subject reference."}
                      {currentUserProfile.role === 'Parent' && "Parent gateway: check your children's Half/Full Term grades, download official billing statements."}
                      {currentUserProfile.role === 'Student' && "Student view: access CBT testing, review calendar, grades strictly blockade and hidden to protect academic integrity."}
                    </p>
                  </div>
                  <button
                    onClick={() => selectTab('registry')}
                    className="px-3.5 py-1.5 bg-white text-indigo-950 text-[10px] uppercase font-black tracking-widest rounded shadow-sm hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
                  >
                    Inspect Registries
                  </button>
                </div>
              </div>

              {/* SECONDARY SIDEBAR: ACTIVE STATUS OVERVIEWS */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Institutional Arm Metrics</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Secondary Block', count: '412 Students', share: '33%', color: 'blue' },
                      { name: 'Primary Block', count: '516 Students', share: '41%', color: 'indigo' },
                      { name: 'Montessori Section', count: '184 Students', share: '15%', color: 'purple' },
                      { name: 'Creche & Nursery', count: '136 Students', share: '11%', color: 'pink' }
                    ].map((arm, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono">
                        <span className="font-sans font-bold text-slate-700">{arm.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px]">{arm.count}</span>
                          <span className={`px-1.5 py-0.2 rounded font-black text-[9px] bg-slate-100 text-slate-800`}>
                            {arm.share}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-150 text-indigo-950 p-4 rounded-xl space-y-2">
                  <div className="flex gap-1.5 items-center">
                    <Database className="w-4 h-4 text-indigo-700 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-tight text-indigo-900">Active Cache Serialization</h4>
                  </div>
                  <p className="text-[10px] leading-relaxed text-indigo-800/95 font-mono">
                    CS_CORE_DB successfully mounted in simulated local environment. Changes you make to student grade scores, passport photo updates, and billing statements are automatically serialized to standard browser localStorage keys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'cbt':
        return <CbtExamEngine currentProfile={currentUserProfile} onLogout={() => setCurrentView('landing')} />;
      case 'gradebook':
        return (
          <GradeBook
            currentProfile={currentUserProfile}
            grades={grades}
            onUpdateGrades={setGrades}
            studentsProfileList={studentsProfileList}
            onUpdateStudents={setStudentsProfileList}
          />
        );
      case 'financials':
        return (
          <FinancialStatements
            currentProfile={currentUserProfile}
            billingRecords={billingRecords}
            onUpdateBilling={setBillingRecords}
          />
        );
      case 'result_checker':
        return (
          <ResultChecker
            currentProfile={currentUserProfile}
            grades={grades}
            isPublished={isPublished}
            studentsProfileList={studentsProfileList}
          />
        );
      case 'registry':
        return <IdentityRegistry currentProfile={currentUserProfile} studentsProfileList={studentsProfileList} />;
      case 'hub':
        return <CommunicationHub currentProfile={currentUserProfile} />;
      case 'settings':
        return (
          <SettingsPanel
            currentUserProfile={currentUserProfile}
            theme={theme}
            setTheme={setTheme}
            activeFont={activeFont}
            setActiveFont={setActiveFont}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  if (currentView === 'landing') {
    return (
      <>
        <Toaster position="top-right" richColors theme="dark" />
        <LandingPage 
          onChangeView={setCurrentView} 
          onSetSelectedPlan={(plan, dur) => {
            setSelectedPlan(plan);
            setSelectedPlanDuration(dur);
          }}
        />
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        <Toaster position="top-right" richColors theme="dark" />
        <LoginPage 
          onLoginSuccess={(profile) => {
            setCurrentUserProfile(profile);
            setCurrentView('app');
          }}
          onChangeView={setCurrentView}
        />
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        <Toaster position="top-right" richColors theme="dark" />
        <RegisterPage 
          selectedPlan={selectedPlan}
          selectedPlanDuration={selectedPlanDuration}
          onRegisterSuccess={(profile) => {
            setCurrentUserProfile(profile);
            setCurrentView('app');
          }}
          onChangeView={setCurrentView}
        />
      </>
    );
  }

  if (schoolState.kill_switch === true && currentUserProfile.role !== 'Super_Admin') {
    return (
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
    );
  }

  // Handle school admin specific verification blocks
  if (currentUserProfile.role === 'School_Admin') {
    if (
      schoolState.verification_status === 'pending_verification' || 
      schoolState.verification_status === 'pending_review' ||
      schoolState.verification_status === 'paid_pending_verification'
    ) {
      return (
        <>
          <Toaster position="top-right" richColors />
          <PendingVerification currentProfile={currentUserProfile} onLogout={() => setCurrentView('landing')} />
        </>
      );
    }
    if (schoolState.verification_status === 'active' && !schoolState.welcome_complete) {
      return (
        <>
          <Toaster position="top-right" richColors />
          <WelcomePack currentProfile={currentUserProfile} onCompleteWelcome={() => {
            const sch = JSON.parse(localStorage.getItem('CS_SCHOOL') || '{}');
            sch.welcome_complete = true;
            localStorage.setItem('CS_SCHOOL', JSON.stringify(sch));
            setSchoolState(sch);
          }} onLogout={() => setCurrentView('landing')} />
        </>
      );
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      
      {/* UNIFIED DESIGN MASTER HEADER */}
      {/* Tier 1: Mobile-only Top Bar: Logo & Bell separated */}
      <div className="lg:hidden h-14 bg-indigo-950 text-white flex items-center justify-between px-4 shrink-0 border-b border-indigo-900 shadow-sm relative z-25">
        <BrandLogo darkTheme={true} size={28} hideTagline={true} className="transition-transform duration-300" />
        
        {/* Mobile Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors duration-150 flex items-center justify-center focus:outline-none"
          aria-label="Notification Center"
          id="bell-trigger-mobile-top"
        >
          <Bell className="w-5 h-5 text-emerald-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-indigo-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Tier 2: Mobile-only Sub-Bar: Navigation Toggle and Profile picture far apart */}
      <div className="lg:hidden bg-indigo-900 text-white px-4 py-2 flex items-center justify-between border-b border-indigo-850 shrink-0 relative z-20">
        {/* Left Section: Mobile Navigation Toggle Menu */}
        <div>
          {currentUserProfile.role === 'Super_Admin' ? (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-indigo-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-indigo-800 transition-colors cursor-pointer shrink-0"
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
              className="flex items-center gap-2 p-1 bg-indigo-950/45 hover:bg-indigo-950/80 rounded-full border border-indigo-800 cursor-pointer pr-3 shadow-sm min-w-0 transition-all duration-150"
            >
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-400/50 bg-indigo-950 shrink-0">
                <img src={currentUserProfile.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-indigo-950 shadow-sm" />
            </div>
            
            <div className="text-left font-bold min-w-0 pr-0.5">
              <p className="text-[10px] text-white leading-none font-black truncate max-w-[95px]">
                {currentUserProfile.fullName}
              </p>
              <p className="text-[7.5px] text-emerald-400 font-extrabold uppercase tracking-widest mt-0.5 leading-none truncate max-w-[95px]">
                {currentUserProfile.role.replace(/Class_Teacher|Non_Class_Teacher/g, 'Teacher').replace(/_/g, ' ')}
              </p>
            </div>
            <ChevronRight className={`w-3 h-3 text-emerald-400 transition-transform duration-200 shrink-0 ${userDropdownOpen ? 'rotate-90' : ''}`} />
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

                  {/* Simulated Subscription Tier on Mobile */}
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                      Simulate Subscription Tier
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: 'unified_enterprise', label: 'Enterprise' },
                        { value: 'cbt_essentials', label: 'CBT Only' },
                        { value: 'financial_ledger', label: 'Ledger Only' },
                        { value: 'digital_reports', label: 'Reports Only' }
                      ].map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => {
                            const updated = {
                              ...schoolState,
                              subscription_tier: tier.value
                            };
                            localStorage.setItem('CS_SCHOOL', JSON.stringify(updated));
                            setSchoolState(updated);
                            toast.success(`Simulated subscription tier updated to: ${tier.label.toUpperCase()}`);
                          }}
                          className={`p-2 border rounded-lg text-left transition-all text-[11px] font-bold ${
                            schoolState?.subscription_tier === tier.value
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-400 font-black shadow-sm'
                              : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{tier.label}</span>
                            {schoolState?.subscription_tier === tier.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Persona Switch */}
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                      Impersonation Console
                    </span>
                    <div className="space-y-1 mt-1">
                      {studentsProfileList.map((user) => (
                        <motion.button
                          key={user.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setCurrentUserProfile(user);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            currentUserProfile.id === user.id ? 'bg-indigo-50 font-bold text-indigo-950 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs leading-none font-bold text-slate-800 truncate">{user.fullName}</p>
                            <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-wide leading-none">{user.role.replace(/_/g, ' ')}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Desktop-only Navigation Header */}
      <nav className="hidden lg:flex h-16 bg-indigo-950 text-white items-center justify-between px-6 shrink-0 border-b border-indigo-900 shadow-md relative z-20">
        
        {/* Left Section: Company Brand Logos & Bell */}
        <div className="flex items-center gap-3 min-w-[48px]">
          <div className="hidden lg:block">
            <BrandLogo darkTheme={true} size={32} hideTagline={true} className="transition-transform duration-300 hover:scale-[1.01]" />
          </div>
          <div className="h-6 w-px bg-indigo-900/60 hidden lg:block" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="hidden lg:flex relative p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors duration-150 items-center justify-center focus:outline-none"
            aria-label="Notification Center"
            id="bell-trigger-desktop-top"
          >
            <Bell className="w-5 h-5 text-emerald-400" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-indigo-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Center Section: Security Console on Desktop */}
        <div className="flex-1 flex justify-center items-center">
          {/* Desktop Security Console */}
          <div className="hidden lg:flex items-center gap-4 border border-indigo-900 bg-indigo-900/55 p-1.5 rounded-xl px-3 shadow-inner relative">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-widest hidden xl:inline">Security Console:</span>
            </div>

            {/* Custom Animated Persona Select Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="bg-indigo-950 border border-indigo-800 hover:border-indigo-600 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-emerald-400/50 bg-indigo-900">
                  <img src={currentUserProfile.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="max-w-[145px] truncate">{currentUserProfile.fullName}</span>
                <span className="text-[8px] bg-indigo-900 text-indigo-300 font-black tracking-wider px-1.5 py-0.2 rounded uppercase scale-90">
                  {currentUserProfile.role.replace(/Class_Teacher|Non_Class_Teacher/g, 'Teacher').split('_')[0]}
                </span>
                <ChevronRight className={`w-3 h-3 text-emerald-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-90' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[280px] bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 max-h-[360px] overflow-y-auto"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                        Select Simulated Persona
                      </div>
                      {studentsProfileList.map((user) => (
                        <motion.button
                          key={user.id}
                          whileHover={{ scale: 1.015, x: 2 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => {
                            setCurrentUserProfile(user);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                            currentUserProfile.id === user.id ? 'bg-indigo-50/80 font-bold text-indigo-950 border-r-4 border-indigo-500' : 'text-slate-700'
                          }`}
                        >
                          <img src={user.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] leading-tight font-black uppercase text-slate-800 truncate">{user.fullName}</p>
                            <p className="text-[8px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{user.role.replace(/_/g, ' ')}</p>
                          </div>
                          {currentUserProfile.id === user.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Subscription Tier Selector */}
            <div className="relative border-l border-indigo-800/80 pl-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSubSimDropdownOpen(!subSimDropdownOpen)}
                className="bg-indigo-950 border border-indigo-800 hover:border-indigo-600 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[145px] truncate">
                  {schoolState?.subscription_tier === 'unified_enterprise' && 'Unified Enterprise'}
                  {schoolState?.subscription_tier === 'cbt_essentials' && 'CBT Essentials'}
                  {schoolState?.subscription_tier === 'financial_ledger' && 'Financial Ledger'}
                  {schoolState?.subscription_tier === 'digital_reports' && 'Digital Reports'}
                </span>
                <ChevronRight className={`w-3 h-3 text-emerald-400 transition-transform duration-200 ${subSimDropdownOpen ? 'rotate-90' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {subSimDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-35" onClick={() => setSubSimDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[240px] bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-[360px] overflow-y-auto"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                        Simulate Subscription Tier
                      </div>
                      {[
                        { value: 'unified_enterprise', label: 'Unified Enterprise', desc: 'All features active' },
                        { value: 'cbt_essentials', label: 'CBT Essentials Only', desc: 'Only CBT testing & results' },
                        { value: 'financial_ledger', label: 'Financial Records Only', desc: 'Only tuition & ledger' },
                        { value: 'digital_reports', label: 'Reports & Grading Only', desc: 'Only gradebook & reports' }
                      ].map((tier) => (
                        <motion.button
                          key={tier.value}
                          whileHover={{ scale: 1.015, x: 2 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => {
                            const updated = {
                              ...schoolState,
                              subscription_tier: tier.value
                            };
                            localStorage.setItem('CS_SCHOOL', JSON.stringify(updated));
                            setSchoolState(updated);
                            toast.success(`Simulated subscription tier updated to: ${tier.label.toUpperCase()}`);
                            setSubSimDropdownOpen(false);
                          }}
                          className={`w-full flex flex-col items-start px-3 py-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                            schoolState?.subscription_tier === tier.value ? 'bg-indigo-50/80 font-bold text-indigo-950 border-r-4 border-indigo-500' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] leading-tight font-black uppercase text-slate-800">{tier.label}</span>
                            {schoolState?.subscription_tier === tier.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">{tier.desc}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle publish button inside top nav */}
            {currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'School_Admin' ? (
              <div className="flex items-center gap-2 border-l border-indigo-800/80 pl-3">
                <span className="text-[9px] uppercase text-indigo-300 font-bold hidden xl:inline">Publish State:</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPublished(!isPublished)}
                  className={`text-[9.5px] px-2.5 py-1 font-black rounded uppercase tracking-wider transition-colors duration-200 cursor-pointer shadow-sm ${
                    isPublished 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  {isPublished ? 'Published' : 'Locked'}
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[9px] bg-indigo-950/40 px-2 py-1 rounded border border-indigo-900">
                <span className={`font-mono font-bold ${isPublished ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPublished ? '● PUBLISHED' : '🔒 LOCKED'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Desktop Active Simulated Persona Display */}
        <div className="flex items-center gap-4 relative min-w-[48px] justify-end">
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

                    {/* Simulated Subscription Tier on Mobile/Desktop Dropdown */}
                    <div className="border-b border-slate-100 pb-3 mb-3">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                        Simulate Subscription Tier
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { value: 'unified_enterprise', label: 'Enterprise' },
                          { value: 'cbt_essentials', label: 'CBT Only' },
                          { value: 'financial_ledger', label: 'Ledger Only' },
                          { value: 'digital_reports', label: 'Reports Only' }
                        ].map((tier) => (
                          <button
                            key={tier.value}
                            onClick={() => {
                              const updated = {
                                ...schoolState,
                                subscription_tier: tier.value
                              };
                              localStorage.setItem('CS_SCHOOL', JSON.stringify(updated));
                              setSchoolState(updated);
                              toast.success(`Simulated subscription tier updated to: ${tier.label.toUpperCase()}`);
                            }}
                            className={`p-2 border rounded-lg text-left transition-all text-[11px] font-bold ${
                              schoolState?.subscription_tier === tier.value
                                ? 'bg-indigo-50 text-indigo-950 border-indigo-400 font-black shadow-sm'
                                : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{tier.label}</span>
                              {schoolState?.subscription_tier === tier.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simulated Persona Switch */}
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none block mb-2">
                        Impersonation Console
                      </span>
                      <div className="space-y-1 mt-1">
                        {studentsProfileList.map((user) => (
                          <motion.button
                            key={user.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setCurrentUserProfile(user);
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                              currentUserProfile.id === user.id ? 'bg-indigo-50 font-bold text-indigo-950 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-none font-bold text-slate-800 truncate">{user.fullName}</p>
                              <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-wide leading-none">{user.role.replace(/_/g, ' ')}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* WORKFLOW CONTAINER */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* SIDEBAR NAVIGATION (TABLET & DESKTOP DISPLAY) */}
        {currentUserProfile.role !== 'Super_Admin' && (
          <aside className="hidden md:flex w-16 lg:w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 select-none transition-all duration-200">
            <div className="p-4 flex justify-center lg:justify-start shrink-0 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:inline">CBT EXAM PORTAL</span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest lg:hidden">CBT</span>
            </div>
            <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1.5 overflow-y-auto">
              
              {/* 1. School Overview: (a) Classes (b) Subjects (c) Teachers (Only for School_Admin) */}
              {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin') && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider hidden lg:block">
                    School Overview
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectTab('classes')}
                    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                      activeTab === 'classes'
                        ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title="Classes"
                  >
                    <BookOpen className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span className="hidden lg:inline">Classes</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectTab('subjects')}
                    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                      activeTab === 'subjects'
                        ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title="Subjects"
                  >
                    <GraduationCap className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span className="hidden lg:inline">Subjects</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectTab('teachers')}
                    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                      activeTab === 'teachers'
                        ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title="Teachers"
                  >
                    <Users className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span className="hidden lg:inline">Teachers</span>
                  </motion.button>
                </div>
              )}

              {/* 2. Receipt (Admin & Parents) */}
              {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Parent') && (
                <motion.button
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectTab('receipt')}
                  className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                    activeTab === 'receipt'
                      ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title="Receipt"
                >
                  <Receipt className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span className="hidden lg:inline">Receipt</span>
                </motion.button>
              )}

              {/* 3. Uploaded Exams (Admin & Teachers) */}
              {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') && (
                <motion.button
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectTab('uploaded')}
                  className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                    activeTab === 'uploaded'
                      ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title="Uploaded Exams"
                >
                  <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="hidden lg:inline">Uploaded Exams</span>
                </motion.button>
              )}

              {/* 4. Live Exams (Admin, Teachers, Students) */}
              {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher' || currentUserProfile.role === 'Student') && (
                <motion.button
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectTab('live')}
                  className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                    activeTab === 'live'
                      ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title="Live Exams"
                >
                  <Play className="w-4 h-4 shrink-0 text-emerald-500 animate-pulse" />
                  <span className="hidden lg:inline">Live Exams</span>
                </motion.button>
              )}

              {/* 5. Completed Exams (Admin, Teachers, Students, Parents) */}
              <motion.button
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectTab('completed')}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                  activeTab === 'completed'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="Completed Exams"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="hidden lg:inline">Completed Exams</span>
              </motion.button>

              {/* 6. System Settings */}
              <motion.button
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectTab('settings')}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="System Settings"
              >
                <Settings className="w-4 h-4 shrink-0 text-indigo-500" />
                <span className="hidden lg:inline">System Settings</span>
              </motion.button>

              {/* 7. Sign Out */}
              <motion.button
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView('landing')}
                className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 mt-4 rounded-lg font-black text-xs text-rose-600 hover:bg-rose-50 select-none cursor-pointer transition-all duration-150 border border-transparent hover:border-rose-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="hidden lg:inline">Sign Out</span>
              </motion.button>
            </nav>

            {/* System status sidebar attachment */}
            <div className="mt-auto p-2 lg:p-4 border-t border-slate-100 shrink-0">
              <div className="bg-indigo-950 rounded-xl p-2 lg:p-3 text-white border border-indigo-900 shadow-inner flex flex-col items-center lg:items-start text-center lg:text-left">
                <p className="text-[10px] opacity-75 uppercase font-extrabold tracking-widest leading-none hidden lg:block">System Status</p>
                <div className="flex items-center gap-2 mt-0 lg:mt-2 justify-center lg:justify-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[10px] font-mono tracking-tight leading-none text-emerald-300 font-bold hidden lg:inline">Resilience Live</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* MOBILE TABLET SLIDE-OUT DRAWER */}
        {currentUserProfile.role !== 'Super_Admin' && (
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
                  <div className="p-4 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white shrink-0">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo darkTheme={true} size={26} hideTagline={true} />
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-md hover:bg-indigo-900 text-slate-200 transition cursor-pointer"
                    >
                      <X className="w-5 h-5 text-emerald-400" />
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
                    
                    {/* 1. School Overview: (a) Classes (b) Subjects (c) Teachers (Only for School_Admin) */}
                    {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin') && (
                      <div className="space-y-1">
                        <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          School Overview
                        </div>
                        
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { selectTab('classes'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                            activeTab === 'classes'
                              ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 shrink-0 text-indigo-500" />
                          Classes
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { selectTab('subjects'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                            activeTab === 'subjects'
                              ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 shrink-0 text-indigo-500" />
                          Subjects
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { selectTab('teachers'); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                            activeTab === 'teachers'
                              ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Users className="w-4 h-4 shrink-0 text-indigo-500" />
                          Teachers
                        </motion.button>
                      </div>
                    )}

                    {/* 2. Receipt (Admin & Parents) */}
                    {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Parent') && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { selectTab('receipt'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          activeTab === 'receipt'
                            ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Receipt className="w-4 h-4 shrink-0 text-indigo-500" />
                        Receipt
                      </motion.button>
                    )}

                    {/* 3. Uploaded Exams (Admin & Teachers) */}
                    {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher') && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { selectTab('uploaded'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          activeTab === 'uploaded'
                            ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
                        Uploaded Exams
                      </motion.button>
                    )}

                    {/* 4. Live Exams (Admin, Teachers, Students) */}
                    {(currentUserProfile.role === 'School_Admin' || currentUserProfile.role === 'Super_Admin' || currentUserProfile.role === 'Class_Teacher' || currentUserProfile.role === 'Non_Class_Teacher' || currentUserProfile.role === 'Student') && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { selectTab('live'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                          activeTab === 'live'
                            ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Play className="w-4 h-4 shrink-0 text-emerald-500 animate-pulse" />
                        Live Exams
                      </motion.button>
                    )}

                    {/* 5. Completed Exams (Admin, Teachers, Students, Parents) */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { selectTab('completed'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                        activeTab === 'completed'
                          ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      Completed Exams
                    </motion.button>

                    {/* 6. System Settings */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { selectTab('settings'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs select-none cursor-pointer transition-all duration-150 ${
                        activeTab === 'settings'
                          ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Settings className="w-4 h-4 shrink-0 text-indigo-500" />
                      System Settings
                    </motion.button>

                    {/* 7. Sign Out */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 mt-4 rounded-lg font-black text-xs text-rose-600 hover:bg-rose-50 select-none cursor-pointer transition-all duration-150 border border-transparent shadow-sm"
                    >
                      <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                      Sign Out
                    </motion.button>
                  </nav>

                  <div className="p-4 border-t border-slate-100 shrink-0">
                    <div className="bg-indigo-950 rounded-xl p-3 text-white border border-indigo-900 shadow-inner">
                      <p className="text-[10px] opacity-75 uppercase font-extrabold tracking-widest leading-none">System Status</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] font-mono tracking-tight leading-none text-emerald-300 font-bold">Resilience Live</span>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        )}

        {/* WORKSPACE & VIEWPORTS */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f4f6f8] overflow-y-auto scroll-smooth">
          
          {/* ACTIVE WORKSPACE RENDER BOX WITH DELUXE TRANSITION ASSISTANCE */}
          <div className={`flex-1 overflow-y-auto flex flex-col relative ${currentUserProfile.role === 'Super_Admin' ? 'p-0' : 'p-3 sm:p-4'} scroll-smooth`}>
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

      {/* Slide-over Alert Notification Center */}
      <NotificationCenter 
        currentUserRole={currentUserProfile.role}
        currentUserId={currentUserProfile.id}
        onTabChange={(tab) => {
          setActiveTab(tab);
          toast.info(`Navigated to ${tab.replace(/_/g, ' ').toUpperCase()}`);
        }}
        isMobile={false}
        notifications={notifications}
        setNotifications={setNotifications}
        isOpen={isNotificationOpen}
        setIsOpen={setIsNotificationOpen}
        hideTrigger={true}
      />

    </div>
    </>
  );
}
