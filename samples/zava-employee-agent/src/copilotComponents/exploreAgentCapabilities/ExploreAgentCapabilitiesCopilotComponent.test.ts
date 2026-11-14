const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());
jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = { domElement: document.createElement('div') };
    public properties = {};
    public hostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'], theme: 'light' };
    protected onTeardown(reason: string | undefined): Promise<void> { return mockBaseTeardown(reason); }
  }
}));
jest.mock('../getMyHrDashboard/components/HomeThemeProvider', () => ({ __esModule: true, default: 'theme-provider' }));
jest.mock('./components/EmployeeCapabilityExplorer', () => ({ __esModule: true, default: 'employee-explorer' }));
import { createRoot } from 'react-dom/client';
import ExploreAgentCapabilitiesCopilotComponent from './ExploreAgentCapabilitiesCopilotComponent';
const mockCreateRoot = jest.mocked(createRoot);
class TestHost extends ExploreAgentCapabilitiesCopilotComponent {
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}
describe('employee explorer root lifecycle', () => {
  beforeEach(() => { mockCreateRoot.mockReset(); mockBaseTeardown.mockClear(); });
  test('reuses a persistent root', () => {
    const root = { render: jest.fn(), unmount: jest.fn() }; mockCreateRoot.mockReturnValue(root);
    const host = new TestHost(); host.renderForTest(); host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1); expect(root.render).toHaveBeenCalledTimes(2);
  });
  test('keeps independent instances', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new TestHost().renderForTest(); new TestHost().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });
  test('unmounts before base teardown and clears the disposed root', async () => {
    const order: string[] = [];
    mockCreateRoot.mockReturnValue({ render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) });
    mockBaseTeardown.mockImplementationOnce(() => { order.push('base'); return Promise.resolve(); });
    const host = new TestHost(); host.renderForTest(); await host.teardownForTest();
    expect(order).toEqual(['unmount', 'base']);
    host.renderForTest(); expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });
  test('allows teardown before first render', async () => {
    await new TestHost().teardownForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled(); expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });
});
