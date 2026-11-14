import { DEFAULT_CHUNK_SIZE_BYTES, DIRECT_UPLOAD_MAX_BYTES, type UploadStage } from "../models";

export interface IPlannedChunk {
  index: number;
  start: number;
  end: number;
  stage: UploadStage;
}

export interface IUploadPlan {
  mode: "direct" | "chunked";
  chunks: IPlannedChunk[];
}

export function planUpload(
  fileSize: number,
  chunkSizeBytes: number = DEFAULT_CHUNK_SIZE_BYTES,
  directThresholdBytes: number = DIRECT_UPLOAD_MAX_BYTES
): IUploadPlan {
  const size = Math.max(0, Math.floor(fileSize));
  if (size <= directThresholdBytes) {
    return {
      mode: "direct",
      chunks: [{ index: 0, start: 0, end: size, stage: "direct" }]
    };
  }

  const chunkSize = chunkSizeBytes > 0 ? Math.floor(chunkSizeBytes) : directThresholdBytes;
  const chunks: IPlannedChunk[] = [];
  let start = 0;
  while (start < size) {
    const end = Math.min(size, start + chunkSize);
    chunks.push({
      index: chunks.length,
      start,
      end,
      stage: "continue"
    });
    start = end;
  }

  if (chunks.length <= 1) {
    return {
      mode: "direct",
      chunks: [{ index: 0, start: 0, end: size, stage: "direct" }]
    };
  }

  chunks[0].stage = "start";
  chunks[chunks.length - 1].stage = "finish";
  return { mode: "chunked", chunks };
}

export function uploadPercent(loadedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) {
    return 100;
  }
  const raw = Math.round((loadedBytes / totalBytes) * 100);
  if (raw < 0) {
    return 0;
  }
  if (raw > 100) {
    return 100;
  }
  return raw;
}
