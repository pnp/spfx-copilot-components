import {
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { McpAppProvider, useMcpApp } from "../widgets/shared/McpAppProvider";
import type { HostBootstrap } from "../widgets/shared/bootstrap";
import {
  fullscreenHeight,
  inlineContentHeight,
  inlineHeightBudget,
  measureFrameInset,
} from "../widgets/shared/fullscreen";
import { agentMapDarkTheme, agentMapLightTheme } from "../widgets/shared/theme";
import "./hosted-app.css";

const useStyles = makeStyles({
  opening: {
    boxSizing: "border-box",
    minWidth: 0,
    display: "grid",
    placeItems: "center",
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
  },
  /** Inline, the same frame as the map canvas, so the map replaces it without a jump. */
  openingInline: {
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

function ThemedApp({ children, targetDocument }: { children: ReactNode; targetDocument: Document }): ReactElement {
  const { theme } = useMcpApp();
  return (
    <FluentProvider
      theme={theme === "dark" ? agentMapDarkTheme : agentMapLightTheme}
      targetDocument={targetDocument}
    >
      {children}
    </FluentProvider>
  );
}

/**
 * The loading state until the open tool returns. Inline, it has the height of
 * the map and reports its size in the same way as the view.
 */
function OpeningPlaceholder({ label }: { label: string }): ReactElement {
  const styles = useStyles();
  const { app, host } = useMcpApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const [frameInset] = useState(measureFrameInset);
  const fullscreen = host?.displayMode === "fullscreen";
  const inlineBudget = inlineHeightBudget(host?.containerDimensions);
  const height = fullscreen
    ? fullscreenHeight(host?.containerDimensions, window.screen.availHeight)
    : `${inlineContentHeight(host?.containerDimensions, frameInset.height)}px`;

  useEffect(() => {
    const element = rootRef.current;
    if (!app || fullscreen || !element) return;
    let lastWidth = 0;
    let lastHeight = 0;
    const reportSize = (): void => {
      const bounds = element.getBoundingClientRect();
      const width = Math.ceil(bounds.width);
      const reportedHeight = Math.min(inlineBudget, Math.ceil(bounds.height + frameInset.height));
      if (width <= 0 || bounds.height <= 0 || (width === lastWidth && reportedHeight === lastHeight)) return;
      lastWidth = width;
      lastHeight = reportedHeight;
      app.sendSizeChanged({ width, height: reportedHeight })
        .catch(error => console.error("Unable to report the component size.", error));
    };
    const observer = new ResizeObserver(reportSize);
    observer.observe(element);
    reportSize();
    return () => observer.disconnect();
  }, [app, frameInset.height, fullscreen, inlineBudget]);

  return (
    <div
      ref={rootRef}
      className={fullscreen ? styles.opening : mergeClasses(styles.opening, styles.openingInline)}
      style={{ height }}
    >
      <Spinner label={label} />
    </div>
  );
}

/**
 * Shows the view when the open tool returns. Before that, the view has no tool
 * result and would show its selection state, so the host shows a loading state.
 */
function OpenedApp({ bootstrap, App, loadingLabel }: {
  bootstrap: HostBootstrap;
  App: ComponentType;
  loadingLabel: string;
}): ReactElement {
  const opened = useSyncExternalStore(bootstrap.subscribe, () => bootstrap.getSnapshot().opened);
  return opened ? <App /> : <OpeningPlaceholder label={loadingLabel} />;
}

export interface IHostedAppOptions {
  element: HTMLElement;
  bootstrap: HostBootstrap;
  /** Prefix for React and Fluent IDs, so that two components on one page do not share IDs. */
  identifierPrefix: string;
  App: ComponentType;
  /** The label of the loading state until the open tool returns. */
  loadingLabel: string;
}

/** Mounts the ported view in the component element. Returns the function that removes it. */
export function mountHostedApp({ element, bootstrap, identifierPrefix, App, loadingLabel }: IHostedAppOptions): () => void {
  // The frame exists before the first render, so the view can measure its padding.
  const frame = element.ownerDocument.createElement("div");
  frame.setAttribute("data-mcp-frame", bootstrap.view ?? "app");
  element.appendChild(frame);
  const root = createRoot(frame, { identifierPrefix });
  root.render(
    <IdPrefixProvider value={identifierPrefix}>
      <McpAppProvider view={bootstrap.view} bootstrap={bootstrap}>
        <ThemedApp targetDocument={element.ownerDocument}>
          <OpenedApp bootstrap={bootstrap} App={App} loadingLabel={loadingLabel} />
        </ThemedApp>
      </McpAppProvider>
    </IdPrefixProvider>,
  );
  return () => {
    root.unmount();
    frame.remove();
  };
}
