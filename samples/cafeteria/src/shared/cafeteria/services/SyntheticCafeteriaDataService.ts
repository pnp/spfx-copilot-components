import type {
  ICafeteria,
  IGetCafeteriaDetailsArgs,
  IGetMenuArgs,
  IListCafeteriasFilter,
  IMenuItem,
  ISearchMenuItemsFilter,
} from "../models"
import { MEAL_PERIOD_ORDER } from "../models"
import type { ICafeteriaDataService } from "./ICafeteriaDataService"
import { getOpenStatus, todayIsoDateInZone } from "./openStatus"
import { SEED_CAFETERIAS, SEED_TODAYS_MENU_ITEMS } from "./seedData"

const ARTIFICIAL_DELAY_MS = 200

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS))
}

function sortItems(items: IMenuItem[]): IMenuItem[] {
  return [...items].sort((a, b) => {
    const mealDiff = MEAL_PERIOD_ORDER.indexOf(a.mealPeriod) - MEAL_PERIOD_ORDER.indexOf(b.mealPeriod)
    return mealDiff !== 0 ? mealDiff : a.sortOrder - b.sortOrder
  })
}

/** Resolves the requested date against "today" in the cafeteria's own zone; synthetic seed data only models today's menu. */
function isRequestedDateToday(cafeteria: ICafeteria, date?: string): boolean {
  const today = todayIsoDateInZone(cafeteria.timeZone)
  return !date || date === today
}

export class SyntheticCafeteriaDataService implements ICafeteriaDataService {
  public async listCafeterias(filter?: IListCafeteriasFilter): Promise<ICafeteria[]> {
    let results = SEED_CAFETERIAS.filter((c) => c.isActive)

    if (filter?.building) {
      const needle = filter.building.toLowerCase()
      results = results.filter((c) => c.building.toLowerCase().includes(needle))
    }

    if (filter?.openNow) {
      results = results.filter((c) => getOpenStatus(c).isOpen)
    }

    return delay(results)
  }

  public async getCafeteriaDetails(
    args: IGetCafeteriaDetailsArgs,
  ): Promise<ICafeteria | undefined> {
    const cafeteria = SEED_CAFETERIAS.find((c) => c.id === args.cafeteriaId)
    return delay(cafeteria)
  }

  public async getMenu(
    args: IGetMenuArgs,
  ): Promise<{ published: boolean; items: IMenuItem[] }> {
    const cafeteria = SEED_CAFETERIAS.find((c) => c.id === args.cafeteriaId)
    if (!cafeteria) {
      return delay({ published: false, items: [] })
    }

    const seeded = SEED_TODAYS_MENU_ITEMS[cafeteria.id]
    if (!seeded || !isRequestedDateToday(cafeteria, args.date)) {
      return delay({ published: false, items: [] })
    }

    return delay({ published: true, items: sortItems(seeded) })
  }

  public async searchMenuItems(
    filter: ISearchMenuItemsFilter,
  ): Promise<Array<{ cafeteria: ICafeteria; items: IMenuItem[]; menuPublished: boolean }>> {
    let cafeterias = SEED_CAFETERIAS.filter((c) => c.isActive)
    if (filter.cafeteriaId) {
      cafeterias = cafeterias.filter((c) => c.id === filter.cafeteriaId)
    }

    const query = filter.query?.trim().toLowerCase()

    const groups = cafeterias.map((cafeteria) => {
      const seeded = SEED_TODAYS_MENU_ITEMS[cafeteria.id]
      const menuPublished = Boolean(seeded) && isRequestedDateToday(cafeteria, filter.date)

      if (!menuPublished || !seeded) {
        return { cafeteria, items: [], menuPublished: false }
      }

      const items = sortItems(seeded).filter((menuItem) => {
        if (query && !menuItem.title.toLowerCase().includes(query)) return false
        if (
          filter.dietaryTags &&
          filter.dietaryTags.length > 0 &&
          !filter.dietaryTags.every((tag) => menuItem.dietaryTags.includes(tag))
        ) {
          return false
        }
        if (filter.maxPrice !== undefined && menuItem.price > filter.maxPrice) return false
        return true
      })

      return { cafeteria, items, menuPublished: true }
    })

    return delay(groups)
  }
}
