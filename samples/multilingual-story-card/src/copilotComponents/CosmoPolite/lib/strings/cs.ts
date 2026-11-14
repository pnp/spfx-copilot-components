import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Čeština',
  detected: 'Rozpoznáno',
  source: 'Zdroj',
  sources: { agent: 'agent', hostLocale: 'jazyk hostitele', sharePoint: 'SharePoint', browser: 'prohlížeč', fallback: 'výchozí' },
  readAloud: 'Přečíst nahlas',
  pause: 'Pozastavit',
  resume: 'Pokračovat',
  stop: 'Zastavit',
  reading: 'Čte se nahlas',
  paused: 'Pozastaveno',
  stopped: 'Zastaveno',
  finished: 'Čtení dokončeno',
  noVoice: 'Žádný hlas pro jazyk: {0}',
  speechUnavailable: 'Čtení nahlas tady není k dispozici',
  expand: 'Úplné zobrazení',
  collapse: 'Kompaktní zobrazení',
  tellMore: 'Řekni mi víc',
  tellMorePrompt: 'Řekni mi víc k tématu „{0}“.',
  translateTo: 'Přeložit do',
  translatePrompt: 'Přelož tuto kartu do tohoto jazyka: {0}.',
  design: 'Návrh',
  designs: { editorial: 'Redakční', classic: 'Klasický', dramatic: 'Dramatický', compact: 'Kompaktní', magazine: 'Magazín' },
  designChanged: 'Návrh: {0}',
  look: 'Vzhled',
  layout: 'Rozložení',
  layouts: { lead: 'Hlavní obrázek', teaser: 'Upoutávka', beside: 'Boční obrázek' },
  layoutChanged: 'Rozložení: {0}',
  theme: 'Motiv',
  themes: { auto: 'Automaticky', light: 'Světlý', dark: 'Tmavý' },
  themeChanged: 'Motiv: {0}',
  photo: 'Fotka',
  noImage: 'Nenašla se žádná fotka',
  diagnostics: 'Diagnostika',
  sent: 'Odesláno',
  sendFailed: 'Nepodařilo se odeslat',
  linkFailed: 'Odkaz se nepodařilo otevřít',
  loading: 'Načítání',
  readingTime: 'Doba čtení: {0}',
  textIn: 'Text: {0}',
  askedFor: 'požadováno: {0}',
  rewriteIn: 'Přepsat v jazyce: {0}',
  rewritePrompt: 'Napiš prosím tuto kartu znovu v tomto jazyce: {0}.'
};

export default strings;
