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
    studentCount: new Set(nonCancelledLessons.map((lesson) => lesson.studentId)).size,
    upcomingLessonCount: upcomingLessons.length,
    nextLesson: upcomingLessons[0] ?? null,
  };
}

export function getUpcomingLessons(lessons: Lesson[], now: Date = new Date()): Lesson[] {
  return lessons
    .filter(
      (lesson) =>
        lesson.status === "scheduled" && new Date(lesson.startTime).getTime() >= now.getTime(),
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
