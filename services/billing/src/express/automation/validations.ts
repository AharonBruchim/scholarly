import { DeliveryChannel } from '@scholarly/shared';
import { zodMongoObjectId } from '@scholarly/utils';
import { z } from 'zod';

const deliveryChannels = z
    .array(z.enum([DeliveryChannel.EMAIL, DeliveryChannel.WHATSAPP, DeliveryChannel.SMS]))
    .min(1)
    .max(3)
    .refine((channels) => new Set(channels).size === channels.length, 'Delivery channels must be unique');

export const listPaymentRequestsSchema = z.object({
    body: z.object({}),
    query: z.object({
        period: z
            .string()
            .regex(/^\d{4}-\d{2}$/)
            .optional(),
    }),
    params: z.object({}),
});
export const getPaymentRequestPdfSchema = z.object({ body: z.object({}), query: z.object({}), params: z.object({ id: zodMongoObjectId }) });
export const getLessonMessagePdfSchema = getPaymentRequestPdfSchema;
export const getPublicPaymentRequestPdfSchema = z.object({
    body: z.object({}),
    query: z.object({ token: z.string().min(20).max(500) }),
    params: z.object({ id: zodMongoObjectId }),
});
export const getPublicLessonMessagePdfSchema = getPublicPaymentRequestPdfSchema;
export const getPublicManualDeliverySchema = getPublicPaymentRequestPdfSchema;
export const createManualPaymentRequestSchema = z.object({
    body: z
        .object({
            studentId: zodMongoObjectId,
            lessonIds: z.array(zodMongoObjectId).max(100).default([]),
            customItems: z
                .array(
                    z.object({
                        description: z.string().trim().min(1).max(300),
                        amount: z.number().positive().max(100000),
                        date: z.string().datetime().pipe(z.coerce.date()).optional(),
                    }),
                )
                .max(50)
                .default([]),
            channels: deliveryChannels,
            scheduledAt: z.string().datetime().pipe(z.coerce.date()).optional(),
            notes: z.string().trim().max(2000).optional(),
        })
        .strict()
        .refine((value) => value.lessonIds.length > 0 || value.customItems.length > 0, {
            message: 'At least one lesson or custom item is required',
        }),
    query: z.object({}),
    params: z.object({}),
});
export const createLessonMessageSchema = z.object({
    body: z
        .object({
            lessonIds: z
                .array(zodMongoObjectId)
                .min(1)
                .max(100)
                .refine((ids) => new Set(ids).size === ids.length, 'Lesson IDs must be unique'),
            subject: z.string().trim().min(1).max(200),
            message: z.string().trim().min(1).max(4000),
            channels: deliveryChannels,
            scheduledAt: z.string().datetime().pipe(z.coerce.date()).optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});
export const listLessonMessagesSchema = z.object({ body: z.object({}), query: z.object({}), params: z.object({}) });
export const automaticPreviewSchema = z.object({ body: z.object({}), query: z.object({}), params: z.object({}) });
export const idOnlySchema = z.object({ body: z.object({}).strict(), query: z.object({}), params: z.object({ id: zodMongoObjectId }) });
export const googleConnectionSchema = z.object({ body: z.object({}), query: z.object({}), params: z.object({}) });
export const googleCallbackSchema = z.object({
    body: z.object({}),
    query: z.object({ code: z.string().min(1).max(4000), state: z.string().min(20).max(500) }),
    params: z.object({}),
});
export const runMonthlySchema = z.object({
    body: z
        .object({
            period: z
                .string()
                .regex(/^\d{4}-\d{2}$/)
                .optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});
export const runRemindersSchema = z.object({ body: z.object({}).strict(), query: z.object({}), params: z.object({}) });
export const runDeliveriesSchema = z.object({ body: z.object({}).strict(), query: z.object({}), params: z.object({}) });
