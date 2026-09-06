import type { IUserUpdate } from "@scholarly/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchUserProfile, updateUserProfile } from "@/services/api";

export const userProfileQueryKey = (userId: string) => ["user-profile", userId] as const;

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: userProfileQueryKey(userId ?? ""),
    queryFn: () => {
      if (!userId) throw new Error("A user id is required to fetch a profile.");
      return fetchUserProfile(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useUpdateUserProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: IUserUpdate) => updateUserProfile(userId, update),
    onSuccess: async (profile) => {
      queryClient.setQueryData(userProfileQueryKey(userId), profile);
      await queryClient.invalidateQueries({ queryKey: ["directory-users"] });
    },
  });
}
