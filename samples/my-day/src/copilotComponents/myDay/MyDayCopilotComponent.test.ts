const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());
jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: {
        web: { absoluteUrl: 'https://example.sharepoint.com' },
        user: { displayName: 'Megan Bowen', email: 'megan@example.test', loginName: 'megan' }
      }
    };
    public properties = {};
    public hostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'], theme: 'light' };
    protected onTeardown(reason: string | undefined): Promise<void> { return mockBaseTeardown(reason); }
  },
  createCopilotTextContent: jest.fn()
}));
jest.mock('./components/MyDayApp', () => ({ __esModule: true, default: 'my-day-app' }));

import { createRoot } from 'react-dom/client';
import MyDayCopilotComponent from './MyDayCopilotComponent';

const mockCreateRoot = jest.mocked(createRoot);
class TestHost extends MyDayCopilotComponent {
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}
describe('MyDayCopilotComponent React 18 lifecycle', () => {
  beforeEach(() => { mockCreateRoot.mockReset(); mockBaseTeardown.mockClear(); });
  test('reuses one root across passive host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new TestHost();
    host.renderForTest(); host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });
  test('keeps independent host roots', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new TestHost().renderForTest(); new TestHost().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });
  test('unmounts before base cleanup and clears the root', async () => {
    const order: string[] = [];
    mockCreateRoot.mockReturnValue({ render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) });
    mockBaseTeardown.mockImplementationOnce(() => { order.push('base'); return Promise.resolve(); });
    const host = new TestHost(); host.renderForTest();
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
