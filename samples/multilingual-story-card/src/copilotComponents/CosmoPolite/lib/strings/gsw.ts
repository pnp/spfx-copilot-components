import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

// Swiss German (Schwiizerdütsch), Zürich-flavoured. Like Viennese (de-AT) it is a dialect, not a
// written standard: it proves the agent can tell it apart and the chrome follows per turn.
// Swiss spelling: no ß, guillemets «…».
const strings: IUiStrings = {
  languageName: 'Schwiizerdütsch',
  detected: 'Erkännt',
  source: 'Quelle',
  sources: { agent: 'Agent', hostLocale: 'Host-Sprach', sharePoint: 'SharePoint', browser: 'Browser', fallback: 'Standard' },
  readAloud: 'Vorläse',
  pause: 'Pause',
  resume: 'Wiiter',
  stop: 'Stopp',
  reading: 'Am Vorläse',
  paused: 'Aaghalte',
  stopped: 'Gstoppt',
  finished: 'Fertig vorgläse',
  noVoice: 'Kei Stimm für {0}',
  speechUnavailable: 'Vorläse gaht da nöd',
  expand: 'Grossi Aasicht',
  collapse: 'Chlini Aasicht',
  tellMore: 'Verzell mer meh',
  tellMorePrompt: 'Verzell mer meh über «{0}».',
  translateTo: 'Übersetze i',
  translatePrompt: 'Übersetz die Charte i die Sprach: {0}.',
  design: 'Usgseh',
  designs: { editorial: 'Feuilleton', classic: 'Klassisch', dramatic: 'Dramatisch', compact: 'Kompakt', magazine: 'Heftli' },
  designChanged: 'Usgseh: {0}',
  look: 'Gstaltig',
  layout: 'Ufbau',
  layouts: { lead: 'Grosses Bild', teaser: 'Aareisser', beside: 'Bild dernäbe' },
  layoutChanged: 'Ufbau: {0}',
  theme: 'Farbe',
  themes: { auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' },
  themeChanged: 'Farbe: {0}',
  photo: 'Foti',
  noImage: 'Kei Foti gfunde',
  diagnostics: 'Diagnose',
  sent: 'Gschickt',
  sendFailed: 'Hät nöd klappt',
  linkFailed: 'De Link gaht nöd uf',
  loading: 'Am Lade',
  readingTime: 'Läsezyt: {0}',
  textIn: 'Text: {0}',
  askedFor: 'gwünscht: {0}',
  rewriteIn: 'Uf {0} neu schriibe',
  rewritePrompt: 'Schriib die Charte bitte nomal i de Sprach: {0}.'
};

export default strings;
