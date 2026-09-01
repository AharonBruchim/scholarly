import { z } from 'zod';
import { UsersRoles } from '../types/user';

export const phoneSchema = z.object({
    number: z.string().min(9, 'מספר טלפון לא תקין'),
    allowWhatsApp: z.boolean(),
    allowSMS: z.boolean(),
});

export const bankAccountSchema = z.object({
    bankName: z.string().min(1, 'שם הבנק הוא שדה חובה'),
    branchNumber: z.string().min(1, 'מספר סניף הוא שדה חובה'),
    accountNumber: z.string().min(1, 'מספר חשבון הוא שדה חובה'),
});

export const baseUserSchema = z.object({
    firstName: z.string().trim().min(1, 'שם פרטי הוא שדה חובה'),
    lastName: z.string().trim().min(1, 'שם משפחה הוא שדה חובה'),
    email: z.string().trim().email('כתובת אימייל לא תקינה'),
    phone: phoneSchema,
    password: z.string()
        .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
        .refine(
            (password) => new TextEncoder().encode(password).byteLength <= 72,
            'הסיסמה ארוכה מדי',
        ),
});

export const studentSchema = baseUserSchema.extend({
    role: z.literal(UsersRoles.STUDENT),
});

export const teacherSchema = baseUserSchema.extend({
    role: z.literal(UsersRoles.TEACHER),
    bankAccount: bankAccountSchema,
});

export const createUserSchema = z.discriminatedUnion('role', [
    studentSchema,
    teacherSchema,
]);

export type CreateUserValues = z.infer<typeof createUserSchema>;
