/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, SchoolArmType } from '../types';
import { Users, Search, Filter, ShieldCheck, Mail, Phone, BookOpen, ShieldAlert } from 'lucide-react';

interface IdentityRegistryProps {
  currentProfile: UserProfile;
  studentsProfileList: UserProfile[];
}

export default function IdentityRegistry({ currentProfile, studentsProfileList }: IdentityRegistryProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const filteredUsers = studentsProfileList.filter((user) => {
    // Basic search filtering
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    // Role filtering
    const matchesRole = selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super_Admin':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'School_Admin':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Class_Teacher':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Non_Class_Teacher':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Parent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Student':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden max-h-full">
      {/* Registry Top controls */}
      <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Digital Identity Registry</h2>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Replaced physical paper roster books. Complies with institutional zero-paper registries guidelines.
          </p>
        </div>

        {/* Filter and Search bars */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IDs/Names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 rounded pl-8 pr-3 py-1 text-xs outline-none focus:border-indigo-500 w-full font-sans max-h-8 font-medium"
            />
          </div>

          {/* Role selector */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-500 font-bold font-sans max-h-8"
          >
            <option value="ALL">All Roles</option>
            <option value="Super_Admin">Super Admins</option>
            <option value="Class_Teacher">Class Teachers</option>
            <option value="Non_Class_Teacher">Non-Class Teachers</option>
            <option value="Parent">Parents</option>
            <option value="Student">Students</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-4 transition duration-150 flex flex-col justify-between hover:shadow-sm"
            >
              <div className="space-y-3">
                {/* Image and role heading */}
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow shrink-0 bg-white flex items-center justify-center">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-slate-400 font-sans">CS</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] bg-slate-200 text-slate-800 font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                      {user.username}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase mt-1 leading-tight">{user.fullName}</h4>
                    <span className={`inline-block text-[8px] font-black uppercase mt-1.5 px-2 py-0.2 rounded border ${getRoleBadge(user.role)}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Granular user classification specifications */}
                <div className="border-t border-slate-200/60 pt-3 space-y-1.5 font-mono text-[10px] text-slate-600">
                  {user.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.arm && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="font-sans uppercase text-[9px] font-medium text-slate-500">
                        {user.arm} Arm • {user.gradeLevel || 'N/A'} ({user.classCohort || 'N/A'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Educational barrier check info */}
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                {user.role === 'Class_Teacher' ? (
                  <span className="text-[8px] text-emerald-600 font-black uppercase font-mono flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Grading Authority Authorized
                  </span>
                ) : user.role === 'Non_Class_Teacher' ? (
                  <span className="text-[8px] text-slate-400 font-black uppercase font-mono flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" />
                    No Class-Grading Scope
                  </span>
                ) : (
                  <span className="text-[8px] text-xs font-mono text-slate-300">
                    ID SYNC ID_VER_OK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
