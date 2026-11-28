import * as React from 'react';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import type { SurfaceProps } from '../types';
import { bookings, captureEvidence, channelNames, commercialMarkets, driverNames, fiscalCut, forecast, leadFlow, money, nextReview, nodeNames, opportunityLink, rate, receipts, regions, signed, sum } from '../mockData/commercial';
import type { Channel, Driver, Market, Period, Region } from '../mockData/commercial';
import { Folio, graphKey, Heading, Keys, MarketFilter, PeriodFilter, printDate, SelectField, Stamp } from './layout';
import { LeadPlot, LinkTable } from './LeadReview';
import { BridgeTable, Waterfall } from './ForecastReview';
import { withReviewMark } from './reviewLink';
import land from './worldLand.json';

type Scope = Region | 'all';
const byGap = (a: Market, b: Market): number => (a.booked - a.plan) - (b.booked - b.plan) || a.name.localeCompare(b.name);
export function project(lon: number, lat: number): [number, number] { return [(lon + 180) * 800 / 360, (85 - lat) * 420 / 145]; }

function Atlas({ markets, active, select, title }: { markets: readonly Market[]; active: Market; select: (id: string) => void; title?: string }): React.ReactElement {
  const uid = React.useId().replace(/:/g,'');
  return <figure className="slt-atlas"><figcaption><Keys n="01">Market contribution</Keys>{title && <h3>{title}</h3>}</figcaption><svg viewBox="0 0 800 420" role="group" aria-label="World market atlas. Circle area represents booked USD. Plus and minus indicate variance to plan.">
    <defs><pattern id={`${uid}-land`} width="4.6" height="4.6" patternUnits="userSpaceOnUse"><circle cx="2.3" cy="2.3" r="1.02" fill="#9ebabf"/></pattern><path id={`${uid}-outline`} d={land.path}/></defs>
    <g className="slt-graticule" aria-hidden="true">{[-120,-60,0,60,120].map(lon => <path key={lon} d={`M${project(lon,0)[0]} 0v420`}/>)}{[-40,0,40].map(lat => <path key={lat} d={`M0 ${project(0,lat)[1]}h800`}/>)}</g>
    <g aria-hidden="true" fillRule="evenodd"><use href={`#${uid}-outline`} className="slt-land"/><use href={`#${uid}-outline`} fill={`url(#${uid}-land)`}/></g>
    {markets.map(m => {
      const [x,y] = project(m.lon, m.lat), r = Math.sqrt(m.booked) * 1.65, chosen = m.id === active.id, left = m.id === 'GB', gap = m.booked - m.plan;
      const label = `${m.name}: ${money(m.booked)} booked, ${signed(gap)} vs phased plan`;
      return <g key={m.id} role="button" className="slt-marker" aria-label={label} aria-pressed={chosen} tabIndex={0} onClick={() => select(m.id)} onKeyDown={e => graphKey(e, () => select(m.id))}>
        <title>{label}</title>{chosen && <><circle cx={x} cy={y} r={r + 10} className="slt-locator"/><circle cx={x} cy={y} r={r + 4.5} className="slt-ring"/></>}
        <circle cx={x} cy={y} r={r} className={gap < 0 ? 'below' : 'above'}/><path className="slt-sign" d={`M${x - r * .42} ${y}h${r * .84}${gap > 0 ? `M${x} ${y - r * .42}v${r * .84}` : ''}`}/>
        <text x={x + (left ? -1 : 1) * (r + 7)} y={y + (left ? -6 : 5)} textAnchor={left ? 'end' : 'start'}>{m.id}</text></g>;
    })}</svg>
    <div className="slt-map-key"><span>+ Above plan</span><span>− Below plan</span><span>Ring: selected</span></div>
    <p className="slt-map-credit">Circle area = QTD bookings. Unmarked markets are outside scope. Land: Natural Earth.</p></figure>;
}
function RegionFilter({ value, change }: { value: Scope; change: (v: Scope) => void }): React.ReactElement {
  return <SelectField label="Regional scope" value={value} change={v => change(v as Scope)}><option value="all">All covered regions</option>{regions.map(r => <option key={r}>{r}</option>)}</SelectField>;
}
function MarketTable({ markets, active, select }: { markets: Market[]; active: Market; select: (s: string) => void }): React.ReactElement {
  return <table><caption>Markets ranked by signed gap · USD millions</caption><thead><tr>{['Select market', 'Booked', 'Plan to cut', 'Gap'].map(s => <th scope="col" key={s}>{s}</th>)}</tr></thead>
    <tbody>{markets.map(m => <tr key={m.id} data-selected={m.id === active.id}><th scope="row"><button type="button" onClick={() => select(m.id)} aria-pressed={m.id === active.id}>{m.name}</button></th><td>{money(m.booked)}</td><td>{money(m.plan)}</td><td>{signed(m.booked - m.plan)}</td></tr>)}</tbody></table>;
}
function Ranking({ markets, active, select }: { markets: Market[]; active: Market; select: (s: string) => void }): React.ReactElement {
  const max = Math.max(1, ...markets.map(m => Math.abs(m.booked - m.plan)));
  return <div className="slt-ranking"><Keys n="02">Variance ledger</Keys><h3>Gap by market</h3><p className="slt-map-credit">Actual less phased plan · USD millions</p><div className="slt-rank-table">{markets.map((m, i) => {
    const gap = m.booked - m.plan; return <button key={m.id} type="button" className="slt-rank-row" aria-pressed={m.id === active.id} onClick={() => select(m.id)}>
      <small aria-hidden="true">{i+1 < 10 ? '0' : ''}{i+1}</small><span>{m.name}</span><span className="slt-diverge" aria-hidden="true"><i className={gap < 0 ? 'down' : 'up'} style={{ width: `${Math.abs(gap) / max * 48}%` }}/></span><b>{signed(gap)}</b></button>;
  })}</div><div className="slt-atlas-caption"><b>{active.id}</b><span><strong>{active.name}</strong> · {active.region}<small>{money(active.booked)} booked against {money(active.plan)} phased plan</small></span></div></div>;
}
export function QuarterLanding({ session, navigate }: SurfaceProps): React.ReactElement {
  const [period, setPeriod] = React.useState<Period>('current-quarter'), [selection, select] = React.useState('DE');
  const [channel, setChannel] = React.useState<Channel>('all'), [selectedLink, setLink] = React.useState(opportunityLink), [driver, setDriver] = React.useState<Driver>('slippage');
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut).sort(byGap), m = markets.find(k => k.id === selection) || markets[0];
  const total = bookings(markets), top = markets[0], regional = top && bookings(markets.filter(k => k.region === top.region)), f = m && forecast(m);
  const flow = cut.mature && m ? leadFlow(m, channel) : undefined;
  const link = flow && (flow.links.find(l => l.id === selectedLink && l.count > 0) || flow.links.find(l => l.id === opportunityLink && l.count > 0) || flow.links.find(l => l.count > 0));
  const scope = m ? { marketId: m.id, period } : { period };
  const register = receipts(session);
  const action = (): void => {
    if (!m || !link) return;
    const ref = captureEvidence(session, m.id, period, { kind:'qualification', channel, link:link.id });
    if (ref) navigate(6,{ ...scope, evidenceId:ref.id, workstream:'qualification' });
  };
  const trace = (): void => {
    const inputs = { ...scope,channel };
    navigate(9,link ? withReviewMark(session,inputs,cut.asOf,link.id) : inputs);
  };
  useHubVisibleScope({ entry: 30, route: 'business/home', stage: m ? 'information' : 'unavailable', filters: { period, marketId: m && m.id, channel, driver },
    evidence:flow&&link?{unit:'leads',numerator:link.count,denominator:flow.total,selected:link.id,asOf:cut.asOf}:undefined,
    forecast:f?{priorCut:cut.priorAsOf,currentCut:cut.asOf,priorUsd:f.prior*100000,currentUsd:f.current*100000,movementUsd:f.movements[driver]*100000}:undefined,
    bookings:m?{asOf:cut.asOf,bookedUsd:m.booked*100000,planUsd:m.plan*100000}:undefined });
  return <section data-layout="business-operating-review" className="slt-reviewbook" aria-label="Quarterly operating review"><Folio desk="Senior leadership briefing" edition={cut.label} asOf={cut.asOf}/>
    <div className="slt-mast"><div><p className="slt-over">Quarterly operating review · illustrative data</p><h2>Where growth <br/><em>needs attention.</em></h2>
      {top && regional && <p className="slt-lede">{top.booked < top.plan && regional.gap < 0 ? <><strong>{top.name}</strong> accounts for <strong>{money(top.plan - top.booked)}</strong> of {top.region}’s {money(regional.gap)} shortfall.</> : <>Review {top.name}’s contribution against its phased plan.</>} Start with bookings, then test the cohort and the forecast.</p>}</div>
      <aside className="slt-edition"><div className="slt-quarter-top"><Keys n="Q">Pace at the cut</Keys><PeriodFilter value={period} change={setPeriod}/></div><div className="slt-pace"><strong>{total.attainment}</strong><span>of phased plan</span></div>
        {markets.length > 0 ? <><div className="slt-pace-line" aria-hidden="true"><i style={{width:`${total.booked/Math.max(1,total.booked,total.plan)*90}%`}}/><b style={{left:`${total.plan/Math.max(1,total.booked,total.plan)*90}%`}}/></div>
          <p><b>{money(total.booked)}</b> booked <span>/</span> <b>{money(total.plan)}</b> planned</p></> : <p>Waiting for a completed cut.</p>}</aside></div>
    {m ? <><div className="slt-mapspread"><Atlas markets={markets} active={m} select={select} title={`Covered markets are ${money(total.gap)} ${total.gap < 0 ? 'below' : 'above'} plan.`}/><Ranking markets={markets} active={m} select={select}/></div>
      <div className="slt-source-line"><span>Illustrative operating data · {markets.length} covered markets · fixed USD</span><button type="button" className="slt-link" onClick={() => navigate(8,{region:m.region,period})}>Regional scorecard →</button></div>
      <div className="slt-chapter"><div><Keys n="03–04">Evidence in focus / {m.region}</Keys><h3>Inside {m.name}.</h3><p>{money(m.booked)} booked against {money(m.plan)} phased plan · {signed(m.booked - m.plan)} gap.</p></div>
        <div className="slt-filters"><MarketFilter value={m.id} markets={markets} change={select}/><SelectField label="Acquisition channel" value={channel} change={v => {setChannel(v as Channel);setLink(opportunityLink);}}>
          {(['all','partner','inbound'] as const).map(ch => <option key={ch} value={ch}>{channelNames[ch]}</option>)}</SelectField></div></div>
      <div className="slt-plates"><article><Keys n="03">Acquisition / day 14</Keys><h3>{flow && flow.total ? <>{flow.counts.opportunity} of {flow.total} leads became opportunities.</> : 'No comparable cohort.'}</h3>
        <p>{flow && flow.total ? (['partner','inbound'] as const).map((ch,i) => <React.Fragment key={ch}>{i > 0 && ' · '}<span>{channelNames[ch]}: {m.leads[i][0]}/{sum(m.leads[i])} ({rate(m.leads[i][0],sum(m.leads[i]))})</span></React.Fragment>) : 'An empty or immature cohort has no conversion rate.'}</p>
        {flow && link && <><LeadPlot flow={flow} universe={sum(m.leads[0])+sum(m.leads[1])} selected={link.id} select={setLink} compact/>
          <p className="slt-plate-reading">{nodeNames[link.from]} → {nodeNames[link.to]}: <b>{link.count}/{flow.total} ({rate(link.count,flow.total)})</b></p>
          <details className="slt-details"><summary>Inspect cohort counts</summary><LinkTable flow={flow} selected={link.id} select={setLink}/></details></>}
        <button type="button" className="slt-link" onClick={trace}>Trace the lead cohort →</button></article>
        <article><Keys n="04">Finance / weekly revision</Keys><h3>{f ? `${money(f.current)} quarter-end forecast.` : 'Forecast comparison unavailable.'}</h3><p>{f ? `${signed(f.current - f.prior)} since the prior cut; ${signed(f.current - f.target)} vs the full-quarter target.` : 'A missing cut is not a zero forecast.'}</p>
          {f && <><Waterfall f={f} selected={driver} select={setDriver} compact={false}/><p className="slt-plate-reading">{driverNames[driver]} contribution: <b>{signed(f.movements[driver])}</b></p>
            <details className="slt-details"><summary>Inspect forecast steps</summary><BridgeTable f={f} driver={driver} select={setDriver}/></details></>}
          <button type="button" className="slt-link" onClick={() => navigate(7, { ...scope, driver })}>Reconcile the forecast →</button></article></div>
      <div className="slt-action-band"><div><Keys n="05">Next operating review</Keys><h3>Put the finding on the agenda.</h3><p>{flow && link ? <>Revisit <strong>{m.name} · {channelNames[channel]}</strong> against this baseline: {nodeNames[link.from]} → {nodeNames[link.to]}, {link.count}/{flow.total} at day 14. Recording a follow-up does not change commercial data.</> : 'Choose an observed fact before drafting an investigation.'}</p></div>
        <div><small>Proposed checkpoint</small><strong>{printDate(nextReview(session.now))}</strong>{session.actor.planner && link && <button type="button" className="slt-primary" onClick={action}>Prepare cited follow-up →</button>}
          {session.actor.planner ? <button type="button" className="slt-link" onClick={() => navigate(6,scope)}>Open action register ({register.length}) →</button> : <button type="button" className="slt-link" onClick={trace}>Review the cohort →</button>}</div></div>
      <footer className="slt-source-line"><span>Commercial leadership · synthetic reporting cut · no tenant data</span><button type="button" className="slt-link" onClick={() => navigate(3,{...scope,region:m.region})}>Open market analysis →</button></footer></> :
      <p className="slt-empty">No completed reporting day in this quarter yet.</p>}</section>;
}
export function MarketReview({ session, mode, navigate, inputs }: SurfaceProps): React.ReactElement {
  const [period, setPeriod] = React.useState<Period>(inputs.period as Period || 'current-quarter');
  const [region, setRegion] = React.useState<Scope>(inputs.region as Scope || 'all'), [market, setMarket] = React.useState(String(inputs.marketId || ''));
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut).filter(k => region === 'all' || k.region === region).sort(byGap);
  const m = markets.find(k => k.id === market) || markets[0], full = mode === 'full';
  useHubVisibleScope({ entry: 3, stage: m ? 'selection' : 'unavailable', filters: { marketId: m && m.id, region, period },
    bookings:m?{asOf:cut.asOf,bookedUsd:m.booked*100000,planUsd:m.plan*100000}:undefined });
  return <section aria-label="Bookings market atlas"><Heading section="Market contribution">{m ? <>{m.name} is <em>{money(m.booked - m.plan)} {m.booked < m.plan ? 'below' : 'above'}</em> phased plan.</> : 'Awaiting the first close.'}</Heading>
    <Stamp cut={cut} unit="QTD bookings · fixed USD"/><div className="slt-filters"><RegionFilter value={region} change={r => { setRegion(r); setMarket(''); }}/>
      {m && <MarketFilter markets={markets} value={m.id} change={setMarket}/>}<PeriodFilter value={period} change={setPeriod}/></div>
    {m ? <><div className={full ? 'slt-mapspread' : 'slt-map-answer'}><div className={full ? '' : 'slt-mapcompact'}><Atlas markets={markets} active={m} select={setMarket}/></div>{full ? <Ranking markets={markets} active={m} select={setMarket}/> :
      <aside className="slt-map-aside"><Keys n="02">Selected market</Keys><h3>{m.name}</h3><p aria-live="polite">{money(m.booked)} booked / {money(m.plan)} phased plan · {rate(m.booked,m.plan)} attainment.</p>
        <div className="slt-foot"><button type="button" className="slt-link" onClick={() => navigate(9, { marketId: m.id, period, channel: 'all' })}>Lead conversion →</button>
          <button type="button" className="slt-link" onClick={() => navigate(7, { marketId: m.id, period })}>Forecast →</button></div></aside>}</div>
      {full && <p className="slt-market-read" aria-live="polite"><b>{m.name}</b> · {money(m.booked)} booked / {money(m.plan)} phased plan · {rate(m.booked,m.plan)} attainment</p>}
      <details className="slt-details" key={String(full)} open={full || undefined}><summary>Inspect ranked market values</summary><MarketTable markets={markets} active={m} select={setMarket}/></details>
      {full && <div className="slt-chapter"><div><Keys n="→">Investigate the gap</Keys><p>Compare a like-aged lead cohort or the quarter-end outlook. Neither explains the bookings variance on its own.</p></div>
        <button type="button" className="slt-link" onClick={() => navigate(9, { marketId: m.id, period, channel: 'all' })}>Inspect lead conversion →</button>
        <button type="button" className="slt-link" onClick={() => navigate(7, { marketId: m.id, period })}>Inspect forecast →</button></div>}</> :
      <p className="slt-empty">No booked-to-date cut for this window. A missing cut is not zero bookings.</p>}</section>;
}
export function Scorecard({ session, mode, navigate, inputs }: SurfaceProps): React.ReactElement {
  const [period, setPeriod] = React.useState<Period>(inputs.period as Period || 'current-quarter'), [region, setRegion] = React.useState<Scope>(inputs.region as Scope || 'all');
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut);
  const values = regions.map(name => ({ name, ...bookings(markets.filter(m => m.region === name)) })).sort((a,b) => a.gap - b.gap);
  const selected = markets.filter(m => region === 'all' || m.region === region), v = bookings(selected), full = mode === 'full';
  const max = Math.max(1, ...values.map(r => Math.max(r.booked, r.plan))) * 1.08;
  useHubVisibleScope({ entry: 8, stage: markets.length ? 'selection' : 'unavailable', filters: { region, period },
    bookings:markets.length?{asOf:cut.asOf,bookedUsd:v.booked*100000,planUsd:v.plan*100000}:undefined });
  return <section aria-label="Regional bookings scorecard"><Heading section="Bookings pace">{markets.length ? <>{region === 'all' ? 'Covered regions' : region}: <em>{v.attainment}</em> of phased plan.</> : 'Awaiting the first close.'}</Heading>
    <Stamp cut={cut} unit="QTD bookings · fixed USD"/><div className="slt-filters"><RegionFilter value={region} change={setRegion}/><PeriodFilter value={period} change={setPeriod}/></div>
    {markets.length ? <><div className={full ? 'slt-spread' : ''}><figure className="slt-bullets"><figcaption><Keys n="01">Regions ranked by signed gap</Keys></figcaption>{values.map(r =>
      <button type="button" key={r.name} className="slt-bullet" aria-pressed={r.name === region} onClick={() => setRegion(r.name)} aria-label={`${r.name}: ${money(r.booked)} booked, ${money(r.plan)} plan, ${signed(r.gap)}`}>
        <strong>{r.name}</strong><span className="slt-rail"><i style={{ width: `${r.booked / max * 100}%` }}/><b style={{ left: `${r.plan / max * 100}%` }}/></span><span>{signed(r.gap)}</span></button>)}
      <p className="slt-note">Bar: booked to date. Tick: phased plan through the same date.</p></figure>
      {full && <aside className="slt-margin"><Keys n="02">Reading the pace</Keys><h3>{money(v.booked)} booked.</h3><p>Weighted attainment uses total booked divided by total phased plan. It is not the average of market percentages.</p><p>{selected.length} eligible markets in this scope.</p></aside>}</div>
      <p className="slt-market-read"><b>{region === 'all' ? 'All covered markets' : region}</b> · {money(v.booked)} booked / {money(v.plan)} phased plan · {signed(v.gap)}</p>
      <div className="slt-evidence-actions"><details className="slt-details" key={String(full)} open={full || undefined}><summary>Inspect exact regional values</summary><table><caption>Booked to date and phased plan · USD millions</caption>
        <thead><tr>{['Select region','Booked','Plan','Gap','Pace'].map(k => <th scope="col" key={k}>{k}</th>)}</tr></thead><tbody>{values.map(r => <tr key={r.name} data-selected={region === r.name}>
          <th scope="row"><button type="button" aria-pressed={region === r.name} onClick={() => setRegion(r.name)}>{r.name}</button></th><td>{money(r.booked)}</td><td>{money(r.plan)}</td><td>{signed(r.gap)}</td><td>{r.attainment}</td></tr>)}</tbody></table></details>
        <button type="button" className="slt-link" onClick={() => navigate(3, { region, period })}>Open {region === 'all' ? 'covered' : region} markets →</button></div></> : <p className="slt-empty">No completed cut. Attainment is unavailable.</p>}</section>;
}
