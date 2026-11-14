import * as React from 'react';
import { Button, tokens } from '@fluentui/react-components';
import { ArrowClockwise24Regular, ErrorCircle24Regular } from '@fluentui/react-icons';

interface IZavaErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
}

export interface IZavaErrorBoundaryState {
  hasError: boolean;
}

export class ZavaErrorBoundary extends React.Component<IZavaErrorBoundaryProps, IZavaErrorBoundaryState> {
  public state: IZavaErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): IZavaErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidUpdate(previousProps: IZavaErrorBoundaryProps): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  public render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" style={{ display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium }}>
        <ErrorCircle24Regular aria-hidden="true" />
        <strong>This Zava One experience could not be displayed.</strong>
        <span>No action was submitted. Retry this view or choose another experience.</span>
        <Button appearance="primary" icon={<ArrowClockwise24Regular />} onClick={() => this.setState({ hasError: false })}>Retry view</Button>
      </div>
    );
  }
}