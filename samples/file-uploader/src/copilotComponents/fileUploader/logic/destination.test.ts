import { formatDestination, formatDestinationShort, resolveDestination } from './destination';
import { DEPARTMENTS, DOCUMENT_KINDS } from '../models/seeds';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

describe('resolveDestination', () => {
  it('builds the path from kind, department and the document year', () => {
    const dest = resolveDestination(
      { documentKind: 'invoice', department: 'programs', documentDate: '2026-08-15' },
      DOCUMENT_KINDS,
      DEPARTMENTS,
      NOW
    );
    expect(dest).toBeDefined();
    expect(formatDestination(dest!)).toBe('Records / Finance / Invoices / Programs / 2026');
    expect(formatDestinationShort(dest!)).toBe('Finance › Invoices › Programs');
  });

  it('uses the expense-report folder for expense reports', () => {
    const dest = resolveDestination(
      { documentKind: 'expenseReport', department: 'development', documentDate: '2026-07-31' },
      DOCUMENT_KINDS,
      DEPARTMENTS,
      NOW
    );
    expect(formatDestination(dest!)).toBe('Records / Finance / Expense reports / Development / 2026');
  });

  it('takes the year from the document date, not from now', () => {
    const dest = resolveDestination(
      { documentKind: 'invoice', department: 'finance', documentDate: '2025-12-30' },
      DOCUMENT_KINDS,
      DEPARTMENTS,
      NOW
    );
    expect(formatDestination(dest!).endsWith('/ 2025')).toBe(true);
  });

  it('falls back to the current year when no document date is set yet', () => {
    const dest = resolveDestination({ documentKind: 'invoice', department: 'finance' }, DOCUMENT_KINDS, DEPARTMENTS, NOW);
    expect(formatDestination(dest!).endsWith('/ 2026')).toBe(true);
  });

  it('is undefined until both kind and department are known', () => {
    expect(resolveDestination({ documentKind: 'invoice' }, DOCUMENT_KINDS, DEPARTMENTS, NOW)).toBeUndefined();
    expect(resolveDestination({ department: 'finance' }, DOCUMENT_KINDS, DEPARTMENTS, NOW)).toBeUndefined();
    expect(resolveDestination({}, DOCUMENT_KINDS, DEPARTMENTS, NOW)).toBeUndefined();
  });

  it('is undefined for keys that are not in the lookups', () => {
    expect(
      resolveDestination({ documentKind: 'policy' as never, department: 'finance' }, DOCUMENT_KINDS, DEPARTMENTS, NOW)
    ).toBeUndefined();
  });
});
