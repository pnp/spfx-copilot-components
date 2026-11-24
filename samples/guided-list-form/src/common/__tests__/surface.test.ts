import { webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { contrastRatio, relativeLuminance } from '../logic/color';
import { DEFAULT_GRADIENT, DEPTH, PALETTE, darkenForWhite, gradientBackground, gradientFor, isDarkTheme, onGradientTheme } from '../logic/surface';

describe('gradient surface (default forest-to-teal palette)', () => {
  it('defaults to deep forest green to teal, with a navy depth in the far corner', () => {
    expect(DEFAULT_GRADIENT).toEqual({ start: '#183a35', end: '#0f7f72' });
    expect(gradientFor('', false)).toEqual(DEFAULT_GRADIENT);
    expect(gradientFor('not a colour', false)).toEqual(DEFAULT_GRADIENT);
    const css = gradientBackground(DEFAULT_GRADIENT);
    expect(css).toContain('linear-gradient(135deg, #183a35 0%, #0f7f72 100%)');
    expect(DEPTH).toBe('#18233a');
    expect(css).toContain('rgba(24,35,58,');
  });

  it('keeps white and cream text at WCAG AA on both default stops', () => {
    expect(contrastRatio(DEFAULT_GRADIENT.start, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DEFAULT_GRADIENT.end, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DEFAULT_GRADIENT.start, PALETTE.body)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DEFAULT_GRADIENT.start, PALETTE.helper)).toBeGreaterThanOrEqual(4.5);
  });

  it('cream pill with dark green text is well above AA', () => {
    expect(contrastRatio(PALETTE.pill, PALETTE.pillText)).toBeGreaterThanOrEqual(7);
  });

  it('coral is too light for small text on teal, so it is only used for fills, rings and focus details', () => {
    expect(contrastRatio(PALETTE.coral, DEFAULT_GRADIENT.end)).toBeLessThan(3);
    // As a non-text indicator (progress fill) it still clears 3:1 on the darker top of the panel.
    expect(contrastRatio(PALETTE.coral, DEFAULT_GRADIENT.start)).toBeGreaterThanOrEqual(3);
  });

  it('an accent colour tints the gradient, darkened until white text is readable', () => {
    const g = gradientFor('#ffd700', false);
    expect(contrastRatio(g.start, '#ffffff')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(g.end, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(gradientFor('#107C10', false).start).not.toBe(DEFAULT_GRADIENT.start);
    expect(darkenForWhite('#000000')).toBe('#000000');
  });

  it('goes deeper on a dark host', () => {
    const light = gradientFor('', false);
    const dark = gradientFor('', true);
    expect(relativeLuminance(dark.start)).toBeLessThan(relativeLuminance(light.start));
    expect(relativeLuminance(dark.end)).toBeLessThan(relativeLuminance(light.end));
  });

  it('detects a dark host from the theme background', () => {
    expect(isDarkTheme(webDarkTheme)).toBe(true);
    expect(isDarkTheme(webLightTheme)).toBe(false);
    expect(isDarkTheme(undefined)).toBe(false);
  });

  it('gives Fluent pieces on the panel cream text, white focus rings and translucent hovers, keeping the host font', () => {
    const t = onGradientTheme({ ...webLightTheme, fontFamilyBase: 'Test Sans' }, webDarkTheme);
    expect(t.fontFamilyBase).toBe('Test Sans');
    expect(t.colorNeutralForeground1).toBe(PALETTE.body);
    expect(t.colorStrokeFocus2).toBe('#ffffff');
    expect(t.colorSubtleBackgroundHover).toMatch(/^rgba\(255,255,255/);
  });
});
