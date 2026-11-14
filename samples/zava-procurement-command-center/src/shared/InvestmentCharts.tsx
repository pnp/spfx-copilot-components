import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { WORLD_LAND } from './worldLand';
import { commitmentTrend, investmentTotals, type IInvestment, type InvestmentRegion } from './portfolio';
import { money } from './domain';

const useStyles = makeStyles({
  svg: { display: 'block', width: '100%', height: 'auto' },
  map: { backgroundImage: `linear-gradient(150deg, ${tokens.colorNeutralBackground1}, ${tokens.colorBrandBackground2})`, borderRadius: tokens.borderRadiusLarge },
  label: { fill: tokens.colorNeutralForeground2, fontSize: '11px', fontWeight: 600 },
  tick: { fill: tokens.colorNeutralForeground3, fontSize: '11px' },
  mark: { cursor: 'pointer', ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '4px' } },
  muted: { color: tokens.colorNeutralForeground3, fontSize: '11px', lineHeight: '1.6' },
  legend: { display: 'flex', gap: '16px', flexWrap: 'wrap', color: tokens.colorNeutralForeground2, fontSize: '11px', marginTop: '12px' },
  scroll: { maxWidth: '100%', overflowX: 'auto' },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: '11px', '& td, & th': { padding: '8px', textAlign: 'left', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` } },
  disclosure: { fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '10px 0' }
});
const projection = geoEqualEarth().fitExtent([[16, 12], [744, 342]], { type: 'Sphere' });
const path = geoPath(projection);
const landPath = path(WORLD_LAND) || '';
const graticulePath = path(geoGraticule10()) || '';
export function InvestmentMap({ records, region, onRegion }: {
  readonly records: readonly IInvestment[];
  readonly region: string;
  readonly onRegion: (region: InvestmentRegion) => void;
}): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const radius = scaleSqrt().domain([0, 1650000]).range([3, 13]);
  const visible = records.filter(record => region === 'Global' || record.region === region);
  const totals = investmentTotals(visible);
  return <div data-chart="global-investment-map">
    <svg className={`${s.svg} ${s.map}`} viewBox="0 0 760 354" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Global procurement investment map</title>
      <desc id={`${id}-desc`}>Natural Earth land in an Equal Earth projection. Circle size represents EUR reporting budget. Select a location to filter its region. The adjacent program ledger provides exact values and keyboard alternatives.</desc>
      <path d={graticulePath} fill="none" stroke={tokens.colorNeutralStroke2} strokeWidth=".5" />
      <path d={landPath} fill={tokens.colorNeutralStroke1} stroke={tokens.colorNeutralBackground1} strokeWidth=".6" />
      {records.map(record => {
        const point = projection([record.coordinates[0], record.coordinates[1]]);
        if (!point) throw new Error(`Investment coordinates could not be projected: ${record.id}`);
        const active = region === 'Global' || record.region === region;
        return <g key={record.id} role="button" tabIndex={0} className={s.mark} aria-label={`Show ${record.region}: ${record.location}, ${money(record.budget)} budget`} onClick={() => onRegion(record.region)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRegion(record.region); } }}>
          <title>{record.location}: {record.name}. Budget {money(record.budget)}; committed {money(record.committed)}.</title>
          <circle cx={point[0]} cy={point[1]} r={radius(record.budget) + 5} fill={active ? tokens.colorBrandBackground : tokens.colorNeutralForegroundDisabled} opacity=".13" />
          <circle cx={point[0]} cy={point[1]} r={radius(record.budget)} fill={active ? tokens.colorBrandBackground : tokens.colorNeutralForegroundDisabled} stroke={tokens.colorNeutralBackground1} strokeWidth="2" />
          <circle cx={point[0]} cy={point[1]} r="2.2" fill={tokens.colorNeutralForegroundOnBrand} />
        </g>;
      })}
      {([
        ['AMER', [-115, 54]], ['EMEA', [35, 64]], ['APAC', [112, 48]], ['LATAM', [-70, -43]]
      ] as const).map(([label, coordinates]) => {
        const point = projection([coordinates[0], coordinates[1]]);
        return point ? <text className={s.label} x={point[0]} y={point[1]} textAnchor="middle" key={label}>{label}</text> : null;
      })}
    </svg>
    <div className={s.legend}><span>Circle area: planned EUR budget</span><span>Highlighted: {region === 'Global' ? 'all regions' : region}</span><span>8 fictional operating sites</span></div>
    <p className={s.muted}>{visible.length} programs / {money(totals.committed)} committed against {money(totals.budget)} planned. Geography is contextual, not a legal boundary statement. All reporting budgets are authored in EUR; no FX conversion is implied.</p>
  </div>;
}
export function CommitmentTrend({ records }: { readonly records: readonly IInvestment[] }): React.ReactElement {
  const s = useStyles();
  const id = React.useId();
  const data = commitmentTrend(records);
  const x = scaleLinear().domain([0, 5]).range([66, 600]);
  const y = scaleLinear().domain([0, Math.max(1, ...data.map(item => item.planned))]).nice().range([192, 22]);
  const actual = line<typeof data[number]>().x((_, index) => x(index)).y(item => y(item.committed)).curve(curveMonotoneX)(data) || '';
  const plan = line<typeof data[number]>().x((_, index) => x(index)).y(item => y(item.planned)).curve(curveMonotoneX)(data) || '';
  const fill = area<typeof data[number]>().x((_, index) => x(index)).y0(192).y1(item => y(item.committed)).curve(curveMonotoneX)(data) || '';
  const totals = investmentTotals(records);
  return <div data-chart="commitment-trend">
    <svg className={s.svg} viewBox="0 0 640 228" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Six-week cumulative commitments against plan</title>
      <desc id={`${id}-desc`}>Solid line: modeled cumulative commitments. Dashed line: linear budget plan. These are deterministic scenario weeks, not live financial forecasts. Exact figures are available below.</desc>
      {y.ticks(4).map(tick => <g key={tick}><line x1="66" x2="600" y1={y(tick)} y2={y(tick)} stroke={tokens.colorNeutralStroke2} strokeDasharray="2 5" /><text className={s.tick} x="56" y={y(tick) + 4} textAnchor="end">{tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}m` : `${Math.round(tick / 1000)}k`}</text></g>)}
      <path d={fill} fill={tokens.colorBrandBackground} opacity=".08" />
      <path d={plan} stroke={tokens.colorNeutralForeground3} strokeDasharray="6 5" strokeWidth="2" fill="none" />
      <path d={actual} stroke={tokens.colorBrandForeground1} strokeWidth="3" fill="none" />
      {data.map((item, index) => <g key={item.week}><circle cx={x(index)} cy={y(item.committed)} r="4" fill={tokens.colorBrandBackground} stroke={tokens.colorNeutralBackground1} strokeWidth="2" /><text className={s.tick} x={x(index)} y="216" textAnchor="middle">{item.week}</text></g>)}
    </svg>
    <div className={s.legend}><span>Solid / committed EUR</span><span>Dashed / planned EUR</span></div>
    <p className={s.muted}>{Math.round(totals.committed / Math.max(1, totals.budget) * 100)}% of the scoped budget is committed. Commitment is not delivery or realized saving.</p>
    <details><summary className={s.disclosure}>Exact weekly commitments and plan</summary><div className={s.scroll} tabIndex={0} role="region" aria-label="Weekly commitment figures"><table className={s.table}><thead><tr><th scope="col">Week</th><th scope="col">Plan</th><th scope="col">Committed</th></tr></thead><tbody>{data.map(item => <tr key={item.week}><th scope="row">{item.week}</th><td>{money(item.planned)}</td><td>{money(item.committed)}</td></tr>)}</tbody></table></div></details>
  </div>;
}
