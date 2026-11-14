import * as React from "react"
import { GiBroccoli, GiSprout, GiPeaceDove, GiWheat, GiPeanut, GiRawEgg } from "react-icons/gi"
import { FaMoon } from "react-icons/fa"

import type { DietaryTag } from "../../models"

const DIETARY_ICONS: Record<DietaryTag, React.ComponentType<{ size?: number }>> = {
  Vegetarian: GiBroccoli,
  Vegan: GiSprout,
  Halal: FaMoon,
  Jain: GiPeaceDove,
  GlutenFree: GiWheat,
  NutFree: GiPeanut,
  "Contains Egg": GiRawEgg,
}

export interface IDietaryIconProps {
  tag: DietaryTag
  size?: number
}

export default function DietaryIcon(props: IDietaryIconProps): React.ReactElement {
  const Icon = DIETARY_ICONS[props.tag]
  return <Icon size={props.size ?? 16} />
}
