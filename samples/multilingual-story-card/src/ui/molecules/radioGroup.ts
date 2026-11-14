// Molecule: a labelled set of option pills. Native radios in a fieldset: arrow keys work, and the
// group is announced with its legend.

import { h } from '../dom';
import { optionPill, type IOptionPill } from '../atoms/optionPill';

import styles from './RadioGroup.module.scss';

export interface IRadioGroupProps {
  /** Radio name, unique per page (several cards can share one document). */
  name: string;
  legend: string;
  /** [value, label] pairs. */
  options: Array<[string, string]>;
  onChange(value: string): void;
  /** 'segmented': one joined pill, legend for screen readers only (e.g. a theme switch). */
  variant?: 'segmented';
}

export interface IRadioGroup {
  element: HTMLElement;
  /** Checks the option with `value` (and mirrors it into the attribute for serialised markup). */
  sync(value: string): void;
}

export function radioGroup(props: IRadioGroupProps): IRadioGroup {
  const pills: IOptionPill[] = props.options.map(([value, label]: [string, string]) =>
    optionPill({ name: props.name, value, label, onSelect: props.onChange })
  );
  const element: HTMLElement = h(
    'fieldset',
    { className: props.variant === 'segmented' ? `${styles.options} ${styles.segmented}` : styles.options },
    h('legend', null, props.legend),
    pills.map((p: IOptionPill) => p.element)
  );
  return {
    element,
    sync(value: string): void {
      pills.forEach(({ input }: IOptionPill) => {
        input.checked = input.value === value;
        input.toggleAttribute('checked', input.checked);
      });
    }
  };
}
