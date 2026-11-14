jest.mock("../hooks/useDataQuery", () => ({ useDataQuery: jest.fn() }))
jest.mock("./menu/MenuView", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { ICafeteriaNavigation } from "../hooks/useCafeteriaNavigation"
import { useDataQuery } from "../hooks/useDataQuery"
import { SEED_CAFETERIAS, NORTHSIDE_KITCHEN_ID, SPICE_ROUTE_ID } from "../services/seedData"
import CafeteriaContent from "./shell/CafeteriaContent"
import MenuView from "./menu/MenuView"
import FilterRail from "./search/FilterRail"
import SearchView from "./search/SearchView"
import OpenStatusBadge from "./cafeterias/OpenStatusBadge"

const mockQuery = useDataQuery as jest.MockedFunction<typeof useDataQuery>
const mockMenuView = MenuView as jest.MockedFunction<typeof MenuView>

describe("Cafeteria views", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("preserves the selected date when changing cafeterias", () => {
    const nav: ICafeteriaNavigation = {
      view: { name: "menu", cafeteriaId: SPICE_ROUTE_ID, date: "2026-10-23" },
      activeSection: "menu",
      cafeteriaListFilter: {},
      searchFilter: {},
      setCafeteriaListFilter: jest.fn(),
      setSearchFilter: jest.fn(),
      goToCafeterias: jest.fn(),
      goToMenu: jest.fn(),
      goToSearch: jest.fn(),
      goToDetails: jest.fn(),
    }

    renderToStaticMarkup(<CafeteriaContent nav={nav} />)
    mockMenuView.mock.calls[0][0].onCafeteriaChange(NORTHSIDE_KITCHEN_ID)

    expect(nav.goToMenu).toHaveBeenCalledWith(NORTHSIDE_KITCHEN_ID, "2026-10-23")
  })

  it("associates the dietary dropdown with its visible label", () => {
    const html = renderToStaticMarkup(
      <FilterRail filter={{}} cafeterias={SEED_CAFETERIAS} onChange={jest.fn()} />,
    )

    expect(html).toContain('for="search-dietary-needs"')
    expect(html).toContain('id="search-dietary-needs"')
  })

  it("shows an unpublished-menu notice instead of a false zero-match result", () => {
    const cafeteria = SEED_CAFETERIAS.find((entry) => entry.id === NORTHSIDE_KITCHEN_ID)!
    mockQuery.mockReturnValueOnce({ data: SEED_CAFETERIAS, loading: false, error: undefined })
    mockQuery.mockReturnValueOnce({
      data: [{ cafeteria, items: [], menuPublished: false }],
      loading: false,
      error: undefined,
    })

    const html = renderToStaticMarkup(
      <SearchView filter={{ date: "2026-10-23" }} onFilterChange={jest.fn()} onViewMenu={jest.fn()} />,
    )

    expect(html).toContain("No menu published yet")
    expect(html).toContain("Northside Kitchen")
    expect(html).toContain("2026-10-23")
    expect(html).not.toContain("No dishes match")
  })

  it("labels closed hours as today's hours rather than the next opening", () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-10-23T16:00:00Z"))
    try {
      const html = renderToStaticMarkup(<OpenStatusBadge cafeteria={SEED_CAFETERIAS[0]} />)

      expect(html).toContain("Closed")
      expect(html).toContain("today&#x27;s hours")
      expect(html).not.toContain("opens")
    } finally {
      jest.useRealTimers()
    }
  })
})
