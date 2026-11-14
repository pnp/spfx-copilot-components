const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());
const mockUpdateContext=jest.fn<Promise<void>,[object]>(()=>Promise.resolve());
const mockDisplayMode=jest.fn(()=>Promise.resolve({mode:'fullscreen'}));

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: { user: { displayName: 'Megan Bowen' } },
      copilotBridge:{updateModelContextAsync:mockUpdateContext}
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
    protected requestDisplayModeAsync():Promise<{mode:string}>{return mockDisplayMode();}
  }
}));
jest.mock('./PremiumInnovationApp', () => ({ __esModule: true, default: 'service-app' }));
jest.mock('./InnovationThemeProvider', () => ({ __esModule: true, default: 'service-theme-provider' }));

import { createRoot } from 'react-dom/client';
import * as React from 'react';
import type { IVisibleState } from './InnovationContext';
import type { IInnovationProperties, InnovationIntentKey } from './catalog';
import InnovationCopilotComponentBase from './InnovationCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);

class TestComponent extends InnovationCopilotComponentBase<IInnovationProperties> {
  protected intentKey: InnovationIntentKey = 'SubmitInnovationIdea';
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

describe('InnovationCopilotComponentBase React root lifecycle', () => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
    mockUpdateContext.mockReset();mockUpdateContext.mockResolvedValue(undefined);
    mockDisplayMode.mockReset();mockDisplayMode.mockResolvedValue({mode:'fullscreen'});
  });

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
  test('awaits asynchronous framework teardown rather than acknowledging early',async()=>{
    let release=():void=>undefined;
    mockBaseTeardown.mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;}));
    let finished=false;
    const pending=new TestComponent().teardownForTest().then(()=>{finished=true;});
    await Promise.resolve();expect(finished).toBe(false);
    release();await pending;expect(finished).toBe(true);
  });
  test('publishes committed context and makes bridge errors visible without remounting',async()=>{
    const render=jest.fn<void,[React.ReactNode]>();
    mockCreateRoot.mockReturnValue({render,unmount:jest.fn()});
    const component=new TestComponent();component.renderForTest();
    const appProps=():{onVisibleState:(state:IVisibleState)=>void;hostError?:string}=>{
      const provider=render.mock.calls[render.mock.calls.length-1][0];
      if(!React.isValidElement<{children:React.ReactNode}>(provider)||!React.isValidElement<{onVisibleState:(state:IVisibleState)=>void;hostError?:string}>(provider.props.children))throw new Error('Expected themed app tree');
      return provider.props.children.props;
    };
    appProps().onVisibleState({intent:'ReviewIdeaGate',state:'no-match',detail:'IDEA-MISSING'});
    expect(mockUpdateContext).toHaveBeenCalledWith({structuredContent:{intent:'ReviewIdeaGate',state:'no-match',detail:'IDEA-MISSING',offline:true}});
    mockUpdateContext.mockRejectedValueOnce(new Error('Host context denied'));
    appProps().onVisibleState({intent:'SubmitInnovationIdea',state:'review',detail:'Visible reviewed draft'});
    await Promise.resolve();await Promise.resolve();
    expect(appProps().hostError).toBe('Host context denied');expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    await component.teardownForTest();
    appProps().onVisibleState({intent:'SubmitInnovationIdea',state:'receipt',detail:'Too late'});
    expect(mockUpdateContext).toHaveBeenCalledTimes(2);
  });
  test('reports an expansion denial rather than assuming success',async()=>{
    const render=jest.fn<void,[React.ReactNode]>();
    mockCreateRoot.mockReturnValue({render,unmount:jest.fn()});
    const component=new TestComponent();component.renderForTest();
    const provider=render.mock.calls[0][0];
    if(!React.isValidElement<{children:React.ReactNode}>(provider)||!React.isValidElement<{onRequestFullscreen:()=>void}>(provider.props.children))throw new Error('Expected themed app tree');
    mockDisplayMode.mockResolvedValueOnce({mode:'inline'});provider.props.children.props.onRequestFullscreen();
    await Promise.resolve();await Promise.resolve();
    const updated=render.mock.calls[render.mock.calls.length-1][0];
    if(!React.isValidElement<{children:React.ReactNode}>(updated)||!React.isValidElement<{hostError?:string}>(updated.props.children))throw new Error('Expected error tree');
    expect(updated.props.children.props.hostError).toContain('did not grant full screen');
  });
});
