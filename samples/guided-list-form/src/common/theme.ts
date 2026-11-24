import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { webDarkTheme, webLightTheme, type Theme } from '@fluentui/react-components';
import { normalizeHex, readableTextOn, shade } from './logic/color';

/** Host theme values are not always strings; a non-string token makes Fluent throw while writing CSS. */
export function readThemeColor(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}

/**
 * Maps the SharePoint page/section theme onto Fluent UI v9 (neutral SharePoint look, no branding).
 * Section themePrimary is often a light shade, so it is not copied onto the brand fill
 * (that would turn the primary button white on white).
 */
export function toFluentTheme(spTheme: IReadonlyTheme | undefined): Theme {
  const base: Theme = spTheme && spTheme.isInverted ? { ...webDarkTheme } : { ...webLightTheme };
  const semantic = spTheme && spTheme.semanticColors;
  if (!semantic) {
    return base;
  }
  const stroke = semantic.bodyDivider || semantic.variantBorder;
  return {
    ...base,
    colorNeutralBackground1: readThemeColor(semantic.bodyBackground, base.colorNeutralBackground1),
    colorNeutralForeground1: readThemeColor(semantic.bodyText, base.colorNeutralForeground1),
    colorNeutralForeground2: readThemeColor(semantic.bodySubtext, base.colorNeutralForeground2),
    colorNeutralStroke1: readThemeColor(stroke, base.colorNeutralStroke1),
    colorNeutralBackground3: readThemeColor(semantic.bodyStandoutBackground, base.colorNeutralBackground3),
    colorBrandForegroundLink: readThemeColor(semantic.link, base.colorBrandForegroundLink)
  };
}

/** Optional web part accent (hex only). Sets the brand fill with a readable text colour; anything else is ignored. */
export function applyAccent(theme: Theme, accent: string | undefined): Theme {
  const hex = normalizeHex(accent);
  if (!hex) {
    return theme;
  }
  const text = readableTextOn(hex);
  return {
    ...theme,
    colorBrandBackground: hex,
    colorBrandBackgroundHover: shade(hex, -0.12),
    colorBrandBackgroundPressed: shade(hex, -0.24),
    colorBrandBackgroundSelected: shade(hex, -0.12),
    colorCompoundBrandBackground: hex,
    colorCompoundBrandBackgroundHover: shade(hex, -0.12),
    colorCompoundBrandBackgroundPressed: shade(hex, -0.24),
    colorCompoundBrandStroke: hex,
    colorCompoundBrandStrokeHover: shade(hex, -0.12),
    colorCompoundBrandStrokePressed: shade(hex, -0.24),
    colorBrandStroke1: hex,
    colorNeutralForegroundOnBrand: text
  };
}
