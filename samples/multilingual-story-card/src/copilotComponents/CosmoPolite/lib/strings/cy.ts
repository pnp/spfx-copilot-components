import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Cymraeg',
  detected: 'Wedi’i ganfod',
  source: 'Ffynhonnell',
  sources: { agent: 'asiant', hostLocale: 'locale y gwesteiwr', sharePoint: 'SharePoint', browser: 'porwr', fallback: 'rhagosodiad' },
  readAloud: 'Darllen yn uchel',
  pause: 'Oedi',
  resume: 'Ailddechrau',
  stop: 'Stopio',
  reading: 'Yn darllen yn uchel',
  paused: 'Wedi oedi',
  stopped: 'Wedi stopio',
  finished: 'Wedi gorffen darllen',
  noVoice: 'Dim llais ar gyfer yr iaith: {0}',
  speechUnavailable: 'Does dim modd darllen yn uchel yma',
  expand: 'Golwg lawn',
  collapse: 'Golwg gryno',
  tellMore: 'Dywed fwy wrtha i',
  tellMorePrompt: 'Dywed fwy wrtha i am “{0}”.',
  translateTo: 'Cyfieithu i',
  translatePrompt: 'Cyfieitha’r cerdyn hwn i’r iaith ganlynol: {0}.',
  design: 'Dyluniad',
  designs: { editorial: 'Golygyddol', classic: 'Clasurol', dramatic: 'Dramatig', compact: 'Cryno', magazine: 'Cylchgrawn' },
  designChanged: 'Dyluniad: {0}',
  look: 'Golwg',
  layout: 'Cynllun',
  layouts: { lead: 'Prif lun', teaser: 'Rhagflas', beside: 'Llun ochr' },
  layoutChanged: 'Cynllun: {0}',
  theme: 'Thema',
  themes: { auto: 'Awtomatig', light: 'Golau', dark: 'Tywyll' },
  themeChanged: 'Thema: {0}',
  photo: 'Llun',
  noImage: 'Heb ddod o hyd i lun',
  diagnostics: 'Diagnosteg',
  sent: 'Wedi anfon',
  sendFailed: 'Methu anfon',
  linkFailed: 'Methu agor y ddolen',
  loading: 'Wrthi’n llwytho',
  readingTime: 'Amser darllen: {0}',
  textIn: 'Testun: {0}',
  askedFor: 'gofynnwyd am: {0}',
  rewriteIn: 'Ailysgrifennu yn yr iaith: {0}',
  rewritePrompt: 'Ysgrifenna’r cerdyn hwn eto yn yr iaith ganlynol: {0}, os gweli di’n dda.'
};

export default strings;
