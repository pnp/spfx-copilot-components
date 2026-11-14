import * as React from "react"
import { Title3, makeStyles, tokens } from "@fluentui/react-components"
import { Fade, Stagger } from "@fluentui/react-motion-components-preview"

import type { IMenuItem } from "../../models"
import { MEAL_PERIOD_ORDER } from "../../models"
import MealPeriodIcon from "../common/MealPeriodIcon"
import MenuItemCard from "./MenuItemCard"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
})

export interface IMenuBoardProps {
  items: IMenuItem[]
}

export default function MenuBoard(props: IMenuBoardProps): React.ReactElement {
  const styles = useStyles()

  const sections = React.useMemo(() => {
    return MEAL_PERIOD_ORDER.map((period) => ({
      period,
      items: props.items
        .filter((item) => item.mealPeriod === period)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })).filter((section) => section.items.length > 0)
  }, [props.items])

  return (
    <div className={styles.root}>
      {sections.map((section) => (
        <section key={section.period}>
          <div className={styles.sectionHeader}>
            <MealPeriodIcon period={section.period} />
            <Title3>{section.period}</Title3>
          </div>
          <div className={styles.grid}>
            <Stagger visible itemDelay={40}>
              {section.items.map((item) => (
                <Fade key={item.id} appear>
                  <MenuItemCard item={item} />
                </Fade>
              ))}
            </Stagger>
          </div>
        </section>
      ))}
    </div>
  )
}
