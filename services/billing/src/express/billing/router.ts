import { Router } from 'express';
import multer from 'multer';
import { createOneRequestSchema } from './validations';
import { validateRequest, wrapController } from '@scholarly/utils';
import { BillingController } from './controller';

export const billingRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

billingRouter.post(
    '/',
    upload.single('pdfFile'),
    validateRequest(createOneRequestSchema),
    wrapController(BillingController.createOne)
);