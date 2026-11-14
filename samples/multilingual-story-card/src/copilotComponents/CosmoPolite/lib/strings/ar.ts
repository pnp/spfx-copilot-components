import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'العربية',
  detected: 'اللغة المكتشفة',
  source: 'المصدر',
  sources: { agent: 'الوكيل', hostLocale: 'لغة المضيف', sharePoint: 'SharePoint', browser: 'المتصفح', fallback: 'افتراضي' },
  readAloud: 'قراءة بصوت عالٍ',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  stop: 'إيقاف',
  reading: 'جارٍ القراءة',
  paused: 'متوقف مؤقتًا',
  stopped: 'توقفت القراءة',
  finished: 'انتهت القراءة',
  noVoice: 'لا يوجد صوت للغة {0}',
  speechUnavailable: 'القراءة بصوت عالٍ غير متاحة هنا',
  expand: 'عرض كامل',
  collapse: 'عرض مضغوط',
  tellMore: 'أخبرني المزيد',
  tellMorePrompt: 'أخبرني المزيد عن «{0}».',
  translateTo: 'ترجمة إلى',
  translatePrompt: 'ترجم هذه البطاقة إلى {0}.',
  design: 'التصميم',
  designs: { editorial: 'تحريري', classic: 'كلاسيكي', dramatic: 'درامي', compact: 'مضغوط', magazine: 'مجلة' },
  designChanged: 'التصميم: {0}',
  look: 'المظهر',
  layout: 'التخطيط',
  layouts: { lead: 'صورة رئيسية', teaser: 'مقتطف', beside: 'صورة جانبية' },
  layoutChanged: 'التخطيط: {0}',
  theme: 'السمة',
  themes: { auto: 'تلقائي', light: 'فاتح', dark: 'داكن' },
  themeChanged: 'السمة: {0}',
  photo: 'صورة',
  noImage: 'لم يتم العثور على صورة',
  diagnostics: 'التشخيص',
  sent: 'تم الإرسال',
  sendFailed: 'تعذّر الإرسال',
  linkFailed: 'تعذّر فتح الرابط',
  loading: 'جارٍ التحميل',
  readingTime: 'مدة القراءة: {0}',
  textIn: 'النص: {0}',
  askedFor: 'المطلوب: {0}',
  rewriteIn: 'إعادة الكتابة باللغة {0}',
  rewritePrompt: 'أعد كتابة هذه البطاقة باللغة {0} من فضلك.'
};

export default strings;
