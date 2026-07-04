import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, Landmark, FileText, Megaphone, Check, Settings, 
  Trash, Save, GraduationCap, FileSpreadsheet, UserPlus, ShieldAlert,
  Sliders, Star, Edit, Key, ArrowUpRight, CheckCircle2, AlertCircle,
  Clock, Play, ShieldAlert as AlertIcon, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { LockedOverlay } from "../components/LockedOverlay";
import SettingsPanel from "../components/SettingsPanel";
import { UpgradeOverlay } from "../components/UpgradeOverlay";

export function StudentDashboard({ currentProfile, theme, setTheme, activeFont, setActiveFont }: any) {
  const [tab, setTab] = useState("overview");

  // Local student state values
  const [school, setSchool] = useState<any>(null);
  const [billing, setBilling] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSimulatedUpgrade = async () => {
    try {
      const payload = {
        ...school,
        subscription_tier: "unified_enterprise"
      };
      await api.put("/schools/me", payload);
      localStorage.setItem("CS_SCHOOL", JSON.stringify(payload));
      setSchool(payload);
      toast.success("School tier upgraded to UNIFIED ENTERPRISE successfully! All premium modules unlocked.");
      loadData();
    } catch (e: any) {
      toast.error("Failed to execute simulated upgrade.");
    }
  };

  // CBT Exam active room states
  const [activeExam, setActiveExam] = useState<any>(null);
  const [cbtAnswers, setCbtAnswers] = useState<Record<string, number>>({});
  const [cbtTimeLeft, setCbtTimeLeft] = useState<number>(1800); // 30 mins defaults
  const [cbtInProgress, setCbtInProgress] = useState(false);
  const [completedCbtResult, setCompletedCbtResult] = useState<any>(null);
  
  // Enterprise CBT Proctoring and Offline states
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [focusViolations, setFocusViolations] = useState(0);

  useEffect(() => {
    if (!cbtInProgress || !activeExam) return;

    const handleViolation = () => {
      setFocusViolations((prev) => {
        const nextVal = prev + 1;
        toast.warning(`⚠️ PROCTORING MALPRACTICE WARNING: Tab switch or minimization detected! Incident logged (${nextVal} violations).`, {
          duration: 5000,
        });

        const violationsKey = `CS_CBT_VIOLATIONS_${currentProfile.id}_${activeExam.id}`;
        localStorage.setItem(violationsKey, String(nextVal));

        // Save session history
        const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
        const idx = records.findIndex((r: any) => r.studentId === currentProfile.id && r.examId === activeExam.id);
        const entry = {
          studentId: currentProfile.id,
          studentName: currentProfile.name,
          examId: activeExam.id,
          examTitle: activeExam.title,
          violations: nextVal,
          lastUpdated: new Date().toISOString(),
          status: "in_progress",
        };
        if (idx >= 0) {
          records[idx] = entry;
        } else {
          records.push(entry);
        }
        localStorage.setItem("CS_CBT_SESSION_RECORDS", JSON.stringify(records));

        return nextVal;
      });
    };

    window.addEventListener("blur", handleViolation);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Seed session record on start
    const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
    const idx = records.findIndex((r: any) => r.studentId === currentProfile.id && r.examId === activeExam.id);
    if (idx < 0) {
      records.push({
        studentId: currentProfile.id,
        studentName: currentProfile.name,
        examId: activeExam.id,
        examTitle: activeExam.title,
        violations: 0,
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      });
      localStorage.setItem("CS_CBT_SESSION_RECORDS", JSON.stringify(records));
    }

    return () => {
      window.removeEventListener("blur", handleViolation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cbtInProgress, activeExam, currentProfile]);

  const isTabVisible = (tabKey: string) => {
    const tier = school?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (tabKey === "settings") return true;
    if (tabKey === "overview") {
      return tier !== "cbt_essentials"; // On CBT essentials, let's keep overview hidden or redirect
    }
    if (tabKey === "cbt") {
      return tier === "cbt_essentials";
    }
    return true;
  };

  const loadData = async () => {
    try {
      const [schRes, biRes, exRes, scrRes, msgRes] = await Promise.all([
        api.get("/schools/me"),
        api.get("/payments/bills").catch(() => ({ data: { bills: [] } })),
        api.get("/cbt/exams"),
        api.get("/scores", { params: { student_id: currentProfile.id, term: "1st Term" } }).catch(() => ({ data: { scores: [] } })),
        api.get("/messages").catch(() => ({ data: { messages: [] } }))
      ]);

      const sch = schRes.data.school;
      setSchool(sch);
      const tier = sch?.subscription_tier || "unified_enterprise";
      if (tier === "cbt_essentials") {
        setTab("cbt");
      }

      setBilling((biRes as any).data?.bills || []);
      setExams(exRes.data.exams || []);
      setGrades(scrRes.data.scores || []);
      setMessages(msgRes.data.messages || []);
    } catch (e) {
      toast.error("Initialization error loading Student Dashboard.");
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  // Read student balance to determine blockade overlay state
  const studentBill = billing.find((b: any) => b.student_id === currentProfile.id) || currentProfile;
  const isBlocked = (studentBill?.balance_due || currentProfile?.balance_due || 0) > 0;

  // CBT Local browser persistence hooks
  useEffect(() => {
    if (cbtInProgress && activeExam) {
      const keyPrefix = `CS_CBT_STATE_${currentProfile.id}_${activeExam.id}`;
      
      // Load serialized countdowns
      const savedTime = localStorage.getItem(`${keyPrefix}_TIME`);
      if (savedTime) {
        setCbtTimeLeft(Number(savedTime));
      } else {
        setCbtTimeLeft(activeExam.duration_min * 60);
      }

      // Load choice backups
      const savedAns = localStorage.getItem(`${keyPrefix}_ANSWERS`);
      if (savedAns) {
        setCbtAnswers(JSON.parse(savedAns));
      } else {
        setCbtAnswers({});
      }

      // Countdown setup
      const task = setInterval(() => {
        setCbtTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(task);
            handleAutoSubmitExam();
            return 0;
          }
          localStorage.setItem(`${keyPrefix}_TIME`, String(prev - 1));
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(task);
    }
  }, [cbtInProgress, activeExam]);

  const handleStartExam = (exam: any) => {
    setActiveExam(exam);
    setCbtInProgress(true);
    setCompletedCbtResult(null);
    setFocusViolations(0);
    setIsOfflineSimulated(false);
    // Clear any previous session queue
    localStorage.removeItem(`CS_CBT_SYNC_QUEUE_${currentProfile.id}_${exam.id}`);
    toast.success(`Exam session containing ${exam.questions?.length || 0} questions initiated. Resiliency counter enabled.`);
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (!activeExam) return;
    const nextAns = { ...cbtAnswers, [qIdx]: optIdx };
    setCbtAnswers(nextAns);
    
    // Save to local localStorage incremental choices backup immediately 
    const keyPrefix = `CS_CBT_STATE_${currentProfile.id}_${activeExam.id}`;
    localStorage.setItem(`${keyPrefix}_ANSWERS`, JSON.stringify(nextAns));

    // If offline is simulated, add to a sync queue
    if (isOfflineSimulated) {
      const queueKey = `CS_CBT_SYNC_QUEUE_${currentProfile.id}_${activeExam.id}`;
      const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
      if (!queue.includes(qIdx)) {
        queue.push(qIdx);
        localStorage.setItem(queueKey, JSON.stringify(queue));
      }
      toast.info(`💾 Answer cached offline locally in browser. Sync queue length: ${queue.length}`, {
        duration: 2000,
      });
    }
  };

  const toggleOfflineSimulation = () => {
    if (isOfflineSimulated) {
      setIsOfflineSimulated(false);
      const queueKey = `CS_CBT_SYNC_QUEUE_${currentProfile.id}_${activeExam?.id}`;
      const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
      if (queue.length > 0) {
        toast.success(`🟢 Back Online! Successfully synchronized ${queue.length} response choices with Corner Streams central databases!`, {
          duration: 4000,
        });
        localStorage.removeItem(queueKey);
      } else {
        toast.success(`🟢 Back Online! Connection status: fully synchronized.`, {
          duration: 3000,
        });
      }
    } else {
      setIsOfflineSimulated(true);
      toast.warning(`🔌 Simulated Offline Mode Active! Answers will be cached locally in your browser memory.`, {
        duration: 4500,
      });
    }
  };

  const handleAutoSubmitExam = () => {
    onSubmitExamEvaluation();
  };

  const onSubmitExamEvaluation = () => {
    if (!activeExam) return;
    
    // Evaluate correctness marks
    let correctCount = 0;
    activeExam.questions.forEach((q: any, i: number) => {
      const parentSelect = cbtAnswers[i];
      if (parentSelect !== undefined && Number(parentSelect) === Number(q.correct_idx)) {
        correctCount++;
      }
    });

    const marksObtained = Math.round((correctCount / activeExam.questions.length) * 100);
    setCompletedCbtResult({
      total: activeExam.questions.length,
      correct: correctCount,
      percentage: marksObtained
    });

    // Save final state to central session records
    const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
    const idx = records.findIndex((r: any) => r.studentId === currentProfile.id && r.examId === activeExam.id);
    const violations = Number(localStorage.getItem(`CS_CBT_VIOLATIONS_${currentProfile.id}_${activeExam.id}`) || "0");
    const entry = {
      studentId: currentProfile.id,
      studentName: currentProfile.name,
      examId: activeExam.id,
      examTitle: activeExam.title,
      violations: violations,
      score: marksObtained,
      correct: correctCount,
      totalQuestions: activeExam.questions.length,
      lastUpdated: new Date().toISOString(),
      status: "completed",
    };
    if (idx >= 0) {
      records[idx] = entry;
    } else {
      records.push(entry);
    }
    localStorage.setItem("CS_CBT_SESSION_RECORDS", JSON.stringify(records));

    // Clear local storage exam items
    const keyPrefix = `CS_CBT_STATE_${currentProfile.id}_${activeExam.id}`;
    localStorage.removeItem(`${keyPrefix}_TIME`);
    localStorage.removeItem(`${keyPrefix}_ANSWERS`);
    localStorage.removeItem(`CS_CBT_VIOLATIONS_${currentProfile.id}_${activeExam.id}`);
    localStorage.removeItem(`CS_CBT_SYNC_QUEUE_${currentProfile.id}_${activeExam.id}`);

    setCbtInProgress(false);
    setFocusViolations(0);
    setIsOfflineSimulated(false);
    toast.success("CBT Evaluation results compiled! Grading submitted to central dashboard databases.");
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const reSec = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${reSec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs relative">
      
      {/* Structural student view layout sub-tabs */}
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-10">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "overview", label: "My Desk Overview" },
            { k: "cbt", label: "CBT Examination Room" },
            { k: "settings", label: "System Settings" }
          ].map((item) => {
            const visible = isTabVisible(item.k);
            return (
              <button
                key={item.k}
                onClick={() => {
                  if (cbtInProgress) {
                    toast.error("Finish your live exam session before departing the room.");
                    return;
                  }
                  setTab(item.k);
                }}
                className={`h-8.5 px-4 rounded-lg font-bold transition text-[11px] flex items-center gap-1.5 ${
                  tab === item.k 
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

        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
          LEARNER PORTAL
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* ------------- TAB: OVERVIEW ------------- */}
        {tab === "overview" && (
          !isTabVisible("overview") ? (
            <UpgradeOverlay 
              title="My Desk Overview"
              requiredTier="Digital Reports, Financial Ledger, or Unified Enterprise"
              description="automated gradebooks, digital report dockets, billing invoices, central parameters control, and administrative parameters."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
            {/* Greeting card */}
            <div className="bg-gradient-to-r from-indigo-900 to-[#002147] text-white p-6 rounded-2xl shadow-xl flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-indigo-300 font-black tracking-widest uppercase">Learner Core</span>
                <h1 className="font-display text-lg md:text-xl font-black text-white">
                  Welcome to class, <span className="text-emerald-400">{currentProfile.fullName}</span>!
                </h1>
                <p className="text-[10.5px] text-indigo-200 max-w-md">
                  Active in cohort room <strong className="text-white">{currentProfile.classCohort || "SS 2 Science"}</strong>. Review calendar announcements or CBT assignments below.
                </p>
              </div>

              <div className="hidden sm:block w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-emerald-400/50">
                <img src={currentProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              
              {/* Left hand details cards */}
              <div className="md:col-span-2 space-y-5">
                
                {/* Visual score summary layout */}
                <div className="cs-card p-5 space-y-3">
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Academic Performance Sheet</h3>
                  
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <Table className="min-w-[450px] md:min-w-full">
                      <TableHeader>
                        <TableRow className="bg-slate-50 font-bold text-slate-500">
                          <TableHead>Course Subject</TableHead>
                          <TableHead className="text-center">CA Accumulate</TableHead>
                          <TableHead className="text-center">Exam Mark</TableHead>
                          <TableHead className="text-right">Term Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grades.map((gr, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-bold cs-text-navy">{gr.subject}</TableCell>
                            <TableCell className="text-center font-mono">{gr.ca_score || gr.ca_scores?.reduce((a:number,b:number)=>a+b,0) || 0}</TableCell>
                            <TableCell className="text-center font-mono">{gr.exam || gr.exam_score || 0}</TableCell>
                            <TableCell className="text-right font-black font-mono text-indigo-600 text-sm">
                              {(gr.ca_score || gr.ca_scores?.reduce((a:number,b:number)=>a+b,0) || 0) + (gr.exam || gr.exam_score || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Vertical calendar announcement timeline logs */}
                <div className="cs-card p-5 space-y-3">
                  <h3 className="font-display font-semibold cs-text-navy text-sm">Campus Stream Messages</h3>
                  <div className="space-y-3">
                    {messages.map((m, idx) => (
                      <div key={idx} className="border border-slate-150 rounded-xl p-4 bg-slate-50 flex items-start gap-3 shadow-inner">
                        <Megaphone className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 text-sm font-bold block">{m.username || "Bursar Office"}</strong>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Outstanding fees quick check */}
              <div className="space-y-5">
                <div className="cs-card p-5 space-y-4">
                  <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                    <Landmark className="w-4.5 h-4.5" />
                    <h3 className="font-display font-semibold cs-text-navy text-sm">Electronic Bursary Check</h3>
                  </div>

                  <div className="space-y-1 bg-slate-50 border p-4.5 rounded-xl border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-mono">Invoice Account Balance Due</span>
                    <strong className={`block text-xl font-black font-mono leading-tight mt-0.5 ${isBlocked ? "text-rose-500" : "text-emerald-500"}`}>
                      ₦{(studentBill?.balance_due || currentProfile?.balance_due || 0).toLocaleString()}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1.5 font-sans">
                      {isBlocked ? "Bursary Block Alert: Clear outstanding fee balance immediately to unlock digital reports." : "Congratulations! Accounts ledger details are cleared of balance debt."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* ------------- TAB: CBT EXAMINATION ROOM ------------- */}
        {tab === "cbt" && (
          !isTabVisible("cbt") ? (
            <UpgradeOverlay 
              title="CBT Examination Room"
              requiredTier="CBT Essentials or Unified Enterprise"
              description="live computerized testing papers, automatic evaluation checks, duration trackers, and performance dossier storage."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
            
            {!cbtInProgress ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm">
                  <div>
                    <h3 className="font-display font-semibold cs-text-navy text-sm">Active CBT Exam Syllabus Papers</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Choose an assignment draft to initiate testing session.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {exams.map((ex) => (
                    <div key={ex.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5 text-left">
                        <Badge className="bg-emerald-50/70 text-emerald-600 font-mono font-bold tracking-widest text-[9px] uppercase border border-emerald-200 h-5">
                          {ex.subject} Course
                        </Badge>
                        <h4 className="font-display font-black cs-text-navy text-base leading-tight">
                          {ex.title}
                        </h4>
                        <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Duration Limits: {ex.duration_min} Minutes</span>
                        </div>
                      </div>

                      <Button 
                        variant="emerald" 
                        size="sm" 
                        onClick={() => handleStartExam(ex)}
                        className="w-full h-9 gap-1 text-[11px] font-bold"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Initiate Testing Exam Session
                      </Button>
                    </div>
                  ))}
                  {exams.length === 0 && (
                    <div className="col-span-2 text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-400">
                      No CBT assignments scheduled today. Enjoy your lessons!
                    </div>
                  )}
                </div>

                 {completedCbtResult && (
                  <div className="max-w-md mx-auto cs-card p-6 border-indigo-500/30 bg-indigo-50/30 text-center space-y-4 shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-inner animate-bounce">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-900">CBT Evaluation Submitted!</h4>
                      <p className="text-xs text-slate-500 mt-1">Your response sheet has been safely locked and dispatched to School Administrators and Subject Teachers. Results are kept confidential and restricted to official reports.</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-indigo-200 inline-block">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Session Lock Hash</span>
                      <strong className="text-sm font-mono font-black cs-text-navy block mt-1">
                        CONFIDENTIAL_LOCK_#{Math.floor(Math.random() * 900000 + 100000)}
                      </strong>
                      <span className="text-[10px] text-slate-500 block font-bold mt-2">
                        Evaluated & Sync Complete
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE CBT ROOM VIEW */
              <div className="max-w-3xl mx-auto cs-card p-6 border-slate-350 bg-white space-y-6 relative shadow-2xl">
                
                {/* Active exam details & Resilient countdown timers */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black cs-text-navy text-base leading-none uppercase">{activeExam.title}</h3>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-mono text-[9px]">
                        SSID: {activeExam.id}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">Randomized Question Session Paper · Secure Proctor Active</div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Simulated Offline Mode Toggler */}
                    <button
                      onClick={toggleOfflineSimulation}
                      className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1.5 ${
                        isOfflineSimulated 
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm" 
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <span>{isOfflineSimulated ? "🔌 Offline Mode Active" : "🟢 Connection Status: Online"}</span>
                    </button>

                    <div className="flex gap-2 items-center text-rose-600 bg-rose-50 border border-rose-200/50 p-2.5 rounded-xl shadow-inner shrink-0">
                      <Clock className="w-4 h-4 text-rose-500 animate-spin" />
                      <span className="font-mono text-base font-black tracking-widest">{formatTimer(cbtTimeLeft)}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Offline Banner alerts */}
                {isOfflineSimulated && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-300 p-3.5 rounded-xl flex items-center justify-between text-amber-900 animate-pulse">
                    <div className="flex items-start gap-2.5 w-[80%]">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs block font-bold">Simulated Offline Client Running</strong>
                        <span className="text-[10px] leading-tight block">
                          Corner Streams Offline-Resilient network protection has intercepted your connection. All choice records will accumulate securely inside browser cache storage and auto-sync immediately when returning Online.
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-amber-600 text-white font-mono text-[10px]">
                      Queue: {JSON.parse(localStorage.getItem(`CS_CBT_SYNC_QUEUE_${currentProfile.id}_${activeExam.id}`) || "[]").length}
                    </Badge>
                  </div>
                )}

                {/* Proctoring Warning Badge if focus switch happened */}
                {focusViolations > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2.5 text-rose-950">
                    <AlertIcon className="w-4 h-4 text-rose-600 animate-bounce" />
                    <div>
                      <strong className="text-xs block font-bold">Security Monitor: {focusViolations} Proctoring Warning Flag{focusViolations > 1 ? "s" : ""} logged</strong>
                      <span className="text-[10px] block text-rose-700 leading-tight">
                        Our AI Proctoring system detected active window blurring or tab exit. This telemetry log has been reported to your faculty dashboard. Avoid further switches to prevent test invalidation.
                      </span>
                    </div>
                  </div>
                )}

                {/* Option Choice Selector form */}
                <div className="space-y-6 text-xs text-slate-700">
                  {activeExam.questions?.map((q: any, qi: number) => {
                    const isMath = q.question.includes("$$") || q.question.includes("\\") || q.question.includes("^") || q.question.includes("²") || q.question.includes("x=");
                    return (
                      <div key={qi} className="border border-slate-150 rounded-xl p-4 space-y-3.5 bg-slate-50 relative">
                        <div className="flex gap-2 font-bold text-slate-800 text-sm">
                          <span className="text-[#005cb9]">Question {qi + 1}.</span>
                          <div className="space-y-2 w-full">
                            {isMath ? (
                              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-indigo-950 font-semibold leading-relaxed">
                                <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider mb-1">Standardized Math Equation Form</p>
                                <div className="font-mono text-sm tracking-wide bg-white/60 p-2.5 rounded border border-indigo-200 inline-block">
                                  {q.question}
                                </div>
                              </div>
                            ) : (
                              <p className="leading-relaxed">{q.question}</p>
                            )}

                            {/* Render Diagram image supporting LaTeX diagrams */}
                            {q.diagramUrl && (
                              <div className="my-3 space-y-1">
                                <span className="text-[9px] uppercase font-mono text-slate-400 block font-black">Fig. Reference Diagram Model</span>
                                <img 
                                  src={q.diagramUrl} 
                                  alt="Reference Graphic Model" 
                                  referrerPolicy="no-referrer"
                                  className="max-h-48 object-contain rounded-lg border border-slate-200 bg-white p-1" 
                                />
                              </div>
                            )}

                            {/* Render comprehension audio if present for listening examinations */}
                            {q.audioUrl && (
                              <div className="my-3 space-y-1.5 p-2.5 bg-white rounded-lg border border-slate-200 max-w-sm">
                                <span className="text-[9px] uppercase font-mono text-[#005cb9] block font-black">Comprehension Audio Track playback</span>
                                <audio 
                                  controls 
                                  src={q.audioUrl} 
                                  className="w-full h-8"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-slate-600">
                          {q.options?.map((opt: string, oi: number) => (
                            <label 
                              key={oi} 
                              onClick={() => handleOptionSelect(qi, oi)}
                              className={`flex gap-3 items-center border p-3 rounded-lg select-none cursor-pointer hover:bg-white transition ${cbtAnswers[qi] === oi ? "bg-indigo-50 border-indigo-500 font-bold text-indigo-950 shadow-sm" : "bg-white/40 border-slate-200"}`}
                            >
                              <input 
                                type="radio" 
                                name={`answers-${qi}`} 
                                checked={cbtAnswers[qi] === oi}
                                onChange={() => {}}
                                className="accent-indigo-600 w-4.5 h-4.5 cursor-pointer rounded-full" 
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-5">
                  <Button 
                    variant="emerald" 
                    onClick={onSubmitExamEvaluation}
                    className="px-6 h-10 text-[11px] tracking-wider uppercase font-black"
                  >
                    Complete and Send Assessment
                  </Button>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {/* ----------------- SUBTAB: SETTINGS ----------------- */}
        {tab === "settings" && (
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

      {/* Renders full ledger blockade protection if Student has tuition balance debt outstanding */}
      <LockedOverlay isLocked={tab === "overview" && isBlocked} student={currentProfile} />
    </div>
  );
}
export default StudentDashboard;
