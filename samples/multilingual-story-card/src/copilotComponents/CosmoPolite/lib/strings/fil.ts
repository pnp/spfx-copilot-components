import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Filipino',
  detected: 'Natukoy',
  source: 'Pinagmulan',
  sources: { agent: 'agent', hostLocale: 'locale ng host', sharePoint: 'SharePoint', browser: 'browser', fallback: 'default' },
  readAloud: 'Basahin nang malakas',
  pause: 'I-pause',
  resume: 'Ituloy',
  stop: 'Ihinto',
  reading: 'Binabasa nang malakas',
  paused: 'Naka-pause',
  stopped: 'Inihinto',
  finished: 'Tapos nang basahin',
  noVoice: 'Walang boses para sa {0}',
  speechUnavailable: 'Hindi available dito ang pagbasa nang malakas',
  expand: 'Buong view',
  collapse: 'Compact na view',
  tellMore: 'Magkuwento pa',
  tellMorePrompt: 'Magkuwento ka pa tungkol sa “{0}”.',
  translateTo: 'Isalin sa',
  translatePrompt: 'Pakisalin ang card na ito sa {0}.',
  design: 'Disenyo',
  designs: { editorial: 'Editoryal', classic: 'Klasiko', dramatic: 'Dramatiko', compact: 'Compact', magazine: 'Magasin' },
  designChanged: 'Disenyo: {0}',
  look: 'Itsura',
  layout: 'Layout',
  layouts: { lead: 'Pangunahing larawan', teaser: 'Teaser', beside: 'Larawan sa gilid' },
  layoutChanged: 'Layout: {0}',
  theme: 'Tema',
  themes: { auto: 'Awtomatiko', light: 'Maliwanag', dark: 'Madilim' },
  themeChanged: 'Tema: {0}',
  photo: 'Larawan',
  noImage: 'Walang nakitang larawan',
  diagnostics: 'Diagnostics',
  sent: 'Naipadala',
  sendFailed: 'Hindi maipadala',
  linkFailed: 'Hindi mabuksan ang link',
  loading: 'Naglo-load',
  readingTime: 'Oras ng pagbasa: {0}',
  textIn: 'Teksto: {0}',
  askedFor: 'hiniling: {0}',
  rewriteIn: 'Isulat muli sa {0}',
  rewritePrompt: 'Pakisulat muli ang card na ito sa {0}.'
};

export default strings;
