import { describeMissing, validateDraft, withArticle } from './validation';
import { DOCUMENT_KINDS } from '../models/seeds';
import type { IFilingDraft } from '../models/filing';
import type { IDocumentKindDefinition } from '../models/sources';

const FILE = { name: 'Riverside-Print-Co_INV-20417.pdf', sizeBytes: 421_888, contentType: 'application/pdf' };

function draft(overrides: Partial<IFilingDraft> = {}): IFilingDraft {
  return { id: 'd1', file: FILE, prefilled: [], ...overrides };
}

const invoice: IDocumentKindDefinition = DOCUMENT_KINDS.filter(k => k.key === 'invoice')[0];
const expense: IDocumentKindDefinition = DOCUMENT_KINDS.filter(k => k.key === 'expenseReport')[0];

const completeInvoice: IFilingDraft = draft({
  documentKind: 'invoice',
  department: 'programs',
  vendor: 'Riverside Print Co.',
  documentDate: '2026-08-15',
  amount: 1284.5,
  status: 'received'
});

describe('validateDraft', () => {
  it('accepts a complete invoice', () => {
    const r = validateDraft(completeInvoice, DOCUMENT_KINDS);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.errors).toEqual({});
  });

  it('accepts a complete expense report', () => {
    const r = validateDraft(
      draft({
        documentKind: 'expenseReport',
        department: 'finance',
        owner: 'luis.marin@example.org',
        documentDate: '2026-07-31',
        amount: 218.75,
        status: 'pendingReview'
      }),
      DOCUMENT_KINDS
    );
    expect(r.ok).toBe(true);
  });

  it('stops at the kind when no kind is chosen', () => {
    const r = validateDraft(draft(), DOCUMENT_KINDS);
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['documentKind']);
  });

  it('reports the design case: invoice missing date and amount', () => {
    const r = validateDraft({ ...completeInvoice, documentDate: undefined, amount: undefined }, DOCUMENT_KINDS);
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['documentDate', 'amount']);
    expect(r.errors.documentDate).toBe('Required for an invoice');
    expect(r.errors.amount).toBe('Enter the invoice total');
  });

  it('requires vendor for invoices and owner for expense reports, not the reverse', () => {
    const noVendor = validateDraft({ ...completeInvoice, vendor: '   ' }, DOCUMENT_KINDS);
    expect(noVendor.missing).toEqual(['vendor']);

    const expenseNoOwner = validateDraft(
      draft({ documentKind: 'expenseReport', department: 'finance', documentDate: '2026-07-31', amount: 10, status: 'pendingReview' }),
      DOCUMENT_KINDS
    );
    expect(expenseNoOwner.missing).toEqual(['owner']);
    expect(expenseNoOwner.errors.vendor).toBeUndefined();
  });

  it('rejects malformed dates, negative amounts and statuses foreign to the kind', () => {
    expect(validateDraft({ ...completeInvoice, documentDate: '2026-02-30' }, DOCUMENT_KINDS).errors.documentDate).toBe('Enter a valid date');
    expect(validateDraft({ ...completeInvoice, amount: -1 }, DOCUMENT_KINDS).errors.amount).toBe('Amount cannot be negative');
    expect(validateDraft({ ...completeInvoice, status: 'pendingReview' }, DOCUMENT_KINDS).errors.status).toBe('Not a valid status for an invoice');
  });

  it('asks for the report owner as an email address (Decision 9)', () => {
    const base: IFilingDraft = draft({ documentKind: 'expenseReport', department: 'finance', documentDate: '2026-07-31', amount: 10, status: 'pendingReview' });
    expect(validateDraft(base, DOCUMENT_KINDS).errors.owner).toBe('Enter the report owner\'s email address');
    expect(validateDraft({ ...base, owner: 'Kim Okafor' }, DOCUMENT_KINDS).errors.owner).toBe('Enter a valid email address');
    expect(validateDraft({ ...base, owner: 'kim@example' }, DOCUMENT_KINDS).errors.owner).toBe('Enter a valid email address');
    expect(validateDraft({ ...base, owner: '  kim.okafor@example.org ' }, DOCUMENT_KINDS).ok).toBe(true);
  });

  it('says a typed date or amount was not understood, rather than missing (M3)', () => {
    const r = validateDraft(
      { ...completeInvoice, documentDate: undefined, documentDateText: 'Aug 14', amount: undefined, amountText: 'lots' },
      DOCUMENT_KINDS
    );
    expect(r.errors.documentDate).toBe('Enter a valid date');
    expect(r.errors.amount).toBe('Enter a valid amount');
  });

  it('rejects an infinite or absurd amount (M2)', () => {
    expect(validateDraft({ ...completeInvoice, amount: Infinity }, DOCUMENT_KINDS).errors.amount).toBe('Enter a valid amount');
    expect(validateDraft({ ...completeInvoice, amount: 1_000_000_001 }, DOCUMENT_KINDS).errors.amount).toBe('Enter a valid amount');
    expect(validateDraft({ ...completeInvoice, amount: 1_000_000_000 }, DOCUMENT_KINDS).ok).toBe(true);
  });

  it('accepts zero as an amount', () => {
    expect(validateDraft({ ...completeInvoice, amount: 0 }, DOCUMENT_KINDS).ok).toBe(true);
  });

  it('reports missing fields in display order, not entry order', () => {
    const r = validateDraft({ ...completeInvoice, amount: undefined, department: undefined, vendor: undefined }, DOCUMENT_KINDS);
    expect(r.missing).toEqual(['department', 'vendor', 'amount']);
  });

  it('flags an unknown kind rather than throwing', () => {
    const r = validateDraft({ ...completeInvoice, documentKind: 'policy' as never }, DOCUMENT_KINDS);
    expect(r.ok).toBe(false);
    expect(r.errors.documentKind).toBe('Unknown document kind');
  });
});

describe('describeMissing', () => {
  it('writes the banner sentence from the designs', () => {
    const r = validateDraft({ ...completeInvoice, documentDate: undefined, amount: undefined }, DOCUMENT_KINDS);
    expect(describeMissing(r, invoice)).toBe('An invoice needs a date and an amount before it can be filed.');
  });

  it('handles one missing field and three', () => {
    const one = validateDraft({ ...completeInvoice, amount: undefined }, DOCUMENT_KINDS);
    expect(describeMissing(one, invoice)).toBe('An invoice needs an amount before it can be filed.');

    const three = validateDraft(
      draft({ documentKind: 'expenseReport', department: 'finance', status: 'pendingReview' }),
      DOCUMENT_KINDS
    );
    expect(describeMissing(three, expense)).toBe('An expense report needs a report owner email, a date and an amount before it can be filed.');
  });

  it('is empty when valid', () => {
    expect(describeMissing(validateDraft(completeInvoice, DOCUMENT_KINDS), invoice)).toBe('');
  });
});

describe('withArticle', () => {
  it('picks a or an', () => {
    expect(withArticle('Invoice')).toBe('an invoice');
    expect(withArticle('Expense report')).toBe('an expense report');
    expect(withArticle('Policy')).toBe('a policy');
  });
});
