import type {
  AccessibilityIssue,
  CategoryId,
  LayoutIssue,
  PageOutlineItem,
  PageStructure,
  ReviewFinding,
  ReviewSource,
  SourceReviewDecision
} from '../domain/contracts';
import { isRuleId, ruleIds } from '../domain/contracts';
import { checkGroups, checkOf, type CheckDefinition, type CheckGroup } from '../domain/checkCatalog';
import { freshnessFacts } from '../domain/freshness';
import { format } from './viewUtils';

/** One numbered note on a page result: a Copilot finding, or something found without AI. */
export interface PageNote {
  n: number;
  kind: 'finding' | 'a11y' | 'layout' | 'freshness';
  /** The check without AI that found it. */
  check?: CheckDefinition['id'];
  categoryId?: CategoryId;
  /** The passage as shown: the marked words between their context. */
  before: string;
  mark: string;
  after: string;
  /** Flagged wording gets the highlight; an accessibility subject is set in bold instead. */
  highlight: boolean;
  /** "Rule 1", "Insult", "Accessibility", "Freshness". */
  label: string;
  /** The rule's text, Copilot's short note, or the reason found without AI. */
  note: string;
  /** Short publisher-facing title; the selected note contains the explanation and action. */
  title?: string;
  needsContext: boolean;
  noAI: boolean;
  /** The map block the note belongs to; absent for the title, the whole page, or text without a block. */
  blockId?: string;
  /** "Section 2 · Parking", "Page title", "Whole page", or empty. */
  location: string;
}

/** A block of the page map, in page order. */
export interface MapBlock extends PageOutlineItem {
  section: number;
  column: number;
  vertical: boolean;
  /** Its text was not part of a request that Copilot answered. */
  notChecked: boolean;
}

export interface PageNotes {
  notes: PageNote[];
  blocks: MapBlock[];
  /** Copilot findings, accessibility gaps, and notes found without AI besides accessibility. */
  counts: { findings: number; a11y: number; layout: number; dates: number; stale?: number };
  /** Characters of the page text Copilot checked from the start, and the page text's length. */
  checkedChars: number;
  textChars: number;
  partsChecked: number;
  partsTotal: number;
}

const sentenceEnd = /[.!?…]["'”’»)\]]*\s|\n/g;
const lineEnd = /\n/g;

/** The sentence around a range of the text, at most 120 characters on either side, split into before, mark and after. */
function inSentence(
  text: string,
  start: number,
  end: number,
  boundary: RegExp = sentenceEnd
): { before: string; mark: string; after: string } {
  let from = 0;
  let to = text.length;
  boundary.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text)) !== null) {
    const after = match.index + match[0].length;
    if (after <= start) {
      from = after;
    } else if (match.index >= end) {
      to = match.index + match[0].replace(/\s+$/, '').length;
      break;
    }
  }
  const clippedFrom = Math.max(from, start - 120);
  const clippedTo = Math.min(to, end + 120);
  return {
    before: (clippedFrom > from ? '…' : '') + text.slice(clippedFrom, start).replace(/^\s+/, ''),
    mark: text.slice(start, end),
    after: text.slice(end, clippedTo).replace(/\s+$/, '') + (clippedTo < to ? '…' : '')
  };
}

function trimRange(text: string, start: number, end: number): [number, number] {
  while (end > start && /\s/.test(text[end - 1])) end--;
  while (start < end && /\s/.test(text[start])) start++;
  return [start, end];
}

function a11yNote(s: IContentLensStrings, issue: AccessibilityIssue): { before: string; mark: string; after: string; note: string } {
  const quoted = (template: string, value: string): { before: string; mark: string; after: string } => {
    const [before, after] = template.split('{0}');
    return { before, mark: value, after: after || '' };
  };
  switch (issue.kind) {
    case 'headingSkip':
      return {
        ...quoted(s.A11ySubjectHeading, issue.text || ''),
        note: issue.from !== undefined && issue.to !== undefined
          ? format(s.A11yNoteHeadingSkipLevels, issue.text || s.A11ySubjectEmptyHeading, issue.from, issue.to, issue.from + 1)
          : s.A11yNoteHeadingSkip
      };
    case 'headingTitleLevel':
      return { ...quoted(s.A11ySubjectHeading, issue.text || ''), note: s.A11yNoteHeadingTitle };
    case 'headingEmpty':
      return { before: '', mark: s.A11ySubjectEmptyHeading, after: '', note: s.A11yNoteHeadingEmpty };
    case 'linkText':
      return { ...quoted(s.A11ySubjectLink, issue.text || ''), note: s.A11yNoteLinkText };
    case 'linkUrl':
      return { ...quoted(s.A11ySubjectLink, issue.text || ''), note: s.A11yNoteLinkUrl };
    case 'linkAmbiguous':
      return { ...quoted(s.A11ySubjectLink, issue.text || ''), note: s.A11yNoteLinkAmbiguous };
    case 'tableHeader':
      return { before: '', mark: s.A11ySubjectTable, after: '', note: s.A11yNoteTableHeader };
    case 'imageWebPartAlt':
      return { ...quoted(s.A11ySubjectImageWebPart, issue.where), note: s.A11yNoteImageWebPartAlt };
    case 'heroImageAlt': {
      const subject = quoted(s.A11ySubjectHeroWebPart, issue.where);
      const tile = issue.text ? ' · ' + format(s.A11yHeroTile, issue.text) : '';
      return { ...subject, after: subject.after + tile, note: s.A11yNoteHeroAlt };
    }
    case 'linkEmpty':
      return { before: '', mark: s.A11ySubjectEmptyLink, after: '', note: s.A11yNoteLinkEmpty };
    default:
      return { before: '', mark: s.A11ySubjectImage, after: '', note: s.A11yNoteImageAlt };
  }
}

function layoutNote(s: IContentLensStrings, issue: LayoutIssue): string {
  switch (issue.kind) {
    case 'longBlock':
      return format(s.LayoutNoteLongBlock, issue.words || 0);
    case 'longParagraph':
      return format(s.LayoutNoteLongParagraph, issue.words || 0);
    case 'emptySection':
      return s.LayoutNoteEmptySection;
    case 'emptyColumn':
      return format(s.LayoutNoteEmptyColumn, issue.count || 1);
    default:
      return format(s.LayoutNoteRepeated, issue.count || 0);
  }
}

/** The position of a note found without AI: its own offset, else the start of its block, else the fallback. */
function issueOffset(at: number | undefined, block: MapBlock | undefined, fallback: number): number {
  if (at !== undefined) return at;
  if (block?.start !== undefined) return block.start;
  return fallback;
}

export interface IPageNotesInput {
  /** The page source, or its parts in any order. */
  sources: ReviewSource[];
  findings: ReviewFinding[];
  decisions: SourceReviewDecision[];
  rules: string[];
  labels: Record<CategoryId, string>;
  strings: IContentLensStrings;
  now: number;
  /** The checks without AI that were on; all by default. */
  groups?: readonly CheckGroup[];
}

/**
 * Every note on one page in page order, numbered once: block by block as the map shows them, and by
 * position inside a block. The title and whole-page notes come first.
 */
export function pageNotes(input: IPageNotesInput): PageNotes {
  const { strings: s } = input;
  const on = (group: CheckGroup): boolean => (input.groups || checkGroups).indexOf(group) >= 0;
  const parts = input.sources.slice().sort((a, b) => (a.part?.index || 1) - (b.part?.index || 1));
  const first = parts[0];
  const text = parts.map(part => part.text).join('');
  const structure: PageStructure | undefined = first?.page?.structure;
  const reviewed = (source: ReviewSource): boolean => input.decisions.some(decision =>
    decision.sourceId === source.id && decision.chunkId === source.chunkId && decision.status === 'reviewed');
  // Copilot checked the text from the start up to the first part it did not check.
  let checkedChars = 0;
  for (const part of parts) {
    if (!reviewed(part)) break;
    checkedChars += part.text.length;
  }
  const unchecked = parts
    .filter(part => !reviewed(part))
    .map(part => [part.part?.offset || 0, (part.part?.offset || 0) + part.text.length]);
  const blocks: MapBlock[] = [];
  (structure?.sections || []).forEach((section, sectionIndex) => {
    section.columns.forEach((column, columnIndex) => {
      column.forEach(item => {
        const start = item.start === undefined ? -1 : item.start;
        const end = item.end === undefined ? -1 : item.end;
        // A text block is not checked when it runs past the stored text, so it was not read to its end,
        // or when it overlaps a part that Copilot did not check.
        const notChecked = item.kind === 'text'
          && (start >= text.length || end > text.length || unchecked.some(([from, to]) => start < to && from < end));
        blocks.push({ ...item, section: sectionIndex, column: columnIndex, vertical: section.vertical, notChecked });
      });
    });
  });
  const verticalLabel = s.OutlineVertical;
  const locationOf = (block: MapBlock | undefined): string => {
    if (!block) return '';
    const area = block.vertical ? verticalLabel : format(s.OutlineSection, block.section + 1);
    return area + (block.label ? ' · ' + block.label : '');
  };
  const blockAt = (offset: number): MapBlock | undefined => blocks.find(block => block.kind === 'text'
    && block.start !== undefined && block.end !== undefined
    && offset >= block.start && offset < block.end);
  const titleEnd = first ? first.pageTitle.length : 0;
  type Draft = Omit<PageNote, 'n'> & { order: number; offset: number };
  const drafts: Draft[] = [];
  const place = (offset: number): { blockId?: string; location: string; order: number } => {
    const block = blockAt(offset);
    if (block) return { blockId: block.id, location: locationOf(block), order: blocks.indexOf(block) };
    if (offset < titleEnd) return { location: s.LocationTitle, order: -1 };
    return { location: '', order: blocks.length };
  };

  input.findings.forEach(finding => {
    const source = parts.find(part => part.id === finding.sourceId && part.chunkId === finding.chunkId);
    if (!source) return;
    const local = finding.offset !== undefined
      && source.text.slice(finding.offset, finding.offset + finding.excerpt.length) === finding.excerpt
      ? finding.offset
      : source.text.indexOf(finding.excerpt);
    const offset = (source.part?.offset || 0) + Math.max(0, local);
    const [start, end] = trimRange(text, offset, offset + finding.excerpt.length);
    const ruleFinding = isRuleId(finding.categoryId);
    const rule = ruleFinding ? input.rules[ruleIds.indexOf(finding.categoryId as typeof ruleIds[number])] : undefined;
    // A rule finding shows its rule text, or only the category label when the rule text is missing.
    // The explanation stored on a finding describes the wording checks of its segment, so only wording findings show it.
    const note = ruleFinding ? (rule || '').trim() : finding.explanation.trim();
    // Copilot cites whole passages; the paragraph around one reads as it does on the page.
    drafts.push({
      kind: 'finding', categoryId: finding.categoryId,
      ...inSentence(text, start, end, lineEnd), highlight: true,
      label: input.labels[finding.categoryId], note, needsContext: finding.needsContext, noAI: false,
      offset, ...place(offset)
    });
  });

  const a11yIssues = on('a11y') ? structure?.issues || [] : [];
  a11yIssues.forEach(issue => {
    const block = blocks.find(item => item.id === issue.blockId);
    const order = block ? blocks.indexOf(block) : blocks.length;
    const offset = issueOffset(issue.at, block, Number.MAX_SAFE_INTEGER);
    drafts.push({
      kind: 'a11y', check: checkOf(issue.kind).id, title: s.AutomaticTitles[issue.kind],
      ...a11yNote(s, issue), highlight: false,
      label: s.A11yLabel, needsContext: false, noAI: true,
      blockId: block?.id, location: locationOf(block), order, offset
    });
  });

  const layoutIssues = on('layout') ? structure?.layout || [] : [];
  layoutIssues.forEach(issue => {
    const block = issue.blockId ? blocks.find(item => item.id === issue.blockId) : undefined;
    const section = issue.section ? format(s.OutlineSection, issue.section) : '';
    const subject = issue.kind === 'emptySection' || issue.kind === 'emptyColumn' ? section : issue.where;
    const note = layoutNote(s, issue);
    drafts.push({
      kind: 'layout', check: checkOf(issue.kind).id, title: s.AutomaticTitles[issue.kind],
      before: '', mark: subject, after: '', highlight: false,
      label: s.LayoutLabel, note, needsContext: false, noAI: true,
      blockId: block?.id, location: block ? locationOf(block) : section || s.LocationPage,
      order: block ? blocks.indexOf(block) : -2, offset: issueOffset(issue.at, block, issue.section || 0)
    });
  });
  // A news post's description and banner image show in news lists and search.
  if (on('layout') && first?.pageKind === 'news' && first.page?.news) {
    if (!first.page.news.description) {
      drafts.push({
        kind: 'layout', check: 'newsFacts',
        before: '', mark: s.LayoutSubjectNewsDescription, after: '', highlight: false,
        label: s.LayoutLabel, title: s.AutomaticTitles.newsDescription, note: s.LayoutNoteNewsDescription,
        needsContext: false, noAI: true, location: s.LocationPage, order: -2, offset: 0
      });
    }
    if (!first.page.news.banner) {
      drafts.push({
        kind: 'layout', check: 'newsFacts',
        before: '', mark: s.LayoutSubjectNewsBanner, after: '', highlight: false,
        label: s.LayoutLabel, title: s.AutomaticTitles.newsBanner, note: s.LayoutNoteNewsBanner,
        needsContext: false, noAI: true, location: s.LocationPage, order: -2, offset: 0
      });
    }
  }

  const facts = on('freshness') && first?.page ? freshnessFacts(text, first.page.modified, input.now) : { passed: [] };
  facts.passed.forEach(date => {
    drafts.push({
      kind: 'freshness', check: 'datesPassed',
      ...inSentence(text, date.start, date.end), highlight: true,
      label: s.FreshnessLabel, title: s.AutomaticTitles.datePassed, note: s.FreshnessPassed,
      needsContext: false, noAI: true, offset: date.start, ...place(date.start)
    });
  });
  if (facts.staleMonths !== undefined) {
    drafts.push({
      kind: 'freshness', check: 'lastSaved',
      before: '', mark: s.LocationPage, after: '', highlight: false,
      label: s.FreshnessLabel, title: s.AutomaticTitles.stale, note: format(s.FreshnessStale, facts.staleMonths),
      needsContext: false, noAI: true, location: s.LocationPage, order: -2, offset: 0
    });
  }

  const notes: PageNote[] = drafts.sort((a, b) => a.order - b.order || a.offset - b.offset).map((draft, index) => {
    const note: PageNote & { order?: number; offset?: number } = { ...draft, n: index + 1 };
    delete note.order;
    delete note.offset;
    return note;
  });
  return {
    notes,
    blocks,
    counts: {
      findings: notes.filter(note => note.kind === 'finding').length,
      a11y: notes.filter(note => note.kind === 'a11y').length,
      layout: notes.filter(note => note.kind === 'layout').length,
      dates: facts.passed.length,
      ...(facts.staleMonths !== undefined ? { stale: facts.staleMonths } : {})
    },
    checkedChars,
    textChars: text.length,
    partsChecked: parts.filter(reviewed).length,
    partsTotal: parts.length
  };
}

/** "2–5" for the notes of one block, or "1". */
export function noteRange(notes: PageNote[]): string {
  if (!notes.length) return '';
  const firstNumber = notes[0].n;
  const last = notes[notes.length - 1].n;
  return firstNumber === last ? String(firstNumber) : firstNumber + '–' + last;
}
