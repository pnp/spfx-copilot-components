const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());

jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));
jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public context = {
      domElement: document.createElement('div'),
      pageContext: { user: { displayName: 'Megan Bowen' } }
    };
    public properties = {};
    public hostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'], theme: 'light' };
    protected onTeardown(reason: string | undefined): Promise<void> { return mockBaseTeardown(reason); }
  }
}));
jest.mock('../../getMyHrDashboard/components/HomeApp', () => ({ __esModule: true, default: 'home-app' }));
jest.mock('../../getMyHrDashboard/components/HomeThemeProvider', () => ({ __esModule: true, default: 'theme-provider' }));
jest.mock('../../getMyHrDashboard/components/ZavaDashboardShell', () => ({ __esModule: true, default: 'dashboard-shell' }));

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import HomeIntentCopilotComponentBase from '../../getMyHrDashboard/HomeIntentCopilotComponentBase';
import type { IResolvedHomeIntent } from '../../getMyHrDashboard/homeIntentTypes';
import { normalizeHomeProperties } from '../../getMyHrDashboard/normalizeHomeProperties';
import ZavaIntentCopilotComponentBase from './ZavaIntentCopilotComponentBase';
import type { IZavaResolvedIntent } from './ZavaIntentCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);

class HomeHost extends HomeIntentCopilotComponentBase<object> {
  protected resolveIntent(): IResolvedHomeIntent {
    return { view: 'summary', route: 'home/summary', properties: normalizeHomeProperties({}), params: {} };
  }
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

class FamilyHost extends ZavaIntentCopilotComponentBase<object, IZavaResolvedIntent> {
  protected resolveIntent(): IZavaResolvedIntent { return { family: 'time', route: 'time/balance', params: {} }; }
  protected renderInline(): React.ReactElement { return <div>Leave balance</div>; }
  public renderForTest(): void { this.render(); }
  public teardownForTest(): Promise<void> { return this.onTeardown('test'); }
}

describe.each([['Home', () => new HomeHost()], ['Family', () => new FamilyHost()]] as const)('%s host root lifecycle', (_name, createHost) => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
  });

  test('reuses one root across passive host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const host = createHost();
    host.renderForTest();
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
  });

  test('keeps independent component roots', () => {
    mockCreateRoot.mockImplementation(() => ({ render: jest.fn(), unmount: jest.fn() }));
    createHost().renderForTest();
    createHost().renderForTest();
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
  });

  test('unmounts before base cleanup and clears the disposed root', async () => {
    const order: string[] = [];
    mockCreateRoot.mockReturnValue({ render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) });
    mockBaseTeardown.mockImplementationOnce(() => { order.push('base'); return Promise.resolve(); });
    const host = createHost();
    host.renderForTest();
    await host.teardownForTest();
    expect(order).toEqual(['unmount', 'base']);
    host.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
  });

  test('allows teardown before first render', async () => {
    await createHost().teardownForTest();
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });
});
