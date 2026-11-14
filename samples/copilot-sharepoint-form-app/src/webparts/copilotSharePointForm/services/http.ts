import type { IByteSource } from "./types";

export interface IHttpResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export interface IHttpClient {
  get(url: string): Promise<IHttpResponse>;
  post(url: string, body: IByteSource | string | undefined, headers: { [name: string]: string }): Promise<IHttpResponse>;
}

export const JSON_HEADERS: { [name: string]: string } = {
  Accept: "application/json;odata=nometadata",
  "Content-Type": "application/json;odata=nometadata",
  "odata-version": ""
};

export const BINARY_HEADERS: { [name: string]: string } = {
  Accept: "application/json;odata=nometadata",
  "Content-Type": "application/octet-stream",
  "odata-version": ""
};

export async function readErrorMessage(response: IHttpResponse, fallback: string): Promise<string> {
  let text = "";
  try {
    text = (await response.text()).trim();
  } catch {
    return fallback;
  }
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    const message = readErrorValue(parsed);
    return message || fallback;
  } catch {
    return text.length > 280 ? fallback : text;
  }
}

export async function readUploadOffset(response: IHttpResponse, fallback: number): Promise<number> {
  let text = "";
  try {
    text = (await response.text()).trim();
  } catch {
    return fallback;
  }
  if (!text) {
    return fallback;
  }
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    const numeric = findOffset(parsed);
    return numeric === undefined ? fallback : numeric;
  } catch {
    return fallback;
  }
}

export function parseJson(text: string): unknown {
  if (!text.trim()) {
    return undefined;
  }
  return JSON.parse(text) as unknown;
}

function readErrorValue(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as { [key: string]: unknown };
  const error = record.error || record["odata.error"];
  if (typeof error === "string") {
    return error;
  }
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const message = (error as { [key: string]: unknown }).message;
  if (typeof message === "string") {
    return message;
  }
  if (message && typeof message === "object") {
    const value = (message as { [key: string]: unknown }).value;
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

function findOffset(payload: unknown): number | undefined {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return payload;
  }
  if (typeof payload === "string" && /^-?\d+(\.\d+)?$/.test(payload)) {
    return Number(payload);
  }
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as { [key: string]: unknown };
  if (record.value !== undefined) {
    const fromValue = findOffset(record.value);
    if (fromValue !== undefined) {
      return fromValue;
    }
  }
  const data = record.d;
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const inner = data as { [key: string]: unknown };
  const named = inner.StartUpload || inner.ContinueUpload || inner.FinishUpload;
  if (named !== undefined) {
    return findOffset(named);
  }
  return undefined;
}
