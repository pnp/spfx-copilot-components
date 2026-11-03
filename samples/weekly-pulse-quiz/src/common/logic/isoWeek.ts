import { QUIZ_TIME_ZONE } from '../models';

export interface IIsoWeek {
  year: number;
  week: number;
  /** year * 100 + week, so weeks sort numerically across year boundaries. */
  key: number;
  /** "2026-W43" */
  label: string;
}

export interface ICalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

const DAY_MS = 86400000;

/** Calendar date of an instant in an IANA time zone (handles DST via Intl). */
export function calendarDateIn(now: Date, timeZone: string): ICalendarDate {
  // formatToParts is ES2017; SPFx targets ES5 typings, so describe the shape we use.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }) as unknown as { formatToParts(date: Date): Array<{ type: string; value: string }> };
  const parts = formatter.formatToParts(now);
  const read = (type: string): number => {
    const part = parts.filter((p) => p.type === type)[0];
    return part ? parseInt(part.value, 10) : NaN;
  };
  return { year: read('year'), month: read('month'), day: read('day') };
}

export function formatWeekLabel(year: number, week: number): string {
  return `${year}-W${week < 10 ? '0' : ''}${week}`;
}

export function weekKey(year: number, week: number): number {
  return year * 100 + week;
}

/** ISO 8601 week (weeks start Monday; week 1 contains the year's first Thursday). */
export function isoWeekOfDate(date: ICalendarDate): IIsoWeek {
  const utc = Date.UTC(date.year, date.month - 1, date.day);
  const dayIndex = (new Date(utc).getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(utc - dayIndex * DAY_MS + 3 * DAY_MS);
  const isoYear = thursday.getUTCFullYear();
  const week = 1 + Math.floor((thursday.getTime() - Date.UTC(isoYear, 0, 1)) / DAY_MS / 7);
  return { year: isoYear, week, key: weekKey(isoYear, week), label: formatWeekLabel(isoYear, week) };
}

/**
 * The quiz week for an instant, in QUIZ_TIME_ZONE (not the viewer's browser zone), so every viewer
 * sees the same question and the week flips at Monday 00:00 in that zone.
 */
export function getIsoWeek(now: Date, timeZone: string = QUIZ_TIME_ZONE): IIsoWeek {
  return isoWeekOfDate(calendarDateIn(now, timeZone));
}

/** Number of ISO weeks (52 or 53) in an ISO year. Dec 28 is always in the last week. */
export function isoWeeksInYear(year: number): number {
  return isoWeekOfDate({ year, month: 12, day: 28 }).week;
}

/**
 * Best-effort check that a SharePoint regional time zone description (for example
 * "(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Vienna") matches the quiz time zone.
 * "UTC" matches "Coordinated Universal Time"; other zones match on their city name.
 */
export function siteTimeZoneMatches(description: string, timeZone: string = QUIZ_TIME_ZONE): boolean {
  const d = (description || '').toLowerCase();
  if (/^(etc\/)?(utc|gmt)$/i.test(timeZone)) {
    return d.indexOf('coordinated universal time') >= 0;
  }
  const parts = timeZone.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ').toLowerCase();
  return !!city && d.indexOf(city) >= 0;
}
