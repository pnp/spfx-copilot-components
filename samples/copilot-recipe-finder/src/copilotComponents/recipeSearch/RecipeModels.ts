export interface IRecipeIngredient {
  name: string;
  measure: string;
  quantity?: number;
  unit?: string;
}

export interface IRecipeImage {
  url?: string;
  alt: string;
  rightsConfirmed: boolean;
  rightsMetadata?: string;
  sourceUrl?: string;
  permissionBasis?: 'creative-commons' | 'provider-terms' | 'original';
}

export interface IRecipe {
  id: string;
  title: string;
  sourceUrl?: string;
  originalSourceUrl?: string;
  image: IRecipeImage;
  ingredients: IRecipeIngredient[];
  instructions: string[];
  servings?: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  dietaryLabels: string[];
}

export interface IRecipeProviderInfo {
  readonly name: string;
  readonly attribution: string;
  readonly attributionUrl?: string;
}

export interface IRecipeProvider {
  readonly info: IRecipeProviderInfo;
  search(query: string): Promise<IRecipe[]>;
}