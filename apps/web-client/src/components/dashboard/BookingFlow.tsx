import { CalendarX2, Check, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { EmptyState } from "@/components/common/EmptyState";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAvailableLessons, useBookLesson } from "@/hooks/useDirectory";
import { formatLessonDayHeading, formatLessonTime, getLessonDayKey } from "@/lib/dashboard";
import { dualCalendarDay } from "@/lib/hebrew-calendar";
import { cn } from "@/lib/utils";
import type { DirectoryUser, Lesson } from "@/services/api";

type BookingStep = 1 | 2 | 3;

const LATE_CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000;

function fullName(person: DirectoryUser): string {
  return `${person.firstName} ${person.lastName}`;
}

function groupSlotsByDay(slots: Lesson[]): Array<[string, Lesson[]]> {
  const groups = new Map<string, Lesson[]>();
  const sorted = [...slots].sort(
    (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
  );
  for (const slot of sorted) {
    const key = getLessonDayKey(slot.startTime);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }
  return [...groups.entries()];
}

function StepIndicator({ step }: { step: BookingStep }) {
  const { t } = useTranslation();
  const steps: Array<{ id: BookingStep; label: string }> = [
    { id: 1, label: t("booking.stepTeacher") },
    { id: 2, label: t("booking.stepSlot") },
    { id: 3, label: t("booking.stepConfirm") },
  ];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {steps.map((item, index) => {
        const done = item.id < step;
        const current = item.id === step;
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-emerald-500 text-slate-950",
                current && "bg-sky-500 text-slate-950",
                !done && !current && "bg-slate-800 text-slate-400",
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : item.id}
            </span>
            <span className={current ? "font-medium text-white" : "text-slate-400"}>
              {item.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-1 h-px w-6 bg-slate-700 sm:w-10" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function TeacherStep({
  teachers,
  isPending,
  onSelect,
}: {
  teachers: DirectoryUser[];
  isPending: boolean;
  onSelect: (teacher: DirectoryUser) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleTeachers = normalizedSearch
    ? teachers.filter((teacher) => fullName(teacher).toLocaleLowerCase().includes(normalizedSearch))
    : teachers;

  if (isPending) return <p className="text-sm text-slate-400">{t("common.loading")}</p>;
  if (teachers.length === 0) return <EmptyState icon={Users} title={t("directory.empty")} />;

  return (
    <div className="space-y-3">
      {teachers.length > 6 ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("directory.searchPlaceholder")}
            className="ps-9"
          />
        </div>
      ) : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {visibleTeachers.map((teacher) => (
          <li key={teacher._id}>
            <button
              type="button"
              onClick={() => onSelect(teacher)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-start transition-colors hover:border-sky-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <InitialsAvatar
                seed={teacher._id}
                firstName={teacher.firstName}
                lastName={teacher.lastName}
                className="h-10 w-10"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-white">
                  <bdi>{fullName(teacher)}</bdi>
                </span>
                <span className="block text-xs text-slate-400">{t("booking.pickTeacherHint")}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotStep({
  teacher,
  selectedSlotId,
  onSelect,
}: {
  teacher: DirectoryUser;
  selectedSlotId: string | null;
  onSelect: (slot: Lesson) => void;
}) {
  const { t, i18n } = useTranslation();
  const availableQuery = useAvailableLessons(teacher._id);
  const days = useMemo(() => groupSlotsByDay(availableQuery.data ?? []), [availableQuery.data]);

  if (availableQuery.isPending)
    return <p className="text-sm text-slate-400">{t("common.loading")}</p>;
  if (availableQuery.isError) {
    return (
      <p role="alert" className="text-sm text-red-400">
        {t("booking.loadFailed")}
      </p>
    );
  }
  if (days.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={t("booking.noSlots")}
        description={t("booking.noSlotsHint")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {days.map(([dayKey, slots]) => {
        const firstSlot = slots[0];
        if (!firstSlot) return null;
        const dualDate = dualCalendarDay(new Date(firstSlot.startTime));
        return (
          <section key={dayKey} className="space-y-2">
            <h4 className="flex flex-wrap items-baseline gap-x-2 px-1 text-sm font-semibold text-slate-200">
              {formatLessonDayHeading(firstSlot.startTime, i18n.language)}
              <span className="text-xs font-normal text-slate-500">{dualDate.hebrewShort}</span>
              {dualDate.holidays[0] ? (
                <span className="text-xs font-normal text-amber-300">{dualDate.holidays[0]}</span>
              ) : null}
            </h4>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const selected = slot._id === selectedSlotId;
                return (
                  <button
                    key={slot._id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelect(slot)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                      selected
                        ? "border-sky-400 bg-sky-500/15"
                        : "border-slate-700 bg-slate-950/40 hover:border-slate-500",
                    )}
                  >
                    <span className="block text-base font-semibold tabular-nums text-white">
                      {formatLessonTime(slot.startTime, i18n.language)}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {slot.subject} ·{" "}
                      {t("booking.terms", { duration: slot.durationMinutes, price: slot.price })}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ConfirmStep({
  teacher,
  slot,
  onBooked,
}: {
  teacher: DirectoryUser;
  slot: Lesson;
  onBooked: () => void;
}) {
  const { t, i18n } = useTranslation();
  const bookMutation = useBookLesson();
  const startsSoon = new Date(slot.startTime).getTime() - Date.now() <= LATE_CHANGE_WINDOW_MS;
  const summary = [
    { label: t("booking.summaryTeacher"), value: fullName(teacher) },
    { label: t("booking.summarySubject"), value: slot.subject },
    {
      label: t("booking.summaryWhen"),
      value: `${formatLessonDayHeading(slot.startTime, i18n.language)} · ${formatLessonTime(slot.startTime, i18n.language)}`,
    },
    {
      label: t("booking.summaryTerms"),
      value: t("booking.terms", { duration: slot.durationMinutes, price: slot.price }),
    },
  ];

  return (
    <div className="space-y-4">
      <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2">
        {summary.map((item) => (
          <div key={item.label} className="bg-slate-950 px-4 py-3">
            <dt className="text-xs text-slate-400">{item.label}</dt>
            <dd className="mt-0.5 font-medium text-white">
              <bdi>{item.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      {startsSoon ? (
        <p className="text-xs text-amber-300">{t("lessons.lateChangeWarning")}</p>
      ) : null}
      {bookMutation.isError ? (
        <p role="alert" className="text-sm text-red-400">
          {t("booking.failed")}
        </p>
      ) : null}
      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={bookMutation.isPending}
        onClick={() =>
          bookMutation.mutate(slot._id, {
            onSuccess: () => {
              toast.success(t("booking.success"));
              onBooked();
            },
          })
        }
      >
        {bookMutation.isPending ? t("booking.booking") : t("booking.confirm")}
      </Button>
    </div>
  );
}

export function BookingFlow({
  teachers,
  teachersPending,
}: {
  teachers: DirectoryUser[];
  teachersPending: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [chosenTeacherId, setChosenTeacherId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Lesson | null>(null);
  const onlyTeacherId = teachers.length === 1 ? (teachers[0]?._id ?? null) : null;
  const selectedTeacherId = chosenTeacherId ?? onlyTeacherId;
  const selectedTeacher = teachers.find((teacher) => teacher._id === selectedTeacherId) ?? null;
  const step: BookingStep = !selectedTeacher ? 1 : !selectedSlot ? 2 : 3;

  const changeTeacher = () => {
    setSelectedSlot(null);
    setChosenTeacherId(null);
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{t("booking.flowTitle")}</CardTitle>
          <CardDescription>{t("booking.flowDescription")}</CardDescription>
        </div>
        <StepIndicator step={step} />
      </CardHeader>
      <CardContent className="space-y-5">
        {selectedTeacher ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-3">
              <InitialsAvatar
                seed={selectedTeacher._id}
                firstName={selectedTeacher.firstName}
                lastName={selectedTeacher.lastName}
                className="h-9 w-9 text-sm"
              />
              <span className="font-medium text-white">
                <bdi>{fullName(selectedTeacher)}</bdi>
              </span>
            </div>
            {teachers.length > 1 ? (
              <Button type="button" size="sm" variant="ghost" onClick={changeTeacher}>
                {t("booking.changeTeacher")}
              </Button>
            ) : null}
          </div>
        ) : (
          <TeacherStep
            teachers={teachers}
            isPending={teachersPending}
            onSelect={(teacher) => setChosenTeacherId(teacher._id)}
          />
        )}

        {selectedTeacher && !selectedSlot ? (
          <SlotStep teacher={selectedTeacher} selectedSlotId={null} onSelect={setSelectedSlot} />
        ) : null}

        {selectedTeacher && selectedSlot ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-200">{t("booking.stepConfirm")}</h4>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedSlot(null)}>
                {t("booking.changeSlot")}
              </Button>
            </div>
            <ConfirmStep
              teacher={selectedTeacher}
              slot={selectedSlot}
              onBooked={() => {
                setSelectedSlot(null);
                navigate("/student/lessons");
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
