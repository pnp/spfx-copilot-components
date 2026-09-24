/**
 * Pure game logic for Star Match — no React, no host dependencies, easy to unit test.
 */

/** The fixed set of numbers a player must fully use to win a round. */
export const ALL_NUMBERS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** How long (in seconds) a round lasts before the game is lost. */
export const GAME_DURATION_SECONDS: number = 60;

/** The maximum number of stars shown for any target. */
export const MAX_STARS: number = 9;

export type TileStatus = 'available' | 'candidate' | 'wrong' | 'used';

export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Returns every distinct sum achievable by adding together one or more of the
 * given numbers (each used at most once). Used to guarantee that the star
 * count drawn each round can actually be matched with the numbers still in play.
 */
export function getPossibleSums(numbers: readonly number[]): number[] {
  const sums = new Set<number>();
  const count = numbers.length;

  // Enumerate every non-empty subset via bitmask (numbers.length <= 9, so at most 511 subsets).
  for (let mask = 1; mask < (1 << count); mask++) {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      if (mask & (1 << i)) {
        sum += numbers[i];
      }
    }
    sums.add(sum);
  }

  return Array.from(sums);
}

/** Picks a random achievable star count from the numbers still available. Returns `undefined` if none remain. */
export function pickRandomTarget(numbers: readonly number[]): number | undefined {
  if (numbers.length === 0) {
    return undefined;
  }

  const possibleSums = getPossibleSums(numbers).filter((sum) => sum <= MAX_STARS);
  return possibleSums[Math.floor(Math.random() * possibleSums.length)];
}

/** Sums a set of numbers. */
export function sumOf(numbers: ReadonlySet<number>): number {
  let total = 0;
  numbers.forEach((n) => {
    total += n;
  });
  return total;
}
