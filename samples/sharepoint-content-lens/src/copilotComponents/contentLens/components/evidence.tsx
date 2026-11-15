import * as React from 'react';

/** Offsets of an excerpt in the original text, without its surrounding whitespace. */
export function evidenceRange(text: string, excerpt: string): { start: number; end: number } | undefined {
  let start = text.indexOf(excerpt);
  let end = start + excerpt.length;
  if (start < 0) {
    // Collapse every whitespace run to one space, and keep for each kept character its start and end offset
    // in the original text. An exact match in the collapsed text then maps back to the original range.
    const characters: string[] = [];
    const starts: number[] = [];
    const ends: number[] = [];
    for (let index = 0; index < text.length; index++) {
      const character = /\s/.test(text[index]) ? ' ' : text[index];
      if (character === ' ' && characters[characters.length - 1] === ' ') {
        ends[ends.length - 1] = index + 1;
        continue;
      }
      characters.push(character);
      starts.push(index);
      ends.push(index + 1);
    }
    const normalizedExcerpt = excerpt.replace(/\s+/g, ' ').trim();
    const match = normalizedExcerpt ? characters.join('').indexOf(normalizedExcerpt) : -1;
    if (match < 0) return undefined;
    start = starts[match];
    end = ends[match + normalizedExcerpt.length - 1];
  }
  // Passages keep their trailing line breaks; mark only the wording.
  while (end > start && /\s/.test(text[end - 1])) end--;
  while (start < end && /\s/.test(text[start])) start++;
  return { start, end };
}

/**
 * The source text with each excerpt wrapped in a React mark. The text itself stays as it is; the matched offsets
 * only decide where a mark starts and ends. A compact view shows only the lines that hold the excerpts, so a
 * finding does not repeat the whole of a long page.
 */
export function highlightedEvidence(
  text: string,
  excerpts: string[],
  compact: boolean,
  markClassName?: string
): React.ReactNode {
  // One card can hold several findings for the same source; overlapping passages merge into one mark.
  const ranges = excerpts.map(excerpt => evidenceRange(text, excerpt))
    .filter((range): range is { start: number; end: number } => !!range)
    .sort((a, b) => a.start - b.start)
    .reduce<Array<{ start: number; end: number }>>((merged, range) => {
      const last = merged[merged.length - 1];
      if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
      else merged.push({ ...range });
      return merged;
    }, []);
  if (!ranges.length) return text;
  const from = compact ? text.lastIndexOf('\n', ranges[0].start - 1) + 1 : 0;
  const lineEnd = compact ? text.indexOf('\n', ranges[ranges.length - 1].end) : -1;
  const to = lineEnd < 0 ? text.length : lineEnd;
  const parts: React.ReactNode[] = [];
  let cursor = from;
  ranges.forEach((range, index) => {
    parts.push(
      text.slice(cursor, range.start),
      <mark key={index} className={markClassName}>{text.slice(range.start, range.end)}</mark>
    );
    cursor = range.end;
  });
  parts.push(text.slice(cursor, to));
  return <>{from > 0 && '… '}{parts}{to < text.length && ' …'}</>;
}
