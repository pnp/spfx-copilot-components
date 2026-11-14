import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: '日本語',
  detected: '検出',
  source: 'ソース',
  sources: { agent: 'エージェント', hostLocale: 'ホストのロケール', sharePoint: 'SharePoint', browser: 'ブラウザー', fallback: '既定' },
  readAloud: '読み上げ',
  pause: '一時停止',
  resume: '再開',
  stop: '停止',
  reading: '読み上げ中',
  paused: '一時停止中',
  stopped: '停止しました',
  finished: '読み上げが完了しました',
  noVoice: '{0}の音声がありません',
  speechUnavailable: 'ここでは読み上げを利用できません',
  expand: '全体表示',
  collapse: 'コンパクト表示',
  tellMore: '詳しく教えて',
  tellMorePrompt: '「{0}」について詳しく教えてください。',
  translateTo: '翻訳先',
  translatePrompt: 'このカードを{0}に翻訳してください。',
  design: 'デザイン',
  designs: { editorial: 'エディトリアル', classic: 'クラシック', dramatic: 'ドラマチック', compact: 'コンパクト', magazine: 'マガジン' },
  designChanged: 'デザイン: {0}',
  look: '表示スタイル',
  layout: 'レイアウト',
  layouts: { lead: 'メイン画像', teaser: 'ティーザー', beside: 'サイド画像' },
  layoutChanged: 'レイアウト: {0}',
  theme: 'テーマ',
  themes: { auto: '自動', light: 'ライト', dark: 'ダーク' },
  themeChanged: 'テーマ: {0}',
  photo: '写真',
  noImage: '写真が見つかりません',
  diagnostics: '診断',
  sent: '送信しました',
  sendFailed: '送信できませんでした',
  linkFailed: 'リンクを開けませんでした',
  loading: '読み込み中',
  readingTime: '読了時間: {0}',
  textIn: 'テキスト: {0}',
  askedFor: 'リクエスト: {0}',
  rewriteIn: '{0}で書き直す',
  rewritePrompt: 'このカードを{0}で書き直してください。'
};

export default strings;
