import React from "react";
import { ShieldAlert, Receipt, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockedOverlay({ balance, schoolName, adminPhone, parentEmail }: any) {
  return (
    <div className="bg-white/80 border border-slate-200 backdrop-blur-md rounded-xl p-6 text-center max-w-md mx-auto space-y-5 my-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
      <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
        <ShieldAlert className="w-6 h-6 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wide">Result Access Blockade</h3>
        <p className="text-[10px] uppercase font-mono font-black text-rose-500 tracking-wider">Account Balance Status: In Arrears</p>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
        Terminal grade sheets and CBT diagnostic report folders have been locked by <strong>{schoolName || "your school administration"}</strong> due to an outstanding fee ledger of <strong className="text-rose-600">₦{balance?.toLocaleString()}</strong> against student records map.
      </p>

      {/* Breakdown instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-left text-[11px] text-slate-600">
        <div className="flex items-start gap-2">
          <Receipt className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 block">Immediate Clearway Option</strong>
            Proceed with full payment, or upload bank transfer logs to your bursar desk at once to bypass the lock automatically.
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1 gap-1.5 text-[10px]"
          onClick={() => window.open(`tel:${adminPhone || "+2348123456789"}`)}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Call School Bursary
        </Button>
      </div>

      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
        Corner Streams Financial Integrity Safeguard
      </div>
    </div>
  );
}
export default LockedOverlay;
