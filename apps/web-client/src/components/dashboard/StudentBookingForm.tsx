import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAvailableLessons, useBookLesson } from "@/hooks/useDirectory";
import { formatLessonDateTime } from "@/lib/dashboard";
import { dualCalendarDay } from "@/lib/hebrew-calendar";
import type { DirectoryUser } from "@/services/api";

export function StudentBookingForm({ teacher }: { teacher: DirectoryUser }) {
  const { t, i18n } = useTranslation();
  const availableQuery = useAvailableLessons(teacher._id);
  const bookMutation = useBookLesson();

  return (
    <Card id="book-selected-teacher" className="scroll-mt-6 border-sky-500/30">
      <CardHeader>
        <CardTitle>
          {t("booking.title", { name: `${teacher.firstName} ${teacher.lastName}` })}
        </CardTitle>
        <CardDescription>{t("booking.chooseAvailable")}</CardDescription>
      </CardHeader>
      <CardContent>
        {availableQuery.isPending ? (
          <p className="text-sm text-slate-300">{t("common.loading")}</p>
        ) : null}
        {availableQuery.isError ? (
          <p role="alert" className="text-sm text-red-400">
            {t("booking.loadFailed")}
          </p>
        ) : null}
        {availableQuery.isSuccess && availableQuery.data.length === 0 ? (
          <p className="text-sm text-slate-300">{t("booking.noSlots")}</p>
        ) : null}
        {availableQuery.data && availableQuery.data.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {availableQuery.data.map((lesson) => {
              const date = new Date(lesson.startTime);
              const dualDate = dualCalendarDay(date);
              return (
                <li
                  key={lesson._id}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                >
                  <p className="font-semibold text-white">{lesson.subject}</p>
                  <p className="mt-1 text-sm text-sky-300">
                    {formatLessonDateTime(lesson.startTime, i18n.language)}
                  </p>
                  <p className="text-xs text-slate-400">{dualDate.hebrewFull}</p>
                  {dualDate.holidays.length > 0 ? (
                    <p className="mt-1 text-xs text-amber-300">{dualDate.holidays.join(" · ")}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-300">
                    {t("booking.terms", { duration: lesson.durationMinutes, price: lesson.price })}
                  </p>
                  <Button
                    className="mt-3"
                    type="button"
                    size="sm"
                    disabled={bookMutation.isPending}
                    onClick={() => bookMutation.mutate(lesson._id)}
                  >
                    {t("booking.book")}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {bookMutation.isError ? (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {t("booking.failed")}
          </p>
        ) : null}
        {bookMutation.isSuccess ? (
          <p role="status" className="mt-3 text-sm text-emerald-300">
            {t("booking.success")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
