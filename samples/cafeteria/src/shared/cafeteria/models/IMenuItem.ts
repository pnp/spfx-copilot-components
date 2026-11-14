import type { DietaryTag, MealPeriod, SpiceLevel } from "./enums"

export interface IMenuItem {
  id: string
  menuId: string
  /** Denormalized for search/filter convenience across menus. */
  cafeteriaId: string
  title: string
  mealPeriod: MealPeriod
  description?: string
  imageUrl?: string
  price: number
  dietaryTags: DietaryTag[]
  spiceLevel?: SpiceLevel
  sortOrder: number
  isSoldOut?: boolean
}
