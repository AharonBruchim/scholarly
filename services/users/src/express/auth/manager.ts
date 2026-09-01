import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthSession, AuthUser, UsersRoles, type CreateUserValues } from '@scholarly/shared';
import { ServiceError, UnauthorizedError } from '@scholarly/utils';
import { PublicUser } from '../users/interface';
import { UserManager } from '../users/manager';

const TOKEN_ISSUER = 'scholarly-users';
const TOKEN_AUDIENCE = 'scholarly-web';

interface AuthTokenPayload extends JwtPayload {
    sub: string;
    role: UsersRoles;
    tokenType: 'access' | 'refresh';
}

interface TokenSecrets {
    access: string;
    refresh: string;
}

function getRequiredSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const secret = process.env[name];

    if (!secret || secret.length < 32) {
        throw new ServiceError(`${name} must be configured with at least 32 characters`, 500, 'AUTH_CONFIGURATION_ERROR');
    }

    return secret;
}

function getTokenSecrets(): TokenSecrets {
    const secrets = {
        access: getRequiredSecret('JWT_SECRET'),
        refresh: getRequiredSecret('JWT_REFRESH_SECRET'),
    };

    if (secrets.access === secrets.refresh) {
        throw new ServiceError(
            'JWT_SECRET and JWT_REFRESH_SECRET must be different',
            500,
            'AUTH_CONFIGURATION_ERROR',
        );
    }

    return secrets;
}

const toAuthUser = (user: PublicUser): AuthUser => ({
    id: user._id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    ...(user.bankAccount ? { bankAccount: user.bankAccount } : {}),
});

function createSession(user: PublicUser, secrets: TokenSecrets): AuthSession {
    const commonClaims = {
        sub: user._id,
        role: user.role,
    };

    const accessToken = jwt.sign(
        { ...commonClaims, tokenType: 'access' },
        secrets.access,
        { expiresIn: '15m', issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE },
    );
    const refreshToken = jwt.sign(
        { ...commonClaims, tokenType: 'refresh' },
        secrets.refresh,
        { expiresIn: '7d', issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE },
    );

    return {
        user: toAuthUser(user),
        tokens: { accessToken, refreshToken },
    };
}

function verifyRefreshToken(refreshToken: string, refreshSecret: string): AuthTokenPayload {
    try {
        const payload = jwt.verify(refreshToken, refreshSecret, {
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
        });

        if (
            typeof payload === 'string'
            || !payload.sub
            || payload.tokenType !== 'refresh'
            || !Object.values(UsersRoles).includes(payload.role as UsersRoles)
        ) {
            throw new UnauthorizedError();
        }

        return payload as AuthTokenPayload;
    } catch (error) {
        if (error instanceof ServiceError && error.code === 'AUTH_CONFIGURATION_ERROR') {
            throw error;
        }

        throw new UnauthorizedError('Invalid refresh token');
    }
}

export class AuthManager {
    static register = async (values: CreateUserValues): Promise<AuthSession> => {
        const secrets = getTokenSecrets();
        const user = await UserManager.createOne(values);
        return createSession(user, secrets);
    };

    static login = async (email: string, password: string): Promise<AuthSession> => {
        const secrets = getTokenSecrets();
        const user = await UserManager.authenticate(email, password);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        return createSession(user, secrets);
    };

    static refresh = async (refreshToken: string): Promise<AuthSession> => {
        const secrets = getTokenSecrets();
        const payload = verifyRefreshToken(refreshToken, secrets.refresh);
        const user = await UserManager.getById(payload.sub);

        if (!user) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        return createSession(user, secrets);
    };
}
