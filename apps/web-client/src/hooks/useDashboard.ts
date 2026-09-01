import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-core";
import { fetchLessons } from "@/services/api";

export function useDashboardLessons() {
  const { user } = useAuth();
  const userId = user?.id;
  const role = user?.role;

  return useQuery({
    queryKey: ["dashboard-lessons", role, userId],
    queryFn: () => fetchLessons(role === "teacher" ? { teacherId: userId } : { studentId: userId }),
    enabled: Boolean(userId && role),
  });
}
