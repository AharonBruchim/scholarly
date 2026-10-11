import { ServiceError } from '@scholarly/utils';
import nodemailer from 'nodemailer';

function smtpConfig() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const from = process.env.PASSWORD_RESET_FROM_EMAIL;
    if (!host || !Number.isInteger(port) || !user || !password || !from) {
        throw new ServiceError('Password reset SMTP is not configured', 503, 'PASSWORD_RESET_EMAIL_NOT_CONFIGURED');
    }
    return {
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass: password },
        from,
    };
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const { from, ...transportConfig } = smtpConfig();
    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.sendMail({
        from,
        to,
        subject: 'איפוס סיסמה ל-Scholarly',
        html: `<div dir="rtl" lang="he" style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a"><h2>איפוס סיסמה ל-Scholarly</h2><p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#0ea5e9;color:#020617;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">בחירת סיסמה חדשה</a></p><p>הקישור תקף ל-30 דקות. אם לא ביקשת לאפס סיסמה, אפשר להתעלם מהמייל.</p></div>`,
    });
}
