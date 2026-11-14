const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = { domElement: document.createElement('div'), copilotBridge: {} };
    public properties = {};
    public hostContext = { displayMode: 'inline', theme: 'light' };
    protected onTeardown(reason: string | undefined): Promise<void> {
      return mockBaseTeardown(reason);
    }
  }
}));
jest.mock('@microsoft/sp-http', () => ({
  SPHttpClient: { configurations: { v1: {} } }
}));
jest.mock('./components/ExecDashboard', () => ({ __esModule: true, default: 'dashboard' }));
jest.mock('./services/CurrentUserService', () => ({
  getGraphCurrentUser: jest.fn(),
  getMockCurrentUser: jest.fn()
}));
jest.mock('ExecDashboardCopilotComponentStrings', () => ({}), { virtual: true });

import { createRoot } from 'react-dom/client';
import ExecDashboardCopilotComponent from './ExecDashboardCopilotComponent';

class TestHost extends ExecDashboardCopilotComponent {
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

const mockCreateRoot = jest.mocked(createRoot);

describe('Executive dashboard React 18 lifecycle', () => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
  });

  test('reuses one root across host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new TestHost();
    host.renderForTest();
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });

  test('keeps independent roots for independent host instances', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new TestHost().renderForTest();
    new TestHost().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });

  test('unmounts before base cleanup and clears the root', async () => {
    const order: string[] = [];
    mockCreateRoot.mockReturnValue({
      render: jest.fn(),
      unmount: jest.fn(() => { order.push('unmount'); })
    });
    mockBaseTeardown.mockImplementationOnce(() => {
      order.push('base');
      return Promise.resolve();
    });
    const host = new TestHost();
    host.renderForTest();
    await host.teardownForTest();
    expect(order).toEqual(['unmount', 'base']);
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('supports teardown before first render', async () => {
    await new TestHost().teardownForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });
});
