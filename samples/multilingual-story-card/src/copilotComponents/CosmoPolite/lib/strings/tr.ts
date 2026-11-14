import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Türkçe',
  detected: 'Algılandı',
  source: 'Kaynak',
  sources: { agent: 'aracı', hostLocale: 'ana bilgisayar yerel ayarı', sharePoint: 'SharePoint', browser: 'tarayıcı', fallback: 'varsayılan' },
  readAloud: 'Sesli oku',
  pause: 'Duraklat',
  resume: 'Sürdür',
  stop: 'Durdur',
  reading: 'Sesli okunuyor',
  paused: 'Duraklatıldı',
  stopped: 'Durduruldu',
  finished: 'Okuma tamamlandı',
  noVoice: 'Bu dil için ses yok: {0}',
  speechUnavailable: 'Sesli okuma burada kullanılamıyor',
  expand: 'Tam görünüm',
  collapse: 'Kompakt görünüm',
  tellMore: 'Daha fazla bilgi ver',
  tellMorePrompt: '“{0}” hakkında daha fazla bilgi ver.',
  translateTo: 'Şu dile çevir',
  translatePrompt: 'Bu kartı şu dile çevir: {0}.',
  design: 'Tasarım',
  designs: { editorial: 'Editoryal', classic: 'Klasik', dramatic: 'Dramatik', compact: 'Kompakt', magazine: 'Dergi' },
  designChanged: 'Tasarım: {0}',
  look: 'Görünüm',
  layout: 'Düzen',
  layouts: { lead: 'Ana görsel', teaser: 'Tanıtım', beside: 'Yan görsel' },
  layoutChanged: 'Düzen: {0}',
  theme: 'Tema',
  themes: { auto: 'Otomatik', light: 'Açık', dark: 'Koyu' },
  themeChanged: 'Tema: {0}',
  photo: 'Fotoğraf',
  noImage: 'Fotoğraf bulunamadı',
  diagnostics: 'Tanılama',
  sent: 'Gönderildi',
  sendFailed: 'Gönderilemedi',
  linkFailed: 'Bağlantı açılamadı',
  loading: 'Yükleniyor',
  readingTime: 'Okuma süresi: {0}',
  textIn: 'Metin: {0}',
  askedFor: 'istenen: {0}',
  rewriteIn: 'Şu dilde yeniden yaz: {0}',
  rewritePrompt: 'Lütfen bu kartı şu dilde yeniden yaz: {0}.'
};

export default strings;
