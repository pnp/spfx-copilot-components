import type { Theme } from '@fluentui/react-components';
import { contrastRatio, normalizeHex, relativeLuminance, shade } from './color';

/**
 * The gradient panel the wizard sits on (v1.2): the default forest-to-teal palette (deep forest green to teal,
 * with a subtle navy depth in the far corner). A web part accent colour replaces the two gradient stops,
 * darkened until white text stays readable. Coral is the accent for the progress fill, selection and focus details.
 */
export interface IGradient {
  start: string;
  end: string;
}

export const DEFAULT_GRADIENT: IGradient = { start: '#183a35', end: '#0f7f72' };
/** Navy depth laid over the far (bottom-right) corner. */
export const DEPTH = '#18233a';
/** Default forest-to-teal palette. Coral is never used for small text on the gradient (it is under 3:1 on teal). */
export const PALETTE = {
  heading: '#ffffff',
  body: '#f7f5f1',
  helper: '#ddf1ec',
  coral: '#f2643d',
  coralHover: '#c9472a',
  pill: '#f7f5f1',
  pillText: '#183a35'
};
/** Dark green text for the cream pill buttons. */
export const PILL_TEXT = PALETTE.pillText;
/** White on the darker accent stop must reach at least this ratio; the lighter stop at least AA (4.5). */
export const MIN_WHITE_CONTRAST = 7;
export const MIN_WHITE_CONTRAST_END = 4.5;

/** Darkens a colour step by step until white text on it reaches the given contrast ratio. */
export function darkenForWhite(hex: string, minRatio: number = MIN_WHITE_CONTRAST): string {
  let c = hex;
  for (let i = 0; i < 40 && contrastRatio(c, '#ffffff') < minRatio; i++) {
    c = shade(c, -0.06);
  }
  return c;
}

/** True when the host background is dark (dark SharePoint section or Copilot dark mode). */
export function isDarkTheme(theme: Theme | undefined): boolean {
  const bg = normalizeHex(theme ? theme.colorNeutralBackground1 : '');
  return !!bg && relativeLuminance(bg) < 0.2;
}

export function gradientFor(accent: string | undefined, dark: boolean): IGradient {
  const hex = normalizeHex(accent);
  const g = hex ? { start: darkenForWhite(hex), end: darkenForWhite(shade(hex, -0.3), MIN_WHITE_CONTRAST_END) } : { ...DEFAULT_GRADIENT };
  return dark ? { start: shade(g.start, -0.22), end: shade(g.end, -0.22) } : g;
}

/**
 * CSS background: 135° diagonal gradient with a subtle navy depth in the far corner. The lighter stop sits
 * towards the bottom right so the centred text column stays on the darker, higher-contrast middle.
 */
export function gradientBackground(g: IGradient): string {
  return `radial-gradient(70% 60% at 100% 100%, rgba(24,35,58,0.55) 0%, rgba(24,35,58,0) 100%), linear-gradient(135deg, ${g.start} 0%, ${g.end} 100%)`;
}

export const DEFAULT_FOCUS_RING = '#ffffff';
export const DEFAULT_FINISH_TICK = '#183a35';
/** Minimum contrast for the highlight on the gradient (progress bar and focus ring). */
export const MIN_HIGHLIGHT_CONTRAST = 3;

export interface IHighlightVars {
  highlight: string;
  highlightHover: string;
  focusRing: string;
  focusGlow: string;
  finishStroke: string;
  finishTick: string;
}

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function contrastFit(hex: string, background: string, minRatio: number): string {
  let c = hex;
  const darkBg = relativeLuminance(background) < 0.5;
  for (let i = 0; i < 40 && contrastRatio(c, background) < minRatio; i++) {
    c = shade(c, darkBg ? 0.08 : -0.08);
  }
  if (contrastRatio(c, background) < minRatio) {
    c = hex;
    for (let i = 0; i < 40 && contrastRatio(c, background) < minRatio; i++) {
      c = shade(c, darkBg ? -0.08 : 0.08);
    }
  }
  return c;
}

/**
 * Tokens for the optional highlight colour (progress bar, finish circle + tick, focus ring).
 * Empty or invalid hex keeps the current coral / white defaults. A contrast guard lifts or
 * darkens a custom colour until it reads on the gradient and the cream finish badge.
 */
export function highlightVars(hex: string | undefined, onBackground: string): IHighlightVars {
  const raw = normalizeHex(hex);
  if (!raw) {
    return {
      highlight: PALETTE.coral,
      highlightHover: PALETTE.coralHover,
      focusRing: DEFAULT_FOCUS_RING,
      focusGlow: 'rgba(242, 100, 61, 0.45)',
      finishStroke: PALETTE.coral,
      finishTick: DEFAULT_FINISH_TICK
    };
  }
  const fill = contrastFit(raw, onBackground || DEFAULT_GRADIENT.start, MIN_HIGHLIGHT_CONTRAST);
  const cream = PALETTE.pill;
  let tick = fill;
  if (contrastRatio(tick, cream) < MIN_HIGHLIGHT_CONTRAST) {
    tick = contrastFit(fill, cream, MIN_HIGHLIGHT_CONTRAST);
    if (contrastRatio(tick, cream) < MIN_HIGHLIGHT_CONTRAST) {
      tick = DEFAULT_FINISH_TICK;
    }
  }
  return {
    highlight: fill,
    highlightHover: shade(fill, -0.18),
    focusRing: fill,
    focusGlow: rgba(fill, 0.45),
    finishStroke: fill,
    finishTick: tick
  };
}

export function highlightCssVars(hex: string | undefined, onBackground: string): Record<string, string> {
  const v = highlightVars(hex, onBackground);
  return {
    '--wiz-highlight': v.highlight,
    '--wiz-highlight-hover': v.highlightHover,
    '--wiz-focus-ring': v.focusRing,
    '--wiz-focus-glow': v.focusGlow,
    '--wiz-finish-stroke': v.finishStroke,
    '--wiz-finish-tick': v.finishTick
  };
}

/**
 * Fluent tokens for content on the gradient: dark-theme base, white text, white focus rings and
 * translucent white hovers, so Fluent pieces (message bars, spinner, subtle buttons) fit the panel.
 */
export function onGradientTheme(base: Theme, darkTheme: Theme): Theme {
  const white = '#ffffff';
  return {
    ...darkTheme,
    fontFamilyBase: base.fontFamilyBase,
    colorNeutralForeground1: PALETTE.body,
    colorNeutralForeground1Hover: white,
    colorNeutralForeground1Pressed: white,
    colorNeutralForeground2: PALETTE.body,
    colorNeutralForeground2Hover: white,
    colorNeutralForeground2Pressed: white,
    colorNeutralForeground2BrandHover: white,
    colorNeutralForeground2BrandPressed: white,
    colorNeutralForeground3: PALETTE.helper,
    colorBrandForeground1: white,
    colorBrandForeground2: white,
    colorBrandForegroundLink: white,
    colorBrandForegroundLinkHover: white,
    colorBrandForegroundLinkPressed: white,
    colorSubtleBackground: 'transparent',
    colorSubtleBackgroundHover: 'rgba(255,255,255,0.14)',
    colorSubtleBackgroundPressed: 'rgba(255,255,255,0.22)',
    colorTransparentBackgroundHover: 'rgba(255,255,255,0.14)',
    colorStrokeFocus1: PILL_TEXT,
    colorStrokeFocus2: white,
    colorBrandStroke1: PILL_TEXT,
    colorBrandStroke2: 'rgba(24,58,53,0.25)'
  };
}
