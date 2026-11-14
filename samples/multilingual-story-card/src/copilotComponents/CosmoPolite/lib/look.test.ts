import { describe, expect, it } from 'vitest';
import { resolveLook, resolveTheme } from './look';

describe('resolveLook', () => {
  it('falls back to the defaults', () => {
    expect(resolveLook({ card: {}, input: { design: undefined, layout: undefined }, prefs: { theme: 'auto' }, hostTheme: undefined })).toEqual({
      design: 'dramatic',
      layout: 'beside',
      themeChoice: 'auto',
      theme: 'light'
    });
  });

  it('prefers the card, then the tool input, then the preferences', () => {
    const prefs = { theme: 'auto' as const, design: 'classic' as const, layout: 'lead' as const };
    expect(resolveLook({ card: {}, input: { design: undefined, layout: undefined }, prefs, hostTheme: 'dark' })).toMatchObject({
      design: 'classic',
      layout: 'lead',
      theme: 'dark'
    });
    expect(resolveLook({ card: {}, input: { design: 'compact', layout: 'teaser' }, prefs, hostTheme: 'dark' })).toMatchObject({
      design: 'compact',
      layout: 'teaser'
    });
    expect(resolveLook({ card: { design: 'magazine' }, input: { design: 'compact', layout: 'teaser' }, prefs, hostTheme: 'dark' })).toMatchObject({
      design: 'magazine',
      layout: 'teaser'
    });
  });
});

describe('resolveTheme', () => {
  it('follows the host only on auto', () => {
    expect(resolveTheme('auto', 'dark')).toBe('dark');
    expect(resolveTheme('auto', 'light')).toBe('light');
    expect(resolveTheme('auto', undefined)).toBe('light');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
});
