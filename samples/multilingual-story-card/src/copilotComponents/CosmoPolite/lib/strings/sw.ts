import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Swahili (Kiswahili), East Africa.
const strings: IUiStrings = {
  languageName: 'Kiswahili',
  detected: 'Imetambuliwa',
  source: 'Chanzo',
  sources: { agent: 'wakala', hostLocale: 'lugha ya mwenyeji', sharePoint: 'SharePoint', browser: 'kivinjari', fallback: 'chaguo-msingi' },
  readAloud: 'Soma kwa sauti',
  pause: 'Sitisha',
  resume: 'Endelea',
  stop: 'Simamisha',
  reading: 'Inasoma kwa sauti',
  paused: 'Imesitishwa',
  stopped: 'Imesimamishwa',
  finished: 'Usomaji umekamilika',
  noVoice: 'Hakuna sauti ya {0}',
  speechUnavailable: 'Kusoma kwa sauti hakupatikani hapa',
  expand: 'Mwonekano kamili',
  collapse: 'Mwonekano mfupi',
  tellMore: 'Niambie zaidi',
  tellMorePrompt: 'Niambie zaidi kuhusu “{0}”.',
  translateTo: 'Tafsiri kwa',
  translatePrompt: 'Tafsiri kadi hii kwa {0}.',
  design: 'Muundo',
  designs: { editorial: 'Kihariri', classic: 'Kawaida', dramatic: 'Kusisimua', compact: 'Fupi', magazine: 'Jarida' },
  designChanged: 'Muundo: {0}',
  look: 'Mwonekano',
  layout: 'Mpangilio',
  layouts: { lead: 'Picha kuu', teaser: 'Kionjo', beside: 'Picha pembeni' },
  layoutChanged: 'Mpangilio: {0}',
  theme: 'Mandhari',
  themes: { auto: 'Otomatiki', light: 'Mwanga', dark: 'Giza' },
  themeChanged: 'Mandhari: {0}',
  photo: 'Picha',
  noImage: 'Hakuna picha iliyopatikana',
  diagnostics: 'Uchunguzi',
  sent: 'Imetumwa',
  sendFailed: 'Imeshindwa kutuma',
  linkFailed: 'Imeshindwa kufungua kiungo',
  loading: 'Inapakia',
  readingTime: 'Muda wa kusoma: {0}',
  textIn: 'Maandishi: {0}',
  askedFor: 'imeombwa: {0}',
  rewriteIn: 'Andika upya kwa {0}',
  rewritePrompt: 'Tafadhali andika kadi hii upya kwa {0}.'
};

export default strings;
