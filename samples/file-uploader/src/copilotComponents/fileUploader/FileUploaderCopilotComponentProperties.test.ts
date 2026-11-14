import propertiesJsonSchema, { parseProperties } from './FileUploaderCopilotComponentProperties';
import { MAX_AMOUNT } from './models/config';

/**
 * The triad from AGENTS.md §4.1: lenient in, clean out, and the emitted JSON
 * schema shape — this last one is what Copilot reads to fill the tool inputs.
 */

const schema = propertiesJsonSchema as {
  type: string;
  additionalProperties: boolean;
  properties: Record<string, { description?: string; enum?: string[]; type?: string; maximum?: number }>;
  required?: string[];
};

describe('properties schema — lenient in', () => {
  it('accepts an empty invocation', () => {
    expect(parseProperties({})).toEqual({});
  });

  it('accepts a partial invocation', () => {
    expect(parseProperties({ documentKind: 'invoice' })).toEqual({ documentKind: 'invoice' });
  });

  it('trims whitespace', () => {
    expect(parseProperties({ vendor: '  Riverside Print Co.  ' }).vendor).toBe('Riverside Print Co.');
  });

  it('clamps over-long text instead of rejecting it', () => {
    const long: string = 'x'.repeat(400);
    const parsed = parseProperties({ vendor: long, documentDate: long });
    expect(parsed.vendor!.length).toBe(120);
    expect(parsed.documentDate!.length).toBe(40);
  });

  it('strips unknown keys', () => {
    const parsed = parseProperties({ documentKind: 'invoice', nonsense: true, fileBytes: 'AAAA' });
    expect(parsed).toEqual({ documentKind: 'invoice' });
  });

  it('coerces the money strings Copilot tends to send', () => {
    expect(parseProperties({ amount: '1,284.50' }).amount).toBe(1284.5);
    expect(parseProperties({ amount: '$642.10' }).amount).toBe(642.1);
    expect(parseProperties({ amount: 218.75 }).amount).toBe(218.75);
  });

  it('drops a bad field without discarding the good ones', () => {
    const parsed = parseProperties({ documentKind: 'invoice', department: 'marketing', amount: 'lots' });
    expect(parsed.documentKind).toBe('invoice');
    expect(parsed.department).toBeUndefined();
    expect(parsed.amount).toBeUndefined();
  });

  it('rejects a negative amount rather than filing one', () => {
    expect(parseProperties({ amount: -5 }).amount).toBeUndefined();
  });

  it('drops an infinite or absurd amount instead of passing it on (M2)', () => {
    expect(parseProperties({ amount: '1e999' }).amount).toBeUndefined();
    expect(parseProperties({ amount: Infinity }).amount).toBeUndefined();
    expect(parseProperties({ amount: 1_000_000_001 }).amount).toBeUndefined();
    expect(parseProperties({ amount: 1_000_000_000 }).amount).toBe(1_000_000_000);
  });

  it('survives junk input entirely', () => {
    expect(parseProperties(undefined)).toEqual({});
    expect(parseProperties('a string')).toEqual({});
    expect(parseProperties(42)).toEqual({});
  });
});

describe('properties schema — clean out', () => {
  it('carries only declared keys', () => {
    const parsed = parseProperties({
      intent: 'recent',
      documentKind: 'expenseReport',
      department: 'finance',
      status: 'pendingReview',
      period: '7d',
      extra: 'no'
    });
    expect(Object.keys(parsed).sort()).toEqual(['department', 'documentKind', 'intent', 'period', 'status']);
  });
});

describe('properties schema — emitted shape', () => {
  it('is a closed object of the nine declared fields', () => {
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties).sort()).toEqual([
      'amount',
      'department',
      'documentDate',
      'documentKind',
      'intent',
      'owner',
      'period',
      'status',
      'vendor'
    ]);
  });

  it('requires nothing — Copilot may send as little as it knows', () => {
    expect(schema.required || []).toEqual([]);
  });

  it('describes every field, because a field without one is filled badly', () => {
    Object.keys(schema.properties).forEach(key => {
      const description: string = schema.properties[key].description || '';
      expect(description.length).toBeGreaterThan(20);
    });
  });

  it('advertises the enums the component actually accepts', () => {
    expect(schema.properties.intent.enum).toEqual(['file', 'recent']);
    expect(schema.properties.documentKind.enum).toEqual(['invoice', 'expenseReport']);
    expect(schema.properties.department.enum).toEqual(['programs', 'development', 'finance', 'operations']);
    expect(schema.properties.status.enum).toEqual(['received', 'pendingReview', 'approved', 'paid', 'returned']);
    expect(schema.properties.period.enum).toEqual(['7d', '30d', '90d']);
  });

  it('caps the amount at the same ceiling validation uses', () => {
    // The schema module cannot import models/config (the manifest step loads it alone), so the literal is guarded here.
    expect(schema.properties.amount.maximum).toBe(MAX_AMOUNT);
  });

  it('asks Copilot for the report owner as an email address (Decision 9)', () => {
    expect(schema.properties.owner.description).toMatch(/email address/);
  });

  it('never advertises a file input — files arrive through the file picker', () => {
    const keys: string[] = Object.keys(schema.properties);
    expect(keys.filter(k => /file|attachment|content|bytes/i.test(k))).toEqual([]);
  });
});
