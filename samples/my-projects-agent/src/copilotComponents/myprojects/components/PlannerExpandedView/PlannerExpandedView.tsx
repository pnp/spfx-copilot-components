import * as React from 'react';
import type { GanttChartScaleKey } from '@spteck/react-controls-v2/gantt';
import { webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';

import {
  DEFAULT_GANTT_SCALE,
  GANTT_VIEW_KEY,
  PLANNER_VIEW_KEY,
} from '../../constants/plannerExpandedView.constants';
import {
  isGanttScaleKey,
  isPlannerExpandedViewKey,
} from '../../utils/plannerExpandedView';
import type {
  IPlannerExpandedViewProps,
  PlannerExpandedViewKey,
} from '../../models';
import { PlannerControl } from '../PlannerControl/PlannerControl';
import { PlannerExpandedHeader } from '../PlannerExpandedHeader/PlannerExpandedHeader';
import { PlannerGanttView } from '../PlannerGanttView/PlannerGanttView';
import { usePlannerExpandedViewStyles } from './usePlannerExpandedViewStyles';

export function PlannerExpandedView(
  props: IPlannerExpandedViewProps
): React.ReactElement {
  const styles = usePlannerExpandedViewStyles();
  const [selectedView, setSelectedView] =
    React.useState<PlannerExpandedViewKey>(PLANNER_VIEW_KEY);
  const [selectedScale, setSelectedScale] =
    React.useState<GanttChartScaleKey>(DEFAULT_GANTT_SCALE);
  const handleViewChange = (viewKey: string): void => {
    if (isPlannerExpandedViewKey(viewKey)) {
      setSelectedView(viewKey);
    }
  };
  const handleScaleChange = (scaleKey: string): void => {
    if (isGanttScaleKey(scaleKey)) {
      setSelectedScale(scaleKey);
    }
  };

  return (
    <StackV2
      className={styles.root}
      overflow="hidden"
      padding="m"
      width="100%"
    >
      <PlannerExpandedHeader
        onCompact={props.onCompact}
        onScaleChange={handleScaleChange}
        onViewChange={handleViewChange}
        project={props.project}
        scale={selectedScale}
        selectedView={selectedView}
        strings={props.strings}
        theme={props.isDarkTheme ? webDarkTheme : webLightTheme}
      />
      <StackV2
        className={styles.content}
        overflow="hidden"
        paddingTop="m"
        width="100%"
      >
        {selectedView === GANTT_VIEW_KEY ? (
          <PlannerGanttView
            isDarkTheme={props.isDarkTheme}
            project={props.project}
            scale={selectedScale}
            scrollAreaHeight={props.scrollAreaHeight}
            strings={props.strings}
          />
        ) : (
          <PlannerControl
            context={props.context}
            loadingLabel={props.strings.LoadingPlannerLabel}
            project={props.project}
            scrollAreaHeight={props.scrollAreaHeight}
          />
        )}
      </StackV2>
    </StackV2>
  );
}
