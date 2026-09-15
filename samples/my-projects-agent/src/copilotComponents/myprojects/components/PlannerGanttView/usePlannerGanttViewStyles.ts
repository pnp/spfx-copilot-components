import { css } from '@emotion/css';

import type { IPlannerGanttViewStyles } from '../../models';

const plannerGanttViewStyles: IPlannerGanttViewStyles = {
  root: css({
    minHeight: 0,
  }),
};

export function usePlannerGanttViewStyles(): IPlannerGanttViewStyles {
  return plannerGanttViewStyles;
}