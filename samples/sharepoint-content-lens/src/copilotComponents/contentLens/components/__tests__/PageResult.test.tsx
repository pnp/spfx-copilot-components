import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PageResult } from '../PageResult';
import type { CategoryId, ReviewSource } from '../../domain/contracts';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
const labels = new Proxy({}, { get: (_target, key) => String(key) });
const strings = new Proxy({}, { get: (_target, key) => key === 'Preview' || key === 'Comparison' ? labels : String(key) }) as IContentLensStrings;
const source: ReviewSource = { id: 'p', chunkId: 'p:0', siteUrl: 'https://tenant.sharepoint.com/sites/test',
  sourceUrl: 'https://tenant.sharepoint.com/sites/test/SitePages/Page.aspx', listId: '11111111-1111-1111-1111-111111111111',
  pageItemId: 1, pageKind: 'page', kind: 'page', pageTitle: 'Title', createdAt: '2026-10-18T10:00:00Z', text: 'First block. Second block.',
  page: { version: '3.0', state: 'published', structure: { words: 4, textBlocks: 2, webParts: 0, issues: [],
    sections: [{ vertical: false, columns: [[{ id: 'first', kind: 'text', label: 'First', start: 0, end: 12 }, { id: 'second', kind: 'text', label: 'Second', start: 13, end: 26 }]] }] } } };

describe('Page result', () => {
  let root: Root, container: HTMLDivElement;
  beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true }); });
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); document.body.replaceChildren(); });

  it('chooses no block on a page without findings, and the block a reader selects', async () => {
    await act(async () => root.render(<PageResult strings={strings} labels={labels as Record<CategoryId, string>} descriptions={labels as Record<CategoryId, string>}
      sources={[source]} findings={[]} decisions={[]} rules={[]} groups={[]} demo={true} full={false} width={640} now={Date.parse('2026-10-19T10:00:00Z')}
      failed={false} headingRef={React.createRef<HTMLHeadingElement>()} onCheckPart={() => undefined} onNewCheck={() => undefined} onOpenLink={() => undefined} />));
    const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-testid="map-block"]'));
    expect(blocks).toHaveLength(2);
    expect(blocks.map(block => block.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
    await act(async () => blocks[1].click());
    expect(Array.from(container.querySelectorAll('[data-testid="map-block"]')).map(block => block.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
  });
});
