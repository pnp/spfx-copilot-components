import * as React from 'react';
import { Tooltip, makeStyles, tokens } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';

export interface IInfoTipProps {
  content: string;
}

const useStyles = makeStyles({
  icon: { verticalAlign: 'middle', cursor: 'default', color: tokens.colorNeutralForeground3 }
});

// A small "what does this mean" info icon with a hover/focus tooltip. Reused
// next to health factors and KPI tiles so every number is explained.
export default function InfoTip(props: IInfoTipProps): React.ReactElement {
  const styles = useStyles();
  return (
    <Tooltip content={props.content} relationship="description" withArrow>
      <Info16Regular tabIndex={0} aria-label={props.content} className={styles.icon} />
    </Tooltip>
  );
}
