import { z } from 'zod';
import { sourceSchema } from '../domain/sourceSchema';

export const linkStates = ['available', 'missing', 'denied', 'signin', 'unknown', 'unchecked'] as const;
export const factSchema = z.object({
  id: z.string().max(200),
  page: z.enum(['A', 'B']),
  blockId: z.string().max(80).optional(),
  kind: z.enum(['words', 'sentences', 'sections', 'columns', 'headings', 'a11y', 'layout']),
  value: z.string().max(512)
}).strict();
export const evidenceSchema = z.object({
  revision: z.string().uuid(),
  capturedAt: z.string().max(64),
  ruleVersion: z.literal(1),
  pages: z.tuple([sourceSchema, sourceSchema]),
  facts: z.array(factSchema).max(400),
  links: z.array(z.object({
    id: z.string().max(200),
    page: z.enum(['A', 'B']),
    useId: z.string().max(128),
    state: z.enum(linkStates),
    reason: z.enum([
      'resolved', 'http404', 'http403', 'http401', 'external', 'unsupported', 'budget', 'timeout', 'throttled', 'response', 'prepared'
    ]),
    checkedAt: z.string().max(64).optional(),
    status: z.number().optional(),
    method: z.literal('SharePoint file metadata').optional()
  }).strict()).max(400),
  demo: z.boolean()
}).strict();
export type ComparisonEvidence = z.infer<typeof evidenceSchema>;

export const answerSchema = z.object({
  question: z.string().max(2000),
  text: z.string().max(24000),
  highlights: z.array(z.object({
    title: z.string().max(200),
    explanation: z.string().max(2000),
    evidenceIds: z.array(z.string().max(200)).max(8)
  }).strict()).max(6),
  citations: z.array(z.object({ title: z.string().max(512), url: z.string().url().max(4096) }).strict()).max(30),
  sensitivity: z.array(z.string().max(512)).max(10),
  messageId: z.string().max(200),
  responseMessageIds: z.array(z.string().max(200)).max(200).optional(),
  revision: z.string().uuid()
}).strict();
export type CopilotInterpretation = z.infer<typeof answerSchema>;

const siteChoiceSchema = z.object({ url: z.string().url().max(4096), title: z.string().max(512) }).strict();
const pageChoiceSchema = z.object({
  pageItemId: z.number().int().positive(),
  title: z.string().max(512),
  pageKind: z.enum(['page', 'news']),
  sourceUrl: z.string().url().max(4096),
  site: siteChoiceSchema.optional()
}).strict();
export const comparisonSelectionSchema = z.object({ site: siteChoiceSchema.optional(), page: pageChoiceSchema.optional() }).strict();
export type ComparisonSelection = z.infer<typeof comparisonSelectionSchema>;

export const comparisonStateSchema = z.object({
  evidence: evidenceSchema.optional(),
  conversationId: z.string().max(200).optional(),
  answers: z.array(answerSchema).max(12),
  busy: z.boolean(),
  interrupted: z.boolean(),
  question: z.string().max(2000),
  category: z.enum(['insights', 'checks', 'images', 'links']).optional(),
  item: z.string().max(200).optional(),
  page: z.enum(['A', 'B']),
  selected: z.string().max(200).optional(),
  finding: z.number().int().min(0).max(5).optional(),
  open: z.boolean(),
  selections: z.tuple([comparisonSelectionSchema, comparisonSelectionSchema]).optional(),
  picking: z.boolean().optional()
}).strict();
export type ComparisonState = z.infer<typeof comparisonStateSchema>;

export function emptyComparison(): ComparisonState {
  return { answers: [], busy: false, interrupted: false, question: '', page: 'B', open: true };
}
export interface IComparisonChat {
  turn(
    evidence: ComparisonEvidence,
    question: string,
    locale: string,
    previous: { id?: string; messageIds: string[] },
    signal: AbortSignal
  ): Promise<{ conversationId: string; answer: CopilotInterpretation }>;
}
