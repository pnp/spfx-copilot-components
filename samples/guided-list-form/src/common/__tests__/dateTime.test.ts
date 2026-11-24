import {
  existsInLocalTime,
  formatDateTime,
  isCompleteDateTime,
  isValidTime,
  joinDateTime,
  parseIsoDateTime,
  splitDateTime,
  timeZoneLabel,
  toWallClock,
  utcOffsetLabel,
  wallClockToUtcIso
} from '../logic/dateTime';

// These tests hold in any time zone: expectations are built from local Date constructs.
// Run them with TZ=UTC and TZ=America/New_York as well as the box zone (Europe/Stockholm).

/** Finds a skipped local wall-clock minute (DST spring-forward) in 2026, if the zone has one. */
function findGap(): string | undefined {
  for (let day = 0; day < 366; day++) {
    for (let h = 0; h < 24; h++) {
      const d = new Date(2026, 0, 1 + day, h, 30);
      const wanted = new Date(2026, 0, 1 + day);
      const expected = `${toWallClock(wanted).slice(0, 10)}T${h < 10 ? '0' : ''}${h}:30`;
      if (toWallClock(d) !== expected) {
        return expected;
      }
    }
  }
  return undefined;
}

describe('date and time helpers', () => {
  it('validates 24-hour HH:mm times', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
    expect(isValidTime('12:60')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });

  it('splits and joins the two halves, empty when both are empty', () => {
    expect(splitDateTime('2026-11-16T14:30')).toEqual({ date: '2026-11-16', time: '14:30' });
    expect(splitDateTime('2026-11-16T')).toEqual({ date: '2026-11-16', time: '' });
    expect(splitDateTime('T09:05')).toEqual({ date: '', time: '09:05' });
    expect(splitDateTime('garbage')).toEqual({ date: '', time: '' });
    expect(splitDateTime(undefined)).toEqual({ date: '', time: '' });
    expect(joinDateTime('2026-11-16', '14:30')).toBe('2026-11-16T14:30');
    expect(joinDateTime('2026-11-16', '')).toBe('2026-11-16T');
    expect(joinDateTime('', '')).toBe('');
  });

  it('a complete value needs a real date and a real time', () => {
    expect(isCompleteDateTime('2026-11-16T14:30')).toBe(true);
    expect(isCompleteDateTime('2026-02-30T14:30')).toBe(false);
    expect(isCompleteDateTime('2026-11-16T')).toBe(false);
    expect(isCompleteDateTime('T14:30')).toBe(false);
    expect(isCompleteDateTime('1800-01-01T10:00')).toBe(false);
  });

  it('converts the local wall clock to the matching UTC instant', () => {
    const local = new Date(2026, 10, 16, 14, 30);
    expect(wallClockToUtcIso('2026-11-16T14:30')).toBe(`${local.toISOString().slice(0, 16)}:00Z`);
    const summer = new Date(2026, 6, 1, 0, 5);
    expect(wallClockToUtcIso('2026-07-01T00:05')).toBe(`${summer.toISOString().slice(0, 16)}:00Z`);
    expect(new Date(wallClockToUtcIso('2026-07-01T00:05') as string).getTime()).toBe(summer.getTime());
    expect(wallClockToUtcIso('2026-11-16T')).toBeUndefined();
    expect(wallClockToUtcIso('nope')).toBeUndefined();
  });

  it('round-trips wall clock -> UTC -> wall clock', () => {
    ['2026-01-01T00:00', '2026-06-15T12:45', '2026-12-31T23:59'].forEach((v) => {
      expect(toWallClock(new Date(wallClockToUtcIso(v) as string))).toBe(v);
    });
  });

  it('flags wall-clock times skipped by a daylight-saving change', () => {
    expect(existsInLocalTime('2026-11-16T14:30')).toBe(true);
    expect(existsInLocalTime('2026-11-16T')).toBe(false);
    const gap = findGap();
    if (gap) {
      expect(existsInLocalTime(gap)).toBe(false);
    }
  });

  it('parses ISO prefill: local without a zone, converted with Z or an offset', () => {
    expect(parseIsoDateTime('2026-11-16T14:30')).toBe('2026-11-16T14:30');
    expect(parseIsoDateTime('2026-11-16 14:30:59')).toBe('2026-11-16T14:30');
    expect(parseIsoDateTime('2026-11-16T14:30:00.1234567')).toBe('2026-11-16T14:30');
    expect(parseIsoDateTime('2026-11-16')).toBe('2026-11-16T');
    expect(parseIsoDateTime('2026-11-16T13:30Z')).toBe(toWallClock(new Date(Date.UTC(2026, 10, 16, 13, 30))));
    expect(parseIsoDateTime('2026-11-16T14:30+01:00')).toBe(toWallClock(new Date(Date.UTC(2026, 10, 16, 13, 30))));
    expect(parseIsoDateTime('2026-11-16T08:30-0500')).toBe(toWallClock(new Date(Date.UTC(2026, 10, 16, 13, 30))));
  });

  it.each([
    ['tomorrow'],
    ['2026-13-01T10:00'],
    ['2026-02-30T10:00'],
    ['2026-11-16T25:00'],
    ['2026-11-16T10:00:61'],
    ['2026-11-16T10:00+15:00'],
    ['2026-11-16T10:00+01:99'],
    ['16/11/2026 10:00'],
    [`2026-11-16T10:00${' '.repeat(40)}`],
    ['']
  ])('rejects %p', (raw) => {
    expect(parseIsoDateTime(raw)).toBeUndefined();
  });

  it('labels the time zone and formats for review', () => {
    expect(utcOffsetLabel('2026-11-16T14:30')).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
    expect(utcOffsetLabel()).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
    expect(timeZoneLabel('2026-11-16T14:30')).toContain(utcOffsetLabel('2026-11-16T14:30'));
    const shown = formatDateTime('2026-11-16T14:30', 'en-GB');
    expect(shown).toContain('16 November 2026');
    expect(shown).toContain('14:30');
    expect(formatDateTime('2026-11-16T', 'en-GB')).toBe('2026-11-16T');
  });
});
