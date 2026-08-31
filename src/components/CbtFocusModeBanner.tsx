/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Minimize2, Maximize2, ShieldCheck, Sparkles } from 'lucide-react';
import { useFocusMode } from '../utils/focusMode';

interface CbtFocusModeButtonProps {
  variant?: 'toolbar' | 'compact' | 'pill' | 'header';
  className?: string;
}

export function CbtFocusModeButton({ variant = 'toolbar', className = '' }: CbtFocusModeButtonProps) {
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleFocusMode}
        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
          isFocusMode
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300'
            : 'bg-indigo-900/80 hover:bg-indigo-800 text-emerald-300 border border-indigo-700/80'
        } ${className}`}
        title={isFocusMode ? "Focus Mode Active: Click or press Esc to restore sidebar & navigation header" : "Turn On Focus Mode: Hide sidebar & navigation header to prevent distractions"}
      >
        {isFocusMode ? (
          <>
            <Minimize2 className="w-3 h-3 text-white shrink-0" />
            <span>Focus: ON</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Focus Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleFocusMode}
        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer select-none shadow-sm ${
          isFocusMode
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700'
        } ${className}`}
        title={isFocusMode ? "Focus Mode Active: Click or press Esc to restore sidebar & navigation header" : "Turn On Focus Mode: Hide sidebar & navigation header to eliminate distractions"}
      >
        <span className="flex h-2 w-2 relative">
          {isFocusMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isFocusMode ? 'bg-emerald-200' : 'bg-slate-400'}`}></span>
        </span>
        <span>{isFocusMode ? 'Focus Mode: ACTIVE' : 'Focus Mode'}</span>
        {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
      </button>
    );
  }

  // Default 'toolbar' or 'header'
  return (
    <button
      type="button"
      onClick={toggleFocusMode}
      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
        isFocusMode
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/40'
          : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700 hover:text-white'
      } ${className}`}
      title={isFocusMode ? "Focus Mode Active: Navigation & sidebars hidden (Press Esc to exit)" : "Focus Mode: Hide sidebar & navigation header to prevent accidental clicks"}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-2 w-2 relative">
          {isFocusMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isFocusMode ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
        </span>
        {isFocusMode ? (
          <Minimize2 className="w-3.5 h-3.5 text-white shrink-0" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={isFocusMode ? "text-white font-extrabold" : "text-slate-300 font-semibold"}>
          {isFocusMode ? 'Focus: ON' : 'Focus Mode'}
        </span>
        {isFocusMode && (
          <span className="text-[9px] bg-emerald-800/80 text-emerald-100 px-1.5 py-0.2 rounded uppercase tracking-wider hidden sm:inline">
            Esc
          </span>
        )}
      </div>
    </button>
  );
}

export function CbtFloatingFocusBar() {
  const { isFocusMode, disableFocusMode } = useFocusMode();

  if (!isFocusMode) return null;

  return (
    <aside aria-label="CBT Focus Mode Active" className="fixed top-2.5 right-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      <div className="bg-slate-950/90 backdrop-blur-md text-white border border-emerald-500/50 rounded-full pl-3.5 pr-1.5 py-1 shadow-2xl flex items-center gap-2.5 text-xs font-mono">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[11px] text-emerald-300 tracking-wider">FOCUS MODE</span>
          <span className="text-[9.5px] text-slate-400 hidden sm:inline">| Nav & Sidebars Hidden</span>
        </div>
        <button
          type="button"
          onClick={disableFocusMode}
          className="ml-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-sans font-bold text-[10.5px] uppercase transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Exit Focus Mode (Esc)"
        >
          <Minimize2 className="w-3 h-3 shrink-0" />
          <span>Exit (Esc)</span>
        </button>
      </div>
    </aside>
  );
}
