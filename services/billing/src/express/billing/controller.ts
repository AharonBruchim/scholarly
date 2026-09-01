import { Response } from 'express';
import { createOneRequestSchema } from './validations';
import { TypedRequest, ServiceError } from '@scholarly/utils';
import { BillingManager } from './manager';

export class BillingController {
    static createOne = async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        if (!req.file?.buffer) {
            throw new ServiceError('PDF file is required', 400);
        }

        const result = await BillingManager.sendPaymentEmail(req.body, req.file.buffer);
        res.json(result);
    };
}