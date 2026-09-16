import * as React from 'react';
import { GanttChart } from '@spteck/react-controls-v2/gantt';

import type { IPlannerGanttViewProps } from '../../models';
import { toPlannerGanttTasks } from '../../utils/plannerGantt';
import {
  createPlannerGanttMessages,
  PLANNER_GANTT_DURATION_UNIT,
  PLANNER_GANTT_VISIBLE_COLUMNS,
} from './plannerGanttView.constants';
import { usePlannerGanttViewStyles } from './usePlannerGanttViewStyles';

export function PlannerGanttView(
  props: IPlannerGanttViewProps
): React.ReactElement {
  const styles = usePlannerGanttViewStyles();
  const tasks = React.useMemo(
    () =>
      toPlannerGanttTasks(
        props.project.tasks,
        props.project.createdDateTime
      ),
    [props.project.createdDateTime, props.project.tasks]
  );
  const messages = React.useMemo(
    () => createPlannerGanttMessages(props.strings),
    [
      props.strings.NoScheduledTasksDescription,
      props.strings.NoScheduledTasksTitle,
    ]
  );

  return (
    <GanttChart
      ariaLabel={`${props.project.title}: ${props.strings.GanttAriaLabel}`}
      autoScale={true}
      className={styles.root}
      durationUnit={PLANNER_GANTT_DURATION_UNIT}
      isDarkTheme={props.isDarkTheme}
      messages={messages}
      readonly={true}
      scale={props.scale}
      tasks={tasks}
      visibleColumns={PLANNER_GANTT_VISIBLE_COLUMNS}
    />
  );
}
