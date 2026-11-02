import * as React from 'react';
import { Badge, Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ACCOUNTS, type IOpportunity } from './domain';
import { currency, resolveScope, scopedContacts, scopedEvidence, type IBusinessRow } from './operations';
import { D3AttentionRanking, D3PipelineQuality } from './visualizations/RevenueCharts';
import { AttentionValueMap } from './visualizations/PortfolioDecisionVisuals';

export type AttentionMeasure = 'value' | 'exposure';
export interface IAttentionDeal extends IBusinessRow {
  readonly opportunity: IOpportunity;
  readonly flags: readonly string[];
  readonly weightedValue: number;
  readonly exposure: number;
}

export function attentionDeals(opportunities: readonly IOpportunity[], measure: AttentionMeasure): readonly IAttentionDeal[] {
  return opportunities.map(opportunity => {
    const scope = resolveScope({ opportunityId: opportunity.id });
    const evidence = scopedEvidence(scope);
    const flags = [
      ...(!evidence.some(item => item.kind === 'verified') ? ['No recorded verified buyer evidence'] : []),
      ...(evidence.some(item => item.kind === 'contrary') ? ['Contrary buyer evidence'] : []),
      ...(evidence.some(item => item.kind === 'stale') ? ['Stale source assumptions'] : []),
      ...(opportunity.probability < 0.6 ? ['Seller probability below 60%'] : [])
    ];
    return {
      id: opportunity.id, opportunity, flags, weightedValue: opportunity.value * opportunity.probability,
      exposure: opportunity.value * (1 - opportunity.probability),
      title: opportunity.name, detail: `${currency(opportunity.value)} open; ${Math.round(opportunity.probability * 100)}% seller probability. ${flags.join('; ')}.`,
      source: 'Offline opportunity catalog and recorded source evidence', kind: 'attention / source facts / seller judgment'
    };
  }).filter(item => item.flags.length).sort((left, right) =>
    (measure === 'value' ? right.opportunity.value - left.opportunity.value : right.exposure - left.exposure) || left.id.localeCompare(right.id));
}

const useStyles = makeStyles({
  root: { display: 'grid', gap: tokens.spacingVerticalM, minWidth: 0 },
  catalog: { display: 'grid', gap: tokens.spacingVerticalS },
  card: { padding: tokens.spacingVerticalM, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, overflowWrap: 'anywhere' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS },
  facts: { display: 'grid', gridTemplateColumns: 'minmax(100px, .6fr) minmax(0, 1fr)', gap: tokens.spacingVerticalS, '& dd': { margin: 0 } },
  compactRoot: { gap: '4px' },
  compactCatalog: { gap: '6px' },
  compactCard: { padding: '6px' },
  summary: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: '8px' }
});

export default function DealAttention(props: {
  readonly opportunities: readonly IOpportunity[];
  readonly rows: readonly IAttentionDeal[];
  readonly totalCount: number;
  readonly measure: AttentionMeasure;
  readonly onMeasure: (measure: AttentionMeasure) => void;
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly compact?: boolean;
  readonly page?: number;
  readonly onPage?: (page: number) => void;
  readonly onStateChange?: (state: Readonly<Record<string, unknown>>) => void;
}): React.ReactElement {
  const styles = useStyles();
  const selected = props.rows.find(item => item.id === props.selectedId);
  const unavailable = !!props.compact && !!props.selectedId && !selected;
  const scope = selected ? resolveScope({ opportunityId: selected.id }) : undefined;
  const evidence = scope ? scopedEvidence(scope) : [];
  const contacts = scope ? scopedContacts(scope) : [];
  const [facet, setFacet] = React.useState('Deal facts');
  const [detailPage, setDetailPage] = React.useState(0);
  const [catalogView, setCatalogView] = React.useState<'Overview' | 'Records'>('Overview');
  const overviewDeals = attentionDeals(props.opportunities, props.measure).slice(0, 8);
  const facets = facet === 'Buyer coverage' ? contacts : facet === 'Evidence' ? evidence : [];
  const detailPages = Math.max(1, Math.ceil(facets.length / 2));
  const currentDetailPage = Math.min(detailPage, detailPages - 1);
  const state = JSON.stringify({
    facet: unavailable ? 'Unavailable selection' : selected ? facet : catalogView === 'Overview' ? 'Value and evidence attention' : 'Ranked deals', page: unavailable ? 1 : selected ? currentDetailPage + 1 : catalogView === 'Overview' ? 1 : (props.page || 0) + 1,
    pageCount: unavailable ? 1 : selected ? detailPages : catalogView === 'Overview' ? 1 : Math.max(1, Math.ceil(props.totalCount / 2)),
    catalogView, catalogRecords: !selected && catalogView === 'Records' ? props.rows : [],
    visibleFields: unavailable ? ['selectedId'] : selected ? facet === 'Deal facts' ? ['stage', 'value', 'probability', 'weightedValue', 'exposure', 'flags'] : facet === 'Buyer coverage' ? ['name', 'role', 'stance', 'influence'] : ['id', 'title', 'kind', 'detail', 'source', 'ageDays'] : ['id', 'title', 'stage', 'value', 'flags'],
    visibleDetails: selected && props.compact ? facets.slice(currentDetailPage * 2, currentDetailPage * 2 + 2) : [],
    chart: !unavailable && !selected && catalogView === 'Overview' ? { kind: 'attention-value-proof-map', metric: props.measure, records: overviewDeals.map(item => ({ id: item.id, open: item.opportunity.value, sellerUnweighted: item.exposure, flags: item.flags })), semantics: 'Observed flags and recorded value, not confidence, predicted loss or a forecast commitment.' } : null
  });
  React.useEffect(() => { props.onStateChange?.(JSON.parse(state)); }, [state, props.onStateChange]);
  const detailHeading = React.useRef<HTMLHeadingElement>(null);
  const catalogHeading = React.useRef<HTMLHeadingElement>(null);
  const previousSelection = React.useRef(props.selectedId);
  React.useEffect(() => {
    if (props.selectedId) detailHeading.current?.focus();
    else if (previousSelection.current) catalogHeading.current?.focus();
    previousSelection.current = props.selectedId;
  }, [props.selectedId]);
  if (unavailable) return <section className={mergeClasses(styles.card, styles.compactCard)} aria-label="Unavailable deal selection">
    <h2 ref={detailHeading} tabIndex={-1}>No matching deal</h2>
    <p role="status">No attention candidate matches {props.selectedId} in this scope. No different deal was substituted.</p>
    <div className={styles.actions}><Button onClick={() => props.onSelect('')}>Clear selection</Button><Button onClick={() => props.onSelect('')}>Back to attention catalog</Button></div>
  </section>;
  if (props.compact) return <div className={mergeClasses(styles.root, styles.compactRoot)}>
    {selected ? <section className={mergeClasses(styles.card, styles.compactCard)} aria-label="Selected deal details">
      <Button size="small" onClick={() => props.onSelect('')}>Back to attention catalog</Button>
      <h2 ref={detailHeading} tabIndex={-1}>{selected.title}</h2><p>{scope?.account?.name} / {selected.id}</p>
      <div className={styles.actions} aria-label="Deal detail facets">{['Deal facts', 'Buyer coverage', 'Evidence'].map(label => <Button size="small" key={label} aria-pressed={facet === label} onClick={() => { setFacet(label); setDetailPage(0); }}>{label}</Button>)}</div>
      {facet === 'Deal facts' ? <>
        <dl className={styles.facts}><dt>Stage / open value</dt><dd>{selected.opportunity.stage} / {currency(selected.opportunity.value)}</dd><dt>Seller-weighted</dt><dd>{currency(selected.weightedValue)} / {Math.round(selected.opportunity.probability * 100)}% seller judgment</dd><dt>Seller-unweighted</dt><dd>{currency(selected.exposure)} / not predicted loss</dd></dl>
        <p>{selected.flags.join('; ')}. Not an AI risk score or forecast commitment.</p>
      </> : facet === 'Buyer coverage' ? <>
        {contacts.slice(currentDetailPage * 2, currentDetailPage * 2 + 2).map(contact => <article key={contact.id} className={styles.card}><h3>{contact.name} / {contact.role}</h3><p>{contact.stance} / influence {contact.influence}; recorded relationship, not decision authority.</p></article>)}
        {!contacts.length && <p>No buyer relationships are recorded for this deal.</p>}
      </> : <>
        {evidence.slice(currentDetailPage * 2, currentDetailPage * 2 + 2).map(item => <article key={item.id} className={styles.card}><h3>{item.id}: {item.title}</h3><Badge appearance="tint">{item.kind}</Badge><p>{item.detail}</p><p>{item.source} / {item.ageDays} days old</p></article>)}
        {!evidence.length && <p>No recorded buyer proof. Do not infer customer acceptance.</p>}
      </>}
      {facet !== 'Deal facts' && <div className={styles.actions}><Button size="small" disabled={currentDetailPage === 0} onClick={() => setDetailPage(currentDetailPage - 1)}>Previous details</Button><span>Page {currentDetailPage + 1} / {detailPages}</span><Button size="small" disabled={currentDetailPage + 1 >= detailPages} onClick={() => setDetailPage(currentDetailPage + 1)}>Next details</Button></div>}
    </section> : <>
      <h2 ref={catalogHeading} tabIndex={-1}>Important deals / attention catalog</h2>
      <div className={styles.actions}><Button size="small" aria-pressed={props.measure === 'value'} onClick={() => props.onMeasure('value')}>Rank by open value</Button><Button size="small" aria-pressed={props.measure === 'exposure'} onClick={() => props.onMeasure('exposure')}>Rank by seller-unweighted value</Button></div>
      {catalogView === 'Overview' ? <><AttentionValueMap deals={overviewDeals} measure={props.measure} onSelect={props.onSelect}/><p>Each point is a scoped opportunity record. Flags are observable source/judgment conditions, not an AI risk score.</p><Button size="small" onClick={() => setCatalogView('Records')}>Show ranked deals</Button></> : <>
      <Button size="small" onClick={() => setCatalogView('Overview')}>Value and evidence overview</Button>
      <div className={mergeClasses(styles.catalog, styles.compactCatalog)}>{props.rows.map(item => <article key={item.id} className={styles.card}>
        <div className={styles.summary}><div><h3>{item.title}</h3><p>{item.opportunity.stage} / {currency(item.opportunity.value)} / {item.flags.length} flags</p></div><Button size="small" onClick={() => props.onSelect(item.id)}>Details for {item.id}</Button></div>
      </article>)}</div>
      <div className={styles.actions}><Button size="small" disabled={!props.page} onClick={() => props.onPage?.((props.page || 0) - 1)}>Previous deals</Button><span>Page {(props.page || 0) + 1} / {Math.max(1, Math.ceil(props.totalCount / 2))}</span><Button size="small" disabled={((props.page || 0) + 1) * 2 >= props.totalCount} onClick={() => props.onPage?.((props.page || 0) + 1)}>Next deals</Button></div>
      </>}
      {!props.rows.length && <p role="status">No deals match these attention filters.</p>}
      {props.selectedId && <p role="status">No visible record matches {props.selectedId}. No different deal was substituted. <Button size="small" onClick={() => props.onSelect('')}>Clear selection</Button></p>}
    </>}
  </div>;
  return <div className={styles.root}>
    {selected ? <section className={styles.card} aria-label="Selected deal details">
      <Button onClick={() => props.onSelect('')}>Back to attention catalog</Button>
      <h2 ref={detailHeading} tabIndex={-1}>{selected.title}</h2><p>{scope?.account?.name} / {selected.id}</p>
      <dl className={styles.facts}>
        <dt>Stage</dt><dd>{selected.opportunity.stage}</dd>
        <dt>Open value</dt><dd>{currency(selected.opportunity.value)}</dd>
        <dt>Seller-weighted outlook</dt><dd>{currency(selected.weightedValue)} / {Math.round(selected.opportunity.probability * 100)}% seller judgment, not commit</dd>
        <dt>Seller-unweighted value</dt><dd>{currency(selected.exposure)} / not a predicted loss</dd>
        <dt>Attention flags</dt><dd>{selected.flags.join('; ')}</dd>
      </dl>
      <h3>Buyer coverage</h3>
      {contacts.length ? contacts.map(contact => <p key={contact.id}>{contact.name} / {contact.role} / {contact.stance} / influence {contact.influence}</p>) : <p>No buyer relationships are recorded for this deal.</p>}
      <h3>Source evidence and discussion</h3>
      {evidence.length ? evidence.map(item => <p key={item.id}><Badge appearance="tint">{item.kind}</Badge> {item.id}: {item.title}. {item.detail} / {item.source} / {item.ageDays} days old</p>) : <p>No recorded buyer proof. Ask Copilot what to validate; do not infer customer acceptance.</p>}
      <p>Use the suggested Copilot actions below to discuss these details or request a focused buyer, commercial, risk or forecast component. You do not need to expand to full screen.</p>
    </section> : <>
      <h2 ref={catalogHeading} tabIndex={-1}>Important deals / attention catalog</h2>
      <p>Showing the top {props.rows.length} of {props.totalCount} matching attention candidates. Missing evidence, contrary signals, stale assumptions and low seller probability are explicit attention flags, not an AI risk score.</p>
      <div className={styles.actions}>
        <Button aria-pressed={props.measure === 'value'} onClick={() => props.onMeasure('value')}>Rank by open value</Button>
        <Button aria-pressed={props.measure === 'exposure'} onClick={() => props.onMeasure('exposure')}>Rank by seller-unweighted value</Button>
      </div>
      <D3AttentionRanking rows={props.rows.map(item => ({ id: item.id, value: item.opportunity.value, weightedValue: item.weightedValue }))} selectedId={props.selectedId} onSelect={props.onSelect} />
      <D3PipelineQuality opportunities={props.opportunities} />
      <div className={styles.catalog}>{props.rows.map(item => <article key={item.id} className={styles.card}>
        <h3>{item.title}</h3><p>{item.id} / {ACCOUNTS.find(account => account.id === item.opportunity.accountId)?.region} / {item.opportunity.stage}</p>
        <p>{item.detail}</p><Button onClick={() => props.onSelect(item.id)}>Details for {item.id}</Button>
      </article>)}</div>
      {!props.rows.length && <p role="status">No deals match these attention filters. Clear the region or change the quarter.</p>}
      {props.selectedId && !selected && <p role="status">The selected deal is not in the current top-eight catalog. Change filters or ranking, or clear the selection. No different deal was substituted. <Button onClick={() => props.onSelect('')}>Clear selection</Button></p>}
    </>}
  </div>;
}
