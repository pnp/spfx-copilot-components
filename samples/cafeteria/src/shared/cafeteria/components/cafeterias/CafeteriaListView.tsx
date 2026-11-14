import * as React from "react"
import {
  Title2,
  Body1,
  Switch,
  Dropdown,
  Option,
  Skeleton,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { Building24Regular } from "@fluentui/react-icons"
import { Fade, Stagger } from "@fluentui/react-motion-components-preview"

import type { IListCafeteriasFilter } from "../../models"
import { getDataService } from "../../services"
import { useDataQuery } from "../../hooks/useDataQuery"
import ErrorState from "../common/ErrorState"
import CardSkeleton from "../common/CardSkeleton"
import IconChip from "../common/IconChip"
import CafeteriaCard from "./CafeteriaCard"

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
  filters: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
})

export interface ICafeteriaListViewProps {
  filter: IListCafeteriasFilter
  onFilterChange: (filter: IListCafeteriasFilter) => void
  onSelectCafeteria: (cafeteriaId: string) => void
}

export default function CafeteriaListView(props: ICafeteriaListViewProps): React.ReactElement {
  const styles = useStyles()
  const { filter, onFilterChange, onSelectCafeteria } = props

  const query = useDataQuery(
    () => getDataService().listCafeterias(filter),
    [filter.openNow, filter.building],
  )

  const allBuildings = useDataQuery(() => getDataService().listCafeterias(), [])
  const buildingOptions = React.useMemo(() => {
    const buildings = new Set((allBuildings.data ?? []).map((c) => c.building))
    return Array.from(buildings).sort()
  }, [allBuildings.data])

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <IconChip hue="brand">
          <Building24Regular />
        </IconChip>
        <Title2>Cafeterias</Title2>
      </div>

      <div className={styles.filters}>
        <Switch
          label="Open now"
          checked={filter.openNow ?? false}
          onChange={(_, data) => onFilterChange({ ...filter, openNow: data.checked || undefined })}
        />
        <Dropdown
          aria-label="Building"
          placeholder="All buildings"
          value={filter.building ?? ""}
          selectedOptions={filter.building ? [filter.building] : []}
          onOptionSelect={(_, data) =>
            onFilterChange({ ...filter, building: data.optionValue || undefined })
          }
        >
          <Option value="">All buildings</Option>
          {buildingOptions.map((building) => (
            <Option key={building} value={building}>
              {building}
            </Option>
          ))}
        </Dropdown>
      </div>

      {query.loading && (
        <Skeleton className={styles.grid} aria-label="Loading cafeterias">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} footerItems={3} />
          ))}
        </Skeleton>
      )}
      {query.error && (
        <ErrorState message="We couldn't load cafeterias right now." />
      )}
      {!query.loading && !query.error && query.data && query.data.length === 0 && (
        <Body1>No cafeterias match these filters.</Body1>
      )}
      {!query.loading && !query.error && query.data && query.data.length > 0 && (
        <div className={styles.grid}>
          <Stagger visible itemDelay={40}>
            {query.data.map((cafeteria) => (
              <Fade key={cafeteria.id} appear>
                <CafeteriaCard cafeteria={cafeteria} onSelect={onSelectCafeteria} />
              </Fade>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  )
}
