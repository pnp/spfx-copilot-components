/* eslint-disable */
// Browser harness: renders the real FileUploaderApp (no SPFx host) so Playwright
// can screenshot every state. Not shipped — bundled by build.mjs into dist/.
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { FileUploaderApp, IAppProps } from '../../src/copilotComponents/fileUploader/components/FileUploaderApp';
import { StoreStartingApp } from '../../src/copilotComponents/fileUploader/components/StoreStartingApp';
import { createSession, ISession } from '../../src/copilotComponents/fileUploader/models/session';
import { FilingController } from '../../src/copilotComponents/fileUploader/logic/filingController';
import { RecentController } from '../../src/copilotComponents/fileUploader/logic/recentController';
import { MockDocumentStoreService } from '../../src/copilotComponents/fileUploader/services/MockDocumentStoreService';
import type { IDroppedFile } from '../../src/copilotComponents/fileUploader/models/filing';
import type { IFileUploaderCopilotComponentProperties } from '../../src/copilotComponents/fileUploader/FileUploaderCopilotComponentProperties';

const NOW = new Date(2026, 7, 18, 9, 0, 0);
const now = (): Date => NOW;

const file = (name: string, sizeBytes: number, contentType = ''): IDroppedFile => ({ name, sizeBytes, contentType });
const INVOICE = file('Riverside-Print-Co_INV-20417.pdf', 421_888, 'application/pdf');
const ER = (n: string) => file(n, 183_000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

interface ICtx {
  session: ISession;
  store: MockDocumentStoreService;
  controller: FilingController;
  recent: RecentController;
}

const COMPLETE_INVOICE: IFileUploaderCopilotComponentProperties = {
  documentKind: 'invoice',
  department: 'programs',
  vendor: 'Riverside Print Co.',
  documentDate: 'last Friday',
  amount: 1284.5
};

function fillBulk(ctx: ICtx, count: number): void {
  ctx.session.filing.drafts.slice(0, count).forEach((d, i) => {
    ctx.controller.updateField(d.id, 'owner', ['kim.okafor@example.org', 'luis.marin@example.org', 'dana.whitfield@example.org', 'tom.sato@example.org'][i]);
    ctx.controller.updateField(d.id, 'documentDate', '2026-08-01');
    ctx.controller.updateField(d.id, 'amount', [642.1, 218.75, 1020, 77.4][i]);
  });
}

interface IStateConfig {
  props: IFileUploaderCopilotComponentProperties;
  storeOptions?: { failSave?: boolean; failRecent?: boolean };
  /** Render as the live store would: no sample line, live copy, links (8.8 L9). */
  live?: boolean;
  /** Offer the host's open-link call, as `copilotBridge.openLinkAsync` would. */
  openLink?: boolean;
  drive: (ctx: ICtx) => Promise<void> | void;
  /** Runs against the rendered DOM, for states reached by a click. */
  after?: (root: HTMLElement) => Promise<void> | void;
}

// A fictional host (check:tenant-config accepts `contoso`), shaped like the URLs
// the SharePoint store builds, so the links can be seen and measured at 340 px.
const SITE = 'https://contoso.sharepoint.com/sites/records';
const FILE_URL = SITE + '/Records/Finance/Invoices/Programs/2026/Riverside-Print-Co_INV-20417.pdf';
const FOLDER_URL = SITE + '/Records/Finance/Expense%20reports/Development/2026';

const fileAndLink = async (ctx: ICtx): Promise<void> => {
  ctx.controller.addFiles([INVOICE]);
  ctx.controller.reviewAndSave();
  await ctx.controller.confirm();
  ctx.session.filing.receipts.forEach(r => { r.webUrl = FILE_URL; });
};

const nextFrame = (): Promise<void> => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res())));

const STATE_CONFIG: Record<string, IStateConfig> = {
  'filing-empty': { props: {}, drive: () => undefined },
  'filing-draft': {
    props: { documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' },
    drive: ctx => { ctx.controller.addFiles([INVOICE]); }
  },
  'filing-validation': {
    props: { documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' },
    drive: ctx => { ctx.controller.addFiles([INVOICE]); ctx.controller.reviewAndSave(); }
  },
  'filing-review': {
    props: COMPLETE_INVOICE,
    drive: ctx => { ctx.controller.addFiles([INVOICE]); ctx.controller.reviewAndSave(); }
  },
  'filing-receipt': {
    props: COMPLETE_INVOICE,
    drive: async ctx => { ctx.controller.addFiles([INVOICE]); ctx.controller.reviewAndSave(); await ctx.controller.confirm(); }
  },
  'filing-error': {
    props: COMPLETE_INVOICE,
    storeOptions: { failSave: true },
    drive: async ctx => { ctx.controller.addFiles([INVOICE]); ctx.controller.reviewAndSave(); await ctx.controller.confirm(); }
  },
  'recent-default': { props: { intent: 'recent' }, drive: ctx => ctx.recent.loadInitial() },
  'recent-filtered': {
    props: { intent: 'recent' },
    drive: async ctx => { await ctx.recent.loadInitial(); await ctx.recent.setFilter({ department: 'finance' }); }
  },
  'recent-no-match': {
    props: { intent: 'recent' },
    drive: async ctx => { await ctx.recent.loadInitial(); await ctx.recent.setFilter({ department: 'finance', status: 'returned' }); }
  },
  'recent-error': {
    props: { intent: 'recent' },
    storeOptions: { failRecent: true },
    drive: ctx => ctx.recent.loadInitial()
  },
  'filing-bulk': {
    props: { documentKind: 'expenseReport', department: 'development' },
    drive: ctx => {
      ctx.controller.addFiles([ER('ER-Aug_Okafor.xlsx'), ER('ER-Aug_Marin.xlsx'), ER('ER-Aug_Whitfield.xlsx'), ER('ER-Aug_Sato.xlsx')]);
      fillBulk(ctx, 3);
    }
  },
  'filing-bulk-receipt': {
    props: { documentKind: 'expenseReport', department: 'development' },
    drive: async ctx => {
      ctx.controller.addFiles([ER('ER-Aug_Okafor.xlsx'), ER('ER-Aug_Marin.xlsx'), ER('ER-Aug_Whitfield.xlsx'), ER('ER-Aug_Sato.xlsx')]);
      fillBulk(ctx, 3);
      await ctx.controller.confirm();
    }
  },
  'filing-receipt-link': { props: COMPLETE_INVOICE, live: true, openLink: true, drive: fileAndLink },
  'recent-row-link': {
    props: { intent: 'recent' },
    live: true,
    openLink: true,
    drive: async ctx => {
      const realGetRecent = ctx.store.getRecent.bind(ctx.store);
      ctx.store.getRecent = async (filter, at) =>
        (await realGetRecent(filter, at)).map(r => ({ ...r, webUrl: SITE + '/' + r.savedPath.split(' / ').join('/') }));
      await ctx.recent.loadInitial();
      const first = ctx.session.recent.rows[0];
      if (first) ctx.recent.selectRow(first.id);
    }
  },
  'filing-bulk-receipt-link': {
    props: { documentKind: 'expenseReport', department: 'development' },
    live: true,
    openLink: true,
    drive: async ctx => {
      ctx.controller.addFiles([ER('ER-Aug_Okafor.xlsx'), ER('ER-Aug_Marin.xlsx'), ER('ER-Aug_Whitfield.xlsx'), ER('ER-Aug_Sato.xlsx')]);
      fillBulk(ctx, 3);
      await ctx.controller.confirm();
      ctx.session.filing.receipts.forEach(r => { r.folderUrl = FOLDER_URL; });
    }
  },
  'render-error': {
    props: {},
    drive: ctx => {
      // A real render-time failure, not a stub component: FilingInline reads the
      // document kinds while rendering. Installed after the controllers are
      // built, so the throw lands in render — where the boundary catches it
      // (todo.md 8.5 E1).
      (ctx.store as unknown as { getKinds: () => never }).getKinds = () => {
        throw new Error('The records library could not be read.');
      };
    }
  }
};

async function main(): Promise<void> {
  const q = new URLSearchParams(location.search);
  const id = q.get('state') || 'filing-empty';
  const theme = (q.get('theme') === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const width = Number(q.get('width')) || 760;
  const displayMode = (q.get('mode') === 'fullscreen' ? 'fullscreen' : 'inline') as 'inline' | 'fullscreen';

  // Not a stage of FileUploaderApp: the root the entry class mounts while
  // onInit() is still reading the tenant, before any store exists (8.8 L2).
  if (id === 'store-starting') {
    document.documentElement.dataset.theme = theme;
    document.body.style.background = theme === 'dark' ? '#1b1a19' : '#f5f5f5';
    document.body.style.margin = '0';
    document.body.style.padding = '16px';
    ReactDOM.render(
      React.createElement(StoreStartingApp, {
        host: { theme, displayMode, canFullscreen: true, width },
        targetDocument: document,
        remountKey: 1
      }),
      document.getElementById('root') as HTMLElement
    );
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
    (window as unknown as { __harnessReady: boolean }).__harnessReady = true;
    return;
  }

  const cfg = STATE_CONFIG[id];
  if (!cfg) {
    document.body.innerHTML = '<pre>unknown state: ' + id + '</pre>';
    (window as unknown as { __harnessReady: boolean }).__harnessReady = true;
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.body.style.background = theme === 'dark' ? '#1b1a19' : '#f5f5f5';
  document.body.style.margin = '0';
  document.body.style.padding = '16px';

  const rootEl = document.getElementById('root') as HTMLElement;
  const session = createSession(cfg.props, 1);
  const store = new MockDocumentStoreService({ latencyMs: 0, ...cfg.storeOptions });
  if (cfg.live) {
    (store as unknown as { isSampleData: boolean }).isSampleData = false;
  }
  const refs: { c?: FilingController; r?: RecentController } = {};

  const render = (): void => {
    const props: IAppProps = {
      host: { theme, displayMode, canFullscreen: true, width },
      session,
      store,
      controller: refs.c as FilingController,
      recent: refs.r as RecentController,
      now,
      refresh: render,
      requestFullscreen: () => Promise.resolve(),
      openLink: cfg.openLink ? () => Promise.resolve(true) : undefined,
      targetDocument: document,
      remountKey: 1
    };
    ReactDOM.render(React.createElement(FileUploaderApp, props), rootEl);
  };

  refs.c = new FilingController(session, store, now, render, cfg.props);
  refs.r = new RecentController(session, store, now, render);
  render();
  await cfg.drive({ session, store, controller: refs.c, recent: refs.r });
  render();
  if (cfg.after) {
    await nextFrame();
    await cfg.after(rootEl);
  }

  // Let Griffel flush and layout settle before Playwright screenshots.
  await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  (window as unknown as { __harnessReady: boolean }).__harnessReady = true;
}

main().catch(err => {
  document.body.innerHTML = '<pre>' + String(err && (err as Error).stack || err) + '</pre>';
  (window as unknown as { __harnessReady: boolean; __harnessError: string }).__harnessReady = true;
  (window as unknown as { __harnessError: string }).__harnessError = String(err);
});
