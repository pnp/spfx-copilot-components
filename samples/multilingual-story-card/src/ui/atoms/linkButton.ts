// Atom: looks like a link, acts as a button. In a sandboxed iframe a link can't navigate; the
// action opens the URL through the host instead.

import type { Action, IActionRunner } from '../actions';
import { h } from '../dom';

import styles from './LinkButton.module.scss';

export function linkButton(runner: IActionRunner, label: string, onClick: Action): HTMLButtonElement {
  // Names and licences can be in any script: let the browser pick their direction.
  const btn: HTMLButtonElement = h('button', { type: 'button', className: styles.linkButton, dir: 'auto', 'data-part': 'link' }, label);
  btn.addEventListener('click', () => {
    runner.run(onClick).catch(() => undefined);
  });
  return btn;
}
