import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Yoruba (Yorùbá), Nigeria and Benin. Tone marks are combining accents: keep them.
const strings: IUiStrings = {
  languageName: 'Yorùbá',
  detected: 'A ṣàwárí',
  source: 'Orísun',
  sources: { agent: 'aṣojú', hostLocale: 'èdè agbàlejò', sharePoint: 'SharePoint', browser: 'aṣàwákiri', fallback: 'àìyípadà' },
  readAloud: 'Kà sókè',
  pause: 'Dánu dúró',
  resume: 'Tẹ̀síwájú',
  stop: 'Dúró',
  reading: 'Ń kà sókè',
  paused: 'Ó dánu dúró',
  stopped: 'Ó ti dúró',
  finished: 'Kíkà ti parí',
  noVoice: 'Kò sí ohùn fún {0}',
  speechUnavailable: 'Kíkà sókè kò sí níbí',
  expand: 'Ìwò kíkún',
  collapse: 'Ìwò kékeré',
  tellMore: 'Sọ sí i fún mi',
  tellMorePrompt: 'Sọ sí i fún mi nípa “{0}”.',
  translateTo: 'Túmọ̀ sí',
  translatePrompt: 'Túmọ̀ káàdì yìí sí {0}.',
  design: 'Àwòṣe',
  designs: { editorial: 'Olóòtú', classic: 'Àtijọ́', dramatic: 'Alárinrin', compact: 'Kékeré', magazine: 'Ìwé ìròyìn' },
  designChanged: 'Àwòṣe: {0}',
  look: 'Ìrísí',
  layout: 'Ìtòlẹ́sẹẹsẹ',
  layouts: { lead: 'Àwòrán àkọ́kọ́', teaser: 'Àkópọ̀', beside: 'Àwòrán ẹ̀gbẹ́' },
  layoutChanged: 'Ìtòlẹ́sẹẹsẹ: {0}',
  theme: 'Àwọ̀',
  themes: { auto: 'Aládàáṣe', light: 'Ìmọ́lẹ̀', dark: 'Òkùnkùn' },
  themeChanged: 'Àwọ̀: {0}',
  photo: 'Fọ́tò',
  noImage: 'A kò rí fọ́tò kankan',
  diagnostics: 'Àyẹ̀wò',
  sent: 'A ti fi ránṣẹ́',
  sendFailed: 'Kò ṣeé fi ránṣẹ́',
  linkFailed: 'Kò ṣeé ṣí ìjápọ̀ náà',
  loading: 'Ó ń gbé wọlé',
  readingTime: 'Àkókò kíkà: {0}',
  textIn: 'Ọ̀rọ̀: {0}',
  askedFor: 'tí a béèrè: {0}',
  rewriteIn: 'Kọ ọ́ lẹ́ẹ̀kan sí i ní {0}',
  rewritePrompt: 'Jọ̀ọ́ kọ káàdì yìí lẹ́ẹ̀kan sí i ní {0}.'
};

export default strings;
