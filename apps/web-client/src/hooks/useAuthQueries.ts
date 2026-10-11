import type { CreateUserValues } from "@scholarly/shared";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/api";

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authApi.login(email, password);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (data: CreateUserValues) => {
      return authApi.register(data);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      await authApi.forgotPassword(email);
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      await authApi.resetPassword(token, newPassword);
    },
  });
}
