import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Suomi',
  detected: 'Tunnistettu',
  source: 'Lähde',
  sources: { agent: 'agentti', hostLocale: 'isännän kieli', sharePoint: 'SharePoint', browser: 'selain', fallback: 'oletus' },
  readAloud: 'Lue ääneen',
  pause: 'Tauko',
  resume: 'Jatka',
  stop: 'Pysäytä',
  reading: 'Luetaan ääneen',
  paused: 'Tauolla',
  stopped: 'Pysäytetty',
  finished: 'Luettu loppuun',
  noVoice: 'Ei ääntä kielelle {0}',
  speechUnavailable: 'Ääneen lukeminen ei ole käytettävissä täällä',
  expand: 'Koko näkymä',
  collapse: 'Tiivis näkymä',
  tellMore: 'Kerro lisää',
  tellMorePrompt: 'Kerro lisää aiheesta ”{0}”.',
  translateTo: 'Käännä kielelle',
  translatePrompt: 'Käännä tämä kortti kielelle {0}.',
  design: 'Ulkoasu',
  designs: { editorial: 'Toimituksellinen', classic: 'Klassinen', dramatic: 'Dramaattinen', compact: 'Tiivis', magazine: 'Aikakauslehti' },
  designChanged: 'Ulkoasu: {0}',
  look: 'Näkymä',
  layout: 'Asettelu',
  layouts: { lead: 'Pääkuva', teaser: 'Nosto', beside: 'Sivukuva' },
  layoutChanged: 'Asettelu: {0}',
  theme: 'Teema',
  themes: { auto: 'Automaattinen', light: 'Vaalea', dark: 'Tumma' },
  themeChanged: 'Teema: {0}',
  photo: 'Kuva',
  noImage: 'Kuvaa ei löytynyt',
  diagnostics: 'Diagnostiikka',
  sent: 'Lähetetty',
  sendFailed: 'Lähetys epäonnistui',
  linkFailed: 'Linkkiä ei voitu avata',
  loading: 'Ladataan',
  readingTime: 'Lukuaika: {0}',
  textIn: 'Teksti: {0}',
  askedFor: 'pyydetty: {0}',
  rewriteIn: 'Kirjoita uudelleen kielellä {0}',
  rewritePrompt: 'Kirjoita tämä kortti uudelleen kielellä {0}.'
};

export default strings;
