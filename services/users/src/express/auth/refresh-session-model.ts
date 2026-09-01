import mongoose from 'mongoose';

export interface RefreshSessionRecord {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}

const refreshSessionSchema = new mongoose.Schema<RefreshSessionRecord>(
    {
        userId: { type: String, required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, expires: 0 },
    },
    { timestamps: true },
);

export const RefreshSessionModel = mongoose.model<RefreshSessionRecord>('refresh_sessions', refreshSessionSchema);
