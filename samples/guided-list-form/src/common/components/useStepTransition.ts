import * as React from 'react';
import type { Direction } from '../logic/navigation';
import { ENTER_MS, EXIT_MS, motionStyle, type IMotionStyle, type MotionPhase } from '../logic/motion';

export interface IStepTransition {
  style: IMotionStyle;
  /** True while a transition runs; input is ignored so a double Enter can't skip a step. */
  isBusy(): boolean;
  /** Runs the exit animation, calls commit() to swap the screen, then runs the entrance. Instant when motion is off. */
  run(direction: Direction, commit: () => void): void;
}

function nextFrame(win: Window | undefined, fn: () => void): void {
  if (win && typeof win.requestAnimationFrame === 'function') {
    win.requestAnimationFrame(() => win.requestAnimationFrame(fn));
  } else {
    setTimeout(fn, 32);
  }
}

export function useStepTransition(enabled: boolean, compact: boolean, win?: Window): IStepTransition {
  const [anim, setAnim] = React.useState<{ phase: MotionPhase; direction: Direction }>({ phase: 'idle', direction: 'forward' });
  const busy = React.useRef(false);
  const alive = React.useRef(true);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const run = React.useCallback(
    (direction: Direction, commit: () => void): void => {
      if (busy.current || !enabled) {
        // Callers guard user input with isBusy(); a programmatic commit during a transition is applied straight away.
        commit();
        return;
      }
      busy.current = true;
      setAnim({ phase: 'exit', direction });
      timers.current.push(
        setTimeout(() => {
          if (!alive.current) {
            return;
          }
          commit();
          setAnim({ phase: 'enterFrom', direction });
          nextFrame(win, () => {
            if (!alive.current) {
              return;
            }
            setAnim({ phase: 'enter', direction });
            timers.current.push(
              setTimeout(() => {
                busy.current = false;
                if (alive.current) {
                  setAnim({ phase: 'idle', direction });
                }
              }, ENTER_MS)
            );
          });
        }, EXIT_MS)
      );
    },
    [enabled, win]
  );

  return {
    style: motionStyle(enabled ? anim.phase : 'idle', anim.direction, compact),
    isBusy: () => busy.current,
    run
  };
}
