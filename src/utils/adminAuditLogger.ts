export type AdminActionType = 
  | 'kill_switch' 
  | 'publish_results' 
  | 'lock_results' 
  | 'purge_cache' 
  | 'tier_change' 
  | 'security_override' 
  | 'rbac_update' 
  | 'backup_export'
  | 'financial_clearance';

export type AdminActionSeverity = 'critical' | 'high' | 'warning' | 'info';

export interface AdminActivityLog {
  id: string;
  actionType: AdminActionType;
  actionTitle: string;
  severity: AdminActionSeverity;
  performedBy: {
    name: string;
    role: string;
    email?: string;
  };
  targetResource: string;
  timestamp: string; // ISO 8601 string
  details: string;
  authMethod: 'password_reauth' | '2fa_certified' | 'super_admin_override' | 'session_token';
  ipAddress?: string;
  deviceInfo?: string;
  status: 'authorized' | 'revoked' | 'executed' | 'warning';
}

const STORAGE_KEY = 'CS_ADMIN_AUDIT_LOGS';

export const INITIAL_AUDIT_LOGS: AdminActivityLog[] = [
  {
    id: 'act-001',
    actionType: 'publish_results',
    actionTitle: 'Academic Results Published to Live Portals',
    severity: 'critical',
    performedBy: {
      name: 'Dr. Adeyemi Okonjo',
      role: 'School_Admin',
      email: 'principal@cornerstreams.edu.ng'
    },
    targetResource: 'Terminal Report Cards & Broadsheets (2025/2026 1st Term)',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    details: 'Completed 3-point statutory certification and password authorization to unlock report cards for 840 learners.',
    authMethod: '2fa_certified',
    ipAddress: '102.89.44.120 (Lagos, NG)',
    deviceInfo: 'Chrome 128 / macOS Sonoma (Verified Admin Device)',
    status: 'executed'
  },
  {
    id: 'act-002',
    actionType: 'security_override',
    actionTitle: 'Administrative Master Passkey Authenticated',
    severity: 'high',
    performedBy: {
      name: 'Engr. Mervyn Dean',
      role: 'Super_Admin',
      email: 'mervyndeanhilary@gmail.com'
    },
    targetResource: 'Security Settings & RBAC Access Matrix',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // ~1 hour ago
    details: 'Accessed sensitive institutional security settings with elevated 2-factor authentication.',
    authMethod: 'password_reauth',
    ipAddress: '197.210.55.88 (Abuja, NG)',
    deviceInfo: 'Edge 127 / Windows 11 Enterprise',
    status: 'authorized'
  },
  {
    id: 'act-003',
    actionType: 'tier_change',
    actionTitle: 'Institutional License Tier Reconfigured',
    severity: 'high',
    performedBy: {
      name: 'Dr. Adeyemi Okonjo',
      role: 'School_Admin',
      email: 'principal@cornerstreams.edu.ng'
    },
    targetResource: 'Unified Enterprise Suite (All Modules Active)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), // 3.5 hours ago
    details: 'Switched school subscription profile to Unified Enterprise Suite; enabled CBT examination engine and automated bursary ledger.',
    authMethod: 'password_reauth',
    ipAddress: '102.89.44.120 (Lagos, NG)',
    deviceInfo: 'Chrome 128 / macOS Sonoma',
    status: 'executed'
  },
  {
    id: 'act-004',
    actionType: 'purge_cache',
    actionTitle: 'Offline Storage & Local Sync Ledger Reset',
    severity: 'critical',
    performedBy: {
      name: 'Engr. Mervyn Dean',
      role: 'Super_Admin',
      email: 'mervyndeanhilary@gmail.com'
    },
    targetResource: 'Browser Local Storage & IndexedDB Synchronization Queue',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago
    details: 'Authorized data cache purge with confirmation phrase "CLEAR-DATA" and master password re-entry.',
    authMethod: 'password_reauth',
    ipAddress: '197.210.55.88 (Abuja, NG)',
    deviceInfo: 'Edge 127 / Windows 11 Enterprise',
    status: 'executed'
  },
  {
    id: 'act-005',
    actionType: 'rbac_update',
    actionTitle: 'Faculty Subject Assignment Permissions Modified',
    severity: 'warning',
    performedBy: {
      name: 'Mrs. Folashade Adeleke',
      role: 'School_Admin',
      email: 'adeleke.admin@cornerstreams.edu.ng'
    },
    targetResource: 'Teacher Subject Assignment Matrix (Senior Secondary Cohorts)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    details: 'Re-assigned SS2 Mathematics workload and updated continuous assessment approval privileges.',
    authMethod: 'session_token',
    ipAddress: '102.89.45.19 (Lagos, NG)',
    deviceInfo: 'Safari 18 / iPadOS 18',
    status: 'executed'
  }
];

export function getAllAdminActivities(): AdminActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse admin audit logs:', err);
    return INITIAL_AUDIT_LOGS;
  }
}

export function getRecentAdminActivities(limitCount = 5): AdminActivityLog[] {
  const all = getAllAdminActivities();
  // Sort descending by timestamp
  return all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limitCount);
}

export function logAdminActivity(
  data: Omit<AdminActivityLog, 'id' | 'timestamp'> & { timestamp?: string }
): AdminActivityLog {
  const currentLogs = getAllAdminActivities();
  const newLog: AdminActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: data.timestamp || new Date().toISOString(),
    ...data,
  };

  const updated = [newLog, ...currentLogs].slice(0, 100); // keep last 100
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('cs_admin_activity_logged', { detail: newLog }));
  return newLog;
}

export function clearAdminActivities(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('storage'));
}

export function resetAdminActivitiesToDefault(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  window.dispatchEvent(new Event('storage'));
}
