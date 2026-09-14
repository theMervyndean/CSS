/**
 * Google Workspace Services Integration for Corner Streams
 * Integrates Google Sheets API & Google Picker API using Firebase Auth access tokens.
 */

import { auth, googleProvider } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { UserRole } from '../types';

// Declare Google Picker API global types
declare global {
  interface Window {
    gapi: any;
    google: {
      picker?: any;
      accounts?: any;
    };
  }
}

/**
 * Roles authorized to use Google Sheets & Google Picker features.
 * Strictly blocks 'Student' and 'Parent'.
 */
export const GOOGLE_WORKSPACE_ALLOWED_ROLES: (UserRole | string)[] = [
  'School_Admin',
  'Class_Teacher',
  'Non_Class_Teacher',
  'Super_Admin',
  'Teacher',
  'Principal',
  'Accountant'
];

/**
 * Verify whether a given user role is authorized to perform Google Workspace operations.
 */
export function canUseGoogleWorkspace(role?: UserRole | string): boolean {
  if (!role) return false;
  const normalizedRole = role.trim();
  if (normalizedRole === 'Student' || normalizedRole === 'Parent') {
    return false;
  }
  if (
    normalizedRole === 'School_Admin' || 
    normalizedRole === 'Super_Admin' || 
    normalizedRole === 'Class_Teacher' || 
    normalizedRole === 'Non_Class_Teacher' || 
    normalizedRole.toLowerCase().includes('teacher') || 
    normalizedRole.toLowerCase().includes('admin')
  ) {
    return true;
  }
  return GOOGLE_WORKSPACE_ALLOWED_ROLES.includes(normalizedRole);
}

// Configured Workspace OAuth Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

// Ensure google provider has all requested workspace scopes configured
WORKSPACE_SCOPES.forEach(scope => {
  try {
    googleProvider.addScope(scope);
  } catch (e) {
    // scope might already be added
  }
});

let cachedAccessToken: string | null = null;

/**
 * Get current cached access token or return null
 */
export function getCachedGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Set or clear cached access token in memory
 */
export function setCachedGoogleAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Prompt user with Google Sign-In Popup to acquire Workspace OAuth access token
 */
export async function acquireGoogleWorkspaceToken(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Failed to acquire OAuth access token from Google.');
    }

    cachedAccessToken = token;
    return token;
  } catch (error: any) {
    console.error('Google Workspace Token Acquisition failed:', error);
    throw error;
  }
}

/**
 * Load Google API Client Library & Google Picker API script dynamically
 */
export async function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.picker) {
      return resolve();
    }

    // Check if script already appended
    const existingScript = document.getElementById('google-picker-api-script');
    if (existingScript) {
      // If gapi exists, load picker
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to load Google Picker'))
        });
      } else {
        existingScript.addEventListener('load', () => {
          window.gapi.load('picker', {
            callback: () => resolve(),
            onerror: () => reject(new Error('Failed to load Google Picker'))
          });
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-picker-api-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to load Google Picker'))
        });
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.body.appendChild(script);
  });
}

export interface GoogleDrivePickerResult {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

/**
 * Open Google Picker Dialog for selecting a Google Sheet or Spreadsheet file from Google Drive
 */
export async function openGoogleSheetPicker(
  accessToken: string,
  onPick: (file: GoogleDrivePickerResult) => void,
  onCancel?: () => void
): Promise<void> {
  await loadGooglePickerApi();

  if (!window.google?.picker) {
    throw new Error('Google Picker library is not ready');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  // Configure view for spreadsheets
  const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false)
    .setMimeTypes('application/vnd.google-apps.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv');

  const picker = new window.google.picker.PickerBuilder()
    .addView(docsView)
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setCallback((data: any) => {
      if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
        const doc = data[window.google.picker.Response.DOCUMENTS][0];
        onPick({
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          url: doc.url
        });
      } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    })
    .setTitle('Select Google Sheet for Corner Streams')
    .build();

  picker.setVisible(true);
}

/**
 * Fetch Google Spreadsheet Metadata (Tab names, properties)
 */
export async function fetchSpreadsheetMetadata(spreadsheetId: string, accessToken: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch spreadsheet metadata (status ${response.status})`);
  }

  return response.json();
}

/**
 * Read values from a specific Sheet range (e.g., "Sheet1!A1:Z100")
 */
export async function readSpreadsheetRange(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to read spreadsheet values (status ${response.status})`);
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Create a new Google Spreadsheet in the user's Drive with given title and header rows
 */
export async function createGoogleSpreadsheet(
  title: string,
  sheetTitle: string,
  rows: (string | number)[][],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: sheetTitle
          }
        }
      ]
    })
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Sheet (status ${createResponse.status})`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Append Rows/Values if provided
  if (rows && rows.length > 0) {
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        })
      }
    );

    if (!appendResponse.ok) {
      console.warn('Could not populate initial rows in sheet:', await appendResponse.text());
    }
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Export School broadsheet data to a new Google Sheet
 */
export async function exportBroadsheetToGoogleSheet(
  className: string,
  subjectList: string[],
  studentScores: Array<{
    name: string;
    admissionNo: string;
    scores: Record<string, { ca1: number; ca2: number; exam: number; total: number; grade: string }>;
    overallAverage: number;
    position: string;
  }>,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = [
    'Position',
    'Admission No',
    'Student Full Name',
    ...subjectList.flatMap(sub => [`${sub} (CA)`, `${sub} (Exam)`, `${sub} (Total)`, `${sub} (Grade)`]),
    'Overall Average (%)'
  ];

  const dataRows = studentScores.map(st => {
    const subjectCells = subjectList.flatMap(sub => {
      const rec = st.scores[sub] || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-' };
      const caTotal = (rec.ca1 || 0) + (rec.ca2 || 0);
      return [caTotal, rec.exam || 0, rec.total || 0, rec.grade || '-'];
    });

    return [
      st.position,
      st.admissionNo,
      st.name,
      ...subjectCells,
      `${st.overallAverage.toFixed(1)}%`
    ];
  });

  const timestamp = new Date().toLocaleDateString('en-GB');
  const title = `Corner Streams - ${className} Academic Broadsheet (${timestamp})`;
  const sheetTabName = `${className.replace(/[^a-zA-Z0-9]/g, '_')}_Broadsheet`;

  return await createGoogleSpreadsheet(
    title,
    sheetTabName,
    [headers, ...dataRows],
    accessToken
  );
}

/**
 * Export School Tuition & Billing Ledger to Google Sheets
 */
export async function exportBillingLedgerToGoogleSheets(
  records: any[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = [
    'Student ID',
    'Student Name',
    'Class',
    'Term / Session',
    'Total Billed (NGN)',
    'Amount Paid (NGN)',
    'Balance Due (NGN)',
    'Payment Status',
    'Receipt Reference',
    'Last Payment Date'
  ];

  const dataRows = records.map(r => [
    r.id || r.studentId || '-',
    r.studentName || '-',
    r.className || r.class || '-',
    r.term || 'Term 1 2025/2026',
    r.totalAmount || r.amount || 0,
    r.amountPaid || 0,
    (r.totalAmount || r.amount || 0) - (r.amountPaid || 0),
    r.status || (r.amountPaid >= (r.totalAmount || r.amount || 0) ? 'PAID' : 'PENDING'),
    r.receiptNo || r.paymentRef || '-',
    r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-GB') : '-'
  ]);

  const timestamp = new Date().toLocaleDateString('en-GB');
  const title = `Corner Streams - Financial Tuition Ledger (${timestamp})`;
  return await createGoogleSpreadsheet(
    title,
    'Billing_Ledger',
    [headers, ...dataRows],
    accessToken
  );
}

export const exportBillingLedgerToGoogleSheet = exportBillingLedgerToGoogleSheets;

/**
 * Export Institutional Financial Audit & Cash Flow statement to Google Sheets
 */
export async function exportFinancialAuditToGoogleSheet(
  termLabel: string,
  summary: {
    grossInflow: number;
    totalOutflow: number;
    netSurplus: number;
    bankCashReserves: number;
    accountsReceivable: number;
    cbtFixedAssets: number;
  },
  departmentBudgets: any[],
  termAudits: any[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const summaryRows = [
    ['Institutional Financial Statement', termLabel || 'Current Term'],
    ['Generated On', new Date().toLocaleString('en-GB')],
    ['', ''],
    ['Key Financial Metric', 'Amount (NGN)'],
    ['Gross Revenue / Inflow', summary.grossInflow],
    ['Total Operating Outflow', summary.totalOutflow],
    ['Net Operational Surplus / (Deficit)', summary.netSurplus],
    ['Bank & Cash Reserves', summary.bankCashReserves],
    ['Accounts Receivable (Tuition Due)', summary.accountsReceivable],
    ['CBT & Fixed Asset Valuation', summary.cbtFixedAssets],
    ['', ''],
    ['Departmental Allocations', 'Allocated Budget (NGN)', 'Spent to Date (NGN)', 'Remaining Budget (NGN)', 'Utilization (%)']
  ];

  const deptRows = (departmentBudgets || []).map((dept: any) => [
    dept.dept || dept.name || 'General',
    dept.allocated || dept.budget || 0,
    dept.spent || 0,
    (dept.allocated || dept.budget || 0) - (dept.spent || 0),
    dept.allocated ? `${(((dept.spent || 0) / dept.allocated) * 100).toFixed(1)}%` : '0%'
  ]);

  const multiTermHeaders = [
    ['', ''],
    ['Multi-Term Audit History', 'Gross Inflow (NGN)', 'Total Expenses (NGN)', 'Net Surplus (NGN)', 'Tuition Recovery (%)']
  ];

  const termRows = (termAudits || []).map((t: any) => [
    t.term || '-',
    t.inflow || 0,
    t.outflow || 0,
    (t.inflow || 0) - (t.outflow || 0),
    `${t.recoveryRate || 100}%`
  ]);

  return await createGoogleSpreadsheet(
    `Corner Streams - Financial Audit Report (${termLabel || 'Institutional'})`,
    'Financial_Audit',
    [...summaryRows, ...deptRows, multiTermHeaders[0], multiTermHeaders[1], ...termRows],
    accessToken
  );
}
