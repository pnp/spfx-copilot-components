import * as React from "react"
import { Title3, Link, makeStyles, tokens } from "@fluentui/react-components"

import type { ISearchResultGroup } from "../../models"
import MenuItemCard from "../menu/MenuItemCard"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
})

export interface ISearchResultsGroupProps {
  group: ISearchResultGroup
  onViewMenu: (cafeteriaId: string) => void
}

export default function SearchResultsGroup(props: ISearchResultsGroupProps): React.ReactElement {
  const styles = useStyles()
  const { group } = props

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <Title3>{group.cafeteria.title}</Title3>
        <Link onClick={() => props.onViewMenu(group.cafeteria.id)}>View full menu</Link>
      </div>
      <div className={styles.grid}>
        {group.items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
