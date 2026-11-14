// Visual preview harness (opt-in): renders the card through the real component lifecycle in jsdom
// and writes static HTML pages with the compiled CSS to temp/preview/, one per scenario, plus an
// index. Open temp/preview/index.html in a browser to check presets × themes × modes × languages
// without a tenant. Run with:  npm run preview
//
// Images: the Commons search runs for real (from Node), so the pages show the photo the card would
// pick. Speech and the Copilot bridge are not available in the static pages.

import { beforeAll, describe, expect, it, vi, type Mock } from 'vitest';
import fs from 'node:fs';
import https from 'node:https';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';

vi.mock('../lib/images', async (importOriginal: () => Promise<Record<string, unknown>>) => ({ ...(await importOriginal()), searchImages: vi.fn() }));

import { MockCopilotComponentContext } from '@microsoft/sp-copilot-component/dist/test-api';

import CosmoPoliteCopilotComponent from '../CosmoPoliteCopilotComponent';
import { queryVariants, searchImages, searchPlan, type IImageResult, type ISearchOptions } from '../lib/images';
import { allCss } from './css';
import { SCENARIOS } from './scenarios';

const OUT: string = path.resolve('temp/preview');
// Copilot renders the component inside SharePoint's page shell: full-height wrappers, a <body> that
// is its own scroll container, and a left-to-right Fluent UI provider with an explicit text-align:
// left. The pages reproduce that shell (styles as served by SharePoint), so they show what the
// tenant shows: an RTL card must not inherit the alignment, and nothing may scroll inside the iframe.
const HOST_SHELL_CSS: string =
  'html,body{margin:0;padding:0;height:100%}body{height:100vh;overflow-x:hidden;overflow-y:auto}' +
  '.SPPageChrome{height:100%;display:flex;flex-direction:column}' +
  '.spAppAndPropertyPanelContainer,.SPPageChrome-app{height:100%;display:flex;flex-grow:1}' +
  '.SPPageChrome-app>div{display:flex;flex-grow:1;max-width:100%}' +
  // Fluent's provider and its two inner wrappers span the width (atomic classes in the tenant).
  '.fui-FluentProvider,.fui-FluentProvider>div,.fui-FluentProvider>div>div{flex-grow:1;width:100%}';
const HOST_WRAPPER_OPEN: string =
  '<div class="SPPageChrome"><div class="spAppAndPropertyPanelContainer"><div class="SPPageChrome-app">' +
  '<div dir="ltr" class="fui-FluentProvider" style="text-align:left"><div><div>';
const HOST_WRAPPER_CLOSE: string = '</div></div></div></div></div></div>';
const run: boolean = !!process.env.COSMO_PREVIEW;

/** A minimal fetch for the card's real image search, running in Node (jsdom has no fetch). */
function nodeFetch(url: string): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'CosmoPolite-SPFx-Copilot-Sample/1.0 (preview)' } }, (res: IncomingMessage) => {
        res.setEncoding('utf8'); // multi-byte characters (Türk, Ελληνικά) must not split across chunks
        let body: string = '';
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () => {
          const status: number = res.statusCode || 0;
          resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve().then(() => JSON.parse(body)) });
        });
      })
      .on('error', reject);
  });
}

function searchKey(queries: string[], opts: ISearchOptions): string {
  return JSON.stringify([queries[0] || '', opts.sources || [], opts.wikipediaTitle || '']);
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

(run ? describe : describe.skip)('preview pages', () => {
  const images: Record<string, IImageResult[] | undefined> = {};

  beforeAll(async () => {
    // Sequential and cached in temp/preview/images.json: Commons rate-limits bursts. A failed
    // lookup just shows the placeholder.
    fs.mkdirSync(OUT, { recursive: true });
    const cacheFile: string = path.join(OUT, 'images.json');
    if (fs.existsSync(cacheFile)) {
      Object.assign(images, JSON.parse(fs.readFileSync(cacheFile, 'utf8')));
    }
    // The card's real search (all sources, in the agent's order), run once per distinct request.
    const actual: { searchImages: typeof searchImages } = await vi.importActual('../lib/images');
    const g: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
    const ownFetch: unknown = g.fetch;
    g.fetch = nodeFetch;
    const known: string[] = Object.keys(images);
    const found: Array<[string, IImageResult[]]> = [];
    for (const sc of SCENARIOS) {
      const opts: ISearchOptions = { sources: searchPlan(sc.props.imageSource), wikipediaTitle: sc.props.wikipediaTitle };
      const queries: string[] = queryVariants(sc.props.imageQuery, sc.props.title);
      const key: string = searchKey(queries, opts);
      if (known.indexOf(key) !== -1) {
        continue;
      }
      known.push(key);
      found.push([key, await actual.searchImages(queries, opts).catch(() => [] as IImageResult[])]);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
    }
    found.forEach(([key, list]: [string, IImageResult[]]) => {
      images[key] = list;
    });
    g.fetch = ownFetch;
    fs.writeFileSync(cacheFile, JSON.stringify(images, undefined, 2));
    // The diagnostics drawer is a lazy import(); load it once up front so every page that shows it
    // has it in the static markup (the first import would otherwise finish after the page is written).
    await import(/* webpackChunkName: "cosmopolite-devpanel" */ '../lib/diagnostics');
    (searchImages as Mock).mockImplementation((queries: string[], opts: ISearchOptions) =>
      Promise.resolve(images[searchKey(queries, opts || {})] || [])
    );
  }, 180000);

  it('writes one page per scenario', async () => {
    const css: string = allCss();
    const links: string[] = [];

    for (const s of SCENARIOS) {
      window.sessionStorage.clear();
      window.localStorage.clear();
      document.documentElement.removeAttribute('lang');
      const domElement: HTMLElement = document.createElement('div');
      document.body.replaceChildren(domElement);
      const context: MockCopilotComponentContext = new MockCopilotComponentContext({ domElement, hostContext: s.host });
      const component: CosmoPoliteCopilotComponent = new CosmoPoliteCopilotComponent();
      await context.initializeAsync(component, s.props);
      (component as unknown as { _internalRender(): void })._internalRender();
      await new Promise((resolve) => setTimeout(resolve, 0)); // let the mocked image search resolve and swap in
      const bg: string = s.host.theme === 'dark' ? '#1f1f1f' : '#ffffff';
      const file: string = `${slug(s.name)}.html`;
      fs.writeFileSync(
        path.join(OUT, file),
        `<!doctype html><html lang="${document.documentElement.lang}"><head><meta charset="utf-8">` +
          `<meta name="viewport" content="width=device-width"><title>${s.name}</title>` +
          `<style>${HOST_SHELL_CSS}body{background:${bg}}${css}</style>` +
          // What the bundle injects into the head when it loads (see lib/hostDocument.ts).
          `${document.getElementById('cosmo-boot')?.outerHTML || ''}</head><body>${HOST_WRAPPER_OPEN}${domElement.outerHTML}${HOST_WRAPPER_CLOSE}` +
          // Static page: do what the card does when a photo has decoded (it materialises in).
          `<script>document.querySelectorAll('img[data-loading]').forEach(function(i){function s(){i.removeAttribute('data-loading')}` +
          `i.complete?s():i.addEventListener('load',s)})</script></body></html>`
      );
      links.push(
        `<figure><figcaption>${s.name}</figcaption><iframe src="${file}" width="${s.width}" height="${s.host.displayMode === 'fullscreen' ? 1100 : 520}"></iframe></figure>`
      );
    }

    fs.writeFileSync(
      path.join(OUT, 'index.html'),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CosmoPolite preview</title>` +
        `<style>body{font:14px system-ui;margin:24px;background:#e9e9e9}figure{margin:0 0 32px}figcaption{margin:0 0 6px;font-weight:600}iframe{border:1px solid #999;background:#fff;display:block}</style>` +
        `</head><body><h1>CosmoPolite preview</h1>${links.join('')}</body></html>`
    );
    expect(fs.existsSync(path.join(OUT, 'index.html'))).toBe(true);
  }, 180000);
});
