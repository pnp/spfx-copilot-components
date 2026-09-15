jest.mock('@fluentui/react-components', () => ({
  PortalMountNodeProvider: ({ children }: { children: React.ReactNode }) => children,
  webDarkTheme: {},
  webLightTheme: {},
}));
jest.mock('@spteck/react-controls-v2/fluent-ui-provider', () => ({
  FluentUIProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@spteck/react-controls-v2/stack-v2', () => ({
  StackV2: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../hooks/usePlannerProjects', () => ({ usePlannerProjects: jest.fn() }));
jest.mock('../../hooks/useInlineCopilotContentSize', () => ({
  useInlineCopilotContentSize: () => ({ current: null }),
}));
jest.mock('../../hooks/useLockDocumentViewport', () => ({ useLockDocumentViewport: jest.fn() }));
jest.mock('../../hooks/usePlannerScrollAreaHeight', () => ({
  usePlannerScrollAreaHeight: () => '600px',
}));
jest.mock('./useMyprojectsStyles', () => ({ useMyprojectsStyles: () => ({ root: '' }) }));
jest.mock('../PlannerExpandedView/PlannerExpandedView', () => ({
  PlannerExpandedView: jest.fn(() => null),
}));
jest.mock('../PlannerInlineView/PlannerInlineView', () => ({
  PlannerInlineView: jest.fn(() => null),
}));

import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePlannerProjects } from '../../hooks/usePlannerProjects';
import type {
  IMyprojectsProps,
  IPlannerExpandedViewProps,
  IPlannerInlineViewProps,
  IPlannerProjectSummary,
} from '../../models';
import { PlannerExpandedView } from '../PlannerExpandedView/PlannerExpandedView';
import { PlannerInlineView } from '../PlannerInlineView/PlannerInlineView';
import Myprojects from './Myprojects';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

function createProject(id: string): IPlannerProjectSummary {
  return {
    activeTasks: 0, assignedToMeTasks: 0, completedTasks: 0, id,
    onHoldTaskIds: [], onHoldTasks: 0, overdueTasks: 0, owner: 'group-1',
    tasks: [], title: id, totalTasks: 0, urgentTasks: 0,
  };
}

describe('Myprojects real view selection', () => {
  const firstPlan = createProject('first-plan');
  const createdPlan = createProject('created-plan');
  let renderer: Root;
  let props: IMyprojectsProps;

  async function renderProjects(): Promise<void> {
    jest.mocked(PlannerInlineView).mockClear();
    jest.mocked(PlannerExpandedView).mockClear();
    renderer = createRoot(document.createElement('div'));
    await act(async () => {
      renderer.render(<Myprojects {...props} />);
    });
  }

  async function updateProjects(): Promise<void> {
    jest.mocked(PlannerInlineView).mockClear();
    jest.mocked(PlannerExpandedView).mockClear();
    await act(async () => renderer.render(<Myprojects {...props} />));
  }

  function inlineProps(): IPlannerInlineViewProps {
    const calls = jest.mocked(PlannerInlineView).mock.calls;
    return calls[calls.length - 1][0] as IPlannerInlineViewProps;
  }

  function expandedProps(): IPlannerExpandedViewProps {
    const calls = jest.mocked(PlannerExpandedView).mock.calls;
    return calls[calls.length - 1][0] as IPlannerExpandedViewProps;
  }

  beforeEach(() => {
    jest.mocked(usePlannerProjects).mockReturnValue({
      error: undefined,
      hasAnyProjects: true,
      isLoading: false,
      projects: [firstPlan, createdPlan],
      refresh: jest.fn(),
    });
    props = {
      context: { pageContext: {} } as IMyprojectsProps['context'],
      dateLocale: 'en-US',
      graphClientFactory: {} as IMyprojectsProps['graphClientFactory'],
      hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] },
      onRequestDisplayMode: jest.fn().mockResolvedValue(undefined),
      onRequestSizeChange: jest.fn().mockResolvedValue(undefined),
      properties: { view: 'all' },
      strings: {} as IMyprojectsProps['strings'],
      targetDocument: undefined,
    };
  });

  afterEach(async () => {
    await act(async () => renderer?.unmount());
    jest.restoreAllMocks();
  });

  it('renders the inline list even when a created project is selected', async () => {
    props.initialSelectedProjectId = createdPlan.id;
    await renderProjects();
    expect(inlineProps().projects).toEqual([firstPlan, createdPlan]);
    expect(jest.mocked(PlannerExpandedView)).not.toHaveBeenCalled();
  });

  it('renders the exact created plan in fullscreen, never the first plan', async () => {
    props.initialSelectedProjectId = createdPlan.id;
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    await renderProjects();
    expect(expandedProps().project.id).toBe(createdPlan.id);
    expect(jest.mocked(PlannerInlineView)).not.toHaveBeenCalled();
  });

  it('expands the clicked plan and returns to the real inline view on close', async () => {
    await renderProjects();
    await act(async () => inlineProps().onOpen(createdPlan));
    expect(props.onRequestDisplayMode).toHaveBeenCalledWith('fullscreen');
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    await updateProjects();
    expect(expandedProps().project.id).toBe(createdPlan.id);

    await act(async () => expandedProps().onCompact());
    expect(props.onRequestDisplayMode).toHaveBeenLastCalledWith('inline');
    props.hostContext = { ...props.hostContext, displayMode: 'inline' };
    await updateProjects();
    expect(jest.mocked(PlannerInlineView)).toHaveBeenCalled();
    expect(jest.mocked(PlannerExpandedView)).not.toHaveBeenCalled();
  });

  it('waits for the created plan to load instead of displaying an unrelated plan', async () => {
    props.initialSelectedProjectId = createdPlan.id;
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    const loadedResult: ReturnType<typeof usePlannerProjects> = {
      error: undefined,
      hasAnyProjects: true,
      isLoading: false,
      projects: [firstPlan, createdPlan],
      refresh: jest.fn(),
    };
    jest.mocked(usePlannerProjects).mockReturnValue({
      ...loadedResult, isLoading: true, projects: [firstPlan],
    });
    await renderProjects();
    expect(inlineProps().isLoading).toBe(true);
    expect(jest.mocked(PlannerExpandedView)).not.toHaveBeenCalled();

    jest.mocked(usePlannerProjects).mockReturnValue(loadedResult);
    await updateProjects();
    expect(expandedProps().project.id).toBe(createdPlan.id);
  });

  it('does not request fullscreen when the host supports inline only', async () => {
    props.hostContext = { displayMode: 'inline', availableDisplayModes: ['inline'] };
    await renderProjects();
    await act(async () => inlineProps().onOpen(createdPlan));
    expect(props.onRequestDisplayMode).not.toHaveBeenCalled();
    expect(jest.mocked(PlannerInlineView)).toHaveBeenCalled();
  });
});