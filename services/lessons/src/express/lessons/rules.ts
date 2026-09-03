import { ServiceError } from '@scholarly/utils';
import { DateTime } from 'luxon';
import type { CreateLessonSeriesInput } from './interface';

export const LATE_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isLateCancellation(startTime: Date, cancelledAt: Date): boolean {
    return startTime.getTime() - cancelledAt.getTime() <= LATE_CANCELLATION_WINDOW_MS;
}

export function seriesStartTimes(series: CreateLessonSeriesInput, timezone = 'Asia/Jerusalem'): Date[] {
    const result: Date[] = [];
    const max = series.recurrence.occurrences ?? 104;
    for (let index = 0; index < max; index += 1) {
        const date = DateTime.fromJSDate(series.startTime)
            .setZone(timezone)
            .plus({ weeks: index * series.recurrence.intervalWeeks })
            .toJSDate();
        if (series.recurrence.untilDate && date > series.recurrence.untilDate) break;
        result.push(date);
    }
    if (result.length < 2) throw new ServiceError('Recurring series must contain at least two lessons', 400);
    return result;
}
