import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Bahasa Melayu',
  detected: 'Dikesan',
  source: 'Sumber',
  sources: { agent: 'ejen', hostLocale: 'tempatan hos', sharePoint: 'SharePoint', browser: 'pelayar', fallback: 'lalai' },
  readAloud: 'Baca dengan kuat',
  pause: 'Jeda',
  resume: 'Sambung semula',
  stop: 'Henti',
  reading: 'Sedang membaca dengan kuat',
  paused: 'Dijeda',
  stopped: 'Dihentikan',
  finished: 'Selesai dibaca',
  noVoice: 'Tiada suara untuk {0}',
  speechUnavailable: 'Bacaan dengan kuat tidak tersedia di sini',
  expand: 'Paparan penuh',
  collapse: 'Paparan padat',
  tellMore: 'Beritahu saya lagi',
  tellMorePrompt: 'Beritahu saya lebih lanjut tentang “{0}”.',
  translateTo: 'Terjemah ke',
  translatePrompt: 'Terjemahkan kad ini ke dalam {0}.',
  design: 'Reka bentuk',
  designs: { editorial: 'Editorial', classic: 'Klasik', dramatic: 'Dramatik', compact: 'Padat', magazine: 'Majalah' },
  designChanged: 'Reka bentuk: {0}',
  look: 'Rupa',
  layout: 'Tataletak',
  layouts: { lead: 'Imej utama', teaser: 'Pratonton', beside: 'Imej sisi' },
  layoutChanged: 'Tataletak: {0}',
  theme: 'Tema',
  themes: { auto: 'Auto', light: 'Cerah', dark: 'Gelap' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Tiada foto ditemui',
  diagnostics: 'Diagnostik',
  sent: 'Dihantar',
  sendFailed: 'Tidak dapat menghantar',
  linkFailed: 'Tidak dapat membuka pautan',
  loading: 'Memuatkan',
  readingTime: 'Masa membaca: {0}',
  textIn: 'Teks: {0}',
  askedFor: 'diminta: {0}',
  rewriteIn: 'Tulis semula dalam {0}',
  rewritePrompt: 'Sila tulis semula kad ini dalam {0}.'
};

export default strings;
