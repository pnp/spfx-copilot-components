import { MockRecipeProvider } from './MockRecipeProvider';
import { createRecipeProvider } from './RecipeProviderFactory';
import { TheMealDbRecipeProvider } from './TheMealDbRecipeProvider';

describe('recipe provider selection', () => {
  const localDebugManifest = encodeURIComponent('https://localhost:4321/temp/build/manifests.js');

  it('uses mock data only when explicitly selected with a local debug manifest', () => {
    const provider = createRecipeProvider(`?recipeProvider=mock&debugManifestsFile=${localDebugManifest}`);
    expect(provider).toBeInstanceOf(MockRecipeProvider);
  });

  it('keeps TheMealDB as the default provider', () => {
    expect(createRecipeProvider('')).toBeInstanceOf(TheMealDbRecipeProvider);
  });

  it('does not enable mock data outside a local debug session', () => {
    expect(createRecipeProvider('?recipeProvider=mock')).toBeInstanceOf(TheMealDbRecipeProvider);
    expect(createRecipeProvider('?recipeProvider=mock&debugManifestsFile=https%3A%2F%2Fexample.com%2Fmanifests.js'))
      .toBeInstanceOf(TheMealDbRecipeProvider);
  });
});