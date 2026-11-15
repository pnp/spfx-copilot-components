import { maxGuidelineChars } from '../domain/contracts';
import { checkGroups, type CheckGroup } from '../domain/checkCatalog';

export type RulesStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface IRulesStore {
  load(): string;
  save(text: string): void;
  /** Which checks without AI are on; undefined when the reviewer never changed them. */
  loadGroups?(): CheckGroup[] | undefined;
  saveGroups?(groups: readonly CheckGroup[]): void;
  /** Whether the harmful-wording check is on; undefined when the reviewer never changed it. */
  loadHarmful?(): boolean | undefined;
  saveHarmful?(on: boolean): void;
}

/** Longest guidelines text kept: twice the checked length, so text the reviewer is still shortening is not cut. */
const maxStoredChars = 2 * maxGuidelineChars;

/**
 * Writing guidelines remembered in this browser, per tenant and user. The host frame's storage can be
 * partitioned per host or blocked, so every access is best effort. A restored review keeps its own rules
 * and does not read them from here.
 */
export function createRulesStore(options: { storage: () => RulesStorage; tenantUrl: string; userId: string }): IRulesStore {
  const scope = `${encodeURIComponent(new URL(options.tenantUrl).origin.toLowerCase())}:${encodeURIComponent(options.userId.trim())}`;
  const key = `content-lens.rules.v1:${scope}`;
  const groupsKey = `content-lens.checks.v1:${scope}`;
  const harmfulKey = `content-lens.harmful.v1:${scope}`;
  return {
    load: () => {
      try {
        const value = options.storage().getItem(key);
        return typeof value === 'string' ? value.slice(0, maxStoredChars) : '';
      } catch {
        return '';
      }
    },
    save: text => {
      // The text is stored as written. Blank text removes the stored value.
      try {
        if (text.trim()) options.storage().setItem(key, text.slice(0, maxStoredChars));
        else options.storage().removeItem(key);
      } catch {
        /* The guidelines stay usable for this card. */
      }
    },
    loadGroups: () => {
      try {
        const raw = options.storage().getItem(groupsKey);
        if (raw === null) return undefined;
        const value: unknown = JSON.parse(raw);
        return Array.isArray(value) ? checkGroups.filter(group => value.indexOf(group) >= 0) : undefined;
      } catch {
        return undefined;
      }
    },
    saveGroups: groups => {
      try {
        options.storage().setItem(groupsKey, JSON.stringify(checkGroups.filter(group => groups.indexOf(group) >= 0)));
      } catch {
        /* The choice stays for this card. */
      }
    },
    loadHarmful: () => {
      try {
        const raw = options.storage().getItem(harmfulKey);
        return raw === null ? undefined : raw === 'on';
      } catch {
        return undefined;
      }
    },
    saveHarmful: on => {
      try {
        options.storage().setItem(harmfulKey, on ? 'on' : 'off');
      } catch {
        /* The choice stays for this card. */
      }
    }
  };
}
