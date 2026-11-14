import type { Theme } from "@fluentui/react-components";
import type { IEditableField, IFieldValueMap, ISubmissionResult, IUploadProgress } from "../models";

export interface IFormSubmitRequest {
  file: File;
  values: IFieldValueMap;
  onProgress: (progress: IUploadProgress) => void;
  isCancelled: () => boolean;
}

export interface ICopilotSharePointFormProps {
  instanceId: string;
  theme: Theme;
  libraryTitle: string;
  maxFileSizeMb: number;
  allowedExtensions: string[];
  loadingFields: boolean;
  fieldsError?: string;
  demoMode: boolean;
  demoMessage?: string;
  libraryStatus?: "verified" | "missing" | "invalid" | "demo";
  /** True when the library lookup failed. The file picker and submit stay disabled. */
  uploadBlocked?: boolean;
  fields: IEditableField[];
  /** Seeds the form. The local preview and tests pass a stable object. */
  initialValues?: IFieldValueMap;
  /** Skips the form and shows the confirmation card. Used by the local preview. */
  initialResult?: ISubmissionResult;
  onRetryFields: () => void;
  onSubmit: (request: IFormSubmitRequest) => Promise<ISubmissionResult>;
  /** Inline Copilot canvas can ask the host to expand the form. */
  displayMode?: "inline" | "fullscreen";
  onExpand?: () => Promise<void>;
  /** Current site address shown in the destination bar. Blank until the person sets one. */
  siteUrl?: string;
  /** Current library name shown in the destination bar. */
  libraryName?: string;
  /** Reloads the library after the person edits the site or library. */
  onLoadTarget?: (siteUrl: string, libraryName: string) => void;
}
