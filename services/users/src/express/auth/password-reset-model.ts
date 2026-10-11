import { MongoCollections } from '@scholarly/shared';
import mongoose from 'mongoose';

export interface PasswordResetRecord {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date;
}

const passwordResetSchema = new mongoose.Schema<PasswordResetRecord>(
    {
        userId: { type: String, required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, expires: 0 },
        usedAt: { type: Date },
    },
    { timestamps: true },
);

export const PasswordResetModel = mongoose.model<PasswordResetRecord>(
    'PasswordReset',
    passwordResetSchema,
    MongoCollections.USER_PASSWORD_RESETS,
);
