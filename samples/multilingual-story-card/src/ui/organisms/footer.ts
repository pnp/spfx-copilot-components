// Organism: the controls as one quiet footer below the content. A toolbar row first (actions), then
// whatever comes below it (a disclosure, a note, a diagnostics drawer).

import { h, type Child } from '../dom';

import styles from './Footer.module.scss';

/**
 * A set of controls that belongs together (read-aloud, actions). The toolbar wraps whole groups:
 * when space runs out the second group moves to its own line instead of single buttons trailing.
 */
export function toolbarGroup(name: string, children: Child[]): HTMLElement {
  return h('div', { className: styles.toolGroup, 'data-part': name }, children);
}

export function footer(toolbar: Child[], ...below: Child[]): HTMLElement {
  return h('footer', { className: styles.footer }, h('div', { className: styles.toolbar }, toolbar), below);
}
