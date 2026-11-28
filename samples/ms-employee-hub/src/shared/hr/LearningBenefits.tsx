import * as React from 'react';
import type { SurfaceProps } from '../types';
import { assignments, benefits, benefitChecklist, benefitWindow, dayLabel, markBenefit, recordChapter, today } from '../mockData/people';
import { Action, Detail, ErrorNote, Source, Task, valueOf } from './Frame';

export function Learning(p: SurfaceProps): React.ReactElement {
  const all = assignments(p.session);
  const [band, setBand] = React.useState(valueOf(p, 'dueBand', 'all'));
  const inBand = all.filter(c => band === 'all' || (band === 'overdue' && c.dueOffset < 0) || (band === 'next7' && c.dueOffset >= 0 && c.dueOffset <= 7) || (band === 'upcoming' && c.dueOffset > 0)).sort((a,b)=>a.due.localeCompare(b.due));
  const [selected, select] = React.useState(valueOf(p, 'courseId', ''));
  const [chapter, setChapter] = React.useState(0);
  const [, refresh] = React.useReducer((v: number) => v + 1, 0);
  const course = selected ? inBand.find(c => c.id === selected) : p.mode==='full'?inBand[0]:undefined;
  const choose = (id: string): void => { select(id); setChapter(0); };
  const unavailable=!inBand.length||!!selected&&!course;
  return <Task p={p} slug="learning" label="Career / Mandatory learning" title="Your learning path." lead="Your required assignments, in due-date order. Choose a lesson to read and review its sections." stage={unavailable?'unavailable':course?'selection':'information'}
    scope={{filters:{dueBand:band},progress:course?{current:chapter+1,total:course.chapters.length,completed:course.reviewed.filter(Boolean).length}:undefined}}>
    <div className="hrw-segments" role="group" aria-label="Filter learning deadlines">{[['all','All required'],['overdue','Past deadline'],['next7','Next 7 days'],['upcoming','Upcoming']].map(([key,text])=><button type="button" key={key} aria-pressed={band===key} onClick={()=>{setBand(key);choose('');}}>{text}</button>)}</div>
    <ol className="hrw-agenda" aria-label="Required learning timeline">{inBand.map(c=>{
      const count=c.reviewed.filter(Boolean).length,done=count===c.chapters.length;
      const due=done?'Due':c.dueOffset<0?`${-c.dueOffset} days overdue`:c.dueOffset===0?'Due today':`Due in ${c.dueOffset} days`;
      return <li key={c.id}><button type="button" aria-pressed={course?.id===c.id} onClick={()=>choose(c.id)}>
        <time dateTime={c.due}>{dayLabel(c.due,true)}</time><span><strong>{c.title}</strong><small>{due} · {c.minutes} min · {count}/{c.chapters.length} sections</small></span>
        <span className="hrw-state">{done?'Reviewed':count?'In progress':'Not started'}</span></button></li>;
    })}</ol>
    {course ? <div className="hrw-columns"><article className="hrw-paper">{p.mode === 'full' && <div className="hrw-reading-lead">
      <div className="hrw-lesson-photo" role="img" aria-label="Three people sharing a laugh in the studio"/>
      <div><span className="hrw-kicker">The growth notebook</span><h3>{course.title}</h3>
        <p>{course.minutes} minutes <span aria-hidden="true">/</span> {course.chapters.length} sections</p></div></div>}
      <span className="hrw-kicker">{p.mode === 'inline' && `${course.due < today(p.session) ? 'Overdue' : 'Due'} ${dayLabel(course.due, true)} · `}Section {chapter + 1} of {course.chapters.length} · {course.minutes} min in total</span>
      <h3>{course.chapters[chapter].title}</h3><p>{course.chapters[chapter].text}</p>
      <div className="hrw-actions"><Action disabled={course.reviewed[chapter]} onClick={() => { recordChapter(p.session, course.id, chapter); refresh(); }}>
        {course.reviewed[chapter] ? 'Section reviewed' : 'Mark section reviewed'}</Action>
        {chapter + 1 < course.chapters.length && <Action secondary onClick={() => setChapter(chapter + 1)}>Next section</Action>}</div>
      <p className="hrw-caption" role="status">{course.reviewed.filter(Boolean).length} of {course.chapters.length} sections reviewed. This is not LMS certification.</p>
    </article><Detail p={p} label="See the chapter checklist"><aside className="hrw-aside"><span className="hrw-kicker">Deadline · {dayLabel(course.due)}</span>
      <h3>{p.mode === 'full' ? 'In this lesson' : course.title}</h3>
      {p.mode === 'full' && <div className="hrw-chapter-progress" aria-label={`${course.reviewed.filter(Boolean).length} sections reviewed out of ${course.chapters.length}`}>
        {course.reviewed.map((done,i)=><i key={course.chapters[i].title} className={done?'hrw-checked':i===chapter?'hrw-reading':''} aria-hidden="true"/>)}</div>}
      <ol className="hrw-outline">{course.chapters.map((c, i) => <li key={c.title}>
        <button type="button" aria-current={i === chapter ? 'step' : undefined} onClick={() => setChapter(i)}>{c.title}<small>{course.reviewed[i] ? 'Reviewed' : 'Not reviewed'}</small></button>
      </li>)}</ol></aside></Detail></div> : unavailable?<ErrorNote>No matching assignment in this band. Choose another assignment or deadline filter.</ErrorNote>:null}
    <Source>Personal learning register · As of {dayLabel(today(p.session))}</Source>
  </Task>;
}
export function Benefits(p: SurfaceProps): React.ReactElement {
  const [topic, setTopic] = React.useState(valueOf(p, 'topic', ''));
  const [window, setWindow] = React.useState(valueOf(p, 'window', 'current'));
  const [, refresh] = React.useReducer((v: number) => v + 1, 0);
  const w = benefitWindow(p.session, window),prefix=React.useId(),unknownTopic=!!topic&&!benefits.some(b=>b.id===topic);
  const checks=topic&&!unknownTopic&&w.ok?benefitChecklist(p.session,topic,window):undefined;
  return <Task p={p} slug="benefits" label="Benefits / Preparation" title="Plan your benefits review." lead="Open a topic to prepare your questions before the window closes." stage={!unknownTopic&&w.ok?'information':'unavailable'}
    scope={{filters:{window,topic},progress:checks?{current:checks.filter(Boolean).length,total:checks.length}:undefined}}>
    <div className="hrw-segments" role="group" aria-label="Planning window">{[['current','Current window'],['next','Next window']].map(([key,text])=><button key={key} type="button" aria-pressed={window===key} onClick={()=>setWindow(key)}>{text}</button>)}</div>
    {unknownTopic&&<ErrorNote>No matching preparation topic. Choose a topic below.</ErrorNote>}
    {w.ok?<><p className="hrw-window"><b>{window==='current'?'Open now':'Upcoming'}</b> <time dateTime={w.value.open}>{dayLabel(w.value.open,true)}</time> – <time dateTime={w.value.close}>{dayLabel(w.value.close,true)}</time></p>
      <ul className="hrw-benefit-list" aria-label="Benefit preparation topics">{benefits.map(b=>{
        const checks=benefitChecklist(p.session,b.id,window),count=checks.filter(Boolean).length,open=topic===b.id;
        return <li key={b.id}><button type="button" className="hrw-benefit-toggle" aria-expanded={open} aria-controls={`${prefix}-${b.id}`} onClick={()=>setTopic(open?'':b.id)}>
          <span><strong>{b.title}</strong><small>{count===checks.length?'Ready for review':`${count} of ${checks.length} prepared`}</small></span><b aria-hidden="true">{open?'−':'+'}</b></button>
          <div className="hrw-benefit-checklist" id={`${prefix}-${b.id}`} hidden={!open}>{open&&<><p>{b.intro}</p><fieldset className="hrw-checks"><legend>My checklist</legend>{b.steps.map((text,i)=><label key={text}><input type="checkbox" checked={checks[i]} onChange={e=>{markBenefit(p.session,b.id,window,i,e.currentTarget.checked);refresh();}}/>{text}</label>)}</fieldset></>}</div></li>;
      })}</ul><p className="hrw-caption">Preparation only. Checking an item does not elect or change coverage.</p>
      {p.mode==='full'&&<Action secondary onClick={()=>p.navigate(18,{category:'benefits'})}>Ask a private question</Action>}</>:<ErrorNote>{w.message}</ErrorNote>}
    <Source>Benefits preparation guide · People experience · As of {dayLabel(today(p.session))}</Source>
  </Task>;
}
