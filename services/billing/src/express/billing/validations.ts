import { z } from 'zod';

// POST /api/billing
export const createOneRequestSchema = z.object({
    body: z
        .object({
            amount: z.coerce.number().min(1, 'Amount must be at least 1'),
            bank: z.string().min(1, 'Bank is required'),
            branch: z.string().min(1, 'Branch is required'),
            account: z.string().min(1, 'Account is required'),
            date: z.string().min(1, 'Date is required'),
            studentCount: z.coerce.number().min(1, 'Student count must be at least 1'),
            sessionCount: z.coerce.number().min(1, 'Session count must be at least 1'),
            clientName: z.string().min(1, 'Client name is required'),
            clientEmail: z
                .string()
                .email('Invalid email address')
                .transform((email) => email.replace(/[\u200F\u200E\u202A-\u202E\u2066-\u2069]/g, '').trim()),
            comments: z.string().optional(),
        })
        .strict(),
    query: z.object({}),
    params: z.object({}),
});
