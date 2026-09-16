import type {
  IPlannerProjectData,
  IPlannerProjectSummary,
} from '../models';
import {
  filterPlannerProjects,
  summarizePlannerProject,
} from './plannerProjects';

const NOW = Date.parse('2026-09-04T12:00:00Z');

function createProject(): IPlannerProjectData {
  return {
    plan: {
      createdDateTime: '2026-08-01T09:00:00Z',
      id: 'plan-1',
      owner: 'group-1',
      title: 'Website redesign',
    },
    buckets: [
      { id: 'active', name: 'In progress', planId: 'plan-1' },
      { id: 'hold', name: 'On hold', planId: 'plan-1' },
    ],
    tasks: [
      {
        assignedToCurrentUser: true,
        assignmentDateTimes: ['2026-09-01T09:00:00Z'],
        bucketId: 'active',
        createdDateTime: '2026-08-25T09:00:00Z',
        dueDateTime: '2026-09-03T12:00:00Z',
        id: 'overdue',
        percentComplete: 50,
        planId: 'plan-1',
        title: 'Overdue task',
      },
      {
        assignedToCurrentUser: false,
        assignmentDateTimes: [],
        bucketId: 'hold',
        createdDateTime: '2026-08-28T09:00:00Z',
        dueDateTime: '2026-09-10T12:00:00Z',
        id: 'on-hold',
        percentComplete: 0,
        planId: 'plan-1',
        title: 'Paused task',
      },
      {
        assignedToCurrentUser: true,
        assignmentDateTimes: ['2026-08-30T09:00:00Z'],
        bucketId: 'active',
        createdDateTime: '2026-08-29T09:00:00Z',
        dueDateTime: '2026-09-12T12:00:00Z',
        id: 'later',
        percentComplete: 0,
        planId: 'plan-1',
        title: 'Later task',
      },
      {
        assignedToCurrentUser: false,
        assignmentDateTimes: [],
        bucketId: 'hold',
        completedDateTime: '2026-09-02T09:00:00Z',
        createdDateTime: '2026-08-20T09:00:00Z',
        dueDateTime: '2026-09-04T12:00:00Z',
        id: 'complete',
        percentComplete: 100,
        planId: 'plan-1',
        title: 'Completed task',
      },
    ],
  };
}

describe('summarizePlannerProject', () => {
  it('classifies urgent and on-hold work while excluding completed tasks', () => {
    const project = createProject();

    expect(summarizePlannerProject(project, NOW)).toEqual({
      activeTasks: 3,
      assignedToMeTasks: 2,
      completedTasks: 1,
      createdDateTime: '2026-08-01T09:00:00Z',
      id: 'plan-1',
      lastActivityDateTime: '2026-09-02T09:00:00.000Z',
      nextDueDate: '2026-09-10T12:00:00.000Z',
      onHoldTaskIds: ['on-hold'],
      onHoldTasks: 1,
      overdueTasks: 1,
      owner: 'group-1',
      tasks: project.tasks,
      title: 'Website redesign',
      totalTasks: 4,
      urgentTasks: 2,
    });
  });
});

describe('filterPlannerProjects', () => {
  const project: IPlannerProjectSummary = summarizePlannerProject(
    createProject(),
    NOW
  );

  it('returns the project for active, urgent, overdue, and on-hold views', () => {
    expect(filterPlannerProjects([project], { view: 'active' }, NOW)).toEqual([
      project,
    ]);
    expect(filterPlannerProjects([project], { view: 'urgent' }, NOW)).toEqual([
      project,
    ]);
    expect(filterPlannerProjects([project], { view: 'overdue' }, NOW)).toEqual([
      project,
    ]);
    expect(filterPlannerProjects([project], { view: 'onHold' }, NOW)).toEqual([
      project,
    ]);
  });

  it('matches assignment and status filters on the same task', () => {
    const splitConditions: IPlannerProjectSummary = {
      ...project,
      assignedToMeTasks: 1,
      id: 'plan-2',
      tasks: project.tasks.map((task) => ({
        ...task,
        assignedToCurrentUser: task.id === 'later',
      })),
      title: 'Split conditions',
    };

    expect(
      filterPlannerProjects(
        [splitConditions, project],
        { assignedToMe: true, view: 'overdue' },
        NOW
      )
    ).toEqual([project]);
  });

  it('filters assigned projects and supports relative activity ranges', () => {
    expect(
      filterPlannerProjects(
        [project],
        { assignedToMe: true, view: 'all' },
        NOW
      )
    ).toEqual([project]);
    expect(
      filterPlannerProjects(
        [project],
        {
          dateField: 'activity',
          dateRange: 'last7Days',
          view: 'all',
        },
        NOW
      )
    ).toEqual([project]);
    expect(
      filterPlannerProjects(
        [project],
        {
          dateField: 'activity',
          dateRange: 'last30Days',
          view: 'all',
        },
        NOW
      )
    ).toEqual([project]);
  });

  it('includes projects with no tasks assigned to the user in the all view', () => {
    const unassignedProject: IPlannerProjectSummary = {
      ...project,
      assignedToMeTasks: 0,
      id: 'unassigned-plan',
      tasks: project.tasks.map((task) => ({
        ...task,
        assignedToCurrentUser: false,
      })),
      title: 'Unassigned project',
    };

    expect(
      filterPlannerProjects(
        [unassignedProject],
        { assignedToMe: false, view: 'all' },
        NOW
      )
    ).toEqual([unassignedProject]);
  });

  it('filters project creation and task due dates by calendar range', () => {
    expect(
      filterPlannerProjects(
        [project],
        {
          dateField: 'created',
          dateRange: 'lastMonth',
          view: 'all',
        },
        NOW
      )
    ).toEqual([project]);
    expect(
      filterPlannerProjects(
        [project],
        {
          dateField: 'due',
          dateRange: 'custom',
          fromDate: '2026-09-09',
          toDate: '2026-09-11',
          view: 'active',
        },
        NOW
      )
    ).toEqual([project]);
  });

  it('returns only the most recently active project when requested', () => {
    const olderProject: IPlannerProjectSummary = {
      ...project,
      id: 'older-plan',
      lastActivityDateTime: '2026-08-01T09:00:00Z',
      title: 'Older project',
    };

    expect(
      filterPlannerProjects(
        [olderProject, project],
        {
          maxResults: 1,
          sortBy: 'recentActivity',
          view: 'all',
        },
        NOW
      )
    ).toEqual([project]);
  });

  it('filters by a case-insensitive project name', () => {
    expect(
      filterPlannerProjects([project], {
        projectName: 'WEBSITE',
        view: 'all',
      }, NOW)
    ).toEqual([project]);
    expect(
      filterPlannerProjects([project], {
        projectName: 'Finance',
        view: 'all',
      }, NOW)
    ).toEqual([]);
  });
});
