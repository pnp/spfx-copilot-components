import type { Direction } from './navigation';

/** v1.2 timing: a quick accelerate-out, then a 400 ms expo-out entrance. */
export const EXIT_MS = 200;
export const ENTER_MS = 400;
export const EXIT_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
export const ENTER_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const PAGE_DISTANCE_PX = 40;
export const COMPACT_DISTANCE_PX = 20;
/** Delay between each option fading in. */
export const OPTION_STAGGER_MS = 45;
/** Progress bar width easing. */
export const PROGRESS_MS = 450;
/** Choice steps advance by themselves this long after a pick (motion on only). */
export const CHOICE_AUTO_ADVANCE_MS = 320;
/** Field guide card entrance. */
export const GUIDE_MS = 300;
export const GUIDE_EASING = 'cubic-bezier(0, 0, 0.58, 1)';

export type MotionPhase = 'idle' | 'exit' | 'enterFrom' | 'enter';

export interface IMotionStyle {
  transform: string;
  opacity: number;
  transition: string;
}

export function prefersReducedMotion(win?: Window): boolean {
  try {
    const w = win || (typeof window !== 'undefined' ? window : undefined);
    return !!(w && typeof w.matchMedia === 'function' && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

/** True when transitions should run: animations on and the person hasn't asked for reduced motion. */
export function motionEnabled(animationsSetting: boolean, reducedMotion: boolean): boolean {
  return animationsSetting && !reducedMotion;
}

export function totalTransitionMs(enabled: boolean): number {
  return enabled ? EXIT_MS + ENTER_MS : 0;
}

/**
 * Vertical slide + fade. Forward: the old screen moves up and fades, the new one rises in from below.
 * Back mirrors it. 'idle' is the resting state (no transform, so reduced motion is an instant swap).
 */
export function motionStyle(phase: MotionPhase, direction: Direction, compact: boolean): IMotionStyle {
  const d = compact ? COMPACT_DISTANCE_PX : PAGE_DISTANCE_PX;
  const sign = direction === 'forward' ? 1 : -1;
  switch (phase) {
    case 'exit':
      return { transform: `translateY(${-sign * d}px)`, opacity: 0, transition: `transform ${EXIT_MS}ms ${EXIT_EASING}, opacity ${EXIT_MS}ms ${EXIT_EASING}` };
    case 'enterFrom':
      return { transform: `translateY(${sign * d}px)`, opacity: 0, transition: 'none' };
    case 'enter':
      return { transform: 'translateY(0px)', opacity: 1, transition: `transform ${ENTER_MS}ms ${ENTER_EASING}, opacity ${ENTER_MS}ms ${ENTER_EASING}` };
    default:
      return { transform: 'none', opacity: 1, transition: 'none' };
  }
}
