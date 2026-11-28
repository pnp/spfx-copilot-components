import * as React from 'react';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import type { SurfaceProps } from '../types';
import { captureEvidence, commercialMarkets, driverNames, drivers, fiscalCut, forecast, money, signed } from '../mockData/commercial';
import type { Driver, Period } from '../mockData/commercial';
import { graphKey, Heading, Keys, MarketFilter, PeriodFilter, SelectField, Stamp, usePlotWidth } from './layout';

type Outlook = NonNullable<ReturnType<typeof forecast>>;
interface Step { key: 'prior' | Driver | 'current'; name: string; short: string; start: number; end: number; delta: number; driver?: Driver }
const short: Record<Driver, string> = { new: 'New', expansion: 'Expand', slippage: 'Slip', reductions: 'Reduce' };
const explanation: Record<Driver, string> = { new: 'New business entered the expected quarter-end bookings estimate.',
  expansion: 'The estimated size of opportunities already in the quarter increased.',
  slippage: 'Booking dates moved beyond the quarter. A deferral is not necessarily a lost sale.',
  reductions: 'Previously expected booking values were reduced in the later estimate.' };
export function bridgeSteps(f: Outlook): Step[] {
  let running = f.prior;
  const steps: Step[] = [{ key: 'prior', name: 'Previous forecast', short: 'Prior', start: 0, end: f.prior, delta: f.prior }];
  drivers.forEach(d => { const start = running, delta = f.movements[d]; running += delta;
    steps.push({ key: d, name: driverNames[d], short: short[d], start, end: running, delta, driver: d }); });
  steps.push({ key: 'current', name: 'Current forecast', short: 'Now', start: 0, end: f.current, delta: f.current }); return steps;
}
export function BridgeTable({ f, driver, select }: { f: Outlook; driver: Driver; select: (v: Driver) => void }): React.ReactElement {
  return <table><caption>One cut pair, one market · USD millions</caption>
    <thead><tr><th scope="col">Step / select driver</th><th scope="col">Amount</th><th scope="col">Running</th></tr></thead><tbody>{bridgeSteps(f).map(s => <tr key={s.key} data-selected={driver === s.key}><th scope="row">{s.driver ?
      <button type="button" aria-pressed={s.driver === driver} onClick={() => select(s.driver as Driver)}>{s.name}</button> : s.name}</th><td>{s.driver ? signed(s.delta) : money(s.end)}</td><td>{money(s.end)}</td></tr>)}</tbody></table>;
}
export function Waterfall({ f, selected, select, compact }: { f: Outlook; selected: Driver; select: (v: Driver) => void; compact: boolean }): React.ReactElement {
  const [ref, w] = usePlotWidth(), steps = bridgeSteps(f), max = Math.max(f.target, ...steps.map(s => Math.max(s.start, s.end))) * 1.18;
  const baseline = compact ? 131 : 177, slot = w / steps.length, bw = slot * .48, x = (i: number): number => (i + .5) * slot, y = (v: number): number => baseline - v / max * (baseline - 34);
  return <figure className="slt-bridge"><figcaption><Keys n="01">Forecast steps / USD millions</Keys></figcaption><div ref={ref}><svg role="group" aria-label="Signed forecast bridge from previous cut to current cut" viewBox={`0 0 ${w} ${baseline + 31}`} height={baseline + 31}>
    <path d={`M0 ${y(0)}H${w}`} className="slt-axis"/><path d={`M0 ${y(f.target)}H${w}`} className="slt-target"/><text x="0" y="19" className="slt-chart-label">Quarter target {money(f.target)} · dashed line</text>
    {steps.map((s, i) => <g key={s.key} className={s.driver === selected ? 'slt-step active' : 'slt-step'} role={s.driver ? 'button' : undefined} tabIndex={s.driver ? 0 : undefined}
      aria-pressed={s.driver ? s.driver === selected : undefined} aria-label={`${s.name}: ${s.driver ? signed(s.delta) : money(s.end)}, running ${money(s.end)}`}
      onClick={s.driver ? () => select(s.driver as Driver) : undefined} onKeyDown={s.driver ? e => graphKey(e, () => select(s.driver as Driver)) : undefined}>
      <title>{s.name}: {s.driver ? signed(s.delta) : money(s.end)}</title>
      {i < steps.length - 1 && <path d={`M${x(i) + bw / 2} ${y(s.end)}H${x(i+1) - bw/2}`} className="slt-connector"/>}
      <rect x={x(i) - bw / 2} y={Math.min(y(s.start),y(s.end))} width={bw} height={Math.max(1, Math.abs(y(s.start)-y(s.end)))} rx="2" className={!s.driver ? 'stock' : s.delta < 0 ? 'sub' : 'add'}/>
      <text x={x(i)} y={Math.min(y(s.start),y(s.end))-7} textAnchor="middle" className="slt-chart-label">{s.driver ? `${s.delta < 0 ? '−' : '+'}${(Math.abs(s.delta)/10).toFixed(1)}` : (s.end/10).toFixed(1)}</text>
      <text x={x(i)} y={baseline + 20} textAnchor="middle" className="slt-chart-label">{s.short}</text></g>)}
  </svg></div></figure>;
}
export default function ForecastReview({ mode, inputs, session, navigate }: SurfaceProps): React.ReactElement {
  const [period, setPeriod] = React.useState<Period>(inputs.period as Period || 'current-quarter'), [marketId, setMarket] = React.useState(String(inputs.marketId || 'DE'));
  const [driver, setDriver] = React.useState<Driver>(inputs.driver as Driver || 'slippage');
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut), m = markets.find(k => k.id === marketId), f = m && forecast(m), full = mode === 'full';
  const prepare = (): void => {
    const ref = captureEvidence(session, marketId, period, { kind: 'forecast', driver });
    if (ref) navigate(6, { marketId, period, evidenceId: ref.id, workstream: 'forecast' });
  };
  useHubVisibleScope({ entry: 7, stage: f ? 'selection' : 'unavailable', filters: { marketId, period, driver },
    forecast:f?{priorCut:cut.priorAsOf,currentCut:cut.asOf,priorUsd:f.prior*100000,currentUsd:f.current*100000,movementUsd:f.movements[driver]*100000}:undefined });
  return <section aria-label="Forecast movement review"><Heading section="Quarter-end forecast">{m && f ? <>{m.name}’s forecast {f.current === f.prior ? 'held at' : f.current < f.prior ? 'fell to' : 'rose to'} <em>{money(f.current)}.</em></> : 'Forecast comparison unavailable.'}</Heading>
    <Stamp cut={cut} unit="Same full quarter · fixed USD"/><div className="slt-filters">{m && <MarketFilter markets={markets} value={marketId} change={setMarket}/>}<PeriodFilter value={period} change={setPeriod}/>
      <SelectField label="Forecast driver" value={driver} change={v => setDriver(v as Driver)}>{drivers.map(d => <option key={d} value={d}>{driverNames[d]}</option>)}</SelectField></div>
    {m && f ? <><div className={full ? 'slt-spread' : ''}><div><Waterfall f={f} selected={driver} select={setDriver} compact={!full}/>
      <p className="slt-market-read"><b>{signed(f.current - f.prior)}</b> vs prior cut ({cut.priorAsOf}); <b>{signed(f.current - f.target)}</b> vs {money(f.target)} full-quarter target.</p></div>
      {full && <aside className="slt-margin"><Keys n="02">Driver under review</Keys><h3>{driverNames[driver]}: {signed(f.movements[driver])}.</h3><p>{explanation[driver]}</p>
        <p>These are successive estimates for {cut.label}, not booked revenue. Only the signed drivers sum to the net change.</p>{session.actor.planner && <button type="button" className="slt-primary" onClick={prepare}>Prepare a forecast review →</button>}</aside>}</div>
      {!full && <p className="slt-note" aria-live="polite">{driverNames[driver]}: {signed(f.movements[driver])}. {explanation[driver]}</p>}
      <div className="slt-evidence-actions"><details className="slt-details" key={String(full)} open={full || undefined}><summary>Inspect the exact bridge</summary><BridgeTable f={f} driver={driver} select={setDriver}/></details>
      {!full && session.actor.planner && <button type="button" className="slt-link" onClick={prepare}>Prepare a forecast review →</button>}</div></> :
      <p className="slt-empty">No comparable weekly cut pair in this window. A missing opening estimate is not zero.</p>}</section>;
}
