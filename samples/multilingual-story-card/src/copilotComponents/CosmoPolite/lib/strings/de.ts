import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

const strings: IUiStrings = {
  languageName: 'Deutsch',
  detected: 'Erkannt',
  source: 'Quelle',
  sources: { agent: 'Agent', hostLocale: 'Host-Sprache', sharePoint: 'SharePoint', browser: 'Browser', fallback: 'Standard' },
  readAloud: 'Vorlesen',
  pause: 'Pause',
  resume: 'Fortsetzen',
  stop: 'Stopp',
  reading: 'Liest vor',
  paused: 'Angehalten',
  stopped: 'Gestoppt',
  finished: 'Fertig vorgelesen',
  noVoice: 'Keine Stimme für {0}',
  speechUnavailable: 'Vorlesen ist hier nicht verfügbar',
  expand: 'Vollansicht',
  collapse: 'Kompaktansicht',
  tellMore: 'Erzähl mir mehr',
  tellMorePrompt: 'Erzähl mir mehr über „{0}“.',
  translateTo: 'Übersetzen in',
  translatePrompt: 'Übersetze diese Karte in folgende Sprache: {0}.',
  design: 'Design',
  designs: { editorial: 'Redaktionell', classic: 'Klassisch', dramatic: 'Dramatisch', compact: 'Kompakt', magazine: 'Magazin' },
  designChanged: 'Design: {0}',
  look: 'Darstellung',
  layout: 'Layout',
  layouts: { lead: 'Aufmacherbild', teaser: 'Teaser', beside: 'Bild seitlich' },
  layoutChanged: 'Layout: {0}',
  theme: 'Farbschema',
  themes: { auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' },
  themeChanged: 'Farbschema: {0}',
  photo: 'Foto',
  noImage: 'Kein Foto gefunden',
  diagnostics: 'Diagnose',
  sent: 'Gesendet',
  sendFailed: 'Senden fehlgeschlagen',
  linkFailed: 'Link konnte nicht geöffnet werden',
  loading: 'Wird geladen',
  readingTime: 'Lesezeit: {0}',
  textIn: 'Text: {0}',
  askedFor: 'gewünscht: {0}',
  rewriteIn: 'Auf {0} neu schreiben',
  rewritePrompt: 'Schreib diese Karte bitte noch einmal auf {0}.'
};

export default strings;
