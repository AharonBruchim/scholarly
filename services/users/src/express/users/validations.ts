import { z } from 'zod';
import { zodMongoObjectId } from '@scholarly/utils';
import { 
  UsersRoles, 
  createUserSchema, 
  phoneSchema, 
  bankAccountSchema 
} from '@scholarly/shared';

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
    body: z.object({
        name: z.object({
            firstName: z.string().min(1).optional(),
            lastName: z.string().min(1).optional(),
        }).partial().optional(),
        contact: z.object({
            email: z.string().email().optional(),
            phone: phoneSchema.partial().optional(),
        }).partial().optional(),
        bankAccount: bankAccountSchema.partial().optional(),
    }).strict(),
    query: z.object({}),
    params: z.object({
        id: zodMongoObjectId,
    }),
});