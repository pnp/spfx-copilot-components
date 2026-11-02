import { ACCOUNTS, OPPORTUNITIES, type IOpportunity } from './domain';
import {
  DEMO_ACCOUNT_HEADQUARTERS, DEMO_COUNTRY_EXPENSES, REVENUE_COUNTRIES,
  countryForAccount, countryPage, countryRevenueScope
} from './countryRevenue';

describe('offline DEMO country attribution and recorded expense ledger', () => {
  it('assigns every original account to a believable headquarters country in its region', () => {
    expect(REVENUE_COUNTRIES).toHaveLength(24);
    expect(new Set(Object.keys(DEMO_ACCOUNT_HEADQUARTERS).map(accountId => DEMO_ACCOUNT_HEADQUARTERS[accountId])).size).toBe(24);
    expect(Object.keys(DEMO_ACCOUNT_HEADQUARTERS)).toHaveLength(ACCOUNTS.length);
    ACCOUNTS.forEach(account => {
      expect(countryForAccount(account.id)?.region).toBe(account.region);
      expect(countryForAccount(account.id)?.id).toMatch(/^[A-Z]{2}$/);
    });
    expect(countryForAccount('CONTOSO')?.id).toBe('US');
    expect(countryForAccount('ACC-017')?.id).toBe('US');
    expect(countryForAccount('ACC-018')?.id).toBe('DE');
    expect(countryForAccount('ACC-019')?.id).toBe('AU');
    expect(countryForAccount('ACC-020')?.id).toBe('BR');
    expect(countryForAccount('not-an-account')).toBeUndefined();
  });

  it.each(['current', 'next', 'all'])('reconciles %s opportunity totals directly to supplied records', period => {
    const scope = countryRevenueScope(OPPORTUNITIES, period, 'all');
    const records = OPPORTUNITIES.filter(item => period === 'all' || item.quarterOffset === (period === 'current' ? 0 : 1));
    expect(scope.valid).toBe(true);
    expect(scope.opportunityValue).toBe(records.reduce((sum, item) => sum + item.value, 0));
    expect(scope.countries.reduce((sum, country) => sum + country.opportunityValue, 0)).toBe(scope.opportunityValue);
    expect(scope.countries.reduce((sum, country) => sum + country.opportunityCount, 0)).toBe(records.length);
    expect(scope.opportunities.map(item => item.id)).toEqual(records.map(item => item.id));
  });

  it('uses the actual supplied value in full, not a rollout allocation, generated fraction or global catalog substitute', () => {
    const supplied: IOpportunity = { ...OPPORTUNITIES[0], value: 1234567, name: 'Actual supplied demo name' };
    const scope = countryRevenueScope([supplied], 'current', 'North America');
    expect(scope.opportunityValue).toBe(1234567);
    expect(scope.countries.find(country => country.id === 'US')?.opportunityValue).toBe(1234567);
    expect(scope.opportunities).toEqual([supplied]);
    expect(scope.opportunities[0]).toBe(supplied);
    expect(scope.countries.filter(country => country.opportunityValue > 0)).toHaveLength(1);
  });

  it('reconciles all 72 current-quarter recorded expenses to $3.4M and the approved regional totals', () => {
    expect(DEMO_COUNTRY_EXPENSES).toHaveLength(72);
    expect(new Set(DEMO_COUNTRY_EXPENSES.map(item => item.id)).size).toBe(72);
    const totals: Readonly<Record<string, number>> = { 'North America': 1260000, EMEA: 1120000, 'Asia Pacific': 660000, 'Latin America': 360000 };
    Object.keys(totals).forEach(region => {
      const expected = totals[region];
      const scope = countryRevenueScope(OPPORTUNITIES, 'current', region);
      expect(scope.recordedSpend).toBe(expected);
      expect(scope.countries.reduce((sum, country) => sum + country.spend, 0)).toBe(expected);
      expect(scope.expenses.every(item => item.status === 'recorded-demo' && item.period === 'current' && item.currency === 'USD')).toBe(true);
    });
    expect(countryRevenueScope([], 'current', 'all').recordedSpend).toBe(3400000);
    expect(countryRevenueScope([], 'all', 'all').recordedSpend).toBe(3400000);
    expect(new Set(DEMO_COUNTRY_EXPENSES.map(item => item.amount)).size).toBeGreaterThan(15);
  });

  it('does not invent next-quarter recorded expenses or reuse opportunity value as spend', () => {
    const next = countryRevenueScope(OPPORTUNITIES, 'next', 'all');
    expect(next.expenses).toEqual([]);
    expect(next.recordedSpend).toBe(0);
    expect(next.opportunityValue).toBeGreaterThan(0);
    expect(next.countries.every(country => country.spend === 0 && country.expenseCount === 0)).toBe(true);
  });

  it.each([['unknown', 'all'], ['current', 'unknown'], ['current', 'na']])('rejects unknown scope %s / %s without fallback', (period, region) => {
    const scope = countryRevenueScope(OPPORTUNITIES, period, region);
    expect(scope.valid).toBe(false);
    expect(scope.issues.length).toBeGreaterThan(0);
    expect(scope.countries).toEqual([]);
    expect(scope.opportunityValue).toBe(0);
    expect(scope.recordedSpend).toBe(0);
  });

  it('makes unmapped accounts and duplicate IDs explicit instead of quietly losing or substituting revenue', () => {
    const unknown = countryRevenueScope([{ ...OPPORTUNITIES[0], accountId: 'UNKNOWN' }], 'current', 'all');
    expect(unknown.valid).toBe(false);
    expect(unknown.issues.join(' ')).toContain('No DEMO headquarters assignment');
    expect(unknown.opportunities).toEqual([]);
    expect(countryRevenueScope([OPPORTUNITIES[0], OPPORTUNITIES[0]], 'current', 'all').issues.join(' ')).toContain('Duplicate');
    expect(countryRevenueScope([{ ...OPPORTUNITIES[0], value: NaN }], 'current', 'all').valid).toBe(false);
  });

  it('keeps two-record pages bounded and clamps stale or invalid page numbers', () => {
    expect(countryPage([1, 2, 3, 4, 5], 1)).toEqual({ page: 1, pageCount: 3, records: [3, 4], originalCount: 5 });
    expect(countryPage([1, 2, 3], 999).records).toEqual([3]);
    expect(countryPage([1, 2, 3], NaN).records).toEqual([1, 2]);
    expect(countryPage([], 10)).toEqual({ page: 0, pageCount: 1, records: [], originalCount: 0 });
  });
});
