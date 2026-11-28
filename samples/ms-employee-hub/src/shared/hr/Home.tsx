import * as React from 'react';
import type { SurfaceProps } from '../types';
import {
  allowedTeam, assignments, benefitChecklist, benefitWindow, coverage, dayLabel, dayKind, defaultRange,
  monday, nextSteps, peopleSource, reviewQueue, shiftDay, teamLabel, today
} from '../mockData/people';
import { Action, useStage } from './Frame';
import Portrait from './Portrait';

type SymbolName = 'privacy' | 'sun' | 'reward' | 'book' | 'people';
export function Mark({name}: {name: SymbolName}): React.ReactElement {
  const paths = {
    privacy: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,
    reward: <><path d="m3 17 6-6 4 3 8-10m-7 0h7v7"/></>,
    book: <><path d="M3 5q5-2 9 2 4-4 9-2v14q-5-2-9 1-4-3-9-1ZM12 7v13"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 3q4 1 4 6"/></>
  };
  return <svg className="hrw-mark" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55">{paths[name]}</svg>;
}
function TextAction({children, onClick}: React.PropsWithChildren<{onClick: () => void}>): React.ReactElement {
  return <button type="button" className="hrw-text-action" onClick={onClick}>{children}<span aria-hidden="true">→</span></button>;
}

export default function Home(p: SurfaceProps): React.ReactElement {
  useStage(30, 'information', 'hr/home');
  const {session: s, navigate} = p;
  const steps = nextSteps(s), date = today(s), week = monday(defaultRange(s).start);
  const hour = Number(new Intl.DateTimeFormat('en-GB', {timeZone:peopleSource.zone,hour:'2-digit',hour12:false}).format(s.now)) % 24;
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const learning = assignments(s), feature = learning.find(c => c.reviewed.some(r => !r)) || learning[0];
  const w = benefitWindow(s, 'current'), checklist = benefitChecklist(s, 'health', 'current');
  const team = allowedTeam(s), forecast = team ? coverage(s, team, 'next') : undefined, queue = team ? reviewQueue(s, 'pending') : undefined;
  const dates = [0,1,2,3,4].map(i => shiftDay(week,i));
  return <section className="hrw-home hrw-edition" data-layout={`hr-personal-home-${p.mode}-information`} aria-label="HRweb home">
    <div className="hrw-mast"><span className="hrw-kicker"><i aria-hidden="true"/> Your personal HRweb <span>/</span> Working life</span>
      <span className="hrw-private-tag"><Mark name="privacy"/>Personal workspace</span></div>
    <section className="hrw-hero" aria-label="Welcome">
      <div className="hrw-welcome"><span className="hrw-kicker">Your space to thrive <span>/</span> {dayLabel(date)}</span>
        <h2>{s.actor.displayName.trim() ? <>{greeting},<br/><em>{s.actor.displayName.trim()}.</em></> : <>{greeting}.</>}</h2>
        <p>A little clarity for today.<br/>More room for what comes next.</p>
        <Action onClick={() => steps.length ? navigate(steps[0].id, steps[0].inputs) : navigate(15)}>
          {steps.length ? 'Open my next step' : 'Plan time away'} <span aria-hidden="true">→</span></Action>
        <small className="hrw-first-due">{steps.length ? `${steps.length} next steps · First ${steps[0].due < date ? 'was due' : 'is due'} ${dayLabel(steps[0].due, true)}` : 'Your preparation list is up to date.'}</small>
      </div>
      <Portrait/>
    </section>
    <section className="hrw-today" aria-label="Next steps">
      <header className="hrw-sectionhead"><div><span className="hrw-kicker">A little clarity for today</span><h3>Your next right step.</h3></div>
        <span className="hrw-private-tag"><Mark name="privacy"/>Values hidden</span></header>
      <div className="hrw-desk">
        <section className="hrw-desk-agenda"><div className="hrw-desk-heading"><span className="hrw-kicker"><Mark name="book"/> Personal agenda</span>
          <span className="hrw-count">{steps.length} to explore</span></div><h4>What needs your attention.</h4>
          <ol>{steps.slice(0,3).map(step => <li key={step.title}><button className="hrw-task-line" type="button" onClick={() => navigate(step.id,step.inputs)}>
            <time dateTime={step.due}><small>{dayLabel(step.due,true).split(' ')[0]}</small><b>{Number(step.due.slice(-2))}</b></time>
            <span><small>{step.due < date ? 'Overdue · ' : ''}{step.label}</small><strong>{step.title}</strong></span><i aria-hidden="true">›</i>
          </button></li>)}</ol>
          {!steps.length && <p>Nothing left on your preparation list. Check back for future assignments.</p>}
          <TextAction onClick={() => navigate(10)}>Your learning</TextAction>
        </section>
        <section className="hrw-desk-private"><div className="hrw-desk-heading"><span className="hrw-kicker">Pay & rewards</span><Mark name="reward"/></div>
          <h4>A clearer view<br/>of your rewards.</h4><div className="hrw-privacy-dots" aria-hidden="true">••••••</div>
          <p>Personal values stay hidden until you open a statement or award and choose to reveal them.</p>
          <div className="hrw-desk-links"><TextAction onClick={() => navigate(12)}>Pay statements</TextAction><TextAction onClick={() => navigate(13)}>Vesting timeline</TextAction></div>
        </section>
        <section className="hrw-desk-time"><div className="hrw-desk-heading"><span className="hrw-kicker">Time for you</span><Mark name="sun"/></div>
          <h4>Make time<br/>for a break.</h4><div className="hrw-week-strip" aria-label={`Workweek of ${dayLabel(week)}`}>{dates.map((d,i)=><time key={d} dateTime={d} className={dayKind(d)==='holiday'?'hrw-closed':''}>
            <small>{['M','T','W','T','F'][i]}</small><b>{Number(d.slice(-2))}</b></time>)}</div>
          <p>Try a date range before committing any of your time.</p><div className="hrw-desk-links"><TextAction onClick={() => navigate(15)}>Plan time away</TextAction><TextAction onClick={() => navigate(14)}>View my ledger</TextAction></div>
        </section>
      </div>
    </section>
    <section className="hrw-feature-story" aria-label="Learning and benefits">
      <div className="hrw-story-photo" role="img" aria-label="Three people sharing a laugh in a studio"/>
      <div className="hrw-story-copy"><span className="hrw-kicker">The growth notebook <span>/</span> Career</span>
        <h3>A new perspective<br/>starts here.</h3><p>Take a few minutes for <strong>{feature.title}</strong>. Each section ends with one small thing to try.</p>
        <TextAction onClick={() => navigate(10,{courseId:feature.id})}>Open the {feature.minutes}-minute lesson</TextAction>
      </div>
      <aside className="hrw-benefits-note"><span className="hrw-kicker">One for your calendar</span><h4>Benefits preparation</h4>
        <p>{w.ok && <>Window closes <strong>{dayLabel(w.value.close)}</strong>. </>}{checklist.filter(Boolean).length} of {checklist.length} steps prepared.</p>
        <TextAction onClick={() => navigate(11)}>Open the checklist</TextAction><TextAction onClick={() => navigate(18)}>Ask HR privately</TextAction>
      </aside>
    </section>
    {team && forecast?.ok && queue?.ok && <section className="hrw-manager-note" aria-label="People manager tools"><Mark name="people"/>
      <div><span className="hrw-kicker">Assigned reviewer lens / {teamLabel(team)}</span><h3>Plan with your team.</h3>
        <p>{queue.value.length} {queue.value.length === 1 ? 'request is' : 'requests are'} awaiting your decision. Compare staffing for the week of {dayLabel(forecast.value[0].date,true)}.</p></div>
      <div><TextAction onClick={() => navigate(16)}>Coverage forecast</TextAction><TextAction onClick={() => navigate(17)}>Assigned decisions</TextAction></div></section>}
  </section>;
}
