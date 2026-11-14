import * as React from "react"

import type { IListCafeteriasFilter, ISearchMenuItemsFilter } from "../models"

export type NavSection = "cafeterias" | "menu" | "search"

export type CafeteriaView =
  | { name: "cafeterias" }
  | { name: "menu"; cafeteriaId: string; date?: string }
  | { name: "search" }
  | { name: "details"; cafeteriaId: string; from: NavSection }

export interface ICafeteriaNavigation {
  view: CafeteriaView
  activeSection: NavSection
  cafeteriaListFilter: IListCafeteriasFilter
  searchFilter: ISearchMenuItemsFilter
  setCafeteriaListFilter: (filter: IListCafeteriasFilter) => void
  setSearchFilter: (filter: ISearchMenuItemsFilter) => void
  goToCafeterias: () => void
  goToMenu: (cafeteriaId: string, date?: string) => void
  goToSearch: () => void
  goToDetails: (cafeteriaId: string) => void
}

/**
 * Owns which view is showing and the filter state each view needs. The
 * initial view/filters are seeded by the caller — each per-tool Copilot
 * Component knows exactly which view it represents (`getListCafeteria` →
 * cafeterias, `getMenu` → menu, etc.), so there's no need to infer it from
 * property shape. After first paint, in-app navigation fully drives the view.
 */
export function useCafeteriaNavigation(
  initialView: CafeteriaView,
  initialListFilter: IListCafeteriasFilter,
  initialSearchFilter: ISearchMenuItemsFilter,
): ICafeteriaNavigation {
  const [view, setView] = React.useState<CafeteriaView>(initialView)
  const [cafeteriaListFilter, setCafeteriaListFilter] =
    React.useState<IListCafeteriasFilter>(initialListFilter)
  const [searchFilter, setSearchFilter] =
    React.useState<ISearchMenuItemsFilter>(initialSearchFilter)

  const activeSection: NavSection = view.name === "details" ? view.from : view.name

  return {
    view,
    activeSection,
    cafeteriaListFilter,
    searchFilter,
    setCafeteriaListFilter,
    setSearchFilter,
    goToCafeterias: () => setView({ name: "cafeterias" }),
    goToMenu: (cafeteriaId: string, date?: string) => setView({ name: "menu", cafeteriaId, date }),
    goToSearch: () => setView({ name: "search" }),
    goToDetails: (cafeteriaId: string) =>
      setView((prev) => ({
        name: "details",
        cafeteriaId,
        from: prev.name === "details" ? prev.from : prev.name,
      })),
  }
}
