import type {
  ICreatePlannerProjectProperties,
  IMyprojectsCopilotComponentProperties,
  IPlannerProjectSummary,
} from '../models';
import {
  clearPlannerSelection,
  preparePlannerCreationTransfer,
  readPlannerCreationTransfer,
  restorePlannerCreationOpen,
  restorePlannerSelection,
  savePlannerCreationOpen,
  savePlannerSelection,
  selectPlannerProject,
} from './plannerSelection';

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

function createProject(id: string): IPlannerProjectSummary {
  return {
    activeTasks: 0,
    assignedToMeTasks: 0,
    completedTasks: 0,
    id,
    onHoldTaskIds: [],
    onHoldTasks: 0,
    overdueTasks: 0,
    owner: 'group-1',
    tasks: [],
    title: id,
    totalTasks: 0,
    urgentTasks: 0,
  };
}

describe('Planner selection handoff', () => {
  const query: IMyprojectsCopilotComponentProperties = { view: 'all' };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores the clicked project for the matching query', () => {
    const targetDocument = createStorageDocument();

    savePlannerSelection(targetDocument, query, 'plan-2');

    expect(restorePlannerSelection(targetDocument, query)).toBe('plan-2');

    clearPlannerSelection(targetDocument, query);
    expect(restorePlannerSelection(targetDocument, query)).toBeUndefined();
  });

  it('does not restore selections from another query or an expired handoff', () => {
    const targetDocument = createStorageDocument();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    savePlannerSelection(targetDocument, query, 'plan-2');

    expect(
      restorePlannerSelection(targetDocument, {
        projectName: 'Another project',
        view: 'all',
      })
    ).toBeUndefined();

    jest.spyOn(Date, 'now').mockReturnValue(31_001);
    expect(
      restorePlannerSelection(targetDocument, query)
    ).toBeUndefined();
  });
});

describe('Planner creation open handoff', () => {
  const creation: ICreatePlannerProjectProperties = {
    operation: 'create',
    projectName: 'Original project name',
    startDate: '2026-09-08',
    template: 'projectManagement',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores the exact created plan and its edited project name', () => {
    const targetDocument = createStorageDocument();

    savePlannerCreationOpen(
      targetDocument,
      creation,
      'created-plan-id',
      'Edited project name',
      'invocation-1'
    );

    expect(restorePlannerCreationOpen(targetDocument, creation, 'invocation-1')).toEqual({
      projectId: 'created-plan-id',
      projectName: 'Edited project name',
      query: {
        projectName: 'Edited project name',
        view: 'all',
      },
    });
    expect(
      restorePlannerCreationOpen(targetDocument, {
        ...creation,
        startDate: '2026-09-09',
      }, 'invocation-1')
    ).toBeUndefined();
  });

  it('keeps the created project when fullscreen closes after the selection TTL', () => {
    const targetDocument = createStorageDocument();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    savePlannerCreationOpen(
      targetDocument,
      creation,
      'created-plan-id',
      'Created project',
      'invocation-1'
    );

    jest.spyOn(Date, 'now').mockReturnValue(3_601_000);
    expect(
      restorePlannerCreationOpen(targetDocument, creation, 'invocation-1')
    ).toEqual({
      projectId: 'created-plan-id',
      projectName: 'Created project',
      query: { projectName: 'Created project', view: 'all' },
    });
  });
});

describe('Planner creation display-mode transfer', () => {
  const creation: ICreatePlannerProjectProperties = {
    operation: 'create', projectName: '', startDate: '', template: 'basicPlan',
  };
  const project = {
    projectId: 'created-plan',
    projectName: 'Edited project',
    query: { projectName: 'Edited project', view: 'all' as const },
  };

  afterEach(() => jest.restoreAllMocks());

  it('accepts only the requested display mode and matching creation arguments', () => {
    const targetDocument = createStorageDocument();
    preparePlannerCreationTransfer(targetDocument, creation, project, 'fullscreen');

    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'inline')).toBeUndefined();
    expect(readPlannerCreationTransfer(
      targetDocument, { ...creation, projectName: 'Different' }, 'new-frame', 'fullscreen'
    )).toBeUndefined();
    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'fullscreen')?.project).toEqual(project);
  });

  it('consumes a transfer once and keeps restoration scoped to its recipient', () => {
    const targetDocument = createStorageDocument();
    preparePlannerCreationTransfer(targetDocument, creation, project, 'fullscreen');
    const transfer = readPlannerCreationTransfer(targetDocument, creation, 'expanded-frame', 'fullscreen');
    expect(transfer).toBeDefined();
    transfer?.accept();

    expect(readPlannerCreationTransfer(targetDocument, creation, 'another-frame', 'fullscreen')).toBeUndefined();
    expect(restorePlannerCreationOpen(targetDocument, creation, 'expanded-frame')).toEqual(project);
    expect(restorePlannerCreationOpen(targetDocument, creation, 'another-frame')).toBeUndefined();
  });

  it('expires an unclaimed transfer', () => {
    const targetDocument = createStorageDocument();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    preparePlannerCreationTransfer(targetDocument, creation, project, 'fullscreen');
    jest.spyOn(Date, 'now').mockReturnValue(31_001);

    expect(readPlannerCreationTransfer(targetDocument, creation, 'later-frame', 'fullscreen')).toBeUndefined();
  });

  it('cancels a rejected request without deleting a newer transfer', () => {
    const targetDocument = createStorageDocument();
    const cancelFirst = preparePlannerCreationTransfer(targetDocument, creation, project, 'fullscreen');
    const newerProject = { ...project, projectId: 'newer-plan' };
    const cancelSecond = preparePlannerCreationTransfer(targetDocument, creation, newerProject, 'fullscreen');
    cancelFirst();

    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'fullscreen')?.project.projectId).toBe('newer-plan');
    cancelSecond();
    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'fullscreen')).toBeUndefined();
  });

  it('ignores malformed transfer data', () => {
    const targetDocument = createStorageDocument();
    jest.spyOn(targetDocument.defaultView!.sessionStorage, 'getItem').mockReturnValue('{broken');
    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'fullscreen')).toBeUndefined();
  });

  it('tolerates a host that denies session storage access', () => {
    const targetDocument = createStorageDocument();
    Object.defineProperty(targetDocument.defaultView, 'sessionStorage', {
      get: () => { throw new Error('Storage denied'); },
    });
    expect(() => preparePlannerCreationTransfer(targetDocument, creation, project, 'fullscreen')()).not.toThrow();
    expect(readPlannerCreationTransfer(targetDocument, creation, 'new-frame', 'fullscreen')).toBeUndefined();
  });
});

describe('selectPlannerProject', () => {
  const firstProject = createProject('plan-1');
  const clickedProject = createProject('plan-2');
  const projects = [firstProject, clickedProject];

  it('selects the restored project instead of the first project', () => {
    expect(selectPlannerProject(projects, 'plan-2', true)).toBe(
      clickedProject
    );
  });

  it('does not fall back to the first project while an id is pending', () => {
    expect(
      selectPlannerProject(projects, 'not-loaded', true)
    ).toBeUndefined();
    expect(selectPlannerProject(projects, undefined, true)).toBe(firstProject);
  });
});