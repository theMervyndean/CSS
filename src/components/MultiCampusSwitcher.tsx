import React, { useState } from "react";
import { Building2, ChevronDown, Check, Sparkles, MapPin, Layers } from "lucide-react";
import { toast } from "sonner";

export interface CampusBranch {
  id: string;
  name: string;
  location: string;
  code: string;
  studentCount: number;
  isMainBranch?: boolean;
}

export const DEFAULT_CAMPUSES: CampusBranch[] = [
  { id: "campus-vi", name: "Victoria Island Main Campus", location: "Victoria Island, Lagos", code: "CS-VI", studentCount: 840, isMainBranch: true },
  { id: "campus-lekki", name: "Lekki Phase 1 Annex", location: "Lekki, Lagos", code: "CS-LK", studentCount: 520 },
  { id: "campus-abuja", name: "Abuja Diplomatic Campus", location: "Maitama, Abuja", code: "CS-ABJ", studentCount: 380 }
];

export interface MultiCampusSwitcherProps {
  currentTier?: string;
  onOpenUpgradeModal?: () => void;
  className?: string;
}

export function MultiCampusSwitcher({
  currentTier = "unified_enterprise",
  onOpenUpgradeModal,
  className = ""
}: MultiCampusSwitcherProps) {
  const [activeCampus, setActiveCampus] = useState<CampusBranch>(DEFAULT_CAMPUSES[0]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isEnterprise = currentTier === "unified_enterprise" || currentTier === "enterprise";

  const handleSelectCampus = (campus: CampusBranch) => {
    if (!isEnterprise) {
      toast.info("Multi-Campus Branch Switcher is locked on Starter & Professional Tiers.", {
        description: "Upgrade to Enterprise Tier to seamlessly manage multiple school branches."
      });
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      setIsOpen(false);
      return;
    }

    setActiveCampus(campus);
    setIsOpen(false);
    toast.success(`Switched active workspace to "${campus.name}" (${campus.code})`, {
      description: `Loaded ${campus.studentCount} student records and branch ledger.`
    });
  };

  return (
    <div className={`relative font-sans ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-700/80 rounded-xl text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
        title={isEnterprise ? "Switch Active Campus Branch" : "Multi-Campus Switcher (Enterprise Tier)"}
      >
        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex items-baseline gap-1.5 max-w-[160px] truncate">
          <span className="truncate">{activeCampus.name}</span>
          <span className="text-[9px] text-slate-300 font-mono font-semibold hidden sm:inline">
            ({activeCampus.code})
          </span>
        </div>
        {!isEnterprise && (
          <span className="px-1.5 py-0.2 text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-extrabold uppercase">
            ENT
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-300 ml-0.5 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 font-sans space-y-1 text-xs text-white backdrop-blur-md">
          <div className="p-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-black uppercase text-[10.5px] text-slate-200 tracking-wider">
                Multi-Campus Branch Switcher
              </span>
            </div>
            {isEnterprise ? (
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                ACTIVE
              </span>
            ) : (
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                LOCKED
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            {DEFAULT_CAMPUSES.map((c) => {
              const isSelected = activeCampus.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCampus(c)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-900/90 to-emerald-900/80 border-emerald-500/60 text-white shadow-xs"
                      : "bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{c.name}</span>
                      {c.isMainBranch && (
                        <span className="text-[8px] bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded font-mono uppercase font-black border border-indigo-700/60">
                          MAIN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{c.location} &bull; {c.studentCount} Students</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {!isEnterprise && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenUpgradeModal) onOpenUpgradeModal();
                }}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:opacity-95 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Upgrade to Enterprise Multi-Campus</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiCampusSwitcher;
