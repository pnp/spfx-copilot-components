import { buildFormSchema, describeColumns, mapColumn, orderFields, type IRawField } from '../logic/fieldTypes';
import { DEMO_FIELDS } from '../services/DemoListFormService';

describe('field-type mapping', () => {
  it('maps single line of text, capped at 255', () => {
    const m = mapColumn({ InternalName: 'Title', Title: 'Title', TypeAsString: 'Text', Required: true, MaxLength: 80 });
    expect(m).toMatchObject({ kind: 'field', field: { kind: 'text', maxLength: 80, required: true } });
    expect(mapColumn({ InternalName: 'T', TypeAsString: 'Text', MaxLength: 9999 })).toMatchObject({ field: { maxLength: 255 } });
    expect(mapColumn({ InternalName: 'T', TypeAsString: 'Text' })).toMatchObject({ field: { maxLength: 255, title: 'T' } });
  });

  it('maps multiple lines of text and keeps the rich-text flag', () => {
    expect(mapColumn({ InternalName: 'Body', TypeAsString: 'Note', RichText: true })).toMatchObject({ kind: 'field', field: { kind: 'note', richText: true, maxLength: 63999 } });
    expect(mapColumn({ InternalName: 'Body', TypeAsString: 'Note' })).toMatchObject({ field: { richText: false } });
  });

  it('maps choice (array or verbose results), and fill-in choice offers only the defined options', () => {
    expect(mapColumn({ InternalName: 'C', TypeAsString: 'Choice', Choices: ['A', 'B', ''] })).toMatchObject({ field: { kind: 'choice', choices: ['A', 'B'] } });
    expect(mapColumn({ InternalName: 'C', TypeAsString: 'Choice', Choices: { results: ['X'] } })).toMatchObject({ field: { choices: ['X'] } });
    expect(mapColumn({ InternalName: 'C', TypeAsString: 'Choice', Choices: [] })).toMatchObject({ kind: 'unsupported', column: { typeLabel: 'Choice (no options)' } });
  });

  it('maps date-only columns to a date step and date-and-time columns to a date + time step', () => {
    expect(mapColumn({ InternalName: 'D', TypeAsString: 'DateTime', DisplayFormat: 0 })).toMatchObject({ field: { kind: 'date', maxLength: 10 } });
    expect(mapColumn({ InternalName: 'D', TypeAsString: 'DateTime', DisplayFormat: 1 })).toMatchObject({ kind: 'field', field: { kind: 'datetime', maxLength: 16 } });
    // A missing format is treated as date and time, the safer superset (nothing is lost).
    expect(mapColumn({ InternalName: 'D', TypeAsString: 'DateTime' })).toMatchObject({ field: { kind: 'datetime' } });
  });

  it('maps MultiChoice columns to a multichoice step with only the defined options', () => {
    const mapped = mapColumn({ InternalName: 'M', Title: 'Devices', TypeAsString: 'MultiChoice', Required: true, Choices: ['Laptop', 'Phone', 'Laptop', ''], FillInChoice: true });
    expect(mapped).toMatchObject({ kind: 'field', field: { kind: 'multichoice', required: true, choices: ['Laptop', 'Phone'] } });
  });


  it('maps Yes/No columns to a yesno step with Yes and No', () => {
    const mapped = mapColumn({ InternalName: 'OnTrack', Title: 'Is this on track?', TypeAsString: 'Boolean', Required: true });
    expect(mapped).toMatchObject({ kind: 'field', field: { kind: 'yesno', required: true, choices: ['Yes', 'No'] } });
  });

  it('maps Number columns to a number step', () => {
    const mapped = mapColumn({ InternalName: 'EffortDays', Title: 'Estimated days', TypeAsString: 'Number', Required: false });
    expect(mapped).toMatchObject({ kind: 'field', field: { kind: 'number', required: false, maxLength: 32 } });
  });

  it('maps Currency columns, including FieldTypeKind 10 when TypeAsString is missing, and keeps CurrencyLocaleId', () => {
    expect(mapColumn({ InternalName: 'Amount', Title: 'Amount', TypeAsString: 'Currency', Required: true, CurrencyLocaleId: 1033 })).toMatchObject({
      kind: 'field',
      field: { kind: 'currency', required: true, maxLength: 32, currencyLocaleId: 1033 }
    });
    expect(mapColumn({ InternalName: 'Amount', FieldTypeKind: 10, CurrencyLocaleId: '1053' })).toMatchObject({
      field: { kind: 'currency', currencyLocaleId: 1053 }
    });
  });

  it('maps URL columns in URL format to a hyperlink step, and leaves Picture format unsupported', () => {
    expect(mapColumn({ InternalName: 'Receipt', Title: 'Receipt', TypeAsString: 'URL', DisplayFormat: 0, Required: false })).toMatchObject({
      kind: 'field',
      field: { kind: 'hyperlink', required: false, maxLength: 255 }
    });
    expect(mapColumn({ InternalName: 'Receipt', TypeAsString: 'URL' })).toMatchObject({ field: { kind: 'hyperlink' } });
    expect(mapColumn({ InternalName: 'Photo', Title: 'Photo', TypeAsString: 'URL', DisplayFormat: 1, Required: true })).toMatchObject({
      kind: 'unsupported',
      column: { typeLabel: 'Picture', required: true }
    });
  });

  it('a choice or MultiChoice column with no options is unsupported', () => {
    expect(mapColumn({ InternalName: 'M', TypeAsString: 'MultiChoice', Choices: [] })).toMatchObject({ kind: 'unsupported', column: { typeLabel: 'Choice (multiple, no options)' } });
    expect(mapColumn({ InternalName: 'C', TypeAsString: 'Choice' })).toMatchObject({ kind: 'unsupported', column: { typeLabel: 'Choice (no options)' } });
  });

  it('a fill-in single choice column still offers only its options', () => {
    expect(mapColumn({ InternalName: 'C', TypeAsString: 'Choice', Choices: ['A', 'B'], FillInChoice: true })).toMatchObject({ field: { kind: 'choice', choices: ['A', 'B'] } });
  });

  it.each([
    ['User', 'Person or Group'],
    ['UserMulti', 'Person or Group'],
    ['Lookup', 'Lookup'],
    ['TaxonomyFieldType', 'Managed metadata'],
    ['Location', 'Location'],
    ['Thumbnail', 'Image'],
    ['SomethingNew', 'SomethingNew']
  ])('%s is unsupported, labelled %s', (type, label) => {
    expect(mapColumn({ InternalName: 'X', TypeAsString: type })).toMatchObject({ kind: 'unsupported', column: { typeLabel: label } });
  });

  it.each<[string, IRawField]>([
    ['hidden', { InternalName: 'H', TypeAsString: 'Text', Hidden: true }],
    ['read-only', { InternalName: 'R', TypeAsString: 'Text', ReadOnlyField: true }],
    ['computed', { InternalName: 'LinkTitle2', TypeAsString: 'Computed' }],
    ['calculated', { InternalName: 'Calc', TypeAsString: 'Calculated' }],
    ['system column', { InternalName: 'ContentType', TypeAsString: 'Text' }],
    ['underscore column', { InternalName: '_ModerationStatus', TypeAsString: 'Text' }],
    ['unsafe internal name', { InternalName: '__proto__', TypeAsString: 'Text' }],
    ['missing name', { TypeAsString: 'Text' }]
  ])('ignores %s columns', (_label, raw) => {
    expect(mapColumn(raw)).toEqual({ kind: 'ignored' });
  });
});

describe('form schema', () => {
  it('keeps supported steps in list order, skips optional unsupported, blocks required unsupported', () => {
    const schema = buildFormSchema('IT Requests', '', DEMO_FIELDS.concat([{ InternalName: 'Approver', Title: 'Approver', TypeAsString: 'User', Required: true }]));
    expect(schema.fields.map((f) => f.internalName)).toEqual(['Title', 'Category', 'Details', 'NeededBy']);
    expect(schema.skipped.map((c) => c.internalName)).toEqual(['Owner']);
    expect(schema.blocking.map((c) => c.internalName)).toEqual(['Approver']);
    expect(describeColumns(schema.blocking)).toBe('Approver (Person or Group)');
  });

  it('drops duplicate columns', () => {
    const schema = buildFormSchema('L', '', [
      { InternalName: 'Title', TypeAsString: 'Text' },
      { InternalName: 'Title', TypeAsString: 'Text' }
    ]);
    expect(schema.fields).toHaveLength(1);
  });

  it('orders by the fields setting (internal or display name) and always keeps required steps', () => {
    const all = buildFormSchema('L', '', DEMO_FIELDS).fields;
    expect(orderFields(all, 'neededby, Tell us a bit more').map((f) => f.internalName)).toEqual(['NeededBy', 'Details', 'Title', 'Category']);
    expect(orderFields(all, 'Nope').map((f) => f.internalName)).toEqual(['Title', 'Category', 'Details', 'NeededBy']);
    expect(orderFields(all, '').length).toBe(4);
  });
});
