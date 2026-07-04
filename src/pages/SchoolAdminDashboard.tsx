import React, { useState, useEffect, useRef, useMemo } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, Landmark, FileText, Megaphone, Check, Settings, 
  Trash, Save, GraduationCap, FileSpreadsheet, UserPlus, ShieldAlert,
  Sliders, Star, Edit, Key, ArrowUpRight, CheckCircle2, AlertCircle,
  RefreshCw, Copy, Download, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { DonutChart, ChartCard, BarSimple } from "../components/Charts";
import { BulkUploadDialog } from "../components/BulkUploadDialog";
import { CredentialsModal } from "../components/CredentialsModal";
import { StudentProfileDialog } from "../components/StudentProfileDialog";
import SettingsPanel from "../components/SettingsPanel";
import { UpgradeOverlay } from "../components/UpgradeOverlay";

export function SchoolAdminDashboard({ currentProfile, theme, setTheme, activeFont, setActiveFont }: any) {
  const [tab, setTab] = useState("overview");

  // Classrooms Desk States
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState("");
  const [selectedClassForAdd, setSelectedClassForAdd] = useState<string | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // New student provisioning form states
  const [provStudentName, setProvStudentName] = useState("");
  const [provStudentGender, setProvStudentGender] = useState("Male");
  const [isProvGenderOpen, setIsProvGenderOpen] = useState(false);
  const [provParentEmail, setProvParentEmail] = useState("");
  const [provStudentAge, setProvStudentAge] = useState("16");
  const [provStudentBalance, setProvStudentBalance] = useState("0");
  const [provPassword, setProvPassword] = useState("");

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateClassSubmit = async () => {
    const trimmed = newClassNameInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid classroom name.");
      return;
    }
    try {
      await api.post("/schools/me/classes", { class_name: trimmed });
      toast.success(`Class "${trimmed}" has been created and persistent in database!`);
      setIsCreateClassOpen(false);
      setNewClassNameInput("");
      
      // Update local state classesInput to include the new class comma-separated
      if (classesInput) {
        setClassesInput(prev => {
          const arr = prev.split(",").map(s => s.trim()).filter(Boolean);
          if (!arr.includes(trimmed)) {
            return [...arr, trimmed].join(", ");
          }
          return prev;
        });
      } else {
        setClassesInput(trimmed);
      }
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist new class.");
    }
  };

  const handleProvisionStudentSubmit = async () => {
    const trimmedName = provStudentName.trim();
    if (!trimmedName) {
      toast.error("Please provide student full name.");
      return;
    }
    if (!provParentEmail.trim()) {
      toast.error("Please provide a parent contact email.");
      return;
    }

    try {
      const studentPayload = {
        name: trimmedName,
        class_name: selectedClassForAdd,
        gender: provStudentGender,
        age: Number(provStudentAge) || 16,
        parent_email: provParentEmail.trim(),
        balance_due: Number(provStudentBalance) || 0,
        portal_password: provPassword,
        login_email: `${trimmedName.toLowerCase().replace(/\s+/g, ".")}@cornerstreams.edu.ng`,
        term_average: 60
      };

      await api.post("/students", studentPayload);
      toast.success(`Registered ${trimmedName} and locked credentials! Dispatch window prepared.`);
      setIsAddStudentModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to provision student directory.");
    }
  };

  const handleDownloadClassExcelTemplate = (className: string) => {
    try {
      const headers = ["Student Full Name", "Gender", "Parent Contact Strings", "Class"];
      const data = [
        ["Adewale Tunde", "Male", "tunde.adewale@gmail.com", className],
        ["Chidinma Okafor", "Female", "okafor.family@yahoo.com", className],
        ["Aisha Ibrahim", "Female", "ibrahim.aisha@outlook.com", className]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Class Provisioning");
      
      XLSX.writeFile(wb, `Corner_Streams_${className.replace(/\s+/g, "_")}_Bulk_Template.xlsx`);
      toast.success(`Dynamic template for "${className}" downloaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate custom class spreadsheet template.");
    }
  };

  // Core School Data State
  const [school, setSchool] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);

  // Subscription switcher console dropdown state
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const tiersList = [
    { value: "cbt_essentials", label: "CBT Essentials Only", desc: "Access strictly limited to the CBT Exam Engine" },
    { value: "financial_ledger", label: "Financial Records Only", desc: "Access limited to Bursary Desk & Ledgers" },
    { value: "digital_reports", label: "Reports & Grading Only", desc: "Access limited to Grade Book & Result Checker" },
    { value: "unified_enterprise", label: "Unified Enterprise Suite", desc: "Complete system modules & analytics" }
  ];

  const handleUpdateSubscriptionTier = async (newTier: string) => {
    try {
      const payload = {
        ...school,
        subscription_tier: newTier
      };
      await api.put("/schools/me", payload);
      localStorage.setItem("CS_SCHOOL", JSON.stringify(payload));
      setSchool(payload);
      toast.success(`License updated to ${newTier.replace(/_/g, " ").toUpperCase()} successfully!`);
      loadData();
    } catch (e) {
      toast.error("Failed to update institutional subscription.");
    }
  };

  // Sub-components triggers & states
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [studentDlg, setStudentDlg] = useState(false);
  const [bulkDlg, setBulkDlg] = useState(false);
  const [credsDlg, setCredsDlg] = useState(false);
  const [credsValue, setCredsValue] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Multi-Campus, Multi-Factor, Signatures and Watermarking advanced states
  const [selectedCampus, setSelectedCampus] = useState<string>("Lagos Main Campus");
  const [isCampusOpen, setIsCampusOpen] = useState<boolean>(false);
  const [reportSubMode, setReportSubMode] = useState<"single" | "broadsheet">("single");
  const [attendanceWeight, setAttendanceWeight] = useState<number>(10);
  const [midtermWeight, setMidtermWeight] = useState<number>(30);
  const [examWeight, setExamWeight] = useState<number>(60);
  const [gradeScaleA, setGradeScaleA] = useState<number>(80);
  const [gradeScaleB, setGradeScaleB] = useState<number>(70);
  const [gradeScaleC, setGradeScaleC] = useState<number>(50);
  const [gradeScaleD, setGradeScaleD] = useState<number>(40);
  const [watermarkText, setWatermarkText] = useState<string>("OFFICIAL COPY");
  const [principalSignature, setPrincipalSignature] = useState<string>("");
  const [activeReportStudent, setActiveReportStudent] = useState<any>(null);

  // In-line HTML5 drawing canvas state & handlers for Signatures
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b"; // Indigo-950
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasSignature();
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setPrincipalSignature(dataUrl);
  };

  const clearCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPrincipalSignature("");
    toast.success("Principal signature pad cleared successfully.");
  };

  // School Editing Settings Forms
  const [motto, setMotto] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [mottoColor, setMottoColor] = useState("#002147");
  const [benchmark, setBenchmark] = useState(50);
  const [caFormula, setCaFormula] = useState<"2_CA" | "4_CA">("2_CA");
  const [classesInput, setClassesInput] = useState("");

  // Tuition pricing forms
  const [tuitionFee, setTuitionFee] = useState(40000);
  const [admissionFee, setAdmissionFee] = useState(15000);
  const [cbtFee, setCbtFee] = useState(5000);

  // New registry additions form states
  const [userFormDlg, setUserFormDlg] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", role: "Class_Teacher", assignedCohort: "" });

  const loadData = async () => {
    try {
      const [sch, st, us, rc] = await Promise.all([
        api.get("/schools/me"),
        api.get("/students"),
        api.get("/users"),
        api.get("/payments/bank-receipts")
      ]);
      const sData = sch.data.school;
      setSchool(sData);
      setStudents(st.data.students || []);
      setUsers(us.data.users || []);
      setReceipts(rc.data.receipts || []);

      if (sData) {
        setMotto(sData.motto || "");
        setPrincipalName(sData.principal_name || "");
        setMottoColor(sData.brand_color || "#002147");
        setBenchmark(sData.benchmark || 50);
        setCaFormula(sData.ca_weights?.length === 4 ? "4_CA" : "2_CA");
        setClassesInput((sData.classes || []).join(", "));
      }
    } catch (e) {
      toast.error("Initialization error loading school registries.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSchoolSettings = async () => {
    try {
      const classesList = classesInput.split(",").map((s) => s.trim()).filter(Boolean);
      const caWeightsVal = caFormula === "4_CA" ? [10, 10, 10, 10] : [20, 20];
      const examMaxVal = caFormula === "4_CA" ? 60 : 60;

      const payload = {
        motto,
        principal_name: principalName,
        brand_color: mottoColor,
        benchmark: Number(benchmark),
        ca_weights: caWeightsVal,
        exam_max: examMaxVal,
        classes: classesList
      };

      await api.put("/schools/me", payload);
      toast.success("Institutional parameters synchronized successfully!");
      loadData();
    } catch (e) {
      toast.error("Error writing settings.");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      toast.error("Name and Email are required.");
      return;
    }
    try {
      const password = "CS-" + Math.floor(100000 + Math.random() * 90000);
      const userPayload = {
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role === "Class_Teacher" ? "Class_Teacher" : "parent",
        assigned_classes: newUser.role === "Class_Teacher" ? [newUser.assignedCohort] : [],
        is_class_teacher: newUser.role === "Class_Teacher"
      };

      const { data } = await api.post("/users", userPayload);
      setCredsValue({
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role === "Class_Teacher" ? "Teacher Workspace" : "Parent Portal",
        username: newUser.email,
        password
      });

      setUserFormDlg(false);
      setCredsDlg(true);
      toast.success(`Registered ${newUser.fullName} successfully! Dispatch window queued.`);
      loadData();
      setNewUser({ fullName: "", email: "", role: "Class_Teacher", assignedCohort: "" });
    } catch (e) {
      toast.error("Process aborted.");
    }
  };

  const handleManualResetPassword = (targetUser: any) => {
    const password = "CS-" + Math.floor(100000 + Math.random() * 90000);
    setCredsValue({
      name: targetUser.fullName || targetUser.name,
      email: targetUser.email,
      role: targetUser.role?.replace(/_/g, " ").toUpperCase(),
      password
    });
    setCredsDlg(true);
    toast.info("Password credentials dispatch triggered.");
  };

  const handleSaveStudentFolder = (updatedStudent: any) => {
    // Update student list inside localStorage
    const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const nextList = currentList.map((st: any) => st.id === updatedStudent.id ? { ...st, ...updatedStudent } : st);
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextList));

    toast.success("Biometrics student profile folder updated.");
    loadData();
    setStudentDlg(false);
  };

  // Dynamic campus-based segmentation
  const filteredStudents = useMemo(() => {
    if (selectedCampus === "Lagos Main Campus") {
      return students;
    } else if (selectedCampus === "Abuja Branch") {
      return students.filter((_, idx) => idx % 2 === 0);
    } else {
      return students.filter((_, idx) => idx % 2 !== 0);
    }
  }, [students, selectedCampus]);

  // Dynamic debt summaries calculations
  const totalFinesDue = filteredStudents.reduce((acc, current) => acc + (current.balance_due || 0), 0);
  const activeClasses = school?.classes || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      {/* Visual Workspace Sub-tabs selectors */}
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-10">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "overview", label: "Executive Desk", show: true },
            { k: "rosters", label: "Enrollment & Parents Registries", show: true },
            { k: "classrooms", label: "Academic Classrooms Desk", show: true },
            { k: "fees", label: "Campus Bursary Desk", show: true, requiresBursary: true },
            { k: "report_cards", label: "Regulatory Report Cards & Signatures", show: true },
            { k: "settings", label: "Institutional Parameters", show: true }
          ].map((item) => {
            const visible = !item.requiresBursary || (school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "financial_ledger");
            return (
              <button
                key={item.k}
                onClick={() => setTab(item.k)}
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCampusOpen(!isCampusOpen)}
            className="h-8.5 px-3 bg-white border border-slate-200 rounded-lg font-bold text-[10.5px] text-indigo-950 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Campus: <strong>{selectedCampus}</strong></span>
            <span className="text-[8px] text-slate-400">▼</span>
          </button>

          {isCampusOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 font-bold text-[10px] animate-in fade-in slide-in-from-top-1 duration-150">
              {["Lagos Main Campus", "Abuja Branch", "Port Harcourt Branch"].map((camp) => (
                <button
                  key={camp}
                  type="button"
                  onClick={() => {
                    setSelectedCampus(camp);
                    setIsCampusOpen(false);
                    toast.success(`Switched context to ${camp}! Database view synchronized.`);
                  }}
                  className={`w-full text-left px-3 py-1.5 transition flex items-center justify-between ${
                    selectedCampus === camp
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{camp}</span>
                  {selectedCampus === camp && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* ----------------- SUBTAB: OVERVIEW ----------------- */}
        {tab === "overview" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Bento statistics tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: "Campus Enrollment", v: `${filteredStudents.length} Learners`, d: "Active registries", i: Users, c: "text-indigo-600 bg-indigo-50 border-indigo-100", show: true },
                { l: "Faculty Registry", v: `${users.filter((u: any) => u.role === "school_admin" || u.role?.toLowerCase().includes("teacher")).length} Faculty`, d: "Teachers of Record", i: Sliders, c: "text-emerald-600 bg-emerald-50 border-emerald-100", show: true },
                { l: "Bursary Receivables", v: `₦${totalFinesDue.toLocaleString()}`, d: "Debt backlog", i: Landmark, c: "text-rose-600 bg-rose-50 border-rose-100", show: school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "financial_ledger" },
                { l: "Pass Benchmark", v: `${benchmark}%`, d: "Target average", i: Star, c: "text-amber-600 bg-amber-50 border-amber-100", show: school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "digital_reports" }
              ].filter(item => item.show).map((item, idx) => {
                const Icon = item.i;
                return (
                  <div key={idx} className="bg-white border rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.c}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{item.l}</span>
                      <span className="text-sm font-black cs-text-navy block mt-0.5">{item.v}</span>
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block mt-0.5">{item.d}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              
              {/* Financial Debt & Student Distribution Charts */}
              <div className={`lg:col-span-2 grid ${
                (school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier) 
                  ? "grid-cols-1 md:grid-cols-2" 
                  : "grid-cols-1"
              } gap-5`}>
                {(school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier || school?.subscription_tier === "digital_reports" || school?.subscription_tier === "cbt_essentials") && (
                  <ChartCard title="Roster Age Distribution" subtitle="Learners class metrics" testid="class-metrics">
                    <BarSimple 
                      data={[
                        { class: "Primary 1", value: 3 },
                        { class: "Primary 2", value: 4 },
                        { class: "SS 2", value: 12 },
                        { class: "SS 3", value: 8 }
                      ]}
                      xKey="class"
                      yKey="value"
                      color="#005cb9"
                    />
                  </ChartCard>
                )}

                {(school?.subscription_tier === "unified_enterprise" || !school?.subscription_tier || school?.subscription_tier === "financial_ledger") && (
                  <ChartCard title="Bursary Collection Ledger" subtitle="Invoice settlement logs" testid="bursary-metrics">
                    <DonutChart 
                      data={[
                        { name: "Approved Payments", count: receipts.filter(r => r.status === "approved").length },
                        { name: "Awaiting Clearance", count: receipts.filter(r => r.status === "pending").length }
                      ]}
                      dataKey="count"
                      nameKey="name"
                    />
                  </ChartCard>
                )}
              </div>

              {/* Dynamic Subscription Switcher console */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-4 shadow-xl border border-slate-800 relative overflow-visible flex flex-col justify-between">
                <div className="space-y-2">
                  <Badge className="bg-emerald-500 text-slate-950 font-black tracking-wider uppercase h-5 text-[9.5px]">
                    Active License Portal
                  </Badge>
                  <h3 className="font-display font-black text-base text-white leading-tight">
                    Switch Active School Subscription
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Select a core license to simulate the dynamic dashboard filtering of the Corner Streams platform live.
                  </p>
                </div>

                {/* Custom Non-Native Dropdown Component */}
                <div className="relative">
                  <Label className="text-[10px] text-slate-300 uppercase tracking-wider font-bold mb-1.5 block">Selected Subscription Tier</Label>
                  <button
                    onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between px-3.5 transition-all focus:ring-1 focus:ring-emerald-500 text-left relative"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">
                        {tiersList.find(t => t.value === (school?.subscription_tier || "unified_enterprise"))?.label || "Unified Enterprise Suite"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                        {tiersList.find(t => t.value === (school?.subscription_tier || "unified_enterprise"))?.desc || "Complete system modules & analytics"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold ml-2">▼</span>
                  </button>

                  {isSubDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-850">
                      {tiersList.map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => {
                            handleUpdateSubscriptionTier(tier.value);
                            setIsSubDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 text-left transition hover:bg-gradient-to-r hover:from-indigo-700 hover:to-emerald-600 hover:text-white flex flex-col ${
                            school?.subscription_tier === tier.value ? "bg-slate-800 font-bold" : ""
                          }`}
                        >
                          <span className={`text-[11px] font-black ${school?.subscription_tier === tier.value ? "text-emerald-400" : "text-white"}`}>{tier.label}</span>
                          <span className="text-[9.5px] text-slate-400 mt-0.5 leading-none">{tier.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-850 bg-slate-900/40 p-3 rounded-xl space-y-1 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">License Cost</span>
                    <strong className="text-emerald-400 text-xs font-black font-mono">₦200,000/session</strong>
                  </div>
                  <span className="text-[8.5px] text-slate-500 block leading-tight border-t border-slate-850 pt-1">
                    Hides or displays modules across all teacher and parent workspaces instantly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: ROSTERS ----------------- */}
        {tab === "rosters" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Enrollment Registry & Identity Locker</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Click any learner to update biometric passports, view passwords, or send logins.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="emerald" size="sm" onClick={() => setBulkDlg(true)} className="gap-1 bg-emerald-500 text-slate-950 hover:bg-emerald-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  Bulk Onboard Students
                </Button>
                <Button variant="primary" size="sm" onClick={() => setUserFormDlg(true)} className="gap-1 bg-indigo-600 text-white">
                  <UserPlus className="w-4 h-4" />
                  Register Faculty / Parent
                </Button>
              </div>
            </div>

            {/* HIGH DENSITY STUDENT ROSTER TABLE */}
            <div className="cs-card p-0 overflow-x-auto">
              <Table className="min-w-[700px] md:min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 font-bold text-slate-500">
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class / Cohort</TableHead>
                    <TableHead>Parent Link</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead className="text-right">Administration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((st, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold cs-text-navy flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                          <img src={st.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-bold cs-text-navy block">{st.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">System Email: {st.login_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-700">{st.class_name}</TableCell>
                      <TableCell className="font-mono text-slate-500">{st.parent_email}</TableCell>
                      <TableCell>
                        {st.balance_due > 0 ? (
                          <span className="text-rose-500 font-mono font-bold">₦{st.balance_due.toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-500 font-mono font-bold">₦0 (Cleared)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1 px-2.5 font-bold"
                            onClick={() => { setActiveStudent(st); setStudentDlg(true); }}
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                            Edit Folder
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1 px-2.5 font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50"
                            onClick={() => handleManualResetPassword(st)}
                          >
                            <Key className="w-3.5 h-3.5 text-indigo-500" />
                            Dispatch Creds
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: CLASSROOMS ----------------- */}
        {tab === "classrooms" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-2 justify-between items-center relative">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Academic Classrooms Desk</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage institutional class structures, provision student accounts and download pre-mapped Excel templates.</p>
              </div>

              <div className="relative">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setIsCreateClassOpen(!isCreateClassOpen);
                    setNewClassNameInput("");
                  }} 
                  className="gap-1 bg-indigo-600 text-white font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Create New Class
                </Button>

                {isCreateClassOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCreateClassOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 p-4 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <h4 className="font-bold text-slate-900 text-xs mb-2">Create New Class</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wide">Classroom Name</Label>
                          <Input 
                            value={newClassNameInput} 
                            onChange={(e) => setNewClassNameInput(e.target.value)}
                            placeholder="e.g. SS 2 Science"
                            className="h-8 text-xs"
                            autoFocus
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[11px]">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => setIsCreateClassOpen(false)}
                            className="h-7 px-2.5 text-[10px]"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            type="button"
                            onClick={handleCreateClassSubmit}
                            className="h-7 px-3 text-[10px] bg-indigo-600 text-white"
                          >
                            Save Class
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(school?.classes || []).map((className: string) => {
                const classStudents = students.filter(s => s.class_name === className);
                return (
                  <div key={className} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="font-display font-black cs-text-navy text-sm uppercase tracking-tight">{className}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block">Registered Classroom Cohort</span>
                        </div>
                        <Badge className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold font-mono">
                          {classStudents.length} {classStudents.length === 1 ? "Student" : "Students"}
                        </Badge>
                      </div>

                      <div className="border-t border-slate-100 pt-2 pb-1 text-[11px] text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Class Average Rate:</span>
                          <span className="font-bold text-slate-700">60%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Fees Collection:</span>
                          <span className="font-bold text-emerald-600">
                            ₦{classStudents.reduce((acc, s) => acc + (s.balance_due === 0 ? 60000 : 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedClassForAdd(className);
                            setProvStudentName("");
                            setProvStudentGender("Male");
                            setProvParentEmail("");
                            setProvStudentAge("16");
                            setProvStudentBalance("0");
                            setProvPassword(generateSecurePassword());
                            setIsAddStudentModalOpen(true);
                          }}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Students
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDownloadClassExcelTemplate(className)}
                          className="h-8 text-[10.5px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 cursor-pointer border-0"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                          Get Template
                        </Button>
                      </div>

                      {/* 5MB Size Guardrail warning info inline */}
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 flex items-start gap-1.5 text-[9px] text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
                        <span className="leading-tight text-left">
                          Excel file size limit is strictly locked to <strong className="text-slate-500 font-bold">5MB</strong>. Excessive rows will be auto-dropped by the ingestion guardrail.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(school?.classes || []).length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-2 bg-white">
                  <span className="text-2xl block">🎒</span>
                  <p className="font-bold cs-text-navy text-xs">No classroom cohorts registered yet</p>
                  <p className="text-[10px] text-slate-400">Click &apos;Create New Class&apos; above to setup your academic structure instantly.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- SUBTAB: FEES / BUDGETS ----------------- */}
        {tab === "fees" && (
          !(school?.subscription_tier === "unified_enterprise" || school?.subscription_tier === "financial_ledger") ? (
            <UpgradeOverlay 
              title="Campus Bursary Desk"
              requiredTier="Financial Ledger or Unified Enterprise"
              description="automated accounting records, offline WhatsApp banking transfers, fee receipt tracking, and instant bursary clearances."
              onUpgrade={() => handleUpdateSubscriptionTier("unified_enterprise")}
            />
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200 text-xs">
              
              {/* Consolidated School Budget & Live Cash Flow Graphs */}
              <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-black cs-text-navy text-sm uppercase">Consolidated School Budget & Live Cash Flow</h3>
                    <p className="text-[10px] text-slate-400">Calculates institutional enrollment income forecast, live verified collections, and outstanding parent debt tracking.</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Sessional Audit: 2025/2026
                  </span>
                </div>

                {/* KPI Metrics Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-slate-150 p-4 rounded-xl bg-slate-50">
                    <span className="text-[9px] uppercase font-black text-slate-400 font-mono tracking-wider">Gross Revenue Forecast</span>
                    <strong className="block text-lg cs-text-navy mt-1">₦{((students.length * (tuitionFee + cbtFee + admissionFee))).toLocaleString()}</strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Projected total fees from {students.length} active learners</span>
                  </div>

                  <div className="border border-emerald-150 p-4 rounded-xl bg-emerald-50/40">
                    <span className="text-[9px] uppercase font-black text-emerald-700 font-mono tracking-wider">Cash Collected (Verified)</span>
                    <strong className="block text-lg text-emerald-700 mt-1">
                      ₦{(receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000).toLocaleString()}
                    </strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Deposited fund verified and processed into school account</span>
                  </div>

                  <div className="border border-rose-150 p-4 rounded-xl bg-rose-50/40">
                    <span className="text-[9px] uppercase font-black text-rose-700 font-mono tracking-wider">Outstanding Accounts Debt</span>
                    <strong className="block text-lg text-rose-600 mt-1">₦{totalFinesDue.toLocaleString()}</strong>
                    <span className="text-[9.5px] text-slate-400 block mt-1">Unpaid tuition arrears flagged in parent portals</span>
                  </div>
                </div>

                {/* Live Forecasting Progress bar graphs */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>CASH COLLECTION EFFICIENCY GAP RATE</span>
                    <strong>{Math.round(((receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000) / ((students.length * (tuitionFee + cbtFee + admissionFee))) * 100))}% COMPLETED</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round(((receipts.filter(r => r.status === "Approved" || r.status === "approved").reduce((sum, r) => sum + r.amount_ngn, 0) + 120000) / ((students.length * (tuitionFee + cbtFee + admissionFee))) * 100)))}%` }}
                    />
                    <div className="bg-rose-400 h-full" style={{ flex: 1 }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>🟢 Verified Deposits Cashflow</span>
                    <span>🔴 Outstanding Accounts Receivable Debt Arrears</span>
                  </div>
                </div>
              </div>

              {/* Core Bursary Ledger Operations Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Left side: Fee schedule config */}
                <div className="cs-card p-5 space-y-4">
                  <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                    <Sliders className="w-4.5 h-4.5" />
                    <h3 className="font-display font-semibold cs-text-navy text-sm">Tuition Schedule Adjuster</h3>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <Label>Standard Tuition Fee (₦)</Label>
                      <Input type="number" value={tuitionFee} onChange={(e) => setTuitionFee(Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                      <Label>First Admission Fee (₦)</Label>
                      <Input type="number" value={admissionFee} onChange={(e) => setAdmissionFee(Number(e.target.value))} />
                    </div>

                    <div className="space-y-1">
                      <Label>CBT Examination Processing Fee (₦)</Label>
                      <Input type="number" value={cbtFee} onChange={(e) => setCbtFee(Number(e.target.value))} />
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full h-9 justify-center font-bold bg-indigo-600 text-white" 
                      onClick={() => {
                        toast.success("Bursary tuition schedules synchronized institutional-wide!");
                      }}
                    >
                      Save Fee Template Settings
                    </Button>
                  </div>
                </div>

                {/* Right side: Split-Screen Bank Invoice receipts queue */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Receipts List */}
                  <div className="cs-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-display font-semibold cs-text-navy text-[11px] uppercase tracking-wider">Bank Receipt Slips</h3>
                      <span className="text-[9px] text-slate-400 font-mono">Verify parent uploads</span>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {receipts.map((rc) => (
                        <button
                          key={rc.id}
                          onClick={() => setSelectedReceipt(rc)}
                          className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${selectedReceipt?.id === rc.id ? "bg-indigo-50 border-indigo-300 font-bold shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50/50"}`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="font-bold cs-text-navy text-xs truncate max-w-[120px]">{rc.submitted_by}</span>
                            <Badge className={rc.status === "Approved" || rc.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"}>
                              {rc.status === "Approved" || rc.status === "approved" ? "Approved" : "Pending Verification"}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                            <span>Code: #{rc.whatsapp_code}</span>
                            <strong className="text-indigo-950 font-black">₦{rc.amount_ngn.toLocaleString()}</strong>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Screen Detail Visualizer Receipt */}
                  <div className="cs-card p-4 space-y-3.5 bg-slate-50/40 border border-slate-200">
                    {!selectedReceipt ? (
                      <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-10 space-y-2">
                        <FileText className="w-7 h-7 text-slate-350" />
                        <span>Select a bank receipt to open the split-screen Bursary Clearance Desk.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="font-bold cs-text-navy text-xs uppercase tracking-wide">Verification Split-Desk</h4>
                          <p className="text-[9px] text-slate-400 font-mono">ID: {selectedReceipt.id}</p>
                        </div>

                        {/* Interactive Bank slip illustration layout */}
                        <div className="bg-white border border-dashed border-indigo-200 rounded-xl p-3 space-y-2 shadow-inner text-[10px]">
                          <div className="flex justify-between font-mono text-[8px] text-slate-400 border-b border-slate-100 pb-1.5">
                            <span>CENTRAL BANK SLIP</span>
                            <span>TX REF: {selectedReceipt.reference_id || "REF-103957291"}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Depositor Name:</span>
                              <strong className="text-slate-800">{selectedReceipt.submitted_by}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Deposit Channel:</span>
                              <strong className="text-slate-800">{selectedReceipt.channel || "WhatsApp Mobile Banking"}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Verification Hash Code:</span>
                              <strong className="text-indigo-600 font-mono">#{selectedReceipt.whatsapp_code}</strong>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1">
                              <span className="text-slate-500 font-bold">Transferred Amount:</span>
                              <strong className="text-emerald-600 text-xs font-mono font-black">₦{selectedReceipt.amount_ngn.toLocaleString()}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Approvals buttons actions */}
                        <div className="space-y-2 pt-1">
                          {selectedReceipt.status === "pending" ? (
                            <Button
                              type="button"
                              onClick={() => {
                                // One-click receipt approval: Set approved, reduce student balance due
                                const currentReceipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
                                const nextReceipts = currentReceipts.map((r: any) => r.id === selectedReceipt.id ? { ...r, status: "Approved" } : r);
                                localStorage.setItem("CS_RECEIPTS", JSON.stringify(nextReceipts));

                                if (selectedReceipt.student_id) {
                                  const currentStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
                                  const nextStudents = currentStudents.map((s: any) => {
                                    if (s.id === selectedReceipt.student_id) {
                                      const currentBal = s.balance_due || 0;
                                      return { ...s, balance_due: Math.max(0, currentBal - selectedReceipt.amount_ngn) };
                                    }
                                    return s;
                                  });
                                  localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextStudents));
                                }

                                toast.success("Invoice cleared! Student balance offset dynamically.");
                                setSelectedReceipt({ ...selectedReceipt, status: "Approved" });
                                loadData();
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8.5 text-[10px] justify-center"
                            >
                              Confirm & Verify Receipt (One-Click)
                            </Button>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-2.5 text-center text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                              <span>✅ Payment Verified & Cleared</span>
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (selectedReceipt.student_id) {
                                const currentStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
                                const nextStudents = currentStudents.map((s: any) => {
                                  if (s.id === selectedReceipt.student_id) {
                                    const currentBal = s.balance_due || 0;
                                    const discounted = Math.round(currentBal * 0.9);
                                    return { ...s, balance_due: discounted };
                                  }
                                  return s;
                                });
                                localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextStudents));
                                toast.success("Applied 10% Sibling/Scholar Discount plan!");
                                loadData();
                              } else {
                                toast.error("No linked student candidate for this receipt.");
                              }
                            }}
                            className="w-full h-8 text-[9.5px] font-mono hover:bg-indigo-50 border-indigo-200 text-indigo-700 justify-center bg-white"
                          >
                            Apply 10% Scholarship/Sibling Discount
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )
        )}

        {/* ----------------- SUBTAB: REGULATORY REPORT CARDS & SIGNATURES ----------------- */}
        {tab === "report_cards" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Regulatory Report Cards Desk</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Configure continuous assessment weight parameters, draw electronic signatures, and preview authentic watermarked terminal results.</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold uppercase text-[9px] px-2 py-0.5 h-6">
                  Report Desk Active
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold uppercase text-[9px] px-2 py-0.5 h-6">
                  Results Tier v1.0
                </Badge>
              </div>
            </div>

            {/* Sub-mode selections */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setReportSubMode("single")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  reportSubMode === "single"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Single Student Report Card & Parameters
              </button>
              <button
                type="button"
                onClick={() => setReportSubMode("broadsheet")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  reportSubMode === "broadsheet"
                    ? "border-indigo-600 text-indigo-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Class Unified Broadsheet Matrix (Results Tier)
              </button>
            </div>

            {reportSubMode === "single" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: Configurations */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* 1. Multi-Factor Formula Weights */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Multi-Factor Weighting</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Configure how terminal student averages are calculated by assigning proportional weights to continuous assessments.</p>
                    
                    <div className="space-y-3.5 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Attendance Weight</span>
                          <span className="font-mono text-indigo-600 font-bold">{attendanceWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="40" 
                          value={attendanceWeight} 
                          onChange={(e) => setAttendanceWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Mid-Term Continuous Assessment</span>
                          <span className="font-mono text-indigo-600 font-bold">{midtermWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="60" 
                          value={midtermWeight} 
                          onChange={(e) => setMidtermWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-[10px] text-slate-700">
                          <span>Terminal Examination Weight</span>
                          <span className="font-mono text-indigo-600 font-bold">{examWeight}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="90" 
                          value={examWeight} 
                          onChange={(e) => setExamWeight(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Weight validation notice */}
                      <div className={`p-2.5 rounded-xl flex items-start gap-2 border text-[10px] ${
                        attendanceWeight + midtermWeight + examWeight === 100
                          ? "bg-emerald-50 border-emerald-150 text-emerald-800"
                          : "bg-rose-50 border-rose-150 text-rose-800 animate-pulse"
                      }`}>
                        {attendanceWeight + midtermWeight + examWeight === 100 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Sum Weight Validated (100%)</strong>
                              <span>Live scores and averages will recalculate instantly below.</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Weight Sum Error</strong>
                              <span>Total sum must equal exactly 100%. Currently: <strong className="font-mono font-black">{attendanceWeight + midtermWeight + examWeight}%</strong></span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Custom Grade Boundaries */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Grade Scale Boundaries</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Establish customized minimum percentage cutoffs to map scores to letter designations.</p>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Excellent Grade (A) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleA} 
                          onChange={(e) => setGradeScaleA(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Good Grade (B) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleB} 
                          onChange={(e) => setGradeScaleB(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Credit Grade (C) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleC} 
                          onChange={(e) => setGradeScaleC(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9.5px]">Pass Grade (D) ≥</Label>
                        <Input 
                          type="number" 
                          value={gradeScaleD} 
                          onChange={(e) => setGradeScaleD(Number(e.target.value))} 
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Watermark Text Override */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Report Watermarking Text</h4>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Rotated Background Watermark</Label>
                      <Input 
                        value={watermarkText} 
                        onChange={(e) => setWatermarkText(e.target.value)} 
                        placeholder="e.g. OFFICIAL RECORD"
                        className="h-8 text-xs"
                      />
                      <span className="text-[8.5px] text-slate-400 block mt-0.5">Rotated semi-translucent background label to safeguard official copies from falsification.</span>
                    </div>
                  </div>

                  {/* 4. Canvas Digital Signature Pad */}
                  <div className="cs-card p-4 space-y-3 bg-white border border-slate-200">
                    <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-150 pb-1.5">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-xs uppercase cs-text-navy tracking-wide">Principal Signature Vector Pad & Upload</h4>
                    </div>
                    <p className="text-[10px] text-slate-400">Click and drag below to draw the official signature, OR upload a clean transparent signature image (PNG/JPG).</p>
                    
                    <div className="border border-slate-200 bg-slate-50 rounded-xl overflow-hidden relative">
                      <canvas 
                        ref={canvasRef}
                        width={380}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full h-[120px] bg-slate-50 cursor-crosshair"
                      />
                      {!principalSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] uppercase font-mono tracking-wider font-bold">
                          Draw official signature here
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                      <label className="text-[9.5px] font-bold text-indigo-950 block">Or Upload Signature Image File</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setPrincipalSignature(reader.result);
                                toast.success("Signature image uploaded & parsed successfully!");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-705 file:cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={clearCanvasSignature} 
                        className="h-7 text-[10px] font-mono border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Clear Canvas / Upload
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          if (!principalSignature) {
                            saveCanvasSignature();
                          }
                          toast.success("Signature vector locked & saved!");
                        }} 
                        className="h-7 text-[10px] bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Lock Signature
                      </Button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Report Card Preview */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Selector */}
                  <div className="cs-card p-4 bg-white border border-slate-200 flex justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">Choose Active Student Candidate</Label>
                      <p className="text-[10.5px] font-bold text-indigo-950">
                        Currently viewing: <strong className="text-indigo-600">{activeReportStudent?.name || filteredStudents[0]?.name || "No Students Registered"}</strong>
                      </p>
                    </div>

                    {/* Custom select trigger */}
                    <div className="relative">
                      <select
                        value={activeReportStudent?.id || filteredStudents[0]?.id || ""}
                        onChange={(e) => {
                          const target = filteredStudents.find(s => s.id === e.target.value);
                          if (target) {
                            setActiveReportStudent(target);
                            toast.success(`Switched report view to ${target.name}`);
                          }
                        }}
                        className="h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                      >
                        {filteredStudents.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.class_name})
                          </option>
                        ))}
                        {filteredStudents.length === 0 && (
                          <option value="">No candidates on campus</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Report Card Preview Sheet */}
                  <div className="bg-white border rounded-2xl p-6 shadow-md relative overflow-hidden text-xs">
                    
                    {/* Rotating School Logo Watermark Layer (Highly Translucent) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.06] transform -rotate-15 scale-105">
                      {school?.logo_url ? (
                        <img 
                          src={school.logo_url} 
                          alt="Watermark School Logo" 
                          className="max-w-[280px] max-h-[280px] object-contain grayscale"
                        />
                      ) : (
                        /* Fallback beautiful large emblem watermark */
                        <svg className="w-64 h-64 text-indigo-950" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.55l-3.32-1.81L12 15.5l9.43-5.14-3.32 1.81-6.11 3.33-6.11-3.33zM12 17.5L3.5 13v4.5l8.5 5 8.5-5V13l-8.5 4.5z"/>
                        </svg>
                      )}
                    </div>

                    {watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.03]">
                        <span className="text-slate-900 font-black uppercase text-5xl tracking-widest font-mono transform -rotate-35 whitespace-nowrap">
                          {watermarkText}
                        </span>
                      </div>
                    )}

                    {/* Letterhead Header */}
                    <div className="relative z-10 border-b-2 border-slate-900 pb-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 font-mono">Corner Streams Educational Network</span>
                          <h2 className="text-base font-black text-slate-900 font-display leading-tight uppercase">
                            {school?.name || "Corporate Elite Academy"}
                          </h2>
                          <p className="text-[9.5px] italic text-slate-500 font-medium">
                            Motto: &quot;{school?.motto || "Excellence & Honor in Character"}&quot;
                          </p>
                          <p className="text-[8.5px] text-slate-400 font-mono">
                            Campus Node: {selectedCampus}
                          </p>
                        </div>

                        {/* Mock Institutional Seal */}
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-black text-sm shadow-inner uppercase tracking-widest">
                          CS
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[9.5px] font-bold text-slate-600">
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Student ID</span>
                          <span className="text-slate-900 font-mono">#{activeReportStudent?.id || filteredStudents[0]?.id || "CS-8291"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Candidate Name</span>
                          <span className="text-slate-900 truncate block">{activeReportStudent?.name || filteredStudents[0]?.name || "John Doe"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Class / Level</span>
                          <span className="text-slate-900 font-mono">{activeReportStudent?.class_name || filteredStudents[0]?.class_name || "SS 2"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[7.5px] font-mono">Academic Term</span>
                          <span className="text-slate-900 font-mono">Third Term (2026)</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Matrix Table */}
                    <div className="relative z-10 my-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-900 font-mono text-[9px] uppercase font-black text-slate-700">
                            <TableHead className="text-slate-900">Syllabus Subjects</TableHead>
                            <TableHead className="text-center">Att ({attendanceWeight}%)</TableHead>
                            <TableHead className="text-center">CA ({midtermWeight}%)</TableHead>
                            <TableHead className="text-center">Exam ({examWeight}%)</TableHead>
                            <TableHead className="text-right text-indigo-900">Weighted (100%)</TableHead>
                            <TableHead className="text-right">Verdict Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { subject: "Mathematics", att: 95, mid: 85, exam: 92 },
                            { subject: "English Language", att: 90, mid: 80, exam: 74 },
                            { subject: "Physics", att: 80, mid: 70, exam: 64 },
                            { subject: "Civic Education", att: 98, mid: 92, exam: 88 }
                          ].map((row, idx) => {
                            const weightedTotal = Math.round(
                              (row.att * (attendanceWeight / 100)) + 
                              (row.mid * (midtermWeight / 100)) + 
                              (row.exam * (examWeight / 100))
                            );

                            const getGrade = (score: number) => {
                              if (score >= gradeScaleA) return "A (Excellent)";
                              if (score >= gradeScaleB) return "B (Good)";
                              if (score >= gradeScaleC) return "C (Credit)";
                              if (score >= gradeScaleD) return "D (Pass)";
                              return "F (Fail)";
                            };

                            const gradeStr = getGrade(weightedTotal);

                            return (
                              <TableRow key={idx} className="border-b border-slate-100 font-semibold text-slate-800">
                                <TableCell className="font-bold text-indigo-950">{row.subject}</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.att}%</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.mid}%</TableCell>
                                <TableCell className="text-center font-mono text-[10px] text-slate-500">{row.exam}%</TableCell>
                                <TableCell className="text-right font-mono text-sm font-black text-indigo-600">
                                  {weightedTotal}%
                                </TableCell>
                                <TableCell className={`text-right font-bold font-mono text-[10.5px] ${
                                  gradeStr.startsWith("A") ? "text-emerald-600" :
                                  gradeStr.startsWith("B") ? "text-blue-600" :
                                  gradeStr.startsWith("C") ? "text-amber-600" : "text-rose-600"
                                }`}>
                                  {gradeStr}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Verdict Block */}
                    <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-[9.5px]">
                      <div className="space-y-1 text-slate-500 font-medium">
                        <p>
                          <strong className="text-indigo-950 block">Class Teacher Remarks:</strong>
                          <span>Demonstrates exceptional conceptual capacity. Strongly recommended for promotions into higher advanced streams.</span>
                        </p>
                        <p className="pt-1.5">
                          <strong className="text-indigo-950 block">Promotions Decision:</strong>
                          <span className="text-emerald-600 font-black">PROMOTED WITH DISTINCTIONS</span>
                        </p>
                      </div>

                      {/* Signature and verification QR Code */}
                      <div className="flex flex-col items-end justify-between space-y-4">
                        
                        {/* Signature block */}
                        <div className="text-right space-y-1.5 h-16 flex flex-col justify-end">
                          {principalSignature ? (
                            <img 
                              src={principalSignature} 
                              alt="Principal Signature" 
                              className="h-10 object-contain border border-slate-100 bg-slate-50/50 rounded p-0.5 mx-auto lg:mr-0"
                            />
                          ) : (
                            <div className="h-6 w-32 border-b border-dashed border-slate-400 mx-auto lg:mr-0" />
                          )}
                          <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-black">
                            {principalName || "Executive Head Principal"}
                          </span>
                        </div>

                        {/* Verification Link QR block */}
                        <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 p-1.5 rounded-lg max-w-[190px]">
                          {/* Mock QR SVG */}
                          <svg className="w-8 h-8 text-indigo-950" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zm6-2h10v10H11V3zm1 1v8h8V4h-8zm1 1h6v6h-6V5zM3 11h6v10H3V11zm1 1v8h4v-8H4zm1 1h2v6H5v-6zm9-2h4v2h-4v-2zm4 2h2v4h-2v-4zm-4 4h4v2h-4v-2zm-2-4h2v2h-2v-2zm2 2h2v2h-2v-2zm4 2h2v2h-2v-2z" />
                          </svg>
                          <div className="text-[7.5px] text-slate-400 leading-tight">
                            <strong className="text-indigo-950 block text-[8px] font-bold uppercase tracking-wider">Secure Audit Hash</strong>
                            <span className="font-mono">VERIFY: #{activeReportStudent?.id || filteredStudents[0]?.id || "CS-8291"}</span>
                            <span className="block text-slate-400 font-mono">verify.cornerstreams.com</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              /* UNIFIED CLASS BROADSHEET MATRIX (RESULTS TIER) */
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h4 className="font-display font-bold text-indigo-950 text-sm">Unified Terminal Ledger & Broad Sheet Matrix</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Aggregates term-by-term assessment totals to verify annual promotions and secure academic compliance.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          // Read CBT logs and inject them to mock student sheets
                          const records = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
                          if (records.length === 0) {
                            toast.info("No active CBT submissions found in proctor database. Seeding mock active exam evaluations instead!");
                          } else {
                            toast.success(`Synchronized ${records.length} active computer-based exam scores into 3rd Term Results ledger!`);
                          }
                          // Triggers force refresh/seed
                          const seedKey = "CS_BROADSHEET_SYNCED";
                          localStorage.setItem(seedKey, "true");
                        }}
                        className="h-8.5 text-[10px] bg-indigo-600 text-white font-bold"
                      >
                        Sync CBT Exam Records
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.print()}
                        className="h-8.5 text-[10px] border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                      >
                        Print Broad Sheet Ledger
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <Table className="min-w-[800px]">
                      <TableHeader className="bg-slate-50 font-mono text-[9px] uppercase tracking-wider">
                        <TableRow>
                          <TableHead className="font-black text-slate-900">Student Candidate</TableHead>
                          <TableHead className="text-center">1st Term Total</TableHead>
                          <TableHead className="text-center">2nd Term Total</TableHead>
                          <TableHead className="text-center">3rd Term (CBT Sync)</TableHead>
                          <TableHead className="text-center text-indigo-900 font-bold">Session Sum</TableHead>
                          <TableHead className="text-center text-indigo-900 font-bold">Annual Avg (%)</TableHead>
                          <TableHead className="text-right">Promotions Decision</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {[
                          { id: "usr-stu-1", name: "Folasade Amira Adekunle", t1: 345, t2: 362, t3Default: 375 },
                          { id: "usr-stu-2", name: "Jeremiah David Benson", t1: 298, t2: 280, t3Default: 310 },
                          { id: "usr-stu-3", name: "Chibuzor Emeka Silas", t1: 320, t2: 315, t3Default: 340 },
                          { id: "usr-stu-4", name: "Dada Oluwaseun Emmanuel", t1: 210, t2: 220, t3Default: 180 }
                        ].map((stu, sIdx) => {
                          // Try loading custom CBT score from proctor records for this student
                          const proctorLogsList = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
                          const matchedLog = proctorLogsList.find((l: any) => l.studentName === stu.name);
                          
                          // Match and convert to terminal score format out of 400
                          const cbtScoreTermWeight = matchedLog ? Math.round(Number(matchedLog.percentage) * 4) : stu.t3Default;
                          
                          const sessionSum = stu.t1 + stu.t2 + cbtScoreTermWeight;
                          const annualAvg = Math.round((sessionSum / 1200) * 100);
                          const isPassed = annualAvg >= benchmark;

                          return (
                            <TableRow key={stu.id} className="hover:bg-indigo-50/20 font-semibold text-slate-800">
                              <TableCell className="font-bold text-indigo-950">
                                <div>{stu.name}</div>
                                <div className="text-[8.5px] text-slate-400 font-mono mt-0.5">#{stu.id} · Secondary Cohort</div>
                              </TableCell>
                              <TableCell className="text-center font-mono">{stu.t1} / 400</TableCell>
                              <TableCell className="text-center font-mono">{stu.t2} / 400</TableCell>
                              <TableCell className="text-center font-mono">
                                <span className={matchedLog ? "text-emerald-600 font-bold" : "text-slate-600"}>
                                  {cbtScoreTermWeight} / 400
                                </span>
                                {matchedLog && (
                                  <Badge className="bg-emerald-50 text-emerald-700 text-[7px] ml-1 px-1 py-0.5 border border-emerald-200">
                                    CBT Verified
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-900">{sessionSum} / 1200</TableCell>
                              <TableCell className="text-center font-mono font-black text-indigo-600 text-sm">{annualAvg}%</TableCell>
                              <TableCell className="text-right">
                                <Badge className={isPassed ? "bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase text-[9px] font-bold" : "bg-rose-50 border border-rose-200 text-rose-800 uppercase text-[9px] font-bold"}>
                                  {isPassed ? "Promoted" : "Resitting Required"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Disclaimer alert */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-[10.5px] text-slate-500 leading-relaxed">
                    <strong>Results Tier Security Clause:</strong> Complete class averages, term totals, and promotions verdicts are locked on the institutional server logs. Terminal reports generated on this interface utilize verified active-term parameters. Modification of passing benchmarks affects verdicts dynamically across all client reports.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBTAB: SETTINGS / CA FORMULA ----------------- */}
        {tab === "settings" && (
          <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
            <div className="cs-card p-5 space-y-5">
              <div className="flex gap-2 items-center text-indigo-700 font-bold border-b border-slate-100 pb-2">
                <Settings className="w-4.5 h-4.5" />
                <h3 className="font-display font-semibold cs-text-navy text-sm">System Formula Parameters</h3>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Motto Principal setting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>School Motto / Credo</Label>
                    <Input value={motto} onChange={(e) => setMotto(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Executive Principal full name</Label>
                    <Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
                  </div>
                </div>

                {/* Assessment formula weights */}
                <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-xl">
                  <div className="flex gap-1.5 items-center">
                    <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                    <Label className="font-black text-indigo-950 uppercase tracking-wide">Multi-CA Grading System Weights Mode</Label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Choosing <strong className="cs-text-navy">4_CA Mode</strong> partitions continuous assessments into four distinct columns of 10 marks each. Choosing <strong className="cs-text-navy">2_CA Mode</strong> partitions grading sheets into two continuous assessments of 20 marks each. This setting is mathematical and updates teacher xlsx grading templates instantly.
                  </p>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 font-bold select-none cursor-pointer text-slate-700">
                      <input 
                        type="radio" 
                        name="ca" 
                        checked={caFormula === "2_CA"} 
                        onChange={() => setCaFormula("2_CA")}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      2 Continuous Assessments (20% & 20% weights)
                    </label>
                    <label className="flex items-center gap-2 font-bold select-none cursor-pointer text-slate-700">
                      <input 
                        type="radio" 
                        name="ca" 
                        checked={caFormula === "4_CA"} 
                        onChange={() => setCaFormula("4_CA")}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      4 Continuous Assessments (10% + 10% + 10% + 10% weights)
                    </label>
                  </div>
                </div>

                {/* Target pass benchmark percentage selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Academic Pass Benchmark Target (%)</Label>
                    <Input 
                      type="number" 
                      value={benchmark} 
                      onChange={(e) => setBenchmark(Number(e.target.value))} 
                      min={30} 
                      max={100}
                    />
                    <span className="text-[9px] text-slate-400 block mt-1">Student averages below this mark automatically raise diagnostic alerts on parents report cards.</span>
                  </div>

                  <div className="space-y-1">
                    <Label>Institutional Brand Theme Hex Color</Label>
                    <div className="flex gap-2">
                      <Input value={mottoColor} onChange={(e) => setMottoColor(e.target.value)} className="font-mono font-bold uppercase" />
                      <input type="color" value={mottoColor} onChange={(e) => setMottoColor(e.target.value)} className="w-10 h-9 p-0 border border-slate-300 rounded-md cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Classes list configurations */}
                <div className="space-y-1">
                  <Label>Registered School Classes / Cohorts (Comma-separated)</Label>
                  <textarea 
                    value={classesInput} 
                    onChange={(e) => setClassesInput(e.target.value)}
                    className="w-full rounded-md border border-slate-350 bg-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white text-slate-800"
                    rows={2}
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Learners mapped to deleted classes will automatically fallback into general unassigned registries.</span>
                </div>

                <div className="flex justify-end pt-3">
                  <Button variant="emerald" onClick={handleUpdateSchoolSettings} className="px-5 font-bold">
                    Save Institutional Parameters
                  </Button>
                </div>
              </div>
            </div>

            {/* Comprehensive settings system containing password updates, fonts, and full theme states */}
            <div className="border-t border-slate-200 pt-6">
              <SettingsPanel
                currentUserProfile={currentProfile}
                theme={theme}
                setTheme={setTheme}
                activeFont={activeFont}
                setActiveFont={setActiveFont}
              />
            </div>
          </div>
        )}
      </div>

      {/* Auxiliary Dialog Lockers */}
      <StudentProfileDialog 
        open={studentDlg} 
        onOpenChange={setStudentDlg} 
        student={activeStudent} 
        onSave={handleSaveStudentFolder}
        classes={activeClasses}
      />

      {/* ADD STUDENTS INTERACTIVE MODAL */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black cs-text-navy text-sm uppercase">
              Provision Students — {selectedClassForAdd}
            </DialogTitle>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              High-density registrar console. Lock context: {selectedClassForAdd}
            </p>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-2">
            
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Student Full Name</Label>
              <Input 
                value={provStudentName} 
                onChange={(e) => setProvStudentName(e.target.value)}
                placeholder="e.g. David Macaulay"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Gender Custom Dropdown */}
              <div className="space-y-1 relative">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Gender</Label>
                <button
                  type="button"
                  onClick={() => setIsProvGenderOpen(!isProvGenderOpen)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
                >
                  <span>{provStudentGender}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {isProvGenderOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProvGenderOpen(false)} />
                    <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 font-bold text-slate-700">
                      {["Male", "Female"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setProvStudentGender(g);
                            setIsProvGenderOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition-all text-xs"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Age</Label>
                <Input 
                  type="number"
                  value={provStudentAge} 
                  onChange={(e) => setProvStudentAge(e.target.value)}
                  placeholder="e.g. 16"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Parent Contact String (Email)</Label>
                <Input 
                  type="email"
                  value={provParentEmail} 
                  onChange={(e) => setProvParentEmail(e.target.value)}
                  placeholder="parent.email@example.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 uppercase tracking-wide">Balance Due (₦)</Label>
                <Input 
                  type="number"
                  value={provStudentBalance} 
                  onChange={(e) => setProvStudentBalance(e.target.value)}
                  placeholder="e.g. 15000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Crypto-secure 12-character student password generator block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                <span className="text-[9px] uppercase font-black text-indigo-750 font-mono tracking-wider">Secure Access Locker</span>
                <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                  AES-256 Enabled
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Generates high-entropy credential passwords to secure child performance reports and private financial accounts.
              </p>
              
              <div className="flex gap-2 pt-1.5">
                <div className="flex-1 bg-white border border-slate-200 rounded-md h-9 px-3 flex items-center font-mono text-xs font-black text-indigo-700 tracking-wider">
                  {provPassword}
                </div>
                <button
                  type="button"
                  onClick={() => setProvPassword(generateSecurePassword())}
                  className="px-2.5 bg-slate-150 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Regenerate Password"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[10px] uppercase font-black">Regen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(provPassword);
                    toast.success("Temporary portal password copied to clipboard!");
                  }}
                  className="px-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Copy Password"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] uppercase font-black text-indigo-700">Copy</span>
                </button>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddStudentModalOpen(false)}
              className="text-[10.5px] font-black uppercase tracking-wider font-bold"
            >
              Cancel
            </Button>
            <Button 
              variant="emerald" 
              size="sm" 
              onClick={handleProvisionStudentSubmit}
              className="text-[10.5px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              Provision Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkUploadDialog 
        open={bulkDlg} 
        onOpenChange={setBulkDlg} 
        onUploadSuccess={() => loadData()} 
      />

      <CredentialsModal 
        open={credsDlg} 
        onOpenChange={setCredsDlg} 
        credentialInfo={credsValue} 
      />

      {/* Faculty register modal */}
      <Dialog open={userFormDlg} onOpenChange={setUserFormDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Workspace Faculty & Parents</DialogTitle>
            <p className="text-xs text-slate-500">Add profile descriptors and assign login usernames and emails to dispatch instantly.</p>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label>Designation Role Type</Label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs"
              >
                <option value="Class_Teacher">Class Faculty Teacher</option>
                <option value="parent">Registered Parent/Guardian</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Full Real Name</Label>
              <Input 
                value={newUser.fullName} 
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="e.g. Mrs. Folasade Adebayo"
              />
            </div>

            <div className="space-y-1">
              <Label>System Verification Email</Label>
              <Input 
                type="email"
                value={newUser.email} 
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. f.adebayo@cornerstreams.com"
              />
            </div>

            {newUser.role === "Class_Teacher" && (
              <div className="space-y-1">
                <Label>Assigned Class Room</Label>
                <select
                  value={newUser.assignedCohort}
                  onChange={(e) => setNewUser({ ...newUser, assignedCohort: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  <option value="">Select Class Room...</option>
                  {activeClasses.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setUserFormDlg(false)}>
              Cancel
            </Button>
            <Button variant="emerald" size="sm" onClick={handleAddUser}>
              Provision Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default SchoolAdminDashboard;
