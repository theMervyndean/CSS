import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  X, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  Calculator, 
  Layers, 
  Award, 
  Info, 
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export interface GradingSchemeWeights {
  ca1: number;
  ca2: number;
  ca3: number;
  ca4: number;
  exam: number;
}

export interface GradingSchemeConfig {
  id: string; // '10-10-10-10-60' | '5-5-5-5-80' | '20-20-60' | 'custom'
  name: string;
  description: string;
  weights: GradingSchemeWeights;
  caCount: number; // 2 or 4
  gradeScale: {
    aMin: number;
    bMin: number;
    cMin: number;
    dMin: number;
    eMin: number;
  };
}

export const PRESET_GRADING_SCHEMES: GradingSchemeConfig[] = [
  {
    id: '10-10-10-10-60',
    name: '10, 10, 10, 10, 60 (Standard 4-CA Scheme)',
    description: '4 Continuous Assessments (10% each = 40%) + 60% Terminal Examination.',
    weights: { ca1: 10, ca2: 10, ca3: 10, ca4: 10, exam: 60 },
    caCount: 4,
    gradeScale: { aMin: 80, bMin: 70, cMin: 50, dMin: 40, eMin: 30 }
  },
  {
    id: '5-5-5-5-80',
    name: '5, 5, 5, 5, 80 (Heavy Exam 4-CA Scheme)',
    description: '4 Continuous Assessments (5% each = 20%) + 80% Terminal Examination.',
    weights: { ca1: 5, ca2: 5, ca3: 5, ca4: 5, exam: 80 },
    caCount: 4,
    gradeScale: { aMin: 80, bMin: 70, cMin: 50, dMin: 40, eMin: 30 }
  },
  {
    id: '20-20-60',
    name: '20, 20, 60 (Mid-Term 2-CA Scheme)',
    description: '2 Continuous Assessments (20% each = 40%) + 60% Terminal Examination.',
    weights: { ca1: 20, ca2: 20, ca3: 0, ca4: 0, exam: 60 },
    caCount: 2,
    gradeScale: { aMin: 80, bMin: 70, cMin: 50, dMin: 40, eMin: 30 }
  }
];

export const DEFAULT_GRADING_SCHEME: GradingSchemeConfig = PRESET_GRADING_SCHEMES[0];

export function getStoredGradingScheme(): GradingSchemeConfig {
  try {
    const saved = localStorage.getItem('CS_GRADING_SCHEME_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.weights) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load grading scheme from storage', e);
  }
  return DEFAULT_GRADING_SCHEME;
}

interface GradingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveScheme?: (scheme: GradingSchemeConfig) => void;
}

export function GradingSystemModal({ isOpen, onClose, onSaveScheme }: GradingSystemModalProps) {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(() => {
    return getStoredGradingScheme().id;
  });

  const [customWeights, setCustomWeights] = useState<GradingSchemeWeights>(() => {
    const active = getStoredGradingScheme();
    return active.weights;
  });

  const [customCaCount, setCustomCaCount] = useState<number>(() => {
    return getStoredGradingScheme().caCount || 4;
  });

  const [gradeScale, setGradeScale] = useState({
    aMin: 80,
    bMin: 70,
    cMin: 50,
    dMin: 40,
    eMin: 30
  });

  useEffect(() => {
    if (isOpen) {
      const active = getStoredGradingScheme();
      setSelectedSchemeId(active.id);
      setCustomWeights(active.weights);
      setCustomCaCount(active.caCount);
      if (active.gradeScale) {
        setGradeScale(active.gradeScale);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCustomMode = selectedSchemeId === 'custom';

  const currentWeights: GradingSchemeWeights = isCustomMode
    ? customWeights
    : (PRESET_GRADING_SCHEMES.find((s) => s.id === selectedSchemeId)?.weights || DEFAULT_GRADING_SCHEME.weights);

  const totalSum = currentWeights.ca1 + currentWeights.ca2 + currentWeights.ca3 + currentWeights.ca4 + currentWeights.exam;
  const isValidSum = totalSum === 100;

  const handleSelectPreset = (scheme: GradingSchemeConfig) => {
    setSelectedSchemeId(scheme.id);
    setCustomWeights(scheme.weights);
    setCustomCaCount(scheme.caCount);
  };

  const handleSave = () => {
    if (!isValidSum) {
      toast.error(`Invalid total weight distribution (${totalSum}%). Assessment weights must sum up to exactly 100%.`);
      return;
    }

    let finalScheme: GradingSchemeConfig;

    if (isCustomMode) {
      finalScheme = {
        id: 'custom',
        name: `Custom Scheme (${customWeights.ca1}/${customWeights.ca2}${customCaCount === 4 ? `/${customWeights.ca3}/${customWeights.ca4}` : ''}/${customWeights.exam})`,
        description: 'School custom assessment weight distribution.',
        weights: customWeights,
        caCount: customCaCount,
        gradeScale
      };
    } else {
      const preset = PRESET_GRADING_SCHEMES.find((s) => s.id === selectedSchemeId) || DEFAULT_GRADING_SCHEME;
      finalScheme = {
        ...preset,
        gradeScale
      };
    }

    try {
      localStorage.setItem('CS_GRADING_SCHEME_CONFIG', JSON.stringify(finalScheme));
      window.dispatchEvent(new Event('cs-grading-scheme-updated'));
      if (onSaveScheme) {
        onSaveScheme(finalScheme);
      }
      toast.success(`Grading system scheme successfully updated to "${finalScheme.name}"!`);
      onClose();
    } catch (e) {
      toast.error('Failed to persist grading scheme configuration.');
    }
  };

  const handleResetToDefault = () => {
    setSelectedSchemeId(DEFAULT_GRADING_SCHEME.id);
    setCustomWeights(DEFAULT_GRADING_SCHEME.weights);
    setCustomCaCount(DEFAULT_GRADING_SCHEME.caCount);
    setGradeScale(DEFAULT_GRADING_SCHEME.gradeScale);
    toast.info('Reset scheme options to standard 10,10,10,10,60 baseline.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl shadow-md text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-black text-white uppercase tracking-tight">
                  Edit School Grading System
                </h2>
                <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md uppercase">
                  Assessment Weights
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configure Continuous Assessment (CA) and Examination percentage weight distributions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* PRESET SCHEME SELECTION OPTIONS */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Select Grading Scheme Breakdown:</span>
              <span className="text-[10px] text-indigo-600 font-mono font-bold">Total must equal 100%</span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {PRESET_GRADING_SCHEMES.map((scheme) => {
                const isSelected = selectedSchemeId === scheme.id;
                const weightsStr = scheme.caCount === 4 
                  ? `${scheme.weights.ca1}%, ${scheme.weights.ca2}%, ${scheme.weights.ca3}%, ${scheme.weights.ca4}%, ${scheme.weights.exam}%`
                  : `${scheme.weights.ca1}%, ${scheme.weights.ca2}%, ${scheme.weights.exam}%`;

                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => handleSelectPreset(scheme)}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-50/90 via-emerald-50/50 to-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{scheme.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 pl-6">{scheme.description}</p>
                    </div>

                    <div className="pl-6 sm:pl-0 shrink-0 flex items-center gap-2 font-mono">
                      <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 font-black text-xs rounded-lg border border-slate-800 shadow-2xs">
                        {weightsStr}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* CUSTOM SCHEME OPTION */}
              <button
                type="button"
                onClick={() => setSelectedSchemeId('custom')}
                className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCustomMode
                    ? 'bg-gradient-to-r from-indigo-50/90 via-emerald-50/50 to-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isCustomMode ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {isCustomMode && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="font-bold text-sm text-slate-900">Custom Weight Distribution</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">Specify exact percentage allocations for CA tests & examination.</p>
                </div>

                <div className="pl-6 sm:pl-0 shrink-0 flex items-center gap-2 font-mono">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-bold text-xs rounded-lg border border-indigo-200">
                    Custom Breakdown
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* CUSTOM WEIGHT INPUTS PANEL (Visible if Custom Selected) */}
          {isCustomMode && (
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-indigo-900/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  Define Custom CA & Exam Allocations
                </span>
                {/* Frequency toggle */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCaCount(2);
                      setCustomWeights((prev) => ({ ...prev, ca3: 0, ca4: 0, ca1: 20, ca2: 20, exam: 60 }));
                    }}
                    className={`px-2 py-0.5 rounded transition ${customCaCount === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    2 CAs
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCaCount(4);
                      setCustomWeights((prev) => ({ ...prev, ca1: 10, ca2: 10, ca3: 10, ca4: 10, exam: 60 }));
                    }}
                    className={`px-2 py-0.5 rounded transition ${customCaCount === 4 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    4 CAs
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CA 1 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={customWeights.ca1}
                    onChange={(e) => setCustomWeights({ ...customWeights, ca1: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-center focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CA 2 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={customWeights.ca2}
                    onChange={(e) => setCustomWeights({ ...customWeights, ca2: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-center focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {customCaCount === 4 && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CA 3 (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={customWeights.ca3}
                        onChange={(e) => setCustomWeights({ ...customWeights, ca3: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CA 4 (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={customWeights.ca4}
                        onChange={(e) => setCustomWeights({ ...customWeights, ca4: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className={customCaCount === 2 ? 'col-span-2 sm:col-span-1' : ''}>
                  <label className="block text-[10px] text-amber-300 font-bold uppercase mb-1">Exam (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={customWeights.exam}
                    onChange={(e) => setCustomWeights({ ...customWeights, exam: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full h-9 px-2.5 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-300 font-bold text-center focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VISUAL WEIGHT DISTRIBUTION PROPORTION BAR */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-600 uppercase text-[10px]">Active Scheme Visual Ratio:</span>
              <span className={isValidSum ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                Total: {totalSum}% {isValidSum ? '✓ Valid' : '⚠️ Must sum to 100%'}
              </span>
            </div>

            <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex font-mono text-[9px] font-black text-white text-center">
              {currentWeights.ca1 > 0 && (
                <div 
                  style={{ width: `${currentWeights.ca1}%` }} 
                  className="bg-indigo-600 flex items-center justify-center border-r border-slate-950/20 truncate px-1"
                  title={`CA 1: ${currentWeights.ca1}%`}
                >
                  {currentWeights.ca1}%
                </div>
              )}
              {currentWeights.ca2 > 0 && (
                <div 
                  style={{ width: `${currentWeights.ca2}%` }} 
                  className="bg-indigo-500 flex items-center justify-center border-r border-slate-950/20 truncate px-1"
                  title={`CA 2: ${currentWeights.ca2}%`}
                >
                  {currentWeights.ca2}%
                </div>
              )}
              {currentWeights.ca3 > 0 && (
                <div 
                  style={{ width: `${currentWeights.ca3}%` }} 
                  className="bg-indigo-400 flex items-center justify-center border-r border-slate-950/20 truncate px-1"
                  title={`CA 3: ${currentWeights.ca3}%`}
                >
                  {currentWeights.ca3}%
                </div>
              )}
              {currentWeights.ca4 > 0 && (
                <div 
                  style={{ width: `${currentWeights.ca4}%` }} 
                  className="bg-teal-500 flex items-center justify-center border-r border-slate-950/20 truncate px-1"
                  title={`CA 4: ${currentWeights.ca4}%`}
                >
                  {currentWeights.ca4}%
                </div>
              )}
              {currentWeights.exam > 0 && (
                <div 
                  style={{ width: `${currentWeights.exam}%` }} 
                  className="bg-emerald-600 flex items-center justify-center truncate px-1"
                  title={`Exam: ${currentWeights.exam}%`}
                >
                  EXAM ({currentWeights.exam}%)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> Continuous Assessment ({currentWeights.ca1 + currentWeights.ca2 + currentWeights.ca3 + currentWeights.ca4}%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Terminal Exam ({currentWeights.exam}%)</span>
              </div>
              <span className="font-bold text-slate-700">100% Total Aggregate</span>
            </div>
          </div>

          {/* LETTER GRADE BENCHMARKS PREVIEW */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider block">
              Academic Grade Letter Thresholds (Standard 5.0 Scale Mapping):
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center font-mono text-xs">
              <div className="p-1.5 bg-emerald-500 text-white rounded-lg font-bold">A: ≥{gradeScale.aMin}%</div>
              <div className="p-1.5 bg-teal-500 text-white rounded-lg font-bold">B: {gradeScale.bMin}-{gradeScale.aMin - 1}%</div>
              <div className="p-1.5 bg-amber-500 text-white rounded-lg font-bold">C: {gradeScale.cMin}-{gradeScale.bMin - 1}%</div>
              <div className="p-1.5 bg-orange-500 text-white rounded-lg font-bold">D: {gradeScale.dMin}-{gradeScale.cMin - 1}%</div>
              <div className="p-1.5 bg-rose-500 text-white rounded-lg font-bold">E: {gradeScale.eMin}-{gradeScale.dMin - 1}%</div>
              <div className="p-1.5 bg-red-600 text-white rounded-lg font-bold">F: &lt;{gradeScale.eMin}%</div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Default (10,10,10,10,60)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isValidSum}
              onClick={handleSave}
              className={`px-5 py-2 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto ${
                isValidSum 
                  ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700' 
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Grading Scheme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
