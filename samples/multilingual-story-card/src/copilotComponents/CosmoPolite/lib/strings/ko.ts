import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: '한국어',
  detected: '감지됨',
  source: '원본',
  sources: { agent: '에이전트', hostLocale: '호스트 로캘', sharePoint: 'SharePoint', browser: '브라우저', fallback: '기본값' },
  readAloud: '소리 내어 읽기',
  pause: '일시 중지',
  resume: '다시 시작',
  stop: '중지',
  reading: '소리 내어 읽는 중',
  paused: '일시 중지됨',
  stopped: '중지됨',
  finished: '읽기 완료',
  noVoice: '{0} 음성 없음',
  speechUnavailable: '여기서는 소리 내어 읽기를 사용할 수 없습니다',
  expand: '전체 보기',
  collapse: '간단히 보기',
  tellMore: '자세히 알려 주세요',
  tellMorePrompt: '‘{0}’에 대해 자세히 알려 주세요.',
  translateTo: '번역할 언어',
  translatePrompt: '이 카드를 {0}(으)로 번역해 주세요.',
  design: '디자인',
  designs: { editorial: '에디토리얼', classic: '클래식', dramatic: '드라마틱', compact: '컴팩트', magazine: '매거진' },
  designChanged: '디자인: {0}',
  look: '모양',
  layout: '레이아웃',
  layouts: { lead: '대표 이미지', teaser: '티저', beside: '측면 이미지' },
  layoutChanged: '레이아웃: {0}',
  theme: '테마',
  themes: { auto: '자동', light: '밝게', dark: '어둡게' },
  themeChanged: '테마: {0}',
  photo: '사진',
  noImage: '사진을 찾을 수 없음',
  diagnostics: '진단',
  sent: '보냄',
  sendFailed: '보낼 수 없음',
  linkFailed: '링크를 열 수 없음',
  loading: '로드 중',
  readingTime: '읽는 시간: {0}',
  textIn: '텍스트: {0}',
  askedFor: '요청: {0}',
  rewriteIn: '{0}(으)로 다시 쓰기',
  rewritePrompt: '이 카드를 {0}(으)로 다시 작성해 주세요.'
};

export default strings;
