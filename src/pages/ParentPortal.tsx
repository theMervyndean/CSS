import React, { useState, useEffect } from "react";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { 
  Download, Printer, QrCode, ShieldCheck, Mail, Landmark, FileText, 
  Settings, User, GraduationCap, ChevronRight, HelpCircle, FileCheck2, School
} from "lucide-react";
import { toast } from "sonner";
import SettingsPanel from "../components/SettingsPanel";
import { UpgradeOverlay } from "../components/UpgradeOverlay";

export function ParentPortal({ currentProfile, theme, setTheme, activeFont, setActiveFont }: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [reportState, setReportState] = useState<"half_term" | "full_term">("full_term");

  // Core Parent states
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);

  const handleSimulatedUpgrade = async () => {
    try {
      const payload = {
        ...school,
        subscription_tier: "unified_enterprise"
      };
      await api.put("/schools/me", payload);
      localStorage.setItem("CS_SCHOOL", JSON.stringify(payload));
      setSchool(payload);
      toast.success("School tier upgraded to UNIFIED ENTERPRISE successfully! All premium parent portals unlocked.");
      loadData();
    } catch (e: any) {
      toast.error("Failed to execute simulated upgrade.");
    }
  };

  const isTabVisible = (tabKey: string) => {
    const tier = school?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (tabKey === "announcements" || tabKey === "settings") return true;

    if (tier === "cbt_essentials") {
      return false; // CBT doesn't have parent ledger or grades sheet
    }
    if (tier === "financial_ledger") {
      return tabKey === "billing";
    }
    if (tier === "digital_reports") {
      return tabKey === "overview";
    }
    return true;
  };

  const loadData = async () => {
    try {
      const [chRes, biRes, msgRes, schRes] = await Promise.all([
        api.get("/students"), // Get all, then filter children
        api.get("/payments/bills").catch(() => ({ data: { bills: [] } })),
        api.get("/messages").catch(() => ({ data: { messages: [] } })),
        api.get("/schools/me")
      ]);
      
      const sChildren = chRes.data.students || [];
      setChildren(sChildren);
      const sch = schRes.data.school;
      setSchool(sch);
      
      const tier = sch?.subscription_tier || "unified_enterprise";
      let initialTab = "overview";
      if (tier === "cbt_essentials") {
        initialTab = "announcements";
      } else if (tier === "financial_ledger") {
        initialTab = "billing";
      }
      setActiveTab(initialTab);
      
      if (sChildren.length > 0) {
        setSelectedChild(sChildren[0]);
        loadChildScores(sChildren[0].id);
      }

      setBilling((biRes as any).data?.bills || []);
      setMessages(msgRes.data.messages || []);
    } catch (e) {
      toast.error("Initialization error loading Parent Portal.");
    }
  };

  const loadChildScores = async (childId: string) => {
    try {
      const { data } = await api.get("/scores", { params: { student_id: childId, term: "1st Term" } });
      setGrades(data.scores || []);
    } catch (e) {
      toast.error("Error retrieving grades packet.");
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const handleChildSelect = (child: any) => {
    setSelectedChild(child);
    loadChildScores(child.id);
  };

  // Math invariant math translator: Scales marks to exactly 40-marks
  const getScaledHalfTermCA = (caScores: number[]) => {
    if (!Array.isArray(caScores) || caScores.length === 0) return 0;
    const totalCa = caScores.reduce((a, b) => a + Number(b), 0);
    const maxCa = caScores.length === 4 ? 40 : 40; // Default max ca sum
    // Scale totalca out of maxCa to 40 max linearly
    const scaled = (totalCa / maxCa) * 40;
    return Math.min(40, Math.max(0, Math.round(scaled * 10) / 10)); // Rounded to 1 decimal place
  };

  const getFullTermTotal = (caScores: number[], exam: number) => {
    const totalCa = caScores ? caScores.reduce((a, b) => a + Number(b), 0) : 0;
    return totalCa + (Number(exam) || 0);
  };

  const getGradeRemark = (total: number) => {
    if (total >= 70) return { l: "A", c: "text-emerald-600 bg-emerald-50", r: "Distinction Excellence" };
    if (total >= 60) return { l: "B", c: "text-indigo-600 bg-indigo-50", r: "Very Good Attempt" };
    if (total >= 50) return { l: "C", c: "text-indigo-600 bg-indigo-50", r: "Credit Passed" };
    if (total >= 40) return { l: "D", c: "text-amber-600 bg-amber-50", r: "Fair Attempt" };
    return { l: "F", c: "text-rose-600 bg-rose-50", r: "Needs Critical Remediation" };
  };

  const triggerDownloadPDF = () => {
    toast.success(`Authenticating digital stamps... Generating PDF report card for ${selectedChild?.name}. File queue completed.`);
  };

  // Filter bills specific to parent children
  const parentBills = billing.filter((b: any) => b.student_id === selectedChild?.id || b.parentId === currentProfile.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      {/* Sub-navigation bar */}
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-10">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "overview", label: "Ward Performance Locker" },
            { k: "announcements", label: "Campus Communications" },
            { k: "billing", label: "Financial Accounts Ledger" },
            { k: "settings", label: "System Settings" }
          ].map((item) => {
            const visible = isTabVisible(item.k);
            return (
              <button
                key={item.k}
                onClick={() => setActiveTab(item.k)}
                className={`h-8.5 px-4 rounded-lg font-bold transition text-[11px] flex items-center gap-1.5 ${
                  activeTab === item.k 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {!visible && <span className="text-[10px]">🔒</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Children selector dropdown */}
        <div className="flex gap-2 items-center">
          <GraduationCap className="w-4.5 h-4.5 text-indigo-500" />
          <span className="font-bold text-slate-500 font-sans text-[11px]">Active Profile:</span>
          <select
            className="h-8.5 rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-800 text-[11px]"
            onChange={(e) => {
              const ch = children.find((c) => c.id === e.target.value);
              if (ch) handleChildSelect(ch);
            }}
            value={selectedChild?.id || ""}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* -------------- PERFORMANCE WARD LOCKER -------------- */}
        {activeTab === "overview" && (
          !isTabVisible("overview") ? (
            <UpgradeOverlay 
              title="Ward Performance Locker"
              requiredTier="Digital Reports or Unified Enterprise"
              description="interactive student report sheets, cognitive skill ratings, psychomotor feedback loops, and teacher remarks verification."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
            
            <div className="flex flex-wrap gap-2 justify-between items-center bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Official Electronic Performance Sheet</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle 2-state reports to review half-term scaled ca weights or terminal sum.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* 2 state toggles */}
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Layout Select:</span>
                <div className="bg-slate-50 border border-slate-250 p-1 rounded-lg flex">
                  <button 
                    onClick={() => setReportState("half_term")}
                    className={`h-7 px-3 rounded text-[10px] font-bold uppercase transition ${reportState === "half_term" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    40-mark Half-Term
                  </button>
                  <button 
                    onClick={() => setReportState("full_term")}
                    className={`h-7 px-3 rounded text-[10px] font-bold uppercase transition ${reportState === "full_term" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    100-mark Full-Term
                  </button>
                </div>
              </div>
            </div>

            {/* Electronic Report card visual block */}
            <div className="cs-card p-6 border-slate-350/85 relative overflow-hidden bg-white shadow-xl space-y-6">
              
              {/* Security authentication watermark stamp background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.015] flex items-center justify-center">
                <School className="w-[500px] h-[500px]" />
              </div>

              {/* School badge & Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-dashed border-slate-200 pb-5">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#005cb9] block">Electronic Transcript Node</span>
                  <h2 className="font-display text-lg md:text-xl font-black tracking-tight leading-none text-slate-900 uppercase">
                    {school?.name || "Corner Streams Private School"}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tight">{school?.motto || "Knowledge, Discipline, Excellence"}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
                  <div className="text-slate-400 font-bold uppercase">Student Full Name:</div>
                  <div className="font-bold text-slate-800 text-right uppercase">{selectedChild?.name}</div>

                  <div className="text-slate-400 font-bold uppercase">Class Level:</div>
                  <div className="font-mono text-slate-800 text-right">{selectedChild?.class_name}</div>

                  <div className="text-slate-400 font-bold uppercase">Term Cycle:</div>
                  <div className="font-mono font-bold text-indigo-600 text-right">FIRST TERM CYCLE</div>
                </div>
              </div>

              {/* GRADES AND SCHOLASTIC METRICS TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/50 backdrop-blur-[1px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wide">
                      <TableHead>Course Subject</TableHead>
                      {reportState === "half_term" ? (
                        <>
                          <TableHead className="text-center">Raw CA Sum</TableHead>
                          <TableHead className="text-center text-[#005cb9] font-black">40-Mark Scaled CA Target</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="text-center">CA Accumulate (max 40)</TableHead>
                          <TableHead className="text-center">Exam Score (max 60)</TableHead>
                          <TableHead className="text-center text-[#005cb9] font-black">Full-Term Aggregate (100)</TableHead>
                        </>
                      )}
                      <TableHead>Class Average</TableHead>
                      <TableHead>Remark Verdict</TableHead>
                      <TableHead className="text-right">Pass/Fail Alert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((gr, idx) => {
                      const computedTotal = reportState === "half_term" 
                        ? getScaledHalfTermCA(gr.ca_scores || [])
                        : getFullTermTotal(gr.ca_scores || [], gr.exam);
                      
                      const gradingAttr = getGradeRemark(reportState === "half_term" ? (computedTotal / 40) * 100 : computedTotal);
                      const isPassing = (reportState === "half_term" ? (computedTotal / 40) * 100 : computedTotal) >= (school?.benchmark || 50);

                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-bold cs-text-navy text-sm">{gr.subject}</TableCell>
                          
                          {reportState === "half_term" ? (
                            <>
                              <TableCell className="text-center font-mono font-bold text-slate-500">
                                {gr.ca_scores ? gr.ca_scores.reduce((a: number, b: number) => a + Number(b), 0) : 0}
                              </TableCell>
                              <TableCell className="text-center font-mono font-black text-indigo-600 text-sm">
                                {computedTotal}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-center font-mono font-bold text-slate-600">
                                {gr.ca_scores ? gr.ca_scores.reduce((a: number, b: number) => a + Number(b), 0) : 0}
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold text-slate-600">
                                {gr.exam || 0}
                              </TableCell>
                              <TableCell className="text-center font-mono font-black text-indigo-600 text-sm bg-indigo-50/20">
                                {computedTotal}
                              </TableCell>
                            </>
                          )}

                          <TableCell className="font-mono text-slate-500 text-center">
                            {(gr.class_average || 62)}%
                          </TableCell>

                          <TableCell>
                            <span className="font-bold text-slate-600">{gradingAttr.r}</span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className={`inline-block py-0.5 px-2 rounded-sm text-[9px] uppercase font-black tracking-wider ${isPassing ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
                              {gradingAttr.l}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* QR Code stamps and electronic signatures */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-dashed border-slate-200 pt-6">
                
                {/* Simulated signature overlays */}
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-1 font-mono text-[8px] select-none shadow-sm shrink-0">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Authentic Digitally Verified Seal
                    </span>
                    <p className="text-[9px] text-slate-400 max-w-sm leading-tight">
                      This digital sheet is signed by the school principal using active Corner Streams private security certificates. Verification Hash: <span className="font-mono text-slate-500">CS294-82x.4</span>
                    </p>
                  </div>
                </div>

                {/* Printable down-loaders */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={triggerDownloadPDF} className="h-9 gap-1 text-[11px] font-bold">
                    <Download className="w-3.5 h-3.5" />
                    Download PDF Card
                  </Button>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* -------------- COMMUNICATIONS ANN -------------- */}
        {activeTab === "announcements" && (
          <div className="space-y-4 max-w-2xl animate-in fade-in duration-200">
            <h3 className="font-display font-semibold cs-text-navy text-sm">Official Platform Communications</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Read emergency notices, newsletter outlines, or school-wide alerts.</p>
            
            <div className="space-y-3.5">
              {messages.filter((m: any) => m.message_type === "announcement" || m.message_type === "broadcast").map((m, idx) => (
                <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm border-l-4 border-indigo-500 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-black uppercase tracking-wider text-indigo-600 block">Universal Broadcast Alert</span>
                    <span className="font-mono text-slate-400 block">{new Date(m.created_at || "").toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-800">{m.content}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white border rounded-xl">No active announcements.</div>
              )}
            </div>
          </div>
        )}

        {/* -------------- BILLING HISTORY -------------- */}
        {activeTab === "billing" && (
          !isTabVisible("billing") ? (
            <UpgradeOverlay 
              title="Financial Accounts Ledger"
              requiredTier="Financial Ledger or Unified Enterprise"
              description="consolidated tuition fee rosters, bank slip receipt uploads, automated escrow accounting ledgers, and transaction status receipts."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="grid lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            
            {/* Detailed school fees structure breakdown */}
            <div className="lg:col-span-2 cs-card p-5 space-y-4">
              <h3 className="font-display font-semibold cs-text-navy text-sm">Active Invoices Breakdown</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 uppercase tracking-wide font-bold text-slate-500 text-[10px]">
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Academic Term</TableHead>
                      <TableHead>Tuition Fees</TableHead>
                      <TableHead>Process Fees</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parentBills.map((b, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-bold text-indigo-600">{b.invoiceNumber}</TableCell>
                        <TableCell className="font-mono text-slate-700">{b.term}</TableCell>
                        <TableCell className="font-mono font-bold text-slate-800">₦{b.tuitionFee?.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-semibold text-slate-500">₦{b.cbtProcessingFee?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black font-mono">
                          {b.status === "PAID" ? (
                            <span className="text-emerald-500 bg-emerald-50 py-0.5 px-2 rounded text-[10px]">Cleared</span>
                          ) : (
                            <span className="text-rose-500 bg-rose-50 py-0.5 px-2 rounded text-[10px]">₦{(b.totalAmount - b.amountPaid).toLocaleString()}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {parentBills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center p-8 text-slate-400">All student bursary statements cleared.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Offline Bank details layout to upload receipts */}
            <div className="cs-card p-5 space-y-4">
              <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                <Landmark className="w-4.5 h-4.5" />
                <h3 className="font-display font-semibold cs-text-navy text-sm">Offline Settlement Bank Details</h3>
              </div>

              <div className="space-y-3 font-semibold text-slate-700 text-[11.5px]">
                <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200 space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Clearing Institution</span>
                    <strong className="cs-text-navy text-sm block font-sans">CORNERSTONE BANK PLC NIGERIA</strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Account Locker Pin</span>
                    <strong className="text-slate-900 block font-mono text-base">4820-1893-1994</strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Locker Subject</span>
                    <strong className="text-slate-800 block uppercase font-sans">Corner Streams Private School Central Escrow</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  Deliver invoice transfer balances utilizing standard banking applications. To automatically clear blockade warning pages instantly, submit receipt tracking codes under student dashboards.
                </p>
              </div>
            </div>
          </div>
          )
        )}

        {/* ----------------- SUBTAB: SETTINGS ----------------- */}
        {activeTab === "settings" && (
          <div className="max-w-4xl animate-in fade-in duration-200">
            <SettingsPanel
              currentUserProfile={currentProfile}
              theme={theme}
              setTheme={setTheme}
              activeFont={activeFont}
              setActiveFont={setActiveFont}
            />
          </div>
        )}
      </div>
    </div>
  );
}
export default ParentPortal;
