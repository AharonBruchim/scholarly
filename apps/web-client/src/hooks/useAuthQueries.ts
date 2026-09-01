import { useMutation } from "@tanstack/react-query";
import { type CreateUserValues } from "@scholarly/shared";
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