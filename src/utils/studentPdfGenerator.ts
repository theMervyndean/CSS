import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GradeRecord, UserProfile } from '../types';

interface StudentPDFOptions {
  student: UserProfile;
  grades: GradeRecord[];
  term?: string;
  session?: string;
  reportMode?: 'half_term' | 'full_term';
  schoolName?: string;
  schoolAddress?: string;
  schoolMotto?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  classPosition?: string;
  totalStudentsInClass?: number;
  classAveragePct?: number;
  affectiveDomain?: Record<string, number>;
  psychomotorSkills?: Record<string, number>;
  teacherRemark?: string;
  principalRemark?: string;
}

/**
 * Generates an official, beautifully structured A4 Student Terminal Result Card PDF.
 * Includes school branding header, student candidate profile block, subject CA/Exam score breakdown table,
 * grade key, affective/psychomotor ratings, and official signature sign-offs.
 */
export function generateStudentResultPDF({
  student,
  grades,
  term = '3rd Term (2025/2026 Academic Session)',
  session = '2025/2026',
  reportMode = 'full_term',
  schoolName = 'CORNER STREAMS PRIVATE SCHOOLS',
  schoolAddress = '12 Corner Streams Avenue, Victoria Island, Lagos State, Nigeria',
  schoolMotto = 'Knowledge, Integrity and Academic Excellence',
  schoolPhone = '+234 814 188 0550',
  schoolEmail = 'admin@cornerstreams.edu.ng',
  classPosition = '1st',
  totalStudentsInClass = 34,
  classAveragePct = 78.4,
  affectiveDomain = {
    Punctuality: 5,
    Neatness: 5,
    Leadership: 4,
    Honesty: 5,
    AttitudeToStudy: 4,
    Politeness: 5
  },
  psychomotorSkills = {
    Handwriting: 4,
    GamesAndSports: 5,
    DrawingAndCrafts: 4,
    PublicSpeaking: 4,
    MusicalSkills: 3
  },
  teacherRemark = 'An exceptionally brilliant and disciplined candidate with outstanding analytical skills.',
  principalRemark = 'Promoted to the next academic level with distinction. Keep up the high standard!'
}: StudentPDFOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor: [number, number, number] = [30, 27, 75];  // Indigo-950
  const accentColor: [number, number, number] = [5, 150, 105];   // Emerald-600
  const textColor: [number, number, number] = [15, 23, 42];      // Slate-900
  const subTextColor: [number, number, number] = [71, 85, 105];   // Slate-600

  // -------------------------------------------------------------
  // HEADER BANNER & BRANDING
  // -------------------------------------------------------------
  // Top Header Box
  doc.setFillColor(...primaryColor);
  doc.rect(margin, 10, contentWidth, 30, 'F');

  // Accent Left Strip
  doc.setFillColor(...accentColor);
  doc.rect(margin, 10, 4, 30, 'F');

  // School Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName.toUpperCase(), margin + 8, 18);

  // Motto & Address
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153); // Emerald-400
  doc.text(`"${schoolMotto}"`, margin + 8, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(`${schoolAddress}  |  Tel: ${schoolPhone}  |  Email: ${schoolEmail}`, margin + 8, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`OFFICIAL TERMINAL RESULT DOSSIER`, margin + 8, 34);

  // Right Side Header Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(reportMode === 'half_term' ? 'MID-TERM REPORT' : 'FULL TERM REPORT', pageWidth - margin - 4, 18, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(term, pageWidth - margin - 4, 24, { align: 'right' });

  let currentY = 44;

  // -------------------------------------------------------------
  // STUDENT CANDIDATE PROFILE CARD
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);

  // Row 1
  doc.text('CANDIDATE NAME:', margin + 4, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text((student.fullName || 'Student Candidate').toUpperCase(), margin + 30, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('ADM NO / USERNAME:', margin + 110, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(student.username || 'CS-STU-001', margin + 145, currentY + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('CLASS COHORT:', margin + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(student.gradeLevel || 'Senior Secondary 2 (SS 2A)', margin + 30, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('SCHOOL ARM:', margin + 110, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(student.arm || 'Secondary', margin + 145, currentY + 12);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('CLASS POSITION:', margin + 4, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentColor);
  doc.text(`${classPosition} out of ${totalStudentsInClass} Candidates`, margin + 30, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text('OVERALL AVERAGE:', margin + 110, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text(`${classAveragePct}%`, margin + 145, currentY + 18);

  currentY += 28;

  // -------------------------------------------------------------
  // SUBJECT ACADEMIC PERFORMANCE TABLE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text('ACADEMIC PERFORMANCE & SUBJECT SCORE BREAKDOWN', margin, currentY);

  currentY += 3;

  const totalPossible = grades.length * 100;
  const grandTotalScore = grades.reduce((sum, g) => sum + (g.totalScore || 0), 0);
  const overallAvg = grades.length > 0 ? (grandTotalScore / grades.length).toFixed(1) : '0';

  const tableHead = reportMode === 'half_term'
    ? [['#', 'Subject Title', 'CA1 (10)', 'CA2 (10)', 'Scaled CA (40)', 'Grade', 'Remarks']]
    : [['#', 'Subject Title', 'CA1 (10)', 'CA2 (10)', 'CA3 (10)', 'CA4 (10)', 'Exam (60)', 'Total (100)', 'Grade', 'Remarks']];

  const tableBody = grades.map((g, idx) => {
    if (reportMode === 'half_term') {
      const ca1 = g.scores.ca1 || 0;
      const ca2 = g.scores.ca2 || 0;
      const scaled = (ca1 + ca2) * 2;
      return [
        (idx + 1).toString(),
        g.subjectName || g.subjectCode,
        ca1.toString(),
        ca2.toString(),
        scaled.toString(),
        g.gradeLetter || 'A',
        g.remark || 'Excellent'
      ];
    } else {
      return [
        (idx + 1).toString(),
        g.subjectName || g.subjectCode,
        (g.scores.ca1 || 0).toString(),
        (g.scores.ca2 || 0).toString(),
        (g.scores.ca3 || 0).toString(),
        (g.scores.ca4 || 0).toString(),
        (g.scores.exam || 0).toString(),
        (g.totalScore || 0).toString(),
        g.gradeLetter || 'A',
        g.remark || 'Excellent'
      ];
    }
  });

  const tableFoot = reportMode === 'half_term'
    ? [['TOTAL', `${grades.length} Subjects`, '', '', `Avg: ${overallAvg}%`, '', 'OVERALL PASS']]
    : [['GRAND TOTAL', `${grades.length} Subjects Offered`, '', '', '', '', '', `${grandTotalScore} / ${totalPossible}`, `Avg: ${overallAvg}%`, 'PASSED WITH DISTINCTION']];

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 7.5
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 50 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold' },
      8: { halign: 'center', fontStyle: 'bold' },
      9: { halign: 'left' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check page height for domain ratings & remarks
  if (currentY > pageHeight - 85) {
    doc.addPage();
    currentY = 20;
  }

  // -------------------------------------------------------------
  // AFFECTIVE & PSYCHOMOTOR DOMAIN RATINGS (2 COLUMNS)
  // -------------------------------------------------------------
  const colWidth = (contentWidth - 6) / 2;

  // Affective Domain Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('AFFECTIVE DOMAIN EVALUATION (1-5)', margin + 4, currentY + 5);

  let affY = currentY + 11;
  Object.entries(affectiveDomain).forEach(([trait, score]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...subTextColor);
    doc.text(trait, margin + 4, affY);

    // Render score dots/bars
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(`${'★'.repeat(score)}${'☆'.repeat(5 - score)} (${score}/5)`, margin + colWidth - 25, affY);
    affY += 4.2;
  });

  // Psychomotor Skills Box
  const xPsych = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(xPsych, currentY, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('PSYCHOMOTOR SKILLS EVALUATION (1-5)', xPsych + 4, currentY + 5);

  let psychY = currentY + 11;
  Object.entries(psychomotorSkills).forEach(([skill, score]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...subTextColor);
    doc.text(skill, xPsych + 4, psychY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(`${'★'.repeat(score)}${'☆'.repeat(5 - score)} (${score}/5)`, xPsych + colWidth - 25, psychY);
    psychY += 4.2;
  });

  currentY += 42;

  // -------------------------------------------------------------
  // GRADE KEY / SCALE LEGEND
  // -------------------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...primaryColor);
  doc.text('GRADING SCALE KEY:', margin + 3, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...subTextColor);
  doc.text('A (75-100% Excellent)   |   B (65-74% Very Good)   |   C (50-64% Good)   |   D (45-49% Fair)   |   E (40-44% Pass)   |   F (0-39% Fail)', margin + 32, currentY + 6);

  currentY += 14;

  // Check page height for signatures
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // -------------------------------------------------------------
  // CONFIDENTIAL REMARKS & SIGNATURE APPROVAL BLOCK
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text('CLASS TEACHER & PRINCIPAL APPROVAL SIGN-OFF', margin, currentY);

  currentY += 5;

  const signWidth = (contentWidth - 6) / 2;

  // Class Teacher Comment
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY + 12, margin + signWidth - 10, currentY + 12);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text(`"${teacherRemark}"`, margin, currentY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text('Class Teacher Signature & Date', margin, currentY + 16);

  // Principal Comment
  const xPrinc = margin + signWidth + 6;
  doc.line(xPrinc, currentY + 12, xPrinc + signWidth - 10, currentY + 12);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...subTextColor);
  doc.text(`"${principalRemark}"`, xPrinc, currentY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text('Principal / Head of School Seal & Signature', xPrinc, currentY + 16);

  // -------------------------------------------------------------
  // FOOTER ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 Corner Streams. All rights reserved. Official Computer-Generated Terminal Result Document.', margin, pageHeight - 6);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save the PDF
  const sanitizedStudentName = (student.fullName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `CornerStreams_ReportCard_${sanitizedStudentName}_${student.username || 'ID'}.pdf`;
  doc.save(fileName);
}
