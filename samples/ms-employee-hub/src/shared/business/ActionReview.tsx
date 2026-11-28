import * as React from 'react';
import type { SurfaceProps } from '../types';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import { actionError, captureEvidence, channelNames, checkpoints, commercialMarkets, driverNames, drivers, fiscalCut, forecast, leadFlow, nextReview, opportunityLink, ownerRoles, rate, receipts, recordAction, resolveEvidence, signed } from '../mockData/commercial';
import type { ActionFields, ActionReceipt, Channel, Driver, Evidence, Period, Workstream } from '../mockData/commercial';
import { Folio, Heading, Keys, MarketFilter, PeriodFilter, printDate, SelectField, Stamp } from './layout';

function Citation({ evidence: e }: { evidence: Evidence }): React.ReactElement {
  return <div className="slt-citation"><Keys n="E">Original evidence</Keys><strong>{e.citation}</strong><p><b>{e.market}</b> · {e.quarter} · cut {e.asOf} UTC</p></div>;
}
function Receipt({ r, compact }: { r: ActionReceipt; compact: boolean }): React.ReactElement {
  const history = <><dt>Checkpoint</dt><dd>{r.fields.checkpoint}</dd><dt>Recorded by</dt><dd>{r.actor} · <time dateTime={r.at}>{printDate(r.at)} at {r.at.slice(11,16)} UTC</time></dd></>;
  return <div><p className="slt-status"><i aria-hidden="true">✓</i> Recorded locally <b>{r.id}</b></p><h3>{r.evidence.title}</h3><Citation evidence={r.evidence}/>
    <dl className="slt-facts"><dt>Accountable role</dt><dd>{r.fields.owner}</dd><dt>Due at review</dt><dd>{r.fields.due} UTC</dd><dt>Revisit</dt><dd>{r.evidence.measure}</dd>
      {!compact && history}</dl>
    {compact && <details className="slt-details"><summary>Checkpoint and recording details</summary><dl className="slt-facts">{history}</dl></details>}
    <p className="slt-outcome"><b>Awaiting checkpoint.</b> {!compact && 'Compare a new cut with this baseline at the review. '}No assignment was sent and no commercial record changed.</p></div>;
}
const steps = ['Evidence','Ownership','Review','Receipt'];
function Progress({ active }: { active: number }): React.ReactElement {
  return <ol className="slt-progress" aria-label="Local action progress">{steps.map((s,i) =>
    <li key={s} aria-current={i === active ? 'step' : undefined} data-done={i < active}><span aria-hidden="true">{i < active ? '✓' : `0${i+1}`}</span>{s}</li>)}</ol>;
}
export default function ActionReview({ session: initialSession, inputs, mode }: SurfaceProps): React.ReactElement {
  const [checkedAt, setCheckedAt] = React.useState<number>();
  const session = checkedAt === undefined ? initialSession : { ...initialSession, now: new Date(checkedAt) };
  const [period, setPeriod] = React.useState<Period>(inputs.period as Period || 'current-quarter');
  const [marketId, setMarket] = React.useState(String(inputs.marketId || 'DE'));
  const [evidenceId, setEvidence] = React.useState(String(inputs.evidenceId || ''));
  const [stream, setStream] = React.useState<Workstream>(inputs.workstream as Workstream || 'qualification');
  const [channel, setChannel] = React.useState<Channel>('partner'), [driver, setDriver] = React.useState<Driver>('slippage');
  const [owner, setOwner] = React.useState(''), [point, setPoint] = React.useState('');
  const [due, setDue] = React.useState(String(inputs.dueDate || nextReview(session.now)));
  const [review, setReview] = React.useState(false), [confirmed, setConfirmed] = React.useState(false);
  const [error, setError] = React.useState(''), [receiptId, setReceiptId] = React.useState('');
  // Only enforce explicitly supplied scope on an incoming reference. The picker can subsequently change it.
  const incoming = !!inputs.evidenceId && evidenceId === inputs.evidenceId;
  const resolved = resolveEvidence(session, evidenceId, incoming ? inputs.marketId as string : marketId, incoming ? inputs.period as string : period);
  const e = resolved && (!incoming || !inputs.workstream || inputs.workstream === resolved.selection.kind) ? resolved : undefined;
  const register = receipts(session), receipt = receiptId ? register.find(r => r.id === receiptId) : register.find(r => !!e && r.evidence.id === e.id);
  const cut = fiscalCut(session.now, period), markets = commercialMarkets(session, cut), m = markets.find(x => x.id === marketId);
  const flow = m && cut.mature && leadFlow(m, channel), bridge = m && forecast(m);
  const fields: ActionFields = { evidenceId, workstream: e ? e.selection.kind : stream, owner, checkpoint: point, due };
  const stage = receipt ? 'receipt' : evidenceId && !e ? 'unavailable' : review ? 'review' : 'draft';
  useHubVisibleScope({ entry: 6, stage, filters:{marketId,period,workstream:fields.workstream} });
  const stageRef = React.useRef<HTMLDivElement>(null), screen = `${stage}/${evidenceId}/${receiptId}`, priorScreen = React.useRef(screen);
  React.useLayoutEffect(() => {
    if (screen !== priorScreen.current && stageRef.current) stageRef.current.focus();
    priorScreen.current = screen;
  }, [screen]);
  const choose = (): void => {
    const ref = captureEvidence(session, marketId, period, stream === 'forecast' ? { kind: 'forecast', driver } : { kind: 'qualification', channel, link: opportunityLink });
    if (!ref) { setError('No eligible evidence for this selection. Choose another market, window or source.'); return; }
    setEvidence(ref.id); setError('');
  };
  const clear = (): void => {
    setEvidence(''); setError(''); setReview(false); setConfirmed(false); setReceiptId(''); setOwner(''); setPoint('');
    setDue(String(inputs.dueDate || nextReview(session.now)));
  };
  const submitReview = (): void => {
    const problem = actionError(session, fields);
    setError(problem || ''); if (!problem) { setReview(true); setConfirmed(false); }
  };
  const confirm = (): void => {
    const result = recordAction(session, fields, confirmed);
    if (result.ok) { setReceiptId(result.receipt.id); setError(''); }
    else { if (result.checkedAt !== undefined) setCheckedAt(result.checkedAt); setError(result.message); }
  };
  const active = receipt ? 3 : review ? 2 : e ? 1 : 0, cited = receipt ? receipt.evidence : e;
  const effectiveDue = receipt ? receipt.fields.due : due, validDue = /^\d{4}-\d{2}-\d{2}$/.test(effectiveDue) && isFinite(new Date(`${effectiveDue}T00:00:00Z`).getTime());
  const registerLabel = `${register.length} recorded ${register.length === 1 ? 'action' : 'actions'}`;
  const registerList = <><p>Private to this session. Nothing is sent to CRM or assigned externally.</p>{register.map(r => <button key={r.id} type="button" className="slt-register" aria-pressed={receipt?.id === r.id} onClick={() => { setReceiptId(r.id); setError(''); }}>{r.id} · {r.evidence.market}<small>Due {r.fields.due} · {r.fields.owner}</small></button>)}</>;
  return <section className="slt-action-review" aria-label="Growth action register">{mode === 'full' && <Folio desk="Decision register" edition={cited ? cited.quarter : cut.label} asOf={cited ? cited.asOf : cut.asOf}/>}
    <Heading section="Operating actions">{receipt ? 'The follow-up is recorded.' : review ? 'Review before recording.' : 'Give the finding an owner.'}</Heading>
    {mode === 'full' && <p className="slt-action-intro">{receipt ? 'The evidence stays fixed. The next review gets a new observation.' : 'Carry one observed finding into the next review with a measure, an accountable role and a due date.'}</p>}
    {mode === 'full' && <Progress active={active}/>}
    <div className={mode === 'full' ? 'slt-spread' : ''}><div className="slt-action" ref={stageRef} role="region" aria-label={`Action ${stage}`} tabIndex={-1}>
      {receipt ? <><Receipt r={receipt} compact={mode === 'inline'}/><button type="button" className="slt-link" onClick={clear}>Choose different evidence →</button></> :
      evidenceId && !e ? <div role="alert"><h3>Evidence unavailable.</h3><p>This reference is missing, mismatched or no longer current. No baseline was substituted.</p>
        <button type="button" onClick={clear}>Select fresh evidence</button></div> :
      !e ? <><Keys n="01">Select evidence first</Keys><p>Choose an observed fact to cite. Preparing a finding does not record an action.</p>
        <div className="slt-filters">{markets.length > 0 && <MarketFilter markets={markets} value={marketId} change={setMarket}/>}<PeriodFilter value={period} change={setPeriod}/>
          <SelectField label="Workstream" value={stream} change={v => setStream(v as Workstream)}><option value="qualification">Lead qualification</option><option value="forecast">Forecast revision</option></SelectField>
          {stream === 'qualification' ? <SelectField label="Acquisition channel" value={channel} change={v => setChannel(v as Channel)}>{(['all', 'partner', 'inbound'] as const).map(k => <option key={k} value={k}>{channelNames[k]}</option>)}</SelectField> :
          <SelectField label="Forecast driver" value={driver} change={v => setDriver(v as Driver)}>{drivers.map(k => <option key={k} value={k}>{driverNames[k]}</option>)}</SelectField>}</div>
        <div className="slt-citation"><strong>{stream === 'qualification' ? flow && flow.total ? `${flow.counts.opportunity}/${flow.total} leads created opportunities (${rate(flow.counts.opportunity, flow.total)})` : 'No comparable observation' :
          bridge ? `${driverNames[driver]}: ${signed(bridge.movements[driver])}` : 'No comparable forecast cut'}</strong><Stamp cut={cut} unit={stream === 'qualification' ? 'Day-14 batch' : 'USD · full quarter'}/></div>
        <button type="button" className="slt-primary" onClick={choose}>Use this evidence →</button></> :
      <><Keys n={review ? '03' : '02'}>{review ? 'Decision brief' : 'Investigation brief'}</Keys><h3>{e.title}</h3><Citation evidence={e}/>
        {review ? <><dl className="slt-facts"><dt>Accountable role</dt><dd>{owner}</dd><dt>Review date</dt><dd>{due} UTC</dd><dt>Checkpoint</dt><dd>{point}</dd><dt>Measure</dt><dd>{e.measure}</dd></dl>
          <label className="slt-check"><input type="checkbox" checked={confirmed} onChange={ev => setConfirmed(ev.currentTarget.checked)}/>I confirm this session-only follow-up.</label>
          <div className="slt-foot"><button type="button" onClick={() => { setReview(false); setConfirmed(false); setError(''); }}>Edit action</button><button type="button" className="slt-primary" disabled={!confirmed} onClick={confirm}>Record session action</button></div></> :
        <><p><strong>Measure to revisit:</strong> {e.measure}.</p><div className="slt-filters">
          <SelectField label="Accountable role" value={owner} change={setOwner}><option value="">Choose a role</option>{ownerRoles[e.selection.kind].map(v => <option key={v}>{v}</option>)}</SelectField>
          <SelectField label="Review checkpoint" value={point} change={setPoint}><option value="">Choose a checkpoint</option>{checkpoints[e.selection.kind].map(v => <option key={v}>{v}</option>)}</SelectField>
          <label className="slt-field"><span>Future weekday (UTC)</span><input type="date" value={due} onChange={ev => setDue(ev.currentTarget.value)}/></label></div>
          <div className="slt-foot"><button type="button" onClick={clear}>Change evidence</button><button type="button" className="slt-primary" onClick={submitReview}>Review action →</button></div></>}</>}
      {error && <p role="alert" className="slt-error">{error}</p>}</div>
      {(mode === 'full' || register.length > 0) && <aside className="slt-action-rail">{mode === 'full' && <div className="slt-checkpoint"><Keys n="↳">{receipt ? 'Recorded checkpoint' : 'Proposed checkpoint'}</Keys>
        <h3>{validDue ? printDate(effectiveDue) : 'Choose a review date.'}</h3><p>{cited ? cited.measure : 'Choose the evidence to establish a baseline.'}</p>
        <div><small>Accountable role</small><strong>{receipt ? receipt.fields.owner : owner || 'Not yet selected'}</strong></div></div>}
        {mode === 'full' ? <div className="slt-register-area"><Keys n="R">Session register</Keys><h3>{registerLabel}</h3>{registerList}</div> :
          <details className="slt-details"><summary>Session register · {registerLabel}</summary>{registerList}</details>}</aside>}
    </div></section>;
}
