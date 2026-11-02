const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());
const mockBaseDispose = jest.fn<void, []>();
const mockSizeChange = jest.fn<Promise<boolean>, [number, number]>(() => Promise.resolve(true));
const mockPublish = jest.fn<Promise<void>, [ISPCopilotModelContext]>(() => Promise.resolve());
const mockFollowUp = jest.fn<Promise<{ isError?: boolean }>, [unknown[]]>(() => Promise.resolve({}));

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  createCopilotTextContent: (text: string) => ({ type: 'text', text }),
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: { user: { displayName: 'Megan Bowen' } },
      copilotBridge: { updateModelContextAsync: mockPublish, sendFollowUpMessageAsync: mockFollowUp }
    };
    public properties = {};
    public hostContext = {
      displayMode: 'inline',
      availableDisplayModes: ['inline', 'fullscreen'],
      theme: 'light'
    };
    protected onTeardown(reason: string | undefined): Promise<void> {
      return mockBaseTeardown(reason);
    }
    protected onDispose(): void { mockBaseDispose(); }
    protected requestSizeChangeAsync(width: number, height: number): Promise<boolean> {
      return mockSizeChange(width, height);
    }
  }
}));
jest.mock('./RevenueApp', () => ({ __esModule: true, default: 'service-app' }));
jest.mock('./RevenueThemeProvider', () => ({ __esModule: true, default: 'service-theme-provider' }));

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import type { ISPCopilotModelContext } from '@microsoft/sp-copilot-component';
import type { IRevenueAppProps, IModelContextSnapshot } from './RevenueApp';
import { contextRecord } from './copilot';
import { modelContextBytes } from './modelContext';
import type { IRevenueProperties, RevenueIntentKey } from './catalog';
import RevenueCopilotComponentBase from './RevenueCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);
const activeComponents: TestComponent[] = [];
const optionalResizeWindow: { ResizeObserver?: typeof ResizeObserver } = window;

class TestComponent extends RevenueCopilotComponentBase<IRevenueProperties> {
  protected intentKey: RevenueIntentKey = 'GetDealRisk';
  public constructor() { super(); activeComponents.push(this); }
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
  public disposeForTest(): void { this.onDispose(); }
  public get elementForTest(): HTMLElement { return this.context.domElement; }
  public setModeForTest(displayMode: 'inline' | 'fullscreen'): void {
    this.hostContext = { ...this.hostContext, displayMode };
  }
}

describe('RevenueCopilotComponentBase React root lifecycle', () => {
  const frames = new Map<number, FrameRequestCallback>();
  const observers: { callback: ResizeObserverCallback; observer: ResizeObserver }[] = [];
  const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
  let nextFrame = 0;
  beforeEach(() => {
    activeComponents.length = 0;
    frames.clear();
    observers.length = 0;
    nextFrame = 0;
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
    mockBaseDispose.mockClear();
    mockSizeChange.mockReset().mockResolvedValue(true);
    mockPublish.mockReset().mockResolvedValue(undefined);
    mockFollowUp.mockReset().mockResolvedValue({});
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
        const observer: ResizeObserver = { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
        observers.push({ callback, observer });
        return observer;
      })
    });
  });
  afterEach(async () => {
    for (const component of activeComponents) await component.teardownForTest();
    jest.restoreAllMocks();
    if (resizeObserverDescriptor) Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor);
    else delete optionalResizeWindow.ResizeObserver;
  });

  function flushFrame(): void {
    const pending = Array.from(frames.values());
    frames.clear();
    pending.forEach(callback => callback(0));
  }

  function contentFor(component: TestComponent, width: number, height: number, mode: 'inline' | 'fullscreen' = 'inline'): HTMLElement {
    const content = document.createElement('div');
    content.dataset.layout = `GetDealRisk-${mode}`;
    content.textContent = 'Committed component content';
    jest.spyOn(content, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, width, height));
    component.elementForTest.appendChild(content);
    return content;
  }

  function resizingComponent(): TestComponent {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    const component = new TestComponent();
    component.renderForTest();
    return component;
  }

  test('reuses one root across host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const component = new TestComponent();
    component.renderForTest();
    component.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });

  test('keeps independent component roots', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new TestComponent().renderForTest();
    new TestComponent().renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });

  test('unmounts before base teardown and clears the root', async () => {
    const order: string[] = [];
    const root = { render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) };
    mockCreateRoot.mockReturnValue(root);
    mockBaseTeardown.mockImplementationOnce(() => {
      order.push('base');
      return Promise.resolve();
    });
    const component = new TestComponent();
    component.renderForTest();
    await component.teardownForTest();
    expect(order).toEqual(['unmount', 'base']);
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
    component.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('allows teardown before first render', async () => {
    await new TestComponent().teardownForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });

  test('measures committed content after layout and reports every host redraw, including unchanged dimensions', async () => {
    const component = resizingComponent();
    flushFrame();
    expect(mockSizeChange).not.toHaveBeenCalled();
    const content = contentFor(component, 760.2, 600.3);
    await Promise.resolve();
    flushFrame();
    expect(mockSizeChange).toHaveBeenLastCalledWith(761, 601);
    expect(observers[0].observer.observe).toHaveBeenCalledWith(content);
    component.renderForTest();
    component.renderForTest();
    expect(frames.size).toBe(1);
    flushFrame();
    expect(mockSizeChange.mock.calls).toEqual([[761, 601], [761, 601]]);
  });

  test('reports internal subtree redraws without another host render and coalesces changes in one frame', async () => {
    const component = resizingComponent();
    const content = contentFor(component, 760, 450);
    await Promise.resolve();
    flushFrame();
    content.textContent = 'New component stage';
    content.setAttribute('data-view', 'details');
    await Promise.resolve();
    expect(frames.size).toBe(1);
    flushFrame();
    expect(mockSizeChange.mock.calls).toEqual([[760, 450], [760, 450]]);
    expect(mockCreateRoot.mock.results[0].value.render).toHaveBeenCalledTimes(1);
  });

  test('tracks asynchronous layout growth and shrink using content, not a retained iframe height', async () => {
    const component = resizingComponent();
    jest.spyOn(component.elementForTest, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 760, 1000));
    const content = contentFor(component, 760, 600);
    await Promise.resolve();
    flushFrame();
    jest.mocked(content.getBoundingClientRect).mockReturnValue(new DOMRect(0, 0, 760, 720));
    observers[0].callback([], observers[0].observer);
    flushFrame();
    jest.mocked(content.getBoundingClientRect).mockReturnValue(new DOMRect(0, 0, 390, 420));
    observers[0].callback([], observers[0].observer);
    flushFrame();
    expect(mockSizeChange.mock.calls).toEqual([[760, 600], [760, 720], [390, 420]]);
  });

  test('tracks replacement content when the host changes display mode', async () => {
    const component = resizingComponent();
    const inline = contentFor(component, 760, 400);
    await Promise.resolve();
    flushFrame();
    component.setModeForTest('fullscreen');
    inline.remove();
    const fullscreen = contentFor(component, 1440, 980, 'fullscreen');
    component.renderForTest();
    await Promise.resolve();
    flushFrame();
    expect(mockSizeChange.mock.calls).toEqual([[760, 400], [1440, 980]]);
    expect(observers[0].observer.observe).toHaveBeenLastCalledWith(fullscreen);
  });

  test('includes content overflow and still reports DOM redraws without ResizeObserver support', async () => {
    delete optionalResizeWindow.ResizeObserver;
    const component = resizingComponent();
    const content = contentFor(component, 760, 600);
    Object.defineProperty(content, 'scrollHeight', { value: 720 });
    await Promise.resolve();
    flushFrame();
    content.textContent = 'Updated content without a layout observer';
    await Promise.resolve();
    flushFrame();
    expect(mockSizeChange.mock.calls).toEqual([[760, 720], [760, 720]]);
    expect(observers).toHaveLength(0);
  });

  test('disconnects observers and cancels queued measurements on teardown and disposal', async () => {
    const component = resizingComponent();
    contentFor(component, 760, 600);
    await Promise.resolve();
    flushFrame();
    const observer = observers[0];
    observer.callback([], observer.observer);
    expect(frames.size).toBe(1);
    await component.teardownForTest();
    expect(observer.observer.disconnect).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    observer.callback([], observer.observer);
    flushFrame();
    expect(mockSizeChange).toHaveBeenCalledTimes(1);
    const disposed = resizingComponent();
    contentFor(disposed, 760, 400);
    await Promise.resolve();
    disposed.disposeForTest();
    flushFrame();
    expect(mockBaseDispose).toHaveBeenCalledTimes(1);
    expect(mockSizeChange).toHaveBeenCalledTimes(1);
  });

  test('logs unexpected sizing failures and permits the next redraw to retry', async () => {
    const error = new Error('Size notification unavailable');
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSizeChange.mockRejectedValueOnce(error);
    const component = resizingComponent();
    contentFor(component, 760, 400);
    await Promise.resolve();
    flushFrame();
    await Promise.resolve();
    expect(log).toHaveBeenCalledWith('The Copilot component size could not be reported.', error);
    component.renderForTest();
    flushFrame();
    expect(mockSizeChange).toHaveBeenCalledTimes(2);
  });

  function appProps(): IRevenueAppProps {
    const root = { render: jest.fn<void, [React.ReactNode]>(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    new TestComponent().renderForTest();
    const element = root.render.mock.calls[0][0];
    if (!React.isValidElement<{ children: React.ReactElement<IRevenueAppProps> }>(element)) throw new Error('Missing theme element');
    return element.props.children.props;
  }
  const state = (summary: string): IModelContextSnapshot => ({
    intent: 'GetDealRisk', displayMode: 'inline', route: 'deal-room/risks', selectedEntityId: 'EV-05',
    workflowStage: 'analysis', summary, availableActions: ['Inspect EV-05']
  });
  test('publishes click-time context and follow-up atomically between passive updates', async () => {
    const props = appProps();
    let complete: () => void = () => { throw new Error('Missing pending publish'); };
    const pending = new Promise<void>(resolve => { complete = resolve; });
    mockPublish.mockImplementationOnce(() => pending);
    mockFollowUp.mockImplementationOnce(async () => {
      expect(mockPublish).toHaveBeenCalledTimes(2);
      expect(contextRecord(mockPublish.mock.calls[1][0].structuredContent).summary).toBe('click-time selection');
      return {};
    });
    const initial = props.onUpdateModelContext(state('passive initial'));
    const followUp = props.onSendFollowUp('Discuss EV-05', state('click-time selection'));
    const later = props.onUpdateModelContext(state('passive later'));
    await Promise.resolve();
    expect(mockFollowUp).not.toHaveBeenCalled();
    complete();
    await Promise.all([initial, followUp, later]);
    expect(mockPublish.mock.calls.map(call => contextRecord(call[0].structuredContent).summary)).toEqual(['passive initial', 'click-time selection', 'passive later']);
    expect(mockFollowUp).toHaveBeenCalledWith([{ type: 'text', text: 'Discuss EV-05' }]);
  });
  test('context failures prevent messages, propagate to the UI and permit an explicit retry', async () => {
    const props = appProps();
    mockPublish.mockRejectedValueOnce(new Error('Context denied'));
    await expect(props.onSendFollowUp('Discuss', state('first'))).rejects.toThrow('Context denied');
    expect(mockFollowUp).not.toHaveBeenCalled();
    await expect(props.onSendFollowUp('Retry', state('second'))).resolves.toBe(true);
    mockFollowUp.mockResolvedValueOnce({ isError: true });
    await expect(props.onSendFollowUp('Rejected', state('third'))).resolves.toBe(false);
  });
  test('both passive and action context respect the full UTF-8 payload limit', async () => {
    const props = appProps();
    const large = { ...state('Large view'), visibleRecords: Array.from({ length: 120 }, () => ({ detail: 'Evidence '.repeat(1000) })) };
    await props.onUpdateModelContext(large);
    await props.onSendFollowUp('Discuss the view', large);
    mockPublish.mock.calls.forEach(([payload]) => expect(modelContextBytes(payload)).toBeLessThanOrEqual(10000));
  });
});
