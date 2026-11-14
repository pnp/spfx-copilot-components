// Atom: a native select with a placeholder option. Native, so keyboard, screen readers and the
// platform picker on touch work without code.

import { h } from '../dom';

import styles from './Select.module.scss';

export interface ISelectOption {
  value: string;
  label: string;
  /** Language of the label, when it differs from the page (e.g. a language name in that language). */
  lang?: string;
  dir?: 'ltr' | 'rtl';
}

export interface ISelectProps {
  /** Accessible name. */
  label: string;
  /** Shown while nothing is picked; cannot be picked itself. */
  placeholder: string;
  options: ISelectOption[];
}

export function select(props: ISelectProps): HTMLSelectElement {
  return h(
    'select',
    { className: styles.select, 'aria-label': props.label },
    h('option', { value: '', disabled: true, selected: true }, props.placeholder),
    props.options.map((o: ISelectOption) => h('option', { value: o.value, lang: o.lang, dir: o.dir }, o.label))
  );
}
