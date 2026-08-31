import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs,
  onSnapshot,
  query,
  limit,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, GradeRecord, BillingRecord } from '../types';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore database with the configured database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Sign in with Google using Firebase Authentication Popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Check if user document already exists in Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnapshot = await getDoc(userDocRef);

    let profile: UserProfile;

    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      profile = {
        id: fbUser.uid,
        username: data.username || (fbUser.email ? fbUser.email.split('@')[0].toUpperCase() : 'USER'),
        fullName: data.fullName || fbUser.displayName || 'Corner Streams User',
        role: data.role || 'School_Admin',
        email: fbUser.email || data.email,
        phone: data.phone || fbUser.phoneNumber || '+234 814 188 0550',
        photoUrl: fbUser.photoURL || data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        arm: data.arm
      };
      // Update last login timestamp
      await updateDoc(userDocRef, {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    } else {
      // Determine default role based on email or admin privileges
      let role: any = 'School_Admin';
      const emailLower = (fbUser.email || '').toLowerCase();
      if (emailLower.includes('mervyn') || emailLower.includes('superadmin')) {
        role = 'Super_Admin';
      } else if (emailLower.includes('teacher')) {
        role = 'Class_Teacher';
      } else if (emailLower.includes('parent')) {
        role = 'Parent';
      } else if (emailLower.includes('student')) {
        role = 'Student';
      }

      profile = {
        id: fbUser.uid,
        username: fbUser.email ? fbUser.email.split('@')[0].toUpperCase() : 'CS-USER',
        fullName: fbUser.displayName || 'Authenticated User',
        role: role,
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '+234 814 188 0550',
        photoUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150'
      };

      // Save new user profile into Firestore
      await setDoc(userDocRef, {
        ...profile,
        authProvider: 'google.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch((e) => console.warn('Firestore setDoc warning:', e));
    }

    return { user: fbUser, profile };
  } catch (error: any) {
    console.warn('Google Sign-In Error Code:', error?.code, error?.message);
    throw error;
  }
}

/**
 * Sign out current Firebase Auth user
 */
export async function logOutFromFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    if (!profile.id) return;
    const userDocRef = doc(db, 'users', profile.id);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Sync user profile error:', e);
  }
}

/**
 * Sync school metadata to Firestore
 */
export async function syncSchoolToFirestore(school: any): Promise<void> {
  try {
    const schoolId = school.id || 'sch-0042';
    const schoolDocRef = doc(db, 'schools', schoolId);
    await setDoc(schoolDocRef, {
      ...school,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Sync school error:', e);
  }
}

/**
 * Fetch school from Firestore
 */
export async function fetchSchoolFromFirestore(schoolId: string = 'sch-0042'): Promise<any | null> {
  try {
    const schoolDocRef = doc(db, 'schools', schoolId);
    const snap = await getDoc(schoolDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Fetch school error:', e);
  }
  return null;
}

/**
 * Sync grade records to Firestore with Atomic Write Batches (Chunks up to 500 items)
 */
export async function syncGradesToFirestore(grades: GradeRecord[]): Promise<number> {
  if (!grades || grades.length === 0) return 0;
  
  const CHUNK_SIZE = 450; // Firestore limit is 500 operations per batch
  let totalCommitted = 0;
  const now = new Date().toISOString();

  try {
    for (let i = 0; i < grades.length; i += CHUNK_SIZE) {
      const chunk = grades.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const record of chunk) {
        if (record.id) {
          const gradeDocRef = doc(db, 'grades', record.id);
          batch.set(gradeDocRef, {
            ...record,
            updatedAt: now
          }, { merge: true });
        }
      }

      await batch.commit();
      totalCommitted += chunk.length;
    }
    return totalCommitted;
  } catch (e) {
    console.warn('Atomic Batch sync grades to Firestore warning:', e);
    return totalCommitted;
  }
}

/**
 * Atomic batch synchronization for Billing & Financial records
 */
export async function syncBillingRecordsToFirestore(records: BillingRecord[]): Promise<number> {
  if (!records || records.length === 0) return 0;

  const CHUNK_SIZE = 450;
  let totalCommitted = 0;
  const now = new Date().toISOString();

  try {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const record of chunk) {
        if (record.id) {
          const billingDocRef = doc(db, 'billing_records', record.id);
          batch.set(billingDocRef, {
            ...record,
            updatedAt: now
          }, { merge: true });
        }
      }

      await batch.commit();
      totalCommitted += chunk.length;
    }
    return totalCommitted;
  } catch (e) {
    console.warn('Atomic batch sync billing to Firestore warning:', e);
    return totalCommitted;
  }
}

/**
 * Concurrency Safeguard: Atomic Payment Processing & Ledger Mutation via Firestore runTransaction
 * Prevents double-processing or race conditions with an Idempotency Token
 */
export async function atomicProcessPaymentWithTransaction(
  billingId: string,
  amountPaid: number,
  paymentRef: string,
  actorName: string,
  idempotencyToken: string
): Promise<{ success: boolean; newBalance: number; receiptNo: string; error?: string }> {
  try {
    const billingRef = doc(db, 'billing_records', billingId);
    const auditLedgerRef = doc(db, 'financial_ledger_entries', `ledger-${paymentRef}`);
    const schoolStatsRef = doc(db, 'school_financial_summary', 'sch-0042');

    return await runTransaction(db, async (transaction) => {
      // 1. Read current billing record
      const billingDoc = await transaction.get(billingRef);
      if (!billingDoc.exists()) {
        throw new Error(`Billing record ${billingId} not found`);
      }

      const billingData = billingDoc.data();
      
      // Idempotency check: if this payment reference was already recorded, avoid duplicate decrement
      const existingHistory = billingData.paymentHistory || [];
      const isAlreadyProcessed = existingHistory.some((h: any) => h.paymentRef === paymentRef || h.idempotencyToken === idempotencyToken);
      if (isAlreadyProcessed) {
        return {
          success: true,
          newBalance: billingData.balanceDue || 0,
          receiptNo: billingData.receiptNo || `CS-REC-${billingId}`
        };
      }

      const currentBalance = Number(billingData.balanceDue || billingData.amount || 0);
      const currentPaid = Number(billingData.amountPaid || 0);
      const newPaid = currentPaid + amountPaid;
      const newBalance = Math.max(0, currentBalance - amountPaid);
      const newStatus = newBalance === 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');
      const timestamp = new Date().toISOString();
      const receiptNo = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const paymentEntry = {
        paymentRef,
        amountPaid,
        receiptNo,
        idempotencyToken,
        recordedBy: actorName,
        paidAt: timestamp
      };

      // 2. Perform atomic writes
      transaction.update(billingRef, {
        amountPaid: newPaid,
        balanceDue: newBalance,
        status: newStatus,
        paymentHistory: [...existingHistory, paymentEntry],
        receiptNo,
        updatedAt: timestamp
      });

      // Write ledger entry
      transaction.set(auditLedgerRef, {
        id: `ledger-${paymentRef}`,
        schoolId: 'sch-0042',
        type: 'INCOME',
        sector: 'Tuition & Academic Fees',
        amount: amountPaid,
        reference: paymentRef,
        receiptNo,
        description: `Tuition settlement for ${billingData.studentName || 'Student'} (${billingId})`,
        recordedBy: actorName,
        timestamp,
        idempotencyToken
      });

      // Update school summary
      transaction.set(schoolStatsRef, {
        lastPaymentAt: timestamp,
        lastTransactionRef: paymentRef,
        updatedAt: timestamp
      }, { merge: true });

      return {
        success: true,
        newBalance,
        receiptNo
      };
    });
  } catch (error: any) {
    console.error('Firestore transaction failed:', error);
    return {
      success: false,
      newBalance: 0,
      receiptNo: '',
      error: error?.message || 'Transaction aborted due to concurrency conflict'
    };
  }
}

/**
 * Save AI analysis or deep reasoning artifact to Firestore
 */
export async function saveAiAnalysisToFirestore(analysis: {
  type: string;
  title: string;
  modelUsed: string;
  thinkingLevel?: string;
  content: any;
}): Promise<string> {
  try {
    const id = 'analysis-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const docRef = doc(db, 'ai_analyses', id);
    await setDoc(docRef, {
      id,
      ...analysis,
      createdAt: new Date().toISOString()
    });
    return id;
  } catch (e) {
    console.warn('Save AI analysis error:', e);
    return '';
  }
}

