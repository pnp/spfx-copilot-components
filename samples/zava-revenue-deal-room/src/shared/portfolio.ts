import { ACCOUNTS, OPPORTUNITIES, type IOpportunity } from './domain';
import type { IRegionSignal } from './visualizations/revenueGeometry';

export type PortfolioPeriod = 'current' | 'next' | 'all';
export interface IRegionalInvestment {
  readonly id: string; readonly label: string; readonly region: string;
  readonly budget: number; readonly deployed: number; readonly longitude: number; readonly latitude: number;
}
const PLANS: readonly IRegionalInvestment[] = [
  { id: 'na', label: 'North America', region: 'North America', budget: 1800000, deployed: 1260000, longitude: -100, latitude: 42 },
  { id: 'emea', label: 'EMEA', region: 'EMEA', budget: 1600000, deployed: 1120000, longitude: 16, latitude: 49 },
  { id: 'apac', label: 'Asia Pacific', region: 'Asia Pacific', budget: 1200000, deployed: 660000, longitude: 116, latitude: 18 },
  { id: 'latam', label: 'Latin America', region: 'Latin America', budget: 800000, deployed: 360000, longitude: -60, latitude: -15 }
];
export const PORTFOLIO_REGIONS = PLANS.map(plan => ({ id: plan.id, label: plan.label, region: plan.region }));
export function portfolioOpportunities(period: PortfolioPeriod, region: string): readonly IOpportunity[] {
  return OPPORTUNITIES.filter(item => (period === 'all' || item.quarterOffset === (period === 'current' ? 0 : 1)) &&
    (region === 'all' || ACCOUNTS.find(account => account.id === item.accountId)?.region === region));
}
export function regionalInvestments(period: PortfolioPeriod, region = 'all'): readonly IRegionalInvestment[] {
  return PLANS.filter(plan => region === 'all' || plan.region === region).map(plan => ({
    ...plan,
    budget: Math.round(plan.budget * (period === 'all' ? 2.1 : period === 'next' ? 1.1 : 1)),
    deployed: Math.round(plan.deployed * (period === 'all' ? 1.25 : period === 'next' ? 0.25 : 1))
  }));
}
export function investmentSignals(period: PortfolioPeriod): readonly IRegionSignal[] {
  return regionalInvestments(period).map(plan => ({
    ...plan, value: plan.deployed / 1000000, risk: Math.round(plan.deployed / plan.budget * 100)
  }));
}

export const MAP_MAXIMUM_MILLIONS = {
  pipeline: Math.max(...PLANS.map(plan => portfolioOpportunities('all', plan.region).reduce((sum, item) => sum + item.value, 0) / 1000000)),
  investment: Math.max(...investmentSignals('all').map(signal => signal.value))
} as const;
