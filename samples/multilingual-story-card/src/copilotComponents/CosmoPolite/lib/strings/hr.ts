import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Hrvatski',
  detected: 'Prepoznato',
  source: 'Izvor',
  sources: { agent: 'agent', hostLocale: 'jezik domaćina', sharePoint: 'SharePoint', browser: 'preglednik', fallback: 'zadano' },
  readAloud: 'Čitaj naglas',
  pause: 'Pauza',
  resume: 'Nastavi',
  stop: 'Zaustavi',
  reading: 'Čita se naglas',
  paused: 'Pauzirano',
  stopped: 'Zaustavljeno',
  finished: 'Čitanje je završeno',
  noVoice: 'Nema glasa za jezik: {0}',
  speechUnavailable: 'Čitanje naglas ovdje nije dostupno',
  expand: 'Potpuni prikaz',
  collapse: 'Kompaktni prikaz',
  tellMore: 'Reci mi više',
  tellMorePrompt: 'Reci mi više o „{0}”.',
  translateTo: 'Prevedi na',
  translatePrompt: 'Prevedi ovu karticu na sljedeći jezik: {0}.',
  design: 'Dizajn',
  designs: { editorial: 'Urednički', classic: 'Klasični', dramatic: 'Dramatični', compact: 'Kompaktni', magazine: 'Časopis' },
  designChanged: 'Dizajn: {0}',
  look: 'Izgled',
  layout: 'Raspored',
  layouts: { lead: 'Glavna slika', teaser: 'Najava', beside: 'Bočna slika' },
  layoutChanged: 'Raspored: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatski', light: 'Svijetla', dark: 'Tamna' },
  themeChanged: 'Tema: {0}',
  photo: 'Fotografija',
  noImage: 'Nije pronađena fotografija',
  diagnostics: 'Dijagnostika',
  sent: 'Poslano',
  sendFailed: 'Slanje nije uspjelo',
  linkFailed: 'Veza se nije mogla otvoriti',
  loading: 'Učitavanje',
  readingTime: 'Vrijeme čitanja: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'zatraženo: {0}',
  rewriteIn: 'Napiši ponovno na jeziku: {0}',
  rewritePrompt: 'Molim te, napiši ovu karticu ponovno na sljedećem jeziku: {0}.'
};

export default strings;
