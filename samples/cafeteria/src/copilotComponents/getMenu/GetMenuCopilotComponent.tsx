import type { DeepReadonly } from "@microsoft/sp-copilot-component"

import {
  CafeteriaCopilotComponentBase,
  type ICafeteriaInitialNavState,
} from "../../shared/cafeteria/CafeteriaCopilotComponentBase"
import type { IGetMenuCopilotComponentProperties } from "./GetMenuCopilotComponentProperties"

import * as strings from "GetMenuCopilotComponentStrings"

export default class GetMenuCopilotComponent extends CafeteriaCopilotComponentBase<IGetMenuCopilotComponentProperties> {
  protected readonly strings = strings

  protected buildInitialNavState(
    properties: DeepReadonly<IGetMenuCopilotComponentProperties>,
  ): ICafeteriaInitialNavState {
    return {
      view: { name: "menu", cafeteriaId: properties.cafeteriaId, date: properties.date },
      listFilter: {},
      searchFilter: { cafeteriaId: properties.cafeteriaId, date: properties.date },
    }
  }
}
