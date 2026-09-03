import { gematriya, getHolidaysOnDate, HDate, Locale } from "@hebcal/core";

export interface DualCalendarDay {
  isoDate: string;
  civilDay: number;
  hebrewShort: string;
  hebrewFull: string;
  holidays: string[];
  dayOfWeek: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dualCalendarDay(date: Date): DualCalendarDay {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const hdate = new HDate(noon);
  const holidays = (getHolidaysOnDate(hdate, true) ?? []).map((event) => event.render("he"));
  return {
    isoDate: dateToIso(date),
    civilDay: date.getDate(),
    hebrewShort: `${gematriya(hdate.getDate())} ${Locale.gettext(hdate.getMonthName(), "he-x-NoNikud")}`,
    hebrewFull: hdate.renderGematriya(true),
    holidays,
    dayOfWeek: date.getDay(),
  };
}

export function gregorianMonthDays(anchor: Date): DualCalendarDay[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const dayCount = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: dayCount }, (_, index) =>
    dualCalendarDay(new Date(year, month, index + 1, 12)),
  );
}
