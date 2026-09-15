import * as React from 'react';
import {
  Board20Regular,
  Calendar20Regular,
  CalendarDataBar20Regular,
  CalendarDay20Regular,
  CalendarMonth20Regular,
  CalendarWeekNumbers20Regular,
  Clock20Regular,
  GanttChart20Regular,
} from '@fluentui/react-icons';
import type { GanttChartScaleKey } from '@spteck/react-controls-v2/gantt';

import type {
  ISelectViewOptionDefinition,
  PlannerExpandedViewKey,
} from '../models';

export const PLANNER_VIEW_KEY = 'planner';
export const GANTT_VIEW_KEY = 'gantt';
export const DEFAULT_GANTT_SCALE: GanttChartScaleKey = 'week';

export const PLANNER_VIEW_OPTION_DEFINITIONS = [
  {
    icon: <Board20Regular />,
    key: PLANNER_VIEW_KEY,
    labelKey: 'PlannerViewLabel',
  },
  {
    icon: <GanttChart20Regular />,
    key: GANTT_VIEW_KEY,
    labelKey: 'GanttViewLabel',
  },
] as const satisfies readonly ISelectViewOptionDefinition<PlannerExpandedViewKey>[];

export const GANTT_SCALE_OPTION_DEFINITIONS = [
  {
    icon: <Clock20Regular />,
    key: 'hour',
    labelKey: 'HourScaleLabel',
  },
  {
    icon: <CalendarDay20Regular />,
    key: 'day',
    labelKey: 'DayScaleLabel',
  },
  {
    icon: <CalendarWeekNumbers20Regular />,
    key: 'week',
    labelKey: 'WeekScaleLabel',
  },
  {
    icon: <CalendarMonth20Regular />,
    key: 'month',
    labelKey: 'MonthScaleLabel',
  },
  {
    icon: <CalendarDataBar20Regular />,
    key: 'quarter',
    labelKey: 'QuarterScaleLabel',
  },
  {
    icon: <Calendar20Regular />,
    key: 'year',
    labelKey: 'YearScaleLabel',
  },
] as const satisfies readonly ISelectViewOptionDefinition<GanttChartScaleKey>[];
