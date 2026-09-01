import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLessonDateTime, getUpcomingLessons } from "@/lib/dashboard";
import type { DirectoryUser, Lesson } from "@/services/api";

interface UpcomingLessonsListProps {
  lessons: Lesson[];
  people: DirectoryUser[];
  personIdKey: "studentId" | "teacherId";
  personLabel: string;
}

export function UpcomingLessonsList({
  lessons,
  people,
  personIdKey,
  personLabel,
}: UpcomingLessonsListProps) {
  const { t, i18n } = useTranslation();
  const upcomingLessons = getUpcomingLessons(lessons);
  const peopleById = new Map(
    people.map((person) => [person._id, `${person.firstName} ${person.lastName}`]),
  );

  return (
    <Card id="upcoming-lessons" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("lessons.listTitle")}</CardTitle>
        <CardDescription>{t("lessons.listDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-slate-300">{t("lessons.empty")}</p>
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
                    {peopleById.get(lesson[personIdKey]) ?? t("lessons.unknownPerson")}
                  </p>
                </div>
                <time className="text-sm text-sky-300" dateTime={lesson.startTime}>
                  {formatLessonDateTime(lesson.startTime, i18n.language)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
