import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Slovenčina',
  detected: 'Rozpoznané',
  source: 'Zdroj',
  sources: { agent: 'agent', hostLocale: 'jazyk hostiteľa', sharePoint: 'SharePoint', browser: 'prehliadač', fallback: 'predvolené' },
  readAloud: 'Čítať nahlas',
  pause: 'Pozastaviť',
  resume: 'Pokračovať',
  stop: 'Zastaviť',
  reading: 'Číta sa nahlas',
  paused: 'Pozastavené',
  stopped: 'Zastavené',
  finished: 'Čítanie dokončené',
  noVoice: 'Žiadny hlas pre jazyk: {0}',
  speechUnavailable: 'Čítanie nahlas tu nie je k dispozícii',
  expand: 'Úplné zobrazenie',
  collapse: 'Kompaktné zobrazenie',
  tellMore: 'Povedz mi viac',
  tellMorePrompt: 'Povedz mi viac k téme „{0}“.',
  translateTo: 'Preložiť do',
  translatePrompt: 'Prelož túto kartu do tohto jazyka: {0}.',
  design: 'Návrh',
  designs: { editorial: 'Redakčný', classic: 'Klasický', dramatic: 'Dramatický', compact: 'Kompaktný', magazine: 'Magazín' },
  designChanged: 'Návrh: {0}',
  look: 'Vzhľad',
  layout: 'Rozloženie',
  layouts: { lead: 'Hlavný obrázok', teaser: 'Upútavka', beside: 'Bočný obrázok' },
  layoutChanged: 'Rozloženie: {0}',
  theme: 'Motív',
  themes: { auto: 'Automaticky', light: 'Svetlý', dark: 'Tmavý' },
  themeChanged: 'Motív: {0}',
  photo: 'Fotka',
  noImage: 'Nenašla sa žiadna fotka',
  diagnostics: 'Diagnostika',
  sent: 'Odoslané',
  sendFailed: 'Nepodarilo sa odoslať',
  linkFailed: 'Prepojenie sa nepodarilo otvoriť',
  loading: 'Načítava sa',
  readingTime: 'Čas čítania: {0}',
  textIn: 'Text: {0}',
  askedFor: 'požadované: {0}',
  rewriteIn: 'Prepísať v jazyku: {0}',
  rewritePrompt: 'Napíš, prosím, túto kartu znova v tomto jazyku: {0}.'
};

export default strings;
