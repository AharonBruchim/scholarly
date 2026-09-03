import type { ITeacherPreferences } from "@scholarly/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DualDateTimePicker } from "@/components/calendar/DualDateTimePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { useCreateLesson, useCreateLessonSeries, useDirectoryUsers } from "@/hooks/useDirectory";
import { fetchUserProfile } from "@/services/api";

const emptyLessonForm = {
  studentId: "",
  subject: "",
  startTime: "",
  notes: "",
  recurring: false,
  intervalWeeks: "1",
  occurrences: "8",
  durationMinutes: "",
  price: "",
};

export function CreateLessonForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const studentsQuery = useDirectoryUsers("student");
  const createLessonMutation = useCreateLesson();
  const createSeriesMutation = useCreateLessonSeries();
  const [form, setForm] = useState(emptyLessonForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ITeacherPreferences | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchUserProfile(user.id).then((profile) => {
      if (!active || !profile.teacherPreferences) return;
      setPreferences(profile.teacherPreferences);
      setForm((current) => ({
        ...current,
        durationMinutes:
          current.durationMinutes ||
          String(profile.teacherPreferences?.defaultLessonDurationMinutes ?? ""),
        price: current.price || String(profile.teacherPreferences?.defaultLessonPrice ?? ""),
      }));
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    const startTime = new Date(form.startTime);
    if (Number.isNaN(startTime.getTime()) || startTime.getTime() <= Date.now()) {
      setValidationError(t("lessonForm.invalidTimeRange"));
      return;
    }

    setValidationError(null);

    try {
      const lesson = {
        ...(form.studentId ? { studentId: form.studentId } : {}),
        teacherId: user.id,
        subject: form.subject.trim(),
        startTime: startTime.toISOString(),
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };
      if (form.recurring) {
        await createSeriesMutation.mutateAsync({
          ...lesson,
          recurrence: {
            intervalWeeks: Number(form.intervalWeeks),
            occurrences: Number(form.occurrences),
          },
        });
      } else {
        await createLessonMutation.mutateAsync(lesson);
      }
      setForm({
        ...emptyLessonForm,
        durationMinutes: preferences ? String(preferences.defaultLessonDurationMinutes) : "",
        price: preferences ? String(preferences.defaultLessonPrice) : "",
      });
    } catch {
      // The localized mutation error is rendered below.
    }
  };

  return (
    <Card id="create-lesson" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("lessonForm.title")}</CardTitle>
        <CardDescription>{t("lessonForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label
            htmlFor="lesson-student"
            className="space-y-2 text-sm text-slate-200 md:col-span-2"
          >
            <span>{t("lessonForm.studentOptional")}</span>
            <select
              id="lesson-student"
              value={form.studentId}
              onChange={(event) =>
                setForm((current) => ({ ...current, studentId: event.target.value }))
              }
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              disabled={studentsQuery.isPending || (studentsQuery.data?.length ?? 0) === 0}
            >
              <option value="">{t("lessonForm.openSlot")}</option>
              {(studentsQuery.data ?? []).map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor="lesson-subject"
            className="space-y-2 text-sm text-slate-200 md:col-span-2"
          >
            <span>{t("lessonForm.subject")}</span>
            <Input
              id="lesson-subject"
              value={form.subject}
              onChange={(event) => {
                const subject = event.target.value;
                const override = preferences?.subjectSettings.find(
                  (item) =>
                    item.subject.localeCompare(subject, undefined, { sensitivity: "base" }) === 0,
                );
                setForm((current) => ({
                  ...current,
                  subject,
                  durationMinutes: String(
                    override?.durationMinutes ??
                      preferences?.defaultLessonDurationMinutes ??
                      current.durationMinutes,
                  ),
                  price: String(
                    override?.price ?? preferences?.defaultLessonPrice ?? current.price,
                  ),
                }));
              }}
              required
            />
          </label>

          <div className="space-y-2 text-sm text-slate-200 md:col-span-2">
            <span>{t("lessonForm.startTime")}</span>
            <DualDateTimePicker
              id="lesson-start-time"
              value={form.startTime}
              onChange={(startTime) => setForm((current) => ({ ...current, startTime }))}
            />
          </div>

          <label htmlFor="lesson-duration" className="space-y-2 text-sm text-slate-200">
            <span>{t("lessonForm.durationMinutes")}</span>
            <Input
              id="lesson-duration"
              type="number"
              min="15"
              max="240"
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, durationMinutes: event.target.value }))
              }
              required
            />
          </label>
          <label htmlFor="lesson-price" className="space-y-2 text-sm text-slate-200">
            <span>{t("lessonForm.price")}</span>
            <Input
              id="lesson-price"
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              required
            />
          </label>
          <fieldset className="space-y-3 rounded-md border border-slate-700 p-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(event) =>
                  setForm((current) => ({ ...current, recurring: event.target.checked }))
                }
              />
              {t("lessonForm.recurring")}
            </label>
            {form.recurring ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label htmlFor="lesson-repeat-weeks" className="space-y-1 text-sm">
                  <span>{t("lessonForm.everyWeeks")}</span>
                  <Input
                    id="lesson-repeat-weeks"
                    type="number"
                    min="1"
                    max="12"
                    value={form.intervalWeeks}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, intervalWeeks: event.target.value }))
                    }
                    required
                  />
                </label>
                <label htmlFor="lesson-occurrences" className="space-y-1 text-sm">
                  <span>{t("lessonForm.occurrences")}</span>
                  <Input
                    id="lesson-occurrences"
                    type="number"
                    min="2"
                    max="104"
                    value={form.occurrences}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, occurrences: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
            ) : null}
          </fieldset>

          <label htmlFor="lesson-notes" className="space-y-2 text-sm text-slate-200 md:col-span-2">
            <span>{t("lessonForm.notes")}</span>
            <textarea
              id="lesson-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          {studentsQuery.isError ? (
            <p className="text-sm text-red-400 md:col-span-2" role="alert">
              {t("lessonForm.studentsLoadError")}
            </p>
          ) : null}
          {validationError ? (
            <p className="text-sm text-red-400 md:col-span-2" role="alert">
              {validationError}
            </p>
          ) : null}
          {createLessonMutation.isError || createSeriesMutation.isError ? (
            <p className="text-sm text-red-400 md:col-span-2" role="alert">
              {t("lessonForm.createError")}
            </p>
          ) : null}
          {createLessonMutation.isSuccess || createSeriesMutation.isSuccess ? (
            <p className="text-sm text-emerald-300 md:col-span-2" role="status">
              {t("lessonForm.createSuccess")}
            </p>
          ) : null}

          <div className="flex justify-end md:col-span-2">
            <Button
              type="submit"
              disabled={
                createLessonMutation.isPending ||
                createSeriesMutation.isPending ||
                studentsQuery.isPending ||
                !form.durationMinutes ||
                !form.price
              }
            >
              {createLessonMutation.isPending || createSeriesMutation.isPending
                ? t("lessonForm.creating")
                : t("lessonForm.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
