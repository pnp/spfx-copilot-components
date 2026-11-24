import { isCompleteDateTime, isValidIsoDate, splitDateTime, wallClockToUtcIso } from './dateTime';

export const PAST_DATE_WARNING = 'This date is in the past.';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function todayStamp(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Gentle warning (never a blocking error) when a date-only or date-and-time
 * answer is earlier than now in the person's time zone. Today (date-only) is fine.
 */
export function pastDateWarning(kind: 'date' | 'datetime', value: string, now?: Date): string | undefined {
  const clock = now || new Date();
  if (kind === 'date') {
    if (!isValidIsoDate(value)) {
      return undefined;
    }
    return value < todayStamp(clock) ? PAST_DATE_WARNING : undefined;
  }
  if (!isCompleteDateTime(value)) {
    const parts = splitDateTime(value);
    if (parts.date && isValidIsoDate(parts.date) && !parts.time && parts.date < todayStamp(clock)) {
      return PAST_DATE_WARNING;
    }
    return undefined;
  }
  const iso = wallClockToUtcIso(value);
  if (!iso) {
    return undefined;
  }
  return new Date(iso).getTime() < clock.getTime() ? PAST_DATE_WARNING : undefined;
}
