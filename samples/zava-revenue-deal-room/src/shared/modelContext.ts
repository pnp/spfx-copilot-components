import { createCopilotTextContent, type ISPCopilotModelContext } from '@microsoft/sp-copilot-component';
import { isContextRecord } from './copilot';
import type { IModelContextSnapshot } from './RevenueApp';

export const MAX_CONTEXT_BYTES = 10000;
export const modelContextBytes = (context: ISPCopilotModelContext): number => new Blob([JSON.stringify(context)]).size;

export function createModelContext(snapshot: IModelContextSnapshot): ISPCopilotModelContext {
  const wrap = (state: Readonly<Record<string, unknown>>, summary: string): ISPCopilotModelContext => ({
    content: [createCopilotTextContent(summary)], structuredContent: state
  });
  const original = wrap(snapshot, snapshot.summary);
  const originalBytes = modelContextBytes(original);
  if (originalBytes <= MAX_CONTEXT_BYTES) return original;

  for (const [items, characters] of [[30, 2000], [15, 1000], [8, 500], [3, 200], [1, 80]]) {
    const omittedPaths: string[] = [];
    const compact = (value: unknown, path: string, depth: number): unknown => {
      if (typeof value === 'string') {
        const points = Array.from(value);
        if (points.length <= characters) return value;
        omittedPaths.push(path);
        return `${points.slice(0, characters).join('')} [truncated]`;
      }
      if (Array.isArray(value)) {
        if (value.length > items) omittedPaths.push(`${path}[${items}..${value.length - 1}]`);
        return value.slice(0, items).map((item, index) => compact(item, `${path}[${index}]`, depth + 1));
      }
      if (isContextRecord(value)) {
        if (depth > 6) {
          omittedPaths.push(path);
          return '[nested context omitted]';
        }
        const result: Record<string, unknown> = {};
        Object.keys(value).forEach(key => { result[key] = compact(value[key], `${path}.${key}`, depth + 1); });
        return result;
      }
      return value;
    };
    const bounded: Record<string, unknown> = {};
    Object.keys(snapshot).forEach(key => { bounded[key] = compact(snapshot[key], key, 0); });
    bounded.contextBudget = {
      limitBytes: MAX_CONTEXT_BYTES, originalBytes, omittedPaths: omittedPaths.slice(0, 20),
      omittedPathCount: omittedPaths.length,
      semantics: 'Partial context. Selected detail is separate from sampled visible records; do not infer omitted evidence.'
    };
    const summary = typeof bounded.summary === 'string' ? bounded.summary : snapshot.summary;
    const payload = wrap(bounded, summary);
    if (modelContextBytes(payload) <= MAX_CONTEXT_BYTES) return payload;
  }
  throw new Error('Visible context cannot fit within the 10,000-byte Copilot limit. Narrow the view before retrying.');
}
