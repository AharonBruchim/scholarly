import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { PaymentAutomationCenter } from "@/components/billing/PaymentAutomationCenter";
import { DashboardSkeleton } from "@/components/common/DashboardSkeleton";
import { CreateLessonForm } from "@/components/dashboard/CreateLessonForm";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { LessonHistory } from "@/components/dashboard/LessonHistory";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { useAuth } from "@/context/auth-context-core";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDashboardRoute } from "@/hooks/useDashboardRoute";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDayTime, getLessonDashboardStats } from "@/lib/dashboard";
import {
  type TeacherHistorySection,
  type TeacherTab,
  teacherHistorySectionIds,
  teacherTabIds,
} from "@/lib/dashboard-navigation";

export default function TeacherDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lessonsQuery = useDashboardLessons();
  const studentsQuery = useDirectoryUsers("student");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
  const { activeTab, activeSection, redirectPath } = useDashboardRoute<
    TeacherTab,
    TeacherHistorySection
  >("/teacher", teacherTabIds, {
    history: teacherHistorySectionIds,
  });
  if (redirectPath || !activeTab)
    return <Navigate to={redirectPath ?? "/teacher/lessons"} replace />;

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
                { label: t("dashboard.students"), value: String(stats.studentCount) },
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
                people={studentsQuery.data ?? []}
                personIdKey="studentId"
                personLabel={t("lessons.student")}
                allowActions
              />
            ) : null}
            {activeTab === "create" ? <CreateLessonForm /> : null}
            {activeTab === "payments" ? (
              <PaymentAutomationCenter
                lessons={lessonsQuery.data}
                students={studentsQuery.data ?? []}
                view="automation"
              />
            ) : null}
            {activeTab === "history" && activeSection ? (
              <>
                {activeSection === "lessons" ? (
                  <LessonHistory
                    lessons={lessonsQuery.data}
                    people={studentsQuery.data ?? []}
                    personIdKey="studentId"
                    personLabel={t("lessons.student")}
                    allowComplete
                    showLessonMessages
                  />
                ) : null}
                {activeSection === "messages" ? (
                  <PaymentAutomationCenter
                    lessons={lessonsQuery.data}
                    students={studentsQuery.data ?? []}
                    view="lessonMessageHistory"
                  />
                ) : null}
                {activeSection === "payments" ? (
                  <PaymentAutomationCenter
                    lessons={lessonsQuery.data}
                    students={studentsQuery.data ?? []}
                    view="paymentHistory"
                  />
                ) : null}
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
