import * as React from "react"
import { Button, Card, CardHeader, makeStyles, tokens } from "@fluentui/react-components"
import { ArrowExpand24Regular } from "@fluentui/react-icons"

import type { ICafeteriaNavigation } from "../../hooks/useCafeteriaNavigation"
import type { ICafeteriaStrings } from "../ICafeteriaProps"
import CafeteriaContent from "./CafeteriaContent"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  scrollArea: {
    maxHeight: "420px",
    overflowY: "auto",
  },
})

export interface IInlineShellProps {
  siteTitle: string
  userDisplayName: string
  strings: ICafeteriaStrings
  nav: ICafeteriaNavigation
  onExpand: () => void
}

/**
 * Compact single-card layout used when the host renders this component
 * `inline` in the chat thread. The full sidebar-nav dashboard is reserved for
 * `fullscreen` (see `DashboardShell`) — inline just shows the current view in
 * a scrollable card with a button to pop out to the full experience.
 */
export default function InlineShell(props: IInlineShellProps): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Card>
        <CardHeader
          action={
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowExpand24Regular />}
              onClick={props.onExpand}
            >
              {props.strings.ExpandButtonLabel}
            </Button>
          }
        />
        <div className={styles.scrollArea}>
          <CafeteriaContent nav={props.nav} />
        </div>
      </Card>
    </div>
  )
}
