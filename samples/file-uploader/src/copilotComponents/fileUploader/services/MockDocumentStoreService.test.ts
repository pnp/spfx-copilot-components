import { MockDocumentStoreService } from './MockDocumentStoreService';
import { DocumentStoreUnavailableError } from './IDocumentStoreService';
import {
  CURRENT_USER_ID,
  DEPARTMENTS,
  DOCUMENT_KINDS,
  FILING_SEEDS,
  PEOPLE
} from '../models/seeds';
import { ALL_STATUSES } from '../models/sources';
import type { IFilingDraft, IRecentFilingRow } from '../models/filing';
import { toIsoDate } from '../logic/dates';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

function store(): MockDocumentStoreService {
  return new MockDocumentStoreService({ latencyMs: 0 });
}

const validDraft: IFilingDraft = {
  id: 'd1',
  file: { name: 'Northgate-Supplies_INV-5599.pdf', sizeBytes: 240_000, contentType: 'application/pdf' },
  documentKind: 'invoice',
  department: 'finance',
  vendor: 'Northgate Supplies',
  documentDate: '2026-08-17',
  amount: 512.4,
  status: 'received',
  prefilled: []
};

describe('seed data integrity', () => {
  it('has the expected shape: 36 filings, 2 kinds, 4 departments, 6 people', () => {
    expect(FILING_SEEDS.length).toBe(36);
    expect(DOCUMENT_KINDS.length).toBe(2);
    expect(DEPARTMENTS.length).toBe(4);
    expect(PEOPLE.length).toBe(6);
  });

  it('spot-checks the newest filing against the design', () => {
    const first = FILING_SEEDS[0];
    expect(first.fileName).toBe('Riverside-Print-Co_INV-20417.pdf');
    expect(first.amount).toBe(1284.5);
    expect(first.status).toBe('received');
    expect(first.receiptNumber).toBe('F-10932');
  });

  it('resolves every foreign key', () => {
    const kindKeys: string[] = DOCUMENT_KINDS.map(k => k.key);
    const deptKeys: string[] = DEPARTMENTS.map(d => d.key);
    const peopleIds: string[] = PEOPLE.map(p => p.id);
    FILING_SEEDS.forEach(s => {
      expect(kindKeys).toContain(s.kind);
      expect(deptKeys).toContain(s.department);
      expect(peopleIds).toContain(s.filedById);
      if (s.ownerId) {
        expect(peopleIds).toContain(s.ownerId);
      }
    });
  });

  it('gives every filing a unique id and receipt number', () => {
    expect(new Set(FILING_SEEDS.map(s => s.id)).size).toBe(FILING_SEEDS.length);
    expect(new Set(FILING_SEEDS.map(s => s.receiptNumber)).size).toBe(FILING_SEEDS.length);
  });

  it('covers every status, department and kind, so no filter is dead', () => {
    ALL_STATUSES.forEach(s => expect(FILING_SEEDS.filter(f => f.status === s).length).toBeGreaterThan(0));
    DEPARTMENTS.forEach(d => expect(FILING_SEEDS.filter(f => f.department === d.key).length).toBeGreaterThan(0));
    DOCUMENT_KINDS.forEach(k => expect(FILING_SEEDS.filter(f => f.kind === k.key).length).toBeGreaterThan(0));
  });

  it('authors time as relative offsets only — no hard-coded dates', () => {
    FILING_SEEDS.forEach(s => {
      expect(typeof s.filedOffsetMin).toBe('number');
      expect(s.filedOffsetMin).toBeGreaterThan(0);
      expect(s.documentDateOffsetDays).toBeGreaterThanOrEqual(0);
    });
    const source: string = JSON.stringify(FILING_SEEDS);
    expect(/\d{4}-\d{2}-\d{2}/.test(source)).toBe(false);
  });

  it('requires vendor for every invoice and owner for every expense report', () => {
    FILING_SEEDS.forEach(s => {
      if (s.kind === 'invoice') {
        expect(s.vendor).toBeTruthy();
      } else {
        expect(s.ownerId).toBeTruthy();
      }
    });
  });
});

describe('getRecent', () => {
  it('resolves dates against the injected clock, newest first', async () => {
    const rows: IRecentFilingRow[] = await store().getRecent({ period: '90d' }, NOW);
    expect(rows[0].fileName).toBe('Riverside-Print-Co_INV-20417.pdf');
    expect(toIsoDate(rows[0].filedAt)).toBe('2026-08-18');
    expect(rows[0].documentDate).toBe('2026-08-15');
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].filedAt.getTime()).toBeGreaterThanOrEqual(rows[i].filedAt.getTime());
    }
  });

  it('honours the period window', async () => {
    const s = store();
    const week: IRecentFilingRow[] = await s.getRecent({ period: '7d' }, NOW);
    const month: IRecentFilingRow[] = await s.getRecent({ period: '30d' }, NOW);
    const quarter: IRecentFilingRow[] = await s.getRecent({ period: '90d' }, NOW);
    // Every period chip must change the result, or it is a decorative control (R23).
    expect(week.length).toBe(8); // the eight rows the recent-default design draws
    expect(month.length).toBe(14);
    expect(quarter.length).toBe(36);
  });

  it('filters by kind, department and status', async () => {
    const s = store();
    const invoices = await s.getRecent({ documentKind: 'invoice', period: '90d' }, NOW);
    expect(invoices.every(r => r.documentKind === 'invoice')).toBe(true);

    const finance = await s.getRecent({ department: 'finance', period: '90d' }, NOW);
    expect(finance.every(r => r.department === 'finance')).toBe(true);

    const pending = await s.getRecent({ department: 'finance', status: 'pendingReview', period: '30d' }, NOW);
    expect(pending.length).toBe(1);
    expect(pending[0].fileName).toBe('ER-Aug_Marin.xlsx');
  });

  it('returns nothing for a filter with no matches — the no-match state', async () => {
    const rows = await store().getRecent({ department: 'finance', status: 'returned', period: '30d' }, NOW);
    expect(rows).toEqual([]);
  });

  it('labels rows with resolved names and a destination path', async () => {
    const rows = await store().getRecent({ period: '7d' }, NOW);
    const row = rows[0];
    expect(row.documentKindLabel).toBe('Invoice');
    expect(row.departmentLabel).toBe('Programs');
    expect(row.filedByName).toBe('Dana Whitfield');
    expect(row.savedPath).toBe('Records / Finance / Invoices / Programs / 2026 / Riverside-Print-Co_INV-20417.pdf');
  });

  it('shows only the current user\'s filings', async () => {
    const rows = await store().getRecent({ period: '90d' }, NOW);
    const me = PEOPLE.filter(p => p.id === CURRENT_USER_ID)[0];
    expect(rows.every(r => r.filedByName === me.displayName)).toBe(true);
  });
});

describe('save', () => {
  it('issues a receipt with the destination and the injected time', async () => {
    const receipts = await store().save([validDraft], NOW);
    expect(receipts.length).toBe(1);
    expect(receipts[0].receiptNumber).toBe('F-10946');
    expect(receipts[0].savedAt).toBe(NOW);
    expect(receipts[0].savedByName).toBe('Dana Whitfield');
    expect(receipts[0].savedPath).toBe('Records / Finance / Invoices / Finance / 2026 / Northgate-Supplies_INV-5599.pdf');
  });

  it('numbers receipts consecutively across calls', async () => {
    const s = store();
    const a = await s.save([validDraft], NOW);
    const b = await s.save([{ ...validDraft, id: 'd2' }, { ...validDraft, id: 'd3' }], NOW);
    expect([a[0].receiptNumber, b[0].receiptNumber, b[1].receiptNumber]).toEqual(['F-10946', 'F-10947', 'F-10948']);
  });

  it('never issues a receipt number a seeded filing already has (M1)', async () => {
    const drafts: IFilingDraft[] = FILING_SEEDS.map((_, i) => ({ ...validDraft, id: 'd' + i }));
    const receipts = await store().save(drafts, NOW);
    const seeded: string[] = FILING_SEEDS.map(f => f.receiptNumber);
    expect(receipts.length).toBe(FILING_SEEDS.length);
    expect(receipts.filter(r => seeded.indexOf(r.receiptNumber) >= 0)).toEqual([]);
  });

  it('makes a saved filing appear in Recent within the session', async () => {
    const s = store();
    const before = await s.getRecent({ period: '7d' }, NOW);
    await s.save([validDraft], NOW);
    const after = await s.getRecent({ period: '7d' }, NOW);
    expect(after.length).toBe(before.length + 1);
    expect(after[0].fileName).toBe('Northgate-Supplies_INV-5599.pdf');
    expect(after[0].receiptNumber).toBe('F-10946');
  });

  it('refuses an invalid draft and saves nothing', async () => {
    const s = store();
    const bad: IFilingDraft = { ...validDraft, amount: undefined };
    await expect(s.save([validDraft, bad], NOW)).rejects.toThrow(/not valid/);
    const rows = await s.getRecent({ period: '7d' }, NOW);
    expect(rows.filter(r => r.fileName === validDraft.file.name).length).toBe(0);
  });

  it('never mutates the baseline seeds', async () => {
    const snapshot: string = JSON.stringify(FILING_SEEDS);
    const s = store();
    await s.save([validDraft], NOW);
    await s.getRecent({ period: '90d' }, NOW);
    expect(JSON.stringify(FILING_SEEDS)).toBe(snapshot);
  });

  it('does not leak saves between store instances', async () => {
    const a = store();
    await a.save([validDraft], NOW);
    const fresh = store();
    const rows = await fresh.getRecent({ period: '7d' }, NOW);
    expect(rows.filter(r => r.fileName === validDraft.file.name).length).toBe(0);
  });
});

describe('failure modes', () => {
  it('reports the store as unavailable rather than half-saving', async () => {
    const s = new MockDocumentStoreService({ latencyMs: 0, failSave: true });
    await expect(s.save([validDraft], NOW)).rejects.toBeInstanceOf(DocumentStoreUnavailableError);
  });

  it('reports the store as unavailable when recent filings cannot be read', async () => {
    const s = new MockDocumentStoreService({ latencyMs: 0, failRecent: true });
    await expect(s.getRecent({ period: '30d' }, NOW)).rejects.toBeInstanceOf(DocumentStoreUnavailableError);
  });
});

describe('lookups', () => {
  it('exposes kinds with their required fields and departments', () => {
    const s = store();
    const invoice = s.getKinds().filter(k => k.key === 'invoice')[0];
    expect(invoice.requiredFields).toContain('vendor');
    expect(invoice.requiredFields).not.toContain('owner');
    expect(s.getDepartments().map(d => d.label)).toEqual(['Programs', 'Development', 'Finance', 'Operations']);
  });
});
