import type { AnswerValue, IHyperlinkAnswer } from '../models';

export type { IHyperlinkAnswer } from '../models';

/** SharePoint URL and description fields are both capped at 255 characters. */
export const HYPERLINK_URL_MAX = 255;
export const HYPERLINK_DESC_MAX = 255;

/** URL format (DisplayFormat 0). Image format is 1 and stays unsupported. */
export const URL_DISPLAY_FORMAT = 0;
export const URL_IMAGE_FORMAT = 1;

export function isHyperlinkAnswer(value: unknown): value is IHyperlinkAnswer {
  return !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as { url?: unknown }).url === 'string';
}

export function emptyHyperlink(): IHyperlinkAnswer {
  return { url: '', description: '' };
}

/** Reads a hyperlink answer, or a lone URL string (prefill / older drafts). */
export function asHyperlink(value: AnswerValue | undefined): IHyperlinkAnswer {
  if (isHyperlinkAnswer(value)) {
    return { url: value.url, description: typeof value.description === 'string' ? value.description : '' };
  }
  if (typeof value === 'string') {
    return { url: value, description: '' };
  }
  return emptyHyperlink();
}

export type HyperlinkProblem = 'empty' | 'http' | 'credentials' | 'invalid' | 'tooLong';

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file|about|blob):/i;

export function hyperlinkUrlProblem(raw: string): HyperlinkProblem | undefined {
  const text = (raw || '').trim();
  if (!text) {
    return 'empty';
  }
  if (text.length > HYPERLINK_URL_MAX) {
    return 'tooLong';
  }
  if (/^http:\/\//i.test(text)) {
    return 'http';
  }
  if (BLOCKED_SCHEMES.test(text)) {
    return 'invalid';
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return 'invalid';
  }
  if (parsed.protocol === 'http:') {
    return 'http';
  }
  if (parsed.protocol !== 'https:') {
    return 'invalid';
  }
  if (parsed.username || parsed.password) {
    return 'credentials';
  }
  if (!parsed.hostname) {
    return 'invalid';
  }
  if (parsed.href.length > HYPERLINK_URL_MAX) {
    return 'tooLong';
  }
  return undefined;
}

/** Normalised https URL, or undefined when the value is not safe to save or link. */
export function validatedHttpsUrl(raw: string): string | undefined {
  if (hyperlinkUrlProblem(raw)) {
    return undefined;
  }
  try {
    return new URL(raw.trim()).href;
  } catch {
    return undefined;
  }
}

export function hyperlinkErrorMessage(problem: HyperlinkProblem | undefined, required: boolean): string | undefined {
  if (!problem || problem === 'empty') {
    return problem === 'empty' && required ? 'Please fill this in.' : undefined;
  }
  if (problem === 'http') {
    return 'Please use an https:// link.';
  }
  if (problem === 'credentials') {
    return 'Remove the username and password from the link.';
  }
  if (problem === 'tooLong') {
    return `Please use ${HYPERLINK_URL_MAX} characters or fewer.`;
  }
  return 'Please enter a valid https:// link.';
}

export function liveHyperlinkMessage(raw: string, required: boolean, interacted: boolean): string | undefined {
  const problem = hyperlinkUrlProblem(raw);
  if (!problem || problem === 'empty') {
    return problem === 'empty' && required && interacted ? 'This one needs an answer.' : undefined;
  }
  if (problem === 'http') {
    return 'Links need to start with https://.';
  }
  if (problem === 'credentials') {
    return 'Remove the username and password from the link.';
  }
  if (problem === 'tooLong') {
    return `Please use ${HYPERLINK_URL_MAX} characters or fewer.`;
  }
  return 'That doesn\u2019t look like an https:// link.';
}

/** Plain-text review / finish label: the description, or the URL when the description is empty. */
export function formatHyperlinkLabel(value: AnswerValue | undefined): string {
  const link = asHyperlink(value);
  const url = validatedHttpsUrl(link.url);
  if (!url) {
    return '';
  }
  const desc = link.description.trim();
  return desc || url;
}

/**
 * REST body for POST /items with odata=nometadata: { Url, Description } and no __metadata.
 * validateUpdateListItem would instead want the string "url, description"; verbose metadata would
 * wrap the object with { __metadata: { type: 'SP.FieldUrlValue' } }. This project posts nometadata.
 */
export function toFieldUrlValue(value: AnswerValue | undefined): { Url: string; Description: string } | undefined {
  const link = asHyperlink(value);
  const url = validatedHttpsUrl(link.url);
  if (!url) {
    return undefined;
  }
  return { Url: url, Description: link.description.trim().slice(0, HYPERLINK_DESC_MAX) };
}

/** Prefill: an https URL string, or { Url, Description } / { url, description }. Invalid URLs are dropped. */
export function coerceHyperlinkPrefill(value: unknown): IHyperlinkAnswer | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return validatedHttpsUrl(trimmed) ? { url: trimmed.slice(0, HYPERLINK_URL_MAX), description: '' } : undefined;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  const urlRaw = typeof rec.Url === 'string' ? rec.Url : typeof rec.url === 'string' ? rec.url : '';
  const descRaw = typeof rec.Description === 'string' ? rec.Description : typeof rec.description === 'string' ? rec.description : '';
  const trimmed = urlRaw.trim();
  if (!validatedHttpsUrl(trimmed)) {
    return undefined;
  }
  return { url: trimmed.slice(0, HYPERLINK_URL_MAX), description: descRaw.trim().slice(0, HYPERLINK_DESC_MAX) };
}
