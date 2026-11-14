import type { ICafeteria } from "./ICafeteria"
import type { IMenuItem } from "./IMenuItem"

/** One cafeteria's matching items for the search / cross-cafeteria roll-up view (UC-3, UC-4). */
export interface ISearchResultGroup {
  cafeteria: ICafeteria
  items: IMenuItem[]
  /** False when the cafeteria has no published menu for the queried date at all (F12 empty state). */
  menuPublished: boolean
}
