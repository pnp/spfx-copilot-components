// Atom: a text glyph used as an icon (decorative: the button around it carries the name).

import { h } from '../dom';

import styles from './Icon.module.scss';

export interface IIconOptions {
  /** The glyph points in reading direction (→, ⤢) and mirrors in right-to-left text. */
  mirror?: boolean;
}

export function icon(glyph: string, options: IIconOptions = {}): HTMLSpanElement {
  return h('span', { className: options.mirror ? `${styles.icon} ${styles.mirror}` : styles.icon, 'aria-hidden': 'true' }, glyph);
}
