import { SyntheticCafeteriaDataService } from "./SyntheticCafeteriaDataService"
import { NORTHSIDE_KITCHEN_ID, SPICE_ROUTE_ID } from "./seedData"
import type { IMenuItem } from "../models"

describe("SyntheticCafeteriaDataService", () => {
  const service = new SyntheticCafeteriaDataService()

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-10-22T12:00:00Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("requires every selected dietary tag", async () => {
    const result = service.searchMenuItems({ dietaryTags: ["Vegan", "GlutenFree"] })
    jest.runAllTimers()
    const groups = await result
    const items = groups.reduce<IMenuItem[]>((all, group) => all.concat(group.items), [])

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) =>
      item.dietaryTags.includes("Vegan") && item.dietaryTags.includes("GlutenFree"),
    )).toBe(true)
    expect(items.map((item) => item.title)).not.toContain("Masala Dosa")
    expect(items.map((item) => item.title)).not.toContain("Tofu Pad Thai")
  })

  it("preserves a zero price limit without treating menus as unpublished", async () => {
    const result = service.searchMenuItems({ cafeteriaId: SPICE_ROUTE_ID, maxPrice: 0 })
    jest.runAllTimers()

    expect(await result).toEqual([
      expect.objectContaining({ menuPublished: true, items: [] }),
    ])
  })

  it("distinguishes unpublished menus from published menus with no matching dishes", async () => {
    const result = service.searchMenuItems({ query: "no-such-dish" })
    jest.runAllTimers()
    const groups = await result

    expect(groups.find((group) => group.cafeteria.id === NORTHSIDE_KITCHEN_ID))
      .toEqual(expect.objectContaining({ menuPublished: false, items: [] }))
    expect(groups.find((group) => group.cafeteria.id === SPICE_ROUTE_ID))
      .toEqual(expect.objectContaining({ menuPublished: true, items: [] }))
  })

  it("reports menus as unpublished for dates without seeded data", async () => {
    const result = service.searchMenuItems({ date: "2026-10-23" })
    jest.runAllTimers()
    const groups = await result

    expect(groups.length).toBeGreaterThan(0)
    expect(groups.every((group) => !group.menuPublished && group.items.length === 0)).toBe(true)
  })

  it("restores all cafeterias when the building filter is cleared", async () => {
    const filtered = service.listCafeterias({ building: "Building 4" })
    const cleared = service.listCafeterias({ building: undefined })
    jest.runAllTimers()
    const filteredCafeterias = await filtered
    const allCafeterias = await cleared

    expect(filteredCafeterias).toHaveLength(2)
    expect(allCafeterias.length).toBeGreaterThan(filteredCafeterias.length)
    expect(filteredCafeterias.every((cafeteria) => cafeteria.building === "Building 4")).toBe(true)
  })
})
