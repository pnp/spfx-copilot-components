import { findDates, freshnessFacts, monthNames, monthsBetween } from '../freshness';

const NOW = Date.parse('2026-10-03T09:00:00Z');

describe('Dates in page text', () => {
  it('finds written English, German and ISO dates, never ambiguous numeric ones', () => {
    const text = 'Opens 2 October 2026. Ab 15. März 2027 gilt. Since March 4, 2025. Due 2026-11-30. Not 11/03/2026 or 3.4.2026.';
    expect(findDates(text).map(date => date.text)).toEqual(['2 October 2026', '15. März 2027', 'March 4, 2025', '2026-11-30']);
    expect(new Date(findDates('on 31 Oct 2026')[0].day).toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('recognises every month name in both patterns', () => {
    for (const name of monthNames) expect(findDates('1 ' + name + ' 2026').length + findDates(name + ' 1, 2026').length).toBe(2);
  });

  it('ignores impossible dates', () => {
    expect(findDates('31 February 2026 and 2026-13-01')).toEqual([]);
  });
});

describe('Freshness without AI', () => {
  const text = 'Register by 15 September 2026. The policy changed on 1 March 2024. The move starts on 20 October 2026.';

  it('reports a date that lay ahead when the version was saved and has passed since', () => {
    const facts = freshnessFacts(text, '2026-08-01T10:00:00Z', NOW);
    expect(facts.passed.map(date => date.text)).toEqual(['15 September 2026']);
    expect(text.slice(facts.passed[0].start, facts.passed[0].end)).toBe('15 September 2026');
    expect(facts.staleMonths).toBeUndefined();
  });

  it('says how long ago an old version was saved', () => {
    expect(freshnessFacts('No dates.', '2025-08-14T10:00:00Z', NOW)).toEqual({ passed: [], staleMonths: 13 });
    expect(monthsBetween(Date.parse('2025-10-04T00:00:00Z'), NOW)).toBe(11);
  });

  it('reports nothing without a save date', () => {
    expect(freshnessFacts(text, undefined, NOW)).toEqual({ passed: [] });
    expect(freshnessFacts(text, 'not a date', NOW)).toEqual({ passed: [] });
  });
});
