/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CbtExam, CbtQuestion } from '../types';

export interface CompressedExamBundle {
  header: {
    v: string; // Version
    id: string;
    t: string; // Title
    s: string; // Subject
    c: string; // Class
    d: number; // Duration
    ts: string; // Timestamp
    qCount: number;
    cs: string; // Checksum
  };
  p: string; // Compressed encrypted payload string
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatioPct: number;
}

// Lightweight XOR cipher key for bandwidth-conscious local mesh transit
const ENCRYPTION_KEY = 'CORNER_STREAMS_CBT_SECURE_LAN_2026';

function xorEncryptDecrypt(input: string, key: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return output;
}

/**
 * Compresses and encrypts a complete CbtExam package into a sub-500KB payload string
 */
export function compressAndEncryptExamPackage(exam: CbtExam): CompressedExamBundle {
  // 1. Minify questions schema keys to eliminate JSON boilerplate noise
  const minifiedQuestions = exam.questions.map((q: CbtQuestion) => ({
    i: q.id,
    t: q.text || (q as any).questionText || '',
    o: q.options,
    c: q.correctOptionIndex,
    m: q.marks
  }));

  const minifiedExam = {
    i: exam.id,
    t: exam.title,
    s: exam.subject,
    c: exam.targetClass || 'SS 2A',
    d: exam.durationMinutes,
    p: exam.published,
    u: exam.uploadedAt || new Date().toISOString(),
    q: minifiedQuestions
  };

  const jsonString = JSON.stringify(minifiedExam);
  const originalSizeKb = Math.round((jsonString.length / 1024) * 10) / 10;

  // 2. Encrypt minified string using XOR cipher + Base64 encoding
  const xorEncrypted = xorEncryptDecrypt(jsonString, ENCRYPTION_KEY);
  const base64Encrypted = btoa(encodeURIComponent(xorEncrypted));

  const compressedSizeKb = Math.round((base64Encrypted.length / 1024) * 10) / 10;
  const compressionRatioPct = Math.round((1 - compressedSizeKb / Math.max(0.1, originalSizeKb)) * 100);

  // Generate simple checksum
  let checksumVal = 0;
  for (let i = 0; i < base64Encrypted.length; i++) {
    checksumVal = (checksumVal + base64Encrypted.charCodeAt(i)) % 65535;
  }
  const checksumHex = checksumVal.toString(16).toUpperCase();

  return {
    header: {
      v: '1.0-ULTRA-LIGHT',
      id: exam.id,
      t: exam.title,
      s: exam.subject,
      c: exam.targetClass || 'SS 2A',
      d: exam.durationMinutes,
      ts: new Date().toISOString(),
      qCount: exam.questions.length,
      cs: checksumHex
    },
    p: base64Encrypted,
    originalSizeKb,
    compressedSizeKb,
    compressionRatioPct
  };
}

/**
 * Decrypts and decompresses an ultra-light payload package back into a full CbtExam object
 */
export function decompressAndDecryptExamPackage(bundle: CompressedExamBundle | string): CbtExam {
  let payloadStr = '';
  if (typeof bundle === 'string') {
    try {
      const parsed = JSON.parse(bundle);
      payloadStr = parsed.p || parsed;
    } catch {
      payloadStr = bundle;
    }
  } else {
    payloadStr = bundle.p;
  }

  // Decrypt Base64 + XOR
  const xorEncrypted = decodeURIComponent(atob(payloadStr));
  const jsonString = xorEncryptDecrypt(xorEncrypted, ENCRYPTION_KEY);
  const minified = JSON.parse(jsonString);

  // Reconstruct full CbtExam object
  const questions: CbtQuestion[] = (minified.q || []).map((mq: any) => ({
    id: mq.i,
    text: mq.t,
    options: mq.o,
    correctOptionIndex: mq.c,
    marks: mq.m || 1
  }));

  return {
    id: minified.i,
    title: minified.t,
    subject: minified.s,
    targetClass: minified.c,
    durationMinutes: minified.d,
    published: minified.p,
    uploadedAt: minified.u,
    questions
  };
}
