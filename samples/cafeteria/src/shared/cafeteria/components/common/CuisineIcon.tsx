import * as React from "react"
import { GiChiliPepper, GiForkKnifeSpoon, GiChopsticks, GiBarbecue } from "react-icons/gi"

import type { CuisineTag } from "../../models"

const CUISINE_ICONS: Record<CuisineTag, React.ComponentType<{ size?: number }>> = {
  Indian: GiChiliPepper,
  Continental: GiForkKnifeSpoon,
  Asian: GiChopsticks,
  Grill: GiBarbecue,
}

export interface ICuisineIconProps {
  tag: CuisineTag
  size?: number
}

export default function CuisineIcon(props: ICuisineIconProps): React.ReactElement {
  const Icon = CUISINE_ICONS[props.tag]
  return <Icon size={props.size ?? 16} />
}
