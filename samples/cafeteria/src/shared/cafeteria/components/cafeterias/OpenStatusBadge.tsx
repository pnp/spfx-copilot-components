import * as React from "react"
import { Badge, Tooltip } from "@fluentui/react-components"

import type { ICafeteria } from "../../models"
import { getOpenStatus } from "../../services"

export interface IOpenStatusBadgeProps {
  cafeteria: ICafeteria
}

export default function OpenStatusBadge(props: IOpenStatusBadgeProps): React.ReactElement {
  const status = getOpenStatus(props.cafeteria)

  if (status.closureNotice) {
    return (
      <Tooltip content={status.closureNotice} relationship="description">
        <Badge appearance="tint" color="danger">
          Temporarily closed
        </Badge>
      </Tooltip>
    )
  }

  if (status.isOpen) {
    return (
      <Badge appearance="tint" color="success">
        Open now{status.todayHours ? ` · until ${status.todayHours[1]}` : ""}
      </Badge>
    )
  }

  return (
    <Badge appearance="tint" color="informative">
      Closed{status.todayHours ? ` · today's hours ${status.todayHours[0]}–${status.todayHours[1]}` : ""}
    </Badge>
  )
}
