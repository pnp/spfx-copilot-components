import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { getIntent, INTENTS, type IIntentDefinition, type IProcurementProperties, type ProcurementIntentKey } from './catalog';
import { CATEGORIES, DEFAULT_WEIGHTS, EVENTS, INVOCATION_DATE, money, normalizeScore, POLICY_RULES, REGIONS, splitAward } from './domain';
import { AwardAllocation, SupplierLandscape } from './ProcurementCharts';
import {
  buyingOptions, contracts, demandCohort, diversification, getReceipts, initialSelection, invoices,
  leakageOpportunities, purchaseOrders, getPurchaseQueue, recordConfirmation, subscribeReceipts, submitPurchaseIntent,
  supplierRecords, validDate, validNumber, type IProcurementReceipt
} from './operations';

export interface IProcurementSnapshot extends Record<string, unknown> {
  readonly intent: string;
  readonly route: string;
  readonly stage: string;
  readonly selectedId: string;
  readonly summary: string;
}
export interface IProcurementViewProps {
  readonly definition: IIntentDefinition;
  readonly properties: IProcurementProperties;
  readonly preview?: boolean;
  readonly onContext?: (snapshot: IProcurementSnapshot) => void;
  readonly onSendFollowUp?: (message: string) => Promise<boolean>;
  readonly actor?: string;
}
type Row = readonly [string, React.ReactNode];
type Choice = { readonly id: string; readonly label: string };
const ViewContext = React.createContext<IProcurementViewProps | undefined>(undefined);
const useStyles = makeStyles({
  body: { display: 'grid', gap: '14px', minWidth: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: '12px' },
  field: { display: 'grid', gap: '5px', minWidth: 0, fontWeight: tokens.fontWeightSemibold },
  input: { boxSizing: 'border-box', width: '100%', minWidth: 0, padding: '10px 12px', minHeight: '42px', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, font: 'inherit', ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  section: { minWidth: 0, padding: '14px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1 },
  heading: { margin: '0 0 8px', fontSize: tokens.fontSizeBase400 },
  metric: { padding: '12px', borderLeft: `3px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorNeutralBackground3 },
  value: { display: 'block', fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase500, fontVariantNumeric: 'tabular-nums' },
  muted: { color: tokens.colorNeutralForeground3, margin: '4px 0', fontSize: tokens.fontSizeBase200 },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  scroll: { overflowX: 'auto', minWidth: 0, maxWidth: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: tokens.fontSizeBase200 },
  cell: { textAlign: 'left', padding: '8px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, verticalAlign: 'top' },
  alert: { padding: '10px', borderLeft: `3px solid ${tokens.colorPaletteMarigoldBorderActive}`, backgroundColor: tokens.colorNeutralBackground3 },
  receipt: { padding: '24px', borderLeft: `4px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusLarge },
  approved: { borderLeftColor: tokens.colorPaletteGreenBorderActive, backgroundColor: tokens.colorPaletteGreenBackground1 },
  returned: { borderLeftColor: tokens.colorPaletteRedBorderActive, backgroundColor: tokens.colorPaletteRedBackground1 },
  steps: { listStyleType: 'none', padding: 0, margin: '0 0 10px', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px', fontSize: '12px' },
  step: { padding: '10px 8px', borderBottom: `3px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground3 },
  currentStep: { color: tokens.colorBrandForeground1, borderBottomColor: tokens.colorBrandStroke1, fontWeight: 700 },
  reviewList: { margin: '18px 0', display: 'grid', gridTemplateColumns: 'minmax(100px,1fr) minmax(0,2fr)', gap: '12px 20px', '& dd': { margin: 0, overflowWrap: 'anywhere' }, '@media(max-width:480px)': { gridTemplateColumns: '1fr', gap: '6px', '& dd': { marginBottom: '10px' } } },
  list: { margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' },
  progress: { width: '100%', height: '8px', accentColor: tokens.colorBrandBackground }
});

function Section({ title, children }: { title: string; children?: React.ReactNode }): React.ReactElement {
  const s = useStyles();
  return <section className={s.section}><h2 className={s.heading}>{title}</h2>{children}</section>;
}
function Metrics({ rows }: { rows: readonly Row[] }): React.ReactElement {
  const s = useStyles();
  return <div className={s.grid}>{rows.map(([label, value]) => <div className={s.metric} key={label}><span className={s.value}>{value}</span>{label}</div>)}</div>;
}
function Table({ title, columns, rows }: { title: string; columns: readonly string[]; rows: readonly (readonly React.ReactNode[])[] }): React.ReactElement {
  const s = useStyles();
  return <div className={s.scroll}><table className={s.table}><caption>{title}</caption><thead><tr>{columns.map(column => <th className={s.cell} scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={String(row[0])}>{row.map((cell, index) => <td className={s.cell} key={columns[index]}>{cell}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p role="status">No matching records. Change the filters to continue.</p>}</div>;
}
function TextField({ label, value, onChange, type = 'text', multiline = false }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'date'; multiline?: boolean }): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  return <div className={s.field}><label htmlFor={id}>{label}</label>{multiline ? <textarea id={id} className={s.input} rows={3} value={value} onChange={event => onChange(event.target.value)} /> : <input id={id} className={s.input} type={type} value={value} onChange={event => onChange(event.target.value)} />}</div>;
}
function NumberField({ label, value, onChange, min = 0, max = 10000000 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }): React.ReactElement {
  const s = useStyles();
  return <label className={s.field}>{label}<input className={s.input} type="number" min={min} max={max} value={Number.isFinite(value) ? String(value) : ''} onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} /></label>;
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const supported = options.indexOf(value) >= 0;
  return <div className={s.field}><label htmlFor={id}>{label}</label><select id={id} className={s.input} value={value} onChange={event => onChange(event.target.value)}>{!supported && <option value={value}>Choose a supported value ({value})</option>}{options.map(option => <option key={option}>{option}</option>)}</select>{!supported && <span role="alert">This value is not supported by the offline scenario. Choose an available option.</span>}</div>;
}
function RecordPicker({ label, value, options, onChange }: { label: string; value: string; options: readonly Choice[]; onChange: (value: string) => void }): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const owner = React.useContext(ViewContext);
  const found = options.some(option => option.id === value);
  return <div className={s.field}><label htmlFor={id}>{label}</label><select id={id} className={s.input} value={value} onChange={event => onChange(event.target.value)}>{!found && <option value={value}>{value}</option>}{options.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}</select>{!found && <span role="alert">No record matches &quot;{value}&quot;. Choose a sample record; no record was substituted.</span>}{!found && owner && <MissingRecordSnapshot view={owner} value={value} label={label} />}</div>;
}
function MissingRecordSnapshot({ view, value, label }: { view: IProcurementViewProps; value: string; label: string }): React.ReactElement {
  useSnapshot(view, value, `${label}: no record matches ${value}; no record was substituted or evaluated.`, 'no-match');
  return <></>;
}
function useDraft<T extends object>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const baseline = React.useRef(initial);
  const [draft, setDraft] = React.useState(initial);
  return [draft, setDraft, () => setDraft(baseline.current)];
}
function useSnapshot(props: IProcurementViewProps, selectedId: string, summary: string, stage = 'inspect'): void {
  const last = React.useRef('');
  const lastCallback = React.useRef(props.onContext);
  React.useEffect(() => {
    const signature = JSON.stringify([selectedId, summary, stage]);
    if (signature === last.current && lastCallback.current === props.onContext) return;
    last.current = signature;
    lastCallback.current = props.onContext;
    props.onContext?.({ intent: props.definition.key, route: props.definition.route, stage, selectedId, summary: summary.slice(0, 900) });
  }, [props.onContext, props.definition.key, props.definition.route, selectedId, summary, stage]);
}

function Workflow({ view, recordId, action, rows, error, onReset, onConfirm, commitment, children }: {
  view: IProcurementViewProps; recordId: string; action: string; rows: readonly Row[];
  error?: string; onReset: () => void; onConfirm?: () => IProcurementReceipt; commitment?: number; children?: React.ReactNode;
}): React.ReactElement {
  const s = useStyles();
  const [stage, setStage] = React.useState<'draft' | 'review' | 'receipt'>('draft');
  const [receipt, setReceipt] = React.useState<IProcurementReceipt>();
  const [confirmationError, setConfirmationError] = React.useState('');
  const confirmed = React.useRef(false);
  const summary = rows.map(([label, value]) => `${label}: ${String(value)}`).join('; ');
  const initialSummary = React.useRef(summary);
  useSnapshot(view, receipt?.recordId || recordId, stage === 'draft' ?
    `Unconfirmed draft; fields: ${rows.map(row => row[0]).join(', ')}; ${error ? `needs correction: ${error}` : 'ready for review'}; edited: ${summary !== initialSummary.current}` :
    stage === 'receipt' ? `${receipt?.id}; ${receipt?.action}; ${receipt?.summary}; session-only` : summary, stage);
  const confirm = (): void => {
    if (confirmed.current || error || view.preview) return;
    try {
      const result = onConfirm ? onConfirm() : recordConfirmation(view.definition.key, recordId, action, summary, view.actor, commitment);
      confirmed.current = true;
      setReceipt(result);
      setStage('receipt');
    } catch (reason) {
      setConfirmationError(`The session action could not be recorded: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };
  return <div className={s.body} data-workflow-stage={stage}>
    {view.preview && <p className={s.alert}>Safe preview: edit and review are available; confirmation is disabled.</p>}
    <ol className={s.steps} aria-label="Approval workflow">{(['draft', 'review', 'receipt'] as const).map((item, index) => <li key={item} className={mergeClasses(s.step, stage === item && s.currentStep)} aria-current={stage === item ? 'step' : undefined}>0{index + 1} / {item === 'draft' ? 'Prepare' : item === 'review' ? 'Review & confirm' : 'Session receipt'}</li>)}</ol>
    {confirmationError && <p role="alert" className={s.alert}>{confirmationError}</p>}
    {stage === 'draft' ? <>{children}{error && <p className={s.alert} role="alert">{error}</p>}<div className={s.actions}><Button appearance="primary" disabled={Boolean(error)} onClick={() => setStage('review')}>Review {action.toLowerCase()}</Button></div></> : stage === 'review' ? <Section title={`Review: ${action}`}><p className={s.muted}>Human checkpoint / verify the evidence and exact values before confirming.</p><dl className={s.reviewList}>{rows.map(([label, value]) => <React.Fragment key={label}><dt><strong>{label}</strong></dt><dd>{value}</dd></React.Fragment>)}</dl><p>No purchase order, supplier award, invoice posting, or external message will be created.</p><div className={s.actions}><Button onClick={() => { setConfirmationError(''); setStage('draft'); }}>Edit draft</Button><Button appearance="primary" disabled={Boolean(error) || view.preview} onClick={confirm}>Confirm session-only {action.toLowerCase()}</Button></div></Section> : <section className={mergeClasses(s.receipt, receipt?.result === 'approved' && s.approved, (receipt?.result === 'returned' || receipt?.result === 'declined') && s.returned)} role="status" aria-label="Session receipt"><h2 className={s.heading}>{action} recorded for this session</h2><p><strong>{receipt?.id}</strong> · {receipt?.recordId}</p><p>{receipt?.summary}</p><p className={s.muted}>{receipt?.actor} / {receipt?.timestamp} / {receipt?.result}</p><p>No external system was changed.</p>{view.definition.key === 'CreatePurchaseIntent' && <p>Next: open My Requests to review this submitted business case.</p>}<Button onClick={() => { onReset(); confirmed.current = false; setReceipt(undefined); setConfirmationError(''); setStage('draft'); }}>Reset draft</Button></section>}
  </div>;
}
function Decision({ view, recordId, actions, evidence, blockingReason, approvalBlockReason, onReset, commitment, children }: {
  view: IProcurementViewProps; recordId: string; actions: readonly string[]; evidence: readonly Row[];
  blockingReason?: string; approvalBlockReason?: string; onReset?: () => void; commitment?: number; children?: React.ReactNode;
}): React.ReactElement {
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const requested = view.properties.proposedDecision;
  const matches = actions.filter(action => action.toLowerCase() === requested?.toLowerCase() || action.split(' ')[0].toLowerCase() === requested?.toLowerCase());
  const initial = matches.length === 1 ? matches[0] : requested || actions[0];
  const [draft, setDraft, reset] = useDraft({ decision: initial, rationale: view.properties.conditionText || '' });
  const processed = receipts.some(receipt => receipt.intent === view.definition.key && receipt.recordId === recordId);
  const error = blockingReason || (draft.decision === actions[0] ? approvalBlockReason : undefined) || (processed ? 'This record was already processed in this session. Choose another record or reset the demo session.' : actions.indexOf(draft.decision) < 0 ? 'Choose a supported decision.' :
    draft.rationale.trim().length < 12 ? 'Explain the decision in at least 12 characters before review.' : undefined);
  return <Workflow view={view} recordId={recordId} action={draft.decision} rows={[...evidence, ['Decision', draft.decision], ['Rationale / conditions', draft.rationale]]} error={error} commitment={commitment} onReset={() => { reset(); onReset?.(); }}>
    {children}<Select label="Decision" value={draft.decision} options={actions} onChange={decision => setDraft({ ...draft, decision })} />
    <TextField label="Decision rationale / conditions (minimum 12 characters)" multiline value={draft.rationale} onChange={rationale => setDraft({ ...draft, rationale })} />
  </Workflow>;
}

function CreatePurchaseIntent(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles(), p = view.properties;
  const [draft, setDraft, reset] = useDraft({ outcome: p.outcome || 'Equip 600 field colleagues for the rugged-device launch', quantity: p.quantity ?? 600, budget: p.budget ?? 1200000, currency: p.currency || 'EUR', neededBy: p.neededBy || '2026-11-20', locations: p.locations?.join(', ') || 'Helsinki, Berlin', constraints: p.constraints?.join('; ') || 'Ruggedized; approved supplier; regional support', category: p.categoryHint || 'IT hardware' });
  const error = draft.outcome.trim().length < 12 ? 'Describe the business outcome in at least 12 characters.' :
    !validNumber(draft.quantity, 1, 100000) || !Number.isInteger(draft.quantity) ? 'Quantity must be a whole number from 1 to 100,000.' :
    !validNumber(draft.budget, 1, 10000000) ? 'Budget must be between 1 and 10,000,000.' :
    ['EUR', 'USD', 'GBP', 'JPY'].indexOf(draft.currency) < 0 || !CATEGORIES.some(category => category === draft.category) ? 'Choose a supported currency and category.' :
    !validDate(draft.neededBy) || !draft.locations.trim() ? 'Provide a valid needed-by date and delivery location.' : undefined;
  return <Workflow view={view} recordId="New purchase intent" action="Create purchase intent" rows={[['Outcome', draft.outcome], ['Quantity', draft.quantity], ['Budget', error ? String(draft.budget) : money(draft.budget, draft.currency)], ['Needed by', draft.neededBy], ['Locations', draft.locations], ['Category', draft.category], ['Constraints', draft.constraints]]} error={error} onReset={reset} onConfirm={() => submitPurchaseIntent(draft, view.actor)}>
    <TextField label="Business outcome" multiline value={draft.outcome} onChange={outcome => setDraft({ ...draft, outcome })} />
    <div className={s.grid}><Select label="Purchase category" value={draft.category} options={CATEGORIES} onChange={category => setDraft({ ...draft, category })} /><NumberField label="Quantity" value={draft.quantity} min={1} max={100000} onChange={quantity => setDraft({ ...draft, quantity })} /><NumberField label="Authorized budget" value={draft.budget} min={1} onChange={budget => setDraft({ ...draft, budget })} /><Select label="Currency" value={draft.currency} options={['EUR', 'USD', 'GBP', 'JPY']} onChange={currency => setDraft({ ...draft, currency })} /><TextField label="Needed by" type="date" value={draft.neededBy} onChange={neededBy => setDraft({ ...draft, neededBy })} /></div>
    <TextField label="Delivery locations" value={draft.locations} onChange={locations => setDraft({ ...draft, locations })} /><TextField label="Purchase constraints" value={draft.constraints} onChange={constraints => setDraft({ ...draft, constraints })} />
  </Workflow>;
}
function CompareBuyingOptions(view: IProcurementViewProps): React.ReactElement {
  const purchaseQueue = React.useSyncExternalStore(subscribeReceipts, getPurchaseQueue, getPurchaseQueue);
  const [selected, setSelected] = React.useState(initialSelection(purchaseQueue, view.properties.requestId));
  const request = purchaseQueue.find(item => item.id === selected);
  const [quantity, setQuantity] = React.useState(view.properties.quantity ?? request?.quantity ?? 600);
  const [neededBy, setNeededBy] = React.useState(view.properties.neededBy || '2026-11-20');
  const [priority, setPriority] = React.useState('Speed');
  const budget = view.properties.budget ?? request?.budget ?? 1200000;
  const currency = view.properties.currency || request?.currency || 'EUR';
  const valid = Boolean(request) && validNumber(quantity, 1, 100000) && Number.isInteger(quantity) && validNumber(budget, 1, 10000000) && currency === 'EUR' && validDate(neededBy);
  const daysAvailable = Math.floor((Date.parse(neededBy) - Date.parse(INVOCATION_DATE)) / 86400000);
  const options = valid ? [...buyingOptions(quantity)].sort((a, b) => priority === 'Speed' ? a.days - b.days : a.cost - b.cost) : [];
  useSnapshot(view, selected, `${priority}; ${quantity} units; ${options[0]?.route || 'no valid route'}; needed ${neededBy}`, !request ? 'no-match' : valid ? 'inspect' : 'input-error');
  return <><RecordPicker label="Route comparison request" value={selected} options={purchaseQueue} onChange={id => { setSelected(id); const next = purchaseQueue.find(item => item.id === id); if (next) setQuantity(next.quantity); }} /><NumberField label="Units needed" value={quantity} min={1} max={100000} onChange={setQuantity} /><TextField label="Route needed by" type="date" value={neededBy} onChange={setNeededBy} /><Select label="Optimize route for" value={priority} options={['Speed', 'Total cost']} onChange={setPriority} />{!valid && <p role="alert">Choose a known request, whole positive quantity, valid date and budget. The offline prices are EUR only; no conversion is implied.</p>}<Table title={`Fulfillment alternatives - budget ${valid ? money(budget) : 'requires correction'}`} columns={['Buying route', 'Estimated cost', 'Lead / deadline', 'Budget / evidence']} rows={options.map(option => [option.route, money(option.cost), `${option.days} days; ${option.days <= daysAvailable ? 'meets target' : 'misses target'}`, `${option.cost <= budget ? 'Within budget' : 'Over budget'}; ${option.evidence}`])} /><p>Timing is measured from the fixed sample date {INVOCATION_DATE}. Supplier award and purchase approval are separate tools.</p></>;
}
function CheckPurchasePolicy(view: IProcurementViewProps): React.ReactElement {
  const purchaseQueue = React.useSyncExternalStore(subscribeReceipts, getPurchaseQueue, getPurchaseQueue);
  const [requestId, setRequestId] = React.useState(initialSelection(purchaseQueue, view.properties.requestId));
  const request = purchaseQueue.find(item => item.id === requestId);
  const [qualifiedBids, setQualifiedBids] = React.useState(4);
  const amount = view.properties.budget ?? request?.budget ?? 0;
  const quantity = view.properties.quantity ?? request?.quantity ?? 0;
  const currency = view.properties.currency || request?.currency || 'EUR';
  const valid = validNumber(amount, 1, 10000000) && validNumber(quantity, 1, 100000) && currency === 'EUR' && validNumber(qualifiedBids, 0, 10) && Number.isInteger(qualifiedBids);
  const state = !request ? 'No matching request; policy not evaluated' : !valid ? 'Input correction required; policy not evaluated' : qualifiedBids < 3 ? 'Blocked - obtain at least three qualified bids' : amount > 1200000 ? 'Escalate - board authority required' : 'Ready for human review';
  useSnapshot(view, requestId, `${state}; ${quantity} units; ${amount} ${currency}; ${view.properties.constraints?.join('; ') || 'standard controls'}`, !request ? 'no-match' : valid ? 'inspect' : 'input-error');
  return <><RecordPicker label="Purchase request" value={requestId} options={purchaseQueue} onChange={setRequestId} />{request && <>
    <NumberField label="Qualified bids received" value={qualifiedBids} max={10} onChange={setQualifiedBids} />
    {!valid && <p role="alert">This policy scenario requires a valid EUR amount, positive quantity, and whole bid count from 0 to 10; correct the invocation before approval.</p>}
    <Metrics rows={[['Policy outcome', valid ? state : 'Input correction required'], ['Request amount', valid ? money(amount) : 'Not evaluated'], ['Units in scope', valid ? quantity : 'Not evaluated']]} />
    {Boolean(view.properties.constraints?.length) && <p>Additional requested constraints (not policy overrides): {view.properties.constraints?.join('; ')}</p>}
    <Table title="Policy evidence and remediation" columns={['Control', 'Evidence', 'Required response']} rows={[['Competition', `${qualifiedBids} qualified bids`, qualifiedBids >= 3 ? 'Pass' : 'Obtain missing qualified bids'], ['Authority', valid ? money(amount) : 'Invalid scope', amount > 1200000 ? 'Board review required' : 'Budget-owner review'], ...POLICY_RULES.slice(1).map(rule => [rule.title, `${rule.id} v${rule.version}: ${rule.detail}`, rule.state])]} />
  </>}</>;
}
function ReviewPurchaseRequest(view: IProcurementViewProps): React.ReactElement {
  const purchaseQueue = React.useSyncExternalStore(subscribeReceipts, getPurchaseQueue, getPurchaseQueue);
  const receipts = React.useSyncExternalStore(subscribeReceipts, getReceipts, getReceipts);
  const [selected, setSelected] = React.useState(initialSelection(purchaseQueue, view.properties.requestId));
  const request = purchaseQueue.find(item => item.id === selected);
  const processed = receipts.some(receipt => receipt.intent === view.definition.key && receipt.recordId === selected);
  return <><RecordPicker label="Pending purchase request" value={selected} options={purchaseQueue.map(item => ({ ...item, label: `${item.label}${receipts.some(receipt => receipt.intent === view.definition.key && receipt.recordId === item.id) ? ' (processed in session)' : ''}` }))} onChange={setSelected} />{request && <Decision key={selected} view={view} recordId={selected} actions={['Approve request', 'Return for evidence', 'Decline request']} evidence={[['Outcome', request.outcome || `${request.category} / ${request.quantity} units`], ['Category', request.category], ['Quantity', request.quantity], ['Budget commitment', money(request.budget, request.currency)], ['Requester', request.requesterId], ['Needed by', request.neededBy || 'Source request delivery window'], ['Delivery locations', request.locations || request.region], ['Constraints', request.constraints || 'Source policy applies']]} blockingReason={processed ? 'This request was already processed in this session. Choose another request.' : undefined}><Section title="Demand and commitment evidence"><Metrics rows={[['Requested units', request.quantity], ['Authorized amount', money(request.budget, request.currency)], ['Policy', 'Evidence reviewed; human authority required']]} /><p>{request.outcome || request.category}</p>{request.locations && <p>Delivery: {request.locations} / {request.neededBy}</p>}{request.constraints && <p>Constraints: {request.constraints}</p>}</Section></Decision>}</>;
}
function AggregateDemand(view: IProcurementViewProps): React.ReactElement {
  const [category, setCategory] = React.useState(view.properties.category || 'IT hardware');
  const [region, setRegion] = React.useState(view.properties.region || 'EMEA');
  const [currency, setCurrency] = React.useState(view.properties.currency || 'EUR');
  const cohort = demandCohort(category, region, currency);
  const units = cohort.reduce((sum, item) => sum + item.quantity, 0);
  useSnapshot(view, `cohort:${category}:${region}:${currency}`, `${cohort.length} current open requests; ${units} units`);
  return <><Select label="Demand category" value={category} options={CATEGORIES} onChange={setCategory} /><Select label="Demand region" value={region} options={['All regions', ...REGIONS]} onChange={setRegion} /><Select label="Demand currency" value={currency} options={['EUR', 'USD', 'GBP', 'JPY']} onChange={setCurrency} /><Metrics rows={[['Consolidatable requests', cohort.length], ['Combined units', units], ['Cohort currency', currency]]} /><Table title="Source requests in this cohort (first 8)" columns={['Request', 'Requester', 'Units', 'Budget']} rows={cohort.slice(0, 8).map(item => [item.id, item.requesterId, item.quantity, money(item.budget, currency)])} /><p>Only the selected currency is aggregated. Create a sourcing event separately after validating timing and compatibility.</p></>;
}
function BuildSourcingEvent(view: IProcurementViewProps): React.ReactElement {
  const p = view.properties;
  const [draft, setDraft, reset] = useDraft({ scope: p.outcome || 'Rugged-device sourcing for the field rollout', category: p.category || 'IT hardware', deadline: p.neededBy || '2026-11-10', supplier: initialSelection(supplierRecords, p.supplierId), cohort: p.cohortId || 'ZPC-COHORT-07' });
  const supplier = supplierRecords.find(item => item.id === draft.supplier);
  const error = !supplier ? 'Choose a qualified supplier for the invitation list.' : draft.scope.trim().length < 12 || !draft.cohort.trim() ? 'Provide a specific scope and source cohort.' : !validDate(draft.deadline) ? 'Provide a valid bid deadline.' : !CATEGORIES.some(category => category === draft.category) ? 'Choose a supported category.' : undefined;
  return <Workflow view={view} recordId={p.eventId || 'New sourcing event'} action="Create sourcing event draft" rows={[['Source cohort', draft.cohort], ['Scope', draft.scope], ['Category', draft.category], ['Bid deadline', draft.deadline], ['Invited supplier', supplier?.supplier || draft.supplier], ['Evaluation model', 'Price 28%; delivery 22%; quality 20%; risk 20%; sustainability 10%']]} error={error} onReset={reset}><TextField label="Source demand cohort" value={draft.cohort} onChange={cohort => setDraft({ ...draft, cohort })} /><TextField label="Sourcing scope" value={draft.scope} onChange={scope => setDraft({ ...draft, scope })} /><Select label="Sourcing category" value={draft.category} options={CATEGORIES} onChange={category => setDraft({ ...draft, category })} /><TextField label="Bid deadline" type="date" value={draft.deadline} onChange={deadline => setDraft({ ...draft, deadline })} /><RecordPicker label="Qualified supplier to invite" value={draft.supplier} options={supplierRecords} onChange={supplier => setDraft({ ...draft, supplier })} /><p>The review creates a session draft, not supplier communication or a live sourcing event.</p></Workflow>;
}
function CompareSupplierBids(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const [eventId, setEventId] = React.useState(initialSelection([{ id: EVENTS[0].id, label: EVENTS[0].id }], view.properties.eventId));
  const [riskWeight, setRiskWeight] = React.useState(view.properties.riskWeight ?? 20);
  const [supplierId, setSupplierId] = React.useState(initialSelection(supplierRecords, view.properties.supplierId));
  const supplier = supplierRecords.find(item => item.id === supplierId);
  const valid = validNumber(riskWeight, 5, 45);
  const validEvent = eventId === EVENTS[0].id;
  const weights = { ...DEFAULT_WEIGHTS, risk: riskWeight, price: 48 - riskWeight };
  const summary = validEvent && valid && supplier
    ? `${eventId}; ${supplier.supplier}; risk weight ${riskWeight}%; weighted score ${normalizeScore(supplier, weights).toFixed(1)}; bid ${money(supplier.price)}; lead ${supplier.lead} days; quality ${supplier.quality}/100; risk ${supplier.risk}/100; sustainability ${supplier.sustainability}/100; confidence ${supplier.confidence}%`
    : 'No supported event, supplier, or weighting; no bid evidence was evaluated.';
  useSnapshot(view, validEvent ? supplierId : eventId, summary, !validEvent || !supplier ? 'no-match' : valid ? 'inspect' : 'input-error');
  return <>
    <div className={s.grid}>
      <RecordPicker label="Sourcing event" value={eventId} options={[{ id: EVENTS[0].id, label: EVENTS[0].id }]} onChange={setEventId} />
      {validEvent && <><NumberField label="Risk weight (%)" value={riskWeight} min={5} max={45} onChange={setRiskWeight} /><RecordPicker label="Inspect supplier evidence" value={supplierId} options={supplierRecords} onChange={setSupplierId} /></>}
    </div>
    {validEvent && <>{valid ? <SupplierLandscape weights={weights} onSelect={bidId => { const selected = supplierRecords.find(item => item.bidId === bidId); if (selected) setSupplierId(selected.id); }} /> : <p role="alert">Risk weight must be between 5% and 45%; other weights retain a total of 100%.</p>}{supplier && <Metrics rows={[['Selected supplier', supplier.supplier], ['Evidence confidence', `${supplier.confidence}%`], ['Lead time', `${supplier.lead} days`]]} />}</>}
  </>;
}
function ReviewSupplierAward(view: IProcurementViewProps): React.ReactElement {
  const eventOptions = [{ id: EVENTS[0].id, label: EVENTS[0].id }];
  const [eventId, setEventId] = React.useState(initialSelection(eventOptions, view.properties.eventId));
  const [split, setSplit] = React.useState(view.properties.splitPercent ?? 65);
  const valid = validNumber(split, 50, 85);
  const scenario = valid ? splitAward(split) : undefined;
  return <><RecordPicker label="Award event" value={eventId} options={eventOptions} onChange={setEventId} />{eventId === EVENTS[0].id && <Decision
    key={eventId} view={view} recordId={eventId}
    commitment={scenario?.cost}
    actions={['Approve split award', 'Return award for evidence', 'Decline award']}
    blockingReason={!valid ? 'Primary share must be between 50% and 85%.' : undefined}
    approvalBlockReason={split > 70 ? 'Corridor concentration exceeds this sample authority. Reduce the primary share to 70% or below before approval.' : undefined}
    evidence={[['Primary supplier', `Fabrikam Devices ${split}%`], ['Resilient supplier', `Contoso Mobility ${100 - split}%`], ['Total award', scenario ? money(scenario.cost) : 'Requires valid allocation'], ['Blended risk', scenario ? `${scenario.risk}/100` : 'Requires valid allocation'], ['On-time confidence', scenario ? `${scenario.onTime}%` : 'Requires valid allocation']]}>
    <NumberField label="Primary award share (%)" value={split} min={50} max={85} onChange={setSplit} />
    {scenario && <><AwardAllocation primaryPercent={split} /><Metrics rows={[['Award cost', money(scenario.cost)], ['Blended risk', `${scenario.risk}/100`], ['Resilient share', `${100 - split}%`]]} /></>}
    <p>Approval safeguard: primary share cannot exceed 70%. Returning or declining an otherwise valid proposal remains available.</p>
  </Decision>}</>;
}
function ExploreSupplier360(view: IProcurementViewProps): React.ReactElement {
  const [selected, setSelected] = React.useState(initialSelection(supplierRecords, view.properties.supplierId));
  const supplier = supplierRecords.find(item => item.id === selected);
  const related = contracts.filter(contract => contract.supplierId === selected);
  useSnapshot(view, selected, `${supplier?.supplier || 'No supplier match'}; ${related.length} contracts; curated relationship snapshot`, supplier ? 'inspect' : 'no-match');
  return <><RecordPicker label="Supplier relationship" value={selected} options={supplierRecords} onChange={setSelected} />{supplier && <><Metrics rows={[['Quality accepted', `${supplier.quality}%`], ['Evidence confidence', `${supplier.confidence}%`], ['Risk score', `${supplier.risk}/100`]]} /><Table title="Connected obligations and owners" columns={['Record', 'Obligation', 'Accountability']} rows={related.map(contract => [contract.id, `${contract.noticeDays}-day notice; ${money(contract.annualValue)} annual scope`, 'Contract lead'])} /><Section title="Relationship evidence"><p>{supplier.supplier} supports the {supplier.region} rollout. Bid lead time is {supplier.lead} days; sustainability evidence scores {supplier.sustainability}/100. This relationship view does not qualify or award a supplier.</p></Section></>}</>;
}
function ReviewContractRenewal(view: IProcurementViewProps): React.ReactElement {
  const options = view.properties.supplierId ? contracts.filter(item => item.supplierId === initialSelection(supplierRecords, view.properties.supplierId)) : contracts;
  const [selected, setSelected] = React.useState(initialSelection(options, view.properties.contractId));
  const contract = options.find(item => item.id === selected);
  return <><RecordPicker label="Contract due for renewal" value={selected} options={options} onChange={setSelected} />{contract && <Decision key={selected} view={view} recordId={selected} actions={['Renew with conditions', 'Renegotiate', 'Exit at notice date']} evidence={[['Annual baseline', money(contract.annualValue)], ['Quoted increase', `${contract.renewalIncrease}%`], ['Renewal value', money(Math.round(contract.annualValue * (1 + contract.renewalIncrease / 100)))], ['Notice window', `${contract.noticeDays} days`]]}><Metrics rows={[['Notice window', `${contract.noticeDays} days`], ['Annual increase', money(Math.round(contract.annualValue * contract.renewalIncrease / 100))]]} /><p>Review scope, exit dependencies, and notice ownership before making a session renewal decision.</p></Decision>}</>;
}
function DetectSpendLeakage(view: IProcurementViewProps): React.ReactElement {
  const [category, setCategory] = React.useState(view.properties.category || 'All categories');
  const [region, setRegion] = React.useState(view.properties.region || 'All regions');
  const [selected, setSelected] = React.useState(initialSelection(leakageOpportunities, view.properties.opportunityId));
  const records = leakageOpportunities.filter(item => (category === 'All categories' || item.category === category) && (region === 'All regions' || item.region === region));
  const opportunity = records.find(item => item.id === selected);
  useSnapshot(view, selected, `${records.length} current addressable opportunities; ${category}; ${region}`);
  return <><Select label="Leakage category" value={category} options={['All categories', ...CATEGORIES]} onChange={setCategory} /><Select label="Leakage region" value={region} options={['All regions', ...REGIONS]} onChange={setRegion} /><Table title="Addressable leakage, not realized savings" columns={['Opportunity', 'Category', 'Identified', 'Evidence']} rows={records.map(item => [item.id, item.label, money(item.identified), `${item.region}; ${money(item.disputed)} disputed`])} /><RecordPicker label="Inspect leakage evidence" value={selected} options={records} onChange={setSelected} />{opportunity && <p>{opportunity.label}: {money(opportunity.identified)} identified, but only {money(opportunity.realized)} has realized evidence. Recovery approval is a separate workflow.</p>}</>;
}
function TrackSupplierRisk(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const [selected, setSelected] = React.useState(initialSelection(supplierRecords, view.properties.supplierId));
  const [scenario, setScenario] = React.useState(view.properties.scenario || 'Current corridor');
  const [region, setRegion] = React.useState(view.properties.region || 'EMEA');
  const supported = ['Current corridor', 'Port disruption', 'Dual-source buffer'].indexOf(scenario) >= 0 && REGIONS.some(item => item === region);
  const supplier = supported ? supplierRecords.find(item => item.id === selected) : undefined;
  const exposure = supplier ? Math.min(100, supplier.risk + (scenario === 'Port disruption' ? 22 : scenario === 'Dual-source buffer' ? -14 : 0) + (region === 'APAC' ? 8 : 0)) : 0;
  useSnapshot(view, selected, supplier ? `${region}; ${scenario}; modeled exposure ${exposure}/100` : 'No supported supplier/scenario; no exposure was evaluated', supplier ? 'inspect' : 'no-match');
  return <><RecordPicker label="Risk supplier" value={selected} options={supplierRecords} onChange={setSelected} /><Select label="Exposure region" value={region} options={REGIONS} onChange={setRegion} /><Select label="Continuity scenario" value={scenario} options={['Current corridor', 'Port disruption', 'Dual-source buffer']} onChange={setScenario} />{supplier && <Section title="Dependency and continuity exposure"><Metrics rows={[['Modeled exposure', `${exposure}/100`], ['Lead-time evidence', `${supplier.lead} days`]]} /><progress className={s.progress} aria-label="Modeled supplier exposure" value={exposure} max={100} /><ol className={s.list}><li>{supplier.supplier} assembly commitment</li><li>{region} logistics corridor</li><li>Battery and component sub-tier availability</li><li>Field launch promise and inventory buffer</li></ol><p>Scenario arithmetic, not a verified disruption. Approving mitigation requires a separate reviewed plan.</p></Section>}</>;
}
function ResolveInvoiceException(view: IProcurementViewProps): React.ReactElement {
  const [selected, setSelected] = React.useState(initialSelection(invoices, view.properties.invoiceId));
  const invoice = invoices.find(item => item.id === selected);
  const gap = invoice ? invoice.billed - invoice.received : 0;
  return <><RecordPicker label="Invoice exception" value={selected} options={invoices} onChange={setSelected} />{invoice && <Decision key={selected} view={view} recordId={selected} actions={['Request corrected invoice', 'Hold for receipt evidence', 'Return to supplier']} evidence={[['Supplier', invoice.supplier], ['PO value', money(invoice.po)], ['Accepted receipt', money(invoice.received)], ['Invoiced', money(invoice.billed)], ['Unmatched amount', money(gap)], ['Tolerance', money(invoice.tolerance)]]}><Table title="Three-way reconciliation" columns={['Source', 'Amount', 'Finding']} rows={[['Purchase order', money(invoice.po), 'Ordered commitment'], ['Goods receipt', money(invoice.received), 'Accepted delivery only'], ['Supplier invoice', money(invoice.billed), `${money(gap)} unmatched; above ${money(invoice.tolerance)} tolerance`]]} /><p>Payment release is deliberately unavailable while the exception remains outside tolerance.</p></Decision>}</>;
}
function ExploreSpendPerformance(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const [category, setCategory] = React.useState(view.properties.category || 'All categories');
  const [period, setPeriod] = React.useState(view.properties.period || 'Current period');
  const [region, setRegion] = React.useState(view.properties.region || 'All regions');
  const records = leakageOpportunities.filter(item => (category === 'All categories' || item.category === category) && (region === 'All regions' || item.region === region));
  const factor = period === 'Previous period' ? 0.8 : 1;
  const stages = ['identified', 'negotiated', 'contracted', 'realized'] as const;
  const values = stages.map(stage => Math.round(records.reduce((sum, item) => sum + item[stage], 0) * factor));
  const disputed = records.reduce((sum, item) => sum + item.disputed, 0);
  useSnapshot(view, `${category}:${region}`, `${period}; realized ${values[3]} EUR; disputed ${disputed} EUR excluded`);
  return <><Select label="Value category" value={category} options={['All categories', ...CATEGORIES]} onChange={setCategory} /><Select label="Value region" value={region} options={['All regions', ...REGIONS]} onChange={setRegion} /><Select label="Value period" value={period} options={['Current period', 'Previous period']} onChange={setPeriod} /><Section title="Opportunity to verified value">{stages.map((stage, index) => <div key={stage}><p>{stage}: <strong>{money(values[index])}</strong></p><progress className={s.progress} aria-label={`${stage} procurement value`} max={Math.max(values[0], 1)} value={values[index]} /></div>)}</Section><p>{money(disputed)} disputed freight remains excluded from realized value. Previous-period values are an explicit deterministic sample comparison.</p></>;
}
function OnboardSupplier(view: IProcurementViewProps): React.ReactElement {
  const p = view.properties;
  const [draft, setDraft, reset] = useDraft({ name: p.supplierName || '', country: p.country || 'Finland', category: p.category || 'IT hardware', purpose: p.outcome || 'Support the regional field-device rollout', tax: false, security: false, bank: false });
  const error = draft.name.trim().length < 3 ? 'Enter the candidate supplier legal name.' : !CATEGORIES.some(category => category === draft.category) ? 'Choose a supported category.' : !draft.country.trim() || draft.purpose.trim().length < 12 ? 'Provide country and specific business purpose.' : !draft.tax || !draft.security || !draft.bank ? 'Review tax, security, and independently verified bank evidence before submission.' : undefined;
  const evidence = `Tax ${draft.tax ? 'reviewed' : 'not reviewed'}; security ${draft.security ? 'reviewed' : 'not reviewed'}; independent bank evidence ${draft.bank ? 'reviewed' : 'not reviewed'}`;
  return <Workflow view={view} recordId="New supplier candidate" action="Submit supplier candidate" rows={[['Legal name', draft.name], ['Country', draft.country], ['Category', draft.category], ['Business purpose', draft.purpose], ['Evidence', evidence]]} error={error} onReset={reset}>
    <TextField label="Supplier legal name" value={draft.name} onChange={name => setDraft({ ...draft, name })} />
    <TextField label="Supplier country" value={draft.country} onChange={country => setDraft({ ...draft, country })} />
    <Select label="Candidate category" value={draft.category} options={CATEGORIES} onChange={category => setDraft({ ...draft, category })} />
    <TextField label="Business purpose" value={draft.purpose} onChange={purpose => setDraft({ ...draft, purpose })} />
    <fieldset><legend>Evidence reviewed (sample attestations)</legend>
      <label><input type="checkbox" checked={draft.tax} onChange={event => setDraft({ ...draft, tax: event.target.checked })} /> Tax identity</label>
      <label><input type="checkbox" checked={draft.security} onChange={event => setDraft({ ...draft, security: event.target.checked })} /> Security assessment</label>
      <label><input type="checkbox" checked={draft.bank} onChange={event => setDraft({ ...draft, bank: event.target.checked })} /> Bank details verified independently</label>
    </fieldset><p>Candidate intake does not qualify a supplier or collect real bank information.</p>
  </Workflow>;
}
function ReviewSupplierQualification(view: IProcurementViewProps): React.ReactElement {
  const [selected, setSelected] = React.useState(initialSelection(supplierRecords, view.properties.supplierId));
  const [expiry, setExpiry] = React.useState(view.properties.neededBy || '2027-02-28');
  const supplier = supplierRecords.find(item => item.id === selected);
  return <><RecordPicker label="Qualification candidate" value={selected} options={supplierRecords} onChange={setSelected} />{supplier && <Decision key={selected} view={view} recordId={selected} actions={['Qualify with conditions', 'Request missing evidence', 'Decline qualification']} blockingReason={!validDate(expiry) ? 'Provide a valid qualification expiry date.' : undefined} evidence={[['Supplier', supplier.supplier], ['Qualification scope', 'Rugged field devices only'], ['Evidence confidence', `${supplier.confidence}%`], ['Open condition', supplier.risk > 60 ? 'Sub-tier continuity assurance required' : 'Annual evidence refresh'], ['Qualification expiry', expiry]]}><TextField label="Qualification expiry" type="date" value={expiry} onChange={setExpiry} /><Table title="Qualification evidence, not an award" columns={['Control', 'State', 'Required condition']} rows={[['Identity / tax', 'Reviewed', 'Maintain current identity evidence'], ['Security', 'Reviewed', 'Refresh annually'], ['Continuity', supplier.risk > 60 ? 'Conditional' : 'Reviewed', supplier.risk > 60 ? 'Obtain sub-tier assurance before use' : 'Monitor risk changes']]} /></Decision>}</>;
}
function PlanSupplierRiskMitigation(view: IProcurementViewProps): React.ReactElement {
  const p = view.properties;
  const [draft, setDraft, reset] = useDraft({ supplier: initialSelection(supplierRecords, p.supplierId), action: p.outcome || 'Establish a qualified secondary battery source', owner: p.owner || 'Nestor Wilke', due: p.neededBy || '2026-11-15', budget: p.budget ?? 48000, trigger: p.scenario || 'Port delay exceeds seven days' });
  const supplier = supplierRecords.find(item => item.id === draft.supplier);
  const error = !supplier ? 'Choose a known supplier.' : draft.action.trim().length < 12 || draft.trigger.trim().length < 8 || !draft.owner.trim() ? 'Provide the mitigation action, trigger, and accountable owner.' : !validDate(draft.due) || !validNumber(draft.budget, 1, 1000000) ? 'Provide a valid due date and budget from 1 to 1,000,000 EUR.' : undefined;
  return <Workflow view={view} recordId={draft.supplier} action="Submit mitigation plan" rows={[['Supplier', supplier?.supplier || draft.supplier], ['Action', draft.action], ['Trigger', draft.trigger], ['Owner', draft.owner], ['Due date', draft.due], ['Cost', Number.isFinite(draft.budget) ? money(draft.budget) : 'Invalid amount'], ['Modeled residual risk', supplier ? `${Math.max(0, supplier.risk - 14)}/100; scenario only` : 'Not evaluated']]} error={error} onReset={reset}><RecordPicker label="Mitigation supplier" value={draft.supplier} options={supplierRecords} onChange={supplier => setDraft({ ...draft, supplier })} /><TextField label="Owned mitigation action" value={draft.action} onChange={action => setDraft({ ...draft, action })} /><TextField label="Activation trigger" value={draft.trigger} onChange={trigger => setDraft({ ...draft, trigger })} /><TextField label="Accountable owner" value={draft.owner} onChange={owner => setDraft({ ...draft, owner })} /><TextField label="Mitigation due date" type="date" value={draft.due} onChange={due => setDraft({ ...draft, due })} /><NumberField label="Mitigation cost (EUR)" value={draft.budget} min={1} max={1000000} onChange={budget => setDraft({ ...draft, budget })} /></Workflow>;
}
function NegotiateContractTerms(view: IProcurementViewProps): React.ReactElement {
  const p = view.properties;
  const options = p.supplierId ? contracts.filter(item => item.supplierId === initialSelection(supplierRecords, p.supplierId)) : contracts;
  const [selected, setSelected] = React.useState(initialSelection(options, p.contractId));
  const contract = options.find(item => item.id === selected);
  const [draft, setDraft, reset] = useDraft({ target: p.budget ?? 1000000, give: 'Commit a 24-month volume forecast', get: p.outcome || 'Cap renewal increase at 2% and protect delivery credits', date: p.neededBy || '2026-11-10' });
  const error = !contract ? 'Choose a contract in the selected supplier scope.' : !validNumber(draft.target, 1, contract.annualValue * 1.2) ? 'Target must be positive and no more than 120% of the annual baseline.' : draft.give.trim().length < 12 || draft.get.trim().length < 12 || !validDate(draft.date) ? 'Provide specific give/get positions and a valid negotiation date.' : undefined;
  return <><RecordPicker label="Negotiation contract" value={selected} options={options} onChange={setSelected} />{contract && <Workflow key={selected} view={view} recordId={selected} action="Save negotiation mandate" rows={[['Baseline', money(contract.annualValue)], ['Target annual value', Number.isFinite(draft.target) ? money(draft.target) : 'Invalid'], ['Give', draft.give], ['Get / protected terms', draft.get], ['Negotiation by', draft.date]]} error={error} onReset={reset}><NumberField label="Target annual value (EUR)" value={draft.target} min={1} onChange={target => setDraft({ ...draft, target })} /><TextField label="What we can give" value={draft.give} onChange={give => setDraft({ ...draft, give })} /><TextField label="What we must get / protect" value={draft.get} onChange={get => setDraft({ ...draft, get })} /><TextField label="Negotiate by" type="date" value={draft.date} onChange={date => setDraft({ ...draft, date })} /><p>This is an internal mandate, not supplier communication or a signed contract.</p></Workflow>}</>;
}
function ManagePurchaseOrderChange(view: IProcurementViewProps): React.ReactElement {
  const hinted = view.properties.purchaseOrderId || view.properties.requestId;
  const options = hinted && purchaseOrders.some(order => order.requestId === hinted) ? purchaseOrders.filter(order => order.requestId === hinted) : purchaseOrders;
  const [selected, setSelected] = React.useState(initialSelection(options, hinted && !purchaseOrders.some(order => order.requestId === hinted) ? hinted : undefined));
  const order = options.find(item => item.id === selected);
  const [quantity, setQuantity] = React.useState(view.properties.quantity ?? 650);
  const [date, setDate] = React.useState(view.properties.neededBy || '2026-11-27');
  const revised = order ? Math.round(order.value / order.quantity * quantity) : 0;
  const cap = order ? Math.min(view.properties.budget ?? order.value * 1.2, order.value * 1.2) : 0;
  const valid = order && validNumber(quantity, 1, 100000) && Number.isInteger(quantity) && validDate(date) && validNumber(cap, 1, 10000000);
  return <><RecordPicker label="Purchase order to change" value={selected} options={options} onChange={setSelected} />{order && <Decision
    key={selected} view={view} recordId={selected}
    actions={['Approve PO change', 'Return change request', 'Decline PO change']}
    blockingReason={!valid ? 'Provide a whole positive quantity, valid date, and valid authority cap.' : undefined}
    approvalBlockReason={revised > cap ? 'Revised commitment exceeds the supplied authority cap. Reduce the change or obtain separate authority.' : undefined}
    evidence={[['Source request', order.requestId], ['Original quantity', order.quantity], ['Revised quantity', quantity], ['Original commitment', money(order.value)], ['Revised commitment', Number.isFinite(revised) ? money(revised) : 'Invalid'], ['Authority cap', Number.isFinite(cap) ? money(cap) : 'Invalid'], ['Revised delivery', date]]}>
    <NumberField label="Revised order quantity" value={quantity} min={1} max={100000} onChange={setQuantity} />
    <TextField label="Revised delivery date" type="date" value={date} onChange={setDate} />
    <Table title="Before and after commitment" columns={['Measure', 'Current PO', 'Proposed change']} rows={[['Quantity', order.quantity, Number.isFinite(quantity) ? quantity : 'Invalid'], ['Commitment', money(order.value), Number.isFinite(revised) ? money(revised) : 'Invalid'], ['Delivery', order.neededBy, date]]} />
    <p>The approval cap is the lower of the supplied cap and 120% of the source PO. A prompt cannot raise this authority; returning or declining remains available.</p>
  </Decision>}</>;
}
function TrackLeakageRecovery(view: IProcurementViewProps): React.ReactElement {
  const [selected, setSelected] = React.useState(initialSelection(leakageOpportunities, view.properties.opportunityId));
  const record = leakageOpportunities.find(item => item.id === selected);
  return <><RecordPicker label="Recovery intervention" value={selected} options={leakageOpportunities} onChange={setSelected} />{record && <Decision key={selected} view={view} recordId={selected} actions={['Accept verified recovery', 'Return recovery evidence', 'Keep intervention open']} evidence={[['Intervention', record.label], ['Identified opportunity', money(record.identified)], ['Verified realized value', money(record.realized)], ['Excluded disputed amount', money(record.disputed)], ['Evidence period', view.properties.period || 'Current period']]}><Table title="Intervention evidence trail" columns={['Stage', 'Amount', 'Evidence status']} rows={[['Identified', money(record.identified), 'Addressable opportunity'], ['Contracted', money(record.contracted), 'Signed-rate sample evidence'], ['Realized', money(record.realized), 'Accepted invoice evidence'], ['Disputed', money(record.disputed), 'Excluded; not available for acceptance']]} /><p>Accepting recovery records only the verified amount, never identified or disputed value.</p></Decision>}</>;
}
function ExploreSupplierPortfolioBalance(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const [limit, setLimit] = React.useState(view.properties.concentrationLimit ?? 60);
  const [region, setRegion] = React.useState(view.properties.region || 'EMEA');
  const category = 'IT hardware';
  const [scenario, setScenario] = React.useState(view.properties.scenario || 'Diversified supply');
  const valid = validNumber(limit, 34, 80) && REGIONS.some(item => item === region) &&
    ['Diversified supply', 'Regional continuity buffer'].indexOf(scenario) >= 0;
  const shares = diversification(valid ? limit : 60);
  const risk = Math.round(shares.reduce((sum, share, index) => sum + share * supplierRecords[index].risk, 0) / 100);
  const handling = region === 'APAC' ? 6 : region === 'AMER' ? 3 : 0;
  const modeledRisk = Math.min(100, Math.max(0, risk + handling - (scenario === 'Regional continuity buffer' ? 8 : 0)));
  useSnapshot(view, `${category}:${region}`, valid ? `${scenario}; maximum share ${limit}%; modeled risk ${modeledRisk}/100` : 'Input correction required; no portfolio scenario evaluated');
  return <>
    <p>Curated portfolio: IT hardware. These device suppliers are not presented as evidence for unrelated categories.</p>
    <Select label="Portfolio region" value={region} options={REGIONS} onChange={setRegion} />
    <Select label="Portfolio scenario" value={scenario} options={['Diversified supply', 'Regional continuity buffer']} onChange={setScenario} />
    <NumberField label="Maximum primary supplier share (%)" value={limit} min={34} max={80} onChange={setLimit} />
    {!valid ? <p role="alert">Choose a supported region/scenario and a concentration limit between 34% and 80%.</p> : <Section title={`${category} / ${region} allocation scenario`}>
      <Metrics rows={[['Allocated total', '100%'], ['Modeled weighted risk', `${modeledRisk}/100`]]} />
      {shares.map((share, index) => <div key={supplierRecords[index].id}><p>{supplierRecords[index].supplier}: {share}%</p><progress className={s.progress} aria-label={`${supplierRecords[index].supplier} allocation`} value={share} max={100} /></div>)}
      <p>Illustrative arithmetic: weighted supplier risk plus regional handling (APAC +6, AMER +3, others +0), minus 8 for the continuity-buffer scenario. This is not verified disruption evidence or an award.</p>
    </Section>}
  </>;
}
function ExploreAgentCapabilities(view: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const [query, setQuery] = React.useState(view.properties.query || '');
  const [preview, setPreview] = React.useState<ProcurementIntentKey>();
  const [message, setMessage] = React.useState('');
  const records = INTENTS.filter(intent => intent.operation !== 'education' && `${intent.title} ${intent.question} ${intent.operation}`.toLowerCase().includes(query.toLowerCase()));
  useSnapshot(view, preview || '', `Capability search: ${query}; ${records.length} scenarios`);
  if (preview) return <><Button onClick={() => setPreview(undefined)}>Back to procurement scenarios</Button><ProcurementInlineExperience key={preview} definition={getIntent(preview)} properties={{}} preview /></>;
  return <><TextField label="Search procurement scenarios" value={query} onChange={setQuery} /><p>{records.length} matching scenarios. Previews cannot confirm actions.</p>{message && <p role="status">{message}</p>}<div className={s.grid}>{records.map(intent => <Section key={intent.key} title={intent.title}><p>{intent.question}</p><p className={s.muted}>{intent.operation} · {intent.excludes}</p><p>Prompt: {intent.prompt}</p><div className={s.actions}><Button onClick={() => setPreview(intent.key)}>Preview {intent.title.toLowerCase()}</Button>{view.onSendFollowUp && <Button onClick={() => { view.onSendFollowUp?.(intent.prompt).then(accepted => setMessage(accepted ? 'Prompt sent to Copilot.' : 'Copilot did not accept the prompt. Copy the displayed prompt instead.')).catch(error => setMessage(`Unable to send prompt: ${String(error)}`)); }}>Use this prompt</Button>}</div></Section>)}</div>{records.length === 0 && <p role="status">No scenario matches. Try a business term such as invoice, supplier, or award.</p>}</>;
}

const views: Record<ProcurementIntentKey, React.ComponentType<IProcurementViewProps>> = {
  CreatePurchaseIntent, CompareBuyingOptions, CheckPurchasePolicy, ReviewPurchaseRequest, AggregateDemand,
  BuildSourcingEvent, CompareSupplierBids, ReviewSupplierAward, ExploreSupplier360, ReviewContractRenewal,
  DetectSpendLeakage, TrackSupplierRisk, ResolveInvoiceException, ExploreSpendPerformance, OnboardSupplier,
  ReviewSupplierQualification, PlanSupplierRiskMitigation, NegotiateContractTerms, ManagePurchaseOrderChange,
  TrackLeakageRecovery, ExploreSupplierPortfolioBalance, ExploreAgentCapabilities
};
export function ProcurementInlineExperience(props: IProcurementViewProps): React.ReactElement {
  const s = useStyles();
  const View = views[props.definition.key];
  return <ViewContext.Provider value={props}><div className={s.body} data-experience={props.definition.key}><View {...props} /></div></ViewContext.Provider>;
}
