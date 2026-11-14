import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Magyar',
  detected: 'Észlelve',
  source: 'Forrás',
  sources: { agent: 'ügynök', hostLocale: 'gazdagép területi beállítása', sharePoint: 'SharePoint', browser: 'böngésző', fallback: 'alapértelmezett' },
  readAloud: 'Felolvasás',
  pause: 'Szünet',
  resume: 'Folytatás',
  stop: 'Leállítás',
  reading: 'Felolvasás folyamatban',
  paused: 'Szüneteltetve',
  stopped: 'Leállítva',
  finished: 'A felolvasás befejeződött',
  noVoice: 'Nincs hang ehhez a nyelvhez: {0}',
  speechUnavailable: 'A felolvasás itt nem érhető el',
  expand: 'Teljes nézet',
  collapse: 'Kompakt nézet',
  tellMore: 'Mondj többet',
  tellMorePrompt: 'Mondj többet erről: „{0}”.',
  translateTo: 'Fordítás erre a nyelvre',
  translatePrompt: 'Fordítsd le ezt a kártyát a következő nyelvre: {0}.',
  design: 'Kialakítás',
  designs: { editorial: 'Szerkesztőségi', classic: 'Klasszikus', dramatic: 'Drámai', compact: 'Kompakt', magazine: 'Magazin' },
  designChanged: 'Kialakítás: {0}',
  look: 'Megjelenés',
  layout: 'Elrendezés',
  layouts: { lead: 'Fő kép', teaser: 'Előzetes', beside: 'Oldalsó kép' },
  layoutChanged: 'Elrendezés: {0}',
  theme: 'Téma',
  themes: { auto: 'Automatikus', light: 'Világos', dark: 'Sötét' },
  themeChanged: 'Téma: {0}',
  photo: 'Fénykép',
  noImage: 'Nem található fénykép',
  diagnostics: 'Diagnosztika',
  sent: 'Elküldve',
  sendFailed: 'Nem sikerült elküldeni',
  linkFailed: 'Nem sikerült megnyitni a hivatkozást',
  loading: 'Betöltés',
  readingTime: 'Olvasási idő: {0}',
  textIn: 'Szöveg: {0}',
  askedFor: 'kért nyelv: {0}',
  rewriteIn: 'Átírás ezen a nyelven: {0}',
  rewritePrompt: 'Kérlek, írd meg újra ezt a kártyát a következő nyelven: {0}.'
};

export default strings;
