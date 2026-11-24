import type { Answers, IFormSchema, ISubmitResult, IWizardField } from '../models';
import { buildItemPayload, type ItemPayloadValue } from './payload';
import { isValidInternalName, listApiUrl, odataString } from './siteUrl';

/** Clock-skew window when matching Created ge submit start. */
export const RECONCILE_CREATED_SKEW_MS = 30000;

export const RECONCILE_ITEM_TOP = 20;

export const SAVE_NOT_FOUND_MESSAGE = 'No matching item was found in the list. You can try saving again.';

export const SAVE_CHECK_FAILED_MESSAGE = 'The list couldn\u2019t be checked yet. Wait a moment and check again.';

export interface IReconcileField {
  name: string;
  value: string | number | boolean;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function isScalar(value: ItemPayloadValue | undefined): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
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

/** Prefer Title, otherwise the first scalar submitted field. Never writes a token into the list. */
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
    if (!field || field.kind === 'note' || field.kind === 'multichoice' || field.kind === 'hyperlink') {
      continue;
    }
    const value = payload[name];
    if (!isScalar(value) || (typeof value === 'string' && !value.trim()) || (typeof value === 'number' && !isFinite(value))) {
      continue;
    }
    return { name, value };
  }
  return undefined;
}

export function reconcileFieldFrom(schema: IFormSchema, answers: Answers): IReconcileField | undefined {
  return pickReconcileField(schema.fields, buildItemPayload(schema.fields, answers));
}

function fieldFilter(field: IReconcileField): string {
  if (typeof field.value === 'string') {
    return `${field.name} eq '${odataString(field.value)}'`;
  }
  if (typeof field.value === 'boolean') {
    return `${field.name} eq ${field.value ? 'true' : 'false'}`;
  }
  return `${field.name} eq ${field.value}`;
}

/** GET items URL: AuthorId, Created ge submit start (with skew), and the first comparable field. */
export function buildReconcileItemsUrl(listApi: string, authorId: number, submittedAt: number, field?: IReconcileField): string {
  const parts = [`AuthorId eq ${authorId}`, `Created ge ${odataDateTimeLiteral(reconcileCreatedFrom(submittedAt))}`];
  const select = field ? `Id,Created,AuthorId,${field.name}` : 'Id,Created,AuthorId';
  if (field) {
    parts.push(fieldFilter(field));
  }
  return `${listApi}/items?$select=${select}&$filter=${encodeURIComponent(parts.join(' and '))}&$orderby=Created desc&$top=${RECONCILE_ITEM_TOP}`;
}

export function buildReconcileItemsUrlFor(schema: IFormSchema, siteUrl: string, listTitle: string, authorId: number, submittedAt: number, answers: Answers): string {
  return buildReconcileItemsUrl(listApiUrl(siteUrl, listTitle), authorId, submittedAt, reconcileFieldFrom(schema, answers));
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

export function valuesEqual(expected: string | number | boolean, actual: unknown): boolean {
  if (typeof expected === 'boolean') {
    return actual === expected || actual === (expected ? 'Yes' : 'No') || actual === (expected ? 1 : 0);
  }
  if (typeof expected === 'number') {
    return typeof actual === 'number' ? actual === expected : Number(actual) === expected;
  }
  return actual !== undefined && actual !== null && String(actual).trim() === expected.trim();
}

export function matchReconciledItem(body: unknown, field: IReconcileField | undefined, listUrl: string): ISubmitResult | undefined {
  const rows = itemsFromResponse(body);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = readItemId(row);
    if (!id) {
      continue;
    }
    if (field && !valuesEqual(field.value, row[field.name])) {
      continue;
    }
    if (!field && rows.length > 1) {
      return undefined;
    }
    return { id, itemUrl: listUrl ? `${listUrl}/DispForm.aspx?ID=${id}` : '', demo: false };
  }
  return undefined;
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
