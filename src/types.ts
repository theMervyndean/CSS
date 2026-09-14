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
  
  // Security Credentials & Access Settings
  password?: string;         // Login password / passcode
  status?: 'active' | 'paused' | 'suspended'; // Account status
  last_login?: string;       // Timestamp of last active login
  created_at?: string;       // Account provision timestamp
  forcePasswordChange?: boolean; // Prompt password change on next login
  permissions?: {
    canEditGrades?: boolean;
    canPublishCbt?: boolean;
    canAccessBursary?: boolean;
    canSendBroadcasts?: boolean;
  };
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
  published: boolean; // True means results/exam published to students
  publishedToStudents?: boolean; // Dedicated status flag for exam active availability
  uploadedAt?: string; // ISO or formatted upload timestamp
  uploadedBy?: string; // Teacher or Admin who uploaded
  targetClass?: string; // e.g. "SS 2A", "SS 1B", "JSS 3", "All Classes"
  uploadSource?: 'excel' | 'manual' | 'ai';
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
export type LedgerSector = 
  | 'Tuition & Academic Fees'
  | 'Infrastructure & Maintenance'
  | 'ICT & CBT Engine Infrastructure'
  | 'Staff Payroll & Allowances'
  | 'Transport & Fleet Operations'
  | 'Stationery & Exam Supplies'
  | 'Canteen, Events & Co-Curricular';

export type LedgerType = 'INFLOW' | 'OUTFLOW';
export type LedgerStatus = 'RECONCILED' | 'PENDING_APPROVAL' | 'FLAGGED';

export interface FinancialLedgerEntry {
  id: string;
  date: string;
  sector: LedgerSector;
  type: LedgerType;
  title: string;
  amount: number;
  payerOrPayee: string;
  paymentMethod: string;
  status: LedgerStatus;
  reference: string;
  receiptNumber: string;
  notes?: string;
  approvedBy?: string;
}

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

export type AuditActionType = 'CREATE' | 'EDIT' | 'DELETE' | 'PAUSE' | 'RESUME' | 'BILLING' | 'SECURITY';
export type AuditCategory = 'STUDENT_PROFILE' | 'BILLING_RECORD' | 'ACCOUNT_STATUS' | 'STAFF_PROFILE' | 'SYSTEM_SECURITY';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: AuditActionType;
  targetCategory: AuditCategory;
  targetName: string;
  targetId: string;
  details: string;
  ipAddress?: string;
}

export type CbtAuditActionType = 'EXAM_PUBLISH' | 'EXAM_UNPUBLISH' | 'EXAM_UPLOAD' | 'GRADE_SUBMIT' | 'GRADE_UPDATE' | 'EXAM_DELETE';

export interface CbtAuditLogEntry {
  id: string;
  timestamp: string; // ISO format e.g. 2026-07-25T15:16:37.000Z
  userId: string; // e.g. CS-TCH-001 or User ID / Username
  userName: string; // e.g. Mrs. Folasade Adebayo
  userRole: string; // e.g. Subject Instructor / Teacher
  actionType: CbtAuditActionType;
  examId: string;
  examTitle: string;
  subject: string;
  targetStudentId?: string;
  targetStudentName?: string;
  scoreSubmitted?: number;
  details: string;
  ipAddress?: string;
}

export type NotificationCategory = 'grade_publication' | 'upcoming_exam' | 'payment_deadline' | 'system' | 'lead_alert' | 'registration' | 'receipt';

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

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceRecord {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: 'M' | 'F';
  status: AttendanceStatus;
  note?: string;
  timeIn?: string;
}

export interface HomeroomDailySession {
  id: string;
  schoolId: string;
  classArm: string;
  sessionType: 'morning' | 'afternoon';
  date: string;
  recordedByTeacherId: string;
  recordedByTeacherName: string;
  records: StudentAttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  savedAt: string;
}

export interface SubjectStudentAttendance {
  studentId: string;
  admissionNo: string;
  studentName: string;
  gender: 'M' | 'F';
  status: 'present' | 'absent' | 'truant_bunked' | 'late' | 'excused';
  participationGrade?: 'A' | 'B' | 'C' | 'D';
  note?: string;
}

export interface SubjectLessonTeachingLog {
  id: string;
  schoolId: string;
  classArm: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  periodNumber: number;
  periodTime: string;
  date: string;
  topicTaught: string;
  subTopic?: string;
  classDiarySummary: string;
  homeworkAssigned?: string;
  attendance: SubjectStudentAttendance[];
  lessonStatus: 'COMPLETED' | 'SUBSTITUTE_TAUGHT' | 'POSTPONED' | 'PRACTICAL_SESSION';
  recordedAt: string;
}

export type StaffAttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'OFFICIAL_DUTY';

export interface StaffDailyClockInRecord {
  id: string;
  staffId: string;
  teacherId: string;
  teacherName: string;
  role: string;
  department: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  status: StaffAttendanceStatus;
  lateMinutes?: number;
  dutyRole: string;
  loginMethod: 'PORTAL_AUTO_CHECKIN' | 'ADMIN_MANUAL' | 'BIOMETRIC_SIM';
  note?: string;
  recordedAt: string;
}

export interface SchoolAttendanceRegistryEntry {
  id: string;
  schoolId: string;
  classArm: string;
  sessionType: 'morning' | 'afternoon';
  academicSession: string;
  academicTerm: string;
  date: string;
  recordedByTeacherId: string;
  recordedByTeacherName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  records: StudentAttendanceRecord[];
  savedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  classCohort: string;
  assignedByTeacherId: string;
  assignedByTeacherName: string;
  assignedDate: string;
  dueDate: string;
  dueTime?: string;
  description: string;
  instructions: string[];
  maxMarks: number;
  attachmentName?: string;
  socraticContext?: string;
  status: 'active' | 'closed' | 'draft';
}

export type StudentAssignmentProgress = 'pending' | 'in_progress' | 'submitted';

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classCohort: string;
  submittedAt?: string;
  status: 'pending_review' | 'graded' | 'late' | 'not_submitted' | 'in_progress';
  progressStatus?: StudentAssignmentProgress;
  solutionText: string;
  studentNotes?: string;
  gradeScore?: number;
  teacherFeedback?: string;
  socraticDialogueCount?: number;
  updatedAt?: string;
}

export interface SocraticMessage {
  id: string;
  sender: 'student' | 'nonye';
  text: string;
  timestamp: string;
  guidingQuestion?: string;
  formulaHint?: string;
}

export { getNazieePermissions } from './lib/nazieePermissions';
export type { NazieePermissions, NazieeSubscriptionTier } from './lib/nazieePermissions';

