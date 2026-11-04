import { MockRecipeProvider } from './MockRecipeProvider';
import type { IRecipeProvider } from './RecipeModels';
import { TheMealDbRecipeProvider } from './TheMealDbRecipeProvider';

function isLocalDebugManifest(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

export function createRecipeProvider(search: string = typeof window === 'undefined' ? '' : window.location.search): IRecipeProvider {
  const parameters = new URLSearchParams(search);
  if (parameters.get('recipeProvider') === 'mock' && isLocalDebugManifest(parameters.get('debugManifestsFile') ?? undefined)) {
    return new MockRecipeProvider();
  }
  return new TheMealDbRecipeProvider();
}