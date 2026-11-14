import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Русский',
  detected: 'Обнаружено',
  source: 'Источник',
  sources: { agent: 'агент', hostLocale: 'языковой стандарт узла', sharePoint: 'SharePoint', browser: 'браузер', fallback: 'по умолчанию' },
  readAloud: 'Прочитать вслух',
  pause: 'Пауза',
  resume: 'Продолжить',
  stop: 'Остановить',
  reading: 'Чтение вслух',
  paused: 'Приостановлено',
  stopped: 'Остановлено',
  finished: 'Чтение завершено',
  noVoice: 'Нет голоса для языка: {0}',
  speechUnavailable: 'Чтение вслух здесь недоступно',
  expand: 'Полный вид',
  collapse: 'Компактный вид',
  tellMore: 'Расскажи подробнее',
  tellMorePrompt: 'Расскажи подробнее о «{0}».',
  translateTo: 'Перевести на',
  translatePrompt: 'Переведи эту карточку на следующий язык: {0}.',
  design: 'Оформление',
  designs: { editorial: 'Редакционный', classic: 'Классический', dramatic: 'Драматичный', compact: 'Компактный', magazine: 'Журнальный' },
  designChanged: 'Оформление: {0}',
  look: 'Оформление',
  layout: 'Макет',
  layouts: { lead: 'Главное изображение', teaser: 'Анонс', beside: 'Изображение сбоку' },
  layoutChanged: 'Макет: {0}',
  theme: 'Тема',
  themes: { auto: 'Автоматически', light: 'Светлая', dark: 'Темная' },
  themeChanged: 'Тема: {0}',
  photo: 'Фото',
  noImage: 'Фото не найдено',
  diagnostics: 'Диагностика',
  sent: 'Отправлено',
  sendFailed: 'Не удалось отправить',
  linkFailed: 'Не удалось открыть ссылку',
  loading: 'Загрузка',
  readingTime: 'Время чтения: {0}',
  textIn: 'Текст: {0}',
  askedFor: 'запрошено: {0}',
  rewriteIn: 'Переписать на языке: {0}',
  rewritePrompt: 'Перепиши, пожалуйста, эту карточку на следующем языке: {0}.'
};

export default strings;
