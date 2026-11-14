import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowRight20Regular, CheckmarkCircle20Regular, Clock20Regular, ShieldCheckmark20Regular } from '@fluentui/react-icons';
import type { IProcurementProperties, ProcurementIntentKey } from './catalog';
import type { IProcurementSnapshot } from './ProcurementInlineExperiences';
import { OWNERS } from './brand';
import { money } from './domain';
import { contracts, getPurchaseDecision, getPurchaseQueue, getReceipts, subscribeReceipts, supplierRecords } from './operations';
import { getInvestments, INVESTMENT_REGIONS, investmentTotals, investmentValueStages } from './portfolio';
import { CommitmentTrend, InvestmentMap } from './InvestmentCharts';
import { ValueRiver } from './ProcurementCharts';

interface IProps {
  readonly open: (intent: ProcurementIntentKey, properties?: IProcurementProperties) => void;
  readonly onContext?: (snapshot: IProcurementSnapshot) => void;
  readonly initialId?: string;
}
const useStyles = makeStyles({
  body: { minWidth: 0, display: 'grid', gap: '20px', marginBottom: '24px' },
  panel: { minWidth: 0, padding: '22px', border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow2, '@media(max-width:520px)': { padding: '16px' } },
  heading: { fontSize: '19px', lineHeight: '1.3', letterSpacing: '-0.3px', margin: '4px 0 8px' },
  eyebrow: { fontSize: '10px', letterSpacing: '1.4px', fontWeight: 600, color: tokens.colorNeutralForeground3, textTransform: 'uppercase' },
  muted: { color: tokens.colorNeutralForeground3, fontSize: '12px', lineHeight: '1.65', margin: '4px 0' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '16px', padding: '6px 0 12px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, '@media(max-width:700px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '16px' } },
  metric: { minWidth: 0, paddingLeft: '16px', borderLeft: `2px solid ${tokens.colorBrandStroke1}` },
  metricValue: { display: 'block', fontSize: '27px', lineHeight: '1.3', fontWeight: 650, letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums', '@media(max-width:520px)': { fontSize: '21px' } },
  split: { display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(280px,1fr)', gap: '20px', alignItems: 'start', '@media(max-width:1100px)': { gridTemplateColumns: '1fr' } },
  even: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '20px', '@media(max-width:800px)': { gridTemplateColumns: '1fr' } },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' },
  controls: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  field: { display: 'grid', gap: '6px', fontSize: '12px', fontWeight: 600, minWidth: 0 },
  input: { boxSizing: 'border-box', minHeight: '38px', padding: '8px 10px', minWidth: 0, width: '100%', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, fontFamily: 'inherit', ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}` } },
  queue: { marginTop: '16px', display: 'grid', gap: '2px' },
  row: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '12px', alignItems: 'center', padding: '16px 12px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, borderLeft: '3px solid transparent', '@media(max-width:520px)': { gridTemplateColumns: '1fr' } },
  selected: { backgroundColor: tokens.colorBrandBackground2, borderLeftColor: tokens.colorBrandStroke1 },
  rowName: { fontSize: '14px', fontWeight: 600, overflowWrap: 'anywhere', margin: '0 0 6px' },
  status: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, backgroundColor: tokens.colorPaletteMarigoldBackground1, color: tokens.colorPaletteMarigoldForeground1 },
  success: { backgroundColor: tokens.colorPaletteGreenBackground1, color: tokens.colorPaletteGreenForeground1 },
  danger: { backgroundColor: tokens.colorPaletteRedBackground1, color: tokens.colorPaletteRedForeground1 },
  owner: { display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' },
  portrait: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${tokens.colorNeutralBackground1}`, boxShadow: tokens.shadow4 },
  timeline: { listStyleType: 'none', padding: 0, margin: '18px 0', display: 'grid', gap: '20px' },
  milestone: { display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: '12px', fontSize: '13px' },
  stepIcon: { color: tokens.colorBrandForeground1, paddingTop: '2px' },
  evidence: { padding: '14px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  progress: { display: 'block', width: '100%', height: '8px', marginTop: '8px', accentColor: tokens.colorBrandBackground },
  programs: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '0 24px', '@media(max-width:740px)': { gridTemplateColumns: '1fr' } },
  program: { padding: '16px 0', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, minWidth: 0 },
  amount: { fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '13px' }
});
function useWorkspaceContext(onContext: IProps['onContext'], snapshot: IProcurementSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const last = React.useRef('');
  React.useEffect(() => {
    if (last.current === signature) return;
    last.current = signature;
    onContext?.(snapshot);
  }, [signature, onContext]);
}
function Metrics({ values }: { readonly values: readonly { label: string; value: string; detail: string }[] }): React.ReactElement {
  const s = useStyles();
  return <div className={s.metrics}>{values.map(item => <div className={s.metric} key={item.label}><span className={s.eyebrow}>{item.label}</span><strong className={s.metricValue}>{item.value}</strong><p className={s.muted}>{item.detail}</p></div>)}</div>;
}
function Owner({ owner }: { readonly owner: typeof OWNERS[keyof typeof OWNERS] }): React.ReactElement {
  const s = useStyles();
  return <div className={s.owner}><img className={s.portrait} src={owner.image} alt={`${owner.name}, ${owner.role}`} /><div><strong>{owner.name}</strong><p className={s.muted}>{owner.role} / fictional ZavaCore team</p></div></div>;
}
export function RequestsDashboard({ open, onContext, initialId }: IProps): React.ReactElement {
  const s = useStyles();
  const statusId = React.useId();
  const requests = React.useSyncExternalStore(subscribeReceipts, getPurchaseQueue, getPurchaseQueue);
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const [filter, setFilter] = React.useState('Needs review');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(initialId || requests[0].id);
  const selectedRequest = requests.find(request => request.id === selected);
  const visible = requests.filter(request => {
    const decision = getPurchaseDecision(request.id);
    return (filter === 'All requests' || (filter === 'Needs review' ? !decision : filter === 'Approved' ? decision?.result === 'approved' : decision?.result === 'returned' || decision?.result === 'declined')) &&
      `${request.id} ${request.category} ${request.outcome || ''}`.toLowerCase().indexOf(query.toLowerCase()) >= 0;
  });
  const decision = getPurchaseDecision(selected);
  const heroAward = selected === 'ZPC-REQ-1001' ? receipts.find(receipt => receipt.intent === 'ReviewSupplierAward' && receipt.result === 'approved') : undefined;
  const pending = requests.filter(request => !getPurchaseDecision(request.id)).length;
  const eur = requests.filter(request => request.currency === 'EUR').reduce((sum, request) => sum + request.budget, 0);
  useWorkspaceContext(onContext, { intent: 'ReviewPurchaseRequest', route: 'my-requests/dashboard', stage: 'inspect', selectedId: selected,
    summary: `${visible.length} visible requests; filter ${filter}; search ${query}; selected ${selectedRequest?.outcome || selectedRequest?.category || 'no match'}; ${pending} need review; EUR budget ${eur}.`,
    filters: { status: filter, query }, visibleIds: visible.map(request => request.id) });
  return <div className={s.body} data-workspace="my-requests" data-dashboard-layout="request-approval-journey">
    <Metrics values={[{ label: 'Needs review', value: String(pending), detail: 'Explicit budget-owner decision' }, { label: 'Business cases', value: String(requests.length), detail: 'Seeded + submitted this session' }, { label: 'EUR queue budget', value: money(eur), detail: 'Other currencies are not combined' }, { label: 'Session actions', value: String(receipts.length), detail: 'No external systems changed' }]} />
    <div className={s.split}>
      <section className={s.panel} aria-label="My Requests dashboard">
        <div className={s.toolbar}><div><span className={s.eyebrow}>Your decision inbox</span><h2 className={s.heading}>Outcomes in motion</h2></div><Button appearance="primary" icon={<ArrowRight20Regular />} onClick={() => open('CreatePurchaseIntent')}>New business case</Button></div>
        <div className={s.even}><div className={s.field}><label htmlFor={statusId}>Request status</label><select id={statusId} className={s.input} value={filter} onChange={event => setFilter(event.target.value)}>{['Needs review', 'All requests', 'Approved', 'Returned / declined'].map(item => <option key={item}>{item}</option>)}</select></div><label className={s.field}>Search requests<input className={s.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Outcome, category or request ID" /></label></div>
        <div className={s.queue}>{visible.map(request => {
          const processed = getPurchaseDecision(request.id);
          return <article className={mergeClasses(s.row, selected === request.id && s.selected)} key={request.id}>
            <div><p className={s.rowName}>{request.outcome || `${request.category} / ${request.quantity} units`}</p><p className={s.muted}>{request.id} / {money(request.budget, request.currency)}</p><span className={mergeClasses(s.status, processed?.result === 'approved' && s.success, (processed?.result === 'returned' || processed?.result === 'declined') && s.danger)}>{processed?.action || 'Awaiting budget-owner review'}</span></div>
            <div className={s.controls}><Button size="small" appearance="subtle" aria-pressed={selected === request.id} onClick={() => setSelected(request.id)}>Track {request.id}</Button><Button size="small" onClick={() => { setSelected(request.id); open('ReviewPurchaseRequest', { requestId: request.id }); }}>Review {request.id}</Button></div>
          </article>;
        })}{visible.length === 0 && <p role="status">No requests match this view. Change the search or status filter.</p>}</div>
      </section>
      <section className={s.panel} aria-label="Request approval journey"><span className={s.eyebrow}>One outcome / connected handoffs</span><h2 className={s.heading}>The path to impact</h2>
        {selectedRequest ? <><p className={s.muted}>{selectedRequest.id} / {selectedRequest.outcome || selectedRequest.category}</p><Owner owner={OWNERS.finance} /><ol className={s.timeline}>
          <li className={s.milestone}><CheckmarkCircle20Regular className={s.stepIcon} /><div><strong>Business outcome captured</strong><p className={s.muted}>{selectedRequest.quantity} units / {money(selectedRequest.budget, selectedRequest.currency)} / {selectedRequest.locations || selectedRequest.region}</p></div></li>
          <li className={s.milestone}><ShieldCheckmark20Regular className={s.stepIcon} /><div><strong>Budget & policy checkpoint</strong><p className={s.muted}>{decision ? `${decision.action}: ${decision.summary}` : 'Carole reviews the source evidence, commitment and rationale.'}</p></div></li>
          <li className={s.milestone}><Clock20Regular className={s.stepIcon} /><div><strong>Sourcing & award</strong><p className={s.muted}>{heroAward ? `${heroAward.action} / ${heroAward.id}` : decision?.result === 'approved' ? 'Ready for an explicit sourcing handoff. No award has been made.' : 'A separate human award decision is required.'}</p></div></li>
          <li className={s.milestone}><Clock20Regular className={s.stepIcon} /><div><strong>Deliver, reconcile, verify</strong><p className={s.muted}>Receipt evidence and invoice exceptions stay separate from delivery and realized value.</p></div></li>
        </ol><div className={s.controls}><Button onClick={() => open('CheckPurchasePolicy', { requestId: selected })}>Inspect policy</Button><Button onClick={() => open('CompareBuyingOptions', { requestId: selected })}>Compare fulfillment paths</Button></div></> : <p role="alert">No request matches {selected}. Select a known request; no record was substituted.</p>}
      </section>
    </div>
  </div>;
}
export function SupplierDashboard({ open, onContext, initialId }: IProps): React.ReactElement {
  const s = useStyles();
  const supplierId = React.useId();
  const [selected, setSelected] = React.useState(initialId || supplierRecords[0].id);
  const supplier = supplierRecords.find(item => item.id === selected);
  const related = contracts.filter(contract => contract.supplierId === selected);
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const mitigation = receipts.find(receipt => receipt.intent === 'PlanSupplierRiskMitigation' && receipt.recordId === selected);
  useWorkspaceContext(onContext, { intent: 'ExploreSupplier360', route: 'supplier-360/dashboard', stage: supplier ? 'inspect' : 'no-match', selectedId: selected,
    summary: supplier ? `${supplier.supplier}; region ${supplier.region}; risk ${supplier.risk}/100; quality ${supplier.quality}%; ${related.length} contracts; mitigation ${mitigation ? 'recorded in session' : 'not submitted'}.` : `No supplier matches ${selected}.` });
  return <div className={s.body} data-workspace="supplier-360" data-dashboard-layout="supplier-obligation-ledger">
    <section className={s.panel} aria-label="Supplier 360 dashboard"><div className={s.toolbar}><div><span className={s.eyebrow}>Supplier relationship / evidence before action</span><h2 className={s.heading}>Obligations meet dependency</h2></div><div className={s.field}><label htmlFor={supplierId}>Relationship supplier</label><select id={supplierId} className={s.input} value={selected} onChange={event => setSelected(event.target.value)}>{!supplier && <option value={selected}>{selected}</option>}{supplierRecords.map(item => <option key={item.id} value={item.id}>{item.supplier}</option>)}</select></div></div>
      {supplier ? <Metrics values={[{ label: 'Continuity risk', value: `${supplier.risk}/100`, detail: supplier.risk > 60 ? 'Elevated / intervention needed' : 'Monitor / not a guarantee' }, { label: 'Accepted quality', value: `${supplier.quality}%`, detail: 'Curated bid evidence' }, { label: 'Lead time', value: `${supplier.lead}d`, detail: `${supplier.region} sourcing corridor` }, { label: 'Confidence', value: `${supplier.confidence}%`, detail: 'Evidence coverage, not certainty' }]} /> : <p role="alert">No supplier matches {selected}. Choose a curated supplier.</p>}
    </section>
    {supplier && <div className={s.even}>
      <section className={s.panel}><span className={s.eyebrow}>Continuity / accountable intervention</span><h2 className={s.heading}>Keep the field moving</h2><Owner owner={OWNERS.risk} />
        <div className={s.evidence}><span className={mergeClasses(s.status, supplier.risk > 60 && s.danger)}>{supplier.risk > 60 ? 'Elevated exposure' : 'Monitoring required'}</span><h3 className={s.rowName}>A supplier score is a signal, not a decision.</h3><p className={s.muted}>Test the supplier disruption and alternate capacity before assigning a mitigation. Sustainability evidence scores {supplier.sustainability}/100.</p></div>
        <div className={s.evidence}><strong>{mitigation ? 'Mitigation submitted in this session' : 'No session mitigation submitted'}</strong><p className={s.muted}>{mitigation ? mitigation.summary : 'Define an activation trigger, accountable owner, cost and target date.'}</p></div>
        <div className={s.controls}><Button onClick={() => open('TrackSupplierRisk', { supplierId: selected })}>Model supplier exposure</Button><Button appearance="primary" onClick={() => open('PlanSupplierRiskMitigation', { supplierId: selected })}>Build mitigation plan</Button></div>
      </section>
      <section className={s.panel}><span className={s.eyebrow}>Relationship ledger</span><h2 className={s.heading}>Notice windows. No surprises.</h2><Owner owner={OWNERS.sourcing} />
        {related.map(contract => <div className={s.evidence} key={contract.id}><strong>{contract.id}</strong><p className={s.muted}>{money(contract.annualValue)} annual baseline / {contract.noticeDays}-day notice / proposed renewal uplift {contract.renewalIncrease}%</p><Button size="small" onClick={() => open('ReviewContractRenewal', { supplierId: selected, contractId: contract.id })}>Review contract renewal</Button></div>)}
        {related.length === 0 && <p className={s.muted}>No curated renewal contract for this supplier. Relationship evidence remains available; no contract was substituted.</p>}
        <div className={s.evidence}><strong>Qualification is separate from an award</strong><p className={s.muted}>Review evidence scope, conditions and expiry before treating a supplier as qualified.</p><Button size="small" onClick={() => open('ReviewSupplierQualification', { supplierId: selected })}>Review qualification</Button></div>
      </section>
    </div>}
  </div>;
}
export function SpendDashboard({ open, onContext, initialId }: IProps): React.ReactElement {
  const s = useStyles();
  const [region, setRegion] = React.useState(!initialId || initialId === 'All regions' ? 'Global' : initialId);
  const validScope = region === 'Global' || INVESTMENT_REGIONS.some(item => item === region);
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const programs = getInvestments(receipts);
  const selected = programs.filter(program => region === 'Global' || program.region === region);
  const totals = investmentTotals(selected);
  const stages = investmentValueStages(selected);
  useWorkspaceContext(onContext, { intent: 'ExploreSpendPerformance', route: 'spend-command/dashboard', stage: validScope ? 'inspect' : 'no-match', selectedId: region,
    summary: `${region}: ${selected.length} investment programs; planned EUR ${totals.budget}; committed EUR ${totals.committed}; delivered ${totals.delivered}/${totals.units} units; verified value EUR ${totals.realized}.`,
    filters: { region, currency: 'EUR' }, visibleIds: selected.map(program => program.id) });
  if (!validScope) return <section className={s.panel} data-workspace="spend-command" data-dashboard-layout="global-investment-command"><p role="alert">No investment region matches {region}. Choose a supported region; no region was substituted.</p><div className={s.controls}>{['Global', ...INVESTMENT_REGIONS].map(item => <Button key={item} onClick={() => setRegion(item)}>{item}</Button>)}</div></section>;
  return <div className={s.body} data-workspace="spend-command" data-dashboard-layout="global-investment-command">
    <div className={s.toolbar}><div><span className={s.eyebrow}>Global investments / authored EUR reporting model</span><h2 className={s.heading}>Every region. One accountable view.</h2></div><div className={s.controls} role="group" aria-label="Investment region">{['Global', ...INVESTMENT_REGIONS].map(item => <Button key={item} size="small" appearance={region === item ? 'primary' : 'secondary'} aria-pressed={region === item} onClick={() => setRegion(item)}>{item}</Button>)}</div></div>
    <Metrics values={[{ label: 'Planned investment', value: money(totals.budget), detail: `${selected.length} scoped procurement programs` }, { label: 'Committed', value: money(totals.committed), detail: `${Math.round(totals.committed / totals.budget * 100)}% of scoped budget` }, { label: 'Delivery progress', value: `${Math.round(totals.delivered / totals.units * 100)}%`, detail: `${totals.delivered.toLocaleString()} / ${totals.units.toLocaleString()} units` }, { label: 'Verified value', value: money(totals.realized), detail: 'Disputed amounts excluded' }]} />
    <div className={s.split}><section className={s.panel} aria-label="Global investment geography"><span className={s.eyebrow}>Investment footprint</span><h2 className={s.heading}>Where ambition becomes operations</h2><InvestmentMap records={programs} region={region} onRegion={setRegion} /></section>
      <section className={s.panel} aria-label="Investment commitment progress"><span className={s.eyebrow}>Execution / six-week scenario</span><h2 className={s.heading}>Commitment follows the plan</h2><CommitmentTrend records={selected} /></section></div>
    <div className={s.even}><section className={s.panel} aria-label="Scoped investment program ledger"><span className={s.eyebrow}>{region} / program ledger</span><h2 className={s.heading}>Delivery you can trace</h2><div className={s.programs}>{selected.map(program => <article className={s.program} key={program.id}><p className={s.rowName}>{program.name}</p><p className={s.muted}>{program.location} / {program.id}</p><p className={s.amount}>{money(program.committed)} / {money(program.budget)}</p><span className={s.status}>{program.stage}</span><progress className={s.progress} max={program.units} value={program.delivered} aria-label={`${program.name} delivered units`} /><p className={s.muted}>{program.delivered} / {program.units} units delivered</p><Button size="small" appearance="subtle" onClick={() => program.id === 'ZPC-INV-01' ? open('ReviewSupplierAward', { eventId: 'ZPC-RFP-31' }) : program.valueIds.length ? open('TrackLeakageRecovery', { opportunityId: program.valueIds[0] }) : open('TrackSupplierRisk', { supplierId: supplierRecords.find(supplier => supplier.region === program.region)?.id })}>{program.id === 'ZPC-INV-01' ? 'Review launch award' : program.valueIds.length ? 'Inspect verified value' : 'Inspect corridor risk'}</Button></article>)}</div></section>
      <section className={s.panel} aria-label="Scoped procurement value"><span className={s.eyebrow}>Opportunity is not a saving</span><h2 className={s.heading}>Prove the value, stage by stage</h2>{totals.realized > 0 ? <ValueRiver stages={stages} /> : <p className={s.muted}>No verified savings evidence is linked to the programs in {region}. Investment and delivery do not imply realized savings.</p>}<p className={s.muted}>Only source-backed realized amounts count. The {money(15000)} freight dispute remains excluded from verified regional totals.</p><Owner owner={OWNERS.finance} /><Button onClick={() => open('ResolveInvoiceException', { invoiceId: 'ZPC-8831' })}>Reconcile held invoice</Button></section></div>
  </div>;
}
