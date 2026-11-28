import * as React from 'react';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import type { SurfaceProps } from '../types';
import { captureEvidence, channelNames, commercialMarkets, fiscalCut, leadFlow, nodeNames, opportunityLink, rate, sum } from '../mockData/commercial';
import type { Channel, Market, NodeId, Period } from '../mockData/commercial';
import { Folio, graphKey, Heading, Keys, MarketFilter, PeriodFilter, SelectField, Stamp, usePlotWidth } from './layout';

type Flow = ReturnType<typeof leadFlow>;
const columns: ReadonlyArray<readonly NodeId[]> = [['partner', 'inbound'], ['qualified', 'unqualified'], ['opportunity', 'open', 'nurture', 'screened']];
const short: Record<NodeId, string> = { ...nodeNames, opportunity: 'Opportunity', open: 'Open', nurture: 'Nurture' };
const paint: Record<NodeId, string> = { partner: 'mint', inbound: 'blue', qualified: 'mint', unqualified: 'iris', opportunity: 'mint', open: 'blue', nurture: 'iris', screened: 'slate' };

export function leadGeometry(flow: Flow, width: number, universe: number, compact = false): {
  nodes: Array<{ key: NodeId; x: number; y: number; h: number; col: number }>; ribbons: Array<{ id: string; path: string; height: number }>
} {
  const scale = universe > 0 ? (compact ? 76 : 91) / universe : 0, span = compact ? 146 : 178, start = compact ? 26 : 32;
  const nodes = columns.reduce<Array<{ key: NodeId; x: number; y: number; h: number; col: number }>>((out, ids, col) => {
    const present = ids.filter(k => flow.counts[k] > 0), gap = present.length > 1 ? (span - flow.total * scale) / (present.length - 1) : 0;
    let y = present.length === 1 ? start + (span - flow.total * scale) / 2 : start;
    present.forEach(key => { const h = flow.counts[key] * scale; out.push({ key, x: 4 + col * (width - 16) / 2, y, h, col }); y += h + gap; });
    return out;
  }, []);
  const usedIn: Partial<Record<NodeId, number>> = {}, usedOut: Partial<Record<NodeId, number>> = {};
  const ribbons = flow.links.filter(l => l.count > 0).map(l => {
    const a = nodes.filter(n => n.key === l.from)[0], b = nodes.filter(n => n.key === l.to)[0];
    const x = a.x + 8, X = b.x, k = (x + X) / 2, y = a.y + (usedOut[l.from] || 0), Y = b.y + (usedIn[l.to] || 0), h = l.count * scale;
    usedOut[l.from] = (usedOut[l.from] || 0) + h; usedIn[l.to] = (usedIn[l.to] || 0) + h;
    return { id: l.id, height: h, path: `M${x} ${y} C${k} ${y},${k} ${Y},${X} ${Y} v${h} C${k} ${Y+h},${k} ${y+h},${x} ${y+h} Z` };
  });
  return { nodes, ribbons };
}
export function LeadPlot({ flow, universe, selected, select, compact }: { flow: Flow; universe: number; selected: string; select: (v: string) => void; compact: boolean }): React.ReactElement {
  const [ref, width] = usePlotWidth(), g = leadGeometry(flow, width, universe, compact), height = compact ? 182 : 220;
  const uid = React.useId().replace(/:/g,'');
  return <div ref={ref} className="slt-flow"><div className="slt-stages" aria-hidden="true"><span>Source</span><span>Qualification</span><span>Day-14 outcome</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} height={height} role="group" aria-label="Lead ribbons, from source through qualification to outcome">
    <defs>{(['mint','blue','iris','slate'] as const).map(t => <linearGradient id={`${uid}-${t}`} key={t} x1="0%" x2="100%"><stop offset="0%" stopColor={`var(--ribbon-${t}-start)`}/><stop offset="100%" stopColor={`var(--ribbon-${t}-end)`}/></linearGradient>)}</defs>
    {g.ribbons.map(r => {
      const l = flow.links.filter(x => x.id === r.id)[0], label = `${nodeNames[l.from]} → ${nodeNames[l.to]}: ${l.count} of ${flow.total}`;
      return <path key={r.id} d={r.path} style={{ fill:`url(#${uid}-${paint[l.to]})` }} className={`slt-ribbon ${paint[l.to]} ${selected === r.id ? 'chosen' : ''}`} role="button" tabIndex={0}
        aria-label={label} aria-pressed={selected === r.id} onClick={() => select(r.id)} onKeyDown={e => graphKey(e, () => select(r.id))}><title>{label}</title></path>;
    })}
    {g.nodes.map(n => <g key={n.key} pointerEvents="none"><rect x={n.x} y={n.y} width="8" height={n.h} rx="2" className="slt-node"/>
      <text x={n.x + (n.col === 2 ? 8 : n.col === 1 ? 4 : 0)} y={n.y - 5} textAnchor={n.col === 0 ? 'start' : n.col === 1 ? 'middle' : 'end'}>{short[n.key]} · {flow.counts[n.key]}</text></g>)}
  </svg></div>;
}
export function ChannelComparison({ market }: { market: Market }): React.ReactElement {
  const p = sum(market.leads[0]), i = sum(market.leads[1]), diff = p && i ? 100 * (market.leads[1][0]/i - market.leads[0][0]/p) : undefined;
  return <div className="slt-compare"><Keys n="02">Matched-age comparison</Keys><h3>Opportunity yield</h3>
    {(['partner', 'inbound'] as const).map((ch, i) => { const n = market.leads[i][0], d = sum(market.leads[i]); return <div key={ch} className="slt-compare-row">
      <div><strong>{channelNames[ch]}</strong><span>{n}/{d} · {rate(n, d)}</span></div><div className="slt-meter"><i style={{ width: `${d ? 100 * n / d : 0}%` }}/></div></div>; })}
    <p className="slt-note">{diff === undefined ? 'Both channels need an observed cohort to compare rates.' : diff === 0 ? 'Both sources converted at the same rate.' : <><b>{Math.abs(diff).toFixed(1)} percentage points</b> separate the two sources at the same age.</>}</p></div>;
}
export function LinkTable({ flow, selected, select }: { flow: Flow; selected: string; select: (v: string) => void }): React.ReactElement {
  return <table><caption>One cohort, two stages. Do not add across stages.</caption><thead><tr><th scope="col">Select a flow</th><th scope="col">Leads</th><th scope="col">Of cohort</th></tr></thead>
    <tbody>{flow.links.map(l => <tr key={l.id} data-selected={l.id === selected}><th scope="row"><button type="button" aria-pressed={l.id === selected}
      disabled={!l.count} onClick={() => select(l.id)}>{nodeNames[l.from]} → {nodeNames[l.to]}</button></th><td>{l.count}/{flow.total}</td><td>{rate(l.count, flow.total)}</td></tr>)}</tbody></table>;
}
export default function LeadReview(props: SurfaceProps): React.ReactElement {
  const { session, inputs, mode, navigate } = props, full = mode === 'full';
  const [period, setPeriod] = React.useState<Period>(inputs.period as Period || 'current-quarter');
  const [marketId, setMarket] = React.useState(String(inputs.marketId || 'DE')), [channel, setChannel] = React.useState<Channel>(inputs.channel as Channel || 'all');
  const [selection, setSelection] = React.useState(props.restoredSelection || opportunityLink);
  const changeChannel = (v: string): void => {
    const next = v as Channel, [source, stage] = selection.split(':');
    if (next !== 'all' && (source === 'partner' || source === 'inbound')) setSelection(`${next}:${stage}`);
    setChannel(next);
  };
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut), m = markets.find(v => v.id === marketId);
  const flow = m && cut.mature ? leadFlow(m, channel) : undefined;
  const link = flow && (flow.links.find(l => l.id === selection && l.count > 0) || flow.links.find(l => l.id === opportunityLink && l.count > 0) || flow.links.find(l => l.count > 0));
  useHubVisibleScope({ entry: 9, stage: link ? 'selection' : 'unavailable', filters: { marketId, period, channel },
    evidence: link && flow ? { numerator: link.count, denominator: flow.total, unit: 'leads', selected: link.id, asOf: cut.asOf } : undefined });
  const capture = (): void => {
    if (!m || !link) return;
    const evidence = captureEvidence(session, m.id, period, { kind: 'qualification', channel, link: link.id });
    if (evidence) navigate(6, { marketId, period, workstream: 'qualification', evidenceId: evidence.id });
  };
  const allLeads = m ? sum(m.leads[0]) + sum(m.leads[1]) : 0, allConverted = m ? m.leads[0][0] + m.leads[1][0] : 0;
  return <section className="slt-lead-review" aria-label="Lead conversion review">{full && <Folio desk="Demand generation" edition={cut.label} asOf={cut.asOf}/>}
    <div className={full ? 'slt-focusmast' : ''}><div><Heading section="Acquisition review">{flow && m ? flow.total ? <><em>{flow.counts.opportunity} of {flow.total}</em> {channel === 'all' ? '' : channel + ' '}leads became opportunities.</> : 'No leads in this cohort.' : 'Lead cohort not yet available.'}</Heading>
    <Stamp cut={cut} unit="Distinct leads · age 14 days"/></div>
    {full && m && flow && flow.total > 0 && <aside className="slt-desk-note"><Keys n="↳">Reading this cohort</Keys><p>{channel === 'all' ? <>{m.name} contributed <b>{allLeads} distinct leads</b> across two acquisition sources. Each lead appears in one outcome at day 14.</> :
      <>{channelNames[channel]} supplied <b>{flow.total} of {allLeads}</b> leads in {m.name} and <b>{flow.counts.opportunity} of {allConverted}</b> opportunities.</>}</p></aside>}</div>
    <div className="slt-filters">{markets.length > 0 && <MarketFilter markets={markets} value={marketId} change={setMarket}/>}
      <SelectField label="Acquisition channel" value={channel} change={changeChannel}>{(['all', 'partner', 'inbound'] as const).map(k => <option key={k} value={k}>{channelNames[k]}</option>)}</SelectField>
      <PeriodFilter value={period} change={setPeriod}/></div>
    {!m || !flow || !flow.total ? <p className="slt-empty" role="status">{!m ? 'No completed reporting cut for this fiscal window.' : !flow ? 'The first day-14 observation has not closed in this window. An immature batch has no comparable rate.' : 'No leads in this channel at this cut. Conversion is N/A, not 0%.'}</p> :
      <div className={full ? 'slt-lead-spread' : ''}>
        <figure className="slt-graph"><figcaption><Keys n="01">Cohort flow / {m.name}</Keys>{full && <h3>From intake to outcome</h3>}</figcaption><LeadPlot flow={flow} universe={allLeads} selected={link ? link.id : ''} select={setSelection} compact={!full}/>
          <div className="slt-readout" aria-live="polite">{link && <><div><small>Selected ribbon</small><b>{nodeNames[link.from]} → {nodeNames[link.to]}</b></div><span>{link.count}/{flow.total} · {rate(link.count, flow.total)}</span></>}</div></figure>
        {full && <aside className="slt-lead-margin"><ChannelComparison market={m}/><div className="slt-follow-note"><Keys n="03">Next review</Keys>
          <h3>Investigate qualification.</h3><p>Keep this cut as the baseline. A lower yield alone is not a reason to cut channel spend.</p>
          {session.actor.planner && <button type="button" className="slt-primary" onClick={capture}>Prepare an investigation →</button>}
          <button type="button" className="slt-link" onClick={() => navigate(7, { marketId, period })}>Inspect the forecast →</button></div></aside>}
        <div className="slt-evidence-actions"><details className="slt-details" key={full ? 'open' : 'folded'} open={full || undefined}><summary>Inspect exact flow counts</summary><LinkTable flow={flow} selected={link ? link.id : ''} select={setSelection}/></details>
          {!full && session.actor.planner && <button type="button" className="slt-link" onClick={capture}>Prepare an investigation →</button>}</div>
      </div>}
  </section>;
}
