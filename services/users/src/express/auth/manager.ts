import { createHash, randomBytes } from 'node:crypto';
import type { AuthSession, AuthUser, CreateUserValues, PublicUser } from '@scholarly/shared';
import { ServiceError, UnauthorizedError } from '@scholarly/utils';
import jwt from 'jsonwebtoken';
import { UserManager } from '../users/manager';
import { PasswordResetModel } from './password-reset-model';
import { sendPasswordResetEmail } from './password-reset-email';
import { RefreshSessionModel } from './refresh-session-model';

const TOKEN_ISSUER = 'scholarly-users';
const TOKEN_AUDIENCE = 'scholarly-web';

interface AuthenticationResult {
    session: AuthSession;
    refreshToken: string;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function getAccessTokenSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new ServiceError('JWT_SECRET must be configured with at least 32 characters', 500, 'AUTH_CONFIGURATION_ERROR');
    }

    return secret;
}

const toAuthUser = (user: PublicUser): AuthUser => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hasBankAccount: Boolean(user.bankAccount),
    hasTeacherPreferences: Boolean(user.teacherPreferences),
});

const hashRefreshToken = (refreshToken: string): string => createHash('sha256').update(refreshToken).digest('hex');
const hashPasswordResetToken = (resetToken: string): string => createHash('sha256').update(resetToken).digest('hex');

async function createSession(user: PublicUser): Promise<AuthenticationResult> {
    const accessToken = jwt.sign({ sub: user._id, role: user.role, tokenType: 'access' }, getAccessTokenSecret(), {
        expiresIn: '15m',
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
    });
    const refreshToken = randomBytes(48).toString('base64url');

    await RefreshSessionModel.create({
        userId: user._id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return {
        session: {
            user: toAuthUser(user),
            accessToken,
        },
        refreshToken,
    };
}

export const AuthManager = {
    register: async (values: CreateUserValues): Promise<AuthenticationResult> => {
        const user = await UserManager.createOne(values);
        return createSession(user);
    },

    login: async (email: string, password: string): Promise<AuthenticationResult> => {
        const user = await UserManager.authenticate(email, password);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        return createSession(user);
    },

    refresh: async (refreshToken: string): Promise<AuthenticationResult> => {
        const refreshSession = await RefreshSessionModel.findOneAndDelete({
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: { $gt: new Date() },
        });

        if (!refreshSession) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const user = await UserManager.getById(refreshSession.userId);

        if (!user) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        return createSession(user);
    },

    logout: async (refreshToken?: string): Promise<void> => {
        if (!refreshToken) {
            return;
        }

        await RefreshSessionModel.deleteOne({ tokenHash: hashRefreshToken(refreshToken) });
    },

    requestPasswordReset: async (email: string): Promise<void> => {
        const resetBaseUrl = process.env.PASSWORD_RESET_BASE_URL;
        if (!resetBaseUrl) {
            throw new ServiceError('PASSWORD_RESET_BASE_URL must be configured', 503, 'PASSWORD_RESET_NOT_CONFIGURED');
        }
        const user = await UserManager.getByEmail(email);
        if (!user) return;
        const resetToken = randomBytes(48).toString('base64url');
        await PasswordResetModel.create({
            userId: user._id,
            tokenHash: hashPasswordResetToken(resetToken),
            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        });
        const resetUrl = new URL(resetBaseUrl);
        resetUrl.searchParams.set('token', resetToken);
        await sendPasswordResetEmail(user.email, resetUrl.toString());
    },

    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        const record = await PasswordResetModel.findOneAndUpdate(
            {
                tokenHash: hashPasswordResetToken(token),
                expiresAt: { $gt: new Date() },
                usedAt: { $exists: false },
            },
            { $set: { usedAt: new Date() } },
            { new: true },
        );
        if (!record) throw new UnauthorizedError('Invalid or expired password reset token');
        await UserManager.setPassword(record.userId, newPassword);
        await RefreshSessionModel.deleteMany({ userId: record.userId });
    },
};
