import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  list: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr',
    ...shorthands.gap('6px', '12px'),
    ...shorthands.margin(0),
    fontSize: tokens.fontSizeBase300
  },
  narrow: { gridTemplateColumns: '1fr' },
  term: { color: tokens.colorNeutralForeground2, ...shorthands.margin(0) },
  detail: { ...shorthands.margin(0), overflowWrap: 'anywhere' }
});

export interface ISummaryItem {
  key: string;
  label: string;
  value: React.ReactNode;
}

export interface ISummaryListProps {
  items: ISummaryItem[];
  narrow?: boolean;
}

/** Read-only record view, used by review, receipt and the selected detail. */
export const SummaryList: React.FC<ISummaryListProps> = props => {
  const styles = useStyles();
  return (
    <dl className={mergeClasses(styles.list, props.narrow && styles.narrow)} data-summary="true">
      {props.items.map(item => (
        <React.Fragment key={item.key}>
          <dt className={styles.term}>{item.label}</dt>
          <dd className={styles.detail} data-summary-value={item.key}>
            {item.value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
