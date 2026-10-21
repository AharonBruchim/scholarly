import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, History } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { PaymentTimeline } from "@/components/billing/PaymentTimeline";
import {
  type PaymentClaimMode,
  StudentPaymentClaimForm,
} from "@/components/billing/StudentPaymentClaimForm";
import { DashboardSkeleton } from "@/components/common/DashboardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { BookingFlow } from "@/components/dashboard/BookingFlow";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { LessonHistory } from "@/components/dashboard/LessonHistory";
import { StudentLessonMessages } from "@/components/dashboard/StudentLessonMessages";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context-core";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDashboardRoute } from "@/hooks/useDashboardRoute";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDayTime, getLessonDashboardStats } from "@/lib/dashboard";
import {
  type StudentHistorySection,
  type StudentTab,
  studentHistorySectionIds,
  studentTabIds,
} from "@/lib/dashboard-navigation";
import {
  fetchPaymentRequests,
  markPaymentRequestsViewed,
  openPaymentRequestPdf,
  type PaymentRequestRecord,
} from "@/services/api";

const paymentStatusLabels: Record<PaymentRequestRecord["paymentStatus"], string> = {
  unpaid: "לא שולם",
  claimed_paid: "סימנתי ששילמתי",
  paid: "התקבל אצל המורה",
  disputed: "במחלוקת",
  waived: "ויתור",
};

const settledPaymentStatuses: ReadonlyArray<PaymentRequestRecord["paymentStatus"]> = [
  "paid",
  "waived",
];

function isPaymentSettled(request: PaymentRequestRecord): boolean {
  return settledPaymentStatuses.includes(request.paymentStatus ?? "unpaid");
}

function formatPaymentDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StudentPaymentRequests({ settled }: { settled: boolean }) {
  const [claimTarget, setClaimTarget] = useState<{
    requestId: string;
    mode: PaymentClaimMode;
  } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);
  const queryClient = useQueryClient();
  const requestsQuery = useQuery({ queryKey: ["billing"], queryFn: fetchPaymentRequests });
  const visibleRequests = (requestsQuery.data ?? []).filter(
    (request) => isPaymentSettled(request) === settled,
  );
  const [newRequestIds, setNewRequestIds] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    if (settled || newRequestIds || !requestsQuery.data) return;
    const unseenIds = requestsQuery.data
      .filter((request) => !request.studentViewedAt)
      .map((request) => request._id);
    setNewRequestIds(new Set(unseenIds));
    if (unseenIds.length === 0) return;
    void markPaymentRequestsViewed().then(() =>
      queryClient.invalidateQueries({ queryKey: ["billing"] }),
    );
  }, [settled, newRequestIds, requestsQuery.data, queryClient]);

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const showPdf = async (request: PaymentRequestRecord) => {
    if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    setPdfPreview({
      title: request.requestNumber || "דרישת תשלום",
      url: await openPaymentRequestPdf(request._id),
    });
  };

  const closePdf = () => {
    setPdfPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  return (
    <Card id="payments" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{settled ? "היסטוריית תשלומים" : "דרישות תשלום פתוחות"}</CardTitle>
        <CardDescription>
          {settled
            ? "דרישות תשלום ששולמו או שוויתרו עליהן."
            : "כאן אפשר לראות דרישות תשלום ולסמן ששילמת או שיש מחלוקת."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pdfPreview ? (
          <div className="space-y-3 rounded-lg border border-slate-700 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-white">{pdfPreview.title}</h3>
              <Button type="button" size="sm" variant="secondary" onClick={closePdf}>
                סגירה
              </Button>
            </div>
            <iframe
              title={pdfPreview.title}
              src={pdfPreview.url}
              className="h-[60vh] w-full rounded-md border border-slate-700 bg-white"
            />
          </div>
        ) : null}
        {visibleRequests.map((request) => (
          <article key={request._id} className="space-y-3 rounded-lg border border-slate-700 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  {request.requestNumber}
                  {newRequestIds?.has(request._id) ? (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                      חדש
                    </span>
                  ) : null}
                </h3>
                <p className="text-sm text-slate-300">
                  {request.total.toFixed(2)} ₪ · {formatPaymentDate(request.scheduledAt)}
                </p>
                <p className="text-xs text-amber-200">
                  {paymentStatusLabels[request.paymentStatus ?? "unpaid"]}
                  {request.paymentNote ? ` · ${request.paymentNote}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void showPdf(request)}
                >
                  צפייה ב־PDF
                </Button>
                {settled ? null : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        setClaimTarget({ requestId: request._id, mode: "claimed_paid" })
                      }
                      disabled={request.paymentStatus === "paid"}
                    >
                      שילמתי
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setClaimTarget({ requestId: request._id, mode: "disputed" })}
                      disabled={request.paymentStatus === "paid"}
                    >
                      מחלוקת
                    </Button>
                  </>
                )}
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
            {claimTarget?.requestId === request._id ? (
              <StudentPaymentClaimForm
                key={claimTarget.mode}
                requestId={request._id}
                mode={claimTarget.mode}
                onClose={() => setClaimTarget(null)}
              />
            ) : null}
            <PaymentTimeline request={request} />
          </article>
        ))}
        {requestsQuery.isSuccess && visibleRequests.length === 0 ? (
          <EmptyState
            icon={settled ? History : CheckCircle2}
            title={settled ? "עדיין אין תשלומים שהסתיימו" : "אין דרישות תשלום פתוחות"}
            description={
              settled
                ? "תשלומים שאושרו יופיעו כאן."
                : "כשהמורה ישלח/תשלח דרישת תשלום, היא תופיע כאן."
            }
          />
        ) : null}
        {requestsQuery.isError ? (
          <p role="alert" className="text-sm text-red-400">
            לא ניתן לטעון או לעדכן את דרישות התשלום.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lessonsQuery = useDashboardLessons();
  const teachersQuery = useDirectoryUsers("teacher");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
  const { activeTab, activeSection, redirectPath } = useDashboardRoute<
    StudentTab,
    StudentHistorySection
  >("/student", studentTabIds, {
    history: studentHistorySectionIds,
  });

  if (redirectPath || !activeTab)
    return <Navigate to={redirectPath ?? "/student/lessons"} replace />;

  return (
    <div className="space-y-6">
      {lessonsQuery.isPending ? <DashboardSkeleton /> : null}
      {lessonsQuery.isError ? (
        <LessonDataError onRetry={() => void lessonsQuery.refetch()} />
      ) : null}

      {lessonsQuery.isSuccess ? (
        <>
          {activeTab === "lessons" ? (
            <DashboardOverview
              greeting={t("dashboard.greeting", { name: user?.firstName ?? "" })}
              stats={[
                {
                  label: t("dashboard.scheduledLessons"),
                  value: String(stats.upcomingLessonCount),
                },
                { label: t("dashboard.subjects"), value: String(stats.subjectCount) },
                {
                  label: t("dashboard.nextLesson"),
                  value: stats.nextLesson
                    ? formatLessonDayTime(stats.nextLesson.startTime, i18n.language)
                    : t("dashboard.noUpcomingLesson"),
                  ...(stats.nextLesson ? { hint: stats.nextLesson.subject } : {}),
                  wide: true,
                },
              ]}
            />
          ) : null}

          <div className="space-y-5">
            {activeTab === "lessons" ? (
              <UpcomingLessonsList
                lessons={lessonsQuery.data}
                people={teachersQuery.data ?? []}
                personIdKey="teacherId"
                personLabel={t("lessons.teacher")}
                allowActions
              />
            ) : null}
            {activeTab === "book" ? (
              <BookingFlow
                teachers={teachersQuery.data ?? []}
                teachersPending={teachersQuery.isPending}
              />
            ) : null}
            {activeTab === "payments" ? <StudentPaymentRequests settled={false} /> : null}
            {activeTab === "messages" ? (
              <StudentLessonMessages teachers={teachersQuery.data ?? []} />
            ) : null}
            {activeTab === "history" && activeSection ? (
              <>
                {activeSection === "lessons" ? (
                  <LessonHistory
                    lessons={lessonsQuery.data}
                    people={teachersQuery.data ?? []}
                    personIdKey="teacherId"
                    personLabel={t("lessons.teacher")}
                  />
                ) : null}
                {activeSection === "payments" ? <StudentPaymentRequests settled /> : null}
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
