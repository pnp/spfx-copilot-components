import type { IPlannerTask } from '../models';
import { toPlannerGanttTasks } from './plannerGantt';

function createTask(
  values: Partial<IPlannerTask> & Pick<IPlannerTask, 'id' | 'title'>
): IPlannerTask {
  return {
    assignedToCurrentUser: false,
    assignmentDateTimes: [],
    bucketId: 'bucket-1',
    percentComplete: 0,
    planId: 'plan-1',
    ...values,
  };
}

describe('toPlannerGanttTasks', () => {
  it('maps Planner dates and orders tasks by their effective start date', () => {
    const tasks: IPlannerTask[] = [
      createTask({
        dueDateTime: '2026-09-04T12:00:00Z',
        id: 'dated',
        percentComplete: 50,
        startDateTime: '2026-09-01T12:00:00Z',
        title: 'Dated task',
      }),
      createTask({
        dueDateTime: '2026-09-10T12:00:00Z',
        id: 'due-only',
        title: 'Due-only task',
      }),
      createTask({
        id: 'start-only',
        startDateTime: '2026-09-12T12:00:00Z',
        title: 'Start-only task',
      }),
      createTask({
        createdDateTime: '2026-09-14T12:00:00Z',
        id: 'task-created',
        title: 'Task with a creation date',
      }),
      createTask({ id: 'plan-created', title: 'Task without dates' }),
    ];

    expect(
      toPlannerGanttTasks(tasks, '2026-08-31T12:00:00Z')
    ).toEqual([
      {
        duration: 1,
        id: 'plan-created',
        progress: 0,
        start: new Date('2026-08-31T12:00:00Z'),
        text: 'Task without dates',
        type: 'task',
      },
      {
        duration: 3,
        id: 'dated',
        progress: 50,
        start: new Date('2026-09-01T12:00:00Z'),
        text: 'Dated task',
        type: 'task',
      },
      {
        duration: 1,
        id: 'due-only',
        progress: 0,
        start: new Date('2026-09-09T12:00:00Z'),
        text: 'Due-only task',
        type: 'task',
      },
      {
        duration: 1,
        id: 'start-only',
        progress: 0,
        start: new Date('2026-09-12T12:00:00Z'),
        text: 'Start-only task',
        type: 'task',
      },
      {
        duration: 1,
        id: 'task-created',
        progress: 0,
        start: new Date('2026-09-14T12:00:00Z'),
        text: 'Task with a creation date',
        type: 'task',
      },
    ]);
  });

  it('uses a one-day duration when the due date is not after the start', () => {
    const task = createTask({
      dueDateTime: '2026-09-01T12:00:00Z',
      id: 'invalid-range',
      startDateTime: '2026-09-04T12:00:00Z',
      title: 'Invalid range',
    });

    expect(toPlannerGanttTasks([task])[0].duration).toBe(1);
  });
});