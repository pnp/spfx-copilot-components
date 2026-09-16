import * as React from 'react';
import { SelectView } from '@spteck/react-controls-v2/select-view';

import { createGanttScaleOptions } from '../../utils/plannerExpandedView';
import type { IPlannerScaleSelectorProps } from '../../models';

export function PlannerScaleSelector(
  props: IPlannerScaleSelectorProps
): React.ReactElement {
  const options = React.useMemo(
    () => createGanttScaleOptions(props.strings),
    [
      props.strings.DayScaleLabel,
      props.strings.HourScaleLabel,
      props.strings.MonthScaleLabel,
      props.strings.QuarterScaleLabel,
      props.strings.WeekScaleLabel,
      props.strings.YearScaleLabel,
    ]
  );

  return (
    <SelectView
      defaultKey={props.scale}
      onChange={props.onChange}
      options={options}
    />
  );
}