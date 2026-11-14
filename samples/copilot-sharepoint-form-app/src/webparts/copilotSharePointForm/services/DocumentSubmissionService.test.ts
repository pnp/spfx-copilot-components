import { BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES, type IEditableField, type IUploadProgress } from "../models";
import { demoFields } from "../logic/demoLibrary";
import {
  LibraryUnavailableError,
  MetadataUpdateError,
  loadLibrary,
  submitDocument,
  uploadDocument,
  type ISubmitDocumentRequest,
  type IUploadRequest
} from "./DocumentSubmissionService";
import type { IHttpClient, IHttpResponse } from "./http";
import type { IByteSource } from "./types";

class FakeBytes implements IByteSource {
  public constructor(public readonly size: number) {
  }

  public slice(start?: number, end?: number): IByteSource {
    const from = start === undefined ? 0 : start;
    const to = end === undefined ? this.size : end;
    return new FakeBytes(Math.max(0, to - from));
  }
}

interface ICall {
  method: "GET" | "POST";
  url: string;
  body: IByteSource | string | undefined;
}

class FakeClient implements IHttpClient {
  public readonly calls: ICall[] = [];

  public constructor(private readonly _handle: (call: ICall) => IHttpResponse) {
  }

  public get(url: string): Promise<IHttpResponse> {
    return this._send("GET", url, undefined);
  }

  public post(url: string, body: IByteSource | string | undefined): Promise<IHttpResponse> {
    return this._send("POST", url, body);
  }

  private _send(method: "GET" | "POST", url: string, body: IByteSource | string | undefined): Promise<IHttpResponse> {
    const call: ICall = { method, url, body };
    this.calls.push(call);
    return Promise.resolve(this._handle(call));
  }
}

function jsonResponse(status: number, body: unknown): IHttpResponse {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: (): Promise<string> => Promise.resolve(text)
  };
}

function textResponse(status: number, text: string): IHttpResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: (): Promise<string> => Promise.resolve(text)
  };
}

const fields: IEditableField[] = [
  { internalName: "Title", title: "Document Title", description: "", type: "Text", required: true, choices: [] },
  { internalName: "Department", title: "Department", description: "", type: "Choice", required: true, choices: ["Legal"] },
  { internalName: "Notes", title: "Notes", description: "", type: "Note", required: false, choices: [] }
];

function uploadRequest(size: number, overrides: Partial<IUploadRequest> = {}): IUploadRequest {
  const progress: IUploadProgress[] = [];
  return {
    webAbsoluteUrl: "https://contoso.sharepoint.com/sites/hr",
    folderServerRelativeUrl: "/sites/hr/Shared Documents",
    fileName: "policy.pdf",
    file: new FakeBytes(size),
    overwrite: true,
    chunkSizeBytes: DEFAULT_CHUNK_SIZE_BYTES,
    directThresholdBytes: DIRECT_UPLOAD_MAX_BYTES,
    uploadId: "11111111-1111-4111-8111-111111111111",
    onProgress: (update): void => {
      progress.push(update);
    },
    isCancelled: (): boolean => false,
    ...overrides
  };
}

function savedProgress(request: IUploadRequest): IUploadProgress[] {
  const seen: IUploadProgress[] = [];
  const original = request.onProgress;
  request.onProgress = (update): void => {
    seen.push(update);
    original(update);
  };
  return seen;
}

describe("document upload", () => {
  it("posts a file of 10 MB or less in one direct request", async () => {
    const client = new FakeClient(() => jsonResponse(200, {}));
    const request = uploadRequest(10 * BYTES_PER_MB);
    const progress = savedProgress(request);
    await uploadDocument(client, request);

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].url).toContain("/Files/add(overwrite=true,url='policy.pdf')");
    expect(client.calls[0].url).not.toContain("StartUpload");
    expect(client.calls[0].body).toBe(request.file);
    expect(progress[progress.length - 1].percent).toBe(100);
    expect(progress[progress.length - 1].mode).toBe("direct");
    expect(progress.map((item) => item.stage)).toEqual(["direct", "direct"]);
  });

  it("uploads a 50 MB file with StartUpload, ContinueUpload, and FinishUpload", async () => {
    const client = new FakeClient((call) => {
      if (call.url.indexOf("StartUpload") >= 0 || call.url.indexOf("ContinueUpload") >= 0) {
        const match = /fileOffset=(\d+)/.exec(call.url);
        const offset = match ? Number(match[1]) + DEFAULT_CHUNK_SIZE_BYTES : DEFAULT_CHUNK_SIZE_BYTES;
        return textResponse(200, String(offset));
      }
      return jsonResponse(200, {});
    });
    const request = uploadRequest(50 * BYTES_PER_MB);
    const progress = savedProgress(request);
    await uploadDocument(client, request);

    const urls = client.calls.map((call) => call.url);
    expect(urls[0]).toContain("/Files/add(overwrite=true,url='policy.pdf')");
    expect(client.calls[0].body).toBeUndefined();
    expect(urls[1]).toContain("StartUpload(uploadId=guid'11111111-1111-4111-8111-111111111111')");
    expect(urls.filter((url) => url.indexOf("ContinueUpload") >= 0)).toHaveLength(3);
    expect(urls[2]).toContain("fileOffset=10485760");
    expect(urls[3]).toContain("fileOffset=20971520");
    expect(urls[4]).toContain("fileOffset=31457280");
    expect(urls[5]).toContain("FinishUpload(uploadId=guid'11111111-1111-4111-8111-111111111111',fileOffset=41943040)");
    expect(urls.some((url) => url.indexOf("CancelUpload") >= 0)).toBe(false);

    expect(progress.map((item) => item.stage)).toEqual(["start", "continue", "continue", "continue", "finish"]);
    expect(progress.map((item) => item.percent)).toEqual([20, 40, 60, 80, 100]);
    expect(progress[progress.length - 1].loadedBytes).toBe(50 * BYTES_PER_MB);
    expect(progress.every((item) => item.mode === "chunked")).toBe(true);
    expect(progress[1].chunkIndex).toBe(1);
    expect(progress[1].chunkCount).toBe(5);
  });

  it("routes a file just over 10 MB through StartUpload and FinishUpload", async () => {
    const client = new FakeClient(() => textResponse(200, String(DEFAULT_CHUNK_SIZE_BYTES)));
    await uploadDocument(client, uploadRequest(DIRECT_UPLOAD_MAX_BYTES + 1));
    const urls = client.calls.map((call) => call.url);
    expect(urls.some((url) => url.indexOf("StartUpload") >= 0)).toBe(true);
    expect(urls.some((url) => url.indexOf("FinishUpload") >= 0)).toBe(true);
    expect(urls.some((url) => url.indexOf("ContinueUpload") >= 0)).toBe(false);
  });

  it("cancels the upload session when a later chunk fails or the person cancels", async () => {
    const failing = new FakeClient((call) => {
      if (call.url.indexOf("ContinueUpload") >= 0) {
        return jsonResponse(500, { error: { message: "The chunk was rejected." } });
      }
      return textResponse(200, String(4));
    });
    await expect(uploadDocument(failing, uploadRequest(12, {
      chunkSizeBytes: 4,
      directThresholdBytes: 4
    }))).rejects.toThrow("The chunk was rejected.");
    expect(failing.calls[failing.calls.length - 1].url).toContain("CancelUpload(uploadId=guid'11111111-1111-4111-8111-111111111111')");

    let chunks = 0;
    const cancelled = new FakeClient(() => textResponse(200, "4"));
    await expect(uploadDocument(cancelled, uploadRequest(12, {
      chunkSizeBytes: 4,
      directThresholdBytes: 4,
      onProgress: (): void => {
        chunks += 1;
      },
      isCancelled: (): boolean => chunks > 0
    }))).rejects.toThrow("Upload cancelled.");
    expect(cancelled.calls.some((call) => call.url.indexOf("CancelUpload") >= 0)).toBe(true);
  });
});

describe("submitDocument", () => {
  function happyClient(metadataBody: unknown): FakeClient {
    return new FakeClient((call) => {
      if (call.url.indexOf("ListItemAllFields") >= 0) {
        return jsonResponse(200, { Id: 42, FileRef: "/sites/hr/Shared Documents/policy.pdf" });
      }
      if (call.url.indexOf("ValidateUpdateListItem") >= 0) {
        return jsonResponse(200, metadataBody);
      }
      return jsonResponse(200, {});
    });
  }

  function request(overrides: Partial<ISubmitDocumentRequest> = {}): ISubmitDocumentRequest {
    return {
      ...uploadRequest(2048),
      libraryTitle: "Documents",
      fields,
      values: { Title: "FY26 Policy", Department: "Legal", Notes: "Ready" },
      maxFileSizeMb: 50,
      allowedExtensions: [".pdf"],
      ...overrides
    };
  }

  it("writes metadata with ValidateUpdateListItem after the file is uploaded", async () => {
    const client = happyClient({ value: [{ FieldName: "Title", HasException: false }] });
    const result = await submitDocument(client, request());
    const update = client.calls.find((call) => call.url.indexOf("ValidateUpdateListItem") >= 0);
    expect(update).toBeDefined();
    expect(update && update.url).toContain("/lists/getByTitle('Documents')/items(42)/ValidateUpdateListItem");
    const body = JSON.parse(String(update && update.body));
    expect(body.bNewDocumentUpdate).toBe(true);
    expect(body.formValues).toEqual([
      { FieldName: "Title", FieldValue: "FY26 Policy" },
      { FieldName: "Department", FieldValue: "Legal" },
      { FieldName: "Notes", FieldValue: "Ready" }
    ]);
    expect(result.fileUrl).toBe("https://contoso.sharepoint.com/sites/hr/Shared%20Documents/policy.pdf");
    expect(result.metadata.map((item) => item.value)).toEqual(["FY26 Policy", "Legal", "Ready"]);
    expect(result.demo).toBe(false);
  });

  it("does not call SharePoint when required metadata is missing", async () => {
    const client = happyClient({});
    await expect(submitDocument(client, request({ values: { Title: "", Department: "", Notes: "" } }))).rejects.toThrow(
      "Document Title is required."
    );
    expect(client.calls).toHaveLength(0);
  });

  it("reports a metadata failure after the file itself was uploaded", async () => {
    const client = happyClient({
      value: [{ FieldName: "Department", HasException: true, ErrorMessage: "Legal is not an available choice." }]
    });
    const error = await submitDocument(client, request()).then(
      () => undefined,
      (caught: unknown) => caught
    );
    expect(error).toBeInstanceOf(MetadataUpdateError);
    expect(error instanceof Error ? error.message : "").toContain("metadata was not saved");
    expect(error instanceof MetadataUpdateError ? error.fileUrl : "").toContain("policy.pdf");
    expect(client.calls.some((call) => call.url.indexOf("/Files/add(") >= 0)).toBe(true);
    expect(client.calls.some((call) => call.url.indexOf("CancelUpload") >= 0)).toBe(false);
  });

  it("loads editable columns and treats a missing library as unavailable", async () => {
    const client = new FakeClient((call) => {
      if (call.url.indexOf("/fields?") >= 0) {
        return jsonResponse(200, {
          value: [
            { InternalName: "FileLeafRef", Title: "Name", TypeAsString: "File", Required: true },
            { InternalName: "Title", Title: "Document Title", TypeAsString: "Text", Required: true },
            { InternalName: "Notes", Title: "Notes", TypeAsString: "Note", Required: false }
          ]
        });
      }
      return jsonResponse(200, {
        Id: "list",
        Title: "Policies",
        BaseTemplate: 101,
        RootFolder: { ServerRelativeUrl: "/sites/hr/Policies" }
      });
    });
    const library = await loadLibrary(client, "https://contoso.sharepoint.com/sites/hr", "Policies");
    expect(client.calls[1].url).toContain("$filter=Hidden eq false and ReadOnlyField eq false");
    expect(library.folderServerRelativeUrl).toBe("/sites/hr/Policies");
    expect(library.fields.map((field) => field.internalName)).toEqual(["Title", "Notes"]);
    expect(library.fields[0].required).toBe(true);
    expect(library.fields[1].required).toBe(false);

    const missing = new FakeClient(() => jsonResponse(404, { error: { message: "List not found." } }));
    await expect(loadLibrary(missing, "https://contoso.sharepoint.com/sites/hr", "Missing")).rejects.toBeInstanceOf(LibraryUnavailableError);
  });

  it("uses the sample library columns in demo mode", () => {
    const groups = demoFields();
    expect(groups.map((field) => field.type)).toEqual(["Text", "Note", "Choice"]);
    expect(groups.some((field) => field.type === "User")).toBe(false);
    expect(groups.filter((field) => field.required).map((field) => field.title)).toEqual([
      "Document Title",
      "Department"
    ]);
    expect(groups.filter((field) => !field.required).map((field) => field.title)).toEqual([
      "Description"
    ]);
  });
});
