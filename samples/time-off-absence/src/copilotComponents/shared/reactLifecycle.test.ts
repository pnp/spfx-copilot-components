const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn<() => void, [() => void]>(() => mockUnsubscribe);

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = { domElement: document.createElement('div') };
    public properties = {};
    public hostContext = { displayMode: 'inline', theme: 'light' };
  }
}));
jest.mock('../timeOffOverview/data/createTimeOffDataService', () => ({
  createTimeOffDataService: jest.fn(async () => ({ subscribe: mockSubscribe }))
}));
jest.mock('../timeOffTeam/data/createTimeOffTeamDataService', () => ({
  createTimeOffTeamDataService: jest.fn(async () => ({ subscribe: mockSubscribe }))
}));
jest.mock('../timeOffRequest/logic/loadCalendarConflicts', () => ({
  loadCalendarConflicts: jest.fn()
}));
jest.mock('../timeOffOverview/ui/TimeOffApp', () => ({ TimeOffApp: 'overview' }));
jest.mock('../timeOffRequest/ui/TimeOffRequestApp', () => ({ TimeOffRequestApp: 'request' }));
jest.mock('../timeOffTeam/ui/TimeOffTeamApp', () => ({ TimeOffTeamApp: 'team' }));

import { createRoot } from 'react-dom/client';
import TimeOffOverviewCopilotComponent from '../timeOffOverview/TimeOffOverviewCopilotComponent';
import TimeOffRequestCopilotComponent from '../timeOffRequest/TimeOffRequestCopilotComponent';
import TimeOffTeamCopilotComponent from '../timeOffTeam/TimeOffTeamCopilotComponent';

class OverviewHost extends TimeOffOverviewCopilotComponent {
  public initializeForTest(): Promise<void> { return this.onInit(); }
  public renderForTest(): void { this.render(); }
  public disposeForTest(): void { this.onDispose(); }
}

class RequestHost extends TimeOffRequestCopilotComponent {
  public initializeForTest(): Promise<void> { return this.onInit(); }
  public renderForTest(): void { this.render(); }
  public disposeForTest(): void { this.onDispose(); }
}

class TeamHost extends TimeOffTeamCopilotComponent {
  public initializeForTest(): Promise<void> { return this.onInit(); }
  public renderForTest(): void { this.render(); }
  public disposeForTest(): void { this.onDispose(); }
}

const mockCreateRoot = jest.mocked(createRoot);

describe.each([
  ['overview', OverviewHost],
  ['request', RequestHost],
  ['team', TeamHost]
] as const)('%s React 18 lifecycle', (_name, Host) => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
  });

  test('reuses one root across host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new Host();
    host.renderForTest();
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });

  test('reuses the root for service notifications and unsubscribes on disposal', async () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new Host();
    await host.initializeForTest();
    host.renderForTest();
    mockSubscribe.mock.calls[0][0]();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
    host.disposeForTest();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(root.unmount).toHaveBeenCalledTimes(1);
    host.disposeForTest();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(root.unmount).toHaveBeenCalledTimes(1);
  });

  test('keeps independent roots for independent host instances', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    new Host().renderForTest();
    new Host().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });

  test('clears the root on disposal', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = new Host();
    host.renderForTest();
    host.disposeForTest();
    expect(root.unmount).toHaveBeenCalledTimes(1);
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('supports disposal before first render', () => {
    new Host().disposeForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled();
  });
});
