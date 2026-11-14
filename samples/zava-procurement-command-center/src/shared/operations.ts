import { HERO_BIDS, REQUESTS, SUPPLIERS } from './domain';
import { INTENTS, type ProcurementIntentKey } from './catalog';
import { z } from 'zod';

export const supplierRecords = HERO_BIDS.map((bid, index) => ({
  ...bid,
  bidId: bid.id,
  id: SUPPLIERS[index].id,
  label: bid.supplier,
  region: SUPPLIERS[index].region
}));
export interface IPurchaseRecord {
  readonly id: string;
  readonly label: string;
  readonly requesterId: string;
  readonly category: string;
  readonly quantity: number;
  readonly currency: string;
  readonly budget: number;
  readonly region: string;
  readonly outcome?: string;
  readonly neededBy?: string;
  readonly locations?: string;
  readonly constraints?: string;
}
export interface IPurchaseDraft {
  readonly outcome: string;
  readonly quantity: number;
  readonly budget: number;
  readonly currency: string;
  readonly neededBy: string;
  readonly locations: string;
  readonly constraints: string;
  readonly category: string;
}
export const purchaseQueue: readonly IPurchaseRecord[] = REQUESTS.filter(request => request.currency === 'EUR').slice(0, 4).map(request => ({
  ...request, label: `${request.id} - ${request.category}`
}));
export const contracts = supplierRecords.slice(0, 3).map((supplier, index) => ({
  id: `ZPC-CON-${101 + index}`, label: `${supplier.supplier} contract`, supplierId: supplier.id,
  annualValue: supplier.price, noticeDays: 42 + index * 14, renewalIncrease: 4 + index
}));
export const purchaseOrders = purchaseQueue.slice(0, 3).map((request, index) => ({
  id: `ZPC-PO-${4108 + index}`, label: `ZPC-PO-${4108 + index}`, requestId: request.id,
  quantity: request.quantity, value: request.budget, neededBy: '2026-11-20'
}));
export const invoices = [
  { id: 'ZPC-8831', label: 'ZPC-8831 - Fabrikam freight', supplier: 'Fabrikam Devices', po: 1034000, received: 1034000, billed: 1049000, tolerance: 5000 },
  { id: 'ZPC-8832', label: 'ZPC-8832 - Contoso partial receipt', supplier: 'Contoso Mobility', po: 1098000, received: 1048000, billed: 1098000, tolerance: 5000 }
];
export const leakageOpportunities = [
  { id: 'ZPC-LEAK-01', label: 'Off-contract device spend', category: 'IT hardware', region: 'EMEA', identified: 146000, negotiated: 124000, contracted: 116000, realized: 99000, disputed: 15000 },
  { id: 'ZPC-LEAK-02', label: 'Duplicate logistics charges', category: 'Logistics', region: 'EMEA', identified: 88000, negotiated: 69000, contracted: 63000, realized: 54000, disputed: 0 },
  { id: 'ZPC-LEAK-03', label: 'Expired facilities rates', category: 'Facilities', region: 'AMER', identified: 52000, negotiated: 38000, contracted: 35000, realized: 33000, disputed: 0 }
];

export const buyingOptions = (quantity: number): readonly { route: string; cost: number; days: number; evidence: string }[] => [
  { route: 'Existing framework contract', cost: Math.round(quantity * HERO_BIDS[0].price / 600), days: 48, evidence: 'Qualified supplier; current contract' },
  { route: 'Reuse plus catalog', cost: Math.round(Math.min(quantity, 240) * 980 + Math.max(0, quantity - 240) * 1830), days: 21, evidence: '240 inspected reusable units; balance from catalog' },
  { route: 'Competitive sourcing event', cost: quantity * 1620, days: 70, evidence: 'Indicative price only; award requires separate review' }
];

export function demandCohort(category: string, region: string, currency: string): typeof REQUESTS {
  return REQUESTS.filter(request => request.category === category && request.currency === currency &&
    (region === 'All regions' || request.region === region));
}

export function diversification(maximumShare: number): readonly number[] {
  const first = Math.max(34, Math.min(80, maximumShare));
  const second = Math.ceil((100 - first) / 2);
  return [first, second, 100 - first - second];
}

export function validNumber(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function initialSelection(options: readonly { id: string; label: string }[], hint?: string): string {
  if (!hint) return options[0]?.id || '';
  return options.find(option => option.id.toLowerCase() === hint.trim().toLowerCase() ||
    option.label.toLowerCase() === hint.trim().toLowerCase())?.id || hint;
}

export interface IProcurementReceipt {
  readonly id: string;
  readonly intent: ProcurementIntentKey;
  readonly recordId: string;
  readonly action: string;
  readonly summary: string;
  readonly result: 'approved' | 'returned' | 'declined' | 'submitted' | 'recorded';
  readonly timestamp: string;
  readonly actor: string;
  readonly commitment?: number;
}

let receipts: readonly IProcurementReceipt[] = [];
let requests: readonly IPurchaseRecord[] = purchaseQueue;
let sessionNotice = '';
const storageKey = 'zavacore-procurement-session-v1';
const storedSessionSchema = z.object({
  version: z.literal(1),
  receipts: z.array(z.object({
    id: z.string(), intent: z.custom<ProcurementIntentKey>(value => INTENTS.some(intent => intent.key === value)),
    recordId: z.string(), action: z.string(), summary: z.string(),
    result: z.enum(['approved', 'returned', 'declined', 'submitted', 'recorded']),
    timestamp: z.string().datetime(), actor: z.string(), commitment: z.number().finite().nonnegative().optional()
  })).max(200),
  requests: z.array(z.object({
    id: z.string().regex(/^ZPC-REQ-SESSION-\d+$/), label: z.string(), requesterId: z.string(),
    outcome: z.string(), quantity: z.number().int().positive(), budget: z.number().positive(),
    currency: z.enum(['EUR', 'USD', 'GBP', 'JPY']), neededBy: z.string(),
    locations: z.string(), constraints: z.string(), category: z.string(), region: z.string()
  })).max(100)
});
const listeners = new Set<() => void>();
export const getReceipts = (): readonly IProcurementReceipt[] => receipts;
export const getPurchaseQueue = (): readonly IPurchaseRecord[] => requests;
export const getSessionNotice = (): string => sessionNotice;
export const subscribeReceipts = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
function persistSession(): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ version: 1, receipts, requests: requests.filter(request => request.id.indexOf('ZPC-REQ-SESSION-') === 0) }));
    sessionNotice = '';
  } catch (reason) {
    sessionNotice = 'Browser session storage is unavailable. Confirmed actions remain in memory until this page is closed or refreshed.';
    console.warn('ZavaCore procurement session persistence unavailable.', reason);
  }
}
export function restoreProcurementSession(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;
    const stored = storedSessionSchema.safeParse(JSON.parse(raw));
    if (!stored.success) throw new Error('Stored demo session does not match the current record contract.');
    const approvedAwards = stored.data.receipts.filter(receipt => receipt.intent === 'ReviewSupplierAward' && receipt.result === 'approved');
    if (approvedAwards.some(receipt => receipt.commitment === undefined)) throw new Error('Stored award lacks reviewed commitment evidence.');
    receipts = stored.data.receipts;
    requests = [...stored.data.requests, ...purchaseQueue];
    sessionNotice = '';
  } catch (reason) {
    sessionNotice = 'The saved demo session could not be restored. Current in-memory data is unchanged; use Reset demo session to clear the saved state.';
    console.warn('ZavaCore procurement session restoration failed.', reason);
  }
  listeners.forEach(listener => listener());
}
export function recordConfirmation(intent: ProcurementIntentKey, recordId: string, action: string, summary: string, actor = 'Demo reviewer', commitment?: number): IProcurementReceipt {
  const suffix = String(receipts.length + 1);
  const result: IProcurementReceipt['result'] = /^approve|^qualify|^accept|^renew/i.test(action) ? 'approved' :
    /^return|^request corrected/i.test(action) ? 'returned' : /^decline|^reject|^exit/i.test(action) ? 'declined' :
    /^create|^submit/i.test(action) ? 'submitted' : 'recorded';
  const receipt: IProcurementReceipt = { id: `ZPC-SESSION-${'0000'.slice(suffix.length)}${suffix}`, intent, recordId, action, summary, result, timestamp: new Date().toISOString(), actor, commitment };
  receipts = [...receipts, receipt];
  persistSession();
  listeners.forEach(listener => listener());
  return receipt;
}
export function submitPurchaseIntent(draft: IPurchaseDraft, actor = 'Demo requester'): IProcurementReceipt {
  if (draft.outcome.trim().length < 12 || !Number.isInteger(draft.quantity) || !validNumber(draft.quantity, 1, 100000) ||
    !validNumber(draft.budget, 1, 10000000) || !validDate(draft.neededBy) || !draft.locations.trim() ||
    ['EUR', 'USD', 'GBP', 'JPY'].indexOf(draft.currency) < 0 || !REQUESTS.some(request => request.category === draft.category)) {
    throw new Error('The purchase intent needs a valid outcome, quantity, budget, currency, category, date and location.');
  }
  const id = `ZPC-REQ-SESSION-${String(requests.length - purchaseQueue.length + 1)}`;
  requests = [{ ...draft, id, label: `${id} - ${draft.outcome}`, requesterId: actor, region: 'New intake' }, ...requests];
  return recordConfirmation('CreatePurchaseIntent', id, 'Create purchase intent',
    `Outcome: ${draft.outcome}; Quantity: ${draft.quantity}; Budget: ${draft.currency} ${draft.budget}; Needed by: ${draft.neededBy}; Locations: ${draft.locations}; Category: ${draft.category}; Constraints: ${draft.constraints}`, actor);
}
export function getPurchaseDecision(recordId: string): IProcurementReceipt | undefined {
  return [...receipts].reverse().find(receipt => receipt.intent === 'ReviewPurchaseRequest' && receipt.recordId === recordId);
}
export function resetProcurementSession(): void {
  receipts = [];
  requests = purchaseQueue;
  try {
    window.sessionStorage.removeItem(storageKey);
    sessionNotice = '';
  } catch (reason) {
    sessionNotice = 'In-memory demo data was reset, but browser session storage could not be cleared. Refresh may restore the previous saved session.';
    console.warn('ZavaCore procurement session reset could not clear storage.', reason);
  }
  listeners.forEach(listener => listener());
}
restoreProcurementSession();
