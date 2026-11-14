import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Somali (Soomaali), Horn of Africa.
const strings: IUiStrings = {
  languageName: 'Soomaali',
  detected: 'La aqoonsaday',
  source: 'Isha',
  sources: { agent: 'wakiil', hostLocale: 'luqadda martigeliyaha', sharePoint: 'SharePoint', browser: 'biraawsar', fallback: 'caadi' },
  readAloud: 'Kor u akhri',
  pause: 'Hakad',
  resume: 'Sii wad',
  stop: 'Jooji',
  reading: 'Waa la akhrinayaa',
  paused: 'Waa la hakiyay',
  stopped: 'Waa la joojiyay',
  finished: 'Akhrintii way dhammaatay',
  noVoice: 'Ma jiro cod loogu talagalay {0}',
  speechUnavailable: 'Kor u akhrintu halkan lagama heli karo',
  expand: 'Muuqaal buuxa',
  collapse: 'Muuqaal kooban',
  tellMore: 'Ii sheeg wax dheeraad ah',
  tellMorePrompt: 'Ii sheeg wax dheeraad ah oo ku saabsan “{0}”.',
  translateTo: 'U turjun',
  translatePrompt: 'Kaarkan u turjun {0}.',
  design: 'Naqshad',
  designs: { editorial: 'Tifaftir', classic: 'Qadiim', dramatic: 'Xiiso badan', compact: 'Kooban', magazine: 'Majaladda' },
  designChanged: 'Naqshad: {0}',
  look: 'Muuqaal',
  layout: 'Qaabeyn',
  layouts: { lead: 'Sawir weyn', teaser: 'Dhadhamin', beside: 'Sawir dhinac' },
  layoutChanged: 'Qaabeyn: {0}',
  theme: 'Midab',
  themes: { auto: 'Toos', light: 'Iftiin', dark: 'Mugdi' },
  themeChanged: 'Midab: {0}',
  photo: 'Sawir',
  noImage: 'Sawir lama helin',
  diagnostics: 'Baaritaan',
  sent: 'Waa la diray',
  sendFailed: 'Lama diri karin',
  linkFailed: 'Xiriirka lama furi karin',
  loading: 'Waa la soo raraya',
  readingTime: 'Waqtiga akhriska: {0}',
  textIn: 'Qoraal: {0}',
  askedFor: 'la codsaday: {0}',
  rewriteIn: 'Dib ugu qor {0}',
  rewritePrompt: 'Fadlan kaarkan dib ugu qor {0}.'
};

export default strings;
