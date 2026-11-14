import * as React from "react"
import { Title3, Body1, makeStyles, tokens } from "@fluentui/react-components"
import { SearchInfo24Regular } from "@fluentui/react-icons"

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

export default function ZeroResultsState(): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <IconChip hue="brand" size={48}>
        <SearchInfo24Regular fontSize={24} />
      </IconChip>
      <Title3>No dishes match these filters</Title3>
      <Body1>Try loosening a dietary tag, raising the price limit, or clearing the cafeteria filter.</Body1>
    </div>
  )
}
