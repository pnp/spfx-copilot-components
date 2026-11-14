import * as React from 'react';
import { Badge, Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowTrendingLines20Regular, Globe20Regular } from '@fluentui/react-icons';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { arc, pie, type PieArcDatum } from 'd3-shape';
import { WORLD_COUNTRIES as countries } from './worldGeography';
import { ACCOUNTS, HERO_EVIDENCE, calculateCommercialOffer, type ICommercialInput, type IEvidence, type IOpportunity } from '../domain';
import {
  buildCommercialGeometry,
  buildForecastBridge,
  buildPipelineBars,
  buildRegionMarks,
  type IForecastMovement,
  type IPipelineStage,
  type IRegionSignal
} from './revenueGeometry';

const useStyles = makeStyles({
  panel: {
    minWidth: 0,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    backgroundImage: `linear-gradient(160deg, ${tokens.colorNeutralBackground1}, ${tokens.colorNeutralBackground2})`,
    boxShadow: tokens.shadow2
  },
  chartHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: tokens.spacingHorizontalM },
  heading: { margin: 0, fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500 },
  insight: { margin: `${tokens.spacingVerticalXS} 0 0`, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  chart: { display: 'block', width: '100%', height: '230px', marginTop: tokens.spacingVerticalM, overflow: 'visible', '@media (max-width: 520px)': { height: '190px' } },
  ranking: { display: 'block', width: '100%', height: 'auto', marginTop: tokens.spacingVerticalM },
  map: { display: 'block', width: '100%', height: '300px', marginTop: tokens.spacingVerticalM, borderRadius: tokens.borderRadiusMedium, backgroundImage: `linear-gradient(145deg, ${tokens.colorNeutralBackground2}, ${tokens.colorBrandBackground2})`, '@media (max-width: 520px)': { height: '220px' } },
  axis: { stroke: tokens.colorNeutralStroke1, strokeWidth: 1 },
  grid: { stroke: tokens.colorNeutralStroke3, strokeWidth: 1, strokeDasharray: '3 5' },
  land: { fill: tokens.colorNeutralBackground3, stroke: tokens.colorNeutralStroke1, strokeWidth: 0.6 },
  graticule: { fill: 'none', stroke: tokens.colorNeutralStroke3, strokeWidth: 0.5 },
  positive: { fill: tokens.colorPaletteGreenBackground3 },
  negative: { fill: tokens.colorPaletteRedBackground3 },
  neutral: { fill: tokens.colorBrandBackground },
  selected: { stroke: tokens.colorNeutralForeground1, strokeWidth: 3, filter: 'drop-shadow(0 5px 6px rgba(0,0,0,.22))', '@media (prefers-reduced-motion: reduce)': { filter: 'none' } },
  label: { fill: tokens.colorNeutralForeground2, fontSize: '10px' },
  value: { fill: tokens.colorNeutralForeground1, fontSize: '11px', fontWeight: tokens.fontWeightBold },
  onBrandValue: { fill: tokens.colorNeutralForegroundOnBrand, fontSize: '11px', fontWeight: tokens.fontWeightBold },
  legend: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalS },
  legendItem: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground2 },
  swatch: { width: '10px', height: '10px', borderRadius: tokens.borderRadiusCircular, backgroundColor: tokens.colorBrandBackground },
  swatchGreen: { backgroundColor: tokens.colorPaletteGreenBackground3 },
  swatchRed: { backgroundColor: tokens.colorPaletteRedBackground3 },
  swatchAmber: { backgroundColor: tokens.colorPaletteMarigoldBackground3 },
  table: { width: '100%', marginTop: tokens.spacingVerticalS, borderCollapse: 'collapse', fontSize: tokens.fontSizeBase100 },
  cell: { padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalXS}`, borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, textAlign: 'left' },
  regionButtons: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS, marginTop: tokens.spacingVerticalS },
  regionButton: { minWidth: 0 },
  regionSelected: { boxShadow: `inset 0 -3px 0 ${tokens.colorPaletteMarigoldBorderActive}` },
  chartBadge: { flexShrink: 0, whiteSpace: 'nowrap' },
  commercialLine: { fill: 'none', stroke: tokens.colorPaletteGreenBorderActive, strokeWidth: 4 },
  commercialArea: { fill: 'url(#commercial-area)', opacity: 0.72 },
  commercialPoint: { fill: tokens.colorPaletteMarigoldBackground3, stroke: tokens.colorNeutralForegroundOnBrand, strokeWidth: 3, filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.3))', '@media (prefers-reduced-motion: reduce)': { filter: 'none' } },
  compactPanel: { padding: '8px', '& h2': { fontSize: tokens.fontSizeBase400, lineHeight: tokens.lineHeightBase400 }, '& h3': { fontSize: tokens.fontSizeBase400 }, '& p': { fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200 } },
  compactChart: { height: '120px', marginTop: '4px', '@media(max-width: 520px)': { height: '120px' } },
  compactRanking: { height: '80px', marginTop: '4px', '@media(max-width: 520px)': { height: '80px' } }
});

const money = (value: number): string => `$${value.toFixed(1)}M`;
const signedMoney = (value: number): string => `${value > 0 ? '+' : value < 0 ? '-' : ''}$${Math.abs(value).toFixed(1)}M`;

export function D3AttentionRanking(props: {
  readonly rows: readonly { readonly id: string; readonly value: number; readonly weightedValue: number }[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly compact?: boolean;
}): React.ReactElement {
  const styles = useStyles();
  const titleId = React.useId();
  const scale = scaleLinear().domain([0, Math.max(1, ...props.rows.map(row => row.value))]).range([0, 360]);
  return <section className={mergeClasses(styles.panel, props.compact && styles.compactPanel)} aria-label="Deal attention value chart">
    {!props.compact && <h3 className={styles.heading}>Open value / seller-weighted outlook</h3>}
    <p className={styles.insight}>{props.compact ? 'Open (pale) / seller-weighted (green). Not commit or predicted loss.' : 'Select a bar or a deal below. Pale bars show open value; green bars show value multiplied by seller probability, not commit or a predicted loss.'}</p>
    <svg className={mergeClasses(styles.ranking, props.compact && styles.compactRanking)} viewBox={`0 0 620 ${Math.max(50, props.rows.length * 48 + 20)}`} role="group" aria-labelledby={titleId}>
      <title id={titleId}>Important deals ranked with exact open and seller-weighted values</title>
      {props.rows.map((row, index) => <g key={row.id} role="button" tabIndex={0} aria-label={`Inspect ${row.id} in attention chart`} aria-pressed={props.selectedId === row.id}
        onClick={() => props.onSelect(row.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onSelect(row.id); } }}>
        <title>{row.id}: open ${row.value.toLocaleString('en-US')} USD; seller-weighted ${Math.round(row.weightedValue).toLocaleString('en-US')} USD</title>
        {props.compact && <rect x="0" y={index * 48 + 2} width="620" height="44" fill="transparent" pointerEvents="all" style={{ cursor: 'pointer' }} aria-hidden="true" data-svg-hit-target="true" />}
        <text x="4" y={index * 48 + 24} className={styles.value}>{row.id}</text>
        <rect x="95" y={index * 48 + 8} width={scale(row.value)} height="28" rx="4" className={props.selectedId === row.id ? styles.selected : undefined} fill={tokens.colorNeutralBackground3} />
        <rect x="95" y={index * 48 + 8} width={scale(row.weightedValue)} height="28" rx="4" className={styles.positive} />
        <text x="465" y={index * 48 + 24} className={styles.value}>{money(row.value / 1000000)} / {money(row.weightedValue / 1000000)}</text>
      </g>)}
    </svg>
  </section>;
}

export function D3EvidenceFreshness(props: { readonly evidence: readonly IEvidence[]; readonly selectedId: string }): React.ReactElement {
  const styles = useStyles();
  const titleId = React.useId();
  const scale = scaleLinear().domain([0, Math.max(1, ...props.evidence.map(item => item.ageDays))]).range([0, 360]);
  return <section className={styles.panel}>
    <h3 className={styles.heading}>Evidence freshness by source</h3>
    <p className={styles.insight}>Age is not confidence. Verified facts, contrary evidence, stale assumptions and seller judgment retain their source classification.</p>
    <svg className={styles.ranking} viewBox={`0 0 620 ${Math.max(50, props.evidence.length * 38 + 20)}`} role="img" aria-labelledby={titleId}>
      <title id={titleId}>Source evidence age in days; inspect the matching source cards below</title>
      {props.evidence.map((item, index) => <g key={item.id}>
        <title>{item.id}: {item.title}; {item.kind}; {item.ageDays} days; {item.source}</title>
        <text x="4" y={index * 38 + 24} className={styles.value}>{item.id}</text>
        <rect x="65" y={index * 38 + 8} width={scale(item.ageDays)} height="24" rx="4" className={props.selectedId === item.id ? styles.selected : undefined} fill={item.kind === 'stale' || item.kind === 'contrary' ? tokens.colorPaletteMarigoldBackground3 : tokens.colorBrandBackground} />
        <text x="435" y={index * 38 + 24} className={styles.value}>{item.ageDays}d / {item.kind}</text>
      </g>)}
    </svg>
    {!props.evidence.length && <p role="status">No recorded source evidence for this deal.</p>}
  </section>;
}

export function D3CommercialContour(props: { readonly input: ICommercialInput; readonly compact?: boolean }): React.ReactElement {
  const styles = useStyles();
  const gradient = React.useId();
  const geometry = buildCommercialGeometry(props.input);
  const margin = calculateCommercialOffer(props.input).grossMargin;
  return <div>
    <svg className={mergeClasses(styles.chart, props.compact && styles.compactChart)} viewBox="0 0 520 190" role="img" aria-label={`Commercial outcome curve with ${margin.toFixed(1)} percent margin at ${props.input.discount} percent discount`}>
      <title>Recalculated commercial margin by discount</title><desc>Every plotted point recalculates licensing term, annual ramp and services cost. These are scenario economics, not verified customer benefits or approval.</desc>
      <defs><linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor={tokens.colorBrandBackground2}/><stop offset="0.58" stopColor={tokens.colorPaletteGreenBackground2}/><stop offset="1" stopColor={tokens.colorPaletteMarigoldBackground2}/></linearGradient></defs>
      <line x1="48" y1="154" x2="494" y2="154" className={styles.axis}/><line x1="48" y1="24" x2="48" y2="154" className={styles.axis}/>
      <path d={geometry.areaPath} className={styles.commercialArea} style={{ fill: `url(#${gradient})` }}/><path d={geometry.linePath} className={styles.commercialLine}/><circle cx={geometry.selectedX} cy={geometry.selectedY} r="11" className={styles.commercialPoint}/>
      <text x="50" y="177" className={styles.label}>0% DISCOUNT</text><text x="420" y="177" className={styles.label}>{Math.max(30, props.input.discount)}%</text><text x={geometry.selectedX} y={geometry.selectedY - 17} textAnchor="middle" className={styles.value}>{margin.toFixed(1)}%</text>
    </svg>
    <p className={styles.insight}>Curve samples recalculate the actual draft economics; selected margin {margin.toFixed(1)}%. Not customer savings or approval.</p>
  </div>;
}

const FORECAST: readonly IForecastMovement[] = [
  { label: 'Opening', value: 8.4, kind: 'start' },
  { label: 'Expansion', value: 1.3, kind: 'increase' },
  { label: 'Security', value: -0.6, kind: 'decrease' },
  { label: 'Slip', value: -0.4, kind: 'decrease' },
  { label: 'Commit', value: 8.7, kind: 'end' }
];

export function D3ForecastBridge(props: { readonly movements?: readonly IForecastMovement[]; readonly title?: string; readonly description?: string } = {}): React.ReactElement {
  const styles = useStyles();
  const headingId = React.useId();
  const movements = props.movements || FORECAST;
  const bars = buildForecastBridge(movements);
  const title = props.title || 'Forecast movement bridge';
  return <section className={styles.panel} aria-labelledby={headingId}><div className={styles.chartHeader}><div><h2 id={headingId} className={styles.heading}>{title}</h2><p className={styles.insight}>{props.description || 'Contoso expansion adds $1.3M; security and timing remove $1.0M from the period.'}</p></div><ArrowTrendingLines20Regular/></div><svg className={styles.chart} viewBox="0 0 520 190" role="img" aria-label={props.movements ? title : 'Forecast bridge from 8.4 million opening to 8.7 million commit'}><title>{title}</title><desc>D3 scales position opening, positive, negative, and ending values. The table provides the same monetary values.</desc>{[0, 1, 2, 3].map((tick) => <line key={tick} x1="48" x2="494" y1={154 - tick * 38} y2={154 - tick * 38} className={styles.grid}/>) }{bars.map((bar) => <g key={bar.label}><rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx="4" className={bar.kind === 'increase' ? styles.positive : bar.kind === 'decrease' ? styles.negative : styles.neutral}/><text x={bar.x + bar.width / 2} y={bar.y - 7} textAnchor="middle" className={styles.value}>{bar.kind === 'increase' || bar.kind === 'decrease' ? signedMoney(bar.value) : money(bar.value)}</text><text x={bar.x + bar.width / 2} y="176" textAnchor="middle" className={styles.label}>{bar.label}</text></g>)}</svg><table className={styles.table}><thead><tr><th className={styles.cell}>Movement</th><th className={styles.cell}>Impact</th><th className={styles.cell}>Ending position</th></tr></thead><tbody>{bars.map((bar) => <tr key={bar.label}><td className={styles.cell}>{bar.label}</td><td className={styles.cell}>{bar.kind === 'increase' || bar.kind === 'decrease' ? signedMoney(bar.value) : money(bar.value)}</td><td className={styles.cell}>{money(bar.endValue)}</td></tr>)}</tbody></table></section>;
}

export function D3ClosePlanStatus(props: { readonly statuses: readonly { readonly label: string; readonly count: number }[]; readonly compact?: boolean }): React.ReactElement {
  const styles = useStyles();
  const headingId = React.useId();
  type Status = typeof props.statuses[number];
  const total = props.statuses.reduce((sum, item) => sum + item.count, 0);
  const complete = props.statuses.find(item => item.label === 'Complete')?.count || 0;
  const segments = pie<Status>().sort(null).value(item => item.count)([...props.statuses]);
  const shape = arc<PieArcDatum<Status>>().innerRadius(60).outerRadius(88).padAngle(0.035).cornerRadius(5);
  const colors = [tokens.colorPaletteGreenBackground3, tokens.colorBrandBackground, tokens.colorPaletteMarigoldBackground3, tokens.colorPaletteRedBackground3];
  return <section className={mergeClasses(styles.panel, props.compact && styles.compactPanel)} aria-labelledby={headingId}>
    <h2 id={headingId} className={styles.heading}>Close-plan readiness</h2>
    <p className={styles.insight}>Recorded milestone status in the selected owned book, not win probability or delivery authorization.</p>
    <svg className={mergeClasses(styles.ranking, props.compact && styles.compactChart)} viewBox="0 0 440 210" role="img" aria-label={`${complete} of ${total} recorded milestones complete`}>
      <title>Close-plan milestone status</title>
      <g transform="translate(120 104)">
        <circle r="74" fill="none" stroke={tokens.colorNeutralBackground3} strokeWidth="28" />
        {segments.map((segment, index) => segment.value > 0 && <path key={segment.data.label} d={shape(segment) || undefined} fill={colors[index]}><title>{segment.data.label}: {segment.data.count}</title></path>)}
        <text textAnchor="middle" y="0" fill={tokens.colorNeutralForeground1} fontSize="28" fontWeight="700">{complete}/{total}</text>
        <text textAnchor="middle" y="24" fill={tokens.colorNeutralForeground2} fontSize="13">complete</text>
      </g>
      {props.statuses.map((status, index) => <g key={status.label}>
        <rect x="235" y={32 + index * 38} width="14" height="14" rx="4" fill={colors[index]} />
        <text x="259" y={44 + index * 38} fill={tokens.colorNeutralForeground1} fontSize="15">{status.label}</text>
        <text x="409" y={44 + index * 38} textAnchor="end" fill={tokens.colorNeutralForeground1} fontSize="17" fontWeight="700">{status.count}</text>
      </g>)}
    </svg>
    {!total && <p role="status">No recorded close-plan milestones for this scope. Completion was not inferred.</p>}
  </section>;
}

const PIPELINE: readonly IPipelineStage[] = [
  { label: 'Qualify', value: 36, evidence: 54 },
  { label: 'Develop', value: 29, evidence: 63 },
  { label: 'Propose', value: 21, evidence: 71 },
  { label: 'Commit', value: 14, evidence: 84 }
];

export function D3PipelineQuality(props: { readonly opportunities?: readonly IOpportunity[]; readonly compact?: boolean }): React.ReactElement {
  const styles = useStyles();
  const headingId = React.useId();
  const data = props.opportunities ? PIPELINE.map(stage => {
    const records = props.opportunities?.filter(item => item.stage === stage.label) || [];
    return { label: stage.label, value: records.length, evidence: records.length ? Math.round(records.filter(item => HERO_EVIDENCE.some(evidence => evidence.opportunityId === item.id && evidence.kind === 'verified')).length / records.length * 100) : 0 };
  }) : PIPELINE;
  const bars = buildPipelineBars(data);
  const open = props.opportunities ? `$${(props.opportunities.reduce((sum, item) => sum + item.value, 0) / 1000000).toFixed(2)}M` : '$31.8M';
  return <section className={mergeClasses(styles.panel, props.compact && styles.compactPanel)} aria-labelledby={headingId}>
    <div className={styles.chartHeader}><div><h2 id={headingId} className={styles.heading}>Evidence-weighted pipeline</h2><p className={styles.insight}>{props.opportunities ? 'Filtered counts; proof is the percentage of opportunities with at least one verified buyer evidence record.' : 'Illustrative reference: volume narrows toward commit while proof rises from 54% to 84%.'}</p></div><Badge className={styles.chartBadge} appearance="tint">{open} open</Badge></div>
    <svg className={mergeClasses(styles.chart, props.compact && styles.compactChart)} viewBox="0 0 520 210" role="img" aria-label="Pipeline stages by opportunity count and evidence quality">
      <title>Evidence-weighted pipeline</title><desc>D3 band and linear scales size four pipeline stages. Labels give counts and verified-proof coverage, including zero-count stages.</desc>
      {bars.map(bar => <g key={bar.label}>
        <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx="5" fill={bar.evidence >= 80 ? tokens.colorPaletteGreenBackground3 : bar.evidence >= 65 ? tokens.colorBrandBackground : tokens.colorPaletteMarigoldBackground3} />
        <text x={bar.x + bar.width / 2} y={bar.height >= 28 ? bar.y + 21 : bar.y - 8} textAnchor="middle" className={bar.height >= 28 && bar.evidence >= 65 ? styles.onBrandValue : styles.value}>{bar.value}</text>
        <text x={bar.x + bar.width / 2} y="176" textAnchor="middle" className={styles.label}>{bar.label}</text>
        <text x={bar.x + bar.width / 2} y="194" textAnchor="middle" className={styles.value}>{bar.evidence}% proof</text>
      </g>)}
    </svg>
    {!props.compact && <><div className={styles.legend}><span className={styles.legendItem}><i className={mergeClasses(styles.swatch, styles.swatchGreen)}/>Strong buyer evidence (≥80%)</span><span className={styles.legendItem}><i className={styles.swatch}/>Developing evidence (65-79%)</span><span className={styles.legendItem}><i className={mergeClasses(styles.swatch, styles.swatchAmber)}/>Missing / low evidence (&lt;65%)</span></div>
    <details><summary>Exact counts and proof coverage</summary><table className={styles.table}><caption>Filtered pipeline counts and percentage with verified evidence</caption><thead><tr><th className={styles.cell}>Stage</th><th className={styles.cell}>Count</th><th className={styles.cell}>Proof</th></tr></thead><tbody>{data.map(stage => <tr key={stage.label}><th scope="row" className={styles.cell}>{stage.label}</th><td className={styles.cell}>{stage.value}</td><td className={styles.cell}>{stage.evidence}%</td></tr>)}</tbody></table></details></>}
  </section>;
}

const REGIONS: readonly IRegionSignal[] = [
  { id: 'na', label: 'North America', longitude: -100, latitude: 42, value: 12.8, risk: 18 },
  { id: 'emea', label: 'EMEA', longitude: 16, latitude: 49, value: 9.6, risk: 27 },
  { id: 'apac', label: 'APAC', longitude: 116, latitude: 18, value: 6.4, risk: 39 },
  { id: 'latam', label: 'Latin America', longitude: -60, latitude: -15, value: 3.0, risk: 31 }
];

const projection = geoNaturalEarth1().fitExtent([[18, 16], [502, 174]], countries);
const path = geoPath(projection);

export function D3RevenueMap(props: {
  readonly opportunities?: readonly IOpportunity[];
  readonly selectedRegion?: string;
  readonly onSelectRegion?: (id: string) => void;
  readonly regionSignals?: readonly IRegionSignal[];
  readonly metricLabel?: string;
  readonly riskLabel?: string;
  readonly valueDomainMaximum?: number;
}): React.ReactElement {
  const styles = useStyles();
  const headingId = React.useId();
  const [localSelectedId, setLocalSelectedId] = React.useState('emea');
  const selectedId = props.selectedRegion || localSelectedId;
  const setSelectedId = (id: string): void => { setLocalSelectedId(id); props.onSelectRegion?.(id); };
  const regions = props.regionSignals || (props.opportunities ? REGIONS.map(region => {
    const records = props.opportunities?.filter(item => ACCOUNTS.find(account => account.id === item.accountId)?.region === (region.id === 'apac' ? 'Asia Pacific' : region.label)) || [];
    return { ...region, value: records.reduce((sum, item) => sum + item.value, 0) / 1000000, risk: records.length ? Math.round(records.reduce((sum, item) => sum + (1 - item.probability), 0) / records.length * 100) : 0 };
  }) : REGIONS);
  const marks = buildRegionMarks(regions, props.valueDomainMaximum);
  const selected = regions.find(region => region.id === selectedId);
  const measure = props.metricLabel || 'Open opportunity value';
  const uncertainty = props.riskLabel || (props.opportunities ? 'seller-derived uncertainty (1 − probability), not verified slip risk' : 'illustrative slip risk');
  const label = selected ? selected.label : selectedId === 'all' ? 'All regions' : `No region matches ${selectedId}`;
  const value = selected ? selected.value : regions.reduce((sum, region) => sum + region.value, 0);
  return <section className={styles.panel} aria-labelledby={headingId}>
    <div className={styles.chartHeader}><div><h2 id={headingId} className={styles.heading}>{props.metricLabel ? 'Global investment footprint' : 'Global opportunity signals'}</h2><p className={styles.insight}>{label} / {money(value)} {measure.toLowerCase()}.{selected && ` ${selected.risk}% ${uncertainty}.`}</p></div><Globe20Regular/></div>
    {!selected && selectedId !== 'all' && <p role="alert">No matching region is selected. Choose a region below.</p>}
    <svg className={styles.map} viewBox="0 0 520 190" role="img" aria-label={`Global revenue opportunity map with ${label} selected`}>
      <title>{measure} by region</title><desc>Natural Earth geography is projected with D3. Bubble area represents the selected monetary measure. Use the region buttons and exact-value table below.</desc>
      <path d={path(geoGraticule10()) || ''} className={styles.graticule}/><path d={path(countries) || ''} className={styles.land}/>
      {marks.filter(mark => mark.value > 0).map(mark => {
        const projected = projection([mark.longitude, mark.latitude]) || [mark.x, mark.y];
        return <g key={mark.id} onClick={() => setSelectedId(mark.id)}>
          <title>{mark.label}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(mark.value * 1000000)}, {mark.risk}% {uncertainty}</title>
          <circle cx={projected[0]} cy={projected[1]} r={mark.radius + 5} fill={tokens.colorBrandBackground} opacity="0.1" />
          <circle cx={projected[0]} cy={projected[1]} r={mark.radius} fill={props.regionSignals ? tokens.colorBrandBackground : mark.risk >= 35 ? tokens.colorPaletteRedBackground3 : mark.risk >= 25 ? tokens.colorPaletteMarigoldBackground3 : tokens.colorBrandBackground} className={selectedId === mark.id ? styles.selected : undefined}/>
          <text x={projected[0]} y={projected[1] + mark.radius + 14} textAnchor="middle" className={styles.value}>{money(mark.value)}</text>
        </g>;
      })}
    </svg>
    <p className={styles.insight}>Bubble area = {measure.toLowerCase()}. {props.regionSignals ? 'Green = illustrative deployed budget.' : 'Green <25%, amber 25-34%, red ≥35% uncertainty. Zero-value regions have no bubble.'}</p>
    <div className={styles.regionButtons}>{regions.map(region => <Button key={region.id} size="small" aria-pressed={selectedId === region.id} appearance={selectedId === region.id ? 'primary' : 'secondary'} className={mergeClasses(styles.regionButton, selectedId === region.id && styles.regionSelected)} onClick={() => setSelectedId(region.id)}>{region.label}</Button>)}</div>
    <table className={styles.table}><caption>{measure} / USD / {props.regionSignals ? 'illustrative investment assumptions' : 'offline opportunity catalog'}</caption><thead><tr><th className={styles.cell}>Region</th><th className={styles.cell}>{props.metricLabel ? 'Deployed' : 'Open value'}</th><th className={styles.cell}>{props.regionSignals ? 'Utilized' : 'Uncertainty'}</th></tr></thead><tbody>{regions.map(region => <tr key={region.id}><th scope="row" className={styles.cell}>{region.label}</th><td className={styles.cell}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(region.value * 1000000)}</td><td className={styles.cell}>{region.risk}%</td></tr>)}</tbody></table>
  </section>;
}
