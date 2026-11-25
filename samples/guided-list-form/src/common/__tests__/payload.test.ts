import { buildItemPayload, escapeHtml, finishSummary, formatAnswer, toSharePointDate } from '../logic/payload';
import { FIELDS, V11_FIELDS, field } from './helpers';

describe('item payload', () => {
  it('writes only the wizard fields by internal name and leaves empty answers out', () => {
    expect(buildItemPayload(FIELDS, { Title: '  Laptop  ', Category: 'Hardware', Details: '', NeededBy: '2026-11-02', Injected: 'x' })).toEqual({
      Title: 'Laptop',
      Category: 'Hardware',
      NeededBy: '2026-11-02T12:00:00Z'
    });
  });

  it('escapes rich-text notes so no raw HTML is stored', () => {
    const rich = field({ internalName: 'Body', kind: 'note', richText: true, maxLength: 63999 });
    expect(buildItemPayload([rich], { Body: '<img src=x onerror=alert(1)>\nok & done' })).toEqual({ Body: '&lt;img src=x onerror=alert(1)&gt;<br>ok &amp; done' });
    const plain = field({ internalName: 'Body', kind: 'note', maxLength: 63999 });
    expect(buildItemPayload([plain], { Body: '<b>x</b>' })).toEqual({ Body: '<b>x</b>' });
  });

  it('escapes quotes too', () => {
    expect(escapeHtml(`"it's"`)).toBe('&quot;it&#39;s&quot;');
  });

  it('stores date-only answers at noon UTC', () => {
    expect(toSharePointDate('2026-10-29')).toBe('2026-10-29T12:00:00Z');
  });

  it('formats dates for the review step', () => {
    expect(formatAnswer(FIELDS[3], '2026-11-02', 'en-GB')).toBe('2 November 2026');
    expect(formatAnswer(FIELDS[0], '  ')).toBe('');
  });
});

describe('item payload v1.1: multichoice and date + time', () => {
  it('saves multichoice as a plain array of defined options in column order, and date + time as a UTC instant', () => {
    const local = new Date(2026, 10, 16, 14, 30);
    expect(buildItemPayload(V11_FIELDS, { Title: 'Flicker', Devices: ['Monitor', 'Laptop', 'Tablet'], StartedAt: '2026-11-16T14:30', Seen: '', Extras: [] })).toEqual({
      Title: 'Flicker',
      Devices: ['Laptop', 'Monitor'],
      StartedAt: `${local.toISOString().slice(0, 16)}:00Z`
    });
  });

  it('leaves out incomplete date + time values and a multichoice with no valid options', () => {
    expect(buildItemPayload(V11_FIELDS, { Devices: ['Tablet'], StartedAt: '2026-11-16T', Seen: 'T10:00' })).toEqual({});
  });

  it('never writes a list into a single-value column', () => {
    expect(buildItemPayload(FIELDS, { Title: ['a', 'b'] as unknown as string, Category: ['Hardware'] as unknown as string })).toEqual({});
  });

  it('formats the new kinds for review', () => {
    expect(formatAnswer(V11_FIELDS[1], ['Monitor', 'Laptop'])).toBe('Laptop, Monitor');
    expect(formatAnswer(V11_FIELDS[1], [])).toBe('');
    const shown = formatAnswer(V11_FIELDS[2], '2026-11-16T14:30', 'en-GB');
    expect(shown).toContain('16 November 2026');
    expect(shown).toContain('14:30');
    expect(formatAnswer(V11_FIELDS[2], '')).toBe('');
  });
});

describe('finish summary', () => {
  it('joins the first one or two non-empty answers', () => {
    expect(finishSummary(FIELDS, { Title: 'Monitor flickers', Category: 'Hardware', Details: 'Later' }, 'en-GB')).toBe('Monitor flickers \u00b7 Hardware');
    expect(finishSummary(FIELDS, { Title: 'Only this' }, 'en-GB')).toBe('Only this');
    expect(finishSummary(FIELDS, {}, 'en-GB')).toBe('');
  });
});

describe('item payload v1.4: Yes/No and number', () => {
  it('writes Yes/No as a boolean and a number as a number', () => {
    const fields = [
      field({ internalName: 'OnTrack', title: 'On track', kind: 'yesno', required: true, choices: ['Yes', 'No'] }),
      field({ internalName: 'EffortDays', title: 'Days', kind: 'number', maxLength: 32 })
    ];
    expect(buildItemPayload(fields, { OnTrack: 'Yes', EffortDays: '3' })).toEqual({ OnTrack: true, EffortDays: 3 });
    expect(buildItemPayload(fields, { OnTrack: 'No', EffortDays: '12.5' })).toEqual({ OnTrack: false, EffortDays: 12.5 });
    expect(buildItemPayload(fields, { OnTrack: 'Maybe', EffortDays: '1e3' })).toEqual({});
  });

  it('formats Yes/No and numbers for review as typed', () => {
    const yn = field({ internalName: 'OnTrack', kind: 'yesno', choices: ['Yes', 'No'] });
    const num = field({ internalName: 'EffortDays', kind: 'number' });
    expect(formatAnswer(yn, 'Yes')).toBe('Yes');
    expect(formatAnswer(yn, 'No')).toBe('No');
    expect(formatAnswer(num, '3')).toBe('3');
  });
});
