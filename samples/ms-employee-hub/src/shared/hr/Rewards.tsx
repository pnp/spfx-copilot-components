import * as React from 'react';
import type { SurfaceProps } from '../types';
import { awardChoices, dayLabel, payLines, statements, vesting, vestingCalendar } from '../mockData/people';
import { Action, Choices, Detail, ErrorNote, PrivacyPanel, Source, Task, valueOf } from './Frame';

function money(cents: number): string { return (cents / 100).toLocaleString('en-US', {style: 'currency', currency: 'USD'}); }
function PaySplit({net,gross,deductions}:{net:number;gross:number;deductions:Array<[string,number]>}):React.ReactElement {
  const amounts:Array<[string,number]>=[['Net pay',net],...deductions];
  const slices=amounts.map(([label,cents],i)=>({label,cents,percent:cents*100/gross,
    start:amounts.slice(0,i).reduce((sum,[,value])=>sum+value,0)*100/gross,color:['#247b72','#5359ac','#c07830','#9b5891'][i%4]}));
  const edge=(pct:number):string=>`${50+49*Math.sin(pct*Math.PI/50)} ${50-49*Math.cos(pct*Math.PI/50)}`;
  return <figure className="hrw-pay-split"><figcaption><strong>Where your gross pay goes</strong><small>{money(gross)} gross · USD</small></figcaption>
    <svg viewBox="0 0 100 100" role="img" aria-label="Gross pay split between net pay, withholding and contributions; amounts and shares follow.">
      {slices.map(s=><path key={s.label} fill={s.color} d={`M50 50 L${edge(s.start)} A49 49 0 ${s.percent>50?1:0} 1 ${edge(s.start+s.percent)} Z`}><title>{s.label}: {money(s.cents)} ({s.percent.toFixed(1)}%)</title></path>)}</svg>
    <ul aria-label="Share of gross pay">{slices.map(s=><li key={s.label}><i style={{backgroundColor:s.color}} aria-hidden="true"/><span>{s.label}</span><b>{money(s.cents)}</b><small>{s.percent.toFixed(1)}%</small></li>)}</ul></figure>;
}
export function Pay(p: SurfaceProps): React.ReactElement {
  const periods = statements(p.session);
  const input = valueOf(p, 'payPeriod', 'latest');
  const [period, choose] = React.useState(input === 'latest' ? periods[0].period : input === 'previous' ? periods[1].period : input);
  const row = periods.find(r => r.period === period);
  return <Task p={p} slug="pay-statements" label="Pay, stock, & rewards" title="Your pay statement." lead="Choose a completed period. Statement values are hidden until you reveal them." stage={row ? 'information' : 'unavailable'}>
    <Choices label="Completed pay period" value={period} items={periods.map(x => [x.period,new Date(`${x.start}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})])} onChange={choose}/>
    {row ? <div className="hrw-columns"><div className="hrw-paper"><span className="hrw-kicker">Period statement · USD</span>
      <h3>{dayLabel(row.start, true)} – {dayLabel(row.end)}</h3><p>Published {dayLabel(row.published)} · Personal statement</p>
      <PrivacyPanel key={`${p.mode}/${period}/${p.session.actor.id}`} compact={p.mode === 'inline'} title="Earnings & deductions" revealLabel="Reveal pay values">{() => {
        const read = payLines(p.session, period);
        if (!read.ok) return <ErrorNote>{read.message}</ErrorNote>;
        const v = read.value;
        return <><PaySplit net={v.net} gross={v.gross} deductions={v.deductions}/><details className="hrw-detail"><summary>Itemized statement</summary><dl className="hrw-lines">{v.earnings.map(([label, cents]) => <div key={label}><dt>{label}</dt><dd>{money(cents)}</dd></div>)}
          <div className="hrw-subtotal"><dt>Gross earnings</dt><dd>{money(v.gross)}</dd></div>
          {v.deductions.map(([label, cents]) => <div key={label}><dt>{label}</dt><dd>−{money(cents)}</dd></div>)}
          <div className="hrw-subtotal"><dt>Total deductions</dt><dd>−{money(v.withheld)}</dd></div>
          <div className="hrw-total"><dt>Net pay</dt><dd>{money(v.net)}</dd></div></dl></details></>;
      }}</PrivacyPanel></div>
      {p.mode === 'full' && <aside className="hrw-aside hrw-lilac"><span className="hrw-kicker">Reading the statement</span><h3>From gross to net.</h3>
        <ol className="hrw-pay-guide"><li><strong>Earnings</strong><span>Start with pay for the period and any allowances.</span></li>
          <li><strong>Deductions</strong><span>Subtract the listed withholding and contributions.</span></li>
          <li><strong>Take-home amount</strong><span>The remainder is the total shown on the statement.</span></li></ol>
        <Action secondary onClick={() => p.navigate(13)}>View vesting instead</Action></aside>}</div> :
      <ErrorNote>This statement is not available in your completed periods. Choose a listed month.</ErrorNote>}
    <Source>Payroll statement register · Historical, illustrative figures · No bank or tax identifiers</Source>
  </Task>;
}
export function Vesting(p: SurfaceProps): React.ReactElement {
  const [award, select] = React.useState(valueOf(p, 'awardId', awardChoices[0].id));
  const [horizon, look] = React.useState(valueOf(p, 'horizon', '180d'));
  const read = vestingCalendar(p.session, award, horizon);
  return <Task p={p} slug="rewards" label="Pay, stock, & rewards" title="Your vesting timeline." lead="Explore upcoming milestones for one award. Units and estimates stay private." stage={read.ok ? 'information' : 'unavailable'} scope={{filters:{horizon}}}>
    <div className="hrw-ledger-controls"><Choices label="Award" value={award} items={awardChoices.map(g => [g.id, g.title])} onChange={select}/>
      <Choices label="Look ahead" value={horizon} items={[['90d','90 days'],['180d','180 days'],['1y','One year']]} onChange={look}/></div>
    {read.ok ? <div className="hrw-columns"><article className="hrw-paper"><span className="hrw-kicker">Award schedule</span><h3>{read.value.title}</h3>
      {p.mode === 'inline' && <p>Next vest: <strong>{dayLabel(read.value.dates[0])}</strong></p>}
      <Detail p={p} label={`See ${read.value.dates.length} scheduled milestones`}><ol className="hrw-timeline">{read.value.dates.map((date, i) => <li key={date}>
        {p.mode==='full' && <small className="hrw-tranche-no">Milestone 0{i+1}</small>}<strong>{dayLabel(date)}</strong><span>{i === 0 ? 'Next vest' : 'Scheduled vest'}</span></li>)}</ol></Detail>
      <PrivacyPanel key={`${p.mode}/${award}/${horizon}/${p.session.actor.id}`} compact={p.mode === 'inline'} title="Units & illustration" revealLabel="Reveal award values">{() => {
        const values = vesting(p.session, award, horizon);
        if (!values.ok) return <ErrorNote>{values.message}</ErrorNote>;
        const v = values.value;
        return <dl className="hrw-lines"><div><dt>Held units</dt><dd>{v.held}</dd></div><div><dt>All unvested units</dt><dd>{v.unvested}</dd></div>
          {v.tranches.map(t => <div key={t.date}><dt>{dayLabel(t.date, true)} vest</dt><dd>{t.units} units</dd></div>)}
          <div><dt>Illustrative close per unit</dt><dd>{money(v.priceCents)}</dd></div>
          <div className="hrw-total"><dt>Unvested estimate</dt><dd>{money(v.unvested * v.priceCents)}</dd></div></dl>;
      }}</PrivacyPanel></article>{p.mode === 'full' && <aside className="hrw-aside hrw-lilac"><span className="hrw-kicker">How to read this</span><h3>A schedule, not a quote.</h3>
        <p>The timeline follows the selected horizon. The estimate uses all unvested units, including milestones beyond that horizon.</p>
        <Action secondary onClick={() => p.navigate(12)}>View pay statements</Action></aside>}</div> : <ErrorNote>{read.message}</ErrorNote>}
    <Source>Stock-plan register{read.ok ? ` · Illustrative reference close ${dayLabel(read.value.close)}` : ''} · Not a live price or payment</Source>
  </Task>;
}
