import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BillingRecord, UserProfile } from '../types';

interface PDFGeneratorOptions {
  title?: string;
  termScope?: string;
  preparedBy?: string;
  currentProfile?: UserProfile;
  filteredBills: BillingRecord[];
  departmentalData?: Array<{
    department: string;
    budgeted: number;
    actual: number;
  }>;
  statementData?: {
    grossInflow: number;
    totalOutflow: number;
    netSurplus: number;
    bankCashReserves: number;
  };
}

/**
 * Generates a multi-page, formatted, professional Financial PDF Report suitable for school board presentations.
 */
export function generateFinancialPDF({
  title = 'INSTITUTIONAL FINANCIAL STATEMENTS & BOARD AUDIT REPORT',
  termScope = '2025/2026 Academic Session (Term 3)',
  preparedBy = 'Senior Bursar / Financial Officer',
  currentProfile,
  filteredBills,
  departmentalData,
  statementData
}: PDFGeneratorOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor: [number, number, number] = [30, 27, 75]; // Indigo-950
  const accentColor: [number, number, number] = [5, 150, 105];  // Emerald-600
  const textColor: [number, number, number] = [15, 23, 42];     // Slate-900
  const subTextColor: [number, number, number] = [71, 85, 105];  // Slate-600

  // -------------------------------------------------------------
  // PAGE 1: HEADER BANNER
  // -------------------------------------------------------------
  // Top Banner Rectangle
  doc.setFillColor(...primaryColor);
  doc.rect(margin, 12, contentWidth, 32, 'F');

  // School Accent Strip
  doc.setFillColor(...accentColor);
  doc.rect(margin, 12, 4, 32, 'F');

  // Title Text inside Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CORNER STREAMS SCHOOLS', margin + 8, 21);

  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // Emerald-400
  doc.text(title.toUpperCase(), margin + 8, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Scope: ${termScope}  |  Ref: CS-BUR-BOARD-${new Date().getFullYear()}`, margin + 8, 33);

  // Date and Prepared By (Right Aligned inside Banner)
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dateStr = `Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const authorStr = `By: ${currentProfile?.fullName || preparedBy}`;
  doc.text(dateStr, pageWidth - margin - 6, 23, { align: 'right' });
  doc.text(authorStr, pageWidth - margin - 6, 29, { align: 'right' });

  // -------------------------------------------------------------
  // EXECUTIVE SUMMARY METRICS CARDS
  // -------------------------------------------------------------
  const totalBilled = filteredBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPaid = filteredBills.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
  const totalDebt = Math.max(0, totalBilled - totalPaid);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  let currentY = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text('EXECUTIVE FINANCIAL SUMMARY', margin, currentY);

  currentY += 4;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 18;

  const cards = [
    { label: 'GROSS BILLED', value: `N${totalBilled.toLocaleString()}`, color: [30, 27, 75] as [number, number, number] },
    { label: 'COLLECTED REVENUE', value: `N${totalPaid.toLocaleString()}`, color: [5, 150, 105] as [number, number, number] },
    { label: 'OUTSTANDING DEBT', value: `N${totalDebt.toLocaleString()}`, color: [225, 29, 72] as [number, number, number] },
    { label: 'COLLECTION RATE', value: `${collectionRate}%`, color: [124, 58, 237] as [number, number, number] }
  ];

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3);
    
    // Fill Card Background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Accent Left Border Line
    doc.setFillColor(...card.color);
    doc.rect(x, currentY, 1.5, cardHeight, 'F');

    // Card Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...subTextColor);
    doc.text(card.label, x + 4, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + 4, currentY + 13);
  });

  currentY += cardHeight + 8;

  // -------------------------------------------------------------
  // SECTION 1: FILTERED BILLING LEDGER TABLE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text('1. FILTERED STUDENT BILLING & REVENUE LEDGER SCHEDULE', margin, currentY);

  currentY += 4;

  const billingTableData = filteredBills.map((bill, index) => [
    (index + 1).toString(),
    bill.studentName || 'Student',
    bill.invoiceNumber || 'INV-00',
    bill.term || 'Term 3',
    `N${(bill.totalAmount || 0).toLocaleString()}`,
    `N${(bill.amountPaid || 0).toLocaleString()}`,
    `N${Math.max(0, (bill.totalAmount || 0) - (bill.amountPaid || 0)).toLocaleString()}`,
    bill.status === 'PAID' ? 'SETTLED' : bill.status === 'PARTIALLY_PAID' ? 'PARTIAL' : 'PENDING'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Student Candidate', 'Invoice Ref', 'Term', 'Billed (N)', 'Paid (N)', 'Arrears (N)', 'Status']],
    body: billingTableData,
    foot: [[
      'TOTAL',
      `${filteredBills.length} Student Record(s)`,
      '',
      '',
      `N${totalBilled.toLocaleString()}`,
      `N${totalPaid.toLocaleString()}`,
      `N${totalDebt.toLocaleString()}`,
      `${collectionRate}% Paid`
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 18 },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 16, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Keep track of Y position across pages
      currentY = data.cursor ? data.cursor.y : currentY;
    }
  });

  // Get current Y after autoTable completes
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a page break before Section 2
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // -------------------------------------------------------------
  // SECTION 2: DEPARTMENTAL BUDGET ALLOCATION & VARIANCE SCHEDULE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text('2. DEPARTMENTAL EXPENDITURE & BUDGET VARIANCE SCHEDULE', margin, currentY);

  currentY += 4;

  const depts = departmentalData || [
    { department: 'Staff Payroll & Remuneration', budgeted: 18000000, actual: 17850000 },
    { department: 'Utilities, Generator Fuel & Power', budgeted: 3500000, actual: 3820000 },
    { department: 'Repairs, Campus Security & Facilities', budgeted: 2800000, actual: 2410000 },
    { department: 'ICT, CBT Server & Network Infrastructure', budgeted: 2500000, actual: 2150000 },
    { department: 'Stationery, Academic & Science Labs', budgeted: 2000000, actual: 1890000 },
    { department: 'Co-Curricular, Sports & Board Events', budgeted: 1500000, actual: 1220000 }
  ];

  const totalDeptBudget = depts.reduce((sum, d) => sum + d.budgeted, 0);
  const totalDeptActual = depts.reduce((sum, d) => sum + d.actual, 0);
  const totalDeptVariance = totalDeptBudget - totalDeptActual;

  const deptRows = depts.map((d) => {
    const variance = d.budgeted - d.actual;
    const isUnder = variance >= 0;
    const utilization = d.budgeted > 0 ? Math.round((d.actual / d.budgeted) * 100) : 0;
    return [
      d.department,
      `N${d.budgeted.toLocaleString()}`,
      `N${d.actual.toLocaleString()}`,
      `${isUnder ? '+' : ''}N${variance.toLocaleString()}`,
      `${utilization}%`,
      isUnder ? 'WITHIN BUDGET' : 'OVERRUN'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Department / Operational Sector', 'Budgeted (N)', 'Actual Spent (N)', 'Variance (N)', 'Util %', 'Audit Status']],
    body: deptRows,
    foot: [[
      'SUMMARY GRAND TOTALS',
      `N${totalDeptBudget.toLocaleString()}`,
      `N${totalDeptActual.toLocaleString()}`,
      `${totalDeptVariance >= 0 ? '+' : ''}N${totalDeptVariance.toLocaleString()}`,
      `${Math.round((totalDeptActual / totalDeptBudget) * 100)}%`,
      totalDeptVariance >= 0 ? 'FAVORABLE' : 'DEFICIT'
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check for page break
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  // -------------------------------------------------------------
  // SECTION 3: STATEMENT OF CASH FLOWS & BANK RESERVES
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text('3. STATEMENT OF CASH FLOWS & RECONCILED BANK RESERVES', margin, currentY);

  currentY += 4;

  const grossInflow = statementData?.grossInflow || totalPaid || 32500000;
  const totalOutflow = statementData?.totalOutflow || totalDeptActual || 29340000;
  const netSurplus = statementData?.netSurplus || (grossInflow - totalOutflow);
  const bankReserves = statementData?.bankCashReserves || 18450000;

  const cashFlowRows = [
    ['1. Cash Flows from Operating Activities', 'Tuition Collections & Fee Credits', `+N${grossInflow.toLocaleString()}`],
    ['', 'Staff Payroll & Operating Campus Outlays', `-N${totalOutflow.toLocaleString()}`],
    ['', 'Net Operating Surplus', `N${netSurplus.toLocaleString()}`],
    ['2. Cash Flows from Investing Activities', 'ICT Server & Science Lab Upgrades', '-N3,700,000'],
    ['3. Cash Flows from Financing Activities', 'Education Development Board Grant', '+N3,500,000'],
    ['4. Reconciled Central Bank Reserves', 'Closing Bank Balance (CBN Reconciled)', `N${bankReserves.toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Category / Section', 'Description', 'Amount (N)']],
    body: cashFlowRows,
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check for page break for Signatures Block
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // -------------------------------------------------------------
  // SECTION 4: GOVERNANCE & BOARD AUTHORIZATION SIGN-OFF
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text('4. GOVERNANCE & BOARD AUDIT AUTHORIZATION', margin, currentY);

  currentY += 12;

  const colWidth = (contentWidth - 10) / 3;

  // Signature Block 1: Bursar
  let xSign = margin;
  doc.setDrawColor(148, 163, 184);
  doc.line(xSign, currentY, xSign + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Senior Bursar / Financial Officer', xSign, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('Corner Streams Educational Directorate', xSign, currentY + 8);

  // Signature Block 2: External Auditor
  xSign = margin + colWidth + 5;
  doc.line(xSign, currentY, xSign + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text('External Chartered Auditor', xSign, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('ICAN Accredited Audit Practice', xSign, currentY + 8);

  // Signature Block 3: Governing Council Chairman
  xSign = margin + (colWidth + 5) * 2;
  doc.line(xSign, currentY, xSign + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text('Chairman, Governing Council', xSign, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('Board Authorization & Clearance', xSign, currentY + 8);

  // -------------------------------------------------------------
  // GLOBAL FOOTER ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 Corner Streams. All rights reserved. Official Computer-Generated Financial Board Report.', margin, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Save the generated PDF document
  const fileName = `CornerStreams_Financial_Report_${termScope.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}
