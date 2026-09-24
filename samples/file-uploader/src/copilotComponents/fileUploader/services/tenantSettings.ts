import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import {
  SHAREPOINT_SITE_URL_KEY,
  STORE_KEY,
  StoreName,
  StoreSelection,
  sharePointSiteUrlFrom,
  storeNameFrom,
  tenantSettingReadFailure
} from './storeSetting';

/**
 * Reads the tenant settings that choose the store (todo.md Decisions 11 and
 * 17). This module loads PnPjs, so it is only ever `require`d from
 * `documentStoreFactory` (AGENTS.md R36), and the lifecycle test stubs it.
 *
 * Storage entities are readable from any web, so this asks the host page's own
 * web rather than the records site it is looking up — which it cannot know yet.
 * Resolves `{ store: 'sample' }` when the tenant has not chosen a store it
 * knows; rejects when a setting cannot be read or is malformed, and the caller
 * renders that rather than falling back to sample data.
 */
export async function readStoreSelection(context: unknown): Promise<StoreSelection> {
  const sp: SPFI = spfi().using(SPFx(context as never));
  const store: StoreName | undefined = storeNameFrom(await readEntity(sp, STORE_KEY, context));
  if (store !== 'sharepoint') {
    return { store: 'sample' };
  }
  return { store, siteUrl: sharePointSiteUrlFrom(await readEntity(sp, SHAREPOINT_SITE_URL_KEY, context)) };
}

async function readEntity(sp: SPFI, key: string, context: unknown): Promise<unknown> {
  try {
    return await sp.web.getStorageEntity(key);
  } catch (e) {
    // Names the key and the web the read was addressed to — in the host that
    // is not this site, and a failure that does not say which is unreadable (8.5 E5).
    throw tenantSettingReadFailure(key, context, e);
  }
}
