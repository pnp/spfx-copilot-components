import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: '中文（繁體）',
  detected: '已偵測',
  source: '來源',
  sources: { agent: '代理程式', hostLocale: '主機地區設定', sharePoint: 'SharePoint', browser: '瀏覽器', fallback: '預設' },
  readAloud: '朗讀',
  pause: '暫停',
  resume: '繼續',
  stop: '停止',
  reading: '正在朗讀',
  paused: '已暫停',
  stopped: '已停止',
  finished: '朗讀完畢',
  noVoice: '沒有適用於{0}的語音',
  speechUnavailable: '此處無法使用朗讀功能',
  expand: '完整檢視',
  collapse: '精簡檢視',
  tellMore: '告訴我更多',
  tellMorePrompt: '告訴我更多關於「{0}」的資訊。',
  translateTo: '翻譯成',
  translatePrompt: '請將這張卡片翻譯成{0}。',
  design: '設計',
  designs: { editorial: '編輯風格', classic: '經典', dramatic: '戲劇化', compact: '精簡', magazine: '雜誌' },
  designChanged: '設計：{0}',
  look: '外觀',
  layout: '版面配置',
  layouts: { lead: '大圖', teaser: '摘要', beside: '側邊圖片' },
  layoutChanged: '版面配置：{0}',
  theme: '佈景主題',
  themes: { auto: '自動', light: '淺色', dark: '深色' },
  themeChanged: '佈景主題：{0}',
  photo: '相片',
  noImage: '找不到相片',
  diagnostics: '診斷',
  sent: '已傳送',
  sendFailed: '無法傳送',
  linkFailed: '無法開啟連結',
  loading: '正在載入',
  readingTime: '閱讀時間：{0}',
  textIn: '文字：{0}',
  askedFor: '要求：{0}',
  rewriteIn: '以{0}重寫',
  rewritePrompt: '請用{0}重寫這張卡片。'
};

export default strings;
