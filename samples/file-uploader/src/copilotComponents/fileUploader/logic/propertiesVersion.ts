import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';

/**
 * Deterministic signature of the normalised prompt (AGENTS.md §3 State). The
 * component increments its properties-version token only when this string
 * changes, so a passive re-render (theme flip, resize) never resets a user's
 * in-progress edits, while a genuinely new prompt starts a fresh draft.
 */
export function promptSignature(props: IFileUploaderCopilotComponentProperties): string {
  const keys: string[] = Object.keys(props).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v: unknown = (props as Record<string, unknown>)[k];
    if (v === undefined || v === null || v === '') {
      continue;
    }
    parts.push(k + '=' + String(v));
  }
  return parts.join('&');
}

/** Tracks the token; `next()` returns the current version, bumping it only on a changed signature. */
export class PropertiesVersion {
  private _signature: string | undefined;
  private _version: number = 0;

  public get version(): number {
    return this._version;
  }

  public next(props: IFileUploaderCopilotComponentProperties): { version: number; changed: boolean } {
    const sig: string = promptSignature(props);
    if (this._signature === undefined) {
      this._signature = sig;
      this._version = 1;
      return { version: 1, changed: true };
    }
    if (sig !== this._signature) {
      this._signature = sig;
      this._version += 1;
      return { version: this._version, changed: true };
    }
    return { version: this._version, changed: false };
  }
}
