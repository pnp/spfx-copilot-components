import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Zulu (isiZulu), South Africa.
const strings: IUiStrings = {
  languageName: 'isiZulu',
  detected: 'Kutholiwe',
  source: 'Umthombo',
  sources: { agent: 'umenzeli', hostLocale: 'ulimi lomsingathi', sharePoint: 'SharePoint', browser: 'isiphequluli', fallback: 'okuzenzakalelayo' },
  readAloud: 'Funda ngokuzwakalayo',
  pause: 'Misa okwesikhashana',
  resume: 'Qhubeka',
  stop: 'Misa',
  reading: 'Iyafunda ngokuzwakalayo',
  paused: 'Kumiswe okwesikhashana',
  stopped: 'Kumisiwe',
  finished: 'Ukufunda kuqediwe',
  noVoice: 'Alikho izwi le-{0}',
  speechUnavailable: 'Ukufunda ngokuzwakalayo akutholakali lapha',
  expand: 'Ukubuka okugcwele',
  collapse: 'Ukubuka okuncane',
  tellMore: 'Ngitshele okwengeziwe',
  tellMorePrompt: 'Ngitshele okwengeziwe nge-“{0}”.',
  translateTo: 'Humushela ku',
  translatePrompt: 'Humushela leli khadi ku-{0}.',
  design: 'Umklamo',
  designs: { editorial: 'Okwabahleli', classic: 'Okwakudala', dramatic: 'Okumangalisayo', compact: 'Okuminyene', magazine: 'Umagazini' },
  designChanged: 'Umklamo: {0}',
  look: 'Ukubukeka',
  layout: 'Isakhiwo',
  layouts: { lead: 'Isithombe esikhulu', teaser: 'Isifinyezo', beside: 'Isithombe eceleni' },
  layoutChanged: 'Isakhiwo: {0}',
  theme: 'Itimu',
  themes: { auto: 'Okuzenzakalelayo', light: 'Ukukhanya', dark: 'Ubumnyama' },
  themeChanged: 'Itimu: {0}',
  photo: 'Isithombe',
  noImage: 'Asikho isithombe esitholakele',
  diagnostics: 'Ukuhlola',
  sent: 'Kuthunyelwe',
  sendFailed: 'Akukwazanga ukuthumela',
  linkFailed: 'Akukwazanga ukuvula isixhumanisi',
  loading: 'Iyalayisha',
  readingTime: 'Isikhathi sokufunda: {0}',
  textIn: 'Umbhalo: {0}',
  askedFor: 'kucelwe: {0}',
  rewriteIn: 'Bhala kabusha nge-{0}',
  rewritePrompt: 'Sicela ubhale leli khadi kabusha nge-{0}.'
};

export default strings;
