import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Database, Sparkles, FileText, Download, Copy, Check, 
  Layers, Cpu, ShieldCheck, HardDrive, Key, ArrowRight, Table,
  Search, Code, Eye, RefreshCw, Terminal, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface PrdVisualExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DATABASE_SCHEMA_TABLES = [
  {
    name: 'schools',
    label: 'Schools & Campuses',
    description: 'Multi-campus institutional identity, branding, logo, and active term configuration.',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'Unique campus identifier' },
      { name: 'school_name', type: 'VARCHAR(255)', key: '-', nullable: false, desc: 'Official school name' },
      { name: 'slug', type: 'VARCHAR(100)', key: 'UQ', nullable: false, desc: 'Subdomain or URL slug' },
      { name: 'logo_url', type: 'TEXT', key: '-', nullable: true, desc: 'Base64/CDN logo URL' },
      { name: 'current_session', type: 'VARCHAR(50)', key: '-', nullable: false, desc: 'e.g. 2025/2026' },
      { name: 'current_term', type: 'VARCHAR(50)', key: '-', nullable: false, desc: 'e.g. 1st Term' },
      { name: 'created_at', type: 'TIMESTAMP', key: '-', nullable: false, desc: 'Record registration date' }
    ]
  },
  {
    name: 'users',
    label: 'Users & RBAC Directory',
    description: 'System accounts with custom role-based permissions (Super Admin, Admin, Teacher, Student, Parent, Accountant).',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'User ID' },
      { name: 'school_id', type: 'UUID', key: 'FK', nullable: false, desc: 'References schools(id)' },
      { name: 'full_name', type: 'VARCHAR(255)', key: '-', nullable: false, desc: 'User full name' },
      { name: 'email', type: 'VARCHAR(255)', key: 'UQ', nullable: false, desc: 'System email login' },
      { name: 'role', type: 'ENUM', key: '-', nullable: false, desc: 'super_admin | admin | teacher | student | parent | bursar' },
      { name: 'permissions', type: 'JSONB', key: '-', nullable: false, desc: 'Fine-grained RBAC permission matrix' },
      { name: 'status', type: 'VARCHAR(20)', key: '-', nullable: false, desc: 'active | suspended | pending' }
    ]
  },
  {
    name: 'students',
    label: 'Student Dossier & Financial Clearance',
    description: 'Comprehensive student profile, enrollment cohort, house, and Bursary tuition clearance gate.',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'Student profile ID' },
      { name: 'user_id', type: 'UUID', key: 'FK', nullable: false, desc: 'References users(id)' },
      { name: 'admission_no', type: 'VARCHAR(50)', key: 'UQ', nullable: false, desc: 'Official student registration code' },
      { name: 'class_cohort', type: 'VARCHAR(50)', key: '-', nullable: false, desc: 'e.g. SS 2 Science A' },
      { name: 'bursary_status', type: 'VARCHAR(20)', key: 'IDX', nullable: false, desc: 'cleared | debtor | partial' },
      { name: 'tuition_balance', type: 'DECIMAL(12,2)', key: '-', nullable: false, desc: 'Outstanding fee amount in NGN' },
      { name: 'result_passcode', type: 'VARCHAR(20)', key: '-', nullable: false, desc: 'Secure report card scratchcard token' }
    ]
  },
  {
    name: 'cbt_exams',
    label: 'CBT Examination Engine',
    description: 'CBT test configurations, duration, randomized options, auto-marking, and offline synchronization.',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'Exam session ID' },
      { name: 'title', type: 'VARCHAR(255)', key: '-', nullable: false, desc: 'e.g. 1st Term Physics Terminal Exam' },
      { name: 'subject_name', type: 'VARCHAR(100)', key: 'IDX', nullable: false, desc: 'Subject classification' },
      { name: 'duration_minutes', type: 'INT', key: '-', nullable: false, desc: 'Test time limit' },
      { name: 'questions', type: 'JSONB', key: '-', nullable: false, desc: 'Array of questions, options, answer keys, marks' },
      { name: 'status', type: 'VARCHAR(20)', key: '-', nullable: false, desc: 'draft | published | concluded' }
    ]
  },
  {
    name: 'gradebook_entries',
    label: 'GradeBook & Term Broadsheets',
    description: 'Continuous Assessment (CA1, CA2, Project), Terminal Exam score, letter grade, and AI audit remarks.',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'Grade entry ID' },
      { name: 'student_id', type: 'UUID', key: 'FK', nullable: false, desc: 'References students(id)' },
      { name: 'subject_id', type: 'UUID', key: 'FK', nullable: false, desc: 'References subjects(id)' },
      { name: 'ca1_score', type: 'DECIMAL(5,2)', key: '-', nullable: false, desc: 'CA 1 score (max 15)' },
      { name: 'ca2_score', type: 'DECIMAL(5,2)', key: '-', nullable: false, desc: 'CA 2 score (max 15)' },
      { name: 'exam_score', type: 'DECIMAL(5,2)', key: '-', nullable: false, desc: 'Terminal Exam score (max 70)' },
      { name: 'total_score', type: 'DECIMAL(5,2)', key: '-', nullable: false, desc: 'Sum total (max 100)' },
      { name: 'grade_letter', type: 'CHAR(2)', key: '-', nullable: false, desc: 'A | B | C | D | E | F' },
      { name: 'ai_audited_remark', type: 'TEXT', key: '-', nullable: true, desc: 'Generated via Naziee Performance Advisory' }
    ]
  },
  {
    name: 'financial_ledger',
    label: 'Bursary & Financial Ledger',
    description: 'Tuition billing, payment receipts, fee items, staff payroll ledger, and revenue analytics.',
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', nullable: false, desc: 'Ledger transaction ID' },
      { name: 'student_id', type: 'UUID', key: 'FK', nullable: true, desc: 'Nullable for non-student transactions' },
      { name: 'amount', type: 'DECIMAL(12,2)', key: '-', nullable: false, desc: 'Transaction currency amount' },
      { name: 'type', type: 'VARCHAR(20)', key: '-', nullable: false, desc: 'credit_tuition | debit_expense | payroll' },
      { name: 'reference_no', type: 'VARCHAR(100)', key: 'UQ', nullable: false, desc: 'Payment receipt tracking code' },
      { name: 'channel', type: 'VARCHAR(50)', key: '-', nullable: false, desc: 'bank_transfer | pos | online | cash' }
    ]
  }
];

export const CHINONYE_AI_MODULES = [
  {
    name: 'Chinonye Co-Pilot',
    endpoint: '/api/ai/assistant-chat',
    model: 'Gemini 3.6 Flash & 3.1 Pro',
    role: 'Contextual Workspace & 360° Admin Co-Pilot',
    description: 'Floating institutional companion from Ngwa, Abia State with real-time awareness of active tab, user role, subscription tier, and portal tools.'
  },
  {
    name: 'Chinonye Scholar AI',
    endpoint: '/api/ai/scholar',
    model: 'Gemini 3.6 Flash',
    role: 'Socratic Homework Mentor & CBT Practice Engine',
    description: 'Interactive student study partner providing step-by-step guidance, theorem rules, and instant CBT drills.'
  },
  {
    name: 'Chinonye Exam Architect',
    endpoint: '/api/cbt/generate-questions',
    model: 'Gemini 3.6 Flash',
    role: 'Text-to-Questions & CBT Item Generator',
    description: 'Generates standard multiple-choice CBT questions from topic prompts or pasted reading passage text.'
  },
  {
    name: 'Chinonye Faculty Mentor AI',
    endpoint: '/api/cbt/generate-intervention-plan',
    model: 'Gemini 3.6 Flash',
    role: 'Pedagogic Diagnosis & Remediation Planner',
    description: 'Analyzes subject performance gaps against school benchmarks to output a 4-week structured teacher roadmap.'
  },
  {
    name: 'Chinonye Narrative Synthesizer',
    endpoint: '/api/reportcard/generate-auto-comment',
    model: 'Gemini 3.6 Flash',
    role: 'Personalized Report Card Remark Engine',
    description: 'Generates constructive, multi-sentence narrative evaluations for student term report cards.'
  }
];

export function PrdVisualExplorerModal({ isOpen, onClose }: PrdVisualExplorerModalProps) {
  const [activeTab, setActiveTab] = useState<'erd' | 'ai' | 'workflows' | 'export'>('erd');
  const [selectedTable, setSelectedTable] = useState<string>('schools');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeTableObj = DATABASE_SCHEMA_TABLES.find(t => t.name === selectedTable) || DATABASE_SCHEMA_TABLES[0];

  const generateFullPrdMarkdown = () => {
    return `# CornerStreams Intelligence Platform - Product Requirement Document (PRD) & Blueprint

## 1. Executive Overview
**CornerStreams Intelligence** is a paperless, cloud-native educational management ecosystem designed for modern primary and secondary institutions.

### Core Modules:
- **Identity & RBAC**: Multi-campus governance, custom role permissions, secure student dossier.
- **Bursary Clearance Gate**: Real-time tuition payment tracking and automatic grade release control.
- **CBT Examination Engine**: Full-screen timed CBT tests, auto-grading, offline sync, and question generation.
- **Academic Broadsheets**: Continuous assessment (CA1, CA2) + Exam broadsheets, automated GPA, and ranking.
- **Chinonye AI Suite**: 5 specialized Gemini-powered intelligence agents for students, teachers, and admins.

---

## 2. Database Schema (Relational Blueprint)
${DATABASE_SCHEMA_TABLES.map(t => `
### Table: \`${t.name}\`
*Description: ${t.description}*

| Field Name | Type | Key | Nullable | Description |
|---|---|---|---|---|
${t.fields.map(f => `| \`${f.name}\` | \`${f.type}\` | ${f.key} | ${f.nullable ? 'YES' : 'NO'} | ${f.desc} |`).join('\n')}
`).join('\n\n')}

---

## 3. Chinonye AI Suite Specifications
${CHINONYE_AI_MODULES.map(m => `
### ${m.name}
- **REST Endpoint**: \`${m.endpoint}\`
- **Underlying Engine**: \`${m.model}\`
- **Functional Role**: ${m.role}
- **Description**: ${m.description}
`).join('\n')}

---

## 4. Key Architectural Workflows
1. **Bursary Gate**: Student logs in -> Bursary status checked -> If uncleared, CBT & Report Card access blocked until cleared.
2. **CBT Engine**: Test published -> Randomized question rendering -> Auto-submit timer -> Instant gradebook insertion.
3. **Report Card Pipeline**: Grades finalized -> Chinonye Narrative Synthesizer generates teacher remarks -> Principal signs -> Print/PDF preview unlocked.

*Generated on: ${new Date().toISOString()} for CornerStreams Intelligence Platform*
`;
  };

  const handleCopyPrd = () => {
    navigator.clipboard.writeText(generateFullPrdMarkdown());
    setCopied(true);
    toast.success('Complete PRD & Database Schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPrd = () => {
    const text = generateFullPrdMarkdown();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CornerStreams_PRD_Blueprint.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded CornerStreams_PRD_Blueprint.md');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-indigo-950 border border-indigo-800/80 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-white font-sans"
        >
          {/* HEADER BAR */}
          <div className="px-6 py-4 bg-indigo-900/90 border-b border-indigo-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl shadow-md border border-indigo-400/30">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-display">
                    CornerStreams Intelligence PRD Explorer
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold rounded-full uppercase">
                    v3.6 Live Blueprint
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 font-medium">
                  Interactive Database ERD, Chinonye AI Suite Specification &amp; System Architecture Hub
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-indigo-300 hover:text-white hover:bg-indigo-800/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB NAVIGATION BAR */}
          <div className="px-6 py-2.5 bg-indigo-950/90 border-b border-indigo-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab('erd')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'erd' 
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md' 
                    : 'text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Database ERD Schema</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'ai' 
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md' 
                    : 'text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Chinonye AI Suite Blueprint</span>
              </button>

              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'workflows' 
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md' 
                    : 'text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>System Workflows</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'export' 
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md' 
                    : 'text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-300" />
                <span>Full PRD Export</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrd}
                className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700/60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-300" />}
                <span>{copied ? 'Copied!' : 'Copy PRD'}</span>
              </button>

              <button
                onClick={handleDownloadPrd}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* 1. DATABASE ERD SCHEMA TAB */}
            {activeTab === 'erd' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* TABLE LIST SIDEBAR */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 font-mono">
                      Database Tables ({DATABASE_SCHEMA_TABLES.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {DATABASE_SCHEMA_TABLES.map((tbl) => {
                      const isSelected = selectedTable === tbl.name;
                      return (
                        <button
                          key={tbl.name}
                          onClick={() => setSelectedTable(tbl.name)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'bg-gradient-to-r from-indigo-900 to-indigo-800 border-emerald-500/80 shadow-lg text-white' 
                              : 'bg-indigo-900/30 hover:bg-indigo-900/60 border-indigo-800/60 text-indigo-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Table className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-indigo-400'}`} />
                              <span className="text-xs font-black font-mono tracking-wide">{tbl.name}</span>
                            </div>
                            <p className="text-[10px] text-indigo-300 line-clamp-1">{tbl.label}</p>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-indigo-950/80 border border-indigo-800 text-emerald-400 rounded-md">
                            {tbl.fields.length} cols
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TABLE DETAILS & FIELD MATRIX */}
                <div className="lg:col-span-8 bg-indigo-900/40 border border-indigo-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between border-b border-indigo-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg uppercase">
                          Table: {activeTableObj.name}
                        </span>
                        <h3 className="text-base font-black text-white">{activeTableObj.label}</h3>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1 font-sans">{activeTableObj.description}</p>
                    </div>
                  </div>

                  {/* FIELD LIST TABLE */}
                  <div className="overflow-x-auto rounded-xl border border-indigo-800/80 bg-indigo-950/90">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-indigo-900/80 text-indigo-300 border-b border-indigo-800/80 text-[10px] font-black uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Column Name</th>
                          <th className="py-2.5 px-3">Data Type</th>
                          <th className="py-2.5 px-3 text-center">Key</th>
                          <th className="py-2.5 px-3 text-center">Nullable</th>
                          <th className="py-2.5 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-900/60 text-slate-200 text-[11px]">
                        {activeTableObj.fields.map((fld) => (
                          <tr key={fld.name} className="hover:bg-indigo-900/40 transition">
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                              <Code className="w-3 h-3 text-indigo-400" />
                              <span>{fld.name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-emerald-400 font-semibold">{fld.type}</td>
                            <td className="py-2.5 px-3 text-center">
                              {fld.key !== '-' ? (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  fld.key === 'PK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  fld.key === 'FK' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {fld.key}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {fld.nullable ? <span className="text-amber-400">YES</span> : <span className="text-slate-400">NO</span>}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px]">{fld.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ASTRA AI SUITE BLUEPRINT TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-r from-indigo-900 to-emerald-950 border border-indigo-700/80 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Chinonye AI Intelligence Matrix</h3>
                    </div>
                    <p className="text-xs text-indigo-200">
                      5 specialized Gemini model proxies operating server-side on Express endpoints with lazy initializers and key isolation.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                    Server Proxy Secured
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHINONYE_AI_MODULES.map((mod) => (
                    <div key={mod.name} className="p-5 bg-indigo-900/40 border border-indigo-800/80 rounded-2xl space-y-3 hover:border-emerald-500/50 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            {mod.name}
                          </h4>
                          <span className="text-[10px] text-amber-300 font-mono font-bold">{mod.role}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-[9px] rounded font-bold">
                          {mod.model}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-100 font-sans leading-relaxed">{mod.description}</p>

                      <div className="p-2.5 bg-indigo-950/80 border border-indigo-800/80 rounded-xl flex items-center justify-between text-[10px] font-mono">
                        <span className="text-indigo-300">Endpoint:</span>
                        <span className="text-emerald-400 font-bold">{mod.endpoint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. WORKFLOWS TAB */}
            {activeTab === 'workflows' && (
              <div className="space-y-5">
                <div className="p-5 bg-indigo-900/40 border border-indigo-800/80 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Bursary Clearance Gate Workflow
                  </h3>
                  <p className="text-xs text-slate-300">
                    Prevents non-paying or uncleared students from accessing active CBT examination rooms or viewing terminal paperless report cards.
                  </p>
                  <div className="p-4 bg-indigo-950/90 rounded-xl border border-indigo-800 font-mono text-xs text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-indigo-900 rounded text-amber-300 font-bold">STEP 1</span>
                      <span>Student authenticates via Admission Number &amp; Password</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-500 mx-auto" />
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-indigo-900 rounded text-amber-300 font-bold">STEP 2</span>
                      <span>System queries <code className="text-white">students.bursary_status</code></span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-500 mx-auto" />
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-indigo-900 rounded text-emerald-400 font-bold">BRANCH A (Cleared)</span>
                      <span>CBT Room &amp; Digital Report Card Unlocked</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-300">
                      <span className="p-1 bg-indigo-900 rounded text-rose-400 font-bold">BRANCH B (Debtor)</span>
                      <span>Redirect to Financial Ledger &amp; Bursary Payment Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. EXPORT TAB */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 font-mono">
                    Markdown PRD &amp; Schema Raw Preview
                  </h3>
                  <button
                    onClick={handleCopyPrd}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Full Document'}</span>
                  </button>
                </div>

                <div className="p-4 bg-indigo-950 rounded-2xl border border-indigo-800 font-mono text-xs text-indigo-200 max-h-[400px] overflow-y-auto whitespace-pre-wrap select-all">
                  {generateFullPrdMarkdown()}
                </div>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="px-6 py-3.5 bg-indigo-900/80 border-t border-indigo-800 flex items-center justify-between text-xs text-indigo-300 font-mono shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CornerStreams Intelligence &bull; Production Architecture Ready</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close Explorer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
