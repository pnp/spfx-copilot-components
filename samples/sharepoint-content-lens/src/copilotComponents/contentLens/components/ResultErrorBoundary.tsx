import * as React from 'react';

/**
 * Shows the message when the app throws while it renders. It covers render errors only:
 * when the host blocks the iframe, this code does not run.
 */
export class ResultErrorBoundary extends React.Component<{ message: string; children?: React.ReactNode }, { failed: boolean }> {
  public state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public render(): React.ReactNode {
    return this.state.failed ? <div role="alert" style={{ padding: 16 }}>{this.props.message}</div> : this.props.children;
  }
}
