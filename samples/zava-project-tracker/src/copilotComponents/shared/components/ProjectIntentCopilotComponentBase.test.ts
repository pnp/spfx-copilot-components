const mockBaseTeardown = jest.fn<Promise<void>, [string | undefined]>(() => Promise.resolve());

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn()
}));

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

jest.mock('./ProjectIntentApp', () => ({
  __esModule: true,
  default: 'project-intent-app'
}));

jest.mock('./ProjectThemeProvider', () => ({
  __esModule: true,
  default: 'project-theme-provider'
}));

import { createRoot } from 'react-dom/client';

import type { IProjectIntentProperties } from '../models/projectPortfolio';
import ProjectIntentCopilotComponentBase from './ProjectIntentCopilotComponentBase';

const mockCreateRoot = jest.mocked(createRoot);

class TestComponent extends ProjectIntentCopilotComponentBase<IProjectIntentProperties> {
  protected intentKey = 'GetMyWorkSummary';

  public renderForTest(): void {
    this.render();
  }

  public teardownForTest(): Promise<void> {
    return this.onTeardown('test');
  }
}

describe('ProjectIntentCopilotComponentBase React root lifecycle', () => {
  beforeEach(() => {
    mockCreateRoot.mockReset();
    mockBaseTeardown.mockClear();
  });

  test('reuses one root across repeated host renders', () => {
    const root = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValue(root);
    const component = new TestComponent();

    component.renderForTest();
    component.renderForTest();

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(root.render).toHaveBeenCalledTimes(2);
    expect(root.unmount).not.toHaveBeenCalled();
  });

  test('keeps component instances in independent roots', () => {
    const firstRoot = { render: jest.fn(), unmount: jest.fn() };
    const secondRoot = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValueOnce(firstRoot).mockReturnValueOnce(secondRoot);

    new TestComponent().renderForTest();
    new TestComponent().renderForTest();

    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    expect(mockCreateRoot.mock.calls[0][0]).not.toBe(mockCreateRoot.mock.calls[1][0]);
    expect(firstRoot.render).toHaveBeenCalledTimes(1);
    expect(secondRoot.render).toHaveBeenCalledTimes(1);
  });

  test('unmounts before base teardown and clears the disposed root', async () => {
    const order: string[] = [];
    const firstRoot = { render: jest.fn(), unmount: jest.fn(() => { order.push('unmount'); }) };
    const secondRoot = { render: jest.fn(), unmount: jest.fn() };
    mockCreateRoot.mockReturnValueOnce(firstRoot).mockReturnValueOnce(secondRoot);
    mockBaseTeardown.mockImplementationOnce(() => {
      order.push('base teardown');
      return Promise.resolve();
    });
    const component = new TestComponent();
    component.renderForTest();

    await component.teardownForTest();
    expect(order).toEqual(['unmount', 'base teardown']);
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');

    component.renderForTest();
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    expect(firstRoot.render).toHaveBeenCalledTimes(1);
    expect(firstRoot.unmount).toHaveBeenCalledTimes(1);
    expect(secondRoot.render).toHaveBeenCalledTimes(1);
  });

  test('allows teardown before the first render', async () => {
    await new TestComponent().teardownForTest();

    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockBaseTeardown).toHaveBeenCalledWith('test');
  });
});
