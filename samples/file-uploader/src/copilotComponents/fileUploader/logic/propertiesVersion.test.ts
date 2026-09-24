import { PropertiesVersion, promptSignature } from './propertiesVersion';

describe('promptSignature', () => {
  it('is order-independent', () => {
    expect(promptSignature({ documentKind: 'invoice', department: 'finance' })).toBe(
      promptSignature({ department: 'finance', documentKind: 'invoice' })
    );
  });

  it('ignores empty and undefined fields', () => {
    expect(promptSignature({ documentKind: 'invoice', vendor: undefined })).toBe(promptSignature({ documentKind: 'invoice' }));
    expect(promptSignature({ documentKind: 'invoice', vendor: '' })).toBe(promptSignature({ documentKind: 'invoice' }));
  });

  it('changes when a value changes', () => {
    expect(promptSignature({ department: 'finance' })).not.toBe(promptSignature({ department: 'programs' }));
  });

  it('is empty for an empty prompt', () => {
    expect(promptSignature({})).toBe('');
  });
});

describe('PropertiesVersion', () => {
  it('starts at 1 on the first invocation', () => {
    const v = new PropertiesVersion();
    expect(v.next({ documentKind: 'invoice' })).toEqual({ version: 1, changed: true });
  });

  it('does not bump on a passive re-render — the user keeps their edits', () => {
    const v = new PropertiesVersion();
    v.next({ documentKind: 'invoice', department: 'programs' });
    expect(v.next({ department: 'programs', documentKind: 'invoice' })).toEqual({ version: 1, changed: false });
    expect(v.next({ documentKind: 'invoice', department: 'programs' })).toEqual({ version: 1, changed: false });
    expect(v.version).toBe(1);
  });

  it('bumps when a genuinely new prompt arrives', () => {
    const v = new PropertiesVersion();
    v.next({ documentKind: 'invoice' });
    expect(v.next({ documentKind: 'expenseReport' })).toEqual({ version: 2, changed: true });
    expect(v.next({ documentKind: 'expenseReport', amount: 10 })).toEqual({ version: 3, changed: true });
  });

  it('treats a first empty invocation as a real invocation', () => {
    const v = new PropertiesVersion();
    expect(v.next({})).toEqual({ version: 1, changed: true });
    expect(v.next({})).toEqual({ version: 1, changed: false });
  });
});
