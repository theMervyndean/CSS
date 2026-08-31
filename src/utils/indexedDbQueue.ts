/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OfflinePayloadItem {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  answers: Record<string, number>;
  score?: number;
  completedAt: string;
  synced: boolean;
  encryptedBundleSizeKb: number;
}

export interface CbtLiveHeartbeatPayload {
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  totalQuestions: number;
  answeredCount: number;
  timeLeftSeconds: number;
  isFocused: boolean;
  violationsCount: number;
  lastHeartbeatAt: string;
  isCompleted: boolean;
  deviceInfo?: string;
}

export interface CbtDraftSession {
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, number>;
  currentQuestionIndex: number;
  timeLeftSeconds: number;
  lastSavedAt: string;
  proctoringViolations: number;
}

const DB_NAME = 'CornerStreamsCBTDB';
const DB_VERSION = 2;
const STORE_OFFLINE_QUEUE = 'offlineQueue';
const STORE_OFFLINE_EXAMS = 'offlineExams';
const STORE_CBT_DRAFTS = 'cbtDrafts';
const STORE_HEARTBEATS = 'cbtHeartbeats';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('synced', 'synced', { unique: false });
        queueStore.createIndex('studentId', 'studentId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_OFFLINE_EXAMS)) {
        db.createObjectStore(STORE_OFFLINE_EXAMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CBT_DRAFTS)) {
        db.createObjectStore(STORE_CBT_DRAFTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HEARTBEATS)) {
        db.createObjectStore(STORE_HEARTBEATS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save active CBT in-progress draft to IndexedDB (Instant recovery after browser crash/tab close)
 */
export async function saveCbtDraftToIndexedDb(draft: CbtDraftSession): Promise<void> {
  const id = `draft_${draft.examId}_${draft.studentId}`;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CBT_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_CBT_DRAFTS);
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ id, ...draft });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    localStorage.setItem(`CS_CBT_DRAFT_${draft.examId}_${draft.studentId}`, JSON.stringify(draft));
  }
}

/**
 * Retrieve active CBT in-progress draft
 */
export async function getCbtDraftFromIndexedDb(examId: string, studentId: string): Promise<CbtDraftSession | null> {
  const id = `draft_${examId}_${studentId}`;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CBT_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_CBT_DRAFTS);
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          const { id: _, ...rest } = req.result;
          resolve(rest as CbtDraftSession);
        } else {
          resolve(getFallbackDraft(examId, studentId));
        }
      };
      req.onerror = () => resolve(getFallbackDraft(examId, studentId));
    });
  } catch {
    return getFallbackDraft(examId, studentId);
  }
}

function getFallbackDraft(examId: string, studentId: string): CbtDraftSession | null {
  try {
    const raw = localStorage.getItem(`CS_CBT_DRAFT_${examId}_${studentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear draft after clean submission
 */
export async function clearCbtDraftFromIndexedDb(examId: string, studentId: string): Promise<void> {
  const id = `draft_${examId}_${studentId}`;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CBT_DRAFTS, 'readwrite');
    tx.objectStore(STORE_CBT_DRAFTS).delete(id);
  } catch {}
  localStorage.removeItem(`CS_CBT_DRAFT_${examId}_${studentId}`);
}

/**
 * Broadcast & Record live student heartbeat for proctor dashboard visibility
 */
export function recordCbtLiveHeartbeat(heartbeat: CbtLiveHeartbeatPayload): void {
  const key = `CS_CBT_LIVE_HEARTBEATS`;
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[`${heartbeat.examId}_${heartbeat.studentId}`] = heartbeat;
    localStorage.setItem(key, JSON.stringify(existing));

    // Also notify active broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('CS_CBT_PROCTOR_HEARTBEAT_CHANNEL');
      ch.postMessage({ type: 'HEARTBEAT_UPDATE', heartbeat });
      ch.close();
    }
  } catch (e) {
    console.warn('Heartbeat record error:', e);
  }
}

/**
 * Get all active student heartbeats for proctors / teachers
 */
export function getActiveCbtHeartbeats(examId?: string): CbtLiveHeartbeatPayload[] {
  try {
    const raw = localStorage.getItem('CS_CBT_LIVE_HEARTBEATS');
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, CbtLiveHeartbeatPayload>;
    const list = Object.values(map);
    if (examId) {
      return list.filter(h => h.examId === examId);
    }
    return list;
  } catch {
    return [];
  }
}


/**
 * Save an exam submission to the IndexedDB offline queue
 */
export async function saveToOfflineQueue(item: OfflinePayloadItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_OFFLINE_QUEUE);
    await new Promise<void>((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    // Fallback to localStorage if IndexedDB is blocked
    const fallbackKey = 'CS_OFFLINE_SYNC_QUEUE_FALLBACK';
    const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const idx = existing.findIndex((e: any) => e.id === item.id);
    if (idx >= 0) existing[idx] = item;
    else existing.push(item);
    localStorage.setItem(fallbackKey, JSON.stringify(existing));
  }
}

/**
 * Get all queued items pending sync
 */
export async function getPendingOfflineQueue(): Promise<OfflinePayloadItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_OFFLINE_QUEUE);
    const index = store.index('synced');

    return new Promise((resolve) => {
      const req = index.getAll(IDBKeyRange.only(false));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(getFallbackQueue());
    });
  } catch {
    return getFallbackQueue();
  }
}

function getFallbackQueue(): OfflinePayloadItem[] {
  try {
    const fallbackKey = 'CS_OFFLINE_SYNC_QUEUE_FALLBACK';
    const items = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    return items.filter((item: OfflinePayloadItem) => !item.synced);
  } catch {
    return [];
  }
}

/**
 * Mark item as synced in IndexedDB
 */
export async function markItemSynced(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_OFFLINE_QUEUE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.synced = true;
        store.put(item);
      }
    };
  } catch {
    const fallbackKey = 'CS_OFFLINE_SYNC_QUEUE_FALLBACK';
    const items = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const updated = items.map((i: any) => (i.id === id ? { ...i, synced: true } : i));
    localStorage.setItem(fallbackKey, JSON.stringify(updated));
  }
}

/**
 * Save an encrypted exam bundle to IndexedDB for offline taking
 */
export async function cacheOfflineExamBundle(examId: string, compressedPayload: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFLINE_EXAMS, 'readwrite');
    const store = tx.objectStore(STORE_OFFLINE_EXAMS);
    store.put({ id: examId, payload: compressedPayload, cachedAt: new Date().toISOString() });
  } catch {
    localStorage.setItem(`CS_OFFLINE_EXAM_BUNDLE_${examId}`, compressedPayload);
  }
}

/**
 * Retrieve cached offline exam bundle
 */
export async function getCachedOfflineExamBundle(examId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OFFLINE_EXAMS, 'readonly');
    const store = tx.objectStore(STORE_OFFLINE_EXAMS);
    return new Promise((resolve) => {
      const req = store.get(examId);
      req.onsuccess = () => resolve(req.result ? req.result.payload : null);
      req.onerror = () => resolve(localStorage.getItem(`CS_OFFLINE_EXAM_BUNDLE_${examId}`));
    });
  } catch {
    return localStorage.getItem(`CS_OFFLINE_EXAM_BUNDLE_${examId}`);
  }
}
