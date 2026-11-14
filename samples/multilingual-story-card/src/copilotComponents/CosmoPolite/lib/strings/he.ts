import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'עברית',
  detected: 'זוהתה',
  source: 'מקור',
  sources: { agent: 'סוכן', hostLocale: 'הגדרות האזור של המארח', sharePoint: 'SharePoint', browser: 'דפדפן', fallback: 'ברירת מחדל' },
  readAloud: 'הקראה',
  pause: 'השהיה',
  resume: 'המשך',
  stop: 'עצירה',
  reading: 'מקריא',
  paused: 'מושהה',
  stopped: 'נעצר',
  finished: 'ההקראה הסתיימה',
  noVoice: 'אין קול עבור השפה: {0}',
  speechUnavailable: 'הקראה אינה זמינה כאן',
  expand: 'תצוגה מלאה',
  collapse: 'תצוגה מצומצמת',
  tellMore: 'ספר לי עוד',
  tellMorePrompt: 'ספר לי עוד על "{0}".',
  translateTo: 'תרגום לשפה',
  translatePrompt: 'תרגם את הכרטיס הזה לשפה הבאה: {0}.',
  design: 'עיצוב',
  designs: { editorial: 'עיתונאי', classic: 'קלאסי', dramatic: 'דרמטי', compact: 'דחוס', magazine: 'מגזין' },
  designChanged: 'עיצוב: {0}',
  look: 'מראה',
  layout: 'פריסה',
  layouts: { lead: 'תמונה ראשית', teaser: 'תקציר', beside: 'תמונה בצד' },
  layoutChanged: 'פריסה: {0}',
  theme: 'ערכת נושא',
  themes: { auto: 'אוטומטי', light: 'בהיר', dark: 'כהה' },
  themeChanged: 'ערכת נושא: {0}',
  photo: 'תמונה',
  noImage: 'לא נמצאה תמונה',
  diagnostics: 'אבחון',
  sent: 'נשלח',
  sendFailed: 'לא ניתן היה לשלוח',
  linkFailed: 'לא ניתן היה לפתוח את הקישור',
  loading: 'טוען',
  readingTime: 'זמן קריאה: {0}',
  textIn: 'טקסט: {0}',
  askedFor: 'התבקש: {0}',
  rewriteIn: 'כתיבה מחדש בשפה: {0}',
  rewritePrompt: 'בבקשה כתוב מחדש את הכרטיס הזה בשפה הבאה: {0}.'
};

export default strings;
