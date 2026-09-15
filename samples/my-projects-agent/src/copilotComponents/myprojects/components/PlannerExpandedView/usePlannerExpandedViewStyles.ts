import { css } from '@emotion/css';

import type { IPlannerExpandedViewStyles } from '../../models';

const plannerExpandedViewStyles: IPlannerExpandedViewStyles = {
  content: css({
    flex: 1,
    minHeight: 0,
  }),
  root: css({
    boxSizing: 'border-box',
    minHeight: 0,
  }),
};

export function usePlannerExpandedViewStyles(): IPlannerExpandedViewStyles {
  return plannerExpandedViewStyles;
}