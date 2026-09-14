/**
 * Corner Streams Telegram Notification Service
 * Dispatches instant real-time alerts to Telegram Groups, Channels, or Admin Chats
 * using the Telegram Bot API (https://api.telegram.org/bot<TOKEN>/sendMessage).
 */

export interface TelegramNotificationResult {
  success: boolean;
  messageId?: number;
  chatId?: string;
  error?: string;
}

export interface ContactLeadData {
  name: string;
  email: string;
  phone?: string;
  schoolName?: string;
  subject?: string;
  message?: string;
  source?: string;
}

export interface SchoolOnboardingData {
  schoolName: string;
  adminName: string;
  email: string;
  phone: string;
  state?: string;
  lga?: string;
  country?: string;
  schoolId?: string;
  selectedPlan?: string;
  estimatedStudents?: string | number;
}

export interface UserRegistrationData {
  fullName: string;
  role: string;
  email: string;
  phone?: string;
  schoolName?: string;
  schoolId?: string;
}

/**
 * Format timestamp in West Africa Time (WAT)
 */
export function getFormattedWatTimestamp(): string {
  try {
    return new Date().toLocaleString("en-GB", {
      timeZone: "Africa/Lagos",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " (WAT)";
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Send raw formatted message to Telegram via backend proxy or direct Bot API
 */
export async function sendTelegramMessage(
  text: string,
  options?: {
    parseMode?: 'Markdown' | 'HTML';
    chatId?: string;
    botToken?: string;
  }
): Promise<TelegramNotificationResult> {
  try {
    const localChatId = typeof window !== 'undefined' ? localStorage.getItem('CS_TELEGRAM_CHAT_ID') : null;
    const effectiveChatId = options?.chatId || (localChatId && localChatId.trim() ? localChatId.trim() : undefined);

    const response = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        parseMode: options?.parseMode || 'Markdown',
        chatId: effectiveChatId,
        botToken: options?.botToken,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server responded with ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      messageId: data.messageId,
      chatId: data.chatId,
      error: data.error,
    };
  } catch (error: any) {
    console.warn('[Telegram Service] Failed to dispatch message:', error.message);
    return {
      success: false,
      error: error.message || 'Network failure dispatching Telegram alert',
    };
  }
}

/**
 * 📩 Notify Telegram Channel/Group about a new Contact Form Submission or Lead
 */
export async function notifyTelegramContact(lead: ContactLeadData): Promise<TelegramNotificationResult> {
  const timestamp = getFormattedWatTimestamp();
  const text = [
    `📩 *NEW CONTACT INQUIRY RECEIVED*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Name:* ${lead.name || 'Anonymous Lead'}`,
    `📧 *Email:* [${lead.email || 'N/A'}](mailto:${lead.email})`,
    `📞 *Phone:* ${lead.phone || 'N/A'}`,
    lead.schoolName ? `🏫 *School:* ${lead.schoolName}` : '',
    lead.subject ? `🏷️ *Subject:* ${lead.subject}` : '',
    `💬 *Message:*`,
    `_${(lead.message || 'No message provided').trim()}_`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⏰ *Time:* \`${timestamp}\``,
    `🌐 *Source:* ${lead.source || 'Corner Streams Portal'}`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramMessage(text, { parseMode: 'Markdown' });
}

/**
 * 🏫 Notify Telegram Channel/Group about a new School Onboarded
 */
export async function notifyTelegramSchoolOnboard(school: SchoolOnboardingData): Promise<TelegramNotificationResult> {
  const timestamp = getFormattedWatTimestamp();
  const text = [
    `🏫 *NEW SCHOOL ONBOARDED!* 🎉`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🏛️ *School Name:* *${school.schoolName.toUpperCase()}*`,
    `👨‍💼 *Administrator:* ${school.adminName || 'N/A'}`,
    `📧 *Admin Email:* [${school.email}](mailto:${school.email})`,
    `📞 *Phone / WhatsApp:* [${school.phone}](tel:${school.phone})`,
    `📍 *Location:* ${school.state || 'N/A'}${school.lga ? ` (${school.lga})` : ''}`,
    school.schoolId ? `🆔 *Assigned ID:* \`${school.schoolId}\`` : '',
    school.selectedPlan ? `💎 *Plan:* ${school.selectedPlan.toUpperCase()}` : '',
    school.estimatedStudents ? `👥 *Students:* ~${school.estimatedStudents}` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `⏰ *Enrolled At:* \`${timestamp}\``,
    `⚡ *Status:* Tenant database initialized`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramMessage(text, { parseMode: 'Markdown' });
}

/**
 * 👤 Notify Telegram Channel/Group about a new User Account Registration
 */
export async function notifyTelegramRegistration(user: UserRegistrationData): Promise<TelegramNotificationResult> {
  const timestamp = getFormattedWatTimestamp();
  const text = [
    `👤 *NEW USER REGISTERED*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Full Name:* ${user.fullName}`,
    `🛡️ *Role:* \`${user.role.toUpperCase()}\``,
    `📧 *Email:* [${user.email}](mailto:${user.email})`,
    user.phone ? `📞 *Phone:* ${user.phone}` : '',
    user.schoolName ? `🏫 *Affiliated School:* ${user.schoolName}` : '',
    user.schoolId ? `🆔 *School ID:* \`${user.schoolId}\`` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `⏰ *Registered:* \`${timestamp}\``,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramMessage(text, { parseMode: 'Markdown' });
}

/**
 * 🔔 Notify Telegram Channel/Group about Portal Traffic
 */
export async function notifyTelegramPageView(pageName: string, url?: string): Promise<TelegramNotificationResult> {
  const timestamp = getFormattedWatTimestamp();
  const text = [
    `🔔 *PORTAL VISITOR ALERT*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👁️ *Page:* ${pageName}`,
    url ? `🔗 *URL:* ${url}` : '',
    `⏰ *Time:* \`${timestamp}\``,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramMessage(text, { parseMode: 'Markdown' });
}
