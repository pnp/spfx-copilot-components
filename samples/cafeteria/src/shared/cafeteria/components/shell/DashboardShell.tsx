import * as React from "react"
import { makeStyles, tokens } from "@fluentui/react-components"

import type { ICafeteriaNavigation, NavSection } from "../../hooks/useCafeteriaNavigation"
import type { ICafeteriaStrings } from "../ICafeteriaProps"
import TopBar from "./TopBar"
import SidebarNav from "./SidebarNav"
import CafeteriaContent from "./CafeteriaContent"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "100vh",
    padding: tokens.spacingHorizontalL,
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  body: {
    display: "flex",
    flexGrow: 1,
    gap: tokens.spacingHorizontalL,
    minHeight: 0,
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    overflowY: "auto",
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow4,
  },
})

export interface IDashboardShellProps {
  siteTitle: string
  userDisplayName: string
  strings: ICafeteriaStrings
  nav: ICafeteriaNavigation
}

export default function DashboardShell(props: IDashboardShellProps): React.ReactElement {
  const styles = useStyles()
  const { nav } = props

  const goToSection = (section: NavSection): void => {
    if (section === "cafeterias") nav.goToCafeterias()
    if (section === "menu") nav.goToMenu(nav.view.name === "menu" ? nav.view.cafeteriaId : "")
    if (section === "search") nav.goToSearch()
  }

  return (
    <div className={styles.root}>
      <TopBar userDisplayName={props.userDisplayName} strings={props.strings} />
      <div className={styles.body}>
        <SidebarNav
          activeSection={nav.activeSection}
          onSelectCafeterias={() => goToSection("cafeterias")}
          onSelectMenu={() => goToSection("menu")}
          onSelectSearch={() => goToSection("search")}
        />
        <div className={styles.content}>
          <CafeteriaContent nav={nav} />
        </div>
      </div>
    </div>
  )
}
