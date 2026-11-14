import {
  businessDateRange,
  calendarDays,
  dateAtDayOffset,
  formatRecentDateTime,
  futureMonth
} from './evergreenDates';

describe('evergreen date utilities', () => {
  const reference = new Date('2026-12-30T18:00:00Z');

  test('moves dates safely across month and year boundaries', () => {
    expect(dateAtDayOffset(2, 9, 30, reference).toISOString()).toBe('2027-01-01T09:30:00.000Z');
    expect(futureMonth(reference)).toEqual({ year: 2027, monthIndex: 0, label: 'January 2027' });
  });

  test('formats recent timestamps relative to the supplied reference', () => {
    expect(formatRecentDateTime('2026-12-30T08:12:00Z', reference)).toBe('08:12');
    expect(formatRecentDateTime('2026-12-29T16:00:00Z', reference)).toBe('Yesterday');
    expect(formatRecentDateTime('2026-12-27T10:00:00Z', reference)).toBe('Sunday');
  });

  test('builds complete Monday-first calendar grids', () => {
    const days = calendarDays(2027, 0);
    expect(days).toHaveLength(35);
    expect(days[0]).toEqual({ date: '2026-12-28', number: 28, outside: true });
    expect(days[34]).toEqual({ date: '2027-01-31', number: 31, outside: false });
  });

  test('creates ranges containing the requested number of weekdays', () => {
    expect(businessDateRange(2, 5, reference)).toEqual({ start: '2027-01-01', end: '2027-01-07' });
  });
});
