/**
 * Finds the environment or the agent that the conversation names. The model can
 * change the case, the punctuation, or the spelling of a name, so an exact
 * comparison is too strict. When more than one item matches, the result is
 * ambiguous, and the user chooses in the view.
 */

export interface NamedItem {
  id: string;
  name: string;
}

export interface NameMatch<TItem> {
  /** The only item that matches. */
  item?: TItem;
  /** True when more than one item matches. */
  ambiguous: boolean;
}

/** The suffix that Copilot Studio adds to the name of the default environment, for example "Contoso (default)". */
const DEFAULT_SUFFIX = /\s*\(default\)\s*$/i;

/** The comparison key: lower case, with only letters, marks, and numbers. "Kit – Dev." gives "kitdev". */
export function nameKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "");
}

/** The largest spelling difference for a key of this length. A short key must be equal. */
function distanceLimit(length: number): number {
  if (length >= 12) return 2;
  return length >= 6 ? 1 : 0;
}

/** The numbers in a key. Names with different numbers, for example "Dev 1" and "Dev 2", never match. */
function numbers(key: string): string {
  return (key.match(/\p{N}+/gu) ?? []).join(" ");
}

/**
 * The optimal string alignment distance: insert, delete, or replace one
 * character, or swap two adjacent characters. A distance that is more than the
 * limit gives limit + 1.
 */
function editDistance(left: readonly string[], right: readonly string[], limit: number): number {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    let rowMinimum = row;
    for (let column = 1; column <= right.length; column++) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      let value = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + cost,
      );
      if (
        row > 1
        && column > 1
        && left[row - 1] === right[column - 2]
        && left[row - 2] === right[column - 1]
      ) {
        value = Math.min(value, beforePrevious[column - 2] + 1);
      }
      current[column] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }
    if (rowMinimum > limit) return limit + 1;
    beforePrevious = previous;
    previous = current;
  }
  return Math.min(previous[right.length], limit + 1);
}

function only<TItem>(matches: TItem[]): NameMatch<TItem> | undefined {
  if (matches.length === 0) return undefined;
  return matches.length === 1 ? { item: matches[0], ambiguous: false } : { ambiguous: true };
}

/**
 * Finds one item by its ID, else by its name. The first step that finds an
 * item gives the result:
 * 1. The same name, without case.
 * 2. The same key (see nameKey), so case, spaces, and punctuation do not
 *    change the result.
 * 3. The same key without the "(default)" suffix of the item name, so
 *    "Contoso" finds "Contoso (default)".
 * 4. A key with a small spelling difference and the same numbers.
 */
export function matchByIdOrName<TItem extends NamedItem>(
  items: readonly TItem[],
  id?: string,
  name?: string,
): NameMatch<TItem> {
  const normalizedId = id?.trim().toLowerCase();
  const byId = normalizedId
    ? items.find((item) => item.id.toLowerCase() === normalizedId)
    : undefined;
  if (byId) return { item: byId, ambiguous: false };

  const trimmed = name?.trim() ?? "";
  if (!trimmed) return { ambiguous: false };
  const text = trimmed.toLowerCase();
  const exact = only(items.filter((item) => item.name.trim().toLowerCase() === text));
  if (exact) return exact;

  const key = nameKey(trimmed);
  if (!key) return { ambiguous: false };
  const keyed = items.map((item) => ({ item, key: nameKey(item.name) }));
  const sameKey = only(keyed.filter((entry) => entry.key === key).map((entry) => entry.item));
  if (sameKey) return sameKey;

  const withoutDefault = only(items.filter((item) =>
    DEFAULT_SUFFIX.test(item.name) && nameKey(item.name.replace(DEFAULT_SUFFIX, "")) === key));
  if (withoutDefault) return withoutDefault;

  const characters = Array.from(key);
  const limit = distanceLimit(characters.length);
  if (limit === 0) return { ambiguous: false };
  const keyNumbers = numbers(key);
  const near = keyed.filter((entry) =>
    entry.key !== ""
    && numbers(entry.key) === keyNumbers
    && editDistance(characters, Array.from(entry.key), limit) <= limit);
  return only(near.map((entry) => entry.item)) ?? { ambiguous: false };
}
