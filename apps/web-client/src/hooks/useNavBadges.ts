import { useQuery } from "@tanstack/react-query";

import type { DashboardRole } from "@/lib/dashboard-navigation";
import { needsTeacherAttention } from "@/lib/payment-attention";
import { fetchPaymentRequests } from "@/services/api";

const BADGE_REFRESH_INTERVAL_MS = 60_000;

export function useNavBadges(role: DashboardRole): Record<string, number> {
  const requestsQuery = useQuery({
    queryKey: ["billing"],
    queryFn: fetchPaymentRequests,
    refetchInterval: BADGE_REFRESH_INTERVAL_MS,
  });
  const requests = requestsQuery.data ?? [];
  if (role === "student") {
    return { "/student/payments": requests.filter((request) => !request.studentViewedAt).length };
  }
  return { "/teacher/payments": requests.filter(needsTeacherAttention).length };
}
