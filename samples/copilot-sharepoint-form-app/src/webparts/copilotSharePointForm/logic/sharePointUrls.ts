export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function odataString(value: string): string {
  return value.replace(/'/g, "''");
}

export function joinServerRelative(folderServerRelativeUrl: string, fileName: string): string {
  const folder = folderServerRelativeUrl.replace(/\/+$/, "");
  const leaf = fileName.replace(/^\/+/, "");
  return `${folder}/${leaf}`;
}

export function listByTitleUrl(webAbsoluteUrl: string, libraryTitle: string, suffix: string): string {
  return `${trimTrailingSlash(webAbsoluteUrl)}/_api/web/lists/getByTitle('${odataString(libraryTitle)}')${suffix}`;
}

export function directUploadUrl(
  webAbsoluteUrl: string,
  folderServerRelativeUrl: string,
  fileName: string,
  overwrite: boolean
): string {
  const folder = odataString(folderServerRelativeUrl);
  const name = odataString(fileName);
  const flag = overwrite ? "true" : "false";
  return `${trimTrailingSlash(webAbsoluteUrl)}/_api/web/GetFolderByServerRelativePath(decodedUrl='${folder}')/Files/add(overwrite=${flag},url='${name}')`;
}

export function fileMethodUrl(webAbsoluteUrl: string, fileServerRelativeUrl: string, method: string): string {
  return `${trimTrailingSlash(webAbsoluteUrl)}/_api/web/GetFileByServerRelativePath(decodedUrl='${odataString(fileServerRelativeUrl)}')/${method}`;
}

export function startUploadMethod(uploadId: string): string {
  return `StartUpload(uploadId=guid'${uploadId}')`;
}

export function continueUploadMethod(uploadId: string, fileOffset: number): string {
  return `ContinueUpload(uploadId=guid'${uploadId}',fileOffset=${fileOffset})`;
}

export function finishUploadMethod(uploadId: string, fileOffset: number): string {
  return `FinishUpload(uploadId=guid'${uploadId}',fileOffset=${fileOffset})`;
}

export function cancelUploadMethod(uploadId: string): string {
  return `CancelUpload(uploadId=guid'${uploadId}')`;
}

export function absoluteFileUrl(webAbsoluteUrl: string, serverRelativeUrl: string): string {
  try {
    const web = new URL(webAbsoluteUrl);
    const path = serverRelativeUrl.charAt(0) === "/" ? serverRelativeUrl : `/${serverRelativeUrl}`;
    const encoded = path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    return `${web.origin}${encoded}`;
  } catch {
    return serverRelativeUrl;
  }
}

export const LIST_FIELDS_SUFFIX: string =
  "/fields?$select=InternalName,Title,TypeAsString,Required,ReadOnlyField,Hidden,Description,Choices&$filter=Hidden eq false and ReadOnlyField eq false";

export const LIST_ROOT_SUFFIX: string =
  "?$select=Id,Title,BaseTemplate,RootFolder/ServerRelativeUrl&$expand=RootFolder";
