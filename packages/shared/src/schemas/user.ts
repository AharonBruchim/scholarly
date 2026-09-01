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
    firstName: z.string().min(1, 'שם פרטי הוא שדה חובה'),
    lastName: z.string().min(1, 'שם משפחה הוא שדה חובה'),
    email: z.string().email('כתובת אימייל לא תקינה'),
    phone: phoneSchema,
    password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
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