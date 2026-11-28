import * as React from 'react';
import type {HubSession} from '../types';
import {candidates,officeFor,rooms} from '../mockData/workplace';
import type {RoomDraft,HubEvent} from '../mockData/workplace';
import styles from './Company.module.scss';

export function KeepEvent({event,session}:{event:HubEvent; session:HubSession}):React.ReactElement {
  const [ids,set]=React.useState<string[]>(()=>session.memory.get('company.savedEvents') as string[]||[]);
  const selected=ids.includes(event.id);
  return <button type="button" aria-pressed={selected} onClick={()=>{
    const next=selected?ids.filter(id=>id!==event.id):[...ids,event.id];session.memory.set('company.savedEvents',next);set(next);
  }}>{selected?'Remove from saved events':'Save to my events'}</button>;
}
export function RoomDay({draft,session,update}:{draft:RoomDraft;session:HubSession;update:(time:string)=>void}):React.ReactElement {
  const group=React.useId();
  const office=officeFor(draft.officeId);
  if(!office)return <p role="status">Choose a listed office to see its schedule.</p>;
  const times=Array.from(new Set([draft.startTime,...Array.from({length:10},(_,i)=>`${String(i+8).padStart(2,'0')}:00`)])).sort();
  return <section className={styles.schedule}><p className={styles.label}>Workplace planner / {office.city}</p><h3>The day at a glance.</h3>
    <p>{draft.date} · {office.zone}. Available rooms for {draft.capacity||0} people and {draft.durationMinutes} minutes. Select a time to see the matching rooms.</p>
    <div>{times.filter(t=>/^\d\d:\d\d$/.test(t)).map(time=>{
      const available=candidates({...draft,startTime:time},session);
      return <label key={time}><input type="radio" name={group} value={time} checked={draft.startTime===time} disabled={!available.length} onChange={()=>update(time)}/><span><b>{time}</b><small>{available.length?`${available.length} of ${rooms.filter(r=>r.officeId===office.id).length} rooms`:'Unavailable'}</small></span></label>;
    })}</div></section>;
}
