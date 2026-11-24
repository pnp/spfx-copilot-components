import { isRuleId, type CategoryId } from './checks';
import type { AnalysisSource, ReviewFinding, SourceReviewDecision } from './contracts';
import { utf8Bytes } from './evidence';
import { evidencePassages } from './passages';

/** One slice of a source as it travels in a request; `original` is the source it came from. */
export interface Segment<TSource extends AnalysisSource = AnalysisSource> {
  source: TSource;
  original: TSource;
  contextOmitted: boolean;
}

export interface BatchResult {
  findings: ReviewFinding[];
  decisions: SourceReviewDecision[];
  invalid: boolean;
}

export function analysisKey(source: Pick<AnalysisSource, 'id' | 'chunkId'>): string {
  return JSON.stringify([source.id, source.chunkId]);
}

export function throwIfAnalysisCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
}

export function analysisInput(segment: Segment): object {
  return {
    sourceId: segment.source.id,
    chunkId: segment.source.chunkId,
    passages: evidencePassages(segment.source.text),
    context: segment.source.contextText || '',
    contextOmitted: segment.contextOmitted
  };
}

function inputBytes(segments: Segment[]): number {
  return utf8Bytes(JSON.stringify(segments.map(analysisInput)));
}

/** Segments per request. Together with the length of the review field it bounds one answer. */
export const maxSegmentsPerRequest = 8;
/** Length limit of the `review` field of an answer (answerSchema.ts). */
export const reviewChars = 176;
/** Places a rule flag may cite; see flagPattern in checks. */
export const maxRulePlaces = 4;

/**
 * Worst-case length of one review row, e.g. `s3:r:i?@12-14,v?@12-14.20.31.45;`: every selected check flagged,
 * uncertain and citing a passage range, and every rule citing three more places. Packing by this bound keeps
 * any valid answer inside the field.
 */
export function reviewRowChars(position: number, passages: number, categories: CategoryId[]): number {
  const single = String(passages).length;
  const reference = passages > 1 ? 2 * single + 1 : single;
  // A flag is its code, "?" and "@", then its places.
  const flag = (category: CategoryId): number => 3 + reference + (isRuleId(category) ? (maxRulePlaces - 1) * (single + 1) : 0);
  const prefix = ('s' + position + ':r:').length;
  const flags = categories.reduce((total, category) => total + flag(category), 0);
  const commas = Math.max(0, categories.length - 1);
  // The final 1 is the ";" that ends the row.
  return prefix + flags + commas + 1;
}

/**
 * Cuts the sources into segments and groups the segments into batches, one batch per request. Sizes are measured
 * on the serialized input in UTF-8 bytes. A segment starts a new batch when adding it would exceed
 * maxSegmentsPerRequest, the review field (by worst-case row length) or `inputMaxBytes`.
 * Each segment keeps its `original` source, so results map back to the IDs the UI shows. `limitedKeys` names the
 * sources that cannot be reviewed completely: text cut, context omitted, no text, or past the first 30 sources.
 */
export function prepareAnalysis<TSource extends AnalysisSource>(
  sources: TSource[],
  categories: CategoryId[],
  inputMaxBytes: number = 8192
): { batches: Segment<TSource>[][]; limitedKeys: Set<string> } {
  if (!Number.isInteger(inputMaxBytes) || inputMaxBytes < 256 || inputMaxBytes > 8192) {
    throw new Error('INVALID_ANALYSIS_INPUT_BUDGET');
  }
  const segmentMaxBytes = Math.min(7900, inputMaxBytes);
  const segments: Segment<TSource>[] = [];
  const limitedKeys = new Set<string>();
  for (const original of sources.slice(0, 30)) {
    const contextOmitted = utf8Bytes(original.contextText || '') > 1024;
    if (contextOmitted) limitedKeys.add(analysisKey(original));
    let rest = original.text;
    let index = 0;
    while (rest && index < 5) {
      const segment: Segment<TSource> = {
        original,
        contextOmitted,
        source: {
          ...original,
          chunkId: `${original.chunkId}:part:${index + 1}`,
          contextText: contextOmitted ? undefined : original.contextText,
          text: ''
        } as TSource
      };
      // Binary search for the longest prefix, in code points, whose serialized input fits and has at most 99 passages.
      // The measure includes passage IDs and escaped context.
      const codePoints = Array.from(rest);
      let low = 0;
      let high = Math.min(codePoints.length, segmentMaxBytes);
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        segment.source.text = codePoints.slice(0, middle).join('');
        if (inputBytes([segment]) <= segmentMaxBytes && evidencePassages(segment.source.text).length <= 99) low = middle;
        else high = middle - 1;
      }
      if (!low) break;
      segment.source.text = codePoints.slice(0, low).join('');
      segments.push(segment);
      rest = rest.slice(segment.source.text.length);
      index++;
    }
    if (rest || !original.text.trim()) limitedKeys.add(analysisKey(original));
  }
  sources.slice(30).forEach(source => limitedKeys.add(analysisKey(source)));
  const batches: Segment<TSource>[][] = [];
  let batchReviewChars = 0;
  for (const segment of segments) {
    const batch = batches[batches.length - 1];
    const passages = evidencePassages(segment.source.text).length;
    const row = batch ? reviewRowChars(batch.length + 1, passages, categories) : 0;
    if (
      !batch ||
      batch.length >= maxSegmentsPerRequest ||
      batchReviewChars + row > reviewChars ||
      inputBytes([...batch, segment]) > inputMaxBytes
    ) {
      batches.push([segment]);
      batchReviewChars = reviewRowChars(1, passages, categories);
    } else {
      batch.push(segment);
      batchReviewChars += row;
    }
  }
  return { batches, limitedKeys };
}

/**
 * The sources the next request reviews completely: every segment falls into the first batch.
 * Sources without reviewable text are included so they get a decision instead of staying pending.
 * A source too long for one request is still sent alone; its remainder stays not reviewed.
 */
export function nextRequestSources<TSource extends AnalysisSource>(sources: TSource[], categories: CategoryId[]): TSource[] {
  const { batches } = prepareAnalysis(sources, categories);
  const segments = ([] as Segment<TSource>[]).concat(...batches);
  const firstBatch = new Set(batches[0] || []);
  const selected = sources.filter(source => {
    const parts = segments.filter(part => analysisKey(part.original) === analysisKey(source));
    return parts.every(part => firstBatch.has(part));
  });
  return selected.length ? selected : sources.slice(0, 1);
}
