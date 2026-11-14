// Lightweight language guess for the card text, to catch the model writing English (or anything
// else) although it reported another language. Script ranges decide non-Latin languages;
// stopword profiles decide Latin-script ones. Only meant to be confident on clear cases: when in
// doubt it returns low confidence and the card trusts the agent.

export interface ILanguageGuess {
  /** Primary subtag, e.g. 'en', 'de', 'ja'. */
  lang: string;
  /** 0..1 */
  confidence: number;
}

const SCRIPTS: Array<[string, RegExp]> = [
  ['kana', /[぀-ヿ]/g],
  ['hangul', /[가-힯ᄀ-ᇿ]/g],
  ['han', /[一-鿿㐀-䶿]/g],
  ['arabic', /[؀-ۿݐ-ݿ]/g],
  ['hebrew', /[֐-׿]/g],
  ['greek', /[Ͱ-Ͽ]/g],
  ['thai', /[฀-๿]/g],
  ['cyrillic', /[Ѐ-ӿ]/g],
  ['latin', /[a-zA-ZÀ-ɏḀ-ỿ]/g]
];

// High-frequency function words. Single letters and words shared by many languages are left out.
const PROFILES: Record<string, string[]> = {
  en: ['the', 'and', 'of', 'to', 'is', 'that', 'it', 'with', 'for', 'was', 'on', 'are', 'this', 'by', 'from', 'at', 'which', 'you', 'have', 'not', 'but', 'they', 'its', 'can', 'there', 'their', 'where', 'many', 'every'],
  de: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'sich', 'auf', 'für', 'ein', 'eine', 'auch', 'dem', 'den', 'des', 'im', 'zu', 'von', 'wird', 'sind', 'noch', 'wie', 'man', 'aber',
    // Austrian / Viennese dialect
    'ned', 'net', 'ois', 'wos', 'wia', 'mia', 'ana', 'scho', 'iwa', 'owe', 'aufi', 'is', 'de', 'si', 'ma',
    // Swiss German
    'isch', 'nöd', 'nid', 'öppis', 'chli', 'gsi', 'hät', 'het', 'vo', 'uf', 'dä', 'mer', 'au', 'eifach', 'scho'],
  fr: ['le', 'la', 'les', 'et', 'des', 'est', 'une', 'dans', 'que', 'qui', 'pour', 'pas', 'sur', 'au', 'avec', 'du', 'ce', 'sont', 'il', 'elle', 'aux', 'où'],
  es: ['el', 'los', 'las', 'del', 'que', 'en', 'y', 'es', 'por', 'con', 'para', 'una', 'su', 'se', 'como', 'más', 'pero', 'sus', 'son', 'muy'],
  it: ['il', 'di', 'che', 'della', 'per', 'non', 'sono', 'una', 'gli', 'nel', 'alla', 'anche', 'con', 'si', 'delle', 'dei', 'è', 'più', 'come'],
  pt: ['o', 'os', 'da', 'do', 'das', 'dos', 'que', 'em', 'um', 'uma', 'para', 'com', 'não', 'é', 'mais', 'ao', 'pela', 'pelo', 'são', 'também'],
  nl: ['het', 'een', 'van', 'en', 'de', 'is', 'dat', 'niet', 'met', 'zijn', 'voor', 'op', 'ook', 'aan', 'wordt', 'naar', 'maar', 'bij', 'je'],
  // Afrikaans: "die" alone would read as German; "nie", "het", "vir", "wat", "baie", "hulle" are its own.
  af: ['die', 'en', 'van', 'is', 'nie', 'het', 'vir', 'wat', 'met', 'na', 'ook', 'word', 'kan', 'hulle', 'ons', 'baie', 'maar', 'sy', 'om', 'gewees'],
  sv: ['och', 'att', 'det', 'som', 'en', 'är', 'på', 'för', 'med', 'av', 'till', 'den', 'inte', 'har', 'om', 'ett', 'från', 'kan', 'också'],
  da: ['og', 'at', 'det', 'som', 'en', 'er', 'på', 'for', 'med', 'af', 'til', 'den', 'ikke', 'har', 'de', 'et', 'fra', 'kan', 'også', 'jeg'],
  nb: ['og', 'å', 'det', 'som', 'en', 'er', 'på', 'for', 'med', 'av', 'til', 'den', 'ikke', 'har', 'de', 'et', 'fra', 'kan', 'også', 'jeg'],
  fi: ['ja', 'on', 'ei', 'se', 'että', 'oli', 'ovat', 'kun', 'myös', 'mutta', 'tai', 'joka', 'jo', 'sen', 'hän', 'niin', 'kuin', 'vain', 'kaupunki'],
  et: ['ja', 'on', 'ei', 'see', 'et', 'oli', 'ka', 'kui', 'aga', 'või', 'mis', 'kes', 'ning', 'veel', 'nii'],
  pl: ['i', 'w', 'nie', 'na', 'się', 'że', 'do', 'jest', 'to', 'z', 'jak', 'po', 'ale', 'od', 'są', 'oraz', 'dla', 'przez'],
  cs: ['a', 'je', 'se', 'na', 'v', 'že', 'to', 'jsou', 'pro', 'jako', 'ale', 'jeho', 'které', 'také', 'byl', 'podle'],
  sk: ['a', 'je', 'sa', 'na', 'v', 'že', 'to', 'sú', 'pre', 'ako', 'ale', 'jeho', 'ktoré', 'tiež', 'bol', 'podľa'],
  sl: ['in', 'je', 'se', 'na', 'v', 'da', 'za', 'so', 'pa', 'ki', 'tudi', 'po', 'kot', 'ali'],
  hr: ['i', 'je', 'se', 'na', 'u', 'da', 'za', 'su', 'od', 'koji', 'što', 'ali', 'kao', 'ili', 'iz', 'ima'],
  ro: ['și', 'în', 'este', 'de', 'la', 'cu', 'un', 'o', 'care', 'pe', 'nu', 'mai', 'din', 'sunt', 'pentru', 'să'],
  hu: ['a', 'az', 'és', 'hogy', 'nem', 'is', 'egy', 'van', 'meg', 'de', 'már', 'csak', 'mint', 'még', 'ez', 'volt'],
  tr: ['ve', 'bir', 'bu', 'da', 'de', 'için', 'ile', 'çok', 'daha', 'olan', 'gibi', 'ama', 'en', 'kadar', 'her'],
  id: ['dan', 'yang', 'di', 'ini', 'itu', 'dengan', 'untuk', 'tidak', 'dari', 'ke', 'ada', 'juga', 'akan', 'kota'],
  vi: ['và', 'là', 'của', 'có', 'không', 'những', 'một', 'các', 'được', 'trong', 'cho', 'với', 'người', 'này'],
  ca: ['el', 'la', 'els', 'les', 'i', 'de', 'que', 'és', 'en', 'per', 'amb', 'una', 'del', 'als', 'però', 'més'],
  lv: ['un', 'ir', 'ar', 'kas', 'no', 'uz', 'par', 'bet', 'arī', 'kā', 'tas', 'to', 'vai'],
  lt: ['ir', 'yra', 'kad', 'su', 'iš', 'į', 'bet', 'kaip', 'tai', 'jo', 'ar', 'taip', 'nuo'],
  sq: ['dhe', 'në', 'të', 'është', 'një', 'për', 'me', 'që', 'nga', 'nuk', 'si', 'por'],
  is: ['og', 'að', 'er', 'í', 'á', 'sem', 'það', 'við', 'með', 'til', 'ekki', 'en', 'um'],
  mt: ['u', 'il-', 'ta', 'li', 'huwa', 'hija', 'fil-', 'minn', 'għal', 'mhux', 'ukoll'],
  cy: ['y', 'yr', 'a', 'ac', 'yn', 'mae', 'i', 'o', 'ar', 'gyda', 'hefyd', 'ond', 'wedi'],
  fil: ['ang', 'ng', 'mga', 'sa', 'at', 'na', 'ay', 'ito', 'para', 'hindi', 'siya', 'kung']
};

/** Languages that are hard to tell apart with this method; a "mismatch" inside a group is ignored. */
const GROUPS: string[][] = [
  ['hr', 'sr', 'bs', 'sl'],
  ['cs', 'sk'],
  ['da', 'nb', 'no', 'nn', 'sv'],
  ['id', 'ms'],
  ['es', 'ca', 'gl'],
  ['de', 'bar', 'gsw', 'lb'],
  ['fi', 'et'],
  ['ru', 'uk', 'be', 'bg', 'sr', 'mk'],
  ['pt', 'gl'],
  ['nl', 'af'],
  ['ar', 'fa', 'ur', 'ps'],
  ['zh', 'ja']
];

function primaryOf(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0];
}

function count(text: string, re: RegExp): number {
  return (text.match(re) || []).length;
}

function guessCyrillic(text: string): string {
  const t: string = text.toLowerCase();
  if (/[іїєґ]/.test(t)) {
    return 'uk';
  }
  if (/[ђћџљњј]/.test(t)) {
    return 'sr';
  }
  if (/[ыэё]/.test(t)) {
    return 'ru';
  }
  return count(t, /ъ/g) > 2 ? 'bg' : 'ru';
}

export function guessLanguage(text: string): ILanguageGuess | undefined {
  const letters: Record<string, number> = {};
  let total: number = 0;
  SCRIPTS.forEach(([name, re]: [string, RegExp]) => {
    letters[name] = count(text, re);
    total += letters[name];
  });
  if (total < 20) {
    return undefined;
  }
  const share = (name: string): number => letters[name] / total;
  const cjk: number = letters.kana + letters.han;

  if (letters.kana > 0 && letters.kana / Math.max(cjk, 1) > 0.05 && cjk / total > 0.3) {
    return { lang: 'ja', confidence: 0.95 };
  }
  if (share('hangul') > 0.3) {
    return { lang: 'ko', confidence: 0.95 };
  }
  if (share('han') > 0.3) {
    return { lang: 'zh', confidence: 0.9 };
  }
  if (share('arabic') > 0.5) {
    return { lang: 'ar', confidence: 0.8 };
  }
  if (share('hebrew') > 0.5) {
    return { lang: 'he', confidence: 0.95 };
  }
  if (share('greek') > 0.5) {
    return { lang: 'el', confidence: 0.95 };
  }
  if (share('thai') > 0.5) {
    return { lang: 'th', confidence: 0.95 };
  }
  if (share('cyrillic') > 0.5) {
    return { lang: guessCyrillic(text), confidence: 0.7 };
  }
  if (share('latin') < 0.6) {
    return undefined;
  }

  const words: string[] = text
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .split(/[^a-zÀ-ɏḀ-ỿ-]+/)
    .filter(Boolean);
  if (words.length < 8) {
    return undefined;
  }
  const scores: Array<[string, number]> = Object.keys(PROFILES).map((lang: string) => {
    const set: string[] = PROFILES[lang];
    let hits: number = 0;
    words.forEach((w: string) => {
      if (set.indexOf(w) !== -1) {
        hits++;
      }
    });
    return [lang, hits] as [string, number];
  });
  scores.sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
  const [bestLang, best] = scores[0];
  const second: number = scores[1][1];
  if (best < 3) {
    return undefined;
  }
  const margin: number = best / Math.max(second, 1);
  const density: number = best / words.length;
  const confidence: number = Math.min(1, (margin - 1) * 0.5 + density * 2);
  return { lang: bestLang, confidence: Math.max(0, confidence) };
}

function sameGroup(a: string, b: string): boolean {
  return a === b || GROUPS.some((g: string[]) => g.indexOf(a) !== -1 && g.indexOf(b) !== -1);
}

/**
 * The language the text is really written in, if it clearly differs from what the agent reported;
 * otherwise undefined (trust the agent). Needs a confident guess and a different language family.
 */
export function detectMismatch(requested: string | undefined, text: string, minConfidence: number = 0.6): string | undefined {
  if (!requested) {
    return undefined;
  }
  const guess: ILanguageGuess | undefined = guessLanguage(text);
  if (!guess || guess.confidence < minConfidence) {
    return undefined;
  }
  return sameGroup(primaryOf(requested), guess.lang) ? undefined : guess.lang;
}

export interface IReconciledLanguage {
  /** The language to treat as the user's: the agent's tag, or the text's language when the tag was only the English fallback. */
  requested: string | undefined;
  /** The language the text is really written in. */
  content: string | undefined;
  /** True when the text is clearly not in the requested language (warn, offer a rewrite). */
  mismatch: boolean;
}

/**
 * The model gets the language wrong in one of two directions:
 * - text in English although the user wrote German (tag right, text wrong) → mismatch, keep the tag;
 * - tag "en" although it wrote the text in the user's language (tag wrong) → trust the text.
 * English is the model's fallback in both cases, so a non-English text wins over an "en" tag.
 */
export function reconcileLanguage(tag: string | undefined, text: string): IReconciledLanguage {
  const actual: string | undefined = detectMismatch(tag, text);
  if (!actual) {
    return { requested: tag, content: tag, mismatch: false };
  }
  if (actual !== 'en' && tag && primaryOf(tag) === 'en') {
    return { requested: actual, content: actual, mismatch: false };
  }
  return { requested: tag, content: actual, mismatch: true };
}