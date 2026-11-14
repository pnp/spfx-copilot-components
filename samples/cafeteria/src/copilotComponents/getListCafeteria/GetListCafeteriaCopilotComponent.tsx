import type { DeepReadonly } from "@microsoft/sp-copilot-component"

import {
  CafeteriaCopilotComponentBase,
  type ICafeteriaInitialNavState,
} from "../../shared/cafeteria/CafeteriaCopilotComponentBase"
import type { IGetListCafeteriaCopilotComponentProperties } from "./GetListCafeteriaCopilotComponentProperties"

import * as strings from "GetListCafeteriaCopilotComponentStrings"

export default class GetListCafeteriaCopilotComponent extends CafeteriaCopilotComponentBase<IGetListCafeteriaCopilotComponentProperties> {
  protected readonly strings = strings

  protected buildInitialNavState(
    properties: DeepReadonly<IGetListCafeteriaCopilotComponentProperties>,
  ): ICafeteriaInitialNavState {
    return {
      view: { name: "cafeterias" },
      listFilter: { openNow: properties.openNow, building: properties.building },
      searchFilter: {},
    }
  }
}
