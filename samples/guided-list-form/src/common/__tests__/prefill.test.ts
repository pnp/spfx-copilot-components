import { MAX_PREFILL_LENGTH, MAX_PREFILL_OPTIONS, coercePrefillValue, parsePrefill } from '../logic/prefill';
import { toWallClock } from '../logic/dateTime';
import { FIELDS, V11_FIELDS, field } from './helpers';

describe('prefill from Copilot', () => {
  it('parses a JSON string keyed by internal or display name', () => {
    const r = parsePrefill('{"Title":"New laptop","category":"hardware","Needed by":"2026-11-02T00:00:00Z"}', FIELDS);
    expect(r.answers).toEqual({ Title: 'New laptop', Category: 'Hardware', NeededBy: '2026-11-02' });
    expect(r.applied).toEqual(['Title', 'Category', 'NeededBy']);
    expect(r.dropped).toBe(0);
  });

  it('accepts an already-parsed object', () => {
    expect(parsePrefill({ Details: 'Line 1\nLine 2' }, FIELDS).answers).toEqual({ Details: 'Line 1\nLine 2' });
  });

  it('drops unknown columns, invalid values, prototype keys and duplicates', () => {
    const r = parsePrefill('{"Nope":"x","Category":"Other","NeededBy":"tomorrow","__proto__":{"polluted":true},"Title":"a","title":"b"}', FIELDS);
    expect(r.answers).toEqual({ Title: 'a' });
    expect(r.dropped).toBe(5);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it.each([['not json'], ['[1,2]'], ['"just a string"'], ['42']])('ignores %s', (raw) => {
    const r = parsePrefill(raw, FIELDS);
    expect(r.answers).toEqual({});
    expect(r.dropped).toBe(1);
  });

  it('ignores empty input and oversize input', () => {
    expect(parsePrefill('', FIELDS)).toEqual({ answers: {}, applied: [], dropped: 0 });
    expect(parsePrefill(undefined, FIELDS)).toEqual({ answers: {}, applied: [], dropped: 0 });
    expect(parsePrefill(`{"Title":"${'x'.repeat(MAX_PREFILL_LENGTH)}"}`, FIELDS).answers).toEqual({});
  });

  it('coerces per type', () => {
    expect(coercePrefillValue(field({ internalName: 'T', maxLength: 4 }), 'ab\ncdef')).toBe('ab c');
    expect(coercePrefillValue(field({ internalName: 'T' }), 42)).toBe('42');
    expect(coercePrefillValue(field({ internalName: 'T' }), { a: 1 })).toBeUndefined();
    expect(coercePrefillValue(field({ internalName: 'T' }), '   ')).toBeUndefined();
  });
});

describe('prefill v1.1: multichoice arrays and ISO date-times', () => {
  it('accepts an array of option names, matched case-insensitively, unknown ones dropped', () => {
    const r = parsePrefill('{"Devices":["monitor","Laptop","Tablet","Laptop"],"StartedAt":"2026-11-16T14:30"}', V11_FIELDS);
    expect(r.answers).toEqual({ Devices: ['Laptop', 'Monitor'], StartedAt: '2026-11-16T14:30' });
    expect(r.applied).toEqual(['Devices', 'StartedAt']);
  });

  it('a single option name counts as one pick; nothing valid drops the value', () => {
    expect(coercePrefillValue(V11_FIELDS[1], 'phone')).toEqual(['Phone']);
    expect(coercePrefillValue(V11_FIELDS[1], ['Tablet'])).toBeUndefined();
    expect(coercePrefillValue(V11_FIELDS[1], [])).toBeUndefined();
    expect(coercePrefillValue(V11_FIELDS[1], [{ a: 1 }, 7, null])).toBeUndefined();
    expect(coercePrefillValue(V11_FIELDS[1], { Laptop: true })).toBeUndefined();
    expect(coercePrefillValue(V11_FIELDS[1], new Array(MAX_PREFILL_OPTIONS + 1).fill('Laptop'))).toBeUndefined();
  });

  it('date + time prefill takes local ISO, Z or offsets, and a bare date leaves the time to the person', () => {
    expect(coercePrefillValue(V11_FIELDS[2], '2026-11-16T14:30:00')).toBe('2026-11-16T14:30');
    expect(coercePrefillValue(V11_FIELDS[2], '2026-11-16')).toBe('2026-11-16T');
    expect(coercePrefillValue(V11_FIELDS[2], '2026-11-16T13:30:00Z')).toBe(toWallClock(new Date(Date.UTC(2026, 10, 16, 13, 30))));
    expect(coercePrefillValue(V11_FIELDS[2], 'next Monday at 2')).toBeUndefined();
    expect(coercePrefillValue(V11_FIELDS[2], ['2026-11-16T14:30'])).toBeUndefined();
  });

  it('a date-only column still takes the date part of a date-time', () => {
    expect(coercePrefillValue(FIELDS[3], '2026-11-16T14:30')).toBe('2026-11-16');
  });

  it('single-value columns still reject arrays', () => {
    expect(coercePrefillValue(FIELDS[0], ['a'])).toBeUndefined();
    expect(coercePrefillValue(FIELDS[1], ['Hardware'])).toBeUndefined();
  });

  it('keeps blocking prototype keys with the new kinds', () => {
    const r = parsePrefill('{"__proto__":["Laptop"],"constructor":"2026-11-16T10:00","Devices":["Phone"]}', V11_FIELDS);
    expect(r.answers).toEqual({ Devices: ['Phone'] });
    expect(({} as Record<string, unknown>).Laptop).toBeUndefined();
  });
});

describe('prefill v1.4: Yes/No and number', () => {
  const yn = field({ internalName: 'OnTrack', title: 'Is this on track?', kind: 'yesno', required: true, choices: ['Yes', 'No'] });
  const num = field({ internalName: 'EffortDays', title: 'Estimated days', kind: 'number', maxLength: 32 });

  it('accepts true/false, Yes/No and numeric strings', () => {
    const r = parsePrefill('{"OnTrack":true,"EffortDays":3}', [yn, num]);
    expect(r.answers).toEqual({ OnTrack: 'Yes', EffortDays: '3' });
    expect(coercePrefillValue(yn, 'no')).toBe('No');
    expect(coercePrefillValue(yn, 0)).toBe('No');
    expect(coercePrefillValue(num, '12.5')).toBe('12.5');
    expect(coercePrefillValue(num, '1e3')).toBeUndefined();
    expect(coercePrefillValue(yn, 'maybe')).toBeUndefined();
  });
});
