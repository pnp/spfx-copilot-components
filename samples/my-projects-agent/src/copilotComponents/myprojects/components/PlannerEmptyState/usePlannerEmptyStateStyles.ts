import { css } from '@emotion/css';
import { tokens } from '@fluentui/react-components';

import type { IPlannerEmptyStateStyles } from '../../models';

const plannerEmptyStateStyles: IPlannerEmptyStateStyles = {
  description: css({
    color: tokens.colorNeutralForeground2,
    maxWidth: '32rem',
    textAlign: 'center',
  }),
  iconFrame: css({
    backgroundColor: tokens.colorNeutralBackground3,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusCircular,
  }),
  root: css({
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    boxSizing: 'border-box',
    minHeight: '240px',
  }),
};

export function usePlannerEmptyStateStyles(): IPlannerEmptyStateStyles {
  return plannerEmptyStateStyles;
}