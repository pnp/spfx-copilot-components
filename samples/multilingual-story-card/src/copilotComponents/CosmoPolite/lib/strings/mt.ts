import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Malti',
  detected: 'Identifikata',
  source: 'Sors',
  sources: { agent: 'aġent', hostLocale: 'lokal tal-host', sharePoint: 'SharePoint', browser: 'browser', fallback: 'default' },
  readAloud: 'Aqra b’leħen għoli',
  pause: 'Pawża',
  resume: 'Kompli',
  stop: 'Waqqaf',
  reading: 'Qed jinqara b’leħen għoli',
  paused: 'Fil-pawża',
  stopped: 'Imwaqqaf',
  finished: 'Il-qari spiċċa',
  noVoice: 'L-ebda leħen għall-lingwa: {0}',
  speechUnavailable: 'Il-qari b’leħen għoli mhux disponibbli hawn',
  expand: 'Veduta sħiħa',
  collapse: 'Veduta kompatta',
  tellMore: 'Għidli aktar',
  tellMorePrompt: 'Għidli aktar dwar “{0}”.',
  translateTo: 'Ittraduċi għal',
  translatePrompt: 'Ittraduċi din il-karta għall-lingwa li ġejja: {0}.',
  design: 'Disinn',
  designs: { editorial: 'Editorjali', classic: 'Klassiku', dramatic: 'Drammatiku', compact: 'Kompatt', magazine: 'Rivista' },
  designChanged: 'Disinn: {0}',
  look: 'Dehra',
  layout: 'Tqassim',
  layouts: { lead: 'Stampa ewlenija', teaser: 'Teaser', beside: 'Stampa mal-ġenb' },
  layoutChanged: 'Tqassim: {0}',
  theme: 'Tema',
  themes: { auto: 'Awtomatiku', light: 'Ċar', dark: 'Skur' },
  themeChanged: 'Tema: {0}',
  photo: 'Ritratt',
  noImage: 'Ma nstab l-ebda ritratt',
  diagnostics: 'Dijanjostika',
  sent: 'Mibgħut',
  sendFailed: 'Ma setax jintbagħat',
  linkFailed: 'Ma setgħetx tinfetaħ il-link',
  loading: 'Qed jillowdja',
  readingTime: 'Ħin tal-qari: {0}',
  textIn: 'Test: {0}',
  askedFor: 'mitlub: {0}',
  rewriteIn: 'Ikteb mill-ġdid bil-lingwa: {0}',
  rewritePrompt: 'Jekk jogħġbok, ikteb din il-karta mill-ġdid bil-lingwa li ġejja: {0}.'
};

export default strings;
