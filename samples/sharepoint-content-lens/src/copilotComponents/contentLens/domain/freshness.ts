/** A written date found in page text. `day` is midnight UTC of that date. */
export interface DateMention {
  start: number;
  end: number;
  text: string;
  day: number;
}

/** The names of each month, January first, in English and German. */
const months: string[][] = [
  ['january', 'jan', 'januar', 'jänner'], ['february', 'feb', 'februar'], ['march', 'mar', 'märz', 'maerz', 'mär'], ['april', 'apr'], ['may', 'mai'],
  ['june', 'jun', 'juni'], ['july', 'jul', 'juli'], ['august', 'aug'], ['september', 'sep', 'sept'], ['october', 'oct', 'oktober', 'okt'],
  ['november', 'nov'], ['december', 'dec', 'dezember', 'dez']
];
/** Every month name in the table. The two patterns below are literals; a test runs each of these names through both. */
export const monthNames: string[] = ([] as string[]).concat(...months);
// Only unambiguous forms count: a written month name, or ISO. A numeric date such as 11/03/2026 can be March or
// November, so it is skipped.
const dayMonthYear = /(^|[^0-9A-Za-z])(\d{1,2})(?:st|nd|rd|th|\.)?\s+(january|jan|januar|jänner|february|feb|februar|march|mar|märz|maerz|mär|april|apr|may|mai|june|jun|juni|july|jul|juli|august|aug|september|sep|sept|october|oct|oktober|okt|november|nov|december|dec|dezember|dez)\.?\s+(\d{4})(?![0-9])/gi;
const monthDayYear = /(^|[^0-9A-Za-z])(january|jan|januar|jänner|february|feb|februar|march|mar|märz|maerz|mär|april|apr|may|mai|june|jun|juni|july|jul|juli|august|aug|september|sep|sept|october|oct|oktober|okt|november|nov|december|dec|dezember|dez)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?![0-9])/gi;
const iso = /(^|[^0-9])(\d{4})-(\d{2})-(\d{2})(?![0-9])/g;
const dayMs = 86400000;

function monthIndex(name: string): number {
  const lower = name.toLowerCase();
  return months.findIndex(names => names.indexOf(lower) >= 0);
}

function validDay(year: number, month: number, day: number): number | undefined {
  if (year < 1900 || year > 2200 || month < 0 || month > 11 || day < 1) return undefined;
  const value = Date.UTC(year, month, day);
  return new Date(value).getUTCDate() === day ? value : undefined;
}

/** Dates written with a month name (English or German) or as ISO 2026-10-02, in text order. */
export function findDates(text: string): DateMention[] {
  const found: DateMention[] = [];
  const add = (match: RegExpExecArray, year: number, month: number, day: number): void => {
    const value = validDay(year, month, day);
    if (value === undefined) return;
    const start = match.index + match[1].length;
    const end = match.index + match[0].length;
    // Two patterns can match the same words; keep the first.
    if (found.some(item => item.start < end && start < item.end)) return;
    found.push({ start, end, text: text.slice(start, end), day: value });
  };
  let match: RegExpExecArray | null;
  dayMonthYear.lastIndex = 0;
  while ((match = dayMonthYear.exec(text)) !== null) add(match, Number(match[4]), monthIndex(match[3]), Number(match[2]));
  monthDayYear.lastIndex = 0;
  while ((match = monthDayYear.exec(text)) !== null) add(match, Number(match[4]), monthIndex(match[2]), Number(match[3]));
  iso.lastIndex = 0;
  while ((match = iso.exec(text)) !== null) add(match, Number(match[2]), Number(match[3]) - 1, Number(match[4]));
  return found.sort((a, b) => a.start - b.start);
}

function utcDay(value: number): number {
  return Math.floor(value / dayMs) * dayMs;
}

/** Whole calendar months from one time to a later one. */
export function monthsBetween(from: number, to: number): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  let result = (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12 + toDate.getUTCMonth() - fromDate.getUTCMonth();
  if (toDate.getUTCDate() < fromDate.getUTCDate()) result--;
  return Math.max(0, result);
}

/** A page saved this long ago gets a page-level note. */
export const staleAfterMonths = 12;

export interface FreshnessFacts {
  /** Dates that lay ahead when this version was saved and have passed since. */
  passed: DateMention[];
  /** Months since the version was saved, when that is at least staleAfterMonths. */
  staleMonths?: number;
}

/**
 * Found without AI. A date that was already past when the version was saved is a reference and is left alone; a date
 * that still lay ahead then and has passed now is likely an outdated deadline or announcement.
 */
export function freshnessFacts(text: string, modified: string | undefined, now: number): FreshnessFacts {
  const saved = modified ? Date.parse(modified) : Number.NaN;
  if (!Number.isFinite(saved) || saved > now) return { passed: [] };
  const savedDay = utcDay(saved);
  const today = utcDay(now);
  const passed = findDates(text).filter(mention => mention.day > savedDay && mention.day < today);
  const monthsSinceSaved = monthsBetween(saved, now);
  return { passed, ...(monthsSinceSaved >= staleAfterMonths ? { staleMonths: monthsSinceSaved } : {}) };
}
