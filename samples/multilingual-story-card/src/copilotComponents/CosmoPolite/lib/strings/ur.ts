import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

// Urdu (اردو). Not on the Microsoft 365 Copilot work/school language list, but common enough among
// its users to get its own chrome rather than English. Right-to-left; Urdu full stop "۔".
const strings: IUiStrings = {
  languageName: 'اردو',
  detected: 'شناخت شدہ',
  source: 'ماخذ',
  sources: { agent: 'ایجنٹ', hostLocale: 'میزبان کی زبان', sharePoint: 'SharePoint', browser: 'براؤزر', fallback: 'طے شدہ' },
  readAloud: 'بلند آواز سے پڑھیں',
  pause: 'وقفہ',
  resume: 'جاری رکھیں',
  stop: 'روکیں',
  reading: 'پڑھا جا رہا ہے',
  paused: 'وقفہ کیا گیا',
  stopped: 'پڑھنا روک دیا گیا',
  finished: 'پڑھنا مکمل ہو گیا',
  noVoice: '{0} کے لیے کوئی آواز نہیں',
  speechUnavailable: 'یہاں بلند آواز سے پڑھنا دستیاب نہیں',
  expand: 'مکمل منظر',
  collapse: 'مختصر منظر',
  tellMore: 'مزید بتائیں',
  tellMorePrompt: '“{0}” کے بارے میں مزید بتائیں۔',
  translateTo: 'ترجمہ کریں',
  translatePrompt: 'اس کارڈ کا {0} میں ترجمہ کریں۔',
  design: 'ڈیزائن',
  designs: { editorial: 'ادارتی', classic: 'کلاسیکی', dramatic: 'ڈرامائی', compact: 'مختصر', magazine: 'میگزین' },
  designChanged: 'ڈیزائن: {0}',
  look: 'انداز',
  layout: 'ترتیب',
  layouts: { lead: 'مرکزی تصویر', teaser: 'جھلک', beside: 'ساتھ تصویر' },
  layoutChanged: 'ترتیب: {0}',
  theme: 'تھیم',
  themes: { auto: 'خودکار', light: 'روشن', dark: 'تاریک' },
  themeChanged: 'تھیم: {0}',
  photo: 'تصویر',
  noImage: 'کوئی تصویر نہیں ملی',
  diagnostics: 'تشخیص',
  sent: 'بھیج دیا گیا',
  sendFailed: 'بھیجا نہیں جا سکا',
  linkFailed: 'لنک نہیں کھل سکا',
  loading: 'لوڈ ہو رہا ہے',
  readingTime: 'پڑھنے کا وقت: {0}',
  textIn: 'متن: {0}',
  askedFor: 'مطلوبہ: {0}',
  rewriteIn: '{0} میں دوبارہ لکھیں',
  rewritePrompt: 'براہ کرم یہ کارڈ {0} میں دوبارہ لکھیں۔'
};

export default strings;
