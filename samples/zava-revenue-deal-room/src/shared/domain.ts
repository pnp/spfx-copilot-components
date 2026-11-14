export type EvidenceKind = 'verified' | 'judgment' | 'calculation' | 'inference' | 'stale' | 'contrary';

export interface IAccount { readonly id: string; readonly name: string; readonly region: string; readonly segment: string; }
export interface IContact { readonly id: string; readonly accountId: string; readonly name: string; readonly role: string; readonly stance: 'champion' | 'supporter' | 'neutral' | 'skeptic'; readonly influence: number; }
export interface IOpportunity { readonly id: string; readonly accountId: string; readonly name: string; readonly stage: string; readonly value: number; readonly probability: number; readonly quarterOffset: number; }
export interface IEvidence { readonly id: string; readonly opportunityId: string; readonly kind: EvidenceKind; readonly title: string; readonly detail: string; readonly source: string; readonly ageDays: number; }
export interface IMilestone { readonly id: string; readonly opportunityId: string; readonly title: string; readonly owner: string; readonly side: 'buyer' | 'seller'; readonly dueOffsetDays: number; readonly status: 'complete' | 'on-track' | 'at-risk' | 'blocked'; }
export interface ICommercialInput { readonly quantity: number; readonly termMonths: number; readonly discount: number; readonly services: number; readonly probability: number; readonly ramp?: readonly number[]; }
export interface ICommercialResult { readonly contractValue: number; readonly arr: number; readonly grossMargin: number; readonly weightedForecast: number; readonly authority: string; }

const regions = ['North America', 'EMEA', 'Asia Pacific', 'Latin America'];
const segments = ['Enterprise', 'Corporate', 'Growth'];
const padded = (value: number, width: number): string => (`000${value}`).slice(-width);
const showcaseAccounts: Readonly<Record<number, string>> = {
  16: 'Northwind Manufacturing', 17: 'Fabrikam', 18: 'Alpine Ski House', 19: 'Litware',
  30: 'AdventureWorks', 31: 'Wide World Importers', 32: 'Tailspin Toys', 33: 'Proseware'
};
const showcaseDeals: Readonly<Record<number, string>> = {
  16: 'Northwind connected manufacturing', 17: 'Fabrikam partner platform', 18: 'Alpine customer expansion',
  19: 'Litware enterprise renewal', 30: 'AdventureWorks global field service',
  32: 'Tailspin customer onboarding', 33: 'Proseware product adoption'
};

export const ACCOUNTS: readonly IAccount[] = Array.from({ length: 80 }, (_, index) => ({
  id: index === 0 ? 'CONTOSO' : `ACC-${padded(index + 1, 3)}`,
  name: index === 0 ? 'Contoso' : showcaseAccounts[index] || `Global Account ${padded(index + 1, 2)}`,
  region: regions[index % regions.length],
  segment: segments[index % segments.length]
}));

export const CONTACTS: readonly IContact[] = Array.from({ length: 260 }, (_, index) => ({
  id: `CON-${padded(index + 1, 3)}`,
  accountId: index < 6 ? 'CONTOSO' : ACCOUNTS[index % ACCOUNTS.length].id,
  name: index < 6 ? ['Nestor Wilke', 'Pradeep Gupta', 'Lee Gu', 'Patti Fernandez', 'Miriam Graham', 'Joni Sherman'][index] : `Customer Leader ${index + 1}`,
  role: index < 6 ? ['Champion', 'Technical evaluator', 'Economic buyer', 'Legal approver', 'Operations lead', 'Executive sponsor'][index] : ['Economic buyer', 'Champion', 'Technical evaluator', 'Legal approver', 'Operations lead'][index % 5],
  stance: (['champion', 'supporter', 'neutral', 'skeptic'] as const)[index % 4],
  influence: 55 + ((index * 7) % 46)
}));

export const OPPORTUNITIES: readonly IOpportunity[] = Array.from({ length: 120 }, (_, index) => ({
  id: index === 0 ? 'ZDR-2042' : `ZDR-${2042 + index}`,
  accountId: ACCOUNTS[index % ACCOUNTS.length].id,
  name: index === 0 ? 'Contoso Global Expansion' : showcaseDeals[index] || `${ACCOUNTS[index % ACCOUNTS.length].name} Growth Program`,
  stage: index === 0 ? 'Propose' : ['Qualify', 'Develop', 'Propose', 'Commit'][(Math.floor(index / 4) + index) % 4],
  value: index === 0 ? 3637260 : 240000 + ((index * 137000) % 4200000),
  probability: index === 0 ? 0.72 : 0.3 + ((index % 7) * 0.1),
  quarterOffset: index === 0 ? 0 : Math.floor(index / 16) % 6 - 1
}));

export const HERO_EVIDENCE: readonly IEvidence[] = [
  { id: 'EV-01', opportunityId: 'ZDR-2042', kind: 'verified', title: 'Global rollout confirmed', detail: 'Adele confirmed 18-country deployment scope in the steering meeting.', source: 'Meeting transcript', ageDays: 2 },
  { id: 'EV-02', opportunityId: 'ZDR-2042', kind: 'verified', title: 'Champion owns business case', detail: 'Nestor accepted ownership of the joint value review.', source: 'Customer email', ageDays: 4 },
  { id: 'EV-03', opportunityId: 'ZDR-2042', kind: 'contrary', title: 'Economic buyer access missing', detail: 'No direct interaction with the CFO sponsor is recorded.', source: 'Relationship history', ageDays: 18 },
  { id: 'EV-04', opportunityId: 'ZDR-2042', kind: 'stale', title: 'Launch date unconfirmed', detail: 'The September launch assumption predates the security workshop.', source: 'CRM opportunity', ageDays: 31 },
  { id: 'EV-05', opportunityId: 'ZDR-2042', kind: 'inference', title: 'Security may move the close', detail: 'Two unresolved controls sit on the critical path.', source: 'Deterministic rule', ageDays: 0 },
  { id: 'EV-06', opportunityId: 'ZDR-2042', kind: 'judgment', title: 'Seller sees strong momentum', detail: 'Megan believes the expanded scope offsets procurement delay.', source: 'Seller update', ageDays: 1 }
];

export const HERO_MILESTONES: readonly IMilestone[] = [
  { id: 'MS-01', opportunityId: 'ZDR-2042', title: 'Value case accepted', owner: 'Nestor Wilke', side: 'buyer', dueOffsetDays: -3, status: 'complete' },
  { id: 'MS-02', opportunityId: 'ZDR-2042', title: 'Security evidence complete', owner: 'Pradeep Gupta', side: 'seller', dueOffsetDays: 5, status: 'at-risk' },
  { id: 'MS-03', opportunityId: 'ZDR-2042', title: 'Economic sponsor review', owner: 'Lee Gu', side: 'buyer', dueOffsetDays: 9, status: 'blocked' },
  { id: 'MS-04', opportunityId: 'ZDR-2042', title: 'Commercial terms agreed', owner: 'Miriam Graham', side: 'seller', dueOffsetDays: 14, status: 'on-track' },
  { id: 'MS-05', opportunityId: 'ZDR-2042', title: 'Signature', owner: 'Megan Bowen', side: 'seller', dueOffsetDays: 21, status: 'on-track' }
];

export const calculateCommercialOffer = (input: ICommercialInput): ICommercialResult => {
  const annualList = input.quantity * 1450;
  const annualNet = annualList * (1 - input.discount / 100);
  let licensedYears = 0;
  for (let month = 0; month < input.termMonths; month += 12) {
    licensedYears += Math.min(12, input.termMonths - month) / 12 * (input.ramp?.[Math.floor(month / 12)] ?? 100) / 100;
  }
  const contractValue = annualNet * licensedYears + input.services;
  const deliveryCost = annualList * 0.22 * licensedYears + input.services * 0.62;
  const grossMargin = contractValue > 0 ? ((contractValue - deliveryCost) / contractValue) * 100 : 0;
  return {
    contractValue,
    arr: annualNet,
    grossMargin,
    weightedForecast: contractValue * input.probability,
    authority: input.discount > 18 || grossMargin < 68 ? 'Executive committee' : input.discount > 10 ? 'Commercial director' : 'Sales manager'
  };
};

export const HERO_OFFER: ICommercialResult = calculateCommercialOffer({ quantity: 860, termMonths: 36, discount: 14, services: 420000, probability: 0.72 });