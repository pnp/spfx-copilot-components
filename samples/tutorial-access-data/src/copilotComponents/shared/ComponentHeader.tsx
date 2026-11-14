import * as React from 'react';
import {
  Button,
  Caption1,
  Subtitle1,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';

export interface IComponentHeaderProps {
  title: string;
  subtitle?: string;
  /** Show the expand button. False in fullscreen mode. */
  canExpand: boolean;
  expandLabel: string;
  onRequestFullscreen: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere'
  }
});

export function ComponentHeader(props: IComponentHeaderProps): React.ReactElement {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.text}>
        <Subtitle1 as="h2">{props.title}</Subtitle1>
        {props.subtitle !== undefined && (
          <Caption1 className={styles.subtitle}>{props.subtitle}</Caption1>
        )}
      </div>
      {props.canExpand && (
        <Button
          appearance="subtle"
          icon={<ArrowExpand24Regular />}
          aria-label={props.expandLabel}
          title={props.expandLabel}
          onClick={props.onRequestFullscreen}
        />
      )}
    </div>
  );
}
