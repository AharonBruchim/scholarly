import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dualCalendarDay, gregorianMonthDays } from "@/lib/hebrew-calendar";

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function selectedDateFromValue(value: string): Date {
  const [datePart] = value.split("T");
  const candidate = datePart ? new Date(`${datePart}T12:00:00`) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

export function DualDateTimePicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const { t, i18n } = useTranslation();
  const timeInputRef = useRef<HTMLInputElement>(null);
  const selectedDate = selectedDateFromValue(value);
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const days = useMemo(() => gregorianMonthDays(monthAnchor), [monthAnchor]);
  const firstDayOffset = days[0]?.dayOfWeek ?? 0;
  const selectedIso = value.split("T")[0] ?? "";
  const selectedInfo = selectedIso ? dualCalendarDay(selectedDate) : null;
  const time = value.split("T")[1] ?? "09:00";
  const monthTitle = new Intl.DateTimeFormat(i18n.language.startsWith("en") ? "en-US" : "he-IL", {
    month: "long",
    year: "numeric",
  }).format(monthAnchor);

  return (
    <div id={id} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("calendar.previousMonth")}
          onClick={() =>
            setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <strong className="text-sm">{monthTitle}</strong>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("calendar.nextMonth")}
          onClick={() =>
            setMonthAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.slice(0, firstDayOffset).map((weekday) => (
          <span key={`empty-${weekday}`} />
        ))}
        {days.map((day) => {
          const isSelected = day.isoDate === selectedIso;
          const isPast = new Date(`${day.isoDate}T23:59:59`).getTime() < Date.now();
          return (
            <button
              key={day.isoDate}
              type="button"
              disabled={isPast}
              title={[day.hebrewFull, ...day.holidays].join(" · ")}
              aria-pressed={isSelected}
              onClick={() => onChange(`${day.isoDate}T${time}`)}
              className={`min-h-16 rounded-lg border p-1 text-start transition ${isSelected ? "border-sky-400 bg-sky-500/20" : "border-slate-800 hover:border-slate-500"} ${isPast ? "opacity-30" : ""}`}
            >
              <span className="block text-sm font-semibold">{day.civilDay}</span>
              <span className="block truncate text-[10px] text-slate-400">{day.hebrewShort}</span>
              {day.holidays[0] ? (
                <span className="mt-1 block truncate text-[9px] text-amber-300">
                  {day.holidays[0]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <label htmlFor={`${id}-time`} className="block space-y-2 text-sm">
        <span>{t("calendar.time")}</span>
        <div className="flex gap-2">
          <Input
            ref={timeInputRef}
            id={`${id}-time`}
            type="time"
            dir="ltr"
            value={time}
            onClick={(event) => event.currentTarget.showPicker?.()}
            onChange={(event) =>
              onChange(`${selectedIso || days[0]?.isoDate}T${event.target.value}`)
            }
            required
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => timeInputRef.current?.showPicker?.()}
          >
            {t("calendar.chooseTime")}
          </Button>
        </div>
      </label>
      {selectedInfo ? (
        <p className="rounded-md bg-slate-900 p-2 text-sm text-slate-200">
          {new Intl.DateTimeFormat("he-IL", { dateStyle: "full" }).format(selectedDate)} ·{" "}
          {selectedInfo.hebrewFull}
          {selectedInfo.holidays.length > 0 ? ` · ${selectedInfo.holidays.join(" · ")}` : ""}
        </p>
      ) : null}
    </div>
  );
}
