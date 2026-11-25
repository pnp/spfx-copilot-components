import type { AnswerValue, Answers, IWizardField } from '../models';
import { asList, asText } from './answers';
import { formatDateTime, wallClockToUtcIso } from './dateTime';
import { formatCurrencyValue } from './currency';
import { formatHyperlinkLabel, toFieldUrlValue } from './hyperlink';
import { parseNumberInput } from './numbers';
import { yesNoToBoolean } from './yesNo';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Date-only columns are written at 12:00 UTC so the stored day doesn't shift in site time zones UTC-12 to UTC+11. */
export function toSharePointDate(isoDay: string): string {
  return `${isoDay}T12:00:00Z`;
}

/**
 * Body for POST /items (odata=nometadata). Only the wizard's own fields (internal names from the list schema)
 * are written; empty answers are left out. Rich-text notes are escaped so no raw HTML is ever stored.
 * - date-only: YYYY-MM-DDT12:00:00Z
 * - date and time: the UTC instant of the person's local wall clock, YYYY-MM-DDTHH:mm:00Z
 * - multichoice: a plain JSON array of the defined options, in column order (the nometadata form of
 *   Collection(Edm.String); verbose would need { results: [...] })
 */
export type FieldUrlValue = { Url: string; Description: string };
export type ItemPayloadValue = string | string[] | number | boolean | FieldUrlValue;

export function buildItemPayload(fields: IWizardField[], answers: Answers): Record<string, ItemPayloadValue> {
  const body: Record<string, ItemPayloadValue> = {};
  fields.forEach((field) => {
    const raw = answers[field.internalName];
    if (field.kind === 'hyperlink') {
      const urlValue = toFieldUrlValue(raw);
      if (urlValue) {
        body[field.internalName] = urlValue;
      }
      return;
    }
    if (field.kind === 'multichoice') {
      const picked = asList(raw);
      const values = field.choices.filter((c) => picked.indexOf(c) >= 0);
      if (values.length > 0) {
        body[field.internalName] = values;
      }
      return;
    }
    const value = asText(raw);
    if (!value.trim()) {
      return;
    }
    switch (field.kind) {
      case 'text':
        body[field.internalName] = value.trim();
        break;
      case 'note':
        body[field.internalName] = field.richText ? escapeHtml(value).replace(/\r?\n/g, '<br>') : value;
        break;
      case 'choice':
        body[field.internalName] = value;
        break;
      case 'date':
        body[field.internalName] = toSharePointDate(value);
        break;
      case 'datetime': {
        const iso = wallClockToUtcIso(value);
        if (iso) {
          body[field.internalName] = iso;
        }
        break;
      }
      case 'yesno': {
        const flag = yesNoToBoolean(value);
        if (flag !== undefined) {
          body[field.internalName] = flag;
        }
        break;
      }
      case 'number':
      case 'currency': {
        const n = parseNumberInput(value);
        if (n !== undefined) {
          body[field.internalName] = n;
        }
        break;
      }
    }
  });
  return body;
}

/** How an answer is shown on the review step. */
export function formatAnswer(field: IWizardField, value: AnswerValue | undefined, locale?: string): string {
  if (field.kind === 'multichoice') {
    const picked = asList(value);
    return field.choices.filter((c) => picked.indexOf(c) >= 0).join(', ');
  }
  if (field.kind === 'hyperlink') {
    return formatHyperlinkLabel(value);
  }
  const v = asText(value).trim();
  if (!v) {
    return '';
  }
  if (field.kind === 'datetime') {
    return formatDateTime(v, locale);
  }
  if (field.kind === 'date') {
    const [y, m, d] = v.split('-').map(Number);
    try {
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return v;
    }
  }
  if (field.kind === 'currency') {
    const n = parseNumberInput(v);
    return n === undefined ? '' : formatCurrencyValue(n, field.currencyLocaleId, locale);
  }
  return v;
}

/** First one or two non-empty answers, for the finish screen. */
export function finishSummary(fields: IWizardField[], answers: Answers, locale?: string): string {
  const bits: string[] = [];
  fields.forEach((f) => {
    if (bits.length >= 2) {
      return;
    }
    const shown = formatAnswer(f, answers[f.internalName], locale);
    if (shown) {
      bits.push(shown);
    }
  });
  return bits.join(' \u00b7 ');
}
