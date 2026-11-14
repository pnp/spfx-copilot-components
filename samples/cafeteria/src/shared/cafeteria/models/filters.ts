import type { DietaryTag } from "./enums"

export interface IListCafeteriasFilter {
  openNow?: boolean
  building?: string
}

export interface IGetMenuArgs {
  cafeteriaId: string
  /** ISO date; defaults to today in the cafeteria's own time zone when omitted. */
  date?: string
}

export interface ISearchMenuItemsFilter {
  query?: string
  dietaryTags?: DietaryTag[]
  maxPrice?: number
  cafeteriaId?: string
  date?: string
}

export interface IGetCafeteriaDetailsArgs {
  cafeteriaId: string
}
