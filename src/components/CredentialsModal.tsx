import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function CredentialsModal({ open, onOpenChange, credentialInfo }: any) {
  const handleCopy = () => {
    if (!credentialInfo) return;
    const text = `Corner Streams Portal Credentials:\n-------------------------------------\nName: ${credentialInfo.name}\nDesignation/Role: ${credentialInfo.role}\nPlatform Login Link: ${window.location.origin}\nPortal Email: ${credentialInfo.email}\nAssigned Login ID: ${credentialInfo.username || credentialInfo.email}\nSystem Generated Password: ${credentialInfo.password}\n-------------------------------------\nDo not share this security clearance key.`;
    navigator.clipboard.writeText(text);
    toast.success("Identity credentials packet successfully copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Key className="w-5 h-5" />
            <DialogTitle>Security Credentials Dispatch</DialogTitle>
          </div>
          <p className="text-xs text-slate-500">
            Copy and securely deliver this temporary credentials key to the newly registered workspace participant.
          </p>
        </DialogHeader>

        {credentialInfo && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 font-mono text-xs select-text">
            <div className="flex justify-between border-b border-slate-150 pb-1.5">
              <span className="text-slate-400 font-sans font-semibold uppercase text-[9px] tracking-wider">Clearance Subject</span>
              <span className="font-sans font-bold cs-text-navy text-[11px]">{credentialInfo.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-150 pb-1.5">
              <span className="text-slate-400 font-sans font-semibold uppercase text-[9px] tracking-wider">Access Clearway</span>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">{credentialInfo.role}</span>
            </div>
            <div className="flex justify-between border-b border-slate-150 pb-1.5">
              <span className="text-slate-400 font-sans font-semibold uppercase text-[9px] tracking-wider">Access ID / Email</span>
              <span className="font-bold cs-text-navy text-[11px]">{credentialInfo.email}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400 font-sans font-semibold uppercase text-[9px] tracking-wider">Generated Authorization Password</span>
              <span className="font-black text-emerald-600 tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{credentialInfo.password}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[10px] text-emerald-700">
            Security policy mandates that users are prompted to change this temporary password upon their very first portal session.
          </span>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="emerald" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Copy Credentials Packet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CredentialsModal;
