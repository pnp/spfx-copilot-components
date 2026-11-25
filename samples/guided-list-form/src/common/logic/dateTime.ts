/**
 * Date-and-time columns. The step stores a wall-clock value "YYYY-MM-DDTHH:mm" in the person's own
 * (browser) time zone; it is converted to a UTC ISO instant only when the item is saved, so SharePoint
 * stores the exact moment the person meant and shows it in each viewer's regional time zone.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written YYYY-MM-DD, years 1900 to 8900 (SharePoint's range). */
export function isValidIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value || '');
  if (!m) {
    return false;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || y > 8900 || mo < 1 || mo > 12 || d < 1) {
    return false;
  }
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WALL_CLOCK = /^(\d{4}-\d{2}-\d{2})?T(\d{2}:\d{2})?$/;
/** ISO 8601 date-time with optional seconds, fraction and zone (Z or ±HH:MM / ±HHMM). */
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,7})?)?(Z|[+-]\d{2}:?\d{2})?$/i;

export interface IDateTimeParts {
  date: string;
  time: string;
}

export function isValidTime(value: string): boolean {
  return TIME.test(value || '');
}

/** Splits "YYYY-MM-DDTHH:mm" (either half may be empty). Anything else gives two empty parts. */
export function splitDateTime(value: string | undefined): IDateTimeParts {
  const m = WALL_CLOCK.exec(value || '');
  return m ? { date: m[1] || '', time: m[2] || '' } : { date: '', time: '' };
}

/** Joins the two halves; '' when both are empty so an untouched optional step stays empty. */
export function joinDateTime(date: string, time: string): string {
  const d = (date || '').trim();
  const t = (time || '').trim();
  return d || t ? `${d}T${t}` : '';
}

export function isCompleteDateTime(value: string | undefined): boolean {
  const { date, time } = splitDateTime(value);
  return isValidIsoDate(date) && isValidTime(time);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parts(value: string): number[] | undefined {
  if (!isCompleteDateTime(value)) {
    return undefined;
  }
  const { date, time } = splitDateTime(value);
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return [y, mo, d, h, mi];
}

/** Local wall clock -> UTC instant "YYYY-MM-DDTHH:mm:00Z". Undefined for incomplete or invalid values. */
export function wallClockToUtcIso(value: string): string | undefined {
  const p = parts(value);
  if (!p) {
    return undefined;
  }
  const instant = new Date(p[0], p[1] - 1, p[2], p[3], p[4], 0, 0);
  if (isNaN(instant.getTime())) {
    return undefined;
  }
  return `${instant.toISOString().slice(0, 16)}:00Z`;
}

/** False for wall-clock times skipped by a daylight-saving change (e.g. 02:30 on the spring-forward night). */
export function existsInLocalTime(value: string): boolean {
  const p = parts(value);
  if (!p) {
    return false;
  }
  return toWallClock(new Date(p[0], p[1] - 1, p[2], p[3], p[4])) === value;
}

/** A Date's local wall clock as "YYYY-MM-DDTHH:mm". */
export function toWallClock(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Parses an ISO date-time from an untrusted source (Copilot prefill). With a zone (Z or offset) the
 * instant is converted to the person's wall clock; without one it is taken as their wall clock as-is.
 * A bare date gives "YYYY-MM-DDT" so the person only has to add the time.
 */
export function parseIsoDateTime(text: string): string | undefined {
  if (typeof text !== 'string' || text.length > 40) {
    return undefined;
  }
  const value = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return isValidIsoDate(value) ? `${value}T` : undefined;
  }
  const m = ISO_DATE_TIME.exec(value);
  if (!m) {
    return undefined;
  }
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  const time = `${m[4]}:${m[5]}`;
  if (!isValidIsoDate(day) || !isValidTime(time) || (m[6] !== undefined && Number(m[6]) > 59)) {
    return undefined;
  }
  if (!m[7]) {
    return `${day}T${time}`;
  }
  let offsetMinutes = 0;
  if (m[7].toUpperCase() !== 'Z') {
    const sign = m[7].charAt(0) === '-' ? -1 : 1;
    const digits = m[7].slice(1).replace(':', '');
    const oh = Number(digits.slice(0, 2));
    const om = Number(digits.slice(2, 4));
    if (oh > 14 || om > 59) {
      return undefined;
    }
    offsetMinutes = sign * (oh * 60 + om);
  }
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) - offsetMinutes * 60000;
  const instant = new Date(utc);
  const local = toWallClock(instant);
  return isCompleteDateTime(local) ? local : undefined;
}

/** "UTC+01:00" for the person's offset at the given wall-clock value (or now). */
export function utcOffsetLabel(value?: string): string {
  const p = value ? parts(value) : undefined;
  const at = p ? new Date(p[0], p[1] - 1, p[2], p[3], p[4]) : new Date();
  const minutes = -at.getTimezoneOffset();
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** "Europe/Stockholm (UTC+01:00)", or just the offset when the browser doesn't name its zone. */
export function timeZoneLabel(value?: string): string {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    zone = '';
  }
  const offset = utcOffsetLabel(value);
  return zone ? `${zone.replace(/_/g, ' ')} (${offset})` : offset;
}

/** Review text, e.g. "November 16, 2026 at 2:30 PM" (locale-dependent), in the person's time zone. */
export function formatDateTime(value: string, locale?: string): string {
  const p = parts(value);
  if (!p) {
    return value;
  }
  const at = new Date(p[0], p[1] - 1, p[2], p[3], p[4]);
  try {
    return at.toLocaleString(locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return value.replace('T', ' ');
  }
}
