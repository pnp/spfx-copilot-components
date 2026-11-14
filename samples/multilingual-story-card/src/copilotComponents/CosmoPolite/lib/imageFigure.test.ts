import { describe, expect, it, vi, type Mock } from 'vitest';
vi.mock('./images', async (importOriginal: () => Promise<Record<string, unknown>>) => ({ ...(await importOriginal()), searchImages: vi.fn() }));

import { isLandscape, searchImages, type IImageResult } from './images';
import { englishStrings } from './strings';
import { ImageFigure } from './imageFigure';

const photo = (name: string, width: number, height: number): IImageResult => ({
  src: `https://thumb.wikimedia.org/${name}.jpg`,
  width,
  height,
  pageUrl: undefined,
  artist: name,
  license: undefined,
  licenseUrl: undefined
});

const PORTRAIT: IImageResult = photo('portrait', 800, 1206);
const SQUARE: IImageResult = photo('square', 800, 820);
const LANDSCAPE: IImageResult = photo('landscape', 800, 533);

function figure(): ImageFigure {
  return new ImageFigure({
    query: 'Tokyo Asakusa',
    title: '東京',
    alt: undefined,
    lang: 'ja',
    strings: englishStrings(),
    link: (label: string) => document.createTextNode(label) as unknown as HTMLElement
  });
}

async function loaded(candidates: IImageResult[], preferLandscape: boolean = false): Promise<ImageFigure> {
  (searchImages as Mock).mockResolvedValue(candidates);
  const f: ImageFigure = figure();
  f.setPreferLandscape(preferLandscape);
  f.load();
  await Promise.resolve();
  await Promise.resolve();
  return f;
}

const src = (f: ImageFigure): string | undefined => f.element.querySelector('img')?.getAttribute('src') || undefined;

describe('isLandscape', () => {
  it('needs clearly wider than tall (5:4)', () => {
    expect(isLandscape(LANDSCAPE)).toBe(true);
    expect(isLandscape(SQUARE)).toBe(false);
    expect(isLandscape(PORTRAIT)).toBe(false);
  });
});

describe('ImageFigure', () => {
  it('shows the best-ranked photo in ordinary layouts', async () => {
    const f: ImageFigure = await loaded([PORTRAIT, LANDSCAPE]);
    expect(src(f)).toBe(PORTRAIT.src);
    expect(f.element.querySelector('img')?.hasAttribute('data-crop')).toBe(false);
  });

  it('takes the first landscape photo for Magazine', async () => {
    const f: ImageFigure = await loaded([PORTRAIT, SQUARE, LANDSCAPE], true);
    expect(src(f)).toBe(LANDSCAPE.src);
  });

  it('swaps in place when the design changes to Magazine and back', async () => {
    const f: ImageFigure = await loaded([PORTRAIT, LANDSCAPE]);
    f.setPreferLandscape(true);
    expect(src(f)).toBe(LANDSCAPE.src);
    f.setPreferLandscape(false);
    expect(src(f)).toBe(PORTRAIT.src);
  });

  it('crops to 3:2 only when every photo is portrait', async () => {
    const f: ImageFigure = await loaded([PORTRAIT, SQUARE], true);
    expect(src(f)).toBe(PORTRAIT.src);
    expect(f.element.querySelector('img')?.hasAttribute('data-crop')).toBe(true);
  });

  it('shows no figure when nothing was found', async () => {
    const f: ImageFigure = await loaded([]);
    expect(f.element.hidden).toBe(true);
    expect(f.element.children.length).toBe(0);
  });

  it('falls through to the next candidate when a photo fails to load', async () => {
    const f: ImageFigure = await loaded([LANDSCAPE, PORTRAIT]);
    f.element.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(src(f)).toBe(PORTRAIT.src);
    f.element.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(f.element.hidden).toBe(true);
  });
});
