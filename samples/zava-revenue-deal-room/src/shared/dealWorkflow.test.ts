import { APPROVAL_ROLES, SEEDED_REQUESTS, approvalRoute, createDealStore, dealDraftErrors, dealEconomics, newDealDraft, nextApproval } from './dealWorkflow';

describe('ZavaMesh demo deal workflow', () => {
  const ready = (): ReturnType<typeof newDealDraft> => ({ ...newDealDraft(), securityReady: true, sponsorReady: true });
  test('validates actual visible fields without coercing blanks or invalid economics', () => {
    expect(dealDraftErrors(newDealDraft())).toEqual([]);
    for (const quantity of ['', '-1', '1.5', 'NaN', 'Infinity', '100001'])
      expect(dealDraftErrors({ ...ready(), quantity }).length).toBeGreaterThan(0);
    expect(dealDraftErrors({ ...ready(), accountId: 'unknown' })).toContain('Choose a known account.');
    expect(dealDraftErrors({ ...ready(), investment: '0' }).length).toBeGreaterThan(0);
  });
  test('routes exact discount thresholds and low margin to independent authority', () => {
    expect(approvalRoute({ ...ready(), discount: '10', services: '0' })).toEqual(['Sales manager']);
    expect(approvalRoute({ ...ready(), discount: '10.01', services: '0' })).toEqual(['Sales manager', 'Commercial director']);
    expect(approvalRoute({ ...ready(), discount: '18', services: '0' })).toEqual(['Sales manager', 'Commercial director']);
    expect(approvalRoute({ ...ready(), discount: '18.01', services: '0' })).toEqual(APPROVAL_ROLES);
    const belowFloor = { ...ready(), discount: '0', services: '10000000' };
    expect(dealEconomics(belowFloor).grossMargin).toBeLessThan(68);
    expect(approvalRoute(belowFloor)).toContain('Executive committee');
  });
  test('submits copies only after confirmation and completes sequential approvals with immutable receipts', () => {
    const store = createDealStore();
    const draft = { ...ready() };
    const baseline = store.getSnapshot();
    expect(() => store.submit(draft, false)).toThrow('confirmation');
    const request = store.submit(draft, true);
    draft.title = 'Changed after submit';
    expect(request.draft.title).toBe('Contoso Global Expansion');
    expect(baseline.requests).toBe(SEEDED_REQUESTS);
    expect(nextApproval(request)).toBe('Sales manager');
    expect(() => store.decide(request.id, 'Commercial director', 'approved', 'Independent finance review complete.', true)).toThrow('assigned');
    expect(() => store.decide(request.id, 'Sales manager', 'approved', 'Short', true)).toThrow('15-1,000');
    expect(() => store.decide(request.id, 'Sales manager', 'approved', 'Evidence and scope reviewed.', false)).toThrow('confirmation');
    const manager = store.decide(request.id, 'Sales manager', 'approved', 'Evidence and scope reviewed.', true);
    expect(manager.status).toBe('pending');
    expect(nextApproval(manager)).toBe('Commercial director');
    const approved = store.decide(request.id, 'Commercial director', 'approved', 'Commercial economics and proof reviewed.', true);
    expect(approved.status).toBe('approved');
    expect(approved.events).toHaveLength(2);
    expect(approved.events[1].id).toBe(`${request.id}-A2`);
    expect(() => store.decide(request.id, 'Commercial director', 'approved', 'Cannot process twice.', true)).toThrow('already been processed');
  });
  test.each(['returned', 'rejected'] as const)('blocks approval on missing evidence but permits %s with rationale', decision => {
    const store = createDealStore();
    expect(() => store.decide('ZM-1002', 'Sales manager', 'approved', 'Missing evidence cannot be waived.', true)).toThrow('Approval is blocked');
    const result = store.decide('ZM-1002', 'Sales manager', decision, 'Please supply sponsor and security evidence.', true);
    expect(result.status).toBe(decision);
    expect(result.events[0].rationale).toBe('Please supply sponsor and security evidence.');
  });
  test('restores confirmed overlays, not drafts; subscriptions and reset stay coherent', () => {
    let saved: string | null = null;
    const storage = { getItem: (): string | null => saved, setItem: (_key: string, value: string): void => { saved = value; }, removeItem: (): void => { saved = null; } };
    const store = createDealStore(storage);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    expect(saved).toBeNull();
    store.submit(ready(), true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(createDealStore(storage).getSnapshot().requests).toHaveLength(3);
    store.reset();
    expect(createDealStore(storage).getSnapshot().requests).toHaveLength(2);
    unsubscribe();
    store.submit(ready(), true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
  test('storage denial and corrupt saved data are visible, not success-shaped fallbacks', () => {
    const denied = { getItem: (): null => null, setItem: (): never => { throw new Error('Denied'); }, removeItem: (): never => { throw new Error('Denied'); } };
    const store = createDealStore(denied);
    store.submit(ready(), true);
    expect(store.getSnapshot().requests).toHaveLength(3);
    expect(store.getSnapshot().storageWarning).toContain('unavailable');
    expect(createDealStore({ ...denied, getItem: () => '{bad json' }).getSnapshot().storageWarning).toContain('could not be restored');
  });
  test('separate component stores refresh confirmed submissions and decisions from shared session storage', () => {
    let saved: string | null = null;
    const storage = { getItem: (): string | null => saved, setItem: (_key: string, value: string): void => { saved = value; }, removeItem: (): void => { saved = null; } };
    const submission = createDealStore(storage);
    const approvals = createDealStore(storage);
    const listener = jest.fn();
    approvals.subscribe(listener);
    const request = submission.submit({ ...ready(), discount: '8' }, true);
    approvals.refresh();
    expect(approvals.getSnapshot().requests.find(item => item.id === request.id)).toEqual(request);
    approvals.decide(request.id, 'Sales manager', 'approved', 'Independent buyer evidence reviewed.', true);
    submission.refresh();
    expect(submission.getSnapshot().requests.find(item => item.id === request.id)?.status).toBe('approved');
    expect(listener).toHaveBeenCalledTimes(2);
    saved = '{invalid';
    approvals.refresh();
    expect(approvals.getSnapshot().storageWarning).toContain('could not be restored');
  });
});
