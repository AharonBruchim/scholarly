import { type LucideIcon, Mail, MessageCircle, MessageSquare } from "lucide-react";

import type { DeliveryRecord, DeliveryStatus } from "@/services/api";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const deliveryChannelDisplay: Record<
  DeliveryRecord["channel"],
  { label: string; icon: LucideIcon }
> = {
  email: { label: "מייל", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  sms: { label: "SMS", icon: MessageSquare },
};

const deliveryStatusDisplay: Record<DeliveryStatus, { label: string; className: string }> = {
  waiting_for_connection: {
    label: "ממתין לחיבור Gmail",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  queued: { label: "בתור לשליחה", className: "border-sky-500/40 bg-sky-500/10 text-sky-200" },
  processing: { label: "בשליחה", className: "border-sky-500/40 bg-sky-500/10 text-sky-200" },
  manual_action_required: {
    label: "ממתין לשליחה ידנית",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  manual_opened: {
    label: "נפתח, ממתין לאישור",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  sent: { label: "נשלח", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  failed: { label: "השליחה נכשלה", className: "border-rose-500/40 bg-rose-500/10 text-rose-200" },
  skipped_no_consent: {
    label: "דולג, אין הסכמה",
    className: "border-slate-600 bg-slate-800/60 text-slate-300",
  },
  cancelled: { label: "בוטל", className: "border-slate-600 bg-slate-800/60 text-slate-300" },
};

export function DeliveryBadge({ delivery }: { delivery: DeliveryRecord }) {
  const channel = deliveryChannelDisplay[delivery.channel];
  const status = deliveryStatusDisplay[delivery.status];
  const ChannelIcon = channel.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
    >
      <ChannelIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {channel.label} · {status.label}
      {delivery.status === "sent" && delivery.sentAt ? ` · ${formatDate(delivery.sentAt)}` : ""}
    </span>
  );
}
