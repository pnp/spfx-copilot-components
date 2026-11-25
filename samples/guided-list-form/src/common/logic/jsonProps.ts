import { sanitizePlainText } from './config';
import { asList, asText } from './answers';
import type { AnswerValue, Answers, IWizardField } from '../models';

export const MAX_JSON_CHARS = 8000;
export const MAX_JSON_ENTRIES = 50;
export const MAX_JSON_VALUE = 500;

const BAD_KEYS = /^(?:__proto__|constructor|prototype)$/i;

export interface ISkipRule {
  /** Internal or display name of the field to show when the condition matches. */
  show: string;
  /** Internal or display name of the field to test. */
  when: string;
  equals?: string;
  in?: string[];
  /** True when the "when" field is not equal to this value. */
  notEquals?: string;
  /** True when the "when" field has any answer. */
  answered?: boolean;
}

export interface IParseResult<T> {
  value: T;
  error: string;
  notice: string;
}

function rawString(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return '';
    }
  }
  return '';
}

function tooLarge(raw: string): boolean {
  return raw.length > MAX_JSON_CHARS;
}

function isBadKey(key: string): boolean {
  return !key || BAD_KEYS.test(key);
}

function parseJsonObject(raw: unknown): { obj?: Record<string, unknown>; error: string } {
  const text = rawString(raw).trim();
  if (!text) {
    return { obj: {}, error: '' };
  }
  if (tooLarge(text)) {
    return { error: 'This JSON is too long (max 8,000 characters).' };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Use a JSON object, for example {"Title":"A short summary"}.' };
    }
    return { obj: parsed as Record<string, unknown>, error: '' };
  } catch {
    return { error: 'That isn\u2019t valid JSON.' };
  }
}

/** JSON object of plain strings, keyed by column internal or display name. Prototype keys are dropped. */
export function parseStringMap(raw: unknown, valueMax: number = MAX_JSON_VALUE): IParseResult<Record<string, string>> {
  const { obj, error } = parseJsonObject(raw);
  if (error || !obj) {
    return { value: {}, error, notice: error ? 'The JSON was ignored.' : '' };
  }
  const value: Record<string, string> = {};
  let dropped = false;
  Object.keys(obj).forEach((key) => {
    if (isBadKey(key)) {
      dropped = true;
      return;
    }
    if (Object.keys(value).length >= MAX_JSON_ENTRIES) {
      dropped = true;
      return;
    }
    const cleanKey = sanitizePlainText(key, 255);
    if (!cleanKey) {
      dropped = true;
      return;
    }
    const cleanVal = sanitizePlainText(obj[key], valueMax, true);
    if (!cleanVal && typeof obj[key] === 'string' && obj[key] !== '') {
      dropped = true;
      return;
    }
    if (typeof obj[key] !== 'string') {
      dropped = true;
      if (!cleanVal) {
        return;
      }
    }
    value[cleanKey] = cleanVal;
  });
  return {
    value,
    error: '',
    notice: dropped ? 'Some JSON entries were ignored (reserved keys, empty names, or over the limit).' : ''
  };
}

function cleanName(value: unknown): string {
  return sanitizePlainText(value, 255);
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  value.forEach((item) => {
    const s = sanitizePlainText(item, 255);
    if (s && out.length < 50) {
      out.push(s);
    }
  });
  return out;
}

/** JSON array of skip rules: [{"show":"Urgency","when":"Category","equals":"Incident"}]. */
export function parseSkipRules(raw: unknown): IParseResult<ISkipRule[]> {
  const text = rawString(raw).trim();
  if (!text) {
    return { value: [], error: '', notice: '' };
  }
  if (tooLarge(text)) {
    return { value: [], error: 'This JSON is too long (max 8,000 characters).', notice: 'The skip rules were ignored.' };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return { value: [], error: 'Use a JSON array of rules, for example [{"show":"Urgency","when":"Category","equals":"Incident"}].', notice: 'The skip rules were ignored.' };
    }
    const value: ISkipRule[] = [];
    let dropped = false;
    parsed.slice(0, MAX_JSON_ENTRIES).forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        dropped = true;
        return;
      }
      const rec = item as Record<string, unknown>;
      if (Object.keys(rec).some((k) => isBadKey(k))) {
        dropped = true;
        return;
      }
      const show = cleanName(rec.show);
      const when = cleanName(rec.when);
      const equals = rec.equals !== undefined ? sanitizePlainText(rec.equals, 255) : undefined;
      const notEquals = rec.notEquals !== undefined ? sanitizePlainText(rec.notEquals, 255) : undefined;
      const inValues = rec.in !== undefined ? cleanList(rec.in) : undefined;
      const answered = rec.answered === true;
      if (!show || !when) {
        dropped = true;
        return;
      }
      const rule: ISkipRule = { show, when };
      if (answered) {
        rule.answered = true;
      } else if (notEquals !== undefined && notEquals !== '') {
        rule.notEquals = notEquals;
      } else if (equals !== undefined && equals !== '') {
        rule.equals = equals;
      } else if (inValues && inValues.length > 0) {
        rule.in = inValues;
      } else {
        dropped = true;
        return;
      }
      value.push(rule);
    });
    if (parsed.length > MAX_JSON_ENTRIES) {
      dropped = true;
    }
    return {
      value,
      error: '',
      notice: dropped ? 'Some skip rules were ignored (they were incomplete, reserved, or over the limit).' : ''
    };
  } catch {
    return { value: [], error: 'That isn\u2019t valid JSON.', notice: 'The skip rules were ignored.' };
  }
}

function namesMatch(field: IWizardField, token: string): boolean {
  const t = token.trim().toLowerCase();
  return field.internalName.toLowerCase() === t || field.title.toLowerCase() === t;
}

export function findField(fields: IWizardField[], token: string): IWizardField | undefined {
  const t = (token || '').trim();
  if (!t || isBadKey(t)) {
    return undefined;
  }
  return fields.find((f) => namesMatch(f, t));
}

export function lookupMap(map: Record<string, string> | undefined, field: IWizardField): string {
  if (!map) {
    return '';
  }
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (isBadKey(key)) {
      continue;
    }
    if (namesMatch(field, key)) {
      return map[key] || '';
    }
  }
  return '';
}

function answerTokens(answer: AnswerValue | undefined): string[] {
  if (Array.isArray(answer)) {
    return asList(answer);
  }
  const text = asText(answer).trim();
  return text ? [text] : [];
}

/** True when the answer of `when` satisfies the rule. */
export function ruleMatches(rule: ISkipRule, fields: IWizardField[], answers: Answers): boolean {
  const field = findField(fields, rule.when);
  if (!field) {
    return false;
  }
  const tokens = answerTokens(answers[field.internalName]);
  if (rule.answered) {
    return tokens.length > 0;
  }
  if (rule.notEquals !== undefined) {
    return tokens.every((t) => t !== rule.notEquals);
  }
  if (rule.equals !== undefined) {
    return tokens.some((t) => t === rule.equals);
  }
  if (rule.in && rule.in.length > 0) {
    return tokens.some((t) => rule.in && rule.in.indexOf(t) >= 0);
  }
  return false;
}

/**
 * Fields the person should be asked, in schema order.
 * A field with no show-rule is always visible. A field with one or more rules is visible
 * when every rule for that field matches (all must match).
 */
export function visibleFields(fields: IWizardField[], answers: Answers, rules: ISkipRule[] | undefined): IWizardField[] {
  const list = rules || [];
  return fields.filter((field) => {
    const mine = list.filter((r) => {
      const target = findField(fields, r.show);
      return !!target && target.internalName === field.internalName;
    });
    return mine.length === 0 || mine.every((r) => ruleMatches(r, fields, answers));
  });
}
