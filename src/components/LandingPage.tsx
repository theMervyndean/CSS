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
import { dispatchContactNotification, dispatchPageViewNotification } from "../lib/notifications";
import { LegalTrustModal, LegalTabType } from "./LegalTrustModal";

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
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType>('privacy');

  const openLegalModal = (tab: LegalTabType) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  // Monitor scroll distance for the slide-up toggle arrow immediately on any scroll
  useEffect(() => {
    // Dispatch page view notification across Telegram, Email, and WhatsApp
    dispatchPageViewNotification("Public Landing Portal");

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
      // Dispatch multi-channel notification (Telegram Group/Channel + 4 Admin Inboxes + WhatsApp)
      dispatchContactNotification({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        schoolName: contact.school_name,
        subject: `Inquiry for ${contact.school_name || "Institution"}`,
        message: contact.message || "Requested institutional onboarding demo and consultation.",
        source: "Landing Page Contact Section"
      });

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
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white relative pt-16 w-full max-w-full overflow-x-hidden viewport-fit-screen">
      <Navbar currentView="landing" onChangeView={onChangeView} />

      {/* HERO */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24 border-b border-slate-200 w-full max-w-full">
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
            <div className="hidden sm:block absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/10 rounded-2xl rotate-6 pointer-events-none -z-10" />
            <div className="hidden sm:block absolute -bottom-6 -right-6 w-40 h-40 bg-indigo-500/10 rounded-2xl -rotate-3 pointer-events-none -z-10" />
            <img
              src={HERO_IMG}
              alt="Nigerian classroom"
              className="relative rounded-2xl shadow-xl border border-slate-200/80 object-cover w-full h-[260px] sm:h-[360px] md:h-[440px]"
            />
            <div className="absolute -bottom-3 left-3 sm:left-6 bg-white rounded-xl shadow-xl px-4 sm:px-5 py-3 sm:py-4 border border-slate-100 max-w-[calc(100%-1.5rem)] sm:max-w-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purpose-Built Cloud</div>
              <div className="font-sans font-black text-base sm:text-xl text-indigo-950 mt-1 leading-snug">For Nigerian &amp; African Schools</div>
              <div className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest mt-1">Lagos &bull; Abuja &bull; Pan-Africa</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SYSTEM ROLE MATRIX */}
      <RoleShowcase onChoosePlan={handleChoosePlan} />

      {/* CORE FEATURES */}
      <section id="features" className="py-20 sm:py-24 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
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
      <section id="samples" className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200 w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
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
      <section id="pricing" className="py-20 sm:py-24 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
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
      <section id="about" className="py-20 sm:py-24 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="relative max-w-sm w-full bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-sm">
              <div className="hidden sm:block absolute -top-4 -left-4 w-28 h-28 bg-emerald-500/10 rounded-2xl rotate-6 -z-10 pointer-events-none" />
              <div className="hidden sm:block absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-500/10 rounded-2xl -rotate-3 -z-10 pointer-events-none" />
              <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                <img
                  src="/src/assets/images/founder_classroom_paperwork_1781718859228.jpg"
                  alt="Teaching in a secondary classroom with physical paperwork grading"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
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
              Serving as a secondary school teacher starting from his NYSC days, our founder observed firsthand how paper-heavy workflows, manual grading grids, and administrative bottlenecks inside the four walls of the school system divert precious energy away from actual teaching.
            </p>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed">
              Corner Streams was born from a direct mission: to rescue secondary schools and educational institutions from the exhaustive, error-prone paper trap. Having stood before the chalkboard and witnessed the late nights spent tallying continuous assessments by hand, our founder recognized that schools needed an intuitive, resilient digital backbone&mdash;not complicated enterprise software.
            </p>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed">
              What began as an effort to replace manual score recording, misplaced records, and vulnerable paper exams has grown into an all-in-one institutional cloud&mdash;unifying robust CBT assessment engines, automated WAEC-standard continuous assessment broadsheets, and transparent financial ledgers. Corner Streams bridges the gap between everyday classroom realities and modern digital efficiency, giving educators, administrators, and parents a single, dependable source of truth.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-base sm:text-lg text-emerald-600">NYSC</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Classroom Origin</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-base sm:text-lg text-indigo-600">100%</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Paperless Target</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-lg text-center">
                <div className="font-sans font-black text-base sm:text-lg text-indigo-950">&infin;</div>
                <div className="text-[9px] uppercase font-bold text-slate-500 mt-1">Loops Closed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200/80 w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
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
                  className={`rounded-2xl border transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen 
                      ? "bg-white border-indigo-300 shadow-md ring-1 ring-indigo-100" 
                      : "bg-white/80 hover:bg-white border-slate-200/90 shadow-sm"
                  }`}
                >
                  <motion.button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    whileTap={{ scale: 0.992 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left gap-4 cursor-pointer select-none transition-colors duration-200 ease-in-out hover:bg-slate-50/70"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600">
                        {faq.category}
                      </span>
                      <h3 className={`font-sans text-sm sm:text-base font-bold transition-colors duration-200 ease-in-out ${isOpen ? "text-indigo-950" : "text-slate-800"}`}>
                        {faq.question}
                      </h3>
                    </div>
                    <motion.div 
                      animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.05 : 1 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ease-in-out ${
                        isOpen ? "bg-indigo-100 text-indigo-700 shadow-inner" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`faq-content-${idx}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="px-5 sm:px-6 pb-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
      <section id="contact" className="py-20 sm:py-24 bg-indigo-950 text-white relative w-full max-w-full overflow-hidden scroll-mt-20 sm:scroll-mt-24">
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
                href="mailto:thecornerstreams@gmail.com?subject=Corner%20Streams%20School%20Onboarding%20%26%20Inquiry&body=Hello%20Corner%20Streams%20Team%2C%0A%0AI%20would%20like%20to%20learn%20more%20about%20onboarding%20our%20school%20on%20Corner%20Streams.%0A%0ASchool%20Name%3A%0ALocation%3A%0APhone%20Number%3A%0A%0AThank%20you!" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white transition group cursor-pointer"
                title="Send email via Gmail / default mail app"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="font-semibold block">thecornerstreams@gmail.com</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Click to compose email</span>
                </div>
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

      {/* RICH MULTI-COLUMN FOOTER (OPTION C) */}
      <footer className="bg-indigo-950 text-slate-300 text-xs border-t border-indigo-900/60 w-full max-w-full overflow-hidden">
        {/* Main 4-Column Grid + Brand Summary */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-16 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand & Purpose Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-indigo-950 rounded-[10px] flex items-center justify-center">
                    <GraduationCap size={18} className="text-emerald-400" />
                  </div>
                </div>
                <div>
                  <span className="font-sans font-black text-lg text-white tracking-tight">Corner Streams</span>
                  <span className="block text-[10px] text-emerald-400 font-bold tracking-wider uppercase -mt-0.5">Unified School Cloud</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                The modern institutional cloud for Nigerian and African schools. Automating continuous assessment, offline CBT examination engines, QR-verified tamper-proof report cards, and fee reconciliation.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-900/70 text-indigo-200 border border-indigo-800">
                  <ShieldCheck size={13} className="text-emerald-400" /> NDPA / NDPR Compliant
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-900/70 text-indigo-200 border border-indigo-800">
                  <Lock size={13} className="text-emerald-400" /> 256-bit Encrypted
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-900/70 text-indigo-200 border border-indigo-800">
                  <QrCode size={13} className="text-emerald-400" /> Tamper-Proof QR
                </span>
              </div>
            </div>

            {/* Column 1: Core Platform Modules */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-white border-b border-indigo-900/80 pb-2">
                Modules &amp; Solutions
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Offline-First CBT Engine
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Automated Broadsheet Vault
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Bursary &amp; Bank Reconciliation
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Parent &amp; Student Result Portal
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Termly &amp; Session Pricing
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources & Curricula */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-white border-b border-indigo-900/80 pb-2">
                Resources &amp; Guides
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('migration')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>School Onboarding Guide</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">4-Step</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('grading')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    WAEC / NECO Grading Models
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('security')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Security &amp; QR Verification
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Frequently Asked Questions
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onChangeView('login')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Sign In to Dashboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust, Legal & Contact */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-widest text-white border-b border-indigo-900/80 pb-2">
                Trust &amp; Compliance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('privacy')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Privacy Policy (NDPA / NDPR)
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('terms')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => openLegalModal('refund')}
                    className="text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Billing &amp; Refund Policy
                  </button>
                </li>
                <li className="pt-2 border-t border-indigo-900/60">
                  <a 
                    href="mailto:thecornerstreams@gmail.com?subject=Institutional%20Inquiry%20-%20Corner%20Streams"
                    className="text-slate-400 hover:text-white transition flex items-center gap-1.5"
                  >
                    <Mail size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">thecornerstreams@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a 
                    href={`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent("Hello Corner Streams! I would like to inquire about onboarding our school.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1.5"
                  >
                    <MessageCircle size={13} className="shrink-0" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="border-t border-indigo-900/80 bg-indigo-950/90 py-6 px-4">
          <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-center text-center gap-3 text-[11px] text-slate-400/80">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px]">
              <button 
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="hover:text-white transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>&bull;</span>
              <button 
                type="button"
                onClick={() => openLegalModal('terms')}
                className="hover:text-white transition cursor-pointer"
              >
                Terms of Service
              </button>
              <span>&bull;</span>
              <button 
                type="button"
                onClick={() => openLegalModal('refund')}
                className="hover:text-white transition cursor-pointer"
              >
                Billing &amp; Refunds
              </button>
              <span>&bull;</span>
              <button 
                type="button"
                onClick={() => openLegalModal('security')}
                className="hover:text-white transition cursor-pointer"
              >
                Security &amp; QR Verification
              </button>
              <span>&bull;</span>
              <span className="text-emerald-400 font-bold">Nigeria &bull; Pan-Africa</span>
            </div>
            <div>&copy; 2026 Corner Streams. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* LEGAL & TRUST MODAL */}
      <LegalTrustModal
        isOpen={legalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
        onOpenWhatsApp={(topic) => openDirectWhatsApp(`Hello Corner Streams! I have a question regarding: ${topic}`)}
        onGoToOnboarding={() => onChangeView('register')}
      />
    </div>
  );
}
