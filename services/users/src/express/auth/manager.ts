import { createHash, randomBytes } from 'node:crypto';
import type { AuthSession, AuthUser, CreateUserValues } from '@scholarly/shared';
import { ServiceError, UnauthorizedError } from '@scholarly/utils';
import jwt from 'jsonwebtoken';
import type { PublicUser } from '../users/interface';
import { UserManager } from '../users/manager';
import { RefreshSessionModel } from './refresh-session-model';

const TOKEN_ISSUER = 'scholarly-users';
const TOKEN_AUDIENCE = 'scholarly-web';

interface AuthenticationResult {
    session: AuthSession;
    refreshToken: string;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
});

const hashRefreshToken = (refreshToken: string): string => createHash('sha256').update(refreshToken).digest('hex');

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
};
