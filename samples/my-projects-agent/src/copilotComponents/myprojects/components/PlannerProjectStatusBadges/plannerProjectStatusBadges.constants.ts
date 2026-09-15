import type {
  IMyprojectsStrings,
  IPlannerProjectSummary,
  IPlannerProjectStatusBadgeDefinition,
  IResolvedPlannerProjectStatusBadge,
} from '../../models';

export const PLANNER_PROJECT_STATUS_BADGE_DEFINITIONS = [
  {
    color: 'brand',
    labelKey: 'ActiveTasksLabel',
    valueKey: 'activeTasks',
  },
  {
    color: 'severe',
    labelKey: 'UrgentTasksLabel',
    valueKey: 'urgentTasks',
  },
  {
    color: 'danger',
    labelKey: 'OverdueTasksLabel',
    valueKey: 'overdueTasks',
  },
  {
    color: 'warning',
    labelKey: 'OnHoldTasksLabel',
    valueKey: 'onHoldTasks',
  },
] as const satisfies readonly IPlannerProjectStatusBadgeDefinition[];

export function resolvePlannerProjectStatusBadge(
  definition: IPlannerProjectStatusBadgeDefinition,
  project: IPlannerProjectSummary,
  strings: IMyprojectsStrings
): IResolvedPlannerProjectStatusBadge {
  return {
    color: definition.color,
    label: strings[definition.labelKey],
    value: project[definition.valueKey],
  };
}