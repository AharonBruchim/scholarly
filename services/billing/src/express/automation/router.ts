import { authenticateJWT, validateRequest, wrapController } from '@scholarly/utils';
import { Router } from 'express';
import { AutomationController } from './controller';
import {
    automaticPreviewSchema,
    createLessonMessageSchema,
    createManualPaymentRequestSchema,
    getLessonMessagePdfSchema,
    getPaymentRequestPdfSchema,
    getPublicLessonMessagePdfSchema,
    getPublicManualDeliverySchema,
    getPublicPaymentRequestPdfSchema,
    googleCallbackSchema,
    googleConnectionSchema,
    idOnlySchema,
    listLessonMessagesSchema,
    listPaymentRequestsSchema,
} from './validations';

export const automationRouter = Router();

automationRouter.get('/payment-requests', authenticateJWT, validateRequest(listPaymentRequestsSchema), wrapController(AutomationController.list));
automationRouter.post(
    '/payment-requests',
    authenticateJWT,
    validateRequest(createManualPaymentRequestSchema),
    wrapController(AutomationController.createManual),
);
automationRouter.get(
    '/payment-requests/:id/pdf',
    authenticateJWT,
    validateRequest(getPaymentRequestPdfSchema),
    wrapController(AutomationController.pdf),
);
automationRouter.post(
    '/payment-requests/:id/cancel',
    authenticateJWT,
    validateRequest(idOnlySchema),
    wrapController(AutomationController.cancelPayment),
);
automationRouter.get(
    '/lesson-messages',
    authenticateJWT,
    validateRequest(listLessonMessagesSchema),
    wrapController(AutomationController.listLessonMessages),
);
automationRouter.post(
    '/lesson-messages',
    authenticateJWT,
    validateRequest(createLessonMessageSchema),
    wrapController(AutomationController.createLessonMessage),
);
automationRouter.get(
    '/lesson-messages/:id/pdf',
    authenticateJWT,
    validateRequest(getLessonMessagePdfSchema),
    wrapController(AutomationController.lessonMessagePdf),
);
automationRouter.post(
    '/lesson-messages/:id/cancel',
    authenticateJWT,
    validateRequest(idOnlySchema),
    wrapController(AutomationController.cancelLessonMessage),
);
automationRouter.get('/preview', authenticateJWT, validateRequest(automaticPreviewSchema), wrapController(AutomationController.preview));
automationRouter.get(
    '/whatsapp/tasks',
    authenticateJWT,
    validateRequest(listLessonMessagesSchema),
    wrapController(AutomationController.whatsappReminderTasks),
);
automationRouter.post('/whatsapp/:id/open', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.whatsappLink));
automationRouter.post('/whatsapp/:id/confirm', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.confirmWhatsApp));
automationRouter.post('/sms/:id/open', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.smsLink));
automationRouter.post('/sms/:id/confirm', authenticateJWT, validateRequest(idOnlySchema), wrapController(AutomationController.confirmSms));
automationRouter.get('/google/status', authenticateJWT, validateRequest(googleConnectionSchema), wrapController(AutomationController.googleStatus));
automationRouter.post(
    '/google/authorize',
    authenticateJWT,
    validateRequest(googleConnectionSchema),
    wrapController(AutomationController.googleAuthorize),
);
automationRouter.delete(
    '/google/connection',
    authenticateJWT,
    validateRequest(googleConnectionSchema),
    wrapController(AutomationController.googleDisconnect),
);
automationRouter.get('/google/callback', validateRequest(googleCallbackSchema), wrapController(AutomationController.googleCallback));
automationRouter.get(
    '/public/payment-requests/:id/pdf',
    validateRequest(getPublicPaymentRequestPdfSchema),
    wrapController(AutomationController.publicPdf),
);
automationRouter.get(
    '/public/lesson-messages/:id/pdf',
    validateRequest(getPublicLessonMessagePdfSchema),
    wrapController(AutomationController.publicLessonMessagePdf),
);
automationRouter.get(
    '/public/manual-deliveries/:id/open',
    validateRequest(getPublicManualDeliverySchema),
    wrapController(AutomationController.publicManualDelivery),
);
