import type { PageMedia } from '../comparison/media';
import type { AnalysisSource, IAnalysisClient as IGenericAnalysisClient } from '../roundTrip/contracts';
import { maxRuleChars, maxRules } from '../roundTrip/checks';

// The checks, the rule limits and the review types belong to the exchange with Copilot (roundTrip/); they are
// re-exported here so the rest of the sample keeps one import path.
export { categoryIds, standardCheckIds, ruleIds, maxRules, maxRuleChars, isRuleId, rulesMatchCategories } from '../roundTrip/checks';
export type { CategoryId } from '../roundTrip/checks';
export type { AnalysisSource, ReviewFinding, SourceReviewDecision, AnalysisResult } from '../roundTrip/contracts';
/** The reviewer writes guidelines freely, up to this many characters; they travel as up to five rules. */
export const maxGuidelineChars = maxRuleChars;

/**
 * Free-written guidelines as up to five slots for the result codes v to z: sentences and lines in order, grouped
 * evenly when there are more than five, so every part of the text is checked and a finding names the part it broke.
 */
export function guidelineSlots(text: string): string[] {
  const units: string[] = [];
  text.split(/\r?\n/).forEach(line => {
    // Control characters become spaces: they carry no meaning in a guideline and would bloat the request when escaped.
    const clean = line.split('').map(character => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    }).join('');
    // A sentence ends at . ! or ? followed by a space, so "2.10.2026" stays whole.
    const sentenceEnd = /[.!?]+["'”’)\]]*\s+/g;
    let start = 0;
    let match: RegExpExecArray | null;
    const parts: string[] = [];
    while ((match = sentenceEnd.exec(clean)) !== null) {
      const end = match.index + match[0].length;
      parts.push(clean.slice(start, end));
      start = end;
    }
    parts.push(clean.slice(start));
    parts.map(unit => unit.replace(/\s+/g, ' ').trim()).filter(Boolean).forEach(unit => units.push(unit));
  });
  if (units.length <= maxRules) return units;
  const slots: string[] = [];
  let start = 0;
  for (let slot = 0; slot < maxRules; slot++) {
    const size = Math.ceil((units.length - start) / (maxRules - slot));
    slots.push(units.slice(start, start + size).join(' '));
    start += size;
  }
  return slots;
}

export type SourceMode = 'comments' | 'page';
export type ScanState = 'idle' | 'running' | 'paused' | 'throttled' | 'capped' | 'completed' | 'cancelled' | 'failed';

export interface ReviewSource extends AnalysisSource {
  siteUrl: string;
  listId: string;
  pageItemId: number;
  /** Display name from SharePoint's data, the only source for it; Copilot output does not set it. */
  commentAuthor?: string;
  commentId?: string;
  parentCommentId?: string;
  kind: 'comment' | 'reply' | 'page';
  pageKind: 'page' | 'news';
  pageTitle: string;
  createdAt: string;
  sourceUrl?: string;
  omittedParts?: string[];
  /** Page text only: which saved version was read. On a page split into parts, only part 1 carries it. */
  page?: PageVersion;
  /** One part of a long page: its number, the number of parts, and where it starts in the page text. */
  part?: { index: number; count: number; offset: number };
}

export interface PageVersion {
  /** Image and link uses captured from this saved version. */
  media?: PageMedia;
  /** SharePoint's version label, e.g. "3.0" or "3.2". */
  version: string;
  state: 'published' | 'draft';
  /** When the version was saved, ISO 8601. */
  modified?: string;
  /** Layout and accessibility facts from the canvas; absent when the canvas could not be read. */
  structure?: PageStructure;
  /** A news post's description and banner image, when they could be read. */
  news?: { description: boolean; banner: boolean };
}

export interface PageOutlineItem {
  kind: 'text' | 'webPart';
  /** First heading or opening words; the web part's type name, or empty. */
  label: string;
  words?: number;
  /** The control's id, or a position-based one; stable within one saved version. */
  id: string;
  /** A text block's offsets in the page text: the title, then each text block, separated by blank lines. */
  start?: number;
  end?: number;
}
export interface PageOutlineSection {
  vertical: boolean;
  columns: PageOutlineItem[][];
  /** Column widths in twelfths of the page, e.g. [8, 4]; absent means equal columns. */
  factors?: number[];
}
export const accessibilityKinds = [
  'headingSkip', 'headingEmpty', 'headingTitleLevel', 'linkText', 'linkUrl', 'linkAmbiguous', 'linkEmpty', 'imageAlt', 'tableHeader',
  'imageWebPartAlt', 'heroImageAlt'
] as const;
export const layoutKinds = ['longBlock', 'longParagraph', 'emptySection', 'emptyColumn', 'repeatedWebParts'] as const;
/** A layout suggestion found without AI. */
export interface LayoutIssue {
  kind: typeof layoutKinds[number];
  /** Opening words of the block or paragraph, or the web part's name. */
  where: string;
  blockId?: string;
  at?: number;
  words?: number;
  count?: number;
  /** 1-based section number, for empty sections and columns. */
  section?: number;
}
export interface AccessibilityIssue {
  kind: typeof accessibilityKinds[number];
  /** Opening words of the text block, or the web part's name, so the issue can be found on the page. */
  where: string;
  text?: string;
  /** HTML heading levels for headingSkip; the page title is level 1. */
  from?: number;
  to?: number;
  /** The block the issue belongs to, and where it sits in the page text. */
  blockId?: string;
  at?: number;
}
export interface PageStructure {
  words: number;
  textBlocks: number;
  webParts: number;
  sections: PageOutlineSection[];
  issues: AccessibilityIssue[];
  /** Layout suggestions; optional, so a stored structure without them still validates. */
  layout?: LayoutIssue[];
}

export interface ReviewCoverage {
  completedPages: number;
  partialPages: number;
  failedSources: number;
  retrieved: number;
  matching: number;
  displayed: number;
  analyzed: number;
  operationsAttempted: number;
  httpEnvelopes: number;
  isPartial: boolean;
}

export interface PendingRead {
  id: string;
  pageItemId?: number;
  kind: 'metadata' | 'comments' | 'replies' | 'page' | 'digest';
  cursor?: string;
  parentCommentId?: string;
}

export interface ScanCheckpoint {
  runId: string;
  siteUrl: string;
  listId: string;
  windowStart: string;
  windowEnd: string;
  upperItemId?: number;
  metadataCursor?: string;
  pending: PendingRead[];
  processedIds: string[];
  admittedPageIds: number[];
  cooldownUntil?: number;
  state: ScanState;
  coverage: ReviewCoverage;
}

export interface ScanRequest {
  siteUrl: string;
  mode: SourceMode;
  lookbackDays: 7 | 14 | 30;
  pageKind: 'page' | 'news' | 'both';
  pageItemId?: number;
}

export interface ISharePointContentService {
  read(request: ScanRequest, signal?: AbortSignal): Promise<{ sources: ReviewSource[]; coverage: ReviewCoverage }>;
}

export type IAnalysisClient = IGenericAnalysisClient<ReviewSource>;
