import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAvailableLessons, useCancelLesson, useRescheduleLesson } from "@/hooks/useDirectory";
import { formatLessonDateTime } from "@/lib/dashboard";
import type { Lesson } from "@/services/api";

export function LessonActions({ lesson }: { lesson: Lesson }) {
  const { t, i18n } = useTranslation();
  const cancelMutation = useCancelLesson();
  const rescheduleMutation = useRescheduleLesson();
  const [showReschedule, setShowReschedule] = useState(false);
  const [targetLessonId, setTargetLessonId] = useState("");
  const availableQuery = useAvailableLessons(showReschedule ? lesson.teacherId : undefined);

  const isLate = new Date(lesson.startTime).getTime() - Date.now() <= 24 * 60 * 60 * 1000;

  return (
    <div className="mt-3 space-y-2 sm:col-span-2">
      {isLate ? <p className="text-xs text-amber-300">{t("lessons.lateChangeWarning")}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={cancelMutation.isPending}
          onClick={() => {
            if (window.confirm(t("lessons.cancelConfirm"))) {
              cancelMutation.mutate({ lessonId: lesson._id });
            }
          }}
        >
          {t("lessons.cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowReschedule((value) => !value)}
        >
          {t("lessons.reschedule")}
        </Button>
      </div>
      {showReschedule ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!targetLessonId) return;
            rescheduleMutation.mutate(
              { lessonId: lesson._id, targetLessonId },
              { onSuccess: () => setShowReschedule(false) },
            );
          }}
        >
          <label className="space-y-1 text-xs">
            <span>{t("lessons.newTime")}</span>
            <select
              className="flex h-10 min-w-64 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={targetLessonId}
              onChange={(event) => setTargetLessonId(event.target.value)}
              required
            >
              <option value="">{t("lessons.chooseSlot")}</option>
              {(availableQuery.data ?? []).map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {slot.subject} · {formatLessonDateTime(slot.startTime, i18n.language)}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            size="sm"
            disabled={rescheduleMutation.isPending || availableQuery.isPending}
          >
            {t("lessons.confirmReschedule")}
          </Button>
          {availableQuery.isSuccess && availableQuery.data.length === 0 ? (
            <p className="text-xs text-amber-300">{t("lessons.noAlternativeSlots")}</p>
          ) : null}
        </form>
      ) : null}
      {cancelMutation.isError || rescheduleMutation.isError ? (
        <p role="alert" className="text-xs text-red-400">
          {t("lessons.changeFailed")}
        </p>
      ) : null}
    </div>
  );
}
