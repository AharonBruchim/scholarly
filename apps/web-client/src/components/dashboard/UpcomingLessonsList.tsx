import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, List, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatLessonDayHeading,
  formatLessonTime,
  getLessonDayKey,
  getUpcomingLessons,
  nextDayKey,
} from "@/lib/dashboard";
import { gregorianMonthDays } from "@/lib/hebrew-calendar";
import { cn } from "@/lib/utils";
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

const knownCalendarSyncErrors = [
  "GOOGLE_CALENDAR_NOT_CONNECTED",
  "GOOGLE_RECONNECT_REQUIRED",
  "GOOGLE_API_ERROR",
  "MISSING_PARTICIPANT_EMAIL",
] as const;

function calendarSyncErrorKey(errorCode: string): string {
  const known = knownCalendarSyncErrors.find((code) => code === errorCode);
  return known ? `lessons.calendarSyncReasons.${known}` : "lessons.calendarSyncReasons.OTHER";
}

type LessonsView = "list" | "month";

const LESSONS_VIEW_STORAGE_KEY = "scholarly.lessonsView";

function readStoredView(): LessonsView {
  try {
    return window.localStorage.getItem(LESSONS_VIEW_STORAGE_KEY) === "month" ? "month" : "list";
  } catch {
    return "list";
  }
}

function storeView(view: LessonsView) {
  try {
    window.localStorage.setItem(LESSONS_VIEW_STORAGE_KEY, view);
  } catch {}
}

function groupByDay(lessons: Lesson[]): Map<string, Lesson[]> {
  const groups = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const key = getLessonDayKey(lesson.startTime);
    groups.set(key, [...(groups.get(key) ?? []), lesson]);
  }
  return groups;
}

interface ILessonRowProps {
  lesson: Lesson;
  personName: string;
  personLabel: string;
  allowActions: boolean;
}

function LessonRow({ lesson, personName, personLabel, allowActions }: ILessonRowProps) {
  const { t, i18n } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const isAvailable = lesson.status === "available";
  const canManage = allowActions && lesson.status === "scheduled";
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <time
          dateTime={lesson.startTime}
          className="w-14 shrink-0 text-base font-semibold tabular-nums text-white"
        >
          {formatLessonTime(lesson.startTime, i18n.language)}
        </time>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{lesson.subject}</p>
          <p className="text-xs text-slate-400">
            {isAvailable ? (
              t("lessons.openSlot")
            ) : (
              <>
                {personLabel}: <bdi>{personName}</bdi>
              </>
            )}{" "}
            · {lesson.durationMinutes} {t("automation.duration")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAvailable ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
              {t("lessons.openSlotBadge")}
            </span>
          ) : null}
          {lesson.meetingUrl && !isAvailable ? (
            <Button asChild size="sm" variant="secondary">
              <a href={lesson.meetingUrl} target="_blank" rel="noreferrer">
                <Video className="h-4 w-4" aria-hidden="true" />
                {t("lessons.join")}
              </a>
            </Button>
          ) : null}
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-expanded={showActions}
              onClick={() => setShowActions((current) => !current)}
            >
              {t("lessons.manage")}
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showActions && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
          ) : null}
        </div>
      </div>
      {lesson.calendarSyncError && lesson.status === "scheduled" ? (
        <p
          role="status"
          className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
        >
          {t("lessons.calendarSyncFailed", {
            reason: t(calendarSyncErrorKey(lesson.calendarSyncError)),
          })}
        </p>
      ) : null}
      {canManage && showActions ? <LessonActions lesson={lesson} /> : null}
    </li>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: LessonsView;
  onChange: (view: LessonsView) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ id: LessonsView; label: string; icon: typeof List }> = [
    { id: "list", label: t("lessons.viewList"), icon: List },
    { id: "month", label: t("lessons.viewMonth"), icon: CalendarDays },
  ];
  return (
    <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.id === view;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              selected ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
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
  const [view, setView] = useState<LessonsView>(readStoredView);
  const initialMonth = upcomingLessons[0] ? new Date(upcomingLessons[0].startTime) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const peopleById = new Map(
    people.map((person) => [person._id, `${person.firstName} ${person.lastName}`]),
  );
  const locale = i18n.language.startsWith("en") ? "en-US" : "he-IL";
  const calendarDays = useMemo(() => gregorianMonthDays(visibleMonth), [visibleMonth]);
  const firstDayOffset = calendarDays[0]?.dayOfWeek ?? 0;
  const lessonsByDay = useMemo(() => groupByDay(upcomingLessons), [upcomingLessons]);
  const todayKey = getLessonDayKey(new Date());
  const tomorrowKey = nextDayKey(todayKey);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  const personNameOf = (lesson: Lesson) => {
    const personId = lesson[personIdKey];
    return personId
      ? (peopleById.get(personId) ?? t("lessons.unknownPerson"))
      : t("lessons.openSlot");
  };

  const dayHeading = (dayKey: string, sampleStartTime: string) => {
    const heading = formatLessonDayHeading(sampleStartTime, i18n.language);
    if (dayKey === todayKey) return `${t("lessons.today")} · ${heading}`;
    if (dayKey === tomorrowKey) return `${t("lessons.tomorrow")} · ${heading}`;
    return heading;
  };

  const changeView = (nextView: LessonsView) => {
    setView(nextView);
    storeView(nextView);
  };

  const moveMonth = (offset: number) => {
    setSelectedDayKey(null);
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const renderRows = (dayLessons: Lesson[]) => (
    <ul className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
      {dayLessons.map((lesson) => (
        <LessonRow
          key={lesson._id}
          lesson={lesson}
          personName={personNameOf(lesson)}
          personLabel={personLabel}
          allowActions={allowActions}
        />
      ))}
    </ul>
  );

  const selectedDayLessons = selectedDayKey ? (lessonsByDay.get(selectedDayKey) ?? []) : [];

  return (
    <Card id="upcoming-lessons" className="scroll-mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title ?? t("lessons.listTitle")}</CardTitle>
            <CardDescription>{description ?? t("lessons.listDescription")}</CardDescription>
          </div>
          <ViewToggle view={view} onChange={changeView} />
        </div>
      </CardHeader>
      <CardContent>
        {upcomingLessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-300">
            {emptyMessage ?? t("lessons.empty")}
          </p>
        ) : view === "list" ? (
          <div className="space-y-5">
            {[...lessonsByDay.entries()].map(([dayKey, dayLessons]) => (
              <section key={dayKey} className="space-y-2">
                <h3
                  className={cn(
                    "px-1 text-sm font-semibold",
                    dayKey === todayKey ? "text-sky-300" : "text-slate-200",
                  )}
                >
                  {dayHeading(dayKey, dayLessons[0]?.startTime ?? dayKey)}
                </h3>
                {renderRows(dayLessons)}
              </section>
            ))}
          </div>
        ) : (
          <section className="space-y-4" aria-label={t("lessons.calendarTitle")}>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={t("calendar.previousMonth")}
                onClick={() => moveMonth(-1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <p className="text-sm font-semibold text-white">{monthLabel}</p>
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
                const selected = selectedDayKey === day.isoDate;
                const isToday = day.isoDate === todayKey;
                return (
                  <button
                    key={day.isoDate}
                    type="button"
                    title={[day.hebrewFull, ...day.holidays].join(" · ")}
                    aria-pressed={selected}
                    disabled={!hasLessons}
                    onClick={() => setSelectedDayKey(selected ? null : day.isoDate)}
                    className={cn(
                      "flex min-h-14 flex-col items-start rounded-lg border p-1.5 text-start transition-colors sm:min-h-20",
                      selected
                        ? "border-sky-400 bg-sky-500/15"
                        : hasLessons
                          ? "border-slate-700 bg-slate-900 hover:border-sky-500/60"
                          : "border-slate-800/60 bg-transparent",
                      !hasLessons && "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isToday ? "text-sky-300" : hasLessons ? "text-white" : "text-slate-500",
                      )}
                    >
                      {day.civilDay}
                    </span>
                    <span className="hidden truncate text-[10px] text-slate-500 sm:block">
                      {day.hebrewShort}
                    </span>
                    {hasLessons ? (
                      <>
                        <span className="mt-auto flex gap-0.5 sm:hidden" aria-hidden="true">
                          {dayLessons.slice(0, 3).map((lesson) => (
                            <span
                              key={lesson._id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                lesson.status === "available" ? "bg-emerald-400" : "bg-sky-400",
                              )}
                            />
                          ))}
                        </span>
                        <span className="mt-auto hidden w-full space-y-0.5 sm:block">
                          {dayLessons.slice(0, 2).map((lesson) => (
                            <span
                              key={lesson._id}
                              className={cn(
                                "block truncate rounded px-1 text-[11px]",
                                lesson.status === "available"
                                  ? "bg-emerald-500/15 text-emerald-200"
                                  : "bg-sky-500/15 text-sky-200",
                              )}
                            >
                              {formatLessonTime(lesson.startTime, i18n.language)} {lesson.subject}
                            </span>
                          ))}
                          {dayLessons.length > 2 ? (
                            <span className="block text-[10px] text-slate-400">
                              +{dayLessons.length - 2}
                            </span>
                          ) : null}
                        </span>
                        <span className="sr-only">
                          {t("lessons.lessonsOnDay", { count: dayLessons.length })}
                        </span>
                      </>
                    ) : day.holidays[0] ? (
                      <span className="mt-auto hidden w-full truncate text-[9px] text-amber-300/80 sm:block">
                        {day.holidays[0]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {selectedDayKey && selectedDayLessons[0] ? (
              <section className="space-y-2">
                <h3 className="px-1 text-sm font-semibold text-slate-200">
                  {dayHeading(selectedDayKey, selectedDayLessons[0].startTime)}
                </h3>
                {renderRows(selectedDayLessons)}
              </section>
            ) : (
              <p className="text-center text-xs text-slate-400">{t("lessons.selectDay")}</p>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
