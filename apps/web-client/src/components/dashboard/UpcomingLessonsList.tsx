import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dateToIso, gregorianMonthDays } from "@/lib/hebrew-calendar";
import { formatLessonDateTime, getUpcomingLessons } from "@/lib/dashboard";
import type { DirectoryUser, Lesson } from "@/services/api";
import { LessonActions } from "./LessonActions";

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

interface UpcomingLessonsListProps {
  lessons: Lesson[];
  people: DirectoryUser[];
  personIdKey: "studentId" | "teacherId";
  personLabel: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  allowActions?: boolean;
}

export function UpcomingLessonsList({
  lessons,
  people,
  personIdKey,
  personLabel,
  title,
  description,
  emptyMessage,
  allowActions = false,
}: UpcomingLessonsListProps) {
  const { t, i18n } = useTranslation();
  const upcomingLessons = getUpcomingLessons(lessons);
  const initialMonth = upcomingLessons[0] ? new Date(upcomingLessons[0].startTime) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const peopleById = new Map(
    people.map((person) => [person._id, `${person.firstName} ${person.lastName}`]),
  );
  const locale = i18n.language.startsWith("en") ? "en-US" : "he-IL";
  const calendarDays = useMemo(() => gregorianMonthDays(visibleMonth), [visibleMonth]);
  const firstDayOffset = calendarDays[0]?.dayOfWeek ?? 0;
  const lessonsByDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of upcomingLessons) {
      const date = new Date(lesson.startTime);
      const key = dateToIso(date);
      map.set(key, [...(map.get(key) ?? []), lesson]);
    }
    return map;
  }, [upcomingLessons]);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <Card id="upcoming-lessons" className="scroll-mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title ?? t("lessons.calendarTitle")}</CardTitle>
            <CardDescription>{description ?? t("lessons.calendarDescription")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={t("calendar.previousMonth")}
              onClick={() => moveMonth(-1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="min-w-36 text-center text-sm font-semibold text-white">{monthLabel}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={t("calendar.nextMonth")}
              onClick={() => moveMonth(1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-slate-300">{emptyMessage ?? t("lessons.empty")}</p>
        ) : (
          <section className="space-y-3" aria-label={t("lessons.calendarTitle")}>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.slice(0, firstDayOffset).map((weekday) => (
                <span key={`empty-${weekday}`} />
              ))}
              {calendarDays.map((day) => {
                const dayLessons = lessonsByDay.get(day.isoDate) ?? [];
                const hasLessons = dayLessons.length > 0;
                return (
                  <article
                    key={day.isoDate}
                    title={[day.hebrewFull, ...day.holidays].join(" · ")}
                    className={`min-h-28 rounded-lg border p-1.5 transition ${
                      hasLessons
                        ? "border-sky-500/60 bg-sky-500/10"
                        : "border-slate-800 bg-slate-950/40"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-1">
                      <time className="text-start" dateTime={day.isoDate}>
                        <span className="block text-sm font-semibold text-white">
                          {day.civilDay}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400">
                          {day.hebrewShort}
                        </span>
                      </time>
                      {hasLessons ? (
                        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-200">
                          {dayLessons.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {dayLessons.map((lesson) => (
                        <article
                          key={lesson._id}
                          className="rounded-md border border-slate-700 bg-slate-900/90 p-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {lesson.subject}
                              </p>
                              <p className="text-xs text-slate-300">
                                {personLabel}:{" "}
                                {lesson[personIdKey]
                                  ? (peopleById.get(lesson[personIdKey] as string) ??
                                    t("lessons.unknownPerson"))
                                  : t("lessons.openSlot")}
                              </p>
                            </div>
                            <time className="shrink-0 text-xs text-sky-300" dateTime={lesson.startTime}>
                              {new Intl.DateTimeFormat(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(lesson.startTime))}
                            </time>
                          </div>
                          {lesson.status === "available" ? (
                            <p className="mt-1 text-xs text-emerald-300">{t("lessons.available")}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-400">
                            {formatLessonDateTime(lesson.startTime, i18n.language)}
                          </p>
                          {allowActions && lesson.status === "scheduled" ? (
                            <div className="mt-2">
                              <LessonActions lesson={lesson} />
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                    {day.holidays[0] && !hasLessons ? (
                      <span className="mt-1 block truncate text-[9px] text-amber-300">
                        {day.holidays[0]}
                      </span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
