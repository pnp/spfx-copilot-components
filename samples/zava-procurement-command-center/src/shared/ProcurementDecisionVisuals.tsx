import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { scaleLinear } from 'd3-scale';
import { linkHorizontal } from 'd3-shape';
import { money } from './domain';
import { buildDependencyPathway } from './geometry';
import { valueFlowGeometry, valueFlowSelection, type IValueEvidence, type IValueFlow, type IValueFlowNode } from './valueFlow';

const useStyles = makeStyles({
  svg: { display: 'block', width: '100%', height: 'auto' },
  desktop: { '@media(max-width:600px)': { display: 'none' } },
  mobile: { display: 'none', '@media(max-width:600px)': { display: 'grid', gap: '8px' } },
  label: { fill: tokens.colorNeutralForeground1, fontSize: '13px', fontWeight: 600, paintOrder: 'stroke', stroke: tokens.colorNeutralBackground1, strokeWidth: '3px', strokeLinejoin: 'round' },
  tick: { fill: tokens.colorNeutralForeground2, fontSize: '11px' },
  mark: { cursor: 'pointer', ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '3px' } },
  detail: { margin: '12px 0', padding: '12px 14px', borderLeft: `3px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusMedium, fontSize: '13px', lineHeight: '1.6' },
  muted: { color: tokens.colorNeutralForeground2, fontSize: '12px', lineHeight: '1.6', margin: '8px 0' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '8px 18px', fontSize: '11px', color: tokens.colorNeutralForeground2 },
  swatch: { display: 'inline-block', width: '9px', height: '9px', borderRadius: '2px', marginRight: '6px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', '& td, & th': { padding: '8px', textAlign: 'left', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` } },
  scroll: { overflowX: 'auto', minWidth: 0, maxWidth: '100%' },
  disclosure: { cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '12px 0' },
  ranks: { display: 'grid', gap: '10px' },
  rank: { display: 'grid', gap: '8px', padding: '12px', textAlign: 'left', font: 'inherit', cursor: 'pointer', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}` } },
  selected: { border: `1px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  rankLabel: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '13px', fontWeight: 600 },
  track: { height: '10px', display: 'block', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '4px', overflow: 'hidden' },
  bar: { height: '100%', display: 'block', backgroundColor: tokens.colorBrandBackground, borderRadius: '4px' },
  allocation: { display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }
});
const stateColor = (state: IValueFlowNode['state']): string =>
  state === 'verified' ? tokens.colorPaletteGreenBackground3 : state === 'contracted' ? tokens.colorPaletteBlueBackground2 :
    state === 'negotiated' ? tokens.colorPaletteMarigoldBackground3 : state === 'identified' ? tokens.colorNeutralForeground3 : tokens.colorBrandBackground;
const activate = (event: React.KeyboardEvent, action: () => void): void => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); }
};

export function SpendValueFlow({ flow, selectedId, onSelect }: {
  readonly flow: IValueFlow; readonly selectedId: string; readonly onSelect: (id: string) => void;
}): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const geometry = valueFlowGeometry(flow);
  const selected = valueFlowSelection(flow, selectedId);
  const connected = (node: IValueFlowNode): boolean => !selectedId || node.id === selectedId ||
    flow.links.some(link => (link.id === selectedId || link.source === selectedId || link.target === selectedId) && (link.source === node.id || link.target === node.id));
  if (!flow.total) return <p role="status">No value evidence matches this scope. Investment or delivery does not imply verified savings.</p>;
  return <div data-chart="procurement-value-sankey">
    <div className={s.desktop}>
      <svg className={s.svg} viewBox="0 0 900 360" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>Procurement opportunity to verified value Sankey</title>
        <desc id={`${id}-desc`}>Follow the same EUR {flow.total} from region to intervention to mutually exclusive evidence states. Ribbon width is EUR, not probability. Select a connection or stage. Exact figures and keyboard alternatives follow.</desc>
        {['Evidence region', 'Addressable intervention', 'Evidence state / not approval'].map((label, index) => <text className={s.tick} key={label} x={index === 0 ? 10 : index === 1 ? 444 : 878} y="17" textAnchor={index === 2 ? 'end' : 'start'}>{label}</text>)}
        {geometry.links.map(link => {
          const target = flow.nodes.find(node => node.id === link.target);
          const source = flow.nodes.find(node => node.id === link.source);
          const highlight = !selectedId || link.id === selectedId || link.source === selectedId || link.target === selectedId;
          return <path className={s.mark} key={link.id} d={link.path} fill="none" stroke={stateColor(target?.state)} strokeWidth={link.width} opacity={highlight ? '.5' : '.12'}
            role="button" tabIndex={0} aria-pressed={link.id === selectedId} aria-label={`${source?.label} to ${target?.label}: ${money(link.value)}`}
            onClick={() => onSelect(link.id)} onKeyDown={event => activate(event, () => onSelect(link.id))}><title>{source?.label} to {target?.label}: {money(link.value)}</title></path>;
        })}
        {geometry.nodes.map(node => <g key={node.id} className={s.mark} role="button" tabIndex={0} aria-pressed={node.id === selectedId} aria-label={`${node.label}: ${money(node.value)}`} opacity={connected(node) ? 1 : .45}
          onClick={() => onSelect(node.id)} onKeyDown={event => activate(event, () => onSelect(node.id))}>
          <rect x={node.x} y={node.y} width="12" height={node.height} rx="3" fill={stateColor(node.state)} />
          <text className={s.label} x={node.column === 0 ? node.x + 19 : node.x - 8} y={node.y + node.height / 2 - 3} textAnchor={node.column === 0 ? 'start' : 'end'}>{node.label}</text>
          <text className={s.label} x={node.column === 0 ? node.x + 19 : node.x - 8} y={node.y + node.height / 2 + 14} textAnchor={node.column === 0 ? 'start' : 'end'}>{money(node.value)}</text>
        </g>)}
      </svg>
    </div>
    <div className={s.mobile} aria-label="Value flow at narrow width">
      {flow.nodes.filter(node => node.column === 1 || node.column === 2).map(node => <Button key={node.id} appearance={node.id === selectedId ? 'primary' : 'secondary'} aria-pressed={node.id === selectedId} onClick={() => onSelect(node.id)}>{node.label} / {money(node.value)}</Button>)}
    </div>
    <div className={s.legend}>{flow.nodes.filter(node => node.state).map(node => <span key={node.id}><span className={s.swatch} style={{ backgroundColor: stateColor(node.state) }} />{node.label}</span>)}</div>
    <p className={s.detail} role="status">{selected ? <><strong>{selected.label}: {money(selected.value)}.</strong> {selected.opportunityId ? `${selected.opportunityId} / ` : ''}Selection is evidence, not an instruction to act.</> :
      selectedId ? 'This connection is outside the filtered evidence. Select a visible intervention; no other record was substituted.' :
        <><strong>{money(flow.verified)} verified from {money(flow.total)} identified.</strong> {money(flow.total - flow.verified)} remains unverified. Select a ribbon to find the bottleneck.</>}</p>
    <p className={s.muted}>{money(flow.disputed)} disputed is already inside contracted/unverified value, never an additional flow or a verified saving. All three columns reconcile to {money(flow.total)}.</p>
    {selectedId && <Button size="small" appearance="subtle" onClick={() => onSelect('')}>Clear value-flow selection</Button>}
    <details><summary className={s.disclosure}>Exact value evidence and connection selection</summary><div className={s.scroll} tabIndex={0} role="region" aria-label="Exact value flow evidence"><table className={s.table}>
      <caption>EUR evidence stages are cumulative; terminal Sankey states are disjoint.</caption><thead><tr>{['Intervention', 'Identified', 'Negotiated', 'Contracted', 'Verified', 'Disputed / excluded'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{flow.records.map(record => <tr key={record.id}><th scope="row"><Button size="small" appearance="subtle" onClick={() => onSelect(`opportunity:${record.id}`)}>{record.label}</Button><br />{record.id} / {record.region}</th><td>{money(record.identified)}</td><td>{money(record.negotiated)}</td><td>{money(record.contracted)}</td><td>{money(record.realized)}</td><td>{money(record.disputed)}</td></tr>)}</tbody>
    </table>{flow.links.map(link => <Button key={link.id} size="small" appearance="subtle" onClick={() => onSelect(link.id)}>{valueFlowSelection(flow, link.id)?.label}: {money(link.value)}</Button>)}</div></details>
  </div>;
}

export function LeakageRanking({ records, selectedId, onSelect }: {
  readonly records: readonly IValueEvidence[]; readonly selectedId: string; readonly onSelect: (id: string) => void;
}): React.ReactElement {
  const s = useStyles();
  const ranked = [...records].sort((a, b) => b.identified - a.identified);
  const width = scaleLinear().domain([0, Math.max(1, ...ranked.map(record => record.identified))]).range([0, 100]);
  return <div className={s.ranks} data-chart="leakage-ranking" aria-label="Ranked addressable leakage">
    {ranked.map((record, index) => <button key={record.id} type="button" className={mergeClasses(s.rank, record.id === selectedId && s.selected)} aria-pressed={record.id === selectedId} onClick={() => onSelect(record.id)}>
      <span className={s.rankLabel}><span>{index + 1}. {record.label}</span><span>{money(record.identified)}</span></span>
      <span className={s.track}><span className={s.bar} style={{ width: `${width(record.identified)}%` }} /></span>
      <span className={s.muted}>{record.region} / {money(record.realized)} verified / {money(record.disputed)} disputed</span>
    </button>)}
    {!ranked.length && <p role="status">No addressable opportunities match these filters.</p>}
  </div>;
}

export function SupplierDependency({ supplier, region, scenario, exposure, selectedId, onSelect }: {
  readonly supplier: string; readonly region: string; readonly scenario: string; readonly exposure: number;
  readonly selectedId: string; readonly onSelect: (id: string) => void;
}): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const nodes = buildDependencyPathway(supplier, region, scenario, exposure);
  const radius = scaleLinear().domain([0, 100]).range([12, 31]);
  const path = linkHorizontal();
  const selected = nodes.find(node => node.id === selectedId);
  return <div data-chart="supplier-dependency-pathway">
    <svg className={mergeClasses(s.svg, s.desktop)} viewBox="0 0 720 220" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Modeled supplier dependency pathway</title><desc id={`${id}-desc`}>Component availability, supplier assembly, logistics corridor and field readiness. Node size encodes an illustrative exposure index, not failure probability. Select a node for its assumptions.</desc>
      {nodes.slice(0, -1).map((node, index) => <path key={node.id} d={path({ source: [node.x + radius(node.score), node.y], target: [nodes[index + 1].x - radius(nodes[index + 1].score), nodes[index + 1].y] }) || ''} fill="none" stroke={tokens.colorNeutralStroke1} strokeWidth="3" />)}
      {nodes.map(node => <g key={node.id} className={s.mark} role="button" tabIndex={0} aria-pressed={node.id === selectedId} aria-label={`${node.label}: modeled index ${node.score} out of 100`} onClick={() => onSelect(node.id)} onKeyDown={event => activate(event, () => onSelect(node.id))}>
        <circle cx={node.x} cy={node.y} r={radius(node.score) + 7} fill={tokens.colorBrandBackground} opacity={node.id === selectedId ? '.18' : '.06'} />
        <circle cx={node.x} cy={node.y} r={radius(node.score)} fill={node.score > 65 ? tokens.colorPaletteRedBackground3 : node.score > 45 ? tokens.colorPaletteMarigoldBackground3 : tokens.colorBrandBackground} />
        <text x={node.x} y={node.y + 5} textAnchor="middle" fill={tokens.colorNeutralForegroundOnBrand} fontSize="14" fontWeight="700">{node.score}</text>
        <text className={s.label} x={node.x} y="62" textAnchor="middle">{node.label}</text>
      </g>)}
      <text className={s.tick} x="360" y="194" textAnchor="middle">Scenario exposure / 100, not a probability or confirmed disruption</text>
    </svg>
    <div className={s.mobile}>{nodes.map(node => <Button key={node.id} aria-pressed={node.id === selectedId} onClick={() => onSelect(node.id)}>{node.label}: {node.score}/100</Button>)}</div>
    <p className={s.detail} role="status"><strong>{selected?.label || 'Inspect the modeled pathway'}.</strong> {selected?.detail || 'Select the dependency that needs proof before assigning an owned mitigation.'}</p>
  </div>;
}

export function PortfolioAllocation({ shares, labels }: { readonly shares: readonly number[]; readonly labels: readonly string[] }): React.ReactElement {
  const s = useStyles();
  const width = scaleLinear().domain([0, 100]).range([0, 660]);
  const colors = [tokens.colorBrandBackground, tokens.colorPaletteBlueBackground2, tokens.colorPaletteGreenBackground3];
  return <div data-chart="portfolio-allocation">
    <svg className={s.svg} viewBox="0 0 680 60" role="img" aria-label={`Proposed supplier allocation: ${shares.map((share, index) => `${labels[index]} ${share}%`).join(', ')}`}>
      <title>Conserved supplier allocation scenario</title><desc>All three proposed supplier shares sum to 100 percent. This is not an approved award.</desc>
      {shares.map((share, index) => <g key={labels[index]}><rect x={10 + width(shares.slice(0, index).reduce((sum, value) => sum + value, 0))} y="10" width={width(share)} height="32" fill={colors[index]} /><text x={10 + width(shares.slice(0, index).reduce((sum, value) => sum + value, 0) + share / 2)} y="31" textAnchor="middle" fill={tokens.colorNeutralForegroundOnBrand} fontSize="14" fontWeight="700">{share}%</text></g>)}
    </svg>
    <div className={s.allocation}>{shares.map((share, index) => <span key={labels[index]}><span className={s.swatch} style={{ backgroundColor: colors[index] }} />{labels[index]} {share}%</span>)}</div>
  </div>;
}
