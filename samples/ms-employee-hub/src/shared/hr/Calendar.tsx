import * as React from 'react';
import { dayKind, dayLabel, monday, shiftDay, validDay } from '../mockData/people';
import type { LeaveDraft } from '../mockData/people';

const headings = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function monthName(month: string): string {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'});
}
function stepMonth(month: string, delta: number): string {
  const d = new Date(`${month}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth()+delta);
  return d.toISOString().slice(0,7);
}
export default function Calendar({draft, now, edit}: {draft: LeaveDraft; now: string; edit?: (part: Partial<LeaveDraft>) => void}): React.ReactElement {
  const min = shiftDay(now,1), max = shiftDay(now,365), heading = React.useId();
  const monthFor = (d: string): string => (validDay(d) && d >= min && d <= max ? d : min).slice(0,7);
  const selectedMonth = monthFor(draft.start);
  const [month, setMonth] = React.useState(selectedMonth), [field, setField] = React.useState<'start'|'end'>('start');
  const [active, setActive] = React.useState(draft.start), grid = React.useRef<HTMLTableElement>(null);
  React.useEffect(() => { setMonth(selectedMonth); }, [selectedMonth]);
  const first = monday(`${month}-01`), last = shiftDay(`${stepMonth(month,1)}-01`,-1), weeks: string[][] = [];
  for (let week=first; week<=last; week=shiftDay(week,7)) weeks.push(headings.map((_,i)=>shiftDay(week,i)));
  const allowed = (d: string): boolean => d >= min && d <= max && d.slice(0,7) === month && dayKind(d) === 'workday';
  const focusDay = allowed(active) ? active : weeks.reduce<string[]>((all,w)=>all.concat(w),[]).find(allowed);
  const changeMonth = (to: string): void => { setMonth(to); setActive(''); };
  function choose(date: string): void {
    if (!edit || !allowed(date)) return;
    if (field==='start') { edit({start:date,...(!validDay(draft.end) || draft.end<date ? {end:date} : {})}); }
    else { edit({end:date}); }
    setActive(date);
  }
  function move(e: React.KeyboardEvent<HTMLInputElement>, date: string): void {
    const days = Array.from(grid.current?.querySelectorAll<HTMLInputElement>('input:not(:disabled)') || []);
    const idx = days.indexOf(e.currentTarget);
    let dest: HTMLInputElement | undefined;
    if (e.key==='ArrowRight') dest=days[idx+1];
    else if (e.key==='ArrowLeft') dest=days[idx-1];
    else if (e.key==='Home') dest=days[0];
    else if (e.key==='End') dest=days[days.length-1];
    else if (e.key==='Enter') dest=e.currentTarget;
    else if (e.key==='ArrowUp'||e.key==='ArrowDown') dest=days.find(b=>b.value===shiftDay(date,e.key==='ArrowUp'?-7:7));
    else return;
    e.preventDefault(); if(dest){dest.focus();dest.click();}
  }
  return <section className="hrw-month" aria-labelledby={heading}>
    <header><div><span className="hrw-kicker">Working calendar</span><h4 id={heading}>{monthName(month)}</h4></div>
      <div className="hrw-month-controls">
        <button type="button" aria-label="Previous calendar month" disabled={month<=min.slice(0,7)} onClick={()=>changeMonth(stepMonth(month,-1))}>‹</button>
        <button type="button" aria-label="Next calendar month" disabled={month>=max.slice(0,7)} onClick={()=>changeMonth(stepMonth(month,1))}>›</button>
      </div></header>
    {edit && <div className="hrw-picker-switch" role="group" aria-label="Choose the date to set"><span>Set</span>
      {(['start','end'] as const).map(f=><button key={f} type="button" aria-pressed={field===f} onClick={()=>{setField(f);setMonth(monthFor(draft[f]));setActive(draft[f]);}}>
        {f==='start'?'Start date':'End date'}</button>)}</div>}
    <table ref={grid} aria-label={`${monthName(month)} working calendar`}><thead><tr>{headings.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{weeks.map(w=><tr key={w[0]}>{w.map(date=>{
        const inside=date.slice(0,7)===month, kind=dayKind(date), eligible=allowed(date);
        const inRange=inside && date>=draft.start && date<=draft.end;
        const edge=inRange&&(date===draft.start||date===draft.end);
        const text=`${dayLabel(date)}${kind!=='workday'?` · ${kind}`:''}${inRange?' · in selected range':''}`;
        return <td key={date} className={[inRange&&kind==='workday'?'hrw-day-range':'',edge?'hrw-day-edge':'',kind!=='workday'?'hrw-day-closed':''].join(' ')}>
          {inside && (edit ? <label className="hrw-date-choice"><input type="radio" name={`${heading}-${field}`} aria-label={`Set ${field} date: ${text}`} value={date}
            checked={date===draft[field]} aria-current={date===now?'date':undefined} tabIndex={date===focusDay?0:-1} disabled={!eligible}
            onKeyDown={e=>move(e,date)} onFocus={()=>setActive(date)} onChange={()=>choose(date)}/><span>{Number(date.slice(-2))}</span></label>
            : <span aria-label={text}>{Number(date.slice(-2))}</span>)}</td>;
      })}</tr>)}</tbody></table>
    <small className="hrw-month-key"><i aria-hidden="true"/> Selected workdays <span aria-hidden="true">/</span> Weekends and holidays excluded</small>
  </section>;
}
