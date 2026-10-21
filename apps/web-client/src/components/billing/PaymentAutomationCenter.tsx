import {
  DeliveryChannel,
  ENABLED_DELIVERY_CHANNELS,
  isDeliveryChannelEnabled,
} from "@scholarly/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { DeliveryBadge } from "@/components/billing/DeliveryBadge";
import { PaymentTimeline } from "@/components/billing/PaymentTimeline";
import { ScheduleField } from "@/components/calendar/ScheduleField";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { needsTeacherAttention } from "@/lib/payment-attention";
import {
  cancelLessonMessage,
  cancelPaymentRequest,
  confirmSmsDelivery,
  confirmWhatsAppDelivery,
  createLessonMessage,
  createManualPaymentRequest,
  type DeliveryRecord,
  type DirectoryUser,
  fetchAutomaticPaymentPreview,
  fetchGmailConnection,
  fetchLessonMessages,
  fetchPaymentRequests,
  fetchWhatsAppReminderTasks,
  type Lesson,
  openLessonMessagePdf,
  openPaymentRequestPdf,
  openSmsDelivery,
  openWhatsAppDelivery,
  type PaymentRequestRecord,
  updatePaymentRequestStatus,
} from "@/services/api";

const billingQueryKeys = [
  "billing",
  "lesson-messages",
  "payment-preview",
  "whatsapp-reminder-tasks",
] as const;

const statusLabels: Record<PaymentRequestRecord["status"], string> = {
  scheduled: "מתוזמנת",
  pending_delivery: "ממתינה לשליחה",
  partially_delivered: "נשלחה חלקית",
  delivered: "נשלחה",
  failed: "השליחה נכשלה",
  cancelled: "בוטלה",
};

const paymentStatusLabels: Record<PaymentRequestRecord["paymentStatus"], string> = {
  unpaid: "לא שולם",
  claimed_paid: "התלמידה סימנה ששילמה",
  paid: "התקבל",
  disputed: "במחלוקת",
  waived: "ויתור",
};

function toIso(localValue: string): string | undefined {
  return localValue ? new Date(localValue).toISOString() : undefined;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type SelectableDeliveryChannel = "email" | "whatsapp" | "sms";

const channelLabels: Record<SelectableDeliveryChannel, string> = {
  email: "Gmail אוטומטי",
  whatsapp: "WhatsApp ידני",
  sms: "SMS ידני עם קישור",
};

const whatsAppEnabled = isDeliveryChannelEnabled(DeliveryChannel.WHATSAPP);

function ChannelSelector({
  value,
  onChange,
}: {
  value: SelectableDeliveryChannel[];
  onChange: (value: SelectableDeliveryChannel[]) => void;
}) {
  const toggle = (channel: SelectableDeliveryChannel) => {
    onChange(
      value.includes(channel) ? value.filter((item) => item !== channel) : [...value, channel],
    );
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-200">ערוצי שליחה</legend>
      <div className="flex flex-wrap gap-4">
        {ENABLED_DELIVERY_CHANNELS.map((channel) => (
          <label key={channel} className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={value.includes(channel)}
              onChange={() => toggle(channel)}
            />
            {channelLabels[channel]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ManualDeliveryActions({
  delivery,
  onChanged,
}: {
  delivery: DeliveryRecord;
  onChanged: () => void;
}) {
  const isSms = delivery.channel === "sms";
  const [actionError, setActionError] = useState<string | null>(null);
  const openMutation = useMutation({
    mutationFn: (targetWindow: Window | null) =>
      isSms ? openSmsDelivery(delivery._id) : openWhatsAppDelivery(delivery._id, targetWindow),
    onMutate: () => setActionError(null),
    onSuccess: onChanged,
    onError: (error) =>
      setActionError(error instanceof Error ? error.message : "לא ניתן לפתוח את ההודעה"),
  });
  const confirmMutation = useMutation({
    mutationFn: () =>
      isSms ? confirmSmsDelivery(delivery._id) : confirmWhatsAppDelivery(delivery._id),
    onMutate: () => setActionError(null),
    onSuccess: onChanged,
    onError: (error) =>
      setActionError(error instanceof Error ? error.message : "לא ניתן לסמן את ההודעה כנשלחה"),
  });
  const ready = new Date(delivery.scheduledAt).getTime() <= Date.now();
  if (
    !isDeliveryChannelEnabled(delivery.channel) ||
    !["whatsapp", "sms"].includes(delivery.channel) ||
    !ready ||
    !["manual_action_required", "manual_opened"].includes(delivery.status)
  )
    return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!isSms && delivery.openUrl ? (
          <Button asChild size="sm" variant="secondary">
            <a href={delivery.openUrl}>פתיחה ב־WhatsApp Web</a>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => openMutation.mutate(null)}
            disabled={openMutation.isPending}
          >
            {isSms ? "פתיחה ב־SMS" : "פתיחה ב־WhatsApp Web"}
          </Button>
        )}
        {delivery.status === "manual_opened" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            סימון כנשלח
          </Button>
        ) : null}
      </div>
      {actionError ? (
        <p role="alert" className="text-xs text-red-400">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

function PaymentStatusActions({
  request,
  onChanged,
}: {
  request: PaymentRequestRecord;
  onChanged: () => void;
}) {
  const [note, setNote] = useState(request.paymentNote ?? "");
  const mutation = useMutation({
    mutationFn: (paymentStatus: PaymentRequestRecord["paymentStatus"]) =>
      updatePaymentRequestStatus(request._id, {
        paymentStatus,
        paymentNote: note.trim() || undefined,
      }),
    onSuccess: onChanged,
  });
  return (
    <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-950/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">
          סטטוס תשלום: {paymentStatusLabels[request.paymentStatus ?? "unpaid"]}
        </p>
        {request.paymentUpdatedAt ? (
          <p className="text-xs text-slate-400">עודכן: {formatDate(request.paymentUpdatedAt)}</p>
        ) : null}
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={1000}
        rows={2}
        className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
        placeholder="הערת תשלום פנימית או פירוט מחלוקת"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => mutation.mutate("paid")}
          disabled={mutation.isPending || request.paymentStatus === "paid"}
        >
          התקבל
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => mutation.mutate("unpaid")}
          disabled={mutation.isPending || request.paymentStatus === "unpaid"}
        >
          לא התקבל
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => mutation.mutate("disputed")}
          disabled={mutation.isPending || request.paymentStatus === "disputed"}
        >
          מחלוקת
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => mutation.mutate("waived")}
          disabled={mutation.isPending || request.paymentStatus === "waived"}
        >
          ויתור
        </Button>
      </div>
      {mutation.isError ? (
        <p role="alert" className="text-xs text-red-400">
          עדכון סטטוס התשלום נכשל.
        </p>
      ) : null}
    </div>
  );
}

export type PaymentAutomationView = "automation" | "paymentHistory" | "lessonMessageHistory";

interface PaymentAutomationCenterProps {
  lessons: Lesson[];
  students: DirectoryUser[];
  view: PaymentAutomationView;
}

export function PaymentAutomationCenter({ lessons, students, view }: PaymentAutomationCenterProps) {
  const queryClient = useQueryClient();
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);
  const [studentId, setStudentId] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<
    Array<{ id: string; description: string; amount: number }>
  >([]);
  const [customDescription, setCustomDescription] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [paymentChannels, setPaymentChannels] = useState<SelectableDeliveryChannel[]>(["email"]);
  const [paymentSchedule, setPaymentSchedule] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [messageLessonIds, setMessageLessonIds] = useState<string[]>([]);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageChannels, setMessageChannels] = useState<SelectableDeliveryChannel[]>(["email"]);
  const [messageSchedule, setMessageSchedule] = useState("");
  const [openForm, setOpenForm] = useState<"payment" | "message" | null>(null);

  const requestsQuery = useQuery({
    queryKey: ["billing"],
    queryFn: fetchPaymentRequests,
  });
  const messagesQuery = useQuery({
    queryKey: ["lesson-messages"],
    queryFn: fetchLessonMessages,
  });
  const previewQuery = useQuery({
    queryKey: ["payment-preview"],
    queryFn: fetchAutomaticPaymentPreview,
  });
  const reminderTasksQuery = useQuery({
    queryKey: ["whatsapp-reminder-tasks"],
    queryFn: fetchWhatsAppReminderTasks,
    enabled: whatsAppEnabled,
  });
  const gmailQuery = useQuery({ queryKey: ["gmail-connection"], queryFn: fetchGmailConnection });

  const studentsById = useMemo(
    () =>
      new Map(students.map((student) => [student._id, `${student.firstName} ${student.lastName}`])),
    [students],
  );
  const claimedLessonIds = useMemo(
    () =>
      new Set(
        (requestsQuery.data ?? [])
          .filter((request) => request.status !== "cancelled")
          .flatMap((request) =>
            request.lineItems.flatMap((line) => (line.lessonId ? [line.lessonId] : [])),
          ),
      ),
    [requestsQuery.data],
  );
  const studentLessons = lessons
    .filter(
      (lesson) =>
        lesson.studentId === studentId &&
        lesson.status !== "available" &&
        !(lesson.status === "cancelled" && lesson.chargeStatus !== "full"),
    )
    .sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );
  const selectableStudentLessonIds = studentLessons
    .filter((lesson) => !claimedLessonIds.has(lesson._id))
    .map((lesson) => lesson._id);
  const allStudentLessonsSelected =
    selectableStudentLessonIds.length > 0 &&
    selectableStudentLessonIds.every((lessonId) => selectedLessonIds.includes(lessonId));
  const selectedLessonsTotal = studentLessons
    .filter((lesson) => selectedLessonIds.includes(lesson._id))
    .reduce((total, lesson) => total + lesson.price, 0);
  const assignedLessons = lessons
    .filter((lesson) => Boolean(lesson.studentId) && lesson.status !== "available")
    .sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );

  const pendingApprovalRequests = (requestsQuery.data ?? []).filter(needsTeacherAttention);
  const openRequests = (requestsQuery.data ?? []).filter(
    (request) => request.status !== "cancelled" && (request.paymentStatus ?? "unpaid") === "unpaid",
  );

  const refreshBilling = async () => {
    await Promise.all(
      billingQueryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    );
  };

  const billingRefreshing =
    requestsQuery.isFetching ||
    messagesQuery.isFetching ||
    previewQuery.isFetching ||
    reminderTasksQuery.isFetching;

  const paymentMutation = useMutation({
    mutationFn: () =>
      createManualPaymentRequest({
        studentId,
        lessonIds: selectedLessonIds,
        customItems: customItems.map(({ description, amount }) => ({ description, amount })),
        channels: paymentChannels,
        scheduledAt: toIso(paymentSchedule),
        notes: paymentNotes || undefined,
      }),
    onSuccess: async () => {
      toast.success(
        paymentSchedule
          ? "דרישת התשלום נשמרה ותישלח במועד שנבחר."
          : "דרישת התשלום הופקה ונכנסה לשליחה.",
      );
      setOpenForm(null);
      setSelectedLessonIds([]);
      setCustomItems([]);
      setPaymentNotes("");
      await refreshBilling();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "יצירת דרישת התשלום נכשלה."),
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      createLessonMessage({
        lessonIds: messageLessonIds,
        subject: messageSubject,
        message: messageBody,
        channels: messageChannels,
        scheduledAt: toIso(messageSchedule),
      }),
    onSuccess: async (messages) => {
      toast.success(
        messageSchedule
          ? `${messages.length} הודעות נשמרו ויישלחו במועד שנבחר.`
          : `${messages.length} הודעות נכנסו לשליחה.`,
      );
      setOpenForm(null);
      setMessageLessonIds([]);
      setMessageSubject("");
      setMessageBody("");
      await refreshBilling();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "שמירת ההודעה נכשלה."),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: cancelPaymentRequest,
    onSuccess: refreshBilling,
  });
  const cancelMessageMutation = useMutation({
    mutationFn: cancelLessonMessage,
    onSuccess: refreshBilling,
  });

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const addCustomItem = () => {
    const amount = Number(customAmount);
    if (!customDescription.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setCustomItems((current) => [
      ...current,
      { id: crypto.randomUUID(), description: customDescription.trim(), amount },
    ]);
    setCustomDescription("");
    setCustomAmount("");
  };

  const showPdfPreview = (title: string, url: string) => {
    setPdfPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { title, url };
    });
    window.requestAnimationFrame(() => {
      document.getElementById("pdf-preview")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const closePdfPreview = () => {
    setPdfPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  return (
    <section id="payments" className="space-y-6 scroll-mt-6">
      {pdfPreview ? (
        <Card id="pdf-preview" className="scroll-mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{pdfPreview.title}</CardTitle>
                <CardDescription>המסמך מוצג כאן בלי מעבר לטאב חדש.</CardDescription>
              </div>
              <Button type="button" variant="secondary" onClick={closePdfPreview}>
                סגירה
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <iframe
              title={pdfPreview.title}
              src={pdfPreview.url}
              className="h-[70vh] w-full rounded-md border border-slate-700 bg-white"
            />
          </CardContent>
        </Card>
      ) : null}

      {view === "automation" ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">תשלומים</h1>
            <p className="text-sm text-slate-400">
              דרישות פתוחות, אישורי תשלום ושליחת הודעות לתלמידים.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpenForm("message")}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              הודעה לתלמיד/ה
            </Button>
            <Button type="button" onClick={() => setOpenForm("payment")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              דרישת תשלום חדשה
            </Button>
          </div>
        </div>
      ) : null}

      {view === "automation" && gmailQuery.isSuccess && !gmailQuery.data.connected ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
        >
          <p className="text-sm text-amber-100">
            חשבון Google לא מחובר, ולכן דרישות תשלום והודעות לא יישלחו במייל.
          </p>
          <Button asChild size="sm" variant="secondary">
            <Link to="/settings/connections">לחיבור בהגדרות</Link>
          </Button>
        </div>
      ) : null}

      {view === "automation" && pendingApprovalRequests.length > 0 ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle>ממתינות לאישורך ({pendingApprovalRequests.length})</CardTitle>
            <CardDescription>
              תלמידים דיווחו על תשלום או פתחו מחלוקת. בדוק/י את הפרטים ועדכן/י סטטוס.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovalRequests.map((request) => (
              <article
                key={request._id}
                className="space-y-3 rounded-xl border border-slate-700 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-white">
                    {studentsById.get(request.studentId) ?? "תלמידה"} · {request.requestNumber}
                  </h3>
                  <p className="text-sm text-slate-300">{request.total.toFixed(2)} ₪</p>
                </div>
                <PaymentTimeline request={request} defaultOpen />
                <PaymentStatusActions request={request} onChanged={() => void refreshBilling()} />
              </article>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {view === "automation" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>דרישות פתוחות ({openRequests.length})</CardTitle>
              <CardDescription>דרישות שנשלחו ועדיין לא שולמו.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {openRequests.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="אין דרישות פתוחות"
                  description="כל התשלומים הוסדרו. דרישה חדשה תופיע כאן אחרי שתישלח."
                />
              ) : (
                <ul className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
                  {openRequests.map((request) => (
                    <li
                      key={request._id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-white">
                          <bdi>{studentsById.get(request.studentId) ?? "תלמיד/ה"}</bdi> ·{" "}
                          {request.total.toFixed(2)} ₪
                        </p>
                        <p className="text-xs text-slate-400">
                          {request.requestNumber} · {statusLabels[request.status]} ·{" "}
                          {formatDate(request.scheduledAt ?? request.generatedAt)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {request.deliveries.map((delivery) => (
                            <DeliveryBadge key={delivery._id} delivery={delivery} />
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={async () =>
                          showPdfPreview(
                            request.requestNumber || "דרישת תשלום",
                            await openPaymentRequestPdf(request._id),
                          )
                        }
                      >
                        צפייה ב־PDF
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/teacher/history/payments"
                className="inline-flex text-sm text-sky-300 hover:text-sky-200"
              >
                לכל היסטוריית התשלומים ←
              </Link>
            </CardContent>
          </Card>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-white">הדרישה האוטומטית הבאה</h2>
              {previewQuery.data ? (
                <p className="text-xs text-slate-400">
                  {formatDate(previewQuery.data.nextScheduledAt)} · תקופה {previewQuery.data.period}{" "}
                  · {previewQuery.data.lessonCount} שיעורים · {previewQuery.data.studentCount}{" "}
                  תלמידים · סכום משוער {previewQuery.data.estimatedTotal.toFixed(2)} ₪
                </p>
              ) : (
                <p className="text-xs text-slate-400">טוען תחזית…</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void refreshBilling()}
              disabled={billingRefreshing}
            >
              <RefreshCw
                className={billingRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden="true"
              />
              רענון
            </Button>
          </section>

          <Modal
            open={openForm === "payment"}
            onClose={() => setOpenForm(null)}
            title="דרישת תשלום חדשה"
            description="בחירת שיעורים וסעיפים נוספים. נוצר PDF מעוצב ונשלח לתלמיד/ה. שיעורים שנבחרו לא יחויבו שוב אוטומטית."
            closeLabel="סגירה"
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                paymentMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="payment-student">תלמידה</Label>
                <select
                  id="payment-student"
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-white"
                  value={studentId}
                  onChange={(event) => {
                    setStudentId(event.target.value);
                    setSelectedLessonIds([]);
                  }}
                  required
                >
                  <option value="">בחירת תלמידה</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>
              {studentId ? (
                <fieldset className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-700 p-3">
                  <legend className="px-2 text-sm font-medium text-slate-200">בחירת שיעורים</legend>
                  {studentLessons.length === 0 ? (
                    <p className="text-sm text-slate-400">אין שיעורים לבחירה.</p>
                  ) : null}
                  {selectableStudentLessonIds.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
                      <p className="text-xs text-slate-300">
                        נבחרו {selectedLessonIds.length} שיעורים · {selectedLessonsTotal.toFixed(2)}{" "}
                        ₪
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedLessonIds(selectableStudentLessonIds)}
                          disabled={allStudentLessonsSelected}
                        >
                          בחירת הכול
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLessonIds([])}
                          disabled={selectedLessonIds.length === 0}
                        >
                          ניקוי
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {studentLessons.map((lesson) => {
                    const claimed = claimedLessonIds.has(lesson._id);
                    return (
                      <label
                        key={lesson._id}
                        className="flex items-start gap-2 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLessonIds.includes(lesson._id)}
                          disabled={claimed}
                          onChange={() =>
                            setSelectedLessonIds((current) =>
                              current.includes(lesson._id)
                                ? current.filter((id) => id !== lesson._id)
                                : [...current, lesson._id],
                            )
                          }
                        />
                        <span>
                          {lesson.subject} · {formatDate(lesson.startTime)} ·{" "}
                          {lesson.price.toFixed(2)} ₪{claimed ? " · כבר נכלל בדרישה" : ""}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
              <div className="space-y-2 rounded-lg border border-slate-700 p-3">
                <Label>סעיף נוסף</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <Input
                    value={customDescription}
                    onChange={(event) => setCustomDescription(event.target.value)}
                    placeholder="פירוט"
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder="סכום"
                  />
                  <Button type="button" variant="secondary" onClick={addCustomItem}>
                    הוספה
                  </Button>
                </div>
                {customItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-300">
                    <span>
                      {item.description} · {item.amount.toFixed(2)} ₪
                    </span>
                    <button
                      type="button"
                      className="text-rose-300"
                      onClick={() =>
                        setCustomItems((current) =>
                          current.filter((currentItem) => currentItem.id !== item.id),
                        )
                      }
                    >
                      הסרה
                    </button>
                  </div>
                ))}
              </div>
              <ChannelSelector value={paymentChannels} onChange={setPaymentChannels} />
              <ScheduleField value={paymentSchedule} onChange={setPaymentSchedule} />
              <div className="space-y-2">
                <Label htmlFor="payment-notes">הערות שיופיעו במסמך</Label>
                <textarea
                  id="payment-notes"
                  className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-white"
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  maxLength={2000}
                />
              </div>
              <Button
                type="submit"
                disabled={
                  paymentMutation.isPending ||
                  !studentId ||
                  paymentChannels.length === 0 ||
                  (selectedLessonIds.length === 0 && customItems.length === 0)
                }
              >
                {paymentMutation.isPending
                  ? "מפיק מסמך…"
                  : paymentSchedule
                    ? "הפקה ותזמון"
                    : "הפקה ושליחה"}
              </Button>
            </form>
          </Modal>

          <Modal
            open={openForm === "message"}
            onClose={() => setOpenForm(null)}
            title="הודעה לתלמיד/ה"
            description="הודעה חופשית על שיעורים, מיידית או מתוזמנת. כל תלמיד/ה מקבל/ת מייל אחד עם PDF שמרכז את השיעורים שנבחרו. זו לא דרישת תשלום."
            closeLabel="סגירה"
          >
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                messageMutation.mutate();
              }}
            >
              <fieldset className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-700 p-3">
                <legend className="px-2 text-sm font-medium text-slate-200">שיעורים לשליחה</legend>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
                  <p className="text-xs text-slate-300">נבחרו {messageLessonIds.length} שיעורים</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setMessageLessonIds(
                          assignedLessons.slice(0, 100).map((lesson) => lesson._id),
                        )
                      }
                      disabled={
                        assignedLessons.length === 0 ||
                        assignedLessons.every((lesson) => messageLessonIds.includes(lesson._id))
                      }
                    >
                      בחירת הכול
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setMessageLessonIds([])}
                      disabled={messageLessonIds.length === 0}
                    >
                      ניקוי
                    </Button>
                  </div>
                </div>
                {assignedLessons.length === 0 ? (
                  <p className="text-sm text-slate-400">אין שיעורים משויכים לשליחה.</p>
                ) : null}
                {assignedLessons.map((lesson) => (
                  <label key={lesson._id} className="flex items-start gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={messageLessonIds.includes(lesson._id)}
                      onChange={() =>
                        setMessageLessonIds((current) =>
                          current.includes(lesson._id)
                            ? current.filter((id) => id !== lesson._id)
                            : current.length < 100
                              ? [...current, lesson._id]
                              : current,
                        )
                      }
                    />
                    <span>
                      {lesson.subject} · {studentsById.get(lesson.studentId ?? "") ?? "תלמידה"} ·{" "}
                      {formatDate(lesson.startTime)}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="message-subject">נושא ההודעה</Label>
                <Input
                  id="message-subject"
                  value={messageSubject}
                  onChange={(event) => setMessageSubject(event.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-body">תוכן</Label>
                <textarea
                  id="message-body"
                  className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-white"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  maxLength={4000}
                  required
                />
              </div>
              <ChannelSelector value={messageChannels} onChange={setMessageChannels} />
              <ScheduleField value={messageSchedule} onChange={setMessageSchedule} />
              <Button
                type="submit"
                disabled={
                  messageMutation.isPending ||
                  messageLessonIds.length === 0 ||
                  !messageSubject.trim() ||
                  !messageBody.trim() ||
                  messageChannels.length === 0
                }
              >
                {messageMutation.isPending
                  ? "שומר…"
                  : messageSchedule
                    ? "תזמון הודעה"
                    : "שליחת הודעה"}
              </Button>
            </form>
          </Modal>

          {whatsAppEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle>תזכורות WhatsApp ידניות</CardTitle>
                <CardDescription>
                  בחשבון פרטי ההודעה מוכנה אוטומטית, אך נדרשת לחיצה שלך כדי לשלוח אותה.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(reminderTasksQuery.data ?? []).map((task) => (
                  <article
                    key={task._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 p-4"
                  >
                    <div>
                      <h3 className="font-semibold text-white">
                        {task.lessonSubject} · {task.studentName}
                      </h3>
                      <p className="text-sm text-slate-300">
                        שיעור: {formatDate(task.lessonStartTime)} · תזכורת
                        {task.reminderKind === "thirty_hours" ? " 30 שעות לפני" : " חצי שעה לפני"}
                      </p>
                      <p className="text-xs text-slate-400">
                        מועד פעולה: {formatDate(task.scheduledAt)} · {task.status}
                      </p>
                    </div>
                    <ManualDeliveryActions
                      delivery={task}
                      onChanged={() => void refreshBilling()}
                    />
                  </article>
                ))}
                {reminderTasksQuery.isSuccess && reminderTasksQuery.data.length === 0 ? (
                  <p className="text-sm text-slate-300">
                    אין כרגע תזכורות WhatsApp שממתינות לפעולה.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {view === "paymentHistory" ? (
        <Card>
          <CardHeader>
            <CardTitle>היסטוריית דרישות תשלום</CardTitle>
            <CardDescription>מסמכים שנשלחו, מתוזמנים, בוטלו או נכשלו נשמרים כאן.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(requestsQuery.data ?? []).map((request) => (
                <article
                  key={request._id}
                  className="space-y-3 rounded-xl border border-slate-700 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {request.requestNumber || "דרישה ישנה"}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {studentsById.get(request.studentId) ?? "תלמידה"} ·{" "}
                        {request.total.toFixed(2)} ₪ ·{" "}
                        {request.source === "automatic" ? "אוטומטית" : "ידנית"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {statusLabels[request.status]} ·{" "}
                        {formatDate(request.scheduledAt ?? request.generatedAt)}
                      </p>
                      <p className="mt-1 text-xs text-amber-200">
                        {paymentStatusLabels[request.paymentStatus ?? "unpaid"]}
                        {request.paymentNote ? ` · ${request.paymentNote}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={async () =>
                          showPdfPreview(
                            request.requestNumber || "דרישת תשלום",
                            await openPaymentRequestPdf(request._id),
                          )
                        }
                      >
                        צפייה ב־PDF
                      </Button>
                      {["scheduled", "pending_delivery", "failed"].includes(request.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelRequestMutation.mutate(request._id)}
                        >
                          ביטול
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <ul className="text-sm text-slate-300">
                    {request.lineItems.map((line) => (
                      <li
                        key={
                          line.lessonId ??
                          `${line.kind}-${line.subject}-${line.amount}-${line.date ?? "undated"}`
                        }
                      >
                        {line.subject} · {line.amount.toFixed(2)} ₪
                      </li>
                    ))}
                  </ul>
                  <PaymentStatusActions request={request} onChanged={() => void refreshBilling()} />
                  <PaymentTimeline request={request} />
                  {request.deliveries.map((delivery) => (
                    <div
                      key={delivery._id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"
                    >
                      <DeliveryBadge delivery={delivery} />
                      <ManualDeliveryActions
                        delivery={delivery}
                        onChanged={() => void refreshBilling()}
                      />
                    </div>
                  ))}
                </article>
              ))}
              {requestsQuery.isSuccess && requestsQuery.data.length === 0 ? (
                <p className="text-sm text-slate-300">עדיין אין דרישות תשלום.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view === "lessonMessageHistory" ? (
        <Card>
          <CardHeader>
            <CardTitle>היסטוריית הודעות על שיעורים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(messagesQuery.data ?? []).map((message) => (
              <article
                key={message._id}
                className="space-y-2 rounded-xl border border-slate-700 p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{message.subject}</h3>
                    <p className="text-sm text-slate-300">
                      {studentsById.get(message.studentId) ?? "תלמידה"} ·{" "}
                      {message.lessonIds?.length ?? (message.lessonId ? 1 : 0)} שיעורים ·{" "}
                      {statusLabels[message.status]} · {formatDate(message.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={async () =>
                        showPdfPreview(message.subject, await openLessonMessagePdf(message._id))
                      }
                    >
                      צפייה ב־PDF
                    </Button>
                    {["scheduled", "pending_delivery", "failed"].includes(message.status) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelMessageMutation.mutate(message._id)}
                      >
                        ביטול
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-300">{message.message}</p>
                {message.deliveries.map((delivery) => (
                  <div
                    key={delivery._id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"
                  >
                    <DeliveryBadge delivery={delivery} />
                    <ManualDeliveryActions
                      delivery={delivery}
                      onChanged={() => void refreshBilling()}
                    />
                  </div>
                ))}
              </article>
            ))}
            {messagesQuery.isSuccess && messagesQuery.data.length === 0 ? (
              <p className="text-sm text-slate-300">עדיין אין הודעות שמורות.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
