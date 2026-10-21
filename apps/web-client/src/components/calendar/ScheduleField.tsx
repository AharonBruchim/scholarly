import { useId } from "react";
import { useTranslation } from "react-i18next";

import { DualDateTimePicker } from "@/components/calendar/DualDateTimePicker";
import { getLessonDayKey, nextDayKey } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const DEFAULT_SCHEDULE_TIME = "09:00";

export function ScheduleField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const fieldId = useId();
  const scheduled = Boolean(value);
  const options = [
    { scheduled: false, label: t("calendar.sendNow") },
    { scheduled: true, label: t("calendar.sendLater") },
  ];

  const choose = (nextScheduled: boolean) => {
    if (nextScheduled === scheduled) return;
    onChange(
      nextScheduled ? `${nextDayKey(getLessonDayKey(new Date()))}T${DEFAULT_SCHEDULE_TIME}` : "",
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-200">{t("calendar.sendTime")}</legend>
      <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option.scheduled === scheduled}
            onClick={() => choose(option.scheduled)}
            className={cn(
              "h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              option.scheduled === scheduled
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {scheduled ? <DualDateTimePicker id={fieldId} value={value} onChange={onChange} /> : null}
    </fieldset>
  );
}
