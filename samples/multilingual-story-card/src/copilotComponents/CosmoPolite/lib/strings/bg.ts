import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Български',
  detected: 'Разпознат',
  source: 'Източник',
  sources: { agent: 'агент', hostLocale: 'език на хоста', sharePoint: 'SharePoint', browser: 'браузър', fallback: 'по подразбиране' },
  readAloud: 'Прочитане на глас',
  pause: 'Пауза',
  resume: 'Продължаване',
  stop: 'Спиране',
  reading: 'Чете се на глас',
  paused: 'На пауза',
  stopped: 'Спряно',
  finished: 'Прочитането приключи',
  noVoice: 'Няма глас за език: {0}',
  speechUnavailable: 'Четенето на глас не е налично тук',
  expand: 'Цял изглед',
  collapse: 'Компактен изглед',
  tellMore: 'Разкажи ми повече',
  tellMorePrompt: 'Разкажи ми повече за „{0}“.',
  translateTo: 'Превод на',
  translatePrompt: 'Преведи тази карта на следния език: {0}.',
  design: 'Дизайн',
  designs: { editorial: 'Редакционен', classic: 'Класически', dramatic: 'Драматичен', compact: 'Компактен', magazine: 'Списание' },
  designChanged: 'Дизайн: {0}',
  look: 'Изглед',
  layout: 'Оформление',
  layouts: { lead: 'Водещо изображение', teaser: 'Анонс', beside: 'Странично изображение' },
  layoutChanged: 'Оформление: {0}',
  theme: 'Тема',
  themes: { auto: 'Автоматично', light: 'Светла', dark: 'Тъмна' },
  themeChanged: 'Тема: {0}',
  photo: 'Снимка',
  noImage: 'Не е намерена снимка',
  diagnostics: 'Диагностика',
  sent: 'Изпратено',
  sendFailed: 'Неуспешно изпращане',
  linkFailed: 'Връзката не може да се отвори',
  loading: 'Зарежда се',
  readingTime: 'Време за четене: {0}',
  textIn: 'Текст: {0}',
  askedFor: 'поискан: {0}',
  rewriteIn: 'Пренаписване на език: {0}',
  rewritePrompt: 'Моля, напиши отново тази карта на следния език: {0}.'
};

export default strings;
