import { validateRequest, wrapController } from '@scholarly/utils';
import { Router } from 'express';
import { AuthController } from './controller';
import { loginRequestSchema, refreshRequestSchema, registerRequestSchema } from './validations';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerRequestSchema), wrapController(AuthController.register));
authRouter.post('/login', validateRequest(loginRequestSchema), wrapController(AuthController.login));
authRouter.post('/refresh', validateRequest(refreshRequestSchema), wrapController(AuthController.refresh));
