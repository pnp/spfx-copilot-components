import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Українська',
  detected: 'Виявлено',
  source: 'Джерело',
  sources: { agent: 'агент', hostLocale: 'мовний стандарт хоста', sharePoint: 'SharePoint', browser: 'браузер', fallback: 'за замовчуванням' },
  readAloud: 'Читати вголос',
  pause: 'Пауза',
  resume: 'Продовжити',
  stop: 'Зупинити',
  reading: 'Читання вголос',
  paused: 'Призупинено',
  stopped: 'Зупинено',
  finished: 'Читання завершено',
  noVoice: 'Немає голосу для мови: {0}',
  speechUnavailable: 'Читання вголос тут недоступне',
  expand: 'Повний вигляд',
  collapse: 'Компактний вигляд',
  tellMore: 'Розкажи більше',
  tellMorePrompt: 'Розкажи більше про «{0}».',
  translateTo: 'Перекласти на',
  translatePrompt: 'Переклади цю картку такою мовою: {0}.',
  design: 'Оформлення',
  designs: { editorial: 'Редакційний', classic: 'Класичний', dramatic: 'Драматичний', compact: 'Компактний', magazine: 'Журнальний' },
  designChanged: 'Оформлення: {0}',
  look: 'Оформлення',
  layout: 'Макет',
  layouts: { lead: 'Головне зображення', teaser: 'Анонс', beside: 'Зображення збоку' },
  layoutChanged: 'Макет: {0}',
  theme: 'Тема',
  themes: { auto: 'Автоматично', light: 'Світла', dark: 'Темна' },
  themeChanged: 'Тема: {0}',
  photo: 'Фото',
  noImage: 'Фото не знайдено',
  diagnostics: 'Діагностика',
  sent: 'Надіслано',
  sendFailed: 'Не вдалося надіслати',
  linkFailed: 'Не вдалося відкрити посилання',
  loading: 'Завантаження',
  readingTime: 'Час читання: {0}',
  textIn: 'Текст: {0}',
  askedFor: 'запитано: {0}',
  rewriteIn: 'Переписати мовою: {0}',
  rewritePrompt: 'Перепиши, будь ласка, цю картку такою мовою: {0}.'
};

export default strings;
