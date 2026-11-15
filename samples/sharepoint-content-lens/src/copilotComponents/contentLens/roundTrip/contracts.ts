import type { CategoryId } from './checks';

/** What the exchange needs of a source: an identity, its text and optional context. Your own source type extends it. */
export interface AnalysisSource {
  id: string;
  chunkId: string;
  text: string;
  contextText?: string;
}

export interface ReviewFinding {
  id: string;
  sourceId: string;
  chunkId: string;
  categoryId: CategoryId;
  excerpt: string;
  explanation: string;
  needsContext: boolean;
  /** Where the excerpt starts in its source's text, from the passages Copilot cited. */
  offset?: number;
}

export interface SourceReviewDecision {
  sourceId: string;
  chunkId: string;
  status: 'reviewed' | 'notReviewed';
}

export interface AnalysisResult {
  findings: ReviewFinding[];
  decisions: SourceReviewDecision[];
  provenance: 'fixture' | 'copilotChat';
  /** Some source text or context did not fit this review's bounded input. Such a result is incomplete, even without findings. */
  inputLimited?: boolean;
  /** The request this answer belongs to; not kept with the review. */
  requestId?: string;
}

export interface IAnalysisClient<TSource extends AnalysisSource = AnalysisSource> {
  /** `rules` are the texts of the rule IDs in `categories`, in order. */
  analyze(sources: TSource[], categories: CategoryId[], rules: string[], signal?: AbortSignal): Promise<AnalysisResult>;
}
