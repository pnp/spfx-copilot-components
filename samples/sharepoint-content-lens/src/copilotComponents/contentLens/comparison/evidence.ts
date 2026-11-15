import type { ReviewSource } from '../domain/contracts';
import type { ComparisonEvidence } from './contracts';

export function sameSavedPage(a: ReviewSource, b: ReviewSource): boolean {
  return a.pageItemId === b.pageItemId && a.listId.toLowerCase() === b.listId.toLowerCase() &&
    a.siteUrl.replace(/\/$/, '').toLowerCase() === b.siteUrl.replace(/\/$/, '').toLowerCase() &&
    !!a.page && a.page.version === b.page?.version;
}

/**
 * Computes the measured facts without Copilot Chat. The facts depend only on the two saved snapshots
 * and on the locale used for sentence segmentation, so they are reproducible.
 */
export function compareEvidence(
  a: ReviewSource,
  b: ReviewSource,
  locale: string,
  revision: string,
  demo: boolean = false
): ComparisonEvidence {
  const facts: ComparisonEvidence['facts'] = [];
  [a, b].forEach((source, index) => {
    const page = index === 0 ? 'A' : 'B';
    const fact = (kind: ComparisonEvidence['facts'][number]['kind'], value: string, blockId?: string): void => {
      if (facts.length < 400) facts.push({ id: page + ':fact:' + facts.length, page, kind, value, blockId });
    };
    const structure = source.page?.structure;
    if (structure) {
      fact('words', String(structure.words));
      fact('sections', String(structure.sections.length));
      fact('columns', String(structure.sections.reduce((count, section) => count + section.columns.length, 0)));
      structure.issues.forEach(issue => fact('a11y', issue.kind + (issue.text ? ': ' + issue.text : ''), issue.blockId));
      structure.layout?.forEach(issue => fact('layout', issue.kind + (issue.words !== undefined ? ': ' + issue.words : ''), issue.blockId));
    }
    // Intl.Segmenter counts sentences in any script, including scripts without spaces between words.
    // The fact records the count only.
    const intl = Intl as unknown as {
      Segmenter?: new(locale: string, options: { granularity: string }) => { segment(text: string): Iterable<{ segment: string }> };
    };
    if (intl.Segmenter) {
      try {
        const segments = Array.from(new intl.Segmenter(locale, { granularity: 'sentence' }).segment(source.text))
          .filter(part => part.segment.trim());
        fact('sentences', String(segments.length));
      } catch {
        // The locale is not available, so no sentence count is recorded.
      }
    }
  });
  return { revision, capturedAt: new Date().toISOString(), ruleVersion: 1, pages: [a, b], facts, links: [], demo };
}

/** Stable evidence IDs (`A:block:<id>`, `B:block:<id>`) for the complete saved text blocks of one page. */
export function textLocations(
  source: ReviewSource,
  page: 'A' | 'B'
): Array<{ id: string; blockId: string; label: string; start: number; end: number }> {
  const sections = source.page?.structure?.sections || [];
  return sections.reduce<ReturnType<typeof textLocations>>((all, section) => {
    section.columns.forEach(column => column.forEach(block => {
      if (
        block.kind === 'text' && block.start !== undefined && block.end !== undefined &&
        block.start >= 0 && block.end > block.start && block.end <= source.text.length
      ) {
        all.push({ id: page + ':block:' + block.id, blockId: block.id, label: block.label, start: block.start, end: block.end });
      }
    }));
    return all;
  }, []);
}
