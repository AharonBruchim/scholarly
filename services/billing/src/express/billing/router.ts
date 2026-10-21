import { authenticateJWT, validateRequest, wrapController } from '@scholarly/utils';
import express, { Router } from 'express';
import { AutomationController } from './controller';
import { PAYMENT_PROOF_CONTENT_TYPES, PAYMENT_PROOF_MAX_BYTES } from './model';
import {
    automaticPreviewSchema,
    createLessonMessageSchema,
    createManualPaymentRequestSchema,
    getLessonMessagePdfSchema,
    getPaymentProofSchema,
    getPaymentRequestPdfSchema,
    getPublicLessonMessagePdfSchema,
    getPublicManualDeliverySchema,
    getPublicPaymentRequestPdfSchema,
    googleCallbackSchema,
    googleConnectionSchema,
    idOnlySchema,
    listLessonMessagesSchema,
    listPaymentRequestsSchema,
    markPaymentRequestsViewedSchema,
    updatePaymentStatusSchema,
    uploadPaymentProofSchema,
} from './validations';

export const billingRouter = Router();

billingRouter.get('/', authenticateJWT, validateRequest(listPaymentRequestsSchema), wrapController(AutomationController.list));
billingRouter.post('/', authenticateJWT, validateRequest(createManualPaymentRequestSchema), wrapController(AutomationController.createManual));
billingRouter.post('/viewed', authenticateJWT, validateRequest(markPaymentRequestsViewedSchema), wrapController(AutomationController.markViewed));
billingRouter.get('/:id/pdf', authenticateJWT, validateRequest(getPaymentRequestPdfSchema), wrapController(AutomationController.pdf));
billingRouter.post('/:id/cancel', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.cancelPayment));
billingRouter.post(
    '/:id/payment-proofs',
    authenticateJWT,
    express.raw({ type: [...PAYMENT_PROOF_CONTENT_TYPES], limit: PAYMENT_PROOF_MAX_BYTES }),
    validateRequest(uploadPaymentProofSchema),
    wrapController(AutomationController.uploadPaymentProof),
);
billingRouter.get(
    '/:id/payment-proofs/:proofId',
    authenticateJWT,
    validateRequest(getPaymentProofSchema),
    wrapController(AutomationController.paymentProof),
);
billingRouter.patch(
    '/:id/payment-status',
    authenticateJWT,
    validateRequest(updatePaymentStatusSchema),
    wrapController(AutomationController.updatePaymentStatus),
);
billingRouter.get(
    '/lesson-messages',
    authenticateJWT,
    validateRequest(listLessonMessagesSchema),
    wrapController(AutomationController.listLessonMessages),
);
billingRouter.post(
    '/lesson-messages/viewed',
    authenticateJWT,
    validateRequest(markPaymentRequestsViewedSchema),
    wrapController(AutomationController.markLessonMessagesViewed),
);
billingRouter.post(
    '/lesson-messages',
    authenticateJWT,
    validateRequest(createLessonMessageSchema),
    wrapController(AutomationController.createLessonMessage),
);
billingRouter.get(
    '/lesson-messages/:id/pdf',
    authenticateJWT,
    validateRequest(getLessonMessagePdfSchema),
    wrapController(AutomationController.lessonMessagePdf),
);
billingRouter.post(
    '/lesson-messages/:id/cancel',
    authenticateJWT,
    validateRequest(idOnlySchema),
    wrapController(AutomationController.cancelLessonMessage),
);
billingRouter.get('/preview', authenticateJWT, validateRequest(automaticPreviewSchema), wrapController(AutomationController.preview));
billingRouter.get(
    '/whatsapp/tasks',
    authenticateJWT,
    validateRequest(listLessonMessagesSchema),
    wrapController(AutomationController.whatsappReminderTasks),
);
billingRouter.post('/whatsapp/:id/open', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.whatsappLink));
billingRouter.post('/whatsapp/:id/confirm', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.confirmWhatsApp));
billingRouter.post('/sms/:id/open', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.smsLink));
billingRouter.post('/sms/:id/confirm', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.confirmSms));
billingRouter.get('/google/status', authenticateJWT, validateRequest(googleConnectionSchema), wrapController(AutomationController.googleStatus));
billingRouter.post(
    '/google/authorize',
    authenticateJWT,
    validateRequest(googleConnectionSchema),
    wrapController(AutomationController.googleAuthorize),
);
billingRouter.delete(
    '/google/connection',
    authenticateJWT,
    validateRequest(googleConnectionSchema),
    wrapController(AutomationController.googleDisconnect),
);
billingRouter.get('/google/callback', validateRequest(googleCallbackSchema), wrapController(AutomationController.googleCallback));
billingRouter.get('/public/:id/pdf', validateRequest(getPublicPaymentRequestPdfSchema), wrapController(AutomationController.publicPdf));
billingRouter.get(
    '/public/lesson-messages/:id/pdf',
    validateRequest(getPublicLessonMessagePdfSchema),
    wrapController(AutomationController.publicLessonMessagePdf),
);
billingRouter.get(
    '/public/manual-deliveries/:id/open',
    validateRequest(getPublicManualDeliverySchema),
    wrapController(AutomationController.publicManualDelivery),
);
