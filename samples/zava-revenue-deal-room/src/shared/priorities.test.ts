import { personalRevenueBrief } from './priorities';
import { ACCOUNTS, OPPORTUNITIES } from './domain';
import { createDealStore, newDealDraft } from './dealWorkflow';
import { buildForecastBridge } from './visualizations/revenueGeometry';

describe('personal revenue brief demo data', () => {
  test('shows a named, stable owned book with exact current value and milestone status', () => {
    const brief = personalRevenueBrief('current', 'all', createDealStore().getSnapshot().requests);
    expect(brief.opportunities).toHaveLength(6);
    expect(brief.metrics.open).toBe(18537260);
    expect(brief.metrics.weighted).toBeCloseTo(11719827.2);
    expect(brief.closeStatus).toEqual([{ label: 'Complete', count: 1 }, { label: 'On track', count: 2 }, { label: 'At risk', count: 1 }, { label: 'Blocked', count: 1 }]);
    expect(brief.priorities[0]).toMatchObject({ opportunityId: 'ZDR-2042', target: 'MapBuyingCommittee' });
    expect(OPPORTUNITIES.find(item => item.id === 'ZDR-2072')?.name).toBe('AdventureWorks global field service');
    expect(ACCOUNTS[1].name).toBe('Global Account 02');
  });
  test('quarter and regional filters change the actual owned data, not just captions', () => {
    const requests = createDealStore().getSnapshot().requests;
    expect(personalRevenueBrief('next', 'all', requests).opportunities).toHaveLength(2);
    expect(personalRevenueBrief('current', 'EMEA', requests).metrics.open).toBe(2569000);
    const empty = personalRevenueBrief('invalid', 'unknown', requests);
    expect(empty.opportunities).toEqual([]);
    expect(empty.priorities).toEqual([]);
    expect(empty.metrics.open).toBe(0);
  });
  test('outlook movements reconcile open value to seller-weighted value without invented history', () => {
    const brief = personalRevenueBrief('current', 'all', []);
    const bars = buildForecastBridge(brief.outlook);
    expect((brief.outlook[0].value + brief.outlook.filter(item => item.kind === 'decrease').reduce((sum, item) => sum + item.value, 0)) * 1000000).toBeCloseTo(brief.metrics.weighted);
    expect(bars[bars.length - 1].endValue * 1000000).toBeCloseTo(brief.metrics.weighted);
  });
  test('confirmed request status changes the work overlay, not the catalog pipeline', () => {
    const store = createDealStore();
    const baseline = personalRevenueBrief('current', 'all', store.getSnapshot().requests);
    const request = store.submit({ ...newDealDraft(), discount: '8', securityReady: true, sponsorReady: true }, true);
    const pending = personalRevenueBrief('current', 'all', store.getSnapshot().requests);
    expect(pending.metrics.pendingRequests).toBe(baseline.metrics.pendingRequests + 1);
    store.decide(request.id, 'Sales manager', 'approved', 'Independent sample evidence reviewed.', true);
    const approved = personalRevenueBrief('current', 'all', store.getSnapshot().requests);
    expect(approved.metrics.approvedRequests).toBe(baseline.metrics.approvedRequests + 1);
    expect(approved.metrics.open).toBe(baseline.metrics.open);
    expect(approved.metrics.weighted).toBe(baseline.metrics.weighted);
  });
});
