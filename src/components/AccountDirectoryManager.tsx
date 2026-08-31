import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Key, 
  Lock, 
  Unlock, 
  Edit3, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  X, 
  Plus, 
  Shield, 
  Sliders, 
  Activity, 
  FileSpreadsheet, 
  Mail, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Send,
  Layers,
  History,
  FileText,
  ShieldCheck,
  Clock,
  CreditCard,
  ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";
import { UserProfile, UserRole, SchoolArmType, AuditLogEntry, AuditActionType, AuditCategory } from "../types";
import { mockUsers } from "../mockData";

interface AccountDirectoryManagerProps {
  currentAdminProfile?: UserProfile;
  classesList?: string[];
}

export default function AccountDirectoryManager({
  currentAdminProfile,
  classesList = ["Primary 1", "Primary 2", "JSS 1", "JSS 2", "SS 1", "SS 2", "SS 3"]
}: AccountDirectoryManagerProps) {
  // Main View Switcher: DIRECTORY vs AUDIT_LOG
  const [activeMainView, setActiveMainView] = useState<'DIRECTORY' | 'AUDIT_LOG'>('DIRECTORY');

  // Core user accounts list state backed by localStorage
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("CS_USER_PROFILES");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse CS_USER_PROFILES from localStorage", e);
      }
    }
    // Seed default mockUsers with status='active' and default passwords
    const initialUsers = mockUsers.map(u => ({
      ...u,
      status: u.status || 'active',
      password: u.password || 'CornerStreams2026!',
      created_at: u.created_at || new Date().toISOString(),
      last_login: u.last_login || new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString()
    }));
    localStorage.setItem("CS_USER_PROFILES", JSON.stringify(initialUsers));
    return initialUsers;
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem("CS_USER_PROFILES", JSON.stringify(users));
  }, [users]);

  // Account Audit Log state backed by localStorage
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem("CS_ACCOUNT_AUDIT_LOGS");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse CS_ACCOUNT_AUDIT_LOGS from localStorage", e);
      }
    }
    const initialLogs: AuditLogEntry[] = [
      {
        id: "log-101",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        actorName: currentAdminProfile?.fullName || "System Admin (Folasade Adebayo)",
        actorRole: "School_Admin",
        actionType: "CREATE",
        targetCategory: "STUDENT_PROFILE",
        targetName: "Chidi Anthony Okonkwo",
        targetId: "CS-STU-8821",
        details: "Provisioned new SS 2A student profile with linked guardian profile CS-PAR-1092.",
        ipAddress: "197.210.22.41"
      },
      {
        id: "log-102",
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        actorName: currentAdminProfile?.fullName || "System Admin (Folasade Adebayo)",
        actorRole: "School_Admin",
        actionType: "BILLING",
        targetCategory: "BILLING_RECORD",
        targetName: "Tuition Ledger Invoice #CS-2026-081",
        targetId: "CS-STU-8821",
        details: "Updated tuition fee structure to ₦185,000 and recorded ₦150,000 partial fee receipt.",
        ipAddress: "197.210.22.41"
      },
      {
        id: "log-103",
        timestamp: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
        actorName: currentAdminProfile?.fullName || "System Admin (Folasade Adebayo)",
        actorRole: "School_Admin",
        actionType: "PAUSE",
        targetCategory: "ACCOUNT_STATUS",
        targetName: "Aminat Yusuf",
        targetId: "CS-STU-3312",
        details: "Account login access status changed from ACTIVE to PAUSED pending bursary fee clearance.",
        ipAddress: "197.210.22.18"
      },
      {
        id: "log-104",
        timestamp: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
        actorName: currentAdminProfile?.fullName || "System Admin (Folasade Adebayo)",
        actorRole: "School_Admin",
        actionType: "EDIT",
        targetCategory: "STUDENT_PROFILE",
        targetName: "Emeka David Nnamdi",
        targetId: "CS-STU-4019",
        details: "Updated class cohort allocation from JSS 2B to JSS 3A and refreshed parent contact number.",
        ipAddress: "197.210.22.18"
      },
      {
        id: "log-105",
        timestamp: new Date(Date.now() - 1000 * 60 * 410).toISOString(),
        actorName: currentAdminProfile?.fullName || "System Admin (Folasade Adebayo)",
        actorRole: "School_Admin",
        actionType: "SECURITY",
        targetCategory: "SYSTEM_SECURITY",
        targetName: "CBT Exam Portal Gate",
        targetId: "SYS-LOCK-01",
        details: "Activated temporary emergency portal lock during term-end grade collation window.",
        ipAddress: "197.210.22.41"
      }
    ];
    localStorage.setItem("CS_ACCOUNT_AUDIT_LOGS", JSON.stringify(initialLogs));
    return initialLogs;
  });

  // Sync audit logs to localStorage
  useEffect(() => {
    localStorage.setItem("CS_ACCOUNT_AUDIT_LOGS", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper function to append audit events
  const logAuditEvent = (
    actionType: AuditActionType,
    targetCategory: AuditCategory,
    targetName: string,
    targetId: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorName: currentAdminProfile?.fullName || "School Administrator",
      actorRole: currentAdminProfile?.role || "School_Admin",
      actionType,
      targetCategory,
      targetName,
      targetId,
      details,
      ipAddress: "197.210.22.41"
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // Audit Search & Filter States
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'ALL' | AuditCategory>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<'ALL' | AuditActionType>('ALL');

  // Modal state for manual audit note entry
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteTargetCategory, setNoteTargetCategory] = useState<AuditCategory>('STUDENT_PROFILE');
  const [noteTargetName, setNoteTargetName] = useState("");
  const [noteActionType, setNoteActionType] = useState<AuditActionType>('EDIT');
  const [noteDetails, setNoteDetails] = useState("");

  const handleAddCustomAuditNote = () => {
    if (!noteTargetName.trim() || !noteDetails.trim()) {
      toast.error("Target Profile Name and Detail Description are required!");
      return;
    }
    logAuditEvent(
      noteActionType,
      noteTargetCategory,
      noteTargetName.trim(),
      `NOTE-${Date.now().toString().slice(-4)}`,
      noteDetails.trim()
    );
    toast.success("📝 Custom Account Audit Record logged successfully into immutable ledger.");
    setIsAddNoteModalOpen(false);
    setNoteTargetName("");
    setNoteDetails("");
  };

  // Download Audit Log CSV
  const handleDownloadAuditCSV = () => {
    const headers = "Log ID,Timestamp,Actor Name,Actor Role,Action Type,Category,Target Profile,Target ID,IP Address,Details\n";
    const rows = filteredAuditLogs.map(l => {
      const escActor = `"${(l.actorName || '').replace(/"/g, '""')}"`;
      const escTarget = `"${(l.targetName || '').replace(/"/g, '""')}"`;
      const escDetails = `"${(l.details || '').replace(/"/g, '""')}"`;
      return `${l.id},"${l.timestamp}",${escActor},${l.actorRole},${l.actionType},${l.targetCategory},${escTarget},${l.targetId},${l.ipAddress || ''},${escDetails}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CornerStreams_Account_Audit_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Account Audit Trail CSV exported successfully!");
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditCategoryFilter !== 'ALL' && log.targetCategory !== auditCategoryFilter) return false;
    if (auditActionFilter !== 'ALL' && log.actionType !== auditActionFilter) return false;
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.targetName.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  // Directory Tab & Search filters
  const [activeRoleFilter, setActiveRoleFilter] = useState<'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'STAFF'>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'paused' | 'suspended'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isMassResetOpen, setIsMassResetOpen] = useState(false);
  const [isPortalLockOpen, setIsPortalLockOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState<UserProfile | null>(null);

  // Portal Emergency Lock state
  const [isPortalLocked, setIsPortalLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem("CS_PORTAL_EXAM_LOCK");
    return saved === "true";
  });
  const [lockNotice, setLockNotice] = useState(
    "Student & Parent portal logins are temporarily paused for term-end grading and bursary audits. Please check back shortly."
  );

  // Password visibility states
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // New Account Form state
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Class_Teacher");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("CornerStreams2026!");
  const [newArm, setNewArm] = useState<SchoolArmType>("Secondary");
  const [newClassCohort, setNewClassCohort] = useState("SS 2A");
  const [newParentId, setNewParentId] = useState("");
  const [newStudentIdInput, setNewStudentIdInput] = useState("");

  // Edit Account Form state
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("Class_Teacher");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editArm, setEditArm] = useState<SchoolArmType>("Secondary");
  const [editClassCohort, setEditClassCohort] = useState("");
  const [editStatus, setEditStatus] = useState<'active' | 'paused' | 'suspended'>('active');
  const [editForcePassChange, setEditForcePassChange] = useState(false);

  // Mass Reset state
  const [massResetRole, setMassResetRole] = useState<'Student' | 'Class_Teacher' | 'Parent' | 'All'>('Student');
  const [massResetPassword, setMassResetPassword] = useState("CS-Pass2026!");

  // Generate structured Username
  const generateUsernameForRole = (role: UserRole) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    if (role === 'Class_Teacher' || role === 'Non_Class_Teacher') return `CS-TCH-${randomNum}`;
    if (role === 'Student') return `CS-STU-${randomNum}`;
    if (role === 'Parent') return `CS-PAR-${randomNum}`;
    if (role === 'School_Admin') return `CS-SCH-${randomNum}`;
    return `CS-USR-${randomNum}`;
  };

  // Trigger username auto-fill when newRole changes
  useEffect(() => {
    if (isCreateModalOpen && !newUsername) {
      setNewUsername(generateUsernameForRole(newRole));
    }
  }, [newRole, isCreateModalOpen]);

  // Open Edit Modal with pre-filled fields
  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    setEditFullName(u.fullName || "");
    setEditUsername(u.username || "");
    setEditRole(u.role);
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditPassword(u.password || "CornerStreams2026!");
    setEditArm(u.arm || "Secondary");
    setEditClassCohort(u.classCohort || "SS 2A");
    setEditStatus(u.status || "active");
    setEditForcePassChange(!!u.forcePasswordChange);
  };

  // Save Edited Account
  const handleSaveEditedUser = () => {
    if (!editingUser) return;
    if (!editFullName.trim() || !editUsername.trim()) {
      toast.error("Full Name and Access Username are required!");
      return;
    }

    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          fullName: editFullName.trim(),
          username: editUsername.trim(),
          role: editRole,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          password: editPassword,
          arm: editArm,
          classCohort: editClassCohort,
          status: editStatus,
          forcePasswordChange: editForcePassChange
        };
      }
      return u;
    });

    setUsers(updated);

    // Record Audit Log Entry
    logAuditEvent(
      'EDIT',
      editingUser.role === 'Student' ? 'STUDENT_PROFILE' : 'STAFF_PROFILE',
      editFullName.trim(),
      editingUser.username || editingUser.id,
      `Updated profile credentials: Role (${editRole}), Class (${editClassCohort}), Status (${editStatus.toUpperCase()}).`
    );

    toast.success(`🎉 Profile & Login Details for ${editFullName} updated successfully!`);
    setEditingUser(null);
  };

  // Handle Create User Account
  const handleCreateUser = () => {
    if (!newFullName.trim() || !newUsername.trim()) {
      toast.error("Please fill in the Full Name and Access Username!");
      return;
    }

    const newId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150`;

    const newUserObj: UserProfile = {
      id: newId,
      fullName: newFullName.trim(),
      username: newUsername.trim(),
      role: newRole,
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      password: newPassword || "CornerStreams2026!",
      photoUrl: avatarUrl,
      arm: newArm,
      classCohort: newClassCohort,
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      parentId: newParentId ? newParentId.trim() : undefined,
      studentIds: newStudentIdInput ? newStudentIdInput.split(",").map(s => s.trim()) : undefined,
      permissions: {
        canEditGrades: newRole === 'Class_Teacher' || newRole === 'School_Admin',
        canPublishCbt: newRole === 'Class_Teacher' || newRole === 'School_Admin',
        canAccessBursary: newRole === 'School_Admin',
        canSendBroadcasts: newRole === 'School_Admin'
      }
    };

    setUsers([newUserObj, ...users]);

    // Record Audit Log Entry
    logAuditEvent(
      'CREATE',
      newRole === 'Student' ? 'STUDENT_PROFILE' : 'STAFF_PROFILE',
      newFullName.trim(),
      newUsername.trim(),
      `Provisioned new ${newRole} account allocated to ${newClassCohort} (${newArm}).`
    );

    toast.success(`🎉 New account for ${newFullName} (${newUsername}) provisioned successfully!`);

    // Reset Form
    setIsCreateModalOpen(false);
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewUsername("");
  };

  // Handle One-click Pause / Unpause
  const handleTogglePauseUser = (u: UserProfile) => {
    const newStatus = (u.status === 'paused' || u.status === 'suspended') ? 'active' : 'paused';
    const updated = users.map(user => {
      if (user.id === u.id) {
        return { ...user, status: newStatus as any };
      }
      return user;
    });

    setUsers(updated);

    // Record Audit Log Entry
    logAuditEvent(
      newStatus === 'paused' ? 'PAUSE' : 'RESUME',
      'ACCOUNT_STATUS',
      u.fullName,
      u.username || u.id,
      `Account login status changed to ${newStatus.toUpperCase()} by system administrator.`
    );

    if (newStatus === 'paused') {
      toast.warning(`⏸️ Account for ${u.fullName} (${u.username}) has been PAUSED.`);
    } else {
      toast.success(`▶️ Account for ${u.fullName} (${u.username}) REACTIVATED.`);
    }
  };

  // Handle Delete Account
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    const updated = users.filter(u => u.id !== deletingUser.id);
    setUsers(updated);

    // Record Audit Log Entry
    logAuditEvent(
      'DELETE',
      deletingUser.role === 'Student' ? 'STUDENT_PROFILE' : 'STAFF_PROFILE',
      deletingUser.fullName,
      deletingUser.username || deletingUser.id,
      `Account permanently removed from active school directory.`
    );

    toast.success(`🗑️ Account for ${deletingUser.fullName} (${deletingUser.username}) deleted permanently.`);
    setDeletingUser(null);
  };

  // Handle Mass Password Reset
  const handleExecuteMassReset = () => {
    if (!massResetPassword.trim()) {
      toast.error("Please enter a valid temporary password!");
      return;
    }

    let affectedCount = 0;
    const updated = users.map(u => {
      const match = 
        massResetRole === 'All' ||
        (massResetRole === 'Student' && u.role === 'Student') ||
        (massResetRole === 'Class_Teacher' && (u.role === 'Class_Teacher' || u.role === 'Non_Class_Teacher')) ||
        (massResetRole === 'Parent' && u.role === 'Parent');

      if (match) {
        affectedCount++;
        return {
          ...u,
          password: massResetPassword.trim(),
          forcePasswordChange: true
        };
      }
      return u;
    });

    setUsers(updated);

    // Record Audit Log Entry
    logAuditEvent(
      'SECURITY',
      'SYSTEM_SECURITY',
      `${massResetRole} Mass Password Reset`,
      'SYS-MASS-RESET',
      `Executed mass password reset for ${affectedCount} account(s) matching role '${massResetRole}'. Forced password change enabled on next login.`
    );

    toast.success(`🔑 Reset passwords for ${affectedCount} ${massResetRole} account(s) to "${massResetPassword}". Forced password change on next login enabled!`);
    setIsMassResetOpen(false);
  };

  // Toggle Portal Emergency Lock
  const handleTogglePortalLock = () => {
    const nextState = !isPortalLocked;
    setIsPortalLocked(nextState);
    localStorage.setItem("CS_PORTAL_EXAM_LOCK", String(nextState));

    // Record Audit Log Entry
    logAuditEvent(
      'SECURITY',
      'SYSTEM_SECURITY',
      'Emergency Portal Access Lock',
      'SYS-LOCK-GATE',
      nextState ? "Portal access emergency locked for all student and parent portals." : "Portal emergency lock released."
    );

    if (nextState) {
      toast.warning("🔒 Emergency Portal & CBT Exam Access LOCKED for Students & Parents.");
    } else {
      toast.success("🔓 Emergency Portal Lock RELEASES. Students & Parents can now log in.");
    }
    setIsPortalLockOpen(false);
  };

  // Download Account Directory CSV
  const handleDownloadDirectoryCSV = () => {
    const headers = "ID,Username,Full Name,Role,Email,Phone Number,Status,Class Cohort,Last Login,Password\n";
    const rows = users.map(u => {
      const escName = `"${(u.fullName || '').replace(/"/g, '""')}"`;
      const escEmail = `"${(u.email || '').replace(/"/g, '""')}"`;
      const escPhone = `"${(u.phone || '').replace(/"/g, '""')}"`;
      const escCohort = `"${(u.classCohort || '').replace(/"/g, '""')}"`;
      const escPass = `"${(u.password || '').replace(/"/g, '""')}"`;
      return `${u.id},${u.username || ''},${escName},${u.role},${escEmail},${escPhone},${u.status || 'active'},${escCohort},"${u.last_login || ''}",${escPass}`;
    }).join("\n");

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CornerStreams_User_Accounts_Directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Standardized User Accounts Directory CSV downloaded successfully!");
  };

  // Save Custom Permissions
  const handleSavePermissions = () => {
    if (!permissionTargetUser) return;
    logAuditEvent(
      'SECURITY',
      'SYSTEM_SECURITY',
      permissionTargetUser.fullName,
      permissionTargetUser.username || permissionTargetUser.id,
      `Granular security privileges updated for module permissions.`
    );
    toast.success(`🛡️ Custom security permissions updated for ${permissionTargetUser.fullName}!`);
    setIsPermissionsModalOpen(false);
  };

  // Filtered Users List calculation
  const filteredUsers = users.filter(u => {
    // Role filter
    if (activeRoleFilter === 'TEACHER' && !(u.role === 'Class_Teacher' || u.role === 'Non_Class_Teacher')) return false;
    if (activeRoleFilter === 'STUDENT' && u.role !== 'Student') return false;
    if (activeRoleFilter === 'PARENT' && u.role !== 'Parent') return false;
    if (activeRoleFilter === 'STAFF' && !(u.role === 'School_Admin' || u.role === 'Super_Admin')) return false;

    // Status filter
    if (statusFilter !== 'ALL' && (u.status || 'active') !== statusFilter) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.classCohort && u.classCohort.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalAccounts = users.length;
  const teacherCount = users.filter(u => u.role === 'Class_Teacher' || u.role === 'Non_Class_Teacher').length;
  const studentCount = users.filter(u => u.role === 'Student').length;
  const parentCount = users.filter(u => u.role === 'Parent').length;
  const staffCount = users.filter(u => u.role === 'School_Admin' || u.role === 'Super_Admin').length;
  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const pausedCount = users.filter(u => (u.status || 'active') === 'paused' || (u.status || 'active') === 'suspended').length;

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* ================= SECTION NAVIGATION SWITCHER ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainView('DIRECTORY')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeMainView === 'DIRECTORY'
                ? "bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>User Accounts Directory ({totalAccounts})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainView('AUDIT_LOG')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeMainView === 'AUDIT_LOG'
                ? "bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Account Audit Log</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {auditLogs.length} Events
            </span>
          </button>
        </div>

        {activeMainView === 'AUDIT_LOG' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddNoteModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Record Audit Note</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAuditCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= ACCOUNT AUDIT LOG VIEW ================= */}
      {activeMainView === 'AUDIT_LOG' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* AUDIT LOG METRICS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-indigo-600" /> Total Audit Trail
              </span>
              <span className="text-2xl font-black font-mono text-indigo-950 block">{auditLogs.length}</span>
              <span className="text-[9.5px] text-slate-400 block">Logged Ledger Records</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Student Profiles
              </span>
              <span className="text-2xl font-black font-mono text-emerald-700 block">
                {auditLogs.filter(l => l.targetCategory === 'STUDENT_PROFILE').length}
              </span>
              <span className="text-[9.5px] text-slate-400 block">Edits, Cohorts & Creates</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Billing & Fees
              </span>
              <span className="text-2xl font-black font-mono text-purple-700 block">
                {auditLogs.filter(l => l.targetCategory === 'BILLING_RECORD').length}
              </span>
              <span className="text-[9.5px] text-slate-400 block">Tuition & Receipts</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> Account Status Shifts
              </span>
              <span className="text-2xl font-black font-mono text-amber-700 block">
                {auditLogs.filter(l => l.targetCategory === 'ACCOUNT_STATUS' || l.actionType === 'PAUSE' || l.actionType === 'RESUME').length}
              </span>
              <span className="text-[9.5px] text-slate-400 block">Pauses & Access Shifts</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Security Operations
              </span>
              <span className="text-2xl font-black font-mono text-indigo-900 block">
                {auditLogs.filter(l => l.targetCategory === 'SYSTEM_SECURITY' || l.actionType === 'SECURITY').length}
              </span>
              <span className="text-[9.5px] text-slate-400 block">Resets & Portal Locks</span>
            </div>
          </div>

          {/* AUDIT LOG SEARCH & FILTER CONTROLS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search audit trail by student name, ID, actor admin, or detail text..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-500">Category:</span>
                <select
                  value={auditCategoryFilter}
                  onChange={(e) => setAuditCategoryFilter(e.target.value as any)}
                  className="bg-transparent font-extrabold text-indigo-950 outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">All Categories</option>
                  <option value="STUDENT_PROFILE">Student Profiles</option>
                  <option value="BILLING_RECORD">Billing & Fee Records</option>
                  <option value="ACCOUNT_STATUS">Account Statuses</option>
                  <option value="STAFF_PROFILE">Staff Profiles</option>
                  <option value="SYSTEM_SECURITY">System Security</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-500">Action:</span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value as any)}
                  className="bg-transparent font-extrabold text-indigo-950 outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="EDIT">EDIT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PAUSE">PAUSE</option>
                  <option value="RESUME">RESUME</option>
                  <option value="BILLING">BILLING</option>
                  <option value="SECURITY">SECURITY</option>
                </select>
              </div>
            </div>
          </div>

          {/* AUDIT LOG LEDGER TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-800">Account Change Ledger ({filteredAuditLogs.length} Records)</span>
              </div>
              <span className="font-mono text-[10.5px] text-slate-400">Database Key: CS_ACCOUNT_AUDIT_LOGS</span>
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">No Audit Trail Records Match Your Filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or selecting "All Categories" to view the complete immutable change log.
                </p>
                <button
                  type="button"
                  onClick={() => { setAuditSearchQuery(""); setAuditCategoryFilter("ALL"); setAuditActionFilter("ALL"); }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  const formattedDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const formattedTime = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  // Color badges for Action Types
                  let actionBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                  if (log.actionType === 'CREATE') actionBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  else if (log.actionType === 'EDIT') actionBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  else if (log.actionType === 'DELETE') actionBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                  else if (log.actionType === 'PAUSE') actionBadgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                  else if (log.actionType === 'RESUME') actionBadgeClass = "bg-teal-50 text-teal-700 border-teal-200";
                  else if (log.actionType === 'BILLING') actionBadgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                  else if (log.actionType === 'SECURITY') actionBadgeClass = "bg-sky-50 text-sky-700 border-sky-200";

                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      
                      {/* Left: Action Badge, Category & Target */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${actionBadgeClass}`}>
                            {log.actionType}
                          </span>

                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                            {log.targetCategory === 'STUDENT_PROFILE' && <GraduationCap className="w-3 h-3 text-emerald-600" />}
                            {log.targetCategory === 'BILLING_RECORD' && <CreditCard className="w-3 h-3 text-purple-600" />}
                            {log.targetCategory === 'ACCOUNT_STATUS' && <PauseCircle className="w-3 h-3 text-amber-600" />}
                            {log.targetCategory === 'STAFF_PROFILE' && <Users className="w-3 h-3 text-indigo-600" />}
                            {log.targetCategory === 'SYSTEM_SECURITY' && <Shield className="w-3 h-3 text-sky-600" />}
                            <span>{log.targetCategory.replace(/_/g, ' ')}</span>
                          </span>

                          <span className="font-extrabold text-indigo-950 text-xs">{log.targetName}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.targetId}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {log.details}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-400 font-medium">
                          <span>Performed By: <strong className="text-slate-800">{log.actorName}</strong> ({log.actorRole})</span>
                          <span>•</span>
                          <span className="font-mono">IP: {log.ipAddress || '197.210.22.41'}</span>
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div className="text-right shrink-0 space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-1 justify-end text-slate-600 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{formattedTime}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block">{formattedDate}</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= USER DIRECTORY VIEW ================= */}
      {activeMainView === 'DIRECTORY' && (
      <div className="space-y-6 animate-in fade-in duration-200">
        
      {/* ================= HEADER & STATS BAR ================= */}
      <div className="cs-card p-6 space-y-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-950 via-indigo-800 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold cs-text-navy text-lg tracking-tight">
                  User Account & Profile Management Console
                </h2>
                {isPortalLocked && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                    <Lock className="w-3 h-3 text-amber-700" /> Portal Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage login credentials, edit user details, pause access, or provision new teacher, student, and parent accounts across your school network.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsPortalLockOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isPortalLocked 
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {isPortalLocked ? <Lock className="w-4 h-4 text-white" /> : <Unlock className="w-4 h-4 text-slate-600" />}
              <span>{isPortalLocked ? "Portal Locked" : "Emergency Lock"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDirectoryCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Directory</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewUsername(generateUsernameForRole(newRole));
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>+ Provision Account</span>
            </button>
          </div>
        </div>

        {/* STATS TILES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Total Directory</span>
            <span className="text-xl font-black font-mono text-indigo-950">{totalAccounts}</span>
            <span className="text-[9.5px] text-indigo-400 block mt-0.5">Registered Profiles</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Active Status</span>
            <span className="text-xl font-black font-mono text-emerald-700">{activeCount}</span>
            <span className="text-[9.5px] text-emerald-500 block mt-0.5">Can Login & Stream</span>
          </div>

          <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Paused / Suspended</span>
            <span className="text-xl font-black font-mono text-amber-800">{pausedCount}</span>
            <span className="text-[9.5px] text-amber-600 block mt-0.5">Access On Hold</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Teachers</span>
            <span className="text-xl font-black font-mono text-slate-800">{teacherCount}</span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">Class & Subject Instructors</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Students</span>
            <span className="text-xl font-black font-mono text-slate-800">{studentCount}</span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">Learner Accounts</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Parents</span>
            <span className="text-xl font-black font-mono text-slate-800">{parentCount}</span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">Guardians Linked</span>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & FILTER BAR ================= */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* ROLE TABS */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${totalAccounts})` },
            { id: 'TEACHER', label: `Teachers (${teacherCount})` },
            { id: 'STUDENT', label: `Students (${studentCount})` },
            { id: 'PARENT', label: `Parents (${parentCount})` },
            { id: 'STAFF', label: `Admins (${staffCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeRoleFilter === tab.id
                  ? "bg-white text-indigo-950 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & STATUS SELECT */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, email, or class..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsMassResetOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mass Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuditLogsOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {/* ================= USER DIRECTORY LIST ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Showing {filteredUsers.length} user account profiles</span>
          <span className="font-mono text-[10.5px] text-slate-400">Database Key: CS_USER_PROFILES</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.map((u) => {
            const isPaused = u.status === 'paused' || u.status === 'suspended';
            const showPass = !!showPasswordMap[u.id];

            return (
              <div key={u.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* LEFT: User Profile Identity */}
                <div className="flex items-start md:items-center gap-3.5">
                  <img
                    src={u.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"}
                    alt={u.fullName}
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                  />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display font-extrabold text-indigo-950 text-sm">{u.fullName}</h4>
                      
                      {/* Role Pill */}
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        u.role === 'Super_Admin' || u.role === 'School_Admin'
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : u.role === 'Class_Teacher' || u.role === 'Non_Class_Teacher'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : u.role === 'Parent'
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>

                      {/* Status Pill */}
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isPaused
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {isPaused ? <PauseCircle className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isPaused ? "Paused" : "Active"}
                      </span>

                      {u.forcePasswordChange && (
                        <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          Reset Required
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="font-mono text-indigo-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        ID: {u.username}
                      </span>

                      {u.email && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                        </span>
                      )}

                      {u.phone && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" /> {u.phone}
                        </span>
                      )}

                      {u.classCohort && (
                        <span className="flex items-center gap-1 text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10.5px]">
                          Cohort: {u.classCohort}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Login Password Display & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  
                  {/* Password reveal toggle */}
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-mono border border-slate-200">
                    <Key className="w-3 h-3 text-indigo-600" />
                    <span className="text-slate-800 font-semibold min-w-20">
                      {showPass ? (u.password || "CornerStreams2026!") : "••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordMap(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Toggle Password Visibility"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Pause / Reactivate Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePauseUser(u)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                      isPaused 
                        ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800" 
                        : "bg-amber-100 hover:bg-amber-200 text-amber-900"
                    }`}
                    title={isPaused ? "Reactivate Account" : "Pause Account Access"}
                  >
                    {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{isPaused ? "Reactivate" : "Pause"}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {/* Permissions Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPermissionTargetUser(u);
                      setIsPermissionsModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                    title="Configure Custom Permissions"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeletingUser(u)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="p-10 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">No matching user accounts found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your role filter or search keywords.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    )}

      {/* ================= MODAL: ADD CUSTOM AUDIT NOTE ================= */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Record Custom Account Audit Note</h3>
                  <span className="text-[10px] text-emerald-300 font-mono">Immutable Log Ledger</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <p className="text-slate-600 font-medium">
                Log a manual audit event regarding student profiles, bursary billing records, or account statuses.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Audit Category</label>
                <select
                  value={noteTargetCategory}
                  onChange={(e) => setNoteTargetCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none cursor-pointer"
                >
                  <option value="STUDENT_PROFILE">Student Profile</option>
                  <option value="BILLING_RECORD">Billing & Fee Record</option>
                  <option value="ACCOUNT_STATUS">Account Status Shift</option>
                  <option value="STAFF_PROFILE">Staff Profile</option>
                  <option value="SYSTEM_SECURITY">System Security</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Action Type</label>
                <select
                  value={noteActionType}
                  onChange={(e) => setNoteActionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none cursor-pointer"
                >
                  <option value="EDIT">EDIT</option>
                  <option value="BILLING">BILLING</option>
                  <option value="PAUSE">PAUSE</option>
                  <option value="RESUME">RESUME</option>
                  <option value="CREATE">CREATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="SECURITY">SECURITY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Target Profile / Invoice / Student Name</label>
                <input
                  type="text"
                  value={noteTargetName}
                  onChange={(e) => setNoteTargetName(e.target.value)}
                  placeholder="e.g. Chidi Anthony Okonkwo or Invoice #CS-2026-092"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Audit Event Description & Details</label>
                <textarea
                  rows={3}
                  value={noteDetails}
                  onChange={(e) => setNoteDetails(e.target.value)}
                  placeholder="Describe the exact change made (e.g. Cleared bursary fee balance ₦45,000 and updated payment receipt status)."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomAuditNote}
                className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Audit Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE ACCOUNT ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <UserPlus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Provision New User Profile Account</h3>
                  <span className="text-[10px] text-emerald-300 font-mono">School Administrator Console</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Role Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider block">Account Role Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { role: 'Class_Teacher', label: 'Teacher' },
                    { role: 'Student', label: 'Student' },
                    { role: 'Parent', label: 'Parent' },
                    { role: 'School_Admin', label: 'Admin/Staff' }
                  ].map(r => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setNewRole(r.role as UserRole)}
                      className={`p-2.5 rounded-xl border text-center font-extrabold text-xs transition cursor-pointer ${
                        newRole === r.role
                          ? "bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Full Name *</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Dr. Folake Solanke"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 text-[10px] uppercase block">Access ID / Username *</label>
                    <button
                      type="button"
                      onClick={() => setNewUsername(generateUsernameForRole(newRole))}
                      className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Generate New
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. CS-TCH-0042"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-950 text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. user@cornerstreams.edu"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +234 812 345 6789"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[10px] uppercase block">Default Login Password / PIN *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Arm & Class Cohort (for Students/Teachers) */}
              {(newRole === 'Student' || newRole === 'Class_Teacher' || newRole === 'Non_Class_Teacher') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase block">School Arm</label>
                    <select
                      value={newArm}
                      onChange={(e) => setNewArm(e.target.value as SchoolArmType)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                      <option value="Nursery">Nursery</option>
                      <option value="Creche">Creche</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[10px] uppercase block">Assigned Class / Cohort</label>
                    <select
                      value={newClassCohort}
                      onChange={(e) => setNewClassCohort(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                    >
                      {classesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Parent/Student Linkage */}
              {newRole === 'Student' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Linked Parent Account ID (Optional)</label>
                  <input
                    type="text"
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    placeholder="e.g. CS-PAR-001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none"
                  />
                </div>
              )}

              {newRole === 'Parent' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Linked Student Account IDs (Comma-separated)</label>
                  <input
                    type="text"
                    value={newStudentIdInput}
                    onChange={(e) => setNewStudentIdInput(e.target.value)}
                    placeholder="e.g. usr-stu-1, usr-stu-2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none"
                  />
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Save & Provision Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Edit Login & Profile Details</h3>
                  <span className="text-[10px] text-indigo-300 font-mono">ID: {editingUser.username}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Full Name *</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Access ID / Username *</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-950 text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              {/* Password & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Login Password / Passcode</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Account Access Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-xs outline-none cursor-pointer"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="paused">Paused / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Role & Cohort */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Account Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none cursor-pointer"
                  >
                    <option value="Class_Teacher">Class Teacher</option>
                    <option value="Non_Class_Teacher">Non-Class Subject Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Parent">Parent</option>
                    <option value="School_Admin">School Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase block">Class Cohort Assignment</label>
                  <select
                    value={editClassCohort}
                    onChange={(e) => setEditClassCohort(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none cursor-pointer"
                  >
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox: Force Password Change */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForcePassChange}
                  onChange={(e) => setEditForcePassChange(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-indigo-950 block">Force Password Change on Next Login</span>
                  <span className="text-[10px] text-slate-400">User will be prompted to update credentials immediately after signing in.</span>
                </div>
              </label>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedUser}
                className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Account Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-red-950 via-red-900 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <Trash2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Confirm Account Deletion</h3>
                  <span className="text-[10px] text-red-300 font-mono">Destructive Action</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold uppercase">Are you sure?</p>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    You are about to permanently delete the profile account for <strong className="text-slate-950">{deletingUser.fullName}</strong> ({deletingUser.username}).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Username ID:</span>
                  <span className="font-mono font-bold text-slate-900">{deletingUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-bold text-indigo-950">{deletingUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class Cohort:</span>
                  <span className="font-bold text-slate-800">{deletingUser.classCohort || 'Unassigned'}</span>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-400 italic">
                Deleting this account will immediately revoke all access to dashboard views, CBT exams, and academic grade registries.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MASS PASSWORD RESET ================= */}
      {isMassResetOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <Key className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Mass Password Reset Console</h3>
                  <span className="text-[10px] text-indigo-300 font-mono">Cohort Credentials Overhaul</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMassResetOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                Reset passwords across an entire cohort (e.g. all Students or Teachers) simultaneously to a standardized temporary passcode.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Target Cohort Group</label>
                <select
                  value={massResetRole}
                  onChange={(e) => setMassResetRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none cursor-pointer"
                >
                  <option value="Student">All Students ({studentCount} Accounts)</option>
                  <option value="Class_Teacher">All Teachers ({teacherCount} Accounts)</option>
                  <option value="Parent">All Parents ({parentCount} Accounts)</option>
                  <option value="All">Entire User Directory ({totalAccounts} Accounts)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">New Standardized Passcode *</label>
                <input
                  type="text"
                  value={massResetPassword}
                  onChange={(e) => setMassResetPassword(e.target.value)}
                  placeholder="e.g. CS-Pass2026!"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-950 text-xs outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-medium leading-relaxed">
                ⚡ Force password change on next login will automatically be enabled for all affected accounts.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMassResetOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMassReset}
                className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Execute Mass Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EMERGENCY PORTAL LOCK ================= */}
      {isPortalLockOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-amber-950 via-amber-900 to-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Portal & CBT Exam Access Lock</h3>
                  <span className="text-[10px] text-amber-300 font-mono">Emergency Administration Control</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPortalLockOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                Temporarily pause student and parent portal access during examination grading, fee audits, or system maintenance.
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Current Lock Status:</span>
                  <span className={isPortalLocked ? "text-amber-600 font-mono font-black" : "text-emerald-600 font-mono font-black"}>
                    {isPortalLocked ? "LOCKED 🔒" : "OPEN / ACTIVE 🔓"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] block">Lock Notice Banner Message</label>
                <textarea
                  value={lockNotice}
                  onChange={(e) => setLockNotice(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPortalLockOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTogglePortalLock}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5 text-white ${
                  isPortalLocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isPortalLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isPortalLocked ? "Unlock Portal Access" : "Lock Portal Access"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: AUDIT LOGS ================= */}
      {isAuditLogsOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Security & Login Audit Trail</h3>
                  <span className="text-[10px] text-emerald-300 font-mono">Live Access Inspector</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditLogsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              <p className="text-slate-500 font-medium">
                Recent authentication events and session activity across user profiles:
              </p>

              <div className="space-y-2">
                {users.slice(0, 6).map((u, i) => (
                  <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-indigo-950 block">{u.fullName} ({u.username})</span>
                      <span className="text-[10px] text-slate-400 font-mono">IP: 197.210.22.{10 + i * 7} • Chrome / Mobile Safari</span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                        Authenticated
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-mono block">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Just Now'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditLogsOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOM PERMISSIONS ================= */}
      {isPermissionsModalOpen && permissionTargetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Shield className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Granular Permissions Matrix</h3>
                  <span className="text-[10px] text-emerald-300 font-mono">{permissionTargetUser.fullName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-slate-500 font-medium">
                Configure module privileges for <strong className="text-indigo-950">{permissionTargetUser.fullName}</strong>:
              </p>

              <div className="space-y-2">
                {[
                  { key: 'canEditGrades', title: 'Edit & Upload Continuous Assessment Grades', default: true },
                  { key: 'canPublishCbt', title: 'Upload & Release CBT Examination Papers', default: true },
                  { key: 'canAccessBursary', title: 'View Financial Vault & Issuance Receipts', default: permissionTargetUser.role === 'School_Admin' },
                  { key: 'canSendBroadcasts', title: 'Transmit School-Wide Broadcast Announcements', default: permissionTargetUser.role === 'School_Admin' }
                ].map(p => (
                  <label key={p.key} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={p.default}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 text-xs">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
