/**
 * Calendar-date helpers. All functions take `now` explicitly (AGENTS.md R35);
 * none reads the clock.
 */

const DAY_MS: number = 24 * 60 * 60 * 1000;
const WEEKDAYS: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/** Midnight (local) of the given date. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const r: Date = new Date(d.getTime());
  r.setDate(r.getDate() + days);
  return r;
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

/** Parses YYYY-MM-DD into a local Date, or undefined if malformed. */
export function parseIsoDate(s: string): Date | undefined {
  const m: RegExpMatchArray | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) {
    return undefined;
  }
  const y: number = parseInt(m[1], 10);
  const mo: number = parseInt(m[2], 10) - 1;
  const d: number = parseInt(m[3], 10);
  const date: Date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return undefined;
  }
  return date;
}

/**
 * Parses US month/day/year slash dates — `M/D/YYYY` or `MM/DD/YYYY` — into a
 * local Date, or undefined if malformed. Added for hand-typed review-form
 * entry (todo.md Decision 4); Copilot's own extraction still goes through
 * ISO and the relative phrases below, unaffected by this.
 */
export function parseSlashDate(s: string): Date | undefined {
  const m: RegExpMatchArray | null = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) {
    return undefined;
  }
  const mo: number = parseInt(m[1], 10) - 1;
  const d: number = parseInt(m[2], 10);
  const y: number = parseInt(m[3], 10);
  const date: Date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return undefined;
  }
  return date;
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/**
 * Resolves loose date text — from Copilot's prompt extraction, or hand-typed
 * into the review form — into an ISO date. Understands: ISO dates, US
 * slash dates ("1/1/2026", "01/01/2026"), "today", "yesterday", "N days
 * ago", "last <weekday>", "<weekday>" (most recent), "last day of last
 * month", "end of last month". Returns undefined when it cannot — the field
 * is then simply left for the user to fill, never guessed.
 */
export function resolveLooseDate(text: string | undefined, now: Date): string | undefined {
  if (!text) {
    return undefined;
  }
  const t: string = text.trim().toLowerCase();
  if (!t) {
    return undefined;
  }
  const iso: Date | undefined = parseIsoDate(t);
  if (iso) {
    return toIsoDate(iso);
  }
  const slash: Date | undefined = parseSlashDate(t);
  if (slash) {
    return toIsoDate(slash);
  }
  if (t === 'today') {
    return toIsoDate(now);
  }
  if (t === 'yesterday') {
    return toIsoDate(addDays(now, -1));
  }
  const ago: RegExpMatchArray | null = /^(\d{1,3})\s+days?\s+ago$/.exec(t);
  if (ago) {
    return toIsoDate(addDays(now, -parseInt(ago[1], 10)));
  }
  if (t === 'last day of last month' || t === 'end of last month') {
    return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0));
  }
  const wd: RegExpMatchArray | null = /^(?:last\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(t);
  if (wd) {
    const target: number = WEEKDAYS.indexOf(wd[1]);
    let back: number = (now.getDay() - target + 7) % 7;
    if (back === 0) {
      back = 7; // "Friday" said on a Friday means the previous one
    }
    return toIsoDate(addDays(now, -back));
  }
  return undefined;
}

/**
 * "today", "yesterday", "3 days ago", "in 2 days" — or undefined beyond 60
 * days either way, where a relative label stops being useful.
 *
 * Undecorated on purpose: `describeDate` adds the weekday, and
 * `formatDateWithRelative` does not, because a weekday beside "18 Sep 2026"
 * is noise and would nest a second pair of brackets.
 */
function relativeDayLabel(d: Date, now: Date): string | undefined {
  const diff: number = daysBetween(d, now);
  if (diff === 0) {
    return 'today';
  }
  if (diff === 1) {
    return 'yesterday';
  }
  if (diff > 1 && diff <= 60) {
    return diff + ' days ago';
  }
  if (diff < 0 && diff >= -60) {
    return 'in ' + -diff + ' day' + (diff === -1 ? '' : 's');
  }
  return undefined;
}

/**
 * Relative label for a calendar date: "today", "yesterday", "3 days ago (Fri)",
 * "in 2 days", or the ISO date when further than 60 days away.
 */
export function describeDate(isoDate: string, now: Date): string {
  const d: Date | undefined = parseIsoDate(isoDate);
  if (!d) {
    return isoDate;
  }
  const label: string | undefined = relativeDayLabel(d, now);
  if (!label) {
    return isoDate;
  }
  const diff: number = daysBetween(d, now);
  return diff > 1 && diff <= 60 ? label + ' (' + WEEKDAY_SHORT[d.getDay()] + ')' : label;
}

/**
 * Absolute calendar date, e.g. "22 Sep 2026". Month names are a fixed table,
 * not a locale format — the same ISO date must render identically in a test,
 * the gallery harness and the host.
 *
 * Returns the input unchanged when it is not an ISO date, matching
 * `describeDate`.
 */
export function formatCalendarDate(isoDate: string): string {
  const d: Date | undefined = parseIsoDate(isoDate);
  if (!d) {
    return isoDate;
  }
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}

/**
 * The calendar date that will be stored, with its relative label after it —
 * "22 Sep 2026 (today)" (todo.md 8.7 G1).
 *
 * The relative label alone was what the host showed: someone confirming a
 * record saw "today" and never the date being written. The absolute date
 * leads because it is the value; the label follows because it is the
 * reassurance that the phrase resolved to what they meant.
 *
 * Beyond 60 days there is no useful label and the calendar date stands alone.
 */
export function formatDateWithRelative(isoDate: string, now: Date): string {
  const d: Date | undefined = parseIsoDate(isoDate);
  if (!d) {
    return isoDate;
  }
  const absolute: string = formatCalendarDate(isoDate);
  const label: string | undefined = relativeDayLabel(d, now);
  return label ? absolute + ' (' + label + ')' : absolute;
}

/** Relative label for a timestamp: "just now", "12 min ago", "2 h ago", "yesterday", "5 days ago". */
export function describeTimeAgo(at: Date, now: Date): string {
  const ms: number = now.getTime() - at.getTime();
  const min: number = Math.floor(ms / 60000);
  if (min < 1) {
    return 'just now';
  }
  if (min < 60) {
    return min + ' min ago';
  }
  const h: number = Math.floor(min / 60);
  if (h < 24 && daysBetween(at, now) === 0) {
    return h + ' h ago';
  }
  const days: number = daysBetween(at, now);
  if (days <= 1) {
    return 'yesterday';
  }
  return days + ' days ago';
}
