import { logger } from '@scholarly/utils';
import { config } from '../../config';
import { GmailManager } from './gmail';
import { BillingUserModel, type PaymentEvent, type PaymentMethod, type PaymentRequestRecord } from './model';

const paymentMethodLabels: Record<PaymentMethod, string> = {
    bit: 'ביט',
    paybox: 'פייבוקס',
    bank_transfer: 'העברה בנקאית',
    cash: 'מזומן',
    other: 'אחר',
};

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

function notificationSubject(event: PaymentEvent, studentName: string, requestNumber: string): string {
    return event.paymentStatus === 'disputed'
        ? `${studentName} פתח/ה מחלוקת על דרישה ${requestNumber}`
        : `${studentName} דיווח/ה על תשלום לדרישה ${requestNumber}`;
}

function notificationHtml(event: PaymentEvent, studentName: string, request: Pick<PaymentRequestRecord, 'requestNumber' | 'total'>): string {
    const details = [
        `<strong>דרישה:</strong> ${escapeHtml(request.requestNumber)}`,
        `<strong>סכום:</strong> ${request.total.toFixed(2)} ₪`,
        event.paymentMethod ? `<strong>אמצעי תשלום:</strong> ${paymentMethodLabels[event.paymentMethod]}` : '',
        event.proofFilename ? `<strong>אישור תשלום מצורף:</strong> ${escapeHtml(event.proofFilename)}` : '',
        event.note ? `<strong>הערה:</strong> ${escapeHtml(event.note).replace(/\n/g, '<br>')}` : '',
    ]
        .filter(Boolean)
        .join('<br>');
    const headline = event.paymentStatus === 'disputed' ? 'נפתחה מחלוקת על דרישת תשלום' : 'התקבל דיווח על תשלום';
    const actionUrl = `${config.web.appUrl}/teacher/payments`;
    return `<div dir="rtl" lang="he" style="max-width:600px;margin:auto;font-family:Arial,sans-serif;line-height:1.7;color:#2b1a12"><div style="padding:18px;border-radius:14px;background:#4c2d1b;color:white"><div style="font-size:12px;letter-spacing:2px;color:#f2dfc4">SCHOLARLY</div><h2 style="margin:4px 0">${headline}</h2><div>${escapeHtml(studentName)}</div></div><div style="margin-top:16px;padding:14px;border-radius:12px;background:#f8ead5">${details}</div><p style="margin-top:20px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#a45f2a;color:white;text-decoration:none">לבדיקה ואישור באפליקציה</a></p></div>`;
}

export async function notifyTeacherOfStudentPaymentUpdate(
    request: Pick<PaymentRequestRecord, 'teacherId' | 'studentId' | 'requestNumber' | 'total'>,
    event: PaymentEvent,
): Promise<void> {
    try {
        const [teacher, student] = await Promise.all([
            BillingUserModel.findById(request.teacherId).lean(),
            BillingUserModel.findById(request.studentId).lean(),
        ]);
        if (!teacher?.email || !student) return;
        const studentName = `${student.firstName} ${student.lastName}`;
        await GmailManager.send(request.teacherId, {
            to: teacher.email,
            subject: notificationSubject(event, studentName, request.requestNumber),
            html: notificationHtml(event, studentName, request),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Teacher payment notification failed for request ${request.requestNumber}: ${message}`);
    }
}
