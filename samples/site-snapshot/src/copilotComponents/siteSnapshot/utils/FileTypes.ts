// File-type categorisation from a file name. Used for the "by type" breakdown.

export type FileCategory =
  | 'Word'
  | 'Excel'
  | 'PowerPoint'
  | 'PDF'
  | 'Images'
  | 'Media'
  | 'Archives'
  | 'Other';

const MAP: Record<string, FileCategory> = {
  doc: 'Word', docx: 'Word', dot: 'Word', dotx: 'Word', rtf: 'Word',
  xls: 'Excel', xlsx: 'Excel', xlsm: 'Excel', csv: 'Excel',
  ppt: 'PowerPoint', pptx: 'PowerPoint', ppsx: 'PowerPoint',
  pdf: 'PDF',
  png: 'Images', jpg: 'Images', jpeg: 'Images', gif: 'Images', bmp: 'Images',
  svg: 'Images', webp: 'Images', heic: 'Images', tif: 'Images', tiff: 'Images',
  mp4: 'Media', mov: 'Media', avi: 'Media', mkv: 'Media', wmv: 'Media',
  mp3: 'Media', wav: 'Media', m4a: 'Media', m4v: 'Media',
  zip: 'Archives', rar: 'Archives', '7z': 'Archives', tar: 'Archives', gz: 'Archives'
};

// Fixed display order for the breakdown table.
export const CATEGORY_ORDER: FileCategory[] = [
  'Word', 'Excel', 'PowerPoint', 'PDF', 'Images', 'Media', 'Archives', 'Other'
];

export function categorize(fileName: string): FileCategory {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0) return 'Other';
  const ext = fileName.slice(dot + 1).toLowerCase();
  return MAP[ext] || 'Other';
}
