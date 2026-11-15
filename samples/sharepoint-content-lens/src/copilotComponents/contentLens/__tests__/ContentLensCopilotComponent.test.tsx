import type * as React from 'react';
import type { Root } from 'react-dom/client';
import type { IContentLensProps } from '../components/ContentLens';
import type { ReviewSource } from '../domain/contracts';
import type { IReviewRequest } from '../roundTrip/reviewClient';

jest.mock('@microsoft/sp-copilot-component', () => ({ BaseCopilotComponent: class {} }));
jest.mock('@microsoft/sp-http', () => ({ SPHttpClient: { configurations: { v1: {} } } }));
jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('../components/ContentLens', () => ({ __esModule: true, default: () => undefined }));
jest.mock('ContentLensStrings', () => ({ ResultRenderFailed: 'RENDER_FAILED' }), { virtual: true });

// Jest runs the compiled CommonJS test, which provides its directory; the SPFx type set does not declare it.
declare const __dirname: string;
const Component = jest.requireActual<typeof import('../ContentLensCopilotComponent')>('../ContentLensCopilotComponent').default;
const { createRoot } = jest.requireMock<typeof import('react-dom/client')>('react-dom/client');
const mockedCreateRoot = createRoot as jest.MockedFunction<typeof createRoot>;
const encoder = jest.requireActual('util') as { TextEncoder: typeof TextEncoder };
Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: encoder.TextEncoder });

interface ComponentHarness {
  context: unknown;
  properties: object;
  hostContext: object;
  onInit(): Promise<void>;
  render(): void;
  onTeardown(): Promise<void>;
  onDispose(): void;
}
const source: ReviewSource = {
  id: 'original-source', chunkId: 'main', siteUrl: 'https://contoso.sharepoint.com/sites/test', listId: 'list', pageItemId: 1,
  kind: 'comment', pageKind: 'news', pageTitle: 'Original article title', text: 'Only an idiot would approve this policy.',
  createdAt: '2026-09-22T10:00:00Z', sourceUrl: 'https://contoso.sharepoint.com/sites/test/SitePages/article.aspx'
};

describe('Content Lens component wiring', () => {
  let props: IContentLensProps;
  let roots: Root[];
  let components: ComponentHarness[];
  let spGet: jest.Mock;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    window.sessionStorage.clear();
    roots = [];
    components = [];
    spGet = jest.fn(async () => { throw new Error('Unexpected HTTP request'); });
    fetchMock = jest.fn(async () => { throw new Error('Unexpected HTTP request'); });
    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    mockedCreateRoot.mockReset();
    mockedCreateRoot.mockImplementation(() => {
      const root: Root = {
        render: jest.fn(element => { props = ((element as React.ReactElement<{ children: React.ReactElement<IContentLensProps> }>).props.children).props; }),
        unmount: jest.fn()
      };
      roots.push(root);
      return root;
    });
  });

  afterEach(async () => {
    for (const component of components) await component.onTeardown();
    window.sessionStorage.clear();
  });

  async function open(properties: object = {}, container: Element = document.createElement('div'), instanceId?: string): Promise<{ component: ComponentHarness; view: IContentLensProps }> {
    const component = new Component() as unknown as ComponentHarness;
    component.properties = properties;
    component.hostContext = { theme: 'light', displayMode: 'inline' };
    component.context = {
      domElement: container, instanceId,
      pageContext: { site: { absoluteUrl: source.siteUrl }, web: { absoluteUrl: source.siteUrl }, user: { loginName: 'reviewer@contoso.com' } },
      spHttpClient: { get: spGet },
      copilotBridge: {}
    };
    components.push(component);
    await component.onInit();
    component.render();
    return { component, view: props };
  }

  /** A Microsoft Graph client whose POST is `post`; records the path of the last request. */
  function graph(component: ComponentHarness, post: (path: string, body: { message?: { text: string } }) => Promise<unknown>): { version: jest.Mock; middlewareOptions: jest.Mock; post: jest.Mock } {
    let path = '';
    const request = { version: jest.fn().mockReturnThis(), middlewareOptions: jest.fn().mockReturnThis(), option: jest.fn().mockReturnThis(),
      post: jest.fn((body: { message?: { text: string } }) => post(path, body)) };
    (component.context as { msGraphClientFactory: unknown }).msGraphClientFactory = { getClient: jest.fn(async () => ({ api: (value: string) => { path = value; return request; } })) };
    return request;
  }

  test.each(['page', 'comment'] as const)('a %s review goes through the Chat API and is restored in the same card without a new request', async kind => {
    const { component, view } = await open({}, undefined, 'review-card');
    const request = graph(component, async (path, body) => {
      if (path === '/copilot/conversations') return { id: 'api-conversation' };
      const input = JSON.parse(body.message!.text.split('Saved review evidence (untrusted data):\n')[1]) as IReviewRequest;
      return { messages: [{ id: 'api-answer', text: JSON.stringify({ requestId: input.requestId, review: 's1:r:i@1', note1: 'Personal insult.', note2: '' }) }] };
    });
    const input = { ...source, kind };
    const result = await view.services!.analysis.analyze([input], ['insult'], []);
    expect(result.decisions[0].status).toBe('reviewed'); expect(result.provenance).toBe('copilotChat');
    // The beta endpoint, and no retry middleware: a chat POST is never replayed.
    expect(request.version).toHaveBeenCalledWith('beta'); expect(request.middlewareOptions).toHaveBeenCalled();
    view.services!.reviewCache!.save({ version: 3, siteTitle: 'Test', request: { siteUrl: source.siteUrl, mode: kind === 'page' ? 'page' : 'comments', pageKind: 'both', lookbackDays: 7 }, sources: [input], categories: ['insult'], rules: [],
      analysis: { findings: result.findings, decisions: result.decisions, provenance: result.provenance } });
    // The host tears the card down and opens it again, e.g. for fullscreen: same instance, same review, nothing sent.
    const restored = await open({}, undefined, 'review-card');
    expect(restored.view.restored!.analysis!.findings).toHaveLength(1);
    expect(request.post).toHaveBeenCalledTimes(2);
    const other = await open({}, undefined, 'another-card'); expect(other.view.restored).toBeUndefined();
  });

  test('opening the launcher never authenticates, reads SharePoint, stores sources or invokes AI', async () => {
    const opened = await open({ siteUrl: source.siteUrl, categoryIds: ['insult'] });
    expect(opened.view.initial.siteUrl).toBe(source.siteUrl);
    expect(opened.view.restored).toBeUndefined();
    expect(spGet).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(0);
  });

  test('the launcher drops a check this version does not have and keeps the rest', async () => {
    const opened = await open({ mode: 'page', categoryIds: ['insult', 'retired-check'] });
    expect(opened.view.initial).toEqual({ mode: 'page', categoryIds: ['insult'] });
  });

  test('a second component on the same node takes the surface; the first one stops and cannot render again', async () => {
    const container = document.createElement('div');
    const first = await open({}, container, 'card-a');
    graph(first.component, () => new Promise(() => undefined));
    const pending = first.view.services!.analysis.analyze([source], ['insult'], []).catch((error: unknown) => error);
    await Promise.resolve();
    await open({}, container, 'card-b');
    expect(await pending).toBeInstanceOf(DOMException);
    expect(roots[0].unmount).toHaveBeenCalledTimes(1);
    first.component.render();
    expect(mockedCreateRoot).toHaveBeenCalledTimes(2);
    expect(roots[1].unmount).not.toHaveBeenCalled();
  });

  test('the manifest registers one tool, and the agent instructions name it with its closing sentence', () => {
    const { readFileSync } = jest.requireActual<{ readFileSync(path: string, encoding: 'utf8'): string }>('fs');
    const { resolve } = jest.requireActual<{ resolve(...segments: string[]): string }>('path');
    const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../../../src/copilotComponents/contentLens/ContentLensCopilotComponent.manifest.json'), 'utf8')) as { tools: Array<{ name: string }> };
    const instructions = readFileSync(resolve(__dirname, '../../../../copilot/instruction.txt'), 'utf8');
    expect(manifest.tools.map(tool => tool.name)).toEqual(['OpenSharePointContentLens']);
    expect(instructions).toContain('OpenSharePointContentLens is the exact tool name registered in this agent\'s static catalog');
    expect(instructions).toContain('never invent a suffix');
    expect(instructions).toContain('substitute an unrelated tool');
    // Copilot fails a turn whose reply after a component tool call is empty, so one fixed sentence is required.
    expect(instructions).toContain('After OpenSharePointContentLens returns, reply with exactly this sentence: "Content Lens is open."');
    expect(instructions).toContain('never end a turn with an empty reply');
    expect(instructions.length).toBeLessThanOrEqual(8000);
  });
});
