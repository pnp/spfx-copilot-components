import * as React from 'react';
import { Button, makeStyles, mergeClasses } from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  button: {
    '@media (max-width: 520px)': {
      width: '32px',
      minWidth: '32px',
      paddingLeft: 0,
      paddingRight: 0
    }
  },
  inverted: {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    ':hover': {
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.24)'
    },
    ':active': {
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.10)'
    }
  },
  label: {
    '@media (max-width: 520px)': {
      display: 'none'
    }
  }
});

export interface IResponsiveExpandButtonProps {
  onExpand?: () => Promise<void>;
  inverted?: boolean;
}

export function ResponsiveExpandButton(props: IResponsiveExpandButtonProps): React.ReactElement | undefined {
  const styles = useStyles();
  if (!props.onExpand) return undefined;

  return (
    <Button
      appearance="subtle"
      className={mergeClasses(styles.button, props.inverted && styles.inverted)}
      icon={<ArrowExpand24Regular />}
      aria-label="Expand"
      title="Expand"
      onClick={() => props.onExpand?.().catch(() => undefined)}
    >
      <span className={styles.label}>Expand</span>
    </Button>
  );
}