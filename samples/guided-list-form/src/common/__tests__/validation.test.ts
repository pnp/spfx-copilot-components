import { firstInvalidIndex, isValidIsoDate, validateAll, validateValue } from '../logic/validation';
import { FIELDS, V11_FIELDS, field } from './helpers';

describe('validation', () => {
  it('requires required answers, ignoring whitespace', () => {
    expect(validateValue(FIELDS[0], '')).toBe('Please fill this in.');
    expect(validateValue(FIELDS[0], '   ')).toBe('Please fill this in.');
    expect(validateValue(FIELDS[0], 'Laptop')).toBeUndefined();
    expect(validateValue(FIELDS[2], '')).toBeUndefined();
  });

  it('enforces max length', () => {
    const f = field({ internalName: 'T', maxLength: 5 });
    expect(validateValue(f, '12345')).toBeUndefined();
    expect(validateValue(f, '123456')).toBe('Please use 5 characters or fewer.');
  });

  it('only allows defined choices', () => {
    expect(validateValue(FIELDS[1], 'Hardware')).toBeUndefined();
    expect(validateValue(FIELDS[1], 'hardware')).toBe('Please pick one of the options.');
    expect(validateValue(FIELDS[1], 'Other')).toBe('Please pick one of the options.');
  });

  it.each([
    ['2026-10-29', true],
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['1899-12-31', false],
    ['8901-01-01', false],
    ['29/10/2026', false],
    ['2026-10-29T10:00', false]
  ])('isValidIsoDate(%s) is %s', (value, ok) => {
    expect(isValidIsoDate(value)).toBe(ok);
  });

  it('validates dates in date steps', () => {
    expect(validateValue(FIELDS[3], '2026-02-30')).toBe('Please enter a valid date.');
    expect(validateValue(FIELDS[3], '2026-11-02')).toBeUndefined();
  });

  it('reports all errors and the first invalid step', () => {
    expect(validateAll(FIELDS, {})).toEqual({ Title: 'Please fill this in.', Category: 'Please fill this in.' });
    expect(firstInvalidIndex(FIELDS, { Title: 'x' })).toBe(1);
    expect(firstInvalidIndex(FIELDS, { Title: 'x', Category: 'Software' })).toBe(-1);
  });
});

describe('validation v1.1: multichoice and date + time', () => {
  const multi = V11_FIELDS[1];
  const optionalMulti = V11_FIELDS[4];
  const when = V11_FIELDS[2];
  const optionalWhen = V11_FIELDS[3];

  it('required multichoice needs at least one option', () => {
    expect(validateValue(multi, [])).toBe('Please pick at least one option.');
    expect(validateValue(multi, undefined)).toBe('Please pick at least one option.');
    expect(validateValue(multi, ['Phone'])).toBeUndefined();
    expect(validateValue(multi, ['Laptop', 'Headset'])).toBeUndefined();
    expect(validateValue(optionalMulti, [])).toBeUndefined();
  });

  it('multichoice only accepts the defined options, once each', () => {
    expect(validateValue(multi, ['Laptop', 'Tablet'])).toBe('Please pick from the options.');
    expect(validateValue(multi, ['Laptop', 'Laptop'])).toBe('Please pick from the options.');
    expect(validateValue(multi, 'Laptop')).toBe('Please pick from the options.');
  });

  it('single-value steps reject arrays', () => {
    expect(validateValue(FIELDS[0], ['x'])).toBe('This answer must be a single value.');
    expect(validateValue(FIELDS[1], ['Hardware'])).toBe('This answer must be a single value.');
  });

  it('date + time needs both halves and a real moment', () => {
    expect(validateValue(when, '')).toBe('Please fill this in.');
    expect(validateValue(when, '2026-11-16T')).toBe('Please enter both a date and a time.');
    expect(validateValue(when, 'T14:30')).toBe('Please enter both a date and a time.');
    expect(validateValue(when, '2026-02-30T14:30')).toBe('Please enter both a date and a time.');
    expect(validateValue(when, '2026-11-16T14:30')).toBeUndefined();
    expect(validateValue(optionalWhen, '')).toBeUndefined();
    expect(validateValue(optionalWhen, '2026-11-16T')).toBe('Please enter both a date and a time.');
  });

  it('validateAll covers the new kinds', () => {
    expect(validateAll(V11_FIELDS, { Title: 'x', Devices: [], StartedAt: '2026-11-16T' })).toEqual({
      Devices: 'Please pick at least one option.',
      StartedAt: 'Please enter both a date and a time.'
    });
    expect(validateAll(V11_FIELDS, { Title: 'x', Devices: ['Phone'], StartedAt: '2026-11-16T09:00' })).toEqual({});
  });
});

describe('validation v1.4: Yes/No and number, past dates are not blocked', () => {
  const yn = field({ internalName: 'OnTrack', kind: 'yesno', required: true, choices: ['Yes', 'No'] });
  const num = field({ internalName: 'EffortDays', kind: 'number', required: true, maxLength: 32 });
  const due = field({ internalName: 'DueDate', kind: 'date', required: true, maxLength: 10 });

  it('requires Yes or No, and a valid number', () => {
    expect(validateValue(yn, '')).toBe('Please fill this in.');
    expect(validateValue(yn, 'Yes')).toBeUndefined();
    expect(validateValue(yn, 'No')).toBeUndefined();
    expect(validateValue(yn, 'true')).toBe('Please pick Yes or No.');
    expect(validateValue(num, '')).toBe('Please fill this in.');
    expect(validateValue(num, '3')).toBeUndefined();
    expect(validateValue(num, '1e3')).toBe('Please enter a number.');
  });

  it('does not treat a past date as a validation error', () => {
    expect(validateValue(due, '2020-01-01')).toBeUndefined();
  });
});
