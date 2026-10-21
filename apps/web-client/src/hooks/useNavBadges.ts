import { useQuery } from "@tanstack/react-query";

import type { DashboardRole } from "@/lib/dashboard-navigation";
import { needsTeacherAttention } from "@/lib/payment-attention";
import { fetchLessonMessages, fetchPaymentRequests } from "@/services/api";

const BADGE_REFRESH_INTERVAL_MS = 60_000;

export function useNavBadges(role: DashboardRole): Record<string, number> {
  const requestsQuery = useQuery({
    queryKey: ["billing"],
    queryFn: fetchPaymentRequests,
    refetchInterval: BADGE_REFRESH_INTERVAL_MS,
  });
  const messagesQuery = useQuery({
    queryKey: ["lesson-messages"],
    queryFn: fetchLessonMessages,
    refetchInterval: BADGE_REFRESH_INTERVAL_MS,
    enabled: role === "student",
  });
  const requests = requestsQuery.data ?? [];
  if (role === "student") {
    return {
      "/student/payments": requests.filter((request) => !request.studentViewedAt).length,
      "/student/messages": (messagesQuery.data ?? []).filter((message) => !message.studentViewedAt)
        .length,
    };
  }
  return { "/teacher/payments": requests.filter(needsTeacherAttention).length };
}
