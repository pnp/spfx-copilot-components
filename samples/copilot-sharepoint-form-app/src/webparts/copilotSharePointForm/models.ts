export const BYTES_PER_MB: number = 1024 * 1024;

/** Files at or under this size use one SharePoint REST POST. Larger files are chunked. */
export const DIRECT_UPLOAD_MAX_BYTES: number = 10 * BYTES_PER_MB;

/** Each StartUpload / ContinueUpload / FinishUpload body is at most this large. */
export const DEFAULT_CHUNK_SIZE_BYTES: number = 10 * BYTES_PER_MB;

export const ABSOLUTE_MAX_FILE_SIZE_MB: number = 50;

export const DEFAULT_MAX_FILE_SIZE_MB: number = 50;

export const DEFAULT_LIBRARY_TITLE: string = "Documents";

export const DEFAULT_ALLOWED_EXTENSIONS: string = ".pdf,.docx,.xlsx,.pptx,.md,.png,.jpg";

export const DEFAULT_ALLOWED_EXTENSION_LIST: readonly string[] = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
  ".md",
  ".png",
  ".jpg"
];

export const SUPPORTED_EXTENSIONS: readonly string[] = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
  ".md",
  ".markdown",
  ".png",
  ".jpg"
];

export type FieldType =
  | "Text"
  | "Note"
  | "Choice"
  | "MultiChoice"
  | "Number"
  | "Currency"
  | "DateTime"
  | "Boolean"
  | "URL"
  | "User";

export interface IEditableField {
  internalName: string;
  title: string;
  description: string;
  type: FieldType;
  required: boolean;
  choices: string[];
}

export interface IFieldGroups {
  required: IEditableField[];
  optional: IEditableField[];
}

export type FieldValue = string | boolean | string[];

export interface IFieldValueMap {
  [internalName: string]: FieldValue;
}

export interface IFieldErrorMap {
  [internalName: string]: string;
}

export type UploadMode = "direct" | "chunked";

export type UploadStage = "direct" | "start" | "continue" | "finish";

export interface IUploadProgress {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  mode: UploadMode;
  stage: UploadStage;
  chunkIndex: number;
  chunkCount: number;
}

export interface IMetadataSummaryItem {
  internalName: string;
  title: string;
  value: string;
}

export interface ISubmissionResult {
  fileName: string;
  sizeBytes: number;
  libraryTitle: string;
  fileUrl: string;
  metadata: IMetadataSummaryItem[];
  demo: boolean;
}

export interface IFileRules {
  maxFileSizeMb: number;
  allowedExtensions: string[];
}

export interface IFileValidation {
  ok: boolean;
  message?: string;
}

export interface INamedFile {
  name: string;
  size: number;
}
