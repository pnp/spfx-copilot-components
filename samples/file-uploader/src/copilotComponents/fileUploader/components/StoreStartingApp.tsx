import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IHostProps } from './FileUploaderApp';
import { AppProviders } from './AppProviders';
import { useSharedStyles } from './blocks/useSharedStyles';
import { LIBRARY_NAME } from '../models/config';

export interface IStoreStartingProps {
  host: IHostProps;
  targetDocument?: Document;
  remountKey?: number;
}

// A static skeleton in the shape of the file picker it gives way to. No shimmer:
// nothing the user started is being generated (R16), and a still block needs no
// reduced-motion branch (R15).
const useStyles = makeStyles({
  pickerSkeleton: {
    height: '36px',
    width: '132px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('8px')
  },
  lineSkeleton: {
    height: '12px',
    width: '40%',
    marginTop: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('4px')
  }
});

const StoreStarting: React.FC<IStoreStartingProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  return (
    <section
      data-layout="store-starting"
      data-theme={props.host.theme}
      data-display-mode={props.host.displayMode}
      className={s.root}
    >
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Document Intake</h1>
          <div className={s.subtitle}>{LIBRARY_NAME} library · connecting</div>
        </div>
      </header>
      <div className={s.body} aria-busy="true">
        <div className={styles.pickerSkeleton} aria-hidden="true" />
        <div className={styles.lineSkeleton} aria-hidden="true" />
        <span className={s.visuallyHidden}>Connecting to the {LIBRARY_NAME} library</span>
      </div>
    </section>
  );
};

/**
 * What the component shows when the host renders before `onInit()` has
 * resolved the store (todo.md 8.8 L2). Until then nobody knows whether this
 * tenant files for real or runs on sample data, so this view needs no store,
 * offers no way to choose a file, and makes no claim either way. Like
 * `StoreUnavailableApp`, it is its own root because every filing and recent view
 * reads document kinds from a store that does not exist yet.
 */
export const StoreStartingApp: React.FC<IStoreStartingProps> = props => (
  <AppProviders theme={props.host.theme} targetDocument={props.targetDocument} remountKey={props.remountKey}>
    <StoreStarting {...props} />
  </AppProviders>
);
