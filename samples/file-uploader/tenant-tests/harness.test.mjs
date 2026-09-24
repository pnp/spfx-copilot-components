/**
 * Loop 2's self-check: no network, so when the harness itself is broken it
 * fails in its own name rather than letting a tenant scenario pass for the
 * wrong reason. The recycle case is here because the fault once matched `recycle()`
 * while PnPjs v4 posts to `recycle` — the orphan scenario would have run with
 * no fault in it.
 */
import { readTenantConfig } from './config.mjs';
import { createAdapter, shipped } from './stores/sharepoint.mjs';

const adapter = await createAdapter(readTenantConfig());

describe('harness', () => {
  it('loads the shipped store, the PnPjs areas getSP.ts ships, and the pure setting rules', async () => {
    const store = adapter.createStore();
    expect(store.isSampleData).toBe(false);
    expect(typeof adapter.sp.web.lists.getByTitle).toBe('function');
    expect(typeof adapter.sp.web.getStorageEntity).toBe('function');
    await expect(store.save([], new Date())).rejects.toThrow(/initializeAsync/);
    const { isoDateFromSharePoint, storeNameFrom } = await shipped();
    expect(isoDateFromSharePoint('2026-09-01T00:00:00Z')).toBe('2026-09-01');
    expect(storeNameFrom({ Value: 'sharepoint' })).toBe('sharepoint');
  });

  it('the injected fault refuses recycle before the request leaves', async () => {
    const refusing = adapter.createStore({ failRollback: true })._sp;
    await expect(refusing.web.getFileByServerRelativePath('/sites/x/Records/a.pdf').recycle()).rejects.toThrow(
      /recycle refused/
    );
  });
});
