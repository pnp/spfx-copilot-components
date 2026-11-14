import { zavaSessionStore } from './ZavaSessionStore';

describe('Zava session vacation request store', () => {
  beforeEach(() => zavaSessionStore.reset());

  test('publishes a confirmed decision and updates the canonical queue', () => {
    let notifications = 0;
    const unsubscribe = zavaSessionStore.subscribe(() => { notifications += 1; });
    const receipt = zavaSessionStore.decide('vac-1042', 'approved', 'Megan Bowen');
    const request = zavaSessionStore.getSnapshot().find((candidate) => candidate.id === 'vac-1042');
    unsubscribe();

    expect(receipt.reference).toBe('ZAVA-LEAVE-1042');
    expect(request?.status).toBe('approved');
    expect(request?.history).toHaveLength(1);
    expect(notifications).toBe(1);
  });

  test('requires a rationale for decline and prevents duplicate decisions', () => {
    expect(() => zavaSessionStore.decide('vac-1043', 'declined', 'Megan Bowen')).toThrow('Add a reason');
    zavaSessionStore.decide('vac-1043', 'declined', 'Megan Bowen', 'Coverage is unavailable.');
    expect(() => zavaSessionStore.decide('vac-1043', 'approved', 'Megan Bowen')).toThrow('no longer awaiting');
  });

  test('restores the deterministic baseline', () => {
    zavaSessionStore.decide('vac-1044', 'approved', 'Megan Bowen');
    zavaSessionStore.reset();
    expect(zavaSessionStore.getSnapshot().find((candidate) => candidate.id === 'vac-1044')?.status).toBe('pending');
    expect(zavaSessionStore.getSnapshot().filter((candidate) => candidate.status === 'pending')).toHaveLength(4);
  });
});