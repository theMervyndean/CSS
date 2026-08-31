import React, { useState } from "react";
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  MessageSquare,
  Bot,
  Award,
  CreditCard,
  Layers,
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  Lock,
  Globe,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export interface InteractivePlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onTierChange?: (newTier: string) => void;
}

export function InteractivePlanComparisonModal({
  isOpen,
  onClose,
  currentTier = "unified_enterprise",
  onTierChange
}: InteractivePlanComparisonModalProps) {
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"termly" | "annual">("termly");
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);

  if (!isOpen) return null;

  const normalizeTier = (tierStr: string) => {
    if (tierStr === "cbt_essentials" || tierStr === "starter") return "starter";
    if (tierStr === "digital_reports") return "digital_reports";
    if (tierStr === "cbt_plus_results" || tierStr === "pro" || tierStr === "growth") return "pro";
    return "enterprise";
  };

  const activeTierCode = normalizeTier(currentTier);

  const handleSelectTier = (tierKey: string, tierName: string) => {
    let rawTierValue = "unified_enterprise";
    if (tierKey === "starter") rawTierValue = "cbt_essentials";
    if (tierKey === "digital_reports") rawTierValue = "digital_reports";
    if (tierKey === "pro") rawTierValue = "cbt_plus_results";
    if (tierKey === "enterprise") rawTierValue = "unified_enterprise";

    try {
      const sch = localStorage.getItem("CS_SCHOOL");
      if (sch) {
        const parsed = JSON.parse(sch);
        parsed.subscription_tier = rawTierValue;
        localStorage.setItem("CS_SCHOOL", JSON.stringify(parsed));
        window.dispatchEvent(new Event("cs_school_updated"));
      }
    } catch (e) {}

    if (onTierChange) {
      onTierChange(rawTierValue);
    }

    toast.success(`🎉 Subscription License updated to ${tierName}!`, {
      description: `All associated features and quotas have been unlocked in real-time.`
    });
    onClose();
  };

  const handleActivateTrial = (tierKey: string, tierName: string) => {
    setIsTrialActive(true);
    handleSelectTier(tierKey, `${tierName} (14-Day Free Trial)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Corner Streams Subscription Matrix
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  3-Tier SaaS Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compare plans, feature availability, notification quotas, and unlock enterprise multi-campus operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* BILLING CYCLE TOGGLE */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("termly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  selectedBillingCycle === "termly"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Termly Billing
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("annual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedBillingCycle === "annual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Annual (Save 15%)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Close Comparison Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TIERS GRID CONTAINER */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          
          {/* 14-DAY FREE TRIAL HIGHLIGHT BANNER */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    SPECIAL OFFER: 14-Day Full-Access Free Trial
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-mono font-black uppercase">
                    Zero Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Try Professional or Enterprise Tier risk-free for 14 days. Instant setup &bull; No upfront payment required &bull; Cancel anytime.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleActivateTrial("pro", "Professional Tier")}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 hover:opacity-95 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Claim 14-Day Free Trial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* TIER 1: STARTER / STANDARD TIER */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                activeTierCode === "starter"
                  ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {activeTierCode === "starter" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
                  Active School Plan
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    Tier 1 &bull; Essential
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight">Starter / Standard</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Essential school management and standard CBT for small to mid-sized institutions.
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {selectedBillingCycle === "termly" ? "₦120,000" : "₦306,000"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedBillingCycle === "termly" ? "/ term" : "/ year"}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Up to 300 Enrolled Learners</span>
                </div>

                {/* FEATURE HIGHLIGHTS LIST */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>500 Monthly SMS/WhatsApp Alerts</strong> (Pay-as-you-go topup)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Basic CBT Exam Engine</strong> (Cap: 50 concurrent test sessions)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Standard PDF Report Cards</strong> &amp; Result Tokens</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>WhatsApp API Channel</strong> for instant receipt/result release</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Chinonye Scholar AI</strong> &amp; Socratic Homework Mentor</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSelectTier("starter", "Starter / Standard Tier")}
                  className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                    activeTierCode === "starter"
                      ? "bg-slate-800 text-slate-300 border-slate-700 cursor-default"
                      : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                  }`}
                  disabled={activeTierCode === "starter"}
                >
                  {activeTierCode === "starter" ? "Currently Active" : "Switch to Starter Plan"}
                </button>
              </div>
            </div>

            {/* TIER 2: PROFESSIONAL / GROWTH TIER (RECOMMENDED) */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                activeTierCode === "pro"
                  ? "bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/40"
                  : "bg-slate-900 border-indigo-500/40 hover:border-indigo-500"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
                Most Popular Growth Plan
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                    Tier 2 &bull; Professional
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight">Professional / Growth</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    AI-assisted report generation, live biometric proctoring, and broadsheet analytics.
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {selectedBillingCycle === "termly" ? "₦350,000" : "₦892,500"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedBillingCycle === "termly" ? "/ term" : "/ year"}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">Up to 1,200 Enrolled Learners</span>
                </div>

                {/* FEATURE HIGHLIGHTS LIST */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Everything in Starter Plan</strong> plus:</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Unlimited AI Report Card Comments</strong> (Gemini automated)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Live CBT Biometric Proctoring</strong> &amp; Tab-Switch Detector</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Broadsheet Vault &amp; Recharts Analytics</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Financial Ledger &amp; Auto-Reconciliation</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectTier("pro", "Professional / Growth Tier")}
                  className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md ${
                    activeTierCode === "pro"
                      ? "bg-indigo-950 text-emerald-400 border border-emerald-500/50 cursor-default"
                      : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white"
                  }`}
                >
                  {activeTierCode === "pro" ? "Currently Active" : "Upgrade to Professional Tier"}
                </button>

                {activeTierCode !== "pro" && (
                  <button
                    type="button"
                    onClick={() => handleActivateTrial("pro", "Professional Tier")}
                    className="w-full py-1.5 text-[10px] font-mono font-bold text-indigo-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Start 14-Day Free Trial</span>
                  </button>
                )}
              </div>
            </div>

            {/* TIER 3: ENTERPRISE / INSTITUTIONAL TIER */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                activeTierCode === "enterprise"
                  ? "bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/20 ring-2 ring-amber-500/40"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {activeTierCode === "enterprise" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
                  Active School Plan
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    Tier 3 &bull; Enterprise
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight">Enterprise / Multi-Branch</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-campus operations, white-labeled custom domains, custom RBAC, and dedicated SLA.
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {selectedBillingCycle === "termly" ? "₦750,000" : "₦1,912,500"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedBillingCycle === "termly" ? "/ term" : "/ year"}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-mono">Unlimited Multi-Campus Capacity</span>
                </div>

                {/* FEATURE HIGHLIGHTS LIST */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Multi-Campus Branch Switcher</strong> (Single Admin Console)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>White-Labeled Custom Domain</strong> (portal.yourschool.com)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Custom Permission Matrix (RBAC)</strong> for Bursar, VP &amp; Counselors</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>VIP Priority Support</strong> &amp; Excel Data Migration Engine</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>99.9% Uptime SLA</strong> &amp; Dedicated Account Officer</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectTier("enterprise", "Enterprise / Institutional Tier")}
                  className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    activeTierCode === "enterprise"
                      ? "bg-slate-800 text-amber-300 border border-amber-500/40 cursor-default"
                      : "bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:opacity-95 text-slate-950 font-black"
                  }`}
                >
                  {activeTierCode === "enterprise" ? "Currently Active" : "Upgrade to Enterprise Tier"}
                </button>

                {activeTierCode !== "enterprise" && (
                  <button
                    type="button"
                    onClick={() => handleActivateTrial("enterprise", "Enterprise Tier")}
                    className="w-full py-1.5 text-[10px] font-mono font-bold text-amber-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Start 14-Day Free Trial</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED FEATURE UNLOCK MATRIX GRID */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Comprehensive Tier Feature Breakdown</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Granular side-by-side comparison of module capabilities across Starter, Professional, and Enterprise plans.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2.5 py-1 rounded-lg">
                14-Day Free Trial applies to Pro &amp; Enterprise
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 font-bold">Platform Capability</th>
                    <th className="py-2.5 px-3 font-bold text-center">Starter / Standard</th>
                    <th className="py-2.5 px-3 font-bold text-center text-indigo-300">Professional (Growth)</th>
                    <th className="py-2.5 px-3 font-bold text-center text-amber-300">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>CBT Online Exam Engine</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">50 Concurrent Seats</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited Seats</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited + High Density</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Live Biometric Proctoring &amp; Anti-Cheating</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      <Check className="w-4 h-4 mx-auto text-emerald-400" />
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      <Check className="w-4 h-4 mx-auto text-emerald-400" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chinonye Narrative Synthesizer Report Card Comments</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">50 / Month</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited AI Comments</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited + Custom Persona</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Digital Reports Stream (CA Matrix, Skill Ratings &amp; QR Code)</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">Basic PDF Output</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      <Check className="w-4 h-4 mx-auto text-emerald-400" />
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Full Custom Watermarking</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Academic Broadsheet Vault &amp; Recharts</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">Basic CA View</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      <Check className="w-4 h-4 mx-auto text-emerald-400" />
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Multi-Campus Comparative</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bursary Ledger &amp; Fee Gateway Sync</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      <Check className="w-4 h-4 mx-auto text-emerald-400" />
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Auto-Reconciliation</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp &amp; SMS Parent Alerts</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">500 Free / Mo</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">3,000 Free / Mo</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">Unlimited Priority Pipeline</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Multi-Campus Branch Switcher</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-amber-300 font-bold">
                      <Check className="w-4 h-4 mx-auto text-amber-300" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Custom RBAC Role Permission Matrix</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">&mdash;</td>
                    <td className="py-2.5 px-3 text-center text-amber-300 font-bold">
                      <Check className="w-4 h-4 mx-auto text-amber-300" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* QUOTA METER & USAGE WARNING BANNER */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  SMS &amp; WhatsApp Notification Quota Tracker
                </span>
                <p className="text-white font-bold">
                  420 / 500 Monthly Parent Broadcasts Used <span className="text-emerald-400">(84% Capacity)</span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64 bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
              <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[84%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractivePlanComparisonModal;
