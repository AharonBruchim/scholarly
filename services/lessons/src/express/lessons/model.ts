import mongoose from 'mongoose';
import { config } from '../../config';
import { type LessonDocument, LessonStatus } from './interface';

const lessonSchema = new mongoose.Schema<LessonDocument>(
    {
        studentId: {
            type: String,
            required: true,
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
    },
    {
        timestamps: true,
    },
);

export const LessonModel = mongoose.model<LessonDocument>('Lesson', lessonSchema);
