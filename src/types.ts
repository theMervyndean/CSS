/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SchoolArmType = 'Creche' | 'Nursery' | 'Montessori' | 'Primary' | 'Secondary';

export type UserRole = 'Super_Admin' | 'School_Admin' | 'Class_Teacher' | 'Non_Class_Teacher' | 'Parent' | 'Student';

export interface UserProfile {
  id: string;               // Unique ID
  username: string;         // Unique structured username (e.g. CS-SEC-0042)
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  photoUrl: string;          // Student passport photo / Avatar
  arm?: SchoolArmType;       // Applicable to students/teachers
  gradeLevel?: string;       // e.g. "Grade 10 / JSS 3"
  classCohort?: string;      // e.g. "Class A"
  parentId?: string;        // If Student
  studentIds?: string[];     // If Parent
}

// CBT Exam Engine types
export interface CbtQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number; // Stored securely on server, represented here
  marks: number;
}

export interface CbtExam {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  questions: CbtQuestion[];
  published: boolean; // True means results are visible to students (subject to global published check)
}

export interface CbtSessionState {
  examId: string;
  studentId: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  timeLeftSeconds: number;
  isCompleted: boolean;
  score?: number;
  startedAt: string;
  lastSavedAt: string;
}

// Grade Book & CA Configuration
export type CaFrequencyType = '2_CA' | '4_CA';

export interface CaScoreValues {
  ca1: number; // Max 10
  ca2: number; // Max 10
  ca3?: number; // Max 10 (applicable for 4_CA)
  ca4?: number; // Max 10 (applicable for 4_CA)
  exam: number; // Max 60 (for 4_CA, total ca is 40. For 2_CA, ca1+ca2 are 20/20 or scaled. Let's make: CA 1 (10) + CA 2 (10) + CA 3 (10) + CA 4 (10) + EXAM (60) = 100 max)
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  subjectName: string;
  caType: CaFrequencyType;
  scores: CaScoreValues;
  totalScore: number; // calculated max 100
  gradeLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
  term: string; // e.g. "First Term"
  session: string; // e.g. "2023/2024"
  teacherVerified: boolean;
}

// Financial Ledgers & Billing
export interface BillingRecord {
  id: string;
  parentId: string;
  studentId: string;
  studentName: string;
  invoiceNumber: string;
  term: string;
  session: string;
  tuitionFee: number;
  admissionFee: number;
  cbtProcessingFee: number;
  miscellaneousFee: number;
  totalAmount: number;
  amountPaid: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  history: PaymentHistoryItem[];
}

export interface PaymentHistoryItem {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  date: string;
  description: string;
}

export type NotificationCategory = 'grade_publication' | 'upcoming_exam' | 'payment_deadline' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;
  targetRole?: UserRole | 'all';
  targetUserId?: string;
  actionTab?: string; // Tab to switch to when clicked (e.g. 'result_checker', 'cbt_exam_engine', 'bursar_console', 'parent_portal')
}

