import React, { useState, useMemo } from 'react';
import { UserProfile, BillingRecord } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Users,
  Landmark,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Download,
  Printer,
  X,
  Sparkles,
  Filter,
  CreditCard,
  Building,
  FileSpreadsheet,
  Bus,
  Shield,
  Trees,
  Briefcase,
  UserCheck,
  Send,
  Eye,
  ChevronDown,
  RefreshCw,
  FileText,
  TrendingUp,
  PieChart as PieChartIcon,
  ArrowUpDown,
  Building2,
  SlidersHorizontal,
  RotateCcw,
  Copy,
  QrCode,
  Paperclip,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileCheck,
  ExternalLink,
  Trash2,
  FolderOpen,
  ShieldCheck,
  FileImage,
  Upload,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export type StaffRoleCategory =
  | 'TEACHER'
  | 'DRIVER'
  | 'ENVIRONMENTALIST'
  | 'SECURITY'
  | 'ADMIN'
  | 'CATERING'
  | 'OTHER';

export interface StaffAttachment {
  id: string;
  name: string;
  type: 'RECEIPT' | 'INVOICE' | 'BANK_STAMP' | 'APPROVAL_MEMO' | 'TAX_VOUCHER';
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
  refCode: string;
  fileFormat: 'PDF' | 'PNG' | 'JPEG';
  notes?: string;
}

export interface StaffPaymentRecord {
  id: string;
  staffId: string;
  staffName: string;
  roleCategory: StaffRoleCategory;
  jobTitle: string;
  bankName: string;
  accountNumber: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PROCESSING' | 'OVERDUE';
  paymentDate: string; // Date of payment e.g. "2026-07-28" or "Pending"
  paymentRef?: string;
  paymentChannel?: string;
  monthSession: string;
  notes?: string;
  attachments?: StaffAttachment[];
}

// Initial Mock Seed Data for School Staff Payment Ledger
const INITIAL_STAFF_PAYMENTS: StaffPaymentRecord[] = [
  {
    id: 'stf-pay-01',
    staffId: 'STF-2026-001',
    staffName: 'Mrs. Folasade Adebayo',
    roleCategory: 'TEACHER',
    jobTitle: 'Senior Mathematics & Physics Teacher (HOD)',
    bankName: 'First Bank Nigeria',
    accountNumber: '3049182736',
    baseSalary: 180000,
    allowances: 25000,
    deductions: 10000,
    netPay: 195000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-25',
    paymentRef: 'TXN-BUR-903821',
    paymentChannel: 'CBN Direct Transfer',
    monthSession: 'July 2026',
    notes: 'July salary disburse with senior faculty allowance',
    attachments: [
      {
        id: 'att-01-1',
        name: 'CBN_Direct_Transfer_Advice_Adebayo.pdf',
        type: 'RECEIPT',
        fileSize: '342 KB',
        uploadedAt: '2026-07-25 10:14 AM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'CBN-ADV-903821-A',
        fileFormat: 'PDF',
        notes: 'Official CBN bank settlement receipt for July 2026 salary'
      },
      {
        id: 'att-01-2',
        name: 'Senior_Faculty_Allowance_Invoice_Voucher.pdf',
        type: 'INVOICE',
        fileSize: '518 KB',
        uploadedAt: '2026-07-24 02:30 PM',
        uploadedBy: 'Principal Office',
        refCode: 'INV-HOD-2026-07',
        fileFormat: 'PDF',
        notes: 'Itemized HOD allowance authorization slip & tax voucher'
      },
      {
        id: 'att-01-3',
        name: 'LIRS_Tax_Withholding_Credit_Certificate.png',
        type: 'TAX_VOUCHER',
        fileSize: '185 KB',
        uploadedAt: '2026-07-25 11:00 AM',
        uploadedBy: 'Auditor Grace',
        refCode: 'TAX-LIRS-882190',
        fileFormat: 'PNG',
        notes: 'State IRS tax withholding tax credit slip'
      }
    ]
  },
  {
    id: 'stf-pay-02',
    staffId: 'STF-2026-002',
    staffName: 'Mr. Babatunde Ogunleye',
    roleCategory: 'DRIVER',
    jobTitle: 'Head School Bus Driver (Lagos Route)',
    bankName: 'Zenith Bank',
    accountNumber: '2118493021',
    baseSalary: 95000,
    allowances: 15000,
    deductions: 5000,
    netPay: 105000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-26',
    paymentRef: 'TXN-BUR-903822',
    paymentChannel: 'Bank Transfer',
    monthSession: 'July 2026',
    notes: 'Fuel stipend & fleet maintenance allowance included',
    attachments: [
      {
        id: 'att-02-1',
        name: 'Zenith_Bank_Disbursement_Slip_Ogunleye.pdf',
        type: 'RECEIPT',
        fileSize: '298 KB',
        uploadedAt: '2026-07-26 09:15 AM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'ZNB-PAY-903822',
        fileFormat: 'PDF',
        notes: 'Bank electronic transfer advice slip'
      },
      {
        id: 'att-02-2',
        name: 'School_Bus_Fleet_Fuel_Reimbursement_Invoice.pdf',
        type: 'INVOICE',
        fileSize: '412 KB',
        uploadedAt: '2026-07-25 04:20 PM',
        uploadedBy: 'Transport Manager',
        refCode: 'FLT-REIMB-2026-12',
        fileFormat: 'PDF',
        notes: 'Diesel purchase receipts & bus maintenance voucher'
      }
    ]
  },
  {
    id: 'stf-pay-03',
    staffId: 'STF-2026-003',
    staffName: 'Mrs. Chioma Eke',
    roleCategory: 'ENVIRONMENTALIST',
    jobTitle: 'Lead Campus Environmentalist & Facilities Lead',
    bankName: 'GTBank',
    accountNumber: '0129384756',
    baseSalary: 85000,
    allowances: 12000,
    deductions: 4000,
    netPay: 93000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-27',
    paymentRef: 'TXN-BUR-903823',
    paymentChannel: 'Bank Transfer',
    monthSession: 'July 2026',
    notes: 'Sanitation equipment bonus included',
    attachments: [
      {
        id: 'att-03-1',
        name: 'GTBank_Transfer_Advice_Eke.pdf',
        type: 'RECEIPT',
        fileSize: '275 KB',
        uploadedAt: '2026-07-27 11:45 AM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'GTB-DISB-903823',
        fileFormat: 'PDF',
        notes: 'GTBank account credit notification slip'
      },
      {
        id: 'att-03-2',
        name: 'Campus_Sanitation_Equipment_Approval_Memo.pdf',
        type: 'APPROVAL_MEMO',
        fileSize: '198 KB',
        uploadedAt: '2026-07-26 03:10 PM',
        uploadedBy: 'Admin Board',
        refCode: 'MEM-SAN-2026-05',
        fileFormat: 'PDF',
        notes: 'Approved allowance memo for green campus maintenance'
      }
    ]
  },
  {
    id: 'stf-pay-04',
    staffId: 'STF-2026-004',
    staffName: 'Officer Usman Bello',
    roleCategory: 'SECURITY',
    jobTitle: 'Chief Campus Security & Access Supervisor',
    bankName: 'UBA',
    accountNumber: '2093847561',
    baseSalary: 110000,
    allowances: 15000,
    deductions: 6000,
    netPay: 119000,
    paymentStatus: 'PENDING',
    paymentDate: 'Pending',
    paymentChannel: 'CBN Direct Transfer',
    monthSession: 'July 2026',
    notes: 'Awaiting bursary audit verification for night shift overtime',
    attachments: [
      {
        id: 'att-04-1',
        name: 'Night_Shift_Overtime_Log_and_Invoice.pdf',
        type: 'INVOICE',
        fileSize: '310 KB',
        uploadedAt: '2026-07-24 01:20 PM',
        uploadedBy: 'Security Lead',
        refCode: 'SEC-OVT-2026-07',
        fileFormat: 'PDF',
        notes: 'Pending bursary audit verification for night shift overtime log'
      }
    ]
  },
  {
    id: 'stf-pay-05',
    staffId: 'STF-2026-005',
    staffName: 'Mr. Chidi Okafor',
    roleCategory: 'TEACHER',
    jobTitle: 'Further Mathematics Instructor',
    bankName: 'Access Bank',
    accountNumber: '0039485721',
    baseSalary: 165000,
    allowances: 20000,
    deductions: 8000,
    netPay: 177000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-25',
    paymentRef: 'TXN-BUR-903825',
    paymentChannel: 'CBN Direct Transfer',
    monthSession: 'July 2026',
    notes: 'CBT question authoring bonus credited',
    attachments: [
      {
        id: 'att-05-1',
        name: 'Access_Bank_Disbursement_Receipt_Okafor.pdf',
        type: 'RECEIPT',
        fileSize: '325 KB',
        uploadedAt: '2026-07-25 02:10 PM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'ACC-DISB-903825',
        fileFormat: 'PDF',
        notes: 'Salary payment transaction receipt'
      },
      {
        id: 'att-05-2',
        name: 'CBT_Exam_Authoring_Stipend_Voucher.pdf',
        type: 'INVOICE',
        fileSize: '480 KB',
        uploadedAt: '2026-07-24 10:00 AM',
        uploadedBy: 'Academic Director',
        refCode: 'CBT-INV-2026-88',
        fileFormat: 'PDF',
        notes: 'Further Math CBT question bank authoring honorarium voucher'
      }
    ]
  },
  {
    id: 'stf-pay-06',
    staffId: 'STF-2026-006',
    staffName: 'Mr. Ibrahim Yusuf',
    roleCategory: 'DRIVER',
    jobTitle: 'Assistant School Bus Driver (Abuja Route)',
    bankName: 'Kuda Microfinance',
    accountNumber: '2019283746',
    baseSalary: 85000,
    allowances: 10000,
    deductions: 4000,
    netPay: 91000,
    paymentStatus: 'PENDING',
    paymentDate: 'Pending',
    paymentChannel: 'Bank Transfer',
    monthSession: 'July 2026',
    notes: 'Pending bank account details confirmation',
    attachments: [
      {
        id: 'att-06-1',
        name: 'Abuja_Route_Bus_Logistics_Invoice.pdf',
        type: 'INVOICE',
        fileSize: '260 KB',
        uploadedAt: '2026-07-22 09:30 AM',
        uploadedBy: 'Transport Dept',
        refCode: 'TRN-ABJ-2026-03',
        fileFormat: 'PDF',
        notes: 'Interstate transport allowance voucher'
      }
    ]
  },
  {
    id: 'stf-pay-07',
    staffId: 'STF-2026-007',
    staffName: 'Mr. Sunday Alabi',
    roleCategory: 'ENVIRONMENTALIST',
    jobTitle: 'Groundskeeping & Horticulture Officer',
    bankName: 'Stanbic IBTC',
    accountNumber: '0029384751',
    baseSalary: 75000,
    allowances: 8000,
    deductions: 3000,
    netPay: 80000,
    paymentStatus: 'OVERDUE',
    paymentDate: 'Overdue (Expected 25 Jul)',
    paymentChannel: 'Bank Transfer',
    monthSession: 'July 2026',
    notes: 'Payment scheduled for disbursement',
    attachments: [
      {
        id: 'att-07-1',
        name: 'Horticulture_Tools_Reimbursement_Slip.pdf',
        type: 'INVOICE',
        fileSize: '215 KB',
        uploadedAt: '2026-07-21 04:00 PM',
        uploadedBy: 'Facilities Head',
        refCode: 'HOR-REIMB-2026-01',
        fileFormat: 'PDF',
        notes: 'Lawnmower servicing invoice pending disbursement'
      }
    ]
  },
  {
    id: 'stf-pay-08',
    staffId: 'STF-2026-008',
    staffName: 'Dr. Emeka Nwosu',
    roleCategory: 'TEACHER',
    jobTitle: 'Biology & Chemistry Faculty Lead',
    bankName: 'Fidelity Bank',
    accountNumber: '5049382710',
    baseSalary: 175000,
    allowances: 22000,
    deductions: 9000,
    netPay: 188000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-25',
    paymentRef: 'TXN-BUR-903828',
    paymentChannel: 'CBN Direct Transfer',
    monthSession: 'July 2026',
    notes: 'Laboratory safety supervisor allowance included',
    attachments: [
      {
        id: 'att-08-1',
        name: 'Fidelity_Bank_Disbursement_Advice_Nwosu.pdf',
        type: 'RECEIPT',
        fileSize: '350 KB',
        uploadedAt: '2026-07-25 03:45 PM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'FID-DISB-903828',
        fileFormat: 'PDF',
        notes: 'Fidelity bank direct credit advice'
      },
      {
        id: 'att-08-2',
        name: 'Lab_Safety_Supervisor_Allowance_Memo.pdf',
        type: 'APPROVAL_MEMO',
        fileSize: '280 KB',
        uploadedAt: '2026-07-23 11:20 AM',
        uploadedBy: 'Science Faculty Board',
        refCode: 'MEM-SCI-2026-19',
        fileFormat: 'PDF',
        notes: 'Chemical laboratory supervision stipend approval'
      }
    ]
  },
  {
    id: 'stf-pay-09',
    staffId: 'STF-2026-009',
    staffName: 'Mrs. Grace Danjuma',
    roleCategory: 'ADMIN',
    jobTitle: 'Bursary Accounts & Audit Officer',
    bankName: 'First Bank Nigeria',
    accountNumber: '3119283745',
    baseSalary: 140000,
    allowances: 18000,
    deductions: 7000,
    netPay: 151000,
    paymentStatus: 'PAID',
    paymentDate: '2026-07-24',
    paymentRef: 'TXN-BUR-903829',
    paymentChannel: 'CBN Direct Transfer',
    monthSession: 'July 2026',
    notes: 'Mid-term financial report clearance bonus',
    attachments: [
      {
        id: 'att-09-1',
        name: 'FirstBank_Payroll_Settlement_Advice_Danjuma.pdf',
        type: 'RECEIPT',
        fileSize: '380 KB',
        uploadedAt: '2026-07-24 04:15 PM',
        uploadedBy: 'Bursar Babatunde',
        refCode: 'FBN-DISB-903829',
        fileFormat: 'PDF',
        notes: 'Bursary staff salary credit notification'
      },
      {
        id: 'att-09-2',
        name: 'MidTerm_Financial_Audit_Clearance_Memo.pdf',
        type: 'APPROVAL_MEMO',
        fileSize: '430 KB',
        uploadedAt: '2026-07-23 02:00 PM',
        uploadedBy: 'External Audit Firm',
        refCode: 'AUD-CLR-2026-07',
        fileFormat: 'PDF',
        notes: 'Audit clearance bonus approval certificate'
      }
    ]
  },
  {
    id: 'stf-pay-10',
    staffId: 'STF-2026-010',
    staffName: 'Mrs. Blessing Kalu',
    roleCategory: 'CATERING',
    jobTitle: 'Chief Cafeteria & Nutrition Supervisor',
    bankName: 'Zenith Bank',
    accountNumber: '2201928374',
    baseSalary: 90000,
    allowances: 12000,
    deductions: 4500,
    netPay: 97500,
    paymentStatus: 'PROCESSING',
    paymentDate: '2026-07-28',
    paymentRef: 'TXN-BUR-903830',
    paymentChannel: 'Bank Transfer',
    monthSession: 'July 2026',
    notes: 'Direct transfer initiated, awaiting interbank settlement'
  }
];

interface StaffPaymentLedgerProps {
  currentProfile: UserProfile;
  billingRecords?: BillingRecord[];
}

export default function StaffPaymentLedger({ currentProfile }: StaffPaymentLedgerProps) {
  // Main view tab: 'ledger' | 'balance_sheet'
  const [activeTab, setActiveTab] = useState<'ledger' | 'balance_sheet'>('ledger');

  // Staff records state persisted in localStorage
  const [staffRecords, setStaffRecords] = useState<StaffPaymentRecord[]>(() => {
    const saved = localStorage.getItem('CS_STAFF_PAYMENT_LEDGER');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse CS_STAFF_PAYMENT_LEDGER', e);
      }
    }
    return INITIAL_STAFF_PAYMENTS;
  });

  const saveRecords = (updated: StaffPaymentRecord[]) => {
    setStaffRecords(updated);
    localStorage.setItem('CS_STAFF_PAYMENT_LEDGER', JSON.stringify(updated));
  };

  // Filters state
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('July 2026');

  // Custom Dropdowns State for Department Filtering & Sorting
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'dept_asc' | 'net_desc' | 'net_asc' | 'name_asc' | 'status'>('dept_asc');

  // Checkbox Selection & Bulk Actions State
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isBulkPayslipModalOpen, setIsBulkPayslipModalOpen] = useState<boolean>(false);
  const [isBulkSettleConfirmOpen, setIsBulkSettleConfirmOpen] = useState<boolean>(false);
  const [bulkSettleDate, setBulkSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chartViewMode, setChartViewMode] = useState<'trend' | 'expenditure_pie'>('trend');

  const departmentOptions = [
    { k: 'ALL', label: 'All Staff Departments', icon: Building2 },
    { k: 'TEACHER', label: 'Teaching & Academic Dept', icon: UserCheck },
    { k: 'DRIVER', label: 'Transport & Fleet Logistics', icon: Bus },
    { k: 'ENVIRONMENTALIST', label: 'Facilities & Sanitation Dept', icon: Trees },
    { k: 'SECURITY', label: 'Campus Security & Safety', icon: Shield },
    { k: 'ADMIN', label: 'Administration & Bursary', icon: Briefcase },
    { k: 'CATERING', label: 'Catering & Cafeteria Services', icon: Sparkles }
  ];

  const sortOptions = [
    { k: 'dept_asc', label: 'Department Name (A-Z)' },
    { k: 'net_desc', label: 'Net Payable (Highest First)' },
    { k: 'net_asc', label: 'Net Payable (Lowest First)' },
    { k: 'name_asc', label: 'Staff Name (A-Z)' },
    { k: 'status', label: 'Payment Settlement Status' }
  ];

  // Modal States
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState<boolean>(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState<boolean>(false);
  const [selectedStaffForSettle, setSelectedStaffForSettle] = useState<StaffPaymentRecord | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settleChannel, setSettleChannel] = useState<string>('CBN Direct Transfer');
  const [settleRef, setSettleRef] = useState<string>('');

  // Payslip Modal State & Layout Customizer Settings
  const [viewPayslipStaff, setViewPayslipStaff] = useState<StaffPaymentRecord | null>(null);
  const [payslipLayoutFormat, setPayslipLayoutFormat] = useState<'A4_STANDARD' | 'COMPACT_SLIP' | 'EXECUTIVE_DETAILED'>('A4_STANDARD');
  const [payslipThemeColor, setPayslipThemeColor] = useState<'INDIGO' | 'EMERALD' | 'SLATE' | 'MONOCHROME'>('INDIGO');
  const [payslipShowLogo, setPayslipShowLogo] = useState<boolean>(true);
  const [payslipShowBankDetails, setPayslipShowBankDetails] = useState<boolean>(true);
  const [payslipShowTaxBreakdown, setPayslipShowTaxBreakdown] = useState<boolean>(true);
  const [payslipShowSignatures, setPayslipShowSignatures] = useState<boolean>(true);
  const [payslipShowQrCode, setPayslipShowQrCode] = useState<boolean>(true);
  const [payslipCustomMemo, setPayslipCustomMemo] = useState<string>('Disbursed via CBN Centralized Automated Payroll Gateway');
  const [payslipFontScale, setPayslipFontScale] = useState<'COMPACT' | 'STANDARD' | 'SPACIOUS'>('STANDARD');
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState<boolean>(true);

  // Attachment Preview Side Panel State & Form
  const [attachmentPanelStaff, setAttachmentPanelStaff] = useState<StaffPaymentRecord | null>(null);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0);
  const [attachmentZoomLevel, setAttachmentZoomLevel] = useState<number>(100);
  const [isNewDocUploadOpen, setIsNewDocUploadOpen] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocType, setNewDocType] = useState<'RECEIPT' | 'INVOICE' | 'BANK_STAMP' | 'APPROVAL_MEMO' | 'TAX_VOUCHER'>('RECEIPT');
  const [newDocFormat, setNewDocFormat] = useState<'PDF' | 'PNG' | 'JPEG'>('PDF');
  const [newDocNotes, setNewDocNotes] = useState<string>('');

  const handleOpenAttachmentPanel = (staff: StaffPaymentRecord) => {
    setAttachmentPanelStaff(staff);
    setSelectedAttachmentIndex(0);
    setAttachmentZoomLevel(100);
    setIsNewDocUploadOpen(false);
  };

  const handleAddNewAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentPanelStaff) return;

    const docTitle = newDocName.trim() || `${newDocType.replace('_', ' ')}_${Date.now()}`;
    const newAttachment: StaffAttachment = {
      id: `att-custom-${Date.now()}`,
      name: docTitle.endsWith('.pdf') || docTitle.endsWith('.png') || docTitle.endsWith('.jpg') ? docTitle : `${docTitle}.${newDocFormat.toLowerCase()}`,
      type: newDocType,
      fileSize: `${Math.floor(Math.random() * 320 + 140)} KB`,
      uploadedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      uploadedBy: currentProfile?.fullName || 'Bursary Admin',
      refCode: `REF-DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      fileFormat: newDocFormat,
      notes: newDocNotes.trim() || 'Uploaded directly via Staff Payment Ledger Side Panel'
    };

    const currentAttachments = attachmentPanelStaff.attachments || [];
    const updatedAttachments = [newAttachment, ...currentAttachments];

    const updatedStaff = {
      ...attachmentPanelStaff,
      attachments: updatedAttachments
    };

    const updatedRecords = staffRecords.map(r => r.id === updatedStaff.id ? updatedStaff : r);
    saveRecords(updatedRecords);
    setAttachmentPanelStaff(updatedStaff);
    setSelectedAttachmentIndex(0);

    // Reset Form
    setNewDocName('');
    setNewDocNotes('');
    setIsNewDocUploadOpen(false);

    toast.success(`📎 Successfully uploaded attachment "${newAttachment.name}" to ${updatedStaff.staffName}'s payment ledger!`);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!attachmentPanelStaff) return;
    const currentAttachments = attachmentPanelStaff.attachments || [];
    const filtered = currentAttachments.filter(a => a.id !== attachmentId);

    const updatedStaff = {
      ...attachmentPanelStaff,
      attachments: filtered
    };

    const updatedRecords = staffRecords.map(r => r.id === updatedStaff.id ? updatedStaff : r);
    saveRecords(updatedRecords);
    setAttachmentPanelStaff(updatedStaff);
    if (selectedAttachmentIndex >= filtered.length) {
      setSelectedAttachmentIndex(Math.max(0, filtered.length - 1));
    }

    toast.info('🗑️ Attachment document removed from staff payment record.');
  };

  const handleDownloadSingleAttachment = (att: StaffAttachment) => {
    toast.success(`📥 Downloading document attachment "${att.name}"...`);
  };

  const handleResetPayslipLayout = () => {
    setPayslipLayoutFormat('A4_STANDARD');
    setPayslipThemeColor('INDIGO');
    setPayslipShowLogo(true);
    setPayslipShowBankDetails(true);
    setPayslipShowTaxBreakdown(true);
    setPayslipShowSignatures(true);
    setPayslipShowQrCode(true);
    setPayslipCustomMemo('Disbursed via CBN Centralized Automated Payroll Gateway');
    setPayslipFontScale('STANDARD');
    toast.info('⚙️ Payslip layout settings restored to default parameters.');
  };

  const handleExportSinglePayslipCSV = (staff: StaffPaymentRecord) => {
    const rows: string[][] = [
      ['CORNER STREAMS PLATFORM - INDIVIDUAL STAFF PAYSLIP REPORT'],
      [`Staff Name: ${staff.staffName}`, `Staff ID: ${staff.staffId}`],
      [`Role: ${staff.jobTitle} (${staff.roleCategory})`, `Pay Period: ${staff.monthSession}`],
      [`Payment Date: ${staff.paymentDate}`, `Payment Status: ${staff.paymentStatus}`],
      [],
      ['Item Description', 'Classification', 'Amount (NGN)'],
      ['Base Salary', 'Fixed Gross', staff.baseSalary.toString()],
      ['Special Duty Allowances', 'Stipend', staff.allowances.toString()],
      ['Tax & Pension Deductions', 'Withholdings', (-staff.deductions).toString()],
      ['NET DISBURSED PAYABLE', 'Net Pay', staff.netPay.toString()],
      [],
      [`Bank Name: ${staff.bankName}`, `Account Number: ${staff.accountNumber}`],
      [`Payment Reference: ${staff.paymentRef || 'N/A'}`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payslip_${staff.staffId}_${staff.staffName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`📥 Downloaded itemized payslip CSV for ${staff.staffName}!`);
  };

  const handleCopyPayslipLink = (staff: StaffPaymentRecord) => {
    const url = `https://cornerstreams.edu.ng/verify/payslip/${staff.staffId}`;
    navigator.clipboard.writeText(url);
    toast.success(`📋 Copied payslip verification link for ${staff.staffName} to clipboard!`);
  };

  // Printable Balance Sheet Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Form State for Adding/Updating Worker Payment Record
  const [formStaffName, setFormStaffName] = useState<string>('');
  const [formStaffId, setFormStaffId] = useState<string>(`STF-2026-0${Math.floor(10 + Math.random() * 90)}`);
  const [formRoleCategory, setFormRoleCategory] = useState<StaffRoleCategory>('TEACHER');
  const [formJobTitle, setFormJobTitle] = useState<string>('');
  const [formBankName, setFormBankName] = useState<string>('First Bank Nigeria');
  const [formAccountNumber, setFormAccountNumber] = useState<string>('');
  const [formBaseSalary, setFormBaseSalary] = useState<number>(120000);
  const [formAllowances, setFormAllowances] = useState<number>(15000);
  const [formDeductions, setFormDeductions] = useState<number>(5000);
  const [formPaymentDate, setFormPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'PAID' | 'PENDING' | 'PROCESSING' | 'OVERDUE'>('PAID');
  const [formPaymentChannel, setFormPaymentChannel] = useState<string>('CBN Direct Transfer');
  const [formNotes, setFormNotes] = useState<string>('');

  // Calculate Net Pay dynamically in Form
  const formNetPay = Math.max(0, Number(formBaseSalary) + Number(formAllowances) - Number(formDeductions));

  // Open Settle Payment Modal
  const handleOpenSettleModal = (staff: StaffPaymentRecord) => {
    setSelectedStaffForSettle(staff);
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleChannel('CBN Direct Transfer');
    setSettleRef(`TXN-BUR-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsSettleModalOpen(true);
  };

  // Complete Settle Payment
  const handleConfirmSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForSettle) return;

    const updated = staffRecords.map((r) => {
      if (r.id === selectedStaffForSettle.id) {
        return {
          ...r,
          paymentStatus: 'PAID' as const,
          paymentDate: settleDate,
          paymentRef: settleRef || `TXN-BUR-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentChannel: settleChannel
        };
      }
      return r;
    });

    saveRecords(updated);
    toast.success(`💳 Payment settled successfully for ${selectedStaffForSettle.staffName}! Date of Payment: ${settleDate}`);
    setIsSettleModalOpen(false);
  };

  // Toggle Single Row Selection
  const handleToggleSelectRow = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All Visible Filtered Records
  const handleToggleSelectAll = () => {
    if (filteredRecords.length === 0) return;
    const allFilteredIds = filteredRecords.map((r) => r.id);
    const areAllSelected = allFilteredIds.every((id) => selectedStaffIds.includes(id));

    if (areAllSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedStaffIds, ...allFilteredIds]));
      setSelectedStaffIds(merged);
    }
  };

  // Bulk Mark as Paid Action
  const handleConfirmBulkMarkAsPaid = () => {
    if (selectedStaffIds.length === 0) return;

    let updatedCount = 0;
    const updatedRecords = staffRecords.map((r) => {
      if (selectedStaffIds.includes(r.id) && r.paymentStatus !== 'PAID') {
        updatedCount++;
        return {
          ...r,
          paymentStatus: 'PAID' as const,
          paymentDate: bulkSettleDate || new Date().toISOString().split('T')[0],
          paymentRef: `TXN-BULK-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentChannel: 'CBN Direct Bulk Settlement'
        };
      }
      return r;
    });

    saveRecords(updatedRecords);
    toast.success(
      `🎉 Bulk Settlement Complete: ${
        updatedCount > 0
          ? `${updatedCount} staff payment(s) marked as PAID on ${bulkSettleDate}`
          : 'Selected records were already marked as PAID'
      }`
    );
    setIsBulkSettleConfirmOpen(false);
  };

  // Submit New Staff Payment Record Form
  const handleCreateStaffPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffName.trim() || !formJobTitle.trim()) {
      toast.error('Please fill in Staff Name and Job Title');
      return;
    }

    const newRec: StaffPaymentRecord = {
      id: `stf-pay-${Date.now()}`,
      staffId: formStaffId || `STF-2026-${Math.floor(100 + Math.random() * 900)}`,
      staffName: formStaffName.trim(),
      roleCategory: formRoleCategory,
      jobTitle: formJobTitle.trim(),
      bankName: formBankName,
      accountNumber: formAccountNumber || '3049281745',
      baseSalary: Number(formBaseSalary),
      allowances: Number(formAllowances),
      deductions: Number(formDeductions),
      netPay: formNetPay,
      paymentStatus: formPaymentStatus,
      paymentDate: formPaymentStatus === 'PAID' ? formPaymentDate : 'Pending',
      paymentRef: formPaymentStatus === 'PAID' ? `TXN-BUR-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      paymentChannel: formPaymentChannel,
      monthSession: selectedMonth,
      notes: formNotes || 'New worker payroll entry recorded'
    };

    const updated = [newRec, ...staffRecords];
    saveRecords(updated);
    toast.success(`Worker payment record created for ${newRec.staffName} (${newRec.jobTitle})!`);
    setIsNewPaymentModalOpen(false);

    // Reset Form
    setFormStaffName('');
    setFormJobTitle('');
    setFormAccountNumber('');
    setFormNotes('');
  };

  // Filtered staff records with Department filter & sorting
  const filteredRecords = useMemo(() => {
    let result = staffRecords.filter((r) => {
      const matchesRole = roleFilter === 'ALL' || r.roleCategory === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || r.paymentStatus === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        r.staffName.toLowerCase().includes(q) ||
        r.staffId.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.bankName.toLowerCase().includes(q) ||
        r.accountNumber.includes(q);
      return matchesRole && matchesStatus && matchesQuery;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'dept_asc') {
        return (a.roleCategory || '').localeCompare(b.roleCategory || '');
      }
      if (sortBy === 'net_desc') {
        return b.netPay - a.netPay;
      }
      if (sortBy === 'net_asc') {
        return a.netPay - b.netPay;
      }
      if (sortBy === 'name_asc') {
        return a.staffName.localeCompare(b.staffName);
      }
      if (sortBy === 'status') {
        return a.paymentStatus.localeCompare(b.paymentStatus);
      }
      return 0;
    });
  }, [staffRecords, roleFilter, statusFilter, searchQuery, sortBy]);

  // Selected Staff Records for Bulk Operations
  const selectedStaffRecords = useMemo(() => {
    return staffRecords.filter((r) => selectedStaffIds.includes(r.id));
  }, [staffRecords, selectedStaffIds]);

  const selectedTotalNetPay = useMemo(() => {
    return selectedStaffRecords.reduce((acc, r) => acc + r.netPay, 0);
  }, [selectedStaffRecords]);

  // Aggregate KPI Calculations
  const metrics = useMemo(() => {
    const totalStaffCount = staffRecords.length;
    const teacherCount = staffRecords.filter((r) => r.roleCategory === 'TEACHER').length;
    const driverCount = staffRecords.filter((r) => r.roleCategory === 'DRIVER').length;
    const environmentalistCount = staffRecords.filter((r) => r.roleCategory === 'ENVIRONMENTALIST').length;
    const securityCount = staffRecords.filter((r) => r.roleCategory === 'SECURITY').length;
    const adminCount = staffRecords.filter((r) => r.roleCategory === 'ADMIN').length;

    const grossPayrollObligation = staffRecords.reduce((acc, r) => acc + r.netPay, 0);
    const totalDisbursed = staffRecords
      .filter((r) => r.paymentStatus === 'PAID')
      .reduce((acc, r) => acc + r.netPay, 0);
    const totalUnpaid = staffRecords
      .filter((r) => r.paymentStatus !== 'PAID')
      .reduce((acc, r) => acc + r.netPay, 0);

    const pendingPaymentsCount = staffRecords.filter((r) => r.paymentStatus === 'PENDING').length;
    const unpaidPaymentsCount = staffRecords.filter((r) => r.paymentStatus !== 'PAID').length;
    const paidPaymentsCount = staffRecords.filter((r) => r.paymentStatus === 'PAID').length;

    const paidPercentage = grossPayrollObligation > 0 ? Math.round((totalDisbursed / grossPayrollObligation) * 100) : 0;

    return {
      totalStaffCount,
      teacherCount,
      driverCount,
      environmentalistCount,
      securityCount,
      adminCount,
      grossPayrollObligation,
      totalDisbursed,
      totalUnpaid,
      pendingPaymentsCount,
      unpaidPaymentsCount,
      paidPaymentsCount,
      paidPercentage
    };
  }, [staffRecords]);

  // BALANCE SHEET CALCULATION ENGINE
  const balanceSheetData = useMemo(() => {
    // Institutional Revenue Assets
    const tuitionFeeInflow = 18450000; // Total collected student tuition
    const transportFacilityInflow = 3200000; // Bus & transport revenue
    const governmentGrantsInflow = 2500000; // Educational development grants
    const totalRevenueAssets = tuitionFeeInflow + transportFacilityInflow + governmentGrantsInflow;

    // Staff Category Expenses
    const teacherExpenses = staffRecords.filter((r) => r.roleCategory === 'TEACHER').reduce((a, b) => a + b.netPay, 0);
    const driverExpenses = staffRecords.filter((r) => r.roleCategory === 'DRIVER').reduce((a, b) => a + b.netPay, 0);
    const environmentalistExpenses = staffRecords.filter((r) => r.roleCategory === 'ENVIRONMENTALIST').reduce((a, b) => a + b.netPay, 0);
    const securityExpenses = staffRecords.filter((r) => r.roleCategory === 'SECURITY').reduce((a, b) => a + b.netPay, 0);
    const adminExpenses = staffRecords.filter((r) => r.roleCategory === 'ADMIN').reduce((a, b) => a + b.netPay, 0);
    const cateringExpenses = staffRecords.filter((r) => r.roleCategory === 'CATERING').reduce((a, b) => a + b.netPay, 0);

    const totalStaffPayrollExpense = teacherExpenses + driverExpenses + environmentalistExpenses + securityExpenses + adminExpenses + cateringExpenses;

    // Accrued Liabilities (Unpaid Staff Salary)
    const accruedStaffWagesPayable = metrics.totalUnpaid;
    const settledDisbursedExpense = metrics.totalDisbursed;

    // Operational Reserves & Surplus
    const netOperatingSurplus = totalRevenueAssets - totalStaffPayrollExpense;

    return {
      tuitionFeeInflow,
      transportFacilityInflow,
      governmentGrantsInflow,
      totalRevenueAssets,
      teacherExpenses,
      driverExpenses,
      environmentalistExpenses,
      securityExpenses,
      adminExpenses,
      cateringExpenses,
      totalStaffPayrollExpense,
      accruedStaffWagesPayable,
      settledDisbursedExpense,
      netOperatingSurplus
    };
  }, [staffRecords, metrics]);

  // MONTHLY SALARY & REVENUE TRENDS FOR THE CURRENT TERM
  const monthlyTrendData = useMemo(() => {
    const totalExp = balanceSheetData.totalStaffPayrollExpense;
    const settledExp = balanceSheetData.settledDisbursedExpense;
    const totalRev = balanceSheetData.totalRevenueAssets;

    return [
      {
        month: 'May 2026',
        income: Math.round(totalRev * 0.90),
        totalSalaryOutlay: Math.round(totalExp * 0.94),
        settledOutlay: Math.round(totalExp * 0.94),
        netSurplus: Math.round(totalRev * 0.90 - totalExp * 0.94)
      },
      {
        month: 'Jun 2026',
        income: Math.round(totalRev * 0.95),
        totalSalaryOutlay: Math.round(totalExp * 0.97),
        settledOutlay: Math.round(totalExp * 0.97),
        netSurplus: Math.round(totalRev * 0.95 - totalExp * 0.97)
      },
      {
        month: 'Jul 2026 (Current)',
        income: totalRev,
        totalSalaryOutlay: totalExp,
        settledOutlay: settledExp,
        netSurplus: balanceSheetData.netOperatingSurplus
      },
      {
        month: 'Aug 2026 (Est)',
        income: Math.round(totalRev * 1.02),
        totalSalaryOutlay: Math.round(totalExp * 1.01),
        settledOutlay: Math.round(totalExp * 1.01),
        netSurplus: Math.round(totalRev * 1.02 - totalExp * 1.01)
      },
      {
        month: 'Sep 2026 (Est)',
        income: Math.round(totalRev * 1.05),
        totalSalaryOutlay: Math.round(totalExp * 1.03),
        settledOutlay: Math.round(totalExp * 1.03),
        netSurplus: Math.round(totalRev * 1.05 - totalExp * 1.03)
      }
    ];
  }, [balanceSheetData]);

  // EXPENDITURE BREAKDOWN BY CATEGORY FOR PIE CHART VISUALIZATION
  const expenditureCategoryData = useMemo(() => {
    const totalPayroll = balanceSheetData.totalStaffPayrollExpense;
    const utilities = 3850000; // Diesel, IPP Power Grid, Water & Fiber Optic
    const maintenance = 2450000; // Building repairs, IT & Lab maintenance
    const adminOps = 1980000; // Printing, Stationery, Licenses & Audit
    const academicLearning = 2750000; // Textbooks, STEM supplies & Examinations
    const transportFleet = 2100000; // Bus fueling & fleet servicing
    const securitySafety = 1650000; // Security patrol & medical clinic supplies

    const items = [
      { category: 'Staff Salaries & Remuneration', amount: totalPayroll, color: '#4f46e5', desc: 'Faculty & Administrative Staff Payroll' },
      { category: 'Utilities & Power Infrastructure', amount: utilities, color: '#10b981', desc: 'Diesel, IPP Power Grid, Water & Fiber Optic' },
      { category: 'Academic & ICT Resources', amount: academicLearning, color: '#06b6d4', desc: 'Textbooks, STEM Lab Chemicals & Exam Software' },
      { category: 'Maintenance & Facilities', amount: maintenance, color: '#f59e0b', desc: 'Roofing, Electrical, Plumbing & Painting Works' },
      { category: 'Transport & Bus Logistics', amount: transportFleet, color: '#8b5cf6', desc: 'Fueling, Bus Servicing & Driver Allowances' },
      { category: 'Admin & Operational Supplies', amount: adminOps, color: '#ec4899', desc: 'Stationery, Printing, Software & Audit Fees' },
      { category: 'Security & Campus Health', amount: securitySafety, color: '#3b82f6', desc: 'CCTV Monitoring, Guard Service & Clinic Stocks' },
    ];

    const totalOutlay = items.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      items: items.map(item => ({
        ...item,
        percentage: Number(((item.amount / totalOutlay) * 100).toFixed(1))
      })),
      totalOutlay
    };
  }, [balanceSheetData]);

  // Export Staff Payment Ledger to CSV
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push('CORNER STREAMS EDUCATIONAL INFRASTRUCTURE - STAFFS PAYMENT & WORKERS PAYROLL LEDGER');
    csvRows.push(`Month/Session: ${selectedMonth} | Export Date: ${new Date().toLocaleDateString('en-GB')}`);
    csvRows.push('');
    csvRows.push('Staff ID,Staff Name,Role Category,Job Title,Bank Name,Account Number,Base Salary (NGN),Allowances (NGN),Deductions (NGN),Net Pay (NGN),Payment Status,Date of Payment,Payment Reference,Payment Channel');

    filteredRecords.forEach((r) => {
      csvRows.push(
        `"${r.staffId}","${r.staffName}","${r.roleCategory}","${r.jobTitle}","${r.bankName}","${r.accountNumber}",${r.baseSalary},${r.allowances},${r.deductions},${r.netPay},"${r.paymentStatus}","${r.paymentDate}","${r.paymentRef || 'N/A'}","${r.paymentChannel || 'N/A'}"`
      );
    });

    csvRows.push('');
    csvRows.push('--- PAYROLL BALANCE SHEET SUMMARY ---');
    csvRows.push(`Total Institutional Cash Assets (NGN),${balanceSheetData.totalRevenueAssets}`);
    csvRows.push(`Total Staff Payroll Expense (NGN),${balanceSheetData.totalStaffPayrollExpense}`);
    csvRows.push(`Settled Disbursed Salaries (NGN),${balanceSheetData.settledDisbursedExpense}`);
    csvRows.push(`Accrued Unpaid Wages Liability (NGN),${balanceSheetData.accruedStaffWagesPayable}`);
    csvRows.push(`Net Operating Surplus (NGN),${balanceSheetData.netOperatingSurplus}`);

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Staffs_Payment_Ledger_Balance_Sheet_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📄 Staff Payment Ledger & Balance Sheet successfully exported to CSV!');
  };

  // Helper function for role badge color and icon
  const renderRoleBadge = (category: StaffRoleCategory) => {
    switch (category) {
      case 'TEACHER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Users className="w-3 h-3 text-indigo-600" />
            <span>Teacher</span>
          </span>
        );
      case 'DRIVER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Bus className="w-3 h-3 text-amber-700" />
            <span>Driver</span>
          </span>
        );
      case 'ENVIRONMENTALIST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Trees className="w-3 h-3 text-emerald-700" />
            <span>Environmentalist</span>
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 text-slate-700" />
            <span>Security</span>
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <Briefcase className="w-3 h-3 text-purple-700" />
            <span>Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <UserCheck className="w-3 h-3 text-slate-600" />
            <span>Staff</span>
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: 'PAID' | 'PENDING' | 'PROCESSING' | 'OVERDUE') => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAID</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>PENDING</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>PROCESSING</span>
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>OVERDUE</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 p-3 sm:p-5 space-y-4 overflow-y-auto">
      
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] uppercase font-mono tracking-wider border border-indigo-200 dark:border-indigo-800">
              Bursary & Payroll Desk
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Month: <strong className="text-slate-900 dark:text-white font-bold">{selectedMonth}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>STAFFS PAYMENT & WORKERS PAYROLL STREAM</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Track workers payment, salary disburse dates, bank references, and institutional payroll balance sheet
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staffs Payment Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balance_sheet')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'balance_sheet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Payroll Balance Sheet</span>
          </button>
        </div>
      </div>

      {/* METRICS & OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Salary Outlay (Current Month) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono text-indigo-700 dark:text-indigo-400">Total Salary Outlay</span>
            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ₦{metrics.grossPayrollObligation.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1 font-medium flex items-center justify-between">
            <span>Month: <strong className="text-slate-800 dark:text-slate-200">{selectedMonth}</strong></span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold border border-indigo-200 dark:border-indigo-800">{metrics.totalStaffCount} Staffs</span>
          </div>
        </div>

        {/* Card 2: Pending Payments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono text-amber-700 dark:text-amber-400">Pending Payments</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-baseline gap-2">
            <span>{metrics.pendingPaymentsCount} Pending</span>
            {metrics.unpaidPaymentsCount > metrics.pendingPaymentsCount && (
              <span className="text-xs font-normal text-slate-400">({metrics.unpaidPaymentsCount} total unpaid)</span>
            )}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono mt-1 font-bold">
            ₦{metrics.totalUnpaid.toLocaleString()} Outstanding Outlay
          </div>
        </div>

        {/* Card 3: Settled Disbursements */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono text-emerald-700 dark:text-emerald-400">Settled Disbursements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{metrics.totalDisbursed.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono mt-1 font-bold">
            {metrics.paidPaymentsCount} Paid ({metrics.paidPercentage}% Disbursed)
          </div>
        </div>

        {/* Card 4: Balance Sheet Surplus */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono text-purple-700 dark:text-purple-400 font-bold">Balance Sheet Position</span>
            <Landmark className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            ₦{balanceSheetData.netOperatingSurplus.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Inflows - Staff Salary Outlay
          </div>
        </div>
      </div>

      {/* VIEW 1: STAFFS PAYMENT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          
          {/* Controls Bar: Search, Custom Department Dropdown, Sort Dropdown & Action Buttons */}
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            
            {/* Search Input & Custom Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
              
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-none w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by staff name or staff ID..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Department Filter Dropdown (State-tracked) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeptDropdownOpen(!isDeptDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate max-w-[150px]">
                    Dept: {
                      departmentOptions.find(d => d.k === roleFilter)?.label.replace(' Dept', '').replace(' Services', '') || 'All'
                    }
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDeptDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 font-sans text-xs overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Filter by Department</span>
                      <Building2 className="w-3 h-3 text-indigo-500" />
                    </div>
                    {departmentOptions.map((dept) => {
                      const IconComp = dept.icon;
                      const isSelected = roleFilter === dept.k;
                      return (
                        <button
                          key={dept.k}
                          type="button"
                          onClick={() => {
                            setRoleFilter(dept.k);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span>{dept.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Sort Dropdown (State-tracked) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsDeptDropdownOpen(false);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate max-w-[140px]">
                    Sort: {
                      sortOptions.find(s => s.k === sortBy)?.label.split(' ')[0] || 'Dept'
                    }
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 font-sans text-xs overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Sort Payments By</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                    </div>
                    {sortOptions.map((opt) => {
                      const isSelected = sortBy === opt.k;
                      return (
                        <button
                          key={opt.k}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.k as any);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export currently filtered staff payment data & payroll summary to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-100" />
                <span>Export to CSV ({filteredRecords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Open Printable Balance Sheet & Payroll Report"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Printable Report</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Worker Payment</span>
              </button>
            </div>
          </div>

          {/* Secondary Status Filter Pills & Bulk Action Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Status Filter:</span>
              {['ALL', 'PAID', 'PENDING', 'PROCESSING', 'OVERDUE'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-slate-400 text-[10px] sm:ml-auto flex items-center gap-3">
              <span>Showing <strong>{filteredRecords.length}</strong> of {staffRecords.length} workers</span>
              {selectedStaffIds.length > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  {selectedStaffIds.length} Selected
                </span>
              )}
            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          {selectedStaffIds.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-700/60 flex flex-col md:flex-row justify-between items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 text-xs font-mono w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-black text-sm uppercase tracking-wide">
                    {selectedStaffIds.length} Staff Selected
                  </span>
                </div>
                <span className="text-slate-300 font-sans text-xs">
                  Total Net Outlay: <strong className="text-emerald-400 font-mono text-sm">₦{selectedTotalNetPay.toLocaleString()}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsBulkSettleConfirmOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Bulk Mark as Paid ({selectedStaffIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkPayslipModalOpen(true)}
                  className="px-3.5 py-1.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4 text-indigo-700" />
                  <span>Generate Payslips ({selectedStaffIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStaffIds([])}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* STAFF PAYMENT TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-mono">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 &&
                        filteredRecords.every((r) => selectedStaffIds.includes(r.id))
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-indigo-600"
                      title="Select or deselect all visible staff records"
                    />
                  </th>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Role / Designation</th>
                  <th className="p-3 text-right">Base Salary</th>
                  <th className="p-3 text-right">Allowances</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right font-black text-slate-900 dark:text-white">Net Payable</th>
                  <th className="p-3 text-center">Payment Status</th>
                  <th className="p-3">Date of Payment</th>
                  <th className="p-3">Bank Details & Ref</th>
                  <th className="p-3 text-center font-bold">Docs & Receipts</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.map((staff) => {
                  const isRowSelected = selectedStaffIds.includes(staff.id);
                  const attachmentCount = staff.attachments?.length || 0;
                  return (
                    <tr
                      key={staff.id}
                      className={`transition ${
                        isRowSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-2 border-l-indigo-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelectRow(staff.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-indigo-600"
                        />
                      </td>

                      {/* Staff Name & ID */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{staff.staffName}</div>
                        <div className="text-[10.5px] text-slate-500 font-mono">{staff.staffId}</div>
                      </td>

                    {/* Role & Designation */}
                    <td className="p-3">
                      <div className="mb-1">{renderRoleBadge(staff.roleCategory)}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{staff.jobTitle}</div>
                    </td>

                    {/* Salary Figures */}
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ₦{staff.baseSalary.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      +₦{staff.allowances.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      -₦{staff.deductions.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                      ₦{staff.netPay.toLocaleString()}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="p-3 text-center">
                      {renderStatusBadge(staff.paymentStatus)}
                    </td>

                    {/* Date of Payment */}
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{staff.paymentDate}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{staff.monthSession}</div>
                    </td>

                    {/* Bank Details & Txn Ref */}
                    <td className="p-3 font-mono text-[11px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{staff.bankName}</div>
                      <div className="text-slate-500">Acc: {staff.accountNumber}</div>
                      {staff.paymentRef && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          Ref: {staff.paymentRef}
                        </div>
                      )}
                    </td>

                    {/* Docs & Receipts Column */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenAttachmentPanel(staff)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:text-slate-300 dark:hover:text-indigo-300 rounded-lg text-[11px] font-bold transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer mx-auto group shadow-2xs"
                        title="Open Attachment Preview Side Panel to view uploaded receipts, invoices, or vouchers"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span>{attachmentCount > 0 ? `${attachmentCount} Doc${attachmentCount === 1 ? '' : 's'}` : 'Preview Docs'}</span>
                        {attachmentCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAttachmentPanel(staff)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                          title="Attachment Preview Side Panel (Receipts, Invoices, Vouchers)"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                        {staff.paymentStatus !== 'PAID' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(staff)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Settle payment and assign Date of Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewPayslipStaff(staff)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                            title="Generate PDF payslip preview and adjust output layout"
                          >
                            <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Generate Payslip</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PAYROLL BALANCE SHEET & FINANCIAL RECONCILIATION */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-6">
          
          {/* VISUAL CHART: SALARY & REVENUE TRENDS VS EXPENDITURE PIE BREAKDOWN */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  {chartViewMode === 'trend' ? <TrendingUp className="w-5 h-5" /> : <PieChartIcon className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono tracking-wider block">
                    FINANCIAL VISUALIZATION & ANALYTICS
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {chartViewMode === 'trend' ? 'MONTHLY STAFF SALARY & REVENUE TRENDS (CURRENT TERM)' : 'TOTAL INSTITUTIONAL EXPENDITURE BY CATEGORY'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {chartViewMode === 'trend'
                      ? 'Comparative timeline tracking total school income vs. staff salary outlays and net surplus balance'
                      : 'Proportional breakdown of operational disbursements, payroll outlays, and facility expenditures'}
                  </p>
                </div>
              </div>

              {/* CHART VIEW TOGGLER BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('trend')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      chartViewMode === 'trend'
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Salary Trend Line</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('expenditure_pie')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      chartViewMode === 'expenditure_pie'
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span>Expenditure Category Pie</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold">
                    Term 3 • May - Sep 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-emerald-50/60 dark:bg-slate-800/60 rounded-xl border border-emerald-100 dark:border-slate-700">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">Total School Income</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                  ₦{balanceSheetData.totalRevenueAssets.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-slate-800/60 rounded-xl border border-indigo-100 dark:border-slate-700">
                <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold uppercase block">Total Payroll Expense</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                  ₦{balanceSheetData.totalStaffPayrollExpense.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-slate-700">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase block">Total Operational Outlay</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  ₦{expenditureCategoryData.totalOutlay.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-cyan-50/60 dark:bg-slate-800/60 rounded-xl border border-cyan-100 dark:border-slate-700">
                <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-bold uppercase block">Term Net Operating Surplus</span>
                <span className="text-sm font-black text-cyan-700 dark:text-cyan-400 mt-0.5 block">
                  ₦{balanceSheetData.netOperatingSurplus.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CONDITIONAL RECHARTS DISPLAY: TREND LINE CHART vs EXPENDITURE PIE CHART */}
            {chartViewMode === 'trend' ? (
              <div className="w-full h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 700 }} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Total School Income (₦)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#10b981' }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSalaryOutlay"
                      name="Total Staff Salary Outlay (₦)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#6366f1' }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="settledOutlay"
                      name="Settled Disbursed Salary (₦)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="netSurplus"
                      name="Net Operating Surplus (₦)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                <div className="md:col-span-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenditureCategoryData.items}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {expenditureCategoryData.items.map((entry, index) => (
                          <Cell key={`exp-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Disbursement Outlay']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="md:col-span-7 space-y-2 font-mono">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-sans border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
                    <span>Expenditure Category Breakdown</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      Total Outlay: ₦{expenditureCategoryData.totalOutlay.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 font-sans">
                    {expenditureCategoryData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs space-x-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{item.category}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">{item.desc}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white block text-[11px]">₦{item.amount.toLocaleString()}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 inline-block">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BALANCE SHEET STATEMENT CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            
            {/* Balance Sheet Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider font-mono">
                  CORNER STREAMS EDUCATIONAL INFRASTRUCTURE
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  INSTITUTIONAL PAYROLL BALANCE SHEET & FINANCIAL RECONCILIATION
                </h2>
                <p className="text-xs text-slate-500">
                  Dual-entry ledger matching campus fee inflows against staff payroll liabilities and net operating position
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-500">
                <div className="font-bold text-slate-900 dark:text-white">AUDITED PAYROLL POSITION</div>
                <div>Session: {selectedMonth}</div>
              </div>
            </div>

            {/* DUAL COLUMN BALANCE SHEET TABLE: ASSETS VS LIABILITIES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              
              {/* LEFT COLUMN: ASSETS & REVENUE INFLOWS */}
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                  <span className="font-black text-sm uppercase">1. REVENUE ASSETS & CASH INFLOWS</span>
                  <Landmark className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="p-3 flex justify-between items-center">
                    <span>Student Tuition & Fee Receipts</span>
                    <span className="font-bold text-slate-900 dark:text-white">₦{balanceSheetData.tuitionFeeInflow.toLocaleString()}</span>
                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <span>Transport & Bus Fleet Subsidies</span>
                    <span className="font-bold text-slate-900 dark:text-white">₦{balanceSheetData.transportFacilityInflow.toLocaleString()}</span>
                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <span>Board & Educational Development Grants</span>
                    <span className="font-bold text-slate-900 dark:text-white">₦{balanceSheetData.governmentGrantsInflow.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 bg-emerald-600 text-white font-black flex justify-between items-center text-sm">
                    <span>TOTAL INSTITUTIONAL ASSETS</span>
                    <span>₦{balanceSheetData.totalRevenueAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: LIABILITIES & STAFF PAYROLL EXPENSES */}
              <div className="space-y-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex justify-between items-center text-indigo-800 dark:text-indigo-300">
                  <span className="font-black text-sm uppercase">2. PAYROLL EXPENSES & WAGE LIABILITIES</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="p-3 flex justify-between items-center">
                    <span>Settled Staff Salary Disbursements</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₦{balanceSheetData.settledDisbursedExpense.toLocaleString()}</span>
                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <span>Accrued Unpaid Staff Wages Payable</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">₦{balanceSheetData.accruedStaffWagesPayable.toLocaleString()}</span>
                  </div>

                  <div className="p-3 flex justify-between items-center text-slate-500">
                    <span>Pension & Statutory Deductions Ledger</span>
                    <span>Reconciled</span>
                  </div>

                  <div className="p-3.5 bg-indigo-600 text-white font-black flex justify-between items-center text-sm">
                    <span>TOTAL PAYROLL OBLIGATIONS</span>
                    <span>₦{balanceSheetData.totalStaffPayrollExpense.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* NET OPERATING SURPLUS & GUARANTEE STRIP */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">NET OPERATING BALANCE POSITION</span>
                <span className="text-2xl font-black text-white">₦{balanceSheetData.netOperatingSurplus.toLocaleString()}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Retained operating surplus following complete staff payroll disburse</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance Sheet Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>EQUILIBRIUM VERIFIED</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Balance Sheet</span>
                </button>
              </div>
            </div>

            {/* DEPARTMENTAL EXPENDITURE DISTRIBUTION BREAKDOWN */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
                3. DEPARTMENTAL STAFF PAYROLL DISTRIBUTION
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700">
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block uppercase">Teachers (Academic)</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.teacherExpenses.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block uppercase">Bus Drivers</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.driverExpenses.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block uppercase">Environmentalists</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.environmentalistExpenses.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block uppercase">Campus Security</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.securityExpenses.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-slate-700">
                  <span className="text-[10px] text-purple-800 dark:text-purple-300 font-bold block uppercase">Administration</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.adminExpenses.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-rose-50 dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700">
                  <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold block uppercase">Catering & Kitchen</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block mt-1">₦{balanceSheetData.cateringExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 MODAL 1: SETTLE / MARK WORKER PAYMENT AS PAID                          */}
      {/* ========================================================================= */}
      {isSettleModalOpen && selectedStaffForSettle && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs p-4 flex justify-center items-center animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black uppercase text-sm tracking-wide">Settle Staff Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlePayment} className="p-5 space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedStaffForSettle.staffName}</div>
                <div className="text-slate-500 font-mono">{selectedStaffForSettle.jobTitle} • {selectedStaffForSettle.staffId}</div>
                <div className="pt-2 flex justify-between items-center font-mono text-sm border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Net Payable:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">₦{selectedStaffForSettle.netPay.toLocaleString()}</span>
                </div>
              </div>

              {/* Date of Payment Selector */}
              <div className="space-y-1 font-mono">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                  Date of Payment *
                </label>
                <input
                  type="date"
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Payment Channel */}
              <div className="space-y-1 font-mono">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                  Disbursement Channel
                </label>
                <select
                  value={settleChannel}
                  onChange={(e) => setSettleChannel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="CBN Direct Transfer">CBN Direct Transfer (Central Bank Portal)</option>
                  <option value="Bank Transfer">Commercial Interbank Transfer</option>
                  <option value="Cash Voucher">Cash Disbursement Voucher</option>
                </select>
              </div>

              {/* Txn Reference */}
              <div className="space-y-1 font-mono">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                  Transaction Reference Code
                </label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Mark Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ MODAL 2: RECORD NEW STAFF PAYMENT / WORKER ENTRY                        */}
      {/* ========================================================================= */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs p-4 flex justify-center items-center overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-sans my-8">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black uppercase text-sm tracking-wide">Record Worker Payment Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffPayment} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-[10.5px] uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Worker Full Name *
                  </label>
                  <input
                    type="text"
                    value={formStaffName}
                    onChange={(e) => setFormStaffName(e.target.value)}
                    placeholder="e.g. Mr. Emmanuel Adeyemi"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-[10.5px] uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Staff ID Code
                  </label>
                  <input
                    type="text"
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-[10.5px] uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Role Category *
                  </label>
                  <select
                    value={formRoleCategory}
                    onChange={(e) => setFormRoleCategory(e.target.value as StaffRoleCategory)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="TEACHER">TEACHER (Academic Staff)</option>
                    <option value="DRIVER">DRIVER (Transport Fleet)</option>
                    <option value="ENVIRONMENTALIST">ENVIRONMENTALIST (Sanitation & Grounds)</option>
                    <option value="SECURITY">SECURITY (Campus Guard)</option>
                    <option value="ADMIN">ADMIN (Bursary & IT)</option>
                    <option value="CATERING">CATERING (Kitchen)</option>
                    <option value="OTHER">OTHER STAFF</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono font-bold text-[10.5px] uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Job Title / Designation *
                  </label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="e.g. Senior Driver / Biology Teacher"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Salary Components */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 font-mono">
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                  Salary & Net Calculation
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Base Pay (₦)</label>
                    <input
                      type="number"
                      value={formBaseSalary}
                      onChange={(e) => setFormBaseSalary(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-emerald-600 block">Allowances (₦)</label>
                    <input
                      type="number"
                      value={formAllowances}
                      onChange={(e) => setFormAllowances(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-rose-600 block">Deductions (₦)</label>
                    <input
                      type="number"
                      value={formDeductions}
                      onChange={(e) => setFormDeductions(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-rose-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black">
                  <span>Net Payable Amount:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₦{formNetPay.toLocaleString()}</span>
                </div>
              </div>

              {/* Date & Payment Status */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="PAID">PAID (Disbursed)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Date of Payment
                  </label>
                  <input
                    type="date"
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 MODAL: BULK MARK AS PAID CONFIRMATION                                  */}
      {/* ========================================================================= */}
      {isBulkSettleConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs p-4 flex justify-center items-center animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">BULK PAYMENT SETTLEMENT</h3>
                  <p className="text-xs text-slate-500">Batch process selected staff salaries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkSettleConfirmOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Selected Workers:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{selectedStaffRecords.length} Staff Members</strong>
              </div>
              <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                <span>Pending Settlement:</span>
                <strong>{selectedStaffRecords.filter(r => r.paymentStatus !== 'PAID').length} Unpaid Workers</strong>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Net Disbursement:</span>
                <span>₦{selectedTotalNetPay.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 font-mono">
                  Batch Date of Payment
                </label>
                <input
                  type="date"
                  value={bulkSettleDate}
                  onChange={(e) => setBulkSettleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 font-mono">
                  Settlement Channel
                </label>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono font-bold flex items-center justify-between">
                  <span>CBN Direct Bulk Settlement</span>
                  <Landmark className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkSettleConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkMarkAsPaid}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Mark {selectedStaffRecords.length} Paid</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 MODAL: BATCH GENERATE PAYSLIPS FOR SELECTED STAFF                      */}
      {/* ========================================================================= */}
      {isBulkPayslipModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-4 sm:p-6 flex justify-center items-start print:p-0 print:bg-white print:static print:block">
          
          {/* Top Controls Bar */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-slate-900 text-white p-2.5 rounded-2xl shadow-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Batch ({selectedStaffRecords.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkPayslipModalOpen(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden font-sans p-6 sm:p-8 space-y-6 my-8 print:my-0 print:border-none print:shadow-none print:p-0">
            
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider">
                  CORNER STREAMS EDUCATIONAL INFRASTRUCTURE
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  BATCH OFFICIAL STAFF PAYSLIP LEDGER ({selectedMonth})
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Generated {selectedStaffRecords.length} itemized payment vouchers for administrative audit & staff records
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold text-slate-900">TOTAL BATCH DISBURSEMENT</div>
                <div className="text-lg font-black text-indigo-700">₦{selectedTotalNetPay.toLocaleString()}</div>
              </div>
            </div>

            {/* Grid of Payslips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              {selectedStaffRecords.map((staff) => (
                <div key={staff.id} className="border border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-3 print:bg-white print:break-inside-avoid">
                  
                  <div className="flex justify-between items-start border-b border-slate-300 pb-2">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">{staff.staffName}</span>
                      <span className="text-[11px] text-slate-600 font-medium">{staff.jobTitle}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block font-bold">{staff.staffId}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                        {staff.roleCategory}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Salary:</span>
                      <span>₦{staff.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Allowances:</span>
                      <span>+₦{staff.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-medium">
                      <span>Deductions:</span>
                      <span>-₦{staff.deductions.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-slate-900 text-white font-black text-xs flex justify-between rounded-lg mt-1">
                      <span>NET PAYABLE:</span>
                      <span>₦{staff.netPay.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-[10.5px] font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Bank: {staff.bankName}</span>
                      <span className="text-slate-500 block">Acc: {staff.accountNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold block ${staff.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {staff.paymentStatus}
                      </span>
                      <span className="text-slate-400 text-[10px]">{staff.paymentDate}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-xs font-mono text-slate-500 print:hidden">
              <span>Showing {selectedStaffRecords.length} staff payslip vouchers</span>
              <button
                type="button"
                onClick={() => setIsBulkPayslipModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Batch Payslips
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 ENHANCED MODAL: INTERACTIVE PDF PAYSLIP PREVIEW & LAYOUT CUSTOMIZER   */}
      {/* ========================================================================= */}
      {viewPayslipStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start print:p-0 print:bg-white print:static print:block animate-in fade-in duration-200">
          
          <div className="w-full max-w-5xl space-y-4 my-4 print:my-0">
            {/* TOP CONTROLS & HEADER BAR (Hidden when printing) */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-xl text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white font-sans">
                      PDF Payslip Preview & Layout Designer
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                      LIVE PREVIEW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Adjust output template, color theme, visible sections, and custom notes before printing or downloading PDF
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsLayoutSettingsOpen(!isLayoutSettingsOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isLayoutSettingsOpen
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{isLayoutSettingsOpen ? 'Hide Layout Controls' : 'Adjust Layout'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportSinglePayslipCSV(viewPayslipStaff)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Export raw payslip itemized figures to CSV"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewPayslipStaff(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MAIN MODAL GRID CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* SIDEBAR: LAYOUT ADJUSTMENT CONTROLS (Hidden when printing or when toggled closed) */}
              {isLayoutSettingsOpen && (
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 print:hidden text-xs font-sans">
                  
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-black uppercase tracking-wider text-slate-900 dark:text-white text-xs">
                        Output Layout Adjuster
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPayslipLayout}
                      className="text-[10.5px] font-mono text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      title="Reset to default layout"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* 1. LAYOUT PRESET SELECTOR */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                      1. Document Template Format
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayslipLayoutFormat('A4_STANDARD')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          payslipLayoutFormat === 'A4_STANDARD'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Standard A4
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayslipLayoutFormat('COMPACT_SLIP')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          payslipLayoutFormat === 'COMPACT_SLIP'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Thermal Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayslipLayoutFormat('EXECUTIVE_DETAILED')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          payslipLayoutFormat === 'EXECUTIVE_DETAILED'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Executive
                      </button>
                    </div>
                  </div>

                  {/* 2. COLOR ACCENT PRESET */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                      2. Accent Header Palette
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayslipThemeColor('INDIGO')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          payslipThemeColor === 'INDIGO'
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-800 to-indigo-600" />
                        <span>Indigo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayslipThemeColor('EMERALD')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          payslipThemeColor === 'EMERALD'
                            ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600" />
                        <span>Emerald</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayslipThemeColor('SLATE')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          payslipThemeColor === 'SLATE'
                            ? 'border-slate-700 ring-2 ring-slate-500/30 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-800" />
                        <span>Slate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayslipThemeColor('MONOCHROME')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          payslipThemeColor === 'MONOCHROME'
                            ? 'border-black ring-2 ring-black/30 bg-slate-200 dark:bg-slate-700 text-black dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-black border border-white" />
                        <span>Mono</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. SECTION VISIBILITY TOGGLES */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                      3. Output Sections Visibility
                    </label>
                    
                    <div className="space-y-1.5 font-sans">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">School Logo & Watermark</span>
                        <input
                          type="checkbox"
                          checked={payslipShowLogo}
                          onChange={(e) => setPayslipShowLogo(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Bank Details & Ref</span>
                        <input
                          type="checkbox"
                          checked={payslipShowBankDetails}
                          onChange={(e) => setPayslipShowBankDetails(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Tax & Deduction Breakdown</span>
                        <input
                          type="checkbox"
                          checked={payslipShowTaxBreakdown}
                          onChange={(e) => setPayslipShowTaxBreakdown(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Bursar Signature Block</span>
                        <input
                          type="checkbox"
                          checked={payslipShowSignatures}
                          onChange={(e) => setPayslipShowSignatures(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">QR Audit Verification Hash</span>
                        <input
                          type="checkbox"
                          checked={payslipShowQrCode}
                          onChange={(e) => setPayslipShowQrCode(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 4. CUSTOM REMARKS / MEMO */}
                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                      4. Custom Payment Remarks / Memo
                    </label>
                    <textarea
                      rows={2}
                      value={payslipCustomMemo}
                      onChange={(e) => setPayslipCustomMemo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-sans focus:ring-2 focus:ring-indigo-500/50 resize-none"
                      placeholder="Add custom notes to output payslip..."
                    />
                  </div>

                  {/* 5. FONT SCALE / SPACING DENSITY */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                      5. Print Font Scale
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayslipFontScale('COMPACT')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          payslipFontScale === 'COMPACT'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Compact (85%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayslipFontScale('STANDARD')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          payslipFontScale === 'STANDARD'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Normal (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayslipFontScale('SPACIOUS')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          payslipFontScale === 'SPACIOUS'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Large (115%)
                      </button>
                    </div>
                  </div>

                  {/* SHAREABLE LINK BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleCopyPayslipLink(viewPayslipStaff)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Copy Verification Share Link</span>
                  </button>

                </div>
              )}

              {/* LIVE PRINTABLE PDF PAYSLIP PAPER PREVIEW SHEET */}
              <div className={`bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden font-sans space-y-6 print:shadow-none print:border-none print:m-0 print:p-0 transition-all ${
                isLayoutSettingsOpen ? 'lg:col-span-8' : 'lg:col-span-12'
              } ${
                payslipFontScale === 'COMPACT' ? 'p-4 sm:p-5 text-[11px]' : payslipFontScale === 'SPACIOUS' ? 'p-8 sm:p-10 text-sm' : 'p-6 sm:p-8 text-xs'
              }`}>
                
                {/* HEADER BANNER WITH DYNAMIC ACCENT COLOR */}
                <div className={`p-4 sm:p-6 rounded-xl text-white flex justify-between items-start gap-4 ${
                  payslipThemeColor === 'EMERALD'
                    ? 'bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950'
                    : payslipThemeColor === 'SLATE'
                    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'
                    : payslipThemeColor === 'MONOCHROME'
                    ? 'bg-black text-white'
                    : 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {payslipShowLogo && (
                        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center font-black font-mono text-emerald-400 text-xs shrink-0">
                          CS
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 block">
                          CORNER STREAMS EDUCATIONAL INFRASTRUCTURE
                        </span>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                          {payslipLayoutFormat === 'COMPACT_SLIP' ? 'PAYROLL DISBURSEMENT SLIP' : 'OFFICIAL STAFF PAYSLIP & SALARY VOUCHER'}
                        </h2>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono">
                      Institutional Bursary & Remuneration Directorate • Month: <strong className="text-white">{viewPayslipStaff.monthSession}</strong>
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-200 shrink-0">
                    <div className="font-bold">Doc Ref: <span className="text-emerald-400 font-mono">PAY-{viewPayslipStaff.staffId}</span></div>
                    <div>Issued: {new Date().toLocaleDateString()}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-bold rounded">
                      CBN SETTLED
                    </span>
                  </div>
                </div>

                {/* STAFF & SALARY METADATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Staff Candidate</span>
                    <span className="font-black text-slate-900 block">{viewPayslipStaff.staffName}</span>
                    <span className="text-slate-500 font-sans text-[11px]">{viewPayslipStaff.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Staff ID & Role</span>
                    <span className="font-bold text-slate-900">{viewPayslipStaff.staffId}</span>
                    <span className="text-slate-500 block text-[11px]">{viewPayslipStaff.roleCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Pay Cycle Month</span>
                    <span className="font-bold text-indigo-900">{viewPayslipStaff.monthSession}</span>
                    <span className="text-slate-500 block text-[11px]">Term 3 Session</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Disbursement Status</span>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      {viewPayslipStaff.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* ITEMIZED SALARY BREAKDOWN TABLE */}
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 font-sans">
                      Itemized Remuneration & Deductions Schedule
                    </span>
                    <span className="text-[10px] text-slate-500">Amounts in Nigerian Naira (NGN)</span>
                  </div>

                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="p-2.5 border border-slate-200">Earning / Deduction Item</th>
                        <th className="p-2.5 border border-slate-200">Classification</th>
                        <th className="p-2.5 border border-slate-200 text-right">Amount (NGN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 border border-slate-200 font-sans font-bold text-slate-900">Base Contractual Salary</td>
                        <td className="p-2.5 border border-slate-200 text-slate-500">Gross Fixed Pay</td>
                        <td className="p-2.5 border border-slate-200 text-right font-bold">₦{viewPayslipStaff.baseSalary.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 border border-slate-200 font-sans font-bold text-emerald-700">Special Duty & Extra Lesson Allowances</td>
                        <td className="p-2.5 border border-slate-200 text-emerald-600">Performance Stipend</td>
                        <td className="p-2.5 border border-slate-200 text-right font-bold text-emerald-700">+₦{viewPayslipStaff.allowances.toLocaleString()}</td>
                      </tr>
                      {payslipShowTaxBreakdown && (
                        <tr>
                          <td className="p-2.5 border border-slate-200 font-sans font-bold text-rose-700">Statutory PAYE Tax & Pension Deductions</td>
                          <td className="p-2.5 border border-slate-200 text-rose-600">Withholdings</td>
                          <td className="p-2.5 border border-slate-200 text-right font-bold text-rose-700">-₦{viewPayslipStaff.deductions.toLocaleString()}</td>
                        </tr>
                      )}
                      {payslipLayoutFormat === 'EXECUTIVE_DETAILED' && (
                        <>
                          <tr className="bg-slate-50/60">
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600 font-sans pl-6">• Employer Pension Match (8%)</td>
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-500">Institutional Contribution</td>
                            <td className="p-2 border border-slate-200 text-right text-[11px] text-slate-600">₦{(viewPayslipStaff.baseSalary * 0.08).toLocaleString()}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600 font-sans pl-6">• Health Insurance NHIS Subsidized</td>
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-500">Institutional Benefit</td>
                            <td className="p-2 border border-slate-200 text-right text-[11px] text-emerald-600">Covered 100%</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-sm">
                        <td colSpan={2} className="p-3 uppercase font-sans">NET DISBURSED SALARY PAYABLE</td>
                        <td className="p-3 text-right text-emerald-400 font-mono text-base">₦{viewPayslipStaff.netPay.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* BANK DETAILS & SETTLEMENT VERIFICATION */}
                {payslipShowBankDetails && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono space-y-1.5">
                    <div className="flex justify-between items-center text-emerald-950 font-bold font-sans">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Central Bank Payroll Settlement Channel
                      </span>
                      <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-mono uppercase">
                        CONFIRMED
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-emerald-900 text-[11px]">
                      <div>Bank: <strong className="text-slate-900">{viewPayslipStaff.bankName}</strong></div>
                      <div>Account Number: <strong className="text-slate-900">{viewPayslipStaff.accountNumber}</strong></div>
                      <div>Settlement Date: <strong className="text-slate-900">{viewPayslipStaff.paymentDate}</strong></div>
                    </div>
                    {viewPayslipStaff.paymentRef && (
                      <div className="text-[10.5px] text-emerald-800 border-t border-emerald-200/80 pt-1">
                        Transaction Reference: <span className="font-bold text-slate-900">{viewPayslipStaff.paymentRef}</span> • Gateway: {viewPayslipStaff.paymentChannel || 'CBN NIBSS Direct'}
                      </div>
                    )}
                  </div>
                )}

                {/* CUSTOM MEMO / REMARKS BLOCK */}
                {payslipCustomMemo && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Bursary Official Remarks:</span>
                    <p className="text-slate-800 mt-0.5 italic">{payslipCustomMemo}</p>
                  </div>
                )}

                {/* SIGNATURE & AUDIT STAMP BLOCK */}
                {payslipShowSignatures && (
                  <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center text-xs font-mono">
                    <div className="space-y-4">
                      <div className="h-8 border-b border-slate-400 flex items-end justify-center">
                        <span className="font-serif italic text-slate-600 text-sm">A. O. Babatunde</span>
                      </div>
                      <div className="text-slate-700 font-sans">
                        <strong className="block text-slate-900 text-[11px] font-bold uppercase">Senior Bursar / Accountant</strong>
                        <span className="text-[10px] text-slate-500">Corner Streams Schools</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-8 border-b border-slate-400 flex items-end justify-center">
                        <span className="font-serif italic text-slate-600 text-sm">Dr. David K. Macaulay</span>
                      </div>
                      <div className="text-slate-700 font-sans">
                        <strong className="block text-slate-900 text-[11px] font-bold uppercase">Principal / Executive Director</strong>
                        <span className="text-[10px] text-slate-500">Board Authorization Stamp</span>
                      </div>
                    </div>

                    {payslipShowQrCode && (
                      <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="w-10 h-10 bg-slate-900 text-emerald-400 font-mono font-black text-[9px] flex items-center justify-center rounded border border-slate-800 text-center">
                          QR-CS-2026
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Audit Hash: QR-{viewPayslipStaff.staffId}-2026</span>
                      </div>
                    )}
                  </div>
                )}

                {/* FOOTER DISCLAIMER */}
                <div className="text-center text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-2">
                  © 2026 Corner Streams. All rights reserved. Official Computer-Generated Remuneration Voucher.
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖨️ MODAL 4: SIMPLIFIED WHITE-BACKGROUND PRINTABLE REPORT                 */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-4 flex justify-center items-start print:p-0 print:bg-white print:static print:inset-auto print:block">
          
          {/* Controls Bar */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-slate-900 text-white p-2.5 rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Paper Document</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Content */}
          <div className="bg-white text-slate-900 w-full max-w-4xl p-8 rounded-2xl shadow-2xl border border-slate-300 my-4 font-sans space-y-6 print:shadow-none print:border-none print:p-0 print:m-0">
            
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <div className="font-mono text-xs text-slate-600 uppercase font-bold">CORNER STREAMS EDUCATIONAL INFRASTRUCTURE</div>
                <h1 className="text-xl font-black uppercase text-slate-900">
                  OFFICIAL STAFF PAYROLL LEDGER & INSTITUTIONAL BALANCE SHEET
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Workers Payment Disburse Schedule, Date of Payment Audit & Financial Position
                </p>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="font-bold">BURSARY AUDIT RECORD</div>
                <div>Session: {selectedMonth}</div>
                <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
              </div>
            </div>

            {/* BALANCE SHEET RECONCILIATION SUMMARY */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase text-slate-900 font-mono">1. FINANCIAL BALANCE SHEET SUMMARY</h2>
              <table className="w-full text-left border-collapse border border-slate-900 text-xs font-mono">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-900">
                    <th className="p-2 border border-slate-900">Financial Ledger Item</th>
                    <th className="p-2 border border-slate-900 text-right">Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-900 font-bold">Total Institutional Revenue Assets (Tuition & Grants)</td>
                    <td className="p-2 border border-slate-900 text-right font-bold text-emerald-800">₦{balanceSheetData.totalRevenueAssets.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-900">Total Staff Payroll Expense (Billed Net Pay)</td>
                    <td className="p-2 border border-slate-900 text-right font-bold text-slate-900">₦{balanceSheetData.totalStaffPayrollExpense.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-900 font-bold text-emerald-900">Settled Disbursements (Paid to Workers)</td>
                    <td className="p-2 border border-slate-900 text-right font-bold text-emerald-800">₦{balanceSheetData.settledDisbursedExpense.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-900 font-bold text-rose-900">Accrued Unpaid Staff Wages Liability</td>
                    <td className="p-2 border border-slate-900 text-right font-bold text-rose-800">₦{balanceSheetData.accruedStaffWagesPayable.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-300 font-black">
                    <td className="p-2.5 border border-slate-900">NET OPERATING BALANCE POSITION (SURPLUS)</td>
                    <td className="p-2.5 border border-slate-900 text-right text-sm">₦{balanceSheetData.netOperatingSurplus.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ITEMIZED STAFF PAYMENT SCHEDULE */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase text-slate-900 font-mono">2. WORKERS PAYMENT LEDGER (TEACHERS, DRIVERS, ENVIRONMENTALISTS, SECURITY & STAFF)</h2>
              <table className="w-full text-left border-collapse border border-slate-900 text-xs font-mono">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-900">
                    <th className="p-1.5 border border-slate-900">Staff ID</th>
                    <th className="p-1.5 border border-slate-900">Staff Name</th>
                    <th className="p-1.5 border border-slate-900">Role Category</th>
                    <th className="p-1.5 border border-slate-900 text-right">Net Pay (NGN)</th>
                    <th className="p-1.5 border border-slate-900 text-center">Status</th>
                    <th className="p-1.5 border border-slate-900">Date of Payment</th>
                    <th className="p-1.5 border border-slate-900">Payment Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRecords.map((r) => (
                    <tr key={r.id} className="border-b border-slate-400">
                      <td className="p-1.5 border border-slate-900 font-bold">{r.staffId}</td>
                      <td className="p-1.5 border border-slate-900 font-bold">{r.staffName}</td>
                      <td className="p-1.5 border border-slate-900">{r.roleCategory}</td>
                      <td className="p-1.5 border border-slate-900 text-right font-bold">₦{r.netPay.toLocaleString()}</td>
                      <td className="p-1.5 border border-slate-900 text-center font-bold">{r.paymentStatus}</td>
                      <td className="p-1.5 border border-slate-900">{r.paymentDate}</td>
                      <td className="p-1.5 border border-slate-900 text-[10px]">{r.paymentRef || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AUDIT SIGN OFF */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Audited By (Senior Bursar)</span>
                <div className="border-b border-slate-900 pb-1 mt-1 font-bold">
                  {currentProfile?.fullName || 'Senior Bursar Audit'}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Corner Streams Bursary Ledger</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Board Verification Stamp</span>
                <div className="border-b border-slate-900 pb-1 mt-1 font-bold text-slate-400">
                  Approved Sign-off: _________________
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Ref: CS-PAYROLL-BALANCE-SHEET</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ATTACHMENT PREVIEW SIDE PANEL (SLIDE-OVER DRAWER) */}
      {attachmentPanelStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setAttachmentPanelStaff(null)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col font-sans animate-in slide-in-from-right duration-300">
              
              {/* Panel Top Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/30 text-emerald-400 rounded-xl border border-indigo-500/40">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                        ATTACHMENT PREVIEW PANEL
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono border border-indigo-500/30 font-bold">
                        {(attachmentPanelStaff.attachments?.length || 0)} File{(attachmentPanelStaff.attachments?.length || 0) === 1 ? '' : 's'}
                      </span>
                    </div>
                    <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                      {attachmentPanelStaff.staffName}
                    </h2>
                    <p className="text-xs text-slate-300 font-mono">
                      {attachmentPanelStaff.staffId} • {attachmentPanelStaff.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDocUploadOpen(!isNewDocUploadOpen)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Doc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachmentPanelStaff(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                    title="Close Attachment Panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Panel Quick Staff Financial Summary Bar */}
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Pay Period: <strong className="text-slate-900 dark:text-white">{attachmentPanelStaff.monthSession}</strong></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">Status: {renderStatusBadge(attachmentPanelStaff.paymentStatus)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 mr-1.5">Net Payable:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    ₦{attachmentPanelStaff.netPay.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* COLLAPSIBLE UPLOAD NEW DOCUMENT FORM */}
              {isNewDocUploadOpen && (
                <form onSubmit={handleAddNewAttachment} className="p-4 bg-indigo-50/80 dark:bg-slate-800/90 border-b border-indigo-200 dark:border-slate-700 space-y-3 font-sans animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 font-mono flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      Upload New Receipt / Invoice Document
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNewDocUploadOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Document Title / File Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bank_Transfer_Advice_July2026.pdf"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Document Category
                      </label>
                      <select
                        value={newDocType}
                        onChange={(e: any) => setNewDocType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="RECEIPT">RECEIPT (Bank / CBN Payment Slip)</option>
                        <option value="INVOICE">INVOICE (Reimbursement / Honorarium)</option>
                        <option value="BANK_STAMP">BANK STAMP (Bank Clearance Slip)</option>
                        <option value="APPROVAL_MEMO">APPROVAL MEMO (Bursary Board Memo)</option>
                        <option value="TAX_VOUCHER">TAX VOUCHER (LIRS Tax Certificate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        File Format
                      </label>
                      <select
                        value={newDocFormat}
                        onChange={(e: any) => setNewDocFormat(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="PDF">PDF (Portable Document Format)</option>
                        <option value="PNG">PNG (High Res Image)</option>
                        <option value="JPEG">JPEG (Compressed Scan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Remarks / Audit Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Scanned by Bursary Office on disburse clearance"
                        value={newDocNotes}
                        onChange={(e) => setNewDocNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-bold rounded-lg text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Save & Attach Document</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ATTACHMENTS SELECTOR THUMBNAILS / TAB STRIP */}
              {attachmentPanelStaff.attachments && attachmentPanelStaff.attachments.length > 0 ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Horizontal Document Selection Strip */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 font-mono mr-1">
                      Select Doc:
                    </span>
                    {attachmentPanelStaff.attachments.map((att, idx) => {
                      const isSelected = idx === selectedAttachmentIndex;
                      return (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => {
                            setSelectedAttachmentIndex(idx);
                            setAttachmentZoomLevel(100);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {att.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE ATTACHMENT METADATA TOOLBAR */}
                  {(() => {
                    const currentDoc = attachmentPanelStaff.attachments[selectedAttachmentIndex] || attachmentPanelStaff.attachments[0];
                    if (!currentDoc) return null;

                    return (
                      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                        {/* Doc Toolbar */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{currentDoc.name}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                {currentDoc.fileFormat} • {currentDoc.fileSize}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Uploaded by <strong className="text-slate-700 dark:text-slate-300">{currentDoc.uploadedBy}</strong> on {currentDoc.uploadedAt} • Ref: {currentDoc.refCode}
                            </div>
                          </div>

                          {/* Toolbar Actions */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => setAttachmentZoomLevel(prev => Math.max(70, prev - 15))}
                                className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-700 dark:text-slate-300">
                                {attachmentZoomLevel}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setAttachmentZoomLevel(prev => Math.min(150, prev + 15))}
                                className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingleAttachment(currentDoc)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 text-[11px]"
                              title="Download Document"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="hidden sm:inline">Download</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 text-[11px]"
                              title="Print Document"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="hidden sm:inline">Print</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(currentDoc.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 rounded-lg transition border border-rose-200 dark:border-rose-800 cursor-pointer"
                              title="Delete Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* DOCUMENT PREVIEW CANVAS (HIGH RESOLUTION VOUCHER / RECEIPT RENDER) */}
                        <div className="flex-1 bg-slate-200/70 dark:bg-slate-950 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-auto flex justify-center items-start min-h-[420px]">
                          <div
                            className="bg-white text-slate-900 w-full max-w-xl p-6 rounded-xl shadow-xl border border-slate-300 font-sans space-y-4 relative transition-transform duration-200"
                            style={{ transform: `scale(${attachmentZoomLevel / 100})`, transformOrigin: 'top center' }}
                          >
                            {/* Document Watermark Seal */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                              <span className="text-6xl font-black font-mono rotate-45 text-slate-900 uppercase">
                                CORNER STREAMS VERIFIED
                              </span>
                            </div>

                            {/* Document Header */}
                            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                              <div>
                                <div className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  CORNER STREAMS EDUCATIONAL INFRASTRUCTURE
                                </div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
                                  {currentDoc.type === 'RECEIPT' && 'OFFICIAL BANK PAYMENT SETTLEMENT RECEIPT'}
                                  {currentDoc.type === 'INVOICE' && 'PAYROLL INVOICE & DISBURSEMENT VOUCHER'}
                                  {currentDoc.type === 'BANK_STAMP' && 'BANK DISBURSEMENT CLEARANCE CERTIFICATE'}
                                  {currentDoc.type === 'APPROVAL_MEMO' && 'BURSARY BOARD EXECUTIVE APPROVAL MEMO'}
                                  {currentDoc.type === 'TAX_VOUCHER' && 'STATE TAX WITHHOLDING CREDIT CERTIFICATE'}
                                </h3>
                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                  Document Ref: <strong className="text-slate-900">{currentDoc.refCode}</strong>
                                </div>
                              </div>

                              <div className="text-right font-mono text-[10px]">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black border border-emerald-300 inline-block uppercase">
                                  AUDITED & VERIFIED
                                </span>
                                <div className="text-slate-500 mt-1">Date: {currentDoc.uploadedAt.split(' ')[0]}</div>
                              </div>
                            </div>

                            {/* Staff & Payment Details Grid */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block font-bold">Staff Beneficiary:</span>
                                <span className="font-black text-slate-900">{attachmentPanelStaff.staffName}</span>
                                <span className="text-[10px] text-slate-500 block">ID: {attachmentPanelStaff.staffId}</span>
                                <span className="text-[10px] text-slate-600 block">{attachmentPanelStaff.jobTitle}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block font-bold">Bank Account Info:</span>
                                <span className="font-bold text-slate-900">{attachmentPanelStaff.bankName}</span>
                                <span className="text-[10px] text-slate-600 block">Acc: {attachmentPanelStaff.accountNumber}</span>
                                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                                  Txn Ref: {attachmentPanelStaff.paymentRef || 'TXN-SETTLED-DIRECT'}
                                </span>
                              </div>
                            </div>

                            {/* Itemized Financial Breakdown Table */}
                            <div className="space-y-1 font-mono text-xs">
                              <div className="text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200 pb-1">
                                DISBURSEMENT ITEMIZATION BREAKDOWN
                              </div>
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                  <span className="text-slate-600">Base Salary Grade Rate</span>
                                  <span className="font-bold text-slate-900">₦{attachmentPanelStaff.baseSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                                  <span>Special Allowances & Stipends</span>
                                  <span className="font-bold">+₦{attachmentPanelStaff.allowances.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                                  <span>Tax Withholding & Deductions</span>
                                  <span className="font-bold">-₦{attachmentPanelStaff.deductions.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 bg-slate-100 p-2 rounded font-black text-sm border border-slate-300">
                                  <span className="uppercase text-slate-900">TOTAL NET PAYABLE SETTLED</span>
                                  <span className="text-emerald-700">₦{attachmentPanelStaff.netPay.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Document Notes & Security Audit Stamp */}
                            <div className="pt-2 border-t border-slate-200 flex items-end justify-between font-mono text-[10px]">
                              <div>
                                <span className="font-bold text-slate-700 block uppercase">Audit Remarks & Notes:</span>
                                <p className="text-slate-600 italic max-w-xs">{currentDoc.notes || attachmentPanelStaff.notes || 'Document verified by Corner Streams Bursary Committee'}</p>
                              </div>
                              <div className="text-center bg-indigo-50 p-2 rounded border border-indigo-200 shrink-0">
                                <ShieldCheck className="w-5 h-5 text-indigo-600 mx-auto mb-0.5" />
                                <span className="font-bold text-indigo-900 uppercase block text-[9px]">BURSARY STAMP</span>
                                <span className="text-[8px] text-indigo-700">CLEARED & FILED</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* EMPTY STATE WHEN NO ATTACHMENTS EXIST FOR THIS STAFF RECORD */
                <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-4 font-sans">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500">
                    <FolderOpen className="w-12 h-12" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">No Document Attachments Found</h3>
                    <p className="text-xs text-slate-500">
                      No uploaded receipts, invoices, or bank slips are currently attached to {attachmentPanelStaff.staffName}'s payment ledger.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewDocUploadOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload First Attachment Document</span>
                  </button>
                </div>
              )}

              {/* Panel Footer Bar */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[11px]">
                  © 2026 Corner Streams Bursary • Secured Audit Storage
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentPanelStaff(null)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition text-[11px] cursor-pointer"
                >
                  Close Panel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
