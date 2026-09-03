import { DeliveryChannel, MongoCollections } from '@scholarly/shared';
import mongoose from 'mongoose';

export enum ReminderKind {
    THIRTY_HOURS = 'thirty_hours',
    THIRTY_MINUTES = 'thirty_minutes',
}

export enum ReminderJobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SENT = 'sent',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export interface ReminderJobRecord {
    lessonId: string;
    teacherId: string;
    studentId: string;
    kind: ReminderKind;
    dueAt: Date;
    channels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP>;
    status: ReminderJobStatus;
    attempts: number;
    claimedAt?: Date;
    sentAt?: Date;
    lastError?: string;
}

const reminderJobSchema = new mongoose.Schema<ReminderJobRecord>(
    {
        lessonId: { type: String, required: true },
        teacherId: { type: String, required: true },
        studentId: { type: String, required: true },
        kind: { type: String, enum: Object.values(ReminderKind), required: true },
        dueAt: { type: Date, required: true },
        channels: { type: [String], enum: [DeliveryChannel.EMAIL, DeliveryChannel.WHATSAPP], required: true },
        status: { type: String, enum: Object.values(ReminderJobStatus), default: ReminderJobStatus.PENDING },
        attempts: { type: Number, default: 0 },
        claimedAt: { type: Date },
        sentAt: { type: Date },
        lastError: { type: String },
    },
    { timestamps: true },
);

reminderJobSchema.index({ lessonId: 1, kind: 1 }, { unique: true });
reminderJobSchema.index({ status: 1, dueAt: 1 });

export const ReminderJobModel = mongoose.model<ReminderJobRecord>('ReminderJob', reminderJobSchema, MongoCollections.LESSON_REMINDER_JOBS);
