import * as React from 'react';
import { tokens } from '@fluentui/react-components';
import { scaleLinear } from 'd3-scale';
import { arc, pie, type PieArcDatum } from 'd3-shape';
import {
  qualificationReadiness, competitiveDecisionDrivers,
  type IQualificationGate, type QualificationProofState
} from './operations';
import { businessVisualModel, type IBusinessVisualInput } from './businessVisualModel';
import KeynoteBusinessVisual from './visualizations/KeynoteBusinessVisual';

interface IInlineBusinessVisualProps extends IBusinessVisualInput {
  readonly onSelect: (id: string) => void;
}
const svgButtonTarget = (x: number, y: number, width: number, height: number): React.ReactElement =>
  <rect x={x} y={y} width={width} height={height} fill="transparent" pointerEvents="all" aria-hidden="true" data-svg-hit-target="true"/>;

export function inlineBusinessChart(props: IInlineBusinessVisualProps): Readonly<Record<string, unknown>> {
  if (props.definition.key === 'QualifyOpportunity') return { kind: 'qualification-evidence-gates', ...qualificationReadiness(props.scope) };
  if (props.definition.key === 'ResearchCompetitivePosition') return { kind: 'competitive-decision-drivers', unit: 'proposed importance percent', records: competitiveDecisionDrivers(props.scope), semantics: 'Workshop proposal, not buyer-validated priorities or scored vendor performance. Missing competitor benchmarks remain unknown.' };
  return { ...businessVisualModel(props) };
}
export default function InlineBusinessVisual(props: IInlineBusinessVisualProps): React.ReactElement {
  const id = React.useId();
  const inspect = (entityId: string): React.KeyboardEventHandler<SVGGElement> => event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onSelect(entityId); }
  };
  if (props.definition.key === 'QualifyOpportunity') {
    const readiness = qualificationReadiness(props.scope);
    const colors: Readonly<Record<QualificationProofState, string>> = {
      verified: tokens.colorPaletteGreenBackground3, blocked: tokens.colorPaletteRedBackground3,
      stale: tokens.colorPaletteMarigoldBackground3, unconfirmed: tokens.colorPaletteBlueForeground2,
      missing: tokens.colorNeutralStroke2
    };
    const sectors = pie<IQualificationGate>().value(() => 1).sort(null)([...readiness.gates]);
    const segment = arc<PieArcDatum<IQualificationGate>>().innerRadius(34).outerRadius(49).padAngle(.07);
    return <figure style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', minHeight: '105px' }} data-business-kind="qualification-evidence-gates">
      <svg style={{ width: '112px', height: '105px', flexShrink: 0 }} viewBox="0 0 112 112" role="img" aria-labelledby={id}>
        <title id={id}>Qualification buyer-proof gates: {readiness.verifiedCount} of {readiness.totalCount} evidenced, not win probability</title>
        <g transform="translate(56,56)">{sectors.map(item => {
          const path = segment(item);
          if (!path) throw new Error(`Qualification gate has no chart geometry: ${item.data.id}`);
          return <path key={item.data.id} d={path} fill={colors[item.data.state]} data-qualification-gate={item.data.id}><title>{item.data.label}: {item.data.state}. {item.data.detail}</title></path>;
        })}<text x="0" y="1" textAnchor="middle" fill={tokens.colorNeutralForeground1} fontSize="23" fontWeight="600">{readiness.verifiedCount}/{readiness.totalCount}</text><text x="0" y="18" textAnchor="middle" fill={tokens.colorNeutralForeground2} fontSize="11">evidenced</text></g>
      </svg>
      <figcaption style={{ minWidth: 0, flex: 1, fontSize: '12px', lineHeight: '18px' }}>{readiness.gates.map(gate => <div key={gate.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span aria-hidden="true" style={{ width: '7px', height: '7px', flexShrink: 0, borderRadius: '50%', backgroundColor: colors[gate.state] }}/><span>{gate.label}: <strong>{gate.state}</strong></span></div>)}</figcaption>
    </figure>;
  }
  if (props.definition.key === 'ResearchCompetitivePosition') {
    const drivers = competitiveDecisionDrivers(props.scope);
    const scale = scaleLinear().domain([0, Math.max(...drivers.map(item => item.weight))]).range([0, 270]);
    return <figure style={{ margin: 0 }} data-business-kind="competitive-decision-drivers">
      <svg style={{ width: '100%', height: '132px', display: 'block' }} viewBox="0 0 500 128" role="group" aria-labelledby={id}>
        <title id={id}>Proposed customer decision-driver weights, not competitor scores</title>
        {drivers.map((driver, index) => <g key={driver.id} role="button" tabIndex={0} aria-label={`Inspect ${driver.id}`} data-competitive-driver={driver.id} onClick={() => props.onSelect(driver.id)} onKeyDown={inspect(driver.id)}>
          <title>{driver.label}: {driver.weight}% proposed importance; {driver.proof}; buyer weight and vendor score not validated</title>
          {svgButtonTarget(0, index * 31, 500, 31)}
          <text x="0" y={20 + index * 31} fill={tokens.colorNeutralForeground1} fontSize="13">{driver.label}</text>
          <line x1="166" x2={166 + scale(driver.weight)} y1={15 + index * 31} y2={15 + index * 31} stroke={tokens.colorPaletteBlueForeground2} strokeWidth="6" strokeLinecap="round"/>
          <circle cx={166 + scale(driver.weight)} cy={15 + index * 31} r="6" fill={tokens.colorPaletteBlueForeground2}/>
          <text x="493" y={20 + index * 31} textAnchor="end" fill={tokens.colorNeutralForeground1} fontSize="13">{driver.weight}%</text>
        </g>)}
      </svg>
      <figcaption style={{ color: tokens.colorNeutralForeground2, fontSize: '12px', lineHeight: '16px' }}>Proposed workshop priorities; buyer weights and vendor performance remain unverified.</figcaption>
    </figure>;
  }
  const model = businessVisualModel(props);
  const interactive = ['BuildAccountBrief', 'MapBuyingCommittee', 'GetDealRisk', 'TrackMeetingFollowUp', 'CoachDealStrategy'].indexOf(props.definition.key) >= 0;
  return <KeynoteBusinessVisual model={model} onSelect={interactive ? props.onSelect : undefined}/>;
}
