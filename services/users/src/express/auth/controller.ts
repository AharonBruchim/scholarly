import type { TypedRequest } from '@scholarly/utils';
import { UnauthorizedError } from '@scholarly/utils';
import type { Response } from 'express';
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from './cookies';
import { AuthManager } from './manager';
import type { loginRequestSchema, logoutRequestSchema, refreshRequestSchema, registerRequestSchema } from './validations';

const sendAuthenticationResult = async (res: Response, resultPromise: ReturnType<typeof AuthManager.login>, status = 200) => {
    const result = await resultPromise;
    setRefreshCookie(res, result.refreshToken);
    res.status(status).json(result.session);
};

export const AuthController = {
    register: async (req: TypedRequest<typeof registerRequestSchema>, res: Response) => {
        await sendAuthenticationResult(res, AuthManager.register(req.body), 201);
    },

    login: async (req: TypedRequest<typeof loginRequestSchema>, res: Response) => {
        await sendAuthenticationResult(res, AuthManager.login(req.body.email, req.body.password));
    },

    refresh: async (req: TypedRequest<typeof refreshRequestSchema>, res: Response) => {
        const refreshToken = getRefreshCookie(req);

        if (!refreshToken) {
            throw new UnauthorizedError('Refresh cookie is required');
        }

        try {
            await sendAuthenticationResult(res, AuthManager.refresh(refreshToken));
        } catch (error) {
            clearRefreshCookie(res);
            throw error;
        }
    },

    logout: async (req: TypedRequest<typeof logoutRequestSchema>, res: Response) => {
        await AuthManager.logout(getRefreshCookie(req));
        clearRefreshCookie(res);
        res.status(204).send();
    },
};
