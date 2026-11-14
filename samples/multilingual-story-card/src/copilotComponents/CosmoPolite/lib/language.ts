// Language handling for any BCP 47 tag the agent sends: UI language fallback chain, language names in
// their own language, text direction, sentence segmentation and reading time. Everything degrades
// gracefully when an Intl API is missing.

import { matchLanguage, type LanguageSource, type UiLanguage } from './strings';

export interface IResolvedLanguage {
  lang: UiLanguage;
  source: LanguageSource;
}

/**
 * First candidate that maps to a UI language wins. Order used by the component:
 * agent (tool input, changes per turn) > hostContext.locale > SharePoint UI culture > browser > English.
 */
export function resolveUiLanguage(candidates: Array<[LanguageSource, unknown]>): IResolvedLanguage {
  for (const [source, value] of candidates) {
    const lang: UiLanguage | undefined = matchLanguage(typeof value === 'string' ? value : undefined);
    if (lang) {
      return { lang, source };
    }
  }
  return { lang: 'en', source: 'fallback' };
}

/**
 * Own names for languages some engines have no name data for (Intl.DisplayNames then returns the
 * bare code, e.g. "gsw" in the Copilot client's language list).
 */
const OWN_NAMES: Record<string, string> = { gsw: 'Schwiizerdütsch' };

/**
 * Own names that say more than the engine's: "Deutsch (Schweiz)" doesn't tell Swiss Standard German
 * from the dialect (Schwiizerdütsch), so de-CH calls itself Schweizer Hochdeutsch.
 */
const CLEARER_OWN_NAMES: Record<string, string> = { 'de-ch': 'Schweizer Hochdeutsch' };

/** Name of `tag` written in `inLanguage` (default: in itself), e.g. de-AT → "Deutsch (Österreich)". */
export function displayName(tag: string, inLanguage: string = tag): string {
  const clearer: string | undefined = CLEARER_OWN_NAMES[tag.toLowerCase()];
  if (clearer && inLanguage.toLowerCase().split('-')[0] === 'de') {
    return clearer;
  }
  try {
    const names: Intl.DisplayNames = new Intl.DisplayNames([inLanguage], { type: 'language', languageDisplay: 'standard' });
    const name: string | undefined = names.of(tag);
    if (name && name !== tag) {
      // fi/sv write language names in lower case; as a standalone label they start upper case.
      return name.charAt(0).toLocaleUpperCase(inLanguage) + name.slice(1);
    }
  } catch {
    // Intl.DisplayNames missing or tag rejected.
  }
  return OWN_NAMES[tag.toLowerCase()] || tag;
}

// Right-to-left languages (primary subtags) and scripts (ISO 15924), for engines without
// Intl.Locale text info. A script subtag wins over the language: "ku-Arab" is RTL, "ku" is not.
const RTL_LANGUAGES: string[] = [
  'ar', 'arc', 'azb', 'bal', 'ckb', 'dv', 'fa', 'glk', 'he', 'iw', 'ks', 'lrc', 'mzn', 'nqo', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi'
];
const RTL_SCRIPTS: string[] = ['arab', 'hebr', 'syrc', 'thaa', 'nkoo', 'adlm', 'rohg', 'mand', 'samr', 'mend', 'yezi'];

interface ILocaleWithTextInfo {
  textInfo?: { direction?: string };
  getTextInfo?: () => { direction?: string };
}

/** 'rtl' or 'ltr' for a language tag: Intl.Locale text info (property or method), else script/language lists. */
export function textDirection(tag: string | undefined): 'ltr' | 'rtl' {
  if (!tag) {
    return 'ltr';
  }
  try {
    const locale: ILocaleWithTextInfo = new Intl.Locale(tag) as unknown as ILocaleWithTextInfo;
    const info: { direction?: string } | undefined =
      typeof locale.getTextInfo === 'function' ? locale.getTextInfo() : locale.textInfo;
    if (info && (info.direction === 'rtl' || info.direction === 'ltr')) {
      return info.direction;
    }
  } catch {
    // Intl.Locale missing or tag rejected: use the lists.
  }
  const parts: string[] = tag.toLowerCase().split(/[-_]/);
  const script: string | undefined = parts.slice(1).find((p: string) => p.length === 4);
  if (script) {
    return RTL_SCRIPTS.indexOf(script) !== -1 ? 'rtl' : 'ltr';
  }
  return RTL_LANGUAGES.indexOf(parts[0]) !== -1 ? 'rtl' : 'ltr';
}

// Strong right-to-left letters: Hebrew, Arabic (+ supplements and presentation forms), Syriac,
// Thaana, N'Ko, Samaritan, Mandaic, Adlam, Hanifi Rohingya, Yezidi.
const RTL_CHARS: RegExp = /[\u0590-\u05ff\u0600-\u06ff\u0700-\u074f\u0750-\u077f\u0780-\u07bf\u07c0-\u07ff\u0800-\u085f\u0870-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]|\ud803[\udd00-\udd3f\ude80-\udebf]|\ud83a[\udd00-\udd5f]/g;
// Strong left-to-right letters: Latin, Greek, Cyrillic, Armenian, Georgian, Indic, Thai, CJK, Hangul, …
// eslint-disable-next-line no-misleading-character-class -- the Indic/Thai ranges include their combining marks on purpose
const LTR_CHARS: RegExp = /[A-Za-z\u00c0-\u024f\u0370-\u03ff\u0400-\u052f\u0530-\u058f\u0900-\u0dff\u0e00-\u0eff\u10a0-\u10ff\u1e00-\u1fff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g;

/**
 * Direction from the text itself: 'rtl' or 'ltr' when one side clearly dominates the strong
 * letters, undefined for text without enough letters (numbers, punctuation, very short strings).
 */
export function directionOfText(text: string | undefined): 'ltr' | 'rtl' | undefined {
  if (!text) {
    return undefined;
  }
  const rtl: number = (text.match(RTL_CHARS) || []).length;
  const ltr: number = (text.match(LTR_CHARS) || []).length;
  if (rtl + ltr < 3) {
    return undefined;
  }
  if (rtl > ltr * 1.5) {
    return 'rtl';
  }
  if (ltr > rtl * 1.5) {
    return 'ltr';
  }
  return undefined;
}

/**
 * Direction for a piece of content: what the text clearly is wins (a model can mislabel the
 * language, the letters can't lie); otherwise the language tag decides.
 */
export function contentDirection(text: string | undefined, tag: string | undefined): 'ltr' | 'rtl' {
  return directionOfText(text) || textDirection(tag);
}

interface ISegment {
  segment: string;
  isWordLike?: boolean;
}

interface ISegmenter {
  segment(input: string): Iterable<ISegment>;
}

type SegmenterConstructor = new (locales: string, options: { granularity: 'sentence' | 'word' }) => ISegmenter;

function getSegmenter(lang: string, granularity: 'sentence' | 'word'): ISegmenter | undefined {
  const ctor: SegmenterConstructor | undefined = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (!ctor) {
    return undefined;
  }
  try {
    return new ctor(lang, { granularity });
  } catch {
    return undefined;
  }
}

/** Sentences of `text`, trimmed and non-empty. Works for CJK punctuation without Intl.Segmenter too. */
export function splitSentences(text: string, lang: string): string[] {
  const segmenter: ISegmenter | undefined = getSegmenter(lang, 'sentence');
  const parts: string[] = [];
  if (segmenter) {
    Array.from(segmenter.segment(text)).forEach((s: ISegment) => parts.push(s.segment));
  } else {
    const matches: RegExpMatchArray | null = text.match(/[^.!?。！？؟]+[.!?。！？؟]*["'”’»」]*\s*/g);
    parts.push(...(matches || [text]));
  }
  return parts.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
}

const CJK_PATTERN: RegExp = /[぀-ヿ㐀-䶿一-鿿가-힯]/g;

/** Rough reading time in whole minutes (at least 1): ~200 words or ~500 CJK characters per minute. */
export function readingMinutes(text: string, lang: string): number {
  const cjk: number = (text.match(CJK_PATTERN) || []).length;
  let words: number = 0;
  const segmenter: ISegmenter | undefined = getSegmenter(lang, 'word');
  if (segmenter) {
    words = Array.from(segmenter.segment(text.replace(CJK_PATTERN, ' '))).filter((s: ISegment) => !!s.isWordLike).length;
  } else {
    words = text.replace(CJK_PATTERN, ' ').split(/\s+/).filter(Boolean).length;
  }
  return Math.max(1, Math.round(words / 200 + cjk / 500));
}

/** "1 minute" / "2 Minuten" / "1 minuutti" — plural forms come from Intl's unit formatting. */
export function formatMinutes(minutes: number, lang: string): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'unit', unit: 'minute', unitDisplay: 'long' }).format(minutes);
  } catch {
    return `${minutes} min`;
  }
}

/** Same primary subtag ("de-AT" vs "de" → true). */
export function samePrimary(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) {
    return false;
  }
  return a.toLowerCase().split(/[-_]/)[0] === b.toLowerCase().split(/[-_]/)[0];
}
