import * as React from "react"
import {
  Input,
  Dropdown,
  Option,
  Label,
  Slider,
  Caption1,
  makeStyles,
  tokens,
} from "@fluentui/react-components"

import type { ISearchMenuItemsFilter } from "../../models"
import { DIETARY_TAGS, DIETARY_TAG_LABEL, type DietaryTag } from "../../models"
import type { ICafeteria } from "../../models"

const MAX_PRICE = 200
const PRICE_STEP = 10

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    minWidth: "220px",
  },
  control: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  priceLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
})

export interface IFilterRailProps {
  filter: ISearchMenuItemsFilter
  cafeterias: ICafeteria[]
  onChange: (filter: ISearchMenuItemsFilter) => void
}

export default function FilterRail(props: IFilterRailProps): React.ReactElement {
  const styles = useStyles()
  const { filter, cafeterias, onChange } = props

  const toggleDietaryTag = (tag: DietaryTag): void => {
    const current = filter.dietaryTags ?? []
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    onChange({ ...filter, dietaryTags: next.length > 0 ? next : undefined })
  }

  return (
    <div className={styles.root}>
      <div className={styles.control}>
        <Label htmlFor="search-query">Dish name</Label>
        <Input
          id="search-query"
          placeholder='e.g. "paneer"'
          value={filter.query ?? ""}
          onChange={(_, data) => onChange({ ...filter, query: data.value || undefined })}
        />
      </div>

      <div className={styles.control}>
        <div className={styles.priceLabelRow}>
          <Label htmlFor="search-max-price">Max price</Label>
          <Caption1>{filter.maxPrice !== undefined ? `₹${filter.maxPrice}` : "Any"}</Caption1>
        </div>
        <Slider
          id="search-max-price"
          min={0}
          max={MAX_PRICE}
          step={PRICE_STEP}
          value={filter.maxPrice ?? MAX_PRICE}
          onChange={(_, data) =>
            onChange({ ...filter, maxPrice: data.value >= MAX_PRICE ? undefined : data.value })
          }
        />
      </div>

      <div className={styles.control}>
        <Label htmlFor="search-cafeteria">Cafeteria</Label>
        <Dropdown
          id="search-cafeteria"
          placeholder="All cafeterias"
          value={cafeterias.find((c) => c.id === filter.cafeteriaId)?.title ?? ""}
          selectedOptions={filter.cafeteriaId ? [filter.cafeteriaId] : []}
          onOptionSelect={(_, data) =>
            onChange({ ...filter, cafeteriaId: data.optionValue || undefined })
          }
        >
          <Option value="">All cafeterias</Option>
          {cafeterias.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.title}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.control}>
        <Label htmlFor="search-dietary-needs">Dietary needs</Label>
        <Dropdown
          id="search-dietary-needs"
          multiselect
          placeholder="Any"
          selectedOptions={filter.dietaryTags ?? []}
          value={(filter.dietaryTags ?? []).map((tag) => DIETARY_TAG_LABEL[tag]).join(", ")}
          onOptionSelect={(_, data) => {
            if (data.optionValue) toggleDietaryTag(data.optionValue as DietaryTag)
          }}
        >
          {DIETARY_TAGS.map((tag) => (
            <Option key={tag} value={tag}>
              {DIETARY_TAG_LABEL[tag]}
            </Option>
          ))}
        </Dropdown>
      </div>
    </div>
  )
}
