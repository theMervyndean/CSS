import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Check,
  X,
  Users,
  Sliders,
  Sparkles,
  Building2,
  Key,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { logAdminActivity } from "../utils/adminAuditLogger";

export interface RolePermissionConfig {
  roleId: string;
  roleName: string;
  description: string;
  permissions: {
    canEditGrades: boolean;
    canPublishCbt: boolean;
    canAccessBursary: boolean;
    canSendBroadcasts: boolean;
    canManageStaff: boolean;
    canViewAuditLogs: boolean;
    canSwitchCampuses: boolean;
  };
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig[] = [
  {
    roleId: "bursar",
    roleName: "Chief Bursar / Finance Officer",
    description: "Full oversight over tuition registers, bank reference reconciliation, and outflow ledgers.",
    permissions: {
      canEditGrades: false,
      canPublishCbt: false,
      canAccessBursary: true,
      canSendBroadcasts: true,
      canManageStaff: false,
      canViewAuditLogs: true,
      canSwitchCampuses: true
    }
  },
  {
    roleId: "vp_academic",
    roleName: "Vice Principal (Academic)",
    description: "Manages class broadsheets, teacher grade verifications, and academic progress metrics.",
    permissions: {
      canEditGrades: true,
      canPublishCbt: true,
      canAccessBursary: false,
      canSendBroadcasts: true,
      canManageStaff: true,
      canViewAuditLogs: true,
      canSwitchCampuses: true
    }
  },
  {
    roleId: "exam_officer",
    roleName: "CBT & Examination Officer",
    description: "Configures CBT question banks, schedules test windows, and inspects biometric proctoring logs.",
    permissions: {
      canEditGrades: true,
      canPublishCbt: true,
      canAccessBursary: false,
      canSendBroadcasts: false,
      canManageStaff: false,
      canViewAuditLogs: true,
      canSwitchCampuses: false
    }
  },
  {
    roleId: "counselor",
    roleName: "Guidance Counselor",
    description: "Accesses student academic dossiers, psychomotor traits, and intervention logs.",
    permissions: {
      canEditGrades: false,
      canPublishCbt: false,
      canAccessBursary: false,
      canSendBroadcasts: true,
      canManageStaff: false,
      canViewAuditLogs: false,
      canSwitchCampuses: false
    }
  },
  {
    roleId: "class_teacher",
    roleName: "Subject Instructor / Class Teacher",
    description: "Inputs Continuous Assessment marks, generates report card comments, and manages attendance.",
    permissions: {
      canEditGrades: true,
      canPublishCbt: true,
      canAccessBursary: false,
      canSendBroadcasts: false,
      canManageStaff: false,
      canViewAuditLogs: false,
      canSwitchCampuses: false
    }
  }
];

export interface CustomRbacManagerProps {
  currentTier?: string;
  onOpenUpgradeModal?: () => void;
  className?: string;
}

export function CustomRbacManager({
  currentTier = "unified_enterprise",
  onOpenUpgradeModal,
  className = ""
}: CustomRbacManagerProps) {
  const [roleConfigs, setRoleConfigs] = useState<RolePermissionConfig[]>(DEFAULT_ROLE_PERMISSIONS);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("bursar");

  const isEnterprise = currentTier === "unified_enterprise" || currentTier === "enterprise";

  const currentRole = roleConfigs.find((r) => r.roleId === selectedRoleId) || roleConfigs[0];

  const handleTogglePermission = (permKey: keyof RolePermissionConfig["permissions"]) => {
    if (!isEnterprise) {
      toast.info("Custom Role & Access Control (RBAC) is locked on Starter & Professional Tiers.", {
        description: "Upgrade to Enterprise Tier to customize granular role permissions."
      });
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }

    setRoleConfigs((prev) =>
      prev.map((r) => {
        if (r.roleId === selectedRoleId) {
          const updated = { ...r.permissions, [permKey]: !r.permissions[permKey] };
          return { ...r, permissions: updated };
        }
        return r;
      })
    );

    toast.success(`Updated permission for ${currentRole.roleName}`);
  };

  const handleSaveMatrix = () => {
    toast.success(`🎉 Custom RBAC Permission Matrix saved to school security database!`, {
      description: "Permissions updated across all active staff user profiles."
    });
    logAdminActivity({
      actionType: 'rbac_update',
      actionTitle: 'Custom RBAC Role Permissions Updated',
      severity: 'warning',
      performedBy: {
        name: 'School Administrator',
        role: 'School_Admin',
      },
      targetResource: `RBAC Matrix (${currentRole.roleName})`,
      details: `Updated fine-grained security privileges and staff role authorization rules.`,
      authMethod: 'session_token',
      status: 'executed'
    });
  };

  return (
    <div className={`cs-card p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 ${className}`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-base cs-text-navy tracking-tight">
                Custom Role &amp; Access Control Matrix (RBAC)
              </h3>
              {isEnterprise ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  Enterprise Tier &bull; Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                  Enterprise Feature Locked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Configure granular access permissions for Vice Principals, Bursars, Exam Officers, and Counselors.
            </p>
          </div>
        </div>

        {!isEnterprise && (
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:opacity-95 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Unlock Enterprise RBAC</span>
          </button>
        )}
      </div>

      {/* ROLE SELECTOR TABS */}
      <div className="flex flex-wrap gap-2">
        {roleConfigs.map((r) => {
          const isSelected = r.roleId === selectedRoleId;
          return (
            <button
              key={r.roleId}
              type="button"
              onClick={() => setSelectedRoleId(r.roleId)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-indigo-950 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{r.roleName.split("/")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* CURRENT ROLE DESCRIPTION */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
        <h4 className="font-bold text-xs font-mono text-indigo-950 flex items-center gap-2">
          <span>Role Scope:</span>
          <span className="text-emerald-700">{currentRole.roleName}</span>
        </h4>
        <p className="text-xs text-slate-600">{currentRole.description}</p>
      </div>

      {/* PERMISSIONS TOGGLE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { key: "canEditGrades", label: "Edit CA & Terminal Grades", desc: "Allows entering or modifying student academic marks." },
          { key: "canPublishCbt", label: "Publish CBT Exams & Results", desc: "Permission to publish exam papers to student portals." },
          { key: "canAccessBursary", label: "Bursary & Financial Ledger", desc: "View tuition registers and record payment inflows." },
          { key: "canSendBroadcasts", label: "WhatsApp & SMS Broadcasts", desc: "Dispatch official broadcast alerts to parent lines." },
          { key: "canManageStaff", label: "Staff Profile Management", desc: "Provision or pause staff user account access." },
          { key: "canViewAuditLogs", label: "System Security Audit Logs", desc: "Inspect CBT audit logs and security modification trails." },
          { key: "canSwitchCampuses", label: "Multi-Campus Branch Switch", desc: "Switch between Victoria Island, Lekki, and Abuja branches." }
        ].map((item) => {
          const isGranted = (currentRole.permissions as any)[item.key];
          return (
            <div
              key={item.key}
              onClick={() => handleTogglePermission(item.key as any)}
              className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                isGranted
                  ? "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                  : "bg-slate-50/80 border-slate-200 text-slate-500 opacity-80"
              }`}
            >
              <div className="space-y-1">
                <span className="font-mono font-bold text-xs block">{item.label}</span>
                <p className="text-[10.5px] text-slate-500 leading-tight">{item.desc}</p>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isGranted ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-400"
                }`}
              >
                {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-mono">
        <span className="text-slate-400">
          Changes will apply immediately upon saving.
        </span>
        <button
          type="button"
          onClick={handleSaveMatrix}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Save Role Permission Matrix</span>
        </button>
      </div>
    </div>
  );
}

export default CustomRbacManager;
