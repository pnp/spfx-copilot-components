import * as React from 'react';
import { eligibleOrders, kinds, periods, queues, supportFlow, supportTrend, techDate, term } from '../mockData/technology';
import type { FlowLink, TrendPoint } from '../mockData/technology';
import { ContextOptions, Facts, Frame, Heading, input, Problem, Props, SelectField } from './Frame';
import { Inbox } from './Proof';
import { TechIcon } from './Art';

const periodChoices = periods.map(value => ({ value, label: `${parseInt(value, 10)} completed weeks` }));
const choices = (values: string[]): Array<{ value: string; label: string }> => values.map(value => ({ value, label: term(value) }));
const pct = (part: number, total: number): string => total ? `${(100 * part / total).toFixed(1)}%` : 'Not applicable';
const average = (point: TrendPoint): string => point.resolved ? `${(point.hours / point.resolved).toFixed(1)} h` : 'No closures';
const range = (start: string, end: string): string => `${techDate(start)} – ${techDate(end)} · UTC`;

function TrendChart({ points, active, select, compact }: { points: TrendPoint[]; active: number; select: (i: number) => void; compact: boolean }): React.ReactElement {
  const max = Math.max(2, ...points.map(p => Math.max(p.received, p.resolved)));
  const baseline = compact ? 107 : 150;
  const top = Math.ceil(max / 2) * 2; const x = (i: number): number => 38 + i * (514 / Math.max(1, points.length - 1)); const y = (n: number): number => baseline - (baseline - 28) * n / top;
  const desc = `Weekly counts from ${techDate(points[0].start)}. Selected week: ${points[active].received} received and ${points[active].resolved} resolved. Exact values follow.`;
  return <figure className="tw-chart"><figcaption><b>{compact ? 'Weekly ticket activity' : 'The rhythm of support.'}</b><span className="tw-legend"><i/>Received <i/>Resolved</span></figcaption><svg viewBox={`0 0 590 ${baseline + 34}`} role="img" aria-label={desc}>
    {[0, top / 2, top].map(n => <g key={n}><line className="tw-gridline" x1={34} x2={561} y1={y(n)} y2={y(n)}/><text x={25} y={y(n) + 4} textAnchor="end">{n}</text></g>)}
    <line x1={x(active)} x2={x(active)} y1={20} y2={baseline + 5} className="tw-cursor"/>
    {(['received', 'resolved'] as const).map(metric => <g key={metric} className={metric === 'received' ? 'tw-received' : 'tw-resolved'}><polyline fill="none" strokeWidth="3" strokeDasharray={metric === 'received' ? undefined : '6 4'} points={points.map((p, i) => `${x(i)},${y(p[metric])}`).join(' ')}/>{points.map((p, i) => <g key={i} onClick={() => select(i)}><circle cx={x(i)} cy={y(p[metric])} r={i === active ? 5 : 3}/><circle cx={x(i)} cy={y(p[metric])} r={10} fill="transparent" stroke="none"/></g>)}</g>)}
    {points.map((r, i) => (i === points.length - 1 || i % Math.ceil(points.length / (compact ? 2 : 5)) === 0) && <text key={r.start} x={x(i)} y={baseline + 25} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{compact ? `Week ${i + 1}` : new Date(r.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</text>)}
  </svg></figure>;
}
export function Trends(p: Props): React.ReactElement {
  const [period, choosePeriod] = React.useState(input(p, 'period', '4w')); const [team, chooseTeam] = React.useState(input(p, 'teamId', 'all'));
  const [selected, select] = React.useState<number>(); let report: ReturnType<typeof supportTrend>;
  try { report = supportTrend(p.session, period, team); } catch (e) { return <Problem p={p} route="manager-trends" error={e}/>; }
  const index = selected !== undefined && selected < report.points.length ? selected : report.points.length - 1;
  const point = report.points[index]; const total = report.totals; const full = p.mode === 'full';
  const delta = total.received - total.resolved; const decisions = full ? eligibleOrders(p.session).length : 0;
  const finding = delta === 0 ? 'Intake and closures were balanced.' : `${Math.abs(delta)} more requests were ${delta > 0 ? 'received than resolved' : 'resolved than received'}.`;
  return <Frame p={p} route="manager-trends" stage="information" scope={{ filters: { teamId: team, period }, trend:{weekStart:point.start.slice(0,10),received:point.received,resolved:point.resolved} }}>
    {full ? <header className="tw-managerintro"><div><p className="tw-kicker">Manager view / Workplace technology</p><h1 data-tech-heading tabIndex={-1}>See the friction.<br/><em>Help the flow.</em></h1><p className="tw-deck">Understand the support picture. Find the decisions that unblock your team.</p></div><div className="tw-managercut"><span>Today’s service desk</span><strong>{decisions} {decisions === 1 ? 'decision' : 'decisions'} awaiting review</strong></div></header> : <Heading kicker="TechWeb / Support performance" title={`${total.received} received · ${total.resolved} resolved`} lead={`${range(report.start, report.end)} · Completed weeks`}/>}
    <section className={full ? 'tw-reportboard' : ''}><div className={full ? 'tw-boardtop' : ''}>{full && <div><p className="tw-kicker">Support performance</p><h2>A little less waiting.<br/>A little more doing.</h2><p className="tw-note">{range(report.start, report.end)}</p></div>}<ContextOptions compact={!full} title={`Report filters · ${parseInt(period, 10)} weeks · ${team === 'all' ? 'All teams' : term(team)}`}><div className="tw-fields"><SelectField label="Reporting period" value={period} options={periodChoices} onChange={v => { choosePeriod(v); select(undefined); }}/><SelectField label="Owning team" value={team} options={choices(queues)} onChange={v => { chooseTeam(v); select(undefined); }}/></div></ContextOptions></div>
      {full && <dl className="tw-scoreboard"><div><dt>Requests received</dt><dd>{total.received}<small>{parseInt(period, 10)} completed weeks</small></dd></div><div><dt>Requests resolved</dt><dd>{total.resolved}<small>Closure events in this period</small></dd></div><div><dt>Mean resolution</dt><dd>{average(total)}<small>Weighted by {total.resolved} closures</small></dd></div><div><dt>Positive feedback</dt><dd>{pct(total.positive, total.feedback)}<small>{total.positive} of {total.feedback} responses</small></dd></div></dl>}
      <div className={full ? 'tw-chartpair' : ''}><div><TrendChart points={report.points} active={index} select={select} compact={!full}/>
        <p className="tw-note" aria-live="polite">Week of {techDate(point.start)}: {point.received} received, {point.resolved} resolved.</p></div>
        {full && <aside className="tw-ratio"><TechIcon name="pulse"/><p className="tw-kicker">Reading the signal</p><h3>{delta > 0 ? 'Intake outpaced closures.' : delta < 0 ? 'Closing more loops.' : 'Keeping pace.'}</h3><p>{finding} Intake and closure are separate events; a closure can belong to an older ticket.</p><strong>{pct(total.resolved, total.received)}</strong><small>Resolved-to-received ratio</small></aside>}</div>
      <details className="tw-data"><summary>Exact weekly values and feedback</summary><p className="tw-note">Mean resolution: {average(total)}, weighted by {total.resolved} closures. Positive feedback: {total.positive} of {total.feedback} responses ({pct(total.positive, total.feedback)}).</p><table><caption>Counts by completed week · {team === 'all' ? 'All reporting teams' : term(team)}</caption><thead><tr><th scope="col">Inspect week of</th><th scope="col">In</th><th scope="col">Closed</th><th scope="col">Mean time</th><th scope="col">Positive / replies</th></tr></thead><tbody>{report.points.map((r, i) => <tr key={r.start}><th scope="row"><button type="button" aria-pressed={i === index} onClick={() => select(i)}>{techDate(r.start)}</button></th><td>{r.received}</td><td>{r.resolved}</td><td>{average(r)}</td><td>{r.positive} / {r.feedback}</td></tr>)}</tbody></table></details>
      <button type="button" onClick={() => p.navigate(27, { period, queueId: team })}>Inspect request flow</button>
    </section>{full && <div className="tw-livequeue"><Inbox p={p}/><p className="tw-note">Today’s live decisions do not revise these completed weeks.</p></div>}
  </Frame>;
}

interface NodeBox { id: string; y: number; h: number; usedIn: number; usedOut: number; }
function FlowChart({ links, count, selected, select, compact }: { links: FlowLink[]; count: number; selected: string; select: (id: string) => void; compact: boolean }): React.ReactElement {
  const ribbons = compact ? 65 : 116; const scale = ribbons / count;
  const groups = [
    links.filter(l => l.level === 0).map(l => l.source),
    links.filter(l => l.level === 1).map(l => l.source),
    links.filter(l => l.level === 1).map(l => l.target)
  ].map((ids, level) => {
    let y = 44;
    return ids.filter((id, i) => ids.indexOf(id) === i).map(id => {
      const n = links.filter(l => level === 2 ? l.level === 1 && l.target === id : l.level === level && l.source === id).reduce((sum, l) => sum + l.count, 0);
      const box: NodeBox = { id, y, h: n * scale, usedIn: 0, usedOut: 0 }; y += box.h + 24; return box;
    });
  });
  const xs = [65, 295, 525];
  const paths = links.map(l => {
    const source = groups[l.level].filter(n => n.id === l.source)[0]; const target = groups[l.level + 1].filter(n => n.id === l.target)[0];
    const a = source.y + source.usedOut; const b = target.y + target.usedIn; const height = l.count * scale;
    source.usedOut += height; target.usedIn += height;
    const x = xs[l.level] + 8; const x2 = xs[l.level + 1]; const mid = (x + x2) / 2;
    return { l, d: `M${x} ${a}C${mid} ${a} ${mid} ${b} ${x2} ${b}V${b + height}C${mid} ${b + height} ${mid} ${a + height} ${x} ${a + height}Z` };
  });
  return <figure className="tw-chart"><figcaption><b>Intake → queue → state</b><span>Ribbon width is proportional to request count.</span></figcaption><svg viewBox={`0 0 600 ${ribbons + 91}`} role="img" aria-label={`Flow of ${count} requests. Select a link using the exact routes table.`}>
    {paths.map(({ l, d }) => <path key={l.id} d={d} className={l.id === selected ? 'tw-ribbon tw-active' : 'tw-ribbon'} onClick={() => select(l.id)}><title>{term(l.source)} to {term(l.target)}: {l.count} requests</title></path>)}
    {groups.map((group, i) => <g key={i}><text x={xs[i] + 4} y={19} textAnchor="middle">{['Intake', 'Owner', 'State'][i]}</text>{group.map(box => <g key={box.id}><rect x={xs[i]} y={box.y} height={box.h} width="8" className="tw-node"/><text className="tw-node-label" x={xs[i] + 4} y={box.y - 5} textAnchor="middle">{term(box.id)}</text></g>)}</g>)}
  </svg></figure>;
}
export function Flow(p: Props): React.ReactElement {
  const [period, choosePeriod] = React.useState(input(p, 'period', '4w')); const [kind, chooseKind] = React.useState(input(p, 'category', 'equipment'));
  const [queue, chooseQueue] = React.useState(input(p, 'queueId', 'all')); const [selected, select] = React.useState(p.restoredSelection || 'procurement:Awaiting');
  let report: ReturnType<typeof supportFlow>;
  try { report = supportFlow(p.session, period, kind, queue); } catch (e) { return <Problem p={p} route="manager-flow" error={e}/>; }
  const link = report.links.find(l => l.id === selected) || report.links[0];
  return <Frame p={p} route="manager-flow" stage="information" scope={{ filters: { period, category: kind, queueId: queue }, evidence: link ? { numerator: link.count, denominator: report.count, sourceTotal:link.sourceCount, unit: 'requests', asOf: report.end.slice(0, 10), selected: link.id } : undefined }}>
    <Heading kicker="TechWeb / Support flow" title={p.mode === 'inline' && link ? `${term(link.source)} → ${term(link.target)}` : 'Trace support flow'} lead={p.mode === 'inline' && link ? `${link.count} of ${report.count} cohort requests (${pct(link.count, report.count)}); ${link.count} of ${link.sourceCount} within ${term(link.source)} (${pct(link.count, link.sourceCount)}).` : `${range(report.start, report.end)}. Each request created in this cohort is counted once at the reporting cutoff.`}/>
    <div className={p.mode === 'full' ? 'tw-reportlayout' : ''}><section><ContextOptions compact={p.mode === 'inline'} title={`Cohort filters · ${parseInt(period, 10)} weeks · ${term(kind)} · ${queue === 'all' ? 'All queues' : term(queue)}`}><div className="tw-fields tw-three"><SelectField label="Cohort period" value={period} options={periodChoices} onChange={choosePeriod}/><SelectField label="Intake category" value={kind} options={choices(kinds)} onChange={chooseKind}/><SelectField label="Queue" value={queue} options={choices(queues)} onChange={chooseQueue}/></div></ContextOptions>
      {link ? <><FlowChart links={report.links} count={report.count} selected={link.id} select={select} compact={p.mode === 'inline'}/>
        {p.mode === 'full' && <div className="tw-selection" aria-live="polite"><p className="tw-kicker">Selected route</p><h3>{term(link.source)} → {term(link.target)}</h3><p><strong>{link.count} of {report.count}</strong> cohort requests ({pct(link.count, report.count)}); <strong>{link.count} of {link.sourceCount}</strong> within {term(link.source)} ({pct(link.count, link.sourceCount)}).</p></div>}
        <details className="tw-data"><summary>Exact routes · select a link</summary><table><caption>{range(report.start, report.end)}. Each stage sums to {report.count} requests. Do not add across stages.</caption><thead><tr><th scope="col">Link</th><th scope="col">Count</th><th scope="col">Share of cohort</th><th scope="col">Share of source</th></tr></thead><tbody>{report.links.map(l => <tr key={l.id}><th scope="row"><button type="button" onClick={() => select(l.id)} aria-pressed={link.id === l.id}>{term(l.source)} → {term(l.target)}</button></th><td>{l.count}</td><td>{pct(l.count, report.count)}</td><td>{pct(l.count, l.sourceCount)}</td></tr>)}</tbody></table></details></> : <p>No requests in this cohort. No share is calculated.</p>}
      <div className={p.mode === 'inline' ? 'tw-footactions' : ''}>
        {link && <ContextOptions compact={p.mode === 'inline'} title={`Matching records · ${link.matches.length} eligible for review`}><div className="tw-inlinecontext"><p className="tw-kicker">Permitted detail</p>{link.matches.length ? link.matches.map(match => <button type="button" key={match.id} onClick={() => p.navigate(25, { requestId: match.id })}>Review {match.id} · {match.title}</button>) : <p>No live assigned decision matches this link.</p>}
          <p className="tw-note">{link.count - link.matches.length} of {link.count} matching records are aggregate-only for this view. A chart selection does not apply a decision.</p></div></ContextOptions>}
      <button type="button" onClick={() => p.navigate(26, { period, teamId: queue })}>View weekly performance</button>
      </div></section>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Cohort evidence</p><h3>How to read this flow</h3><div className="tw-cohortnumber"><strong>{report.count}</strong><span>distinct requests in this reporting cut</span></div><Facts rows={[['Population', `${term(kind)} intake · ${queue === 'all' ? 'All queues' : term(queue)}`], ['Snapshot', techDate(report.end)], ['Selection', link ? `${term(link.source)} → ${term(link.target)}` : 'None']]}/><p className="tw-note">Read left to right. Count requests once per stage, not once per ribbon.</p></aside>}</div>
    {p.mode === 'full' && <div className="tw-livequeue"><Inbox p={p}/></div>}
  </Frame>;
}
