import type { IEditableField, IFieldValueMap, IFileRules, ISubmissionResult, IUploadProgress } from "../models";
import { hasFieldErrors, validateFormValues } from "../logic/fieldSchema";
import { baseFileName, validateSelectedFile } from "../logic/fileValidation";
import { summarizeMetadata } from "../logic/metadataPayload";
import { absoluteFileUrl, trimTrailingSlash } from "../logic/sharePointUrls";
import { planUpload, uploadPercent } from "../logic/uploadPlan";
import type { IByteSource } from "./types";

export interface IDemoUploadRequest extends IFileRules {
  webAbsoluteUrl: string;
  libraryTitle: string;
  folderServerRelativeUrl: string;
  fileName: string;
  file: IByteSource;
  fields: IEditableField[];
  values: IFieldValueMap;
  chunkSizeBytes: number;
  directThresholdBytes: number;
  delayMs: number;
  onProgress: (progress: IUploadProgress) => void;
  isCancelled: () => boolean;
}

export async function runDemoUpload(request: IDemoUploadRequest): Promise<ISubmissionResult> {
  const fileName = baseFileName(request.fileName);
  const fileCheck = validateSelectedFile({ name: fileName, size: request.file.size }, request);
  if (!fileCheck.ok) {
    throw new Error(fileCheck.message || "Choose a valid file.");
  }
  const fieldErrors = validateFormValues(request.fields, request.values);
  if (hasFieldErrors(fieldErrors)) {
    throw new Error(Object.keys(fieldErrors).map((key) => fieldErrors[key]).join(" "));
  }

  const plan = planUpload(request.file.size, request.chunkSizeBytes, request.directThresholdBytes);
  for (let index = 0; index < plan.chunks.length; index += 1) {
    if (request.isCancelled()) {
      throw new Error("Upload cancelled.");
    }
    const chunk = plan.chunks[index];
    request.file.slice(chunk.start, chunk.end);
    if (request.delayMs > 0) {
      await wait(request.delayMs);
    }
    if (request.isCancelled()) {
      throw new Error("Upload cancelled.");
    }
    request.onProgress({
      loadedBytes: chunk.end,
      totalBytes: request.file.size,
      percent: uploadPercent(chunk.end, request.file.size),
      mode: plan.mode,
      stage: chunk.stage,
      chunkIndex: chunk.index,
      chunkCount: plan.chunks.length
    });
  }

  const folder = request.folderServerRelativeUrl || "/sites/demo/Shared Documents";
  const serverRelative = `${folder.replace(/\/+$/, "")}/${fileName}`;
  const site = trimTrailingSlash(request.webAbsoluteUrl) || "https://contoso.sharepoint.com/sites/demo";
  return {
    fileName,
    sizeBytes: request.file.size,
    libraryTitle: request.libraryTitle,
    fileUrl: absoluteFileUrl(site, serverRelative),
    metadata: summarizeMetadata(request.fields, request.values),
    demo: true
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
