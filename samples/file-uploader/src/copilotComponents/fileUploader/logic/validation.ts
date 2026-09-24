import type { IFilingDraft, IValidationResult } from '../models/filing';
import type { FieldKey, IDocumentKindDefinition } from '../models/sources';
import { parseIsoDate } from './dates';
import { MAX_AMOUNT } from '../models/config';

/** Display order for fields, used to order `missing`. */
export const FIELD_ORDER: FieldKey[] = ['documentKind', 'department', 'vendor', 'owner', 'documentDate', 'amount', 'status'];

export const FIELD_LABELS: Record<FieldKey, string> = {
  documentKind: 'Document kind',
  department: 'Department',
  vendor: 'Vendor',
  owner: 'Report owner email',
  documentDate: 'Date',
  amount: 'Amount',
  status: 'Status'
};

function hasText(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * An email address as far as a form can tell: something either side of one
 * `@`, a dot in the domain, no spaces. The live store's `ensureUser` is the real
 * test (todo.md Decision 9); this only stops a name from reaching it.
 */
export function isEmailAddress(v: string | undefined): boolean {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** "an invoice", "an expense report", "a policy". */
export function withArticle(label: string): string {
  const lower: string = label.toLowerCase();
  return (/^[aeiou]/.test(lower) ? 'an ' : 'a ') + lower;
}

/**
 * Validates a draft against its kind's required fields. Pure; the messages are
 * the ones the designs show ("Required for an invoice", "Enter the invoice
 * total"). Nothing here touches the store — validation never saves.
 */
export function validateDraft(draft: IFilingDraft, kinds: IDocumentKindDefinition[]): IValidationResult {
  const errors: Partial<Record<FieldKey, string>> = {};
  const missing: FieldKey[] = [];

  if (!draft.documentKind) {
    errors.documentKind = 'Choose what kind of document this is';
    missing.push('documentKind');
    return { ok: false, errors, missing };
  }
  const kind: IDocumentKindDefinition | undefined = kinds.filter(k => k.key === draft.documentKind)[0];
  if (!kind) {
    errors.documentKind = 'Unknown document kind';
    missing.push('documentKind');
    return { ok: false, errors, missing };
  }
  const article: string = withArticle(kind.label);

  const required: FieldKey[] = FIELD_ORDER.filter(f => kind.requiredFields.indexOf(f) >= 0);
  for (const field of required) {
    switch (field) {
      case 'department':
        if (!draft.department) {
          errors.department = 'Choose the department that owns this record';
          missing.push(field);
        }
        break;
      case 'vendor':
        if (!hasText(draft.vendor)) {
          errors.vendor = 'Enter the vendor name';
          missing.push(field);
        }
        break;
      case 'owner':
        if (!hasText(draft.owner)) {
          errors.owner = 'Enter the report owner\'s email address';
          missing.push(field);
        } else if (!isEmailAddress(draft.owner)) {
          errors.owner = 'Enter a valid email address';
          missing.push(field);
        }
        break;
      case 'documentDate':
        if (!draft.documentDate) {
          // Something typed but not understood is not "missing" (audit M3).
          errors.documentDate = hasText(draft.documentDateText) ? 'Enter a valid date' : 'Required for ' + article;
          missing.push(field);
        } else if (!parseIsoDate(draft.documentDate)) {
          errors.documentDate = 'Enter a valid date';
          missing.push(field);
        }
        break;
      case 'amount':
        if (draft.amount === undefined || draft.amount === null || isNaN(draft.amount)) {
          errors.amount = hasText(draft.amountText)
            ? 'Enter a valid amount'
            : 'Enter the ' + kind.label.toLowerCase() + ' total';
          missing.push(field);
        } else if (!Number.isFinite(draft.amount) || draft.amount > MAX_AMOUNT) {
          errors.amount = 'Enter a valid amount';
          missing.push(field);
        } else if (draft.amount < 0) {
          errors.amount = 'Amount cannot be negative';
          missing.push(field);
        }
        break;
      case 'status':
        if (!draft.status) {
          errors.status = 'Choose a status';
          missing.push(field);
        } else if (kind.statuses.indexOf(draft.status) < 0) {
          errors.status = 'Not a valid status for ' + article;
          missing.push(field);
        }
        break;
      default:
        break;
    }
  }
  return { ok: missing.length === 0, errors, missing };
}

/** One-line summary for the banner: "An invoice needs a date and an amount before it can be filed." */
export function describeMissing(result: IValidationResult, kind: IDocumentKindDefinition | undefined): string {
  if (result.ok || !kind) {
    return '';
  }
  const names: string[] = result.missing
    .filter(f => f !== 'documentKind')
    .map(f => (f === 'documentDate' ? 'a date' : f === 'amount' ? 'an amount' : 'a ' + FIELD_LABELS[f].toLowerCase()));
  if (names.length === 0) {
    return '';
  }
  const list: string =
    names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  const subject: string = withArticle(kind.label);
  return subject.charAt(0).toUpperCase() + subject.slice(1) + ' needs ' + list + ' before it can be filed.';
}
