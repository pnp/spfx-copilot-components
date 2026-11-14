import * as React from "react"
import { TabList, Tab, makeStyles, tokens } from "@fluentui/react-components"
import { Building24Regular, CalendarClock24Regular, Search24Regular } from "@fluentui/react-icons"

import type { NavSection } from "../../hooks/useCafeteriaNavigation"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    minWidth: "200px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalS,
  },
  tab: {
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXXS,
    '&[aria-selected="true"]': {
      backgroundColor: tokens.colorBrandBackground2,
      color: tokens.colorBrandForeground2,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
})

export interface ISidebarNavProps {
  activeSection: NavSection
  onSelectCafeterias: () => void
  onSelectMenu: () => void
  onSelectSearch: () => void
}

export default function SidebarNav(props: ISidebarNavProps): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <TabList
        vertical
        selectedValue={props.activeSection}
        onTabSelect={(_, data) => {
          if (data.value === "cafeterias") props.onSelectCafeterias()
          if (data.value === "menu") props.onSelectMenu()
          if (data.value === "search") props.onSelectSearch()
        }}
      >
        <Tab className={styles.tab} value="cafeterias" icon={<Building24Regular />}>
          Cafeterias
        </Tab>
        <Tab className={styles.tab} value="menu" icon={<CalendarClock24Regular />}>
          Today&apos;s Menu
        </Tab>
        <Tab className={styles.tab} value="search" icon={<Search24Regular />}>
          Search &amp; Compare
        </Tab>
      </TabList>
    </div>
  )
}
