import React from "react";
import { ShieldAlert, Sparkles, Layers, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface UpgradeOverlayProps {
  title: string;
  requiredTier: string;
  description: string;
  onUpgrade: () => void;
}

export function UpgradeOverlay({ title, requiredTier, description, onUpgrade }: UpgradeOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto my-8 shadow-lg relative overflow-hidden"
    >
      {/* Decorative top strip with gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600" />
      
      <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner mb-4">
        <Layers className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <BadgeSim text="Simulated License Blockade" />
        <h3 className="font-display font-black text-slate-800 dark:text-white text-base sm:text-lg uppercase tracking-wide">
          Upgrade License Required
        </h3>
        <p className="text-[10px] uppercase font-mono font-black text-indigo-600 dark:text-emerald-400 tracking-widest leading-none">
          Required Tier: {requiredTier}
        </p>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mt-4">
        The <strong>{title}</strong> module is currently locked under your school's simulated subscription plan. {description}
      </p>

      {/* Feature perks card */}
      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl p-4 text-left text-[11px] text-slate-600 dark:text-slate-400 space-y-2.5 mt-5">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 dark:text-slate-200 block font-bold">Instantly Streamline Campus Workflow</strong>
            Upgrading immediately provisions advanced academic grids, CBT exam managers, and centralized tuition registers across all participant roles.
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-600 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          onClick={onUpgrade}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Unlock Unified Enterprise (Demo Upgrade)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-5">
        © Corner Streams Licensing Safeguard
      </div>
    </motion.div>
  );
}

function BadgeSim({ text }: { text: string }) {
  return (
    <span className="inline-block bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
      {text}
    </span>
  );
}

export default UpgradeOverlay;
