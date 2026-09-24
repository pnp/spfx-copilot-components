import type { IDocumentStoreService } from './IDocumentStoreService';
import { MockDocumentStoreService, IMockDocumentStoreOptions } from './MockDocumentStoreService';
import type { ISharePointDocumentStoreOptions } from './SharePointDocumentStoreService';
import type { StoreSelection } from './storeSetting';

/**
 * The mock -> live swap point (AGENTS.md R8). The live store is selected here
 * and nowhere else.
 *
 * **The tenant decides (todo.md Decisions 11 and 17).**
 * `resolveDocumentStoreAsync` reads the tenant storage entity
 * `DocumentIntake.Store`. Absent, empty or a store it does not know → the mock,
 * so the committed package still deploys anywhere with no setup. `sharepoint` →
 * the live store, against the site in `DocumentIntake.SharePoint.SiteUrl`. A
 * read that fails, or a SharePoint store with no usable site, rejects, and the
 * entry class renders the error — never a silent
 * fall back to the mock, whose receipts would claim filings that never happened
 * (R25). This is the approved exception to R10: "offline by default" became
 * "mock unless the tenant opts in", at the cost of one read per start.
 *
 * `USE_MOCK` is now only an override that forces the mock whatever the tenant
 * says. Tests and the visual harness do not need it: they construct the mock
 * directly, or have no context.
 *
 * **Why PnPjs is reached through `require` and not an import.**
 * `@pnp/sp` ships as ES modules, Jest does not transform anything under
 * `node_modules`, and there is no per-component Jest config to add a
 * `transformIgnorePatterns` to (AGENTS.md §4.1 — the Heft rig owns it). A
 * static import here puts PnPjs on the module graph of every test that touches
 * the component entry class, and the lifecycle suite dies on
 * `SyntaxError: Unexpected token 'export'` before a single assertion runs.
 *
 * Deferring the load to the moment it is needed keeps PnPjs out of that graph
 * entirely (R36). Note that `SharePointDocumentStoreService.ts` itself is safe
 * to import statically — its only PnPjs reference is `import type { SPFI }`,
 * which is erased at compile time — which is why its unit tests need none of
 * this.
 */
export const USE_MOCK: boolean = false;

export interface ICreateStoreOptions {
  /** The Copilot component's context (`this.context`). Without one there is no tenant to ask. */
  context?: unknown;
  /** Force the mock even with a context. */
  forceMock?: boolean;
  mock?: IMockDocumentStoreOptions;
  live?: ISharePointDocumentStoreOptions;
}

/**
 * The mock, synchronously. Reached from `resolveDocumentStoreAsync` and from
 * tests — never from `render()`, which shows the starting view instead of
 * guessing before the tenant has been read (todo.md 8.8 L2).
 */
export function createMockDocumentStore(options: ICreateStoreOptions = {}): IDocumentStoreService {
  return new MockDocumentStoreService({ latencyMs: 250, ...options.mock });
}

/**
 * Mock or live, as the tenant setting says. Rejects when the setting exists but
 * cannot be read; the caller must render that, not swallow it.
 */
export async function resolveDocumentStoreAsync(options: ICreateStoreOptions = {}): Promise<IDocumentStoreService> {
  if (options.forceMock === true || USE_MOCK || !options.context) {
    return createMockDocumentStore(options);
  }
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { readStoreSelection } = require('./tenantSettings') as typeof import('./tenantSettings');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const selection: StoreSelection = await readStoreSelection(options.context);
  if (selection.store !== 'sharepoint') {
    return createMockDocumentStore(options);
  }
  return createLiveDocumentStore(options, selection.siteUrl);
}

/**
 * The SharePoint store, against the site the tenant settings name. Kept in its own
 * function so the `require` calls sit on a code path a mock-only run never
 * reaches — see the note above.
 *
 * **On the disabled rule.** `no-require-imports` is an error in the SPFx config,
 * and rightly so as a general style rule; here deferring the load is the entire
 * point, so it is disabled for these lines and nowhere else. The alternative —
 * stubbing `@pnp/sp` and its side-effect submodules with `jest.mock` in every
 * test that touches the entry class — keeps the rule intact but treats the
 * symptom per test. Bundle size is unaffected either way: webpack resolves a
 * literal `require`, so PnPjs ships exactly as it would with a static import.
 */
function createLiveDocumentStore(options: ICreateStoreOptions, siteUrl: string): IDocumentStoreService {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { initSP } = require('./getSP') as typeof import('./getSP');
  const { SharePointDocumentStoreService } = require('./SharePointDocumentStoreService') as typeof import('./SharePointDocumentStoreService');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return new SharePointDocumentStoreService(initSP(options.context, siteUrl), options.live);
}
