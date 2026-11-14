import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Italiano',
  detected: 'Rilevata',
  source: 'Origine',
  sources: { agent: 'agente', hostLocale: 'impostazioni locali dell’host', sharePoint: 'SharePoint', browser: 'browser', fallback: 'predefinita' },
  readAloud: 'Leggi ad alta voce',
  pause: 'Pausa',
  resume: 'Riprendi',
  stop: 'Interrompi',
  reading: 'Lettura ad alta voce',
  paused: 'In pausa',
  stopped: 'Interrotta',
  finished: 'Lettura completata',
  noVoice: 'Nessuna voce per la lingua: {0}',
  speechUnavailable: 'La lettura ad alta voce non è disponibile qui',
  expand: 'Visualizzazione completa',
  collapse: 'Visualizzazione compatta',
  tellMore: 'Dimmi di più',
  tellMorePrompt: 'Dimmi di più su «{0}».',
  translateTo: 'Traduci in',
  translatePrompt: 'Traduci questa scheda nella lingua seguente: {0}.',
  design: 'Design',
  designs: { editorial: 'Editoriale', classic: 'Classico', dramatic: 'Drammatico', compact: 'Compatto', magazine: 'Rivista' },
  designChanged: 'Design: {0}',
  look: 'Aspetto',
  layout: 'Layout',
  layouts: { lead: 'Immagine principale', teaser: 'Anteprima', beside: 'Immagine laterale' },
  layoutChanged: 'Layout: {0}',
  theme: 'Tema',
  themes: { auto: 'Automatico', light: 'Chiaro', dark: 'Scuro' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Nessuna foto trovata',
  diagnostics: 'Diagnostica',
  sent: 'Inviato',
  sendFailed: 'Impossibile inviare',
  linkFailed: 'Impossibile aprire il collegamento',
  loading: 'Caricamento',
  readingTime: 'Tempo di lettura: {0}',
  textIn: 'Testo: {0}',
  askedFor: 'richiesto: {0}',
  rewriteIn: 'Riscrivi in {0}',
  rewritePrompt: 'Riscrivi questa scheda in {0}, per favore.'
};

export default strings;
