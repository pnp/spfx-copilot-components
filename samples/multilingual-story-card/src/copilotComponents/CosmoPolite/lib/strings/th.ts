import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'ไทย',
  detected: 'ตรวจพบ',
  source: 'แหล่งที่มา',
  sources: { agent: 'เอเจนต์', hostLocale: 'ภาษาของโฮสต์', sharePoint: 'SharePoint', browser: 'เบราว์เซอร์', fallback: 'ค่าเริ่มต้น' },
  readAloud: 'อ่านออกเสียง',
  pause: 'หยุดชั่วคราว',
  resume: 'ดำเนินการต่อ',
  stop: 'หยุด',
  reading: 'กำลังอ่านออกเสียง',
  paused: 'หยุดชั่วคราวแล้ว',
  stopped: 'หยุดแล้ว',
  finished: 'อ่านจบแล้ว',
  noVoice: 'ไม่มีเสียงสำหรับ {0}',
  speechUnavailable: 'การอ่านออกเสียงไม่พร้อมใช้งานที่นี่',
  expand: 'มุมมองแบบเต็ม',
  collapse: 'มุมมองแบบกะทัดรัด',
  tellMore: 'บอกเพิ่มเติม',
  tellMorePrompt: 'ช่วยบอกเพิ่มเติมเกี่ยวกับ “{0}”',
  translateTo: 'แปลเป็น',
  translatePrompt: 'ช่วยแปลการ์ดนี้เป็น {0}',
  design: 'การออกแบบ',
  designs: { editorial: 'บทบรรณาธิการ', classic: 'คลาสสิก', dramatic: 'ดรามาติก', compact: 'กะทัดรัด', magazine: 'นิตยสาร' },
  designChanged: 'การออกแบบ: {0}',
  look: 'รูปลักษณ์',
  layout: 'เค้าโครง',
  layouts: { lead: 'รูปภาพหลัก', teaser: 'ทีเซอร์', beside: 'รูปภาพด้านข้าง' },
  layoutChanged: 'เค้าโครง: {0}',
  theme: 'ธีม',
  themes: { auto: 'อัตโนมัติ', light: 'สว่าง', dark: 'มืด' },
  themeChanged: 'ธีม: {0}',
  photo: 'รูปภาพ',
  noImage: 'ไม่พบรูปภาพ',
  diagnostics: 'การวินิจฉัย',
  sent: 'ส่งแล้ว',
  sendFailed: 'ส่งไม่ได้',
  linkFailed: 'เปิดลิงก์ไม่ได้',
  loading: 'กำลังโหลด',
  readingTime: 'เวลาในการอ่าน: {0}',
  textIn: 'ข้อความ: {0}',
  askedFor: 'ที่ขอ: {0}',
  rewriteIn: 'เขียนใหม่เป็น {0}',
  rewritePrompt: 'ช่วยเขียนการ์ดนี้ใหม่เป็น {0}'
};

export default strings;
