// Shape of a UI string table. One file per language in this folder; English is bundled, all others
// are loaded on demand (see index.ts), so the main bundle stays small.

import type { Design, Layout } from '../presets';

export type LanguageSource = 'agent' | 'hostLocale' | 'sharePoint' | 'browser' | 'fallback';

export type ThemeChoice = 'auto' | 'light' | 'dark';

export interface IUiStrings {
  /** Name of this language, written in this language ("Deutsch", "日本語"). */
  languageName: string;
  detected: string;
  source: string;
  sources: Record<LanguageSource, string>;
  readAloud: string;
  pause: string;
  resume: string;
  stop: string;
  reading: string;
  paused: string;
  stopped: string;
  finished: string;
  /** {0}: language name */
  noVoice: string;
  speechUnavailable: string;
  expand: string;
  collapse: string;
  tellMore: string;
  /** {0}: card title. Sent to Copilot as the user's message. */
  tellMorePrompt: string;
  translateTo: string;
  /** {0}: target language name. Sent to Copilot as the user's message. */
  translatePrompt: string;
  design: string;
  designs: Record<Design, string>;
  /** {0}: design name */
  designChanged: string;
  /** Disclosure that holds the layout and design switches. */
  look: string;
  layout: string;
  layouts: Record<Layout, string>;
  /** {0}: layout name */
  layoutChanged: string;
  theme: string;
  themes: Record<ThemeChoice, string>;
  /** {0}: theme name */
  themeChanged: string;
  photo: string;
  noImage: string;
  diagnostics: string;
  sent: string;
  sendFailed: string;
  linkFailed: string;
  loading: string;
  /** {0}: formatted duration */
  readingTime: string;
  /** {0}: language name the text is actually written in */
  textIn: string;
  /** {0}: language name the user asked in */
  askedFor: string;
  /** {0}: language name. Button label. */
  rewriteIn: string;
  /** {0}: language name. Sent to Copilot as the user's message. */
  rewritePrompt: string;
}

/** Replaces {0}, {1}, … with the arguments. */
export function format(template: string, ...args: string[]): string {
  return template.replace(/\{(\d+)\}/g, (match: string, index: string) => {
    const value: string | undefined = args[Number(index)];
    return value === undefined ? match : value;
  });
}
