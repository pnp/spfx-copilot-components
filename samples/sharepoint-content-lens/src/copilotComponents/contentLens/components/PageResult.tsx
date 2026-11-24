import * as React from 'react';
import { Button, Link, mergeClasses } from '@fluentui/react-components';
import { Checkmark16Regular, Flag16Regular, Open16Regular, Subtract16Regular } from '@fluentui/react-icons';
import type { CategoryId, ReviewFinding, ReviewSource, SourceReviewDecision } from '../domain/contracts';
import { isTextCutNote, maxSourceTextChars } from '../domain/sourceSchema';
import { maxNotesPerGroup, type CheckDefinition, type CheckGroup } from '../domain/checkCatalog';
import { checkGroupLabel, checkRule, groupChecks } from './checkRules';
import { pageNotes, type PageNote } from './notes';
import { PagePreview } from './PagePreview';
import { useContentLensStyles } from './ContentLens.styles';
import { format, formatNodes } from './viewUtils';

export interface IPageResultProps {
  strings: IContentLensStrings;
  labels: Record<CategoryId, string>;
  descriptions: Record<CategoryId, string>;
  /** The page, or all of its parts. */
  sources: ReviewSource[];
  findings: ReviewFinding[];
  decisions: SourceReviewDecision[];
  rules: string[];
  copilotSelected?: boolean;
  /** The checks without AI that were on for this result. */
  groups: readonly CheckGroup[];
  demo: boolean;
  /** Host fullscreen, or a card at least 900 px wide: the page preview and the findings side by side. */
  full: boolean;
  width: number;
  now: number;
  /** The last request for this page came back without a usable answer. */
  failed: boolean;
  failureMessage?: string;
  failureDetails?: string;
  headingRef: React.RefObject<HTMLHeadingElement>;
  /** The next part of a long page, or the part Copilot did not answer. */
  nextPart?: { index: number; retry: boolean };
  onCheckPart(): void;
  /** Back to the start, for another page or other rules. */
  onNewCheck(): void;
  onOpenLink(url: string): void;
}

type Styles = ReturnType<typeof useContentLensStyles>;

function Passage({ note, className, styles }: { note: PageNote; className: string; styles: Styles }): React.ReactElement {
  return <blockquote className={className}>
    {note.highlight ? <mark className={styles.mark}>{note.mark}</mark> : note.mark}
  </blockquote>;
}

function NoteLine({ note, strings: s, descriptions, small, styles }: {
  note: PageNote;
  strings: IContentLensStrings;
  descriptions: Record<CategoryId, string>;
  small: boolean;
  styles: Styles;
}): React.ReactElement {
  // Without a note from Copilot, a check says what it covers.
  const description = note.categoryId && !note.note ? descriptions[note.categoryId] : '';
  const fallback = description ? description.charAt(0).toUpperCase() + description.slice(1) : '';
  const text = [note.note || fallback, note.needsContext ? s.NeedsContextNote : '', note.noAI ? s.FoundWithoutAI : '']
    .filter(Boolean)
    .join(' ');
  return <p className={small ? styles.noteLineSmall : styles.noteLine}>
    <strong>{note.label}</strong>{text ? ' · ' + text : ''}
  </p>;
}

/**
 * The result of a page check: the verdict, the page preview with its numbered findings and the notes of the chosen
 * block, and every check without AI with its own result.
 */
export function PageResult(props: IPageResultProps): React.ReactElement {
  const { strings: s, full } = props;
  const styles = useContentLensStyles();
  const result = pageNotes({
    sources: props.sources, findings: props.findings, decisions: props.decisions, rules: props.rules,
    labels: props.labels, strings: s, now: props.now, groups: props.groups
  });
  const on = (group: CheckGroup): boolean => props.groups.indexOf(group) >= 0;
  const { notes, blocks, counts } = result;
  const first = props.sources.slice().sort((a, b) => (a.part?.index || 1) - (b.part?.index || 1))[0];
  const structure = first?.page?.structure;
  const [selected, setSelected] = React.useState<string>();
  const [selectedNote, setSelectedNote] = React.useState<number>();
  // The check list leads with each group's result; the rules that passed are listed on request.
  const [allRules, setAllRules] = React.useState(false);

  const withBlocks = notes.filter(note => note.blockId);
  const defaultBlock = (withBlocks.find(note => note.kind === 'finding') || withBlocks[0])?.blockId;
  // Any block can be chosen; without a choice, the first block with a Copilot finding, else with a note.
  // A page without notes on a block has no chosen block, so nothing on it is framed.
  // A requested note that belongs to no block clears the choice.
  const requestedNote = notes.find(note => note.n === selectedNote);
  let chosen: string | undefined;
  if (requestedNote && !requestedNote.blockId) chosen = undefined;
  else if (selected && blocks.some(block => block.id === selected)) chosen = selected;
  else chosen = defaultBlock;
  const requestedInChosen = requestedNote && requestedNote.blockId === chosen ? requestedNote : undefined;
  const chosenNote = requestedInChosen || withBlocks.find(note => note.blockId === chosen);
  const selectNote = (note: PageNote): void => {
    setSelectedNote(note.n);
    setSelected(note.blockId);
  };
  const textCut = !!first?.omittedParts?.some(isTextCutNote);
  const partial = props.copilotSelected !== false && result.partsTotal > 1 && result.partsChecked < result.partsTotal;

  let version = '';
  if (first?.page) {
    const template = first.page.state === 'published' ? s.PageVersionPublished : s.PageVersionDraft;
    const savedDate = first.page.modified
      ? new Date(first.page.modified).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    version = format(template, first.page.version, savedDate);
  }
  const factsLine = structure ? <p className={styles.meta} data-testid="page-facts">
    {format(s.PageFacts, structure.words.toLocaleString(), structure.textBlocks, structure.webParts)}
  </p> : undefined;
  const sourceLink = first?.sourceUrl && <>
    {version ? ' · ' : ''}
    <Link data-interception="off" href={first.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}
      onClick={event => {
        event.preventDefault();
        props.onOpenLink(first.sourceUrl!);
      }}>
      <Open16Regular aria-hidden="true" />{s.OpenInSharePoint}
    </Link>
  </>;
  const versionLine = props.demo
    ? <p className={styles.meta}>{s.DemoMeta}</p>
    : <p className={styles.meta} data-testid="page-version">{version}{sourceLink}</p>;
  const meta = <>{versionLine}{factsLine}</>;

  const plural = (count: number, one: string, many: string): string => format(count === 1 ? one : many, count);
  const preparedNote = props.demo ? ' · ' + s.Comparison.prepared : '';
  const verdictParts: React.ReactNode[] = [];
  // Findings can stand while no part counts as checked, for example when a rule got no answer.
  // The verdict then says that the review is unfinished.
  const unchecked = result.partsChecked === 0;
  const nothingChecked = unchecked && !counts.findings;
  if (props.copilotSelected === false) {
    verdictParts.push(s.CopilotNotSelected);
  } else if (nothingChecked) {
    // After an unusable answer the verdict says so, so that it does not read as if nothing was asked.
    verdictParts.push(props.failed ? props.failureMessage || s.VerdictAnswerUnusable : s.VerdictNotChecked);
  } else if (counts.findings) {
    const template = partial && !unchecked ? s.VerdictCopilotPartial : s.VerdictCopilot;
    const passages = <strong key="f">{plural(counts.findings, s.PassagesOne, s.Passages)}</strong>;
    verdictParts.push(formatNodes(template, passages, result.checkedChars.toLocaleString()), unchecked ? ' ' + s.VerdictUnfinished : '');
  } else {
    verdictParts.push(partial ? format(s.VerdictCopilotNonePartial, result.checkedChars.toLocaleString()) : s.VerdictCopilotNone);
  }
  // The accessibility result is stated only when the check ran: it was on, and the page's layout was read.
  const automaticParts: React.ReactNode[] = [];
  if (on('a11y') && structure) {
    if (counts.a11y) {
      automaticParts.push(formatNodes(s.VerdictGaps, <strong key="g">{plural(counts.a11y, s.A11yGapsOne, s.A11yGaps)}</strong>));
    } else {
      automaticParts.push(s.VerdictGapsNone);
    }
  }
  const others = [
    counts.layout ? plural(counts.layout, s.VerdictLayoutOne, s.VerdictLayout) : '',
    counts.dates ? plural(counts.dates, s.VerdictDatesOne, s.VerdictDates) : '',
    counts.stale !== undefined ? format(s.VerdictStale, counts.stale) : ''
  ].filter(Boolean);
  if (others.length) automaticParts.push(' ', others.join(', ') + '.');
  const copilotCount = !unchecked || counts.findings ? ' · ' + counts.findings : '';
  const verdict = <div className={styles.tight} data-testid="verdict">
    <div data-testid="copilot-verdict">
      <p className={styles.meta}>{s.CopilotReviewLabel}{copilotCount}{preparedNote}</p>
      <p className={styles.verdict}>{verdictParts}</p>
    </div>
    {!!props.groups.length && <div data-testid="automatic-verdict">
      <p className={styles.meta}>{s.AutomaticChecksLabel} · {notes.filter(note => note.noAI).length}</p>
      {automaticParts.length > 0 && <p className={styles.verdict}>{automaticParts}</p>}
    </div>}
  </div>;

  const partButtonLabel = (nextPart: { index: number; retry: boolean }): string => {
    if (result.partsTotal === 1) return nextPart.retry ? s.SendToCopilotAgain : s.SendToCopilot;
    return nextPart.retry || props.failed ? s.RetryPageReview : s.ContinuePageReview;
  };
  const showPartLine = partial || textCut || props.failed || !!props.nextPart;
  // When nothing was checked, the verdict itself states the failure; otherwise the failure shows here.
  const partLine = showPartLine && <div className={styles.tight} data-testid="long-page">
    {partial && <p className={styles.warning}>{format(s.LongPageParts, result.partsChecked, result.partsTotal)}</p>}
    {!partial && textCut && <p className={styles.warning}>{format(s.TextCutNotice, maxSourceTextChars.toLocaleString())}</p>}
    {props.nextPart && <div className={styles.actions}>
      <Button className={styles.primary} appearance="primary" onClick={props.onCheckPart}>
        {partButtonLabel(props.nextPart)}
      </Button>
    </div>}
    {props.failed && !nothingChecked && <p className={styles.warning}>{props.failureMessage || s.AnalysisHostUnavailable}</p>}
    {props.failureDetails && <details className={styles.meta}>
      <summary>{s.AnalysisDiagnosticDetails}</summary>
      <p>{props.failureDetails}</p>
    </details>}
  </div>;

  const noteItem = (note: PageNote, testId: string = 'note'): React.ReactElement => {
    return <li key={note.n} className={styles.noteItem} data-testid={testId}>
      <span className={styles.noteNumber}>{note.n}</span>
      <div className={styles.noteBody}>
        <p className={styles.meta}>{note.noAI ? s.AutomaticChecksLabel : s.CopilotReviewLabel}{preparedNote}</p>
        {note.mark && <Passage note={note} className={styles.notePassage} styles={styles} />}
        <NoteLine note={note} strings={s} descriptions={props.descriptions} small={true} styles={styles} />
      </div>
    </li>;
  };
  const group = (key: string, heading: string, items: PageNote[], muted: boolean, empty?: string): React.ReactElement => {
    return <section key={key} className={styles.notesGroup} aria-label={heading}>
      <h2 className={mergeClasses(styles.groupHeading, muted && styles.groupHeadingMuted)}>{heading}</h2>
      {items.length
        ? <ol className={styles.noteList}>{items.map(note => noteItem(note))}</ol>
        : <p className={styles.meta} data-testid="block-nothing">{empty}</p>}
    </section>;
  };
  const blockHeading = (blockId: string): string => {
    const block = blocks.find(item => item.id === blockId);
    return block?.label || (block?.kind === 'webPart' ? s.OutlineWebPart : s.OutlineTextBlock);
  };
  // A chosen block without notes says so: a text block found nothing, a web part's content is not read.
  const blockGroup = (blockId: string, muted: boolean): React.ReactElement => {
    const block = blocks.find(item => item.id === blockId);
    let empty = s.BlockNothingFound;
    if (block?.kind === 'webPart') empty = s.BlockNothingWebPart;
    else if (block?.notChecked) empty = s.BlockNothingNotChecked;
    return group(blockId, blockHeading(blockId), withBlocks.filter(note => note.blockId === blockId), muted, empty);
  };

  // The checks that need no AI, always listed with their result, so a clean page shows them too: the accessibility
  // checker, the layout advisor and freshness. Each group leads with its result; its rules are listed when
  // they found something, or all of them on request.
  const news = first?.pageKind === 'news';
  const groups: Array<{ kind: CheckGroup; none: string }> = [
    { kind: 'a11y', none: s.ChecksA11yNone },
    { kind: 'layout', none: s.ChecksLayoutNone },
    { kind: 'freshness', none: s.ChecksFreshnessNone }
  ];
  // Each check says whether it could run: the canvas checks need the layout, the news check its own read, freshness a
  // valid save date. A check that could not run shows as not checked, so it does not read as a pass.
  const saved = first?.page?.modified ? Date.parse(first.page.modified) : Number.NaN;
  const available = (check: CheckDefinition): boolean => {
    if (check.id === 'newsFacts') return !!first?.page?.news;
    if (check.group === 'a11y') return !!structure;
    if (check.group === 'layout') return !!structure?.layout;
    return isFinite(saved) && saved <= props.now;
  };
  const ran = (group: CheckGroup): boolean => groupChecks(group, news).some(available);
  // Past the note limit, a canvas check without notes may have been cut off rather than clean. The news check has its own read.
  const capped = (check: CheckDefinition): boolean => {
    if (check.id === 'newsFacts') return false;
    if (check.group === 'a11y') return (structure?.issues.length || 0) >= maxNotesPerGroup;
    return check.group === 'layout' && (structure?.layout?.length || 0) >= maxNotesPerGroup;
  };
  const newsUnread = news && !first?.page?.news;
  const found = (count: number): string => format(count === 1 ? s.ChecksFoundOne : s.ChecksFound, count);
  // Each check's result leads its line: a tick and the rule in quiet text, a flag and a bold count, or a dash and why it did not run.
  const checkStatus = (check: CheckDefinition): { kind: 'pass' | 'notes' | 'none'; text: string } => {
    if (!available(check)) return { kind: 'none', text: s.ChecksNotChecked };
    const count = notes.filter(note => note.check === check.id).length;
    if (count) return { kind: 'notes', text: found(count) };
    if (capped(check)) return { kind: 'none', text: format(s.CheckNotCounted, maxNotesPerGroup) };
    return { kind: 'pass', text: s.CheckNoIssue };
  };
  // A group's own result. It shows a tick only when every one of its rules passed.
  const groupStatus = (
    kind: CheckGroup,
    none: string,
    own: PageNote[],
    rules: CheckDefinition[]
  ): { kind: 'pass' | 'notes' | 'none'; text: string } => {
    if (!on(kind)) return { kind: 'none', text: s.CheckOff };
    if (!ran(kind)) return { kind: 'none', text: s.ChecksNotChecked };
    if (own.length) return { kind: 'notes', text: found(own.length) };
    return { kind: rules.every(check => checkStatus(check).kind === 'pass') ? 'pass' : 'none', text: none };
  };
  const icon = (kind: 'pass' | 'notes' | 'none'): React.ReactElement => {
    if (kind === 'pass') return <Checkmark16Regular className={styles.checkIcon} aria-hidden="true" />;
    if (kind === 'notes') return <Flag16Regular className={mergeClasses(styles.checkIcon, styles.checkIconNotes)} aria-hidden="true" />;
    return <Subtract16Regular className={styles.checkIcon} aria-hidden="true" />;
  };
  const checkLine = (check: CheckDefinition): React.ReactElement => {
    const status = checkStatus(check);
    const lead = status.kind === 'pass'
      ? <span className={styles.srOnly}>{status.text}: </span>
      : <><span className={status.kind === 'notes' ? styles.checkCount : undefined}>{status.text}</span> · </>;
    return <li key={check.id} className={styles.checkLine} data-testid={'check-' + check.id}>
      {icon(status.kind)}
      <span>{lead}{checkRule(s, check)}</span>
    </li>;
  };
  // The notes themselves are listed once, beside the page preview.
  const checklist = <section className={styles.checks} aria-label={s.ChecksHeading} data-testid="checks">
    <div className={styles.fieldHead}>
      <h2 className={styles.groupHeading}>{s.ChecksHeading}</h2>
      <Button className={styles.small} appearance="secondary" size="small" aria-expanded={allRules}
        onClick={() => setAllRules(!allRules)}>
        {allRules ? s.ShowFewerRules : s.ShowAllRules}
      </Button>
    </div>
    <ul className={styles.checkList}>{groups.map(item => {
      const own = notes.filter(note => note.kind === item.kind);
      const off = !on(item.kind);
      const rules = off ? [] : groupChecks(item.kind, news);
      const status = groupStatus(item.kind, item.none, own, rules);
      const lines = rules.filter(check => allRules || checkStatus(check).kind !== 'pass');
      const showNewsUnread = !off && item.kind === 'layout' && newsUnread && ran('layout');
      return <li key={item.kind} className={styles.checkRow} data-testid={'checks-' + item.kind}>
        <p className={mergeClasses(styles.body, styles.groupLine)}>
          {icon(status.kind)}
          <span><strong>{checkGroupLabel(s, item.kind)}</strong> · <span data-testid="check-status">{status.text}</span></span>
        </p>
        {!off && !ran(item.kind) && <p className={mergeClasses(styles.meta, styles.indented)}>{s.ChecksNotCheckedHint}</p>}
        {lines.length > 0 && <ul className={styles.ruleLines}>{lines.map(checkLine)}</ul>}
        {showNewsUnread && <p className={mergeClasses(styles.meta, styles.indented)} data-testid="news-not-checked">
          {s.ChecksNewsNotChecked}
        </p>}
      </li>;
    })}</ul>
    <p className={styles.caption}>{s.ChecksScope}</p>
  </section>;

  const notesPart = notes.length > 0 && <div className={styles.notesSection}>{group('all', s.AllNotes, notes, false)}</div>;

  return <section className={styles.stack} aria-label={s.ReviewWorkspace} data-testid="result-page">
    <div className={styles.tight}>
      <h1 ref={props.headingRef} tabIndex={-1} className={mergeClasses(styles.pageTitle, full && styles.pageTitleFull)}>
        {first?.pageTitle}
      </h1>
      {meta}
    </div>
    {verdict}
    {partLine}
    {structure || !props.demo ? <>
      <PagePreview hideTitle sources={props.sources} strings={s} demo={props.demo} width={props.width} full={full}
        renderFinding={note => <ol className={styles.noteList}>{noteItem(note)}</ol>}
        blocks={blocks} notes={notes} selected={chosen} selectedNote={chosenNote?.n} onSelectNote={selectNote}
        onSelect={id => {
          setSelected(id);
          setSelectedNote(undefined);
        }}
        renderNotes={id => blockGroup(id, id !== chosen)} />
    </> : <>
      <p className={styles.sub}>{s.NoLayout}</p>
      {notesPart}
    </>}
    <details className={styles.details}><summary>{s.ChecksHeading}</summary>{checklist}</details>
    <div className={styles.footer}>
      <div className={styles.actions}>
        <Button className={styles.secondary} appearance="secondary" onClick={props.onNewCheck}>{s.NewCheck}</Button>
      </div>
    </div>
  </section>;
}
