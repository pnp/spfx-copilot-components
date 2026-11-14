import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { DEFAULT_WEIGHTS, HERO_BIDS, VALUE_STAGES, money, normalizeScore, type IValueStage, type IWeights } from './domain';
import { buildLandscape, buildValueRiver } from './geometry';
import { scaleLinear } from 'd3-scale';
import { arc, pie } from 'd3-shape';
import { ZAVACORE } from './brand';

const useStyles = makeStyles({
  svg: { width: '100%', height: 'auto', display: 'block' },
  axis: { fill: tokens.colorNeutralForeground3, fontSize: '13px' },
  label: { fill: tokens.colorNeutralForeground1, fontSize: '14px', fontWeight: 600 },
  scroll: { overflowX: 'auto', minWidth: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: tokens.fontSizeBase200 },
  cell: { padding: '7px 8px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' },
  mark: { cursor: 'pointer', outlineStyle: 'none', '&:focus': { stroke: tokens.colorStrokeFocus2, strokeWidth: '4px' } },
  insight: { borderLeft: `3px solid ${tokens.colorBrandStroke1}`, padding: '10px 14px', backgroundColor: tokens.colorBrandBackground2, color: tokens.colorNeutralForeground2, borderRadius: tokens.borderRadiusMedium, fontSize: '13px' },
  legend: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px', color: tokens.colorNeutralForeground2, margin: '10px 0' },
  disclosure: { cursor: 'pointer', padding: '10px 0', fontWeight: 600, fontSize: '12px' }
});
export function AwardAllocation({ primaryPercent }: { readonly primaryPercent: number }): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const slices = pie<{ label: string; value: number }>().value(item => item.value).sort(null)([
    { label: 'Fabrikam Devices', value: primaryPercent },
    { label: 'Contoso Mobility', value: 100 - primaryPercent }
  ]);
  const shape = arc<typeof slices[number]>().innerRadius(60).outerRadius(83).cornerRadius(3).padAngle(0.025);
  return <div data-chart="award-allocation">
    <svg className={s.svg} viewBox="0 0 460 194" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Proposed supplier award allocation</title>
      <desc id={`${id}-desc`}>Scenario, not applied: Fabrikam Devices {primaryPercent} percent, Contoso Mobility {100 - primaryPercent} percent. Human approval is limited to a maximum 70 percent primary share.</desc>
      <g transform="translate(100,97)">{slices.map((slice, index) => <path key={slice.data.label} d={shape(slice) || ''} fill={index === 0 ? tokens.colorBrandBackground : ZAVACORE.magenta} />)}
        <text x="0" y="-2" textAnchor="middle" className={s.label}>{primaryPercent} / {100 - primaryPercent}</text><text x="0" y="20" textAnchor="middle" className={s.axis}>Proposed split</text>
      </g>
      {slices.map((slice, index) => <g key={slice.data.label}><circle cx="208" cy={64 + index * 65} r="5" fill={index === 0 ? tokens.colorBrandBackground : ZAVACORE.magenta} /><text x="222" y={68 + index * 65} className={s.label}>{slice.data.label}</text><text x="222" y={89 + index * 65} className={s.axis}>{slice.data.value}% of the award / {index === 0 ? 'primary supply' : 'resilience capacity'}</text></g>)}
    </svg>
    <p className={s.insight}>Scenario - not applied. A resilient allocation makes the cost and continuity trade-off explicit.</p>
  </div>;
}
export function SupplierLandscape({ weights = DEFAULT_WEIGHTS, onSelect }: { readonly weights?: IWeights; readonly onSelect?: (id: string) => void }): React.ReactElement {
  const s = useStyles(), id = React.useId();
  const points = buildLandscape(HERO_BIDS, weights);
  const leader = [...points].sort((a, b) => b.score - a.score)[0];
  const y = scaleLinear().domain([40, 85]).range([245, 35]);
  return <div>
    <svg className={s.svg} viewBox="0 0 720 300" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Supplier total-value landscape</title>
      <desc id={`${id}-desc`}>Position is normalized score and bid price; bubble size is evidence confidence. Exact values are in the adjacent table.</desc>
      {[40, 50, 60, 70, 80].map(tick => <g key={tick}><line x1="60" x2="680" y1={y(tick)} y2={y(tick)} stroke={tokens.colorNeutralStroke2} strokeDasharray="3 5" /><text className={s.axis} x="42" y={y(tick) + 4} textAnchor="end">{tick}</text></g>)}
      <text className={s.axis} x="60" y="18">Weighted total-value score / 100</text>
      <text className={s.axis} x="100" y="282" textAnchor="middle">{money(972000)}</text><text className={s.axis} x="630" y="282" textAnchor="middle">{money(1098000)}</text>
      {points.map(point => <g key={point.id} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`${point.label}, score ${point.score.toFixed(1)}, risk ${point.risk}`} className={s.mark}
        onClick={() => onSelect?.(point.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(point.id); } }}>
        <circle cx={point.x} cy={point.y} r={point.radius} fill={point.risk > 65 ? tokens.colorPaletteBerryBackground3 : point.risk > 45 ? tokens.colorPaletteMarigoldBackground3 : tokens.colorPaletteGreenBackground3} stroke={tokens.colorNeutralBackground1} strokeWidth="3" />
        <text className={s.label} x={point.x} y={point.y - point.radius - 8} textAnchor="middle">{point.label.split(' ')[0]}</text>
        <text x={point.x} y={point.y + 4} textAnchor="middle" fill={tokens.colorNeutralForegroundOnBrand} fontSize="13" fontWeight="700">{point.score.toFixed(0)}</text>
      </g>)}
    </svg>
    <div className={s.legend}><span>Green: risk ≤45</span><span>Amber: risk 46–65</span><span>Berry: risk &gt;65</span><span>Bubble area: evidence confidence</span></div>
    <p className={s.insight}>{leader.label} leads this weighting scenario at {leader.score.toFixed(1)}. Ranking is analysis, not an award decision.</p>
    <details><summary className={s.disclosure}>Exact supplier comparison and evidence</summary><div className={s.scroll} tabIndex={0} role="region" aria-label="Exact supplier evaluation data"><table className={s.table}>
      <caption>Exact supplier comparison - price {weights.price}%, delivery {weights.delivery}%, quality {weights.quality}%, risk {weights.risk}%, sustainability {weights.sustainability}%</caption>
      <thead><tr>{['Supplier', 'Score', 'Bid', 'Lead', 'Quality', 'Risk', 'ESG', 'Confidence'].map(label => <th className={s.cell} scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{HERO_BIDS.map(bid => <tr key={bid.id}>
        <td className={s.cell}>{bid.supplier}</td><td className={s.cell}>{normalizeScore(bid, weights).toFixed(1)}</td>
        <td className={s.cell}>{money(bid.price)}</td><td className={s.cell}>{bid.lead} days</td>
        <td className={s.cell}>{bid.quality}/100</td><td className={s.cell}>{bid.risk}/100</td>
        <td className={s.cell}>{bid.sustainability}/100</td><td className={s.cell}>{bid.confidence}%</td>
      </tr>)}</tbody>
    </table></div></details>
  </div>;
}
export function ValueRiver({ stages = VALUE_STAGES }: { readonly stages?: readonly IValueStage[] }): React.ReactElement {
  const s = useStyles(), id = React.useId();
  const geometry = buildValueRiver(stages);
  return <div>
    <svg className={s.svg} viewBox="0 0 720 260" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Spend-to-value river</title><desc id={`${id}-desc`}>Identified opportunity progresses through negotiation and contracting to verified realized value. Unverified amounts are excluded.</desc>
      <defs><linearGradient id={`${id}-flow`} x1="0" x2="1"><stop stopColor={tokens.colorBrandBackground} /><stop offset=".55" stopColor={tokens.colorPaletteBlueBackground2} /><stop offset="1" stopColor={tokens.colorPaletteGreenBackground3} /></linearGradient></defs>
      <path d={geometry.areaPath} fill={`url(#${id}-flow)`} opacity=".28" /><path d={geometry.linePath} fill="none" stroke={tokens.colorBrandForeground1} strokeWidth="5" />
      {geometry.points.map(point => <g key={point.label}><circle cx={point.x} cy={point.y} r="7" fill={tokens.colorPaletteMarigoldBackground3} /><text className={s.label} x={point.x} y={point.y - 15} textAnchor="middle">{money(point.value)}</text><text className={s.axis} x={point.x} y="248" textAnchor="middle">{point.label}</text></g>)}
    </svg>
    <div className={s.scroll}><table className={s.table}><caption>Exact procurement value by stage (EUR)</caption><thead><tr><th className={s.cell} scope="col">Stage</th><th className={s.cell} scope="col">Value</th></tr></thead><tbody>{stages.map(stage => <tr key={stage.stage}><td className={s.cell}>{stage.stage}</td><td className={s.cell}>{money(stage.value)}</td></tr>)}</tbody></table></div>
  </div>;
}
