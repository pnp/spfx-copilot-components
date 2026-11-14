import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Hausa, West Africa (Nigeria, Niger). Latin script (Boko) with ɓ ɗ ƙ.
const strings: IUiStrings = {
  languageName: 'Hausa',
  detected: 'An gano',
  source: 'Tushe',
  sources: { agent: 'wakili', hostLocale: 'harshen mai masauki', sharePoint: 'SharePoint', browser: 'mai bincike', fallback: 'tsoho' },
  readAloud: 'Karanta da ƙarfi',
  pause: 'Dakata',
  resume: 'Ci gaba',
  stop: 'Tsaya',
  reading: 'Ana karantawa da ƙarfi',
  paused: 'An dakata',
  stopped: 'An tsaya',
  finished: 'An gama karantawa',
  noVoice: 'Babu murya don {0}',
  speechUnavailable: 'Karantawa da ƙarfi ba ya samuwa a nan',
  expand: 'Cikakken gani',
  collapse: 'Taƙaitaccen gani',
  tellMore: 'Ƙara gaya mini',
  tellMorePrompt: 'Ƙara gaya mini game da “{0}”.',
  translateTo: 'Fassara zuwa',
  translatePrompt: 'Fassara wannan katin zuwa {0}.',
  design: 'Zane',
  designs: { editorial: 'Na edita', classic: 'Na gargajiya', dramatic: 'Mai ban sha’awa', compact: 'Ƙarami', magazine: 'Mujalla' },
  designChanged: 'Zane: {0}',
  look: 'Kamanni',
  layout: 'Tsari',
  layouts: { lead: 'Babban hoto', teaser: 'Taƙaitawa', beside: 'Hoto a gefe' },
  layoutChanged: 'Tsari: {0}',
  theme: 'Jigo',
  themes: { auto: 'Atomatik', light: 'Haske', dark: 'Duhu' },
  themeChanged: 'Jigo: {0}',
  photo: 'Hoto',
  noImage: 'Ba a sami hoto ba',
  diagnostics: 'Bincike',
  sent: 'An aika',
  sendFailed: 'An kasa aikawa',
  linkFailed: 'An kasa buɗe mahaɗin',
  loading: 'Ana lodawa',
  readingTime: 'Lokacin karatu: {0}',
  textIn: 'Rubutu: {0}',
  askedFor: 'an nema: {0}',
  rewriteIn: 'Sake rubutawa da {0}',
  rewritePrompt: 'Don Allah sake rubuta wannan katin da {0}.'
};

export default strings;
