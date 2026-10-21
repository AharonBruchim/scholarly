import type { Lesson } from "@/services/api";

export interface LessonDashboardStats {
  subjectCount: number;
  studentCount: number;
  upcomingLessonCount: number;
  nextLesson: Lesson | null;
}

export function getLessonDashboardStats(
  lessons: Lesson[],
  now: Date = new Date(),
): LessonDashboardStats {
  const nonCancelledLessons = lessons.filter((lesson) => lesson.status !== "cancelled");
  const upcomingLessons = getUpcomingLessons(nonCancelledLessons, now);

  return {
    subjectCount: new Set(
      nonCancelledLessons.map((lesson) => lesson.subject.trim()).filter(Boolean),
    ).size,
    studentCount: new Set(
      nonCancelledLessons.flatMap((lesson) => (lesson.studentId ? [lesson.studentId] : [])),
    ).size,
    upcomingLessonCount: upcomingLessons.length,
    nextLesson: upcomingLessons[0] ?? null,
  };
}

export function getUpcomingLessons(lessons: Lesson[], now: Date = new Date()): Lesson[] {
  return lessons
    .filter(
      (lesson) =>
        (lesson.status === "scheduled" || lesson.status === "available") &&
        new Date(lesson.startTime).getTime() >= now.getTime(),
    )
    .sort(
      (firstLesson, secondLesson) =>
        new Date(firstLesson.startTime).getTime() - new Date(secondLesson.startTime).getTime(),
    );
}

export function formatLessonDateTime(value: string, language: string): string {
  const locale = language.startsWith("en") ? "en-US" : "he-IL";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function localeFor(language: string): string {
  return language.startsWith("en") ? "en-US" : "he-IL";
}

export function getLessonMonthKey(value: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    timeZone: viewerTimeZone,
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export function formatLessonMonth(value: string, language: string): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    month: "long",
    year: "numeric",
    timeZone: viewerTimeZone,
  }).format(new Date(value));
}

export function formatLessonDayTime(value: string, language: string): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: viewerTimeZone,
  }).format(new Date(value));
}

export function getLessonDayKey(value: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: viewerTimeZone,
  }).format(new Date(value));
}

export function nextDayKey(dayKey: string): string {
  const [year = 0, month = 1, day = 1] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function formatLessonDayHeading(value: string, language: string): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: viewerTimeZone,
  }).format(new Date(value));
}

export function formatLessonTime(value: string, language: string): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: viewerTimeZone,
  }).format(new Date(value));
}
