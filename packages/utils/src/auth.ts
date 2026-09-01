import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedUser extends JwtPayload {
    sub: string;
    role: string;
    tokenType: 'access';
}

export interface AuthenticatedRequest extends Request {
    auth?: AuthenticatedUser;
}

const TOKEN_ISSUER = 'scholarly-users';
const TOKEN_AUDIENCE = 'scholarly-web';

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        res.status(500).json({ message: 'Authentication is not configured' });
        return;
    }

    try {
        const payload = jwt.verify(token, secret, {
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
        });

        if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string' || payload.tokenType !== 'access') {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        req.auth = payload as AuthenticatedUser;
        next();
    } catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
