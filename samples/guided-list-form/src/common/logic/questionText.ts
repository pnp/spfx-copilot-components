import type { Answers, IWizardField } from '../models';
import { asList, asText } from './answers';
import { formatCurrencyValue } from './currency';
import { formatHyperlinkLabel } from './hyperlink';
import { parseNumberInput } from './numbers';
import { sanitizePlainText } from './config';
import { findField, lookupMap } from './jsonProps';

export const MAX_FIRST_NAME = 40;

/** First word of a display name, plain text only. */
export function firstNameFromDisplayName(displayName: unknown): string {
  const full = sanitizePlainText(displayName, 120);
  if (!full) {
    return '';
  }
  const first = full.split(' ')[0] || '';
  return sanitizePlainText(first, MAX_FIRST_NAME);
}

export interface IQuestionPart {
  text: string;
  /** Recalled answers are shown in italics. The name and ordinary words are not. */
  emphasize?: boolean;
}

function answerAsText(field: IWizardField, answers: Answers): string {
  const raw = answers[field.internalName];
  if (field.kind === 'multichoice') {
    return asList(raw).join(', ');
  }
  if (field.kind === 'hyperlink') {
    return formatHyperlinkLabel(raw);
  }
  if (field.kind === 'currency') {
    const n = parseNumberInput(asText(raw));
    return n === undefined ? '' : formatCurrencyValue(n, field.currencyLocaleId);
  }
  return asText(raw).trim();
}

const TOKEN = /\{\{([^}]+)\}\}/g;

/**
 * Turns a question template into plain-text parts. Tokens {{firstName}} and {{Column}}
 * are replaced; recalled answers are marked for italics. Nothing is interpreted as HTML.
 */
export function questionParts(
  template: string,
  field: IWizardField,
  fields: IWizardField[],
  answers: Answers,
  firstName: string
): IQuestionPart[] {
  const source = (template || '').trim() || field.title;
  const parts: IQuestionPart[] = [];
  const push = (text: string, emphasize?: boolean): void => {
    if (!text) {
      return;
    }
    const last = parts[parts.length - 1];
    if (last && !!last.emphasize === !!emphasize) {
      last.text += text;
      return;
    }
    parts.push(emphasize ? { text, emphasize: true } : { text });
  };
  let last = 0;
  source.replace(TOKEN, (match, token: string, index: number) => {
    push(source.slice(last, index));
    last = index + match.length;
    const name = token.trim();
    if (/^firstName$/i.test(name)) {
      push(firstName);
      return match;
    }
    const referenced = findField(fields, name);
    if (!referenced) {
      push(match);
      return match;
    }
    const value = answerAsText(referenced, answers);
    if (value) {
      push(value, true);
    }
    return match;
  });
  push(source.slice(last));
  return parts.length > 0 ? parts : [{ text: field.title }];
}

export function resolveQuestionTemplate(field: IWizardField, questionTexts?: Record<string, string>): string {
  return lookupMap(questionTexts, field) || field.title;
}

/** Intro greeting, or '' when the name is missing or the greeting is off. */
export function greetingText(enabled: boolean, firstName: string): string {
  return enabled && firstName ? `Hi, ${firstName}` : '';
}

export type TemplateSegment = { type: 'text'; text: string } | { type: 'token'; name: string };

/** Splits a question template into plain text and {{token}} parts, for the question editor. */
export function parseTemplateSegments(template: string): TemplateSegment[] {
  const source = template || '';
  const parts: TemplateSegment[] = [];
  let last = 0;
  source.replace(TOKEN, (match, token: string, index: number) => {
    if (index > last) {
      parts.push({ type: 'text', text: source.slice(last, index) });
    }
    const name = (token || '').trim();
    if (name) {
      parts.push({ type: 'token', name });
    }
    last = index + match.length;
    return match;
  });
  if (last < source.length) {
    parts.push({ type: 'text', text: source.slice(last) });
  }
  return parts;
}

export function serializeTemplateSegments(parts: TemplateSegment[]): string {
  return parts.map((part) => (part.type === 'token' ? `{{${part.name}}}` : part.text)).join('');
}

export function tokenLabel(name: string, fields: IWizardField[]): string {
  if (/^firstName$/i.test(name)) {
    return 'First name';
  }
  const field = findField(fields, name);
  return field ? field.title : name;
}

/** Joins neighbouring text segments after a token is removed. */
export function mergeAdjacentText(parts: TemplateSegment[]): TemplateSegment[] {
  const out: TemplateSegment[] = [];
  parts.forEach((part) => {
    const last = out[out.length - 1];
    if (part.type === 'text' && last && last.type === 'text') {
      last.text += part.text;
    } else {
      out.push(part.type === 'token' ? { type: 'token', name: part.name } : { type: 'text', text: part.text });
    }
  });
  return out;
}

/** If the caret is at the start of the text segment at `index`, drop the token just before it. */
export function removeTokenBeforeIndex(parts: TemplateSegment[], index: number): TemplateSegment[] | undefined {
  for (let j = index - 1; j >= 0; j--) {
    const part = parts[j];
    if (part.type === 'token') {
      return mergeAdjacentText(parts.slice(0, j).concat(parts.slice(j + 1)));
    }
    if (part.type === 'text' && part.text) {
      return undefined;
    }
  }
  return undefined;
}
