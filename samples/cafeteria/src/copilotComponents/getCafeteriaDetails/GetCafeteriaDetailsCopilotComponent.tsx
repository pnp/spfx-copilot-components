import type { DeepReadonly } from "@microsoft/sp-copilot-component"

import {
  CafeteriaCopilotComponentBase,
  type ICafeteriaInitialNavState,
} from "../../shared/cafeteria/CafeteriaCopilotComponentBase"
import type { IGetCafeteriaDetailsCopilotComponentProperties } from "./GetCafeteriaDetailsCopilotComponentProperties"

import * as strings from "GetCafeteriaDetailsCopilotComponentStrings"

export default class GetCafeteriaDetailsCopilotComponent extends CafeteriaCopilotComponentBase<IGetCafeteriaDetailsCopilotComponentProperties> {
  protected readonly strings = strings

  protected buildInitialNavState(
    properties: DeepReadonly<IGetCafeteriaDetailsCopilotComponentProperties>,
  ): ICafeteriaInitialNavState {
    return {
      view: { name: "details", cafeteriaId: properties.cafeteriaId, from: "cafeterias" },
      listFilter: {},
      searchFilter: {},
    }
  }
}
