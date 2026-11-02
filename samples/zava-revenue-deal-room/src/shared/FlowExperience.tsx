import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { currency } from './operations';
import { flowNodeValue, type IRevenueFlow } from './flows';
import { sankeyGeometry } from './visualizations/sankeyGeometry';

const useStyles = makeStyles({
  root: { minWidth: 0, display: 'grid', gap: '6px', overflowWrap: 'anywhere' },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' },
  field: { minWidth: 0, display: 'grid', gap: '4px', fontSize: tokens.fontSizeBase200 },
  select: { minWidth: 0, width: '100%', boxSizing: 'border-box', padding: '6px', borderRadius: tokens.borderRadiusMedium, border: `1px solid ${tokens.colorNeutralStroke1}`, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1 },
  columns: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', textAlign: 'center', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground2 },
  chart: { display: 'block', width: '100%', overflow: 'visible', '& [role="button"]': { cursor: 'pointer' }, '& [role="button"]:focus-visible': { outline: `2px solid ${tokens.colorBrandStroke1}`, outlineOffset: '2px' }, '@media (forced-colors: active)': { '& path': { stroke: 'CanvasText' }, '& rect': { fill: 'Canvas', stroke: 'CanvasText' } } },
  text: { fill: tokens.colorNeutralForeground1, stroke: tokens.colorNeutralBackground1, strokeWidth: '3px', paintOrder: 'stroke', fontSize: '11px', fontWeight: tokens.fontWeightSemibold, pointerEvents: 'none' },
  muted: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200 },
  value: { color: tokens.colorBrandForeground1 },
  actions: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
  rows: { display: 'grid', gap: '6px' },
  row: { padding: '6px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }
});
const millions = (value: number): string => `$${(value / 1000000).toFixed(1)}M`;
const mobileLabels: Readonly<Record<string, string>> = { na: 'NA', emea: 'EMEA', apac: 'APAC', latam: 'LATAM', ready: 'Ready', gap: 'Gap', stale: 'Stale', buyer: 'Access', refresh: 'Proof', terms: 'Terms', standard: 'Std.', commercial: 'Comm.', executive: 'Exec.', manager: 'Manager', director: 'Director', committee: 'Exec.', pending: 'Pending', passed: 'Passed', returned: 'Returned', rejected: 'Rejected' };

export default function FlowExperience(props: {
  readonly flow: IRevenueFlow;
  readonly compact: boolean;
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly onPeriod: (period: string) => void;
  readonly onRegion: (region: string) => void;
  readonly onStateChange: (state: Readonly<Record<string, unknown>>) => void;
}): React.ReactElement {
  const styles = useStyles();
  const [view, setView] = React.useState(props.selectedId ? 'Details' : 'Sankey');
  const [page, setPage] = React.useState(0);
  const [width, setWidth] = React.useState(640);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const focusPending = React.useRef(false);
  const unique = React.useId().replace(/:/g, '');
  const selectedNode = props.flow.nodes.find(item => item.id === props.selectedId);
  const selectedLink = props.flow.links.find(item => item.id === props.selectedId);
  const missing = !!props.selectedId && !selectedNode && !selectedLink;
  const errors = [...props.flow.errors, ...(missing ? [`No visible Sankey node or ribbon matches ${props.selectedId}.`] : [])];
  const connections = selectedNode ? props.flow.links.filter(item => item.source === selectedNode.id || item.target === selectedNode.id) : selectedLink ? [selectedLink] : [];
  const pages = Math.max(1, Math.ceil(connections.length / 2));
  const currentPage = Math.min(page, pages - 1);
  const visible = view === 'Details' && !errors.length ? props.compact ? connections.slice(currentPage * 2, currentPage * 2 + 2) : connections : [];
  const amount = selectedNode ? flowNodeValue(props.flow, selectedNode.id) : selectedLink?.value;
  const label = selectedNode?.label || (selectedLink ? `${props.flow.nodes.find(item => item.id === selectedLink.source)?.label} to ${props.flow.nodes.find(item => item.id === selectedLink.target)?.label}` : '');
  const selectedDetail = amount !== undefined ? { id: props.selectedId, label, value: amount, shareOfTotal: amount / props.flow.total, meaning: selectedNode?.meaning || 'A conserved fictional allocation between two planning buckets; not an observed conversion.', source: 'Deterministic imaginary planning scenario' } : null;
  const serialized = JSON.stringify({
    stage: errors.length ? 'Unavailable selection' : view, page: view === 'Details' ? currentPage + 1 : 1, pageCount: view === 'Details' ? pages : 1,
    selectedId: props.selectedId, selectedDetail, visibleRecords: visible, validationErrors: errors,
    visibleFields: view === 'Sankey' ? ['nodes', 'links', 'value', 'planningScope', 'semantics'] : view === 'Details' ? ['selectedDetail', 'connections', 'value', 'shareOfTotal', 'semantics'] : ['semantics', 'allocationAssumptions', 'exampleBoundary'],
    chart: view === 'Sankey' && !errors.length ? { kind: 'sankey', total: props.flow.total, nodeCount: props.flow.nodes.length, linkCount: props.flow.links.length, dataPath: 'revenueFlow' } : null
  });
  React.useEffect(() => { props.onStateChange(JSON.parse(serialized)); }, [serialized, props.onStateChange]);
  React.useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const measure = (): void => { if (element.clientWidth >= 240) setWidth(element.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [view]);
  React.useEffect(() => { if (focusPending.current) { headingRef.current?.focus(); focusPending.current = false; } }, [view, props.selectedId]);
  const choose = (id: string): void => { focusPending.current = true; setPage(0); props.onSelect(id); setView('Details'); };
  const back = (): void => { focusPending.current = true; props.onSelect(''); setPage(0); setView('Sankey'); };
  const keyboard = (event: React.KeyboardEvent<SVGGElement>, id: string): void => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(id); }
  };
  const height = props.compact ? width < 480 ? 236 : 196 : 320;
  const geometry = React.useMemo(() => props.flow.errors.length ? null : sankeyGeometry(props.flow, width, height), [props.flow, width, height]);
  return <section className={styles.root} aria-label={props.flow.title} data-layout={`${props.flow.kind}-sankey`}>
    {!errors.length && <div className={styles.filters}>
      <label className={styles.field}>Planning quarter<select className={styles.select} aria-label="Planning quarter" value={props.flow.period} onChange={event => { back(); props.onPeriod(event.target.value); }}><option value="current">Current scenario</option><option value="next">Next scenario</option><option value="all">Both scenarios</option></select></label>
      {props.flow.kind === 'pipeline' && <label className={styles.field}>Planning region<select className={styles.select} aria-label="Planning region" value={props.flow.region} onChange={event => { back(); props.onRegion(event.target.value); }}>{['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America'].map(item => <option key={item} value={item}>{item === 'all' ? 'All regions' : item}</option>)}</select></label>}
    </div>}
    {errors.length ? <div role="alert"><h2 ref={headingRef} tabIndex={-1}>Unavailable flow selection</h2>{errors.map(error => <p key={error}>{error}</p>)}<Button size="small" onClick={() => { back(); props.onPeriod('current'); props.onRegion('all'); }}>Clear flow selection and filters</Button></div> :
      view === 'Sankey' ? <>
        <h2 ref={headingRef} tabIndex={-1} className={styles.value}>{millions(props.flow.total)} fictional value</h2>
        <div className={styles.columns}>{props.flow.columns.map(column => <span key={column}>{column}</span>)}</div>
        <div ref={chartRef}><svg className={styles.chart} style={{ height }} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${props.flow.title}: interactive fictional USD flows`}>
          <title>{props.flow.title}: fictional allocations, not live records</title><desc>Ribbon thickness represents hypothetical USD value. Select a ribbon or node with pointer, Enter or Space to inspect exact values.</desc>
          <defs>{geometry?.links.map((link, index) => <linearGradient key={link.id} id={`${unique}-flow-${index}`} gradientUnits="userSpaceOnUse" x1="0" x2={width} y1="0" y2="0"><stop stopColor={link.source.color}/><stop offset="1" stopColor={link.target.color}/></linearGradient>)}</defs>
          {geometry?.links.map((link, index) => <g key={link.id} role="button" tabIndex={0} aria-label={`Inspect flow: ${link.source.label} to ${link.target.label}, ${currency(link.value)} fictional USD`} data-sankey-link={link.id} onClick={() => choose(link.id)} onKeyDown={event => keyboard(event, link.id)}>
            <path d={link.path} fill="none" stroke={`url(#${unique}-flow-${index})`} strokeWidth={link.width} opacity=".55"/>
            <path d={link.path} fill="none" stroke="transparent" strokeWidth={Math.max(6, link.width)} pointerEvents="stroke"/>
            {/* Horizontal ribbons need a nonzero-height pointer target. */}
            <rect x={link.centerX - 4} y={link.centerY - Math.max(6, link.width) / 2} width="8" height={Math.max(6, link.width)} fill="transparent" pointerEvents="all"/>
          </g>)}
          {geometry?.nodes.map(item => {
            const right = item.node.column > 0;
            const x = right ? item.x0 - 5 : item.x1 + 5;
            const y = (item.y0 + item.y1) / 2;
            const hitX = right ? Math.max(0, item.x0 - (width < 480 ? 44 : 94)) : item.x0;
            const hitY = Math.max(0, Math.min(item.y0, y - 16));
            const hitBottom = Math.min(height, Math.max(item.y1, y + 16));
            return <g key={item.node.id} role="button" tabIndex={0} aria-label={`Inspect node: ${item.node.label}, ${currency(item.value)} fictional USD`} data-sankey-node={item.node.id} onClick={() => choose(item.node.id)} onKeyDown={event => keyboard(event, item.node.id)}>
              <rect x={hitX} y={hitY} width={Math.min(width < 480 ? 60 : 106, width - hitX)} height={hitBottom - hitY} fill="transparent" pointerEvents="all"/>
              <rect x={item.x0} y={item.y0} width={item.x1 - item.x0} height={item.y1 - item.y0} rx="3" fill={item.node.color}/>
              <text className={styles.text} x={x} y={y - 3} textAnchor={right ? 'end' : 'start'}>{width < 480 ? mobileLabels[item.node.id] : item.node.shortLabel}<tspan x={x} dy="13">{millions(item.value)}</tspan></text>
            </g>;
          })}
        </svg></div>
        <p className={styles.muted}>Conserved imaginary USD, not live CRM or conversion. Select a ribbon or node for details.</p>
        <Button size="small" onClick={() => { focusPending.current = true; setView('Assumptions'); }}>Model assumptions</Button>
      </> : view === 'Details' && selectedDetail ? <>
        <Button size="small" onClick={back}>Back to value flow</Button>
        <h2 ref={headingRef} tabIndex={-1}>{selectedDetail.label}</h2><p className={styles.value}>{currency(selectedDetail.value)} fictional value / {(selectedDetail.shareOfTotal * 100).toFixed(1)}% of this scenario</p>
        <p className={styles.muted}>{selectedDetail?.meaning}</p>
        <div className={styles.rows}>{visible.map(link => <article className={styles.row} key={link.id}><strong>{props.flow.nodes.find(item => item.id === link.source)?.label} → {props.flow.nodes.find(item => item.id === link.target)?.label}</strong><p>{currency(link.value)} fictional allocation</p></article>)}</div>
        {props.compact && pages > 1 && <div className={styles.actions}><Button size="small" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous connections</Button><span>Page {currentPage + 1} / {pages}</span><Button size="small" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next connections</Button></div>}
      </> : view === 'Details' ? <div role="alert"><h2 ref={headingRef} tabIndex={-1}>Select a visible flow to inspect</h2><Button size="small" onClick={back}>Back to value flow</Button></div> : <>
        <Button size="small" onClick={back}>Back to value flow</Button><h2 ref={headingRef} tabIndex={-1}>Fictional model assumptions</h2>
        <p>{props.flow.semantics}</p><p>The next scenario scales the current allocations by 20%; both scenarios sum the two fictional batches. Values are conserved at every intermediate node, including region-filtered allocations.</p>
        {props.flow.kind === 'approval' && <p>Current reviewer is not the entire sequential route. Stage passed may still require later independent reviews. The Copilot continuation opens example ZM-1001; none of this chart&apos;s value is attributed to that stored request.</p>}
      </>}
    {props.flow.kind === 'approval' && view !== 'Assumptions' && !errors.length && <p className={styles.muted}>Stage passed ≠ final approval. Copilot opens example ZM-1001, not this fictional batch.</p>}
  </section>;
}
