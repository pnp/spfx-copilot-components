import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { Banner } from './blocks/Banner';
import { useSharedStyles } from './blocks/useSharedStyles';
import { LIBRARY_NAME } from '../models/config';

/**
 * The copy, exported so the test asserts the same string the user reads. The
 * detail claims nothing about a save in flight (AGENTS.md R25) — the boundary
 * cannot know whether one had reached the library, so it sends the user to look.
 */
export const RENDER_ERROR_TITLE: string = "Document Intake hit a problem and couldn't show this screen.";
export const RENDER_ERROR_DETAIL: string =
  'If you were saving, check the ' + LIBRARY_NAME + ' library before you save again.';

/** Longest error message the details line shows; anything longer is cut and ellipsised. */
export const MAX_DETAILS_LENGTH: number = 300;

/** Prefix on the console log, so it is searchable in the host's F12 console. */
export const RENDER_ERROR_LOG_PREFIX: string = '[Document Intake] render error';

/**
 * What the boundary keeps from the error it caught. Bounded, because this ends
 * up on screen and an unexpected error can carry a whole response body.
 */
export function describeRenderError(error: unknown): string {
  const raw: string = (error instanceof Error ? error.message : String(error)).trim();
  return raw.length > MAX_DETAILS_LENGTH ? raw.slice(0, MAX_DETAILS_LENGTH) + '…' : raw;
}

const useStyles = makeStyles({
  details: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    overflowWrap: 'anywhere'
  }
});

interface IRenderErrorFallbackProps {
  theme: 'light' | 'dark';
  /** The caught error's message, already bounded; empty when there is nothing to show. */
  details: string;
  onRetry: () => void;
}

const RenderErrorFallback: React.FC<IRenderErrorFallbackProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  return (
    <section data-layout="render-error" data-theme={props.theme} className={s.root}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Document Intake</h1>
        </div>
      </header>
      <div className={s.body}>
        <Banner tone="error" title={RENDER_ERROR_TITLE} detail={RENDER_ERROR_DETAIL} />
        {props.details ? (
          // Rendered as text, never as HTML — the message is whatever threw, and
          // some of it comes back from SharePoint. The banner stays plain
          // language; this line is for whoever is debugging.
          <div className={styles.details} data-role="render-error-details">
            Details: {props.details}
          </div>
        ) : undefined}
        <div className={s.actions}>
          <Button
            appearance="primary"
            className={s.actionButton}
            data-action="retry-render"
            onClick={props.onRetry}
          >
            Try again
          </Button>
        </div>
      </div>
    </section>
  );
};

export interface IRenderErrorBoundaryProps {
  /** Host theme, so the fallback carries the same `data-theme` as every root. */
  theme: 'light' | 'dark';
  children?: React.ReactNode;
}

interface IRenderErrorBoundaryState {
  failed: boolean;
  /** The caught message, bounded by `describeRenderError`. Cleared by "Try again". */
  details: string;
  /** Bumped by "Try again"; keys the subtree, so a retry remounts rather than re-renders. */
  attempt: number;
}

/**
 * Catches an error thrown *after* the first render (todo.md 8.5 E1). Under
 * React 17 an uncaught error during render unmounts the whole tree, so without
 * this the component simply vanishes from the conversation — which is what a
 * PnP sample did in the dev tenant on 2026-09-21. `StoreUnavailableApp` covers
 * a failed *start*; nothing covered this, and the worst place for it is
 * mid-filing.
 *
 * It lives inside `AppProviders`, so both roots share it and the fallback is
 * themed inside the one FluentProvider.
 *
 * **It keeps what it caught** (8.5 E1 amendment). This fallback is generic by
 * nature — every anticipated failure already has a specific message elsewhere
 * (save errors in the filing banner, start failures on `StoreUnavailableApp`
 * naming the web it asked), so what reaches here is by definition the
 * unexpected. Discarding it would mean an error in the host arrives with
 * nothing to diagnose it by. So the message goes on screen, and the error plus
 * the component stack go to the console.
 *
 * **What it does not catch:** errors thrown in event handlers or in promises.
 * A React error boundary sees render and lifecycle only. Store failures on
 * those paths already reach the error banner through the filing and recent
 * controllers.
 */
export class RenderErrorBoundary extends React.Component<IRenderErrorBoundaryProps, IRenderErrorBoundaryState> {
  public constructor(props: IRenderErrorBoundaryProps) {
    super(props);
    this.state = { failed: false, details: '', attempt: 0 };
  }

  public static getDerivedStateFromError(error: unknown): Partial<IRenderErrorBoundaryState> {
    return { failed: true, details: describeRenderError(error) };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // React already logs the bare error; this adds the component stack — which
    // component failed — and a prefix that can be searched for in F12.
    console.error(RENDER_ERROR_LOG_PREFIX, error, info.componentStack);
  }

  public render(): React.ReactNode {
    if (this.state.failed) {
      return <RenderErrorFallback theme={this.props.theme} details={this.state.details} onRetry={this._retry} />;
    }
    // Keyed so "Try again" unmounts and remounts the subtree from the current
    // host state, rather than handing React the same instances that just threw.
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }

  private readonly _retry: () => void = (): void => {
    this.setState((prev: IRenderErrorBoundaryState) => ({
      failed: false,
      details: '',
      attempt: prev.attempt + 1
    }));
  };
}
