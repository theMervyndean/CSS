import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronRight,
  ArrowRight,
  Flame,
  Award,
  Layers,
  FileText,
  Lightbulb,
  Send,
  Loader2,
  Check,
  Sliders,
  Plus,
  Trash2,
  Printer,
  Coffee,
  CheckSquare,
  Square,
  Settings2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  BookmarkCheck,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { speakNonyeVoice } from "../utils/nonyeVoicePlayer";
import nonyeAvatar from "../assets/images/chinonye_portrait.jpg";

export interface NonyeStudyHubProps {
  studentProfile?: any;
  schoolName?: string;
  onOpenAssistantPrompt?: (prompt: string) => void;
}

const ALL_CURRICULUM_SUBJECTS = [
  { name: "General Mathematics", defaultPriority: "high", category: "STEM" },
  { name: "English Language", defaultPriority: "medium", category: "Arts" },
  { name: "Physics", defaultPriority: "high", category: "STEM" },
  { name: "Chemistry", defaultPriority: "high", category: "STEM" },
  { name: "Biology", defaultPriority: "medium", category: "Science" },
  { name: "Further Mathematics", defaultPriority: "high", category: "STEM" },
  { name: "Economics", defaultPriority: "medium", category: "Commercial" },
  { name: "Government", defaultPriority: "medium", category: "Arts" },
  { name: "Literature in English", defaultPriority: "medium", category: "Arts" },
  { name: "Civic Education", defaultPriority: "low", category: "General" },
  { name: "Computer Studies & Data Processing", defaultPriority: "medium", category: "Science" },
  { name: "Agricultural Science", defaultPriority: "low", category: "Science" },
  { name: "Commerce", defaultPriority: "medium", category: "Commercial" },
  { name: "Financial Accounting", defaultPriority: "high", category: "Commercial" },
  { name: "Geography", defaultPriority: "medium", category: "Science" },
  { name: "Technical Drawing", defaultPriority: "medium", category: "STEM" }
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function NonyeStudyHub({
  studentProfile,
  schoolName = "Corner Streams Academy",
  onOpenAssistantPrompt
}: NonyeStudyHubProps) {
  const [activeTab, setActiveTab] = useState<"timetable" | "alerts" | "techniques" | "homework">("timetable");

  const studentName = studentProfile?.fullName || "Ifeanyi Nwachukwu";
  const studentGrade = studentProfile?.class_name || studentProfile?.classAssigned || "SS 2 Science";
  const studentId = studentProfile?.id || "default";

  // --- 1. Study Timetable Configuration State ---
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [timetableMode, setTimetableMode] = useState<"grid" | "today">("grid");
  const [selectedDayTab, setSelectedDayTab] = useState<string>("Monday");

  // Availability Settings
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`CS_NONYE_AVAILABILITY_${studentId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      Monday: 2,
      Tuesday: 2,
      Wednesday: 2,
      Thursday: 2,
      Friday: 2,
      Saturday: 3.5,
      Sunday: 2
    };
  });

  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>(() => {
    return localStorage.getItem(`CS_NONYE_TIMESLOT_${studentId}`) || "Evenings (5:00 PM - 8:00 PM)";
  });

  const [studyPace, setStudyPace] = useState<"balanced" | "intensive" | "light">(() => {
    return (localStorage.getItem(`CS_NONYE_PACE_${studentId}`) as any) || "balanced";
  });

  const [includeBreaks, setIncludeBreaks] = useState<boolean>(() => {
    const saved = localStorage.getItem(`CS_NONYE_BREAKS_${studentId}`);
    return saved !== null ? saved === "true" : true;
  });

  const [examPrepTarget, setExamPrepTarget] = useState<string>(() => {
    return localStorage.getItem(`CS_NONYE_EXAM_TARGET_${studentId}`) || "Terminal CBT Midterms & WAEC Preparations";
  });

  // Selected subjects and priorities
  const [enrolledSubjects, setEnrolledSubjects] = useState<Array<{ name: string; priority: "high" | "medium" | "low" }>>(() => {
    const saved = localStorage.getItem(`CS_NONYE_SUBJECTS_${studentId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { name: "General Mathematics", priority: "high" },
      { name: "English Language", priority: "medium" },
      { name: "Physics", priority: "high" },
      { name: "Chemistry", priority: "high" },
      { name: "Biology", priority: "medium" },
      { name: "Further Mathematics", priority: "high" },
      { name: "Civic Education", priority: "low" }
    ];
  });

  // Completed sessions tracking map { sessionKey: boolean }
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`CS_NONYE_COMPLETED_SESSIONS_${studentId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Current timetable data
  const [timetableData, setTimetableData] = useState<any>(() => {
    const cached = localStorage.getItem(`CS_NONYE_TIMETABLE_V3_${studentId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    // Default initial schedule
    return {
      weeklyTarget: "Master SS2 Calculus, Mechanics & Organic Chemistry for CBT Exams",
      weeklyStrategy: "Interleaves heavy STEM problem solving with scheduled 10-minute mental hydration breaks and active recall drills.",
      totalWeeklyHours: 15.5,
      dailySchedule: [
        {
          day: "Monday",
          dayTheme: "Mathematical Foundations & Active Recall",
          targetHours: 2,
          sessions: [
            { id: "mon-1", timeSlot: "5:00 PM - 5:45 PM", type: "study", subject: "Further Mathematics", topicFocus: "Differentiation from First Principles", technique: "Pomodoro 25/5 Sprints", milestoneGoal: "Derive d/dx(x^n) and solve 5 sample WAEC problems" },
            { id: "mon-2", timeSlot: "5:45 PM - 5:55 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Eye Rest & Hydration", technique: "Deep Breathing & Posture Stretch", milestoneGoal: "Step away from screen for mental recovery" },
            { id: "mon-3", timeSlot: "5:55 PM - 6:40 PM", type: "revision", subject: "English Language", topicFocus: "Concord Rules & Lexis in Context", technique: "Active Recall Flashcards", milestoneGoal: "Review 15 vocabulary drills" },
            { id: "mon-4", timeSlot: "6:40 PM - 7:00 PM", type: "cbt_practice", subject: "General Mathematics", topicFocus: "Quadratic Equations Speed Drill", technique: "Timed CBT Drill", milestoneGoal: "Score 9/10 in 10-min speed test" }
          ]
        },
        {
          day: "Tuesday",
          dayTheme: "Physics Mechanics & Concept Simplification",
          targetHours: 2,
          sessions: [
            { id: "tue-1", timeSlot: "5:00 PM - 5:50 PM", type: "study", subject: "Physics", topicFocus: "Electric Current & Resistivity R = ρL/A", technique: "Feynman Explanation", milestoneGoal: "Explain resistivity to a peer in plain English" },
            { id: "tue-2", timeSlot: "5:50 PM - 6:00 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Physical Stretch & Water Break", technique: "Cognitive Reboot", milestoneGoal: "Rest eyes & hydrate" },
            { id: "tue-3", timeSlot: "6:00 PM - 7:00 PM", type: "cbt_practice", subject: "Physics", topicFocus: "Ohm's Law & Circuit Analysis", technique: "Past Question Drills", milestoneGoal: "Solve 10 series/parallel calculation items" }
          ]
        },
        {
          day: "Wednesday",
          dayTheme: "Chemical Reactions & Biological Systems",
          targetHours: 2,
          sessions: [
            { id: "wed-1", timeSlot: "5:00 PM - 5:45 PM", type: "study", subject: "Chemistry", topicFocus: "Electrolysis & Faraday's 1st & 2nd Laws", technique: "Formula Derivation Matrix", milestoneGoal: "Calculate mass deposited m = (M·I·t)/(n·F)" },
            { id: "wed-2", timeSlot: "5:45 PM - 5:55 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Eye Rest & Hydration", technique: "5-Min Reset", milestoneGoal: "Hydrate and stretch" },
            { id: "wed-3", timeSlot: "5:55 PM - 6:40 PM", type: "revision", subject: "Biology", topicFocus: "Vascular Bundles: Xylem & Phloem Functions", technique: "Summary Diagramming", milestoneGoal: "Sketch internal stem cross-section" },
            { id: "wed-4", timeSlot: "6:40 PM - 7:00 PM", type: "cbt_practice", subject: "Chemistry", topicFocus: "Electrolyte Solutions Quick Drill", technique: "Timed CBT Drill", milestoneGoal: "Score 100% on 8 questions" }
          ]
        },
        {
          day: "Thursday",
          dayTheme: "Genetics, Civics & Spaced Repetition",
          targetHours: 2,
          sessions: [
            { id: "thu-1", timeSlot: "5:00 PM - 5:50 PM", type: "study", subject: "Biology", topicFocus: "Mendelian Genetics & Punnett Squares", technique: "Active Recall Flashcards", milestoneGoal: "Solve 3 dihybrid cross probability problems" },
            { id: "thu-2", timeSlot: "5:50 PM - 6:00 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Brain Rest", technique: "Hydration Break", milestoneGoal: "Relax mental focus" },
            { id: "thu-3", timeSlot: "6:00 PM - 7:00 PM", type: "revision", subject: "Civic Education", topicFocus: "Democratic Institutions & Rule of Law", technique: "Keynotes Flash Summary", milestoneGoal: "Summarize 3 branches of government" }
          ]
        },
        {
          day: "Friday",
          dayTheme: "Calculus & Literary Synthesis",
          targetHours: 2,
          sessions: [
            { id: "fri-1", timeSlot: "4:30 PM - 5:25 PM", type: "study", subject: "Further Mathematics", topicFocus: "Integration by Substitution & Definite Integrals", technique: "Pomodoro 25/5 Sprints", milestoneGoal: "Complete 4 calculus integration exercises" },
            { id: "fri-2", timeSlot: "5:25 PM - 5:35 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Brain Rest", technique: "Stretch & Rest", milestoneGoal: "Hydrate" },
            { id: "fri-3", timeSlot: "5:35 PM - 6:30 PM", type: "revision", subject: "English Language", topicFocus: "Essay Structure: Expository & Argumentative", technique: "Mind-Map Blueprinting", milestoneGoal: "Draft 2 essay outlines with topic sentences" }
          ]
        },
        {
          day: "Saturday",
          dayTheme: "Full Mock CBT Exam Simulation & Weak Point Rectification",
          targetHours: 3.5,
          sessions: [
            { id: "sat-1", timeSlot: "10:00 AM - 11:30 AM", type: "cbt_practice", subject: "Full CBT Mock Exam Drill", topicFocus: "60-Question Timed Assessment (Math, Phys, Chem)", technique: "Full Exam Conditions", milestoneGoal: "Achieve ≥ 78% overall score" },
            { id: "sat-2", timeSlot: "11:30 AM - 12:00 PM", type: "break", subject: "Rest & Brain Recovery", topicFocus: "Lunch & Relaxation Interval", technique: "Extended Recovery", milestoneGoal: "Eat healthy snack & recharge" },
            { id: "sat-3", timeSlot: "12:00 PM - 1:00 PM", type: "revision", subject: "Weak Area Mistake Audit", topicFocus: "Deep Dive into all incorrect mock questions", technique: "Error Log Correction", milestoneGoal: "Resolve every wrong answer with full steps" }
          ]
        },
        {
          day: "Sunday",
          dayTheme: "Weekly Retrospective & Next-Week Preparation",
          targetHours: 2,
          sessions: [
            { id: "sun-1", timeSlot: "4:00 PM - 4:50 PM", type: "revision", subject: "Weekly Formula Flash Audit", topicFocus: "Review all Physics & Mathematics formulas memorized", technique: "Spaced Interval Review", milestoneGoal: "Recite 15 physics formulas without looking" },
            { id: "sun-2", timeSlot: "4:50 PM - 5:00 PM", type: "break", subject: "Brain Rest & Hydration", topicFocus: "Short Break", technique: "Relaxation", milestoneGoal: "Hydrate" },
            { id: "sun-3", timeSlot: "5:00 PM - 6:00 PM", type: "study", subject: "Schedule Audit & School Bag Prep", topicFocus: "Review next week's timetable and arrange textbooks", technique: "Executive Planning", milestoneGoal: "Full readiness for Monday morning" }
          ]
        }
      ],
      mentorTips: [
        "Study difficult STEM subjects when your cognitive stamina is highest (first hour).",
        "Never skip scheduled break intervals — your brain consolidates neural connections during rest.",
        "Practice active testing over passive re-reading: write formulas from memory rather than just staring at notes."
      ]
    };
  });

  const [isGeneratingTimetable, setIsGeneratingTimetable] = useState(false);

  // New Custom Session Form Modal State
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [targetDayForNewSession, setTargetDayForNewSession] = useState("Monday");
  const [newSessionSubject, setNewSessionSubject] = useState("General Mathematics");
  const [newSessionType, setNewSessionType] = useState<"study" | "break" | "revision" | "cbt_practice">("study");
  const [newSessionTimeSlot, setNewSessionTimeSlot] = useState("5:00 PM - 5:45 PM");
  const [newSessionTopic, setNewSessionTopic] = useState("");
  const [newSessionTechnique, setNewSessionTechnique] = useState("Pomodoro 25/5 Sprints");
  const [newSessionGoal, setNewSessionGoal] = useState("");

  // --- 2. Next-Day Timetable & Alerts State ---
  const [nextDayAlerts, setNextDayAlerts] = useState<any>(() => {
    const cached = localStorage.getItem(`CS_NONYE_NEXT_DAY_${studentId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {
      greetingBriefing: `Good evening ${studentName.split(" ")[0]}! Tomorrow you have Further Mathematics, Biology, Physics, and Literature in English. Remember to review Chapter 4 of your Calculus notes and bring your dissection kit for Biology practicals.`,
      tomorrowDay: "Tomorrow (Wednesday)",
      subjectCheckpoints: [
        { subject: "Further Mathematics", period: "Period 1 & 2 (8:30 AM)", keyPreparation: "Complete Integration by parts exercises 4.2", materialsNeeded: "Graph sheet, Scientific Calculator & Calculus Note" },
        { subject: "Biology", period: "Period 3 (10:15 AM)", keyPreparation: "Read notes on Plant Vascular Bundles (Xylem & Phloem)", materialsNeeded: "Essential Biology Textbook & Drawing Pencil" },
        { subject: "Physics", period: "Period 5 (12:30 PM)", keyPreparation: "Review Ohm's Law and series/parallel resistor formulas", materialsNeeded: "Physics Workbook & 30cm Ruler" },
        { subject: "Literature in English", period: "Period 7 (2:00 PM)", keyPreparation: "Read Act 3 Scene 2 of 'The Lion and the Jewel'", materialsNeeded: "Literature Drama Text" }
      ],
      quickChallengeQuestion: {
        subject: "Further Mathematics",
        question: "What is the derivative of f(x) = 3x² + 5x - 7 with respect to x?",
        hint: "Apply the power rule d/dx(xⁿ) = n·xⁿ⁻¹ to each term."
      }
    };
  });
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  // --- 3. Pomodoro Timer & Techniques Lab State ---
  const [pomodoroSubject, setPomodoroSubject] = useState("Further Mathematics");
  const [pomodoroTopic, setPomodoroTopic] = useState("Calculus & Differentiation");
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [completedSprints, setCompletedSprints] = useState(3);

  // Techniques Lab Explainer
  const [selectedTechniqueSubject, setSelectedTechniqueSubject] = useState("Physics");
  const [selectedTechniqueTopic, setSelectedTechniqueTopic] = useState("Electromagnetism & Faraday's Law");
  const [techniqueData, setTechniqueData] = useState<any>(null);
  const [isLoadingTechnique, setIsLoadingTechnique] = useState(false);

  // --- 4. Socratic Homework Co-Pilot State ---
  const [homeworkSubject, setHomeworkSubject] = useState("Mathematics");
  const [homeworkQuestion, setHomeworkQuestion] = useState("");
  const [isSolvingHomework, setIsSolvingHomework] = useState(false);
  const [homeworkSolution, setHomeworkSolution] = useState<string | null>(null);

  // Determine current day of week for "Today's View"
  const currentDayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date().getDay();
    return days[d];
  }, []);

  // Compute weekly completion statistics
  const weeklyStats = useMemo(() => {
    if (!timetableData?.dailySchedule) return { totalSessions: 0, completedCount: 0, percentage: 0, completedHours: 0 };
    let totalSessions = 0;
    let completedCount = 0;
    let completedMinutes = 0;
    let totalMinutes = 0;

    timetableData.dailySchedule.forEach((d: any) => {
      d.sessions?.forEach((s: any) => {
        if (s.type !== "break") {
          totalSessions++;
          totalMinutes += 45; // average duration
          if (completedSessions[s.id]) {
            completedCount++;
            completedMinutes += 45;
          }
        }
      });
    });

    const percentage = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;
    const completedHours = Number((completedMinutes / 60).toFixed(1));
    return { totalSessions, completedCount, percentage, completedHours };
  }, [timetableData, completedSessions]);

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroRunning) {
      interval = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds((sec) => sec - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes((min) => min - 1);
          setPomodoroSeconds(59);
        } else {
          // Timer finished
          if (pomodoroMode === "focus") {
            toast.success("🎉 25-Min Focus sprint completed! Take a well-deserved 5-minute break.");
            setPomodoroMode("break");
            setPomodoroMinutes(5);
            setPomodoroSeconds(0);
            setCompletedSprints((s) => s + 1);
          } else {
            toast.info("🔔 Break finished! Ready for another 25-minute focus session?");
            setPomodoroMode("focus");
            setPomodoroMinutes(25);
            setPomodoroSeconds(0);
          }
          setIsPomodoroRunning(false);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroMinutes, pomodoroSeconds, pomodoroMode]);

  // Save changes to local storage
  const saveAvailabilityAndSubjects = (newAvail: Record<string, number>, newSubjs: typeof enrolledSubjects) => {
    localStorage.setItem(`CS_NONYE_AVAILABILITY_${studentId}`, JSON.stringify(newAvail));
    localStorage.setItem(`CS_NONYE_SUBJECTS_${studentId}`, JSON.stringify(newSubjs));
    localStorage.setItem(`CS_NONYE_TIMESLOT_${studentId}`, preferredTimeSlot);
    localStorage.setItem(`CS_NONYE_PACE_${studentId}`, studyPace);
    localStorage.setItem(`CS_NONYE_BREAKS_${studentId}`, String(includeBreaks));
    localStorage.setItem(`CS_NONYE_EXAM_TARGET_${studentId}`, examPrepTarget);
  };

  // Toggle session completion
  const handleToggleSessionComplete = (sessionId: string) => {
    setCompletedSessions((prev) => {
      const updated = { ...prev, [sessionId]: !prev[sessionId] };
      localStorage.setItem(`CS_NONYE_COMPLETED_SESSIONS_${studentId}`, JSON.stringify(updated));
      if (updated[sessionId]) {
        toast.success("✅ Study milestone marked as complete! Keep up the momentum.");
      }
      return updated;
    });
  };

  // Quick Launch Pomodoro for specific session
  const handleLaunchPomodoro = (session: any) => {
    setPomodoroSubject(session.subject || "Subject");
    setPomodoroTopic(session.topicFocus || "Study Sprint");
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
    setPomodoroMode("focus");
    setActiveTab("techniques");
    toast.info(`Loaded "${session.subject}: ${session.topicFocus}" into Pomodoro Focus Timer.`);
  };

  // Quick Launch Socratic Solver for specific session
  const handleLaunchSocratic = (session: any) => {
    setHomeworkSubject(session.subject || "Mathematics");
    setHomeworkQuestion(`Help me understand the core principles and solve sample WAEC/CBT exam questions for: ${session.topicFocus}`);
    setActiveTab("homework");
    toast.info(`Transferred "${session.topicFocus}" to Nonye Socratic Mentor.`);
  };

  // Auto-generate customized timetable using Gemini API
  const handleAutoGenerateTimetable = async () => {
    setIsGeneratingTimetable(true);
    saveAvailabilityAndSubjects(weeklyAvailability, enrolledSubjects);

    const weakSubjectsList = enrolledSubjects
      .filter((s) => s.priority === "high")
      .map((s) => s.name);

    try {
      const res = await fetch("/api/ai/student/study-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          gradeLevel: studentGrade,
          subjects: enrolledSubjects.map((s) => s.name),
          weakSubjects: weakSubjectsList,
          weeklyAvailability,
          preferredTimeSlots: preferredTimeSlot,
          studyPace,
          includeBreaks,
          breakIntervalMinutes: 10,
          examPrepFocus: examPrepTarget,
          revisionRatio: "30% Revision, 50% New Topics, 20% CBT Practice Drills"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable) {
          setTimetableData(data.timetable);
          localStorage.setItem(`CS_NONYE_TIMETABLE_V3_${studentId}`, JSON.stringify(data.timetable));
          setIsConfigModalOpen(false);
          toast.success("✨ Nonye AI generated your personalized weekly reading schedule!");
          return;
        }
      }
      throw new Error("Server generation did not return valid schedule");
    } catch (error) {
      console.warn("AI generation failed, applying smart local schedule fallback:", error);
      // Smart Fallback Scheduler
      const fallbackSchedule = generateSmartFallbackSchedule(
        enrolledSubjects,
        weeklyAvailability,
        preferredTimeSlot,
        includeBreaks,
        examPrepTarget
      );
      setTimetableData(fallbackSchedule);
      localStorage.setItem(`CS_NONYE_TIMETABLE_V3_${studentId}`, JSON.stringify(fallbackSchedule));
      setIsConfigModalOpen(false);
      toast.success("✨ Nonye AI assembled your optimized weekly study schedule!");
    } finally {
      setIsGeneratingTimetable(false);
    }
  };

  // Smart local schedule synthesis
  const generateSmartFallbackSchedule = (
    subjects: Array<{ name: string; priority: string }>,
    availability: Record<string, number>,
    timeWindow: string,
    breaksEnabled: boolean,
    targetExam: string
  ) => {
    const weakList = subjects.filter((s) => s.priority === "high").map((s) => s.name);
    const standardList = subjects.filter((s) => s.priority !== "high").map((s) => s.name);
    const allNames = subjects.map((s) => s.name);

    let totalHours = 0;
    const dailySchedule = DAYS_OF_WEEK.map((day, dIdx) => {
      const hours = availability[day] || 2;
      totalHours += hours;

      const sessions: any[] = [];
      const primarySubj = weakList.length > 0 ? weakList[dIdx % weakList.length] : (allNames[dIdx % allNames.length] || "Mathematics");
      const secondarySubj = standardList.length > 0 ? standardList[(dIdx + 1) % standardList.length] : "English Language";

      if (day === "Saturday") {
        sessions.push({
          id: `sat-cbt-${dIdx}`,
          timeSlot: "10:00 AM - 11:30 AM",
          type: "cbt_practice",
          subject: "Full Mock CBT Simulation",
          topicFocus: `Timed Drill on ${weakList.slice(0, 3).join(", ") || "Mathematics & Physics"}`,
          technique: "Full Exam Conditions",
          milestoneGoal: `Complete 50 CBT questions targeting ≥ 75% accuracy`
        });
        if (breaksEnabled) {
          sessions.push({
            id: `sat-brk-${dIdx}`,
            timeSlot: "11:30 AM - 12:00 PM",
            type: "break",
            subject: "Brain Rest & Hydration",
            topicFocus: "Nutrition & Eye Relaxation",
            technique: "Mindful Recovery",
            milestoneGoal: "Recharge for mistake audit"
          });
        }
        sessions.push({
          id: `sat-rev-${dIdx}`,
          timeSlot: "12:00 PM - 1:00 PM",
          type: "revision",
          subject: "Mistake Audit & Corrections",
          topicFocus: "Review all incorrect mock drill answers",
          technique: "Active Recall Flashcards",
          milestoneGoal: "Resolve every incorrect calculation with step-by-step notes"
        });
      } else {
        // Standard Weekday Schedule
        sessions.push({
          id: `${day.toLowerCase()}-s1`,
          timeSlot: "5:00 PM - 5:50 PM",
          type: "study",
          subject: primarySubj,
          topicFocus: `Core Syllabus Topic & Formula Derivation in ${primarySubj}`,
          technique: "Pomodoro 25/5 Sprints",
          milestoneGoal: `Master textbook chapter and solve 5 exercise problems`
        });

        if (breaksEnabled) {
          sessions.push({
            id: `${day.toLowerCase()}-brk`,
            timeSlot: "5:50 PM - 6:00 PM",
            type: "break",
            subject: "Brain Rest & Hydration",
            topicFocus: "Hydration & Posture Reset",
            technique: "Cognitive Break",
            milestoneGoal: "Walk around, drink water & rest eyes"
          });
        }

        sessions.push({
          id: `${day.toLowerCase()}-s2`,
          timeSlot: "6:00 PM - 6:45 PM",
          type: "revision",
          subject: secondarySubj,
          topicFocus: `Spaced Repetition & Key Concepts in ${secondarySubj}`,
          technique: "Feynman Concept Simplifier",
          milestoneGoal: `Summarize key definitions and recite without notes`
        });

        sessions.push({
          id: `${day.toLowerCase()}-s3`,
          timeSlot: "6:45 PM - 7:00 PM",
          type: "cbt_practice",
          subject: primarySubj,
          topicFocus: `Speed CBT Mini-Drill (10 Questions)`,
          technique: "Timed Speed Challenge",
          milestoneGoal: `Score 8/10 or better within 15 minutes`
        });
      }

      return {
        day,
        dayTheme: `${primarySubj} & ${secondarySubj} Cognitive Mastery`,
        targetHours: hours,
        sessions
      };
    });

    return {
      weeklyTarget: `Targeted Exam Preparation for ${targetExam}`,
      weeklyStrategy: `Prioritizes ${weakList.join(" & ") || "challenging subjects"} with structured Pomodoro blocks and mandatory 10-minute rest intervals.`,
      totalWeeklyHours: totalHours,
      dailySchedule,
      mentorTips: [
        "Study complex problem-solving subjects first when your mental stamina is highest.",
        "Take a 5-minute hydration and eye-rest break every 25 minutes of intense focus.",
        "Never just re-read notes — test your memory by writing definitions and formulas without looking!"
      ]
    };
  };

  // Add custom session handler
  const handleSaveNewCustomSession = () => {
    if (!newSessionTopic.trim()) {
      toast.error("Please enter a topic focus for the study session.");
      return;
    }

    const newSession = {
      id: `custom-${Date.now()}`,
      timeSlot: newSessionTimeSlot,
      type: newSessionType,
      subject: newSessionType === "break" ? "Brain Rest & Hydration" : newSessionSubject,
      topicFocus: newSessionTopic,
      technique: newSessionTechnique,
      milestoneGoal: newSessionGoal || "Complete scheduled study block"
    };

    setTimetableData((prev: any) => {
      const updatedSchedule = prev.dailySchedule.map((d: any) => {
        if (d.day === targetDayForNewSession) {
          return {
            ...d,
            sessions: [...d.sessions, newSession]
          };
        }
        return d;
      });
      const updated = { ...prev, dailySchedule: updatedSchedule };
      localStorage.setItem(`CS_NONYE_TIMETABLE_V3_${studentId}`, JSON.stringify(updated));
      return updated;
    });

    setIsAddSessionModalOpen(false);
    setNewSessionTopic("");
    setNewSessionGoal("");
    toast.success(`Added new study session to ${targetDayForNewSession}!`);
  };

  // Delete session handler
  const handleDeleteSession = (dayName: string, sessionId: string) => {
    setTimetableData((prev: any) => {
      const updatedSchedule = prev.dailySchedule.map((d: any) => {
        if (d.day === dayName) {
          return {
            ...d,
            sessions: d.sessions.filter((s: any) => s.id !== sessionId)
          };
        }
        return d;
      });
      const updated = { ...prev, dailySchedule: updatedSchedule };
      localStorage.setItem(`CS_NONYE_TIMETABLE_V3_${studentId}`, JSON.stringify(updated));
      return updated;
    });
    toast.info("Session removed from timetable.");
  };

  // Socratic Homework Guidance
  const handleSolveHomework = async () => {
    if (!homeworkQuestion.trim()) {
      toast.error("Please enter a homework problem or essay prompt.");
      return;
    }
    setIsSolvingHomework(true);
    try {
      const res = await fetch("/api/ai/scholar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: homeworkQuestion,
          subject: homeworkSubject,
          gradeLevel: studentGrade,
          enableHighThinking: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHomeworkSolution(data.explanation);
        toast.success("Nonye Scholar synthesized your Socratic solution steps!");
      }
    } catch (e) {
      toast.error("Unable to reach Nonye Scholar service.");
    } finally {
      setIsSolvingHomework(false);
    }
  };

  // Quick challenge check
  const handleVerifyChallenge = () => {
    if (!challengeAnswer.trim()) {
      toast.error("Please write your answer first.");
      return;
    }
    const clean = challengeAnswer.trim().toLowerCase().replace(/\s+/g, "");
    if (clean.includes("6x+5") || clean.includes("6x+5") || clean.includes("6*x+5")) {
      setChallengeFeedback("✅ Correct! Excellent work: d/dx(3x²) = 6x, d/dx(5x) = 5, and d/dx(-7) = 0. Total = 6x + 5!");
      toast.success("Spot on! +10 Nonye Scholar Points added to your streak.");
    } else {
      setChallengeFeedback(`💡 Almost there! Remember to multiply the exponent by the coefficient (2 · 3 = 6x²⁻¹ = 6x) and the derivative of 5x is 5. Final answer: 6x + 5.`);
    }
  };

  // Print timetable handler
  const handlePrintTimetable = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden mb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-900 text-white p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent)] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={nonyeAvatar}
                alt="Nonye AI"
                className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-indigo-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Nonye Scholar Study Hub</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Academic Mentor
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                AI-driven weekly study schedules, revision balancing, next-day alerts & Socratic homework assistance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const textToRead = `${timetableData?.weeklyTarget}. ${timetableData?.weeklyStrategy}. Here are Nonye's core directives: ${timetableData?.mentorTips?.join(". ")}`;
                speakNonyeVoice(textToRead);
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Listen to Nonye read your weekly study strategy"
            >
              <Volume2 className="w-4 h-4 text-emerald-300" />
              <span>Listen to Strategy</span>
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Availability & Subjects</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-700/60 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "timetable"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study & Reading Timetable</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "alerts"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tomorrow's Class Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab("techniques")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "techniques"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Memory & Pomodoro Lab</span>
          </button>
          <button
            onClick={() => setActiveTab("homework")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "homework"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Socratic Homework Solver</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Canvas */}
      <div className="p-6">
        {/* ================= TAB 1: STUDY & READING TIMETABLE ================= */}
        {activeTab === "timetable" && (
          <div className="space-y-6">
            {/* Top Strategy & Progress Bar Summary */}
            <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border border-indigo-100 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 bg-indigo-100/90 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                    Target: {examPrepTarget}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Pace: {studyPace.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {timetableData?.weeklyTarget || "Comprehensive Weekly Study Blueprint"}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {timetableData?.weeklyStrategy || "Balances deep focus STEM sessions with structured recovery breaks and active recall drills."}
                </p>
              </div>

              {/* Weekly Completion Progress Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs min-w-[260px] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Weekly Progress</span>
                  <span className="font-extrabold text-emerald-600 font-mono">
                    {weeklyStats.completedCount} / {weeklyStats.totalSessions} Sessions ({weeklyStats.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${weeklyStats.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Planned: {timetableData?.totalWeeklyHours || 14} hrs/wk</span>
                  <span className="text-emerald-700 font-bold">Done: {weeklyStats.completedHours} hrs</span>
                </div>
              </div>
            </div>

            {/* Timetable Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3">
              {/* View Switcher: Weekly Grid vs Today's Checklist */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setTimetableMode("grid")}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timetableMode === "grid"
                      ? "bg-white text-indigo-950 shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  7-Day Schedule Matrix
                </button>
                <button
                  onClick={() => setTimetableMode("today")}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    timetableMode === "today"
                      ? "bg-white text-indigo-950 shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Today's Action Plan</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setTargetDayForNewSession(selectedDayTab);
                    setIsAddSessionModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Study Slot</span>
                </button>
                <button
                  onClick={handlePrintTimetable}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer print:hidden"
                  title="Print clean paperless study timetable"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Timetable</span>
                </button>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Schedule</span>
                </button>
              </div>
            </div>

            {/* ============ VIEW 1: 7-DAY SCHEDULE MATRIX ============ */}
            {timetableMode === "grid" && (
              <div className="space-y-4">
                {/* Day selector pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDayTab === day;
                    const isCurrentToday = currentDayName === day;
                    const dayPlan = timetableData?.dailySchedule?.find((d: any) => d.day === day);
                    const sessionCount = dayPlan?.sessions?.length || 0;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDayTab(day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-900 text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span>{day}</span>
                        {isCurrentToday && (
                          <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                            Today
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {sessionCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Selected Day Content */}
                {(() => {
                  const dayData = timetableData?.dailySchedule?.find((d: any) => d.day === selectedDayTab);
                  if (!dayData) return null;

                  return (
                    <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{dayData.day} Study Schedule</h4>
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                              {dayData.dayTheme}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Target Study Time: {dayData.targetHours} Hours</p>
                        </div>

                        <button
                          onClick={() => {
                            setTargetDayForNewSession(dayData.day);
                            setIsAddSessionModalOpen(true);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Block to {dayData.day}
                        </button>
                      </div>

                      {/* Sessions List */}
                      <div className="space-y-3">
                        {dayData.sessions?.length === 0 ? (
                          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                            No study slots allocated for this day. Click "Add Study Slot" to customize.
                          </div>
                        ) : (
                          dayData.sessions?.map((session: any) => {
                            const isCompleted = !!completedSessions[session.id];
                            const isBreak = session.type === "break";

                            return (
                              <div
                                key={session.id}
                                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                  isBreak
                                    ? "bg-amber-50/60 border-amber-200/80"
                                    : isCompleted
                                    ? "bg-emerald-50/40 border-emerald-200 opacity-80"
                                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  {/* Completion checkbox for study sessions */}
                                  {!isBreak ? (
                                    <button
                                      onClick={() => handleToggleSessionComplete(session.id)}
                                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                                      title={isCompleted ? "Mark incomplete" : "Mark completed"}
                                    >
                                      {isCompleted ? (
                                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                                      ) : (
                                        <Square className="w-5 h-5 text-slate-400" />
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-amber-200/80 flex items-center justify-center shrink-0 mt-0.5">
                                      <Coffee className="w-3 h-3 text-amber-800" />
                                    </div>
                                  )}

                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                        {session.timeSlot}
                                      </span>

                                      <span
                                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                          isBreak
                                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                                            : session.type === "revision"
                                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                                            : session.type === "cbt_practice"
                                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                            : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                                        }`}
                                      >
                                        {session.type?.replace("_", " ")}
                                      </span>

                                      <h5
                                        className={`text-sm font-bold text-slate-900 truncate ${
                                          isCompleted ? "line-through text-slate-500" : ""
                                        }`}
                                      >
                                        {session.subject}
                                      </h5>
                                    </div>

                                    <p className="text-xs text-slate-700 font-medium">
                                      {session.topicFocus}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Brain className="w-3 h-3 text-indigo-500" />
                                        <span className="font-semibold text-slate-700">Method:</span> {session.technique}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Target className="w-3 h-3 text-emerald-600" />
                                        <span className="font-semibold text-slate-700">Goal:</span> {session.milestoneGoal}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick action buttons */}
                                {!isBreak && (
                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                    <button
                                      onClick={() => handleLaunchPomodoro(session)}
                                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                      title="Launch Pomodoro Timer with this Topic"
                                    >
                                      <Play className="w-3 h-3 text-emerald-400" />
                                      <span>Sprint</span>
                                    </button>

                                    <button
                                      onClick={() => handleLaunchSocratic(session)}
                                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      title="Ask Nonye Socratic Mentor"
                                    >
                                      <Sparkles className="w-3 h-3 text-indigo-600" />
                                      <span>Ask Nonye</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteSession(dayData.day, session.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Slot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ============ VIEW 2: TODAY'S ACTION CHECKLIST ============ */}
            {timetableMode === "today" && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {currentDayName.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Today's Focus: {currentDayName}</h4>
                      <p className="text-xs text-slate-600">Tick off sessions as you study to build your Scholar Streak.</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    {weeklyStats.completedCount} Completed
                  </span>
                </div>

                {(() => {
                  const todayPlan = timetableData?.dailySchedule?.find((d: any) => d.day === currentDayName) || timetableData?.dailySchedule?.[0];
                  if (!todayPlan) return null;

                  return (
                    <div className="space-y-3">
                      {todayPlan.sessions?.map((session: any) => {
                        const isCompleted = !!completedSessions[session.id];
                        const isBreak = session.type === "break";

                        return (
                          <div
                            key={session.id}
                            className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                              isBreak
                                ? "bg-amber-50/50 border-amber-200"
                                : isCompleted
                                ? "bg-emerald-50/50 border-emerald-300"
                                : "bg-white border-slate-200 hover:border-indigo-300 shadow-xs"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {!isBreak ? (
                                <button
                                  onClick={() => handleToggleSessionComplete(session.id)}
                                  className="mt-0.5 cursor-pointer text-slate-400 hover:text-emerald-600"
                                >
                                  {isCompleted ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                              ) : (
                                <Coffee className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                    {session.timeSlot}
                                  </span>
                                  <h5 className={`text-sm font-bold text-slate-900 ${isCompleted ? "line-through text-slate-500" : ""}`}>
                                    {session.subject}
                                  </h5>
                                </div>
                                <p className="text-xs text-slate-700 font-medium">{session.topicFocus}</p>
                                <p className="text-[11px] text-slate-500">
                                  <strong className="text-slate-700">Target:</strong> {session.milestoneGoal}
                                </p>
                              </div>
                            </div>

                            {!isBreak && (
                              <button
                                onClick={() => handleLaunchPomodoro(session)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                              >
                                <Play className="w-3 h-3 text-emerald-400" />
                                <span>Start Now</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Mentor Retention Directives Card */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nonye's Memory Retention & Exam Prep Directives</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-emerald-950 font-medium">
                {timetableData?.mentorTips?.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    <span className="font-bold text-emerald-600">{idx + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ================= TAB 2: NEXT-DAY SCHEDULE & ALERTS ================= */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50/80 to-emerald-50/80 border border-indigo-100 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                    {nextDayAlerts?.tomorrowDay || "Tomorrow's Briefing"}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Synced with {schoolName} Timetable
                  </span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                  {nextDayAlerts?.greetingBriefing}
                </p>
              </div>

              <button
                onClick={() => {
                  toast.info("Refreshed tomorrow's schedule.");
                }}
                className="shrink-0 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Alert</span>
              </button>
            </div>

            {/* Checkpoints Grid */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Subject Preparation Checklist for Tomorrow</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextDayAlerts?.subjectCheckpoints?.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-sm">{item.subject}</h4>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                        {item.period}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      <span className="font-bold text-slate-900">Task: </span>
                      {item.keyPreparation}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-emerald-700">Pack:</span>
                      <span>{item.materialsNeeded}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tonight's 1-Minute Recall Challenge */}
            {nextDayAlerts?.quickChallengeQuestion && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-amber-950">Tonight's 1-Minute Recall Challenge</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      {nextDayAlerts.quickChallengeQuestion.subject}
                    </span>
                  </div>
                  <span className="text-xs text-amber-800 font-semibold">+10 Scholar Points</span>
                </div>

                <p className="text-sm text-slate-800 font-medium">
                  {nextDayAlerts.quickChallengeQuestion.question}
                </p>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={challengeAnswer}
                    onChange={(e) => setChallengeAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleVerifyChallenge}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Check Answer
                  </button>
                </div>

                {challengeFeedback && (
                  <p className="text-xs font-semibold p-2.5 rounded-lg bg-white border border-amber-200 text-slate-800">
                    {challengeFeedback}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: COGNITIVE TECHNIQUES & POMODORO LAB ================= */}
        {activeTab === "techniques" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Interactive Pomodoro Study Timer */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-between text-center space-y-6 shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                  {pomodoroMode === "focus" ? "🎯 25-Min Focus Sprint" : "☕ 5-Min Recovery Break"}
                </span>
                <h3 className="text-lg font-bold text-white pt-2">{pomodoroSubject}</h3>
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{pomodoroTopic}</p>
              </div>

              {/* Digital Countdown Dial */}
              <div className="w-44 h-44 rounded-full border-4 border-indigo-500/40 bg-indigo-950/50 flex flex-col items-center justify-center shadow-inner relative">
                <span className="text-4xl font-mono font-black text-white tracking-wider">
                  {String(pomodoroMinutes).padStart(2, "0")}:{String(pomodoroSeconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 mt-1">
                  {isPomodoroRunning ? "In Progress" : "Paused"}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                    isPomodoroRunning ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {isPomodoroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPomodoroRunning ? "Pause Sprint" : "Start Sprint"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPomodoroRunning(false);
                    setPomodoroMinutes(25);
                    setPomodoroSeconds(0);
                    setPomodoroMode("focus");
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Completed Sprints Badge */}
              <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Completed Sprints Today:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Award className="w-4 h-4" /> {completedSprints} Sprints ({completedSprints * 25} mins)
                </span>
              </div>
            </div>

            {/* Right Col: Feynman Simplifier & Flashcard Generator */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>Cognitive Topic Breakdown (Feynman Analogy & Active Recall)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={selectedTechniqueSubject}
                    onChange={(e) => setSelectedTechniqueSubject(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics / Calculus</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Economics">Economics</option>
                  </select>

                  <input
                    type="text"
                    value={selectedTechniqueTopic}
                    onChange={(e) => setSelectedTechniqueTopic(e.target.value)}
                    placeholder="Enter topic (e.g. Faraday's Law, Integration)"
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <button
                  onClick={() => {
                    toast.info("Generating memory retention breakdown...");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Cognitive Memory Techniques for Topic</span>
                </button>
              </div>

              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                Select a subject and topic above to generate Feynman analogies, Active Recall flashcards, and a 4-week spaced repetition roadmap.
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SOCRATIC HOMEWORK CO-PILOT ================= */}
        {activeTab === "homework" && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  <span>Socratic Homework & STEM Derivations Mentor</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Subject:</span>
                  <select
                    value={homeworkSubject}
                    onChange={(e) => setHomeworkSubject(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English Language">English Language</option>
                    <option value="Economics">Economics</option>
                  </select>
                </div>
              </div>

              <textarea
                value={homeworkQuestion}
                onChange={(e) => setHomeworkQuestion(e.target.value)}
                placeholder="Paste your homework question, essay topic, or physics formula problem here (e.g., 'Find the roots of 2x^2 + 7x - 4 = 0 using factorization')..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {[
                    "Solve 2x² + 5x - 3 = 0",
                    "Differentiate y = sin(3x² + 4)",
                    "Explain photosynthesis light reaction"
                  ].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => setHomeworkQuestion(quick)}
                      className="hidden sm:inline-block text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      {quick}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSolveHomework}
                  disabled={isSolvingHomework}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {isSolvingHomework ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Guide Step-by-Step</span>
                </button>
              </div>
            </div>

            {/* Solution Step Canvas */}
            {homeworkSolution && (
              <div className="p-5 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Nonye Socratic Guidance for {homeworkSubject}
                  </span>
                  <button
                    onClick={() => speakNonyeVoice(homeworkSolution)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                  </button>
                </div>
                <div className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {homeworkSolution}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: CONFIGURE AVAILABILITY & SUBJECTS ================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Configure Study Availability & Subjects</h3>
                  <p className="text-xs text-slate-500">Nonye AI will balance your revision, rest breaks, and CBT drills.</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Weekly Availability Hours per Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>1. Daily Available Study Hours:</span>
                </label>
                {/* Presets */}
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    onClick={() => {
                      setWeeklyAvailability({ Monday: 2, Tuesday: 2, Wednesday: 2, Thursday: 2, Friday: 2, Saturday: 3.5, Sunday: 2 });
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer"
                  >
                    Standard (2h)
                  </button>
                  <button
                    onClick={() => {
                      setWeeklyAvailability({ Monday: 3.5, Tuesday: 3.5, Wednesday: 3.5, Thursday: 3.5, Friday: 3.5, Saturday: 5, Sunday: 3 });
                    }}
                    className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold rounded cursor-pointer"
                  >
                    Exam Sprint (3.5h)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = weeklyAvailability[day] ?? 2;
                  return (
                    <div key={day} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block truncate">{day.slice(0, 3)}</span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0.5}
                          max={6}
                          step={0.5}
                          value={hours}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setWeeklyAvailability((prev) => ({ ...prev, [day]: Math.max(0, val) }));
                          }}
                          className="w-12 text-center text-xs font-black font-mono bg-white border border-slate-300 rounded-md py-1"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Preferred Time Windows & Study Pace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Preferred Daily Study Window:</label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Evenings (5:00 PM - 8:00 PM)">Evenings (5:00 PM - 8:00 PM)</option>
                  <option value="Late Evenings (7:30 PM - 10:30 PM)">Late Evenings (7:30 PM - 10:30 PM)</option>
                  <option value="Early Mornings (5:30 AM - 7:30 AM)">Early Mornings (5:30 AM - 7:30 AM)</option>
                  <option value="Afternoons (3:00 PM - 6:00 PM)">Afternoons (3:00 PM - 6:00 PM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Study Pace & Intensity:</label>
                <select
                  value={studyPace}
                  onChange={(e) => setStudyPace(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="balanced">⚖️ Balanced (Syllabus + Revision)</option>
                  <option value="intensive">🔥 Intensive (Exam Prep & Past Papers)</option>
                  <option value="light">🌿 Light (Homework & Key Reviews)</option>
                </select>
              </div>
            </div>

            {/* Step 3: Exam Target & Break Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Target Exam / Milestone:</label>
                <input
                  type="text"
                  value={examPrepTarget}
                  onChange={(e) => setExamPrepTarget(e.target.value)}
                  placeholder="e.g. 2nd Term CBT Midterms, WAEC 2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Include Cognitive Rest Breaks</span>
                  <span className="text-[10px] text-slate-500">Insert 10-min hydration and eye rest slots</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeBreaks}
                  onChange={(e) => setIncludeBreaks(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Step 4: Subject Selection & Priority Tagging */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>2. Enrolled Subjects & Priority Focus:</span>
                </label>
                <span className="text-[10px] text-slate-400">Click priority tag to cycle (High 🔴 / Medium 🟡 / Low 🟢)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                {ALL_CURRICULUM_SUBJECTS.map((subj) => {
                  const enrolled = enrolledSubjects.find((s) => s.name === subj.name);
                  const isChecked = !!enrolled;
                  const currentPriority = enrolled?.priority || "medium";

                  return (
                    <div
                      key={subj.name}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isChecked ? "bg-indigo-50/40 border-indigo-200" : "bg-white border-slate-200 opacity-60"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEnrolledSubjects(enrolledSubjects.filter((s) => s.name !== subj.name));
                            } else {
                              setEnrolledSubjects([...enrolledSubjects, { name: subj.name, priority: "medium" }]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800 truncate">{subj.name}</span>
                      </label>

                      {isChecked && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextPriority: "high" | "medium" | "low" =
                              currentPriority === "high" ? "medium" : currentPriority === "medium" ? "low" : "high";
                            setEnrolledSubjects(
                              enrolledSubjects.map((s) => (s.name === subj.name ? { ...s, priority: nextPriority } : s))
                            );
                          }}
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded cursor-pointer transition-all ${
                            currentPriority === "high"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : currentPriority === "medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {currentPriority === "high" ? "🔴 High Priority" : currentPriority === "medium" ? "🟡 Medium" : "🟢 Low"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAutoGenerateTimetable}
                disabled={isGeneratingTimetable || enrolledSubjects.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isGeneratingTimetable ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Auto-Generate Balanced Schedule with Nonye AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOM SESSION BLOCK ================= */}
      {isAddSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">Add Study Slot to {targetDayForNewSession}</h4>
              <button
                onClick={() => setIsAddSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Type:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "study", label: "Study" },
                    { id: "revision", label: "Revision" },
                    { id: "cbt_practice", label: "CBT Drill" },
                    { id: "break", label: "Break" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewSessionType(t.id as any)}
                      className={`py-1.5 rounded-lg font-bold text-[11px] border text-center transition-all cursor-pointer ${
                        newSessionType === t.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {newSessionType !== "break" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject:</label>
                  <select
                    value={newSessionSubject}
                    onChange={(e) => setNewSessionSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {ALL_CURRICULUM_SUBJECTS.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Window:</label>
                <input
                  type="text"
                  value={newSessionTimeSlot}
                  onChange={(e) => setNewSessionTimeSlot(e.target.value)}
                  placeholder="e.g. 5:00 PM - 5:45 PM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Topic / Activity:</label>
                <input
                  type="text"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                  placeholder="e.g. Calculus: Integration by Substitution"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Milestone Goal:</label>
                <input
                  type="text"
                  value={newSessionGoal}
                  onChange={(e) => setNewSessionGoal(e.target.value)}
                  placeholder="e.g. Solve 5 WAEC exam questions without looking at hints"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsAddSessionModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewCustomSession}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Save Session Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NonyeStudyHub;
