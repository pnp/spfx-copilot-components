// Atom: a quiet rounded label for metadata (e.g. the detected language).

import { h, type Child } from '../dom';

import styles from './Chip.module.scss';

export function chip(...children: Array<Child | Child[]>): HTMLParagraphElement {
  return h('p', { className: styles.chip }, ...children);
}
