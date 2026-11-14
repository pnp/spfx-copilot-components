import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Afrikaans, South Africa and Namibia. Close to Dutch (lib/detect.ts groups them).
const strings: IUiStrings = {
  languageName: 'Afrikaans',
  detected: 'Bespeur',
  source: 'Bron',
  sources: { agent: 'agent', hostLocale: 'gasheertaal', sharePoint: 'SharePoint', browser: 'blaaier', fallback: 'verstek' },
  readAloud: 'Lees hardop',
  pause: 'Pouseer',
  resume: 'Hervat',
  stop: 'Stop',
  reading: 'Lees hardop',
  paused: 'Gepouseer',
  stopped: 'Gestop',
  finished: 'Klaar gelees',
  noVoice: 'Geen stem vir {0} nie',
  speechUnavailable: 'Hardoplees is nie hier beskikbaar nie',
  expand: 'Volle aansig',
  collapse: 'Kompakte aansig',
  tellMore: 'Vertel my meer',
  tellMorePrompt: 'Vertel my meer oor “{0}”.',
  translateTo: 'Vertaal na',
  translatePrompt: 'Vertaal hierdie kaart na {0}.',
  design: 'Ontwerp',
  designs: { editorial: 'Redaksioneel', classic: 'Klassiek', dramatic: 'Dramaties', compact: 'Kompak', magazine: 'Tydskrif' },
  designChanged: 'Ontwerp: {0}',
  look: 'Voorkoms',
  layout: 'Uitleg',
  layouts: { lead: 'Hoofprent', teaser: 'Voorsmakie', beside: 'Prent langsaan' },
  layoutChanged: 'Uitleg: {0}',
  theme: 'Tema',
  themes: { auto: 'Outomaties', light: 'Lig', dark: 'Donker' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Geen foto gevind nie',
  diagnostics: 'Diagnostiek',
  sent: 'Gestuur',
  sendFailed: 'Kon nie stuur nie',
  linkFailed: 'Kon nie die skakel oopmaak nie',
  loading: 'Laai',
  readingTime: 'Leestyd: {0}',
  textIn: 'Teks: {0}',
  askedFor: 'gevra: {0}',
  rewriteIn: 'Herskryf in {0}',
  rewritePrompt: 'Herskryf asseblief hierdie kaart in {0}.'
};

export default strings;
