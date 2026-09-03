import { DeliveryChannel, type ITeacherPreferences, type IUserPhone } from '@scholarly/shared';
import mongoose from 'mongoose';
import { config } from '../../config';

export interface BillingUserRecord {
    _id: mongoose.Types.ObjectId;
    role: 'teacher' | 'student';
    firstName: string;
    lastName: string;
    email: string;
    phone: IUserPhone;
    bankAccount?: { bankName: string; branchNumber: string; accountNumber: string };
    teacherPreferences?: ITeacherPreferences;
}

export interface BillingLessonRecord {
    _id: mongoose.Types.ObjectId;
    teacherId: string;
    studentId?: string;
    startTime: Date;
    endTime: Date;
    subject: string;
    price: number;
    durationMinutes: number;
    status: 'available' | 'scheduled' | 'completed' | 'cancelled';
    chargeStatus: 'none' | 'full';
}

const looseSchema = new mongoose.Schema({}, { strict: false });
export const BillingUserModel = mongoose.model<BillingUserRecord>('BillingUser', looseSchema, config.mongo.usersCollectionName);
export const BillingLessonModel = mongoose.model<BillingLessonRecord>('BillingLesson', looseSchema, 'lessons');

export interface PaymentLineItem {
    lessonId?: string;
    date?: Date;
    subject: string;
    durationMinutes?: number;
    amount: number;
    kind: 'completed' | 'late_cancellation' | 'custom';
}

export interface PaymentRequestRecord {
    teacherId: string;
    studentId: string;
    period: string;
    source: 'automatic' | 'manual';
    requestNumber: string;
    notes?: string;
    lineItems: PaymentLineItem[];
    total: number;
    channels: DeliveryChannel[];
    status: 'scheduled' | 'pending_delivery' | 'partially_delivered' | 'delivered' | 'failed' | 'cancelled';
    pdfData?: Buffer;
    pdfFilename?: string;
    scheduledAt: Date;
    generatedAt: Date;
    cancelledAt?: Date;
}

const paymentRequestSchema = new mongoose.Schema<PaymentRequestRecord>(
    {
        teacherId: { type: String, required: true },
        studentId: { type: String, required: true },
        period: { type: String, required: true },
        source: { type: String, enum: ['automatic', 'manual'], default: 'automatic', required: true },
        requestNumber: { type: String, required: true },
        notes: { type: String, maxlength: 2000 },
        lineItems: {
            type: [
                new mongoose.Schema<PaymentLineItem>(
                    {
                        lessonId: { type: String },
                        date: { type: Date },
                        subject: { type: String, required: true },
                        durationMinutes: { type: Number },
                        amount: { type: Number, required: true },
                        kind: { type: String, enum: ['completed', 'late_cancellation', 'custom'], required: true },
                    },
                    { _id: false },
                ),
            ],
            required: true,
        },
        total: { type: Number, required: true },
        channels: { type: [String], enum: Object.values(DeliveryChannel), required: true },
        status: {
            type: String,
            enum: ['scheduled', 'pending_delivery', 'partially_delivered', 'delivered', 'failed', 'cancelled'],
            default: 'pending_delivery',
        },
        pdfData: { type: Buffer, select: false },
        pdfFilename: { type: String },
        scheduledAt: { type: Date, required: true },
        generatedAt: { type: Date, required: true },
        cancelledAt: { type: Date },
    },
    { timestamps: true },
);
paymentRequestSchema.index({ teacherId: 1, studentId: 1, period: 1 }, { unique: true });
export const PaymentRequestModel = mongoose.model<PaymentRequestRecord>('PaymentRequest', paymentRequestSchema);

export interface DeliveryOutboxRecord {
    sourceType: 'payment_request' | 'lesson_reminder' | 'lesson_message';
    sourceId: string;
    teacherId: string;
    studentId: string;
    channel: DeliveryChannel;
    status:
        | 'waiting_for_connection'
        | 'queued'
        | 'processing'
        | 'manual_action_required'
        | 'manual_opened'
        | 'sent'
        | 'failed'
        | 'skipped_no_consent'
        | 'cancelled';
    scheduledAt: Date;
    sentAt?: Date;
    attempts: number;
    lastError?: string;
}

const deliveryOutboxSchema = new mongoose.Schema<DeliveryOutboxRecord>(
    {
        sourceType: { type: String, enum: ['payment_request', 'lesson_reminder', 'lesson_message'], required: true },
        sourceId: { type: String, required: true },
        teacherId: { type: String, required: true },
        studentId: { type: String, required: true },
        channel: { type: String, enum: Object.values(DeliveryChannel), required: true },
        status: {
            type: String,
            enum: [
                'waiting_for_connection',
                'queued',
                'processing',
                'manual_action_required',
                'manual_opened',
                'sent',
                'failed',
                'skipped_no_consent',
                'cancelled',
            ],
            required: true,
        },
        scheduledAt: { type: Date, required: true },
        sentAt: { type: Date },
        attempts: { type: Number, default: 0 },
        lastError: { type: String },
    },
    { timestamps: true },
);
deliveryOutboxSchema.index({ sourceType: 1, sourceId: 1, channel: 1 }, { unique: true });
deliveryOutboxSchema.index({ status: 1, scheduledAt: 1 });
export const DeliveryOutboxModel = mongoose.model<DeliveryOutboxRecord>('DeliveryOutbox', deliveryOutboxSchema);

export interface SenderConnectionRecord {
    teacherId: string;
    channel: DeliveryChannel;
    provider: 'google';
    senderAddress: string;
    status: 'connected' | 'expired' | 'revoked';
    encryptedRefreshToken?: string;
    encryptionIv?: string;
    encryptionTag?: string;
    connectedAt?: Date;
}

const senderConnectionSchema = new mongoose.Schema<SenderConnectionRecord>(
    {
        teacherId: { type: String, required: true },
        channel: { type: String, enum: Object.values(DeliveryChannel), required: true },
        provider: { type: String, enum: ['google'], required: true },
        senderAddress: { type: String, required: true },
        status: { type: String, enum: ['connected', 'expired', 'revoked'], required: true },
        encryptedRefreshToken: { type: String, select: false },
        encryptionIv: { type: String, select: false },
        encryptionTag: { type: String, select: false },
        connectedAt: { type: Date },
    },
    { timestamps: true },
);
senderConnectionSchema.index({ teacherId: 1, channel: 1 }, { unique: true });
export const SenderConnectionModel = mongoose.model<SenderConnectionRecord>('SenderConnection', senderConnectionSchema);

export interface OAuthStateRecord {
    stateHash: string;
    teacherId: string;
    expiresAt: Date;
}

const oauthStateSchema = new mongoose.Schema<OAuthStateRecord>(
    {
        stateHash: { type: String, required: true, unique: true },
        teacherId: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
);
oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OAuthStateModel = mongoose.model<OAuthStateRecord>('OAuthState', oauthStateSchema);

export interface LessonMessageRecord {
    teacherId: string;
    studentId: string;
    lessonId?: string;
    lessonIds?: string[];
    subject: string;
    message: string;
    pdfData?: Buffer;
    pdfFilename?: string;
    pdfVersion?: number;
    channels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP | DeliveryChannel.SMS>;
    scheduledAt: Date;
    status: 'scheduled' | 'pending_delivery' | 'partially_delivered' | 'delivered' | 'failed' | 'cancelled';
    cancelledAt?: Date;
}

const lessonMessageSchema = new mongoose.Schema<LessonMessageRecord>(
    {
        teacherId: { type: String, required: true },
        studentId: { type: String, required: true },
        lessonId: { type: String },
        lessonIds: { type: [String], default: [] },
        subject: { type: String, required: true, maxlength: 200 },
        message: { type: String, required: true, maxlength: 4000 },
        pdfData: { type: Buffer, select: false },
        pdfFilename: { type: String },
        pdfVersion: { type: Number },
        channels: {
            type: [String],
            enum: [DeliveryChannel.EMAIL, DeliveryChannel.WHATSAPP, DeliveryChannel.SMS],
            required: true,
        },
        scheduledAt: { type: Date, required: true },
        status: {
            type: String,
            enum: ['scheduled', 'pending_delivery', 'partially_delivered', 'delivered', 'failed', 'cancelled'],
            required: true,
        },
        cancelledAt: { type: Date },
    },
    { timestamps: true },
);
lessonMessageSchema.index({ teacherId: 1, scheduledAt: -1 });
export const LessonMessageModel = mongoose.model<LessonMessageRecord>('LessonMessage', lessonMessageSchema);

export interface ReminderJobRecord {
    lessonId: string;
    teacherId: string;
    studentId: string;
    kind: 'thirty_hours' | 'thirty_minutes';
    dueAt: Date;
    channels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP>;
    status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
}
export const BillingReminderJobModel = mongoose.model<ReminderJobRecord>('BillingReminderJob', looseSchema, 'reminderjobs');
