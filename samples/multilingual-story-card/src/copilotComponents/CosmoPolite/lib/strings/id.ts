import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Bahasa Indonesia',
  detected: 'Terdeteksi',
  source: 'Sumber',
  sources: { agent: 'agen', hostLocale: 'lokal host', sharePoint: 'SharePoint', browser: 'browser', fallback: 'default' },
  readAloud: 'Bacakan',
  pause: 'Jeda',
  resume: 'Lanjutkan',
  stop: 'Hentikan',
  reading: 'Sedang membacakan',
  paused: 'Dijeda',
  stopped: 'Dihentikan',
  finished: 'Selesai dibacakan',
  noVoice: 'Tidak ada suara untuk {0}',
  speechUnavailable: 'Fitur bacakan tidak tersedia di sini',
  expand: 'Tampilan penuh',
  collapse: 'Tampilan ringkas',
  tellMore: 'Ceritakan lebih lanjut',
  tellMorePrompt: 'Ceritakan lebih lanjut tentang “{0}”.',
  translateTo: 'Terjemahkan ke',
  translatePrompt: 'Terjemahkan kartu ini ke dalam {0}.',
  design: 'Desain',
  designs: { editorial: 'Editorial', classic: 'Klasik', dramatic: 'Dramatis', compact: 'Ringkas', magazine: 'Majalah' },
  designChanged: 'Desain: {0}',
  look: 'Tampilan',
  layout: 'Tata letak',
  layouts: { lead: 'Gambar utama', teaser: 'Cuplikan', beside: 'Gambar samping' },
  layoutChanged: 'Tata letak: {0}',
  theme: 'Tema',
  themes: { auto: 'Otomatis', light: 'Terang', dark: 'Gelap' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Foto tidak ditemukan',
  diagnostics: 'Diagnostik',
  sent: 'Terkirim',
  sendFailed: 'Tidak dapat mengirim',
  linkFailed: 'Tidak dapat membuka tautan',
  loading: 'Memuat',
  readingTime: 'Waktu baca: {0}',
  textIn: 'Teks: {0}',
  askedFor: 'diminta: {0}',
  rewriteIn: 'Tulis ulang dalam {0}',
  rewritePrompt: 'Tolong tulis ulang kartu ini dalam {0}.'
};

export default strings;
