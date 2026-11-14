import { ACCOUNTS, OPPORTUNITIES } from './domain';
import { PORTFOLIO_REGIONS, investmentSignals, portfolioOpportunities, regionalInvestments } from './portfolio';

describe('coordinated global revenue and investment', () => {
  test('each current/next regional slice has diverse stages and stable exact values', () => {
    for (const period of ['current', 'next'] as const) {
      const all = portfolioOpportunities(period, 'all');
      expect(new Set(all.map(item => item.stage)).size).toBe(4);
      expect(new Set(all.map(item => ACCOUNTS.find(account => account.id === item.accountId)?.region)).size).toBe(4);
      const sliced = PORTFOLIO_REGIONS.map(region => portfolioOpportunities(period, region.region));
      expect(sliced.reduce((sum, items) => sum + items.length, 0)).toBe(all.length);
      expect(sliced.every(items => new Set(items.map(item => item.stage)).size === 4)).toBe(true);
    }
    expect(portfolioOpportunities('all', 'all')).toHaveLength(OPPORTUNITIES.length);
    expect(portfolioOpportunities('current', 'unknown')).toEqual([]);
  });
  test('quarter and measure changes materially change investment data and respect budgets', () => {
    expect(regionalInvestments('current')).not.toEqual(regionalInvestments('next'));
    for (const period of ['current', 'next', 'all'] as const) {
      const plans = regionalInvestments(period);
      expect(plans.every(plan => plan.deployed <= plan.budget && plan.deployed >= 0)).toBe(true);
      expect(investmentSignals(period).map(item => item.value)).toEqual(plans.map(plan => plan.deployed / 1000000));
    }
  });
});
