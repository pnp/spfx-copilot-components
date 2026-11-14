import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { FilingStatus } from '../../models/sources';
import { STATUS_TONES, statusLabel } from '../../logic/format';

const useStyles = makeStyles({
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('5px'),
    height: '20px',
    ...shorthands.padding(0, '8px'),
    ...shorthands.borderRadius('10px'),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    // Micro transition when a pill flips tone (e.g. Needs → Ready). No entrance
    // animation — a pill is data in a dense list, not a moment (AGENTS.md §4).
    transitionProperty: 'background-color, color',
    transitionDuration: '120ms',
    transitionTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' }
  },
  dot: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: 'currentColor'
  },
  amber: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1
  },
  green: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1
  },
  red: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1
  },
  neutral: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2
  }
});

export interface IStatusPillProps {
  status: FilingStatus;
  /** Short label for narrow layouts ("Pending" rather than "Pending review"). */
  short?: boolean;
}

/** The status label is always spelled out; the colour only reinforces it. */
export const StatusPill: React.FC<IStatusPillProps> = props => {
  const styles = useStyles();
  const tone = STATUS_TONES[props.status];
  const toneClass: string = tone === 'amber' ? styles.amber : tone === 'green' ? styles.green : styles.red;
  const label: string = statusLabel(props.status, props.short);
  return (
    <span className={mergeClasses(styles.pill, toneClass)} data-status={props.status} data-tone={tone}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
};

export interface IReadinessPillProps {
  ready: boolean;
  label: string;
}

/** Per-file readiness in the bulk list. Same mechanics, different meaning. */
export const ReadinessPill: React.FC<IReadinessPillProps> = props => {
  const styles = useStyles();
  return (
    <span
      className={mergeClasses(styles.pill, props.ready ? styles.green : styles.amber)}
      data-readiness={props.ready ? 'ready' : 'incomplete'}
    >
      <span className={styles.dot} aria-hidden="true" />
      {props.label}
    </span>
  );
};
