// Molecule: a photo credit line ("Photo: Artist · Public domain · The Met"), links as link buttons.

import { h, type Child } from '../dom';

import styles from './Credit.module.scss';

export function credit(...children: Array<Child | Child[]>): HTMLElement {
  return h('figcaption', { className: styles.credit, 'data-part': 'credit' }, ...children);
}
