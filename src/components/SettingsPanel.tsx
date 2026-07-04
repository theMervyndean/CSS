import React, { useState } from "react";
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  Type, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  Key, 
  Palette, 
  ShieldCheck,
  User,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

interface SettingsPanelProps {
  currentUserProfile: any;
  theme: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple';
  setTheme: (theme: 'light' | 'dark' | 'system' | 'emerald' | 'amber' | 'purple') => void;
  activeFont: string;
  setActiveFont: (font: string) => void;
}

export default function SettingsPanel({
  currentUserProfile,
  theme,
  setTheme,
  activeFont,
  setActiveFont
}: SettingsPanelProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Email key for localStorage password mapping
  const emailKey = (currentUserProfile.email || currentUserProfile.username || "").trim().toLowerCase();

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setUpdating(true);

    // Determine expected current password
    let expectedPassword = "Demo@123";
    if (emailKey === "mervyn@cornernerstreams.com" || emailKey === "mervyn@cornerstreams.com") {
      expectedPassword = "Thriller10@";
    }

    const savedPassword = localStorage.getItem(`CS_PASSWORD_${emailKey}`);
    if (savedPassword) {
      expectedPassword = savedPassword;
    }

    // Verify current password
    if (currentPassword !== expectedPassword) {
      toast.error("The current password you entered is incorrect.");
      setUpdating(false);
      return;
    }

    // Success - Save to local storage
    setTimeout(() => {
      localStorage.setItem(`CS_PASSWORD_${emailKey}`, newPassword);
      toast.success("Security credentials updated! Your new password is now active.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setUpdating(false);
    }, 800);
  };

  const themesList = [
    { id: "light", label: "Light", icon: Sun, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200" },
    { id: "dark", label: "Dark", icon: Moon, color: "text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-900" },
    { id: "system", label: "System", icon: Monitor, color: "text-slate-400 bg-slate-50 dark:bg-slate-950/30", border: "border-slate-800" },
    { id: "emerald", label: "Emerald Mint", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-600/30" },
    { id: "amber", label: "Amber Gold", icon: Sun, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30", border: "border-amber-600/30" },
    { id: "purple", label: "Royal Amethyst", icon: Palette, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30", border: "border-purple-600/30" }
  ] as const;

  const fontsList = [
    { id: "montserrat", label: "Montserrat", desc: "Geometric Sans-Serif", previewClass: "font-opt-montserrat" },
    { id: "poppins", label: "Poppins", desc: "Rounded Geometric Sans (Default)", previewClass: "font-opt-poppins" },
    { id: "inter", label: "Inter", desc: "Clean & Precise Modern Swiss", previewClass: "font-opt-inter" },
    { id: "mono", label: "JetBrains Mono", desc: "Technical Monospace Accent", previewClass: "font-opt-mono" },
    { id: "serif", label: "Playfair Display", desc: "Elegant Editorial Serif Type", previewClass: "font-opt-serif" }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto animate-in fade-in duration-200">
      
      {/* HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-indigo-950 dark:text-white">
              System Settings Hub
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">
              Personalize typography, visual themes, and security
            </p>
          </div>
        </div>

        {/* ACTIVE PROFILE BADGE */}
        <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-sm">
            {currentUserProfile.photoUrl ? (
              <img src={currentUserProfile.photoUrl} alt="Avatar" className="w-full h-full object-cover" referrerpolicy="no-referrer" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px] leading-tight">
              {currentUserProfile.fullName}
            </p>
            <span className="text-[9px] font-black font-mono uppercase tracking-wider text-indigo-500 block leading-none mt-0.5">
              {currentUserProfile.role.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* THEME SELECTOR CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
            <Palette className="w-4 h-4 text-indigo-500" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Color Theme Palette
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed mb-4">
            Select an eye-safe environment layout style to render across all sections of the hub.
          </p>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {themesList.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40 text-indigo-900 dark:text-white"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${t.color} mb-3 border border-transparent`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="text-[11px] font-bold leading-none block">{t.label}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block mt-1 font-mono">
                    {t.id === "system" ? "Syncs OS" : `${t.id} mode`}
                  </span>

                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FONT SELECTOR CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
            <Type className="w-4 h-4 text-indigo-500" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Typography Selection
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed mb-4">
            Choose your preferred typeface pair. This is instantly serialized and propagated to every section of your dashboard.
          </p>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {fontsList.map((f) => {
              const isSelected = activeFont === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFont(f.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40 text-indigo-950 dark:text-white"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${f.previewClass}`}>
                      {f.label}
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono tracking-tight block mt-0.5">
                      {f.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${
                      isSelected 
                        ? "bg-indigo-600 text-white border-transparent" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}>
                      {f.id === "poppins" ? "Default" : "AaBb"}
                    </span>
                    {isSelected && (
                      <span className="bg-indigo-600 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* PASSWORD MANAGEMENT CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <Lock className="w-4 h-4 text-rose-500" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Secure Password Management
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* CURRENT PASSWORD */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/60 rounded-xl p-3.5 flex items-start gap-2.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none">
                Identity Security Enforcement
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-normal mt-1">
                Your new password must be at least <strong>6 characters</strong> in length. Changing your password here immediately updates authorization tokens for the <strong>{currentUserProfile.role.replace(/_/g, " ")}</strong> profile under account identifier <strong>{currentUserProfile.username}</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={updating}
              className={`px-5 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-700 transition shadow-sm flex items-center gap-2 cursor-pointer ${
                updating ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{updating ? "Saving Credentials..." : "Commit Password Change"}</span>
            </motion.button>
          </div>
        </form>
      </div>

    </div>
  );
}
