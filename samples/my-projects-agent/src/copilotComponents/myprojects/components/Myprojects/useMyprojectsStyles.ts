import { css } from '@emotion/css';
import { tokens } from '@fluentui/react-components';

import type { IMyprojectsStyles } from '../../models';

const myprojectsStyles: IMyprojectsStyles = {
  root: css({
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground3,
  }),
};

export function useMyprojectsStyles(): IMyprojectsStyles {
  return myprojectsStyles;
}