import { z } from "zod";

export const userRoleSchema = z.enum(["teacher", "student"]);

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long."),
  role: userRoleSchema,
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface BankAccount {
  bankName: string;
  branchNumber: string;
  accountNumber: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bankAccount?: BankAccount | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}
