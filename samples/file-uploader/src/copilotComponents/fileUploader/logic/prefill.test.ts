import { applyKind, draftFromProperties, filterFromProperties, intentFromProperties } from './prefill';
import { DOCUMENT_KINDS } from '../models/seeds';
import type { IDroppedFile } from '../models/filing';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);
const FILE: IDroppedFile = { name: 'Riverside-Print-Co_INV-20417.pdf', sizeBytes: 421_888, contentType: 'application/pdf' };

describe('draftFromProperties', () => {
  it('projects a prompt onto a draft and marks what came from it', () => {
    const d = draftFromProperties(
      { documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.', documentDate: 'last Friday', amount: 1284.5 },
      FILE,
      DOCUMENT_KINDS,
      NOW,
      'd1'
    );
    expect(d.documentKind).toBe('invoice');
    expect(d.department).toBe('programs');
    expect(d.vendor).toBe('Riverside Print Co.');
    expect(d.documentDate).toBe('2026-08-14');
    expect(d.documentDateText).toBe('last Friday');
    expect(d.amount).toBe(1284.5);
    expect(d.prefilled.sort()).toEqual(['amount', 'department', 'documentDate', 'documentKind', 'vendor']);
  });

  it('applies the kind default status but does not call it pre-filled', () => {
    const d = draftFromProperties({ documentKind: 'invoice' }, FILE, DOCUMENT_KINDS, NOW, 'd1');
    expect(d.status).toBe('received');
    expect(d.prefilled).toEqual(['documentKind']);

    const e = draftFromProperties({ documentKind: 'expenseReport' }, FILE, DOCUMENT_KINDS, NOW, 'd2');
    expect(e.status).toBe('pendingReview');
  });

  it('keeps unparseable date text without inventing a date', () => {
    const d = draftFromProperties({ documentDate: 'sometime in spring' }, FILE, DOCUMENT_KINDS, NOW, 'd1');
    expect(d.documentDate).toBeUndefined();
    expect(d.documentDateText).toBe('sometime in spring');
    expect(d.prefilled).toEqual([]);
  });

  it('produces an empty draft from an empty prompt', () => {
    const d = draftFromProperties({}, FILE, DOCUMENT_KINDS, NOW, 'd1');
    expect(d.prefilled).toEqual([]);
    expect(d.documentKind).toBeUndefined();
    expect(d.file).toBe(FILE);
  });
});

describe('applyKind', () => {
  const invoice = DOCUMENT_KINDS.filter(k => k.key === 'invoice')[0];
  const expense = DOCUMENT_KINDS.filter(k => k.key === 'expenseReport')[0];

  it('keeps a status the new kind allows', () => {
    const d = applyKind({ id: 'd1', file: FILE, prefilled: [], status: 'approved' }, invoice);
    expect(d.status).toBe('approved');
  });

  it('falls back to the new kind default when the status does not apply', () => {
    const d = applyKind({ id: 'd1', file: FILE, prefilled: [], status: 'received' }, expense);
    expect(d.status).toBe('pendingReview');
  });
});

describe('filter and intent', () => {
  it('defaults the period to 30 days', () => {
    expect(filterFromProperties({}).period).toBe('30d');
    expect(filterFromProperties({ period: '7d' }).period).toBe('7d');
  });

  it('carries kind, department and status into the filter', () => {
    const f = filterFromProperties({ documentKind: 'invoice', department: 'finance', status: 'pendingReview' });
    expect(f).toEqual({ documentKind: 'invoice', department: 'finance', status: 'pendingReview', period: '30d' });
  });

  it('defaults the intent to filing', () => {
    expect(intentFromProperties({})).toBe('file');
    expect(intentFromProperties({ intent: 'file' })).toBe('file');
    expect(intentFromProperties({ intent: 'recent' })).toBe('recent');
  });
});
