import * as React from "react"
import { Title3, Body1, makeStyles, tokens } from "@fluentui/react-components"
import { CalendarClock24Regular } from "@fluentui/react-icons"

import IconChip from "../common/IconChip"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
})

export interface INotPublishedEmptyStateProps {
  cafeteriaTitle: string
  date: string
}

export default function NotPublishedEmptyState(props: INotPublishedEmptyStateProps): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <IconChip hue="brand" size={48}>
        <CalendarClock24Regular fontSize={24} />
      </IconChip>
      <Title3>No menu published yet</Title3>
      <Body1>
        {props.cafeteriaTitle} hasn&apos;t published a menu for {props.date}. Check back later or
        try another day.
      </Body1>
    </div>
  )
}
