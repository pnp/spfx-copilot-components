// Molecule: "Translate to [language ▾] [➜]". Picking alone does nothing; the arrow confirms, so a
// keyboard user can browse the list without sending anything.

import type { IActionRunner } from '../actions';
import { h } from '../dom';
import { button } from '../atoms/button';
import { icon } from '../atoms/icon';
import { note } from '../atoms/note';
import { select, type ISelectOption } from '../atoms/select';

import styles from './TranslatePicker.module.scss';

export interface ITranslatePickerProps {
  /** "Translate to" (visible label and the controls' accessible name). */
  label: string;
  /** Each label is a language name in that language: give it its own lang/dir (WCAG 3.1.2). */
  options: ISelectOption[];
  /** Resolves false when the request failed (no ✓ then). */
  onPick(value: string): boolean | Promise<boolean>;
}

export function translatePicker(runner: IActionRunner, props: ITranslatePickerProps): HTMLElement {
  const list: HTMLSelectElement = select({ label: props.label, placeholder: '…', options: props.options });
  const go: HTMLButtonElement = button(runner, icon('➜', { mirror: true }), () => (list.value ? props.onPick(list.value) : false), {
    confirm: true,
    ariaLabel: props.label
  });
  return h('span', { className: styles.group }, note(props.label, { tag: 'span', decorative: true }), list, go);
}
