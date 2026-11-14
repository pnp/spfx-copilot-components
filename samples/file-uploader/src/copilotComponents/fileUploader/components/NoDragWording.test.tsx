import * as React from 'react';
import { act } from 'react-dom/test-utils';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import type { IDroppedFile } from '../models/filing';
import { FILING_LAYOUTS } from './FilingInline';
import { RECENT_LAYOUTS } from './RecentInline';
import { StoreStartingApp } from './StoreStartingApp';
import { StoreUnavailableApp } from './StoreUnavailableApp';
import { flush, IScreen, IScreenOptions, layoutOf, mount, renderApp, setLiveMode } from './testHelpers';

/**
 * todo.md 8.8 L10, Kurt's ruling: "if dragging is not a supported action,
 * then it should not be shown." In Copilot a dragged file becomes a chat
 * attachment, so no screen may say drag or drop. This walks every layout the
 * component owns and reads what a user sees or hears: text, `aria-label`,
 * `title` and `placeholder`.
 */

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);
const PDF: IDroppedFile = { name: 'Riverside-Print-Co_INV-20417.pdf', sizeBytes: 421_888, contentType: 'application/pdf' };
const ER = (name: string): IDroppedFile => ({ name, sizeBytes: 183_000, contentType: '' });
const PARTIAL: IFileUploaderCopilotComponentProperties = { documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' };
const COMPLETE: IFileUploaderCopilotComponentProperties = { ...PARTIAL, documentDate: 'last Friday', amount: 1284.5 };
const BULK: IFileUploaderCopilotComponentProperties = { documentKind: 'expenseReport', department: 'development' };

const EVERY_LAYOUT: string[] = [
  ...FILING_LAYOUTS,
  ...RECENT_LAYOUTS,
  'filing-bulk',
  'filing-bulk-receipt',
  'store-starting',
  'store-unavailable',
  'render-error'
];
const FORBIDDEN: RegExp = /\b(drag|drop)/i;

/**
 * Text node by node, space-joined. `textContent` runs neighbours together —
 * a button then its hint reads "+ Add more filesDrop more here" — and `drop`
 * never matches after "files". The first control of this test passed a
 * planted "Drop" for exactly that reason.
 */
function wording(container: HTMLElement): string {
  const words: string[] = [];
  const walker: TreeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let n: Node | null = walker.nextNode(); n; n = walker.nextNode()) {
    words.push(n.nodeValue || '');
  }
  const attrs: string[] = [];
  container.querySelectorAll('[aria-label],[title],[placeholder]').forEach(el => {
    ['aria-label', 'title', 'placeholder'].forEach(a => {
      const v = el.getAttribute(a);
      if (v) attrs.push(v);
    });
  });
  return words.join(' ') + ' | ' + attrs.join(' | ');
}

const seen: Set<string> = new Set<string>();
function check(container: HTMLElement): void {
  const layout: string | undefined = layoutOf(container);
  expect(layout).toBeDefined();
  seen.add(layout as string);
  const text: string = wording(container);
  const hit = FORBIDDEN.exec(text);
  expect(hit ? layout + ': "…' + text.slice(Math.max(0, hit.index - 40), hit.index + 20) + '…"' : undefined).toBeUndefined();
}

/** Gives the receipt the link a live store would (so LinkOut is on screen too). */
function linkReceipt(s: IScreen): void {
  s.session.filing.receipts[0].webUrl = 'https://contoso.sharepoint.com/sites/records/Records/' + PDF.name;
}

const wait = (ms: number): Promise<void> => act(() => new Promise<void>(resolve => setTimeout(resolve, ms)));

async function screen(
  props: IFileUploaderCopilotComponentProperties,
  options: Partial<IScreenOptions> = {},
  drive: (s: IScreen) => Promise<void> | void = () => undefined
): Promise<IScreen> {
  const s = renderApp(props, { now: NOW, ...options });
  await act(async () => {
    await drive(s);
  });
  await flush();
  return s;
}

describe('no drag or drop wording on any screen (8.8 L10)', () => {
  it('filing, inline, every stage — sample and live', async () => {
    for (const live of [false, true]) {
      const cases: [IFileUploaderCopilotComponentProperties, Partial<IScreenOptions>, (s: IScreen) => Promise<void> | void][] = [
        [{}, {}, () => undefined],
        [PARTIAL, {}, s => s.controller.addFiles([PDF])],
        [PARTIAL, {}, s => { s.controller.addFiles([PDF]); s.controller.reviewAndSave(); }],
        [COMPLETE, {}, s => { s.controller.addFiles([PDF]); s.controller.reviewAndSave(); }],
        [COMPLETE, {}, async s => {
          s.controller.addFiles([PDF]);
          s.controller.reviewAndSave();
          await s.controller.confirm();
          linkReceipt(s);
        }],
        [COMPLETE, { failSave: true }, async s => { s.controller.addFiles([PDF]); s.controller.reviewAndSave(); await s.controller.confirm(); }]
      ];
      for (const [props, options, drive] of cases) {
        const s = await screen(props, { ...options, openLink: () => Promise.resolve(true) }, drive);
        if (live) setLiveMode(s);
        check(s.container);
        s.unmount();
      }
    }

    // The saving stage exists only while the store is working.
    const s = await screen(COMPLETE, { latencyMs: 30 }, st => { st.controller.addFiles([PDF]); st.controller.reviewAndSave(); });
    act(() => {
      s.controller.confirm().catch(() => undefined);
    });
    check(s.container);
    await wait(60);
    s.unmount();
  });

  it('recent filings, every layout', async () => {
    const loading = renderApp({ intent: 'recent' }, { now: NOW, latencyMs: 30 });
    check(loading.container);
    await wait(60);
    loading.unmount();

    const drives: ((s: IScreen) => Promise<void>)[] = [
      async () => undefined,
      async s => { await s.recent.setFilter({ department: 'finance' }); },
      async s => { await s.recent.setFilter({ department: 'finance', status: 'returned' }); },
      async s => {
        await s.recent.setFilter({ period: '90d' });
        s.recent.selectRow(s.session.recent.rows[0].id);
      }
    ];
    for (const drive of drives) {
      const s = await screen({ intent: 'recent' }, { openLink: () => Promise.resolve(true) }, async st => {
        await flush();
        await drive(st);
      });
      check(s.container);
      s.unmount();
    }
    const failed = await screen({ intent: 'recent' }, { failRecent: true });
    check(failed.container);
    failed.unmount();
  });

  it('full screen: empty, with files, and the receipt', async () => {
    const files = [ER('ER-Aug_Okafor.xlsx'), ER('ER-Aug_Marin.xlsx')];
    const texts: string[] = [];
    const fill = (s: IScreen): void =>
      s.session.filing.drafts.forEach((d, i) => {
        s.controller.updateField(d.id, 'owner', ['kim.okafor@example.org', 'luis.marin@example.org'][i]);
        s.controller.updateField(d.id, 'documentDate', '2026-08-01');
        s.controller.updateField(d.id, 'amount', 100 + i);
      });
    for (const drive of [
      (): void => undefined,
      (s: IScreen): void => s.controller.addFiles(files),
      async (s: IScreen): Promise<void> => {
        s.controller.addFiles(files);
        fill(s);
        await s.controller.confirm();
      }
    ]) {
      const s = await screen(BULK, { displayMode: 'fullscreen' }, drive);
      check(s.container);
      texts.push(wording(s.container));
      s.unmount();
    }
    // Proof the walk reached both pickers, not only the layouts around them.
    expect(texts[0]).toContain('Choose files');
    expect(texts[1]).toContain('+ Add more files');
  });

  it('the three roots outside the filing views', async () => {
    const host = { theme: 'light' as const, displayMode: 'inline' as const, canFullscreen: true };
    const h = mount();
    h.render(React.createElement(StoreStartingApp, { host, targetDocument: document, remountKey: 1 }));
    check(h.container);
    h.render(
      React.createElement(StoreUnavailableApp, {
        host,
        message: 'The records library could not be reached.',
        retrying: false,
        onRetry: () => undefined,
        targetDocument: document,
        remountKey: 1
      })
    );
    check(h.container);
    h.unmount();

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = await screen({});
    (s.store as unknown as { getKinds: () => never }).getKinds = () => {
      throw new Error('The records library could not be read.');
    };
    s.repaint();
    check(s.container);
    s.unmount();
    consoleError.mockRestore();
  });

  it('reached every layout the component owns', () => {
    expect(Array.from(seen).sort()).toEqual([...EVERY_LAYOUT].sort());
  });
});
