// Atom: one choice of a radio group, drawn as a pill. A native radio sits invisibly on top of the
// pill, so arrow keys, focus and screen readers behave like any radio button.

import { h } from '../dom';

import styles from './OptionPill.module.scss';

export interface IOptionPillProps {
  /** Radio group name (unique per page). */
  name: string;
  value: string;
  label: string;
  onSelect(value: string): void;
}

export interface IOptionPill {
  element: HTMLLabelElement;
  input: HTMLInputElement;
}

export function optionPill(props: IOptionPillProps): IOptionPill {
  const input: HTMLInputElement = h('input', { type: 'radio', name: props.name, value: props.value });
  input.addEventListener('change', () => {
    if (input.checked) {
      props.onSelect(props.value);
    }
  });
  // data-part="pill": a group may restyle the pill's shape (segmented), never its states.
  const element: HTMLLabelElement = h('label', { className: styles.option }, input, h('span', { 'data-part': 'pill' }, props.label));
  return { element, input };
}
