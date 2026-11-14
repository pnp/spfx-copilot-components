// Atom: small secondary text (a hint, a label next to a control, a "not available" note).

import { h } from '../dom';

import styles from './Note.module.scss';

export interface INoteOptions {
  /** 'p' for a note of its own, 'span' for a label inside a row. */
  tag?: 'p' | 'span';
  /** The note only repeats what a control already says to screen readers. */
  decorative?: boolean;
}

export function note(text: string, options: INoteOptions = {}): HTMLElement {
  return h(options.tag || 'p', { className: styles.note, 'aria-hidden': options.decorative ? 'true' : undefined }, text);
}
