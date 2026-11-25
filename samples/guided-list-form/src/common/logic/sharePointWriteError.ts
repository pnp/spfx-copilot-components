import { sanitizePlainText } from './config';
import { ListFormError } from '../services/IListFormService';
import type { Answers, IWizardField } from '../models';
import { validateAll } from './validation';

/** Client-side and SharePoint write timeout used on submit. */
export const SUBMIT_TIMEOUT_MS = 20000;

export const SUBMIT_TIMEOUT_MESSAGE = 'SharePoint took too long to respond. Your answers are still here. The save is not confirmed yet. Check whether it was saved before you try again.';

export interface IWatchedWork<T> {
  /** The original work, including a successful or failed response that arrives after the timeout. */
  work: Promise<T>;
  /** Settles when work finishes first, or rejects with a timeout error if work is still pending. */
  first: Promise<T>;
}

const MESSAGE_MAX = 240;

/**
 * Watches a request without cancelling it. A timeout rejects `first` only; `work` still settles
 * if SharePoint responds later. Client-side cancellation cannot guarantee the server did not commit.
 */
export function watchWithTimeout<T>(work: Promise<T>, ms: number = SUBMIT_TIMEOUT_MS, message: string = SUBMIT_TIMEOUT_MESSAGE): IWatchedWork<T> {
  let settled = false;
  const first = new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!settled) {
        reject(new ListFormError('timeout', message));
      }
    }, ms);
    work.then(
      (value) => {
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
  // Avoid an unhandled rejection if the caller reads `first` first and attaches to `work` later.
  work.then(
    () => undefined,
    () => undefined
  );
  return { work, first };
}

export function withTimeout<T>(work: Promise<T>, ms: number = SUBMIT_TIMEOUT_MS, message: string = SUBMIT_TIMEOUT_MESSAGE): Promise<T> {
  return watchWithTimeout(work, ms, message).first;
}

interface IExceptionRow {
  HasException?: unknown;
  ErrorMessage?: unknown;
  FieldName?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function odataMessage(body: unknown): string {
  const root = asRecord(body);
  if (!root) {
    return '';
  }
  const error = asRecord(root['odata.error']) || asRecord(root.error);
  if (!error) {
    return '';
  }
  const raw = error.message;
  if (typeof raw === 'string') {
    return sanitizePlainText(raw, MESSAGE_MAX);
  }
  const wrapped = asRecord(raw);
  if (wrapped && typeof wrapped.value === 'string') {
    return sanitizePlainText(wrapped.value, MESSAGE_MAX);
  }
  return '';
}

function exceptionRows(body: unknown): IExceptionRow[] {
  const root = asRecord(body);
  if (!root) {
    return [];
  }
  const direct = root.value;
  if (Array.isArray(direct)) {
    return direct as IExceptionRow[];
  }
  const results = asRecord(direct);
  if (results && Array.isArray(results.results)) {
    return results.results as IExceptionRow[];
  }
  const d = asRecord(root.d);
  if (d && Array.isArray(d.results)) {
    return d.results as IExceptionRow[];
  }
  if (d && Array.isArray(d.value)) {
    return d.value as IExceptionRow[];
  }
  return [];
}

function hasExceptionMessages(body: unknown): string[] {
  const messages: string[] = [];
  exceptionRows(body).forEach((row) => {
    if (row.HasException !== true) {
      return;
    }
    const named = typeof row.FieldName === 'string' ? sanitizePlainText(row.FieldName, 80) : '';
    const detail = sanitizePlainText(typeof row.ErrorMessage === 'string' ? row.ErrorMessage : '', MESSAGE_MAX);
    const text = detail || (named ? `\u201c${named}\u201d couldn\u2019t be saved.` : '');
    if (text) {
      messages.push(text);
    }
  });
  return messages;
}

/**
 * User-safe message from a SharePoint REST write: OData error bodies (typical for POST /items)
 * or ValidateUpdateListItem / AddValidateUpdateItemUsingPath rows with HasException.
 */
export function parseSharePointWriteError(body: unknown, status?: number): string | undefined {
  const exceptions = hasExceptionMessages(body);
  if (exceptions.length > 0) {
    return exceptions.join(' ');
  }
  const odata = odataMessage(body);
  if (odata) {
    return odata;
  }
  if (status && status >= 400) {
    return undefined;
  }
  return undefined;
}

export function hasSharePointWriteException(body: unknown): boolean {
  return hasExceptionMessages(body).length > 0;
}

/** Client-side required/format errors, named so the review screen can show them. */
export function requiredSubmitMessage(fields: IWizardField[], answers: Answers): string | undefined {
  const errors = validateAll(fields, answers);
  const names = fields.filter((f) => errors[f.internalName]).map((f) => f.title || f.internalName);
  if (names.length === 0) {
    return undefined;
  }
  if (names.length === 1) {
    return `Please fill in ${names[0]}.`;
  }
  if (names.length === 2) {
    return `Please fill in ${names[0]} and ${names[1]}.`;
  }
  return `Please fill in ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}.`;
}
