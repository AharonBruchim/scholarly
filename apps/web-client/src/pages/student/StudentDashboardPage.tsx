import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/common/Spinner";
import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { StudentBookingForm } from "@/components/dashboard/StudentBookingForm";
import { TeacherDirectory } from "@/components/dashboard/TeacherDirectory";
import { UpcomingLessonsList } from "@/components/dashboard/UpcomingLessonsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import { formatLessonDateTime, getLessonDashboardStats } from "@/lib/dashboard";

export default function StudentDashboardPage() {
  const { t, i18n } = useTranslation();
  const lessonsQuery = useDashboardLessons();
  const teachersQuery = useDirectoryUsers("teacher");
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
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
    window.requestAnimationFrame(() => {
      document.getElementById("teacher-lessons")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            {t("dashboard.studentLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.studentTitle")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="#teacher-directory">{t("dashboard.findTeachers")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="#upcoming-lessons">{t("dashboard.viewLessons")}</a>
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

          <div id="teacher-lessons" className="scroll-mt-6 space-y-4">
            {selectedTeacherName ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                <p className="text-sm text-sky-100">
                  {t("lessons.teacherFilter", { name: selectedTeacherName })}
                </p>
                <Button type="button" variant="ghost" onClick={() => setSelectedTeacherId(null)}>
                  {t("lessons.showAll")}
                </Button>
              </div>
            ) : null}

            {selectedTeacher ? (
              <StudentBookingForm key={selectedTeacher._id} teacher={selectedTeacher} />
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
              description={selectedTeacherName ? t("lessons.withTeacherDescription") : undefined}
              emptyMessage={selectedTeacherName ? t("lessons.emptyWithTeacher") : undefined}
              allowActions
            />
          </div>
        </>
      ) : null}

      <TeacherDirectory
        selectedTeacherId={selectedTeacherId}
        onSelectTeacher={(teacher) => selectTeacher(teacher._id)}
      />
    </div>
  );
}
