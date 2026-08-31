/**
 * Naziee AI Permissions & Capabilities Engine
 * Derives available AI co-pilot features based on user role and school subscription tier.
 */

export type UserRole = 'Super_Admin' | 'School_Admin' | 'Class_Teacher' | 'Non_Class_Teacher' | 'Parent' | 'Student' | string;

export type NazieeSubscriptionTier = 
  | 'unified_enterprise' 
  | 'enterprise'
  | 'cbt_plus_results' 
  | 'digital_reports' 
  | 'cbt_essentials' 
  | 'financial_ledger'
  | 'starter' 
  | 'basic'
  | string;

export interface NazieePermissions {
  tier: string;
  tierLabel: string;
  role: string;
  isEnterprise: boolean;
  isStarter: boolean;
  maxQuestionsPerBatch: number;
  canAccess360AdminView: boolean;
  canAccessTextToQuestions: boolean;
  canAccessScholarTutor: boolean;
  canAccessReportCardSynthesis: boolean;
  canAccessFacultyIntervention: boolean;
  canAccessTrajectoryAnalytics: boolean;
  canAccessBursaryLedgerAudit: boolean;
  unlimitedAiPrompts: boolean;
  allowedFeatures: string[];
}

/**
 * Returns available AI capabilities for Naziee based on user role and subscription tier.
 * Enterprise users get full access, Starter/Essentials users get basic assistance.
 *
 * Usage examples:
 *  - getNazieePermissions('School_Admin', 'unified_enterprise')
 *  - getNazieePermissions('Class_Teacher', 'starter')
 *  - getNazieePermissions({ role: 'Super_Admin', subscriptionTier: 'cbt_plus_results' })
 */
export function getNazieePermissions(
  roleOrContext?: string | { role?: string; subscriptionTier?: string; tier?: string },
  tierParam?: string
): NazieePermissions {
  let role = 'Student';
  let rawTier = 'unified_enterprise';

  if (typeof roleOrContext === 'object' && roleOrContext !== null) {
    role = roleOrContext.role || role;
    rawTier = roleOrContext.subscriptionTier || roleOrContext.tier || rawTier;
  } else if (typeof roleOrContext === 'string') {
    const normalizedParam = roleOrContext.toLowerCase().trim();
    if ([
      'unified_enterprise', 'enterprise', 'cbt_plus_results', 
      'digital_reports', 'cbt_essentials', 'starter', 'basic', 'financial_ledger'
    ].includes(normalizedParam)) {
      rawTier = normalizedParam;
      if (tierParam) role = tierParam;
    } else {
      role = roleOrContext;
      if (tierParam) rawTier = tierParam;
    }
  }

  const normalizedRole = role.toLowerCase().trim();
  const normalizedTier = rawTier.toLowerCase().trim();

  const isAdmin = normalizedRole.includes('admin');
  const isTeacher = normalizedRole.includes('teacher');

  let tierKey = 'unified_enterprise';
  let tierLabel = 'Unified Enterprise Suite';
  let maxQuestionsPerBatch = 20;
  let unlimitedAiPrompts = true;
  let isEnterprise = false;
  let isStarter = false;

  if (normalizedTier === 'enterprise' || normalizedTier === 'unified_enterprise' || normalizedTier.includes('enterprise')) {
    tierKey = 'unified_enterprise';
    tierLabel = 'Unified Enterprise Suite';
    maxQuestionsPerBatch = 20;
    unlimitedAiPrompts = true;
    isEnterprise = true;
  } else if (normalizedTier === 'cbt_plus_results' || normalizedTier.includes('plus') || normalizedTier.includes('cbt_plus')) {
    tierKey = 'cbt_plus_results';
    tierLabel = 'CBT Plus Results Suite';
    maxQuestionsPerBatch = 15;
    unlimitedAiPrompts = true;
  } else if (normalizedTier === 'digital_reports' || normalizedTier.includes('report')) {
    tierKey = 'digital_reports';
    tierLabel = 'Digital Reports Suite';
    maxQuestionsPerBatch = 10;
    unlimitedAiPrompts = true;
  } else if (normalizedTier === 'financial_ledger' || normalizedTier.includes('ledger')) {
    tierKey = 'financial_ledger';
    tierLabel = 'Financial Ledger Suite';
    maxQuestionsPerBatch = 10;
    unlimitedAiPrompts = true;
  } else if (
    normalizedTier === 'cbt_essentials' || 
    normalizedTier === 'starter' || 
    normalizedTier === 'basic' || 
    normalizedTier.includes('essential') || 
    normalizedTier.includes('starter')
  ) {
    tierKey = 'cbt_essentials';
    tierLabel = 'CBT Essentials (Starter)';
    maxQuestionsPerBatch = 5;
    unlimitedAiPrompts = false;
    isStarter = true;
  } else {
    // Default fallback to full enterprise
    tierKey = 'unified_enterprise';
    tierLabel = 'Unified Enterprise Suite';
    maxQuestionsPerBatch = 20;
    unlimitedAiPrompts = true;
    isEnterprise = true;
  }

  // Capabilities matrix
  const canAccess360AdminView = isAdmin && (isEnterprise || tierKey === 'cbt_plus_results');
  const canAccessTextToQuestions = (isTeacher || isAdmin) && maxQuestionsPerBatch >= 5;
  const canAccessScholarTutor = true; // Socratic mentor active for all users
  const canAccessReportCardSynthesis = (isTeacher || isAdmin) && (isEnterprise || tierKey === 'cbt_plus_results' || tierKey === 'digital_reports');
  const canAccessFacultyIntervention = (isTeacher || isAdmin) && (isEnterprise || tierKey === 'cbt_plus_results');
  const canAccessTrajectoryAnalytics = isEnterprise || tierKey === 'cbt_plus_results' || tierKey === 'digital_reports';
  const canAccessBursaryLedgerAudit = isAdmin && (isEnterprise || tierKey === 'financial_ledger');

  const allowedFeatures: string[] = [];

  if (canAccessScholarTutor) {
    allowedFeatures.push('Nonye Scholar AI Socratic Homework Mentor');
  }
  if (canAccessTextToQuestions) {
    allowedFeatures.push(`Nonye Exam Architect Text-to-Questions (Up to ${maxQuestionsPerBatch}/batch)`);
  }
  if (canAccessReportCardSynthesis) {
    allowedFeatures.push('Nonye Narrative Synthesizer Report Card Comments');
  }
  if (canAccess360AdminView) {
    allowedFeatures.push('Nonye 360° Command Matrix & Executive Briefings');
  }
  if (canAccessFacultyIntervention) {
    allowedFeatures.push('Nonye Faculty Mentor AI Remediation Plans');
  }
  if (canAccessTrajectoryAnalytics) {
    allowedFeatures.push('Nonye Trajectory & Performance Advisory');
  }
  if (canAccessBursaryLedgerAudit) {
    allowedFeatures.push('Nonye Bursary Ledger Compliance AI');
  }

  return {
    tier: tierKey,
    tierLabel,
    role,
    isEnterprise,
    isStarter,
    maxQuestionsPerBatch,
    canAccess360AdminView,
    canAccessTextToQuestions,
    canAccessScholarTutor,
    canAccessReportCardSynthesis,
    canAccessFacultyIntervention,
    canAccessTrajectoryAnalytics,
    canAccessBursaryLedgerAudit,
    unlimitedAiPrompts,
    allowedFeatures
  };
}

export default getNazieePermissions;
