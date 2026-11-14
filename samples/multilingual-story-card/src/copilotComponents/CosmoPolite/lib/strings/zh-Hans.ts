import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: '中文（简体）',
  detected: '已检测',
  source: '来源',
  sources: { agent: '代理', hostLocale: '主机区域设置', sharePoint: 'SharePoint', browser: '浏览器', fallback: '默认' },
  readAloud: '朗读',
  pause: '暂停',
  resume: '继续',
  stop: '停止',
  reading: '正在朗读',
  paused: '已暂停',
  stopped: '已停止',
  finished: '朗读完毕',
  noVoice: '没有适用于{0}的语音',
  speechUnavailable: '此处无法使用朗读功能',
  expand: '完整视图',
  collapse: '简洁视图',
  tellMore: '告诉我更多',
  tellMorePrompt: '告诉我更多关于“{0}”的信息。',
  translateTo: '翻译为',
  translatePrompt: '请将此卡片翻译成{0}。',
  design: '设计',
  designs: { editorial: '编辑风格', classic: '经典', dramatic: '戏剧化', compact: '紧凑', magazine: '杂志' },
  designChanged: '设计：{0}',
  look: '外观',
  layout: '布局',
  layouts: { lead: '大图', teaser: '摘要', beside: '侧图' },
  layoutChanged: '布局：{0}',
  theme: '主题',
  themes: { auto: '自动', light: '浅色', dark: '深色' },
  themeChanged: '主题：{0}',
  photo: '照片',
  noImage: '未找到照片',
  diagnostics: '诊断',
  sent: '已发送',
  sendFailed: '无法发送',
  linkFailed: '无法打开链接',
  loading: '正在加载',
  readingTime: '阅读时间：{0}',
  textIn: '文本：{0}',
  askedFor: '请求：{0}',
  rewriteIn: '用{0}重写',
  rewritePrompt: '请用{0}重写这张卡片。'
};

export default strings;
