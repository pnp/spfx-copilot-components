import {
  DEFAULT_CHUNK_SIZE_BYTES,
  DIRECT_UPLOAD_MAX_BYTES,
  type IEditableField,
  type IFieldValueMap,
  type IFileRules,
  type ISubmissionResult,
  type IUploadProgress
} from "../models";
import { hasFieldErrors, parseFieldPayload, validateFormValues } from "../logic/fieldSchema";
import { baseFileName, validateSelectedFile } from "../logic/fileValidation";
import { buildValidateUpdateListItemBody, summarizeMetadata } from "../logic/metadataPayload";
import {
  absoluteFileUrl,
  cancelUploadMethod,
  continueUploadMethod,
  directUploadUrl,
  fileMethodUrl,
  finishUploadMethod,
  joinServerRelative,
  LIST_FIELDS_SUFFIX,
  LIST_ROOT_SUFFIX,
  listByTitleUrl,
  startUploadMethod
} from "../logic/sharePointUrls";
import { DOCUMENT_LIBRARY_BASE_TEMPLATE } from "../logic/libraryLookup";
import { planUpload, uploadPercent } from "../logic/uploadPlan";
import { BINARY_HEADERS, JSON_HEADERS, parseJson, readErrorMessage, readUploadOffset, type IHttpClient } from "./http";
import type { IByteSource, IListItemRef, ILoadedLibrary, IUploadedFile } from "./types";

export class LibraryUnavailableError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "LibraryUnavailableError";
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotADocumentLibraryError extends Error {
  public readonly baseTemplate: number;

  public constructor(libraryTitle: string, baseTemplate: number) {
    super(`"${libraryTitle}" is not a document library.`);
    this.name = "NotADocumentLibraryError";
    this.baseTemplate = baseTemplate;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MetadataUpdateError extends Error {
  public readonly fileUrl: string;

  public constructor(message: string, fileUrl: string) {
    super(message);
    this.name = "MetadataUpdateError";
    this.fileUrl = fileUrl;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface IUploadRequest {
  webAbsoluteUrl: string;
  folderServerRelativeUrl: string;
  fileName: string;
  file: IByteSource;
  overwrite: boolean;
  chunkSizeBytes: number;
  directThresholdBytes: number;
  uploadId: string;
  onProgress: (progress: IUploadProgress) => void;
  isCancelled: () => boolean;
}

export interface ISubmitDocumentRequest extends IUploadRequest, IFileRules {
  libraryTitle: string;
  fields: IEditableField[];
  values: IFieldValueMap;
}

interface IUpdateRow {
  HasException?: boolean;
  ErrorMessage?: string;
  FieldName?: string;
}

export async function loadLibrary(
  client: IHttpClient,
  webAbsoluteUrl: string,
  libraryTitle: string
): Promise<ILoadedLibrary> {
  const listResponse = await client.get(listByTitleUrl(webAbsoluteUrl, libraryTitle, LIST_ROOT_SUFFIX));
  if (!listResponse.ok) {
    const message = await readErrorMessage(listResponse, `Couldn't open the ${libraryTitle} library.`);
    if (listResponse.status === 404 || listResponse.status === 0) {
      throw new LibraryUnavailableError(message, listResponse.status);
    }
    throw new Error(message);
  }
  const listText = await listResponse.text();
  const list = parseLibrary(parseJson(listText), libraryTitle);
  if (list.baseTemplate !== DOCUMENT_LIBRARY_BASE_TEMPLATE) {
    throw new NotADocumentLibraryError(libraryTitle, list.baseTemplate);
  }

  const fieldsResponse = await client.get(listByTitleUrl(webAbsoluteUrl, libraryTitle, LIST_FIELDS_SUFFIX));
  if (!fieldsResponse.ok) {
    const message = await readErrorMessage(fieldsResponse, `Couldn't read columns on the ${libraryTitle} library.`);
    if (fieldsResponse.status === 404 || fieldsResponse.status === 0) {
      throw new LibraryUnavailableError(message, fieldsResponse.status);
    }
    throw new Error(message);
  }
  const fieldsText = await fieldsResponse.text();
  const groups = parseFieldPayload(parseJson(fieldsText));
  return {
    id: list.id,
    title: list.title,
    baseTemplate: list.baseTemplate,
    folderServerRelativeUrl: list.folderServerRelativeUrl,
    fields: groups.required.concat(groups.optional)
  };
}

export async function submitDocument(client: IHttpClient, request: ISubmitDocumentRequest): Promise<ISubmissionResult> {
  const fileName = baseFileName(request.fileName);
  assertCanSubmit(fileName, request);
  const uploaded = await uploadDocument(client, { ...request, fileName });
  const fileUrl = absoluteFileUrl(request.webAbsoluteUrl, uploaded.serverRelativeUrl);
  try {
    const item = await readListItem(client, request.webAbsoluteUrl, uploaded.serverRelativeUrl);
    await saveMetadata(client, request.webAbsoluteUrl, request.libraryTitle, item.id, request.fields, request.values);
  } catch (error) {
    const detail = error instanceof Error && error.message ? error.message : "The metadata update failed.";
    throw new MetadataUpdateError(
      `The file was uploaded, but the metadata was not saved. ${detail}`,
      fileUrl
    );
  }
  return {
    fileName,
    sizeBytes: request.file.size,
    libraryTitle: request.libraryTitle,
    fileUrl,
    metadata: summarizeMetadata(request.fields, request.values),
    demo: false
  };
}

export async function uploadDocument(client: IHttpClient, request: IUploadRequest): Promise<IUploadedFile> {
  const fileName = baseFileName(request.fileName);
  const plan = planUpload(request.file.size, request.chunkSizeBytes, request.directThresholdBytes);
  const serverRelativeUrl = joinServerRelative(request.folderServerRelativeUrl, fileName);

  if (plan.mode === "direct") {
    report(request, 0, "direct", 0, 1);
    if (request.isCancelled()) {
      throw new Error("Upload cancelled.");
    }
    const response = await client.post(
      directUploadUrl(request.webAbsoluteUrl, request.folderServerRelativeUrl, fileName, request.overwrite),
      request.file,
      BINARY_HEADERS
    );
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "The file could not be uploaded."));
    }
    report(request, request.file.size, "direct", 0, 1);
    return { fileName, serverRelativeUrl };
  }

  if (request.isCancelled()) {
    throw new Error("Upload cancelled.");
  }
  const placeholder = await client.post(
    directUploadUrl(request.webAbsoluteUrl, request.folderServerRelativeUrl, fileName, request.overwrite),
    undefined,
    BINARY_HEADERS
  );
  if (!placeholder.ok) {
    throw new Error(await readErrorMessage(placeholder, "The file could not be created for chunked upload."));
  }

  let offset = 0;
  try {
    for (let index = 0; index < plan.chunks.length; index += 1) {
      if (request.isCancelled()) {
        throw new Error("Upload cancelled.");
      }
      const chunk = plan.chunks[index];
      const method = chunk.stage === "start"
        ? startUploadMethod(request.uploadId)
        : chunk.stage === "finish"
          ? finishUploadMethod(request.uploadId, offset)
          : continueUploadMethod(request.uploadId, offset);
      const response = await client.post(
        fileMethodUrl(request.webAbsoluteUrl, serverRelativeUrl, method),
        request.file.slice(chunk.start, chunk.end),
        BINARY_HEADERS
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "A chunk could not be uploaded."));
      }
      if (chunk.stage !== "finish") {
        offset = await readUploadOffset(response, chunk.end);
      }
      report(request, chunk.end, chunk.stage, chunk.index, plan.chunks.length);
    }
  } catch (error) {
    await cancelUpload(client, request.webAbsoluteUrl, serverRelativeUrl, request.uploadId);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error("The chunked upload failed.");
  }

  return { fileName, serverRelativeUrl };
}

async function saveMetadata(
  client: IHttpClient,
  webAbsoluteUrl: string,
  libraryTitle: string,
  itemId: number,
  fields: IEditableField[],
  values: IFieldValueMap
): Promise<void> {
  const body = buildValidateUpdateListItemBody(fields, values);
  const url = `${listByTitleUrl(webAbsoluteUrl, libraryTitle, "")}/items(${itemId})/ValidateUpdateListItem`;
  const response = await client.post(url, JSON.stringify(body), JSON_HEADERS);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "SharePoint rejected the metadata."));
  }
  const text = await response.text();
  const failures = readUpdateFailures(parseJson(text));
  if (failures.length > 0) {
    throw new Error(failures.join(" "));
  }
}

async function readListItem(client: IHttpClient, webAbsoluteUrl: string, serverRelativeUrl: string): Promise<IListItemRef> {
  const response = await client.get(
    fileMethodUrl(webAbsoluteUrl, serverRelativeUrl, "ListItemAllFields?$select=Id,ID,FileRef,FileLeafRef")
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "The uploaded file has no list item yet."));
  }
  const text = await response.text();
  const item = parseListItem(parseJson(text));
  if (item.id <= 0) {
    throw new Error("The uploaded file has no list item yet.");
  }
  return item;
}

async function cancelUpload(
  client: IHttpClient,
  webAbsoluteUrl: string,
  serverRelativeUrl: string,
  uploadId: string
): Promise<void> {
  try {
    await client.post(
      fileMethodUrl(webAbsoluteUrl, serverRelativeUrl, cancelUploadMethod(uploadId)),
      undefined,
      BINARY_HEADERS
    );
  } catch {
    // The original upload error is the one the form should show.
  }
}

function assertCanSubmit(fileName: string, request: ISubmitDocumentRequest): void {
  const fileCheck = validateSelectedFile({ name: fileName, size: request.file.size }, {
    maxFileSizeMb: request.maxFileSizeMb,
    allowedExtensions: request.allowedExtensions
  });
  if (!fileCheck.ok) {
    throw new Error(fileCheck.message || "Choose a valid file.");
  }
  const fieldErrors = validateFormValues(request.fields, request.values);
  if (hasFieldErrors(fieldErrors)) {
    const messages = Object.keys(fieldErrors).map((key) => fieldErrors[key]);
    throw new Error(messages.join(" "));
  }
}

function report(
  request: IUploadRequest,
  loadedBytes: number,
  stage: IUploadProgress["stage"],
  chunkIndex: number,
  chunkCount: number
): void {
  request.onProgress({
    loadedBytes,
    totalBytes: request.file.size,
    percent: uploadPercent(loadedBytes, request.file.size),
    mode: stage === "direct" ? "direct" : "chunked",
    stage,
    chunkIndex,
    chunkCount
  });
}

function parseLibrary(payload: unknown, fallbackTitle: string): { id: string; title: string; baseTemplate: number; folderServerRelativeUrl: string } {
  const record = unwrapEntity(payload);
  const root = record.RootFolder && typeof record.RootFolder === "object"
    ? record.RootFolder as { [key: string]: unknown }
    : undefined;
  const folder = root && typeof root.ServerRelativeUrl === "string" ? root.ServerRelativeUrl : "";
  if (!folder) {
    throw new Error(`The ${fallbackTitle} library has no root folder.`);
  }
  const rawTemplate = record.BaseTemplate;
  const baseTemplate = typeof rawTemplate === "number" ? rawTemplate : Number(rawTemplate);
  return {
    id: typeof record.Id === "string" ? record.Id : "",
    title: typeof record.Title === "string" && record.Title ? record.Title : fallbackTitle,
    baseTemplate: Number.isFinite(baseTemplate) ? baseTemplate : -1,
    folderServerRelativeUrl: folder
  };
}

function parseListItem(payload: unknown): IListItemRef {
  const record = unwrapEntity(payload);
  const rawId = record.Id !== undefined ? record.Id : record.ID;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  return {
    id: Number.isFinite(id) ? id : 0,
    fileRef: typeof record.FileRef === "string" ? record.FileRef : ""
  };
}

function readUpdateFailures(payload: unknown): string[] {
  const rows = unwrapRows(payload);
  const failures: string[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] as IUpdateRow;
    if (row && row.HasException) {
      const name = row.FieldName || "A column";
      failures.push(row.ErrorMessage ? `${name}: ${row.ErrorMessage}` : `${name} could not be saved.`);
    }
  }
  return failures;
}

function unwrapEntity(payload: unknown): { [key: string]: unknown } {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const record = payload as { [key: string]: unknown };
  if (record.d && typeof record.d === "object") {
    return record.d as { [key: string]: unknown };
  }
  return record;
}

function unwrapRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as { [key: string]: unknown };
  if (Array.isArray(record.value)) {
    return record.value;
  }
  const data = record.d;
  if (!data || typeof data !== "object") {
    return [];
  }
  const inner = data as { [key: string]: unknown };
  if (Array.isArray(inner.results)) {
    return inner.results;
  }
  const named = inner.ValidateUpdateListItem;
  if (named && typeof named === "object") {
    const results = (named as { [key: string]: unknown }).results;
    if (Array.isArray(results)) {
      return results;
    }
  }
  return [];
}

export const DEFAULT_UPLOAD_CHUNK_BYTES: number = DEFAULT_CHUNK_SIZE_BYTES;
export const DEFAULT_DIRECT_THRESHOLD_BYTES: number = DIRECT_UPLOAD_MAX_BYTES;
