import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, BookOpen, Clock, Users, ShieldCheck, 
  Sparkles, CheckCircle2, UserCheck, Layers
} from 'lucide-react';
import HomeroomClassRegister from './attendance/HomeroomClassRegister';
import SubjectTeachingRegister from './attendance/SubjectTeachingRegister';
import StaffClockInLedger from './attendance/StaffClockInLedger';

export interface DailyAttendanceRegisterProps {
  currentProfile?: any;
  activeSession?: string;
  activeTerm?: string;
  schoolInfo?: {
    name?: string;
    logo_url?: string;
  };
  initialSubTab?: 'homeroom' | 'subject' | 'staff';
}

export function DailyAttendanceRegister({
  currentProfile,
  activeSession = '2025/2026',
  activeTerm = '1st Term',
  schoolInfo,
  initialSubTab
}: DailyAttendanceRegisterProps) {
  // Determine default sub-tab based on user's role
  const defaultTab = initialSubTab || (() => {
    if (currentProfile?.role === 'Class_Teacher') return 'homeroom';
    if (currentProfile?.role === 'Non_Class_Teacher') return 'subject';
    return 'homeroom';
  })();

  const [activeSubTab, setActiveSubTab] = useState<'homeroom' | 'subject' | 'staff'>(defaultTab);

  const tabs = [
    {
      id: 'homeroom' as const,
      label: 'Homeroom Daily Class Register',
      badge: 'Class Teachers',
      icon: Calendar,
      description: 'Morning & afternoon student roll call register per class arm'
    },
    {
      id: 'subject' as const,
      label: 'Subject Lesson Teaching Register',
      badge: 'Subject Teachers',
      icon: BookOpen,
      description: 'Period delivery, syllabus topics, class diary & period truancy check'
    },
    {
      id: 'staff' as const,
      label: 'Staff Login & Clock-In Desk',
      badge: 'Teachers & Staff',
      icon: Clock,
      description: 'Faculty self-service clock-in, duty logs & punctuality ledger'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 3-TIER SUB-NAVIGATION SWITCHER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 p-3 rounded-xl transition-all text-left flex items-center gap-3 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE SUB-TAB CONTENT CONTAINER */}
      <div>
        {activeSubTab === 'homeroom' && (
          <HomeroomClassRegister
            currentProfile={currentProfile}
            activeSession={activeSession}
            activeTerm={activeTerm}
            schoolInfo={schoolInfo}
          />
        )}

        {activeSubTab === 'subject' && (
          <SubjectTeachingRegister
            currentProfile={currentProfile}
            activeSession={activeSession}
            activeTerm={activeTerm}
            schoolInfo={schoolInfo}
          />
        )}

        {activeSubTab === 'staff' && (
          <StaffClockInLedger
            currentProfile={currentProfile}
            activeSession={activeSession}
            activeTerm={activeTerm}
            schoolInfo={schoolInfo}
          />
        )}
      </div>
    </div>
  );
}

export default DailyAttendanceRegister;
