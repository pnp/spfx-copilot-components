import { ACCOUNTS, type IOpportunity } from './domain';

export type CountryRevenueMetric = 'opportunity' | 'spend';
export type CountryRevenuePeriod = 'current' | 'next' | 'all';

export interface IRevenueCountry {
  readonly id: string;
  readonly name: string;
  readonly atlasId: number;
  readonly region: string;
  readonly longitude: number;
  readonly latitude: number;
}

export const COUNTRY_REGIONS = ['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America'] as const;
export const COUNTRY_PERIODS = ['current', 'next', 'all'] as const;

export const REVENUE_COUNTRIES: readonly IRevenueCountry[] = [
  { id: 'US', name: 'United States', atlasId: 840, region: 'North America', longitude: -100, latitude: 39 },
  { id: 'CA', name: 'Canada', atlasId: 124, region: 'North America', longitude: -106, latitude: 57 },
  { id: 'GB', name: 'United Kingdom', atlasId: 826, region: 'EMEA', longitude: -2, latitude: 54 },
  { id: 'DE', name: 'Germany', atlasId: 276, region: 'EMEA', longitude: 10, latitude: 51 },
  { id: 'FR', name: 'France', atlasId: 250, region: 'EMEA', longitude: 2, latitude: 47 },
  { id: 'NL', name: 'Netherlands', atlasId: 528, region: 'EMEA', longitude: 5.3, latitude: 52.2 },
  { id: 'SE', name: 'Sweden', atlasId: 752, region: 'EMEA', longitude: 15, latitude: 62 },
  { id: 'ES', name: 'Spain', atlasId: 724, region: 'EMEA', longitude: -4, latitude: 40 },
  { id: 'IT', name: 'Italy', atlasId: 380, region: 'EMEA', longitude: 12.5, latitude: 43 },
  { id: 'NO', name: 'Norway', atlasId: 578, region: 'EMEA', longitude: 9, latitude: 62 },
  { id: 'AE', name: 'United Arab Emirates', atlasId: 784, region: 'EMEA', longitude: 54, latitude: 24 },
  { id: 'ZA', name: 'South Africa', atlasId: 710, region: 'EMEA', longitude: 25, latitude: -29 },
  { id: 'AU', name: 'Australia', atlasId: 36, region: 'Asia Pacific', longitude: 134, latitude: -25 },
  { id: 'JP', name: 'Japan', atlasId: 392, region: 'Asia Pacific', longitude: 138, latitude: 37 },
  { id: 'IN', name: 'India', atlasId: 356, region: 'Asia Pacific', longitude: 79, latitude: 23 },
  { id: 'CN', name: 'China', atlasId: 156, region: 'Asia Pacific', longitude: 105, latitude: 35 },
  { id: 'KR', name: 'South Korea', atlasId: 410, region: 'Asia Pacific', longitude: 128, latitude: 36 },
  { id: 'NZ', name: 'New Zealand', atlasId: 554, region: 'Asia Pacific', longitude: 173, latitude: -41 },
  { id: 'BR', name: 'Brazil', atlasId: 76, region: 'Latin America', longitude: -52, latitude: -12 },
  { id: 'MX', name: 'Mexico', atlasId: 484, region: 'Latin America', longitude: -102, latitude: 23 },
  { id: 'CL', name: 'Chile', atlasId: 152, region: 'Latin America', longitude: -71, latitude: -32 },
  { id: 'CO', name: 'Colombia', atlasId: 170, region: 'Latin America', longitude: -74, latitude: 4 },
  { id: 'AR', name: 'Argentina', atlasId: 32, region: 'Latin America', longitude: -65, latitude: -35 },
  { id: 'PE', name: 'Peru', atlasId: 604, region: 'Latin America', longitude: -75, latitude: -10 }
];

// Fictional headquarters assignments, independent of rollout locations or deal value.
export const DEMO_ACCOUNT_HEADQUARTERS: Readonly<Record<string, string>> = {
  CONTOSO: 'US', 'ACC-002': 'GB', 'ACC-003': 'JP', 'ACC-004': 'BR',
  'ACC-005': 'CA', 'ACC-006': 'FR', 'ACC-007': 'IN', 'ACC-008': 'MX',
  'ACC-009': 'US', 'ACC-010': 'NL', 'ACC-011': 'CN', 'ACC-012': 'CL',
  'ACC-013': 'CA', 'ACC-014': 'SE', 'ACC-015': 'KR', 'ACC-016': 'CO',
  'ACC-017': 'US', 'ACC-018': 'DE', 'ACC-019': 'AU', 'ACC-020': 'BR',
  'ACC-021': 'CA', 'ACC-022': 'ES', 'ACC-023': 'JP', 'ACC-024': 'AR',
  'ACC-025': 'US', 'ACC-026': 'IT', 'ACC-027': 'IN', 'ACC-028': 'PE',
  'ACC-029': 'CA', 'ACC-030': 'AE', 'ACC-031': 'NZ', 'ACC-032': 'MX',
  'ACC-033': 'US', 'ACC-034': 'GB', 'ACC-035': 'CN', 'ACC-036': 'CL',
  'ACC-037': 'CA', 'ACC-038': 'ZA', 'ACC-039': 'KR', 'ACC-040': 'CO',
  'ACC-041': 'US', 'ACC-042': 'NO', 'ACC-043': 'AU', 'ACC-044': 'AR',
  'ACC-045': 'CA', 'ACC-046': 'DE', 'ACC-047': 'NZ', 'ACC-048': 'PE',
  'ACC-049': 'US', 'ACC-050': 'FR', 'ACC-051': 'JP', 'ACC-052': 'BR',
  'ACC-053': 'CA', 'ACC-054': 'NL', 'ACC-055': 'IN', 'ACC-056': 'MX',
  'ACC-057': 'US', 'ACC-058': 'SE', 'ACC-059': 'CN', 'ACC-060': 'CL',
  'ACC-061': 'CA', 'ACC-062': 'ES', 'ACC-063': 'KR', 'ACC-064': 'CO',
  'ACC-065': 'US', 'ACC-066': 'IT', 'ACC-067': 'AU', 'ACC-068': 'AR',
  'ACC-069': 'CA', 'ACC-070': 'AE', 'ACC-071': 'NZ', 'ACC-072': 'PE',
  'ACC-073': 'US', 'ACC-074': 'ZA', 'ACC-075': 'JP', 'ACC-076': 'BR',
  'ACC-077': 'CA', 'ACC-078': 'NO', 'ACC-079': 'IN', 'ACC-080': 'MX'
};

export const COUNTRY_REVENUE_PROVENANCE = {
  dataset: 'Offline deterministic DEMO; not live SharePoint or CRM',
  opportunity: 'Sum of supplied demo opportunity values, attributed in full to fictional DEMO account headquarters. Not rollout revenue, closed revenue or a forecast.',
  headquarters: 'Explicit fictional account-to-ISO2 headquarters lookup; original domain account IDs and names retained.',
  spend: 'Separate fictional RECORDED DEMO expense ledger in USD. Not requested investment, future actual spend or ROI. Only current-quarter entries exist.',
  geography: 'Bundled Natural Earth / world-atlas 110m country boundaries, D3 projection; ISO2 joined to numeric atlas IDs. No network or tile requests. Boundaries are illustrative, not a territorial position.'
} as const;

export interface ICountryExpense {
  readonly id: string;
  readonly countryId: string;
  readonly category: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: 'USD';
  readonly period: 'current';
  readonly recordedWeek: number;
  readonly status: 'recorded-demo';
}

// Thousands of USD: field enablement, customer workshops, partner programs.
const expenseAmounts: readonly (readonly [string, number, number, number])[] = [
  ['US', 480, 350, 200], ['CA', 95, 85, 50],
  ['GB', 115, 90, 55], ['DE', 80, 95, 45], ['FR', 60, 70, 30],
  ['NL', 35, 45, 30], ['SE', 25, 25, 15], ['ES', 30, 25, 15],
  ['IT', 25, 35, 15], ['NO', 20, 15, 10], ['AE', 20, 25, 20], ['ZA', 15, 20, 15],
  ['AU', 75, 65, 40], ['JP', 60, 70, 30], ['IN', 45, 55, 40],
  ['CN', 30, 35, 20], ['KR', 20, 25, 15], ['NZ', 15, 12, 8],
  ['BR', 45, 50, 25], ['MX', 30, 40, 25], ['CL', 20, 20, 15],
  ['CO', 15, 15, 10], ['AR', 10, 12, 8], ['PE', 8, 7, 5]
];
const categories = [
  { name: 'Field enablement', description: 'Seller training and local field operations', week: 1 },
  { name: 'Customer workshops', description: 'Local demonstration and customer workshop delivery', week: 2 },
  { name: 'Partner programs', description: 'Partner onboarding and joint events', week: 3 }
] as const;

export const DEMO_COUNTRY_EXPENSES: readonly ICountryExpense[] = expenseAmounts.reduce<ICountryExpense[]>((expenses, [countryId, field, workshops, partners]) =>
  expenses.concat(categories.map<ICountryExpense>((category, index) => ({
    id: `EXP-${countryId}-${index + 1}`,
    countryId,
    category: category.name,
    description: category.description,
    amount: [field, workshops, partners][index] * 1000,
    currency: 'USD',
    period: 'current',
    recordedWeek: category.week,
    status: 'recorded-demo'
  }))), []
);

export interface ICountryRevenueTotal extends IRevenueCountry {
  readonly opportunityValue: number;
  readonly opportunityCount: number;
  readonly spend: number;
  readonly expenseCount: number;
}

export interface ICountryRevenueScope {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly period: string;
  readonly region: string;
  readonly countries: readonly ICountryRevenueTotal[];
  readonly opportunities: readonly IOpportunity[];
  readonly expenses: readonly ICountryExpense[];
  readonly opportunityValue: number;
  readonly recordedSpend: number;
  readonly suppliedOpportunityCount: number;
}

export function countryForAccount(accountId: string): IRevenueCountry | undefined {
  const account = ACCOUNTS.find(item => item.id === accountId);
  const country = REVENUE_COUNTRIES.find(item => item.id === DEMO_ACCOUNT_HEADQUARTERS[accountId]);
  return account && country?.region === account.region ? country : undefined;
}

export function countryRevenueScope(opportunities: readonly IOpportunity[], period: string, region: string): ICountryRevenueScope {
  const issues: string[] = [];
  if (!COUNTRY_PERIODS.some(item => item === period)) issues.push(`Unknown period "${period}". Choose Current quarter, Next quarter or All recorded periods.`);
  if (!COUNTRY_REGIONS.some(item => item === region)) issues.push(`Unknown region "${region}". Choose a listed region or All regions.`);
  const periodRecords = opportunities.filter(item => period === 'all' || item.quarterOffset === (period === 'current' ? 0 : period === 'next' ? 1 : NaN));
  const ids = new Set<string>();
  periodRecords.forEach(item => {
    if (!countryForAccount(item.accountId)) issues.push(`No DEMO headquarters assignment for account "${item.accountId}" on ${item.id}.`);
    if (!Number.isFinite(item.value) || item.value < 0) issues.push(`Invalid opportunity value on ${item.id}.`);
    if (ids.has(item.id)) issues.push(`Duplicate opportunity ID "${item.id}".`);
    ids.add(item.id);
  });
  const valid = issues.length === 0;
  const scopedCountries = valid ? REVENUE_COUNTRIES.filter(item => region === 'all' || item.region === region) : [];
  const records = valid ? periodRecords.filter(item => scopedCountries.some(country => country.id === countryForAccount(item.accountId)?.id)) : [];
  const expenses = valid && period !== 'next' ? DEMO_COUNTRY_EXPENSES.filter(item => scopedCountries.some(country => country.id === item.countryId)) : [];
  const countries = scopedCountries.map(country => {
    const countryRecords = records.filter(item => countryForAccount(item.accountId)?.id === country.id);
    const countryExpenses = expenses.filter(item => item.countryId === country.id);
    return {
      ...country,
      opportunityValue: countryRecords.reduce((sum, item) => sum + item.value, 0),
      opportunityCount: countryRecords.length,
      spend: countryExpenses.reduce((sum, item) => sum + item.amount, 0),
      expenseCount: countryExpenses.length
    };
  });
  return {
    valid, issues, period, region, countries, opportunities: records, expenses,
    opportunityValue: records.reduce((sum, item) => sum + item.value, 0),
    recordedSpend: expenses.reduce((sum, item) => sum + item.amount, 0),
    suppliedOpportunityCount: opportunities.length
  };
}

export const countryMoney = (value: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const countryShortMoney = (value: number): string => value >= 1000000 ? `$${(value / 1000000).toFixed(2)}M` : value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : countryMoney(value);
export const countryMetricValue = (country: ICountryRevenueTotal, metric: CountryRevenueMetric): number => metric === 'opportunity' ? country.opportunityValue : country.spend;

export function countryPage<T>(records: readonly T[], requestedPage: number): { readonly page: number; readonly pageCount: number; readonly records: readonly T[]; readonly originalCount: number } {
  const pageCount = Math.max(1, Math.ceil(records.length / 2));
  const page = Math.min(pageCount - 1, Math.max(0, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0));
  return { page, pageCount, records: records.slice(page * 2, page * 2 + 2), originalCount: records.length };
}
