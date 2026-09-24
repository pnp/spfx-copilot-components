/**
 * Lifecycle against the real base class, driven by the SDK's own test API.
 * The beta SDK's test-api pulls in unpublished `@msinternal/*` packages, so
 * they are stubbed virtually (AGENTS.md §4.1). This list was found by running
 * the suite and stubbing each missing module in turn; the order matters only in
 * that all six must be present before `sp-core-library` will load. Do not
 * rediscover it — add to it if the beta moves.
 */
jest.mock('@msinternal/ecs-flight', () => ({}), { virtual: true });
// Not an empty stub: sp-diagnostics does `ex instanceof CustomError` and calls
// these helpers on every QoS write, so they must exist.
jest.mock(
  '@msinternal/odsp-core-bundle',
  () => ({
    CustomError: class CustomError extends Error {},
    getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
    getQosEndSchemaFromError: () => undefined
  }),
  { virtual: true }
);
jest.mock('@msinternal/odsp-datasources/lib/interfaces/ISpPageContext', () => ({}), { virtual: true });
jest.mock('@msinternal/sp-safehtml', () => ({}), { virtual: true });
jest.mock('@msinternal/sp-telemetry', () => ({}), { virtual: true });
jest.mock('@msinternal/sp-copilot-bridge-internal', () => ({}), { virtual: true });

// The tenant setting and the SPFI factory both load PnPjs, which is ESM and
// cannot run under Jest (AGENTS.md R36). Stubbing the two component modules —
// not PnPjs itself — keeps it off the graph and lets each test decide what the
// tenant says. Default: no setting, so the mock.
const mockReadStoreSelection: jest.Mock = jest.fn();
const mockInitSP: jest.Mock = jest.fn();
jest.mock('./services/tenantSettings', () => ({
  readStoreSelection: (context: unknown) => mockReadStoreSelection(context)
}));
jest.mock('./services/getSP', () => ({
  initSP: (context: unknown, siteUrl?: string) => mockInitSP(context, siteUrl)
}));
// The factory is real unless a test takes over `resolveDocumentStoreAsync` to
// control *when* startup resolves and *which* store it hands back (8.8 L2).
const mockResolveStore: jest.Mock = jest.fn();
jest.mock('./services/documentStoreFactory', () => ({
  ...jest.requireActual('./services/documentStoreFactory'),
  resolveDocumentStoreAsync: (options: unknown) => mockResolveStore(options)
}));

// SPFx injects DEBUG via webpack's DefinePlugin; under Jest nothing does, and
// the SDK's trace logger dereferences it during initialization.
(globalThis as unknown as { DEBUG: boolean }).DEBUG = false;

// jsdom's `performance` has no User Timing API; the SDK measures every
// initialization with it. Fill in the three methods it calls.
const perf = globalThis.performance as unknown as Record<string, unknown>;
['mark', 'measure', 'clearMarks', 'clearMeasures'].forEach(fn => {
  if (typeof perf[fn] !== 'function') {
    perf[fn] = () => undefined;
  }
});
if (typeof perf.getEntriesByName !== 'function') {
  perf.getEntriesByName = () => [];
}

import { act } from 'react-dom/test-utils';
import { MockCopilotComponentContext } from '@microsoft/sp-copilot-component/dist/test-api';
import FileUploaderCopilotComponent from './FileUploaderCopilotComponent';
import type { IFileUploaderCopilotComponentProperties } from './FileUploaderCopilotComponentProperties';
import type { IFilingDraft, IFilingReceipt } from './models/filing';
import type { IDocumentStoreService } from './services/IDocumentStoreService';
import { MockDocumentStoreService } from './services/MockDocumentStoreService';
import { clickButton, chooseFiles } from './components/testHelpers';

interface IInternals {
  _internalRender(): void;
  _internalNotifyHostContextChanged(diff: { theme?: string; displayMode?: string }): void;
  _internalHandleTeardownAsync(reason?: string): Promise<void>;
}

interface IStarted {
  component: FileUploaderCopilotComponent & IInternals;
  element: HTMLElement;
  /** `initializeAsync` — i.e. `onInit()` — settling. Not awaited by `start`. */
  started: Promise<void>;
}

/** Starts the component without waiting for `onInit()`, as the host may (8.8 L2). */
function start(
  properties: IFileUploaderCopilotComponentProperties = {},
  hostContext: Record<string, unknown> = {},
  copilotBridge?: Record<string, unknown>
): IStarted {
  const element: HTMLElement = document.createElement('div');
  document.body.appendChild(element);
  const component = new FileUploaderCopilotComponent();
  const context = new MockCopilotComponentContext({
    domElement: element,
    hostContext: {
      theme: 'light',
      displayMode: 'inline',
      availableDisplayModes: ['inline', 'fullscreen'],
      ...hostContext
    } as never,
    ...(copilotBridge ? { copilotBridge: copilotBridge as never } : {})
  });
  const started: Promise<void> = context.initializeAsync(component, properties);
  return { component: component as unknown as FileUploaderCopilotComponent & IInternals, element, started };
}

async function boot(
  properties: IFileUploaderCopilotComponentProperties = {},
  hostContext: Record<string, unknown> = {}
): Promise<{ component: FileUploaderCopilotComponent & IInternals; element: HTMLElement }> {
  const { component, element, started } = start(properties, hostContext);
  await started;
  return { component, element };
}

/**
 * Stands in for the SharePoint store: not sample data, and a receipt no mock
 * could produce, so the screen proves which store did the filing.
 */
class LiveStoreStub extends MockDocumentStoreService {
  public readonly isSampleData: boolean = false;
  public saves: number = 0;

  public constructor() {
    super({ latencyMs: 0 });
  }

  public async save(drafts: IFilingDraft[], now: Date): Promise<IFilingReceipt[]> {
    this.saves++;
    const receipts: IFilingReceipt[] = await super.save(drafts, now);
    return receipts.map(r => ({ ...r, receiptNumber: 'F-777', savedByName: 'Live Filer' }));
  }
}

const FILE_URL: string = 'https://contoso.sharepoint.com/sites/records/Records/Finance/Invoices/Programs/2026/ont33.png';

/** The live stub, with the link a SharePoint receipt carries (8.8 L9). */
class LinkedLiveStoreStub extends LiveStoreStub {
  public async save(drafts: IFilingDraft[], now: Date): Promise<IFilingReceipt[]> {
    return (await super.save(drafts, now)).map(r => ({ ...r, webUrl: FILE_URL }));
  }
}

/** A promise the test settles by hand. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (e: Error) => void } {
  const handle: { resolve?: (value: T) => void; reject?: (e: Error) => void } = {};
  const promise: Promise<T> = new Promise<T>((resolve, reject) => {
    handle.resolve = resolve;
    handle.reject = reject;
  });
  return { promise, resolve: handle.resolve!, reject: handle.reject! };
}

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const COMPLETE_PROMPT: IFileUploaderCopilotComponentProperties = {
  documentKind: 'invoice',
  department: 'programs',
  vendor: 'Riverside Print Co.',
  documentDate: 'last Friday',
  amount: 1284.5
};

/** Drops one file, reviews, confirms, and waits for the receipt. */
async function fileOne(element: HTMLElement): Promise<void> {
  chooseFiles(element, [{ name: 'ont33.png', size: 20_480, type: 'image/png' }]);
  clickButton(element, 'review-and-save');
  clickButton(element, 'confirm-save');
  // Past the 250 ms the factory gives a mock, so a save that went to one has
  // finished too, and the screen shows whose receipt it is.
  await wait(400);
}

/** The receipt came from the live stub, and nothing on screen says otherwise. */
function expectLiveReceipt(element: HTMLElement, live: LiveStoreStub): void {
  expect(live.saves).toBe(1);
  expect(layout(element)).toBe('filing-receipt');
  const text: string = element.textContent || '';
  expect(text).toContain('F-777');
  expect(text).toContain('Live Filer');
  expect(text).not.toContain('F-10946');
  expect(text).not.toContain('Dana Whitfield');
  // Copy and receipt agree: live copy, no sample line.
  expect(text).toContain('ont33.png is filed.');
  expect(element.querySelector('[data-sample]')).toBeNull();
}

function layout(element: HTMLElement): string | undefined {
  const el = element.querySelector('[data-layout]');
  return el ? el.getAttribute('data-layout') || undefined : undefined;
}

beforeEach(() => {
  mockReadStoreSelection.mockReset();
  mockReadStoreSelection.mockResolvedValue({ store: 'sample' });
  mockInitSP.mockReset();
  mockResolveStore.mockReset();
  mockResolveStore.mockImplementation((options: unknown) =>
    jest.requireActual('./services/documentStoreFactory').resolveDocumentStoreAsync(options)
  );
});

describe('rendering before startup resolves (8.8 L2)', () => {
  it('shows the starting view — no mock, no file picker, no sample line — then the form on its own', async () => {
    const tenant = deferred<IDocumentStoreService>();
    mockResolveStore.mockReturnValue(tenant.promise);

    const { component, element, started } = start();
    component._internalRender();
    expect(layout(element)).toBe('store-starting');
    expect(element.querySelector('[data-file-picker]')).toBeNull();
    expect(element.querySelector('[data-sample]')).toBeNull();

    tenant.resolve(new LiveStoreStub());
    await started;
    // No host render here: the component must replace its own placeholder.
    expect(layout(element)).toBe('filing-empty');
    expect(element.querySelector('[data-sample]')).toBeNull();
  });

  it('files into the store the tenant chose, not one invented while it was being read', async () => {
    const tenant = deferred<IDocumentStoreService>();
    mockResolveStore.mockReturnValue(tenant.promise);
    const live: LiveStoreStub = new LiveStoreStub();

    const { component, element, started } = start(COMPLETE_PROMPT);
    component._internalRender(); // the host renders while onInit() is still reading the tenant
    tenant.resolve(live);
    await started;
    component._internalRender(); // and again once it has (a host-context change, say)

    await fileOne(element);
    expectLiveReceipt(element, live);
  });

  it('files into the live store after Try again, when a render came first', async () => {
    const first = deferred<IDocumentStoreService>();
    const live: LiveStoreStub = new LiveStoreStub();
    mockResolveStore.mockReturnValueOnce(first.promise).mockResolvedValueOnce(live);

    const { component, element, started } = start(COMPLETE_PROMPT);
    component._internalRender();
    first.reject(new Error('The tenant did not respond.'));
    await started;
    component._internalRender();
    expect(layout(element)).toBe('store-unavailable');

    (element.querySelector('[data-action="retry-startup"]') as HTMLElement).click();
    await wait(20);
    expect(layout(element)).toBe('filing-empty');

    await fileOne(element);
    expectLiveReceipt(element, live);
  });
});

const RECORDS_SITE: string = 'https://tenant.example.org/sites/records';

describe('starting the store (Decisions 11 and 17, audit H1)', () => {
  it('uses sample data when the tenant has not opted in', async () => {
    const { component, element } = await boot();
    component._internalRender();
    expect(mockReadStoreSelection).toHaveBeenCalledTimes(1);
    expect(mockInitSP).not.toHaveBeenCalled();
    expect(layout(element)).toBe('filing-empty');
    expect(element.querySelector('[data-sample="true"]')).toBeTruthy();
  });

  it('shows the error, not an empty canvas, when the tenant setting cannot be read', async () => {
    mockReadStoreSelection.mockRejectedValue(new Error('Access denied to the tenant setting.'));
    const { component, element } = await boot();
    component._internalRender();
    expect(layout(element)).toBe('store-unavailable');
    expect(element.textContent).toContain('Access denied to the tenant setting.');
    expect(element.querySelector('[data-file-picker]')).toBeNull();
  });

  it('targets the configured site, and reports a library it cannot read', async () => {
    mockReadStoreSelection.mockResolvedValue({ store: 'sharepoint', siteUrl: RECORDS_SITE });
    mockInitSP.mockReturnValue({
      web: {
        lists: {
          getByTitle: () => {
            throw new Error('List does not exist.');
          }
        }
      }
    });
    const { component, element } = await boot();
    component._internalRender();
    expect(mockInitSP).toHaveBeenCalledTimes(1);
    expect(mockInitSP.mock.calls[0][1]).toBe(RECORDS_SITE);
    expect(layout(element)).toBe('store-unavailable');
    expect(element.textContent).toContain('could not be read: List does not exist.');
    expect(element.querySelector('[data-sample]')).toBeNull();
  });

  it('tries again from the unavailable view and recovers', async () => {
    mockReadStoreSelection.mockRejectedValueOnce(new Error('The tenant did not respond.'));
    const { component, element } = await boot();
    component._internalRender();
    expect(layout(element)).toBe('store-unavailable');

    (element.querySelector('[data-action="retry-startup"]') as HTMLElement).click();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(mockReadStoreSelection).toHaveBeenCalledTimes(2);
    expect(layout(element)).toBe('filing-empty');
  });
});

describe('links out of the canvas (8.8 L9)', () => {
  async function receiptWith(bridge: Record<string, unknown>): Promise<HTMLElement> {
    mockResolveStore.mockResolvedValue(new LinkedLiveStoreStub());
    const { component, element, started } = start(COMPLETE_PROMPT, {}, bridge);
    await started;
    component._internalRender();
    await fileOne(element);
    expect(layout(element)).toBe('filing-receipt');
    return element;
  }
  /** Lets the bridge promise and the state update it causes land inside act(). */
  const settle = (): Promise<void> =>
    act(async () => {
      await wait(0);
    });
  const status = (element: HTMLElement): string | null =>
    element.querySelector('[data-link-status]')!.getAttribute('data-link-status');

  it('opens through the host bridge, never an anchor the iframe swallows', async () => {
    const openLinkAsync = jest.fn().mockResolvedValue({});
    const element = await receiptWith({ openLinkAsync });
    expect(element.querySelector('a[target="_blank"]')).toBeNull();

    clickButton(element, 'open-in-sharepoint');
    await settle();
    expect(openLinkAsync).toHaveBeenCalledWith(FILE_URL);
    // Acknowledged is not opened: nothing is claimed.
    expect(status(element)).toBe('idle');
  });

  it('says so when the host refuses the link', async () => {
    const element = await receiptWith({ openLinkAsync: jest.fn().mockResolvedValue({ isError: true }) });
    clickButton(element, 'open-in-sharepoint');
    await settle();
    expect(status(element)).toBe('open-failed');
    expect(element.textContent).toContain("Couldn't open the link here. Select it above to copy it.");
  });

  it('says so when the bridge throws', async () => {
    const element = await receiptWith({ openLinkAsync: jest.fn().mockRejectedValue(new Error('denied')) });
    clickButton(element, 'open-in-sharepoint');
    await settle();
    expect(status(element)).toBe('open-failed');
  });

  it('offers only the URL when the host has no open-link call', async () => {
    const element = await receiptWith({});
    expect(element.querySelector('[data-action="open-in-sharepoint"]')).toBeNull();
    expect(element.querySelector('[data-action="copy-link"]')).toBeNull();
    expect(element.querySelector('[data-link-url]')!.textContent).toBe(FILE_URL);
  });
});

describe('component lifecycle', () => {
  it('renders the filing flow into the host element', async () => {
    const { component, element } = await boot({ documentKind: 'invoice' });
    component._internalRender();
    expect(layout(element)).toBe('filing-empty');
    expect(element.querySelector('[data-file-picker]')).toBeTruthy();
  });

  it('opens on recent filings when the prompt asked for them', async () => {
    const { component, element } = await boot({ intent: 'recent' });
    component._internalRender();
    // The first render is synchronous, so the skeleton is what is on screen
    // while the store call is in flight. The real factory gives the mock a
    // 250 ms latency, so wait past it rather than a single tick.
    expect(layout(element)).toBe('recent-loading');
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(layout(element)).toBe('recent-default');
    expect(element.querySelectorAll('[data-row]').length).toBeGreaterThan(0);
  });

  it('switches view when the host reports full screen', async () => {
    const { component, element } = await boot();
    component._internalRender();
    expect(element.querySelector('[data-display-mode]')!.getAttribute('data-display-mode')).toBe('inline');

    component._internalNotifyHostContextChanged({ displayMode: 'fullscreen' });
    expect(element.querySelector('[data-display-mode]')!.getAttribute('data-display-mode')).toBe('fullscreen');
    expect(layout(element)).toBe('filing-bulk');
  });

  it('follows a theme flip without resetting the session', async () => {
    const { component, element } = await boot();
    component._internalRender();
    expect(element.querySelector('[data-theme]')!.getAttribute('data-theme')).toBe('light');

    component._internalNotifyHostContextChanged({ theme: 'dark' });
    expect(element.querySelector('[data-theme]')!.getAttribute('data-theme')).toBe('dark');
  });

  it('render is idempotent — repeated renders do not duplicate the tree', async () => {
    const { component, element } = await boot();
    component._internalRender();
    component._internalRender();
    component._internalRender();
    expect(element.querySelectorAll('[data-layout]').length).toBe(1);
  });

  it('unmounts cleanly on teardown', async () => {
    const { component, element } = await boot();
    component._internalRender();
    expect(element.childNodes.length).toBeGreaterThan(0);

    await component._internalHandleTeardownAsync('conversation-ended');
    (component as unknown as { dispose(): void }).dispose();
    expect(element.childNodes.length).toBe(0);
  });
});
