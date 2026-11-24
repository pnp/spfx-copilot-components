import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { PageCombobox, SitePicker } from '../ContentPickers';
import type { DiscoveryResult, IContentLensDiscovery, PageChoice, SiteChoice } from '../../services/discovery';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
const strings = new Proxy({} as Record<string, string>, { get: (_target, key: string): string => key }) as unknown as IContentLensStrings;
const site: SiteChoice = { title: 'People and culture', url: 'https://tenant.sharepoint.com/sites/people' };
const page: PageChoice = { pageItemId: 987654, title: 'Expense policy', pageKind: 'news', sourceUrl: site.url + '/SitePages/Expenses.aspx' };

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let complete: ((value: T) => void) | undefined;
  const promise = new Promise<T>(resolve => { complete = resolve; });
  return { promise, resolve: value => { if (!complete) throw new Error('Deferred promise not initialized'); complete(value); } };
}

describe('Content Lens user-facing source pickers', () => {
  let container: HTMLDivElement;
  let root: Root;
  let discovery: IContentLensDiscovery;
  const onSiteSelect = jest.fn<void, [SiteChoice | undefined]>();
  const onPageSelect = jest.fn<void, [PageChoice | undefined]>();

  async function render(element: React.ReactElement): Promise<void> {
    await act(async () => { root.render(<FluentProvider theme={webLightTheme} targetDocument={document}>{element}</FluentProvider>); });
  }

  async function enter(value: string): Promise<void> {
    const input = container.querySelector('input');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!input || !setter) throw new Error('Missing picker input');
    await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  }

  async function click(label: string): Promise<void> {
    const button = Array.from(container.querySelectorAll('button')).find(item => item.textContent?.trim() === label || item.getAttribute('aria-label') === label);
    if (!button) throw new Error('Missing button ' + label);
    await act(async () => { button.click(); });
  }

  async function pause(milliseconds: number = 350): Promise<void> {
    await act(async () => { jest.advanceTimersByTime(milliseconds); });
  }

  async function openChoices(): Promise<void> {
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!input) throw new Error('Missing site combobox');
    await act(async () => { input.focus(); input.click(); });
    expect(input.getAttribute('aria-expanded')).toBe('true');
  }

  async function chooseSite(title: string = site.title): Promise<void> {
    const option = Array.from(container.querySelectorAll<HTMLElement>('[role="option"]')).find(item => item.textContent?.includes(title));
    if (!option) throw new Error('Missing site option ' + title);
    await act(async () => { option.click(); });
  }

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: jest.fn(() => ({
      observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn()
    })) });
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: jest.fn((query: string) => ({
      matches: false, media: query, onchange: null, addListener: jest.fn(), removeListener: jest.fn(),
      addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn()
    })) });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    // Floating UI probes top-layer states unsupported by jsdom's recursive selector implementation.
    const nativeMatches = Element.prototype.matches;
    jest.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string): boolean {
      return selector === ':fullscreen' || selector === ':modal' || selector === ':popover-open' ? false : nativeMatches.call(this, selector);
    });
    onSiteSelect.mockClear(); onPageSelect.mockClear();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    discovery = {
      searchSites: jest.fn(async () => ({ items: [site], hasMore: false })),
      resolveSite: jest.fn(async () => site),
      searchPages: jest.fn(async () => ({ items: [page], hasMore: false }))
    };
  });

  afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); jest.useRealTimers(); jest.restoreAllMocks(); });

  it('opens a Comments page dropdown and filters page/news choices', async () => {
    discovery.searchPages = jest.fn(async () => ({ items: [page, { ...page, pageItemId: 2, title: 'Ordinary page', pageKind: 'page' as const, sourceUrl: site.url + '/SitePages/Ordinary.aspx' }], hasMore: false }));
    await render(<PageCombobox discovery={discovery} site={site} pageKind="news" strings={strings} onSelect={onPageSelect} />);
    expect(discovery.searchPages).not.toHaveBeenCalled();
    await openChoices();
    expect(discovery.searchPages).toHaveBeenCalledWith(site.url, '', expect.any(AbortSignal));
    expect(container.textContent).toContain(page.title);
    expect(container.textContent).not.toContain('Ordinary page');
    await chooseSite(page.title);
    expect(onPageSelect).toHaveBeenLastCalledWith(page);
  });

  it('rejects a pasted page that conflicts with the Comments page/news filter', async () => {
    discovery.resolvePage = jest.fn(async () => ({ ...page, site }));
    await render(<PageCombobox discovery={discovery} site={site} pageKind="page" strings={strings} onSelect={onPageSelect} />);
    await enter(page.sourceUrl); await click('PickerUseLink');
    expect(onPageSelect).not.toHaveBeenCalledWith(expect.objectContaining({ pageItemId: page.pageItemId }));
    expect(container.textContent).toContain('PagePickerKindMismatch');
  });

  it('does not search on mount or prefilling and debounces name input into selectable options', async () => {
    await render(<SitePicker discovery={discovery} strings={strings} initialQuery={site.url} onSelect={onSiteSelect} />);
    await pause(1000);
    expect(discovery.resolveSite).not.toHaveBeenCalled(); expect(discovery.searchSites).not.toHaveBeenCalled();
    expect(onSiteSelect).not.toHaveBeenCalled();
    expect(container.querySelector('[role="combobox"]')).not.toBeNull();
    await enter('Pe'); await pause(200); await enter('People'); await pause(349);
    expect(discovery.searchSites).not.toHaveBeenCalled(); expect(onSiteSelect).toHaveBeenLastCalledWith(undefined);
    await pause(1);
    expect(discovery.searchSites).toHaveBeenCalledWith('People', expect.any(AbortSignal));
    expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="option"]')?.textContent).toContain(site.title);
    expect(container.querySelector('[role="option"]')?.textContent).toContain('tenant.sharepoint.com/sites/people');
    expect(onSiteSelect).not.toHaveBeenCalledWith(site);
    await chooseSite();
    expect(onSiteSelect).toHaveBeenLastCalledWith(site);
    expect(container.querySelector('input')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens live choices without a request and waits for actual edits to a prefilled name', async () => {
    await render(<SitePicker discovery={discovery} strings={strings} initialQuery="People" onSelect={onSiteSelect} />);
    await openChoices(); await pause(1000);
    expect(discovery.searchSites).not.toHaveBeenCalled(); expect(onSiteSelect).not.toHaveBeenCalled();
  });

  it('loads a bounded initial list only when opened and reuses it after closing or clearing', async () => {
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await pause(1000); expect(discovery.searchSites).not.toHaveBeenCalled();
    await openChoices();
    expect(discovery.searchSites).toHaveBeenCalledWith('', expect.any(AbortSignal));
    expect(container.textContent).toContain(site.title); expect(onSiteSelect).not.toHaveBeenCalled();
    await act(async () => { container.querySelector('input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await openChoices();
    expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    await enter('People'); await click('PickerClear'); await pause();
    expect(container.textContent).toContain(site.title); expect(discovery.searchSites).toHaveBeenCalledTimes(1);
  });

  it('retries a failed initial lookup only after an explicit close and reopen', async () => {
    discovery.searchSites = jest.fn().mockRejectedValueOnce(new Error('SHAREPOINT_THROTTLED')).mockResolvedValueOnce({ items: [site], hasMore: false });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await openChoices(); expect(container.textContent).toContain('PickerThrottled');
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await pause(1000); expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    await act(async () => { container.querySelector('input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    await openChoices(); await pause(1000);
    expect(discovery.searchSites).toHaveBeenCalledTimes(2); expect(container.textContent).toContain(site.title);
  });

  it.each(['Stop', 'Escape'])('retries an initial lookup cancelled with %s only on explicit reopening', async action => {
    const pending = deferred<DiscoveryResult<SiteChoice>>();
    discovery.searchSites = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ items: [site], hasMore: false });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await openChoices();
    const signal = (discovery.searchSites as jest.Mock).mock.calls[0][1] as AbortSignal;
    if (action === 'Stop') await click('PickerStop');
    await act(async () => { container.querySelector('input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(signal.aborted).toBe(true);
    await pause(1000); expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    await openChoices();
    expect(discovery.searchSites).toHaveBeenCalledTimes(2); expect(container.textContent).toContain(site.title);
    await act(async () => { pending.resolve({ items: [], hasMore: false }); await pending.promise; });
    expect(container.textContent).toContain(site.title);
  });

  it('reopens a selected site with its previous alternatives and no new lookup', async () => {
    const alternative: SiteChoice = { title: 'People support', url: 'https://tenant.sharepoint.com/sites/people-support' };
    discovery.searchSites = jest.fn(async () => ({ items: [site, alternative], hasMore: false }));
    function Harness(): React.ReactElement {
      const [selected, select] = React.useState<SiteChoice>();
      return <SitePicker discovery={discovery} strings={strings} value={selected} onSelect={select} />;
    }
    await render(<Harness />); await enter('People'); await pause(); await chooseSite();
    await openChoices();
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(alternative.title);
    expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    await chooseSite(alternative.title);
    expect(container.querySelector('input')?.value).toBe(alternative.title);
    await openChoices();
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(site.title);
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(alternative.title);
    expect(discovery.searchSites).toHaveBeenCalledTimes(1);
  });

  it('includes a directly resolved site alongside cached initial choices on reopening', async () => {
    const direct: SiteChoice = { title: 'Direct link site', url: 'https://tenant.sharepoint.com/sites/direct' };
    discovery.resolveSite = jest.fn(async () => direct);
    function Harness(): React.ReactElement {
      const [selected, select] = React.useState<SiteChoice>();
      return <SitePicker discovery={discovery} strings={strings} value={selected} onSelect={select} />;
    }
    await render(<Harness />); await openChoices(); await enter(direct.url); await click('PickerUseLink');
    await openChoices();
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(site.title);
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(direct.title);
    expect(discovery.searchSites).toHaveBeenCalledTimes(1); expect(discovery.resolveSite).toHaveBeenCalledTimes(1);
  });

  it('resolves a pasted file link only on request and selects the verified owning site', async () => {
    const pasted = site.url + '/Shared%20Documents/Plan.docx?web=1#section';
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter(pasted); await pause(1000);
    expect(discovery.resolveSite).not.toHaveBeenCalled(); expect(discovery.searchSites).not.toHaveBeenCalled();
    await click('PickerUseLink');
    expect(discovery.resolveSite).toHaveBeenCalledWith(pasted, expect.any(AbortSignal));
    expect(discovery.searchSites).not.toHaveBeenCalled(); expect(onSiteSelect).toHaveBeenLastCalledWith(site);
    expect(container.querySelector('input')?.value).toBe(site.title);
  });

  it('resolves a pasted link with Enter', async () => {
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter(site.url);
    await act(async () => { container.querySelector('input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    expect(discovery.resolveSite).toHaveBeenCalledTimes(1); expect(onSiteSelect).toHaveBeenLastCalledWith(site);
  });

  it('cancels stale resolution when the user edits a link and does not select its late result', async () => {
    const pending = deferred<SiteChoice>();
    discovery.resolveSite = jest.fn(() => pending.promise);
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter(site.url); await click('PickerUseLink');
    const signal = (discovery.resolveSite as jest.Mock).mock.calls[0][1] as AbortSignal;
    await enter('Finance'); expect(signal.aborted).toBe(true);
    await act(async () => { pending.resolve(site); await pending.promise; });
    expect(onSiteSelect).not.toHaveBeenCalledWith(site); expect(container.querySelector('input')?.value).toBe('Finance');
  });

  it('does not replace typed text when its parent clears the old selection', async () => {
    function Harness(): React.ReactElement {
      const [selected, select] = React.useState<SiteChoice | undefined>(site);
      return <SitePicker discovery={discovery} value={selected} initialQuery={site.url} strings={strings} onSelect={select} />;
    }
    await render(<Harness />); await enter('Fin');
    expect(container.querySelector('input')?.value).toBe('Fin'); expect(container.textContent).not.toContain('PickerSelected:');
  });

  it('selects fictional choices without connecting and returns focus after a result is selected', async () => {
    await render(<SitePicker discovery={discovery} demoSites={[site]} strings={strings} onSelect={onSiteSelect} />);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    await openChoices(); await chooseSite();
    expect(onSiteSelect).toHaveBeenLastCalledWith(site); expect(document.activeElement).toBe(container.querySelector('input'));
    await enter('People'); await pause(1000);
    expect(discovery.searchSites).not.toHaveBeenCalled(); expect(discovery.resolveSite).not.toHaveBeenCalled();
  });

  it('supports ArrowDown and Enter to select a site from the dropdown', async () => {
    await render(<SitePicker demoSites={[site]} strings={strings} onSelect={onSiteSelect} />);
    const input = container.querySelector('input');
    if (!input) throw new Error('Missing site input');
    await act(async () => { input.focus(); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    expect(onSiteSelect).toHaveBeenLastCalledWith(site); expect(input.value).toBe(site.title);
  });

  it('discards superseded name results and never chooses an ambiguous result', async () => {
    const old = deferred<DiscoveryResult<SiteChoice>>();
    const finance = { title: 'Finance', url: 'https://tenant.sharepoint.com/sites/finance' };
    discovery.searchSites = jest.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce({ items: [finance, { ...site, title: 'Finance help' }], hasMore: false });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('People'); await pause();
    const signal = (discovery.searchSites as jest.Mock).mock.calls[0][1] as AbortSignal;
    await enter('Finance'); await pause(); expect(signal.aborted).toBe(true);
    await act(async () => { old.resolve({ items: [site], hasMore: false }); await old.promise; });
    expect(container.textContent).toContain('Finance help'); expect(container.textContent).not.toContain(site.title);
    expect(onSiteSelect).not.toHaveBeenCalledWith(finance); expect(onSiteSelect).not.toHaveBeenCalledWith(site);
  });

  it('stops an active lookup, rejects late results, and clears with an accessible icon', async () => {
    const pending = deferred<DiscoveryResult<SiteChoice>>();
    discovery.searchSites = jest.fn(() => pending.promise);
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('People'); await pause();
    expect(container.textContent).toContain('PickerSearching');
    const signal = (discovery.searchSites as jest.Mock).mock.calls[0][1] as AbortSignal;
    await click('PickerStop'); expect(signal.aborted).toBe(true);
    await act(async () => { pending.resolve({ items: [site], hasMore: false }); await pending.promise; });
    expect(container.textContent).toContain('PickerStopped'); expect(container.textContent).not.toContain(site.title);
    const clear = container.querySelector('button[aria-label="PickerClear"]');
    expect(clear?.textContent).toBe('');
    await click('PickerClear'); expect(container.querySelector('input')?.value).toBe('');
    expect(document.activeElement).toBe(container.querySelector('input'));
    await pause(1000); expect(discovery.searchSites).toHaveBeenCalledTimes(1);
  });

  it('cancels pending debounce on clear and rejects active results after disabling', async () => {
    const pending = deferred<DiscoveryResult<SiteChoice>>();
    discovery.searchSites = jest.fn(() => pending.promise);
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('People'); await click('PickerClear'); await pause();
    expect(discovery.searchSites).not.toHaveBeenCalled();
    await enter('People'); await pause();
    const signal = (discovery.searchSites as jest.Mock).mock.calls[0][1] as AbortSignal;
    await render(<SitePicker discovery={discovery} strings={strings} disabled onSelect={onSiteSelect} />);
    expect(signal.aborted).toBe(true);
    await act(async () => { pending.resolve({ items: [site], hasMore: false }); await pending.promise; });
    expect(container.textContent).not.toContain(site.title); expect(container.querySelector('input')?.disabled).toBe(true);
  });

  it('shows empty and partial-result guidance in the dropdown', async () => {
    discovery.searchSites = jest.fn().mockResolvedValueOnce({ items: [], hasMore: false }).mockResolvedValueOnce({ items: [site], hasMore: true });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('Finance'); await pause(); expect(container.textContent).toContain('PickerNoMatches');
    await enter('People'); await pause(); expect(container.textContent).toContain('PickerRefine');
    expect(container.textContent).not.toContain('PickerNoMatches'); expect(container.textContent).toContain(site.title);
  });

  it('shows friendly throttling without retrying or leaking response details', async () => {
    discovery.searchSites = jest.fn(async () => { throw new Error('SHAREPOINT_THROTTLED private-response-detail'); });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('People'); await pause();
    expect(container.textContent).toContain('PickerThrottled'); expect(container.textContent).not.toContain('private-response-detail');
    expect(discovery.searchSites).toHaveBeenCalledTimes(1);
  });

  it('offers explicit retry for a busy name search without requiring another edit', async () => {
    discovery.searchSites = jest.fn().mockRejectedValueOnce(new Error('SHAREPOINT_DISCOVERY_IN_PROGRESS'))
      .mockResolvedValueOnce({ items: [site], hasMore: false });
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('People'); await pause();
    expect(container.textContent).toContain('PickerBusy');
    await pause(1000); expect(discovery.searchSites).toHaveBeenCalledTimes(1);
    await click('PickerSearch');
    expect(discovery.searchSites).toHaveBeenNthCalledWith(2, 'People', expect.any(AbortSignal));
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(site.title);
    expect(container.querySelector('input')?.value).toBe('People');
    expect(onSiteSelect).not.toHaveBeenCalledWith(site);
  });

  it.each([['401', 'PickerSignIn'], ['403', 'PickerAccessDenied'], ['404', 'PickerNotFound']])(
    'explains HTTP %s without exposing response text', async (status, message) => {
      discovery.resolveSite = jest.fn(async () => { throw new Error('SHAREPOINT_HTTP_' + status + ' private-response-detail'); });
      await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
      await enter(site.url); await click('PickerUseLink');
      expect(container.textContent).toContain(message); expect(container.textContent).not.toContain('private-response-detail');
    });

  it('requires a useful site name and explains an unavailable live host', async () => {
    await render(<SitePicker discovery={discovery} strings={strings} onSelect={onSiteSelect} />);
    await enter('P'); await pause(1000);
    expect(container.textContent).toContain('PickerNameTooShort'); expect(discovery.searchSites).not.toHaveBeenCalled();
    await render(<SitePicker strings={strings} onSelect={onSiteSelect} />);
    expect(container.textContent).toContain('PickerUnavailable'); expect(container.querySelector('input')?.disabled).toBe(true);
  });
});
