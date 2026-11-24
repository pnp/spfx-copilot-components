import type { AnswerValue, Answers, IWizardField } from '../models';
import { answerCheckFor, checkAnswerFormat, type AnswerCheck } from './answerCheck';
import { asList, isEmptyAnswer } from './answers';
import { existsInLocalTime, isCompleteDateTime, isValidIsoDate } from './dateTime';
import { asHyperlink, hyperlinkErrorMessage, hyperlinkUrlProblem, HYPERLINK_DESC_MAX, isHyperlinkAnswer } from './hyperlink';
import { isValidNumberInput } from './numbers';
import { YES_LABEL, NO_LABEL } from './yesNo';

export { isValidIsoDate };

/** Returns an error message, or undefined when the value is fine. Optional format check (email, web link, phone) runs after the column type check. */
export function validateValue(field: IWizardField, rawValue: AnswerValue | undefined, check?: AnswerCheck): string | undefined {
  const typeErr = validateType(field, rawValue);
  if (typeErr) {
    return typeErr;
  }
  return checkAnswerFormat(check, rawValue);
}

function validateType(field: IWizardField, rawValue: AnswerValue | undefined): string | undefined {
  if (field.kind === 'multichoice') {
    const picked = asList(rawValue);
    if (!Array.isArray(rawValue) && typeof rawValue === 'string' && rawValue.trim()) {
      return 'Please pick from the options.';
    }
    if (picked.length === 0) {
      return field.required ? 'Please pick at least one option.' : undefined;
    }
    const unknown = picked.some((v) => field.choices.indexOf(v) < 0);
    const duplicate = picked.some((v, i) => picked.indexOf(v) !== i);
    return unknown || duplicate ? 'Please pick from the options.' : undefined;
  }
  if (field.kind === 'hyperlink') {
    if (Array.isArray(rawValue)) {
      return 'This answer must be a single value.';
    }
    const link = asHyperlink(isHyperlinkAnswer(rawValue) || typeof rawValue === 'string' ? rawValue : undefined);
    const urlErr = hyperlinkErrorMessage(hyperlinkUrlProblem(link.url), field.required);
    if (urlErr) {
      return urlErr;
    }
    if (link.description.length > HYPERLINK_DESC_MAX) {
      return `Please use ${HYPERLINK_DESC_MAX} characters or fewer.`;
    }
    return undefined;
  }
  if (Array.isArray(rawValue)) {
    return 'This answer must be a single value.';
  }
  const value = typeof rawValue === 'string' ? rawValue : '';
  if (isEmptyAnswer(value)) {
    return field.required ? 'Please fill this in.' : undefined;
  }
  switch (field.kind) {
    case 'text':
    case 'note':
      return value.length > field.maxLength ? `Please use ${field.maxLength} characters or fewer.` : undefined;
    case 'choice':
      return field.choices.indexOf(value) >= 0 ? undefined : 'Please pick one of the options.';
    case 'date':
      return isValidIsoDate(value) ? undefined : 'Please enter a valid date.';
    case 'datetime':
      if (!isCompleteDateTime(value)) {
        return 'Please enter both a date and a time.';
      }
      return existsInLocalTime(value) ? undefined : 'That time doesn\u2019t exist in your time zone (the clocks change). Please pick another time.';
    case 'yesno':
      return value === YES_LABEL || value === NO_LABEL ? undefined : 'Please pick Yes or No.';
    case 'number':
      return isValidNumberInput(value) ? undefined : 'Please enter a number.';
    case 'currency':
      return isValidNumberInput(value) ? undefined : 'Please enter an amount.';
    default:
      return 'This question type isn\u2019t supported.';
  }
}

/** Errors for every step, keyed by internal name. Empty object when everything is valid. */
export function validateAll(fields: IWizardField[], answers: Answers, checks?: Record<string, AnswerCheck>): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((f) => {
    const err = validateValue(f, answers[f.internalName], answerCheckFor(f, checks));
    if (err) {
      errors[f.internalName] = err;
    }
  });
  return errors;
}

/** Index of the first invalid step, or -1. */
export function firstInvalidIndex(fields: IWizardField[], answers: Answers, checks?: Record<string, AnswerCheck>): number {
  for (let i = 0; i < fields.length; i++) {
    if (validateValue(fields[i], answers[fields[i].internalName], answerCheckFor(fields[i], checks))) {
      return i;
    }
  }
  return -1;
}
