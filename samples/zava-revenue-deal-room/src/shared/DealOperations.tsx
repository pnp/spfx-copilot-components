import * as React from 'react';
import { Badge, Button, Checkbox, Field, Input, ProgressBar, Select, Textarea, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Add20Regular, ArrowRight20Regular, CheckmarkCircle20Regular, ShieldCheckmark20Regular } from '@fluentui/react-icons';
import { ACCOUNTS } from './domain';
import { PERSONA_MEDIA } from './media';
import { currency, resolveScope } from './operations';
import type { IRevenueProperties } from './catalog';
import { ApprovalWorkloadVisual, approvalQueueModel, RequestValueVisual, requestValueModel } from './visualizations/PortfolioDecisionVisuals';
import {
  APPROVAL_ROLES, REVIEWERS, approvalRoute, dealDraftErrors, dealEconomics, decisionErrors,
  getDealStore, newDealDraft, nextApproval, type ApprovalRole, type DealDraft, type DealEvent, type DealStore
} from './dealWorkflow';

const useStyles = makeStyles({
  root: { minWidth: 0, marginTop: tokens.spacingVerticalL },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalM, flexWrap: 'wrap', marginBottom: tokens.spacingVerticalL },
  title: { margin: '4px 0', fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, letterSpacing: '-0.4px' },
  eyebrow: { fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold, letterSpacing: '1.3px', color: tokens.colorBrandForeground1 },
  muted: { margin: '6px 0', color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, alignItems: 'center' },
  split: { display: 'grid', alignItems: 'start', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(240px, .85fr)', gap: tokens.spacingHorizontalXL, '@media(max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  reviewSplit: { gridTemplateColumns: 'minmax(260px, .8fr) minmax(0, 1.2fr)', '@media(max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  panel: { minWidth: 0, padding: tokens.spacingVerticalXL, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, backgroundColor: tokens.colorNeutralBackground1 },
  summary: { backgroundImage: `linear-gradient(145deg, ${tokens.colorBrandBackground2}, ${tokens.colorNeutralBackground1})`, alignSelf: 'start' },
  form: { display: 'grid', gap: tokens.spacingVerticalL, marginTop: tokens.spacingVerticalXL },
  fields: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: tokens.spacingHorizontalL, '@media(max-width: 520px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalM },
  step: { display: 'flex', gap: tokens.spacingHorizontalXS, alignItems: 'center', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  activeStep: { color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  value: { display: 'block', fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', margin: '8px 0 20px' },
  facts: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', '& dt': { color: tokens.colorNeutralForeground2 }, '& dd': { margin: 0, textAlign: 'right', fontWeight: tokens.fontWeightSemibold, overflowWrap: 'anywhere' } },
  route: { display: 'grid', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalL },
  person: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, minWidth: 0 },
  portrait: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: tokens.borderRadiusCircular },
  routeText: { minWidth: 0, '& strong': { display: 'block' }, '& small': { color: tokens.colorNeutralForeground2 } },
  queue: { display: 'grid', gap: tokens.spacingVerticalS, marginTop: tokens.spacingVerticalL },
  queueRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, width: '100%', padding: tokens.spacingVerticalL, textAlign: 'left', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, cursor: 'pointer', '&:hover': { backgroundColor: tokens.colorNeutralBackground1Hover }, '&:focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  selected: { border: `1px solid ${tokens.colorBrandStroke1}`, boxShadow: `inset 4px 0 0 ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  status: { display: 'grid', gap: tokens.spacingVerticalS, justifyItems: 'end', alignContent: 'center' },
  divider: { borderTop: `1px solid ${tokens.colorNeutralStroke2}`, marginTop: tokens.spacingVerticalL, paddingTop: tokens.spacingVerticalL },
  error: { color: tokens.colorPaletteRedForeground1 },
  receipt: { padding: tokens.spacingVerticalL, border: `1px solid ${tokens.colorPaletteGreenBorder1}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorPaletteGreenBackground1, color: tokens.colorNeutralForeground1, marginBottom: tokens.spacingVerticalL },
  receiptNegative: { border: `1px solid ${tokens.colorPaletteRedBorder1}`, backgroundColor: tokens.colorPaletteRedBackground1 },
  audit: { display: 'grid', gap: tokens.spacingVerticalM, padding: 0, listStyleType: 'none' },
  auditRow: { borderLeft: `2px solid ${tokens.colorBrandStroke2}`, paddingLeft: tokens.spacingHorizontalM },
  wide: { overflowWrap: 'anywhere' },
  compactForm: { gap: '8px', marginTop: '8px' },
  compactFields: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', '@media(max-width: 520px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
  compactQueue: { marginTop: '8px', gap: '8px' },
  compactFacts: { fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200 }
});
const statusColor = (status: string): 'success' | 'warning' | 'danger' => status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'danger';

export interface IDealOperationsProps {
  readonly mode: 'seller' | 'reviewer';
  readonly store?: DealStore;
  readonly session: ReturnType<typeof useDealOperationsSession>;
  readonly onStateChange: (state: Readonly<Record<string, unknown>>) => void;
  readonly compact?: boolean;
}
export function useDealOperationsSession(initial?: IRevenueProperties & { readonly startInIntake?: boolean }): {
  view: 'queue' | 'intake'; setView: React.Dispatch<React.SetStateAction<'queue' | 'intake'>>;
  draft: DealDraft; setDraft: React.Dispatch<React.SetStateAction<DealDraft>>;
  step: number; setStep: React.Dispatch<React.SetStateAction<number>>;
  selectedId: string; setSelectedId: React.Dispatch<React.SetStateAction<string>>;
  filter: string; setFilter: React.Dispatch<React.SetStateAction<string>>;
  role: ApprovalRole; setRole: React.Dispatch<React.SetStateAction<ApprovalRole>>;
  decision: DealEvent['decision']; setDecision: React.Dispatch<React.SetStateAction<DealEvent['decision']>>;
  rationale: string; setRationale: React.Dispatch<React.SetStateAction<string>>;
  confirmed: boolean; setConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  receiptId: string; setReceiptId: React.Dispatch<React.SetStateAction<string>>;
  error: string; setError: React.Dispatch<React.SetStateAction<string>>;
  resetRequested: boolean; setResetRequested: React.Dispatch<React.SetStateAction<boolean>>;
  intakePage: number; setIntakePage: React.Dispatch<React.SetStateAction<number>>;
  reviewSeen: readonly number[]; setReviewSeen: React.Dispatch<React.SetStateAction<readonly number[]>>;
  queueFacet: string; setQueueFacet: React.Dispatch<React.SetStateAction<string>>;
  queuePage: number; setQueuePage: React.Dispatch<React.SetStateAction<number>>;
} {
  const [view, setView] = React.useState<'queue' | 'intake'>(initial?.startInIntake ? 'intake' : 'queue');
  const [draft, setDraft] = React.useState(() => {
    const values = newDealDraft();
    const account = ACCOUNTS.find(item => item.id === initial?.accountId);
    const opportunity = initial?.opportunityId ? resolveScope(initial).opportunity : undefined;
    return {
      ...values,
      accountId: initial?.accountId ?? opportunity?.accountId ?? values.accountId,
      title: opportunity?.name || (initial?.accountId !== undefined ? account ? `${account.name} growth proposal` : '' : values.title),
      outcome: initial?.accountId !== undefined || initial?.opportunityId !== undefined ? '' : values.outcome,
      quantity: String(initial?.quantity ?? values.quantity), termMonths: String(initial?.termMonths ?? values.termMonths),
      discount: String(initial?.discount ?? values.discount), services: String(initial?.services ?? values.services),
      probability: String(initial?.probability ?? values.probability)
    };
  });
  const [step, setStep] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState(initial?.requestId ?? 'ZM-1001');
  const [filter, setFilter] = React.useState('pending');
  const [role, setRole] = React.useState<ApprovalRole>(() => {
    const request = getDealStore().getSnapshot().requests.find(item => item.id === (initial?.requestId ?? 'ZM-1001'));
    return request ? nextApproval(request) || 'Sales manager' : 'Commercial director';
  });
  const [decision, setDecision] = React.useState<DealEvent['decision']>('approved');
  const [rationale, setRationale] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [receiptId, setReceiptId] = React.useState('');
  const [error, setError] = React.useState('');
  const [resetRequested, setResetRequested] = React.useState(false);
  const [intakePage, setIntakePage] = React.useState(0);
  const [reviewSeen, setReviewSeen] = React.useState<readonly number[]>([0]);
  const [queueFacet, setQueueFacet] = React.useState(initial?.requestId ? 'Terms' : 'Inbox');
  const [queuePage, setQueuePage] = React.useState(0);
  return { view, setView, draft, setDraft, step, setStep, selectedId, setSelectedId, filter, setFilter, role, setRole, decision, setDecision, rationale, setRationale, confirmed, setConfirmed, receiptId, setReceiptId, error, setError, resetRequested, setResetRequested, intakePage, setIntakePage, reviewSeen, setReviewSeen, queueFacet, setQueueFacet, queuePage, setQueuePage };
}
export default function DealOperations(props: IDealOperationsProps): React.ReactElement {
  const styles = useStyles();
  const store = React.useMemo(() => props.store || getDealStore(), [props.store]);
  const snapshot = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const { view, setView, draft, setDraft, step, setStep, selectedId, setSelectedId, filter, setFilter, role, setRole, decision, setDecision, rationale, setRationale, confirmed, setConfirmed, receiptId, setReceiptId, error, setError, resetRequested, setResetRequested } = props.session;
  const errors = dealDraftErrors(draft);
  const selected = snapshot.requests.find(request => request.id === selectedId);
  const visible = snapshot.requests.filter(request => filter === 'all' || request.status === filter);
  const economics = !errors.length ? dealEconomics(draft) : undefined;
  const account = ACCOUNTS.find(item => item.id === draft.accountId);
  const reviewErrors = selected ? decisionErrors(selected, role, decision, rationale) : ['Select a request to review.'];
  const { intakePage: requestedIntakePage, setIntakePage, reviewSeen, setReviewSeen, queueFacet, setQueueFacet, queuePage, setQueuePage } = props.session;
  const intakePage = Math.max(0, Math.min(requestedIntakePage, view === 'intake' && step === 1 ? 1 : view === 'queue' && queueFacet === 'Decision trail' ? Math.max(0, (selected?.events.length || 0) - 1) : 2));
  const summaryFields = (values: DealDraft): readonly { label: string; value: string }[] => {
    const result = dealEconomics(values);
    return [
      { label: 'Account', value: ACCOUNTS.find(item => item.id === values.accountId)?.name || values.accountId },
      { label: 'Licensed users / term', value: `${values.quantity} / ${values.termMonths} months` },
      { label: 'Discount / services', value: `${values.discount}% / ${currency(Number(values.services))}` },
      { label: 'Seller probability', value: `${(Number(values.probability) * 100).toFixed(0)}% / not commit` },
      { label: 'Contract value / ARR', value: `${currency(result.contractValue)} / ${currency(result.arr)}` },
      { label: 'Margin / weighted value', value: `${result.grossMargin.toFixed(1)}% / ${currency(result.weightedForecast)}` },
      { label: 'GTM investment', value: currency(Number(values.investment)) },
      { label: 'Security / sponsor attestation', value: `${values.securityReady ? 'Ready' : 'Missing'} / ${values.sponsorReady ? 'Ready' : 'Missing'}` },
      { label: 'Submitter / required authority', value: `${values.owner} / ${approvalRoute(values).join(' → ')}` }
    ];
  };
  const intakeKeys = ['quantity', 'termMonths', 'discount', 'services', 'probability', 'investment'] as const;
  const queuePages = Math.max(1, Math.ceil(visible.length / 2));
  const currentQueuePage = Math.min(queuePage, queuePages - 1);
  const compactFields = view === 'intake' ? step === 0 ? ['accountId', 'title', 'outcome', 'owner'] : step === 1 ? [...intakeKeys.slice(intakePage * 3, intakePage * 3 + 3), 'contractValue', 'grossMargin'] : step === 2 ? ['securityReady', 'sponsorReady', 'approvalRoute'] : ['title', ...summaryFields(draft).slice(intakePage * 3, intakePage * 3 + 3).map(item => item.label), 'confirmed'] :
    queueFacet === 'Inbox' ? ['filter', 'independentReviewWorkload', 'pendingValue', 'nextRequest'] : queueFacet === 'Requests' ? ['id', 'title', 'status', 'nextApprover', 'contractValue'] : queueFacet === 'Terms' ? ['title', 'outcome', ...summaryFields(selected?.draft || draft).slice(intakePage * 3, intakePage * 3 + 3).map(item => item.label)] : queueFacet === 'Evidence' ? ['securityReady', 'sponsorReady', 'approvalRoute'] : queueFacet === 'Decision' ? ['reviewerRole', 'decision', 'rationale', 'confirmed'] : ['actor', 'role', 'decision', 'rationale', 'timestamp'];
  const state = JSON.stringify({
    view: `deal-${view}`, stage: view === 'intake' ? step === 3 ? 'review' : 'draft' : receiptId ? 'receipt' : 'queue',
    step: view === 'intake' ? step : undefined,
    formStep: view === 'intake' ? ['Deal story', 'Commercials', 'Evidence attestations', 'Exact-value review and confirmation'][step] : undefined,
    facet: props.compact ? view === 'intake' ? step === 1 ? intakePage ? 'Delivery and investment' : 'License terms' : step === 3 ? 'Exact-value review' : step === 0 ? 'Deal story' : 'Evidence attestations' : queueFacet : 'Full workspace',
    page: props.compact ? view === 'intake' ? step === 1 || step === 3 ? intakePage + 1 : 1 : queueFacet === 'Requests' ? currentQueuePage + 1 : queueFacet === 'Terms' || queueFacet === 'Decision trail' ? intakePage + 1 : 1 : undefined,
    pageCount: props.compact ? view === 'intake' ? step === 1 ? 2 : step === 3 ? 3 : 1 : queueFacet === 'Requests' ? queuePages : queueFacet === 'Terms' ? 3 : queueFacet === 'Decision trail' ? Math.max(1, selected?.events.length || 0) : 1 : undefined,
    reviewedValuePages: props.compact && view === 'intake' && step === 3 ? reviewSeen.map(value => value + 1) : undefined,
    visibleFields: props.compact ? compactFields : view === 'intake' ? [
      ['accountId', 'title', 'outcome', 'owner'],
      ['quantity', 'termMonths', 'discount', 'services', 'probability', 'investment'],
      ['securityReady', 'sponsorReady'],
      ['draft', 'economics', 'confirmed']
    ][step] : selected?.status === 'pending' ? ['filter', 'selectedRequest', 'reviewerRole', 'decision', 'rationale', 'confirmed'] : ['filter', 'selectedRequest', 'receiptId', 'decisionTrail'],
    mode: props.mode, filter, selectedId, visibleRequests: (props.compact ? view === 'queue' && queueFacet === 'Requests' ? visible.slice(currentQueuePage * 2, currentQueuePage * 2 + 2) : view === 'queue' && queueFacet === 'Inbox' ? visible.slice(0, 1) : [] : visible).map(item => ({ id: item.id, title: item.draft.title, status: item.status, nextApprover: nextApproval(item) })),
    visibleValues: props.compact && (view === 'intake' && step === 3 || view === 'queue' && queueFacet === 'Terms' && selected) ? summaryFields(view === 'intake' ? draft : selected?.draft || draft).slice(intakePage * 3, intakePage * 3 + 3) : undefined,
    visibleEvents: props.compact && queueFacet === 'Decision trail' ? selected?.events.slice(intakePage, intakePage + 1) : undefined,
    chart: props.compact && view === 'intake' && step === 1 && economics ? requestValueModel(draft) : props.compact && view === 'queue' && queueFacet === 'Inbox' ? approvalQueueModel(visible) : undefined,
    selectedRequest: view === 'queue' ? selected : undefined,
    economics: view === 'intake' ? economics : selected ? dealEconomics(selected.draft) : undefined,
    draft: view === 'intake' ? draft : undefined, reviewerRole: role, decision, rationale, confirmed, receiptId,
    validationErrors: view === 'intake' ? errors : reviewErrors, semantics: 'Simulated demo roles and approvals. No CRM or forecast writes.'
  });
  React.useEffect(() => { props.onStateChange(JSON.parse(state)); }, [state, props.onStateChange]);
  function update<K extends keyof DealDraft>(key: K, value: DealDraft[K]): void {
    setDraft(current => ({ ...current, [key]: value })); setConfirmed(false); setReviewSeen([0]); setError('');
  }
  function selectRequest(id: string): void {
    setSelectedId(id); setConfirmed(false); setRationale(''); setReceiptId(''); setError(''); setQueueFacet('Terms'); setIntakePage(0);
  }
  function submit(): void {
    try {
      const request = store.submit(draft, confirmed);
      setSelectedId(request.id); setReceiptId(request.id); setView('queue'); setFilter('all'); setConfirmed(false); setRationale(''); setQueueFacet('Terms'); setIntakePage(0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The demo request could not be submitted.'); }
  }
  function decide(): void {
    try {
      const request = store.decide(selectedId, role, decision, rationale, confirmed);
      setReceiptId(request.id); setConfirmed(false); setQueueFacet('Decision trail'); setIntakePage(Math.max(0, request.events.length - 1));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The demo decision could not be recorded.'); }
  }
  function person(name: string, detail: string): React.ReactElement {
    const portrait = PERSONA_MEDIA[name];
    return <span className={styles.person}>{portrait && <img className={styles.portrait} src={portrait.src} alt={portrait.alt} />}<span className={styles.routeText}><strong>{name}</strong><small>{detail}</small></span></span>;
  }
  function summary(values: DealDraft): React.ReactElement {
    const result = dealEconomics(values);
    return <dl className={styles.facts}>
      <dt>Account / region</dt><dd>{ACCOUNTS.find(item => item.id === values.accountId)?.name} / {ACCOUNTS.find(item => item.id === values.accountId)?.region}</dd>
      <dt>Licensed users / term</dt><dd>{values.quantity} / {values.termMonths} months</dd>
      <dt>Discount / services</dt><dd>{values.discount}% / {currency(Number(values.services))}</dd>
      <dt>Seller probability</dt><dd>{(Number(values.probability) * 100).toFixed(0)}%</dd>
      <dt>Contract value (calculated)</dt><dd>{currency(result.contractValue)}</dd>
      <dt>ARR (calculated)</dt><dd>{currency(result.arr)}</dd>
      <dt>Gross margin (calculated)</dt><dd>{result.grossMargin.toFixed(1)}%</dd>
      <dt>Weighted value (calculated)</dt><dd>{currency(result.weightedForecast)}</dd>
      <dt>Requested GTM investment</dt><dd>{currency(Number(values.investment))}</dd>
      <dt>Security / sponsor attestation</dt><dd>{values.securityReady ? 'Ready' : 'Missing'} / {values.sponsorReady ? 'Ready' : 'Missing'}</dd>
    </dl>;
  }
  function pages(page: number, count: number, onPage: (value: number) => void, label: string): React.ReactElement {
    return <div className={styles.actions}><Button size="small" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous {label}</Button><span>Page {page + 1} / {count}</span><Button size="small" disabled={page + 1 >= count} onClick={() => onPage(page + 1)}>Next {label}</Button></div>;
  }
  function compactSummary(values: DealDraft): React.ReactElement {
    return <><dl className={mergeClasses(styles.facts, styles.compactFacts)}>{summaryFields(values).slice(intakePage * 3, intakePage * 3 + 3).map(item => <React.Fragment key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></React.Fragment>)}</dl>{pages(intakePage, 3, value => { setIntakePage(value); setReviewSeen(current => current.indexOf(value) >= 0 ? current : [...current, value]); setConfirmed(false); }, 'values')}</>;
  }
  if (props.compact) return <section className={styles.root} aria-label="Deal submission and approval center" data-layout={`deal-operations-${props.mode}-${view}`}>
    <h2 className={styles.title}>{view === 'intake' ? 'Shape your next growth deal' : props.mode === 'reviewer' ? 'Commercial approval center' : 'Confirmed demo request'}</h2>
    {snapshot.storageWarning && <p role="alert">{snapshot.storageWarning}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {view === 'queue' && selectedId && !selected && <p role="status">No demo request matches {selectedId}. No substitute was selected.</p>}
    {receiptId && selected && <p role="status"><strong>Demo receipt {receiptId}-{selected.events.length ? `A${selected.events.length}` : 'SUBMIT'}</strong> / {selected.status}. {nextApproval(selected) ? `Next: ${nextApproval(selected)} review.` : 'Decision recorded; not delivery authorization.'} No CRM or forecast changed.</p>}
    {view === 'intake' ? <>
      <div className={styles.actions} aria-label="Intake stages">{['01  Deal story', '02  Commercials', '03  Evidence', '04  Exact review'].map((label, index) => <Button key={label} size="small" aria-pressed={step === index} disabled={index === 3 && !!errors.length} onClick={() => { setStep(index); setIntakePage(0); setReviewSeen([0]); setConfirmed(false); }}>{label}</Button>)}</div>
      {step === 0 ? <div className={mergeClasses(styles.form, styles.compactForm)}>
        <Field label="Account" required><Select value={draft.accountId} onChange={event => update('accountId', event.target.value)}>{ACCOUNTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Deal name (5-120 characters)" required><Input value={draft.title} maxLength={120} onChange={(_, data) => update('title', data.value)} /></Field>
        <Field label="Business outcome (20-1,000 characters)" required><Textarea rows={2} value={draft.outcome} maxLength={1000} onChange={(_, data) => update('outcome', data.value)} /></Field>
        <p className={styles.muted}>{draft.owner} / illustrative submitter. No CRM write.</p>
      </div> : step === 1 ? <>
        <div className={styles.actions}><Button size="small" aria-pressed={intakePage === 0} onClick={() => setIntakePage(0)}>License terms</Button><Button size="small" aria-pressed={intakePage === 1} onClick={() => setIntakePage(1)}>Delivery and investment</Button></div>
        <div className={mergeClasses(styles.fields, styles.compactFields)}>{([
          ['quantity', 'Licensed users'], ['termMonths', 'Contract months'], ['discount', 'Discount percent'],
          ['services', 'Services (USD)'], ['probability', 'Seller probability (0-1)'], ['investment', 'GTM investment requested (USD)']
        ] as const).slice(intakePage * 3, intakePage * 3 + 3).map(([key, label]) => <Field label={label} required key={key}><Input type="number" value={draft[key]} onChange={(_, data) => update(key, data.value)} /></Field>)}</div>
        {economics && <><RequestValueVisual draft={draft}/><p>{economics.grossMargin.toFixed(1)}% margin / {currency(economics.weightedForecast)} seller-weighted; authority is not approval.</p></>}
      </> : step === 2 ? <>
        <h3>Evidence before authority</h3><p>Sample attestations, not externally verified proof. Missing evidence blocks approval, not submission.</p>
        <Checkbox checked={draft.securityReady} onChange={(_, data) => update('securityReady', data.checked === true)} label="Security review evidence is ready (sample attestation)" />
        <Checkbox checked={draft.sponsorReady} onChange={(_, data) => update('sponsorReady', data.checked === true)} label="Economic sponsor evidence is ready (sample attestation)" />
        <p className={styles.muted}>Independent route: {approvalRoute(draft).map(stage => `${stage}: ${REVIEWERS[stage]}`).join(' → ')}</p>
      </> : <>
        <h3>Review the exact request</h3><strong>{draft.title}</strong>{compactSummary(draft)}
        <p>Review all three value pages. This is a demo submission, never approval.</p>
        <Checkbox disabled={reviewSeen.length < 3} checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} label="I reviewed this request and confirm a demo-only submission" />
      </>}
      {!!errors.length && <div role="alert" className={styles.error}>{errors.map(message => <p key={message}>{message}</p>)}</div>}
      <div className={styles.actions}>{step > 0 && <Button size="small" onClick={() => { setStep(step - 1); setIntakePage(0); setConfirmed(false); }}>Previous step</Button>}{step < 2 ? <Button onClick={() => { setStep(step + 1); setIntakePage(0); }}>Continue</Button> : step === 2 ? <Button disabled={!!errors.length} onClick={() => { setStep(3); setIntakePage(0); setReviewSeen([0]); setConfirmed(false); }}>Review deal request</Button> : <Button appearance="primary" disabled={!confirmed || !!errors.length || reviewSeen.length < 3} onClick={submit}>Submit demo deal</Button>}<Button size="small" onClick={() => { setView('queue'); setQueueFacet('Inbox'); }}>Back to requests</Button></div>
    </> : <>
      <div className={styles.actions} aria-label="Approval facets">{['Inbox', 'Requests', 'Terms', 'Evidence', 'Decision', 'Decision trail'].map(label => <Button key={label} size="small" disabled={label !== 'Inbox' && label !== 'Requests' && !selected} aria-pressed={queueFacet === label} onClick={() => { setQueueFacet(label); setIntakePage(0); }}>{label}</Button>)}</div>
      {queueFacet === 'Inbox' ? <>
        <Field label="Request status"><Select value={filter} onChange={event => { setFilter(event.target.value); setQueuePage(0); }}>{['pending', 'approved', 'returned', 'rejected', 'all'].map(value => <option key={value}>{value}</option>)}</Select></Field>
        <ApprovalWorkloadVisual requests={visible}/>
        <p>Current reviewer counts are stored demo requests; remaining stages are requirements, not granted authority.</p>
        {visible[0] && <Button appearance="primary" onClick={() => selectRequest(visible[0].id)}>Review next request {visible[0].id}</Button>}
        <Button size="small" onClick={() => setQueueFacet('Requests')}>Show request list</Button>
        {!visible.length && <p role="status">No {filter} requests. No substitute was selected.</p>}
        <Button size="small" onClick={() => { setView('intake'); setDraft(newDealDraft()); setStep(0); setIntakePage(0); setReviewSeen([0]); setConfirmed(false); setReceiptId(''); }}>Submit a deal</Button>
        <Button size="small" onClick={() => setResetRequested(!resetRequested)}>Reset demo data</Button>{resetRequested && <><p>Restore two sample requests and remove demo decisions?</p><Button onClick={() => { store.reset(); selectRequest('ZM-1001'); setFilter('pending'); setResetRequested(false); }}>Confirm reset of demo data</Button></>}
      </> : queueFacet === 'Requests' ? <>
        <Field label="Request status"><Select value={filter} onChange={event => { setFilter(event.target.value); setQueuePage(0); }}>{['pending', 'approved', 'returned', 'rejected', 'all'].map(value => <option key={value}>{value}</option>)}</Select></Field>
        <div className={mergeClasses(styles.queue, styles.compactQueue)}>{visible.slice(currentQueuePage * 2, currentQueuePage * 2 + 2).map(request => <button key={request.id} type="button" className={styles.queueRow} onClick={() => selectRequest(request.id)}><span><strong>{request.draft.title}</strong><p>{request.id} / {nextApproval(request) || 'Decision recorded'}</p></span><span>{currency(dealEconomics(request.draft).contractValue)}<Badge color={statusColor(request.status)}>{request.status}</Badge></span></button>)}</div>
        {pages(currentQueuePage, queuePages, setQueuePage, 'requests')}
        {!visible.length && <p role="status">No {filter} requests. No substitute was selected.</p>}
      </> : selected ? <>
        <h3>{selected.id} / {selected.draft.title}</h3>
        {queueFacet === 'Terms' ? <><p>{selected.draft.outcome}</p>{compactSummary(selected.draft)}</> : queueFacet === 'Evidence' ? <>
          <p>Security attestation: {selected.draft.securityReady ? 'Ready' : 'Missing'} / sponsor attestation: {selected.draft.sponsorReady ? 'Ready' : 'Missing'}. These are sample attestations.</p>
          <div className={styles.route}>{approvalRoute(selected.draft).map(stage => <div key={stage}>{person(REVIEWERS[stage], `${stage} / ${selected.events.some(event => event.role === stage && event.decision === 'approved') ? 'approved' : nextApproval(selected) === stage ? 'awaiting review' : 'not reached'}`)}</div>)}</div><p>Independent reviewer required; no self-approval or delegated authority.</p>
        </> : queueFacet === 'Decision' ? selected.status === 'pending' ? <div className={mergeClasses(styles.form, styles.compactForm)}>
          <div className={mergeClasses(styles.fields, styles.compactFields)}><Field label="Simulated reviewer role"><Select value={role} onChange={event => { const value = APPROVAL_ROLES.find(item => item === event.target.value); if (value) setRole(value); setConfirmed(false); setReceiptId(''); }}>{APPROVAL_ROLES.map(value => <option key={value}>{value}</option>)}</Select></Field><Field label="Proposed decision"><Select value={decision} onChange={event => { const value = event.target.value; if (value === 'approved' || value === 'returned' || value === 'rejected') setDecision(value); setConfirmed(false); setReceiptId(''); }}><option value="approved">Approve this stage</option><option value="returned">Return for changes</option><option value="rejected">Reject request</option></Select></Field></div>
          <Field label="Decision rationale (15-1,000 characters)" required><Textarea rows={2} value={rationale} maxLength={1000} onChange={(_, data) => { setRationale(data.value); setConfirmed(false); }} /></Field>
          {!!reviewErrors.length && <div role="alert" className={styles.error}>{reviewErrors.map(message => <p key={message}>{message}</p>)}</div>}
          <Checkbox label="I reviewed the evidence and confirm this simulated decision" checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} />
          <Button appearance="primary" disabled={!!reviewErrors.length || !confirmed} onClick={decide}>{decision === 'approved' ? 'Approve demo stage' : decision === 'returned' ? 'Return demo request' : 'Reject demo request'}</Button><p className={styles.muted}>Demo role switching is not authentication.</p>
        </div> : <p role="status">Request is {selected.status}. No pending decision is available.</p> : <>
          {selected.events.slice(intakePage, intakePage + 1).map(event => <article key={event.id}>{person(event.actor, `${event.role} / ${event.decision}`)}<p>{event.rationale}</p><p>{event.id} / {event.timestamp}</p></article>)}
          {!selected.events.length && <p>No decisions recorded. Next: {nextApproval(selected)} independent review.</p>}
          {pages(intakePage, Math.max(1, selected.events.length), setIntakePage, 'decisions')}
        </>}
        {selected.status === 'returned' && <Button onClick={() => { setDraft({ ...selected.draft }); setView('intake'); setStep(0); setIntakePage(0); setReviewSeen([0]); setConfirmed(false); setReceiptId(''); }}>Create revised request</Button>}
      </> : <p role="status">Select a request. No default evidence was substituted.</p>}
    </>}
  </section>;
  return <section className={styles.root} aria-label="Deal submission and approval center" data-layout={`deal-operations-${props.mode}-${view}`}>
    <div className={styles.toolbar}>
      <div><span className={styles.eyebrow}>HUMAN DECISIONS. CONNECTED EXECUTION.</span><h2 className={styles.title}>{view === 'intake' ? 'Shape your next growth deal' : props.mode === 'seller' ? 'From opportunity to approved deal' : 'Commercial approval center'}</h2><p className={styles.muted}>Submit with confidence. Review the evidence. Keep every decision traceable.</p></div>
      <div className={styles.actions}>
        <Badge appearance="tint">Demo workspace</Badge>
        {view === 'queue' ? <Button appearance="primary" icon={<Add20Regular />} onClick={() => { setView('intake'); setDraft(newDealDraft()); setStep(0); setConfirmed(false); setError(''); setReceiptId(''); }}>Submit a deal</Button> : <Button onClick={() => { setView('queue'); setConfirmed(false); }}>Back to requests</Button>}
      </div>
    </div>
    {snapshot.storageWarning && <p role="alert">{snapshot.storageWarning}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {view === 'queue' && selectedId && !selected && <p role="status">No demo request matches {selectedId}. Select a request from the inbox; no substitute was selected.</p>}
    {receiptId && selected && <div role="status" className={mergeClasses(styles.receipt, (selected.status === 'returned' || selected.status === 'rejected') && styles.receiptNegative)}>
      <CheckmarkCircle20Regular /> <strong>Demo receipt {selected.events.length ? `${receiptId}-A${selected.events.length}` : `${receiptId}-SUBMIT`}</strong>
      <p>{selected.draft.title} · {currency(dealEconomics(selected.draft).contractValue)} · {selected.status}. {nextApproval(selected) ? `Next: ${nextApproval(selected)} review.` : selected.status === 'returned' ? 'Next: revise the request and resubmit with the missing evidence.' : selected.status === 'rejected' ? 'Request closed in the demo. A new request requires a new review.' : 'Demo approval complete. Prepare the handoff; this is not delivery authorization.'}</p>
      <p>{selected.events.length ? `${selected.events[selected.events.length - 1].actor} · ${selected.events[selected.events.length - 1].timestamp}` : `${selected.draft.owner} · ${selected.submittedAt}`} · Session only. No quote, CRM record or forecast was changed.</p>
    </div>}
    {view === 'intake' ? <div className={styles.split}>
      <div className={styles.panel}>
        <div className={styles.steps}>{['01  Deal story', '02  Commercials', '03  Evidence & review'].map((label, index) => <span className={mergeClasses(styles.step, Math.min(step, 2) === index && styles.activeStep)} key={label} aria-current={Math.min(step, 2) === index ? 'step' : undefined}>{label}</span>)}</div>
        <ProgressBar value={(Math.min(step, 2) + 1) / 3} aria-label="Deal submission progress" />
        <div className={styles.form}>
          {step === 0 && <>
            <Field label="Account" required><Select value={draft.accountId} onChange={event => update('accountId', event.target.value)}>{ACCOUNTS.map(item => <option key={item.id} value={item.id}>{item.name} / {item.region}</option>)}</Select></Field>
            <Field label="Deal name (5-120 characters)" required><Input value={draft.title} maxLength={120} onChange={(_, data) => update('title', data.value)} /></Field>
            <Field label="Business outcome (20-1,000 characters)" required><Textarea resize="vertical" value={draft.outcome} maxLength={1000} onChange={(_, data) => update('outcome', data.value)} /></Field>
            {person(draft.owner, `Demo submitter · ${account?.region || 'Choose an account'}`)}
          </>}
          {step === 1 && <div className={styles.fields}>{([
            ['quantity', 'Licensed users', 1, 100000, 1], ['termMonths', 'Contract months', 1, 120, 1],
            ['discount', 'Discount percent', 0, 100, 0.1], ['services', 'Services (USD)', 0, 100000000, 1000],
            ['probability', 'Seller probability (0-1)', 0, 1, 0.01], ['investment', 'GTM investment requested (USD)', 1, 100000000, 1000]
          ] as const).map(([key, label, minimum, maximum, increment]) => <Field label={label} required key={key}><Input type="number" min={minimum} max={maximum} step={increment} value={draft[key]} onChange={(_, data) => update(key, data.value)} /></Field>)}</div>}
          {step === 2 && <>
            <h3>Evidence before authority</h3><p className={styles.muted}>These are explicit sample attestations, not verified external evidence. Missing evidence permits submission but blocks approval.</p>
            <Checkbox checked={draft.securityReady} onChange={(_, data) => update('securityReady', data.checked === true)} label="Security review evidence is ready (sample attestation)" />
            <Checkbox checked={draft.sponsorReady} onChange={(_, data) => update('sponsorReady', data.checked === true)} label="Economic sponsor evidence is ready (sample attestation)" />
          </>}
          {step === 3 && <><h3>Review the exact request</h3><strong>{draft.title}</strong><p className={styles.wide}>{draft.outcome}</p>{summary(draft)}<Checkbox checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} label="I reviewed this request and confirm a demo-only submission" /></>}
          {!!errors.length && <div role="alert" className={styles.error}>{errors.map(message => <p key={message}>{message}</p>)}</div>}
          <div className={styles.actions}>
            {step > 0 && <Button onClick={() => { setStep(step - 1); setConfirmed(false); }}>{step === 3 ? 'Edit evidence' : 'Previous step'}</Button>}
            {step < 2 && <Button appearance="primary" icon={<ArrowRight20Regular />} onClick={() => setStep(step + 1)}>Continue</Button>}
            {step === 2 && <Button appearance="primary" disabled={!!errors.length} onClick={() => { setStep(3); setConfirmed(false); }}>Review deal request</Button>}
            {step === 3 && <Button appearance="primary" disabled={!confirmed || !!errors.length} onClick={submit}>Submit demo deal</Button>}
          </div>
        </div>
      </div>
      <aside className={mergeClasses(styles.panel, styles.summary)} aria-label="Live commercial summary">
        <span className={styles.eyebrow}>SCENARIO / NOT APPLIED</span><h3>Every term has an impact.</h3>
        {economics ? <><span className={styles.muted}>Calculated contract value</span><strong className={styles.value}>{currency(economics.contractValue)}</strong><Badge color={economics.grossMargin >= 68 ? 'success' : 'danger'}>{economics.grossMargin.toFixed(1)}% gross margin / 68% guardrail</Badge><p className={styles.muted}>{currency(economics.arr)} ARR · {currency(economics.weightedForecast)} seller-weighted value</p></> : <p role="status">Resolve the visible validation errors to calculate economics.</p>}
        <p className={styles.muted}>$1,450 per licensed user/year; subscription delivery cost 22% of list; services delivery cost 62%. No phased ramp in this intake.</p>
        <h3 className={styles.divider}>Your approval path</h3>
        {economics && <div className={styles.route}>{approvalRoute(draft).map((stage, index) => <div key={stage}>{person(REVIEWERS[stage], `${index + 1}. ${stage}`)}</div>)}</div>}
        <p className={styles.muted}><ShieldCheckmark20Regular /> Independent review, explicit consent and a recorded rationale at every stage.</p>
      </aside>
    </div> : <div className={mergeClasses(styles.split, styles.reviewSplit)}>
      <section className={styles.panel} aria-label="Canonical demo request queue">
        <div className={styles.toolbar}><h3>Request inbox <Badge>{visible.length}</Badge></h3><Field label="Request status"><Select value={filter} onChange={event => setFilter(event.target.value)}>{['pending', 'approved', 'returned', 'rejected', 'all'].map(value => <option key={value} value={value}>{value === 'all' ? 'All requests' : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</Select></Field></div>
        <div className={styles.queue}>{visible.map(request => <button type="button" key={request.id} className={mergeClasses(styles.queueRow, selectedId === request.id && styles.selected)} aria-pressed={selectedId === request.id} onClick={() => selectRequest(request.id)}>
          <span><strong>{request.draft.title}</strong><p className={styles.muted}>{request.id} / {ACCOUNTS.find(item => item.id === request.draft.accountId)?.region}</p>{person(request.draft.owner, nextApproval(request) ? `Awaiting ${nextApproval(request)}` : 'Decision recorded')}</span>
          <span className={styles.status}><strong>{currency(dealEconomics(request.draft).contractValue)}</strong><Badge color={statusColor(request.status)}>{request.status}</Badge></span>
        </button>)}</div>
        {!visible.length && <p role="status">No {filter} requests. Change the filter or submit a new demo deal.</p>}
        <div className={styles.divider}><Button appearance="subtle" onClick={() => setResetRequested(!resetRequested)}>Reset demo data</Button>{resetRequested && <div><p>Remove confirmed demo submissions and decisions and restore the two sample requests?</p><Button onClick={() => { store.reset(); selectRequest('ZM-1001'); setFilter('pending'); setResetRequested(false); }}>Confirm reset of demo data</Button></div>}</div>
      </section>
      <section className={styles.panel} aria-label="Selected deal review">
        {selected ? <>
          <div className={styles.toolbar}><span className={styles.eyebrow}>{selected.id} / EVIDENCE & AUTHORITY</span><Badge color={statusColor(selected.status)}>{selected.status}</Badge></div>
          <h3>{selected.draft.title}</h3><p className={styles.muted}>{selected.draft.outcome}</p>{summary(selected.draft)}
          <div className={styles.route}>{approvalRoute(selected.draft).map(stage => <div key={stage}>{person(REVIEWERS[stage], `${stage} / ${selected.events.some(event => event.role === stage && event.decision === 'approved') ? 'approved' : nextApproval(selected) === stage ? 'awaiting review' : 'not reached'}`)}</div>)}</div>
          {selected.status === 'pending' && <div className={styles.form}>
            <div className={styles.fields}>
              <Field label="Simulated reviewer role"><Select value={role} onChange={event => { const value = APPROVAL_ROLES.find(item => item === event.target.value); if (value) setRole(value); setConfirmed(false); setReceiptId(''); }}>{APPROVAL_ROLES.map(value => <option key={value}>{value}</option>)}</Select></Field>
              <Field label="Proposed decision"><Select value={decision} onChange={event => { const value = event.target.value; if (value === 'approved' || value === 'returned' || value === 'rejected') setDecision(value); setConfirmed(false); setReceiptId(''); }}><option value="approved">Approve this stage</option><option value="returned">Return for changes</option><option value="rejected">Reject request</option></Select></Field>
            </div>
            <p className={styles.muted}>Demo role switching is not authentication or delegated authority.</p>
            <Field label="Decision rationale (15-1,000 characters)" required><Textarea value={rationale} maxLength={1000} onChange={(_, data) => { setRationale(data.value); setConfirmed(false); }} /></Field>
            {!!reviewErrors.length && <div role="alert" className={styles.error}>{reviewErrors.map(message => <p key={message}>{message}</p>)}</div>}
            <Checkbox label="I reviewed the evidence and confirm this simulated decision" checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} />
            <Button appearance="primary" disabled={!!reviewErrors.length || !confirmed} onClick={decide}>{decision === 'approved' ? 'Approve demo stage' : decision === 'returned' ? 'Return demo request' : 'Reject demo request'}</Button>
          </div>}
          {selected.status === 'returned' && <Button onClick={() => { setDraft({ ...selected.draft }); setView('intake'); setStep(0); setConfirmed(false); setReceiptId(''); }}>Create revised request</Button>}
          {!!selected.events.length && <div className={styles.divider}><h3>Decision trail</h3><ol className={styles.audit}>{selected.events.map(event => <li key={event.id} className={styles.auditRow}>{person(event.actor, `${event.role} / ${event.decision}`)}<p className={styles.wide}>{event.rationale}</p><small>{event.id} / {event.timestamp}</small></li>)}</ol></div>}
        </> : <p role="status">Select a request. No default evidence has been substituted.</p>}
      </section>
    </div>}
  </section>;
}
