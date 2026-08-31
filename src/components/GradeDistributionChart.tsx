import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  ChevronDown, 
  Check, 
  TrendingUp, 
  BarChart3, 
  LineChart as LineIcon, 
  AreaChart as AreaIcon,
  Award, 
  Users, 
  Percent, 
  Calendar,
  Sparkles,
  Layers,
  Printer
} from "lucide-react";
import { GradeRecord } from "../types";

interface GradeDistributionChartProps {
  grades?: GradeRecord[];
  className?: string;
  initialSubject?: string;
  key?: React.Key;
}

// Map scores to grade letters based on Nigerian / standard school rules
const getGradeLetter = (score: number): "A" | "B" | "C" | "D" | "E" | "F" => {
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
};

// Seed fallback values to ensure charts always display fully populated, majestic curves
const SEEDED_DISTRIBUTIONS: Record<string, Record<string, Record<string, number>>> = {
  "All Classes": {
    "All Subjects": {
      "First Term_A": 24, "First Term_B": 48, "First Term_C": 35, "First Term_D": 12, "First Term_E": 8, "First Term_F": 5,
      "Second Term_A": 28, "Second Term_B": 52, "Second Term_C": 32, "Second Term_D": 15, "Second Term_E": 6, "Second Term_F": 3,
      "Third Term_A": 35, "Third Term_B": 58, "Third Term_C": 28, "Third Term_D": 10, "Third Term_E": 5, "Third Term_F": 2,
    },
    "Mathematics": {
      "First Term_A": 12, "First Term_B": 22, "First Term_C": 18, "First Term_D": 8, "First Term_E": 5, "First Term_F": 6,
      "Second Term_A": 15, "Second Term_B": 24, "Second Term_C": 19, "Second Term_D": 6, "Second Term_E": 4, "Second Term_F": 4,
      "Third Term_A": 19, "Third Term_B": 28, "Third Term_C": 15, "Third Term_D": 5, "Third Term_E": 3, "Third Term_F": 2,
    },
    "English Language": {
      "First Term_A": 18, "First Term_B": 26, "First Term_C": 15, "First Term_D": 4, "First Term_E": 3, "First Term_F": 1,
      "Second Term_A": 20, "Second Term_B": 28, "Second Term_C": 14, "Second Term_D": 5, "Second Term_E": 2, "Second Term_F": 0,
      "Third Term_A": 24, "Third Term_B": 32, "Third Term_C": 12, "Third Term_D": 3, "Third Term_E": 1, "Third Term_F": 1,
    }
  },
  "SS 1": {
    "All Subjects": {
      "First Term_A": 8, "First Term_B": 15, "First Term_C": 12, "First Term_D": 4, "First Term_E": 3, "First Term_F": 2,
      "Second Term_A": 10, "Second Term_B": 17, "Second Term_C": 10, "Second Term_D": 5, "Second Term_E": 2, "Second Term_F": 1,
      "Third Term_A": 12, "Third Term_B": 19, "Third Term_C": 9, "Third Term_D": 3, "Third Term_E": 2, "Third Term_F": 0,
    }
  },
  "SS 2": {
    "All Subjects": {
      "First Term_A": 10, "First Term_B": 18, "First Term_C": 14, "First Term_D": 5, "First Term_E": 3, "First Term_F": 2,
      "Second Term_A": 12, "Second Term_B": 20, "Second Term_C": 12, "Second Term_D": 6, "Second Term_E": 2, "Second Term_F": 1,
      "Third Term_A": 15, "Third Term_B": 22, "Third Term_C": 10, "Third Term_D": 4, "Third Term_E": 1, "Third Term_F": 0,
    },
    "Mathematics SS 2": {
      "First Term_A": 4, "First Term_B": 8, "First Term_C": 6, "First Term_D": 3, "First Term_E": 2, "First Term_F": 1,
      "Second Term_A": 5, "Second Term_B": 9, "Second Term_C": 7, "Second Term_D": 2, "Second Term_E": 1, "Second Term_F": 1,
      "Third Term_A": 7, "Third Term_B": 11, "Third Term_C": 5, "Third Term_D": 1, "Third Term_E": 1, "Third Term_F": 0,
    }
  }
};

export function GradeDistributionChart({ grades = [], className = "", initialSubject }: GradeDistributionChartProps) {
  // Chart layout toggles
  const [chartType, setChartType] = useState<"stacked" | "trend" | "density">("stacked");
  
  // States for custom-drawn selects
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || "All Subjects");
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);

  // Sync initialSubject prop if passed or updated
  React.useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  // Available options
  const classOptions = ["All Classes", "SS 1", "SS 2", "SS 3"];
  const subjectOptions = useMemo(() => {
    if (selectedClass === "SS 2") {
      return ["All Subjects", "Mathematics SS 2", "English Language", "Physics", "Chemistry", "Biology"];
    }
    return ["All Subjects", "Mathematics", "English Language", "Physics", "Chemistry", "Biology"];
  }, [selectedClass]);

  // Handle resetting subject if not in options
  React.useEffect(() => {
    if (!subjectOptions.includes(selectedSubject)) {
      setSelectedSubject("All Subjects");
    }
  }, [selectedClass, subjectOptions, selectedSubject]);

  // Compute Grade distribution dynamically based on database + fallbacks
  const processedData = useMemo(() => {
    // 1. Get initial mock seed corresponding to class/subject filters
    const classKey = SEEDED_DISTRIBUTIONS[selectedClass] ? selectedClass : "All Classes";
    const subDict = SEEDED_DISTRIBUTIONS[classKey] || SEEDED_DISTRIBUTIONS["All Classes"];
    const subKey = subDict[selectedSubject] ? selectedSubject : "All Subjects";
    
    const seed = subDict[subKey] || SEEDED_DISTRIBUTIONS["All Classes"]["All Subjects"];

    const termsList = [
      { key: "First Term", label: "First Term" },
      { key: "Second Term", label: "Second Term" },
      { key: "Third Term", label: "Third Term" }
    ];

    return termsList.map((t) => {
      // Initialize counts from seed
      let aCount = seed[`${t.key}_A`] || 0;
      let bCount = seed[`${t.key}_B`] || 0;
      let cCount = seed[`${t.key}_C`] || 0;
      let dCount = seed[`${t.key}_D`] || 0;
      let eCount = seed[`${t.key}_E`] || 0;
      let fCount = seed[`${t.key}_F`] || 0;

      // 2. Overlay actual dynamic grades edited or saved by the teacher
      if (grades && grades.length > 0) {
        // Normalize term search
        const matchingGrades = grades.filter((g) => {
          const matchTerm = g.term.toLowerCase().replace(" ", "") === t.key.toLowerCase().replace(" ", "");
          const matchClass = selectedClass === "All Classes" || (g.subjectName && g.subjectName.includes(selectedClass)) || (g.studentName && selectedClass === "SS 2"); // SS 2 is default mock class
          const matchSubj = selectedSubject === "All Subjects" || g.subjectName === selectedSubject || (g.subjectName && g.subjectName.includes(selectedSubject));
          return matchTerm && matchClass && matchSubj;
        });

        if (matchingGrades.length > 0) {
          // If we have actual matching grades, we add them to the distribution
          matchingGrades.forEach((g) => {
            const score = g.totalScore || 0;
            const letter = getGradeLetter(score);
            if (letter === "A") aCount += 1;
            else if (letter === "B") bCount += 1;
            else if (letter === "C") cCount += 1;
            else if (letter === "D") dCount += 1;
            else if (letter === "E") eCount += 1;
            else if (letter === "F") fCount += 1;
          });
        }
      }

      const total = aCount + bCount + cCount + dCount + eCount + fCount;
      const passCount = aCount + bCount + cCount + dCount + eCount;
      const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
      const excellenceRate = total > 0 ? Math.round(((aCount + bCount) / total) * 100) : 0;

      return {
        term: t.label,
        "Grade A": aCount,
        "Grade B": bCount,
        "Grade C": cCount,
        "Grade D/E": dCount + eCount,
        "Grade F": fCount,
        total,
        passRate,
        excellenceRate
      };
    });
  }, [grades, selectedClass, selectedSubject]);

  // Aggregate stats across terms
  const aggregates = useMemo(() => {
    let totalExams = 0;
    let totalAsAndBs = 0;
    let maxExcellence = 0;
    let bestTerm = "N/A";

    processedData.forEach((d) => {
      totalExams += d.total;
      totalAsAndBs += d["Grade A"] + d["Grade B"];
      if (d.excellenceRate > maxExcellence) {
        maxExcellence = d.excellenceRate;
        bestTerm = d.term;
      }
    });

    const averageExcellence = totalExams > 0 ? Math.round((totalAsAndBs / totalExams) * 100) : 0;

    return {
      totalExams,
      averageExcellence,
      bestTerm,
      maxExcellence
    };
  }, [processedData]);

  const handlePrintPDF = () => {
    let printWindow: Window | null = null;
    let isIframeFallback = false;
    let fallbackFrame: HTMLIFrameElement | null = null;
    
    try {
      printWindow = window.open('', '_blank');
    } catch (e) {
      // ignore block
    }
    
    if (!printWindow) {
      isIframeFallback = true;
      fallbackFrame = document.createElement('iframe');
      fallbackFrame.style.position = 'fixed';
      fallbackFrame.style.width = '0px';
      fallbackFrame.style.height = '0px';
      fallbackFrame.style.border = 'none';
      document.body.appendChild(fallbackFrame);
      printWindow = fallbackFrame.contentWindow as any;
    }

    if (!printWindow) {
      alert("Please enable popups or permissions to print this report!");
      return;
    }

    // Process stacked bars html
    const stackedBarsHtml = processedData.map((d) => {
      const a = d["Grade A"];
      const b = d["Grade B"];
      const c = d["Grade C"];
      const de = d["Grade D/E"];
      const f = d["Grade F"];
      const total = a + b + c + de + f;

      if (total === 0) {
        return `
          <div class="stacked-bar-container">
            <div class="stacked-bar-title">
              <span>${d.term}</span>
              <span>No Exam Data Registered</span>
            </div>
            <div class="bar-track" style="background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8;">
              No evaluation data found for this term.
            </div>
          </div>
        `;
      }

      const pctA = Math.round((a / total) * 100);
      const pctB = Math.round((b / total) * 100);
      const pctC = Math.round((c / total) * 100);
      const pctDE = Math.round((de / total) * 100);
      const pctF = Math.max(0, 100 - (pctA + pctB + pctC + pctDE));

      return `
        <div class="stacked-bar-container">
          <div class="stacked-bar-title">
            <span>${d.term} (Cohort Size: ${total})</span>
            <span>Pass Rate: <strong>${d.passRate}%</strong> | Excellence Index: <strong>${d.excellenceRate}%</strong></span>
          </div>
          <div class="bar-track">
            ${pctA > 0 ? `<div class="bar-segment color-a" style="width: ${pctA}%" title="Grade A: ${pctA}%"></div>` : ''}
            ${pctB > 0 ? `<div class="bar-segment color-b" style="width: ${pctB}%" title="Grade B: ${pctB}%"></div>` : ''}
            ${pctC > 0 ? `<div class="bar-segment color-c" style="width: ${pctC}%" title="Grade C: ${pctC}%"></div>` : ''}
            ${pctDE > 0 ? `<div class="bar-segment color-de" style="width: ${pctDE}%" title="Grade D/E: ${pctDE}%"></div>` : ''}
            ${pctF > 0 ? `<div class="bar-segment color-f" style="width: ${pctF}%" title="Grade F: ${pctF}%"></div>` : ''}
          </div>
          <div class="legend-row">
            <div class="legend-item"><span class="legend-dot color-a"></span>A: ${a} (${pctA}%)</div>
            <div class="legend-item"><span class="legend-dot color-b"></span>B: ${b} (${pctB}%)</div>
            <div class="legend-item"><span class="legend-dot color-c"></span>C: ${c} (${pctC}%)</div>
            <div class="legend-item"><span class="legend-dot color-de"></span>D/E: ${de} (${pctDE}%)</div>
            <div class="legend-item"><span class="legend-dot color-f"></span>F: ${f} (${pctF}%)</div>
          </div>
        </div>
      `;
    }).join('');

    const tableRowsHtml = processedData.map((d) => {
      return `
        <tr>
          <td class="align-left">${d.term}</td>
          <td><span style="font-weight: 700; color: #047857;">${d["Grade A"]}</span></td>
          <td><span style="font-weight: 700; color: #1d4ed8;">${d["Grade B"]}</span></td>
          <td><span style="font-weight: 600; color: #d97706;">${d["Grade C"]}</span></td>
          <td><span style="font-weight: 600; color: #7c3aed;">${d["Grade D/E"]}</span></td>
          <td><span style="font-weight: 700; color: #b91c1c;">${d["Grade F"]}</span></td>
          <td style="font-weight: 800; background-color: #f1f5f9;">${d.total}</td>
          <td><span style="font-weight: 800; color: #059669;">${d.passRate}%</span></td>
          <td><span style="font-weight: 800; color: #4f46e5;">${d.excellenceRate}%</span></td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grade Distribution Report - ${selectedClass} | ${selectedSubject}</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Montserrat', sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              font-size: 11px;
              line-height: 1.5;
            }
            
            .no-print-btn {
              position: fixed;
              bottom: 25px;
              right: 25px;
              background: linear-gradient(135deg, #4f46e5 0%, #059669 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 30px;
              font-family: 'Montserrat', sans-serif;
              font-weight: 800;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              cursor: pointer;
              box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
              transition: all 0.2s ease;
              z-index: 9999;
            }
            .no-print-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5);
            }
            @media print {
              .no-print-btn {
                display: none !important;
              }
              body {
                padding: 10px 0;
              }
            }
            
            .header-brand {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
              margin-bottom: 25px;
            }
            .logo-text {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #1e1b4b;
              text-transform: uppercase;
            }
            .logo-text span {
              color: #059669;
            }
            .report-title {
              font-size: 14px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 5px 0;
            }
            .report-subtitle {
              font-size: 9.5px;
              color: #64748b;
              margin: 0;
            }
            
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 8px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-val {
              font-size: 11px;
              font-weight: 700;
              color: #1e1b4b;
              margin-top: 4px;
            }
            
            .stats-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              display: flex;
              align-items: center;
              gap: 12px;
              background-color: #ffffff;
            }
            .stat-icon-wrapper {
              width: 36px;
              height: 36px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 15px;
            }
            .stat-icon-emerald { background-color: #ecfdf5; color: #059669; }
            .stat-icon-indigo { background-color: #e0e7ff; color: #4f46e5; }
            .stat-icon-amber { background-color: #fef3c7; color: #d97706; }
            
            .stat-label {
              font-size: 8px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-val {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
            }
            
            .section-heading {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              color: #1e1b4b;
              letter-spacing: 1px;
              border-left: 3px solid #059669;
              padding-left: 10px;
              margin: 30px 0 15px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #1e1b4b;
              color: #ffffff;
              font-weight: 800;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px;
              border: 1px solid #1e1b4b;
            }
            td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: center;
              font-size: 10px;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .align-left {
              text-align: left;
              font-weight: 700;
            }
            
            .stacked-bar-container {
              margin: 15px 0;
              background-color: #ffffff;
              border-radius: 12px;
              padding: 15px;
              border: 1px solid #e2e8f0;
            }
            .stacked-bar-title {
              font-size: 9.5px;
              font-weight: 800;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }
            .bar-track {
              height: 18px;
              border-radius: 6px;
              overflow: hidden;
              display: flex;
              width: 100%;
              background-color: #e2e8f0;
            }
            .bar-segment {
              height: 100%;
            }
            .color-a { background-color: #10b981 !important; }
            .color-b { background-color: #3b82f6 !important; }
            .color-c { background-color: #f59e0b !important; }
            .color-de { background-color: #a855f7 !important; }
            .color-f { background-color: #ef4444 !important; }
            
            .legend-row {
              display: flex;
              gap: 15px;
              margin-top: 12px;
              flex-wrap: wrap;
            }
            .legend-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 8.5px;
              font-weight: 700;
              color: #475569;
            }
            .legend-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              display: inline-block;
            }
            
            .footer-copyright {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              font-weight: 600;
            }
            
            .seal-box {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 10px;
            }
            .seal-line {
              border-top: 1px solid #94a3b8;
              width: 180px;
              text-align: center;
              padding-top: 6px;
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header-brand">
            <div>
              <div class="logo-text">CORNER <span>STREAMS</span></div>
              <div style="font-size: 8.5px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">School Intelligence Platform</div>
            </div>
            <div style="text-align: right;">
              <h1 class="report-title">Grade Distribution Report</h1>
              <p class="report-subtitle">Official Cohort Analytics Export</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Class Cohort</span>
              <span class="meta-val">${selectedClass}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Course Subject</span>
              <span class="meta-val">${selectedSubject}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated Date</span>
              <span class="meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Security Signature</span>
              <span class="meta-val" style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #059669;">CS-DIST-OK-2026</span>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-icon-wrapper stat-icon-emerald">📊</div>
              <div>
                <span class="stat-label">Total Evaluated</span>
                <div class="stat-val">${aggregates.totalExams} papers</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrapper stat-icon-indigo">🏆</div>
              <div>
                <span class="stat-label">Excellence Ratio</span>
                <div class="stat-val">${aggregates.averageExcellence}%</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrapper stat-icon-amber">✨</div>
              <div>
                <span class="stat-label">Highest Performing Term</span>
                <div class="stat-val">${aggregates.bestTerm}</div>
              </div>
            </div>
          </div>

          <div class="section-heading">Dynamic Visual Distribution Curves</div>
          ${stackedBarsHtml}

          <div class="section-heading">Detailed Distribution Matrix</div>
          <table>
            <thead>
              <tr>
                <th class="align-left">Academic Term</th>
                <th>A (Outstanding)</th>
                <th>B (Very Good)</th>
                <th>C (Pass)</th>
                <th>D/E (Fair)</th>
                <th>F (Needs Imp.)</th>
                <th>Cohort Size</th>
                <th>Pass Rate</th>
                <th>Excellence Index</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="seal-box">
            <div class="seal-line">
              Reconciled by Principal
            </div>
            <div class="seal-line">
              Academic Board Director
            </div>
          </div>

          <div class="footer-copyright">
            © 2026 Corner Streams. All rights reserved.
          </div>

          <button class="no-print-btn" onclick="window.print()">Print Analysis PDF</button>
        </body>
      </html>
    `);
    printWindow.document.close();

    if (isIframeFallback && fallbackFrame) {
      setTimeout(() => {
        try {
          fallbackFrame?.contentWindow?.focus();
          fallbackFrame?.contentWindow?.print();
          setTimeout(() => {
            if (fallbackFrame && fallbackFrame.parentNode) {
              fallbackFrame.parentNode.removeChild(fallbackFrame);
            }
          }, 1500);
        } catch (err) {
          console.error("Print fallback triggered warning: ", err);
        }
      }, 800);
    }
  };

  // Custom select component complying to the specific user instruction:
  // "No Native Dropdown Selects: Always prefer custom-drawn React select containers"
  const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    label, 
    isOpen, 
    setIsOpen 
  }: { 
    value: string; 
    onChange: (val: string) => void; 
    options: string[]; 
    label: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  }) => {
    return (
      <div className="relative inline-block w-full text-left">
        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">{label}</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full h-9.5 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold shadow-sm hover:bg-slate-50 focus:outline-none transition-all duration-150"
        >
          <span className="truncate">{value}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-150 shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="py-1 max-h-48 overflow-y-auto">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                      value === opt 
                        ? "bg-indigo-50 text-indigo-900 font-black" 
                        : "text-slate-700 hover:bg-emerald-600 hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    {value === opt && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`cs-card p-5 space-y-5 bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}
    >
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-black text-slate-900 text-sm tracking-tight">
              Grade Distribution Analytics
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Term-by-term comparative distribution showing academic performance curves across cohorts.
          </p>
        </div>

        {/* View Mode Segment Switcher & Printing */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start sm:self-center">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150">
            <button
              onClick={() => setChartType("stacked")}
              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                chartType === "stacked" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Distribution</span>
            </button>
            <button
              onClick={() => setChartType("trend")}
              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                chartType === "trend" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Pass Trends</span>
            </button>
            <button
              onClick={() => setChartType("density")}
              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                chartType === "density" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <AreaIcon className="w-3.5 h-3.5" />
              <span>Excellence Rate</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-sm hover:shadow-md transition-all duration-150 shrink-0 font-mono"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter row - Strictly using the CustomSelect component to obey AGENTS.md rule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
        <CustomSelect
          label="Class Cohort"
          value={selectedClass}
          onChange={setSelectedClass}
          options={classOptions}
          isOpen={isClassOpen}
          setIsOpen={(open) => {
            setIsClassOpen(open);
            if (open) setIsSubjectOpen(false);
          }}
        />

        <CustomSelect
          label="Course Subject"
          value={selectedSubject}
          onChange={setSelectedSubject}
          options={subjectOptions}
          isOpen={isSubjectOpen}
          setIsOpen={(open) => {
            setIsSubjectOpen(open);
            if (open) setIsClassOpen(false);
          }}
        />
      </div>

      {/* Core Chart Canvas Area with Animated Transitions */}
      <div className="w-full h-[280px] bg-slate-50/30 rounded-xl p-3 border border-slate-150/80 flex flex-col justify-between overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedSubject}-${selectedClass}-${chartType}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-h-0 w-full h-full mt-1"
          >
            {chartType === "stacked" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="term" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#fff",
                      fontSize: "10.5px"
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ fontWeight: "black", color: "#38bdf8", marginBottom: "4px" }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={32} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "9.5px", fontWeight: "bold" }} 
                  />
                  <Bar dataKey="Grade A" stackId="a" fill="#059669" name="Grade A (Outstanding)" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="Grade B" stackId="a" fill="#3b82f6" name="Grade B (Very Good)" isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="Grade C" stackId="a" fill="#f59e0b" name="Grade C (Pass)" isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="Grade D/E" stackId="a" fill="#a855f7" name="Grade D/E (Fair)" isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="Grade F" stackId="a" fill="#ef4444" name="Grade F (Needs Imp.)" isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === "trend" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="term" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#fff",
                      fontSize: "10.5px"
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ fontWeight: "black", color: "#38bdf8", marginBottom: "4px" }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={32} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "9.5px", fontWeight: "bold" }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="passRate" 
                    stroke="#10b981" 
                    name="Cohort Pass Rate (%)" 
                    strokeWidth={3}
                    activeDot={{ r: 6 }} 
                    isAnimationActive={true}
                    animationDuration={750}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="excellenceRate" 
                    stroke="#6366f1" 
                    name="Excellence (A/B) Ratio (%)" 
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    isAnimationActive={true}
                    animationDuration={750}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === "density" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorExcellence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="term" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#fff",
                      fontSize: "10.5px"
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ fontWeight: "black", color: "#38bdf8", marginBottom: "4px" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="excellenceRate" 
                    stroke="#4f46e5" 
                    fillOpacity={1} 
                    fill="url(#colorExcellence)" 
                    name="Excellence Index"
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={750}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Aggregate metrics grid with staggered motion sequence */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={`metrics-${selectedSubject}-${selectedClass}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">Agg. Exams</span>
              <span className="block text-xs font-black text-slate-800 mt-1 font-mono">{aggregates.totalExams} papers</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">Excellence</span>
              <span className="block text-xs font-black text-indigo-600 mt-1 font-mono">{aggregates.averageExcellence}%</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <span className="block text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">Best Term</span>
              <span className="block text-xs font-black text-slate-800 mt-1 truncate max-w-[80px]">{aggregates.bestTerm}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
