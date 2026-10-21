import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { dualCalendarDay, gregorianMonthDays } from "@/lib/hebrew-calendar";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

const selectClassName =
  "h-10 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm tabular-nums text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

function selectedDateFromValue(value: string): Date {
  const [datePart] = value.split("T");
  const candidate = datePart ? new Date(`${datePart}T12:00:00`) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

function nearestMinuteOption(minute: string): string {
  const rounded = Math.round(Number(minute) / 5) * 5;
  return String(Math.min(rounded, 55)).padStart(2, "0");
}

function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [hour = "09", minute = "00"] = value.split(":");
  const minuteOption = MINUTES.includes(minute) ? minute : nearestMinuteOption(minute);
  return (
    <div className="flex items-center gap-1" dir="ltr">
      <select
        id={id}
        aria-label={t("calendar.hour")}
        value={hour}
        onChange={(event) => onChange(`${event.target.value}:${minuteOption}`)}
        className={selectClassName}
      >
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select
        aria-label={t("calendar.minute")}
        value={minuteOption}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        className={selectClassName}
      >
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = selectedDateFromValue(value);
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const days = useMemo(() => gregorianMonthDays(monthAnchor), [monthAnchor]);
  const firstDayOffset = days[0]?.dayOfWeek ?? 0;
  const selectedIso = value.split("T")[0] ?? "";
  const selectedInfo = selectedIso ? dualCalendarDay(selectedDate) : null;
  const time = value.split("T")[1] ?? "09:00";
  const locale = i18n.language.startsWith("en") ? "en-US" : "he-IL";
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    monthAnchor,
  );
  const selectedLabel = selectedInfo
    ? `${new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(selectedDate)} · ${selectedInfo.hebrewShort}`
    : t("calendar.pickDate");

  return (
    <div id={id} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={calendarOpen}
          onClick={() => setCalendarOpen((current) => !current)}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white transition-colors hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
              calendarOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <TimeSelect
          id={`${id}-time`}
          value={time}
          onChange={(nextTime) => onChange(`${selectedIso || days[0]?.isoDate}T${nextTime}`)}
        />
      </div>
      {selectedInfo && selectedInfo.holidays.length > 0 ? (
        <p className="text-xs text-amber-300">{selectedInfo.holidays.join(" · ")}</p>
      ) : null}
      {calendarOpen ? (
        <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={t("calendar.previousMonth")}
              onClick={() =>
                setMonthAnchor(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
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
                setMonthAnchor(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
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
                  onClick={() => {
                    onChange(`${day.isoDate}T${time}`);
                    setCalendarOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-md border text-center transition-colors",
                    isSelected
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : "border-transparent hover:border-slate-600",
                    isPast && "opacity-30",
                  )}
                >
                  <span className="text-sm font-semibold">{day.civilDay}</span>
                  <span className="text-[10px] text-slate-400">
                    {day.hebrewShort.split(" ")[0]}
                  </span>
                  {day.holidays[0] ? (
                    <span className="h-1 w-1 rounded-full bg-amber-300" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
