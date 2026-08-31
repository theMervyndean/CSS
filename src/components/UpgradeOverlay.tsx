import React, { useState } from "react";
import { ShieldAlert, Sparkles, Layers, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import InteractivePlanComparisonModal from "./InteractivePlanComparisonModal";

interface UpgradeOverlayProps {
  title: string;
  requiredTier: string;
  description: string;
  onUpgrade?: () => void;
}

export function UpgradeOverlay({ title, requiredTier, description, onUpgrade }: UpgradeOverlayProps) {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleTriggerUpgrade = () => {
    setIsPlanModalOpen(true);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto my-8 shadow-2xl relative overflow-hidden font-sans"
      >
        {/* Decorative top strip with gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
        
        {/* 14-Day Free Trial Banner Badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Includes 14-Day Risk-Free Trial Offer</span>
        </div>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-emerald-400 shadow-inner mb-4">
          <Layers className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <BadgeSim text="Simulated Module License Lock" />
          <h3 className="font-display font-black text-white text-lg sm:text-xl uppercase tracking-wide">
            Upgrade Plan to Unlock {title}
          </h3>
          <p className="text-[11px] uppercase font-mono font-black text-emerald-400 tracking-widest leading-none">
            Required License: {requiredTier}
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto mt-4">
          The <strong>{title}</strong> module is locked under your school&apos;s current plan. {description}
        </p>

        {/* Feature perks card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-2 mt-5">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">Instantly Streamline Campus Operations</strong>
              Upgrading unlocks AI comment generators, CBT live proctoring, broadsheet vaults, and centralized financial ledgers.
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>No credit card required for 14-day trial evaluation.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            onClick={handleTriggerUpgrade}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Compare Plans &amp; Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest mt-5">
          &copy; Corner Streams Institutional Licensing
        </div>
      </motion.div>

      {/* PLAN COMPARISON MODAL */}
      <InteractivePlanComparisonModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onTierChange={() => {
          if (onUpgrade) onUpgrade();
        }}
      />
    </>
  );
}

function BadgeSim({ text }: { text: string }) {
  return (
    <span className="inline-block bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full leading-none">
      {text}
    </span>
  );
}

export default UpgradeOverlay;

