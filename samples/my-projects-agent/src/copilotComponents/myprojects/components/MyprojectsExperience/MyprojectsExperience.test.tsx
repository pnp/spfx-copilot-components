jest.mock('../Myprojects/Myprojects', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../PlannerProjectCreation/PlannerProjectCreation', () => ({
  PlannerProjectCreation: jest.fn(() => null),
}));

import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {
  ICreatePlannerProjectProperties,
  IMyprojectsExperienceProps,
  IMyprojectsProps,
  IPlannerProjectCreationProps,
} from '../../models';
import {
  restorePlannerCreationOpen,
  savePlannerCreationOpen,
  savePlannerSelection,
} from '../../utils/plannerSelection';
import Myprojects from '../Myprojects/Myprojects';
import { PlannerProjectCreation } from '../PlannerProjectCreation/PlannerProjectCreation';
import { MyprojectsExperience } from './MyprojectsExperience';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

function createStorageDocument(): Document {
  const values = new Map<string, string>();
  const sessionStorage = {
    getItem: (key: string): string | null => values.get(key) ?? null,
    removeItem: (key: string): void => {
      values.delete(key);
    },
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  } as Storage;

  return { defaultView: { sessionStorage } } as unknown as Document;
}

describe('Myprojects creation navigation', () => {
  const creation: ICreatePlannerProjectProperties = {
    operation: 'create',
    projectName: 'Original name',
    startDate: '2026-09-08',
    template: 'projectManagement',
  };
  let renderer: Root;
  let props: IMyprojectsExperienceProps;
  let requestDisplayMode: jest.Mock;

  async function renderExperience(): Promise<void> {
    jest.mocked(Myprojects).mockClear();
    jest.mocked(PlannerProjectCreation).mockClear();
    renderer = createRoot(document.createElement('div'));
    await act(async () => {
      renderer.render(<MyprojectsExperience {...props} />);
    });
  }

  async function updateExperience(): Promise<void> {
    jest.mocked(Myprojects).mockClear();
    jest.mocked(PlannerProjectCreation).mockClear();
    await act(async () => {
      renderer.render(<MyprojectsExperience {...props} />);
    });
  }

  function getProjectsProps(): IMyprojectsProps {
    const calls = jest.mocked(Myprojects).mock.calls;
    return calls[calls.length - 1][0] as IMyprojectsProps;
  }

  async function openCreatedProject(): Promise<void> {
    const calls = jest.mocked(PlannerProjectCreation).mock.calls;
    const creationProps = calls[calls.length - 1][0] as IPlannerProjectCreationProps;

    await act(async () => {
      await creationProps.onOpenProject('created-plan', 'Edited name');
    });
  }

  beforeEach(() => {
    requestDisplayMode = jest.fn().mockResolvedValue(undefined);
    props = {
      context: { instanceId: 'invocation-1', pageContext: {} } as IMyprojectsProps['context'],
      dateLocale: 'en-US',
      graphClientFactory: {} as IMyprojectsProps['graphClientFactory'],
      hostContext: {
        displayMode: 'inline',
        theme: 'light',
      } as IMyprojectsProps['hostContext'],
      onRequestDisplayMode: requestDisplayMode,
      onRequestSizeChange: jest.fn().mockResolvedValue(undefined),
      properties: creation,
      strings: {} as IMyprojectsProps['strings'],
      targetDocument: createStorageDocument(),
    };
  });

  afterEach(async () => {
    await act(async () => renderer?.unmount());
    jest.restoreAllMocks();
  });

  it('routes query properties directly to Myprojects', async () => {
    props.properties = { view: 'active', projectName: 'Existing project' };
    await renderExperience();

    expect(getProjectsProps().properties).toEqual(props.properties);
    expect(jest.mocked(Myprojects)).toHaveBeenCalled();
  });

  it('opens the created plan and saves its handoff before requesting fullscreen', async () => {
    let handoffAtRequest: ReturnType<typeof restorePlannerCreationOpen>;
    requestDisplayMode.mockImplementation(async () => {
      handoffAtRequest = restorePlannerCreationOpen(
        props.targetDocument, creation, props.context.instanceId
      );
    });
    await renderExperience();
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();

    await openCreatedProject();

    expect(handoffAtRequest).toEqual({
      projectId: 'created-plan',
      projectName: 'Edited name',
      query: { projectName: 'Edited name', view: 'all' },
    });
    expect(requestDisplayMode).toHaveBeenCalledWith('fullscreen');
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');
    expect(getProjectsProps().properties).toEqual({
      projectName: 'Edited name', view: 'all',
    });
    expect(jest.mocked(Myprojects)).toHaveBeenCalled();
  });

  it('returns to Myprojects inline after the expanded view close action', async () => {
    await renderExperience();
    await openCreatedProject();
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    await updateExperience();

    await act(async () => {
      await getProjectsProps().onRequestDisplayMode('inline');
    });
    props.hostContext = { ...props.hostContext, displayMode: 'inline' };
    await updateExperience();

    expect(requestDisplayMode).toHaveBeenLastCalledWith('inline');
    expect(getProjectsProps().hostContext.displayMode).toBe('inline');
    expect(jest.mocked(PlannerProjectCreation)).not.toHaveBeenCalled();
  });

  it('restores Myprojects inline after a delayed native host close and iframe replacement', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    await renderExperience();
    await openCreatedProject();
    await act(async () => renderer.unmount());
    const inlineContext = props.context;
    props = {
      ...props,
      context: { instanceId: 'fullscreen-instance', pageContext: {} } as IMyprojectsProps['context'],
      hostContext: { ...props.hostContext, displayMode: 'fullscreen' },
    };
    await renderExperience();
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');

    await act(async () => renderer.unmount());
    jest.spyOn(Date, 'now').mockReturnValue(3_601_000);
    props = {
      ...props,
      context: inlineContext,
      hostContext: { ...props.hostContext, displayMode: 'inline' },
    };
    await renderExperience();

    expect(getProjectsProps().hostContext.displayMode).toBe('inline');
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');
    expect(jest.mocked(PlannerProjectCreation)).not.toHaveBeenCalled();
  });

  it('restores an existing inline instance when another host instance opened the project', async () => {
    await renderExperience();
    savePlannerCreationOpen(
      props.targetDocument, creation, 'created-plan', 'Edited name', props.context.instanceId
    );

    props.hostContext = { ...props.hostContext, displayMode: 'inline' };
    await updateExperience();

    expect(getProjectsProps().hostContext.displayMode).toBe('inline');
    expect(jest.mocked(PlannerProjectCreation)).not.toHaveBeenCalled();
  });

  it('starts a separate creation flow when the tool request changes', async () => {
    await renderExperience();
    await openCreatedProject();
    props.properties = { ...creation, projectName: 'Different project' };
    await updateExperience();

    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });

  it('keeps Myprojects inline when the host rejects fullscreen', async () => {
    requestDisplayMode.mockRejectedValue(new Error('Fullscreen unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderExperience();

    await openCreatedProject();

    expect(getProjectsProps().hostContext.displayMode).toBe('inline');
    expect(jest.mocked(Myprojects)).toHaveBeenCalled();
  });

  it('shows creation after a query tool selected and expanded an existing plan', async () => {
    const query = { view: 'all' } as const;
    props.properties = query;
    await renderExperience();
    savePlannerSelection(props.targetDocument, query, 'previously-selected-plan');
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    await updateExperience();
    expect(getProjectsProps().hostContext.displayMode).toBe('fullscreen');

    props = {
      ...props,
      properties: { operation: 'create', projectName: '', startDate: '', template: 'basicPlan' },
    };
    await updateExperience();

    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });

  it('ignores an old unscoped handoff for the workbench blank creation payload', async () => {
    props.properties = {
      operation: 'create', projectName: '', startDate: '', template: 'basicPlan',
    };
    const legacyKey = `myprojects:created-project:${JSON.stringify([
      '', '', 'basicPlan', undefined,
    ])}`;
    props.targetDocument?.defaultView?.sessionStorage.setItem(
      legacyKey,
      JSON.stringify({ projectId: 'previous-plan', projectName: 'Previous plan' })
    );

    await renderExperience();

    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });

  it('starts a new creation for identical arguments on another component instance', async () => {
    await renderExperience();
    await openCreatedProject();
    props = {
      ...props,
      context: { instanceId: 'invocation-2', pageContext: {} } as IMyprojectsProps['context'],
    };

    await updateExperience();

    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });

  it('closes into a new inline iframe and consumes both display-mode transfers', async () => {
    await renderExperience();
    await openCreatedProject();
    await act(async () => renderer.unmount());
    props = {
      ...props,
      context: { instanceId: 'expanded-frame', pageContext: {} } as IMyprojectsProps['context'],
      hostContext: { ...props.hostContext, displayMode: 'fullscreen' },
    };
    await renderExperience();
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');

    await act(async () => {
      await getProjectsProps().onRequestDisplayMode('inline');
    });
    await act(async () => renderer.unmount());
    props = {
      ...props,
      context: { instanceId: 'replacement-inline-frame', pageContext: {} } as IMyprojectsProps['context'],
      hostContext: { ...props.hostContext, displayMode: 'inline' },
    };
    await renderExperience();
    expect(getProjectsProps().hostContext.displayMode).toBe('inline');
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');

    await act(async () => renderer.unmount());
    props = {
      ...props,
      context: { instanceId: 'fresh-creation', pageContext: {} } as IMyprojectsProps['context'],
    };
    await renderExperience();
    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
    props = { ...props, hostContext: { ...props.hostContext, displayMode: 'fullscreen' } };
    await updateExperience();
    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
  });

  it('does not leave a fullscreen transfer after the host rejects expansion', async () => {
    requestDisplayMode.mockRejectedValue(new Error('Denied'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderExperience();
    await openCreatedProject();
    await act(async () => renderer.unmount());
    props = {
      ...props,
      context: { instanceId: 'unrelated-fullscreen-frame', pageContext: {} } as IMyprojectsProps['context'],
      hostContext: { ...props.hostContext, displayMode: 'fullscreen' },
    };
    await renderExperience();
    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });

  it('does not revive an expired unclaimed expansion in a later creation', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    await renderExperience();
    await openCreatedProject();
    await act(async () => renderer.unmount());
    jest.spyOn(Date, 'now').mockReturnValue(31_001);
    props = {
      ...props,
      context: { instanceId: 'later-frame', pageContext: {} } as IMyprojectsProps['context'],
      hostContext: { ...props.hostContext, displayMode: 'fullscreen' },
    };
    await renderExperience();
    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
  });

  it('opens locally when already fullscreen without transferring to a later creation', async () => {
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };
    await renderExperience();
    await openCreatedProject();
    expect(getProjectsProps().initialSelectedProjectId).toBe('created-plan');
    expect(requestDisplayMode).not.toHaveBeenCalled();

    props = {
      ...props,
      context: { instanceId: 'next-fullscreen-creation', pageContext: {} } as IMyprojectsProps['context'],
    };
    await updateExperience();
    expect(jest.mocked(PlannerProjectCreation)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Myprojects)).not.toHaveBeenCalled();
  });
});