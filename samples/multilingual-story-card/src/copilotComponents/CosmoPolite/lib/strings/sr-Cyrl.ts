import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Српски (ћирилица)',
  detected: 'Откривено',
  source: 'Извор',
  sources: { agent: 'агент', hostLocale: 'локалитет хоста', sharePoint: 'SharePoint', browser: 'прегледач', fallback: 'подразумевано' },
  readAloud: 'Читај наглас',
  pause: 'Пауза',
  resume: 'Настави',
  stop: 'Заустави',
  reading: 'Чита се наглас',
  paused: 'Паузирано',
  stopped: 'Заустављено',
  finished: 'Читање је завршено',
  noVoice: 'Нема гласа за језик: {0}',
  speechUnavailable: 'Читање наглас овде није доступно',
  expand: 'Пун приказ',
  collapse: 'Компактни приказ',
  tellMore: 'Реци ми више',
  tellMorePrompt: 'Реци ми више о „{0}“.',
  translateTo: 'Преведи на',
  translatePrompt: 'Преведи ову картицу на следећи језик: {0}.',
  design: 'Дизајн',
  designs: { editorial: 'Уреднички', classic: 'Класични', dramatic: 'Драматични', compact: 'Компактни', magazine: 'Часопис' },
  designChanged: 'Дизајн: {0}',
  look: 'Изглед',
  layout: 'Распоред',
  layouts: { lead: 'Главна слика', teaser: 'Најава', beside: 'Бочна слика' },
  layoutChanged: 'Распоред: {0}',
  theme: 'Тема',
  themes: { auto: 'Аутоматски', light: 'Светла', dark: 'Тамна' },
  themeChanged: 'Тема: {0}',
  photo: 'Фотографија',
  noImage: 'Није пронађена фотографија',
  diagnostics: 'Дијагностика',
  sent: 'Послато',
  sendFailed: 'Слање није успело',
  linkFailed: 'Веза није могла да се отвори',
  loading: 'Учитавање',
  readingTime: 'Време читања: {0}',
  textIn: 'Текст: {0}',
  askedFor: 'тражено: {0}',
  rewriteIn: 'Напиши поново на језику: {0}',
  rewritePrompt: 'Напиши ову картицу поново на следећем језику: {0}.'
};

export default strings;
