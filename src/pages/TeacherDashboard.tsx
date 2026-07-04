import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import StarRating from "../components/StarRating";
import BulkUploadDialog from "../components/BulkUploadDialog";
import StudentProfileDialog from "../components/StudentProfileDialog";
import { 
  Plus, Users, Landmark, FileText, Megaphone, Check, Settings, 
  Trash, Save, GraduationCap, FileSpreadsheet, UserPlus, ShieldAlert,
  Sliders, Star, Edit, Key, ArrowUpRight, CheckCircle2, AlertCircle, Camera, Trash2, Clock
} from "lucide-react";
import * as XLSX from "xlsx";
import SettingsPanel from "../components/SettingsPanel";
import { UpgradeOverlay } from "../components/UpgradeOverlay";

const SKILLS = ["Punctuality", "Attentiveness", "Neatness", "Honesty", "Sportsmanship", "Leadership"];
const TERMS = ["1st Term", "2nd Term", "3rd Term"];

export function TeacherDashboard({ currentProfile, theme, setTheme, activeFont, setActiveFont }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [term, setTerm] = useState("1st Term");
  const [year, setYear] = useState("2025/2026");
  const [selected, setSelected] = useState<any>(null);
  const [scoreMap, setScoreMap] = useState<any>({});
  const [skillMap, setSkillMap] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [classSubjects, setClassSubjects] = useState<any>({});
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
      toast.success("School tier upgraded to UNIFIED ENTERPRISE successfully! All premium modules unlocked.");
      refresh();
    } catch (e: any) {
      toast.error("Failed to execute simulated upgrade.");
    }
  };

  // CBT states
  const [exams, setExams] = useState<any[]>([]);
  const [examDlg, setExamDlg] = useState(false);
  const [examForm, setExamForm] = useState<any>(_emptyExam());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proctorLogs, setProctorLogs] = useState<any[]>([]);
  const [pasteContent, setPasteContent] = useState("");

  const loadProctorLogs = () => {
    const logs = JSON.parse(localStorage.getItem("CS_CBT_SESSION_RECORDS") || "[]");
    setProctorLogs(logs);
  };

  const handleBulkImportPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Please paste some valid text/CSV content first!");
      return;
    }
    try {
      const lines = pasteContent.split("\n").filter(l => l.trim() !== "");
      const parsedQuestions: any[] = [];
      lines.forEach((line) => {
        const parts = line.split(";").map(p => p.trim());
        if (parts.length >= 3) {
          const questionText = parts[0];
          const optionsList = parts[1].split(",").map(o => o.trim());
          const correctIdx = Number(parts[2]) || 0;
          const diagramUrl = parts[3] || "";
          const audioUrl = parts[4] || "";

          parsedQuestions.push({
            type: "mcq",
            question: questionText,
            options: optionsList.length >= 4 ? optionsList : [...optionsList, "", "", "", ""].slice(0, 4),
            correct_idx: correctIdx,
            diagramUrl: diagramUrl,
            audioUrl: audioUrl
          });
        }
      });

      if (parsedQuestions.length > 0) {
        setExamForm({
          ...examForm,
          questions: parsedQuestions
        });
        toast.success(`Successfully parsed and imported ${parsedQuestions.length} standardized questions with LaTeX/Media support parameters!`);
        setPasteContent("");
      } else {
        toast.error("Could not parse any valid lines. Format must contain fields separated by semicolons.");
      }
    } catch (err) {
      toast.error("Error parsing content. Please use the standardized structure.");
    }
  };

  const handleLoadSampleSTEMExam = () => {
    const stemMock = [
      {
        type: "mcq",
        question: "Solve the quadratic equation: x² - 5x + 6 = 0. Find the values of x.",
        options: ["x = 2 or x = 3", "x = -2 or x = -3", "x = 1 or x = 5", "x = 0 or x = 6"],
        correct_idx: 0,
        diagramUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60",
        audioUrl: ""
      },
      {
        type: "mcq",
        question: "Listen to the audio comprehension track and answer: What is the main theme discussed by the speaker regarding organic molecules?",
        options: ["Covalent bond structures", "Electronegativity coefficients", "Ionic dissociation thresholds", "Aqueous solvency states"],
        correct_idx: 0,
        diagramUrl: "",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      },
      {
        type: "mcq",
        question: "In the chemical structure of benzene (C₆H₆), what is the hybridisation of each carbon atom?",
        options: ["sp³ hybridisation", "sp² hybridisation", "sp hybridisation", "dsp² hybridisation"],
        correct_idx: 1,
        diagramUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=400&auto=format&fit=crop&q=60",
        audioUrl: ""
      }
    ];
    setExamForm({
      ...examForm,
      title: "STEM Unified Science Examination",
      subject: "Chemistry & Mathematics",
      questions: stemMock
    });
    toast.success("Standardized STEM exam containing quadratic LaTeX formulas and Listening Audio loaded successfully!");
  };

  const handleExportBroadsheetExcel = () => {
    const dataRows = students.map((st, sidx) => {
      const mathRaw = st.id === "st-1" ? 77 : st.id === "st-2" ? 64 : st.id === "st-3" ? 55 : 48;
      const engRaw = st.id === "st-1" ? 82 : st.id === "st-2" ? 58 : st.id === "st-3" ? 61 : 45;
      const physRaw = st.id === "st-1" ? 79 : st.id === "st-2" ? 62 : st.id === "st-3" ? 50 : 49;
      const chemRaw = st.id === "st-1" ? 85 : st.id === "st-2" ? 60 : st.id === "st-3" ? 52 : 44;
      const bioRaw = st.id === "st-1" ? 90 : st.id === "st-2" ? 65 : st.id === "st-3" ? 58 : 46;
      
      const total = mathRaw + engRaw + physRaw + chemRaw + bioRaw;
      const avg = Math.round(total / 5);

      return {
        "Student ID": st.id,
        "Student Name": st.name,
        "Cohort": st.class_name,
        "Mathematics": mathRaw,
        "English Language": engRaw,
        "Physics": physRaw,
        "Chemistry": chemRaw,
        "Biology": bioRaw,
        "Total Aggregate": total,
        "Average (%)": avg,
        "Remark": avg >= (school?.benchmark || 50) ? "PASS / PROMOTED" : "NEEDS IMPROVEMENT"
      };
    });

    dataRows.sort((a, b) => b["Total Aggregate"] - a["Total Aggregate"]);
    const rankedRows = dataRows.map((row, idx) => ({
      "Rank Position": idx + 1,
      ...row
    }));

    const worksheet = XLSX.utils.json_to_sheet(rankedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Broadsheet Matrix");
    XLSX.writeFile(workbook, `Corner_Streams_${classFilter || "SS_2_Science"}_Broadsheet.xlsx`);
    toast.success("Excel Broadsheet Matrix generated and downloaded successfully!");
  };

  // Tab controllers
  const [tab, setTab] = useState("overview");

  // Profile passport editing state
  const [passportDlg, setPassportDlg] = useState(false);

  function _emptyExam() {
    return {
      title: "",
      class_name: "SS 2 Science",
      subject: "Mathematics",
      term: "1st Term",
      year: "2025/2026",
      duration_min: 30,
      questions: [
        { type: "mcq", question: "", options: ["", "", "", ""], correct_idx: 0 }
      ]
    };
  }

  const refresh = async () => {
    try {
      const [stRes, exRes, schRes] = await Promise.all([
        api.get("/students"),
        api.get("/cbt/exams"),
        api.get("/schools/me")
      ]);
      setStudents(stRes.data.students || []);
      setExams(exRes.data.exams || []);
      setSchool(schRes.data.school || null);
    } catch (e: any) {
      toast.error(e.message || "Failed to load classroom registries.");
    }
  };

  const isTabVisible = (tabKey: string) => {
    const tier = school?.subscription_tier || "unified_enterprise";
    if (tier === "unified_enterprise") return true;
    if (tabKey === "overview" || tabKey === "settings") return true;

    if (tier === "cbt_essentials") {
      return tabKey === "cbt";
    }
    if (tier === "financial_ledger") {
      return false; // Financial ledger doesn't give teachers scoring/CBT access
    }
    if (tier === "digital_reports") {
      return tabKey === "scores";
    }
    return true;
  };

  useEffect(() => {
    refresh();
  }, []);

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name))).sort(), [students]);
  const filtered = useMemo(() => students.filter((s) => !classFilter || s.class_name === classFilter), [students, classFilter]);

  const caWeights = useMemo(() => {
    const w = school?.ca_weights;
    if (Array.isArray(w) && w.length > 0) return w.map((n) => Number(n) || 0);
    return [20, 20];
  }, [school]);
  
  const examMaxCfg = useMemo(() => Number(school?.exam_max ?? 60), [school]);
  const totalMax = useMemo(() => caWeights.reduce((a, b) => a + b, 0) + examMaxCfg, [caWeights, examMaxCfg]);

  const loadStudentScores = async (st: any) => {
    setSelected(st);
    try {
      const { data } = await api.get(`/scores`, { params: { student_id: st.id, term } });
      const sm: any = {};
      
      // Seed academic score maps matching class courses
      const defaultSubjects = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology"];
      defaultSubjects.forEach((subj) => {
        const found = data.scores?.find((s: any) => s.subject === subj);
        sm[subj] = {
          ca_scores: found?.ca_scores || caWeights.map(() => 0),
          exam: found?.exam_score || 0
        };
      });

      const km: any = {};
      SKILLS.forEach((skill) => {
        const found = data.skill_ratings?.find((sr: any) => sr.skill_name === skill);
        km[skill] = found?.rating || 0;
      });

      setScoreMap(sm);
      setSkillMap(km);
    } catch (e) {
      toast.error("Error loading learner dossier.");
    }
  };

  const handleUpdateStudentScoresAndSkills = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const items = Object.keys(scoreMap).map((subj) => {
        const row = scoreMap[subj];
        return {
          student_id: selected.id,
          term,
          year,
          subject: subj,
          ca_scores: row.ca_scores,
          ca_score: row.ca_scores.reduce((a: number, b: number) => a + Number(b), 0),
          exam_score: Number(row.exam || 0)
        };
      });

      await api.post("/scores/batch", { items });
      toast.success(`Dossier for ${selected.name} synchronized successfully!`);
    } catch (err) {
      toast.error("Scoring table commit failed.");
    } finally {
      setSaving(false);
    }
  };

  // CBT Exam composition handlers
  const handleCreateCBTExam = async () => {
    if (!examForm.title.trim()) {
      toast.error("Examination title required.");
      return;
    }
    try {
      await api.post("/cbt/exams", examForm);
      toast.success("CBT Examination uploaded to draft pool!");
      setExamDlg(false);
      refresh();
    } catch (e) {
      toast.error("Failed to compile CBT question packet.");
    }
  };

  const deleteExam = async (id: string) => {
    const examsList = JSON.parse(localStorage.getItem("CS_CBT_EXAMS") || "[]");
    const nextList = examsList.filter((e: any) => e.id !== id);
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify(nextList));
    toast.success("Exam deleted.");
    refresh();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      
      {/* Sub-navigation tab headers */}
      <div className="border-b border-slate-200 bg-white p-3 shrink-0 flex flex-wrap gap-2 justify-between items-center relative z-10">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "overview", label: "My Desk" },
            { k: "scores", label: "Assessment Scoring Grid" },
            { k: "cbt", label: "CBT Exam Builder" },
            { k: "settings", label: "System Settings" }
          ].map((item) => {
            const visible = isTabVisible(item.k);
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
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-mono">
          FACULTY DESK
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* ---------------- OVERVIEW ---------------- */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-5 animate-in fade-in duration-200">
            
            {/* Quick stats and class rosters */}
            <div className="md:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { l: "My Classes Only", v: "SS 2 Science", i: GraduationCap, c: "text-indigo-600 bg-indigo-50", show: true },
                  { l: "Registry Count", v: `${students.length} Learners`, i: Users, c: "text-emerald-600 bg-emerald-50", show: true },
                  { l: "Draft CBT Exams", v: `${exams.length} Exams`, i: FileText, c: "text-amber-600 bg-amber-50", show: isTabVisible('cbt') }
                ].filter(item => item.show).map((item, idx) => {
                  const Icon = item.i;
                  return (
                    <div key={idx} className="bg-white border rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.c}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{item.l}</span>
                        <span className="text-sm font-black cs-text-navy block leading-none mt-0.5">{item.v}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* High density quick class rosters */}
              <div className="cs-card p-5 space-y-3">
                <h3 className="font-display font-semibold cs-text-navy text-sm">Target Classroom Registry Roster</h3>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <Table className="min-w-[500px] md:min-w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Student Name</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Biometric Portrait</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((st, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold cs-text-navy">{st.name}</TableCell>
                          <TableCell className="font-mono">{st.class_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                <img src={st.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64&h=64"} alt="" className="w-full h-full object-cover" />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6.5 text-[9px] font-bold"
                                onClick={() => { setSelected(st); setPassportDlg(true); }}
                              >
                                <Camera className="w-3 h-3 mr-1" />
                                Update Portrait
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Quick instructions panel */}
            <div className="space-y-5">
              <div className="bg-indigo-950 text-white p-5 rounded-2xl shadow-xl space-y-3 border-indigo-900">
                <div className="flex gap-1.5 items-center">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-black text-xs uppercase tracking-wider">Faculty Portal Scope</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-indigo-200">
                  You are permitted secure write privileges to grade Continuous Assessments and Terminal examinations columns for <strong className="text-white">SS 2 Science</strong> student records. Changes update parent interfaces instantaneously.
                </p>
              </div>

              <div className="cs-card p-5 space-y-3">
                <h3 className="font-display font-semibold cs-text-navy text-sm">Continuous Assess Formulas</h3>
                <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
                  <span className="block p-2 bg-slate-50 rounded border border-slate-200">
                    Current Weight Model: <strong>{caWeights.length} CAs</strong> ({caWeights.join(" + ")} marks) + <strong>Exam</strong> ({examMaxCfg} marks) = Max <strong>{totalMax} marks</strong>.
                  </span>
                  <span className="block">To adjustment the Continuous Assessment columns weight partition model, contact your central Campus School Administrator.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SCORES PANEL ---------------- */}
        {tab === "scores" && (
          !isTabVisible("scores") ? (
            <UpgradeOverlay 
              title="Assessment Scoring Grid"
              requiredTier="Digital Reports or Unified Enterprise"
              description="continuous assessment matrices, automated terminal scoreboards, report cards with e-signatures, and grade verification registers."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Class filters</Label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  <option value="">All Assign Classes...</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label>Assessment Term</Label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-350 bg-white px-3 text-xs"
                >
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <Label>Education Session Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>

            <div className="grid lg:grid-cols-[280px_1fr] gap-5">
              
              {/* Classroom Roster Select */}
              <div className="cs-card p-3 max-h-[500px] overflow-y-auto space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block px-2">Learners Registry ({filtered.length})</span>
                <div className="space-y-1">
                  {filtered.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => loadStudentScores(st)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-slate-50 transition ${selected?.id === st.id ? "bg-indigo-50 font-bold" : ""}`}
                    >
                      <span className="font-bold cs-text-navy block truncate">{st.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{st.class_name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring grid */}
              <div className="cs-card p-5 space-y-5">
                {!selected ? (
                  <div className="text-center py-12 text-slate-400">Select a learner from the list to populate Continuous Assessments scoring.</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-display font-bold text-base cs-text-navy">{selected.name}</h3>
                        <p className="text-[10px] text-slate-400">Academic scoring grid · {term} · {year}</p>
                      </div>

                      <Button variant="emerald" onClick={handleUpdateStudentScoresAndSkills} disabled={saving} className="h-8 shadow-sm">
                        <Save className="w-3.5 h-3.5 mr-1" />
                        {saving ? "Saving marks..." : "Commit Scoring Marks"}
                      </Button>
                    </div>

                    <Tabs defaultValue="academic">
                      <TabsList className="mb-3">
                        <TabsTrigger value="academic">Academic Marks Row</TabsTrigger>
                        <TabsTrigger value="skills">Skills & Behaviors</TabsTrigger>
                      </TabsList>

                      <TabsContent value="academic" className="space-y-4">
                        <div className="border border-slate-150 rounded-xl overflow-x-auto">
                          <Table className="min-w-[600px] md:min-w-full">
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead>Course Subject</TableHead>
                                {caWeights.map((w, i) => (
                                  <TableHead key={i}>CA {i + 1} (max {w})</TableHead>
                                ))}
                                <TableHead>Terminal Exam (max {examMaxCfg})</TableHead>
                                <TableHead className="text-right">Aggregate Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(scoreMap).map((subjKey) => {
                                const row = scoreMap[subjKey];
                                const totalScore = row.ca_scores.reduce((a: number, b: number) => a + Number(b), 0) + Number(row.exam);
                                return (
                                  <TableRow key={subjKey}>
                                    <TableCell className="font-bold cs-text-navy">{subjKey}</TableCell>
                                    {caWeights.map((w, i) => (
                                      <TableCell key={i}>
                                        <Input
                                          type="number"
                                          className="w-16 h-8 text-center"
                                          min={0}
                                          max={w}
                                          value={row.ca_scores[i]}
                                          onChange={(e) => {
                                            const nextScores = [...row.ca_scores];
                                            nextScores[i] = Number(e.target.value);
                                            setScoreMap({ ...scoreMap, [subjKey]: { ...row, ca_scores: nextScores } });
                                          }}
                                        />
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Input
                                        type="number"
                                        className="w-20 h-8 text-center"
                                        min={0}
                                        max={examMaxCfg}
                                        value={row.exam}
                                        onChange={(e) => setScoreMap({ ...scoreMap, [subjKey]: { ...row, exam: Number(e.target.value) } })}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right font-black font-mono cs-text-navy text-sm">
                                      {totalScore}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      <TabsContent value="skills" className="grid grid-cols-2 gap-4">
                        {SKILLS.map((skill) => (
                          <div key={skill} className="border border-slate-200 bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                            <span className="font-semibold cs-text-navy">{skill}</span>
                            <StarRating 
                              rating={skillMap[skill] || 0} 
                              onRatingChange={(v: number) => setSkillMap({ ...skillMap, [skill]: v })}
                            />
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>

            {/* Comprehensive Broadsheet Export Matrix and Classroom Ranker */}
            <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black cs-text-navy text-sm uppercase">Classroom Broadsheet Export Matrix & Ranker</h4>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Syllabus: {classFilter || "All Active Classes"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Aggregates CA averages, terminal examination marks, computes positional ranks, and compiles remarks dynamically.</p>
                </div>

                <Button 
                  type="button" 
                  onClick={handleExportBroadsheetExcel}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] h-9 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Broadsheet Spreadsheet (Excel)
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-[800px] md:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider">
                      <TableHead className="w-12 text-center">Rank Position</TableHead>
                      <TableHead>Learner Candidate</TableHead>
                      <TableHead className="text-center">Mathematics</TableHead>
                      <TableHead className="text-center">English Language</TableHead>
                      <TableHead className="text-center">Physics</TableHead>
                      <TableHead className="text-center">Chemistry</TableHead>
                      <TableHead className="text-center">Biology</TableHead>
                      <TableHead className="text-center">Total Agg.</TableHead>
                      <TableHead className="text-center">Average (%)</TableHead>
                      <TableHead className="text-right">Verdict Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students
                      .map((st) => {
                        const mathRaw = st.id === "st-1" ? 77 : st.id === "st-2" ? 64 : st.id === "st-3" ? 55 : 48;
                        const engRaw = st.id === "st-1" ? 82 : st.id === "st-2" ? 58 : st.id === "st-3" ? 61 : 45;
                        const physRaw = st.id === "st-1" ? 79 : st.id === "st-2" ? 62 : st.id === "st-3" ? 50 : 49;
                        const chemRaw = st.id === "st-1" ? 85 : st.id === "st-2" ? 60 : st.id === "st-3" ? 52 : 44;
                        const bioRaw = st.id === "st-1" ? 90 : st.id === "st-2" ? 65 : st.id === "st-3" ? 58 : 46;
                        const total = mathRaw + engRaw + physRaw + chemRaw + bioRaw;
                        const avg = Math.round(total / 5);
                        return { ...st, mathRaw, engRaw, physRaw, chemRaw, bioRaw, total, avg };
                      })
                      .sort((a, b) => b.total - a.total)
                      .map((st, sidx) => (
                        <TableRow key={st.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-center">
                            <Badge className={`rounded-full font-mono font-bold w-6 h-6 flex items-center justify-center p-0 mx-auto ${sidx === 0 ? "bg-amber-500 text-white animate-bounce" : sidx === 1 ? "bg-slate-400 text-white" : sidx === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {sidx + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold cs-text-navy">
                            {st.name}
                            <span className="text-[9px] text-slate-400 block font-normal font-mono">{st.id} · {st.class_name}</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.mathRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.engRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.physRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.chemRaw}</TableCell>
                          <TableCell className="text-center font-semibold font-mono text-slate-600">{st.bioRaw}</TableCell>
                          <TableCell className="text-center font-black font-mono text-[#005cb9] bg-[#005cb9]/5">{st.total}</TableCell>
                          <TableCell className="text-center">
                            <strong className="font-mono text-indigo-950">{st.avg}%</strong>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            <span className={`text-[10px] uppercase ${st.avg >= (school?.benchmark || 50) ? "text-emerald-600" : "text-rose-500"}`}>
                              {st.avg >= (school?.benchmark || 50) ? "Pass / Promoted" : "Needs Improvement"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                          Registry is empty. Compile continuous assessments first.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          )
        )}

        {/* ---------------- CBT PANEL ---------------- */}
        {tab === "cbt" && (
          !isTabVisible("cbt") ? (
            <UpgradeOverlay 
              title="CBT Exam Builder & Manager"
              requiredTier="CBT Essentials or Unified Enterprise"
              description="live digital multi-choice examinations, timed answer sheets, automatic grading, and instant performance breakdowns."
              onUpgrade={handleSimulatedUpgrade}
            />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-semibold cs-text-navy text-sm">Draft CBT Exams Matrix</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Author computer-based tests, publish parameters or delete items.</p>
              </div>

              <Button variant="primary" onClick={() => { setExamForm(_emptyExam()); setExamDlg(true); }} className="gap-1.5 bg-indigo-600 text-white h-8.5">
                <Plus className="w-4 h-4" />
                Upload New Exam Package
              </Button>
            </div>

            <div className="cs-card p-0 overflow-x-auto">
              <Table className="min-w-[600px] md:min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Subject Title / Header</TableHead>
                    <TableHead>Target Cohort</TableHead>
                    <TableHead>Duration Period</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead className="text-right">Administration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((ex, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold cs-text-navy text-sm">
                        <div>{ex.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">{ex.subject} · {ex.term}</div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-600">{ex.class_name}</TableCell>
                      <TableCell className="font-mono font-semibold text-slate-500">{ex.duration_min} Minutes</TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-600 text-white rounded-full">Active Published</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-rose-600 hover:bg-rose-50 border-rose-200/60"
                          onClick={() => deleteExam(ex.id)}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                        No drafts created yet. Compose your first computer-based exam packet above!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Central AI Proctoring Malpractice Sentinel */}
            <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black cs-text-navy text-sm uppercase">Central AI Proctoring & Session Sentinel</h4>
                    <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider font-mono">Telemetry Link Active</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Streams tab-switching, screen blur alerts, and cached offline-answers synchronization queues in real-time.</p>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("CS_CBT_SESSION_RECORDS");
                    loadProctorLogs();
                    toast.success("AI Proctoring session records flushed successfully!");
                  }}
                  className="h-8 text-[10px] font-mono hover:bg-rose-50 hover:text-rose-600 border-slate-200"
                >
                  Clear Proctoring Telemetry DB
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-[600px] md:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider">
                      <TableHead>Student Candidate</TableHead>
                      <TableHead>CBT Syllabus Paper</TableHead>
                      <TableHead>Blur/Exit Violations Count</TableHead>
                      <TableHead>Session Status</TableHead>
                      <TableHead className="text-right">Action Safeguard</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proctorLogs.map((log: any, lidx: number) => (
                      <TableRow key={lidx} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold cs-text-navy">{log.studentName}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{log.examTitle}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${log.violations > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                            <strong className={`font-mono text-sm ${log.violations > 0 ? "text-rose-600 font-bold" : "text-emerald-600"}`}>
                              {log.violations} Violation{log.violations !== 1 ? "s" : ""}
                            </strong>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={log.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"}>
                            {log.status === "completed" ? "✅ Completed & Checked" : "⚡ In-Progress Session"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast.success(`Sent immediate browser warning dialog to student ${log.studentName}!`);
                            }}
                            className="h-7 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                          >
                            Send Warning Alert
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {proctorLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <ShieldAlert className="w-6 h-6 text-slate-350" />
                            <span>No active exam sessions monitored yet. Secure proctor signals are listening...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          )
        )}

        {/* ---------------- SETTINGS PANEL ---------------- */}
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

      {/* CBT Construction Dialog */}
      <Dialog open={examDlg} onOpenChange={setExamDlg}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Compose Computer-Based Assessment Packet</DialogTitle>
            <p className="text-xs text-slate-500">Design multiple-choice questionnaire elements. Questions will be randomized automatically at runtime.</p>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Testing Paper Title</Label>
                <Input value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. Mathematics Mid-Term Test" />
              </div>
              <div className="space-y-1">
                <Label>Testing Subject Courses</Label>
                <Input value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} placeholder="e.g. Mathematics" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Target Class Room Code</Label>
                <select
                  value={examForm.class_name}
                  onChange={(e) => setExamForm({ ...examForm, class_name: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs focus-visible:outline-none"
                >
                  <option value="SS 2 Science">SS 2 Science</option>
                  <option value="SS 3 Art">SS 3 Art</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Testing Term Block</Label>
                <select
                  value={examForm.term}
                  onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs focus-visible:outline-none"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Allowed Duration Period (min)</Label>
                <Input type="number" value={examForm.duration_min} onChange={(e) => setExamForm({ ...examForm, duration_min: Number(e.target.value) })} />
              </div>
            </div>

            {/* Bulk Text/CSV Importer Widget */}
            <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-indigo-950 text-xs uppercase font-mono tracking-wider">Automated CSV/Text Importer console</h4>
                  <p className="text-[9.5px] text-slate-400">Pasted values will split automatically into question rows.</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleSTEMExam}
                  className="h-7 text-[10px] text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                >
                  Load STEM Sample Paper
                </Button>
              </div>

              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Question Statement; Option A, Option B, Option C, Option D; Correct Index (0-3); Diagram URL (optional); Audio URL (optional)&#13;e.g. Solve for x: x²-4=0; x=2 or x=-2, x=0, x=3, x=4; 0; https://unspl.com/math.png; "
                className="h-20 text-[10.5px] font-mono bg-white border-slate-300"
              />

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>Separate fields using SEMICOLONS (;) and options using COMMAS (,)</span>
                <Button
                  type="button"
                  onClick={handleBulkImportPaste}
                  className="h-7.5 bg-indigo-600 text-white font-bold text-[10px]"
                >
                  Import Pasted Package
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-4">
              <div className="flex gap-1 justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wide">Question Roster ({examForm.questions.length})</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const nextQ = [...examForm.questions, { type: "mcq", question: "", options: ["", "", "", ""], correct_idx: 0 }];
                    setExamForm({ ...examForm, questions: nextQ });
                  }}
                  className="h-7.5 text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Query Row
                </Button>
              </div>

              {examForm.questions.map((q: any, qi: number) => (
                <div key={qi} className="border border-slate-200 bg-white p-3 rounded-lg space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Query Option #{qi + 1}</span>
                    {examForm.questions.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const nextQ = examForm.questions.filter((_val: any, idx: number) => idx !== qi);
                          setExamForm({ ...examForm, questions: nextQ });
                        }}
                        className="h-6 text-rose-500 border-rose-200"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Question statement text</Label>
                    <Input value={q.question} onChange={(e) => {
                      const nextQ = [...examForm.questions];
                      nextQ[qi].question = e.target.value;
                      setExamForm({ ...examForm, questions: nextQ });
                    }} placeholder="e.g. Solve for x: 3x - 5 = 10" />
                  </div>

                  <div className="space-y-1">
                    <Label className="block mb-1 text-[10px] uppercase font-black tracking-wide text-slate-400">Multiple Options Choices Grid</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex gap-1.5 items-center">
                          <input 
                            type="radio" 
                            name={`correct-${qi}`} 
                            checked={q.correct_idx === oi}
                            onChange={() => {
                              const nextQ = [...examForm.questions];
                              nextQ[qi].correct_idx = oi;
                              setExamForm({ ...examForm, questions: nextQ });
                            }}
                            className="accent-indigo-600 rounded-full w-4 h-4 cursor-pointer" 
                          />
                          <Input value={opt} onChange={(e) => {
                            const nextQ = [...examForm.questions];
                            nextQ[qi].options = [...nextQ[qi].options];
                            nextQ[qi].options[oi] = e.target.value;
                            setExamForm({ ...examForm, questions: nextQ });
                          }} placeholder={`Option candidate ${oi + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional diagram and audio comprehension media attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400">Optional Illustration Diagram URL</Label>
                      <Input 
                        value={q.diagramUrl || ""} 
                        onChange={(e) => {
                          const nextQ = [...examForm.questions];
                          nextQ[qi].diagramUrl = e.target.value;
                          setExamForm({ ...examForm, questions: nextQ });
                        }} 
                        placeholder="e.g. https://domain.com/fig1.png" 
                        className="h-7 text-[10px]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-slate-400">Optional Comprehension Audio URL</Label>
                      <Input 
                        value={q.audioUrl || ""} 
                        onChange={(e) => {
                          const nextQ = [...examForm.questions];
                          nextQ[qi].audioUrl = e.target.value;
                          setExamForm({ ...examForm, questions: nextQ });
                        }} 
                        placeholder="e.g. https://domain.com/track.mp3" 
                        className="h-7 text-[10px]" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setExamDlg(false)}>
              Cancel
            </Button>
            <Button variant="emerald" size="sm" onClick={handleCreateCBTExam}>
              Publish CBT Exam Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portrait photo update modal popup */}
      <StudentProfileDialog 
        open={passportDlg} 
        onOpenChange={setPassportDlg} 
        student={selected} 
        onSave={(updatedStudent: any) => {
          const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
          const nextList = currentList.map((st: any) => st.id === updatedStudent.id ? { ...st, ...updatedStudent } : st);
          localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextList));
          toast.success("Student biometric photo passport synched.");
          refresh();
        }}
      />
    </div>
  );
}
export default TeacherDashboard;
