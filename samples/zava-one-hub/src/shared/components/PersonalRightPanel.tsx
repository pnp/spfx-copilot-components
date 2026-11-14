import * as React from 'react';
import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Dismiss20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    flexShrink: 0,
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    width: '380px',
    maxWidth: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow28,
    animationDuration: tokens.durationGentle,
    animationName: { from: { transform: 'translateX(24px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
    '@container zava-experience (max-width: 900px)': { width: '100%' }
  },
  header: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalM}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  headerText: { display: 'inline-flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexGrow: 1, minWidth: 0 },
  headerIcon: { display: 'inline-flex', flexShrink: 0, color: tokens.colorBrandForeground1 },
  title: { overflow: 'hidden', fontWeight: tokens.fontWeightSemibold, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  body: { flexGrow: 1, minHeight: 0, overflowY: 'auto', padding: tokens.spacingHorizontalL, boxSizing: 'border-box' },
  footnote: { padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`, color: tokens.colorNeutralForeground3, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, boxSizing: 'border-box' }
});

export interface IPersonalRightPanelProps {
  title: string;
  icon?: React.ReactElement;
  onDismiss: () => void;
  footnote?: string;
  children: React.ReactNode;
}

export function PersonalRightPanel(props: IPersonalRightPanelProps): React.ReactElement {
  const styles = useStyles();
  return <aside className={styles.root} role="complementary" aria-label={props.title}>
    <div className={styles.header}><span className={styles.headerText}>{props.icon && <span className={styles.headerIcon}>{props.icon}</span>}<Text size={400} className={styles.title}>{props.title}</Text></span><Button appearance="subtle" size="small" icon={<Dismiss20Regular />} aria-label="Close panel" onClick={props.onDismiss} /></div>
    <div className={styles.body}>{props.children}</div>
    {props.footnote && <Text size={200} className={styles.footnote}>{props.footnote}</Text>}
  </aside>;
}