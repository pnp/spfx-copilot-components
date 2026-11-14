import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

const strings: IUiStrings = {
  languageName: 'Weanarisch',
  detected: 'Daspechtlt',
  source: 'Vo wo',
  sources: { agent: 'Agent', hostLocale: 'Host-Sproch', sharePoint: 'SharePoint', browser: 'Browser', fallback: 'Notlösung' },
  readAloud: 'Vuarlesn',
  pause: 'Hoit amoi',
  resume: 'Weida',
  stop: 'Aus',
  reading: 'Wird vuargleesn',
  paused: 'Pausiert',
  stopped: 'Aus is',
  finished: 'Featig vuargleesn',
  noVoice: 'Ka Stimm fia {0}',
  speechUnavailable: 'Vuarlesn geht do ned',
  expand: 'Groß aufmochn',
  collapse: 'Wieda klan mochn',
  tellMore: 'Vazö ma mehr',
  tellMorePrompt: 'Vazö ma mehr über „{0}“.',
  translateTo: 'Übasetzn in',
  translatePrompt: 'Übasetz de Koartn in de Sproch: {0}.',
  design: 'Ausschaun',
  designs: { editorial: 'Feuilleton', classic: 'Klassisch', dramatic: 'Dramatisch', compact: 'Kompakt', magazine: 'Heftl' },
  designChanged: 'Ausschaun: {0}',
  look: 'Aufmachung',
  layout: 'Aufbau',
  layouts: { lead: 'Großes Büdl', teaser: 'Appetithappal', beside: 'Büdl danebn' },
  layoutChanged: 'Aufbau: {0}',
  theme: 'Farbn',
  themes: { auto: 'Wia’s kummt', light: 'Hö', dark: 'Finsta' },
  themeChanged: 'Farbn: {0}',
  photo: 'Foto',
  noImage: 'Ka Büdl gfundn',
  diagnostics: 'Untasuachung',
  sent: 'Gschickt',
  sendFailed: 'Hot ned highaut',
  linkFailed: 'Link geht ned auf',
  loading: 'Lod grod',
  readingTime: 'Lesezeit: {0}',
  textIn: 'Gschriebn in: {0}',
  askedFor: 'woit ma: {0}',
  rewriteIn: 'Auf {0} umschreibn',
  rewritePrompt: 'Schreib ma de Koartn bitte nomoi auf {0}.'
};

export default strings;
