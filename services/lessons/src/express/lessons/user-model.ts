import type { ITeacherPreferences } from '@scholarly/shared';
import mongoose from 'mongoose';
import { config } from '../../config';

export interface LessonUserRecord {
    _id: mongoose.Types.ObjectId;
    role: 'student' | 'teacher';
    teacherPreferences?: ITeacherPreferences;
}

const lessonUserSchema = new mongoose.Schema<LessonUserRecord>(
    {
        role: { type: String, required: true },
        teacherPreferences: { type: mongoose.Schema.Types.Mixed },
    },
    { strict: false, collection: config.mongo.usersCollectionName },
);

export const LessonUserModel =
    (mongoose.models.LessonUser as mongoose.Model<LessonUserRecord> | undefined) ??
    mongoose.model<LessonUserRecord>('LessonUser', lessonUserSchema, config.mongo.usersCollectionName);
