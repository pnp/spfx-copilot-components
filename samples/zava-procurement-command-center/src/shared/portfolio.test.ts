import { INVESTMENTS, INVESTMENT_REGIONS, commitmentTrend, getInvestments, investmentTotals, investmentValueStages } from './portfolio';
import { getPurchaseDecision, getPurchaseQueue, getReceipts, getSessionNotice, leakageOpportunities, recordConfirmation, resetProcurementSession, restoreProcurementSession, submitPurchaseIntent } from './operations';
import { splitAward } from './domain';
import { WORLD_LAND } from './worldLand';

const draft = {
  outcome: 'Equip the regional service team', quantity: 120, budget: 230000, currency: 'USD',
  neededBy: '2026-12-15', locations: 'Austin', constraints: 'Rugged devices and local support', category: 'IT hardware'
};
describe('connected procurement investments and session commands', () => {
  beforeEach(resetProcurementSession);
  test('reconciles regional budgets, delivery and verified value to the global ledger', () => {
    const global = investmentTotals(INVESTMENTS);
    expect(global).toEqual({ budget: 7800000, committed: 5236000, delivered: 2050, units: 3370, realized: 186000 });
    const regions = INVESTMENT_REGIONS.map(region => investmentTotals(INVESTMENTS.filter(item => item.region === region)));
    expect(regions.reduce((sum, item) => sum + item.budget, 0)).toBe(global.budget);
    expect(regions.reduce((sum, item) => sum + item.committed, 0)).toBe(global.committed);
    expect(regions.reduce((sum, item) => sum + item.realized, 0)).toBe(global.realized);
    const ids = INVESTMENTS.reduce<string[]>((all, investment) => [...all, ...investment.valueIds], []);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(leakageOpportunities.map(item => item.id).sort());
    expect(INVESTMENTS.every(item => item.valueIds.every(id => leakageOpportunities.some(value => value.id === id && value.region === item.region)))).toBe(true);
  });
  test('keeps weekly cumulative endpoints equal to the exact scoped commitments', () => {
    for (const region of INVESTMENT_REGIONS) {
      const records = INVESTMENTS.filter(item => item.region === region);
      const series = commitmentTrend(records);
      expect(series[5].committed).toBe(investmentTotals(records).committed);
      expect(series[5].planned).toBe(investmentTotals(records).budget);
      expect(series.every((point, index) => index === 0 || point.committed >= series[index - 1].committed)).toBe(true);
    }
    expect(INVESTMENTS.every(item => Math.abs(item.schedule.reduce((sum, weight) => sum + weight, 0) - 1) < 0.000001)).toBe(true);
  });
  test('uses real bundled land features and valid geographic operating sites', () => {
    expect(WORLD_LAND.type).toBe('FeatureCollection');
    expect(WORLD_LAND.features.length).toBeGreaterThan(100);
    expect(INVESTMENTS.every(item => item.coordinates[0] >= -180 && item.coordinates[0] <= 180 && item.coordinates[1] >= -90 && item.coordinates[1] <= 90)).toBe(true);
  });
  test('never treats investment or delivery as verified savings', () => {
    expect(investmentValueStages(INVESTMENTS).map(stage => stage.value)).toEqual([286000, 231000, 214000, 186000]);
    const apac = INVESTMENTS.filter(item => item.region === 'APAC');
    expect(investmentTotals(apac).committed).toBeGreaterThan(0);
    expect(investmentValueStages(apac).every(stage => stage.value === 0)).toBe(true);
  });
  test('creates one exact source request and supports a separate review decision', () => {
    const receipt = submitPurchaseIntent(draft, 'Demo requester');
    const record = getPurchaseQueue()[0];
    expect(record).toMatchObject({ ...draft, id: receipt.recordId, requesterId: 'Demo requester' });
    expect(getPurchaseDecision(record.id)).toBeUndefined();
    expect(getReceipts()).toHaveLength(1);
    recordConfirmation('ReviewPurchaseRequest', record.id, 'Return for evidence', 'Regional support attestation is missing.', 'Carole');
    expect(getPurchaseDecision(record.id)?.result).toBe('returned');
    expect(getPurchaseQueue()[0].budget).toBe(230000);
    expect(getPurchaseQueue()[0].currency).toBe('USD');
  });
  test('rejects invalid intake atomically without a receipt or new record', () => {
    const before = getPurchaseQueue();
    expect(() => submitPurchaseIntent({ ...draft, quantity: NaN })).toThrow('valid outcome');
    expect(getPurchaseQueue()).toBe(before);
    expect(getReceipts()).toHaveLength(0);
  });
  test('uses the reviewed allocation amount without implying delivery or new savings', () => {
    const amount = splitAward(60).cost;
    recordConfirmation('ReviewSupplierAward', 'ZPC-RFP-31', 'Approve split award', 'Reviewed 60/40 allocation', 'Carole', amount);
    const programs = getInvestments(getReceipts());
    expect(programs[0].committed).toBe(amount);
    expect(programs[0].delivered).toBe(0);
    expect(investmentTotals(programs).realized).toBe(186000);
    expect(investmentTotals(programs).committed).toBe(5236000 + amount);
  });
  test('does not turn a returned award into a financial commitment', () => {
    recordConfirmation('ReviewSupplierAward', 'ZPC-RFP-31', 'Return award for evidence', 'Need better continuity evidence', 'Carole', splitAward(65).cost);
    expect(getInvestments(getReceipts())[0].committed).toBe(0);
    expect(getInvestments(getReceipts())[0].stage).toBe('Award needs intervention');
  });
  test('restores confirmed records and receipts from browser session storage', () => {
    const receipt = submitPurchaseIntent(draft, 'Demo requester');
    const key = 'zavacore-procurement-session-v1';
    const saved = window.sessionStorage.getItem(key);
    expect(saved).toBeTruthy();
    resetProcurementSession();
    window.sessionStorage.setItem(key, saved!);
    restoreProcurementSession();
    expect(getPurchaseQueue()[0]).toMatchObject({ ...draft, id: receipt.recordId });
    expect(getReceipts()[0].id).toBe(receipt.id);
    resetProcurementSession();
    expect(window.sessionStorage.getItem(key)).toBeNull();
    expect(getPurchaseQueue()).toHaveLength(4);
  });
  test('announces denied storage while keeping confirmed in-memory actions usable', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    try {
      submitPurchaseIntent(draft);
      expect(getReceipts()).toHaveLength(1);
      expect(getPurchaseQueue()).toHaveLength(5);
      expect(getSessionNotice()).toContain('remain in memory');
      expect(warning).toHaveBeenCalled();
    } finally { storage.mockRestore(); warning.mockRestore(); }
  });
  test('announces invalid saved state and leaves the current data intact', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const before = getPurchaseQueue();
    window.sessionStorage.setItem('zavacore-procurement-session-v1', '{"version":0}');
    try {
      restoreProcurementSession();
      expect(getPurchaseQueue()).toBe(before);
      expect(getSessionNotice()).toContain('could not be restored');
    } finally { warning.mockRestore(); }
  });
});
