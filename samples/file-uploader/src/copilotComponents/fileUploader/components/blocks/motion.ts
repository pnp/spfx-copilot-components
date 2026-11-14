import * as React from 'react';
import { makeStyles } from '@fluentui/react-components';

/**
 * Shared motion primitives (AGENTS.md §4 Motion, R15). Every animation here
 * carries a `@media (prefers-reduced-motion: reduce)` guard *and* the caller
 * gates it on `useReducedMotion()` so the settled state renders immediately.
 * Motion never gates a value, a state, focus, validation, or the next action.
 */

/** True when the viewer asked for reduced motion — read once per mount. */
export function useReducedMotion(): boolean {
  return React.useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
}

export const useMotionStyles = makeStyles({
  /** Micro-entrance for a banner: 140 ms fade + 2 px rise. */
  bannerEnter: {
    animationName: {
      from: { opacity: 0, transform: 'translateY(2px)' },
      to: { opacity: 1, transform: 'translateY(0)' }
    },
    animationDuration: '140ms',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '0s',
      opacity: 1,
      transform: 'none'
    }
  }
});
