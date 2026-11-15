import type { PageOutlineItem, ReviewSource } from '../domain/contracts';

/**
 * Reads an exact saved range from the page parts, in offset order. The text stops at the first gap,
 * so a missing part leaves the result incomplete instead of shifting the next part into its place.
 */
export function savedBlockText(sources: ReviewSource[], block: PageOutlineItem): { text: string; complete: boolean } {
  if (block.start === undefined || block.end === undefined || block.end < block.start) {
    return { text: '', complete: false };
  }
  let cursor = block.start;
  let text = '';
  const ordered = sources.slice().sort((a, b) => (a.part?.offset || 0) - (b.part?.offset || 0));
  for (const source of ordered) {
    const offset = source.part?.offset || 0;
    const end = offset + source.text.length;
    if (end <= cursor) continue;
    if (offset > cursor || cursor >= block.end) break;
    const to = Math.min(end, block.end);
    text += source.text.slice(cursor - offset, to - offset);
    cursor = to;
  }
  return { text, complete: cursor === block.end };
}
