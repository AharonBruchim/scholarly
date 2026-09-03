import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bookLesson,
  cancelLesson,
  createLesson,
  createLessonSeries,
  type CreateLessonInput,
  type CreateLessonSeriesInput,
  fetchDirectoryUsers,
  fetchLessons,
  rescheduleLesson,
} from "@/services/api";

export function useDirectoryUsers(role: "student" | "teacher") {
  return useQuery({
    queryKey: ["directory-users", role],
    queryFn: () => fetchDirectoryUsers(role),
  });
}

export function useAvailableLessons(teacherId?: string) {
  return useQuery({
    queryKey: ["available-lessons", teacherId],
    queryFn: () => fetchLessons({ teacherId, available: "true" }),
    enabled: Boolean(teacherId),
  });
}

export function useCancelLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, reason }: { lessonId: string; reason?: string }) =>
      cancelLesson(lessonId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard-lessons"] });
    },
  });
}

export function useRescheduleLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, targetLessonId }: { lessonId: string; targetLessonId: string }) =>
      rescheduleLesson(lessonId, targetLessonId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard-lessons"] });
      await queryClient.invalidateQueries({ queryKey: ["available-lessons"] });
    },
  });
}

export function useCreateLessonSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLessonSeriesInput) => createLessonSeries(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-lessons"] }),
        queryClient.invalidateQueries({ queryKey: ["available-lessons"] }),
      ]);
    },
  });
}

export function useBookLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => bookLesson(lessonId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-lessons"] }),
        queryClient.invalidateQueries({ queryKey: ["available-lessons"] }),
      ]);
    },
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
