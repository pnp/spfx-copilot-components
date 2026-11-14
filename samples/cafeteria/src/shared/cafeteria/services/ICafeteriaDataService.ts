import type {
  ICafeteria,
  IGetCafeteriaDetailsArgs,
  IGetMenuArgs,
  IListCafeteriasFilter,
  IMenuItem,
  ISearchMenuItemsFilter,
} from "../models"

/**
 * Data access contract for the cafeteria domain. `services/index.ts#getDataService`
 * is the single place that chooses an implementation — swapping the synthetic
 * implementation for a SharePoint-list-backed one later only touches that file.
 */
export interface ICafeteriaDataService {
  listCafeterias(filter?: IListCafeteriasFilter): Promise<ICafeteria[]>
  getCafeteriaDetails(args: IGetCafeteriaDetailsArgs): Promise<ICafeteria | undefined>
  /** Returns undefined items when no menu is published for the cafeteria/date (F12 empty state), distinct from an empty array. */
  getMenu(args: IGetMenuArgs): Promise<{ published: boolean; items: IMenuItem[] }>
  searchMenuItems(
    filter: ISearchMenuItemsFilter,
  ): Promise<Array<{ cafeteria: ICafeteria; items: IMenuItem[]; menuPublished: boolean }>>
}
