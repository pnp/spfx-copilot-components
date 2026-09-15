import type {
  GanttChartColumnKey,
  IGanttChartMessages,
} from '@spteck/react-controls-v2/gantt';

import type { IMyprojectsStrings } from '../../models';

export const PLANNER_GANTT_DURATION_UNIT = 'day';
export const PLANNER_GANTT_VISIBLE_COLUMNS: GanttChartColumnKey[] = [
  'text',
  'start',
  'duration',
  'progress',
];

export function createPlannerGanttMessages(
  strings: IMyprojectsStrings
): IGanttChartMessages {
  return {
    emptyDescription: strings.NoScheduledTasksDescription,
    emptyTitle: strings.NoScheduledTasksTitle,
  };
}