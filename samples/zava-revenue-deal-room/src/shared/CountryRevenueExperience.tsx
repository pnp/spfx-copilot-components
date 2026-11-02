import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { geoGraticule10, geoPath } from 'd3-geo';
import { ACCOUNTS, type IOpportunity } from './domain';
import {
  COUNTRY_PERIODS, COUNTRY_REGIONS, COUNTRY_REVENUE_PROVENANCE,
  countryForAccount, countryMetricValue, countryMoney, countryPage, countryRevenueScope, countryShortMoney,
  type CountryRevenueMetric, type ICountryRevenueTotal
} from './countryRevenue';
import {
  REVENUE_WORLD_COUNTRIES, countryWorldProjection, focusedCountryProjection, worldCountry, worldCountryPath
} from './visualizations/worldGeography';

export interface ICountryRevenueExperienceProps {
  readonly opportunities: readonly IOpportunity[];
  readonly period: string;
  readonly region: string;
  readonly initialCountryId?: string;
  readonly initialMetric?: CountryRevenueMetric;
  readonly compact?: boolean;
  readonly onStateChange: (state: Readonly<Record<string, unknown>>) => void;
  readonly onInspectOpportunity: (id: string) => void;
  readonly onScopeChange?: (period: string, region: string) => void;
}

const useStyles = makeStyles({
  body: { minWidth: 0, display: 'grid', rowGap: '6px', color: tokens.colorNeutralForeground1 },
  compact: { rowGap: '6px' },
  controls: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' },
  modes: { display: 'flex', gap: '4px' },
  control: { minWidth: 0, maxWidth: '100%', minHeight: '32px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1, padding: '4px 6px', fontSize: '12px', flex: '1 1 200px' },
  heading: { margin: 0, fontSize: '20px', lineHeight: '26px', letterSpacing: '-0.4px', '@media(max-width: 520px)': { fontSize: '18px', lineHeight: '24px' } },
  summary: { margin: 0, fontSize: '12px', lineHeight: '17px', color: tokens.colorNeutralForeground2 },
  amount: { fontSize: '25px', lineHeight: '31px', fontWeight: 700, letterSpacing: '-0.6px', color: tokens.colorBrandForeground1 },
  spendAmount: { color: tokens.colorPaletteGreenForeground1 },
  map: { display: 'block', width: '100%', height: '190px', borderRadius: '10px', backgroundColor: '#10263c', '@media(max-width: 520px)': { height: '170px' } },
  expandedMap: { height: '320px', '@media(max-width: 520px)': { height: '220px' } },
  countryMap: { display: 'block', width: '100%', height: '130px', borderRadius: '10px', backgroundColor: '#10263c' },
  expandedCountryMap: { height: '220px' },
  mapButton: { cursor: 'pointer', outlineStyle: 'none', '&:focus-visible path': { stroke: '#ffd978', strokeWidth: '3px' }, '&:focus-visible circle': { stroke: '#ffd978', strokeWidth: '3px' }, '&:hover path': { stroke: '#ffd978', strokeWidth: '1.5px' } },
  legend: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: '10px', rowGap: '3px', fontSize: '11px', lineHeight: '15px', color: tokens.colorNeutralForeground2 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  swatch: { display: 'inline-block', width: '10px', height: '10px', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12px', lineHeight: '16px' },
  cell: { textAlign: 'left', padding: '3px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, overflowWrap: 'anywhere', verticalAlign: 'middle' },
  valueCell: { textAlign: 'right', width: '35%', paddingLeft: '6px' },
  rowButton: { border: 'none', backgroundColor: 'transparent', color: tokens.colorBrandForegroundLink, textAlign: 'left', font: 'inherit', padding: '3px 0', cursor: 'pointer', minHeight: '24px', '&:focus-visible': { outline: `2px solid ${tokens.colorBrandStroke1}`, outlineOffset: '2px' } },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' },
  pageLabel: { fontSize: '11px', lineHeight: '15px', color: tokens.colorNeutralForeground2 },
  note: { margin: 0, fontSize: '11px', lineHeight: '15px', color: tokens.colorNeutralForeground2, overflowWrap: 'anywhere' },
  detailHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' },
  records: { display: 'grid', gap: '6px' },
  record: { border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '7px', padding: '7px 9px', minWidth: 0 },
  recordTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' },
  recordTitle: { fontSize: '12px', fontWeight: 600, lineHeight: '16px', margin: 0, overflowWrap: 'anywhere' },
  recordMeta: { margin: '3px 0 0', fontSize: '11px', lineHeight: '15px', color: tokens.colorNeutralForeground2, overflowWrap: 'anywhere' },
  empty: { padding: '12px', border: `1px dashed ${tokens.colorNeutralStroke1}`, borderRadius: '8px', fontSize: '12px', lineHeight: '18px' },
  recovery: { border: `1px solid ${tokens.colorPaletteMarigoldBorder1}`, borderRadius: '8px', padding: '12px', display: 'grid', gap: '8px' }
});

const periodLabel = (period: string): string => period === 'current' ? 'Current quarter' : period === 'next' ? 'Next quarter' : 'All recorded periods';
const opportunityColors = ['#203d55', '#b8daf4', '#71b7ed', '#2e80c9', '#135597'];
const opportunityBreaks = [1000000, 5000000, 10000000];
const opportunityFill = (value: number): string => value === 0 ? opportunityColors[0] : opportunityColors[1 + opportunityBreaks.filter(boundary => value >= boundary).length];
const bubbleRadius = (value: number): number => 26 * Math.sqrt(value / 1030000);
const metricName = (metric: CountryRevenueMetric): string => metric === 'opportunity' ? 'Open opportunity value' : 'Recorded DEMO spend';

export default function CountryRevenueExperience(props: ICountryRevenueExperienceProps): React.ReactElement {
  const styles = useStyles();
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [selectedCountryId, setSelectedCountryId] = React.useState(props.initialCountryId || '');
  const [metric, setMetric] = React.useState<CountryRevenueMetric>(props.initialMetric || 'opportunity');
  const [page, setPage] = React.useState(0);
  const [recovery, setRecovery] = React.useState<{ requestedPeriod: string; requestedRegion: string; period: string; region: string }>();
  const [scopeChangeRequest, setScopeChangeRequest] = React.useState<{ sourcePeriod: string; sourceRegion: string; period: string; region: string }>();
  const activeRecovery = !props.onScopeChange && recovery?.requestedPeriod === props.period && recovery.requestedRegion === props.region ? recovery : undefined;
  const period = activeRecovery?.period || props.period;
  const region = activeRecovery?.region || props.region;
  const scope = React.useMemo(() => countryRevenueScope(props.opportunities, period, region), [props.opportunities, period, region]);
  React.useEffect(() => { setSelectedCountryId(props.initialCountryId || ''); setPage(0); }, [props.initialCountryId]);
  React.useEffect(() => { setMetric(props.initialMetric || 'opportunity'); setPage(0); }, [props.initialMetric]);
  React.useEffect(() => { setPage(0); }, [period, region]);
  const selected = scope.countries.find(country => country.id === selectedCountryId);
  const missingCountry = Boolean(selectedCountryId && !selected);
  const missingGeometry = scope.countries.filter(country => !worldCountry(country.atlasId));
  const invalid = !scope.valid || missingCountry || missingGeometry.length > 0;
  const orderedCountries = React.useMemo(() => [...scope.countries].sort((a, b) => countryMetricValue(b, metric) - countryMetricValue(a, metric) || a.name.localeCompare(b.name)), [scope.countries, metric]);
  const countryOpportunities = React.useMemo(() => selected ? scope.opportunities.filter(item => countryForAccount(item.accountId)?.id === selected.id).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id)) : [], [scope.opportunities, selected]);
  const countryExpenses = React.useMemo(() => selected ? scope.expenses.filter(item => item.countryId === selected.id).sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id)) : [], [scope.expenses, selected]);
  const emptySpend = !invalid && metric === 'spend' && (selected ? countryExpenses.length : scope.expenses.length) === 0;
  const overviewPage = countryPage(orderedCountries, page);
  const opportunityPage = countryPage(countryOpportunities, page);
  const compactExpensePageCount = Math.max(1, countryExpenses.length);
  const compactExpensePage = Math.min(compactExpensePageCount - 1, Math.max(0, Number.isFinite(page) ? Math.floor(page) : 0));
  const expensePage = props.compact ? {
    page: compactExpensePage,
    pageCount: compactExpensePageCount,
    records: countryExpenses.slice(compactExpensePage, compactExpensePage + 1),
    originalCount: countryExpenses.length
  } : countryPage(countryExpenses, page);
  const activePage = selected ? metric === 'opportunity' ? opportunityPage : expensePage : overviewPage;
  const visibleOpportunities = !invalid && selected && metric === 'opportunity' ? opportunityPage.records : [];
  const visibleExpenses = !invalid && selected && metric === 'spend' ? expensePage.records : [];
  const stage = invalid ? 'recovery' : emptySpend ? 'empty-spend' : selected ? 'country-detail' : 'country-overview';
  const selectCountry = (id: string): void => { setSelectedCountryId(id); setPage(0); };
  const changeMetric = (value: CountryRevenueMetric): void => { setMetric(value); setPage(0); };
  const recoverScope = (nextPeriod: string, nextRegion: string): void => {
    setPage(0);
    if (props.onScopeChange) {
      setRecovery(undefined);
      setScopeChangeRequest({ sourcePeriod: props.period, sourceRegion: props.region, period: nextPeriod, region: nextRegion });
      props.onScopeChange(nextPeriod, nextRegion);
    } else {
      setScopeChangeRequest(undefined);
      setRecovery({ requestedPeriod: props.period, requestedRegion: props.region, period: nextPeriod, region: nextRegion });
    }
  };
  const snapshot: Readonly<Record<string, unknown>> = {
    view: 'country-revenue',
    stage, metric, page: invalid || emptySpend ? 1 : activePage.page + 1, pageCount: invalid || emptySpend ? 1 : activePage.pageCount,
    selectedCountryId: selectedCountryId || null,
    requestedScope: { period: props.period, region: props.region },
    scope: { period, region, recoveredExplicitly: Boolean(activeRecovery), valid: !invalid },
    scopeControl: props.onScopeChange ? 'parent-controlled' : 'internal-recovery',
    scopeChangeRequest: props.onScopeChange && scopeChangeRequest?.sourcePeriod === props.period && scopeChangeRequest.sourceRegion === props.region &&
      (scopeChangeRequest.period !== props.period || scopeChangeRequest.region !== props.region)
      ? { period: scopeChangeRequest.period, region: scopeChangeRequest.region } : null,
    visibleFields: invalid ? ['scope recovery', 'country selector'] : emptySpend
      ? ['metric', 'country selector', 'period', 'region', 'recorded spend USD', 'recorded expense count', 'opportunity value USD', 'opportunity count', 'empty expense ledger notice', 'scope recovery', 'provenance']
      : selected
      ? ['country', 'metric', 'country total USD', 'country record count', 'country geography', props.compact && metric === 'spend' ? 'one-record detail page' : 'two-record detail page', 'record IDs', 'provenance',
        ...(metric === 'opportunity' ? ['opportunity name', 'account name', 'account ID', 'stage', 'open value USD', 'inspect visible opportunity'] : ['expense category', 'recorded amount USD', 'recorded week', 'description', 'recorded DEMO status'])]
      : ['metric', 'country selector', 'scoped total USD', 'country boundaries', 'fixed legend', 'country totals USD', 'country record counts', 'two-country ranking page', 'provenance'],
    chart: invalid || emptySpend ? null : {
      kind: metric === 'opportunity' ? 'country-choropleth' : 'country-spend-bubbles',
      focus: selected ? 'selected-country' : 'overview',
      unit: 'USD',
      data: invalid ? [] : (selected ? [selected] : orderedCountries).map(country => ({
        countryId: country.id, countryName: country.name, region: country.region,
        value: countryMetricValue(country, metric),
        recordCount: metric === 'opportunity' ? country.opportunityCount : country.expenseCount
      })),
      originalCountryCount: scope.countries.length,
      visibleCountryIds: invalid ? [] : selected ? [selected.id] : orderedCountries.map(country => country.id),
      visibleRankingCountryIds: invalid || selected ? [] : overviewPage.records.map(country => country.id),
      scale: metric === 'opportunity'
        ? { kind: 'fixed-threshold', thresholdsUSD: opportunityBreaks, zero: 'zero supplied opportunity value', unassigned: 'no demo headquarters catalog' }
        : { kind: 'area-proportional', referenceUSD: 1030000, referenceRadius: 26, zero: 'no recorded expenses' }
    },
    scopedTotals: {
      opportunityValue: scope.opportunityValue, opportunityCount: scope.opportunities.length,
      recordedSpend: scope.recordedSpend, expenseCount: scope.expenses.length,
      countryCount: scope.countries.length, suppliedOpportunityCount: scope.suppliedOpportunityCount
    },
    opportunitySummary: emptySpend ? {
      unit: 'USD',
      value: scope.opportunityValue,
      originalRecordCount: scope.opportunities.length,
      countryTotals: scope.countries.map(country => ({
        countryId: country.id, countryName: country.name,
        opportunityValue: country.opportunityValue, opportunityCount: country.opportunityCount
      }))
    } : null,
    selectedCountryDetail: selected && !invalid ? {
      countryId: selected.id, countryName: selected.name, region: selected.region,
      attribution: 'Fictional DEMO account headquarters, not rollout destination',
      opportunityValue: selected.opportunityValue, opportunityCount: selected.opportunityCount,
      recordedSpend: selected.spend, expenseCount: selected.expenseCount,
      expenseCategoryTotals: Array.from(new Set(countryExpenses.map(item => item.category))).map(category => ({
        category, amount: countryExpenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0)
      }))
    } : null,
    visibleOpportunityIds: visibleOpportunities.map(item => item.id),
    visibleOpportunities: visibleOpportunities.map(item => ({
      ...item, accountName: ACCOUNTS.find(account => account.id === item.accountId)?.name, countryId: selected?.id
    })),
    visibleSpendIds: visibleExpenses.map(item => item.id),
    visibleExpenses,
    visibleRecordOriginalCount: invalid || emptySpend ? 0 : selected ? metric === 'opportunity' ? countryOpportunities.length : countryExpenses.length : 0,
    issues: [...scope.issues, ...(missingCountry ? [`Country "${selectedCountryId}" is unknown or outside the selected region.`] : []), ...missingGeometry.map(country => `No offline geometry for ${country.id}.`)].slice(0, 4),
    issueCount: scope.issues.length + (missingCountry ? 1 : 0) + missingGeometry.length,
    provenance: COUNTRY_REVENUE_PROVENANCE
  };
  const publish = React.useRef(props.onStateChange);
  React.useEffect(() => { publish.current = props.onStateChange; }, [props.onStateChange]);
  const publishedKey = React.useRef('');
  // Page arrays are small; deduplication prevents context callbacks from causing render loops.
  const snapshotKey = JSON.stringify(snapshot);
  React.useEffect(() => {
    if (publishedKey.current !== snapshotKey) { publishedKey.current = snapshotKey; publish.current(snapshot); }
  }, [snapshot, snapshotKey]);

  const total = selected ? countryMetricValue(selected, metric) : metric === 'opportunity' ? scope.opportunityValue : scope.recordedSpend;
  const count = selected ? metric === 'opportunity' ? selected.opportunityCount : selected.expenseCount : metric === 'opportunity' ? scope.opportunities.length : scope.expenses.length;
  const projection = countryWorldProjection();
  const path = geoPath(projection);
  const leaders = orderedCountries.filter(country => countryMetricValue(country, metric) > 0).slice(0, 3);
  const focusedGeometry = selected ? worldCountry(selected.atlasId) : undefined;
  const focusedProjection = focusedGeometry ? focusedCountryProjection(focusedGeometry) : undefined;
  const recordLabel = metric === 'opportunity' ? 'opportunities' : 'ledger entries';

  function countryControl(country: ICountryRevenueTotal): string {
    return `Open ${country.name}: ${countryMoney(countryMetricValue(country, metric))} ${metricName(metric)}, ${metric === 'opportunity' ? country.opportunityCount : country.expenseCount} ${recordLabel}`;
  }
  function activate(event: React.KeyboardEvent<SVGGElement>, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCountry(id); }
  }

  return <section className={mergeClasses(styles.body, props.compact && styles.compact)} aria-label="DEMO country opportunity and recorded spend">
    <div className={styles.controls}>
      <div className={styles.modes} role="group" aria-label="Map metric">
        <Button size="small" appearance={metric === 'opportunity' ? 'primary' : 'secondary'} aria-pressed={metric === 'opportunity'} onClick={() => changeMetric('opportunity')}>Opportunity</Button>
        <Button size="small" appearance={metric === 'spend' ? 'primary' : 'secondary'} aria-pressed={metric === 'spend'} onClick={() => changeMetric('spend')}>Recorded spend</Button>
      </div>
      {selected && !invalid && <Button size="small" onClick={() => selectCountry('')}>All countries</Button>}
      <select aria-label="Country" className={styles.control} value={selectedCountryId} onChange={event => selectCountry(event.target.value)}>
        <option value="">Country overview</option>
        {missingCountry && <option value={selectedCountryId}>Unavailable country: {selectedCountryId}</option>}
        {scope.countries.map(country => <option key={country.id} value={country.id}>{country.name} · {countryMoney(countryMetricValue(country, metric))}</option>)}
      </select>
    </div>
    {invalid ? <div className={styles.recovery} role="alert">
      <h3 className={styles.heading}>Choose a supported country or scope.</h3>
      <p className={styles.summary}>{!scope.valid ? scope.issues.slice(0, 2).join(' ') : missingCountry ? `Country "${selectedCountryId}" is unknown or outside ${region === 'all' ? 'the DEMO headquarters catalog' : region}. No substitute country has been selected.` : 'Country geometry is unavailable in the offline atlas.'}</p>
      {!scope.valid && <div className={styles.controls}>
        <select className={styles.control} aria-label="Recovery period" value={COUNTRY_PERIODS.some(item => item === period) ? period : ''} onChange={event => recoverScope(event.target.value, region)}>
          <option value="" disabled>Choose period</option>{COUNTRY_PERIODS.map(value => <option key={value} value={value}>{periodLabel(value)}</option>)}
        </select>
        <select className={styles.control} aria-label="Recovery region" value={COUNTRY_REGIONS.some(item => item === region) ? region : ''} onChange={event => recoverScope(period, event.target.value)}>
          <option value="" disabled>Choose region</option>{COUNTRY_REGIONS.map(value => <option key={value} value={value}>{value === 'all' ? 'All regions' : value}</option>)}
        </select>
        <Button size="small" onClick={() => { recoverScope('current', 'all'); selectCountry(''); }}>Use current quarter / all regions</Button>
      </div>}
      <Button size="small" onClick={() => selectCountry('')}>Show country overview</Button>
      {!scope.valid && scope.issues.some(issue => issue.indexOf('headquarters') >= 0 || issue.indexOf('opportunity') >= 0 || issue.indexOf('Duplicate') >= 0) && <p className={styles.note}>Supply valid demo opportunity records with existing domain account IDs to restore trustworthy totals. Changing scope cannot repair unmapped records.</p>}
    </div> : emptySpend ? <div className={mergeClasses(styles.empty, styles.records)} role="status">
      <h3 className={styles.heading}>No recorded DEMO spend.</h3>
      <p className={styles.summary}>{periodLabel(period)} · {selected?.name || (region === 'all' ? 'All regions' : region)} · {countryMoney(0)} recorded · 0 ledger entries</p>
      <p className={styles.summary}>{period === 'next' ? 'No next-quarter recorded expenses exist.' : 'No recorded expenses match this country scope.'} Only current-quarter DEMO expenses are recorded; no future actual spend or proposal is implied.</p>
      <p className={styles.summary}>{selected ? selected.opportunityCount : scope.opportunities.length} demo opportunities · {countryMoney(selected ? selected.opportunityValue : scope.opportunityValue)} open value remains in this scope.</p>
      <div className={styles.controls}>
        <Button size="small" appearance="primary" onClick={() => changeMetric('opportunity')}>View opportunities</Button>
        <Button size="small" onClick={() => recoverScope('current', region)}>Use current quarter</Button>
      </div>
      <p className={styles.note}>Offline DEMO records, not live CRM / SharePoint. Recorded expenses are not investment or ROI.</p>
    </div> : <>
      <div>
        <div className={styles.detailHeader}>
          <h3 className={styles.heading}>{selected ? selected.name : metric === 'opportunity' ? 'Where opportunity lives.' : 'Where spend was recorded.'}</h3>
          <strong className={mergeClasses(styles.amount, metric === 'spend' && styles.spendAmount)}>{countryMoney(total)}</strong>
        </div>
        <p className={styles.summary}>{periodLabel(period)} · {selected?.region || (region === 'all' ? 'All regions' : region)} · {count === 0
          ? metric === 'spend' ? 'No recorded DEMO expenses' : 'No matching supplied opportunities'
          : `${count} ${recordLabel} · USD`}</p>
      </div>
      {!selected ? <svg className={mergeClasses(styles.map, !props.compact && styles.expandedMap)} viewBox="0 0 720 300" role="group" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <title id={titleId}>{metricName(metric)} by DEMO headquarters country</title>
        <desc id={descriptionId}>{metric === 'opportunity' ? 'Country color shows sums of supplied opportunity values, assigned in full to demo account headquarters. Fixed USD thresholds: below one million, one to five million, five to ten million, ten million or more.' : 'Green bubble area shows a separate fictional recorded expense ledger, located at country reference points. One million thirty thousand USD has radius twenty-six map units. No bubble means no recorded expenses.'} Country buttons, selector and two-country exact-value pages provide keyboard and text equivalents. The boxed Top countries inset is a ranked summary, not map locations. Dark unassigned land has no demo headquarters catalog in this scope. Natural Earth boundaries are illustrative.</desc>
        <path d={path(geoGraticule10()) || ''} fill="none" stroke="#385168" strokeWidth=".5" aria-hidden="true" />
        {REVENUE_WORLD_COUNTRIES.features.map((geometry, index) => {
          const country = scope.countries.find(item => item.atlasId === Number(geometry.id));
          const geometryKey = geometry.id !== undefined ? `atlas-id-${geometry.id}` : `atlas-name-${geometry.properties.name || `index-${index}`}`;
          return country ? <g key={geometryKey} role="button" tabIndex={0} aria-label={countryControl(country)} className={styles.mapButton} onClick={() => selectCountry(country.id)} onKeyDown={event => activate(event, country.id)}>
            <title>{countryControl(country)}</title>
            <path d={worldCountryPath(geometry, projection)} fill={metric === 'opportunity' ? opportunityFill(country.opportunityValue) : '#294f52'} stroke={overviewPage.records.some(item => item.id === country.id) ? '#ffd978' : '#9ab4c8'} strokeWidth={overviewPage.records.some(item => item.id === country.id) ? 1.4 : .7} />
          </g> : <path key={geometryKey} d={worldCountryPath(geometry, projection)} fill="#1a3349" stroke="#53697b" strokeWidth=".5" aria-hidden="true" />;
        })}
        {metric === 'spend' && orderedCountries.filter(country => country.spend > 0).map(country => {
          const point = projection([country.longitude, country.latitude]);
          return point ? <g key={country.id} role="button" tabIndex={0} aria-label={countryControl(country)} className={styles.mapButton} onClick={() => selectCountry(country.id)} onKeyDown={event => activate(event, country.id)}>
            <title>{countryControl(country)}</title><circle cx={point[0]} cy={point[1]} r={bubbleRadius(country.spend)} fill="#65e6b5" fillOpacity=".78" stroke="#c0ffe4" strokeWidth="1" />
          </g> : null;
        })}
        {leaders.length > 0 && <g role="group" aria-label="Top countries" pointerEvents="none">
          <title>Top countries by {metricName(metric)}: ranked summary, not map locations. {leaders.map(country => `${country.name} (${country.id}): ${countryMoney(countryMetricValue(country, metric))}`).join('; ')}.</title>
          <rect x="28" y="182" width="178" height={38 + leaders.length * 21} rx="8" fill="#0a1b2c" stroke="#68869e" strokeWidth="1" />
          <text x="40" y="206" fill="#afc5d7" fontSize="19" fontWeight="600">Top countries</text>
          {leaders.map((country, index) => <g key={country.id} aria-hidden="true">
            <text x="40" y={228 + index * 21} fill="#f4f8fc" fontSize="19" fontWeight="600">{country.id}</text>
            <text x="194" y={228 + index * 21} textAnchor="end" fill={metric === 'opportunity' ? '#b8daf4' : '#65e6b5'} fontSize="19" fontWeight="600">{countryShortMoney(countryMetricValue(country, metric))}</text>
          </g>)}
        </g>}
      </svg> : focusedGeometry && focusedProjection && <svg className={mergeClasses(styles.countryMap, !props.compact && styles.expandedCountryMap)} viewBox="0 0 540 200" role="img" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <title id={titleId}>{selected.name}: {countryMoney(total)} {metricName(metric)}</title>
        <desc id={descriptionId}>Selected country boundaries, including atlas overseas polygons where present. {metric === 'opportunity' ? 'Blue country fill uses the same fixed opportunity-value legend as the overview; full value is attributed to demo account headquarters, not territory-level revenue.' : 'Green bubble area uses the same spending scale as the overview; this is recorded fictional demo expense, not future investment.'} Exact records follow.</desc>
        <path d={worldCountryPath(focusedGeometry, focusedProjection)} fill={metric === 'opportunity' ? opportunityFill(total) : '#294f52'} stroke="#ffd978" strokeWidth="1.8" />
        {metric === 'spend' && selected.spend > 0 && (() => {
          const point = focusedProjection([selected.longitude, selected.latitude]);
          return point ? <circle cx={point[0]} cy={point[1]} r={bubbleRadius(selected.spend)} fill="#65e6b5" fillOpacity=".8" stroke="#c0ffe4" /> : null;
        })()}
        <text x="310" y="72" fill="#afc5d7" fontSize="14">{selected.id} · {metric === 'opportunity' ? 'Open value' : 'Recorded demo'}</text>
        <text x="310" y="107" fill={metric === 'opportunity' ? '#b8daf4' : '#65e6b5'} fontSize="25" fontWeight="700">{countryShortMoney(total)}</text>
        <text x="310" y="134" fill="#eef5fa" fontSize="14">{count} {recordLabel}</text>
        <text x="310" y="160" fill="#afc5d7" fontSize="11">ISO2 {selected.id} / atlas {selected.atlasId}</text>
      </svg>}
      <div className={styles.legend} aria-label={`${metricName(metric)} legend`}>
        {metric === 'opportunity' ? <>
          {[['$0', opportunityColors[0]], ['<$1M', opportunityColors[1]], ['$1–<5M', opportunityColors[2]], ['$5–<10M', opportunityColors[3]], ['≥$10M', opportunityColors[4]]].map(([label, color]) => <span key={label} className={styles.legendItem}><i className={styles.swatch} style={{ backgroundColor: color }} aria-hidden="true" />{label}</span>)}
        </> : <><span className={styles.legendItem}><i className={styles.swatch} style={{ backgroundColor: '#65e6b5', borderRadius: '50%' }} aria-hidden="true" />Bubble area = USD · reference $1.03M</span><span>No bubble = no recorded expenses</span></>}
      </div>
      {!selected ? <table className={styles.table} aria-label="Country totals, two countries per page">
        <tbody>{overviewPage.records.map(country => <tr key={country.id}>
          <th scope="row" className={styles.cell}><button className={styles.rowButton} onClick={() => selectCountry(country.id)}>{country.name}</button><span className={styles.note}> · {metric === 'opportunity' ? country.opportunityCount : country.expenseCount} {recordLabel}</span></th>
          <td className={mergeClasses(styles.cell, styles.valueCell)}>{countryMoney(countryMetricValue(country, metric))}</td>
        </tr>)}</tbody>
      </table> : count === 0 ? <div className={styles.empty}>No supplied demo opportunities match this country and period. Choose another country or ask for a broader period; no substitute deals are shown.</div>
        : <div className={styles.records}>
          {visibleOpportunities.map(item => <article key={item.id} className={styles.record} aria-label={`${item.id} ${item.name}`}>
            <div className={styles.recordTop}><h4 className={styles.recordTitle}>{item.name}</h4><Button size="small" onClick={() => props.onInspectOpportunity(item.id)}>Inspect {item.id}</Button></div>
            <p className={styles.recordMeta}>{ACCOUNTS.find(account => account.id === item.accountId)?.name} · {item.accountId} · {item.stage} · {countryMoney(item.value)}</p>
          </article>)}
          {visibleExpenses.map(item => <article key={item.id} className={styles.record} aria-label={`${item.id} ${item.category}`}>
            <div className={styles.recordTop}><h4 className={styles.recordTitle}>{item.category}</h4><strong className={styles.recordTitle}>{countryMoney(item.amount)}</strong></div>
            <p className={styles.recordMeta}>{item.id} · Recorded DEMO · quarter week {item.recordedWeek} · {item.description}</p>
          </article>)}
        </div>}
      <div className={styles.pagination}>
        <Button size="small" disabled={activePage.page === 0} onClick={() => setPage(activePage.page - 1)}>Previous</Button>
        <span className={styles.pageLabel}>Page {activePage.page + 1} / {activePage.pageCount} · {activePage.originalCount} {selected ? recordLabel : 'countries'}</span>
        <Button size="small" disabled={activePage.page + 1 >= activePage.pageCount} onClick={() => setPage(activePage.page + 1)}>Next</Button>
      </div>
      <p className={styles.note}>{metric === 'opportunity' ? 'DEMO · Full supplied deal values → fictional account HQ, not rollout revenue.' : 'DEMO · Separate recorded expense ledger, not investment or ROI.'} Offline Natural Earth atlas · not live CRM / SharePoint.</p>
    </>}
  </section>;
}
