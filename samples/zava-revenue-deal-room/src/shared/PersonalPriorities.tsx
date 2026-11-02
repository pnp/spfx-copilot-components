import * as React from 'react';
import { Badge, Button, makeStyles, tokens } from '@fluentui/react-components';
import { Chat20Regular } from '@fluentui/react-icons';
import { getDealStore } from './dealWorkflow';
import { currency } from './operations';
import { personalRevenueBrief, type IRevenuePriority } from './priorities';
import { D3ClosePlanStatus, D3ForecastBridge, D3PipelineQuality } from './visualizations/RevenueCharts';

const useStyles = makeStyles({
  root: { minWidth: 0, display: 'grid', gap: tokens.spacingVerticalM },
  hero: { padding: tokens.spacingVerticalL, borderRadius: tokens.borderRadiusLarge, backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground2}, ${tokens.colorNeutralBackground2})`, border: `1px solid ${tokens.colorBrandStroke2}` },
  eyebrow: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold, letterSpacing: '1px' },
  heading: { margin: '8px 0', fontSize: tokens.fontSizeBase600 },
  muted: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300, overflowWrap: 'anywhere' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: tokens.spacingHorizontalS },
  kpi: { minWidth: 0, padding: tokens.spacingVerticalM, borderRadius: tokens.borderRadiusMedium, border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1, overflowWrap: 'anywhere' },
  value: { display: 'block', margin: '8px 0', fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1 },
  queue: { display: 'grid', gap: tokens.spacingVerticalS },
  priority: { padding: tokens.spacingVerticalM, border: `1px solid ${tokens.colorNeutralStroke2}`, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1, overflowWrap: 'anywhere' },
  title: { margin: '8px 0', fontSize: tokens.fontSizeBase400 },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacingHorizontalS }
});
const compact = (value: number): string => `$${(value / 1000000).toFixed(2)}M`;

export default function PersonalPriorities(props: {
  readonly period: string;
  readonly region: string;
  readonly onStateChange: (state: Readonly<Record<string, unknown>>) => void;
  readonly onAction: (priority: IRevenuePriority) => Promise<void>;
  readonly sending: boolean;
  readonly pendingAction: string;
  readonly compact?: boolean;
}): React.ReactElement {
  const styles = useStyles();
  const [store] = React.useState(getDealStore);
  const requests = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const brief = personalRevenueBrief(props.period, props.region, requests.requests);
  const [stage, setStage] = React.useState('Next actions');
  const [page, setPage] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState('');
  const pages = Math.max(1, Math.ceil(brief.priorities.length / 2));
  const currentPage = Math.min(page, pages - 1);
  const shown = props.compact ? brief.priorities.slice(currentPage * 2, currentPage * 2 + 2) : brief.priorities;
  const selected = brief.priorities.find(item => item.id === selectedId);
  const visible = props.compact ? stage === 'Next actions' ? selected ? [selected] : shown : [] : brief.priorities;
  const serialized = JSON.stringify({
    ...brief, priorities: visible, view: 'personal-revenue-priorities', period: props.period, region: props.region,
    stage: props.compact ? stage : 'Full brief', page: props.compact && (stage !== 'Next actions' || selected) ? 1 : currentPage + 1,
    pageCount: props.compact && (stage !== 'Next actions' || selected) ? 1 : pages, catalogPage: currentPage + 1, selectedId,
    visibleFields: props.compact ? stage === 'Next actions' ? selected ? ['title', 'detail', 'due', 'source', 'target'] : ['title', 'due', 'rank', 'target'] : ['metrics', stage === 'Pipeline' ? 'opportunities' : stage === 'Outlook' ? 'outlook' : 'closeStatus'] : ['metrics', 'priorities', 'opportunities', 'outlook', 'closeStatus'],
    chart: props.compact ? stage === 'Next actions' ? selected ? null : { kind: 'owned-action-cockpit', records: shown.map(item => ({ id: item.id, due: item.due, source: item.source, target: item.target, opportunityId: item.opportunityId, requestId: item.requestId })), matchingPriorities: brief.priorities.length, semantics: 'Ordered evidence/dependency tasks with recorded due cues, not numerical priority or risk scores.' } : stage === 'Pipeline' ? { kind: 'owned-book-pipeline', opportunities: brief.opportunities } : stage === 'Outlook' ? { kind: 'seller-outlook', open: brief.metrics.open, weighted: brief.metrics.weighted } : { kind: 'close-status', records: brief.closeStatus } : undefined,
    semantics: 'Offline owned-book records for Megan Bowen, not a query of the signed-in user. Pipeline values are catalog math and seller judgment. Request decisions are a separate all-submission-period ledger; approval never changes CRM pipeline.'
  });
  React.useEffect(() => { props.onStateChange(JSON.parse(serialized)); }, [serialized, props.onStateChange]);
  if (props.compact) return <section className={styles.root} aria-label="Personal revenue priorities" data-layout="personal-revenue-priorities">
    <div className={styles.actions} aria-label="Revenue brief stages">{['Next actions', 'Pipeline', 'Outlook', 'Close plan'].map(label => <Button key={label} size="small" aria-pressed={stage === label} onClick={() => setStage(label)}>{label}</Button>)}</div>
    <p className={styles.muted}>Megan Bowen&apos;s owned book / current work and next actions.</p>
    {requests.storageWarning && <p role="alert">{requests.storageWarning}</p>}
    {stage === 'Next actions' ? <>
      <h2 className={styles.title}>Focus your next move.</h2>
      {selected ? <article className={styles.priority}>
        <Button size="small" onClick={() => setSelectedId('')}>Back to priorities</Button><h3 className={styles.title}>{selected.title}</h3>
        <p>{selected.detail}</p><p className={styles.muted}>{selected.due} / {selected.opportunityId || selected.requestId}</p><p className={styles.muted}>{selected.source}</p>
        <Button icon={<Chat20Regular />} disabled={props.sending} onClick={() => props.onAction(selected)}>{selected.actionLabel}</Button>
      </article> : <>
        <div className={styles.actions} data-business-kind="owned-action-cockpit"><Badge appearance="tint">{brief.priorities.length} matching next actions</Badge><span className={styles.muted}>Owned open book <strong>{compact(brief.metrics.open)}</strong></span></div>
        <div className={styles.queue}>{shown.map(priority => <article key={priority.id} className={styles.priority}>
          <h3 className={styles.title}>{priority.title}</h3><div className={styles.actions}><Badge appearance="tint">{priority.due}</Badge><span className={styles.muted}>{priority.opportunityId || priority.requestId}</span><Button size="small" onClick={() => setSelectedId(priority.id)}>Inspect priority</Button></div>
        </article>)}</div>
        <div className={styles.actions}><Button size="small" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous priorities</Button><span>Page {currentPage + 1} / {pages}</span><Button size="small" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next priorities</Button></div>
      </>}
      {!visible.length && <p role="status">No priorities match these filters. No task was substituted.</p>}
    </> : stage === 'Pipeline' ? <>
      <div className={styles.kpis}><div><span>Open pipeline</span><strong className={styles.value}>{compact(brief.metrics.open)}</strong></div><div><span>Seller-weighted / not commit</span><strong className={styles.value}>{compact(brief.metrics.weighted)}</strong></div></div>
      <D3PipelineQuality compact opportunities={brief.opportunities} />
      <p className={styles.muted}>{currency(brief.metrics.commitStage)} catalog commit-stage; independent forecast review still required.</p>
    </> : stage === 'Outlook' ? <>
      <h2 className={styles.title}>Open → seller-weighted outlook</h2>
      <svg style={{ width: '100%', height: '150px', display: 'block' }} viewBox="0 0 500 150" role="img" aria-label={`Open ${currency(brief.metrics.open)}, seller-weighted ${currency(brief.metrics.weighted)}`}>
        <title>Catalog outlook arithmetic, not a forecast movement or predicted loss</title>
        {[{ label: 'Open', value: brief.metrics.open }, { label: 'Seller-weighted', value: brief.metrics.weighted }].map((item, index) => <g key={item.label}><text x="0" y={30 + index * 65} fill={tokens.colorNeutralForeground1} fontSize="13">{item.label}</text><rect x="130" y={8 + index * 65} width={item.value / Math.max(1, brief.metrics.open) * 300} height="32" rx="4" fill={tokens.colorBrandBackground} /><text x="130" y={57 + index * 65} fill={tokens.colorNeutralForeground1} fontSize="13">{currency(item.value)}</text></g>)}
      </svg><p className={styles.muted}>{currency(brief.metrics.open - brief.metrics.weighted)} seller-unweighted value. Not predicted loss or committed forecast.</p>
      <p className={styles.muted}>{brief.metrics.pendingRequests} requests awaiting review / {brief.metrics.approvedRequests} approved. All submission periods; approvals never change pipeline.</p>
    </> : <D3ClosePlanStatus compact statuses={brief.closeStatus} />}
  </section>;
  return <section className={styles.root} aria-label="Personal revenue priorities" data-layout="personal-revenue-priorities">
    <div className={styles.hero}>
      <span className={styles.eyebrow}>YOUR REVENUE BRIEF</span>
      <h2 className={styles.heading}>Focus your next move.</h2>
      <p className={styles.muted}>{`Showing ${brief.bookOwner}'s owned book. Status and actions follow the selected quarter and region.`}</p>
      <Badge appearance="tint">{brief.opportunities.length} opportunities in view</Badge>
    </div>
    {requests.storageWarning && <p role="alert">{requests.storageWarning}</p>}
    <div className={styles.kpis}>
      <div className={styles.kpi}><span>Open pipeline</span><strong className={styles.value}>{compact(brief.metrics.open)}</strong><span className={styles.muted}>{currency(brief.metrics.open)} catalog value</span></div>
      <div className={styles.kpi}><span>Seller-weighted outlook</span><strong className={styles.value}>{compact(brief.metrics.weighted)}</strong><span className={styles.muted}>{currency(brief.metrics.weighted)} / not commit</span></div>
      <div className={styles.kpi}><span>Catalog commit-stage value</span><strong className={styles.value}>{compact(brief.metrics.commitStage)}</strong><span className={styles.muted}>Still requires independent forecast review</span></div>
      <div className={styles.kpi}><span>Requests awaiting review</span><strong className={styles.value}>{brief.metrics.pendingRequests}</strong><span className={styles.muted}>{brief.metrics.approvedRequests} approved / all submission periods</span></div>
    </div>
    <section aria-label="Top revenue actions">
      <h2 className={styles.heading}>Your top priorities</h2>
      <p className={styles.muted}>Top {brief.priorities.length} of {brief.priorityCount} next actions. Buyer-proof gaps, blocked dependencies, request status and catalog-stage exposure drive these editorial rules, not an AI risk score.</p>
      <div className={styles.queue}>{brief.priorities.map((priority, index) => <article key={priority.id} className={styles.priority}>
        <Badge appearance="tint" color={priority.rank >= 90 ? 'warning' : 'informative'}>{index + 1} / {priority.kind}</Badge>
        <h3 className={styles.title}>{priority.title}</h3>
        <p>{priority.detail}</p><p className={styles.muted}>{priority.due} / {priority.opportunityId || priority.requestId}</p>
        <div className={styles.actions}><Button appearance="primary" icon={<Chat20Regular />} disabled={props.sending} onClick={() => props.onAction(priority)}>{props.sending && props.pendingAction === `priority-${priority.id}` ? 'Sending...' : priority.actionLabel}</Button></div>
      </article>)}</div>
      {!brief.priorities.length && <p role="status">No priorities match these filters. Change the quarter or region; no task was substituted.</p>}
    </section>
    <D3PipelineQuality opportunities={brief.opportunities} />
    {brief.opportunities.length > 0 ? <D3ForecastBridge movements={brief.outlook} title="Open pipeline to seller-weighted outlook" description="Subtract each stage's seller-unweighted value from open pipeline. This is current catalog arithmetic, not historical movement, predicted loss or a committed forecast." /> : <p role="status">No opportunities in this book scope; an outlook bridge was not fabricated.</p>}
    <D3ClosePlanStatus statuses={brief.closeStatus} />
  </section>;
}
