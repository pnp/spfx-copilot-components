import * as React from 'react';
import { Badge, Button, Checkbox, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { IRevenueAppProps, IModelContextSnapshot } from './RevenueApp';
import { INTENTS, type RevenueIntentKey } from './catalog';
import { Chat20Regular, CheckmarkCircle20Regular } from '@fluentui/react-icons';
import DealOperations, { type useDealOperationsSession } from './DealOperations';
import DealAttention, { attentionDeals, type AttentionMeasure } from './DealAttention';
import { contextRecord, createCopilotHandoff, createCopilotSummary, getCopilotActions, type ICopilotAction } from './copilot';
import PersonalPriorities from './PersonalPriorities';
import FlowExperience from './FlowExperience';
import { revenueFlow } from './flows';
import { fullscreenNextAction, fullscreenTask } from './fullscreenWorkspaceModel';
import CountryRevenueExperience from './CountryRevenueExperience';
import InlineBusinessVisual, { inlineBusinessChart } from './InlineBusinessVisual';
import type { IRevenuePriority } from './priorities';
import { HERO_EVIDENCE, OPPORTUNITIES, calculateCommercialOffer, type ICommercialInput } from './domain';
import {
  analysisRows, currency, initialDraft, resolveScope, scopedContacts, scopedEvidence, workflowCalculation,
  workflowErrors, workflowFor, workflowReviewPages, type IBusinessRow
} from './operations';
import { D3CommercialContour, D3EvidenceFreshness, D3PipelineQuality, D3RevenueMap } from './visualizations/RevenueCharts';

const useStyles = makeStyles({
  root: { minWidth: 0, display: 'grid', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalL },
  panel: { minWidth: 0, padding: tokens.spacingVerticalL, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, backgroundImage: `linear-gradient(145deg, ${tokens.colorNeutralBackground1}, ${tokens.colorBrandBackground2})`, boxShadow: tokens.shadow8, overflowWrap: 'anywhere' },
  heading: { margin: '0 0 8px', fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500 },
  muted: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: tokens.spacingHorizontalM, '@media(max-width: 520px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  field: { display: 'flex', minWidth: 0, flexDirection: 'column', gap: tokens.spacingVerticalXS, marginBottom: tokens.spacingVerticalS },
  select: { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalM },
  rows: { display: 'grid', gap: tokens.spacingVerticalS, marginTop: tokens.spacingVerticalM, maxHeight: '560px', overflowY: 'auto' },
  row: { padding: tokens.spacingVerticalM, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, minWidth: 0 },
  active: { border: `2px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  metric: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, margin: '8px 0' },
  detail: { margin: '8px 0', whiteSpace: 'pre-wrap' },
  error: { color: tokens.colorPaletteRedForeground1 },
  definition: { display: 'grid', gridTemplateColumns: 'minmax(100px, .6fr) minmax(0, 1fr)', gap: '8px', margin: 0, '& dd': { margin: 0 } },
  compact: { gap: '8px', marginTop: 0, '& h2': { margin: '4px 0', fontSize: tokens.fontSizeBase400, lineHeight: tokens.lineHeightBase400 }, '& h3': { margin: '4px 0', fontSize: tokens.fontSizeBase300, lineHeight: tokens.lineHeightBase300 }, '& p': { margin: '4px 0', fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200 }, '& article': { padding: '8px' }, '& [data-layout]': { marginTop: 0, gap: '8px' } },
  compactPanel: { padding: '8px', boxShadow: tokens.shadow2 },
  countryPanel: { padding: '0', border: 'none', boxShadow: 'none', backgroundImage: 'none' },
  compactGrid: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', '@media(max-width: 520px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
  compactRows: { maxHeight: 'none', overflowY: 'visible', marginTop: '6px', gap: '6px' },
  workspaceRows: { maxHeight: 'none', overflowY: 'visible', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', '@media(max-width:760px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
  compactActions: { marginTop: '6px', gap: '6px', alignItems: 'center' },
  footer: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', '& button': { whiteSpace: 'normal', overflowWrap: 'anywhere' } },
  recordSummary: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '8px' }
});
const titles: Partial<Record<RevenueIntentKey, string>> = {
  BuildAccountBrief: 'Account change and whitespace brief', MapBuyingCommittee: 'Decision rights and relationship coverage',
  GetDealRisk: 'Ranked signature threats', PrepareCustomerMeeting: 'Meeting-specific briefing and agenda',
  TrackMeetingFollowUp: 'Evidence-backed commitment tracker', ResearchCompetitivePosition: 'Competitive evidence and proof plan',
  CoachDealStrategy: 'Explainable strategy plays'
};
const commercialDefaults: ICommercialInput = { quantity: 860, termMonths: 36, discount: 14, services: 420000, probability: 0.72 };
type CommercialNumericKey = Exclude<keyof ICommercialInput, 'ramp'>;
const commercialLabels: Readonly<Record<CommercialNumericKey, string>> = {
  quantity: 'Licensed users', termMonths: 'Contract term (months)', discount: 'Discount percent', services: 'Services (USD)', probability: 'Win probability (0–1)'
};
const commercialKeys: readonly CommercialNumericKey[] = ['quantity', 'termMonths', 'discount', 'services', 'probability'];
export function commercialErrors(input: ICommercialInput): readonly string[] {
  const bounds: Readonly<Record<CommercialNumericKey, readonly [number, number]>> = {
    quantity: [1, 100000], termMonths: [1, 120], discount: [0, 100], services: [0, 100000000], probability: [0, 1]
  };
  const errors = commercialKeys.filter(key => !Number.isFinite(input[key]) || input[key] < bounds[key][0] || input[key] > bounds[key][1] ||
    ((key === 'quantity' || key === 'termMonths') && !Number.isInteger(input[key]))).map(key => `${commercialLabels[key]} must be ${bounds[key][0]}–${bounds[key][1]}${key === 'quantity' || key === 'termMonths' ? ' (whole number)' : ''}`);
  if (input.ramp && (input.ramp.length !== Math.ceil(input.termMonths / 12) || input.ramp.some(value => !Number.isFinite(value) || value < 0 || value > 100))) errors.push('Annual licensed ramp must have one 0–100 percentage per contract year (including a partial final year)');
  return errors;
}

export default function RevenueExperiences(props: IRevenueAppProps & {
  readonly committeeVisual?: React.ReactNode;
  readonly dealSession: ReturnType<typeof useDealOperationsSession>;
}): React.ReactElement {
  const styles = useStyles();
  const compact = props.displayMode !== 'fullscreen';
  const scope = resolveScope(props.properties);
  const definition = props.definition;
  const workflow = workflowFor(definition.key, scope);
  const [draft, setDraft] = React.useState<Record<string, string>>(() => workflow ? initialDraft(workflow) : {});
  const [stage, setStage] = React.useState<'draft' | 'review' | 'receipt'>('draft');
  const [confirmed, setConfirmed] = React.useState(false);
  const [receipt, setReceipt] = React.useState('');
  const [query, setQuery] = React.useState(props.properties.query || '');
  const [selected, setSelected] = React.useState(props.properties.selectedId || '');
  const [period, setPeriod] = React.useState(props.properties.period || 'current');
  const [region, setRegion] = React.useState(props.properties.region || 'all');
  const [status, setStatus] = React.useState('all');
  const [mapRegion, setMapRegion] = React.useState('na');
  const [page, setPage] = React.useState(0);
  const [fieldPage, setFieldPage] = React.useState(0);
  const [reviewPages, setReviewPages] = React.useState<readonly number[]>([0]);
  const [formView, setFormView] = React.useState<'impact' | 'fields'>('impact');
  const [analysisStage, setAnalysisStage] = React.useState(props.properties.selectedId ? 'Detail' : props.definition.key === 'DiscoverAccountOpportunity' || props.definition.key === 'ExplorePipelineQuality' && (props.properties.countryId || props.properties.mapMetric) ? 'Country' : props.definition.key === 'ExplorePipelineQuality' ? 'Health' : 'Overview');
  const returnStage = React.useRef(props.definition.key === 'DiscoverAccountOpportunity' ? 'Country' : props.definition.key === 'ExplorePipelineQuality' ? 'Health' : 'Overview');
  const [commercialStage, setCommercialStage] = React.useState('License terms');
  const [attentionState, setAttentionState] = React.useState<Readonly<Record<string, unknown>>>({});
  const onAttentionState = React.useCallback((state: Readonly<Record<string, unknown>>): void => {
    setAttentionState(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const [contextError, setContextError] = React.useState('');
  const [inlineDealState, setInlineDealState] = React.useState<Readonly<Record<string, unknown>>>({});
  const onInlineDealState = React.useCallback((state: Readonly<Record<string, unknown>>): void => {
    setInlineDealState(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const [attentionMeasure, setAttentionMeasure] = React.useState<AttentionMeasure>('value');
  const [priorityState, setPriorityState] = React.useState<Readonly<Record<string, unknown>>>({});
  const onPriorityState = React.useCallback((state: Readonly<Record<string, unknown>>): void => {
    setPriorityState(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const [flowState, setFlowState] = React.useState<Readonly<Record<string, unknown>>>({});
  const onFlowState = React.useCallback((state: Readonly<Record<string, unknown>>): void => {
    setFlowState(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const [countryState, setCountryState] = React.useState<Readonly<Record<string, unknown>>>({});
  const onCountryState = React.useCallback((state: Readonly<Record<string, unknown>>): void => {
    setCountryState(current => JSON.stringify(current) === JSON.stringify(state) ? current : state);
  }, []);
  const [followUpState, setFollowUpState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendingAction, setSendingAction] = React.useState('');
  const [followUpError, setFollowUpError] = React.useState('');
  const [rampDraft, setRampDraft] = React.useState(props.properties.ramp?.join(', ') || '');
  const [commercialDraft, setCommercialDraft] = React.useState<Readonly<Record<CommercialNumericKey, string>>>(() => ({
    quantity: String(props.properties.quantity ?? commercialDefaults.quantity),
    termMonths: String(props.properties.termMonths ?? commercialDefaults.termMonths),
    discount: String(props.properties.discount ?? commercialDefaults.discount),
    services: String(props.properties.services ?? commercialDefaults.services),
    probability: String(props.properties.probability ?? commercialDefaults.probability)
  }));
  const commercial: ICommercialInput = {
    quantity: Number(commercialDraft.quantity), termMonths: Number(commercialDraft.termMonths), discount: Number(commercialDraft.discount),
    services: Number(commercialDraft.services), probability: Number(commercialDraft.probability),
    ramp: rampDraft.trim() ? rampDraft.split(',').map(value => value.trim() ? Number(value) : NaN) : undefined
  };
  const pricingErrors = [...commercialErrors(commercial), ...commercialKeys.filter(key => !commercialDraft[key].trim()).map(key => `${commercialLabels[key]} is required`)];
  const errors = workflow ? workflowErrors(definition.key, scope, workflow, draft) : [];
  const calculation = workflow && !errors.length ? workflowCalculation(definition.key, scope, draft) : '';
  const isAttention = definition.key === 'ExploreDealAttention';
  const isPriorities = definition.key === 'GetMyRevenuePriorities';
  const isDealWorkflow = definition.key === 'SubmitDealRequest' || definition.key === 'ReviewDealApproval';
  const isFlow = definition.key === 'ExplorePipelineFlow' || definition.key === 'ExploreApprovalFlow';
  const flow = isFlow ? revenueFlow(definition.key === 'ExplorePipelineFlow' ? 'pipeline' : 'approval', period, region) : undefined;
  const isPortfolio = definition.key === 'ExplorePipelineQuality' || definition.key === 'DiscoverAccountOpportunity' || isAttention || isPriorities;
  const stagedPortfolio = (compact || props.workspaceFocus === true) && isPortfolio;
  const isCountryView = stagedPortfolio && (definition.key === 'DiscoverAccountOpportunity' || definition.key === 'ExplorePipelineQuality') && analysisStage === 'Country';
  const opportunities = OPPORTUNITIES.filter(item => {
    const accountScope = definition.key === 'DiscoverAccountOpportunity' && props.properties.accountId !== undefined && item.accountId !== scope.account?.id;
    const account = resolveScope({ opportunityId: item.id }).account;
    return !accountScope && (region === 'all' || account?.region === region) &&
      (period === 'all' || (period === 'current' ? item.quarterOffset === 0 : period === 'next' && item.quarterOffset === 1));
  });
  const portfolioRows: readonly IBusinessRow[] = opportunities.map(item => ({
    id: item.id, title: `${item.name} · ${currency(item.value)}`,
    detail: `${item.stage}; ${Math.round(item.probability * 100)}% seller probability; ${currency(item.value * item.probability)} weighted. ${scopedEvidence(resolveScope({ opportunityId: item.id })).length} evidence records. Quarter offset ${item.quarterOffset}.`,
    source: 'Deterministic opportunity graph · probability is seller judgment', kind: 'source fact / judgment'
  }));
  const capabilityRows: readonly IBusinessRow[] = INTENTS.filter(item => item.operation !== 'education' && `${item.title} ${item.outcome}`.toLowerCase().includes(query.toLowerCase())).map(item => ({
    id: item.key, title: item.title, detail: `${item.outcome} Try: “${item.prompt}” ${item.excludes}`, source: 'Registered tool catalog · preview only', kind: item.operation
  }));
  const attentionCandidates = isAttention ? attentionDeals(opportunities, attentionMeasure) : [];
  const attentionRows = compact ? attentionCandidates : attentionCandidates.slice(0, 8);
  const selectedDeal = attentionRows.find(item => item.id === selected);
  const selectedScope = selectedDeal ? resolveScope({ opportunityId: selectedDeal.id }) : undefined;
  const rows = isPriorities || isFlow ? [] : definition.operation === 'education' ? capabilityRows : isAttention ? attentionRows : isPortfolio ? portfolioRows :
    analysisRows(definition.key, scope).filter(item => status === 'all' || item.title.includes(status));
  const selectedRow = rows.find(item => item.id === selected);
  const noSelection = isFlow ? !!selected && !flow?.nodes.some(item => item.id === selected) && !flow?.links.some(item => item.id === selected) : !!selected && !selectedRow;
  const unavailableAttention = compact && isAttention && noSelection;
  const pageCount = Math.max(1, Math.ceil(rows.length / 2));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(currentPage * 2, currentPage * 2 + 2);
  const detailVisible = (compact || stagedPortfolio) && !isAttention && !!selectedRow && analysisStage === 'Detail';
  const visibleRows = compact || stagedPortfolio ? unavailableAttention ? [] : isAttention && selectedDeal ? [selectedDeal] : isPriorities || isFlow || workflow || isDealWorkflow || definition.key === 'SimulateCommercialOffer' ? [] : detailVisible ? [selectedRow] : analysisStage === 'Records' ? pageRows : [] : rows;
  const reviewValuePages = workflow ? workflowReviewPages(workflow.fields, draft) : [];
  const fieldCount = Math.max(1, stage === 'draft' ? Math.ceil((workflow?.fields.length || 0) / 3) : reviewValuePages.length);
  const currentFieldPage = Math.min(fieldPage, fieldCount - 1);
  const visibleFields = workflow ? (compact ? stage === 'draft' ? workflow.fields.slice(currentFieldPage * 3, currentFieldPage * 3 + 3) : reviewValuePages[currentFieldPage].map(item => item.field) : workflow.fields) : [];
  const businessImpact = workflow ? inlineBusinessChart({ definition, scope, rows: [], draft, stage, onSelect: () => undefined }) : undefined;
  const impactFields = businessImpact ? Object.keys(businessImpact).filter(key => key !== 'kind' && key !== 'errors').map(key => `businessImpact.${key}`) : [];
  const scopeErrors = definition.operation === 'education' || definition.key === 'ReviewDealApproval' || isPriorities || isFlow ? [] : scope.errors;
  const inlineRequest = contextRecord(inlineDealState.selectedRequest);
  const inlineDraft = contextRecord(inlineDealState.draft || inlineRequest.draft);
  const inlineScope = typeof inlineDraft.accountId === 'string' ? resolveScope({ accountId: inlineDraft.accountId }) : undefined;
  const missingRequest = definition.key === 'ReviewDealApproval' && props.properties.requestId !== undefined && !inlineDealState.selectedRequest;
  const availableActions = isFlow ? ['Select a value-flow node or ribbon', 'Model assumptions', 'Back to value flow', 'Previous connections', 'Next connections'] : workflow ? stage === 'receipt' ? ['Reset draft'] : stage === 'review' ? ['Edit draft', 'Explicitly confirm session decision'] : ['Edit business fields', 'Review impact', 'Review draft'] :
    definition.key === 'SimulateCommercialOffer' ? ['Change commercial inputs', 'Reset scenario'] : ['Select evidence', 'Inspect source'];
  const stageActions = !compact && !stagedPortfolio ? [] : workflow ? [...(currentFieldPage > 0 ? ['Previous fields'] : []), ...(currentFieldPage + 1 < fieldCount ? ['Next fields'] : [])] :
    isAttention ? selectedDeal ? ['Back to attention catalog', 'Deal facts', 'Buyer coverage', 'Evidence'] : ['Rank by open value', 'Rank by seller-unweighted value', attentionState.catalogView === 'Records' ? 'Value and evidence overview' : 'Show ranked deals', ...(attentionState.catalogView === 'Records' && currentPage > 0 ? ['Previous deals'] : []), ...(attentionState.catalogView === 'Records' && currentPage + 1 < pageCount ? ['Next deals'] : [])] :
    isPriorities ? ['Next actions', 'Pipeline', 'Outlook', 'Close plan'] :
    isDealWorkflow ? inlineDealState.view === 'deal-intake' ? ['01  Deal story', '02  Commercials', '03  Evidence', '04  Exact review', 'Back to requests'] : ['Inbox', 'Requests', 'Terms', 'Evidence', 'Decision', 'Decision trail'] :
    definition.key === 'SimulateCommercialOffer' ? ['License terms', 'Delivery and ramp', 'Economics'] :
    detailVisible ? ['Back to overview', 'Business overview'] : isPortfolio ? ['Portfolio health', 'Country spend', 'Country opportunity', 'Evidence records', 'Change scope'] : analysisStage === 'Records' ? ['Business overview', ...(currentPage > 0 ? ['Previous records'] : []), ...(currentPage + 1 < pageCount ? ['Next records'] : [])] : [definition.operation === 'education' ? 'Explore scenarios' : 'Evidence records'];
  const snapshot: IModelContextSnapshot = {
    intent: definition.key, displayMode: props.displayMode || 'inline', route: definition.route,
    selectedEntityId: scopeErrors.length ? JSON.stringify(props.properties) : isCountryView ? String(countryState.selectedCountryId || `countries:${period}:${region}`) : isFlow ? selected || `${definition.key}:${period}:${region}` : isDealWorkflow ? inlineDealState.view === 'deal-intake' ? 'new-request' : String(inlineDealState.receiptId || inlineDealState.selectedId || 'new-request') : selected || (definition.operation === 'education' ? 'catalog' : definition.key === 'ExplorePipelineQuality' || isAttention || isPriorities ? `portfolio:${period}:${region}` : scope.opportunity?.id || ''),
    workflowStage: scopeErrors.length || noSelection || missingRequest || flow?.errors.length || isCountryView && countryState.issueCount ? 'no-match' : isDealWorkflow ? String(inlineDealState.stage || (definition.key === 'SubmitDealRequest' ? 'draft' : 'queue')) : workflow ? stage : 'analysis',
    scopeLabel: isCountryView ? `Country ${countryState.selectedCountryId || 'portfolio'} / ${period} / ${region} / ${countryState.metric || 'opportunity'}` : isFlow ? `${definition.title} / ${period} / ${region}` : isPriorities ? `Megan Bowen's owned book / ${period} / ${region}` : isDealWorkflow ? `${inlineScope?.account?.name || 'Approval request'} ${inlineDealState.receiptId || inlineRequest.id || 'draft'}` : selectedScope ? `${selectedScope.account?.name} ${selectedDeal?.id}` : isPortfolio ? `Portfolio ${period} ${region}` : `${scope.account?.name || 'Requested scope'} ${scope.opportunity?.id || ''}`,
    summary: isFlow ? `${definition.title}: USD planning allocations; ${flowState.stage || 'Value flow'}; stage completion is not final approval.` : scopeErrors.length ? scopeErrors.join('; ') : `${definition.title} · ${definition.operation === 'education' ? 'Catalog' : isPortfolio ? `Portfolio ${period} ${region}` : isDealWorkflow ? inlineScope?.account?.name || 'Approval requests' : scope.account?.name} · ${isDealWorkflow ? inlineDealState.stage || 'draft' : workflow ? stage : 'analysis'}${selectedRow ? ` · ${selectedRow.title}: ${selectedRow.detail}` : ''}${noSelection ? ` · No visible record matches ${selected}` : ''}`,
    topic: { question: definition.question, outcome: definition.outcome, operation: definition.operation },
    availableActions: scopeErrors.length ? ['Invoke with a known, consistent scope'] : unavailableAttention ? ['Clear selection', 'Back to attention catalog'] : [...availableActions, ...stageActions],
    workspaceState: props.workspaceState,
    referenceWorkspace: props.visibleWorkspaceLens && !scopeErrors.length ? {
      lens: props.visibleWorkspaceLens, selectedRegion: props.referenceRegion,
      selectedEvidence: HERO_EVIDENCE.find(item => item.id === props.referenceEvidenceId),
      semantics: 'Fixed illustrative reference metrics, not live CRM or the specialist draft/scenario.'
    } : null,
    requestedScope: props.properties, resolvedScope: scopeErrors.length || definition.operation === 'education' ? null : isCountryView ? { period, region, countryId: countryState.selectedCountryId } : isFlow ? { period, ...(definition.key === 'ExplorePipelineFlow' ? { region } : { requestId: flow?.approvalRequestId, requestLevelReview: true }) } : isDealWorkflow ? { accountId: inlineDraft.accountId, requestId: inlineDealState.receiptId || inlineRequest.id } : definition.key === 'ExplorePipelineQuality' || isAttention || isPriorities ? { period, region, accountId: selectedScope?.account?.id, opportunityId: selectedDeal?.id } : { accountId: scope.account?.id, opportunityId: scope.opportunity?.id, meetingId: scope.meeting?.id, proposalId: scope.proposal?.id, exceptionId: scope.exception?.id },
    visibleRecords: scopeErrors.length ? [] : isCountryView ? countryState.visibleOpportunities || [] : isAttention ? selectedDeal ? [selectedDeal] : attentionState.catalogRecords || [] : isFlow ? flowState.visibleRecords || [] : isPriorities ? priorityState.priorities || [] : visibleRows, selection: selected, period, region, status, query, mapRegion,
    visibleRecordCount: isCountryView ? Array.isArray(countryState.visibleOpportunities) ? countryState.visibleOpportunities.length : 0 : isAttention ? selectedDeal ? 1 : Array.isArray(attentionState.catalogRecords) ? attentionState.catalogRecords.length : 0 : isFlow ? Array.isArray(flowState.visibleRecords) ? flowState.visibleRecords.length : 0 : isPriorities ? Array.isArray(priorityState.priorities) ? priorityState.priorities.length : 0 : scopeErrors.length ? 0 : visibleRows.length,
    inlineStage: compact || stagedPortfolio ? {
      label: isCountryView ? countryState.stage || 'country-overview' : isFlow ? flowState.stage || 'Sankey' : isDealWorkflow ? inlineDealState.facet : isAttention ? attentionState.facet : isPriorities ? priorityState.stage : workflow ? stage === 'draft' && formView === 'impact' ? 'Draft business impact' : stage === 'draft' ? `draft / fields ${currentFieldPage * 3 + 1}–${Math.min((currentFieldPage + 1) * 3, workflow.fields.length)}` : `${stage} / exact value page ${currentFieldPage + 1} of ${fieldCount}` : definition.key === 'SimulateCommercialOffer' ? commercialStage : detailVisible ? 'Source detail' : analysisStage,
      page: isCountryView ? countryState.page || 1 : isFlow ? flowState.page || 1 : isDealWorkflow ? inlineDealState.page : workflow ? stage === 'draft' && formView === 'impact' ? 1 : currentFieldPage + 1 : isAttention ? attentionState.page || currentPage + 1 : isPriorities ? priorityState.page : detailVisible || definition.key === 'SimulateCommercialOffer' || analysisStage !== 'Records' ? 1 : currentPage + 1,
      pageCount: isCountryView ? countryState.pageCount || 1 : isFlow ? flowState.pageCount || 1 : isDealWorkflow ? inlineDealState.pageCount : workflow ? stage === 'draft' && formView === 'impact' ? 1 : fieldCount : isAttention ? attentionState.pageCount : isPriorities ? priorityState.pageCount : detailVisible || definition.key === 'SimulateCommercialOffer' || analysisStage !== 'Records' ? 1 : pageCount,
      recordCount: rows.length,
      catalogPage: !workflow && !isAttention && !isPriorities && !isDealWorkflow ? currentPage + 1 : undefined,
      reviewedFieldPages: workflow && stage !== 'draft' ? reviewPages.map(value => value + 1) : undefined,
      visibleFields: isCountryView ? countryState.visibleFields : isFlow ? flowState.visibleFields || ['nodes', 'links', 'value', 'semantics'] : isDealWorkflow ? inlineDealState.visibleFields : isAttention ? attentionState.visibleFields : isPriorities ? priorityState.visibleFields : workflow ? stage === 'draft' && formView === 'impact' ? impactFields : visibleFields.map(item => item.name) : definition.key === 'SimulateCommercialOffer' ? commercialStage === 'License terms' ? ['quantity', 'termMonths', 'discount', 'contractValue', 'grossMargin'] : commercialStage === 'Delivery and ramp' ? ['services', 'probability', 'ramp', 'contractValue', 'grossMargin'] : ['contractValue', 'arr', 'grossMargin', 'weightedForecast', 'authority'] : detailVisible ? ['id', 'title', 'kind', 'detail', 'source'] : analysisStage === 'Records' ? ['id', 'title', 'kind', 'source'] : ['items', 'metrics', 'source', 'semantics'],
      chart: isCountryView ? countryState.chart : isFlow ? flowState.chart : isAttention ? attentionState.chart : isPriorities ? priorityState.chart : isDealWorkflow ? inlineDealState.chart : workflow ? stage === 'draft' && formView === 'impact' ? businessImpact : null : definition.key === 'SimulateCommercialOffer' ? { kind: 'commercial-margin', inputs: commercialDraft, result: pricingErrors.length ? null : calculateCommercialOffer(commercial) } : detailVisible || analysisStage === 'Records' || analysisStage === 'Scope' ? null : inlineBusinessChart({ definition, scope, rows, draft, stage, status, query, onSelect: () => undefined })
    } : undefined,
    selectedRecord: isFlow ? flowState.selectedDetail : selectedDeal && selectedScope ? { ...selectedDeal, account: selectedScope.account, contacts: scopedContacts(selectedScope), evidence: scopedEvidence(selectedScope) } : selectedRow || null,
    attention: isAttention ? {
      ...attentionState, view: unavailableAttention ? 'unavailable-selection' : selectedDeal ? 'deal-detail' : 'catalog', measure: attentionMeasure, displayedCount: compact ? visibleRows.length : selectedDeal ? 1 : attentionRows.length,
      candidateCount: attentionCandidates.length, filteredOpenValue: opportunities.reduce((sum, item) => sum + item.value, 0),
      catalogSummary: (unavailableAttention ? [] : compact ? attentionRows.slice(currentPage * 2, currentPage * 2 + 2) : attentionRows).map(item => ({ id: item.id, name: item.title, openValue: item.opportunity.value, weightedValue: item.weightedValue, exposure: item.exposure, flags: item.flags })),
      semantics: 'Deterministic value ranking, not predicted loss. Catalog summary is background comparison when a single detail is visible. Seller probability is judgment; missing proof stays unknown.'
    } : undefined,
    inlineDealWorkflow: isDealWorkflow ? inlineDealState : undefined,
    personalPriorities: isPriorities ? { ...priorityState, priorities: undefined } : undefined,
    revenueFlow: isFlow ? { ...flow, ...flowState, visibleRecords: undefined } : undefined,
    countryMap: isCountryView ? countryState : undefined,
    supportingBusinessEvidence: workflow?.evidence,
    businessImpact,
    visibleReviewValues: workflow && stage !== 'draft' && compact ? reviewValuePages[currentFieldPage].map(item => ({ name: item.field.name, value: item.value, part: item.part, partCount: item.partCount })) : undefined,
    draft: workflow && !scopeErrors.length ? draft : undefined, calculation: scopeErrors.length ? '' : calculation, receipt: scopeErrors.length ? '' : receipt, confirmed,
    commercial: definition.key === 'SimulateCommercialOffer' && !scopeErrors.length ? { inputs: { ...commercialDraft, ramp: rampDraft }, errors: pricingErrors, result: pricingErrors.length ? null : calculateCommercialOffer(commercial) } : undefined,
    validationErrors: scopeErrors.length ? scopeErrors : isCountryView ? countryState.issues || [] : isFlow ? [...(flow?.errors || []), ...(noSelection ? [`No visible Sankey selection matches ${selected}`] : [])] : isDealWorkflow ? inlineDealState.validationErrors || [] : [...errors, ...(definition.key === 'SimulateCommercialOffer' ? pricingErrors : []), ...(noSelection ? [`No visible record matches ${selected}`] : [])],
    semantics: 'Offline session only. No CRM writes, approvals, customer contact or delivery authorization.'
  };
  const suggestedActions = getCopilotActions(definition, snapshot);
  const priority = Array.isArray(priorityState.priorities) ? priorityState.priorities[0] as IRevenuePriority | undefined : undefined;
  const focusRow = unavailableAttention ? undefined : selectedRow || pageRows[0];
  const focusScope = isPortfolio && !isPriorities && focusRow ? resolveScope({ opportunityId: focusRow.id }) : undefined;
  let primaryContext: IModelContextSnapshot = priority ? {
    ...snapshot, selectedEntityId: priority.id, selection: priority.opportunityId || '', selectedRecord: priority,
    resolvedScope: { accountId: priority.accountId, opportunityId: priority.opportunityId, requestId: priority.requestId }
  } : focusScope && focusRow ? {
    ...snapshot, selectedEntityId: focusRow.id, selection: focusRow.id, selectedRecord: focusRow,
    resolvedScope: { accountId: focusScope.account?.id, opportunityId: focusScope.opportunity?.id },
    scopeLabel: `${focusScope.account?.name} ${focusRow.id}`
  } : snapshot;
  let primaryAction = priority ? createCopilotHandoff(priority.target, primaryContext) : getCopilotActions(definition, primaryContext)[2];
  if (definition.operation === 'education' && focusRow) {
    const capability = INTENTS.find(item => item.key === focusRow.id);
    if (capability) {
      primaryContext = { ...primaryContext, selection: capability.key, selectedEntityId: capability.key, selectedRecord: focusRow };
      primaryAction = createCopilotHandoff(capability.key, primaryContext);
    }
  }
  if (definition.key === 'SubmitDealRequest' && !inlineDealState.receiptId || definition.key === 'ReviewDealApproval') primaryAction = {
    ...suggestedActions[1], label: definition.key === 'SubmitDealRequest' ? `Check ${inlineScope?.account?.name || 'this deal'} ${inlineDealState.formStep || 'draft'}` : `Discuss ${inlineRequest.id || 'the inbox'} / ${inlineDealState.facet || 'independent review'}`
  };
  if (definition.key === 'SimulateCommercialOffer' && !rampDraft.trim()) primaryAction = suggestedActions.find(action => action.handoff?.intent === 'SubmitDealRequest') || primaryAction;
  if (compact) {
    if (definition.key === 'MapBuyingCommittee') primaryAction = createCopilotHandoff('GetDealRisk', primaryContext);
    else if (definition.key === 'GetDealRisk') primaryAction = createCopilotHandoff('SimulateCommercialOffer', primaryContext);
    else if (definition.key === 'ReviewDealApproval') {
      const events = Array.isArray(inlineRequest.events) ? inlineRequest.events : [];
      const lastDecision = contextRecord(events[events.length - 1]);
      if (typeof inlineDealState.receiptId === 'string' && inlineDealState.receiptId === inlineRequest.id && lastDecision.decision === 'approved') {
        primaryAction = createCopilotHandoff('GetMyRevenuePriorities', primaryContext);
      }
    }
  }
  if (definition.key === 'ExplorePipelineFlow' && selected && !noSelection) primaryAction = createCopilotHandoff('ExploreDealAttention', primaryContext);
  if (isCountryView) {
    primaryContext = { ...snapshot, resolvedScope: { period, region, countryId: countryState.selectedCountryId }, selectedRecord: countryState.selectedCountryDetail };
    primaryAction = createCopilotHandoff(definition.key === 'DiscoverAccountOpportunity' ? 'ExplorePipelineQuality' : 'DiscoverAccountOpportunity', primaryContext);
  }
  if (props.workspaceFocus && !isDealWorkflow) {
    const workspaceAction = fullscreenNextAction(fullscreenTask(definition.key, props.properties), snapshot);
    if (workspaceAction) primaryAction = workspaceAction;
  }
  if (!compact) {
    primaryContext = snapshot;
    primaryAction = createCopilotSummary(definition, snapshot);
  }
  const primaryEntity = !compact ? undefined : isCountryView ? countryState.selectedCountryId : isFlow ? definition.key === 'ExploreApprovalFlow' ? flow?.approvalRequestId : selected || undefined : definition.operation === 'education' ? undefined : unavailableAttention ? selected : priority?.opportunityId || priority?.requestId || (isDealWorkflow ? inlineRequest.id || inlineScope?.account?.id : focusScope?.opportunity?.id || scope.opportunity?.id);
  const primaryLabel = `Continue with Copilot: ${primaryAction.handoff ? INTENTS.find(item => item.key === primaryAction.handoff?.intent)?.title : primaryAction.label}${primaryEntity ? ` · ${primaryEntity}` : ''}`;
  const visibleSnapshot: IModelContextSnapshot = {
    ...snapshot, availableActions: [...snapshot.availableActions, ...suggestedActions.filter(action => !action.disabledReason).map(action => action.label), ...(!primaryAction.disabledReason ? [primaryLabel] : [])]
  };
  const serialized = JSON.stringify(visibleSnapshot);
  const updateContext = props.onUpdateModelContext;
  React.useEffect(() => {
    setFollowUpState(current => current === 'sent' ? 'idle' : current);
  }, [analysisStage, countryState.metric, countryState.selectedCountryId, draft, period, query, region, selected, stage, status]);
  React.useEffect(() => {
    let active = true;
    const committed: IModelContextSnapshot = JSON.parse(serialized);
    updateContext(committed).then(() => { if (active) setContextError(''); }).catch(() => { if (active) setContextError('Visible context could not be shared with Copilot. Change a field to retry.'); });
    return () => { active = false; };
  }, [serialized, updateContext]);

  async function sendSuggestedAction(action: ICopilotAction, context: IModelContextSnapshot = visibleSnapshot): Promise<void> {
    setFollowUpState('sending'); setSendingAction(action.id); setFollowUpError('');
    try {
      const accepted = await props.onSendFollowUp(action.prompt, {
        ...context,
        discussion: { actionId: action.id, label: action.label, topic: action.label, sourceQuestion: definition.question, prompt: action.prompt, responseMode: action.handoff ? 'component' : 'text', handoff: action.handoff || null }
      });
      setFollowUpState(accepted ? 'sent' : 'error');
      if (!accepted) setFollowUpError('Copilot did not accept the message. Your visible values are unchanged; retry the suggested action.');
    } catch (error) {
      setFollowUpState('error');
      setFollowUpError(error instanceof Error ? error.message : 'Context and the suggested action could not be sent to Copilot. Retry the action.');
    }
  }
  async function openPriority(priority: IRevenuePriority): Promise<void> {
    const context: IModelContextSnapshot = {
      ...visibleSnapshot, selectedEntityId: priority.id, selection: priority.opportunityId || '',
      selectedRecord: priority, resolvedScope: { accountId: priority.accountId, opportunityId: priority.opportunityId, requestId: priority.requestId },
      availableActions: [...visibleSnapshot.availableActions, priority.actionLabel],
      summary: `${visibleSnapshot.summary} / selected priority: ${priority.title}. ${priority.detail}`
    };
    const action = createCopilotHandoff(priority.target, context, priority.actionLabel);
    await sendSuggestedAction({ ...action, id: `priority-${priority.id}` }, context);
  }
  async function openCapability(item: IBusinessRow): Promise<void> {
    const capability = INTENTS.find(intent => intent.key === item.id);
    if (!capability) {
      setFollowUpState('error');
      setFollowUpError(`No registered capability matches ${item.id}. Refresh the capability catalog before retrying.`);
      return;
    }
    const context: IModelContextSnapshot = {
      ...visibleSnapshot, selectedEntityId: capability.key, selection: capability.key, selectedRecord: item,
      workflowStage: 'analysis', validationErrors: [], summary: `Selected capability: ${capability.title}. ${capability.outcome}`,
      availableActions: [...visibleSnapshot.availableActions, `Open ${capability.title} in Copilot`]
    };
    setSelected(capability.key);
    await sendSuggestedAction(createCopilotHandoff(capability.key, context, `Open ${capability.title} in Copilot`), context);
  }
  function portfolioFilters(): React.ReactElement {
    return <div className={mergeClasses(styles.grid, compact && styles.compactGrid)}>
      <label className={styles.field}>Quarter scope<select className={styles.select} aria-label="Quarter scope" value={period} onChange={event => { setPeriod(event.target.value); setPage(0); }}>{['current', 'next', 'all', ...(['current', 'next', 'all'].indexOf(period) < 0 ? [period] : [])].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className={styles.field}>Region<select className={styles.select} aria-label="Region" value={region} onChange={event => { setRegion(event.target.value); setPage(0); }}>{['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America', ...(['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America'].indexOf(region) < 0 ? [region] : [])].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>;
  }
  function reset(): void {
    if (workflow) setDraft(initialDraft(workflow));
    setStage('draft'); setConfirmed(false); setReceipt(''); setFieldPage(0); setReviewPages([0]); setFormView('impact');
  }
  function inspect(id: string): void { returnStage.current = analysisStage; setSelected(id); setAnalysisStage('Detail'); }
  function pagination(): React.ReactElement {
    return <div className={mergeClasses(styles.actions, styles.compactActions)}><Button size="small" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous records</Button><span>Page {currentPage + 1} / {pageCount}</span><Button size="small" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next records</Button></div>;
  }
  function fieldPagination(): React.ReactElement | null {
    if (fieldCount < 2) return null;
    return <div className={mergeClasses(styles.actions, styles.compactActions)}><Button size="small" disabled={currentFieldPage === 0} onClick={() => { setFieldPage(currentFieldPage - 1); setConfirmed(false); }}>Previous fields</Button><span>Fields page {currentFieldPage + 1} / {fieldCount}</span><Button size="small" disabled={currentFieldPage + 1 >= fieldCount} onClick={() => { const next = currentFieldPage + 1; setFieldPage(next); setReviewPages(current => current.indexOf(next) >= 0 ? current : [...current, next]); setConfirmed(false); }}>Next fields</Button></div>;
  }
  function compactRecords(): React.ReactElement {
    return <div className={mergeClasses(styles.rows, styles.compactRows)}>
      {noSelection && <p role="status" className={styles.error}>No visible record matches {selected}. No default was substituted. <Button size="small" onClick={() => setSelected('')}>Clear selection</Button></p>}
      {!rows.length && <p role="status">No matching source records. Missing evidence is not a positive finding.</p>}
      {detailVisible ? <article className={styles.row}><Button size="small" onClick={() => setAnalysisStage(returnStage.current)}>Back to overview</Button><h3>{selectedRow.title}</h3><Badge appearance="tint">{selectedRow.kind}</Badge><p>{selectedRow.detail}</p><p className={styles.muted}>{selectedRow.id} · {selectedRow.source}</p></article> : <>
        {pageRows.map(item => <article key={item.id} className={styles.row}><div className={styles.recordSummary}><div><h3>{item.title}</h3><p className={styles.muted}>{item.id} · {item.kind}</p></div><Button size="small" aria-pressed={selected === item.id} onClick={() => inspect(item.id)}>Inspect {item.id}</Button></div>
          {definition.operation === 'education' && <Button size="small" icon={<Chat20Regular />} disabled={followUpState === 'sending'} data-copilot-launch={item.id} onClick={() => openCapability(item)}>Open {item.title} in Copilot</Button>}
        </article>)}{pagination()}
      </>}
    </div>;
  }
  function countryExperience(): React.ReactElement {
    return <CountryRevenueExperience opportunities={opportunities} period={period} region={region}
      initialCountryId={typeof countryState.selectedCountryId === 'string' ? countryState.selectedCountryId : props.properties.countryId}
      initialMetric={countryState.metric === 'opportunity' || countryState.metric === 'spend' ? countryState.metric : props.properties.mapMetric || (definition.key === 'ExplorePipelineQuality' ? 'spend' : 'opportunity')}
      compact={compact && !props.workspaceFocus} onStateChange={onCountryState} onInspectOpportunity={inspect}
      onScopeChange={(nextPeriod, nextRegion) => { setPeriod(nextPeriod); setRegion(nextRegion); setPage(0); }}/>;
  }
  function compactAnalysis(): React.ReactElement {
    if (analysisStage === 'Detail' || analysisStage === 'Records') return <><Button size="small" onClick={() => setAnalysisStage(definition.key === 'ExplorePipelineQuality' ? 'Health' : definition.key === 'DiscoverAccountOpportunity' ? 'Country' : 'Overview')}>Business overview</Button>{compactRecords()}</>;
    if (analysisStage === 'Scope') return <>{portfolioFilters()}{noSelection && <p role="status">No visible record matches {selected}. <Button size="small" onClick={() => setSelected('')}>Clear selection</Button></p>}<p>Change the scope, then return to its business view. No records are substituted.</p><Button size="small" onClick={() => setAnalysisStage(definition.key === 'DiscoverAccountOpportunity' ? 'Country' : 'Health')}>Show scoped view</Button></>;
    if (analysisStage === 'Country') return countryExperience();
    return <><InlineBusinessVisual definition={definition} scope={scope} rows={rows} draft={draft} stage={stage} status={status} query={query} onSelect={inspect}/><Button size="small" onClick={() => setAnalysisStage('Records')}>{definition.operation === 'education' ? 'Explore scenarios' : 'Evidence records'}</Button></>;
  }
  function compactCommercial(): React.ReactElement {
    const result = pricingErrors.length ? undefined : calculateCommercialOffer(commercial);
    const keys = commercialStage === 'License terms' ? commercialKeys.slice(0, 3) : commercialKeys.slice(3);
    return <>
      <div className={mergeClasses(styles.actions, styles.compactActions)} aria-label="Commercial scenario stages">{['License terms', 'Delivery and ramp', 'Economics'].map(label => <Button size="small" key={label} aria-pressed={commercialStage === label} onClick={() => setCommercialStage(label)}>{label}</Button>)}</div>
      <h2 className={styles.heading}>Protected-margin commercial laboratory</h2>
      {commercialStage !== 'Economics' ? <>
        <div className={mergeClasses(styles.grid, styles.compactGrid)}>{keys.map(key => <label className={styles.field} key={key}>{commercialLabels[key]}<Input type="number" aria-label={commercialLabels[key]} value={commercialDraft[key]} onChange={(_, data) => setCommercialDraft({ ...commercialDraft, [key]: data.value })} /></label>)}</div>
        {commercialStage === 'Delivery and ramp' && <><label className={styles.field}>Annual licensed ramp percent (comma-separated)<Input aria-label="Annual licensed ramp percent (comma-separated)" placeholder="Blank = 100% each year" value={rampDraft} onChange={(_, data) => setRampDraft(data.value)} /></label><Button size="small" onClick={() => { setCommercialDraft({ ...commercialDraft, termMonths: '36' }); setRampDraft('60, 80, 100'); }}>Model 60/80/100% ramp</Button></>}
      </> : <>
        <dl className={styles.definition}><dt>Contract / ARR</dt><dd>{result ? `${currency(result.contractValue)} / ${currency(result.arr)}` : 'Correct inputs'}</dd><dt>Seller-weighted TCV</dt><dd>{result ? currency(result.weightedForecast) : 'Not calculated'}</dd><dt>Required authority</dt><dd>{result?.authority || 'Not calculated'} / never approval</dd></dl>
        <p>$1,450/user/year. Subscription delivery cost 22% of list; services 62%. Ramp scales licensed revenue and cost; ARR is full-run-rate. Probability weights TCV.</p>
      </>}
      {pricingErrors.length ? <div role="alert" className={styles.error}>{pricingErrors.map(error => <p key={error}>{error}</p>)}</div> : result && <>
        <D3CommercialContour compact={!props.workspaceFocus} input={commercial} />
        <p><strong>{currency(result.contractValue)} TCV · {result.grossMargin.toFixed(1)}% margin</strong> / {result.grossMargin < 68 ? 'below' : 'above'} 68% floor</p>
        {commercialStage !== 'Economics' && <p className={styles.muted}>{result.authority} required, not approval.</p>}
      </>}
      <Button size="small" onClick={() => { setRampDraft(props.properties.ramp?.join(', ') || ''); setCommercialDraft({ quantity: String(props.properties.quantity ?? commercialDefaults.quantity), termMonths: String(props.properties.termMonths ?? commercialDefaults.termMonths), discount: String(props.properties.discount ?? commercialDefaults.discount), services: String(props.properties.services ?? commercialDefaults.services), probability: String(props.properties.probability ?? commercialDefaults.probability) }); }}>Reset scenario</Button>
    </>;
  }
  function compactWorkflow(): React.ReactElement | null {
    if (!workflow) return null;
    return <>
      <h2 className={styles.heading}>{workflow.heading}</h2>
      {stage !== 'draft' && <p className={styles.muted}>{workflow.evidence}</p>}
      <Badge appearance="tint">{stage === 'draft' ? '1 · Draft / evidence' : stage === 'review' ? '2 · Review actual values' : '3 · Session receipt'}</Badge>
      {stage === 'draft' ? <>
        <div className={mergeClasses(styles.actions, styles.compactActions)}><Button size="small" aria-pressed={formView === 'impact'} onClick={() => setFormView('impact')}>Review impact</Button><Button size="small" aria-pressed={formView === 'fields'} onClick={() => setFormView('fields')}>Edit business fields</Button></div>
        {formView === 'impact' ? <InlineBusinessVisual definition={definition} scope={scope} rows={[]} draft={draft} stage={stage} onSelect={() => undefined}/> :
        <div className={mergeClasses(styles.grid, styles.compactGrid)}>{visibleFields.map(item => <label className={styles.field} key={item.name}>{item.label}{item.options ? <select className={styles.select} aria-label={item.label} value={draft[item.name]} onChange={event => { setDraft({ ...draft, [item.name]: event.target.value }); setConfirmed(false); setReviewPages([0]); }}>{item.options.map(value => <option key={value}>{value}</option>)}</select> : <Input aria-label={item.label} type={item.numeric ? 'number' : 'text'} maxLength={item.numeric ? undefined : 1000} value={draft[item.name]} onChange={(_, data) => { setDraft({ ...draft, [item.name]: data.value }); setConfirmed(false); setReviewPages([0]); }} />}</label>)}</div>}
      </> : <dl className={styles.definition}>{reviewValuePages[currentFieldPage].map(item => <React.Fragment key={`${item.field.name}-${item.part}`}><dt>{item.field.label}{item.partCount > 1 && ` / part ${item.part} of ${item.partCount}`}</dt><dd>{item.value}</dd></React.Fragment>)}</dl>}
      {(stage !== 'draft' || formView === 'fields') && fieldPagination()}
      {calculation && (stage !== 'draft' || formView === 'fields') && <p>{calculation}</p>}
      {!!errors.length && <div role="alert" className={styles.error}>{errors.map(error => <p key={error}>{error}</p>)}</div>}
      {stage === 'review' && <><p>Review every field page. Session-only {definition.operation === 'review' ? 'recommendation' : 'draft'}, not approval or external submission.</p><Checkbox disabled={reviewPages.length < fieldCount} label="I reviewed these values and understand this is session-only" checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} /></>}
      {stage === 'receipt' && <div role="status"><h3>Session receipt {receipt}</h3><p>Actual values recorded in this mounted session. No CRM writes, real approvals, customer contact or delivery authorization.</p></div>}
      <div className={mergeClasses(styles.actions, styles.compactActions)}>{stage === 'draft' ? <Button disabled={errors.length > 0} onClick={() => { setStage('review'); setFieldPage(0); setReviewPages([0]); setConfirmed(false); }}>Review draft</Button> : stage === 'review' ? <><Button size="small" onClick={() => { setStage('draft'); setConfirmed(false); }}>Edit draft</Button><Button appearance="primary" disabled={!confirmed || errors.length > 0 || reviewPages.length < fieldCount} onClick={() => { if (confirmed && !errors.length && reviewPages.length >= fieldCount) { setReceipt(`ZDR-SESSION-${definition.key}-${Date.now()}`); setStage('receipt'); } }}>Confirm session {definition.operation === 'review' ? 'decision' : 'draft'}</Button></> : null}<Button size="small" onClick={reset}>Reset draft</Button></div>
    </>;
  }
  function selectionList(): React.ReactElement {
    return <div className={mergeClasses(styles.rows, props.workspaceFocus && styles.workspaceRows)}>
      {noSelection && <p role="status" className={styles.error}>No visible record matches {selected}. Clear selection or change filters; no default record was substituted. <Button onClick={() => setSelected('')}>Clear selection</Button></p>}
      {!rows.length && <p role="status">No matching source records. Missing evidence is not a positive finding.</p>}
      {rows.map(item => <article key={item.id} className={`${styles.row} ${selected === item.id ? styles.active : ''}`}>
        <Badge appearance="tint">{item.kind}</Badge>
        <h3>{item.title}</h3><p className={styles.detail}>{item.detail}</p><p className={styles.muted}>{item.id} · {item.source}</p>
        <Button aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>Inspect {item.id}</Button>
        {definition.operation === 'education' && <Button appearance="primary" icon={<Chat20Regular />} disabled={followUpState === 'sending'} data-copilot-launch={item.id} onClick={() => openCapability(item)}>
          {followUpState === 'sending' && sendingAction === `open-${item.id}` ? 'Sending...' : `Open ${item.title} in Copilot`}
        </Button>}
        {selected === item.id && <p role="status">Selected source detail: {item.detail} Provenance: {item.source}. No system record changed.</p>}
      </article>)}
    </div>;
  }
  return <section className={mergeClasses(styles.root, compact && styles.compact)} aria-label="Specialist business experience" data-layout={`${definition.key}-business-${stage}`}>
    <div className={mergeClasses(styles.panel, compact && styles.compactPanel, isCountryView && styles.countryPanel)}>
      {!isCountryView && <Badge appearance="tint">{definition.operation === 'education' ? 'Capability catalog' : scopeErrors.length ? 'No matching scope' : isFlow ? 'Value flow analysis' : isPriorities ? 'Owned revenue book' : isDealWorkflow ? 'Deal workflow' : definition.key === 'ExplorePipelineQuality' || isAttention ? 'Aggregate portfolio' : `${scope.account?.name} · ${scope.opportunity?.id}`}</Badge>}
      {definition.operation !== 'education' && !scopeErrors.length && !isDealWorkflow && !isFlow && !isCountryView && !compact && <p className={styles.muted}>Scope: {definition.key === 'ExplorePipelineQuality' || isAttention || isPriorities ? `${period} quarter · ${region} regions` : `${scope.opportunity?.name}${scope.meeting ? ` · meeting ${scope.meeting.id}` : ''}${scope.proposal ? ` · proposal ${scope.proposal.id}` : ''}${scope.exception ? ` · exception ${scope.exception.id}` : ''}`}</p>}
      {scopeErrors.length ? <div role="status"><h2>No matching business scope</h2>{scopeErrors.map(error => <p key={error}>{error}</p>)}<p>Invoke again with a known record. Nothing was silently substituted or submitted.</p></div> :
        isFlow && flow ? <FlowExperience compact={compact && !props.workspaceFocus} flow={flow} selectedId={selected} onSelect={setSelected} onPeriod={setPeriod} onRegion={setRegion} onStateChange={onFlowState} /> :
        isDealWorkflow ? <DealOperations compact={compact} mode={definition.key === 'SubmitDealRequest' ? 'seller' : 'reviewer'} session={props.dealSession} onStateChange={onInlineDealState} /> :
        isPriorities ? <>{portfolioFilters()}<PersonalPriorities compact={compact} period={period} region={region} onStateChange={onPriorityState} onAction={openPriority} sending={followUpState === 'sending'} pendingAction={sendingAction} /></> :
        isAttention ? <>{!unavailableAttention && portfolioFilters()}<DealAttention compact={compact} page={currentPage} onPage={setPage} onStateChange={onAttentionState} opportunities={opportunities} rows={compact ? selectedDeal ? [selectedDeal] : attentionRows.slice(currentPage * 2, currentPage * 2 + 2) : attentionRows} totalCount={attentionCandidates.length} measure={attentionMeasure} onMeasure={measure => { setAttentionMeasure(measure); setPage(0); }} selectedId={selected} onSelect={setSelected} /></> :
        definition.key === 'SimulateCommercialOffer' ? compact ? compactCommercial() : <>
          <h2 className={styles.heading}>Protected-margin commercial laboratory</h2>
          <p className={styles.muted}>Deterministic scenario · $1,450 annual list per user. Subscription delivery cost 22% of list for every licensed contract year; services cost 62%. Annual recurring revenue is the full-run-rate amount; the annual ramp scales subscription revenue and cost, including partial years. Probability weights TCV, not ARR. Authority is a routing requirement, never approval.</p>
          <div className={styles.grid}>{commercialKeys.map(key => <label className={styles.field} key={key}>{commercialLabels[key]}<Input type="number" aria-label={commercialLabels[key]} value={commercialDraft[key]} onChange={(_, data) => setCommercialDraft({ ...commercialDraft, [key]: data.value })} /></label>)}</div>
          <label className={styles.field}>Annual licensed ramp percent (comma-separated)<Input aria-label="Annual licensed ramp percent (comma-separated)" placeholder="Blank = 100% every year; three-year ramp: 60, 80, 100" value={rampDraft} onChange={(_, data) => setRampDraft(data.value)} /></label>
          <Button onClick={() => { setCommercialDraft({ ...commercialDraft, termMonths: '36' }); setRampDraft('60, 80, 100'); }}>Model 60/80/100% ramp</Button>
          {pricingErrors.length ? <div role="alert">{pricingErrors.map(error => <p key={error}>{error}</p>)}</div> : (() => {
            const result = calculateCommercialOffer(commercial);
            return <><div className={styles.grid}><div><span>Contract value</span><p className={styles.metric}>{currency(result.contractValue)}</p><span>Annual recurring revenue</span><p>{currency(result.arr)}</p></div><div><span>Gross margin</span><p className={styles.metric}>{result.grossMargin.toFixed(1)}%</p><span>Weighted forecast</span><p>{currency(result.weightedForecast)}</p></div></div>
              <Badge color={result.grossMargin < 68 ? 'danger' : 'success'}>{result.grossMargin < 68 ? 'Below 68% margin floor' : 'Above 68% margin floor'}</Badge><p>Required authority: {result.authority}. No approval has been granted.</p>
              <D3CommercialContour input={commercial} /></>;
          })()}
          <Button onClick={() => { setRampDraft(props.properties.ramp?.join(', ') || ''); setCommercialDraft({ quantity: String(props.properties.quantity ?? commercialDefaults.quantity), termMonths: String(props.properties.termMonths ?? commercialDefaults.termMonths), discount: String(props.properties.discount ?? commercialDefaults.discount), services: String(props.properties.services ?? commercialDefaults.services), probability: String(props.properties.probability ?? commercialDefaults.probability) }); }}>Reset scenario</Button>
        </> : workflow ? compact ? compactWorkflow() : <>
          <h2 className={styles.heading}>{workflow.heading}</h2><p className={styles.muted}>{workflow.evidence}</p>
          <Badge appearance="tint">{stage === 'draft' ? '1 · Draft / evidence' : stage === 'review' ? '2 · Review actual values' : '3 · Session receipt'}</Badge>
          {props.workspaceFocus && stage === 'draft' && <InlineBusinessVisual definition={definition} scope={scope} rows={[]} draft={draft} stage={stage} onSelect={setSelected}/>}
          {stage === 'draft' ? <div className={styles.grid}>{workflow.fields.map(item => <label key={item.name} className={styles.field}>{item.label}
            {item.options ? <select className={styles.select} aria-label={item.label} value={draft[item.name]} onChange={event => setDraft({ ...draft, [item.name]: event.target.value })}>{item.options.map(option => <option key={option}>{option}</option>)}</select> :
              <Input aria-label={item.label} type={item.numeric ? 'number' : 'text'} value={draft[item.name]} onChange={(_, data) => setDraft({ ...draft, [item.name]: data.value })} />}
          </label>)}</div> : <dl className={styles.definition}>{workflow.fields.map(item => <React.Fragment key={item.name}><dt>{item.label}</dt><dd>{draft[item.name]}</dd></React.Fragment>)}</dl>}
          {calculation && <p className={styles.detail}>{calculation}</p>}
          {stage === 'draft' && errors.length > 0 && <div role="alert">{errors.map(error => <p key={error} className={styles.error}>{error}</p>)}</div>}
          {stage === 'review' && <><p>Review the scope and every value above. Confirmation records a session-only {definition.operation === 'review' ? 'recommendation' : 'draft'}; it is not an approval or external submission.</p><Checkbox label="I reviewed these values and understand this is session-only" checked={confirmed} onChange={(_, data) => setConfirmed(data.checked === true)} /></>}
          {stage === 'receipt' && <div role="status"><h3>Session receipt {receipt}</h3><p>{definition.title} · {scope.opportunity?.id}{scope.meeting ? ` · ${scope.meeting.id}` : ''}{scope.proposal ? ` · ${scope.proposal.id}` : ''}{scope.exception ? ` · ${scope.exception.id}` : ''}</p><p>Actual values above recorded in this mounted session only. No CRM writes, real approvals, customer contact or delivery authorization.</p></div>}
          <div className={styles.actions}>{stage === 'draft' ? <Button appearance="primary" disabled={errors.length > 0} onClick={() => { setStage('review'); setConfirmed(false); }}>Review draft</Button> : stage === 'review' ? <><Button onClick={() => { setStage('draft'); setConfirmed(false); }}>Edit draft</Button><Button appearance="primary" disabled={!confirmed || errors.length > 0} onClick={() => { if (confirmed && !errors.length) { setReceipt(`ZDR-SESSION-${definition.key}-${Date.now()}`); setStage('receipt'); } }}>Confirm session {definition.operation === 'review' ? 'decision' : 'draft'}</Button></> : null}<Button onClick={reset}>Reset draft</Button></div>
        </> : isPortfolio ? <>
          {!isCountryView && <h2 className={styles.heading}>{definition.key === 'ExplorePipelineQuality' ? 'Evidence-weighted portfolio intervention' : 'Account growth signal discovery'}</h2>}
          {!stagedPortfolio && portfolioFilters()}
          {!stagedPortfolio && <p className={styles.metric}>{opportunities.length} opportunities · {currency(opportunities.reduce((sum, item) => sum + item.value, 0))}</p>}
          {!stagedPortfolio && <p>{definition.key === 'ExplorePipelineQuality' ? 'Intervene where buyer proof is missing; seller probability is not evidence confidence.' : 'Growth themes are discovery candidates, not created leads. Inspect an opportunity to validate scope, buyer need and timing.'}</p>}
          {stagedPortfolio ? <>
            {!(isCountryView && (countryState.stage === 'country-detail' || countryState.stage === 'recovery')) && <div className={mergeClasses(styles.actions, styles.compactActions)} style={isCountryView ? { marginTop: 0 } : undefined} aria-label="Portfolio stages">
              {definition.key === 'ExplorePipelineQuality' && <Button size="small" aria-pressed={analysisStage === 'Health'} onClick={() => setAnalysisStage('Health')}>Portfolio health</Button>}
              {!isCountryView && <Button size="small" aria-pressed={analysisStage === 'Country'} onClick={() => setAnalysisStage('Country')}>{definition.key === 'ExplorePipelineQuality' ? 'Country spend' : 'Country opportunity'}</Button>}
              {!isCountryView && <Button size="small" aria-pressed={analysisStage === 'Records'} onClick={() => setAnalysisStage('Records')}>Evidence records</Button>}
              <Button size="small" aria-pressed={analysisStage === 'Scope'} onClick={() => setAnalysisStage('Scope')}>Change scope</Button>
            </div>}
            {compactAnalysis()}
          </> : <>{definition.key === 'ExplorePipelineQuality' ? <D3PipelineQuality opportunities={opportunities} /> : <D3RevenueMap opportunities={opportunities} selectedRegion={mapRegion} onSelectRegion={setMapRegion} />}{selectionList()}</>}
        </> : definition.operation === 'education' ? <>
          <h2 className={styles.heading}>Find the right revenue action</h2><Input aria-label="Search revenue scenarios" value={query} onChange={(_, data) => { setQuery(data.value); }} />
          <p>{rows.length} matching scenarios. {compact ? 'Preview is not execution.' : 'Preview explains outcomes and routing boundaries; it does not execute the selected tool. A separate suggested action explicitly asks Copilot to open the selected component.'}</p>
          {compact ? compactAnalysis() : <><p className={styles.muted}>Connected full-screen journeys: open an operational experience, choose View in full screen, then My Deals / Submit a deal for guided intake, Commercial Desk for simulated approval and audit receipts, or Revenue Command for worldwide revenue and GTM investment analytics. No live system is changed.</p>{selectionList()}</>}
        </> : <>
          <h2 className={styles.heading}>{titles[definition.key]}</h2>
          {!compact && props.workspaceFocus && <InlineBusinessVisual definition={definition} scope={scope} rows={rows} draft={draft} stage={stage} status={status} query={query} onSelect={setSelected}/>}
          {!compact && definition.key === 'MapBuyingCommittee' && scope.opportunity?.id === 'ZDR-2042' && props.committeeVisual && <><p>Illustrative orbit; authoritative roles and stance are listed from the relationship graph below.</p>{props.committeeVisual}</>}
          {definition.key === 'TrackMeetingFollowUp' && <label className={styles.field}>Commitment status<select className={styles.select} aria-label="Commitment status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}>{['all', 'complete', 'at-risk', 'blocked', 'on-track'].map(value => <option key={value}>{value}</option>)}</select></label>}
          {!compact && definition.key === 'GetDealRisk' && <><p>Source facts, contrary signals, stale assumptions and deterministic inference remain separate. No inferred risk is treated as a customer commitment.</p>{!props.workspaceFocus && <D3EvidenceFreshness evidence={scopedEvidence(scope)} selectedId={selected} />}</>}
          {definition.key === 'PrepareCustomerMeeting' && !scope.meeting && <p>No meeting is recorded for this opportunity. Invoke with a known meeting ID; an agenda was not fabricated.</p>}
          {compact ? compactAnalysis() : selectionList()}
        </>}
    </div>
    <section aria-label="Suggested Copilot actions">
      {!compact && <><h2 className={styles.heading}>Continue with Copilot</h2><p className={styles.muted}>Return a concise summary to chat with the visible scope, edited values, evidence gaps and next steps. No new component is opened.</p></>}
      <div className={styles.footer}>
        <Button appearance="primary" icon={followUpState === 'sent' ? { children: <CheckmarkCircle20Regular />, role: 'status', 'aria-label': 'Sent to Copilot with the visible discussion context.', 'aria-hidden': false } : <Chat20Regular />} data-copilot-action="primary" disabled={followUpState === 'sending' || !!primaryAction.disabledReason} title={primaryAction.disabledReason} onClick={() => sendSuggestedAction({ ...primaryAction, label: primaryLabel }, { ...primaryContext, availableActions: visibleSnapshot.availableActions, inlineStage: visibleSnapshot.inlineStage })}>{followUpState === 'sending' && sendingAction === primaryAction.id ? 'Sending...' : primaryLabel}</Button>
        <Menu><MenuTrigger disableButtonEnhancement><Button aria-label="More Copilot discussions">More discussions</Button></MenuTrigger><MenuPopover><MenuList>{suggestedActions.map(action => <MenuItem key={action.id} icon={<Chat20Regular />} data-copilot-action={action.id} disabled={followUpState === 'sending' || !!action.disabledReason} title={action.disabledReason} onClick={() => sendSuggestedAction(action)}>{action.label}</MenuItem>)}</MenuList></MenuPopover></Menu>
      </div>
      {(compact ? !!primaryAction.disabledReason : suggestedActions.some(action => action.disabledReason)) && <p className={styles.muted}>{compact ? primaryAction.disabledReason : Array.from(new Set(suggestedActions.map(action => action.disabledReason).filter(Boolean))).join(' ')}</p>}
      {followUpState === 'sent' && !compact && <p role="status">Sent to Copilot with the visible discussion context.</p>}
      {followUpState === 'error' && <p role="alert" className={styles.error}>{followUpError}</p>}
    </section>
    {contextError && <p role="alert" className={styles.error}>{contextError}</p>}
  </section>;
}
