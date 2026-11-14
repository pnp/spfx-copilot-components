import * as React from "react"
import {
  Title2,
  Body1,
  Dropdown,
  Option,
  Button,
  Label,
  Skeleton,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { DatePicker } from "@fluentui/react-datepicker-compat"
import { Info24Regular, CalendarClock24Regular } from "@fluentui/react-icons"
import { Fade } from "@fluentui/react-motion-components-preview"

import { getDataService, getOpenStatus, todayIsoDateInZone } from "../../services"
import { useDataQuery } from "../../hooks/useDataQuery"
import ErrorState from "../common/ErrorState"
import CardSkeleton from "../common/CardSkeleton"
import IconChip from "../common/IconChip"
import AllergyDisclaimer from "../common/AllergyDisclaimer"
import OpenStatusBadge from "../cafeterias/OpenStatusBadge"
import MenuBoard from "./MenuBoard"
import NotPublishedEmptyState from "./NotPublishedEmptyState"

function isoDateToDate(iso?: string): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function dateToIsoDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month < 10 ? "0" : ""}${month}-${day < 10 ? "0" : ""}${day}`
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingVerticalS,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  control: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  closureBanner: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteRedForeground1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  disclaimer: {
    marginTop: tokens.spacingVerticalM,
  },
})

export interface IMenuViewProps {
  cafeteriaId: string
  date?: string
  onCafeteriaChange: (cafeteriaId: string) => void
  onDateChange: (date: string | undefined) => void
  onViewDetails: (cafeteriaId: string) => void
}

export default function MenuView(props: IMenuViewProps): React.ReactElement {
  const styles = useStyles()
  const { cafeteriaId, date, onCafeteriaChange, onDateChange, onViewDetails } = props

  const cafeteriasQuery = useDataQuery(() => getDataService().listCafeterias(), [])
  const cafeteria = React.useMemo(
    () => cafeteriasQuery.data?.find((c) => c.id === cafeteriaId),
    [cafeteriasQuery.data, cafeteriaId],
  )

  React.useEffect(() => {
    if (!cafeteriasQuery.data || cafeteriasQuery.data.length === 0) return
    const hasMatch = cafeteriasQuery.data.some((c) => c.id === cafeteriaId)
    if (!hasMatch) {
      onCafeteriaChange(cafeteriasQuery.data[0].id)
    }
  }, [cafeteriasQuery.data, cafeteriaId, onCafeteriaChange])

  const effectiveDate =
    date ?? todayIsoDateInZone(cafeteria?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)

  const menuQuery = useDataQuery(
    () => getDataService().getMenu({ cafeteriaId, date: effectiveDate }),
    [cafeteriaId, effectiveDate],
  )

  const status = cafeteria ? getOpenStatus(cafeteria) : undefined

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <div className={styles.titleRow}>
          <IconChip hue="brand">
            <CalendarClock24Regular />
          </IconChip>
          <Title2>{cafeteria?.title ?? "Today's Menu"}</Title2>
          {cafeteria && <OpenStatusBadge cafeteria={cafeteria} />}
        </div>
        {cafeteria && (
          <Button appearance="subtle" size="small" onClick={() => onViewDetails(cafeteria.id)}>
            View details
          </Button>
        )}
      </div>

      {status?.closureNotice && (
        <div className={styles.closureBanner}>
          <Info24Regular />
          <Body1>{status.closureNotice}</Body1>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.control}>
          <Label htmlFor="menu-view-cafeteria">Cafeteria</Label>
          <Dropdown
            id="menu-view-cafeteria"
            value={cafeteria?.title ?? ""}
            selectedOptions={[cafeteriaId]}
            onOptionSelect={(_, data) => data.optionValue && onCafeteriaChange(data.optionValue)}
          >
            {(cafeteriasQuery.data ?? []).map((c) => (
              <Option key={c.id} value={c.id}>
                {c.title}
              </Option>
            ))}
          </Dropdown>
        </div>
        <div className={styles.control}>
          <Label htmlFor="menu-view-date">Date</Label>
          <DatePicker
            id="menu-view-date"
            value={isoDateToDate(effectiveDate)}
            onSelectDate={(selectedDate) => onDateChange(dateToIsoDate(selectedDate))}
          />
        </div>
      </div>

      {(menuQuery.loading || cafeteriasQuery.loading) && (
        <Skeleton className={styles.grid} aria-label="Loading menu">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} showImage footerItems={2} />
          ))}
        </Skeleton>
      )}
      {(menuQuery.error || cafeteriasQuery.error) && (
        <ErrorState message="We couldn't load this menu right now." />
      )}
      {!menuQuery.loading && !menuQuery.error && menuQuery.data && (
        <Fade visible appear key={`${cafeteriaId}-${effectiveDate ?? ""}`}>
          <div>
            {!menuQuery.data.published || menuQuery.data.items.length === 0 ? (
              <NotPublishedEmptyState
                cafeteriaTitle={cafeteria?.title ?? "This cafeteria"}
                date={effectiveDate ?? "the selected day"}
              />
            ) : (
              <>
                <MenuBoard items={menuQuery.data.items} />
                <div className={styles.disclaimer}>
                  <AllergyDisclaimer />
                </div>
              </>
            )}
          </div>
        </Fade>
      )}
    </div>
  )
}
