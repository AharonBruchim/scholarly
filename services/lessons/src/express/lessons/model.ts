import mongoose from 'mongoose';
import { config } from '../../config';
import { type LessonDocument, LessonChargeStatus, LessonStatus } from './interface';

const lessonSchema = new mongoose.Schema<LessonDocument>(
    {
        studentId: {
            type: String,
            ref: config.mongo.usersCollectionName,
        },
        teacherId: {
            type: String,
            required: true,
            ref: config.mongo.usersCollectionName,
        },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        subject: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(LessonStatus),
            default: LessonStatus.SCHEDULED,
            required: true,
        },
        price: { type: Number, required: true },
        notes: { type: String },
        durationMinutes: { type: Number, required: true, min: 15, max: 240 },
        chargeStatus: {
            type: String,
            enum: Object.values(LessonChargeStatus),
            default: LessonChargeStatus.NONE,
            required: true,
        },
        cancelledAt: { type: Date },
        cancelledBy: { type: String },
        cancellationReason: { type: String, maxlength: 500 },
        rescheduledFromLessonId: { type: String },
        rescheduledToLessonId: { type: String },
    },
    {
        timestamps: true,
    },
);

lessonSchema.index({ teacherId: 1, status: 1, startTime: 1, endTime: 1 });
lessonSchema.index({ studentId: 1, status: 1, startTime: 1, endTime: 1 });

export const LessonModel = mongoose.model<LessonDocument>('Lesson', lessonSchema);
