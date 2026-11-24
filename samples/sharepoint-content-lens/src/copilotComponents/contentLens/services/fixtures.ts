import type {
  AnalysisResult, CategoryId, ISharePointContentService, IAnalysisClient, ReviewCoverage, ReviewFinding, ReviewSource, ScanRequest
} from '../domain/contracts';
import { isRuleId, type PageVersion } from '../domain/contracts';
import { extractMedia } from '../comparison/mediaParsing';
import { sharePointPageContent } from './sharePointParsing';
import { completeDecisions, isFindingValid } from '../domain/policy';

export const demoSiteUrl = 'https://example.invalid/sites/workplace';

/** Picker entries. The archive site is listed as unavailable and has no records. */
export const demoSites: ReadonlyArray<{ url: string; title: string; available: boolean }> = [
  { url: demoSiteUrl, title: 'Workplace', available: true },
  { url: 'https://example.invalid/sites/workplace-archive', title: 'Workplace archive', available: false }
];

export const demoPages: ReadonlyArray<{ pageItemId: number; title: string; pageKind: 'page' | 'news' }> = [
  { pageItemId: 17, title: 'Office move FAQ', pageKind: 'page' },
  { pageItemId: 42, title: 'Expense policy update', pageKind: 'news' },
  { pageItemId: 18, title: 'Workplace health resources', pageKind: 'page' }
];

/** The example page's two writing rules; the scripted findings answer exactly these. */
export const demoRules: readonly string[] = ['Write dates as 2 October 2026.', 'Address readers as you, not as employees.'];

/** Fictional, scripted comments for the example site. */
function createSources(now: number): ReviewSource[] {
  const base = {
    siteUrl: demoSiteUrl, listId: 'fictional-site-pages', pageItemId: 42, pageKind: 'news' as const, pageTitle: 'Expense policy update',
    contextText: 'Page context (fictional): This older announcement explains receipt requirements and the expense approval process. These comments were posted more recently.'
  };
  const date = (days: number): string => new Date(now - days * 86400000).toISOString();
  return [
    {
      ...base, id: 'comment-1', commentAuthor: 'Robin Park', chunkId: 'comment-1:0', commentId: '1', kind: 'comment',
      text: 'Only an idiot would approve this policy.', createdAt: date(1)
    },
    {
      ...base, id: 'comment-2', commentAuthor: 'Morgan Kim', chunkId: 'comment-2:0', commentId: '2', kind: 'comment',
      text: 'This policy is poorly supported. Can you share the evidence?', createdAt: date(2)
    },
    {
      ...base, id: 'reply-3', commentAuthor: 'Taylor Smith', chunkId: 'reply-3:0', commentId: '3', parentCommentId: 'old-parent',
      kind: 'reply',
      text:'Stop asking these ridiculous questions and just do your job.',
      contextText: 'Earlier parent comment (outside the selected window): Could you explain the approval process?',
      createdAt: date(1)
    },
    {
      ...base, pageItemId: 18, pageTitle: 'Workplace health resources', pageKind: 'page',
      id: 'comment-4', commentAuthor: 'Alex Lee', chunkId: 'comment-4:0', commentId: '4', kind: 'comment',
      text: 'Please include access to confidential sexual health advice.',
      contextText: 'Page context (fictional): Workplace health information and confidential support resources. The comment requests access to care; it does not target another person.',
      createdAt: date(3)
    },
    {
      ...base, id: 'comment-5', commentAuthor: 'Jamie Reed', chunkId: 'comment-5:0', commentId: '5', kind: 'comment',
      text: 'This damn form keeps losing my receipts.', createdAt: date(4)
    },
    {
      ...base, id: 'comment-6', commentAuthor: 'Parker Novak', chunkId: 'comment-6:0', commentId: '6', kind: 'comment',
      text: 'Great, another brilliantly simple process.',
      contextText: 'The tone may be sincere or sarcastic; the discussion context is incomplete.',
      createdAt: date(5)
    },
    {
      ...base, id: 'comment-7', commentAuthor: 'Alex Lee', chunkId: 'comment-7:0', commentId: '7', kind: 'comment',
      text: 'Das ist schlecht begründet. Bitte erklärt die Entscheidung.', createdAt: date(10)
    }
  ];
}

/** Fictional canvases, read by the real parser so the demo shows what a live page shows. */
const demoCanvases: Record<number, unknown[]> = {
  17: [
    {
      controlType: 3, id: 'demo-image', position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      webPartData: {
        id: 'd1d91016-032f-456d-98a4-721247c305e8', title: 'Image',
        properties: { imageSource: '/sites/workplace/SiteAssets/entrance.jpg', altText: 'Office entrance and cycle parking' }
      }
    },
    { controlType: 4, id: 'demo-move', position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 1, controlIndex: 1, sectionFactor: 8 },
      innerHTML: '<p>The move to the new building starts on 11/03/2026. Floors 2 and 3 open first; floor 4 follows two weeks later.</p>' },
    { controlType: 3, id: 'demo-links', position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 2, controlIndex: 1, sectionFactor: 4 },
      webPartData: { title: 'Quick links' } },
    { controlType: 4, id: 'demo-parking', position: { layoutIndex: 1, zoneIndex: 3, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      innerHTML: '<h3>Parking</h3><p>If you keep asking the same questions about parking, you clearly have not read anything we sent.</p>' +
        '<p>Employees must collect their parking permit from their manager one week before the move.</p>' +
        '<p>Details: <a href="/sites/workplace/SitePages/Parking.aspx">click here</a>.</p>' },
    { controlType: 4, id: 'demo-questions', position: { layoutIndex: 1, zoneIndex: 4, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      innerHTML: ['<h3>Questions</h3><p>If something is unclear about the move, the floors, the desks, the parking permits or the new canteen,',
        'ask your team lead first, then write to the move team, who collect the questions every Friday and answer them in the next update,',
        'which is posted on this page and also sent by e-mail to everyone who works in the old building or in one of the two annexes,',
        'so that nobody misses a change to the plan or to the dates that were announced before the summer, and so that the questions',
        'that come up again and again can be answered once, in one place, with the floor plans, the parking rules and the contacts for each',
        'floor, instead of in many separate messages that are hard to find later.</p>'].join(' ') }
  ],
  42: [
    { controlType: 4, position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 8 },
      innerHTML: '<p>Expense claims need a receipt. The proposed process asks for the same receipt twice; please explain what benefit the second copy provides.</p><p>Stop asking these ridiculous questions and just do your job.</p>' },
    { controlType: 3, position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 2, controlIndex: 1, sectionFactor: 4 },
      webPartData: { title: 'Embedded video' } },
    { controlType: 4, position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      innerHTML: '<h3>Next steps</h3><p>Finance will review the duplicate step with the process owners. Read more about expense claims <a href="/sites/finance/SitePages/Expenses.aspx">here</a>.</p>' },
    { controlType: 3, position: { layoutIndex: 1, zoneIndex: 3, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      webPartData: { title: 'News' } }
  ],
  18: [
    { controlType: 3, position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 6 },
      webPartData: { title: 'Image' } },
    { controlType: 4, position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 2, controlIndex: 1, sectionFactor: 6 },
      innerHTML: '<h2>Support</h2><p>Workplace health resources include confidential advice and support. Ask the wellbeing team about available services.</p>' },
    { controlType: 3, position: { layoutIndex: 1, zoneIndex: 2, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
      webPartData: { title: 'Contact card' } }
  ]
};

function demoPage(pageItemId: number, title: string, now: number): { text: string; omittedParts: string[]; page: PageVersion } {
  const canvas = JSON.stringify(demoCanvases[pageItemId] || []);
  const content = typeof document === 'undefined' ? undefined : sharePointPageContent(canvas, document, title);
  const version = pageItemId === 42 ? '4.1' : pageItemId === 17 ? '5.2' : '2.0';
  return {
    text: content ? content.text : title,
    omittedParts: content ? content.omittedParts : [],
    page: {
      version,
      state: pageItemId === 18 ? 'published' : 'draft',
      modified: new Date(now - 86400000).toISOString(),
      ...(content?.structure ? { structure: content.structure, media: extractMedia(canvas, content.structure, document) } : {}),
      // The example news post has no description of its own.
      ...(pageItemId === 42 ? { news: { description: false, banner: true } } : {})
    }
  };
}

export class FixtureContentService implements ISharePointContentService {
  public async read(request: ScanRequest): Promise<{ sources: ReviewSource[]; coverage: ReviewCoverage }> {
    // The fictional records belong to the example site; any other site URL is rejected.
    if (request.siteUrl.replace(/\/+$/, '').toLowerCase() !== demoSiteUrl) throw new Error('DEMO_SITE_NOT_AVAILABLE');
    const now = Date.now();
    let sources = createSources(now);
    const requestedPageMissing = request.pageItemId !== undefined && !demoPages.some(page => page.pageItemId === request.pageItemId);
    // A Page review defaults to page 17; a Comments review covers the pages with comments.
    const inspectedPages = request.mode === 'page'
      ? demoPages.filter(page => page.pageItemId === (request.pageItemId === undefined ? 17 : request.pageItemId))
      : demoPages.filter(page => page.pageItemId !== 17 &&
        (request.pageKind === 'both' || page.pageKind === request.pageKind) &&
        (request.pageItemId === undefined || page.pageItemId === request.pageItemId));
    if (request.mode === 'page') {
      sources = inspectedPages.map(page => {
        // The text and the map come from the same fictional canvas, read by the real parser.
        const content = demoPage(page.pageItemId, page.title, now);
        return {
          siteUrl: demoSiteUrl, listId: 'fictional-site-pages', pageItemId: page.pageItemId, pageKind: page.pageKind, pageTitle: page.title,
          id: `page-${page.pageItemId}`, chunkId: `page-${page.pageItemId}:0`, kind: 'page' as const,
          createdAt: new Date(now - (page.pageItemId === 42 ? 180 : 90) * 86400000).toISOString(),
          text: content.text, omittedParts: content.omittedParts, page: content.page
        };
      });
    } else {
      sources = sources.filter(source => new Date(source.createdAt).getTime() >= now - request.lookbackDays * 86400000 &&
        inspectedPages.some(page => page.pageItemId === source.pageItemId));
    }
    sources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      sources,
      coverage: {
        completedPages: inspectedPages.length, partialPages: 0, failedSources: requestedPageMissing ? 1 : 0,
        retrieved: sources.length, matching: sources.length, displayed: sources.length, analyzed: 0,
        operationsAttempted: 0, httpEnvelopes: 0, isPartial: true
      }
    };
  }
}

interface IScriptedFinding { source: string; category: CategoryId; excerpt: string; explanation: string; context: boolean; }

export class FixtureAnalysisClient implements IAnalysisClient {
  public async analyze(sources: ReviewSource[], categories: CategoryId[], rules: string[]): Promise<AnalysisResult> {
    const scripted: IScriptedFinding[] = [
      {
        source: 'comment-1', category: 'insult', excerpt: 'Only an idiot',
        explanation: 'Targets a person, not the policy.', context: false
      },
      {
        source: 'reply-3', category: 'aggressive', excerpt: 'Stop asking these ridiculous questions and just do your job.',
        explanation: 'May shut down the discussion.', context: true
      },
      {
        source: 'comment-5', category: 'profanity', excerpt: 'damn',
        explanation: 'Frustration with a form, not an attack.', context: false
      },
      {
        source: 'comment-6', category: 'aggressive', excerpt: 'Great, another brilliantly simple process.',
        explanation: '', context: true
      },
      {
        source: 'page-42', category: 'aggressive', excerpt: 'Stop asking these ridiculous questions and just do your job.',
        explanation: 'May discourage legitimate questions.', context: false
      },
      { source: 'page-17', category: 'rule1', excerpt: 'starts on 11/03/2026', explanation: '', context: false },
      {
        source: 'page-17', category: 'aggressive', excerpt: 'you clearly have not read anything we sent',
        explanation: 'Blames readers for asking again.', context: false
      },
      { source: 'page-17', category: 'rule2', excerpt: 'Employees must collect their parking permit', explanation: '', context: false }
    ];
    const findings: ReviewFinding[] = [];
    scripted.forEach(item => {
      const source = sources.find(candidate => candidate.id === item.source);
      if (!source) return;
      const finding: ReviewFinding = {
        id: `${source.id}:${item.category}`, sourceId: source.id, chunkId: source.chunkId, categoryId: item.category,
        excerpt: item.excerpt, explanation: item.explanation, needsContext: item.context, offset: source.text.indexOf(item.excerpt)
      };
      if (finding.offset! >= 0 && isFindingValid(finding, sources, categories)) findings.push(finding);
    });
    // The scripted rule findings answer the example's own rules only. With other rules, the rule findings are
    // dropped, and the sources count as not reviewed when a rule check is selected.
    const preparedRules = rules.every((rule, index) => rule === demoRules[index]);
    return {
      findings: preparedRules ? findings : findings.filter(finding => !isRuleId(finding.categoryId)),
      decisions: completeDecisions(sources, sources.map(source => ({
        sourceId: source.id,
        chunkId: source.chunkId,
        status: preparedRules || !categories.some(isRuleId) ? 'reviewed' : 'notReviewed'
      }))),
      provenance: 'fixture'
    };
  }
}
