import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Català',
  detected: 'Detectat',
  source: 'Font',
  sources: { agent: 'agent', hostLocale: 'configuració regional de l’amfitrió', sharePoint: 'SharePoint', browser: 'navegador', fallback: 'per defecte' },
  readAloud: 'Llegeix en veu alta',
  pause: 'Pausa',
  resume: 'Reprèn',
  stop: 'Atura',
  reading: 'S’està llegint en veu alta',
  paused: 'En pausa',
  stopped: 'Aturat',
  finished: 'Lectura acabada',
  noVoice: 'No hi ha cap veu per a l’idioma: {0}',
  speechUnavailable: 'La lectura en veu alta no està disponible aquí',
  expand: 'Visualització completa',
  collapse: 'Visualització compacta',
  tellMore: 'Explica-me’n més',
  tellMorePrompt: 'Explica’m més coses sobre «{0}».',
  translateTo: 'Tradueix a',
  translatePrompt: 'Tradueix aquesta targeta a l’idioma següent: {0}.',
  design: 'Disseny',
  designs: { editorial: 'Editorial', classic: 'Clàssic', dramatic: 'Dramàtic', compact: 'Compacte', magazine: 'Revista' },
  designChanged: 'Disseny: {0}',
  look: 'Aspecte',
  layout: 'Disposició',
  layouts: { lead: 'Imatge principal', teaser: 'Avanç', beside: 'Imatge lateral' },
  layoutChanged: 'Disposició: {0}',
  theme: 'Tema',
  themes: { auto: 'Automàtic', light: 'Clar', dark: 'Fosc' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'No s’ha trobat cap foto',
  diagnostics: 'Diagnòstic',
  sent: 'Enviat',
  sendFailed: 'No s’ha pogut enviar',
  linkFailed: 'No s’ha pogut obrir l’enllaç',
  loading: 'S’està carregant',
  readingTime: 'Temps de lectura: {0}',
  textIn: 'Text: {0}',
  askedFor: 'demanat: {0}',
  rewriteIn: 'Reescriu en {0}',
  rewritePrompt: 'Torna a escriure aquesta targeta en {0}, si us plau.'
};

export default strings;
