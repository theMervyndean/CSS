import React, { useMemo, useState, useEffect } from "react";
import Navbar from "./Navbar";
import { Button } from "./ui-stubs";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  GraduationCap, Receipt, ShieldCheck, FileBarChart, Users, QrCode,
  Mail, MessageCircle, Phone, ArrowRight, CheckCircle2, Sparkles, Lock,
  Download, FileText, BookOpenCheck, Wallet, ChevronRight
} from "lucide-react";
import { generateSampleReportCard, generateSampleCBT, generateSampleFinance } from "../utils/samplePdfs";
import RoleShowcase from "./RoleShowcase";
import { api } from "../lib/api";

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

  // Skip marketing if launched standalone (PWA)
  useEffect(() => {
    // Retain definition for potential downstream PWA usage but do not auto-redirect
    // to allow the landing page to be viewed normally in all environments.
  }, [onChangeView]);

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
    try {
      await api.post("/leads", {
        name: contact.name,
        email: contact.email,
        school: contact.school_name,
        phone: contact.phone || "",
        message: contact.message || ""
      });
      toast.success("Demo request and pipeline inquiry uploaded to administration successfully! We will reach out shortly.");
      setContact({ name: "", email: "", school_name: "", phone: "", message: "" });
    } catch (err: any) {
      toast.error("Failed to route prospecting pipeline information to admin console.");
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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
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

      {/* CONTACT */}
      <section id="contact" className="py-20 sm:py-24 bg-indigo-950 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-900 border border-indigo-800 text-white px-3 py-1 rounded-full inline-block">
              CONTACT INQUIRY
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl font-black leading-tight">
              Onboard your school corridors this week
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Drop your details. A Corner Streams advisor will reach out to schedule an offline demo or a complete bursa onboarding evaluation.
            </p>
            <div className="space-y-4 pt-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-emerald-400" />
                <span>thecornerstreams@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle size={16} className="text-emerald-400" />
                <span>WhatsApp: +234 902 144 5607</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-emerald-400" />
                <span>Mon &ndash; Fri, 09:00 &ndash; 18:00 WAT</span>
              </div>
            </div>
          </div>

          <form onSubmit={submitContact} className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 space-y-4 shadow-xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={contact.school_name}
                  onChange={(e) => setContact({ ...contact, school_name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">WhatsApp Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+234..."
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
                rows={4}
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-xs font-black uppercase tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 rounded-full cursor-pointer transition shadow-sm"
            >
              {submitting ? "Sending Inquiry..." : "Submit Inquiry"}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-indigo-950 text-slate-400/80 text-xs py-8 border-t border-indigo-900/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div>Copyright ©️ 2026 cornerstreams@gmail.com</div>
          <div className="flex items-center gap-6">
            <a href="mailto:cornerstreams@gmail.com" className="hover:text-white transition">cornerstreams@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
