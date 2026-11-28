import * as React from 'react';
import type {SurfaceProps} from '../types';
import {candidates,checkSlot,defaultRoomDate,officeFor,offices,reserve,rooms} from '../mockData/workplace';
import type {Reservation,RoomDraft} from '../mockData/workplace';
import {useHubVisibleScope} from '../../hosts/VisibleScope';
import {RoomDay} from './WorkplacePlan';
import styles from './Company.module.scss';

type Stage='criteria'|'searching'|'results'|'review'|'receipt';
export default function RoomBooking(p:SurfaceProps):React.ReactElement {
  const [draft,setDraft]=React.useState<RoomDraft>(()=>{
    const officeId=String(p.inputs.officeId??'LON'),office=officeFor(officeId);
    return {officeId:office?.id??officeId,date:String(p.inputs.date??defaultRoomDate(p.session.now,office?.zone??'UTC')),
      startTime:String(p.inputs.startTime??'10:00'),durationMinutes:Number(p.inputs.durationMinutes??30),
      capacity:Number(p.inputs.capacity??6),accessible:p.inputs.accessible===undefined||p.inputs.accessible===true||p.inputs.accessible==='true'};
  });
  const [stage,setStage]=React.useState<Stage>('criteria'),[selected,select]=React.useState(''),[error,setError]=React.useState('');
  const [receipt,setReceipt]=React.useState<Reservation>(),[key,setKey]=React.useState(()=>crypto.randomUUID());
  const office=officeFor(draft.officeId),room=rooms.find(r=>r.id===selected),heading=React.useRef<HTMLHeadingElement>(null),last=React.useRef(stage);
  const now=():Date=>p.session.clock?.()??p.session.now;
  const warning=checkSlot(draft,now()),matches=stage==='results'?candidates(draft,{...p.session,now:now()}):[];
  useHubVisibleScope({entry:p.id,stage:stage==='receipt'?'receipt':stage==='review'?'review':stage==='results'?'selection':'draft',filters:{officeId:office?.id}});
  React.useEffect(()=>{
    if(stage!=='searching')return;
    // Simulate the local availability lookup without scheduling work after a view is dismissed.
    const timer=setTimeout(()=>setStage('results'),350);
    return ()=>clearTimeout(timer);
  },[stage]);
  React.useLayoutEffect(()=>{
    if(last.current!==stage&&stage!=='searching')heading.current?.focus();
    last.current=stage;
  },[stage]);
  const update=(patch:Partial<RoomDraft>):void=>{setDraft(d=>({...d,...patch}));select('');setError('');};
  const confirm=():void=>{
    if(stage!=='review'||!room||receipt)return;
    try {const booking=reserve(draft,room.id,key,p.session);setReceipt(booking);setStage('receipt');}
    catch(e){setError(e instanceof Error?e.message:'Unable to reserve the room.');select('');setStage('results');}
  };
  const titles={criteria:'Find a room',searching:'Checking availability',results:`Rooms in ${office?.city??'this office'}`,review:'Review your reservation',receipt:'Your room is reserved'};
  const step={criteria:1,searching:2,results:2,review:3,receipt:4}[stage];
  const facts=<dl className={styles.bookingFacts}><div><dt>Office</dt><dd>{office?.city}</dd></div><div><dt>Local date and time</dt><dd>{draft.date} · {draft.startTime}<small>{office?.zone}</small></dd></div>
    <div><dt>Duration</dt><dd>{draft.durationMinutes} minutes</dd></div><div><dt>Meeting needs</dt><dd>{draft.capacity} people{draft.accessible?' · Step-free':''}</dd></div></dl>;
  return <section className={styles.booking}><p className={styles.label}>WORKPLACE / ROOM BOOKING · {step} OF 4</p>
    <h2 tabIndex={-1} ref={heading}>{titles[stage]}</h2>
    {stage==='criteria'&&<><p>Choose your workplace and meeting time to see available rooms.</p>
      <form className={styles.bookingForm} onSubmit={e=>{e.preventDefault();if(!warning){setError('');select('');setStage('searching');}}}>
        <div className={styles.bookingFields}>
          <label>Office<select value={draft.officeId} onChange={e=>update({officeId:e.currentTarget.value})}>{!office&&<option value={draft.officeId}>Unknown office: {draft.officeId}</option>}{offices.map(o=><option key={o.id} value={o.id}>{o.city}</option>)}</select></label>
          <label>Local date<input type="date" value={draft.date} onChange={e=>update({date:e.currentTarget.value})}/></label>
          <label>Start time<input type="time" value={draft.startTime} onChange={e=>update({startTime:e.currentTarget.value})}/></label>
          <label>Duration<select value={draft.durationMinutes} onChange={e=>update({durationMinutes:Number(e.currentTarget.value)})}>{[15,30,45,60,90].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label>
          <label>People<input type="number" min="1" max="24" value={Number.isFinite(draft.capacity)?draft.capacity:''} onChange={e=>update({capacity:e.currentTarget.valueAsNumber})}/></label>
          <label className={styles.check}><input type="checkbox" checked={draft.accessible} onChange={e=>update({accessible:e.currentTarget.checked})}/>Step-free access</label>
        </div>
        <small>{office?`Times shown in ${office.zone}.`:'Choose a listed office.'}</small>{warning&&<p role="status">{warning}</p>}
        <button type="submit" className={styles.primary} disabled={!!warning}>Search available rooms</button>
      </form>{p.mode==='full'&&office&&<RoomDay draft={draft} session={p.session} update={startTime=>update({startTime})}/>}</>}
    {stage==='searching'&&<p role="status" className={styles.bookingForm}>Checking {office?.city} rooms for {draft.date} at {draft.startTime}…</p>}
    {stage==='results'&&<><p>{draft.date} · {draft.startTime} ({office?.zone}) · {draft.durationMinutes} min · {draft.capacity} people{draft.accessible?' · Step-free':''}</p>
      <button type="button" onClick={()=>{setError('');setStage('criteria');}}>Change search</button>
      {error&&<p role="alert">{error}</p>}
      {matches.length?<><p role="status">{matches.length} {matches.length===1?'room matches':'rooms match'}. Select a room to review it.</p><div className={styles.roomGrid}>{matches.map(r=><button type="button" key={r.id} aria-pressed={selected===r.id} onClick={()=>select(r.id)}><small>Available · {r.seats} seats</small><strong>{r.name}</strong><span>{r.feature}</span></button>)}</div>
        <button type="button" className={styles.primary} disabled={!matches.some(r=>r.id===selected)} onClick={()=>setStage('review')}>Review booking</button></>:<p role="status">{warning??'No rooms match this search. Try another location, time or group size.'}</p>}</>}
    {stage==='review'&&room&&<div className={styles.bookingForm}><p className={styles.label}>SELECTED ROOM / {office?.city}</p><h3>{room.name}</h3><p>{room.seats} seats · {room.feature}</p>{facts}
      <div className={styles.chips}><button type="button" onClick={()=>setStage('results')}>Back to rooms</button><button type="button" className={styles.primary} onClick={confirm}>Confirm reservation</button></div></div>}
    {stage==='receipt'&&receipt&&room&&<div className={styles.bookingForm}><p className={styles.label}>BOOKING RECORDED / {receipt.id}</p><h3>{room.name} · {office?.city}</h3>{facts}
      <p>Session-only reservation. No calendar invitation was sent.</p><button type="button" onClick={()=>{setReceipt(undefined);select('');setKey(crypto.randomUUID());setStage('criteria');}}>Book another room</button></div>}
  </section>;
}
