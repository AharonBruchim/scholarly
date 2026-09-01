import type { TypedRequest } from '@scholarly/utils';
import type { Response } from 'express';
import { AuthManager } from './manager';
import type { loginRequestSchema, refreshRequestSchema, registerRequestSchema } from './validations';

export const AuthController = {
    register: async (req: TypedRequest<typeof registerRequestSchema>, res: Response) => {
        res.status(201).json(await AuthManager.register(req.body));
    },

    login: async (req: TypedRequest<typeof loginRequestSchema>, res: Response) => {
        res.json(await AuthManager.login(req.body.email, req.body.password));
    },

    refresh: async (req: TypedRequest<typeof refreshRequestSchema>, res: Response) => {
        res.json(await AuthManager.refresh(req.body.refreshToken));
    },
};
