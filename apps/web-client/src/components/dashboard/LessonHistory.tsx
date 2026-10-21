import { useQuery } from "@tanstack/react-query";
import { Mail, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DeliveryBadge } from "@/components/billing/DeliveryBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompleteLesson } from "@/hooks/useDirectory";
import {
  formatLessonDateTime,
  formatLessonDayTime,
  formatLessonMonth,
  getLessonMonthKey,
} from "@/lib/dashboard";
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
  available: "border-slate-600 bg-slate-800/60 text-slate-300",
  scheduled: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const lessonStatuses: Lesson["status"][] = ["scheduled", "completed", "cancelled", "available"];

type StatusFilter = Lesson["status"] | "all";

const selectClassName =
  "h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

interface ILessonMonthGroup {
  key: string;
  label: string;
  lessons: Lesson[];
}

function groupLessonsByMonth(lessons: Lesson[], language: string): ILessonMonthGroup[] {
  const groups = new Map<string, ILessonMonthGroup>();
  for (const lesson of lessons) {
    const key = getLessonMonthKey(lesson.startTime);
    const group = groups.get(key) ?? {
      key,
      label: formatLessonMonth(lesson.startTime, language),
      lessons: [],
    };
    group.lessons.push(lesson);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function countByStatus(lessons: Lesson[], status: Lesson["status"]): number {
  return lessons.filter((lesson) => lesson.status === status).length;
}

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
  const [searchText, setSearchText] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const personName = (lesson: Lesson) => {
    const personId = lesson[personIdKey];
    return personId
      ? (peopleById.get(personId) ?? t("lessons.unknownPerson"))
      : t("lessons.openSlot");
  };
  const needsCompletion = (lesson: Lesson) =>
    allowComplete && lesson.status === "scheduled" && hasEnded(lesson);
  const historyLessons = lessons
    .filter(
      (lesson) =>
        lesson.status === "completed" || lesson.status === "cancelled" || hasEnded(lesson),
    )
    .sort(
      (left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime(),
    );
  const pendingCompletionCount = historyLessons.filter(needsCompletion).length;
  const personOptions = [
    ...new Set(historyLessons.flatMap((lesson) => lesson[personIdKey] ?? [])),
  ].map((personId) => ({
    id: personId,
    name: peopleById.get(personId) ?? t("lessons.unknownPerson"),
  }));
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredLessons = historyLessons.filter(
    (lesson) =>
      (statusFilter === "all" ? lesson.status !== "available" : lesson.status === statusFilter) &&
      (personFilter === "all" || lesson[personIdKey] === personFilter) &&
      (!normalizedSearch ||
        `${lesson.subject} ${personName(lesson)}`.toLowerCase().includes(normalizedSearch)),
  );
  const monthGroups = groupLessonsByMonth(filteredLessons, i18n.language);
  const filtersActive =
    Boolean(normalizedSearch) || personFilter !== "all" || statusFilter !== "all";
  const clearFilters = () => {
    setSearchText("");
    setPersonFilter("all");
    setStatusFilter("all");
  };

  return (
    <Card id="lesson-history" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("lessons.historyTitle")}</CardTitle>
        <CardDescription>{t("lessons.historyDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingCompletionCount > 0 ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          >
            <p className="text-sm font-medium text-amber-100">
              {t("lessons.pendingCompletion", { count: pendingCompletionCount })}
            </p>
            {statusFilter === "scheduled" ? null : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setStatusFilter("scheduled")}
              >
                {t("lessons.showPending")}
              </Button>
            )}
          </div>
        ) : null}
        {historyLessons.length === 0 ? (
          <p className="text-sm text-slate-300">{t("lessons.historyEmpty")}</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t("lessons.filters.search")}
                  aria-label={t("lessons.filters.search")}
                  className={`${selectClassName} w-full ps-9`}
                />
              </div>
              <select
                value={personFilter}
                onChange={(event) => setPersonFilter(event.target.value)}
                aria-label={personLabel}
                className={selectClassName}
              >
                <option value="all">
                  {t("lessons.filters.allPeople", { label: personLabel })}
                </option>
                {personOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                aria-label={t("lessons.filters.status")}
                className={selectClassName}
              >
                <option value="all">{t("lessons.filters.allStatuses")}</option>
                {lessonStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`lessons.status.${status}`)}
                  </option>
                ))}
              </select>
              {filtersActive ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  {t("lessons.filters.clear")}
                </Button>
              ) : null}
            </div>

            {monthGroups.length === 0 ? (
              <p className="text-sm text-slate-300">{t("lessons.filters.noResults")}</p>
            ) : (
              <div className="space-y-6">
                {monthGroups.map((group) => (
                  <section key={group.key} aria-label={group.label} className="space-y-2">
                    <header className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                      <h3 className="text-sm font-semibold text-white">{group.label}</h3>
                      <p className="text-xs text-slate-400">
                        {t("lessons.monthSummary", {
                          total: group.lessons.length,
                          completed: countByStatus(group.lessons, "completed"),
                          cancelled: countByStatus(group.lessons, "cancelled"),
                        })}
                      </p>
                    </header>
                    <ul className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800">
                      {group.lessons.map((lesson) => (
                        <li
                          key={lesson._id}
                          className={
                            needsCompletion(lesson) ? "bg-amber-500/5 px-4 py-3" : "px-4 py-3"
                          }
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                            <time
                              dateTime={lesson.startTime}
                              className="text-sm tabular-nums text-slate-300"
                            >
                              {formatLessonDayTime(lesson.startTime, i18n.language)}
                            </time>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {lesson.subject}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {personName(lesson)} · {lesson.durationMinutes}{" "}
                                {t("automation.duration")}
                                {lesson.meetingUrl ? (
                                  <>
                                    {" · "}
                                    <a
                                      className="text-sky-300 hover:text-sky-200"
                                      href={lesson.meetingUrl}
                                    >
                                      {t("lessons.meetingLink")}
                                    </a>
                                  </>
                                ) : null}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[lesson.status]}`}
                              >
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
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
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
