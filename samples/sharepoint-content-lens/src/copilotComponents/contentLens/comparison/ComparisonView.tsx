import * as React from 'react';
import { Button, Input, Link, Spinner, Select, useId, makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { SitePicker, PageCombobox } from '../components/ContentPickers';
import { PageMap } from '../components/PageMap';
import { PreviewZoom, type PreviewZoomValue } from '../components/PreviewZoom';
import type { PageNote } from '../components/notes';
import { PagePreview } from '../components/PagePreview';
import { previewLocations } from './previewLocations';
import { pageNotes } from '../components/notes';
import { checkLabels, format } from '../components/viewUtils';
import { checkCatalog } from '../domain/checkCatalog';
import { checkRule } from '../components/checkRules';
import { demoComparison, demoAnswer } from './demo';
import { FixtureContentService, demoSiteUrl } from '../services/fixtures';
import { demoImage } from './demoImage';
import { sameSavedPage, textLocations } from './evidence';
import { ComparisonChatError, chatContext } from './chat';
import {
  emptyComparison, type ComparisonState, type ComparisonEvidence, type CopilotInterpretation, type ComparisonSelection
} from './contracts';
import type { IComparisonServices } from './services';
import { httpsUrl, isDefaultThumbnail, type ImageUse } from './media';

const useStyles = makeStyles({
  root: { '&[hidden]': { display: 'none' }, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 },
  review: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '20px', alignItems: 'start', minWidth: 0 },
  reviewFull: { '@container (min-width: 1000px)': { gridTemplateColumns: 'minmax(0,1fr) 320px' } },
  sidebar: { minWidth: 0, maxHeight: '780px', overflowY: 'auto', position: 'sticky', top: '12px' },
  sidebarChoices: {
    flexDirection: 'column',
    alignItems: 'stretch',
    '& button': { borderRadius: '6px', minHeight: '40px', padding: '8px 10px' }
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minWidth: 0 },
  spread: { justifyContent: 'space-between' },
  section: { borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '14px', minWidth: 0 },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr)',
    gap: '24px',
    '@container (min-width: 900px)': { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }
  },
  pages: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr)',
    gap: '16px',
    '@container (min-width: 620px)': { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' },
    alignItems: 'start'
  },
  choices: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  choice: { borderRadius: '16px', fontWeight: 400, whiteSpace: 'normal', textAlign: 'left' },
  advisor: {
    padding: '12px 14px',
    borderRadius: '6px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  title: { margin: 0, fontSize: '20px', fontWeight: 500 },
  heading: { margin: 0, fontSize: '16px', fontWeight: 500 },
  text: { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: '1.5' },
  meta: { margin: 0, color: tokens.colorNeutralForeground2, fontSize: '12px', lineHeight: '1.5', overflowWrap: 'anywhere' },
  ai: { color: tokens.colorBrandForeground1 },
  findingBody: { '&[hidden]': { display: 'none' }, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  evidence: { backgroundColor: tokens.colorNeutralBackground3, padding: '6px 8px', borderRadius: '4px' },
  evidenceList: { margin: 0, padding: 0, listStyle: 'none' },
  evidenceRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2px 8px', minWidth: 0 },
  evidenceText: { flex: '1 1 180px', minWidth: 0, overflowWrap: 'anywhere', fontSize: '12px', lineHeight: '18px' },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '4px',
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`
  },
  progressSpinner: { justifyContent: 'flex-start', minWidth: 0, '& .fui-Spinner__label': { fontSize: '14px', lineHeight: '20px' } },
  fact: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '10px',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere'
  },
  input: { flex: '1 1 180px', minWidth: 0 },
  preview: { maxWidth: '100%', width: '180px', maxHeight: '110px', objectFit: 'contain', borderRadius: '4px' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    '& th, & td': { textAlign: 'left', padding: '8px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, overflowWrap: 'anywhere' }
  },
  warning: { color: tokens.colorPaletteMarigoldForeground1 }
});

export interface ComparisonViewProps {
  value: ComparisonState;
  onChange(value: ComparisonState): void;
  services?: IComparisonServices;
  strings: IContentLensStrings;
  document: Document;
  locale: string;
  demo: boolean;
  full: boolean;
  width: number;
  /** Asks the owner for more room when a finding is inspected in a narrow card. */
  onExpand(): void;
  onOpenLink(url: string): void;
  storageWarning: boolean;
  onDemo?(enabled: boolean): void;
}

function AnswerText({ text, strings }: { text: string; full: boolean; strings: IContentLensStrings }): React.ReactElement {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const shortened = !expanded && text.length > 600;
  return <div className={styles.root}>
    <p className={styles.text}>{shortened ? text.slice(0, 600).replace(/\s+\S*$/, '') + '…' : text}</p>
    {text.length > 600 && <div>
      <Button size="small" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? strings.Comparison.lessAnswer : strings.Comparison.moreAnswer}
      </Button>
    </div>}
  </div>;
}

export function ComparisonView(props: ComparisonViewProps): React.ReactElement {
  const { strings: s, value: state } = props;
  const c = s.Comparison;
  const styles = useStyles();
  const tabId = useId('comparison-tabs');
  // Without saved selections, the selections come from the pages of the saved evidence.
  const selections = state.selections
    || state.evidence?.pages.map(p => ({
      site: { url: p.siteUrl, title: p.siteUrl },
      page: { pageItemId: p.pageItemId, title: p.pageTitle, pageKind: p.pageKind, sourceUrl: p.sourceUrl! }
    })) as [ComparisonSelection, ComparisonSelection] | undefined
    || [{}, {}];
  const picking = state.picking ?? !state.evidence;
  const [stage, setStage] = React.useState<'readA' | 'readB' | 'checks' | 'chat' | 'followup'>('readA');
  const [revealRequest, setRevealRequest] = React.useState(0);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const latestAnswerRef = React.useRef<HTMLElement>(null);
  const [findingsOpen, setFindingsOpen] = React.useState(false);
  const factsPanel = React.useRef<HTMLDetailsElement>(null);
  const [zoom, setZoom] = React.useState<PreviewZoomValue>('fit');
  const [failure, setFailure] = React.useState('');
  const [retryUntil, setRetryUntil] = React.useState(0);
  const [now, setNow] = React.useState(Date.now());
  const latest = React.useRef(state);
  latest.current = state;
  const sequence = React.useRef(0);
  const controller = React.useRef<AbortController>();
  const input = React.useRef<HTMLInputElement>(null);
  const focusAnswer = React.useRef(false);
  const change = (patch: Partial<ComparisonState>): void => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    props.onChange(next);
  };
  const setPicking = (value: boolean): void => change({ picking: value });
  React.useEffect(() => {
    if (latest.current.busy) change({ busy: false, interrupted: true });
    return () => {
      sequence.current++;
      controller.current?.abort();
    };
  }, []);
  React.useEffect(() => {
    if (!retryUntil) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryUntil]);
  React.useEffect(() => {
    if (focusAnswer.current && !state.busy && !picking && latestAnswerRef.current) {
      latestAnswerRef.current.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
      latestAnswerRef.current.focus({ preventScroll: true });
      focusAnswer.current = false;
    }
  }, [state.busy, state.answers.length, picking]);

  const evidence = state.evidence;
  const category = state.category || 'insights';
  const setCategory = (value: NonNullable<ComparisonState['category']>): void =>
    change({ category: value, item: undefined, selected: undefined });
  const reveal = (): void => setRevealRequest(value => value + 1);
  const measuredPages = React.useMemo(() => evidence?.pages.map(p => pageNotes({
    sources: [p], findings: [], decisions: [], rules: [], labels: checkLabels(s), strings: s, now: 0, groups: ['a11y', 'layout']
  })) || [], [evidence, s]);

  const chatCoverage = React.useMemo(() => {
    if (!evidence) return undefined;
    try {
      const context = JSON.parse(chatContext(evidence)) as { pages: Array<{ text: string; textOmittedFromChat: number }> };
      return context.pages.map(page => ({ sent: page.text.length, omitted: page.textOmittedFromChat }));
    } catch {
      return undefined;
    }
  }, [evidence]);
  const initialAnswer = state.answers.find(a => a.highlights.length);
  const statusText = state.busy ? c['progress_' + stage] : state.interrupted ? c.interrupted : failure;
  const cannotCompare = !props.demo && (!selections.every(p => p.site && p.page) || !props.services);
  function stop(): void {
    sequence.current++;
    controller.current?.abort();
    change({ busy: false, interrupted: true });
  }
  async function ask(question: string, fresh: boolean = false, supplied?: ComparisonEvidence): Promise<void> {
    const turnEvidence = supplied || latest.current.evidence;
    const followUpBlocked = !fresh && (latest.current.interrupted || latest.current.answers.length >= 12);
    if (!turnEvidence || latest.current.busy || Date.now() < retryUntil || followUpBlocked) return;
    const prior = latest.current;
    const run = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setStage(!fresh && prior.answers.length ? 'followup' : 'chat');
    change({ busy: true, interrupted: false, ...(fresh ? { answers: [], conversationId: undefined } : {}) });
    setFailure('');
    try {
      let result: { conversationId: string; answer: CopilotInterpretation };
      if (props.demo) {
        result = { conversationId: 'prepared', answer: demoAnswer(turnEvidence, question, s) };
      } else if (props.services?.chat) {
        const previous = {
          id: fresh ? undefined : prior.conversationId,
          messageIds: fresh ? [] : prior.answers.reduce<string[]>((ids, a) => ids.concat(a.responseMessageIds || [a.messageId]), [])
        };
        result = await props.services.chat.turn(turnEvidence, question, props.locale, previous, controller.current.signal);
      } else {
        result = await Promise.reject(new ComparisonChatError('access'));
      }
      if (sequence.current !== run) return;
      focusAnswer.current = !fresh && prior.answers.length > 0;
      setFindingsOpen(false);
      change({
        busy: false,
        interrupted: false,
        conversationId: result.conversationId,
        answers: [...(fresh ? [] : prior.answers), result.answer].slice(-12),
        question: '',
        category: 'insights'
      });
    } catch (error) {
      if (sequence.current !== run) return;
      const code = error instanceof ComparisonChatError ? error.code : 'response';
      if (error instanceof ComparisonChatError && error.retryAfter) setRetryUntil(Date.now() + error.retryAfter * 1000);
      setFailure(c['error_' + code]);
      change({ busy: false, interrupted: true });
    }
  }
  const submit = (question: string, fresh: boolean = false): void => {
    ask(question, fresh).catch(() => setFailure(c.error_response));
  };
  function select(index: 0 | 1, selection: ComparisonSelection): void {
    const next: [ComparisonSelection, ComparisonSelection] = [selections[0], selections[1]];
    next[index] = selection;
    // A new page invalidates every answer and the Copilot conversation at once.
    change({
      ...emptyComparison(),
      evidence: undefined, conversationId: undefined, selected: undefined, finding: undefined, category: undefined, item: undefined,
      selections: next,
      picking: true
    });
    setFailure('');
  }
  async function compare(): Promise<void> {
    if (latest.current.busy || cannotCompare) return;
    const run = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setStage('readA');
    change({
      ...emptyComparison(),
      evidence: undefined, conversationId: undefined, selected: undefined, finding: undefined, category: undefined, item: undefined,
      selections: [selections[0], selections[1]],
      picking: true,
      busy: true
    });
    setFailure('');
    try {
      let nextEvidence: ComparisonEvidence;
      if (props.demo) {
        const fixture = await new FixtureContentService().read({
          siteUrl: demoSiteUrl, mode: 'page', pageKind: 'both', pageItemId: 17, lookbackDays: 7
        });
        nextEvidence = demoComparison(fixture.sources[0], props.document, props.locale);
      } else {
        // Both reads share one request pacing, so page A loads before page B. The Page and Comments review stays as it is.
        const a = await props.services!.read(selections[0].site!, selections[0].page!, controller.current.signal);
        if (sequence.current !== run) return;
        setStage('readB');
        const b = await props.services!.read(selections[1].site!, selections[1].page!, controller.current.signal);
        if (sequence.current !== run) return;
        if (sameSavedPage(a, b)) {
          change({ busy: false });
          setFailure(c.sameSnapshot);
          return;
        }
        setStage('checks');
        nextEvidence = await props.services!.measure(a, b, props.locale, controller.current.signal);
      }
      if (sequence.current !== run) return;
      change({ evidence: nextEvidence, busy: false });
      setPicking(false);
      await ask(c.initialQuestion, true, nextEvidence);
    } catch {
      if (sequence.current === run) {
        change({ busy: false });
        setFailure(c.referenceUnavailable);
      }
    }
  }
  const sourceLink = (url: string | undefined, label: string): React.ReactNode => {
    const safe = url && httpsUrl(url);
    if (!safe || props.demo) return label;
    return <Link data-interception="off" target="_blank" rel="noopener noreferrer" href={safe} onClick={event => {
      event.preventDefault();
      props.onOpenLink(safe);
    }}>{label}</Link>;
  };
  const location = (item: { section: number; column: number; blockId: string }): string =>
    item.section ? format(c.location, item.section, item.column) : c[item.blockId] || c.page;
  const imageStatus = (image: ImageUse): string => {
    if (image.state === 'none') return c.noImageByDesign;
    if (image.state === 'unknown') return c.unknown;
    if (image.role === 'thumbnail' || image.role === 'quickLinks') return c.metadataImage;
    if (image.decorative) return c.decorative;
    if (image.alt === undefined) return c.altUnknown;
    return image.alt.trim() ? c.altSupplied : c.altMissing;
  };
  function factText(fact: ComparisonEvidence['facts'][number]): string {
    if (fact.kind !== 'a11y' && fact.kind !== 'layout') return (c[fact.kind] || fact.kind) + ': ' + fact.value;
    const definition = checkCatalog.find(check => (check.kinds as readonly string[]).indexOf(fact.value.split(':')[0]) >= 0);
    return c.ruleFinding + ': ' + (definition ? checkRule(s, definition) : c.unknown);
  }
  function showEvidence(ids: string[]): React.ReactNode {
    if (!evidence) return undefined;
    if (!ids.length) return undefined;
    return <div className={styles.evidence}>
      <p className={styles.meta}>{c.measured}{props.demo ? ' · ' + c.prepared : ''}</p>
      <ul className={styles.evidenceList}>{ids.map(id => {
        const fact = evidence.facts.find(f => f.id === id);
        const link = evidence.links.find(l => l.id === id);
        const pageIndex = id.startsWith('A:') ? 0 : 1;
        const page = pageIndex ? 'B' : 'A';
        const source = evidence.pages[pageIndex];
        const image = source.page?.media?.images.find(im => (pageIndex ? 'B:' : 'A:') + im.id === id);
        const use = link && source.page?.media?.links.find(l => l.id === link.useId);
        const textLocation = textLocations(source, page).find(l => l.id === id);
        let detail = c.unknown;
        if (fact) detail = factText(fact);
        else if (link) detail = c['state_' + link.state] + ' · ' + (use?.name || c.unnamed);
        else if (textLocation) detail = textLocation.label;
        else if (image) detail = c[image.role] + ' · ' + imageStatus(image);
        const label = page + ' · ' + detail;
        return <li key={id} className={styles.evidenceRow}>
          <span className={styles.evidenceText}>{label}</span>
          <Button appearance="transparent" size="small" aria-label={format(c.inspectEvidence, label)} onClick={() => {
            change({ selected: textLocation?.blockId || fact?.blockId || use?.blockId || image?.blockId, page });
            reveal();
            if (fact && !fact.blockId && factsPanel.current) factsPanel.current.open = true;
            if (!props.full) props.onExpand();
          }}>{c.inspectShort}</Button>
        </li>;
      })}</ul>
    </div>;
  }
  const attribution = (reply: CopilotInterpretation): React.ReactNode => <>
    <p className={styles.meta}>{props.demo ? c.prepared : c.interpretation}{!reply.citations.length && ' · ' + c.noCitations}</p>
    {reply.sensitivity.map(label => <p className={styles.meta} key={label}>{c.sensitivity}: {label}</p>)}
    {!!reply.citations.length && <details>
      <summary>{c.citations} ({reply.citations.length})</summary>
      <p className={styles.meta}>{c.citationScope}</p>
      {reply.citations.map((citation, i) => <p key={i}>{sourceLink(citation.url, citation.title)}</p>)}
    </details>}
  </>;
  const followups = state.answers.slice(1);
  const newestAnswer = followups[followups.length - 1];
  const answer = (reply: CopilotInterpretation, newest = false): React.ReactNode => <article
    key={reply.messageId}
    ref={newest ? latestAnswerRef : undefined}
    tabIndex={newest ? -1 : undefined}
    aria-label={newest ? c.latestAnswer : undefined}
    data-testid={newest ? 'comparison-latest-answer' : undefined}
    className={styles.root}>
    {newest && <h2 className={styles.heading}>{c.latestAnswer}</h2>}
    <p className={styles.meta}>{reply.question}</p>
    <AnswerText text={reply.text} full={props.full} strings={s} />
    {attribution(reply)}
  </article>;
  const answersFull = state.answers.length >= 12;
  const askBlocked = state.busy || state.interrupted || answersFull;
  const discussion = <section className={mergeClasses(styles.section, styles.root)} aria-label={c.ask}>
    {newestAnswer
      ? answer(newestAnswer, true)
      : <p className={mergeClasses(styles.meta, styles.ai)}>{c.ask}{props.demo ? ' · ' + c.prepared : ''}</p>}
    {followups.length > 1 && <details>
      <summary>{c.previousAnswers} ({followups.length - 1})</summary>
      {followups.slice(0, -1).map(a => answer(a))}
    </details>}
    <div className={styles.row}>
      <Input ref={input} className={styles.input} value={state.question} maxLength={2000} aria-label={c.question}
        placeholder={c.question} disabled={state.busy || state.interrupted} onChange={(_event, data) => change({ question: data.value })}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && state.question.trim()) {
            event.preventDefault();
            submit(state.question);
          }
        }} />
      <Button disabled={!state.question.trim() || askBlocked} onClick={() => submit(state.question)}>{c.askButton}</Button>
    </div>
    {!newestAnswer && <div>
      <Button size="small" disabled={askBlocked} onClick={() => submit(c.suggested)}>{c.suggested}</Button>
    </div>}
    {(state.interrupted || answersFull) && <Button disabled={state.busy || now < retryUntil}
      onClick={() => submit(state.question.trim() || c.initialQuestion, true)}>
      {now < retryUntil ? format(c.retryAfter, Math.ceil((retryUntil - now) / 1000)) : c.restart}
    </Button>}
  </section>;
  const activeFinding = state.finding ?? 0;
  const activeIds = initialAnswer?.highlights[activeFinding]?.evidenceIds || [];
  const blockLabel = (page: 'A' | 'B', blockId: string): string => {
    const source = evidence?.pages[page === 'A' ? 0 : 1];
    const labels = source?.page?.structure?.sections.reduce<string[]>((all, section) => all.concat(
      ...section.columns.map(column => column.filter(block => block.id === blockId).map(block => block.label))
    ), []);
    return labels?.[0] || c[blockId] || c.page;
  };
  const referencedAreas = (ids: string[]): string => {
    if (!evidence) return '';
    return (['A', 'B'] as const).reduce<string[]>((all, page) => all.concat(
      previewLocations(evidence, ids, page).map(block => page + ' · ' + blockLabel(page, block))
    ), []).join(' / ');
  };
  /** True when an evidence ID of the finding resolves to the header or to a block of a page preview. */
  const isAnchored = (ids: string[]): boolean => !!evidence && (['A', 'B'] as const).some(page =>
    previewLocations(evidence, ids, page).some(block => block === 'header'
      || evidence.pages[page === 'A' ? 0 : 1].page?.structure?.sections.some(section =>
        section.columns.some(column => column.some(item => item.id === block)))));
  const highlights = <section className={styles.root}>
    <div><p className={mergeClasses(styles.meta, styles.ai)}>{c.interpretation}{props.demo ? ' · ' + c.prepared : ''}</p></div>
    <div className={mergeClasses(styles.choices, styles.sidebarChoices)} aria-label={s.Preview.findings}>
      {initialAnswer?.highlights.map((finding, index) => <Button key={index} className={styles.choice} size="small"
        appearance={activeFinding === index ? 'primary' : 'secondary'} aria-pressed={activeFinding === index}
        aria-controls={tabId + '-finding-' + index} onClick={() => {
          change({ finding: index, selected: undefined });
          reveal();
        }}>{index + 1} · {finding.title}</Button>)}
    </div>
    {initialAnswer?.highlights.map((finding, index) => <div key={index} id={tabId + '-finding-' + index} hidden={activeFinding !== index}
      className={mergeClasses(styles.findingBody, styles.advisor)}>
      <div id={'comparison-finding-' + index}>
        <p className={styles.text}>{finding.explanation}</p>
        {referencedAreas(finding.evidenceIds) && <p className={styles.meta}>
          {c.referencedAreas}: {referencedAreas(finding.evidenceIds)}
        </p>}
        {!!finding.evidenceIds.length && <details>
          <summary>{s.Preview.evidence}</summary>
          {showEvidence(finding.evidenceIds)}
          <p className={styles.meta}>{c.insightNext}</p>
        </details>}
        {evidence && !isAnchored(finding.evidenceIds) && <p className={styles.meta}>{s.Preview.unanchored}</p>}
      </div>
    </div>)}
    {initialAnswer && attribution(initialAnswer)}
    {!initialAnswer && (state.answers[0]
      ? answer(state.answers[0])
      : <p className={styles.meta}>{state.busy ? c.waitingAnswer : c.noInterpretation}</p>)}
  </section>;
  type SavedLink = NonNullable<NonNullable<ComparisonEvidence['pages'][0]['page']>['media']>['links'][number];
  type MeasuredItem = {
    id: string;
    page: 'A' | 'B';
    note: PageNote;
    image?: ImageUse;
    link?: SavedLink;
    checked?: ComparisonEvidence['links'][number];
  };
  const items: MeasuredItem[] = [];
  evidence?.pages.forEach((source, i) => {
    const page = i ? 'B' : 'A';
    if (category === 'checks') measuredPages[i].notes.forEach(note => items.push({ id: page + ':check:' + note.n, page, note }));
    if (category === 'images') {
      (source.page?.media?.images || []).filter(image => image.state !== 'unknown').forEach(image => items.push({
        id: page + ':' + image.id,
        page,
        image,
        note: {
          n: 0, kind: 'a11y', before: '', mark: '', after: '', highlight: false,
          label: c[image.role],
          note: isDefaultThumbnail(image, source.siteUrl) ? c.defaultThumbnail : imageStatus(image),
          blockId: image.role === 'thumbnail' ? undefined : image.blockId,
          location: location(image),
          needsContext: false,
          noAI: true
        }
      }));
    }
    if (category === 'links') {
      (source.page?.media?.links || []).forEach(link => {
        const checked = evidence.links.find(l => l.page === page && l.useId === link.id);
        items.push({
          id: page + ':' + link.id,
          page,
          link,
          checked,
          note: {
            n: 0, kind: 'a11y', before: '', mark: '', after: '', highlight: false,
            label: link.name || c.unnamed,
            note: c['state_' + (checked?.state || 'unchecked')],
            blockId: link.blockId,
            location: location(link),
            needsContext: false,
            noAI: true
          }
        });
      });
    }
  });
  // Number the items in the order in which they are listed.
  items.forEach((item, i) => {
    item.note = { ...item.note, n: i + 1 };
  });
  const activeItem = items.find(item => item.id === state.item);
  const previewNotes = (page: 'A' | 'B'): PageNote[] => {
    if (category !== 'insights') return items.filter(item => item.page === page).map(item => item.note);
    if (!evidence) return [];
    return (initialAnswer?.highlights || []).reduce<PageNote[]>((notes, finding, index) => notes.concat(
      previewLocations(evidence, finding.evidenceIds, page).map(blockId => ({
        n: index + 1, kind: 'finding' as const, before: '', mark: '', after: '', highlight: false,
        label: finding.title, note: finding.explanation, needsContext: false, noAI: false, blockId, location: ''
      }))
    ), []);
  };
  const chooseItem = (item: MeasuredItem): void => {
    change({ item: item.id, page: item.page, selected: item.note.blockId });
    reveal();
  };
  const selectedLocations = (page: 'A' | 'B'): string[] => {
    if (state.selected) return state.page === page ? [state.selected] : [];
    return category === 'insights' ? previewLocations(evidence!, activeIds, page) : [];
  };
  let focusText: string | undefined = '';
  if (state.selected) focusText = state.page + ' · ' + blockLabel(state.page, state.selected);
  else if (category === 'insights') focusText = initialAnswer?.highlights[activeFinding]?.title;
  else if (activeItem) focusText = activeItem.page + ' · ' + activeItem.note.label;
  const areaWithoutFinding = category === 'checks' && state.selected && !activeItem;
  const showDetails = (): void => {
    sidebarRef.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
    sidebarRef.current?.focus();
  };
  function nextStep(item: MeasuredItem): string {
    if (item.link) return c['nextLink_' + (item.checked?.state || 'unchecked')];
    if (item.image) return item.image.role === 'thumbnail' ? c.nextThumbnail : c.nextImage;
    // An automatic note already states its action.
    if (item.note.title) return '';
    return c['next_' + item.note.check] || c.nextRule;
  }
  const previews = evidence && <div className={styles.root}>
    <div className={mergeClasses(styles.row, styles.spread)} data-testid="comparison-selection-feedback">
      <p role="status" aria-live="polite" className={styles.meta}>{focusText ? c.inspecting + ': ' + focusText : c.selectToInspect}</p>
      {focusText && <Button size="small" appearance="transparent" onClick={showDetails}>{c.showFindingDetails}</Button>}
    </div>
    {!props.demo && <div className={styles.row}><PreviewZoom value={zoom} onChange={setZoom} strings={s} shared /></div>}
    <div className={styles.pages}>{evidence.pages.map((source, i) => {
      const page = i ? 'B' : 'A';
      return <section key={page} className={styles.root}>
        <PagePreview sources={[source]} strings={s} demo={props.demo} full={props.full} bounded
          width={props.width >= 620 ? props.width / 2 - 40 : props.width - 40}
          label={page} hideScope zoom={zoom} hideZoom hideFindingNavigation notes={previewNotes(page)} revealRequest={revealRequest}
          selectedNote={category === 'insights' ? activeFinding + 1 : activeItem?.note.n}
          onSelectNote={note => {
            if (category === 'insights') {
              setFindingsOpen(true);
              change({ finding: note.n - 1, selected: undefined });
              reveal();
            } else {
              const item = items.find(candidate => candidate.note.n === note.n);
              if (item) chooseItem(item);
            }
          }}
          heading={sourceLink(source.sourceUrl, source.pageTitle)}
          highlighted={selectedLocations(page)}
          onSelect={block => {
            const note = measuredPages[i].notes.find(candidate => candidate.blockId === block);
            change({ category: 'checks', item: note ? page + ':check:' + note.n : undefined, selected: block, page });
            reveal();
          }} />
      </section>;
    })}</div>
  </div>;
  const itemSummary = (item: MeasuredItem): string => category === 'checks'
    ? item.note.title || item.note.note
    : item.note.label + ' · ' + item.note.note;
  const measuredSidebar = <section className={styles.root} aria-label={c.measured}>
    <p className={styles.meta}>{c.measured}{props.demo ? ' · ' + c.prepared : ''}</p>
    <div className={mergeClasses(styles.choices, styles.sidebarChoices)}>
      {items.map(item => <Button key={item.id} size="small" className={styles.choice}
        appearance={activeItem?.id === item.id ? 'primary' : 'secondary'} aria-pressed={activeItem?.id === item.id}
        onClick={() => chooseItem(item)}>{item.note.n} · {item.page} · {itemSummary(item)}</Button>)}
    </div>
    {areaWithoutFinding && <div className={styles.advisor} data-testid="area-without-findings">
      <p className={styles.text}>{c.selectedArea}: {state.page} · {blockLabel(state.page, state.selected!)}</p>
      <p className={styles.meta}>{c.noAreaFindings}</p>
    </div>}
    {!items.length && !areaWithoutFinding && <p className={styles.meta}>{c['empty_' + category]}</p>}
    {category === 'checks' && (!items.length || areaWithoutFinding) && <>
      <p className={styles.meta}>{c.checksNotMeaning}</p>
      <Button size="small" onClick={() => setCategory('insights')}>{c.viewInsights}</Button>
    </>}
    {!!items.length && !activeItem && <p className={styles.meta}>{c.chooseFinding}</p>}
    {activeItem && <div className={mergeClasses(styles.advisor, styles.root)}>
      <p className={styles.meta}>{activeItem.page} · {evidence?.pages[activeItem.page === 'A' ? 0 : 1].pageTitle}</p>
      <p className={styles.text}>{activeItem.note.note}</p>
      {activeItem.note.mark && <p className={styles.text}>{activeItem.note.mark}</p>}
      <p className={styles.meta}>{activeItem.note.location}</p>
      {nextStep(activeItem) && <div>
        <p className={styles.heading}>{c.publisherNext}</p>
        <p className={styles.text}>{nextStep(activeItem)}</p>
      </div>}
      {!activeItem.note.blockId && <p className={styles.meta}>{s.Preview.unanchored}</p>}
      {activeItem.image && imageDetails(activeItem.image, activeItem.page)}
      {activeItem.link && <>
        <p className={styles.meta}>
          {sourceLink(httpsUrl(activeItem.link.url, evidence!.pages[activeItem.page === 'A' ? 0 : 1].siteUrl), activeItem.link.url)}
        </p>
        <p className={styles.meta}>
          {c['reason_' + (activeItem.checked?.reason || 'unsupported')]}
          {activeItem.checked?.status ? ' · HTTP ' + activeItem.checked.status : ''}
        </p>
        {activeItem.checked?.checkedAt && <p className={styles.meta}>
          {c.checkedAt}: {new Date(activeItem.checked.checkedAt).toLocaleString()} · {c.currentUser}
        </p>}
      </>}
    </div>}
    <p className={styles.meta}>{category === 'checks' ? c.mapScope : c.partialInventory}</p>
  </section>;
  // After the first follow-up, the conversation comes first and the comparison findings fold away.
  const insightsPanel = newestAnswer ? <>
    {discussion}
    <details open={findingsOpen} onToggle={event => setFindingsOpen(event.currentTarget.open)}>
      <summary>{c.comparisonFindings}</summary>
      {highlights}
    </details>
  </> : <>{highlights}{discussion}</>;
  const sidebar = <aside ref={sidebarRef} tabIndex={-1} className={mergeClasses(styles.sidebar, styles.root)}
    aria-label={s.Preview.findings} data-testid="comparison-findings-sidebar">
    <label htmlFor={tabId + '-category'} className={styles.heading}>{s.Preview.findings}</label>
    <Select id={tabId + '-category'} value={category}
      onChange={(_event, data) => setCategory(data.value as NonNullable<ComparisonState['category']>)}>
      <optgroup label={c.interpretation}><option value="insights">{c.insights}</option></optgroup>
      <optgroup label={c.measured}>
        {(['checks', 'images', 'links'] as const).map(value => <option key={value} value={value}>{c['filter_' + value]}</option>)}
      </optgroup>
    </Select>
    {category === 'insights' ? insightsPanel : measuredSidebar}
  </aside>;
  const coverage = evidence && <details className={styles.section}>
    <summary>{c.coverage}</summary>
    <p className={styles.text}>{c.coverageScope}</p>
    <p className={styles.meta}>{c.selectionMeaning}</p>
    {evidence.pages.map((source, i) => {
      const notes = Array.from(new Set([
        ...(source.omittedParts || []),
        ...(source.page?.media?.omitted || []),
        ...(!source.page?.media ? [c.inventoryUnavailable] : [])
      ]));
      let textCoverage = c.textCoverageUnknown;
      if (chatCoverage) textCoverage = chatCoverage[i].omitted ? c.textShortened : c.loadedTextSent;
      return <section key={i}>
        <h3 className={styles.heading}>{i ? 'B' : 'A'} · {source.pageTitle}</h3>
        <p className={styles.meta}>{props.demo ? s.Preview.scope : format(s.Preview.liveScope, source.page?.version || '—')}</p>
        <ul>
          <li>{textCoverage}</li>
          {!!source.omittedParts?.length && <li>{c.unreadParts}</li>}
          {(!source.page?.media || !!source.page.media.omitted.length) && <li>{c.inventoryPartialMeaning}</li>}
        </ul>
        {source.page?.media?.images.filter(image => image.state === 'unknown').map(image => <p key={image.id} className={styles.meta}>
          {c[image.role]} · {image.role === 'banner' ? c.bannerUnknownMeaning : c.imageUnknownMeaning}
        </p>)}
        <details>
          <summary>{c.technicalDetails}</summary>
          {chatCoverage && <p className={styles.meta}>{format(c.chatTextCoverage, chatCoverage[i].sent, chatCoverage[i].omitted)}</p>}
          {notes.map((item, j) => <p className={styles.meta} key={j}>{item}</p>)}
        </details>
      </section>;
    })}
    <p className={styles.meta}>{c.limits}</p>
  </details>;
  function imageDetails(image: ImageUse, page: 'A' | 'B'): React.ReactNode {
    const source = evidence!.pages[page === 'A' ? 0 : 1];
    const safe = image.url && httpsUrl(image.url, source.siteUrl);
    // A live preview loads only an image file from the page's own origin.
    const sameOriginImage = (url: string): boolean =>
      new URL(url).origin === new URL(source.siteUrl).origin && /\.(png|jpe?g|gif|webp)$/i.test(new URL(url).pathname);
    let preview: string | undefined;
    if (props.demo && image.url) preview = demoImage;
    else if (safe && sameOriginImage(safe)) preview = safe;
    const defaultThumbnail = isDefaultThumbnail(image, source.siteUrl);
    const dimensions = image.width && image.height ? `${image.width} × ${image.height} px` : c.dimensionsUnknown;
    const size = image.bytes !== undefined ? format(c.bytes, image.bytes.toLocaleString()) : c.sizeUnknown;
    const showsAlt = image.state === 'configured' && image.role !== 'thumbnail' && image.role !== 'quickLinks';
    return <>
      {preview && <img className={styles.preview} src={preview} loading="lazy"
        alt={props.demo ? c.demoImage : image.alt || c.imagePreview} />}
      {defaultThumbnail && <p className={styles.meta}>{c.defaultThumbnailMeaning}</p>}
      {image.state === 'configured' && !defaultThumbnail && <p className={styles.meta}>{dimensions} · {size}</p>}
      <details>
        <summary>{c.details}</summary>
        <p className={styles.meta}>{sourceLink(safe, safe || c.sourceUnknown)}</p>
        {safe && <p className={styles.meta}>
          {format(c.fileExtension, new URL(safe).pathname.match(/\.([a-z0-9]+)$/i)?.[1].toUpperCase() || c.unknown)}
        </p>}
        {showsAlt && <p className={styles.text}>{image.alt === undefined ? c.altUnknown : image.alt || c.emptyAlt}</p>}
        {image.state === 'configured' && <p className={styles.meta}>{c['metadata_' + image.metadata]}</p>}
      </details>
    </>;
  }
  function maps(): React.ReactNode {
    return <div className={styles.columns}>{evidence?.pages.map((source, i) => {
      const data = measuredPages[i];
      const page = i ? 'B' : 'A';
      const selected = state.page === page ? state.selected : undefined;
      const selectBlock = (id: string): void => {
        const note = data.notes.find(candidate => candidate.blockId === id);
        change({ category: 'checks', item: note ? page + ':check:' + note.n : undefined, selected: id, page });
        reveal();
      };
      return <section key={i} className={styles.root}>
        <h2 className={styles.heading}>{page} · {source.pageTitle}</h2>
        {source.page?.structure
          ? <PageMap strings={s} structure={source.page.structure} blocks={data.blocks.map(block => ({ ...block, notChecked: false }))}
            notes={data.notes} selected={selected} full={false} width={Math.max(260, props.width / 2 - 40)} onSelect={selectBlock} />
          : <p>{s.NoLayout}</p>}
        <p className={styles.meta}>{c.mapScope}</p>
        {data.blocks.filter(block => block.id === selected && block.start !== undefined && block.end !== undefined)
          .map(block => <blockquote key={block.id} className={styles.fact}>
            {source.text.slice(block.start, Math.min(block.end!, source.text.length))}
            {block.end! > source.text.length && ' · ' + c.partialText}
          </blockquote>)}
        {data.notes.filter(note => !selected || note.blockId === selected).map(note => <div className={styles.fact} key={note.n}>
          <p className={styles.meta}>{c.measured} · {note.location}</p>{note.note || note.label}
        </div>)}
        {evidence.facts.filter(fact => fact.page === page && fact.kind !== 'a11y' && fact.kind !== 'layout')
          .map(fact => <p key={fact.id} className={styles.meta}>{factText(fact)}</p>)}
      </section>;
    })}</div>;
  }

  return <section className={styles.root} aria-label={c.title} data-testid="comparison">
    <div className={mergeClasses(styles.row, styles.spread)}>
      <h1 className={styles.title}>{c.title}</h1>
      <div className={styles.row}>
        {!picking && evidence && <Button appearance="transparent" disabled={state.busy} onClick={() => setPicking(true)}>
          {c.changePages}
        </Button>}
      </div>
    </div>
    {props.demo && <p className={styles.meta}>{c.demoNotice}</p>}
    {props.storageWarning && <p className={styles.warning}>{c.storageWarning}</p>}
    {state.busy ? <div className={styles.progress} data-testid="comparison-progress">
      <div className={mergeClasses(styles.row, styles.spread)}>
        <div role="status" aria-live="polite" aria-atomic="true">
          <Spinner className={styles.progressSpinner} size="small" label={statusText} labelPosition="after" />
        </div>
        <Button onClick={stop}>{s.CancelAnalysis}</Button>
      </div>
      {(stage === 'chat' || stage === 'followup') && <p className={styles.meta}>{c.progressChatHint}</p>}
    </div> : statusText && <p role="status" aria-live="polite" className={styles.meta}>{statusText}</p>}
    {picking ? <div className={styles.root}>
      <p className={styles.meta}>{c.startHint}</p>
      {props.demo ? <div className={styles.columns}>
        <section aria-label={c.pageA}><h2 className={styles.heading}>{c.pageA}</h2><p>{c.demoPageA}</p></section>
        <section aria-label={c.pageB}><h2 className={styles.heading}>{c.pageB}</h2><p>{c.demoReference}</p></section>
      </div> : <div className={styles.columns}>
        {([0, 1] as const).map(index => <section key={index} className={styles.root} aria-label={index ? c.pageB : c.pageA}>
          <h2 className={styles.heading}>{index ? c.pageB : c.pageA}</h2>
          <SitePicker strings={s} discovery={props.services?.discovery} value={selections[index].site} disabled={state.busy}
            onSelect={site => select(index, { site })} />
          <PageCombobox key={selections[index].site?.url || ''} strings={s} discovery={props.services?.discovery}
            site={selections[index].site} value={selections[index].page} disabled={state.busy}
            onSelect={page => select(index, { site: page?.site || selections[index].site, page })} />
        </section>)}
      </div>}
      <div className={styles.row}>
        <Button appearance="primary" disabled={state.busy || cannotCompare} onClick={() => {
          compare().catch(() => setFailure(c.referenceUnavailable));
        }}>{c.compare}</Button>
        {evidence && <Button disabled={state.busy} onClick={() => setPicking(false)}>{s.CancelAnalysis}</Button>}
        {props.onDemo && <Button disabled={state.busy} onClick={() => props.onDemo!(!props.demo)}>
          {props.demo ? s.LeaveDemo : s.EnableDemo}
        </Button>}
      </div>
    </div> : evidence && <>
      <div className={mergeClasses(styles.review, styles.reviewFull)} data-testid="comparison-review">
        {previews}{sidebar}
      </div>
      <details ref={factsPanel} className={styles.section}>
        <summary>{c.structureFacts}</summary>
        <table className={styles.table}>
          <thead><tr><th>{c.page}</th><th>A</th><th>B</th></tr></thead>
          <tbody>{(['words', 'sentences', 'sections', 'columns'] as const).map(kind => <tr key={kind}>
            <th>{c[kind]}</th>
            {(['A', 'B'] as const).map(id => <td key={id}>
              {evidence.facts.find(f => f.page === id && f.kind === kind)?.value || c.unknown}
            </td>)}
          </tr>)}</tbody>
        </table>
        {maps()}
      </details>
      {(evidence.pages.some(p => p.omittedParts?.length) || chatCoverage?.some(entry => entry.omitted)) && <p className={styles.meta}>
        {c.partialText}
      </p>}
      {coverage}
    </>}
  </section>;
}
