import type { ITeacherPreferences } from "@scholarly/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { DualDateTimePicker } from "@/components/calendar/DualDateTimePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { useCreateLesson, useCreateLessonSeries, useDirectoryUsers } from "@/hooks/useDirectory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getLessonDayKey, nextDayKey } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const DEFAULT_START_HOUR = "09:00";

function defaultStartTime(): string {
  return `${nextDayKey(getLessonDayKey(new Date()))}T${DEFAULT_START_HOUR}`;
}

const fieldClassName =
  "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-slate-800 pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {children}
    </section>
  );
}

const emptyLessonForm = {
  studentId: "",
  subject: "",
  startTime: "",
  notes: "",
  meetingUrl: "",
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
  const profileQuery = useUserProfile(user?.id);
  const createLessonMutation = useCreateLesson();
  const createSeriesMutation = useCreateLessonSeries();
  const [form, setForm] = useState(() => ({ ...emptyLessonForm, startTime: defaultStartTime() }));
  const [validationError, setValidationError] = useState<string | null>(null);
  const preferences: ITeacherPreferences | null = profileQuery.data?.teacherPreferences ?? null;

  useEffect(() => {
    if (!preferences) return;

    setForm((current) => ({
      ...current,
      durationMinutes: current.durationMinutes || String(preferences.defaultLessonDurationMinutes),
      price: current.price || String(preferences.defaultLessonPrice),
    }));
  }, [preferences]);

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
        ...(form.meetingUrl.trim() ? { meetingUrl: form.meetingUrl.trim() } : {}),
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
        startTime: defaultStartTime(),
        durationMinutes: preferences ? String(preferences.defaultLessonDurationMinutes) : "",
        price: preferences ? String(preferences.defaultLessonPrice) : "",
      });
      toast.success(t("lessonForm.createSuccess"));
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
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormSection title={t("lessonForm.sectionWho")}>
            <div className="grid gap-4 md:grid-cols-2">
              <label htmlFor="lesson-student" className="space-y-1.5 text-sm text-slate-200">
                <span>{t("lessonForm.studentOptional")}</span>
                <select
                  id="lesson-student"
                  value={form.studentId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, studentId: event.target.value }))
                  }
                  className={fieldClassName}
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
              <label htmlFor="lesson-subject" className="space-y-1.5 text-sm text-slate-200">
                <span>{t("lessonForm.subject")}</span>
                <Input
                  id="lesson-subject"
                  value={form.subject}
                  onChange={(event) => {
                    const subject = event.target.value;
                    const override = preferences?.subjectSettings.find(
                      (item) =>
                        item.subject.localeCompare(subject, undefined, { sensitivity: "base" }) ===
                        0,
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
            </div>
          </FormSection>

          <FormSection title={t("lessonForm.sectionWhen")}>
            <DualDateTimePicker
              id="lesson-start-time"
              value={form.startTime}
              onChange={(startTime) => setForm((current) => ({ ...current, startTime }))}
            />
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
              {[
                { recurring: false, label: t("lessonForm.single") },
                { recurring: true, label: t("lessonForm.series") },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={form.recurring === option.recurring}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      recurring: option.recurring,
                      meetingUrl: option.recurring ? "" : current.meetingUrl,
                    }))
                  }
                  className={cn(
                    "h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                    form.recurring === option.recurring
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {form.recurring ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label htmlFor="lesson-repeat-weeks" className="space-y-1.5 text-sm">
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
                <label htmlFor="lesson-occurrences" className="space-y-1.5 text-sm">
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
          </FormSection>

          <FormSection title={t("lessonForm.sectionTerms")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="lesson-duration" className="space-y-1.5 text-sm text-slate-200">
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
              <label htmlFor="lesson-price" className="space-y-1.5 text-sm text-slate-200">
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
            </div>
          </FormSection>

          <details className="group border-t border-slate-800 pt-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200 hover:text-white">
              {t("lessonForm.sectionMore")}
            </summary>
            <div className="mt-3 space-y-4">
              <label htmlFor="lesson-notes" className="block space-y-1.5 text-sm text-slate-200">
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
              <label
                htmlFor="lesson-meeting-url"
                className="block space-y-1.5 text-sm text-slate-200"
              >
                <span>{t("lessonForm.meetingUrl")}</span>
                <Input
                  id="lesson-meeting-url"
                  type="url"
                  dir="ltr"
                  value={form.meetingUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, meetingUrl: event.target.value }))
                  }
                  placeholder={
                    form.recurring
                      ? t("lessonForm.seriesMeetingUrl")
                      : "https://meet.google.com/..."
                  }
                  disabled={form.recurring}
                />
              </label>
            </div>
          </details>

          {studentsQuery.isError ? (
            <p className="text-sm text-red-400" role="alert">
              {t("lessonForm.studentsLoadError")}
            </p>
          ) : null}
          {validationError ? (
            <p className="text-sm text-red-400" role="alert">
              {validationError}
            </p>
          ) : null}
          {createLessonMutation.isError || createSeriesMutation.isError ? (
            <p className="text-sm text-red-400" role="alert">
              {t("lessonForm.createError")}
            </p>
          ) : null}

          <div className="flex justify-end border-t border-slate-800 pt-5">
            <Button
              type="submit"
              disabled={
                createLessonMutation.isPending ||
                createSeriesMutation.isPending ||
                studentsQuery.isPending
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
