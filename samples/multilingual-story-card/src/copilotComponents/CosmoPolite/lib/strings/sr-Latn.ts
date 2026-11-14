import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Srpski (latinica)',
  detected: 'Otkriveno',
  source: 'Izvor',
  sources: { agent: 'agent', hostLocale: 'lokalitet hosta', sharePoint: 'SharePoint', browser: 'pregledač', fallback: 'podrazumevano' },
  readAloud: 'Čitaj naglas',
  pause: 'Pauza',
  resume: 'Nastavi',
  stop: 'Zaustavi',
  reading: 'Čita se naglas',
  paused: 'Pauzirano',
  stopped: 'Zaustavljeno',
  finished: 'Čitanje je završeno',
  noVoice: 'Nema glasa za jezik: {0}',
  speechUnavailable: 'Čitanje naglas ovde nije dostupno',
  expand: 'Pun prikaz',
  collapse: 'Kompaktni prikaz',
  tellMore: 'Reci mi više',
  tellMorePrompt: 'Reci mi više o „{0}“.',
  translateTo: 'Prevedi na',
  translatePrompt: 'Prevedi ovu karticu na sledeći jezik: {0}.',
  design: 'Dizajn',
  designs: { editorial: 'Urednički', classic: 'Klasični', dramatic: 'Dramatični', compact: 'Kompaktni', magazine: 'Časopis' },
  designChanged: 'Dizajn: {0}',
  look: 'Izgled',
  layout: 'Raspored',
  layouts: { lead: 'Glavna slika', teaser: 'Najava', beside: 'Bočna slika' },
  layoutChanged: 'Raspored: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatski', light: 'Svetla', dark: 'Tamna' },
  themeChanged: 'Tema: {0}',
  photo: 'Fotografija',
  noImage: 'Nije pronađena fotografija',
  diagnostics: 'Dijagnostika',
  sent: 'Poslato',
  sendFailed: 'Slanje nije uspelo',
  linkFailed: 'Veza nije mogla da se otvori',
  loading: 'Učitavanje',
  readingTime: 'Vreme čitanja: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'traženo: {0}',
  rewriteIn: 'Napiši ponovo na jeziku: {0}',
  rewritePrompt: 'Napiši ovu karticu ponovo na sledećem jeziku: {0}.'
};

export default strings;
