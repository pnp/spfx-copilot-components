export interface IByteSource {
  readonly size: number;
  slice(start?: number, end?: number, contentType?: string): IByteSource;
}

export interface ILoadedLibrary {
  id: string;
  title: string;
  baseTemplate: number;
  folderServerRelativeUrl: string;
  fields: import("../models").IEditableField[];
}

export interface IUploadedFile {
  fileName: string;
  serverRelativeUrl: string;
}

export interface IListItemRef {
  id: number;
  fileRef: string;
}
