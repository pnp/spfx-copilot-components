export interface EvidencePassage { id: number; text: string; }

/** Soft passage length: sentences are packed up to this size, longer sentences are cut at a word. */
const passageChars = 160;
/** A single line break ends a passage once it holds this much text; a blank line always does. */
const lineBreakMinChars = 40;

interface Unit { text: string; paragraphEnd: boolean; lineEnd: boolean; }

/** Split at sentence ends, line breaks and blank lines. Each unit keeps its trailing whitespace. */
function units(text: string): Unit[] {
  const result: Unit[] = [];
  const whitespace = /\s+/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = whitespace.exec(text)) !== null) {
    const end = match.index + match[0].length;
    if (end >= text.length) break;
    const newlines = match[0].split('\n').length - 1;
    // Look only at the characters before this gap; the batcher calls this function often.
    const sentenceEnd = /[.!?…]["'”’»)\]]*$/.test(text.slice(Math.max(start, match.index - 8), match.index));
    if (newlines > 0 || sentenceEnd) {
      result.push({ text: text.slice(start, end), paragraphEnd: newlines > 1, lineEnd: newlines === 1 });
      start = end;
    }
  }
  if (start < text.length) result.push({ text: text.slice(start), paragraphEnd: false, lineEnd: false });
  return result;
}

/** Cut an overlong unit at word boundaries, and keep the two halves of a surrogate pair together. */
function pieces(text: string): string[] {
  const result: string[] = [];
  let offset = 0;
  while (text.length - offset > passageChars) {
    let end = offset + passageChars;
    // Cut after the last whitespace only when it lies in the second half; an earlier cut makes many tiny passages.
    const whitespace = text.slice(offset, end).search(/\s\S*$/);
    if (whitespace >= passageChars / 2) end = offset + whitespace + 1;
    const last = text.charCodeAt(end - 1);
    if (last >= 0xd800 && last <= 0xdbff) end--;
    result.push(text.slice(offset, end));
    offset = end;
  }
  result.push(text.slice(offset));
  return result;
}

/**
 * Stable, contiguous source slices aligned to sentences. Joined in order they equal the source
 * text exactly, so a referenced range is always an exact excerpt. The model cites passage IDs
 * instead of character offsets.
 */
export function evidencePassages(text: string): EvidencePassage[] {
  const passages: EvidencePassage[] = [];
  let current = '';
  const flush = (): void => {
    if (current) passages.push({ id: passages.length + 1, text: current });
    current = '';
  };
  for (const unit of units(text)) {
    if (unit.text.length > passageChars) {
      flush();
      for (const piece of pieces(unit.text)) {
        current = piece;
        flush();
      }
      continue;
    }
    if (current.length + unit.text.length > passageChars) flush();
    current += unit.text;
    if (unit.paragraphEnd || (unit.lineEnd && current.length >= lineBreakMinChars)) flush();
  }
  flush();
  return passages;
}
