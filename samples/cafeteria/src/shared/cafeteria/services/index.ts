import type { ICafeteriaDataService } from "./ICafeteriaDataService"
import { SyntheticCafeteriaDataService } from "./SyntheticCafeteriaDataService"

let instance: ICafeteriaDataService | undefined

/**
 * The single seam between the UI and the data layer. Today this always returns
 * the in-memory synthetic implementation; swapping in a SharePoint-list-backed
 * service later is a one-line change here, per BRD risk R1.
 */
export function getDataService(): ICafeteriaDataService {
  if (!instance) {
    instance = new SyntheticCafeteriaDataService()
  }
  return instance
}

export type { ICafeteriaDataService } from "./ICafeteriaDataService"
export { getOpenStatus, todayIsoDateInZone, todayWeekdayInZone } from "./openStatus"
export type { IOpenStatus } from "./openStatus"
