import { calendarDateIn, getIsoWeek, isoWeekOfDate, isoWeeksInYear, siteTimeZoneMatches } from '../logic/isoWeek';
import { QUIZ_TIME_ZONE } from '../models';

const at = (iso: string): Date => new Date(iso);
const d = (year: number, month: number, day: number): { year: number; month: number; day: number } => ({ year, month, day });

describe('ISO 8601 week numbers', () => {
  it.each([
    [d(2026, 10, 19), 2026, 43],
    [d(2026, 10, 25), 2026, 43],
    [d(2026, 10, 26), 2026, 44],
    [d(2026, 10, 29), 2026, 44],
    [d(2026, 12, 28), 2026, 53],
    [d(2027, 1, 1), 2026, 53],
    [d(2027, 1, 3), 2026, 53],
    [d(2027, 1, 4), 2027, 1],
    [d(2025, 12, 29), 2026, 1],
    [d(2026, 1, 1), 2026, 1],
    [d(2021, 1, 3), 2020, 53],
    [d(2024, 12, 30), 2025, 1]
  ])('%o is %i-W%i', (date, year, week) => {
    const result = isoWeekOfDate(date);
    expect(result.year).toBe(year);
    expect(result.week).toBe(week);
    expect(result.key).toBe(year * 100 + week);
  });

  it('formats labels with two-digit weeks', () => {
    expect(isoWeekOfDate(d(2027, 1, 4)).label).toBe('2027-W01');
    expect(isoWeekOfDate(d(2026, 10, 19)).label).toBe('2026-W43');
  });

  it('knows which years have 53 weeks', () => {
    expect(isoWeeksInYear(2026)).toBe(53);
    expect(isoWeeksInYear(2025)).toBe(52);
    expect(isoWeeksInYear(2027)).toBe(52);
    expect(isoWeeksInYear(2020)).toBe(53);
  });
});

describe('week rollover follows the quiz time zone (a Central European zone with DST here)', () => {
  const Z = 'Europe/Berlin';

  it('flips at Monday 00:00 local time on a normal weekend (CET, UTC+1)', () => {
    // Monday 2026-11-02 00:00 CET = 2026-11-01T23:00Z
    expect(getIsoWeek(at('2026-11-01T22:59:59Z'), Z).label).toBe('2026-W44');
    expect(getIsoWeek(at('2026-11-01T23:00:00Z'), Z).label).toBe('2026-W45');
  });

  it('handles the October DST weekend (last Sunday of October, clocks go back)', () => {
    // 2026-10-25 03:00 CEST -> 02:00 CET. Monday 2026-10-26 00:00 CET = 2026-10-25T23:00Z
    expect(getIsoWeek(at('2026-10-25T00:30:00Z'), Z).label).toBe('2026-W43'); // 02:30 CEST, before the change
    expect(getIsoWeek(at('2026-10-25T01:30:00Z'), Z).label).toBe('2026-W43'); // 02:30 CET, the repeated hour
    expect(getIsoWeek(at('2026-10-25T22:59:59Z'), Z).label).toBe('2026-W43'); // Sunday 23:59:59 CET
    expect(getIsoWeek(at('2026-10-25T23:00:00Z'), Z).label).toBe('2026-W44'); // Monday 00:00 CET
  });

  it('handles the March DST weekend (last Sunday of March, clocks go forward)', () => {
    // 2026-03-29 02:00 CET -> 03:00 CEST. Monday 2026-03-30 00:00 CEST = 2026-03-29T22:00Z
    expect(getIsoWeek(at('2026-03-29T01:30:00Z'), Z).label).toBe('2026-W13'); // 03:30 CEST Sunday
    expect(getIsoWeek(at('2026-03-29T21:59:59Z'), Z).label).toBe('2026-W13'); // Sunday 23:59:59 CEST
    expect(getIsoWeek(at('2026-03-29T22:00:00Z'), Z).label).toBe('2026-W14'); // Monday 00:00 CEST
  });

  it('handles the October 2027 DST weekend too', () => {
    // Last Sunday of October 2027 is 2027-10-31. Monday 2027-11-01 00:00 CET = 2027-10-31T23:00Z
    expect(getIsoWeek(at('2027-10-31T22:59:00Z'), Z).week).toBe(43);
    expect(getIsoWeek(at('2027-10-31T23:00:00Z'), Z).week).toBe(44);
  });

  it('rolls into the next ISO year at local midnight, not UTC midnight', () => {
    // Monday 2027-01-04 00:00 CET = 2027-01-03T23:00Z
    expect(getIsoWeek(at('2027-01-03T22:59:59Z'), Z).label).toBe('2026-W53');
    expect(getIsoWeek(at('2027-01-03T23:00:00Z'), Z).label).toBe('2027-W01');
    // New Year's Eve 23:30 UTC is already 1 January in Berlin, still ISO 2026-W53
    expect(getIsoWeek(at('2026-12-31T23:30:00Z'), Z).label).toBe('2026-W53');
  });

  it('gives a viewer in Seattle the quiz-zone week, even when their own date is still Sunday', () => {
    const instant = at('2026-10-26T05:00:00Z'); // Seattle Sun 22:00 PDT, Berlin Mon 06:00 CET
    expect(calendarDateIn(instant, 'America/Los_Angeles')).toEqual(d(2026, 10, 25));
    expect(isoWeekOfDate(calendarDateIn(instant, 'America/Los_Angeles')).week).toBe(43);
    expect(getIsoWeek(instant, Z).label).toBe('2026-W44');
  });

  it('gives a viewer in Singapore the quiz-zone week, even when their own date is already Monday', () => {
    const instant = at('2026-10-25T20:00:00Z'); // Singapore Mon 04:00, Berlin Sun 21:00
    expect(calendarDateIn(instant, 'Asia/Singapore')).toEqual(d(2026, 10, 26));
    expect(getIsoWeek(instant, Z).label).toBe('2026-W43');
  });

  it('does not depend on the process time zone', () => {
    const instant = at('2026-10-25T23:30:00Z');
    expect(calendarDateIn(instant, Z)).toEqual(d(2026, 10, 26));
    expect(calendarDateIn(instant, 'UTC')).toEqual(d(2026, 10, 25));
  });
});

describe('default quiz time zone', () => {
  it('is UTC unless changed in models.ts', () => {
    expect(QUIZ_TIME_ZONE).toBe('UTC');
    const instant = at('2026-10-25T23:30:00Z');
    expect(getIsoWeek(instant)).toEqual(getIsoWeek(instant, 'UTC'));
    expect(getIsoWeek(at('2026-10-25T23:59:59Z')).label).toBe('2026-W43');
    expect(getIsoWeek(at('2026-10-26T00:00:00Z')).label).toBe('2026-W44');
  });

  it('matches SharePoint regional time zone descriptions (best effort)', () => {
    expect(siteTimeZoneMatches('(UTC) Coordinated Universal Time', 'UTC')).toBe(true);
    expect(siteTimeZoneMatches('(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Vienna', 'UTC')).toBe(false);
    expect(siteTimeZoneMatches('(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Vienna', 'Europe/Berlin')).toBe(true);
    expect(siteTimeZoneMatches('(UTC-05:00) Eastern Time (US and Canada)', 'Europe/Berlin')).toBe(false);
    expect(siteTimeZoneMatches('(UTC+10:00) Canberra, Melbourne, Sydney', 'Australia/Sydney')).toBe(true);
  });
});
