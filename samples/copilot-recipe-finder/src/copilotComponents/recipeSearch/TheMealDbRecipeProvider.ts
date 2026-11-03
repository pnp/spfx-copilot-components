import { z } from 'zod';
import type { IRecipe, IRecipeProvider } from './RecipeModels';

export type { IRecipe, IRecipeProvider } from './RecipeModels';

const mealSchema = z.object({
  idMeal: z.string().regex(/^\d+$/),
  strMeal: z.string().trim().min(1),
  strInstructions: z.string().nullish(),
  strSource: z.string().nullish(),
  strMealThumb: z.string().nullish(),
  strImageSource: z.string().nullish(),
  strCreativeCommonsConfirmed: z.string().nullish()
}).catchall(z.unknown());

const responseSchema = z.object({ meals: z.array(z.unknown()).nullable() });

function safeUrl(value: unknown, image: boolean = false): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    if (image && url.hostname !== 'www.themealdb.com') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function normalizeRecipe(value: unknown): IRecipe | undefined {
  const parsed = mealSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const meal = parsed.data;
  const imageUrl = safeUrl(meal.strMealThumb, true);
  const rightsFlag = meal.strCreativeCommonsConfirmed?.trim().toLowerCase();
  const permissionBasis = rightsFlag === 'yes' ? 'creative-commons'
    : !rightsFlag && !meal.strImageSource?.trim() ? 'provider-terms' : undefined;
  const ingredients: IRecipe['ingredients'] = [];
  for (let slot = 1; slot <= 20; slot++) {
    const name = meal[`strIngredient${slot}`];
    const measure = meal[`strMeasure${slot}`];
    if (typeof name === 'string' && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: typeof measure === 'string' ? measure.trim() : '',
        quantity: undefined,
        unit: undefined
      });
    }
  }
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    sourceUrl: `https://www.themealdb.com/meal/${meal.idMeal}`,
    originalSourceUrl: safeUrl(meal.strSource),
    image: {
      url: imageUrl,
      alt: meal.strMeal,
      rightsConfirmed: !!imageUrl && !!permissionBasis,
      rightsMetadata: meal.strCreativeCommonsConfirmed || undefined,
      sourceUrl: safeUrl(meal.strImageSource),
      permissionBasis
    },
    ingredients,
    instructions: (meal.strInstructions || '').split(/\r?\n/).map(step => step.trim()).filter(Boolean),
    servings: undefined,
    preparationMinutes: undefined,
    cookingMinutes: undefined,
    dietaryLabels: []
  };
}

export class TheMealDbRecipeProvider implements IRecipeProvider {
  public readonly info = {
    name: 'TheMealDB',
    attribution: 'Recipe data and imagery: TheMealDB',
    attributionUrl: 'https://www.themealdb.com/'
  };

  private readonly _fetch: (url: string, init?: RequestInit) => Promise<Response>;

  public constructor(fetcher: (url: string, init?: RequestInit) => Promise<Response> = (url, init) => window.fetch(url, init)) {
    this._fetch = fetcher;
  }

  private async _request(path: string): Promise<unknown[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await this._fetch(`https://www.themealdb.com/api/json/v1/1/${path}`, {
        signal: controller.signal,
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(response.status === 429 ? 'Recipe service rate limit reached. Try again later.' : 'Recipe service is unavailable. Try again later.');
      }
      return responseSchema.parse(await response.json()).meals || [];
    } catch (error) {
      console.warn('Recipe provider request failed.');
      if (error instanceof Error && error.message.startsWith('Recipe service')) throw error;
      throw new Error('Recipe service could not return valid data. Check your connection and try again.');
    } finally {
      clearTimeout(timer);
    }
  }

  public async search(query: string): Promise<IRecipe[]> {
    const term = query.trim();
    if (!term || term.length > 120) throw new Error('Enter a recipe name between 1 and 120 characters.');
    const matches = await this._request(`search.php?s=${encodeURIComponent(term)}`);
    const recipes: IRecipe[] = [];
    const seen = new Set<string>();
    for (const match of matches) {
      const candidate = normalizeRecipe(match);
      if (!candidate || seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      const details = await this._request(`lookup.php?i=${candidate.id}`);
      const recipe = details.map(normalizeRecipe).find(item => item?.id === candidate.id);
      if (recipe) recipes.push(recipe);
      if (seen.size >= 3) break;
    }
    return recipes;
  }
}