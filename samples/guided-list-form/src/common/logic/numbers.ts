/** A finite decimal, with an optional leading minus. No exponents (keeps the live check honest). */
const NUMBER_PATTERN = /^-?(?:\d+|\d*\.\d+)$/;

export const NUMBER_MAX_ABS = 1e15;

/** True when the typed value is a safe finite number (not blank). */
export function isValidNumberInput(raw: string): boolean {
  return parseNumberInput(raw) !== undefined;
}

/** Parses a typed number, or undefined when it isn't a safe finite value. */
export function parseNumberInput(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && Math.abs(raw) <= NUMBER_MAX_ABS ? raw : undefined;
  }
  if (typeof raw !== 'string') {
    return undefined;
  }
  const text = raw.trim();
  if (!text || !NUMBER_PATTERN.test(text)) {
    return undefined;
  }
  const value = Number(text);
  return Number.isFinite(value) && Math.abs(value) <= NUMBER_MAX_ABS ? value : undefined;
}
