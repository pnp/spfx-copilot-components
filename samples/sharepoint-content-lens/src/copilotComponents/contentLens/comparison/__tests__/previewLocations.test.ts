import { textLocations } from '../evidence';
import { previewLocations } from '../previewLocations';
import { demoComparison } from '../demo';
import { FixtureContentService, demoSiteUrl } from '../../services/fixtures';

it('anchors only saved evidence on the correct page and leaves page-level or invented references unanchored', async () => {
  const result = await new FixtureContentService().read({ siteUrl: demoSiteUrl, mode: 'page', pageKind: 'both', pageItemId: 17, lookbackDays: 7 });
  const evidence = demoComparison(result.sources[0], document, 'en');
  const text = textLocations(evidence.pages[0], 'A')[0];
  expect(previewLocations(evidence, [text.id], 'A')).toEqual([text.blockId]);
  expect(previewLocations(evidence, [text.id], 'B')).toEqual([]);
  const fact = evidence.facts.find(f => f.page === 'A' && f.blockId)!;
  expect(previewLocations(evidence, [fact.id, fact.id, 'made-up'], 'A')).toEqual([fact.blockId]);
  expect(previewLocations(evidence, [fact.id], 'B')).toEqual([]);
  const pageFact = evidence.facts.find(f => f.kind === 'words')!;
  expect(previewLocations(evidence, [pageFact.id], pageFact.page)).toEqual([]);
  const link = evidence.links.find(l => l.page === 'B')!;
  const use = evidence.pages[1].page!.media!.links.find(l => l.id === link.useId)!;
  expect(previewLocations(evidence, [link.id], 'B')).toEqual([use.blockId]);
});
