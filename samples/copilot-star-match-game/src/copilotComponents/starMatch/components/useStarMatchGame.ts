import * as React from 'react';

import {
  ALL_NUMBERS,
  GAME_DURATION_SECONDS,
  pickRandomTarget,
  sumOf
} from './gameLogic';
import type { GameStatus, TileStatus } from './gameLogic';

export interface IStarMatchGameState {
  /** Status of each of the nine numbers, keyed by the number itself. */
  tileStatuses: Record<number, TileStatus>;
  /** The number of stars the player must currently match. `undefined` once the game ends. */
  target: number | undefined;
  /** Sum of the numbers currently selected (candidates/wrong tiles). */
  selectedSum: number;
  /** Seconds remaining in the round. */
  timeLeft: number;
  /** Overall round status. */
  status: GameStatus;
  /** Toggles a number tile on/off. No-op for `used` tiles or once the round has ended. */
  toggleNumber: (n: number) => void;
  /** Resets the board, timer, and target — starting a brand-new round. */
  reset: () => void;
}

/**
 * Drives all Star Match game state: which numbers are used/selected, the
 * current star target, the countdown timer, and win/lose detection.
 */
export function useStarMatchGame(durationSeconds: number = GAME_DURATION_SECONDS): IStarMatchGameState {
  const [used, setUsed] = React.useState<Set<number>>(new Set());
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [target, setTarget] = React.useState<number | undefined>(() => pickRandomTarget(ALL_NUMBERS));
  const [timeLeft, setTimeLeft] = React.useState<number>(durationSeconds);
  const [status, setStatus] = React.useState<GameStatus>('playing');

  const selectedSum = sumOf(selected);

  // Resolve a match: once the selected numbers add up to the target, lock them in as "used".
  React.useEffect(() => {
    if (status !== 'playing' || target === undefined || selectedSum !== target || selected.size === 0) {
      return;
    }

    setUsed((prevUsed) => {
      const nextUsed = new Set(prevUsed);
      selected.forEach((n) => nextUsed.add(n));
      return nextUsed;
    });
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSum, target, status]);

  // After numbers are used, draw the next (always-playable) target or declare victory.
  React.useEffect(() => {
    if (status !== 'playing' || used.size === 0) {
      return;
    }

    const remaining = ALL_NUMBERS.filter((n) => !used.has(n));
    if (remaining.length === 0) {
      setStatus('won');
      setTarget(undefined);
      return;
    }

    setTarget(pickRandomTarget(remaining));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [used]);

  // Countdown timer — the round is lost if time runs out before all numbers are used.
  React.useEffect(() => {
    if (status !== 'playing') {
      return undefined;
    }
    if (timeLeft <= 0) {
      setStatus('lost');
      return undefined;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  const toggleNumber = React.useCallback((n: number): void => {
    if (status !== 'playing' || used.has(n)) {
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        next.add(n);
      }
      return next;
    });
  }, [status, used]);

  const reset = React.useCallback((): void => {
    setUsed(new Set());
    setSelected(new Set());
    setTarget(pickRandomTarget(ALL_NUMBERS));
    setTimeLeft(durationSeconds);
    setStatus('playing');
  }, [durationSeconds]);

  const tileStatuses = React.useMemo(() => {
    const isOverSum = target !== undefined && selectedSum > target;
    const statuses: Record<number, TileStatus> = {};
    ALL_NUMBERS.forEach((n) => {
      if (used.has(n)) {
        statuses[n] = 'used';
      } else if (selected.has(n)) {
        statuses[n] = isOverSum ? 'wrong' : 'candidate';
      } else {
        statuses[n] = 'available';
      }
    });
    return statuses;
  }, [used, selected, target, selectedSum]);

  return { tileStatuses, target, selectedSum, timeLeft, status, toggleNumber, reset };
}
