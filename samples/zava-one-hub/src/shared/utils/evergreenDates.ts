const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const EVERGREEN_NOW = new Date();

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function dateAtDayOffset(dayOffset: number, hour = 12, minute = 0, reference = EVERGREEN_NOW): Date {
  const date = startOfUtcDay(reference);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

export function isoAtDayOffset(dayOffset: number, hour = 12, minute = 0, reference = EVERGREEN_NOW): string {
  return dateAtDayOffset(dayOffset, hour, minute, reference).toISOString();
}

export function dateOnlyAtDayOffset(dayOffset: number, reference = EVERGREEN_NOW): string {
  return isoAtDayOffset(dayOffset, 0, 0, reference).slice(0, 10);
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(date);
}

export function formatRecentDateTime(value: string, reference = EVERGREEN_NOW): string {
  const date = new Date(value);
  const dayDifference = Math.round(
    (startOfUtcDay(reference).getTime() - startOfUtcDay(date).getTime()) / DAY_IN_MS
  );
  if (dayDifference === 0) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).format(date);
  }
  if (dayDifference === 1) return 'Yesterday';
  if (dayDifference > 1 && dayDifference < 7) {
    return formatDate(date, { weekday: 'long' });
  }
  return formatDate(date);
}

export function futureMonth(reference = EVERGREEN_NOW): { year: number; monthIndex: number; label: string } {
  const date = startOfUtcDay(reference);
  date.setUTCMonth(date.getUTCMonth() + 1, 1);
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    label: formatDate(date, { month: 'long', year: 'numeric' })
  };
}

export function dateOnlyInMonth(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

export function businessDateRange(startOffset: number, workdays: number, reference = EVERGREEN_NOW): { start: string; end: string } {
  const start = dateAtDayOffset(startOffset, 0, 0, reference);
  while (start.getUTCDay() === 0 || start.getUTCDay() === 6) {
    start.setUTCDate(start.getUTCDate() + 1);
  }

  const end = new Date(start);
  let daysRemaining = workdays - 1;
  while (daysRemaining > 0) {
    end.setUTCDate(end.getUTCDate() + 1);
    if (end.getUTCDay() !== 0 && end.getUTCDay() !== 6) daysRemaining -= 1;
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function calendarDays(year: number, monthIndex: number): readonly { date: string; number: number; outside: boolean }[] {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const mondayBasedOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay.getTime() - mondayBasedOffset * DAY_IN_MS);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const requiredCells = mondayBasedOffset + lastDay.getUTCDate();
  const cellCount = requiredCells > 35 ? 42 : 35;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * DAY_IN_MS);
    return {
      date: date.toISOString().slice(0, 10),
      number: date.getUTCDate(),
      outside: date.getUTCMonth() !== monthIndex
    };
  });
}
