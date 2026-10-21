import { History } from "lucide-react";

import type { PaymentEventRecord, PaymentRequestRecord } from "@/services/api";

interface ITimelineEntry {
  key: string;
  at: string;
  label: string;
  note?: string;
}

const channelLabels: Record<PaymentRequestRecord["deliveries"][number]["channel"], string> = {
  email: "במייל",
  whatsapp: "ב־WhatsApp",
  sms: "ב־SMS",
};

const teacherEventLabels: Record<PaymentEventRecord["paymentStatus"], string> = {
  unpaid: "המורה סימן/ה כלא שולם",
  claimed_paid: "המורה סימן/ה ששולם לפי התלמיד/ה",
  paid: "המורה אישר/ה שהתשלום התקבל",
  disputed: "המורה סימן/ה מחלוקת",
  waived: "המורה ויתר/ה על התשלום",
};

const studentEventLabels: Record<PaymentEventRecord["paymentStatus"], string> = {
  unpaid: "התלמיד/ה ביטל/ה את הסימון",
  claimed_paid: "התלמיד/ה סימן/ה ששילם/ה",
  paid: "התלמיד/ה סימן/ה ששילם/ה",
  disputed: "התלמיד/ה פתח/ה מחלוקת",
  waived: "התלמיד/ה סימן/ה ויתור",
};

function formatTimelineDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildTimeline(request: PaymentRequestRecord): ITimelineEntry[] {
  const created: ITimelineEntry = {
    key: "created",
    at: request.generatedAt,
    label: "דרישת התשלום הופקה",
  };
  const deliveries = request.deliveries.flatMap((delivery) =>
    delivery.status === "sent" && delivery.sentAt
      ? [
          {
            key: `delivery-${delivery._id}`,
            at: delivery.sentAt,
            label: `נשלחה ${channelLabels[delivery.channel]}`,
          },
        ]
      : [],
  );
  const events = (request.paymentEvents ?? []).map((event, index) => ({
    key: `event-${index}`,
    at: event.createdAt,
    label: (event.actorRole === "teacher" ? teacherEventLabels : studentEventLabels)[
      event.paymentStatus
    ],
    ...(event.note ? { note: event.note } : {}),
  }));
  return [created, ...deliveries, ...events].sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function PaymentTimeline({ request }: { request: PaymentRequestRecord }) {
  const entries = buildTimeline(request);
  return (
    <details className="rounded-md border border-slate-800 bg-slate-950/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white">
        <History className="h-3.5 w-3.5" aria-hidden="true" />
        יומן פעולות ({entries.length})
      </summary>
      <ol className="space-y-2 border-t border-slate-800 px-3 py-3">
        {entries.map((entry) => (
          <li key={entry.key} className="flex gap-3 text-xs">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-slate-200">
                {entry.label}
                <span className="text-slate-500"> · {formatTimelineDate(entry.at)}</span>
              </p>
              {entry.note ? (
                <p className="whitespace-pre-wrap text-slate-400">"{entry.note}"</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
