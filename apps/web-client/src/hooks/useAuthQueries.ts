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
    mutationFn: async ({
      name,
      email,
      password,
      role,
    }: {
      name: string;
      email: string;
      password: string;
      role: "teacher" | "student";
    }) => {
      return authApi.register(name, email, password, role);
    },
  });
}
