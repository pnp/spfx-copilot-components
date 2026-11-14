import * as React from "react"
import { makeStyles, tokens } from "@fluentui/react-components"

export type IconChipHue = "brand" | "marigold" | "berry" | "lightGreen" | "red"

const useStyles = makeStyles({
  root: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: tokens.borderRadiusCircular,
    paddingLeft: "4px",
    paddingRight: "4px",
    boxSizing: "border-box",
  },
  brand: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  marigold: {
    backgroundColor: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  berry: {
    backgroundColor: tokens.colorPaletteBerryBackground2,
    color: tokens.colorPaletteBerryForeground2,
  },
  lightGreen: {
    backgroundColor: tokens.colorPaletteLightGreenBackground2,
    color: tokens.colorPaletteLightGreenForeground2,
  },
  red: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
})

export interface IIconChipProps {
  hue?: IconChipHue
  size?: number
  children: React.ReactNode
}

export default function IconChip(props: IIconChipProps): React.ReactElement {
  const styles = useStyles()
  const size = props.size ?? 28

  return (
    <span
      className={`${styles.root} ${styles[props.hue ?? "brand"]}`}
      style={{ minWidth: size, height: size }}
    >
      {props.children}
    </span>
  )
}
