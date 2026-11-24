import type { ReviewSource } from '../domain/contracts';
import { sharePointPageContent } from '../services/sharePointParsing';
import { extractMedia } from './mediaParsing';
import { compareEvidence } from './evidence';
import type { ComparisonEvidence, CopilotInterpretation } from './contracts';

export function demoComparison(a: ReviewSource, doc: Document, locale: string): ComparisonEvidence {
  const at = (zoneIndex: number, sectionIndex: number = 1): object => ({
    layoutIndex: 1,
    zoneIndex,
    sectionIndex,
    controlIndex: 1,
    sectionFactor: sectionIndex === 1 ? 8 : 4
  });
  const canvas = JSON.stringify([
    {
      id: 'arrival-image', controlType: 3, position: at(1),
      webPartData: {
        id: 'd1d91016-032f-456d-98a4-721247c305e8',
        title: 'Entrance',
        properties: { imageSource: '/sites/workplace/SiteAssets/entrance.jpg', altText: 'Glass entrance beside cycle parking' }
      }
    },
    {
      id: 'welcome', controlType: 4, position: at(2),
      innerHTML: '<h2>Before you arrive</h2><p>Bring your badge. Ask your manager for a parking permit.</p><h2>Entering the office</h2><ol><li>Use the main entrance.</li><li>Scan your badge.</li><li>Collect your visitor at reception.</li></ol>'
    },
    {
      id: 'travel', controlType: 4, position: at(3),
      innerHTML: '<h2>Getting there</h2><p><a href="/sites/workplace/SitePages/Parking.aspx">Book visitor parking</a> or <a href="https://transit.example/timetable">check the train timetable</a>.</p>'
    },
    {
      id: 'help', controlType: 4, position: at(3, 2),
      innerHTML: '<h2>Get help</h2><p>Employee access: 06:00–22:00. Reception: 08:00–18:00.</p><a href="/sites/workplace/SitePages/Facilities-old.aspx"></a>'
    },
    {
      id: 'hero', controlType: 3, position: at(4),
      webPartData: {
        id: 'c4bd7b2f-7b6e-4599-8485-16504575f590',
        title: 'Hero',
        properties: {
          content: [
            {
              title: 'Office guide',
              link: '/sites/workplace/Shared Documents/Staff-guide.pdf',
              image: { url: '/sites/workplace/SiteAssets/entrance.jpg' },
              alternateText: 'Office entrance'
            },
            {
              title: 'Book a desk',
              link: 'https://booking.example/desks',
              image: { url: '/sites/workplace/SiteAssets/entrance.jpg' },
              alternateText: '',
              isDecorative: true
            }
          ]
        }
      }
    },
    { id: 'map', controlType: 4, position: at(5), innerHTML: '<h2>Campus</h2><a href="/sites/workplace/SitePages/Campus-map.aspx">Campus map</a>' }
  ]);
  const content = sharePointPageContent(canvas, doc, 'Your first day at Riverside');
  const media = extractMedia(canvas, content.structure, doc);
  media.images.unshift(
    { id: 'banner', blockId: 'header', section: 0, column: 0, role: 'banner', state: 'none', metadata: 'prepared' },
    {
      id: 'thumbnail', blockId: 'thumbnail', section: 0, column: 0, role: 'thumbnail', state: 'configured',
      url: '/sites/workplace/SiteAssets/entrance.jpg', metadata: 'prepared'
    }
  );
  media.images.forEach(image => {
    if (image.url) Object.assign(image, { width: 1672, height: 941, bytes: 359333, metadata: 'prepared' });
  });
  const b: ReviewSource = {
    ...a,
    id: 'comparison-demo-b',
    chunkId: 'comparison-demo-b:0',
    pageItemId: 99,
    pageTitle: 'Your first day at Riverside',
    pageKind: 'page',
    sourceUrl: a.siteUrl + '/SitePages/First-day.aspx',
    text: content.text,
    omittedParts: content.omittedParts,
    page: { version: '2.3', state: 'draft', structure: content.structure, media }
  };
  const result = compareEvidence(a, b, locale, crypto.randomUUID(), true);
  // Page A links are all available. Page B links cycle through every state, so the demo shows each one.
  const states = ['available', 'unknown', 'missing', 'denied', 'signin', 'unchecked'] as const;
  result.pages.forEach((source, pageIndex) => (source.page?.media?.links || []).forEach((link, linkIndex) => result.links.push({
    id: (pageIndex ? 'B:' : 'A:') + link.id,
    page: pageIndex ? 'B' : 'A',
    useId: link.id,
    state: pageIndex ? states[linkIndex % states.length] : 'available',
    reason: 'prepared',
    checkedAt: result.capturedAt
  })));
  return result;
}

export function demoAnswer(evidence: ComparisonEvidence, question: string, s: IContentLensStrings): CopilotInterpretation {
  const c = s.Comparison;
  return {
    question,
    text: c.demoAnswer,
    highlights: [
      {
        title: c.demoStructure,
        explanation: c.demoStructureText,
        evidenceIds: evidence.facts.filter(fact => fact.page === 'B' && fact.kind === 'sections').map(fact => fact.id)
      },
      {
        title: c.demoHelp,
        explanation: c.demoHelpText,
        evidenceIds: evidence.links.filter(link => link.state === 'missing').map(link => link.id)
      },
      { title: c.demoLimits, explanation: c.demoLimitsText, evidenceIds: ['B:banner', 'B:thumbnail'] }
    ],
    citations: [],
    sensitivity: [],
    messageId: crypto.randomUUID(),
    revision: evidence.revision
  };
}
