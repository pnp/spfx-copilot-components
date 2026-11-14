import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Shqip',
  detected: 'U zbulua',
  source: 'Burimi',
  sources: { agent: 'agjenti', hostLocale: 'gjuha e hostit', sharePoint: 'SharePoint', browser: 'shfletuesi', fallback: 'parazgjedhja' },
  readAloud: 'Lexo me zë',
  pause: 'Pauzë',
  resume: 'Vazhdo',
  stop: 'Ndalo',
  reading: 'Po lexohet me zë',
  paused: 'Në pauzë',
  stopped: 'U ndalua',
  finished: 'Leximi përfundoi',
  noVoice: 'Nuk ka zë për gjuhën: {0}',
  speechUnavailable: 'Leximi me zë nuk ofrohet këtu',
  expand: 'Pamje e plotë',
  collapse: 'Pamje kompakte',
  tellMore: 'Më trego më shumë',
  tellMorePrompt: 'Më trego më shumë për „{0}“.',
  translateTo: 'Përkthe në',
  translatePrompt: 'Përkthe këtë kartë në gjuhën: {0}.',
  design: 'Dizajni',
  designs: { editorial: 'Editorial', classic: 'Klasik', dramatic: 'Dramatik', compact: 'Kompakt', magazine: 'Revistë' },
  designChanged: 'Dizajni: {0}',
  look: 'Pamja',
  layout: 'Struktura',
  layouts: { lead: 'Imazh kryesor', teaser: 'Përmbledhje', beside: 'Imazh anësor' },
  layoutChanged: 'Struktura: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatike', light: 'E çelët', dark: 'E errët' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Nuk u gjet asnjë foto',
  diagnostics: 'Diagnostikimi',
  sent: 'U dërgua',
  sendFailed: 'Dërgimi dështoi',
  linkFailed: 'Lidhja nuk u hap dot',
  loading: 'Po ngarkohet',
  readingTime: 'Koha e leximit: {0}',
  textIn: 'Teksti: {0}',
  askedFor: 'kërkuar: {0}',
  rewriteIn: 'Rishkruaj në gjuhën: {0}',
  rewritePrompt: 'Të lutem, shkruaje sërish këtë kartë në gjuhën: {0}.'
};

export default strings;
