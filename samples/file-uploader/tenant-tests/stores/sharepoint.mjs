/**
 * Loop 2's SharePoint adapter (todo.md 8.9 N3, N7). The contract suite talks to
 * a store only through `createStore()` and the few read-back probes below, so a
 * second store is a second file with the same exports — not a change to the
 * scenarios.
 *
 * The store is the SHIPPED `SharePointDocumentStoreService`, compiled from the
 * same source by `scripts/test-tenant.mjs` into temp/tenant-lib. It imports
 * PnPjs as types only, so the one thing the component adds at runtime is the
 * set of side-effect imports in `services/getSP.ts`; `loadPnPAreas()` reads that
 * list from getSP.ts itself, so the harness cannot drift from what ships.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { COMPONENT_ROOT } from '../config.mjs';
import { connect } from '../connection.mjs';

const require = createRequire(import.meta.url);
const SERVICES_SRC = join(COMPONENT_ROOT, 'src', 'copilotComponents', 'fileUploader', 'services');
export const COMPILED = join(COMPONENT_ROOT, 'temp', 'tenant-lib', 'copilotComponents', 'fileUploader', 'services');

let areasLoaded = false;

/** Imports exactly the `@pnp/sp/*` areas getSP.ts imports. */
export async function loadPnPAreas() {
  if (areasLoaded) return;
  const source = readFileSync(join(SERVICES_SRC, 'getSP.ts'), 'utf8');
  const areas = [...source.matchAll(/^import '(@pnp\/sp\/[^']+)';$/gm)].map(m => m[1]);
  if (areas.length === 0) throw new Error('No @pnp/sp side-effect imports found in getSP.ts; the harness parser is stale.');
  // Resolved to a file first: plain Node's ESM loader refuses a directory import
  // (PnPjs has no subpath exports, and some areas are files, some directories).
  for (const area of areas) await import(pathToFileURL(require.resolve(area)).href);
  areasLoaded = true;
}

/** The compiled shipped modules. */
export async function shipped() {
  const service = (await import(pathToFileURL(join(COMPILED, 'SharePointDocumentStoreService.js')).href)).default;
  const setting = (await import(pathToFileURL(join(COMPILED, 'storeSetting.js')).href)).default;
  return { ...service, ...setting };
}

/** Rejects every recycle request on this connection — a real tenant, one refused call. */
function FailRecycle() {
  return instance => {
    instance.on.pre(async function (url, init, result) {
      if (/\/recycle(\(\))?($|\?)/i.test(url)) throw new Error('recycle refused by the tenant test (injected)');
      return [url, init, result];
    });
    return instance;
  };
}

export async function createAdapter(config) {
  await loadPnPAreas();
  const { SharePointDocumentStoreService } = await shipped();
  const libraryName = config.sharepoint.libraryName;
  const sp = connect(config);
  const list = () => sp.web.lists.getByTitle(libraryName);

  return {
    name: 'sharepoint',
    /** The raw connection, for the platform probes that are about SharePoint rather than the contract. */
    sp,
    libraryName,

    /**
     * A fresh, uninitialised store — as `onInit()` would get it. `behaviors`
     * go on its own connection (fixture capture records through one);
     * `failRollback` refuses every recycle on it.
     */
    createStore(options = {}) {
      const behaviors = [...(options.behaviors || []), ...(options.failRollback ? [FailRecycle()] : [])];
      const connection = behaviors.length > 0 ? connect(config, { behaviors }) : sp;
      return new SharePointDocumentStoreService(connection, { libraryName });
    },

    /**
     * What the library actually stored for a receipt, read back independently
     * of the service: the content type, the raw and calendar date, the owner.
     */
    async readBack(receipt) {
      const path = decodeURIComponent(new URL(receipt.webUrl).pathname);
      const { Id } = await sp.web.getFileByServerRelativePath(path).getItem('Id');
      const item = await list()
        .items.getById(Id)
        .select('Id', 'ContentType/Name', 'DocumentDate', 'ReceiptNumber', 'ReportOwner/EMail', 'FileLeafRef')
        .expand('ContentType', 'ReportOwner')();
      return {
        id: item.Id,
        fileName: item.FileLeafRef,
        kindLabel: item.ContentType?.Name,
        documentDateRaw: item.DocumentDate,
        ownerEmail: item.ReportOwner?.EMail,
        receiptNumber: item.ReceiptNumber
      };
    },

    /** Every item in the library with this file name (recycled files are not listed). */
    async findByFileName(fileName) {
      const escaped = fileName.replace(/'/g, "''");
      return list().items.select('Id', 'FileRef').filter(`FileLeafRef eq '${escaped}'`)();
    },

    /** Recycles whatever a scenario left under this name. Returns how many. */
    async recycleByFileName(fileName) {
      const found = await this.findByFileName(fileName);
      for (const item of found) await sp.web.getFileByServerRelativePath(item.FileRef).recycle();
      return found.length;
    }
  };
}
