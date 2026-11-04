import { MockRecipeProvider } from './MockRecipeProvider';

describe('mock recipe provider', () => {
  it('returns deterministic matching recipes with local, authorized images', async () => {
    const provider = new MockRecipeProvider();
    const first = await provider.search('penne');
    const second = await provider.search('penne');
    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
    expect(first[0].title).toBe('Penne Arrabiata');
    expect(first[0].sourceUrl).toBeUndefined();
    expect(first[0].image.url).toMatch(/mock-arrabiata\.svg$/);
    expect(first[0].image.rightsConfirmed).toBe(true);
    expect(first[0].image.permissionBasis).toBe('original');
  });

  it('returns no results for unmatched dishes and validates the query', async () => {
    const provider = new MockRecipeProvider();
    expect(await provider.search('soup')).toEqual([]);
    await expect(provider.search(' ')).rejects.toThrow('recipe name');
    await expect(provider.search('a'.repeat(121))).rejects.toThrow('recipe name');
  });
});