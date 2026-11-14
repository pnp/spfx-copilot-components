import { BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES, type IUploadProgress } from "../models";
import { demoFields } from "../logic/demoLibrary";
import { runDemoUpload } from "./demoUpload";
import type { IByteSource } from "./types";

class FakeBytes implements IByteSource {
  public constructor(public readonly size: number) {
  }

  public slice(): IByteSource {
    return this;
  }
}

describe("demo upload", () => {
  it("reports chunk progress for a file over 10 MB without calling SharePoint", async () => {
    const progress: IUploadProgress[] = [];
    const result = await runDemoUpload({
      webAbsoluteUrl: "https://contoso.sharepoint.com/sites/demo",
      libraryTitle: "Documents",
      folderServerRelativeUrl: "/sites/demo/Shared Documents",
      fileName: "handbook.pdf",
      file: new FakeBytes(25 * BYTES_PER_MB),
      fields: demoFields(),
      values: {
        Title: "Handbook",
        Department: "Legal",
        DocumentCategory: "Policy",
        EffectiveDate: "2026-11-01",
        Confidential: false,
        Notes: ""
      },
      maxFileSizeMb: 50,
      allowedExtensions: [".pdf"],
      chunkSizeBytes: DEFAULT_CHUNK_SIZE_BYTES,
      directThresholdBytes: DIRECT_UPLOAD_MAX_BYTES,
      delayMs: 0,
      onProgress: (update): void => {
        progress.push(update);
      },
      isCancelled: (): boolean => false
    });

    expect(progress.map((item) => item.stage)).toEqual(["start", "continue", "finish"]);
    expect(progress[progress.length - 1].percent).toBe(100);
    expect(progress[progress.length - 1].loadedBytes).toBe(25 * BYTES_PER_MB);
    expect(result.demo).toBe(true);
    expect(result.fileName).toBe("handbook.pdf");
    expect(result.metadata.find((item) => item.title === "Document Title")?.value).toBe("Handbook");
    expect(result.metadata.find((item) => item.title === "Department")?.value).toBe("Legal");
  });
});
