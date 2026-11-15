import { z } from 'zod';
import { categoryIds, maxRuleChars, maxRules, rulesMatchCategories } from '../domain/contracts';
import { scanRequestSchema, sourceSchema } from '../domain/sourceSchema';
import { isFindingValid, pagePartsValid } from '../domain/policy';
import { analysisKey } from './analysis';
import { checkGroups } from '../domain/checkCatalog';

const resultSchema = z.object({
  findings: z.array(z.object({
    id: z.string().max(16384), sourceId: z.string().max(2048), chunkId: z.string().max(2048),
    categoryId: z.enum(categoryIds), excerpt: z.string().min(1).max(8192), explanation: z.string().max(400), needsContext: z.boolean(),
    offset: z.number().int().min(0).max(1e6).optional()
  }).strict()).max(1049 * categoryIds.length),
  decisions: z.array(z.object({
    sourceId: z.string().max(2048), chunkId: z.string().max(2048), status: z.enum(['reviewed', 'notReviewed'])
  }).strict()).max(1049),
  provenance: z.enum(['fixture', 'copilotChat']),
  inputLimited: z.boolean().optional()
}).strict();
const reviewSchema = z.object({
  version: z.literal(3),
  request: scanRequestSchema,
  siteTitle: z.string().max(1024),
  sources: z.array(sourceSchema).max(1049),
  categories: z.array(z.enum(categoryIds)).max(categoryIds.length),
  rules: z.array(z.string().min(1).max(maxRuleChars)).max(maxRules),
  // Authorization from the initial Page review click, carried only with an in-flight request.
  autoContinuePage: z.literal(true).optional(),
  analysis: resultSchema.optional(),
  scan: z.string().max(2 * 1024 * 1024).optional(),
  // The checks without AI that were on. When the field is absent, all of them were on.
  groups: z.array(z.enum(checkGroups)).max(checkGroups.length).optional()
}).strict();
export type ReviewSession = z.infer<typeof reviewSchema>;

export function validateReviewSession(value: unknown): ReviewSession {
  const state = reviewSchema.parse(value);
  const keys = new Set(state.sources.map(analysisKey));
  const decisions = state.analysis?.decisions || [];
  const notPageReview = state.request.mode !== 'page' || state.sources.some(source => source.kind !== 'page');
  // A review without AI categories is a Page review that runs checks without AI and has no analysis yet.
  if (!state.categories.length && (notPageReview || !state.groups?.length || state.analysis !== undefined || state.autoContinuePage)) {
    throw new Error('REVIEW_SESSION_INVALID');
  }
  if (state.autoContinuePage && notPageReview) throw new Error('REVIEW_SESSION_INVALID');
  if (keys.size !== state.sources.length || state.sources.some(source => source.siteUrl !== state.request.siteUrl)) {
    throw new Error('REVIEW_SESSION_INVALID');
  }
  if (!rulesMatchCategories(state.categories, state.rules) || !pagePartsValid(state.sources, true)) {
    throw new Error('REVIEW_SESSION_INVALID');
  }
  // Each decision names one known source part, once.
  const decisionKeys = decisions.map(decision => JSON.stringify([decision.sourceId, decision.chunkId]));
  if (new Set(decisionKeys).size !== decisions.length || decisionKeys.some(key => !keys.has(key))) {
    throw new Error('REVIEW_SESSION_INVALID');
  }
  if (state.analysis?.findings.some(finding => !isFindingValid(finding, state.sources, state.categories))) {
    throw new Error('REVIEW_SESSION_INVALID');
  }
  return state;
}

// Merging answers is part of the exchange with Copilot; see roundTrip/README.md.
export { mergeReviewResults } from '../roundTrip/mergeResults';
