import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Send,
  Users,
  FileText,
  Check,
  ChevronRight,
  Filter,
  Trash2,
  Edit,
  Eye,
  BadgeCheck,
  Award,
  Layers,
  GraduationCap,
  Save,
  MessageSquare,
  Search,
  Download,
  Bell,
  RefreshCw,
  LayoutGrid,
  ListOrdered
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Assignment, AssignmentSubmission } from "../types";

export interface TeacherAssignmentsManagerProps {
  currentProfile: any;
  students: any[];
}

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    title: "Ohm's Law & Circuit Calculations",
    subject: "Physics",
    topic: "Electric Current, Resistance & Series/Parallel Circuits",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-1",
    assignedByTeacherName: "Mrs. Folasade Adebayo",
    assignedDate: "2026-08-16",
    dueDate: "2026-08-22",
    dueTime: "11:59 PM",
    description: "Solve the 4 circuit analysis problems. Compute total equivalent resistance, current draw, and potential difference across each branch. Show all formula substitutions.",
    instructions: [
      "1. State Ohm's Law and its mathematical expression.",
      "2. Calculate equivalent resistance for three resistors: R1 = 4Ω, R2 = 6Ω in parallel, connected in series with R3 = 5Ω.",
      "3. If connected to a 24V DC battery with 1Ω internal resistance, find total circuit current.",
      "4. Calculate the voltage drop across the parallel combination."
    ],
    maxMarks: 20,
    socraticContext: "Help students remember 1/R_p = 1/R1 + 1/R2. Prompt them to simplify parallel branches before adding series branch.",
    status: "active"
  },
  {
    id: "asg-2",
    title: "Calculus: Differentiation from First Principles",
    subject: "Further Mathematics",
    topic: "Limits and Differential Coefficients",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-1",
    assignedByTeacherName: "Mrs. Folasade Adebayo",
    assignedDate: "2026-08-17",
    dueDate: "2026-08-24",
    dueTime: "11:59 PM",
    description: "Differentiate f(x) = 3x² - 5x + 2 from first principles using the definition f'(x) = lim(h->0) [f(x+h) - f(x)] / h.",
    instructions: [
      "1. Expand f(x+h) step by step with careful algebraic simplification.",
      "2. Factor out h from the numerator before taking the limit as h approaches 0.",
      "3. Verify your result using the standard power rule d/dx(x^n) = n*x^(n-1)."
    ],
    maxMarks: 15,
    socraticContext: "Ensure student expands (x+h)^2 = x^2 + 2xh + h^2 correctly and does not divide by zero before canceling h.",
    status: "active"
  },
  {
    id: "asg-3",
    title: "Essay: The Impact of Monetary Policy on Inflation in Nigeria",
    subject: "Economics",
    topic: "Macroeconomics, Central Banking & Inflation Control",
    classCohort: "SS 2 Science",
    assignedByTeacherId: "usr-tch-2",
    assignedByTeacherName: "Dr. Emeka Nwosu",
    assignedDate: "2026-08-14",
    dueDate: "2026-08-20",
    dueTime: "05:00 PM",
    description: "Write a 400-word analytical essay on how the Central Bank of Nigeria uses Cash Reserve Ratios (CRR) and Monetary Policy Rates (MPR) to stabilize price levels.",
    instructions: [
      "1. Define inflation and identify demand-pull vs cost-push inflation in Nigeria.",
      "2. Explain how raising the MPR affects commercial bank lending rates.",
      "3. Evaluate the trade-off between fighting inflation and economic growth."
    ],
    maxMarks: 25,
    socraticContext: "Guide student on the transmission mechanism of interest rates to consumer spending.",
    status: "active"
  }
];

export function TeacherAssignmentsManager({ currentProfile, students = [] }: TeacherAssignmentsManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>("");

  // Create Assignment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("Physics");
  const [formTopic, setFormTopic] = useState("");
  const [formCohort, setFormCohort] = useState("SS 2 Science");
  const [formDueDate, setFormDueDate] = useState("2026-08-25");
  const [formDueTime, setFormDueTime] = useState("11:59 PM");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formMaxMarks, setFormMaxMarks] = useState<number>(20);
  const [formSocraticContext, setFormSocraticContext] = useState("");

  // AI Assignment Generator
  const [isAiGenOpen, setIsAiGenOpen] = useState(false);
  const [aiGenSubject, setAiGenSubject] = useState("Physics");
  const [aiGenTopic, setAiGenTopic] = useState("");
  const [aiGenDifficulty, setAiGenDifficulty] = useState("Standard WAEC/JAMB");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // View Toggle: Summary Table vs Assignment Manager Studio
  const [activeView, setActiveView] = useState<"summary_table" | "assignment_manager">("summary_table");

  // Filter & Search states for the Summary Table
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "submitted" | "in_progress" | "pending" | "graded">("all");
  const [selectedCohortFilter, setSelectedCohortFilter] = useState("all");
  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, "pending" | "in_progress" | "submitted">>({});

  // Review & Grading Modal
  const [reviewSubmission, setReviewSubmission] = useState<{ student: any; sub: AssignmentSubmission | null; asg: Assignment } | null>(null);
  const [gradeInput, setGradeInput] = useState<number | string>(20);
  const [feedbackInput, setFeedbackInput] = useState("");

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("CS_ASSIGNMENTS");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAssignments(parsed);
        if (parsed.length > 0) setActiveAssignmentId(parsed[0].id);
      } catch (e) {
        setAssignments(DEFAULT_ASSIGNMENTS);
        setActiveAssignmentId(DEFAULT_ASSIGNMENTS[0].id);
      }
    } else {
      setAssignments(DEFAULT_ASSIGNMENTS);
      localStorage.setItem("CS_ASSIGNMENTS", JSON.stringify(DEFAULT_ASSIGNMENTS));
      setActiveAssignmentId(DEFAULT_ASSIGNMENTS[0].id);
    }

    const savedSubs = localStorage.getItem("CS_ASSIGNMENT_SUBMISSIONS");
    if (savedSubs) {
      try {
        setSubmissions(JSON.parse(savedSubs));
      } catch (e) {}
    } else {
      const initialSubs: Record<string, AssignmentSubmission> = {
        "asg-1": {
          id: "sub-usr-stu-1-asg-1",
          assignmentId: "asg-1",
          studentId: "usr-stu-1",
          studentName: "Folasade Amira Adekunle",
          classCohort: "SS 2 Science",
          status: "in_progress",
          progressStatus: "in_progress",
          solutionText: "Completed question 1 Ohm's law definition. Currently solving parallel branch resistance formula.",
          studentNotes: "Working on question 2 calculation; will submit complete graph steps before Friday.",
          socraticDialogueCount: 3,
          updatedAt: "2026-08-18T14:30:00Z"
        },
        "asg-3": {
          id: "sub-usr-stu-2-asg-3",
          assignmentId: "asg-3",
          studentId: "usr-stu-2",
          studentName: "Jeremiah David Benson",
          classCohort: "SS 2 Science",
          status: "pending_review",
          progressStatus: "submitted",
          submittedAt: "2026-08-19T10:15:00Z",
          solutionText: "The Central Bank of Nigeria utilizes Monetary Policy Rates (MPR) and Cash Reserve Ratios (CRR) as quantitative instruments to regulate bank liquidity...",
          studentNotes: "Completed essay with 2024-2026 monetary data references. Verified citation sources.",
          socraticDialogueCount: 1,
          updatedAt: "2026-08-19T10:15:00Z"
        }
      };
      setSubmissions(initialSubs);
      localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(initialSubs));
    }

    const savedProg = localStorage.getItem("CS_STUDENT_ASSIGNMENT_PROGRESS");
    if (savedProg) {
      try {
        setStudentProgressMap(JSON.parse(savedProg));
      } catch (e) {}
    }
  }, []);

  // Save new assignment
  const handleSaveNewAssignment = () => {
    if (!formTitle.trim() || !formTopic.trim() || !formDescription.trim()) {
      toast.error("Please fill in Title, Topic, and Description.");
      return;
    }

    const instructionsArray = formInstructions
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      title: formTitle.trim(),
      subject: formSubject,
      topic: formTopic.trim(),
      classCohort: formCohort,
      assignedByTeacherId: currentProfile.id || "usr-tch-1",
      assignedByTeacherName: currentProfile.fullName || "Class Teacher",
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: formDueDate,
      dueTime: formDueTime,
      description: formDescription.trim(),
      instructions: instructionsArray.length > 0 ? instructionsArray : [formDescription.trim()],
      maxMarks: Number(formMaxMarks) || 20,
      socraticContext: formSocraticContext.trim(),
      status: "active"
    };

    const updated = [newAssignment, ...assignments];
    setAssignments(updated);
    localStorage.setItem("CS_ASSIGNMENTS", JSON.stringify(updated));
    setActiveAssignmentId(newAssignment.id);
    setIsCreateOpen(false);

    // Reset Form
    setFormTitle("");
    setFormTopic("");
    setFormDescription("");
    setFormInstructions("");
    setFormSocraticContext("");
    toast.success(`✨ Homework "${newAssignment.title}" published to ${newAssignment.classCohort} students!`);
  };

  // AI Auto-Generate Assignment Questions
  const handleGenerateAiAssignment = async () => {
    if (!aiGenTopic.trim()) {
      toast.error("Please enter a curriculum topic to generate questions for.");
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/ai/assignment/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: aiGenSubject,
          topic: aiGenTopic,
          classCohort: "SS 2 Science",
          difficulty: aiGenDifficulty,
          questionCount: 3
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.assignmentDraft) {
          const draft = data.assignmentDraft;
          setFormTitle(draft.title || `${aiGenSubject}: ${aiGenTopic} Homework`);
          setFormSubject(aiGenSubject);
          setFormTopic(draft.topic || aiGenTopic);
          setFormMaxMarks(draft.suggestedMaxMarks || 20);
          setFormDescription(`Complete the ${aiGenSubject} homework exercises on ${draft.topic}. Ensure all working steps are shown clearly.`);
          setFormInstructions((draft.instructions || []).concat(draft.questions || []).join("\n"));
          setFormSocraticContext(draft.socraticContext || "");
          
          setIsAiGenOpen(false);
          setIsCreateOpen(true);
          toast.success("AI Homework draft created! Review and publish to students.");
          return;
        }
      }
      throw new Error("Failed AI generation");
    } catch (e: any) {
      toast.error("Could not auto-generate assignment right now. You can create it manually.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Grade student submission
  const handleSaveGrading = () => {
    if (!reviewSubmission) return;
    const { asg, student } = reviewSubmission;

    const existingSub = submissions[asg.id] || {
      id: `sub-${student.id}-${asg.id}`,
      assignmentId: asg.id,
      studentId: student.id,
      studentName: student.name || "Student",
      classCohort: student.class_name || "SS 2 Science",
      submittedAt: new Date().toISOString(),
      status: "graded",
      solutionText: "Completed via teacher verification.",
    };

    const gradedSub: AssignmentSubmission = {
      ...existingSub,
      status: "graded",
      gradeScore: Number(gradeInput),
      teacherFeedback: feedbackInput.trim()
    };

    const updated = { ...submissions, [asg.id]: gradedSub };
    setSubmissions(updated);
    localStorage.setItem("CS_ASSIGNMENT_SUBMISSIONS", JSON.stringify(updated));

    toast.success(`Score ${gradeInput}/${asg.maxMarks} and feedback saved for ${student.name || "Student"}!`);
    setReviewSubmission(null);
  };

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId) || assignments[0];

  // Map students with submission statuses for active assignment
  const cohortStudents = students.length > 0 ? students : [
    { id: "usr-stu-1", name: "Folasade Amira Adekunle", class_name: "SS 2 Science", regNo: "CS/2026/041" },
    { id: "usr-stu-2", name: "Jeremiah David Benson", class_name: "SS 2 Science", regNo: "CS/2026/042" },
    { id: "usr-stu-3", name: "Chibuzor Emeka Silas", class_name: "SS 2 Science", regNo: "CS/2026/043" },
    { id: "usr-stu-4", name: "Amina Zainab Bello", class_name: "SS 2 Science", regNo: "CS/2026/044" },
    { id: "usr-stu-5", name: "Kelechi Emmanuel Okonkwo", class_name: "SS 2 Science", regNo: "CS/2026/045" }
  ];

  // Helper to determine status for a specific student & assignment
  const getStudentAssignmentStatus = (studentId: string, asgId: string) => {
    const sub = submissions[asgId] || submissions[`sub-${studentId}-${asgId}`];
    const studentProg = studentProgressMap[asgId];

    if (sub && sub.status === "graded") {
      return { status: "graded" as const, label: "Graded", sub };
    }
    if (sub && (sub.status === "pending_review" || sub.progressStatus === "submitted")) {
      return { status: "submitted" as const, label: "Submitted", sub };
    }
    if (sub && (sub.status === "in_progress" || sub.progressStatus === "in_progress")) {
      return { status: "in_progress" as const, label: "In Progress", sub };
    }
    if (studentProg === "in_progress" || (studentId === "usr-stu-1" && asgId === "asg-1")) {
      return { status: "in_progress" as const, label: "In Progress", sub: sub || null };
    }
    if (studentProg === "submitted") {
      return { status: "submitted" as const, label: "Submitted", sub: sub || null };
    }
    return { status: "pending" as const, label: "Pending", sub: sub || null };
  };

  // Build matrix rows for class-wide summary table
  const summaryMatrixRows: Array<{
    student: any;
    assignment: Assignment;
    statusInfo: ReturnType<typeof getStudentAssignmentStatus>;
  }> = [];

  cohortStudents.forEach((st) => {
    assignments.forEach((asg) => {
      // Cohort check
      if (selectedCohortFilter !== "all" && st.class_name !== selectedCohortFilter) return;
      if (selectedTaskFilter !== "all" && asg.id !== selectedTaskFilter) return;

      const statusInfo = getStudentAssignmentStatus(st.id, asg.id);

      if (selectedStatusFilter !== "all") {
        if (selectedStatusFilter === "graded" && statusInfo.status !== "graded") return;
        if (selectedStatusFilter === "submitted" && statusInfo.status !== "submitted") return;
        if (selectedStatusFilter === "in_progress" && statusInfo.status !== "in_progress") return;
        if (selectedStatusFilter === "pending" && statusInfo.status !== "pending") return;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name?.toLowerCase().includes(q);
        const matchReg = st.regNo?.toLowerCase().includes(q) || st.id?.toLowerCase().includes(q);
        const matchTitle = asg.title?.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchTitle) return;
      }

      summaryMatrixRows.push({
        student: st,
        assignment: asg,
        statusInfo
      });
    });
  });

  // Calculate aggregated stats across all students & assignments
  const totalClassAssignments = cohortStudents.length * (assignments.length || 1);
  const allSubmissionsCount = summaryMatrixRows.filter((r) => r.statusInfo.status === "submitted" || r.statusInfo.status === "graded").length;
  const allInProgressCount = summaryMatrixRows.filter((r) => r.statusInfo.status === "in_progress").length;
  const allPendingCount = summaryMatrixRows.filter((r) => r.statusInfo.status === "pending").length;
  const submissionRate = totalClassAssignments > 0 ? Math.round((allSubmissionsCount / totalClassAssignments) * 100) : 0;

  // Export Class Summary to CSV
  const handleExportCSV = () => {
    const headers = ["Student Name", "Student ID / RegNo", "Class Cohort", "Assignment Title", "Subject", "Due Date", "Status", "Student Additional Notes", "Grade", "Max Marks", "Submission Date"];
    const rows = summaryMatrixRows.map((r) => [
      `"${r.student.name}"`,
      `"${r.student.regNo || r.student.id}"`,
      `"${r.student.class_name || 'SS 2 Science'}"`,
      `"${r.assignment.title}"`,
      `"${r.assignment.subject}"`,
      `"${r.assignment.dueDate}"`,
      `"${r.statusInfo.label}"`,
      `"${(r.statusInfo.sub?.studentNotes || "").replace(/"/g, '""')}"`,
      r.statusInfo.sub?.gradeScore !== undefined ? r.statusInfo.sub.gradeScore : "N/A",
      r.assignment.maxMarks,
      r.statusInfo.sub?.submittedAt ? `"${new Date(r.statusInfo.sub.submittedAt).toLocaleDateString()}"` : "Not Submitted"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CornerStreams_Class_Assignment_Summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Class Submission Summary exported to CSV successfully!");
  };

  const handleBroadcastReminder = () => {
    toast.success(`📢 Reminder notification dispatched to all ${cohortStudents.length} students in ${activeAssignment?.classCohort || 'SS 2 Science'}!`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-300 font-black tracking-widest uppercase bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Teacher Faculty Workspace
            </span>
            <span className="text-[10px] text-indigo-200 font-mono">
              Class Cohort: SS 2 Science
            </span>
          </div>
          <h1 className="font-display text-xl md:text-2xl font-black text-white">
            Class Homework & Submission Manager
          </h1>
          <p className="text-xs text-indigo-100 max-w-xl">
            Track student progress, evaluate homework, and review class-wide submission metrics with integrated <strong className="text-emerald-300">Nonye AI Socratic mentoring</strong> logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAiGenOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Draft Homework</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Main View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView("summary_table")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeView === "summary_table"
                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Class Submission Summary Table</span>
          </button>

          <button
            onClick={() => setActiveView("assignment_manager")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeView === "assignment_manager"
                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Assignment Manager & Grading Studio</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBroadcastReminder}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Remind Class</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Summary CSV</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: CLASS SUBMISSION SUMMARY TABLE ================= */}
      {activeView === "summary_table" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Class Summary KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Enrolled Students
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{cohortStudents.length}</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 font-medium block">
                Class: SS 2 Science
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                Turned In / Submitted
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-700">{allSubmissionsCount}</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <span className="text-[10.5px] text-emerald-700 font-bold block">
                {submissionRate}% Submission Rate
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                Currently In Progress
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-700">{allInProgressCount}</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit className="w-4 h-4" />
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 font-medium block">
                Actively solving or consulting AI
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">
                Pending Action
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-700">{allPendingCount}</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 font-medium block">
                Awaiting student submission
              </span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name or Reg No..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Assignment Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span className="text-slate-400">Task:</span>
                <select
                  value={selectedTaskFilter}
                  onChange={(e) => setSelectedTaskFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">All Assignments ({assignments.length})</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.subject}: {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span className="text-slate-400">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing {summaryMatrixRows.length} Records
            </span>
          </div>

          {/* Comprehensive Class Submission Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Class Submission Status Summary Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time synchronization of student assignment status across all cohort members.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[950px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[180px]">Student Name & Reg</TableHead>
                    <TableHead>Class Cohort</TableHead>
                    <TableHead>Assignment Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submission Status</TableHead>
                    <TableHead className="min-w-[200px] max-w-[280px]">Additional Notes / Context</TableHead>
                    <TableHead>AI Socratic Hints</TableHead>
                    <TableHead>Grade Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryMatrixRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>No records found matching your filters.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryMatrixRows.map((row, idx) => {
                      const { student, assignment, statusInfo } = row;
                      const isGraded = statusInfo.status === "graded";
                      const isSubmitted = statusInfo.status === "submitted";
                      const isInProgress = statusInfo.status === "in_progress";

                      return (
                        <TableRow key={`${student.id}-${assignment.id}-${idx}`} className="hover:bg-slate-50/60 transition">
                          <TableCell className="font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                {student.name?.charAt(0) || "S"}
                              </div>
                              <div>
                                <span className="text-xs block leading-tight">{student.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {student.regNo || student.id}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10.5px] font-medium text-slate-700">
                              {student.class_name || "SS 2 Science"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded inline-block">
                                {assignment.subject}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 block line-clamp-1 max-w-[180px]" title={assignment.title}>
                                {assignment.title}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 font-mono">
                            {assignment.dueDate}
                          </TableCell>

                          <TableCell>
                            {isGraded ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Graded</span>
                              </span>
                            ) : isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Submitted</span>
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                                <Edit className="w-3.5 h-3.5 text-indigo-600" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                          </TableCell>

                          {/* Student Additional Notes / Context */}
                          <TableCell className="max-w-[280px]">
                            {statusInfo.sub?.studentNotes ? (
                              <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-950 font-medium flex items-start gap-1.5 shadow-2xs">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 leading-relaxed" title={statusInfo.sub.studentNotes}>
                                  {statusInfo.sub.studentNotes}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Sparkles className="w-3 h-3 text-indigo-500" />
                              <span>{statusInfo.sub?.socraticDialogueCount || (isInProgress ? 2 : 0)} Inquiries</span>
                            </span>
                          </TableCell>

                          <TableCell className="text-xs font-mono font-bold">
                            {isGraded ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {statusInfo.sub?.gradeScore} / {assignment.maxMarks}
                              </span>
                            ) : (
                              <span className="text-slate-400">— / {assignment.maxMarks}</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setReviewSubmission({ student, sub: statusInfo.sub, asg: assignment });
                                  setGradeInput(statusInfo.sub?.gradeScore || assignment.maxMarks);
                                  setFeedbackInput(statusInfo.sub?.teacherFeedback || "Well done on detailing your formula substitution!");
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                {isGraded ? "Edit Grade" : isSubmitted ? "Grade Solution" : "Review"}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: ASSIGNMENT MANAGER & ROSTER STUDIO ================= */}
      {activeView === "assignment_manager" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* Left Column: List of Published Assignments */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Tasks ({assignments.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {assignments.map((asg) => {
                const isActive = asg.id === activeAssignmentId;
                const subCount = (Object.values(submissions) as AssignmentSubmission[]).filter((s) => s.assignmentId === asg.id).length;

                return (
                  <div
                    key={asg.id}
                    onClick={() => setActiveAssignmentId(asg.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                      isActive
                        ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {asg.subject}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        Max: {asg.maxMarks} pts
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug">
                      {asg.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {asg.dueDate}
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                        {subCount} Submissions
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Submission Status Matrix for the Selected Assignment */}
          <div className="lg:col-span-8 space-y-4">
            {activeAssignment && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {activeAssignment.subject}
                      </span>
                      <span className="text-xs text-slate-500">
                        Topic: <strong className="text-slate-800">{activeAssignment.topic}</strong>
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {activeAssignment.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Due Date: <strong>{activeAssignment.dueDate}</strong> at {activeAssignment.dueTime || "11:59 PM"} • Max Score: <strong>{activeAssignment.maxMarks} Marks</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                      Cohort: {activeAssignment.classCohort}
                    </span>
                  </div>
                </div>

                {/* Instructions Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assignment Instructions:
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {activeAssignment.description}
                  </p>
                  {activeAssignment.instructions && activeAssignment.instructions.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {activeAssignment.instructions.map((inst, i) => (
                        <div key={i} className="text-xs text-slate-800 flex items-start gap-1.5">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{inst}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Student Submissions Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Individual Student Grading & Solution Review
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {cohortStudents.length} Students in Cohort
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <Table className="min-w-[750px]">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Student Name</TableHead>
                          <TableHead>Submission Status</TableHead>
                          <TableHead className="min-w-[180px] max-w-[240px]">Student Context Notes</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>Grade / Max</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cohortStudents.map((st) => {
                          const statusInfo = getStudentAssignmentStatus(st.id, activeAssignment.id);
                          const isSubmitted = statusInfo.status === "submitted" || statusInfo.status === "graded";
                          const isGraded = statusInfo.status === "graded";

                          return (
                            <TableRow key={st.id}>
                              <TableCell className="font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                    {st.name?.charAt(0) || "S"}
                                  </div>
                                  <div>
                                    <span>{st.name}</span>
                                    <span className="text-[10px] text-slate-400 block font-mono">ID: {st.regNo || st.id}</span>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                {isGraded ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <BadgeCheck className="w-3.5 h-3.5" /> Graded
                                  </span>
                                ) : isSubmitted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    <Check className="w-3.5 h-3.5" /> Ready for Review
                                  </span>
                                ) : statusInfo.status === "in_progress" ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    <Edit className="w-3.5 h-3.5" /> In Progress
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    <Clock className="w-3.5 h-3.5" /> Pending Solution
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="max-w-[240px]">
                                {statusInfo.sub?.studentNotes ? (
                                  <div className="p-1.5 bg-indigo-50/80 border border-indigo-100 rounded-lg text-xs text-indigo-950 font-medium flex items-start gap-1.5">
                                    <MessageSquare className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2" title={statusInfo.sub.studentNotes}>
                                      {statusInfo.sub.studentNotes}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">—</span>
                                )}
                              </TableCell>

                              <TableCell className="text-xs text-slate-600">
                                {statusInfo.sub?.submittedAt ? new Date(statusInfo.sub.submittedAt).toLocaleDateString() : "—"}
                              </TableCell>

                              <TableCell className="text-xs font-mono font-bold">
                                {isGraded ? (
                                  <span className="text-emerald-700">{statusInfo.sub?.gradeScore} / {activeAssignment.maxMarks}</span>
                                ) : (
                                  <span className="text-slate-400">— / {activeAssignment.maxMarks}</span>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <button
                                  onClick={() => {
                                    setReviewSubmission({ student: st, sub: statusInfo.sub, asg: activeAssignment });
                                    setGradeInput(statusInfo.sub?.gradeScore || activeAssignment.maxMarks);
                                    setFeedbackInput(statusInfo.sub?.teacherFeedback || "Well done on detailing your working steps!");
                                  }}
                                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  {isGraded ? "Edit Grade" : "Review & Grade"}
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CREATE ASSIGNMENT DIALOG ================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Create & Publish New Homework Assignment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure curriculum tasks for your students. Nonye AI will assist students who get stuck using Socratic hints.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Class Cohort</label>
                <input
                  type="text"
                  value={formCohort}
                  onChange={(e) => setFormCohort(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assignment Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Electric Circuit Calculations & Ohm's Law"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Topic / Curriculum Area</label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g. Current Electricity & Series-Parallel Networks"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Time</label>
                <input
                  type="text"
                  value={formDueTime}
                  onChange={(e) => setFormDueTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Max Marks</label>
                <input
                  type="number"
                  value={formMaxMarks}
                  onChange={(e) => setFormMaxMarks(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Task Overview / Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Short summary of what students must achieve..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Specific Questions / Sub-Tasks (One per line)
              </label>
              <textarea
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={4}
                placeholder="1. Question 1...&#10;2. Question 2..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Socratic AI Mentoring Context (Optional)
              </label>
              <input
                type="text"
                value={formSocraticContext}
                onChange={(e) => setFormSocraticContext(e.target.value)}
                placeholder="e.g. Prompt students on internal resistance formula if they get stuck"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewAssignment}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Publish Assignment</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= AI DRAFT HOMEWORK GENERATOR DIALOG ================= */}
      <Dialog open={isAiGenOpen} onOpenChange={setIsAiGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Nonye AI Homework Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Input your syllabus topic and let Nonye draft structured homework problems with Socratic mentoring rubrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                value={aiGenSubject}
                onChange={(e) => setAiGenSubject(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Curriculum Topic</label>
              <input
                type="text"
                value={aiGenTopic}
                onChange={(e) => setAiGenTopic(e.target.value)}
                placeholder="e.g. Faraday's Laws & Electromagnetic Induction"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Standard / Difficulty</label>
              <input
                type="text"
                value={aiGenDifficulty}
                onChange={(e) => setAiGenDifficulty(e.target.value)}
                placeholder="e.g. Senior Secondary (WAEC / NECO / JAMB)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsAiGenOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAiAssignment}
              disabled={isAiGenerating}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isAiGenerating ? (
                <span>Generating Draft...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Assignment</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= REVIEW & GRADE SUBMISSION DIALOG ================= */}
      {reviewSubmission && (
        <Dialog open={!!reviewSubmission} onOpenChange={() => setReviewSubmission(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                Grade Student Submission
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Student: <strong>{reviewSubmission.student.name}</strong> • Assignment: <strong>{reviewSubmission.asg.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Submitted Solution & Working:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 max-h-40 overflow-y-auto">
                  {reviewSubmission.sub?.solutionText || (
                    <span className="text-slate-400 italic">No textual solution provided yet. (Student may have completed in their physical exercise notebook).</span>
                  )}
                </div>
              </div>

              {reviewSubmission.sub?.studentNotes && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Student Note to Teacher:</label>
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 italic">
                    "{reviewSubmission.sub.studentNotes}"
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Score (Max {reviewSubmission.asg.maxMarks})
                  </label>
                  <input
                    type="number"
                    max={reviewSubmission.asg.maxMarks}
                    min={0}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Score % Equivalent</label>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-800">
                    {Math.round((gradeInput / reviewSubmission.asg.maxMarks) * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Teacher Feedback Remark</label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. Excellent work on circuit steps! Remember to state unit values in Ohm (Ω)."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setReviewSubmission(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Grade & Feedback</span>
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default TeacherAssignmentsManager;
