import * as React from "react"
import { Fade } from "@fluentui/react-motion-components-preview"

import type { ICafeteriaNavigation } from "../../hooks/useCafeteriaNavigation"
import CafeteriaListView from "../cafeterias/CafeteriaListView"
import MenuView from "../menu/MenuView"
import SearchView from "../search/SearchView"
import CafeteriaDetailsView from "../details/CafeteriaDetailsView"

export interface ICafeteriaContentProps {
  nav: ICafeteriaNavigation
}

/**
 * Renders whichever view the current navigation state points at. Shared
 * between the fullscreen dashboard's content pane and the inline compact
 * shell so both stay in lockstep with the same routing logic.
 */
export default function CafeteriaContent(props: ICafeteriaContentProps): React.ReactElement {
  const { nav } = props
  const { view } = nav

  let content: React.ReactElement
  switch (view.name) {
    case "cafeterias":
      content = (
        <CafeteriaListView
          filter={nav.cafeteriaListFilter}
          onFilterChange={nav.setCafeteriaListFilter}
          onSelectCafeteria={(cafeteriaId) => nav.goToMenu(cafeteriaId)}
        />
      )
      break
    case "menu":
      content = (
        <MenuView
          cafeteriaId={view.cafeteriaId}
          date={view.date}
          onCafeteriaChange={(cafeteriaId) => nav.goToMenu(cafeteriaId, view.date)}
          onDateChange={(date) => nav.goToMenu(view.cafeteriaId, date)}
          onViewDetails={nav.goToDetails}
        />
      )
      break
    case "search":
      content = (
        <SearchView
          filter={nav.searchFilter}
          onFilterChange={nav.setSearchFilter}
          onViewMenu={(cafeteriaId) => nav.goToMenu(cafeteriaId)}
        />
      )
      break
    case "details":
      content = <CafeteriaDetailsView cafeteriaId={view.cafeteriaId} onViewMenu={(id) => nav.goToMenu(id)} />
      break
    default:
      content = <CafeteriaListView
        filter={nav.cafeteriaListFilter}
        onFilterChange={nav.setCafeteriaListFilter}
        onSelectCafeteria={(cafeteriaId) => nav.goToMenu(cafeteriaId)}
      />
  }

  return (
    <Fade visible appear key={view.name === "menu" || view.name === "details" ? `${view.name}-${view.cafeteriaId}` : view.name}>
      <div>{content}</div>
    </Fade>
  )
}
