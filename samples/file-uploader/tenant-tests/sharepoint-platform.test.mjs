/**
 * Loop 2 — facts about SharePoint the shipped code depends on but the contract
 * cannot phrase (todo.md 8.9 N3; the *Deferred* "Verify on the first live run"
 * line). These are store-specific on purpose: a second store has its own.
 * Each prints what the platform actually answered, because learning that
 * answer is the point, and asserts only what the shipped code relies on.
 */
import { readTenantConfig } from './config.mjs';
import { createAdapter, shipped } from './stores/sharepoint.mjs';

const config = readTenantConfig();
const adapter = await createAdapter(config);
const { storeNameFrom, sharePointSiteUrlFrom } = await shipped();
const RUN = process.env.TENANT_RUN_ID || `r${Date.now().toString(36)}`;

let root;
beforeAll(async () => {
  ({ ServerRelativeUrl: root } = await adapter.sp.web.lists.getByTitle(adapter.libraryName).rootFolder.select('ServerRelativeUrl')());
});

describe(`SharePoint platform facts, run ${RUN}`, () => {
  it('[Deferred] getStorageEntity answers a key the tenant never set with an empty value, not an error', async () => {
    const key = `DocumentIntake.TenantTest.NeverSet.${RUN}`;
    const entity = await adapter.sp.web.getStorageEntity(key);
    console.log(`getStorageEntity('${key}') answered ${JSON.stringify(entity)}`);
    // What tenantSettings.ts does with that answer: sample data, or an error naming the key.
    expect(storeNameFrom(entity)).toBeUndefined();
    expect(() => sharePointSiteUrlFrom(entity)).toThrow(/is not set/);
  });

  it('[Deferred] a missing folder reads as absent through select("Exists")', async () => {
    const path = `${root}/tenant-test-${RUN}-missing`;
    let answer;
    try {
      const folder = await adapter.sp.web.getFolderByServerRelativePath(path).select('Exists')();
      answer = `Exists: ${JSON.stringify(folder.Exists)}`;
      expect(folder.Exists).not.toBe(true);
    } catch (e) {
      answer = `an error (${e.message.split('\n')[0]})`;
    }
    // The service reads both as "absent"; which one it is was the open question.
    console.log(`A missing folder answered ${answer}`);
  });

  it('[Deferred] files.getByUrl(name).exists() answers false, not an error, in a folder made moments ago', async () => {
    const path = `${root}/tenant-test-${RUN}-fresh`;
    await adapter.sp.web.folders.addUsingPath(path, true);
    try {
      const exists = await adapter.sp.web.getFolderByServerRelativePath(path).files.getByUrl('nothing-here.pdf').exists();
      console.log(`exists() in a fresh folder answered ${JSON.stringify(exists)}`);
      expect(exists).toBe(false);
    } finally {
      await adapter.sp.web.getFolderByServerRelativePath(path).recycle();
    }
  });
});
