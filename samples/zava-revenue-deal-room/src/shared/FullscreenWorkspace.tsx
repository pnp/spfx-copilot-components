import * as React from 'react';
import { Badge, Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowRight20Regular, ArrowLeft20Regular, CheckmarkCircle20Regular, ShieldCheckmark20Regular } from '@fluentui/react-icons';
import { ACCOUNTS, OPPORTUNITIES, type IOpportunity } from './domain';
import { getIntent, LENS_LABELS, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { currency, resolveScope, scopedEvidence } from './operations';
import { getDealStore, dealEconomics, nextApproval } from './dealWorkflow';
import { useDealOperationsSession } from './DealOperations';
import RevenueExperiences from './RevenueExperiences';
import CountryRevenueExperience from './CountryRevenueExperience';
import { personalRevenueBrief } from './priorities';
import { D3ForecastBridge } from './visualizations/RevenueCharts';
import { ApprovalWorkloadVisual } from './visualizations/PortfolioDecisionVisuals';
import { ZAVAMESH } from './brand';
import {
  FULLSCREEN_STORIES, fullscreenLensFor, fullscreenTask, fullscreenTaskContext, fullscreenNextAction, fullscreenRelatedTasks,
  type FullscreenWorkspaceLens, type IFullscreenTask
} from './fullscreenWorkspaceModel';
import type { IModelContextSnapshot, IRevenueAppProps } from './RevenueApp';

const useStyles = makeStyles({
  surface: { minWidth: 0, display: 'grid', gap: '24px' },
  hero: { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '24px', padding: '28px', borderRadius: '18px', color: tokens.colorNeutralForegroundOnBrand, backgroundImage: `url(${ZAVAMESH.meshWave}), linear-gradient(115deg, #10331C, #23701A 68%, #4F901F)`, backgroundSize: 'cover', boxShadow: tokens.shadow16, '@media(max-width:760px)': { padding: '20px', gridTemplateColumns: 'minmax(0,1fr)' } },
  heroTitle: { fontFamily: 'Aptos Display, Segoe UI, sans-serif', margin: '12px 0 8px', fontSize: '40px', lineHeight: '1.12', letterSpacing: '-1px', overflowWrap: 'anywhere', '@media(max-width:520px)': { fontSize: '30px' } },
  heroCopy: { margin: 0, maxWidth: '740px', opacity: .9, lineHeight: '1.5' },
  heroArt: { width: '96px', height: '120px', objectFit: 'cover', objectPosition: 'center 65%', borderRadius: '12px', alignSelf: 'center', '@media(max-width:760px)': { display: 'none' } },
  trail: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, color: tokens.colorNeutralForeground2 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minWidth: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(250px,.8fr)', gap: '24px', alignItems: 'start', '@media(max-width:1100px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
  visualGrid: { gridTemplateColumns: 'minmax(0,1fr)' },
  visualContext: { gridTemplateColumns: 'repeat(3,minmax(0,1fr))', '@media(max-width:760px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px', '@media(max-width:760px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
  card: { minWidth: 0, padding: '20px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '14px', boxShadow: tokens.shadow4 },
  task: { minWidth: 0, padding: '20px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '16px', backgroundColor: tokens.colorNeutralBackground1, boxShadow: tokens.shadow8, '@media(max-width:520px)': { padding: '12px' } },
  origin: { minWidth: 0 },
  compactOrigin: { display: 'contents' },
  body: { display: 'contents' },
  heading: { margin: '0 0 12px', fontSize: '22px', lineHeight: '1.2', letterSpacing: '-.4px' },
  subtitle: { margin: '4px 0 16px', color: tokens.colorNeutralForeground2, lineHeight: '1.5' },
  metric: { display: 'block', margin: '8px 0', fontSize: '30px', fontWeight: 700, letterSpacing: '-.7px', fontVariantNumeric: 'tabular-nums', color: tokens.colorBrandForeground1, overflowWrap: 'anywhere' },
  eyebrow: { fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', '& button': { whiteSpace: 'normal', textAlign: 'left' } },
  list: { display: 'grid', gap: '10px' },
  row: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '16px', padding: '16px', minWidth: 0, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, '@media(max-width:520px)': { gridTemplateColumns: 'minmax(0,1fr)', gap: '8px' } },
  stackedRow: { gridTemplateColumns: 'minmax(0,1fr)', gap: '10px' },
  rowTitle: { display: 'block', fontSize: '15px', marginBottom: '5px', overflowWrap: 'anywhere' },
  small: { display: 'block', fontSize: '12px', color: tokens.colorNeutralForeground2, lineHeight: '1.5', overflowWrap: 'anywhere' },
  proof: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' },
  proofCell: { width: '24px', height: '24px', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 700 },
  filters: { display: 'flex', flexWrap: 'wrap', gap: '12px', '& label': { display: 'grid', gap: '4px', color: tokens.colorNeutralForeground2, fontSize: '12px' }, '& select': { minWidth: '130px', padding: '7px', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: '6px', backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1 } },
  note: { margin: '12px 0 0', fontSize: '12px', lineHeight: '1.5', color: tokens.colorNeutralForeground2 },
  error: { color: tokens.colorPaletteRedForeground1 },
  context: { display: 'grid', gap: '16px', minWidth: 0 },
  scope: { display: 'block', fontSize: '13px', color: tokens.colorBrandForeground1, fontWeight: 600, overflowWrap: 'anywhere' },
  hidden: { display: 'none' }
});

interface IWorkspaceProps extends IRevenueAppProps {
  readonly fullScreen: boolean;
  readonly activeLens: FullscreenWorkspaceLens;
  readonly navigationVersion: number;
  readonly onNavigateTask: (lens: FullscreenWorkspaceLens) => void;
  readonly onResetWorkspace: () => void;
  readonly children: (update: IRevenueAppProps['onUpdateModelContext'], send: IRevenueAppProps['onSendFollowUp']) => React.ReactNode;
}
function CachedTask(props: { readonly task: IFullscreenTask; readonly app: IRevenueAppProps; readonly update: IRevenueAppProps['onUpdateModelContext']; readonly send: IRevenueAppProps['onSendFollowUp'] }): React.ReactElement {
  const { task } = props;
  const session = useDealOperationsSession({ ...task.properties, startInIntake: task.definition.key === 'SubmitDealRequest' });
  return <RevenueExperiences {...props.app} definition={task.definition} properties={task.properties} displayMode="fullscreen" workspaceFocus dealSession={session} onRequestFullscreen={undefined} visibleWorkspaceLens={undefined} workspaceState={undefined} onUpdateModelContext={props.update} onSendFollowUp={props.send}/>;
}

export default function FullscreenWorkspace(props: IWorkspaceProps): React.ReactElement {
  const styles = useStyles();
  const store = getDealStore();
  const requestState = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const origin = React.useMemo(() => fullscreenTask(props.definition.key, props.properties, true), [props.definition, props.properties]);
  const [tasks, setTasks] = React.useState<readonly IFullscreenTask[]>([]);
  const [focus, setFocus] = React.useState({ id: origin.id, navigation: props.navigationVersion });
  const [snapshots, setSnapshots] = React.useState<Readonly<Record<string, IModelContextSnapshot>>>({});
  const [period, setPeriod] = React.useState(props.properties.period || 'current');
  const [region, setRegion] = React.useState(props.properties.region || 'all');
  const [country, setCountry] = React.useState<Readonly<Record<string, unknown>>>({});
  const [homePage, setHomePage] = React.useState({ value: 0, navigation: props.navigationVersion });
  const [resetRequested, setResetRequested] = React.useState(false);
  const [contextError, setContextError] = React.useState('');
  const allTasks = [origin, ...tasks];
  const focused = focus.navigation === props.navigationVersion ? allTasks.find(task => task.id === focus.id && task.lens === props.activeLens) : undefined;
  const active = React.useRef({ fullScreen: props.fullScreen, task: focused, lens: props.activeLens, period, region });
  active.current = { fullScreen: props.fullScreen, task: focused, lens: props.activeLens, period, region };
  const brief = React.useMemo(() => personalRevenueBrief(period, region, requestState.requests), [period, region, requestState.requests]);
  const opportunities = React.useMemo(() => OPPORTUNITIES.filter(item => (period === 'all' || period === 'current' && item.quarterOffset === 0 || period === 'next' && item.quarterOffset === 1) && (region === 'all' || ACCOUNTS.find(account => account.id === item.accountId)?.region === region)), [period, region]);
  const pending = requestState.requests.filter(request => request.status === 'pending' || request.status === 'returned');
  const homeOpportunities = props.activeLens === 'my-deals' ? brief.opportunities : opportunities;
  const homeRecordCount = props.activeLens === 'commercial-desk' ? requestState.requests.length : homeOpportunities.length;
  const homePageCount = Math.max(1, Math.ceil(homeRecordCount / 6));
  const currentHomePage = homePage.navigation === props.navigationVersion ? Math.min(homePage.value, homePageCount - 1) : 0;
  const visibleOpportunities = homeOpportunities.slice(currentHomePage * 6, currentHomePage * 6 + 6);
  const visibleRequests = requestState.requests.slice(currentHomePage * 6, currentHomePage * 6 + 6);
  const story = FULLSCREEN_STORIES[props.activeLens];
  const focusedSnapshot = focused ? snapshots[focused.id] : undefined;
  const relatedTasks = focused ? fullscreenRelatedTasks(focused, focusedSnapshot) : [];
  const focusedContext = focused ? fullscreenTaskContext(focused, requestState.requests, focusedSnapshot) : undefined;
  const next = focused ? fullscreenNextAction(focused, focusedSnapshot) : undefined;
  const wideVisual = focused && ['DiscoverAccountOpportunity', 'ExplorePipelineQuality', 'ExplorePipelineFlow', 'ExploreApprovalFlow'].indexOf(focused.definition.key) >= 0;
  const openTask = React.useCallback((key: RevenueIntentKey, properties: IRevenueProperties): void => {
    const item = fullscreenTask(key, properties);
    setTasks(current => item.id === origin.id || current.some(task => task.id === item.id) ? current : [...current, item]);
    setFocus({ id: item.id, navigation: props.navigationVersion });
    props.onNavigateTask(item.lens);
  }, [origin.id, props.navigationVersion, props.onNavigateTask]);
  const publish = props.onUpdateModelContext;
  const send = props.onSendFollowUp;
  const workspaceSnapshot = React.useCallback((snapshot: IModelContextSnapshot, task: IFullscreenTask): IModelContextSnapshot => ({
    ...snapshot, displayMode: 'fullscreen', referenceWorkspace: null,
    workspaceState: { lens: task.lens, view: 'focused-work', task: task.definition.key, taskProperties: task.properties, scope: snapshot.resolvedScope, stage: snapshot.workflowStage, semantics: 'Explicit selected work; proposals, request submission and independent approvals remain distinct.' }
  }), []);
  const capture = React.useCallback((task: IFullscreenTask, snapshot: IModelContextSnapshot): Promise<void> => {
    if (!active.current.fullScreen) return task.origin ? publish(snapshot) : Promise.resolve();
    setSnapshots(current => JSON.stringify(current[task.id]) === JSON.stringify(snapshot) ? current : { ...current, [task.id]: snapshot });
    return active.current.task?.id === task.id ? publish(workspaceSnapshot(snapshot, task)) : Promise.resolve();
  }, [publish, workspaceSnapshot]);
  const originUpdate = React.useCallback((snapshot: IModelContextSnapshot) => capture(origin, snapshot), [capture, origin]);
  const originSend = React.useCallback((message: string, snapshot: IModelContextSnapshot) => send(message, active.current.fullScreen ? workspaceSnapshot(snapshot, origin) : snapshot), [send, workspaceSnapshot, origin]);
  const onCountryState = React.useCallback((state: Readonly<Record<string, unknown>>) => {
    setCountry(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const homeIntent: Readonly<Record<FullscreenWorkspaceLens, RevenueIntentKey>> = { 'my-deals': 'GetMyRevenuePriorities', 'deal-room': 'ExploreDealAttention', 'commercial-desk': 'ReviewDealApproval', 'revenue-command': 'ExplorePipelineQuality' };
  const homeContext: IModelContextSnapshot = {
    intent: homeIntent[props.activeLens], displayMode: 'fullscreen', route: `${props.activeLens}/workspace`, selectedEntityId: '',
    workflowStage: 'workspace-home', summary: `${LENS_LABELS[props.activeLens]} / ${period} / ${region} / select one item to work`,
    period, region, resolvedScope: { period, region }, confirmed: false,
    availableActions: ['Select a record', 'Change workspace', 'Change scope'],
    visibleRecords: props.activeLens === 'commercial-desk' ? visibleRequests.map(request => ({ id: request.id, title: request.draft.title, status: request.status, requiredReviewer: nextApproval(request) })) : props.activeLens === 'revenue-command' ? country.visibleOpportunities || [] : visibleOpportunities,
    workspaceState: { lens: props.activeLens, view: 'workspace-home', period, region, page: props.activeLens === 'revenue-command' ? country.page || 1 : currentHomePage + 1, pageCount: props.activeLens === 'revenue-command' ? country.pageCount || 1 : homePageCount, visibleOpportunityIds: props.activeLens === 'revenue-command' ? country.visibleOpportunityIds : props.activeLens === 'commercial-desk' ? opportunities.slice(0, 2).map(item => item.id) : visibleOpportunities.map(item => item.id), totalOpportunities: opportunities.length, ownedBook: props.activeLens === 'my-deals' ? brief.metrics : undefined, visibleRequestIds: props.activeLens === 'commercial-desk' ? visibleRequests.map(item => item.id) : undefined, pendingRequestIds: pending.map(item => item.id), countryMap: props.activeLens === 'revenue-command' ? country : undefined },
    semantics: 'Deterministic demo records and explicit selection; no unsolicited deal task, CRM changes or real approvals.'
  };
  const homeSerialized = JSON.stringify(homeContext);
  const previousFocus = React.useRef<string>();
  React.useEffect(() => {
    const id = props.fullScreen ? focused?.id : undefined;
    if (previousFocus.current === id) return;
    previousFocus.current = id;
    const cached = id ? snapshots[id] : undefined;
    if (!focused || cached?.displayMode !== 'fullscreen') return;
    let current = true;
    publish(workspaceSnapshot(cached, focused)).then(() => { if (current) setContextError(''); }).catch(() => { if (current) setContextError('The selected work context could not be shared. Change a value to retry.'); });
    return () => { current = false; };
  }, [props.fullScreen, focused, snapshots, publish, workspaceSnapshot]);
  React.useEffect(() => {
    if (!props.fullScreen || focused) return;
    let current = true;
    publish(JSON.parse(homeSerialized)).then(() => { if (current) setContextError(''); }).catch(() => { if (current) setContextError('The visible workspace context could not be shared. Change the scope to retry.'); });
    return () => { current = false; };
  }, [props.fullScreen, focused, homeSerialized, publish]);
  const taskCallbacks = React.useMemo(() => {
    const callbacks: Record<string, { update: IRevenueAppProps['onUpdateModelContext']; send: IRevenueAppProps['onSendFollowUp'] }> = {};
    tasks.forEach(task => {
      callbacks[task.id] = { update: snapshot => capture(task, snapshot), send: (message, snapshot) => send(message, workspaceSnapshot(snapshot, task)) };
    });
    return callbacks;
  }, [tasks, capture, send, workspaceSnapshot]);
  function opportunityRow(item: IOpportunity, key: RevenueIntentKey, label: string, stacked = false): React.ReactElement {
    const account = ACCOUNTS.find(record => record.id === item.accountId);
    return <article key={item.id} className={mergeClasses(styles.row, stacked && styles.stackedRow)} data-workspace-record={item.id}>
      <div><strong className={styles.rowTitle}>{item.name}</strong><span className={styles.small}>{account?.name} / {item.id} / {item.stage}</span><strong>{currency(item.value)}</strong></div>
      <Button icon={<ArrowRight20Regular />} onClick={() => openTask(key, { accountId: item.accountId, opportunityId: item.id })}>{label} {item.name}</Button>
    </article>;
  }
  function workspaceFilters(): React.ReactElement {
    return <div className={styles.filters}>
      <label>Quarter<select aria-label="Workspace quarter" value={period} onChange={event => { setPeriod(event.target.value); setHomePage({ value: 0, navigation: props.navigationVersion }); }}><option value="current">Current quarter</option><option value="next">Next quarter</option><option value="all">All quarters</option></select></label>
      <label>Region<select aria-label="Workspace region" value={region} onChange={event => { setRegion(event.target.value); setHomePage({ value: 0, navigation: props.navigationVersion }); }}>{['all', 'North America', 'EMEA', 'APAC', 'Latin America'].map(value => <option key={value} value={value}>{value === 'all' ? 'All regions' : value}</option>)}</select></label>
    </div>;
  }
  function homePagination(): React.ReactElement {
    return <div className={styles.actions}><Button disabled={currentHomePage === 0} onClick={() => setHomePage({ value: currentHomePage - 1, navigation: props.navigationVersion })}>Previous items</Button><span>Page {currentHomePage + 1} / {homePageCount} / {homeRecordCount} records</span><Button disabled={currentHomePage + 1 >= homePageCount} onClick={() => setHomePage({ value: currentHomePage + 1, navigation: props.navigationVersion })}>Next items</Button></div>;
  }
  function home(): React.ReactElement {
    if (props.activeLens === 'my-deals') return <>
      <div className={styles.cards}>{[['Owned open book', currency(brief.metrics.open)], ['Seller-weighted outlook', currency(brief.metrics.weighted)], ['Requests awaiting a decision', String(brief.metrics.pendingRequests)]].map(([label, value]) => <section key={label} className={styles.card}><span className={styles.eyebrow}>{label}</span><strong className={styles.metric}>{value}</strong><span className={styles.small}>{label === 'Requests awaiting a decision' ? 'Confirmed owned requests / all submission periods' : `Megan Bowen's illustrative book / ${period}`}</span></section>)}</div>
      <div className={styles.grid}><section className={styles.card}><h2 className={styles.heading}>Your book, your next move</h2><D3ForecastBridge movements={brief.outlook} title="Owned-book seller outlook" description="Open catalog value to arithmetic seller-weighted value. Not forecast commit."/><p className={styles.note}>Seller probability is judgment, not buyer proof. Choose a deal to work on its next decision.</p></section>
        <section className={styles.card}><span className={styles.eyebrow}>Next action</span><h2 className={styles.heading}>{brief.priorities[0]?.title || 'No priorities in this scope'}</h2><p className={styles.subtitle}>{brief.priorities[0]?.detail || 'Change the quarter or region to inspect the demo book.'}</p>{brief.priorities[0] && <Button appearance="primary" onClick={() => { const priority = brief.priorities[0]; openTask(priority.target, priority.requestId ? { requestId: priority.requestId } : { opportunityId: priority.opportunityId, accountId: priority.accountId }); }}>Work top priority</Button>}</section></div>
      <section className={styles.card}><div className={styles.toolbar}><h2 className={styles.heading}>Choose an opportunity</h2><Button onClick={() => openTask('DiscoverAccountOpportunity', { period, region })}>Explore country opportunity</Button></div><div className={styles.list}>{visibleOpportunities.map(item => opportunityRow(item, 'BuildAccountBrief', 'Open'))}</div>{homePagination()}</section>
    </>;
    if (props.activeLens === 'deal-room') return <section className={styles.card}><div className={styles.toolbar}><div><h2 className={styles.heading}>Choose the deal, then earn the next decision</h2><p className={styles.subtitle}>Compare recorded proof. An unknown buyer signal is not a positive finding.</p></div><Badge>{opportunities.length} scoped deals</Badge></div>
      <div className={styles.list}>{visibleOpportunities.map(item => {
        const evidence = scopedEvidence(resolveScope({ opportunityId: item.id }));
        const verified = evidence.filter(record => record.kind === 'verified').length;
        return <article key={item.id} className={styles.row}><div><strong className={styles.rowTitle}>{item.name}</strong><span className={styles.small}>{item.id} / {currency(item.value)} / {item.stage}</span><div className={styles.proof} aria-label={`${verified} verified of ${evidence.length} recorded sources`}>{evidence.length ? evidence.map(record => <span key={record.id} title={`${record.title}: ${record.kind}`} className={styles.proofCell} style={{ backgroundColor: record.kind === 'verified' ? tokens.colorPaletteGreenBackground2 : tokens.colorPaletteMarigoldBackground2, color: tokens.colorNeutralForeground1 }}>{record.kind === 'verified' ? <CheckmarkCircle20Regular /> : '?'}</span>) : <span className={styles.small}>No recorded buyer proof</span>}</div></div><Button icon={<ArrowRight20Regular />} onClick={() => openTask('MapBuyingCommittee', { opportunityId: item.id })}>Open deal room for {item.name}</Button></article>;
      })}</div>{homePagination()}<p className={styles.note}>Each room starts with its selected deal. Relationships, risks, commitments and success planning retain that exact scope.</p></section>;
    if (props.activeLens === 'commercial-desk') return <>
      <div className={styles.cards}>{[['Requests needing review or revision', String(pending.length)], ['Open request value', currency(pending.reduce((sum, item) => sum + dealEconomics(item.draft).contractValue, 0))], ['Approved demo requests', String(requestState.requests.filter(item => item.status === 'approved').length)]].map(([label, value]) => <section key={label} className={styles.card}><span className={styles.eyebrow}>{label}</span><strong className={styles.metric}>{value}</strong><span className={styles.small}>Stored demo requests / all submission periods</span></section>)}</div>
      <div className={styles.grid}><section className={styles.card}><h2 className={styles.heading}>Independent review workload</h2><ApprovalWorkloadVisual requests={requestState.requests}/><p className={styles.note}>Required reviewer routes are not approvals. Select a request to inspect its exact evidence and decision trail.</p><div className={styles.actions}><Button onClick={() => openTask('ExploreApprovalFlow', { period, region })}>Explore approval progress</Button></div></section>
        <section className={styles.card}><h2 className={styles.heading}>Shape value before asking for authority</h2><p className={styles.subtitle}>Choose an opportunity and model a proposed offer. Only reviewed, explicitly confirmed values become a demo request.</p><div className={styles.list}>{opportunities.slice(0, 2).map(item => opportunityRow(item, 'SimulateCommercialOffer', 'Model offer for', true))}</div></section></div>
      <section className={styles.card}><h2 className={styles.heading}>Choose an exact request</h2><div className={styles.list}>{visibleRequests.map(request => <article className={styles.row} key={request.id}><div><strong className={styles.rowTitle}>{request.draft.title}</strong><span className={styles.small}>{request.id} / {request.status} / {nextApproval(request) || 'Route complete'}</span><strong>{currency(dealEconomics(request.draft).contractValue)}</strong></div><Button icon={<ArrowRight20Regular />} onClick={() => openTask('ReviewDealApproval', { requestId: request.id })}>Review {request.id}</Button></article>)}</div>{homePagination()}</section>
    </>;
    return <>
      <div className={styles.cards}>{[['Catalog opportunities', String(opportunities.length)], ['Approved demo requests', String(requestState.requests.filter(item => item.status === 'approved').length)], ['Requests needing review', String(pending.length)]].map(([label, value]) => <section className={styles.card} key={label}><span className={styles.eyebrow}>{label}</span><strong className={styles.metric}>{value}</strong><span className={styles.small}>{label === 'Catalog opportunities' ? `${period} quarter / ${region} / CRM-shaped demo catalog` : 'Confirmed demo-request overlay / all submission periods'}</span></section>)}</div>
      <div className={styles.toolbar}><div><h2 className={styles.heading}>Country value, recorded spend, accountable action</h2><p className={styles.subtitle}>Headquarters-attributed opportunities and a separate expense ledger. Choose a country or inspect an actual opportunity.</p></div><div className={styles.actions}><Button onClick={() => openTask('ExplorePipelineFlow', { period, region })}>Explore pipeline value flow</Button><Button onClick={() => openTask('ExplorePipelineQuality', { period, region })}>Review pipeline proof</Button></div></div>
      <section className={styles.card}><CountryRevenueExperience opportunities={opportunities} period={period} region={region} initialCountryId={typeof country.selectedCountryId === 'string' ? country.selectedCountryId : undefined} initialMetric={country.metric === 'opportunity' || country.metric === 'spend' ? country.metric : undefined} compact={false} onStateChange={onCountryState} onScopeChange={(nextPeriod, nextRegion) => { setPeriod(nextPeriod); setRegion(nextRegion); }} onInspectOpportunity={id => openTask('InspectForecastCommit', { opportunityId: id })}/></section>
    </>;
  }
  const contextPanel = focused && focusedContext ? <aside className={mergeClasses(styles.context, wideVisual && styles.visualContext)} aria-label="Selected work context">
    <section className={styles.card}><span className={styles.eyebrow}>Selected work</span><h2 className={styles.heading}>{focused.definition.title}</h2><span className={styles.scope}>{focusedContext.entity}</span><p className={styles.subtitle}>{focusedContext.detail}</p><p className={styles.note}>{focused.definition.outcome}</p>{relatedTasks.length > 0 && <div className={styles.filters}><label>Work on this deal<select aria-label="Work on this deal" value="" onChange={event => { const task = relatedTasks.find(item => item.definition.key === event.target.value); if (task) openTask(task.definition.key, task.properties); }}><option value="">Choose a business scenario</option>{relatedTasks.map(task => <option key={task.definition.key} value={task.definition.key}>{task.definition.title}</option>)}</select></label></div>}</section>
    <section className={styles.card}><span className={styles.eyebrow}>Decision boundary</span><p className={styles.subtitle}>{focused.definition.excludes}</p><p className={styles.note}>Missing evidence stays unknown. Opening a form, moving to the next task or switching role is never approval.</p></section>
    {next?.handoff && <section className={styles.card}><span className={styles.eyebrow}>Next business step</span><h3>{getIntent(next.handoff.intent).title}</h3><span className={styles.small}>{LENS_LABELS[fullscreenLensFor(getIntent(next.handoff.intent))]}</span>{focused.definition.key === 'ExploreApprovalFlow' && <p className={styles.note}>A separate stored example, not a request attributed to this fictional value flow.</p>}<div className={styles.actions}><Button appearance="primary" disabled={!!next.disabledReason} title={next.disabledReason} icon={<ArrowRight20Regular />} onClick={() => { if (next.handoff && !next.disabledReason) openTask(next.handoff.intent, next.handoff.properties); }}>{focused.definition.key === 'ExploreApprovalFlow' ? `Review separate example ${next.handoff.properties.requestId}` : `Continue to ${getIntent(next.handoff.intent).title}`}</Button></div>{next.disabledReason && <p className={styles.note}>{next.disabledReason}</p>}</section>}
  </aside> : undefined;
  const originContent = props.children(originUpdate, originSend);
  return <div className={props.fullScreen ? styles.surface : styles.compactOrigin} data-layout={props.fullScreen ? `${props.activeLens}-dashboard` : undefined}>
    {props.fullScreen && <>
      <div className={styles.toolbar}><div className={styles.trail}><strong>{LENS_LABELS[props.activeLens]}</strong>{focusedContext && <><span>/</span><span>{focusedContext.entity}</span></>}</div>
        <div className={styles.actions}>{focused ? <Button icon={<ArrowLeft20Regular />} onClick={() => setFocus({ id: '', navigation: props.navigationVersion })}>Back to {LENS_LABELS[props.activeLens]}</Button> : <Button onClick={() => setResetRequested(true)}>Reset demo data</Button>}</div></div>
      {resetRequested && <section className={styles.card} role="alert"><p>This restores the demo requests and clears mounted drafts. No real records are changed.</p><div className={styles.actions}><Button onClick={() => { store.reset(); props.onResetWorkspace(); }}>Confirm reset of demo data</Button><Button onClick={() => setResetRequested(false)}>Cancel reset</Button></div></section>}
      <section className={styles.hero}><div><Badge appearance="filled" color="success">ZAVAMESH / {focusedContext?.entity || 'DEMO WORKSPACE'}</Badge><h2 className={styles.heroTitle}>{focusedContext?.title || story.headline}</h2><p className={styles.heroCopy}>{focused ? focused.definition.question : story.goal}</p></div><img className={styles.heroArt} src={ZAVAMESH.meshTextile} alt="ZavaMesh interwoven performance textile"/></section>
      {!focused && <>{workspaceFilters()}{home()}{allTasks.filter(task => task.lens === props.activeLens && snapshots[task.id]).length > 0 && <section className={styles.card}><h2 className={styles.heading}>Continue your selected work</h2><div className={styles.actions}>{allTasks.filter(task => task.lens === props.activeLens && snapshots[task.id]).map(task => <Button key={task.id} onClick={() => setFocus({ id: task.id, navigation: props.navigationVersion })}>Resume {task.definition.title} / {fullscreenTaskContext(task, requestState.requests, snapshots[task.id]).entity}</Button>)}</div></section>}</>}
    </>}
    <div className={props.fullScreen && focused ? mergeClasses(styles.grid, wideVisual && styles.visualGrid) : styles.body}>
      <div className={mergeClasses(styles.origin, props.fullScreen && focused?.id === origin.id && styles.task, props.fullScreen && focused?.id !== origin.id && styles.hidden)}>{originContent}</div>
      {tasks.map(task => <div key={task.id} className={mergeClasses(styles.task, (!props.fullScreen || focused?.id !== task.id) && styles.hidden)}><CachedTask task={task} app={props} update={taskCallbacks[task.id].update} send={taskCallbacks[task.id].send}/></div>)}
      {props.fullScreen && contextPanel}
    </div>
    {props.fullScreen && <p className={styles.note}><ShieldCheckmark20Regular/> Deterministic demo / explicit selection / no CRM writes or real approvals</p>}
    {props.fullScreen && contextError && <p role="alert" className={styles.error}>{contextError}</p>}
  </div>;
}
