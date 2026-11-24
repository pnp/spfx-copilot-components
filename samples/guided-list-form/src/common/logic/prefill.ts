import type { AnswerValue, Answers, IWizardField } from '../models';
import { parseIsoDateTime, isValidIsoDate } from './dateTime';
import { coerceHyperlinkPrefill } from './hyperlink';
import { parseNumberInput } from './numbers';
import { coerceYesNo } from './yesNo';

export const MAX_PREFILL_LENGTH = 8192;
/** A multichoice prefill array longer than this is ignored as a whole. */
export const MAX_PREFILL_OPTIONS = 100;
const BLOCKED_KEYS = /^(__proto__|constructor|prototype)$/;

export interface IPrefillResult {
  answers: Answers;
  /** Internal names that got a value from the conversation. */
  applied: string[];
  /** Keys or values that were ignored (unknown column, wrong type, invalid value). */
  dropped: number;
}

function findField(fields: IWizardField[], key: string): IWizardField | undefined {
  const lower = key.trim().toLowerCase();
  return (
    fields.filter((f) => f.internalName === key)[0] ||
    fields.filter((f) => f.internalName.toLowerCase() === lower)[0] ||
    fields.filter((f) => f.title.toLowerCase() === lower)[0]
  );
}

function matchChoice(choices: string[], value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  if (!text) {
    return undefined;
  }
  return choices.filter((c) => c === text)[0] || choices.filter((c) => c.toLowerCase() === text.toLowerCase())[0];
}

/**
 * Multichoice prefill: an array of option names (a single string counts as one option). Each entry must
 * match a defined option (fill-in values are never accepted); unknown entries are dropped. Undefined when
 * nothing matches.
 */
function coerceMultiChoice(field: IWizardField, value: unknown): string[] | undefined {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : undefined;
  if (!list || list.length === 0 || list.length > MAX_PREFILL_OPTIONS) {
    return undefined;
  }
  const picked: string[] = [];
  list.forEach((entry) => {
    const match = matchChoice(field.choices, entry);
    if (match && picked.indexOf(match) < 0) {
      picked.push(match);
    }
  });
  const ordered = field.choices.filter((c) => picked.indexOf(c) >= 0);
  return ordered.length > 0 ? ordered : undefined;
}

/** Coerces one prefill value to what the step control expects, or undefined when it doesn't fit. */
export function coercePrefillValue(field: IWizardField, value: unknown): AnswerValue | undefined {
  if (field.kind === 'multichoice') {
    return coerceMultiChoice(field, value);
  }
  if (field.kind === 'yesno') {
    return coerceYesNo(value);
  }
  if (field.kind === 'number' || field.kind === 'currency') {
    const n = parseNumberInput(value);
    return n === undefined ? undefined : String(n);
  }
  if (field.kind === 'hyperlink') {
    return coerceHyperlinkPrefill(value);
  }
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }
  const text = String(value).trim();
  if (!text) {
    return undefined;
  }
  switch (field.kind) {
    case 'text':
      return text.replace(/[\r\n]+/g, ' ').slice(0, field.maxLength);
    case 'note':
      return text.slice(0, field.maxLength);
    case 'choice':
      return matchChoice(field.choices, text);
    case 'datetime':
      return parseIsoDateTime(text);
    case 'date': {
      const day = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
      return isValidIsoDate(day) ? day : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * Parses Copilot's prefill argument: a JSON object (as a string, or an object if the host already parsed it),
 * keyed by internal or display name. Never trusted: size-capped, plain objects only, prototype keys dropped,
 * every value checked against its column type. Unknown or invalid entries are dropped silently.
 */
export function parsePrefill(raw: unknown, fields: IWizardField[]): IPrefillResult {
  const result: IPrefillResult = { answers: {}, applied: [], dropped: 0 };
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) {
      return result;
    }
    if (text.length > MAX_PREFILL_LENGTH) {
      result.dropped = 1;
      return result;
    }
    try {
      parsed = JSON.parse(text);
    } catch {
      result.dropped = 1;
      return result;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    if (parsed !== undefined && parsed !== null && parsed !== '') {
      result.dropped = 1;
    }
    return result;
  }
  const source = parsed as Record<string, unknown>;
  Object.keys(source).forEach((key) => {
    if (BLOCKED_KEYS.test(key)) {
      result.dropped++;
      return;
    }
    const field = findField(fields, key);
    const value = field ? coercePrefillValue(field, source[key]) : undefined;
    if (!field || value === undefined || result.applied.indexOf(field.internalName) >= 0) {
      result.dropped++;
      return;
    }
    result.answers[field.internalName] = value;
    result.applied.push(field.internalName);
  });
  return result;
}
