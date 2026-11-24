import { existsInLocalTime } from '../logic/dateTime';
import { liveCheck, liveNumberMessage } from '../logic/liveCheck';
import { field } from './helpers';

describe('live checks', () => {
  it('warns gently when text is over the max length', () => {
    const f = field({ internalName: 'Title', title: 'Title', maxLength: 40, required: true });
    expect(liveCheck(f, 'x'.repeat(40))).toBeUndefined();
    expect(liveCheck(f, 'x'.repeat(42))).toBe('42 of 40 characters, trim a little');
  });

  it('does not nag about a required empty field until the person has interacted', () => {
    const f = field({ internalName: 'Title', title: 'Title', required: true, maxLength: 40 });
    expect(liveCheck(f, '')).toBeUndefined();
    expect(liveCheck(f, '', { interacted: true })).toBe('This one needs an answer.');
  });

  it('checks date format and DST-invalid times', () => {
    const date = field({ internalName: 'Day', title: 'Day', kind: 'date' });
    expect(liveCheck(date, '2026-13-40')).toBe('That doesn\u2019t look like a date.');
    expect(liveCheck(date, '2026-11-16')).toBeUndefined();
    const dt = field({ internalName: 'When', title: 'When', kind: 'datetime', required: true });
    expect(liveCheck(dt, '2026-11-16T', { interacted: true })).toBe('Add both a date and a time.');
    expect(liveCheck(dt, '2026-11-16T14:30')).toBeUndefined();
  });

  it('flags a DST-invalid wall-clock time when one exists in the runtime zone', () => {
    const dt = field({ internalName: 'When', title: 'When', kind: 'datetime' });
    const spring = '2026-03-29T02:30';
    const message = liveCheck(dt, spring);
    if (!existsInLocalTime(spring)) {
      expect(message).toMatch(/clocks change/);
    } else {
      expect(message === undefined || (message && message.indexOf('clocks') >= 0)).toBe(true);
    }
  });

  it('checks number format', () => {
    expect(liveNumberMessage('')).toBeUndefined();
    expect(liveNumberMessage('12.5')).toBeUndefined();
    expect(liveNumberMessage('-3')).toBeUndefined();
    expect(liveNumberMessage('12 apples')).toBe('That doesn\u2019t look like a number.');
  });

  it('checks number format on a number field and leaves past dates to the warning', () => {
    const num = field({ internalName: 'EffortDays', kind: 'number', maxLength: 32 });
    expect(liveCheck(num, '3')).toBeUndefined();
    expect(liveCheck(num, '1e3')).toMatch(/number/);
    const due = field({ internalName: 'DueDate', kind: 'date', maxLength: 10 });
    expect(liveCheck(due, '2020-01-01')).toBeUndefined();
  });
});
