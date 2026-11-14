import { DEFAULT_LIBRARY_TITLE } from "../models";

/** SharePoint BaseTemplate for a document library. */
export const DOCUMENT_LIBRARY_BASE_TEMPLATE = 101;

export type LibraryLookupStatus = "verified" | "missing" | "invalid";

export function resolveLibraryName(
  libraryName: string | undefined,
  libraryTitle: string | undefined,
  fallbackToDocuments: boolean
): string {
  const named = (libraryName || "").trim();
  if (named) {
    return named;
  }
  const titled = (libraryTitle || "").trim();
  if (titled) {
    return titled;
  }
  return fallbackToDocuments ? DEFAULT_LIBRARY_TITLE : "";
}

export function classifyLibrary(found: boolean, baseTemplate: number | undefined): LibraryLookupStatus {
  if (!found) {
    return "missing";
  }
  if (baseTemplate !== DOCUMENT_LIBRARY_BASE_TEMPLATE) {
    return "invalid";
  }
  return "verified";
}

export function libraryStatusMessage(status: LibraryLookupStatus, libraryName: string): string {
  if (status === "missing") {
    return `Library "${libraryName}" was not found. Choose a document library that exists before uploading.`;
  }
  if (status === "invalid") {
    return `"${libraryName}" is not a document library. Choose a library (BaseTemplate 101) before uploading.`;
  }
  return `${libraryName} is a document library.`;
}
