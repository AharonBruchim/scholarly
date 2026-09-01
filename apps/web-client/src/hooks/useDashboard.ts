import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-core";
import { fetchStudentOverview, fetchTeacherOverview } from "@/services/api";

export function useTeacherOverview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-overview", user?.id],
    queryFn: fetchTeacherOverview,
    enabled: user?.role === "teacher",
  });
}

export function useStudentOverview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-overview", user?.id],
    queryFn: fetchStudentOverview,
    enabled: user?.role === "student",
  });
}
