import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Nederlands',
  detected: 'Gedetecteerd',
  source: 'Bron',
  sources: { agent: 'agent', hostLocale: 'landinstelling van host', sharePoint: 'SharePoint', browser: 'browser', fallback: 'standaard' },
  readAloud: 'Voorlezen',
  pause: 'Pauzeren',
  resume: 'Hervatten',
  stop: 'Stoppen',
  reading: 'Wordt voorgelezen',
  paused: 'Gepauzeerd',
  stopped: 'Gestopt',
  finished: 'Voorlezen voltooid',
  noVoice: 'Geen stem voor {0}',
  speechUnavailable: 'Voorlezen is hier niet beschikbaar',
  expand: 'Volledige weergave',
  collapse: 'Compacte weergave',
  tellMore: 'Vertel me meer',
  tellMorePrompt: 'Vertel me meer over ‘{0}’.',
  translateTo: 'Vertalen naar',
  translatePrompt: 'Vertaal deze kaart naar {0}.',
  design: 'Ontwerp',
  designs: { editorial: 'Redactioneel', classic: 'Klassiek', dramatic: 'Dramatisch', compact: 'Compact', magazine: 'Tijdschrift' },
  designChanged: 'Ontwerp: {0}',
  look: 'Weergave',
  layout: 'Indeling',
  layouts: { lead: 'Hoofdafbeelding', teaser: 'Teaser', beside: 'Zijafbeelding' },
  layoutChanged: 'Indeling: {0}',
  theme: 'Thema',
  themes: { auto: 'Automatisch', light: 'Licht', dark: 'Donker' },
  themeChanged: 'Thema: {0}',
  photo: 'Foto',
  noImage: 'Geen foto gevonden',
  diagnostics: 'Diagnose',
  sent: 'Verzonden',
  sendFailed: 'Kan niet verzenden',
  linkFailed: 'Kan de koppeling niet openen',
  loading: 'Laden',
  readingTime: 'Leestijd: {0}',
  textIn: 'Tekst: {0}',
  askedFor: 'gevraagd: {0}',
  rewriteIn: 'Herschrijven in {0}',
  rewritePrompt: 'Schrijf deze kaart opnieuw in {0}, alsjeblieft.'
};

export default strings;
