import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { fileBadge, formatBytes } from '../../logic/format';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('10px', 0)
  },
  badge: {
    width: '32px',
    height: '36px',
    flexShrink: 0,
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontSize: '9px',
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  details: { minWidth: 0, flexGrow: 1 },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  }
});

export interface IFileRowProps {
  name: string;
  sizeBytes: number;
  /** Extra text after the size, e.g. "kept in this card". */
  note?: string;
  action?: React.ReactNode;
}

export const FileRow: React.FC<IFileRowProps> = props => {
  const styles = useStyles();
  const badge: string = fileBadge(props.name);
  return (
    <div className={styles.row} data-file-row={props.name}>
      <span className={styles.badge} aria-hidden="true">
        {badge}
      </span>
      <div className={styles.details}>
        <div className={styles.name} title={props.name}>
          {props.name}
        </div>
        <div className={styles.meta}>
          <span className="sr-type">{badge} file, </span>
          {formatBytes(props.sizeBytes)}
          {props.note ? ' · ' + props.note : ''}
        </div>
      </div>
      {props.action}
    </div>
  );
};
