// Molecule: a warning line with an optional fix (e.g. "Text: English · asked for: German [Rewrite]").
// The action is a small button (atoms/button, size 'small').

import { h, type Child } from '../dom';

import styles from './Notice.module.scss';

export function notice(text: string, action?: Child): HTMLElement {
  return h('p', { className: styles.warning, 'data-part': 'notice' }, `${text} `, action);
}
