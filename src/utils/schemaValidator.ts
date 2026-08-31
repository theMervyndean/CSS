/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultGradeRecords, mockBillingRecords } from '../mockData';
import { GradeRecord, BillingRecord } from '../types';

export interface ValidationReport {
  isValid: boolean;
  repairedKeys: string[];
  errors: Record<string, string>;
}

const DEFAULT_SCHOOL = {
  id: "sch-0042",
  name: "Corner Streams Private School",
  principal_name: "Chief Folasade Adebayo",
  email: "bursar@cornerstreams.edu.ng",
  phone: "+234 814 188 0550",
  subscription_tier: "unified_enterprise",
  verification_status: "pending_verification",
  welcome_complete: false,
  kill_switch: false,
  benchmark: 50,
  classes: ["Primary 1", "Primary 2", "JSS 1", "JSS 2", "SS 1", "SS 2", "SS 3"]
};

/**
 * Validates the CS_SCHOOL object schema in localStorage.
 * Restores or repairs corrupted fields if necessary.
 */
export function validateSchoolSchema(): boolean {
  const key = 'CS_SCHOOL';
  const raw = localStorage.getItem(key);
  let repaired = false;

  if (!raw) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_SCHOOL));
    return true;
  }

  try {
    const data = JSON.parse(raw);

    // Schema checks: must be a non-null object (not array)
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn(`[SchemaValidator] CS_SCHOOL corrupted (not an object). Restoring default school.`);
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHOOL));
      return true;
    }

    const repairedSchool = { ...data };

    // Required field validation & sanitization
    if (typeof repairedSchool.id !== 'string' || !repairedSchool.id.trim()) {
      repairedSchool.id = DEFAULT_SCHOOL.id;
      repaired = true;
    }

    if (typeof repairedSchool.name !== 'string' || !repairedSchool.name.trim()) {
      repairedSchool.name = DEFAULT_SCHOOL.name;
      repaired = true;
    }

    if (typeof repairedSchool.benchmark !== 'number' || Number.isNaN(repairedSchool.benchmark) || repairedSchool.benchmark < 0 || repairedSchool.benchmark > 100) {
      repairedSchool.benchmark = DEFAULT_SCHOOL.benchmark;
      repaired = true;
    }

    if (!Array.isArray(repairedSchool.classes) || repairedSchool.classes.length === 0) {
      repairedSchool.classes = DEFAULT_SCHOOL.classes;
      repaired = true;
    }

    if (typeof repairedSchool.subscription_tier !== 'string') {
      repairedSchool.subscription_tier = DEFAULT_SCHOOL.subscription_tier;
      repaired = true;
    }

    if (repaired) {
      console.warn(`[SchemaValidator] Repairing corrupted fields in CS_SCHOOL.`);
      localStorage.setItem(key, JSON.stringify(repairedSchool));
    }
  } catch (err) {
    console.error(`[SchemaValidator] Invalid JSON in CS_SCHOOL:`, err);
    localStorage.setItem(key, JSON.stringify(DEFAULT_SCHOOL));
    return true;
  }

  return repaired;
}

/**
 * Validates CS_GRADES array schema in localStorage.
 * Filters or restores default grade records if corrupted.
 */
export function validateGradesSchema(): boolean {
  const key = 'CS_GRADES';
  const raw = localStorage.getItem(key);

  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultGradeRecords));
    return true;
  }

  try {
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.warn(`[SchemaValidator] CS_GRADES corrupted (not an array). Restoring defaults.`);
      localStorage.setItem(key, JSON.stringify(defaultGradeRecords));
      return true;
    }

    // Filter and sanitize items
    const validGrades: GradeRecord[] = data.filter((item: any) => {
      if (!item || typeof item !== 'object') return false;
      if (typeof item.id !== 'string' || !item.id) return false;
      if (typeof item.studentId !== 'string' && typeof item.studentName !== 'string') return false;
      if (typeof item.totalScore !== 'number' && typeof item.scores !== 'object') return false;
      return true;
    });

    if (validGrades.length === 0) {
      console.warn(`[SchemaValidator] All items in CS_GRADES were invalid. Restoring defaults.`);
      localStorage.setItem(key, JSON.stringify(defaultGradeRecords));
      return true;
    }

    if (validGrades.length !== data.length) {
      console.warn(`[SchemaValidator] Removed ${data.length - validGrades.length} corrupted records from CS_GRADES.`);
      localStorage.setItem(key, JSON.stringify(validGrades));
      return true;
    }
  } catch (err) {
    console.error(`[SchemaValidator] Invalid JSON in CS_GRADES:`, err);
    localStorage.setItem(key, JSON.stringify(defaultGradeRecords));
    return true;
  }

  return false;
}

/**
 * Validates CS_BILLING_LEDGER array schema in localStorage.
 * Filters or restores default billing records if corrupted.
 */
export function validateBillingSchema(): boolean {
  const key = 'CS_BILLING_LEDGER';
  const raw = localStorage.getItem(key);

  if (!raw) {
    localStorage.setItem(key, JSON.stringify(mockBillingRecords));
    return true;
  }

  try {
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.warn(`[SchemaValidator] CS_BILLING_LEDGER corrupted (not an array). Restoring defaults.`);
      localStorage.setItem(key, JSON.stringify(mockBillingRecords));
      return true;
    }

    // Filter and sanitize items
    const validBilling: BillingRecord[] = data.filter((item: any) => {
      if (!item || typeof item !== 'object') return false;
      if (typeof item.id !== 'string' || !item.id) return false;
      if (typeof item.totalAmount !== 'number' || Number.isNaN(item.totalAmount)) return false;
      if (typeof item.status !== 'string') return false;
      return true;
    });

    if (validBilling.length === 0) {
      console.warn(`[SchemaValidator] All items in CS_BILLING_LEDGER were invalid. Restoring defaults.`);
      localStorage.setItem(key, JSON.stringify(mockBillingRecords));
      return true;
    }

    if (validBilling.length !== data.length) {
      console.warn(`[SchemaValidator] Removed ${data.length - validBilling.length} corrupted records from CS_BILLING_LEDGER.`);
      localStorage.setItem(key, JSON.stringify(validBilling));
      return true;
    }
  } catch (err) {
    console.error(`[SchemaValidator] Invalid JSON in CS_BILLING_LEDGER:`, err);
    localStorage.setItem(key, JSON.stringify(mockBillingRecords));
    return true;
  }

  return false;
}

/**
 * Sweeps all core localStorage schemas and returns a validation summary.
 */
export function validateLocalStorageSchema(): ValidationReport {
  const errors: Record<string, string> = {};
  const repairedKeys: string[] = [];

  try {
    if (validateSchoolSchema()) repairedKeys.push('CS_SCHOOL');
  } catch (e: any) {
    errors['CS_SCHOOL'] = e.message || 'Failed validating school schema';
  }

  try {
    if (validateGradesSchema()) repairedKeys.push('CS_GRADES');
  } catch (e: any) {
    errors['CS_GRADES'] = e.message || 'Failed validating grades schema';
  }

  try {
    if (validateBillingSchema()) repairedKeys.push('CS_BILLING_LEDGER');
  } catch (e: any) {
    errors['CS_BILLING_LEDGER'] = e.message || 'Failed validating billing schema';
  }

  return {
    isValid: repairedKeys.length === 0 && Object.keys(errors).length === 0,
    repairedKeys,
    errors
  };
}

/**
 * Periodically executes schema validation every intervalMs (default: 15 seconds).
 * Returns a cleanup function to clear the interval timer.
 */
export function startLocalStorageValidationTimer(intervalMs = 15000): () => void {
  // Perform an immediate sweep
  validateLocalStorageSchema();

  const intervalId = setInterval(() => {
    validateLocalStorageSchema();
  }, intervalMs);

  return () => clearInterval(intervalId);
}
