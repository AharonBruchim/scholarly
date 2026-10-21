import type { PaymentRequestRecord } from "@/services/api";

const teacherAttentionStatuses: ReadonlyArray<PaymentRequestRecord["paymentStatus"]> = [
  "claimed_paid",
  "disputed",
];

export function needsTeacherAttention(request: PaymentRequestRecord): boolean {
  return (
    request.status !== "cancelled" &&
    teacherAttentionStatuses.includes(request.paymentStatus ?? "unpaid")
  );
}
