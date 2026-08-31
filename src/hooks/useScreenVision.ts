import { useState, useEffect, useCallback, useRef } from 'react';
import { AiAssistantContext } from '../components/AiAssistantWidget';

export interface ScreenVisionSnapshot {
  pageTitle: string;
  activeTab: string;
  currentView: string;
  userRole: string;
  userName: string;
  schoolName: string;
  summary: string;
  visibleHeadings: string[];
  tableData?: {
    headers: string[];
    sampleRows: string[][];
    totalRows: number;
  }[];
  activeFormFields?: {
    label: string;
    value: string;
    type?: string;
  }[];
  actionButtons: string[];
  alerts: string[];
  keyDataPoints: Record<string, any>;
  suggestedDirectives: string[];
  screenElementsDetected: string[];
  domStructureSummary: string;
  lastScannedAt: number;
}

/**
 * Robust DOM & Component context extractor
 */
export function extractActiveDomContext(context: AiAssistantContext): ScreenVisionSnapshot {
  const currentView = context.currentView || 'app';
  const activeTab = context.activeTab || 'classes';
  const userRole = context.userRole || 'Super_Admin';
  const userName = context.userName || 'User';
  const schoolName = context.schoolName || 'Corner Streams School';

  const visibleHeadings: string[] = [];
  const screenElementsDetected: string[] = [];
  const actionButtons: string[] = [];
  const alerts: string[] = [];
  const activeFormFields: { label: string; value: string; type?: string }[] = [];
  const tableData: { headers: string[]; sampleRows: string[][]; totalRows: number }[] = [];
  const keyDataPoints: Record<string, any> = { ...(context.additionalInfo || {}) };

  if (typeof document !== 'undefined') {
    try {
      // 1. Detect modal dialogs if open
      const modal = document.querySelector('[role="dialog"], .fixed.inset-0');
      const modalTitle = modal?.querySelector('h1, h2, h3, h4')?.textContent?.trim();
      if (modalTitle) {
        visibleHeadings.push(`[Active Dialog]: ${modalTitle}`);
        screenElementsDetected.push(`Open Modal: ${modalTitle}`);
      }

      // 2. Headings & section titles
      const headings = document.querySelectorAll('h1, h2, h3, h4, .text-xl, .text-2xl, [role="heading"]');
      headings.forEach((h) => {
        const text = h.textContent?.trim();
        if (text && text.length > 2 && text.length < 90 && !visibleHeadings.includes(text)) {
          // Avoid noise from Nonye AI widget's own container
          if (!h.closest('#nonye-assistant-widget') && !h.closest('#chinonye-assistant-widget') && !h.closest('.ai-assistant-container')) {
            visibleHeadings.push(text);
          }
        }
      });

      // 3. Tables & data grids
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        if (table.closest('#nonye-assistant-widget') || table.closest('#chinonye-assistant-widget')) return;
        const ths = Array.from(table.querySelectorAll('thead th, tr:first-child th')).map(
          (th) => th.textContent?.trim() || ''
        ).filter(Boolean);

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const sampleRows: string[][] = [];
        rows.slice(0, 5).forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim() || '');
          if (cells.length > 0) {
            sampleRows.push(cells.slice(0, 8));
          }
        });

        if (ths.length > 0 || sampleRows.length > 0) {
          tableData.push({
            headers: ths.slice(0, 8),
            sampleRows,
            totalRows: rows.length || sampleRows.length
          });
          screenElementsDetected.push(`Data Table: ${ths.slice(0, 4).join(' | ')} (${rows.length} rows)`);
        }
      });

      // 4. Action buttons & interactive controls
      const buttons = document.querySelectorAll('button:not([disabled]), a.btn, [role="button"]');
      buttons.forEach((btn) => {
        if (btn.closest('#chinonye-assistant-widget')) return;
        const label = btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title');
        if (label && label.length > 1 && label.length < 40 && !actionButtons.includes(label)) {
          actionButtons.push(label);
        }
      });
      if (actionButtons.length > 0) {
        screenElementsDetected.push(`Available Actions: ${actionButtons.slice(0, 6).join(', ')}`);
      }

      // 5. Active form inputs & selects
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach((input) => {
        if (input.closest('#chinonye-assistant-widget')) return;
        const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const idOrName = el.id || el.name || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '';
        const value = el.value?.trim();
        if (idOrName || value) {
          activeFormFields.push({
            label: idOrName || 'Input Field',
            value: value && value.length > 50 ? value.substring(0, 47) + '...' : value || '(empty)',
            type: el.type
          });
        }
      });

      // 6. Alert banners & warning badges
      const alertElements = document.querySelectorAll(
        '.bg-rose-50, .bg-red-50, .bg-amber-50, .text-red-600, .text-rose-600, [role="alert"]'
      );
      alertElements.forEach((el) => {
        if (el.closest('#chinonye-assistant-widget')) return;
        const txt = el.textContent?.trim();
        if (txt && txt.length > 4 && txt.length < 150 && !alerts.includes(txt)) {
          alerts.push(txt);
        }
      });
      if (alerts.length > 0) {
        screenElementsDetected.push(`Visible Warnings: ${alerts.slice(0, 2).join('; ')}`);
      }
    } catch (err) {
      console.warn('[useScreenVision] DOM extraction warning:', err);
    }
  }

  // Derive intelligent role-based & page-based directive prompts
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

  // Construct readable DOM structural synthesis for LLM prompt context
  const domParts: string[] = [];
  if (visibleHeadings.length > 0) {
    domParts.push(`Headings: ${visibleHeadings.join(' > ')}`);
  }
  if (tableData.length > 0) {
    tableData.forEach((t, idx) => {
      domParts.push(
        `Table #${idx + 1} (${t.totalRows} rows): Columns [${t.headers.join(', ')}] | Sample Data: ${JSON.stringify(t.sampleRows.slice(0, 3))}`
      );
    });
  }
  if (activeFormFields.length > 0) {
    domParts.push(
      `Form Fields: ${activeFormFields.slice(0, 8).map((f) => `${f.label}: "${f.value}"`).join(', ')}`
    );
  }
  if (actionButtons.length > 0) {
    domParts.push(`Available Action Buttons: ${actionButtons.slice(0, 10).join(', ')}`);
  }
  if (alerts.length > 0) {
    domParts.push(`Warnings/Alerts on Screen: ${alerts.join(' | ')}`);
  }

  const domStructureSummary = domParts.join('\n');

  return {
    pageTitle: visibleHeadings[0] || activeTab.replace(/_/g, ' ').toUpperCase(),
    activeTab,
    currentView,
    userRole,
    userName,
    schoolName,
    summary,
    visibleHeadings,
    tableData,
    activeFormFields,
    actionButtons,
    alerts,
    keyDataPoints,
    suggestedDirectives,
    screenElementsDetected,
    domStructureSummary,
    lastScannedAt: Date.now()
  };
}

/**
 * React Hook: useScreenVision
 * Live telemetry & reactive DOM vision provider for AiAssistantWidget
 */
export function useScreenVision(context: AiAssistantContext, enabled = true) {
  const [snapshot, setSnapshot] = useState<ScreenVisionSnapshot>(() => extractActiveDomContext(context));
  const [isScanning, setIsScanning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scanNow = useCallback(() => {
    setIsScanning(true);
    const fresh = extractActiveDomContext(context);
    setSnapshot(fresh);
    setIsScanning(false);
    return fresh;
  }, [context]);

  // Observe route/tab changes and DOM mutations
  useEffect(() => {
    if (!enabled) return;

    // Trigger immediate capture upon context change
    const fresh = extractActiveDomContext(context);
    setSnapshot(fresh);

    // Set up MutationObserver to react to table changes, modal openings, or dynamic data loading
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setSnapshot(extractActiveDomContext(context));
        }, 400);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });

      return () => {
        observer.disconnect();
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }
  }, [context.activeTab, context.currentView, context.userRole, enabled]);

  return {
    screenVision: snapshot,
    isScanning,
    scanNow
  };
}
