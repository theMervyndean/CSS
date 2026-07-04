import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, AlertTriangle, ShieldCheck, Upload, HelpCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

export function PendingVerification({ onLogout, currentProfile }: any) {
  const [school, setSchool] = useState<any>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("");
  const [submittedReceipt, setSubmittedReceipt] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
    setSchool(sch);
    if (sch.phone) setWhatsappPhone(sch.phone);
  }, []);

  const handleUploadReceipt = () => {
    if (!whatsappCode) {
      toast.error("Please supply a valid WhatsApp activation code or invoice TXID first.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Create pending receipt in database and set school state
      const sch = { ...school, verification_status: "pending_review", phone: whatsappPhone };
      localStorage.setItem("CS_SCHOOL", JSON.stringify(sch));
      setSchool(sch);

      // Save receipt to list
      const receipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
      receipts.unshift({
        id: "rcp-pending",
        tier: "unified_enterprise",
        duration: "full_session",
        amount_ngn: 200000,
        status: "pending",
        created_at: new Date().toISOString(),
        submitted_by: currentProfile.email || "bursar@cornerstreams.edu.ng",
        whatsapp_code: whatsappCode
      });
      localStorage.setItem("CS_RECEIPTS", JSON.stringify(receipts));

      setSubmittedReceipt(true);
      toast.success("Bank transfer receipt uploaded successfully. Superadmin queued.");
      setLoading(false);
    }, 450);
  };

  const handleReload = () => {
    // Check if superadmin approved it in localStorage
    const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
    if (sch.verification_status === "active") {
      toast.success("School Verified! Entrance cleared.");
      window.location.reload();
    } else {
      toast.info("Verification status is still pending. Try switching roles to Super Admin using the menu to approve your receipt.");
    }
  };

  const handleSimulateInstantClearance = () => {
    setLoading(true);
    setTimeout(() => {
      const sch = { ...school, verification_status: "active" };
      localStorage.setItem("CS_SCHOOL", JSON.stringify(sch));
      setSchool(sch);
      
      const receipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
      if (receipts.length > 0) {
        receipts[0].status = "approved";
      } else {
        receipts.unshift({
          id: "rcp-instant",
          tier: "unified_enterprise",
          duration: "full_session",
          amount_ngn: 200000,
          status: "approved",
          created_at: new Date().toISOString(),
          submitted_by: currentProfile.email || "admin@school.edu",
          whatsapp_code: "994503"
        });
      }
      localStorage.setItem("CS_RECEIPTS", JSON.stringify(receipts));
      
      toast.success("Instant Clearance Secured! Database Tenant Provisioned.");
      setLoading(false);
      window.location.reload();
    }, 800);
  };

  const isPaidPending = school?.verification_status === "paid_pending_verification";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white relative">
      {/* Dynamic Grid Background Panel */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-slate-50 to-slate-50 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 -z-10" />

      {/* Upper header segment aligned with Company Guidelines */}
      <header className="h-16 px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between relative z-20 shadow-sm shadow-slate-100/50">
        <BrandLogo darkTheme={false} size={30} />
        <Button variant="outline" size="sm" onClick={onLogout} className="text-slate-600 border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold transition">
          Sign Out Admin
        </Button>
      </header>

      {/* Hero central layout workspace */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-12 w-full grid md:grid-cols-[1.2fr_1fr] gap-6 md:gap-10 items-center flex-1 relative z-20">
        
        {/* Left column holding the notice info */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-750 border border-indigo-150 rounded-full text-[9px] font-black tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            Verification Pipeline Gate
          </div>

          <div className="space-y-2">
            <h1 className="font-sans text-2xl md:text-3.5xl font-black tracking-tight leading-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-emerald-700 bg-clip-text text-transparent uppercase">
              School Verification <span className="text-indigo-650">Holding Area</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-md">
              Congratulations on initiating <strong>{school?.name || "Corner Streams Academy"}</strong> onto Corner Streams OS. We require activation verification of billing transfers or checkout clearances to enable your school's secure operational tenant cluster.
            </p>
          </div>

          {/* Details metadata list */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs text-slate-650 shadow-md shadow-slate-100/30">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400 font-extrabold uppercase text-[9px]">Institution Name</span>
              <span className="font-bold text-slate-800 text-[11px] font-sans truncate max-w-[180px]">{school?.name || "Corner Streams Academy"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400 font-extrabold uppercase text-[9px]">Contact Email</span>
              <span className="font-bold text-indigo-600 font-mono">{currentProfile.email || "bursar@cornerstreams.edu.ng"}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-400 font-extrabold uppercase text-[9px]">Pipeline Status</span>
              <span className="font-black text-amber-600 animate-pulse uppercase flex items-center gap-1">
                <Clock size={11} className="text-amber-500 shrink-0" />
                {isPaidPending ? "Clearance Verification Gate" : school?.verification_status === "pending_review" ? "Awaiting Superadmin Approve" : "Pending Activation Invoice"}
              </span>
            </div>
          </div>

          {/* Active Clearance pipeline step-meter for paid_pending_verification */}
          {isPaidPending && (
            <div className="border border-indigo-150 p-4 bg-indigo-50/30 rounded-xl space-y-3 animate-fade-in font-sans">
              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center justify-between">
                <span>Secure Clearance Checklist</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-[9px]">Secure Checkout OK</span>
              </span>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                  <span className="text-slate-700 font-bold">Card Checkout Handshake Secured</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black animate-pulse">2</div>
                  <span className="text-slate-600 font-medium">Auto Superadmin Clearance Verification Pending</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">3</div>
                  <span className="text-slate-400 font-medium">Database Tenant Workspace Booting</span>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines info */}
          <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200/50 rounded-xl text-xs text-indigo-850">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-950 block text-[11px] font-black uppercase tracking-wide">Developer Sandbox Notice</strong>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                You are testing the Corner Streams multi-tenant register pipeline. Choose to bypass verification instantly with the sandbox tool inside the right checkout area or use the top simulator menu to log in as a <span className="font-extrabold text-indigo-950">Super Admin (David Macaulay)</span> to approve this holding request.
              </p>
            </div>
          </div>
        </div>

        {/* Right column holding the upload interface card or checkout feedback */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 relative">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="font-sans font-black text-xs text-indigo-950 uppercase tracking-wider">Onboarding Clearence Gate</h3>
            <p className="text-[10px] text-slate-400">Deliver bank invoice receipt or trigger sandbox bypass to unlock your database.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label className="text-slate-400 font-bold text-[10px]">Active WhatsApp Contact Mobile</Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="e.g. +234 814 188 0550"
                className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-400 font-bold text-[10px]">WhatsApp Code / Invoice TX-ID</Label>
              <Input
                value={whatsappCode}
                onChange={(e) => setWhatsappCode(e.target.value)}
                placeholder="6-digit activation key (e.g. 294827)"
                className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500 text-xs text-center font-mono font-bold tracking-widest uppercase"
              />
            </div>

            <div className="space-y-1.5 border border-dashed border-slate-250 hover:border-indigo-600 rounded-xl p-4 bg-slate-50/60 flex flex-col items-center justify-center text-center cursor-pointer transition">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
                <Upload className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-slate-700 block uppercase tracking-wider">Bank Transfer Slip</span>
              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Supports PDF or JPG up to 5MB</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full h-10 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:brightness-110 text-white font-extrabold uppercase text-[10px] tracking-wider transition shadow-md shadow-indigo-600/10 cursor-pointer"
              onClick={handleUploadReceipt}
              disabled={loading || submittedReceipt}
            >
              {loading ? "Transmitting Log Packet..." : submittedReceipt ? "Receipt Queued" : "Upload Slip & Verify"}
            </Button>

            <Button
              variant="outline"
              className="w-full text-slate-700 border-slate-200 bg-white hover:bg-slate-50 text-[10px] uppercase font-black tracking-wider shadow-sm cursor-pointer"
              onClick={handleReload}
            >
              Check Clearence Activation Status
            </Button>
          </div>

          {/* Sandbox Overrides Section inside Holding Area */}
          <div className="border-t border-slate-100 pt-4 mt-2 space-y-2">
            <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">
              <HelpCircle size={10} className="animate-bounce" />
              <span>Developer Fast Bypass Console</span>
            </div>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleSimulateInstantClearance}
              className="w-full btn-emerald bg-emerald-600/10 text-emerald-800 border-2 border-emerald-600/20 hover:bg-emerald-600/20 text-[9px] font-black uppercase tracking-wider"
            >
              Simulate Instant Super Admin Approval ✓
            </Button>
          </div>
        </div>
      </main>

      {/* Refined footer */}
      <footer className="h-12 border-t border-slate-200/60 bg-white/50 flex flex-col sm:flex-row gap-2 items-center justify-between px-6 text-[9px] text-slate-400 font-semibold tracking-wider uppercase relative z-20">
        <div>CORNER STREAMS SECURE NETWORK PIPELINE</div>
        <div>Copyright ©️ 2026 cornerstreams@gmail.com</div>
      </footer>
    </div>
  );
}

export default PendingVerification;
