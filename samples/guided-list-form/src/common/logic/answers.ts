import type { AnswerValue } from '../models';
import { asHyperlink, isHyperlinkAnswer } from './hyperlink';

/** The picked options of a multichoice answer (a lone string counts as one option). */
export function asList(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return typeof value === 'string' && value.trim() ? [value] : [];
}

/** The string form of a single-value answer ('' for lists). */
export function asText(value: AnswerValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

export function isEmptyAnswer(value: AnswerValue | undefined): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isHyperlinkAnswer(value)) {
    return value.url.trim().length === 0;
  }
  return typeof value !== 'string' || value.trim().length === 0;
}

export function sameAnswer(a: AnswerValue | undefined, b: AnswerValue | undefined): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    const x = asList(a);
    const y = asList(b);
    return Array.isArray(a) && Array.isArray(b) && x.length === y.length && x.every((v, i) => v === y[i]);
  }
  if (isHyperlinkAnswer(a) || isHyperlinkAnswer(b)) {
    const x = asHyperlink(a);
    const y = asHyperlink(b);
    return isHyperlinkAnswer(a) && isHyperlinkAnswer(b) && x.url === y.url && x.description === y.description;
  }
  return a === b;
}

/** Toggles one option and keeps the list in the column's option order (stable, no duplicates). */
export function toggleOption(current: AnswerValue | undefined, option: string, choices: string[]): string[] {
  const picked = asList(current);
  const has = picked.indexOf(option) >= 0;
  const next = has ? picked.filter((v) => v !== option) : picked.concat([option]);
  return choices.filter((c) => next.indexOf(c) >= 0);
}
