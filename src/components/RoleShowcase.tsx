/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap, ClipboardList, Wallet2, Library, BookOpenCheck,
  Award, Globe, Wifi, WifiOff, RefreshCw, ChevronRight, Calculator,
  TrendingUp, CircleDollarSign, CheckCircle2, ShieldAlert, BadgeCheck,
  Send, Users2, FileSpreadsheet, Lock, AlertTriangle, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface RoleShowcaseProps {
  onChoosePlan?: (planKey: string) => void;
}

export default function RoleShowcase({ onChoosePlan }: RoleShowcaseProps) {
  // Main workspace selector
  const [activeWorkspace, setActiveWorkspace] = useState<"cbt" | "results" | "financial" | "unified" | null>(null);

  // State: CBT Demo
  const [cbtSelectedOption, setCbtSelectedOption] = useState<number | null>(null);
  const [cbtSecondsLeft, setCbtSecondsLeft] = useState(120);
  const [cbtWiFiDropped, setCbtWiFiDropped] = useState(false);
  const [cbtQuestionIdx, setCbtQuestionIdx] = useState(0);
  const [cbtAnswers, setCbtAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  // States: Results Template Demo
  const [resultsSubTab, setResultsSubTab] = useState<"half_term" | "full_term" | "full_session">("half_term");
  // Interactive scores for Half-Term
  const [test1Score, setTest1Score] = useState(4.0);
  const [test2Score, setTest2Score] = useState(4.5);
  // Interactive scores for Full-Term
  const [ca1TermScore, setCa1TermScore] = useState(15);
  const [ca2TermScore, setCa2TermScore] = useState(18);
  const [examTermScore, setExamTermScore] = useState(48);

  // States: Financial Reports Demo
  const [financialSubTab, setFinancialSubTab] = useState<"school_fees" | "admissions" | "payroll" | "excursions">("school_fees");
  const [posReconciling, setPosReconciling] = useState(false);
  const [schoolFeesList, setSchoolFeesList] = useState([
    { name: "Folasade Amira Adekunle", class: "SS 2 Science", bill: 170000, paid: 170000, status: "PAID", invoice: "INV-2042" },
    { name: "Chibuzor Emeka Silas", class: "SS 2 Science", bill: 190000, paid: 80000, status: "PARTIAL", invoice: "INV-2044" },
    { name: "Jeremiah David Benson", class: "SS 2 Science", bill: 175000, paid: 0, status: "PENDING", invoice: "INV-2043" }
  ]);
  const [admissionsList, setAdmissionsList] = useState([
    { candidate: "Damilola Alao", tierNeeded: "Creche Essentials", class: "Nursery 1", fee: 45000, state: "Cleared" },
    { candidate: "Somtochukwu K. Okafor", tierNeeded: "Primary Hub", class: "Primary 1", fee: 55000, state: "Pending Verify" }
  ]);
  const [payrollVerified, setPayrollVerified] = useState(false);

  // Math references for interactive results formula
  const halfTermMax = 10; // Combined max raw
  const calculatedHalfTermTotal = Number(((test1Score + test2Score) * 4).toFixed(1)); // Math scaling: (Test 1 + Test 2) * 4 out of 40 marks
  const calculatedTermSumScore = ca1TermScore + ca2TermScore + examTermScore;

  const getFullTermGrade = (score: number) => {
    if (score >= 75) return { grade: "A1", desc: "EXCELLENT DISTINCTION" };
    if (score >= 65) return { grade: "B2", desc: "VERY GOOD" };
    if (score >= 50) return { grade: "C4", desc: "CREDIT PASS" };
    return { grade: "F9", desc: "FAIL - RETAKE REQUIRED" };
  };

  const currentGrade = getFullTermGrade(calculatedTermSumScore);

  // Timer simulation loop for CBT Engine
  useEffect(() => {
    if (examSubmitted) return;
    const interval = setInterval(() => {
      setCbtSecondsLeft((prev) => (prev > 1 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(interval);
  }, [examSubmitted]);

  // Handle CBT Answer Select
  const handleCbtSelect = (optIndex: number) => {
    setCbtSelectedOption(optIndex);
    setCbtAnswers(prev => ({ ...prev, [cbtQuestionIdx]: optIndex }));
    toast.success(`Saved answer to local sandbox cache. Encrypted for local recovery queue.`, {
      icon: <BadgeCheck className="text-emerald-500" />
    });
  };

  // Submit mock exam
  const handleCbtSubmit = () => {
    setExamSubmitted(true);
    toast.success("CBT Sandbox assessment submitted! Score calculated under zero-packet-loss model.", {
      description: "Result queued for Instant Teacher Gradebook sync."
    });
  };

  // Reconcile POS Simulation
  const handleReconcileFees = () => {
    setPosReconciling(true);
    setTimeout(() => {
      setSchoolFeesList(prev => 
        prev.map(item => item.status === "PARTIAL" ? { ...item, status: "PAID", paid: item.bill } : item)
      );
      setPosReconciling(false);
      toast.success("Bursary payment ledger updated! Recount processed instantly with Central Audit ledger logs.", {
        description: "Zero physical paper receipts printed. Notifications fired to Parent companion apps."
      });
    }, 1500);
  };

  // Toggle Internet Drop simulation
  const handleToggleInternet = () => {
    setCbtWiFiDropped(prev => {
      const drop = !prev;
      if (drop) {
        toast.warning("SIMULATED INTERNET DROP ENGAGED: Wi-Fi offline!", {
          description: "Encrypted memory backup active. Keep typing - system saves answers of student without loss of progress."
        });
      } else {
        toast.success("INTERNET RE-ESTABLISHED: Network live!", {
          description: "Instantly synchronized 1 hidden package logs back onto main academy node."
        });
      }
      return drop;
    });
  };

  // Reset CBT Demo
  const handleResetCbtDemo = () => {
    setExamSubmitted(false);
    setCbtSecondsLeft(120);
    setCbtSelectedOption(null);
    setCbtAnswers({});
    setCbtWiFiDropped(false);
    setCbtQuestionIdx(0);
  };

  const sampleQuestions = [
    {
      txt: "If Government Secondary School, Ofabo has a pass benchmark of 50%, what cumulative scores must secondary students attain?",
      opts: [
        "Minimum 50 marks cumulative CA + Exam combined",
        "Higher than 75 marks terminal exam only",
        "It fluctuates depending on principal discretion",
        "They must get exactly 40 marks across all classes"
      ],
      correct: 0
    },
    {
      txt: "Identify the linear multiplier used to scale secondary assessments out of a 40-mark maximum benchmark:",
      opts: [
        "(Test 1 + Test 2) * 2 multiplier",
        "(Test 1 + Test 2) * 4 multiplier",
        "(Test 1 / Test 2) * 10 multiplier",
        "Direct unscaled raw summation out of 100"
      ],
      correct: 1
    }
  ];

  return (
    <section id="demo-workbook" className="py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-4 max-w-4xl mx-auto mb-16">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black text-indigo-950 dark:text-white leading-tight">
            Explore the Workspace & Request a Demo
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
            Experience our school-management logic in action. Click through the live simulation modules below to visualize CBT test resilience, automated score scaling, financial ledger structures, and subscription plans in real-time.
          </p>
        </div>

        {/* WORKSPACE NAV TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-6xl mx-auto mb-10">
          {[
            {
              id: "cbt",
              label: "1. CBT Engine Sandbox",
              icon: GraduationCap,
              color: "border-indigo-500 dark:border-indigo-400 text-indigo-700",
              desc: "Network-Resilient Exam"
            },
            {
              id: "results",
              label: "2. Grades & Linear Scaling",
              icon: Calculator,
              color: "border-emerald-500 dark:border-emerald-400 text-emerald-700",
              desc: "Automated Report Equation"
            },
            {
              id: "financial",
              label: "3. Financial Ledgers",
              icon: Wallet2,
              color: "border-purple-500 dark:border-purple-400 text-purple-700",
              desc: "Bursar Audit Statements"
            },
            {
              id: "unified",
              label: "4. Unified Architecture",
              icon: Library,
              color: "border-amber-500 dark:border-amber-400 text-amber-700",
              desc: "Subscription Core Matrix"
            }
          ].map((tab) => {
            const isSelected = activeWorkspace === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveWorkspace(tab.id as any);
                  toast.info(`Switched interface focus to ${tab.label}`);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative ${
                  isSelected 
                    ? "bg-indigo-950 border-indigo-600 text-white dark:bg-slate-900 dark:border-indigo-500 shadow-xl scale-[1.02]" 
                    : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                    <TabIcon size={18} />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className={`text-xs font-black tracking-tight ${isSelected ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"}`}>
                    {tab.desc}
                  </span>
                  <h4 className="font-sans font-black text-[13px] sm:text-[14px] leading-tight block mt-0.5">
                    {tab.label}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>

        {/* WORKSPACE DETAILED PLATFORM PANEL */}
        {activeWorkspace === null ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-950 border-2 border-indigo-200/50 dark:border-indigo-950/50 rounded-3xl shadow-xl p-10 sm:p-14 max-w-4xl mx-auto text-center space-y-6"
          >
            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-indigo-650 dark:text-indigo-400">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-xl sm:text-2xl font-black text-indigo-950 dark:text-white uppercase tracking-wide">
                Interactive Workspace Simulator
              </h3>
              <p className="text-sm sm:text-base font-extrabold text-slate-850 dark:text-slate-100 max-w-lg mx-auto leading-relaxed">
                Click on any of the interactive card tabs above to launch the live school operation simulator. Verify CBT candidate buffers, score scaling formulas, and transparent ledger accounts in real-time.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2 text-xs font-mono">
              <span className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-800 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-800">🔍 Live Sandbox Ready</span>
              <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-full text-emerald-800 dark:text-emerald-400 font-extrabold border border-emerald-150">💡 One Hub for Every School</span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden max-w-6xl mx-auto grid lg:grid-cols-12 gap-0">
          
          {/* DEMO DESCRIPTION SIDEBAR (5 Columns) */}
          <div className="p-8 sm:p-10 lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="space-y-6">
              
              {activeWorkspace === "cbt" && (
                <div className="space-y-4">
                  <h3 className="font-sans text-2xl font-black text-indigo-950 dark:text-white leading-tight">
                    Resilient Student CBT Exam Suite
                  </h3>
                  <p className="text-slate-750 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed font-semibold">
                    Designed specifically for areas with unstable internet infrastructure. Our quiz taking mechanism auto-encrypts answers in the browser's persistent cache when connections drop, synchronizing back automatically when online.
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-[9.5px] font-black text-slate-550 uppercase tracking-wider block">Key Capabilities:</span>
                    <ul className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Zero Data-Loss Matrix</strong>: Browser level memory encryption prevents lost state records.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Live Offline Flag Alert</strong>: Triggers visual hints to reassure nervous candidates during outrages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Immediate Score Queuing</strong>: Syncs raw score indices directly with teachers as soon as Wi-Fi revives.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeWorkspace === "results" && (
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100">
                    AUTOMATED GRADING SYSTEMS
                  </span>
                  <h3 className="font-sans text-2xl font-black text-indigo-950 dark:text-white leading-tight">
                    Academic Grading & Formula Scaling
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                    Corner Streams handles strict evaluation formulas with total automation. Preview our Half-Term linear equations, terminal score aggregators, and side-by-side progression tracking ledgers below.
                  </p>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Interactive Verification Formula:</span>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-indigo-900 dark:text-indigo-300 leading-normal">
                      <div className="font-black border-b border-indigo-100 dark:border-indigo-950 pb-1 mb-1">
                        Half-Term Equation:
                      </div>
                      <span className="text-emerald-600 font-bold">(Test 1 + Test 2) &times; 4</span>
                      <br />
                      Scales score out of 40 points total. Drag the selectors on the right side of the module to observe changes!
                    </div>
                  </div>
                </div>
              )}

              {activeWorkspace === "financial" && (
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100">
                    AUDITED BURSARY LEDGERS
                  </span>
                  <h3 className="font-sans text-2xl font-black text-indigo-950 dark:text-white leading-tight">
                    Real-Time Financial Clearsing
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                    Eliminate physical ledger errors. Our platform connects POS logs, bank transfer receipts, and teacher payroll entries cleanly into one unified bursary spreadsheet with automatic WhatsApp companion syncs.
                  </p>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Featured Subsystems:</span>
                    <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-purple-500" />
                        <span><strong>School Fees Reconciliation</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-purple-500" />
                        <span><strong>Admissions Deposits Track</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-purple-500" />
                        <span><strong>Verifiable Payroll Receipts</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeWorkspace === "unified" && (
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100">
                    CAMPUS MULTI-TIER DESIGN
                  </span>
                  <h3 className="font-sans text-2xl font-black text-indigo-950 dark:text-white leading-tight">
                    Creche-to-Secondary Architecture
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed">
                    A comprehensive suite scaling elegantly from infant nurseries to advanced secondary colleges. Multi-school owners govern independent licenses under single unified super admin accounts.
                  </p>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Supported Cohorts:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">All Grades</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Modular license structures mean nurseries avoid paying for computer-based testing suites while high schools enjoy the full enterprise spectrum.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* ACTION FOOTER */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 space-y-3">
              <span className="text-[10px] text-slate-400 block font-semibold">Interested in setting up a Demo session?</span>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="#contact"
                  className="px-4 py-2.5 bg-indigo-650 text-white text-xs font-black uppercase tracking-wider rounded-xl transition hover:bg-indigo-755 flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  Request Customized Demo
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* SIMULATION WORKSPACE STAGE (7 Columns) */}
          <div className="p-6 sm:p-8 lg:col-span-7 bg-[#f8fafc] dark:bg-slate-900/40 flex items-center justify-center min-h-[460px] relative">
            
            <AnimatePresence mode="wait">
              
              {/* CBT ENGINE SIMULATION */}
              {activeWorkspace === "cbt" && (
                <motion.div
                  key="cbt"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4"
                >
                  {/* Internal Bar */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-indigo-600 dark:text-indigo-400 w-5 h-5 animate-pulse" />
                      <span className="font-sans font-black text-xs text-indigo-950 dark:text-white uppercase tracking-wider">
                        Government Secondary School, Ofabo
                      </span>
                    </div>

                    {/* WiFi Resiliency Simulation Switcher */}
                    <button
                      onClick={handleToggleInternet}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-black transition cursor-pointer border ${
                        cbtWiFiDropped 
                          ? "bg-rose-50 border-rose-250 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" 
                          : "bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                      }`}
                    >
                      {cbtWiFiDropped ? (
                        <>
                          <WifiOff size={12} className="animate-bounce" />
                          Offline Mode Active
                        </>
                      ) : (
                        <>
                          <Wifi size={12} />
                          Network Online
                        </>
                      )}
                    </button>
                  </div>

                  {examSubmitted ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 dark:border-emerald-800 shadow-md">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-sans font-black text-sm text-indigo-950 dark:text-white uppercase tracking-wide">
                          Exam Swiped & Processed
                        </h4>
                        <p className="text-xs text-slate-755 leading-relaxed max-w-xs mx-auto font-medium">
                          Simulated answers compiled. All 2 responses saved offline, scaled instantly under strict compliance algorithms.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-left text-[11px] font-mono border border-slate-150 dark:border-slate-850">
                        <div className="text-slate-600 dark:text-slate-400 font-bold">Sandbox Audit Logs:</div>
                        <div className="text-emerald-600 font-black">&gt; Answer Q1: {cbtAnswers[0] !== undefined ? `Option ${cbtAnswers[0] + 1}` : "Skipped"}</div>
                        <div className="text-emerald-600 font-black">&gt; Answer Q2: {cbtAnswers[1] !== undefined ? `Option ${cbtAnswers[1] + 1}` : "Skipped"}</div>
                        <div className="text-amber-600 font-bold">&gt; File State: Encrypted Local Cookie & Sync Verified</div>
                      </div>
                      <button
                        onClick={handleResetCbtDemo}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer"
                      >
                        Reset Simulator
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Timer Bar */}
                      <div className="flex justify-between items-center text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          📋 Question {cbtQuestionIdx + 1} of 2
                        </span>
                        <span className={`font-black flex items-center gap-1 ${cbtSecondsLeft < 30 ? "text-rose-600 animate-pulse" : "text-indigo-600"}`}>
                          ⌛ T-Minus: {Math.floor(cbtSecondsLeft / 60)}:{(cbtSecondsLeft % 60).toString().padStart(2, "0")}s
                        </span>
                      </div>
 
                      {/* Question Content */}
                      <div className="space-y-3">
                        <p className="font-sans font-black text-[13px] sm:text-[14px] text-indigo-950 dark:text-white leading-relaxed">
                          {sampleQuestions[cbtQuestionIdx].txt}
                        </p>
 
                        <div className="space-y-2">
                          {sampleQuestions[cbtQuestionIdx].opts.map((opt, oindex) => {
                            const isChosenByStudent = cbtAnswers[cbtQuestionIdx] === oindex;
                            return (
                              <button
                                key={oindex}
                                onClick={() => handleCbtSelect(oindex)}
                                className={`w-full p-2.5 text-left text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                                  isChosenByStudent
                                    ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-950/30 text-indigo-805 dark:text-indigo-300 font-extrabold shadow-sm"
                                    : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] uppercase font-black shrink-0 ${
                                  isChosenByStudent 
                                    ? "bg-indigo-600 text-white" 
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}>
                                  {String.fromCharCode(65 + oindex)}
                                </span>
                                <span className="text-[11.5px] sm:text-xs font-bold">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
 
                      {/* Controls */}
                      <div className="flex justify-between items-center pt-2">
                        <button
                          disabled={cbtQuestionIdx === 0}
                          onClick={() => setCbtQuestionIdx(0)}
                          className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-black text-slate-700 hover:text-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          Previous
                        </button>
                        
                        <div className="flex gap-1.5">
                          {cbtQuestionIdx === 0 ? (
                            <button
                              onClick={() => setCbtQuestionIdx(1)}
                              className="h-8 px-4 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition cursor-pointer shadow-sm"
                            >
                              Next Question
                            </button>
                          ) : (
                            <button
                              onClick={handleCbtSubmit}
                              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-black uppercase tracking-wider rounded-lg transition cursor-pointer shadow-sm"
                            >
                              Submit Quiz
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Simulated internet broken hint */}
                      {cbtWiFiDropped && (
                        <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 animate-pulse text-[11px]">
                          <AlertTriangle size={13} className="shrink-0" />
                          <span>Internet Connection Offline. Quiz is operating statefully on secure offline cache storage.</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
                     {/* GRADES AND EQUATION SCALING SIMULATION */}
              {activeWorkspace === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-5 sm:p-6 space-y-4 text-slate-900"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="text-emerald-600 w-5 h-5" />
                      <span className="font-sans font-black text-xs text-indigo-950 uppercase tracking-wider">
                        Report Template Equations
                      </span>
                    </div>

                    {/* Report Format Selector */}
                    <div className="flex bg-slate-100 p-1.0 rounded-lg text-[9px] font-black uppercase border border-slate-200">
                      {[
                        { id: "half_term", label: "Half-Term" },
                        { id: "full_term", label: "Full Term" },
                        { id: "full_session", label: "Session Grid" }
                      ].map((stb) => (
                        <button
                          key={stb.id}
                          onClick={() => setResultsSubTab(stb.id as any)}
                          className={`px-2.5 py-1 rounded cursor-pointer font-black transition ${
                            resultsSubTab === stb.id
                              ? "bg-indigo-650 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-850"
                          }`}
                        >
                          {stb.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {resultsSubTab === "half_term" && (
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-indigo-50/80 text-indigo-950 rounded-xl space-y-1 shadow-inner border border-indigo-200/60">
                        <span className="text-[9px] font-black text-indigo-800 uppercase tracking-widest block">Strict Linear Scoring Scaling</span>
                        <div className="text-sm font-sans font-black flex justify-between items-center">
                          <span className="font-extrabold text-indigo-950">Scaled Score Tally:</span>
                          <span className="text-emerald-700 font-mono text-lg font-black">{calculatedHalfTermTotal} / 40.0 Marks</span>
                        </div>
                        <p className="text-[9.5px] text-slate-800 leading-normal font-mono font-black">
                          Formula logic: ((Test 1 [Max 5] + Test 2 [Max 5]) &times; 4) = Benchmarked 40 Marks max.
                        </p>
                      </div>

                      {/* Interactive Drag Slides */}
                      <div className="space-y-3.5 pt-1">
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between text-[11px] font-black text-slate-850">
                            <span>Test 1 (Raw Multiplier Input):</span>
                            <span className="font-mono text-indigo-700 font-black">{test1Score} / 5.0 pts</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={test1Score}
                            onChange={(e) => setTest1Score(parseFloat(e.target.value))}
                            className="w-full accent-indigo-650 cursor-pointer h-2"
                          />
                        </div>

                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between text-[11px] font-black text-slate-850">
                            <span>Test 2 (Raw Multiplier Input):</span>
                            <span className="font-mono text-indigo-700 font-black">{test2Score} / 5.0 pts</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={test2Score}
                            onChange={(e) => setTest2Score(parseFloat(e.target.value))}
                            className="w-full accent-indigo-650 cursor-pointer h-2"
                          />
                        </div>
                      </div>

                      {/* Complete arithmetic check */}
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1.5 font-mono text-[10.5px] text-slate-800 text-left font-black">
                        <span className="text-emerald-800 font-black uppercase text-[10px] block">Arithmetic Sandbox:</span>
                        <div>&bull; Sum of assessments: {test1Score} + {test2Score} = {(test1Score + test2Score).toFixed(1)} / 10</div>
                        <div>&bull; Applying 4.0x scale coefficient: {(test1Score + test2Score).toFixed(1)} &times; 4 = {calculatedHalfTermTotal}</div>
                        <div>&bull; Benchmark outcome: <span className="font-black text-emerald-750">{calculatedHalfTermTotal >= 20 ? "PASS / ACCEPTABLE PROGRESS" : "RE-EVALUATION NEEDED"}</span></div>
                      </div>
                    </div>
                  )}

                  {resultsSubTab === "full_term" && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-55 rounded-xl border border-slate-250 space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Cumulative Grader Simulation</span>
                          <span className="font-mono text-indigo-700 font-black">Score total: 100 max</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-[9.5px] text-slate-755 uppercase font-black block">CA 1 (Max 20)</span>
                            <input 
                              type="number" 
                              min="0" 
                              max="20" 
                              value={ca1TermScore} 
                              onChange={(e) => setCa1TermScore(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full h-8 px-2 border-2 border-slate-300 rounded-md bg-white text-xs text-center text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-755 uppercase font-black block">CA 2 (Max 20)</span>
                            <input 
                              type="number" 
                              min="0" 
                              max="20" 
                              value={ca2TermScore} 
                              onChange={(e) => setCa2TermScore(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full h-8 px-2 border-2 border-slate-300 rounded-md bg-white text-xs text-center text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-755 uppercase font-black block">Exam (Max 60)</span>
                            <input 
                              type="number" 
                              min="0" 
                              max="60" 
                              value={examTermScore} 
                              onChange={(e) => setExamTermScore(Math.min(60, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full h-8 px-2 border-2 border-slate-300 rounded-md bg-white text-xs text-center text-slate-900 font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display sheet output */}
                      <div className="p-4 bg-white border-2 border-slate-300 rounded-xl flex items-center justify-between shadow-md">
                        <div>
                          <span className="text-[9.5px] font-black text-slate-450 uppercase block tracking-wide">Output Assessment Card</span>
                          <div className="text-sm font-sans font-black text-indigo-950 mt-1">
                            Amira Okafor &bull; SS 2 Art
                          </div>
                          <p className="text-[10.5px] text-indigo-850 mt-1 uppercase font-mono tracking-tighter font-black">
                            📊 Total Index: {calculatedTermSumScore} points ({currentGrade.desc})
                          </p>
                        </div>

                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex flex-col items-center justify-center text-emerald-850 border-2 border-emerald-500 shadow-md shrink-0">
                          <span className="text-xl font-black font-sans leading-none">{currentGrade.grade}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-600 leading-normal text-left font-mono font-bold">
                        💡 System boundaries: **A1** (&ge;75) &bull; **B2** (&ge;65) &bull; **C4** (&ge;50) &bull; **F9** (&lt;50)
                      </div>
                    </div>
                  )}

                  {resultsSubTab === "full_session" && (
                    <div className="space-y-3 text-xs overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300 text-left">
                        <thead>
                          <tr className="bg-slate-100 font-black text-slate-800 text-[10px] uppercase tracking-wider">
                            <th className="p-2 border border-slate-300">Subject</th>
                            <th className="p-2 border border-slate-300 text-center">Term 1</th>
                            <th className="p-2 border border-slate-300 text-center">Term 2</th>
                            <th className="p-2 border border-slate-300 text-center">Term 3</th>
                            <th className="p-2 border border-slate-300 text-center">Average</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-[10.5px] font-black">
                          {[
                            { subj: "Mathematics MTH401", t1: "80 (A)", t2: "75 (A)", t3: "82 (A)", avg: "79 (A)" },
                            { subj: "English Lang ENG401", t1: "68 (B)", t2: "71 (B)", t3: "74 (B)", avg: "71 (B)" },
                            { subj: "Physics PHY412", t1: "54 (C)", t2: "48 (F)", t3: "62 (C)", avg: "54 (C)" }
                          ].map((row, rindex) => (
                            <tr key={rindex} className="hover:bg-slate-55 bg-white">
                              <td className="p-2 border border-slate-300 font-sans font-bold text-indigo-950">{row.subj}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-805">{row.t1}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-805">{row.t2}</td>
                              <td className="p-2 border border-slate-300 text-center text-slate-805">{row.t3}</td>
                              <td className="p-2 border border-slate-300 text-center font-black text-indigo-700">{row.avg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex gap-1.5 items-center p-2.5 bg-indigo-50 border border-indigo-200 rounded text-[10px] leading-relaxed text-indigo-950 font-black">
                        <TrendingUp size={12} className="shrink-0 text-indigo-700" />
                        <span>Interactive comparative analytics track student terms linearly side-by-side to highlight decline before final sessions end.</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* FINANCIAL REPORTS LEDGER */}
              {activeWorkspace === "financial" && (
                <motion.div
                  key="financial"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Wallet2 className="text-purple-600 w-5 h-5 flex-shrink-0" />
                      <span className="font-sans font-black text-xs text-indigo-950 dark:text-white uppercase tracking-wider">
                        Real-Time Bursary Vouchers
                      </span>
                    </div>

                    {/* Ledger format selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg text-[8px] font-black uppercase border border-slate-200 dark:border-slate-850">
                      {[
                        { id: "school_fees", label: "School Fees" },
                        { id: "admissions", label: "Admissions" },
                        { id: "payroll", label: "Payroll Feed" },
                        { id: "excursions", label: "Excursion Logs" }
                      ].map((subT) => (
                        <button
                          key={subT.id}
                          onClick={() => setFinancialSubTab(subT.id as any)}
                          className={`px-1.5 py-1 rounded cursor-pointer ${
                            financialSubTab === subT.id ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-400"
                          }`}
                        >
                          {subT.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {financialSubTab === "school_fees" && (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconciliation Ledger Status Check</span>
                        <button
                          onClick={handleReconcileFees}
                          disabled={posReconciling}
                          className="px-3 h-7 bg-purple-700 hover:bg-purple-650 text-white font-black uppercase text-[8px] tracking-wider rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw size={10} className={posReconciling ? "animate-spin" : ""} />
                          {posReconciling ? "Reconciling POS..." : "Simulate POS/Transfer Sync"}
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto">
                        {schoolFeesList.map((item, idindex) => (
                          <div key={idindex} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center text-left">
                            <div>
                              <div className="font-black text-indigo-950 dark:text-white text-xs">{item.name}</div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Invoice {item.invoice} &bull; {item.class}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded block text-center border ${
                                item.status === "PAID" 
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-100" 
                                  : item.status === "PARTIAL" 
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-100 animate-pulse" 
                                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 border-rose-100"
                              }`}>
                                {item.status}
                              </span>
                              <strong className="text-xs font-mono font-black mt-1 block dark:text-white">
                                ₦{item.paid.toLocaleString()} / ₦{item.bill.toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-100 text-[10px] text-purple-700 leading-normal text-left">
                        👉 <strong>Clearance Locks Active:</strong> Jeremiah Benson's portal will lock report-checking or CBT engines automatically unless bills are balanced. Reconcile the ledger above using POS simulation to see the system update.
                      </div>
                    </div>
                  )}

                  {financialSubTab === "admissions" && (
                    <div className="space-y-3.5 text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">New Student Registration Tallies</span>
                      
                      <div className="space-y-2">
                        {admissionsList.map((ad, index) => (
                          <div key={index} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-left">
                            <div>
                              <strong className="text-xs text-indigo-950 dark:text-white block">{ad.candidate}</strong>
                              <span className="text-[10.0px] text-emerald-600 dark:text-emerald-400 font-mono">{ad.tierNeeded} &bull; Class: {ad.class}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-indigo-950 font-bold border border-amber-100 dark:border-indigo-900 text-slate-600 dark:text-indigo-350">{ad.state}</span>
                              <span className="font-mono block mt-1 font-black text-slate-700 dark:text-slate-300">₦{ad.fee.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border text-[10px] text-slate-500 leading-relaxed text-left">
                        📊 <strong>Bursar Sync:</strong> Enrollment fees are recorded as isolated admission deposits and do not blend with standard tuition totals.
                      </div>
                    </div>
                  )}

                  {financialSubTab === "payroll" && (
                    <div className="space-y-4 text-xs text-left">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-850">
                          <strong className="font-black text-indigo-950 dark:text-white uppercase text-[10px]">Staffroom Payroll Ledger Vouchers</strong>
                          <span className="text-[9px] font-mono text-emerald-600 uppercase font-black">Reconciled Batch 04A</span>
                        </div>

                        <div className="space-y-2 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Teacher: Mrs. Folasade Adebayo (SS 2 Science)</span>
                            <strong className="text-emerald-600 font-bold">₦120,400.00 PAID</strong>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Status: Bank Receipt Verification Fired</span>
                            <span className="bg-emerald-50 text-emerald-600 rounded px-1 text-[9px]">Verified</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPayrollVerified(true);
                            toast.success("Voucher transaction message queued for WhatsApp companion delivery!");
                          }}
                          className="w-full h-8 px-3 bg-indigo-950 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                        >
                          {payrollVerified ? "✓ Voucher Dispatched & Logged" : "Dispatch Salary Voucher Notification Email"}
                        </button>
                      </div>
                    </div>
                  )}

                  {financialSubTab === "excursions" && (
                    <div className="space-y-3 text-xs text-left">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project-Based Excursion Ledger Tracking</span>
                      
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between">
                          <strong className="text-xs text-indigo-950 dark:text-white font-bold uppercase">Field Trip to Lokoja Historic Sights</strong>
                          <span className="text-[10px] text-purple-600 font-bold">₦12,000 / Student</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Approved by School Admin on July 10, 2026. Required for all Senior Art historians.
                        </p>
                        <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-850">
                          <span className="text-slate-400">Deposits: 24 of 30 Scaled</span>
                          <strong className="text-slate-800 dark:text-white">Status: 80% Paid Out</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* UNIFIED SUBSCRIPTION SYSTEM */}
              {activeWorkspace === "unified" && (
                <motion.div
                  key="unified"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Library className="text-amber-600 w-5 h-5 flex-shrink-0" />
                      <span className="font-sans font-black text-xs text-indigo-950 dark:text-white uppercase tracking-wider">
                        Creche-to-Secondary Tiers
                      </span>
                    </div>
                    <span className="text-[9.0px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 uppercase font-black border border-amber-200">
                      Standardized Pricing
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-left space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <strong className="text-xs font-black text-indigo-950 dark:text-white uppercase">CBT Essentials Tier</strong>
                          <span className="text-[9px] font-mono font-black text-slate-400">Hub core</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Our network-resilient offline first CBT engine, custom curriculum managers, and local score buffers.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Subscription Cost:</span>
                        <strong className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">₦40,000 / Term</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-55 dark:bg-slate-950 border border-indigo-150 dark:border-indigo-900 text-left space-y-2 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-600 text-white text-[7.5px] uppercase font-bold tracking-widest rounded-bl">
                        Popular Selection
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <strong className="text-xs font-black text-indigo-900 dark:text-white uppercase">Digital Reports Tier</strong>
                          <span className="text-[9px] font-mono font-black text-indigo-700">Best Valuation</span>
                        </div>
                        <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                          Gradebooks, 5-star skills, principal digital signature verification barcodes, and student report PDFs.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold">Subscription Cost:</span>
                        <strong className="text-sm font-mono font-black text-indigo-650 dark:text-indigo-405">₦50,000 / Term</strong>
                      </div>
                    </div>

                  </div>

                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-150 text-left space-y-1.5 text-[11px] leading-normal text-slate-600 dark:text-slate-405">
                    <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-400 font-sans">
                      <ShieldAlert size={12} className="shrink-0" />
                      Unified Enterprise Academic Suite Selection
                    </div>
                    <p className="text-[10px] font-sans">
                      Combine <strong>CBT + Digital Reports + Bursar Ledgers</strong> side-by-side for ultimate automation across nursery and secondary arms. Save more than 30% on combined institutional accounts.
                    </p>
                    <button
                      onClick={() => onChoosePlan && onChoosePlan("unified_enterprise")}
                      className="w-full mt-1.5 h-8 bg-amber-600 font-sans hover:bg-amber-550 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all"
                    >
                      Configure Premium Node Hub Access &rarr;
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

          </div>
        )}

      </div>
    </section>
  );
}
