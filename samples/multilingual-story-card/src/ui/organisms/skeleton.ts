// Organism: a loading placeholder shaped like a news card (chip, headline, photo, text lines).
// Shown while the page prepares the real content; the page replaces it, nothing to clean up.

import { h } from '../dom';
import { visuallyHidden } from '../atoms/visuallyHidden';

import styles from './Skeleton.module.scss';

/** `label` is read to screen readers ("Loading"). */
export function skeleton(label: string): HTMLElement {
  const bar = (kind: string): HTMLElement => h('span', { className: styles.bar, 'data-bar': kind, 'aria-hidden': 'true' });
  return h(
    'div',
    { className: styles.skeleton, 'aria-busy': 'true' },
    visuallyHidden(label),
    bar('chip'),
    bar('title'),
    bar('title-short'),
    bar('photo'),
    bar('line'),
    bar('line'),
    bar('line-short')
  );
}
