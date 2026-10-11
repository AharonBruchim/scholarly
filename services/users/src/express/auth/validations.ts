import { createUserSchema } from '@scholarly/shared';
import { z } from 'zod';

const passwordByteLength = (password: string): number => new TextEncoder().encode(password).byteLength;

export const loginRequestSchema = z.object({
    body: z.object({
        email: z.string().trim().email('Invalid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .refine((password) => passwordByteLength(password) <= 72, 'Password is too long'),
    }),
    query: z.object({}),
    params: z.object({}),
});

export const registerRequestSchema = z.object({
    body: createUserSchema,
    query: z.object({}),
    params: z.object({}),
});

export const refreshRequestSchema = z.object({
    body: z.object({}).strict(),
    query: z.object({}),
    params: z.object({}),
});

export const logoutRequestSchema = z.object({
    body: z.object({}).strict(),
    query: z.object({}),
    params: z.object({}),
});

export const forgotPasswordRequestSchema = z.object({
    body: z.object({ email: z.string().trim().email('Invalid email address') }).strict(),
    query: z.object({}),
    params: z.object({}),
});

export const resetPasswordRequestSchema = z.object({
    body: z
        .object({
            token: z.string().min(32).max(300),
            newPassword: z
                .string()
                .min(8, 'Password must contain at least 8 characters')
                .refine((password) => passwordByteLength(password) <= 72, 'Password is too long'),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});
