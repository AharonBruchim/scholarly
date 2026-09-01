import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createLesson, type CreateLessonInput, fetchDirectoryUsers } from "@/services/api";

export function useDirectoryUsers(role: "student" | "teacher") {
  return useQuery({
    queryKey: ["directory-users", role],
    queryFn: () => fetchDirectoryUsers(role),
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLessonInput) => createLesson(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard-lessons"] });
    },
  });
}
