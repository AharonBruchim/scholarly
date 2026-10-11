import { randomBytes } from 'node:crypto';
import { ServiceError } from '@scholarly/utils';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

function gmailConfig() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.PASSWORD_RESET_GMAIL_REFRESH_TOKEN;
    const from = process.env.PASSWORD_RESET_FROM_EMAIL;
    if (!clientId || !clientSecret || !refreshToken || !from) {
        throw new ServiceError('Password reset email is not configured', 503, 'PASSWORD_RESET_EMAIL_NOT_CONFIGURED');
    }
    return { clientId, clientSecret, refreshToken, from };
}

async function googleRequest<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const body = await response.text();
        throw new ServiceError(`Google API request failed (${response.status}): ${body.slice(0, 300)}`, 502, 'GOOGLE_API_ERROR');
    }
    return (await response.json()) as T;
}

function mimeWord(value: string): string {
    return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

function buildMime(input: { from: string; to: string; subject: string; html: string }): string {
    const boundary = `scholarly-${randomBytes(12).toString('hex')}`;
    return [
        `From: ${input.from}`,
        `To: ${input.to}`,
        `Subject: ${mimeWord(input.subject)}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(input.html).toString('base64'),
        `--${boundary}--`,
        '',
    ].join('\r\n');
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function accessToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = gmailConfig();
    const token = await googleRequest<{ access_token: string }>(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });
    return token.access_token;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const { from } = gmailConfig();
    const html = `<div dir="rtl" lang="he" style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a"><h2>איפוס סיסמה ל-Scholarly</h2><p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#0ea5e9;color:#020617;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">בחירת סיסמה חדשה</a></p><p>הקישור תקף ל-30 דקות. אם לא ביקשת לאפס סיסמה, אפשר להתעלם מהמייל.</p></div>`;
    const raw = Buffer.from(
        buildMime({
            from,
            to,
            subject: 'איפוס סיסמה ל-Scholarly',
            html,
        }),
    ).toString('base64url');
    const token = await accessToken();
    await googleRequest<{ id: string }>(GMAIL_SEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
    });
}
