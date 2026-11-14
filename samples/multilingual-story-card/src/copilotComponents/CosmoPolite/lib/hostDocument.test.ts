import { afterEach, describe, expect, it } from 'vitest';
import { applyDocumentMode, DocumentLang, prepareHostDocument, stabilizeFluidWidth } from './hostDocument';

describe('DocumentLang', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
  });

  it('claims <html lang/dir> over the host’s user setting and puts it back on release', () => {
    document.documentElement.setAttribute('lang', 'en-US');
    document.documentElement.setAttribute('dir', 'ltr');
    const doc: DocumentLang = new DocumentLang();
    doc.claim('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(doc.hostLang).toBe('en-US');

    doc.claim('de'); // a rebuild in another language: still the host's original is remembered
    expect(doc.hostLang).toBe('en-US');

    doc.release();
    expect(document.documentElement.getAttribute('lang')).toBe('en-US');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('removes the attributes again when the host had none', () => {
    const doc: DocumentLang = new DocumentLang();
    doc.claim('fi');
    doc.release();
    expect(document.documentElement.hasAttribute('lang')).toBe(false);
    expect(document.documentElement.hasAttribute('dir')).toBe(false);
  });
});

describe('prepareHostDocument', () => {
  afterEach(() => {
    document.getElementById('cosmo-boot')?.remove();
  });

  // The host sizes the frame to the document. With a minimum height of 100 % the document could
  // never measure less than the frame, so any brief growth stuck as empty space below the card.
  it('lets the document be exactly as tall as the card, so the frame can shrink again', () => {
    prepareHostDocument();
    const css: string = document.getElementById('cosmo-boot')?.textContent || '';
    expect(css).not.toMatch(/min-height/);
    expect(css).not.toMatch(/height:\s*auto\s*!important/);
    expect(css).toContain(':root,:root>body{height:auto;');
    // Inline: no scrollbar taking width while the frame catches up with the card (flicker).
    expect(css).toContain(':root[data-cosmo-mode="inline"]{scrollbar-width:none}');
    // SharePoint's grey skeleton stays hidden.
    expect(css).toContain('rect[id^="SPPortableComponentApplication"]');
  });

  it('runs once per document', () => {
    prepareHostDocument();
    prepareHostDocument();
    expect(document.querySelectorAll('#cosmo-boot')).toHaveLength(1);
  });
});

describe('applyDocumentMode', () => {
  it('marks <html> with the mode, so only inline hides its scrollbar', () => {
    applyDocumentMode('inline');
    expect(document.documentElement.getAttribute('data-cosmo-mode')).toBe('inline');
    applyDocumentMode('fullscreen');
    expect(document.documentElement.getAttribute('data-cosmo-mode')).toBe('fullscreen');
    document.documentElement.removeAttribute('data-cosmo-mode');
  });
});

describe('stabilizeFluidWidth', () => {
  const setWidth = (width: number): void => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  };

  // A scrollbar in Copilot's widget frame (15 px) must not change the fluid sizes: the card got
  // 1 px shorter when narrower, and Copilot and the card resized each other endlessly.
  it('follows real width changes but ignores a scrollbar coming and going', () => {
    stabilizeFluidWidth(); // once per document: a no-op if the boot style already started it
    const vw = (): string => document.documentElement.style.getPropertyValue('--card-vw');
    setWidth(720);
    expect(vw()).toBe('7.2px');
    setWidth(705);
    expect(vw()).toBe('7.2px');
    setWidth(720);
    expect(vw()).toBe('7.2px');
    setWidth(1100); // fullscreen or a wider panel
    expect(vw()).toBe('11px');
  });
});
