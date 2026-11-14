import { describe, expect, it } from 'vitest';
import {
  contentDirection,
  directionOfText,
  displayName,
  formatMinutes,
  readingMinutes,
  resolveUiLanguage,
  samePrimary,
  splitSentences,
  textDirection
} from './language';

describe('resolveUiLanguage', () => {
  it('prefers the agent language', () => {
    expect(resolveUiLanguage([['agent', 'fi'], ['hostLocale', 'en-us']])).toEqual({ lang: 'fi', source: 'agent' });
  });

  it('falls through unsupported candidates', () => {
    expect(
      resolveUiLanguage([
        ['agent', 'eu'],
        ['hostLocale', 'en-us']
      ])
    ).toEqual({ lang: 'en', source: 'hostLocale' });
    expect(resolveUiLanguage([['agent', undefined], ['hostLocale', 42], ['sharePoint', 'sv-SE']])).toEqual({
      lang: 'sv',
      source: 'sharePoint'
    });
  });

  it('ends in English', () => {
    expect(resolveUiLanguage([['agent', 'xx']])).toEqual({ lang: 'en', source: 'fallback' });
  });
});

describe('displayName', () => {
  it('names a language in that language', () => {
    expect(displayName('de-AT')).toBe('Deutsch (Österreich)');
    expect(displayName('fi')).toBe('Suomi');
    expect(displayName('sv')).toBe('Svenska');
  });

  it('names a language in another language', () => {
    expect(displayName('fi', 'en')).toBe('Finnish');
    expect(displayName('ja', 'de')).toBe('Japanisch');
  });

  it('returns the tag when it cannot be named', () => {
    expect(displayName('not a tag')).toBe('not a tag');
  });
});

describe('textDirection', () => {
  it('detects RTL languages', () => {
    expect(textDirection('ar')).toBe('rtl');
    expect(textDirection('he-IL')).toBe('rtl');
    expect(textDirection('fa')).toBe('rtl');
  });

  it('detects LTR languages', () => {
    expect(textDirection('de-AT')).toBe('ltr');
    expect(textDirection('ja')).toBe('ltr');
    expect(textDirection(undefined)).toBe('ltr');
  });

  it('falls back to the list without Intl.Locale text info', () => {
    const original: typeof Intl.Locale = Intl.Locale;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Intl as any).Locale = undefined;
    try {
      expect(textDirection('ur-PK')).toBe('rtl');
      expect(textDirection('fi')).toBe('ltr');
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Intl as any).Locale = original;
    }
  });
});

describe('splitSentences', () => {
  it('splits German sentences', () => {
    expect(splitSentences('Wien ist schön. Der Prater auch! Und dann?', 'de')).toEqual([
      'Wien ist schön.',
      'Der Prater auch!',
      'Und dann?'
    ]);
  });

  it('splits Japanese sentences without spaces', () => {
    expect(splitSentences('東京は大きい。京都は古い。', 'ja')).toEqual(['東京は大きい。', '京都は古い。']);
  });

  it('works without Intl.Segmenter', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intl: any = Intl;
    const original: unknown = intl.Segmenter;
    intl.Segmenter = undefined;
    try {
      expect(splitSentences('One. Two? Three', 'en')).toEqual(['One.', 'Two?', 'Three']);
      expect(splitSentences('東京は大きい。京都は古い。', 'ja')).toEqual(['東京は大きい。', '京都は古い。']);
    } finally {
      intl.Segmenter = original;
    }
  });
});

describe('reading time', () => {
  it('is at least one minute', () => {
    expect(readingMinutes('Kurz.', 'de')).toBe(1);
  });

  it('counts words', () => {
    expect(readingMinutes(new Array(400).fill('Wort').join(' '), 'de')).toBe(2);
  });

  it('formats minutes with plural forms', () => {
    expect(formatMinutes(1, 'en')).toBe('1 minute');
    expect(formatMinutes(2, 'de')).toBe('2 Minuten');
  });
});

describe('samePrimary', () => {
  it('compares primary subtags', () => {
    expect(samePrimary('de-AT', 'de')).toBe(true);
    expect(samePrimary('en', 'ja')).toBe(false);
    expect(samePrimary(undefined, 'de')).toBe(false);
  });
});

describe('direction from script subtags', () => {
  it('lets the script decide', () => {
    expect(textDirection('ku-Arab')).toBe('rtl');
    expect(textDirection('pa-Arab')).toBe('rtl');
    expect(textDirection('ku')).toBe('ltr');
    expect(textDirection('yi')).toBe('rtl');
    expect(textDirection('dv')).toBe('rtl');
    expect(textDirection('syr')).toBe('rtl');
  });

  it('uses the lists without Intl.Locale', () => {
    const original: typeof Intl.Locale = Intl.Locale;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Intl as any).Locale = undefined;
    try {
      expect(textDirection('he-IL')).toBe('rtl');
      expect(textDirection('ckb')).toBe('rtl');
      expect(textDirection('uz-Arab')).toBe('rtl');
      expect(textDirection('ar-Latn')).toBe('ltr');
      expect(textDirection('ja')).toBe('ltr');
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Intl as any).Locale = original;
    }
  });
});

describe('direction from the text itself', () => {
  it('recognises right-to-left scripts', () => {
    expect(directionOfText('القاهرة مدينة لا تنام')).toBe('rtl');
    expect(directionOfText('ירושלים היא עיר עתיקה')).toBe('rtl');
    expect(directionOfText('تهران پایتخت ایران است')).toBe('rtl');
    expect(directionOfText('ܫܠܡܐ ܥܠܡܐ')).toBe('rtl');
    expect(directionOfText('ދިވެހިރާއްޖެ')).toBe('rtl');
  });

  it('recognises left-to-right scripts', () => {
    expect(directionOfText('Wien ist schön')).toBe('ltr');
    expect(directionOfText('東京は大きい')).toBe('ltr');
    expect(directionOfText('Москва большая')).toBe('ltr');
  });

  it('keeps an RTL text RTL despite Latin names and numbers in it', () => {
    expect(directionOfText('زار Egon Schiele فيينا عام 1910 ورسم لوحات كثيرة جداً')).toBe('rtl');
  });

  it('has no opinion on too few letters', () => {
    expect(directionOfText('1977 — 42')).toBeUndefined();
    expect(directionOfText('')).toBeUndefined();
  });

  it('lets the letters beat a wrong tag', () => {
    expect(contentDirection('ירושלים היא עיר עתיקה', 'en')).toBe('rtl');
    expect(contentDirection('Wien ist schön', 'ar')).toBe('ltr');
    expect(contentDirection('1977', 'he')).toBe('rtl');
  });
});

describe('displayName without name data', () => {
  it('falls back to the own name instead of the bare code', () => {
    const original: typeof Intl.DisplayNames = Intl.DisplayNames;
    // An engine without data for gsw returns the code itself.
    (Intl as unknown as { DisplayNames: unknown }).DisplayNames = class {
      public of(code: string): string {
        return code;
      }
    };
    try {
      expect(displayName('gsw')).toBe('Schwiizerdütsch');
      expect(displayName('xx')).toBe('xx');
    } finally {
      (Intl as unknown as { DisplayNames: unknown }).DisplayNames = original;
    }
  });
});
