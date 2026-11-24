import type { ReviewSource } from './contracts';
import { maxSourceTextChars } from './sourceSchema';

// Finding validation and the decision rule are part of the exchange with Copilot; see roundTrip/README.md.
export { completeDecisions, isFindingValid, utf8Bytes } from '../roundTrip/evidence';

/** Loaded comments considered for one review selection; the request packing then picks what fits one request. */
export const reviewSelectionLimit = 30;

/**
 * The parts of a long page belong together: one page, numbered 1 to count once each, each starting where
 * the previous one ends, and only part 1 carries the page facts. A missing part is allowed only when `complete` is false.
 */
export function pagePartsValid(sources: ReviewSource[], complete: boolean): boolean {
  const groups = new Map<string, ReviewSource[]>();
  sources.forEach(source => {
    if (source.part) groups.set(source.id, [...(groups.get(source.id) || []), source]);
  });
  let valid = true;
  groups.forEach((parts, id) => {
    const sorted = parts.slice().sort((a, b) => a.part!.index - b.part!.index);
    const count = sorted[0].part!.count;
    const partInvalid = (part: ReviewSource): boolean => part.kind !== 'page' ||
      part.part!.count !== count ||
      part.part!.index > count ||
      (part.part!.index > 1 && (!!part.page || !!part.omittedParts)) ||
      part.part!.offset + part.text.length > maxSourceTextChars;
    if (sources.some(source => source.id === id && !source.part) || sorted.some(partInvalid)) valid = false;
    if (new Set(sorted.map(part => part.part!.index)).size !== sorted.length) valid = false;
    if (complete) {
      if (sorted.length !== count) valid = false;
      let offset = 0;
      sorted.forEach(part => {
        if (part.part!.offset !== offset) valid = false;
        offset += part.text.length;
      });
    }
  });
  return valid;
}
