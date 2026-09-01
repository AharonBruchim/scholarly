import { z } from 'zod';
import { UsersRoles } from './interface.js';
import { zodMongoObjectId } from '@scholarly/utils';

export const phoneSchema = z.object({
    number: z.string().optional(),
    allowWhatsApp: z.boolean().optional().default(true),
    allowSMS: z.boolean().optional().default(true),
});

const baseUserSchemaFields = z.object({
    name: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
    }),
    contact: z.object({
        email: z.string().email(),
        phone: phoneSchema,
    }),
}).strict();

const studentSchema = baseUserSchemaFields.extend({
    role: z.literal(UsersRoles.STUDENT),
}).strict();

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
    body: z.discriminatedUnion('role', [
        studentSchema,
        baseUserSchemaFields.extend({
            role: z.literal(UsersRoles.TEACHER),
            bankAccount: z.object({
                bankName: z.string().min(1),
                branchNumber: z.string().min(1),
                accountNumber: z.string().min(1),
            }),
        }).strict(),
        
    ]),
    query: z.object({}),
    params: z.object({}),
});

// PATCH /api/users/:id
export const updateOneRequestSchema = z.object({
    body: z.object({
        name: z.object({
            firstName: z.string().min(1).optional(),
            lastName: z.string().min(1).optional(),
        }).partial().optional(),
        contact: z.object({
            email: z.string().email().optional(),
            phone: phoneSchema.partial().optional(),
        }).partial().optional(),
        bankAccount: z.object({
            bankName: z.string().min(1).optional(),
            branchNumber: z.string().min(1).optional(),
            accountNumber: z.string().min(1).optional(),
        }).partial().optional(),
    }).strict(),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});
