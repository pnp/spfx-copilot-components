import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

const strings: IUiStrings = {
  languageName: 'Svenska',
  detected: 'Identifierat',
  source: 'Källa',
  sources: { agent: 'agent', hostLocale: 'värdens språk', sharePoint: 'SharePoint', browser: 'webbläsare', fallback: 'standard' },
  readAloud: 'Läs upp',
  pause: 'Pausa',
  resume: 'Fortsätt',
  stop: 'Stoppa',
  reading: 'Läser upp',
  paused: 'Pausad',
  stopped: 'Stoppad',
  finished: 'Uppläsningen är klar',
  noVoice: 'Ingen röst för {0}',
  speechUnavailable: 'Uppläsning är inte tillgänglig här',
  expand: 'Helvy',
  collapse: 'Kompakt vy',
  tellMore: 'Berätta mer',
  tellMorePrompt: 'Berätta mer om ”{0}”.',
  translateTo: 'Översätt till',
  translatePrompt: 'Översätt det här kortet till {0}.',
  design: 'Design',
  designs: { editorial: 'Redaktionell', classic: 'Klassisk', dramatic: 'Dramatisk', compact: 'Kompakt', magazine: 'Magasin' },
  designChanged: 'Design: {0}',
  look: 'Utseende',
  layout: 'Layout',
  layouts: { lead: 'Huvudbild', teaser: 'Puff', beside: 'Sidobild' },
  layoutChanged: 'Layout: {0}',
  theme: 'Tema',
  themes: { auto: 'Auto', light: 'Ljust', dark: 'Mörkt' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Inget foto hittades',
  diagnostics: 'Diagnostik',
  sent: 'Skickat',
  sendFailed: 'Det gick inte att skicka',
  linkFailed: 'Länken kunde inte öppnas',
  loading: 'Läser in',
  readingTime: 'Lästid: {0}',
  textIn: 'Text: {0}',
  askedFor: 'efterfrågat: {0}',
  rewriteIn: 'Skriv om på {0}',
  rewritePrompt: 'Skriv om det här kortet på {0}, tack.'
};

export default strings;
