import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { DeliveryChannel, UsersRoles } from '@scholarly/shared';
import type { AuthenticatedUser } from '@scholarly/utils';
import { ForbiddenError, ServiceError } from '@scholarly/utils';
import { BillingUserModel, DeliveryOutboxModel, OAuthStateModel, SenderConnectionModel } from './model';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const GOOGLE_SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send'];

function oauthConfig() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? 'http://localhost:3000/api/billing/automation/google/callback';
    if (!clientId || !clientSecret) {
        throw new ServiceError('Google OAuth is not configured', 503, 'GOOGLE_OAUTH_NOT_CONFIGURED');
    }
    return { clientId, clientSecret, redirectUri };
}

function encryptionKey(): Buffer {
    const material = process.env.TOKEN_ENCRYPTION_KEY ?? process.env.JWT_SECRET;
    if (!material || material.length < 32) {
        throw new ServiceError('Token encryption is not configured', 503, 'TOKEN_ENCRYPTION_NOT_CONFIGURED');
    }
    return scryptSync(material, 'scholarly-gmail-refresh-token-v1', 32);
}

function encryptToken(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return {
        encryptedRefreshToken: encrypted.toString('base64'),
        encryptionIv: iv.toString('base64'),
        encryptionTag: cipher.getAuthTag().toString('base64'),
    };
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
    return (await response.json()) as T;
}

function base64Url(value: Buffer | string): string {
    return Buffer.from(value).toString('base64url');
}

function mimeWord(value: string): string {
    return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

export function buildMime(input: { to: string; subject: string; html: string; pdf?: Buffer; pdfFilename?: string }): string {
    const boundary = `scholarly-${randomBytes(12).toString('hex')}`;
    const lines = [
        `To: ${input.to}`,
        `Subject: ${mimeWord(input.subject)}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(input.html).toString('base64'),
    ];
    if (input.pdf) {
        const pdfFilename = input.pdfFilename ?? 'payment-request.pdf';
        const encodedFilename = encodeURIComponent(pdfFilename);
        lines.push(
            `--${boundary}`,
            `Content-Type: application/pdf; name*=UTF-8''${encodedFilename}`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename*=UTF-8''${encodedFilename}`,
            '',
            input.pdf.toString('base64'),
        );
    }
    lines.push(`--${boundary}--`, '');
    return lines.join('\r\n');
}

async function accessTokenForTeacher(teacherId: string): Promise<string> {
    const connection = await SenderConnectionModel.findOne({
        teacherId,
        channel: DeliveryChannel.EMAIL,
        provider: 'google',
        status: 'connected',
    }).select('+encryptedRefreshToken +encryptionIv +encryptionTag');
    if (!connection) throw new ServiceError('Gmail is not connected', 409, 'GMAIL_NOT_CONNECTED');
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

export const GmailManager = {
    connectionStatus: async (actor: AuthenticatedUser) => {
        if (actor.role !== UsersRoles.TEACHER) throw new ForbiddenError();
        const connection = await SenderConnectionModel.findOne({ teacherId: actor.sub, channel: DeliveryChannel.EMAIL })
            .select('senderAddress status connectedAt')
            .lean();
        return {
            configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET),
            connected: connection?.status === 'connected',
            senderAddress: connection?.senderAddress,
            status: connection?.status ?? 'not_connected',
            connectedAt: connection?.connectedAt,
        };
    },

    authorizationUrl: async (actor: AuthenticatedUser) => {
        if (actor.role !== UsersRoles.TEACHER) throw new ForbiddenError();
        const { clientId, redirectUri } = oauthConfig();
        const state = randomBytes(32).toString('base64url');
        await OAuthStateModel.create({
            stateHash: createHash('sha256').update(state).digest('hex'),
            teacherId: actor.sub,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        const url = new URL(GOOGLE_AUTH_URL);
        url.search = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            scope: GOOGLE_SCOPES.join(' '),
            state,
        }).toString();
        return { url: url.toString() };
    },

    completeAuthorization: async (code: string, state: string) => {
        const stateHash = createHash('sha256').update(state).digest('hex');
        const storedState = await OAuthStateModel.findOneAndDelete({ stateHash, expiresAt: { $gt: new Date() } });
        if (!storedState) throw new ServiceError('Invalid or expired OAuth state', 400, 'INVALID_OAUTH_STATE');
        const { clientId, clientSecret, redirectUri } = oauthConfig();
        const tokens = await googleRequest<{ access_token: string; refresh_token?: string }>(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const profile = await googleRequest<{ email: string; email_verified?: boolean }>(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!profile.email || profile.email_verified === false) {
            throw new ServiceError('Google account email is not verified', 400, 'GOOGLE_EMAIL_NOT_VERIFIED');
        }
        const teacher = await BillingUserModel.findById(storedState.teacherId).select('email role').lean();
        if (!teacher || teacher.role !== UsersRoles.TEACHER || teacher.email.toLowerCase() !== profile.email.toLowerCase()) {
            throw new ServiceError('Connect the same Gmail address saved in the teacher profile', 409, 'GOOGLE_EMAIL_MISMATCH');
        }
        const existing = await SenderConnectionModel.findOne({
            teacherId: storedState.teacherId,
            channel: DeliveryChannel.EMAIL,
        }).select('+encryptedRefreshToken +encryptionIv +encryptionTag');
        const encrypted = tokens.refresh_token
            ? encryptToken(tokens.refresh_token)
            : existing?.encryptedRefreshToken && existing.encryptionIv && existing.encryptionTag
              ? {
                    encryptedRefreshToken: existing.encryptedRefreshToken,
                    encryptionIv: existing.encryptionIv,
                    encryptionTag: existing.encryptionTag,
                }
              : null;
        if (!encrypted) throw new ServiceError('Google did not return offline access; reconnect Gmail', 409, 'GOOGLE_REFRESH_TOKEN_MISSING');
        await SenderConnectionModel.updateOne(
            { teacherId: storedState.teacherId, channel: DeliveryChannel.EMAIL },
            {
                $set: {
                    provider: 'google',
                    senderAddress: profile.email.toLowerCase(),
                    status: 'connected',
                    connectedAt: new Date(),
                    ...encrypted,
                },
            },
            { upsert: true },
        );
        await DeliveryOutboxModel.updateMany(
            { teacherId: storedState.teacherId, channel: DeliveryChannel.EMAIL, status: 'waiting_for_connection' },
            { $set: { status: 'queued' } },
        );
        return { teacherId: storedState.teacherId, email: profile.email };
    },

    disconnect: async (actor: AuthenticatedUser) => {
        if (actor.role !== UsersRoles.TEACHER) throw new ForbiddenError();
        const connection = await SenderConnectionModel.findOne({
            teacherId: actor.sub,
            channel: DeliveryChannel.EMAIL,
        }).select('+encryptedRefreshToken +encryptionIv +encryptionTag');
        if (connection?.encryptedRefreshToken) {
            try {
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ token: decryptToken(connection) }),
                });
            } catch {
                // Local revocation still prevents any future use by Scholarly.
            }
        }
        await SenderConnectionModel.updateOne(
            { teacherId: actor.sub, channel: DeliveryChannel.EMAIL },
            {
                $set: { status: 'revoked' },
                $unset: { encryptedRefreshToken: 1, encryptionIv: 1, encryptionTag: 1 },
            },
        );
        await DeliveryOutboxModel.updateMany(
            { teacherId: actor.sub, channel: DeliveryChannel.EMAIL, status: 'queued' },
            { $set: { status: 'waiting_for_connection' } },
        );
    },

    send: async (teacherId: string, input: { to: string; subject: string; html: string; pdf?: Buffer; pdfFilename?: string }) => {
        const accessToken = await accessTokenForTeacher(teacherId);
        const raw = base64Url(buildMime(input));
        return googleRequest<{ id: string; threadId: string }>(GMAIL_SEND_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw }),
        });
    },
};
