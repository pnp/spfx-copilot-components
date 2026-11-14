import * as React from 'react';
import { MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

export interface ILoadStatusProps {
  state: LoadState<unknown>;
  loadingLabel: string;
}

/**
 * Renders the spinner or the error for a load state. Renders nothing
 * when the data is ready; the caller renders the data.
 */
export function LoadStatus(props: ILoadStatusProps): React.ReactElement {
  if (props.state.status === 'loading') {
    return <Spinner size="small" label={props.loadingLabel} />;
  }

  if (props.state.status === 'error') {
    return (
      <MessageBar intent="error">
        <MessageBarBody>{props.state.message}</MessageBarBody>
      </MessageBar>
    );
  }

  return <></>;
}
