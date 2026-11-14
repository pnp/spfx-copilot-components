import { BYTES_PER_MB } from "../models";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${Math.floor(bytes)} B`;
  }
  if (bytes < BYTES_PER_MB) {
    return `${trimNumber(bytes / 1024)} KB`;
  }
  return `${trimNumber(bytes / BYTES_PER_MB)} MB`;
}

export function formatByteCount(bytes: number): string {
  const whole = Math.max(0, Math.floor(bytes));
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trimNumber(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
}
