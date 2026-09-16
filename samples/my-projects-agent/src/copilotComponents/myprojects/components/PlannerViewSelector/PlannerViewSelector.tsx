import * as React from 'react';
import { SelectView } from '@spteck/react-controls-v2/select-view';

import { PLANNER_VIEW_KEY } from '../../constants/plannerExpandedView.constants';
import { createPlannerViewOptions } from '../../utils/plannerExpandedView';
import type { IPlannerViewSelectorProps } from '../../models';

export function PlannerViewSelector(
  props: IPlannerViewSelectorProps
): React.ReactElement {
  const options = React.useMemo(
    () => createPlannerViewOptions(props.strings),
    [props.strings.GanttViewLabel, props.strings.PlannerViewLabel]
  );

  return (
    <SelectView
      defaultKey={PLANNER_VIEW_KEY}
      onChange={props.onChange}
      options={options}
    />
  );
}