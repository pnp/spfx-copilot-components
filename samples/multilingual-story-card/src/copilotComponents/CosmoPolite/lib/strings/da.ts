import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Dansk',
  detected: 'Registreret',
  source: 'Kilde',
  sources: { agent: 'agent', hostLocale: 'værtens sprog', sharePoint: 'SharePoint', browser: 'browser', fallback: 'standard' },
  readAloud: 'Læs højt',
  pause: 'Pause',
  resume: 'Genoptag',
  stop: 'Stop',
  reading: 'Læser højt',
  paused: 'Sat på pause',
  stopped: 'Stoppet',
  finished: 'Oplæsning afsluttet',
  noVoice: 'Ingen stemme til {0}',
  speechUnavailable: 'Oplæsning er ikke tilgængelig her',
  expand: 'Fuld visning',
  collapse: 'Kompakt visning',
  tellMore: 'Fortæl mig mere',
  tellMorePrompt: 'Fortæl mig mere om »{0}«.',
  translateTo: 'Oversæt til',
  translatePrompt: 'Oversæt dette kort til {0}.',
  design: 'Design',
  designs: { editorial: 'Redaktionel', classic: 'Klassisk', dramatic: 'Dramatisk', compact: 'Kompakt', magazine: 'Magasin' },
  designChanged: 'Design: {0}',
  look: 'Udseende',
  layout: 'Layout',
  layouts: { lead: 'Topbillede', teaser: 'Teaser', beside: 'Sidebillede' },
  layoutChanged: 'Layout: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatisk', light: 'Lyst', dark: 'Mørkt' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Der blev ikke fundet noget foto',
  diagnostics: 'Diagnosticering',
  sent: 'Sendt',
  sendFailed: 'Kunne ikke sende',
  linkFailed: 'Linket kunne ikke åbnes',
  loading: 'Indlæser',
  readingTime: 'Læsetid: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'ønsket: {0}',
  rewriteIn: 'Omskriv på {0}',
  rewritePrompt: 'Skriv dette kort igen på {0}.'
};

export default strings;
