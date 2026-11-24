import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SavedPagePreview, savedBlockText, previewImageUrl } from '../SavedPagePreview';
import type { PageOutlineItem, ReviewSource } from '../../domain/contracts';
import type { ImageUse } from '../../comparison/media';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
const source: ReviewSource = { id: 'p', chunkId: 'p:0', siteUrl: 'https://tenant.sharepoint.com/sites/test', listId: 'pages', pageItemId: 1,
  pageKind: 'page', kind: 'page', pageTitle: 'Saved page', createdAt: '2026-10-18T10:00:00Z', text: 'Title\n\nFirst.\n\nSecond.' };
const block: PageOutlineItem = { id: 'text', kind: 'text', label: 'Text', start: 7, end: 22 };
const image: ImageUse = { id: 'image', blockId: 'image', section: 1, column: 1, role: 'image', state: 'configured', metadata: 'unknown', url: '/sites/test/a.jpg' };

describe('Saved page preview boundaries', () => {
  it('reconstructs a range across out-of-order parts without joining over a gap', () => {
    const parts: ReviewSource[] = [
      { ...source, text: source.text.slice(12), part: { index: 2, count: 2, offset: 12 } },
      { ...source, text: source.text.slice(0, 12), part: { index: 1, count: 2, offset: 0 } }
    ];
    expect(savedBlockText(parts, block)).toEqual({ text: 'First.\n\nSecond.', complete: true });
    expect(savedBlockText(parts.slice(0, 1), block)).toEqual({ text: '', complete: false });
    expect(savedBlockText(parts.slice(1), block)).toEqual({ text: 'First', complete: false });
  });
  it('allows same-tenant image files and rejects external, active, default-thumbnail and unavailable sources', () => {
    expect(previewImageUrl(image, source.siteUrl, false)).toBe('https://tenant.sharepoint.com/sites/test/a.jpg');
    // eslint-disable-next-line no-script-url -- Malicious source fixture: the renderer must reject it.
    ['https://external.example/a.jpg', 'javascript:alert(1)', 'https://name:password@tenant.sharepoint.com/a.jpg', '/a.svg', '/_layouts/15/download.aspx'].forEach(url => {
      expect(previewImageUrl({ ...image, url }, source.siteUrl, false)).toBeUndefined();
    });
    expect(previewImageUrl({ ...image, role: 'thumbnail', url: '/_layouts/15/images/sleektemplateimagetile.jpg' }, source.siteUrl, false)).toBeUndefined();
    expect(previewImageUrl({ ...image, state: 'unknown' }, source.siteUrl, false)).toBeUndefined();
    expect(previewImageUrl(image, source.siteUrl, true)?.startsWith('data:')).toBe(true);
  });
  it('renders escaped saved text and handles image failure without replacing a banner with a thumbnail', async () => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
    const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
    const labels = new Proxy({}, { get: (_target, key) => String(key) }) as Record<string, string>;
    const strings = new Proxy({}, { get: (_target, key) => key === 'Preview' || key === 'Comparison' ? labels : String(key) }) as IContentLensStrings;
    const text = '<script>alert(1)</script>', onSelect = jest.fn();
    const page: ReviewSource = { ...source, text, page: { version: '1.0', state: 'published', structure: { words: 1, textBlocks: 1, webParts: 1, issues: [], sections: [{ vertical: false, columns: [[{ ...block, start: 0, end: text.length }, { id: 'image', kind: 'webPart', label: 'Image' }]] }] },
      media: { images: [image, { ...image, id: 'thumb', blockId: 'thumbnail', role: 'thumbnail', url: '/other.jpg' }], links: [], omitted: [] } } };
    try {
      await act(async () => root.render(<SavedPagePreview sources={[page]} strings={strings} demo={false} width={500} selected="text" onSelect={onSelect} />));
      expect(container.querySelector('script')).toBeNull(); expect(container.textContent).toContain(text);
      expect(container.querySelectorAll('img')).toHaveLength(1);
      expect(container.querySelector('[data-preview-block="text"]')?.getAttribute('data-highlighted')).toBe('true');
      await act(async () => container.querySelector('button')!.click()); expect(onSelect).toHaveBeenCalledWith('text');
      await act(async () => container.querySelector('img')!.dispatchEvent(new Event('error')));
      expect(container.querySelector('img')).toBeNull(); expect(container.textContent).toContain('imageUnavailable');
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
