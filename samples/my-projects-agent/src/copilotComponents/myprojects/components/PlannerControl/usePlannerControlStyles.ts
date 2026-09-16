import { css } from '@emotion/css';

import type { IPlannerControlStyles } from '../../models';

const plannerControlStyles: IPlannerControlStyles = {
  content: css({
    flex: 1,
    minHeight: 0,
    '& > div': {
      height: '100%',
      minHeight: 0,
      width: '100%',
    },
  }),
  loadingOverlay: css({
    inset: 0,
    position: 'absolute',
    zIndex: 1,
  }),
  root: css({
    flex: 1,
    minHeight: 0,
    position: 'relative',
  }),
};

export function usePlannerControlStyles(): IPlannerControlStyles {
  return plannerControlStyles;
}