import * as React from "react"
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
} from "@fluentui/react-components"

import type { ICafeteriaProps } from "./ICafeteriaProps"
import { useCafeteriaNavigation } from "../hooks/useCafeteriaNavigation"
import DashboardShell from "./shell/DashboardShell"
import InlineShell from "./shell/InlineShell"

export default function Cafeteria(props: ICafeteriaProps): React.ReactElement {
  const {
    initialView,
    initialListFilter,
    initialSearchFilter,
    userDisplayName,
    siteTitle,
    hostContext,
    onRequestDisplayMode,
    strings,
  } = props
  const theme = hostContext.theme === "dark" ? webDarkTheme : webLightTheme
  const nav = useCafeteriaNavigation(initialView, initialListFilter, initialSearchFilter)

  const handleExpand = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode("fullscreen")
  }, [onRequestDisplayMode])

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider theme={theme} targetDocument={props.targetDocument} style={{ minHeight: "100%" }}>
        {hostContext.displayMode === "fullscreen" ? (
          <DashboardShell siteTitle={siteTitle} userDisplayName={userDisplayName} strings={strings} nav={nav} />
        ) : (
          <InlineShell
            siteTitle={siteTitle}
            userDisplayName={userDisplayName}
            strings={strings}
            nav={nav}
            onExpand={handleExpand}
          />
        )}
      </FluentProvider>
    </IdPrefixProvider>
  )
}
