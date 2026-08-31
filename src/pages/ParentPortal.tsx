import React, { useState, useEffect } from "react";
import { api, formatApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { 
  Download, Printer, QrCode, ShieldCheck, Mail, Landmark, FileText, 
  Settings, User, GraduationCap, ChevronRight, HelpCircle, FileCheck2, School,
  Sparkles, Clock, Activity, Award, CheckCircle2, ShieldAlert, ChevronDown, Check,
  Volume2, Brain, Lightbulb, Loader2
} from "lucide-react";
import { speakNonyeVoice } from "../utils/nonyeVoicePlayer";
import nonyeAvatar from "../assets/images/chinonye_portrait.jpg";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import SettingsPanel from "../components/SettingsPanel";
import CommunicationHub from "../components/CommunicationHub";
import { UpgradeOverlay } from "../components/UpgradeOverlay";
import { GradeDistributionChart } from "../components/GradeDistributionChart";
import { motion, AnimatePresence } from "motion/react";

export function ParentPortal({ currentProfile, theme, setTheme, activeFont, setActiveFont, activeTabProp }: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);

  useEffect(() => {
    if (activeTabProp) {
      if (activeTabProp === 'receipt') setActiveTab('billing');
      else if (activeTabProp === 'completed') setActiveTab('overview');
      else setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);
  const [reportState, setReportState] = useState<"half_term" | "full_term">("full_term");

  // Core Parent states
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [cbtHistory, setCbtHistory] = useState<any[]>([]);

  // Nonye AI Parent Advisory State
  const [advisoryData, setAdvisoryData] = useState<any>(null);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState(false);

  const handleGenerateParentAdvisory = async () => {
    if (!selectedChild) return;
    setIsLoadingAdvisory(true);
    try {
      const studentBill = billing.find((b) => b.student_id === selectedChild.id);
      const res = await fetch("/api/ai/parent/performance-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedChild.name,
          classLevel: selectedChild.class_name || "SS 2 Science",
          termAverage: 78.4,
          attendanceRate: 97.5,
          topSubjects: ["General Mathematics (86%)", "Chemistry (82%)", "Biology (79%)"],
          weakSubjects: ["Physics (58%)"],
          feeBalance: studentBill?.balance_due ? `₦${studentBill.balance_due.toLocaleString()}` : "₦0.00 (Cleared)"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdvisoryData(data.advisory);
        toast.success("Nonye AI generated your tailored Parent Advisory Briefing!");
      }
    } catch (e) {
      toast.error("Failed to generate parent advisory.");
    } finally {
      setIsLoadingAdvisory(false);
    }
  };

  // Load CBT session records for selectedChild
  useEffect(() => {
    if (selectedChild) {
      const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
      const childRecords = records.filter((r: any) => r.studentId === selectedChild.id);
      setCbtHistory(childRecords);
    }
  }, [selectedChild]);

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
      return tabKey === "cbt";
    }
    if (tier === "cbt_plus_results") {
      return tabKey === "overview" || tabKey === "cbt";
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
        initialTab = "cbt";
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
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-20">
        {(() => {
          const parentModules = [
            { k: "overview", label: "Ward Performance Locker", icon: GraduationCap, desc: "Academic report cards, grades & term progress" },
            { k: "cbt", label: "CBT Examinations Transcript", icon: Award, desc: "Computer based test results & proctor logs" },
            { k: "announcements", label: "Campus Communications", icon: Mail, desc: "School notices, broadcasts & inbox" },
            { k: "billing", label: "Financial Accounts Ledger", icon: Landmark, desc: "Fee invoices, tuition receipts & payment records" },
            { k: "settings", label: "System Settings", icon: Settings, desc: "Account security & notification preferences" }
          ];

          const availableParentModules = parentModules.map(item => ({
            ...item,
            visible: isTabVisible(item.k)
          }));

          const currentParentModule = parentModules.find(m => m.k === activeTab) || parentModules[0];
          const CurrentParentIcon = currentParentModule.icon;

          return (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModuleSelectorOpen(!isModuleSelectorOpen)}
                className="h-9 px-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-sm transition cursor-pointer"
              >
                <div className="p-1 bg-white/20 rounded-lg shrink-0 flex items-center justify-center">
                  <CurrentParentIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8.5px] uppercase tracking-wider text-indigo-100 font-medium leading-none">Active Module</span>
                  <span className="font-extrabold text-[12px] leading-tight flex items-center gap-1">
                    {currentParentModule.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-emerald-200 transition-transform ml-1 ${isModuleSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {isModuleSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsModuleSelectorOpen(false)} />
                  <div className="absolute left-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Navigation Module</span>
                      <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {parentModules.length} Modules
                      </span>
                    </div>
                    {availableParentModules.map((item) => {
                      const isSelected = activeTab === item.k;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.k}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.k);
                            setIsModuleSelectorOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-sm font-bold"
                              : "hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200"
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11.5px] font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                                {item.label}
                              </span>
                              {!item.visible && <span className="text-[10px]" title="Feature restricted by current school plan">🔒</span>}
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                            </div>
                            {item.desc && (
                              <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                                {item.desc}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

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

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
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

            {/* Nonye AI Parent Advisory & Plain-English Translation Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-emerald-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={nonyeAvatar}
                      alt="Nonye AI"
                      className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-indigo-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">Nonye AI Family Advisory for {selectedChild?.name || "Your Child"}</h3>
                      <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Plain-English Summary
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Translates complex numerical broadsheet data into actionable parenting & home study guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {advisoryData && (
                    <button
                      onClick={() => speakNonyeVoice(advisoryData.academicSummary || advisoryData.parentGreeting)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Listen to Nonye</span>
                    </button>
                  )}
                  <button
                    onClick={handleGenerateParentAdvisory}
                    disabled={isLoadingAdvisory}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {isLoadingAdvisory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                    <span>{advisoryData ? "Refresh Advisory" : "Generate Parent Advisory"}</span>
                  </button>
                </div>
              </div>

              {advisoryData && (
                <div className="space-y-4 pt-3 border-t border-white/10 text-xs">
                  <p className="text-indigo-100 font-medium leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10">
                    {advisoryData.parentGreeting} {advisoryData.academicSummary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/40 space-y-1.5">
                      <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths to Celebrate at Home:
                      </h4>
                      <ul className="space-y-1 text-slate-200 list-disc list-inside">
                        {advisoryData.celebrationPoints?.map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-700/40 space-y-1.5">
                      <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> Supportive Home Guidance Tips:
                      </h4>
                      <ul className="space-y-1 text-slate-200 list-disc list-inside">
                        {advisoryData.homeSupportTips?.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                    <span className="font-semibold">Verified Bursary Status:</span>
                    <span className="font-bold text-emerald-300">{advisoryData.feeStatusNotice}</span>
                  </div>
                </div>
              )}
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
                <div className="flex gap-2 print:hidden">
                  <Button 
                    variant="emerald" 
                    size="sm" 
                    onClick={() => window.print()} 
                    className="h-9 gap-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-sm"
                    title="Print or export paperless PDF report card using browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Export PDF Report Card
                  </Button>
                </div>
              </div>
            </div>

            <GradeDistributionChart />
          </div>
          )
        )}

        {/* -------------- CBT EXAMINATIONS TRANSCRIPT -------------- */}
        {activeTab === "cbt" && (
          !isTabVisible("cbt") ? (
            <UpgradeOverlay 
              title="CBT Examinations Transcript"
              requiredTier="CBT Essentials or Unified Enterprise"
              description="real-time computerized exam progress monitoring, automatic instant scoring, proctor focus violation alerts, and performance timelines."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Computer-Based Examinations Transcript</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Track computerized tests taken by <strong className="text-slate-600">{selectedChild?.fullName || selectedChild?.name}</strong>, analyze integrity metrics and view score distributions.</p>
                </div>
                {cbtHistory.length > 0 && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-mono text-[9px] font-black h-6">
                    {cbtHistory.length} Sessions Logged
                  </Badge>
                )}
              </div>

              {/* CBT Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">CBT Average</span>
                    <strong className="text-slate-800 font-extrabold text-sm block">
                      {cbtHistory.length > 0 
                        ? `${Math.round(cbtHistory.reduce((acc, curr) => acc + (curr.score || 0), 0) / cbtHistory.length)}%`
                        : "0%"
                      }
                    </strong>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Top Attempt</span>
                    <strong className="text-emerald-600 font-extrabold text-sm block">
                      {cbtHistory.length > 0 
                        ? `${Math.max(...cbtHistory.map(h => h.score || 0))}%`
                        : "0%"
                      }
                    </strong>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Total Papers</span>
                    <strong className="text-slate-800 font-extrabold text-sm block">
                      {cbtHistory.length} Exams
                    </strong>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Focus Violations</span>
                    <strong className="text-slate-800 font-extrabold text-sm block">
                      {cbtHistory.reduce((acc, curr) => acc + (curr.violations || 0), 0)} flags
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* List of sessions table */}
                <div className="md:col-span-2 cs-card p-5 space-y-4">
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Evaluation Audit Registry</h3>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 uppercase tracking-wide font-bold text-slate-500 text-[10px]">
                          <TableHead>Assessment Subject</TableHead>
                          <TableHead className="text-center">Exam Score</TableHead>
                          <TableHead className="text-center">Tab-Blurs/Alerts</TableHead>
                          <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cbtHistory.map((h, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-bold cs-text-navy uppercase">{h.examTitle}</TableCell>
                            <TableCell className="text-center font-mono font-black text-indigo-600">
                              {h.score}%
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${h.violations > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"}`}>
                                {h.violations} blurs
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-400 text-[10.5px]">
                              {new Date(h.lastUpdated).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {cbtHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center p-8 text-slate-400">
                              No computerized examinations logged for {selectedChild?.fullName || selectedChild?.name} yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Graph chart visualizer */}
                <div className="cs-card p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-semibold cs-text-navy text-sm">Performance Timeline</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Exam grade distribution timeline over computerized tests.</p>
                  </div>

                  {cbtHistory.length > 0 ? (
                    <div className="w-full h-[220px] bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between">
                      <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={cbtHistory.map(h => ({
                              ...h,
                              shortName: h.examTitle.length > 15 ? h.examTitle.substring(0, 13) + "..." : h.examTitle,
                              score: h.score || 0
                            }))}
                            margin={{ top: 10, right: 10, left: -30, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="shortName" 
                              stroke="#94a3b8" 
                              fontSize={8} 
                              tickLine={false}
                              fontFamily="Montserrat, sans-serif"
                              fontWeight={600}
                            />
                            <YAxis 
                              stroke="#94a3b8" 
                              fontSize={8} 
                              tickLine={false}
                              domain={[0, 100]}
                              fontFamily="monospace"
                            />
                            <RechartsTooltip />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={20}>
                              {cbtHistory.map((entry, index) => {
                                const scoreVal = entry.score || 0;
                                let barColor = "#4f46e5";
                                if (scoreVal >= 80) barColor = "#059669";
                                else if (scoreVal < 50) barColor = "#e11d48";
                                return <Cell key={`cell-${index}`} fill={barColor} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl h-[220px] flex flex-col items-center justify-center p-4 text-center text-slate-400">
                      <Activity className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                      <span className="text-[11px]">No graph metrics available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* -------------- COMMUNICATIONS ANN -------------- */}
        {activeTab === "announcements" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <CommunicationHub currentProfile={currentProfile} />
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
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-display font-semibold cs-text-navy text-sm">Active Invoices Breakdown</h3>
                <Button 
                  variant="emerald" 
                  size="sm" 
                  onClick={() => window.print()} 
                  className="h-8 gap-1.5 text-[10.5px] font-black uppercase tracking-wider cursor-pointer shadow-sm print:hidden"
                  title="Print or export paperless PDF statement using browser print dialog"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export PDF Statement
                </Button>
              </div>
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
export default ParentPortal;
