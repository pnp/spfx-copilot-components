import { parseConfiguredColumns, resolveFormColumns } from "../logic/configuredColumns";
import { demoFields } from "../logic/demoLibrary";
import { normalizeMaxFileSizeMb, parseAllowedExtensions } from "../logic/fileValidation";
import { libraryStatusMessage, resolveLibraryName, type LibraryLookupStatus } from "../logic/libraryLookup";
import { normalizeDestination } from "../logic/siteTarget";
import { isLocalWorkbench } from "../logic/workbench";
import {
  DEFAULT_CHUNK_SIZE_BYTES,
  DEFAULT_LIBRARY_TITLE,
  DIRECT_UPLOAD_MAX_BYTES,
  type IEditableField,
  type ISubmissionResult
} from "../models";
import type { IFormSubmitRequest } from "../components/ICopilotSharePointFormProps";
import { runDemoUpload } from "./demoUpload";
import { LibraryUnavailableError, NotADocumentLibraryError, loadLibrary, submitDocument } from "./DocumentSubmissionService";
import type { IHttpClient } from "./http";

const DEMO_CHUNK_DELAY_MS = 200;
const DEMO_FOLDER = "/sites/demo/Shared Documents";
const SHAREPOINT_HOST_SUFFIXES: readonly string[] = [
  ".sharepoint.com",
  ".sharepoint.us",
  ".sharepoint.de",
  ".sharepoint.cn"
];

export interface ISubmissionTarget {
  siteUrl: string;
  /** Author or caller library name. Wins over libraryTitle. */
  libraryName: string;
  libraryTitle: string;
  /** JSON array of author-defined Text, Note, and Choice columns. Blank auto-hydrates. */
  configuredColumns: string;
  maxFileSizeMb: string | number | undefined;
  allowedExtensions: string | undefined;
  overwriteExisting: boolean;
  localEnvironment: boolean;
  pageHref: string;
  /** Used when the web part's Site URL property is blank. */
  currentWebUrl: string;
  /** Web part uses the current site. Copilot does not invent one. */
  useCurrentWebWhenSiteUrlBlank: boolean;
  /** Uses Documents when neither library name is set. */
  defaultLibraryTitleWhenBlank: boolean;
}

export type FormLibraryStatus = LibraryLookupStatus | "demo";

export interface IFormSession {
  libraryTitle: string;
  libraryStatus: FormLibraryStatus;
  uploadBlocked: boolean;
  fields: IEditableField[];
  folderServerRelativeUrl: string;
  demoMode: boolean;
  demoMessage?: string;
  fieldsError?: string;
  webAbsoluteUrl: string;
}

/**
 * Live upload adapter for the web part and the Copilot UX component.
 * The file is chosen in the form. This service never accepts file bytes from a tool argument.
 */
export class SharePointFormSubmissionService {
  private _session: IFormSession | undefined;

  public constructor(
    private readonly _client: IHttpClient,
    private readonly _target: ISubmissionTarget
  ) {
  }

  public get target(): ISubmissionTarget {
    return this._target;
  }

  /** Replaces the site and library, then the next load() looks them up again. */
  public setDestination(siteUrl: string, libraryName: string): void {
    const normalized = normalizeDestination(siteUrl, libraryName);
    this._target.siteUrl = normalized.siteUrl;
    this._target.libraryName = normalized.libraryName;
    this._target.libraryTitle = normalized.libraryName;
    this._session = undefined;
  }

  public async load(): Promise<IFormSession> {
    const libraryTitle = this._libraryTitle();
    if (!libraryTitle) {
      const missing = this._blocked("", "missing", "Set the document library name before uploading.", "");
      this._session = missing;
      return missing;
    }

    const configured = parseConfiguredColumns(this._target.configuredColumns);
    if (configured.error) {
      const invalidConfig = this._blocked(libraryTitle, "invalid", configured.error, "");
      this._session = invalidConfig;
      return invalidConfig;
    }

    const siteUrl = this._resolvedSiteUrl();
    const demoMessage = this._demoMessage(siteUrl);
    if (demoMessage) {
      const demo = this._demoSession(libraryTitle, siteUrl, demoMessage);
      this._session = demo;
      return demo;
    }

    try {
      const library = await loadLibrary(this._client, siteUrl, libraryTitle);
      const live: IFormSession = {
        libraryTitle: library.title,
        libraryStatus: "verified",
        uploadBlocked: false,
        fields: resolveFormColumns(configured.columns, library.fields),
        folderServerRelativeUrl: library.folderServerRelativeUrl,
        demoMode: false,
        webAbsoluteUrl: siteUrl
      };
      this._session = live;
      return live;
    } catch (error) {
      if (error instanceof LibraryUnavailableError) {
        const missing = this._blocked(libraryTitle, "missing", libraryStatusMessage("missing", libraryTitle), siteUrl);
        this._session = missing;
        return missing;
      }
      if (error instanceof NotADocumentLibraryError) {
        const invalid = this._blocked(libraryTitle, "invalid", libraryStatusMessage("invalid", libraryTitle), siteUrl);
        this._session = invalid;
        return invalid;
      }
      const failed = this._blocked(
        libraryTitle,
        "invalid",
        error instanceof Error && error.message ? error.message : "The document library could not be read.",
        siteUrl
      );
      this._session = failed;
      return failed;
    }
  }

  public submit(request: IFormSubmitRequest): Promise<ISubmissionResult> {
    const session = this._session;
    if (!session || session.uploadBlocked || session.fieldsError) {
      return Promise.reject(new Error(session && session.fieldsError ? session.fieldsError : "The document library isn't ready."));
    }
    const libraryTitle = session.libraryTitle || DEFAULT_LIBRARY_TITLE;
    const common = {
      webAbsoluteUrl: session.webAbsoluteUrl || "https://contoso.sharepoint.com/sites/demo",
      libraryTitle,
      folderServerRelativeUrl: session.folderServerRelativeUrl || DEMO_FOLDER,
      fileName: request.file.name,
      file: request.file,
      fields: session.fields,
      values: request.values,
      maxFileSizeMb: normalizeMaxFileSizeMb(this._target.maxFileSizeMb),
      allowedExtensions: parseAllowedExtensions(this._target.allowedExtensions),
      chunkSizeBytes: DEFAULT_CHUNK_SIZE_BYTES,
      directThresholdBytes: DIRECT_UPLOAD_MAX_BYTES,
      onProgress: request.onProgress,
      isCancelled: request.isCancelled
    };
    if (session.demoMode) {
      return runDemoUpload({
        ...common,
        delayMs: DEMO_CHUNK_DELAY_MS
      });
    }
    const allowedOrigin = this._allowedOrigin();
    if (!isUsableSiteUrl(session.webAbsoluteUrl, allowedOrigin)) {
      return Promise.reject(new Error("A valid HTTPS SharePoint site URL on the current tenant is required before uploading."));
    }
    return submitDocument(this._client, {
      ...common,
      overwrite: this._target.overwriteExisting,
      uploadId: createUploadId()
    });
  }

  private _libraryTitle(): string {
    const normalized = normalizeDestination(this._target.siteUrl, this._target.libraryName);
    return resolveLibraryName(
      normalized.libraryName,
      this._target.libraryTitle,
      this._target.defaultLibraryTitleWhenBlank
    );
  }

  private _resolvedSiteUrl(): string {
    const normalized = normalizeDestination(this._target.siteUrl, this._target.libraryName);
    if (normalized.siteUrl) {
      return normalized.siteUrl;
    }
    if (this._target.useCurrentWebWhenSiteUrlBlank) {
      return normalizeDestination(this._target.currentWebUrl || "", "").siteUrl;
    }
    return "";
  }

  private _allowedOrigin(): string {
    return resolveAllowedSharePointOrigin(this._target.currentWebUrl, this._target.pageHref);
  }

  private _demoMessage(siteUrl: string): string | undefined {
    if (isLocalWorkbench({
      href: this._target.pageHref,
      webAbsoluteUrl: siteUrl || "https://contoso.sharepoint.com",
      localEnvironment: this._target.localEnvironment
    }) && (this._target.localEnvironment || isLocalAddress(this._target.pageHref) || isLocalAddress(siteUrl))) {
      return "This is the local workbench, so the form is using sample library columns. Nothing is written to SharePoint.";
    }
    if (!siteUrl) {
      return "No SharePoint site URL was given, so the form is using sample library columns. Nothing is written to SharePoint.";
    }
    const allowedOrigin = this._allowedOrigin();
    if (!isUsableSiteUrl(siteUrl, allowedOrigin)) {
      if (allowedOrigin && isUsableSiteUrl(siteUrl)) {
        return `The site URL must match the current SharePoint tenant (${allowedOrigin}), so the form is using sample library columns. Nothing is written to SharePoint.`;
      }
      return "The site URL isn't a SharePoint address yet, so the form is using sample library columns. Nothing is written to SharePoint.";
    }
    return undefined;
  }

  private _demoSession(libraryTitle: string, siteUrl: string, message: string): IFormSession {
    const configured = parseConfiguredColumns(this._target.configuredColumns);
    const allowedOrigin = this._allowedOrigin();
    const safeWebUrl = isUsableSiteUrl(siteUrl, allowedOrigin) ? siteUrl : "";
    return {
      libraryTitle,
      libraryStatus: "demo",
      uploadBlocked: false,
      fields: resolveFormColumns(configured.columns, demoFields()),
      folderServerRelativeUrl: DEMO_FOLDER,
      demoMode: true,
      demoMessage: message,
      webAbsoluteUrl: safeWebUrl
    };
  }

  private _blocked(libraryTitle: string, status: LibraryLookupStatus, message: string, siteUrl: string): IFormSession {
    return {
      libraryTitle,
      libraryStatus: status,
      uploadBlocked: true,
      fields: [],
      folderServerRelativeUrl: "",
      demoMode: false,
      fieldsError: message,
      webAbsoluteUrl: siteUrl
    };
  }
}

export function isSharePointHost(hostname: string): boolean {
  const lower = (hostname || "").trim().toLowerCase();
  if (!lower) {
    return false;
  }
  for (let index = 0; index < SHAREPOINT_HOST_SUFFIXES.length; index += 1) {
    const suffix = SHAREPOINT_HOST_SUFFIXES[index];
    if (lower.endsWith(suffix) && lower.length > suffix.length) {
      return true;
    }
  }
  return false;
}

export function resolveAllowedSharePointOrigin(currentWebUrl?: string, pageHref?: string): string {
  const candidates = [currentWebUrl || "", pageHref || ""];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index].trim();
    if (!candidate) {
      continue;
    }
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" && isSharePointHost(parsed.hostname)) {
        return parsed.origin.toLowerCase();
      }
    } catch {
      // Ignore malformed candidate URLs.
    }
  }
  return "";
}

export function isUsableSiteUrl(value: string, allowedOrigin?: string): boolean {
  const trimmed = (value || "").trim();
  if (!/^https:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      return false;
    }
    if (!isSharePointHost(url.hostname)) {
      return false;
    }
    if (allowedOrigin) {
      const expectedOrigin = resolveAllowedSharePointOrigin(allowedOrigin);
      if (expectedOrigin && url.origin.toLowerCase() !== expectedOrigin) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function isLocalAddress(value: string): boolean {
  const text = (value || "").toLowerCase();
  return text.indexOf("localhost") >= 0 || text.indexOf("127.0.0.1") >= 0;
}

function createUploadId(): string {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000001";
}
