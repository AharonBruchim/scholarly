import { z } from 'zod';
import { LessonStatus } from './interface';
import { zodMongoObjectId } from '@scholarly/utils';

// GET /api/lessons
export const getAllRequestSchema = z.object({
    body: z.object({}),
    query: z.object({
        studentId: zodMongoObjectId.optional(),
        teacherId: zodMongoObjectId.optional(),
        status: z.nativeEnum(LessonStatus).optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
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
    body: z.object({
        studentId: zodMongoObjectId,
        teacherId: zodMongoObjectId,
        startTime: z.string().datetime().pipe(z.coerce.date()),
        endTime: z.string().datetime().pipe(z.coerce.date()),
        subject: z.string().min(1),
        price: z.number().positive(),
        notes: z.string().optional(),
    }).strict(),
    query: z.object({}),
    params: z.object({}),
});

// PATCH /api/lessons/:id
export const updateOneRequestSchema = z.object({
    body: z.object({
        startTime: z.string().datetime().pipe(z.coerce.date()).optional(),
        endTime: z.string().datetime().pipe(z.coerce.date()).optional(),
        subject: z.string().min(1).optional(),
        status: z.nativeEnum(LessonStatus).optional(),
        price: z.number().positive().optional(),
        notes: z.string().optional(),
    }).strict(),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});