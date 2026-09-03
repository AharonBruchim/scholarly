import { bankAccountSchema, createUserSchema, phoneSchema, teacherPreferencesSchema, UsersRoles } from '@scholarly/shared';
import { zodMongoObjectId } from '@scholarly/utils';
import { z } from 'zod';

// GET /api/users
export const getAllRequestSchema = z.object({
    body: z.object({}),
    query: z.object({ role: z.nativeEnum(UsersRoles).optional() }),
    params: z.object({}),
});

// GET /api/users/:id
export const getByIdRequestSchema = z.object({
    body: z.object({}),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});

// POST /api/users
export const createOneRequestSchema = z.object({
    body: createUserSchema,
    query: z.object({}),
    params: z.object({}),
});

// PATCH /api/users/:id
export const updateOneRequestSchema = z.object({
    body: z
        .object({
            firstName: z.string().trim().min(1).optional(),
            lastName: z.string().trim().min(1).optional(),
            email: z.string().trim().email().optional(),
            phone: phoneSchema.partial().optional(),
            bankAccount: bankAccountSchema.partial().optional(),
            teacherPreferences: teacherPreferencesSchema.optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});
