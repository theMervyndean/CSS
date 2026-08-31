import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, X, Download, FileText, CheckCircle2, HelpCircle, 
  Sparkles, Sliders, Eye, BookOpen, Clock, Award, ShieldCheck,
  Check, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintOnlySchoolHeader } from './PrintOnlySchoolHeader';

export interface CbtQuestion {
  id: string | number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks?: number;
}

export interface CbtExamRecord {
  id: string;
  title: string;
  subject: string;
  classCohort: string;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  questions: CbtQuestion[];
  instructions?: string;
}

export interface CbtExamPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: CbtExamRecord;
}

const DEFAULT_MOCK_EXAM: CbtExamRecord = {
  id: 'EXAM-2026-PHYS',
  title: '1st Term Terminal Examination: Physics',
  subject: 'Physics & Applied Sciences',
  classCohort: 'SS 2 Science A',
  durationMinutes: 45,
  totalMarks: 50,
  passingScore: 25,
  instructions: 'Answer all 5 questions. Read each question carefully before choosing your option. Calculators and logarithm tables are permitted.',
  questions: [
    {
      id: 1,
      question: 'A car accelerates uniformly from rest to a velocity of 20 m/s in 5 seconds. What is the acceleration of the car?',
      options: ['2.0 m/s²', '4.0 m/s²', '5.0 m/s²', '10.0 m/s²'],
      correctAnswer: 1,
      explanation: 'Acceleration a = (v - u) / t = (20 - 0) / 5 = 4.0 m/s².',
      marks: 10
    },
    {
      id: 2,
      question: 'Which of the following electromagnetic waves has the highest frequency?',
      options: ['Radio waves', 'Microwaves', 'Gamma rays', 'Infrared rays'],
      correctAnswer: 2,
      explanation: 'Gamma rays possess the shortest wavelength and highest frequency in the electromagnetic spectrum.',
      marks: 10
    },
    {
      id: 3,
      question: 'Calculate the work done when a force of 50 N moves an object through a distance of 8 meters in the direction of the force.',
      options: ['400 Joules', '200 Joules', '100 Joules', '50 Joules'],
      correctAnswer: 0,
      explanation: 'Work done W = Force × Distance = 50 N × 8 m = 400 J.',
      marks: 10
    },
    {
      id: 4,
      question: 'According to Ohm\'s law, the current passing through a conductor is directly proportional to the:',
      options: ['Resistance', 'Potential difference across its ends', 'Temperature', 'Length of the wire'],
      correctAnswer: 1,
      explanation: 'Ohm\'s Law states V = IR, meaning current I is directly proportional to potential difference V at constant temperature.',
      marks: 10
    },
    {
      id: 5,
      question: 'What is the standard SI unit for measuring thermodynamic temperature?',
      options: ['Degree Celsius', 'Fahrenheit', 'Kelvin', 'Joule'],
      correctAnswer: 2,
      explanation: 'Kelvin (K) is the SI base unit of thermodynamic temperature.',
      marks: 10
    }
  ]
};

export function CbtExamPrintPreviewModal({
  isOpen,
  onClose,
  exam = DEFAULT_MOCK_EXAM
}: CbtExamPrintPreviewModalProps) {
  const [docType, setDocType] = useState<'question_paper' | 'answer_key' | 'omr_sheet'>('question_paper');
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [fontSize, setFontSize] = useState<'standard' | 'compact' | 'large'>('standard');

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-white font-sans"
        >
          {/* HEADER TOOLBAR (Hidden in print) */}
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl shadow border border-indigo-400/30">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-display">
                  CBT Examination Paper Print Preview
                </h2>
                <p className="text-xs text-slate-400">
                  Formatted A4 printable question paper, OMR answer sheet, and marking scheme
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerPrint}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DOCUMENT CONFIGURATION CONTROL BAR (Hidden in print) */}
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
            {/* Doc Type Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDocType('question_paper')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  docType === 'question_paper' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Question Paper</span>
              </button>

              <button
                onClick={() => setDocType('answer_key')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  docType === 'answer_key' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Teacher Answer Key</span>
              </button>

              <button
                onClick={() => setDocType('omr_sheet')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  docType === 'omr_sheet' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Offline OMR Sheet</span>
              </button>
            </div>

            {/* Font Size & Explanations Option */}
            <div className="flex items-center gap-4">
              {docType === 'answer_key' && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={includeExplanations}
                    onChange={(e) => setIncludeExplanations(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Include Socratic Explanations</span>
                </label>
              )}

              <div className="flex items-center gap-1 text-slate-400">
                <Sliders className="w-3.5 h-3.5" />
                <span>Text Scale:</span>
                <select
                  value={fontSize}
                  onChange={(e: any) => setFontSize(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 outline-none font-mono"
                >
                  <option value="compact">Compact (Dense)</option>
                  <option value="standard">Standard A4</option>
                  <option value="large">Large (High-Legibility)</option>
                </select>
              </div>
            </div>
          </div>

          {/* PRINTABLE PREVIEW SHEET CONTAINER */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-950 flex justify-center">
            <div className={`bg-white text-slate-900 w-full max-w-[800px] shadow-2xl rounded-xl p-8 sm:p-12 space-y-6 font-sans border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 ${
              fontSize === 'compact' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
            }`}>
              {/* PRINTABLE OFFICIAL SCHOOL HEADER */}
              <PrintOnlySchoolHeader />

              {/* EXAMINATION TITLE & DETAILS BLOCK */}
              <div className="border-y-2 border-slate-900 py-3 my-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1 text-center sm:text-left">
                  <h1 className="text-base font-black uppercase text-slate-900 font-display">
                    {exam.title}
                  </h1>
                  <p className="font-bold text-indigo-900">
                    SUBJECT: {exam.subject.toUpperCase()} &bull; COHORT: {exam.classCohort}
                  </p>
                </div>
                <div className="text-right space-y-1 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-4">
                  <p><strong>TIME ALLOWED:</strong> {exam.durationMinutes} MINS</p>
                  <p><strong>MAXIMUM MARKS:</strong> {exam.totalMarks} MARKS</p>
                  <p><strong>PASSING BENCHMARK:</strong> {exam.passingScore} MARKS</p>
                </div>
              </div>

              {/* CANDIDATE INFO BOX */}
              <div className="border border-slate-300 bg-slate-50 p-4 rounded-lg space-y-2 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-bold block">STUDENT CANDIDATE NAME:</span>
                    <div className="border-b-2 border-slate-400 h-6 mt-1" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">ADMISSION / REGISTRATION NO:</span>
                    <div className="border-b-2 border-slate-400 h-6 mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <span className="text-slate-500 font-bold block">DESK / SEAT NO:</span>
                    <div className="border-b border-slate-300 h-5 mt-1" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">INVIGILATOR SIGN:</span>
                    <div className="border-b border-slate-300 h-5 mt-1" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">EXAM DATE:</span>
                    <div className="border-b border-slate-300 h-5 mt-1" />
                  </div>
                </div>
              </div>

              {/* GENERAL INSTRUCTIONS */}
              {docType === 'question_paper' && (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs leading-relaxed space-y-1">
                  <p className="font-extrabold uppercase font-mono">General Instructions:</p>
                  <p>{exam.instructions}</p>
                </div>
              )}

              {/* 1. QUESTION PAPER VIEW */}
              {docType === 'question_paper' && (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                      Section A: Multiple Choice Questions ({exam.questions.length} Items)
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Each Question carries equal marks
                    </span>
                  </div>

                  <div className="space-y-6">
                    {exam.questions.map((q, qIdx) => (
                      <div key={q.id} className="space-y-2 border-b border-slate-100 pb-4">
                        <div className="flex items-start gap-2">
                          <span className="font-black font-mono text-indigo-900 text-xs shrink-0">
                            Q{qIdx + 1}.
                          </span>
                          <p className="font-bold text-slate-900 leading-snug">
                            {q.question}
                          </p>
                          {q.marks && (
                            <span className="ml-auto font-mono text-[10px] text-slate-400 font-bold shrink-0">
                              [{q.marks} marks]
                            </span>
                          )}
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-6">
                          {q.options.map((opt, oIdx) => {
                            const optionLetter = String.fromCharCode(65 + oIdx);
                            return (
                              <div key={oIdx} className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-lg bg-white text-xs">
                                <span className="w-5 h-5 rounded bg-slate-100 border border-slate-300 flex items-center justify-center font-black font-mono text-[10px] text-slate-700 shrink-0">
                                  {optionLetter}
                                </span>
                                <span className="font-medium text-slate-800">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TEACHER ANSWER KEY VIEW */}
              {docType === 'answer_key' && (
                <div className="space-y-6 pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-mono flex items-center justify-between">
                    <span className="font-black uppercase">Official Master Answer Key &amp; Marking Scheme</span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded">Confidential - Staff Only</span>
                  </div>

                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead className="bg-slate-100 font-mono font-black text-slate-700 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5 border border-slate-300 text-center">Item #</th>
                        <th className="p-2.5 border border-slate-300">Question Abstract</th>
                        <th className="p-2.5 border border-slate-300 text-center">Correct Key</th>
                        <th className="p-2.5 border border-slate-300 text-center">Marks</th>
                        {includeExplanations && <th className="p-2.5 border border-slate-300">Socratic Explanation</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {exam.questions.map((q, idx) => {
                        const correctLetter = String.fromCharCode(65 + q.correctAnswer);
                        return (
                          <tr key={q.id} className="hover:bg-slate-50">
                            <td className="p-2.5 border border-slate-300 font-mono font-bold text-center">Q{idx + 1}</td>
                            <td className="p-2.5 border border-slate-300 font-medium text-slate-900 truncate max-w-[200px]">{q.question}</td>
                            <td className="p-2.5 border border-slate-300 text-center">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-mono font-black rounded border border-emerald-300">
                                Option {correctLetter}
                              </span>
                            </td>
                            <td className="p-2.5 border border-slate-300 font-mono font-bold text-center">{q.marks || 10}</td>
                            {includeExplanations && (
                              <td className="p-2.5 border border-slate-300 text-slate-600 italic text-xs">
                                {q.explanation || 'No step explanation recorded.'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. OFFLINE OMR SHEET VIEW */}
              {docType === 'omr_sheet' && (
                <div className="space-y-6 pt-2">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs font-mono">
                    <p className="font-black uppercase">Standard Offline OMR Response Bubble Sheet</p>
                    <p className="text-[10px] text-indigo-700">Shade heavily inside the bubble corresponding to your chosen option. Use HB pencil only.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {exam.questions.map((q, idx) => (
                      <div key={q.id} className="p-2.5 border border-slate-300 rounded-lg bg-slate-50/50 flex items-center justify-between text-xs font-mono">
                        <span className="font-black text-slate-700">Q{idx + 1}.</span>
                        <div className="flex items-center gap-2">
                          {['A', 'B', 'C', 'D'].map((letter) => (
                            <div key={letter} className="flex flex-col items-center">
                              <span className="text-[8px] text-slate-400">{letter}</span>
                              <div className="w-5 h-5 rounded-full border-2 border-slate-400 bg-white flex items-center justify-center font-bold text-[9px] text-slate-500">
                                ○
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER VERIFICATION STAMP */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <div>
                  <p>CORNER STREAMS INTELLIGENCE &bull; OFFICIAL CBT PRINT DOCKET</p>
                  <p>EXAM PAPER CODE: {exam.id}</p>
                </div>
                <div className="text-right">
                  <p>APPROVED BY SCHOOL EXAMINATION BOARD</p>
                  <p>SECURITY STAMP VERIFIED ✅</p>
                </div>
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 print:hidden font-mono">
            <span>A4 Document Preview Ready</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CbtExamPrintPreviewModal;
