import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Tiếng Việt',
  detected: 'Đã phát hiện',
  source: 'Nguồn',
  sources: { agent: 'tác nhân', hostLocale: 'ngôn ngữ của máy chủ', sharePoint: 'SharePoint', browser: 'trình duyệt', fallback: 'mặc định' },
  readAloud: 'Đọc to',
  pause: 'Tạm dừng',
  resume: 'Tiếp tục',
  stop: 'Dừng',
  reading: 'Đang đọc to',
  paused: 'Đã tạm dừng',
  stopped: 'Đã dừng',
  finished: 'Đã đọc xong',
  noVoice: 'Không có giọng đọc cho {0}',
  speechUnavailable: 'Tính năng đọc to không khả dụng ở đây',
  expand: 'Chế độ xem đầy đủ',
  collapse: 'Chế độ xem thu gọn',
  tellMore: 'Cho tôi biết thêm',
  tellMorePrompt: 'Cho tôi biết thêm về “{0}”.',
  translateTo: 'Dịch sang',
  translatePrompt: 'Hãy dịch thẻ này sang {0}.',
  design: 'Thiết kế',
  designs: { editorial: 'Biên tập', classic: 'Cổ điển', dramatic: 'Ấn tượng', compact: 'Thu gọn', magazine: 'Tạp chí' },
  designChanged: 'Thiết kế: {0}',
  look: 'Giao diện',
  layout: 'Bố cục',
  layouts: { lead: 'Ảnh chính', teaser: 'Giới thiệu', beside: 'Ảnh bên cạnh' },
  layoutChanged: 'Bố cục: {0}',
  theme: 'Chủ đề',
  themes: { auto: 'Tự động', light: 'Sáng', dark: 'Tối' },
  themeChanged: 'Chủ đề: {0}',
  photo: 'Ảnh',
  noImage: 'Không tìm thấy ảnh',
  diagnostics: 'Chẩn đoán',
  sent: 'Đã gửi',
  sendFailed: 'Không gửi được',
  linkFailed: 'Không mở được liên kết',
  loading: 'Đang tải',
  readingTime: 'Thời gian đọc: {0}',
  textIn: 'Văn bản: {0}',
  askedFor: 'yêu cầu: {0}',
  rewriteIn: 'Viết lại bằng {0}',
  rewritePrompt: 'Hãy viết lại thẻ này bằng {0}.'
};

export default strings;
