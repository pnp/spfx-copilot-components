import { spfi, SPFI, SPFx } from '@pnp/sp';
import { LogLevel, PnPLogging } from '@pnp/logging';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import '@pnp/sp/fields';
import '@pnp/sp/content-types';
import '@pnp/sp/site-users/web';

/**
 * One singleton `SPFI`, built from the **Copilot component's** context — not a
 * `WebPartContext` (AGENTS.md §3 Data access). Initialised once, from
 * `onInit()`; every later call reuses it.
 *
 * Selective imports only, above. Adding a PnPjs area means adding its side-effect
 * import here, not at the call site.
 */
let _sp: SPFI | undefined;
let _spSiteUrl: string | undefined;

/**
 * `siteUrl` is the records site from the tenant setting
 * `DocumentIntake.SharePoint.SiteUrl` (todo.md Decisions 11 and 17, audit H2). Without it the SPFI targets whatever web the host page belongs to,
 * which in the Copilot host is not guaranteed to be the site holding `Records`.
 */
export function initSP(context: unknown, siteUrl?: string): SPFI {
  if (!_sp || _spSiteUrl !== siteUrl) {
    _sp = (siteUrl ? spfi(siteUrl) : spfi())
      .using(SPFx(context as never))
      .using(PnPLogging(LogLevel.Warning));
    _spSiteUrl = siteUrl;
  }
  return _sp;
}

export function getSP(): SPFI {
  if (!_sp) {
    throw new Error('SPFI was not initialised; call initSP(context) from onInit().');
  }
  return _sp;
}

/** Tests only — drops the singleton so a fresh context can be installed. */
export function resetSP(): void {
  _sp = undefined;
}
