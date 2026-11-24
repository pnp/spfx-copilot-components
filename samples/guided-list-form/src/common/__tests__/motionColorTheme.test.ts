import { webDarkTheme, webLightTheme } from '@fluentui/react-components';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { contrastRatio, normalizeHex, readableTextOn, shade } from '../logic/color';
import { DEFAULT_GRADIENT, highlightVars, MIN_HIGHLIGHT_CONTRAST, PALETTE } from '../logic/surface';
import { COMPACT_DISTANCE_PX, ENTER_MS, EXIT_MS, PAGE_DISTANCE_PX, motionEnabled, motionStyle, prefersReducedMotion, totalTransitionMs } from '../logic/motion';
import { applyAccent, readThemeColor, toFluentTheme } from '../theme';

describe('motion', () => {
  it('enters in 350 to 450 ms with an expo-out curve after a short exit', () => {
    expect(totalTransitionMs(true)).toBe(EXIT_MS + ENTER_MS);
    expect(ENTER_MS).toBeGreaterThanOrEqual(350);
    expect(ENTER_MS).toBeLessThanOrEqual(450);
    expect(EXIT_MS).toBeLessThan(ENTER_MS);
    expect(totalTransitionMs(true)).toBeLessThanOrEqual(700);
    expect(motionStyle('enter', 'forward', false).transition).toContain('cubic-bezier(0.16, 1, 0.3, 1)');
  });

  it('slides up and out going forward, in from below; mirrors going back', () => {
    expect(motionStyle('exit', 'forward', false)).toMatchObject({ transform: `translateY(${-PAGE_DISTANCE_PX}px)`, opacity: 0 });
    expect(motionStyle('enterFrom', 'forward', false)).toMatchObject({ transform: `translateY(${PAGE_DISTANCE_PX}px)`, opacity: 0, transition: 'none' });
    expect(motionStyle('exit', 'back', true)).toMatchObject({ transform: `translateY(${COMPACT_DISTANCE_PX}px)` });
    expect(motionStyle('enter', 'back', true)).toMatchObject({ transform: 'translateY(0px)', opacity: 1 });
  });

  it('reduced motion or animations off means an instant swap', () => {
    expect(motionEnabled(true, true)).toBe(false);
    expect(motionEnabled(false, false)).toBe(false);
    expect(motionEnabled(true, false)).toBe(true);
    expect(totalTransitionMs(false)).toBe(0);
    expect(motionStyle('idle', 'forward', false)).toEqual({ transform: 'none', opacity: 1, transition: 'none' });
  });

  it('reads prefers-reduced-motion safely', () => {
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) } as unknown as Window)).toBe(true);
    expect(prefersReducedMotion({} as Window)).toBe(false);
    expect(prefersReducedMotion({ matchMedia: () => { throw new Error('x'); } } as unknown as Window)).toBe(false);
  });
});

describe('colours (hex only)', () => {
  it.each([
    ['#0F6CBD', '#0f6cbd'],
    ['#abc', '#aabbcc'],
    [' #ABCDEF ', '#abcdef'],
    ['red', ''],
    ['#12345', ''],
    ['url(javascript:alert(1))', ''],
    ['#fff;background:url(x)', ''],
    [undefined, '']
  ])('normalizeHex(%j) -> %j', (input, expected) => {
    expect(normalizeHex(input as string | undefined)).toBe(expected);
  });

  it('picks readable text on the accent', () => {
    expect(readableTextOn('#0f6cbd')).toBe('#ffffff');
    expect(readableTextOn('#ffe066')).toBe('#1a1a1a');
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
    expect(shade('#808080', -0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('theme', () => {
  it('uses Fluent web light by default and dark for inverted themes', () => {
    expect(toFluentTheme(undefined).colorBrandBackground).toBe(webLightTheme.colorBrandBackground);
    expect(toFluentTheme({ isInverted: true } as IReadonlyTheme).colorNeutralBackground1).toBe(webDarkTheme.colorNeutralBackground1);
  });

  it('maps SharePoint semantic colours but never copies themePrimary onto the brand fill', () => {
    const t = toFluentTheme({ semanticColors: { bodyBackground: '#faf9f8', bodyText: '#323130' }, palette: { themePrimary: '#ffffff' } } as unknown as IReadonlyTheme);
    expect(t.colorNeutralBackground1).toBe('#faf9f8');
    expect(t.colorNeutralForeground1).toBe('#323130');
    expect(t.colorBrandBackground).toBe(webLightTheme.colorBrandBackground);
  });

  it('ignores non-string theme tokens', () => {
    expect(readThemeColor(42, '#000')).toBe('#000');
    expect(readThemeColor(' ', '#000')).toBe('#000');
  });

  it('applies a hex accent with readable text, and ignores anything else', () => {
    const t = applyAccent(webLightTheme, '#FFE066');
    expect(t.colorBrandBackground).toBe('#ffe066');
    expect(t.colorNeutralForegroundOnBrand).toBe('#1a1a1a');
    expect(applyAccent(webLightTheme, 'expression(alert(1))')).toBe(webLightTheme);
  });
});

describe('highlight colour tokens', () => {
  it('keeps the current coral and white defaults when the value is empty or not hex', () => {
    const unset = highlightVars('', DEFAULT_GRADIENT.start);
    expect(unset.highlight).toBe(PALETTE.coral);
    expect(unset.focusRing).toBe('#ffffff');
    expect(unset.finishTick).toBe('#183a35');
    expect(highlightVars('red', DEFAULT_GRADIENT.start).highlight).toBe(PALETTE.coral);
    expect(highlightVars('expression(alert(1))', DEFAULT_GRADIENT.start).highlight).toBe(PALETTE.coral);
  });

  it('uses a valid hex colour and keeps contrast on the gradient', () => {
    const gold = highlightVars('#FFB000', DEFAULT_GRADIENT.start);
    expect(gold.highlight).toBe('#ffb000');
    expect(gold.focusRing).toBe('#ffb000');
    expect(gold.finishStroke).toBe('#ffb000');
    expect(contrastRatio(gold.highlight, DEFAULT_GRADIENT.start)).toBeGreaterThanOrEqual(MIN_HIGHLIGHT_CONTRAST);
    const pale = highlightVars('#ffffff', DEFAULT_GRADIENT.start);
    expect(contrastRatio(pale.highlight, DEFAULT_GRADIENT.start)).toBeGreaterThanOrEqual(MIN_HIGHLIGHT_CONTRAST - 0.05);
  });
});
