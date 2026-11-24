import type { CategoryId, ReviewSource } from '../domain/contracts';
import { maxPageParts, textCutNote } from '../domain/sourceSchema';
import { prepareAnalysis, type Segment as RoundTripSegment } from '../roundTrip/packing';
import { reviewInputMaxBytes } from '../roundTrip/reviewClient';

// Request packing is part of the exchange with Copilot (roundTrip/). This module re-exports what the sample uses and
// adds the one Content Lens step on top of it: splitting a long page into parts.
export { analysisKey, nextRequestSources, prepareAnalysis } from '../roundTrip/packing';
export type Segment = RoundTripSegment<ReviewSource>;

/**
 * Splits a long page into parts that each fit one request alone, so the page can be reviewed part by part.
 * Cuts fall on a blank line, else a line break, else a sentence end. Part 1 keeps the page facts; every part
 * keeps the page's identity and says where it starts. A page that fits one request comes back unchanged.
 */
export function pageParts(source: ReviewSource, categories: CategoryId[] = [], rules: string[] = []): ReviewSource[] {
  if (source.kind !== 'page' || source.part) return [source];
  const inputMaxBytes = reviewInputMaxBytes(categories, rules);
  // Measure with the longest identity a part can have, so the final part fits exactly as measured.
  const probe = (text: string): ReviewSource => ({ ...source, chunkId: `${source.chunkId}:p${maxPageParts}`, text });
  const fitsOne = (text: string): boolean => {
    const prepared = prepareAnalysis([probe(text)], categories, inputMaxBytes);
    return prepared.batches.length === 1 && prepared.batches[0].length === 1 && prepared.limitedKeys.size === 0;
  };
  const texts: string[] = [];
  let rest = source.text;
  while (rest && texts.length < maxPageParts) {
    if (fitsOne(rest)) {
      texts.push(rest);
      rest = '';
      break;
    }
    const first = prepareAnalysis([probe(rest)], categories, inputMaxBytes).batches[0]?.[0];
    let fit = first ? first.source.text.length : 0;
    if (!fit) break;
    const window = rest.slice(0, fit);
    const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! ')) + 2;
    const breaks = [window.lastIndexOf('\n\n') + 2, window.lastIndexOf('\n') + 1, sentenceEnd];
    let cut = breaks.find(position => position > fit / 2) || fit;
    // The packed length is an estimate: shrink the part until it is one segment in one request.
    while (cut > 0 && !fitsOne(rest.slice(0, cut))) {
      fit = Math.floor(cut * 0.9);
      cut = fit;
    }
    // Keep both halves of a surrogate pair in the same part.
    if (cut > 0 && /[\uD800-\uDBFF]/.test(rest[cut - 1])) cut--;
    if (cut <= 0) break;
    texts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  // Text that fits in no part is left out and named in omittedParts, so that each part stays reviewable on its own.
  const kept = texts.join('').length;
  const omitted = rest
    ? [...(source.omittedParts || []).slice(0, 99), textCutNote(kept, source.text.length)]
    : source.omittedParts;
  if (!texts.length || (texts.length < 2 && !rest)) return [source];
  if (texts.length < 2) return [{ ...source, text: texts[0] || '', ...(omitted ? { omittedParts: omitted } : {}) }];
  let offset = 0;
  return texts.map((text, index) => {
    const part: ReviewSource = {
      ...source,
      chunkId: `${source.chunkId}:p${index + 1}`,
      text,
      part: { index: index + 1, count: texts.length, offset },
      ...(index === 0 && omitted ? { omittedParts: omitted } : {})
    };
    // Only part 1 carries the page facts and the omitted parts.
    if (index > 0) {
      delete part.page;
      delete part.omittedParts;
    }
    offset += text.length;
    return part;
  });
}
