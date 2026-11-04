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
    protected requestSizeChangeAsync(width: number, height: number): Promise<boolean> { return mockSizeChange(width, height); }
  }
}));
jest.mock('./ProcurementApp', () => ({ __esModule: true, default: 'service-app' }));
jest.mock('./ProcurementThemeProvider', () => ({ __esModule: true, default: 'service-theme-provider' }));

import { createRoot } from 'react-dom/client';
import * as React from 'react';
import type { ISPCopilotModelContext } from '@microsoft/sp-copilot-component';
import type { IProcurementAppProps } from './ProcurementApp';
import type { IProcurementSnapshot } from './modelContext';
import type { IProcurementProperties, ProcurementIntentKey } from './catalog';
import ProcurementCopilotComponentBase from './ProcurementCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);
const components: TestComponent[] = [];
const optionalResizeWindow: { ResizeObserver?: typeof ResizeObserver } = window;

class TestComponent extends ProcurementCopilotComponentBase<IProcurementProperties> {
  protected intentKey: ProcurementIntentKey = 'CreatePurchaseIntent';
  public constructor() { super(); components.push(this); }
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
  public disposeForTest(): void { this.onDispose(); }
  public get element(): HTMLElement { return this.context.domElement; }
  public setMode(mode: 'inline' | 'fullscreen'): void { this.hostContext = { ...this.hostContext, displayMode: mode }; }
}

describe('ProcurementCopilotComponentBase React root lifecycle', () => {
  const frames = new Map<number, FrameRequestCallback>();
  const observers: { callback: ResizeObserverCallback; observer: ResizeObserver }[] = [];
  const descriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
  let nextFrame = 0;
  beforeEach(() => {
    components.length = 0;
    frames.clear();
    observers.length = 0;
    nextFrame = 0;
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
    mockBaseDispose.mockClear();
    mockSizeChange.mockReset().mockResolvedValue(true);
    mockPublish.mockReset().mockResolvedValue(undefined);
    mockFollowUp.mockReset().mockResolvedValue({});
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { const id = nextFrame++; frames.set(id, callback); return id; });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
      const observer: ResizeObserver = { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
      observers.push({ callback, observer });
      return observer;
    }) });
  });
  afterEach(async () => {
    for (const component of components) await component.teardownForTest();
    jest.restoreAllMocks();
    if (descriptor) Object.defineProperty(window, 'ResizeObserver', descriptor);
    else delete optionalResizeWindow.ResizeObserver;
  });
  const flush = async (): Promise<void> => {
    const callbacks = Array.from(frames.values());
    frames.clear();
    callbacks.forEach(callback => callback(0));
    await Promise.resolve();
  };
  function fixture(): { component: TestComponent; props: IProcurementAppProps } {
    const render = jest.fn<void, [React.ReactNode]>();
    mockCreateRoot.mockReturnValue({ render, unmount: jest.fn() });
    const component = new TestComponent();
    component.renderForTest();
    const theme = render.mock.calls[0][0];
    if (!React.isValidElement<React.PropsWithChildren>(theme) || !React.isValidElement<IProcurementAppProps>(theme.props.children)) throw new Error('Missing rendered app.');
    return { component, props: theme.props.children.props };
  }
  function content(component: TestComponent, width: number, height: number): { element: HTMLElement; measure: jest.SpyInstance<DOMRect, []> } {
    const element = document.createElement('div');
    element.dataset.procurementContent = '';
    const measure = jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, width, height));
    component.element.appendChild(element);
    return { element, measure };
  }
  const snapshot = (selectedId: string): IProcurementSnapshot => ({ intent: 'CreatePurchaseIntent', route: 'my-requests/new', stage: 'draft', selectedId, summary: 'Visible field presence and validation only.' });

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

  test('measures the committed content root, coalesces redraws and grows/shrinks/grows', async () => {
    const { component } = fixture();
    const root = content(component, 740.2, 650.2);
    Object.defineProperty(component.element, 'scrollHeight', { value: 3000 });
    component.renderForTest();
    component.renderForTest();
    expect(frames.size).toBe(1);
    await flush();
    expect(mockSizeChange).toHaveBeenLastCalledWith(741, 651);
    component.renderForTest();
    await flush();
    expect(mockSizeChange).toHaveBeenCalledTimes(1);
    root.measure.mockReturnValue(new DOMRect(0, 0, 740, 330));
    observers[0].callback([], observers[0].observer);
    await flush();
    expect(mockSizeChange).toHaveBeenLastCalledWith(740, 330);
    root.measure.mockReturnValue(new DOMRect(0, 0, 740, 720));
    observers[0].callback([], observers[0].observer);
    await flush();
    expect(mockSizeChange).toHaveBeenLastCalledWith(740, 720);
  });
  test('reattaches a replaced root, reports a mode change, and supports missing ResizeObserver', async () => {
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: undefined });
    const { component } = fixture();
    const first = content(component, 740, 400);
    await flush();
    first.element.remove();
    content(component, 980, 600);
    component.setMode('fullscreen');
    component.renderForTest();
    await flush();
    expect(mockSizeChange.mock.calls).toEqual([[740, 400], [980, 600]]);
  });
  test('does not cache a declined/failed resize as accepted and allows a later retry', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSizeChange.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('Host unavailable'));
    const { component } = fixture();
    content(component, 740, 500);
    await flush();
    expect(warning).toHaveBeenCalled();
    component.renderForTest();
    await flush();
    expect(error).toHaveBeenCalled();
    component.renderForTest();
    await flush();
    expect(mockSizeChange).toHaveBeenCalledTimes(3);
  });
  test('disconnects observers and cancels frames on disposal before unmounting', async () => {
    const { component } = fixture();
    content(component, 740, 500);
    component.disposeForTest();
    expect(frames.size).toBe(0);
    expect(observers[0].observer.disconnect).toHaveBeenCalled();
    expect(mockBaseDispose).toHaveBeenCalledTimes(1);
    await flush();
    expect(mockSizeChange).not.toHaveBeenCalled();
  });
  test('publishes the captured click context and follow-up atomically between passive updates', async () => {
    const { props } = fixture();
    const sequence: string[] = [];
    let release: (() => void) | undefined;
    mockPublish.mockImplementationOnce(context => {
      sequence.push(String(context.structuredContent?.selectedId));
      return new Promise<void>(resolve => { release = resolve; });
    }).mockImplementation(context => { sequence.push(String(context.structuredContent?.selectedId)); return Promise.resolve(); });
    mockFollowUp.mockImplementation(() => { sequence.push('message'); return Promise.resolve({}); });
    const first = props.onUpdateModelContext?.(snapshot('initial'));
    const click = props.onSendFollowUp?.('Question about this draft', snapshot('clicked'));
    const later = props.onUpdateModelContext?.(snapshot('later'));
    await Promise.resolve();
    expect(sequence).toEqual(['initial']);
    if (!release) throw new Error('Missing bridge release.');
    release();
    await Promise.all([first, click, later]);
    expect(sequence).toEqual(['initial', 'clicked', 'message', 'later']);
    expect(mockFollowUp).toHaveBeenCalledWith([{ type: 'text', text: 'Question about this draft' }]);
  });
  test('blocks the follow-up on context failure, recovers the queue, and reports isError', async () => {
    const { props } = fixture();
    mockPublish.mockRejectedValueOnce(new Error('Context denied'));
    await expect(props.onSendFollowUp?.('Do not send without context', snapshot('clicked'))).rejects.toThrow('Context denied');
    expect(mockFollowUp).not.toHaveBeenCalled();
    mockFollowUp.mockResolvedValueOnce({ isError: true });
    await expect(props.onSendFollowUp?.('Retry with context', snapshot('retry'))).resolves.toBe(false);
    await expect(props.onSendFollowUp?.('Accepted retry', snapshot('retry'))).resolves.toBe(true);
  });
  test('never sends a queued or in-flight question after the component closes', async () => {
    const { component, props } = fixture();
    let release: (() => void) | undefined;
    mockPublish.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
    const send = props.onSendFollowUp?.('Question for this visible component', snapshot('clicked'));
    const failure = expect(send).rejects.toThrow('closed');
    await Promise.resolve();
    await component.teardownForTest();
    if (!release) throw new Error('Missing bridge release.');
    release();
    await failure;
    expect(mockFollowUp).not.toHaveBeenCalled();
  });
});
