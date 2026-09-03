import { authenticateJWT } from '@scholarly/utils';
import { Router } from 'express';

export const billingRouter = Router();

billingRouter.post('/', authenticateJWT, (_req, res) => {
    res.status(410).json({
        message: 'Manual payment requests were replaced by automatic monthly payment requests.',
    });
});
