const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: { user: { displayName: 'Megan Bowen' } }
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
  }
}));
jest.mock('./ServiceApp', () => ({ __esModule: true, default: 'service-app' }));
jest.mock('./ServiceThemeProvider', () => ({ __esModule: true, default: 'service-theme-provider' }));

import { createRoot } from 'react-dom/client';
import type { IServiceProperties, ServiceIntentKey } from './catalog';
import ServiceCopilotComponentBase from './ServiceCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);

class TestComponent extends ServiceCopilotComponentBase<IServiceProperties> {
  protected intentKey: ServiceIntentKey = 'TriageCustomerIssue';
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

describe('ServiceCopilotComponentBase React root lifecycle', () => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
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
});
