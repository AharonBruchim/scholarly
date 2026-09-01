import { validateRequest, wrapController } from '@scholarly/utils';
import { Router } from 'express';
import multer from 'multer';
import { BillingController } from './controller';
import { createOneRequestSchema } from './validations';

export const billingRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

billingRouter.post('/', upload.single('pdfFile'), validateRequest(createOneRequestSchema), wrapController(BillingController.createOne));
