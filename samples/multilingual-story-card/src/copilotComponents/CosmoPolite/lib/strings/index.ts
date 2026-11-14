// UI strings for the card chrome, switchable per turn.
//
// SPFx loc files (loc/*.js) are resolved once by the loader when the bundle loads, so they can't
// follow a language change inside a Copilot session. These tables are picked per card from the
// language the agent detected in the latest message (tool input), with fallbacks.
//
// The chrome covers every language Microsoft 365 Copilot supports for work and school accounts
// (support.microsoft.com, "Supported languages for Microsoft 365 Copilot", September 2026) plus
// Viennese (de-AT), Swiss Standard German (de-CH), Swiss German dialect (gsw), Urdu (ur) and seven
// African languages: Amharic (am), Swahili (sw), Afrikaans (af), Zulu (zu), Yoruba (yo), Hausa (ha) and
// Somali (so). English is bundled; every other table is its own webpack chunk, loaded on demand.

import en from './en';
import type { IUiStrings } from './types';

export * from './types';

export const UI_LANGUAGE_TAGS = [
  'sq', 'ar', 'bg', 'zh-Hans', 'zh-Hant', 'hr', 'ca', 'cs', 'da', 'nl', 'en', 'et', 'fil', 'fi', 'fr', 'fr-CA',
  'de', 'de-AT', 'de-CH', 'gsw', 'el', 'he', 'hu', 'is', 'id', 'it', 'ja', 'ko', 'lv', 'lt', 'ms', 'mt', 'nb', 'pl', 'pt-BR',
  'pt-PT', 'ro', 'ru', 'sr-Cyrl', 'sr-Latn', 'sk', 'sl', 'es', 'es-MX', 'sv', 'th', 'tr', 'uk', 'ur', 'vi', 'cy', 'am', 'sw', 'af', 'zu', 'yo', 'ha', 'so'
] as const;

export type UiLanguage = (typeof UI_LANGUAGE_TAGS)[number];

interface IStringsModule {
  default: IUiStrings;
  reviewed?: boolean;
}

type Loader = () => Promise<IStringsModule>;

// One literal import() per table, so webpack emits one chunk each.
const LOADERS: Record<Exclude<UiLanguage, 'en'>, Loader> = {
  sq: () => import(/* webpackChunkName: "cosmopolite-strings-sq" */ './sq'),
  ar: () => import(/* webpackChunkName: "cosmopolite-strings-ar" */ './ar'),
  ur: () => import(/* webpackChunkName: "cosmopolite-strings-ur" */ './ur'),
  am: () => import(/* webpackChunkName: "cosmopolite-strings-am" */ './am'),
  sw: () => import(/* webpackChunkName: "cosmopolite-strings-sw" */ './sw'),
  af: () => import(/* webpackChunkName: "cosmopolite-strings-af" */ './af'),
  zu: () => import(/* webpackChunkName: "cosmopolite-strings-zu" */ './zu'),
  yo: () => import(/* webpackChunkName: "cosmopolite-strings-yo" */ './yo'),
  ha: () => import(/* webpackChunkName: "cosmopolite-strings-ha" */ './ha'),
  so: () => import(/* webpackChunkName: "cosmopolite-strings-so" */ './so'),
  bg: () => import(/* webpackChunkName: "cosmopolite-strings-bg" */ './bg'),
  'zh-Hans': () => import(/* webpackChunkName: "cosmopolite-strings-zh-Hans" */ './zh-Hans'),
  'zh-Hant': () => import(/* webpackChunkName: "cosmopolite-strings-zh-Hant" */ './zh-Hant'),
  hr: () => import(/* webpackChunkName: "cosmopolite-strings-hr" */ './hr'),
  ca: () => import(/* webpackChunkName: "cosmopolite-strings-ca" */ './ca'),
  cs: () => import(/* webpackChunkName: "cosmopolite-strings-cs" */ './cs'),
  da: () => import(/* webpackChunkName: "cosmopolite-strings-da" */ './da'),
  nl: () => import(/* webpackChunkName: "cosmopolite-strings-nl" */ './nl'),
  et: () => import(/* webpackChunkName: "cosmopolite-strings-et" */ './et'),
  fil: () => import(/* webpackChunkName: "cosmopolite-strings-fil" */ './fil'),
  fi: () => import(/* webpackChunkName: "cosmopolite-strings-fi" */ './fi'),
  fr: () => import(/* webpackChunkName: "cosmopolite-strings-fr" */ './fr'),
  'fr-CA': () => import(/* webpackChunkName: "cosmopolite-strings-fr-CA" */ './fr-CA'),
  de: () => import(/* webpackChunkName: "cosmopolite-strings-de" */ './de'),
  'de-AT': () => import(/* webpackChunkName: "cosmopolite-strings-de-AT" */ './de-AT'),
  'de-CH': () => import(/* webpackChunkName: "cosmopolite-strings-de-CH" */ './de-CH'),
  gsw: () => import(/* webpackChunkName: "cosmopolite-strings-gsw" */ './gsw'),
  el: () => import(/* webpackChunkName: "cosmopolite-strings-el" */ './el'),
  he: () => import(/* webpackChunkName: "cosmopolite-strings-he" */ './he'),
  hu: () => import(/* webpackChunkName: "cosmopolite-strings-hu" */ './hu'),
  is: () => import(/* webpackChunkName: "cosmopolite-strings-is" */ './is'),
  id: () => import(/* webpackChunkName: "cosmopolite-strings-id" */ './id'),
  it: () => import(/* webpackChunkName: "cosmopolite-strings-it" */ './it'),
  ja: () => import(/* webpackChunkName: "cosmopolite-strings-ja" */ './ja'),
  ko: () => import(/* webpackChunkName: "cosmopolite-strings-ko" */ './ko'),
  lv: () => import(/* webpackChunkName: "cosmopolite-strings-lv" */ './lv'),
  lt: () => import(/* webpackChunkName: "cosmopolite-strings-lt" */ './lt'),
  ms: () => import(/* webpackChunkName: "cosmopolite-strings-ms" */ './ms'),
  mt: () => import(/* webpackChunkName: "cosmopolite-strings-mt" */ './mt'),
  nb: () => import(/* webpackChunkName: "cosmopolite-strings-nb" */ './nb'),
  pl: () => import(/* webpackChunkName: "cosmopolite-strings-pl" */ './pl'),
  'pt-BR': () => import(/* webpackChunkName: "cosmopolite-strings-pt-BR" */ './pt-BR'),
  'pt-PT': () => import(/* webpackChunkName: "cosmopolite-strings-pt-PT" */ './pt-PT'),
  ro: () => import(/* webpackChunkName: "cosmopolite-strings-ro" */ './ro'),
  ru: () => import(/* webpackChunkName: "cosmopolite-strings-ru" */ './ru'),
  'sr-Cyrl': () => import(/* webpackChunkName: "cosmopolite-strings-sr-Cyrl" */ './sr-Cyrl'),
  'sr-Latn': () => import(/* webpackChunkName: "cosmopolite-strings-sr-Latn" */ './sr-Latn'),
  sk: () => import(/* webpackChunkName: "cosmopolite-strings-sk" */ './sk'),
  sl: () => import(/* webpackChunkName: "cosmopolite-strings-sl" */ './sl'),
  es: () => import(/* webpackChunkName: "cosmopolite-strings-es" */ './es'),
  'es-MX': () => import(/* webpackChunkName: "cosmopolite-strings-es-MX" */ './es-MX'),
  sv: () => import(/* webpackChunkName: "cosmopolite-strings-sv" */ './sv'),
  th: () => import(/* webpackChunkName: "cosmopolite-strings-th" */ './th'),
  tr: () => import(/* webpackChunkName: "cosmopolite-strings-tr" */ './tr'),
  uk: () => import(/* webpackChunkName: "cosmopolite-strings-uk" */ './uk'),
  vi: () => import(/* webpackChunkName: "cosmopolite-strings-vi" */ './vi'),
  cy: () => import(/* webpackChunkName: "cosmopolite-strings-cy" */ './cy')
};

const BY_LOWER: Record<string, UiLanguage> = {};
UI_LANGUAGE_TAGS.forEach((tag: UiLanguage) => {
  BY_LOWER[tag.toLowerCase()] = tag;
});

/** Legacy and sibling codes a model or browser may send. */
const ALIASES: Record<string, UiLanguage> = {
  bar: 'de-AT',
  als: 'gsw',
  no: 'nb',
  nn: 'nb',
  tl: 'fil',
  iw: 'he',
  in: 'id',
  zh: 'zh-Hans',
  sr: 'sr-Cyrl',
  pt: 'pt-BR'
};

/** Latin American Spanish regions → es-MX; other Spanish → es. */
const LATAM: string[] = ['mx', '419', 'us', 'ar', 'co', 'cl', 'pe', 've', 'ec', 'gt', 'cu', 'bo', 'do', 'hn', 'py', 'sv', 'ni', 'cr', 'pa', 'uy', 'pr'];

/** Maps any BCP 47-ish tag to a UI table, or undefined if no table fits. */
export function matchLanguage(tag: string | undefined): UiLanguage | undefined {
  if (!tag) {
    return undefined;
  }
  const t: string = String(tag).trim().toLowerCase().replace(/_/g, '-');
  if (!t) {
    return undefined;
  }
  if (BY_LOWER[t]) {
    return BY_LOWER[t];
  }
  const parts: string[] = t.split('-');
  const primary: string = parts[0];
  const rest: string[] = parts.slice(1);
  const has = (subtag: string): boolean => rest.indexOf(subtag) !== -1;

  switch (primary) {
    case 'de':
      return has('at') ? 'de-AT' : has('ch') || has('li') ? 'de-CH' : 'de';
    case 'gsw':
      return 'gsw';
    case 'bar':
      return 'de-AT';
    case 'zh':
      return has('hant') || has('tw') || has('hk') || has('mo') ? 'zh-Hant' : 'zh-Hans';
    case 'sr':
      return has('latn') ? 'sr-Latn' : 'sr-Cyrl';
    case 'pt':
      return rest.length === 0 || has('br') ? 'pt-BR' : 'pt-PT';
    case 'fr':
      return has('ca') ? 'fr-CA' : 'fr';
    case 'es':
      return rest.some((s: string) => LATAM.indexOf(s) !== -1) ? 'es-MX' : 'es';
    case 'en':
      return 'en';
    default:
      break;
  }
  return ALIASES[primary] || BY_LOWER[primary];
}

export function englishStrings(): IUiStrings {
  return en;
}

export interface IStringTable {
  strings: IUiStrings;
  /** Reviewed by a native speaker (shown in diagnostics). */
  reviewed: boolean;
}

/** The table for `lang`, with its review flag; English if the chunk can't be loaded. */
export async function loadStringTable(lang: UiLanguage): Promise<IStringTable> {
  if (lang === 'en') {
    return { strings: en, reviewed: true };
  }
  try {
    const mod: IStringsModule = await LOADERS[lang]();
    return mod.default ? { strings: mod.default, reviewed: mod.reviewed === true } : { strings: en, reviewed: true };
  } catch {
    return { strings: en, reviewed: true };
  }
}

/** The table for `lang`; English if the chunk can't be loaded. */
export async function loadStrings(lang: UiLanguage): Promise<IUiStrings> {
  return (await loadStringTable(lang)).strings;
}
