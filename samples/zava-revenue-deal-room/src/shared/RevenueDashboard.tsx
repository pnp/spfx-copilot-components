import * as React from 'react';
import { Badge, Button, Field, ProgressBar, Select, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowTrending20Regular, Globe20Regular, Money20Regular, ShieldCheckmark20Regular } from '@fluentui/react-icons';
import { scaleBand, scaleLinear } from 'd3-scale';
import { ACCOUNTS, type IOpportunity } from './domain';
import { getDealStore } from './dealWorkflow';
import { currency } from './operations';
import { MAP_MAXIMUM_MILLIONS, PORTFOLIO_REGIONS, investmentSignals, portfolioOpportunities, regionalInvestments, type PortfolioPeriod } from './portfolio';
import { D3RevenueMap } from './visualizations/RevenueCharts';

const useStyles = makeStyles({
  root: { minWidth: 0, marginTop: tokens.spacingVerticalL },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: tokens.spacingHorizontalL, flexWrap: 'wrap', marginBottom: tokens.spacingVerticalL },
  title: { margin: '4px 0', fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, letterSpacing: '-.4px' },
  eyebrow: { fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold, letterSpacing: '1.2px', color: tokens.colorBrandForeground1 },
  muted: { color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300, margin: '6px 0' },
  filters: { display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, marginBottom: tokens.spacingVerticalXL, '@media(max-width: 1000px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, '@media(max-width: 420px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  kpi: { minWidth: 0, padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`, borderRight: `1px solid ${tokens.colorNeutralStroke2}` },
  kpiTitle: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 },
  value: { display: 'block', marginTop: tokens.spacingVerticalS, fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, letterSpacing: '-1.1px', fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: 'tabular-nums' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, .85fr)', gap: tokens.spacingHorizontalXL, '@media(max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  panel: { minWidth: 0, padding: tokens.spacingVerticalXL, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, backgroundColor: tokens.colorNeutralBackground1 },
  mapPanel: { minWidth: 0 },
  mapTabs: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalM },
  allocation: { display: 'grid', gap: tokens.spacingVerticalXL, marginTop: tokens.spacingVerticalXL },
  allocationHeading: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalS },
  tableContainer: { overflowX: 'auto', marginTop: tokens.spacingVerticalXL },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: tokens.fontSizeBase200, fontVariantNumeric: 'tabular-nums' },
  cell: { textAlign: 'left', padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalS}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  right: { textAlign: 'right' },
  lower: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: tokens.spacingHorizontalXL, marginTop: tokens.spacingVerticalXL, '@media(max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  chart: { display: 'block', width: '100%', height: '210px', marginTop: tokens.spacingVerticalL },
  axisLabel: { fill: tokens.colorNeutralForeground2, fontSize: '11px' },
  chartValue: { fill: tokens.colorNeutralForeground1, fontSize: '12px', fontWeight: tokens.fontWeightSemibold },
  legend: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalL, marginTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  swatch: { display: 'inline-block', width: '10px', height: '10px', marginRight: tokens.spacingHorizontalXS, backgroundColor: tokens.colorBrandBackground },
  swatchPale: { backgroundColor: tokens.colorBrandBackground2, border: `1px solid ${tokens.colorBrandStroke2}` },
  opportunity: { padding: `${tokens.spacingVerticalM} 0`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalS },
  compactValue: { fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }
});
const compact = (value: number): string => `$${(value / 1000000).toFixed(2)}M`;

export function PipelineValueChart(props: { readonly opportunities: readonly IOpportunity[] }): React.ReactElement {
  const styles = useStyles();
  const id = React.useId();
  const stages = ['Qualify', 'Develop', 'Propose', 'Commit'].map(label => {
    const records = props.opportunities.filter(item => item.stage === label);
    return { label, value: records.reduce((sum, item) => sum + item.value, 0), weighted: records.reduce((sum, item) => sum + item.value * item.probability, 0) };
  });
  const x = scaleBand().domain(stages.map(stage => stage.label)).range([30, 490]).padding(0.4);
  const y = scaleLinear().domain([0, Math.max(1, ...stages.map(stage => stage.value)) * 1.25]).range([160, 15]);
  return <section className={styles.panel} aria-labelledby={id}>
    <span className={styles.eyebrow}>QUALITY OF GROWTH</span><h3 id={id}>What is behind the pipeline?</h3>
    <p className={styles.muted}>Open value versus seller-weighted value, by stage. Probability is seller judgment, not verified buyer proof.</p>
    <svg className={styles.chart} viewBox="0 0 520 200" role="img" aria-label="Open and seller-weighted pipeline value by stage">
      <title>Pipeline value and weighted outlook</title><desc>Background bars are open contract value. Foreground bars apply seller probability. Exact figures follow in the table.</desc>
      {stages.map(stage => <g key={stage.label}><rect x={x(stage.label)} y={y(stage.value)} width={x.bandwidth()} height={160 - y(stage.value)} rx="4" fill={tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke2} /><rect x={x(stage.label)} y={y(stage.weighted)} width={x.bandwidth()} height={160 - y(stage.weighted)} rx="4" fill={tokens.colorBrandBackground} /><text x={(x(stage.label) || 0) + x.bandwidth() / 2} y={y(stage.value) - 8} textAnchor="middle" className={styles.chartValue}>{compact(stage.value)}</text><text x={(x(stage.label) || 0) + x.bandwidth() / 2} y="184" textAnchor="middle" className={styles.axisLabel}>{stage.label}</text></g>)}
    </svg>
    <div className={styles.legend}><span><i className={mergeClasses(styles.swatch, styles.swatchPale)} />Open pipeline</span><span><i className={styles.swatch} />Seller-weighted outlook</span></div>
    <details><summary>Exact pipeline values</summary><div className={styles.tableContainer}><table className={styles.table}><caption>Filtered pipeline, USD</caption><thead><tr><th className={styles.cell}>Stage</th><th className={styles.cell}>Open</th><th className={styles.cell}>Weighted</th></tr></thead><tbody>{stages.map(stage => <tr key={stage.label}><th className={styles.cell} scope="row">{stage.label}</th><td className={styles.cell}>{currency(stage.value)}</td><td className={styles.cell}>{currency(stage.weighted)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
export default function RevenueDashboard(props: {
  readonly onStateChange: (state: Readonly<Record<string, unknown>>) => void;
  readonly initialState?: Readonly<Record<string, unknown>>;
}): React.ReactElement {
  const styles = useStyles();
  const [period, setPeriod] = React.useState<PortfolioPeriod>(props.initialState?.period === 'next' ? 'next' : props.initialState?.period === 'all' ? 'all' : 'current');
  const [region, setRegion] = React.useState(PORTFOLIO_REGIONS.find(item => item.region === props.initialState?.region)?.region || 'all');
  const [metric, setMetric] = React.useState<'pipeline' | 'investment'>(props.initialState?.metric === 'investment' ? 'investment' : 'pipeline');
  const [store] = React.useState(getDealStore);
  const requests = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const opportunities = portfolioOpportunities(period, region);
  const investments = regionalInvestments(period, region);
  const open = opportunities.reduce((sum, item) => sum + item.value, 0);
  const weighted = opportunities.reduce((sum, item) => sum + item.value * item.probability, 0);
  const deployed = investments.reduce((sum, item) => sum + item.deployed, 0);
  const budget = investments.reduce((sum, item) => sum + item.budget, 0);
  const scopedRequests = requests.requests.filter(request => region === 'all' || ACCOUNTS.find(account => account.id === request.draft.accountId)?.region === region);
  const pending = scopedRequests.filter(request => request.status === 'pending').length;
  const selectedRegion = PORTFOLIO_REGIONS.find(item => item.region === region)?.id;
  const state = JSON.stringify({
    view: 'global-revenue-investment-dashboard', period, region, metric, opportunityCount: opportunities.length,
    openValue: open, weightedValue: weighted, investmentDeployed: deployed, investmentBudget: budget, pendingRequests: pending,
    visibleOpportunityIds: opportunities.map(item => item.id),
    semantics: 'Offline catalog calculations and GTM planning budgets. Session requests are a separate overlay, not CRM pipeline.'
  });
  React.useEffect(() => { props.onStateChange(JSON.parse(state)); }, [state, props.onStateChange]);
  return <section className={styles.root} data-layout="revenue-command-dashboard" aria-label="Global revenue and investment dashboard">
    {requests.storageWarning && <p role="alert">{requests.storageWarning}</p>}
    <div className={styles.toolbar}><div><span className={styles.eyebrow}>REVENUE INTELLIGENCE / WORLDWIDE</span><h2 className={styles.title}>See the opportunity. Direct the investment.</h2><p className={styles.muted}>One portfolio, connected signals, accountable next moves.</p></div><div className={styles.filters}>
      <Field label="Dashboard period"><Select value={period} onChange={event => { const value = event.target.value; if (value === 'current' || value === 'next' || value === 'all') setPeriod(value); }}><option value="current">Current quarter</option><option value="next">Next quarter</option><option value="all">All opportunity periods</option></Select></Field>
      <Field label="Dashboard region"><Select value={region} onChange={event => setRegion(event.target.value)}><option value="all">All regions</option>{PORTFOLIO_REGIONS.map(item => <option key={item.id}>{item.region}</option>)}</Select></Field>
    </div></div>
    <div className={styles.kpis}>
      <div className={styles.kpi}><span className={styles.kpiTitle}><Globe20Regular />Open pipeline</span><strong className={styles.value}>{compact(open)}</strong><p className={styles.muted}>{opportunities.length} filtered opportunities</p></div>
      <div className={styles.kpi}><span className={styles.kpiTitle}><ArrowTrending20Regular />Weighted outlook</span><strong className={styles.value}>{compact(weighted)}</strong><p className={styles.muted}>{open ? (weighted / open * 100).toFixed(0) : '0'}% seller-weighted / not commit</p></div>
      <div className={styles.kpi}><span className={styles.kpiTitle}><Money20Regular />GTM investment deployed</span><strong className={styles.value}>{compact(deployed)}</strong><ProgressBar value={budget ? deployed / budget : 0} aria-label="Illustrative investment budget utilization" /><p className={styles.muted}>{compact(budget)} planned / illustrative</p></div>
      <div className={styles.kpi}><span className={styles.kpiTitle}><ShieldCheckmark20Regular />Awaiting a decision</span><strong className={styles.value}>{pending < 10 ? `0${pending}` : pending}</strong><p className={styles.muted}>Regional requests / all submission dates</p></div>
    </div>
    <div className={styles.grid}>
      <div className={styles.mapPanel}><div className={styles.mapTabs}><Button aria-pressed={metric === 'pipeline'} appearance={metric === 'pipeline' ? 'primary' : 'secondary'} onClick={() => setMetric('pipeline')}>Opportunity value</Button><Button aria-pressed={metric === 'investment'} appearance={metric === 'investment' ? 'primary' : 'secondary'} onClick={() => setMetric('investment')}>GTM investment</Button>{region !== 'all' && <Button onClick={() => setRegion('all')}>Clear geographic focus</Button>}</div>
        <D3RevenueMap opportunities={portfolioOpportunities(period, 'all')} selectedRegion={selectedRegion || 'all'} onSelectRegion={id => setRegion(PORTFOLIO_REGIONS.find(item => item.id === id)?.region || 'all')} regionSignals={metric === 'investment' ? investmentSignals(period) : undefined} metricLabel={metric === 'investment' ? 'GTM investment deployed' : undefined} riskLabel={metric === 'investment' ? 'budget utilized' : undefined} valueDomainMaximum={MAP_MAXIMUM_MILLIONS[metric]} />
        <p className={styles.muted}>Bubble scale stays fixed across periods within each monetary measure, so smaller investments visibly shrink.</p>
      </div>
      <section className={styles.panel} aria-label="Regional investment allocation"><span className={styles.eyebrow}>CAPITAL WITH A PURPOSE</span><h3>Fund the next wave of growth.</h3><p className={styles.muted}>Illustrative regional go-to-market budgets. Not investment returns or customer-approved spend.</p>
        <div className={styles.allocation}>{investments.map(plan => <div key={plan.id}><div className={styles.allocationHeading}><strong>{plan.label}</strong><Badge appearance="tint">{Math.round(plan.deployed / plan.budget * 100)}% deployed</Badge></div><ProgressBar value={plan.deployed / plan.budget} aria-label={`${plan.label} budget utilization`} /><p className={styles.muted}>{currency(plan.deployed)} deployed / {currency(plan.budget)} planned</p></div>)}</div>
        <p className={styles.muted}>“All opportunity periods” includes the current and next-quarter investment plans only. Requests do not alter these illustrative budgets.</p>
      </section>
    </div>
    <div className={styles.lower}><PipelineValueChart opportunities={opportunities} /><section className={styles.panel} aria-label="Highest value regional opportunities"><span className={styles.eyebrow}>WHERE TO FOCUS</span><h3>Largest opportunities in view</h3><p className={styles.muted}>Ranked by open value, not an AI recommendation. Buyer-proof gaps still require inspection.</p>{[...opportunities].sort((a, b) => b.value - a.value).slice(0, 5).map(item => <div key={item.id} className={styles.opportunity}><span><strong>{item.name}</strong><p className={styles.muted}>{item.id} / {item.stage} / {(item.probability * 100).toFixed(0)}% seller probability</p></span><span className={styles.compactValue}>{compact(item.value)}</span></div>)}{!opportunities.length && <p role="status">No opportunities match these filters. Clear the regional focus or change period.</p>}</section></div>
  </section>;
}
