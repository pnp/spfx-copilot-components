import type { Answers, ISubmitResult, IWizardField } from '../models';
import type { ReconcileOutcome } from '../services/IListFormService';
import { buildItemPayload, type ItemPayloadValue } from './payload';
import { isValidInternalName, odataString } from './siteUrl';

/** Clock-skew window when matching Created ge submit start. */
export const RECONCILE_CREATED_SKEW_MS = 30000;

/** Rows read per check. A full page means the read may not cover every candidate, so it is inconclusive. */
export const RECONCILE_ITEM_TOP = 50;

/** Check while the original save is still pending: an empty read proves nothing yet. */
export const SAVE_NOT_FOUND_YET_MESSAGE = 'Not found yet. SharePoint may still be saving. Check again in a moment.';

/** Check after the original save ended without a confirmation, and no item matches every answer. */
export const SAVE_NOT_FOUND_MESSAGE =
  'No item with all of your answers was found in the list. SharePoint never confirmed the first save, so it could still appear. If you have checked the list and it is not there, you can save again.';

/** The original save ended without a confirmation (connection lost, gateway or throttling error). */
export const SAVE_UNCONFIRMED_SETTLED_MESSAGE =
  'SharePoint stopped responding before it confirmed the save. Your answers are still here. Check whether it was saved before you save again.';

/** The original save ended without a confirmation while a check was running: check once more. */
export const SAVE_CHECK_AGAIN_MESSAGE = 'SharePoint stopped responding before it confirmed the save. Check again to see whether it was saved.';

export const SAVE_MULTIPLE_MESSAGE = 'More than one item with all of your answers was found, so this save can\u2019t be confirmed. Check the list before you save again.';

export const SAVE_INCONCLUSIVE_MESSAGE = 'There are too many recent items to check here. Open the list to see whether it was saved.';

export const SAVE_CHECK_FAILED_MESSAGE = 'The list couldn\u2019t be checked yet. Wait a moment and check again.';

export interface IReconcileField {
  name: string;
  value: string | number | boolean;
}

export interface IReconcileMatchOptions {
  authorId: number;
  /** Earliest Created time accepted, in ms (submit start less the skew window). */
  createdFrom: number;
  listUrl: string;
  /** Rows requested. Defaults to RECONCILE_ITEM_TOP. */
  top?: number;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function reconcileCreatedFrom(submittedAt: number): number {
  return Math.max(0, submittedAt - RECONCILE_CREATED_SKEW_MS);
}

export function odataDateTimeLiteral(ms: number): string {
  return `datetime'${new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')}'`;
}

export function currentUserUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/_api/web/currentuser?$select=Id`;
}

/**
 * Optional server-side narrowing: Title, otherwise the first answered single line of text or choice.
 * Only these kinds are filtered with eq, because their stored value equals the sent value. The match
 * itself is always done on every submitted value, client side.
 */
export function pickReconcileField(fields: IWizardField[], payload: Record<string, ItemPayloadValue>): IReconcileField | undefined {
  const prefer = ['Title'].concat(fields.map((field) => field.internalName));
  const seen: Record<string, boolean> = {};
  for (let i = 0; i < prefer.length; i++) {
    const name = prefer[i];
    if (!name || seen[name] || !isValidInternalName(name)) {
      continue;
    }
    seen[name] = true;
    const field = fields.filter((item) => item.internalName === name)[0];
    if (!field || (field.kind !== 'text' && field.kind !== 'choice')) {
      continue;
    }
    const value = payload[name];
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }
    return { name, value };
  }
  return undefined;
}

function comparedFields(fields: IWizardField[]): IWizardField[] {
  const seen: Record<string, boolean> = {};
  return fields.filter((field) => {
    if (!field.internalName || seen[field.internalName] || !isValidInternalName(field.internalName)) {
      return false;
    }
    seen[field.internalName] = true;
    return true;
  });
}

/** GET items URL: AuthorId, Created ge submit start (less skew), every submitted column selected. */
export function buildReconcileItemsUrl(listApi: string, fields: IWizardField[], authorId: number, submittedAt: number, answers: Answers, top: number = RECONCILE_ITEM_TOP): string {
  const payload = buildItemPayload(fields, answers);
  const narrow = pickReconcileField(fields, payload);
  const parts = [`AuthorId eq ${authorId}`, `Created ge ${odataDateTimeLiteral(reconcileCreatedFrom(submittedAt))}`];
  if (narrow) {
    parts.push(`${narrow.name} eq '${odataString(String(narrow.value))}'`);
  }
  const select = ['Id', 'Created', 'AuthorId'].concat(comparedFields(fields).map((field) => field.internalName));
  return `${listApi}/items?$select=${select.join(',')}&$filter=${encodeURIComponent(parts.join(' and '))}&$orderby=Created desc&$top=${top}`;
}

export function itemsFromResponse(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter((row) => !!(row && typeof row === 'object')) as Record<string, unknown>[];
  }
  const root = asRecord(body);
  if (!root) {
    return [];
  }
  if (Array.isArray(root.value)) {
    return root.value.filter((row) => !!(row && typeof row === 'object')) as Record<string, unknown>[];
  }
  const d = asRecord(root.d);
  if (d && Array.isArray(d.results)) {
    return d.results.filter((row) => !!(row && typeof row === 'object')) as Record<string, unknown>[];
  }
  return [];
}

export function readItemId(row: Record<string, unknown>): number {
  if (typeof row.Id === 'number' && isFinite(row.Id) && row.Id > 0) {
    return row.Id;
  }
  if (typeof row.ID === 'number' && isFinite(row.ID) && row.ID > 0) {
    return row.ID;
  }
  return 0;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Multiple lines of text: SharePoint may wrap rich text in markup, so compare the visible text only. */
export function normalizeNoteText(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match: string, code: string) => {
      const lower = code.toLowerCase();
      if (lower.charAt(0) === '#') {
        const n = lower.charAt(1) === 'x' ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
        return isFinite(n) && n > 0 && n <= 0xffff ? String.fromCharCode(n) : match;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, lower) ? ENTITIES[lower] : match;
    })
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isoDay(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }
  const ms = Date.parse(value);
  return isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : '';
}

function minuteOf(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) {
    return NaN;
  }
  const ms = Date.parse(value);
  return isFinite(ms) ? Math.floor(ms / 60000) : NaN;
}

function asBool(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'Yes' || value === 'true') {
    return true;
  }
  if (value === false || value === 0 || value === '0' || value === 'No' || value === 'false') {
    return false;
  }
  return undefined;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return Number(value);
  }
  return NaN;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string').map((v) => (v as string).trim()).filter((v) => !!v);
  }
  const record = asRecord(value);
  if (record && Array.isArray(record.results)) {
    return stringList(record.results);
  }
  if (typeof value === 'string') {
    return value.split(';#').map((v) => v.trim()).filter((v) => !!v);
  }
  return [];
}

function urlParts(value: unknown): { url: string; description: string } {
  const record = asRecord(value);
  if (!record) {
    return { url: typeof value === 'string' ? value.split(', ')[0].trim() : '', description: '' };
  }
  const url = typeof record.Url === 'string' ? record.Url.trim() : '';
  const description = typeof record.Description === 'string' ? record.Description.trim() : '';
  return { url, description };
}

/** True when a stored value is empty: null, missing, blank text, no choices, or a link with no URL. */
export function isEmptyStoredValue(field: IWizardField, actual: unknown): boolean {
  if (actual === undefined || actual === null) {
    return true;
  }
  switch (field.kind) {
    case 'multichoice':
      return stringList(actual).length === 0;
    case 'hyperlink':
      return !urlParts(actual).url;
    case 'note':
      return !normalizeNoteText(actual);
    default:
      return typeof actual === 'string' && !actual.trim();
  }
}

/** Compare one submitted value with the stored value, normalised by column kind. */
export function storedValueMatches(field: IWizardField, expected: ItemPayloadValue, actual: unknown): boolean {
  if (actual === undefined || actual === null) {
    return false;
  }
  switch (field.kind) {
    case 'text':
    case 'choice':
      return typeof expected === 'string' && typeof actual === 'string' && actual.trim() === expected.trim();
    case 'note':
      return normalizeNoteText(expected) === normalizeNoteText(actual);
    case 'multichoice': {
      const want = stringList(expected).sort();
      const got = stringList(actual).sort();
      return want.length === got.length && want.every((v, i) => v === got[i]);
    }
    case 'date': {
      const want = isoDay(expected);
      return !!want && want === isoDay(actual);
    }
    case 'datetime': {
      const want = minuteOf(expected);
      return isFinite(want) && want === minuteOf(actual);
    }
    case 'yesno': {
      const want = asBool(expected);
      return want !== undefined && want === asBool(actual);
    }
    case 'number':
    case 'currency': {
      const want = asNumber(expected);
      const got = asNumber(actual);
      return isFinite(want) && isFinite(got) && Math.abs(want - got) <= 1e-9 * Math.max(1, Math.abs(want));
    }
    case 'hyperlink': {
      const want = urlParts(expected);
      const got = urlParts(actual);
      if (!want.url || want.url !== got.url) {
        return false;
      }
      // An empty description may be stored as empty or as the URL itself.
      return want.description ? want.description === got.description : !got.description || got.description === got.url;
    }
    default:
      return false;
  }
}

/**
 * True when the row could be this save: same author, created inside the window, every answered column
 * equal, and every unanswered column empty (unless the column has a default SharePoint may apply).
 */
export function rowMatchesSubmission(row: Record<string, unknown>, fields: IWizardField[], payload: Record<string, ItemPayloadValue>, options: IReconcileMatchOptions): boolean {
  if (!readItemId(row)) {
    return false;
  }
  const authorId = typeof row.AuthorId === 'number' ? row.AuthorId : Number(row.AuthorId);
  if (authorId !== options.authorId) {
    return false;
  }
  const created = typeof row.Created === 'string' ? Date.parse(row.Created) : NaN;
  if (!isFinite(created) || created < options.createdFrom) {
    return false;
  }
  const columns = comparedFields(fields);
  for (let i = 0; i < columns.length; i++) {
    const field = columns[i];
    const expected = payload[field.internalName];
    const actual = row[field.internalName];
    if (expected === undefined) {
      if (!field.hasDefault && !isEmptyStoredValue(field, actual)) {
        return false;
      }
      continue;
    }
    if (!storedValueMatches(field, expected, actual)) {
      return false;
    }
  }
  return true;
}

/** Exactly one full match is a confirmed save. Several matches, or a full page of rows, are never picked from. */
export function matchReconciledItems(body: unknown, fields: IWizardField[], answers: Answers, options: IReconcileMatchOptions): ReconcileOutcome {
  const rows = itemsFromResponse(body);
  const top = options.top || RECONCILE_ITEM_TOP;
  if (rows.length >= top) {
    return { status: 'inconclusive' };
  }
  const payload = buildItemPayload(fields, answers);
  const matches = rows.filter((row) => rowMatchesSubmission(row, fields, payload, options));
  if (matches.length === 0) {
    return { status: 'none' };
  }
  if (matches.length > 1) {
    return { status: 'multiple', count: matches.length };
  }
  const id = readItemId(matches[0]);
  const result: ISubmitResult = { id, itemUrl: options.listUrl ? `${options.listUrl}/DispForm.aspx?ID=${id}` : '', demo: false };
  return { status: 'found', result };
}

export function readCurrentUserId(body: unknown): number | undefined {
  const root = asRecord(body);
  if (!root) {
    return undefined;
  }
  if (typeof root.Id === 'number' && isFinite(root.Id) && root.Id > 0) {
    return root.Id;
  }
  const d = asRecord(root.d);
  if (d && typeof d.Id === 'number' && isFinite(d.Id) && d.Id > 0) {
    return d.Id;
  }
  return undefined;
}
