import type { AnalysisResult, ReviewFinding } from './contracts';

function sourceKey(item: { sourceId: string; chunkId: string }): string {
  return JSON.stringify([item.sourceId, item.chunkId]);
}

/** An ID derived from the finding's evidence. */
function findingId(finding: ReviewFinding): string {
  const offset = finding.offset === undefined ? null : finding.offset;
  return JSON.stringify([finding.sourceId, finding.chunkId, finding.categoryId, finding.excerpt, offset]);
}

/**
 * Adds the answer of a further request to a review. For every source that `next` decides, its decision and findings
 * replace the earlier ones. Each finding gets an ID derived from its evidence, because the IDs of one answer
 * (analysis:0, ...) repeat in the next.
 */
export function mergeReviewResults(previous: AnalysisResult | undefined, next: AnalysisResult): AnalysisResult {
  const decisions = new Map((previous?.decisions || []).map(decision => [sourceKey(decision), decision]));
  next.decisions.forEach(decision => decisions.set(sourceKey(decision), decision));
  const replaced = new Set(next.decisions.map(sourceKey));
  const kept = (previous?.findings || []).filter(finding => !replaced.has(sourceKey(finding)));
  const findings = [...kept, ...next.findings].map(finding => ({ ...finding, id: findingId(finding) }));
  return {
    findings,
    decisions: Array.from(decisions.values()),
    provenance: next.provenance,
    inputLimited: !!previous?.inputLimited || !!next.inputLimited
  };
}
