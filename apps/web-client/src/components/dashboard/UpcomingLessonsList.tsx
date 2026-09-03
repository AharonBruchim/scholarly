import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLessonDateTime, getUpcomingLessons } from "@/lib/dashboard";
import type { DirectoryUser, Lesson } from "@/services/api";
import { LessonActions } from "./LessonActions";

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
  const peopleById = new Map(
    people.map((person) => [person._id, `${person.firstName} ${person.lastName}`]),
  );

  return (
    <Card id="upcoming-lessons" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{title ?? t("lessons.listTitle")}</CardTitle>
        <CardDescription>{description ?? t("lessons.listDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-slate-300">{emptyMessage ?? t("lessons.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-700" aria-label={t("lessons.listTitle")}>
            {upcomingLessons.map((lesson) => (
              <li
                key={lesson._id}
                className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-white">{lesson.subject}</p>
                  <p className="text-sm text-slate-300">
                    {personLabel}:{" "}
                    {lesson[personIdKey]
                      ? (peopleById.get(lesson[personIdKey] as string) ??
                        t("lessons.unknownPerson"))
                      : t("lessons.openSlot")}
                  </p>
                  {lesson.status === "available" ? (
                    <p className="text-xs text-emerald-300">{t("lessons.available")}</p>
                  ) : null}
                </div>
                <time className="text-sm text-sky-300" dateTime={lesson.startTime}>
                  {formatLessonDateTime(lesson.startTime, i18n.language)}
                </time>
                {allowActions && lesson.status === "scheduled" ? (
                  <LessonActions lesson={lesson} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
