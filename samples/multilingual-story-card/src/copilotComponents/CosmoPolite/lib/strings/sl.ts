import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Slovenščina',
  detected: 'Zaznano',
  source: 'Vir',
  sources: { agent: 'agent', hostLocale: 'področne nastavitve gostitelja', sharePoint: 'SharePoint', browser: 'brskalnik', fallback: 'privzeto' },
  readAloud: 'Preberi na glas',
  pause: 'Začasno ustavi',
  resume: 'Nadaljuj',
  stop: 'Ustavi',
  reading: 'Branje na glas',
  paused: 'Začasno ustavljeno',
  stopped: 'Ustavljeno',
  finished: 'Branje je končano',
  noVoice: 'Ni glasu za jezik: {0}',
  speechUnavailable: 'Branje na glas tukaj ni na voljo',
  expand: 'Celoten pogled',
  collapse: 'Strnjen pogled',
  tellMore: 'Povej mi več',
  tellMorePrompt: 'Povej mi več o „{0}“.',
  translateTo: 'Prevedi v',
  translatePrompt: 'Prevedi to kartico v naslednji jezik: {0}.',
  design: 'Oblikovanje',
  designs: { editorial: 'Uredniško', classic: 'Klasično', dramatic: 'Dramatično', compact: 'Strnjeno', magazine: 'Revija' },
  designChanged: 'Oblikovanje: {0}',
  look: 'Videz',
  layout: 'Postavitev',
  layouts: { lead: 'Glavna slika', teaser: 'Napovednik', beside: 'Stranska slika' },
  layoutChanged: 'Postavitev: {0}',
  theme: 'Tema',
  themes: { auto: 'Samodejno', light: 'Svetla', dark: 'Temna' },
  themeChanged: 'Tema: {0}',
  photo: 'Fotografija',
  noImage: 'Ni najdene fotografije',
  diagnostics: 'Diagnostika',
  sent: 'Poslano',
  sendFailed: 'Pošiljanje ni uspelo',
  linkFailed: 'Povezave ni bilo mogoče odpreti',
  loading: 'Nalaganje',
  readingTime: 'Čas branja: {0}',
  textIn: 'Besedilo: {0}',
  askedFor: 'zahtevano: {0}',
  rewriteIn: 'Napiši znova v jeziku: {0}',
  rewritePrompt: 'Prosim, napiši to kartico znova v naslednjem jeziku: {0}.'
};

export default strings;
