import { leakageOpportunities, type IProcurementReceipt } from './operations';

export type InvestmentRegion = 'EMEA' | 'AMER' | 'APAC' | 'LATAM';
export const INVESTMENT_REGIONS: readonly InvestmentRegion[] = ['EMEA', 'AMER', 'APAC', 'LATAM'];
export interface IInvestment {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly region: InvestmentRegion;
  readonly coordinates: readonly [number, number];
  readonly budget: number;
  readonly committed: number;
  readonly units: number;
  readonly delivered: number;
  readonly risk: number;
  readonly valueIds: readonly string[];
  readonly stage: string;
  readonly schedule: readonly number[];
}
export const INVESTMENTS: readonly IInvestment[] = [
  { id: 'ZPC-INV-01', name: 'Rugged-device launch', location: 'Helsinki', region: 'EMEA', coordinates: [24.94, 60.17], budget: 1200000, committed: 0, units: 600, delivered: 0, risk: 44, valueIds: [], stage: 'Budget review', schedule: [0, 0, 0.1, 0.2, 0.35, 0.35] },
  { id: 'ZPC-INV-02', name: 'Factory mobility', location: 'Austin', region: 'AMER', coordinates: [-97.74, 30.27], budget: 1650000, committed: 1320000, units: 900, delivered: 720, risk: 28, valueIds: ['ZPC-LEAK-03'], stage: 'Deploying', schedule: [0.2, 0.25, 0.25, 0.1, 0.1, 0.1] },
  { id: 'ZPC-INV-03', name: 'Critical spares resilience', location: 'Singapore', region: 'APAC', coordinates: [103.82, 1.35], budget: 980000, committed: 810000, units: 450, delivered: 280, risk: 61, valueIds: [], stage: 'Deploying', schedule: [0.05, 0.1, 0.15, 0.3, 0.3, 0.1] },
  { id: 'ZPC-INV-04', name: 'Warehouse modernization', location: 'Sao Paulo', region: 'LATAM', coordinates: [-46.63, -23.55], budget: 720000, committed: 540000, units: 300, delivered: 180, risk: 39, valueIds: [], stage: 'Deploying', schedule: [0.05, 0.05, 0.1, 0.2, 0.3, 0.3] },
  { id: 'ZPC-INV-05', name: 'Device & logistics consolidation', location: 'Berlin', region: 'EMEA', coordinates: [13.4, 52.52], budget: 1260000, committed: 1046000, units: 440, delivered: 400, risk: 24, valueIds: ['ZPC-LEAK-01', 'ZPC-LEAK-02'], stage: 'Verifying value', schedule: [0.3, 0.2, 0.2, 0.15, 0.1, 0.05] },
  { id: 'ZPC-INV-06', name: 'Distribution connectivity', location: 'Toronto', region: 'AMER', coordinates: [-79.38, 43.65], budget: 640000, committed: 520000, units: 260, delivered: 220, risk: 32, valueIds: [], stage: 'Deploying', schedule: [0.1, 0.2, 0.3, 0.15, 0.15, 0.1] },
  { id: 'ZPC-INV-07', name: 'Service readiness', location: 'Tokyo', region: 'APAC', coordinates: [139.69, 35.68], budget: 540000, committed: 390000, units: 180, delivered: 110, risk: 35, valueIds: [], stage: 'Deploying', schedule: [0.05, 0.15, 0.15, 0.15, 0.2, 0.3] },
  { id: 'ZPC-INV-08', name: 'Energy operations kits', location: 'Mexico City', region: 'LATAM', coordinates: [-99.13, 19.43], budget: 810000, committed: 610000, units: 240, delivered: 140, risk: 48, valueIds: [], stage: 'Deploying', schedule: [0.1, 0.1, 0.1, 0.3, 0.3, 0.1] }
];
export function getInvestments(receipts: readonly IProcurementReceipt[]): readonly IInvestment[] {
  const award = [...receipts].reverse().find(receipt => receipt.intent === 'ReviewSupplierAward' && receipt.recordId === 'ZPC-RFP-31');
  const request = [...receipts].reverse().find(receipt => receipt.intent === 'ReviewPurchaseRequest' && receipt.recordId === 'ZPC-REQ-1001');
  const approvedCommitment = award?.result === 'approved' ? award.commitment : 0;
  if (approvedCommitment === undefined) throw new Error('The approved award is missing its reviewed commitment amount.');
  return INVESTMENTS.map(investment => investment.id !== 'ZPC-INV-01' ? investment : {
    ...investment,
    committed: approvedCommitment,
    stage: award ? (award.result === 'approved' ? 'Award approved / not delivered' : 'Award needs intervention') :
      request ? (request.result === 'approved' ? 'Budget approved / sourcing' : 'Budget needs intervention') : investment.stage
  });
}
export function investmentTotals(records: readonly IInvestment[]): { budget: number; committed: number; delivered: number; units: number; realized: number } {
  const valueIds = new Set(records.reduce<string[]>((ids, record) => [...ids, ...record.valueIds], []));
  return {
    budget: records.reduce((sum, record) => sum + record.budget, 0),
    committed: records.reduce((sum, record) => sum + record.committed, 0),
    delivered: records.reduce((sum, record) => sum + record.delivered, 0),
    units: records.reduce((sum, record) => sum + record.units, 0),
    realized: leakageOpportunities.filter(item => valueIds.has(item.id)).reduce((sum, item) => sum + item.realized, 0)
  };
}
export function investmentValueStages(records: readonly IInvestment[]): readonly { stage: string; value: number }[] {
  const valueIds = new Set(records.reduce<string[]>((ids, record) => [...ids, ...record.valueIds], []));
  const opportunities = leakageOpportunities.filter(item => valueIds.has(item.id));
  return (['identified', 'negotiated', 'contracted', 'realized'] as const).map(stage => ({
    stage: stage[0].toUpperCase() + stage.slice(1), value: opportunities.reduce((sum, item) => sum + item[stage], 0)
  }));
}
export function commitmentTrend(records: readonly IInvestment[]): readonly { week: string; planned: number; committed: number }[] {
  return Array.from({ length: 6 }, (_, index) => ({
    week: `W${index + 1}`,
    planned: Math.round(records.reduce((sum, record) => sum + record.budget * (index + 1) / 6, 0)),
    committed: Math.round(records.reduce((sum, record) => sum + record.committed * record.schedule.slice(0, index + 1).reduce((total, weight) => total + weight, 0), 0))
  }));
}
