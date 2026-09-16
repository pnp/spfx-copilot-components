import type { GanttChartScaleKey } from '@spteck/react-controls-v2/gantt';

import {
  GANTT_SCALE_OPTION_DEFINITIONS,
  GANTT_VIEW_KEY,
  PLANNER_VIEW_KEY,
  PLANNER_VIEW_OPTION_DEFINITIONS,
} from '../constants/plannerExpandedView.constants';
import type {
  IMyprojectsStrings,
  ISelectViewOptionDefinition,
  PlannerExpandedViewKey,
  SelectViewOptions,
} from '../models';

function createSelectViewOptions<TKey extends string>(
  definitions: readonly ISelectViewOptionDefinition<TKey>[],
  strings: IMyprojectsStrings
): SelectViewOptions {
  return definitions.map((definition) => ({
    icon: definition.icon,
    key: definition.key,
    text: strings[definition.labelKey],
  }));
}

export function createPlannerViewOptions(
  strings: IMyprojectsStrings
): SelectViewOptions {
  return createSelectViewOptions(PLANNER_VIEW_OPTION_DEFINITIONS, strings);
}

export function createGanttScaleOptions(
  strings: IMyprojectsStrings
): SelectViewOptions {
  return createSelectViewOptions(GANTT_SCALE_OPTION_DEFINITIONS, strings);
}

export function isPlannerExpandedViewKey(
  value: string
): value is PlannerExpandedViewKey {
  return value === PLANNER_VIEW_KEY || value === GANTT_VIEW_KEY;
}

export function isGanttScaleKey(value: string): value is GanttChartScaleKey {
  return GANTT_SCALE_OPTION_DEFINITIONS.some(
    (definition) => definition.key === value
  );
}