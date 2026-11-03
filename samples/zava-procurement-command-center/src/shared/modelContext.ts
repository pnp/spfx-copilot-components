import { createCopilotTextContent, type ISPCopilotModelContext } from '@microsoft/sp-copilot-component';
import type { IProcurementProperties, ProcurementIntentKey, ProcurementLens } from './catalog';
import { INVOCATION_DATE } from './domain';

export interface IProcurementSnapshot extends Record<string, unknown> {
  readonly intent: ProcurementIntentKey;
  readonly route: string;
  readonly stage: string;
  readonly selectedId: string;
  readonly summary: string;
  readonly selectedLabel?: string;
  readonly scope?: IProcurementProperties;
  readonly filters?: Readonly<Record<string, string | number>>;
  readonly visuals?: readonly string[];
  readonly visibleRecords?: readonly Readonly<Record<string, unknown>>[];
  readonly resultCount?: number;
  readonly workspace?: ProcurementLens;
  readonly displayMode?: 'inline' | 'fullscreen';
  readonly availableActions?: readonly string[];
  readonly discussion?: {
    readonly topic: string;
    readonly responseMode: 'text' | 'component';
    readonly handoff?: { readonly tool: string; readonly properties: IProcurementProperties };
  };
}

export const MAX_CONTEXT_BYTES = 10000;
export const modelContextBytes = (context: ISPCopilotModelContext): number => new Blob([JSON.stringify(context)]).size;
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => value !== null && typeof value === 'object' && !Array.isArray(value);

export function createModelContext(snapshot: IProcurementSnapshot): ISPCopilotModelContext {
  const wrap = (state: Readonly<Record<string, unknown>>, summary: string): ISPCopilotModelContext => ({
    content: [createCopilotTextContent(summary)],
    structuredContent: { ...state, provenance: { source: 'Deterministic offline procurement records and session overlay', evidenceDate: INVOCATION_DATE, externalWrites: false } }
  });
  const original = wrap(snapshot, snapshot.summary);
  const originalBytes = modelContextBytes(original);
  if (originalBytes <= MAX_CONTEXT_BYTES) return original;

  const essential = new Set(['intent', 'route', 'stage', 'selectedId', 'selectedLabel', 'scope', 'workspace', 'displayMode', 'discussion', 'availableActions']);
  for (const [items, characters] of [[12, 1000], [6, 500], [3, 200], [1, 80]]) {
    const omittedPaths: string[] = [];
    const compact = (value: unknown, path: string, depth: number): unknown => {
      if (typeof value === 'string') {
        const points = Array.from(value);
        if (points.length <= characters) return value;
        omittedPaths.push(path);
        return `${points.slice(0, characters).join('')} [omitted remainder]`;
      }
      if (Array.isArray(value)) {
        if (value.length > items) omittedPaths.push(`${path}[${items}..${value.length - 1}]`);
        return value.slice(0, items).map((item, index) => compact(item, `${path}[${index}]`, depth + 1));
      }
      if (isRecord(value)) {
        if (depth > 5) { omittedPaths.push(path); return '[nested evidence omitted]'; }
        const result: Record<string, unknown> = {};
        Object.keys(value).forEach(key => { result[key] = compact(value[key], `${path}.${key}`, depth + 1); });
        return result;
      }
      return value;
    };
    const bounded: Record<string, unknown> = {};
    Object.keys(snapshot).forEach(key => { bounded[key] = essential.has(key) ? snapshot[key] : compact(snapshot[key], key, 0); });
    bounded.contextBudget = {
      limitBytes: MAX_CONTEXT_BYTES, originalBytes, originalVisibleRecordCount: snapshot.visibleRecords?.length || 0,
      omittedPaths: omittedPaths.slice(0, 20), omittedPathCount: omittedPaths.length,
      semantics: 'Partial evidence. Omitted values remain unknown; narrow the view for more detail.'
    };
    const summary = typeof bounded.summary === 'string' ? bounded.summary : snapshot.summary;
    const payload = wrap(bounded, summary);
    if (modelContextBytes(payload) <= MAX_CONTEXT_BYTES) return payload;
  }
  throw new Error('Visible context exceeds the 10,000-byte Copilot limit. Narrow the selection or shorten the question before retrying.');
}
