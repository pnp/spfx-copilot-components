import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Eesti',
  detected: 'Tuvastatud',
  source: 'Allikas',
  sources: { agent: 'agent', hostLocale: 'hosti lokaat', sharePoint: 'SharePoint', browser: 'brauser', fallback: 'vaikimisi' },
  readAloud: 'Loe ette',
  pause: 'Paus',
  resume: 'Jätka',
  stop: 'Peata',
  reading: 'Loetakse ette',
  paused: 'Pausil',
  stopped: 'Peatatud',
  finished: 'Ettelugemine lõpetatud',
  noVoice: 'Hääl puudub, keel: {0}',
  speechUnavailable: 'Ettelugemine pole siin saadaval',
  expand: 'Täisvaade',
  collapse: 'Kompaktvaade',
  tellMore: 'Räägi lähemalt',
  tellMorePrompt: 'Räägi mulle lähemalt teemal „{0}“.',
  translateTo: 'Tõlgi keelde',
  translatePrompt: 'Tõlgi see kaart järgmisesse keelde: {0}.',
  design: 'Kujundus',
  designs: { editorial: 'Toimetuslik', classic: 'Klassikaline', dramatic: 'Dramaatiline', compact: 'Kompaktne', magazine: 'Ajakiri' },
  designChanged: 'Kujundus: {0}',
  look: 'Välimus',
  layout: 'Paigutus',
  layouts: { lead: 'Põhipilt', teaser: 'Tiiser', beside: 'Külgpilt' },
  layoutChanged: 'Paigutus: {0}',
  theme: 'Teema',
  themes: { auto: 'Automaatne', light: 'Hele', dark: 'Tume' },
  themeChanged: 'Teema: {0}',
  photo: 'Foto',
  noImage: 'Fotot ei leitud',
  diagnostics: 'Diagnostika',
  sent: 'Saadetud',
  sendFailed: 'Ei saanud saata',
  linkFailed: 'Linki ei saanud avada',
  loading: 'Laadimine',
  readingTime: 'Lugemisaeg: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'soovitud: {0}',
  rewriteIn: 'Kirjuta ümber, keel: {0}',
  rewritePrompt: 'Palun kirjuta see kaart uuesti järgmises keeles: {0}.'
};

export default strings;
