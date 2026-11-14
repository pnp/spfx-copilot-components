import { BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES } from "../models";
import { planUpload, uploadPercent } from "./uploadPlan";

describe("upload plan", () => {
  it("uses one direct upload at and under 10 MB", () => {
    const ten = planUpload(10 * BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES);
    expect(ten.mode).toBe("direct");
    expect(ten.chunks).toEqual([{ index: 0, start: 0, end: 10 * BYTES_PER_MB, stage: "direct" }]);

    const small = planUpload(1024, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES);
    expect(small.mode).toBe("direct");
    expect(small.chunks[0].stage).toBe("direct");
  });

  it("splits a file between 10 MB and 50 MB into Start, Continue, and Finish chunks", () => {
    const justOver = planUpload(DIRECT_UPLOAD_MAX_BYTES + 1, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES);
    expect(justOver.mode).toBe("chunked");
    expect(justOver.chunks.map((chunk) => chunk.stage)).toEqual(["start", "finish"]);

    const middle = planUpload(25 * BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES);
    expect(middle.chunks.map((chunk) => chunk.stage)).toEqual(["start", "continue", "finish"]);
    expect(middle.chunks[1].start).toBe(10 * BYTES_PER_MB);
    expect(middle.chunks[1].end).toBe(20 * BYTES_PER_MB);

    const fifty = planUpload(50 * BYTES_PER_MB, DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES);
    expect(fifty.mode).toBe("chunked");
    expect(fifty.chunks).toHaveLength(5);
    expect(fifty.chunks[0].stage).toBe("start");
    expect(fifty.chunks[1].stage).toBe("continue");
    expect(fifty.chunks[4].stage).toBe("finish");
    expect(fifty.chunks[4].end).toBe(50 * BYTES_PER_MB);
  });

  it("reports percent from bytes sent", () => {
    expect(uploadPercent(0, 200)).toBe(0);
    expect(uploadPercent(50, 200)).toBe(25);
    expect(uploadPercent(200, 200)).toBe(100);
  });
});
