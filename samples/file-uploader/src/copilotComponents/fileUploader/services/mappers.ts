import type { IFilingDraft, IFilingReceipt, IRecentFilingRow } from '../models/filing';
import type { IDepartment, IDocumentKindDefinition, IFilingSeed, IPerson } from '../models/sources';
import { addDays, addMinutes, toIsoDate } from '../logic/dates';
import { formatDestination, resolveDestination } from '../logic/destination';

/** Everything a mapper needs to resolve keys to labels. */
export interface ILookups {
  kinds: IDocumentKindDefinition[];
  departments: IDepartment[];
  people: IPerson[];
}

function kindOf(lookups: ILookups, key: string): IDocumentKindDefinition {
  const k: IDocumentKindDefinition | undefined = lookups.kinds.filter(x => x.key === key)[0];
  if (!k) {
    throw new Error('Unknown document kind: ' + key);
  }
  return k;
}

function departmentOf(lookups: ILookups, key: string): IDepartment {
  const d: IDepartment | undefined = lookups.departments.filter(x => x.key === key)[0];
  if (!d) {
    throw new Error('Unknown department: ' + key);
  }
  return d;
}

function personOf(lookups: ILookups, id: string): IPerson {
  const p: IPerson | undefined = lookups.people.filter(x => x.id === id)[0];
  if (!p) {
    throw new Error('Unknown person: ' + id);
  }
  return p;
}

/**
 * Seed (relative time) -> row (absolute time), resolved against `now`.
 * Pure: the same seed and `now` always produce the same row.
 */
export function seedToRow(seed: IFilingSeed, lookups: ILookups, now: Date): IRecentFilingRow {
  const kind: IDocumentKindDefinition = kindOf(lookups, seed.kind);
  const dept: IDepartment = departmentOf(lookups, seed.department);
  const filedBy: IPerson = personOf(lookups, seed.filedById);
  const owner: IPerson | undefined = seed.ownerId ? personOf(lookups, seed.ownerId) : undefined;
  const documentDate: string = toIsoDate(addDays(now, -seed.documentDateOffsetDays));
  const dest = resolveDestination({ documentKind: seed.kind, department: seed.department, documentDate }, lookups.kinds, lookups.departments, now);
  return {
    id: seed.id,
    fileName: seed.fileName,
    sizeBytes: seed.sizeBytes,
    documentKind: seed.kind,
    documentKindLabel: kind.label,
    department: seed.department,
    departmentLabel: dept.label,
    vendor: seed.vendor,
    ownerName: owner ? owner.displayName : undefined,
    documentDate,
    amount: seed.amount,
    status: seed.status,
    filedAt: addMinutes(now, -seed.filedOffsetMin),
    filedByName: filedBy.displayName,
    receiptNumber: seed.receiptNumber,
    savedPath: (dest ? formatDestination(dest) : '') + ' / ' + seed.fileName
  };
}

/** A validated draft becomes a receipt at save time. The store supplies number, time and who. */
export function draftToReceipt(
  draft: IFilingDraft,
  lookups: ILookups,
  receiptNumber: string,
  savedAt: Date,
  savedByName: string
): IFilingReceipt {
  if (!draft.documentKind || !draft.department || !draft.documentDate || draft.amount === undefined || !draft.status) {
    throw new Error('Draft is not complete; validate before saving');
  }
  const kind: IDocumentKindDefinition = kindOf(lookups, draft.documentKind);
  const dept: IDepartment = departmentOf(lookups, draft.department);
  const dest = resolveDestination(draft, lookups.kinds, lookups.departments, savedAt);
  return {
    receiptNumber,
    fileName: draft.file.name,
    documentKind: draft.documentKind,
    documentKindLabel: kind.label,
    department: draft.department,
    departmentLabel: dept.label,
    vendor: draft.vendor,
    owner: draft.owner,
    documentDate: draft.documentDate,
    amount: draft.amount,
    status: draft.status,
    savedPath: (dest ? formatDestination(dest) : '') + ' / ' + draft.file.name,
    savedAt,
    savedByName
  };
}

/** A receipt shows up in Recent within the same session. */
export function receiptToRow(receipt: IFilingReceipt, id: string, sizeBytes: number): IRecentFilingRow {
  return {
    id,
    fileName: receipt.fileName,
    sizeBytes,
    documentKind: receipt.documentKind,
    documentKindLabel: receipt.documentKindLabel,
    department: receipt.department,
    departmentLabel: receipt.departmentLabel,
    vendor: receipt.vendor,
    ownerName: receipt.owner,
    documentDate: receipt.documentDate,
    amount: receipt.amount,
    status: receipt.status,
    filedAt: receipt.savedAt,
    filedByName: receipt.savedByName,
    receiptNumber: receipt.receiptNumber,
    savedPath: receipt.savedPath,
    webUrl: receipt.webUrl
  };
}
