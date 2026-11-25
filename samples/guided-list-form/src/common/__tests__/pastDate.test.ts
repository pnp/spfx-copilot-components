import { PAST_DATE_WARNING, pastDateWarning } from '../logic/pastDate';

const now = new Date(2026, 10, 22, 10, 0, 0); // 22 Nov 2026 10:00 local

describe('past-date warning', () => {
  it('warns when a date-only value is before today, but not for today or the future', () => {
    expect(pastDateWarning('date', '2026-11-01', now)).toBe(PAST_DATE_WARNING);
    expect(pastDateWarning('date', '2026-11-22', now)).toBeUndefined();
    expect(pastDateWarning('date', '2026-12-01', now)).toBeUndefined();
  });

  it('warns when a date-and-time value is before now, including a past date with no time yet', () => {
    expect(pastDateWarning('datetime', '2026-11-22T09:00', now)).toBe(PAST_DATE_WARNING);
    expect(pastDateWarning('datetime', '2026-11-22T11:00', now)).toBeUndefined();
    expect(pastDateWarning('datetime', '2026-11-01T', now)).toBe(PAST_DATE_WARNING);
    expect(pastDateWarning('datetime', '2026-11-22T', now)).toBeUndefined();
  });

  it('does not warn for empty values or invalid dates', () => {
    expect(pastDateWarning('date', '', now)).toBeUndefined();
    expect(pastDateWarning('date', 'not-a-date', now)).toBeUndefined();
  });

  it('is a warning string, not a blocking error phrase', () => {
    expect(PAST_DATE_WARNING).toBe('This date is in the past.');
    expect(PAST_DATE_WARNING.toLowerCase()).not.toContain('please');
    expect(PAST_DATE_WARNING.toLowerCase()).not.toContain('must');
  });
});
