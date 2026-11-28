import * as React from 'react';
import type { SurfaceProps } from '../types';
import {
  allowedTeam, balance, commandId, coverage, dayLabel, defaultRange, leaveActionSession, leaveName, leaveTypes,
  leaveApprover, monday, myTimeAway, peopleSource, quoteLeave, requestCoverage, shiftDay, submitLeave, today, validDay
} from '../mockData/people';
import type { Ledger, LeaveDraft, LeaveQuote } from '../mockData/people';
import { Action, Choices, Detail, ErrorNote, Field, Receipt, Source, Task, valueOf } from './Frame';
import Calendar from './Calendar';

const ledgerColumns: Array<{key: keyof Omit<Ledger, 'year'>; title: string; detail: string}> = [
  {key: 'allowance', title: 'Year allowance', detail: 'The starting entitlement for this leave type in this calendar year.'},
  {key: 'carry', title: 'Opening carryover', detail: 'This illustrative calendar credits two annual days in the current year. No future carryover is projected; personal time does not carry.'},
  {key: 'booked', title: 'Booked / used', detail: 'Opening used time plus approved working days. Weekends and observed holidays do not use an entitlement day.'},
  {key: 'pending', title: 'Pending review', detail: 'Requested working days are reserved while a decision is pending. A decline releases them.'},
  {key: 'available', title: 'Available', detail: 'Year allowance plus opening carryover, less booked and pending days.'}
];
function TypeField({type, select}: {type: string; select: (v: string) => void}): React.ReactElement {
  return <Choices label="Leave type" value={type} onChange={select} items={leaveTypes.map(t => [t, leaveName[t]])}/>;
}
function LedgerLines({ledger}: {ledger: Ledger}): React.ReactElement {
  return <dl className="hrw-lines">{ledgerColumns.map(col => <div key={col.key} className={col.key === 'available' ? 'hrw-total' : ''}>
    <dt>{col.title}</dt><dd>{ledger[col.key]} days</dd></div>)}</dl>;
}
function LedgerGraphic({ledger}: {ledger: Ledger}): React.ReactElement {
  const total = ledger.allowance+ledger.carry;
  return <div className="hrw-balance-meter"><div className="hrw-meter-strip" aria-hidden="true">{(['available','booked','pending'] as const).map(k=><i key={k} className={`hrw-meter-${k}`} style={{flexGrow:Math.max(0,ledger[k])}}/>)}</div>
    <p>{ledger.available} available out of {total} days allocated</p></div>;
}
export function Balance(p: SurfaceProps): React.ReactElement {
  const [type, setType] = React.useState(valueOf(p, 'leaveType', 'annual'));
  const [period, setPeriod] = React.useState(valueOf(p, 'period', 'current'));
  const read = balance(p.session, type, period);
  return <Task p={p} slug="time-balance" label="Benefits / Time" title="Your time-away ledger." lead="See what is booked, what is waiting and what is still available." stage={read.ok ? 'information' : 'unavailable'} scope={{filters:{period}}}>
    <div className="hrw-ledger-controls"><TypeField type={type} select={setType}/>
      <Choices label="Entitlement period" value={period} onChange={setPeriod} items={[['current','Current year'],['next','Next year']]}/></div>
    {read.ok ? <div className="hrw-columns"><div className="hrw-paper"><span className="hrw-kicker">{read.value.year} · {leaveName[type as keyof typeof leaveName]}</span>
      <h3><span className="hrw-number">{read.value.available}</span> days available</h3><LedgerGraphic ledger={read.value}/>
      <p>{read.value.booked} booked / used · {read.value.pending} pending</p><Action onClick={() => p.navigate(15, {leaveType: type})}>Plan time away</Action></div>
      <Detail p={p} label="Entitlement breakdown & carryover"><aside className="hrw-aside"><h3>Behind the balance</h3><LedgerLines ledger={read.value}/>
        {ledgerColumns.map(col=><details key={col.key} className="hrw-detail"><summary>{col.title}</summary><p>{col.detail}</p></details>)}</aside></Detail></div> : <ErrorNote>{read.message}</ErrorNote>}
    <Source>{peopleSource.calendar} · Employee entitlements · As of {dayLabel(today(p.session))}</Source>
  </Task>;
}

export function TimeRequest(p: SurfaceProps): React.ReactElement {
  const range = defaultRange(p.session);
  const [listing, list] = React.useState(!['startDate','endDate','leaveType'].some(k => p.inputs[k] !== undefined));
  const [limit, setLimit] = React.useState(3);
  const [draft, setDraft] = React.useState<LeaveDraft>(() => {
    const start = valueOf(p, 'startDate', valueOf(p, 'endDate', range.start));
    return {start, end: valueOf(p, 'endDate', p.inputs.startDate !== undefined ? start : range.end), type: valueOf(p, 'leaveType', 'annual')};
  });
  const [review, setReview] = React.useState<{quote: LeaveQuote; key: string}>();
  const [receipt, setReceipt] = React.useState('');
  const [fault, setFault] = React.useState('');
  const [basis, setBasis] = React.useState(p.session.now);
  const live = quoteLeave({...p.session, now: basis}, draft);
  const q = review?.quote || (live.ok ? live.value : undefined);
  const stage = listing ? 'selection' : receipt ? 'receipt' : review ? 'review' : 'draft';
  function showRequests(): void {
    setReview(undefined); setReceipt(''); setFault(''); setDraft({start:'', end:'', type:'annual'}); setLimit(3); list(true);
  }
  function edit(part: Partial<LeaveDraft>): void { setFault(''); setDraft(v => ({...v, ...part})); }
  function prepare(): void {
    const at = leaveActionSession(p.session), checked = quoteLeave(at, draft);
    setBasis(at.now);
    if (!checked.ok) { setFault(checked.message); return; }
    setReview({quote: checked.value, key: commandId(p.session)}); setFault('');
  }
  function confirm(): void {
    if (!review) return;
    const at = leaveActionSession(p.session);
    const result = submitLeave(at, review.quote, review.key);
    if (result.ok) { setReceipt(result.value); setFault(''); }
    else { setBasis(at.now); setReview(undefined); setFault(result.message); }
  }
  const team = allowedTeam(p.session);
  const forecast = team && q && validDay(q.draft.start) ? coverage(p.session, team, monday(q.draft.start)) : undefined;
  const short = forecast?.ok ? forecast.value.filter(d => d.band === 'Cover needed').length : undefined;
  const requests = listing ? myTimeAway(p.session) : [];
  const annual = listing ? balance(p.session, 'annual', 'current') : undefined;
  return <Task p={p} slug="time-request" label="Time off / Private to you" title={listing ? 'Your time off.' : receipt ? 'Time off submitted.' : review ? 'Review your time away.' : 'Request time off.'}
    lead={receipt ? 'Your request is pending a separate review.' : 'Try a date range and see its effect on your available time.'} stage={stage}>
    {listing ? <><div className="hrw-actions"><Action onClick={() => {setDraft({start:'',end:'',type:'annual'}); list(false);}}>Request new time off</Action>
      {annual?.ok && <span className="hrw-balance-badge">{annual.value.available} annual leave days available</span>}</div>
      <h3 className="hrw-list-title">Submitted requests</h3><ul className="hrw-request-list" aria-label="Your submitted time-off requests">{requests.slice(0, limit).map(r =>
        <li key={r.id}><time dateTime={r.start}>{dayLabel(r.start, true)}</time><span><strong>{leaveName[r.type]} · {r.start === r.end ? dayLabel(r.start) : `${dayLabel(r.start,true)} – ${dayLabel(r.end)}`}</strong>
          <small>{r.workingDays} working {r.workingDays === 1 ? 'day' : 'days'} · {r.id}</small></span><b data-status={r.status}>{r.status === 'pending' ? 'Pending approval' : r.status === 'approved' ? 'Approved' : 'Declined'}</b></li>)}</ul>
      {!requests.length && <p>No time-off requests submitted yet.</p>}{requests.length > limit && <Action secondary onClick={() => setLimit(limit+3)}>Show more requests</Action>}</> :
      receipt ? <><Receipt title="Request received in this session" reference={receipt}>{leaveName[draft.type as keyof typeof leaveName]} · {dayLabel(draft.start)} – {dayLabel(draft.end)} · {review?.quote.days.length} working {review?.quote.days.length === 1 ? 'day' : 'days'}. Pending approval from {leaveApprover(p.session)}. No HR system was contacted.</Receipt>
      <div className="hrw-actions"><Action onClick={showRequests}>View submitted requests</Action><Action secondary onClick={() => p.navigate(14, {leaveType: draft.type, period: draft.start.slice(0, 4) === today(p.session).slice(0, 4) ? 'current' : 'next'})}>See updated ledger</Action></div></> :
      <div className="hrw-columns"><article className="hrw-paper">{p.mode === 'full' && <span className="hrw-kicker">{review ? '02 / Review' : '01 / Choose dates'}</span>}
        {review ? <><h3>{leaveName[review.quote.draft.type as keyof typeof leaveName]}</h3>
          <p>{dayLabel(draft.start)} – {dayLabel(draft.end)}<br/>Approver: {leaveApprover(p.session)}.</p>{draft.note?.trim() && <blockquote className="hrw-private-text">{draft.note.trim()}</blockquote>}</> :
          <><Action secondary onClick={showRequests}>Back to requests</Action>{p.mode === 'full' && <h3>When would you like to be away?</h3>}<TypeField type={draft.type} select={type => edit({type})}/>
            <div className="hrw-dates"><Field label="Start date"><input type="date" value={draft.start} min={shiftDay(today({...p.session, now:basis}), 1)} onChange={e => edit({start: e.target.value})}/></Field>
              <Field label="End date"><input type="date" value={draft.end} min={draft.start} onChange={e => edit({end: e.target.value})}/></Field></div>
            <Field label="Note for your manager (optional)"><textarea rows={2} maxLength={240} placeholder="Add handoff or coverage details. No medical information needed." value={draft.note || ''} onChange={e => edit({note:e.target.value})}/></Field></>}
        {q && <div className="hrw-impact" aria-live="polite"><h4>{q.days.length} eligible {q.days.length === 1 ? 'workday' : 'workdays'}</h4>
          <p>{q.ledger.available} days before → <strong>{q.after} days after</strong></p>
          <p>{requestCoverage(p.session, q.days)}</p>
          <small>{q.weekends} weekend {q.weekends === 1 ? 'day' : 'days'} and {q.holidays.length} observed {q.holidays.length === 1 ? 'holiday' : 'holidays'} excluded{q.holidays.length ? ` (${q.holidays.map(d => dayLabel(d, true)).join(', ')})` : ''}.</small>
        </div>}
        {(!live.ok && !review && draft.start && draft.end || fault) && <ErrorNote>{fault || (!live.ok && live.message)}</ErrorNote>}
        <div className="hrw-actions">{review ? <><Action onClick={confirm}>Confirm time-off request</Action>
          <Action secondary onClick={() => { setReview(undefined); setFault(''); }}>Edit dates</Action></> :
          <Action disabled={!live.ok} onClick={prepare}>Review request</Action>}</div>
        {p.mode === 'full' && <p className="hrw-caption">No reason is required. Only confirmation creates a pending session request.</p>}</article>
        {p.mode === 'full' && <><Calendar draft={draft} now={today({...p.session,now:basis})} edit={review ? undefined : edit}/>
          <aside className="hrw-ledger-sheet"><div><span className="hrw-kicker">Alongside your dates</span><h3>Entitlement ledger</h3>
            {q && <LedgerGraphic ledger={q.ledger}/>}
            {short !== undefined && <p><strong>Team forecast:</strong> {short} {short === 1 ? 'day' : 'days'} below target in the selected week, before this request.</p>}</div>
            {q ? <LedgerLines ledger={q.ledger}/> : <p>A valid range shows your dated entitlement here.</p>}
          </aside></>}</div>}
    <Source>{peopleSource.calendar} · Monday–Friday · Observed Jan 1, Jul 4 and Dec 25</Source>
  </Task>;
}
