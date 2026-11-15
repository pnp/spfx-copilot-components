import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ComparisonView, type ComparisonViewProps } from '../ComparisonView';
import { emptyComparison, type ComparisonState, type IComparisonChat } from '../contracts';
import { textLocations } from '../evidence';
import { demoComparison, demoAnswer } from '../demo';
import type { ReviewSource } from '../../domain/contracts';
import { FixtureContentService, demoSiteUrl } from '../../services/fixtures';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
const labels = new Proxy({}, { get: (_target, key) => String(key) }) as Record<string, string>;
const strings = new Proxy({}, { get: (_target, key) => (key === 'Comparison' || key === 'Preview') ? labels : String(key) }) as IContentLensStrings;
const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');

describe('Compact and expanded comparison', () => {
  let root: Root, container: HTMLDivElement, props: ComparisonViewProps, current: ComparisonState, source: ReviewSource;
  function Harness(): React.ReactElement {
    const [value, setValue] = React.useState(props.value), [full, setFull] = React.useState(false);
    current = value;
    return <><ComparisonView {...props} value={value} full={full} onChange={setValue} onExpand={() => setFull(true)} />
      <button aria-label={full ? 'backCard' : 'openFull'} onClick={() => setFull(!full)} /></>;
  }
  const button = (name: string): HTMLButtonElement => {
    const found = Array.from(container.querySelectorAll('button')).find(b => (b.querySelector('.fui-Tab__content') || b).textContent?.trim() === name || b.getAttribute('aria-label') === name);
    if (!found) throw new Error('Missing button ' + name);
    return found;
  };
  const filter = async (value: string): Promise<void> => {
    const select = container.querySelector('[data-testid="comparison-findings-sidebar"] select') as HTMLSelectElement;
    await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
  };
  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
    Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined }) });
  });
  beforeEach(async () => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const result = await new FixtureContentService().read({ siteUrl: demoSiteUrl, mode: 'page', pageKind: 'both', pageItemId: 17, lookbackDays: 7 });
    source = result.sources[0];
    props = { value: emptyComparison(), onChange: () => undefined, strings, document, locale: 'en', demo: true,
      full: false, width: 640, onExpand: () => undefined, onOpenLink: jest.fn(), storageWarning: false };
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  it('lists findings beside both full previews and applies a sidebar selection to both pages', async () => {
    const e = demoComparison(source, document, 'en');
    e.pages.forEach((page, index) => { page.siteUrl = 'https://tenant.sharepoint.com/sites/test'; page.sourceUrl = page.siteUrl + '/SitePages/' + index + '.aspx'; });
    const a = textLocations(e.pages[0], 'A')[0], b = textLocations(e.pages[1], 'B')[0];
    const answer = demoAnswer(e, 'Compare', strings);
    answer.highlights = [{ title: 'Both passages', explanation: 'Compare these passages.', evidenceIds: [a.id, b.id] }, { title: 'Whole pages', explanation: 'Page-level observation.', evidenceIds: [] }];
    props.demo = false; props.value = { ...emptyComparison(), evidence: e, answers: [answer], finding: 1 };
    await act(async () => root.render(<Harness />));
    await act(async () => button('openFull').click());
    const sidebar = container.querySelector('[data-testid="comparison-findings-sidebar"]')!;
    expect(sidebar).not.toBeNull();
    const choose = Array.from(sidebar.querySelectorAll('button')).find(b => b.textContent?.includes('Both passages'))!;
    await act(async () => choose.click());
    expect(current.finding).toBe(0);
    expect(choose.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelectorAll('[data-testid="live-page-preview"]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="live-page-preview"] [data-testid="map-block"]')).toBeNull();
    expect(container.textContent).not.toContain('noLocation');
    expect(Array.from(container.querySelectorAll('a[href]')).every(a => a.getAttribute('data-interception') === 'off')).toBe(true);
    const link = container.querySelector('a[href]') as HTMLAnchorElement;
    await act(async () => link.click()); expect(props.onOpenLink).toHaveBeenCalledWith(e.pages[0].sourceUrl);
  });
  it('uses one zoom control for both actual page frames and explains unlocated findings', async () => {
    const e = demoComparison(source, document, 'en');
    e.pages.forEach((page, index) => { page.siteUrl = 'https://tenant.sharepoint.com/sites/test'; page.sourceUrl = page.siteUrl + '/SitePages/' + index + '.aspx'; });
    const answer = demoAnswer(e, 'Compare', strings); answer.highlights[0].evidenceIds = [];
    props.demo = false; props.value = { ...emptyComparison(), evidence: e, answers: [answer] };
    await act(async () => root.render(<Harness />));
    expect(container.textContent).toContain('unanchored');
    const zooms = container.querySelectorAll<HTMLSelectElement>('label select'); expect(zooms).toHaveLength(1);
    const frames = Array.from(container.querySelectorAll('iframe')); expect(frames).toHaveLength(2);
    await act(async () => { zooms[0].value = '75'; zooms[0].dispatchEvent(new Event('change', { bubbles: true })); });
    expect(frames.every(frame => frame.style.transform === 'scale(0.75)')).toBe(true);
    expect(Array.from(container.querySelectorAll('iframe'))).toEqual(frames);
  });
  it('runs the fictional comparison without live services and preserves the question and selected view across expansion', async () => {
    const read = jest.fn(), measure = jest.fn(), turn = jest.fn(); props.services = { read, measure, chat: { turn } };
    await act(async () => root.render(<Harness />));
    await act(async () => button('compare').click());
    expect(read).not.toHaveBeenCalled(); expect(measure).not.toHaveBeenCalled(); expect(turn).not.toHaveBeenCalled();
    expect(current.category).toBe('insights');
    expect(container.querySelector('#comparison-finding-0')?.parentElement?.hasAttribute('hidden')).toBe(false);
    expect(container.querySelectorAll('[data-testid="saved-page-preview"]')).toHaveLength(2);
    const input = container.querySelector('input')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'My question'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => button('openFull').click());
    expect(container.querySelector('input')?.value).toBe('My question');
    await filter('images');
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
    expect(Array.from(container.querySelectorAll('img')).every(img => img.src.startsWith('data:'))).toBe(true);
    await act(async () => button('backCard').click());
    expect(current.category).toBe('images'); expect(current.question).toBe('My question');
    await act(async () => button('openFull').click());
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });
  it('reads both selected pages in order and starts a fresh API conversation without a prior review', async () => {
    const evidence = demoComparison(source, document, 'en');
    props.demo = false;
    props.value = { ...emptyComparison(), selections: evidence.pages.map(p => ({ site: { url: p.siteUrl, title: p.siteUrl },
      page: { pageItemId: p.pageItemId, title: p.pageTitle, sourceUrl: p.sourceUrl!, pageKind: p.pageKind } })) as NonNullable<ComparisonState['selections']> };
    const read = jest.fn(async (_site, page) => evidence.pages[page.pageItemId === source.pageItemId ? 0 : 1]);
    const measure = jest.fn(async () => evidence), turn = jest.fn(async () => ({ conversationId: 'new-conversation', answer: demoAnswer(evidence, 'q', strings) }));
    props.services = { read, measure, chat: { turn } };
    await act(async () => root.render(<Harness />));
    expect(container.querySelectorAll('[data-testid="page-picker"]')).toHaveLength(2);
    expect(read).not.toHaveBeenCalled();
    await act(async () => button('compare').click());
    expect(read.mock.calls.map(call => call[1].pageItemId)).toEqual([source.pageItemId, 99]);
    expect(measure).toHaveBeenCalledWith(evidence.pages[0], evidence.pages[1], 'en', expect.any(AbortSignal));
    expect(turn).toHaveBeenCalledWith(evidence, 'initialQuestion', 'en', { id: undefined, messageIds: [] }, expect.any(AbortSignal));
    expect(current.conversationId).toBe('new-conversation');
    await act(async () => button('changePages').click());
    const clear = container.querySelector('[aria-label="pageA"] [data-testid="page-picker"] button[aria-label="PickerClear"]') as HTMLButtonElement;
    expect(clear).not.toBeNull();
    await act(async () => clear.click());
    expect(current.evidence).toBeUndefined(); expect(current.conversationId).toBeUndefined(); expect(current.answers).toHaveLength(0);
    expect(current.selections?.[1].page?.pageItemId).toBe(99);
  });
  it('shows actual progress through both reads, checks and Chat, then clears it on completion or cancellation', async () => {
    const evidence = demoComparison(source, document, 'en');
    function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>(_resolve => { resolve = _resolve; });
      return { promise, resolve };
    }
    const a = deferred<ReviewSource>(), b = deferred<ReviewSource>(), checked = deferred<typeof evidence>();
    const response = deferred<Awaited<ReturnType<IComparisonChat['turn']>>>(), followup = deferred<Awaited<ReturnType<IComparisonChat['turn']>>>();
    props.demo = false;
    props.value = { ...emptyComparison(), selections: evidence.pages.map(p => ({ site: { url: p.siteUrl, title: p.siteUrl },
      page: { pageItemId: p.pageItemId, title: p.pageTitle, sourceUrl: p.sourceUrl!, pageKind: p.pageKind } })) as NonNullable<ComparisonState['selections']> };
    const read = jest.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const turn = jest.fn().mockReturnValueOnce(response.promise).mockReturnValueOnce(followup.promise);
    props.services = { read, measure: () => checked.promise, chat: { turn } };
    await act(async () => root.render(<Harness />));
    await act(async () => button('compare').click());
    const progress = (): string => container.querySelector('[data-testid="comparison-progress"]')?.textContent || '';
    expect(progress()).toContain('progress_readA');
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    await act(async () => a.resolve(evidence.pages[0])); expect(progress()).toContain('progress_readB');
    await act(async () => b.resolve(evidence.pages[1])); expect(progress()).toContain('progress_checks');
    await act(async () => checked.resolve(evidence)); expect(progress()).toContain('progress_chat');
    const answer = demoAnswer(evidence, 'q', strings);
    await act(async () => response.resolve({ conversationId: 'conversation', answer }));
    expect(progress()).toBe(''); expect(current.answers).toHaveLength(1);
    await act(async () => button('suggested').click()); expect(progress()).toContain('progress_followup');
    await act(async () => button('CancelAnalysis').click()); expect(progress()).toBe(''); expect(current.interrupted).toBe(true);
    await act(async () => followup.resolve({ conversationId: 'conversation', answer }));
    expect(progress()).toBe(''); expect(current.answers).toHaveLength(1);
  });
  it('groups evidence into compact rows and reveals page facts without replacing previews', async () => {
    const evidence = demoComparison(source, document, 'en'), answer = demoAnswer(evidence, 'q', strings);
    const facts = evidence.facts.filter(f => f.kind === 'words' || f.kind === 'sentences');
    answer.highlights = [{ title: 'Content length', explanation: 'Different lengths.', evidenceIds: facts.map(f => f.id) }];
    props.value = { ...emptyComparison(), evidence, answers: [answer] };
    await act(async () => root.render(<Harness />));
    await act(async () => button('openFull').click());
    const finding = container.querySelector('#comparison-finding-0')!;
    expect(finding.querySelectorAll('ul')).toHaveLength(1);
    expect(finding.querySelectorAll('li')).toHaveLength(4);
    expect(finding.textContent?.match(/measured/g)).toHaveLength(1);
    const bRow = Array.from(finding.querySelectorAll('li')).find(row => row.textContent?.startsWith('B · words'))!;
    await act(async () => bRow.querySelector('button')!.click());
    expect(container.querySelector('details > summary')?.textContent).toBeTruthy();
    expect(Array.from(container.querySelectorAll('details')).find(d => d.querySelector('summary')?.textContent === 'structureFacts')?.open).toBe(true);
    expect(current.page).toBe('B'); expect(current.selected).toBeUndefined();
  });
  it('connects a selected finding to the saved page area without guessing or sending another Chat request', async () => {
    const evidence = demoComparison(source, document, 'en'), answer = demoAnswer(evidence, 'q', strings);
    props.value = { ...emptyComparison(), evidence, answers: [answer] };
    const turn = jest.fn(); props.services = { read: jest.fn(), measure: jest.fn(), chat: { turn } };
    await act(async () => root.render(<Harness />));
    expect(container.querySelectorAll('[data-preview-block][data-highlighted="true"]')).toHaveLength(0);
    await act(async () => button('2 · demoHelp').click());
    const highlighted = container.querySelectorAll('[data-preview-block][data-highlighted="true"]');
    expect(highlighted).toHaveLength(1); expect(highlighted[0].getAttribute('data-preview-block')).toBe('help');
    await act(async () => button('openFull').click());
    expect(current.finding).toBe(1);
    expect(container.querySelector('[data-preview-block="help"]')?.getAttribute('data-highlighted')).toBe('true');
    expect(turn).not.toHaveBeenCalled();
  });
  it('keeps both frames, zoom and scroll positions when changing filters without another API request', async () => {
    const evidence = demoComparison(source, document, 'en');
    evidence.pages.forEach((page, i) => { page.siteUrl = 'https://tenant.sharepoint.com/sites/test'; page.sourceUrl = page.siteUrl + '/SitePages/' + i + '.aspx'; });
    props.demo = false; props.value = { ...emptyComparison(), evidence, answers: [demoAnswer(evidence, 'q', strings)] };
    const turn = jest.fn(); props.services = { read: jest.fn(), measure: jest.fn(), chat: { turn } };
    await act(async () => root.render(<Harness />));
    await act(async () => button('openFull').click());
    const frames = Array.from(container.querySelectorAll('iframe'));
    const zoom = container.querySelector('label select') as HTMLSelectElement;
    await act(async () => { zoom.value = '75'; zoom.dispatchEvent(new Event('change', { bubbles: true })); });
    const viewports = frames.map(f => f.parentElement!.parentElement!);
    viewports.forEach((v, i) => { v.scrollTop = 100 + i; v.scrollLeft = 20 + i; });
    for (const category of ['checks', 'images', 'links', 'insights']) {
      await filter(category);
      expect(Array.from(container.querySelectorAll('iframe'))).toEqual(frames);
      expect(frames.every(f => f.style.transform === 'scale(0.75)')).toBe(true);
      expect(viewports.map(v => [v.scrollTop, v.scrollLeft])).toEqual([[100, 20], [101, 21]]);
      const sidebar = container.querySelector('[data-testid="comparison-findings-sidebar"]')!;
      expect(sidebar.querySelector('section[aria-label="measured"]') !== null).toBe(category !== 'insights');
      expect(sidebar.querySelector('section[aria-label="ask"]') !== null).toBe(category === 'insights');
    }
    expect(container.querySelector('[role="tab"]')).toBeNull();
    expect(turn).not.toHaveBeenCalled();
  });
  it('selects measured findings only on their own page and retains link outcomes and image metadata', async () => {
    const evidence = demoComparison(source, document, 'en');
    props.value = { ...emptyComparison(), evidence, answers: [demoAnswer(evidence, 'q', strings)] };
    await act(async () => root.render(<Harness />));
    await filter('checks');
    const sidebar = (): HTMLElement => container.querySelector('[data-testid="comparison-findings-sidebar"]')!;
    const choose = Array.from(sidebar().querySelectorAll('button')).find(b => b.textContent?.includes('A ·'))!;
    await act(async () => choose.click());
    expect(current.page).toBe('A'); expect(current.item).toContain('A:check:');
    const previews = container.querySelectorAll('[data-testid="saved-page-preview"]');
    expect(previews[0].querySelector('[data-highlighted="true"]')).not.toBeNull();
    expect(previews[1].querySelector('[data-highlighted="true"]')).toBeNull();
    await filter('links');
    const missing = Array.from(sidebar().querySelectorAll('button')).find(b => b.textContent?.includes('state_missing'))!;
    expect(missing).toBeTruthy(); await act(async () => missing.click());
    expect(sidebar().textContent).toContain('reason_prepared');
    expect(sidebar().textContent).toContain('nextLink_missing');
    await filter('images');
    await act(async () => (Array.from(sidebar().querySelectorAll('button')).find(b => b.textContent?.includes('B · image')) as HTMLButtonElement).click());
    expect(sidebar().querySelector('img')).not.toBeNull();
    expect(sidebar().textContent).toContain('1672 × 941 px');
    expect(sidebar().textContent).toContain('nextImage');
    expect(sidebar().querySelector('section[aria-label="ask"]')).toBeNull();
  });
  it('explains an inspected area without rule findings and offers semantic insights without a new request', async () => {
    const evidence = demoComparison(source, document, 'en');
    const turn = jest.fn(); props.services = { read: jest.fn(), measure: jest.fn(), chat: { turn } };
    props.value = { ...emptyComparison(), evidence, answers: [demoAnswer(evidence, 'q', strings)] };
    await act(async () => root.render(<Harness />));
    const block = container.querySelectorAll('[data-testid="saved-page-preview"]')[1].querySelector('[data-preview-block="welcome"] button') as HTMLButtonElement;
    expect(block).not.toBeNull();
    await act(async () => block.click());
    expect(current.category).toBe('checks');
    expect(container.querySelector('[data-testid="area-without-findings"]')?.textContent).toContain('noAreaFindings');
    expect(container.querySelector('[data-testid="comparison-selection-feedback"]')?.textContent).toContain('B ·');
    await act(async () => button('showFindingDetails').click());
    expect(document.activeElement).toBe(container.querySelector('[data-testid="comparison-findings-sidebar"]'));
    await act(async () => button('viewInsights').click());
    expect(current.category).toBe('insights');
    expect(turn).not.toHaveBeenCalled();
  });
  it('restores the sidebar filter and item', async () => {
    const evidence = demoComparison(source, document, 'en');
    props.value = { ...emptyComparison(), evidence, category: 'images' };
    await act(async () => root.render(<Harness />));
    expect((container.querySelector('[data-testid="comparison-findings-sidebar"] select') as HTMLSelectElement).value).toBe('images');
    await filter('links');
    await act(async () => (container.querySelector('[data-testid="comparison-findings-sidebar"] button') as HTMLButtonElement).click());
    const snapshot = current; await act(async () => root.unmount());
    root = createRoot(container); props.value = snapshot;
    await act(async () => root.render(<Harness />));
    expect(current.category).toBe('links'); expect(current.item).toBe(snapshot.item);
    expect(container.querySelector('[data-testid="comparison-findings-sidebar"] button[aria-pressed="true"]')).not.toBeNull();
  });
  it('explains default thumbnails and unread banners and keeps raw coverage notes under technical details', async () => {
    const evidence = demoComparison(source, document, 'en');
    evidence.pages[0].omittedParts = ['Web part “Title area”'];
    evidence.pages[0].page!.media = { images: [
      { id: 'banner', blockId: 'header', section: 0, column: 0, role: 'banner', state: 'unknown', metadata: 'unknown' },
      { id: 'thumbnail', blockId: 'thumbnail', section: 0, column: 0, role: 'thumbnail', state: 'configured', metadata: 'unknown', url: '/_layouts/15/images/sleektemplateimagetile.jpg' }
    ], links: [], omitted: ['Raw inventory note'] };
    props.demo = false; props.value = { ...emptyComparison(), evidence, page: 'A' };
    await act(async () => root.render(<Harness />));
    await act(async () => button('openFull').click());
    await filter('images');
    const thumbnail = Array.from(container.querySelectorAll('[data-testid="comparison-findings-sidebar"] button')).find(b => b.textContent?.includes('defaultThumbnail')) as HTMLButtonElement;
    await act(async () => thumbnail.click());
    expect(container.textContent).toContain('defaultThumbnailMeaning');
    expect(container.textContent).toContain('bannerUnknownMeaning');
    expect(thumbnail.textContent).not.toContain('dimensionsUnknown');
    expect(thumbnail.textContent).not.toContain('altUnknown');
    const technical = Array.from(container.querySelectorAll('details')).find(d => d.querySelector('summary')?.textContent === 'technicalDetails')!;
    expect(technical.open).toBe(false);
    expect(technical.textContent).toContain('Raw inventory note');
    expect(technical.textContent).toContain('Web part “Title area”');
    expect(container.textContent).toContain('loadedTextSent');
    expect(container.textContent).toContain('unreadParts');
    expect(container.textContent).toContain('inventoryPartialMeaning');
  });
  it('rejects the same saved page and keeps a failed page read out of Chat', async () => {
    props.demo = false;
    const selection = { site: { url: source.siteUrl, title: 'Site' }, page: { pageItemId: source.pageItemId, title: source.pageTitle, sourceUrl: source.sourceUrl!, pageKind: source.pageKind } };
    props.value = { ...emptyComparison(), selections: [selection, selection] };
    const read = jest.fn(async () => source), measure = jest.fn(), turn = jest.fn(); props.services = { read, measure, chat: { turn } };
    await act(async () => root.render(<Harness />));
    await act(async () => button('compare').click());
    expect(container.textContent).toContain('sameSnapshot'); expect(measure).not.toHaveBeenCalled(); expect(turn).not.toHaveBeenCalled();
    read.mockRejectedValueOnce(new Error('ACCESS_DENIED'));
    await act(async () => button('compare').click());
    expect(container.textContent).toContain('referenceUnavailable'); expect(turn).not.toHaveBeenCalled(); expect(current.busy).toBe(false);
  });
  it('restores an interrupted request without replay and ignores a late answer after unmount', async () => {
    const evidence = demoComparison(source, document, 'en');
    props.demo = false; props.value = { ...emptyComparison(), evidence, busy: true };
    let complete: ((v: unknown) => void) | undefined;
    const turn = jest.fn(() => new Promise(resolve => { complete = resolve; }));
    props.services = { read: jest.fn(), measure: jest.fn(), chat: { turn: turn as IComparisonChat['turn'] } };
    await act(async () => root.render(<Harness />));
    expect(current.busy).toBe(false); expect(current.interrupted).toBe(true); expect(turn).not.toHaveBeenCalled();
    await act(async () => button('restart').click());
    expect(turn).toHaveBeenCalledTimes(1);
    await act(async () => { root.unmount(); });
    const snapshot = current;
    await act(async () => { complete!({ conversationId: 'late', answer: demoAnswer(evidence, 'q', strings) }); });
    expect(current).toBe(snapshot);
    root = createRoot(container);
  });
  it('renders untrusted answer text as text and retains the original measured counts', async () => {
    const evidence = demoComparison(source, document, 'en'), answer = demoAnswer(evidence, 'q', strings);
    answer.highlights = []; answer.text = '<img src=x onerror=alert(1)> Links are all fine.';
    props.value = { ...emptyComparison(), evidence, answers: [answer] };
    await act(async () => root.render(<Harness />));
    expect(container.querySelector('img[src="x"], img[onerror]')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(current.evidence?.links.some(link => link.state === 'missing')).toBe(true);
    expect(container.textContent).toContain('noCitations');
  });
  it('surfaces and focuses the newest reply, folds history and keeps both page frames and zoom', async () => {
    const evidence = demoComparison(source, document, 'en');
    evidence.pages.forEach((page, i) => { page.siteUrl = 'https://tenant.sharepoint.com/sites/test'; page.sourceUrl = page.siteUrl + '/SitePages/' + i + '.aspx'; });
    const initial = demoAnswer(evidence, 'Initial comparison', strings), previous = { ...demoAnswer(evidence, 'Earlier question', strings), messageId: 'previous', text: 'Earlier answer.' };
    props.demo = false; props.value = { ...emptyComparison(), evidence, answers: [initial, previous], conversationId: 'conversation', question: 'What must Facilities confirm?' };
    let resolve!: (value: Awaited<ReturnType<IComparisonChat['turn']>>) => void;
    const turn = jest.fn(() => new Promise<Awaited<ReturnType<IComparisonChat['turn']>>>(_resolve => { resolve = _resolve; }));
    props.services = { read: jest.fn(), measure: jest.fn(), chat: { turn } };
    await act(async () => root.render(<Harness />));
    const frames = Array.from(container.querySelectorAll('iframe'));
    const zoom = container.querySelector<HTMLSelectElement>('label select')!;
    await act(async () => { zoom.value = '75'; zoom.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => button('askButton').click());
    await filter('images');
    const latest = { ...previous, messageId: 'newest', question: 'What must Facilities confirm?', text: 'Confirm the move date and access hours.' };
    await act(async () => resolve({ conversationId: 'conversation', answer: latest }));
    const article = container.querySelector<HTMLElement>('[data-testid="comparison-latest-answer"]')!;
    expect(article.textContent).toContain('Confirm the move date'); expect(document.activeElement).toBe(article);
    expect(current.category).toBe('insights'); expect(current.question).toBe('');
    const details = Array.from(container.querySelectorAll('details'));
    expect(details.find(d => d.querySelector('summary')?.textContent === 'previousAnswers (1)')?.open).toBe(false);
    expect(details.find(d => d.querySelector('summary')?.textContent === 'comparisonFindings')?.open).toBe(false);
    expect(Array.from(container.querySelectorAll('iframe'))).toEqual(frames);
    expect(frames.every(f => f.style.transform === 'scale(0.75)')).toBe(true);
    expect(turn).toHaveBeenCalledTimes(1);
  });
  it('keeps long answers and returned citations collapsed until requested', async () => {
    const evidence = demoComparison(source, document, 'en'), answer = demoAnswer(evidence, 'q', strings);
    answer.highlights = []; answer.text = 'A prepared explanation. '.repeat(45) + 'Final paragraph.';
    answer.citations = Array.from({ length: 30 }, (_v, i) => ({ title: 'Source ' + i, url: 'https://contoso.sharepoint.com/source-' + i }));
    props.demo = false; props.value = { ...emptyComparison(), evidence, answers: [answer] };
    await act(async () => root.render(<Harness />));
    expect(container.textContent).not.toContain('Final paragraph.');
    const citations = Array.from(container.querySelectorAll('details')).find(d => d.querySelector('summary')?.textContent === 'citations (30)')!;
    expect(citations.open).toBe(false);
    expect(citations.querySelectorAll('a')).toHaveLength(30);
    await act(async () => button('moreAnswer').click());
    expect(container.textContent).toContain('Final paragraph.');
    await act(async () => button('lessAnswer').click());
    expect(container.textContent).not.toContain('Final paragraph.');
    await act(async () => button('openFull').click());
    expect(container.textContent).not.toContain('Final paragraph.');
    await act(async () => button('moreAnswer').click());
    expect(container.textContent).toContain('Final paragraph.');
  });
});
