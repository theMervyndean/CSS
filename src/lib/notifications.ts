/**
 * Corner Streams Unified Notification Engine
 * Coordinates broadcast alerts across Telegram Channels/Groups, WhatsApp (+2348141880550),
 * and all 4 Admin Email Inboxes:
 * - mervyndeanhilary@gmail.com
 * - eluwamercy789@gmail.com
 * - thecornerstreams@gmail.com
 * - mervynifeanyi@gmail.com
 */

import {
  notifyTelegramContact,
  notifyTelegramSchoolOnboard,
  notifyTelegramRegistration,
  notifyTelegramPageView,
  ContactLeadData,
  SchoolOnboardingData,
  UserRegistrationData
} from './telegramService';

export interface MultiChannelNotificationResponse {
  success: boolean;
  emailSent?: boolean;
  whatsappSent?: boolean;
  whatsappGateway?: string;
  whatsappError?: string;
  telegramSent?: boolean;
  waMeLink?: string;
  recipients?: string[];
}

export interface NotificationDiagnosticEntry {
  id: string;
  timestamp: string;
  channel: "whatsapp_callmebot" | "whatsapp_twilio" | "telegram" | "email";
  status: "success" | "error" | "skipped_unconfigured" | "pending";
  event: string;
  recipient: string;
  details: string;
  httpStatus?: number;
  error?: string;
}

export interface NotificationDiagnosticsResponse {
  status: string;
  integrations: {
    callmebot: {
      configured: boolean;
      phone: string | null;
      hasApiKey: boolean;
      apiKeyMasked: string | null;
      provider: string;
      endpoint: string;
    };
    telegram: {
      configured: boolean;
      hasToken: boolean;
      hasChatId: boolean;
      chatId: string | null;
    };
    email: {
      configured: boolean;
      host?: string;
      port?: number;
      user?: string;
      isGmail?: boolean;
      hasPassword?: boolean;
      inboxes: string[];
    };
    twilio: {
      configured: boolean;
    };
  };
  logs: NotificationDiagnosticEntry[];
  timestamp: string;
}

/**
 * Fetch live diagnostic logs and integration status from backend
 */
export async function fetchNotificationDiagnostics(): Promise<NotificationDiagnosticsResponse | null> {
  try {
    const res = await fetch('/api/notifications/diagnostics');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[Diagnostics Fetch Warning]:', err);
    return null;
  }
}

/**
 * Trigger manual test alert via SMTP Email Engine
 */
export async function testEmailNotification(): Promise<{ 
  success: boolean; 
  host?: string; 
  port?: number; 
  user?: string; 
  recipients?: string[]; 
  error?: string 
}> {
  try {
    const res = await fetch('/api/notifications/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error triggering SMTP email test' };
  }
}

/**
 * Trigger manual test alert via CallMeBot WhatsApp API
 */
export async function testCallMeBotWhatsApp(params?: {
  phone?: string;
  apiKey?: string;
  message?: string;
}): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const res = await fetch('/api/notifications/callmebot/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error triggering CallMeBot test' };
  }
}

const WHATSAPP_RAW_PHONE = "2348141880550";

/**
 * Store a newly captured lead, user registration, or school onboarding in CS_LEADS and push real-time in-app alert
 */
export function recordLeadEntry(lead: {
  type: 'inquiry' | 'school_onboarding' | 'user_registration';
  name: string;
  email: string;
  phone?: string;
  school?: string;
  role?: string;
  message?: string;
  tier?: string;
  status?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem('CS_LEADS') || '[]');
    const newEntry = {
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: lead.type,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      school: lead.school || 'Corner Streams Global',
      role: lead.role || (lead.type === 'school_onboarding' ? 'School_Admin' : lead.type === 'user_registration' ? 'User' : 'Prospect'),
      message: lead.message || (lead.type === 'user_registration' ? `Registered new ${lead.role || 'user'} account` : lead.type === 'school_onboarding' ? `Enrolled school on ${lead.tier || 'custom'} plan` : 'General demo & inquiry request'),
      tier: lead.tier,
      status: lead.status || 'new',
      resolved: false,
      created_at: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    // Avoid exact duplicate within same 3 seconds
    const isDup = existing.some((item: any) => item.email === newEntry.email && item.type === newEntry.type && Math.abs(new Date(item.timestamp || 0).getTime() - new Date(newEntry.timestamp).getTime()) < 3000);
    if (!isDup) {
      existing.unshift(newEntry);
      localStorage.setItem('CS_LEADS', JSON.stringify(existing));
    }

    // Also push into CS_NOTIFICATIONS for in-app bell & drawer notification sync
    try {
      const existingNotifs = JSON.parse(localStorage.getItem('CS_NOTIFICATIONS') || '[]');
      let notifTitle = "📩 New Landing Page Lead";
      let notifMsg = `Inquiry from ${lead.name} (${lead.school || 'Prospect'}): "${lead.message || 'Demo request'}"`;
      let notifCat: 'lead_alert' | 'registration' | 'system' = 'lead_alert';

      if (lead.type === 'school_onboarding') {
        notifTitle = `🏫 New School Onboarded: ${lead.school}`;
        notifMsg = `${lead.name} (${lead.email}, ${lead.phone || ''}) enrolled ${lead.school} on ${lead.tier || 'Standard'} plan.`;
        notifCat = 'registration';
      } else if (lead.type === 'user_registration') {
        notifTitle = `👤 New User Registration: ${lead.name}`;
        notifMsg = `New ${lead.role || 'User'} profile created for ${lead.name} (${lead.email}) at ${lead.school || 'Corner Streams'}.`;
        notifCat = 'registration';
      }

      const notifItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: notifTitle,
        message: notifMsg,
        category: notifCat,
        createdAt: new Date().toISOString(),
        isRead: false,
        targetRole: 'all',
        actionTab: 'leads'
      };

      existingNotifs.unshift(notifItem);
      localStorage.setItem('CS_NOTIFICATIONS', JSON.stringify(existingNotifs));

      // Dispatch window events so SPA views catch and re-render in real time
      window.dispatchEvent(new CustomEvent('cs_lead_created', { detail: newEntry }));
      window.dispatchEvent(new CustomEvent('cs_notification_created', { detail: notifItem }));
      window.dispatchEvent(new Event('storage'));
    } catch (nErr) {
      console.warn('[In-app Notification push error]:', nErr);
    }
  } catch (e) {
    console.warn('[Leads Storage Error]:', e);
  }
}

/**
 * Store a newly captured payment receipt in CS_RECEIPTS and broadcast in-app alert
 */
export function recordReceiptEntry(receipt: {
  schoolName?: string;
  submittedBy: string;
  amountNgn: number;
  tier?: string;
  duration?: string;
  status?: string;
  whatsappCode?: string;
  note?: string;
}): any {
  if (typeof window === 'undefined') return null;
  try {
    const existing = JSON.parse(localStorage.getItem('CS_RECEIPTS') || '[]');
    const receiptCode = receipt.whatsappCode || Math.floor(100000 + Math.random() * 900000).toString();
    const newReceipt = {
      id: 'rcp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      school_name: receipt.schoolName || 'Corner Streams Global Network',
      schoolName: receipt.schoolName || 'Corner Streams Global Network',
      submitted_by: receipt.submittedBy,
      amount_ngn: receipt.amountNgn || 0,
      tier: receipt.tier || 'unified_enterprise',
      duration: receipt.duration || 'full_session',
      status: receipt.status || 'pending',
      whatsapp_code: receiptCode,
      note: receipt.note || 'Bank transfer invoice clearance slip',
      created_at: new Date().toISOString(),
    };

    existing.unshift(newReceipt);
    localStorage.setItem('CS_RECEIPTS', JSON.stringify(existing));

    // Also push into CS_NOTIFICATIONS
    try {
      const existingNotifs = JSON.parse(localStorage.getItem('CS_NOTIFICATIONS') || '[]');
      const notifItem = {
        id: `notif-rcp-${Date.now()}`,
        title: `🧾 New Payment Receipt (₦${(receipt.amountNgn || 0).toLocaleString()})`,
        message: `Payment receipt submitted by ${receipt.submittedBy} for ${newReceipt.school_name} (${(newReceipt.tier || 'License').replace(/_/g, ' ')}) [Ref #${receiptCode}]`,
        category: 'receipt' as const,
        createdAt: new Date().toISOString(),
        isRead: false,
        targetRole: 'all',
        actionTab: 'receipts'
      };
      existingNotifs.unshift(notifItem);
      localStorage.setItem('CS_NOTIFICATIONS', JSON.stringify(existingNotifs));

      window.dispatchEvent(new CustomEvent('cs_receipt_created', { detail: newReceipt }));
      window.dispatchEvent(new CustomEvent('cs_notification_created', { detail: notifItem }));
      window.dispatchEvent(new Event('storage'));
    } catch (ne) {}

    return newReceipt;
  } catch (e) {
    console.warn('[Receipt Storage Error]:', e);
    return null;
  }
}

/**
 * 🧾 Dispatch Payment / Transfer Receipt Notification to Telegram, Email (4 Inboxes), and WhatsApp
 */
export async function dispatchReceiptNotification(receiptData: {
  schoolName?: string;
  submittedBy: string;
  amountNgn: number;
  tier?: string;
  duration?: string;
  status?: string;
  whatsappCode?: string;
  note?: string;
}): Promise<MultiChannelNotificationResponse> {
  // 0. Automatically record receipt in database
  const savedReceipt = recordReceiptEntry(receiptData);

  // 1. Dispatch Multi-Channel broadcast to Server (All 4 Gmail Inboxes, Telegram, and WhatsApp)
  const serverPromise = postNotifyAll('payment_receipt', {
    ...receiptData,
    schoolName: receiptData.schoolName || 'Corner Streams Global Network',
    receiptId: savedReceipt?.id,
    whatsappCode: savedReceipt?.whatsapp_code || receiptData.whatsappCode
  });

  const srvRes = await serverPromise;

  return {
    success: true,
    emailSent: srvRes.emailDispatched,
    whatsappSent: srvRes.whatsAppDispatched,
    whatsappGateway: srvRes.whatsAppGateway,
    recipients: srvRes.recipients,
  };
}

/**
 * Dispatch server-side multi-channel broadcast
 */
async function postNotifyAll(eventType: string, data: Record<string, any>): Promise<any> {
  try {
    const localChatId = typeof window !== 'undefined' ? localStorage.getItem('CS_TELEGRAM_CHAT_ID') : null;
    const res = await fetch('/api/notify-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        eventType, 
        data,
        chatId: (localChatId && localChatId.trim()) ? localChatId.trim() : undefined
      }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (err) {
    console.warn('[MultiChannel Notification Warning]:', err);
    return { success: false };
  }
}

/**
 * 📩 Dispatch Contact Inquiry to Telegram, Email (4 Inboxes), and WhatsApp
 */
export async function dispatchContactNotification(lead: ContactLeadData): Promise<MultiChannelNotificationResponse> {
  // 0. Automatically record lead in database
  recordLeadEntry({
    type: 'inquiry',
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    school: lead.schoolName,
    message: lead.message || lead.subject,
  });

  // 1. Send Telegram Notification
  const tgPromise = notifyTelegramContact(lead).catch(() => ({ success: false }));

  // 2. Send Server Email & WhatsApp broadcast
  const serverPromise = postNotifyAll('contact_message', {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    schoolName: lead.schoolName,
    subject: lead.subject,
    message: lead.message,
  });

  const [tgRes, srvRes] = await Promise.all([tgPromise, serverPromise]);

    const waText = `📩 *New Contact Inquiry*\n\n• *Name:* ${lead.name}\n• *Email:* ${lead.email}\n• *Phone:* ${lead.phone || 'N/A'}\n• *School:* ${lead.schoolName || 'N/A'}\n• *Message:* "${lead.message || ''}"`;
  const waMeLink = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodeURIComponent(waText)}`;

  return {
    success: true,
    telegramSent: tgRes.success,
    emailSent: srvRes.emailDispatched,
    whatsappSent: srvRes.whatsAppDispatched,
    whatsappGateway: srvRes.whatsAppGateway,
    whatsappError: srvRes.whatsAppError,
    recipients: srvRes.recipients,
    waMeLink,
  };
}

/**
 * 🏫 Dispatch School Onboarding to Telegram, Email (4 Inboxes), and WhatsApp
 */
export async function dispatchSchoolOnboardedNotification(school: SchoolOnboardingData): Promise<MultiChannelNotificationResponse> {
  // 0. Automatically record lead in database
  recordLeadEntry({
    type: 'school_onboarding',
    name: school.adminName,
    email: school.email,
    phone: school.phone,
    school: school.schoolName,
    role: 'School_Admin',
    tier: school.selectedPlan,
    message: `Onboarded school "${school.schoolName}" in ${school.state || 'NG'} (Plan: ${school.selectedPlan || 'Pro'})`,
  });

  // 1. Send Telegram Notification
  const tgPromise = notifyTelegramSchoolOnboard(school).catch(() => ({ success: false }));

  // 2. Send Server Email & WhatsApp broadcast
  const serverPromise = postNotifyAll('school_onboarded', school);

  const [tgRes, srvRes] = await Promise.all([tgPromise, serverPromise]);

  const waText = `🏫 *NEW SCHOOL ONBOARDED!*\n\n• *School:* ${school.schoolName}\n• *Admin:* ${school.adminName}\n• *Email:* ${school.email}\n• *Phone:* ${school.phone}\n• *State:* ${school.state || 'N/A'}\n• *School ID:* ${school.schoolId || 'N/A'}`;
  const waMeLink = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodeURIComponent(waText)}`;

  return {
    success: true,
    telegramSent: tgRes.success,
    emailSent: srvRes.emailDispatched,
    whatsappSent: srvRes.whatsAppDispatched,
    whatsappGateway: srvRes.whatsAppGateway,
    whatsappError: srvRes.whatsAppError,
    recipients: srvRes.recipients,
    waMeLink,
  };
}

/**
 * 👤 Dispatch User Registration to Telegram, Email (4 Inboxes), and WhatsApp
 */
export async function dispatchUserRegistrationNotification(user: UserRegistrationData): Promise<MultiChannelNotificationResponse> {
  // 0. Automatically record lead in database
  recordLeadEntry({
    type: 'user_registration',
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    school: user.schoolName,
    role: user.role,
    message: `New ${user.role} user account created for ${user.fullName} (${user.email})`,
  });

  // 1. Send Telegram Notification
  const tgPromise = notifyTelegramRegistration(user).catch(() => ({ success: false }));

  // 2. Send Server Email & WhatsApp broadcast
  const serverPromise = postNotifyAll('user_registered', user);

  const [tgRes, srvRes] = await Promise.all([tgPromise, serverPromise]);

  const waText = `👤 *New User Registration*\n\n• *Name:* ${user.fullName}\n• *Role:* ${user.role}\n• *Email:* ${user.email}\n• *Phone:* ${user.phone || 'N/A'}\n• *School:* ${user.schoolName || 'N/A'}`;
  const waMeLink = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodeURIComponent(waText)}`;

  return {
    success: true,
    telegramSent: tgRes.success,
    emailSent: srvRes.emailDispatched,
    whatsappSent: srvRes.whatsAppDispatched,
    whatsappGateway: srvRes.whatsAppGateway,
    whatsappError: srvRes.whatsAppError,
    recipients: srvRes.recipients,
    waMeLink,
  };
}

/**
 * 🔔 Dispatch Page View / Visitor Traffic to Telegram, Email, and WhatsApp
 */
export function dispatchPageViewNotification(pageName: string, url?: string) {
  setTimeout(() => {
    notifyTelegramPageView(pageName, url || window.location.href).catch(() => {});
    postNotifyAll('page_view', {
      page: pageName,
      url: url || window.location.href,
      userAgent: navigator.userAgent,
    }).catch(() => {});
  }, 1000);
}

// Backward compatibility export aliases
export const notifyContactSubmission = dispatchContactNotification;
export const notifySchoolOnboarded = dispatchSchoolOnboardedNotification;
export const notifyUserRegistration = dispatchUserRegistrationNotification;
export const notifyPageView = dispatchPageViewNotification;
