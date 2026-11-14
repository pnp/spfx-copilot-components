import {
  addDays,
  daysBetween,
  describeDate,
  describeTimeAgo,
  formatCalendarDate,
  formatDateWithRelative,
  parseIsoDate,
  parseSlashDate,
  resolveLooseDate,
  toIsoDate
} from './dates';

// Tuesday 18 Aug 2026, 09:00 local. Fixed clock (AGENTS.md R35).
const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

describe('dates', () => {
  it('round-trips ISO dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(parseIsoDate('2026-01-05')).toEqual(new Date(2026, 0, 5));
    expect(parseIsoDate('2026-02-30')).toBeUndefined();
    expect(parseIsoDate('yesterday')).toBeUndefined();
  });

  it('parses US slash dates (M/D/YYYY, MM/DD/YYYY)', () => {
    expect(parseSlashDate('1/1/2026')).toEqual(new Date(2026, 0, 1));
    expect(parseSlashDate('01/01/2026')).toEqual(new Date(2026, 0, 1));
    expect(parseSlashDate('8/14/2026')).toEqual(new Date(2026, 7, 14));
    expect(parseSlashDate('2/30/2026')).toBeUndefined(); // no such day
    expect(parseSlashDate('13/1/2026')).toBeUndefined(); // no such month
    expect(parseSlashDate('2026-01-05')).toBeUndefined(); // ISO, not slash
  });

  it('counts whole days regardless of time of day', () => {
    expect(daysBetween(new Date(2026, 7, 15, 23, 59), NOW)).toBe(3);
    expect(daysBetween(NOW, NOW)).toBe(0);
    expect(daysBetween(addDays(NOW, 2), NOW)).toBe(-2);
  });

  describe('resolveLooseDate', () => {
    const cases: [string, string | undefined][] = [
      ['2026-08-14', '2026-08-14'],
      ['1/1/2026', '2026-01-01'],
      ['01/01/2026', '2026-01-01'],
      ['8/14/2026', '2026-08-14'],
      ['2/30/2026', undefined],
      ['today', '2026-08-18'],
      ['Yesterday', '2026-08-17'],
      ['3 days ago', '2026-08-15'],
      ['1 day ago', '2026-08-17'],
      ['last Friday', '2026-08-14'],
      ['friday', '2026-08-14'],
      ['Tuesday', '2026-08-11'], // said on a Tuesday -> previous Tuesday
      ['last day of last month', '2026-07-31'],
      ['end of last month', '2026-07-31'],
      ['sometime in spring', undefined],
      ['', undefined]
    ];
    cases.forEach(([input, expected]) => {
      it(`"${input}" -> ${expected}`, () => {
        expect(resolveLooseDate(input, NOW)).toBe(expected);
      });
    });
    it('returns undefined for undefined', () => {
      expect(resolveLooseDate(undefined, NOW)).toBeUndefined();
    });
  });

  it('describes calendar dates relatively', () => {
    expect(describeDate('2026-08-18', NOW)).toBe('today');
    expect(describeDate('2026-08-17', NOW)).toBe('yesterday');
    expect(describeDate('2026-08-15', NOW)).toBe('3 days ago (Sat)');
    expect(describeDate('2026-08-20', NOW)).toBe('in 2 days');
    expect(describeDate('2026-01-01', NOW)).toBe('2026-01-01');
    expect(describeDate('garbage', NOW)).toBe('garbage');
  });

  it('formats an absolute calendar date without a locale (8.7 G1)', () => {
    expect(formatCalendarDate('2026-09-22')).toBe('22 Sep 2026');
    expect(formatCalendarDate('2026-09-05')).toBe('5 Sep 2026');
    expect(formatCalendarDate('2026-01-31')).toBe('31 Jan 2026');
    expect(formatCalendarDate('2026-12-01')).toBe('1 Dec 2026');
  });

  it('returns unparseable date text unchanged, like describeDate', () => {
    expect(formatCalendarDate('garbage')).toBe('garbage');
    expect(formatCalendarDate('2026-02-30')).toBe('2026-02-30');
    expect(formatDateWithRelative('garbage', NOW)).toBe('garbage');
  });

  it('shows the stored date first and the relative label after it (8.7 G1)', () => {
    expect(formatDateWithRelative('2026-08-18', NOW)).toBe('18 Aug 2026 (today)');
    expect(formatDateWithRelative('2026-08-17', NOW)).toBe('17 Aug 2026 (yesterday)');
    expect(formatDateWithRelative('2026-08-20', NOW)).toBe('20 Aug 2026 (in 2 days)');
    expect(formatDateWithRelative('2026-08-19', NOW)).toBe('19 Aug 2026 (in 1 day)');
  });

  it('drops the weekday the relative label carries, rather than nesting brackets', () => {
    // describeDate says "3 days ago (Sat)"; beside "15 Aug 2026" the weekday is
    // noise and the second bracket pair is unreadable.
    expect(describeDate('2026-08-15', NOW)).toBe('3 days ago (Sat)');
    expect(formatDateWithRelative('2026-08-15', NOW)).toBe('15 Aug 2026 (3 days ago)');
    expect(formatDateWithRelative('2026-08-15', NOW)).not.toContain('(Sat)');
  });

  it('lets the calendar date stand alone past 60 days, where no label helps', () => {
    expect(describeDate('2026-01-01', NOW)).toBe('2026-01-01');
    expect(formatDateWithRelative('2026-01-01', NOW)).toBe('1 Jan 2026');
    expect(formatDateWithRelative('2027-06-30', NOW)).toBe('30 Jun 2027');
  });

  it('always names the calendar date, whatever phrase resolved to it (8.7 G1)', () => {
    // The host showed "today" and never the date being written.
    const resolved: string = resolveLooseDate('last friday', NOW)!;
    expect(resolved).toBe('2026-08-14');
    expect(formatDateWithRelative(resolved, NOW)).toContain('14 Aug 2026');
  });

  it('describes timestamps relatively', () => {
    expect(describeTimeAgo(new Date(NOW.getTime() - 30 * 1000), NOW)).toBe('just now');
    expect(describeTimeAgo(new Date(NOW.getTime() - 12 * 60 * 1000), NOW)).toBe('12 min ago');
    expect(describeTimeAgo(new Date(NOW.getTime() - 2 * 60 * 60 * 1000), NOW)).toBe('2 h ago');
    expect(describeTimeAgo(new Date(2026, 7, 17, 22, 0), NOW)).toBe('yesterday');
    expect(describeTimeAgo(new Date(2026, 7, 13, 8, 0), NOW)).toBe('5 days ago');
  });
});
