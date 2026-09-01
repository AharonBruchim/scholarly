import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { useCreateLesson, useDirectoryUsers } from "@/hooks/useDirectory";

const emptyLessonForm = {
  studentId: "",
  subject: "",
  startTime: "",
  endTime: "",
  price: "",
  notes: "",
};

export function CreateLessonForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const studentsQuery = useDirectoryUsers("student");
  const createLessonMutation = useCreateLesson();
  const [form, setForm] = useState(emptyLessonForm);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    const startTime = new Date(form.startTime);
    const endTime = new Date(form.endTime);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime.getTime() <= startTime.getTime()
    ) {
      setValidationError(t("lessonForm.invalidTimeRange"));
      return;
    }

    setValidationError(null);

    try {
      await createLessonMutation.mutateAsync({
        studentId: form.studentId,
        teacherId: user.id,
        subject: form.subject.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        price: Number(form.price),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      setForm(emptyLessonForm);
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
            <span>{t("lessonForm.student")}</span>
            <select
              id="lesson-student"
              value={form.studentId}
              onChange={(event) =>
                setForm((current) => ({ ...current, studentId: event.target.value }))
              }
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              disabled={studentsQuery.isPending || (studentsQuery.data?.length ?? 0) === 0}
              required
            >
              <option value="">{t("lessonForm.chooseStudent")}</option>
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
              onChange={(event) =>
                setForm((current) => ({ ...current, subject: event.target.value }))
              }
              required
            />
          </label>

          <label htmlFor="lesson-start-time" className="space-y-2 text-sm text-slate-200">
            <span>{t("lessonForm.startTime")}</span>
            <Input
              id="lesson-start-time"
              type="datetime-local"
              dir="ltr"
              value={form.startTime}
              onChange={(event) =>
                setForm((current) => ({ ...current, startTime: event.target.value }))
              }
              required
            />
          </label>

          <label htmlFor="lesson-end-time" className="space-y-2 text-sm text-slate-200">
            <span>{t("lessonForm.endTime")}</span>
            <Input
              id="lesson-end-time"
              type="datetime-local"
              dir="ltr"
              value={form.endTime}
              onChange={(event) =>
                setForm((current) => ({ ...current, endTime: event.target.value }))
              }
              required
            />
          </label>

          <label htmlFor="lesson-price" className="space-y-2 text-sm text-slate-200">
            <span>{t("lessonForm.price")}</span>
            <Input
              id="lesson-price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              dir="ltr"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              required
            />
          </label>

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
          {studentsQuery.isSuccess && studentsQuery.data.length === 0 ? (
            <p className="text-sm text-amber-300 md:col-span-2">{t("lessonForm.noStudents")}</p>
          ) : null}
          {validationError ? (
            <p className="text-sm text-red-400 md:col-span-2" role="alert">
              {validationError}
            </p>
          ) : null}
          {createLessonMutation.isError ? (
            <p className="text-sm text-red-400 md:col-span-2" role="alert">
              {t("lessonForm.createError")}
            </p>
          ) : null}
          {createLessonMutation.isSuccess ? (
            <p className="text-sm text-emerald-300 md:col-span-2" role="status">
              {t("lessonForm.createSuccess")}
            </p>
          ) : null}

          <div className="flex justify-end md:col-span-2">
            <Button
              type="submit"
              disabled={
                createLessonMutation.isPending ||
                studentsQuery.isPending ||
                (studentsQuery.data?.length ?? 0) === 0
              }
            >
              {createLessonMutation.isPending ? t("lessonForm.creating") : t("lessonForm.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
