import { type ITeacherPreferences, MongoCollections } from '@scholarly/shared';
import mongoose from 'mongoose';

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
    { strict: false, collection: MongoCollections.USERS },
);

export const LessonUserModel =
    (mongoose.models.LessonUser as mongoose.Model<LessonUserRecord> | undefined) ??
    mongoose.model<LessonUserRecord>('LessonUser', lessonUserSchema, MongoCollections.USERS);
