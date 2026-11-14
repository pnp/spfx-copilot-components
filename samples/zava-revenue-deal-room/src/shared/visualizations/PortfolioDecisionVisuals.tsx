import * as React from 'react';
import { tokens } from '@fluentui/react-components';
import { scaleLinear } from 'd3-scale';
import type { IAttentionDeal } from '../DealAttention';
import { currency } from '../operations';
import { APPROVAL_ROLES, approvalRoute, nextApproval, dealEconomics, type DealDraft, type DealRequest } from '../dealWorkflow';

export function AttentionValueMap(props: { readonly deals: readonly IAttentionDeal[]; readonly measure: 'value' | 'exposure'; readonly onSelect: (id: string) => void }): React.ReactElement {
  const container = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(620);
  React.useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = (): void => { if (element.clientWidth > 0) setWidth(element.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const height = 180;
  const x = scaleLinear().domain([0, 4]).range([52, width - 36]);
  const value = (item: IAttentionDeal): number => props.measure === 'value' ? item.opportunity.value : item.exposure;
  const y = scaleLinear().domain([0, Math.max(1, ...props.deals.map(value)) * 1.08]).range([height - 34, 20]);
  return <div ref={container}><svg style={{ width: '100%', height: '180px', display: 'block' }} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Deal value versus observed attention flags" data-business-kind="attention-value-proof-map">
    <title>Open deal value versus observable attention flags, not win probability or predicted loss</title>
    <rect x={x(2)} y="16" width={width - 36 - x(2)} height={height - 50} fill={tokens.colorPaletteMarigoldBackground1}/>
    {[1, 2, 3, 4].map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1="16" y2={height - 34} stroke={tokens.colorNeutralStroke1} strokeDasharray="3 4"/><text x={x(value)} y={height - 14} textAnchor="middle" fill={tokens.colorNeutralForeground2} fontSize="11">{value} flags</text></g>)}
    <text x="3" y="12" fill={tokens.colorNeutralForeground2} fontSize="11">{props.measure === 'value' ? 'Open USD' : 'Seller-unweighted USD / not loss'}</text>
    {props.deals.map(item => <g key={item.id} role="button" tabIndex={0} aria-label={`Details for ${item.id}`} onClick={() => props.onSelect(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onSelect(item.id); } }}>
      <title>{item.title}: {currency(item.opportunity.value)} open; {item.flags.length} source/judgment attention flags. {item.flags.join('; ')}</title>
      <circle cx={x(item.flags.length)} cy={y(value(item))} r="9" fill={item.flags.length > 2 ? tokens.colorPaletteMarigoldBackground3 : tokens.colorBrandBackground} stroke={tokens.colorNeutralBackground1} strokeWidth="2"/>
    </g>)}
  </svg></div>;
}
export interface IApprovalWorkloadModel {
  readonly kind: 'independent-review-workload';
  readonly pendingCount: number;
  readonly pendingValue: number;
  readonly stages: readonly { readonly role: string; readonly currentCount: number; readonly currentValue: number; readonly remainingCount: number; readonly requestIds: readonly string[] }[];
  readonly semantics: string;
}
export function approvalQueueModel(requests: readonly DealRequest[]): IApprovalWorkloadModel {
  const pending = requests.filter(item => item.status === 'pending');
  return {
    kind: 'independent-review-workload',
    pendingCount: pending.length,
    pendingValue: pending.reduce((sum, item) => sum + dealEconomics(item.draft).contractValue, 0),
    stages: APPROVAL_ROLES.map(role => {
      const current = pending.filter(item => nextApproval(item) === role);
      const remaining = pending.filter(item => {
        const route = approvalRoute(item.draft);
        const next = nextApproval(item);
        return next !== undefined && route.indexOf(role) >= route.indexOf(next);
      });
      return { role, currentCount: current.length, currentValue: current.reduce((sum, item) => sum + dealEconomics(item.draft).contractValue, 0), remainingCount: remaining.length, requestIds: remaining.map(item => item.id) };
    }),
    semantics: 'Current counts use stored pending requests and their next independent reviewer. Remaining routes overlap by stage and are requirements, never granted authority or additive pipeline value.'
  };
}
export function ApprovalWorkloadVisual(props: { readonly requests: readonly DealRequest[] }): React.ReactElement {
  const model = approvalQueueModel(props.requests);
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '6px' }} data-business-kind="independent-review-workload">
    {model.stages.map(stage => <div key={stage.role} style={{ border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '7px', padding: '8px', backgroundColor: stage.currentCount ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1 }}>
        <strong style={{ display: 'block', fontSize: '12px' }}>{stage.role}</strong>
        <strong style={{ display: 'block', fontSize: '24px', margin: '4px 0', color: tokens.colorBrandForeground1 }}>{stage.currentCount}</strong>
        <span style={{ display: 'block', fontSize: '11px' }}>current requests</span>
        <span style={{ display: 'block', fontSize: '11px' }}>{stage.remainingCount} remaining routes</span>
      </div>)}
  </div>;
}
export interface IRequestValueModel {
  readonly kind: 'request-value-composition';
  readonly licensedContractValue: number;
  readonly servicesValue: number;
  readonly contractValue: number;
  readonly grossMargin: number;
  readonly sellerWeightedValue: number;
  readonly requiredRoute: readonly string[];
  readonly semantics: string;
}
export function requestValueModel(draft: DealDraft): IRequestValueModel {
  const economics = dealEconomics(draft);
  const services = Number(draft.services);
  if (![services, economics.contractValue, economics.grossMargin, economics.weightedForecast].every(Number.isFinite) || services < 0 || economics.contractValue < services) throw new Error('Request value composition requires valid nonnegative draft economics.');
  return {
    kind: 'request-value-composition', licensedContractValue: economics.contractValue - services, servicesValue: services,
    contractValue: economics.contractValue, grossMargin: economics.grossMargin, sellerWeightedValue: economics.weightedForecast,
    requiredRoute: approvalRoute(draft), semantics: 'Exact validated draft economics; licensing/services composition and seller-weighting are arithmetic, not an approval.'
  };
}
export function RequestValueVisual(props: { readonly draft: DealDraft }): React.ReactElement {
  const model = requestValueModel(props.draft);
  const services = model.servicesValue;
  const license = model.licensedContractValue;
  const total = Math.max(1, model.contractValue);
  const licenseWidth = license / total * 470;
  return <svg style={{ width: '100%', height: '88px', display: 'block' }} viewBox="0 0 500 88" role="img" aria-label="Submitted deal licensing and services composition" data-business-kind="request-value-composition">
    <title>Exact draft contract value by licensing and services; not approval</title>
    <rect x="15" y="23" width={licenseWidth} height="25" rx="4" fill={tokens.colorBrandBackground}/>
    <rect x={15 + licenseWidth} y="23" width={services / total * 470} height="25" rx="4" fill={tokens.colorPaletteMarigoldBackground3}/>
    <text x="15" y="17" fill={tokens.colorNeutralForeground1} fontSize="12">{currency(model.contractValue)} exact contract value</text>
    <text x="15" y="69" fill={tokens.colorNeutralForeground2} fontSize="11">Licensing {currency(license)}</text>
    <text x="485" y="69" textAnchor="end" fill={tokens.colorNeutralForeground2} fontSize="11">Services {currency(services)}</text>
  </svg>;
}
