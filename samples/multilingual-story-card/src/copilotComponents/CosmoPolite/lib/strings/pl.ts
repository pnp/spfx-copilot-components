import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Polski',
  detected: 'Wykryto',
  source: 'Źródło',
  sources: { agent: 'agent', hostLocale: 'ustawienia regionalne hosta', sharePoint: 'SharePoint', browser: 'przeglądarka', fallback: 'domyślne' },
  readAloud: 'Czytaj na głos',
  pause: 'Wstrzymaj',
  resume: 'Wznów',
  stop: 'Zatrzymaj',
  reading: 'Czytanie na głos',
  paused: 'Wstrzymano',
  stopped: 'Zatrzymano',
  finished: 'Zakończono czytanie',
  noVoice: 'Brak głosu dla języka: {0}',
  speechUnavailable: 'Czytanie na głos nie jest tutaj dostępne',
  expand: 'Pełny widok',
  collapse: 'Widok kompaktowy',
  tellMore: 'Powiedz mi więcej',
  tellMorePrompt: 'Powiedz mi więcej na temat „{0}”.',
  translateTo: 'Przetłumacz na',
  translatePrompt: 'Przetłumacz tę kartę na następujący język: {0}.',
  design: 'Projekt',
  designs: { editorial: 'Redakcyjny', classic: 'Klasyczny', dramatic: 'Dramatyczny', compact: 'Kompaktowy', magazine: 'Magazyn' },
  designChanged: 'Projekt: {0}',
  look: 'Wygląd',
  layout: 'Układ',
  layouts: { lead: 'Główny obraz', teaser: 'Zajawka', beside: 'Obraz z boku' },
  layoutChanged: 'Układ: {0}',
  theme: 'Motyw',
  themes: { auto: 'Automatyczny', light: 'Jasny', dark: 'Ciemny' },
  themeChanged: 'Motyw: {0}',
  photo: 'Zdjęcie',
  noImage: 'Nie znaleziono zdjęcia',
  diagnostics: 'Diagnostyka',
  sent: 'Wysłano',
  sendFailed: 'Nie można wysłać',
  linkFailed: 'Nie można otworzyć linku',
  loading: 'Ładowanie',
  readingTime: 'Czas czytania: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'żądany: {0}',
  rewriteIn: 'Przepisz w języku: {0}',
  rewritePrompt: 'Napisz tę kartę jeszcze raz w następującym języku: {0}.'
};

export default strings;
