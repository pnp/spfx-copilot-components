import { createRulesStore } from '../rulesStore';

describe('Writing guidelines remembered in the browser', () => {
  function memory(): { storage: Map<string, string>; api: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> } {
    const storage = new Map<string, string>();
    return { storage, api: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); }, removeItem: key => { storage.delete(key); } } };
  }

  it('keeps the guidelines as written, up to twice the checked length', () => {
    const { api } = memory();
    const store = createRulesStore({ storage: () => api, tenantUrl: 'https://contoso.sharepoint.com/sites/a', userId: 'user@contoso.com' });
    const text = 'Write dates as 2 October 2026.\n\n  Address readers as you.  ';
    store.save(text);
    expect(store.load()).toBe(text);
    store.save('x'.repeat(3000));
    expect(store.load()).toHaveLength(2000);
  });

  it('separates tenants and users, clears empty rules and never throws', () => {
    const { storage, api } = memory();
    const first = createRulesStore({ storage: () => api, tenantUrl: 'https://contoso.sharepoint.com', userId: 'a' });
    const other = createRulesStore({ storage: () => api, tenantUrl: 'https://fabrikam.sharepoint.com', userId: 'a' });
    first.save('Rule'); expect(other.load()).toBe('');
    first.save('  \n '); expect(storage.size).toBe(0);
    const blocked = createRulesStore({ storage: () => { throw new Error('SecurityError'); }, tenantUrl: 'https://contoso.sharepoint.com', userId: 'a' });
    expect(() => blocked.save('Rule')).not.toThrow();
    expect(blocked.load()).toBe('');
  });

  it('remembers which checks without AI are on, and knows when the reviewer never changed them', () => {
    const { api } = memory();
    const store = createRulesStore({ storage: () => api, tenantUrl: 'https://contoso.sharepoint.com', userId: 'a' });
    expect(store.loadGroups!()).toBeUndefined();
    store.saveGroups!(['freshness', 'a11y']);
    // In the card's order, whatever order they were saved in.
    expect(store.loadGroups!()).toEqual(['a11y', 'freshness']);
    store.saveGroups!([]);
    expect(store.loadGroups!()).toEqual([]);
    api.setItem('content-lens.checks.v1:https%3A%2F%2Fcontoso.sharepoint.com:a', '["layout","gone"]');
    expect(store.loadGroups!()).toEqual(['layout']);
  });

  it('remembers whether the harmful-wording check is on', () => {
    const { api } = memory();
    const store = createRulesStore({ storage: () => api, tenantUrl: 'https://contoso.sharepoint.com', userId: 'a' });
    expect(store.loadHarmful!()).toBeUndefined();
    store.saveHarmful!(false); expect(store.loadHarmful!()).toBe(false);
    store.saveHarmful!(true); expect(store.loadHarmful!()).toBe(true);
  });
});
