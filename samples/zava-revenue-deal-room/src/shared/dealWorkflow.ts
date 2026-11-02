import { z } from 'zod';
import { ACCOUNTS, calculateCommercialOffer } from './domain';

export const APPROVAL_ROLES = ['Sales manager', 'Commercial director', 'Executive committee'] as const;
export type ApprovalRole = typeof APPROVAL_ROLES[number];
export const REVIEWERS: Readonly<Record<ApprovalRole, string>> = {
  'Sales manager': 'Pradeep Gupta', 'Commercial director': 'Miriam Graham', 'Executive committee': 'Joni Sherman'
};
const draftSchema = z.object({
  accountId: z.string(), title: z.string(), outcome: z.string(), owner: z.string(),
  quantity: z.string(), termMonths: z.string(), discount: z.string(), services: z.string(),
  probability: z.string(), investment: z.string(), securityReady: z.boolean(), sponsorReady: z.boolean()
});
export type DealDraft = Readonly<z.infer<typeof draftSchema>>;
const eventSchema = z.object({
  id: z.string(), actor: z.string(), role: z.enum(APPROVAL_ROLES), decision: z.enum(['approved', 'returned', 'rejected']),
  rationale: z.string(), timestamp: z.string()
});
export type DealEvent = Readonly<z.infer<typeof eventSchema>>;
const requestSchema = z.object({
  id: z.string(), draft: draftSchema, submittedAt: z.string(),
  status: z.enum(['pending', 'approved', 'returned', 'rejected']), events: z.array(eventSchema)
});
export type DealRequest = Readonly<Omit<z.infer<typeof requestSchema>, 'draft' | 'events'> & {
  readonly draft: DealDraft; readonly events: readonly DealEvent[];
}>;
export interface IDealSnapshot { readonly requests: readonly DealRequest[]; readonly storageWarning: string; }
export const newDealDraft = (): DealDraft => ({
  accountId: 'CONTOSO', title: 'Contoso Global Expansion', outcome: 'Enable an evidence-backed rollout across 18 countries.',
  owner: 'Megan Bowen', quantity: '860', termMonths: '36', discount: '14', services: '420000',
  probability: '0.72', investment: '240000', securityReady: false, sponsorReady: false
});
export const dealEconomics = (draft: DealDraft): ReturnType<typeof calculateCommercialOffer> => calculateCommercialOffer({
  quantity: Number(draft.quantity), termMonths: Number(draft.termMonths), discount: Number(draft.discount),
  services: Number(draft.services), probability: Number(draft.probability)
});
export function dealDraftErrors(draft: DealDraft): readonly string[] {
  const errors: string[] = [];
  if (!ACCOUNTS.some(account => account.id === draft.accountId)) errors.push('Choose a known account.');
  if (draft.title.trim().length < 5 || draft.title.length > 120) errors.push('Deal name must contain 5-120 characters.');
  if (draft.outcome.trim().length < 20 || draft.outcome.length > 1000) errors.push('Business outcome must contain 20-1,000 characters.');
  if (draft.owner !== 'Megan Bowen') errors.push('The request owner must be Megan Bowen.');
  const bounds: readonly [keyof DealDraft, string, number, number, boolean][] = [
    ['quantity', 'Licensed users', 1, 100000, true], ['termMonths', 'Contract months', 1, 120, true],
    ['discount', 'Discount', 0, 100, false], ['services', 'Services', 0, 100000000, false],
    ['probability', 'Probability', 0, 1, false], ['investment', 'Investment', 1, 100000000, false]
  ];
  bounds.forEach(([key, label, minimum, maximum, integer]) => {
    const raw = draft[key];
    const value = Number(raw);
    if (typeof raw !== 'string' || !raw.trim() || !Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value)))
      errors.push(`${label} must be ${minimum}-${maximum}${integer ? ' (whole number)' : ''}.`);
  });
  return errors;
}
export function approvalRoute(draft: DealDraft): readonly ApprovalRole[] {
  const economics = dealEconomics(draft);
  return APPROVAL_ROLES.filter(role => role === 'Sales manager' ||
    role === 'Commercial director' && Number(draft.discount) > 10 ||
    role === 'Executive committee' && (Number(draft.discount) > 18 || economics.grossMargin < 68));
}
export function nextApproval(request: DealRequest): ApprovalRole | undefined {
  if (request.status !== 'pending') return undefined;
  return approvalRoute(request.draft).find(role => !request.events.some(event => event.role === role && event.decision === 'approved'));
}
export function decisionErrors(request: DealRequest, role: ApprovalRole, decision: DealEvent['decision'], rationale: string): readonly string[] {
  const errors = [...dealDraftErrors(request.draft)];
  if (request.status !== 'pending') errors.push('This request has already been processed.');
  if (nextApproval(request) !== role) errors.push(`Only the assigned ${nextApproval(request) || 'reviewer'} can decide this stage.`);
  if (REVIEWERS[role] === request.draft.owner) errors.push('A submitter cannot approve their own request.');
  if (rationale.trim().length < 15 || rationale.length > 1000) errors.push('Decision rationale must contain 15-1,000 characters.');
  if (decision === 'approved' && (!request.draft.securityReady || !request.draft.sponsorReady))
    errors.push('Approval is blocked until both security and sponsor evidence are attested. Return or reject remains available.');
  return errors;
}
const seedTime = 'Recorded baseline';
export const SEEDED_REQUESTS: readonly DealRequest[] = [
  { id: 'ZM-1001', draft: { ...newDealDraft(), accountId: 'ACC-002', title: 'EMEA partner enablement', outcome: 'Activate a regional partner program with validated sponsor and security evidence.', quantity: '500', discount: '12', services: '180000', investment: '120000', securityReady: true, sponsorReady: true },
    submittedAt: seedTime, status: 'pending', events: [{ id: 'ZM-1001-A1', actor: 'Pradeep Gupta', role: 'Sales manager', decision: 'approved', rationale: 'Evidence and account scope reviewed.', timestamp: seedTime }] },
  { id: 'ZM-1002', draft: { ...newDealDraft(), discount: '24' }, submittedAt: seedTime, status: 'pending', events: [] }
];
const STORAGE_KEY = 'zavamesh-deal-requests-v1';
type DealStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createDealStore(storage?: DealStorage, initialWarning = ''): {
  getSnapshot: () => IDealSnapshot;
  subscribe: (listener: () => void) => () => void;
  submit: (draft: DealDraft, confirmed: boolean) => DealRequest;
  decide: (id: string, role: ApprovalRole, decision: DealEvent['decision'], rationale: string, confirmed: boolean) => DealRequest;
  reset: () => void;
  refresh: () => void;
} {
  let snapshot: IDealSnapshot = { requests: SEEDED_REQUESTS, storageWarning: initialWarning };
  const listeners = new Set<() => void>();
  function restore(): void {
    if (!storage) return;
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        const requests = z.array(requestSchema).parse(JSON.parse(saved));
        if (requests.length < SEEDED_REQUESTS.length || new Set(requests.map(request => request.id)).size !== requests.length ||
          requests.some(request => dealDraftErrors(request.draft).length || !/^ZM-\d+$/.test(request.id))) throw new Error('Invalid saved request catalog');
        snapshot = { requests, storageWarning: '' };
      } else snapshot = { requests: SEEDED_REQUESTS, storageWarning: '' };
    } catch {
      snapshot = { requests: SEEDED_REQUESTS, storageWarning: 'Saved session data could not be restored. The initial requests are shown; Reset session data clears the invalid overlay.' };
    }
  }
  restore();
  function commit(requests: readonly DealRequest[]): void {
    let storageWarning = snapshot.storageWarning;
    if (storage) {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(requests)); storageWarning = ''; }
      catch { storageWarning = 'Browser storage is unavailable. Confirmed session actions remain in memory until this page closes.'; }
    }
    snapshot = { requests, storageWarning };
    listeners.forEach(listener => listener());
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    submit: (draft, confirmed) => {
      const errors = dealDraftErrors(draft);
      if (!confirmed || errors.length) throw new Error(errors.join(' ') || 'Explicit submission confirmation is required.');
      const number = Math.max(1000, ...snapshot.requests.map(request => Number(request.id.slice(3)))) + 1;
      const request: DealRequest = { id: `ZM-${number}`, draft: { ...draft }, submittedAt: new Date().toISOString(), status: 'pending', events: [] };
      commit([...snapshot.requests, request]);
      return request;
    },
    decide: (id, role, decision, rationale, confirmed) => {
      const request = snapshot.requests.find(item => item.id === id);
      if (!request) throw new Error('The selected request no longer exists.');
      const errors = decisionErrors(request, role, decision, rationale);
      if (!confirmed || errors.length) throw new Error(errors.join(' ') || 'Explicit decision confirmation is required.');
      const event: DealEvent = { id: `${id}-A${request.events.length + 1}`, actor: REVIEWERS[role], role, decision, rationale: rationale.trim(), timestamp: new Date().toISOString() };
      const events = [...request.events, event];
      const outstanding = approvalRoute(request.draft).some(stage => !events.some(item => item.role === stage && item.decision === 'approved'));
      const updated: DealRequest = { ...request, events, status: decision === 'approved' ? outstanding ? 'pending' : 'approved' : decision };
      commit(snapshot.requests.map(item => item.id === id ? updated : item));
      return updated;
    },
    reset: () => {
      commit(SEEDED_REQUESTS);
    },
    refresh: () => {
      restore();
      listeners.forEach(listener => listener());
    }
  };
}
export type DealStore = ReturnType<typeof createDealStore>;
let sharedStore: DealStore | undefined;
export function getDealStore(): DealStore {
  if (!sharedStore) {
    try {
      const storage = window.sessionStorage;
      sharedStore = createDealStore(storage);
      window.addEventListener('storage', event => {
        if (event.storageArea === storage && (event.key === STORAGE_KEY || event.key === null)) sharedStore?.refresh();
      });
    }
    catch { sharedStore = createDealStore(undefined, 'Browser storage is unavailable. Confirmed session actions remain in memory until this page closes.'); }
  }
  return sharedStore;
}
