import type { AnswerValue, IWizardField } from '../models';
import { asText } from './answers';
import { asHyperlink, hyperlinkErrorMessage, hyperlinkUrlProblem, isHyperlinkAnswer } from './hyperlink';
import { lookupMap, parseStringMap, type IParseResult } from './jsonProps';

export type AnswerCheck = 'none' | 'email' | 'url' | 'phone';

const ALLOWED: AnswerCheck[] = ['none', 'email', 'url', 'phone'];

export const ANSWER_CHECK_HINTS: Record<Exclude<AnswerCheck, 'none'>, string> = {
  email: 'Enter an email address, for example name@example.com.',
  url: 'Enter a web address starting with https://.',
  phone: 'Enter a phone number, including the country code if you know it.'
};

export function isAnswerCheck(value: unknown): value is AnswerCheck {
  return typeof value === 'string' && ALLOWED.indexOf(value as AnswerCheck) >= 0;
}

/** Email when the column name contains "email"; Web link for Hyperlink columns; otherwise none. */
export function defaultAnswerCheck(field: IWizardField): AnswerCheck {
  if (field.kind === 'hyperlink') {
    return 'url';
  }
  const name = `${field.internalName} ${field.title}`;
  return /email/i.test(name) ? 'email' : 'none';
}

export function parseAnswerChecks(raw: unknown): IParseResult<Record<string, AnswerCheck>> {
  const parsed = parseStringMap(raw);
  const value: Record<string, AnswerCheck> = {};
  Object.keys(parsed.value).forEach((key) => {
    const token = parsed.value[key].trim().toLowerCase();
    const mapped = token === 'web link' || token === 'weblink' || token === 'link' ? 'url' : token;
    if (isAnswerCheck(mapped)) {
      value[key] = mapped;
    }
  });
  const dropped = Object.keys(parsed.value).length !== Object.keys(value).length;
  return {
    value,
    error: parsed.error,
    notice: parsed.notice || (dropped ? 'Some answer checks were ignored (unknown type).' : '')
  };
}

export function answerCheckFor(field: IWizardField, map?: Record<string, AnswerCheck>): AnswerCheck {
  if (map) {
    const stored = lookupMap(map as unknown as Record<string, string>, field);
    if (isAnswerCheck(stored)) {
      return stored;
    }
  }
  return defaultAnswerCheck(field);
}

function emailError(value: string): string | undefined {
  const t = value.trim();
  if (!t) {
    return undefined;
  }
  if (t.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return 'Please enter a valid email address.';
  }
  return undefined;
}

function phoneError(value: string): string | undefined {
  const t = value.trim();
  if (!t) {
    return undefined;
  }
  if (!/^[+]?[\d\s()./-]{7,25}$/.test(t)) {
    return 'Please enter a phone number.';
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Please enter a phone number.';
  }
  return undefined;
}

function textOf(value: AnswerValue | undefined): string {
  if (isHyperlinkAnswer(value) || (value && typeof value === 'object' && !Array.isArray(value))) {
    return asHyperlink(value).url;
  }
  return asText(value).trim();
}

/** Format-only check (empty optional values are allowed). Returns an error message or undefined. */
export function checkAnswerFormat(check: AnswerCheck | undefined, value: AnswerValue | undefined): string | undefined {
  if (!check || check === 'none') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  const text = textOf(value);
  if (!text) {
    return undefined;
  }
  if (check === 'email') {
    return emailError(text);
  }
  if (check === 'phone') {
    return phoneError(text);
  }
  const problem = hyperlinkUrlProblem(text);
  return problem ? hyperlinkErrorMessage(problem, false) || 'Please enter a valid https:// link.' : undefined;
}

export function builtInCheckHint(check: AnswerCheck | undefined): string {
  return check && check !== 'none' ? ANSWER_CHECK_HINTS[check] : '';
}
