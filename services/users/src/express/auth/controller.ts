import { Response } from 'express';
import { TypedRequest } from '@scholarly/utils';
import { AuthManager } from './manager';
import {
    loginRequestSchema,
    refreshRequestSchema,
    registerRequestSchema,
} from './validations';

export class AuthController {
    static register = async (req: TypedRequest<typeof registerRequestSchema>, res: Response) => {
        res.status(201).json(await AuthManager.register(req.body));
    };

    static login = async (req: TypedRequest<typeof loginRequestSchema>, res: Response) => {
        res.json(await AuthManager.login(req.body.email, req.body.password));
    };

    static refresh = async (req: TypedRequest<typeof refreshRequestSchema>, res: Response) => {
        res.json(await AuthManager.refresh(req.body.refreshToken));
    };
}
