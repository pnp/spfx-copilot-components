import type { IUiStrings } from './types';
import de from './de';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

// Swiss Standard German: the German table with Swiss spelling (no ß, guillemets «…»).
function swiss<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/ß/g, 'ss').replace(/„/g, '«').replace(/“/g, '»') as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(value as object).forEach((key: string) => {
      out[key] = swiss((value as Record<string, unknown>)[key]);
    });
    return out as T;
  }
  return value;
}

const strings: IUiStrings = { ...swiss(de), languageName: 'Schweizer Hochdeutsch' };

export default strings;
