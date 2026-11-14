import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Română',
  detected: 'Detectată',
  source: 'Sursă',
  sources: { agent: 'agent', hostLocale: 'setări regionale gazdă', sharePoint: 'SharePoint', browser: 'browser', fallback: 'implicit' },
  readAloud: 'Citește cu voce tare',
  pause: 'Pauză',
  resume: 'Reia',
  stop: 'Oprește',
  reading: 'Se citește cu voce tare',
  paused: 'În pauză',
  stopped: 'Oprit',
  finished: 'Citire terminată',
  noVoice: 'Nicio voce pentru limba: {0}',
  speechUnavailable: 'Citirea cu voce tare nu este disponibilă aici',
  expand: 'Vizualizare completă',
  collapse: 'Vizualizare compactă',
  tellMore: 'Spune-mi mai multe',
  tellMorePrompt: 'Spune-mi mai multe despre „{0}”.',
  translateTo: 'Tradu în',
  translatePrompt: 'Tradu acest card în următoarea limbă: {0}.',
  design: 'Design',
  designs: { editorial: 'Editorial', classic: 'Clasic', dramatic: 'Dramatic', compact: 'Compact', magazine: 'Revistă' },
  designChanged: 'Design: {0}',
  look: 'Aspect',
  layout: 'Aspect',
  layouts: { lead: 'Imagine principală', teaser: 'Teaser', beside: 'Imagine laterală' },
  layoutChanged: 'Aspect: {0}',
  theme: 'Temă',
  themes: { auto: 'Automată', light: 'Luminoasă', dark: 'Întunecată' },
  themeChanged: 'Temă: {0}',
  photo: 'Fotografie',
  noImage: 'Nu s-a găsit nicio fotografie',
  diagnostics: 'Diagnosticare',
  sent: 'Trimis',
  sendFailed: 'Nu s-a putut trimite',
  linkFailed: 'Nu s-a putut deschide linkul',
  loading: 'Se încarcă',
  readingTime: 'Timp de citire: {0}',
  textIn: 'Text: {0}',
  askedFor: 'solicitat: {0}',
  rewriteIn: 'Rescrie în limba: {0}',
  rewritePrompt: 'Te rog să rescrii acest card în următoarea limbă: {0}.'
};

export default strings;
