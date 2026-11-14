// The card's look (design, layout, theme) comes from four places with a fixed precedence:
// this card's own switches > what the user asked for in this turn > the last choice on any card >
// the default. Pure, so the precedence is tested without a DOM.

import { DEFAULT_DESIGN, DEFAULT_LAYOUT, type Design, type Layout } from './presets';
import type { ICardState, IPreferences } from './state';
import type { ThemeChoice } from './strings/types';

export type Theme = 'light' | 'dark';

export interface ILookSources {
  /** This card's own choices (sessionStorage). */
  card: ICardState;
  /** The agent's tool input for this turn. */
  input: { design: Design | undefined; layout: Layout | undefined };
  /** The user's last choices on any card (localStorage). */
  prefs: IPreferences;
  /** hostContext.theme */
  hostTheme: string | undefined;
}

export interface ILook {
  design: Design;
  layout: Layout;
  /** What the user picked: 'auto' follows the host. */
  themeChoice: ThemeChoice;
  /** What is rendered. */
  theme: Theme;
}

export function resolveTheme(choice: ThemeChoice, hostTheme: string | undefined): Theme {
  if (choice !== 'auto') {
    return choice;
  }
  return hostTheme === 'dark' ? 'dark' : 'light';
}

export function resolveLook(sources: ILookSources): ILook {
  const { card, input, prefs, hostTheme } = sources;
  return {
    design: card.design || input.design || prefs.design || DEFAULT_DESIGN,
    layout: card.layout || input.layout || prefs.layout || DEFAULT_LAYOUT,
    themeChoice: prefs.theme,
    theme: resolveTheme(prefs.theme, hostTheme)
  };
}
