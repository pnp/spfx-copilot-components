// Atoms for screen-reader-only content: hidden text, and a polite live region for announcements.

import { h } from '../dom';

import styles from './VisuallyHidden.module.scss';

/** Text that screen readers read and nobody sees (e.g. "Loading" inside a skeleton). */
export function visuallyHidden(text: string): HTMLSpanElement {
  return h('span', { className: styles.srOnly }, text);
}

export interface ILiveRegion {
  element: HTMLElement;
  /** Polite announcement; clears first so repeating the same text is announced again. */
  announce(text: string): void;
}

/**
 * WCAG 4.1.3: a status region. It must exist (and stay) in the DOM before its text changes, so the
 * page creates it once and keeps it outside anything it rebuilds.
 */
export function liveRegion(): ILiveRegion {
  const element: HTMLElement = h('div', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', className: styles.srOnly });
  return {
    element,
    announce(text: string): void {
      element.textContent = '';
      window.setTimeout(() => {
        element.textContent = text;
      }, 100);
    }
  };
}
