import React, { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui-stubs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Eye, EyeOff, Lock, User, ArrowLeft, ArrowRight, Check, 
  MessageSquare, Key, Sparkles, GraduationCap, Users, Landmark, 
  HeartHandshake, Zap, Copy, ChevronDown, ChevronUp, UserCheck
} from "lucide-react";
import { mockUsers } from "../mockData";
import { UserProfile } from "../types";
import { signInWithGoogle } from "../lib/firebase";
import { dispatchPageViewNotification } from "../lib/notifications";

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onChangeView: (view: 'landing' | 'login' | 'register' | 'app') => void;
}

// Dedicated test credentials for every stream
const STREAM_TEST_ACCOUNTS = [
  {
    id: "stream-admin",
    streamTitle: "Stream Admin",
    roleName: "School Admin (Principal)",
    email: "principal@cornerstreams.edu",
    password: "Demo@123",
    role: "School_Admin",
    userName: "Dr. David K. Macaulay",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    activeColor: "hover:border-indigo-500 hover:bg-indigo-50/50",
    icon: Landmark,
    description: "Multi-campus control, fee ledgers, broadsheets, CBT management & staff rosters."
  },
  {
    id: "stream-teacher",
    streamTitle: "Stream Teacher",
    roleName: "Class & Subject Educator",
    email: "f.adebayo@cornerstreams.edu",
    password: "Demo@123",
    role: "Class_Teacher",
    userName: "Mrs. Folasade Adebayo (SS 2A)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activeColor: "hover:border-emerald-500 hover:bg-emerald-50/50",
    icon: Users,
    description: "Live gradebook, attendance register, automated comments & CBT question proctoring."
  },
  {
    id: "stream-parent",
    streamTitle: "Stream Parent",
    roleName: "Parent & Guardian Portal",
    email: "alaobenson@gmail.com",
    password: "Demo@123",
    role: "Parent",
    userName: "Chief Alao Benson",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    activeColor: "hover:border-amber-500 hover:bg-amber-50/50",
    icon: HeartHandshake,
    description: "Student performance dossier, term report cards, tuition invoices & school announcements."
  },
  {
    id: "stream-student",
    streamTitle: "Stream Student",
    roleName: "Learner & Examination Hub",
    email: "folasade@cornerstreams.edu",
    password: "Demo@123",
    role: "Student",
    userName: "Folasade Amira Adekunle (SS 2)",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    activeColor: "hover:border-sky-500 hover:bg-sky-50/50",
    icon: GraduationCap,
    description: "Active online CBT engine, instant score computation, terminal results & AI study tutor."
  },
  {
    id: "stream-superadmin",
    streamTitle: "Super Admin",
    roleName: "System Operator",
    email: "mervyn@cornernerstreams.com",
    password: "Thriller10@",
    role: "Super_Admin",
    userName: "Mervyndean Hilary",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    activeColor: "hover:border-purple-500 hover:bg-purple-50/50",
    icon: Shield,
    description: "Corner Streams platform operator, school onboarding verification & system audit."
  }
];

export default function LoginPage({ onLoginSuccess, onChangeView }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    dispatchPageViewNotification("Sign In & Authentication Portal");
  }, []);

  // Passcode protection state for Stream test credentials
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [demoPasscode, setDemoPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const handleToggleDemoAccess = () => {
    if (isDemoUnlocked) {
      setIsDemoUnlocked(false);
      setShowDemoPanel(false);
      toast.info("Test credentials locked.");
    } else {
      setDemoPasscode("");
      setPasscodeError("");
      setShowPasscodeModal(true);
    }
  };

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (demoPasscode.trim() === "12345") {
      setIsDemoUnlocked(true);
      setShowDemoPanel(true);
      setShowPasscodeModal(false);
      setPasscodeError("");
      toast.success("Stream test credentials unlocked!");
    } else {
      setPasscodeError("Invalid passcode. Please request the authorization key from Corner Streams Admin.");
    }
  };

  // WhatsApp Onboarding Secure Code verification fields
  const [loginMode, setLoginMode] = useState<'credentials' | 'whatsapp'>('credentials');
  const [whatsappLoginId, setWhatsappLoginId] = useState("");
  const [whatsappLoginCode, setWhatsappLoginCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [popupBlockedNotice, setPopupBlockedNotice] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  const handleQuickStreamLogin = (account: typeof STREAM_TEST_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoginMode('credentials');
    toast.success(`Streaming into ${account.streamTitle} (${account.userName})...`);
    
    // Find matching user profile
    let profile = mockUsers.find(
      u => u.email?.toLowerCase() === account.email.toLowerCase()
    );
    if (!profile) {
      profile = mockUsers.find(u => u.role === account.role);
    }
    if (profile) {
      setLoading(true);
      setTimeout(() => {
        onLoginSuccess(profile!);
        setLoading(false);
      }, 450);
    }
  };

  const handleFillCredentials = (account: typeof STREAM_TEST_ACCOUNTS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEmail(account.email);
    setPassword(account.password);
    setLoginMode('credentials');
    toast.info(`Pre-filled credentials for ${account.streamTitle}`);
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setPopupBlockedNotice(false);
      const { user, profile } = await signInWithGoogle();
      toast.success(`Authenticated with Google via Firebase! Welcome ${profile.fullName || user.email}.`);
      onLoginSuccess(profile);
    } catch (error: any) {
      console.warn("Firebase Google Sign-In notification:", error?.code || error?.message);
      if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
        setPopupBlockedNotice(true);
        toast.error("Google Sign-In popup was blocked by the browser. Please sign in below using your login email & password, or open the app in a new window.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.info("Google Sign-In popup was closed before completion.");
      } else if (error?.code === 'auth/cancelled-popup-request') {
        // Ignored duplicate request
      } else {
        toast.error(error.message || "Failed to authenticate with Google. Please use email & password sign-in below.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const emailKey = email.trim().toLowerCase();
      
      // Enforce exclusive password for Corner Streams Super Admin
      if (emailKey === "mervyn@cornernerstreams.com" || emailKey === "mervyn@cornerstreams.com") {
        if (password !== "Thriller10@") {
          toast.error("Invalid password for Corner Streams Super Admin.");
          setLoading(false);
          return;
        }
      }

      const customPassword = localStorage.getItem(`CS_PASSWORD_${emailKey}`);
      
      // Enforce custom password if registered via WhatsApp Onboard
      if (customPassword && password !== customPassword) {
        toast.error("Invalid password for this registered school.");
        setLoading(false);
        return;
      }

      // Subscription-specific testing account intercepts:
      let customSchoolTier: string | null = null;
      if (emailKey === "cbt_only@cornerstreams.edu") {
        customSchoolTier = "cbt_essentials";
      } else if (emailKey === "ledger_only@cornerstreams.edu") {
        customSchoolTier = "financial_ledger";
      } else if (emailKey === "reports_only@cornerstreams.edu") {
        customSchoolTier = "digital_reports";
      } else if (emailKey === "enterprise@cornerstreams.edu") {
        customSchoolTier = "unified_enterprise";
      }

      let matchedProfile: UserProfile | undefined;

      if (customSchoolTier) {
        // Automatically sync or initialize standard mock school with the selected tier
        const currentLocalSchool = JSON.parse(localStorage.getItem("CS_SCHOOL") || "null");
        const baseSchool = currentLocalSchool || {
          id: "sch-0042",
          name: "Corner Streams Private School",
          principal_name: "Dr. David K. Macaulay",
          email: "principal@cornerstreams.edu",
          phone: "+234 814 188 0550",
          logo_url: "",
          verification_status: "active",
          welcome_complete: true,
          benchmark: 50,
          classes: ["Primary 1", "Primary 2", "JSS 1", "JSS 2", "SS 1", "SS 2", "SS 3"]
        };
        
        const defaultSchool = {
          ...baseSchool,
          subscription_tier: customSchoolTier,
          verification_status: "active", // Force verify so testing is immediate
        };
        localStorage.setItem("CS_SCHOOL", JSON.stringify(defaultSchool));
        
        matchedProfile = {
          id: "usr-school-admin-1",
          username: "CS-SCH-001",
          fullName: `Dr. David K. Macaulay`,
          role: "School_Admin",
          email: emailKey,
          phone: "+234 814 188 0550",
          photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        };
      } else {
        // Direct username, email, or demo correlation
        matchedProfile = mockUsers.find(
          (u) =>
            u.email?.toLowerCase() === email.toLowerCase() ||
            u.username.toLowerCase() === email.trim().toLowerCase()
        );
      }

      // Support alternative email for Super Admin (mervyn@cornerstreams.com)
      if (!matchedProfile && emailKey === "mervyn@cornerstreams.com") {
        matchedProfile = mockUsers.find(u => u.role === "Super_Admin");
      }

      // Look up in custom registered users
      if (!matchedProfile) {
        const customUsers = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
        const localUser = customUsers.find((u: any) => u.email?.toLowerCase() === emailKey);
        const localSchool = JSON.parse(localStorage.getItem("CS_SCHOOL") || "null");
        
        if (localUser) {
          matchedProfile = {
            id: localUser.id,
            username: localUser.email.split("@")[0].toUpperCase(),
            fullName: localUser.name,
            role: "School_Admin",
            email: localUser.email,
            phone: localSchool ? localSchool.phone : "WhatsApp verified",
            photoUrl: localSchool?.logo_url || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150"
          };
        } else if (localSchool && (localSchool.email?.toLowerCase() === emailKey || localSchool.principal_name?.toLowerCase() === emailKey)) {
          matchedProfile = {
            id: `usr-admin-${Math.floor(1000 + Math.random() * 9000)}`,
            username: localSchool.email.split("@")[0].toUpperCase(),
            fullName: localSchool.principal_name,
            role: "School_Admin",
            email: localSchool.email,
            phone: localSchool.phone,
            photoUrl: localSchool.logo_url || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150",
            arm: localSchool.arms ? localSchool.arms[0] : "Secondary"
          };
        }
      }

      // Default fallback if someone enters custom demo emails mentioned in user files
      if (!matchedProfile) {
        if (email.includes("admin") || email.toLowerCase() === "super@cornerstreams.com") {
          matchedProfile = mockUsers.find(u => u.role === "Super_Admin");
        } else if (email.includes("teacher")) {
          matchedProfile = mockUsers.find(u => u.role === "Class_Teacher");
        } else if (email.includes("parent")) {
          matchedProfile = mockUsers.find(u => u.role === "Parent");
        } else if (email.includes("student") || email.includes("adaeze")) {
          matchedProfile = mockUsers.find(u => u.role === "Student");
        }
      }

      if (matchedProfile) {
        toast.success(`Welcome back, ${matchedProfile.fullName}! (${matchedProfile.role})`);
        onLoginSuccess(matchedProfile);
        setLoading(false);
      } else {
        // Fallback: If not matched, auto create an admin profile or toast failure
        toast.error("Credentials not recognized. Please use a valid School email with your created password, or select a demo role below.");
        setLoading(false);
      }
    }, 750);
  };

  const handleWhatsAppLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappLoginId) {
      toast.error("Please enter your registered email or WhatsApp number.");
      return;
    }
    if (!whatsappLoginCode || whatsappLoginCode.length < 6) {
      toast.error("Please enter your complete 6-digit WhatsApp security code.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const emailOrPhone = whatsappLoginId.trim().toLowerCase();
      // Look up locally dispatched keys
      const storedCode = localStorage.getItem(`CS_WA_CODE_${emailOrPhone}`);
      
      // Look for a registered school or profile
      const localSchool = JSON.parse(localStorage.getItem("CS_SCHOOL") || "null");
      
      let isCodeValid = false;
      let matchedEmail = "";
      
      if (storedCode && storedCode === whatsappLoginCode) {
        isCodeValid = true;
        matchedEmail = emailOrPhone;
      } else if (localSchool) {
        const localSchoolEmail = (localSchool.email || "").toLowerCase();
        const localSchoolPhone = (localSchool.phone || "").replace(/\D/g, "");
        const cleanLoginId = emailOrPhone.replace(/\D/g, "");
        
        const generalCode = localStorage.getItem(`CS_WA_CODE_${localSchoolEmail}`);
        if (generalCode && generalCode === whatsappLoginCode) {
          if (emailOrPhone === localSchoolEmail || (cleanLoginId && localSchoolPhone.includes(cleanLoginId))) {
            isCodeValid = true;
            matchedEmail = localSchoolEmail;
          }
        }
      }

      // Special fallback system audit access codes
      if (whatsappLoginCode === "994503" || whatsappLoginCode === "294827" || whatsappLoginCode === "119483") {
        isCodeValid = true;
        matchedEmail = localSchool ? localSchool.email : "bursar@cornerstreams.edu.ng";
      }

      if (isCodeValid) {
        // Automatically activate school on match
        if (localSchool && localSchool.email?.toLowerCase() === matchedEmail.toLowerCase()) {
          if (localSchool.verification_status !== "active") {
            localSchool.verification_status = "active";
            localStorage.setItem("CS_SCHOOL", JSON.stringify(localSchool));
            
            const receipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
            if (receipts.length > 0) {
              receipts[0].status = "approved";
              localStorage.setItem("CS_RECEIPTS", JSON.stringify(receipts));
            }
          }
        }

        let matchedProfile = mockUsers.find(
          (u) => u.email?.toLowerCase() === matchedEmail.toLowerCase()
        );

        if (!matchedProfile) {
          const list = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
          const localMatch = list.find((u: any) => u.email?.toLowerCase() === matchedEmail.toLowerCase());
          if (localMatch) {
            matchedProfile = {
              id: localMatch.id,
              username: localMatch.email.split("@")[0].toUpperCase(),
              fullName: localMatch.name,
              role: "School_Admin",
              email: localMatch.email,
              phone: localSchool ? localSchool.phone : "WhatsApp Active",
              photoUrl: localSchool?.logo_url || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150"
            };
          }
        }

        if (!matchedProfile) {
          matchedProfile = {
            id: `usr-admin-${Math.floor(1000 + Math.random() * 9000)}`,
            username: matchedEmail.split("@")[0].toUpperCase(),
            fullName: localSchool ? localSchool.principal_name : "School Administrator",
            role: "School_Admin",
            email: matchedEmail,
            phone: localSchool ? localSchool.phone : "WhatsApp Verified",
            photoUrl: localSchool?.logo_url || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150"
          };
        }

        toast.success(`Welcome back, ${matchedProfile.fullName}! Handshake token approved.`);
        onLoginSuccess(matchedProfile);
      } else {
        toast.error("Invalid security code or unregistered credentials. Please verify your entries.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col justify-between text-slate-800 selection:bg-emerald-500 selection:text-white relative font-sans w-full max-w-full overflow-x-hidden viewport-fit-screen">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 via-transparent to-transparent -z-10" />
      <div className="absolute top-20 right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      {/* Mini header */}
      <div className="max-w-[1600px] mx-auto w-full px-6 h-16 flex items-center justify-center relative border-b border-slate-200">
        <button
          onClick={() => onChangeView('landing')}
          className="absolute left-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Back To Homepage</span>
        </button>

        {/* Centered Brand Logo */}
        <div className="py-1 flex items-center justify-center">
          <BrandLogo darkTheme={false} size={24} />
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10"
        >
          <div className="text-center space-y-2.5 mb-5">
            <h2 className="font-sans text-2xl font-black bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent uppercase tracking-tight">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed font-sans">
              Enter your login details to stream in your dashboard
            </p>
          </div>

            {/* Google Sign-in with Firebase Auth */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 border border-slate-300 hover:border-slate-400 rounded-xl shadow-xs transition duration-200 cursor-pointer text-xs disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
            </button>

            {popupBlockedNotice && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-[11px] font-bold text-amber-900 leading-snug">
                  Browser popup blocked.
                </p>
                <p className="text-[10px] text-amber-800 font-medium mt-0.5 leading-normal">
                  Your browser prevented the Google Sign-In popup from opening. Please enable popups for this site, or continue below with Password Sign In or WhatsApp Code.
                </p>
              </div>
            )}

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                Or continue with
              </span>
            </div>
          </div>

          {/* Custom Dual Mode Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 border border-slate-200/60 rounded-xl mb-5 text-[9.5px] font-black uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
              }}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                loginMode === 'credentials'
                  ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              <Lock size={11} />
              <span>Password Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('whatsapp');
              }}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                loginMode === 'whatsapp'
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              <MessageSquare size={11} />
              <span>WhatsApp Code</span>
            </button>
          </div>

          {loginMode === 'whatsapp' ? (
            <form onSubmit={handleWhatsAppLogin} className="space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-3 text-[10px] text-slate-600 leading-normal font-sans text-left">
                <span className="font-bold text-emerald-800">💬 Registrar Activation Gate:</span> Enter your school's registered email or WhatsApp number and the 6-digit credential check code received on WhatsApp after transaction dispatch.
              </div>

              <div className="text-left">
                <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                  Registrar Email or WhatsApp Mobile No.
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bursar@school.edu or +234..."
                    value={whatsappLoginId}
                    onChange={(e) => setWhatsappLoginId(e.target.value)}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 rounded-lg py-2.5 pl-9 pr-4 transition outline-none font-bold"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                  6-Digit WhatsApp Activation Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key size={14} className="text-emerald-500" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 529483"
                    value={whatsappLoginCode}
                    onChange={(e) => setWhatsappLoginCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-sm font-mono tracking-[0.2em] text-slate-900 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 rounded-lg py-2.5 outline-none font-black transition"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-xs font-black uppercase tracking-wider mt-2 cursor-pointer bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white shadow-md border-0 rounded-xl"
              >
                {loading ? "Verifying Handshake..." : "Verify & Stream"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFormLogin} className="space-y-4 text-left">
              <div>
                <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                  Corner Streams ID or School Login
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-SEC-0042 or school email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 rounded-lg py-2.5 pl-9 pr-4 transition outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                  Enter Password Or Pin
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 rounded-lg py-2.5 pl-9 pr-10 transition outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-xs font-black uppercase tracking-wider mt-2 cursor-pointer bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white shadow-md border-0 rounded-xl"
              >
                {loading ? "Streaming..." : "Stream"}
              </Button>
            </form>
          )}

          {/* Dummy Login Details for Every Stream (Testing Console) */}
          <div className="mt-6 pt-5 border-t border-slate-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                  Test Credentials (Every Stream)
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleDemoAccess}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition"
              >
                <span>{isDemoUnlocked ? "Lock / Hide" : "Show"}</span>
                {isDemoUnlocked ? <Lock size={11} className="text-emerald-600" /> : <Lock size={11} className="text-indigo-600" />}
              </button>
            </div>

            {!isDemoUnlocked && (
              <p className="text-[9.5px] text-slate-500 italic mt-0.5">
                Stream test accounts are protected. Click <strong>Show</strong> and enter the Admin authorization key to unlock.
              </p>
            )}

            <AnimatePresence>
              {isDemoUnlocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-2.5">
                    Click <strong className="text-emerald-600">1-Click Stream</strong> to test any stream portal immediately, or <strong className="text-indigo-600">Fill</strong> to populate the form fields.
                  </p>

                  <div className="space-y-2">
                    {STREAM_TEST_ACCOUNTS.map((acc) => {
                      const IconComp = acc.icon;
                      return (
                        <div
                          key={acc.id}
                          className={`p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 transition-all ${acc.activeColor} text-left flex flex-col gap-1.5`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`p-1 rounded-md border text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${acc.badgeColor}`}>
                                <IconComp size={10} className="shrink-0" />
                                <span>{acc.streamTitle}</span>
                              </span>
                              <span className="text-xs font-black text-slate-800 truncate">
                                {acc.userName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleFillCredentials(acc, e)}
                                title="Pre-fill email & password"
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
                              >
                                Fill
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStreamLogin(acc)}
                                title="Instantly log in to test this stream"
                                className="px-2.5 py-1 bg-gradient-to-r from-indigo-700 to-emerald-600 hover:brightness-110 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                              >
                                <Zap size={10} />
                                <span>1-Click Stream</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] font-mono text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-slate-150">
                            <div className="flex items-center gap-1 truncate">
                              <span className="text-slate-400 font-sans font-bold text-[8.5px] uppercase">ID/Email:</span>
                              <span className="font-bold text-slate-800">{acc.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-sans font-bold text-[8.5px] uppercase">Pass:</span>
                              <span className="font-bold text-emerald-700">{acc.password}</span>
                            </div>
                          </div>

                          <p className="text-[9px] text-slate-500 font-medium leading-tight line-clamp-1">
                            {acc.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Onboarding Navigation Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
            School not onboarded?{" "}
            <button
              type="button"
              onClick={() => onChangeView('register')}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Get Started (Onboard Your School)
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
        <div>© 2026 Corner Streams. All rights reserved.</div>
      </div>

      {/* ADMIN PASSCODE CHECK MODAL FOR STREAM TEST CREDENTIALS */}
      <AnimatePresence>
        {showPasscodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Admin Authorization
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter access passcode to view test credentials.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyPasscode} className="space-y-3 mt-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                    Passcode
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter Passcode (e.g. 12345)"
                    value={demoPasscode}
                    onChange={(e) => {
                      setDemoPasscode(e.target.value);
                      setPasscodeError("");
                    }}
                    className="w-full text-center text-sm font-mono tracking-[0.25em] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                  {passcodeError && (
                    <p className="text-[10px] text-rose-500 font-medium mt-1">
                      {passcodeError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasscodeModal(false);
                      setPasscodeError("");
                    }}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-indigo-700 to-emerald-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
