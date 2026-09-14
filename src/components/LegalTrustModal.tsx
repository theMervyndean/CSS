import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Lock, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  HelpCircle,
  Building2,
  Calendar
} from 'lucide-react';

export type LegalTabType = 'privacy' | 'terms' | 'refund' | 'security' | 'grading' | 'migration';

interface LegalTrustModalProps {
  isOpen: boolean;
  initialTab?: LegalTabType;
  onClose: () => void;
  onOpenWhatsApp?: (topic: string) => void;
  onGoToOnboarding?: () => void;
}

export const LegalTrustModal: React.FC<LegalTrustModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  onOpenWhatsApp,
  onGoToOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const tabs: { id: LegalTabType; label: string; icon: React.ReactNode; tag: string }[] = [
    { id: 'privacy', label: 'Privacy Policy (NDPA)', icon: <ShieldCheck size={16} />, tag: 'Data Protection' },
    { id: 'terms', label: 'Terms of Service', icon: <FileText size={16} />, tag: 'Institutional Agreement' },
    { id: 'refund', label: 'Billing & Refund Policy', icon: <CreditCard size={16} />, tag: 'Bursary & Payments' },
    { id: 'security', label: 'Security & QR Verification', icon: <Lock size={16} />, tag: 'Exam Integrity' },
    { id: 'grading', label: 'WAEC / NECO Standards', icon: <Award size={16} />, tag: 'Curriculum Models' },
    { id: 'migration', label: 'School Onboarding Guide', icon: <GraduationCap size={16} />, tag: '4-Step Deployment' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-indigo-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.24, ease: "easeInOut" }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto"
        >
          {/* Top Bar Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-sans font-black tracking-tight text-white flex items-center gap-2">
                  Legal, Trust &amp; Compliance Center
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Official operational policies for Nigerian &amp; African schools &bull; Corner Streams
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close modal"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-indigo-950 shadow-sm border border-slate-200 font-extrabold ring-1 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-indigo-950 hover:bg-white/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto text-slate-700 leading-relaxed text-sm space-y-6 flex-1 bg-slate-50/50">
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <ShieldCheck size={14} /> NDPA 2023 &amp; NDPR Compliant
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    Institutional Privacy &amp; Data Protection Policy
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Last Updated: Academic Session 2025/2026 &bull; Governing all student, parent, and institutional records
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
                    <h5 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      Our Non-Negotiable Commitment: Zero Data Monetization
                    </h5>
                    <p className="text-emerald-900/90 text-xs mt-1">
                      Corner Streams does not sell, rent, license, or monetize student grades, behavioral records, or parent contact details to any third party, marketing agency, or ad network. All records belong exclusively to your school.
                    </p>
                  </div>

                  <h5 className="font-bold text-indigo-950 text-base">1. Scope and Legal Basis</h5>
                  <p>
                    Corner Streams operates in full compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and the <strong>Nigeria Data Protection Regulation (NDPR)</strong>. This policy sets out the basis on which academic records, biometric/photo identities, tuition receipts, and parent communication logs are processed.
                  </p>

                  <h5 className="font-bold text-indigo-950 text-base">2. Protection of Minors' Academic Data</h5>
                  <p>
                    Because educational platforms maintain records of minors (creche, nursery, primary, and secondary students), Corner Streams acts as a <em>Data Processor</em> on behalf of the school (the <em>Data Controller</em>). The school affirms that parental or guardian consent has been obtained as part of institutional enrollment.
                  </p>

                  <h5 className="font-bold text-indigo-950 text-base">3. Types of Information Stored</h5>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li><strong>Student Profiles:</strong> Full name, admission number, class and arm, passport photograph, date of birth, and health/emergency notes.</li>
                    <li><strong>Academic Metrics:</strong> Continuous assessments (CA1, CA2), terminal examination scores, WAEC/NECO converted grades, affective and psychomotor ratings, and teacher remarks.</li>
                    <li><strong>Parent/Guardian Data:</strong> Name, verified mobile phone number for SMS/WhatsApp result notifications, and email address.</li>
                    <li><strong>Financial Ledgers:</strong> Tuition invoices, bank teller/POS reference codes, fee clearance approvals, and scholarship waivers.</li>
                  </ul>

                  <h5 className="font-bold text-indigo-950 text-base">4. Data Encryption &amp; Storage Architecture</h5>
                  <p>
                    All communications between client devices and our cloud cluster are encrypted using <strong>TLS 1.3</strong> protocols. Sensitive data, including password credentials and financial reconciliations, is salted and encrypted at rest with industry-standard <strong>AES-256</strong> encryption.
                  </p>

                  <h5 className="font-bold text-indigo-950 text-base">5. School Data Sovereignty &amp; Portability</h5>
                  <p>
                    Schools retain unconditional ownership of their data. School administrators can export their entire historical database—including student rosters, broadsheets, and transaction ledgers—in open Excel (.xlsx), CSV, or signed PDF formats at any time without fees or lock-ins.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    <FileText size={14} /> Master Subscription Agreement
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    Terms of Institutional Service
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Rules and obligations governing School Proprietors, Administrators, Teachers, and Portals
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <h5 className="font-bold text-indigo-950 text-base">1. Institutional License Grant</h5>
                  <p>
                    Upon onboarding and activation of an active termly or annual subscription, Corner Streams grants the enrolled school a non-exclusive, multi-user license to deploy the academic management software, CBT exam engine, result publishing suite, and bursary ledger across their primary or secondary campuses.
                  </p>

                  <h5 className="font-bold text-indigo-950 text-base">2. Role-Based Account Responsibility</h5>
                  <p>
                    Access is strictly segmented according to user roles:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li><strong>Super Administrator (Proprietor / Principal):</strong> Holds master privileges to configure grading rubrics, approve termly broadsheets, clear financial ledgers, and manage staff rosters.</li>
                    <li><strong>Subject &amp; Class Teachers:</strong> Permitted to record scores, input remarks, administer CBT quizzes, and take daily roll calls for assigned classes only.</li>
                    <li><strong>Bursary Officers:</strong> Restricted to fee generation, payment logging, and bank teller verification without authority to alter academic marks.</li>
                    <li><strong>Students &amp; Parents:</strong> Read-only access to published result dossiers, examination portals, and verified receipts.</li>
                  </ul>

                  <h5 className="font-bold text-indigo-950 text-base">3. CBT Exam Integrity &amp; Conduct</h5>
                  <p>
                    Schools utilizing the Corner Streams CBT Engine are responsible for proctoring student devices. The system incorporates offline question caching and session lockdown alerts to detect window switching or internet disconnection during active test sessions.
                  </p>

                  <h5 className="font-bold text-indigo-950 text-base">4. Service Availability &amp; Offline Continuity</h5>
                  <p>
                    We maintain an uptime target of <strong>99.9%</strong>. To guard against frequent power fluctuations and telecom fiber outages in West Africa, the platform's local caching enables teachers to score continuous assessments and students to complete examinations offline, automatically synchronizing once connectivity is restored.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'refund' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <CreditCard size={14} /> Bursary Transparency
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    Subscription, Billing &amp; Refund Policy
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Clear guidance on termly plans, offline bank transfer clearing, and cancellation rights
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <h5 className="font-bold text-indigo-950 text-base">1. Subscription Cadence</h5>
                  <p>
                    Corner Streams offers flexible pricing structured around the Nigerian academic calendar:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li><strong>Termly Billing:</strong> Billed at the beginning of each academic term (First Term, Second Term, Third Term).</li>
                    <li><strong>Annual Billing (Academic Session):</strong> Billed once per year covering all three terms at a discounted institutional rate.</li>
                  </ul>

                  <h5 className="font-bold text-indigo-950 text-base">2. Payment Methods &amp; Offline Bank Verification</h5>
                  <p>
                    We understand that schools and PTA bodies predominantly settle accounts via direct Nigerian bank transfers (NIBSS Instant Pay) or branch deposits. When a school submits a transfer confirmation reference:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li>Our accounts verification team clears and activates the school workspace within <strong>24 to 48 hours</strong>.</li>
                    <li>An official electronic invoice with tax and stamp certification is issued immediately upon reconciliation.</li>
                  </ul>

                  <h5 className="font-bold text-indigo-950 text-base">3. Refund &amp; Cancellation Terms</h5>
                  <p>
                    If a school decides to cancel its onboarding prior to the kickoff of the academic term or within <strong>14 calendar days</strong> of initial subscription payment (provided broadsheet publication or CBT term exams have not been processed), the institution is entitled to a full refund minus third-party bank processing charges.
                  </p>
                  <p>
                    Mid-term cancellations are not subject to partial refunds; however, the school retains full access to download, export, and print all terminal broadsheets, report cards, and student records until the expiration of the paid term.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    <Lock size={14} /> Cryptographic Proof
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    Security &amp; Tamper-Proof QR Verification
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    How Corner Streams prevents report card forgery and protects academic credentials
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                        <Award size={16} /> QR Certificate Verification
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">
                        Every student terminal report card is generated with an embedded, cryptographically signed QR code. Anyone scanning it is routed to an authentic school verification page matching grades directly against the institutional master broadsheet.
                      </p>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                        <Lock size={16} /> Offline SQLite Cache
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">
                        During continuous assessment entry or CBT examinations, responses are instantly cached locally. Power or internet cuts will not wipe student answers or teacher score entries.
                      </p>
                    </div>
                  </div>

                  <h5 className="font-bold text-indigo-950 text-base">Combating Credential Forgery</h5>
                  <p>
                    Manual physical report cards are susceptible to unauthorized grade alterations, signature forgery, and counterfeit stamps. Corner Streams eliminates this vulnerability by generating tamper-evident PDF dossiers that can be verified in real time by tertiary admissions officers, scholarship boards, and foreign embassies without calling the school.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'grading' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <Award size={14} /> National Curricula
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    WAEC, NECO &amp; National Grading Standards
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Built-in assessment formulas and psychomotor domain evaluation rubrics
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <h5 className="font-bold text-indigo-950 text-base">Continuous Assessment &amp; Exam Weighting</h5>
                  <p>
                    Corner Streams seamlessly adapts to your school's preferred CA-to-Exam ratio:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white border border-slate-200 p-3 rounded-xl">
                      <span className="font-bold text-indigo-950 block">Standard 40 / 60 Model</span>
                      <span className="text-slate-500">20% First CA + 20% Second CA + 60% Terminal Examination = 100%</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl">
                      <span className="font-bold text-indigo-950 block">Alternate 30 / 70 Model</span>
                      <span className="text-slate-500">15% CA1 + 15% CA2 + 70% Terminal Examination = 100%</span>
                    </div>
                  </div>

                  <h5 className="font-bold text-indigo-950 text-base">9-Point WAEC / NECO Scale</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200">Score Range</th>
                          <th className="p-2.5 border-b border-slate-200">Grade</th>
                          <th className="p-2.5 border-b border-slate-200">Remark</th>
                          <th className="p-2.5 border-b border-slate-200">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr><td className="p-2 font-mono">75% - 100%</td><td className="p-2 font-bold text-emerald-600">A1</td><td className="p-2">Excellent</td><td className="p-2 text-slate-500">Distinction</td></tr>
                        <tr><td className="p-2 font-mono">70% - 74%</td><td className="p-2 font-bold text-emerald-600">B2</td><td className="p-2">Very Good</td><td className="p-2 text-slate-500">Distinction</td></tr>
                        <tr><td className="p-2 font-mono">65% - 69%</td><td className="p-2 font-bold text-indigo-600">B3</td><td className="p-2">Good</td><td className="p-2 text-slate-500">Credit</td></tr>
                        <tr><td className="p-2 font-mono">60% - 64%</td><td className="p-2 font-bold text-indigo-600">C4</td><td className="p-2">Credit</td><td className="p-2 text-slate-500">Credit</td></tr>
                        <tr><td className="p-2 font-mono">55% - 59%</td><td className="p-2 font-bold text-indigo-600">C5</td><td className="p-2">Credit</td><td className="p-2 text-slate-500">Credit</td></tr>
                        <tr><td className="p-2 font-mono">50% - 54%</td><td className="p-2 font-bold text-indigo-600">C6</td><td className="p-2">Credit</td><td className="p-2 text-slate-500">Credit</td></tr>
                        <tr><td className="p-2 font-mono">45% - 49%</td><td className="p-2 font-bold text-amber-600">D7</td><td className="p-2">Pass</td><td className="p-2 text-slate-500">Pass</td></tr>
                        <tr><td className="p-2 font-mono">40% - 44%</td><td className="p-2 font-bold text-amber-600">E8</td><td className="p-2">Pass</td><td className="p-2 text-slate-500">Pass</td></tr>
                        <tr><td className="p-2 font-mono">0% - 39%</td><td className="p-2 font-bold text-red-600">F9</td><td className="p-2">Fail</td><td className="p-2 text-slate-500">Fail</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <h5 className="font-bold text-indigo-950 text-base">Affective &amp; Psychomotor Domains</h5>
                  <p>
                    Teachers can evaluate students on standard behavioral criteria (Punctuality, Attentiveness, Neatness, Honesty, Relationship with Peers, Leadership, and Sports Participation) on a 1–5 numerical scale with automated summary calculations.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'migration' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    <GraduationCap size={14} /> Rapid Deployment
                  </div>
                  <h4 className="text-2xl font-sans font-black text-indigo-950 mt-1">
                    School Onboarding &amp; Migration Guide
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    From existing paper or Excel files to a fully active cloud school in 24 to 48 hours
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="grid gap-4">
                    <div className="flex gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-900 font-black flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <h5 className="font-bold text-indigo-950 text-sm">School Profile &amp; Branding Setup</h5>
                        <p className="text-xs text-slate-600 mt-1">
                          Enter your school name, motto, official address, and upload your high-resolution crest/logo. Set your academic session (e.g. 2025/2026) and current term.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-900 font-black flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <h5 className="font-bold text-indigo-950 text-sm">Smart Excel / CSV Roster Upload</h5>
                        <p className="text-xs text-slate-600 mt-1">
                          No need to re-type existing records! Use our Excel template to import your student lists, staff rosters, and class arms (JSS1A, SSS2 Gold, etc.) with automatic duplicate detection.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-900 font-black flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <h5 className="font-bold text-indigo-950 text-sm">Assign Subjects &amp; Teacher Logins</h5>
                        <p className="text-xs text-slate-600 mt-1">
                          Allocate subjects to teachers with one click. Teachers receive lightweight mobile-friendly logins to enter weekly continuous assessment scores right from their smartphones.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center shrink-0">
                        4
                      </div>
                      <div>
                        <h5 className="font-bold text-emerald-950 text-sm">Launch Term Exams &amp; Auto-Generate Broadsheets</h5>
                        <p className="text-xs text-slate-600 mt-1">
                          Run offline-capable CBT exams or upload terminal exam scores. Click "Publish Broadsheet" to instantly compile master marks and print QR-verified PDF report cards for parents.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">Ready to onboard your institution?</span>
                      <span className="text-[11px] text-slate-600">Our setup team provides guided white-glove migration assistance.</span>
                    </div>
                    {onGoToOnboarding && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToOnboarding();
                        }}
                        className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer transition"
                      >
                        Onboard your school
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
              Questions regarding school compliance? Reach our advisory desk at{' '}
              <a 
                href="mailto:thecornerstreams@gmail.com" 
                className="font-bold text-indigo-900 hover:underline"
              >
                thecornerstreams@gmail.com
              </a>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onOpenWhatsApp && (
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(tabs.find(t => t.id === activeTab)?.label || 'Policy')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Ask on WhatsApp</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
