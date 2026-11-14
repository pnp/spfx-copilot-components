import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Ελληνικά',
  detected: 'Εντοπίστηκε',
  source: 'Προέλευση',
  sources: { agent: 'παράγοντας', hostLocale: 'τοπικές ρυθμίσεις κεντρικού υπολογιστή', sharePoint: 'SharePoint', browser: 'πρόγραμμα περιήγησης', fallback: 'προεπιλογή' },
  readAloud: 'Ανάγνωση φωναχτά',
  pause: 'Παύση',
  resume: 'Συνέχεια',
  stop: 'Διακοπή',
  reading: 'Ανάγνωση φωναχτά',
  paused: 'Σε παύση',
  stopped: 'Διακόπηκε',
  finished: 'Η ανάγνωση ολοκληρώθηκε',
  noVoice: 'Δεν υπάρχει φωνή για τη γλώσσα: {0}',
  speechUnavailable: 'Η ανάγνωση φωναχτά δεν είναι διαθέσιμη εδώ',
  expand: 'Πλήρης προβολή',
  collapse: 'Συμπαγής προβολή',
  tellMore: 'Πες μου περισσότερα',
  tellMorePrompt: 'Πες μου περισσότερα σχετικά με «{0}».',
  translateTo: 'Μετάφραση σε',
  translatePrompt: 'Μετάφρασε αυτή την κάρτα στην εξής γλώσσα: {0}.',
  design: 'Σχεδίαση',
  designs: { editorial: 'Αρθρογραφικό', classic: 'Κλασικό', dramatic: 'Δραματικό', compact: 'Συμπαγές', magazine: 'Περιοδικό' },
  designChanged: 'Σχεδίαση: {0}',
  look: 'Εμφάνιση',
  layout: 'Διάταξη',
  layouts: { lead: 'Κύρια εικόνα', teaser: 'Προεπισκόπηση', beside: 'Πλαϊνή εικόνα' },
  layoutChanged: 'Διάταξη: {0}',
  theme: 'Θέμα',
  themes: { auto: 'Αυτόματο', light: 'Ανοιχτόχρωμο', dark: 'Σκουρόχρωμο' },
  themeChanged: 'Θέμα: {0}',
  photo: 'Φωτογραφία',
  noImage: 'Δεν βρέθηκε φωτογραφία',
  diagnostics: 'Διαγνωστικά',
  sent: 'Στάλθηκε',
  sendFailed: 'Δεν ήταν δυνατή η αποστολή',
  linkFailed: 'Δεν ήταν δυνατό το άνοιγμα της σύνδεσης',
  loading: 'Φόρτωση',
  readingTime: 'Χρόνος ανάγνωσης: {0}',
  textIn: 'Κείμενο: {0}',
  askedFor: 'ζητήθηκε: {0}',
  rewriteIn: 'Επανεγγραφή στη γλώσσα: {0}',
  rewritePrompt: 'Γράψε ξανά αυτή την κάρτα στην εξής γλώσσα: {0}, παρακαλώ.'
};

export default strings;
