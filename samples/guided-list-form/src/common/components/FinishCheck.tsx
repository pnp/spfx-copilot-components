import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useWizardStyles } from './styles';

export function FinishCheck(props: { motionOn: boolean }): React.ReactElement {
  const styles = useWizardStyles();
  return (
    <span className={mergeClasses(styles.doneBadgeWrap, props.motionOn && styles.doneBadgeMotion)} aria-hidden="true">
      <svg className={styles.doneBadgeSvg} viewBox="0 0 72 72" data-testid="wiz-finish-check">
        <circle cx="36" cy="36" r="33" fill="#F7F5F1" stroke="var(--wiz-finish-stroke, #F2643D)" strokeWidth="3" />
        <path
          d="M22 37.2 31.6 47 51 25.5"
          fill="none"
          stroke="var(--wiz-finish-tick, #183A35)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={props.motionOn ? styles.checkDraw : styles.checkStill}
        />
      </svg>
    </span>
  );
}
