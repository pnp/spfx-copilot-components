import * as React from 'react';

import { Text } from '@fluentui/react-text';
import { makeStyles } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';

const useStyles = makeStyles({
  root: {
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow2
  },
  header: {
    minHeight: '46px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    padding: '11px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`
  },
  icon: {
    display: 'inline-flex',
    flexShrink: 0,
    color: tokens.colorBrandForeground1
  },
  title: {
    minWidth: 0,
    flexGrow: 1,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  action: {
    padding: '4px 6px',
    color: tokens.colorBrandForegroundLink,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: '2px'
    }
  },
  body: { minWidth: 0 }
});

export interface IDashboardCardProps {
  children?: React.ReactNode;
  title: string;
  icon?: React.ReactElement;
  actionLabel?: string;
  onAction?: () => void;
}

const DashboardCard: React.FunctionComponent<IDashboardCardProps> = (props) => {
  const styles = useStyles();
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        {props.icon && <span className={styles.icon} aria-hidden="true">{props.icon}</span>}
        <Text size={400} className={styles.title}>{props.title}</Text>
        {props.actionLabel && props.onAction && (
          <button type="button" className={styles.action} onClick={props.onAction}>
            {props.actionLabel}
          </button>
        )}
      </div>
      <div className={styles.body}>{props.children}</div>
    </section>
  );
};

export default DashboardCard;