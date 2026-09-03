import { useTranslation } from "react-i18next";
import { PaymentAutomationCenter } from "@/components/billing/PaymentAutomationCenter";
import { Spinner } from "@/components/common/Spinner";
import { CreateLessonForm } from "@/components/dashboard/CreateLessonForm";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDateTime, getLessonDashboardStats } from "@/lib/dashboard";

export default function TeacherDashboardPage() {
  const { t, i18n } = useTranslation();
  const lessonsQuery = useDashboardLessons();
  const studentsQuery = useDirectoryUsers("student");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-400">
            {t("dashboard.teacherLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.teacherTitle")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="#create-lesson">{t("dashboard.addLesson")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="#upcoming-lessons">{t("dashboard.viewLessons")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="#payments">תשלומים ושליחות</a>
          </Button>
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
                <CardTitle>{t("dashboard.scheduledLessons")}</CardTitle>
                <CardDescription>{t("dashboard.scheduledDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{stats.upcomingLessonCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.students")}</CardTitle>
                <CardDescription>{t("dashboard.studentsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{stats.studentCount}</p>
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

          <UpcomingLessonsList
            lessons={lessonsQuery.data}
            people={studentsQuery.data ?? []}
            personIdKey="studentId"
            personLabel={t("lessons.student")}
            allowActions
          />
        </>
      ) : null}

      <CreateLessonForm />

      {lessonsQuery.isSuccess ? (
        <PaymentAutomationCenter lessons={lessonsQuery.data} students={studentsQuery.data ?? []} />
      ) : null}
    </div>
  );
}
