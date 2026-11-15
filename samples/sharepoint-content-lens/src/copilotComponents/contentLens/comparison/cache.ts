import { z } from 'zod';
import { utf8Bytes } from '../roundTrip/evidence';
import type { TabStorage } from '../services/reviewCache';
import { comparisonStateSchema, type ComparisonState } from './contracts';

export interface IComparisonCache {
  get(): ComparisonState | undefined;
  save(value: ComparisonState): boolean;
  clear(): void;
}
const maxBytes = 2 * 1024 * 1024;
const cacheSchema = z.object({
  version: z.literal(1),
  entries: z.array(z.object({
    scope: z.string().min(1).max(256),
    state: comparisonStateSchema
  }).strict()).max(3)
}).strict();

/**
 * Keeps the three most recent comparisons of one user in tab storage, one entry per component instance (scope).
 * A comparison does not depend on a review or an analysis request. Each instance reads only its own entry.
 */
export function createComparisonCache(options: {
  storage(): TabStorage;
  tenantUrl: string;
  userId: string;
  scope: string;
}): IComparisonCache {
  const tenant = encodeURIComponent(new URL(options.tenantUrl).origin.toLowerCase());
  const user = encodeURIComponent(options.userId.trim());
  const key = `content-lens.comparisons.v1:${tenant}:${user}`;
  const read = (): z.infer<typeof cacheSchema> => {
    try {
      const raw = options.storage().getItem(key);
      if (raw && utf8Bytes(raw) <= maxBytes) return cacheSchema.parse(JSON.parse(raw));
    } catch {
      // Storage is optional; comparisons stay usable in memory.
    }
    return { version: 1, entries: [] };
  };
  return {
    get: () => read().entries.find(entry => entry.scope === options.scope)?.state,
    save: state => {
      try {
        if (!options.scope || options.scope.length > 256) return false;
        const valid = comparisonStateSchema.parse(state);
        const others = read().entries.filter(entry => entry.scope !== options.scope);
        let entries = [...others, { scope: options.scope, state: valid }].slice(-3);
        let raw = JSON.stringify({ version: 1, entries });
        // Drop the oldest entries until the value fits.
        while (entries.length > 1 && utf8Bytes(raw) > maxBytes) {
          entries = entries.slice(1);
          raw = JSON.stringify({ version: 1, entries });
        }
        if (utf8Bytes(raw) > maxBytes) return false;
        options.storage().setItem(key, raw);
        // Report success only when the stored value reads back unchanged.
        const stored = read().entries.find(entry => entry.scope === options.scope)?.state;
        return JSON.stringify(stored) === JSON.stringify(valid);
      } catch {
        return false;
      }
    },
    clear: () => {
      try {
        const entries = read().entries.filter(entry => entry.scope !== options.scope);
        if (entries.length) options.storage().setItem(key, JSON.stringify({ version: 1, entries }));
        else options.storage().removeItem(key);
      } catch {
        // Best effort. The review cache is a separate store and stays as it is.
      }
    }
  };
}
