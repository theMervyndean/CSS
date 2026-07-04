/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole, UserProfile } from '../types';
import { mockUsers } from '../mockData';
import { Shield, Sparkles, User, Key, CheckCircle } from 'lucide-react';

interface RoleSimulatorProps {
  currentRole: UserRole;
  currentUserId: string;
  onRoleChange: (role: UserRole, userId: string) => void;
  isPublished: boolean;
  onTogglePublish: () => void;
}

export default function RoleSimulator({
  currentRole,
  currentUserId,
  onRoleChange,
  isPublished,
  onTogglePublish,
}: RoleSimulatorProps) {
  
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const foundUser = mockUsers.find((u) => u.id === selectedUserId);
    if (foundUser) {
      onRoleChange(foundUser.role, foundUser.id);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Super_Admin':
        return 'bg-rose-500 text-white';
      case 'School_Admin':
        return 'bg-amber-500 text-white';
      case 'Class_Teacher':
        return 'bg-indigo-600 text-white';
      case 'Non_Class_Teacher':
        return 'bg-slate-500 text-white';
      case 'Parent':
        return 'bg-emerald-600 text-white';
      case 'Student':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  const currentProfile = mockUsers.find((u) => u.id === currentUserId) || mockUsers[0];

  return (
    <div className="bg-indigo-950 text-white px-4 py-2 flex flex-col md:flex-row items-center justify-between border-b border-indigo-900 gap-2 shrink-0 select-none">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-800 p-1.5 rounded">
          <Shield className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Security Matrix Simulator</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">User Context:</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase ${getRoleBadgeColor(currentRole)}`}>
              {currentRole.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-indigo-200">({currentProfile.fullName})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-indigo-300 font-medium">Impersonate:</span>
          <select
            value={currentUserId}
            onChange={handleUserSelect}
            className="bg-indigo-900 border border-indigo-800 rounded px-2 py-0.5 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
          >
            {mockUsers.map((user) => (
              <option key={user.id} value={user.id} className="text-slate-900">
                {user.fullName} ({user.role.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Global Admin Lock Gate - Accessible to Super_Admin */}
        {currentRole === 'Super_Admin' ? (
          <div className="flex items-center gap-2 border-l border-indigo-800 pl-3">
            <span className="text-[10px] uppercase text-indigo-300 font-bold">Unreleased Gate:</span>
            <button
              onClick={onTogglePublish}
              className={`text-[9px] px-2.5 py-1 font-bold rounded uppercase tracking-wider transition ${
                isPublished 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {isPublished ? 'Grades Published (Live)' : 'Blockade Active (Secret)'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] bg-indigo-900/40 px-2 py-1 rounded border border-indigo-800">
            <span className="text-indigo-300 uppercase">Results Release State:</span>
            <span className={`font-mono font-bold ${isPublished ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPublished ? '● PUBLISHED' : '🔒 LOCKED BY ADMIN'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
