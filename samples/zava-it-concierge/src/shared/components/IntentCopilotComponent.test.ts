const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());
jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: { user: { displayName: 'Megan Bowen' } }
    };
    public properties = {};
    public hostContext = { displayMode: 'inline', theme: 'light' };
    protected onTeardown(reason: string | undefined): Promise<void> { return mockBaseTeardown(reason); }
  }
}));
jest.mock('../ui/IntentCanvasApp', () => ({ IntentCanvasApp: 'intent-app' }));

import { createRoot } from 'react-dom/client';
import { IntentCopilotComponent } from './IntentCopilotComponent';

const mockCreateRoot = jest.mocked(createRoot);
class TestHost extends IntentCopilotComponent<object> {
  protected readonly intentName = 'MyDeviceStatus';
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

describe('IntentCopilotComponent React 18 lifecycle', () => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
  });
  test('reuses one root across repeated renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new TestHost();
    host.renderForTest();
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });
  test('keeps independent component roots', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new TestHost().renderForTest();
    new TestHost().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });
  test('unmounts before framework teardown and clears the root', async () => {
    const order: string[] = [];
    mockCreateRoot.mockReturnValue({ render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) });
    mockBaseTeardown.mockImplementationOnce(() => { order.push('base'); return Promise.resolve(); });
    const host = new TestHost();
    host.renderForTest();
    await host.teardownForTest();
    expect(order).toEqual(['unmount', 'base']);
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });
  test('allows teardown before the first render', async () => {
    await new TestHost().teardownForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });
});
