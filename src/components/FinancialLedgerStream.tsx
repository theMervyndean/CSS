import React, { useState, useMemo } from 'react';
import { useDebtorRiskHeatmap, EnrichedDebtor } from '../hooks/useDebtorRiskHeatmap';
import {
  FinancialLedgerEntry,
  BillingRecord,
  UserProfile,
  LedgerSector,
  LedgerType
} from '../types';
import { mockLedgerEntries } from '../mockData';
import { 
  acquireGoogleWorkspaceToken, 
  exportFinancialAuditToGoogleSheet, 
  getCachedGoogleAccessToken 
} from '@/lib/googleWorkspace';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronDown,
  X,
  Lock,
  Unlock,
  Sparkles,
  Zap,
  Target,
  Scale,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Building2,
  FileCheck,
  Users,
  GraduationCap,
  Mail,
  Send,
  Download,
  AlertCircle,
  Award,
  Check,
  Sliders,
  SlidersHorizontal,
  RotateCcw,
  Copy,
  QrCode,
  Eye,
  History,
  ArrowRight,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { generateFinancialPDF } from '../utils/pdfGenerator';

interface FinancialLedgerStreamProps {
  currentProfile: UserProfile;
  billingRecords: BillingRecord[];
  onUpdateBilling: (updated: BillingRecord[]) => void;
  onNavigateToBroadsheet?: () => void;
}

const SECTOR_COLORS: Record<string, string> = {
  'Tuition & Academic Fees': '#059669', // Emerald
  'Infrastructure & Maintenance': '#2563eb', // Blue
  'ICT & CBT Engine Infrastructure': '#4f46e5', // Indigo
  'Staff Payroll & Allowances': '#7c3aed', // Purple
  'Transport & Fleet Operations': '#d97706', // Amber
  'Stationery & Exam Supplies': '#0284c7', // Sky
  'Canteen, Events & Co-Curricular': '#e11d48'  // Rose
};

const SECTORS: LedgerSector[] = [
  'Tuition & Academic Fees',
  'Infrastructure & Maintenance',
  'ICT & CBT Engine Infrastructure',
  'Staff Payroll & Allowances',
  'Transport & Fleet Operations',
  'Stationery & Exam Supplies',
  'Canteen, Events & Co-Curricular'
];

export default function FinancialLedgerStream({
  currentProfile,
  billingRecords,
  onUpdateBilling,
  onNavigateToBroadsheet
}: FinancialLedgerStreamProps) {
  // Navigation tabs within Financial Ledger Stream strictly restricted to the 7 requested modules:
  const [activeTab, setActiveTab] = useState<
    | 'tuition_schedule'
    | 'payment_verification'
    | 'debtors_clearance'
    | 'expenses_payable'
    | 'staff_payroll'
    | 'statements_audit'
    | 'bank_reconciliation'
  >('tuition_schedule');

  // Ledger Entries State
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>(() => {
    const saved = localStorage.getItem('CS_FINANCIAL_LEDGER');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return mockLedgerEntries;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Sub-states
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<any | null>(null);
  const [receiptModalEntry, setReceiptModalEntry] = useState<any | null>(null);
  // Paystub Layout Designer States
  const [selectedPaystubStaff, setSelectedPaystubStaff] = useState<any | null>(null);
  const [paystubLayoutFormat, setPaystubLayoutFormat] = useState<'A4_STANDARD' | 'COMPACT_SLIP' | 'EXECUTIVE_DETAILED'>('A4_STANDARD');
  const [paystubThemeColor, setPaystubThemeColor] = useState<'INDIGO' | 'EMERALD' | 'SLATE' | 'MONOCHROME'>('INDIGO');
  const [paystubShowLogo, setPaystubShowLogo] = useState<boolean>(true);
  const [paystubShowBankDetails, setPaystubShowBankDetails] = useState<boolean>(true);
  const [paystubShowTaxBreakdown, setPaystubShowTaxBreakdown] = useState<boolean>(true);
  const [paystubShowSignatures, setPaystubShowSignatures] = useState<boolean>(true);
  const [paystubShowQrCode, setPaystubShowQrCode] = useState<boolean>(true);
  const [paystubCustomMemo, setPaystubCustomMemo] = useState<string>('Disbursed via CBN Centralized Automated Payroll Gateway');
  const [paystubFontScale, setPaystubFontScale] = useState<'COMPACT' | 'STANDARD' | 'SPACIOUS'>('STANDARD');
  const [isPaystubLayoutSettingsOpen, setIsPaystubLayoutSettingsOpen] = useState<boolean>(true);

  const handleResetPaystubLayout = () => {
    setPaystubLayoutFormat('A4_STANDARD');
    setPaystubThemeColor('INDIGO');
    setPaystubShowLogo(true);
    setPaystubShowBankDetails(true);
    setPaystubShowTaxBreakdown(true);
    setPaystubShowSignatures(true);
    setPaystubShowQrCode(true);
    setPaystubCustomMemo('Disbursed via CBN Centralized Automated Payroll Gateway');
    setPaystubFontScale('STANDARD');
    toast.info('⚙️ Payslip layout parameters reset to default configuration.');
  };

  const handleExportPaystubCSV = (staff: any) => {
    const rows: string[][] = [
      ['CORNER STREAMS PLATFORM - STAFF PAYSLIP REPORT'],
      [`Staff Name: ${staff.name}`, `Staff ID: ${staff.id}`],
      [`Role: ${staff.role}`, `Pay Period: July 2026`],
      [],
      ['Item Description', 'Classification', 'Amount (NGN)'],
      ['Base Salary', 'Gross Pay', staff.baseSalary.toString()],
      ['Extra Stipends / Allowances', 'Stipends', staff.stipends.toString()],
      ['Deductions & Tax Withholdings', 'Withholdings', (-(staff.deductions + staff.tax)).toString()],
      ['NET DISBURSED SALARY', 'Net Pay', staff.net.toString()],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payslip_${staff.id}_${staff.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`📥 Exported itemized payslip CSV for ${staff.name}!`);
  };

  const handleCopyPaystubLink = (staff: any) => {
    const url = `https://cornerstreams.edu.ng/verify/payslip/${staff.id}`;
    navigator.clipboard.writeText(url);
    toast.success(`📋 Copied payslip verification link for ${staff.name} to clipboard!`);
  };
  const [financialAuditChartView, setFinancialAuditChartView] = useState<'multi_term' | 'expenditure_pie'>('multi_term');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSector, setNewSector] = useState<LedgerSector>('Tuition & Academic Fees');
  const [newType, setNewType] = useState<LedgerType>('INFLOW');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newPayerPayee, setNewPayerPayee] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('Bank Transfer (CBN Reconciled)');
  const [newNotes, setNewNotes] = useState<string>('');

  // Quick Payment Verification Modal State
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState<boolean>(false);
  const [isAuditExportModalOpen, setIsAuditExportModalOpen] = useState<boolean>(false);
  const [statementTermFilter, setStatementTermFilter] = useState<'CURRENT' | 'PREVIOUS'>('CURRENT');
  const [quickStudentName, setQuickStudentName] = useState<string>('');
  const [quickRegNumber, setQuickRegNumber] = useState<string>('');
  const [quickChannel, setQuickChannel] = useState<string>('Bank Transfer');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickRef, setQuickRef] = useState<string>('');

  const handleRecordQuickVerifiedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!quickStudentName.trim() || isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid student candidate name and payment amount.');
      return;
    }

    const randId = Math.floor(Math.random() * 9000 + 1000);
    const receiptNo = `RCP/2026/${randId}`;
    const newReceiptItem = {
      id: `RCP-${Date.now()}`,
      studentName: quickStudentName.trim(),
      regNumber: quickRegNumber.trim() || 'CS/2025/001',
      channel: quickChannel,
      ref: quickRef.trim() || `NIBSS-${randId}`,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      status: 'Verified',
      submittedBy: currentProfile.fullName,
      receiptNo,
      qrCode: `QR-${randId}`
    };

    const updated = [newReceiptItem, ...verificationQueue];
    persistVerification(updated);

    // Call hook method to auto-credit student and auto-refresh Debtor Risk Heatmap
    recordVerifiedPayment({
      receiptNo,
      studentName: quickStudentName.trim(),
      amount: amt,
      studentReg: quickRegNumber.trim()
    });

    setQuickStudentName('');
    setQuickRegNumber('');
    setQuickAmount('');
    setQuickRef('');
    setIsQuickPaymentModalOpen(false);
  };

  // Debtor filter state
  const [debtorAgingFilter, setDebtorAgingFilter] = useState<'ALL' | '30_DAYS' | '60_DAYS' | '90_DAYS_PLUS'>('ALL');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('ALL');

  // Custom Critical Debt Threshold Percentage State (Triggers visual alert on Heatmap)
  const [criticalThresholdPct, setCriticalThresholdPct] = useState<number>(() => {
    const saved = localStorage.getItem('CS_CRITICAL_DEBT_THRESHOLD_PCT');
    return saved ? parseFloat(saved) : 20;
  });

  const handleThresholdChange = (val: number) => {
    const bounded = Math.max(1, Math.min(100, val));
    setCriticalThresholdPct(bounded);
    localStorage.setItem('CS_CRITICAL_DEBT_THRESHOLD_PCT', bounded.toString());
  };

  // Initialize Debtor Risk Heatmap Hook for automatic real-time data refreshing on payment verification
  const {
    billing,
    enrichedDebtors,
    agingTotals,
    heatmapMatrix,
    COHORTS_LIST,
    lastRefreshedAt,
    refreshCount,
    isRefreshing,
    lastPaymentEvent,
    recordVerifiedPayment,
    forceRefreshHeatmap
  } = useDebtorRiskHeatmap(billingRecords, onUpdateBilling);

  // Count how many Heatmap cells breach the configured Critical Debt Threshold percentage
  const totalBreachesCount = useMemo(() => {
    if (!agingTotals.grandTotal) return 0;
    let count = 0;
    heatmapMatrix.forEach(row => {
      if ((row[30].debt / agingTotals.grandTotal) * 100 >= criticalThresholdPct) count++;
      if ((row[60].debt / agingTotals.grandTotal) * 100 >= criticalThresholdPct) count++;
      if ((row[90].debt / agingTotals.grandTotal) * 100 >= criticalThresholdPct) count++;
    });
    return count;
  }, [heatmapMatrix, agingTotals.grandTotal, criticalThresholdPct]);

  // Side Drawer State for Debtor Risk Heatmap Data Point Breakdown
  const [isDebtorDrawerOpen, setIsDebtorDrawerOpen] = useState<boolean>(false);
  const [drawerSelectedDebtor, setDrawerSelectedDebtor] = useState<EnrichedDebtor | null>(null);
  const [drawerCellInfo, setDrawerCellInfo] = useState<{ cohort: string; agingBracket: '30_DAYS' | '60_DAYS' | '90_DAYS_PLUS' } | null>(null);

  // Printable View Modal State for paper records
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isFitToPage, setIsFitToPage] = useState<boolean>(true);

  // Clickable action on Heatmap matrix data points: opens side drawer with ledger charges vs payment history breakdown
  const handleHeatmapCellClick = (cohort: string, agingBracket: '30_DAYS' | '60_DAYS' | '90_DAYS_PLUS') => {
    setSelectedCohortFilter(cohort);
    setDebtorAgingFilter(agingBracket);
    setDrawerCellInfo({ cohort, agingBracket });

    const debtorsInCell = enrichedDebtors.filter(
      d => d.cohort === cohort && d.agingBracket === agingBracket
    );

    if (debtorsInCell.length > 0) {
      setDrawerSelectedDebtor(debtorsInCell[0]);
      setIsDebtorDrawerOpen(true);
      toast.info(`Inspecting ${cohort} (${agingBracket.replace('_', ' ')}) - ${debtorsInCell.length} debtor(s) in drawer`);
    } else {
      toast.info(`No debtors currently recorded in ${cohort} (${agingBracket.replace('_', ' ')})`);
    }
  };

  const handleOpenDebtorDrawer = (debtor: EnrichedDebtor) => {
    setDrawerSelectedDebtor(debtor);
    setDrawerCellInfo({ cohort: debtor.cohort, agingBracket: debtor.agingBracket });
    setIsDebtorDrawerOpen(true);
  };

  // Quick Message Web APP SMS Modal State
  const [isQuickMsgModalOpen, setIsQuickMsgModalOpen] = useState<boolean>(false);
  const [quickMsgDebtor, setQuickMsgDebtor] = useState<EnrichedDebtor | null>(null);
  const [quickMsgTemplate, setQuickMsgTemplate] = useState<'STANDARD' | 'URGENT_CBT' | 'FINAL_NOTICE'>('STANDARD');
  const [quickMsgCustomText, setQuickMsgCustomText] = useState<string>('');

  const handleOpenQuickMessageModal = (debtor: EnrichedDebtor) => {
    setQuickMsgDebtor(debtor);
    setQuickMsgTemplate('STANDARD');
    setQuickMsgCustomText(
      `Dear Parent/Guardian of ${debtor.studentName} (${debtor.invoiceNumber}), this is a gentle reminder from the Bursary Desk that tuition fees of ₦${debtor.debt.toLocaleString()} for ${debtor.cohort} remain outstanding (${debtor.daysOverdue} days overdue). Please settle balance via the Corner Stream Parent Portal to maintain active CBT examination status. Thank you.`
    );
    setIsQuickMsgModalOpen(true);
  };

  const handleSelectQuickTemplate = (template: 'STANDARD' | 'URGENT_CBT' | 'FINAL_NOTICE') => {
    if (!quickMsgDebtor) return;
    setQuickMsgTemplate(template);
    if (template === 'STANDARD') {
      setQuickMsgCustomText(
        `Dear Parent/Guardian of ${quickMsgDebtor.studentName} (${quickMsgDebtor.invoiceNumber}), this is a gentle reminder from the Bursary Desk that tuition fees of ₦${quickMsgDebtor.debt.toLocaleString()} for ${quickMsgDebtor.cohort} remain outstanding (${quickMsgDebtor.daysOverdue} days overdue). Please settle balance via the Corner Stream Parent Portal to maintain active CBT examination status. Thank you.`
      );
    } else if (template === 'URGENT_CBT') {
      setQuickMsgCustomText(
        `URGENT BURSARY NOTICE: ${quickMsgDebtor.studentName} (${quickMsgDebtor.invoiceNumber}) has an outstanding fee balance of ₦${quickMsgDebtor.debt.toLocaleString()}. CBT Examination access clearance requires full or agreed fee clearance. Please remit payment immediately via the Corner Stream portal.`
      );
    } else {
      setQuickMsgCustomText(
        `FINAL NOTICE: Outstanding tuition arrears of ₦${quickMsgDebtor.debt.toLocaleString()} for ${quickMsgDebtor.studentName} (${quickMsgDebtor.invoiceNumber}) have reached ${quickMsgDebtor.daysOverdue} days overdue. Student CBT portal authorization will be suspended within 24 hours. Contact bursary desk immediately or pay online.`
      );
    }
  };

  const handleDispatchQuickSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsgDebtor) return;
    toast.success(
      `📱 Web APP SMS successfully dispatched to parent of ${quickMsgDebtor.studentName} via linked Corner Stream School Account!`
    );
    setIsQuickMsgModalOpen(false);
  };

  // Recharts Stacked Bar Data
  const cohortBarChartData = useMemo(() => {
    return heatmapMatrix.map(m => ({
      cohort: m.cohort,
      '30 Days (Grace)': m[30].debt,
      '60 Days (Elevated)': m[60].debt,
      '90+ Days (Critical)': m[90].debt,
    }));
  }, [heatmapMatrix]);

  // Recharts Donut Pie Data
  const riskPieChartData = useMemo(() => {
    return [
      { name: '0 - 30 Days (Grace)', value: agingTotals.total30, color: '#f59e0b' },
      { name: '31 - 60 Days (Elevated)', value: agingTotals.total60, color: '#f97316' },
      { name: '61 - 90+ Days (Critical)', value: agingTotals.total90, color: '#e11d48' },
    ].filter(i => i.value > 0);
  }, [agingTotals]);

  // Filtered list of debtors
  const filteredDebtors = useMemo(() => {
    return enrichedDebtors.filter(d => {
      const matchAging = debtorAgingFilter === 'ALL' || d.agingBracket === debtorAgingFilter;
      const matchCohort = selectedCohortFilter === 'ALL' || d.cohort === selectedCohortFilter;
      return matchAging && matchCohort;
    });
  }, [enrichedDebtors, debtorAgingFilter, selectedCohortFilter]);

  // Export Debtor Risk Heatmap and Outstanding Debtors list to CSV for external accounting reports
  const handleExportDebtorCSV = () => {
    const rows: string[][] = [];

    // Header Meta
    rows.push(['CORNER STREAMS PLATFORM - DEBTOR RISK HEATMAP & AGED CLEARANCE SCHEDULE REPORT']);
    rows.push([`Generated On: ${new Date().toLocaleString()}`]);
    rows.push([`Active Filters: Cohort = ${selectedCohortFilter} | Aging Bracket = ${debtorAgingFilter}`]);
    rows.push([]);

    // Heatmap Matrix Summary Section
    rows.push(['--- SECTION 1: DEBTOR RISK HEATMAP MATRIX (AGED BREAKDOWN BY CLASS COHORT) ---']);
    rows.push([
      'Class Cohort',
      '0 - 30 Days Arrears (Grace Period)',
      '31 - 60 Days Arrears (Elevated Risk)',
      '61 - 90+ Days Arrears (Critical Default)',
      'Cohort Total Arrears (NGN)'
    ]);

    heatmapMatrix.forEach(row => {
      rows.push([
        row.cohort,
        `NGN ${row[30].debt.toLocaleString()} (${row[30].count} student${row[30].count !== 1 ? 's' : ''})`,
        `NGN ${row[60].debt.toLocaleString()} (${row[60].count} student${row[60].count !== 1 ? 's' : ''})`,
        `NGN ${row[90].debt.toLocaleString()} (${row[90].count} student${row[90].count !== 1 ? 's' : ''})`,
        `NGN ${row.totalCohortDebt.toLocaleString()}`
      ]);
    });

    rows.push([
      'GRAND TOTALS',
      `NGN ${agingTotals.total30.toLocaleString()} (${agingTotals.count30} students)`,
      `NGN ${agingTotals.total60.toLocaleString()} (${agingTotals.count60} students)`,
      `NGN ${agingTotals.total90.toLocaleString()} (${agingTotals.count90} students)`,
      `NGN ${agingTotals.grandTotal.toLocaleString()} (${agingTotals.debtorCount} total debtors)`
    ]);
    rows.push([]);

    // Detailed Debtor Accounts Schedule Section
    rows.push(['--- SECTION 2: OUTSTANDING DEBTOR ACCOUNTS SCHEDULE ---']);
    rows.push([
      'Student Candidate Name',
      'Class Cohort',
      'Invoice / Reg Number',
      'Academic Term',
      'Days Overdue',
      'Aging Bracket',
      'Risk Exposure Category',
      'Billed Amount (NGN)',
      'Amount Paid (NGN)',
      'Outstanding Arrears (NGN)',
      'CBT Exam Access Lock Status'
    ]);

    const targetList = filteredDebtors.length > 0 ? filteredDebtors : enrichedDebtors;

    targetList.forEach(d => {
      const riskCategory =
        d.agingBracket === '90_DAYS_PLUS'
          ? 'HIGH_CRITICAL (90+ Days)'
          : d.agingBracket === '60_DAYS'
          ? 'MEDIUM_ELEVATED (60 Days)'
          : 'LOW_GRACE (30 Days)';
      const lockStatus =
        d.agingBracket === '90_DAYS_PLUS' || d.agingBracket === '60_DAYS'
          ? 'LOCKED (CBT Access Frozen)'
          : 'ACTIVE (Grace Permitted)';

      rows.push([
        d.studentName,
        d.cohort,
        d.invoiceNumber,
        d.term,
        d.daysOverdue.toString(),
        d.agingBracket,
        riskCategory,
        d.totalAmount.toString(),
        d.amountPaid.toString(),
        d.debt.toString(),
        lockStatus
      ]);
    });

    // Escape CSV values
    const csvContent = rows
      .map(r =>
        r
          .map(cell => {
            const escaped = String(cell).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Debtor_Risk_Heatmap_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`📊 Exported ${targetList.length} debtor account(s) and Heatmap Matrix to CSV report!`);
  };

  // Multi-channel verification records state
  const [verificationQueue, setVerificationQueue] = useState<any[]>(() => {
    const saved = localStorage.getItem('CS_VERIFICATION_QUEUE');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'RCP-801', studentName: 'Chinedu Okeke', regNumber: 'CS/2025/001', channel: 'Bank Transfer', ref: 'NIBSS-902810', amount: 150000, date: '2026-07-28', status: 'Pending Verification', submittedBy: 'Parent (Okeke Family)', receiptNo: 'RCP/2026/801', qrCode: 'QR-801-OK' },
      { id: 'RCP-802', studentName: 'Amina Yusuf', regNumber: 'CS/2025/002', channel: 'POS Terminal', ref: 'POS-771204', amount: 120000, date: '2026-07-27', status: 'Verified', submittedBy: 'Bursary Admin', receiptNo: 'RCP/2026/802', qrCode: 'QR-802-AM' },
      { id: 'RCP-803', studentName: 'Emeka Adebayo', regNumber: 'CS/2025/003', channel: 'Teller Deposit', ref: 'TEL-441092', amount: 85000, date: '2026-07-26', status: 'Verified', submittedBy: 'Bursary Admin', receiptNo: 'RCP/2026/803', qrCode: 'QR-803-EM' },
      { id: 'RCP-804', studentName: 'Fatima Danjuma', regNumber: 'CS/2025/004', channel: 'Mobile App', ref: 'MB-102938', amount: 180000, date: '2026-07-25', status: 'Flagged', submittedBy: 'Parent (Danjuma)', receiptNo: 'RCP/2026/804', qrCode: 'QR-804-FA' }
    ];
  });

  // Unassigned Bank Feeds state
  const [unassignedBankFeeds, setUnassignedBankFeeds] = useState<any[]>(() => {
    return [
      { id: 'FEED-01', date: '2026-07-28 09:12', bankRef: 'TRF/BNK/998201', amount: 150000, narrative: 'TUITION PAYMENT / OKEEKE', matchedReg: '', status: 'UNASSIGNED' },
      { id: 'FEED-02', date: '2026-07-27 14:30', bankRef: 'TRF/BNK/998202', amount: 85000, narrative: 'SCHOOL FEES TRANSFER', matchedReg: '', status: 'UNASSIGNED' },
      { id: 'FEED-03', date: '2026-07-26 11:05', bankRef: 'TRF/BNK/998203', amount: 120000, narrative: 'AMINA YUSUF 1ST TERM', matchedReg: 'CS/2025/002', status: 'STAGED' }
    ];
  });

  // Vendor Payables state
  const [vendorPayables, setVendorPayables] = useState<any[]>([
    { id: 'VND-01', vendor: 'Macaulay Publishing House', service: 'Term 1 Workbooks & Science Kits', amount: 450000, status: 'APPROVED_PAYABLE', dueDate: '2026-08-15' },
    { id: 'VND-02', vendor: 'Shell Diesel Depot', service: 'Campus Generator Fueling (2000L)', amount: 1200000, status: 'PAID', dueDate: '2026-07-20' },
    { id: 'VND-03', vendor: 'CyberNet Fiber Systems', service: 'CBT Server Bandwidth Subscription', amount: 350000, status: 'PENDING_APPROVAL', dueDate: '2026-08-01' }
  ]);

  // Staff Payroll state & search
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffPayrollList, setStaffPayrollList] = useState<any[]>([
    { id: 'PAY-101', name: 'Dr. David K. Macaulay', role: 'Principal / Proprietor', baseSalary: 650000, stipends: 50000, deductions: 25000, tax: 45000, status: 'DISBURSED' },
    { id: 'PAY-102', name: 'Mrs. Folake Adeyemi', role: 'Head Teacher (Primary)', baseSalary: 380000, stipends: 30000, deductions: 12000, tax: 22000, status: 'DISBURSED' },
    { id: 'PAY-103', name: 'Mr. Emmanuel Chukwu', role: 'Senior Physics Teacher', baseSalary: 280000, stipends: 25000, deductions: 8000, tax: 16000, status: 'PENDING' },
    { id: 'PAY-104', name: 'Mazi Obinna Nnamdi', role: 'Bursar & Accountant', baseSalary: 320000, stipends: 20000, deductions: 10000, tax: 18000, status: 'DISBURSED' }
  ]);

  const filteredStaffPayrollList = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffPayrollList;
    const q = staffSearchQuery.toLowerCase().trim();
    return staffPayrollList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  }, [staffPayrollList, staffSearchQuery]);

  const handleExportStaffPayrollCSV = () => {
    const rows: string[][] = [];

    rows.push(['CORNER STREAMS PLATFORM - STAFF PAYROLL & REMUNERATION REPORT']);
    rows.push([`Generated On: ${new Date().toLocaleString()}`]);
    rows.push([`Filter Search Query: ${staffSearchQuery ? `"${staffSearchQuery}"` : 'ALL STAFF'}`]);
    rows.push([]);

    rows.push(['Staff ID', 'Staff Name', 'Designation / Role', 'Base Salary (NGN)', 'Stipends (NGN)', 'Deductions & Tax (NGN)', 'Net Payable (NGN)', 'Status']);

    filteredStaffPayrollList.forEach(staff => {
      const net = staff.baseSalary + staff.stipends - staff.deductions - staff.tax;
      rows.push([
        staff.id,
        staff.name,
        staff.role,
        staff.baseSalary.toString(),
        staff.stipends.toString(),
        (staff.deductions + staff.tax).toString(),
        net.toString(),
        staff.status
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Payroll_Remuneration_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`📥 Exported ${filteredStaffPayrollList.length} staff payroll record(s) to CSV report!`);
  };

  const persistLedger = (updated: FinancialLedgerEntry[]) => {
    setLedgerEntries(updated);
    localStorage.setItem('CS_FINANCIAL_LEDGER', JSON.stringify(updated));
  };

  const persistVerification = (updated: any[]) => {
    setVerificationQueue(updated);
    localStorage.setItem('CS_VERIFICATION_QUEUE', JSON.stringify(updated));
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalBilled = billing.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalCollected = billing.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalDebts = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    
    let totalOutflows = 0;
    ledgerEntries.forEach(e => {
      if (e.type === 'OUTFLOW' && e.status === 'RECONCILED') totalOutflows += e.amount;
    });

    return { totalBilled, totalCollected, totalDebts, collectionRate, totalOutflows };
  }, [billing, ledgerEntries]);

  // Dynamic Term-Scoped Financial Statement Calculations
  const activeStatementData = useMemo(() => {
    const isCurrent = statementTermFilter === 'CURRENT';

    const grossInflow = isCurrent ? metrics.totalCollected : Math.round(metrics.totalCollected * 0.88);
    const totalOutflow = isCurrent ? metrics.totalOutflows : Math.round(metrics.totalOutflows * 0.91);
    const netSurplus = grossInflow - totalOutflow;
    const accountsReceivable = isCurrent ? metrics.totalDebts : Math.round(metrics.totalDebts * 1.15);
    const bankCashReserves = isCurrent ? 18450000 : 14800000;
    const cbtFixedAssets = isCurrent ? 25000000 : 22000000;
    const campusLand = 145000000;
    const accountsPayable = isCurrent ? 3200000 : 4100000;
    const salaryAccruals = isCurrent ? 1850000 : 1920000;
    const facilityLoan = isCurrent ? 12500000 : 14000000;

    const totalAssets = bankCashReserves + accountsReceivable + cbtFixedAssets + campusLand;
    const totalLiabilitiesAndEquity = totalAssets;
    const boardEquity = totalAssets - (accountsPayable + salaryAccruals + facilityLoan);

    const cbtLevies = isCurrent ? 5100000 : 4200000;
    const operatingInflow = grossInflow + cbtLevies;
    const payrollOutflow = Math.round(totalOutflow * (isCurrent ? 0.56 : 0.54));
    const operatingExpenseOutflow = Math.round(totalOutflow * (isCurrent ? 0.44 : 0.46));
    const operatingOutflowTotal = payrollOutflow + operatingExpenseOutflow;
    const operatingNet = operatingInflow - operatingOutflowTotal;

    const cbtProcurement = isCurrent ? -2500000 : -1800000;
    const labAcquisitions = isCurrent ? -1200000 : -1000000;
    const investingNet = cbtProcurement + labAcquisitions;

    const boardGrant = isCurrent ? 5000000 : 3500000;
    const loanServicing = isCurrent ? -1500000 : -1500000;
    const financingNet = boardGrant + loanServicing;

    const netChangeCash = operatingNet + investingNet + financingNet;
    const beginningCash = isCurrent ? 14800000 : 12140000;
    const endingCash = isCurrent ? 18450000 : 14800000;

    const departmental = [
      {
        department: 'Staff Payroll & Employee Allowances',
        budgeted: Math.round(totalOutflow * 0.58),
        actual: payrollOutflow,
        icon: Users,
        color: '#7c3aed'
      },
      {
        department: 'Tuition & Academic Exam Supplies',
        budgeted: Math.round(totalOutflow * 0.18),
        actual: Math.round(totalOutflow * (isCurrent ? 0.19 : 0.20)),
        icon: GraduationCap,
        color: '#059669'
      },
      {
        department: 'Infrastructure & Campus Repairs',
        budgeted: Math.round(totalOutflow * 0.12),
        actual: Math.round(totalOutflow * (isCurrent ? 0.11 : 0.12)),
        icon: Building2,
        color: '#2563eb'
      },
      {
        department: 'ICT & CBT Server Operations',
        budgeted: Math.round(totalOutflow * 0.08),
        actual: Math.round(totalOutflow * (isCurrent ? 0.085 : 0.08)),
        icon: Landmark,
        color: '#4f46e5'
      },
      {
        department: 'Transport & Fleet Logistics',
        budgeted: Math.round(totalOutflow * 0.06),
        actual: Math.round(totalOutflow * (isCurrent ? 0.055 : 0.06)),
        icon: CreditCard,
        color: '#d97706'
      }
    ];

    return {
      isCurrent,
      termLabel: isCurrent ? 'Term 3 (2025/2026 Academic Session)' : 'Term 2 (2025/2026 Academic Session)',
      shortTermLabel: isCurrent ? 'Term 3 (2025/2026)' : 'Term 2 (2025/2026)',
      grossInflow,
      totalOutflow,
      netSurplus,
      accountsReceivable,
      bankCashReserves,
      cbtFixedAssets,
      campusLand,
      totalAssets,
      accountsPayable,
      salaryAccruals,
      facilityLoan,
      boardEquity,
      totalLiabilitiesAndEquity,
      cbtLevies,
      operatingInflow,
      payrollOutflow,
      operatingExpenseOutflow,
      operatingOutflowTotal,
      operatingNet,
      cbtProcurement,
      labAcquisitions,
      investingNet,
      boardGrant,
      loanServicing,
      financingNet,
      netChangeCash,
      beginningCash,
      endingCash,
      departmental
    };
  }, [statementTermFilter, metrics]);

  // Overall Expenditure Category Breakdown for Financial Statements Audit Tier
  const overallExpenditureCategoryData = useMemo(() => {
    const totalOutflow = activeStatementData.totalOutflow || 18450000;
    const items = [
      { category: 'Faculty & Staff Payroll Outlay', amount: Math.round(totalOutflow * 0.48), color: '#4f46e5', desc: 'Salaries, stipends & pension contributions' },
      { category: 'Utilities, Power & Grid Energy', amount: Math.round(totalOutflow * 0.14), color: '#10b981', desc: 'IPP diesel, water grid & internet fiber' },
      { category: 'Academic & Laboratory Resources', amount: Math.round(totalOutflow * 0.12), color: '#06b6d4', desc: 'STEM chemicals, textbooks & exam software' },
      { category: 'Facilities & Campus Maintenance', amount: Math.round(totalOutflow * 0.10), color: '#f59e0b', desc: 'Roofing, painting, IT & building repairs' },
      { category: 'Transport & Fleet Operations', amount: Math.round(totalOutflow * 0.08), color: '#8b5cf6', desc: 'Bus fueling, repairs & driver stipends' },
      { category: 'Admin & Governance Operations', amount: Math.round(totalOutflow * 0.05), color: '#ec4899', desc: 'Stationery, printing, audit & licenses' },
      { category: 'Security Patrol & Medical Clinic', amount: Math.round(totalOutflow * 0.03), color: '#3b82f6', desc: 'CCTV, security guards & clinic stocks' },
    ];

    const sumOutlay = items.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      items: items.map(i => ({
        ...i,
        percentage: Number(((i.amount / sumOutlay) * 100).toFixed(1))
      })),
      sumOutlay
    };
  }, [activeStatementData]);

  // Institutional Financial Audit & Cash Flow Data Memoizations
  const multiTermAuditData = useMemo(() => {
    const currentInflow = metrics.totalCollected;
    const currentOutflow = metrics.totalOutflows;

    return [
      {
        term: 'Term 1 (24/25)',
        inflow: Math.round(currentInflow * 0.82),
        outflow: Math.round(currentOutflow * 0.85),
        payroll: Math.round(currentOutflow * 0.50),
        netSurplus: Math.round(currentInflow * 0.82 - currentOutflow * 0.85)
      },
      {
        term: 'Term 2 (24/25)',
        inflow: Math.round(currentInflow * 0.88),
        outflow: Math.round(currentOutflow * 0.89),
        payroll: Math.round(currentOutflow * 0.52),
        netSurplus: Math.round(currentInflow * 0.88 - currentOutflow * 0.89)
      },
      {
        term: 'Term 3 (24/25)',
        inflow: Math.round(currentInflow * 0.94),
        outflow: Math.round(currentOutflow * 0.92),
        payroll: Math.round(currentOutflow * 0.53),
        netSurplus: Math.round(currentInflow * 0.94 - currentOutflow * 0.92)
      },
      {
        term: 'Term 1 (25/26)',
        inflow: Math.round(currentInflow * 0.96),
        outflow: Math.round(currentOutflow * 0.95),
        payroll: Math.round(currentOutflow * 0.54),
        netSurplus: Math.round(currentInflow * 0.96 - currentOutflow * 0.95)
      },
      {
        term: 'Term 2 (25/26)',
        inflow: Math.round(currentInflow * 0.88),
        outflow: Math.round(currentOutflow * 0.89),
        payroll: Math.round(currentOutflow * 0.52),
        netSurplus: Math.round(currentInflow * 0.88 - currentOutflow * 0.89)
      },
      {
        term: 'Term 3 (Current)',
        inflow: currentInflow,
        outflow: currentOutflow,
        payroll: Math.round(currentOutflow * 0.56),
        netSurplus: currentInflow - currentOutflow
      }
    ];
  }, [metrics]);

  const departmentalBudgetData = useMemo(() => {
    return activeStatementData.departmental;
  }, [activeStatementData]);

  const cashFlowData = useMemo(() => {
    return {
      operatingInflow: activeStatementData.operatingInflow,
      operatingOutflow: activeStatementData.operatingOutflowTotal,
      operatingNet: activeStatementData.operatingNet,
      investingNet: activeStatementData.investingNet,
      financingNet: activeStatementData.financingNet,
      netChangeCash: activeStatementData.netChangeCash,
      beginningCash: activeStatementData.beginningCash,
      endingCash: activeStatementData.endingCash
    };
  }, [activeStatementData]);

  const handleGenerateBoardPDFReport = () => {
    try {
      generateFinancialPDF({
        title: `INSTITUTIONAL FINANCIAL STATEMENTS (${activeStatementData.termLabel.toUpperCase()})`,
        termScope: activeStatementData.termLabel,
        preparedBy: currentProfile?.fullName || 'Senior Bursar / Financial Officer',
        currentProfile,
        filteredBills: billingRecords,
        departmentalData: departmentalBudgetData,
        statementData: {
          grossInflow: activeStatementData.grossInflow,
          totalOutflow: activeStatementData.totalOutflow,
          netSurplus: activeStatementData.netSurplus,
          bankCashReserves: activeStatementData.bankCashReserves
        }
      });
      toast.success('📄 Multi-page Financial PDF Board Report generated and downloaded!');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate Financial PDF report.');
    }
  };

  const handleExportAuditVaultCSV = () => {
    const rows: string[][] = [];

    rows.push(['CORNER STREAMS EDUCATIONAL INFRASTRUCTURE - OFFICIAL AUDIT VAULT REPORT']);
    rows.push([`Report Period: ${activeStatementData.termLabel}`]);
    rows.push([`Generated On: ${new Date().toLocaleString()}`]);
    rows.push([`Auditor Clearance Ref: AUD-CS-${new Date().getFullYear()}-0091`]);
    rows.push([]);

    // Executive Financial Summary
    rows.push(['--- SECTION 1: EXECUTIVE FINANCIAL SUMMARY ---']);
    rows.push(['Metric Title', 'Amount (NGN)']);
    rows.push(['Total Inflows (Verified Tuition & Fees)', activeStatementData.grossInflow.toString()]);
    rows.push(['Total Outflows (Operational & Payroll Expenses)', activeStatementData.totalOutflow.toString()]);
    rows.push(['Net Operating Surplus', activeStatementData.netSurplus.toString()]);
    rows.push(['CBN Reconciled Cash Reserves', activeStatementData.bankCashReserves.toString()]);
    rows.push(['Accounts Receivable (Outstanding Parent Debts)', activeStatementData.accountsReceivable.toString()]);
    rows.push(['Fixed Campus Assets (CBT Hardware & Campus Infrastructure)', activeStatementData.cbtFixedAssets.toString()]);
    rows.push([]);

    // Multi-Term Trend
    rows.push(['--- SECTION 2: MULTI-TERM COMPARATIVE TRENDS ---']);
    rows.push(['Academic Term', 'Inflows (NGN)', 'Outflows (NGN)', 'Staff Payroll (NGN)', 'Net Surplus (NGN)']);
    multiTermAuditData.forEach(t => {
      rows.push([t.term, t.inflow.toString(), t.outflow.toString(), t.payroll.toString(), t.netSurplus.toString()]);
    });
    rows.push([]);

    // Departmental Budget Allocation
    rows.push(['--- SECTION 3: DEPARTMENTAL BUDGET ALLOCATION & VARIANCE ---']);
    rows.push(['Department Name', 'Budgeted Amount (NGN)', 'Actual Outlay (NGN)', 'Variance (NGN)', 'Variance (%)']);
    departmentalBudgetData.forEach(d => {
      const diff = d.budgeted - d.actual;
      const pct = ((diff / d.budgeted) * 100).toFixed(1);
      rows.push([d.department, d.budgeted.toString(), d.actual.toString(), diff.toString(), `${pct}%`]);
    });
    rows.push([]);

    // Cash Flow Statement
    rows.push(['--- SECTION 4: CASH FLOW STATEMENT (DIRECT METHOD) ---']);
    rows.push(['Cash Flow Classification', 'Amount (NGN)']);
    rows.push(['Operating Cash Inflow - Tuition Collections', activeStatementData.grossInflow.toString()]);
    rows.push(['Operating Cash Inflow - CBT Levies & Other Fees', activeStatementData.cbtLevies.toString()]);
    rows.push(['Operating Cash Outflow - Staff Payroll Disbursed', (-activeStatementData.payrollOutflow).toString()]);
    rows.push(['Operating Cash Outflow - Operational & Maintenance Vendor Outlays', (-activeStatementData.operatingExpenseOutflow).toString()]);
    rows.push(['Net Cash Provided by Operating Activities', cashFlowData.operatingNet.toString()]);
    rows.push(['Investing Cash Outflow - CBT Server & Laptop Procurement', activeStatementData.cbtProcurement.toString()]);
    rows.push(['Investing Cash Outflow - Science Lab & Library Books', activeStatementData.labAcquisitions.toString()]);
    rows.push(['Net Cash Used in Investing Activities', cashFlowData.investingNet.toString()]);
    rows.push(['Financing Cash Inflow - Education Trust Fund Grant', activeStatementData.boardGrant.toString()]);
    rows.push(['Financing Cash Outflow - Bank Commercial Facility Servicing', activeStatementData.loanServicing.toString()]);
    rows.push(['Net Cash Provided by Financing Activities', cashFlowData.financingNet.toString()]);
    rows.push(['Net Increase in Cash & Cash Equivalents', cashFlowData.netChangeCash.toString()]);
    rows.push(['Beginning Cash Balance (Start of Term)', cashFlowData.beginningCash.toString()]);
    rows.push(['Ending Reconciled Cash Balance (CBN Reconciled)', cashFlowData.endingCash.toString()]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Corner_Streams_Official_Audit_Vault_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('📥 Official Financial Audit Vault CSV report generated & downloaded successfully!');
  };

  const [isExportingAuditToSheets, setIsExportingAuditToSheets] = useState(false);

  // Export Financial Statements directly to Google Sheets
  const handleExportAuditVaultGoogleSheets = async () => {
    setIsExportingAuditToSheets(true);
    try {
      let token = getCachedGoogleAccessToken();
      if (!token) {
        toast.info("Connecting to Google Account for Sheets export...");
        token = await acquireGoogleWorkspaceToken();
      }

      toast.loading("Creating Financial Audit Google Sheet in Drive...", { id: "fin-sheet-export" });

      const result = await exportFinancialAuditToGoogleSheet(
        activeStatementData.termLabel,
        {
          grossInflow: activeStatementData.grossInflow,
          totalOutflow: activeStatementData.totalOutflow,
          netSurplus: activeStatementData.netSurplus,
          bankCashReserves: activeStatementData.bankCashReserves,
          accountsReceivable: activeStatementData.accountsReceivable,
          cbtFixedAssets: activeStatementData.cbtFixedAssets
        },
        departmentalBudgetData,
        multiTermAuditData,
        token
      );

      toast.dismiss("fin-sheet-export");
      toast.success("Institutional Financial Audit exported to Google Sheets!");

      if (result.spreadsheetUrl) {
        window.open(result.spreadsheetUrl, "_blank");
      }
    } catch (err: any) {
      console.error("Financial Google Sheets export error:", err);
      toast.dismiss("fin-sheet-export");
      toast.error(err.message || "Failed to export financial statements to Google Sheets.");
    } finally {
      setIsExportingAuditToSheets(false);
    }
  };

  // Handle Verify Receipt
  const handleVerifyReceipt = (receiptId: string, action: 'Verified' | 'Flagged') => {
    let verifiedItem: any = null;
    const updated = verificationQueue.map(item => {
      if (item.id === receiptId) {
        if (action === 'Verified') {
          verifiedItem = item;
        }
        return { ...item, status: action };
      }
      return item;
    });
    persistVerification(updated);

    if (action === 'Verified' && verifiedItem) {
      // Trigger hook to automatically credit target student and auto-refresh Debtor Risk Heatmap
      recordVerifiedPayment({
        receiptNo: verifiedItem.receiptNo || verifiedItem.id,
        studentName: verifiedItem.studentName,
        amount: verifiedItem.amount,
        studentReg: verifiedItem.regNumber
      });
    } else {
      toast.success(`Receipt ${receiptId} marked as ${action}! Audit trail updated.`);
    }
  };

  // Handle Add New Record
  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amt) || amt <= 0 || !newPayerPayee.trim()) {
      toast.error('Please complete all required fields with a valid amount.');
      return;
    }

    const randNum = Math.floor(Math.random() * 9000 + 1000);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newEntry: FinancialLedgerEntry = {
      id: `LEDG-${Date.now()}`,
      date: dateStr,
      sector: newSector,
      type: newType,
      title: newTitle.trim(),
      amount: amt,
      payerOrPayee: newPayerPayee.trim(),
      paymentMethod: newPaymentMethod,
      status: 'RECONCILED',
      reference: `REF-CS-${randNum}`,
      receiptNumber: newType === 'INFLOW' ? `RCP/2026/${randNum}` : `VCH/2026/${randNum}`,
      notes: newNotes.trim() || 'Verified by Bursary Clearance Engine.',
      approvedBy: currentProfile.fullName
    };

    const updated = [newEntry, ...ledgerEntries];
    persistLedger(updated);

    // If INFLOW, auto-refresh Debtor Risk Heatmap via hook
    if (newType === 'INFLOW') {
      recordVerifiedPayment({
        receiptNo: newEntry.receiptNumber,
        studentName: newPayerPayee.trim(),
        amount: amt
      });
    }

    setNewTitle('');
    setNewAmount('');
    setNewPayerPayee('');
    setNewNotes('');
    setIsRecordModalOpen(false);

    toast.success(`Transaction ${newEntry.receiptNumber} recorded successfully!`);
  };

  // Apply Discount/Scholarship
  const handleApplyDiscount = (billingId: string, pct: number, label: string) => {
    const updated = billing.map(b => {
      if (b.id === billingId) {
        const discountAmt = Math.round((b.totalAmount * pct) / 100);
        return {
          ...b,
          totalAmount: Math.max(0, b.totalAmount - discountAmt),
          miscellaneousFee: Math.max(0, b.miscellaneousFee - discountAmt)
        };
      }
      return b;
    });
    if (onUpdateBilling) {
      onUpdateBilling(updated);
    }
    toast.success(`Applied ${pct}% ${label} rebate to billing account!`);
  };

  // Send Debt Reminder Broadcast
  const handleSendDebtReminder = (studentName: string, amount: number) => {
    toast.success(`📱 SMS / Email payment reminder dispatched to ${studentName}'s parent for ₦${amount.toLocaleString()} overdue balance!`);
  };

  // Assign Bank Match
  const handleAssignBankMatch = (feedId: string, studentReg: string) => {
    if (!studentReg.trim()) {
      toast.error('Please enter a valid student registration number.');
      return;
    }
    const targetFeed = unassignedBankFeeds.find(f => f.id === feedId);
    setUnassignedBankFeeds(prev => prev.map(f => f.id === feedId ? { ...f, matchedReg: studentReg, status: 'RECONCILED' } : f));

    if (targetFeed) {
      recordVerifiedPayment({
        receiptNo: targetFeed.bankRef || targetFeed.id,
        studentName: targetFeed.narrative || 'Student Payment',
        amount: targetFeed.amount,
        studentReg: studentReg
      });
    } else {
      toast.success(`Bank transfer ${feedId} reconciled & credited to student ${studentReg}!`);
    }
  };

  const triggerNativePrint = () => {
    window.print();
  };

  const handleExportBillingLedgerPDF = () => {
    toast.info("Preparing Billing Ledger document for PDF export...");
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-mono font-bold uppercase tracking-widest">
              CBN Reconciled Financial Engine
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-800 text-indigo-200 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
              Bursary & Audit Desk
            </span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white font-display flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-400" />
            Financial Ledger Stream
          </h1>
          <p className="text-xs text-indigo-200 max-w-xl">
            Real-time bursary ledger for tuition fee schedules, payment verifications, debtors matrix, institutional expenses, payroll, and CBN bank reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isExportingAuditToSheets}
            onClick={handleExportAuditVaultGoogleSheets}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export Institutional Audit & Cash Flows directly to Google Sheets"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#FFF" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              <path fill="#0F9D58" d="M14 6H7v12h10V9l-3-3zm-1 3.5V7.5L15.5 10H13zM9 13h6v1.5H9V13zm0-2h6v1.5H9V11zm0 4h4v1.5H9V15z"/>
            </svg>
            <span>{isExportingAuditToSheets ? "Syncing Sheets..." : "Export to Google Sheets"}</span>
            {isExportingAuditToSheets && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
          </button>
          <button
            type="button"
            onClick={handleGenerateBoardPDFReport}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Generate formatted multi-page Billing & Financial PDF report for board presentations"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Generate PDF Report</span>
          </button>
          <button
            type="button"
            onClick={handleExportBillingLedgerPDF}
            className="px-3.5 py-2 bg-indigo-900/90 hover:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-700/80 shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Export Billing Ledger view leveraging clean print-friendly styles"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>Export to PDF</span>
          </button>
          {onNavigateToBroadsheet && (
            <button
              type="button"
              onClick={onNavigateToBroadsheet}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Broadsheet Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* STRICT REQ: 7 NAVIGATION TABS FOR FINANCIAL LEDGER */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('tuition_schedule')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tuition_schedule'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">1. Tuition & Fee Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment_verification')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'payment_verification'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-300 shrink-0" />
          <span className="truncate">2. Payment & Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('debtors_clearance')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'debtors_clearance'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">3. Debtors & Clearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses_payable')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'expenses_payable'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-300 shrink-0" />
          <span className="truncate">4. Expenses & Payables</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff_payroll')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'staff_payroll'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-300 shrink-0" />
          <span className="truncate">5. Staff Payroll Desk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statements_audit')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'statements_audit'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="truncate">6. Financial Statements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank_reconciliation')}
          className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'bank_reconciliation'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">7. Bank Reconciliation</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🎓 TAB 1: STUDENT TUITION & FEE SCHEDULE LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'tuition_schedule' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Term Billing</span>
              <p className="text-lg font-black text-slate-900 font-mono">₦{metrics.totalBilled.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Uniform & Custom Cohort Levies</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verified Collections</span>
              <p className="text-lg font-black text-emerald-600 font-mono">₦{metrics.totalCollected.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-600 font-bold">{metrics.collectionRate}% Collection Efficiency</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-rose-500">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Arrears Balance</span>
              <p className="text-lg font-black text-rose-600 font-mono">₦{metrics.totalDebts.toLocaleString()}</p>
              <p className="text-[10px] text-rose-500 font-bold">Unpaid Tuition Balances</p>
            </div>
            <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-900 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Quick Fee Entry</span>
                <p className="text-[10px] text-indigo-200">Log custom fee inflow into bursary</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Fee Entry</span>
              </button>
            </div>
          </div>

          {/* Student Tuition Schedules & Cohort Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Student Cohort Fee Schedule & Rebates Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Termly tuition charges, science lab levies, scholarships, and individual student ledger cards.
                </p>
              </div>
              <button
                type="button"
                onClick={triggerNativePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Print Fee Schedule</span>
              </button>
            </div>

            {/* Student Fee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {billingRecords.map((bill) => {
                const outstanding = bill.totalAmount - bill.amountPaid;
                return (
                  <div key={bill.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 hover:border-indigo-300 transition shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-indigo-600">{bill.invoiceNumber}</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase mt-0.5">{bill.studentName}</h4>
                        <p className="text-[10px] text-slate-500">{bill.term} • {bill.session}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                        bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        bill.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {bill.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans uppercase">Total Billed</span>
                        <span className="font-bold text-slate-800">₦{bill.totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans uppercase">Balance Due</span>
                        <span className={`font-bold ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₦{outstanding.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentLedger(bill)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition text-center cursor-pointer"
                      >
                        Open Ledger Card
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyDiscount(bill.id, 10, 'Sibling')}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        title="Apply 10% Sibling Rebate"
                      >
                        10% Rebate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧾 TAB 2: PAYMENT VERIFICATION & RECEIPT DESK */}
      {/* ========================================================================= */}
      {activeTab === 'payment_verification' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Multi-Channel Payment Verification & Thermal Receipt Desk
                </h2>
                <p className="text-xs text-slate-400">
                  Captures and verifies incoming bank transfers, teller deposits, POS receipts, and generates official thermal receipts with QR verification codes. All verified payments automatically trigger a real-time refresh of the Debtor Risk Heatmap.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickPaymentModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record & Verify Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('debtors_clearance')}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>View Debtor Heatmap</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Student Candidate</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Bank Ref</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {verificationQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-indigo-600">{item.receiptNo}</td>
                      <td className="p-3 font-sans font-bold text-slate-800">
                        {item.studentName}
                        <span className="block text-[9px] text-slate-400 font-mono">{item.regNumber}</span>
                      </td>
                      <td className="p-3">{item.channel}</td>
                      <td className="p-3 text-slate-500">{item.ref}</td>
                      <td className="p-3 font-black text-slate-900">₦{item.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                          item.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          item.status === 'Flagged' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {item.status !== 'Verified' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyReceipt(item.id, 'Verified')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Verify & Issue Thermal Receipt
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReceiptModalEntry(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                        >
                          View Thermal Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ TAB 3: OUTSTANDING DEBTORS & CLEARANCE MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'debtors_clearance' && (
        <div className="space-y-6">
          {/* Main Container */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Header with Quick Action Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider">
                    Revenue Planning & Bursary Clearance
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider">
                    Interactive Heatmap
                  </span>

                  {/* Auto-Refresh Hook Status Indicator */}
                  <div className={`px-2.5 py-0.5 rounded border text-[9.5px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                    isRefreshing 
                      ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <Zap className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-white' : 'text-emerald-600'}`} />
                    <span>Payment Sync Hook Active</span>
                    <span className="opacity-75">({lastRefreshedAt.toLocaleTimeString()})</span>
                  </div>
                </div>

                <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center gap-2 mt-1.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Debtor Risk Heatmap & Aged Clearance Schedule
                </h2>
                <p className="text-xs text-slate-500 max-w-3xl">
                  Multi-dimensional aged debtor matrix categorizing tuition arrears across 30, 60, and 90+ day exposure windows for proactive financial recovery, revenue planning, and automated CBT exam locking. Auto-refreshes dynamically whenever a payment is verified in the Payment Desk.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={forceRefreshHeatmap}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Manually trigger Heatmap re-evaluation"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>Sync Heatmap</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDebtorCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="Export Heatmap Matrix and Outstanding Debtors list to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Debtor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="Open simplified white-background printable report for paper records"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Printable View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('payment_verification')}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Payment Verification Desk</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toast.success('📱 Bulk 90+ Day Warnings and Exam Access Freeze Notices dispatched to high-risk parent accounts!');
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch 90+ Day Warnings</span>
                </button>
              </div>
            </div>

            {/* Real-time Payment Event Notification Banner */}
            {lastPaymentEvent && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 border border-emerald-300/60 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-900 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black uppercase text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                        Hook Auto-Refreshed
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {lastPaymentEvent.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      New payment verified: credited <strong className="text-emerald-700 font-mono font-black">₦{lastPaymentEvent.amount.toLocaleString()}</strong> to <strong className="text-slate-900">{lastPaymentEvent.studentName}</strong>'s tuition ledger.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-1 bg-white text-emerald-800 border border-emerald-200 text-[9.5px] font-mono font-bold rounded-lg shadow-2xs block">
                    Heatmap Rev #{refreshCount}
                  </span>
                </div>
              </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Capital at Risk</span>
                <div className="text-xl font-black text-slate-900 font-mono">₦{agingTotals.grandTotal.toLocaleString()}</div>
                <span className="text-[10px] text-slate-500 font-medium block"> Across {agingTotals.debtorCount} overdue accounts</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-mono">30-Day Grace Arrears</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[9px] font-bold font-mono">Low Risk</span>
                </div>
                <div className="text-xl font-black text-amber-900 font-mono">₦{agingTotals.total30.toLocaleString()}</div>
                <span className="text-[10px] text-amber-700 font-medium block">{agingTotals.count30} student accounts (0-30 days)</span>
              </div>

              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider font-mono">60-Day Elevated Risk</span>
                  <span className="px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded text-[9px] font-bold font-mono">Moderate</span>
                </div>
                <div className="text-xl font-black text-orange-950 font-mono">₦{agingTotals.total60.toLocaleString()}</div>
                <span className="text-[10px] text-orange-800 font-medium block">{agingTotals.count60} student accounts (31-60 days)</span>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-mono">90+ Day Critical Default</span>
                  <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded text-[9px] font-bold font-mono">Critical</span>
                </div>
                <div className="text-xl font-black text-rose-700 font-mono">₦{agingTotals.total90.toLocaleString()}</div>
                <span className="text-[10px] text-rose-600 font-medium block">{agingTotals.count90} student accounts (Exam Lock Imminent)</span>
              </div>
            </div>

            {/* Debtor Risk Heatmap Matrix Grid */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 shadow-inner">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Debtor Risk Heatmap Matrix (Aged Breakdown by Cohort)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Click any cell in the heatmap matrix below to filter debtor clearance accounts by cohort and aging window.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportDebtorCSV}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-xs"
                    title="Export current filtered debtor list and heatmap matrix data to CSV file for external accounting reconciliation"
                  >
                    <Download className="w-3 h-3 text-emerald-100" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-xs"
                    title="Open simplified white-background printable report preview"
                  >
                    <Printer className="w-3 h-3 text-indigo-100" />
                    <span>Printable View</span>
                  </button>
                  {(selectedCohortFilter !== 'ALL' || debtorAgingFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCohortFilter('ALL');
                        setDebtorAgingFilter('ALL');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                    >
                      <X className="w-3 h-3 text-rose-400" />
                      <span>Clear Filter ({selectedCohortFilter} / {debtorAgingFilter})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Critical Debt Threshold Configuration Bar */}
              <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Critical Debt Alert Threshold
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[9.5px] font-mono font-bold">
                      Target limit: ≥ {criticalThresholdPct}% of total exposure
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    Set custom threshold percentage. Cell buckets holding <span className="text-rose-300 font-bold">≥ {criticalThresholdPct}%</span> of total school arrears trigger an emergency red alert visual shift on the heatmap.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    {[10, 15, 20, 25, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleThresholdChange(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                          criticalThresholdPct === preset
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>

                  {/* Number Input Box */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
                    <span className="text-[10px] text-slate-400 font-mono">Limit:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={criticalThresholdPct}
                      onChange={(e) => handleThresholdChange(parseFloat(e.target.value) || 1)}
                      className="w-10 bg-transparent font-mono font-black text-xs text-rose-400 outline-none text-center"
                    />
                    <span className="text-xs font-mono text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Threshold Breach Visual Alert Summary Banner */}
              {totalBreachesCount > 0 ? (
                <div className="bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border-2 border-rose-500/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-100 shadow-md animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                      🚨
                    </div>
                    <div>
                      <div className="font-mono font-black uppercase text-[10.5px] text-rose-300 tracking-wider">
                        Critical Debt Alert Triggered
                      </div>
                      <p className="text-[11px] text-slate-200">
                        <strong className="text-rose-400 font-bold">{totalBreachesCount} cohort bucket(s)</strong> exceed the configured <strong className="text-white">{criticalThresholdPct}%</strong> threshold of total school arrears (₦{agingTotals.grandTotal.toLocaleString()}).
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-600 text-white border border-rose-400 text-[10px] font-mono font-black uppercase rounded-lg shrink-0 shadow-sm">
                    Red Alert Shift Active
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">
                    All cohort buckets are within safe operational parameters (No cell exceeds the <strong className="text-white">{criticalThresholdPct}%</strong> critical threshold).
                  </span>
                </div>
              )}

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="p-2.5 w-1/4">Class Cohort</th>
                      <th className="p-2.5 text-center w-1/4">
                        <span className="text-amber-400">0 - 30 Days</span>
                        <span className="block text-[8.5px] text-slate-500 font-normal">30-Day Grace</span>
                      </th>
                      <th className="p-2.5 text-center w-1/4">
                        <span className="text-orange-400">31 - 60 Days</span>
                        <span className="block text-[8.5px] text-slate-500 font-normal">Elevated Risk</span>
                      </th>
                      <th className="p-2.5 text-center w-1/4">
                        <span className="text-rose-400">61 - 90+ Days</span>
                        <span className="block text-[8.5px] text-slate-500 font-normal">Critical Default</span>
                      </th>
                      <th className="p-2.5 text-right w-1/6 font-bold text-slate-300">Cohort Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-mono">
                    {heatmapMatrix.map((row) => {
                      const grandTotal = agingTotals.grandTotal || 1;
                      const pct30 = (row[30].debt / grandTotal) * 100;
                      const pct60 = (row[60].debt / grandTotal) * 100;
                      const pct90 = (row[90].debt / grandTotal) * 100;

                      const isBreach30 = row[30].debt > 0 && pct30 >= criticalThresholdPct;
                      const isBreach60 = row[60].debt > 0 && pct60 >= criticalThresholdPct;
                      const isBreach90 = row[90].debt > 0 && pct90 >= criticalThresholdPct;

                      return (
                        <tr key={row.cohort} className="hover:bg-slate-800/50 transition">
                          <td className="p-2.5 font-bold text-slate-200 font-sans">
                            {row.cohort}
                          </td>

                          {/* 30 Days Cell */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleHeatmapCellClick(row.cohort, '30_DAYS')}
                              className={`w-full p-2.5 rounded-lg border text-center transition cursor-pointer relative ${
                                isBreach30
                                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black border-red-400 ring-2 ring-red-400/90 shadow-lg animate-pulse'
                                  : row[30].debt > 0
                                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-200'
                                  : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:bg-slate-800'
                              } ${selectedCohortFilter === row.cohort && debtorAgingFilter === '30_DAYS' ? 'ring-2 ring-amber-400 font-bold' : ''}`}
                            >
                              {isBreach30 && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-red-900 border border-red-400 text-white text-[8px] font-black rounded uppercase tracking-wider shadow-sm">
                                  🚨 {pct30.toFixed(0)}% CRITICAL
                                </span>
                              )}
                              <div className="font-bold text-xs">₦{row[30].debt.toLocaleString()}</div>
                              <div className="text-[9px] opacity-90">{row[30].count} Student{row[30].count !== 1 ? 's' : ''}</div>
                            </button>
                          </td>

                          {/* 60 Days Cell */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleHeatmapCellClick(row.cohort, '60_DAYS')}
                              className={`w-full p-2.5 rounded-lg border text-center transition cursor-pointer relative ${
                                isBreach60
                                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black border-red-400 ring-2 ring-red-400/90 shadow-lg animate-pulse'
                                  : row[60].debt > 0
                                  ? 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30 text-orange-200'
                                  : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:bg-slate-800'
                              } ${selectedCohortFilter === row.cohort && debtorAgingFilter === '60_DAYS' ? 'ring-2 ring-orange-400 font-bold' : ''}`}
                            >
                              {isBreach60 && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-red-900 border border-red-400 text-white text-[8px] font-black rounded uppercase tracking-wider shadow-sm">
                                  🚨 {pct60.toFixed(0)}% CRITICAL
                                </span>
                              )}
                              <div className="font-bold text-xs">₦{row[60].debt.toLocaleString()}</div>
                              <div className="text-[9px] opacity-90">{row[60].count} Student{row[60].count !== 1 ? 's' : ''}</div>
                            </button>
                          </td>

                          {/* 90+ Days Cell */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleHeatmapCellClick(row.cohort, '90_DAYS_PLUS')}
                              className={`w-full p-2.5 rounded-lg border text-center transition cursor-pointer relative ${
                                isBreach90
                                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black border-red-400 ring-2 ring-red-400/90 shadow-lg animate-pulse'
                                  : row[90].debt > 0
                                  ? 'bg-rose-600/30 border-rose-500/50 hover:bg-rose-600/40 text-rose-200 font-bold shadow-sm'
                                  : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:bg-slate-800'
                              } ${selectedCohortFilter === row.cohort && debtorAgingFilter === '90_DAYS_PLUS' ? 'ring-2 ring-rose-400 font-bold' : ''}`}
                            >
                              {isBreach90 && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-red-900 border border-red-400 text-white text-[8px] font-black rounded uppercase tracking-wider shadow-sm">
                                  🚨 {pct90.toFixed(0)}% CRITICAL
                                </span>
                              )}
                              <div className="font-bold text-xs">₦{row[90].debt.toLocaleString()}</div>
                              <div className="text-[9px] opacity-90">{row[90].count} Student{row[90].count !== 1 ? 's' : ''}</div>
                            </button>
                          </td>

                          <td className="p-2.5 text-right font-black text-slate-200 font-mono">
                            ₦{row.totalCohortDebt.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recharts Analytics Charts Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Stacked Bar Chart */}
              <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Aged Debt Risk Exposure by Class Cohort
                    </h3>
                    <p className="text-[10px] text-slate-400">Comparative revenue breakdown across 30, 60, and 90+ day overdue brackets</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortBarChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <XAxis dataKey="cohort" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Overdue Debt']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="30 Days (Grace)" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="60 Days (Elevated)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="90+ Days (Critical)" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Distribution Chart */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Risk Category Proportion
                  </h3>
                  <p className="text-[10px] text-slate-400">Distribution of overall overdue tuition capital</p>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskPieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {riskPieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Capital']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  {riskPieChartData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        <span className="font-sans font-medium text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">₦{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtered Debtor Accounts & Clearance Control List */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Outstanding Accounts & Automated Clearance Controls
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing {filteredDebtors.length} debtor account{filteredDebtors.length !== 1 ? 's' : ''} based on active filters
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDebtorAgingFilter('ALL')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        debtorAgingFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All Ages
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtorAgingFilter('30_DAYS')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        debtorAgingFilter === '30_DAYS' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtorAgingFilter('60_DAYS')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        debtorAgingFilter === '60_DAYS' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-800 hover:bg-orange-100'
                      }`}
                    >
                      60 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtorAgingFilter('90_DAYS_PLUS')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        debtorAgingFilter === '90_DAYS_PLUS' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      90+ Days
                    </button>
                  </div>

                  {/* Cohort Selector Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedCohortFilter}
                      onChange={(e) => setSelectedCohortFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">All Class Cohorts</option>
                      {COHORTS_LIST.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary Quick Export CSV & Printable View Buttons */}
                  <button
                    type="button"
                    onClick={handleExportDebtorCSV}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Export Debtor List & Heatmap to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Open simplified white-background printable report preview"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span>Printable View</span>
                  </button>
                </div>
              </div>

              {/* Debtors Grid & Bursary Policy Side Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  {filteredDebtors.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">No Outstanding Debtors in Selected Category</h4>
                      <p className="text-xs text-slate-500">All student accounts in this cohort and aging bracket are fully cleared!</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDebtorAgingFilter('ALL');
                          setSelectedCohortFilter('ALL');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    filteredDebtors.map((debtor) => (
                      <div
                        key={debtor.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition ${
                          debtor.agingBracket === '90_DAYS_PLUS'
                            ? 'border-rose-300 bg-rose-50/40'
                            : debtor.agingBracket === '60_DAYS'
                            ? 'border-orange-300 bg-orange-50/30'
                            : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-xs uppercase font-sans">{debtor.studentName}</h4>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[9px] font-bold">
                              {debtor.cohort}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Invoice: {debtor.invoiceNumber} • {debtor.term}</p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              debtor.agingBracket === '90_DAYS_PLUS'
                                ? 'text-rose-800 bg-rose-100 border-rose-300'
                                : debtor.agingBracket === '60_DAYS'
                                ? 'text-orange-800 bg-orange-100 border-orange-300'
                                : 'text-amber-800 bg-amber-100 border-amber-300'
                            }`}>
                              {debtor.daysOverdue} Days Overdue ({debtor.agingBracket === '90_DAYS_PLUS' ? 'Critical' : debtor.agingBracket === '60_DAYS' ? 'Elevated' : 'Grace Period'})
                            </span>

                            <span className="text-[9px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-rose-600" />
                              <span>CBT Engine Access Freeze</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right space-y-1.5 w-full sm:w-auto">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono uppercase">Outstanding Balance</span>
                            <span className="font-black text-rose-600 text-sm font-mono block">₦{debtor.debt.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-end flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDebtorDrawer(debtor)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                              title="Inspect detailed charges vs payment history breakdown drawer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Breakdown Drawer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDebtReminder(debtor.studentName, debtor.debt)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 transition shadow-sm"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Dispatch Reminder</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentLedger(debtor)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition"
                            >
                              Ledger Card
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bursary Policy Side Panel */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-md flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Bursary Clearance & Risk Policy
                    </h3>
                    <div className="text-xs text-slate-300 space-y-3 leading-relaxed font-sans">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-400 block font-mono">100% Fee Settlement</span>
                        <p className="text-[11px] text-slate-300">Grants full access to online CBT examinations, terminal report card downloads, and transcript generation.</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-400 block font-mono">30-Day Grace Window</span>
                        <p className="text-[11px] text-slate-300">Allows classroom CBT exercises while parent receives automated weekly SMS billing reminders.</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-orange-400 block font-mono">60-Day Elevated Risk</span>
                        <p className="text-[11px] text-slate-300">Withholds final terminal PDF report card downloads until bursary reconciliation is complete.</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-rose-400 block font-mono">90+ Day Critical Default</span>
                        <p className="text-[11px] text-slate-300">Triggers automated CBT test engine lock on student portal until cleared by school administrator.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Clearance Engine v2.4</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💸 TAB 4: INSTITUTIONAL EXPENSES & ACCOUNTS PAYABLE */}
      {/* ========================================================================= */}
      {activeTab === 'expenses_payable' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Institutional Expenses & Vendor Accounts Payable
                </h2>
                <p className="text-xs text-slate-400">
                  Operational expenditure tracking (generator fueling, CBT server maintenance, office supplies) and vendor payable voucher workflows.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense Voucher</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-3">Vendor / Recipient</th>
                    <th className="p-3">Service Description</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Payable Amount</th>
                    <th className="p-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {vendorPayables.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-sans font-bold text-slate-800">{v.vendor}</td>
                      <td className="p-3 text-slate-600">{v.service}</td>
                      <td className="p-3 text-slate-500">{v.dueDate}</td>
                      <td className="p-3 font-black text-rose-600">₦{v.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                          v.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          v.status === 'APPROVED_PAYABLE' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 5: STAFF PAYROLL & SALARY REMUNERATION */}
      {/* ========================================================================= */}
      {activeTab === 'staff_payroll' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Staff Payroll & Monthly Remuneration Desk
                </h2>
                <p className="text-xs text-slate-400">
                  Manages monthly staff salaries, extra lesson stipends, late penalty deductions, tax withholdings, and downloadable paystubs.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportStaffPayrollCSV}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                  title="Export currently filtered staff payment data to CSV for payroll reporting"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLLER */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Filter by staff name, designation, or staff ID..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
                {staffSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStaffSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                Showing <span className="text-indigo-600 font-black">{filteredStaffPayrollList.length}</span> of {staffPayrollList.length} staff records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-3">Staff ID</th>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Stipends</th>
                    <th className="p-3">Deductions / Tax</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3 text-right">Paystub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {filteredStaffPayrollList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600 text-sm">No staff payment records match your search filter</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting the staff name or ID query above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaffPayrollList.map((staff) => {
                      const net = staff.baseSalary + staff.stipends - staff.deductions - staff.tax;
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-slate-500 font-mono text-[11px] font-bold">{staff.id}</td>
                          <td className="p-3 font-sans font-bold text-slate-800">{staff.name}</td>
                          <td className="p-3 text-slate-500 font-sans">{staff.role}</td>
                          <td className="p-3">₦{staff.baseSalary.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600">+₦{staff.stipends.toLocaleString()}</td>
                          <td className="p-3 text-rose-600">-₦{(staff.deductions + staff.tax).toLocaleString()}</td>
                          <td className="p-3 font-black text-indigo-900">₦{net.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPaystubStaff({ ...staff, net })}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded text-[10.5px] font-bold cursor-pointer transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 ml-auto"
                              title="Generate PDF payslip preview and adjust output layout"
                            >
                              <FileText className="w-3 h-3 text-indigo-600" />
                              <span>Generate Payslip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 6: FINANCIAL STATEMENTS & AUDIT VAULT */}
      {/* ========================================================================= */}
      {activeTab === 'statements_audit' && (
        <div className="space-y-6 font-sans">
          
          {/* INTERACTIVE TERM FILTER CONTROLLER */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl shadow-md shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-400 tracking-wider">
                    ACADEMIC SESSION TERM SCOPE FILTER
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{activeStatementData.termLabel}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Select term scope to dynamically recalculate income, cash flows, budget variances, and institutional balance sheet totals.
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setStatementTermFilter('CURRENT');
                  toast.info('📊 Financial Statements switched to Current Term (Term 3, 2025/2026)');
                }}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  statementTermFilter === 'CURRENT'
                    ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Current Term (Term 3)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatementTermFilter('PREVIOUS');
                  toast.info('📊 Financial Statements switched to Previous Term (Term 2, 2025/2026)');
                }}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  statementTermFilter === 'PREVIOUS'
                    ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Previous Term (Term 2)</span>
              </button>
            </div>
          </div>

          {/* HEADER & ACTION BAR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white rounded-xl shadow-md">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block font-mono">
                    GOVERNANCE & AUDIT REPORTING TIER
                  </span>
                  <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">
                    INSTITUTIONAL FINANCIAL STATEMENTS & AUDIT VAULT
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive multi-term income statements, direct cash flow analysis, and departmental budget variance schedules for board audit review.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBoardPDFReport}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Generate and download a formatted, professional multi-page financial PDF report suitable for school board presentations"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Generate PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAuditVaultCSV}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Export raw multi-section audit statements to CSV"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Audit CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuditExportModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
                  title="Open official board printable financial report pack"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print View</span>
                </button>
              </div>
            </div>

            {/* QUICK STATS CARDS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-emerald-800 font-bold uppercase">
                  <span>Gross Verified Revenue</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-base font-black text-slate-900">₦{activeStatementData.grossInflow.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-700 font-sans font-medium">{activeStatementData.shortTermLabel} Collections</div>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-rose-800 font-bold uppercase">
                  <span>Operational Outflows</span>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-base font-black text-slate-900">₦{activeStatementData.totalOutflow.toLocaleString()}</div>
                <div className="text-[10px] text-rose-700 font-sans font-medium">Payroll & departmental outlays</div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-indigo-800 font-bold uppercase">
                  <span>Net Operating Surplus</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-base font-black text-indigo-900">₦{activeStatementData.netSurplus.toLocaleString()}</div>
                <div className="text-[10px] text-indigo-700 font-sans font-medium">Term operating surplus margin</div>
              </div>

              <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-100 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-cyan-800 font-bold uppercase">
                  <span>Reconciled Cash Reserves</span>
                  <Landmark className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className="text-base font-black text-slate-900">₦{activeStatementData.bankCashReserves.toLocaleString()}</div>
                <div className="text-[10px] text-cyan-700 font-sans font-medium">CBN verified bank balances</div>
              </div>
            </div>
          </div>

          {/* 1. INTERACTIVE RECHARTS MULTI-TERM TREND VS EXPENDITURE CATEGORY PIE CHART */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider block">
                  FINANCIAL VISUALIZATION & AUDIT ENGINE
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  {financialAuditChartView === 'multi_term' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      REVENUE VS. EXPENDITURE & PAYROLL TRENDS (PAST 6 TERMS)
                    </>
                  ) : (
                    <>
                      <PieChartIcon className="w-4 h-4 text-indigo-600" />
                      INSTITUTIONAL EXPENDITURE BREAKDOWN BY CATEGORY
                    </>
                  )}
                </h3>
              </div>

              {/* CHART VIEW TOGGLER */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFinancialAuditChartView('multi_term')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financialAuditChartView === 'multi_term'
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Multi-Term Trend Bar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialAuditChartView('expenditure_pie')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financialAuditChartView === 'expenditure_pie'
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span>Expenditure Category Pie</span>
                  </button>
                </div>
              </div>
            </div>

            {financialAuditChartView === 'multi_term' ? (
              <div className="w-full h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={multiTermAuditData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="term" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
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
                    <Bar dataKey="inflow" name="Gross Inflows (Tuition & Fees)" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="outflow" name="Total Operational Outflows" fill="#e11d48" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="payroll" name="Staff Payroll Outlay" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                <div className="md:col-span-5 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallExpenditureCategoryData.items}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={4}
                      >
                        {overallExpenditureCategoryData.items.map((entry, index) => (
                          <Cell key={`gen-exp-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Expenditure Outlay']}
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
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2 flex justify-between items-center">
                    <span>Comprehensive Category Breakdown</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      Total Outlay: ₦{overallExpenditureCategoryData.sumOutlay.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 font-sans">
                    {overallExpenditureCategoryData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs space-x-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">{item.category}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">{item.desc}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className="font-bold text-slate-900 block text-[11px]">₦{item.amount.toLocaleString()}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
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

          {/* 2. CASH FLOW STATEMENT & DEPARTMENTAL BUDGET VARIANCE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CASH FLOW STATEMENT (DIRECT METHOD) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider block">
                    STATEMENT OF CASH FLOWS
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    CASH FLOW STATEMENT (DIRECT METHOD)
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-lg">
                  IAS-7 Compliant
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Operating Activities */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-slate-900 uppercase font-sans text-[11px] block border-b border-slate-200 pb-1">
                    1. Cash Flows from Operating Activities
                  </span>
                  <div className="flex justify-between text-slate-700">
                    <span>Tuition Collections & Fees Credited:</span>
                    <span className="font-bold text-emerald-600">+₦{metrics.totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>CBT Platform & Co-curricular Levies:</span>
                    <span className="font-bold text-emerald-600">+₦5,100,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Staff Payroll & Benefits Disbursed:</span>
                    <span className="font-bold text-rose-600">-₦{Math.round(metrics.totalOutflows * 0.56).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Campus Operating & Maintenance Expenses:</span>
                    <span className="font-bold text-rose-600">-₦{Math.round(metrics.totalOutflows * 0.44).toLocaleString()}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-indigo-900">
                    <span>Net Cash Provided by Operating Activities:</span>
                    <span>₦{cashFlowData.operatingNet.toLocaleString()}</span>
                  </div>
                </div>

                {/* Investing Activities */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-slate-900 uppercase font-sans text-[11px] block border-b border-slate-200 pb-1">
                    2. Cash Flows from Investing Activities
                  </span>
                  <div className="flex justify-between text-slate-700">
                    <span>Procurement of CBT Laptops & Server Upgrades:</span>
                    <span className="font-bold text-rose-600">-₦2,500,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Science Laboratory & Library Acquisitions:</span>
                    <span className="font-bold text-rose-600">-₦1,200,000</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Net Cash Used in Investing Activities:</span>
                    <span className="text-rose-600">-₦3,700,000</span>
                  </div>
                </div>

                {/* Financing Activities */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-slate-900 uppercase font-sans text-[11px] block border-b border-slate-200 pb-1">
                    3. Cash Flows from Financing Activities
                  </span>
                  <div className="flex justify-between text-slate-700">
                    <span>Education Development Board Grant:</span>
                    <span className="font-bold text-emerald-600">+₦5,000,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Commercial Loan Facility Servicing:</span>
                    <span className="font-bold text-rose-600">-₦1,500,000</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Net Cash Provided by Financing Activities:</span>
                    <span className="text-emerald-600">+₦3,500,000</span>
                  </div>
                </div>

                {/* Cash Reconciliation Summary */}
                <div className="p-3.5 bg-indigo-950 text-white rounded-xl space-y-1.5 border border-indigo-800">
                  <div className="flex justify-between">
                    <span>Net Increase in Cash & Cash Equivalents:</span>
                    <span className="font-bold text-emerald-400">₦{cashFlowData.netChangeCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cash Balance at Beginning of Term:</span>
                    <span>₦{cashFlowData.beginningCash.toLocaleString()}</span>
                  </div>
                  <div className="pt-1.5 border-t border-indigo-800 flex justify-between font-black text-sm text-emerald-400">
                    <span>CLOSING RECONCILED CASH RESERVES:</span>
                    <span>₦{cashFlowData.endingCash.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* DEPARTMENTAL BUDGET ALLOCATION & VARIANCE SCHEDULE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider block">
                    BUDGET VS. ACTUAL EXPENSE SCHEDULE
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    DEPARTMENTAL COST ALLOCATION & VARIANCE
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded-lg border border-emerald-200">
                  80.4% Budget Absorbed
                </span>
              </div>

              <div className="space-y-4">
                {departmentalBudgetData.map((dept) => {
                  const DeptIcon = dept.icon;
                  const variance = dept.budgeted - dept.actual;
                  const isUnderBudget = variance >= 0;
                  const usedPct = Math.min(100, Math.round((dept.actual / dept.budgeted) * 100));

                  return (
                    <div key={dept.department} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 font-sans font-bold text-slate-900">
                          <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200">
                            <DeptIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span>{dept.department}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUnderBudget ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isUnderBudget ? `Under Budget by ₦${variance.toLocaleString()}` : `Overrun by ₦${Math.abs(variance).toLocaleString()}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                        <div className="text-slate-600">
                          Budgeted: <strong className="text-slate-900">₦{dept.budgeted.toLocaleString()}</strong>
                        </div>
                        <div className="text-right text-slate-600">
                          Actual: <strong className="text-slate-900">₦{dept.actual.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9.5px] text-slate-400 font-bold">
                          <span>Utilization: {usedPct}%</span>
                          <span>Cap: 100%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              usedPct > 100 ? 'bg-rose-500' : usedPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, usedPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 3. BALANCE SHEET STATEMENT STATEMENT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono tracking-wider block">
                  INSTITUTIONAL BALANCE SHEET STATEMENT ({activeStatementData.shortTermLabel})
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  STATEMENT OF FINANCIAL POSITION (ASSETS VS LIABILITIES)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-lg border border-emerald-200">
                Balanced Position Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              
              {/* ASSETS */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-black text-slate-900 uppercase font-sans border-b border-slate-200 pb-2 text-xs flex justify-between">
                  <span>Current & Non-Current Assets</span>
                  <span className="text-emerald-700">NGN (₦)</span>
                </h4>
                <div className="flex justify-between text-slate-700">
                  <span>CBN Reconciled Bank Cash Reserves:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.bankCashReserves.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Accounts Receivable (Parent Outstanding Debts):</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.accountsReceivable.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>CBT Computer Hardware & ICT Infrastructure:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.cbtFixedAssets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Campus Land & Academic Buildings:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.campusLand.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-emerald-700">
                  <span>TOTAL INSTITUTIONAL ASSETS:</span>
                  <span>₦{activeStatementData.totalAssets.toLocaleString()}</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-black text-slate-900 uppercase font-sans border-b border-slate-200 pb-2 text-xs flex justify-between">
                  <span>Liabilities & School Board Reserves</span>
                  <span className="text-indigo-700">NGN (₦)</span>
                </h4>
                <div className="flex justify-between text-slate-700">
                  <span>Pending Accounts Payable & Vendor Invoices:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.accountsPayable.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Staff Salary Provision & Pension Accruals:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.salaryAccruals.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Long-term Educational Facility Loan:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.facilityLoan.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Accumulated Board Equity & Retained Funds:</span>
                  <span className="font-bold text-slate-900">₦{activeStatementData.boardEquity.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-indigo-900">
                  <span>TOTAL LIABILITIES & EQUITY:</span>
                  <span>₦{activeStatementData.totalLiabilitiesAndEquity.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏦 TAB 7: BANK STATEMENT RECONCILIATION & UNASSIGNED FEEDS */}
      {/* ========================================================================= */}
      {activeTab === 'bank_reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Bank Statement Reconciliation & Unassigned Feeds
                </h2>
                <p className="text-xs text-slate-400">
                  Matches incoming direct bank transfers against student registration numbers to resolve "mystery" parent transfers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-3">Date / Time</th>
                    <th className="p-3">Bank Ref</th>
                    <th className="p-3">Transfer Narrative</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Match Student Reg</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {unassignedBankFeeds.map((feed) => (
                    <tr key={feed.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-slate-500">{feed.date}</td>
                      <td className="p-3 text-indigo-600 font-bold">{feed.bankRef}</td>
                      <td className="p-3 font-sans font-bold text-slate-800">{feed.narrative}</td>
                      <td className="p-3 font-black text-emerald-600">₦{feed.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="e.g. CS/2025/001"
                          defaultValue={feed.matchedReg}
                          id={`reg-${feed.id}`}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono uppercase text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`reg-${feed.id}`) as HTMLInputElement;
                            handleAssignBankMatch(feed.id, input?.value || '');
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Credit Student Account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INDIVIDUAL STUDENT LEDGER CARD */}
      {selectedStudentLedger && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedStudentLedger(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono font-bold text-indigo-600">INVOICE #{selectedStudentLedger.invoiceNumber}</span>
              <h3 className="text-base font-black uppercase text-slate-900">{selectedStudentLedger.studentName}</h3>
              <p className="text-xs text-slate-500">Lifetime Student Bursary Ledger Card</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Tuition Billed:</span>
                <span className="font-bold text-slate-900">₦{selectedStudentLedger.tuitionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CBT Platform Levy:</span>
                <span className="font-bold text-slate-900">₦{selectedStudentLedger.cbtProcessingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Registration Fee:</span>
                <span className="font-bold text-slate-900">₦{selectedStudentLedger.admissionFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                <span>Total Account Balance:</span>
                <span className="text-rose-600">₦{(selectedStudentLedger.totalAmount - selectedStudentLedger.amountPaid).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerNativePrint}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Print Student Ledger Statement
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL RECEIPT SLIP VISUALIZER */}
      {receiptModalEntry && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs text-slate-800">
            <button
              type="button"
              onClick={() => setReceiptModalEntry(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-sm uppercase text-slate-900 font-sans">CORNER STREAMS SCHOOLS</h3>
              <p className="text-[10px] text-slate-500">OFFICIAL BURSARY RECEIPT</p>
              <p className="text-[9px] text-indigo-600 font-bold">RECEIPT #{receiptModalEntry.receiptNo || receiptModalEntry.id}</p>
            </div>

            <div className="space-y-1.5 py-2">
              <div className="flex justify-between">
                <span className="text-slate-500">STUDENT:</span>
                <strong className="text-slate-900">{receiptModalEntry.studentName || receiptModalEntry.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CHANNEL:</span>
                <span>{receiptModalEntry.channel || 'CBN Bank Transfer'}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-black">
                <span>AMOUNT PAID:</span>
                <span className="text-emerald-600">₦{(receiptModalEntry.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-400 space-y-1">
              <p>QR VERIFICATION HASH: {receiptModalEntry.qrCode || 'QR-CS-991204'}</p>
              <p>STATUS: ✅ VERIFIED & RECONCILED</p>
            </div>

            <button
              type="button"
              onClick={triggerNativePrint}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Print Thermal Receipt
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYSTUB VISUALIZER & LAYOUT DESIGNER */}
      {selectedPaystubStaff && (
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
                  onClick={() => setIsPaystubLayoutSettingsOpen(!isPaystubLayoutSettingsOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isPaystubLayoutSettingsOpen
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{isPaystubLayoutSettingsOpen ? 'Hide Layout Controls' : 'Adjust Layout'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPaystubCSV(selectedPaystubStaff)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Export raw payslip itemized figures to CSV"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={triggerNativePrint}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaystubStaff(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MAIN MODAL GRID CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* SIDEBAR: LAYOUT ADJUSTMENT CONTROLS */}
              {isPaystubLayoutSettingsOpen && (
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
                      onClick={handleResetPaystubLayout}
                      className="text-[10.5px] font-mono text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      title="Reset layout settings"
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
                        onClick={() => setPaystubLayoutFormat('A4_STANDARD')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          paystubLayoutFormat === 'A4_STANDARD'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Standard A4
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaystubLayoutFormat('COMPACT_SLIP')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          paystubLayoutFormat === 'COMPACT_SLIP'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Thermal Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaystubLayoutFormat('EXECUTIVE_DETAILED')}
                        className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                          paystubLayoutFormat === 'EXECUTIVE_DETAILED'
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
                        onClick={() => setPaystubThemeColor('INDIGO')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          paystubThemeColor === 'INDIGO'
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-800 to-indigo-600" />
                        <span>Indigo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaystubThemeColor('EMERALD')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          paystubThemeColor === 'EMERALD'
                            ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600" />
                        <span>Emerald</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaystubThemeColor('SLATE')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          paystubThemeColor === 'SLATE'
                            ? 'border-slate-700 ring-2 ring-slate-500/30 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-800" />
                        <span>Slate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaystubThemeColor('MONOCHROME')}
                        className={`p-2 rounded-xl text-[10px] font-bold text-center transition cursor-pointer border flex flex-col items-center gap-1 ${
                          paystubThemeColor === 'MONOCHROME'
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
                          checked={paystubShowLogo}
                          onChange={(e) => setPaystubShowLogo(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Bank Details & Ref</span>
                        <input
                          type="checkbox"
                          checked={paystubShowBankDetails}
                          onChange={(e) => setPaystubShowBankDetails(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Tax & Deduction Breakdown</span>
                        <input
                          type="checkbox"
                          checked={paystubShowTaxBreakdown}
                          onChange={(e) => setPaystubShowTaxBreakdown(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Bursar Signature Block</span>
                        <input
                          type="checkbox"
                          checked={paystubShowSignatures}
                          onChange={(e) => setPaystubShowSignatures(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">QR Audit Verification Hash</span>
                        <input
                          type="checkbox"
                          checked={paystubShowQrCode}
                          onChange={(e) => setPaystubShowQrCode(e.target.checked)}
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
                      value={paystubCustomMemo}
                      onChange={(e) => setPaystubCustomMemo(e.target.value)}
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
                        onClick={() => setPaystubFontScale('COMPACT')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          paystubFontScale === 'COMPACT'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Compact (85%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaystubFontScale('STANDARD')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          paystubFontScale === 'STANDARD'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Normal (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaystubFontScale('SPACIOUS')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer border ${
                          paystubFontScale === 'SPACIOUS'
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
                    onClick={() => handleCopyPaystubLink(selectedPaystubStaff)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Copy Verification Share Link</span>
                  </button>

                </div>
              )}

              {/* LIVE PRINTABLE PDF PAYSLIP PAPER PREVIEW SHEET */}
              <div className={`bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden font-sans space-y-6 print:shadow-none print:border-none print:m-0 print:p-0 transition-all ${
                isPaystubLayoutSettingsOpen ? 'lg:col-span-8' : 'lg:col-span-12'
              } ${
                paystubFontScale === 'COMPACT' ? 'p-4 sm:p-5 text-[11px]' : paystubFontScale === 'SPACIOUS' ? 'p-8 sm:p-10 text-sm' : 'p-6 sm:p-8 text-xs'
              }`}>
                
                {/* HEADER BANNER WITH DYNAMIC ACCENT COLOR */}
                <div className={`p-4 sm:p-6 rounded-xl text-white flex justify-between items-start gap-4 ${
                  paystubThemeColor === 'EMERALD'
                    ? 'bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950'
                    : paystubThemeColor === 'SLATE'
                    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'
                    : paystubThemeColor === 'MONOCHROME'
                    ? 'bg-black text-white'
                    : 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-emerald-950'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {paystubShowLogo && (
                        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center font-black font-mono text-emerald-400 text-xs shrink-0">
                          CS
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 block">
                          CORNER STREAMS EDUCATIONAL INFRASTRUCTURE
                        </span>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                          {paystubLayoutFormat === 'COMPACT_SLIP' ? 'PAYROLL DISBURSEMENT SLIP' : 'OFFICIAL STAFF PAYSLIP & SALARY VOUCHER'}
                        </h2>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono">
                      Institutional Bursary & Remuneration Directorate • Month: <strong className="text-white">July 2026</strong>
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-200 shrink-0">
                    <div className="font-bold">Doc Ref: <span className="text-emerald-400 font-mono">PAY-{selectedPaystubStaff.id || 'STF-01'}</span></div>
                    <div>Issued: {new Date().toLocaleDateString()}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-bold rounded">
                      CBN SETTLED
                    </span>
                  </div>
                </div>

                {/* STAFF METADATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Staff Candidate</span>
                    <span className="font-black text-slate-900 block">{selectedPaystubStaff.name}</span>
                    <span className="text-slate-500 font-sans text-[11px]">{selectedPaystubStaff.role}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Staff ID</span>
                    <span className="font-bold text-slate-900">{selectedPaystubStaff.id || 'STF-2026'}</span>
                    <span className="text-slate-500 block text-[11px]">Academic Faculty</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Pay Cycle Month</span>
                    <span className="font-bold text-indigo-900">July 2026</span>
                    <span className="text-slate-500 block text-[11px]">Term 3 Session</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold font-sans">Status</span>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      PAID & SETTLED
                    </span>
                  </div>
                </div>

                {/* ITEMIZED SALARY BREAKDOWN TABLE */}
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 font-sans">
                      Itemized Remuneration & Deductions Schedule
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Amounts in NGN</span>
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
                        <td className="p-2.5 border border-slate-200 text-right font-bold">₦{selectedPaystubStaff.baseSalary.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 border border-slate-200 font-sans font-bold text-emerald-700">Special Duty & Extra Lesson Stipends</td>
                        <td className="p-2.5 border border-slate-200 text-emerald-600">Performance Stipend</td>
                        <td className="p-2.5 border border-slate-200 text-right font-bold text-emerald-700">+₦{selectedPaystubStaff.stipends.toLocaleString()}</td>
                      </tr>
                      {paystubShowTaxBreakdown && (
                        <tr>
                          <td className="p-2.5 border border-slate-200 font-sans font-bold text-rose-700">Late Deductions & Tax Withholdings</td>
                          <td className="p-2.5 border border-slate-200 text-rose-600">Withholdings</td>
                          <td className="p-2.5 border border-slate-200 text-right font-bold text-rose-700">-₦{(selectedPaystubStaff.deductions + selectedPaystubStaff.tax).toLocaleString()}</td>
                        </tr>
                      )}
                      {paystubLayoutFormat === 'EXECUTIVE_DETAILED' && (
                        <>
                          <tr className="bg-slate-50/60">
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-600 font-sans pl-6">• Employer Pension Match (8%)</td>
                            <td className="p-2 border border-slate-200 text-[11px] text-slate-500">Institutional Contribution</td>
                            <td className="p-2 border border-slate-200 text-right text-[11px] text-slate-600">₦{(selectedPaystubStaff.baseSalary * 0.08).toLocaleString()}</td>
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
                        <td className="p-3 text-right text-emerald-400 font-mono text-base">₦{selectedPaystubStaff.net.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* BANK DETAILS & SETTLEMENT VERIFICATION */}
                {paystubShowBankDetails && (
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
                      <div>Bank: <strong className="text-slate-900">First Bank Nigeria</strong></div>
                      <div>Account Number: <strong className="text-slate-900">3029104821</strong></div>
                      <div>Settlement Date: <strong className="text-slate-900">2026-07-28</strong></div>
                    </div>
                    <div className="text-[10.5px] text-emerald-800 border-t border-emerald-200/80 pt-1">
                      Transaction Reference: <span className="font-bold text-slate-900">CBN-PAY-2026-9021</span> • Gateway: CBN NIBSS Direct Transfer
                    </div>
                  </div>
                )}

                {/* CUSTOM MEMO / REMARKS BLOCK */}
                {paystubCustomMemo && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Bursary Official Remarks:</span>
                    <p className="text-slate-800 mt-0.5 italic">{paystubCustomMemo}</p>
                  </div>
                )}

                {/* SIGNATURE & AUDIT STAMP BLOCK */}
                {paystubShowSignatures && (
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

                    {paystubShowQrCode && (
                      <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="w-10 h-10 bg-slate-900 text-emerald-400 font-mono font-black text-[9px] flex items-center justify-center rounded border border-slate-800 text-center">
                          QR-CS-2026
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Audit Hash: QR-{selectedPaystubStaff.id || 'STF'}-2026</span>
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

      {/* MODAL 4: RECORD NEW TRANSACTION MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase text-slate-900">Log New Bursary Transaction</h3>

            <form onSubmit={handleRecordTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Flow Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('INFLOW')}
                    className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      newType === 'INFLOW' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Inflow (Fee Collection)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('OUTFLOW')}
                    className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      newType === 'OUTFLOW' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Outflow (Expense Voucher)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Science Lab Supplies Payment"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payer / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Parent Name or Vendor Name"
                  value={newPayerPayee}
                  onChange={(e) => setNewPayerPayee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Record & Reconcile Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD & VERIFY INSTANT PAYMENT (AUTO-REFRESHES DEBTOR HEATMAP) */}
      {isQuickPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsQuickPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-mono font-black uppercase tracking-wider">
                ⚡ Auto-Sync Active
              </span>
              <h3 className="text-base font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Verify & Record Student Payment
              </h3>
              <p className="text-[11px] text-slate-450">
                Submitting this verified deposit automatically credits the student's bursary ledger and auto-refreshes the Debtor Risk Heatmap instantly.
              </p>
            </div>

            <form onSubmit={handleRecordQuickVerifiedPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Student Candidate Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chinedu Okeke or Jeremiah David Benson"
                  value={quickStudentName}
                  onChange={(e) => setQuickStudentName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Registration / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. CS/2025/001 or INV/2024/SS2/043"
                  value={quickRegNumber}
                  onChange={(e) => setQuickRegNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Channel</label>
                  <select
                    value={quickChannel}
                    onChange={(e) => setQuickChannel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-sans font-medium text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="POS Terminal">POS Terminal</option>
                    <option value="Teller Deposit">Teller Deposit</option>
                    <option value="Mobile App">Mobile Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Amount (₦) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 75000"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold outline-none focus:border-emerald-500 text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bank Reference / NIBSS Code</label>
                <input
                  type="text"
                  placeholder="e.g. NIBSS-902810"
                  value={quickRef}
                  onChange={(e) => setQuickRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-50/60 border border-emerald-150 p-2.5 rounded-xl text-[10px] text-emerald-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Triggers <strong className="font-bold">useDebtorRiskHeatmap</strong> hook to auto-update aged risk matrix on submission.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition"
              >
                Verify & Refresh Heatmap Matrix
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 SLIDE-OVER SIDE DRAWER: DEBTOR OUTSTANDING CHARGES VS PAYMENT HISTORY  */}
      {/* ========================================================================= */}
      {isDebtorDrawerOpen && drawerSelectedDebtor && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Dark Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsDebtorDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
              
              {/* Drawer Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-start gap-4 shadow-md shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider">
                      Debtor Risk Breakdown Drawer
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9.5px] font-mono font-bold">
                      {drawerSelectedDebtor.cohort}
                    </span>
                  </div>
                  <h2 className="text-lg font-black uppercase text-white font-sans tracking-tight">
                    {drawerSelectedDebtor.studentName}
                  </h2>
                  <p className="text-xs text-slate-300 font-mono">
                    Reg / Invoice: <strong className="text-emerald-400">{drawerSelectedDebtor.invoiceNumber}</strong> • {drawerSelectedDebtor.term}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDebtorDrawerOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer shrink-0"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* If multiple debtors exist in this Heatmap cell, render student selector tabs */}
              {drawerCellInfo && (
                (() => {
                  const cellDebtors = enrichedDebtors.filter(
                    d => d.cohort === drawerCellInfo.cohort && d.agingBracket === drawerCellInfo.agingBracket
                  );
                  if (cellDebtors.length > 1) {
                    return (
                      <div className="bg-slate-100 border-b border-slate-200 p-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 font-mono">
                          Debtors in {drawerCellInfo.cohort} ({drawerCellInfo.agingBracket.replace('_', ' ')}):
                        </span>
                        {cellDebtors.map(cd => (
                          <button
                            key={cd.id}
                            type="button"
                            onClick={() => setDrawerSelectedDebtor(cd)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans transition shrink-0 cursor-pointer ${
                              drawerSelectedDebtor.id === cd.id
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {cd.studentName}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Drawer Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-800">
                
                {/* Risk & Clearance Summary Banner */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    drawerSelectedDebtor.agingBracket === '90_DAYS_PLUS'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : drawerSelectedDebtor.agingBracket === '60_DAYS'
                      ? 'bg-orange-50 border-orange-200 text-orange-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider opacity-75">Aging Exposure</span>
                    <div className="font-black text-xs font-sans uppercase mt-1">
                      {drawerSelectedDebtor.daysOverdue} Days Overdue ({drawerSelectedDebtor.agingBracket === '90_DAYS_PLUS' ? 'Critical Default' : drawerSelectedDebtor.agingBracket === '60_DAYS' ? 'Elevated Risk' : 'Grace Period'})
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-500">CBT Portal Status</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-rose-700">
                      <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{drawerSelectedDebtor.agingBracket === '30_DAYS' ? 'Grace Active' : 'CBT Engine Frozen'}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: ITEMIZED OUTSTANDING LEDGER CHARGES */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      Itemized Ledger Charges
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Ledger ID #{drawerSelectedDebtor.id}
                    </span>
                  </div>

                  {/* Charges Table */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-600">Tuition & Academic Fee</span>
                      <span className="font-bold text-slate-900">₦{drawerSelectedDebtor.tuitionFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-600">Admission / Registration Levy</span>
                      <span className="font-bold text-slate-900">₦{(drawerSelectedDebtor.admissionFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-600">CBT Platform Infrastructure Levy</span>
                      <span className="font-bold text-slate-900">₦{(drawerSelectedDebtor.cbtProcessingFee || 0).toLocaleString()}</span>
                    </div>
                    {drawerSelectedDebtor.miscellaneousFee > 0 && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600">Miscellaneous / Co-curricular Levy</span>
                        <span className="font-bold text-slate-900">₦{drawerSelectedDebtor.miscellaneousFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Ledger Balance Summary */}
                  <div className="pt-3 border-t border-slate-300 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500 font-bold uppercase">Total Billed Ledger Amount:</span>
                      <span className="font-bold text-slate-900">₦{drawerSelectedDebtor.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-emerald-700 font-bold uppercase">Total Payments Credited:</span>
                      <span className="font-bold text-emerald-600">-₦{drawerSelectedDebtor.amountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-slate-200">
                      <span className="font-black text-rose-700 uppercase">Net Outstanding Debt Arrears:</span>
                      <span className="font-black text-rose-600 text-base">₦{drawerSelectedDebtor.debt.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Visual Payment Progress Bar */}
                  {(() => {
                    const paidPct = drawerSelectedDebtor.totalAmount > 0
                      ? Math.min(100, Math.round((drawerSelectedDebtor.amountPaid / drawerSelectedDebtor.totalAmount) * 100))
                      : 0;
                    const debtPct = 100 - paidPct;

                    return (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                          <span className="text-emerald-700">Settled: {paidPct}%</span>
                          <span className="text-rose-600">Outstanding: {debtPct}%</span>
                        </div>
                        <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${paidPct}%` }}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all duration-500"
                            style={{ width: `${debtPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* SECTION 2: VERIFIED PAYMENT HISTORY TIMELINE */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-emerald-600" />
                      Payment History & Verified Credit Timeline
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {drawerSelectedDebtor.history?.length || (drawerSelectedDebtor.amountPaid > 0 ? 1 : 0)} Record(s)
                    </span>
                  </div>

                  {(!drawerSelectedDebtor.history || drawerSelectedDebtor.history.length === 0) ? (
                    drawerSelectedDebtor.amountPaid > 0 ? (
                      <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-emerald-800 font-bold">
                          <span>CBN Direct Deposit Verified</span>
                          <span className="text-emerald-600 font-black">+₦{drawerSelectedDebtor.amountPaid.toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-sans">
                          Partial tuition fee deposit received and credited to bursary ledger.
                        </p>
                        <div className="text-[9.5px] text-slate-400 pt-1 flex justify-between">
                          <span>Ref: TXN-AUTO-CREDIT</span>
                          <span>2026-02-10</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No payments recorded yet for this invoice. Account balance is 100% outstanding.
                      </div>
                    )
                  ) : (
                    <div className="space-y-2.5">
                      {drawerSelectedDebtor.history.map((tx, idx) => (
                        <div
                          key={tx.transactionId || idx}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 font-mono text-xs hover:border-indigo-300 transition"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-700 text-[11px]">{tx.transactionId}</span>
                            <span className="font-black text-emerald-600 text-xs">+₦{tx.amount.toLocaleString()}</span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-sans font-medium">
                            {tx.description}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                            <span>Method: <strong className="text-slate-600">{tx.paymentMethod}</strong></span>
                            <span>{tx.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickStudentName(drawerSelectedDebtor.studentName);
                      setQuickRegNumber(drawerSelectedDebtor.invoiceNumber);
                      setIsDebtorDrawerOpen(false);
                      setIsQuickPaymentModalOpen(true);
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenQuickMessageModal(drawerSelectedDebtor)}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
                    title="Send templated payment reminder Web APP SMS via linked Corner Stream school account"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Quick Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendDebtReminder(drawerSelectedDebtor.studentName, drawerSelectedDebtor.debt)}
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Email</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={triggerNativePrint}
                  className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Student Ledger Card</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖨️ PRINTABLE VIEW MODAL: SIMPLIFIED WHITE-BACKGROUND PAPER RECORD REPORT  */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 lg:p-8 flex justify-center items-start print:p-0 print:bg-white print:static print:inset-auto print:block">
          
          {/* Floating Screen Controls Bar (Hidden during actual paper print) */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-slate-900/95 border border-slate-700 text-white p-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                const next = !isFitToPage;
                setIsFitToPage(next);
                toast.info(next ? "A4 Fit-to-Page enabled." : "Expanded view enabled.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isFitToPage
                  ? "bg-indigo-950 text-emerald-400 border-emerald-500/60"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Toggle single-page A4 print constraints"
            >
              <span className={`w-2 h-2 rounded-full ${isFitToPage ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
              <span>{isFitToPage ? "A4 Fit" : "Expanded"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportDebtorCSV}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              title="Export Heatmap and filtered debtor list to CSV for external accounting reconciliation"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={triggerNativePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              title="Trigger System Print Dialog (Ctrl + P)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              title="Close Printable View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Document Sheet */}
          <div
            id="printable-financial-statement"
            className={`bg-white text-slate-900 w-full max-w-4xl p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-300 my-4 print:my-0 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full font-sans space-y-6 ${
              isFitToPage ? "fit-to-page-a4" : ""
            }`}
          >
            {/* Official School Header */}
            <div className="print-school-header border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
              <div className="print-school-header-brand flex items-center gap-3">
                <div className="print-school-logo-badge w-14 h-14 bg-indigo-950 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-500 shrink-0">
                  CS
                </div>
                <div>
                  <span className="print-school-subtitle text-[9px] font-mono font-black uppercase tracking-widest text-emerald-600 block">
                    Corner Streams Educational Infrastructure
                  </span>
                  <h1 className="print-school-title text-lg sm:text-xl font-display font-black text-slate-900 uppercase tracking-tight leading-none mt-0.5">
                    Corner Streams International Academy
                  </h1>
                  <p className="print-school-motto text-[10px] italic text-slate-600 font-medium mt-0.5">
                    Motto: &quot;Excellence &amp; Honor in Character and Service&quot;
                  </p>
                  <p className="print-school-meta text-[9px] text-slate-500 font-mono">
                    12 Corner Streams Boulevard, Victoria Island, Lagos &bull; Bursary Debtors &amp; Aged Risk Clearance Matrix
                  </p>
                </div>
              </div>

              <div className="print-school-seal-badge text-right text-xs font-mono space-y-1 text-slate-600 shrink-0">
                <div className="badge-title inline-block px-2.5 py-1 bg-indigo-950 text-white font-bold text-[10px] uppercase rounded">
                  CONFIDENTIAL BURSARY RECORD
                </div>
                <div className="badge-meta">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className="badge-meta text-[10px] text-slate-500">Ref: CS-BUR-HEATMAP-2026</div>
              </div>
            </div>

            {/* Active Filter Criteria Summary Strip */}
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs font-mono flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-slate-500 font-bold uppercase">Cohort Filter: </span>
                <span className="font-bold text-slate-900">{selectedCohortFilter}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase">Aging Bracket: </span>
                <span className="font-bold text-slate-900">{debtorAgingFilter.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase">Critical Alert Threshold: </span>
                <span className="font-bold text-slate-900">≥ {criticalThresholdPct}% Exposure</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase">Debtor Count: </span>
                <span className="font-bold text-rose-700">{(filteredDebtors.length > 0 ? filteredDebtors : enrichedDebtors).length} Student(s)</span>
              </div>
            </div>

            {/* SECTION 1: SIMPLIFIED WHITE-BACKGROUND HEATMAP MATRIX TABLE */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 font-mono">
                <span>1. DEBTOR RISK HEATMAP MATRIX (AGED COHORT BREAKDOWN)</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-900 text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                      <th className="border border-slate-900 p-2 uppercase">Class Cohort</th>
                      <th className="border border-slate-900 p-2 text-center uppercase">
                        0 - 30 Days (Grace)
                      </th>
                      <th className="border border-slate-900 p-2 text-center uppercase">
                        31 - 60 Days (Elevated)
                      </th>
                      <th className="border border-slate-900 p-2 text-center uppercase">
                        61 - 90+ Days (Critical)
                      </th>
                      <th className="border border-slate-900 p-2 text-right uppercase bg-slate-300 font-black">
                        Cohort Arrears Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapMatrix.map((row) => (
                      <tr key={row.cohort} className="border-b border-slate-400">
                        <td className="border border-slate-900 p-2 font-bold font-sans text-slate-900 bg-slate-50">
                          {row.cohort}
                        </td>

                        {/* 30 Days */}
                        <td className="border border-slate-900 p-2 text-center bg-white">
                          <div className="font-bold text-slate-900">₦{row[30].debt.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{row[30].count} student(s)</div>
                        </td>

                        {/* 60 Days */}
                        <td className="border border-slate-900 p-2 text-center bg-white">
                          <div className="font-bold text-slate-900">₦{row[60].debt.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{row[60].count} student(s)</div>
                        </td>

                        {/* 90+ Days */}
                        <td className="border border-slate-900 p-2 text-center bg-white">
                          <div className="font-bold text-slate-900">₦{row[90].debt.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{row[90].count} student(s)</div>
                        </td>

                        {/* Cohort Total */}
                        <td className="border border-slate-900 p-2 text-right font-black text-slate-900 bg-slate-100">
                          ₦{row.totalCohortDebt.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-300 font-black text-slate-900 border-t-2 border-slate-900">
                      <td className="border border-slate-900 p-2.5 uppercase font-sans">SUMMARY GRAND TOTALS</td>
                      <td className="border border-slate-900 p-2.5 text-center">
                        <div>₦{agingTotals.total30.toLocaleString()}</div>
                        <div className="text-[10px] font-normal text-slate-700">{agingTotals.count30} std</div>
                      </td>
                      <td className="border border-slate-900 p-2.5 text-center">
                        <div>₦{agingTotals.total60.toLocaleString()}</div>
                        <div className="text-[10px] font-normal text-slate-700">{agingTotals.count60} std</div>
                      </td>
                      <td className="border border-slate-900 p-2.5 text-center">
                        <div>₦{agingTotals.total90.toLocaleString()}</div>
                        <div className="text-[10px] font-normal text-slate-700">{agingTotals.count90} std</div>
                      </td>
                      <td className="border border-slate-900 p-2.5 text-right text-sm">
                        ₦{agingTotals.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* SECTION 2: SUMMARY FINANCIAL ARREARS HIGHLIGHTS */}
            <div className="grid grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 border border-slate-900 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">0-30 Days Arrears</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">₦{agingTotals.total30.toLocaleString()}</span>
              </div>
              <div className="p-3 border border-slate-900 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">31-60 Days Arrears</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">₦{agingTotals.total60.toLocaleString()}</span>
              </div>
              <div className="p-3 border border-slate-900 bg-slate-900 text-white rounded">
                <span className="text-[10px] text-slate-300 uppercase font-bold block">61-90+ Days Arrears</span>
                <span className="font-black text-white text-sm block mt-0.5">₦{agingTotals.total90.toLocaleString()}</span>
              </div>
              <div className="p-3 border-2 border-slate-900 bg-slate-200 rounded text-right">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Grand Total Exposure</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">₦{agingTotals.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* SECTION 3: ITEMIZED AGED DEBTOR CLEARANCE SCHEDULE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider font-mono">
                  2. ITEMIZED DEBTOR CLEARANCE LEDGER ACCOUNTS ({(filteredDebtors.length > 0 ? filteredDebtors : enrichedDebtors).length} RECORDS)
                </h2>
              </div>

              <table className="w-full text-left border-collapse border border-slate-900 text-xs font-mono">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                    <th className="border border-slate-900 p-2 text-center w-8">#</th>
                    <th className="border border-slate-900 p-2 uppercase">Student Candidate</th>
                    <th className="border border-slate-900 p-2 uppercase">Cohort</th>
                    <th className="border border-slate-900 p-2 uppercase">Invoice / Reg #</th>
                    <th className="border border-slate-900 p-2 uppercase text-center">Days Overdue</th>
                    <th className="border border-slate-900 p-2 uppercase text-right">Billed Amount</th>
                    <th className="border border-slate-900 p-2 uppercase text-right">Amount Paid</th>
                    <th className="border border-slate-900 p-2 uppercase text-right font-black">Outstanding Arrears</th>
                    <th className="border border-slate-900 p-2 uppercase text-center">CBT Lock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredDebtors.length > 0 ? filteredDebtors : enrichedDebtors).map((d, index) => (
                    <tr key={d.id} className="border-b border-slate-300 hover:bg-slate-50">
                      <td className="border border-slate-900 p-1.5 text-center text-slate-500 font-mono text-[11px]">{index + 1}</td>
                      <td className="border border-slate-900 p-1.5 font-bold font-sans text-slate-900">{d.studentName}</td>
                      <td className="border border-slate-900 p-1.5">{d.cohort}</td>
                      <td className="border border-slate-900 p-1.5 text-[11px]">{d.invoiceNumber}</td>
                      <td className="border border-slate-900 p-1.5 text-center font-bold">{d.daysOverdue} d</td>
                      <td className="border border-slate-900 p-1.5 text-right">₦{d.totalAmount.toLocaleString()}</td>
                      <td className="border border-slate-900 p-1.5 text-right text-emerald-800">₦{d.amountPaid.toLocaleString()}</td>
                      <td className="border border-slate-900 p-1.5 text-right font-black text-slate-900">₦{d.debt.toLocaleString()}</td>
                      <td className="border border-slate-900 p-1.5 text-center text-[10px] font-bold">
                        {d.agingBracket === '90_DAYS_PLUS' ? 'FROZEN (90+ Days)' : d.agingBracket === '60_DAYS' ? 'LOCKED (60 Days)' : 'ACTIVE (Grace)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 4: OFFICIAL AUTHORIZATION & BURSARY SIGN-OFF BLOCK */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-xs font-mono">
              <div className="space-y-8">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Prepared By</span>
                  <div className="font-bold text-slate-900 border-b border-slate-900 pb-1 mt-1">
                    {currentProfile?.fullName || 'Senior Revenue Auditor'}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Bursary Accounts & Recovery Unit</span>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Verified By (Chief Bursar)</span>
                  <div className="border-b border-slate-900 pb-1 mt-1 font-bold text-slate-400">
                    Signature & Official Stamp: _________________
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Date: ____ / ____ / 2026</span>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Board Approval / Audit Stamp</span>
                  <div className="border-b border-slate-900 pb-1 mt-1 font-bold text-slate-400">
                    Clearance Authorization: _________________
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Ref: CORNER-STREAMS-PAPER-AUDIT</span>
                </div>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="text-center text-[10px] text-slate-500 font-mono border-t border-slate-200 pt-3">
              © 2026 Corner Streams. All rights reserved. Confidential Financial Paper Record • Generated via Bursary Ledger Stream.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 QUICK MESSAGE MODAL: TEMPLATED PAYMENT REMINDER WEB APP SMS           */}
      {/* ========================================================================= */}
      {isQuickMsgModalOpen && quickMsgDebtor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-4 flex justify-center items-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    Dispatch Quick Web APP SMS
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Linked School Account: <strong className="text-emerald-400">Corner Streams SMS Gateway</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickMsgModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleDispatchQuickSMS} className="p-5 space-y-4">
              
              {/* Recipient Details Badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">Parent / Student Candidate</span>
                  <span className="font-bold text-slate-900 text-sm block">{quickMsgDebtor.studentName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">Reg: {quickMsgDebtor.invoiceNumber} • {quickMsgDebtor.cohort}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Outstanding Arrears</span>
                  <span className="font-black text-rose-600 text-sm block">₦{quickMsgDebtor.debt.toLocaleString()}</span>
                  <span className="text-[10px] text-rose-700 font-bold block">{quickMsgDebtor.daysOverdue} Days Overdue</span>
                </div>
              </div>

              {/* Template Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono block">
                  Select Reminder Template
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectQuickTemplate('STANDARD')}
                    className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                      quickMsgTemplate === 'STANDARD'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Gentle Reminder
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectQuickTemplate('URGENT_CBT')}
                    className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                      quickMsgTemplate === 'URGENT_CBT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    CBT Clearance
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectQuickTemplate('FINAL_NOTICE')}
                    className={`p-2 rounded-xl text-[10.5px] font-bold text-center transition cursor-pointer font-sans border ${
                      quickMsgTemplate === 'FINAL_NOTICE'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Final Warning
                  </button>
                </div>
              </div>

              {/* SMS Content Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    SMS Message Content
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {quickMsgCustomText.length} Chars ({Math.ceil(quickMsgCustomText.length / 160) || 1} SMS Segment)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={quickMsgCustomText}
                  onChange={(e) => setQuickMsgCustomText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  placeholder="Type or customize reminder message..."
                  required
                />
              </div>

              {/* Gateway Channel Banner */}
              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900 font-mono">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Sender ID: <strong className="text-slate-900">CORNER-STREAMS-BURSARY</strong></span>
                </div>
                <span className="text-emerald-700 font-bold">● SMS Gateway Online</span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end items-center gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickMsgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Web APP SMS</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL INSTITUTIONAL AUDIT VAULT REPORT PACK (PRINTABLE) */}
      {isAuditExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            {/* Modal Controls Bar */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-mono font-bold uppercase text-slate-900">
                  Official Board Audit Vault Report Pack
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBoardPDFReport}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Generate and download formatted, multi-page board PDF report"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Generate Board PDF</span>
                </button>
                <button
                  type="button"
                  onClick={triggerNativePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuditExportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE LETTERHEAD REPORT CONTAINER */}
            <div className="space-y-6 text-slate-900 font-sans">
              
              {/* LETTERHEAD HEADER */}
              <div className="border-b-2 border-indigo-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-950 text-emerald-400 font-black flex items-center justify-center rounded-lg text-xs font-mono">
                      CS
                    </div>
                    <span className="text-xl font-black uppercase text-indigo-950 tracking-wider">
                      CORNER STREAMS SCHOOLS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Institutional Bursary & Financial Planning Directorate • Official Audit Vault
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
                  <div>Ref: <strong className="text-indigo-900">AUD-CS-2026-0091</strong></div>
                  <div>Period: <strong>2025/2026 Academic Session (Term 3)</strong></div>
                  <div>Generated: <strong>{new Date().toLocaleDateString()}</strong></div>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    CBN RECONCILED & VERIFIED
                  </span>
                </div>
              </div>

              {/* EXECUTIVE SUMMARY TABLE */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  1. Executive Financial Summary & Reserves
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Verified Inflows</span>
                    <div className="font-bold text-emerald-600">₦{metrics.totalCollected.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Total Outflows</span>
                    <div className="font-bold text-rose-600">₦{metrics.totalOutflows.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                    <span className="text-[10px] text-indigo-800 uppercase font-sans font-bold">Net Operating Surplus</span>
                    <div className="font-bold text-indigo-950">₦{(metrics.totalCollected - metrics.totalOutflows).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-800 uppercase font-sans font-bold">CBN Bank Reserves</span>
                    <div className="font-bold text-emerald-700">₦18,450,000</div>
                  </div>
                </div>
              </div>

              {/* MULTI-TERM COMPARATIVE SUMMARY TABLE */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Multi-Term Comparative Performance Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-200 text-left">Academic Term</th>
                        <th className="p-2 border border-slate-200 text-right">Inflows (NGN)</th>
                        <th className="p-2 border border-slate-200 text-right">Outflows (NGN)</th>
                        <th className="p-2 border border-slate-200 text-right">Staff Payroll (NGN)</th>
                        <th className="p-2 border border-slate-200 text-right">Net Surplus (NGN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {multiTermAuditData.map((row) => (
                        <tr key={row.term} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 font-sans font-bold text-slate-900">{row.term}</td>
                          <td className="p-2 border border-slate-200 text-right text-emerald-700 font-bold">₦{row.inflow.toLocaleString()}</td>
                          <td className="p-2 border border-slate-200 text-right text-rose-600">₦{row.outflow.toLocaleString()}</td>
                          <td className="p-2 border border-slate-200 text-right text-purple-700">₦{row.payroll.toLocaleString()}</td>
                          <td className="p-2 border border-slate-200 text-right font-bold text-indigo-900">₦{row.netSurplus.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DEPARTMENTAL COST ALLOCATION SUMMARY */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  3. Departmental Expense & Budget Variance Schedule
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-200 text-left">Department</th>
                        <th className="p-2 border border-slate-200 text-right">Budgeted (NGN)</th>
                        <th className="p-2 border border-slate-200 text-right">Actual Spent (NGN)</th>
                        <th className="p-2 border border-slate-200 text-right">Variance (NGN)</th>
                        <th className="p-2 border border-slate-200 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentalBudgetData.map((d) => {
                        const variance = d.budgeted - d.actual;
                        return (
                          <tr key={d.department} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-200 font-sans font-medium text-slate-900">{d.department}</td>
                            <td className="p-2 border border-slate-200 text-right">₦{d.budgeted.toLocaleString()}</td>
                            <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">₦{d.actual.toLocaleString()}</td>
                            <td className={`p-2 border border-slate-200 text-right font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              ₦{variance.toLocaleString()}
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span className={`px-2 py-0.5 text-[9.5px] font-bold rounded ${variance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {variance >= 0 ? 'Within Budget' : 'Overrun'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUDITOR APPROVAL SIGNATURE BLOCK */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs font-mono">
                <div className="space-y-8">
                  <div className="h-10 border-b border-slate-400 flex items-end justify-center">
                    <span className="font-serif italic text-slate-600 text-sm">A. O. Babatunde</span>
                  </div>
                  <div className="text-slate-700 font-sans">
                    <strong className="block text-slate-900 text-xs font-bold uppercase">Bursar / Financial Officer</strong>
                    <span>Corner Streams Schools</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-10 border-b border-slate-400 flex items-end justify-center">
                    <span className="font-serif italic text-slate-600 text-sm">Dr. E. K. Okonjo</span>
                  </div>
                  <div className="text-slate-700 font-sans">
                    <strong className="block text-slate-900 text-xs font-bold uppercase">External Board Auditor</strong>
                    <span>Chartered Accountants NG</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-10 border-b border-slate-400 flex items-end justify-center">
                    <span className="font-serif italic text-slate-600 text-sm">Prof. M. A. Adeleke</span>
                  </div>
                  <div className="text-slate-700 font-sans">
                    <strong className="block text-slate-900 text-xs font-bold uppercase">Chairman, Governing Council</strong>
                    <span>Corner Streams Educational Board</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
