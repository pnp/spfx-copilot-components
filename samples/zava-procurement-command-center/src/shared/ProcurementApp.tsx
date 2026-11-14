import * as React from 'react';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { IIntentDefinition, IProcurementProperties, ProcurementIntentKey, ProcurementLens } from './catalog';
import { getIntent, OPERATIONAL_LENSES } from './catalog';
import { EVENTS, money } from './domain';
import { ProcurementInlineExperience, type IProcurementSnapshot } from './ProcurementInlineExperiences';
import { getReceipts, getSessionNotice, resetProcurementSession, subscribeReceipts } from './operations';
import { ArrowExpand20Regular, ArrowRight20Regular, Cart20Regular, ChartMultiple20Regular, PeopleTeam20Regular, ShieldCheckmark20Regular, TargetArrow20Regular } from '@fluentui/react-icons';
import { OWNERS, ZAVACORE } from './brand';
import { RequestsDashboard, SpendDashboard, SupplierDashboard } from './ProcurementDashboards';

export type IModelContextSnapshot = IProcurementSnapshot;
interface IProps {
  readonly definition: IIntentDefinition;
  readonly properties: IProcurementProperties;
  readonly currentUserName: string;
  readonly displayMode?: string;
  readonly onRequestFullscreen?: () => Promise<void>;
  readonly onUpdateModelContext?: (snapshot: IModelContextSnapshot) => Promise<void>;
  readonly onSendFollowUp?: (message: string) => Promise<boolean>;
}
type OpenTask = (intent: ProcurementIntentKey, properties?: IProcurementProperties) => void;
const labels: Record<ProcurementLens, string> = {
  'my-requests': 'My Requests', sourcing: 'Sourcing Workbench', 'supplier-360': 'Supplier 360',
  'spend-command': 'Spend Command', education: 'Capabilities'
};
const workspaceCopy: Record<ProcurementLens, { title: string; summary: string }> = {
  'my-requests': { title: 'Good outcomes start here.', summary: 'One clear path from a business need to an approved commitment. Built for the people doing the work.' },
  sourcing: { title: 'Source for more than price.', summary: 'Bring demand, supplier evidence and human judgment together. Make every award count.' },
  'supplier-360': { title: 'Resilience is a relationship.', summary: 'Connect supplier performance, obligations and exposure. See the next risk before it becomes a disruption.' },
  'spend-command': { title: 'See the world. Prove the value.', summary: 'Follow global procurement investments from approved ambition to delivered outcomes and verified value.' },
  education: { title: 'Meet your procurement copilot.', summary: 'Explore focused experiences that connect intent, evidence and accountable action.' }
};
const workspaceIcons: Record<ProcurementLens, React.ReactElement> = {
  'my-requests': <Cart20Regular />, sourcing: <TargetArrow20Regular />,
  'supplier-360': <PeopleTeam20Regular />, 'spend-command': <ChartMultiple20Regular />, education: <ShieldCheckmark20Regular />
};
const useStyles = makeStyles({
  root: { minWidth: 0, width: '100%', boxSizing: 'border-box', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground2, fontFamily: tokens.fontFamilyBase, borderRadius: tokens.borderRadiusLarge, overflow: 'hidden', border: `1px solid ${tokens.colorNeutralStroke2}` },
  fullscreen: { display: 'grid', gridTemplateColumns: '208px minmax(0,1fr)', minHeight: '100vh', '@media(max-width:960px)': { gridTemplateColumns: '1fr' } },
  nav: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '24px 16px', color: ZAVACORE.white, backgroundColor: ZAVACORE.ink, backgroundImage: `linear-gradient(168deg, ${ZAVACORE.ink} 45%, ${ZAVACORE.heroInk} 94%, transparent 125%), url("${ZAVACORE.pattern}")`, backgroundSize: 'cover', '@media(max-width:960px)': { padding: '14px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' } },
  navLogo: { width: '156px', height: 'auto', marginBottom: '24px', '@media(max-width:960px)': { marginBottom: 0, width: '128px', marginRight: '16px' } },
  navLabel: { textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '10px', opacity: 0.72, margin: '0 8px 12px', '@media(max-width:960px)': { display: 'none' } },
  navButton: { justifyContent: 'flex-start', minHeight: '44px', color: ZAVACORE.white, border: '1px solid transparent', ':hover': { color: ZAVACORE.white, backgroundColor: ZAVACORE.heroInk }, '@media(max-width:520px)': { flexGrow: 1, fontSize: '12px' } },
  navActive: { color: ZAVACORE.ink, backgroundColor: ZAVACORE.white, ':hover': { color: ZAVACORE.ink, backgroundColor: ZAVACORE.white } },
  navFoot: { marginTop: 'auto', padding: '28px 8px 6px', fontSize: '12px', lineHeight: '1.8', borderTop: `1px solid ${tokens.colorNeutralStroke1}`, '@media(max-width:960px)': { display: 'none' } },
  brandWord: { display: 'block', fontSize: '19px', fontWeight: 700, marginBottom: '10px', color: ZAVACORE.orange },
  hidden: { display: 'none' },
  main: { minWidth: 0, padding: '24px 28px', '@media(max-width:520px)': { padding: '16px 12px' }, '@media(min-width:1800px)': { padding: '32px 44px' } },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' },
  logo: { width: '118px', height: 'auto' },
  user: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' },
  online: { padding: '4px 9px', color: tokens.colorPaletteGreenForeground1, backgroundColor: tokens.colorPaletteGreenBackground1, borderRadius: '20px', fontSize: '11px', fontWeight: 600 },
  pending: { color: tokens.colorPaletteMarigoldForeground1, backgroundColor: tokens.colorPaletteMarigoldBackground1 },
  danger: { color: tokens.colorPaletteRedForeground1, backgroundColor: tokens.colorPaletteRedBackground1 },
  hero: { position: 'relative', padding: '28px 32px', marginBottom: '24px', color: ZAVACORE.white, backgroundColor: ZAVACORE.heroInk, backgroundImage: `linear-gradient(90deg, ${ZAVACORE.ink} 8%, ${ZAVACORE.heroInk} 55%, transparent 100%), url("${ZAVACORE.fieldOperations}")`, backgroundSize: 'cover', backgroundPosition: 'center, right center', borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8, '@media(max-width:600px)': { padding: '24px 20px', backgroundImage: `linear-gradient(125deg, ${ZAVACORE.ink}, ${ZAVACORE.heroInk})` } },
  heroEyebrow: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.6px', color: ZAVACORE.orange, fontWeight: 700 },
  heroTitle: { margin: '12px 0', fontSize: '36px', lineHeight: '1.12', letterSpacing: '-1px', maxWidth: '580px', '@media(max-width:600px)': { fontSize: '28px' } },
  heroText: { maxWidth: '510px', fontSize: '14px', lineHeight: '1.65', margin: '0 0 18px' },
  heroTeam: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px' },
  portraits: { display: 'flex', paddingLeft: '6px' },
  portrait: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ZAVACORE.white}`, marginLeft: '-6px' },
  inlineHero: { padding: '18px 20px', marginBottom: '18px', backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusLarge, borderTop: `3px solid ${tokens.colorBrandStroke1}` },
  title: { margin: '6px 0', fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, letterSpacing: '-0.5px' },
  muted: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  panel: { padding: '20px', marginBottom: '20px', minWidth: 0, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, backgroundColor: tokens.colorNeutralBackground1, boxShadow: tokens.shadow2, '@media(max-width:520px)': { padding: '14px' } },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: '16px' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
  error: { padding: '12px', borderLeft: `3px solid ${tokens.colorPaletteRedBorderActive}` },
  field: { display: 'grid', gap: '6px', marginBottom: '12px' },
  input: { minHeight: '34px', boxSizing: 'border-box', minWidth: 0, width: '100%', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium }
});

function SourcingDashboard({ open, onContext }: { open: OpenTask; onContext: (snapshot: IProcurementSnapshot) => void }): React.ReactElement {
  const s = useStyles();
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const award = receipts.find(receipt => receipt.intent === 'ReviewSupplierAward' && receipt.recordId === EVENTS[0].id);
  React.useEffect(() => {
    onContext({ intent: 'CompareSupplierBids', route: 'sourcing/dashboard', stage: 'inspect', selectedId: EVENTS[0].id,
      summary: `ZPC-RFP-31: 600 rugged devices; EUR 1200000 budget; 4 bids; award ${award?.action || 'not confirmed'}.` });
  }, [award, onContext]);
  return <section className={s.panel} aria-label="Sourcing Workbench dashboard" data-workspace="sourcing" data-dashboard-layout="sourcing-event-readiness">
    <div className={s.top}><div><span className={s.muted}>ACTIVE SOURCING EVENT / {EVENTS[0].id}</span><h2 className={s.title}>Field-ready. Future-resilient.</h2></div><span className={mergeClasses(s.online, !award && s.pending, (award?.result === 'returned' || award?.result === 'declined') && s.danger)}>{award ? award.action : 'Evaluation / human review next'}</span></div>
    <div className={s.grid}>
      <div><strong>{money(1200000)}</strong><p className={s.muted}>Authorized budget / 600 rugged devices</p></div>
      <div><strong>4 supplier bids</strong><p className={s.muted}>Price, delivery, quality, risk and sustainability</p></div>
      <div><strong>65 / 35 proposed split</strong><p className={s.muted}>Concentration rationale required above 60%</p></div>
      <div><div className={s.heroTeam}><img className={s.portrait} src={OWNERS.sourcing.image} alt="David" /><strong>David / Category lead</strong></div><p className={s.muted}>Accountable event owner</p></div>
    </div>
    <p>{award ? `${award.action}. ${award.summary}` : 'Demand aligned. Bids received. Evidence ready. Compare the trade-offs below before authorizing any award.'}</p>
    <div className={s.actions}><Button appearance="primary" onClick={() => open('ReviewSupplierAward', { eventId: EVENTS[0].id, splitPercent: 65 })}>Review split award</Button><Button onClick={() => open('AggregateDemand')}>Inspect demand cohort</Button><Button onClick={() => open('BuildSourcingEvent')}>Draft a sourcing event</Button></div>
  </section>;
}

function Invocation(props: IProps): React.ReactElement {
  const s = useStyles();
  const sessionNotice = React.useSyncExternalStore(subscribeReceipts, getSessionNotice, getSessionNotice);
  const full = props.displayMode === 'fullscreen';
  const [lens, setLens] = React.useState(props.definition.lens);
  const [active, setActive] = React.useState(props.definition.key);
  const [workingProperties, setWorkingProperties] = React.useState(props.properties);
  const [reset, setReset] = React.useState(0);
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState<{ intent: ProcurementIntentKey; properties: IProcurementProperties }>();
  const initialDraft = React.useRef<string>();
  const dirty = React.useRef(false);
  const task = React.useRef<HTMLElement>(null);
  const focusTask = React.useRef(false);
  const live = React.useRef(true);
  const workspaceSnapshot = React.useRef<IProcurementSnapshot>();
  const taskSnapshot = React.useRef<IProcurementSnapshot>();
  const lastContext = React.useRef('');
  React.useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const emitContext = React.useCallback((snapshot: IProcurementSnapshot): void => {
    const context = { ...snapshot, invokedIntent: props.definition.key, workspace: lens, displayMode: full ? 'fullscreen' : 'inline' };
    const signature = JSON.stringify(context);
    if (signature === lastContext.current) return;
    lastContext.current = signature;
    props.onUpdateModelContext?.(context).catch(reason => {
      if (live.current) setError(`Copilot context could not be updated: ${String(reason)}`);
    });
  }, [props.onUpdateModelContext, props.definition.key, lens, full]);
  const publish = React.useCallback((snapshot: IProcurementSnapshot): void => {
    if (initialDraft.current === undefined) initialDraft.current = snapshot.summary;
    dirty.current = snapshot.stage === 'review' || (snapshot.stage === 'draft' && snapshot.summary !== initialDraft.current);
    taskSnapshot.current = snapshot;
    if (!full || lens === getIntent(active).lens) emitContext({ ...snapshot, workspaceSummary: full ? workspaceSnapshot.current?.summary : undefined });
  }, [emitContext, full, lens, active]);
  const publishWorkspace = React.useCallback((snapshot: IProcurementSnapshot): void => {
    workspaceSnapshot.current = snapshot;
    emitContext({ ...snapshot, focusedTask: lens === getIntent(active).lens ? taskSnapshot.current : undefined });
  }, [emitContext, lens, active]);
  const applyOpen: OpenTask = (intent, properties = {}) => {
    initialDraft.current = undefined;
    dirty.current = false;
    focusTask.current = true;
    setActive(intent);
    setWorkingProperties(properties);
    setLens(getIntent(intent).lens);
  };
  const open: OpenTask = (intent, properties = {}) => {
    if (dirty.current) setPending({ intent, properties });
    else applyOpen(intent, properties);
  };
  const definition = getIntent(active);
  const visibleLens = full ? lens : definition.lens;
  const key = JSON.stringify([active, Object.keys(workingProperties).sort().map(name => [name, workingProperties[name as keyof IProcurementProperties]]), reset]);
  React.useEffect(() => {
    if (focusTask.current) { task.current?.focus(); focusTask.current = false; }
  }, [active, key]);
  return <div key={reset} className={mergeClasses(s.root, full && lens !== 'education' ? s.fullscreen : undefined)} data-layout={full ? `${lens}-command` : `${active}-inline`}>
    <nav className={mergeClasses(s.nav, (!full || lens === 'education') && s.hidden)} aria-label="Procurement workspaces" hidden={!full || lens === 'education'}>
      <img className={s.navLogo} src={ZAVACORE.logoWhite} alt="ZavaCore" />
      <p className={s.navLabel}>Procurement command center</p>
      {OPERATIONAL_LENSES.map(item => <Button key={item} icon={workspaceIcons[item]} className={mergeClasses(s.navButton, lens === item && s.navActive)} appearance="transparent" aria-current={lens === item ? 'page' : undefined} onClick={() => setLens(item)}>{labels[item]}</Button>)}
      <Button className={s.navButton} appearance="transparent" icon={<ShieldCheckmark20Regular />} onClick={() => open('ExploreAgentCapabilities')}>Browse scenarios</Button>
      <div className={s.navFoot}><span className={s.brandWord}>Built for impact.</span>Connected evidence.<br />Accountable decisions.<br /><br />22 focused Copilot experiences<br />Offline keynote showcase</div>
    </nav>
    <main className={s.main}>
      <div className={s.top}>{full ? <div><span className={s.muted}>ZavaCore / Procurement</span><h1 className={s.title}>{labels[lens]}</h1></div> : <img className={s.logo} src={ZAVACORE.logo} alt="ZavaCore" />}<div className={s.user}><span className={s.online}>Offline demo</span><span>{props.currentUserName}</span></div>{!full && props.onRequestFullscreen && <Button icon={<ArrowExpand20Regular />} onClick={() => { props.onRequestFullscreen?.().catch(reason => { if (live.current) setError(`Full screen was not available: ${String(reason)}`); }); }}>Expand procurement workspace</Button>}</div>
      {full ? <header className={s.hero}><span className={s.heroEyebrow}>ZavaCore / {labels[visibleLens]}</span><h2 className={s.heroTitle}>{workspaceCopy[visibleLens].title}</h2><p className={s.heroText}>{workspaceCopy[visibleLens].summary}</p><div className={s.heroTeam}><div className={s.portraits}>{[OWNERS.finance, OWNERS.sourcing, OWNERS.risk].map(owner => <img key={owner.name} className={s.portrait} src={owner.image} alt={`${owner.name}, ${owner.role}`} />)}</div><span>Finance + sourcing + supplier risk</span><Button size="small" appearance="primary" icon={<ArrowRight20Regular />} onClick={() => open(lens === 'sourcing' ? 'ReviewSupplierAward' : lens === 'supplier-360' ? 'PlanSupplierRiskMitigation' : lens === 'spend-command' ? 'TrackLeakageRecovery' : 'CreatePurchaseIntent')}>{lens === 'sourcing' ? 'Review an award' : lens === 'supplier-360' ? 'Plan a mitigation' : lens === 'spend-command' ? 'Verify recovery' : 'Start a purchase'}</Button></div></header> : <header className={s.inlineHero}><span className={s.muted}>{definition.role} · {labels[definition.lens]}</span><h1 className={s.title}>{definition.title}</h1><p>{definition.question}</p></header>}
      {error && <p className={s.error} role="alert">{error}</p>}
      {sessionNotice && <p className={s.error} role="status">{sessionNotice}</p>}
      {full && <div>{lens === 'my-requests' ? <RequestsDashboard open={open} onContext={publishWorkspace} initialId={workingProperties.requestId} /> : lens === 'sourcing' ? <SourcingDashboard open={open} onContext={publishWorkspace} /> : lens === 'supplier-360' ? <SupplierDashboard open={open} onContext={publishWorkspace} initialId={workingProperties.supplierId} /> : lens === 'spend-command' ? <SpendDashboard open={open} onContext={publishWorkspace} initialId={workingProperties.region} /> : null}</div>}
      <section ref={task} tabIndex={-1} hidden={full && lens !== definition.lens} className={s.panel} aria-label="Current procurement task">{full && <><h2>Continue: {definition.title}</h2><p className={s.muted}>Focused Copilot task / retains its own prompt filters and draft. Workspace controls above do not change this task.</p></>}<ProcurementInlineExperience key={key} definition={definition} properties={workingProperties} actor={props.currentUserName} onContext={publish} onSendFollowUp={props.onSendFollowUp} /></section>
      <div className={s.actions}><Button onClick={() => { resetProcurementSession(); applyOpen(props.definition.key, props.properties); setReset(value => value + 1); }}>Reset demo session</Button></div><p className={s.muted}>Deterministic offline evidence. Confirmations affect this browser session only.</p>
      <Dialog open={Boolean(pending)} onOpenChange={(_, data) => { if (!data.open) setPending(undefined); }}>
        <DialogSurface><DialogBody><DialogTitle>Discard unconfirmed draft?</DialogTitle><DialogContent>Your current edits have not been confirmed. Keep the draft, or explicitly discard it before opening another task.</DialogContent><DialogActions><Button onClick={() => setPending(undefined)}>Keep current draft</Button><Button appearance="primary" onClick={() => { if (pending) applyOpen(pending.intent, pending.properties); setPending(undefined); }}>Discard draft and open task</Button></DialogActions></DialogBody></DialogSurface>
      </Dialog>
    </main>
  </div>;
}
class ProcurementErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  public state = { failed: false };
  public static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  public componentDidCatch(error: Error): void { console.error('ZavaCore procurement could not render the current experience.', error); }
  public render(): React.ReactNode {
    return this.state.failed ? <section role="alert"><h2>This procurement experience could not be displayed.</h2><p>Your confirmed session actions have not been changed.</p><Button onClick={() => this.setState({ failed: false })}>Retry experience</Button><Button onClick={() => { resetProcurementSession(); this.setState({ failed: false }); }}>Reset demo and retry</Button></section> : this.props.children;
  }
}
export default function ProcurementApp(props: IProps): React.ReactElement {
  const signature = JSON.stringify([props.definition.key, Object.keys(props.properties).sort().map(name => [name, props.properties[name as keyof IProcurementProperties]])]);
  return <ProcurementErrorBoundary key={signature}><Invocation {...props} /></ProcurementErrorBoundary>;
}
