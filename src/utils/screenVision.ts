/**
 * Chinonye J.A.R.V.I.S. Screen Vision Engine
 * Extracts real-time DOM telemetry, visible screen context, active form states,
 * and generates dynamic page-aware directives for every user role.
 */

export interface ScreenVisionData {
  pageTitle: string;
  activeTab: string;
  currentView: string;
  userRole: string;
  userName: string;
  schoolName: string;
  summary: string;
  visibleHeadings: string[];
  keyDataPoints: Record<string, any>;
  suggestedDirectives: string[];
  screenElementsDetected: string[];
}

export function captureLiveScreenVision(context: {
  currentView?: string;
  activeTab?: string;
  userRole?: string;
  userName?: string;
  schoolName?: string;
  subscriptionTier?: string;
  additionalInfo?: Record<string, any>;
}): ScreenVisionData {
  const currentView = context.currentView || 'app';
  const activeTab = context.activeTab || 'classes';
  const userRole = context.userRole || 'Super_Admin';
  const userName = context.userName || 'User';
  const schoolName = context.schoolName || 'Corner Streams School';

  const visibleHeadings: string[] = [];
  const screenElementsDetected: string[] = [];
  const keyDataPoints: Record<string, any> = { ...context.additionalInfo };

  if (typeof document !== 'undefined') {
    try {
      // 1. Extract active headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, .text-xl, .text-2xl, [role="heading"]');
      headings.forEach((h) => {
        const text = h.textContent?.trim();
        if (text && text.length > 2 && text.length < 80 && !visibleHeadings.includes(text)) {
          visibleHeadings.push(text);
        }
      });

      // 2. Detect active tables and stats
      const tables = document.querySelectorAll('table');
      if (tables.length > 0) {
        let totalRows = 0;
        tables.forEach((t) => {
          totalRows += t.querySelectorAll('tbody tr').length;
        });
        keyDataPoints.tableCount = tables.length;
        keyDataPoints.totalVisibleRows = totalRows;
        screenElementsDetected.push(`${tables.length} data table(s) with ${totalRows} active rows`);
      }

      // 3. Detect visible buttons / actions
      const buttons = document.querySelectorAll('button:not([disabled]), a.btn');
      const actionLabels: string[] = [];
      buttons.forEach((b) => {
        const label = b.textContent?.trim();
        if (label && label.length > 2 && label.length < 35 && !actionLabels.includes(label)) {
          actionLabels.push(label);
        }
      });
      if (actionLabels.length > 0) {
        keyDataPoints.availableActions = actionLabels.slice(0, 10);
        screenElementsDetected.push(`Active Actions: ${actionLabels.slice(0, 5).join(', ')}`);
      }

      // 4. Detect badges / alerts / warnings
      const alerts = document.querySelectorAll('.bg-rose-50, .bg-red-50, .bg-amber-50, .text-red-600, .text-rose-600, [role="alert"]');
      if (alerts.length > 0) {
        const alertTexts: string[] = [];
        alerts.forEach((a) => {
          const txt = a.textContent?.trim();
          if (txt && txt.length > 5 && txt.length < 120 && !alertTexts.includes(txt)) {
            alertTexts.push(txt);
          }
        });
        if (alertTexts.length > 0) {
          keyDataPoints.visibleAlerts = alertTexts.slice(0, 4);
          screenElementsDetected.push(`Active Alerts: ${alertTexts.slice(0, 2).join('; ')}`);
        }
      }

      // 5. Detect select dropdowns & active form inputs
      const selects = document.querySelectorAll('select, [role="combobox"]');
      if (selects.length > 0) {
        screenElementsDetected.push(`${selects.length} filter/selector control(s)`);
      }
    } catch (e) {
      console.warn('Screen vision DOM inspection caught exception:', e);
    }
  }

  // Generate dynamic, intelligent J.A.R.V.I.S directives based on active screen and user role
  const suggestedDirectives: string[] = [];
  let summary = '';

  switch (activeTab) {
    case 'classes':
    case 'overview':
    case 'dashboard':
      summary = `Executive Overview & School Health Dashboard for ${schoolName}.`;
      suggestedDirectives.push(
        "⚡ What needs my attention right now?",
        "📊 Give me a J.A.R.V.I.S operational briefing",
        "🔍 Audit missing teacher submissions",
        "🎯 Guide me to compute terminal broadsheets"
      );
      break;

    case 'uploaded':
    case 'scores':
    case 'broadsheets':
    case 'completed':
    case 'broadsheet_vault':
      summary = `Academic Gradebook & Continuous Assessment Broadsheet.`;
      suggestedDirectives.push(
        "🔍 Scan this broadsheet for anomalies & failing students",
        "⚡ Are there any missing CA 1, CA 2, or Exam scores?",
        "📈 How do I compute positions & finalize grades?",
        "✍️ Draft personalized report card comments for this class"
      );
      break;

    case 'cbt':
    case 'cbt_builder':
    case 'cbt_review':
    case 'live':
      summary = `Computer-Based Testing (CBT) & Assessment Engine.`;
      suggestedDirectives.push(
        "⚡ Generate 5 standard exam MCQs for this topic",
        "⏱️ Check test duration & security restrictions",
        "🎯 Review question quality and answer keys",
        "📋 How do I schedule or publish this CBT test?"
      );
      break;

    case 'bursary_clearance':
    case 'fees':
    case 'billing':
    case 'receipt':
    case 'receipts':
    case 'staff_payment':
      summary = `Bursary Ledger, Fee Collections & CBT Clearance Gate.`;
      suggestedDirectives.push(
        "💰 Summarize fee collection rate for this term",
        "🚫 Who is currently barred by the CBT Clearance Gate?",
        "🧾 How do I record a student tuition payment?",
        "⚠️ List students with high outstanding balances"
      );
      break;

    case 'reportcard':
    case 'report_cards':
    case 'result_dossiers':
      summary = `Digital Report Card Dossiers & Psychomotor Assessment.`;
      suggestedDirectives.push(
        "✍️ Draft an empathetic, motivating comment for this student",
        "📐 Analyze this student's grade trajectory & weak subjects",
        "🖨️ How do I batch-print or download official PDF report cards?",
        "⭐ Review psychomotor and affective domain ratings"
      );
      break;

    case 'attendance':
    case 'rosters':
      summary = `Student Attendance Register & Roll-Call Registry.`;
      suggestedDirectives.push(
        "📅 Calculate overall class attendance percentage",
        "⚠️ Flag students with chronic absenteeism",
        "📝 How do I mark daily morning roll-call quickly?"
      );
      break;

    case 'scheme_of_work':
    case 'lesson_plan':
      summary = `Curriculum Scheme of Work & Lesson Plan Manager.`;
      suggestedDirectives.push(
        "📚 Generate a week-by-week scheme of work for this subject",
        "📝 Draft an interactive 45-minute lesson plan with objectives",
        "🎯 Align this topic with WAEC/NECO syllabus guidelines"
      );
      break;

    case 'teachers':
    case 'staff':
      summary = `Faculty Management & Subject Teacher Allocation.`;
      suggestedDirectives.push(
        "👨‍🏫 Check teacher class & subject allocations",
        "📊 Review gradebook submission compliance across staff",
        "➕ How do I invite or assign a new teacher?"
      );
      break;

    default:
      summary = `Active Workspace: ${activeTab.replace(/_/g, ' ').toUpperCase()} (${currentView}).`;
      suggestedDirectives.push(
        "⚡ What can I do on this screen?",
        "🎯 Guide me step-by-step through this workflow",
        "🔍 Point out any errors or incomplete items"
      );
      break;
  }

  // Adjust for Student/Parent perspective if applicable
  if (userRole === 'Student') {
    suggestedDirectives.splice(0, suggestedDirectives.length);
    suggestedDirectives.push(
      "📚 Explain this subject topic step-by-step",
      "🎯 Give me a practice quiz for my upcoming CBT",
      "📊 How is my academic performance trajectory?",
      "💡 Tips to prepare for my terminal examinations"
    );
  } else if (userRole === 'Parent') {
    suggestedDirectives.splice(0, suggestedDirectives.length);
    suggestedDirectives.push(
      "📄 Explain my child's terminal report card grades",
      "💳 How do I check tuition clearance & download receipts?",
      "🎯 What subjects need academic support or tutoring?"
    );
  }

  return {
    pageTitle: visibleHeadings[0] || activeTab.replace(/_/g, ' ').toUpperCase(),
    activeTab,
    currentView,
    userRole,
    userName,
    schoolName,
    summary,
    visibleHeadings,
    keyDataPoints,
    suggestedDirectives,
    screenElementsDetected
  };
}
