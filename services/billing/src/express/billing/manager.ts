import nodemailer from 'nodemailer';
import { PaymentFormData } from './interface';
import { ServiceError } from '@scholarly/utils';

const { GMAIL_SENDER, GMAIL_APP_PASSWORD } = process.env;

function buildText(p: PaymentFormData): string {
    const c = p.comments && p.comments.trim() !== '' ? p.comments : '-';
    return [
        'שלום,',
        '',
        `בקשת תשלום עבור ${p.clientName} בסך ${p.amount} ₪.`,
        '',
        `📅 תאריך: ${p.date}`,
        `👨‍🏫 מספר תלמידים: ${p.studentCount}`,
        `📚 מספר שיעורים: ${p.sessionCount}`,
        `💬 הערות: ${c}`,
        '',
        'פרטי בנק:',
        `🏦 בנק: ${p.bank}`,
        `🏢 סניף: ${p.branch}`,
        `📄 חשבון: ${p.account}`,
        '',
        'מצורף PDF עם פרטי הבקשה.',
        'תודה רבה!',
    ].join('\n');
}

function buildHtmlEmail(p: PaymentFormData): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div dir="rtl" style="font-family: Arial, sans-serif; font-size:16px; line-height:1.7; white-space:pre-wrap;">${esc(buildText(p))}</div>`;
}

export class BillingManager {
    static sendPaymentEmail = async (payment: PaymentFormData, pdfBuffer: Buffer) => {
        if (!GMAIL_SENDER || !GMAIL_APP_PASSWORD) {
            throw new ServiceError('Missing email configuration in environment variables', 500);
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: GMAIL_SENDER, pass: GMAIL_APP_PASSWORD },
        });

        const filename = `בקשת_תשלום_${payment.clientName}_${payment.date}.pdf`;

        const info = await transporter.sendMail({
            from: GMAIL_SENDER,
            to: payment.clientEmail,
            replyTo: GMAIL_SENDER,
            subject: `בקשת תשלום - ${payment.clientName} - ${payment.amount} ₪`,
            text: buildText(payment),
            html: buildHtmlEmail(payment),
            attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
        });

        return { ok: true, messageId: info.messageId };
    };
}