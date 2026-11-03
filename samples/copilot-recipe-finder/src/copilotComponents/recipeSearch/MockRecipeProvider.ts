import mockArrabiataImage from './assets/mock-arrabiata.svg';
import mockCurryImage from './assets/mock-curry.svg';
import type { IRecipe, IRecipeProvider } from './RecipeModels';

const recipes: IRecipe[] = [
  {
    id: 'mock-arrabiata',
    title: 'Penne Arrabiata',
    image: { url: mockArrabiataImage, alt: 'Illustration of penne with tomato sauce', rightsConfirmed: true, permissionBasis: 'original' },
    ingredients: [
      { name: 'Penne', measure: '300 g' },
      { name: 'Tomatoes', measure: '400 g' },
      { name: 'Garlic', measure: '2 cloves' },
      { name: 'Chilli flakes', measure: '1 tsp' }
    ],
    instructions: ['Cook the penne until tender.', 'Warm the tomatoes, garlic, and chilli in a pan.', 'Toss the pasta with the sauce and serve.'],
    dietaryLabels: []
  },
  {
    id: 'mock-coconut-curry',
    title: 'Coconut Chickpea Curry',
    image: { url: mockCurryImage, alt: 'Illustration of chickpea and coconut curry', rightsConfirmed: true, permissionBasis: 'original' },
    ingredients: [
      { name: 'Chickpeas', measure: '2 cans' },
      { name: 'Coconut milk', measure: '400 ml' },
      { name: 'Spinach', measure: '2 handfuls' },
      { name: 'Curry powder', measure: '2 tsp' }
    ],
    instructions: ['Simmer chickpeas with coconut milk and curry powder.', 'Fold in the spinach until wilted.', 'Serve warm.'],
    dietaryLabels: []
  }
];

export class MockRecipeProvider implements IRecipeProvider {
  public readonly info = {
    name: 'Sample recipes',
    attribution: 'Sample recipe data for local testing'
  };

  public async search(query: string): Promise<IRecipe[]> {
    const term = query.trim();
    if (!term || term.length > 120) throw new Error('Enter a recipe name between 1 and 120 characters.');
    return recipes.filter(recipe => recipe.title.toLowerCase().includes(term.toLowerCase())).slice(0, 3);
  }
}