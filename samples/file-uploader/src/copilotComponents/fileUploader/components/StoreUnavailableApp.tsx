import * as React from 'react';
import { Button } from '@fluentui/react-components';
import type { IHostProps } from './FileUploaderApp';
import { AppProviders } from './AppProviders';
import { Banner } from './blocks/Banner';
import { useSharedStyles } from './blocks/useSharedStyles';
import { LIBRARY_NAME } from '../models/config';

export interface IStoreUnavailableProps {
  host: IHostProps;
  /** What went wrong, as the tenant setting or the library reported it. */
  message: string;
  /** True while a retry is in flight. */
  retrying: boolean;
  onRetry: () => void;
  targetDocument?: Document;
  remountKey?: number;
}

const StoreUnavailable: React.FC<IStoreUnavailableProps> = props => {
  const s = useSharedStyles();
  return (
    <section
      data-layout="store-unavailable"
      data-theme={props.host.theme}
      data-display-mode={props.host.displayMode}
      className={s.root}
    >
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Document Intake</h1>
          <div className={s.subtitle}>{LIBRARY_NAME} library · not connected</div>
        </div>
      </header>
      <div className={s.body}>
        <Banner
          tone="error"
          title={props.message}
          detail="Nothing was filed or changed. Try again, or ask whoever looks after the records library."
        />
        <div className={s.actions}>
          <Button
            appearance="primary"
            className={s.actionButton}
            data-action="retry-startup"
            disabled={props.retrying}
            onClick={props.onRetry}
          >
            {props.retrying ? 'Trying again…' : 'Try again'}
          </Button>
        </div>
      </div>
    </section>
  );
};

/**
 * What the component shows when the store could not be started — the tenant
 * setting or the records library could not be read (audit H1). Without it the
 * failure rendered nothing at all. It needs no store, which is why it is its own
 * root rather than a stage of the filing or recent views: every one of those
 * reads document kinds from a store that does not exist here.
 */
export const StoreUnavailableApp: React.FC<IStoreUnavailableProps> = props => (
  <AppProviders theme={props.host.theme} targetDocument={props.targetDocument} remountKey={props.remountKey}>
    <StoreUnavailable {...props} />
  </AppProviders>
);
