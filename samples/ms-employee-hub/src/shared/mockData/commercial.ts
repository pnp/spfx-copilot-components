import type { HubInputs, HubSession } from '../types';

export type Period = 'current-quarter' | 'previous-quarter';
export type Channel = 'all' | 'partner' | 'inbound';
export type Region = 'Americas' | 'EMEA' | 'APAC';
export type Driver = 'new' | 'expansion' | 'slippage' | 'reductions';
export type Workstream = 'qualification' | 'forecast';
type Four = readonly [number, number, number, number];
type Cohort = readonly [Four, Four];
type Bridge = readonly [number, number, number, number, number, number];
interface MarketCut {
  readonly booked: number;
  readonly plan: number;
  readonly leads: Cohort;
  readonly bridge?: Bridge;
}
interface MarketSeed {
  readonly id: string;
  readonly name: string;
  readonly region: Region;
  readonly lon: number;
  readonly lat: number;
  readonly cuts: readonly [MarketCut, MarketCut];
}
// Source revision 1. Amounts are integer tenths of a USD million at fixed reporting FX.
// Each series is a distinct, pre-aggregated synthetic acquisition batch observed at day 14.
const seeds: readonly MarketSeed[] = [
  { id: 'DE', name: 'Germany', region: 'EMEA', lon: 10, lat: 51, cuts: [
    { booked: 32, plan: 48, leads: [[8, 16, 30, 6], [12, 4, 16, 8]], bridge: [60, 6, 2, -10, -2, 64] },
    { booked: 39, plan: 43, leads: [[11, 12, 19, 8], [9, 5, 12, 4]], bridge: [55, 4, 3, -5, -1, 60] }
  ] },
  { id: 'GB', name: 'United Kingdom', region: 'EMEA', lon: -3, lat: 55, cuts: [
    { booked: 38, plan: 40, leads: [[12, 11, 16, 6], [13, 8, 10, 4]], bridge: [58, 4, 2, -5, -1, 60] },
    { booked: 36, plan: 38, leads: [[10, 10, 12, 6], [8, 6, 9, 5]], bridge: [54, 2, 1, -3, -1, 57] }
  ] },
  { id: 'US', name: 'United States', region: 'Americas', lon: -98, lat: 39, cuts: [
    { booked: 90, plan: 80, leads: [[34, 28, 36, 12], [45, 20, 36, 9]], bridge: [130, 8, 4, -2, -2, 136] },
    { booked: 72, plan: 76, leads: [[24, 19, 34, 9], [31, 16, 28, 7]], bridge: [115, 6, 3, -4, -1, 126] }
  ] },
  { id: 'BR', name: 'Brazil', region: 'Americas', lon: -52, lat: -12, cuts: [
    { booked: 22, plan: 24, leads: [[8, 8, 15, 4], [6, 4, 12, 3]], bridge: [35, 3, 1, -2, -1, 36] },
    { booked: 19, plan: 22, leads: [[7, 6, 12, 3], [4, 4, 10, 2]] }
  ] },
  { id: 'IN', name: 'India', region: 'APAC', lon: 79, lat: 23, cuts: [
    { booked: 41, plan: 40, leads: [[14, 9, 12, 5], [12, 6, 16, 6]], bridge: [60, 4, 3, -2, -1, 62] },
    { booked: 35, plan: 37, leads: [[10, 8, 9, 4], [9, 6, 12, 3]], bridge: [55, 3, 2, -3, -1, 55] }
  ] },
  { id: 'JP', name: 'Japan', region: 'APAC', lon: 138, lat: 37, cuts: [
    { booked: 33, plan: 36, leads: [[10, 14, 17, 4], [8, 6, 8, 3]], bridge: [50, 2, 2, -5, -1, 54] },
    { booked: 31, plan: 30, leads: [[9, 8, 12, 3], [6, 4, 9, 2]], bridge: [42, 4, 2, -2, -1, 48] }
  ] },
  { id: 'AU', name: 'Australia', region: 'APAC', lon: 134, lat: -25, cuts: [
    { booked: 24, plan: 22, leads: [[9, 8, 10, 3], [11, 4, 8, 2]], bridge: [35, 3, 1, -2, -1, 36] },
    { booked: 18, plan: 20, leads: [[0, 0, 0, 0], [7, 4, 7, 2]], bridge: [27, 2, 2, -3, -1, 30] }
  ] }
];

export const channelNames = { all: 'All sources', partner: 'Partner', inbound: 'Inbound' };
export const regions: readonly Region[] = ['EMEA', 'Americas', 'APAC'];
export const drivers: readonly Driver[] = ['new', 'expansion', 'slippage', 'reductions'];
export const driverNames = { new: 'New business', expansion: 'Expansion', slippage: 'Slippage', reductions: 'Reductions' };
const spoken: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  period: { 'this quarter': 'current-quarter', 'this fiscal quarter': 'current-quarter', 'current quarter': 'current-quarter', 'current fiscal quarter': 'current-quarter',
    'previous quarter': 'previous-quarter', 'previous fiscal quarter': 'previous-quarter', 'last quarter': 'previous-quarter', 'last fiscal quarter': 'previous-quarter', 'prior quarter': 'previous-quarter' },
  channel: { all: 'all', 'all sources': 'all', 'all channels': 'all', partner: 'partner', inbound: 'inbound' },
  region: { all: 'all', 'all covered regions': 'all', emea: 'EMEA', apac: 'APAC', americas: 'Americas' },
  driver: { new: 'new', 'new business': 'new', expansion: 'expansion', slippage: 'slippage', reductions: 'reductions' },
  workstream: { qualification: 'qualification', 'lead qualification': 'qualification', forecast: 'forecast', 'forecast revision': 'forecast' }
};
export function normalizeCommercialInputs(s: HubSession, inputs: HubInputs): HubInputs {
  if (!s.actor.commercial) return {};
  const result = { ...inputs };
  for (const key of Object.keys(spoken)) {
    const raw = inputs[key];
    if (typeof raw !== 'string') continue;
    const choice = raw.toLowerCase().trim().replace(/[-_\s]+/g, ' ');
    if (Object.prototype.hasOwnProperty.call(spoken[key], choice)) result[key] = spoken[key][choice];
  }
  if (typeof inputs.marketId === 'string') {
    const raw = inputs.marketId.trim().toLowerCase();
    const m = seeds.find(row => row.id.toLowerCase() === raw || row.name.toLowerCase() === raw);
    if (m) result.marketId = m.id;
  }
  return result;
}
export const day = 86400000;
export const isoDay = (date: Date): string => date.toISOString().slice(0, 10);
export const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
export const rate = (n: number, d: number): string => d === 0 ? 'N/A' : `${(n * 100 / d).toFixed(1)}%`;
export const money = (tenths: number): string => `$${(Math.abs(tenths) / 10).toFixed(1)}m`;
export const signed = (tenths: number): string => `${tenths < 0 ? '−' : tenths > 0 ? '+' : ''}${money(tenths)}`;

export interface FiscalCut { period: Period; label: string; asOf: string; priorAsOf: string; mature: boolean; hasClose: boolean }
export function fiscalCut(now: Date, period: Period): FiscalCut {
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), quarter = Math.floor(m / 3) * 3;
  const today = Date.UTC(y, m, now.getUTCDate());
  const start = Date.UTC(y, quarter, 1), prev = Date.UTC(y, quarter - 3, 1);
  const previous = period === 'previous-quarter', qStart = previous ? prev : start;
  // Previous quarter is observed at the same elapsed day, never at its later quarter-end close.
  const cut = previous ? Math.min(start - day, prev + (today - start) - day) : today - day;
  const date = new Date(qStart);
  return { period, label: `FY${date.getUTCFullYear() + (date.getUTCMonth() >= 6 ? 1 : 0)} Q${Math.floor(((date.getUTCMonth() + 6) % 12) / 3) + 1}`,
    asOf: isoDay(new Date(cut)), priorAsOf: isoDay(new Date(cut - 7 * day)), mature: cut - qStart >= 14 * day, hasClose: cut >= qStart };
}
export type Market = Omit<MarketSeed, 'cuts'> & MarketCut;
export function marketInScope(s: HubSession, id: unknown, region?: unknown): boolean {
  return s.actor.commercial && seeds.some(m => m.id === id && (region === undefined || region === 'all' || region === m.region));
}
export function commercialMarkets(session: HubSession, cut: FiscalCut): Market[] {
  if (!session.actor.commercial || !cut.hasClose) return [];
  return seeds.map(({ id, name, region, lon, lat, cuts }) => {
    const { booked, plan, leads, bridge } = cuts[cut.period === 'current-quarter' ? 0 : 1];
    return { id, name, region, lon, lat, booked, plan,
      leads: [leads[0].slice() as unknown as Four, leads[1].slice() as unknown as Four],
      bridge: bridge && bridge.slice() as unknown as Bridge };
  });
}
export const nodeNames = {
  partner: 'Partner', inbound: 'Inbound', qualified: 'Qualified', unqualified: 'Not qualified',
  opportunity: 'Opportunity created', open: 'Qualified, open', nurture: 'In nurture', screened: 'Screened out'
};
export type NodeId = keyof typeof nodeNames;
export interface FlowLink { id: string; from: NodeId; to: NodeId; count: number }
export const opportunityLink = 'qualified:opportunity';
export function leadFlow(m: Market, channel: Channel): { links: FlowLink[]; counts: Record<NodeId, number>; total: number } {
  const links: FlowLink[] = [];
  const counts = { partner: 0, inbound: 0, qualified: 0, unqualified: 0, opportunity: 0, open: 0, nurture: 0, screened: 0 };
  const add = (from: NodeId, to: NodeId, count: number): void => { links.push({ id: `${from}:${to}`, from, to, count }); };
  (['partner', 'inbound'] as const).forEach((source, i) => {
    if (channel !== 'all' && channel !== source) return;
    const [op, open, nurture, screened] = m.leads[i];
    counts[source] = op + open + nurture + screened;
    counts.opportunity += op; counts.open += open; counts.nurture += nurture; counts.screened += screened;
    add(source, 'qualified', op + open); add(source, 'unqualified', nurture + screened);
  });
  counts.qualified = counts.opportunity + counts.open; counts.unqualified = counts.nurture + counts.screened;
  add('qualified', 'opportunity', counts.opportunity); add('qualified', 'open', counts.open);
  add('unqualified', 'nurture', counts.nurture); add('unqualified', 'screened', counts.screened);
  return { links, counts, total: counts.partner + counts.inbound };
}
export function forecast(m: Market): { prior: number; current: number; target: number; movements: Record<Driver, number> } | undefined {
  if (!m.bridge) return undefined;
  const [prior, n, expansion, slippage, reductions, target] = m.bridge;
  return { prior, current: prior + n + expansion + slippage + reductions, target, movements: { new: n, expansion, slippage, reductions } };
}
export function bookings(markets: readonly Market[]): { booked: number; plan: number; gap: number; attainment: string } {
  const booked = sum(markets.map(m => m.booked)), plan = sum(markets.map(m => m.plan));
  return { booked, plan, gap: booked - plan, attainment: rate(booked, plan) };
}

export type EvidenceSelection = { kind: 'qualification'; channel: Channel; link: string } | { kind: 'forecast'; driver: Driver };
export interface Evidence {
  readonly id: string; readonly marketId: string; readonly market: string; readonly period: Period;
  readonly quarter: string; readonly asOf: string; readonly selection: EvidenceSelection; readonly citation: string;
  readonly measure: string; readonly title: string;
}
export interface ActionFields { evidenceId: string; workstream: string; owner: string; checkpoint: string; due: string }
export interface ActionReceipt {
  readonly id: string; readonly evidence: Evidence; readonly fields: Readonly<ActionFields>; readonly at: string; readonly actor: string;
}
interface Register { evidence: readonly Evidence[]; receipts: readonly ActionReceipt[] }
const empty: Register = Object.freeze({ evidence: Object.freeze([]), receipts: Object.freeze([]) });
const registerKey = (session: HubSession): string => `business:register:v1:${session.actor.id}`;
const mayPlan = (s: HubSession): boolean => s.actor.commercial && s.actor.planner;
function register(s: HubSession): Register { return mayPlan(s) ? s.memory.get(registerKey(s)) as Register || empty : empty; }
export function receipts(s: HubSession): readonly ActionReceipt[] { return register(s).receipts; }
// Opaque handoffs exist only in the issuing actor/session's register. The prompt cannot mint evidence.
function opaqueId(): string { return `e-${crypto.randomUUID()}`; }
export function captureEvidence(session: HubSession, marketId: string, period: Period, selection: EvidenceSelection): Evidence | undefined {
  if (!mayPlan(session)) return undefined;
  const cut = fiscalCut(session.now, period), m = commercialMarkets(session, cut).find(row => row.id === marketId);
  if (!m) return undefined;
  const data = register(session);
  let citation: string, title: string, measure: string;
  if (selection.kind === 'qualification') {
    const flow = leadFlow(m, selection.channel), link = flow.links.find(x => x.id === selection.link);
    if (!cut.mature || !flow.total || !link || !link.count) return undefined;
    measure = selection.link === opportunityLink ? 'Opportunity creation rate at day 14' : `${nodeNames[link.from]} → ${nodeNames[link.to]} share at day 14`;
    citation = `${channelNames[selection.channel]} · ${nodeNames[link.from]} → ${nodeNames[link.to]}: ${link.count}/${flow.total} (${rate(link.count, flow.total)})`;
    title = `Review ${m.name} lead qualification · ${channelNames[selection.channel]}`;
  } else {
    const f = forecast(m);
    if (!f || drivers.indexOf(selection.driver) < 0) return undefined;
    measure = 'Signed contribution to the weekly forecast revision';
    citation = `${driverNames[selection.driver]}: ${signed(f.movements[selection.driver])} · ${money(f.prior)} prior → ${money(f.current)} current`;
    title = `Investigate ${m.name} forecast ${driverNames[selection.driver].toLowerCase()}`;
  }
  const found = data.evidence.find(e => e.marketId === marketId && e.period === period && e.asOf === cut.asOf && e.citation === citation);
  if (found) return found;
  const e: Evidence = Object.freeze({ id: opaqueId(), marketId, market: m.name, period, quarter: cut.label, asOf: cut.asOf,
    selection: Object.freeze({ ...selection }), citation, measure, title });
  session.memory.set(registerKey(session), { ...data, evidence: data.evidence.concat(e) });
  return e;
}
export function resolveEvidence(s: HubSession, id: string, marketId?: string, period?: string): Evidence | undefined {
  return register(s).evidence.find(e => e.id === id && (!marketId || marketId === e.marketId) && (!period || period === e.period)
    && fiscalCut(s.now, e.period).asOf === e.asOf);
}
export const ownerRoles = { qualification: ['Partner Sales lead', 'Demand Generation lead', 'Regional commercial lead'], forecast: ['Regional finance lead', 'Regional commercial lead'] };
export const checkpoints = { qualification: ['Compare the next like-aged cohort', 'Audit the qualification criteria'], forecast: ['Reconcile the next weekly cut', 'Review the driver with Finance'] };
export function nextReview(now: Date): string {
  const d = new Date(now.getTime() + 7 * day);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return isoDay(d);
}
export function actionError(s: HubSession, f: ActionFields): string | undefined {
  if (!mayPlan(s)) return 'Commercial planning access is required.';
  const e = resolveEvidence(s, f.evidenceId);
  if (!e || f.workstream !== e.selection.kind) return 'This evidence is unavailable or the cut has changed. Select fresh evidence.';
  if (ownerRoles[e.selection.kind].indexOf(f.owner) < 0) return 'Choose an eligible accountable role.';
  if (checkpoints[e.selection.kind].indexOf(f.checkpoint) < 0) return 'Choose a checkpoint for this evidence.';
  const date = new Date(`${f.due}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.due) || !isFinite(date.getTime()) || isoDay(date) !== f.due || f.due <= isoDay(s.now) || date.getUTCDay() === 0 || date.getUTCDay() === 6)
    return 'Choose a future weekday (UTC) for the review.';
  return undefined;
}
type ActionResult = { ok: true; receipt: ActionReceipt } | { ok: false; message: string; checkedAt?: number };
export function recordAction(session: HubSession, fields: ActionFields, confirmed: boolean): ActionResult {
  if (!confirmed) return { ok: false, message: 'Confirm the reviewed local action first.' };
  if (!mayPlan(session)) return { ok: false, message: 'Commercial planning access is required.' };
  // Sample the injected clock once at the write boundary, not on render or when opening Review.
  const now = session.clock ? session.clock() : session.now;
  if (!isFinite(now.getTime())) return { ok: false, message: 'The current reporting time could not be verified. No action was recorded.' };
  const s = { ...session, now }, message = actionError(s, fields), data = register(s), evidence = resolveEvidence(s, fields.evidenceId);
  if (message || !evidence) return { ok: false, message: message || 'Select fresh evidence.', checkedAt: now.getTime() };
  const prior = data.receipts.find(r => r.evidence.id === evidence.id);
  if (prior) return { ok: true, receipt: prior };
  const receipt: ActionReceipt = Object.freeze({ id: `SLT-${1001 + data.receipts.length}`, evidence, fields: Object.freeze({ ...fields }), at: s.now.toISOString(), actor: s.actor.displayName });
  s.memory.set(registerKey(s), { ...data, receipts: Object.freeze(data.receipts.concat(receipt)) });
  return { ok: true, receipt };
}
