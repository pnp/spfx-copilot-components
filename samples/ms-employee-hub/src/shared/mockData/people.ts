import type { HubSession } from '../types';
import { employeeFixture, rehearsalLead } from './session';
import { dayKind, referenceClose, shiftDay } from './companyBrief';
export { dayKind, referenceClose, shiftDay } from './companyBrief';

/** Private, synthetic HR sources. Nothing in this family is list-exportable. */
export const peopleSource = {
  version: 1,
  calendar: 'Pacific work calendar',
  zone: 'America/Los_Angeles',
  teamId: 'studio',
  teamName: 'Experience studio',
  reviewerId: 'alex'
} as const;

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: peopleSource.zone, year: 'numeric', month: '2-digit', day: '2-digit'
});
export function today(session: HubSession): string {
  const [m, d, y] = dateFormat.format(session.now).split('/');
  return `${y}-${m}-${d}`;
}
/** Capture one fresh instant for a consequential action, without moving the open draft or other HR fixtures. */
export function leaveActionSession(s: HubSession): HubSession {
  return s.clock ? {...s, now: s.clock(), clock: undefined} : s;
}
function utc(iso: string): Date { return new Date(`${iso}T12:00:00Z`); }
export function validDay(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && isFinite(utc(iso).getTime()) && utc(iso).toISOString().slice(0, 10) === iso;
}
export function dayLabel(iso: string, compact = false): string {
  return validDay(iso) ? utc(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', ...(compact ? {} : {year: 'numeric' as const})
  }) : 'Choose a valid date';
}
function weekday(iso: string): number { return utc(iso).getUTCDay(); }
function nextWorking(iso: string): string {
  let date = iso;
  while (dayKind(date) !== 'workday') date = shiftDay(date, 1);
  return date;
}
export function monday(iso: string): string { return shiftDay(iso, -((weekday(iso) + 6) % 7)); }
export const leaveTypes = ['annual', 'sick', 'personal'] as const;
export type LeaveType = typeof leaveTypes[number];
export const leaveName: Record<LeaveType, string> = { annual: 'Annual leave', sick: 'Sick leave', personal: 'Personal time' };
const allowances: Record<LeaveType, number> = {annual: 22, sick: 10, personal: 4};
function isLeaveType(type: string): type is LeaveType { return leaveTypes.some(t => t === type); }
function leaveAssignment(employeeId: string): {reviewerId: string; teamId: string} {
  return employeeId === peopleSource.reviewerId ? {reviewerId: 'operations-reviewer', teamId: 'operations'} :
    {reviewerId: peopleSource.reviewerId, teamId: peopleSource.teamId};
}
export function leaveApprover(s: HubSession): string {
  return leaveAssignment(s.actor.id).reviewerId === peopleSource.reviewerId ? 'Alex · People manager' : 'Operations people manager';
}
export type RequestStatus = 'pending' | 'approved' | 'declined';
const reviewerProfiles: Record<string, {tile: number; role: string}> = {
  maya: {tile:0,role:'Program manager'}, theo: {tile:1,role:'Experience designer'}, jo: {tile:2,role:'Service designer'},
  ren: {tile:3,role:'Operations specialist'}, employee: {tile:4,role:'Team member'}, alex: {tile:5,role:'People manager'}
};
export function requesterProfile(id: string): {tile: number; role: string} | undefined {
  return Object.prototype.hasOwnProperty.call(reviewerProfiles, id) ? reviewerProfiles[id] : undefined;
}
type Result<T> = { ok: true; value: T } | { ok: false; message: string };
const good = <T>(value: T): Result<T> => ({ok: true, value});
const bad = <T>(message: string): Result<T> => ({ok: false, message});

export const courses = [
  {id: 'inclusive-meetings', title: 'Make meetings work for everyone', dueOffset: -2, minutes: 12, chapters: [
    {title: 'Before the room fills', text: 'Send a short agenda in advance. Share the decision you need and invite written contributions before the meeting.'},
    {title: 'Make space to contribute', text: 'Offer a spoken and a written way to participate. Pause after a question so colleagues have time to respond.'},
    {title: 'Close the loop', text: 'Write down the decision, the owner and the next check-in. Send the same summary to people who could not attend.'}
  ]},
  {id: 'data-care', title: 'Handle everyday data with care', dueOffset: 5, minutes: 9, chapters: [
    {title: 'Choose the smallest audience', text: 'Before sharing a document, check who needs it and remove unintended recipients.'},
    {title: 'Check the destination', text: 'Use the approved workspace for the content. Verify permissions, not just the name on the folder.'}
  ]},
  {id: 'feedback', title: 'Give useful feedback', dueOffset: 18, minutes: 8, chapters: [
    {title: 'Name an observation', text: 'Describe a specific action and the difference it made, rather than making an assumption about intent.'},
    {title: 'Invite a response', text: 'Ask how your colleague saw the situation. Agree together on a small next step.'}
  ]}
];
export const benefits = [
  {id: 'health', title: 'Health & wellbeing', steps: ['Find the plan comparison', 'List questions about providers', 'Check the window dates'],
    intro: 'Prepare a short list of questions about providers, access and costs before comparing your options.'},
  {id: 'future', title: 'Planning ahead', steps: ['Gather your savings questions', 'Review the contribution guide', 'Note what needs clarification'],
    intro: 'Bring your own questions to a review of the savings guide. This worksheet does not change contributions.'},
  {id: 'time', title: 'Time & flexibility', steps: ['Read the time-away overview', 'Check your own allowance', 'Note questions for an adviser'],
    intro: 'Compare the time-away resources and note any terms you want an adviser to explain.'}
];
export const caseCategories = { benefits: 'Benefits', pay: 'Pay & rewards', time: 'Time away', workplace: 'Workplace support' };
export const channels = { adviser: 'People adviser', specialist: 'HR specialist desk' };
type Category = keyof typeof caseCategories;
type Channel = keyof typeof channels;
export interface LeaveRecord {
  id: string; employeeId: string; employeeName: string; reviewerId: string; teamId: string;
  start: string; end: string; type: LeaveType; days: string[]; status: RequestStatus; revision: number;
}
interface CaseReceipt { id: string; category: Category; channel: Channel; created: string }
interface Repository {
  sequence: number;
  requests: LeaveRecord[];
  requestNotes: Record<string, string>;
  checks: Record<string, boolean>;
  cases: Record<string, CaseReceipt>;
  decisions: Record<string, {requestId: string; revision: number; status: RequestStatus; reviewer: string; note: string; date: string}>;
  commands: Record<string, string>;
}
function store(s: HubSession): Repository {
  const key = 'hr.private.v1';
  let repo = s.memory.get(key) as Repository | undefined;
  if (!repo) {
    const start = nextWorking(shiftDay(monday(today(s)), 8));
    const second = nextWorking(shiftDay(start, 1));
    const common = {type: 'annual' as const, revision: 1, reviewerId: peopleSource.reviewerId, teamId: peopleSource.teamId};
    const upcoming = nextWorking(shiftDay(today(s), 35));
    const later = nextWorking(shiftDay(start, 7));
    const history = [employeeFixture, rehearsalLead].reduce<LeaveRecord[]>((records, actor, index) => {
      const owner = {...common, ...leaveAssignment(actor.id), employeeId:actor.id, employeeName:actor.displayName};
      const past = [-26,-12].map((offset,i): LeaveRecord => {
        const first=nextWorking(shiftDay(today(s),offset)), last=nextWorking(shiftDay(first,1));
        return {...owner,id:`TA-09${index*3+i+1}`,status:'approved',start:first,end:last,days:[first,last]};
      });
      return records.concat(past,{...owner,id:`TA-09${index*3+3}`,type:'personal',status:'pending',start:upcoming,end:upcoming,days:[upcoming]});
    },[]);
    repo = {sequence: 200, checks: {}, cases: {}, decisions: {}, commands: {}, requestNotes: {}, requests: [
      ...history,
      {...common, id: 'TA-101', employeeId: 'maya', employeeName: 'Maya Reed', status: 'pending', start, end: start, days: [start]},
      {...common, id: 'TA-102', employeeId: 'theo', employeeName: 'Theo Bell', status: 'approved', start, end: second, days: [start, second]},
      {...common, id: 'TA-104', employeeId: 'jo', employeeName: 'Jo Ellis', type:'personal', status:'pending', start:later, end:later, days:[later]},
      {...common, id: 'TA-103', reviewerId: 'operations-reviewer', teamId: 'operations', employeeId: 'ren', employeeName: 'Ren Park', status: 'pending', start, end: start, days: [start]}
    ]};
    s.memory.set(key, repo);
  }
  return repo;
}
function scopeKey(actor: string, parts: readonly (string | number)[]): string { return JSON.stringify([actor, ...parts]); }
function hasKey(object: object, key: string): boolean { return Object.prototype.hasOwnProperty.call(object, key); }
function checkKey(s: HubSession, family: string, id: string, index: number): string {
  return scopeKey(s.actor.id, [family, id, index]);
}
export function assignments(s: HubSession): Array<typeof courses[number] & { due: string; reviewed: boolean[] }> {
  return courses.map(c => ({...c, due: shiftDay(today(s), c.dueOffset),
    reviewed: c.chapters.map((_, i) => !!store(s).checks[checkKey(s, 'course', c.id, i)])}));
}
export function recordChapter(s: HubSession, id: string, index: number): boolean {
  const c = courses.find(x => x.id === id);
  if (!c || !Number.isInteger(index) || !c.chapters[index]) return false;
  store(s).checks[checkKey(s, 'course', id, index)] = true;
  return true;
}
export function benefitWindow(s: HubSession, key: string): Result<{open: string; close: string}> {
  if (key !== 'current' && key !== 'next') return bad('Choose an available preparation window.');
  const offset = key === 'current' ? -4 : 42;
  return good({open: shiftDay(today(s), offset), close: shiftDay(today(s), offset + 18)});
}
export function benefitChecklist(s: HubSession, id: string, window: string): boolean[] {
  const b = benefits.find(x => x.id === id);
  const w = benefitWindow(s, window);
  return b && w.ok ? b.steps.map((_, i) => !!store(s).checks[checkKey(s, `benefits:${w.value.open}`, id, i)]) : [];
}
export function markBenefit(s: HubSession, id: string, window: string, index: number, done: boolean): boolean {
  const b = benefits.find(x => x.id === id);
  const w = benefitWindow(s, window);
  if (!w.ok || !b || !Number.isInteger(index) || !b.steps[index]) return false;
  store(s).checks[checkKey(s, `benefits:${w.value.open}`, id, index)] = done;
  return true;
}
export function nextSteps(s: HubSession): Array<{id: number; inputs: Record<string, string>; title: string; due: string; label: string}> {
  const items = assignments(s).filter(c => c.reviewed.some(x => !x)).map(c => ({
    id: 10, inputs: { courseId: c.id } as Record<string, string>, title: c.title, due: c.due, label: `${c.minutes} min · Learning`
  }));
  const w = benefitWindow(s, 'current');
  if (w.ok && benefitChecklist(s, 'health', 'current').some(x => !x)) items.push({
    id: 11, inputs: {topic: 'health'}, title: 'Prepare your benefits questions', due: w.value.close, label: 'Checklist · Benefits'
  });
  return items.sort((a, b) => a.due.localeCompare(b.due));
}

export function statements(s: HubSession): Array<{period: string; start: string; end: string; published: string}> {
  let first = `${today(s).slice(0, 7)}-01`;
  return [0, 1, 2].map(() => {
    const end = shiftDay(first, -1);
    first = `${end.slice(0, 7)}-01`;
    let published = end;
    while (dayKind(published) !== 'workday') published = shiftDay(published, -1);
    return {period: end.slice(0, 7), start: first, end, published};
  });
}
export function payLines(s: HubSession, period: string): Result<{
  earnings: Array<[string, number]>; deductions: Array<[string, number]>; gross: number; withheld: number; net: number
}> {
  if (!statements(s).some(p => p.period === period)) return bad('That completed period is unavailable.');
  const earnings: Array<[string, number]> = [['Base earnings', 560000], ['Wellbeing allowance', 8500]];
  if (Number(period.slice(5, 7)) % 3 === 0) earnings.push(['Quarterly recognition', 40000]);
  const deductions: Array<[string, number]> = [['Withholding', 112000], ['Benefits contribution', 14500], ['Savings contribution', 28000]];
  const total = (rows: Array<[string, number]>): number => rows.reduce((n, r) => n + r[1], 0);
  const gross = total(earnings), withheld = total(deductions);
  return good({earnings, deductions, gross, withheld, net: gross - withheld});
}
const grants = [
  {id: 'growth', title: 'Growth award', held: 36, tranches: [{offset: 32, units: 12}, {offset: 126, units: 12}, {offset: 219, units: 12}]},
  {id: 'impact', title: 'Impact award', held: 18, tranches: [{offset: 65, units: 8}, {offset: 249, units: 8}]}
];
export const awardChoices = grants.map(g => ({id: g.id, title: g.title}));
export const horizons: Record<string, number> = {'90d': 90, '180d': 180, '1y': 365};
export function vesting(s: HubSession, awardId: string, horizon: string): Result<{
  title: string; held: number; unvested: number; priceCents: number; close: string; tranches: Array<{date: string; units: number}>
}> {
  const g = grants.find(x => x.id === awardId);
  if (!g || !hasKey(horizons, horizon)) return bad('Select an available award and time horizon.');
  const close = referenceClose(s.now);
  return good({title: g.title, held: g.held, unvested: g.tranches.reduce((a, t) => a + t.units, 0), priceCents: close.cents, close: close.date,
    tranches: g.tranches.filter(t => t.offset <= horizons[horizon]).map(t => ({date: shiftDay(today(s), t.offset), units: t.units}))});
}
export function vestingCalendar(s: HubSession, awardId: string, horizon: string): Result<{title: string; dates: string[]; close: string}> {
  const r = vesting(s, awardId, horizon);
  return r.ok ? good({title: r.value.title, dates: r.value.tranches.map(t => t.date), close: r.value.close}) : r;
}

export function canReview(s: HubSession): boolean {
  return s.actor.reviewer === true && (s.actor.id === peopleSource.reviewerId || s.actor.id === 'operations-reviewer');
}
export function allowedTeam(s: HubSession): string | undefined {
  return canReview(s) ? (s.actor.id === 'operations-reviewer' ? 'operations' : peopleSource.teamId) : undefined;
}
export function teamLabel(team: string): string { return team === 'operations' ? 'Operations' : peopleSource.teamName; }
function ledgerFor(s: HubSession, employee: string, type: LeaveType, year: number): {
  year: number; allowance: number; carry: number; booked: number; pending: number; available: number
} {
  const current = Number(today(s).slice(0, 4));
  const allowance = allowances[type];
  const carry = type === 'annual' && current === year ? 2 : 0;
  const rows = store(s).requests.filter(r => r.employeeId === employee && r.type === type);
  const count = (status: RequestStatus): number => rows.filter(r => r.status === status)
    .reduce((n, r) => n + r.days.filter(d => Number(d.slice(0, 4)) === year).length, 0);
  const booked = count('approved'), pending = count('pending');
  return {year, allowance, carry, booked, pending, available: allowance + carry - booked - pending};
}
export type Ledger = ReturnType<typeof ledgerFor>;
export function myTimeAway(s: HubSession): Array<Pick<LeaveRecord, 'id'|'start'|'end'|'type'|'status'> & {workingDays: number}> {
  return store(s).requests.filter(r => r.employeeId === s.actor.id).reverse()
    .map(r => ({id: r.id, start: r.start, end: r.end, type: r.type, status: r.status, workingDays: r.days.length}));
}
export function balance(s: HubSession, type: string, period: string): Result<Ledger> {
  if (!isLeaveType(type)) return bad('Choose an available leave type.');
  const year = Number(today(s).slice(0, 4));
  if (period !== 'current' && period !== 'next') return bad('Choose the current or next calendar year.');
  return good(ledgerFor(s, s.actor.id, type, year + (period === 'next' ? 1 : 0)));
}
export function defaultRange(s: HubSession): {start: string; end: string} {
  const start = nextWorking(shiftDay(today(s), 1));
  const second = nextWorking(shiftDay(start, 1));
  return {start, end: second.slice(0, 4) === start.slice(0, 4) ? second : start};
}
export interface LeaveDraft { start: string; end: string; type: string; note?: string }
export interface LeaveQuote { employeeId: string; draft: LeaveDraft; days: string[]; holidays: string[]; weekends: number; ledger: Ledger; after: number; asOf: string }
export function quoteLeave(s: HubSession, draft: LeaveDraft): Result<LeaveQuote> {
  const {start, end, type} = draft;
  if (!isLeaveType(type)) return bad('Choose annual leave, sick leave or personal time.');
  if (draft.note && draft.note.length > 240) return bad('Keep the note for your manager to 240 characters or fewer.');
  if (!validDay(start) || !validDay(end)) return bad('Enter a valid start and end date.');
  if (start > end) return bad('The end date must be on or after the start date.');
  if (start <= today(s)) return bad('Choose a start date after today in the Pacific work calendar.');
  if (start.slice(0, 4) !== end.slice(0, 4)) return bad('Request each calendar year separately so the right entitlement is used.');
  if (end > shiftDay(today(s), 365)) return bad('Choose dates within the next 365 days.');
  if (end > shiftDay(start, 30)) return bad('Choose a range of 31 calendar days or fewer.');
  const days: string[] = [], holidays: string[] = [];
  let weekends = 0;
  for (let date = start; date <= end; date = shiftDay(date, 1)) {
    const kind = dayKind(date);
    if (kind === 'workday') days.push(date);
    else if (kind === 'holiday') holidays.push(date);
    else weekends++;
  }
  if (!days.length) return bad('This range contains only weekends or observed holidays. Choose at least one working day.');
  if (store(s).requests.some(r => r.employeeId === s.actor.id && r.status !== 'declined' && r.days.some(d => days.indexOf(d) !== -1))) {
    return bad('A booked or pending request already includes one of these workdays.');
  }
  const ledger = ledgerFor(s, s.actor.id, type, Number(start.slice(0, 4)));
  if (days.length > ledger.available) return bad(`This range exceeds the ${ledger.available} days available.`);
  return good({employeeId: s.actor.id, draft: {...draft}, days, holidays, weekends, ledger, after: ledger.available - days.length, asOf: today(s)});
}
function commandKey(s: HubSession, family: string, command: string): string { return scopeKey(s.actor.id, [family, command]); }
export function commandId(s: HubSession): string { return `step-${++store(s).sequence}`; }
export function submitLeave(s: HubSession, reviewed: LeaveQuote, command: string): Result<string> {
  if (!command.trim()) return bad('Review this request before submitting.');
  if (s.actor.id !== reviewed.employeeId) return bad('This reviewed request belongs to a different employee.');
  const repo = store(s), key = commandKey(s, 'leave', command);
  if (repo.commands[key]) return good(repo.commands[key]);
  const at = leaveActionSession(s), checked = quoteLeave(at, reviewed.draft);
  if (today(at) !== reviewed.asOf) {
    return bad(`The Pacific work date has changed. ${checked.ok ? 'Your dates are preserved; review the updated calculation before confirming.' : `${checked.message} Edit your dates and review again.`}`);
  }
  if (!checked.ok) return checked;
  const q = checked.value;
  if (q.after !== reviewed.after || q.days.join() !== reviewed.days.join()) {
    return bad('The date or balance has changed. Review the updated calculation before submitting.');
  }
  const id = `TA-${++repo.sequence}`;
  repo.requests.push({id, employeeId: s.actor.id, employeeName: s.actor.displayName, ...leaveAssignment(s.actor.id),
    start: q.draft.start, end: q.draft.end, type: q.draft.type as LeaveType, days: q.days.slice(), status: 'pending', revision: 1});
  if (q.draft.note?.trim()) repo.requestNotes[id] = q.draft.note.trim();
  repo.commands[key] = id;
  return good(id);
}
export interface CoverageDay { date: string; roster: number; available: number; target: number; pending: number; band: string }
export function requestCoverage(s: HubSession, workdays: string[]): string {
  const team = leaveAssignment(s.actor.id).teamId;
  return workdays.some(date => {
    const d = capacity(s, team, date);
    return d.available - d.pending - 1 < d.target;
  }) ? 'Your manager will need to check cover.' : 'Coverage stays at or above target.';
}
function capacity(s: HubSession, team: string, date: string): CoverageDay {
  const rows = store(s).requests.filter(r => r.teamId === team && r.days.indexOf(date) !== -1 && r.status !== 'declined');
  const off = (status: RequestStatus): number => new Set(rows.filter(r => r.status === status).map(r => r.employeeId)).size;
  const working = dayKind(date) === 'workday';
  const roster = working ? (team === 'operations' ? 5 : 6) : 0;
  const target = working ? roster - 1 : 0;
  const available = Math.max(0, roster - off('approved')), pending = off('pending');
  const band = !working ? 'Office closed' : available - pending < target ? 'Cover needed' : available - pending === target ? 'At target' : 'Covered';
  return {date, roster, available, target, pending, band};
}
export function coverage(s: HubSession, team: string, week: string): Result<CoverageDay[]> {
  if (!canReview(s) || team !== allowedTeam(s)) return bad('This team forecast is not in your assigned scope.');
  const current = monday(today(s));
  const selected = week === 'current' ? current : week === 'next' ? shiftDay(current, 7) : validDay(week) ? monday(week) : '';
  if (!selected || selected < current || selected > shiftDay(current, 364)) return bad('Choose this week or a week within the next year.');
  return good([0, 1, 2, 3, 4].map(d => capacity(s, team, shiftDay(selected, d))));
}
function assigned(s: HubSession, r: LeaveRecord): boolean {
  return canReview(s) && r.reviewerId === s.actor.id && r.teamId === allowedTeam(s) && r.employeeId !== s.actor.id;
}
export function reviewQueue(s: HubSession, status: string): Result<LeaveRecord[]> {
  if (!canReview(s)) return bad('Only assigned people reviewers can open the decision queue.');
  if (['all', 'pending', 'approved', 'declined'].indexOf(status) < 0) return bad('Choose a valid queue status.');
  return good(store(s).requests.filter(r => assigned(s, r) && (status === 'all' || status === r.status))
    .map(r => ({...r, days: r.days.slice()})));
}
export function reviewEvidence(s: HubSession, id: string): Result<{row: LeaveRecord; note?: string; ledger: Ledger; days: CoverageDay[]}> {
  const r = store(s).requests.find(x => x.id === id);
  if (!r || !assigned(s, r)) return bad('This request is unavailable in your assigned queue.');
  return good({row: {...r, days: r.days.slice()}, note: store(s).requestNotes[id], ledger: ledgerFor(s, r.employeeId, r.type, Number(r.start.slice(0, 4))),
    days: r.days.map(d => capacity(s, r.teamId, d))});
}
export function decisionValidation(value: string, note: string): string | undefined {
  if (value !== 'approved' && value !== 'declined') return 'Choose approve or decline.';
  if (note.trim().length < 5 || note.trim().length > 240) return 'Write a decision note of 5–240 characters. Do not include personal details.';
  return undefined;
}
export function decideLeave(s: HubSession, id: string, revision: number, decision: string, note: string, command: string, reviewedOn?: string): Result<string> {
  const repo = store(s), r = repo.requests.find(x => x.id === id);
  if (!r || !assigned(s, r)) return bad('This request is unavailable in your assigned queue.');
  if (!command.trim()) return bad('Review your decision before confirming.');
  const key = commandKey(s, `decision:${id}`, command);
  if (repo.commands[key]) return good(repo.commands[key]);
  if (r.revision !== revision) return bad('The request revision has changed. Reopen the current record.');
  if (r.status !== 'pending') return bad('This request already has a decision.');
  const at = leaveActionSession(s);
  if (r.start <= today(at)) return bad('This request is no longer upcoming. No decision was recorded.');
  if (reviewedOn && reviewedOn !== today(at)) return bad('The Pacific work date has changed. Review the current request and coverage again before confirming.');
  const error = decisionValidation(decision, note);
  if (error) return bad(error);
  r.status = decision as RequestStatus;
  r.revision++;
  const receipt = `${r.id} · r${r.revision}`;
  repo.decisions[key] = {requestId: id, revision: r.revision, status: r.status, reviewer: s.actor.id, note: note.trim(), date: today(at)};
  repo.commands[key] = receipt;
  return good(receipt);
}
export interface CaseDraft { category: string; channel: string; subject: string; body: string }
export function checkCase(draft: CaseDraft): string | undefined {
  if (!hasKey(caseCategories, draft.category) || !hasKey(channels, draft.channel)) return 'Choose a listed category and confidential channel.';
  if (draft.subject.trim().length < 5 || draft.subject.trim().length > 100) return 'Write a subject of 5–100 characters.';
  if (draft.body.trim().length < 10 || draft.body.trim().length > 1200) return 'Write a question of 10–1,200 characters.';
  return undefined;
}
export function submitCase(s: HubSession, draft: CaseDraft, command: string): Result<CaseReceipt> {
  const error = checkCase(draft);
  if (error) return bad(error);
  if (!command.trim()) return bad('Review the recipient before creating a case.');
  const repo = store(s), key = commandKey(s, 'case', command);
  if (!repo.cases[key]) repo.cases[key] = {id: `HR-${++repo.sequence}`, category: draft.category as Category, channel: draft.channel as Channel, created: today(s)};
  return good({...repo.cases[key]});
}
