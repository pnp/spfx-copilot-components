/**
 * Cleans the arguments that Copilot sends. The local tools reject values that
 * are not valid. A value that is not valid is omitted, so the user can choose
 * it in the view.
 */
const GUID = /^\{?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\}?$/i;

export function guidValue(value: unknown): string | undefined {
  const match = typeof value === 'string' ? GUID.exec(value.trim()) : null;
  return match ? match[1].toLowerCase() : undefined;
}

export function textValue(value: unknown, maxLength: number): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && text.length <= maxLength ? text : undefined;
}

/** Removes the keys that have no value. */
export function compact(input: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}
