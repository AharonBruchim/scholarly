import { randomUUID } from 'node:crypto';
import { DeliveryChannel, UsersRoles } from '@scholarly/shared';
import type { AuthenticatedUser } from '@scholarly/utils';
import { ConflictError, ForbiddenError, NotFoundError, ServiceError } from '@scholarly/utils';
import { DateTime } from 'luxon';
import { GmailManager } from './gmail';
import {
    BillingLessonModel,
    BillingReminderJobModel,
    BillingUserModel,
    DeliveryOutboxModel,
    LessonMessageModel,
    type PaymentLineItem,
    PaymentRequestModel,
    SenderConnectionModel,
} from './model';
import { generateLessonMessagePdf, generatePaymentRequestPdf } from './pdf';
import {
    lessonMessageDocumentUrl,
    manualDeliveryOpenUrl,
    paymentDocumentUrl,
    smsUrl,
    verifyLessonMessageDocumentToken,
    verifyManualDeliveryToken,
    verifyPaymentDocumentToken,
    whatsappUrl,
} from './secure-links';

const ZONE = 'Asia/Jerusalem';
const LESSON_MESSAGE_PDF_VERSION = 2;
const ACTIVE_REQUEST_STATUSES = ['scheduled', 'pending_delivery', 'partially_delivered', 'delivered', 'failed'];

export interface ManualPaymentRequestInput {
    studentId: string;
    lessonIds: string[];
    customItems: Array<{ description: string; amount: number; date?: Date }>;
    channels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP | DeliveryChannel.SMS>;
    scheduledAt?: Date;
    notes?: string;
}

export interface LessonMessageInput {
    lessonIds: string[];
    subject: string;
    message: string;
    channels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP | DeliveryChannel.SMS>;
    scheduledAt?: Date;
}

function periodRange(period?: string) {
    const month = period
        ? DateTime.fromFormat(period, 'yyyy-MM', { zone: ZONE })
        : DateTime.now().setZone(ZONE).minus({ months: 1 }).startOf('month');
    if (!month.isValid) throw new ServiceError('Invalid billing period', 400, 'INVALID_BILLING_PERIOD');
    return {
        period: month.toFormat('yyyy-MM'),
        start: month.startOf('month').toJSDate(),
        end: month.plus({ months: 1 }).startOf('month').toJSDate(),
    };
}

function assertTeacher(actor: AuthenticatedUser): void {
    if (actor.role !== UsersRoles.TEACHER) throw new ForbiddenError();
}

function requestNumber(now = DateTime.now().setZone(ZONE)): string {
    return `DR-${now.toFormat('yyyyLLdd')}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function requestStatus(scheduledAt: Date): 'scheduled' | 'pending_delivery' {
    return scheduledAt.getTime() > Date.now() ? 'scheduled' : 'pending_delivery';
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function messageLessonIds(message: { lessonId?: string; lessonIds?: string[] }): string[] {
    if (message.lessonIds && message.lessonIds.length > 0) return message.lessonIds;
    return message.lessonId ? [message.lessonId] : [];
}

function lessonDate(startTime: Date): string {
    return new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: ZONE,
    }).format(startTime);
}

async function queueDelivery(input: {
    sourceType: 'payment_request' | 'lesson_reminder' | 'lesson_message';
    sourceId: string;
    teacherId: string;
    studentId: string;
    channel: DeliveryChannel;
    scheduledAt: Date;
    hasConsent: boolean;
}) {
    let status: 'waiting_for_connection' | 'queued' | 'manual_action_required' | 'skipped_no_consent';
    if (!input.hasConsent) {
        status = 'skipped_no_consent';
    } else if (input.channel === DeliveryChannel.WHATSAPP || input.channel === DeliveryChannel.SMS) {
        status = 'manual_action_required';
    } else {
        const connection = await SenderConnectionModel.exists({
            teacherId: input.teacherId,
            channel: input.channel,
            status: 'connected',
        });
        status = connection ? 'queued' : 'waiting_for_connection';
    }
    const { hasConsent: _hasConsent, ...record } = input;
    await DeliveryOutboxModel.updateOne(
        { sourceType: input.sourceType, sourceId: input.sourceId, channel: input.channel },
        { $setOnInsert: { ...record, status, attempts: 0 } },
        { upsert: true },
    );
}

function hasChannelConsent(phone: { allowWhatsApp?: boolean; allowSMS?: boolean }, channel: DeliveryChannel): boolean {
    if (channel === DeliveryChannel.WHATSAPP) return phone.allowWhatsApp !== false;
    if (channel === DeliveryChannel.SMS) return phone.allowSMS !== false;
    return true;
}

function lessonLine(lesson: {
    _id: { toString(): string };
    startTime: Date;
    subject: string;
    durationMinutes: number;
    price: number;
    status: string;
}): PaymentLineItem {
    return {
        lessonId: lesson._id.toString(),
        date: lesson.startTime,
        subject: lesson.subject,
        durationMinutes: lesson.durationMinutes,
        amount: lesson.price,
        kind: lesson.status === 'cancelled' ? 'late_cancellation' : 'completed',
    };
}

async function createPaymentRequestRecord(input: {
    teacher: {
        _id: { toString(): string };
        firstName: string;
        lastName: string;
        bankAccount: { bankName: string; branchNumber: string; accountNumber: string };
    };
    student: {
        _id: { toString(): string };
        firstName: string;
        lastName: string;
        phone: { allowWhatsApp?: boolean };
    };
    period: string;
    source: 'automatic' | 'manual';
    lines: PaymentLineItem[];
    channels: DeliveryChannel[];
    scheduledAt: Date;
    notes?: string;
}) {
    const number = requestNumber();
    const total = input.lines.reduce((sum, line) => sum + line.amount, 0);
    const generatedAt = new Date();
    const pdfData = await generatePaymentRequestPdf({
        teacherName: `${input.teacher.firstName} ${input.teacher.lastName}`,
        studentName: `${input.student.firstName} ${input.student.lastName}`,
        period: input.period,
        requestNumber: number,
        source: input.source,
        notes: input.notes,
        bank: input.teacher.bankAccount,
        lines: input.lines,
        total,
    });
    const request = await PaymentRequestModel.create({
        teacherId: input.teacher._id.toString(),
        studentId: input.student._id.toString(),
        period: input.period,
        source: input.source,
        requestNumber: number,
        notes: input.notes,
        lineItems: input.lines,
        total,
        channels: input.channels,
        status: requestStatus(input.scheduledAt),
        pdfData,
        pdfFilename: `דרישת-תשלום-${number}.pdf`,
        scheduledAt: input.scheduledAt,
        generatedAt,
    });
    for (const channel of input.channels) {
        await queueDelivery({
            sourceType: 'payment_request',
            sourceId: request._id.toString(),
            teacherId: request.teacherId,
            studentId: request.studentId,
            channel,
            scheduledAt: input.scheduledAt,
            hasConsent: hasChannelConsent(input.student.phone, channel),
        });
    }
    return request;
}

async function claimedLessonIds(): Promise<string[]> {
    return PaymentRequestModel.distinct('lineItems.lessonId', {
        status: { $in: ACTIVE_REQUEST_STATUSES },
        'lineItems.lessonId': { $exists: true },
    });
}

function withManualOpenUrl<T extends { _id: { toString(): string }; channel: DeliveryChannel; status: string; scheduledAt: Date }>(
    delivery: T,
): T & { openUrl?: string } {
    const canOpen =
        delivery.channel === DeliveryChannel.WHATSAPP &&
        ['manual_action_required', 'manual_opened'].includes(delivery.status) &&
        delivery.scheduledAt.getTime() <= Date.now();
    return canOpen ? { ...delivery, openUrl: manualDeliveryOpenUrl(delivery._id.toString()) } : delivery;
}

async function addDeliveries<T extends { _id: { toString(): string } }>(records: T[], sourceType: 'payment_request' | 'lesson_message') {
    const ids = records.map((record) => record._id.toString());
    const deliveries = await DeliveryOutboxModel.find({ sourceType, sourceId: { $in: ids } })
        .select('-lastError')
        .lean();
    const visibleDeliveries = deliveries.map(withManualOpenUrl);
    const bySource = new Map<string, typeof visibleDeliveries>();
    for (const delivery of visibleDeliveries) bySource.set(delivery.sourceId, [...(bySource.get(delivery.sourceId) ?? []), delivery]);
    return records.map((record) => ({ ...record, deliveries: bySource.get(record._id.toString()) ?? [] }));
}

async function updateSourceStatus(sourceType: 'payment_request' | 'lesson_message', sourceId: string): Promise<void> {
    const deliveries = await DeliveryOutboxModel.find({ sourceType, sourceId }).select('status scheduledAt').lean();
    if (deliveries.length === 0) return;
    const sent = deliveries.filter((delivery) => delivery.status === 'sent').length;
    const actionable = deliveries.filter((delivery) => !['skipped_no_consent', 'cancelled'].includes(delivery.status));
    const terminal = actionable.every((delivery) => ['sent', 'failed'].includes(delivery.status));
    const future = deliveries.every((delivery) => delivery.scheduledAt.getTime() > Date.now());
    const status = future
        ? 'scheduled'
        : sent > 0 && terminal
          ? 'delivered'
          : sent > 0
            ? 'partially_delivered'
            : terminal
              ? 'failed'
              : 'pending_delivery';
    if (sourceType === 'payment_request') {
        await PaymentRequestModel.updateOne({ _id: sourceId, status: { $ne: 'cancelled' } }, { $set: { status } });
    } else {
        await LessonMessageModel.updateOne({ _id: sourceId, status: { $ne: 'cancelled' } }, { $set: { status } });
    }
}

async function paymentEmail(sourceId: string) {
    const request = await PaymentRequestModel.findById(sourceId).select('+pdfData');
    if (!request || request.status === 'cancelled') throw new NotFoundError('Payment request not found');
    if (!request.pdfData || request.pdfData.length === 0) {
        throw new ServiceError('Payment request PDF is missing; email was not sent', 409, 'PAYMENT_PDF_MISSING');
    }
    const [teacher, student] = await Promise.all([
        BillingUserModel.findById(request.teacherId).lean(),
        BillingUserModel.findById(request.studentId).lean(),
    ]);
    if (!teacher || !student) throw new NotFoundError('Payment request participant not found');
    const lessonRows = request.lineItems
        .map((line) => {
            const date = line.date ? lessonDate(line.date) : 'ללא תאריך';
            const kind = line.kind === 'late_cancellation' ? 'ביטול מאוחר' : line.kind === 'custom' ? 'סעיף נוסף' : 'שיעור';
            return `<tr><td style="padding:9px;border-bottom:1px solid #eadcca">${escapeHtml(date)}</td><td style="padding:9px;border-bottom:1px solid #eadcca">${escapeHtml(line.subject)}</td><td style="padding:9px;border-bottom:1px solid #eadcca">${kind}</td><td style="padding:9px;border-bottom:1px solid #eadcca;white-space:nowrap">${line.amount.toFixed(2)} ₪</td></tr>`;
        })
        .join('');
    const bankDetails = teacher.bankAccount
        ? `<div style="margin-top:20px;padding:14px;border:1px solid #dfc9ae;border-radius:12px;background:#fff8ed"><strong>פרטי העברה בנקאית</strong><br>בנק: ${escapeHtml(teacher.bankAccount.bankName)}<br>סניף: ${escapeHtml(teacher.bankAccount.branchNumber)}<br>חשבון: ${escapeHtml(teacher.bankAccount.accountNumber)}</div>`
        : '';
    const notes = request.notes
        ? `<div style="margin-top:16px"><strong>הערות:</strong><br>${escapeHtml(request.notes).replace(/\n/g, '<br>')}</div>`
        : '';
    const lessonCount = request.lineItems.filter((line) => line.kind !== 'custom').length;
    return {
        teacherId: request.teacherId,
        to: student.email,
        subject: `דרישת תשלום - ${student.firstName} ${student.lastName} - ${request.total.toFixed(2)} ₪`,
        html: `<div dir="rtl" lang="he" style="max-width:680px;margin:auto;font-family:Arial,sans-serif;line-height:1.7;color:#2b1a12"><div style="padding:20px;border-radius:16px;background:#4c2d1b;color:white"><div style="font-size:12px;letter-spacing:2px;color:#f2dfc4">SCHOLARLY</div><h2 style="margin:4px 0">דרישת תשלום</h2><div>מאת ${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</div></div><p>שלום ${escapeHtml(student.firstName)},</p><p>להלן פירוט דרישת התשלום. קובץ ה־PDF המעוצב מצורף למייל זה.</p><div style="padding:14px;border-radius:12px;background:#f8ead5"><strong>מספר דרישה:</strong> ${escapeHtml(request.requestNumber)}<br><strong>תאריך הפקה:</strong> ${escapeHtml(lessonDate(request.generatedAt))}<br><strong>מספר תלמידות:</strong> 1<br><strong>מספר שיעורים:</strong> ${lessonCount}<br><strong>סה״כ לתשלום:</strong> ${request.total.toFixed(2)} ₪</div><table style="width:100%;margin-top:20px;border-collapse:collapse"><thead><tr style="background:#f2dfc4"><th style="padding:9px;text-align:right">מועד</th><th style="padding:9px;text-align:right">פירוט</th><th style="padding:9px;text-align:right">סוג</th><th style="padding:9px;text-align:right">סכום</th></tr></thead><tbody>${lessonRows}</tbody></table>${notes}${bankDetails}<p style="margin-top:22px">תודה רבה!</p><p style="font-size:12px;color:#806854">מסמך זה הוא דרישת תשלום ואינו חשבונית מס או קבלה.</p></div>`,
        pdf: Buffer.from(request.pdfData),
        pdfFilename: request.pdfFilename,
    };
}

async function lessonMessageEmail(sourceId: string) {
    const message = await LessonMessageModel.findById(sourceId).select('+pdfData');
    if (!message || message.status === 'cancelled') throw new NotFoundError('Lesson message not found');
    const [teacher, student, lessons] = await Promise.all([
        BillingUserModel.findById(message.teacherId).lean(),
        BillingUserModel.findById(message.studentId).lean(),
        BillingLessonModel.find({ _id: { $in: messageLessonIds(message) } })
            .sort({ startTime: 1 })
            .lean(),
    ]);
    if (!teacher || !student) throw new NotFoundError('Lesson message participant not found');
    if (!message.pdfData || message.pdfData.length === 0 || message.pdfVersion !== LESSON_MESSAGE_PDF_VERSION) {
        message.pdfData = await generateLessonMessagePdf({
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            teacherEmail: teacher.email,
            teacherPhone: teacher.phone.number,
            bank: teacher.bankAccount,
            studentName: `${student.firstName} ${student.lastName}`,
            studentEmail: student.email,
            studentPhone: student.phone.number,
            subject: message.subject,
            message: message.message,
            lessons,
        });
        message.pdfFilename = `סיכום-שיעורים-${message._id.toString()}.pdf`;
        message.pdfVersion = LESSON_MESSAGE_PDF_VERSION;
        await message.save();
    }
    const lessonRows = lessons
        .map(
            (lesson) =>
                `<tr><td style="padding:9px;border-bottom:1px solid #eadcca">${escapeHtml(lessonDate(lesson.startTime))}</td><td style="padding:9px;border-bottom:1px solid #eadcca">${escapeHtml(lesson.subject)}</td><td style="padding:9px;border-bottom:1px solid #eadcca">${lesson.durationMinutes} דקות</td><td style="padding:9px;border-bottom:1px solid #eadcca;white-space:nowrap">${lesson.price.toFixed(2)} ₪</td><td style="padding:9px;border-bottom:1px solid #eadcca">${lesson.status === 'cancelled' ? 'בוטל' : lesson.status === 'completed' ? 'התקיים' : 'נקבע'}</td></tr>`,
        )
        .join('');
    const total = lessons.reduce((sum, lesson) => sum + lesson.price, 0);
    const lessonSection = lessonRows
        ? `<table style="width:100%;margin-top:20px;border-collapse:collapse"><thead><tr style="background:#f2dfc4"><th style="padding:9px;text-align:right">מועד</th><th style="padding:9px;text-align:right">נושא</th><th style="padding:9px;text-align:right">משך</th><th style="padding:9px;text-align:right">מחיר</th><th style="padding:9px;text-align:right">סטטוס</th></tr></thead><tbody>${lessonRows}</tbody></table>`
        : '';
    const bankDetails = teacher.bankAccount
        ? `<div style="margin-top:16px;padding:14px;border:1px solid #dfc9ae;border-radius:12px;background:#fff8ed"><strong>פרטי העברה בנקאית</strong><br>בנק: ${escapeHtml(teacher.bankAccount.bankName)}<br>סניף: ${escapeHtml(teacher.bankAccount.branchNumber)}<br>חשבון: ${escapeHtml(teacher.bankAccount.accountNumber)}</div>`
        : '';
    return {
        teacherId: message.teacherId,
        to: student.email,
        subject: message.subject,
        html: `<div dir="rtl" lang="he" style="max-width:700px;margin:auto;font-family:Arial,sans-serif;line-height:1.7;color:#2b1a12"><div style="padding:20px;border-radius:16px;background:#4c2d1b;color:white"><div style="font-size:12px;letter-spacing:2px;color:#f2dfc4">SCHOLARLY</div><h2 style="margin:4px 0">${escapeHtml(message.subject)}</h2><div>מאת ${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)} · ${escapeHtml(teacher.email)}</div></div><p>שלום ${escapeHtml(student.firstName)},</p><div style="padding:14px;border-right:4px solid #a45f2a;background:#fff8ed;white-space:pre-wrap">${escapeHtml(message.message)}</div>${lessonSection}<div style="display:flex;gap:12px;margin-top:16px"><div style="flex:1;padding:12px;border-radius:10px;background:#f8ead5"><strong>מספר שיעורים:</strong> ${lessons.length}</div><div style="flex:1;padding:12px;border-radius:10px;background:#f8ead5"><strong>סה״כ:</strong> ${total.toFixed(2)} ₪</div></div>${bankDetails}<p style="margin-top:20px"><strong>קובץ PDF מעוצב הכולל את גוף ההודעה ואת כל הפרטים מצורף למייל.</strong></p><p>תודה רבה!</p></div>`,
        pdf: Buffer.from(message.pdfData),
        pdfFilename: message.pdfFilename,
    };
}

async function reminderEmail(sourceId: string) {
    const job = await BillingReminderJobModel.findById(sourceId).lean();
    if (!job) throw new NotFoundError('Reminder not found');
    const [student, lesson] = await Promise.all([BillingUserModel.findById(job.studentId).lean(), BillingLessonModel.findById(job.lessonId).lean()]);
    if (!student || !lesson) throw new NotFoundError('Reminder participant or lesson not found');
    const formatted = new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: ZONE,
    }).format(lesson.startTime);
    return {
        teacherId: job.teacherId,
        to: student.email,
        subject: `תזכורת לשיעור ${lesson.subject}`,
        html: `<div dir="rtl" lang="he"><p>שלום ${escapeHtml(student.firstName)},</p><p>תזכורת לשיעור <strong>${escapeHtml(lesson.subject)}</strong> שיתקיים ב־${escapeHtml(formatted)}.</p></div>`,
    };
}

async function sendOutboxEmail(sourceType: string, sourceId: string) {
    const email =
        sourceType === 'payment_request'
            ? await paymentEmail(sourceId)
            : sourceType === 'lesson_message'
              ? await lessonMessageEmail(sourceId)
              : await reminderEmail(sourceId);
    return GmailManager.send(email.teacherId, email);
}

async function manualDeliveryText(delivery: { sourceType: string; sourceId: string }, student: { firstName: string }): Promise<string> {
    if (delivery.sourceType === 'payment_request') {
        const request = await PaymentRequestModel.findById(delivery.sourceId).lean();
        if (!request) throw new NotFoundError('Payment request not found');
        return `שלום ${student.firstName},\nדרישת תשלום ${request.requestNumber} בסך ${request.total.toFixed(2)} ₪.\n\nלצפייה ולהורדה של ה־PDF המעוצב:\n${paymentDocumentUrl(request._id.toString())}`;
    }
    if (delivery.sourceType === 'lesson_message') {
        const message = await LessonMessageModel.findById(delivery.sourceId).lean();
        if (!message) throw new NotFoundError('Lesson message not found');
        const lessons = await BillingLessonModel.find({ _id: { $in: messageLessonIds(message) } })
            .sort({ startTime: 1 })
            .lean();
        const lessonLines = lessons.map((lesson) => `• ${lesson.subject} — ${lessonDate(lesson.startTime)}, ${lesson.durationMinutes} דקות`);
        return `${message.subject}\n\n${message.message}${lessonLines.length > 0 ? `\n\nהשיעורים שנבחרו:\n${lessonLines.join('\n')}` : ''}\n\nלצפייה ולהורדה של ה־PDF המעוצב:\n${lessonMessageDocumentUrl(message._id.toString())}`;
    }
    const job = await BillingReminderJobModel.findById(delivery.sourceId).lean();
    const lesson = job ? await BillingLessonModel.findById(job.lessonId).lean() : null;
    if (!job || !lesson) throw new NotFoundError('Reminder not found');
    return `תזכורת לשיעור ${lesson.subject} בתאריך ${lessonDate(lesson.startTime)}`;
}

export const AutomationManager = {
    generateMonthlyPaymentRequests: async (requestedPeriod?: string) => {
        const { period, start, end } = periodRange(requestedPeriod);
        const excluded = await claimedLessonIds();
        const lessons = await BillingLessonModel.find({
            _id: { $nin: excluded },
            studentId: { $exists: true },
            startTime: { $gte: start, $lt: end },
            $or: [
                { status: { $in: ['scheduled', 'completed'] }, endTime: { $lt: new Date() } },
                { status: 'cancelled', chargeStatus: 'full' },
            ],
        }).lean();
        const groups = new Map<string, typeof lessons>();
        for (const lesson of lessons) {
            if (!lesson.studentId) continue;
            const key = `${lesson.teacherId}:${lesson.studentId}`;
            groups.set(key, [...(groups.get(key) ?? []), lesson]);
        }
        const generatedIds: string[] = [];
        for (const [key, groupLessons] of groups) {
            const [teacherId, studentId] = key.split(':') as [string, string];
            const existing = await PaymentRequestModel.findOne({ teacherId, studentId, period, source: 'automatic' }).select('_id').lean();
            if (existing) {
                generatedIds.push(existing._id.toString());
                continue;
            }
            const [teacher, student] = await Promise.all([BillingUserModel.findById(teacherId).lean(), BillingUserModel.findById(studentId).lean()]);
            if (!teacher?.bankAccount || !teacher.teacherPreferences || !student) continue;
            const request = await createPaymentRequestRecord({
                teacher: {
                    _id: teacher._id,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    bankAccount: teacher.bankAccount,
                },
                student,
                period,
                source: 'automatic',
                lines: groupLessons.map(lessonLine),
                channels: teacher.teacherPreferences.paymentRequestChannels,
                scheduledAt: new Date(),
            });
            generatedIds.push(request._id.toString());
        }
        return { period, generatedIds };
    },

    createManualPaymentRequest: async (input: ManualPaymentRequestInput, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const [teacher, student, lessons] = await Promise.all([
            BillingUserModel.findById(actor.sub).lean(),
            BillingUserModel.findById(input.studentId).lean(),
            BillingLessonModel.find({ _id: { $in: input.lessonIds } }).lean(),
        ]);
        if (!teacher?.bankAccount) throw new ConflictError('Teacher bank account is required');
        if (!student || student.role !== UsersRoles.STUDENT) throw new ServiceError('Invalid student', 400, 'INVALID_STUDENT');
        if (lessons.length !== input.lessonIds.length) throw new ServiceError('One or more lessons were not found', 400, 'INVALID_LESSON');
        for (const lesson of lessons) {
            if (lesson.teacherId !== actor.sub || lesson.studentId !== input.studentId || lesson.status === 'available') {
                throw new ForbiddenError('A selected lesson does not belong to this teacher and student');
            }
            if (lesson.status === 'cancelled' && lesson.chargeStatus !== 'full') {
                throw new ConflictError('A non-chargeable cancelled lesson cannot be included');
            }
        }
        const duplicate = await PaymentRequestModel.findOne({
            status: { $in: ACTIVE_REQUEST_STATUSES },
            'lineItems.lessonId': { $in: input.lessonIds },
        })
            .select('requestNumber')
            .lean();
        if (duplicate) throw new ConflictError(`A selected lesson is already included in payment request ${duplicate.requestNumber}`);
        const lines: PaymentLineItem[] = [
            ...lessons.map(lessonLine),
            ...input.customItems.map((item) => ({
                date: item.date,
                subject: item.description,
                amount: item.amount,
                kind: 'custom' as const,
            })),
        ];
        if (lines.length === 0) throw new ServiceError('At least one lesson or custom item is required', 400, 'EMPTY_PAYMENT_REQUEST');
        return createPaymentRequestRecord({
            teacher: {
                _id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                bankAccount: teacher.bankAccount,
            },
            student,
            period: `manual-${randomUUID()}`,
            source: 'manual',
            lines,
            channels: input.channels,
            scheduledAt: input.scheduledAt ?? new Date(),
            notes: input.notes,
        });
    },

    createLessonMessage: async (input: LessonMessageInput, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const [teacher, foundLessons] = await Promise.all([
            BillingUserModel.findById(actor.sub).lean(),
            BillingLessonModel.find({ _id: { $in: input.lessonIds } }).lean(),
        ]);
        if (!teacher || teacher.role !== UsersRoles.TEACHER) throw new NotFoundError('Teacher not found');
        const lessonsById = new Map(foundLessons.map((lesson) => [lesson._id.toString(), lesson]));
        const assignedLessons = input.lessonIds.map((lessonId) => {
            const lesson = lessonsById.get(lessonId);
            if (!lesson || lesson.teacherId !== actor.sub || !lesson.studentId) {
                throw new NotFoundError('One or more assigned lessons were not found');
            }
            return { ...lesson, studentId: lesson.studentId };
        });
        const studentIds = [...new Set(assignedLessons.map((lesson) => lesson.studentId))];
        const students = await BillingUserModel.find({ _id: { $in: studentIds } }).lean();
        const studentsById = new Map(students.map((student) => [student._id.toString(), student]));
        if (assignedLessons.some((lesson) => !studentsById.has(lesson.studentId))) {
            throw new NotFoundError('One or more students were not found');
        }
        const scheduledAt = input.scheduledAt ?? new Date();
        const lessonsByStudent = new Map<string, typeof assignedLessons>();
        for (const lesson of assignedLessons) {
            lessonsByStudent.set(lesson.studentId, [...(lessonsByStudent.get(lesson.studentId) ?? []), lesson]);
        }
        const messageRecords = [];
        for (const [studentId, studentLessons] of lessonsByStudent.entries()) {
            const student = studentsById.get(studentId);
            if (!student) continue;
            const pdfData = await generateLessonMessagePdf({
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                teacherEmail: teacher.email,
                teacherPhone: teacher.phone.number,
                bank: teacher.bankAccount,
                studentName: `${student.firstName} ${student.lastName}`,
                studentEmail: student.email,
                studentPhone: student.phone.number,
                subject: input.subject,
                message: input.message,
                lessons: studentLessons,
            });
            messageRecords.push({
                teacherId: actor.sub,
                studentId,
                lessonIds: studentLessons.map((lesson) => lesson._id.toString()),
                subject: input.subject,
                message: input.message,
                pdfData,
                pdfFilename: `סיכום-שיעורים-${studentId}-${Date.now()}.pdf`,
                pdfVersion: LESSON_MESSAGE_PDF_VERSION,
                channels: input.channels,
                scheduledAt,
                status: requestStatus(scheduledAt),
            });
        }
        const messages = await LessonMessageModel.insertMany(messageRecords);
        for (const message of messages) {
            const student = studentsById.get(message.studentId);
            if (!student) continue;
            for (const channel of input.channels) {
                await queueDelivery({
                    sourceType: 'lesson_message',
                    sourceId: message._id.toString(),
                    teacherId: actor.sub,
                    studentId: message.studentId,
                    channel,
                    scheduledAt,
                    hasConsent: hasChannelConsent(student.phone, channel),
                });
            }
        }
        return messages;
    },

    queueDueReminders: async (now = new Date(), limit = 100) => {
        const queued: string[] = [];
        for (let count = 0; count < limit; count += 1) {
            const job = await BillingReminderJobModel.findOneAndUpdate(
                { status: 'pending', dueAt: { $lte: now } },
                { $set: { status: 'processing', claimedAt: now } },
                { new: true, sort: { dueAt: 1 } },
            );
            if (!job) break;
            const student = await BillingUserModel.findById(job.studentId).lean();
            if (!student) {
                await BillingReminderJobModel.updateOne({ _id: job._id }, { $set: { status: 'failed', lastError: 'Student not found' } });
                continue;
            }
            for (const channel of job.channels) {
                await queueDelivery({
                    sourceType: 'lesson_reminder',
                    sourceId: job._id.toString(),
                    teacherId: job.teacherId,
                    studentId: job.studentId,
                    channel,
                    scheduledAt: job.dueAt,
                    hasConsent: hasChannelConsent(student.phone, channel),
                });
            }
            queued.push(job._id.toString());
        }
        return { queued };
    },

    processDueDeliveries: async (now = new Date(), limit = 50) => {
        const processed: string[] = [];
        for (let count = 0; count < limit; count += 1) {
            const delivery = await DeliveryOutboxModel.findOneAndUpdate(
                { channel: DeliveryChannel.EMAIL, status: 'queued', scheduledAt: { $lte: now } },
                { $set: { status: 'processing' }, $inc: { attempts: 1 } },
                { new: true, sort: { scheduledAt: 1 } },
            );
            if (!delivery) break;
            try {
                await sendOutboxEmail(delivery.sourceType, delivery.sourceId);
                delivery.status = 'sent';
                delivery.sentAt = new Date();
                delivery.lastError = undefined;
                await delivery.save();
            } catch (error) {
                const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown delivery error';
                delivery.lastError = message;
                if (delivery.attempts >= 5) {
                    delivery.status = 'failed';
                } else if (message.includes('Gmail is not connected') || message.includes('renewed')) {
                    delivery.status = 'waiting_for_connection';
                } else {
                    delivery.status = 'queued';
                    delivery.scheduledAt = new Date(Date.now() + Math.min(60, 2 ** delivery.attempts) * 60_000);
                }
                await delivery.save();
            }
            if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
                await updateSourceStatus(delivery.sourceType, delivery.sourceId);
            }
            processed.push(delivery._id.toString());
        }
        return { processed };
    },

    listPaymentRequests: async (actor: AuthenticatedUser, period?: string) => {
        const filter =
            actor.role === UsersRoles.TEACHER ? { teacherId: actor.sub } : actor.role === UsersRoles.STUDENT ? { studentId: actor.sub } : null;
        if (!filter) throw new ForbiddenError();
        const records = await PaymentRequestModel.find({ ...filter, ...(period ? { period } : {}) })
            .select('-pdfData')
            .sort({ scheduledAt: -1, generatedAt: -1 })
            .lean();
        return addDeliveries(records, 'payment_request');
    },

    listLessonMessages: async (actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const records = await LessonMessageModel.find({ teacherId: actor.sub }).sort({ scheduledAt: -1 }).lean();
        return addDeliveries(records, 'lesson_message');
    },

    listWhatsAppReminderTasks: async (actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const deliveries = await DeliveryOutboxModel.find({
            teacherId: actor.sub,
            sourceType: 'lesson_reminder',
            channel: DeliveryChannel.WHATSAPP,
            status: { $in: ['manual_action_required', 'manual_opened', 'sent'] },
        })
            .sort({ scheduledAt: -1 })
            .limit(100)
            .lean();
        const jobs = await BillingReminderJobModel.find({ _id: { $in: deliveries.map((delivery) => delivery.sourceId) } }).lean();
        const jobsById = new Map(jobs.map((job) => [job._id.toString(), job]));
        const lessonIds = jobs.map((job) => job.lessonId);
        const studentIds = jobs.map((job) => job.studentId);
        const [lessons, students] = await Promise.all([
            BillingLessonModel.find({ _id: { $in: lessonIds } }).lean(),
            BillingUserModel.find({ _id: { $in: studentIds } }).lean(),
        ]);
        const lessonsById = new Map(lessons.map((lesson) => [lesson._id.toString(), lesson]));
        const studentsById = new Map(students.map((student) => [student._id.toString(), student]));
        return deliveries.flatMap((delivery) => {
            const job = jobsById.get(delivery.sourceId);
            const lesson = job ? lessonsById.get(job.lessonId) : undefined;
            const student = job ? studentsById.get(job.studentId) : undefined;
            if (!job || !lesson || !student) return [];
            return [
                {
                    ...withManualOpenUrl(delivery),
                    lessonId: job.lessonId,
                    reminderKind: job.kind,
                    lessonSubject: lesson.subject,
                    lessonStartTime: lesson.startTime,
                    studentName: `${student.firstName} ${student.lastName}`,
                },
            ];
        });
    },

    automaticPreview: async (actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const now = DateTime.now().setZone(ZONE);
        const excluded = await claimedLessonIds();
        const lessons = await BillingLessonModel.find({
            _id: { $nin: excluded },
            teacherId: actor.sub,
            studentId: { $exists: true },
            startTime: { $gte: now.startOf('month').toJSDate(), $lt: now.plus({ months: 1 }).startOf('month').toJSDate() },
            $or: [{ status: { $in: ['scheduled', 'completed'] } }, { status: 'cancelled', chargeStatus: 'full' }],
        }).lean();
        return {
            nextScheduledAt: now.plus({ months: 1 }).startOf('month').set({ hour: 8 }).toISO(),
            period: now.toFormat('yyyy-MM'),
            lessonCount: lessons.length,
            estimatedTotal: lessons.reduce((sum, lesson) => sum + lesson.price, 0),
            studentCount: new Set(lessons.map((lesson) => lesson.studentId).filter(Boolean)).size,
        };
    },

    cancelPaymentRequest: async (id: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const request = await PaymentRequestModel.findOne({ _id: id, teacherId: actor.sub });
        if (!request) throw new NotFoundError('Payment request not found');
        if (!['scheduled', 'pending_delivery', 'failed'].includes(request.status)) {
            throw new ConflictError('A delivered payment request cannot be cancelled');
        }
        request.status = 'cancelled';
        request.cancelledAt = new Date();
        await request.save();
        await DeliveryOutboxModel.updateMany(
            { sourceType: 'payment_request', sourceId: id, status: { $nin: ['sent', 'cancelled'] } },
            { $set: { status: 'cancelled' } },
        );
        return request;
    },

    cancelLessonMessage: async (id: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const message = await LessonMessageModel.findOne({ _id: id, teacherId: actor.sub });
        if (!message) throw new NotFoundError('Lesson message not found');
        if (!['scheduled', 'pending_delivery', 'failed'].includes(message.status)) {
            throw new ConflictError('A delivered lesson message cannot be cancelled');
        }
        message.status = 'cancelled';
        message.cancelledAt = new Date();
        await message.save();
        await DeliveryOutboxModel.updateMany(
            { sourceType: 'lesson_message', sourceId: id, status: { $nin: ['sent', 'cancelled'] } },
            { $set: { status: 'cancelled' } },
        );
        return message;
    },

    getWhatsAppLink: async (deliveryId: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const delivery = await DeliveryOutboxModel.findOne({
            _id: deliveryId,
            teacherId: actor.sub,
            channel: DeliveryChannel.WHATSAPP,
            status: { $in: ['manual_action_required', 'manual_opened'] },
            scheduledAt: { $lte: new Date() },
        });
        if (!delivery) throw new NotFoundError('WhatsApp delivery is not ready');
        const student = await BillingUserModel.findById(delivery.studentId).lean();
        if (!student?.phone.number) throw new ConflictError('Student phone number is missing');
        const text = await manualDeliveryText(delivery, student);
        delivery.status = 'manual_opened';
        await delivery.save();
        if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
            await updateSourceStatus(delivery.sourceType, delivery.sourceId);
        }
        return { url: whatsappUrl(student.phone.number, text) };
    },

    openManualDeliveryLink: async (deliveryId: string, token: string) => {
        verifyManualDeliveryToken(deliveryId, token);
        const delivery = await DeliveryOutboxModel.findOne({
            _id: deliveryId,
            channel: { $in: [DeliveryChannel.WHATSAPP, DeliveryChannel.SMS] },
            status: { $in: ['manual_action_required', 'manual_opened'] },
            scheduledAt: { $lte: new Date() },
        });
        if (!delivery) throw new NotFoundError('Manual delivery is not ready');
        const student = await BillingUserModel.findById(delivery.studentId).lean();
        if (!student?.phone.number) throw new ConflictError('Student phone number is missing');
        const text = await manualDeliveryText(delivery, student);
        delivery.status = 'manual_opened';
        await delivery.save();
        if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
            await updateSourceStatus(delivery.sourceType, delivery.sourceId);
        }
        return delivery.channel === DeliveryChannel.WHATSAPP ? whatsappUrl(student.phone.number, text) : smsUrl(student.phone.number, text);
    },

    confirmWhatsAppSent: async (deliveryId: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const delivery = await DeliveryOutboxModel.findOne({
            _id: deliveryId,
            teacherId: actor.sub,
            channel: DeliveryChannel.WHATSAPP,
            status: 'manual_opened',
        });
        if (!delivery) throw new ConflictError('Open the WhatsApp message before marking it as sent');
        delivery.status = 'sent';
        delivery.sentAt = new Date();
        await delivery.save();
        if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
            await updateSourceStatus(delivery.sourceType, delivery.sourceId);
        }
        return delivery;
    },

    getSmsLink: async (deliveryId: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const delivery = await DeliveryOutboxModel.findOne({
            _id: deliveryId,
            teacherId: actor.sub,
            channel: DeliveryChannel.SMS,
            status: { $in: ['manual_action_required', 'manual_opened'] },
            scheduledAt: { $lte: new Date() },
        });
        if (!delivery) throw new NotFoundError('SMS delivery is not ready');
        const student = await BillingUserModel.findById(delivery.studentId).lean();
        if (!student?.phone.number) throw new ConflictError('Student phone number is missing');
        const text = await manualDeliveryText(delivery, student);
        delivery.status = 'manual_opened';
        await delivery.save();
        if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
            await updateSourceStatus(delivery.sourceType, delivery.sourceId);
        }
        return { url: smsUrl(student.phone.number, text) };
    },

    confirmSmsSent: async (deliveryId: string, actor: AuthenticatedUser) => {
        assertTeacher(actor);
        const delivery = await DeliveryOutboxModel.findOne({
            _id: deliveryId,
            teacherId: actor.sub,
            channel: DeliveryChannel.SMS,
            status: 'manual_opened',
        });
        if (!delivery) throw new ConflictError('Open the SMS before marking it as sent');
        delivery.status = 'sent';
        delivery.sentAt = new Date();
        await delivery.save();
        if (delivery.sourceType === 'payment_request' || delivery.sourceType === 'lesson_message') {
            await updateSourceStatus(delivery.sourceType, delivery.sourceId);
        }
        return delivery;
    },

    getPaymentRequestPdf: async (id: string, actor: AuthenticatedUser) => {
        const request = await PaymentRequestModel.findById(id).select('+pdfData');
        if (!request) throw new NotFoundError('Payment request not found');
        const allowed =
            actor.role === UsersRoles.TEACHER
                ? request.teacherId === actor.sub
                : actor.role === UsersRoles.STUDENT && request.studentId === actor.sub;
        if (!allowed) throw new ForbiddenError();
        if (!request.pdfData) throw new NotFoundError('Payment request PDF not found');
        return { data: request.pdfData, filename: request.pdfFilename ?? 'payment-request.pdf' };
    },

    getLessonMessagePdf: async (id: string, actor: AuthenticatedUser) => {
        const message = await LessonMessageModel.findById(id).select('+pdfData');
        if (!message) throw new NotFoundError('Lesson message not found');
        const allowed =
            actor.role === UsersRoles.TEACHER
                ? message.teacherId === actor.sub
                : actor.role === UsersRoles.STUDENT && message.studentId === actor.sub;
        if (!allowed) throw new ForbiddenError();
        if (!message.pdfData || message.pdfData.length === 0 || message.pdfVersion !== LESSON_MESSAGE_PDF_VERSION) {
            const [teacher, student, lessons] = await Promise.all([
                BillingUserModel.findById(message.teacherId).lean(),
                BillingUserModel.findById(message.studentId).lean(),
                BillingLessonModel.find({ _id: { $in: messageLessonIds(message) } })
                    .sort({ startTime: 1 })
                    .lean(),
            ]);
            if (!teacher || !student) throw new NotFoundError('Lesson message participant not found');
            message.pdfData = await generateLessonMessagePdf({
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                teacherEmail: teacher.email,
                teacherPhone: teacher.phone.number,
                bank: teacher.bankAccount,
                studentName: `${student.firstName} ${student.lastName}`,
                studentEmail: student.email,
                studentPhone: student.phone.number,
                subject: message.subject,
                message: message.message,
                lessons,
            });
            message.pdfFilename = `סיכום-שיעורים-${message._id.toString()}.pdf`;
            message.pdfVersion = LESSON_MESSAGE_PDF_VERSION;
            await message.save();
        }
        return { data: message.pdfData, filename: message.pdfFilename ?? 'lesson-summary.pdf' };
    },

    getPublicPaymentRequestPdf: async (id: string, token: string) => {
        verifyPaymentDocumentToken(id, token);
        const request = await PaymentRequestModel.findById(id).select('+pdfData');
        if (!request?.pdfData || request.status === 'cancelled') throw new NotFoundError('Payment request PDF not found');
        return { data: request.pdfData, filename: request.pdfFilename ?? 'payment-request.pdf' };
    },

    getPublicLessonMessagePdf: async (id: string, token: string) => {
        verifyLessonMessageDocumentToken(id, token);
        const message = await LessonMessageModel.findById(id).select('+pdfData');
        if (!message || message.status === 'cancelled') throw new NotFoundError('Lesson message PDF not found');
        if (!message.pdfData || message.pdfData.length === 0 || message.pdfVersion !== LESSON_MESSAGE_PDF_VERSION) {
            const [teacher, student, lessons] = await Promise.all([
                BillingUserModel.findById(message.teacherId).lean(),
                BillingUserModel.findById(message.studentId).lean(),
                BillingLessonModel.find({ _id: { $in: messageLessonIds(message) } })
                    .sort({ startTime: 1 })
                    .lean(),
            ]);
            if (!teacher || !student) throw new NotFoundError('Lesson message participant not found');
            message.pdfData = await generateLessonMessagePdf({
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                teacherEmail: teacher.email,
                teacherPhone: teacher.phone.number,
                bank: teacher.bankAccount,
                studentName: `${student.firstName} ${student.lastName}`,
                studentEmail: student.email,
                studentPhone: student.phone.number,
                subject: message.subject,
                message: message.message,
                lessons,
            });
            message.pdfFilename = `סיכום-שיעורים-${message._id.toString()}.pdf`;
            message.pdfVersion = LESSON_MESSAGE_PDF_VERSION;
            await message.save();
        }
        return { data: message.pdfData, filename: message.pdfFilename ?? 'lesson-summary.pdf' };
    },
};
