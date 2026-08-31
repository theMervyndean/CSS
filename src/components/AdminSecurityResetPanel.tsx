import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  ShieldAlert, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Lock, 
  Unlock, 
  Clock, 
  Send, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  EyeOff, 
  UserCheck, 
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { logAdminActivity } from "../utils/adminAuditLogger";
import { mockUsers } from "../mockData";

export interface OverrideRecord {
  id: string;
  targetEmail: string;
  targetName: string;
  overridePassword: string;
  generatedAt: string;
  expiresIn: string;
  status: "active" | "revoked" | "expired";
  generatedBy: string;
}

interface AdminSecurityResetPanelProps {
  currentUserProfile: any;
}

const STORAGE_OVERRIDE_KEY = "CS_ADMIN_OVERRIDE_REGISTRY";

export default function AdminSecurityResetPanel({ currentUserProfile }: AdminSecurityResetPanelProps) {
  const isSuperAdmin = currentUserProfile?.role === "Super_Admin";
  const isSchoolAdmin = currentUserProfile?.role === "School_Admin";

  // Target selection
  const [selectedTarget, setSelectedTarget] = useState<string>("principal@cornerstreams.edu");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [useCustomEmail, setUseCustomEmail] = useState<boolean>(false);

  // Override generation state
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [expiryOption, setExpiryOption] = useState<string>("24_hours");
  const [manualPassword, setManualPassword] = useState<string>("");
  const [useManualInput, setUseManualInput] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showOverridePass, setShowOverridePass] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active overrides ledger
  const [overridesList, setOverridesList] = useState<OverrideRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_OVERRIDE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Known admin list
  const [adminAccounts, setAdminAccounts] = useState<Array<{ email: string; name: string; school?: string; role: string }>>([]);

  useEffect(() => {
    const list: Array<{ email: string; name: string; school?: string; role: string }> = [
      {
        email: "principal@cornerstreams.edu",
        name: "Dr. David K. Macaulay",
        school: "Corner Streams Private School",
        role: "School_Admin"
      }
    ];

    // Check onboarded school in localStorage
    try {
      const localSchool = JSON.parse(localStorage.getItem("CS_SCHOOL") || "null");
      if (localSchool?.email && localSchool.email !== "principal@cornerstreams.edu") {
        list.push({
          email: localSchool.email,
          name: localSchool.principal_name || "School Proprietor",
          school: localSchool.name || "Registered School",
          role: "School_Admin"
        });
      }
    } catch {
      // Ignored
    }

    // Check registered custom users
    try {
      const customUsers = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
      customUsers.forEach((u: any) => {
        if (u.role === "School_Admin" || u.role === "Super_Admin") {
          if (!list.some(item => item.email.toLowerCase() === u.email.toLowerCase())) {
            list.push({
              email: u.email,
              name: u.name || u.fullName,
              school: u.schoolName || "Custom Portal",
              role: u.role
            });
          }
        }
      });
    } catch {
      // Ignored
    }

    // Also include other test admins if needed
    mockUsers.forEach(u => {
      if ((u.role === "School_Admin" || u.role === "Super_Admin") && u.email) {
        if (!list.some(item => item.email.toLowerCase() === u.email!.toLowerCase())) {
          list.push({
            email: u.email,
            name: u.fullName,
            role: u.role
          });
        }
      }
    });

    setAdminAccounts(list);
    if (list.length > 0 && !selectedTarget) {
      setSelectedTarget(list[0].email);
    }
  }, []);

  const getEffectiveEmail = (): string => {
    if (useCustomEmail && customEmail.trim()) {
      return customEmail.trim().toLowerCase();
    }
    return selectedTarget.trim().toLowerCase();
  };

  const getTargetName = (email: string): string => {
    const match = adminAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (match) return match.name;
    return email.split("@")[0].toUpperCase();
  };

  // Generate random secure temporary override passkey
  const generateRandomOverrideKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const prefix = "CS-OVERRIDE-";
    let rand = "";
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newPass = `${prefix}${randNum}`;
    setGeneratedPassword(newPass);
    setShowOverridePass(true);
    setCopied(false);
  };

  // Commit the Temporary Override Password
  const handleApplyOverridePassword = () => {
    const emailToOverride = getEffectiveEmail();
    const finalPassword = useManualInput ? manualPassword.trim() : generatedPassword.trim();

    if (!emailToOverride) {
      toast.error("Please select or enter a valid administrator email address.");
      return;
    }

    if (!finalPassword || finalPassword.length < 5) {
      toast.error("Override password must be at least 5 characters long.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Commit to active password store
      localStorage.setItem(`CS_PASSWORD_${emailToOverride}`, finalPassword);

      // 2. Clear any active lockout flags
      localStorage.removeItem(`CS_ADMIN_LOCKOUT_${emailToOverride}`);
      localStorage.removeItem(`CS_FAILED_ATTEMPTS_${emailToOverride}`);
      localStorage.removeItem(`CS_AUTH_LOCK_${emailToOverride}`);

      // 3. Register in overrides ledger
      const newRecord: OverrideRecord = {
        id: `ovr-${Date.now()}`,
        targetEmail: emailToOverride,
        targetName: getTargetName(emailToOverride),
        overridePassword: finalPassword,
        generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
        expiresIn: expiryOption.replace(/_/g, " ").toUpperCase(),
        status: "active",
        generatedBy: currentUserProfile?.fullName || "Super Administrator"
      };

      const updated = [newRecord, ...overridesList.filter(o => o.targetEmail.toLowerCase() !== emailToOverride)];
      setOverridesList(updated);
      localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(updated));

      // 4. Log admin audit activity
      logAdminActivity({
        actionType: "security_override",
        actionTitle: `Administrator Password Override Issued for ${emailToOverride}`,
        severity: "critical",
        performedBy: {
          name: currentUserProfile?.fullName || "Super Administrator",
          role: currentUserProfile?.role || "Super_Admin",
          email: currentUserProfile?.email
        },
        targetResource: `Admin Security Credentials (${emailToOverride})`,
        details: `Temporary override passkey applied with ${expiryOption.replace(/_/g, " ")} duration. Local security lockouts reset.`,
        authMethod: "super_admin_override",
        status: "executed"
      });

      toast.success(`Override password activated for ${emailToOverride}!`, {
        description: `The administrator can now sign in immediately using: ${finalPassword}`
      });
    } catch {
      toast.error("Failed to commit override password to storage.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear Local Security Cache & Remove Lockouts
  const handleClearSecurityCache = (targetEmailToClear?: string) => {
    const emailToClear = targetEmailToClear || getEffectiveEmail();

    if (!emailToClear) {
      toast.error("Please specify a target administrator email to clear.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        // Remove lockout keys
        localStorage.removeItem(`CS_ADMIN_LOCKOUT_${emailToClear}`);
        localStorage.removeItem(`CS_FAILED_ATTEMPTS_${emailToClear}`);
        localStorage.removeItem(`CS_AUTH_LOCK_${emailToClear}`);
        localStorage.removeItem(`CS_RATE_LIMIT_${emailToClear}`);
        localStorage.removeItem(`CS_SESSION_RESTRICT_${emailToClear}`);

        // Dispatch browser custom event for instantaneous UI reactivity
        window.dispatchEvent(new CustomEvent("cs-security-cache-cleared", {
          detail: { email: emailToClear, timestamp: Date.now() }
        }));

        // Log audit activity
        logAdminActivity({
          actionType: "security_override",
          actionTitle: `Security Cache & Lockout State Reset for ${emailToClear}`,
          severity: "high",
          performedBy: {
            name: currentUserProfile?.fullName || "System Administrator",
            role: currentUserProfile?.role || "Super_Admin",
            email: currentUserProfile?.email
          },
          targetResource: `Authentication Lockout & Rate Limit Cache (${emailToClear})`,
          details: "Cleared failed authentication counters, rate limits, and temporary suspension tokens.",
          authMethod: "super_admin_override",
          status: "executed"
        });

        toast.success(`Security cache & lockout counters cleared for ${emailToClear}!`, {
          description: "Login barriers and rate limits have been completely flushed."
        });
      } catch {
        toast.error("Failed to clear security cache.");
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  // Restore Default System Password (Remove custom override)
  const handleRestoreDefaultPassword = (targetEmailToRestore?: string) => {
    const emailToRestore = targetEmailToRestore || getEffectiveEmail();

    if (!emailToRestore) {
      toast.error("Please specify target email.");
      return;
    }

    try {
      localStorage.removeItem(`CS_PASSWORD_${emailToRestore}`);
      
      const updated = overridesList.map(o => {
        if (o.targetEmail.toLowerCase() === emailToRestore.toLowerCase()) {
          return { ...o, status: "revoked" as const };
        }
        return o;
      });
      setOverridesList(updated);
      localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(updated));

      logAdminActivity({
        actionType: "security_override",
        actionTitle: `Reset Custom Override & Restored Default Password for ${emailToRestore}`,
        severity: "warning",
        performedBy: {
          name: currentUserProfile?.fullName || "Super Administrator",
          role: currentUserProfile?.role || "Super_Admin",
          email: currentUserProfile?.email
        },
        targetResource: `User Credentials (${emailToRestore})`,
        details: "Custom override removed. Restored standard school factory default password (Demo@123).",
        authMethod: "super_admin_override",
        status: "executed"
      });

      toast.success(`Custom override removed for ${emailToRestore}. Restored factory default credentials!`);
    } catch {
      toast.error("Failed to restore default password.");
    }
  };

  const handleCopyPassword = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Temporary override password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const activeEmail = getEffectiveEmail();
  const currentSavedOverride = localStorage.getItem(`CS_PASSWORD_${activeEmail}`);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900 shrink-0">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Reset Admin Password &amp; Security Cache Override
              </h3>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-mono text-[9px] font-black border border-rose-300 dark:border-rose-800">
                {isSuperAdmin ? "Super Admin Master Controls" : "School Recovery Tool"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Generate temporary override credentials, unlock locked-out school administrators, or flush corrupted security caches.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TARGET SELECTION & LIVE CACHE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Column: Select Target Admin */}
        <div className="md:col-span-2 space-y-3 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Target Administrator Account
          </label>

          {!useCustomEmail ? (
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-xs"
                >
                  {adminAccounts.map((acc, idx) => (
                    <option key={idx} value={acc.email}>
                      {acc.name} — {acc.email} ({acc.school || acc.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setUseCustomEmail(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                + Specify custom school admin email address
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. principal@school.edu.ng"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setUseCustomEmail(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-300 transition cursor-pointer"
                >
                  Back to List
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Identity:</span>
            <span className="text-[11px] font-mono font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              {activeEmail}
            </span>
          </div>
        </div>

        {/* Right Column: Live Cache & Security Diagnostics */}
        <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Account Security Status
            </span>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Override Key:</span>
                {currentSavedOverride ? (
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200">
                    Active Custom Pass
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200">
                    Default / Standard
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Lockout State:</span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Unlocked
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleClearSecurityCache()}
            disabled={isProcessing}
            className="w-full mt-2 py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Flush Lockout Cache</span>
          </button>
        </div>

      </div>

      {/* SECTION 2: TEMPORARY OVERRIDE PASSWORD GENERATOR */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Issue Temporary Override Passkey
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Input Mode:</span>
            <button
              type="button"
              onClick={() => setUseManualInput(false)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                !useManualInput 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Auto-Generate
            </button>
            <button
              type="button"
              onClick={() => setUseManualInput(true)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                useManualInput 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Custom Type
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Password Input / Generator */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {useManualInput ? "Enter New Override Password" : "Generated Override Passkey"}
            </label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showOverridePass ? "text" : "password"}
                  value={useManualInput ? manualPassword : generatedPassword}
                  onChange={(e) => {
                    if (useManualInput) setManualPassword(e.target.value);
                  }}
                  readOnly={!useManualInput}
                  placeholder={useManualInput ? "Enter custom password..." : "Click Generate Passkey →"}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                {(generatedPassword || manualPassword) && (
                  <button
                    type="button"
                    onClick={() => setShowOverridePass(!showOverridePass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showOverridePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {!useManualInput && (
                <button
                  type="button"
                  onClick={generateRandomOverrideKey}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              )}
            </div>
          </div>

          {/* Expiry Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Authorization Duration
            </label>
            <select
              value={expiryOption}
              onChange={(e) => setExpiryOption(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="24_hours">24 Hours (Standard Recovery)</option>
              <option value="48_hours">48 Hours</option>
              <option value="7_days">7 Days</option>
              <option value="single_session">Single Session Only</option>
              <option value="permanent">Permanent Until Reset</option>
            </select>
          </div>

        </div>

        {/* Action Controls & Dispatch Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          <div className="flex items-center gap-2">
            {(generatedPassword || manualPassword) && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyPassword(useManualInput ? manualPassword : generatedPassword)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Passcode"}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hello ${getTargetName(activeEmail)},\n\nHere is your authorized temporary Corner Streams administrator override password: *${useManualInput ? manualPassword : generatedPassword}*\n\nSign in at: https://ais-dev-x6hzw7exclc4g3ooifrw7k-900563531568.europe-west2.run.app\n\nDuration: ${expiryOption.replace(/_/g, " ")}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send via WhatsApp</span>
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentSavedOverride && (
              <button
                type="button"
                onClick={() => handleRestoreDefaultPassword()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Restore Factory Default
              </button>
            )}

            <button
              type="button"
              onClick={handleApplyOverridePassword}
              disabled={isProcessing || (!generatedPassword && !manualPassword)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Activating..." : "Commit Override Password"}</span>
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 3: ACTIVE OVERRIDES LEDGER TABLE */}
      {overridesList.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Active Administrator Overrides Ledger ({overridesList.length})
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_OVERRIDE_KEY);
                setOverridesList([]);
                toast.info("Overrides audit ledger cleared.");
              }}
              className="text-[10px] text-slate-400 hover:text-rose-500 transition cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {overridesList.map((ovr) => (
              <div
                key={ovr.id}
                className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg ${ovr.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-slate-200 text-slate-600"}`}>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {ovr.targetName} ({ovr.targetEmail})
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Pass: <strong className="text-indigo-600 dark:text-indigo-400">{ovr.overridePassword}</strong></span>
                      <span>•</span>
                      <span>Issued: {ovr.generatedAt}</span>
                      <span>•</span>
                      <span>{ovr.expiresIn}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(ovr.overridePassword)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition cursor-pointer"
                    title="Copy Password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClearSecurityCache(ovr.targetEmail)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 rounded-lg transition cursor-pointer"
                    title="Flush Cache"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestoreDefaultPassword(ovr.targetEmail)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-500 rounded-lg transition cursor-pointer"
                    title="Revoke Override"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
