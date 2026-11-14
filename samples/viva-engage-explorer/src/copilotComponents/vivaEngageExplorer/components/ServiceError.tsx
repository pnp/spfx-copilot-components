import * as React from 'react';
import { Button, MessageBar, MessageBarBody } from '@fluentui/react-components';
import type { CommunityServiceError } from '../services/GraphVivaEngageService';

export function ServiceError(props: {
  error: CommunityServiceError;
  strings: IVivaEngageExplorerCopilotComponentStrings;
  onRetry: () => void;
}): React.ReactElement {
  const { error, strings, onRetry } = props;
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!error.retryAt) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= (error.retryAt ?? 0)) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [error]);
  const messages: Record<CommunityServiceError['kind'], string> = {
    authentication: strings.AuthenticationError,
    permission: strings.PermissionError,
    throttled: strings.ThrottledError,
    network: strings.NetworkError,
    unavailable: strings.UnavailableError,
    notFound: strings.NotFoundError,
    invalidResponse: strings.InvalidResponseError
  };
  const waiting = !!error.retryAt && error.retryAt > now;
  return (
    <MessageBar intent="error">
      <MessageBarBody>
        {messages[error.kind]}{' '}
        {waiting && error.retryAt !== undefined &&
          strings.RetryAfter.replace('{0}', new Date(error.retryAt).toLocaleTimeString())}{' '}
        <Button size="small" onClick={onRetry} disabled={waiting}>{strings.Retry}</Button>
      </MessageBarBody>
    </MessageBar>
  );
}
