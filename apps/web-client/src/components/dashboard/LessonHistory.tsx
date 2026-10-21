import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DeliveryBadge } from "@/components/billing/DeliveryBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompleteLesson } from "@/hooks/useDirectory";
import { formatLessonDateTime } from "@/lib/dashboard";
import {
  type DirectoryUser,
  fetchLessonMessages,
  type Lesson,
  type LessonMessageRecord,
} from "@/services/api";

interface LessonHistoryProps {
  lessons: Lesson[];
  people: DirectoryUser[];
  personIdKey: "studentId" | "teacherId";
  personLabel: string;
  allowComplete?: boolean;
  showLessonMessages?: boolean;
}

const statusClasses: Record<Lesson["status"], string> = {
  available: "text-slate-400",
  scheduled: "text-amber-200",
  completed: "text-emerald-300",
  cancelled: "text-rose-300",
};

function groupMessagesByLessonId(
  messages: LessonMessageRecord[],
): Map<string, LessonMessageRecord[]> {
  const messagesByLessonId = new Map<string, LessonMessageRecord[]>();
  for (const message of messages) {
    const lessonIds = message.lessonIds ?? (message.lessonId ? [message.lessonId] : []);
    for (const lessonId of lessonIds) {
      messagesByLessonId.set(lessonId, [...(messagesByLessonId.get(lessonId) ?? []), message]);
    }
  }
  return messagesByLessonId;
}

function LessonMessages({ messages }: { messages: LessonMessageRecord[] }) {
  const { t, i18n } = useTranslation();
  return (
    <details className="group mt-3 rounded-md border border-slate-800 bg-slate-950/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm text-sky-300 hover:text-sky-200">
        <Mail className="h-4 w-4" aria-hidden="true" />
        {t("lessons.messagesCount", { count: messages.length })}
      </summary>
      <ul className="space-y-3 border-t border-slate-800 px-3 py-3">
        {messages.map((message) => (
          <li key={message._id} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-white">{message.subject}</p>
              <p className="text-xs text-slate-400">
                {formatLessonDateTime(message.scheduledAt, i18n.language)}
              </p>
            </div>
            <p className="line-clamp-2 whitespace-pre-wrap text-sm text-slate-300">
              {message.message}
            </p>
            <div className="flex flex-wrap gap-2">
              {message.deliveries.map((delivery) => (
                <DeliveryBadge key={delivery._id} delivery={delivery} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function hasEnded(lesson: Lesson): boolean {
  return new Date(lesson.endTime).getTime() < Date.now();
}

export function LessonHistory({
  lessons,
  people,
  personIdKey,
  personLabel,
  allowComplete = false,
  showLessonMessages = false,
}: LessonHistoryProps) {
  const { t, i18n } = useTranslation();
  const completeMutation = useCompleteLesson();
  const messagesQuery = useQuery({
    queryKey: ["lesson-messages"],
    queryFn: fetchLessonMessages,
    enabled: showLessonMessages,
  });
  const messagesByLessonId = groupMessagesByLessonId(messagesQuery.data ?? []);
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
                {messagesByLessonId.has(lesson._id) ? (
                  <LessonMessages messages={messagesByLessonId.get(lesson._id) ?? []} />
                ) : null}
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
