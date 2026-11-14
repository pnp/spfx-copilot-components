// Atom: pushes what follows it in a flex row to the far end (inline-end in either direction).

import { h } from '../dom';

import styles from './Spacer.module.scss';

export function spacer(): HTMLSpanElement {
  return h('span', { className: styles.spacer });
}
