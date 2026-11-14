import * as React from "react"
import { Badge } from "@fluentui/react-components"

import type { DietaryTag } from "../../models"
import { DIETARY_TAG_LABEL } from "../../models"
import DietaryIcon from "../common/DietaryIcon"

export interface IDietaryBadgeProps {
  tag: DietaryTag
}

export default function DietaryBadge(props: IDietaryBadgeProps): React.ReactElement {
  return (
    <Badge appearance="outline" icon={<DietaryIcon tag={props.tag} size={14} />}>
      {DIETARY_TAG_LABEL[props.tag]}
    </Badge>
  )
}
