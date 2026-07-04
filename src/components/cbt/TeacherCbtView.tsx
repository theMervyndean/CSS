/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CbtExam, CbtSessionState, UserProfile } from '../../types';
import { 
  BookOpen, Plus, Trash2, Check, ChevronDown, Award, Users, BarChart3, 
  HelpCircle, Eye, EyeOff, Save, X, Calendar, ClipboardCheck, Percent
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherCbtViewProps {
  currentProfile: UserProfile;
  exams: CbtExam[];
  sessions: CbtSessionState[];
  students: UserProfile[];
  onAddExam: (exam: CbtExam) => void;
  onUpdateExam: (exam: CbtExam) => void;
  onDeleteExam: (examId: string) => void;
  passBenchmark: number;
  activeNavOverride?: string;
}

export default function TeacherCbtView({
  currentProfile,
  exams,
  sessions,
  students,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  passBenchmark,
  activeNavOverride
}: TeacherCbtViewProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions' | 'analytics'>('exams');

  useEffect(() => {
    if (activeNavOverride) {
      if (activeNavOverride === 'uploaded') {
        setActiveTab('exams');
      } else if (activeNavOverride === 'completed') {
        setActiveTab('submissions');
      } else if (activeNavOverride === 'live') {
        setActiveTab('analytics');
      }
    }
  }, [activeNavOverride]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Custom Select states (No Native Dropdowns)
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isCorrectDropdownOpen, setIsCorrectDropdownOpen] = useState<Record<number, boolean>>({});

  // Gemini AI generation state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isAiNumDropdownOpen, setIsAiNumDropdownOpen] = useState(false);

  const handleGenerateWithGemini = async () => {
    const trimmedTopic = aiTopic.trim();
    if (!trimmedTopic) {
      toast.error("Please enter a topic or syllabus concept.");
      return;
    }

    setIsGeneratingQuestions(true);
    const toastId = toast.loading(`Generating ${aiNumQuestions} AI-crafted questions for "${trimmedTopic}"...`);

    try {
      const response = await fetch("/api/cbt/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: trimmedTopic,
          numQuestions: aiNumQuestions,
          subject: subject,
          gradeLevel: "Grade 11 / SS 2",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate questions from server.");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response schema returned from the AI server.");
      }

      // Map generated questions to CBT Question structure
      const parsed = data.questions.map((q: any, index: number) => ({
        id: `q-temp-ai-${Date.now()}-${index}`,
        text: q.text || "",
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options.map((opt: any) => String(opt)) 
          : ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: typeof q.correctOptionIndex === "number" && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4 
          ? q.correctOptionIndex 
          : 0,
        marks: typeof q.marks === "number" ? q.marks : 10
      }));

      // Decide whether to replace or append
      // If the only question is empty, just replace it
      if (questions.length === 1 && !questions[0].text.trim()) {
        setQuestions(parsed);
        toast.success(`Successfully drafted ${parsed.length} questions for "${trimmedTopic}"!`, { id: toastId });
      } else {
        // Append them to existing
        setQuestions([...questions, ...parsed]);
        toast.success(`Appended ${parsed.length} AI questions to your template!`, { id: toastId });
      }

      setIsAiPanelOpen(false);
      setAiTopic('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during question generation.", { id: toastId });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Form states for creating a new exam
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<Array<{
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    marks: number;
  }>>([
    {
      id: 'q-temp-1',
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      marks: 10
    }
  ]);

  // Selected exam to inspect submissions for
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = useState<CbtExam | null>(
    exams.length > 0 ? exams[0] : null
  );

  // Available subjects for selection (using custom select)
  const SUBJECTS = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics'];

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      {
        id: `q-temp-${Date.now()}-${questions.length}`,
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 10
      }
    ]);
  };

  const handleRemoveQuestionField = (index: number) => {
    if (questions.length === 1) {
      toast.error("You must include at least one question in your examination template.");
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...questions];
    updated[index].text = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = val;
    setQuestions(updated);
  };

  const handleCorrectIndexChange = (qIndex: number, correctIdx: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = correctIdx;
    setQuestions(updated);
    setIsCorrectDropdownOpen(prev => ({ ...prev, [qIndex]: false }));
  };

  const handleMarksChange = (qIndex: number, val: number) => {
    const updated = [...questions];
    updated[qIndex].marks = Math.max(1, val);
    setQuestions(updated);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a valid title for this examination.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1} is empty. Please enter your question.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].trim()) {
          toast.error(`Option ${String.fromCharCode(65 + j)} for Question ${i + 1} is empty.`);
          return;
        }
      }
    }

    const newExam: CbtExam = {
      id: `ex-${Date.now()}`,
      title: title.trim(),
      subject,
      durationMinutes: Number(durationMinutes),
      questions: questions.map((q, idx) => ({
        ...q,
        id: `q-real-${idx + 1}-${Date.now()}`
      })),
      published: false // Starts as unpublished
    };

    onAddExam(newExam);
    toast.success("CBT Examination template saved successfully! Remember to publish it when ready.");
    setIsCreating(false);
    
    // Reset fields
    setTitle('');
    setSubject('Mathematics');
    setDurationMinutes(30);
    setQuestions([{ id: 'q-temp-1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 10 }]);
    setSelectedExamForSubmissions(newExam);
  };

  // Filter sessions for selected exam
  const examSubmissions = sessions.filter(s => s.examId === (selectedExamForSubmissions?.id ?? ''));

  // Calculate high-level analytics for the selected exam
  const getSelectedExamAnalytics = () => {
    if (examSubmissions.length === 0) return { avg: 0, max: 0, min: 0, passRate: 0 };
    const scores = examSubmissions.map(s => s.score ?? 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passes = examSubmissions.filter(s => (s.score ?? 0) >= passBenchmark).length;
    const passRate = Math.round((passes / examSubmissions.length) * 100);
    return { avg, max, min, passRate };
  };

  const stats = getSelectedExamAnalytics();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black uppercase text-indigo-950 font-display tracking-tight">Teacher CBT Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Define exam papers, inspect class test scores, and analyze academic weaknesses.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Exam Template
          </button>
        )}
      </div>

      {isCreating ? (
        // 1. Exam creation layout Form
        <form onSubmit={handleSaveExam} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Configure New CBT Template</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Title */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Algebra Quiz"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Subject (Custom Dropdown) */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Stream</label>
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 text-left cursor-pointer"
              >
                <span>{subject}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isSubjectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSubjectDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {SUBJECTS.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSubject(sub);
                          setIsSubjectDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                      >
                        <span>{sub}</span>
                        {subject === sub && <Check className="w-3.5 h-3.5 text-indigo-600 hover:text-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Question Matrix ({questions.length})</span>
              <button
                type="button"
                onClick={handleAddQuestionField}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-100 transition border border-indigo-150 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Question Field
              </button>
            </div>

            {/* Gemini AI Spark Banner/Panel */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-emerald-950 text-white rounded-xl p-5 border border-indigo-500/20 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-lg pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-sans">Gemini AI Assistant</h4>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Generate standard exam questions instantly with Gemini intelligence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isAiPanelOpen ? "Close Assistant" : "Draft with AI"}
                </button>
              </div>

              {isAiPanelOpen && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-white/5 relative z-10 animate-in fade-in duration-200">
                  {/* Topic Input */}
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-300 tracking-wider">Enter Topic or Syllabus Concept</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Quadratic equations, cell division, or simple past tense"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  </div>

                  {/* Quantity (Custom Select) */}
                  <div className="md:col-span-3 space-y-1 relative">
                    <label className="text-[9px] font-bold uppercase text-slate-300 tracking-wider block">Quantity</label>
                    <button
                      type="button"
                      onClick={() => setIsAiNumDropdownOpen(!isAiNumDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white cursor-pointer"
                    >
                      <span>{aiNumQuestions} Questions</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    {isAiNumDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsAiNumDropdownOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-full bg-indigo-950 border border-white/15 rounded-lg shadow-2xl z-50 py-1 text-xs">
                          {[3, 5, 10, 15].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setAiNumQuestions(num);
                                setIsAiNumDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 font-bold hover:bg-emerald-600 text-slate-100 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span>{num} Questions</span>
                              {aiNumQuestions === num && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-3 flex items-end">
                    <button
                      type="button"
                      disabled={isGeneratingQuestions || !aiTopic.trim()}
                      onClick={handleGenerateWithGemini}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 h-9"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Structuring AI...</span>
                        </>
                      ) : (
                        <>
                          <span>Spark Questions</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider font-mono">Question #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Question Statement</label>
                    <textarea
                      value={q.text}
                      onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                      placeholder="e.g. Solve the equation x² - 9 = 0."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Options Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option, optIdx) => (
                      <div key={optIdx} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Option {String.fromCharCode(65 + optIdx)}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                          placeholder={`Enter option value for ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Marks & Correct Option (No Native Select) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Correct Index Select Container */}
                    <div className="space-y-1 relative">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Correct Key Option</label>
                      <button
                        type="button"
                        onClick={() => setIsCorrectDropdownOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full flex justify-between items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <span>Option {String.fromCharCode(65 + q.correctOptionIndex)}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      {isCorrectDropdownOpen[idx] && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCorrectDropdownOpen(prev => ({ ...prev, [idx]: false }))} />
                          <div className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 w-full">
                            {[0, 1, 2, 3].map((optIndex) => (
                              <button
                                key={optIndex}
                                type="button"
                                onClick={() => handleCorrectIndexChange(idx, optIndex)}
                                className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                              >
                                <span>Option {String.fromCharCode(65 + optIndex)}</span>
                                {q.correctOptionIndex === optIndex && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Marks weight */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Marks Weight</label>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => handleMarksChange(idx, Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-250 text-slate-600 text-xs font-bold uppercase rounded-lg hover:bg-slate-50 transition"
            >
              Cancel Builder
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-white" />
              Save Examination Template
            </button>
          </div>
        </form>
      ) : (
        // 2. Normal Dashboard Tabbed workspace
        <div className="space-y-4">
          {/* Tabs header */}
          <div className="border-b border-slate-200 flex gap-4 text-xs font-bold shrink-0 uppercase select-none">
            <button
              onClick={() => setActiveTab('exams')}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exams' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Assessment Directory</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('submissions');
                if (exams.length > 0 && !selectedExamForSubmissions) {
                  setSelectedExamForSubmissions(exams[0]);
                }
              }}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submissions' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Attempts & Submissions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                if (exams.length > 0 && !selectedExamForSubmissions) {
                  setSelectedExamForSubmissions(exams[0]);
                }
              }}
              className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analytics' 
                  ? 'border-indigo-600 text-indigo-950 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Class Performance stats</span>
            </button>
          </div>

          {/* ACTIVE TAB CONTENTS */}
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {exams.map((exam) => {
                const totalAttempts = sessions.filter(s => s.examId === exam.id && s.isCompleted).length;
                return (
                  <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-bold text-indigo-700 uppercase">
                          {exam.subject}
                        </span>
                        <div className="flex gap-1.5">
                          {exam.published ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[8.5px] font-bold uppercase flex items-center gap-1">
                              <Eye className="w-3 h-3 text-emerald-600" />
                              RESULTS RELEASED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-150 rounded text-[8.5px] font-bold uppercase flex items-center gap-1">
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              REVIEWS BUFFERED
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 uppercase font-display leading-snug">
                        {exam.title}
                      </h4>

                      <div className="flex gap-4 text-[10px] text-slate-400 font-mono font-bold">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{exam.durationMinutes} Mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{exam.questions.length} MCQs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{totalAttempts} Attempts</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedExamForSubmissions(exam);
                            setActiveTab('submissions');
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg hover:bg-slate-50 transition"
                        >
                          View Submissions
                        </button>

                        <button
                          onClick={() => {
                            const updated = { ...exam, published: !exam.published };
                            onUpdateExam(updated);
                            toast.success(
                              `Exam results publication ${updated.published ? 'RELEASED' : 'REVOKED'} for ${exam.title.toUpperCase()}`
                            );
                          }}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                            exam.published
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {exam.published ? (
                            <>
                              <EyeOff className="w-3 h-3 text-white" />
                              <span>Revoke Scores</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-white" />
                              <span>Release Scores</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {exams.length === 0 && (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400 space-y-2">
                  <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-bold uppercase">No examinations built yet</p>
                  <p className="text-[11px]">Click the "Create Exam Template" button above to get started with creating assessments.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Exam Grading sheets</h3>
                  <p className="text-[11.5px] text-slate-400">Select an assessment paper to inspect registered candidate sheet score entries.</p>
                </div>

                {/* Custom Exam selector dropdown (NO Native Dropdowns) */}
                {exams.length > 0 && (
                  <div className="relative w-full sm:w-auto min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="truncate">{selectedExamForSubmissions?.title ?? "Select Examination"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isExamDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExamDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                          {exams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedExamForSubmissions(exam);
                                setIsExamDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span className="truncate mr-3">{exam.title}</span>
                              {selectedExamForSubmissions?.id === exam.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submissions Table */}
              {selectedExamForSubmissions ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-3">Candidate Name</th>
                        <th className="p-3">Candidate Code</th>
                        <th className="p-3">Score Marks</th>
                        <th className="p-3">Outcome</th>
                        <th className="p-3">Time Spent</th>
                        <th className="p-3">Submission Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {examSubmissions.map((sub, idx) => {
                        const studentObj = students.find(s => s.id === sub.studentId);
                        const isPassed = (sub.score ?? 0) >= passBenchmark;
                        
                        // Calculate duration spent
                        const durationSpentSec = selectedExamForSubmissions.durationMinutes * 60 - sub.timeLeftSeconds;
                        const minSpent = Math.floor(durationSpentSec / 60);
                        const secSpent = durationSpentSec % 60;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900">{studentObj?.fullName ?? "Unknown Student"}</td>
                            <td className="p-3 font-mono font-bold text-indigo-600">{studentObj?.username ?? sub.studentId}</td>
                            <td className="p-3 font-mono text-sm font-black">{sub.score}%</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isPassed 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                  : "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {isPassed ? "PASSED" : "FAILED"}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{minSpent}m {secSpent}s</td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(sub.lastSavedAt || "").toLocaleString()}</td>
                          </tr>
                        );
                      })}

                      {examSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400 text-xs italic">
                            No student candidate sheets has been submitted yet for this examination.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs italic">
                  Create an examination template to inspect submissions.
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 bg-white rounded-t-2xl p-5 border border-slate-200">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">CBT Analytics Dashboard</h3>
                  <p className="text-[11.5px] text-slate-400">Statistical summaries, pass indices, and cohort performance graphs.</p>
                </div>

                {/* Custom select dropdown */}
                {exams.length > 0 && (
                  <div className="relative w-full sm:w-auto min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                      className="w-full flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                    >
                      <span className="truncate">{selectedExamForSubmissions?.title ?? "Select Examination"}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {isExamDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExamDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                          {exams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedExamForSubmissions(exam);
                                setIsExamDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                            >
                              <span className="truncate mr-3">{exam.title}</span>
                              {selectedExamForSubmissions?.id === exam.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {selectedExamForSubmissions ? (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Candidate Count</p>
                        <p className="text-lg font-black text-slate-900 leading-none mt-1">{examSubmissions.length} Submitted</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Percent className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Score</p>
                        <p className="text-lg font-black text-emerald-600 leading-none mt-1">{stats.avg}% Marks</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Rate Indice</p>
                        <p className="text-lg font-black text-purple-600 leading-none mt-1">{stats.passRate}%</p>
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <BarChart3 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score Bounds</p>
                        <p className="text-sm font-black text-slate-900 leading-none mt-1.5 font-mono">
                          Min: <span className="text-rose-500 font-bold">{stats.min}%</span> / Max: <span className="text-emerald-500 font-bold">{stats.max}%</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question breakdown list */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Question Accuracy & Analytics</span>
                    </div>

                    <div className="space-y-4">
                      {selectedExamForSubmissions.questions.map((q, idx) => {
                        // Calculate percentage of students who got this right
                        const totalAnswering = examSubmissions.length;
                        const correctCount = examSubmissions.filter(s => s.answers[q.id] === q.correctOptionIndex).length;
                        const accuracy = totalAnswering > 0 ? Math.round((correctCount / totalAnswering) * 100) : 100;

                        return (
                          <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <span className="text-[10.5px] font-black uppercase text-indigo-950 font-mono">Question #{idx + 1} ({q.marks}M)</span>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0">Accuracy Index:</span>
                                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      accuracy >= 70 ? "bg-emerald-500" : accuracy >= 40 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${accuracy}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-black font-mono shrink-0 ${
                                  accuracy >= 70 ? "text-emerald-600" : accuracy >= 40 ? "text-amber-600" : "text-rose-600"
                                }`}>
                                  {accuracy}%
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-slate-850">{q.text}</p>
                            
                            {/* Options with correctness breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctOptionIndex === optIdx;
                                const choices = examSubmissions.filter(s => s.answers[q.id] === optIdx).length;
                                const percentage = totalAnswering > 0 ? Math.round((choices / totalAnswering) * 100) : 0;

                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`p-2 border rounded-lg flex justify-between items-center ${
                                      isCorrect 
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold" 
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                        isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="truncate">{opt}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono ml-2 shrink-0">{percentage}% ({choices})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs italic">
                  Build and upload examination templates first to view metrics.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
