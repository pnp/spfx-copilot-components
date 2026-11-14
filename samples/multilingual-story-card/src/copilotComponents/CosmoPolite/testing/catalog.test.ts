// Pattern catalog (opt-in, like the preview): every piece of src/ui with its variants, each in
// light and dark × left-to-right and right-to-left, one static page per piece in
// temp/preview/catalog/<level>/<piece>.html, plus an index grouped atoms → molecules → organisms →
// templates → pages (the card scenarios of the preview). Run with:  npm run preview

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import type { Action, IActionRunner } from '../../../ui/actions';
import { englishStrings } from '../lib/strings';
import ar from '../lib/strings/ar';
import { CATALOG, LEVELS, type ICatalogContext, type ICatalogEntry, type IVariant, type Level } from './catalog';
import { allCss } from './css';
import { SCENARIOS } from './scenarios';

const OUT: string = path.resolve('temp/preview/catalog');
const run: boolean = !!process.env.COSMO_PREVIEW;

const CELLS: Array<Pick<ICatalogContext, 'theme' | 'dir' | 'lang'>> = [
  { theme: 'light', dir: 'ltr', lang: 'en' },
  { theme: 'light', dir: 'rtl', lang: 'ar' },
  { theme: 'dark', dir: 'ltr', lang: 'en' },
  { theme: 'dark', dir: 'rtl', lang: 'ar' }
];

const SAMPLES: Record<string, ICatalogContext['sample']> = {
  en: {
    title: 'Vienna, a city that takes its time',
    sentences: ['Vienna is a city that takes its time.', 'In the coffee houses people sit for hours over a melange.', 'Nobody looks at the clock.'],
    name: 'Jorge Franganillo',
    alt: 'Evening light over the hills'
  },
  ar: {
    title: 'القاهرة، مدينة لا تنام',
    sentences: ['القاهرة مدينة لا تنام.', 'على ضفاف النيل يلتقي القديم بالجديد.', 'في المساء تمتلئ المقاهي بالناس.'],
    name: 'أحمد حسن',
    alt: 'ضوء المساء فوق التلال'
  }
};

const RUNNER: IActionRunner = { run: (_action: Action) => Promise.resolve(true) };

const LEVEL_TEXT: Record<Level, string> = {
  atoms: 'The smallest pieces: one element, one job.',
  molecules: 'A few atoms working as one control.',
  organisms: 'Sections of an interface, built from molecules and atoms.',
  templates: 'Layouts that place organisms; state lives in data attributes.'
};

// Catalog chrome only; the pieces are styled by their own stylesheets (allCss).
const CHROME: string =
  'body{margin:0;padding:24px;font:14px/1.45 system-ui,sans-serif;background:#e9e9e9;color:#1b1b1b}' +
  'h1{margin:0 0 4px;font-size:22px}h2{margin:32px 0 8px;font-size:17px}p.lead{margin:0 0 16px;color:#555}' +
  'a{color:#0f5ea8}nav{margin-bottom:16px}' +
  '.variant{margin:0 0 28px}.variant>h2{margin:0 0 8px;font-size:15px}' +
  '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
  '.cell{margin:0;display:flex;flex-direction:column;border-radius:8px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.12)}' +
  '.cell>figcaption{padding:4px 10px;font:12px system-ui;background:#d6d6d6;color:#333}' +
  '.stage{flex:1;padding:16px;background:var(--color-background-primary);color:var(--color-text-primary);font-family:var(--font-sans);font-size:var(--font-text-md-size)}' +
  // A fullscreen card fills the viewport by design; inside a catalog cell that is only noise.
  '.stage [data-mode="fullscreen"]{min-block-size:0}' +
  'ul.pieces{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}' +
  'ul.pieces li{background:#fff;border-radius:8px;padding:10px 12px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}' +
  'ul.pieces small{display:block;color:#555}';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function page(title: string, body: string, css: string): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">` +
    `<title>${escape(title)}</title><style>${css}${CHROME}</style></head><body>${body}</body></html>`
  );
}

function renderEntry(entry: ICatalogEntry, index: number): string {
  return entry.variants
    .map((variant: IVariant, v: number) => {
      const cells: string = CELLS.map((cell: Pick<ICatalogContext, 'theme' | 'dir' | 'lang'>, c: number) => {
        const ctx: ICatalogContext = {
          ...cell,
          t: cell.lang === 'ar' ? ar : englishStrings(),
          sample: SAMPLES[cell.lang],
          runner: RUNNER,
          id: `cat-${index}-${v}-${c}`
        };
        const stage: HTMLElement = document.createElement('div');
        stage.className = 'tokens presets stage';
        stage.setAttribute('data-theme', cell.theme);
        stage.setAttribute('dir', cell.dir);
        stage.setAttribute('lang', cell.lang);
        stage.append(variant.render(ctx));
        return `<figure class="cell"><figcaption>${cell.theme} · ${cell.dir}</figcaption>${stage.outerHTML}</figure>`;
      }).join('');
      return `<section class="variant"><h2>${escape(variant.label)}</h2><div class="grid">${cells}</div></section>`;
    })
    .join('');
}

(run ? describe : describe.skip)('pattern catalog', () => {
  it('writes one page per piece and an index by level', async () => {
    const css: string = allCss();
    LEVELS.forEach((level: Level) => fs.mkdirSync(path.join(OUT, level), { recursive: true }));

    CATALOG.forEach((entry: ICatalogEntry, i: number) => {
      fs.writeFileSync(
        path.join(OUT, entry.level, `${entry.name}.html`),
        page(
          `${entry.name} · ${entry.level}`,
          `<nav><a href="../index.html">Catalog</a> › ${entry.level}</nav><h1>${escape(entry.name)}</h1>` +
            `<p class="lead">${escape(entry.description)} <small>src/ui/${escape(entry.source)}</small></p>${renderEntry(entry, i)}`,
          css
        )
      );
    });

    const levels: string = LEVELS.map(
      (level: Level) =>
        `<h2>${level[0].toUpperCase()}${level.slice(1)}</h2><p class="lead">${LEVEL_TEXT[level]}</p><ul class="pieces">` +
        CATALOG.filter((e: ICatalogEntry) => e.level === level)
          .map((e: ICatalogEntry) => `<li><a href="${level}/${e.name}.html">${e.name}</a><small>${escape(e.description)}</small></li>`)
          .join('') +
        '</ul>'
    ).join('');
    const pages: string =
      '<h2>Pages</h2><p class="lead">The CosmoPolite card with real agent input (the preview scenarios).</p><ul class="pieces">' +
      SCENARIOS.map((s: { name: string }) => `<li><a href="../${slug(s.name)}.html">${escape(s.name)}</a></li>`).join('') +
      '</ul>';
    fs.writeFileSync(
      path.join(OUT, 'index.html'),
      page('CosmoPolite pattern catalog', `<h1>Pattern catalog</h1><p class="lead">src/ui, by atomic level: light and dark, left-to-right and right-to-left.</p>${levels}${pages}`, '')
    );

    // Opened disclosures fire 'toggle' asynchronously: let those handlers run while the DOM exists.
    await new Promise<void>((resolve: () => void) => setTimeout(resolve, 20));
    expect(fs.existsSync(path.join(OUT, 'index.html'))).toBe(true);
    CATALOG.forEach((entry: ICatalogEntry) => expect(fs.existsSync(path.join(OUT, entry.level, `${entry.name}.html`))).toBe(true));
  });
});
