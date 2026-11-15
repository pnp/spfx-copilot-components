import { z } from 'zod';
import { validateReviewSession, type ReviewSession } from './reviewSession';
import { utf8Bytes } from '../roundTrip/evidence';

/** The part of browser storage the per-card caches use. */
export type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface IReviewCache {
  get(): ReviewSession | undefined;
  save(review: ReviewSession): void;
  clear(): void;
}

const maxStoredBytes = 2 * 1024 * 1024;
const schema = z.object({
  entries: z.array(z.object({ scope: z.string().min(1).max(256), review: z.unknown() }).strict()).max(3)
}).strict();

export function createReviewCache(options: { storage(): TabStorage; tenantUrl: string; userId: string; scope: string }): IReviewCache {
  // Completed Page and Comments reviews, per tenant and user. Each entry belongs to one card, named by its scope.
  const tenant = encodeURIComponent(new URL(options.tenantUrl).origin.toLowerCase());
  const key = `content-lens.reviews.v1:${tenant}:${encodeURIComponent(options.userId)}`;
  const read = (): z.infer<typeof schema> => {
    try {
      const raw = options.storage().getItem(key);
      if (raw && utf8Bytes(raw) <= maxStoredBytes) return schema.parse(JSON.parse(raw));
    } catch {
      /* A stored value that cannot be read counts as an empty cache. */
    }
    return { entries: [] };
  };
  return {
    get: () => {
      try {
        const value = read().entries.find(entry => entry.scope === options.scope)?.review;
        return value ? validateReviewSession(value) : undefined;
      } catch {
        return undefined;
      }
    },
    save: review => {
      try {
        if (!options.scope || options.scope.length > 256) return;
        const copy = validateReviewSession(review);
        delete copy.autoContinuePage;
        if (copy.request.mode === 'page') delete copy.scan;
        const otherCards = read().entries.filter(entry => entry.scope !== options.scope);
        let entries = [...otherCards, { scope: options.scope, review: copy }].slice(-3);
        let raw = JSON.stringify({ entries });
        // Drop the oldest entries until the cache fits.
        while (utf8Bytes(raw) > maxStoredBytes && entries.length > 1) {
          entries = entries.slice(1);
          raw = JSON.stringify({ entries });
        }
        if (utf8Bytes(raw) <= maxStoredBytes) options.storage().setItem(key, raw);
      } catch {
        /* The results stay on screen when storage is unavailable. */
      }
    },
    clear: () => {
      try {
        options.storage().setItem(key, JSON.stringify({
          entries: read().entries.filter(entry => entry.scope !== options.scope)
        }));
      } catch {
        /* Best effort: the entry stays when storage is unavailable. */
      }
    }
  };
}
