/** Neutral fallbacks (Fluent UI) for when no SharePoint site theme is available, for example in Copilot. */
export const NEUTRAL = {
  primary: '#0F6CBD',
  primaryDark: '#115EA3',
  primaryLighter: '#EBF3FC',
  white: '#FFFFFF',
  black: '#242424',
  text: '#242424',
  border: '#C8C6C4',
  surface: '#FAF9F8'
};

export interface IBrandColors {
  bannerBg: string;
  bannerText: string;
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  accent: string;
  accentText: string;
  surface: string;
  cardBg: string;
  text: string;
  border: string;
  selectedBorder: string;
  correctFill: string;
  correctText: string;
  focus: string;
}

export interface IBrandOverrides {
  bannerColor?: string;
  buttonColor?: string;
  accentColor?: string;
}

export interface ISiteThemeInput {
  palette?: { [key: string]: string | undefined };
  semanticColors?: { [key: string]: string | undefined };
  isInverted?: boolean;
}

const HEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

export function normalizeHex(value: string | undefined): string | undefined {
  const v = (value || '').trim();
  if (!HEX.test(v)) {
    return undefined;
  }
  const full = v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v;
  return full.toUpperCase();
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const h = normalizeHex(hex) || '#000000';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or near-black, whichever reads better on the background. */
export function readableText(background: string): string {
  return contrastRatio(background, NEUTRAL.white) >= contrastRatio(background, NEUTRAL.black) ? NEUTRAL.white : NEUTRAL.black;
}

/**
 * Colours from the SharePoint site theme (web part), or neutral Fluent defaults when there is
 * no theme (Copilot). Text colours are picked for contrast against their background.
 */
export function siteThemeColors(theme: ISiteThemeInput | undefined): IBrandColors {
  const p = theme?.palette || {};
  const s = theme?.semanticColors || {};
  const themed = !!normalizeHex(p.themePrimary);
  const primary = normalizeHex(p.themePrimary) || NEUTRAL.primary;
  const dark = normalizeHex(p.themeDark) || normalizeHex(p.themeDarkAlt) || (themed ? primary : NEUTRAL.primaryDark);
  const lighter = normalizeHex(p.themeLighter) || NEUTRAL.primaryLighter;
  const bodyBg = normalizeHex(s.bodyBackground) || normalizeHex(p.white) || NEUTRAL.white;
  const bodyText = normalizeHex(s.bodyText) || normalizeHex(p.neutralPrimary) || NEUTRAL.text;
  const border = normalizeHex(p.neutralTertiaryAlt) || normalizeHex(p.neutralLight) || NEUTRAL.border;
  const surface = normalizeHex(p.neutralLighterAlt) || normalizeHex(s.bodyStandoutBackground) || NEUTRAL.surface;
  return {
    bannerBg: primary,
    bannerText: readableText(primary),
    buttonBg: primary,
    buttonText: readableText(primary),
    buttonHover: dark,
    accent: normalizeHex(p.themeTertiary) || primary,
    accentText: readableText(normalizeHex(p.themeTertiary) || primary),
    surface,
    cardBg: bodyBg,
    text: bodyText,
    border,
    selectedBorder: primary,
    correctFill: lighter,
    correctText: readableText(lighter) === NEUTRAL.white ? NEUTRAL.white : contrastRatio(lighter, dark) >= 4.5 ? dark : readableText(lighter),
    focus: dark
  };
}

/** Site theme (or neutral defaults) with the optional hex overrides from the property pane on top. */
export function resolveBrandColors(theme: ISiteThemeInput | undefined, overrides: IBrandOverrides = {}): IBrandColors {
  const base = siteThemeColors(theme);
  const banner = normalizeHex(overrides.bannerColor);
  const button = normalizeHex(overrides.buttonColor);
  const accent = normalizeHex(overrides.accentColor);
  return {
    ...base,
    ...(banner ? { bannerBg: banner, bannerText: readableText(banner) } : {}),
    ...(button ? { buttonBg: button, buttonHover: button, buttonText: readableText(button), selectedBorder: button } : {}),
    ...(accent ? { accent, accentText: readableText(accent) } : {})
  };
}

/** CSS custom properties consumed by styles.ts. */
export function brandCssVariables(colors: IBrandColors): { [name: string]: string } {
  return {
    '--wpq-banner-bg': colors.bannerBg,
    '--wpq-banner-text': colors.bannerText,
    '--wpq-button-bg': colors.buttonBg,
    '--wpq-button-text': colors.buttonText,
    '--wpq-button-hover': colors.buttonHover,
    '--wpq-accent': colors.accent,
    '--wpq-accent-text': colors.accentText,
    '--wpq-surface': colors.surface,
    '--wpq-card-bg': colors.cardBg,
    '--wpq-text': colors.text,
    '--wpq-border': colors.border,
    '--wpq-selected-border': colors.selectedBorder,
    '--wpq-correct-fill': colors.correctFill,
    '--wpq-correct-text': colors.correctText,
    '--wpq-focus': colors.focus
  };
}
