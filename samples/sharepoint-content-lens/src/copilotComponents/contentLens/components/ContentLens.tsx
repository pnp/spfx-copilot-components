import { ComparisonView } from '../comparison/ComparisonView';
import { emptyComparison, type ComparisonState } from '../comparison/contracts';
import * as React from 'react';
import {
  Button, Tab, TabList, FluentProvider, IdPrefixProvider, mergeClasses, webDarkTheme, webLightTheme
} from '@fluentui/react-components';
import { ArrowExpand16Regular, ArrowMinimize16Regular } from '@fluentui/react-icons';
import type { ICopilotComponentHostContext, SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type { IContentLensProperties } from '../ContentLensCopilotComponentProperties';
import type {
  AnalysisResult, CategoryId, ReviewCoverage, ReviewFinding, ReviewSource, ScanRequest, SourceMode, SourceReviewDecision
} from '../domain/contracts';
import { isRuleId, ruleIds, standardCheckIds } from '../domain/contracts';
import { completeDecisions, isFindingValid, reviewSelectionLimit } from '../domain/policy';
import { checkGroups, type CheckGroup } from '../domain/checkCatalog';
import { nextRequestSources, pageParts } from '../services/analysis';
import { FixtureAnalysisClient, FixtureContentService, demoPages, demoRules, demoSites } from '../services/fixtures';
import type { IContentLensServices } from '../services/live';
import type { ISharePointLiveSnapshot } from '../services/sharePoint';
import type { PageChoice, SiteChoice } from '../services/discovery';
import { ReviewError } from '../roundTrip/reviewClient';
import { mergeReviewResults, type ReviewSession } from '../services/reviewSession';
import { ContentLensIcon } from './ContentLensIcon';
import { CommentsResult } from './CommentsResult';
import { PageResult } from './PageResult';
import { StartView } from './StartView';
import { StateView } from './StateView';
import { useContentLensStyles } from './ContentLens.styles';
import { useInlineHostSize } from './useInlineHostSize';
import { checkDescriptions, checkLabels, format, parseRules, sourceKey, toggle } from './viewUtils';

export interface IContentLensProps {
  initial: IContentLensProperties;
  suggestedSiteUrl: string;
  hostContext: ICopilotComponentHostContext;
  targetDocument: Document;
  strings: IContentLensStrings;
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /** Ask the host to fit an inline card to its content; the host may decline. */
  onRequestSizeChange?: (width: number, height: number) => Promise<boolean>;
  onOpenLink: (url: string) => Promise<void>;
  services?: IContentLensServices;
  /** A review of this card that was kept for the tab; a card the host opens again starts from it. */
  restored?: ReviewSession;
}

type View = 'entry' | 'main';

// An example page brings its site, as a page found by its link does, so choosing the page is enough to start.
const demoSitePages: ReadonlyArray<PageChoice & { site: SiteChoice }> = demoPages.map(page => ({
  ...page,
  sourceUrl: demoSites[0].url + '/SitePages/' + page.pageItemId + '.aspx',
  site: { url: demoSites[0].url, title: demoSites[0].title }
}));
const demoRulesText = demoRules.join('\n');

/** The page a restored review was about, rebuilt from that review's own sources. */
function restoredPage(review: ReviewSession | undefined, sources: ReviewSource[]): PageChoice | undefined {
  const pageItemId = review?.request.pageItemId;
  const source = sources.find(item =>
    (pageItemId === undefined || item.pageItemId === pageItemId) && item.kind === 'page' && !!item.sourceUrl);
  if (!source) return undefined;
  return { pageItemId: source.pageItemId, title: source.pageTitle, pageKind: source.pageKind, sourceUrl: source.sourceUrl! };
}

/** The lookback the launcher asked for, in days; 7 when it asked for none. */
function launcherLookback(value: string | undefined): 7 | 14 | 30 {
  if (value === '14') return 14;
  if (value === '30') return 30;
  return 7;
}

/** Two page URLs name the same file, compared decoded and without case. */
function sameFileUrl(a: string, b: string): boolean {
  try {
    return decodeURI(a).toLowerCase() === decodeURI(b).toLowerCase();
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

/** A site URL without trailing slashes and in lower case, for comparison. */
function comparableSiteUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase();
}

/** Whether the result holds a reviewed decision for this source. */
function isReviewedIn(result: AnalysisResult | undefined, source: ReviewSource): boolean {
  return !!result?.decisions.some(decision =>
    decision.sourceId === source.id && decision.chunkId === source.chunkId && decision.status === 'reviewed');
}

/** The element's width in whole pixels, kept up to date while it resizes. */
function useWidth(ref: React.RefObject<HTMLElement>): number {
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const element = ref.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view?.ResizeObserver) return undefined;
    const update = (): void => setWidth(Math.floor(element.getBoundingClientRect().width));
    update();
    const observer = new view.ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export default function ContentLens(props: IContentLensProps): React.ReactElement {
  const { strings: s, restored } = props;
  const styles = useContentLensStyles();
  const restoredSources = restored?.sources || [];
  const [view, setView] = React.useState<View>(restored ? 'main' : 'entry');
  const [demo, setDemo] = React.useState(false);
  const [comparison, setComparison] = React.useState<ComparisonState | undefined>(() => props.services?.comparisonCache?.get());
  const [comparisonStorageWarning, setComparisonStorageWarning] = React.useState(false);
  const [comparisonInlineFull, setComparisonInlineFull] = React.useState(false);
  function keepComparison(value: ComparisonState): void {
    setComparison(value);
    if (demo) return;
    const saved = props.services?.comparisonCache?.save(value);
    setComparisonStorageWarning(!saved && !!(value.evidence || value.busy));
  }

  // A new card opens on the Page tab, also when the launcher suggests comments: the reviewer chooses the tab.
  // A restored card opens on the tab of its review.
  const restoredMode: SourceMode = restoredSources[0]?.kind === 'page' ? 'page' : 'comments';
  const [mode, setMode] = React.useState<SourceMode>(restored ? restoredMode : 'page');
  // Comments look at one site; a page brings its own site.
  const [chosenSite, setChosenSite] = React.useState<SiteChoice | undefined>(
    restoredSources[0] ? { url: restoredSources[0].siteUrl, title: restored?.siteTitle || s.Title } : undefined
  );
  const [chosenPage, setChosenPage] = React.useState<PageChoice | undefined>(
    () => restoredSources[0]?.kind === 'page' ? restoredPage(restored, restoredSources) : undefined
  );
  // A restored comments review that was limited to one page keeps that page.
  const [limitPage, setLimitPage] = React.useState<PageChoice | undefined>(() => {
    const limitedToPage = restoredSources[0]?.kind !== 'page' && restored?.request.pageItemId !== undefined;
    if (!limitedToPage) return undefined;
    // restoredPage looks at page sources only, so the comment sources are passed as pages.
    return restoredPage(restored, restoredSources.map(source => ({ ...source, kind: 'page' as const })));
  });
  const [lookback, setLookback] = React.useState<7 | 14 | 30>(
    restored?.request.lookbackDays || launcherLookback(props.initial.lookbackDays)
  );
  const [pageKind, setPageKind] = React.useState<ScanRequest['pageKind']>(restored?.request.pageKind || 'both');
  // Which checks are on: a restored review's own, else what the launcher asked for, else what this browser remembers.
  const rememberedChecks = (): CategoryId[] => props.services?.rules?.loadHarmful?.() === false ? [] : [...standardCheckIds];
  const [categories, setCategories] = React.useState<CategoryId[]>(
    restored?.categories.filter(id => !isRuleId(id)) || props.initial.categoryIds || rememberedChecks()
  );
  // A restored review uses its own rules instead of the rules saved in this browser.
  const [rulesText, setRulesText] = React.useState(() => restored ? restored.rules.join('\n') : props.services?.rules?.load() || '');
  // The checks without AI that are on; a restored review keeps its own.
  const [groups, setGroups] = React.useState<readonly CheckGroup[]>(
    () => restored ? restored.groups || checkGroups : props.services?.rules?.loadGroups?.() || checkGroups
  );
  // A restored card shows its request's review; once the reviewer starts a new check from it, it behaves like a new card.
  const [restoring, setRestoring] = React.useState(!!restored);
  // The checks and rules that produced the shown result, so the result keeps its labels when the rules change later.
  const [shown, setShown] = React.useState<{ categories: CategoryId[]; rules: string[]; groups: readonly CheckGroup[] }>(() => ({
    categories: restored?.categories || [],
    rules: restored?.rules || [],
    groups: restored?.groups || checkGroups
  }));
  const [sources, setSources] = React.useState<ReviewSource[]>(restoredSources);
  const [pages, setPages] = React.useState<Record<string, number>>({});
  const [coverage, setCoverage] = React.useState<ReviewCoverage | undefined>(
    restored ? props.services?.content.snapshot().coverage : undefined
  );
  const [liveSnapshot, setLiveSnapshot] = React.useState<ISharePointLiveSnapshot | undefined>(
    restored ? props.services?.content.snapshot() : undefined
  );
  const [sharedCooldownUntil, setSharedCooldownUntil] = React.useState(0);
  const [now, setNow] = React.useState(Date.now());
  const [analysis, setAnalysis] = React.useState<AnalysisResult | undefined>(restored?.analysis);
  const [findings, setFindings] = React.useState<ReviewFinding[]>(restored?.analysis?.findings || []);
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState<'loading' | 'analysis'>();
  const [pageProgress, setPageProgress] = React.useState<{ value: number; max: number }>();
  const [status, setStatus] = React.useState('');
  const [failure, setFailure] = React.useState('');
  const [analysisIssue, setAnalysisIssue] = React.useState<{ message: string; details: string }>();
  const generation = React.useRef(0);
  const analysisGeneration = React.useRef(0);
  const readActive = React.useRef(false);
  const readScope = React.useRef<{ generation: number; siteUrl: string; ignoredRunId?: string }>();
  const readAbort = React.useRef<AbortController>();
  const analysisAbort = React.useRef<AbortController>();
  const heading = React.useRef<HTMLHeadingElement>(null);
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  // Set by an action inside this card. Focus moves to the heading only after such an action,
  // so opening the card keeps focus where it is.
  const acted = React.useRef(false);
  const cardWidth = useWidth(canvasRoot);
  const labels = checkLabels(s);
  const parsedRules = parseRules(rulesText);
  // Writing rules apply to a page only; rule N joins the checks while the Nth rule has text.
  const activeRules = mode !== 'page' ? [] : parsedRules.rules;
  const activeChecks: CategoryId[] = mode === 'comments'
    ? [...standardCheckIds]
    : [...categories, ...ruleIds.slice(0, activeRules.length)];
  const rulesValid = mode !== 'page' || !parsedRules.tooLong;
  // Once a review has run, its own rules are described; before that, the current rules.
  const resultShown = shown.rules.length > 0 || shown.categories.length > 0;
  const descriptions = checkDescriptions(s, resultShown ? shown.rules : activeRules);
  const reviewClient = props.services?.analysis;
  const serviceAvailable = demo || !!props.services;
  const siteUrl = chosenSite?.url || '';
  const siteTitle = chosenSite?.title || '';
  const decisionFor = (source: ReviewSource): SourceReviewDecision | undefined =>
    analysis?.decisions.find(decision => decision.sourceId === source.id && decision.chunkId === source.chunkId);
  const pendingSources = sources.filter(source => !decisionFor(source));
  /**
   * The sources for the next request: on the Page tab the next part; for live comments what fits in one request;
   * in the demo every candidate up to the selection limit.
   */
  const reviewSelection = (candidates: ReviewSource[]): ReviewSource[] => {
    if (mode === 'page') return candidates.slice(0, 1);
    const bounded = candidates.slice(0, reviewSelectionLimit);
    return demo ? bounded : nextRequestSources(bounded, activeChecks);
  };
  // On the Page tab: the first part, in part order, that is not reviewed yet.
  const partIndex = (source: ReviewSource): number => source.part?.index || 1;
  const nextPart = mode === 'page'
    ? sources.slice().sort((a, b) => partIndex(a) - partIndex(b)).find(source => decisionFor(source)?.status !== 'reviewed')
    : undefined;
  const selection = mode === 'page' ? (nextPart ? [nextPart] : []) : reviewSelection(pendingSources);
  const resultChecks = shown.categories.length ? shown.categories : activeChecks;
  const findingGroups = sources
    .map(source => ({
      source,
      findings: findings.filter(finding =>
        finding.sourceId === source.id && finding.chunkId === source.chunkId && isFindingValid(finding, sources, resultChecks))
    }))
    .filter(group => group.findings.length > 0);
  const flaggedKeys = new Set(findingGroups.map(group => sourceKey(group.source)));
  const cleanSources = sources.filter(source =>
    decisionFor(source)?.status === 'reviewed' && !flaggedKeys.has(sourceKey(source)));
  const unreviewedSources = sources.filter(source =>
    decisionFor(source)?.status === 'notReviewed' && !flaggedKeys.has(sourceKey(source)));
  const validChecks = activeChecks.length > 0 && rulesValid;
  // A page can also be read with only the checks without AI on.
  const canRead = validChecks || (mode === 'page' && activeChecks.length === 0 && rulesValid && groups.length > 0);
  const fullscreen = props.hostContext.displayMode === 'fullscreen';
  const full = fullscreen || cardWidth >= 900;
  const displayModes = props.hostContext.availableDisplayModes;
  const canExpand = displayModes !== undefined && displayModes.indexOf('fullscreen') >= 0 && !fullscreen;
  const displayExpanded = fullscreen || (!!comparison?.open && comparisonInlineFull);
  const clockNow = Math.max(now, Date.now());
  const currentServiceSnapshot = demo ? undefined : props.services?.content.snapshot();
  const cooldownUntil = demo
    ? 0
    : Math.max(sharedCooldownUntil, liveSnapshot?.cooldownUntil || 0, currentServiceSnapshot?.cooldownUntil || 0);
  // A scan can continue while the service still holds the run that the shown snapshot belongs to.
  const canContinueScan = !!liveSnapshot && !!currentServiceSnapshot?.canContinue &&
    (!liveSnapshot.checkpoint || currentServiceSnapshot.checkpoint?.runId === liveSnapshot.checkpoint.runId);
  const dark = props.hostContext.theme === 'dark';
  const canvasColor = dark ? '#1f1f1f' : '#ffffff';
  const palette = {
    '--cl-canvas': canvasColor,
    '--cl-mark': dark ? '#4a3f14' : '#fff3c4',
    '--cl-wp': dark ? '#2b2b2b' : '#f5f5f5',
    '--cl-warn-fg': dark ? '#e6c35c' : '#835b00',
    '--cl-demo-fg': dark ? '#cbadeb' : '#5c2e91'
  } as React.CSSProperties;

  // Space the host adds below the content must match the theme instead of showing the page's white.
  React.useLayoutEffect(() => {
    const surfaces = [props.targetDocument.documentElement, props.targetDocument.body].filter(Boolean);
    const previous = surfaces.map(surface => surface.style.backgroundColor);
    surfaces.forEach(surface => {
      surface.style.backgroundColor = canvasColor;
    });
    return () => surfaces.forEach((surface, index) => {
      surface.style.backgroundColor = previous[index];
    });
  }, [props.targetDocument, canvasColor]);
  useInlineHostSize(canvasRoot, props.targetDocument, fullscreen ? undefined : props.onRequestSizeChange);

  // On unmount, every running read and review ends.
  React.useEffect(() => () => {
    generation.current++;
    analysisGeneration.current++;
    readAbort.current?.abort();
    analysisAbort.current?.abort();
    readActive.current = false;
  }, []);
  React.useEffect(() => {
    if (demo || !props.services) return undefined;
    const service = props.services.content;
    return service.subscribe(() => {
      const snapshot = service.snapshot();
      // A throttled response sets a cooldown for the whole component, also when it arrives after the scope changed.
      setSharedCooldownUntil(current => Math.max(current, snapshot.cooldownUntil || 0));
      const activeScope = readScope.current;
      if (!readActive.current || !activeScope || activeScope.generation !== generation.current) return;
      // read() stops the previous session before it starts the new one. The snapshot of that stopped run
      // (ignoredRunId) and snapshots for another site are skipped.
      if (snapshot.checkpoint && (snapshot.checkpoint.runId === activeScope.ignoredRunId ||
          comparableSiteUrl(snapshot.checkpoint.siteUrl) !== comparableSiteUrl(activeScope.siteUrl))) {
        return;
      }
      setLiveSnapshot(snapshot);
      setCoverage(snapshot.coverage);
      if (mode === 'comments') setSources(snapshot.sources);
    });
  }, [demo, props.services, mode]);
  React.useEffect(() => {
    const deadline = cooldownUntil;
    if (!deadline || deadline <= Date.now()) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);
  React.useEffect(() => {
    if (acted.current && view === 'main') heading.current?.focus();
  }, [view, busy]);

  /** Status messages for screen readers; errors also show on screen. */
  function announce(message: string, isError: boolean = false): void {
    setStatus(message);
    if (isError) setFailure(message);
  }
  function analysisFailureMessage(reason: unknown): string {
    if (!(reason instanceof Error)) return s.AnalysisHostUnavailable;
    return reason.message.indexOf('REVIEW_') === 0 ? s.AnalysisHostUnavailable : reason.message;
  }
  function readFailureCode(snapshot: ISharePointLiveSnapshot | undefined): string | undefined {
    if (!snapshot || (!snapshot.failures.length && snapshot.state !== 'failed')) return undefined;
    const first = snapshot.failures[0];
    return first?.code || (first?.status ? 'HTTP ' + first.status : 'SHAREPOINT_READ_FAILED');
  }
  function clearAnalysis(): void {
    analysisGeneration.current++;
    analysisAbort.current?.abort();
    setAnalysisIssue(undefined);
    setPages({});
    setCoverage(current => current ? { ...current, analyzed: 0 } : current);
    setAnalysis(undefined);
    setFindings([]);
    setExpanded([]);
    setFailure('');
    setBusy(current => current === 'analysis' ? undefined : current);
    setStatus('');
  }
  function clearSources(): void {
    generation.current++;
    readActive.current = false;
    readAbort.current?.abort();
    props.services?.content.stop();
    props.services?.reviewCache?.clear();
    clearAnalysis();
    setSources([]);
    setCoverage(undefined);
    setLiveSnapshot(undefined);
    setBusy(undefined);
  }
  function setDemoMode(enabled: boolean): void {
    const comparisonOpen = !!comparison?.open;
    props.services?.comparisonCache?.clear();
    setComparison(comparisonOpen ? emptyComparison() : undefined);
    setComparisonStorageWarning(false);
    clearSources();
    setView('entry');
    setDemo(enabled);
    setChosenSite(undefined);
    setChosenPage(undefined);
    setLimitPage(undefined);
    // The example page has prepared answers for its own two rules; leaving it brings back the remembered rules.
    setRulesText(enabled ? demoRulesText : props.services?.rules?.load() || '');
    // Toggle changes in the example stay in the example; leaving it brings back the remembered toggles.
    if (!enabled) {
      setGroups(props.services?.rules?.loadGroups?.() || checkGroups);
      setCategories(rememberedChecks());
    }
  }

  async function loadSources(days: 7 | 14 | 30 = lookback): Promise<void> {
    if (!serviceAvailable || !siteUrl || !canRead) {
      announce(s.SelectChecksHint);
      return;
    }
    acted.current = true;
    const page = chosenPage;
    clearSources();
    const run = generation.current;
    setBusy('loading');
    readActive.current = !demo;
    readAbort.current = new AbortController();
    readScope.current = {
      generation: run,
      siteUrl: siteUrl.trim(),
      ignoredRunId: props.services?.content.snapshot().checkpoint?.runId
    };
    setView('main');
    try {
      const request: ScanRequest = {
        siteUrl,
        mode,
        lookbackDays: days,
        pageKind: mode === 'page' ? 'both' : pageKind,
        pageItemId: mode === 'page' ? page?.pageItemId : limitPage?.pageItemId
      };
      const result = demo
        ? await new FixtureContentService().read(request)
        : await props.services!.content.read(request, readAbort.current.signal);
      if (run !== generation.current) return;
      let loaded = result.sources;
      if (mode === 'page' && loaded.length) {
        // Item ids are unique only within a list, so the page that was read must be the file that was chosen.
        if (page && loaded[0].sourceUrl && !sameFileUrl(page.sourceUrl, loaded[0].sourceUrl)) throw new Error('PAGE_SELECTION_MISMATCH');
        loaded = pageParts(loaded[0], demo ? [] : activeChecks, demo ? [] : activeRules);
      }
      setSources(loaded);
      setCoverage(result.coverage);
      if (!demo) setLiveSnapshot(props.services!.content.snapshot());
      readActive.current = false;
      if (!readAbort.current.signal.aborted && loaded.length &&
        !(!demo && readFailureCode(props.services!.content.snapshot()))) {
        await runBatch(reviewSelection(loaded), loaded, undefined, days);
      }
    } catch (readError) {
      if (run === generation.current) {
        announce(s.ReadFailed);
        setFailure(readError instanceof Error ? readError.message : s.OperationFailed);
      }
    } finally {
      if (run === generation.current) {
        setBusy(current => current === 'loading' ? undefined : current);
        readActive.current = false;
      }
    }
  }

  async function continueRead(): Promise<void> {
    if (!props.services || demo || busy || !canContinueScan ||
      !props.services.content.snapshot().canContinue || cooldownUntil > Date.now()) {
      return;
    }
    acted.current = true;
    const run = generation.current;
    setBusy('loading');
    readActive.current = true;
    readAbort.current = new AbortController();
    readScope.current = { generation: run, siteUrl: siteUrl.trim() };
    try {
      const result = await props.services.content.continueRead(readAbort.current.signal);
      if (run !== generation.current) return;
      setSources(result.sources);
      setCoverage(result.coverage);
      setLiveSnapshot(props.services.content.snapshot());
      readActive.current = false;
      const batch = reviewSelection(result.sources.filter(source => !decisionFor(source)));
      if (!readAbort.current.signal.aborted && batch.length) await runBatch(batch, result.sources, analysis);
    } catch (readError) {
      if (run === generation.current) {
        announce(s.ReadFailed);
        setFailure(readError instanceof Error ? readError.message : s.OperationFailed);
      }
    } finally {
      if (run === generation.current) {
        setBusy(current => current === 'loading' ? undefined : current);
        readActive.current = false;
      }
    }
  }

  function stopRead(): void {
    readAbort.current?.abort();
    props.services?.content.stop();
    generation.current++;
    readActive.current = false;
    setBusy(undefined);
    setView('entry');
  }

  /**
   * Reviews the next selection. On the Page tab the review then continues through the remaining parts;
   * on the Comments tab it covers one bounded selection.
   */
  async function reviewMore(): Promise<void> {
    if (!serviceAvailable || !validChecks || busy || !selection.length) return;
    acted.current = true;
    await runBatch(selection, sources, analysis);
  }

  async function retryNotReviewed(): Promise<void> {
    if (!serviceAvailable || !validChecks || busy) return;
    acted.current = true;
    const unreviewed = sources.filter(source => decisionFor(source)?.status === 'notReviewed');
    if (unreviewed.length) await runBatch(reviewSelection(unreviewed), sources, analysis);
  }

  async function runBatch(
    batch: ReviewSource[],
    all: ReviewSource[],
    previous: AnalysisResult | undefined,
    days: 7 | 14 | 30 = lookback
  ): Promise<void> {
    // A continuation keeps the checks of the result it continues; a new review takes the current ones.
    const checks = previous && shown.categories.length ? shown : { categories: activeChecks, rules: activeRules, groups };
    const session: ReviewSession = {
      version: 3,
      request: {
        siteUrl,
        mode,
        lookbackDays: days,
        pageKind: mode === 'page' ? 'both' : pageKind,
        pageItemId: mode === 'page' ? chosenPage?.pageItemId : limitPage?.pageItemId
      },
      siteTitle: siteTitle || s.Title,
      ...(mode === 'page' && checks.categories.length ? { autoContinuePage: true as const } : {}),
      sources: all,
      categories: checks.categories,
      rules: checks.rules,
      groups: [...checks.groups],
      analysis: previous ? { ...previous, findings } : undefined
    };
    // The whole review, every page part included, is kept before the request leaves, so a card the host opens again can show it.
    if (!demo) props.services?.reviewCache?.save(session);
    setShown(checks);
    // A page review with only the checks without AI ends here: its session is saved, and no AI request is sent.
    if (!checks.categories.length) return;
    await performAnalysis(
      signal => demo
        ? new FixtureAnalysisClient().analyze(batch, checks.categories, checks.rules)
        : reviewClient!.analyze(batch, checks.categories, checks.rules, signal),
      batch,
      checks.categories,
      previous,
      session
    );
  }

  async function performAnalysis(
    runAnalysis: (signal: AbortSignal) => Promise<AnalysisResult>,
    submitted: ReviewSource[],
    selectedChecks: CategoryId[],
    previous: AnalysisResult | undefined,
    session: ReviewSession | undefined
  ): Promise<void> {
    analysisGeneration.current++;
    analysisAbort.current?.abort();
    setFailure('');
    setStatus('');
    setAnalysisIssue(undefined);
    const run = analysisGeneration.current;
    const scope = generation.current;
    const issueDetails = (code: string, requestId?: string): string => [
      session?.request.mode === 'page' ? format(s.AnalysisFailedPart, submitted[0]?.part?.index || 1, session.sources.length) : '',
      code,
      requestId ? format(s.AnalysisRequestId, requestId) : ''
    ].filter(Boolean).join(' · ');
    setBusy('analysis');
    setView('main');
    analysisAbort.current = new AbortController();
    setPageProgress(session?.request.mode === 'page' ? {
      value: session.sources.filter(source => isReviewedIn(previous, source)).length,
      max: session.sources.length
    } : undefined);
    try {
      const result = await runAnalysis(analysisAbort.current.signal);
      if (run !== analysisGeneration.current || scope !== generation.current) return;
      // A finding counts only when its quote is in the text of a submitted source and its check was selected.
      const accepted = result.findings.filter(finding => isFindingValid(finding, submitted, selectedChecks));
      // A source that returned an invalid finding is marked as not reviewed.
      const invalidKeys = result.findings
        .filter(finding => !isFindingValid(finding, submitted, selectedChecks))
        .map(finding => JSON.stringify([finding.sourceId, finding.chunkId]));
      const decisions = completeDecisions(submitted, result.decisions).map(decision => {
        const hasInvalidFinding = invalidKeys.indexOf(JSON.stringify([decision.sourceId, decision.chunkId])) >= 0;
        return hasInvalidFinding ? { ...decision, status: 'notReviewed' as const } : decision;
      });
      const validated: AnalysisResult = { ...result, findings: accepted, decisions };
      const merged = mergeReviewResults(previous ? { ...previous, findings: previous.findings } : undefined, validated);
      setAnalysis(merged);
      setFindings(merged.findings);
      setCoverage(current => current
        ? { ...current, analyzed: merged.decisions.filter(decision => decision.status === 'reviewed').length }
        : current);
      if (!demo && decisions.every(decision => decision.status === 'notReviewed')) {
        setFailure(s.AnalysisAnswerIncomplete);
        setAnalysisIssue({
          message: s.AnalysisAnswerIncomplete,
          details: issueDetails('REVIEW_ANSWER_NOT_REVIEWED', result.requestId)
        });
      }
      const reviewedCount = decisions.filter(decision => decision.status === 'reviewed').length;
      announce(format(s.AnalysisComplete, reviewedCount, accepted.length));
      // A shown result is kept for the tab, so a card the host opens again can show it without asking Copilot.
      if (!demo && session) props.services?.reviewCache?.save({ ...session, analysis: merged });
      // The next part starts only after every submitted source was reviewed. After a failure, the reviewer starts the retry.
      if (session?.autoContinuePage && decisions.length > 0 && decisions.every(decision => decision.status === 'reviewed')) {
        const next = session.sources.find(source => !isReviewedIn(merged, source));
        if (next && run === analysisGeneration.current && scope === generation.current && !analysisAbort.current.signal.aborted) {
          const continued: ReviewSession = { ...session, analysis: merged };
          await performAnalysis(
            signal => demo
              ? new FixtureAnalysisClient().analyze([next], session.categories, session.rules)
              : reviewClient!.analyze([next], session.categories, session.rules, signal),
            [next],
            session.categories,
            merged,
            continued
          );
        }
      }
    } catch (analysisError) {
      if (run === analysisGeneration.current && scope === generation.current) {
        const code = analysisError instanceof Error && /^REVIEW_[A-Z_]+$/.test(analysisError.message)
          ? analysisError.message
          : 'REVIEW_FAILED';
        const message = code === 'REVIEW_API_ACCESS' ? s.AnalysisApiAccess
          : code === 'REVIEW_API_THROTTLED' ? s.AnalysisApiThrottled
          : code === 'REVIEW_API_RESPONSE' ? s.AnalysisApiResponse
          : code === 'REVIEW_TIMEOUT' ? s.AnalysisApiTimeout
          : analysisFailureMessage(analysisError);
        const requestId = analysisError instanceof ReviewError ? analysisError.requestId : undefined;
        setAnalysisIssue({ message, details: issueDetails(code, requestId) });
        announce(format(s.AnalysisFailed, message), true);
      }
    } finally {
      if (run === analysisGeneration.current && scope === generation.current) setBusy(undefined);
    }
  }

  function cancelAnalysis(): void {
    analysisGeneration.current++;
    analysisAbort.current?.abort();
    setBusy(undefined);
    announce(mode === 'page' ? s.PageReviewCancelled : format(s.AnalysisCancelled, pendingSources.length));
  }

  function toggleHarmful(): void {
    clearAnalysis();
    setCategories(categories.length ? [] : [...standardCheckIds]);
    if (!demo) props.services?.rules?.saveHarmful?.(!categories.length);
  }
  function changeRules(value: string): void {
    clearAnalysis();
    setRulesText(value);
    if (!demo) props.services?.rules?.save(value);
  }
  function toggleGroup(group: CheckGroup): void {
    clearAnalysis();
    // Flips this group and keeps the catalog order.
    const next = checkGroups.filter(item => item === group ? groups.indexOf(item) < 0 : groups.indexOf(item) >= 0);
    setGroups(next);
    if (!demo) props.services?.rules?.saveGroups?.(next);
  }
  function changeSite(site: SiteChoice | undefined): void {
    clearSources();
    setChosenSite(site);
    setChosenPage(undefined);
    setLimitPage(undefined);
  }
  /** A pasted link can name a page on another site; the site follows the page. */
  function changePage(page: (PageChoice & { site?: SiteChoice }) | undefined): void {
    clearSources();
    if (page?.site && page.site.url.toLowerCase() !== chosenSite?.url.toLowerCase()) setChosenSite(page.site);
    setChosenPage(page
      ? { pageItemId: page.pageItemId, title: page.title, pageKind: page.pageKind, sourceUrl: page.sourceUrl }
      : undefined);
  }
  function changeMode(next: SourceMode): void {
    if (next === mode) return;
    clearSources();
    setMode(next);
    setView('entry');
  }
  function changeLookback(days: 7 | 14 | 30): void {
    if (lookback !== days) {
      clearSources();
      setLookback(days);
    }
  }
  function changePageKind(kind: ScanRequest['pageKind']): void {
    if (pageKind !== kind) {
      clearSources();
      setPageKind(kind);
      setLimitPage(undefined);
    }
  }
  /** Handlers the views call. A failed call shows an error status. */
  const report = (): void => announce(s.OperationFailed, true);
  const toggleDisplay = (): void => {
    if (displayExpanded) {
      setComparisonInlineFull(false);
      if (fullscreen) props.onRequestDisplayMode('inline').catch(report);
    } else if (canExpand) {
      props.onRequestDisplayMode('fullscreen').catch(report);
    } else if (comparison?.open) {
      setComparisonInlineFull(true);
    }
  };

  const openLink = (url: string): void => {
    props.onOpenLink(url).catch(report);
  };
  const start = (): void => {
    loadSources().catch(report);
  };
  /** Back to the start; the chosen page or site, the rules and the earlier result stay. */
  const newCheck = (): void => {
    acted.current = true;
    if (comparison) keepComparison({ ...comparison, open: false });
    if (restoring) setRestoring(false);
    setView('entry');
  };

  const theme = dark ? webDarkTheme : webLightTheme;
  const coolingDown = cooldownUntil > clockNow;
  const waitSeconds = Math.max(0, Math.ceil((cooldownUntil - clockNow) / 1000));
  const readCode = demo ? undefined : readFailureCode(liveSnapshot);
  const firstPart = sources.find(source => !!source.page) || sources[0];
  // The version and date line of the page under review.
  const reviewedPage = mode === 'page' ? firstPart?.page : undefined;
  const reviewedPageDate = reviewedPage?.modified
    ? new Date(reviewedPage.modified).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const pageMeta = reviewedPage
    ? format(reviewedPage.state === 'published' ? s.PageVersionPublished : s.PageVersionDraft, reviewedPage.version, reviewedPageDate)
    : '';
  const stateTitle = mode === 'page' ? chosenPage?.title || firstPart?.pageTitle : siteTitle;
  const scopeKindLabel = pageKind === 'both' ? s.ScopeBoth : pageKind === 'news' ? s.ScopeNews : s.ScopePages;
  const commentsScope = format(s.CommentsScope, lookback, scopeKindLabel) + (limitPage ? ' · ' + limitPage.title : '');
  const reviewed = analysis?.decisions.filter(decision => decision.status === 'reviewed').length || 0;
  const notReviewedKeys = new Set(sources.filter(source => decisionFor(source)?.status === 'notReviewed').map(sourceKey));

  let body: React.ReactNode;
  if (comparison?.open) {
    body = <ComparisonView key={demo ? 'demo' : 'live'} value={comparison} onChange={keepComparison} services={props.services?.comparison}
      strings={s} document={props.targetDocument} locale={props.targetDocument.documentElement.lang || navigator.language || 'en'}
      demo={demo} full={full || comparisonInlineFull} width={cardWidth} storageWarning={comparisonStorageWarning} onDemo={setDemoMode}
      onExpand={() => {
        if (canExpand) props.onRequestDisplayMode('fullscreen').catch(report);
        else setComparisonInlineFull(true);
      }}
      onOpenLink={openLink} />;
  } else if (view === 'entry') {
    body = <StartView strings={s} demo={demo} discovery={props.services?.discovery} demoPages={demoSitePages}
      demoSites={demoSites.filter(site => site.available)}
      mode={mode} page={chosenPage} guidelines={rulesText} groups={groups} onToggleGroup={toggleGroup}
      rulesDemoNotice={demo && rulesText.trim() !== demoRulesText} site={chosenSite} initialSiteQuery={props.initial.siteUrl}
      lookback={lookback} pageKind={pageKind} limitPage={limitPage} harmful={categories.length > 0} busy={!!busy} coolingDown={coolingDown}
      unavailable={!serviceAvailable} canStart={serviceAvailable && canRead && (mode === 'page' ? !!chosenPage : !!chosenSite)}
      hasResults={!!coverage || sources.length > 0} onPageChange={changePage} onGuidelinesChange={changeRules}
      onSiteChange={changeSite} onLookbackChange={changeLookback} onPageKindChange={changePageKind}
      onLimitPageChange={page => {
        clearSources();
        if (page?.site && page.site.url.toLowerCase() !== chosenSite?.url.toLowerCase()) {
          setChosenSite(page.site);
          setChosenPage(undefined);
        }
        setLimitPage(page);
      }}
      onToggleHarmful={toggleHarmful} onStart={start} onDemo={setDemoMode}
      onDemoScenario={(pageItemId, days) => {
        clearSources();
        setChosenSite(demoSites[0]);
        const page = demoSitePages.find(choice => choice.pageItemId === pageItemId)!;
        if (mode === 'page') {
          setChosenPage(page);
        } else {
          setLimitPage(page);
          setLookback(days);
          setPageKind(page.pageKind);
        }
        setRulesText(demoRulesText);
        setGroups(checkGroups);
        setCategories([...standardCheckIds]);
      }}
      onReturnToResults={() => setView('main')} />;
  } else if (busy === 'loading') {
    body = <StateView title={stateTitle} headingRef={heading} meta={mode === 'comments' ? commentsScope : undefined} tone="busy"
      sentence={mode === 'page' ? s.Loading : s.LoadingComments}
      action={{ label: s.StopScan, kind: 'secondary', onClick: stopRead }} />;
  } else if (busy === 'analysis') {
    const runningSentence = mode === 'page' ? s.PageReviewRunning : demo ? s.AnalysisRunning : s.AnalysisLiveRunningComments;
    const runningHint = mode === 'page' ? s.PageReviewRunningHint : demo ? undefined : s.AnalysisRunningHint;
    const progress = mode === 'page' && pageProgress
      ? { ...pageProgress, label: format(s.PageReviewProgress, pageProgress.value, pageProgress.max) }
      : undefined;
    body = <StateView title={stateTitle} headingRef={heading} meta={mode === 'page' ? pageMeta : commentsScope} tone="busy"
      sentence={runningSentence} progress={progress} hint={runningHint}
      action={{ label: s.CancelAnalysis, kind: 'secondary', onClick: cancelAnalysis }} />;
  } else if (readCode === 'PAGE_CHECKED_OUT') {
    body = <StateView title={stateTitle} headingRef={heading} sentence={s.PageCheckedOut} tone="warning" hint={s.PageCheckedOutHint}
      action={{ label: s.CheckAgain, onClick: start }} />;
  } else if (coolingDown && !sources.length) {
    body = <StateView title={stateTitle} headingRef={heading} sentence={s.ThrottleWait} tone="warning"
      hint={format(s.ThrottleHint, waitSeconds)}
      action={{
        label: waitSeconds > 0 ? format(s.ContinueIn, waitSeconds) : s.Continue,
        disabled: waitSeconds > 0,
        onClick: () => {
          (canContinueScan ? continueRead() : loadSources()).catch(report);
        }
      }} />;
  } else if (!sources.length && (readCode || failure)) {
    body = <StateView title={stateTitle} headingRef={heading} sentence={s.ReadFailed} tone="warning" hint={s.ReadFailedHint}
      code={readCode || failure} action={{ label: s.CheckAgain, onClick: start }} />;
  } else if (!sources.length && mode === 'comments') {
    // Below 30 days the way forward is a longer lookback; at 30 days it is another source.
    const noCommentsAction = lookback < 30
      ? {
        label: s.LookAt30Days,
        onClick: () => {
          setLookback(30);
          loadSources(30).catch(report);
        }
      }
      : { label: s.ChangeSource, onClick: () => setView('entry') };
    body = <StateView title={siteTitle} headingRef={heading} meta={commentsScope} sentence={format(s.NoCommentsTitle, lookback)}
      hint={format(s.NoCommentsHint, coverage?.completedPages || 0, siteTitle)} action={noCommentsAction} />;
  } else if (!sources.length) {
    body = <StateView title={stateTitle} headingRef={heading} sentence={s.ReadFailed} tone="warning" hint={s.ReadFailedHint}
      action={{ label: s.StartNewCheck, onClick: () => setView('entry') }} />;
  } else if (mode === 'page') {
    const part = nextPart
      ? { index: nextPart.part?.index || 1, retry: decisionFor(nextPart)?.status === 'notReviewed' }
      : undefined;
    body = <PageResult strings={s} labels={labels} descriptions={descriptions} sources={sources} findings={findings}
      decisions={analysis?.decisions || []} rules={shown.rules} groups={shown.groups} copilotSelected={shown.categories.length > 0}
      demo={demo} full={full} width={cardWidth} now={clockNow} failed={!!failure}
      headingRef={heading} failureMessage={analysisIssue?.message} failureDetails={analysisIssue?.details}
      nextPart={serviceAvailable && validChecks ? part : undefined} onCheckPart={() => { reviewMore().catch(report); }}
      onNewCheck={newCheck} onOpenLink={openLink} />;
  } else {
    body = <CommentsResult strings={s} labels={labels} descriptions={descriptions} headingRef={heading} siteTitle={siteTitle || s.Title}
      scope={commentsScope} demo={demo} total={sources.length} reviewed={reviewed} flagged={findingGroups} pending={pendingSources}
      unreviewed={unreviewedSources} clean={cleanSources} partlyReviewed={notReviewedKeys} nextReviewCount={selection.length}
      canReviewMore={selection.length > 0 && validChecks && serviceAvailable}
      canCheckMore={canContinueScan} capped={liveSnapshot?.state === 'capped'} busy={!!busy} coolingDown={coolingDown}
      expanded={expanded} pages={pages} notice={failure || undefined}
      onReviewMore={() => { reviewMore().catch(report); }}
      onCheckMore={() => { continueRead().catch(report); }}
      onRetry={() => { retryNotReviewed().catch(report); }}
      onToggle={key => setExpanded(toggle(expanded, key))}
      onPageChange={(list, page) => setPages(current => ({ ...current, [list]: page }))}
      onOpenLink={openLink}
      onNewCheck={newCheck} />;
  }

  const displayLabel = displayExpanded ? s.Collapse : s.Expand;
  const selectedTab = comparison?.open ? 'compare' : mode;
  const tabsDisabled = !!busy || comparison?.busy;
  return <IdPrefixProvider value="content-lens-">
    <FluentProvider theme={theme} targetDocument={props.targetDocument}>
      <div ref={canvasRoot} className={styles.canvas} style={palette}>
        <main className={mergeClasses(styles.shell, fullscreen && styles.shellFull)}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <ContentLensIcon size={18} />
              <span>{s.Title}</span>
              {demo && <span className={styles.demoLabel}>{s.DemoLabel}</span>}
            </div>
            {(canExpand || displayExpanded || comparison?.open) && <Button className={styles.iconButton} appearance="transparent"
              icon={displayExpanded ? <ArrowMinimize16Regular /> : <ArrowExpand16Regular />} aria-label={displayLabel} title={displayLabel}
              onClick={toggleDisplay} />}
          </header>
          <TabList className={styles.tabs} selectedValue={selectedTab} aria-label={s.SourceMode}
            onTabSelect={(_event, data) => {
              if (data.value === 'compare') {
                keepComparison({ ...(comparison || emptyComparison()), open: true });
              } else {
                if (comparison?.open) keepComparison({ ...comparison, open: false });
                changeMode(data.value as SourceMode);
              }
            }}>
            <Tab id="content-lens-tab-page" aria-controls="content-lens-panel" value="page" disabled={tabsDisabled}>{s.OnePage}</Tab>
            <Tab id="content-lens-tab-comments" aria-controls="content-lens-panel" value="comments" disabled={tabsDisabled}>
              {s.Comments}
            </Tab>
            <Tab id="content-lens-tab-compare" aria-controls="content-lens-panel" value="compare" disabled={tabsDisabled}>
              {s.Comparison.tab}
            </Tab>
          </TabList>
          <div role="tabpanel" id="content-lens-panel" aria-labelledby={'content-lens-tab-' + selectedTab}>{body}</div>
          <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>{status}</div>
        </main>
      </div>
    </FluentProvider>
  </IdPrefixProvider>;
}
