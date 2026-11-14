import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Latviešu',
  detected: 'Noteikta',
  source: 'Avots',
  sources: { agent: 'aģents', hostLocale: 'resursdatora lokalizācija', sharePoint: 'SharePoint', browser: 'pārlūkprogramma', fallback: 'noklusējums' },
  readAloud: 'Lasīt skaļi',
  pause: 'Pauzēt',
  resume: 'Atsākt',
  stop: 'Apturēt',
  reading: 'Notiek skaļā lasīšana',
  paused: 'Pauzēts',
  stopped: 'Apturēts',
  finished: 'Lasīšana pabeigta',
  noVoice: 'Nav balss valodai: {0}',
  speechUnavailable: 'Skaļā lasīšana šeit nav pieejama',
  expand: 'Pilns skats',
  collapse: 'Kompakts skats',
  tellMore: 'Pastāsti vairāk',
  tellMorePrompt: 'Pastāsti vairāk par „{0}”.',
  translateTo: 'Tulkot valodā',
  translatePrompt: 'Iztulko šo karti šādā valodā: {0}.',
  design: 'Noformējums',
  designs: { editorial: 'Redakcionāls', classic: 'Klasisks', dramatic: 'Dramatisks', compact: 'Kompakts', magazine: 'Žurnāls' },
  designChanged: 'Noformējums: {0}',
  look: 'Izskats',
  layout: 'Izkārtojums',
  layouts: { lead: 'Galvenais attēls', teaser: 'Anonss', beside: 'Sānu attēls' },
  layoutChanged: 'Izkārtojums: {0}',
  theme: 'Motīvs',
  themes: { auto: 'Automātisks', light: 'Gaišs', dark: 'Tumšs' },
  themeChanged: 'Motīvs: {0}',
  photo: 'Fotoattēls',
  noImage: 'Fotoattēls netika atrasts',
  diagnostics: 'Diagnostika',
  sent: 'Nosūtīts',
  sendFailed: 'Neizdevās nosūtīt',
  linkFailed: 'Neizdevās atvērt saiti',
  loading: 'Notiek ielāde',
  readingTime: 'Lasīšanas laiks: {0}',
  textIn: 'Teksts: {0}',
  askedFor: 'pieprasīts: {0}',
  rewriteIn: 'Pārrakstīt valodā: {0}',
  rewritePrompt: 'Lūdzu, uzraksti šo karti vēlreiz šādā valodā: {0}.'
};

export default strings;
