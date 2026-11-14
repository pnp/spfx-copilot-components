import { buyingOptions, contracts, demandCohort, diversification, getReceipts, initialSelection, invoices, leakageOpportunities, recordConfirmation, resetProcurementSession, subscribeReceipts, supplierRecords, validDate, validNumber } from './operations';

describe('bounded procurement operations', () => {
  beforeEach(resetProcurementSession);
  test.each([34, 40, 60, 80])('allocates exactly 100%% without exceeding a %s%% concentration cap', cap => {
    const shares = diversification(cap);
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(shares.every(value => value >= 0 && value <= cap)).toBe(true);
  });
  test('keeps currency and region coherent in demand cohorts', () => {
    const cohort = demandCohort('IT hardware', 'EMEA', 'EUR');
    expect(cohort.length).toBeGreaterThan(1);
    expect(cohort.every(request => request.currency === 'EUR' && request.region === 'EMEA')).toBe(true);
    expect(demandCohort('IT hardware', 'EMEA', 'JPY')).toHaveLength(0);
  });
  test('recalculates buying alternatives from quantity', () => {
    expect(buyingOptions(600)[0].cost).toBe(1034000);
    expect(buyingOptions(700)[0].cost).toBeGreaterThan(buyingOptions(600)[0].cost);
    expect(buyingOptions(600)[1].cost).toBe(894000);
  });
  test('connects suppliers, contracts, invoice disputes and verified value', () => {
    expect(contracts.every(contract => supplierRecords.some(supplier => supplier.id === contract.supplierId))).toBe(true);
    expect(invoices[0].billed - invoices[0].received).toBe(15000);
    expect(invoices[0].billed - invoices[0].received).toBeGreaterThan(invoices[0].tolerance);
    expect(leakageOpportunities.every(item => item.realized + item.disputed <= item.contracted)).toBe(true);
    expect(leakageOpportunities.reduce((sum, item) => sum + item.realized, 0)).toBe(186000);
  });
  test('normalizes exact names but preserves unknown identifiers', () => {
    expect(initialSelection(supplierRecords, 'fabrikam devices')).toBe('ZPC-SUP-001');
    expect(initialSelection(supplierRecords, 'ZPC-UNKNOWN')).toBe('ZPC-UNKNOWN');
  });
  test('enforces inclusive numeric boundaries and rejects missing or invalid amounts', () => {
    expect(validNumber(5, 5, 45)).toBe(true);
    expect(validNumber(45, 5, 45)).toBe(true);
    expect(validNumber(46, 5, 45)).toBe(false);
    expect(validNumber(NaN, 5, 45)).toBe(false);
    expect(validNumber(Infinity, 5, 45)).toBe(false);
  });
  test('rejects impossible ISO dates rather than normalizing them', () => {
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2026-11-31')).toBe(false);
    expect(validDate('2026-11-20')).toBe(true);
  });
  test('notifies only subscribed session observers and assigns distinct receipts', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeReceipts(listener);
    const first = recordConfirmation('ReviewSupplierAward', 'ZPC-RFP-31', 'Approve split award', 'Reviewed 65/35 allocation');
    unsubscribe();
    const second = recordConfirmation('ResolveInvoiceException', 'ZPC-8831', 'Request correction', 'Freight dispute excluded');
    expect(first.id).not.toBe(second.id);
    expect(getReceipts()).toHaveLength(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
