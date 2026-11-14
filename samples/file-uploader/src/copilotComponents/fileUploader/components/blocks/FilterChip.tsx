import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  chip: {
    height: '28px',
    ...shorthands.padding(0, '10px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover }
  },
  on: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('6px'),
    ...shorthands.margin('8px', 0, '4px', 0)
  },
  select: {
    height: '28px',
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding(0, '8px'),
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyBase
  },
  selectOn: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold
  }
});

export const ChipRow: React.FC<{ children: React.ReactNode }> = props => {
  const styles = useStyles();
  return (
    <div className={styles.row} role="group" aria-label="Filter recent filings">
      {props.children}
    </div>
  );
};

export interface IChipSelectOption {
  value: string;
  label: string;
}

export interface IChipSelectProps {
  name: string;
  /** Shown when nothing is chosen — "All kinds", "Any status". */
  allLabel: string;
  value: string | undefined;
  options: IChipSelectOption[];
  onChange: (value: string | undefined) => void;
}

/**
 * A filter as a native select styled like a chip: keyboard- and
 * screen-reader-friendly without a custom listbox, and every change alters the
 * rows (R23 — no decorative controls).
 */
export const ChipSelect: React.FC<IChipSelectProps> = props => {
  const styles = useStyles();
  const active: boolean = Boolean(props.value);
  return (
    <select
      className={mergeClasses(styles.select, active && styles.selectOn)}
      data-chip={props.name}
      data-active={active ? 'true' : 'false'}
      aria-label={props.allLabel}
      value={props.value || ''}
      onChange={e => props.onChange(e.target.value || undefined)}
    >
      <option value="">{props.allLabel}</option>
      {props.options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};

export interface IChipToggleProps {
  name: string;
  label: string;
  pressed: boolean;
  onClick: () => void;
}

/** A binary filter. `aria-pressed` per AGENTS.md §4 Accessibility. */
export const ChipToggle: React.FC<IChipToggleProps> = props => {
  const styles = useStyles();
  return (
    <button
      type="button"
      className={mergeClasses(styles.chip, props.pressed && styles.on)}
      data-chip={props.name}
      data-active={props.pressed ? 'true' : 'false'}
      aria-pressed={props.pressed}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
};
