import type { ReactElement } from 'react';
import type { BadgeProps } from '@fluentui/react-components';
import type { SelectViewProps } from '@spteck/react-controls-v2/select-view';

import type { IMyprojectsStrings } from './myprojects.models';

export type PlannerExpandedViewKey = 'planner' | 'gantt';
export type SelectViewOptions = SelectViewProps['options'];
export type PlannerProjectStatusLabelKey =
  | 'ActiveTasksLabel'
  | 'UrgentTasksLabel'
  | 'OverdueTasksLabel'
  | 'OnHoldTasksLabel';
export type PlannerProjectStatusValueKey =
  | 'activeTasks'
  | 'urgentTasks'
  | 'overdueTasks'
  | 'onHoldTasks';

export interface ISelectViewOptionDefinition<TKey extends string> {
  icon: ReactElement;
  key: TKey;
  labelKey: keyof IMyprojectsStrings;
}

export interface IPlannerProjectStatusBadgeDefinition {
  color: BadgeProps['color'];
  labelKey: PlannerProjectStatusLabelKey;
  valueKey: PlannerProjectStatusValueKey;
}

export interface IResolvedPlannerProjectStatusBadge {
  color: BadgeProps['color'];
  label: string;
  value: number;
}