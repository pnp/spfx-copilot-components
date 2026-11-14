// Copilot replaces the component iframe on some host transitions, so every replacement is a fresh
// instance and in-memory UI state is lost. State lives in sessionStorage, keyed per card: several
// cards in one conversation share the same storage.

import { isDesign, isLayout, type Design, type Layout } from './presets';
import type { ThemeChoice } from './strings/types';

export interface ICardState {
  design?: Design;
  layout?: Layout;
  /** Sentence index to resume the voiceover at. */
  sentence?: number;
}

const PREFIX: string = 'cosmopolite:v1:';

/** djb2, base 36: short, stable, good enough for a storage key. */
export function hash(input: string): string {
  let h: number = 5381;
  for (let i: number = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function cardKey(language: string | undefined, title: string, text: string): string {
  return `${PREFIX}card:${hash(`${language || ''}|${title}|${text}`)}`;
}

export function loadCardState(key: string): ICardState {
  try {
    const raw: string | null = window.sessionStorage.getItem(key);
    if (!raw) {
      return {};
    }
    const parsed: Record<string, unknown> = JSON.parse(raw);
    return {
      design: isDesign(parsed.design) ? parsed.design : undefined,
      layout: isLayout(parsed.layout) ? parsed.layout : undefined,
      sentence: typeof parsed.sentence === 'number' && parsed.sentence >= 0 ? Math.floor(parsed.sentence) : undefined
    };
  } catch {
    return {};
  }
}

export function saveCardState(key: string, state: ICardState): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage blocked (sandboxed / opaque origin): state stays in memory only.
  }
}

/** Counts component instances in this tab; > 1 means the host replaced the iframe. */
export function nextMount(): number {
  const key: string = `${PREFIX}mounts`;
  try {
    const n: number = (Number(window.sessionStorage.getItem(key)) || 0) + 1;
    window.sessionStorage.setItem(key, String(n));
    return n;
  } catch {
    return 1;
  }
}

// ---- user preferences (not per card) -----------------------------------------------------------
// The last chosen look is the starting point for the next card, also in a new chat, so it lives in
// localStorage; sessionStorage is the fallback where localStorage is blocked.

export interface IPreferences {
  design?: Design;
  layout?: Layout;
  theme: ThemeChoice;
  /** The footer's "Look" disclosure was left open. */
  lookOpen?: boolean;
}

const PREFS_KEY: string = `${PREFIX}preferences`;

function storages(): Storage[] {
  const list: Storage[] = [];
  try {
    list.push(window.localStorage);
  } catch {
    // localStorage access throws in some sandboxed iframes.
  }
  try {
    list.push(window.sessionStorage);
  } catch {
    // sessionStorage blocked as well: preferences last for this instance only.
  }
  return list;
}

export function loadPreferences(): IPreferences {
  for (const storage of storages()) {
    try {
      const raw: string | null = storage.getItem(PREFS_KEY);
      if (!raw) {
        continue;
      }
      const parsed: Record<string, unknown> = JSON.parse(raw);
      return {
        design: isDesign(parsed.design) ? parsed.design : undefined,
        layout: isLayout(parsed.layout) ? parsed.layout : undefined,
        theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : 'auto',
        lookOpen: parsed.lookOpen === true ? true : undefined
      };
    } catch {
      // unreadable or corrupt: try the next storage
    }
  }
  return { theme: 'auto' };
}

/** Merges `changes` into the stored preferences; written to the first storage that accepts it. */
export function savePreferences(changes: Partial<IPreferences>): IPreferences {
  const next: IPreferences = { ...loadPreferences(), ...changes };
  for (const storage of storages()) {
    try {
      storage.setItem(PREFS_KEY, JSON.stringify(next));
      break;
    } catch {
      // quota or blocked: try the next storage
    }
  }
  return next;
}
