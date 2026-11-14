import * as React from "react"
import { MessageBar, MessageBarBody, MessageBarTitle, Button } from "@fluentui/react-components"
import { ErrorCircle24Regular } from "@fluentui/react-icons"

export interface IErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorState(props: IErrorStateProps): React.ReactElement {
  return (
    <MessageBar intent="error" icon={<ErrorCircle24Regular />}>
      <MessageBarBody>
        <MessageBarTitle>{props.title ?? "Something went wrong"}</MessageBarTitle>
        {props.message}
        {props.onRetry && (
          <>
            {" "}
            <Button size="small" appearance="transparent" onClick={props.onRetry}>
              Try again
            </Button>
          </>
        )}
      </MessageBarBody>
    </MessageBar>
  )
}
