import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ContentLens, { type IContentLensProps } from '../ContentLens';
import { FixtureAnalysisClient, FixtureContentService } from '../../services/fixtures';
import type { AnalysisResult, PageStructure, ReviewSource, ScanRequest } from '../../domain/contracts';
import type { IContentLensServices } from '../../services/live';
import { ReviewError } from '../../roundTrip/reviewClient';
import { pageParts } from '../../services/analysis';
import { sharePointPageContent } from '../../services/sharePointParsing';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
// React 18.3 exports act; the generator's older React declarations still expose its type under test-utils.
const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;

// Resource-key labels keep interaction tests independent of copy edits. Production uses en-us/de-de resources.
const strings = new Proxy({
  CheckNotCounted: 'CheckNotCounted', GuidelineDates: 'Write dates as 2 October 2026.', GuidelineNeutral: 'Use gender-neutral wording.', ChecksFound: '{0} notes', ChecksFoundOne: '1 note',
  AnalysisFailedPart: 'Stopped at part {0} of {1}', AnalysisRequestId: 'Request: {0}',
  AnalysisCancelled: 'AnalysisCancelled {0}', AnalysisFailed: 'AnalysisFailed {0}', AnalysisComplete: 'AnalysisComplete {0}/{1}',
  ReviewMore: 'ReviewMore {0}', RuleLabel: 'Rule {0}', RulesCount: 'RulesCount {0}', RulesTooMany: 'RulesTooMany {0}', RuleTooLong: 'RuleTooLong {0}',
  ThingsToLookAt: 'ThingsToLookAt {0}', ThingsToLookAtOne: 'ThingsToLookAt 1',
  PagerPosition: '{0}/{1}', CommentsVerdict: 'CommentsVerdict {0} {1}/{2}', CommentsVerdictNone: 'CommentsVerdictNone {0}/{1}', CommentsCount: '{0}', CommentsCountOne: '1',
  PageReviewProgress: 'PageReviewProgress {0}/{1}', LongPageParts: 'LongPageParts {0}/{1}', VerdictCopilot: 'VerdictCopilot {0}',
  VerdictCopilotPartial: 'VerdictCopilotPartial {0} {1}', Passages: '{0} passages', PassagesOne: '1 passage', VerdictGaps: 'VerdictGaps {0}', A11yGaps: '{0} gaps', A11yGapsOne: '1 gap',
  CommentsScope: 'CommentsScope {0} {1}', NoCommentsTitle: 'NoCommentsTitle {0}', ThrottleHint: 'ThrottleHint {0}', ContinueIn: 'ContinueIn {0}',
  BlockNotes: '{0}, {1} notes', BlockNoNotes: '{0}, no notes', BlockWebPart: '{0}, web part', OutlineSection: 'Section {0}', A11ySubjectHeading: 'Heading “{0}”', A11ySubjectLink: 'Link “{0}”',
  FreshnessStale: 'FreshnessStale {0}', VerdictDates: '{0} dates', VerdictDatesOne: '1 date',
  PageVersionDraft: 'Draft {0} · {1}', PageVersionPublished: 'Published {0} · {1}', LastDays: 'LastDays {0}'
} as Record<string, string>, {
  get: (target, key: string): unknown => (key === 'Comparison' || key === 'Preview' || key === 'Demo') ? new Proxy({}, { get: (_target, name) => String(name) }) : target[key] || key
}) as unknown as IContentLensStrings;

const SITE = 'https://tenant.sharepoint.com/sites/runtime';
const PAGE_URL = SITE + '/SitePages/Office-move.aspx';
const canvas = JSON.stringify([
  { controlType: 3, id: 'image', position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 }, webPartData: { title: 'Image' } },
  { controlType: 4, id: 'move', position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 1, controlIndex: 1, sectionFactor: 8 },
    innerHTML: '<p>The move to the new building starts on 11/03/2026. Floors 2 and 3 open first.</p>' },
  { controlType: 3, id: 'links', position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 2, controlIndex: 1, sectionFactor: 4 }, webPartData: { title: 'Quick links' } },
  { controlType: 4, id: 'parking', position: { layoutIndex: 1, zoneIndex: 3, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    innerHTML: '<h3>Parking</h3><p>You clearly have not read anything we sent.</p><p>Employees must collect their permit.</p><p>Details: <a href="/x">click here</a>.</p>' }
]);

describe('Content Lens cards', () => {
  let container: HTMLDivElement;
  let root: Root;
  let props: IContentLensProps;
  const openLink = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

  function button(label: string, scope: ParentNode = container): HTMLButtonElement {
    const found = Array.from(scope.querySelectorAll('button')).find(element => element.textContent?.trim() === label || element.getAttribute('aria-label') === label);
    if (!found) throw new Error(`Missing button: ${label}`);
    return found;
  }
  function buttonStarting(label: string, scope: ParentNode = container): HTMLButtonElement {
    const found = Array.from(scope.querySelectorAll('button')).find(element => element.textContent?.trim().startsWith(label));
    if (!found) throw new Error(`Missing button prefix: ${label}`);
    return found;
  }
  function checkbox(label: string): HTMLInputElement {
    const found = Array.from(container.querySelectorAll('label')).find(element => element.textContent?.trim().startsWith(label));
    const input = found && document.getElementById(found.htmlFor);
    if (!(input instanceof HTMLInputElement)) throw new Error(`Missing checkbox: ${label}`);
    return input;
  }
  function link(label: string): HTMLAnchorElement {
    const found = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href]')).find(element => (element.textContent || '').includes(label) || element.getAttribute('aria-label') === label);
    if (!found) throw new Error(`Missing link: ${label}`);
    return found;
  }
  const text = (testId: string): string => container.querySelector(`[data-testid="${testId}"]`)?.textContent || '';
  const all = (testId: string): HTMLElement[] => Array.from(container.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));
  async function click(element: HTMLElement): Promise<void> { await act(async () => { element.click(); }); }
  async function type(input: HTMLInputElement, value: string): Promise<void> {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    await act(async () => { setter!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  }
  async function key(element: HTMLElement, name: string): Promise<void> {
    await act(async () => { element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true })); });
  }
  function guidelines(): HTMLTextAreaElement | null { return container.querySelector<HTMLTextAreaElement>('textarea'); }
  async function write(value: string): Promise<void> {
    const box = guidelines()!;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    await act(async () => { setter!.call(box, value); box.dispatchEvent(new Event('input', { bubbles: true })); });
  }
  function option(label: string): HTMLElement {
    const found = Array.from(container.querySelectorAll<HTMLElement>('[role="option"]')).find(element => element.textContent?.includes(label));
    if (!found) throw new Error(`Missing option: ${label}`);
    return found;
  }
  async function render(element: React.ReactElement): Promise<void> { await act(async () => { root.render(element); }); }

  function page(text: string, structure?: PageStructure): ReviewSource {
    return { id: `${SITE}|list|page:17`, chunkId: `${SITE}|list|page:17:0`, siteUrl: SITE, listId: 'list', pageItemId: 17, kind: 'page', pageKind: 'page',
      pageTitle: 'Office move FAQ', text, createdAt: '2026-01-01T00:00:00Z', sourceUrl: PAGE_URL,
      page: { version: '5.2', state: 'draft', modified: new Date(Date.now() - 86400000).toISOString(), ...(structure ? { structure } : {}) } };
  }
  function livePage(): ReviewSource {
    const content = sharePointPageContent(canvas, document, 'Office move FAQ');
    return { ...page(content.text, content.structure), omittedParts: content.omittedParts };
  }
  function comment(index: number): ReviewSource {
    return { id: 'item-' + index, chunkId: 'part-' + index, siteUrl: SITE, listId: 'list', pageItemId: 17, commentId: String(index), kind: 'comment', pageKind: 'news',
      pageTitle: 'Live adapter test page', text: 'Only an idiot would approve this new procedure.', createdAt: '2026-09-07T10:00:00Z', sourceUrl: PAGE_URL };
  }
  function resultFor(items: ReviewSource[], excerpt: string = 'Only an idiot'): AnalysisResult {
    return { provenance: 'copilotChat',
      findings: items.filter(item => item.text.indexOf(excerpt) >= 0).map((item, index) => ({ id: 'analysis:' + index, sourceId: item.id, chunkId: item.chunkId, categoryId: 'insult' as const,
        excerpt, explanation: 'Personal attack.', needsContext: false, offset: item.text.indexOf(excerpt) })),
      decisions: items.map(item => ({ sourceId: item.id, chunkId: item.chunkId, status: 'reviewed' as const })) };
  }
  const coverage = { completedPages: 1, partialPages: 0, failedSources: 0, retrieved: 1, matching: 1, displayed: 1, analyzed: 0, operationsAttempted: 3, httpEnvelopes: 3, isPartial: false };

  function fakeLiveServices(sources: ReviewSource[] = [comment(0)]): { services: IContentLensServices; read: jest.Mock; analysis: jest.Mock } {
    const read = jest.fn(async (_request: ScanRequest, _signal?: AbortSignal) => ({ sources, coverage }));
    const analysis = jest.fn(async (batch: ReviewSource[], _categories: string[], _rules: string[], _signal?: AbortSignal): Promise<AnalysisResult> => resultFor(batch));
    const services: IContentLensServices = {
      content: { read, continueRead: async () => ({ sources, coverage }), stop: jest.fn(),
        snapshot: () => ({ sources, coverage, state: 'completed', canContinue: false, failures: [], pages: [] }), subscribe: () => () => undefined },
      analysis: { analyze: analysis },
      discovery: {
        resolveSite: async value => ({ url: value, title: 'Runtime test site' }),
        searchSites: async () => ({ items: [{ url: SITE, title: 'Runtime test site' }], hasMore: false }),
        searchPages: async () => ({ items: [{ pageItemId: 17, title: 'Office move FAQ', pageKind: 'page', sourceUrl: PAGE_URL }], hasMore: false }),
        resolvePage: async () => ({ pageItemId: 17, title: 'Office move FAQ', pageKind: 'page', sourceUrl: PAGE_URL, site: { url: SITE, title: 'Workplace' } })
      }
    };
    return { services, read, analysis };
  }

  /** A pasted page link sets the page and its site. */
  async function chooseLivePage(): Promise<void> {
    const input = container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!;
    await type(input, PAGE_URL);
    await key(input, 'Enter');
    // The site follows the link, so the page picker is a new one for that site.
    expect(container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!.value).toBe('Office move FAQ');
    expect(container.querySelector<HTMLInputElement>('[data-testid="site-picker"] input')!.value).toBe('Workplace');
  }
  async function enterSite(value: string): Promise<void> {
    const input = container.querySelector<HTMLInputElement>('[data-testid="site-picker"] input');
    if (!input) throw new Error('Missing site picker');
    await type(input, value);
    await click(button('PickerUseLink'));
  }
  async function startDemoPage(): Promise<void> {
    await click(button('EnableDemo'));
    await click(container.querySelector<HTMLElement>('[data-testid="site-picker"] [role="combobox"]')!);
    await click(option('Workplace'));
    await click(container.querySelector<HTMLElement>('[data-testid="page-picker"] [role="combobox"]')!);
    await click(option('Office move FAQ'));
  }

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
    Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: class {
      public observe(): void { /* No layout engine in jsdom. */ }
      public unobserve(): void { /* No layout engine in jsdom. */ }
      public disconnect(): void { /* No layout engine in jsdom. */ }
    } });
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: jest.fn((query: string) => ({
      matches: false, media: query, onchange: null, addListener: jest.fn(), removeListener: jest.fn(),
      addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn()
    })) });
  });

  beforeEach(async () => {
    openLink.mockClear();
    // jsdom has no layout engine; keep Floating UI's size reads cheap. Real layout is browser-tested.
    jest.spyOn(window, 'getComputedStyle').mockImplementation(element => (element as HTMLElement).style);
    const nativeMatches = Element.prototype.matches;
    jest.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string): boolean {
      return selector === ':fullscreen' || selector === ':modal' || selector === ':popover-open' ? false : nativeMatches.call(this, selector);
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    props = {
      initial: {}, suggestedSiteUrl: '', strings, targetDocument: document,
      hostContext: { theme: 'light', displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] } as IContentLensProps['hostContext'],
      onOpenLink: openLink, onRequestDisplayMode: async () => undefined
    };
    await render(<ContentLens {...props} />);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    jest.restoreAllMocks();
  });

  it('uses one header icon to expand and minimize Compare without duplicate display buttons', async () => {
    const request = jest.fn(async () => undefined);
    props.onRequestDisplayMode = request;
    await render(<ContentLens {...props} />);
    await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!);
    expect(container.querySelectorAll('button[aria-label="Expand"]')).toHaveLength(1);
    expect(container.textContent).not.toContain('openFull'); expect(container.textContent).not.toContain('backCard');
    await click(button('Expand')); expect(request).toHaveBeenLastCalledWith('fullscreen');
    await render(<ContentLens {...props} hostContext={{ ...props.hostContext, displayMode: 'fullscreen' }} />);
    expect(container.querySelectorAll('button[aria-label="Collapse"]')).toHaveLength(1);
    await click(button('Collapse')); expect(request).toHaveBeenLastCalledWith('inline');
  });
  it.each([
    ['page', '1', 17, 7], ['page', '2', 42, 7], ['page', '3', 18, 7],
    ['comments', '1', 42, 7], ['comments', '2', 42, 30], ['comments', '3', 18, 7]
  ] as const)('prepares %s demo %s without live calls and reads the selected scope only on request', async (mode, scenario, pageItemId, days) => {
    const live = fakeLiveServices(), reads = jest.spyOn(FixtureContentService.prototype, 'read');
    props.services = live.services; await render(<ContentLens {...props} />);
    await click(container.querySelector<HTMLElement>('#content-lens-tab-' + mode)!);
    await click(button(mode === 'page' ? 'EnableDemo' : 'tryComments'));
    const select = container.querySelector<HTMLSelectElement>('[data-testid="demo-scenarios"] select')!;
    await act(async () => { select.value = scenario; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.textContent).toContain(mode + scenario + 'Task');
    expect(reads).not.toHaveBeenCalled(); expect(live.read).not.toHaveBeenCalled();
    await click(button(mode === 'page' ? 'CheckPage' : 'FindIssues'));
    expect(reads).toHaveBeenCalledWith(expect.objectContaining({ mode, pageItemId, lookbackDays: days }));
    expect(live.read).not.toHaveBeenCalled(); expect(live.analysis).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="demo-scenarios"]')).toBeNull();
  });
  it('opens Compare directly, keeps its draft selections across tabs, and never invokes review analysis', async () => {
    const live = fakeLiveServices([livePage()]);
    live.services.comparison = { discovery: live.services.discovery, read: jest.fn(), measure: jest.fn() };
    props.services = live.services;
    await render(<ContentLens {...props} />);
    await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!);
    expect(container.querySelectorAll('[data-testid="page-picker"]')).toHaveLength(2);
    expect(button('compare').disabled).toBe(true);
    const first = container.querySelector<HTMLInputElement>('[aria-label="pageA"] [data-testid="page-picker"] input')!;
    await type(first, PAGE_URL); await key(first, 'Enter');
    await click(container.querySelector<HTMLElement>('#content-lens-tab-comments')!);
    await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!);
    expect(container.querySelector<HTMLInputElement>('[aria-label="pageA"] [data-testid="page-picker"] input')!.value).toBe('Office move FAQ');
    expect(live.read).not.toHaveBeenCalled(); expect(live.analysis).not.toHaveBeenCalled(); expect(live.services.comparison.read).not.toHaveBeenCalled();
  });
  it('runs Compare from its own demo entry and retains a completed comparison across all tabs', async () => {
    await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!); await click(button('EnableDemo')); await click(button('compare'));
    expect(container.textContent).toContain('demoStructure');
    await click(container.querySelector<HTMLElement>('#content-lens-tab-page')!); await click(container.querySelector<HTMLElement>('#content-lens-tab-comments')!); await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!);
    expect(container.textContent).toContain('demoStructure');
    expect(container.querySelector('[data-testid="page-picker"]')).toBeNull();
  });
  it('retains the original page review when entering Compare and returning to Page', async () => {
    await startDemoPage(); await click(button('CheckPage'));
    const original = container.querySelector('[role="tabpanel"]')!.textContent;
    await click(container.querySelector<HTMLElement>('#content-lens-tab-compare')!);
    await click(button('compare'));
    await click(container.querySelector<HTMLElement>('#content-lens-tab-page')!);
    expect(container.querySelector('[role="tabpanel"]')!.textContent).toBe(original);
  });
  describe('Start', () => {
    it('opens on a page with its rules and the harmful-wording check, comments as the second tab', async () => {
      const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
      expect(tabs).toHaveLength(3);
      expect(tabs[0].textContent).toContain('OnePage');
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(container.querySelector('h1')?.textContent).toBe('StartTitle');
      expect(guidelines()?.placeholder).toBe('GuidelinesPlaceholder');
      expect(container.textContent).not.toContain('RulesCount');
      expect(container.querySelector('[data-testid="site-picker"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="page-picker"]')).not.toBeNull();
      expect(checkbox('HarmfulWordingShort').checked).toBe(true);
      // The example is a link, not a switch; nothing can be read outside Microsoft 365 without it.
      expect(button('EnableDemo')).toBeDefined();
      expect(button('CheckPage').disabled).toBe(true);
      expect(container.textContent).toContain('LiveUnavailable');
    });

    it('opens on Page even when the launcher suggests comments', async () => {
      await render(<ContentLens key="launcher-comments" {...props} initial={{ mode: 'comments' }} />);
      expect(Array.from(container.querySelectorAll('[role="tab"]'))[0].getAttribute('aria-selected')).toBe('true');
      expect(container.querySelector('[data-testid="page-picker"]')).not.toBeNull();
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    });

    it('does no reads or analysis on launch or page selection', async () => {
      const live = fakeLiveServices([livePage()]);
      await render(<ContentLens key="live" {...props} services={live.services} />);
      await chooseLivePage();
      expect(button('CheckPage').disabled).toBe(false);
      expect(live.read).not.toHaveBeenCalled();
      expect(live.analysis).not.toHaveBeenCalled();
    });

    it('takes guidelines as free text, remembers them as written, and sends them as up to five parts', async () => {
      const live = fakeLiveServices([livePage()]); const save = jest.fn();
      live.services.rules = { load: () => '', save };
      await render(<ContentLens key="guidelines" {...props} services={live.services} />);
      await chooseLivePage();
      const text = 'Write dates as 2 October 2026. Address readers as you.\nAvoid jargon.';
      await write(text);
      expect(save).toHaveBeenLastCalledWith(text);
      await click(button('CheckPage'));
      expect(live.analysis.mock.calls[0][1]).toContain('rule3');
      expect(live.analysis.mock.calls[0][2]).toEqual(['Write dates as 2 October 2026.', 'Address readers as you.', 'Avoid jargon.']);
      await click(button('NewCheck'));
      await write('One. Two. Three. Four. Five. Six. Seven.');
      await click(button('CheckPage'));
      expect(live.analysis.mock.calls[1][2]).toEqual(['One. Two.', 'Three. Four.', 'Five.', 'Six.', 'Seven.']);
    });

    it('lists the site\'s pages when the page picker opens, and follows a pasted link to another site', async () => {
      const live = fakeLiveServices([livePage()]);
      const searchPages = jest.fn(async () => ({ items: [{ pageItemId: 17, title: 'Office move FAQ', pageKind: 'page' as const, sourceUrl: PAGE_URL }], hasMore: false }));
      live.services.discovery!.searchPages = searchPages;
      await render(<ContentLens key="page-picker" {...props} services={live.services} />);
      await enterSite(SITE);
      await click(container.querySelector<HTMLElement>('[data-testid="page-picker"] [role="combobox"]')!);
      expect(searchPages).toHaveBeenCalledWith(SITE, '', expect.anything());
      await click(option('Office move FAQ'));
      expect(button('CheckPage').disabled).toBe(false);
      // A link to a page elsewhere switches the site with the page.
      live.services.discovery!.resolvePage = jest.fn(async () => ({ pageItemId: 9, title: 'Elsewhere', pageKind: 'news' as const,
        sourceUrl: 'https://tenant.sharepoint.com/sites/other/SitePages/Elsewhere.aspx', site: { url: 'https://tenant.sharepoint.com/sites/other', title: 'Other site' } }));
      const input = container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!;
      await type(input, 'https://tenant.sharepoint.com/sites/other/SitePages/Elsewhere.aspx');
      await key(input, 'Enter');
      expect(container.querySelector<HTMLInputElement>('[data-testid="site-picker"] input')!.value).toBe('Other site');
      expect(container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!.value).toBe('Elsewhere');
    });

    it('lets Comments browse a page and follows a direct page link to its owning site', async () => {
      const live = fakeLiveServices([comment(1)]);
      await render(<ContentLens key="comments-picker" {...props} services={live.services} />);
      await click(Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))[1]); await enterSite(SITE);
      await click(container.querySelector<HTMLElement>('[data-testid="page-picker"] [role="combobox"]')!);
      await click(option('Office move FAQ'));
      expect(container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!.value).toBe('Office move FAQ');
      const other = 'https://tenant.sharepoint.com/sites/other';
      live.services.discovery!.resolvePage = jest.fn(async () => ({ pageItemId: 9, title: 'Other discussion', pageKind: 'news' as const,
        sourceUrl: other + '/SitePages/Other.aspx', site: { url: other, title: 'Other site' } }));
      const input = container.querySelector<HTMLInputElement>('[data-testid="page-picker"] input')!;
      await type(input, other + '/SitePages/Other.aspx'); await key(input, 'Enter');
      expect(container.querySelector<HTMLInputElement>('[data-testid="site-picker"] input')!.value).toBe('Other site');
      await click(button('FindIssues'));
      expect(live.read).toHaveBeenCalledWith(expect.objectContaining({ siteUrl: other, pageItemId: 9, mode: 'comments' }), expect.anything());
    });

    it('reviews a selected page’s comments without the Page wording toggle and preserves that preference', async () => {
      const live = fakeLiveServices([comment(1)]);
      live.services.rules = { load: () => '', save: jest.fn(), loadHarmful: () => false };
      await render(<ContentLens key="comments-no-prerequisite" {...props} services={live.services} />);
      expect(checkbox('HarmfulWordingShort').checked).toBe(false);
      await click(container.querySelector<HTMLElement>('#content-lens-tab-comments')!);
      await enterSite(SITE);
      await click(container.querySelector<HTMLElement>('[data-testid="page-picker"] [role="combobox"]')!);
      await click(option('Office move FAQ'));
      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
      expect(button('FindIssues').disabled).toBe(false);
      expect(live.read).not.toHaveBeenCalled();
      await click(button('FindIssues'));
      expect(live.read).toHaveBeenCalledWith(expect.objectContaining({ mode: 'comments', pageItemId: 17 }), expect.anything());
      expect(live.analysis.mock.calls[0][1]).toEqual(['profanity', 'insult', 'hate', 'sexual', 'threat', 'aggressive']);
      expect(live.analysis.mock.calls[0][2]).toEqual([]);
      await click(container.querySelector<HTMLElement>('#content-lens-tab-page')!);
      expect(checkbox('HarmfulWordingShort').checked).toBe(false);
    });

    it('runs automatic Page checks without an AI request and saves their selected scope', async () => {
      const live = fakeLiveServices([livePage()]);
      const save = jest.fn();
      live.services.reviewCache = { get: () => undefined, save, clear: jest.fn() };
      await render(<ContentLens key="automatic-only" {...props} services={live.services} />);
      await chooseLivePage();
      await click(checkbox('HarmfulWordingShort'));
      expect(button('CheckPage').disabled).toBe(false);
      await click(button('CheckPage'));
      expect(live.read).toHaveBeenCalledTimes(1);
      expect(live.analysis).not.toHaveBeenCalled();
      expect(text('copilot-verdict')).toContain('CopilotNotSelected');
      expect(text('automatic-verdict')).toContain('AutomaticChecksLabel');
      expect(container.querySelector('[data-testid="long-page"]')).toBeNull();
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ categories: [], groups: ['a11y', 'layout', 'freshness'] }));
      const saved = save.mock.calls[0][0];
      await render(<ContentLens key="restored-automatic-only" {...props} services={live.services} restored={saved} />);
      expect(text('copilot-verdict')).toContain('CopilotNotSelected');
      expect(text('automatic-verdict')).toContain('AutomaticChecksLabel');
      expect(live.analysis).not.toHaveBeenCalled();

    });

    it('requires a check or a guideline, and guidelines of up to 1,000 characters', async () => {
      const live = fakeLiveServices([livePage()]);
      await render(<ContentLens key="checks" {...props} services={live.services} />);
      await chooseLivePage();
      await click(checkbox('HarmfulWordingShort'));
      for (const label of ['A11yLabel', 'LayoutLabel', 'FreshnessLabel']) await click(checkbox(label));
      expect(button('CheckPage').disabled).toBe(true);
      expect(container.textContent).toContain('SelectChecksHint');
      await write('x'.repeat(1001));
      expect(container.textContent).toContain('GuidelinesTooLong');
      expect(button('CheckPage').disabled).toBe(true);
      await write('Write dates as 2 October 2026.');
      expect(button('CheckPage').disabled).toBe(false);
    });

    it('offers period and kind as radios on the comments tab', async () => {
      await click(Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))[1]);
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(6);
      expect(container.textContent).toContain('LastDays 7');
      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
      expect(guidelines()).toBeNull();
    });
  });

  describe('Page result', () => {
    it('opens on the page map; any block can be chosen, and one without notes says what was found there', async () => {
      await startDemoPage();
      await click(button('CheckPage'));
      expect(container.querySelector('[data-testid="result-summary"]')).toBeNull();
      expect(text('verdict')).toContain('VerdictCopilot 3 passages');
      expect(text('verdict')).toContain('VerdictGaps 2 gaps');
      expect(text('copilot-verdict')).toContain('CopilotReviewLabel');
      expect(text('copilot-verdict')).not.toContain('VerdictGaps');
      expect(text('automatic-verdict')).toContain('AutomaticChecksLabel');
      expect(text('automatic-verdict')).toContain('VerdictGaps 2 gaps');
      expect(text('automatic-verdict')).not.toContain('VerdictCopilot');
      const blocks = all('map-block');
      expect(blocks.map(block => block.getAttribute('aria-label'))).toEqual(['Image, web part', 'The move to the new building…, 1 notes', 'Quick links, web part', 'Parking, 4 notes', 'Questions, 1 notes']);
      // Every block is a button, web parts too; the first block with a Copilot finding is chosen.
      expect(blocks.every(block => block.tagName === 'BUTTON')).toBe(true);
      expect(blocks[3].textContent).toContain('2–5');
      expect(blocks[1].getAttribute('aria-pressed')).toBe('true');
      expect(all('note').map(note => note.querySelector('span')?.textContent)).toEqual(['1']);
      expect(container.querySelector('[data-testid="note"] mark')?.textContent).toBe('starts on 11/03/2026');
      await click(blocks[3]);
      expect(blocks[3].getAttribute('aria-pressed')).toBe('true');
      expect(all('note').map(note => note.querySelector('span')?.textContent)).toEqual(['2']);
      expect(text('block-notes')).toContain('A11yNoteHeadingSkip');
      // A web part without notes: nothing found, and its content is not read.
      await click(blocks[2]);
      expect(blocks[2].getAttribute('aria-pressed')).toBe('true');
      expect(all('note')).toHaveLength(0);
      expect(text('block-nothing')).toBe('BlockNothingWebPart');
      expect(() => button('ShowOnPage')).toThrow('Missing button');
    });

    it('always lists every check without AI with its result', async () => {
      await startDemoPage();
      await click(button('CheckPage'));
      expect(text('page-facts')).toBe('PageFacts');
      const status = (kind: string): string => container.querySelector(`[data-testid="checks-${kind}"] [data-testid="check-status"]`)?.textContent || '';
      const row = (kind: string): string => container.querySelector(`[data-testid="checks-${kind}"]`)?.textContent || '';
      expect(container.querySelector('[data-testid="result-page"] [data-testid="checks"]')).not.toBeNull();
      expect(status('a11y')).toBe('2 notes');
      expect(status('layout')).toBe('1 note');
      // A check that ran and found nothing says so, with what it looked at.
      expect(status('freshness')).toBe('ChecksFreshnessNone');
      expect(row('a11y')).toContain('CheckRuleHeadingOrder');
      expect(container.querySelector('[data-testid="checks-a11y"] details')).toBeNull();
      const checks = container.querySelector<HTMLElement>('[data-testid="checks"]')!;
      expect(checks.textContent).toContain('ChecksScope');
      // Collapsed, a group lists only the rules that found something; the rules that passed come on request.
      expect(container.querySelectorAll('[data-testid="checks-a11y"] li[data-testid^="check-"]')).toHaveLength(2);
      expect(container.querySelector('[data-testid="check-lastSaved"]')).toBeNull();
      expect(container.querySelectorAll('[data-testid="checks-freshness"] li[data-testid^="check-"]')).toHaveLength(0);
      await click(button('ShowAllRules'));
      expect(button('ShowFewerRules').getAttribute('aria-expanded')).toBe('true');
      // Each check of a group with its own result; the notes themselves stay on the map, listed once.
      expect(container.querySelectorAll('[data-testid="checks-a11y"] li[data-testid^="check-"]')).toHaveLength(5);
      expect(text('check-lastSaved')).toBe('CheckNoIssue: CheckRuleLastSaved');
      expect(container.querySelector('[data-testid="checks"] [data-testid="check-note"]')).toBeNull();
    });

    it('offers every check as a toggle with an explanation, and a check turned off shows as off on the result', async () => {
      const live = fakeLiveServices([livePage()]); const saveGroups = jest.fn();
      live.services.rules = { load: () => 'My own guideline.', save: jest.fn(), loadGroups: () => undefined, saveGroups };
      await render(<ContentLens key="toggles" {...props} services={live.services} />);
      await chooseLivePage();
      const block = container.querySelector<HTMLElement>('[data-testid="also-check"]')!;
      const boxes = Array.from(block.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
      expect(boxes).toHaveLength(4);
      expect(boxes.every(box => box.checked)).toBe(true);
      // Each toggle has an ⓘ; the accessibility one lists its rules and says it needs no AI.
      const infos = Array.from(block.querySelectorAll<HTMLButtonElement>('[data-testid="info"]'));
      expect(infos).toHaveLength(4);
      await click(infos[1]);
      expect(container.textContent).toContain('CheckRuleHeadingOrder');
      expect(container.textContent).toContain('CheckInfoNoAI');
      await click(checkbox('A11yLabel'));
      expect(saveGroups).toHaveBeenLastCalledWith(['layout', 'freshness']);
      await click(button('CheckPage'));
      // The page has a skipped heading level and a "click here" link; neither is listed while accessibility is off.
      expect(all('note').some(note => note.textContent?.includes('A11yLabel'))).toBe(false);
      expect(text('checks-a11y')).toContain('CheckOff');
      expect(container.textContent).not.toContain('VerdictGaps');
      // The group that is off lists no rules, also on request; the others list theirs.
      await click(button('ShowAllRules'));
      expect(container.querySelector('[data-testid="check-headingOrder"]')).toBeNull();
      expect(container.querySelector('[data-testid="check-longParagraph"]')).not.toBeNull();
    });

    it('remembers the harmful-wording toggle, and brings the remembered toggles back after the example', async () => {
      const live = fakeLiveServices([livePage()]); const saveHarmful = jest.fn(); const saveGroups = jest.fn();
      live.services.rules = { load: () => '', save: jest.fn(), loadGroups: () => ['a11y', 'layout'], loadHarmful: () => false, saveHarmful, saveGroups };
      await render(<ContentLens key="remembered" {...props} services={live.services} />);
      expect(checkbox('HarmfulWordingShort').checked).toBe(false);
      expect(checkbox('A11yLabel').checked).toBe(true);
      expect(checkbox('FreshnessLabel').checked).toBe(false);
      await click(checkbox('HarmfulWordingShort'));
      expect(saveHarmful).toHaveBeenLastCalledWith(true);
      // Toggles changed in the example are not saved, and leaving it restores the remembered ones.
      await click(button('EnableDemo'));
      await click(checkbox('A11yLabel'));
      await click(checkbox('HarmfulWordingShort'));
      expect(saveGroups).not.toHaveBeenCalled();
      expect(saveHarmful).toHaveBeenCalledTimes(1);
      await click(button('LeaveDemo'));
      expect(checkbox('A11yLabel').checked).toBe(true);
      expect(checkbox('HarmfulWordingShort').checked).toBe(false);
    });

    it('lists each check with its own result on the page', async () => {
      await startDemoPage();
      await click(button('CheckPage'));
      await click(button('ShowAllRules'));
      // Not a news post: its check is not listed with the result.
      expect(container.querySelector('[data-testid="check-newsFacts"]')).toBeNull();
      expect(container.querySelectorAll('[data-testid="checks-a11y"] li[data-testid^="check-"]')).toHaveLength(5);
      expect(text('check-longParagraph')).toBe('1 note · CheckRuleLongParagraph');
      expect(text('check-tableHeader')).toBe('CheckNoIssue: CheckRuleTableHeader');
    });

    it('adds common guidelines to the box from a menu, as lines the reviewer can edit, and unticks one that is removed', async () => {
      const live = fakeLiveServices([livePage()]); const save = jest.fn();
      live.services.rules = { load: () => 'My own guideline.', save };
      await render(<ContentLens key="common" {...props} services={live.services} />);
      await chooseLivePage();
      const items = (): HTMLElement[] => Array.from(container.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]'));
      await click(button('AddCommonGuidelines'));
      expect(items()).toHaveLength(8);
      expect(items()[0].textContent).toBe('Write dates as 2 October 2026.');
      await click(items()[0]);
      expect(guidelines()!.value).toBe('My own guideline.\nWrite dates as 2 October 2026.');
      expect(save).toHaveBeenLastCalledWith('My own guideline.\nWrite dates as 2 October 2026.');
      // The menu stays open for more ticks and shows the line as ticked; unticking removes the line.
      expect(items()[0].getAttribute('aria-checked')).toBe('true');
      await click(items()[0]);
      expect(guidelines()!.value).toBe('My own guideline.');
      // A common guideline typed by hand counts as ticked too, and the check gets the lines as they stand.
      await write('Use gender-neutral wording.\nMore.');
      if (!items().length) await click(button('AddCommonGuidelines'));
      expect(items()[5].getAttribute('aria-checked')).toBe('true');
      await click(button('CheckPage'));
      expect(live.analysis.mock.calls[0][2]).toEqual(['Use gender-neutral wording.', 'More.']);
    });

    it('says which checks could not run, never "nothing found"', async () => {
      const unread = { ...page(livePage().text) };
      const live = fakeLiveServices([unread]);
      await render(<ContentLens key="layout-unread" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      const row = (kind: string): string => container.querySelector(`[data-testid="checks-${kind}"]`)?.textContent || '';
      for (const kind of ['a11y', 'layout']) {
        expect(container.querySelector(`[data-testid="checks-${kind}"] [data-testid="check-status"]`)?.textContent).toBe('ChecksNotChecked');
        expect(row(kind)).toContain('ChecksNotCheckedHint');
      }
      expect(container.querySelector('[data-testid="checks-freshness"] [data-testid="check-status"]')?.textContent).toBe('ChecksFreshnessNone');
      // Without the page's layout, the verdict makes no claim about accessibility gaps.
      expect(container.textContent).not.toContain('VerdictGapsNone');
      expect(text('copilot-verdict')).toContain('VerdictCopilotNone');
      // Nothing found, so the result opens on the Page face: every check of a group that could not run is still listed.
      expect(text('check-headingOrder')).toBe('ChecksNotChecked · CheckRuleHeadingOrder');
    });

    it('checks a news post\'s description and image on their own, and stops calling checks clean past the note limit', async () => {
      // The news read worked, the layout could not be read: only the news check ran.
      const news = { ...page(livePage().text), pageKind: 'news' as const };
      news.page = { ...news.page!, news: { description: false, banner: true } };
      const live = fakeLiveServices([news]);
      await render(<ContentLens key="news-only" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('check-newsFacts')).toBe('1 note · CheckRuleNewsFacts');
      expect(text('check-longBlock')).toBe('ChecksNotChecked · CheckRuleLongBlock');
      // Fifty accessibility notes of one kind: the other accessibility checks are not counted, not clean.
      const capped = livePage();
      const structure = capped.page!.structure!;
      const block = structure.sections[0].columns[0][0];
      capped.page = { ...capped.page!, structure: { ...structure,
        issues: Array.from({ length: 50 }, () => ({ kind: 'tableHeader' as const, where: 'Table', blockId: block.id })) } };
      const more = fakeLiveServices([capped]);
      await render(<ContentLens key="capped" {...props} services={more.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('check-tableHeader')).toBe('50 notes · CheckRuleTableHeader');
      expect(text('check-linkName')).toBe('CheckNotCounted · CheckRuleLinkName');
      // The news check has its own read, so the canvas limit does not touch it.
      const full = { ...capped, pageKind: 'news' as const };
      full.page = { ...capped.page!, news: { description: true, banner: true }, structure: { ...capped.page!.structure!,
        layout: Array.from({ length: 50 }, () => ({ kind: 'emptySection' as const, where: '', section: 1 })) } };
      const third = fakeLiveServices([full]);
      await render(<ContentLens key="news-capped" {...props} services={third.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      // A rule that passed is listed on request; the rules that could not be counted are listed anyway.
      expect(container.querySelector('[data-testid="check-newsFacts"]')).toBeNull();
      expect(text('check-longBlock')).toBe('CheckNotCounted · CheckRuleLongBlock');
      await click(button('ShowAllRules'));
      expect(text('check-newsFacts')).toBe('CheckNoIssue: CheckRuleNewsFacts');
      expect(text('check-longBlock')).toBe('CheckNotCounted · CheckRuleLongBlock');
    });

    it('says when a news post\'s description and image could not be read, instead of counting them as fine', async () => {
      const news = { ...livePage(), pageKind: 'news' as const };
      const live = fakeLiveServices([news]);
      await render(<ContentLens key="news-unread" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('news-not-checked')).toBe('ChecksNewsNotChecked');
    });

    it('shows a compact findings inspector in fullscreen with only the selected explanation', async () => {
      await render(<ContentLens key="full" {...props} hostContext={{ ...props.hostContext, displayMode: 'fullscreen' } as IContentLensProps['hostContext']} />);
      await startDemoPage();
      await click(button('CheckPage'));
      expect(all('note')).toHaveLength(1);
      expect(container.querySelectorAll('[data-testid="findings-sidebar"] button')).toHaveLength(6);
      expect(() => button('Expand')).toThrow('Missing button');
    });

    it('marks the example as fictional, without a SharePoint link', async () => {
      await startDemoPage();
      await click(button('CheckPage'));
      expect(container.querySelector('header')?.textContent).toContain('DemoLabel');
      expect(container.textContent).toContain('DemoMeta');
      expect(() => link('OpenInSharePoint')).toThrow('Missing link');
    });

    it('keeps changed rules in the example unchecked rather than inventing an answer', async () => {
      await startDemoPage();
      await write('Flag vague promises.');
      expect(container.textContent).toContain('RulesFixtureNotice');
      await click(button('CheckPage'));
      // The aggressive wording stands; the changed rule has no prepared answer, so the text is not complete.
      expect(text('verdict')).toContain('VerdictUnfinished');
      expect(all('saved-page-preview').some(block => block.textContent?.includes('NotCheckedByCopilot'))).toBe(true);
    });

    it('checks a live page with one explicit action, and the result names its version and links to it', async () => {
      const live = fakeLiveServices([livePage()]);
      live.analysis.mockImplementation(async (batch: ReviewSource[]) => resultFor(batch, 'You clearly have not read anything we sent.'));
      await render(<ContentLens key="live-page" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(live.read).toHaveBeenCalledWith(expect.objectContaining({ mode: 'page', pageItemId: 17, siteUrl: SITE }), expect.anything());
      expect(live.analysis).toHaveBeenCalledTimes(1);
      expect(document.activeElement?.tagName).toBe('H1');
      expect(text('page-version')).toContain('Draft 5.2');
      // A real link with the page's address; the host opens it.
      expect(link('OpenInSharePoint').getAttribute('href')).toBe(PAGE_URL);
      await click(link('OpenInSharePoint'));
      expect(openLink).toHaveBeenCalledWith(PAGE_URL);
    });

    it('refuses a page read that returns a different file than the one chosen', async () => {
      const other = { ...livePage(), sourceUrl: SITE + '/SitePages/Other.aspx' };
      const live = fakeLiveServices([other]);
      await render(<ContentLens key="mismatch" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(live.analysis).not.toHaveBeenCalled();
      expect(text('state')).toContain('ReadFailed');
    });

    it('reviews every part of a long page sequentially from one click', async () => {
      const long = page(Array.from({ length: 30 }, (_v, index) => `Section ${index}\n` + 'A sentence of policy text. '.repeat(20).trim()).join('\n\n'));
      const live = fakeLiveServices([long]);
      await render(<ContentLens key="long" {...props} services={live.services} />);
      await chooseLivePage();
      const save = jest.fn(); live.services.reviewCache = { get: () => undefined, save, clear: jest.fn() };
      await click(button('CheckPage'));
      const first = live.analysis.mock.calls[0][0] as ReviewSource[];
      expect(first).toHaveLength(1);
      expect(first[0].part).toMatchObject({ index: 1, offset: 0 });
      const count = first[0].part!.count;
      expect(count).toBeGreaterThan(1);
      // Every part is saved before the first one is sent.
      expect(save.mock.calls[0][0].sources).toHaveLength(count);
      expect(live.analysis).toHaveBeenCalledTimes(count);
      expect(live.analysis.mock.calls.map(call => (call[0] as ReviewSource[])[0].part!.index)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
      expect(save.mock.calls[0][0].autoContinuePage).toBe(true);
      expect(save.mock.calls[1][0].analysis.decisions).toHaveLength(1);
      expect(save.mock.calls[save.mock.calls.length - 1][0].analysis.decisions).toHaveLength(count);
      expect(container.querySelector('[data-testid=long-page]')).toBeNull();
      expect(text('copilot-verdict')).toContain('VerdictCopilotNone');
      expect(live.read).toHaveBeenCalledTimes(1);
    });

    it('offers a part Copilot did not answer again, and never counts the text after it as checked', async () => {
      const long = page(Array.from({ length: 30 }, (_v, index) => `Section ${index}\n` + 'A sentence of policy text. '.repeat(20).trim()).join('\n\n'));
      const live = fakeLiveServices([long]);
      live.analysis.mockImplementationOnce(async (batch: ReviewSource[]) => ({ provenance: 'copilotChat', findings: [],
        decisions: batch.map(item => ({ sourceId: item.id, chunkId: item.chunkId, status: 'notReviewed' as const })) }));
      await render(<ContentLens key="retry-part" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('verdict')).toContain('AnalysisAnswerIncomplete');
      expect(container.textContent).toContain('REVIEW_ANSWER_NOT_REVIEWED');
      expect(live.analysis).toHaveBeenCalledTimes(1);
      await click(button('RetryPageReview'));
      expect((live.analysis.mock.calls[1][0] as ReviewSource[])[0].part!.index).toBe(1);
    });

    it('shows completed progress, keeps findings on cancel and continues only the remaining text', async () => {
      const long = page(Array.from({ length: 30 }, (_v, index) => `Section ${index}\n` + 'A sentence of policy text. '.repeat(20).trim()).join('\n\n'));
      const live = fakeLiveServices([long]);
      let finish: ((result: AnalysisResult) => void) | undefined;
      live.analysis.mockImplementationOnce(async (batch: ReviewSource[]) => resultFor(batch, 'A sentence of policy text.'));
      live.analysis.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
      await render(<ContentLens key="cancel-page" {...props} services={live.services} />);
      await chooseLivePage(); await click(button('CheckPage'));
      expect(live.analysis).toHaveBeenCalledTimes(2);
      const total = (live.analysis.mock.calls[0][0] as ReviewSource[])[0].part!.count;
      expect(text('review-progress')).toContain(`PageReviewProgress 1/${total}`);
      const progress = container.querySelector('[data-testid=review-progress] [role=progressbar]')!;
      expect(progress.getAttribute('aria-valuenow')).toBe('1');
      expect(progress.getAttribute('aria-valuemax')).toBe(String(total));
      await click(button('CancelAnalysis'));
      expect((live.analysis.mock.calls[1][3] as AbortSignal).aborted).toBe(true);
      await act(async () => { finish!(resultFor(live.analysis.mock.calls[1][0] as ReviewSource[])); });
      expect(live.analysis).toHaveBeenCalledTimes(2);
      expect(text('long-page')).toContain(`LongPageParts 1/${total}`);
      expect(text('copilot-verdict')).toContain('VerdictCopilotPartial');
      await click(button('ContinuePageReview'));
      expect((live.analysis.mock.calls[2][0] as ReviewSource[])[0].part!.index).toBe(2);
      expect(live.analysis).toHaveBeenCalledTimes(total + 1);
      expect(live.read).toHaveBeenCalledTimes(1);
    });

    it('stops after a failed later request, retaining the successful prefix', async () => {
      const long = page(Array.from({ length: 30 }, (_v, index) => `Section ${index}\n` + 'A sentence of policy text. '.repeat(20).trim()).join('\n\n'));
      const live = fakeLiveServices([long]);
      live.analysis.mockImplementationOnce(async (batch: ReviewSource[]) => resultFor(batch));
      live.analysis.mockRejectedValueOnce(new ReviewError('REVIEW_TIMEOUT', '00000000-0000-4000-8000-000000000099'));
      await render(<ContentLens key="failed-page" {...props} services={live.services} />);
      await chooseLivePage(); await click(button('CheckPage'));
      expect(live.analysis).toHaveBeenCalledTimes(2);
      expect(text('copilot-verdict')).toContain('VerdictCopilotNonePartial');
      expect(button('RetryPageReview')).toBeDefined();
      expect(container.textContent).toContain('AnalysisApiTimeout');
      expect(container.textContent).toContain('Stopped at part 2 of');
      expect(container.textContent).toContain('Request: 00000000-0000-4000-8000-000000000099');
    });

    it('shows a kept partial page review without sending the remaining parts', async () => {
      const long = page(Array.from({ length: 30 }, (_v, index) => `Section ${index}\n` + 'A sentence of policy text. '.repeat(20).trim()).join('\n\n'));
      const parts = pageParts(long, ['insult'], []);
      const live = fakeLiveServices([long]);
      const restored = { version: 3 as const, request: { siteUrl: SITE, mode: 'page' as const, lookbackDays: 7 as const, pageKind: 'both' as const, pageItemId: 17 },
        siteTitle: 'Workplace', sources: parts, categories: ['insult' as const], rules: [], analysis: resultFor([parts[0]]) };
      await render(<ContentLens key="restored-partial" {...props} services={live.services} restored={restored} />);
      expect(live.analysis).not.toHaveBeenCalled();
      expect(live.read).not.toHaveBeenCalled();
    });

    it('keeps a completed review for the tab, without the request ID of its answer', async () => {
      const live = fakeLiveServices([livePage()]);
      const save = jest.fn(); live.services.reviewCache = { get: () => undefined, save, clear: jest.fn() };
      live.analysis.mockImplementation(async (batch: ReviewSource[]) => ({ ...resultFor(batch, 'You clearly have not read anything we sent.'), requestId: '00000000-0000-4000-8000-000000000042' }));
      await render(<ContentLens key="same-card" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ sources: expect.any(Array),
        analysis: expect.not.objectContaining({ requestId: expect.anything() }) }));
      expect(save.mock.calls[save.mock.calls.length - 1][0].analysis.findings).toHaveLength(1);
    });

    it('shows a kept review in a card the host opens again, without taking focus or asking Copilot', async () => {
      const live = fakeLiveServices([livePage()]);
      const source = livePage();
      const restored = { version: 3 as const, request: { siteUrl: SITE, mode: 'page' as const, lookbackDays: 7 as const, pageKind: 'both' as const, pageItemId: 17 },
        siteTitle: 'Workplace', sources: [source], categories: ['insult' as const], rules: [], analysis: resultFor([source], 'You clearly have not read anything we sent.') };
      await render(<ContentLens key="restored" {...props} services={live.services} restored={restored} />);
      expect(live.analysis).not.toHaveBeenCalled();
      expect(live.read).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(document.body);
      expect(container.querySelector('[data-testid="result-page"]')).not.toBeNull();
    });
  });

  describe('Comments', () => {
    async function openComments(services: IContentLensServices): Promise<void> {
      // Comments always uses all six wording checks, independent of the launcher’s Page selection.
      await render(<ContentLens key={'comments-' + Math.random()} {...props} initial={{ mode: 'comments', categoryIds: ['insult', 'aggressive'] }} services={services} />);
      await click(Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))[1]);
      await enterSite(SITE);
    }

    it('reviews bounded comment batches and continues only on an explicit action', async () => {
      const items = Array.from({ length: 11 }, (_v, index) => comment(index));
      const live = fakeLiveServices(items);
      await openComments(live.services);
      await click(button('FindIssues'));
      expect(live.analysis.mock.calls[0][0]).toEqual(items.slice(0, 5));
      expect(text('review-status')).toBe('CommentsVerdict 5 5/11');
      expect(button('ReviewMore 5')).toBeDefined();
      expect(all('discussion-message').filter(message => message.textContent?.includes('StatusPending'))).toHaveLength(6);
      await click(button('ReviewMore 5'));
      expect(live.analysis.mock.calls[1][0]).toEqual(items.slice(5, 10));
      await click(button('ReviewMore 1'));
      expect(live.analysis.mock.calls[2][0]).toEqual(items.slice(10));
      expect(text('review-status')).toBe('CommentsVerdict 11 11/11');
      expect(() => buttonStarting('ReviewMore')).toThrow('Missing button prefix');
      expect(live.read).toHaveBeenCalledTimes(1);
    });

    it('retains completed Comments results and shows an API failure in the card', async () => {
      const items = Array.from({ length: 9 }, (_v, index) => comment(index));
      const live = fakeLiveServices(items);
      const save = jest.fn(); live.services.reviewCache = { get: () => undefined, save, clear: jest.fn() };
      await openComments(live.services); await click(button('FindIssues'));
      expect(live.analysis).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[save.mock.calls.length - 1][0]).toMatchObject({ request: { mode: 'comments' }, analysis: { provenance: 'copilotChat' } });
      live.analysis.mockRejectedValueOnce(new ReviewError('REVIEW_TIMEOUT'));
      await click(button('ReviewMore 4'));
      expect(container.textContent).toContain('AnalysisApiTimeout');
      expect(text('review-status')).toBe('CommentsVerdict 5 5/9');
      expect(live.analysis).toHaveBeenCalledTimes(2);
    });

    it('numbers flagged comments, marks uncertain wording with a dotted underline, and opens pages only on request', async () => {
      const live = fakeLiveServices([comment(0)]);
      live.analysis.mockImplementation(async (batch: ReviewSource[]) => ({ ...resultFor(batch), findings: resultFor(batch).findings.map(finding => ({ ...finding, needsContext: true })) }));
      await openComments(live.services);
      await click(button('FindIssues'));
      const card = all('finding-card')[0];
      expect(card.querySelector('aside span')?.textContent).toBe('1');
      expect(card.querySelector('mark')?.textContent).toBe('Only an idiot');
      expect(card.textContent).toContain('Insult · Personal attack. NeedsContextNote');
      expect(openLink).not.toHaveBeenCalled();
      await click(link('OpenPage · Live adapter test page'));
      expect(openLink).toHaveBeenCalledWith(PAGE_URL);
      await click(button('ShowDiscussion', card));
      expect(button('HideDiscussion', card).getAttribute('aria-expanded')).toBe('true');
    });

    it('keeps a failed request pending and offers it again without an automatic retry', async () => {
      const live = fakeLiveServices([comment(0)]);
      live.analysis.mockRejectedValue(new Error('REVIEW_TIMEOUT'));
      await openComments(live.services);
      await click(button('FindIssues'));
      expect(live.analysis).toHaveBeenCalledTimes(1);
      expect(container.textContent).toContain('AnalysisFailed AnalysisApiTimeout');
      expect(button('ReviewMore 1')).toBeDefined();
    });

    it('cancels a pending request without accepting a late result', async () => {
      const items = Array.from({ length: 9 }, (_v, index) => comment(index));
      const live = fakeLiveServices(items);
      await openComments(live.services);
      await click(button('FindIssues'));
      let finish: ((value: AnalysisResult) => void) | undefined;
      live.analysis.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
      await click(button('ReviewMore 4'));
      expect(text('state')).toContain('AnalysisLiveRunningComments');
      await click(button('CancelAnalysis'));
      expect((live.analysis.mock.calls[1][3] as AbortSignal).aborted).toBe(true);
      await act(async () => { finish?.(resultFor(items.slice(5))); });
      expect(text('review-status')).toBe('CommentsVerdict 5 5/9');
    });

    it('says when there are no comments and offers a longer period', async () => {
      const live = fakeLiveServices([]);
      await openComments(live.services);
      await click(button('FindIssues'));
      expect(text('state')).toContain('NoCommentsTitle 7');
      await click(button('LookAt30Days'));
      expect(live.read).toHaveBeenLastCalledWith(expect.objectContaining({ lookbackDays: 30 }), expect.anything());
    });

    it('reviews the example comments in one step', async () => {
      const reads = jest.spyOn(FixtureContentService.prototype, 'read');
      const analysis = jest.spyOn(FixtureAnalysisClient.prototype, 'analyze');
      await click(Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))[1]);
      await click(button('tryComments'));
      const picker = container.querySelector<HTMLElement>('[data-testid="site-picker"] [role="combobox"]')!;
      await click(picker);
      await click(Array.from(container.querySelectorAll<HTMLElement>('[role="option"]')).find(option => option.textContent?.includes('Workplace'))!);
      await click(button('FindIssues'));
      expect(reads).toHaveBeenCalledTimes(1); expect(analysis).toHaveBeenCalledTimes(1);
      expect(all('finding-card')).toHaveLength(4);
      expect(all('discussion-message')).toHaveLength(2);
      expect(container.textContent).toContain('This policy is poorly supported. Can you share the evidence?');
      expect(container.textContent).not.toContain('Replay');
    });
  });

  describe('States', () => {
    it('says a checked-out page cannot be read, in amber, with one way forward', async () => {
      const live = fakeLiveServices([]);
      live.services.content.snapshot = () => ({ sources: [], coverage, state: 'completed', canContinue: false, pages: [],
        failures: [{ url: SITE, code: 'PAGE_CHECKED_OUT', pageItemId: 17 }] });
      await render(<ContentLens key="checked-out" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('state')).toContain('PageCheckedOut');
      expect(text('state')).toContain('PageCheckedOutHint');
      expect(button('CheckAgain')).toBeDefined();
      expect(live.analysis).not.toHaveBeenCalled();
    });

    it('does not substitute the example when SharePoint fails', async () => {
      const live = fakeLiveServices([livePage()]);
      live.read.mockRejectedValueOnce(new Error('SHAREPOINT_HTTP_403'));
      await render(<ContentLens key="failure" {...props} services={live.services} />);
      await chooseLivePage();
      await click(button('CheckPage'));
      expect(text('state')).toContain('ReadFailed');
      expect(container.querySelector('[data-testid="state"]')?.getAttribute('title')).toBe('SHAREPOINT_HTTP_403');
      expect(live.analysis).not.toHaveBeenCalled();
      expect(container.textContent).not.toContain('DemoLabel');
    });
  });

  it('asks the host to fit an inline card to its content, but not in fullscreen', async () => {
    const original = window.ResizeObserver;
    const updates: Array<() => void> = [];
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: class {
      public constructor(callback: () => void) { updates.push(callback); }
      public observe(): void { /* Sizes come from the getBoundingClientRect spy. */ }
      public unobserve(): void { /* Not needed. */ }
      public disconnect(): void { /* Not needed. */ }
    } });
    try {
      let height = 480;
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 640, height } as DOMRect));
      const request = jest.fn(async (_width: number, _height: number) => true);
      await render(<ContentLens {...props} onRequestSizeChange={request} />);
      expect(request).toHaveBeenLastCalledWith(640, 480);
      height = 300;
      await act(async () => { updates.forEach(update => update()); });
      expect(request).toHaveBeenLastCalledWith(640, 300);
      const calls = request.mock.calls.length;
      const fullscreen = { ...props.hostContext, displayMode: 'fullscreen' } as IContentLensProps['hostContext'];
      await render(<ContentLens {...props} hostContext={fullscreen} onRequestSizeChange={request} />);
      height = 200;
      await act(async () => { updates.forEach(update => update()); });
      expect(request).toHaveBeenCalledTimes(calls);
    } finally {
      Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: original });
    }
  });

  it('paints the host document in the theme colour so spare card space is not white', async () => {
    expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
    const dark = { ...props.hostContext, theme: 'dark' } as IContentLensProps['hostContext'];
    await render(<ContentLens {...props} hostContext={dark} />);
    expect(document.body.style.backgroundColor).toBe('rgb(31, 31, 31)');
  });
});
