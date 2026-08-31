import React, { useMemo, useState, useEffect } from "react";
import Navbar from "./Navbar";
import { Button } from "./ui-stubs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap, Receipt, ShieldCheck, FileBarChart, Users, QrCode,
  Mail, MessageCircle, Phone, ArrowRight, CheckCircle2, Sparkles, Lock,
  Download, FileText, BookOpenCheck, Wallet, ChevronRight, ChevronDown, ChevronUp, ExternalLink, HelpCircle
} from "lucide-react";
import { generateSampleReportCard, generateSampleCBT, generateSampleFinance } from "../utils/samplePdfs";
import RoleShowcase from "./RoleShowcase";
import { api } from "../lib/api";

const WHATSAPP_RAW = "2348141880550";

const HERO_IMG = "https://images.unsplash.com/photo-1744809482817-9a9d4fc280af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwc3R1ZGVudCUyMGNsYXNzcm9vbXxlbnwwfHx8fDE3NzgzMTk1NjR8MA&ixlib=rb-4.1.0&q=85";
const TEACHER_IMG = "https://images.unsplash.com/photo-1573496527892-904f897eb744?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwdGVhY2hlciUyMHNtaWxpbmd8ZW58MHx8fHwxNzc4MzE5NTY0fDA&ixlib=rb-4.1.0&q=85";
const PARENT_IMG = "https://images.unsplash.com/photo-1672517939771-15a3f8c49f0b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w7NDk1NzZ8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmF0aGVyJTIwYW5kJTIwZGF1Z2h0ZXIlMjB0YWJsZXR8ZW58MHx8fHwxNzc4MzE5NTY1fDA&ixlib=rb-4.1.0&q=85";

const PRICING = {
  cbt_essentials: { name: "CBT Essentials", desc: "Computer-based testing engine for objective exams. Local cache for unstable connections.", icon: GraduationCap, prices: { "1_term": 40000, "2_terms": 70000, "full_session": 110000 } },
  digital_reports: { name: "Digital Reports", desc: "Automated CA + Exam scoring, 5-star skills, principal e-signature, QR-verified PDFs.", icon: FileBarChart, prices: { "1_term": 50000, "2_terms": 90000, "full_session": 140000 } },
  financial_ledger: { name: "Financial Ledger", desc: "Live fee balances, Stripe + bank transfer reconciliation, instant Debt Lock on Result Checker.", icon: Receipt, prices: { "1_term": 40000, "2_terms": 70000, "full_session": 110000 } },
  unified_enterprise: { name: "Unified Enterprise", desc: "Everything in one — CBT + Reports + Ledger. Best for full-session deployments.", icon: Sparkles, prices: { "full_session": 200000 } },
};

const DURATIONS = [
  { key: "1_term", label: "1 Term" },
  { key: "2_terms", label: "2 Terms" },
  { key: "full_session", label: "Full Session" },
];

const FEATURES = [
  { icon: Users, title: "Bulk Onboarding", text: "Upload an Excel sheet — every student becomes a digital profile in seconds." },
  { icon: FileBarChart, title: "Automated Engine", text: "100-pt CA + Exam → annual averages and promotion logic, computed for you." },
  { icon: Lock, title: "Debt Lock", text: "Outstanding fees? The Result Checker stays locked until the ledger is clear." },
  { icon: QrCode, title: "QR-Verified PDFs", text: "Every result carries a unique scannable QR for authentic, tamper-proof records." },
  { icon: ShieldCheck, title: "Schools Admin Hub", text: "Centralized kill-switch, password overrides, and global lead pipeline." },
  { icon: GraduationCap, title: "Offline-First CBT", text: "Local caching for exams when networks fail — typing never stops." },
];

interface LandingProps {
  onChangeView: (view: 'landing' | 'login' | 'register' | 'app') => void;
  onSetSelectedPlan?: (plan: string, duration: string) => void;
}

export default function LandingPage({ onChangeView, onSetSelectedPlan }: LandingProps) {
  const [duration, setDuration] = useState("full_session");
  const [contact, setContact] = useState({ name: "", email: "", school_name: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll distance for the slide-up toggle arrow immediately on any scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollPos > 10) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    // Check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const faqs = [
    {
      question: "How does the offline CBT Exam Engine handle power or internet outages?",
      answer: "The Corner Streams CBT Engine caches questions locally in the browser storage. If power cuts out or network connectivity drops during an exam, student answers remain saved offline. Once the connection is re-established, responses sync automatically without any loss of progress or examination time.",
      category: "Examinations & CBT"
    },
    {
      question: "Can we import our existing student and teacher records from Excel / CSV?",
      answer: "Yes! Corner Streams includes a multi-template Smart Excel/CSV Bulk Importer. You can upload hundreds of students, teachers, subject rosters, and historical scores in seconds with automatic column matching, duplicate detection, and instant class assignments.",
      category: "Data & Onboarding"
    },
    {
      question: "How are school tuition fees and offline bank transfers reconciled?",
      answer: "Parents can make direct bank transfers or bank branch deposits and submit their receipt reference. The Bursary module tracks pending transactions, alerts the finance officer, and marks tuition clearance upon verification. Instant tamper-proof electronic receipts with QR verification codes are issued immediately.",
      category: "Bursary & Finance"
    },
    {
      question: "How do parents and students check results, and do they need a computer?",
      answer: "Parents and students have dedicated, mobile-friendly portals accessible on any smartphone, tablet, or PC without downloading heavy apps. They can view cumulative termly broadsheets, breakdown grades, teacher remarks, and download tamper-proof PDF report cards with verifiable QR codes.",
      category: "Portals & Report Cards"
    },
    {
      question: "How long does it take to deploy Corner Streams for a school?",
      answer: "Standard school onboarding is completed within 24 to 48 hours. After entering your school profile and uploading your logo, our setup team configures your academic terms, grading systems, and classes so teachers can start scoring immediately.",
      category: "Deployment & Support"
    },
    {
      question: "What devices and hardware are required to run Corner Streams?",
      answer: "Corner Streams runs smoothly on any modern web browser (Google Chrome, Safari, Edge, Firefox) across laptops, desktop PCs, iPads/tablets, and Android/iOS smartphones. No expensive local server hardware or dedicated IT infrastructure is required.",
      category: "Hardware & Tech"
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const openDirectWhatsApp = (customText?: string) => {
    const text = customText || "Hello Corner Streams! I am interested in onboarding our school with your CBT, Broadsheet, and Bursary modules. Could you share more details?";
    const url = `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const tiers = useMemo(
    () => Object.entries(PRICING).map(([key, t]) => {
      const price = (t.prices as any)[duration];
      return { key, ...t, price };
    }),
    [duration]
  );

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name || !contact.email || !contact.school_name) {
      toast.error("Please fill in Name, Email, and School Name.");
      return;
    }
    setSubmitting(true);

    const waMessage = 
      `Hello Corner Streams! 🎓\n\n` +
      `*Name:* ${contact.name}\n` +
      `*School:* ${contact.school_name}\n` +
      `*Email:* ${contact.email}\n` +
      `*Phone:* ${contact.phone || 'Not provided'}\n\n` +
      `*Inquiry / Message:*\n${contact.message || 'I would like to request an institutional onboarding demo and consultation.'}`;

    const waUrl = `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(waMessage)}`;

    try {
      await api.post("/leads", {
        name: contact.name,
        email: contact.email,
        school: contact.school_name,
        phone: contact.phone || "",
        message: contact.message || ""
      });
      toast.success("Inquiry registered! Opening WhatsApp to send your message directly...", { duration: 4000 });
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setContact({ name: "", email: "", school_name: "", phone: "", message: "" });
    } catch (err: any) {
      toast.success("Opening WhatsApp to connect directly with the Corner Streams team!");
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChoosePlan = (key: string) => {
    if (onSetSelectedPlan) {
      onSetSelectedPlan(key, duration);
    }
    onChangeView('register');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white relative pt-16">
      <Navbar currentView="landing" onChangeView={onChangeView} />

      {/* HERO */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24 border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50/30 -z-10" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black tracking-wider bg-indigo-100 text-indigo-950">
              One hub for every school
            </span>
            <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl tracking-tight font-black text-indigo-950 leading-[1.05]">
              Taking away the <span className="text-emerald-500 block sm:inline">paper trap.</span>
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
              Corner Streams is the cloud spine for Nigerian schools &mdash; bulk student onboarding, automated CA + Exam reports,
              QR-verified PDFs, and a financial ledger that actually balances. Built to close the operational loops.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="emerald"
                onClick={() => onChangeView('register')}
                className="w-full sm:w-auto px-8 h-12 text-base font-extrabold flex items-center justify-center gap-2"
              >
                Onboard your school <ArrowRight size={18} />
              </Button>
              <button
                type="button"
                onClick={() => openDirectWhatsApp()}
                className="w-full sm:w-auto px-6 h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-full flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <MessageCircle size={18} />
                <span>Chat on WhatsApp</span>
              </button>
              <Button
                variant="outline"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 h-12 text-base font-bold text-indigo-950"
              >
                See pricing
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> No paper. No queues.</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> WAEC grading models.</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> POS sync + Bank reconcile.</div>
            </div>
          </motion.div>
          
          <div className="relative mt-8 lg:mt-0">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/10 rounded-2xl rotate-6" />
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-indigo-500/10 rounded-2xl -rotate-3" />
            <img
              src={HERO_IMG}
              alt="Nigerian classroom"
              className="relative rounded-2xl shadow-xl border border-slate-200/80 object-cover w-full h-[260px] sm:h-[360px] md:h-[440px]"
            />
            <div className="absolute -bottom-3 left-4 sm:left-6 bg-white rounded-xl shadow-xl px-5 py-4 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Deployments</div>
              <div className="font-sans font-black text-2xl text-indigo-950 mt-1">42 schools live</div>
              <div className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest mt-1">Lagos &bull; Abuja &bull; PH</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SYSTEM ROLE MATRIX */}
      <RoleShowcase onChoosePlan={handleChoosePlan} />

      {/* CORE FEATURES */}
      <section id="features" className="py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 max-w-3xl mx-auto mb-12">
            <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              CORE CAPABILITIES
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-indigo-950 mt-4 leading-tight">
              Retire the file cabinet. Digitally empower your corridors.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-slate-50 p-6 sm:p-8 rounded-xl border border-slate-200/80 shadow-sm transition hover:shadow-md">
                  <div className="w-11 h-11 rounded-lg bg-indigo-950 text-white flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-sans text-lg font-bold mt-5 text-indigo-950">{f.title}</h3>
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SAMPLES */}
      <section id="samples" className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-950 px-3 py-1 rounded-full">
              SEE BEFORE YOU BUY
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-indigo-950 leading-tight">
              Sample documents &mdash; straight from our processing engine
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Every document below is dynamically formatted and printed by our reporting tools. Download or print to evaluate compatibility.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Report card */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <FileBarChart size={20} />
                </div>
                <h3 className="font-sans text-lg font-bold mt-5 text-indigo-950">Term Report Card</h3>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  CA + Exam scores, class position, attendance grids, 5-star skill evaluations, principal remarks, and a scannable QR stamp for validation.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">SPECS: A-Grade Pattern &bull; 1-Page</p>
                <button
                  onClick={generateSampleReportCard}
                  className="w-full mt-4 bg-indigo-950 hover:bg-indigo-900 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Open Printable Sample
                </button>
              </div>
            </div>

            {/* CBT script */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <BookOpenCheck size={20} />
                </div>
                <h3 className="font-sans text-lg font-bold mt-5 text-indigo-950">CBT Examination Script</h3>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Auto-graded multiple-choice assessment scripts showing candidate responses, official keys, submit telemetry metadata indices.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">SPECS: Auto Marks &bull; local CACHE Sync</p>
                <button
                  onClick={generateSampleCBT}
                  className="w-full mt-4 bg-indigo-950 hover:bg-indigo-900 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Open CBT Script
                </button>
              </div>
            </div>

            {/* Financial statement */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <h3 className="font-sans text-lg font-bold mt-5 text-indigo-950">Bursar Ledger Statement</h3>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Reconciled cash positions, electronic bank receipts, card settlements, running Operating Outflows, and net balances.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">SPECS: POS Sync &bull; Debt Lock compliant</p>
                <button
                  onClick={generateSampleFinance}
                  className="w-full mt-4 bg-indigo-950 hover:bg-indigo-900 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Open Bursary Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              SIMPLE NAIRA PRICING
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-indigo-950">
              Pick the length. We do the math.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Academic block fees. Pay by card or upload bank receipt slippage for manual approval. All ledger links are secure.
            </p>

            <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 max-w-sm w-full mt-6 justify-between">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    duration === d.key ? "bg-indigo-950 text-white shadow-sm" : "text-slate-500 hover:text-indigo-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((t) => {
              const Icon = t.icon;
              const featured = t.key === "unified_enterprise";
              const available = t.price !== undefined;
              return (
                <div
                  key={t.key}
                  className={`bg-slate-50 p-7 rounded-xl border flex flex-col justify-between transition-all ${
                    featured ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10" : "border-slate-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-lg bg-indigo-950 text-white flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      {featured && (
                        <span className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          BEST VALUE
                        </span>
                      )}
                    </div>
                    <h3 className="font-sans text-lg font-bold mt-5 text-indigo-950">{t.name}</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed min-h-[50px]">{t.desc}</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200/60">
                    <div className="mb-4">
                      {available ? (
                        <>
                          <div className="font-sans text-3xl font-black text-indigo-950">
                            ₦{t.price.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            Per School &bull; {DURATIONS.find(d => d.key === duration)?.label}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400 italic">Available on Full Session only</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleChoosePlan(t.key)}
                      disabled={!available}
                      className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-full transition cursor-pointer ${
                        featured 
                          ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white shadow-sm"
                          : available
                            ? "bg-indigo-950 hover:bg-indigo-900 active:scale-[0.98] text-white"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Choose Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SHOWCASE & DEPLOYMENT FEEDBACK */}
      <section className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col justify-between">
              <div className="h-64 sm:h-72 w-full overflow-hidden">
                <img src={TEACHER_IMG} alt="Teacher coding scores" className="w-full h-full object-cover" />
              </div>
              <div className="p-8 space-y-4">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded inline-block">
                  FROM THE SCHOOL STAFFROOM
                </span>
                <p className="font-sans text-xl sm:text-2xl font-black text-indigo-950 leading-snug italic">
                  "I used to spend my Saturdays computing student grades and plotting class cohorts manually. Today, I key parameters on my smartphone, and Corner Streams exports print-ready terminal scrolls in 5 seconds."
                </p>
                <div className="text-xs text-slate-500 font-bold">
                  &mdash; Mr. Bayo Adeyemi, SS2 Mathematics Instructor, JSS/SS Lagos Campuses
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">PRINCIPALS</span>
                <p className="font-sans text-base font-bold text-indigo-950 leading-snug mt-3">
                  "The ledger bypass prevention (Debt Lock) is a total game-changer. Parents can only access grades if their tuition profile balances are clear."
                </p>
                <div className="text-[10px] text-slate-500 mt-2 font-bold">&mdash; Mrs. Okonkwo, Corner Streams Private School</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-100">
                    <img src={PARENT_IMG} alt="Parent" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-indigo-950">Parent Core Gateway</h4>
                    <span className="text-[9px] text-slate-500 leading-none">Instant Notification Sync</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Parents check terminal report cards straight on their mobile phones, reconcile invoice balances safely, and inspect digital transcripts instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section id="about" className="py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="relative max-w-sm w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center shadow-sm">
              <div className="absolute -top-4 -left-4 w-28 h-28 bg-emerald-500/10 rounded-2xl rotate-6 -z-10" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-500/10 rounded-2xl -rotate-3 -z-10" />
              <div className="w-full h-72 sm:h-80 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                <img
                  src="/src/assets/images/founder_classroom_paperwork_1781718859228.jpg"
                  alt="Mervydean Hilary — Founder teaching in a classroom with physical paperwork grading burden"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="font-sans font-black text-lg text-indigo-950 mt-4 leading-none">Mervydean Hilary</h4>
              <p className="text-xs text-slate-400 font-bold mt-1.5">Founder &bull; Corner Streams</p>
              <span className="inline-block mt-3 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                6 years in the classroom
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-5">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-950 px-3 py-1 rounded-full">
              OUR STORY
            </span>
            <h3 className="font-sans text-2xl sm:text-3xl font-black text-indigo-950 leading-tight">
              Honoring Our Classroom Roots
            </h3>
            <p className="text-slate-650 text-xs sm:text-sm leading-relaxed font-semibold">
              After six active years in primary and secondary classrooms, our founder, <span className="text-indigo-950 font-black">Mervydean Hilary</span>, experienced firsthand how paperwork grids slow instruction down and trigger massive data loops.
            </p>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed">
              Corner Streams was born out of a critical mission to rescue African school administrations from the exhaustive, error-prone paper trap. Founded by an educator and technology architect who witnessed firsthand how administrative friction drains instructional energy, the platform was engineered to serve as a high-performance digital backbone for schools spanning Creche through Secondary tiers.
            </p>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed">
              What began as an initiative to eliminate manual grading sheets and vulnerable paper-based test structures evolved into a highly secure, resilient ecosystem—unifying robust CBT assessment engines, real-time continuous assessment scaling matrices, and completely transparent financial ledgers. Today, Corner Streams stands as a testament to what happens when deep educational experience meets uncompromising digital engineering, empowering administrators, teachers, and parents with a single, paperless source of truth.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-xl text-emerald-500">6+</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Classroom Years</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-xl text-indigo-600">42</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Schools live</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-xl text-indigo-950">∞</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Loops Closed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <HelpCircle size={12} className="text-indigo-600" />
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-indigo-950 tracking-tight">
              Everything you need to know about Corner Streams
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Clear answers on examination reliability, offline broadsheets, bursary reconciliation, and institutional deployment.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? "bg-white border-indigo-300 shadow-md ring-1 ring-indigo-100" 
                      : "bg-white/80 hover:bg-white border-slate-200/90 shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left gap-4 cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600">
                        {faq.category}
                      </span>
                      <h3 className={`font-sans text-sm sm:text-base font-bold transition-colors ${isOpen ? "text-indigo-950" : "text-slate-800"}`}>
                        {faq.question}
                      </h3>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? "bg-indigo-50 text-indigo-700 rotate-180" : "bg-slate-100 text-slate-500"}`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Help Callout */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-4 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-600 font-medium">Have a specific question not covered here?</span>
              <button
                type="button"
                onClick={() => openDirectWhatsApp("Hello Corner Streams! I have a specific question about your platform.")}
                className="text-xs font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle size={14} /> Ask us directly on WhatsApp &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 sm:py-24 bg-indigo-950 text-white relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-900 border border-indigo-800 text-white px-3 py-1 rounded-full inline-block">
              CONTACT INQUIRY &bull; WHATSAPP ROUTING
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black leading-tight">
              Onboard your school corridors this week
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Drop your details. A Corner Streams advisor will reach out directly on WhatsApp to schedule an offline demo or complete bursary onboarding.
            </p>
            <div className="space-y-4 pt-4 text-xs font-bold text-slate-300">
              <a 
                href="mailto:thecornerstreams@gmail.com" 
                className="flex items-center gap-3 hover:text-white transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                  <Mail size={16} />
                </div>
                <span>thecornerstreams@gmail.com</span>
              </a>

              {/* Direct Clickable WhatsApp Contact */}
              <a 
                href={`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent("Hello Corner Streams Admissions & Support! I would like to inquire about onboarding our school.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white transition group cursor-pointer"
                title="Click to chat directly on WhatsApp"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    WhatsApp Direct Chat <ExternalLink size={10} />
                  </div>
                  <span className="text-white text-sm font-black underline decoration-emerald-500/60 decoration-2 underline-offset-4">Open Instant WhatsApp Consultation &rarr;</span>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Support Hours</div>
                  <span className="text-slate-300">Mon &ndash; Fri, 09:00 &ndash; 18:00 WAT</span>
                </div>
              </div>
            </div>

            {/* Instant Quick WhatsApp Action Card */}
            <div className="p-4 rounded-xl bg-indigo-900/60 border border-indigo-800/80 max-w-md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">Online now on WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={() => openDirectWhatsApp("Hello Corner Streams! I would like to speak with a school deployment specialist.")}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle size={13} /> Chat Now
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={submitContact} className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-sans font-black text-lg text-indigo-950">Send WhatsApp Inquiry</h3>
                <p className="text-xs text-slate-500">We'll register your request and route directly to WhatsApp.</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MessageCircle size={18} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Bayo Adeyemi"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourschool.edu.ng"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Royal College, Lagos"
                  value={contact.school_name}
                  onChange={(e) => setContact({ ...contact, school_name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Your Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+234 800 000 0000"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Inquiry Message</label>
              <textarea
                required
                rows={3}
                placeholder="Tell us about your student population, current grading challenges, or requested modules (CBT, Broadsheet, Bursary)..."
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-full cursor-pointer transition shadow-md flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              <span>{submitting ? "Routing to WhatsApp..." : "Send Message via WhatsApp"}</span>
            </button>
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => openDirectWhatsApp("Hello Corner Streams! I would like to chat with an admissions and setup consultant.")}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Or click here to start a WhatsApp chat instantly without filling the form &rarr;</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FLOATING ACTION CONTROLS: SCROLL TO TOP & WHATSAPP */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* Toggle Icon Arrow To Slide Up When Scrolling Down */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.8 }}
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={scrollToTop}
              className="pointer-events-auto w-11 h-11 rounded-full bg-indigo-950/90 hover:bg-indigo-900 active:bg-indigo-950 text-white backdrop-blur-md border border-indigo-700/80 shadow-2xl flex items-center justify-center cursor-pointer transition group"
              title="Slide back to top"
              aria-label="Slide to top"
            >
              <ChevronUp size={20} className="text-emerald-400 group-hover:-translate-y-0.5 transition-transform duration-150" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating WhatsApp Action Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openDirectWhatsApp("Hello Corner Streams! I am inquiring about onboarding our school.")}
          className="pointer-events-auto bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2.5 border-2 border-white/80 cursor-pointer group"
          title="Chat with us on WhatsApp"
        >
          <div className="relative">
            <MessageCircle size={22} className="shrink-0" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline text-xs font-extrabold tracking-wide">
            Chat on WhatsApp
          </span>
        </motion.button>
      </div>

      {/* FOOTER */}
      <footer className="bg-indigo-950 text-slate-400/80 text-xs py-8 border-t border-indigo-900/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div>© 2026 Corner Streams. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a 
              href={`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent("Hello Corner Streams! I have a question regarding your platform.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              <MessageCircle size={14} />
              <span>Chat on WhatsApp</span>
            </a>
            <a href="mailto:thecornerstreams@gmail.com" className="hover:text-white transition">thecornerstreams@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
