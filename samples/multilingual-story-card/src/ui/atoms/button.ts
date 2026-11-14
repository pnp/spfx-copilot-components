// Atom: a button. Content is text and/or an icon; the action goes through the page's runner.

import type { Action, IActionRunner } from '../actions';
import { h, type Child } from '../dom';

import styles from './Button.module.scss';

export interface IButtonOptions {
  /** The main action of a group (filled with the accent colour). */
  variant?: 'primary';
  /** Inside running text, e.g. a notice. */
  size?: 'small';
  /** Show a brief visible ✓ on the button when the action succeeded (completion feedback). */
  confirm?: boolean;
  /** Accessible name when the content is an icon only. */
  ariaLabel?: string;
}

const CONFIRM_MS: number = 1200;

export function button(runner: IActionRunner, content: Child | Child[], onClick: Action, options: IButtonOptions = {}): HTMLButtonElement {
  const classes: string[] = [styles.button];
  if (options.variant === 'primary') {
    classes.push(styles.primary);
  }
  if (options.size === 'small') {
    classes.push(styles.small);
  }
  const btn: HTMLButtonElement = h('button', { type: 'button', className: classes.join(' '), 'aria-label': options.ariaLabel }, content);
  let timer: number = 0;
  btn.addEventListener('click', () => {
    runner
      .run(onClick)
      .then((ok: boolean) => {
        if (ok && options.confirm) {
          btn.setAttribute('data-state', 'done');
          window.clearTimeout(timer);
          timer = window.setTimeout(() => btn.removeAttribute('data-state'), CONFIRM_MS);
        }
      })
      .catch(() => undefined);
  });
  return btn;
}
