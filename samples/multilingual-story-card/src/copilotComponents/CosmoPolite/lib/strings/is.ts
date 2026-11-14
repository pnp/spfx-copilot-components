import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Íslenska',
  detected: 'Greint',
  source: 'Uppruni',
  sources: { agent: 'umboðsmaður', hostLocale: 'svæðisstillingar hýsils', sharePoint: 'SharePoint', browser: 'vafri', fallback: 'sjálfgefið' },
  readAloud: 'Lesa upphátt',
  pause: 'Gera hlé',
  resume: 'Halda áfram',
  stop: 'Stöðva',
  reading: 'Les upphátt',
  paused: 'Í hléi',
  stopped: 'Stöðvað',
  finished: 'Lestri lokið',
  noVoice: 'Engin rödd fyrir tungumálið: {0}',
  speechUnavailable: 'Upplestur er ekki í boði hér',
  expand: 'Heildaryfirlit',
  collapse: 'Þjappað yfirlit',
  tellMore: 'Segðu mér meira',
  tellMorePrompt: 'Segðu mér meira um „{0}“.',
  translateTo: 'Þýða yfir á',
  translatePrompt: 'Þýddu þetta spjald yfir á eftirfarandi tungumál: {0}.',
  design: 'Hönnun',
  designs: { editorial: 'Ritstjórnarleg', classic: 'Klassísk', dramatic: 'Dramatísk', compact: 'Þjöppuð', magazine: 'Tímarit' },
  designChanged: 'Hönnun: {0}',
  look: 'Útlit',
  layout: 'Útlit',
  layouts: { lead: 'Aðalmynd', teaser: 'Kynning', beside: 'Hliðarmynd' },
  layoutChanged: 'Útlit: {0}',
  theme: 'Þema',
  themes: { auto: 'Sjálfvirkt', light: 'Ljóst', dark: 'Dökkt' },
  themeChanged: 'Þema: {0}',
  photo: 'Mynd',
  noImage: 'Engin mynd fannst',
  diagnostics: 'Greining',
  sent: 'Sent',
  sendFailed: 'Ekki tókst að senda',
  linkFailed: 'Ekki tókst að opna tengilinn',
  loading: 'Hleður',
  readingTime: 'Lestrartími: {0}',
  textIn: 'Texti: {0}',
  askedFor: 'beðið um: {0}',
  rewriteIn: 'Endurskrifa á tungumálinu: {0}',
  rewritePrompt: 'Skrifaðu þetta spjald aftur á eftirfarandi tungumáli: {0}.'
};

export default strings;
