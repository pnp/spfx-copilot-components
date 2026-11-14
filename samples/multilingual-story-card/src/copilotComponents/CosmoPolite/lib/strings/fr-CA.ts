import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Français (Canada)',
  detected: 'Détectée',
  source: 'Source',
  sources: { agent: 'agent', hostLocale: 'paramètres régionaux de l’hôte', sharePoint: 'SharePoint', browser: 'navigateur', fallback: 'par défaut' },
  readAloud: 'Lire à voix haute',
  pause: 'Pause',
  resume: 'Reprendre',
  stop: 'Arrêter',
  reading: 'Lecture à voix haute',
  paused: 'En pause',
  stopped: 'Arrêtée',
  finished: 'Lecture terminée',
  noVoice: 'Aucune voix pour cette langue : {0}',
  speechUnavailable: 'La lecture à voix haute n’est pas offerte ici',
  expand: 'Affichage complet',
  collapse: 'Affichage compact',
  tellMore: 'Dites-m’en plus',
  tellMorePrompt: 'Dites-m’en plus sur « {0} ».',
  translateTo: 'Traduire en',
  translatePrompt: 'Traduisez cette carte dans la langue suivante : {0}.',
  design: 'Design',
  designs: { editorial: 'Éditorial', classic: 'Classique', dramatic: 'Dramatique', compact: 'Compact', magazine: 'Magazine' },
  designChanged: 'Design : {0}',
  look: 'Apparence',
  layout: 'Disposition',
  layouts: { lead: 'Image principale', teaser: 'Aperçu', beside: 'Image latérale' },
  layoutChanged: 'Disposition : {0}',
  theme: 'Thème',
  themes: { auto: 'Automatique', light: 'Clair', dark: 'Sombre' },
  themeChanged: 'Thème : {0}',
  photo: 'Photo',
  noImage: 'Aucune photo trouvée',
  diagnostics: 'Diagnostic',
  sent: 'Envoyé',
  sendFailed: 'Impossible d’envoyer',
  linkFailed: 'Impossible d’ouvrir le lien',
  loading: 'Chargement en cours',
  readingTime: 'Temps de lecture : {0}',
  textIn: 'Texte : {0}',
  askedFor: 'demandé : {0}',
  rewriteIn: 'Réécrire en {0}',
  rewritePrompt: 'Réécrivez cette carte en {0}, s’il vous plaît.'
};

export default strings;
