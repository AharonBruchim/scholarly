import { ServiceError, type TypedRequest } from '@scholarly/utils';
import type { Response } from 'express';
import { BillingManager } from './manager';
import type { createOneRequestSchema } from './validations';

export const BillingController = {
    createOne: async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        if (!req.file?.buffer) {
            throw new ServiceError('PDF file is required', 400);
        }

        const result = await BillingManager.sendPaymentEmail(req.body, req.file.buffer);
        res.json(result);
    },
};
