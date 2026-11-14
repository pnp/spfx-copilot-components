import { describe, expect, it } from 'vitest';
import schema from '../CosmoPoliteCopilotComponentProperties';
import { DESIGNS, IMAGE_KINDS, LAYOUTS } from './contract';
import { ALWAYS_DEBUG, MAX_TEXT_LENGTH, normalizeImageQuery, normalizeLanguage, normalizeProps } from './normalize';

interface IJsonSchema {
  required: string[];
  properties: Record<string, { enum?: string[]; maxLength?: number }>;
}

describe('tool contract', () => {
  const json: IJsonSchema = schema as unknown as IJsonSchema;

  it('offers the model exactly the presets and layouts the runtime accepts', () => {
    expect(json.properties.design.enum).toEqual([...DESIGNS]);
    expect(json.properties.layout.enum).toEqual([...LAYOUTS]);
    expect(json.properties.imageSource.enum).toEqual([...IMAGE_KINDS]);
    expect(json.properties.text.maxLength).toBe(MAX_TEXT_LENGTH);
  });

  it('requires language, title and text', () => {
    expect(json.required.sort()).toEqual(['imageQuery', 'language', 'text', 'title']);
  });
});

describe('normalizeLanguage', () => {
  it('accepts and canonicalises BCP 47 tags', () => {
    expect(normalizeLanguage('de-at')).toBe('de-AT');
    expect(normalizeLanguage(' fi ')).toBe('fi');
    expect(normalizeLanguage('de_AT')).toBe('de-AT');
    expect(normalizeLanguage('zh-Hant-TW')).toBe('zh-Hant-TW');
  });

  it('rejects anything else', () => {
    expect(normalizeLanguage('German')).toBeUndefined();
    expect(normalizeLanguage('')).toBeUndefined();
    expect(normalizeLanguage(42)).toBeUndefined();
    expect(normalizeLanguage('<script>')).toBeUndefined();
  });
});

describe('normalizeImageQuery', () => {
  it('drops URLs', () => {
    expect(normalizeImageQuery('https://example.com/a.jpg Vienna')).toBe('Vienna');
    expect(normalizeImageQuery('www.example.com')).toBeUndefined();
    expect(normalizeImageQuery('Helsinki Cathedral')).toBe('Helsinki Cathedral');
  });
});

describe('normalizeProps', () => {
  it('tolerates missing or broken input', () => {
    expect(normalizeProps(undefined)).toEqual({
      language: undefined,
      title: '',
      text: '',
      imageQuery: undefined,
      imageAlt: undefined,
      imageSource: undefined,
      wikipediaTitle: undefined,
      design: undefined,
      layout: undefined,
      voice: undefined,
      debug: ALWAYS_DEBUG
    });
  });

  it('drops unknown designs and truncates long text', () => {
    const result = normalizeProps({ language: 'sv', title: 'Stockholm', text: 'x'.repeat(5000), design: 'neon', debug: 'yes' });
    expect(result.design).toBeUndefined();
    expect(result.debug).toBe(ALWAYS_DEBUG);
    expect(result.text.length).toBe(MAX_TEXT_LENGTH);
    expect(result.text.endsWith('…')).toBe(true);
  });

  it('keeps valid values', () => {
    const result = normalizeProps({ language: 'ar', title: 'القاهرة', text: 'نص.', design: 'magazine', voice: 'female', debug: true });
    expect(result).toMatchObject({ language: 'ar', title: 'القاهرة', design: 'magazine', voice: 'female', debug: true });
  });
});

describe('image hints', () => {
  it('keeps a valid image source and a plain article title', () => {
    const r = normalizeProps({ language: 'en', title: 'T', text: 'x', imageSource: 'museum', wikipediaTitle: 'Death and the Maiden (Schiele)' });
    expect(r.imageSource).toBe('museum');
    expect(r.wikipediaTitle).toBe('Death and the Maiden (Schiele)');
  });

  it('drops unknown sources and URLs posing as titles', () => {
    const r = normalizeProps({ language: 'en', title: 'T', text: 'x', imageSource: 'getty', wikipediaTitle: 'https://en.wikipedia.org/wiki/X' });
    expect(r.imageSource).toBeUndefined();
    expect(r.wikipediaTitle).toBeUndefined();
  });
});

