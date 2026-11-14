import * as React from "react"
import { Title2, Skeleton, makeStyles, tokens } from "@fluentui/react-components"
import { Search24Regular } from "@fluentui/react-icons"
import { Fade, Stagger } from "@fluentui/react-motion-components-preview"

import type { ISearchMenuItemsFilter } from "../../models"
import { getDataService, todayIsoDateInZone } from "../../services"
import { useDataQuery } from "../../hooks/useDataQuery"
import ErrorState from "../common/ErrorState"
import CardSkeleton from "../common/CardSkeleton"
import IconChip from "../common/IconChip"
import FilterRail from "./FilterRail"
import SearchResultsGroup from "./SearchResultsGroup"
import ZeroResultsState from "./ZeroResultsState"
import NotPublishedEmptyState from "../menu/NotPublishedEmptyState"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  layout: {
    display: "flex",
    gap: tokens.spacingHorizontalXL,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  results: {
    flexGrow: 1,
    minWidth: "280px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
})

export interface ISearchViewProps {
  filter: ISearchMenuItemsFilter
  onFilterChange: (filter: ISearchMenuItemsFilter) => void
  onViewMenu: (cafeteriaId: string) => void
}

export default function SearchView(props: ISearchViewProps): React.ReactElement {
  const styles = useStyles()
  const { filter, onFilterChange, onViewMenu } = props

  const cafeteriasQuery = useDataQuery(() => getDataService().listCafeterias(), [])

  const resultsQuery = useDataQuery(
    () => getDataService().searchMenuItems(filter),
    [filter.query, filter.maxPrice, filter.cafeteriaId, filter.date, JSON.stringify(filter.dietaryTags ?? [])],
  )

  const hasAnyFilter = Boolean(
    filter.query || filter.maxPrice !== undefined || filter.cafeteriaId || (filter.dietaryTags ?? []).length > 0,
  )

  const groupsWithItems = (resultsQuery.data ?? []).filter((group) => group.items.length > 0)
  const unpublishedGroups = (resultsQuery.data ?? []).filter((group) => !group.menuPublished)
  const hasPublishedMenu = (resultsQuery.data ?? []).some((group) => group.menuPublished)

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <IconChip hue="brand">
          <Search24Regular />
        </IconChip>
        <Title2>{hasAnyFilter ? "Search results" : "Compare across cafeterias"}</Title2>
      </div>

      <div className={styles.layout}>
        <FilterRail filter={filter} cafeterias={cafeteriasQuery.data ?? []} onChange={onFilterChange} />

        <div className={styles.results}>
          {resultsQuery.loading && (
            <Skeleton className={styles.grid} aria-label="Loading search results">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} showImage footerItems={2} />
              ))}
            </Skeleton>
          )}
          {resultsQuery.error && <ErrorState message="We couldn't search the menus right now." />}
          {!resultsQuery.loading && !resultsQuery.error && groupsWithItems.length === 0 &&
            (hasPublishedMenu || unpublishedGroups.length === 0) && <ZeroResultsState />}
          {!resultsQuery.loading && !resultsQuery.error && unpublishedGroups.map((group) => (
            <NotPublishedEmptyState
              key={group.cafeteria.id}
              cafeteriaTitle={group.cafeteria.title}
              date={filter.date ?? todayIsoDateInZone(group.cafeteria.timeZone)}
            />
          ))}
          {!resultsQuery.loading && !resultsQuery.error && groupsWithItems.length > 0 && (
            <Stagger visible itemDelay={60}>
              {groupsWithItems.map((group) => (
                <Fade key={group.cafeteria.id} appear>
                  <SearchResultsGroup group={group} onViewMenu={onViewMenu} />
                </Fade>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  )
}
