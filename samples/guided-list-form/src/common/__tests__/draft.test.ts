import { clearDraft, draftKey, hasMeaningfulAnswers, parseDraft, readDraft, storageAvailable, writeDraft, DRAFT_TTL_MS } from '../logic/draft';
import { field } from './helpers';

class MemoryStorage implements Storage {
  private readonly _data: Record<string, string> = Object.create(null) as Record<string, string>;
  public get length(): number {
    return Object.keys(this._data).length;
  }
  public clear(): void {
    Object.keys(this._data).forEach((k) => delete this._data[k]);
  }
  // eslint-disable-next-line @rushstack/no-new-null
  public getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null;
  }
  // eslint-disable-next-line @rushstack/no-new-null
  public key(index: number): string | null {
    return Object.keys(this._data)[index] || null;
  }
  public removeItem(key: string): void {
    delete this._data[key];
  }
  public setItem(key: string, value: string): void {
    this._data[key] = value;
  }
}

const parts = { siteUrl: 'https://fabrikam.sharepoint.com/sites/it', listTitle: 'IT Requests', userId: 'alex@fabrikam.com', instanceId: 'abc' };
const fields = [field({ internalName: 'Title', title: 'Title', required: true })];

describe('save and resume drafts', () => {
  it('builds a stable key from site, list, user and instance', () => {
    expect(draftKey(parts)).toContain('te-step-form:v1:');
    expect(draftKey(parts)).toContain(encodeURIComponent(parts.siteUrl));
    expect(draftKey({ ...parts, userId: 'other' })).not.toBe(draftKey(parts));
  });

  it('writes, reads and clears a draft', () => {
    const storage = new MemoryStorage();
    const now = 1_700_000_000_000;
    expect(writeDraft(parts, { answers: { Title: 'Monitor flickers' }, phase: 'step', index: 1 }, storage, now)).toBe(true);
    const draft = readDraft(parts, storage, now + 1000);
    expect(draft).toMatchObject({ answers: { Title: 'Monitor flickers' }, phase: 'step', index: 1, savedAt: now });
    clearDraft(parts, storage);
    expect(readDraft(parts, storage, now + 1000)).toBeUndefined();
  });

  it('expires after 7 days and ignores prototype keys or junk', () => {
    const storage = new MemoryStorage();
    const now = 1_700_000_000_000;
    writeDraft(parts, { answers: { Title: 'x' }, phase: 'step', index: 0, savedAt: now }, storage, now);
    expect(readDraft(parts, storage, now + DRAFT_TTL_MS + 1)).toBeUndefined();
    expect(storage.getItem(draftKey(parts))).toBeNull();
    expect(parseDraft('{"__proto__":{"admin":true},"savedAt":1}', now)).toBeUndefined();
    expect(parseDraft('not json', now)).toBeUndefined();
  });

  it('does not treat empty answers as worth resuming', () => {
    expect(hasMeaningfulAnswers({}, fields)).toBe(false);
    expect(hasMeaningfulAnswers({ Title: '  ' }, fields)).toBe(false);
    expect(hasMeaningfulAnswers({ Title: 'Hello' }, fields)).toBe(true);
    const link = field({ internalName: 'Receipt', kind: 'hyperlink' });
    expect(hasMeaningfulAnswers({ Receipt: { url: '', description: 'x' } }, [link])).toBe(false);
    expect(hasMeaningfulAnswers({ Receipt: { url: 'https://contoso.com', description: '' } }, [link])).toBe(true);
  });

  it('round-trips a hyperlink answer in a draft', () => {
    const storage = new MemoryStorage();
    const now = 1_700_000_000_000;
    const receipt = { url: 'https://contoso.com/r', description: 'Ticket' };
    expect(writeDraft(parts, { answers: { Receipt: receipt }, phase: 'step', index: 1 }, storage, now)).toBe(true);
    expect(readDraft(parts, storage, now + 1000)?.answers).toEqual({ Receipt: receipt });
  });

  it('reports when storage is available, and false when it throws', () => {
    expect(storageAvailable(new MemoryStorage())).toBe(true);
    const broken: Storage = {
      get length() { return 0; },
      clear() {},
      getItem() { return null; },
      key() { return null; },
      removeItem() {},
      setItem() { throw new Error('blocked'); }
    };
    expect(storageAvailable(broken)).toBe(false);
  });
});
