import type { GanttChartTask } from '@spteck/react-controls-v2/gantt';

import type { IPlannerTask } from '../models';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
type DatedGanttChartTask = GanttChartTask & { start: Date };

function parsePlannerDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
}

function toPlannerGanttTask(
  task: IPlannerTask,
  planCreatedDateTime: string | undefined
): DatedGanttChartTask | undefined {
  const plannerStart = parsePlannerDate(task.startDateTime);
  const plannerDue = parsePlannerDate(task.dueDateTime);
  const fallbackStart =
    parsePlannerDate(task.createdDateTime) ??
    parsePlannerDate(task.assignmentDateTimes[0]) ??
    parsePlannerDate(planCreatedDateTime);

  if (!plannerStart && !plannerDue && !fallbackStart) {
    return undefined;
  }

  const start =
    plannerStart ??
    (plannerDue
      ? new Date(plannerDue.getTime() - MILLISECONDS_PER_DAY)
      : fallbackStart!);
  const duration =
    plannerStart && plannerDue
      ? Math.max(
          1,
          Math.ceil(
            (plannerDue.getTime() - plannerStart.getTime()) /
              MILLISECONDS_PER_DAY
          )
        )
      : 1;

  return {
    duration,
    id: task.id,
    progress: task.percentComplete,
    start,
    text: task.title,
    type: 'task',
  };
}

export function toPlannerGanttTasks(
  tasks: readonly IPlannerTask[],
  planCreatedDateTime?: string
): GanttChartTask[] {
  return tasks
    .map((task) => toPlannerGanttTask(task, planCreatedDateTime))
    .filter((task): task is DatedGanttChartTask => task !== undefined)
    .sort((left, right) => left.start.getTime() - right.start.getTime());
}