import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Norsk bokmål',
  detected: 'Oppdaget',
  source: 'Kilde',
  sources: { agent: 'agent', hostLocale: 'vertens nasjonale innstillinger', sharePoint: 'SharePoint', browser: 'nettleser', fallback: 'standard' },
  readAloud: 'Les opp',
  pause: 'Pause',
  resume: 'Fortsett',
  stop: 'Stopp',
  reading: 'Leser opp',
  paused: 'Satt på pause',
  stopped: 'Stoppet',
  finished: 'Ferdig med opplesingen',
  noVoice: 'Ingen stemme for {0}',
  speechUnavailable: 'Opplesing er ikke tilgjengelig her',
  expand: 'Full visning',
  collapse: 'Kompakt visning',
  tellMore: 'Fortell meg mer',
  tellMorePrompt: 'Fortell meg mer om «{0}».',
  translateTo: 'Oversett til',
  translatePrompt: 'Oversett dette kortet til {0}.',
  design: 'Design',
  designs: { editorial: 'Redaksjonell', classic: 'Klassisk', dramatic: 'Dramatisk', compact: 'Kompakt', magazine: 'Magasin' },
  designChanged: 'Design: {0}',
  look: 'Utseende',
  layout: 'Oppsett',
  layouts: { lead: 'Toppbilde', teaser: 'Teaser', beside: 'Sidebilde' },
  layoutChanged: 'Oppsett: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatisk', light: 'Lyst', dark: 'Mørkt' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Fant ikke noe foto',
  diagnostics: 'Diagnostikk',
  sent: 'Sendt',
  sendFailed: 'Kunne ikke sende',
  linkFailed: 'Kunne ikke åpne koblingen',
  loading: 'Laster inn',
  readingTime: 'Lesetid: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'ønsket: {0}',
  rewriteIn: 'Skriv om på {0}',
  rewritePrompt: 'Skriv dette kortet på nytt på {0}.'
};

export default strings;
