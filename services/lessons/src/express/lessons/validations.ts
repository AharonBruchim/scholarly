import { zodMongoObjectId } from '@scholarly/utils';
import { z } from 'zod';
import { LessonStatus } from './interface';

// GET /api/lessons
export const getAllRequestSchema = z.object({
    body: z.object({}),
    query: z.object({
        studentId: zodMongoObjectId.optional(),
        teacherId: zodMongoObjectId.optional(),
        status: z.nativeEnum(LessonStatus).optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
        available: z.literal('true').optional(),
    }),
    params: z.object({}),
});

// GET /api/lessons/:id
export const getByIdRequestSchema = z.object({
    body: z.object({}),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});

// POST /api/lessons
export const createOneRequestSchema = z.object({
    body: z
        .object({
            studentId: zodMongoObjectId.optional(),
            teacherId: zodMongoObjectId,
            startTime: z.string().datetime().pipe(z.coerce.date()),
            subject: z.string().trim().min(1).max(120),
            notes: z.string().trim().max(2000).optional(),
            durationMinutes: z.number().int().min(15).max(240).optional(),
            price: z.number().min(1).max(100000).optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});

// POST /api/lessons/series
export const createSeriesRequestSchema = z.object({
    body: z
        .object({
            studentId: zodMongoObjectId.optional(),
            teacherId: zodMongoObjectId,
            startTime: z.string().datetime().pipe(z.coerce.date()),
            subject: z.string().trim().min(1).max(120),
            notes: z.string().trim().max(2000).optional(),
            durationMinutes: z.number().int().min(15).max(240).optional(),
            price: z.number().min(1).max(100000).optional(),
            recurrence: z
                .object({
                    intervalWeeks: z.number().int().min(1).max(12).default(1),
                    occurrences: z.number().int().min(2).max(104).optional(),
                    untilDate: z.string().datetime().pipe(z.coerce.date()).optional(),
                })
                .refine((value) => Boolean(value.occurrences) !== Boolean(value.untilDate), {
                    message: 'Provide either occurrences or untilDate',
                }),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});

// PATCH /api/lessons/:id
export const updateOneRequestSchema = z.object({
    body: z
        .object({
            status: z.literal(LessonStatus.COMPLETED).optional(),
            notes: z.string().trim().max(2000).optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});

export const cancelLessonRequestSchema = z.object({
    body: z.object({ reason: z.string().trim().max(500).optional() }).strict(),
    query: z.object({}),
    params: z.object({ id: zodMongoObjectId }),
});

export const rescheduleLessonRequestSchema = z.object({
    body: z
        .object({
            targetLessonId: zodMongoObjectId,
            reason: z.string().trim().max(500).optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({ id: zodMongoObjectId }),
});

export const bookLessonRequestSchema = z.object({
    body: z.object({}).strict(),
    query: z.object({}),
    params: z.object({ id: zodMongoObjectId }),
});
