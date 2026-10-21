import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Spinner } from "@/components/common/Spinner";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { LessonHistory } from "@/components/dashboard/LessonHistory";
import { StudentBookingForm } from "@/components/dashboard/StudentBookingForm";
import { TeacherDirectory } from "@/components/dashboard/TeacherDirectory";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDashboardRoute } from "@/hooks/useDashboardRoute";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDateTime, getLessonDashboardStats } from "@/lib/dashboard";
import {
  type HistorySection,
  historySectionIds,
  type StudentTab,
  studentTabIds,
} from "@/lib/dashboard-navigation";
import {
  fetchPaymentRequests,
  openPaymentRequestPdf,
  type PaymentRequestRecord,
  updatePaymentRequestStatus,
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
  const queryClient = useQueryClient();
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);
  const requestsQuery = useQuery({ queryKey: ["billing"], queryFn: fetchPaymentRequests });
  const visibleRequests = (requestsQuery.data ?? []).filter(
    (request) => isPaymentSettled(request) === settled,
  );
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      paymentStatus,
    }: {
      id: string;
      paymentStatus: "claimed_paid" | "disputed";
    }) => updatePaymentRequestStatus(id, { paymentStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
  });

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
                <h3 className="font-semibold text-white">{request.requestNumber}</h3>
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
                        statusMutation.mutate({ id: request._id, paymentStatus: "claimed_paid" })
                      }
                      disabled={statusMutation.isPending || request.paymentStatus === "paid"}
                    >
                      שילמתי
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        statusMutation.mutate({ id: request._id, paymentStatus: "disputed" })
                      }
                      disabled={statusMutation.isPending || request.paymentStatus === "paid"}
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
          </article>
        ))}
        {requestsQuery.isSuccess && visibleRequests.length === 0 ? (
          <p className="text-sm text-slate-300">
            {settled ? "עדיין אין תשלומים שהסתיימו." : "אין כרגע דרישות תשלום פתוחות."}
          </p>
        ) : null}
        {requestsQuery.isError || statusMutation.isError ? (
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
  const lessonsQuery = useDashboardLessons();
  const teachersQuery = useDirectoryUsers("teacher");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
  const navigate = useNavigate();
  const { activeTab, activeSection, redirectPath } = useDashboardRoute<StudentTab, HistorySection>(
    "/student",
    studentTabIds,
    {
      history: historySectionIds,
    },
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const selectedTeacher = (teachersQuery.data ?? []).find(
    (teacher) => teacher._id === selectedTeacherId,
  );
  const selectedTeacherName = selectedTeacher
    ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
    : null;
  const visibleLessons = selectedTeacherId
    ? (lessonsQuery.data ?? []).filter((lesson) => lesson.teacherId === selectedTeacherId)
    : (lessonsQuery.data ?? []);

  const selectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    navigate("/student/book");
  };

  if (redirectPath || !activeTab)
    return <Navigate to={redirectPath ?? "/student/lessons"} replace />;

  return (
    <div className="space-y-6">
      <div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            {t("dashboard.studentLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.studentTitle")}</h1>
        </div>
      </div>

      {lessonsQuery.isPending ? <Spinner compact /> : null}
      {lessonsQuery.isError ? (
        <LessonDataError onRetry={() => void lessonsQuery.refetch()} />
      ) : null}

      {lessonsQuery.isSuccess ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.subjects")}</CardTitle>
                <CardDescription>{t("dashboard.subjectsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{stats.subjectCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.scheduledLessons")}</CardTitle>
                <CardDescription>{t("dashboard.scheduledDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{stats.upcomingLessonCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.nextLesson")}</CardTitle>
                <CardDescription>
                  {stats.nextLesson
                    ? t("dashboard.nextLessonWithSubject", {
                        subject: stats.nextLesson.subject,
                        date: formatLessonDateTime(stats.nextLesson.startTime, i18n.language),
                      })
                    : t("dashboard.noUpcomingLesson")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-white">
                  {stats.nextLesson
                    ? formatLessonDateTime(stats.nextLesson.startTime, i18n.language)
                    : t("common.none")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            {activeTab === "lessons" ? (
              <div className="space-y-4">
                {selectedTeacherName ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
                    <p className="text-sm text-sky-100">
                      {t("lessons.teacherFilter", { name: selectedTeacherName })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedTeacherId(null)}
                    >
                      {t("lessons.showAll")}
                    </Button>
                  </div>
                ) : null}
                <UpcomingLessonsList
                  lessons={visibleLessons}
                  people={teachersQuery.data ?? []}
                  personIdKey="teacherId"
                  personLabel={t("lessons.teacher")}
                  title={
                    selectedTeacherName
                      ? t("lessons.withTeacherTitle", { name: selectedTeacherName })
                      : undefined
                  }
                  description={
                    selectedTeacherName ? t("lessons.withTeacherDescription") : undefined
                  }
                  emptyMessage={selectedTeacherName ? t("lessons.emptyWithTeacher") : undefined}
                  allowActions
                />
              </div>
            ) : null}
            {activeTab === "book" ? (
              <div className="space-y-4">
                {selectedTeacher ? (
                  <StudentBookingForm key={selectedTeacher._id} teacher={selectedTeacher} />
                ) : null}
                <TeacherDirectory
                  selectedTeacherId={selectedTeacherId}
                  onSelectTeacher={(teacher) => selectTeacher(teacher._id)}
                />
              </div>
            ) : null}
            {activeTab === "payments" ? <StudentPaymentRequests settled={false} /> : null}
            {activeTab === "history" && activeSection ? (
              <>
                {activeSection === "lessons" ? (
                  <LessonHistory
                    lessons={visibleLessons}
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
