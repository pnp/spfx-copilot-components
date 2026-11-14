import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Lietuvių',
  detected: 'Aptikta',
  source: 'Šaltinis',
  sources: { agent: 'agentas', hostLocale: 'pagrindinio kompiuterio lokalė', sharePoint: 'SharePoint', browser: 'naršyklė', fallback: 'numatytoji' },
  readAloud: 'Skaityti garsiai',
  pause: 'Pristabdyti',
  resume: 'Tęsti',
  stop: 'Stabdyti',
  reading: 'Skaitoma garsiai',
  paused: 'Pristabdyta',
  stopped: 'Sustabdyta',
  finished: 'Skaitymas baigtas',
  noVoice: 'Nėra balso šiai kalbai: {0}',
  speechUnavailable: 'Skaitymas garsiai čia nepasiekiamas',
  expand: 'Visas rodinys',
  collapse: 'Kompaktiškas rodinys',
  tellMore: 'Papasakok daugiau',
  tellMorePrompt: 'Papasakok daugiau apie „{0}“.',
  translateTo: 'Versti į',
  translatePrompt: 'Išversk šią kortelę į šią kalbą: {0}.',
  design: 'Dizainas',
  designs: { editorial: 'Redakcinis', classic: 'Klasikinis', dramatic: 'Dramatiškas', compact: 'Kompaktiškas', magazine: 'Žurnalas' },
  designChanged: 'Dizainas: {0}',
  look: 'Išvaizda',
  layout: 'Maketas',
  layouts: { lead: 'Pagrindinis paveikslėlis', teaser: 'Anonsas', beside: 'Šoninis paveikslėlis' },
  layoutChanged: 'Maketas: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatinė', light: 'Šviesi', dark: 'Tamsi' },
  themeChanged: 'Tema: {0}',
  photo: 'Nuotrauka',
  noImage: 'Nuotrauka nerasta',
  diagnostics: 'Diagnostika',
  sent: 'Išsiųsta',
  sendFailed: 'Nepavyko išsiųsti',
  linkFailed: 'Nepavyko atidaryti saito',
  loading: 'Įkeliama',
  readingTime: 'Skaitymo laikas: {0}',
  textIn: 'Tekstas: {0}',
  askedFor: 'prašyta: {0}',
  rewriteIn: 'Perrašyti šia kalba: {0}',
  rewritePrompt: 'Perrašyk šią kortelę šia kalba: {0}.'
};

export default strings;
