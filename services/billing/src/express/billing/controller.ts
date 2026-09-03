import { type AuthenticatedRequest, type TypedRequest, UnauthorizedError } from '@scholarly/utils';
import type { Response } from 'express';
import { config } from '../../config';
import { GmailManager } from './gmail';
import { AutomationManager } from './manager';
import type {
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

const actorFrom = (req: AuthenticatedRequest) => {
    if (!req.auth) throw new UnauthorizedError();
    return req.auth;
};

const sendPdf = (res: Response, pdf: { data: Buffer; filename: string }) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(pdf.filename)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(pdf.data);
};

export const AutomationController = {
    list: async (req: TypedRequest<typeof listPaymentRequestsSchema>, res: Response) => {
        res.json(await AutomationManager.listPaymentRequests(actorFrom(req), req.query.period));
    },
    pdf: async (req: TypedRequest<typeof getPaymentRequestPdfSchema>, res: Response) => {
        sendPdf(res, await AutomationManager.getPaymentRequestPdf(req.params.id, actorFrom(req)));
    },
    publicPdf: async (req: TypedRequest<typeof getPublicPaymentRequestPdfSchema>, res: Response) => {
        sendPdf(res, await AutomationManager.getPublicPaymentRequestPdf(req.params.id, req.query.token));
    },
    lessonMessagePdf: async (req: TypedRequest<typeof getLessonMessagePdfSchema>, res: Response) => {
        sendPdf(res, await AutomationManager.getLessonMessagePdf(req.params.id, actorFrom(req)));
    },
    publicLessonMessagePdf: async (req: TypedRequest<typeof getPublicLessonMessagePdfSchema>, res: Response) => {
        sendPdf(res, await AutomationManager.getPublicLessonMessagePdf(req.params.id, req.query.token));
    },
    publicManualDelivery: async (req: TypedRequest<typeof getPublicManualDeliverySchema>, res: Response) => {
        res.redirect(await AutomationManager.openManualDeliveryLink(req.params.id, req.query.token));
    },
    createManual: async (req: TypedRequest<typeof createManualPaymentRequestSchema>, res: Response) => {
        res.status(201).json(await AutomationManager.createManualPaymentRequest(req.body, actorFrom(req)));
    },
    cancelPayment: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.cancelPaymentRequest(req.params.id, actorFrom(req)));
    },
    listLessonMessages: async (req: TypedRequest<typeof listLessonMessagesSchema>, res: Response) => {
        res.json(await AutomationManager.listLessonMessages(actorFrom(req)));
    },
    whatsappReminderTasks: async (req: TypedRequest<typeof listLessonMessagesSchema>, res: Response) => {
        res.json(await AutomationManager.listWhatsAppReminderTasks(actorFrom(req)));
    },
    createLessonMessage: async (req: TypedRequest<typeof createLessonMessageSchema>, res: Response) => {
        res.status(201).json(await AutomationManager.createLessonMessage(req.body, actorFrom(req)));
    },
    cancelLessonMessage: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.cancelLessonMessage(req.params.id, actorFrom(req)));
    },
    preview: async (req: TypedRequest<typeof automaticPreviewSchema>, res: Response) => {
        res.json(await AutomationManager.automaticPreview(actorFrom(req)));
    },
    whatsappLink: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.getWhatsAppLink(req.params.id, actorFrom(req)));
    },
    confirmWhatsApp: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.confirmWhatsAppSent(req.params.id, actorFrom(req)));
    },
    smsLink: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.getSmsLink(req.params.id, actorFrom(req)));
    },
    confirmSms: async (req: TypedRequest<typeof idOnlySchema>, res: Response) => {
        res.json(await AutomationManager.confirmSmsSent(req.params.id, actorFrom(req)));
    },
    googleStatus: async (req: TypedRequest<typeof googleConnectionSchema>, res: Response) => {
        res.json(await GmailManager.connectionStatus(actorFrom(req)));
    },
    googleAuthorize: async (req: TypedRequest<typeof googleConnectionSchema>, res: Response) => {
        res.json(await GmailManager.authorizationUrl(actorFrom(req)));
    },
    googleDisconnect: async (req: TypedRequest<typeof googleConnectionSchema>, res: Response) => {
        await GmailManager.disconnect(actorFrom(req));
        res.status(204).send();
    },
    googleCallback: async (req: TypedRequest<typeof googleCallbackSchema>, res: Response) => {
        await GmailManager.completeAuthorization(req.query.code, req.query.state);
        res.redirect(`${config.web.appUrl}/teacher?gmail=connected#payments`);
    },
};
