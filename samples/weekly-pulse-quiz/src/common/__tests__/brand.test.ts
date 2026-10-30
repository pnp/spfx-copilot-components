import { contrastRatio, NEUTRAL, normalizeHex, readableText, resolveBrandColors } from '../brand';

describe('brand colours', () => {
  it('without a site theme (Copilot) uses neutral Fluent defaults', () => {
    const c = resolveBrandColors(undefined);
    expect(c.bannerBg).toBe('#0F6CBD');
    expect(c.buttonBg).toBe('#0F6CBD');
    expect(c.buttonText).toBe('#FFFFFF');
    expect(c.buttonHover).toBe(NEUTRAL.primaryDark);
    expect(c.correctFill).toBe(NEUTRAL.primaryLighter);
    expect(c.cardBg).toBe('#FFFFFF');
    expect(c.text).toBe(NEUTRAL.text);
  });

  it('light backgrounds carry dark text, dark backgrounds carry white text', () => {
    expect(readableText('#FFC83D')).toBe(NEUTRAL.black);
    expect(readableText('#0F6CBD')).toBe(NEUTRAL.white);
  });

  it.each([
    ['no theme', undefined],
    ['teal theme', { palette: { themePrimary: '#038387', themeDark: '#025C5F', themeLighter: '#C5EFEF' } }],
    ['default SharePoint blue', { palette: { themePrimary: '#0078D4', themeDark: '#005A9E', themeLighter: '#DEECF9' } }],
    ['light primary', { palette: { themePrimary: '#FFC83D', themeDark: '#8A6400', themeLighter: '#FFF4CE' } }]
  ])('text/background pairs meet WCAG AA (4.5:1): %s', (_name, theme) => {
    const c = resolveBrandColors(theme);
    expect(contrastRatio(c.bannerBg, c.bannerText)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.buttonBg, c.buttonText)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.correctFill, c.correctText)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.accent, c.accentText)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.cardBg, c.text)).toBeGreaterThanOrEqual(4.5);
  });

  it('maps the SharePoint site theme palette', () => {
    const c = resolveBrandColors({ palette: { themePrimary: '#038387', themeDark: '#025C5F', themeLighter: '#C5EFEF' } });
    expect(c.bannerBg).toBe('#038387');
    expect(c.buttonHover).toBe('#025C5F');
    expect(c.correctFill).toBe('#C5EFEF');
  });

  it('overrides win and pick readable text; invalid overrides are ignored', () => {
    const c = resolveBrandColors(undefined, { bannerColor: '#ffc83d', buttonColor: 'red', accentColor: '#000' });
    expect(c.bannerBg).toBe('#FFC83D');
    expect(c.bannerText).toBe(NEUTRAL.black);
    expect(c.buttonBg).toBe('#0F6CBD');
    expect(c.accent).toBe('#000000');
    expect(c.accentText).toBe('#FFFFFF');
    expect(contrastRatio(c.bannerBg, c.bannerText)).toBeGreaterThanOrEqual(4.5);
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('url(x)')).toBeUndefined();
  });
});
