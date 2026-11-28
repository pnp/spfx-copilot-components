import * as React from 'react';
import type { SurfaceProps } from '../types';
import { agenda, calendarFile, eventTimes, guidance, officeFor, offices, stories } from '../mockData/workplace';
import type { HubEvent } from '../mockData/workplace';
import Journal, {JournalNav,StoryPhoto} from './Journal';
import {KeepEvent} from './WorkplacePlan';
import RoomBooking from './RoomBooking';
import styles from './Company.module.scss';
import { useHubVisibleScope } from '../../hosts/VisibleScope';

const str=(v:unknown,base:string):string=>v===undefined?base:String(v);
function tag(text:string):React.ReactElement {return <p className={styles.label}>{text}</p>;}
function Panel({title,children}:{title:string;children:React.ReactNode}):React.ReactElement {return <aside className={styles.aside}>{tag('FIELD NOTES')}<h3>{title}</h3>{children}</aside>;}
function selectField(label:string,value:string,set:(v:string)=>void,items:readonly string[]):React.ReactElement {
  return <label>{label}<select value={value} onChange={e=>set(e.target.value)}>{Array.from(new Set([...(items.includes(value)?[]:[value]),...items])).map(x=><option key={x}>{x}</option>)}</select></label>;
}
function News(p:SurfaceProps):React.ReactElement {
  const articleList=stories(p.session.now), [topic,setTopic]=React.useState(str(p.inputs.topic,'All')), [sid,setSid]=React.useState(str(p.inputs.storyId,''));
  const [unfolded,unfold]=React.useState(Boolean(p.inputs.storyId)),listId=React.useId();
  const [saved,setSaved]=React.useState<string[]>(()=>p.session.memory.get('company.bookmarks') as string[]||[]);
  const visible=articleList.filter(x=>topic==='All'?(sid===x.id||x.age<=7):topic==='Archive'?x.age>7:topic==='Saved'?saved.includes(x.id):x.topic.toLowerCase()===topic.toLowerCase());
  const current=sid?visible.find(s=>s.id===sid):visible[0];
  const date=(iso:string):string=>new Date(iso).toLocaleDateString(p.session.locale,{timeZone:p.session.viewerZone,month:'short',day:'numeric'});
  const editions=['All','Design','People','Technology','Saved','Archive'];
  const bookmark=(id:string):void=>{
    const next=saved.includes(id)?saved.filter(k=>k!==id):[...saved,id];
    p.session.memory.set('company.bookmarks',next);setSaved(next);
    if(topic==='Saved'&&!next.includes(id)){setSid('');unfold(false);}
  };
  useHubVisibleScope({entry:p.id,stage:current?(p.mode==='full'||unfolded?'selection':'information'):'unavailable',filters:{topic,storyId:current?.id}});
  const detail=(s:typeof articleList[number]):React.ReactElement=><><p>{s.body}</p><small>{s.owner}</small><div className={styles.chips}>
    {p.onExpand&&<button type="button" className={styles.primary} onClick={p.onExpand}>Open full story ↗</button>}
    <button type="button" onClick={()=>bookmark(s.id)}>{saved.includes(s.id)?'Remove bookmark':'Save for later'}</button></div></>;
  return <>{tag('WORKPLACE JOURNAL / THE STORY DESK')}<h2>{topic==='All'?'Latest news':topic==='Archive'?'From the archive':topic==='Saved'?'Saved stories':`${topic} stories`}</h2>
    <div role="group" aria-label="News edition" className={styles.feedFilters}>{editions.map(v=><button type="button" key={v} aria-pressed={topic===v} onClick={()=>{setTopic(v);setSid('');unfold(false);}}>{v==='All'?'Latest':v}</button>)}</div>
    {!current&&<p role="status">{sid?'That story is not available in this edition.':'No stories in this edition.'}</p>}
    {p.mode==='inline'?<ul className={styles.feed} aria-label="Published stories">{visible.map(s=>{
      const open=unfolded&&s.id===sid, panel=`${listId}-${s.id}`;
      return <li key={s.id}><button className={styles.feedRow} type="button" aria-expanded={open} aria-controls={panel} onClick={()=>{setSid(s.id);unfold(!open);}}>
        <StoryPhoto id={s.id}/><span className={styles.feedCopy}><small>{s.topic} · <time dateTime={s.published}>{date(s.published)}</time></small><strong>{s.title}</strong><span>{s.dek}</span></span><i aria-hidden="true">{open?'−':'+'}</i></button>
        <div className={styles.storyDetail} id={panel} hidden={!open}>{open&&detail(s)}</div></li>;
    })}</ul>:current&&<div className={styles.spread}><article className={styles.reading}>{tag(`${current.topic} / ${date(current.published)}`)}<h3>{current.title}</h3><p className={styles.lede}>{current.dek}</p>{detail(current)}</article>
      <aside className={styles.artDesk}><StoryPhoto id={current.id}/>{tag('Workplace journal / More from the desk')}{articleList.filter(x=>x.id!==current.id&&x.age<=7).map(x=><button key={x.id} type="button" onClick={()=>p.navigate(p.id,{storyId:x.id})}>{x.title} →</button>)}</aside></div>}</>;
}
function Events(p:SurfaceProps):React.ReactElement {
  const [office,setOffice]=React.useState(p.inputs.officeId?officeFor(String(p.inputs.officeId))?.id||String(p.inputs.officeId):'All');
  const [window,setWindow]=React.useState(str(p.inputs.window,'month')), [id,setId]=React.useState(str(p.inputs.eventId,''));
  const events=agenda(p.session.now).filter(e=>(office==='All'||office===e.officeId)&&Date.parse(e.start)-p.session.now.getTime()<({week:7,month:31}[window]||0)*86400000);
  const selected=id?events.find(e=>e.id===id):events[0];
  const [page,setPage]=React.useState(()=>Math.max(0,Math.floor(events.findIndex(e=>e.id===id)/3)));
  const [opened,setOpened]=React.useState(Boolean(p.inputs.eventId));
  const last=Math.max(0,Math.ceil(events.length/3)-1), activePage=Math.min(page,last), items=events.slice(activePage*3,activePage*3+3);
  useHubVisibleScope({entry:p.id,stage:selected?'selection':'unavailable',filters:{window,officeId:office,eventId:selected?.id}});
  const download=(e:HubEvent):void=>{const a=document.createElement('a'), url=URL.createObjectURL(new Blob([calendarFile(e)],{type:'text/calendar;charset=utf-8'}));a.href=url;a.download=`${e.id}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
  const clear=():void=>{setId('');setOpened(false);setPage(0);};
  return <>{tag('AGENDA / GLOBAL WORKPLACE')}<h2>Upcoming events</h2>
    <div className={styles.feedFilters} role="group" aria-label="Event office">{[{id:'All',city:'All offices'},...offices].map(o=><button key={o.id} aria-pressed={office===o.id} onClick={()=>{setOffice(o.id);clear();}}>{o.city}</button>)}</div>
    <div className={styles.feedFilters} role="group" aria-label="Upcoming window">{['week','month'].map(w=><button key={w} aria-pressed={window===w} onClick={()=>{setWindow(w);clear();}}>{w==='week'?'Next 7 days':'Next 31 days'}</button>)}</div>
    <ul className={styles.feed} aria-label="Published events">{items.map(e=>{
      const o=officeFor(e.officeId)!, d=new Date(e.start),fmt=(options:Intl.DateTimeFormatOptions):string=>d.toLocaleString(p.session.locale,{...options,timeZone:o.zone});
      return <li key={e.id}><button type="button" className={styles.feedRow} aria-pressed={e.id===selected?.id&&(opened||p.mode==='full')} onClick={()=>{setId(e.id);setOpened(true);}}>
        <time className={styles.dateTile} dateTime={e.start}><b>{fmt({day:'numeric'})}</b>{fmt({month:'short'})}</time><span className={styles.feedCopy}><strong>{e.title}</strong><small>{o.city} · {fmt({hour:'numeric',minute:'2-digit',timeZoneName:'short'})}</small></span><i aria-hidden="true">→</i></button></li>;
    })}</ul>{last>0&&<div className={styles.pager}>{[-1,1].map(n=><button key={n} disabled={n<0?activePage===0:activePage===last} onClick={()=>{const next=activePage+n;setPage(next);setId(events[next*3].id);setOpened(false);}}>{n<0?'Previous':'Next'}</button>)}<small>{activePage*3+1}–{Math.min(events.length,activePage*3+3)} of {events.length}</small></div>}
    {!selected?<p role="status">No matching published event. Select a different office or date window.</p>:(opened||p.mode==='full')&&<div className={p.mode==='full'?styles.spread:styles.storyDetail}><div><h3>{selected.title}</h3><p>{selected.format} · {selected.minutes} minutes</p>{eventTimes(selected,p.session).map(o=><div className={styles.line} key={o.zone}><b>{o.label}</b><time dateTime={selected.start}>{o.text}</time></div>)}<div className={styles.chips}><button className={styles.primary} onClick={()=>download(selected)}>Download calendar entry</button><KeepEvent key={selected.id} event={selected} session={p.session}/></div></div>{p.mode==='full'&&<Panel title="Plan your visit"><p>{officeFor(selected.officeId)!.arrival}</p><button onClick={()=>p.navigate(4,{officeId:selected.officeId})}>Find a room at this office →</button><p>Saving the calendar entry does not register you for the event.</p></Panel>}</div>}</>;
}
function Guides(p:SurfaceProps):React.ReactElement {
  const [q,setQ]=React.useState(str(p.inputs.query,'')),[topic,setTopic]=React.useState(str(p.inputs.topic,'All')),[locale,setLocale]=React.useState(str(p.inputs.locale,'All')),[id,setId]=React.useState(str(p.inputs.resourceId,''));
  const hits=guidance.filter(g=>(locale==='All'||locale.toLowerCase()===g.locale.toLowerCase())&&(topic==='All'||topic.toLowerCase()===g.topic.toLowerCase())&&`${g.title} ${g.text}`.toLowerCase().includes(q.trim().toLowerCase()));
  const picked=hits.find(g=>g.id===id), missing=!hits.length||!!id&&!picked;
  useHubVisibleScope({entry:5,stage:missing?'unavailable':'selection',filters:{topic,locale,resourceId:picked?.id}});
  return <>{tag('LIBRARY / PUBLISHED RESOURCES')}<h2>The field guide</h2><div className={styles.filters}><label>Search guidance<input type="search" value={q} onChange={e=>{setQ(e.target.value);setId('');}}/></label>{selectField('Topic',topic,v=>{setTopic(v);setId('');},['All',...guidance.map(x=>x.topic)])}{selectField('Locale',locale,v=>{setLocale(v);setId('');},['All',...guidance.map(x=>x.locale)])}</div>
    <ul className={styles.feed} aria-label="Published guidance">{hits.map(g=><li key={g.id}><button type="button" className={styles.feedRow} aria-expanded={id===g.id} onClick={()=>setId(id===g.id?'':g.id)}><span className={styles.dateTile}>{g.locale}</span><span className={styles.feedCopy}><strong>{g.title}</strong><small>{g.topic} · {g.owner} · v{g.version}</small></span><i aria-hidden="true">{id===g.id?'−':'+'}</i></button>
      {id===g.id&&<article className={styles.storyDetail}><p>{g.text}</p></article>}</li>)}</ul>{missing&&<p role="status">No matching published resource. Private files are not searched.</p>}</>;
}
export default function Company(p:SurfaceProps):React.ReactElement {
  const Body=({0:Journal,1:Events,2:News,4:RoomBooking,5:Guides})[p.id];
  return <section className={styles.surface} data-layout={`company-${p.id}-${p.mode}`}>{p.mode==='full'&&p.id!==0&&<JournalNav p={p} section={p.id===2?'News & stories':p.id===1?'Events':p.id===4?'Around the world':undefined}/>} {Body?<Body {...p}/>:<p role="alert">This workplace destination is unavailable.</p>}</section>;
}
