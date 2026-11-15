import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { CommentsResult, type ICommentsResultProps } from '../CommentsResult';
import type { ReviewSource } from '../../domain/contracts';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
it('keeps loaded parents before replies, retains unflagged context, and never invents authors or missing parents', async () => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  const labels = new Proxy({}, { get: (_target, key) => String(key) }) as Record<string, string>;
  const strings = new Proxy({}, { get: (_target, key) => key === 'Preview' || key === 'Comparison' ? labels : String(key) }) as IContentLensStrings;
  const parent: ReviewSource = { id: 'p', chunkId: 'p:0', siteUrl: 'https://tenant.sharepoint.com', listId: 'pages', pageItemId: 1,
    pageTitle: 'Discussion', pageKind: 'news', kind: 'comment', commentId: '1', commentAuthor: '<img src=x>', text: 'Parent question', createdAt: '2026-10-18T10:00:00Z' };
  const reply: ReviewSource = { ...parent, id: 'r', chunkId: 'r:0', commentId: '2', kind: 'reply', parentCommentId: '1', commentAuthor: undefined, text: 'Reply wording', createdAt: '2026-10-18T11:00:00Z' };
  const orphan: ReviewSource = { ...reply, id: 'o', chunkId: 'o:0', commentId: '3', parentCommentId: 'missing', text: 'Other reply' };
  const props: ICommentsResultProps = { strings, labels: labels as ICommentsResultProps['labels'], descriptions: labels as ICommentsResultProps['descriptions'],
    headingRef: React.createRef(), siteTitle: 'Site', scope: '7 days', demo: false, total: 3, reviewed: 2, clean: [parent], pending: [orphan], unreviewed: [],
    flagged: [{ source: reply, findings: [{ id: 'f', sourceId: 'r', chunkId: 'r:0', categoryId: 'aggressive', excerpt: 'Reply wording', explanation: 'Consider the question.', needsContext: true }] }],
    partlyReviewed: new Set(), canReviewMore: true, canCheckMore: false, capped: false, busy: false, coolingDown: false, expanded: [], pages: {},
    onReviewMore: jest.fn(), onCheckMore: jest.fn(), onRetry: jest.fn(), onToggle: jest.fn(), onPageChange: jest.fn(), onOpenLink: jest.fn(), onNewCheck: jest.fn() };
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<CommentsResult {...props} />));
    const messages = Array.from(container.querySelectorAll('article')).map(article => article.textContent || '');
    expect(messages).toHaveLength(3); expect(messages[0]).toContain('Parent question'); expect(messages[1]).toContain('Reply wording');
    expect(messages[1]).toContain('anonymous'); expect(messages[1]).not.toContain('parentMissing'); expect(messages[2]).toContain('parentMissing');
    expect(container.querySelector('img')).toBeNull(); expect(messages[0]).toContain('<img src=x>');
    expect(container.querySelector('aside')?.textContent).toContain('Consider the question.');
    expect(container.textContent).not.toContain('Replay');
  } finally { await act(async () => root.unmount()); container.remove(); }
});
