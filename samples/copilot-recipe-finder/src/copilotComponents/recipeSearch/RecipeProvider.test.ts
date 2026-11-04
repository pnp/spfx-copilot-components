import { normalizeRecipe, TheMealDbRecipeProvider } from './TheMealDbRecipeProvider';

const meal = {
  idMeal: '52771', strMeal: 'Penne', strInstructions: 'Boil pasta.\r\n\r\nAdd sauce.',
  strIngredient1: ' Pasta ', strMeasure1: ' 1 cup ', strIngredient2: '',
  strMealThumb: 'https://www.themealdb.com/images/media/meals/test.jpg'
};

function response(meals: unknown, status: number = 200): Response {
  return { ok: status === 200, status, json: async () => ({ meals }) } as Response;
}

describe('recipe normalization', () => {
  it('preserves measures without guessing quantities, servings, or dietary claims', () => {
    const recipe = normalizeRecipe(meal)!;
    expect(recipe.ingredients).toEqual([{ name: 'Pasta', measure: '1 cup', quantity: undefined, unit: undefined }]);
    expect(recipe.instructions).toEqual(['Boil pasta.', 'Add sauce.']);
    expect(recipe.servings).toBeUndefined();
    expect(recipe.preparationMinutes).toBeUndefined();
    expect(recipe.dietaryLabels).toEqual([]);
    expect(recipe.sourceUrl).toBe('https://www.themealdb.com/meal/52771');
  });

  it('keeps missing instructions and quantities absent', () => {
    const recipe = normalizeRecipe({ ...meal, strInstructions: null, strMeasure1: null })!;
    expect(recipe.instructions).toEqual([]);
    expect(recipe.ingredients[0].measure).toBe('');
  });

  it('allows provider artwork under development terms without claiming a Creative Commons licence', () => {
    const image = normalizeRecipe({ ...meal, strCreativeCommonsConfirmed: null, strImageSource: null })!.image;
    expect(image.rightsConfirmed).toBe(true);
    expect(image.permissionBasis).toBe('provider-terms');
    expect(image.rightsMetadata).toBeUndefined();
    expect(image.url).toBe(meal.strMealThumb);
  });

  it('preserves explicit Creative Commons confirmation', () => {
    const image = normalizeRecipe({ ...meal, strCreativeCommonsConfirmed: 'Yes' })!.image;
    expect(image.rightsConfirmed).toBe(true);
    expect(image.permissionBasis).toBe('creative-commons');
    expect(image.rightsMetadata).toBe('Yes');
  });

  it('withholds explicitly unconfirmed or third-party artwork without separate permission', () => {
    expect(normalizeRecipe({ ...meal, strCreativeCommonsConfirmed: 'No' })!.image.rightsConfirmed).toBe(false);
    const image = normalizeRecipe({ ...meal, strImageSource: 'https://third-party.example/photo' })!.image;
    expect(image.rightsConfirmed).toBe(false);
    expect(image.permissionBasis).toBeUndefined();
    expect(image.sourceUrl).toBe('https://third-party.example/photo');
  });

  it('withholds missing or unsafe image URLs even with rights confirmation', () => {
    expect(normalizeRecipe({ ...meal, strMealThumb: null })!.image.rightsConfirmed).toBe(false);
    expect(normalizeRecipe({ ...meal, strMealThumb: 'http://www.themealdb.com/test.jpg', strCreativeCommonsConfirmed: 'Yes' })!.image.rightsConfirmed).toBe(false);
  });

  it('rejects unsafe links and unapproved image hosts', () => {
    const recipe = normalizeRecipe({ ...meal, strSource: 'http://insecure.example', strMealThumb: 'https://unapproved.example/image.jpg' })!;
    expect(recipe.originalSourceUrl).toBeUndefined();
    expect(recipe.image.url).toBeUndefined();
    expect(recipe.image.rightsConfirmed).toBe(false);
  });

  it('rejects malformed recipe identities', () => {
    expect(normalizeRecipe({ ...meal, idMeal: '../bad' })).toBeUndefined();
    expect(normalizeRecipe({ ...meal, strMeal: ' ' })).toBeUndefined();
  });
});

describe('recipe retrieval', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('encodes the query and looks up full details before returning results', async () => {
    const fetcher = jest.fn().mockResolvedValue(response([meal]));
    const result = await new TheMealDbRecipeProvider(fetcher).search('pasta & sauce');
    expect(fetcher.mock.calls[0][0]).toContain('s=pasta%20%26%20sauce');
    expect(fetcher.mock.calls[1][0]).toContain('lookup.php?i=52771');
    expect(result[0].id).toBe('52771');
  });

  it('returns no invented results for empty searches', async () => {
    expect(await new TheMealDbRecipeProvider(jest.fn().mockResolvedValue(response(null))).search('unknown')).toEqual([]);
  });

  it('bounds result count and provider calls', async () => {
    const meals = [1, 2, 3, 4].map(id => ({ ...meal, idMeal: String(id) }));
    const fetcher = jest.fn().mockResolvedValue(response(meals));
    expect(await new TheMealDbRecipeProvider(fetcher).search('pasta')).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('handles rate limits', async () => {
    await expect(new TheMealDbRecipeProvider(jest.fn().mockResolvedValue(response(null, 429))).search('pasta')).rejects.toThrow('rate limit');
  });

  it('handles network failures without logging the query', async () => {
    await expect(new TheMealDbRecipeProvider(jest.fn().mockRejectedValue(new Error('offline'))).search('pasta')).rejects.toThrow('connection');
    expect(console.warn).toHaveBeenCalledWith('Recipe provider request failed.');
  });

  it('rejects malformed response envelopes', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ unexpected: [] }) });
    await expect(new TheMealDbRecipeProvider(fetcher).search('pasta')).rejects.toThrow('valid data');
  });

  it('rejects an empty query without making requests', async () => {
    const fetcher = jest.fn();
    await expect(new TheMealDbRecipeProvider(fetcher).search(' ')).rejects.toThrow('recipe name');
    expect(fetcher).not.toHaveBeenCalled();
  });
});