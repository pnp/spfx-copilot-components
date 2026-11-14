import { describe, expect, it } from 'vitest';
import { englishStrings, format, loadStrings, matchLanguage, UI_LANGUAGE_TAGS, type IUiStrings, type UiLanguage } from './strings';

/** All key paths of a table, nested ones as "designs.classic". */
function keyPaths(value: unknown, prefix: string = ''): string[] {
  if (!value || typeof value !== 'object') {
    return [prefix];
  }
  return Object.keys(value as object)
    .sort()
    .reduce((all: string[], key: string) => all.concat(keyPaths((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key)), []);
}

function placeholders(text: string): string[] {
  return (text.match(/\{\d+\}/g) || []).sort();
}

describe('matchLanguage', () => {
  it('maps exact tags and primary subtags', () => {
    expect(matchLanguage('de')).toBe('de');
    expect(matchLanguage('de-DE')).toBe('de');
    expect(matchLanguage('en-US')).toBe('en');
    expect(matchLanguage('ja-JP')).toBe('ja');
    expect(matchLanguage('ar-EG')).toBe('ar');
    expect(matchLanguage('KO')).toBe('ko');
  });

  it('recognises Austrian German and Austro-Bavarian tags as de-AT', () => {
    expect(matchLanguage('de-AT')).toBe('de-AT');
    expect(matchLanguage('de_at')).toBe('de-AT');
    expect(matchLanguage('de-AT-x-wien')).toBe('de-AT');
    expect(matchLanguage('bar')).toBe('de-AT');
  });

  it('recognises Swiss German dialect and Swiss Standard German', () => {
    expect(matchLanguage('gsw')).toBe('gsw');
    expect(matchLanguage('gsw-CH')).toBe('gsw');
    expect(matchLanguage('als')).toBe('gsw');
    expect(matchLanguage('de-CH')).toBe('de-CH');
    expect(matchLanguage('de-LI')).toBe('de-CH');
  });

  it('picks script and region variants', () => {
    expect(matchLanguage('zh')).toBe('zh-Hans');
    expect(matchLanguage('zh-CN')).toBe('zh-Hans');
    expect(matchLanguage('zh-TW')).toBe('zh-Hant');
    expect(matchLanguage('zh-Hant-HK')).toBe('zh-Hant');
    expect(matchLanguage('sr')).toBe('sr-Cyrl');
    expect(matchLanguage('sr-Latn-RS')).toBe('sr-Latn');
    expect(matchLanguage('pt')).toBe('pt-BR');
    expect(matchLanguage('pt-PT')).toBe('pt-PT');
    expect(matchLanguage('pt-AO')).toBe('pt-PT');
    expect(matchLanguage('fr-CA')).toBe('fr-CA');
    expect(matchLanguage('fr-BE')).toBe('fr');
    expect(matchLanguage('es-MX')).toBe('es-MX');
    expect(matchLanguage('es-419')).toBe('es-MX');
    expect(matchLanguage('es-ES')).toBe('es');
  });

  it('maps legacy and sibling codes', () => {
    expect(matchLanguage('no')).toBe('nb');
    expect(matchLanguage('nn-NO')).toBe('nb');
    expect(matchLanguage('tl')).toBe('fil');
    expect(matchLanguage('iw')).toBe('he');
    expect(matchLanguage('in')).toBe('id');
  });

  it('returns undefined for languages without a table', () => {
    expect(matchLanguage('eu')).toBeUndefined();
    expect(matchLanguage('')).toBeUndefined();
    expect(matchLanguage(undefined)).toBeUndefined();
  });
});

describe('string tables', () => {
  const en: IUiStrings = englishStrings();
  const enKeys: string[] = keyPaths(en);

  it('cover every Microsoft 365 Copilot work/school language plus de-AT', () => {
    expect(UI_LANGUAGE_TAGS.length).toBe(58);
  });

  it.each(UI_LANGUAGE_TAGS.map((tag: UiLanguage) => [tag]))('%s loads with every key and placeholder', async (tag: UiLanguage) => {
    const table: IUiStrings = await loadStrings(tag);
    expect(keyPaths(table)).toEqual(enKeys);
    if (tag !== 'en') {
      expect(table).not.toBe(en);
    }
    enKeys.forEach((path: string) => {
      const get = (t: IUiStrings): string =>
        path.split('.').reduce((v: unknown, k: string) => (v as Record<string, unknown>)[k], t as unknown) as string;
      expect(typeof get(table)).toBe('string');
      expect(get(table).trim().length).toBeGreaterThan(0);
      expect(placeholders(get(table))).toEqual(placeholders(get(en)));
    });
  });

  it('writes Swiss Standard German without ß and with guillemets', async () => {
    const table: IUiStrings = await loadStrings('de-CH');
    expect(JSON.stringify(table)).not.toContain('ß');
    expect(table.tellMorePrompt).toBe('Erzähl mir mehr über «{0}».');
    expect(table.languageName).toBe('Schweizer Hochdeutsch');
  });

  it('formats placeholders', () => {
    expect(format('No voice for {0}', 'Suomi')).toBe('No voice for Suomi');
    expect(format('{1} {0} {2}', 'a', 'b')).toBe('b a {2}');
  });
});
