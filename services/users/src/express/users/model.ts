import { MongoCollections, UsersRoles } from '@scholarly/shared';
import mongoose from 'mongoose';
import type { UserRecord } from './interface';

const phoneSchema = new mongoose.Schema(
    {
        number: { type: String },
        allowWhatsApp: { type: Boolean, default: true },
        allowSMS: { type: Boolean, default: true },
    },
    { _id: false },
);

const subjectSettingSchema = new mongoose.Schema(
    {
        subject: { type: String, required: true, trim: true },
        durationMinutes: { type: Number, min: 15, max: 240 },
        price: { type: Number, min: 1 },
    },
    { _id: false },
);

const teacherPreferencesSchema = new mongoose.Schema(
    {
        defaultLessonDurationMinutes: { type: Number, required: true, min: 15, max: 240 },
        defaultLessonPrice: { type: Number, required: true, min: 1 },
        subjectSettings: { type: [subjectSettingSchema], default: [] },
        paymentRequestChannels: {
            type: [String],
            enum: ['email', 'whatsapp', 'sms'],
            required: true,
        },
        reminderChannels: {
            type: [String],
            enum: ['email', 'whatsapp'],
            required: true,
        },
        timezone: { type: String, required: true, default: 'Asia/Jerusalem' },
    },
    { _id: false },
);

const userSchema = new mongoose.Schema<UserRecord>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: {
            type: phoneSchema,
            required: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(UsersRoles),
            required: true,
        },
    },
    {
        timestamps: true,
        discriminatorKey: 'role',
        toJSON: {
            transform: (_document, returnedObject) => {
                Reflect.deleteProperty(returnedObject, 'passwordHash');
                return returnedObject;
            },
        },
        toObject: {
            transform: (_document, returnedObject) => {
                Reflect.deleteProperty(returnedObject, 'passwordHash');
                return returnedObject;
            },
        },
    },
);

const teacherSchema = new mongoose.Schema<UserRecord>({
    bankAccount: {
        bankName: { type: String, required: true },
        branchNumber: { type: String, required: true },
        accountNumber: { type: String, required: true },
    },
    teacherPreferences: { type: teacherPreferencesSchema },
});

export const UserModel = mongoose.model<UserRecord>('User', userSchema, MongoCollections.USERS);

export const StudentModel = UserModel.discriminator<UserRecord>(UsersRoles.STUDENT, new mongoose.Schema<UserRecord>());

export const TeacherModel = UserModel.discriminator<UserRecord>(UsersRoles.TEACHER, teacherSchema);
