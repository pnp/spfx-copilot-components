import type { SurfaceProps } from '../types';
import { rehearsalLead } from './session';

type Session = SurfaceProps['session'];
export const technologySchemaVersion = 1;
const day = 86400000;
const week = 7 * day;
const shifted = (instant: Date, days: number): string => new Date(instant.getTime() + days * day).toISOString();
export function techDate(instant: string): string {
  return new Date(instant).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
export function techTime(instant: string): string {
  return new Date(instant).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}
type Failure = 'invalid' | 'denied' | 'unavailable' | 'stale' | 'self' | 'decided' | 'duplicate';
export class TechError extends Error {
  public constructor(public readonly code: Failure, message: string) { super(message); this.name = 'TechError'; }
}
function fail(code: Failure, message: string): never { throw new TechError(code, message); }
export function techMessage(error: unknown): string { return error instanceof Error ? error.message : 'The operation could not be completed.'; }
function reference(prefix: string): string {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return prefix + '-' + Array.from(words, b => ('000000' + (b % 1000000)).slice(-6)).join('');
}
function text(value: string, label: string, min = 5, max = 800): string {
  const normal = value.trim();
  if (normal.length < min || normal.length > max) fail('invalid', `${label} must contain ${min}–${max} characters.`);
  if (/\b(password|passcode|secret|token|api[-_ ]?key)\s*(?:[:=]|\bis\b)\s*\S|BEGIN (?:RSA |EC )?PRIVATE KEY|\bBearer\s+\S+/i.test(normal))
    fail('invalid', `Remove credentials from ${label.toLowerCase()} before continuing.`);
  return normal;
}
function allowed(value: string, choices: readonly string[], label: string): string {
  if (choices.indexOf(value) === -1) fail('invalid', `Choose a listed ${label}.`);
  return value;
}
export const categories = ['Hardware', 'Network', 'Software'];
export const impacts = ['One device', 'Work blocked', 'Team affected'];
export const guides = [
  { id: 'display-link', title: 'Reconnect a second screen', issue: 'display monitor flicker second screen', type: 'Laptop', category: 'Hardware', version: '2.1', reviewedDays: -12, steps: ['Connect the display directly to the powered dock and select its USB-C input.', 'Open Display settings, choose Detect, then Extend these displays.', 'Try another cable from your desk kit. If the screen still flickers, link this guide to a ticket.'] },
  { id: 'wifi-rejoin', title: 'Reconnect to workplace Wi-Fi', issue: 'network wi-fi wifi connectivity reconnect', type: 'Laptop', category: 'Network', version: '3.0', reviewedDays: -8, steps: ['Check the service notice for your office before changing device settings.', 'Turn Wi-Fi off and on and select the managed workplace network.', 'If the managed network still fails, record the office and time, not credentials.'] },
  { id: 'headset-output', title: 'Choose the right audio output', issue: 'audio speaker microphone headset sound', type: 'Headset', category: 'Hardware', version: '1.4', reviewedDays: -19, steps: ['Connect the headset and open sound settings.', 'Select the headset for both input and output and play the test sound.', 'Check the meeting app uses the same devices.'] }
] as const;
export type Guide = (typeof guides)[number];
export interface Device { id: string; type: string; name: string; alias: string; posture: string; checkIn: string; refresh: string; }
export interface Post { author: string; body: string; at: string; }
export interface Ticket {
  id: string; owner: string; title: string; category: string; deviceId: string; guideId: string; impact: string;
  status: 'Open' | 'Resolved'; queue: string; next: string; updated: string; revision: number; thread: readonly Post[];
}
export interface Order {
  id: string; owner: string; requester: string; assignee: string; itemId: string; rationale: string;
  cost: number; policy: string; submitted: string; revision: number; status: 'Pending' | 'Approved' | 'Changes requested';
  note?: string;
}
export const catalog = [
  { id: 'studio-display', title: '27-inch studio display', category: 'Displays', price: 325, lead: 5, policy: 'One external display per permanent workstation.', detail: 'Height-adjustable QHD screen for a fixed desk.' },
  { id: 'usb-c-dock', title: 'USB-C desk dock', category: 'Docks', price: 148, lead: 3, policy: 'One standard dock per assigned laptop.', detail: 'Power, Ethernet and two displays from one cable.' },
  { id: 'quiet-headset', title: 'Focus headset', category: 'Audio', price: 88, lead: 2, policy: 'Standard headset; replace at end of service life.', detail: 'Wired noise-reducing headset for shared workspaces.' }
] as const;
export function catalogItem(id: string): (typeof catalog)[number] {
  return catalog.find(item => item.id === id) || fail('unavailable', 'This catalog item is unavailable.');
}
interface Store {
  primary: string; tickets: Ticket[]; orders: Order[]; devices: Device[];
  preferences: Map<string, boolean>; access: AccessReceipt[];
}
const storeKey = 'employeeHub.tech.v1';
interface Signals { version: number; listeners: Set<() => void>; }
function signals(s: Session, actorId: string): Signals {
  const key = `${storeKey}.changes:${actorId}`;
  let state = s.memory.get(key) as Signals | undefined;
  if (!state) { state = { version: 0, listeners: new Set() }; s.memory.set(key, state); }
  return state;
}
export function techVersion(s: Session): number { return signals(s, s.actor.id).version; }
export function observeTech(s: Session, update: () => void): () => void {
  const state = signals(s, s.actor.id);
  state.listeners.add(update);
  return () => { state.listeners.delete(update); };
}
function changed(s: Session, related?: string): void {
  const ids = related && related !== s.actor.id ? [s.actor.id, related] : [s.actor.id];
  ids.forEach(id => { const state = signals(s, id); state.version++; state.listeners.forEach(fn => fn()); });
}
function creationTime(end: number, age: number, slot: number): number {
  return end - (age + 1) * week + (slot % 4) * day + (8 + slot % 6) * day / 24;
}
function seedOrders(s: Session): Order[] {
  const lead = rehearsalLead.id; const end = cut(s.now);
  const fixture = (id: string, owner: string, requester: string, assignee: string, itemId: string, rationale: string, submitted: string): Order => {
    const item = catalogItem(itemId);
    return { id, owner, requester, assignee, itemId, rationale, cost: item.price, policy: item.policy, submitted, revision: 1, status: 'Pending' };
  };
  return [
    fixture('EQ-4102', 'employee-robin', 'Robin Lake', lead, 'studio-display', 'A larger screen will support accessible design reviews at my assigned desk.', new Date(creationTime(end, 1, 4)).toISOString()),
    fixture('EQ-4107', 'employee-devon', 'Devon Hale', lead, 'usb-c-dock', 'My new workstation needs a standard dock for its two shared displays.', new Date(creationTime(end, 2, 3)).toISOString()),
    fixture('EQ-4098', lead, rehearsalLead.displayName, lead, 'quiet-headset', 'Replace my retired desk headset.', shifted(s.now, -4)),
    fixture('EQ-4110', 'employee-fern', 'Fern Wells', 'alternate-equipment-lead', 'studio-display', 'Equip a new permanent workstation.', shifted(s.now, -1))
  ];
}
function store(s: Session): Store {
  if (!s.actor.id) fail('denied', 'An identified employee is required for this view.');
  let data = s.memory.get(storeKey) as Store | undefined;
  if (!data) {
    const updated = shifted(s.now, -1);
    data = {
      primary: s.actor.id, preferences: new Map(), access: [], orders: seedOrders(s),
      devices: [
        { id: 'work-laptop', type: 'Laptop', name: 'Studio laptop 14', alias: 'Primary work device', posture: 'Update ready', checkIn: shifted(s.now, -0.02), refresh: shifted(s.now, 98) },
        { id: 'work-headset', type: 'Headset', name: 'Focus headset', alias: 'Desk audio', posture: 'Up to date', checkIn: shifted(s.now, -0.4), refresh: shifted(s.now, 203) }
      ],
      tickets: [{ id: 'IT-2048', owner: s.actor.id, title: 'Display flickers after waking', deviceId: 'work-laptop', category: 'Hardware', guideId: '', impact: 'One device', status: 'Open', queue: 'Workplace', next: 'Mina · Workplace', updated, revision: 1, thread: [
        { author: 'You', body: 'The second screen briefly goes dark after the laptop wakes.', at: shifted(s.now, -2) },
        { author: 'Mina · Workplace', body: 'I am checking the dock firmware against the supported display profile.', at: updated }
      ] }]
    };
    s.memory.set(storeKey, data);
  }
  return data;
}
export function canReview(s: Session): boolean { return !!s.actor.id && s.actor.reviewer === true; }
function manager(s: Session): Store {
  if (!canReview(s)) fail('denied', 'Access denied. This view requires a service reviewer assignment.');
  return store(s);
}
export function devices(s: Session): readonly Device[] { const data = store(s); return data.primary === s.actor.id ? data.devices.slice() : []; }
export function myTickets(s: Session): Ticket[] { return store(s).tickets.filter(t => t.owner === s.actor.id).slice().reverse(); }
export function ticket(s: Session, id: string): Ticket {
  return myTickets(s).find(t => t.id === id) || fail('unavailable', 'This ticket is unavailable in this session. No other conversation was opened.');
}
export function guide(id: string): Guide { return guides.find(g => g.id === id) || fail('unavailable', 'This guide is unavailable.'); }
export function assignedDevice(s: Session, id: string): Device {
  return devices(s).find(d => d.id === id) || fail('unavailable', 'This device is unavailable in your assignment.');
}
export function eligibleOrders(s: Session): Order[] { return manager(s).orders.filter(o => o.assignee === s.actor.id && o.owner !== s.actor.id && o.status === 'Pending'); }
export function reviewOrder(s: Session, id: string): Order {
  const o = manager(s).orders.find(row => row.id === id);
  if (!o) return fail('unavailable', 'This request is unavailable in this session.');
  if (o.owner === s.actor.id) fail('self', 'Self-review is not allowed. An independent reviewer is required.');
  if (o.assignee !== s.actor.id) fail('denied', 'Access denied. This request is not assigned to you.');
  if (o.status !== 'Pending') fail('decided', 'This request has already been decided. It is no longer in your queue.');
  return o;
}
export interface TicketDraft { deviceId: string; guideId: string; category: string; impact: string; description: string; }
export type Confirm<T> = (session: Session) => T;
function scopeGuard(s: Session): (current: Session) => void {
  const memory = s.memory; const id = s.actor.id;
  return current => { if (!id || id !== current.actor.id || memory !== current.memory) fail('denied', 'This review belongs to a different employee or session.'); };
}
function validateTicket(s: Session, d: TicketDraft): void {
  const device = d.deviceId ? assignedDevice(s, d.deviceId) : undefined;
  const linked = d.guideId ? guide(d.guideId) : undefined;
  if (device && linked && device.type !== linked.type) fail('invalid', 'The linked guide is for a different device type. Change the guide or the device.');
  allowed(d.category, categories, 'category'); allowed(d.impact, impacts, 'impact');
  text(d.description, 'Description', 12);
}
export function prepareTicket(s: Session, draft: TicketDraft): Confirm<Ticket> {
  validateTicket(s, draft);
  const d = { ...draft, description: draft.description.trim() };
  const check = scopeGuard(s); const id = reference('IT');
  return current => {
    check(current); validateTicket(current, d);
    const data = store(current);
    const prior = data.tickets.find(t => t.id === id && t.owner === current.actor.id);
    if (prior) return prior;
    const queue = d.category === 'Network' ? 'Connectivity' : d.category === 'Software' ? 'Applications' : 'Workplace';
    const at = current.now.toISOString();
    const row: Ticket = { id, owner: current.actor.id, title: `${d.category} support request`, category: d.category, deviceId: d.deviceId, guideId: d.guideId, impact: d.impact, status: 'Open', queue, next: `${queue} triage`, updated: at, revision: 1, thread: [{ author: 'You', body: d.description, at }] };
    data.tickets.push(row); changed(current); return row;
  };
}
export type Decision = 'Approve' | 'Request changes';
export function prepareDecision(s: Session, id: string, revision: number, decision: Decision, note: string): Confirm<Order> {
  const validate = (current: Session): Order => {
    const o = reviewOrder(current, id);
    if (o.revision !== revision) fail('stale', 'The request has changed. Refresh its evidence before reviewing again.');
    allowed(decision, ['Approve', 'Request changes'], 'decision'); text(note, 'Decision note', 5, 400);
    return o;
  };
  validate(s); const check = scopeGuard(s);
  return current => {
    check(current); const o = validate(current);
    const next: Order = { ...o, revision: o.revision + 1, status: decision === 'Approve' ? 'Approved' : 'Changes requested', note: note.trim() };
    const data = manager(current); data.orders[data.orders.indexOf(o)] = next; changed(current, o.owner); return next;
  };
}
export interface AccessReceipt { id: string; owner: string; resource: string; level: string; expires: string; route: string; }

export function decisionList(s: Session, status: string): Order[] {
  allowed(status, ['Pending', 'Approved', 'Changes requested'], 'request status');
  return manager(s).orders.filter(o => o.assignee === s.actor.id && o.owner !== s.actor.id && o.status === status);
}
export function updateConversation(s: Session, id: string, rev: number, action: 'Reply' | 'Resolve' | 'Reopen', body = ''): Ticket {
  const row = ticket(s, id);
  if (row.revision !== rev) fail('stale', 'The conversation has changed. Read the latest message before trying again.');
  allowed(action, ['Reply', 'Resolve', 'Reopen'], 'conversation action');
  if ((action === 'Reopen') !== (row.status === 'Resolved')) fail('invalid', 'This action is not available in the current ticket state.');
  const at = s.now.toISOString();
  const message = action === 'Reply' ? text(body, 'Reply', 3) : action === 'Resolve' ? 'Marked resolved by the requester.' : 'Reopened by the requester.';
  const next: Ticket = { ...row, status: action === 'Resolve' ? 'Resolved' : 'Open', next: action === 'Resolve' ? 'No action needed' : `${row.queue} triage`, updated: at, revision: row.revision + 1, thread: row.thread.concat({ author: 'You', body: message, at }) };
  const data = store(s); data.tickets[data.tickets.indexOf(row)] = next; changed(s); return next;
}
export const services = [
  { id: 'guest-wifi', office: 'redmond', label: 'Guest Wi-Fi', site: 'Redmond', owner: 'Workplace connectivity', incident: 'INC-314', state: 'Investigating', scope: 'Guest access points in the west meeting wing. Managed employee Wi-Fi is unaffected.', minutes: -85, latest: -18, next: 42, event: 'Intermittent connection failures reported.', update: 'Connectivity desk isolated the affected access points.' },
  { id: 'guest-wifi', office: 'london', label: 'Guest Wi-Fi', site: 'London', owner: 'Workplace connectivity', incident: '', state: 'Operational', scope: 'No active incident on the London guest network.', minutes: -110, latest: -15, next: 0, event: '', update: 'Guest network checks passed.' },
  { id: 'meeting-rooms', office: 'redmond', label: 'Meeting room systems', site: 'Redmond', owner: 'Meeting technology desk', incident: '', state: 'Operational', scope: 'Conference room displays and room scheduling are operating normally.', minutes: -60, latest: -10, next: 0, event: '', update: 'Room monitoring checks passed.' }
] as const;
export type Service = (typeof services)[number];
export function serviceHealth(s: Session, id?: string, office?: string): Service[] {
  store(s);
  return services.filter(r => (!id || r.id === id) && (!office || r.office === office));
}
export function incidentTime(s: Session, minutes: number): string { return new Date(s.now.getTime() + minutes * 60000).toISOString(); }
function prefKey(s: Session, kind: string, id: string): string { return JSON.stringify([s.actor.id, kind, id]); }
export function preference(s: Session, kind: 'incident' | 'guide', id: string): boolean {
  return store(s).preferences.get(prefKey(s, kind, id)) === true;
}
export function setPreference(s: Session, kind: 'incident' | 'guide', id: string, value: boolean): void {
  if (kind === 'incident' && (!id || !services.some(r => r.incident === id))) fail('unavailable', 'This incident is unavailable.');
  if (kind === 'guide') guide(id);
  store(s).preferences.set(prefKey(s, kind, id), value); changed(s);
}
export function findGuides(s: Session, issue: string, type: string, id: string): Guide[] {
  store(s);
  const words = issue.trim().toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 2 && ['and','the','for','how','can','with','what','not'].indexOf(w) === -1);
  const options = guides.filter(g => (!id || g.id === id) && (!type || g.type === type))
    .map(g => ({ g, score: words.filter(w => (g.issue + ' ' + g.title).toLowerCase().indexOf(w) !== -1).length }));
  return options.filter(o => !words.length || o.score > 0).sort((a, b) => b.score - a.score).map(o => o.g);
}
export function prepareEquipment(s: Session, itemId: string, rationale: string): Confirm<Order> {
  const item = catalogItem(itemId);
  const reason = text(rationale, 'Rationale', 12);
  const check = scopeGuard(s); const id = reference('EQ');
  const validate = (current: Session): void => {
    if (store(current).orders.some(o => o.owner === current.actor.id && o.itemId === itemId && o.status === 'Pending'))
      fail('duplicate', 'You already have an active request for this item. No duplicate was created.');
  };
  validate(s);
  return current => {
    check(current); const data = store(current);
    const prior = data.orders.find(o => o.id === id && o.owner === current.actor.id);
    if (prior) return prior;
    validate(current);
    const order: Order = { id, owner: current.actor.id, requester: current.actor.displayName, assignee: rehearsalLead.id !== current.actor.id ? rehearsalLead.id : 'equipment-routing-desk', itemId, rationale: reason, cost: item.price, policy: item.policy, submitted: current.now.toISOString(), revision: 1, status: 'Pending' };
    data.orders.push(order); changed(current, order.assignee); return order;
  };
}
export function amendEquipment(s: Session, id: string, revision: number, rationale: string): Order {
  const data = store(s); const row = data.orders.find(o => o.id === id && o.owner === s.actor.id);
  if (!row) return fail('unavailable', 'This order is unavailable in your session.');
  if (row.status !== 'Pending') fail('decided', 'This order has already been decided.');
  if (row.revision !== revision) fail('stale', 'This order has changed. Review it again.');
  const next = { ...row, rationale: text(rationale, 'Rationale', 12), revision: row.revision + 1 };
  data.orders[data.orders.indexOf(row)] = next; changed(s, row.assignee); return next;
}
export const resources = [
  { id: 'design-studio', title: 'Design Studio', purpose: 'Shared design workspace and review boards.', owner: 'Design Operations · resource owner', levels: ['Reader', 'Contributor'], durations: ['7d', '30d', '90d'] },
  { id: 'field-library', title: 'Field Library', purpose: 'Read published implementation playbooks.', owner: 'Field Enablement · resource owner', levels: ['Reader'], durations: ['7d', '30d'] }
];
export function proposedExpiry(s: Session, duration: string): string {
  allowed(duration, ['7d', '30d', '90d'], 'duration'); return shifted(s.now, parseInt(duration, 10));
}
export function prepareAccess(s: Session, appId: string, level: string, duration: string): Confirm<AccessReceipt> {
  const app = resources.find(a => a.id === appId) || fail('unavailable', 'This resource is unavailable.');
  allowed(level, app.levels, 'access level for this resource'); allowed(duration, app.durations, 'duration for this resource');
  const check = scopeGuard(s); const id = reference('AR');
  const expires = proposedExpiry(s, duration);
  return current => {
    check(current); const data = store(current);
    const prior = data.access.find(a => a.id === id && a.owner === current.actor.id); if (prior) return prior;
    if (new Date(expires).getTime() <= current.now.getTime()) fail('stale', 'The proposed expiry has passed. Start a fresh review.');
    if (data.access.some(a => a.owner === current.actor.id && a.resource === appId && new Date(a.expires).getTime() > current.now.getTime()))
      fail('duplicate', 'An active access request already exists for this resource.');
    const row = { id, owner: current.actor.id, resource: appId, level, expires, route: app.owner }; data.access.push(row); changed(current); return row;
  };
}

function cut(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
}
type Queue = 'workplace' | 'procurement';
type Kind = 'equipment' | 'support';
type Snapshot = 'Resolved' | 'Awaiting';
interface HistoricalRow {
  id: string; kind: Kind; queue: Queue; state: Snapshot; created: number; closed?: number; resolutionHours?: number; positive?: boolean; orderId?: string;
}
// One immutable routing snapshot per request. Resolution events may belong to a later week than intake.
function historical(s: Session): HistoricalRow[] {
  manager(s);
  const end = cut(s.now); const records: HistoricalRow[] = [];
  for (let age = 0; age < 15; age++) {
    const start = end - (age + 1) * week; const supportCount = [2, 14, 3, 5, 11][age % 5];
    for (let slot = 0; slot < 6 + supportCount; slot++) {
      const equipment = slot < 6; const procurement = equipment && slot >= 4;
      const resolved = equipment ? procurement ? age % 4 === 0 : slot < 3 : (slot + age) % 3 !== 0;
      const created = creationTime(end, age, slot);
      const lag = equipment ? (slot + 1) * 7 : ((age + slot) % 4 + 4) * 24;
      const closureTime = created + lag * day / 24;
      const closed = resolved && closureTime < end ? closureTime : undefined;
      records.push({ id: `HS-${new Date(start).toISOString().slice(0, 10)}-${slot + 1}`, kind: equipment ? 'equipment' : 'support', queue: procurement ? 'procurement' : 'workplace',
        state: closed !== undefined ? 'Resolved' : 'Awaiting', created, closed, resolutionHours: closed === undefined ? undefined : (closed - created) / (day / 24), positive: closed !== undefined && (age + slot) % 2 === 0 ? (slot + age) % 6 !== 0 : undefined,
        orderId: age === 1 && slot === 4 ? 'EQ-4102' : age === 2 && slot === 3 ? 'EQ-4107' : undefined });
    }
  }
  return records;
}
export const periods = ['4w', '8w', '12w'];
export const queues = ['all', 'workplace', 'procurement'];
export const kinds = ['all', 'equipment', 'support'];
export function term(id: string): string { return id === 'all' ? 'All' : id.charAt(0).toUpperCase() + id.slice(1); }
export interface TrendPoint { start: string; received: number; resolved: number; hours: number; positive: number; feedback: number; }
export function supportTrend(s: Session, period: string, team: string): { start: string; end: string; points: TrendPoint[]; totals: TrendPoint } {
  const facts = historical(s);
  allowed(period, periods, 'reporting period'); allowed(team, queues, 'team');
  const n = parseInt(period, 10); const end = cut(s.now); const start = end - n * week;
  const points: TrendPoint[] = [];
  const empty = (a: number): TrendPoint => ({ start: new Date(a).toISOString(), received: 0, resolved: 0, hours: 0, positive: 0, feedback: 0 });
  const totals = empty(start);
  for (let w = 0; w < n; w++) points.push(empty(start + w * week));
  facts.filter(row => team === 'all' || row.queue === team).forEach(row => {
    const opened = Math.floor((row.created - start) / week); const closed = row.closed === undefined ? -1 : Math.floor((row.closed - start) / week);
    if (points[opened]) { points[opened].received++; totals.received++; }
    if (points[closed]) [points[closed], totals].forEach(point => {
      point.resolved++; point.hours += row.resolutionHours || 0;
      if (row.positive !== undefined) { point.feedback++; if (row.positive) point.positive++; }
    });
  });
  return { start: totals.start, end: new Date(end - 1).toISOString(), points, totals };
}
export interface FlowLink {
  id: string; source: string; target: string; level: 0 | 1; count: number; sourceCount: number;
  matches: ReadonlyArray<{ id: string; title: string }>;
}
export function supportFlow(s: Session, period: string, category: string, queue: string): { start: string; end: string; count: number; links: FlowLink[] } {
  const facts = historical(s);
  allowed(period, periods, 'reporting period'); allowed(category, kinds, 'cohort'); allowed(queue, queues, 'queue');
  const end = cut(s.now); const start = end - parseInt(period, 10) * week;
  const rows = facts.filter(row => row.created >= start && row.created < end && (category === 'all' || row.kind === category) && (queue === 'all' || row.queue === queue));
  const waiting = eligibleOrders(s); const links: FlowLink[] = [];
  ([0, 1] as const).forEach(level => {
    const sources = level === 0 ? ['equipment', 'support'] : ['workplace', 'procurement'];
    const targets = level === 0 ? ['workplace', 'procurement'] : ['Resolved', 'Awaiting'];
    sources.forEach(source => {
      const from = rows.filter(row => (level === 0 ? row.kind : row.queue) === source);
      targets.forEach(target => {
        const group = from.filter(row => (level === 0 ? row.queue : row.state) === target);
        if (!group.length) return;
        const matches = waiting.filter(o => group.some(row => row.orderId === o.id && row.created === Date.parse(o.submitted))).map(o => ({ id: o.id, title: catalogItem(o.itemId).title }));
        links.push({ id: `${source}:${target}`, level, source, target, count: group.length, sourceCount: from.length, matches });
      });
    });
  });
  return { start: new Date(start).toISOString(), end: new Date(end - 1).toISOString(), count: rows.length, links };
}
