import { coerceYesNo, yesNoToBoolean, YES_NO_CHOICES } from '../logic/yesNo';
import { isValidNumberInput, parseNumberInput } from '../logic/numbers';

describe('Yes/No values', () => {
  it('coerces booleans, 0/1 and common words to Yes or No', () => {
    expect(coerceYesNo(true)).toBe('Yes');
    expect(coerceYesNo(false)).toBe('No');
    expect(coerceYesNo(1)).toBe('Yes');
    expect(coerceYesNo(0)).toBe('No');
    expect(coerceYesNo('yes')).toBe('Yes');
    expect(coerceYesNo('true')).toBe('Yes');
    expect(coerceYesNo('NO')).toBe('No');
    expect(coerceYesNo('false')).toBe('No');
    expect(coerceYesNo('maybe')).toBeUndefined();
    expect(YES_NO_CHOICES).toEqual(['Yes', 'No']);
  });

  it('converts Yes/No back to a boolean for the REST body', () => {
    expect(yesNoToBoolean('Yes')).toBe(true);
    expect(yesNoToBoolean('No')).toBe(false);
    expect(yesNoToBoolean('')).toBeUndefined();
  });
});

describe('number input', () => {
  it('accepts plain decimals and rejects exponents or oversized values', () => {
    expect(isValidNumberInput('3')).toBe(true);
    expect(isValidNumberInput('12.5')).toBe(true);
    expect(isValidNumberInput('-2')).toBe(true);
    expect(isValidNumberInput('1e3')).toBe(false);
    expect(isValidNumberInput('abc')).toBe(false);
    expect(parseNumberInput('12.50')).toBe(12.5);
    expect(parseNumberInput('1e3')).toBeUndefined();
  });
});
