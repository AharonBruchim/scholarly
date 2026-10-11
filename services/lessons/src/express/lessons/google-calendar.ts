import { createDecipheriv, scryptSync } from 'node:crypto';
import { DeliveryChannel, MongoCollections } from '@scholarly/shared';
import { ServiceError } from '@scholarly/utils';
import mongoose from 'mongoose';
import type { LessonDocument } from './interface';
import type { LessonUserRecord } from './user-model';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface SenderConnectionRecord {
    teacherId: string;
    channel: DeliveryChannel;
    provider: 'google';
    senderAddress: string;
    status: 'connected' | 'expired' | 'revoked';
    encryptedRefreshToken?: string;
    encryptionIv?: string;
    encryptionTag?: string;
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
    },
    { timestamps: true },
);

const SenderConnectionModel =
    (mongoose.models.LessonSenderConnection as mongoose.Model<SenderConnectionRecord> | undefined) ??
    mongoose.model<SenderConnectionRecord>('LessonSenderConnection', senderConnectionSchema, MongoCollections.BILLING_SENDER_CONNECTIONS);

function oauthConfig() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new ServiceError('Google OAuth is not configured', 503, 'GOOGLE_OAUTH_NOT_CONFIGURED');
    }
    return { clientId, clientSecret };
}

function encryptionKey(): Buffer {
    const material = process.env.TOKEN_ENCRYPTION_KEY ?? process.env.JWT_SECRET;
    if (!material || material.length < 32) {
        throw new ServiceError('Token encryption is not configured', 503, 'TOKEN_ENCRYPTION_NOT_CONFIGURED');
    }
    return scryptSync(material, 'scholarly-gmail-refresh-token-v1', 32);
}

function decryptToken(connection: { encryptedRefreshToken?: string; encryptionIv?: string; encryptionTag?: string }): string {
    if (!connection.encryptedRefreshToken || !connection.encryptionIv || !connection.encryptionTag) {
        throw new ServiceError('Google connection must be renewed', 409, 'GOOGLE_RECONNECT_REQUIRED');
    }
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(connection.encryptionIv, 'base64'));
    decipher.setAuthTag(Buffer.from(connection.encryptionTag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(connection.encryptedRefreshToken, 'base64')), decipher.final()]).toString('utf8');
}

async function googleRequest<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const body = await response.text();
        throw new ServiceError(`Google API request failed (${response.status}): ${body.slice(0, 300)}`, 502, 'GOOGLE_API_ERROR');
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}

async function accessTokenForTeacher(teacherId: string): Promise<string> {
    const connection = await SenderConnectionModel.findOne({
        teacherId,
        channel: DeliveryChannel.EMAIL,
        provider: 'google',
        status: 'connected',
    }).select('+encryptedRefreshToken +encryptionIv +encryptionTag');
    if (!connection) throw new ServiceError('Google Calendar is not connected', 409, 'GOOGLE_CALENDAR_NOT_CONNECTED');
    const refreshToken = decryptToken(connection);
    const { clientId, clientSecret } = oauthConfig();
    try {
        const token = await googleRequest<{ access_token: string }>(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        return token.access_token;
    } catch (error) {
        await SenderConnectionModel.updateOne({ _id: connection._id }, { $set: { status: 'expired' } });
        throw error;
    }
}

export async function createGoogleCalendarMeeting(input: {
    lesson: LessonDocument;
    teacher: LessonUserRecord;
    student: LessonUserRecord;
    timezone: string;
}): Promise<{ eventId: string; meetingUrl?: string } | null> {
    if (!input.teacher.email || !input.student.email) return null;
    try {
        const accessToken = await accessTokenForTeacher(input.lesson.teacherId);
        const response = await googleRequest<{ id: string; hangoutLink?: string; conferenceData?: { entryPoints?: Array<{ uri?: string }> } }>(
            `${GOOGLE_CALENDAR_EVENTS_URL}?conferenceDataVersion=1&sendUpdates=all`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary: input.lesson.subject,
                    description: input.lesson.notes,
                    start: { dateTime: input.lesson.startTime.toISOString(), timeZone: input.timezone },
                    end: { dateTime: input.lesson.endTime.toISOString(), timeZone: input.timezone },
                    attendees: [{ email: input.student.email }],
                    conferenceData: {
                        createRequest: {
                            requestId: `scholarly-${input.lesson._id.toString()}`,
                            conferenceSolutionKey: { type: 'hangoutsMeet' },
                        },
                    },
                }),
            },
        );
        const entryPoint = response.conferenceData?.entryPoints?.find((item) => item.uri)?.uri;
        return { eventId: response.id, meetingUrl: response.hangoutLink ?? entryPoint };
    } catch {
        return null;
    }
}

export async function deleteGoogleCalendarEvent(teacherId: string, eventId?: string): Promise<void> {
    if (!eventId) return;
    try {
        const accessToken = await accessTokenForTeacher(teacherId);
        await googleRequest<void>(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(eventId)}?sendUpdates=all`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch {
    }
}
