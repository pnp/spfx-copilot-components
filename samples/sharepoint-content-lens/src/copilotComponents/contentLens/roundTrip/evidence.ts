import type { CategoryId } from './checks';
import type { AnalysisSource, ReviewFinding, SourceReviewDecision } from './contracts';

/** Collapses whitespace and trims. Sources must already be plain text; whoever reads them converts HTML. */
export function normalizeEvidence(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * One decision per source. A source is reviewed only when exactly one decision names it and that decision says
 * reviewed; a missing or duplicate decision makes it not reviewed.
 */
export function completeDecisions(sources: AnalysisSource[], decisions: SourceReviewDecision[]): SourceReviewDecision[] {
  return sources.map(source => {
    const matches = decisions.filter(decision => decision.sourceId === source.id && decision.chunkId === source.chunkId);
    const reviewed = matches.length === 1 && matches[0].status === 'reviewed';
    return { sourceId: source.id, chunkId: source.chunkId, status: reviewed ? 'reviewed' : 'notReviewed' };
  });
}

/** A finding is accepted only when its excerpt is really in the saved text of its source. */
export function isFindingValid(finding: ReviewFinding, sources: AnalysisSource[], categories: CategoryId[]): boolean {
  const source = sources.find(item => item.id === finding.sourceId && item.chunkId === finding.chunkId);
  const excerpt = normalizeEvidence(finding.excerpt);
  if (!source || categories.indexOf(finding.categoryId) < 0 || !excerpt.length) return false;
  // A finding that says where it starts must be exactly that slice of its source.
  if (finding.offset !== undefined) {
    return source.text.slice(finding.offset, finding.offset + finding.excerpt.length) === finding.excerpt;
  }
  return normalizeEvidence(source.text).indexOf(excerpt) >= 0;
}

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}
