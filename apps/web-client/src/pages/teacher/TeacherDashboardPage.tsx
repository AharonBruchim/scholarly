import { useTranslation } from "react-i18next";
import { CalendarDays, CreditCard, History, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { PaymentAutomationCenter } from "@/components/billing/PaymentAutomationCenter";
import { Spinner } from "@/components/common/Spinner";
import { CreateLessonForm } from "@/components/dashboard/CreateLessonForm";
import { LessonHistory } from "@/components/dashboard/LessonHistory";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTabs, type DashboardTab } from "@/components/ui/dashboard-tabs";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDateTime, getLessonDashboardStats } from "@/lib/dashboard";

type TeacherDashboardTab = "lessons" | "create" | "payments" | "history";

export default function TeacherDashboardPage() {
  const { t, i18n } = useTranslation();
  const lessonsQuery = useDashboardLessons();
  const studentsQuery = useDirectoryUsers("student");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>("lessons");
  const tabs = useMemo<DashboardTab<TeacherDashboardTab>[]>(
    () => [
      { id: "lessons", label: t("dashboard.tabs.lessons"), icon: CalendarDays },
      { id: "create", label: t("dashboard.tabs.create"), icon: PlusCircle },
      { id: "payments", label: t("dashboard.tabs.payments"), icon: CreditCard },
      { id: "history", label: t("dashboard.tabs.history"), icon: History },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-400">
            {t("dashboard.teacherLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.teacherTitle")}</h1>
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

          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            {activeTab === "lessons" ? (
              <UpcomingLessonsList
                lessons={lessonsQuery.data}
                people={studentsQuery.data ?? []}
                personIdKey="studentId"
                personLabel={t("lessons.student")}
                allowActions
              />
            ) : null}
            {activeTab === "create" ? <CreateLessonForm /> : null}
            {activeTab === "payments" ? (
              <PaymentAutomationCenter lessons={lessonsQuery.data} students={studentsQuery.data ?? []} />
            ) : null}
            {activeTab === "history" ? (
              <LessonHistory
                lessons={lessonsQuery.data}
                people={studentsQuery.data ?? []}
                personIdKey="studentId"
                personLabel={t("lessons.student")}
                allowComplete
              />
            ) : null}
          </DashboardTabs>
        </>
      ) : null}
    </div>
  );
}
