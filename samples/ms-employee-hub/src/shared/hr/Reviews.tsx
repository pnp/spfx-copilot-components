import * as React from 'react';
import type { SurfaceProps } from '../types';
import {
  allowedTeam, canReview, commandId, coverage, dayLabel, decideLeave, decisionValidation, leaveActionSession, monday,
  leaveName, peopleSource, requesterProfile, reviewEvidence, reviewQueue, shiftDay, teamLabel, today
} from '../mockData/people';
import type { CoverageDay } from '../mockData/people';
import { Action, Choices, Detail, ErrorNote, Field, Receipt, Source, Task, valueOf } from './Frame';

function Denied({p}: {p: SurfaceProps}): React.ReactElement {
  return <Task p={p} slug={p.id === 16 ? 'coverage' : 'leave-decisions'} label="Workplace resources" title="Assigned reviewers only."
    lead="Your current assignment does not include this team or its leave decisions." stage="denied">
    <Action secondary onClick={() => p.navigate(14)}>View my own time balance</Action></Task>;
}
function CapacityTable({days, selected, choose}: {days: CoverageDay[]; selected?: string; choose?: (date: string) => void}): React.ReactElement {
  return <table className="hrw-table"><caption>Capacity by workday · people</caption><thead><tr><th scope="col">Date</th>
    <th scope="col">Available</th><th scope="col">Pending</th><th scope="col">Target</th></tr></thead>
    <tbody>{days.map(d => <tr key={d.date}><th scope="row">{choose ? <button type="button" aria-pressed={selected === d.date} onClick={() => choose(d.date)}>
      {dayLabel(d.date, true)}</button> : dayLabel(d.date, true)}</th><td>{d.available} / {d.roster}</td><td>{d.pending}</td><td>{d.target}</td></tr>)}</tbody></table>;
}
export function Coverage(p: SurfaceProps): React.ReactElement {
  const scoped = allowedTeam(p.session);
  const [team, setTeam] = React.useState(valueOf(p, 'teamId', scoped || ''));
  const [week, setWeek] = React.useState(valueOf(p, 'week', 'next'));
  const [day, select] = React.useState('');
  if (!scoped) return <Denied p={p}/>;
  const read = coverage(p.session, team, week);
  const selected = read.ok && (read.value.find(d => d.date === day) || read.value.find(d => d.band === 'Cover needed') || read.value[0]);
  return <Task p={p} slug="coverage" label="Workplace resources / Reviewer" title="Plan team coverage." lead="Inspect the capacity forecast, not the reasons people are away." stage={read.ok ? 'selection' : team !== scoped ? 'denied' : 'unavailable'}>
    <Detail p={p} label="Choose planning week"><div className="hrw-tools">{team===scoped?<strong>{teamLabel(scoped)}</strong>:<Action secondary onClick={()=>setTeam(scoped)}>Use my assigned team</Action>}
      <Field label="Week containing"><input type="date" value={week === 'next' || week === 'current' ? shiftDay(monday(today(p.session)), week === 'next' ? 7 : 0) : week}
        onChange={e => { setWeek(e.target.value); select(''); }}/></Field></div></Detail>
    {read.ok && selected ? <div className="hrw-columns">{p.mode === 'full' && <div className="hrw-paper"><span className="hrw-kicker">{teamLabel(team)}</span>
      <h3>Week of {dayLabel(read.value[0].date)}</h3><div className="hrw-bands" aria-label="Select a day's forecast">
        {read.value.map(d => <button key={d.date} type="button" aria-pressed={d.date === selected.date} onClick={() => select(d.date)}>
          <small>{dayLabel(d.date, true)}</small><span className="hrw-roster" aria-hidden="true">{Array.from({length:d.roster},(_,i)=>
            <i key={i} className={i<d.available-d.pending?'hrw-on':i<d.available?'hrw-reserved':''}/>)}</span>
          <strong>{d.band}</strong></button>)}</div><p className="hrw-roster-key">Each mark is one person: solid is available, striped is pending and pale is already booked.</p>
        <CapacityTable days={read.value} selected={selected.date} choose={select}/></div>}
      <aside className="hrw-aside hrw-sand"><span className="hrw-kicker">{teamLabel(team)} · {dayLabel(selected.date)}</span><h3>{selected.band}</h3>
        <p><strong>{Math.max(0, selected.available - selected.pending)} forecast available</strong> against a target of {selected.target}. Currently {selected.available} of {selected.roster} are available, with {selected.pending} pending {selected.pending === 1 ? 'request' : 'requests'}.</p>
        {p.mode === 'full' && <Action secondary onClick={() => p.navigate(17)}>Open assigned decisions</Action>}</aside>
      {p.mode === 'inline' && <Detail p={p} label={`Compare all workdays · week of ${dayLabel(read.value[0].date, true)}`}><CapacityTable days={read.value} selected={selected.date} choose={select}/></Detail>}</div> :
      <ErrorNote>{!read.ok ? read.message : 'No working days in this forecast.'}</ErrorNote>}
    <Source>{peopleSource.calendar} · Capacity forecast · No individual absence reasons</Source>
  </Task>;
}
function RequesterAvatar({name, profile}: {name: string; profile: ReturnType<typeof requesterProfile>}): React.ReactElement {
  return <span className="hrw-avatar" aria-hidden="true" data-photo={profile ? true : undefined}
    style={profile ? {backgroundPosition: `${profile.tile * 20}% center`} : undefined}>{!profile && name.slice(0, 1)}</span>;
}
export function Review(p: SurfaceProps): React.ReactElement {
  const [status, filter] = React.useState(valueOf(p, 'status', 'all'));
  const [query, search] = React.useState('');
  const [limit, setLimit] = React.useState(4);
  const rows = reviewQueue(p.session, status), all = reviewQueue(p.session, 'all');
  const [id, select] = React.useState(valueOf(p, 'requestId', ''));
  const [decision, choose] = React.useState('');
  const [note, write] = React.useState('');
  const [prepared, prepare] = React.useState<{revision: number; key: string; asOf: string}>();
  const [basis, setBasis] = React.useState(p.session.now);
  const [receipt, save] = React.useState('');
  const [error, fail] = React.useState('');
  if (!canReview(p.session)) return <Denied p={p}/>;
  const item = reviewEvidence({...p.session, now: basis}, id);
  const matches = rows.ok && rows.value.some(x => x.id === id);
  const clear = (): void => { choose(''); write(''); prepare(undefined); save(''); fail(''); };
  const selectRow = (v: string): void => { clear(); select(v); };
  const inQueue = !id || !!receipt;
  const visible = rows.ok ? rows.value.filter(r => `${r.employeeName} ${r.id}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b) => (receipt ? Number(b.id===id)-Number(a.id===id) : 0) || Number(b.status==='pending')-Number(a.status==='pending') ||
      (a.status==='pending'?a.start.localeCompare(b.start):b.start.localeCompare(a.start)) || a.id.localeCompare(b.id)) : [];
  const stage = receipt ? 'receipt' : prepared ? 'review' : !rows.ok || (!!id && !matches) ? 'unavailable' :
    !inQueue && item.ok && item.value.row.status === 'pending' ? 'draft' : 'selection';
  return <Task p={p} slug="leave-decisions" label="Manager / Assigned requests" title={inQueue ? 'Time-off reviews.' : 'Review time off.'} lead="Select a colleague’s request to check coverage and record a decision." stage={stage} scope={{filters:{status}}}>
    {receipt && <Receipt title="Decision recorded in this session" reference={receipt}>{item.ok && item.value.row.employeeName} · {decision === 'approved' ? 'Approved' : 'Declined'}. The request and entitlement are updated below and in the employee’s ledger.</Receipt>}
    {inQueue ? <><div className="hrw-ledger-controls"><Choices label="Filter requests by status" value={status}
      items={(['all','pending','approved','declined'] as const).map(s => [s,`${s==='all'?'All':s[0].toUpperCase()+s.slice(1)} (${all.ok ? all.value.filter(r=>s==='all'||r.status===s).length : 0})`])}
      onChange={s=>{filter(s);setLimit(4);selectRow('');}}/><Field label="Find a requester"><input type="search" value={query} onChange={e=>{search(e.target.value);setLimit(4);}} placeholder="Name or request ID"/></Field></div>
      {rows.ok ? <ul className="hrw-review-queue" aria-label="Assigned leave requests">{visible.slice(0,limit).map(r=>{
        const profile=requesterProfile(r.employeeId);
        return <li key={r.id}><button type="button" className="hrw-review-row" data-updated={!!receipt && r.id===id} onClick={()=>selectRow(r.id)}>
          <RequesterAvatar name={r.employeeName} profile={profile}/>
          <span className="hrw-person"><strong>{r.employeeName}</strong><small>{profile?.role || 'Team member'} · {r.id}</small></span>
          <span className="hrw-request-dates"><strong>{r.start===r.end?dayLabel(r.start):`${dayLabel(r.start,true)} – ${dayLabel(r.end)}`}</strong><small>{leaveName[r.type]} · {r.days.length} {r.days.length===1?'workday':'workdays'}</small></span>
          <b className="hrw-status" data-status={r.status}>{r.status==='pending'?'Pending':r.status==='approved'?'Approved':'Declined'}</b><span aria-hidden="true">›</span></button></li>;
      })}</ul> : <ErrorNote>{rows.message}</ErrorNote>}
      {visible.length>limit&&<Action secondary onClick={()=>setLimit(limit+4)}>Show more requests</Action>}
      {rows.ok&&!visible.length&&<p role="status">{query?'No requests match this search.':'No assigned requests match this status.'}</p>}</> :
      <><Action secondary onClick={()=>selectRow('')}>Back to requests</Action>
        {(matches || prepared) && item.ok ? <div className="hrw-columns"><article className="hrw-paper">
          <header className="hrw-review-heading"><RequesterAvatar name={item.value.row.employeeName} profile={requesterProfile(item.value.row.employeeId)}/>
            <div><span className="hrw-kicker">{item.value.row.id} · Revision {item.value.row.revision} · {item.value.row.status}</span>
              <h3>{item.value.row.employeeName}</h3></div></header>
          <p>{dayLabel(item.value.row.start)} – {dayLabel(item.value.row.end)} · {item.value.row.days.length} working {item.value.row.days.length === 1 ? 'day' : 'days'}</p>
          {item.value.note && <p className="hrw-private-text"><strong>Employee note: </strong>{item.value.note}</p>}
          <p><strong>{item.value.ledger.available} days available</strong>, with {item.value.ledger.pending} reserved for pending requests.</p>
          <Detail p={p} label={`${item.value.days.some(d => d.band === 'Cover needed') ? 'Cover needed' : 'Coverage forecast'} · inspect daily capacity`}><CapacityTable days={item.value.days}/></Detail>
          {item.value.row.status === 'pending' && !prepared && <><Choices label="Decision" value={decision} items={[['approved','Approve'],['declined','Decline']]} onChange={choose}/>
            <Field label="Decision note"><textarea rows={2} maxLength={240} value={note} onChange={e => write(e.target.value)} placeholder="Brief operational context; no personal details."/></Field>
            <Action onClick={() => { const at = leaveActionSession(p.session);
              const problem = item.value.row.start <= today(at) ? 'This request is no longer upcoming. No decision was recorded.' : decisionValidation(decision, note);
              fail(problem || ''); setBasis(at.now);
              if (!problem) prepare({revision: item.value.row.revision, key: commandId(p.session), asOf: today(at)}); }}>Review decision</Action></>}
          {prepared && <div className="hrw-impact"><h4>Review before confirming</h4>
            <p>{decision === 'approved' ? 'Approve' : 'Decline'} {id} at revision {prepared.revision}.</p><blockquote>{note.trim()}</blockquote>
            <div className="hrw-actions"><Action onClick={() => {
              const at = leaveActionSession(p.session), done = decideLeave(at, id, prepared.revision, decision, note, prepared.key, prepared.asOf);
              if (done.ok) { save(done.value); write(''); prepare(undefined); filter('all'); } else { fail(done.message); if (prepared.asOf !== today(at)) { setBasis(at.now); prepare(undefined); } }
            }}>Confirm decision</Action><Action secondary onClick={() => { prepare(undefined); fail(''); }}>Edit decision</Action></div></div>}
          {error && <ErrorNote>{error}</ErrorNote>}{prepared && item.value.row.revision !== prepared.revision &&
            <Action secondary onClick={() => { clear(); filter(item.value.row.status); }}>Reopen current revision</Action>}</article>
          {p.mode === 'full' && <aside className="hrw-aside hrw-sand"><span className="hrw-kicker">Coverage evidence</span><h3>{item.value.days.some(d => d.band === 'Cover needed') ? 'Check cover first.' : 'Review the forecast.'}</h3>
            <dl className="hrw-evidence-brief"><div><dt>Working days requested</dt><dd>{item.value.row.days.length}</dd></div>
              <div><dt>Forecast days below target</dt><dd>{item.value.days.filter(d => d.band === 'Cover needed').length} of {item.value.days.length}</dd></div>
              <div><dt>Available entitlement</dt><dd>{item.value.ledger.available} days</dd></div></dl>
            <p>Pending requests reserve entitlement but do not yet reduce booked availability. Compare available people minus pending requests with the daily target.</p>
            <Action secondary onClick={() => p.navigate(16, {teamId: item.value.row.teamId, week: item.value.row.start})}>Compare the week</Action></aside>}</div> :
          <p className="hrw-impact" role="status">{!rows.ok ? rows.message : id ? 'No matching request in this assigned queue. Choose another record or status.' : 'No assigned requests match this status.'}</p>}</>}
    <Source>Assigned people review · Decisions apply to this session only</Source>
  </Task>;
}
