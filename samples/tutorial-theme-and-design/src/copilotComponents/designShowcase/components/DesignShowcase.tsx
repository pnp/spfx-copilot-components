import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

import { resolveHostLayout, type IHostLayout } from '../hostLayout';
import type { ProjectStatus } from '../mockData';
import { FullscreenView } from './FullscreenView';
import type { IDesignShowcaseProps, IShowcaseViewProps } from './IDesignShowcaseProps';
import { InlineView } from './InlineView';
import { ThemeProvider } from './ThemeProvider';

const useStyles = makeStyles({
  root: {
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    color: tokens.colorNeutralForeground1
  }
});

/**
 * Measures the width of an element. The host reports the container
 * size in `hostContext.containerDimensions`, but every field there is
 * optional, so the component also measures itself.
 */
function useMeasuredWidth(): [React.RefObject<HTMLDivElement>, number | undefined] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const element: HTMLDivElement | null = ref.current;
    const view: (Window & typeof globalThis) | null | undefined =
      element?.ownerDocument.defaultView;

    if (!element || !view || typeof view.ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer: ResizeObserver = new view.ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        const next: number | undefined = entries[0]?.contentRect.width;
        if (next !== undefined && next > 0) {
          setWidth(Math.round(next));
        }
      }
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, width];
}

/**
 * Rendered inside the ThemeProvider, so its `makeStyles` rules go to
 * the component document.
 */
function ShowcaseBody(props: IDesignShowcaseProps): React.ReactElement {
  const { hostContext, onRequestDisplayMode, strings } = props;
  const styles = useStyles();

  // The selection lives above both views, so it stays when the host
  // changes the display mode.
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const [rootRef, measuredWidth] = useMeasuredWidth();

  // Read the host context on every render. Do not copy it into state.
  const layout: IHostLayout = resolveHostLayout(hostContext, measuredWidth);

  const statusLabels: Record<ProjectStatus, string> = React.useMemo(
    () => ({
      onTrack: strings.StatusOnTrack,
      atRisk: strings.StatusAtRisk,
      blocked: strings.StatusBlocked,
      done: strings.StatusDone
    }),
    [strings]
  );

  const handleExpand = React.useCallback((): void => {
    // The host decides. The view changes when the host reports the
    // new display mode, not when the request is sent.
    onRequestDisplayMode('fullscreen').catch((error: unknown) => {
      console.error('[DesignShowcase] Fullscreen request failed', error);
    });
  }, [onRequestDisplayMode]);

  const viewProps: IShowcaseViewProps = {
    projects: props.projects,
    selectedId,
    onSelect: setSelectedId,
    layout,
    locale: props.locale,
    strings,
    statusLabels
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-view={layout.isFullscreen ? 'fullscreen' : 'inline'}
    >
      {layout.isFullscreen ? (
        <FullscreenView {...viewProps} />
      ) : (
        <InlineView {...viewProps} onExpand={handleExpand} />
      )}
    </div>
  );
}

/**
 * Root of the React tree. It renders the provider and nothing else,
 * so that no `makeStyles` hook runs outside the provider.
 */
export default function DesignShowcase(props: IDesignShowcaseProps): React.ReactElement {
  return (
    <ThemeProvider theme={props.hostContext.theme} targetDocument={props.targetDocument}>
      <ShowcaseBody {...props} />
    </ThemeProvider>
  );
}
