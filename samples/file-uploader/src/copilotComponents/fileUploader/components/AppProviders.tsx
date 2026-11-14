import * as React from 'react';
import {
  FluentProvider,
  RendererProvider,
  createDOMRenderer,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';
import { RenderErrorBoundary } from './RenderErrorBoundary';

export interface IAppProvidersProps {
  theme: 'light' | 'dark';
  /** The document the component renders into — the Workbench may iframe us. */
  targetDocument?: Document;
  /** Remount key: flips 0 -> 1 after first commit, then stays stable. */
  remountKey?: number;
  children?: React.ReactNode;
}

/**
 * The one FluentProvider and Griffel renderer for whatever the component shows
 * — the working app or the store-unavailable fallback (AGENTS.md §4 Theming).
 * Griffel renders into the owner document, because the Workbench may iframe the
 * component.
 *
 * It also holds the one `RenderErrorBoundary` (todo.md 8.5 E1). Inside the
 * providers, so the fallback is themed; here rather than in each root, so both
 * share it.
 */
export const AppProviders: React.FC<IAppProvidersProps> = props => {
  const doc: Document | undefined = props.targetDocument;
  const renderer = React.useMemo(() => createDOMRenderer(doc), [doc]);
  return (
    <RendererProvider renderer={renderer} targetDocument={doc}>
      <FluentProvider
        theme={props.theme === 'dark' ? webDarkTheme : webLightTheme}
        targetDocument={doc}
        key={props.remountKey}
      >
        <RenderErrorBoundary theme={props.theme}>{props.children}</RenderErrorBoundary>
      </FluentProvider>
    </RendererProvider>
  );
};
