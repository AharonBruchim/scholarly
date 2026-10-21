import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompleteLesson } from "@/hooks/useDirectory";
import { formatLessonDateTime } from "@/lib/dashboard";
import type { DirectoryUser, Lesson } from "@/services/api";

interface LessonHistoryProps {
  lessons: Lesson[];
  people: DirectoryUser[];
  personIdKey: "studentId" | "teacherId";
  personLabel: string;
  allowComplete?: boolean;
}

const statusClasses: Record<Lesson["status"], string> = {
  available: "text-slate-400",
  scheduled: "text-amber-200",
  completed: "text-emerald-300",
  cancelled: "text-rose-300",
};

function hasEnded(lesson: Lesson): boolean {
  return new Date(lesson.endTime).getTime() < Date.now();
}

export function LessonHistory({
  lessons,
  people,
  personIdKey,
  personLabel,
  allowComplete = false,
}: LessonHistoryProps) {
  const { t, i18n } = useTranslation();
  const completeMutation = useCompleteLesson();
  const peopleById = new Map(
    people.map((person) => [person._id, `${person.firstName} ${person.lastName}`]),
  );
  const needsCompletion = (lesson: Lesson) =>
    allowComplete && lesson.status === "scheduled" && hasEnded(lesson);
  const historyLessons = lessons
    .filter(
      (lesson) =>
        lesson.status === "completed" || lesson.status === "cancelled" || hasEnded(lesson),
    )
    .sort(
      (left, right) =>
        Number(needsCompletion(right)) - Number(needsCompletion(left)) ||
        new Date(right.startTime).getTime() - new Date(left.startTime).getTime(),
    );
  const pendingCompletionCount = historyLessons.filter(needsCompletion).length;

  return (
    <Card id="lesson-history" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("lessons.historyTitle")}</CardTitle>
        <CardDescription>{t("lessons.historyDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingCompletionCount > 0 ? (
          <p
            role="status"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-100"
          >
            {t("lessons.pendingCompletion", { count: pendingCompletionCount })}
          </p>
        ) : null}
        {historyLessons.length === 0 ? (
          <p className="text-sm text-slate-300">{t("lessons.historyEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {historyLessons.map((lesson) => (
              <article
                key={lesson._id}
                className={
                  needsCompletion(lesson)
                    ? "rounded-lg border border-amber-500/50 bg-amber-500/5 p-4"
                    : "rounded-lg border border-slate-700 p-4"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{lesson.subject}</h3>
                    <p className="text-sm text-slate-300">
                      {personLabel}:{" "}
                      {lesson[personIdKey]
                        ? (peopleById.get(lesson[personIdKey] as string) ??
                          t("lessons.unknownPerson"))
                        : t("lessons.openSlot")}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatLessonDateTime(lesson.startTime, i18n.language)} ·{" "}
                      {lesson.durationMinutes} {t("automation.duration")}
                    </p>
                    {lesson.meetingUrl ? (
                      <a
                        className="mt-1 inline-flex text-sm text-sky-300 hover:text-sky-200"
                        href={lesson.meetingUrl}
                      >
                        {t("lessons.meetingLink")}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-medium ${statusClasses[lesson.status]}`}>
                      {t(`lessons.status.${lesson.status}`)}
                    </span>
                    {needsCompletion(lesson) ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => completeMutation.mutate(lesson._id)}
                        disabled={completeMutation.isPending}
                      >
                        {t("lessons.markCompleted")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {completeMutation.isError ? (
          <p role="alert" className="text-sm text-red-400">
            {t("lessons.completeFailed")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
