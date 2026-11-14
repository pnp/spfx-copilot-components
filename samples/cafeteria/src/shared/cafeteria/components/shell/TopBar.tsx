import * as React from "react"
import { Title2, Caption1, Avatar, makeStyles, tokens } from "@fluentui/react-components"
import { Food24Filled } from "@fluentui/react-icons"

import type { ICafeteriaStrings } from "../ICafeteriaProps"
import IconChip from "../common/IconChip"

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    marginBottom: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
})

export interface ITopBarProps {
  userDisplayName: string
  strings: ICafeteriaStrings
}

export default function TopBar(props: ITopBarProps): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <IconChip hue="brand" size={40}>
          <Food24Filled />
        </IconChip>
        <div className={styles.text}>
          <Title2>
            {props.strings.GreetingPrefix} {props.userDisplayName}
          </Title2>
          <Caption1>{props.strings.AppTitle}</Caption1>
        </div>
      </div>
      <Avatar name={props.userDisplayName} size={40} color="colorful" />
    </div>
  )
}
