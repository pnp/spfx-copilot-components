import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Amharic (አማርኛ), Ethiopia. Ge'ez (Ethiopic) script; Ethiopic full stop “።” and colon “፦”.
const strings: IUiStrings = {
  languageName: 'አማርኛ',
  detected: 'ተለይቷል',
  source: 'ምንጭ',
  sources: { agent: 'ወኪል', hostLocale: 'የአስተናጋጅ ቋንቋ', sharePoint: 'SharePoint', browser: 'አሳሽ', fallback: 'ነባሪ' },
  readAloud: 'በድምፅ አንብብ',
  pause: 'ለአፍታ አቁም',
  resume: 'ቀጥል',
  stop: 'አቁም',
  reading: 'በማንበብ ላይ',
  paused: 'ለአፍታ ቆሟል',
  stopped: 'ቆሟል',
  finished: 'ንባቡ ተጠናቋል',
  noVoice: 'ለ{0} ድምፅ የለም',
  speechUnavailable: 'በድምፅ ማንበብ እዚህ አይገኝም',
  expand: 'ሙሉ እይታ',
  collapse: 'አጭር እይታ',
  tellMore: 'ተጨማሪ ንገረኝ',
  tellMorePrompt: 'ስለ «{0}» ተጨማሪ ንገረኝ።',
  translateTo: 'ተርጉም ወደ',
  translatePrompt: 'ይህን ካርድ ወደ {0} ተርጉመው።',
  design: 'ንድፍ',
  designs: { editorial: 'ኤዲቶሪያል', classic: 'ክላሲክ', dramatic: 'ድራማዊ', compact: 'የታመቀ', magazine: 'መጽሔት' },
  designChanged: 'ንድፍ፦ {0}',
  look: 'ገጽታ',
  layout: 'አቀማመጥ',
  layouts: { lead: 'ዋና ምስል', teaser: 'ቅድመ እይታ', beside: 'የጎን ምስል' },
  layoutChanged: 'አቀማመጥ፦ {0}',
  theme: 'ቀለም',
  themes: { auto: 'ራስ-ሰር', light: 'ብሩህ', dark: 'ጨለማ' },
  themeChanged: 'ቀለም፦ {0}',
  photo: 'ፎቶ',
  noImage: 'ምንም ፎቶ አልተገኘም',
  diagnostics: 'ምርመራ',
  sent: 'ተልኳል',
  sendFailed: 'መላክ አልተቻለም',
  linkFailed: 'ሊንኩን መክፈት አልተቻለም',
  loading: 'በመጫን ላይ',
  readingTime: 'የንባብ ጊዜ፦ {0}',
  textIn: 'ጽሑፍ፦ {0}',
  askedFor: 'የተጠየቀው፦ {0}',
  rewriteIn: 'በ{0} እንደገና ጻፍ',
  rewritePrompt: 'እባክህ ይህን ካርድ በ{0} እንደገና ጻፈው።'
};

export default strings;
