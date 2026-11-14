import type { DeepReadonly } from "@microsoft/sp-copilot-component"

import {
  CafeteriaCopilotComponentBase,
  type ICafeteriaInitialNavState,
} from "../../shared/cafeteria/CafeteriaCopilotComponentBase"
import type { ISearchMenuItemsCopilotComponentProperties } from "./SearchMenuItemsCopilotComponentProperties"

import * as strings from "SearchMenuItemsCopilotComponentStrings"

export default class SearchMenuItemsCopilotComponent extends CafeteriaCopilotComponentBase<ISearchMenuItemsCopilotComponentProperties> {
  protected readonly strings = strings

  protected buildInitialNavState(
    properties: DeepReadonly<ISearchMenuItemsCopilotComponentProperties>,
  ): ICafeteriaInitialNavState {
    return {
      view: { name: "search" },
      listFilter: {},
      searchFilter: {
        query: properties.query,
        dietaryTags: properties.dietaryTags ? [...properties.dietaryTags] : undefined,
        maxPrice: properties.maxPrice,
        cafeteriaId: properties.cafeteriaId,
        date: properties.date,
      },
    }
  }
}
