import { catalog } from '../shared/catalog';
import type { HubVisibleScope } from './VisibleScope';
import { fieldSpec } from './fields';

type Mode = 'inline' | 'full';
export interface Snapshot { content: { type: 'text'; text: string }[]; structuredContent: Record<string, unknown> }
export interface BridgePort {
  publish: (snapshot: Snapshot) => Promise<void>;
  send: (text: string) => Promise<{ isError?: boolean }>;
}
const stages = ['information', 'selection', 'draft', 'review', 'receipt', 'denied', 'unavailable'];
export function snapshot(scope: HubVisibleScope, mode: Mode): Snapshot {
  const c = catalog.find(row => row.id === scope.entry);
  if (!c || stages.indexOf(scope.stage) < 0) throw new Error('Unsupported visible scope.');
  const routable = ['company/home', 'hr/home', 'tech/home', 'business/home'];
  const route = scope.entry === 30 && scope.route && routable.indexOf(scope.route) >= 0 ? scope.route : c.route;
  const structuredContent: Record<string, unknown> = {
    tool: c.tool, view: c.title, workspace: route.split('/')[0], route, mode, stage: scope.stage, origin: 'synthetic fixture',
    omitted: ['free text','personal and financial details','unselected records']
  };
  let summary = `${c.title}: ${scope.stage}.`;
  if (scope.stage !== 'denied' && scope.stage !== 'unavailable') {
    const filters: Record<string, string> = {};
    const businessHome=c.id===30&&route==='business/home';
    const filterFields=businessHome?['marketId','period','channel','driver']:c.fields;
    for (const key of filterFields) {
      const value = scope.filters?.[key];
      if (typeof value !== 'string') continue;
      const choices = fieldSpec(businessHome?(key==='driver'?7:9):c.id, key).choices;
      // Never forward search, editable text, personal identifiers, leave dates or pay.
      if (choices && choices.indexOf(value) >= 0 && c.id !== 18 && key !== 'leaveType') filters[key] = value;
      if (key === 'marketId' && /^(DE|GB|US|BR|IN|JP|AU)$/.test(value)) filters[key] = value;
      if (c.id===21 && key==='guideId' && /^(display-link|wifi-rejoin|headset-output)$/.test(value)
        ||c.id===20 && key==='officeId' && /^(london|redmond)$/.test(value)
        ||c.id===24 && key==='itemId' && /^(studio-display|usb-c-dock|quiet-headset)$/.test(value)
        ||c.id===28 && key==='appId' && /^(design-studio|field-library)$/.test(value)
        ||c.id===4 && key==='officeId' && /^(LON|RDM|TYO)$/.test(value)) filters[key]=value;
      if (c.tool==='ReadCompanyNews'&&key==='storyId'&&/^ST-\d{2}$/.test(value)
        ||c.id===5&&key==='resourceId'&&/^GD-\d{2}$/.test(value)
        ||c.tool==='FindCompanyEvents'&&key==='officeId'&&/^(LON|RDM|TYO)$/.test(value)
        ||c.tool==='FindCompanyEvents'&&key==='eventId'&&/^(town-hall|studio|lab)-\d{4}-\d{2}-\d{2}$/.test(value)
        ||c.id===27&&key==='queueId'&&/^(all|workplace|procurement)$/.test(value)) filters[key]=value;
    }
    if (Object.keys(filters).length) structuredContent.filters = filters;
    if(route==='company/home'&&scope.section&&['Today','News & stories','Around the world','Events','Saved','Briefing','Search'].includes(scope.section))structuredContent.section=scope.section;
    if(c.id===14 && filters.period) summary+=` Viewing the ${filters.period} entitlement year; balances stay on screen.`;
    const progress=scope.progress;
    if((c.id===21||c.id===10||c.id===11)&&progress&&Number.isSafeInteger(progress.current)&&Number.isSafeInteger(progress.total)
      &&progress.total>0&&progress.total<=100&&progress.current>=0&&progress.current<=progress.total){
      const {current,total,completed}=progress;
      structuredContent.progress={current,total,...(completed!==undefined&&Number.isSafeInteger(completed)&&completed>=0&&completed<=total?{completed}:{})};
      if(c.id===21)summary+=` ${filters.guideId||'Guide'}: step ${current} of ${total}.`;
    }
    const b=scope.bookings;
    if((c.id===3||c.id===8||c.id===30&&route==='business/home')&&b&&[b.bookedUsd,b.planUsd].every(v=>Number.isSafeInteger(v)&&v>=0)&&/^\d{4}-\d\d-\d\d$/.test(b.asOf)){
      structuredContent.bookings={unit:'USD',asOf:b.asOf,booked:b.bookedUsd,phasedPlan:b.planUsd};
      summary+=` At ${b.asOf}, USD ${b.bookedUsd} booked against a phased plan of USD ${b.planUsd}.`;
    }
    const t=scope.trend;
    if(c.id===26&&t&&[t.received,t.resolved].every(v=>Number.isSafeInteger(v)&&v>=0)&&/^\d{4}-\d\d-\d\d$/.test(t.weekStart)){
      structuredContent.week={start:t.weekStart,received:t.received,resolved:t.resolved};
      summary+=` Week of ${t.weekStart}: ${t.received} received and ${t.resolved} resolved.`;
    }
    const e = scope.evidence;
    if (e && (((c.id === 9||businessHome) && e.unit === 'leads') || (c.id === 27 && e.unit === 'requests')) &&
        Number.isSafeInteger(e.numerator) && Number.isSafeInteger(e.denominator) &&
        e.numerator >= 0 && e.denominator >= e.numerator) {
      structuredContent.evidence = {
        numerator: e.numerator, denominator: e.denominator, unit: e.unit,
        ...(c.id===27&&e.sourceTotal!==undefined&&Number.isSafeInteger(e.sourceTotal)&&e.sourceTotal>=e.numerator&&e.sourceTotal<=e.denominator?{sourceDenominator:e.sourceTotal}:{}),
        ...(e.asOf && /^\d{4}-\d\d-\d\d$/.test(e.asOf) ? { asOf: e.asOf } : {}),
        ...(e.selected && /^(?:(?:partner|inbound):(?:qualified|unqualified)|qualified:(?:opportunity|open)|unqualified:(?:nurture|screened)|(?:equipment|support):(?:workplace|procurement)|(?:procurement|workplace):(?:awaiting|resolved)|opportunity|awaiting|resolved)$/i.test(e.selected) ? { selected: e.selected } : {})
      };
      summary += ` The visible selection contains ${e.numerator} of ${e.denominator} ${e.unit}.`;
    }
    const f=scope.forecast;
    if((c.id===7||businessHome)&&f&&[f.priorUsd,f.currentUsd,f.movementUsd].every(Number.isSafeInteger)&&
      [f.priorCut,f.currentCut].every(v=>/^\d{4}-\d{2}-\d{2}$/.test(v))&&f.priorCut<f.currentCut){
      structuredContent.forecast={unit:'USD',priorCut:f.priorCut,currentCut:f.currentCut,priorEstimate:f.priorUsd,currentEstimate:f.currentUsd,selectedDriverMovement:f.movementUsd};
    }
    const p=scope.page;
    if(c.id===29&&p&&[p.first,p.last,p.total].every(Number.isSafeInteger)&&p.first>=0&&p.first<=p.last&&p.last<=p.total&&p.total<=28){
      structuredContent.page={first:p.first,last:p.last,total:p.total,...(catalog.some(row=>row.id===p.selected&&row.id<=28)?{preview:p.selected}:{})};
    }
    if (scope.stage === 'receipt' && scope.receipt &&
       ((c.id === 22 && /^IT-\d{1,12}$/.test(scope.receipt)) || (c.id === 25 && /^(EQ|REQ)-\d{1,12}$/.test(scope.receipt)))) {
      structuredContent.receipt = scope.receipt;
    }
  }
  const result: Snapshot = { content: [{ type: 'text', text: summary }], structuredContent };
  if (new TextEncoder().encode(JSON.stringify(result)).length > 10000) throw new Error('Narrow the selection before sharing.');
  return result;
}

export function conversation(captured: Snapshot, intention: string): string {
  const { tool, stage, receipt } = captured.structuredContent;
  if (intention === 'track-ticket' && tool === 'SubmitITTicket' && stage === 'receipt' && typeof receipt === 'string') {
    return `Track my submitted ticket using TrackMyITTicket with ticketId ${receipt}.`;
  }
  if (tool === 'TraceLeadConversion') return 'Explain the selected lead conversion count and its denominator. Discuss the visible cohort only.';
  if (tool === 'ReviewEquipmentRequest') return 'Explain the visible equipment review stage and the next permitted step. Do not decide the request.';
  if (tool === 'SubmitITTicket') return 'Explain the current ticket stage and my next step without sharing the issue description.';
  const title = catalog.find(c => c.tool === tool)?.title || 'Employee Hub';
  return `Explain “${title}” and its next available step using only what is visible. Do not take an action or reveal private details.`;
}

// Each click's publication and message are one job. Passive updates coalesce while a host call is in flight.
export class BridgeQueue {
  private tail: Promise<void> = Promise.resolve();
  private version = 0;
  private last = '';
  private busy = false;
  private disposed = false;
  public constructor(private port: BridgePort) {}
  public passive(value: Snapshot): Promise<void> {
    const version = ++this.version;
    return this.enqueue(async () => {
      if (version !== this.version || JSON.stringify(value) === this.last) return;
      await this.port.publish(value);
      this.last = JSON.stringify(value);
    });
  }
  public async discuss(value: Snapshot, intention: string): Promise<'sent' | 'busy' | 'rejected' | 'unknown' | 'not-published'> {
    if (this.busy || this.disposed) return 'busy';
    this.busy = true;
    const outcome: { value: 'sent' | 'rejected' | 'unknown' | 'not-published' } = { value: 'not-published' };
    try {
      await this.enqueue(async () => {
        try { await this.port.publish(value); } catch { return; }
        if (this.disposed) return;
        this.last = JSON.stringify(value);
        try { outcome.value = (await this.port.send(conversation(value, intention))).isError ? 'rejected' : 'sent'; }
        catch { outcome.value = 'unknown'; }
      });
      return outcome.value;
    } finally { this.busy = false; }
  }
  public dispose(): void { this.disposed = true; }
  private enqueue(job: () => Promise<void>): Promise<void> {
    const next = this.tail.then(async () => { if (!this.disposed) await job(); });
    this.tail = next.catch(() => undefined);
    return next;
  }
}
