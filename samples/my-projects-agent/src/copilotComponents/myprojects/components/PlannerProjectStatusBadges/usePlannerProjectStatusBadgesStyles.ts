import { css } from '@emotion/css';
import { tokens } from '@fluentui/react-components';

import type { IPlannerProjectStatusBadgesStyles } from '../../models';

const plannerProjectStatusBadgesStyles: IPlannerProjectStatusBadgesStyles = {
  badge: css({
    minWidth: `calc(${tokens.spacingHorizontalXXXL} + ${tokens.spacingHorizontalL})`,
    whiteSpace: 'nowrap',
  }),
};

export function usePlannerProjectStatusBadgesStyles(): IPlannerProjectStatusBadgesStyles {
  return plannerProjectStatusBadgesStyles;
}