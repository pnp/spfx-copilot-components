import { z } from 'zod';
import { mediaSchema } from '../comparison/media';
import { accessibilityKinds, layoutKinds } from './contracts';

/** Longest source text kept in the browser. One request carries up to 7,900 encoded source bytes, reduced for rule/envelope space. */
export const maxSourceTextChars = 40000;
/** Maximum page parts. Available text space depends on encoded rules and metadata; omitted text is reported explicitly. */
export const maxPageParts = 20;

const textCutPrefix = 'Text after the first ';
/** The omitted-part note for page text that was cut: how many characters were kept, and how many there were. */
export function textCutNote(kept: number, total: number): string {
  return `${textCutPrefix}${kept.toLocaleString('en-US')} characters (${total.toLocaleString('en-US')} in total)`;
}
/** Whether an omitted-part note says that page text was cut. */
export function isTextCutNote(note: string): boolean {
  return note.indexOf(textCutPrefix) === 0;
}

/**
 * Bounds for the original sources the browser holds as evidence. Findings from the model are checked against these
 * sources; model output does not replace them.
 */
export const sourceSchema = z.object({
  id: z.string().max(2048),
  chunkId: z.string().max(2048),
  siteUrl: z.string().max(4096),
  listId: z.string().max(128),
  pageItemId: z.number().int().positive(),
  commentId: z.string().max(256).optional(),
  parentCommentId: z.string().max(256).optional(),
  commentAuthor: z.string().max(120).optional(),
  kind: z.enum(['comment', 'reply', 'page']),
  pageKind: z.enum(['page', 'news']),
  pageTitle: z.string().max(1024),
  text: z.string().max(maxSourceTextChars),
  contextText: z.string().max(maxSourceTextChars).optional(),
  createdAt: z.string().max(64),
  sourceUrl: z.string().max(4096).optional(),
  omittedParts: z.array(z.string().max(512)).max(100).optional(),
  page: z.object({
    media: mediaSchema.optional(),
    version: z.string().regex(/^\d+\.\d+$/).max(16),
    state: z.enum(['published', 'draft']),
    modified: z.string().max(64).optional(),
    structure: z.object({
      words: z.number().int().min(0).max(1e6),
      textBlocks: z.number().int().min(0).max(1e4),
      webParts: z.number().int().min(0).max(1e4),
      sections: z.array(z.object({
        vertical: z.boolean(),
        columns: z.array(z.array(z.object({
          kind: z.enum(['text', 'webPart']),
          label: z.string().max(120),
          words: z.number().int().min(0).max(1e6).optional(),
          id: z.string().min(1).max(80),
          start: z.number().int().min(0).max(1e6).optional(),
          end: z.number().int().min(0).max(1e6).optional()
        }).strict()).max(50)).max(10),
        factors: z.array(z.number().int().min(1).max(12)).max(10).optional()
      }).strict()).max(50),
      issues: z.array(z.object({
        kind: z.enum(accessibilityKinds),
        where: z.string().max(130),
        text: z.string().max(120).optional(),
        from: z.number().int().min(1).max(6).optional(),
        to: z.number().int().min(1).max(6).optional(),
        blockId: z.string().max(80).optional(),
        at: z.number().int().min(0).max(1e6).optional()
      }).strict()).max(50),
      layout: z.array(z.object({
        kind: z.enum(layoutKinds),
        where: z.string().max(130),
        blockId: z.string().max(80).optional(),
        at: z.number().int().min(0).max(1e6).optional(),
        words: z.number().int().min(0).max(1e6).optional(),
        count: z.number().int().min(0).max(1e4).optional(),
        section: z.number().int().min(1).max(50).optional()
      }).strict()).max(50).optional()
    }).strict().optional(),
    news: z.object({ description: z.boolean(), banner: z.boolean() }).strict().optional()
  }).strict().optional(),
  part: z.object({
    index: z.number().int().min(1).max(maxPageParts),
    count: z.number().int().min(2).max(maxPageParts),
    offset: z.number().int().min(0).max(maxSourceTextChars)
  }).strict().optional()
}).strict();

export const scanRequestSchema = z.object({
  siteUrl: z.string().max(4096),
  mode: z.enum(['comments', 'page']),
  lookbackDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  pageKind: z.enum(['page', 'news', 'both']),
  pageItemId: z.number().int().positive().optional()
}).strict();
