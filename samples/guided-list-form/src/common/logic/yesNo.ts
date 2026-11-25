/** Wizard storage for a Yes/No column is the plain labels "Yes" and "No". */

export const YES_LABEL = 'Yes';
export const NO_LABEL = 'No';

export const YES_NO_CHOICES: string[] = [YES_LABEL, NO_LABEL];

/** Coerces a prefill or imported value to Yes/No, or undefined when it doesn't fit. */
export function coerceYesNo(value: unknown): string | undefined {
  if (typeof value === 'boolean') {
    return value ? YES_LABEL : NO_LABEL;
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return YES_LABEL;
    }
    if (value === 0) {
      return NO_LABEL;
    }
    return undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim().toLowerCase();
  if (text === 'yes' || text === 'true' || text === '1') {
    return YES_LABEL;
  }
  if (text === 'no' || text === 'false' || text === '0') {
    return NO_LABEL;
  }
  return undefined;
}

/** SharePoint REST body value, or undefined when the step has no answer. */
export function yesNoToBoolean(value: string): boolean | undefined {
  if (value === YES_LABEL) {
    return true;
  }
  if (value === NO_LABEL) {
    return false;
  }
  return undefined;
}
