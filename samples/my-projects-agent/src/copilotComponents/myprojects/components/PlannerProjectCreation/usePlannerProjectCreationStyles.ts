import { css } from '@emotion/css';
import { tokens } from '@fluentui/react-components';

import type { IPlannerProjectCreationStyles } from '../../models';

const plannerProjectCreationStyles: IPlannerProjectCreationStyles = {
  blueprint: css({
    backgroundColor: tokens.colorNeutralBackground2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  bucket: css({
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusCircular,
    maxWidth: '100%',
  }),
  content: css({
    boxSizing: 'border-box',
    margin: '0 auto',
    maxWidth: '760px',
    width: '100%',
  }),
  field: css({
    flex: '1 1 260px',
    minWidth: 0,
  }),
  reviewSurface: css({
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  }),
  root: css({
    backgroundColor: tokens.colorNeutralBackground3,
    minHeight: 0,
  }),
};

export function usePlannerProjectCreationStyles(): IPlannerProjectCreationStyles {
  return plannerProjectCreationStyles;
}