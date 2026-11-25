import type { AnswerValue, IWizardField } from '../models';
import { asList, asText, isEmptyAnswer } from './answers';
import { asHyperlink, isHyperlinkAnswer, liveHyperlinkMessage, HYPERLINK_DESC_MAX } from './hyperlink';
import { existsInLocalTime, isCompleteDateTime, isValidIsoDate, isValidTime, splitDateTime } from './dateTime';
import { isValidNumberInput } from './numbers';

export const LIVE_CHECK_DEBOUNCE_MS = 300;

/** Gentle "that isn't a number" check (for a number-like value, used by tests and future number columns). */
export function liveNumberMessage(raw: unknown): string | undefined {
  const value = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : '';
  if (!value) {
    return undefined;
  }
  return isValidNumberInput(value) ? undefined : 'That doesn\u2019t look like a number.';
}

export interface ILiveCheckOptions {
  /** True once the person has typed something, tried OK, or left the field. Avoids nagging on a fresh empty required step. */
  interacted?: boolean;
}

/**
 * Gentle inline messages shown as the person types. Never used as a blocking error; Next still uses validateValue.
 */
export function liveCheck(field: IWizardField, rawValue: AnswerValue | undefined, options?: ILiveCheckOptions): string | undefined {
  const interacted = !!(options && options.interacted);
  if (field.kind === 'multichoice') {
    const picked = asList(rawValue);
    if (interacted && field.required && picked.length === 0) {
      return 'This one needs an answer.';
    }
    return undefined;
  }
  if (field.kind === 'hyperlink') {
    const link = asHyperlink(rawValue);
    const urlMsg = liveHyperlinkMessage(link.url, field.required, interacted);
    if (urlMsg) {
      return urlMsg;
    }
    if (link.description.length > HYPERLINK_DESC_MAX) {
      return `${link.description.length} of ${HYPERLINK_DESC_MAX} characters, trim a little`;
    }
    return undefined;
  }
  if (Array.isArray(rawValue) || isHyperlinkAnswer(rawValue)) {
    return undefined;
  }
  const value = asText(rawValue);
  if (field.kind === 'text' || field.kind === 'note') {
    if (value.length > field.maxLength) {
      return `${value.length} of ${field.maxLength} characters, trim a little`;
    }
    if (interacted && field.required && isEmptyAnswer(value)) {
      return 'This one needs an answer.';
    }
    return undefined;
  }
  if (field.kind === 'choice') {
    if (interacted && field.required && isEmptyAnswer(value)) {
      return 'This one needs an answer.';
    }
    return undefined;
  }
  if (field.kind === 'date') {
    if (isEmptyAnswer(value)) {
      return interacted && field.required ? 'This one needs an answer.' : undefined;
    }
    return isValidIsoDate(value) ? undefined : 'That doesn\u2019t look like a date.';
  }
  if (field.kind === 'datetime') {
    if (isEmptyAnswer(value) || value === 'T') {
      return interacted && field.required ? 'This one needs an answer.' : undefined;
    }
    const parts = splitDateTime(value);
    if (parts.date && !isValidIsoDate(parts.date)) {
      return 'That doesn\u2019t look like a date.';
    }
    if (parts.time && !isValidTime(parts.time)) {
      return 'That doesn\u2019t look like a time.';
    }
    if (!isCompleteDateTime(value)) {
      return parts.date || parts.time ? 'Add both a date and a time.' : undefined;
    }
    if (!existsInLocalTime(value)) {
      return 'That time doesn\u2019t exist when the clocks change. Try another time.';
    }
    return undefined;
  }
  if (field.kind === 'yesno') {
    if (interacted && field.required && isEmptyAnswer(value)) {
      return 'This one needs an answer.';
    }
    return undefined;
  }
  if (field.kind === 'number' || field.kind === 'currency') {
    if (isEmptyAnswer(value)) {
      return interacted && field.required ? 'This one needs an answer.' : undefined;
    }
    return liveNumberMessage(value);
  }
  return undefined;
}
