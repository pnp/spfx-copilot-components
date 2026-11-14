import * as React from "react";

interface IErrorBoundaryProps {
  children?: React.ReactNode;
  recovery: number;
  onRetry?: () => void;
}

interface IErrorBoundaryState {
  errorMessage?: string;
  recovery: number;
}

const fallbackStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "640px",
  padding: "12px 16px",
  fontFamily: "Segoe UI, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  color: "#323130",
  backgroundColor: "#fde7e9",
  border: "1px solid #d13438"
};

const retryStyle: React.CSSProperties = {
  marginTop: "8px",
  font: "inherit",
  color: "#a4262c",
  background: "transparent",
  border: "none",
  padding: 0,
  textDecoration: "underline",
  cursor: "pointer"
};

function boundaryMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "The form couldn't be displayed.";
}

export class CopilotSharePointFormErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { recovery: props.recovery };
  }

  public static getDerivedStateFromError(error: unknown): Partial<IErrorBoundaryState> {
    return { errorMessage: boundaryMessage(error) };
  }

  public static getDerivedStateFromProps(props: IErrorBoundaryProps, state: IErrorBoundaryState): Partial<IErrorBoundaryState> {
    if (props.recovery !== state.recovery) {
      return { recovery: props.recovery, errorMessage: undefined };
    }
    return {};
  }

  public componentDidCatch(error: unknown): void {
    console.error("[CopilotSharePointForm] Render failed.", error);
  }

  public render(): React.ReactNode {
    if (!this.state.errorMessage) {
      return this.props.children;
    }
    return (
      <section role="alert" aria-label="Submit a document" style={fallbackStyle}>
        <p style={{ margin: 0 }}>
          {`The document form hit a problem and could not be displayed. ${this.state.errorMessage}`}
        </p>
        <button type="button" style={retryStyle} onClick={this._retry}>Try again</button>
      </section>
    );
  }

  private readonly _retry = (): void => {
    this.setState({ errorMessage: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };
}
