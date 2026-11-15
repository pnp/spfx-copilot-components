import { textLocations } from './evidence';
import type { ComparisonEvidence } from './contracts';

/**
 * Maps evidence IDs to the blocks to highlight in the preview of one page. An ID resolves only through
 * the saved evidence. A page-level fact has no block, so it adds no location.
 */
export function previewLocations(evidence: ComparisonEvidence, ids: string[], page: 'A' | 'B'): string[] {
  const source = evidence.pages[page === 'A' ? 0 : 1];
  const locations: string[] = [];
  ids.forEach(id => {
    const fact = evidence.facts.find(item => item.id === id && item.page === page);
    const link = evidence.links.find(item => item.id === id && item.page === page);
    const block = textLocations(source, page).find(location => location.id === id)?.blockId
      || fact?.blockId
      || (link && source.page?.media?.links.find(item => item.id === link.useId)?.blockId)
      || source.page?.media?.images.find(item => page + ':' + item.id === id)?.blockId;
    if (block && locations.indexOf(block) < 0) locations.push(block);
  });
  return locations;
}
