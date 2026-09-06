import { z } from "zod";

export const userRoleSchema = z.enum(["teacher", "student"]);

export const loginSchema = z.object({
  email: z.string().email("validation.email"),
  password: z
    .string()
    .min(1, "validation.passwordRequired")
    .refine(
      (password) => new TextEncoder().encode(password).byteLength <= 72,
      "validation.passwordTooLong",
    ),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: {
    number?: string;
    allowWhatsApp?: boolean;
    allowSMS?: boolean;
  };
  role: UserRole;
  hasBankAccount: boolean;
  hasTeacherPreferences: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
